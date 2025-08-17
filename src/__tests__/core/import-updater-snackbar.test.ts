import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - Snackbar Scenario', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-snackbar-test-'));
    importUpdater = new ImportUpdater(false);
    result = {
      processedFiles: [],
      renamedFiles: [],
      contentChanges: [],
      manualReviewRequired: [],
      errors: []
    };
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle the exact snackbar rename scenario described by the user', async () => {
    // Set up the exact scenario described:
    // snackbar.ts -> snackbar-model.ts
    // snackbar.service.spec.ts -> snackbar-notifications.spec.ts
    // snackbar.service.ts -> snackbar-notifications.ts
    // snackbar.component.html -> snackbar.html
    // snackbar.component.less -> snackbar.less
    // snackbar.component.spec.ts -> snackbar.spec.ts
    // snackbar.component.ts -> snackbar.ts

    // Create the original files
    const modelContent = `export interface SnackBar {
  message: string;
  type: 'info' | 'warning' | 'error';
}

export type SnackBarType = 'info' | 'warning' | 'error';`;

    const serviceContent = `import { Injectable } from '@angular/core';
import type { SnackBar } from './snackbar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  show(snackbar: SnackBar): void {
    console.log(snackbar.message);
  }
}`;

    const serviceSpecContent = `import { TestBed } from '@angular/core/testing';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  // ... test content
});`;

    const componentContent = `import { Component } from '@angular/core';
import type { SnackBar } from './snackbar';
import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.less']
})
export class SnackbarComponent {
  snackbar: SnackBar = { message: 'test', type: 'info' };
  
  constructor(private snackbarService: SnackbarService) {}
}`;

    const componentSpecContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';

describe('SnackbarComponent', () => {
  let component: SnackbarComponent;
  // ... test content
});`;

    const componentHtmlContent = `<div class="snackbar">{{ snackbar.message }}</div>`;
    const componentLessContent = `.snackbar { padding: 16px; }`;

    const snackbarTypeContent = `export type SnackBarType = 'info' | 'warning' | 'error';`;

    // Write all original files
    fs.writeFileSync(path.join(tempDir, 'snackbar.ts'), modelContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.service.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.service.spec.ts'), serviceSpecContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.component.spec.ts'), componentSpecContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.component.html'), componentHtmlContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.component.less'), componentLessContent);
    fs.writeFileSync(path.join(tempDir, 'snackbartype.ts'), snackbarTypeContent);

    // Now simulate the renames by creating the renamed files and defining the rename map
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'snackbar.ts'),
        newPath: path.join(tempDir, 'snackbar-model.ts')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.service.ts'),
        newPath: path.join(tempDir, 'snackbar-notifications.ts')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.service.spec.ts'),
        newPath: path.join(tempDir, 'snackbar-notifications.spec.ts')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.component.ts'),
        newPath: path.join(tempDir, 'snackbar.ts')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.component.spec.ts'),
        newPath: path.join(tempDir, 'snackbar.spec.ts')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.component.html'),
        newPath: path.join(tempDir, 'snackbar.html')
      },
      {
        oldPath: path.join(tempDir, 'snackbar.component.less'),
        newPath: path.join(tempDir, 'snackbar.less')
      }
    ];

    // Create the renamed files (simulate the actual file renames)
    fs.writeFileSync(path.join(tempDir, 'snackbar-model.ts'), modelContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar-notifications.ts'), serviceContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar-notifications.spec.ts'), serviceSpecContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.spec.ts'), componentSpecContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.html'), componentHtmlContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.less'), componentLessContent);

    // Remove the original files to simulate the rename
    fs.unlinkSync(path.join(tempDir, 'snackbar.service.ts'));
    fs.unlinkSync(path.join(tempDir, 'snackbar.service.spec.ts'));
    fs.unlinkSync(path.join(tempDir, 'snackbar.component.ts'));
    fs.unlinkSync(path.join(tempDir, 'snackbar.component.spec.ts'));
    fs.unlinkSync(path.join(tempDir, 'snackbar.component.html'));
    fs.unlinkSync(path.join(tempDir, 'snackbar.component.less'));

    // Now test the import updating
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check the critical import update: snackbar.ts (was component) should import from snackbar-model
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'snackbar.ts'), 'utf-8');

    // This is the key test - the component (now snackbar.ts) should import from snackbar-model
    expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar-model';");
    expect(updatedComponentContent).not.toContain("import type { SnackBar } from './snackbar';");

    // The service import should also be updated
    expect(updatedComponentContent).toContain("import { SnackbarService } from './snackbar-notifications';");
    expect(updatedComponentContent).not.toContain("import { SnackbarService } from './snackbar.service';");

    // Check the service file was also updated
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'snackbar-notifications.ts'), 'utf-8');
    expect(updatedServiceContent).toContain("import type { SnackBar } from './snackbar-model';");
    expect(updatedServiceContent).not.toContain("import type { SnackBar } from './snackbar';");

    // Check the spec file was updated
    const updatedSpecContent = fs.readFileSync(path.join(tempDir, 'snackbar.spec.ts'), 'utf-8');
    expect(updatedSpecContent).toContain("import { SnackbarComponent } from './snackbar';");
    expect(updatedSpecContent).not.toContain("import { SnackbarComponent } from './snackbar.component';");

    // Verify no errors occurred
    expect(result.errors).toHaveLength(0);
  });
});
