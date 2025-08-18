import { Configuration } from '../../config/configuration';
import { RefactorOptions } from '../../types';

describe('Configuration', () => {
  describe('constructor and validation', () => {
    it('should create configuration with minimal options', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project'
      };

      const config = new Configuration(options);
      expect(config.getRootDir()).toBe('/test/project');
    });

    it('should merge with defaults', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project'
      };

      const config = new Configuration(options);
      const fullOptions = config.getOptions();

      expect(fullOptions.include).toEqual(['**/*.ts', '**/*.html', '**/*.css', '**/*.scss']);
      expect(fullOptions.exclude).toEqual(['node_modules/**', 'dist/**', '**/*.spec.ts']);
      expect(fullOptions.dryRun).toBe(false);
      expect(fullOptions.verbose).toBe(false);
      expect(fullOptions.smartServices).toBe(true);
    });

    it('should override defaults with provided options', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        include: ['**/*.ts'],
        exclude: ['dist/**'],
        dryRun: true,
        verbose: true,
        smartServices: false
      };

      const config = new Configuration(options);
      const fullOptions = config.getOptions();

      expect(fullOptions.include).toEqual(['**/*.ts']);
      expect(fullOptions.exclude).toEqual(['dist/**']);
      expect(fullOptions.dryRun).toBe(true);
      expect(fullOptions.verbose).toBe(true);
      expect(fullOptions.smartServices).toBe(false);
    });

    it('should throw error for missing rootDir', () => {
      const options = {} as RefactorOptions;

      expect(() => new Configuration(options)).toThrow('Root directory is required');
    });

    it('should throw error for empty include patterns', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        include: []
      };

      expect(() => new Configuration(options)).toThrow('Include patterns must be a non-empty array');
    });

    it('should throw error for non-array include patterns', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        include: 'not-an-array' as any
      };

      expect(() => new Configuration(options)).toThrow('Include patterns must be a non-empty array');
    });

    it('should throw error for non-array exclude patterns', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        exclude: 'not-an-array' as any
      };

      expect(() => new Configuration(options)).toThrow('Exclude patterns must be an array');
    });
  });

  describe('getOptions', () => {
    it('should return a copy of options object', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        include: ['**/*.ts'],
        dryRun: false
      };

      const config = new Configuration(options);
      const retrievedOptions = config.getOptions();

      // Modify the retrieved options object properties
      retrievedOptions.dryRun = true;
      retrievedOptions.verbose = true;

      // Original should be unchanged for primitive properties
      const originalOptions = config.getOptions();
      expect(originalOptions.dryRun).toBe(false);
      expect(originalOptions.verbose).toBe(false);
    });
  });

  describe('get', () => {
    it('should get specific configuration values', () => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        dryRun: true,
        verbose: false
      };

      const config = new Configuration(options);

      expect(config.get('rootDir')).toBe('/test/project');
      expect(config.get('dryRun')).toBe(true);
      expect(config.get('verbose')).toBe(false);
      expect(config.get('smartServices')).toBe(true); // default
    });
  });

  describe('convenience methods', () => {
    let config: Configuration;

    beforeEach(() => {
      const options: RefactorOptions = {
        rootDir: '/test/project',
        dryRun: true,
        verbose: true,
        smartServices: false
      };
      config = new Configuration(options);
    });

    it('should check if smart services are enabled', () => {
      expect(config.isSmartServicesEnabled()).toBe(false);
    });

    it('should check if verbose mode is enabled', () => {
      expect(config.isVerbose()).toBe(true);
    });

    it('should check if dry run mode is enabled', () => {
      expect(config.isDryRun()).toBe(true);
    });

    it('should get root directory', () => {
      expect(config.getRootDir()).toBe('/test/project');
    });

    it('should get include patterns copy', () => {
      const patterns = config.getIncludePatterns();
      patterns.push('new-pattern');

      // Original should be unchanged
      expect(config.getIncludePatterns()).not.toContain('new-pattern');
    });

    it('should get exclude patterns copy', () => {
      const patterns = config.getExcludePatterns();
      patterns.push('new-pattern');

      // Original should be unchanged
      expect(config.getExcludePatterns()).not.toContain('new-pattern');
    });
  });

  describe('default values', () => {
    it('should use correct default values', () => {
      const config = new Configuration({ rootDir: '/test' });
      const options = config.getOptions();

      expect(options.include).toEqual(['**/*.ts', '**/*.html', '**/*.css', '**/*.scss']);
      expect(options.exclude).toEqual(['node_modules/**', 'dist/**', '**/*.spec.ts']);
      expect(options.dryRun).toBe(false);
      expect(options.verbose).toBe(false);
      expect(options.smartServices).toBe(true);
    });
  });
});
