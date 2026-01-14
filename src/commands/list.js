import chalk from 'chalk';
import ora from 'ora';
import { checkbox, confirm, Separator } from '@inquirer/prompts';
import { fetchRemoteSkills, fetchSkillInfo } from '../utils/github.js';
import { skillExists, getOrCreateSkillsDir } from '../utils/local.js';
import { installSkill } from './install.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((p1[i] || 0) > (p2[i] || 0)) return 1;
    if ((p1[i] || 0) < (p2[i] || 0)) return -1;
  }
  return 0;
}

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
        // Pass basePath to fetch correct SKILL.md location
        const info = await fetchSkillInfo(skill.name, skill.owner, skill.repo, skill.basePath);
        const description = info ? info.description : null;
        const remoteVersion = info ? info.version : '0.0.0';

        const installed = skillExists(skill.name);
        let updateAvailable = false;
        let localVersion = '0.0.0';

        if (installed) {
          try {
            const metaPath = join(skillsDir, skill.name, '.antikit-skill.json');
            if (existsSync(metaPath)) {
              const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
              localVersion = meta.version || '0.0.0';
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
  console.log(chalk.bold('Available Skills:'));
  console.log(chalk.dim('─'.repeat(60)));

  // Group by source
  const bySource = skills.reduce((acc, skill) => {
    const src = skill.source || 'unknown';
    if (!acc[src]) acc[src] = [];
    acc[src].push(skill);
    return acc;
  }, {});

  for (const [sourceName, sourceSkills] of Object.entries(bySource)) {
    console.log(chalk.magenta.bold(`\n📦 ${sourceName}`));
    for (const skill of sourceSkills) {
      let status = chalk.dim('  ');
      if (skill.installed) {
        status = skill.updateAvailable ? chalk.yellow(' ↑') : chalk.green(' ✓');
      }

      console.log(
        `${status} ${chalk.cyan.bold(skill.name)} ${skill.installed ? chalk.dim(`(v${skill.localVersion}${skill.updateAvailable ? ` → v${skill.remoteVersion}` : ''})`) : ''}`
      );
      if (skill.description) {
        console.log(`     ${chalk.dim(skill.description)}`);
      }
    }
  }

  console.log();
  console.log(chalk.dim(`Use ${chalk.white('antikit list -i')} to select and install skills`));
}

async function interactiveInstall(skills) {
  // Sort skills by Source then Name
  skills.sort((a, b) => {
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
