import { VirtualFileSystem } from './virtual-file-system';

describe('VirtualFileSystem - Coverage Tests', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  describe('Windows path handling', () => {
    it('should handle Windows paths when simulating Windows', () => {
      vfs.simulateWindows();
      
      expect(vfs.getPathSeparator()).toBe('\\');
      
      // Test path normalization for Windows
      const normalizedPath = vfs.normalizePath('/test/path');
      expect(normalizedPath).toBe('\\test\\path');
    });

    it('should handle Unix paths when not simulating Windows', () => {
      expect(vfs.getPathSeparator()).toBe('/');
      
      const normalizedPath = vfs.normalizePath('\\test\\path');
      expect(normalizedPath).toBe('/test/path');
    });
  });

  describe('File operations edge cases', () => {
    it('should handle writeFile with directory creation', () => {
      vfs.writeFile('/deep/nested/dir/file.txt', 'content');
      expect(vfs.readFile('/deep/nested/dir/file.txt')).toBe('content');
      expect(vfs.exists('/deep/nested/dir')).toBe(true);
    });

    it('should handle deleteFile on non-existent files', () => {
      expect(() => vfs.deleteFile('/nonexistent.txt')).not.toThrow();
    });

    it('should handle readFile on non-existent files', () => {
      expect(() => vfs.readFile('/nonexistent.txt')).toThrow('ENOENT: no such file or directory');
    });

    it('should handle getAllTsFiles recursively', () => {
      vfs.writeFile('/src/app.ts', 'export class App {}');
      vfs.writeFile('/src/components/header.ts', 'export class Header {}');
      vfs.writeFile('/src/components/footer.ts', 'export class Footer {}');
      vfs.writeFile('/src/styles.css', '.app { }'); // Non-TS file
      vfs.writeFile('/node_modules/lib.ts', 'export class Lib {}'); // Should be ignored
      
      const tsFiles = vfs.getAllTsFiles('/src');
      
      expect(tsFiles).toContain('/src/app.ts');
      expect(tsFiles).toContain('/src/components/header.ts');
      expect(tsFiles).toContain('/src/components/footer.ts');
      expect(tsFiles).not.toContain('/src/styles.css');
      expect(tsFiles).not.toContain('/node_modules/lib.ts');
    });
  });

  describe('Path utilities', () => {
    it('should handle glob pattern conversion', () => {
      // Test the glob pattern matching logic
      vfs.writeFile('/test/file1.ts', 'content1');
      vfs.writeFile('/test/file2.js', 'content2');
      vfs.writeFile('/other/file3.ts', 'content3');
      
      // This tests the internal glob pattern matching
      const allFiles = vfs.getAllTsFiles('/');
      expect(allFiles.length).toBeGreaterThan(0);
    });

    it('should handle relative path calculations', () => {
      vfs.writeFile('/src/app/app.ts', 'content');
      vfs.writeFile('/src/shared/shared.ts', 'content');
      
      // Test that files are created at correct paths
      expect(vfs.exists('/src/app/app.ts')).toBe(true);
      expect(vfs.exists('/src/shared/shared.ts')).toBe(true);
    });
  });

  describe('Directory operations', () => {
    it('should handle nested directory creation', () => {
      vfs.writeFile('/very/deep/nested/structure/file.ts', 'content');
      
      expect(vfs.exists('/very')).toBe(true);
      expect(vfs.exists('/very/deep')).toBe(true);
      expect(vfs.exists('/very/deep/nested')).toBe(true);
      expect(vfs.exists('/very/deep/nested/structure')).toBe(true);
      expect(vfs.readFile('/very/deep/nested/structure/file.ts')).toBe('content');
    });

    it('should handle directory traversal in getAllTsFiles', () => {
      // Create a structure that tests directory skipping
      vfs.writeFile('/src/app.ts', 'app');
      vfs.writeFile('/src/.git/config', 'git config'); // Should be skipped
      vfs.writeFile('/src/node_modules/lib.ts', 'lib'); // Should be skipped
      vfs.writeFile('/src/dist/output.ts', 'output'); // Should be skipped
      
      const tsFiles = vfs.getAllTsFiles('/src');
      
      expect(tsFiles).toContain('/src/app.ts');
      expect(tsFiles).not.toContain('/src/.git/config');
      expect(tsFiles).not.toContain('/src/node_modules/lib.ts');
      expect(tsFiles).not.toContain('/src/dist/output.ts');
    });
  });

  describe('File system state', () => {
    it('should maintain file system state across operations', () => {
      // Create some files
      vfs.writeFile('/file1.ts', 'content1');
      vfs.writeFile('/file2.ts', 'content2');
      
      // Verify they exist
      expect(vfs.exists('/file1.ts')).toBe(true);
      expect(vfs.exists('/file2.ts')).toBe(true);
      
      // Delete one
      vfs.deleteFile('/file1.ts');
      
      // Verify state
      expect(vfs.exists('/file1.ts')).toBe(false);
      expect(vfs.exists('/file2.ts')).toBe(true);
      
      // Overwrite the other
      vfs.writeFile('/file2.ts', 'new content');
      expect(vfs.readFile('/file2.ts')).toBe('new content');
    });
  });
});
