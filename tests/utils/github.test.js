import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock dependencies
vi.mock('../../src/utils/configManager.js', () => ({
  getSources: () => [
    {
      name: 'official',
      owner: 'vunamhung',
      repo: 'antiskills',
      branch: 'main'
    }
  ],
  getToken: () => null
}));

vi.mock('../../src/utils/logger.js', () => ({
  debug: vi.fn()
}));

import { fetchRemoteSkills, fetchSkillInfo, getSkillCloneUrl } from '../../src/utils/github.js';

describe('github utilities', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSkillCloneUrl', () => {
    it('should generate correct clone URL', () => {
      const url = getSkillCloneUrl('owner', 'repo');
      expect(url).toBe('https://github.com/owner/repo.git');
    });

    it('should handle various owner/repo names', () => {
      expect(getSkillCloneUrl('my-org', 'my-repo')).toBe('https://github.com/my-org/my-repo.git');
      expect(getSkillCloneUrl('user123', 'project_name')).toBe(
        'https://github.com/user123/project_name.git'
      );
    });
  });

  describe('fetchRemoteSkills', () => {
    it('should return empty array when API returns empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const skills = await fetchRemoteSkills();
      expect(Array.isArray(skills)).toBe(true);
    });

    it('should filter out hidden directories', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          { name: 'visible-skill', type: 'dir', html_url: 'http://...', path: 'visible-skill' },
          { name: '.hidden', type: 'dir', html_url: 'http://...', path: '.hidden' }
        ]
      });

      const skills = await fetchRemoteSkills();
      expect(skills.some(s => s.name === '.hidden')).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' })
      });

      const skills = await fetchRemoteSkills();
      expect(skills).toEqual([]);
    });

    it('should handle rate limit response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'API rate limit exceeded' })
      });

      // Should not throw, just return empty
      const skills = await fetchRemoteSkills();
      expect(skills).toEqual([]);
    });
  });

  describe('fetchSkillInfo', () => {
    it('should return null when skill not found', async () => {
      // First call for fetchRemoteSkills returns empty
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const info = await fetchSkillInfo('nonexistent-skill');
      expect(info).toBeNull();
    });

    it('should parse frontmatter correctly', async () => {
      const skillContent = `---
name: test-skill
version: 1.2.3
description: A test skill
---
# Instructions`;

      // First call for skill list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: 'test-skill',
            type: 'dir',
            html_url: 'http://...',
            path: 'test-skill'
          }
        ]
      });

      // Second call for SKILL.md content (raw URL)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => skillContent
      });

      const info = await fetchSkillInfo('test-skill');
      expect(info).not.toBeNull();
      expect(info.version).toBe('1.2.3');
      expect(info.description).toBe('A test skill');
    });
  });
});
