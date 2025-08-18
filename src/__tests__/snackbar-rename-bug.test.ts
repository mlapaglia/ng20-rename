import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Snackbar Rename Bug Test', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-snackbar-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should correctly update imports when snackbar.ts is renamed to snackbar-model.ts', async () => {
    // Create snackbar.ts (model file)
    const snackbarContent = `import type { SnackBarType } from './snackbartype';

export class SnackBar {
  message: string;
  message2: string;
  snackType: SnackBarType;

  constructor(init?: Partial<SnackBar>) {
    Object.assign(this, init);
  }
}`;

    // Create snackbar.component.ts
    const snackbarComponentContent = `import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
      case SnackBarType.Connected:
        return 'wifi';
      case SnackBarType.Disconnected:
        return 'wifi_off';
      case SnackBarType.Saved:
        return 'save';
      case SnackBarType.Deleted:
        return 'delete';
      case SnackBarType.Successful:
        return 'check_circle';
      case SnackBarType.Error:
        return 'error';
    }
  }

  get getIconColor() {
    switch (this.data.snackType) {
      case SnackBarType.Alert:
        return '#ff9800';
      case SnackBarType.Info:
      case SnackBarType.Connected:
      case SnackBarType.Saved:
        return '#2196f3';
      case SnackBarType.Successful:
        return '#4caf50';
      case SnackBarType.Error:
      case SnackBarType.Disconnected:
      case SnackBarType.Deleted:
        return '#f44336';
      default:
        return '#2196f3';
    }
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}`;

    // Create snackbar.service.ts
    const snackbarServiceContent = `import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from './snackbar.component';
import { SnackBarType } from './snackbartype';
import { SnackBar } from './snackbar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  create(message: string, snackBarType: SnackBarType, message2?: string) {
    this.snackBar.openFromComponent(
      SnackbarComponent,
      {
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        duration: this.getDuration(snackBarType),
        data: new SnackBar({
          message,
          message2,
          snackType: snackBarType,
        }),
      });
  }

  private getDuration(snackBarType: SnackBarType): number {
    switch (snackBarType) {
      case SnackBarType.Error:
        return 5000;
      case SnackBarType.Alert:
        return 4000;
      default:
        return 3000;
    }
  }
}`;

    // Create snackbartype.ts
    const snackbarTypeContent = `export enum SnackBarType {
  Info = 0,
  Alert = 1,
  Connected = 2,
  Disconnected = 3,
  Saved = 4,
  Deleted = 5,
  Successful = 6,
  Error = 7,
}`;

    // Write all files
    fs.writeFileSync(path.join(tempDir, 'snackbar.ts'), snackbarContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.component.ts'), snackbarComponentContent);
    fs.writeFileSync(path.join(tempDir, 'snackbar.service.ts'), snackbarServiceContent);
    fs.writeFileSync(path.join(tempDir, 'snackbartype.ts'), snackbarTypeContent);

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: true // Enable smart services to trigger the bug
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // After refactoring:
    // - snackbar.service.ts should become snackbar-notifications.ts (with smart services)
    // - snackbar.component.ts should become snackbar.ts
    // - snackbar.ts (original model) should become snackbar-model.ts

    // Verify file renames occurred as expected
    expect(fs.existsSync(path.join(tempDir, 'snackbar-notifications.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.ts'))).toBe(true); // component renamed
    expect(fs.existsSync(path.join(tempDir, 'snackbar-model.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.service.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'snackbar.component.ts'))).toBe(false);

    // Read the updated component file (now snackbar.ts)
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'snackbar.ts'), 'utf-8');

    // This is the bug: the import should be updated to './snackbar-model' but it's getting changed to './snackbar-notifications'
    console.log('Updated component content:', updatedComponentContent);
    console.log(
      'Renamed files:',
      result.renamedFiles.map(r => `${r.oldPath} -> ${r.newPath}`)
    );

    // The CORRECT behavior should be:
    expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar-model';");

    // But due to the bug, it's incorrectly changed to:
    // expect(updatedComponentContent).toContain("import type { SnackBar } from './snackbar-notifications';");

    // This test should FAIL until the bug is fixed
    expect(updatedComponentContent).not.toContain("import type { SnackBar } from './snackbar-notifications';");

    // Also check the service file
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'snackbar-notifications.ts'), 'utf-8');
    expect(updatedServiceContent).toContain("import { SnackBar } from './snackbar-model';");
    expect(updatedServiceContent).not.toContain("import { SnackBar } from './snackbar-notifications';");
  });
});
