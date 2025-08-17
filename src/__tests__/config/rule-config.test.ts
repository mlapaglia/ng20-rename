import { RuleConfig, RuleConfigOptions } from '../../config/rule-config';

describe('RuleConfig', () => {
  describe('constructor and defaults', () => {
    it('should create with default options when no options provided', () => {
      const config = new RuleConfig();
      const options = config.getConfig();

      expect(options.fileNaming).toBe(true);
      expect(options.componentNaming).toBe(true);
      expect(options.directiveNaming).toBe(true);
      expect(options.smartServices).toBe(true);
    });

    it('should create with empty options object', () => {
      const config = new RuleConfig({});
      const options = config.getConfig();

      expect(options.fileNaming).toBe(true);
      expect(options.componentNaming).toBe(true);
      expect(options.directiveNaming).toBe(true);
      expect(options.smartServices).toBe(true);
    });

    it('should override defaults with provided options', () => {
      const options: RuleConfigOptions = {
        fileNaming: false,
        componentNaming: false,
        directiveNaming: true,
        smartServices: false
      };

      const config = new RuleConfig(options);
      const configOptions = config.getConfig();

      expect(configOptions.fileNaming).toBe(false);
      expect(configOptions.componentNaming).toBe(false);
      expect(configOptions.directiveNaming).toBe(true);
      expect(configOptions.smartServices).toBe(false);
    });

    it('should partially override defaults', () => {
      const options: RuleConfigOptions = {
        fileNaming: false,
        smartServices: false
      };

      const config = new RuleConfig(options);
      const configOptions = config.getConfig();

      expect(configOptions.fileNaming).toBe(false);
      expect(configOptions.componentNaming).toBe(true); // default
      expect(configOptions.directiveNaming).toBe(true); // default
      expect(configOptions.smartServices).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the configuration', () => {
      const config = new RuleConfig({ fileNaming: true });
      const configOptions = config.getConfig();

      // Modify the returned config
      configOptions.fileNaming = false;

      // Original should be unchanged
      expect(config.getConfig().fileNaming).toBe(true);
    });
  });

  describe('isRuleEnabled', () => {
    let config: RuleConfig;

    beforeEach(() => {
      config = new RuleConfig({
        fileNaming: true,
        componentNaming: false,
        directiveNaming: true,
        smartServices: false
      });
    });

    it('should check if file naming rule is enabled', () => {
      expect(config.isRuleEnabled('fileNaming')).toBe(true);
    });

    it('should check if component naming rule is enabled', () => {
      expect(config.isRuleEnabled('componentNaming')).toBe(false);
    });

    it('should check if directive naming rule is enabled', () => {
      expect(config.isRuleEnabled('directiveNaming')).toBe(true);
    });

    it('should check if smart services are enabled', () => {
      expect(config.isRuleEnabled('smartServices')).toBe(false);
    });
  });

  describe('specific rule check methods', () => {
    let config: RuleConfig;

    beforeEach(() => {
      config = new RuleConfig({
        fileNaming: false,
        componentNaming: true,
        directiveNaming: false,
        smartServices: true
      });
    });

    it('should check if file naming is enabled', () => {
      expect(config.isFileNamingEnabled()).toBe(false);
    });

    it('should check if component naming is enabled', () => {
      expect(config.isComponentNamingEnabled()).toBe(true);
    });

    it('should check if directive naming is enabled', () => {
      expect(config.isDirectiveNamingEnabled()).toBe(false);
    });

    it('should check if smart services are enabled', () => {
      expect(config.isSmartServicesEnabled()).toBe(true);
    });
  });

  describe('setRuleEnabled', () => {
    let config: RuleConfig;

    beforeEach(() => {
      config = new RuleConfig();
    });

    it('should enable a disabled rule', () => {
      config.setRuleEnabled('fileNaming', false);
      expect(config.isFileNamingEnabled()).toBe(false);

      config.setRuleEnabled('fileNaming', true);
      expect(config.isFileNamingEnabled()).toBe(true);
    });

    it('should disable an enabled rule', () => {
      expect(config.isComponentNamingEnabled()).toBe(true);

      config.setRuleEnabled('componentNaming', false);
      expect(config.isComponentNamingEnabled()).toBe(false);
    });

    it('should update multiple rules', () => {
      config.setRuleEnabled('fileNaming', false);
      config.setRuleEnabled('componentNaming', false);
      config.setRuleEnabled('directiveNaming', false);
      config.setRuleEnabled('smartServices', false);

      expect(config.isFileNamingEnabled()).toBe(false);
      expect(config.isComponentNamingEnabled()).toBe(false);
      expect(config.isDirectiveNamingEnabled()).toBe(false);
      expect(config.isSmartServicesEnabled()).toBe(false);
    });
  });

  describe('integration with all rule types', () => {
    it('should handle all rule types correctly', () => {
      const options: Required<RuleConfigOptions> = {
        fileNaming: false,
        componentNaming: true,
        directiveNaming: false,
        smartServices: true
      };

      const config = new RuleConfig(options);

      expect(config.isRuleEnabled('fileNaming')).toBe(false);
      expect(config.isRuleEnabled('componentNaming')).toBe(true);
      expect(config.isRuleEnabled('directiveNaming')).toBe(false);
      expect(config.isRuleEnabled('smartServices')).toBe(true);

      // Test convenience methods match isRuleEnabled
      expect(config.isFileNamingEnabled()).toBe(config.isRuleEnabled('fileNaming'));
      expect(config.isComponentNamingEnabled()).toBe(config.isRuleEnabled('componentNaming'));
      expect(config.isDirectiveNamingEnabled()).toBe(config.isRuleEnabled('directiveNaming'));
      expect(config.isSmartServicesEnabled()).toBe(config.isRuleEnabled('smartServices'));
    });
  });
});
