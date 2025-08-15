import { DirectiveNamingRule } from '../../rules/directive-naming-rule';
import { AngularFile, AngularFileType } from '../../types';

describe('DirectiveNamingRule', () => {
  let rule: DirectiveNamingRule;

  beforeEach(() => {
    rule = new DirectiveNamingRule();
  });

  describe('rule properties', () => {
    it('should have correct name and description', () => {
      expect(rule.name).toBe('directive-naming');
      expect(rule.description).toBe('Ensures Angular directives follow naming conventions');
    });
  });

  describe('shouldApply', () => {
    it('should apply to directive files', () => {
      const file: AngularFile = {
        path: 'test.directive.ts',
        content: '',
        type: AngularFileType.DIRECTIVE
      };

      expect(rule.shouldApply(file)).toBe(true);
    });

    it('should not apply to non-directive files', () => {
      const file: AngularFile = {
        path: 'test.component.ts',
        content: '',
        type: AngularFileType.COMPONENT
      };

      expect(rule.shouldApply(file)).toBe(false);
    });
  });

  describe('directive selector naming', () => {
    it('should fix directive selector to camelCase with app prefix', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[my-highlight]'
          })
          export class HighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("selector: '[appMyHighlight]'");
      expect(result.reason).toContain('Directive selector should use camelCase with app prefix');
    });

    it('should not change valid directive selectors', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class HighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeUndefined();
    });

    it('should handle selectors with different quote styles', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: "[test-selector]"
          })
          export class TestDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("selector: '[appTestSelector]'");
    });

    it('should handle selectors that need camelCase conversion', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[test-highlight]'
          })
          export class HighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeDefined();
      expect(result.newContent).toContain("selector: '[appTestHighlight]'");
    });

    it('should not change files without directive selectors', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive()
          export class HighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeUndefined();
    });
  });

  describe('directive class naming', () => {
    it('should fix directive class name to PascalCase with Directive suffix', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class highlight {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain('export class HighlightDirective');
      expect(result.reason).toContain("Directive class should use PascalCase with 'Directive' suffix");
    });

    it('should add Directive suffix to classes that dont have it', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class Highlight {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain('export class HighlightDirective');
    });

    it('should not change valid directive class names', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class HighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeUndefined();
    });

    it('should handle kebab-case class names', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class myHighlightDirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain('export class MyHighlightDirective');
    });

    it('should handle class names that end with directive in lowercase', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
          export class highlightdirective {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain('export class HighlightDirective');
    });

    it('should not change files without class declarations', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[appHighlight]'
          })
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeUndefined();
    });
  });

  describe('combined selector and class fixes', () => {
    it('should fix both selector and class name in one pass', async () => {
      const file: AngularFile = {
        path: 'highlight.directive.ts',
        content: `
          import { Directive } from '@angular/core';
          
          @Directive({
            selector: '[my-highlight]'
          })
          export class highlight {}
        `,
        type: AngularFileType.DIRECTIVE
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("selector: '[appMyHighlight]'");
      expect(result.newContent).toContain('export class HighlightDirective');
      expect(result.reason).toContain('camelCase with app prefix');
      expect(result.reason).toContain("PascalCase with 'Directive' suffix");
    });
  });

  describe('helper methods', () => {
    it('should convert strings to camelCase', () => {
      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toCamelCase = (rule as any).toCamelCase;
      
      expect(toCamelCase('my-test-string')).toBe('myTestString');
      expect(toCamelCase('my_test_string')).toBe('myTestString');
      expect(toCamelCase('my test string')).toBe('myTestString');
      expect(toCamelCase('MyTestString')).toBe('myteststring');
    });

    it('should validate directive selectors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValidDirectiveSelector = (rule as any).isValidDirectiveSelector;
      
      expect(isValidDirectiveSelector('appHighlight')).toBe(true);
      expect(isValidDirectiveSelector('myAppHighlight')).toBe(false);
      expect(isValidDirectiveSelector('highlight')).toBe(false);
      expect(isValidDirectiveSelector('my-highlight')).toBe(false);
    });

    it('should ensure app prefix', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ensureAppPrefix = (rule as any).ensureAppPrefix;
      
      expect(ensureAppPrefix('highlight')).toBe('appHighlight');
      expect(ensureAppPrefix('appHighlight')).toBe('appHighlight');
      expect(ensureAppPrefix('myHighlight')).toBe('appMyHighlight');
    });
  });
});
