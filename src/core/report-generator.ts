import { AngularFile, AngularFileType } from '../types';

/**
 * Handles logging and reporting functionality
 */
export class ReportGenerator {
  /**
   * Logs a breakdown of file types found
   */
  static logFileTypeBreakdown(files: AngularFile[]): void {
    const typeCount = files.reduce(
      (acc, file) => {
        acc[file.type] = (acc[file.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

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
