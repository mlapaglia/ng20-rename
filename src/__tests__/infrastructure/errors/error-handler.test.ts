import { ErrorHandler } from '../../../infrastructure/errors/error-handler';
import { 
  AppError, 
  ErrorCategory, 
  ConfigurationError, 
  FileSystemError, 
  ValidationError, 
  ProcessingError, 
  ConflictResolutionError 
} from '../../../infrastructure/errors/error-types';

describe('ErrorHandler', () => {
  describe('handleError', () => {
    it('should handle AppError instances', () => {
      const error = new ConfigurationError('Invalid config');
      const result = ErrorHandler.handleError(error, '/test/file.ts', 10);

      expect(result).toEqual({
        filePath: '/test/file.ts',
        message: '[CONFIG_ERROR] Invalid config',
        line: 10
      });
    });

    it('should handle regular Error instances', () => {
      const error = new Error('Something went wrong');
      const result = ErrorHandler.handleError(error, '/test/file.ts', 5);

      expect(result).toEqual({
        filePath: '/test/file.ts',
        message: 'Something went wrong',
        line: 5
      });
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const result = ErrorHandler.handleError(error, '/test/file.ts');

      expect(result).toEqual({
        filePath: '/test/file.ts',
        message: 'String error',
        line: undefined
      });
    });

    it('should handle null/undefined errors', () => {
      const result = ErrorHandler.handleError(null, '/test/file.ts');

      expect(result).toEqual({
        filePath: '/test/file.ts',
        message: 'null',
        line: undefined
      });
    });
  });

  describe('handleErrors', () => {
    it('should handle multiple errors', () => {
      const errors = [
        { error: new ConfigurationError('Config error'), filePath: '/test/config.ts', line: 1 },
        { error: new Error('Regular error'), filePath: '/test/other.ts', line: 2 },
        { error: 'String error', filePath: '/test/string.ts' }
      ];

      const results = ErrorHandler.handleErrors(errors);

      expect(results).toHaveLength(3);
      expect(results[0].message).toBe('[CONFIG_ERROR] Config error');
      expect(results[1].message).toBe('Regular error');
      expect(results[2].message).toBe('String error');
    });

    it('should handle empty error array', () => {
      const results = ErrorHandler.handleErrors([]);
      expect(results).toEqual([]);
    });
  });

  describe('isRecoverable', () => {
    it('should return false for configuration errors', () => {
      const error = new ConfigurationError('Config error');
      expect(ErrorHandler.isRecoverable(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error = new ValidationError('Validation error');
      expect(ErrorHandler.isRecoverable(error)).toBe(false);
    });

    it('should return true for file system errors', () => {
      const error = new FileSystemError('File not found');
      expect(ErrorHandler.isRecoverable(error)).toBe(true);
    });

    it('should return true for processing errors', () => {
      const error = new ProcessingError('Processing failed');
      expect(ErrorHandler.isRecoverable(error)).toBe(true);
    });

    it('should return true for conflict resolution errors', () => {
      const error = new ConflictResolutionError('Conflict occurred');
      expect(ErrorHandler.isRecoverable(error)).toBe(true);
    });

    it('should return true for regular errors', () => {
      const error = new Error('Regular error');
      expect(ErrorHandler.isRecoverable(error)).toBe(true);
    });

    it('should return true for unknown error types', () => {
      expect(ErrorHandler.isRecoverable('string error')).toBe(true);
      expect(ErrorHandler.isRecoverable(null)).toBe(true);
    });
  });

  describe('getSeverity', () => {
    it('should return critical for configuration errors', () => {
      const error = new ConfigurationError('Config error');
      expect(ErrorHandler.getSeverity(error)).toBe('critical');
    });

    it('should return critical for validation errors', () => {
      const error = new ValidationError('Validation error');
      expect(ErrorHandler.getSeverity(error)).toBe('critical');
    });

    it('should return high for file system errors', () => {
      const error = new FileSystemError('File error');
      expect(ErrorHandler.getSeverity(error)).toBe('high');
    });

    it('should return medium for processing errors', () => {
      const error = new ProcessingError('Processing error');
      expect(ErrorHandler.getSeverity(error)).toBe('medium');
    });

    it('should return low for conflict resolution errors', () => {
      const error = new ConflictResolutionError('Conflict error');
      expect(ErrorHandler.getSeverity(error)).toBe('low');
    });

    it('should return medium for regular errors', () => {
      const error = new Error('Regular error');
      expect(ErrorHandler.getSeverity(error)).toBe('medium');
    });

    it('should return medium for unknown error types', () => {
      expect(ErrorHandler.getSeverity('string error')).toBe('medium');
      expect(ErrorHandler.getSeverity(null)).toBe('medium');
    });
  });
});
