import { AngularFile, ManualReviewItem } from '../types';

export interface RuleResult {
  /** New file name if the file should be renamed */
  newFileName?: string;
  /** Additional files that should be renamed (for associated files like HTML, CSS, spec) */
  additionalRenames?: Array<{
    oldPath: string;
    newPath: string;
    reason: string;
  }>;
  /** Additional content changes for other files */
  additionalContentChanges?: Array<{
    filePath: string;
    newContent: string;
    reason: string;
  }>;
  /** Files that require manual review due to conflicts */
  manualReviewRequired?: ManualReviewItem[];
  /** New file content if the content should be modified */
  newContent?: string;
  /** Reason for the change */
  reason?: string;
}

export abstract class RenameRule {
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Determines if this rule should be applied to the given file
   */
  abstract shouldApply(file: AngularFile): boolean;

  /**
   * Applies the rule to the file and returns the result
   */
  abstract apply(file: AngularFile): Promise<RuleResult>;

  /**
   * Converts PascalCase to kebab-case
   * Example: UserProfile -> user-profile
   */
  protected toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Converts kebab-case to PascalCase
   * Example: user-profile -> UserProfile
   */
  protected toPascalCase(str: string): string {
    return str
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Extracts the class name from TypeScript content
   */
  protected extractClassName(content: string): string | null {
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  /**
   * Extracts the component selector from Angular component
   */
  protected extractComponentSelector(content: string): string | null {
    const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
    return selectorMatch ? selectorMatch[1] : null;
  }

  /**
   * Checks if a string follows kebab-case convention
   */
  protected isKebabCase(str: string): boolean {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
  }

  /**
   * Checks if a string follows PascalCase convention
   */
  protected isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }
}
