import chalk from 'chalk';
import { getLocalSkills, findLocalSkillsDir } from '../utils/local.js';

export async function listLocalSkills() {
    const skillsDir = findLocalSkillsDir();

    if (!skillsDir) {
        console.log(chalk.yellow('No .agent/skills directory found in current path.'));
        console.log(chalk.dim('Make sure you are in a project with .agent/skills folder.'));
        return;
    }

    const skills = getLocalSkills();

    if (skills.length === 0) {
        console.log(chalk.yellow('No skills installed.'));
        console.log(chalk.dim(`Use ${chalk.white('antikit install <skill>')} to install a skill`));
        return;
    }

    console.log(chalk.bold(`Installed Skills (${skills.length}):`));
    console.log(chalk.dim('─'.repeat(60)));

    for (const skill of skills) {
        console.log(`  ${chalk.cyan.bold(skill.name)}`);
        if (skill.description) {
            console.log(`   ${chalk.dim(skill.description)}`);
        }
    }

    console.log();
    console.log(chalk.dim(`Skills directory: ${skillsDir}`));
}
