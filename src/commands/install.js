import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getOrCreateSkillsDir, skillExists } from '../utils/local.js';
import { fetchRemoteSkills, getSkillCloneUrl } from '../utils/github.js';

const CACHE_DIR = join(homedir(), '.antikit');

export async function installSkill(skillName, options = {}) {
    // Get or create skills directory
    const skillsDir = getOrCreateSkillsDir();

    // Check if skill already exists
    if (skillExists(skillName) && !options.force) {
        console.log(chalk.yellow(`Skill "${skillName}" already exists.`));
        console.log(chalk.dim(`Use ${chalk.white('--force')} to overwrite.`));
        return;
    }

    const spinner = ora(`Finding "${skillName}"...`).start();

    try {
        let owner = options.owner;
        let repo = options.repo;

        // If owner/repo not provided, search in all sources
        if (!owner || !repo) {
            const remoteSkills = await fetchRemoteSkills();
            const skillInfo = remoteSkills.find(s => s.name === skillName);

            if (!skillInfo) {
                spinner.fail(`Skill "${skillName}" not found in any source`);
                console.log(chalk.dim(`Use ${chalk.white('antikit list')} to see available skills`));
                process.exit(1);
            }

            owner = skillInfo.owner;
            repo = skillInfo.repo;
            spinner.text = `Found in ${chalk.magenta(skillInfo.source)}, cloning...`;
        } else {
            spinner.text = `Cloning from ${owner}/${repo}...`;
        }

        // Clone to temp directory
        const tempDir = join(CACHE_DIR, 'temp', Date.now().toString());
        mkdirSync(tempDir, { recursive: true });

        const cloneUrl = getSkillCloneUrl(owner, repo);

        // Sparse checkout only the skill folder
        execSync(`git clone --depth 1 --filter=blob:none --sparse ${cloneUrl} repo`, {
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

        // Check if skill folder exists in the repo
        if (!existsSync(sourcePath)) {
            rmSync(tempDir, { recursive: true, force: true });
            spinner.fail(`Skill "${skillName}" not found in ${owner}/${repo}`);
            process.exit(1);
        }

        if (options.force && existsSync(destPath)) {
            rmSync(destPath, { recursive: true, force: true });
        }

        cpSync(sourcePath, destPath, { recursive: true });

        // Cleanup temp
        rmSync(tempDir, { recursive: true, force: true });

        spinner.succeed(`Installed ${chalk.cyan.bold(skillName)} from ${chalk.dim(`${owner}/${repo}`)}`);
        console.log(chalk.dim(`  → ${destPath}`));

    } catch (error) {
        spinner.fail(`Failed to install "${skillName}"`);
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

