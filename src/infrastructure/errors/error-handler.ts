import { AppError, ErrorCategory } from './error-types';
import { RefactorError } from '../../types';

/**
 * Global error handler for the application
 */
export class ErrorHandler {
  /**
   * Handles an error and converts it to a RefactorError
   */
  static handleError(error: unknown, filePath: string, line?: number): RefactorError {
    if (error instanceof AppError) {
      return {
        filePath,
        message: `[${error.code}] ${error.message}`,
        line
      };
    }

    if (error instanceof Error) {
      return {
        filePath,
        message: error.message,
        line
      };
    }

    return {
      filePath,
      message: String(error),
      line
    };
  }

  /**
   * Handles multiple errors
   */
  static handleErrors(errors: Array<{ error: unknown; filePath: string; line?: number }>): RefactorError[] {
    return errors.map(({ error, filePath, line }) => this.handleError(error, filePath, line));
  }

  /**
   * Checks if an error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof AppError) {
      // Configuration and validation errors are typically not recoverable
      return error.category !== ErrorCategory.CONFIGURATION && error.category !== ErrorCategory.VALIDATION;
    }

    return true; // Assume other errors might be recoverable
  }

  /**
   * Gets error severity level
   */
  static getSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof AppError) {
      switch (error.category) {
        case ErrorCategory.CONFIGURATION:
        case ErrorCategory.VALIDATION:
          return 'critical';
        case ErrorCategory.FILE_SYSTEM:
          return 'high';
        case ErrorCategory.PROCESSING:
          return 'medium';
        case ErrorCategory.CONFLICT_RESOLUTION:
          return 'low';
        default:
          return 'medium';
      }
    }

    return 'medium';
  }
}
