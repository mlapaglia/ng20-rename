import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, basename, join, extname, resolve } from 'path';
import { RefactorResult, RenamedFile, ContentChange } from '../types';

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

    // Find the appropriate search root to catch imports in parent directories
    const searchRoot = this.findSearchRoot(rootDir);

    // Get all TypeScript files that might contain imports
    const allTsFiles = this.fileSystem.getAllTsFiles(searchRoot);

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
   * Finds the appropriate search root directory to scan for import statements.
   * This ensures we catch imports in parent directories that might reference renamed files.
   */
  private findSearchRoot(rootDir: string): string {
    let currentDir = rootDir;

    // Walk up the directory tree looking for common Angular project indicators
    while (currentDir !== dirname(currentDir)) {
      // Stop at filesystem root
      const parentDir = dirname(currentDir);

      // Check if we've reached a directory named 'src' - this is usually the Angular source root
      if (basename(currentDir) === 'src') {
        return currentDir;
      }

      // Check if the parent contains typical Angular project files
      const packageJsonPath = join(parentDir, 'package.json');
      const angularJsonPath = join(parentDir, 'angular.json');

      if (this.fileSystem.exists(packageJsonPath) || this.fileSystem.exists(angularJsonPath)) {
        // If we found project root files, search from the 'src' directory if it exists
        const srcDir = join(parentDir, 'src');
        if (this.fileSystem.exists(srcDir)) {
          return srcDir;
        }
        // Otherwise, search from the project root
        return parentDir;
      }

      currentDir = parentDir;
    }

    // If we couldn't find a better root, use the original rootDir
    return rootDir;
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
   * Updates imports in a single file content using intelligent mapping
   */
  private updateImportsInFile(content: string, filePath: string, pathMap: Map<string, string>): ImportUpdateResult {
    const changes: ContentChange[] = [];
    let updatedContent = content;
    let hasChanges = false;

    // First, find all import statements in the file
    const importMatches = this.findAllImportStatements(content);

    // Remove any overlapping matches to prevent corruption
    const uniqueMatches = this.removeOverlappingMatches(importMatches);

    // Process each import statement and find the best mapping
    for (let i = uniqueMatches.length - 1; i >= 0; i--) {
      const importMatch = uniqueMatches[i];
      const bestMapping = this.findBestMapping(importMatch, pathMap, filePath);

      if (bestMapping) {
        const newImportStatement = `${importMatch.prefix}${importMatch.openQuote}${importMatch.pathPrefix}${bestMapping.newFileName}${importMatch.closeQuote}`;

        // Replace this specific occurrence
        const beforeReplacement = updatedContent;
        updatedContent =
          updatedContent.substring(0, importMatch.index) +
          newImportStatement +
          updatedContent.substring(importMatch.index + importMatch.fullMatch.length);

        if (beforeReplacement !== updatedContent) {
          hasChanges = true;

          // Find which line this change was on for reporting (use original content for line calculation)
          const lineNumber = beforeReplacement.substring(0, importMatch.index).split('\n').length;

          changes.push({
            filePath,
            line: lineNumber,
            oldContent: importMatch.fullMatch,
            newContent: newImportStatement,
            reason: 'Updated import statements for renamed files'
          });
        }
      }
    }

    return {
      hasChanges,
      content: updatedContent,
      changes
    };
  }

  /**
   * Finds all import statements in the content
   */
  private findAllImportStatements(content: string): Array<{
    index: number;
    fullMatch: string;
    prefix: string;
    openQuote: string;
    pathPrefix: string;
    fileName: string;
    closeQuote: string;
  }> {
    const importMatches = [];
    const patterns = [
      // Traditional imports: import { ... } from 'path/filename'
      { regex: /(import\s+[^'"`]*from\s+)(['"`])([^'"`]*[/\\])?([^'"`/\\]+)(['"`])/, prefix: 'import from' },
      // Direct imports: import 'path/filename'
      { regex: /(import\s+)(['"`])([^'"`]*[/\\])?([^'"`/\\]+)(['"`])/, prefix: 'import ' },
      // templateUrl: 'path/filename'
      { regex: /(templateUrl:\s*)(['"`])([^'"`]*[/\\])?([^'"`/\\]+)(['"`])/, prefix: 'templateUrl: ' },
      // styleUrl: 'path/filename'
      { regex: /(styleUrl:\s*)(['"`])([^'"`]*[/\\])?([^'"`/\\]+)(['"`])/, prefix: 'styleUrl: ' }
    ];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex, 'g');
      let match;

      while ((match = regex.exec(content)) !== null) {
        importMatches.push({
          index: match.index,
          fullMatch: match[0],
          prefix: match[1],
          openQuote: match[2],
          pathPrefix: match[3] || '',
          fileName: match[4],
          closeQuote: match[5]
        });
      }
    }

    // Handle styleUrls arrays with special two-stage approach
    const styleUrlsRegex = /styleUrls:\s*\[([^\]]+)\]/g;
    let styleUrlsMatch;

    while ((styleUrlsMatch = styleUrlsRegex.exec(content)) !== null) {
      const arrayContent = styleUrlsMatch[1];
      const filePathRegex = /(['"`])([^'"`]*[/\\])?([^'"`/\\]+)(['"`])/g;
      let fileMatch;

      while ((fileMatch = filePathRegex.exec(arrayContent)) !== null) {
        // Calculate the absolute position in the original content
        const absoluteIndex = styleUrlsMatch.index + styleUrlsMatch[0].indexOf(fileMatch[0]);
        
        importMatches.push({
          index: absoluteIndex,
          fullMatch: fileMatch[0],
          prefix: '', // We'll handle the prefix differently for styleUrls
          openQuote: fileMatch[1],
          pathPrefix: fileMatch[2] || '',
          fileName: fileMatch[3],
          closeQuote: fileMatch[4]
        });
      }
    }

    // Sort by index in descending order for safe replacement
    return importMatches.sort((a, b) => b.index - a.index);
  }

  /**
   * Removes overlapping import matches to prevent string replacement corruption
   */
  private removeOverlappingMatches(
    matches: Array<{
      index: number;
      fullMatch: string;
      prefix: string;
      openQuote: string;
      pathPrefix: string;
      fileName: string;
      closeQuote: string;
    }>
  ): typeof matches {
    // Sort by index to process overlaps correctly
    const sorted = [...matches].sort((a, b) => a.index - b.index);
    const unique: typeof matches = [];

    for (const match of sorted) {
      const endIndex = match.index + match.fullMatch.length;

      // Check if this match overlaps with any already accepted match
      const hasOverlap = unique.some(existing => {
        const existingEnd = existing.index + existing.fullMatch.length;
        return match.index < existingEnd && endIndex > existing.index;
      });

      if (!hasOverlap) {
        unique.push(match);
      }
    }

    return unique;
  }

  /**
   * Finds the best mapping for an import statement based on specificity and context
   */
  private findBestMapping(
    importMatch: { fileName: string; pathPrefix: string },
    pathMap: Map<string, string>,
    currentFilePath: string
  ): { newFileName: string } | null {
    const candidates: Array<{
      mapping: [string, string];
      score: number;
      newFileName: string;
    }> = [];

    // Evaluate all potential mappings
    for (const [oldPath, newPath] of pathMap) {
      const oldFileName = basename(oldPath);
      const newFileName = basename(newPath);
      const oldFileNameNoExt = this.removeExtension(oldFileName);
      const newFileNameNoExt = this.removeExtension(newFileName);

      // Check if this mapping could match the import
      let score = 0;
      let matchedFileName = '';

      // Exact filename match (with extension) - highest priority
      if (importMatch.fileName === oldFileName) {
        score = 1000;
        matchedFileName = newFileName;
      }
      // Exact filename match (without extension) - high priority
      else if (importMatch.fileName === oldFileNameNoExt) {
        score = 500;
        matchedFileName = newFileNameNoExt;
      }
      // Skip if no match
      else {
        continue;
      }

      // Bonus points for more specific mappings
      // Prefer mappings where the old file has a more specific name (longer base name)
      score += oldFileNameNoExt.length;

      // Bonus points if the old path is closer to the current file (same directory)
      const oldDir = dirname(resolve(oldPath));
      const currentDir = dirname(resolve(currentFilePath));
      if (oldDir === currentDir) {
        score += 100;
      }

      // Penalty for mappings that would create circular references
      const newFileNameNoExt2 = this.removeExtension(matchedFileName);
      const currentFileNameNoExt = this.removeExtension(basename(currentFilePath));
      if (newFileNameNoExt2 === currentFileNameNoExt) {
        score -= 10000; // Heavy penalty to avoid self-references
      }

      candidates.push({
        mapping: [oldPath, newPath],
        score,
        newFileName: matchedFileName
      });
    }

    // Return the highest scoring candidate
    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return { newFileName: candidates[0].newFileName };
  }

  /**
   * Removes file extension from a path
   */
  private removeExtension(filePath: string): string {
    const ext = extname(filePath);
    return ext ? filePath.slice(0, -ext.length) : filePath;
  }
}
