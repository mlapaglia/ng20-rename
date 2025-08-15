#!/usr/bin/env node

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { AngularRefactorer } from './refactorer';
import { RefactorOptions } from './types';

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
  .action(
    async (directory: string, options: { dryRun: boolean; verbose: boolean; include: string[]; exclude: string[] }) => {
      try {
        const rootDir = resolve(directory);

        if (!existsSync(rootDir)) {
          console.error(`Error: Directory "${directory}" does not exist.`);
          process.exit(1);
        }

        if (options.verbose) {
          console.log(`Starting Angular refactoring in: ${rootDir}`);
          console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
          console.log(`Include patterns: ${options.include.join(', ')}`);
          console.log(`Exclude patterns: ${options.exclude.join(', ')}`);
          console.log('---');
        }

        const refactorOptions: RefactorOptions = {
          rootDir,
          include: options.include,
          exclude: options.exclude,
          dryRun: options.dryRun,
          verbose: options.verbose
        };

        const refactorer = new AngularRefactorer(refactorOptions);
        const result = await refactorer.refactor();

        // Display results
        console.log('\n=== Refactoring Results ===');
        console.log(`Files processed: ${result.processedFiles.length}`);
        console.log(`Files renamed: ${result.renamedFiles.length}`);
        console.log(`Content changes: ${result.contentChanges.length}`);
        console.log(`Errors: ${result.errors.length}`);

        if (result.renamedFiles.length > 0) {
          console.log('\n--- File Renames ---');
          result.renamedFiles.forEach(rename => {
            console.log(`${rename.oldPath} -> ${rename.newPath}`);
            console.log(`  Reason: ${rename.reason}`);
          });
        }

        if (result.contentChanges.length > 0 && options.verbose) {
          console.log('\n--- Content Changes ---');
          const changesByFile = result.contentChanges.reduce(
            (acc, change) => {
              if (!acc[change.filePath]) {
                acc[change.filePath] = [];
              }
              acc[change.filePath].push(change);
              return acc;
            },
            {} as Record<string, typeof result.contentChanges>
          );

          Object.entries(changesByFile).forEach(([filePath, changes]) => {
            console.log(`\n${filePath}:`);
            changes.forEach(change => {
              console.log(`  Line ${change.line}: ${change.reason}`);
              if (change.oldContent.trim()) {
                console.log(`    - ${change.oldContent.trim()}`);
              }
              if (change.newContent.trim()) {
                console.log(`    + ${change.newContent.trim()}`);
              }
            });
          });
        }

        if (result.errors.length > 0) {
          console.log('\n--- Errors ---');
          result.errors.forEach(error => {
            console.error(`${error.filePath}: ${error.message}`);
            if (error.line) {
              console.error(`  Line: ${error.line}`);
            }
          });
        }

        if (options.dryRun) {
          console.log('\n⚠️  This was a dry run. No files were actually modified.');
          console.log('Run without --dry-run to apply changes.');
        } else if (result.renamedFiles.length > 0 || result.contentChanges.length > 0) {
          console.log('\n✅ Refactoring completed successfully!');
        } else {
          console.log('\n✨ No changes needed. Your Angular code already follows the naming conventions!');
        }
      } catch (error) {
        console.error('An unexpected error occurred:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

program.parse();
