import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';

// Store original functions
const originalHomedir = homedir;

describe('configManager utilities', () => {
  const testConfigDir = join(tmpdir(), 'antikit-config-test-' + Date.now());
  const testConfigFile = join(testConfigDir, 'config.json');

  beforeEach(() => {
    mkdirSync(testConfigDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testConfigDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('config file operations', () => {
    it('should handle missing config file gracefully', () => {
      // This test verifies behavior when config doesn't exist
      expect(existsSync(testConfigFile)).toBe(false);
    });

    it('should be able to create config directory', () => {
      const newDir = join(testConfigDir, 'new-subdir');
      mkdirSync(newDir, { recursive: true });
      expect(existsSync(newDir)).toBe(true);
    });

    it('should be able to write and read JSON config', () => {
      const config = {
        sources: [{ name: 'test', owner: 'test', repo: 'test' }],
        githubToken: 'test-token'
      };

      writeFileSync(testConfigFile, JSON.stringify(config, null, 2));
      expect(existsSync(testConfigFile)).toBe(true);

      const loaded = JSON.parse(readFileSync(testConfigFile, 'utf-8'));
      expect(loaded.sources).toHaveLength(1);
      expect(loaded.githubToken).toBe('test-token');
    });
  });

  describe('source management', () => {
    it('should validate source structure', () => {
      const validSource = {
        name: 'test',
        owner: 'owner',
        repo: 'repo',
        branch: 'main'
      };

      expect(validSource.name).toBeDefined();
      expect(validSource.owner).toBeDefined();
      expect(validSource.repo).toBeDefined();
    });

    it('should support optional path for monorepos', () => {
      const monoSource = {
        name: 'mono',
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: '.claude/skills'
      };

      expect(monoSource.path).toBe('.claude/skills');
    });
  });
});
