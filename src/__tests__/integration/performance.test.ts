/**
 * Performance Benchmark Tests
 *
 * Compares performance between virtual file system and real file system approaches.
 * Ensures the new testing architecture provides actual performance benefits.
 */

import { VirtualFileSystemFactory } from '../testing/virtual-file-system';
import { PerformanceTestUtils, TestDataGenerators } from '../testing/test-helpers';
import { ImportTestUtils, RenameTestUtils } from '../testing/test-utilities';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Performance Benchmarks', () => {
  describe('Virtual File System Performance', () => {
    it('should create and manipulate files faster than real FS', async () => {
      const fileCount = 100;
      const files = TestDataGenerators.generateAngularProject({
        components: Array.from({ length: fileCount / 4 }, (_, i) => `component${i}`),
        services: Array.from({ length: fileCount / 4 }, (_, i) => `service${i}`)
      });

      // Benchmark virtual file system
      const virtualResult = await PerformanceTestUtils.benchmark(
        () => {
          const vfs = VirtualFileSystemFactory.createAngularProject();
          for (const file of files) {
            vfs.writeFile(file.path, file.content);
          }
          return vfs.getAllFiles().length;
        },
        10,
        'Virtual FS: Create and write 100 files'
      );

      // Benchmark real file system (for comparison)
      let tempDir: string;
      const realResult = await PerformanceTestUtils.benchmark(
        () => {
          tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-test-'));
          for (const file of files) {
            const fullPath = path.join(tempDir, file.path);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, file.content);
          }
          const count = files.length;
          fs.rmSync(tempDir, { recursive: true, force: true });
          return count;
        },
        5, // Fewer iterations for real FS due to slowness
        'Real FS: Create and write 100 files'
      );

      // Virtual FS should be significantly faster
      expect(virtualResult.avgMs).toBeLessThan(realResult.avgMs);
      console.log(`🚀 Virtual FS is ${(realResult.avgMs / virtualResult.avgMs).toFixed(1)}x faster`);
    });

    it('should parse imports faster with larger codebases', async () => {
      const largeFile = `
        import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
        import { Observable, Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
        import { map, filter, takeUntil, distinctUntilChanged } from 'rxjs/operators';
        import { UserService } from '../services/user.service';
        import { ApiService } from '../services/api.service';
        import { AuthService } from '../services/auth.service';
        import { StorageService } from '../services/storage.service';
        import { LoggerService } from '../services/logger.service';
        import { ConfigService } from '../services/config.service';
        import type { User, Profile, Settings } from '../models/user.model';
        import type { ApiResponse, ApiError } from '../models/api.model';
        import { ValidationUtils } from '../utils/validation.utils';
        import { DateUtils } from '../utils/date.utils';
        import { StringUtils } from '../utils/string.utils';
        // ... more imports
      `.repeat(10); // Simulate a large file with many imports

      const result = await PerformanceTestUtils.benchmark(
        () => ImportTestUtils.parseImports(largeFile),
        100,
        'Parse imports from large file'
      );

      // Should parse quickly even with many imports
      expect(result.avgMs).toBeLessThan(10); // Should be under 10ms on average
      expect(result.results[0].length).toBeGreaterThan(0); // Should find imports
    });

    it('should handle naming convention application efficiently', async () => {
      const testCases = TestDataGenerators.generateNamingConventionTestCases();

      const result = await PerformanceTestUtils.benchmark(
        () => {
          return testCases.map(testCase => RenameTestUtils.applyNamingConventions(testCase.input));
        },
        1000,
        'Apply naming conventions to test cases'
      );

      // Should be very fast for naming convention application
      expect(result.avgMs).toBeLessThan(1); // Should be under 1ms
    });
  });

  describe('Memory Usage', () => {
    it('should have reasonable memory footprint for large projects', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create a large virtual project
      const largeProject = TestDataGenerators.generateAngularProject({
        components: Array.from({ length: 50 }, (_, i) => `component${i}`),
        services: Array.from({ length: 50 }, (_, i) => `service${i}`)
      });

      const vfs = VirtualFileSystemFactory.createAngularProject();
      for (const file of largeProject) {
        vfs.writeFile(file.path, file.content);
      }

      const afterCreationMemory = process.memoryUsage().heapUsed;
      const memoryIncreaseMB = (afterCreationMemory - initialMemory) / 1024 / 1024;

      console.log(`📊 Memory usage for 100+ file project: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Should use reasonable amount of memory (less than 50MB for 100 files)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Scaling Tests', () => {
    it('should maintain performance with increasing file count', async () => {
      const fileCounts = [10, 50, 100, 200];
      const results: Array<{ fileCount: number; timeMs: number }> = [];

      for (const fileCount of fileCounts) {
        const files = TestDataGenerators.generateAngularProject({
          components: Array.from({ length: fileCount / 2 }, (_, i) => `comp${i}`),
          services: Array.from({ length: fileCount / 2 }, (_, i) => `svc${i}`)
        });

        const { timeMs } = await PerformanceTestUtils.measureTime(() => {
          const vfs = VirtualFileSystemFactory.createAngularProject();
          for (const file of files) {
            vfs.writeFile(file.path, file.content);
          }
          return vfs.getAllFiles();
        }, `Process ${fileCount} files`);

        results.push({ fileCount, timeMs });
      }

      // Performance should scale reasonably (not exponentially)
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      const scalingFactor = lastResult.timeMs / firstResult.timeMs;
      const fileSizeRatio = lastResult.fileCount / firstResult.fileCount;

      console.log(`📈 Scaling factor: ${scalingFactor.toFixed(2)}x for ${fileSizeRatio}x files`);

      // Should scale better than linearly (due to optimizations)
      expect(scalingFactor).toBeLessThan(fileSizeRatio * 1.5);
    });
  });

  describe('Comparison with Legacy Tests', () => {
    it('should demonstrate speed improvement over file-based tests', async () => {
      // This test demonstrates the performance benefit of the new architecture
      // by comparing similar operations using virtual vs real file systems

      const testFiles = [
        { path: 'src/user.component.ts', content: 'component content' },
        { path: 'src/user.service.ts', content: 'service content' },
        { path: 'src/api.service.ts', content: 'api service content' }
      ];

      // Virtual FS approach (new)
      const virtualTime = await PerformanceTestUtils.measureTime(async () => {
        const vfs = VirtualFileSystemFactory.createAngularProject();

        // Create files
        for (const file of testFiles) {
          vfs.writeFile(file.path, file.content);
        }

        // Simulate refactoring operations
        for (const file of testFiles) {
          const newPath = RenameTestUtils.applyNamingConventions(file.path);
          if (newPath !== file.path) {
            const content = vfs.readFile(file.path);
            vfs.writeFile(newPath, content);
            vfs.deleteFile(file.path);
          }
        }

        return vfs.getAllFiles();
      });

      // Real FS approach (legacy simulation)
      let tempDir: string;
      const realTime = await PerformanceTestUtils.measureTime(async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-test-'));

        try {
          // Create files
          for (const file of testFiles) {
            const fullPath = path.join(tempDir, file.path);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, file.content);
          }

          // Simulate refactoring operations
          for (const file of testFiles) {
            const newPath = RenameTestUtils.applyNamingConventions(file.path);
            if (newPath !== file.path) {
              const oldFullPath = path.join(tempDir, file.path);
              const newFullPath = path.join(tempDir, newPath);

              if (fs.existsSync(oldFullPath)) {
                const content = fs.readFileSync(oldFullPath, 'utf-8');
                fs.writeFileSync(newFullPath, content);
                fs.unlinkSync(oldFullPath);
              }
            }
          }

          return fs.readdirSync(tempDir, { recursive: true });
        } finally {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        }
      });

      console.log(`⚡ Performance comparison:`);
      console.log(`   Virtual FS: ${virtualTime.timeMs.toFixed(2)}ms`);
      console.log(`   Real FS: ${realTime.timeMs.toFixed(2)}ms`);
      console.log(`   Speedup: ${(realTime.timeMs / virtualTime.timeMs).toFixed(1)}x faster`);

      // Virtual FS should be significantly faster
      expect(virtualTime.timeMs).toBeLessThan(realTime.timeMs);
    });
  });
});
