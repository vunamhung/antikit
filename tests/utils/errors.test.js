import { describe, it, expect } from 'vitest';
import {
  AntikitError,
  ErrorCodes,
  skillNotFoundError,
  rateLimitError,
  sourceNotFoundError,
  wrapError,
  isErrorCode
} from '../../src/utils/errors.js';

describe('error utilities', () => {
  describe('AntikitError', () => {
    it('should create error with message and code', () => {
      const error = new AntikitError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AntikitError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should include context data', () => {
      const error = new AntikitError('Test', 'CODE', { foo: 'bar' });
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should have empty context by default', () => {
      const error = new AntikitError('Test', 'CODE');
      expect(error.context).toEqual({});
    });
  });

  describe('ErrorCodes', () => {
    it('should define all expected error codes', () => {
      expect(ErrorCodes.SKILL_NOT_FOUND).toBe('SKILL_NOT_FOUND');
      expect(ErrorCodes.SKILL_ALREADY_EXISTS).toBe('SKILL_ALREADY_EXISTS');
      expect(ErrorCodes.GITHUB_RATE_LIMIT).toBe('GITHUB_RATE_LIMIT');
      expect(ErrorCodes.SOURCE_NOT_FOUND).toBe('SOURCE_NOT_FOUND');
      expect(ErrorCodes.UNKNOWN).toBe('UNKNOWN');
    });
  });

  describe('skillNotFoundError', () => {
    it('should create skill not found error', () => {
      const error = skillNotFoundError('my-skill');
      expect(error.code).toBe(ErrorCodes.SKILL_NOT_FOUND);
      expect(error.message).toContain('my-skill');
      expect(error.context.skillName).toBe('my-skill');
    });

    it('should include source in message if provided', () => {
      const error = skillNotFoundError('my-skill', 'official');
      expect(error.message).toContain('official');
      expect(error.context.source).toBe('official');
    });
  });

  describe('rateLimitError', () => {
    it('should create rate limit error', () => {
      const error = rateLimitError();
      expect(error.code).toBe(ErrorCodes.GITHUB_RATE_LIMIT);
      expect(error.message).toContain('rate limit');
    });
  });

  describe('sourceNotFoundError', () => {
    it('should create source not found error', () => {
      const error = sourceNotFoundError('my-source');
      expect(error.code).toBe(ErrorCodes.SOURCE_NOT_FOUND);
      expect(error.message).toContain('my-source');
      expect(error.context.sourceName).toBe('my-source');
    });
  });

  describe('wrapError', () => {
    it('should return same error if already AntikitError', () => {
      const original = new AntikitError('Test', 'CODE');
      const wrapped = wrapError(original);
      expect(wrapped).toBe(original);
    });

    it('should wrap standard Error with context', () => {
      const original = new Error('Standard error');
      const wrapped = wrapError(original, { extra: 'data' });
      expect(wrapped).toBeInstanceOf(AntikitError);
      expect(wrapped.code).toBe(ErrorCodes.UNKNOWN);
      expect(wrapped.message).toBe('Standard error');
      expect(wrapped.context.extra).toBe('data');
      expect(wrapped.context.originalError).toBe(original);
    });

    it('should handle errors without message', () => {
      const original = {};
      const wrapped = wrapError(original);
      expect(wrapped.message).toBe('Unknown error occurred');
    });
  });

  describe('isErrorCode', () => {
    it('should return true for matching error code', () => {
      const error = new AntikitError('Test', ErrorCodes.SKILL_NOT_FOUND);
      expect(isErrorCode(error, ErrorCodes.SKILL_NOT_FOUND)).toBe(true);
    });

    it('should return false for non-matching error code', () => {
      const error = new AntikitError('Test', ErrorCodes.SKILL_NOT_FOUND);
      expect(isErrorCode(error, ErrorCodes.GITHUB_RATE_LIMIT)).toBe(false);
    });

    it('should return false for non-AntikitError', () => {
      const error = new Error('Standard');
      expect(isErrorCode(error, ErrorCodes.UNKNOWN)).toBe(false);
    });
  });
});
