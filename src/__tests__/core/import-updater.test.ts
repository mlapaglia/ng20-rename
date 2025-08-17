import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-test-'));
    importUpdater = new ImportUpdater(false); // Not dry run
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

  describe('updateImports', () => {
    it('should return early when no files are renamed', async () => {
      await importUpdater.updateImports(tempDir, [], result);
      
      expect(result.contentChanges).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip files that do not exist', async () => {
      const renamedFiles: RenamedFile[] = [
        {
          oldPath: path.join(tempDir, 'nonexistent.ts'),
          newPath: path.join(tempDir, 'renamed.ts')        }
      ];

      // Create the renamed file so the import can be resolved
      fs.writeFileSync(path.join(tempDir, 'renamed.ts'), 'export class Something {}');

      // Create a file that imports from the nonexistent file
      const importerContent = `import { Something } from './nonexistent';`;
      fs.writeFileSync(path.join(tempDir, 'importer.ts'), importerContent);

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.errors).toHaveLength(0);
      // The import should be updated since the target file exists
      expect(result.contentChanges).toHaveLength(1);
    });

    it('should handle file processing errors gracefully', async () => {
      const renamedFiles: RenamedFile[] = [
        {
          oldPath: path.join(tempDir, 'source.ts'),
          newPath: path.join(tempDir, 'renamed.ts')        }
      ];

      // Create the renamed file
      fs.writeFileSync(path.join(tempDir, 'renamed.ts'), 'export class Test {}');

      // Create a file that imports from the source
      const importerFile = path.join(tempDir, 'importer.ts');
      fs.writeFileSync(importerFile, `import { Test } from './source';`);
      
      // Mock the updateImportsInFile method to throw an error
      const originalMethod = (importUpdater as any).updateImportsInFile.bind(importUpdater);
      jest.spyOn(importUpdater as any, 'updateImportsInFile').mockImplementation((...args: any[]) => {
        const [content, filePath, renameMap] = args;
        if (filePath === importerFile) {
          throw new Error('Permission denied');
        }
        return originalMethod(content, filePath, renameMap);
      });

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].filePath).toBe(importerFile);
      expect(result.errors[0].message).toContain('Failed to update imports: Permission denied');

      // Restore the original function
      jest.restoreAllMocks();
    });

    it('should skip directories that should be ignored', async () => {
      // Create directories that should be skipped
      const nodeModulesDir = path.join(tempDir, 'node_modules');
      const distDir = path.join(tempDir, 'dist');
      const gitDir = path.join(tempDir, '.git');
      
      fs.mkdirSync(nodeModulesDir);
      fs.mkdirSync(distDir);
      fs.mkdirSync(gitDir);
      
      // Create TypeScript files in these directories
      fs.writeFileSync(path.join(nodeModulesDir, 'test.ts'), 'export class Test {}');
      fs.writeFileSync(path.join(distDir, 'test.ts'), 'export class Test {}');
      fs.writeFileSync(path.join(gitDir, 'test.ts'), 'export class Test {}');

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: path.join(tempDir, 'source.ts'),
          newPath: path.join(tempDir, 'renamed.ts')        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      // Should not process files in ignored directories
      expect(result.contentChanges).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle complex relative path calculations', async () => {
      // Create nested directory structure
      const srcDir = path.join(tempDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      const servicesDir = path.join(srcDir, 'services');
      
      fs.mkdirSync(srcDir);
      fs.mkdirSync(componentsDir);
      fs.mkdirSync(servicesDir);

      // Create files
      const serviceFile = path.join(servicesDir, 'user.service.ts');
      const renamedServiceFile = path.join(servicesDir, 'user-api.ts');
      const componentFile = path.join(componentsDir, 'user.component.ts');

      fs.writeFileSync(serviceFile, 'export class UserService {}');
      fs.writeFileSync(renamedServiceFile, 'export class UserService {}');
      fs.writeFileSync(componentFile, `import { UserService } from '../services/user.service';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: serviceFile,
          newPath: renamedServiceFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(1);
      expect(result.contentChanges[0].filePath).toBe(componentFile);
      
      const updatedContent = fs.readFileSync(componentFile, 'utf-8');
      expect(updatedContent).toContain(`import { UserService } from '../services/user-api';`);
    });

    it('should handle import paths that need ./ prefix', async () => {
      const sourceFile = path.join(tempDir, 'source.ts');
      const renamedFile = path.join(tempDir, 'renamed.ts');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      fs.writeFileSync(importerFile, `import { Source } from './source';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(1);
      
      const updatedContent = fs.readFileSync(importerFile, 'utf-8');
      expect(updatedContent).toContain(`import { Source } from './renamed';`);
    });

    it('should handle Windows path separators', async () => {
      const sourceFile = path.join(tempDir, 'source.ts');
      const renamedFile = path.join(tempDir, 'renamed.ts');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      fs.writeFileSync(importerFile, `import { Source } from './source';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      const updatedContent = fs.readFileSync(importerFile, 'utf-8');
      // Should use forward slashes regardless of platform
      expect(updatedContent).toContain(`import { Source } from './renamed';`);
      expect(updatedContent).not.toContain('\\');
    });

    it('should handle files with .js extension in import resolution', async () => {
      const sourceFile = path.join(tempDir, 'source.js');
      const renamedFile = path.join(tempDir, 'renamed.js');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      fs.writeFileSync(importerFile, `import { Source } from './source';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(1);
      
      const updatedContent = fs.readFileSync(importerFile, 'utf-8');
      expect(updatedContent).toContain(`import { Source } from './renamed';`);
    });

    it('should handle imports with explicit .ts extension', async () => {
      const sourceFile = path.join(tempDir, 'source.ts');
      const renamedFile = path.join(tempDir, 'renamed.ts');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      fs.writeFileSync(importerFile, `import { Source } from './source.ts';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(1);
      
      const updatedContent = fs.readFileSync(importerFile, 'utf-8');
      expect(updatedContent).toContain(`import { Source } from './renamed';`);
    });

    it('should handle dry run mode', async () => {
      const dryRunUpdater = new ImportUpdater(true);
      
      const sourceFile = path.join(tempDir, 'source.ts');
      const renamedFile = path.join(tempDir, 'renamed.ts');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      fs.writeFileSync(importerFile, `import { Source } from './source';`);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await dryRunUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(1);
      
      // File should not be actually modified in dry run
      const actualContent = fs.readFileSync(importerFile, 'utf-8');
      expect(actualContent).toContain(`import { Source } from './source';`);
    });

    it('should skip non-TypeScript files', async () => {
      // Create non-TypeScript files
      fs.writeFileSync(path.join(tempDir, 'test.js'), 'console.log("test");');
      fs.writeFileSync(path.join(tempDir, 'test.html'), '<div>test</div>');
      fs.writeFileSync(path.join(tempDir, 'test.css'), '.test { color: red; }');

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: path.join(tempDir, 'source.ts'),
          newPath: path.join(tempDir, 'renamed.ts')        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple import patterns in the same file', async () => {
      const sourceFile = path.join(tempDir, 'source.ts');
      const renamedFile = path.join(tempDir, 'renamed.ts');
      const importerFile = path.join(tempDir, 'importer.ts');

      fs.writeFileSync(sourceFile, 'export class Source {}');
      fs.writeFileSync(renamedFile, 'export class Source {}');
      
      const importerContent = `
        import { Source } from './source';
        import type { Source as SourceType } from "./source";
        import * as SourceModule from \`./source\`;
      `;
      fs.writeFileSync(importerFile, importerContent);

      const renamedFiles: RenamedFile[] = [
        {
          oldPath: sourceFile,
          newPath: renamedFile        }
      ];

      await importUpdater.updateImports(tempDir, renamedFiles, result);

      expect(result.contentChanges).toHaveLength(3); // One change per import line
      
      const updatedContent = fs.readFileSync(importerFile, 'utf-8');
      expect(updatedContent).toContain(`from './renamed'`);
      expect(updatedContent).toContain(`from "./renamed"`);
      expect(updatedContent).toContain(`from \`./renamed\``);
      expect(updatedContent).not.toContain('./source');
    });
  });
});
