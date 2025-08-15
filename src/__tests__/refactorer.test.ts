import { AngularRefactorer } from '../refactorer';
import { AngularFileType, RefactorOptions } from '../types';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
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

  describe('file type detection', () => {
    it('should detect component files', () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-user-profile',
          templateUrl: './user-profile.component.html'
        })
        export class UserProfileComponent {}
      `;

      writeFileSync(join(tempDir, 'user-profile.component.ts'), componentContent);

      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType(
        join(tempDir, 'user-profile.component.ts'),
        componentContent
      );

      expect(fileType).toBe(AngularFileType.COMPONENT);
    });

    it('should detect service files', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        
        @Injectable({
          providedIn: 'root'
        })
        export class UserService {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('user.service.ts', serviceContent);

      expect(fileType).toBe(AngularFileType.SERVICE);
    });

    it('should detect directive files', () => {
      const directiveContent = `
        import { Directive } from '@angular/core';
        
        @Directive({
          selector: '[appHighlight]'
        })
        export class HighlightDirective {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('highlight.directive.ts', directiveContent);

      expect(fileType).toBe(AngularFileType.DIRECTIVE);
    });

    it('should detect spec files', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType(
        'user.component.spec.ts',
        'describe("UserComponent", () => {})'
      );

      expect(fileType).toBe(AngularFileType.SPEC);
    });

    it('should detect HTML template files', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('user.component.html', '<div>Hello World</div>');

      expect(fileType).toBe(AngularFileType.HTML_TEMPLATE);
    });
  });

  describe('refactor process', () => {
    it('should process files without errors', async () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-test',
          template: '<div>Test</div>'
        })
        export class TestComponent {}
      `;

      writeFileSync(join(tempDir, 'test.component.ts'), componentContent);

      const result = await refactorer.refactor();

      expect(result.errors).toHaveLength(0);
      expect(result.processedFiles).toHaveLength(1);
    });

    it('should handle empty directories', async () => {
      const result = await refactorer.refactor();

      expect(result.errors).toHaveLength(0);
      expect(result.processedFiles).toHaveLength(0);
      expect(result.renamedFiles).toHaveLength(0);
      expect(result.contentChanges).toHaveLength(0);
    });
  });
});
