import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - External Libraries', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-external-test-'));
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

  it('should not modify external library imports when renaming local files', async () => {
    // Create a component that imports both external libraries and local files
    const componentContent = `import { Component } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { SignalRService } from './signalr.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent {
  constructor(private signalRService: SignalRService) {}
}`;

    const serviceContent = `import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private connection: signalR.HubConnection;
}`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'signalr.service.ts'), serviceContent);

    // Simulate renaming the service file to something that contains "signalr-store"
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'signalr.service.ts'),
        newPath: path.join(tempDir, 'signalr-store.service.ts')
      }
    ];

    // Create the renamed file
    fs.writeFileSync(path.join(tempDir, 'signalr-store.service.ts'), serviceContent);
    fs.unlinkSync(path.join(tempDir, 'signalr.service.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that external library imports were NOT modified
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'signalr-store.service.ts'), 'utf-8');

    // External library imports should remain unchanged
    expect(updatedComponentContent).toContain("import * as signalR from '@microsoft/signalr';");
    expect(updatedComponentContent).not.toContain("import * as signalR from '@microsoft/signalr-store';");
    
    expect(updatedServiceContent).toContain("import * as signalR from '@microsoft/signalr';");
    expect(updatedServiceContent).not.toContain("import * as signalR from '@microsoft/signalr-store';");

    // But local imports should be updated
    expect(updatedComponentContent).toContain("import { SignalRService } from './signalr-store.service';");
    expect(updatedComponentContent).not.toContain("import { SignalRService } from './signalr.service';");
  });

  it('should not modify npm package imports with similar names to renamed files', async () => {
    const componentContent = `import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MyStore } from './store.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent {
  constructor(private store: Store, private myStore: MyStore) {}
}`;

    const serviceContent = `import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class MyStore {
  constructor(private store: Store) {}
}`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'store.service.ts'), serviceContent);

    // Simulate renaming the service file to something that could conflict with @ngrx/store
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'store.service.ts'),
        newPath: path.join(tempDir, 'data-store.service.ts')
      }
    ];

    // Create the renamed file
    fs.writeFileSync(path.join(tempDir, 'data-store.service.ts'), serviceContent);
    fs.unlinkSync(path.join(tempDir, 'store.service.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that external library imports were NOT modified
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'data-store.service.ts'), 'utf-8');

    // External library imports should remain unchanged
    expect(updatedComponentContent).toContain("import { Store } from '@ngrx/store';");
    expect(updatedComponentContent).not.toContain("import { Store } from '@ngrx/data-store';");
    
    expect(updatedServiceContent).toContain("import { Store } from '@ngrx/store';");
    expect(updatedServiceContent).not.toContain("import { Store } from '@ngrx/data-store';");

    // But local imports should be updated
    expect(updatedComponentContent).toContain("import { MyStore } from './data-store.service';");
    expect(updatedComponentContent).not.toContain("import { MyStore } from './store.service';");
  });

  it('should not modify imports from node_modules packages', async () => {
    const componentContent = `import { Component } from '@angular/core';
import moment from 'moment';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { MomentService } from './moment-utils.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent {
  constructor(private momentService: MomentService) {}
}`;

    const serviceContent = `import { Injectable } from '@angular/core';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class MomentService {
  formatDate(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }
}`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'moment-utils.service.ts'), serviceContent);

    // Simulate renaming the service file to something that could conflict with moment
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'moment-utils.service.ts'),
        newPath: path.join(tempDir, 'moment.service.ts')
      }
    ];

    // Create the renamed file
    fs.writeFileSync(path.join(tempDir, 'moment.service.ts'), serviceContent);
    fs.unlinkSync(path.join(tempDir, 'moment-utils.service.ts'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that external library imports were NOT modified
    const updatedComponentContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    const updatedServiceContent = fs.readFileSync(path.join(tempDir, 'moment.service.ts'), 'utf-8');

    // External library imports should remain unchanged
    expect(updatedComponentContent).toContain("import moment from 'moment';");
    expect(updatedComponentContent).toContain("import * as _ from 'lodash';");
    expect(updatedComponentContent).toContain("import { v4 as uuidv4 } from 'uuid';");
    
    expect(updatedServiceContent).toContain("import moment from 'moment';");

    // But local imports should be updated
    expect(updatedComponentContent).toContain("import { MomentService } from './moment.service';");
    expect(updatedComponentContent).not.toContain("import { MomentService } from './moment-utils.service';");
  });
});
