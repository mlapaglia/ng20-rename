import { RenameRule } from '../rules/base-rule';
import { FileNamingRule } from '../rules/file-naming-rule';
import { ComponentNamingRule } from '../rules/component-naming-rule';
import { DirectiveNamingRule } from '../rules/directive-naming-rule';
import { RuleConfig } from '../config/rule-config';

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
   * Creates a custom set of rules based on configuration
   */
  static createCustomRules(ruleConfig: RuleConfig): RenameRule[] {
    const rules: RenameRule[] = [];

    if (ruleConfig.isFileNamingEnabled()) {
      rules.push(new FileNamingRule(ruleConfig.isSmartServicesEnabled()));
    }

    if (ruleConfig.isComponentNamingEnabled()) {
      rules.push(new ComponentNamingRule());
    }

    if (ruleConfig.isDirectiveNamingEnabled()) {
      rules.push(new DirectiveNamingRule());
    }

    return rules;
  }
}
