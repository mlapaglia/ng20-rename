import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, basename, join, relative, extname } from 'path';
import { RefactorResult, RenamedFile, ContentChange } from '../types';

/**
 * Handles updating import statements across all files when files are renamed
 */
export class ImportUpdater {
  constructor(private dryRun: boolean) {}

  /**
   * Updates import statements in all files based on the renamed files
   */
  async updateImports(
    rootDir: string,
    renamedFiles: RenamedFile[],
    result: RefactorResult
  ): Promise<void> {
    if (renamedFiles.length === 0) {
      return;
    }





    // Create a map of old paths to new paths for quick lookup
    const renameMap = new Map<string, string>();
    for (const renamed of renamedFiles) {
      renameMap.set(renamed.oldPath, renamed.newPath);

    }

    // Find all TypeScript files that might contain imports
    const allTsFiles = this.findAllTypeScriptFiles(rootDir);


    for (const filePath of allTsFiles) {
      // Skip files that were renamed (they'll be processed by their new names)
      if (renameMap.has(filePath)) {
        continue;
      }

      // Check if the file exists (might have been renamed)
      const actualFilePath = renameMap.get(filePath) || filePath;
      if (!existsSync(actualFilePath)) {
        continue;
      }

      try {
        const content = readFileSync(actualFilePath, 'utf-8');

        const updatedContent = this.updateImportsInFile(content, actualFilePath, renameMap);

        if (updatedContent !== content) {

          const changes = this.getContentChanges(
            actualFilePath,
            content,
            updatedContent,
            'Updated import statements for renamed files'
          );
          result.contentChanges.push(...changes);

          if (!this.dryRun) {
            writeFileSync(actualFilePath, updatedContent, 'utf-8');
          }
        }
      } catch (error) {
        result.errors.push({
          filePath: actualFilePath,
          message: `Failed to update imports: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }

  /**
   * Updates import statements in a single file
   */
  private updateImportsInFile(
    content: string,
    filePath: string,
    renameMap: Map<string, string>
  ): string {
    let updatedContent = content;
    const fileDir = dirname(filePath);



    // Match import statements with various quote styles - simpler regex focusing on the path
    const importRegex = /from\s+['"`]([^'"`]+)['"`]/g;
    let match;

    const replacements: Array<{ original: string; replacement: string }> = [];

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Only process relative imports (starting with ./ or ../)
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Resolve the full path of the imported file
        const resolvedImportPath = this.resolveImportPath(fileDir, importPath);
        
        // Check if this file was renamed
        const newPath = renameMap.get(resolvedImportPath);
        
        if (newPath) {
          // Calculate the new relative import path
          const newImportPath = this.getRelativeImportPath(fileDir, newPath);
          
          // Store the replacement to avoid regex issues with multiple replacements
          replacements.push({
            original: match[0],
            replacement: match[0].replace(importPath, newImportPath)
          });
        }
      }
    }

    // Apply all replacements
    for (const { original, replacement } of replacements) {
      updatedContent = updatedContent.replace(original, replacement);
    }

    return updatedContent;
  }

  /**
   * Resolves a relative import path to an absolute path
   */
  private resolveImportPath(fromDir: string, importPath: string): string {
    // Handle relative imports
    let resolvedPath = join(fromDir, importPath);
    
    // Always try adding .ts extension first (most common case)
    const possiblePaths = [
      resolvedPath + '.ts',
      resolvedPath + '.js',
      resolvedPath
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
    
    // Default to .ts if file doesn't exist yet (might be renamed)
    return resolvedPath + '.ts';
  }

  /**
   * Gets the relative import path from one directory to a file
   */
  private getRelativeImportPath(fromDir: string, toPath: string): string {
    const toDir = dirname(toPath);
    const toFileName = basename(toPath, extname(toPath));
    
    if (fromDir === toDir) {
      // Same directory
      return `./${toFileName}`;
    }
    
    // Use Node.js relative path calculation
    const relativePath = relative(fromDir, toPath);
    const relativePathWithoutExt = relativePath.replace(/\.(ts|js)$/, '');
    
    // Ensure it starts with ./ if it's not already relative
    if (!relativePathWithoutExt.startsWith('.')) {
      return `./${relativePathWithoutExt}`;
    }
    
    return relativePathWithoutExt.replace(/\\/g, '/'); // Normalize path separators
  }

  /**
   * Finds all TypeScript files in the directory
   */
  private findAllTypeScriptFiles(rootDir: string): string[] {
    const fs = require('fs');
    const path = require('path');
    const files: string[] = [];

    function walkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories that shouldn't contain imports
          if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }

    walkDir(rootDir);
    return files;
  }

  /**
   * Compares old and new content to generate detailed change information
   */
  private getContentChanges(
    filePath: string,
    oldContent: string,
    newContent: string,
    reason: string
  ): ContentChange[] {
    const changes: ContentChange[] = [];
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Simple line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        changes.push({
          filePath,
          line: i + 1,
          oldContent: oldLine,
          newContent: newLine,
          reason
        });
      }
    }

    return changes;
  }
}
