import { RuleFactory } from '../../core/rule-factory';
import { FileNamingRule } from '../../rules/file-naming-rule';
import { ComponentNamingRule } from '../../rules/component-naming-rule';
import { DirectiveNamingRule } from '../../rules/directive-naming-rule';
import { RuleConfig } from '../../config/rule-config';

describe('RuleFactory', () => {
  describe('createStandardRules', () => {
    it('should create standard rules with smart services enabled by default', () => {
      const rules = RuleFactory.createStandardRules();

      expect(rules).toHaveLength(3);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
      expect(rules[1]).toBeInstanceOf(ComponentNamingRule);
      expect(rules[2]).toBeInstanceOf(DirectiveNamingRule);
    });

    it('should create standard rules with smart services disabled', () => {
      const rules = RuleFactory.createStandardRules(false);

      expect(rules).toHaveLength(3);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
      expect(rules[1]).toBeInstanceOf(ComponentNamingRule);
      expect(rules[2]).toBeInstanceOf(DirectiveNamingRule);
    });
  });

  describe('createCustomRules', () => {
    it('should create all rules when no options specified', () => {
      const ruleConfig = new RuleConfig();
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(3);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
      expect(rules[1]).toBeInstanceOf(ComponentNamingRule);
      expect(rules[2]).toBeInstanceOf(DirectiveNamingRule);
    });

    it('should exclude file naming rule when disabled', () => {
      const ruleConfig = new RuleConfig({ fileNaming: false });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(2);
      expect(rules[0]).toBeInstanceOf(ComponentNamingRule);
      expect(rules[1]).toBeInstanceOf(DirectiveNamingRule);
    });

    it('should exclude component naming rule when disabled', () => {
      const ruleConfig = new RuleConfig({ componentNaming: false });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(2);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
      expect(rules[1]).toBeInstanceOf(DirectiveNamingRule);
    });

    it('should exclude directive naming rule when disabled', () => {
      const ruleConfig = new RuleConfig({ directiveNaming: false });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(2);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
      expect(rules[1]).toBeInstanceOf(ComponentNamingRule);
    });

    it('should create only file naming rule when others are disabled', () => {
      const ruleConfig = new RuleConfig({
        componentNaming: false,
        directiveNaming: false
      });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
    });

    it('should pass smart services option to file naming rule', () => {
      const ruleConfig = new RuleConfig({ smartServices: false });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(3);
      expect(rules[0]).toBeInstanceOf(FileNamingRule);
    });

    it('should create empty array when all rules disabled', () => {
      const ruleConfig = new RuleConfig({
        fileNaming: false,
        componentNaming: false,
        directiveNaming: false
      });
      const rules = RuleFactory.createCustomRules(ruleConfig);

      expect(rules).toHaveLength(0);
    });
  });
});
