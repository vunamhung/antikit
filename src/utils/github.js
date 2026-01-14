import { getSources, getToken } from './configManager.js';

const GITHUB_API = 'https://api.github.com';

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

  const branch = source.branch || 'main'; // This logic might need verifying branch exists, but usually main/master
  // Correct expression for path. If path is provided, it's "branch:path", else just "branch:"
  const expression = source.path ? `${branch}:${source.path}` : `${branch}:`;

  try {
    const response = await fetch('https://api.github.com/graphql', {
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
        let version = '0.0.0';

        // Attempt to parse SKILL.md content if it exists
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
          basePath: source.path,
          description, // Pre-fetched!
          version // Pre-fetched!
        };
      });
  } catch (e) {
    return null; // Fallback
  }
}

/**
 * Fetch list of skills from a specific source
 */
async function fetchSkillsFromSource(source) {
  // Try GraphQL first if token exists (Much faster)
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
  // ... rest of function

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    // Check for rate limit
    if (response.status === 403 && data.message.includes('rate limit')) {
      console.error('\n⚠️  GitHub API rate limit exceeded.');
      console.error(
        'Please set GITHUB_TOKEN or ANTIKIT_GITHUB_TOKEN environment variable to increase limit.\n'
      );
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
    return []; // Handle case where path points to file, not dir
  }

  // Filter only directories (skills)
  const skills = contents
    .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
    .map(item => ({
      name: item.name,
      url: item.html_url,
      path: item.path, // Full path in repo (e.g. .claude/skills/foo)
      source: source.name,
      owner: source.owner,
      repo: source.repo,
      branch: source.branch || 'main',
      basePath: source.path // Keep track of base path
    }));

  return skills;
}

// ... (fetchRemoteSkills remains same)

/**
 * Fetch SKILL.md content for a specific skill
 */
export async function fetchSkillInfo(skillName, owner, repo, path = null, branch = null) {
  // If owner/repo not provided, search in all sources
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

  // Optimized: Use Raw URL if branch is known (avoids API rate limit)
  if (branch) {
    let rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
    if (path) rawUrl += `/${path}`;
    rawUrl += `/${skillName}/SKILL.md`;

    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
        content = await res.text();
      }
    } catch (e) {
      // Ignore fetch error, fallback to API
    }
  }

  // Fallback: Use API (Counts against rate limit, but works if branch is wrong/private repo needs Auth)
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
      return null;
    }

    const data = await response.json();
    content = Buffer.from(data.content, 'base64').toString('utf-8');
  }

  // Extract info from YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const frontmatter = match[1];
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    const versionMatch = frontmatter.match(/version:\s*(.+)/);

    return {
      description: descMatch ? descMatch[1].trim() : null,
      version: versionMatch ? versionMatch[1].trim() : '0.0.0'
    };
  }

  return { description: null, version: '0.0.0' };
}

/**
 * Get clone URL for a skill
 */
export function getSkillCloneUrl(owner, repo) {
  return `https://github.com/${owner}/${repo}.git`;
}
