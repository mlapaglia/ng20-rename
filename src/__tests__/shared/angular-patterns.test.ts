import { validateRegexPattern } from '../../shared/angular-patterns';

describe('angular-patterns', () => {
  describe('validateRegexPattern', () => {
    it('should return true for valid regex patterns', () => {
      expect(validateRegexPattern('.*')).toBe(true);
      expect(validateRegexPattern('^test$')).toBe(true);
      expect(validateRegexPattern('\\d+')).toBe(true);
      expect(validateRegexPattern('[a-zA-Z]+')).toBe(true);
      expect(validateRegexPattern('(test|example)')).toBe(true);
      expect(validateRegexPattern('test.*component')).toBe(true);
    });

    it('should return true for simple string patterns', () => {
      expect(validateRegexPattern('test')).toBe(true);
      expect(validateRegexPattern('component')).toBe(true);
      expect(validateRegexPattern('app-')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(validateRegexPattern('')).toBe(true);
    });

    it('should return false for invalid regex patterns', () => {
      expect(validateRegexPattern('[')).toBe(false);
      expect(validateRegexPattern('(')).toBe(false);
      expect(validateRegexPattern('*')).toBe(false);
      expect(validateRegexPattern('+')).toBe(false);
      expect(validateRegexPattern('?')).toBe(false);
      expect(validateRegexPattern('[z-a]')).toBe(false);
      expect(validateRegexPattern('{1,}')).toBe(false);
    });

    it('should return false for unclosed groups', () => {
      expect(validateRegexPattern('(test')).toBe(false);
      expect(validateRegexPattern('[test')).toBe(false);
      expect(validateRegexPattern('test)')).toBe(false);
    });

    it('should return false for invalid escape sequences', () => {
      expect(validateRegexPattern('\\')).toBe(false);
    });

    it('should return true for patterns that are technically valid in JavaScript', () => {
      // These patterns are syntactically valid in JavaScript regex, even if not useful
      expect(validateRegexPattern('{}')).toBe(true);
      expect(validateRegexPattern('test]')).toBe(true);
      expect(validateRegexPattern('test{1,a}')).toBe(true);
      expect(validateRegexPattern('\\k')).toBe(true);
      expect(validateRegexPattern('test{,1}')).toBe(true);
    });
  });
});
