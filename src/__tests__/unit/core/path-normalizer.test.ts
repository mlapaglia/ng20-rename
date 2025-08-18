/**
 * Path Normalization Tests - Virtual File System
 *
 * Tests that import paths always use forward slashes, even when the underlying
 * OS file system uses backslashes (Windows). This is important because import
 * statements in JavaScript/TypeScript must always use forward slashes per the
 * ES module specification.
 */

import { VirtualFileSystem } from '../../testing/virtual-file-system';
import { ImportTestUtils, RenameTestUtils, TestScenarioBuilder } from '../../testing/test-utilities';

describe('Path Normalization - Import Slash Handling', () => {
  describe('Import Path Consistency', () => {
    it('should maintain forward slashes in import paths when working with subdirectories', () => {
      const scenario = new TestScenarioBuilder()
        .addFile(
          'src/plate/plate.ts',
          `
          export interface Plate {
            id: number;
            name: string;
          }
        `
        )
        .addFile(
          'src/plate.service.ts',
          `
          import { Injectable } from '@angular/core';
          import type { Plate } from './plate/plate';

          @Injectable({ providedIn: 'root' })
          export class PlateService {
            getPlate(): Plate {
              return { id: 1, name: 'Test Plate' };
            }
          }
        `
        );

      const vfs = scenario.getVirtualFileSystem();

      // Simulate the refactoring process
      simulateRefactoring(vfs);

      // Verify the service was renamed
      expect(vfs.exists('src/plate.ts')).toBe(true);
      expect(vfs.exists('src/plate.service.ts')).toBe(false);

      // Check that import statements maintain forward slashes
      const updatedServiceContent = vfs.readFile('src/plate.ts');

      // Extract import lines that reference subdirectories
      const importLines = updatedServiceContent
        .split('\n')
        .filter(line => line.includes('import') && line.includes('./plate'));

      for (const line of importLines) {
        // Should NOT contain backslashes in import paths
        expect(line).not.toMatch(/import.*['"`]\.\/plate\\plate/);
        // Should contain forward slashes
        expect(line).toMatch(/import.*['"`]\.\/plate\/plate/);
      }
    });

    it('should handle cross-directory imports with forward slashes', () => {
      const scenario = new TestScenarioBuilder()
        .addFile(
          'src/features/auth/auth.service.ts',
          `
          import { Injectable } from '@angular/core';
          
          @Injectable({ providedIn: 'root' })
          export class AuthService {
            login() {
              return true;
            }
          }
        `
        )
        .addFile(
          'src/login.component.ts',
          `
          import { Component } from '@angular/core';
          import { AuthService } from './features/auth/auth.service';
          
          @Component({
            selector: 'app-login',
            template: '<div>Login</div>'
          })
          export class LoginComponent {
            constructor(private authService: AuthService) {}
          }
        `
        );

      const vfs = scenario.getVirtualFileSystem();

      // Simulate the refactoring process
      simulateRefactoring(vfs);

      // Verify files were renamed
      expect(vfs.exists('src/features/auth/auth.ts')).toBe(true);
      expect(vfs.exists('src/login.ts')).toBe(true);

      // Check that nested path imports maintain forward slashes
      const updatedLoginContent = vfs.readFile('src/login.ts');
      const importLines = updatedLoginContent
        .split('\n')
        .filter(line => line.includes('import') && line.includes('./features/auth/'));

      for (const line of importLines) {
        // Should NOT contain backslashes
        expect(line).not.toMatch(/import.*['"`]\.\/features\\auth/);
        // Should contain forward slashes
        expect(line).toMatch(/import.*['"`]\.\/features\/auth/);
      }
    });
  });

  describe('Windows Path Simulation', () => {
    it('should maintain forward slashes even when simulating Windows paths', () => {
      const vfs = new VirtualFileSystem([
        {
          path: 'src/components/user-profile.component.ts',
          content: `import { Component } from '@angular/core';
          import { UtilService } from '../utils/util.service';

          @Component({
            selector: 'app-user-profile',
            templateUrl: './user-profile.component.html'
          })
          export class UserProfileComponent {
            constructor(private utilService: UtilService) {}
          }`
        },
        {
          path: 'src/components/user-profile.component.spec.ts',
          content: `import { TestBed } from '@angular/core/testing';
          import { UserProfileComponent } from './user-profile.component';

          describe('UserProfileComponent', () => {
            beforeEach(() => {
              TestBed.configureTestingModule({
                declarations: [UserProfileComponent]
              });
            });
          });`
        },
        {
          path: 'src/utils/util.service.ts',
          content: `import { Injectable } from '@angular/core';

          @Injectable({ providedIn: 'root' })
          export class UtilService {
            format(text: string): string {
              return text.toUpperCase();
            }
          }`
        }
      ]);

      // Enable Windows path simulation to test the edge case
      vfs.simulateWindowsPaths();

      // Simulate the refactoring process
      simulateRefactoring(vfs);

      // Check that spec file imports maintain forward slashes despite Windows simulation
      const updatedSpecContent = vfs.readFile('src/components/user-profile.spec.ts');
      const updatedComponentContent = vfs.readFile('src/components/user-profile.ts');

      // Check spec file imports
      const specImportLines = updatedSpecContent
        .split('\n')
        .filter(line => line.includes('import') && line.includes('./'));

      for (const line of specImportLines) {
        expect(line).not.toMatch(/import.*['"`]\.\\user-profile/);
        expect(line).toMatch(/import.*['"`]\.\/user-profile/);
      }

      // Check component imports to utils
      const componentImportLines = updatedComponentContent
        .split('\n')
        .filter(line => line.includes('import') && line.includes('../utils/'));

      for (const line of componentImportLines) {
        expect(line).not.toMatch(/import.*['"`]\.\.\\utils\\util/);
        expect(line).toMatch(/import.*['"`]\.\.\/utils\/util/);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed slash scenarios in import normalization', () => {
      // This tests the scenario where source code might have mixed separators
      // (which shouldn't happen in practice but we want to handle gracefully)
      const content = `import { TestBed } from '@angular/core/testing';
import { MixedComponent } from './some/path\\mixed.component';
import { AnotherService } from './another\\path/service.service';

describe('MixedComponent', () => {
  // test content
});`;

      // Normalize the content using our import utilities
      const normalizedContent = ImportTestUtils.normalizeImportPaths(content);
      const updatedContent = ImportTestUtils.updateImportPath(
        normalizedContent,
        './some/path/mixed.component',
        './some/path/mixed'
      );

      // Should normalize all paths to use forward slashes
      expect(updatedContent).toContain('./some/path/mixed');
      expect(updatedContent).not.toContain('./some/path\\mixed');

      expect(updatedContent).toContain('./another/path/service.service');
      expect(updatedContent).not.toContain('./another\\path/service.service');
    });

    it('should preserve correct forward slashes when they are already present', () => {
      const content = `import { TestBed } from '@angular/core/testing';
import { CorrectComponent } from './components/correct.component';
import { GoodService } from './services/good.service';

describe('CorrectComponent', () => {
  // test content
});`;

      const normalizedContent = ImportTestUtils.normalizeImportPaths(content);
      const updatedContent = ImportTestUtils.updateImportPath(
        normalizedContent,
        './components/correct.component',
        './components/correct'
      );

      // Should maintain forward slashes and update filename
      expect(updatedContent).toContain('./components/correct');
      expect(updatedContent).toContain('./services/good.service');

      // Verify no backslashes were introduced
      expect(updatedContent).not.toContain('\\');
    });
  });

  // Helper function to simulate the refactoring process
  function simulateRefactoring(vfs: VirtualFileSystem): void {
    const allFiles = vfs.getAllFiles();

    // Apply naming conventions to determine what should be renamed
    for (const filePath of allFiles) {
      const newPath = RenameTestUtils.applyNamingConventions(filePath);
      if (newPath !== filePath) {
        const finalPath = RenameTestUtils.simulateRename(vfs, filePath, newPath);

        // Perform the rename in the virtual file system
        const content = vfs.readFile(filePath);
        vfs.writeFile(finalPath, content);
        vfs.deleteFile(filePath);

        // Update imports in all files that reference the renamed file
        updateImportsForRenamedFile(vfs, filePath, finalPath);
      }
    }
  }

  function updateImportsForRenamedFile(vfs: VirtualFileSystem, oldPath: string, newPath: string): void {
    const allFiles = vfs.getAllFiles();

    for (const filePath of allFiles) {
      const content = vfs.readFile(filePath);
      const imports = ImportTestUtils.findRelativeImports(content);

      for (const imp of imports) {
        const resolvedPath = resolveImportPath(filePath, imp.modulePath);

        // Check if this import points to the renamed file
        if (pathsMatch(resolvedPath, oldPath)) {
          const newImportPath = calculateNewImportPath(filePath, newPath);
          const updatedContent = ImportTestUtils.updateImportPath(content, imp.modulePath, newImportPath);
          vfs.writeFile(filePath, updatedContent);
          break; // Only update once per file
        }
      }
    }
  }

  function resolveImportPath(fromFile: string, importPath: string): string {
    // Simplified path resolution
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));

    if (importPath.startsWith('./')) {
      return `${fromDir}/${importPath.substring(2)}.ts`;
    }
    if (importPath.startsWith('../')) {
      const parts = fromDir.split('/');
      const importParts = importPath.split('/');

      let upLevels = 0;
      for (const part of importParts) {
        if (part === '..') upLevels++;
        else break;
      }

      const resolvedParts = parts.slice(0, -upLevels);
      const remainingImportParts = importParts.slice(upLevels);

      return `${resolvedParts.join('/')}/${remainingImportParts.join('/')}.ts`;
    }

    return importPath;
  }

  function pathsMatch(path1: string, path2: string): boolean {
    // Remove .ts extension for comparison
    const normalize = (p: string) => p.replace(/\.ts$/, '');
    return normalize(path1) === normalize(path2);
  }

  function calculateNewImportPath(fromFile: string, toFile: string): string {
    // Simplified relative path calculation that always uses forward slashes
    const fromParts = fromFile.split('/').slice(0, -1); // Remove filename
    const toParts = toFile.split('/').slice(0, -1); // Remove filename
    const toFileName = toFile.split('/').pop()?.replace(/\.ts$/, '') || '';

    // Find common prefix
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    // Calculate relative path
    const upLevels = fromParts.length - commonLength;
    const downPath = toParts.slice(commonLength);

    const relativeParts = Array(upLevels).fill('..').concat(downPath);

    if (relativeParts.length === 0) {
      return `./${toFileName}`;
    }

    // Always use forward slashes in import paths
    return `${relativeParts.join('/')}/${toFileName}`;
  }
});
