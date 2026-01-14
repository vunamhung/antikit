import { describe, it, expect } from 'vitest';
import {
  compareVersions,
  isValidVersion,
  parseVersionFromContent,
  DEFAULT_VERSION
} from '../../src/utils/version.js';

describe('version utilities', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
    });

    it('should return 1 when v1 > v2', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    });

    it('should return -1 when v1 < v2', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.9.0', '1.10.0')).toBe(-1);
    });

    it('should handle missing parts as 0', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
    });

    it('should return 0 for null/undefined inputs', () => {
      expect(compareVersions(null, '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', null)).toBe(0);
      expect(compareVersions(undefined, undefined)).toBe(0);
    });
  });

  describe('isValidVersion', () => {
    it('should return true for valid semver versions', () => {
      expect(isValidVersion('1.0.0')).toBe(true);
      expect(isValidVersion('0.0.1')).toBe(true);
      expect(isValidVersion('10.20.30')).toBe(true);
      expect(isValidVersion('1.0.0-alpha')).toBe(true);
      expect(isValidVersion('1.0.0-beta.1')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(isValidVersion('')).toBe(false);
      expect(isValidVersion(null)).toBe(false);
      expect(isValidVersion(undefined)).toBe(false);
      expect(isValidVersion('1.0')).toBe(false);
      expect(isValidVersion('v1.0.0')).toBe(false);
      expect(isValidVersion('1.0.0.0')).toBe(false);
      expect(isValidVersion('abc')).toBe(false);
    });
  });

  describe('parseVersionFromContent', () => {
    it('should extract version from frontmatter', () => {
      const content = `---
name: test-skill
version: 1.2.3
description: A test skill
---
# Content`;
      expect(parseVersionFromContent(content)).toBe('1.2.3');
    });

    it('should return DEFAULT_VERSION if no version found', () => {
      const content = `---
name: test-skill
description: A test skill
---
# Content`;
      expect(parseVersionFromContent(content)).toBe(DEFAULT_VERSION);
    });

    it('should return DEFAULT_VERSION for empty/null content', () => {
      expect(parseVersionFromContent('')).toBe(DEFAULT_VERSION);
      expect(parseVersionFromContent(null)).toBe(DEFAULT_VERSION);
      expect(parseVersionFromContent(undefined)).toBe(DEFAULT_VERSION);
    });

    it('should handle version with leading/trailing spaces', () => {
      const content = `version:   2.0.0  `;
      expect(parseVersionFromContent(content)).toBe('2.0.0');
    });
  });

  describe('DEFAULT_VERSION', () => {
    it('should be 0.0.0', () => {
      expect(DEFAULT_VERSION).toBe('0.0.0');
    });
  });
});
