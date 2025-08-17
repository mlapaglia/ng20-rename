import { RefactorOptions, RefactorResult } from './types';
import { FileDiscovery } from './core/file-discovery';
import { FileProcessor } from './core/file-processor';
import { ReportGenerator } from './core/report-generator';
import { RuleFactory } from './core/rule-factory';
import { ImportUpdater } from './core/import-updater';
import { Configuration } from './config/configuration';
import { RuleConfig } from './config/rule-config';

export class AngularRefactorer {
  private config: Configuration;
  private ruleConfig: RuleConfig;
  private fileDiscovery: FileDiscovery;
  private fileProcessor: FileProcessor;
  private importUpdater: ImportUpdater;

  constructor(options: RefactorOptions) {
    this.config = new Configuration(options);
    this.ruleConfig = new RuleConfig({
      smartServices: this.config.isSmartServicesEnabled()
    });

    this.fileDiscovery = new FileDiscovery(this.config.getOptions());

    const rules = RuleFactory.createCustomRules(this.ruleConfig);
    this.fileProcessor = new FileProcessor(rules, this.config.isDryRun());
    this.importUpdater = new ImportUpdater(this.config.isDryRun());
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

      if (this.config.isVerbose()) {
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

      // Update import statements in all files after renames are complete
      if (result.renamedFiles.length > 0) {
        await this.importUpdater.updateImports(this.config.getRootDir(), result.renamedFiles, result);
      }

      if (this.config.isVerbose()) {
        console.log(`Processing complete:`);
        console.log(`- Files processed: ${result.processedFiles.length}`);
        console.log(`- Files renamed: ${result.renamedFiles.length}`);
        console.log(`- Content changes: ${result.contentChanges.length}`);
        console.log(`- Errors: ${result.errors.length}`);
      }
    } catch (error) {
      result.errors.push({
        filePath: this.config.getRootDir(),
        message: `Failed to scan directory: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    return result;
  }
}
