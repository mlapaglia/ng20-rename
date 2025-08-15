import { FileNamingRule } from '../../rules/file-naming-rule';
import { AngularFile, AngularFileType, RefactorOptions } from '../../types';
import * as path from 'path';

describe('FileNamingRule', () => {
  let rule: FileNamingRule;
  let options: RefactorOptions;

  beforeEach(() => {
    rule = new FileNamingRule();
    options = {
      rootDir: '/test',
      dryRun: true
    };
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
    it('should rename PascalCase component file to kebab-case', async () => {
      const file: AngularFile = {
        path: '/test/UserProfile.component.ts',
        content: 'export class UserProfileComponent {}',
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBe('/test/user-profile.component.ts'.replace(/\//g, path.sep));
      expect(result.reason).toContain('File name should use kebab-case');
    });

    it('should not rename correctly named files', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: 'export class UserProfileComponent {}',
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBeUndefined();
    });

    it('should handle service files', async () => {
      const file: AngularFile = {
        path: '/test/UserDataService.ts',
        content: 'export class UserDataService {}',
        type: AngularFileType.SERVICE
      };

      const result = await rule.apply(file);

      expect(result.newFileName).toBe('/test/user-data.service.ts'.replace(/\//g, path.sep));
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
});
