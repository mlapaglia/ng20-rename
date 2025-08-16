import { FileDiscovery } from '../../core/file-discovery';
import { AngularFileType, RefactorOptions } from '../../types';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileDiscovery', () => {
  let tempDir: string;
  let fileDiscovery: FileDiscovery;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'file-discovery-test-'));
    const options: Required<RefactorOptions> = {
      rootDir: tempDir,
      include: ['**/*.ts', '**/*.html', '**/*.css', '**/*.scss'],
      exclude: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
      dryRun: false,
      verbose: false,
      smartServices: true
    };
    fileDiscovery = new FileDiscovery(options);
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('determineFileType', () => {
    it('should detect component files', () => {
      const componentContent = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'app-user-profile',
          templateUrl: './user-profile.component.html'
        })
        export class UserProfileComponent {}
      `;

      const fileType = fileDiscovery.determineFileType(join(tempDir, 'user-profile.component.ts'), componentContent);

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

      const fileType = fileDiscovery.determineFileType('user.service.ts', serviceContent);
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

      const fileType = fileDiscovery.determineFileType('highlight.directive.ts', directiveContent);
      expect(fileType).toBe(AngularFileType.DIRECTIVE);
    });

    it('should detect spec files', () => {
      const fileType = fileDiscovery.determineFileType('user.component.spec.ts', 'describe("UserComponent", () => {})');

      expect(fileType).toBe(AngularFileType.SPEC);
    });

    it('should detect HTML template files', () => {
      const fileType = fileDiscovery.determineFileType('user.component.html', '<div>Hello World</div>');
      expect(fileType).toBe(AngularFileType.HTML_TEMPLATE);
    });

    it('should detect stylesheet files', () => {
      const fileType = fileDiscovery.determineFileType('styles.css', '.container { color: red; }');
      expect(fileType).toBe(AngularFileType.STYLESHEET);
    });

    it('should default to OTHER for unknown file types', () => {
      const fileType = fileDiscovery.determineFileType('unknown.ts', 'export class Unknown {}');
      expect(fileType).toBe(AngularFileType.OTHER);
    });
  });

  describe('findAngularFiles', () => {
    it('should find and classify multiple file types', async () => {
      // Create test files
      writeFileSync(
        join(tempDir, 'component.ts'),
        `import { Component } from '@angular/core';
         @Component({}) export class TestComponent {}`
      );

      writeFileSync(
        join(tempDir, 'service.ts'),
        `import { Injectable } from '@angular/core';
         @Injectable() export class TestService {}`
      );

      writeFileSync(join(tempDir, 'template.html'), '<div>Test</div>');
      writeFileSync(join(tempDir, 'styles.css'), '.test { color: red; }');

      const files = await fileDiscovery.findAngularFiles();

      expect(files).toHaveLength(4);
      expect(files.find(f => f.type === AngularFileType.COMPONENT)).toBeDefined();
      expect(files.find(f => f.type === AngularFileType.SERVICE)).toBeDefined();
      expect(files.find(f => f.type === AngularFileType.HTML_TEMPLATE)).toBeDefined();
      expect(files.find(f => f.type === AngularFileType.STYLESHEET)).toBeDefined();
    });

    it('should respect exclude patterns', async () => {
      // Create files that should be excluded
      writeFileSync(join(tempDir, 'test.spec.ts'), 'describe("test", () => {})');
      writeFileSync(join(tempDir, 'component.ts'), '@Component({}) export class TestComponent {}');

      const files = await fileDiscovery.findAngularFiles();

      expect(files).toHaveLength(1);
      expect(files[0].type).toBe(AngularFileType.COMPONENT);
    });
  });
});
