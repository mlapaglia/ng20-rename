import { FileNamingRule } from '../../rules/file-naming-rule';
import { AngularFile, AngularFileType } from '../../types';
import * as path from 'path';

// Mock fs for conflict resolution tests
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

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

  describe('conflict resolution', () => {
    const mockedExistsSync = require('fs').existsSync as jest.MockedFunction<any>;
    const mockedReadFileSync = require('fs').readFileSync as jest.MockedFunction<any>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve conflicts by renaming plain TypeScript files with detected domain', async () => {
      const rule = new FileNamingRule();
      
      // Setup: component wants to be renamed to user.ts, but user.ts already exists
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const conflictingFileContent = `
        export class User {
          id: number;
          name: string;
          email: string;
        }
      `;

      // Mock file system calls
      mockedExistsSync
        .mockImplementation((path: string) => {
          if (path.includes('user.ts') && !path.includes('user-model.ts')) return true; // Conflicting file exists
          if (path.includes('user-model.ts')) return false; // Resolution target doesn't exist
          return false;
        });
      
      mockedReadFileSync.mockReturnValue(conflictingFileContent);

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBe('/test/user.ts'.replace(/\//g, path.sep));
      expect(result.additionalRenames).toHaveLength(1);
      expect(result.additionalRenames![0].oldPath).toBe('/test/user.ts'.replace(/\//g, path.sep));
      expect(result.additionalRenames![0].newPath).toBe('/test/user-model.ts'.replace(/\//g, path.sep));
      expect(result.additionalRenames![0].reason).toContain('Resolved naming conflict');
      expect(result.additionalRenames![0].reason).toContain('detected domain: model');
    });

    it('should resolve conflicts for service files with smart domain detection', async () => {
      const rule = new FileNamingRule();
      
      const serviceFile: AngularFile = {
        path: '/test/auth.service.ts',
        content: `
          import { HttpClient } from '@angular/common/http';
          @Injectable()
          export class AuthService {
            constructor(private http: HttpClient) {}
            login() { return this.http.post('/auth/login', {}); }
          }
        `,
        type: AngularFileType.SERVICE
      };

      const conflictingFileContent = `
        export const authConfig = {
          apiUrl: 'https://auth.example.com',
          timeout: 5000
        };
      `;

      // Mock file system calls - no conflicts
      mockedExistsSync.mockReturnValue(false);

      const result = await rule.apply(serviceFile);

      expect(result.newFileName).toBe('/test/auth-api.ts'.replace(/\//g, path.sep)); // Service gets -api suffix
      expect(result.additionalRenames).toBeUndefined(); // No additional renames needed
    });

    it('should fallback to manual review when conflict cannot be resolved', async () => {
      const rule = new FileNamingRule();
      
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const conflictingFileContent = `
        // Plain file with no clear domain indicators
        const x = 5;
        function doSomething() {}
      `;

      // Mock file system calls
      mockedExistsSync.mockReturnValue(true); // user.ts exists (conflict)
      mockedReadFileSync.mockReturnValue(conflictingFileContent);

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBeUndefined();
      expect(result.manualReviewRequired).toHaveLength(1);
      expect(result.manualReviewRequired![0].filePath).toBe('/test/user.component.ts'.replace(/\//g, path.sep));
      expect(result.manualReviewRequired![0].desiredNewPath).toBe('/test/user.ts'.replace(/\//g, path.sep));
      expect(result.manualReviewRequired![0].reason).toContain('could not determine appropriate domain');
    });

    it('should fallback to manual review when conflicting file is an Angular file', async () => {
      const rule = new FileNamingRule();
      
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const conflictingAngularFileContent = `
        @Injectable()
        export class UserService {}
      `;

      // Mock file system calls
      mockedExistsSync.mockReturnValue(true); // user.ts exists (conflict)
      mockedReadFileSync.mockReturnValue(conflictingAngularFileContent);

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBeUndefined();
      expect(result.manualReviewRequired).toHaveLength(1);
      expect(result.manualReviewRequired![0].reason).toContain('conflicting file is a service');
    });

    it('should fallback to manual review when proposed resolution name already exists', async () => {
      const rule = new FileNamingRule();
      
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const conflictingFileContent = `
        export class User {
          id: number;
          name: string;
        }
      `;

      // Mock file system calls
      mockedExistsSync
        .mockReturnValueOnce(true)  // user.ts exists (conflict)
        .mockReturnValueOnce(true); // user-model.ts also exists (resolution conflict)
      
      mockedReadFileSync.mockReturnValue(conflictingFileContent);

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBeUndefined();
      expect(result.manualReviewRequired).toHaveLength(1);
      expect(result.manualReviewRequired![0].reason).toContain('proposed name user-model.ts already exists');
    });

    it('should handle file read errors gracefully', async () => {
      const rule = new FileNamingRule();
      
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      // Mock file system calls
      mockedExistsSync.mockReturnValue(true); // user.ts exists (conflict)
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBeUndefined();
      expect(result.manualReviewRequired).toHaveLength(1);
      expect(result.manualReviewRequired![0].reason).toContain('failed to read conflicting file');
    });

    it('should include component associated files when resolving conflicts', async () => {
      const rule = new FileNamingRule();
      
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: 'export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const conflictingFileContent = `
        export class User {
          id: number;
          name: string;
        }
      `;

      // Mock file system calls for conflict resolution
      mockedExistsSync
        .mockImplementation((path: string) => {
          // Conflict resolution
          if (path.includes('user.ts') && !path.includes('user-model.ts')) return true; // Conflicting file exists
          if (path.includes('user-model.ts')) return false; // Resolution target doesn't exist
          
          // Associated files that exist
          if (path.includes('user.component.html')) return true;
          if (path.includes('user.component.css')) return true;
          
          // Associated files that don't exist or new names
          if (path.includes('user.html')) return false;
          if (path.includes('user.css')) return false;
          if (path.includes('user.component.scss')) return false;
          if (path.includes('user.component.less')) return false;
          if (path.includes('user.component.spec.ts')) return false;
          
          return false;
        });
      
      mockedReadFileSync.mockReturnValue(conflictingFileContent);

      const result = await rule.apply(componentFile);

      expect(result.newFileName).toBe('/test/user.ts'.replace(/\//g, path.sep));
      expect(result.additionalRenames).toHaveLength(3); // conflict resolution + 2 associated files
      
      // Check conflict resolution rename
      const conflictRename = result.additionalRenames!.find(r => r.oldPath.includes('user.ts') && r.newPath.includes('user-model.ts'));
      expect(conflictRename).toBeDefined();
      
      // Check associated file renames
      const htmlRename = result.additionalRenames!.find(r => r.oldPath.includes('.html'));
      const cssRename = result.additionalRenames!.find(r => r.oldPath.includes('.css'));
      expect(htmlRename).toBeDefined();
      expect(cssRename).toBeDefined();
    });
  });
});
