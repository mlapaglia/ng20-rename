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

      // Only process relative imports
      if (!this.isRelativeImport(importStatement.importPath)) {
        continue;
      }

      // Resolve the import to an absolute path
      const resolvedImportPath = this.resolveImportPath(filePath, importStatement.importPath);

      // Check if this resolved path maps to a new path
      const newPath = pathMap.get(resolvedImportPath);

      if (newPath) {
        // Calculate the new relative import path, preserving the original import style
        const newImportPath = this.calculateRelativeImportPath(filePath, newPath, importStatement.importPath);

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
   * Resolves a relative import path to an absolute path
   */
  private resolveImportPath(fromFilePath: string, importPath: string): string {
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
