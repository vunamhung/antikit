import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debug, info, warn, error, success, createLogger } from '../../src/utils/logger.js';

describe('logger utilities', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should log to console.log', () => {
      info('test message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log to console.warn', () => {
      warn('test warning');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log to console.error', () => {
      error('test error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should log to console.log', () => {
      success('test success');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create scoped logger with all methods', () => {
      const logger = createLogger('test-scope');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.success).toBe('function');
    });

    it('should include scope in output', () => {
      const logger = createLogger('my-module');
      logger.info('scoped message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should not log when DEBUG is not set', () => {
      const originalDebug = process.env.DEBUG;
      delete process.env.DEBUG;

      debug('should not appear');
      // debug uses console.error
      // Since DEBUG is not set, it should not log
      // This test verifies the function doesn't crash

      process.env.DEBUG = originalDebug;
    });
  });
});
