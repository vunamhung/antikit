import chalk from 'chalk';
import {
  setToken,
  getToken,
  removeToken,
  getConfigPath,
  loadConfig
} from '../utils/configManager.js';

/**
 * List all configurations
 */
export function listConfig() {
  const config = loadConfig();
  console.log(chalk.bold('\nCurrent Configuration:'));
  console.log(chalk.dim('─'.repeat(40)));

  if (config.githubToken) {
    console.log(`GitHub Token: ${chalk.green('********' + config.githubToken.slice(-4))}`);
  } else {
    console.log(`GitHub Token: ${chalk.dim('(not set)')}`);
  }

  // List other configs if any...

  console.log();
  console.log(chalk.dim(`Config file: ${getConfigPath()}`));
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
