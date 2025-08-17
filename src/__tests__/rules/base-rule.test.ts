import { RenameRule } from '../../rules/base-rule';
import { AngularFile } from '../../types';

// Create a concrete implementation for testing
class TestRule extends RenameRule {
  readonly name = 'test-rule';
  readonly description = 'Test rule for base functionality';

  public testExtractComponentSelector(content: string): string | null {
    return this.extractComponentSelector(content);
  }

  public shouldApply(): boolean {
    return true;
  }

  public async apply(file: AngularFile): Promise<any> {
    return { newFileName: file.path };
  }
}

describe('RenameRule (BaseRule)', () => {
  let rule: TestRule;

  beforeEach(() => {
    rule = new TestRule();
  });

  describe('extractComponentSelector', () => {
    it('should extract selector with single quotes', () => {
      const content = `
        @Component({
          selector: 'app-user-profile',
          templateUrl: './user-profile.component.html'
        })
        export class UserProfileComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-user-profile');
    });

    it('should extract selector with double quotes', () => {
      const content = `
        @Component({
          selector: "app-dashboard",
          templateUrl: './dashboard.component.html'
        })
        export class DashboardComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-dashboard');
    });

    it('should extract selector with backticks', () => {
      const content = `
        @Component({
          selector: \`app-settings\`,
          templateUrl: './settings.component.html'
        })
        export class SettingsComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-settings');
    });

    it('should extract selector with extra whitespace', () => {
      const content = `
        @Component({
          selector:    'app-navigation'   ,
          templateUrl: './navigation.component.html'
        })
        export class NavigationComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-navigation');
    });

    it('should return null when no selector is found', () => {
      const content = `
        @Component({
          templateUrl: './component.component.html'
        })
        export class SomeComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBeNull();
    });

    it('should return null for malformed selector', () => {
      const content = `
        @Component({
          selector: ,
          templateUrl: './component.component.html'
        })
        export class SomeComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBeNull();
    });

    it('should handle complex component with multiple properties', () => {
      const content = `
        @Component({
          selector: 'app-complex-component',
          templateUrl: './complex.component.html',
          styleUrls: ['./complex.component.scss'],
          providers: [SomeService],
          changeDetection: ChangeDetectionStrategy.OnPush
        })
        export class ComplexComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-complex-component');
    });

    it('should extract first selector when multiple selectors exist (edge case)', () => {
      const content = `
        @Component({
          selector: 'app-first',
          templateUrl: './first.component.html'
        })
        export class FirstComponent {}
        
        @Component({
          selector: 'app-second',
          templateUrl: './second.component.html'
        })
        export class SecondComponent {}
      `;

      const result = rule.testExtractComponentSelector(content);
      expect(result).toBe('app-first');
    });
  });
});
