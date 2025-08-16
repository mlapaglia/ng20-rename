import { TsFileDomainDetector } from '../../rules/ts-file-domain-detector';
import * as fs from 'fs';
import * as path from 'path';

describe('TsFileDomainDetector - Comprehensive Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/domain-samples');

  describe('detectDomain', () => {
    it('should detect model files based on data structure patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'model-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-model');
    });

    it('should detect types files based on type definitions', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'types-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-types');
    });

    it('should detect interface files based on interface definitions', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'interface-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-interface');
    });

    it('should detect enum files based on enum definitions', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'enum-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-enum');
    });

    it('should detect config files based on configuration patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'config-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-config');
    });

    it('should detect constants files based on constant patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'constants-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-constants');
    });

    it('should detect utils files based on utility function patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'utils-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-utils');
    });

    it('should detect validator files based on validation patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'validator-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-validator');
    });

    it('should detect factory files based on factory patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'factory-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-factory');
    });

    it('should detect api files based on HTTP patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'api-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-api');
    });

    it('should detect store files based on state management patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'store-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-store');
    });

    it('should return null for files that do not match any pattern strongly', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'no-clear-domain-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBeNull();
    });

    it('should return null for low confidence matches', () => {
      const content = `
        // File with only weak matches
        const data = { name: 'test' };
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBeNull();
    });
  });

  describe('explainDetection', () => {
    it('should provide explanation for model detection', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'model-sample.ts'), 'utf-8');
      const explanation = TsFileDomainDetector.explainDetection(content, '-model');
      expect(explanation).toContain('Exports');
    });

    it('should provide explanation for config detection', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'config-sample.ts'), 'utf-8');
      const explanation = TsFileDomainDetector.explainDetection(content, '-config');
      expect(explanation).toContain('Exports');
    });

    it('should provide explanation for api detection', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'api-sample.ts'), 'utf-8');
      const explanation = TsFileDomainDetector.explainDetection(content, '-api');
      expect(explanation).toContain('Imports');
    });

    it('should handle unknown domain', () => {
      const content = 'test';
      const explanation = TsFileDomainDetector.explainDetection(content, '-unknown');
      expect(explanation).toBe('Unknown domain detection');
    });
  });

  describe('conflict resolution integration', () => {
    it('should match expected domains for conflict resolution test fixtures', () => {
      // Test the specific files used in conflict resolution tests
      const authContent = fs.readFileSync(path.join(__dirname, '../fixtures/auth.ts'), 'utf-8');
      expect(TsFileDomainDetector.detectDomain(authContent)).toBe('-config');

      const paymentContent = fs.readFileSync(path.join(__dirname, '../fixtures/payment.ts'), 'utf-8');
      expect(TsFileDomainDetector.detectDomain(paymentContent)).toBe('-utils');

      const productContent = fs.readFileSync(path.join(__dirname, '../fixtures/product.ts'), 'utf-8');
      expect(TsFileDomainDetector.detectDomain(productContent)).toBe('-constants');

      const dataContent = fs.readFileSync(path.join(__dirname, '../fixtures/data.ts'), 'utf-8');
      expect(TsFileDomainDetector.detectDomain(dataContent)).toBeNull();
    });
  });
});
