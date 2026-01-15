import chalk from 'chalk';
import Table from 'cli-table3';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getLocalSkills, findLocalSkillsDir } from '../utils/local.js';
import { getSources } from '../utils/configManager.js';
import { METADATA_FILE } from '../utils/constants.js';

export async function showStats() {
    const skillsDir = findLocalSkillsDir();

    if (!skillsDir) {
        console.log(chalk.yellow('No .agent/skills directory found in current path.'));
        console.log(chalk.dim('Run this command from a project with .agent/skills folder.'));
        return;
    }

    const skills = getLocalSkills();
    const sources = getSources();

    console.log(chalk.bold.cyan('\n📊 Antikit Statistics\n'));
    console.log(chalk.dim(`Skills directory: ${skillsDir}\n`));

    // 1. Overview Stats
    displayOverview(skills, sources);

    if (skills.length > 0) {
        // 2. Source Distribution
        displaySourceDistribution(skills);

        // 3. Version Stats
        displayVersionStats(skills);

        // 4. Top Skills (by size or complexity)
        displayTopSkills(skills);
    }

    console.log();
}

function displayOverview(skills, sources) {
    const overview = new Table({
        head: [chalk.cyan('Metric'), chalk.cyan('Value')],
        colWidths: [30, 20],
        style: { head: [], border: [] }
    });

    overview.push(
        [chalk.bold('Total Skills Installed'), chalk.green.bold(skills.length.toString())],
        [chalk.bold('Total Sources Configured'), chalk.blue(sources.length.toString())],
        [
            chalk.bold('Skills with Metadata'),
            chalk.yellow(
                skills.filter(s => {
                    const metaPath = join(s.path, METADATA_FILE);
                    return existsSync(metaPath);
                }).length.toString()
            )
        ]
    );

    console.log(overview.toString());
    console.log();
}

function displaySourceDistribution(skills) {
    const sourceMap = new Map();

    skills.forEach(skill => {
        const metaPath = join(skill.path, METADATA_FILE);
        let sourceName = 'local';

        if (existsSync(metaPath)) {
            try {
                const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
                if (meta.source && meta.source.owner && meta.source.repo) {
                    // Use source name if available, otherwise owner/repo
                    sourceName = meta.sourceName || `${meta.source.owner}/${meta.source.repo}`;
                }
            } catch { }
        }

        sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1);
    });

    // Sort by count descending
    const sortedSources = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]);

    console.log(chalk.bold.cyan('📦 Skills by Source:\n'));

    const sourceTable = new Table({
        head: [chalk.cyan('Source'), chalk.cyan('Skills'), chalk.cyan('Percentage')],
        colWidths: [35, 12, 15],
        style: { head: [], border: [] }
    });

    const total = skills.length;
    sortedSources.forEach(([source, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const bar = '█'.repeat(Math.ceil((count / total) * 20));

        sourceTable.push([
            chalk.magenta(source),
            chalk.green(count.toString()),
            chalk.yellow(`${percentage}%`) + ' ' + chalk.dim(bar)
        ]);
    });

    console.log(sourceTable.toString());
    console.log();
}

function displayVersionStats(skills) {
    let withVersion = 0;
    let withoutVersion = 0;
    const versions = new Map();

    skills.forEach(skill => {
        const metaPath = join(skill.path, METADATA_FILE);

        if (existsSync(metaPath)) {
            try {
                const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
                if (meta.version) {
                    withVersion++;
                    // Track version patterns (major.minor.patch)
                    const major = meta.version.split('.')[0];
                    versions.set(major, (versions.get(major) || 0) + 1);
                } else {
                    withoutVersion++;
                }
            } catch {
                withoutVersion++;
            }
        } else {
            withoutVersion++;
        }
    });

    console.log(chalk.bold.cyan('🔢 Version Information:\n'));

    const versionTable = new Table({
        head: [chalk.cyan('Status'), chalk.cyan('Count')],
        colWidths: [35, 15],
        style: { head: [], border: [] }
    });

    versionTable.push(
        ['Skills with version info', chalk.green(withVersion.toString())],
        ['Skills without version info', chalk.dim(withoutVersion.toString())]
    );

    console.log(versionTable.toString());
    console.log();
}

function displayTopSkills(skills) {
    // Show skills sorted by name with their basic info
    const topCount = Math.min(5, skills.length);

    console.log(chalk.bold.cyan(`🌟 Installed Skills (showing ${topCount} of ${skills.length}):\n`));

    const topTable = new Table({
        head: [chalk.cyan('Skill Name'), chalk.cyan('Version'), chalk.cyan('Source')],
        colWidths: [30, 15, 25],
        wordWrap: true,
        style: { head: [], border: [] }
    });

    // Sort alphabetically and take top N
    const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name)).slice(0, topCount);

    sortedSkills.forEach(skill => {
        const metaPath = join(skill.path, METADATA_FILE);
        let version = chalk.dim('local');
        let source = chalk.dim('local');

        if (existsSync(metaPath)) {
            try {
                const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
                if (meta.version) version = chalk.yellow(meta.version);
                if (meta.source && meta.source.owner && meta.source.repo) {
                    source = chalk.magenta(meta.sourceName || `${meta.source.owner}/${meta.source.repo}`);
                }
            } catch { }
        }

        topTable.push([chalk.bold.cyan(skill.name), version, source]);
    });

    console.log(topTable.toString());

    if (skills.length > topCount) {
        console.log(chalk.dim(`\n... and ${skills.length - topCount} more. Use 'antikit local' to see all.`));
    }
}
