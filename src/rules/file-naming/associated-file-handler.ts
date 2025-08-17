import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join, extname } from 'path';
import { AngularFileType } from '../../types';

export interface AssociatedFileResult {
  renames: Array<{
    oldPath: string;
    newPath: string;
  }>;
  contentChanges: Array<{
    filePath: string;
    newContent: string;
    reason: string;
  }>;
}

/**
 * Handles renaming of associated files (HTML, CSS, spec files)
 */
export class AssociatedFileHandler {
  /**
   * Gets renames for associated files (HTML, CSS, SCSS, LESS)
   */
  getAssociatedFileRenames(
    originalFilePath: string,
    oldFileNameWithoutExt: string,
    className: string,
    fileType: AngularFileType
  ): Array<{ oldPath: string; newPath: string }> {
    const renames: Array<{ oldPath: string; newPath: string }> = [];
    const fileDir = dirname(originalFilePath);
    const newFileNameWithoutExt = this.toKebabCase(this.removeClassTypeSuffix(className, fileType));

    // Define associated file extensions for components
    const associatedExtensions = [
      { ext: '.html', description: 'template' },
      { ext: '.css', description: 'stylesheet' },
      { ext: '.scss', description: 'SCSS stylesheet' },
      { ext: '.less', description: 'LESS stylesheet' }
    ];

    for (const { ext } of associatedExtensions) {
      const oldAssociatedPath = join(fileDir, `${oldFileNameWithoutExt}${ext}`);
      const newAssociatedPath = join(fileDir, `${newFileNameWithoutExt}${ext}`);

      if (existsSync(oldAssociatedPath)) {
        // Only rename if the target doesn't exist or is the same file
        if (!existsSync(newAssociatedPath) || newAssociatedPath === oldAssociatedPath) {
          renames.push({
            oldPath: oldAssociatedPath,
            newPath: newAssociatedPath
          });
        }
      }
    }

    return renames;
  }

  /**
   * Gets renames and content changes for spec files
   */
  getSpecFileRenames(
    originalFilePath: string,
    oldFileNameWithoutExt: string,
    className: string,
    fileType: AngularFileType,
    expectedFileName: string
  ): AssociatedFileResult {
    const result: AssociatedFileResult = {
      renames: [],
      contentChanges: []
    };

    const fileDir = dirname(originalFilePath);
    const newFileNameWithoutExt = basename(expectedFileName, extname(expectedFileName));

    const oldSpecPath = join(fileDir, `${oldFileNameWithoutExt}.spec.ts`);
    const newSpecPath = join(fileDir, `${newFileNameWithoutExt}.spec.ts`);

    if (existsSync(oldSpecPath)) {
      // Only rename if the target doesn't exist or is the same file
      if (!existsSync(newSpecPath) || newSpecPath === oldSpecPath) {
        result.renames.push({
          oldPath: oldSpecPath,
          newPath: newSpecPath
        });

        // Update import statements in spec file
        try {
          const specContent = readFileSync(oldSpecPath, 'utf-8');
          const updatedSpecContent = this.updateSpecFileImports(
            specContent,
            basename(originalFilePath),
            expectedFileName
          );

          if (updatedSpecContent !== specContent) {
            result.contentChanges.push({
              filePath: newSpecPath,
              newContent: updatedSpecContent,
              reason: 'Updated import statements to match renamed file'
            });
          }
        } catch {
          // If we can't read the spec file, just rename it without updating imports
        }
      }
    }

    return result;
  }

  /**
   * Updates import statements in spec files to match renamed files
   */
  private updateSpecFileImports(specContent: string, oldFileName: string, newFileName: string): string {
    let updatedContent = specContent;

    // Extract base names without extensions for import matching
    const oldFileBase = oldFileName.replace(/\.[^.]+$/, ''); // Remove extension
    const newFileBase = newFileName.replace(/\.[^.]+$/, ''); // Remove extension

    // Common import patterns to update (both with and without extensions)
    // Updated patterns to match both forward slashes and backslashes in paths
    const importPatterns = [
      // Pattern for imports without extensions: from './user.service' or from './path\user.service'
      new RegExp(`from\\s+['"\`]\\.\\/([^'"\`]*[/\\\\])?(${oldFileBase.replace(/\./g, '\\.')})['"\`]`, 'g'),
      new RegExp(`import\\s+['"\`]\\.\\/([^'"\`]*[/\\\\])?(${oldFileBase.replace(/\./g, '\\.')})['"\`]`, 'g'),
      // Pattern for imports with extensions: from './user.service.ts' or from './path\user.service.ts'
      new RegExp(`from\\s+['"\`]\\.\\/([^'"\`]*[/\\\\])?(${oldFileName.replace(/\./g, '\\.')})['"\`]`, 'g'),
      new RegExp(`import\\s+['"\`]\\.\\/([^'"\`]*[/\\\\])?(${oldFileName.replace(/\./g, '\\.')})['"\`]`, 'g')
    ];

    for (const pattern of importPatterns) {
      updatedContent = updatedContent.replace(pattern, (match, pathPrefix = '', fileName) => {
        // Normalize path separators to forward slashes
        const normalizedPathPrefix = pathPrefix.replace(/\\/g, '/');

        // If the match includes the full filename with extension, replace with new base name (no extension)
        if (fileName === oldFileName) {
          const replacement = match.replace(oldFileName, newFileBase);
          return replacement.replace(pathPrefix, normalizedPathPrefix);
        }
        // If the match is just the base name, replace with new base name
        if (fileName === oldFileBase) {
          const replacement = match.replace(oldFileBase, newFileBase);
          return replacement.replace(pathPrefix, normalizedPathPrefix);
        }
        return match;
      });
    }

    // Additional step: normalize all remaining backslashes in import paths to forward slashes
    // This handles imports that weren't specifically renamed but may contain backslashes
    updatedContent = updatedContent.replace(/(from\s+['"`]\.\/[^'"`]*['"`])/g, match => match.replace(/\\/g, '/'));

    updatedContent = updatedContent.replace(/(import\s+['"`]\.\/[^'"`]*['"`])/g, match => match.replace(/\\/g, '/'));

    return updatedContent;
  }

  /**
   * Removes class type suffixes from class names
   */
  private removeClassTypeSuffix(className: string, fileType: AngularFileType): string {
    const suffixes: Partial<Record<AngularFileType, string>> = {
      [AngularFileType.COMPONENT]: 'Component',
      [AngularFileType.SERVICE]: 'Service',
      [AngularFileType.DIRECTIVE]: 'Directive',
      [AngularFileType.PIPE]: 'Pipe',
      [AngularFileType.MODULE]: 'Module',
      [AngularFileType.GUARD]: 'Guard',
      [AngularFileType.INTERCEPTOR]: 'Interceptor',
      [AngularFileType.RESOLVER]: 'Resolver'
    };

    const suffix = suffixes[fileType];
    if (suffix && className.endsWith(suffix)) {
      return className.slice(0, -suffix.length);
    }

    return className;
  }

  /**
   * Converts PascalCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}
