import { writeFileSync, renameSync, existsSync } from 'fs';
import { AngularFile, RefactorResult, RenamedFile, ContentChange } from '../types';
import { RenameRule } from '../rules/base-rule';

/**
 * Handles processing of individual Angular files with rules
 */
export class FileProcessor {
  constructor(
    private rules: RenameRule[],
    private dryRun: boolean
  ) {}

  /**
   * Processes a single file with all applicable rules
   */
  async processFile(file: AngularFile, result: RefactorResult): Promise<void> {
    for (const rule of this.rules) {
      if (rule.shouldApply(file)) {
        const ruleResult = await rule.apply(file);

        // Handle additional file renames FIRST (to clear conflicts)
        if (ruleResult.additionalRenames) {
          for (const additionalRename of ruleResult.additionalRenames) {
            if (existsSync(additionalRename.oldPath)) {
              if (!this.dryRun) {
                renameSync(additionalRename.oldPath, additionalRename.newPath);
              }
              result.renamedFiles.push(additionalRename);
            }
          }
        }

        // Then handle the main file rename
        if (ruleResult.newFileName && ruleResult.newFileName !== file.path) {
          const renamedFile: RenamedFile = {
            oldPath: file.path,
            newPath: ruleResult.newFileName,
            reason: ruleResult.reason || 'File naming convention'
          };

          if (!this.dryRun) {
            renameSync(file.path, ruleResult.newFileName);
          }

          result.renamedFiles.push(renamedFile);
          file.path = ruleResult.newFileName;
        }

        // Handle manual review items
        if (ruleResult.manualReviewRequired) {
          result.manualReviewRequired.push(...ruleResult.manualReviewRequired);
        }

        if (ruleResult.newContent && ruleResult.newContent !== file.content) {
          const changes = this.getContentChanges(
            file.path,
            file.content,
            ruleResult.newContent,
            ruleResult.reason || 'Content refactor'
          );
          result.contentChanges.push(...changes);

          if (!this.dryRun) {
            writeFileSync(file.path, ruleResult.newContent, 'utf-8');
          }

          file.content = ruleResult.newContent;
        }
      }
    }
  }

  /**
   * Compares old and new content to generate detailed change information
   */
  private getContentChanges(filePath: string, oldContent: string, newContent: string, reason: string): ContentChange[] {
    const changes: ContentChange[] = [];
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

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
