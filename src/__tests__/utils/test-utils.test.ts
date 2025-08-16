import { TestUtils } from '../../utils/test-utils';

describe('TestUtils', () => {
  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const result = TestUtils.generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should generate different strings on multiple calls', () => {
      const result1 = TestUtils.generateRandomString(10);
      const result2 = TestUtils.generateRandomString(10);
      expect(result1).not.toBe(result2);
    });
  });

  describe('factorial', () => {
    it('should calculate factorial correctly', () => {
      expect(TestUtils.factorial(0)).toBe(1);
      expect(TestUtils.factorial(1)).toBe(1);
      expect(TestUtils.factorial(5)).toBe(120);
    });

    it('should throw error for negative numbers', () => {
      expect(() => TestUtils.factorial(-1)).toThrow('Factorial is not defined for negative numbers');
    });
  });

  describe('isPalindrome', () => {
    it('should identify palindromes correctly', () => {
      expect(TestUtils.isPalindrome('racecar')).toBe(true);
      expect(TestUtils.isPalindrome('A man a plan a canal Panama')).toBe(true);
      expect(TestUtils.isPalindrome('hello')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(TestUtils.isPalindrome('')).toBe(true);
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await TestUtils.delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(TestUtils.formatFileSize(0)).toBe('0 Bytes');
      expect(TestUtils.formatFileSize(1024)).toBe('1 KB');
      expect(TestUtils.formatFileSize(1048576)).toBe('1 MB');
      expect(TestUtils.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(TestUtils.formatFileSize(1536)).toBe('1.5 KB');
    });
  });
});
