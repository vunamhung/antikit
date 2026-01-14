/**
 * Simple logging utility with debug support
 * Enable debug logs with DEBUG=antikit environment variable
 */

import chalk from 'chalk';

const DEBUG = process.env.DEBUG === 'antikit' || process.env.DEBUG === '*';

/**
 * Log debug message (only when DEBUG=antikit)
 */
export function debug(...args) {
  if (DEBUG) {
    console.error(chalk.dim('[debug]'), ...args);
  }
}

/**
 * Log info message
 */
export function info(...args) {
  console.log(chalk.blue('ℹ'), ...args);
}

/**
 * Log warning message
 */
export function warn(...args) {
  console.warn(chalk.yellow('⚠'), ...args);
}

/**
 * Log error message
 */
export function error(...args) {
  console.error(chalk.red('✖'), ...args);
}

/**
 * Log success message
 */
export function success(...args) {
  console.log(chalk.green('✓'), ...args);
}

/**
 * Create a scoped logger
 */
export function createLogger(scope) {
  const prefix = chalk.dim(`[${scope}]`);
  return {
    debug: (...args) => debug(prefix, ...args),
    info: (...args) => info(prefix, ...args),
    warn: (...args) => warn(prefix, ...args),
    error: (...args) => error(prefix, ...args),
    success: (...args) => success(prefix, ...args)
  };
}

export default { debug, info, warn, error, success, createLogger };
