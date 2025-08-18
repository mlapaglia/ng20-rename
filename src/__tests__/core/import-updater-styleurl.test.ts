import { ImportUpdater } from '../../core/import-updater';
import { RefactorResult, RenamedFile } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ImportUpdater - styleUrl vs styleUrls', () => {
  let tempDir: string;
  let importUpdater: ImportUpdater;
  let result: RefactorResult;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-styleurl-test-'));
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

  it('should update styleUrls (plural) array when CSS files are renamed', async () => {
    const componentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css', './shared.css']
})
export class TestComponent {}`;

    const cssContent = `.test { color: red; }`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'test.component.css'), cssContent);
    fs.writeFileSync(path.join(tempDir, 'shared.css'), `.shared { margin: 10px; }`);

    // Simulate CSS file rename
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'test.component.css'),
        newPath: path.join(tempDir, 'test.css')
      },
      {
        oldPath: path.join(tempDir, 'shared.css'),
        newPath: path.join(tempDir, 'common.css')
      }
    ];

    // Create renamed files
    fs.writeFileSync(path.join(tempDir, 'test.css'), cssContent);
    fs.writeFileSync(path.join(tempDir, 'common.css'), `.shared { margin: 10px; }`);
    fs.unlinkSync(path.join(tempDir, 'test.component.css'));
    fs.unlinkSync(path.join(tempDir, 'shared.css'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that styleUrls were updated
    const updatedContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    
    // This test should pass (styleUrls plural works)
    expect(updatedContent).toContain("styleUrls: ['./test.css', './common.css']");
    expect(updatedContent).not.toContain("styleUrls: ['./test.component.css', './shared.css']");
  });

  it('should update styleUrl (singular) when CSS file is renamed', async () => {
    const componentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {}`;

    const cssContent = `.test { color: red; }`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'test.component.css'), cssContent);

    // Simulate CSS file rename
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'test.component.css'),
        newPath: path.join(tempDir, 'test.css')
      }
    ];

    // Create renamed files
    fs.writeFileSync(path.join(tempDir, 'test.css'), cssContent);
    fs.unlinkSync(path.join(tempDir, 'test.component.css'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that styleUrl was updated
    const updatedContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    
    // This test should now pass with the fixed styleUrl handling
    expect(updatedContent).toContain("styleUrl: './test.css'");
    expect(updatedContent).not.toContain("styleUrl: './test.component.css'");
  });

  it('should update both templateUrl and styleUrl when files are renamed', async () => {
    const componentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent {}`;

    const htmlContent = `<div>Test</div>`;
    const scssContent = `.test { color: blue; }`;

    // Write original files
    fs.writeFileSync(path.join(tempDir, 'test.component.ts'), componentContent);
    fs.writeFileSync(path.join(tempDir, 'test.component.html'), htmlContent);
    fs.writeFileSync(path.join(tempDir, 'test.component.scss'), scssContent);

    // Simulate file renames
    const renamedFiles: RenamedFile[] = [
      {
        oldPath: path.join(tempDir, 'test.component.html'),
        newPath: path.join(tempDir, 'test.html')
      },
      {
        oldPath: path.join(tempDir, 'test.component.scss'),
        newPath: path.join(tempDir, 'test.scss')
      }
    ];

    // Create renamed files
    fs.writeFileSync(path.join(tempDir, 'test.html'), htmlContent);
    fs.writeFileSync(path.join(tempDir, 'test.scss'), scssContent);
    fs.unlinkSync(path.join(tempDir, 'test.component.html'));
    fs.unlinkSync(path.join(tempDir, 'test.component.scss'));

    // Update imports
    await importUpdater.updateImports(tempDir, renamedFiles, result);

    // Check that both templateUrl and styleUrl were updated
    const updatedContent = fs.readFileSync(path.join(tempDir, 'test.component.ts'), 'utf-8');
    
    expect(updatedContent).toContain("templateUrl: './test.html'");
    expect(updatedContent).toContain("styleUrl: './test.scss'");
    expect(updatedContent).not.toContain("templateUrl: './test.component.html'");
    expect(updatedContent).not.toContain("styleUrl: './test.component.scss'");
  });
});
