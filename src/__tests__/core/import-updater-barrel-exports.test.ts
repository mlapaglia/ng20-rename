import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - Barrel Exports', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-barrel-test-'));
    importUpdater = new ImportUpdater(false);
    result = {
      processedFiles: [],
      renamedFiles: [],
      contentChanges: [],
      manualReviewRequired: [],
      errors: []
    };
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should update barrel exports in index.ts when source file is renamed', async () => {
    // Create directory structure
    const utilsDir = path.join(tempDir, 'utils');
    fs.mkdirSync(utilsDir);

    // Create original source file
    const originalFile = path.join(utilsDir, 'string-helper.ts');
    const renamedFile = path.join(utilsDir, 'text-utils.ts');
    
    fs.writeFileSync(originalFile, `
      export function formatString(str: string): string {
        return str.trim().toLowerCase();
      }
      
      export const DEFAULT_FORMAT = 'lowercase';
    `);

    // Create the renamed file (simulating the rename operation)
    fs.writeFileSync(renamedFile, `
      export function formatString(str: string): string {
        return str.trim().toLowerCase();
      }
      
      export const DEFAULT_FORMAT = 'lowercase';
    `);

    // Create barrel export index.ts that re-exports from the original file
    const indexFile = path.join(utilsDir, 'index.ts');
    fs.writeFileSync(indexFile, `
      export { formatString, DEFAULT_FORMAT } from './string-helper';
      export { calculateSum } from './math-helper';
    `);

    // Create another file for completeness
    const mathFile = path.join(utilsDir, 'math-helper.ts');
    fs.writeFileSync(mathFile, `
      export function calculateSum(a: number, b: number): number {
        return a + b;
      }
    `);

    // Create a consumer file that imports from the barrel export
    const consumerFile = path.join(tempDir, 'consumer.ts');
    fs.writeFileSync(consumerFile, `
      import { formatString, DEFAULT_FORMAT } from './utils';
      
      export class StringProcessor {
        process(input: string): string {
          return formatString(input) + DEFAULT_FORMAT;
        }
      }
    `);

    const renamedFiles: RenamedFile[] = [
      {
        oldPath: originalFile,
        newPath: renamedFile
      }
    ];

    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // The index.ts should be updated to import from the new file name
    const updatedIndexContent = fs.readFileSync(indexFile, 'utf-8');
    expect(updatedIndexContent).toContain(`from './text-utils'`);
    expect(updatedIndexContent).not.toContain(`from './string-helper'`);

    // The consumer file should remain unchanged (still imports from barrel)
    const updatedConsumerContent = fs.readFileSync(consumerFile, 'utf-8');
    expect(updatedConsumerContent).toContain(`from './utils'`);

    // Verify we have content changes
    expect(result.contentChanges).toHaveLength(1);
    expect(result.contentChanges[0].filePath).toBe(indexFile);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle multiple barrel exports with overlapping names', async () => {
    // Create directory structure
    const servicesDir = path.join(tempDir, 'services');
    fs.mkdirSync(servicesDir);

    // Create original files
    const userServiceFile = path.join(servicesDir, 'user.service.ts');
    const userApiFile = path.join(servicesDir, 'user-api.service.ts');
    
    fs.writeFileSync(userServiceFile, `
      export class UserService {
        getUser(id: string) { return {}; }
      }
    `);

    fs.writeFileSync(userApiFile, `
      export class UserApiService {
        fetchUser(id: string) { return {}; }
      }
    `);

    // Create barrel export that exports both
    const indexFile = path.join(servicesDir, 'index.ts');
    fs.writeFileSync(indexFile, `
      export { UserService } from './user.service';
      export { UserApiService } from './user-api.service';
      export { ProductService } from './product.service';
    `);

    // Create product service
    const productFile = path.join(servicesDir, 'product.service.ts');
    fs.writeFileSync(productFile, `
      export class ProductService {
        getProduct(id: string) { return {}; }
      }
    `);

    // Rename user.service.ts to user-data.service.ts
    const renamedUserFile = path.join(servicesDir, 'user-data.service.ts');
    fs.writeFileSync(renamedUserFile, `
      export class UserService {
        getUser(id: string) { return {}; }
      }
    `);

    const renamedFiles: RenamedFile[] = [
      {
        oldPath: userServiceFile,
        newPath: renamedUserFile
      }
    ];

    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // The index.ts should be updated
    const updatedIndexContent = fs.readFileSync(indexFile, 'utf-8');
    expect(updatedIndexContent).toContain(`from './user-data.service'`);
    expect(updatedIndexContent).toContain(`from './user-api.service'`); // unchanged
    expect(updatedIndexContent).toContain(`from './product.service'`); // unchanged
    expect(updatedIndexContent).not.toContain(`from './user.service'`);

    expect(result.contentChanges).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle nested barrel exports', async () => {
    // Create nested directory structure
    const featuresDir = path.join(tempDir, 'features');
    const userDir = path.join(featuresDir, 'user');
    const authDir = path.join(featuresDir, 'auth');
    
    fs.mkdirSync(featuresDir);
    fs.mkdirSync(userDir);
    fs.mkdirSync(authDir);

    // Create files in user directory
    const userComponentFile = path.join(userDir, 'user.component.ts');
    const renamedUserComponentFile = path.join(userDir, 'user-profile.component.ts');
    
    fs.writeFileSync(userComponentFile, `
      export class UserComponent {
        title = 'User Profile';
      }
    `);

    fs.writeFileSync(renamedUserComponentFile, `
      export class UserComponent {
        title = 'User Profile';
      }
    `);

    // Create user barrel export
    const userIndexFile = path.join(userDir, 'index.ts');
    fs.writeFileSync(userIndexFile, `
      export { UserComponent } from './user.component';
      export { UserService } from './user.service';
    `);

    const userServiceFile = path.join(userDir, 'user.service.ts');
    fs.writeFileSync(userServiceFile, `
      export class UserService {
        getUsers() { return []; }
      }
    `);

    // Create auth files
    const authServiceFile = path.join(authDir, 'auth.service.ts');
    fs.writeFileSync(authServiceFile, `
      export class AuthService {
        login() { return true; }
      }
    `);

    const authIndexFile = path.join(authDir, 'index.ts');
    fs.writeFileSync(authIndexFile, `
      export { AuthService } from './auth.service';
    `);

    // Create main features barrel export
    const featuresIndexFile = path.join(featuresDir, 'index.ts');
    fs.writeFileSync(featuresIndexFile, `
      export * from './user';
      export * from './auth';
    `);

    // Create consumer that imports from top-level barrel
    const appFile = path.join(tempDir, 'app.ts');
    fs.writeFileSync(appFile, `
      import { UserComponent, AuthService } from './features';
      
      export class App {
        constructor(
          private userComponent: UserComponent,
          private authService: AuthService
        ) {}
      }
    `);

    const renamedFiles: RenamedFile[] = [
      {
        oldPath: userComponentFile,
        newPath: renamedUserComponentFile
      }
    ];

    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Only the user index.ts should be updated
    const updatedUserIndexContent = fs.readFileSync(userIndexFile, 'utf-8');
    expect(updatedUserIndexContent).toContain(`from './user-profile.component'`);
    expect(updatedUserIndexContent).not.toContain(`from './user.component'`);

    // Features index and app should remain unchanged
    const featuresIndexContent = fs.readFileSync(featuresIndexFile, 'utf-8');
    expect(featuresIndexContent).toContain(`export * from './user'`);

    const appContent = fs.readFileSync(appFile, 'utf-8');
    expect(appContent).toContain(`from './features'`);

    expect(result.contentChanges).toHaveLength(1);
    expect(result.contentChanges[0].filePath).toBe(userIndexFile);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle barrel exports with alias imports', async () => {
    const libDir = path.join(tempDir, 'lib');
    fs.mkdirSync(libDir);

    // Create original file
    const validatorFile = path.join(libDir, 'validator.ts');
    const renamedValidatorFile = path.join(libDir, 'validation-utils.ts');
    
    fs.writeFileSync(validatorFile, `
      export function validateEmail(email: string): boolean {
        return email.includes('@');
      }
    `);

    fs.writeFileSync(renamedValidatorFile, `
      export function validateEmail(email: string): boolean {
        return email.includes('@');
      }
    `);

    // Create barrel export with alias
    const indexFile = path.join(libDir, 'index.ts');
    fs.writeFileSync(indexFile, `
      export { validateEmail as isValidEmail } from './validator';
      export { formatDate } from './date-utils';
    `);

    const dateUtilsFile = path.join(libDir, 'date-utils.ts');
    fs.writeFileSync(dateUtilsFile, `
      export function formatDate(date: Date): string {
        return date.toISOString();
      }
    `);

    const renamedFiles: RenamedFile[] = [
      {
        oldPath: validatorFile,
        newPath: renamedValidatorFile
      }
    ];

    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // The index.ts should be updated
    const updatedIndexContent = fs.readFileSync(indexFile, 'utf-8');
    expect(updatedIndexContent).toContain(`from './validation-utils'`);
    expect(updatedIndexContent).toContain(`validateEmail as isValidEmail`); // alias preserved
    expect(updatedIndexContent).not.toContain(`from './validator'`);

    expect(result.contentChanges).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });
});
