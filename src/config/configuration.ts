import { RefactorOptions } from '../types';

/**
 * Centralized configuration management for the Angular refactorer
 */
export class Configuration {
  private options: Required<RefactorOptions>;

  constructor(options: RefactorOptions) {
    this.options = this.mergeWithDefaults(options);
    this.validate();
  }

  /**
   * Gets the complete configuration
   */
  getOptions(): Required<RefactorOptions> {
    return { ...this.options };
  }

  /**
   * Gets a specific configuration value
   */
  get<K extends keyof RefactorOptions>(key: K): Required<RefactorOptions>[K] {
    return this.options[key];
  }

  /**
   * Checks if smart services are enabled
   */
  isSmartServicesEnabled(): boolean {
    return this.options.smartServices;
  }

  /**
   * Checks if verbose mode is enabled
   */
  isVerbose(): boolean {
    return this.options.verbose;
  }

  /**
   * Checks if dry run mode is enabled
   */
  isDryRun(): boolean {
    return this.options.dryRun;
  }

  /**
   * Gets the root directory
   */
  getRootDir(): string {
    return this.options.rootDir;
  }

  /**
   * Gets include patterns
   */
  getIncludePatterns(): string[] {
    return [...this.options.include];
  }

  /**
   * Gets exclude patterns
   */
  getExcludePatterns(): string[] {
    return [...this.options.exclude];
  }

  /**
   * Merges user options with defaults
   */
  private mergeWithDefaults(options: RefactorOptions): Required<RefactorOptions> {
    return {
      include: ['**/*.ts', '**/*.html', '**/*.css', '**/*.scss'],
      exclude: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
      dryRun: false,
      verbose: false,
      smartServices: true,
      ...options
    };
  }

  /**
   * Validates the configuration
   */
  private validate(): void {
    if (!this.options.rootDir) {
      throw new Error('Root directory is required');
    }

    if (!Array.isArray(this.options.include) || this.options.include.length === 0) {
      throw new Error('Include patterns must be a non-empty array');
    }

    if (!Array.isArray(this.options.exclude)) {
      throw new Error('Exclude patterns must be an array');
    }

    // Validate that rootDir exists would require fs operations,
    // which we'll leave to the file discovery phase
  }
}
