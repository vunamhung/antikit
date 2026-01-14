import chalk from 'chalk';
import {
  getSources,
  addSource,
  removeSource,
  setDefaultSource,
  getConfigPath
} from '../utils/configManager.js';

import Table from 'cli-table3';

/**
 * List all configured sources
 */
export function listSources() {
  const sources = getSources();

  console.log(chalk.bold('\nConfigured Sources:'));

  const table = new Table({
    head: [chalk.cyan('Name'), chalk.cyan('Repository'), chalk.cyan('Branch'), chalk.cyan('Path')],
    colWidths: [20, 40, 15, 20],
    style: { head: [], border: [] }
  });

  for (const source of sources) {
    const defaultBadge = source.default ? chalk.green(' *') : '';
    table.push([
      chalk.bold(source.name) + defaultBadge,
      `${source.owner}/${source.repo}`,
      source.branch || 'main',
      source.path || chalk.dim('(root)')
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`\nConfig file: ${getConfigPath()}\n`));
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
