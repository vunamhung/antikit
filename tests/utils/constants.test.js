import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_SOURCE,
  SKILL_MD,
  METADATA_FILE,
  SKILLS_DIR,
  GITHUB_API,
  GITHUB_GRAPHQL,
  GITHUB_RAW,
  DEFAULT_BRANCH,
  MAX_DIRECTORY_DEPTH,
  CACHE_TTL,
  UPDATE_CHECK_INTERVAL,
  STATUS
} from '../../src/utils/constants.js';

describe('constants', () => {
  describe('source constants', () => {
    it('should define OFFICIAL_SOURCE', () => {
      expect(OFFICIAL_SOURCE).toBe('official');
    });

    it('should define DEFAULT_BRANCH', () => {
      expect(DEFAULT_BRANCH).toBe('main');
    });
  });

  describe('file constants', () => {
    it('should define SKILL_MD', () => {
      expect(SKILL_MD).toBe('SKILL.md');
    });

    it('should define METADATA_FILE', () => {
      expect(METADATA_FILE).toBe('.antikit-skill.json');
    });

    it('should define SKILLS_DIR', () => {
      expect(SKILLS_DIR).toBe('.agent/skills');
    });
  });

  describe('GitHub API constants', () => {
    it('should define valid GitHub API URLs', () => {
      expect(GITHUB_API).toBe('https://api.github.com');
      expect(GITHUB_GRAPHQL).toBe('https://api.github.com/graphql');
      expect(GITHUB_RAW).toBe('https://raw.githubusercontent.com');
    });
  });

  describe('timing constants', () => {
    it('should define CACHE_TTL as 1 hour', () => {
      expect(CACHE_TTL).toBe(1000 * 60 * 60);
    });

    it('should define UPDATE_CHECK_INTERVAL as 6 hours', () => {
      expect(UPDATE_CHECK_INTERVAL).toBe(1000 * 60 * 60 * 6);
    });
  });

  describe('limit constants', () => {
    it('should define MAX_DIRECTORY_DEPTH', () => {
      expect(MAX_DIRECTORY_DEPTH).toBe(50);
      expect(typeof MAX_DIRECTORY_DEPTH).toBe('number');
    });
  });

  describe('STATUS enum', () => {
    it('should define all status values', () => {
      expect(STATUS.INSTALLED).toBe('installed');
      expect(STATUS.UPDATE_AVAILABLE).toBe('update');
      expect(STATUS.NOT_INSTALLED).toBe('not_installed');
    });
  });
});
