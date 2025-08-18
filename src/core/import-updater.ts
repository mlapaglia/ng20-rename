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
   * Updates imports in a single file content using raw string replacement
   */
  private updateImportsInFile(content: string, filePath: string, pathMap: Map<string, string>): ImportUpdateResult {
    const changes: ContentChange[] = [];
    let updatedContent = content;
    let hasChanges = false;

    // Process each path mapping individually for more precise matching
    for (const [oldPath, newPath] of pathMap) {
      const oldFileName = basename(oldPath);
      const newFileName = basename(newPath);
      const oldFileNameNoExt = this.removeExtension(oldFileName);
      const newFileNameNoExt = this.removeExtension(newFileName);

      // Try to match with and without extensions
      const replacementPairs = [
        { old: oldFileName, new: newFileName },
        { old: oldFileNameNoExt, new: newFileNameNoExt }
      ].filter(pair => pair.old !== pair.new);

      for (const { old: oldPattern, new: newPattern } of replacementPairs) {
        const patterns = this.createImportPatterns(oldPattern);

        for (const pattern of patterns) {
          // Find all matches first, then replace from end to beginning to preserve indices
          const regex = new RegExp(pattern.regex, 'g');
          const matches = [];
          let match;

          while ((match = regex.exec(updatedContent)) !== null) {
            matches.push({
              match: match,
              index: match.index,
              fullMatch: match[0],
              prefix: match[1],
              openQuote: match[2],
              pathPrefix: match[3] || '',
              closeQuote: match[4]
            });
          }

          // Process matches in reverse order to maintain correct indices
          for (let i = matches.length - 1; i >= 0; i--) {
            const matchInfo = matches[i];

            // Build the new import statement by replacing just the filename part
            const newImportStatement = `${matchInfo.prefix}${matchInfo.openQuote}${matchInfo.pathPrefix}${newPattern}${matchInfo.closeQuote}`;

            // Replace this specific occurrence
            const beforeReplacement = updatedContent;
            updatedContent =
              updatedContent.substring(0, matchInfo.index) +
              newImportStatement +
              updatedContent.substring(matchInfo.index + matchInfo.fullMatch.length);

            if (beforeReplacement !== updatedContent) {
              hasChanges = true;

              // Find which line this change was on for reporting (use original content for line calculation)
              const lineNumber = beforeReplacement.substring(0, matchInfo.index).split('\n').length;

              changes.push({
                filePath,
                line: lineNumber,
                oldContent: matchInfo.fullMatch,
                newContent: newImportStatement,
                reason: 'Updated import statements for renamed files'
              });
            }
          }
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
   * Creates regex patterns to match import statements with specific filenames
   */
  private createImportPatterns(oldFileName: string): Array<{ regex: string; prefix: string }> {
    // Escape special regex characters in the filename
    const escapedFileName = oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const patterns = [
      // Traditional imports: from 'path/filename'
      {
        regex: `(from\\s+)(['"\`])([^'"\`]*[/\\\\])?${escapedFileName}(['"\`])`,
        prefix: 'from '
      },
      // Direct imports: import 'path/filename'
      {
        regex: `(import\\s+)(['"\`])([^'"\`]*[/\\\\])?${escapedFileName}(['"\`])`,
        prefix: 'import '
      },
      // templateUrl: 'path/filename'
      {
        regex: `(templateUrl:\\s*)(['"\`])([^'"\`]*[/\\\\])?${escapedFileName}(['"\`])`,
        prefix: 'templateUrl: '
      },
      // styleUrl: 'path/filename'
      {
        regex: `(styleUrl:\\s*)(['"\`])([^'"\`]*[/\\\\])?${escapedFileName}(['"\`])`,
        prefix: 'styleUrl: '
      },
      // styleUrls array: ['path/filename']
      {
        regex: `(styleUrls:\\s*\\[[^\\]]*?)(['"\`])([^'"\`]*[/\\\\])?${escapedFileName}(['"\`])`,
        prefix: 'styleUrls: ['
      }
    ];

    return patterns;
  }

  /**
   * Removes file extension from a path
   */
  private removeExtension(filePath: string): string {
    const ext = extname(filePath);
    return ext ? filePath.slice(0, -ext.length) : filePath;
  }
}
