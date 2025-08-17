import {
  AppError,
  ErrorCategory,
  ConfigurationError,
  FileSystemError,
  ValidationError,
  ProcessingError,
  ConflictResolutionError
} from '../../../infrastructure/errors/error-types';

describe('Error Types', () => {
  describe('ErrorCategory', () => {
    it('should have correct enum values', () => {
      expect(ErrorCategory.CONFIGURATION).toBe('configuration');
      expect(ErrorCategory.FILE_SYSTEM).toBe('file_system');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.PROCESSING).toBe('processing');
      expect(ErrorCategory.CONFLICT_RESOLUTION).toBe('conflict_resolution');
    });
  });

  describe('AppError', () => {
    class TestAppError extends AppError {
      readonly code = 'TEST_ERROR';
      readonly category = ErrorCategory.PROCESSING;
    }

    it('should create error with message', () => {
      const error = new TestAppError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TestAppError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.category).toBe(ErrorCategory.PROCESSING);
      expect(error.context).toBeUndefined();
    });

    it('should create error with message and context', () => {
      const context = { file: 'test.ts', line: 10 };
      const error = new TestAppError('Test message', context);

      expect(error.message).toBe('Test message');
      expect(error.context).toEqual(context);
    });

    it('should maintain proper stack trace', () => {
      const error = new TestAppError('Test message');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestAppError');
    });

    it('should be instance of Error', () => {
      const error = new TestAppError('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ConfigurationError', () => {
    it('should have correct properties', () => {
      const error = new ConfigurationError('Config error');

      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.message).toBe('Config error');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should accept context', () => {
      const context = { configFile: 'app.config.ts' };
      const error = new ConfigurationError('Config error', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('FileSystemError', () => {
    it('should have correct properties', () => {
      const error = new FileSystemError('File not found');

      expect(error.code).toBe('FS_ERROR');
      expect(error.category).toBe(ErrorCategory.FILE_SYSTEM);
      expect(error.message).toBe('File not found');
      expect(error.name).toBe('FileSystemError');
    });

    it('should accept context', () => {
      const context = { path: '/test/file.ts' };
      const error = new FileSystemError('File not found', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('ValidationError', () => {
    it('should have correct properties', () => {
      const error = new ValidationError('Invalid input');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should accept context', () => {
      const context = { field: 'rootDir', value: null };
      const error = new ValidationError('Invalid input', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('ProcessingError', () => {
    it('should have correct properties', () => {
      const error = new ProcessingError('Processing failed');

      expect(error.code).toBe('PROCESSING_ERROR');
      expect(error.category).toBe(ErrorCategory.PROCESSING);
      expect(error.message).toBe('Processing failed');
      expect(error.name).toBe('ProcessingError');
    });

    it('should accept context', () => {
      const context = { step: 'parsing', file: 'component.ts' };
      const error = new ProcessingError('Processing failed', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('ConflictResolutionError', () => {
    it('should have correct properties', () => {
      const error = new ConflictResolutionError('Conflict occurred');

      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.category).toBe(ErrorCategory.CONFLICT_RESOLUTION);
      expect(error.message).toBe('Conflict occurred');
      expect(error.name).toBe('ConflictResolutionError');
    });

    it('should accept context', () => {
      const context = { existingFile: 'old.ts', newFile: 'new.ts' };
      const error = new ConflictResolutionError('Conflict occurred', context);

      expect(error.context).toEqual(context);
    });
  });
});
