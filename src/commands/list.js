import chalk from 'chalk';
import ora from 'ora';
import { fetchRemoteSkills, fetchSkillInfo } from '../utils/github.js';
import { skillExists } from '../utils/local.js';

export async function listRemoteSkills(options) {
    const spinner = ora('Fetching skills from remote...').start();

    try {
        let skills = await fetchRemoteSkills();

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

        // Fetch descriptions
        const infoSpinner = ora('Fetching skill info...').start();
        const skillsWithInfo = await Promise.all(
            skills.map(async (skill) => {
                const description = await fetchSkillInfo(skill.name);
                const installed = skillExists(skill.name);
                return { ...skill, description, installed };
            })
        );
        infoSpinner.stop();

        // Display
        console.log(chalk.bold('Available Skills:'));
        console.log(chalk.dim('─'.repeat(60)));

        for (const skill of skillsWithInfo) {
            const status = skill.installed
                ? chalk.green(' ✓')
                : chalk.dim('  ');

            console.log(`${status} ${chalk.cyan.bold(skill.name)}`);
            if (skill.description) {
                console.log(`   ${chalk.dim(skill.description)}`);
            }
        }

        console.log();
        console.log(chalk.dim(`Use ${chalk.white('antikit install <skill>')} to install a skill`));

    } catch (error) {
        spinner.fail('Failed to fetch skills');
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}
