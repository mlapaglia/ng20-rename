import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AngularRefactorer Error Handling', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'refactorer-error-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle file processing errors gracefully', async () => {
    // Create a valid TypeScript file
    const validFile = path.join(tempDir, 'valid.component.ts');
    fs.writeFileSync(validFile, '@Component({}) export class ValidComponent {}');

    // Create a file that will cause processing errors
    const problematicFile = path.join(tempDir, 'problematic.component.ts');
    fs.writeFileSync(problematicFile, '@Component({}) export class ProblematicComponent {}');

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);

    // Mock the file processor to throw an error for the problematic file
    const originalProcessFile = refactorer['fileProcessor'].processFile;
    jest.spyOn(refactorer['fileProcessor'], 'processFile').mockImplementation(async (file, result) => {
      if (file.path.includes('problematic')) {
        throw new Error('Simulated processing error');
      }
      return originalProcessFile.call(refactorer['fileProcessor'], file, result);
    });

    const result = await refactorer.refactor();

    // Should have processed the valid file (it gets renamed from .component.ts to .ts)
    const renamedValidFile = validFile.replace('.component.ts', '.ts');
    expect(result.processedFiles).toContain(renamedValidFile);

    // Should have recorded the error for the problematic file
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].filePath).toBe(problematicFile);
    expect(result.errors[0].message).toBe('Simulated processing error');

    // Should still have some successful processing
    expect(result.renamedFiles.length).toBeGreaterThan(0);

    jest.restoreAllMocks();
  });

  it('should handle directory scanning errors', async () => {
    // Use a non-existent directory
    const nonExistentDir = path.join(tempDir, 'nonexistent');

    const options: RefactorOptions = {
      rootDir: nonExistentDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);

    // Mock the file discovery to throw an error
    jest
      .spyOn(refactorer['fileDiscovery'], 'findAngularFiles')
      .mockRejectedValue(new Error('ENOENT: no such file or directory'));

    const result = await refactorer.refactor();

    // Should have recorded the directory scanning error
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].filePath).toBe(nonExistentDir);
    expect(result.errors[0].message).toContain('Failed to scan directory');

    // Should have no processed files
    expect(result.processedFiles).toHaveLength(0);
    expect(result.renamedFiles).toHaveLength(0);

    jest.restoreAllMocks();
  });

  it('should handle import update errors gracefully', async () => {
    // Create files that will be renamed
    const serviceFile = path.join(tempDir, 'test.service.ts');
    const componentFile = path.join(tempDir, 'test.component.ts');

    fs.writeFileSync(serviceFile, '@Injectable() export class TestService {}');
    fs.writeFileSync(
      componentFile,
      `
      import { Component } from '@angular/core';
      import { TestService } from './test.service';
      
      @Component({})
      export class TestComponent {}
    `
    );

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);

    // Mock the import updater to throw an error
    jest.spyOn(refactorer['importUpdater'], 'updateImports').mockImplementation(async () => {
      throw new Error('Import update failed');
    });

    const result = await refactorer.refactor();

    // Files should still be processed and renamed
    expect(result.processedFiles.length).toBeGreaterThan(0);
    expect(result.renamedFiles.length).toBeGreaterThan(0);

    // But there should be no import update errors in the result since the error is caught at a higher level
    // The import updater error handling is internal to the updateImports method

    jest.restoreAllMocks();
  });

  it('should handle verbose logging without errors', async () => {
    const componentFile = path.join(tempDir, 'test.component.ts');
    fs.writeFileSync(componentFile, '@Component({}) export class TestComponent {}');

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      verbose: true, // Enable verbose logging
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    // Capture console output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Should have logged verbose information
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Processing complete:'));

    // Should still process files normally
    expect(result.processedFiles.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  it('should handle empty directories gracefully', async () => {
    // Create an empty directory
    const emptySubDir = path.join(tempDir, 'empty');
    fs.mkdirSync(emptySubDir);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Should handle empty directory without errors
    expect(result.errors).toHaveLength(0);
    expect(result.processedFiles).toHaveLength(0);
    expect(result.renamedFiles).toHaveLength(0);
  });

  it('should handle files with no class exports', async () => {
    // Create files without class exports
    const utilFile = path.join(tempDir, 'utils.ts');
    const constantsFile = path.join(tempDir, 'constants.ts');

    fs.writeFileSync(utilFile, 'export function helper() { return "help"; }');
    fs.writeFileSync(constantsFile, 'export const API_URL = "https://api.example.com";');

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Should process files without errors even if they don't have classes
    expect(result.errors).toHaveLength(0);
    expect(result.processedFiles).toContain(utilFile);
    expect(result.processedFiles).toContain(constantsFile);

    // Files without classes shouldn't be renamed
    expect(result.renamedFiles).toHaveLength(0);
  });
});
