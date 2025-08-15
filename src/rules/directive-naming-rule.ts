import { RenameRule, RuleResult } from './base-rule';
import { AngularFile, AngularFileType } from '../types';

/**
 * Rule to ensure Angular directives follow naming conventions:
 * - Directive selectors should use camelCase with application prefix
 * - Directive class names should use PascalCase with 'Directive' suffix
 */
export class DirectiveNamingRule extends RenameRule {
  readonly name = 'directive-naming';
  readonly description = 'Ensures Angular directives follow naming conventions';

  shouldApply(file: AngularFile): boolean {
    return file.type === AngularFileType.DIRECTIVE;
  }

  async apply(file: AngularFile): Promise<RuleResult> {
    let newContent = file.content;
    let hasChanges = false;
    const changes: string[] = [];

    // Check directive selector naming
    const selectorResult = this.fixDirectiveSelector(newContent);
    if (selectorResult.content !== newContent) {
      newContent = selectorResult.content;
      hasChanges = true;
      changes.push(selectorResult.reason);
    }

    // Check class naming
    const classResult = this.fixDirectiveClassName(newContent);
    if (classResult.content !== newContent) {
      newContent = classResult.content;
      hasChanges = true;
      changes.push(classResult.reason);
    }

    if (hasChanges) {
      return {
        newContent,
        reason: changes.join('; ')
      };
    }

    return {};
  }

  private fixDirectiveSelector(content: string): { content: string; reason: string } {
    const selectorMatch = content.match(/selector:\s*['"`]\[([^\]]+)\]['"`]/);

    if (!selectorMatch) {
      return { content, reason: '' };
    }

    const currentSelector = selectorMatch[1];

    // Check if selector follows camelCase convention with prefix
    if (this.isValidDirectiveSelector(currentSelector)) {
      return { content, reason: '' };
    }

    // Convert selector to camelCase if it's not already
    const camelSelector = this.toCamelCase(currentSelector);

    // Ensure it has an app prefix if it doesn't have any prefix
    const fixedSelector = this.ensureAppPrefix(camelSelector);

    const newContent = content.replace(/selector:\s*['"`]\[[^\]]+\]['"`]/, `selector: '[${fixedSelector}]'`);

    return {
      content: newContent,
      reason: `Directive selector should use camelCase with app prefix: [${currentSelector}] -> [${fixedSelector}]`
    };
  }

  private fixDirectiveClassName(content: string): { content: string; reason: string } {
    const classMatch = content.match(/export\s+class\s+(\w+)/);

    if (!classMatch) {
      return { content, reason: '' };
    }

    const currentClassName = classMatch[1];

    // Check if class name follows PascalCase and ends with 'Directive'
    if (this.isPascalCase(currentClassName) && currentClassName.endsWith('Directive')) {
      return { content, reason: '' };
    }

    let fixedClassName = currentClassName;

    // Ensure PascalCase
    if (!this.isPascalCase(currentClassName)) {
      // Convert from kebab-case or other formats to PascalCase
      fixedClassName = this.toPascalCase(currentClassName.replace(/directive$/i, ''));
    }

    // Ensure 'Directive' suffix
    if (!fixedClassName.endsWith('Directive')) {
      fixedClassName += 'Directive';
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
      reason: `Directive class should use PascalCase with 'Directive' suffix: ${currentClassName} -> ${fixedClassName}`
    };
  }

  private toCamelCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((part, index) => {
        if (index === 0) {
          return part.toLowerCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
  }

  private isValidDirectiveSelector(selector: string): boolean {
    // Should be camelCase and preferably have a prefix
    return (/^[a-z][a-zA-Z0-9]*$/.test(selector) && selector.startsWith('app')) || selector.includes('app');
  }

  private ensureAppPrefix(selector: string): string {
    // If selector doesn't start with app, add 'app' prefix
    if (!selector.startsWith('app')) {
      return `app${selector.charAt(0).toUpperCase() + selector.slice(1)}`;
    }
    return selector;
  }
}
