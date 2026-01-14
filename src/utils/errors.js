/**
 * Custom error classes for antikit
 * Provides structured error handling with error codes
 */

/**
 * Base error class for antikit
 */
export class AntikitError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code (e.g., 'SKILL_NOT_FOUND')
   * @param {Object} [context] - Additional context data
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'AntikitError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Error codes enum
 */
export const ErrorCodes = {
  // Skill errors
  SKILL_NOT_FOUND: 'SKILL_NOT_FOUND',
  SKILL_ALREADY_EXISTS: 'SKILL_ALREADY_EXISTS',
  SKILL_INVALID_METADATA: 'SKILL_INVALID_METADATA',
  SKILL_MISSING_METADATA: 'SKILL_MISSING_METADATA',

  // Source errors
  SOURCE_NOT_FOUND: 'SOURCE_NOT_FOUND',
  SOURCE_ALREADY_EXISTS: 'SOURCE_ALREADY_EXISTS',
  SOURCE_CANNOT_REMOVE_DEFAULT: 'SOURCE_CANNOT_REMOVE_DEFAULT',

  // GitHub errors
  GITHUB_RATE_LIMIT: 'GITHUB_RATE_LIMIT',
  GITHUB_NOT_FOUND: 'GITHUB_NOT_FOUND',
  GITHUB_AUTH_FAILED: 'GITHUB_AUTH_FAILED',
  GITHUB_NETWORK_ERROR: 'GITHUB_NETWORK_ERROR',

  // Config errors
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',

  // Git errors
  GIT_CLONE_FAILED: 'GIT_CLONE_FAILED',
  GIT_NOT_INSTALLED: 'GIT_NOT_INSTALLED',

  // General errors
  INVALID_INPUT: 'INVALID_INPUT',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Create a skill not found error
 */
export function skillNotFoundError(skillName, source = null) {
  return new AntikitError(
    `Skill "${skillName}" not found${source ? ` in source "${source}"` : ''}`,
    ErrorCodes.SKILL_NOT_FOUND,
    { skillName, source }
  );
}

/**
 * Create a rate limit error
 */
export function rateLimitError() {
  return new AntikitError(
    'GitHub API rate limit exceeded. Configure a token to increase limits.',
    ErrorCodes.GITHUB_RATE_LIMIT
  );
}

/**
 * Create a source not found error
 */
export function sourceNotFoundError(sourceName) {
  return new AntikitError(`Source "${sourceName}" not found.`, ErrorCodes.SOURCE_NOT_FOUND, {
    sourceName
  });
}

/**
 * Wrap an unknown error with context
 */
export function wrapError(error, context = {}) {
  if (error instanceof AntikitError) {
    return error;
  }
  return new AntikitError(error.message || 'Unknown error occurred', ErrorCodes.UNKNOWN, {
    ...context,
    originalError: error
  });
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error, code) {
  return error instanceof AntikitError && error.code === code;
}
