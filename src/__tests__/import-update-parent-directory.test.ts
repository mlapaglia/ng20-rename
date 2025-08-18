import { AngularRefactorer } from '../refactorer';
import { RefactorOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Import Statement Update Tests - Parent Directory Scanning', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-parent-import-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should update import statements in parent directories when files are renamed', async () => {
    // Create a directory structure that mimics a real Angular app:
    // src/
    //   main.ts (imports from ./app/app.component)
    //   app/
    //     app.component.ts

    const srcDir = path.join(tempDir, 'src');
    const appDir = path.join(srcDir, 'app');

    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(appDir, { recursive: true });

    // Create main.ts in src directory that imports from app directory
    const mainContent = `
      import { bootstrapApplication } from '@angular/platform-browser';
      import { AppComponent } from './app/app.component';

      bootstrapApplication(AppComponent).catch(err => console.error(err));
    `;

    // Create app.component.ts in app directory
    const appComponentContent = `
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-root',
        standalone: true,
        template: '<h1>Hello World</h1>'
      })
      export class AppComponent {
        title = 'my-app';
      }
    `;

    fs.writeFileSync(path.join(srcDir, 'main.ts'), mainContent);
    fs.writeFileSync(path.join(appDir, 'app.component.ts'), appComponentContent);

    const options: RefactorOptions = {
      rootDir: appDir, // Start refactoring from the app directory
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // The app.component.ts should be renamed to app.ts
    expect(fs.existsSync(path.join(appDir, 'app.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'app.component.ts'))).toBe(false);

    // Verify the rename occurred
    expect(result.renamedFiles).toHaveLength(1);
    const appRename = result.renamedFiles.find(r => r.oldPath.includes('app.component.ts'));
    expect(appRename).toBeDefined();
    expect(appRename?.newPath).toContain('app.ts');

    // THIS IS THE CRITICAL TEST: The main.ts file in the parent directory should have its import updated
    const updatedMainContent = fs.readFileSync(path.join(srcDir, 'main.ts'), 'utf-8');
    expect(updatedMainContent).toContain("import { AppComponent } from './app/app';");
    expect(updatedMainContent).not.toContain("import { AppComponent } from './app/app.component';");

    // Verify that content changes were reported for main.ts
    const mainContentChanges = result.contentChanges.filter(c => c.filePath.includes('main.ts'));
    expect(mainContentChanges.length).toBeGreaterThan(0);
  });

  it('should update import statements multiple levels up from the refactoring root', async () => {
    // Create a deeper directory structure:
    // src/
    //   main.ts (imports from ./app/components/header.component)
    //   app/
    //     app.component.ts (imports from ./components/header.component)
    //     components/
    //       header.component.ts

    const srcDir = path.join(tempDir, 'src');
    const appDir = path.join(srcDir, 'app');
    const componentsDir = path.join(appDir, 'components');

    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(componentsDir, { recursive: true });

    // Create main.ts that imports from deep nested directory
    const mainContent = `
      import { bootstrapApplication } from '@angular/platform-browser';
      import { HeaderComponent } from './app/components/header.component';

      console.log('Using header:', HeaderComponent);
    `;

    // Create app.component.ts that also imports from components directory
    const appComponentContent = `
      import { Component } from '@angular/core';
      import { HeaderComponent } from './components/header.component';

      @Component({
        selector: 'app-root',
        standalone: true,
        imports: [HeaderComponent],
        template: '<app-header></app-header>'
      })
      export class AppComponent {}
    `;

    // Create header.component.ts
    const headerComponentContent = `
      import { Component } from '@angular/core';

      @Component({
        selector: 'app-header',
        standalone: true,
        template: '<header>My Header</header>'
      })
      export class HeaderComponent {}
    `;

    fs.writeFileSync(path.join(srcDir, 'main.ts'), mainContent);
    fs.writeFileSync(path.join(appDir, 'app.component.ts'), appComponentContent);
    fs.writeFileSync(path.join(componentsDir, 'header.component.ts'), headerComponentContent);

    const options: RefactorOptions = {
      rootDir: componentsDir, // Start refactoring from the components directory
      dryRun: false,
      include: ['**/*.ts'],
      exclude: [],
      smartServices: false
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // The header.component.ts should be renamed to header.ts
    expect(fs.existsSync(path.join(componentsDir, 'header.ts'))).toBe(true);
    expect(fs.existsSync(path.join(componentsDir, 'header.component.ts'))).toBe(false);

    // Verify the rename occurred
    expect(result.renamedFiles).toHaveLength(1);
    const headerRename = result.renamedFiles.find(r => r.oldPath.includes('header.component.ts'));
    expect(headerRename).toBeDefined();
    expect(headerRename?.newPath).toContain('header.ts');

    // Check that main.ts (2 levels up) has its import updated
    const updatedMainContent = fs.readFileSync(path.join(srcDir, 'main.ts'), 'utf-8');
    expect(updatedMainContent).toContain("import { HeaderComponent } from './app/components/header';");
    expect(updatedMainContent).not.toContain("import { HeaderComponent } from './app/components/header.component';");

    // Check that app.component.ts (1 level up) has its import updated
    const updatedAppContent = fs.readFileSync(path.join(appDir, 'app.component.ts'), 'utf-8');
    expect(updatedAppContent).toContain("import { HeaderComponent } from './components/header';");
    expect(updatedAppContent).not.toContain("import { HeaderComponent } from './components/header.component';");

    // Verify that content changes were reported for both files
    const mainContentChanges = result.contentChanges.filter(c => c.filePath.includes('main.ts'));
    const appContentChanges = result.contentChanges.filter(c => c.filePath.includes('app.component.ts'));

    expect(mainContentChanges.length).toBeGreaterThan(0);
    expect(appContentChanges.length).toBeGreaterThan(0);
  });
});
