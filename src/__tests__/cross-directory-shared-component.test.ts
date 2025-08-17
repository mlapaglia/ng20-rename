import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Cross-Directory Shared Component Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cross-directory-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should update imports across the project when a shared component filename and class name change', async () => {
    // Create directory structure
    const sharedDir = path.join(tempDir, 'src', 'app', 'shared', 'components');
    const featuresDir = path.join(tempDir, 'src', 'app', 'features', 'user');
    const pagesDir = path.join(tempDir, 'src', 'app', 'pages');
    
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.mkdirSync(featuresDir, { recursive: true });
    fs.mkdirSync(pagesDir, { recursive: true });

    // Create a shared component in shared/components directory
    const sharedComponentContent = `
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: '<div class="spinner">Loading...</div>',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Loading...';
}
`;

    // Create files that import the shared component from different directories
    const userListComponentContent = `
import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-user-list',
  template: '<app-loading-spinner size="large"></app-loading-spinner>'
})
export class UserListComponent {
  isLoading = true;
}
`;

    const userProfileComponentContent = `
import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-user-profile',
  template: '<app-loading-spinner [message]="loadingMessage"></app-loading-spinner>'
})
export class UserProfileComponent {
  loadingMessage = 'Loading profile...';
}
`;

    const dashboardPageContent = `
import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  template: '<app-loading-spinner size="small"></app-loading-spinner>'
})
export class DashboardComponent {
  showSpinner = true;
}
`;

    const appModuleContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner.component';
import { UserListComponent } from './features/user/user-list.component';
import { UserProfileComponent } from './features/user/user-profile.component';
import { DashboardComponent } from './pages/dashboard.component';

@NgModule({
  declarations: [
    LoadingSpinnerComponent,
    UserListComponent,
    UserProfileComponent,
    DashboardComponent
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: []
})
export class AppModule { }
`;

    // Write all files
    fs.writeFileSync(path.join(sharedDir, 'loading-spinner.component.ts'), sharedComponentContent);
    fs.writeFileSync(path.join(featuresDir, 'user-list.component.ts'), userListComponentContent);
    fs.writeFileSync(path.join(featuresDir, 'user-profile.component.ts'), userProfileComponentContent);
    fs.writeFileSync(path.join(pagesDir, 'dashboard.component.ts'), dashboardPageContent);
    fs.writeFileSync(path.join(tempDir, 'src', 'app', 'app.module.ts'), appModuleContent);

    // Run the refactorer
    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: []
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Verify the shared component was renamed (filename change)
    expect(fs.existsSync(path.join(sharedDir, 'loading-spinner.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sharedDir, 'loading-spinner.component.ts'))).toBe(false);

    // Verify other components were also renamed
    expect(fs.existsSync(path.join(featuresDir, 'user-list.ts'))).toBe(true);
    expect(fs.existsSync(path.join(featuresDir, 'user-profile.ts'))).toBe(true);
    expect(fs.existsSync(path.join(pagesDir, 'dashboard.ts'))).toBe(true);

    // Check that imports were updated in user-list component (2 levels deep)
    const updatedUserListContent = fs.readFileSync(path.join(featuresDir, 'user-list.ts'), 'utf-8');
    expect(updatedUserListContent).toContain("import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner';");
    expect(updatedUserListContent).not.toContain("import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';");

    // Check that imports were updated in user-profile component (2 levels deep)
    const updatedUserProfileContent = fs.readFileSync(path.join(featuresDir, 'user-profile.ts'), 'utf-8');
    expect(updatedUserProfileContent).toContain("import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner';");
    expect(updatedUserProfileContent).not.toContain("import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';");

    // Check that imports were updated in dashboard component (1 level deep)
    const updatedDashboardContent = fs.readFileSync(path.join(pagesDir, 'dashboard.ts'), 'utf-8');
    expect(updatedDashboardContent).toContain("import { LoadingSpinnerComponent } from '../shared/components/loading-spinner';");
    expect(updatedDashboardContent).not.toContain("import { LoadingSpinnerComponent } from '../shared/components/loading-spinner.component';");

    // Check that imports were updated in app module (check what it was renamed to)
    let appModuleFile: string;
    if (fs.existsSync(path.join(tempDir, 'src', 'app', 'app.ts'))) {
      appModuleFile = 'app.ts';
    } else if (fs.existsSync(path.join(tempDir, 'src', 'app', 'app-module.ts'))) {
      appModuleFile = 'app-module.ts';
    } else {
      // Module files might keep their .module.ts extension
      appModuleFile = 'app.module.ts';
    }
    
    const updatedAppModuleContent = fs.readFileSync(path.join(tempDir, 'src', 'app', appModuleFile), 'utf-8');
    expect(updatedAppModuleContent).toContain("import { LoadingSpinnerComponent } from './shared/components/loading-spinner';");
    expect(updatedAppModuleContent).not.toContain("import { LoadingSpinnerComponent } from './shared/components/loading-spinner.component';");

    // Verify that the class name remains the same (LoadingSpinnerComponent)
    // This is important - the class name should NOT change, only the file name
    const updatedSharedComponentContent = fs.readFileSync(path.join(sharedDir, 'loading-spinner.ts'), 'utf-8');
    expect(updatedSharedComponentContent).toContain('export class LoadingSpinnerComponent');

    // Verify no errors occurred
    expect(result.errors).toHaveLength(0);

    // Verify that files were processed
    expect(result.processedFiles.length).toBeGreaterThan(0);
    expect(result.renamedFiles.length).toBeGreaterThan(0);
    expect(result.contentChanges.length).toBeGreaterThan(0);

    // Verify that the shared component rename was captured
    const sharedComponentRename = result.renamedFiles.find(r => 
      r.oldPath.includes('loading-spinner.component.ts')
    );
    expect(sharedComponentRename).toBeDefined();
    expect(sharedComponentRename?.newPath).toContain('loading-spinner.ts');

    console.log('✅ Cross-directory shared component test passed!');
    console.log(`📁 Processed ${result.processedFiles.length} files`);
    console.log(`🔄 Renamed ${result.renamedFiles.length} files`);
    console.log(`📝 Made ${result.contentChanges.length} content changes`);
    console.log(`❌ ${result.errors.length} errors`);
  });

  it('should handle shared service imports across directories with Angular 20 naming', async () => {
    // Create directory structure for services test
    const sharedServicesDir = path.join(tempDir, 'src', 'app', 'shared', 'services');
    const featuresDir = path.join(tempDir, 'src', 'app', 'features', 'products');
    
    fs.mkdirSync(sharedServicesDir, { recursive: true });
    fs.mkdirSync(featuresDir, { recursive: true });

    // Create a shared service with old .service.ts naming
    const dataServiceContent = `
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}
  
  getData() {
    return this.http.get('/api/data');
  }
}
`;

    // Create components that use the service from different directories
    const productListContent = `
