import { AssociatedFileHandler } from '../rules/file-naming/associated-file-handler';

describe('Spec Import Normalization Tests', () => {
  let handler: AssociatedFileHandler;

  beforeEach(() => {
    handler = new AssociatedFileHandler();
  });

  it('should normalize backslashes to forward slashes in spec file imports', () => {
    // Simulate spec file content with backslashes (as might occur on Windows)
    const specContent = `import { TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './components\\user-profile.component';
import { UtilService } from './utils\\util.service';

describe('UserProfileComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileComponent]
    });
  });
});`;

    // Use reflection to access the private method
    const updateSpecFileImports = (handler as any).updateSpecFileImports.bind(handler);
    
    const result = updateSpecFileImports(specContent, 'user-profile.component.ts', 'user-profile.ts');

    console.log('Original spec content:', specContent);
    console.log('Updated spec content:', result);

    // Should normalize backslashes to forward slashes
    expect(result).toContain("import { UserProfileComponent } from './components/user-profile';");
    expect(result).not.toContain("import { UserProfileComponent } from './components\\user-profile';");
    
    // Should also handle util service import
    expect(result).toContain("import { UtilService } from './utils/util.service';");
    expect(result).not.toContain("import { UtilService } from './utils\\util.service';");
  });

  it('should handle nested directory paths with backslashes', () => {
    const specContent = `import { TestBed } from '@angular/core/testing';
import { DeepComponent } from './features\\auth\\components\\deep.component';
import { AuthService } from './features\\auth\\services\\auth.service';

describe('DeepComponent', () => {
  let component: DeepComponent;
});`;

    const updateSpecFileImports = (handler as any).updateSpecFileImports.bind(handler);
    
    const result = updateSpecFileImports(specContent, 'deep.component.ts', 'deep.ts');

    console.log('Nested spec content result:', result);

    // Should normalize all backslashes to forward slashes
    expect(result).toContain("import { DeepComponent } from './features/auth/components/deep';");
    expect(result).not.toContain("import { DeepComponent } from './features\\auth\\components\\deep';");
    
    // Other imports should maintain forward slashes
    expect(result).toContain("import { AuthService } from './features/auth/services/auth.service';");
    expect(result).not.toContain("import { AuthService } from './features\\auth\\services\\auth.service';");
  });

  it('should handle mixed slash scenarios', () => {
    const specContent = `import { TestBed } from '@angular/core/testing';
import { MixedComponent } from './some/path\\mixed.component';
import { AnotherService } from './another\\path/service.service';

describe('MixedComponent', () => {
  // test content
});`;

    const updateSpecFileImports = (handler as any).updateSpecFileImports.bind(handler);
    
    const result = updateSpecFileImports(specContent, 'mixed.component.ts', 'mixed.ts');

    console.log('Mixed slash result:', result);

    // Should normalize all paths to use forward slashes
    expect(result).toContain("import { MixedComponent } from './some/path/mixed';");
    expect(result).not.toContain("import { MixedComponent } from './some/path\\mixed';");
    
    expect(result).toContain("import { AnotherService } from './another/path/service.service';");
    expect(result).not.toContain("import { AnotherService } from './another\\path/service.service';");
  });

  it('should preserve forward slashes when they are already correct', () => {
    const specContent = `import { TestBed } from '@angular/core/testing';
import { CorrectComponent } from './components/correct.component';
import { GoodService } from './services/good.service';

describe('CorrectComponent', () => {
  // test content
});`;

    const updateSpecFileImports = (handler as any).updateSpecFileImports.bind(handler);
    
    const result = updateSpecFileImports(specContent, 'correct.component.ts', 'correct.ts');

    console.log('Correct slash result:', result);

    // Should maintain forward slashes and update filename
    expect(result).toContain("import { CorrectComponent } from './components/correct';");
    expect(result).toContain("import { GoodService } from './services/good.service';");
  });
});
