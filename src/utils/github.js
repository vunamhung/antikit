import { getSources } from './configManager.js';

const GITHUB_API = 'https://api.github.com';

/**
 * Fetch list of skills from a specific source
 */
async function fetchSkillsFromSource(source) {
    const url = `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'antikit-cli'
        }
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // Handle empty repository
        if (data.message === 'This repository is empty.') {
            return [];
        }
        // Don't throw, just return empty array for this source
        return [];
    }

    const contents = await response.json();

    // Filter only directories (skills)
    const skills = contents
        .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
        .map(item => ({
            name: item.name,
            url: item.html_url,
            path: item.path,
            source: source.name,
            owner: source.owner,
            repo: source.repo
        }));

    return skills;
}

/**
 * Fetch list of skills from all configured sources
 */
export async function fetchRemoteSkills(sourceName = null) {
    const sources = getSources();

    // Filter by source name if provided
    const targetSources = sourceName
        ? sources.filter(s => s.name === sourceName)
        : sources;

    if (targetSources.length === 0) {
        throw new Error(`Source "${sourceName}" not found.`);
    }

    // Fetch from all sources in parallel
    const results = await Promise.all(
        targetSources.map(source => fetchSkillsFromSource(source))
    );

    // Flatten and return all skills
    return results.flat();
}

/**
 * Fetch SKILL.md content for a specific skill
 */
export async function fetchSkillInfo(skillName, owner, repo) {
    // If owner/repo not provided, search in all sources
    if (!owner || !repo) {
        const skills = await fetchRemoteSkills();
        const skill = skills.find(s => s.name === skillName);
        if (!skill) return null;
        owner = skill.owner;
        repo = skill.repo;
    }

    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${skillName}/SKILL.md`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'antikit-cli'
        }
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    // Extract description from YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const descMatch = match[1].match(/description:\s*(.+)/);
        return descMatch ? descMatch[1].trim() : null;
    }

    return null;
}

/**
 * Get clone URL for a skill
 */
export function getSkillCloneUrl(owner, repo) {
    return `https://github.com/${owner}/${repo}.git`;
}

