import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { OFFICIAL_SOURCE, DEFAULT_BRANCH } from './constants.js';

const CONFIG_DIR = join(homedir(), '.antikit');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  sources: [
    {
      name: OFFICIAL_SOURCE,
      owner: 'vunamhung',
      repo: 'antiskills',
      branch: DEFAULT_BRANCH,
      default: true
    },
    {
      name: 'claudekit',
      owner: 'mrgoonie',
      repo: 'claudekit-skills',
      branch: DEFAULT_BRANCH,
      path: '.claude/skills'
    },
    {
      name: 'ui-ux-pro',
      owner: 'nextlevelbuilder',
      repo: 'ui-ux-pro-max-skill',
      branch: DEFAULT_BRANCH,
      path: '.claude/skills'
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
  const sources = config.sources || [];

  // Enforce 'official' source always at the top
  return sources.sort((a, b) => {
    if (a.name === OFFICIAL_SOURCE) return -1;
    if (b.name === OFFICIAL_SOURCE) return 1;
    return 0;
  });
}

/**
 * Add a new source
 */
export function addSource(name, owner, repo, branch = DEFAULT_BRANCH, path = null) {
  const config = loadConfig();

  // Check if source with same name exists
  const existingIndex = config.sources.findIndex(s => s.name === name);
  if (existingIndex !== -1) {
    throw new Error(`Source "${name}" already exists. Use a different name or remove it first.`);
  }

  // Check if same repo already added (allow same repo if path is different?)
  // Let's allow same repo if path is different, useful for monorepos!
  const sameRepo = config.sources.find(
    s => s.owner === owner && s.repo === repo && s.path === path
  );
  if (sameRepo) {
    throw new Error(
      `Repository "${owner}/${repo}" ${path ? `(path: ${path}) ` : ''}is already added as "${sameRepo.name}".`
    );
  }

  const newSource = {
    name,
    owner,
    repo,
    branch,
    default: false
  };

  if (path) {
    newSource.path = path;
  }

  config.sources.push(newSource);

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
 * Set GitHub Token
 */
export function setToken(token) {
  const config = loadConfig();
  config.githubToken = token;
  saveConfig(config);
}

/**
 * Get GitHub Token
 */
export function getToken() {
  const config = loadConfig();
  return config.githubToken;
}

/**
 * Remove GitHub Token
 */
export function removeToken() {
  const config = loadConfig();
  delete config.githubToken;
  saveConfig(config);
}

/**
 * Get config file path (for display)
 */
export function getConfigPath() {
  return CONFIG_FILE;
}
