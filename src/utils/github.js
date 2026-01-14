import chalk from 'chalk';
import { getSources, getToken } from './configManager.js';
import { debug } from './logger.js';
import { GITHUB_API, GITHUB_GRAPHQL, GITHUB_RAW, DEFAULT_BRANCH } from './constants.js';
import { DEFAULT_VERSION } from './version.js';

// Global flag to prevent duplicate rate limit logs
let hasLoggedRateLimit = false;

function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'antikit-cli'
  };
  const token = getToken() || process.env.ANTIKIT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

function logRateLimitError() {
  if (hasLoggedRateLimit) return;
  hasLoggedRateLimit = true;

  console.error(chalk.yellow('\n⚠️  GitHub API rate limit exceeded.'));
  console.error(
    chalk.dim('You are seeing this because unauthenticated requests are limited to 60/hr.')
  );
  console.error('\nTo fix this:');
  console.error(
    `1. Create a token: ${chalk.underline('https://github.com/settings/tokens/new?description=antikit-cli&scopes=repo')}`
  );
  console.error(`2. Run command:  ${chalk.cyan('antikit config set-token <your_token>')}`);
  console.error();
}

/**
 * Fetch skills using GraphQL (Optimized: 1 request per source)
 */
async function fetchSkillsViaGraphQL(source, token) {
  const query = `
    query ($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Tree {
                  file: entries(name: "SKILL.md") {
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  const branch = source.branch || DEFAULT_BRANCH;
  const expression = source.path ? `${branch}:${source.path}` : `${branch}:`;

  try {
    const response = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'antikit-cli'
      },
      body: JSON.stringify({
        query,
        variables: {
          owner: source.owner,
          repo: source.repo,
          expression
        }
      })
    });

    const { data, errors } = await response.json();

    if (errors || !data || !data.repository || !data.repository.object) {
      return null; // Fallback to REST
    }

    const entries = data.repository.object.entries || [];

    return entries
      .filter(item => item.type === 'tree' && !item.name.startsWith('.'))
      .map(item => {
        let description = null;
        let version = DEFAULT_VERSION;

        const skillFile = item.object.file && item.object.file[0];
        if (skillFile && skillFile.object && skillFile.object.text) {
          const content = skillFile.object.text;
          const match = content.match(/^---\n([\s\S]*?)\n---/);
          if (match) {
            const frontmatter = match[1];
            const descMatch = frontmatter.match(/description:\s*(.+)/);
            const verMatch = frontmatter.match(/version:\s*(.+)/);
            if (descMatch) description = descMatch[1].trim();
            if (verMatch) version = verMatch[1].trim();
          }
        }

        return {
          name: item.name,
          url: `https://github.com/${source.owner}/${source.repo}/tree/${branch}/${source.path ? source.path + '/' : ''}${item.name}`,
          path: source.path ? `${source.path}/${item.name}` : item.name,
          source: source.name,
          owner: source.owner,
          repo: source.repo,
          branch: source.branch || DEFAULT_BRANCH,
          basePath: source.path,
          description,
          version
        };
      });
  } catch (e) {
    debug('GraphQL fetch failed:', e.message);
    return null; // Fallback to REST
  }
}

/**
 * Fetch list of skills from a specific source
 */
async function fetchSkillsFromSource(source) {
  // Try GraphQL first if token exists
  const token = getToken() || process.env.ANTIKIT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    const gqlResult = await fetchSkillsViaGraphQL(source, token);
    if (gqlResult) return gqlResult;
  }

  // Fallback to REST API
  let url = `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents`;
  if (source.path) {
    url += `/${source.path}`;
  }

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    // Check for rate limit (with null-safe access)
    if (response.status === 403 && data.message?.includes('rate limit')) {
      logRateLimitError();
    }

    // Handle empty repository
    if (data.message === 'This repository is empty.') {
      return [];
    }
    // Don't throw, just return empty array for this source
    return [];
  }

  const contents = await response.json();

  if (!Array.isArray(contents)) {
    return [];
  }

  // Filter only directories (skills)
  const skills = contents
    .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
    .map(item => ({
      name: item.name,
      url: item.html_url,
      path: item.path,
      source: source.name,
      owner: source.owner,
      repo: source.repo,
      branch: source.branch || DEFAULT_BRANCH,
      basePath: source.path
    }));

  return skills;
}

/**
 * Fetch list of skills from all configured sources
 */
export async function fetchRemoteSkills(sourceName = null) {
  const sources = getSources();
  const targetSources = sourceName ? sources.filter(s => s.name === sourceName) : sources;

  if (targetSources.length === 0) {
    throw new Error(`Source "${sourceName}" not found.`);
  }

  // Reset rate limit flag before new fetch
  hasLoggedRateLimit = false;

  const results = await Promise.all(targetSources.map(source => fetchSkillsFromSource(source)));
  return results.flat();
}

/**
 * Fetch SKILL.md content for a specific skill
 */
export async function fetchSkillInfo(skillName, owner, repo, path = null, branch = null) {
  if (!owner || !repo) {
    const skills = await fetchRemoteSkills();
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return null;
    owner = skill.owner;
    repo = skill.repo;
    path = skill.basePath;
    branch = skill.branch;
  }

  let content = null;

  // Optimized: Use Raw URL if branch is known
  if (branch) {
    let rawUrl = `${GITHUB_RAW}/${owner}/${repo}/${branch}`;
    if (path) rawUrl += `/${path}`;
    rawUrl += `/${skillName}/SKILL.md`;

    try {
      const res = await fetch(rawUrl, {
        headers: getHeaders()
      });
      if (res.ok) {
        content = await res.text();
      }
    } catch (e) {
      debug('Raw URL fetch failed:', e.message);
    }
  }

  // Fallback: Use API
  if (!content) {
    let url = `${GITHUB_API}/repos/${owner}/${repo}/contents`;
    if (path) {
      url += `/${path}`;
    }
    url += `/${skillName}/SKILL.md`;

    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      // Check for rate limit also here
      if (response.status === 403) {
        // We can check body/headers but usually 403 here means rate limit if 404 is handled
        // But simpler just to ignore or log if we strictly check msg
        try {
          const d = await response.json();
          if (d.message?.includes('rate limit')) logRateLimitError();
        } catch (e) {
          debug('Rate limit check failed:', e.message);
        }
      }
      return null;
    }

    const data = await response.json();
    content = Buffer.from(data.content, 'base64').toString('utf-8');
  }

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const frontmatter = match[1];
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    const versionMatch = frontmatter.match(/version:\s*(.+)/);

    return {
      description: descMatch ? descMatch[1].trim() : null,
      version: versionMatch ? versionMatch[1].trim() : DEFAULT_VERSION,
      content // Return raw content
    };
  }

  return { description: null, version: DEFAULT_VERSION, content };
}

/**
 * Get clone URL for a skill
 */
export function getSkillCloneUrl(owner, repo) {
  return `https://github.com/${owner}/${repo}.git`;
}
