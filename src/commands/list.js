import chalk from 'chalk';
import ora from 'ora';
import { checkbox, confirm } from '@inquirer/prompts';
import { fetchRemoteSkills, fetchSkillInfo } from '../utils/github.js';
import { skillExists } from '../utils/local.js';
import { installSkill } from './install.js';

export async function listRemoteSkills(options) {
    const sourceName = options.source || null;
    const spinner = ora(`Fetching skills${sourceName ? ` from ${sourceName}` : ' from all sources'}...`).start();

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

        // Fetch descriptions
        const infoSpinner = ora('Fetching skill info...').start();
        const skillsWithInfo = await Promise.all(
            skills.map(async (skill) => {
                const description = await fetchSkillInfo(skill.name, skill.owner, skill.repo);
                const installed = skillExists(skill.name);
                return { ...skill, description, installed };
            })
        );
        infoSpinner.stop();

        // Interactive mode - show selection menu
        if (options.interactive) {
            await interactiveInstall(skillsWithInfo);
            return;
        }

        // Display list
        displaySkillsList(skillsWithInfo);

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
            const status = skill.installed
                ? chalk.green(' ✓')
                : chalk.dim('  ');

            console.log(`${status} ${chalk.cyan.bold(skill.name)}`);
            if (skill.description) {
                console.log(`     ${chalk.dim(skill.description)}`);
            }
        }
    }

    console.log();
    console.log(chalk.dim(`Use ${chalk.white('antikit list -i')} to select and install skills`));
}

async function interactiveInstall(skills) {
    // Prepare choices for checkbox
    const choices = skills.map(skill => ({
        name: `${skill.installed ? chalk.green('✓') : ' '} ${chalk.cyan(skill.name)} ${chalk.dim(`[${skill.source}]`)} ${skill.description ? chalk.dim('- ' + skill.description.slice(0, 50) + '...') : ''}`,
        value: skill,
        disabled: skill.installed ? '(installed)' : false
    }));

    // Show checkbox selection
    const selected = await checkbox({
        message: 'Select skills to install (Space to select, Enter to confirm):',
        choices,
        pageSize: 15
    });

    if (selected.length === 0) {
        console.log(chalk.yellow('\nNo skills selected.'));
        return;
    }

    // Confirm installation
    const shouldInstall = await confirm({
        message: `Install ${selected.length} skill(s)?`,
        default: true
    });

    if (!shouldInstall) {
        console.log(chalk.yellow('Installation cancelled.'));
        return;
    }

    // Install selected skills
    console.log();
    for (const skill of selected) {
        await installSkill(skill.name, { force: false, owner: skill.owner, repo: skill.repo });
    }

    console.log();
    console.log(chalk.green.bold(`✓ Installed ${selected.length} skill(s)`));
}
