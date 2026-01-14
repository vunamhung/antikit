import chalk from 'chalk';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getOrCreateSkillsDir } from '../utils/local.js';
import { installSkill } from './install.js';
import { confirm } from '@inquirer/prompts';

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

    // 2. Upgrade all skills
    const skills = readdirSync(skillsDir).filter(f =>
        existsSync(join(skillsDir, f)) &&
        !f.startsWith('.')
    );

    if (skills.length === 0) {
        console.log(chalk.yellow('No skills installed.'));
        return;
    }

    console.log(chalk.blue(`Found ${skills.length} installed skills.`));

    let shouldProceed = options.yes;
    if (!shouldProceed) {
        shouldProceed = await confirm({ message: 'Upgrade all skills?', default: true });
    }

    if (!shouldProceed) return;

    let successCount = 0;
    let failCount = 0;

    for (const skill of skills) {
        try {
            await upgradeSingleSkill(skillsDir, skill);
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
            noExit: true // Don't kill process on error
        });

    } catch (error) {
        // Error already logged by installSkill or above
        throw error;
    }
}
