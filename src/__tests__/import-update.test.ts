import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Import Statement Update Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-import-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should update import statements when files are renamed due to conflict resolution', async () => {
    // Create a model file that will conflict with a service rename
    const modelContent = `
      export interface SnackBar {
        message: string;
        type: string;
      }
    `;

    // Create a service file that will be renamed to the same name as the model
    const serviceContent = `
      import { Injectable } from '@angular/core';
      
      @Injectable({ providedIn: 'root' })
      export class SnackbarService {
        show(message: string) {
          console.log(message);
        }
      }
    `;

    // Create a component that imports from the model file
    const componentContent = `
      import { Component } from '@angular/core';
      import type { SnackBar } from './snackbar';
      
      @Component({
        selector: 'app-notification',
        template: '<div>Notification</div>'
      })
      export class NotificationComponent {
        snackbar: SnackBar = { message: 'test', type: 'info' };
      }
    `;

    // Create another file that also imports from the model
    const utilContent = `
      import type { SnackBar } from './snackbar';
      
      export function createSnackbar(message: string): SnackBar {
        return { message, type: 'info' };
      }
    `;

    fs.writeFileSync(path.join(tempDir, 'snackbar.ts'), modelContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.service.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'notification.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'utils.ts'), utilContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false // Disable smart services to get predictable renaming
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // The service should be renamed to snackbar.ts
    expect(fs.existsSync(path.join(tempDir, 'snackbar.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.service.ts'))).toBe(false);

    // The original snackbar.ts should be renamed to snackbar-interface.ts (conflict resolution)
    expect(fs.existsSync(path.join(tempDir, 'snackbar-interface.ts'))).toBe(true);

    // Check that all files were reported as renamed (service, model, component)
    expect(result.renamedFiles).toHaveLength(3);

    const serviceRename = result.renamedFiles.find(r => r.oldPath.includes('snackbar.service.ts'));
    const modelRename = result.renamedFiles.find(
      r => r.oldPath.includes('snackbar.ts') && !r.oldPath.includes('service')
    );

    expect(serviceRename).toBeDefined();
    expect(serviceRename?.newPath).toContain('snackbar.ts');

    expect(modelRename).toBeDefined();
    expect(modelRename?.newPath).toContain('snackbar-interface.ts');

    // Check that import statements were updated in the component file
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'notification.ts'), 'utf-8');
    expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar-interface';");
    expect(updatedComponentContent).not.toContain("import type { SnackBar } from './snackbar';");

    // Check that import statements were updated in the utils file
    const updatedUtilContent = fs.readFileSync(path.join(tempDir, 'utils.ts'), 'utf-8');
    expect(updatedUtilContent).toContain("import type { SnackBar } from './snackbar-interface';");
    expect(updatedUtilContent).not.toContain("import type { SnackBar } from './snackbar';");

    // Verify that content changes were reported
    const componentContentChanges = result.contentChanges.filter(c => c.filePath.includes('notification.ts'));
    const utilContentChanges = result.contentChanges.filter(c => c.filePath.includes('utils.ts'));

    expect(componentContentChanges.length).toBeGreaterThan(0);
    expect(utilContentChanges.length).toBeGreaterThan(0);
  });

  it('should update import statements when service files are renamed with smart domain detection', async () => {
    // Create a service file that will be renamed with smart domain detection
    const serviceContent = `
      import { Injectable, inject } from '@angular/core';
      import { MatSnackBar } from '@angular/material/snack-bar';
      
      @Injectable({ providedIn: 'root' })
      export class NotificationService {
        private readonly snackBar = inject(MatSnackBar);
        
        show(message: string) {
          this.snackBar.open(message);
        }
      }
    `;

    // Create a component that imports the service
    const componentContent = `
      import { Component, inject } from '@angular/core';
      import { NotificationService } from './notification.service';
      
      @Component({
        selector: 'app-test',
        template: '<div>Test</div>'
      })
      export class TestComponent {
        private notificationService = inject(NotificationService);
        
        showMessage() {
          this.notificationService.show('Hello');
        }
      }
    `;

    fs.writeFileSync(path.join(tempDir, 'notification.service.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // The service should be renamed to notification-notifications.ts (smart domain detection)
    expect(fs.existsSync(path.join(tempDir, 'notification-notifications.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'notification.service.ts'))).toBe(false);

    // The component should be renamed to test.ts
    expect(fs.existsSync(path.join(tempDir, 'test.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'test.component.ts'))).toBe(false);

    // Check that import statements were updated in the component file
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'test.ts'), 'utf-8');
    expect(updatedComponentContent).toContain("import { NotificationService } from './notification-notifications';");
    expect(updatedComponentContent).not.toContain("import { NotificationService } from './notification.service';");

    // Verify that content changes were reported
    const contentChanges = result.contentChanges.filter(c => c.filePath.includes('test.ts'));
    expect(contentChanges.length).toBeGreaterThan(0);
  });

  it('should handle complex import patterns and different quote styles', async () => {
    // Create a model file
    const modelContent = `
      export interface User {
        id: number;
        name: string;
      }
      
      export type UserRole = 'admin' | 'user';
    `;

    // Create files with different import patterns
    const file1Content = `
      import { User } from './user';
      import type { UserRole } from "./user";
      
      export class UserManager {
        users: User[] = [];
      }
    `;

    const file2Content = `
      import { User, UserRole } from \`./user\`;
      
      export function createUser(name: string): User {
        return { id: 1, name };
      }
    `;

    const serviceContent = `
      import { Injectable } from '@angular/core';
      
      @Injectable({ providedIn: 'root' })
      export class UserService {
        getUsers() {
          return [];
        }
      }
    `;

    fs.writeFileSync(path.join(tempDir, 'user.ts'), modelContent);
    fs.writeFileSync(path.join(tempDir, 'user-manager.ts'), file1Content);
    fs.writeFileSync(path.join(tempDir, 'user-factory.ts'), file2Content);
    fs.writeFileSync(path.join(tempDir, 'user.service.ts'), serviceContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    await refactorer.refactor();

    // The service should be renamed to user.ts, causing the model to be renamed to user-model.ts
    expect(fs.existsSync(path.join(tempDir, 'user.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user-model.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user.service.ts'))).toBe(false);

    // Check that all import patterns were updated correctly
    const updatedFile1Content = fs.readFileSync(path.join(tempDir, 'user-manager.ts'), 'utf-8');
    expect(updatedFile1Content).toContain("import { User } from './user-model';");
    expect(updatedFile1Content).toContain('import type { UserRole } from "./user-model";');

    const updatedFile2Content = fs.readFileSync(path.join(tempDir, 'user-factory.ts'), 'utf-8');
    expect(updatedFile2Content).toContain('import { User, UserRole } from `./user-model`;');
  });
});
