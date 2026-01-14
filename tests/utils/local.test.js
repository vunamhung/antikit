import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock the config to use temp directory for tests
vi.mock('../../src/config.js', () => ({
  CONFIG: {
    LOCAL_SKILLS_DIR: '.agent/skills'
  }
}));

// Import after mocking
import {
  findLocalSkillsDir,
  getOrCreateSkillsDir,
  getLocalSkills,
  skillExists,
  removeLocalSkill
} from '../../src/utils/local.js';

describe('local utilities', () => {
  const testDir = join(tmpdir(), 'antikit-test-' + Date.now());
  const skillsDir = join(testDir, '.agent', 'skills');

  beforeEach(() => {
    // Create test directory structure
    mkdirSync(skillsDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('skillExists', () => {
    it('should return true if skill directory exists', () => {
      // Create a test skill
      const skillPath = join(skillsDir, 'test-skill');
      mkdirSync(skillPath, { recursive: true });

      // Mock cwd to be in test directory
      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      const exists = skillExists('test-skill');

      process.cwd = originalCwd;
      expect(exists).toBe(true);
    });

    it('should return false if skill does not exist', () => {
      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      const exists = skillExists('nonexistent-skill');

      process.cwd = originalCwd;
      expect(exists).toBe(false);
    });
  });

  describe('getLocalSkills', () => {
    it('should return empty array when no skills installed', () => {
      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      const skills = getLocalSkills();

      process.cwd = originalCwd;
      expect(skills).toEqual([]);
    });

    it('should return installed skills', () => {
      // Create test skills
      mkdirSync(join(skillsDir, 'skill-a'), { recursive: true });
      mkdirSync(join(skillsDir, 'skill-b'), { recursive: true });

      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      const skills = getLocalSkills();

      process.cwd = originalCwd;
      expect(skills.length).toBe(2);
      expect(skills.map(s => s.name).sort()).toEqual(['skill-a', 'skill-b']);
    });

    it('should ignore hidden directories', () => {
      mkdirSync(join(skillsDir, '.hidden-skill'), { recursive: true });
      mkdirSync(join(skillsDir, 'visible-skill'), { recursive: true });

      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      const skills = getLocalSkills();

      process.cwd = originalCwd;
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('visible-skill');
    });
  });

  describe('removeLocalSkill', () => {
    it('should remove existing skill', () => {
      const skillPath = join(skillsDir, 'skill-to-remove');
      mkdirSync(skillPath, { recursive: true });

      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      removeLocalSkill('skill-to-remove');

      process.cwd = originalCwd;
      expect(existsSync(skillPath)).toBe(false);
    });

    it('should throw error for non-existent skill', () => {
      const originalCwd = process.cwd;
      process.cwd = () => testDir;

      expect(() => removeLocalSkill('nonexistent')).toThrow();

      process.cwd = originalCwd;
    });
  });
});
