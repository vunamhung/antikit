#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { listRemoteSkills } from './commands/list.js';
import { listLocalSkills } from './commands/local.js';
import { installSkill } from './commands/install.js';
import { removeSkill } from './commands/remove.js';
import { updateCli } from './commands/update.js';
import { upgradeSkills } from './commands/upgrade.js';
import { listSources, addNewSource, removeExistingSource, setDefault } from './commands/source.js';
import { checkForUpdates } from './utils/updateNotifier.js';


const require = createRequire(import.meta.url);
const pkg = require('../package.json');

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
  .option('-i, --interactive', 'Interactive mode to select and install skills')
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
  .command('remove <skill>')
  .alias('rm')
  .description('Remove an installed skill')
  .action(removeSkill);

program
  .command('update')
  .alias('up')
  .description('Update antikit to the latest version')
  .action(updateCli);

program
  .command('upgrade [skill]')
  .alias('ug')
  .description('Upgrade installed skills')
  .option('-y, --yes', 'Skip confirmation')
  .action(upgradeSkills);

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
  .action(addNewSource);

sourceCmd
  .command('remove <name>')
  .alias('rm')
  .description('Remove a source by name')
  .action(removeExistingSource);

sourceCmd
  .command('default <name>')
  .description('Set default source')
  .action(setDefault);

program.parse();

