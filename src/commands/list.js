import chalk from 'chalk';
import ora from 'ora';
import { checkbox, confirm, Separator } from '@inquirer/prompts';
import Table from 'cli-table3';
import { fetchRemoteSkills, fetchSkillInfo } from '../utils/github.js';
import { skillExists, getOrCreateSkillsDir } from '../utils/local.js';
import { installSkill } from './install.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { compareVersions, DEFAULT_VERSION } from '../utils/version.js';
import { METADATA_FILE, OFFICIAL_SOURCE } from '../utils/constants.js';

export async function listRemoteSkills(options) {
  const sourceName = options.source || null;
  const spinner = ora(
    `Fetching skills${sourceName ? ` from ${sourceName}` : ' from all sources'}...`
  ).start();

  try {
    let skills = await fetchRemoteSkills(sourceName);

    // Filter by search query
    if (options.search) {
      const query = options.search.toLowerCase();
      skills = skills.filter(s => s.name.toLowerCase().includes(query));
    }

    spinner.succeed(`Found ${skills.length} skills`);
    console.log();

    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found.'));
      return;
    }

    const skillsDir = getOrCreateSkillsDir();

    // Fetch descriptions & versions
    const infoSpinner = ora('Fetching skill info...').start();
    const skillsWithInfo = await Promise.all(
      skills.map(async skill => {
        let description = skill.description;
        let remoteVersion = skill.version || DEFAULT_VERSION;

        // Only fetch info if not already fetched (REST fallback)
        if (description === undefined || description === null) {
          // Pass basePath and branch to fetch correct SKILL.md location optimized
          const info = await fetchSkillInfo(
            skill.name,
            skill.owner,
            skill.repo,
            skill.basePath,
            skill.branch
          );
          description = info ? info.description : null;
          remoteVersion = info ? info.version : DEFAULT_VERSION;
        }

        const installed = skillExists(skill.name);
        let updateAvailable = false;
        let localVersion = DEFAULT_VERSION;

        if (installed) {
          try {
            const metaPath = join(skillsDir, skill.name, METADATA_FILE);
            if (existsSync(metaPath)) {
              const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
              localVersion = meta.version || DEFAULT_VERSION;
              updateAvailable = compareVersions(remoteVersion, localVersion) > 0;
            }
          } catch {}
        }

        return { ...skill, description, installed, updateAvailable, localVersion, remoteVersion };
      })
    );
    infoSpinner.stop();

    // Check if explicitly requested text mode or non-interactive environment
    if (options.text || !process.stdout.isTTY) {
      displaySkillsList(skillsWithInfo);
      return;
    }

    // Default to Interactive mode
    await interactiveInstall(skillsWithInfo);
  } catch (error) {
    spinner.fail('Failed to fetch skills');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function displaySkillsList(skills) {
  console.log(chalk.bold('\nAvailable Skills:'));

  const table = new Table({
    head: [
      chalk.cyan('Source'),
      chalk.cyan('Skill Name'),
      chalk.cyan('Version'),
      chalk.cyan('Status'),
      chalk.cyan('Description')
    ],
    colWidths: [15, 25, 12, 12, Math.max(20, (process.stdout.columns || 80) - 74)],
    wordWrap: true,
    style: { head: [], border: [] }
  });

  // Sort: Official first, then Source, then Name
  skills.sort((a, b) => {
    if (a.source === OFFICIAL_SOURCE && b.source !== OFFICIAL_SOURCE) return -1;
    if (b.source === OFFICIAL_SOURCE && a.source !== OFFICIAL_SOURCE) return 1;
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });

  skills.forEach(skill => {
    let status = '';
    if (skill.installed) {
      status = skill.updateAvailable ? chalk.yellow('Update') : chalk.green('Installed');
    }

    let versionDisplay = skill.remoteVersion || DEFAULT_VERSION;
    if (skill.installed && skill.localVersion) {
      if (skill.updateAvailable) {
        versionDisplay = `${chalk.dim(skill.localVersion)}→${chalk.yellow(skill.remoteVersion)}`;
      } else {
        versionDisplay = skill.localVersion;
      }
    }

    table.push([
      chalk.magenta(skill.source),
      chalk.bold(skill.name),
      versionDisplay,
      status,
      skill.description || chalk.dim('')
    ]);
  });

  console.log(table.toString());
  console.log(
    chalk.dim(
      `\nUse ${chalk.white('antikit list -i')} to select and install skills interactively.\n`
    )
  );
}

async function interactiveInstall(skills) {
  // Sort skills by Source (Official first) then Name
  skills.sort((a, b) => {
    if (a.source === OFFICIAL_SOURCE && b.source !== OFFICIAL_SOURCE) return -1;
    if (b.source === OFFICIAL_SOURCE && a.source !== OFFICIAL_SOURCE) return 1;
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });

  const choices = [];
  let currentSource = null;

  for (const skill of skills) {
    // Add Separator for new source
    if (skill.source !== currentSource) {
      currentSource = skill.source;
      choices.push(
        new Separator(` \n ──────── Source: ${chalk.bold.magenta(currentSource)} ────────`)
      );
    }

    let label = '';
    let disabled = false;

    if (skill.installed) {
      if (skill.updateAvailable) {
        label = `${chalk.yellow('↑')} ${chalk.cyan(skill.name)} ${chalk.yellow(`(Update: v${skill.localVersion} → v${skill.remoteVersion})`)}`;
      } else {
        label = `${chalk.green('✓')} ${chalk.cyan(skill.name)} ${chalk.dim('(Installed)')}`;
        disabled = true;
      }
    } else {
      label = `${chalk.dim(' ')} ${chalk.cyan(skill.name)}`;
    }

    if (skill.description) {
      label += ` ${chalk.dim('- ' + skill.description.slice(0, 100) + (skill.description.length > 100 ? '...' : ''))}`;
    }

    choices.push({
      name: label,
      value: skill,
      disabled
    });
  }

  // Show checkbox selection
  const selected = await checkbox({
    message: 'Select skills to install/update:',
    choices,
    pageSize: 20, // Increase page size for better view
    loop: false
  });

  if (selected.length === 0) {
    console.log(chalk.yellow('\nNo skills selected.'));
    return;
  }

  // Confirm installation
  const shouldInstall = await confirm({
    message: `Install/Update ${selected.length} skill(s)?`,
    default: true
  });

  if (!shouldInstall) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  // Install selected skills
  console.log();
  for (const skill of selected) {
    // Force install if updating
    const force = skill.installed && skill.updateAvailable;
    await installSkill(skill.name, {
      force,
      owner: skill.owner,
      repo: skill.repo,
      path: skill.basePath // Pass basePath to install
    });
  }

  console.log();
  console.log(chalk.green.bold(`✓ Processed ${selected.length} skill(s)`));
}
