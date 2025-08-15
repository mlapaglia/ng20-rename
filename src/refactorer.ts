import { glob } from 'glob';
import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';

import { RefactorOptions, RefactorResult, AngularFile, AngularFileType, RenamedFile, ContentChange, ManualReviewItem } from './types';
import { RenameRule } from './rules/base-rule';
import { FileNamingRule } from './rules/file-naming-rule';
import { ComponentNamingRule } from './rules/component-naming-rule';
import { DirectiveNamingRule } from './rules/directive-naming-rule';

export class AngularRefactorer {
  private rules: RenameRule[] = [];
  private options: Required<RefactorOptions>;

  constructor(options: RefactorOptions) {
    this.options = {
      include: ['**/*.ts', '**/*.html', '**/*.css', '**/*.scss'],
      exclude: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
      dryRun: false,
      verbose: false,
      ...options
    };

    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [new FileNamingRule(), new ComponentNamingRule(), new DirectiveNamingRule()];
  }

  async refactor(): Promise<RefactorResult> {
    const result: RefactorResult = {
      processedFiles: [],
      renamedFiles: [],
      contentChanges: [],
      manualReviewRequired: [],
      errors: []
    };

    try {
      const files = await this.findAngularFiles();

      if (this.options.verbose) {
        console.log(`Found ${files.length} Angular files to process`);
        this.logFileTypeBreakdown(files);
      }

      for (const file of files) {
        try {
          await this.processFile(file, result);
          result.processedFiles.push(file.path);
        } catch (error) {
          result.errors.push({
            filePath: file.path,
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }

      if (this.options.verbose) {
        console.log(`Processing complete:`);
        console.log(`- Files processed: ${result.processedFiles.length}`);
        console.log(`- Files renamed: ${result.renamedFiles.length}`);
        console.log(`- Content changes: ${result.contentChanges.length}`);
        console.log(`- Errors: ${result.errors.length}`);
      }
    } catch (error) {
      result.errors.push({
        filePath: this.options.rootDir,
        message: `Failed to scan directory: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    return result;
  }

  private async findAngularFiles(): Promise<AngularFile[]> {
    const files: AngularFile[] = [];

    for (const pattern of this.options.include) {
      const matches = await glob(pattern, {
        cwd: this.options.rootDir,
        ignore: this.options.exclude,
        absolute: true
      });

      for (const filePath of matches) {
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          const type = this.determineFileType(filePath, content);

          files.push({
            path: filePath,
            content,
            type
          });
        }
      }
    }

    return files;
  }

  private determineFileType(filePath: string, content: string): AngularFileType {
    const fileName = filePath.toLowerCase();

    if (fileName.endsWith('.spec.ts')) {
      return AngularFileType.SPEC;
    }

    if (fileName.endsWith('.html')) {
      return AngularFileType.HTML_TEMPLATE;
    }

    if (fileName.endsWith('.css') || fileName.endsWith('.scss') || fileName.endsWith('.sass')) {
      return AngularFileType.STYLESHEET;
    }

    if (fileName.endsWith('.component.ts') || 
        content.includes('@Component') || 
        /export\s+class\s+\w*Component\s*{/.test(content) ||
        content.includes('templateUrl') ||
        content.includes('styleUrls')) {
      return AngularFileType.COMPONENT;
    }

    if (fileName.endsWith('.service.ts') || content.includes('@Injectable')) {
      return AngularFileType.SERVICE;
    }

    if (fileName.endsWith('.directive.ts') || content.includes('@Directive')) {
      return AngularFileType.DIRECTIVE;
    }

    if (fileName.endsWith('.pipe.ts') || content.includes('@Pipe')) {
      return AngularFileType.PIPE;
    }

    if (fileName.endsWith('.module.ts') || content.includes('@NgModule')) {
      return AngularFileType.MODULE;
    }

    if (fileName.endsWith('.guard.ts') || content.includes('CanActivate') || content.includes('CanLoad')) {
      return AngularFileType.GUARD;
    }

    if (fileName.endsWith('.interceptor.ts') || content.includes('HttpInterceptor')) {
      return AngularFileType.INTERCEPTOR;
    }

    if (fileName.endsWith('.resolver.ts') || content.includes('Resolve')) {
      return AngularFileType.RESOLVER;
    }

    return AngularFileType.OTHER;
  }

  private async processFile(file: AngularFile, result: RefactorResult): Promise<void> {
    for (const rule of this.rules) {
      if (rule.shouldApply(file)) {
        const ruleResult = await rule.apply(file);

        if (ruleResult.newFileName && ruleResult.newFileName !== file.path) {
          const renamedFile: RenamedFile = {
            oldPath: file.path,
            newPath: ruleResult.newFileName,
            reason: ruleResult.reason || 'File naming convention'
          };

          if (!this.options.dryRun) {
            renameSync(file.path, ruleResult.newFileName);
          }

          result.renamedFiles.push(renamedFile);
          file.path = ruleResult.newFileName;
        }

        // Handle additional file renames (associated files like HTML, CSS, spec)
        if (ruleResult.additionalRenames) {
          for (const additionalRename of ruleResult.additionalRenames) {
            if (existsSync(additionalRename.oldPath)) {
              if (!this.options.dryRun) {
                renameSync(additionalRename.oldPath, additionalRename.newPath);
              }
              result.renamedFiles.push(additionalRename);
            }
          }
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

          if (!this.options.dryRun) {
            writeFileSync(file.path, ruleResult.newContent, 'utf-8');
          }

          file.content = ruleResult.newContent;
        }
      }
    }
  }

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

  private logFileTypeBreakdown(files: AngularFile[]): void {
    const typeCount = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeNames = {
      [AngularFileType.COMPONENT]: 'Components',
      [AngularFileType.SERVICE]: 'Services',
      [AngularFileType.DIRECTIVE]: 'Directives',
      [AngularFileType.PIPE]: 'Pipes',
      [AngularFileType.MODULE]: 'Modules',
      [AngularFileType.GUARD]: 'Guards',
      [AngularFileType.INTERCEPTOR]: 'Interceptors',
      [AngularFileType.RESOLVER]: 'Resolvers',
      [AngularFileType.HTML_TEMPLATE]: 'HTML Templates',
      [AngularFileType.STYLESHEET]: 'Stylesheets',
      [AngularFileType.SPEC]: 'Spec Files',
      [AngularFileType.OTHER]: 'Other Files'
    };

    console.log('File type breakdown:');
    Object.entries(typeCount).forEach(([type, count]) => {
      const typeName = typeNames[type as AngularFileType] || type;
      console.log(`  ${typeName}: ${count}`);
    });
  }
}
