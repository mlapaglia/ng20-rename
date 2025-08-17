#!/usr/bin/env node

import { Command } from 'commander';
import { resolve, relative } from 'path';
import { existsSync } from 'fs';
import { AngularRefactorer } from './refactorer';
import { RefactorOptions } from './types';
import { CliFormatter } from './cli-formatter';

const program = new Command();

program
  .name('ng20-rename')
  .description('Refactor Angular applications to use the latest Angular naming conventions')
  .version('1.0.0');

program
  .argument('<directory>', 'Directory to scan for Angular files')
  .option('-d, --dry-run', 'Perform a dry run without making changes', false)
  .option('-v, --verbose', 'Show verbose output', false)
  .option('-i, --include <patterns...>', 'File patterns to include', ['**/*.ts', '**/*.html', '**/*.css', '**/*.scss'])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', 'dist/**', '**/*.spec.ts'])
  .option('--disable-smart-services', 'Disable smart domain detection for services', false)
  .action(
    async (
      directory: string,
      options: {
        dryRun: boolean;
        verbose: boolean;
        include: string[];
        exclude: string[];
        disableSmartServices: boolean;
      }
    ) => {
      const formatter = new CliFormatter();
      
      try {
        const rootDir = resolve(directory);

        if (!existsSync(rootDir)) {
          formatter.printError(`Directory "${directory}" does not exist.`);
          process.exit(1);
        }

        formatter.printHeader('Angular Refactoring Tool');

        if (options.verbose) {
          formatter.printVerboseInfo({
            rootDir,
            dryRun: options.dryRun,
            include: options.include,
            exclude: options.exclude
          });
        }

        const refactorOptions: RefactorOptions = {
          rootDir,
          include: options.include,
          exclude: options.exclude,
          dryRun: options.dryRun,
          verbose: options.verbose,
          smartServices: !options.disableSmartServices
        };

        const refactorer = new AngularRefactorer(refactorOptions);
        const result = await refactorer.refactor();

        // Display results with beautiful formatting
        formatter.printSummary(result);
        formatter.printRenamedFiles(result.renamedFiles);
        
        if (options.verbose) {
          formatter.printContentChanges(result.contentChanges);
        }
        
        formatter.printManualReviewItems(result.manualReviewRequired);
        formatter.printErrors(result.errors);

        // Final completion message
        const hasChanges = result.renamedFiles.length > 0 || result.contentChanges.length > 0;
        formatter.printCompletionMessage(hasChanges, options.dryRun);

      } catch (error) {
        formatter.printError(`An error occurred during refactoring: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    }
  );

program.parse();
