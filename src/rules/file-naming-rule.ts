import { basename, dirname, join, extname } from 'path';
import { RenameRule, RuleResult } from './base-rule';
import { AngularFile, AngularFileType } from '../types';

/**
 * Rule to ensure file names follow Angular style guide conventions:
 * - Separate words with hyphens
 * - Use kebab-case for all file names
 * - Match file names to TypeScript identifiers within
 */
export class FileNamingRule extends RenameRule {
  readonly name = 'file-naming';
  readonly description = 'Ensures file names follow Angular naming conventions with kebab-case';

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

    // Check if the current name follows kebab-case
    const nameWithoutSuffix = this.removeTypeSuffix(fileNameWithoutExt, file.type);
    if (!this.isKebabCase(nameWithoutSuffix)) {
      const newPath = join(fileDir, expectedFileName);
      return {
        newFileName: newPath,
        reason: `File name should use kebab-case: ${currentFileName} -> ${expectedFileName}`
      };
    }

    return {};
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
    const suffixes: Partial<Record<AngularFileType, string>> = {
      [AngularFileType.COMPONENT]: '.component',
      [AngularFileType.SERVICE]: '.service',
      [AngularFileType.DIRECTIVE]: '.directive',
      [AngularFileType.PIPE]: '.pipe',
      [AngularFileType.MODULE]: '.module',
      [AngularFileType.GUARD]: '.guard',
      [AngularFileType.INTERCEPTOR]: '.interceptor',
      [AngularFileType.RESOLVER]: '.resolver'
    };

    const suffix = suffixes[fileType];
    if (suffix && fileName.endsWith(suffix)) {
      return fileName.slice(0, -suffix.length);
    }

    return fileName;
  }

  private getTypeSuffix(fileType: AngularFileType): string {
    const suffixes: Record<AngularFileType, string> = {
      [AngularFileType.COMPONENT]: '.component',
      [AngularFileType.SERVICE]: '.service',
      [AngularFileType.DIRECTIVE]: '.directive',
      [AngularFileType.PIPE]: '.pipe',
      [AngularFileType.MODULE]: '.module',
      [AngularFileType.GUARD]: '.guard',
      [AngularFileType.INTERCEPTOR]: '.interceptor',
      [AngularFileType.RESOLVER]: '.resolver',
      [AngularFileType.SPEC]: '.spec',
      [AngularFileType.HTML_TEMPLATE]: '',
      [AngularFileType.STYLESHEET]: '',
      [AngularFileType.OTHER]: ''
    };

    return suffixes[fileType] || '';
  }
}
