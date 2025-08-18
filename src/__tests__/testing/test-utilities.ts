/**
 * Test Utilities for Angular Refactoring
 *
 * Provides utilities for testing import statement parsing, file renaming,
 * and integration scenarios using the virtual file system.
 */

import { VirtualFileSystem, VirtualFile } from './virtual-file-system';

export interface ImportStatement {
  fullStatement: string;
  namedImports: string[];
  defaultImport?: string;
  typeImport?: string;
  modulePath: string;
  isRelative: boolean;
}

export interface RenameOperation {
  oldPath: string;
  newPath: string;
}

export interface ImportUpdate {
  filePath: string;
  oldImport: string;
  newImport: string;
}

/**
 * Utility class for testing import statement operations
 */
export class ImportTestUtils {
  /**
   * Parse import statements from TypeScript code
   */
  static parseImports(content: string): ImportStatement[] {
    const imports: ImportStatement[] = [];

    // More comprehensive regex patterns for different import types
    const patterns = [
      // Named imports: import { A, B } from 'module'
      /import\s+(?:type\s+)?\{\s*([^}]+)\s*\}\s+from\s+['"`]([^'"`]+)['"`]/g,
      // Default imports: import A from 'module'
      /import\s+(?:type\s+)?(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
      // Mixed imports: import A, { B, C } from 'module'
      /import\s+(?:type\s+)?(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+['"`]([^'"`]+)['"`]/g,
      // Namespace imports: import * as A from 'module'
      /import\s+(?:type\s+)?\*\s+as\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fullStatement = match[0].trim();
        const isTypeImport = fullStatement.includes('import type');

        let namedImports: string[] = [];
        let defaultImport: string | undefined;
        let modulePath: string = '';

        if (pattern === patterns[0]) {
          // Named imports
          const namedImportsStr = match[1];
          modulePath = match[2];
          namedImports = namedImportsStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.includes('//'));
        } else if (pattern === patterns[1]) {
          // Default imports
          defaultImport = match[1];
          modulePath = match[2];
        } else if (pattern === patterns[2]) {
          // Mixed imports
          defaultImport = match[1];
          const namedImportsStr = match[2];
          modulePath = match[3];
          namedImports = namedImportsStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.includes('//'));
        } else if (pattern === patterns[3]) {
          // Namespace imports
          defaultImport = match[1];
          modulePath = match[2];
        }

        const isRelative = modulePath.startsWith('./') || modulePath.startsWith('../');

        // Avoid duplicates by checking if we already have this import
        const existingImport = imports.find(
          imp => imp.modulePath === modulePath && imp.fullStatement === fullStatement
        );

        if (!existingImport) {
          imports.push({
            fullStatement,
            namedImports,
            defaultImport,
            typeImport: isTypeImport ? namedImports.join(', ') || defaultImport : undefined,
            modulePath,
            isRelative
          });
        }
      }
    }

    return imports;
  }

  /**
   * Update import paths in content
   */
  static updateImportPath(content: string, oldPath: string, newPath: string): string {
    const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importRegex = new RegExp(
      `(import\\s+(?:type\\s+)?(?:[^'"]+\\s+from\\s+)?['"\`])${escapedOldPath}(['"\`])`,
      'g'
    );

    return content.replace(importRegex, `$1${newPath}$2`);
  }

  /**
   * Find all relative imports in a file
   */
  static findRelativeImports(content: string): ImportStatement[] {
    return this.parseImports(content).filter(imp => imp.isRelative);
  }

  /**
   * Validate that all imports in a file can be resolved
   */
  static validateImports(filePath: string, content: string, vfs: VirtualFileSystem): string[] {
    const brokenImports: string[] = [];
    const imports = this.findRelativeImports(content);
    const fileDir = this.getDirectoryPath(filePath);

    for (const imp of imports) {
      const resolvedPath = this.resolveImportPath(fileDir, imp.modulePath);
      const possiblePaths = [`${resolvedPath}.ts`, `${resolvedPath}.js`, `${resolvedPath}/index.ts`, resolvedPath];

      const exists = possiblePaths.some(path => vfs.exists(path));
      if (!exists) {
        brokenImports.push(`${imp.fullStatement} -> ${resolvedPath}`);
      }
    }

    return brokenImports;
  }

  private static getDirectoryPath(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash === -1 ? '' : filePath.substring(0, lastSlash);
  }

  /**
   * Normalize import paths by converting backslashes to forward slashes
   * This ensures import statements always use forward slashes per ES module spec
   */
  static normalizeImportPaths(content: string): string {
    // Replace backslashes with forward slashes in import paths
    return content
      .replace(/(from\s+['"`][^'"`]*['"`])/g, match => match.replace(/\\/g, '/'))
      .replace(/(import\s+['"`][^'"`]*['"`])/g, match => match.replace(/\\/g, '/'));
  }

  private static resolveImportPath(baseDir: string, importPath: string): string {
    if (importPath.startsWith('./')) {
      return baseDir ? `${baseDir}/${importPath.substring(2)}` : importPath.substring(2);
    }
    if (importPath.startsWith('../')) {
      const parts = baseDir.split('/');
      const importParts = importPath.split('/');

      let upLevels = 0;
      for (const part of importParts) {
        if (part === '..') {
          upLevels++;
        } else {
          break;
        }
      }

      const remainingImportParts = importParts.slice(upLevels);
      const resolvedBaseParts = parts.slice(0, -upLevels);

      return [...resolvedBaseParts, ...remainingImportParts].join('/');
    }

    return importPath;
  }
}

/**
 * Utility class for testing file renaming operations
 */
export class RenameTestUtils {
  /**
   * Apply Angular naming conventions to a file path
   */
  static applyNamingConventions(filePath: string): string {
    const directory = this.getDirectoryPath(filePath);
    const extension = this.getFileExtension(filePath);

    // For files without traditional extensions (.ts, .js, etc), treat the whole name as filename
    let fileName: string;
    if (extension === '' || !extension.match(/^\.(ts|js|html|css|scss|less)$/)) {
      const lastSlash = filePath.lastIndexOf('/');
      fileName = lastSlash === -1 ? filePath : filePath.substring(lastSlash + 1);
      // For files without extensions, return just the processed name
      let newName = fileName;

      // Handle spec files first (more specific patterns)
      if (fileName.includes('.component.spec')) {
        newName = fileName.replace('.component.spec', '.spec');
      } else if (fileName.includes('.service.spec')) {
        newName = fileName.replace('.service.spec', '.spec');
      }
      // Remove .component suffix from components
      else if (fileName.endsWith('.component')) {
        newName = fileName.replace('.component', '');
      }
      // Remove .service suffix from services
      else if (fileName.endsWith('.service')) {
        newName = fileName.replace('.service', '');
      }

      return directory ? `${directory}/${newName}` : newName;
    } else {
      fileName = this.getFileName(filePath);
    }

    // Apply Angular naming rules for files with extensions
    let newName = fileName;

    // Handle spec files first (more specific patterns)
    if (fileName.includes('.component.spec')) {
      newName = fileName.replace('.component.spec', '.spec');
    } else if (fileName.includes('.service.spec')) {
      newName = fileName.replace('.service.spec', '.spec');
    }
    // Remove .component suffix from components
    else if (fileName.endsWith('.component')) {
      newName = fileName.replace('.component', '');
    }
    // Remove .service suffix from services
    else if (fileName.endsWith('.service')) {
      newName = fileName.replace('.service', '');
    }

    return directory ? `${directory}/${newName}${extension}` : `${newName}${extension}`;
  }

  /**
   * Simulate file renaming with conflict resolution
   */
  static simulateRename(vfs: VirtualFileSystem, oldPath: string, newPath: string): string {
    let finalPath = newPath;
    let counter = 1;
    const maxAttempts = 100; // Prevent infinite loops

    // Handle conflicts by appending a suffix
    while (vfs.exists(finalPath) && finalPath !== oldPath && counter < maxAttempts) {
      const baseName = this.getFileNameWithoutExtension(newPath);
      const extension = this.getFileExtension(newPath);
      const directory = this.getDirectoryPath(newPath);

      // Use the original filename to determine the appropriate suffix
      const suffix = this.generateConflictSuffix(oldPath, counter);
      finalPath = directory ? `${directory}/${baseName}${suffix}${extension}` : `${baseName}${suffix}${extension}`;

      counter++;
    }

    return finalPath;
  }

  private static getFileName(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    const fileName = lastSlash === -1 ? filePath : filePath.substring(lastSlash + 1);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
  }

  private static getFileNameWithoutExtension(filePath: string): string {
    return this.getFileName(filePath);
  }

  private static getDirectoryPath(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash === -1 ? '' : filePath.substring(0, lastSlash);
  }

  private static getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    const lastSlash = filePath.lastIndexOf('/');
    // Make sure the dot is after the last slash (not in directory name)
    return lastDot === -1 || lastDot < lastSlash ? '' : filePath.substring(lastDot);
  }

  private static generateConflictSuffix(originalPath: string, counter: number): string {
    // Generate meaningful suffixes based on the original file type
    if (originalPath.includes('.service.') || originalPath.endsWith('.service.ts')) return '-svc';
    if (originalPath.includes('.component.') || originalPath.endsWith('.component.ts')) return '-comp';
    if (originalPath.includes('.model.') || originalPath.endsWith('.model.ts')) return '-model';
    return `-${counter}`;
  }
}

/**
 * Test scenario builder for creating complex test cases
 */
export class TestScenarioBuilder {
  private vfs: VirtualFileSystem;
  private expectedRenames: RenameOperation[] = [];
  private expectedImportUpdates: ImportUpdate[] = [];

  constructor(initialVfs?: VirtualFileSystem) {
    this.vfs = initialVfs || new VirtualFileSystem();
  }

  /**
   * Add a file to the test scenario
   */
  addFile(path: string, content: string): this {
    this.vfs.writeFile(path, content);
    return this;
  }

  /**
   * Expect a file to be renamed
   */
  expectRename(oldPath: string, newPath: string): this {
    this.expectedRenames.push({ oldPath, newPath });
    return this;
  }

  /**
   * Expect an import to be updated
   */
  expectImportUpdate(filePath: string, oldImport: string, newImport: string): this {
    this.expectedImportUpdates.push({ filePath, oldImport, newImport });
    return this;
  }

  /**
   * Get the virtual file system
   */
  getVirtualFileSystem(): VirtualFileSystem {
    return this.vfs;
  }

  /**
   * Get expected rename operations
   */
  getExpectedRenames(): RenameOperation[] {
    return [...this.expectedRenames];
  }

  /**
   * Get expected import updates
   */
  getExpectedImportUpdates(): ImportUpdate[] {
    return [...this.expectedImportUpdates];
  }

  /**
   * Create a snapshot for comparison
   */
  createSnapshot(): VirtualFile[] {
    return this.vfs.snapshot();
  }
}
