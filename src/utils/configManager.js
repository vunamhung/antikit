import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.antikit');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
    sources: [
        {
            name: 'official',
            owner: 'vunamhung',
            repo: 'antiskills',
            branch: 'main',
            default: true
        }
    ]
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

/**
 * Load config from file, create default if not exists
 */
export function loadConfig() {
    ensureConfigDir();

    if (!existsSync(CONFIG_FILE)) {
        saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }

    try {
        const content = readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return DEFAULT_CONFIG;
    }
}

/**
 * Save config to file
 */
export function saveConfig(config) {
    ensureConfigDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get all sources
 */
export function getSources() {
    const config = loadConfig();
    return config.sources || [];
}

/**
 * Add a new source
 */
export function addSource(name, owner, repo, branch = 'main') {
    const config = loadConfig();

    // Check if source with same name exists
    const existingIndex = config.sources.findIndex(s => s.name === name);
    if (existingIndex !== -1) {
        throw new Error(`Source "${name}" already exists. Use a different name or remove it first.`);
    }

    // Check if same repo already added
    const sameRepo = config.sources.find(s => s.owner === owner && s.repo === repo);
    if (sameRepo) {
        throw new Error(`Repository "${owner}/${repo}" is already added as "${sameRepo.name}".`);
    }

    config.sources.push({
        name,
        owner,
        repo,
        branch,
        default: false
    });

    saveConfig(config);
    return config.sources;
}

/**
 * Remove a source by name
 */
export function removeSource(name) {
    const config = loadConfig();

    const source = config.sources.find(s => s.name === name);
    if (!source) {
        throw new Error(`Source "${name}" not found.`);
    }

    if (source.default) {
        throw new Error(`Cannot remove the default source "${name}".`);
    }

    config.sources = config.sources.filter(s => s.name !== name);
    saveConfig(config);
    return config.sources;
}

/**
 * Set default source
 */
export function setDefaultSource(name) {
    const config = loadConfig();

    const source = config.sources.find(s => s.name === name);
    if (!source) {
        throw new Error(`Source "${name}" not found.`);
    }

    config.sources = config.sources.map(s => ({
        ...s,
        default: s.name === name
    }));

    saveConfig(config);
    return config.sources;
}

/**
 * Get config file path (for display)
 */
export function getConfigPath() {
    return CONFIG_FILE;
}
