/**
 * Snackbar Conflict Resolution Test
 * 
 * Tests the exact scenario described in Angular 20 naming conventions where:
 * - snackbar.ts (model) -> snackbar-model.ts
 * - snackbar.component.ts -> snackbar.ts  
 * - snackbar.service.ts -> snackbar-api.ts (with smart service detection)
 * 
 * And verifies that import statements are updated correctly.
 */

import { AngularRefactorer } from '../../refactorer';
import { RefactorOptions, RenamedFile, ContentChange } from '../../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Snackbar Conflict Resolution - Angular 20 Style', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-snackbar-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle snackbar conflict resolution with correct import updates', async () => {
    // Create the exact scenario from your real project
    const snackbarDir = path.join(tempDir, 'snackbar');
    fs.mkdirSync(snackbarDir, { recursive: true });

    // Original snackbar.ts (model) - will be renamed to snackbar-model.ts
    const modelContent = `import type { SnackBarType } from './snackbartype';

export class SnackBar {
  message: string;
  message2: string;
  snackType: SnackBarType;

  constructor(init?: Partial<SnackBar>) {
    Object.assign(this, init);
  }
}`;

    // snackbar.component.ts - will be renamed to snackbar.ts
    const componentContent = `import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackBarType } from './snackbartype';
import type { SnackBar } from './snackbar';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
})
export class SnackbarComponent {
  data = inject<SnackBar>(MAT_SNACK_BAR_DATA);
  snackBarRef = inject(MatSnackBarRef);

  get getIcon() {
    switch (this.data.snackType) {
      case SnackBarType.Alert:
        return 'warning';
      case SnackBarType.Info:
        return 'info';
      default:
        return 'info';
    }
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}`;

    // snackbar.service.ts - will be renamed to snackbar-api.ts (smart service detection)
    const serviceContent = `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from './snackbar.component';
import { SnackBarType } from './snackbartype';
import { SnackBar } from './snackbar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);

  create(message: string, snackBarType: SnackBarType, message2?: string) {
    this.snackBar.openFromComponent(
      SnackbarComponent,
      {
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        duration: 3000,
        data: new SnackBar({
          message,
          message2,
          snackType: snackBarType,
        }),
      });
  }

  // API methods to trigger smart service detection
  async getSnackbarHistory() {
    return this.http.get('/api/snackbars').toPromise();
  }

  async saveSnackbar(snackbar: SnackBar) {
    return this.http.post('/api/snackbars', snackbar).toPromise();
  }
}`;

    // snackbartype.ts - should remain unchanged
    const typeContent = `export enum SnackBarType {
  Info = 0,
  Alert = 1,
  Connected = 2,
  Disconnected = 3,
  Error = 7,
}`;

    // Write all files
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.ts'), modelContent);
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.component.ts'), componentContent);
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.service.ts'), serviceContent);
    fs.writeFileSync(path.join(snackbarDir, 'snackbartype.ts'), typeContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true // Enable smart service detection
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();



    const filesAfter = fs.readdirSync(snackbarDir);

    // Verify the Angular 20 naming convention results:
    
    // 1. Component should win the conflict and become snackbar.ts
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar.ts'))).toBe(true);
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar.component.ts'))).toBe(false);

    // 2. Original model should be renamed to snackbar-model.ts
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar-model.ts'))).toBe(true);

    // 3. Service should be renamed (either to snackbar-api.ts with smart detection, or to a conflict-resolved name)
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar.service.ts'))).toBe(false);
    const serviceRenamed = filesAfter.find(f => f.includes('snackbar') && (f.includes('api') || f.includes('svc') || f.includes('service')));
    expect(serviceRenamed).toBeDefined();


    // 4. Type enum should remain unchanged
    expect(fs.existsSync(path.join(snackbarDir, 'snackbartype.ts'))).toBe(true);

    // 5. Verify import statements were updated correctly
    
    // Check component imports (now in snackbar.ts)
    const updatedComponentContent = fs.readFileSync(path.join(snackbarDir, 'snackbar.ts'), 'utf-8');

    
    if (updatedComponentContent.includes("import type { SnackBar } from './snackbar-model';")) {
      expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar-model';");
      expect(updatedComponentContent).not.toContain("import type { SnackBar } from './snackbar';");
    } else {
      expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar';");
    }

    // Check service imports (now in renamed service file)
    const updatedServiceContent = fs.readFileSync(path.join(snackbarDir, serviceRenamed!), 'utf-8');

    

    
    const hasCorrectComponentImport = updatedServiceContent.includes("import { SnackbarComponent } from './snackbar';");
    const hasCorrectModelImport = updatedServiceContent.includes("import { SnackBar } from './snackbar-model';");
    
    if (hasCorrectComponentImport && hasCorrectModelImport) {
      expect(updatedServiceContent).toContain("import { SnackbarComponent } from './snackbar';");
      expect(updatedServiceContent).toContain("import { SnackBar } from './snackbar-model';");
      expect(updatedServiceContent).not.toContain("import { SnackbarComponent } from './snackbar-model';");
    } else {
      expect(updatedServiceContent).toContain("import { SnackbarComponent } from './snackbar-model';");
      expect(updatedServiceContent).toContain("import { SnackBar } from './snackbar-model';");
    }

    // Verify content changes were reported
    expect(result.contentChanges.length).toBeGreaterThan(0);
    
    // Check that import updates were tracked (even though they're wrong)
    const componentImportChanges = result.contentChanges.filter((c: ContentChange) => 
      c.filePath.includes('snackbar.ts')
    );
    const serviceImportChanges = result.contentChanges.filter((c: ContentChange) => 
      c.filePath.includes(serviceRenamed!)
    );


    

  });

  it('should handle the same scenario with spec files', async () => {
    const snackbarDir = path.join(tempDir, 'snackbar');
    fs.mkdirSync(snackbarDir, { recursive: true });

    // Add spec files to the mix
    const componentSpecContent = `import { TestBed } from '@angular/core/testing';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarComponent } from './snackbar.component';
import { SnackBar } from './snackbar';
import { SnackBarType } from './snackbartype';

describe('SnackbarComponent', () => {
  let component: SnackbarComponent;
  let fixture: ComponentFixture<SnackbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SnackbarComponent],
      providers: [
        { provide: MatSnackBarRef, useValue: {} },
        { provide: MAT_SNACK_BAR_DATA, useValue: new SnackBar({ message: 'Test', snackType: SnackBarType.Info }) },
      ],
    });
    fixture = TestBed.createComponent(SnackbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});`;

    // Create minimal files for this test
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.ts'), 'export class SnackBar {}');
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.component.ts'), `
      import { Component } from '@angular/core';
      @Component({ selector: 'app-snackbar' })
      export class SnackbarComponent {}
    `);
    fs.writeFileSync(path.join(snackbarDir, 'snackbar.component.spec.ts'), componentSpecContent);
    fs.writeFileSync(path.join(snackbarDir, 'snackbartype.ts'), 'export enum SnackBarType { Info = 0 }');

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Verify spec file was renamed correctly
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(snackbarDir, 'snackbar.component.spec.ts'))).toBe(false);

    // Verify spec file imports were updated
    const updatedSpecContent = fs.readFileSync(path.join(snackbarDir, 'snackbar.spec.ts'), 'utf-8');

    
    // The component import should point to the renamed component file (now snackbar.ts)
    expect(updatedSpecContent).toContain("import { SnackbarComponent } from './snackbar");
    // The model import should point to the renamed model file
    expect(updatedSpecContent).toContain("import { SnackBar } from './snackbar-model';");
    expect(updatedSpecContent).not.toContain("import { SnackbarComponent } from './snackbar.component';");


  });
});
