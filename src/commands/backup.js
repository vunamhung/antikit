import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { confirm } from '@inquirer/prompts';
import { getLocalSkills, findLocalSkillsDir } from '../utils/local.js';
import { getSources, loadConfig } from '../utils/configManager.js';
import { METADATA_FILE } from '../utils/constants.js';
import { existsSync, readFileSync } from 'fs';

export async function backupSkills(outputPath, options = {}) {
    const skillsDir = findLocalSkillsDir();

    if (!skillsDir) {
        console.log(chalk.yellow('No .agent/skills directory found in current path.'));
        console.log(chalk.dim('Nothing to backup.'));
        return;
    }

    const skills = getLocalSkills();

    if (skills.length === 0 && !options.force) {
        console.log(chalk.yellow('No skills installed to backup.'));
        const shouldContinue = await confirm({
            message: 'Continue with empty backup?',
            default: false
        });
        if (!shouldContinue) {
            console.log(chalk.yellow('Backup cancelled.'));
            return;
        }
    }

    console.log(chalk.bold.cyan('\n💾 Creating backup...\n'));

    // Prepare backup data
    const backupData = {
        version: getPackageVersion(),
        backupDate: new Date().toISOString(),
        skillsDirectory: skillsDir,
        totalSkills: skills.length,
        skills: [],
        sources: getSources(),
        config: getConfigForBackup()
    };

    // Collect skill metadata
    for (const skill of skills) {
        const metaPath = join(skill.path, METADATA_FILE);
        const skillData = {
            name: skill.name,
            description: skill.description || null
        };

        if (existsSync(metaPath)) {
            try {
                const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
                skillData.version = meta.version || null;
                skillData.source = meta.source || null;
                skillData.sourceName = meta.sourceName || null;
                skillData.installedDate = meta.installedAt || null;
            } catch (error) {
                console.log(chalk.dim(`⚠️  Could not read metadata for ${skill.name}`));
            }
        }

        backupData.skills.push(skillData);
    }

    // Determine output path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultFilename = `antikit-backup-${timestamp}.json`;
    const finalPath = outputPath || defaultFilename;

    // Write backup file
    try {
        writeFileSync(finalPath, JSON.stringify(backupData, null, 2));

        console.log(chalk.green('✓ Backup created successfully!\n'));
        console.log(chalk.bold('Backup Summary:'));
        console.log(chalk.dim('─'.repeat(50)));
        console.log(`${chalk.cyan('File:')} ${finalPath}`);
        console.log(`${chalk.cyan('Skills:')} ${backupData.totalSkills}`);
        console.log(`${chalk.cyan('Sources:')} ${backupData.sources.length}`);
        console.log(`${chalk.cyan('Date:')} ${new Date(backupData.backupDate).toLocaleString()}`);
        console.log(chalk.dim('─'.repeat(50)));
        console.log();
        console.log(chalk.dim(`To restore: ${chalk.white(`antikit restore ${finalPath}`)}`));
        console.log();

    } catch (error) {
        console.error(chalk.red(`✗ Failed to create backup: ${error.message}`));
        process.exit(1);
    }
}

function getPackageVersion() {
    try {
        const pkgPath = join(process.cwd(), 'package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            return pkg.version || 'unknown';
        }
    } catch { }
    return 'unknown';
}

function getConfigForBackup() {
    try {
        const config = loadConfig();
        // Mask sensitive data
        return {
            githubToken: config.githubToken ? '***MASKED***' : null,
            sourcesCount: config.sources?.length || 0
        };
    } catch {
        return null;
    }
}
