import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join, relative, extname, resolve } from 'path';
import { RefactorResult, RenamedFile, ContentChange } from '../types';

/**
 * Represents a parsed import statement
 */
interface ParsedImport {
  /** The full import statement text */
  fullStatement: string;
  /** The import path (what's between the quotes) */
  importPath: string;
  /** The line number where the import was found (1-based) */
  lineNumber: number;
  /** The start position of the import path in the line */
  startPos: number;
  /** The end position of the import path in the line */
  endPos: number;
}

/**
 * Result of updating imports in a file
 */
interface ImportUpdateResult {
  /** Whether any imports were updated */
  hasChanges: boolean;
  /** The updated content */
  content: string;
  /** List of changes made */
  changes: ContentChange[];
}

/**
 * Interface for file system operations (allows for easy testing)
 */
interface FileSystem {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  getAllTsFiles(rootDir: string): string[];
}

/**
 * Real file system implementation
 */
class RealFileSystem implements FileSystem {
  readFile(path: string): string {
    return readFileSync(path, 'utf-8');
  }

  writeFile(path: string, content: string): void {
    writeFileSync(path, content, 'utf-8');
  }

  exists(path: string): boolean {
    return existsSync(path);
  }

  getAllTsFiles(rootDir: string): string[] {
    // Use imported readdirSync
    const files: string[] = [];

    function walkDir(dir: string) {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip common directories that shouldn't contain imports
            if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
              walkDir(fullPath);
            }
          } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    walkDir(rootDir);
    return files;
  }
}

/**
 * Improved import updater with better separation of concerns and testability
 */
export class ImportUpdater {
  private fileSystem: FileSystem;

  constructor(
    private dryRun: boolean,
    fileSystem?: FileSystem
  ) {
    this.fileSystem = fileSystem || new RealFileSystem();
  }

