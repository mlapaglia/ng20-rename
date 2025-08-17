/**
 * Additional Test Helper Utilities
 * 
 * Provides commonly used test patterns and utilities to reduce duplication
 * and improve test maintainability.
 */

import { VirtualFileSystem, VirtualFile } from './virtual-file-system';
import { ImportTestUtils, RenameTestUtils } from './test-utilities';

/**
 * Common test patterns and expectations
 */
export class TestPatterns {
  /**
   * Verify that a file was renamed correctly
   */
  static expectFileRenamed(vfs: VirtualFileSystem, oldPath: string, newPath: string): void {
    expect(vfs.exists(newPath)).toBe(true);
    expect(vfs.exists(oldPath)).toBe(false);
  }

  /**
   * Verify that imports were updated correctly
   */
  static expectImportUpdated(vfs: VirtualFileSystem, filePath: string, oldImport: string, newImport: string): void {
    const content = vfs.readFile(filePath);
    expect(content).toContain(newImport);
    expect(content).not.toContain(oldImport);
  }

  /**
   * Verify no broken imports exist in the virtual file system
   */
  static expectNoBrokenImports(vfs: VirtualFileSystem): void {
    const allFiles = vfs.getAllFiles();
    const brokenImports: string[] = [];
    
    for (const filePath of allFiles) {
      if (filePath.endsWith('.ts')) {
        const content = vfs.readFile(filePath);
        const fileBrokenImports = ImportTestUtils.validateImports(filePath, content, vfs);
        brokenImports.push(...fileBrokenImports);
      }
    }
    
    if (brokenImports.length > 0) {
      console.warn('Broken imports detected:', brokenImports);
    }
    
    expect(brokenImports).toHaveLength(0);
  }

  /**
   * Verify that Angular naming conventions were applied
   */
  static expectNamingConventionsApplied(originalPath: string, expectedPath: string): void {
    const result = RenameTestUtils.applyNamingConventions(originalPath);
    expect(result).toBe(expectedPath);
  }

