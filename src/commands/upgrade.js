import chalk from 'chalk';
import ora from 'ora';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { checkbox, confirm, Separator } from '@inquirer/prompts';
import Table from 'cli-table3';
import { getOrCreateSkillsDir } from '../utils/local.js';
import { installSkill } from './install.js';
import { fetchSkillInfo } from '../utils/github.js';
import { compareVersions, DEFAULT_VERSION } from '../utils/version.js';
import { METADATA_FILE } from '../utils/constants.js';

export async function upgradeSkills(skillName, options = {}) {
  const skillsDir = getOrCreateSkillsDir();

  // 1. Upgrade specific skill
  if (skillName) {
    try {
      await upgradeSingleSkill(skillsDir, skillName);
    } catch {
      process.exit(1);
    }
    return;
  }

  // 2. Get all installed skills
  const skillNames = readdirSync(skillsDir).filter(
    f => existsSync(join(skillsDir, f)) && !f.startsWith('.')
  );

  if (skillNames.length === 0) {
    console.log(chalk.yellow('No skills installed.'));
    return;
  }

  // 3. Fetch skill metadata and check for updates
  const spinner = ora('Checking for updates...').start();
  const skillsWithInfo = [];

  for (const skillName of skillNames) {
    const metaPath = join(skillsDir, skillName, METADATA_FILE);

    if (!existsSync(metaPath)) {
      skillsWithInfo.push({
        name: skillName,
        localVersion: DEFAULT_VERSION,
        remoteVersion: null,
        updateAvailable: false,
        error: 'Missing metadata'
      });
      continue;
    }

    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      const localVersion = meta.version || DEFAULT_VERSION;

      if (!meta.source || !meta.source.owner || !meta.source.repo) {
        skillsWithInfo.push({
          name: skillName,
          localVersion,
          remoteVersion: null,
          updateAvailable: false,
          error: 'Invalid metadata',
          meta
        });
        continue;
      }

      // Fetch remote version
      const info = await fetchSkillInfo(
        skillName,
        meta.source.owner,
        meta.source.repo,
        meta.source.path || '',
        meta.source.branch || 'main'
      );

      const remoteVersion = info ? info.version : DEFAULT_VERSION;
      const updateAvailable = compareVersions(remoteVersion, localVersion) > 0;

      skillsWithInfo.push({
        name: skillName,
        localVersion,
        remoteVersion,
        updateAvailable,
        description: info ? info.description : meta.description,
        meta
      });
    } catch (error) {
      skillsWithInfo.push({
        name: skillName,
        localVersion: DEFAULT_VERSION,
        remoteVersion: null,
        updateAvailable: false,
        error: error.message
      });
    }
  }

  spinner.succeed(`Found ${skillsWithInfo.length} installed skills`);
  console.log();

  // 4. Check if interactive mode or auto-upgrade mode
  if (options.interactive || (!options.yes && process.stdout.isTTY)) {
    await interactiveUpgrade(skillsDir, skillsWithInfo);
  } else {
    await autoUpgradeAll(skillsDir, skillsWithInfo, options.yes);
  }
}


async function interactiveUpgrade(skillsDir, skills) {
  // Sort skills: updateAvailable first, then by name
  skills.sort((a, b) => {
    if (a.updateAvailable && !b.updateAvailable) return -1;
    if (!a.updateAvailable && b.updateAvailable) return 1;
    return a.name.localeCompare(b.name);
  });

  const hasUpdates = skills.some(s => s.updateAvailable);

  if (!hasUpdates) {
    console.log(chalk.green('✓ All skills are up to date!'));
    console.log();
    displaySkillsTable(skills);
    return;
  }

  console.log(chalk.bold('Select skills to upgrade:\n'));

  const choices = skills.map(skill => {
    let label = '';
    let disabled = false;

    if (skill.error) {
      label = `${chalk.red('✗')} ${chalk.cyan(skill.name)} ${chalk.dim(`(${skill.error})`)}`;
      disabled = `Cannot upgrade: ${skill.error}`;
    } else if (skill.updateAvailable) {
      label = `${chalk.yellow('↑')} ${chalk.cyan(skill.name)} ${chalk.yellow(`v${skill.localVersion} → v${skill.remoteVersion}`)}`;
    } else {
      label = `${chalk.green('✓')} ${chalk.cyan(skill.name)} ${chalk.dim(`v${skill.localVersion} (Up to date)`)}`;
      disabled = true;
    }

    if (skill.description && !skill.error) {
      label += ` ${chalk.dim('- ' + skill.description.slice(0, 80) + (skill.description.length > 80 ? '...' : ''))}`;
    }

    return {
      name: label,
      value: skill,
      disabled
    };
  });

  // Show checkbox selection
  const selected = await checkbox({
    message: 'Select skills to upgrade:',
    choices,
    pageSize: 20,
    loop: false
  });

  if (selected.length === 0) {
    console.log(chalk.yellow('\nNo skills selected.'));
    return;
  }

  // Confirm upgrade
  const shouldUpgrade = await confirm({
    message: `Upgrade ${selected.length} skill(s)?`,
    default: true
  });

  if (!shouldUpgrade) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  // Upgrade selected skills
  console.log();
  let successCount = 0;
  let failCount = 0;

  for (const skill of selected) {
    try {
      await upgradeSingleSkill(skillsDir, skill.name);
      successCount++;
    } catch {
      failCount++;
    }
  }

  console.log('\n────────────────────────────────────────');
  if (failCount === 0) {
    console.log(chalk.green(`✓ All ${successCount} skills upgraded successfully`));
  } else {
    console.log(chalk.yellow(`⚠ Upgraded ${successCount} skills, ${failCount} failed`));
  }
}

