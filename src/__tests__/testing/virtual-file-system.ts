/**
 * Virtual File System for Testing
 *
 * Provides an in-memory file system that can be used for testing file operations
 * without touching the actual file system. This prevents side effects and makes
 * tests faster and more reliable.
 */

export interface VirtualFile {
  path: string;
  content: string;
  lastModified?: Date;
}

export interface VirtualDirectory {
  [key: string]: VirtualFile | VirtualDirectory;
}

export class VirtualFileSystem {
  private files: Map<string, VirtualFile> = new Map();
  private pathSeparator: '/' | '\\' = '/';
  private simulateWindows: boolean = false;

  constructor(initialFiles: VirtualFile[] = []) {
    for (const file of initialFiles) {
      this.writeFile(file.path, file.content);
    }
  }

  /**
   * Write a file to the virtual file system
   */
  writeFile(filePath: string, content: string): void {
    const normalizedPath = this.normalizePath(filePath);
    this.files.set(normalizedPath, {
      path: normalizedPath,
      content,
      lastModified: new Date()
    });
  }

  /**
   * Read a file from the virtual file system
   */
  readFile(filePath: string): string {
    const normalizedPath = this.normalizePath(filePath);
    const file = this.files.get(normalizedPath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }
    return file.content;
  }

  /**
   * Check if a file exists in the virtual file system
   */
  exists(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath);
  }

  /**
   * Rename a file in the virtual file system
   */
  renameFile(oldPath: string, newPath: string): void {
    const normalizedOldPath = this.normalizePath(oldPath);
    const normalizedNewPath = this.normalizePath(newPath);

    const file = this.files.get(normalizedOldPath);
    if (!file) {
      throw new Error(`File not found: ${oldPath}`);
    }

    // Create new file with updated path
    const newFile: VirtualFile = {
      ...file,
      path: normalizedNewPath,
      lastModified: new Date()
    };

    this.files.set(normalizedNewPath, newFile);
    this.files.delete(normalizedOldPath);
  }

  /**
   * Get all file paths in the virtual file system
   */
  getAllFiles(): string[] {
    return Array.from(this.files.keys()).sort();
  }

  /**
   * Get all files matching a pattern
   */
  getFilesByPattern(pattern: string): string[] {
    const regex = this.globToRegex(pattern);
    return this.getAllFiles().filter(path => regex.test(path));
  }

  /**
   * Get all files in a directory
   */
  getFilesInDirectory(dirPath: string): string[] {
    const normalizedDir = this.normalizePath(dirPath);
    const prefix = normalizedDir.endsWith('/') ? normalizedDir : normalizedDir + '/';

    return this.getAllFiles().filter(path => path.startsWith(prefix));
  }

  /**
   * Delete a file from the virtual file system
   */
  deleteFile(filePath: string): void {
    const normalizedPath = this.normalizePath(filePath);
    if (!this.files.has(normalizedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    this.files.delete(normalizedPath);
  }

  /**
   * Clear all files from the virtual file system
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Create a snapshot of the current state
   */
  snapshot(): VirtualFile[] {
    return Array.from(this.files.values()).map(file => ({ ...file }));
  }

  /**
   * Restore from a snapshot
   */
  restore(snapshot: VirtualFile[]): void {
    this.clear();
    for (const file of snapshot) {
      this.writeFile(file.path, file.content);
    }
  }

  /**
   * Set the path separator for the virtual file system
   */
  setPathSeparator(separator: '/' | '\\'): void {
    this.pathSeparator = separator;
  }

  /**
   * Enable Windows path simulation
   */
  simulateWindowsPaths(): void {
    this.simulateWindows = true;
    this.pathSeparator = '\\';
  }

  /**
   * Enable Unix path simulation (default)
   */
  simulateUnixPaths(): void {
    this.simulateWindows = false;
    this.pathSeparator = '/';
  }

  /**
   * Get the current path separator
   */
  getPathSeparator(): '/' | '\\' {
    return this.pathSeparator;
  }

  /**
   * Convert a path to use the current path separator
   */
  toSystemPath(path: string): string {
    if (this.simulateWindows) {
      return path.replace(/\//g, '\\');
    }
    return path.replace(/\\/g, '/');
  }

  /**
   * Simulate path.relative behavior with current separator
   */
  getRelativePath(from: string, to: string): string {
    const fromParts = this.normalizePath(from).split('/').slice(0, -1);
    const toParts = this.normalizePath(to).split('/').slice(0, -1);
    const toFileName = to.split(/[/\\]/).pop()?.replace(/\.ts$/, '') || '';

    // Find common prefix
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    // Calculate relative path
    const upLevels = fromParts.length - commonLength;
    const downPath = toParts.slice(commonLength);

    const relativeParts = Array(upLevels).fill('..').concat(downPath);

    let relativePath: string;
    if (relativeParts.length === 0) {
      relativePath = `.${this.pathSeparator}${toFileName}`;
    } else {
      relativePath = `${relativeParts.join(this.pathSeparator)}${this.pathSeparator}${toFileName}`;
    }

    // Convert to system path if simulating Windows
    return this.simulateWindows ? relativePath.replace(/\//g, '\\') : relativePath.replace(/\\/g, '/');
  }

  private normalizePath(path: string): string {
    // Always normalize to forward slashes internally for consistency
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  private globToRegex(pattern: string): RegExp {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    return new RegExp(`^${regexPattern}$`);
  }
}

/**
 * Factory function to create common test scenarios
 */
export class VirtualFileSystemFactory {
  /**
   * Create a typical Angular project structure
   */
  static createAngularProject(): VirtualFileSystem {
    const files: VirtualFile[] = [
      {
        path: 'src/app/components/user-profile.component.ts',
        content: `import { Component } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {
  constructor(private userService: UserService) {}
}`
      },
      {
        path: 'src/app/components/user-profile.component.spec.ts',
        content: `import { TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  it('should create', () => {
    expect(true).toBe(true);
  });
});`
      },
      {
        path: 'src/app/services/user.service.ts',
        content: `import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUser() {
    return { id: 1, name: 'John' };
  }
}`
      }
    ];

    return new VirtualFileSystem(files);
  }

  /**
   * Create a snackbar component structure
   */
  static createSnackbarProject(): VirtualFileSystem {
    const files: VirtualFile[] = [
      {
        path: 'src/snackbar/snackbar.component.ts',
        content: `import { Component } from '@angular/core';
import { SnackBarType } from './snackbartype';
import { SnackBar } from './snackbar';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html'
})
export class SnackbarComponent {}`
      },
      {
        path: 'src/snackbar/snackbar.service.ts',
        content: `import { Injectable } from '@angular/core';
import { SnackbarComponent } from './snackbar.component';
import { SnackBarType } from './snackbartype';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {}`
      },
      {
        path: 'src/snackbar/snackbar.ts',
        content: `import { SnackBarType } from './snackbartype';

export class SnackBar {
  constructor(public message: string, public type: SnackBarType) {}
}`
      },
      {
        path: 'src/snackbar/snackbartype.ts',
        content: `export enum SnackBarType {
  Info = 0,
  Error = 1
}`
      }
    ];

    return new VirtualFileSystem(files);
  }
}
