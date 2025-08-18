import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - Backslash Preservation', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-backslash-test-'));
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

  it('should preserve backslashes in import paths when doing string replacement', async () => {
    // This is the real-world example from the user
    const routingModuleContent = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlertsComponent } from './settings\\alerts\\alerts';
import { CamerasComponent } from './settings\\cameras\\cameras';

const routes: Routes = [
  { path: 'alerts', component: AlertsComponent },
  { path: 'cameras', component: CamerasComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`;

    const alertsContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html'
})
export class AlertsComponent {}`;

    const camerasContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-cameras', 
  templateUrl: './cameras.component.html'
})
export class CamerasComponent {}`;

    // Create directory structure
    const settingsDir = path.join(tempDir, 'settings');
    const alertsDir = path.join(settingsDir, 'alerts');
    const camerasDir = path.join(settingsDir, 'cameras');
    
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.mkdirSync(alertsDir, { recursive: true });
    fs.mkdirSync(camerasDir, { recursive: true });

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'app-routing-module.ts'), routingModuleContent);
    fs.writeFileSync(path.join(alertsDir, 'alerts.ts'), alertsContent);
    fs.writeFileSync(path.join(camerasDir, 'cameras.ts'), camerasContent);

    // Simulate file renames (alerts.ts -> alert-management.ts, cameras.ts -> camera-settings.ts)
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(alertsDir, 'alerts.ts'),
        newPath: path.join(alertsDir, 'alert-management.ts')
      },
      {
        oldPath: path.join(camerasDir, 'cameras.ts'),
        newPath: path.join(camerasDir, 'camera-settings.ts')
      }
    ];

    // Create renamed files
    fs.writeFileSync(path.join(alertsDir, 'alert-management.ts'), alertsContent);
    fs.writeFileSync(path.join(camerasDir, 'camera-settings.ts'), camerasContent);
    fs.unlinkSync(path.join(alertsDir, 'alerts.ts'));
    fs.unlinkSync(path.join(camerasDir, 'cameras.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check the updated content
    const updatedContent = fs.readFileSync(path.join(tempDir, 'app-routing-module.ts'), 'utf-8');
    
    // The key test: backslashes should be preserved in the import paths
    expect(updatedContent).toContain("import { AlertsComponent } from './settings\\alerts\\alert-management';");
    expect(updatedContent).toContain("import { CamerasComponent } from './settings\\cameras\\camera-settings';");
    
    // These should NOT be present (the old paths)
    expect(updatedContent).not.toContain("import { AlertsComponent } from './settings\\alerts\\alerts';");
    expect(updatedContent).not.toContain("import { CamerasComponent } from './settings\\cameras\\cameras';");
    
    // And definitely should not be converted to forward slashes
    expect(updatedContent).not.toContain("import { AlertsComponent } from './settings/alerts/alert-management';");
    expect(updatedContent).not.toContain("import { CamerasComponent } from './settings/cameras/camera-settings';");
  });

  it('should preserve forward slashes in import paths when doing string replacement', async () => {
    const componentContent = `import { Component } from '@angular/core';
import { SharedService } from './shared/services/shared-service';
import { UtilsService } from '../utils/helper-utils';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent {}`;

    const sharedServiceContent = `export class SharedService {}`;
    const utilsServiceContent = `export class UtilsService {}`;

    // Create directory structure
    const sharedDir = path.join(tempDir, 'shared', 'services');
    const utilsDir = path.join(tempDir, 'utils');
    
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.mkdirSync(utilsDir, { recursive: true });

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(sharedDir, 'shared-service.ts'), sharedServiceContent);
    fs.writeFileSync(path.join(utilsDir, 'helper-utils.ts'), utilsServiceContent);

    // Simulate file renames
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(sharedDir, 'shared-service.ts'),
        newPath: path.join(sharedDir, 'common-service.ts')
      },
      {
        oldPath: path.join(utilsDir, 'helper-utils.ts'),
        newPath: path.join(utilsDir, 'utility-helpers.ts')
      }
    ];

    // Create renamed files
    fs.writeFileSync(path.join(sharedDir, 'common-service.ts'), sharedServiceContent);
    fs.writeFileSync(path.join(utilsDir, 'utility-helpers.ts'), utilsServiceContent);
    fs.unlinkSync(path.join(sharedDir, 'shared-service.ts'));
    fs.unlinkSync(path.join(utilsDir, 'helper-utils.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check the updated content
    const updatedContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    
    // Forward slashes should be preserved
    expect(updatedContent).toContain("import { SharedService } from './shared/services/common-service';");
    expect(updatedContent).toContain("import { UtilsService } from '../utils/utility-helpers';");
    
    // Old paths should not be present
    expect(updatedContent).not.toContain("import { SharedService } from './shared/services/shared-service';");
    expect(updatedContent).not.toContain("import { UtilsService } from '../utils/helper-utils';");
  });
});
