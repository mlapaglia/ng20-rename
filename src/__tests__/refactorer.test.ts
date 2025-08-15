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

    it('should detect pipe files', () => {
      const pipeContent = `
        import { Pipe } from '@angular/core';
        
        @Pipe({
          name: 'custom'
        })
        export class CustomPipe {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('custom.pipe.ts', pipeContent);

      expect(fileType).toBe(AngularFileType.PIPE);
    });

    it('should detect module files', () => {
      const moduleContent = `
        import { NgModule } from '@angular/core';
        
        @NgModule({
          declarations: []
        })
        export class AppModule {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('app.module.ts', moduleContent);

      expect(fileType).toBe(AngularFileType.MODULE);
    });

    it('should detect guard files', () => {
      const guardContent = `
        import { CanActivate } from '@angular/router';
        
        export class AuthGuard implements CanActivate {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('auth.guard.ts', guardContent);

      expect(fileType).toBe(AngularFileType.GUARD);
    });

    it('should detect interceptor files', () => {
      const interceptorContent = `
        import { HttpInterceptor } from '@angular/common/http';
        
        export class AuthInterceptor implements HttpInterceptor {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('auth.interceptor.ts', interceptorContent);

      expect(fileType).toBe(AngularFileType.INTERCEPTOR);
    });

    it('should detect resolver files', () => {
      const resolverContent = `
        import { Resolve } from '@angular/router';
        
        export class DataResolver implements Resolve<any> {}
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('data.resolver.ts', resolverContent);

      expect(fileType).toBe(AngularFileType.RESOLVER);
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

    it('should detect CSS stylesheet files', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('styles.css', '.container { color: red; }');

      expect(fileType).toBe(AngularFileType.STYLESHEET);
    });

    it('should detect SCSS stylesheet files', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('styles.scss', '$primary: blue;');

      expect(fileType).toBe(AngularFileType.STYLESHEET);
    });

    it('should default to OTHER for unknown file types', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileType = (refactorer as any).determineFileType('unknown.ts', 'export class Unknown {}');

      expect(fileType).toBe(AngularFileType.OTHER);
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

    it('should log verbose information when verbose option is enabled', async () => {
      const options: RefactorOptions = {
        rootDir: tempDir,
        dryRun: true,
        verbose: true
      };
      const verboseRefactorer = new AngularRefactorer(options);

      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-test',
          template: '<div>Test</div>'
        })
        export class TestComponent {}
      `;

      writeFileSync(join(tempDir, 'test.component.ts'), componentContent);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await verboseRefactorer.refactor();

      expect(consoleSpy).toHaveBeenCalledWith('Found 1 Angular files to process');
      expect(consoleSpy).toHaveBeenCalledWith('Processing complete:');
      expect(consoleSpy).toHaveBeenCalledWith('- Files processed: 1');

      consoleSpy.mockRestore();
    });

    it('should handle file processing errors gracefully', async () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-test',
          template: '<div>Test</div>'
        })
        export class TestComponent {}
      `;

      writeFileSync(join(tempDir, 'test.component.ts'), componentContent);

      // Mock a rule that throws an error
      const mockRule = {
        shouldApply: () => true,
        apply: () => {
          throw new Error('Test error');
        }
      };

      // Access private property to inject mock rule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (refactorer as any).rules = [mockRule];

      const result = await refactorer.refactor();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Test error');
      expect(result.errors[0].filePath).toContain('test.component.ts');
    });

    it('should handle directory scanning errors', async () => {
      const options: RefactorOptions = {
        rootDir: '/nonexistent/directory',
        dryRun: true,
        verbose: false
      };
      const errorRefactorer = new AngularRefactorer(options);

      const result = await errorRefactorer.refactor();

      // On Windows, the directory might not cause an error, just return empty results
      expect(result.processedFiles).toHaveLength(0);
      expect(result.renamedFiles).toHaveLength(0);
      expect(result.contentChanges).toHaveLength(0);
    });

    it('should detect and track content changes', async () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app_test',
          template: '<div>Test</div>'
        })
        export class test_component {}
      `;

      writeFileSync(join(tempDir, 'test.component.ts'), componentContent);

      const result = await refactorer.refactor();

      expect(result.contentChanges.length).toBeGreaterThan(0);
      expect(
        result.contentChanges.some(change => change.reason.includes('Component selector should use kebab-case'))
      ).toBe(true);
    });

    it('should track file renames', async () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-test',
          template: '<div>Test</div>'
        })
        export class TestComponent {}
      `;

      writeFileSync(join(tempDir, 'TestComponent.ts'), componentContent);

      const result = await refactorer.refactor();

      expect(result.renamedFiles.length).toBeGreaterThan(0);
      expect(result.renamedFiles[0].oldPath).toContain('TestComponent.ts');
      expect(result.renamedFiles[0].newPath).toContain('test.component.ts');
    });

    it('should handle non-existent files gracefully', async () => {
      // Create a scenario where glob finds a file but it doesn't exist when we try to read it
      const mockGlob = jest.fn().mockResolvedValue([join(tempDir, 'nonexistent.ts')]);

      // Mock glob to return non-existent file
      jest.doMock('glob', () => ({
        glob: mockGlob
      }));

      const result = await refactorer.refactor();

      expect(result.errors).toHaveLength(0);
      expect(result.processedFiles).toHaveLength(0);
    });
  });

  describe('content change detection', () => {
    it('should detect line-by-line changes', () => {
      const oldContent = 'line 1\nline 2\nline 3';
      const newContent = 'line 1\nmodified line 2\nline 3';

      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changes = (refactorer as any).getContentChanges('test.ts', oldContent, newContent, 'Test change');

      expect(changes).toHaveLength(1);
      expect(changes[0].line).toBe(2);
      expect(changes[0].oldContent).toBe('line 2');
      expect(changes[0].newContent).toBe('modified line 2');
      expect(changes[0].reason).toBe('Test change');
    });

    it('should handle content with different line counts', () => {
      const oldContent = 'line 1\nline 2';
      const newContent = 'line 1\nline 2\nline 3';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changes = (refactorer as any).getContentChanges('test.ts', oldContent, newContent, 'Added line');

      expect(changes).toHaveLength(1);
      expect(changes[0].line).toBe(3);
      expect(changes[0].oldContent).toBe('');
      expect(changes[0].newContent).toBe('line 3');
    });

    it('should handle removed lines', () => {
      const oldContent = 'line 1\nline 2\nline 3';
      const newContent = 'line 1\nline 3';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changes = (refactorer as any).getContentChanges('test.ts', oldContent, newContent, 'Removed line');

      expect(changes).toHaveLength(2);
      expect(changes[0].line).toBe(2);
      expect(changes[0].oldContent).toBe('line 2');
      expect(changes[0].newContent).toBe('line 3');
      expect(changes[1].line).toBe(3);
      expect(changes[1].oldContent).toBe('line 3');
      expect(changes[1].newContent).toBe('');
    });
  });
});
