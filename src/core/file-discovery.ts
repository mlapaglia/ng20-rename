import { glob } from 'glob';
import { readFileSync, existsSync } from 'fs';
import { AngularFile, AngularFileType, RefactorOptions } from '../types';

/**
 * Handles discovery and classification of Angular files
 */
export class FileDiscovery {
  constructor(private options: Required<RefactorOptions>) {}

  /**
   * Finds and classifies all Angular files in the specified directory
   */
  async findAngularFiles(): Promise<AngularFile[]> {
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

  /**
   * Determines the Angular file type based on filename and content
   */
  determineFileType(filePath: string, content: string): AngularFileType {
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

    if (
      fileName.endsWith('.component.ts') ||
      content.includes('@Component') ||
      /export\s+class\s+\w*Component\s*{/.test(content) ||
      content.includes('templateUrl') ||
      content.includes('styleUrls')
    ) {
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
}
