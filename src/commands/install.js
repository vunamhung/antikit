import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getOrCreateSkillsDir, skillExists } from '../utils/local.js';
import { fetchRemoteSkills, getSkillCloneUrl } from '../utils/github.js';
import { DEFAULT_VERSION, parseVersionFromContent } from '../utils/version.js';
import { METADATA_FILE, SKILL_MD } from '../utils/constants.js';
import { debug } from '../utils/logger.js';
import { AntikitError, ErrorCodes } from '../utils/errors.js';

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
    let basePath = options.path;

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
      basePath = skillInfo.basePath;
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

    // Determine exact path of skill in repo
    const repoSkillPath = basePath ? `${basePath}/${skillName}` : skillName;

    execSync(`git sparse-checkout set ${repoSkillPath}`, {
      cwd: join(tempDir, 'repo'),
      stdio: 'pipe'
    });

    // Copy skill to local
    // Use split/join to handle OS path separators correctly for sourcePath
    const sourcePath = join(tempDir, 'repo', ...repoSkillPath.split('/'));
    const destPath = join(skillsDir, skillName);

    // Check if skill folder exists in the repo
    if (!existsSync(sourcePath)) {
      rmSync(tempDir, { recursive: true, force: true });
      spinner.fail(`Skill "${skillName}" not found in ${owner}/${repo}`);
      if (options.noExit) throw new Error('Skill not found');
      process.exit(1);
    }

    // --- Check dependencies ---
    try {
      const mdPath = join(sourcePath, SKILL_MD);
      if (existsSync(mdPath)) {
        const content = readFileSync(mdPath, 'utf-8');

        // Parse frontmatter dependencies
        // Supports inline: dependencies: [a, b]
        // Supports list:
        // dependencies:
        //   - a
        //   - b
        let deps = [];

        // Try inline
        const inlineMatch = content.match(/^dependencies:\s*\[(.*?)\]/m);
        if (inlineMatch) {
          deps = inlineMatch[1]
            .split(',')
            .map(s => s.trim().replace(/['"]/g, ''))
            .filter(Boolean);
        } else {
          // Try list
          const listMatch = content.match(/^dependencies:\s*\n((?:\s*-\s*.+\n?)+)/m);
          if (listMatch) {
            deps = listMatch[1]
              .split('\n')
              .map(l => l.replace(/^\s*-\s*/, '').trim())
              .filter(Boolean);
          }
        }

        if (deps.length > 0) {
          spinner.stop();
          console.log(chalk.blue(`\nSkill "${skillName}" requires: ${deps.join(', ')}`));

          for (const dep of deps) {
            // Prevent infinite recursion if self-referencing
            if (dep === skillName) continue;

            if (!skillExists(dep)) {
              console.log(chalk.dim(`Installing dependency: ${dep}...`));
              // Recursive install
              await installSkill(dep, {
                ...options,
                force: false,
                noExit: true // Don't exit on dependency failure, just log
              });
            }
          }
          spinner.start(`Resuming installation of "${skillName}"...`);
        }
      }
    } catch (e) {
      // Dep check failed, but continue installing main skill
      debug('Dependency check failed:', e.message);
    }

    if (options.force && existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }

    cpSync(sourcePath, destPath, { recursive: true });

    // Save skill metadata for future upgrades
    try {
      let version = DEFAULT_VERSION;
      const mdPath = join(destPath, SKILL_MD);
      if (existsSync(mdPath)) {
        const content = readFileSync(mdPath, 'utf-8');
        version = parseVersionFromContent(content);
      }

      const metadata = {
        name: skillName,
        source: {
          owner,
          repo,
          ...(basePath ? { path: basePath } : {})
        },
        version,
        installedAt: Date.now()
      };
      writeFileSync(join(destPath, METADATA_FILE), JSON.stringify(metadata, null, 2));
    } catch (e) {
      debug('Failed to write metadata:', e.message);
    }

    // Cleanup temp
    rmSync(tempDir, { recursive: true, force: true });

    spinner.succeed(
      `Installed ${chalk.cyan.bold(skillName)} from ${chalk.dim(`${owner}/${repo}`)}`
    );
    console.log(chalk.dim(`  → ${destPath}`));
  } catch (error) {
    spinner.fail(`Failed to install "${skillName}"`);
    console.error(chalk.red(error.message));
    if (options.noExit) {
      throw error;
    }
    process.exit(1);
  }
}
