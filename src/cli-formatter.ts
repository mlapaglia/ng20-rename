import chalk from 'chalk';
import Table from 'cli-table3';
import { RefactorResult, RenamedFile, ContentChange, ManualReviewItem, RefactorError } from './types';
import { relative } from 'path';

export class CliFormatter {
  private getRelativePath(filePath: string): string {
    return relative(process.cwd(), filePath);
  }

  public printHeader(title: string): void {
    console.log(chalk.cyan.bold(`\n🚀 ${title}`));
    console.log(chalk.cyan('═'.repeat(title.length + 4)));
  }

  public printSummary(result: RefactorResult): void {
    const table = new Table({
      head: [chalk.cyan.bold('📊 Summary'), chalk.cyan.bold('Count')],
      colWidths: [30, 10],
      style: {
        head: [],
        border: ['cyan']
      }
    });

    table.push(
      ['📁 Files processed', chalk.white(result.processedFiles.length.toString())],
      ['✏️  Files renamed', result.renamedFiles.length > 0 ? chalk.green(result.renamedFiles.length.toString()) : chalk.gray('0')],
      ['🔄 Content changes', result.contentChanges.length > 0 ? chalk.blue(result.contentChanges.length.toString()) : chalk.gray('0')],
      ['⚠️  Manual review required', result.manualReviewRequired.length > 0 ? chalk.yellow(result.manualReviewRequired.length.toString()) : chalk.gray('0')],
      ['❌ Errors', result.errors.length > 0 ? chalk.red(result.errors.length.toString()) : chalk.gray('0')]
    );

    console.log(table.toString());
  }

  public printRenamedFiles(renamedFiles: RenamedFile[]): void {
    if (renamedFiles.length === 0) return;

    this.printHeader('✏️  File Renames');
    
    // Group files by their base component/service name
    const groupedFiles = this.groupRelatedFiles(renamedFiles);
    
    groupedFiles.forEach((group, index) => {
      if (index > 0) {
        console.log(''); // Add spacing between groups
      }
      
      // Create a table for this group
      const table = new Table({
        style: {
          head: [],
          border: ['green']
        },
        wordWrap: true
      });

      // Add old files row
      const oldFiles = group.map(file => this.colorCodeFile(this.getRelativePath(file.oldPath), 'old')).join('\n');
      table.push([chalk.green.bold('Old Files:'), oldFiles]);

      // Add new files row  
      const newFiles = group.map(file => this.colorCodeFile(this.getRelativePath(file.newPath), 'new')).join('\n');
      table.push([chalk.green.bold('New Files:'), newFiles]);

      console.log(table.toString());
    });
  }

  private groupRelatedFiles(renamedFiles: RenamedFile[]): RenamedFile[][] {
    const groups: Map<string, RenamedFile[]> = new Map();
    
    renamedFiles.forEach(file => {
      // Extract base name for grouping (remove file extensions and type suffixes)
      const baseName = this.getBaseNameForGrouping(file.oldPath);
      
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName)!.push(file);
    });
    
