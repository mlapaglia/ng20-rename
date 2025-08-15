import { basename, dirname, join, extname } from 'path';
import { existsSync } from 'fs';
import { RenameRule, RuleResult } from './base-rule';
import { AngularFile, AngularFileType } from '../types';

/**
 * Rule to ensure file names follow Angular 20 naming conventions:
 * - Clean and concise file names without redundant suffixes
 * - No suffixes for components, directives, and services
 * - Hyphenated suffixes for pipes, modules, guards, interceptors, and resolvers
 * - Use kebab-case for all file names
 * - Match file names to TypeScript identifiers within
 */
export class FileNamingRule extends RenameRule {
  readonly name = 'file-naming';
  readonly description = 'Ensures file names follow Angular 20 naming conventions: clean, concise, kebab-case';

  shouldApply(file: AngularFile): boolean {
    // Don't apply to spec files or stylesheets as they have different conventions
    return file.type !== AngularFileType.SPEC && file.type !== AngularFileType.OTHER;
  }

  async apply(file: AngularFile): Promise<RuleResult> {
    const currentFileName = basename(file.path);
    const fileDir = dirname(file.path);
    const fileExt = extname(file.path);
    const fileNameWithoutExt = basename(file.path, fileExt);

    // Extract the class name to determine the correct file name
    const className = this.extractClassName(file.content);

    if (!className) {
      return {}; // No class found, nothing to rename
    }

    const expectedFileName = this.getExpectedFileName(className, file.type, fileExt);

    if (currentFileName === expectedFileName) {
      return {}; // Already correctly named
    }

    // Check for naming conflicts before renaming
    const newPath = join(fileDir, expectedFileName);
    if (existsSync(newPath) && newPath !== file.path) {
      // Target file already exists - add to manual review list
      return {
        manualReviewRequired: [
          {
            filePath: file.path,
            desiredNewPath: newPath,
            reason: `Cannot rename to ${expectedFileName} - target file already exists`,
            conflictType: 'naming_conflict'
          }
        ],
        reason: `Skipped rename due to conflict: ${currentFileName} -> ${expectedFileName} (target file already exists)`
      };
    }

    // File name doesn't match expected Angular 20 naming convention
    const result: RuleResult = {
      newFileName: newPath,
      reason: `File name should follow Angular 20 conventions: ${currentFileName} -> ${expectedFileName}`
    };

    // For components, also rename associated files (HTML, CSS, LESS, SCSS, spec)
    if (file.type === AngularFileType.COMPONENT) {
      result.additionalRenames = this.getAssociatedFileRenames(file.path, fileNameWithoutExt, className);
    }

    return result;
  }

  private getExpectedFileName(className: string, fileType: AngularFileType, extension: string): string {
    // Remove type suffix from class name (e.g., UserProfileComponent -> UserProfile)
    const baseName = this.removeClassTypeSuffix(className, fileType);

    // Convert to kebab-case
    const kebabName = this.toKebabCase(baseName);

    // Add appropriate suffix based on file type
    const suffix = this.getTypeSuffix(fileType);

    return `${kebabName}${suffix}${extension}`;
  }

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

  private removeTypeSuffix(fileName: string, fileType: AngularFileType): string {
    // Handle both old Angular naming and new Angular 20 naming
    const oldSuffixes: Partial<Record<AngularFileType, string>> = {
      [AngularFileType.COMPONENT]: '.component',
      [AngularFileType.SERVICE]: '.service',
      [AngularFileType.DIRECTIVE]: '.directive',
      [AngularFileType.PIPE]: '.pipe',
      [AngularFileType.MODULE]: '.module',
      [AngularFileType.GUARD]: '.guard',
      [AngularFileType.INTERCEPTOR]: '.interceptor',
      [AngularFileType.RESOLVER]: '.resolver'
    };

    const newSuffixes: Partial<Record<AngularFileType, string>> = {
      [AngularFileType.PIPE]: '-pipe',
      [AngularFileType.MODULE]: '-module',
      [AngularFileType.GUARD]: '-guard',
      [AngularFileType.INTERCEPTOR]: '-interceptor',
      [AngularFileType.RESOLVER]: '-resolver'
    };

    // Try old suffix first (for migration from old to new)
    const oldSuffix = oldSuffixes[fileType];
    if (oldSuffix && fileName.endsWith(oldSuffix)) {
      return fileName.slice(0, -oldSuffix.length);
    }

    // Try new suffix
    const newSuffix = newSuffixes[fileType];
    if (newSuffix && fileName.endsWith(newSuffix)) {
      return fileName.slice(0, -newSuffix.length);
    }

    return fileName;
  }

  private getTypeSuffix(fileType: AngularFileType): string {
    // Angular 20 naming conventions: Clean and concise file names
    const suffixes: Record<AngularFileType, string> = {
      // No suffixes for components, directives, and services (Angular 20)
      [AngularFileType.COMPONENT]: '',
      [AngularFileType.SERVICE]: '',
      [AngularFileType.DIRECTIVE]: '',

      // Hyphenated suffixes for other types (Angular 20)
      [AngularFileType.PIPE]: '-pipe',
      [AngularFileType.MODULE]: '-module',
      [AngularFileType.GUARD]: '-guard',
      [AngularFileType.INTERCEPTOR]: '-interceptor',
      [AngularFileType.RESOLVER]: '-resolver',
      [AngularFileType.SPEC]: '.spec',
      [AngularFileType.HTML_TEMPLATE]: '',
      [AngularFileType.STYLESHEET]: '',
      [AngularFileType.OTHER]: ''
    };

    return suffixes[fileType] || '';
  }

  private getAssociatedFileRenames(
    componentPath: string,
    currentFileNameWithoutExt: string,
    className: string
  ): Array<{
    oldPath: string;
    newPath: string;
    reason: string;
  }> {
    const fileDir = dirname(componentPath);
    const baseName = this.removeClassTypeSuffix(className, AngularFileType.COMPONENT);
    const newKebabName = this.toKebabCase(baseName);
    const renames: Array<{ oldPath: string; newPath: string; reason: string }> = [];

    // Define the associated file extensions to check
    const associatedExtensions = [
      { ext: '.html', desc: 'HTML template' },
      { ext: '.css', desc: 'CSS stylesheet' },
      { ext: '.scss', desc: 'SCSS stylesheet' },
      { ext: '.less', desc: 'LESS stylesheet' },
      { ext: '.spec.ts', desc: 'spec file' }
    ];

    for (const { ext, desc } of associatedExtensions) {
      // Look for files with the old naming pattern
      const oldAssociatedPath = join(fileDir, `${currentFileNameWithoutExt}${ext}`);

      if (existsSync(oldAssociatedPath)) {
        const newAssociatedPath = join(fileDir, `${newKebabName}${ext}`);

        // Check for conflicts before adding to rename list
        if (!existsSync(newAssociatedPath) || newAssociatedPath === oldAssociatedPath) {
          renames.push({
            oldPath: oldAssociatedPath,
            newPath: newAssociatedPath,
            reason: `Associated ${desc} should follow Angular 20 conventions: ${basename(oldAssociatedPath)} -> ${basename(newAssociatedPath)}`
          });
        }
        // Note: We silently skip conflicting associated files rather than warn for each one
      }
    }

    return renames;
  }
}
