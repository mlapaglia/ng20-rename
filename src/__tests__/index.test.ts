import {
  AngularRefactorer,
  RenameRule,
  FileNamingRule,
  ComponentNamingRule,
  DirectiveNamingRule,
  RefactorOptions,
  RefactorResult
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
      errors: []
    };
    expect(result).toBeDefined();
  });
});
