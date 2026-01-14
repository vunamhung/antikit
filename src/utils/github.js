import { CONFIG } from '../config.js';

/**
 * Fetch list of skills (directories) from GitHub repo
 */
export async function fetchRemoteSkills() {
    const url = `${CONFIG.GITHUB_API}/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents`;

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
        throw new Error(`Failed to fetch skills: ${response.statusText}`);
    }

    const contents = await response.json();

    // Filter only directories (skills)
    const skills = contents
        .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
        .map(item => ({
            name: item.name,
            url: item.html_url,
            path: item.path
        }));

    return skills;
}

/**
 * Fetch SKILL.md content for a specific skill
 */
export async function fetchSkillInfo(skillName) {
    const url = `${CONFIG.GITHUB_API}/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${skillName}/SKILL.md`;

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