async function autoUpgradeAll(skillsDir, skills, autoYes) {
  const upgradableSkills = skills.filter(s => s.updateAvailable && !s.error);

  if (upgradableSkills.length === 0) {
    console.log(chalk.green('✓ All skills are up to date!'));
    console.log();
    displaySkillsTable(skills);
    return;
  }

  console.log(chalk.blue(`Found ${upgradableSkills.length} skill(s) with available updates:`));
  console.log();

  // Display table of upgradable skills
  const table = new Table({
    head: [chalk.cyan('Skill Name'), chalk.cyan('Current'), chalk.cyan('Latest')],
    colWidths: [30, 15, 15],
    style: { head: [], border: [] }
  });

  upgradableSkills.forEach(skill => {
    table.push([
      chalk.bold.cyan(skill.name),
      chalk.dim(skill.localVersion),
      chalk.yellow(skill.remoteVersion)
    ]);
  });

  console.log(table.toString());
  console.log();

  let shouldProceed = autoYes;
  if (!shouldProceed) {
    shouldProceed = await confirm({ message: 'Upgrade all skills?', default: true });
  }

  if (!shouldProceed) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const skill of upgradableSkills) {
    try {
      await upgradeSingleSkill(skillsDir, skill.name);
      successCount++;
    } catch {
      failCount++;
    }
  }

  console.log('\n────────────────────────────────────────');
  if (failCount === 0) {
    console.log(chalk.green(`✓ All ${successCount} skills upgraded successfully`));
  } else {
    console.log(chalk.yellow(`⚠ Upgraded ${successCount} skills, ${failCount} failed`));
  }
}

function displaySkillsTable(skills) {
  const table = new Table({
    head: [chalk.cyan('Skill Name'), chalk.cyan('Version'), chalk.cyan('Status')],
    colWidths: [30, 15, 20],
    style: { head: [], border: [] }
  });

  skills.forEach(skill => {
    let status = '';
    if (skill.error) {
      status = chalk.red('Error');
    } else if (skill.updateAvailable) {
      status = chalk.yellow('Update available');
    } else {
      status = chalk.green('Up to date');
    }

    table.push([
      chalk.bold.cyan(skill.name),
      skill.error ? chalk.dim(skill.localVersion) : skill.localVersion,
      status
    ]);
  });

  console.log(table.toString());
  console.log();
}

async function upgradeSingleSkill(skillsDir, skillName) {
  const skillPath = join(skillsDir, skillName);
  const metaPath = join(skillPath, '.antikit-skill.json');

  if (!existsSync(metaPath)) {
    console.log(chalk.yellow(`⚠ Skipping "${skillName}": Missing metadata (install again to fix)`));
    throw new Error('Missing metadata');
  }

  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    if (!meta.source || !meta.source.owner || !meta.source.repo) {
      console.log(chalk.yellow(`⚠ Skipping "${skillName}": Invalid metadata`));
      throw new Error('Invalid metadata');
    }

    console.log(chalk.bold.cyan(`\nUpgrading ${skillName}...`));

    await installSkill(skillName, {
      force: true,
      owner: meta.source.owner,
      repo: meta.source.repo,
      path: meta.source.path, // Pass path from metadata
      noExit: true // Don't kill process on error
    });
  } catch (error) {
    // Error already logged by installSkill or above
    throw error;
  }
}

