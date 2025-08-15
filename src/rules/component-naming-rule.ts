import { RenameRule, RuleResult } from './base-rule';
import { AngularFile, AngularFileType } from '../types';

/**
 * Rule to ensure Angular components follow naming conventions:
 * - Component selectors should use kebab-case with application prefix
 * - Component class names should use PascalCase with 'Component' suffix
 * - Template and style file names should match component name
 */
export class ComponentNamingRule extends RenameRule {
  readonly name = 'component-naming';
  readonly description = 'Ensures Angular components follow naming conventions';

  shouldApply(file: AngularFile): boolean {
    return file.type === AngularFileType.COMPONENT;
  }

  async apply(file: AngularFile): Promise<RuleResult> {
    let newContent = file.content;
    let hasChanges = false;
    const changes: string[] = [];

    // Check component selector naming
    const selectorResult = this.fixComponentSelector(newContent);
    if (selectorResult.content !== newContent) {
      newContent = selectorResult.content;
      hasChanges = true;
      changes.push(selectorResult.reason);
    }

    // Check class naming
    const classResult = this.fixComponentClassName(newContent);
    if (classResult.content !== newContent) {
      newContent = classResult.content;
      hasChanges = true;
      changes.push(classResult.reason);
    }

    // Check template and style properties
    const templateStyleResult = this.fixTemplateAndStyleUrls(newContent);
    if (templateStyleResult.content !== newContent) {
      newContent = templateStyleResult.content;
      hasChanges = true;
      changes.push(templateStyleResult.reason);
    }

    if (hasChanges) {
      return {
        newContent,
        reason: changes.join('; ')
      };
    }

    return {};
  }

  private fixComponentSelector(content: string): { content: string; reason: string } {
    const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);

    if (!selectorMatch) {
      return { content, reason: '' };
    }

    const currentSelector = selectorMatch[1];

    // Check if selector follows kebab-case convention
    if (this.isValidComponentSelector(currentSelector)) {
      return { content, reason: '' };
    }

    // Convert selector to kebab-case if it's not already
    const kebabSelector = this.toKebabCase(currentSelector);

    // Ensure it has an app prefix if it doesn't have any prefix
    const fixedSelector = this.ensureAppPrefix(kebabSelector);

    const newContent = content.replace(/selector:\s*['"`][^'"`]+['"`]/, `selector: '${fixedSelector}'`);

    return {
      content: newContent,
      reason: `Component selector should use kebab-case with app prefix: ${currentSelector} -> ${fixedSelector}`
    };
  }

  private fixComponentClassName(content: string): { content: string; reason: string } {
    const classMatch = content.match(/export\s+class\s+(\w+)/);

    if (!classMatch) {
      return { content, reason: '' };
    }

    const currentClassName = classMatch[1];

    // Check if class name follows PascalCase and ends with 'Component'
    if (this.isPascalCase(currentClassName) && currentClassName.endsWith('Component')) {
      return { content, reason: '' };
    }

    let fixedClassName = currentClassName;

    // Ensure PascalCase
    if (!this.isPascalCase(currentClassName)) {
      // Convert from kebab-case or other formats to PascalCase
      fixedClassName = this.toPascalCase(currentClassName.replace(/component$/i, ''));
    }

    // Ensure 'Component' suffix
    if (!fixedClassName.endsWith('Component')) {
      fixedClassName += 'Component';
    }

    if (fixedClassName === currentClassName) {
      return { content, reason: '' };
    }

    const newContent = content.replace(
      new RegExp(`export\\s+class\\s+${currentClassName}\\b`, 'g'),
      `export class ${fixedClassName}`
    );

    return {
      content: newContent,
      reason: `Component class should use PascalCase with 'Component' suffix: ${currentClassName} -> ${fixedClassName}`
    };
  }

  private fixTemplateAndStyleUrls(content: string): { content: string; reason: string } {
    let newContent = content;
    const changes: string[] = [];

    // Fix templateUrl
    const templateMatch = content.match(/templateUrl:\s*['"`]([^'"`]+)['"`]/);
    if (templateMatch) {
      const currentTemplate = templateMatch[1];
      const expectedTemplate = this.getExpectedTemplateUrl(content);

      if (expectedTemplate && currentTemplate !== expectedTemplate) {
        newContent = newContent.replace(/templateUrl:\s*['"`][^'"`]+['"`]/, `templateUrl: '${expectedTemplate}'`);
        changes.push(`Template URL should match component name: ${currentTemplate} -> ${expectedTemplate}`);
      }
    }

    // Fix styleUrls
    const styleMatch = content.match(/styleUrls?:\s*\[([^\]]+)\]/);
    if (styleMatch) {
      const currentStyles = styleMatch[1];
      const expectedStyles = this.getExpectedStyleUrls(content);

      if (expectedStyles && currentStyles !== expectedStyles) {
        newContent = newContent.replace(/styleUrls?:\s*\[[^\]]+\]/, `styleUrls: [${expectedStyles}]`);
        changes.push(`Style URLs should match component name`);
      }
    }

    return {
      content: newContent,
      reason: changes.join('; ')
    };
  }

  private getExpectedTemplateUrl(content: string): string | null {
    const className = this.extractClassName(content);
    if (!className) return null;

    const baseName = className.replace(/Component$/, '');
    const kebabName = this.toKebabCase(baseName);
    return `./${kebabName}.component.html`;
  }

  private getExpectedStyleUrls(content: string): string | null {
    const className = this.extractClassName(content);
    if (!className) return null;

    const baseName = className.replace(/Component$/, '');
    const kebabName = this.toKebabCase(baseName);
    return `'./${kebabName}.component.css'`;
  }

  private isValidComponentSelector(selector: string): boolean {
    // Should be kebab-case and have an app prefix
    return this.isKebabCase(selector) && selector.startsWith('app-');
  }

  private ensureAppPrefix(selector: string): string {
    // If selector doesn't start with app-, add 'app-' prefix
    if (!selector.startsWith('app-')) {
      return `app-${selector}`;
    }
    return selector;
  }
}
