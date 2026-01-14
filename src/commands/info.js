import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { findLocalSkillsDir, skillExists } from '../utils/local.js';
import { fetchSkillInfo } from '../utils/github.js';

// Setup marked to render to terminal
marked.setOptions({
  renderer: new TerminalRenderer()
});

export async function showSkillInfo(skillName, options) {
  if (!skillName) {
    console.error(chalk.red('Please provide a skill name.'));
    process.exit(1);
  }

  // 1. Try Local First
  if (skillExists(skillName)) {
    const skillsDir = findLocalSkillsDir();
    const localSkillPath = path.join(skillsDir, skillName, 'SKILL.md');

    if (fs.existsSync(localSkillPath)) {
      console.log(chalk.bold.green(`\n📖 Viewing local docs for: ${skillName}\n`));
      const content = fs.readFileSync(localSkillPath, 'utf8');
      console.log(marked(content));
      return;
    }
  }

  // 2. Try Remote if not found locally
  console.log(chalk.yellow(`Skill "${skillName}" not found locally. Searching remote...`));
  const info = await fetchSkillInfo(skillName);

  if (info && info.content) {
    // Note: fetchSkillInfo currently returns parsed metadata (desc, version).
    // I need to update fetchSkillInfo or create a new internal function to get THE RAW CONTENT for rendering.
    // Wait, fetchSkillInfo in github.js calculates metadata from content but currently DOES NOT return the full content string.
    // I should update fetchSkillInfo to return 'raw' content as well.

    // Let's rely on the updated logic I'm about to add to github.js to return 'content'
    console.log(chalk.bold.blue(`\n📖 Viewing remote docs for: ${skillName}\n`));
    console.log(marked(info.content));
  } else {
    // Fallback if I haven't updated github.js yet or skill not found
    console.error(chalk.red(`\n❌ Skill "${skillName}" not found in any configured source.`));
  }
}
