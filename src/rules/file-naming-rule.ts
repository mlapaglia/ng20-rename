import { basename, dirname, join, extname } from 'path';
import { existsSync } from 'fs';
import { RenameRule, RuleResult } from './base-rule';
import { AngularFile, AngularFileType } from '../types';
import { ConflictResolver } from './file-naming/conflict-resolver';
import { FileNameGenerator } from './file-naming/file-name-generator';
import { AssociatedFileHandler } from './file-naming/associated-file-handler';

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

  private conflictResolver = new ConflictResolver();
  private fileNameGenerator: FileNameGenerator;
  private associatedFileHandler = new AssociatedFileHandler();

  constructor(smartServices: boolean = true) {
    super();
    this.fileNameGenerator = new FileNameGenerator(smartServices);
  }

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

    const expectedFileName = this.fileNameGenerator.getExpectedFileName(className, file.type, fileExt, file.content);

    if (currentFileName === expectedFileName) {
      return {}; // Already correctly named
    }

    // Check for naming conflicts before renaming
    const newPath = join(fileDir, expectedFileName);
    if (existsSync(newPath) && newPath !== file.path) {
      // Try to resolve conflict automatically by renaming the conflicting file
      const conflictResolution = this.conflictResolver.attemptConflictResolution(newPath);

      if (conflictResolution.resolved) {
        // We can resolve the conflict - add the conflicting file rename to additional renames
        const result: RuleResult = {
          newFileName: newPath,
          reason: `File name should follow Angular 20 conventions: ${currentFileName} -> ${expectedFileName}`,
          additionalRenames: conflictResolution.conflictingFileRename ? [conflictResolution.conflictingFileRename] : []
        };

        // For components, also rename associated files (HTML, CSS, LESS, SCSS, spec)
        if (file.type === AngularFileType.COMPONENT) {
          const associatedRenames = this.associatedFileHandler.getAssociatedFileRenames(
            file.path,
            fileNameWithoutExt,
            className,
            file.type
          );
          result.additionalRenames = (result.additionalRenames || []).concat(associatedRenames);
        }

        // For all file types, check for associated spec files
        const specResult = this.associatedFileHandler.getSpecFileRenames(
          file.path,
          fileNameWithoutExt,
          className,
          file.type,
          expectedFileName
        );
        if (specResult.renames.length > 0) {
          result.additionalRenames = (result.additionalRenames || []).concat(specResult.renames);
        }
        if (specResult.contentChanges.length > 0) {
          result.additionalContentChanges = (result.additionalContentChanges || []).concat(specResult.contentChanges);
        }

        return result;
      } else {
        // Target file already exists and we can't resolve it - add to manual review list
        return {
          manualReviewRequired: [
            {
              filePath: file.path,
              desiredNewPath: newPath,
              reason: `Cannot rename to ${expectedFileName} - target file already exists${conflictResolution.reason ? ` (${conflictResolution.reason})` : ''}`,
              conflictType: 'naming_conflict'
            }
          ],
          reason: `Skipped rename due to conflict: ${currentFileName} -> ${expectedFileName} (target file already exists)`
        };
      }
    }

    // No conflict, proceed with rename
    const result: RuleResult = {
      newFileName: newPath,
      reason: `File name should follow Angular 20 conventions: ${currentFileName} -> ${expectedFileName}`
    };

    // For components, also rename associated files (HTML, CSS, LESS, SCSS, spec)
    if (file.type === AngularFileType.COMPONENT) {
      result.additionalRenames = this.associatedFileHandler.getAssociatedFileRenames(
        file.path,
        fileNameWithoutExt,
        className,
        file.type
      );
    }

    // For all file types, check for associated spec files
    const specResult = this.associatedFileHandler.getSpecFileRenames(
      file.path,
      fileNameWithoutExt,
      className,
      file.type,
      expectedFileName
    );
    if (specResult.renames.length > 0) {
      result.additionalRenames = (result.additionalRenames || []).concat(specResult.renames);
    }
    if (specResult.contentChanges.length > 0) {
      result.additionalContentChanges = (result.additionalContentChanges || []).concat(specResult.contentChanges);
    }

    return result;
  }
}
