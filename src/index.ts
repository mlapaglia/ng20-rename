export { AngularRefactorer } from './refactorer';
export { RenameRule } from './rules/base-rule';
export { FileNamingRule } from './rules/file-naming-rule';
export { ComponentNamingRule } from './rules/component-naming-rule';
export { DirectiveNamingRule } from './rules/directive-naming-rule';
export { RefactorOptions, RefactorResult } from './types';

/**
 * Utility function to get the version of the package
 */
export function getVersion(): string {
  return '1.2.0';
}

/**
 * Utility function to validate Angular file extensions
 */
export function isAngularFile(filename: string): boolean {
  const angularExtensions = ['.component.ts', '.service.ts', '.directive.ts', '.pipe.ts', '.module.ts'];
  return angularExtensions.some(ext => filename.endsWith(ext));
}
