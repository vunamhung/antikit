/**
 * Shared constants for antikit
 * Eliminates magic strings throughout the codebase
 */

// Source names
export const OFFICIAL_SOURCE = 'antiskills';

// File names
export const SKILL_MD = 'SKILL.md';
export const METADATA_FILE = '.antikit-skill.json';

// Directory names
export const SKILLS_DIR = '.agent/skills';

// Cache settings
export const CACHE_TTL = 1000 * 60 * 60; // 1 hour
export const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 6; // 6 hours

// API endpoints
export const GITHUB_API = 'https://api.github.com';
export const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
export const GITHUB_RAW = 'https://raw.githubusercontent.com';

// Default branch
export const DEFAULT_BRANCH = 'main';

// Status indicators
export const STATUS = {
  INSTALLED: 'installed',
  UPDATE_AVAILABLE: 'update',
  NOT_INSTALLED: 'not_installed'
};

// Max limits
export const MAX_DIRECTORY_DEPTH = 50;
