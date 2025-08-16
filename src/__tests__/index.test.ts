import {
  AngularRefactorer,
  RenameRule,
  FileNamingRule,
  ComponentNamingRule,
  DirectiveNamingRule,
  RefactorOptions,
  RefactorResult,
  getVersion,
  isAngularFile
} from '../index';

describe('index exports', () => {
  it('should export AngularRefactorer', () => {
    expect(AngularRefactorer).toBeDefined();
    expect(typeof AngularRefactorer).toBe('function');
  });

  it('should export RenameRule', () => {
    expect(RenameRule).toBeDefined();
    expect(typeof RenameRule).toBe('function');
  });

  it('should export FileNamingRule', () => {
    expect(FileNamingRule).toBeDefined();
    expect(typeof FileNamingRule).toBe('function');
  });

  it('should export ComponentNamingRule', () => {
    expect(ComponentNamingRule).toBeDefined();
    expect(typeof ComponentNamingRule).toBe('function');
  });

  it('should export DirectiveNamingRule', () => {
    expect(DirectiveNamingRule).toBeDefined();
    expect(typeof DirectiveNamingRule).toBe('function');
  });

  it('should export RefactorOptions type', () => {
    const options: RefactorOptions = {
      rootDir: '/test'
    };
    expect(options).toBeDefined();
  });

  it('should export RefactorResult type', () => {
    const result: RefactorResult = {
      processedFiles: [],
      renamedFiles: [],
      contentChanges: [],
      manualReviewRequired: [],
      errors: []
    };
    expect(result).toBeDefined();
  });
});

describe('utility functions', () => {
  describe('getVersion', () => {
    it('should return the current version', () => {
      expect(getVersion()).toBe('1.2.0');
    });
  });

  describe('isAngularFile', () => {
    it('should return true for Angular component files', () => {
      expect(isAngularFile('app.component.ts')).toBe(true);
      expect(isAngularFile('user.service.ts')).toBe(true);
      expect(isAngularFile('auth.directive.ts')).toBe(true);
      expect(isAngularFile('currency.pipe.ts')).toBe(true);
      expect(isAngularFile('app.module.ts')).toBe(true);
    });

    it('should return false for non-Angular files', () => {
      expect(isAngularFile('utils.ts')).toBe(false);
      expect(isAngularFile('config.js')).toBe(false);
      expect(isAngularFile('styles.css')).toBe(false);
      expect(isAngularFile('README.md')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isAngularFile('')).toBe(false);
      expect(isAngularFile('component.ts')).toBe(false);
      expect(isAngularFile('my.component.ts.backup')).toBe(false);
    });
  });
});
