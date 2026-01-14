import chalk from 'chalk';
import {
  getSources,
  addSource,
  removeSource,
  setDefaultSource,
  getConfigPath
} from '../utils/configManager.js';

/**
 * List all configured sources
 */
export function listSources() {
  const sources = getSources();

  console.log(chalk.bold('\nConfigured Sources:'));
  console.log(chalk.dim('─'.repeat(60)));

  for (const source of sources) {
    const defaultBadge = source.default ? chalk.green(' (default)') : '';
    console.log(`  ${chalk.cyan.bold(source.name)}${defaultBadge}`);
    console.log(
      `    ${chalk.dim('→')} ${chalk.white(`${source.owner}/${source.repo}`)} ${chalk.dim(`[${source.branch}]`)}`
    );
  }

  console.log();
  console.log(chalk.dim(`Config file: ${getConfigPath()}`));
  console.log();
}

/**
 * Add a new source
 */
export function addNewSource(repoPath, options) {
  try {
    // Parse repo path (owner/repo format)
    const parts = repoPath.split('/');
    if (parts.length !== 2) {
      console.error(chalk.red('Error: Repository must be in format "owner/repo"'));
      process.exit(1);
    }

    const [owner, repo] = parts;
    const name = options.name || repo;
    const branch = options.branch || 'main';
    const path = options.path || null;

    addSource(name, owner, repo, branch, path);

    console.log(chalk.green(`\n✓ Added source "${name}" (${owner}/${repo})`));
    console.log();
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Remove a source
 */
export function removeExistingSource(name) {
  try {
    removeSource(name);
    console.log(chalk.green(`\n✓ Removed source "${name}"`));
    console.log();
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Set default source
 */
export function setDefault(name) {
  try {
    setDefaultSource(name);
    console.log(chalk.green(`\n✓ Set "${name}" as default source`));
    console.log();
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
