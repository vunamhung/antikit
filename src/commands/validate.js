import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export async function validateSkill(targetPath = '.') {
  const absolutePath = path.resolve(targetPath);

  // If targetPath is a file (SKILL.md), use it. Iterate up if needed
  let skillMdPath = absolutePath;
  if (!skillMdPath.endsWith('SKILL.md')) {
    skillMdPath = path.join(absolutePath, 'SKILL.md');
  }

  console.log(chalk.bold(`Inspecting: ${skillMdPath}\n`));

  if (!fs.existsSync(skillMdPath)) {
    console.error(chalk.red('❌ SKILL.md not found!'));
    console.log(
      chalk.dim('Make sure you are in the root directory of the skill or provide a path.')
    );
    process.exit(1);
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    console.error(chalk.red('❌ Missing or invalid YAML Frontmatter.'));
    console.log('File must start with:\n---\nkey: value\n---');
    process.exit(1);
  }

  const frontmatter = match[1];

  // Simple parser
  const parse = key => {
    const m = frontmatter.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : null;
  };

  const errors = [];
  const name = parse('name');
  const desc = parse('description');
  const version = parse('version');

  if (!name) errors.push('Missing "name" field');
  if (!desc) errors.push('Missing "description" field');
  if (!version) errors.push('Missing "version" field');

  if (errors.length > 0) {
    console.error(chalk.red('❌ Validation Failed:'));
    errors.forEach(e => console.error(chalk.red(`  - ${e}`)));
    process.exit(1);
  }

  // Validate dependencies format if exists
  if (frontmatter.includes('dependencies:')) {
    // Check indentation vaguely
    // const deps = frontmatter.match(/dependencies:\s*\n(\s+-\s+.+\n)+/);
    // Regex validation for list is hard, let's skip deep validation for now.
  }

  console.log(chalk.green('✅ Skill Metadata is Valid!'));
  console.log(chalk.dim('Name:       ') + chalk.cyan(name));
  console.log(chalk.dim('Version:    ') + chalk.cyan(version));
  console.log(chalk.dim('Description:') + desc);
}