  /**
   * Create a basic Angular component structure
   */
  static createAngularComponent(name: string, includeSpec: boolean = true, includeTemplate: boolean = true): VirtualFile[] {
    const files: VirtualFile[] = [
      {
        path: `src/app/${name}.component.ts`,
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-${name}',
  templateUrl: './${name}.component.html',
  styleUrls: ['./${name}.component.css']
})
export class ${this.capitalize(name)}Component {
  title = '${name}';
}`
      }
    ];

    if (includeSpec) {
      files.push({
        path: `src/app/${name}.component.spec.ts`,
        content: `import { TestBed } from '@angular/core/testing';
import { ${this.capitalize(name)}Component } from './${name}.component';

describe('${this.capitalize(name)}Component', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(${this.capitalize(name)}Component);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});`
      });
    }

    if (includeTemplate) {
      files.push({
        path: `src/app/${name}.component.html`,
        content: `<div class="${name}-component">
  <h1>{{title}}</h1>
</div>`
      });
    }

    return files;
  }

  /**
   * Create a basic Angular service structure
   */
  static createAngularService(name: string, includeSpec: boolean = true): VirtualFile[] {
    const files: VirtualFile[] = [
      {
        path: `src/app/${name}.service.ts`,
        content: `import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ${this.capitalize(name)}Service {
  constructor() { }

  get${this.capitalize(name)}() {
    return { id: 1, name: '${name}' };
  }
}`
      }
    ];

    if (includeSpec) {
      files.push({
        path: `src/app/${name}.service.spec.ts`,
        content: `import { TestBed } from '@angular/core/testing';
import { ${this.capitalize(name)}Service } from './${name}.service';

describe('${this.capitalize(name)}Service', () => {
  let service: ${this.capitalize(name)}Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(${this.capitalize(name)}Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});`
      });
    }

    return files;
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => Promise<T> | T, description?: string): Promise<{ result: T; timeMs: number }> {
    const start = performance.now();
    const result = await fn();
    const timeMs = performance.now() - start;
    

    
    return { result, timeMs };
  }

  /**
   * Benchmark a function multiple times and get statistics
   */
  static async benchmark<T>(
    fn: () => Promise<T> | T, 
    iterations: number = 10,
    description?: string
  ): Promise<{ avgMs: number; minMs: number; maxMs: number; results: T[] }> {
    const times: number[] = [];
    const results: T[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, timeMs } = await this.measureTime(fn);
      times.push(timeMs);
      results.push(result);
    }

    const avgMs = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times);



    return { avgMs, minMs, maxMs, results };
  }

  /**
   * Assert that an operation completes within a time limit
   */
  static async expectTimeLessThan<T>(
    fn: () => Promise<T> | T, 
    maxTimeMs: number, 
    description?: string
  ): Promise<T> {
    const { result, timeMs } = await this.measureTime(fn, description);
    expect(timeMs).toBeLessThan(maxTimeMs);
    return result;
  }
}

/**
 * Test data generators for consistent test scenarios
 */
export class TestDataGenerators {
  /**
   * Generate a realistic Angular project structure
   */
  static generateAngularProject(options: {
    components?: string[];
    services?: string[];
    includeSpecs?: boolean;
    includeTemplates?: boolean;
  } = {}): VirtualFile[] {
    const {
      components = ['user', 'product', 'dashboard'],
      services = ['api', 'auth', 'storage'],
      includeSpecs = true,
      includeTemplates = true
    } = options;

    const files: VirtualFile[] = [];

    // Generate components
    for (const component of components) {
      files.push(...TestPatterns.createAngularComponent(component, includeSpecs, includeTemplates));
    }

    // Generate services
    for (const service of services) {
      files.push(...TestPatterns.createAngularService(service, includeSpecs));
    }

    // Add app module
    files.push({
      path: 'src/app/app.module.ts',
      content: `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
${components.map(c => `import { ${TestPatterns['capitalize'](c)}Component } from './${c}.component';`).join('\n')}

@NgModule({
  declarations: [
${components.map(c => `    ${TestPatterns['capitalize'](c)}Component,`).join('\n')}
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: []
})
export class AppModule { }`
    });

    return files;
  }

  /**
   * Generate test cases for naming convention edge cases
   */
  static generateNamingConventionTestCases(): Array<{ input: string; expected: string; description: string }> {
    return [
      // Basic cases
      { input: 'user.component.ts', expected: 'user.ts', description: 'Basic component' },
      { input: 'api.service.ts', expected: 'api.ts', description: 'Basic service' },
      
      // Spec files
      { input: 'user.component.spec.ts', expected: 'user.spec.ts', description: 'Component spec' },
      { input: 'api.service.spec.ts', expected: 'api.spec.ts', description: 'Service spec' },
      
      // Complex names
      { input: 'user-profile.component.ts', expected: 'user-profile.ts', description: 'Hyphenated component' },
      { input: 'data-access.service.ts', expected: 'data-access.ts', description: 'Hyphenated service' },
      
      // Nested paths
      { input: 'src/app/user.component.ts', expected: 'src/app/user.ts', description: 'Nested component' },
      { input: 'libs/shared/api.service.ts', expected: 'libs/shared/api.ts', description: 'Nested service' },
      
      // Files that shouldn't change
      { input: 'user.model.ts', expected: 'user.model.ts', description: 'Model file (no change)' },
      { input: 'app.config.ts', expected: 'app.config.ts', description: 'Config file (no change)' },
      { input: 'auth.guard.ts', expected: 'auth.guard.ts', description: 'Guard file (no change)' },
    ];
  }
}

/**
 * Mock utilities for testing external dependencies
 */
export class MockUtils {
  /**
   * Create a mock file system implementation
   */
  static createMockFileSystem(files: Record<string, string> = {}): any {
    return {
      existsSync: jest.fn((path: string) => path in files),
      readFileSync: jest.fn((path: string) => files[path] || ''),
      writeFileSync: jest.fn((path: string, content: string) => {
        files[path] = content;
      }),
      mkdirSync: jest.fn(),
      rmSync: jest.fn(),
      readdirSync: jest.fn(() => Object.keys(files))
    };
  }

  /**
   * Create a mock logger for testing
   */
  static createMockLogger(): any {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }
}
