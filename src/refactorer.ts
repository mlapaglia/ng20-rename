import { RefactorOptions, RefactorResult } from './types';
import { FileDiscovery } from './core/file-discovery';
import { FileProcessor } from './core/file-processor';
import { ReportGenerator } from './core/report-generator';
import { RuleFactory } from './core/rule-factory';

export class AngularRefactorer {
  private options: Required<RefactorOptions>;
  private fileDiscovery: FileDiscovery;
  private fileProcessor: FileProcessor;

  constructor(options: RefactorOptions) {
    this.options = {
      include: ['**/*.ts', '**/*.html', '**/*.css', '**/*.scss'],
      exclude: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
      dryRun: false,
      verbose: false,
      smartServices: true,
      ...options
    };

    this.fileDiscovery = new FileDiscovery(this.options);

    const rules = RuleFactory.createStandardRules(this.options.smartServices);
    this.fileProcessor = new FileProcessor(rules, this.options.dryRun);
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
      const files = await this.fileDiscovery.findAngularFiles();

      if (this.options.verbose) {
        console.log(`Found ${files.length} Angular files to process`);
        ReportGenerator.logFileTypeBreakdown(files);
      }

      for (const file of files) {
        try {
          await this.fileProcessor.processFile(file, result);
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
}
