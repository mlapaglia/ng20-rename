import { RenameRule } from '../rules/base-rule';
import { FileNamingRule } from '../rules/file-naming-rule';
import { ComponentNamingRule } from '../rules/component-naming-rule';
import { DirectiveNamingRule } from '../rules/directive-naming-rule';

/**
 * Factory for creating and configuring rename rules
 */
export class RuleFactory {
  /**
   * Creates the standard set of rename rules
   */
  static createStandardRules(smartServices: boolean = true): RenameRule[] {
    return [new FileNamingRule(smartServices), new ComponentNamingRule(), new DirectiveNamingRule()];
  }

  /**
   * Creates a custom set of rules
   */
  static createCustomRules(options: {
    fileNaming?: boolean;
    componentNaming?: boolean;
    directiveNaming?: boolean;
    smartServices?: boolean;
  }): RenameRule[] {
    const rules: RenameRule[] = [];

    if (options.fileNaming !== false) {
      rules.push(new FileNamingRule(options.smartServices ?? true));
    }

    if (options.componentNaming !== false) {
      rules.push(new ComponentNamingRule());
    }

    if (options.directiveNaming !== false) {
      rules.push(new DirectiveNamingRule());
    }

    return rules;
  }
}
