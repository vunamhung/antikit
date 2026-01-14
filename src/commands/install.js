import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config.js';
import { findLocalSkillsDir, skillExists } from '../utils/local.js';
import { fetchRemoteSkills } from '../utils/github.js';

export async function installSkill(skillName, options) {
    const skillsDir = findLocalSkillsDir();

    if (!skillsDir) {
        console.log(chalk.red('No .agent/skills directory found in current path.'));
        console.log(chalk.dim('Make sure you are in a project with .agent/skills folder.'));
        process.exit(1);
    }

    // Check if skill already exists
    if (skillExists(skillName) && !options.force) {
        console.log(chalk.yellow(`Skill "${skillName}" already exists.`));
        console.log(chalk.dim(`Use ${chalk.white('--force')} to overwrite.`));
        return;
    }

    // Verify skill exists in remote
    const spinner = ora(`Checking if "${skillName}" exists...`).start();

    try {
        const remoteSkills = await fetchRemoteSkills();
        const skillInfo = remoteSkills.find(s => s.name === skillName);

        if (!skillInfo) {
            spinner.fail(`Skill "${skillName}" not found in remote repository`);
            console.log(chalk.dim(`Use ${chalk.white('antikit list')} to see available skills`));
            process.exit(1);
        }

        spinner.text = `Cloning ${skillName}...`;

        // Clone to temp directory
        const tempDir = join(CONFIG.CACHE_DIR, 'temp', Date.now().toString());
        mkdirSync(tempDir, { recursive: true });

        // Sparse checkout only the skill folder
        execSync(`git clone --depth 1 --filter=blob:none --sparse ${CONFIG.REPO_URL} repo`, {
            cwd: tempDir,
            stdio: 'pipe'
        });

        execSync(`git sparse-checkout set ${skillName}`, {
            cwd: join(tempDir, 'repo'),
            stdio: 'pipe'
        });

        // Copy skill to local
        const sourcePath = join(tempDir, 'repo', skillName);
        const destPath = join(skillsDir, skillName);

        if (options.force && existsSync(destPath)) {
            rmSync(destPath, { recursive: true, force: true });
        }

        cpSync(sourcePath, destPath, { recursive: true });

        // Cleanup temp
        rmSync(tempDir, { recursive: true, force: true });

        spinner.succeed(`Installed ${chalk.cyan.bold(skillName)}`);
        console.log(chalk.dim(`  → ${destPath}`));

    } catch (error) {
        spinner.fail(`Failed to install "${skillName}"`);
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}
