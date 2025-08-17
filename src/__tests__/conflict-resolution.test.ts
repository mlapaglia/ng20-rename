import { AngularRefactorer } from '../refactorer';
import { RefactorOptions, RenamedFile } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Conflict Resolution Integration Tests', () => {
  let tempDir: string;
  let fixturesDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ng20-rename-test-'));
    fixturesDir = path.join(__dirname, 'fixtures');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should resolve conflict by renaming user.ts to user-model.ts', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'user.ts'), path.join(tempDir, 'user.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'user.component.ts'), path.join(tempDir, 'user.component.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that user.component.ts was renamed to user.ts
    expect(fs.existsSync(path.join(tempDir, 'user.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user.component.ts'))).toBe(false);

    // Check that the original user.ts was renamed to user-model.ts
    expect(fs.existsSync(path.join(tempDir, 'user-model.ts'))).toBe(true);

    // Check the result
    expect(result.renamedFiles).toHaveLength(2);
    const componentRename = result.renamedFiles.find((r: RenamedFile) => r.oldPath.includes('user.component.ts'));
    const conflictRename = result.renamedFiles.find(
      (r: RenamedFile) => r.oldPath.includes('user.ts') && r.newPath.includes('user-model.ts')
    );

    expect(componentRename).toBeDefined();
    expect(conflictRename).toBeDefined();
    expect(conflictRename?.oldPath).toContain('user.ts');
    expect(conflictRename?.newPath).toContain('user-model.ts');
  });

  it('should resolve conflict by renaming auth.ts to auth-config.ts', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'auth.ts'), path.join(tempDir, 'auth.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'auth.service.ts'), path.join(tempDir, 'auth.service.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that auth.service.ts was renamed to auth.ts
    expect(fs.existsSync(path.join(tempDir, 'auth.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'auth.service.ts'))).toBe(false);

    // Check that the original auth.ts was renamed to auth-config.ts
    expect(fs.existsSync(path.join(tempDir, 'auth-config.ts'))).toBe(true);

    // Check the result
    expect(result.renamedFiles).toHaveLength(2);
    const serviceRename = result.renamedFiles.find(
      (r: RenamedFile) => r.oldPath.includes('auth.service.ts') && r.newPath.includes('auth.ts')
    );
    const conflictRename = result.renamedFiles.find(
      (r: RenamedFile) => r.oldPath.includes('auth.ts') && r.newPath.includes('auth-config.ts')
    );

    expect(serviceRename).toBeDefined();
    expect(conflictRename).toBeDefined();
    expect(conflictRename?.oldPath).toContain('auth.ts');
    expect(conflictRename?.newPath).toContain('auth-config.ts');
  });

  it('should handle smart service detection without conflicts', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'payment.ts'), path.join(tempDir, 'payment.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'payment.service.ts'), path.join(tempDir, 'payment.service.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that payment.service.ts was renamed to payment-api.ts (smart service detection)
    expect(fs.existsSync(path.join(tempDir, 'payment-api.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'payment.service.ts'))).toBe(false);

    // Check that the original payment.ts was NOT renamed (no conflict with payment-api.ts)
    expect(fs.existsSync(path.join(tempDir, 'payment.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'payment-utils.ts'))).toBe(false);

    // Check the result - only 1 rename should happen (service)
    expect(result.renamedFiles).toHaveLength(1);
    const serviceRename = result.renamedFiles.find((r: RenamedFile) => r.oldPath.includes('payment.service.ts'));

    expect(serviceRename).toBeDefined();
    expect(serviceRename?.newPath).toContain('payment-api.ts');
    expect(result.manualReviewRequired).toHaveLength(0);
  });

  it('should handle cache service detection without conflicts', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'data.ts'), path.join(tempDir, 'data.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'data.service.ts'), path.join(tempDir, 'data.service.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that data.service.ts was renamed to data-cache.ts (smart service detection)
    expect(fs.existsSync(path.join(tempDir, 'data-cache.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'data.service.ts'))).toBe(false);

    // Check that the original data.ts was NOT renamed (no conflict with data-cache.ts)
    expect(fs.existsSync(path.join(tempDir, 'data.ts'))).toBe(true);

    // Check the result - only 1 rename should happen (service)
    expect(result.renamedFiles).toHaveLength(1);
    const serviceRename = result.renamedFiles.find((r: RenamedFile) => r.oldPath.includes('data.service.ts'));

    expect(serviceRename).toBeDefined();
    expect(serviceRename?.newPath).toContain('data-cache.ts');
    expect(result.manualReviewRequired).toHaveLength(0);
  });

  it('should handle smart service detection without conflicts (product case)', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'product.ts'), path.join(tempDir, 'product.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'product.service.ts'), path.join(tempDir, 'product.service.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: false,
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that product.service.ts was renamed to product-api.ts (smart service detection)
    expect(fs.existsSync(path.join(tempDir, 'product-api.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'product.service.ts'))).toBe(false);

    // Check that the original product.ts was NOT renamed (no conflict with product-api.ts)
    expect(fs.existsSync(path.join(tempDir, 'product.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'product-constants.ts'))).toBe(false);

    // Check the result - only 1 rename should happen (service)
    expect(result.renamedFiles).toHaveLength(1);
    const serviceRename = result.renamedFiles.find((r: RenamedFile) => r.oldPath.includes('product.service.ts'));

    expect(serviceRename).toBeDefined();
    expect(serviceRename?.newPath).toContain('product-api.ts');
    expect(result.manualReviewRequired).toHaveLength(0);
  });

  it('should handle dry run mode correctly for conflict resolution', async () => {
    // Copy test fixtures to temp directory
    fs.copyFileSync(path.join(fixturesDir, 'user.ts'), path.join(tempDir, 'user.ts'));
    fs.copyFileSync(path.join(fixturesDir, 'user.component.ts'), path.join(tempDir, 'user.component.ts'));

    const options: RefactorOptions = {
      rootDir: tempDir,
      dryRun: true, // Dry run mode
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts'],
      smartServices: true
    };

    const refactorer = new AngularRefactorer(options);
    const result = await refactorer.refactor();

    // Check that no files were actually renamed in dry run mode
    expect(fs.existsSync(path.join(tempDir, 'user.component.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'user-model.ts'))).toBe(false);

    // But the result should show what would be renamed
    expect(result.renamedFiles).toHaveLength(2);
    const componentRename = result.renamedFiles.find((r: RenamedFile) => r.oldPath.includes('user.component.ts'));
    const conflictRename = result.renamedFiles.find(
      (r: RenamedFile) => r.oldPath.includes('user.ts') && r.newPath.includes('user-model.ts')
    );

    expect(componentRename).toBeDefined();
    expect(conflictRename).toBeDefined();
  });
});
