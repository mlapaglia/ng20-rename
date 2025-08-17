import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Backslash Issue Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-backslash-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should maintain forward slashes in import paths even when path.relative returns backslashes', async () => {
    // Create a subdirectory structure that would cause path.relative to return backslashes on Windows
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

    // Create an API file that also imports from subdirectory
    const apiContent = `import { Injectable, HttpClient } from '@angular/core';
import type { Plate } from './plate/plate';

@Injectable({ providedIn: 'root' })
export class PlateApiService {
  constructor(private http: HttpClient) {}
  
  getPlates() {
    return this.http.get<Plate[]>('/api/plates');
  }
}`;

    fs.writeFileSync(path.join(plateDir, 'plate.ts'), plateModelContent);
    fs.writeFileSync(path.join(tempDir, 'plate.service.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'plate.api.ts'), apiContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    console.log('Renamed files:', result.renamedFiles.map(f => ({ old: f.oldPath, new: f.newPath })));

    // The service should be renamed to plate.ts, causing the model to be renamed
    expect(fs.existsSync(path.join(tempDir, 'plate.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'plate.service.ts'))).toBe(false);

    // Check that import statements maintain forward slashes (not backslashes)
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'plate.ts'), 'utf-8');
    const updatedApiContent = fs.readFileSync(path.join(tempDir, 'plate-api.ts'), 'utf-8');

    console.log('Updated service content:', updatedServiceContent);
    console.log('Updated API content:', updatedApiContent);

    // Check all import lines for correct slash direction
    const allImportLines = [
      ...updatedServiceContent.split('\n').filter(line => line.includes('import') && line.includes('./plate')),
      ...updatedApiContent.split('\n').filter(line => line.includes('import') && line.includes('./plate'))
    ];

    for (const line of allImportLines) {
      // Should NOT contain backslashes
      expect(line).not.toMatch(/import.*['"`]\.\/plate\\plate/);
      // Should contain forward slashes
      expect(line).toMatch(/import.*['"`]\.\/plate\/plate/);
    }

    // Also check content changes for backslashes
    const importContentChanges = result.contentChanges.filter(change => 
      change.newContent.includes('import') && change.newContent.includes('./plate')
    );

    for (const change of importContentChanges) {
      console.log('Content change:', change);
      expect(change.newContent).not.toMatch(/import.*['"`]\.\/plate\\plate/);
      expect(change.newContent).toMatch(/import.*['"`]\.\/plate\/plate/);
    }
  });

  it('should handle spec file imports with forward slashes in subdirectories', async () => {
    // Create a component in a subdirectory with its spec file
    const componentsDir = path.join(tempDir, 'components');
    const utilsDir = path.join(tempDir, 'utils');
    fs.mkdirSync(componentsDir, { recursive: true });
    fs.mkdirSync(utilsDir, { recursive: true });

    const componentContent = `import { Component } from '@angular/core';
import { UtilService } from '../utils/util.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  constructor(private utilService: UtilService) {}
}`;

    const specContent = `import { TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileComponent]
    });
  });
});`;

    const utilServiceContent = `import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilService {
  format(text: string): string {
    return text.toUpperCase();
  }
}`;

    fs.writeFileSync(path.join(componentsDir, 'user-profile.component.ts'), componentContent);
    fs.writeFileSync(path.join(componentsDir, 'user-profile.component.spec.ts'), specContent);
    fs.writeFileSync(path.join(utilsDir, 'util.service.ts'), utilServiceContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    console.log('Spec file rename result:', result.renamedFiles.map(f => ({ old: f.oldPath, new: f.newPath })));

    // Check that spec file imports maintain forward slashes
    const updatedSpecContent = fs.readFileSync(path.join(componentsDir, 'user-profile.spec.ts'), 'utf-8');
    const updatedComponentContent = fs.readFileSync(path.join(componentsDir, 'user-profile.ts'), 'utf-8');

    console.log('Updated spec content:', updatedSpecContent);
    console.log('Updated component content:', updatedComponentContent);

    // Check spec file imports
    const specImportLines = updatedSpecContent.split('\n').filter(line => line.includes('import') && line.includes('./'));
    for (const line of specImportLines) {
      expect(line).not.toMatch(/import.*['"`]\.\\user-profile/);
      expect(line).toMatch(/import.*['"`]\.\/user-profile/);
    }

    // Check component imports to utils
    const componentImportLines = updatedComponentContent.split('\n').filter(line => line.includes('import') && line.includes('../utils/'));
    for (const line of componentImportLines) {
      expect(line).not.toMatch(/import.*['"`]\.\.\\utils\\util/);
      expect(line).toMatch(/import.*['"`]\.\.\/utils\/util/);
    }
  });
});
