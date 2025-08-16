import { FileNamingRule } from '../../rules/file-naming-rule';
import { AngularFile, AngularFileType } from '../../types';
import * as path from 'path';

describe('FileNamingRule', () => {
  let rule: FileNamingRule;

  beforeEach(() => {
    rule = new FileNamingRule();
  });

  describe('shouldApply', () => {
    it('should apply to component files', () => {
      const file: AngularFile = {
        path: '/test/UserProfile.component.ts',
        content: 'export class UserProfileComponent {}',
        type: AngularFileType.COMPONENT
      };

      expect(rule.shouldApply(file)).toBe(true);
    });

    it('should not apply to spec files', () => {
      const file: AngularFile = {
        path: '/test/user-profile.spec.ts',
        content: 'describe("test", () => {})',
        type: AngularFileType.SPEC
      };

      expect(rule.shouldApply(file)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should rename PascalCase component file to kebab-case without .component suffix (Angular 20)', async () => {
      const file: AngularFile = {
        path: '/test/UserProfile.component.ts',
        content: 'export class UserProfileComponent {}',
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBe('/test/user-profile.ts'.replace(/\//g, path.sep));
      expect(result.reason).toContain('File name should follow Angular 20 conventions');
    });

    it('should not rename correctly named files (Angular 20)', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.ts',
        content: 'export class UserProfileComponent {}',
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBeUndefined();
    });

    it('should handle service files (Angular 20 - no .service suffix)', async () => {
      const file: AngularFile = {
        path: '/test/UserDataService.ts',
        content: 'export class UserDataService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBe('/test/user-data.ts'.replace(/\//g, path.sep));
    });

    it('should handle files without class exports', async () => {
      const file: AngularFile = {
        path: '/test/utils.ts',
        content: 'export const helper = () => {};',
        type: AngularFileType.OTHER
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBeUndefined();
    });
  });

  describe('edge cases and suffix handling', () => {
    it('should handle pipe files with old suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/currency.pipe.ts',
        content: 'export class CurrencyPipe {}',
        type: AngularFileType.PIPE
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toContain('currency-pipe.ts');
    });

    it('should handle module files with old suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/shared.module.ts',
        content: 'export class SharedModule {}',
        type: AngularFileType.MODULE
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toContain('shared-module.ts');
    });

    it('should handle guard files with old suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/auth.guard.ts',
        content: 'export class AuthGuard {}',
        type: AngularFileType.GUARD
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toContain('auth-guard.ts');
    });

    it('should handle interceptor files with old suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/auth.interceptor.ts',
        content: 'export class AuthInterceptor {}',
        type: AngularFileType.INTERCEPTOR
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toContain('auth-interceptor.ts');
    });

    it('should handle resolver files with old suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/data.resolver.ts',
        content: 'export class DataResolver {}',
        type: AngularFileType.RESOLVER
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toContain('data-resolver.ts');
    });

    it('should handle files that already have new suffix', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/currency-pipe.ts',
        content: 'export class CurrencyPipe {}',
        type: AngularFileType.PIPE
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toBeUndefined(); // No change needed
    });

    it('should handle HTML template files', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/user-profile.html',
        content: '<div>Template</div>',
        type: AngularFileType.HTML_TEMPLATE
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toBeUndefined(); // No change needed for HTML
    });

    it('should handle stylesheet files', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/user-profile.css',
        content: '.container { color: red; }',
        type: AngularFileType.STYLESHEET
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toBeUndefined(); // No change needed for CSS
    });

    it('should handle other file types', async () => {
      const rule = new FileNamingRule();
      const file: AngularFile = {
        path: '/test/utils.ts',
        content: 'export const utils = {};',
        type: AngularFileType.OTHER
      };

      const result = await rule.apply(file);
      expect(result.newFileName).toBeUndefined(); // No change needed for other types
    });
  });
});
