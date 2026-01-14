/**
 * Version utilities for antikit
 * Centralized version comparison and constants
 */

export const DEFAULT_VERSION = '0.0.0';

/**
 * Compare two semantic versions
 * @param {string} v1 - First version (e.g., '1.2.3')
 * @param {string} v2 - Second version (e.g., '1.2.4')
 * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;

  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Check if version string is valid semantic version
 * @param {string} version
 * @returns {boolean}
 */
export function isValidVersion(version) {
  if (!version || typeof version !== 'string') return false;
  return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version);
}

/**
 * Parse version from SKILL.md frontmatter content
 * @param {string} content - SKILL.md content
 * @returns {string} version or DEFAULT_VERSION
 */
export function parseVersionFromContent(content) {
  if (!content) return DEFAULT_VERSION;
  const match = content.match(/^version:\s*(.+)/m);
  return match ? match[1].trim() : DEFAULT_VERSION;
}
