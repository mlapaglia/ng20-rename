/**
 * Configuration options for individual rules
 */
export interface RuleConfigOptions {
  /** Enable/disable file naming rule */
  fileNaming?: boolean;
  /** Enable/disable component naming rule */
  componentNaming?: boolean;
  /** Enable/disable directive naming rule */
  directiveNaming?: boolean;
  /** Enable/disable smart service domain detection */
  smartServices?: boolean;
}

/**
 * Manages rule-specific configuration
 */
export class RuleConfig {
  private config: Required<RuleConfigOptions>;

  constructor(options: RuleConfigOptions = {}) {
    this.config = this.mergeWithDefaults(options);
  }

  /**
   * Gets the complete rule configuration
   */
  getConfig(): Required<RuleConfigOptions> {
    return { ...this.config };
  }

  /**
   * Checks if a specific rule is enabled
   */
  isRuleEnabled(ruleName: keyof RuleConfigOptions): boolean {
    return this.config[ruleName] === true;
  }

  /**
   * Checks if file naming rule is enabled
   */
  isFileNamingEnabled(): boolean {
    return this.config.fileNaming;
  }

  /**
   * Checks if component naming rule is enabled
   */
  isComponentNamingEnabled(): boolean {
    return this.config.componentNaming;
  }

  /**
   * Checks if directive naming rule is enabled
   */
  isDirectiveNamingEnabled(): boolean {
    return this.config.directiveNaming;
  }

  /**
   * Checks if smart services are enabled
   */
  isSmartServicesEnabled(): boolean {
    return this.config.smartServices;
  }

  /**
   * Updates a rule configuration
   */
  setRuleEnabled(ruleName: keyof RuleConfigOptions, enabled: boolean): void {
    this.config[ruleName] = enabled;
  }

  /**
   * Merges user options with defaults
   */
  private mergeWithDefaults(options: RuleConfigOptions): Required<RuleConfigOptions> {
    return {
      fileNaming: true,
      componentNaming: true,
      directiveNaming: true,
      smartServices: true,
      ...options
    };
  }
}
