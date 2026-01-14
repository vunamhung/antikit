import chalk from 'chalk';
import Table from 'cli-table3';
import { getLocalSkills, findLocalSkillsDir } from '../utils/local.js';
import fs from 'fs';
import path from 'path';

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

  const table = new Table({
    head: [chalk.cyan('Skill Name'), chalk.cyan('Version'), chalk.cyan('Description')],
    colWidths: [30, 15, Math.max(20, (process.stdout.columns || 80) - 55)],
    wordWrap: true,
    style: { head: [], border: [] }
  });

  skills.forEach(skill => {
    let version = 'local';

    // Try read .antikit-skill.json (installed metadata)
    try {
      const metaPath = path.join(skill.path, '.antikit-skill.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (meta.version) version = meta.version;
      } else {
        // Try read SKILL.md frontmatter
        const skillRef = path.join(skill.path, 'SKILL.md');
        if (fs.existsSync(skillRef)) {
          const content = fs.readFileSync(skillRef, 'utf8');
          const match = content.match(/version:\s*(.+)/);
          if (match) version = match[1].trim();
        }
      }
    } catch {}

    table.push([
      chalk.bold.green(skill.name),
      version === 'local' ? chalk.dim(version) : chalk.yellow(version),
      skill.description || chalk.dim('No description')
    ]);
  });

  console.log(chalk.bold(`\nInstalled Skills (${skills.length}) at ${chalk.gray(skillsDir)}`));
  console.log(table.toString());
  console.log();
}
