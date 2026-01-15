#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { listRemoteSkills } from './commands/list.js';
import { listLocalSkills } from './commands/local.js';
import { installSkill } from './commands/install.js';
import { removeSkill } from './commands/remove.js';
import { showSkillInfo } from './commands/info.js';
import { validateSkill } from './commands/validate.js';
import { updateCli } from './commands/update.js';
import { upgradeSkills } from './commands/upgrade.js';
import { listSources, addNewSource, removeExistingSource, setDefault } from './commands/source.js';
import { listConfig, setGitHubToken, removeGitHubToken } from './commands/config.js';
import { checkForUpdates } from './utils/updateNotifier.js';
import { setupCompletion } from './utils/completion.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// Setup autocompletion (must run before commander)
setupCompletion();

// Check for updates (non-blocking)
checkForUpdates(pkg.name, pkg.version);

const program = new Command();

program
  .name('antikit')
  .description('CLI tool to manage skills from multiple repositories')
  .version(pkg.version);

program
  .command('list')
  .alias('ls')
  .description('List available skills from remote repositories')
  .option('-s, --search <query>', 'Search skills by name')
  .option('-i, --interactive', 'Interactive mode (default)')
  .option('-t, --text', 'Show as text list (non-interactive)')
  .option('--source <name>', 'Filter by source name')
  .action(listRemoteSkills);

program
  .command('local')
  .alias('l')
  .description('List installed skills in local .agent/skills directory')
  .action(listLocalSkills);

program
  .command('install <skill>')
  .alias('i')
  .description('Install a skill from remote repository')
  .option('-f, --force', 'Force overwrite if skill already exists')
  .action(installSkill);

program
  .command('remove [skill]')
  .alias('rm')
  .description('Remove installed skill(s)')
  .option('-i, --interactive', 'Interactive mode to select skills (default in TTY)')
  .option('-a, --all', 'Remove all installed skills')
  .option('-y, --yes', 'Skip confirmation (use with --all)')
  .action(removeSkill);

program
  .command('info <skill>')
  .alias('doc')
  .description('Show skill documentation (SKILL.md)')
  .action(showSkillInfo);

program
  .command('validate [path]')
  .description('Validate SKILL.md structure and metadata')
  .action(validateSkill);

program
  .command('update')
  .alias('up')
  .description('Update antikit to the latest version')
  .action(updateCli);

program
  .command('upgrade [skill]')
  .alias('ug')
  .description('Upgrade installed skills')
  .option('-i, --interactive', 'Interactive mode to select skills (default in TTY)')
  .option('-y, --yes', 'Skip confirmation')
  .action(upgradeSkills);

program
  .command('completion')
  .description('Setup autocomplete for your shell (zsh/bash)')
  .action(() => {
    console.log(chalk.bold('To install autocomplete:'));
    console.log(chalk.cyan('1. Run this command to append the script to your config:'));
    console.log('   antikit --completion >> ~/.zshrc  # For Zsh');
    console.log('   antikit --completion >> ~/.bashrc # For Bash');
    console.log(chalk.cyan('2. Restart your shell or source the file.'));
  });

// Source management commands
const sourceCmd = program
  .command('source')
  .alias('src')
  .description('Manage skill sources (repositories)');

sourceCmd
  .command('list')
  .alias('ls')
  .description('List all configured sources')
  .action(listSources);

sourceCmd
  .command('add <repo>')
  .description('Add a new source (format: owner/repo)')
  .option('-n, --name <name>', 'Custom name for the source')
  .option('-b, --branch <branch>', 'Branch to use (default: main)')
  .option('-p, --path <path>', 'Subpath in the repository (e.g. skills)')
  .action(addNewSource);

sourceCmd
  .command('remove <name>')
  .alias('rm')
  .description('Remove a source by name')
  .action(removeExistingSource);

sourceCmd.command('default <name>').description('Set default source').action(setDefault);

// Config management commands
const configCmd = program.command('config').description('Manage CLI configuration');

configCmd.command('list').alias('ls').description('List current configuration').action(listConfig);

configCmd
  .command('set-token <token>')
  .description('Set GitHub Personal Access Token')
  .action(setGitHubToken);

configCmd
  .command('remove-token')
  .description('Remove GitHub Personal Access Token')
  .action(removeGitHubToken);

program.parse();
