import chalk from 'chalk';
import {
  setToken,
  getToken,
  removeToken,
  getConfigPath,
  loadConfig
} from '../utils/configManager.js';

import Table from 'cli-table3';

/**
 * List all configurations
 */
export function listConfig() {
  const config = loadConfig();
  console.log(chalk.bold('\nCurrent Configuration:'));

  const table = new Table({
    head: [chalk.cyan('Setting'), chalk.cyan('Value')],
    colWidths: [20, 60],
    style: { head: [], border: [] }
  });

  const tokenDisplay = config.githubToken
    ? chalk.green('********' + config.githubToken.slice(-4))
    : chalk.yellow('(not set)');

  table.push(['GitHub Token', tokenDisplay]);
  table.push(['Config File', getConfigPath()]);

  console.log(table.toString());
  console.log();
}

/**
 * Set GitHub Token
 */
export function setGitHubToken(token) {
  if (!token) {
    console.error(chalk.red('Error: Token is required'));
    process.exit(1);
  }

  setToken(token);
  console.log(chalk.green('\n✓ GitHub Token saved successfully.'));
  console.log(chalk.dim('API rate limit increased.'));
  console.log();
}

/**
 * Remove GitHub Token
 */
export function removeGitHubToken() {
  removeToken();
  console.log(chalk.green('\n✓ GitHub Token removed.'));
  console.log();
}
