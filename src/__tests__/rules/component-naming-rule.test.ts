import { ComponentNamingRule } from '../../rules/component-naming-rule';
import { AngularFile, AngularFileType } from '../../types';

describe('ComponentNamingRule', () => {
  let rule: ComponentNamingRule;

  beforeEach(() => {
    rule = new ComponentNamingRule();
  });

  describe('shouldApply', () => {
    it('should apply only to component files', () => {
      const componentFile: AngularFile = {
        path: '/test/user.component.ts',
        content: '@Component({}) export class UserComponent {}',
        type: AngularFileType.COMPONENT
      };

      const serviceFile: AngularFile = {
        path: '/test/user.service.ts',
        content: '@Injectable({}) export class UserService {}',
        type: AngularFileType.SERVICE
      };

      expect(rule.shouldApply(componentFile)).toBe(true);
      expect(rule.shouldApply(serviceFile)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should fix component selector to use kebab-case', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: `
          @Component({
            selector: 'userProfile',
            template: '<div>Test</div>'
          })
          export class UserProfileComponent {}
        `,
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("selector: 'app-user-profile'");
      expect(result.reason).toContain('Component selector should use kebab-case with app prefix');
    });

    it('should fix component class name to use PascalCase with Component suffix', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: `
          @Component({
            selector: 'app-user-profile',
            template: '<div>Test</div>'
          })
          export class userProfile {}
        `,
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain('export class UserProfileComponent');
      expect(result.reason).toContain("Component class should use PascalCase with 'Component' suffix");
    });

    it('should add app prefix to selector without prefix', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: `
          @Component({
            selector: 'user-profile',
            template: '<div>Test</div>'
          })
          export class UserProfileComponent {}
        `,
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("selector: 'app-user-profile'");
    });

    it('should not modify correctly formatted components', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: `
          @Component({
            selector: 'app-user-profile',
            template: '<div>Test</div>'
          })
          export class UserProfileComponent {}
        `,
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newContent).toBeUndefined();
    });

    it('should fix templateUrl and styleUrls to match Angular 20 naming (no .component suffix)', async () => {
      const file: AngularFile = {
        path: '/test/user-profile.component.ts',
        content: `
          @Component({
            selector: 'app-user-profile',
            templateUrl: './UserProfile.html',
            styleUrls: ['./UserProfile.css']
          })
          export class UserProfileComponent {}
        `,
        type: AngularFileType.COMPONENT
      };

      const result = await rule.apply(file);

      expect(result.newContent).toContain("templateUrl: './user-profile.html'");
      expect(result.newContent).toContain("styleUrls: ['./user-profile.css']");
    });
  });
});
