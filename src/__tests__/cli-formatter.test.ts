import { CliFormatter } from '../cli-formatter';
import { RefactorResult, RenamedFile, ContentChange, ManualReviewItem, RefactorError } from '../types';

describe('CliFormatter', () => {
  let formatter: CliFormatter;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    formatter = new CliFormatter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('printHeader', () => {
    it('should print a formatted header', () => {
      formatter.printHeader('Test Header');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Test Header'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('═'));
    });
  });

  describe('printSummary', () => {
    it('should print summary with all zero counts', () => {
      const result: RefactorResult = {
        processedFiles: [],
        renamedFiles: [],
        contentChanges: [],
        manualReviewRequired: [],
        errors: []
      };

      formatter.printSummary(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Summary'));
    });

    it('should print summary with various counts', () => {
      const result: RefactorResult = {
        processedFiles: ['/test/file1.ts', '/test/file2.ts'],
        renamedFiles: [
          {
            oldPath: '/test/old.ts',
            newPath: '/test/new.ts'
          }
        ],
        contentChanges: [
          {
            filePath: '/test/file.ts',
            line: 1,
            oldContent: 'old',
            newContent: 'new',
            reason: 'Test change'
          }
        ],
        manualReviewRequired: [
          {
            filePath: '/test/conflict.ts',
            desiredNewPath: '/test/target.ts',
            reason: 'Conflict',
            conflictType: 'naming_conflict'
          }
        ],
        errors: [
          {
            filePath: '/test/error.ts',
            message: 'Test error'
          }
        ]
      };

      formatter.printSummary(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Summary'));
    });
  });

  describe('printRenamedFiles', () => {
    it('should return early when no renamed files', () => {
      formatter.printRenamedFiles([]);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should print renamed files table', () => {
      const renamedFiles: RenamedFile[] = [
        {
          oldPath: '/test/old.component.ts',
          newPath: '/test/old.ts'
        },
        {
          oldPath: '/test/service.service.ts',
          newPath: '/test/service.ts'
        }
      ];

      formatter.printRenamedFiles(renamedFiles);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✏️  File Renames'));
    });
  });

  describe('printContentChanges', () => {
    it('should return early when no content changes', () => {
      formatter.printContentChanges([]);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should print content changes table', () => {
      const contentChanges: ContentChange[] = [
        {
          filePath: '/test/component.ts',
          line: 5,
          oldContent: "selector: 'userProfile'",
          newContent: "selector: 'app-user-profile'",
          reason: 'Component selector should use kebab-case with app prefix'
        },
        {
          filePath: '/test/service.ts',
          line: 10,
          oldContent: 'old import',
          newContent: 'new import',
          reason: 'Updated import path'
        }
      ];

      formatter.printContentChanges(contentChanges);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔄 Content Changes'));
    });
  });

  describe('printManualReviewItems', () => {
    it('should return early when no manual review required', () => {
      formatter.printManualReviewItems([]);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should print manual review items', () => {
      const manualReviewItems: ManualReviewItem[] = [
        {
          filePath: '/test/conflict.service.ts',
          desiredNewPath: '/test/conflict.ts',
          reason: 'Cannot rename - target file already exists',
          conflictType: 'naming_conflict'
        },
        {
          filePath: '/test/complex.service.ts',
          desiredNewPath: '/test/complex.ts',
          reason: 'Complex conflict requiring manual resolution',
          conflictType: 'naming_conflict'
        }
      ];

      formatter.printManualReviewItems(manualReviewItems);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Manual Review Required'));
    });
  });

  describe('printErrors', () => {
    it('should return early when no errors', () => {
      formatter.printErrors([]);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should print errors table', () => {
      const errors: RefactorError[] = [
        {
          filePath: '/test/broken.ts',
          message: 'Syntax error in file'
        },
        {
          filePath: '/test/permission.ts',
          message: 'Permission denied'
        }
      ];

      formatter.printErrors(errors);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Errors'));
    });
  });

  describe('printVerboseInfo', () => {
    it('should print verbose configuration info', () => {
      const options = {
        rootDir: '/test/project',
        dryRun: true,
        include: ['**/*.ts'],
        exclude: ['**/*.spec.ts']
      };

      formatter.printVerboseInfo(options);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚙️  Configuration'));
    });
  });

  describe('printSuccess', () => {
    it('should print success message', () => {
      formatter.printSuccess('Operation completed');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Operation completed'));
    });
  });

  describe('printWarning', () => {
    it('should print warning message', () => {
      formatter.printWarning('This is a warning');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('This is a warning'));
    });
  });

  describe('printError', () => {
    it('should print error message', () => {
      formatter.printError('This is an error');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('This is an error'));
    });
  });

  describe('printDryRunNotice', () => {
    it('should print dry run notice', () => {
      formatter.printDryRunNotice();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🧪 DRY RUN MODE'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No files were actually modified'));
    });
  });

  describe('printCompletionMessage', () => {
    it('should print dry run notice when dry run is true', () => {
      formatter.printCompletionMessage(true, true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🧪 DRY RUN MODE'));
    });

    it('should print success message when has changes and not dry run', () => {
      formatter.printCompletionMessage(true, false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Refactoring completed successfully'));
    });

    it('should print no changes message when no changes and not dry run', () => {
      formatter.printCompletionMessage(false, false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✨ No changes needed'));
    });
  });

  describe('edge cases', () => {
    it('should handle very long file paths', () => {
      const longPath =
        '/very/long/path/that/exceeds/normal/length/limits/and/should/be/handled/gracefully/component.ts';
      const renamedFiles: RenamedFile[] = [
        {
          oldPath: longPath,
          newPath: longPath.replace('.component.ts', '.ts')
        }
      ];

      formatter.printRenamedFiles(renamedFiles);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✏️  File Renames'));
    });

    it('should handle special characters in file paths', () => {
      const specialPath = '/test/file with spaces & special-chars.component.ts';
      const renamedFiles: RenamedFile[] = [
        {
          oldPath: specialPath,
          newPath: specialPath.replace('.component.ts', '.ts')
        }
      ];

      formatter.printRenamedFiles(renamedFiles);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✏️  File Renames'));
    });

    it('should handle empty strings and undefined values gracefully', () => {
      const contentChanges: ContentChange[] = [
        {
          filePath: '',
          line: 0,
          oldContent: '',
          newContent: '',
          reason: ''
        }
      ];

      formatter.printContentChanges(contentChanges);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔄 Content Changes'));
    });
  });
});