import { Component } from '@angular/core';
import { DataService } from '../../shared/services/data.service';

@Component({
  selector: 'app-product-list',
  template: '<div>Products</div>'
})
export class ProductListComponent {
  constructor(private dataService: DataService) {}
}
`;

    const productDetailContent = `
import { Component } from '@angular/core';
import { DataService } from '../../shared/services/data.service';

@Component({
  selector: 'app-product-detail',
  template: '<div>Product Detail</div>'
})
export class ProductDetailComponent {
  constructor(private dataService: DataService) {}
}
`;

    // Write files
    fs.writeFileSync(path.join(sharedServicesDir, 'data.service.ts'), dataServiceContent);
    fs.writeFileSync(path.join(featuresDir, 'product-list.component.ts'), productListContent);
    fs.writeFileSync(path.join(featuresDir, 'product-detail.component.ts'), productDetailContent);

    // Run the refactorer
    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: []
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Verify the service was renamed according to Angular 20 conventions (no .service suffix)
    expect(fs.existsSync(path.join(sharedServicesDir, 'data-api.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sharedServicesDir, 'data.service.ts'))).toBe(false);

    // Check that imports were updated in both product components
    const updatedProductListContent = fs.readFileSync(path.join(featuresDir, 'product-list.ts'), 'utf-8');
    expect(updatedProductListContent).toContain("import { DataService } from '../../shared/services/data-api';");
    expect(updatedProductListContent).not.toContain("import { DataService } from '../../shared/services/data.service';");

    const updatedProductDetailContent = fs.readFileSync(path.join(featuresDir, 'product-detail.ts'), 'utf-8');
    expect(updatedProductDetailContent).toContain("import { DataService } from '../../shared/services/data-api';");
    expect(updatedProductDetailContent).not.toContain("import { DataService } from '../../shared/services/data.service';");

    // Verify class name remains the same
    const updatedServiceContent = fs.readFileSync(path.join(sharedServicesDir, 'data-api.ts'), 'utf-8');
    expect(updatedServiceContent).toContain('export class DataService');

    expect(result.errors).toHaveLength(0);
    
    console.log('✅ Cross-directory shared service test passed!');
  });
});
