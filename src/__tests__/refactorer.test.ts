import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('AngularRefactorer', () => {
  let tempDir: string;
  let refactorer: AngularRefactorer;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ng20-rename-test-'));
    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: true,
      verbose: false
    };
    refactorer = new AngularRefactorer(options);
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('integration tests', () => {
    it('should process component files correctly', async () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-user-profile',
          templateUrl: './user-profile.component.html',
          styleUrls: ['./user-profile.component.css']
        })
        export class UserProfileComponent {}
      `;

      writeFileSync(join(tempDir, 'user-profile.component.ts'), componentContent);

      const result = await refactorer.refactor();

      expect(result.processedFiles).toHaveLength(1);
      expect(result.renamedFiles).toHaveLength(1);
      expect(result.renamedFiles[0].newPath).toContain('user-profile.ts');
      expect(result.contentChanges).toHaveLength(2); // templateUrl and styleUrls
      expect(result.errors).toHaveLength(0);
    });

    it('should handle service files with smart domain detection', async () => {
      const serviceContent = `
        import { Injectable, inject } from '@angular/core';
        import { MatSnackBar } from '@angular/material/snack-bar';
        
        @Injectable({ providedIn: 'root' })
        export class NotificationService {
          private readonly snackBar = inject(MatSnackBar);
          
          show(message: string) {
            this.snackBar.open(message);
          }
        }
      `;

      writeFileSync(join(tempDir, 'notification.service.ts'), serviceContent);

      const result = await refactorer.refactor();

      expect(result.processedFiles).toHaveLength(1);
      expect(result.renamedFiles).toHaveLength(1);
      expect(result.renamedFiles[0].newPath).toContain('notification-notifications.ts');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle smart services disabled', async () => {
      const refactorerNoSmart = new AngularRefactorer({
        rootDir: tempDir,
        dryRun: true,
        smartServices: false
      });

      const serviceContent = `
        import { Injectable } from '@angular/core';
        @Injectable() export class TestService {}
      `;

      writeFileSync(join(tempDir, 'test.service.ts'), serviceContent);

      const result = await refactorerNoSmart.refactor();

      expect(result.processedFiles).toHaveLength(1);
      expect(result.renamedFiles).toHaveLength(1);
      expect(result.renamedFiles[0].newPath).toContain('test.ts'); // No domain suffix
    });

    it('should handle empty directories', async () => {
      const result = await refactorer.refactor();

      expect(result.errors).toHaveLength(0);
      expect(result.processedFiles).toHaveLength(0);
      expect(result.renamedFiles).toHaveLength(0);
      expect(result.contentChanges).toHaveLength(0);
    });

    it('should handle naming conflicts', async () => {
      // Create conflicting files
      writeFileSync(join(tempDir, 'user.ts'), 'export class User {}');
      writeFileSync(
        join(tempDir, 'user.service.ts'),
        'import { Injectable } from "@angular/core"; @Injectable() export class UserService {}'
      );

      const result = await refactorer.refactor();

      expect(result.processedFiles).toHaveLength(2);
      expect(result.manualReviewRequired).toHaveLength(1);
      expect(result.manualReviewRequired[0].conflictType).toBe('naming_conflict');
    });

    it('should process multiple file types', async () => {
      // Create various Angular files
      writeFileSync(join(tempDir, 'test.component.ts'), '@Component({}) export class TestComponent {}');

      writeFileSync(join(tempDir, 'test.service.ts'), '@Injectable() export class TestService {}');

      writeFileSync(join(tempDir, 'test.directive.ts'), '@Directive({}) export class TestDirective {}');

      writeFileSync(join(tempDir, 'test.html'), '<div>Test</div>');
      writeFileSync(join(tempDir, 'test.css'), '.test { color: red; }');

      const result = await refactorer.refactor();

      expect(result.processedFiles.length).toBeGreaterThan(3);
      expect(result.renamedFiles.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle file processing errors gracefully', async () => {
      // Create a file with invalid TypeScript that might cause processing errors
      writeFileSync(join(tempDir, 'invalid.component.ts'), 'invalid typescript content @Component');

      const result = await refactorer.refactor();

      // Should still process the file without throwing
      expect(result.processedFiles).toHaveLength(1);
      expect(result.errors).toHaveLength(0); // Our current implementation is resilient
    });

    it('should respect dry run mode', async () => {
      const componentContent = '@Component({}) export class TestComponent {}';
      const filePath = join(tempDir, 'test.component.ts');

      writeFileSync(filePath, componentContent);

      await refactorer.refactor();

      // File should not be renamed in dry run mode
      expect(readFileSync(filePath, 'utf-8')).toBe(componentContent);
    });

    it('should actually rename files when not in dry run mode', async () => {
      const realRefactorer = new AngularRefactorer({
        rootDir: tempDir,
        dryRun: false,
        verbose: false
      });

      const componentContent = '@Component({}) export class TestComponent {}';
      const oldPath = join(tempDir, 'test.component.ts');
      const newPath = join(tempDir, 'test.ts');

      writeFileSync(oldPath, componentContent);

      await realRefactorer.refactor();

      // Old file should not exist, new file should exist
      expect(() => readFileSync(oldPath, 'utf-8')).toThrow();
      expect(readFileSync(newPath, 'utf-8')).toBeDefined();
    });
  });
});
