import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Integration Tests - Complete Angular App Refactoring', () => {
  let tempDir: string;
  let refactorer: AngularRefactorer;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ng20-integration-test-'));
    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false, // Actually perform the changes
      verbose: true
    };
    refactorer = new AngularRefactorer(options);
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should refactor a complete Angular app with old-style naming conventions', async () => {
    // Create a complete Angular app with old-style naming
    setupOldStyleAngularApp();

    const result = await refactorer.refactor();

    // Verify no errors occurred
    expect(result.errors).toHaveLength(0);

    // Verify all files were processed
    expect(result.processedFiles.length).toBeGreaterThan(0);

    // Verify file renames occurred
    expect(result.renamedFiles.length).toBeGreaterThan(0);

    // Verify content changes occurred
    expect(result.contentChanges.length).toBeGreaterThan(0);

    // Log summary for verification
    console.log('Integration test completed successfully!');



    // Verify specific transformations
    verifyComponentTransformations();
    verifyServiceTransformations();
    verifyDirectiveTransformations();
    verifyPipeTransformations();
    verifyModuleTransformations();
    verifyGuardTransformations();
    verifyInterceptorTransformations();
    verifyResolverTransformations();
    verifyFileNaming();

    console.log('Integration test results:');
    console.log(`- Files processed: ${result.processedFiles.length}`);
    console.log(`- Files renamed: ${result.renamedFiles.length}`);
    console.log(`- Content changes: ${result.contentChanges.length}`);
    console.log(`- Errors: ${result.errors.length}`);
  });

  function setupOldStyleAngularApp() {
    // 1. Component with bad naming
    writeFileSync(
      join(tempDir, 'UserProfile.component.ts'),
      `
import { Component } from '@angular/core';

@Component({
  selector: 'user_profile',
  templateUrl: './UserProfile.component.html',
  styleUrls: ['./UserProfile.component.css']
})
export class UserProfileComponent {
  userName: string = 'John Doe';
}
    `
    );

    writeFileSync(
      join(tempDir, 'UserProfile.component.html'),
      `
<div class="user-profile">
  <h1>Welcome {{userName}}</h1>
</div>
    `
    );

    writeFileSync(
      join(tempDir, 'UserProfile.component.css'),
      `
.user-profile {
  padding: 20px;
  background: #f5f5f5;
}
    `
    );

    // 2. Service with bad naming
    writeFileSync(
      join(tempDir, 'DataService.ts'),
      `
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  getData() {
    return { message: 'Hello World' };
  }
}
    `
    );

    // 3. Directive with bad naming
    writeFileSync(
      join(tempDir, 'HighlightDirective.ts'),
      `
import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[my-highlight]'
})
export class HighlightDirective {
  @Input() color: string = 'yellow';

  constructor(private el: ElementRef) {
    this.el.nativeElement.style.backgroundColor = this.color;
  }
}
    `
    );

    // 4. Pipe with bad naming
    writeFileSync(
      join(tempDir, 'CustomPipe.ts'),
      `
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'custom_transform'
})
export class CustomPipe implements PipeTransform {
  transform(value: any): any {
    return value.toString().toUpperCase();
  }
}
    `
    );

    // 5. Module with bad naming
    writeFileSync(
      join(tempDir, 'AppModule.ts'),
      `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [],
  imports: [BrowserModule],
  providers: [],
  bootstrap: []
})
export class AppModule { }
    `
    );

    // 6. Guard with bad naming
    writeFileSync(
      join(tempDir, 'AuthGuard.ts'),
      `
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    return true;
  }
}
    `
    );

    // 7. Interceptor with bad naming
    writeFileSync(
      join(tempDir, 'AuthInterceptor.ts'),
      `
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req);
  }
}
    `
    );

    // 8. Resolver with bad naming
    writeFileSync(
      join(tempDir, 'DataResolver.ts'),
      `
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataResolver implements Resolve<any> {
  resolve(): Observable<any> {
    return of({ data: 'resolved' });
  }
}
    `
    );

    // 9. Spec file with bad naming
    writeFileSync(
      join(tempDir, 'UserProfile.component.spec.ts'),
      `
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './UserProfile.component';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileComponent]
    });
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
    `
    );

    // 10. SCSS file
    writeFileSync(
      join(tempDir, 'Styles.scss'),
      `
$primary-color: #007bff;
$secondary-color: #6c757d;

.main-container {
  background-color: $primary-color;
  
  .header {
    color: $secondary-color;
  }
}
    `
    );
  }

  function verifyComponentTransformations() {
    // Check that component file was renamed to Angular 20 naming (no .component suffix)
    const expectedFileName = join(tempDir, 'user-profile.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');

    // Verify selector was fixed (underscores from original become part of the selector)
    expect(content).toContain("selector: 'app-user_profile'");

    // Verify class name is still correct PascalCase
    expect(content).toContain('export class UserProfileComponent');

    // The HTML and CSS files should be renamed to follow Angular 20 conventions
    expect(readFileSync(join(tempDir, 'user-profile.html'), 'utf-8')).toBeDefined();
    expect(readFileSync(join(tempDir, 'user-profile.css'), 'utf-8')).toBeDefined();
  }

  function verifyServiceTransformations() {
    const expectedFileName = join(tempDir, 'data.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class DataService');
  }

  function verifyDirectiveTransformations() {
    const expectedFileName = join(tempDir, 'highlight.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class HighlightDirective');
    expect(content).toContain("selector: '[appMyHighlight]'");
  }

  function verifyPipeTransformations() {
    const expectedFileName = join(tempDir, 'custom-pipe.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class CustomPipe');
    expect(content).toContain("name: 'custom_transform'");
  }

  function verifyModuleTransformations() {
    const expectedFileName = join(tempDir, 'app-module.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class AppModule');
  }

  function verifyGuardTransformations() {
    const expectedFileName = join(tempDir, 'auth-guard.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class AuthGuard');
  }

  function verifyInterceptorTransformations() {
    const expectedFileName = join(tempDir, 'auth-interceptor.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class AuthInterceptor');
  }

  function verifyResolverTransformations() {
    const expectedFileName = join(tempDir, 'data-resolver.ts');
    expect(readFileSync(expectedFileName, 'utf-8')).toBeDefined();

    const content = readFileSync(expectedFileName, 'utf-8');
    expect(content).toContain('export class DataResolver');
  }

  function verifyFileNaming() {
    // Verify all files follow Angular 20 naming conventions
    const expectedFiles = [
      'user-profile.ts',
      'user-profile.html',
      'user-profile.css',
      'user-profile.spec.ts',
      'data.ts',
      'highlight.ts',
      'custom-pipe.ts',
      'app-module.ts',
      'auth-guard.ts',
      'auth-interceptor.ts',
      'data-resolver.ts',
      'Styles.scss'
    ];

    expectedFiles.forEach(fileName => {
      const filePath = join(tempDir, fileName);
      expect(readFileSync(filePath, 'utf-8')).toBeDefined();
    });
  }
});
