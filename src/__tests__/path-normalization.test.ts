import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Path Normalization Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-path-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should maintain forward slashes in import paths when renaming files with subdirectories', async () => {
    // Create a subdirectory structure
    const plateDir = path.join(tempDir, 'plate');
    fs.mkdirSync(plateDir, { recursive: true });

    // Create a plate model file in subdirectory
    const plateModelContent = `export interface Plate {
  id: number;
  name: string;
}`;

    // Create a service file that imports from subdirectory
    const serviceContent = `import { Injectable } from '@angular/core';
import type { Plate } from './plate/plate';

@Injectable({ providedIn: 'root' })
export class PlateService {
  getPlate(): Plate {
    return { id: 1, name: 'Test Plate' };
  }
}`;

    fs.writeFileSync(path.join(plateDir, 'plate.ts'), plateModelContent);
    fs.writeFileSync(path.join(tempDir, 'plate.service.ts'), serviceContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check what files were actually created - debug output
    const filesInTempDir = fs.readdirSync(tempDir);
    const filesInPlateDir = fs.existsSync(plateDir) ? fs.readdirSync(plateDir) : [];
    console.log('Files in temp dir:', filesInTempDir);
    console.log('Files in plate dir:', filesInPlateDir);
    console.log('Renamed files:', result.renamedFiles.map(f => ({ old: f.oldPath, new: f.newPath })));

    // The service should be renamed to plate.ts
    expect(fs.existsSync(path.join(tempDir, 'plate.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'plate.service.ts'))).toBe(false);

    // Check that import statements maintain forward slashes (not backslashes)
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'plate.ts'), 'utf-8');
    console.log('Updated service content:', updatedServiceContent);

    // Check for forward slashes in imports
    const importLines = updatedServiceContent.split('\n').filter(line => line.includes('import') && line.includes('./plate'));
    for (const line of importLines) {
      expect(line).not.toMatch(/import.*['"`]\.\/plate\\plate/);
      expect(line).toMatch(/import.*['"`]\.\/plate\/plate/);
    }
  });

  it('should normalize path separators in spec file imports with subdirectories', async () => {
    // Create a subdirectory structure for components
    const componentsDir = path.join(tempDir, 'components');
    fs.mkdirSync(componentsDir, { recursive: true });

    // Create a component in subdirectory with its spec file
    const componentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {}`;

    const specContent = `import { TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileComponent]
    });
  });
});`;

    fs.writeFileSync(path.join(componentsDir, 'user-profile.component.ts'), componentContent);
    fs.writeFileSync(path.join(componentsDir, 'user-profile.component.spec.ts'), specContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    console.log('Component rename result:', result.renamedFiles.map(f => ({ old: f.oldPath, new: f.newPath })));

    // The component should be renamed to user-profile.ts
    expect(fs.existsSync(path.join(componentsDir, 'user-profile.ts'))).toBe(true);
    expect(fs.existsSync(path.join(componentsDir, 'user-profile.component.ts'))).toBe(false);

    // Check that spec file imports maintain forward slashes
    const updatedSpecContent = fs.readFileSync(path.join(componentsDir, 'user-profile.spec.ts'), 'utf-8');
    console.log('Updated spec content:', updatedSpecContent);
    
    expect(updatedSpecContent).toContain("import { UserProfileComponent } from './user-profile';");
    expect(updatedSpecContent).not.toContain("import { UserProfileComponent } from '.\\user-profile';");

    // Also test a more complex path scenario - create a component that imports from another directory
    const utilsDir = path.join(tempDir, 'utils');
    fs.mkdirSync(utilsDir, { recursive: true });
    
    const utilContent = `export function formatName(name: string): string {
  return name.toUpperCase();
}`;

    const componentWithUtilContent = `import { Component } from '@angular/core';
import { formatName } from '../utils/format';

@Component({
  selector: 'app-display',
  template: '<div>Display</div>'
})
export class DisplayComponent {
  format = formatName;
}`;

    fs.writeFileSync(path.join(utilsDir, 'format.service.ts'), utilContent);
    fs.writeFileSync(path.join(componentsDir, 'display.component.ts'), componentWithUtilContent);

    // Run refactor again to see cross-directory import handling
    const refactorer2 = new AngularRefactorer(options);
    const result2 = await refactorer2.refactor();

    console.log('Second refactor result:', result2.renamedFiles.map(f => ({ old: f.oldPath, new: f.newPath })));

    // Check that cross-directory imports maintain forward slashes
    if (fs.existsSync(path.join(componentsDir, 'display.ts'))) {
      const updatedDisplayContent = fs.readFileSync(path.join(componentsDir, 'display.ts'), 'utf-8');
      console.log('Updated display content:', updatedDisplayContent);
      
      const importLines = updatedDisplayContent.split('\n').filter(line => line.includes('import') && line.includes('../utils/'));
      for (const line of importLines) {
        expect(line).not.toMatch(/import.*['"`]\.\.\/utils\\format/);
        expect(line).toMatch(/import.*['"`]\.\.\/utils\/format/);
      }
    }
  });

  it('should handle nested directory structures with forward slashes', async () => {
    // Create nested directory structure
    const nestedDir = path.join(tempDir, 'features', 'auth');
    fs.mkdirSync(nestedDir, { recursive: true });

    // Create files in nested structure
    const authServiceContent = `
      import { Injectable } from '@angular/core';
      
      @Injectable({ providedIn: 'root' })
      export class AuthService {
        login() {
          return true;
        }
      }
    `;

    const loginComponentContent = `
      import { Component } from '@angular/core';
      import { AuthService } from '../../features/auth/auth.service';
      
      @Component({
        selector: 'app-login',
        template: '<div>Login</div>'
      })
      export class LoginComponent {
        constructor(private authService: AuthService) {}
      }
    `;

    fs.writeFileSync(path.join(nestedDir, 'auth.service.ts'), authServiceContent);
    fs.writeFileSync(path.join(tempDir, 'login.component.ts'), loginComponentContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    await refactorer.refactor();

    // Check that nested path imports maintain forward slashes
    const updatedLoginContent = fs.readFileSync(path.join(tempDir, 'login.ts'), 'utf-8');
    console.log('Updated login content:', updatedLoginContent);
    
    // The import should be updated to point to the renamed auth service
    // Check for forward slashes in the import path (regardless of whether it was updated)
    const importLines = updatedLoginContent.split('\n').filter(line => line.includes('import') && line.includes('../../features/auth/'));
    for (const line of importLines) {
      expect(line).not.toMatch(/import.*['"`]\.\.\/\.\.\/features\\auth/);
      expect(line).toMatch(/import.*['"`]\.\.\/\.\.\/features\/auth/);
    }
  });
});
