#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { listRemoteSkills } from './commands/list.js';
import { listLocalSkills } from './commands/local.js';
import { installSkill } from './commands/install.js';
import { removeSkill } from './commands/remove.js';

const program = new Command();

program
  .name('antikit')
  .description('CLI tool to manage skills from antiskills repository')
  .version('1.0.0');

program
  .command('list')
  .alias('ls')
  .description('List available skills from remote repository')
  .option('-s, --search <query>', 'Search skills by name')
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

program.parse();
