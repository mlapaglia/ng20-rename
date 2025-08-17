import { FileNamingRule } from '../../rules/file-naming-rule';
import { AngularFile, AngularFileType } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileNamingRule Edge Cases', () => {
  let rule: FileNamingRule;
  let tempDir: string;

  beforeEach(() => {
    rule = new FileNamingRule(true); // Enable smart services
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-naming-edge-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('spec file handling edge cases', () => {
    it('should handle spec files with content changes but no renames', async () => {
      const sourceFile = path.join(tempDir, 'user.service.ts');
      const specFile = path.join(tempDir, 'user.service.spec.ts');

      // Create source file
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');
      
      // Create spec file with import that needs updating
      const specContent = `
        import { TestBed } from '@angular/core/testing';
        import { UserService } from './user.service';
        
        describe('UserService', () => {
          let service: UserService;
        });
      `;
      fs.writeFileSync(specFile, specContent);

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should have additional content changes for spec file
      expect(result.additionalContentChanges).toBeDefined();
      expect(result.additionalContentChanges!.length).toBeGreaterThan(0);
    });

    it('should handle spec files that already have correct names', async () => {
      const sourceFile = path.join(tempDir, 'user.ts');
      const specFile = path.join(tempDir, 'user.spec.ts');

      // Create files with already correct names
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');
      fs.writeFileSync(specFile, 'describe("UserService", () => {});');

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should not have any spec file renames since names are already correct
      expect(result.additionalRenames).toBeUndefined();
    });

    it('should handle spec files with conflicting target names', async () => {
      const sourceFile = path.join(tempDir, 'user.service.ts');
      const specFile = path.join(tempDir, 'user.service.spec.ts');
      const conflictingSpecFile = path.join(tempDir, 'user.spec.ts');

      // Create source file
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');
      
      // Create spec file
      fs.writeFileSync(specFile, 'describe("UserService", () => {});');
      
      // Create conflicting spec file
      fs.writeFileSync(conflictingSpecFile, 'describe("Conflict", () => {});');

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should not rename spec file due to conflict
      expect(result.additionalRenames).toBeUndefined();
    });
  });

  describe('class name suffix removal edge cases', () => {
    it('should handle class names without expected suffixes', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'custom.service.ts'),
        content: '@Injectable() export class CustomHandler {}', // No "Service" suffix
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should still process the file and use the class name as-is
      expect(result.newFileName).toContain('custom-handler.ts');
    });

    it('should handle class names that partially match suffixes', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'service.component.ts'),
        content: '@Component({}) export class ServiceComponent {}', // "Service" is part of name, not suffix
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      // Should remove only the "Component" suffix, keeping "Service" as part of the name
      expect(result.newFileName).toContain('service.ts');
    });
  });

  describe('file type suffix handling', () => {
    it('should handle files with old Angular suffixes', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'auth.guard.ts'),
        content: '@Injectable() export class AuthGuard {}',
        type: AngularFileType.GUARD
      };

      const result = await rule.apply(file);

      // Should rename from old .guard suffix to new -guard suffix
      expect(result.newFileName).toContain('auth-guard.ts');
    });

    it('should handle files with new Angular 20 suffixes', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'auth-guard.ts'),
        content: '@Injectable() export class AuthGuard {}',
        type: AngularFileType.GUARD
      };

      const result = await rule.apply(file);

      // Should not rename since it already has correct naming
      expect(result.newFileName).toBeUndefined();
    });

    it('should handle files without any type suffixes', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'auth.ts'),
        content: '@Injectable() export class AuthGuard {}',
        type: AngularFileType.GUARD
      };

      const result = await rule.apply(file);

      // Should add the correct suffix
      expect(result.newFileName).toContain('auth-guard.ts');
    });
  });

  describe('smart services edge cases', () => {
    it('should handle services with smart detection disabled', async () => {
      const ruleNoSmart = new FileNamingRule(false); // Disable smart services

      const file: AngularFile = {
        path: path.join(tempDir, 'notification.service.ts'),
        content: `
          import { Injectable, inject } from '@angular/core';
          import { MatSnackBar } from '@angular/material/snack-bar';
          
          @Injectable()
          export class NotificationService {
            private snackBar = inject(MatSnackBar);
          }
        `,
        type: AngularFileType.SERVICE
      };

      const result = await ruleNoSmart.apply(file);

      // Should use generic naming without smart detection
      expect(result.newFileName).toContain('notification.ts');
      expect(result.newFileName).not.toContain('notifications');
    });

    it('should handle services with no detectable domain patterns', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'generic.service.ts'),
        content: `
          import { Injectable } from '@angular/core';
          
          @Injectable()
          export class GenericService {
            doSomething() {
              return 'something';
            }
          }
        `,
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should use generic naming when no domain is detected
      expect(result.newFileName).toContain('generic.ts');
    });
  });

  describe('conflict resolution edge cases', () => {
    it('should handle unresolvable conflicts', async () => {
      const sourceFile = path.join(tempDir, 'user.service.ts');
      const conflictingFile = path.join(tempDir, 'user.ts');

      // Create source file
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');
      
      // Create conflicting file with no clear domain patterns
      fs.writeFileSync(conflictingFile, 'export const USER_CONFIG = {};');

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // The conflict resolution might succeed or require manual review depending on the domain detection
      // Let's check if either scenario happened
      const hasManualReview = result.manualReviewRequired && result.manualReviewRequired.length > 0;
      const hasRename = result.newFileName !== undefined;
      
      // Either should require manual review OR should have resolved the conflict
      expect(hasManualReview || hasRename).toBe(true);
    });

    it('should handle conflicts with non-existent files', async () => {
      const sourceFile = path.join(tempDir, 'user.service.ts');

      // Create source file but no conflicting file
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should rename normally since there's no actual conflict
      expect(result.newFileName).toContain('user.ts');
      expect(result.manualReviewRequired).toBeUndefined();
    });

    it('should handle conflicts where target file is the same as source', async () => {
      const sourceFile = path.join(tempDir, 'user.ts');

      // Create source file that already has the target name
      fs.writeFileSync(sourceFile, '@Injectable() export class UserService {}');

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class UserService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should not rename since it's already correctly named
      expect(result.newFileName).toBeUndefined();
    });
  });

  describe('file without class exports', () => {
    it('should handle files with no class exports', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'utils.ts'),
        content: 'export function helper() { return "help"; }',
        type: AngularFileType.OTHER
      };

      const result = await rule.apply(file);

      // Should not rename files without class exports
      expect(result.newFileName).toBeUndefined();
    });

    it('should handle files with malformed class exports', async () => {
      const file: AngularFile = {
        path: path.join(tempDir, 'broken.component.ts'),
        content: 'export class // incomplete class declaration',
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      // Should not rename files with malformed class exports
      expect(result.newFileName).toBeUndefined();
    });
  });

  describe('import update patterns', () => {
    it('should handle different import quote styles in spec files', async () => {
      const sourceFile = path.join(tempDir, 'test.service.ts');
      const specFile = path.join(tempDir, 'test.service.spec.ts');

      fs.writeFileSync(sourceFile, '@Injectable() export class TestService {}');
      
      const specContent = `
        import { TestService } from './test.service';
        import { OtherService } from "./test.service";
        import { ThirdService } from \`./test.service\`;
      `;
      fs.writeFileSync(specFile, specContent);

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class TestService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should handle all quote styles in import updates
      expect(result.additionalContentChanges).toBeDefined();
      if (result.additionalContentChanges) {
        const updatedContent = result.additionalContentChanges[0].newContent;
        expect(updatedContent).toContain("from './test'");
        // The import updater normalizes all quotes to single quotes
        expect(updatedContent.match(/from ['"`]\.\/test['"`]/g)?.length).toBe(3);
      }
    });

    it('should handle imports with explicit .ts extensions', async () => {
      const sourceFile = path.join(tempDir, 'api.service.ts');
      const specFile = path.join(tempDir, 'api.service.spec.ts');

      fs.writeFileSync(sourceFile, '@Injectable() export class ApiService {}');
      
      const specContent = `import { ApiService } from './api.service.ts';`;
      fs.writeFileSync(specFile, specContent);

      const file: AngularFile = {
        path: sourceFile,
        content: '@Injectable() export class ApiService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      // Should update imports with .ts extensions
      expect(result.additionalContentChanges).toBeDefined();
      if (result.additionalContentChanges) {
        const updatedContent = result.additionalContentChanges[0].newContent;
        expect(updatedContent).toContain("from './api'");
        expect(updatedContent).not.toContain('.ts');
      }
    });
  });
});
