import { getSources } from './configManager.js';

const GITHUB_API = 'https://api.github.com';

function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'antikit-cli'
  };
  const token = process.env.ANTIKIT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

/**
 * Fetch list of skills from a specific source
 */
async function fetchSkillsFromSource(source) {
  let url = `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents`;
  if (source.path) {
    url += `/${source.path}`;
  }

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
      basePath: source.path // Keep track of base path
    }));

  return skills;
}

/**
 * Fetch list of skills from all configured sources
 */
export async function fetchRemoteSkills(sourceName = null) {
  const sources = getSources();

  // Filter by source name if provided
  const targetSources = sourceName ? sources.filter(s => s.name === sourceName) : sources;

  if (targetSources.length === 0) {
    throw new Error(`Source "${sourceName}" not found.`);
  }

  // Fetch from all sources in parallel
  const results = await Promise.all(targetSources.map(source => fetchSkillsFromSource(source)));

  // Flatten and return all skills
  return results.flat();
}

/**
 * Fetch SKILL.md content for a specific skill
 */
export async function fetchSkillInfo(skillName, owner, repo, path = null) {
  // If owner/repo not provided, search in all sources
  if (!owner || !repo) {
    const skills = await fetchRemoteSkills();
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return null;
    owner = skill.owner;
    repo = skill.repo;
    path = skill.basePath;
  }

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
  const content = Buffer.from(data.content, 'base64').toString('utf-8');

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
