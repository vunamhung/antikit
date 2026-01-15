import chalk from 'chalk';
import { checkbox, confirm } from '@inquirer/prompts';
import Table from 'cli-table3';
import { removeLocalSkill, skillExists, findLocalSkillsDir, getLocalSkills } from '../utils/local.js';

export async function removeSkill(skillName, options = {}) {
  const skillsDir = findLocalSkillsDir();

  if (!skillsDir) {
    console.log(chalk.red('No .agent/skills directory found in current path.'));
    process.exit(1);
  }

  // 1. Remove specific skill
  if (skillName) {
    await removeSingleSkill(skillName);
    return;
  }

  // 2. Get all installed skills
  const skills = getLocalSkills();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills installed.'));
    return;
  }

  // 3. Check mode: interactive, all, or error
  if (options.all) {
    await removeAllSkills(skills, options.yes);
  } else if (options.interactive || process.stdout.isTTY) {
    await interactiveRemove(skills);
  } else {
    console.log(chalk.yellow('Please specify a skill name to remove.'));
    console.log(chalk.dim('Usage:'));
    console.log(chalk.dim('  antikit remove <skill-name>       Remove specific skill'));
    console.log(chalk.dim('  antikit remove -i                 Interactive mode'));
    console.log(chalk.dim('  antikit remove --all              Remove all skills'));
    process.exit(1);
  }
}

async function interactiveRemove(skills) {
  // Sort skills alphabetically
  skills.sort((a, b) => a.name.localeCompare(b.name));

  console.log(chalk.bold(`\nSelect skills to remove (${skills.length} installed):\n`));

  const choices = skills.map(skill => {
    let label = `${chalk.cyan(skill.name)}`;

    if (skill.description) {
      label += ` ${chalk.dim('- ' + skill.description.slice(0, 80) + (skill.description.length > 80 ? '...' : ''))}`;
    }

    return {
      name: label,
      value: skill
    };
  });

  // Show checkbox selection
  const selected = await checkbox({
    message: 'Select skills to remove:',
    choices,
    pageSize: 20,
    loop: false
  });

  if (selected.length === 0) {
    console.log(chalk.yellow('\nNo skills selected.'));
    return;
  }

  // Show summary table
  console.log(chalk.bold.yellow(`\n⚠️  You are about to remove ${selected.length} skill(s):`));
  const table = new Table({
    head: [chalk.cyan('Skill Name'), chalk.cyan('Description')],
    colWidths: [30, Math.max(20, (process.stdout.columns || 80) - 40)],
    wordWrap: true,
    style: { head: [], border: [] }
  });

  selected.forEach(skill => {
    table.push([
      chalk.bold.red(skill.name),
      skill.description || chalk.dim('No description')
    ]);
  });

  console.log(table.toString());
  console.log();

  // Confirm removal
  const shouldRemove = await confirm({
    message: chalk.red(`⚠️  Permanently remove ${selected.length} skill(s)?`),
    default: false
  });

  if (!shouldRemove) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  // Remove selected skills
  console.log();
  let successCount = 0;
  let failCount = 0;

  for (const skill of selected) {
    try {
      removeLocalSkill(skill.name);
      console.log(chalk.green(`✓ Removed ${chalk.bold(skill.name)}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to remove ${skill.name}: ${error.message}`));
      failCount++;
    }
  }

  console.log('\n────────────────────────────────────────');
  if (failCount === 0) {
    console.log(chalk.green(`✓ Successfully removed ${successCount} skill(s)`));
  } else {
    console.log(chalk.yellow(`⚠ Removed ${successCount} skill(s), ${failCount} failed`));
  }
}

async function removeAllSkills(skills, autoYes) {
  console.log(chalk.bold.yellow(`\n⚠️  You are about to remove ALL ${skills.length} installed skills:\n`));

  // Show table of all skills
  const table = new Table({
    head: [chalk.cyan('Skill Name'), chalk.cyan('Description')],
    colWidths: [30, Math.max(20, (process.stdout.columns || 80) - 40)],
    wordWrap: true,
    style: { head: [], border: [] }
  });

  skills.forEach(skill => {
    table.push([
      chalk.bold.red(skill.name),
      skill.description || chalk.dim('No description')
    ]);
  });

  console.log(table.toString());
  console.log();

  let shouldProceed = autoYes;
  if (!shouldProceed) {
    shouldProceed = await confirm({
      message: chalk.red(`⚠️  Permanently remove ALL ${skills.length} skills?`),
      default: false
    });
  }

  if (!shouldProceed) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  console.log();
  let successCount = 0;
  let failCount = 0;

  for (const skill of skills) {
    try {
      removeLocalSkill(skill.name);
      console.log(chalk.green(`✓ Removed ${chalk.bold(skill.name)}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to remove ${skill.name}: ${error.message}`));
      failCount++;
    }
  }

  console.log('\n────────────────────────────────────────');
  if (failCount === 0) {
    console.log(chalk.green(`✓ Successfully removed all ${successCount} skills`));
  } else {
    console.log(chalk.yellow(`⚠ Removed ${successCount} skills, ${failCount} failed`));
  }
}

async function removeSingleSkill(skillName) {
  if (!skillExists(skillName)) {
    console.log(chalk.yellow(`Skill "${skillName}" is not installed.`));
    process.exit(1);
  }

  try {
    removeLocalSkill(skillName);
    console.log(chalk.green(`✓ Removed ${chalk.bold(skillName)}`));
  } catch (error) {
    console.error(chalk.red(`Failed to remove: ${error.message}`));
    process.exit(1);
  }
}

