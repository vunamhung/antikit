import chalk from 'chalk';
import { removeLocalSkill, skillExists, findLocalSkillsDir } from '../utils/local.js';

export async function removeSkill(skillName) {
  const skillsDir = findLocalSkillsDir();

  if (!skillsDir) {
    console.log(chalk.red('No .agent/skills directory found in current path.'));
    process.exit(1);
  }

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
