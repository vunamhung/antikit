import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { compareVersions } from './version.js';
import { debug } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(homedir(), '.antikit');
const UPDATE_CHECK_FILE = join(CONFIG_DIR, 'update-check.json');

// Check for updates every 6 hours
const CHECK_INTERVAL = 1000 * 60 * 60 * 6;

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load cached update check data
 */
function loadUpdateCache() {
  try {
    if (!existsSync(UPDATE_CHECK_FILE)) return null;
    return JSON.parse(readFileSync(UPDATE_CHECK_FILE, 'utf-8'));
  } catch (e) {
    debug('Failed to load update cache:', e.message);
    return null;
  }
}

/**
 * Save update cache data
 */
function saveUpdateCache(data) {
  try {
    ensureConfigDir();
    writeFileSync(UPDATE_CHECK_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    debug('Failed to save update cache:', e.message);
  }
}

/**
 * Fetch latest version from npm registry
 * @param {string} packageName
 * @returns {Promise<string|null>}
 */
async function fetchLatestVersion(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      debug('NPM registry returned non-ok status:', response.status);
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch (e) {
    debug('Failed to fetch latest version:', e.message);
    return null;
  }
}

/**
 * Display update notification
 */
function displayUpdateNotification(packageName, currentVersion, latestVersion) {
  console.error('');
  console.error(chalk.yellow('╭' + '─'.repeat(58) + '╮'));
  console.error(chalk.yellow('│') + ' '.repeat(58) + chalk.yellow('│'));
  console.error(
    chalk.yellow('│') +
      `   ${chalk.bold.yellow('Update available!')} ${chalk.dim(currentVersion)} → ${chalk.green.bold(latestVersion)}`.padEnd(
        76
      ) +
      chalk.yellow('│')
  );
  console.error(chalk.yellow('│') + ' '.repeat(58) + chalk.yellow('│'));
  console.error(
    chalk.yellow('│') +
      `   Run ${chalk.cyan(`npm i -g ${packageName}`)} to update`.padEnd(65) +
      chalk.yellow('│')
  );
  console.error(chalk.yellow('│') + ' '.repeat(58) + chalk.yellow('│'));
  console.error(chalk.yellow('╰' + '─'.repeat(58) + '╯'));
  console.error('');
}

// Store pending notification
let pendingNotification = null;
let listenerRegistered = false;

/**
 * Check for updates (non-blocking, uses cache)
 */
export function checkForUpdates(packageName, currentVersion) {
  const cache = loadUpdateCache();
  const now = Date.now();

  // Display notification from cache if update available
  if (cache && cache.latestVersion && compareVersions(cache.latestVersion, currentVersion) > 0) {
    pendingNotification = { packageName, currentVersion, latestVersion: cache.latestVersion };
  }

  // Register to show notification after command completes (only once)
  if (!listenerRegistered) {
    listenerRegistered = true;
    process.on('exit', () => {
      if (pendingNotification) {
        displayUpdateNotification(
          pendingNotification.packageName,
          pendingNotification.currentVersion,
          pendingNotification.latestVersion
        );
        pendingNotification = null;
      }
    });
  }

  // Spawn background process to refresh cache if needed
  if (!cache || !cache.checkedAt || now - cache.checkedAt >= CHECK_INTERVAL) {
    try {
      const checkScript = join(__dirname, 'updateCheck.js');
      const child = spawn(process.execPath, [checkScript, packageName], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    } catch (e) {
      debug('Failed to spawn update checker:', e.message);
    }
  }
}

/**
 * Initialize update cache (call this once during install or first run)
 */
export async function initUpdateCache(packageName) {
  const latestVersion = await fetchLatestVersion(packageName);
  if (latestVersion) {
    saveUpdateCache({ latestVersion, checkedAt: Date.now() });
  }
  return latestVersion;
}
