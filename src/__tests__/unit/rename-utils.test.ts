/**
 * Unit Tests for File Renaming Utilities
 *
 * These tests focus solely on file renaming logic and naming conventions
 * without any file system operations.
 */

import { RenameTestUtils } from '../testing/test-utilities';
import { VirtualFileSystem } from '../testing/virtual-file-system';

describe('File Renaming Utils - Unit Tests', () => {
  describe('applyNamingConventions', () => {
    it('should remove .component suffix from component files', () => {
      const testCases = [
        { input: 'user-profile.component.ts', expected: 'user-profile.ts' },
        { input: 'src/app/user-profile.component.ts', expected: 'src/app/user-profile.ts' },
        { input: 'components/header.component.ts', expected: 'components/header.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should remove .service suffix from service files', () => {
      const testCases = [
        { input: 'user.service.ts', expected: 'user.ts' },
        { input: 'src/services/auth.service.ts', expected: 'src/services/auth.ts' },
        { input: 'api/data.service.ts', expected: 'api/data.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle spec files correctly', () => {
      const testCases = [
        { input: 'user.component.spec.ts', expected: 'user.spec.ts' },
        { input: 'auth.service.spec.ts', expected: 'auth.spec.ts' },
        { input: 'src/app/user.component.spec.ts', expected: 'src/app/user.spec.ts' },
        { input: 'services/data.service.spec.ts', expected: 'services/data.spec.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should preserve files that do not need renaming', () => {
      const testCases = [
        'user.model.ts',
        'app.config.ts',
        'constants.ts',
        'src/utils/helper.ts',
        'types/user.interface.ts',
        'guards/auth.guard.ts',
        'pipes/currency.pipe.ts',
        'directives/highlight.directive.ts'
      ];

      testCases.forEach(input => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(input);
      });
    });

    it('should handle different file extensions', () => {
      const testCases = [
        { input: 'user.component.html', expected: 'user.html' },
        { input: 'user.component.scss', expected: 'user.scss' },
        { input: 'user.component.css', expected: 'user.css' },
        { input: 'user.component.less', expected: 'user.less' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle complex nested paths', () => {
      const testCases = [
        {
          input: 'src/app/features/user/components/profile.component.ts',
          expected: 'src/app/features/user/components/profile.ts'
        },
        {
          input: 'projects/shared/services/api.service.ts',
          expected: 'projects/shared/services/api.ts'
        },
        {
          input: 'libs/core/components/header/header.component.spec.ts',
          expected: 'libs/core/components/header/header.spec.ts'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('simulateRename', () => {
    it('should return new path when no conflict exists', () => {
      const vfs = new VirtualFileSystem([{ path: 'src/user.component.ts', content: 'component content' }]);

      const result = RenameTestUtils.simulateRename(vfs, 'src/user.component.ts', 'src/user.ts');

      expect(result).toBe('src/user.ts');
    });

    it('should handle conflicts by generating appropriate suffixes', () => {
      const vfs = new VirtualFileSystem([
        { path: 'src/user.ts', content: 'existing user file' },
        { path: 'src/user.service.ts', content: 'service content' },
        { path: 'src/user.component.ts', content: 'component content' }
      ]);

      // Service trying to rename to user.ts (conflict with existing user.ts)
      const serviceResult = RenameTestUtils.simulateRename(vfs, 'src/user.service.ts', 'src/user.ts');
      // Should get some kind of suffix to resolve conflict
      expect(serviceResult).not.toBe('src/user.ts');
      expect(serviceResult).toMatch(/src\/user.+\.ts/);

      // Component trying to rename to user.ts (conflict with existing user.ts)
      const componentResult = RenameTestUtils.simulateRename(vfs, 'src/user.component.ts', 'src/user.ts');
      expect(componentResult).not.toBe('src/user.ts');
      expect(componentResult).toMatch(/src\/user.+\.ts/);
    });

    it('should handle multiple conflicts with incremental suffixes', () => {
      const vfs = new VirtualFileSystem([
        { path: 'src/data.ts', content: 'original' },
        { path: 'src/data-model.ts', content: 'model' },
        { path: 'src/data.model.ts', content: 'model file' }
      ]);

      const result = RenameTestUtils.simulateRename(vfs, 'src/data.model.ts', 'src/data.ts');

      // Should find a non-conflicting name
      expect(result).not.toBe('src/data.ts');
      expect(result).toMatch(/src\/data.+\.ts/);
    });

    it('should allow renaming to same path (no-op)', () => {
      const vfs = new VirtualFileSystem([{ path: 'src/user.ts', content: 'user content' }]);

      const result = RenameTestUtils.simulateRename(vfs, 'src/user.ts', 'src/user.ts');

      expect(result).toBe('src/user.ts');
    });

    it('should handle deep directory structures', () => {
      const vfs = new VirtualFileSystem([
        { path: 'src/app/features/user/models/user.ts', content: 'existing user model' },
        { path: 'src/app/features/user/services/user.service.ts', content: 'user service' }
      ]);

      const result = RenameTestUtils.simulateRename(
        vfs,
        'src/app/features/user/services/user.service.ts',
        'src/app/features/user/models/user.ts'
      );

      // Should resolve conflict with some suffix
      expect(result).not.toBe('src/app/features/user/models/user.ts');
      expect(result).toMatch(/src\/app\/features\/user\/models\/user.+\.ts/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle files without extensions', () => {
      const result = RenameTestUtils.applyNamingConventions('user.component');
      // For files without extensions, the .component should still be removed
      expect(result).toBe('user');
    });

    it('should handle files with multiple dots in name', () => {
      const testCases = [
        { input: 'user.profile.component.ts', expected: 'user.profile.ts' },
        { input: 'api.v1.service.ts', expected: 'api.v1.ts' },
        { input: 'config.dev.service.spec.ts', expected: 'config.dev.spec.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle root level files', () => {
      const testCases = [
        { input: 'app.component.ts', expected: 'app.ts' },
        { input: 'main.service.ts', expected: 'main.ts' },
        { input: 'index.ts', expected: 'index.ts' } // No change
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle empty and invalid paths gracefully', () => {
      const testCases = ['', '.', '..', '.ts', 'component.', '.component.ts'];

      testCases.forEach(input => {
        expect(() => RenameTestUtils.applyNamingConventions(input)).not.toThrow();
      });
    });

    it('should handle files with unusual naming patterns', () => {
      const testCases = [
        { input: 'component.component.ts', expected: 'component.ts' },
        { input: 'service.service.ts', expected: 'service.ts' },
        { input: 'spec.component.spec.ts', expected: 'spec.spec.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Naming Convention Consistency', () => {
    it('should consistently apply the same rules across different directories', () => {
      const baseName = 'user.component.ts';
      const directories = [
        '',
        'src/',
        'src/app/',
        'src/app/components/',
        'projects/shared/components/',
        'libs/ui/src/lib/components/'
      ];

      directories.forEach(dir => {
        const input = dir + baseName;
        const result = RenameTestUtils.applyNamingConventions(input);
        const expected = dir + 'user.ts';
        expect(result).toBe(expected);
      });
    });

    it('should handle mixed case file names consistently', () => {
      const testCases = [
        { input: 'UserProfile.component.ts', expected: 'UserProfile.ts' },
        { input: 'userProfile.service.ts', expected: 'userProfile.ts' },
        { input: 'USER_PROFILE.component.spec.ts', expected: 'USER_PROFILE.spec.ts' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = RenameTestUtils.applyNamingConventions(input);
        expect(result).toBe(expected);
      });
    });
  });
});
