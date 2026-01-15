import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { confirm } from '@inquirer/prompts';
import Table from 'cli-table3';
import { installSkill } from './install.js';
import { addSource } from '../utils/configManager.js';
import { skillExists } from '../utils/local.js';

export async function restoreSkills(backupPath, options = {}) {
    if (!backupPath) {
        console.log(chalk.red('Please specify a backup file to restore.'));
        console.log(chalk.dim('Usage: antikit restore <backup-file.json>'));
        process.exit(1);
    }

    if (!existsSync(backupPath)) {
        console.log(chalk.red(`Backup file not found: ${backupPath}`));
        process.exit(1);
    }

    // Load backup file
    let backupData;
    try {
        const content = readFileSync(backupPath, 'utf-8');
        backupData = JSON.parse(content);
    } catch (error) {
        console.log(chalk.red(`Invalid backup file: ${error.message}`));
        process.exit(1);
    }

    // Validate backup structure
    if (!backupData.skills || !Array.isArray(backupData.skills)) {
        console.log(chalk.red('Invalid backup format: missing skills array'));
        process.exit(1);
    }

    console.log(chalk.bold.cyan('\n📦 Restore from Backup\n'));
    console.log(chalk.dim('Backup Information:'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(`${chalk.cyan('Date:')} ${new Date(backupData.backupDate).toLocaleString()}`);
    console.log(`${chalk.cyan('Skills:')} ${backupData.totalSkills || backupData.skills.length}`);
    console.log(`${chalk.cyan('Sources:')} ${backupData.sources?.length || 0}`);
    console.log(chalk.dim('─'.repeat(50)));
    console.log();

    // Show skills to be restored
    displaySkillsPreview(backupData.skills);

    // Confirm restoration
    if (!options.yes) {
        const shouldRestore = await confirm({
            message: `Restore ${backupData.skills.length} skill(s)?`,
            default: true
        });

        if (!shouldRestore) {
            console.log(chalk.yellow('Restore cancelled.'));
            return;
        }
    }

    console.log();

    // Restore sources first (if any)
    if (backupData.sources && backupData.sources.length > 0 && !options.skipSources) {
        await restoreSources(backupData.sources);
    }

    // Restore skills
    await restoreSkillsList(backupData.skills, options);

    console.log();
    console.log(chalk.green.bold('✓ Restore completed!'));
    console.log();
}

function displaySkillsPreview(skills) {
    if (skills.length === 0) {
        console.log(chalk.yellow('No skills in backup.'));
        return;
    }

    console.log(chalk.bold('Skills to restore:\n'));

    const table = new Table({
        head: [chalk.cyan('Skill'), chalk.cyan('Version'), chalk.cyan('Source'), chalk.cyan('Status')],
        colWidths: [25, 12, 25, 15],
        wordWrap: true,
        style: { head: [], border: [] }
    });

    const previewCount = Math.min(10, skills.length);

    for (let i = 0; i < previewCount; i++) {
        const skill = skills[i];
        const status = skillExists(skill.name) ? chalk.yellow('Update') : chalk.green('New');

        table.push([
            chalk.bold(skill.name),
            skill.version || chalk.dim('N/A'),
            skill.sourceName || chalk.dim('local'),
            status
        ]);
    }

    console.log(table.toString());

    if (skills.length > previewCount) {
        console.log(chalk.dim(`\n... and ${skills.length - previewCount} more skills`));
    }

    console.log();
}

async function restoreSources(sources) {
    console.log(chalk.bold.cyan('📡 Restoring sources...\n'));

    let addedCount = 0;
    let skippedCount = 0;

    for (const source of sources) {
        // Skip default source (should already exist)
        if (source.default) {
            skippedCount++;
            continue;
        }

        try {
            addSource(
                source.name,
                source.owner,
                source.repo,
                source.branch || 'main',
                source.path || null
            );
            console.log(chalk.green(`✓ Added source: ${source.name}`));
            addedCount++;
        } catch (error) {
            // Source might already exist
            if (error.message.includes('already exists')) {
                console.log(chalk.dim(`⊙ Source already exists: ${source.name}`));
                skippedCount++;
            } else {
                console.log(chalk.yellow(`⚠ Failed to add source ${source.name}: ${error.message}`));
            }
        }
    }

    console.log(chalk.dim(`\nSources: ${addedCount} added, ${skippedCount} skipped\n`));
}

async function restoreSkillsList(skills, options) {
    console.log(chalk.bold.cyan('🔧 Installing skills...\n'));

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const skill of skills) {
        // Skip if already installed and not forcing
        if (skillExists(skill.name) && !options.force) {
            console.log(chalk.dim(`⊙ Skipping ${skill.name} (already installed)`));
            skipCount++;
            continue;
        }

        // Prepare install options
        const installOptions = {
            force: options.force || false,
            noExit: true
        };

        // Add source info if available
        if (skill.source && skill.source.owner && skill.source.repo) {
            installOptions.owner = skill.source.owner;
            installOptions.repo = skill.source.repo;
            installOptions.path = skill.source.path || null;
        }

        try {
            await installSkill(skill.name, installOptions);
            successCount++;
        } catch (error) {
            console.log(chalk.red(`✗ Failed to install ${skill.name}: ${error.message}`));
            failCount++;
        }
    }

    // Summary
    console.log('\n' + chalk.dim('─'.repeat(50)));
    console.log(chalk.bold('Restore Summary:'));
    console.log(`${chalk.green('Installed:')} ${successCount}`);
    if (skipCount > 0) console.log(`${chalk.dim('Skipped:')} ${skipCount}`);
    if (failCount > 0) console.log(`${chalk.red('Failed:')} ${failCount}`);
    console.log(chalk.dim('─'.repeat(50)));
}