    return Array.from(groups.values());
  }

  private getBaseNameForGrouping(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    // Remove extensions and common Angular suffixes to group related files
    return fileName
      .replace(/\.(component|service|directive|pipe|guard|resolver|interceptor|module)\.(ts|html|css|scss|less)$/, '')
      .replace(/\.(ts|html|css|scss|less)$/, '')
      .replace(/\.(spec|test)$/, '');
  }

  private colorCodeFile(filePath: string, type: 'old' | 'new'): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let colorFn = chalk.white;
    switch (extension) {
      case 'ts':
        colorFn = chalk.cyan;
        break;
      case 'html':
        colorFn = chalk.green;
        break;
      case 'css':
      case 'scss':
      case 'less':
        colorFn = chalk.yellow;
        break;
      default:
        colorFn = chalk.white;
    }
    
    // Add dimming for old files to distinguish them while keeping the same color
    return type === 'old' ? colorFn.dim(filePath) : colorFn(filePath);
  }

  public printContentChanges(contentChanges: ContentChange[]): void {
    if (contentChanges.length === 0) return;

    this.printHeader('🔄 Content Changes');

    const changesByFile = contentChanges.reduce(
      (acc, change) => {
        if (!acc[change.filePath]) {
          acc[change.filePath] = [];
        }
        acc[change.filePath].push(change);
        return acc;
      },
      {} as Record<string, ContentChange[]>
    );

    Object.entries(changesByFile).forEach(([filePath, changes]) => {
      console.log(chalk.blue.bold(`\n📄 ${this.getRelativePath(filePath)}`));
      
      const table = new Table({
        head: [chalk.blue.bold('Line'), chalk.blue.bold('Change'), chalk.blue.bold('Reason')],
        colWidths: [8, 60, 40],
        style: {
          head: [],
          border: ['blue']
        },
        wordWrap: true
      });

      changes.forEach(change => {
        let changeText = '';
        if (change.oldContent.trim()) {
          changeText += chalk.red(`- ${change.oldContent.trim()}\n`);
        }
        if (change.newContent.trim()) {
          changeText += chalk.green(`+ ${change.newContent.trim()}`);
        }

        table.push([
          chalk.yellow(change.line.toString()),
          changeText,
          chalk.cyan(change.reason)
        ]);
      });

      console.log(table.toString());
    });
  }

  public printManualReviewItems(manualReviewItems: ManualReviewItem[]): void {
    if (manualReviewItems.length === 0) return;

    this.printHeader('⚠️  Manual Review Required');
    
    const table = new Table({
      head: [chalk.yellow.bold('File'), chalk.yellow.bold('Desired Path'), chalk.yellow.bold('Issue'), chalk.yellow.bold('Type')],
      colWidths: [35, 35, 40, 20],
      style: {
        head: [],
        border: ['yellow']
      },
      wordWrap: true
    });

    manualReviewItems.forEach(item => {
      table.push([
        chalk.white(this.getRelativePath(item.filePath)),
        chalk.cyan(this.getRelativePath(item.desiredNewPath)),
        chalk.yellow(item.reason),
        chalk.magenta(item.conflictType)
      ]);
    });

    console.log(table.toString());
  }

  public printErrors(errors: RefactorError[]): void {
    if (errors.length === 0) return;

    this.printHeader('❌ Errors');
    
    const table = new Table({
      head: [chalk.red.bold('File'), chalk.red.bold('Line'), chalk.red.bold('Error Message')],
      colWidths: [40, 8, 60],
      style: {
        head: [],
        border: ['red']
      },
      wordWrap: true
    });

    errors.forEach(error => {
      table.push([
        chalk.white(this.getRelativePath(error.filePath)),
        error.line ? chalk.yellow(error.line.toString()) : chalk.gray('N/A'),
        chalk.red(error.message)
      ]);
    });

    console.log(table.toString());
  }

  public printVerboseInfo(options: {
    rootDir: string;
    dryRun: boolean;
    include: string[];
    exclude: string[];
  }): void {
    console.log(chalk.cyan.bold('\n⚙️  Configuration'));
    console.log(chalk.cyan('═'.repeat(15)));
    
    const table = new Table({
      head: [chalk.cyan.bold('Setting'), chalk.cyan.bold('Value')],
      colWidths: [20, 60],
      style: {
        head: [],
        border: ['cyan']
      },
      wordWrap: true
    });

    table.push(
      ['📁 Root Directory', chalk.white(this.getRelativePath(options.rootDir))],
      ['🧪 Dry Run', options.dryRun ? chalk.yellow('Yes') : chalk.green('No')],
      ['📥 Include Patterns', chalk.gray(options.include.join(', '))],
      ['📤 Exclude Patterns', chalk.gray(options.exclude.join(', '))]
    );

    console.log(table.toString());
  }

  public printSuccess(message: string): void {
    console.log(chalk.green.bold(`\n✅ ${message}`));
  }

  public printWarning(message: string): void {
    console.log(chalk.yellow.bold(`\n⚠️  ${message}`));
  }

  public printError(message: string): void {
    console.log(chalk.red.bold(`\n❌ ${message}`));
  }

  public printDryRunNotice(): void {
    console.log(chalk.yellow.bold('\n🧪 DRY RUN MODE'));
    console.log(chalk.yellow('No files were actually modified. Use without --dry-run to apply changes.'));
  }

  public printCompletionMessage(hasChanges: boolean, dryRun: boolean): void {
    if (dryRun) {
      this.printDryRunNotice();
    } else if (hasChanges) {
      this.printSuccess('Refactoring completed successfully! 🎉');
    } else {
      console.log(chalk.blue.bold('\n✨ No changes needed - your Angular project is already following the latest naming conventions!'));
    }
  }
}
