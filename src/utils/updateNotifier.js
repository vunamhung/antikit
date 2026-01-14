import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(homedir(), '.antikit');
const UPDATE_CHECK_FILE = join(CONFIG_DIR, 'update-check.json');

// Check for updates every 6 hours
const CHECK_INTERVAL = 1000 * 60 * 60 * 6;

/**
 * Compare semantic versions
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (parts1[i] > parts2[i]) return 1;
        if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
}

/**
 * Load cached update check data
 */
function loadUpdateCache() {
    try {
        if (!existsSync(UPDATE_CHECK_FILE)) return null;
        return JSON.parse(readFileSync(UPDATE_CHECK_FILE, 'utf-8'));
    } catch {
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
    console.error(chalk.yellow('│') + `   ${chalk.bold.yellow('Update available!')} ${chalk.dim(currentVersion)} → ${chalk.green.bold(latestVersion)}`.padEnd(76) + chalk.yellow('│'));
    console.error(chalk.yellow('│') + ' '.repeat(58) + chalk.yellow('│'));
    console.error(chalk.yellow('│') + `   Run ${chalk.cyan(`npm i -g ${packageName}`)} to update`.padEnd(65) + chalk.yellow('│'));
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
        process.on('beforeExit', () => {
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
    if (!cache || !cache.checkedAt || (now - cache.checkedAt) >= CHECK_INTERVAL) {
        try {
            const checkScript = join(__dirname, 'updateCheck.js');
            const child = spawn(process.execPath, [checkScript, packageName], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
        } catch {
            // Ignore spawn errors
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


