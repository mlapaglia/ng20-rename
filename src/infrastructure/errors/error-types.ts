/**
 * Base class for all application errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  CONFIGURATION = 'configuration',
  FILE_SYSTEM = 'file_system',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  CONFLICT_RESOLUTION = 'conflict_resolution'
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIG_ERROR';
  readonly category = ErrorCategory.CONFIGURATION;
}

/**
 * File system operation errors
 */
export class FileSystemError extends AppError {
  readonly code = 'FS_ERROR';
  readonly category = ErrorCategory.FILE_SYSTEM;
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.VALIDATION;
}

/**
 * File processing errors
 */
export class ProcessingError extends AppError {
  readonly code = 'PROCESSING_ERROR';
  readonly category = ErrorCategory.PROCESSING;
}

/**
 * Conflict resolution errors
 */
export class ConflictResolutionError extends AppError {
  readonly code = 'CONFLICT_ERROR';
  readonly category = ErrorCategory.CONFLICT_RESOLUTION;
}