  /**
   * Updates import statements in all files based on the renamed files
   */
  async updateImports(rootDir: string, renamedFiles: RenamedFile[], result: RefactorResult): Promise<void> {
    if (renamedFiles.length === 0) {
      return;
    }

    // Create a mapping of old absolute paths to new absolute paths
    const pathMap = this.createPathMapping(renamedFiles);

    // Get all TypeScript files that might contain imports
    const allTsFiles = this.fileSystem.getAllTsFiles(rootDir);

    // For each file, check and update imports
    for (const filePath of allTsFiles) {
      try {
        // Check if this file exists (it might have been renamed)
        const actualFilePath = this.getActualFilePath(filePath);

        if (!this.fileSystem.exists(actualFilePath)) {
          continue;
        }

        const content = this.fileSystem.readFile(actualFilePath);
        const updateResult = this.updateImportsInFile(content, actualFilePath, pathMap);

        if (updateResult.hasChanges) {
          result.contentChanges.push(...updateResult.changes);

          if (!this.dryRun) {
            this.fileSystem.writeFile(actualFilePath, updateResult.content);
          }
        }
      } catch (error) {
        result.errors.push({
          filePath: filePath,
          message: `Failed to update imports: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }

  /**
   * Creates a mapping from old absolute paths to new absolute paths
   */
  private createPathMapping(renamedFiles: RenamedFile[]): Map<string, string> {
    const pathMap = new Map<string, string>();

    for (const renamed of renamedFiles) {
      // Store both with and without extensions for flexible matching
      const oldPathResolved = resolve(renamed.oldPath);
      const newPathResolved = resolve(renamed.newPath);

      pathMap.set(oldPathResolved, newPathResolved);

      // Also store without extension for import resolution
      const oldWithoutExt = this.removeExtension(oldPathResolved);
      const newWithoutExt = this.removeExtension(newPathResolved);
      pathMap.set(oldWithoutExt, newWithoutExt);
    }

    return pathMap;
  }

  /**
   * Gets the actual file path, accounting for renames
   * Since getAllTsFiles returns current existing files, we don't need to map them
   */
  private getActualFilePath(originalPath: string): string {
    // The files returned by getAllTsFiles() are already the current paths after renames
    // We don't need to map them again
    return originalPath;
  }

  /**
   * Updates imports in a single file content
   */
  private updateImportsInFile(content: string, filePath: string, pathMap: Map<string, string>): ImportUpdateResult {
    const imports = this.parseImports(content);
    const changes: ContentChange[] = [];
    let updatedContent = content;
    let hasChanges = false;

    // Process imports in reverse order to maintain line/column positions
    for (let i = imports.length - 1; i >= 0; i--) {
      const importStatement = imports[i];

      // Resolve the import to an absolute path (handles both relative and absolute imports)
      const resolvedImportPath = this.resolveImportPath(filePath, importStatement.importPath);

      // Skip if we couldn't resolve the import (e.g., external packages)
      if (!resolvedImportPath) {
        continue;
      }

      // Check if this resolved path maps to a new path
      const newPath = pathMap.get(resolvedImportPath);

      if (newPath) {
        // Calculate the new import path, preserving the original import style (relative vs absolute)
        const newImportPath = this.calculateNewImportPath(filePath, newPath, importStatement.importPath);

        // Replace the import path in the content
        const lines = updatedContent.split('\n');
        const lineIndex = importStatement.lineNumber - 1;
        const line = lines[lineIndex];

        const newLine =
          line.substring(0, importStatement.startPos) + newImportPath + line.substring(importStatement.endPos);

        lines[lineIndex] = newLine;
        updatedContent = lines.join('\n');
        hasChanges = true;

        changes.push({
          filePath,
          line: importStatement.lineNumber,
          oldContent: line,
          newContent: newLine,
          reason: 'Updated import statements for renamed files'
        });
      }
    }

    return {
      hasChanges,
      content: updatedContent,
      changes
    };
  }

  /**
   * Parses all import statements from file content
   */
  private parseImports(content: string): ParsedImport[] {
    const imports: ParsedImport[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      // Match import statements with various quote styles
      const importRegex = /from\s+(['"`])([^'"`]+)\1/g;
      let match;

      while ((match = importRegex.exec(line)) !== null) {
        const fullStatement = match[0];
        const importPath = match[2];
        const startPos = match.index + match[0].indexOf(match[1]) + 1; // Position after opening quote
        const endPos = startPos + importPath.length;

        imports.push({
          fullStatement,
          importPath,
          lineNumber,
          startPos,
          endPos
        });
      }
    }

    return imports;
  }

  /**
   * Checks if an import path is relative (starts with ./ or ../)
   */
  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Checks if an import path is an absolute import to a project file
   * (e.g., 'app/shared/component' but not '@angular/core' or 'rxjs')
   */
  private isProjectAbsoluteImport(importPath: string): boolean {
    // Skip node_modules imports (those starting with letters but no path separators at the beginning)
    if (importPath.startsWith('@') || (!importPath.includes('/') && !importPath.startsWith('.'))) {
      return false;
    }

    // Skip imports that are clearly external packages
    const externalPackagePatterns = ['@angular/', '@ngrx/', 'rxjs', 'lodash', 'moment'];

    if (externalPackagePatterns.some(pattern => importPath.startsWith(pattern))) {
      return false;
    }

    // If it contains a path separator and doesn't start with . or @, treat it as a project absolute import
    return importPath.includes('/') && !importPath.startsWith('@') && !importPath.startsWith('.');
  }

  /**
   * Resolves a project absolute import to an absolute file path
   * (e.g., 'app/shared/component' -> '/full/path/to/src/app/shared/component.ts')
   */
  private resolveProjectAbsoluteImport(fromFilePath: string, importPath: string): string {
    // Find the project root by looking for src directory in the path
    const srcIndex = fromFilePath.indexOf('src');
    if (srcIndex === -1) {
      return ''; // Can't resolve without src directory
    }

    // Get the path up to and including src
    const projectSrcPath = fromFilePath.substring(0, srcIndex + 3); // +3 for 'src'

    // Construct the full path by combining project src path with the import path
    let fullPath = resolve(projectSrcPath, importPath);

    // If the import already has an extension, use it as-is
    if (importPath.endsWith('.ts') || importPath.endsWith('.js')) {
      return this.removeExtension(fullPath);
    }

    // Add .ts extension for TypeScript files
    fullPath = fullPath + '.ts';
    return this.removeExtension(fullPath);
  }

  /**
   * Resolves an import path (relative or absolute) to an absolute file path
   */
  private resolveImportPath(fromFilePath: string, importPath: string): string {
    // Handle relative imports (starting with ./ or ../)
    if (this.isRelativeImport(importPath)) {
      const fromDir = dirname(fromFilePath);
      const resolvedPath = resolve(fromDir, importPath);

      // If the import already has an extension, use it as-is
      if (importPath.endsWith('.ts') || importPath.endsWith('.js')) {
        return this.removeExtension(resolvedPath);
      }

      // For TypeScript imports without explicit extensions, we need to add .ts for resolution
      // but we also need to check if the import path itself (without .ts) maps to a renamed file
      const withTsExtension = resolvedPath + '.ts';
      return this.removeExtension(withTsExtension);
    }

    // Handle absolute imports (like 'app/shared/component')
    if (this.isProjectAbsoluteImport(importPath)) {
      return this.resolveProjectAbsoluteImport(fromFilePath, importPath);
    }

    // Skip other imports (node_modules, etc.) by returning empty string
    return '';
  }

  /**
   * Calculates the new import path, preserving the original style (relative vs absolute)
   */
  private calculateNewImportPath(fromFilePath: string, toFilePath: string, originalImportPath: string): string {
    // If the original was an absolute import, preserve the absolute style
    if (this.isProjectAbsoluteImport(originalImportPath)) {
      return this.calculateAbsoluteImportPath(toFilePath, originalImportPath);
    }

    // Otherwise, calculate a relative import path
    return this.calculateRelativeImportPath(fromFilePath, toFilePath, originalImportPath);
  }

  /**
   * Calculates the absolute import path for a renamed file, preserving the original style
   */
  private calculateAbsoluteImportPath(toFilePath: string, originalImportPath: string): string {
    // Find the src directory in the target file path
    const srcIndex = toFilePath.indexOf('src');
    if (srcIndex === -1) {
      return originalImportPath; // Fallback to original if we can't find src
    }

    // Get the path after src directory
    const pathAfterSrc = toFilePath.substring(srcIndex + 4); // +4 to skip 'src/'

    // Remove the .ts extension
    let newAbsolutePath = this.removeExtension(pathAfterSrc);

    // Normalize path separators to forward slashes (TypeScript/ES modules standard)
    newAbsolutePath = newAbsolutePath.replace(/\\/g, '/');

    // Check if the original import had an explicit .ts/.js extension
    const hasExplicitExtension = originalImportPath.endsWith('.ts') || originalImportPath.endsWith('.js');
    if (hasExplicitExtension) {
      const extension = originalImportPath.endsWith('.ts') ? '.ts' : '.js';
      newAbsolutePath += extension;
    }

    return newAbsolutePath;
  }

  /**
   * Calculates the relative import path from one file to another
   */
  private calculateRelativeImportPath(fromFilePath: string, toFilePath: string, originalImportPath?: string): string {
    const fromDir = dirname(fromFilePath);

    // If we have the original import path, we need to preserve its extension style
    if (originalImportPath) {
      // Check if the original import had an explicit .ts/.js extension
      const hasExplicitExtension = originalImportPath.endsWith('.ts') || originalImportPath.endsWith('.js');

      let toFileForCalculation: string;
      if (hasExplicitExtension) {
        // Keep the extension for calculation
        toFileForCalculation = toFilePath;
      } else {
        // Remove the .ts extension but preserve other parts of the filename
        toFileForCalculation = this.removeExtension(toFilePath);
      }

      let relativePath = relative(fromDir, toFileForCalculation);

      // Normalize path separators to forward slashes (TypeScript/ES modules standard)
      relativePath = relativePath.replace(/\\/g, '/');

      // Ensure relative path starts with ./ if it doesn't start with ../
      if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
        relativePath = './' + relativePath;
      }

      return relativePath;
    }

    // Fallback to original behavior if no original import path provided
    const toFileWithoutExt = this.removeExtension(toFilePath);
    let relativePath = relative(fromDir, toFileWithoutExt);

    // Normalize path separators to forward slashes (TypeScript/ES modules standard)
    relativePath = relativePath.replace(/\\/g, '/');

    // Ensure relative path starts with ./ if it doesn't start with ../
    if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
      relativePath = './' + relativePath;
    }

    return relativePath;
  }

  /**
   * Removes file extension from a path
   */
  private removeExtension(filePath: string): string {
    const ext = extname(filePath);
    return ext ? filePath.slice(0, -ext.length) : filePath;
  }
}
