import { existsSync, readdirSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config.js';
import { MAX_DIRECTORY_DEPTH, SKILL_MD } from './constants.js';
import { debug } from './logger.js';

/**
 * Find local skills directory by traversing up from cwd
 * Limited to MAX_DIRECTORY_DEPTH to prevent potential infinite loops
 */
export function findLocalSkillsDir() {
  let dir = process.cwd();
  let depth = 0;

  while (dir !== '/' && depth < MAX_DIRECTORY_DEPTH) {
    const skillsPath = join(dir, CONFIG.LOCAL_SKILLS_DIR);
    if (existsSync(skillsPath)) {
      return skillsPath;
    }
    dir = join(dir, '..');
    depth++;
  }

  if (depth >= MAX_DIRECTORY_DEPTH) {
    debug('Max directory depth reached while searching for skills directory');
  }

  return null;
}

/**
 * Get or create skills directory in current working directory
 */
export function getOrCreateSkillsDir() {
  // First try to find existing
  const existing = findLocalSkillsDir();
  if (existing) {
    return existing;
  }

  // Create in current directory
  const newPath = join(process.cwd(), CONFIG.LOCAL_SKILLS_DIR);
  mkdirSync(newPath, { recursive: true });
  return newPath;
}

/**
 * Get list of installed skills
 */
export function getLocalSkills() {
  const skillsDir = findLocalSkillsDir();

  if (!skillsDir) {
    return [];
  }

  const entries = readdirSync(skillsDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => {
      const skillPath = join(skillsDir, entry.name);
      const skillMdPath = join(skillPath, SKILL_MD);

      let description = null;
      if (existsSync(skillMdPath)) {
        const content = readFileSync(skillMdPath, 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          const descMatch = match[1].match(/description:\s*(.+)/);
          description = descMatch ? descMatch[1].trim() : null;
        }
      }

      return {
        name: entry.name,
        path: skillPath,
        description
      };
    });
}

/**
 * Check if skill exists locally
 */
export function skillExists(skillName) {
  const skillsDir = findLocalSkillsDir();
  if (!skillsDir) return false;

  const skillPath = join(skillsDir, skillName);
  return existsSync(skillPath);
}

/**
 * Remove a skill
 */
export function removeLocalSkill(skillName) {
  const skillsDir = findLocalSkillsDir();
  if (!skillsDir) {
    throw new Error('No .agent/skills directory found');
  }

  const skillPath = join(skillsDir, skillName);
  if (!existsSync(skillPath)) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  rmSync(skillPath, { recursive: true, force: true });
}
