import { AngularFileType } from '../../types';
import { ServiceDomainDetector } from '../service-domain-detector';

/**
 * Generates expected file names based on Angular 20 conventions
 */
export class FileNameGenerator {
  constructor(private smartServices: boolean = true) {}

  /**
   * Generates the expected file name for a class based on Angular 20 conventions
   */
  getExpectedFileName(className: string, fileType: AngularFileType, fileExt: string, fileContent?: string): string {
    // Remove class type suffix (e.g., "Component", "Service") from class name
    const baseClassName = this.removeClassTypeSuffix(className, fileType);
    
    // Convert to kebab-case
    const kebabCaseName = this.toKebabCase(baseClassName);
    
    // Get the appropriate file suffix for Angular 20
    const typeSuffix = this.getTypeSuffix(fileType, fileContent);
    
    return `${kebabCaseName}${typeSuffix}${fileExt}`;
  }

  /**
   * Removes class type suffixes (Component, Service, etc.) from class names
   */
  private removeClassTypeSuffix(className: string, fileType: AngularFileType): string {
    const suffixes: Partial<Record<AngularFileType, string>> = {
      [AngularFileType.COMPONENT]: 'Component',
      [AngularFileType.SERVICE]: 'Service',
      [AngularFileType.DIRECTIVE]: 'Directive',
      [AngularFileType.PIPE]: 'Pipe',
      [AngularFileType.MODULE]: 'Module',
      [AngularFileType.GUARD]: 'Guard',
      [AngularFileType.INTERCEPTOR]: 'Interceptor',
      [AngularFileType.RESOLVER]: 'Resolver'
    };

    const suffix = suffixes[fileType];
    if (suffix && className.endsWith(suffix)) {
      return className.slice(0, -suffix.length);
    }

    return className;
  }

  /**
   * Gets the appropriate file suffix for Angular 20 conventions
   */
  private getTypeSuffix(fileType: AngularFileType, fileContent?: string): string {
    if (fileType === AngularFileType.SERVICE && this.smartServices && fileContent) {
      const detectedDomain = ServiceDomainDetector.detectDomain(fileContent);
      if (detectedDomain) {
        return detectedDomain; // Domain already includes the hyphen prefix
      }
    }

    // Angular 20 conventions: no suffixes for components, services, directives
    // Hyphenated suffixes for other types
    switch (fileType) {
      case AngularFileType.COMPONENT:
      case AngularFileType.SERVICE:
      case AngularFileType.DIRECTIVE:
        return '';
      case AngularFileType.PIPE:
        return '-pipe';
      case AngularFileType.MODULE:
        return '-module';
      case AngularFileType.GUARD:
        return '-guard';
      case AngularFileType.INTERCEPTOR:
        return '-interceptor';
      case AngularFileType.RESOLVER:
        return '-resolver';
      default:
        return '';
    }
  }

  /**
   * Converts PascalCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}
