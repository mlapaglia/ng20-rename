import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Spec File Renaming Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-spec-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should rename spec files when their corresponding source files are renamed', async () => {
    // Create a service file that should be renamed with smart domain detection
    const serviceContent = `
      import { Injectable, inject } from '@angular/core';
      import { MatSnackBar } from '@angular/material/snack-bar';
      
      @Injectable({ providedIn: 'root' })
      export class SnackbarService {
        private readonly snackBar = inject(MatSnackBar);
        
        show(message: string) {
          this.snackBar.open(message);
        }
      }
    `;

    // Create corresponding spec file
    const specContent = `
      import { TestBed } from '@angular/core/testing';
      import { SnackbarService } from './snackbar.service';
      
      describe('SnackbarService', () => {
        let service: SnackbarService;
        
        beforeEach(() => {
          TestBed.configureTestingModule({});
          service = TestBed.inject(SnackbarService);
        });
        
        it('should be created', () => {
          expect(service).toBeTruthy();
        });
      });
    `;

    fs.writeFileSync(path.join(tempDir, 'snackbar.service.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.service.spec.ts'), specContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [], // Don't exclude spec files for this test
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // The service should be renamed to snackbar-notifications.ts
    expect(fs.existsSync(path.join(tempDir, 'snackbar-notifications.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.service.ts'))).toBe(false);

    // The spec file should also be renamed to snackbar-notifications.spec.ts
    expect(fs.existsSync(path.join(tempDir, 'snackbar-notifications.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.service.spec.ts'))).toBe(false);

    // Check that both files were reported as renamed
    expect(result.renamedFiles).toHaveLength(2);
    
    const serviceRename = result.renamedFiles.find(r => r.oldPath.includes('snackbar.service.ts'));
    const specRename = result.renamedFiles.find(r => r.oldPath.includes('snackbar.service.spec.ts'));
    
    expect(serviceRename).toBeDefined();
    expect(serviceRename?.newPath).toContain('snackbar-notifications.ts');
    
    expect(specRename).toBeDefined();
    expect(specRename?.newPath).toContain('snackbar-notifications.spec.ts');

    // Check that the spec file import was updated
    const renamedSpecContent = fs.readFileSync(path.join(tempDir, 'snackbar-notifications.spec.ts'), 'utf-8');
    expect(renamedSpecContent).toContain("import { SnackbarService } from './snackbar-notifications';");
  });

  it('should rename component spec files when components are renamed', async () => {
    const componentContent = `
      import { Component } from '@angular/core';
      
      @Component({
        selector: 'app-user-profile',
        template: '<div>User Profile</div>'
      })
      export class UserProfileComponent {}
    `;

    const specContent = `
      import { ComponentFixture, TestBed } from '@angular/core/testing';
      import { UserProfileComponent } from './user-profile.component';
      
      describe('UserProfileComponent', () => {
        let component: UserProfileComponent;
        let fixture: ComponentFixture<UserProfileComponent>;
        
        beforeEach(() => {
          TestBed.configureTestingModule({
            declarations: [UserProfileComponent]
          });
          fixture = TestBed.createComponent(UserProfileComponent);
          component = fixture.componentInstance;
        });
        
        it('should create', () => {
          expect(component).toBeTruthy();
        });
      });
    `;

    fs.writeFileSync(path.join(tempDir, 'user-profile.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'user-profile.component.spec.ts'), specContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Component should be renamed to user-profile.ts (Angular 20 convention)
    expect(fs.existsSync(path.join(tempDir, 'user-profile.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user-profile.component.ts'))).toBe(false);

    // Spec file should be renamed to user-profile.spec.ts
    expect(fs.existsSync(path.join(tempDir, 'user-profile.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user-profile.component.spec.ts'))).toBe(false);

    // Check that both files were reported as renamed
    expect(result.renamedFiles).toHaveLength(2);
    
    const componentRename = result.renamedFiles.find(r => r.oldPath.includes('user-profile.component.ts'));
    const specRename = result.renamedFiles.find(r => r.oldPath.includes('user-profile.component.spec.ts'));
    
    expect(componentRename).toBeDefined();
    expect(componentRename?.newPath).toContain('user-profile.ts');
    
    expect(specRename).toBeDefined();
    expect(specRename?.newPath).toContain('user-profile.spec.ts');

    // Check that the spec file import was updated
    const renamedSpecContent = fs.readFileSync(path.join(tempDir, 'user-profile.spec.ts'), 'utf-8');
    expect(renamedSpecContent).toContain("import { UserProfileComponent } from './user-profile';");
  });
});
