import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - Absolute Imports', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-absolute-test-'));
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

  it('should update absolute imports when shared components are renamed', async () => {
    // Create directory structure that mimics Angular project structure
    const srcDir = path.join(tempDir, 'src');
    const appDir = path.join(srcDir, 'app');
    const sharedDir = path.join(appDir, 'shared', 'refresh-button');
    const featuresDir = path.join(appDir, 'features', 'dashboard');

    fs.mkdirSync(sharedDir, { recursive: true });
    fs.mkdirSync(featuresDir, { recursive: true });

    // Create the shared component (original name)
    const sharedComponentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-refresh-button',
  template: '<button>Refresh</button>'
})
export class RefreshButtonComponent {
}`;
    fs.writeFileSync(path.join(sharedDir, 'refresh-button.component.ts'), sharedComponentContent);

    // Create a component that uses absolute import to the shared component
    const dashboardComponentContent = `import { Component } from '@angular/core';
import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button.component';

@Component({
  selector: 'app-dashboard',
  template: '<app-refresh-button></app-refresh-button>'
})
export class DashboardComponent {
  constructor(private refreshButton: RefreshButtonComponent) {}
}`;
    fs.writeFileSync(path.join(featuresDir, 'dashboard.component.ts'), dashboardComponentContent);

    // Create another file that also uses the absolute import
    const headerComponentContent = `import { Component } from '@angular/core';
import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button.component';

@Component({
  selector: 'app-header',
  template: '<app-refresh-button></app-refresh-button>'
})
export class HeaderComponent {
}`;
    fs.writeFileSync(path.join(appDir, 'header.component.ts'), headerComponentContent);

    // Define the rename operation (Angular 20 style - remove .component suffix)
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(sharedDir, 'refresh-button.component.ts'),
        newPath: path.join(sharedDir, 'refresh-button.ts')
      }
    ];

    // Simulate the rename by creating the new file and removing the old one
    fs.writeFileSync(path.join(sharedDir, 'refresh-button.ts'), sharedComponentContent);
    fs.unlinkSync(path.join(sharedDir, 'refresh-button.component.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Read the updated files
    const updatedDashboardContent = fs.readFileSync(path.join(featuresDir, 'dashboard.component.ts'), 'utf-8');
    const updatedHeaderContent = fs.readFileSync(path.join(appDir, 'header.component.ts'), 'utf-8');

    // Verify that absolute imports were updated correctly
    expect(updatedDashboardContent).toContain(
      "import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button';"
    );
    expect(updatedDashboardContent).not.toContain(
      "import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button.component';"
    );

    expect(updatedHeaderContent).toContain(
      "import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button';"
    );
    expect(updatedHeaderContent).not.toContain(
      "import { RefreshButtonComponent } from 'app/shared/refresh-button/refresh-button.component';"
    );

    // Verify that content changes were made
    expect(result.contentChanges.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle mixed relative and absolute imports correctly', async () => {
    // Create directory structure
    const srcDir = path.join(tempDir, 'src');
    const appDir = path.join(srcDir, 'app');
    const sharedDir = path.join(appDir, 'shared', 'utils');

    fs.mkdirSync(sharedDir, { recursive: true });

    // Create the shared service (original name)
    const serviceContent = `import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
}`;
    fs.writeFileSync(path.join(sharedDir, 'data.service.ts'), serviceContent);

    // Create a component in the same directory using relative import
    const localComponentContent = `import { Component } from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'app-local',
  template: '<div>Local</div>'
})
export class LocalComponent {
  constructor(private dataService: DataService) {}
}`;
    fs.writeFileSync(path.join(sharedDir, 'local.component.ts'), localComponentContent);

    // Create a component in different directory using absolute import
    const remoteComponentContent = `import { Component } from '@angular/core';
import { DataService } from 'app/shared/utils/data.service';

@Component({
  selector: 'app-remote',
  template: '<div>Remote</div>'
})
export class RemoteComponent {
  constructor(private dataService: DataService) {}
}`;
    fs.writeFileSync(path.join(appDir, 'remote.component.ts'), remoteComponentContent);

    // Define the rename operation
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(sharedDir, 'data.service.ts'),
        newPath: path.join(sharedDir, 'data-api.ts')
      }
    ];

    // Simulate the rename
    fs.writeFileSync(path.join(sharedDir, 'data-api.ts'), serviceContent);
    fs.unlinkSync(path.join(sharedDir, 'data.service.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Read the updated files
    const updatedLocalContent = fs.readFileSync(path.join(sharedDir, 'local.component.ts'), 'utf-8');
    const updatedRemoteContent = fs.readFileSync(path.join(appDir, 'remote.component.ts'), 'utf-8');

    // Relative import should be updated (this currently works)
    expect(updatedLocalContent).toContain("import { DataService } from './data-api';");
    expect(updatedLocalContent).not.toContain("import { DataService } from './data.service';");

    // Absolute import should also be updated (this currently fails)
    expect(updatedRemoteContent).toContain("import { DataService } from 'app/shared/utils/data-api';");
    expect(updatedRemoteContent).not.toContain("import { DataService } from 'app/shared/utils/data.service';");

    expect(result.contentChanges.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });
});
