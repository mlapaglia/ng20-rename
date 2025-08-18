import { ConflictResolver } from '../../../rules/file-naming/conflict-resolver';
import { existsSync, readFileSync } from 'fs';
import { TsFileDomainDetector } from '../../../rules/ts-file-domain-detector';
import { normalize } from 'path';

jest.mock('fs');
jest.mock('../../../rules/ts-file-domain-detector');

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockDetectDomain = TsFileDomainDetector.detectDomain as jest.MockedFunction<
  typeof TsFileDomainDetector.detectDomain
>;

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
    jest.clearAllMocks();
  });

  describe('attemptConflictResolution', () => {
    describe('basic validation', () => {
      it('should return false if file does not exist', () => {
        mockExistsSync.mockReturnValue(false);

        const result = resolver.attemptConflictResolution('/path/to/nonexistent.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file does not exist or is not a TypeScript file'
        });
      });

      it('should return false if file is not TypeScript', () => {
        mockExistsSync.mockReturnValue(true);

        const result = resolver.attemptConflictResolution('/path/to/file.js');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file does not exist or is not a TypeScript file'
        });
      });
    });

    describe('file type detection', () => {
      beforeEach(() => {
        mockExistsSync.mockReturnValue(true);
      });

      it('should not resolve conflicts with component files', () => {
        const componentContent = `
          import { Component } from '@angular/core';
          @Component({
            selector: 'app-test'
          })
          export class TestComponent {}
        `;
        mockReadFileSync.mockReturnValue(componentContent);

        const result = resolver.attemptConflictResolution('/path/to/test.component.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a component'
        });
      });

      it('should not resolve conflicts with service files', () => {
        const serviceContent = `
          import { Injectable } from '@angular/core';
          @Injectable()
          export class TestService {}
        `;
        mockReadFileSync.mockReturnValue(serviceContent);

        const result = resolver.attemptConflictResolution('/path/to/test.service.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a service'
        });
      });

      it('should not resolve conflicts with directive files', () => {
        const directiveContent = `
          import { Directive } from '@angular/core';
          @Directive({
            selector: '[appTest]'
          })
          export class TestDirective {}
        `;
        mockReadFileSync.mockReturnValue(directiveContent);

        const result = resolver.attemptConflictResolution('/path/to/test.directive.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a directive'
        });
      });

      it('should not resolve conflicts with pipe files', () => {
        const pipeContent = `
          import { Pipe } from '@angular/core';
          @Pipe({ name: 'test' })
          export class TestPipe {}
        `;
        mockReadFileSync.mockReturnValue(pipeContent);

        const result = resolver.attemptConflictResolution('/path/to/test.pipe.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a pipe'
        });
      });

      it('should not resolve conflicts with module files', () => {
        const moduleContent = `
          import { NgModule } from '@angular/core';
          @NgModule({})
          export class TestModule {}
        `;
        mockReadFileSync.mockReturnValue(moduleContent);

        const result = resolver.attemptConflictResolution('/path/to/test.module.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a module'
        });
      });

      it('should not resolve conflicts with guard files', () => {
        const guardContent = `
          import { CanActivate } from '@angular/router';
          export class TestGuard implements CanActivate {}
        `;
        mockReadFileSync.mockReturnValue(guardContent);

        const result = resolver.attemptConflictResolution('/path/to/test.guard.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a guard'
        });
      });

      it('should not resolve conflicts with interceptor files', () => {
        const interceptorContent = `
          import { HttpInterceptor } from '@angular/common/http';
          export class TestInterceptor implements HttpInterceptor {}
        `;
        mockReadFileSync.mockReturnValue(interceptorContent);

        const result = resolver.attemptConflictResolution('/path/to/test.interceptor.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a interceptor'
        });
      });

      it('should not resolve conflicts with resolver files', () => {
        const resolverContent = `
          import { Resolve } from '@angular/router';
          export class TestResolver implements Resolve<any> {}
        `;
        mockReadFileSync.mockReturnValue(resolverContent);

        const result = resolver.attemptConflictResolution('/path/to/test.resolver.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a resolver'
        });
      });
    });

    describe('domain detection and resolution', () => {
      beforeEach(() => {
        mockExistsSync.mockReturnValue(true);
      });

      it('should return false if domain cannot be detected', () => {
        const otherContent = `
          export class SomeUtility {}
        `;
        mockReadFileSync.mockReturnValue(otherContent);
        mockDetectDomain.mockReturnValue(null);

        const result = resolver.attemptConflictResolution('/path/to/utility.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Could not determine domain for conflicting file'
        });
      });

      it('should return false if proposed name already exists', () => {
        const otherContent = `
          export class SomeUtility {}
        `;
        mockReadFileSync.mockReturnValue(otherContent);
        mockDetectDomain.mockReturnValue('-auth');
        mockExistsSync
          .mockReturnValueOnce(true) // Original file exists
          .mockReturnValueOnce(true); // Proposed new name also exists

        const result = resolver.attemptConflictResolution('/path/to/utility.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Proposed name utility-auth.ts already exists'
        });
      });

      it('should successfully resolve conflict with domain-specific name', () => {
        const otherContent = `
          export class SomeUtility {}
        `;
        mockReadFileSync.mockReturnValue(otherContent);
        mockDetectDomain.mockReturnValue('-auth');
        mockExistsSync
          .mockReturnValueOnce(true) // Original file exists
          .mockReturnValueOnce(false); // Proposed new name doesn't exist

        const result = resolver.attemptConflictResolution('/path/to/utility.ts');

        expect(result.resolved).toBe(true);
        expect(result.reason).toBe('Renamed conflicting file to utility-auth.ts (detected domain: -auth)');
        expect(normalize(result.conflictingFileRename!.oldPath)).toBe(normalize('/path/to/utility.ts'));
        expect(normalize(result.conflictingFileRename!.newPath)).toBe(normalize('/path/to/utility-auth.ts'));
      });

      it('should handle files in subdirectories', () => {
        const otherContent = `
          export class SomeUtility {}
        `;
        mockReadFileSync.mockReturnValue(otherContent);
        mockDetectDomain.mockReturnValue('-user');
        mockExistsSync
          .mockReturnValueOnce(true) // Original file exists
          .mockReturnValueOnce(false); // Proposed new name doesn't exist

        const result = resolver.attemptConflictResolution('/path/to/subdir/helper.ts');

        expect(result.resolved).toBe(true);
        expect(result.reason).toBe('Renamed conflicting file to helper-user.ts (detected domain: -user)');
        expect(normalize(result.conflictingFileRename!.oldPath)).toBe(normalize('/path/to/subdir/helper.ts'));
        expect(normalize(result.conflictingFileRename!.newPath)).toBe(normalize('/path/to/subdir/helper-user.ts'));
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockExistsSync.mockReturnValue(true);
      });

      it('should handle file read errors', () => {
        const error = new Error('Permission denied');
        mockReadFileSync.mockImplementation(() => {
          throw error;
        });

        const result = resolver.attemptConflictResolution('/path/to/file.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Error reading conflicting file: Permission denied'
        });
      });

      it('should handle non-Error exceptions', () => {
        mockReadFileSync.mockImplementation(() => {
          throw 'String error';
        });

        const result = resolver.attemptConflictResolution('/path/to/file.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Error reading conflicting file: String error'
        });
      });
    });

    describe('file type detection edge cases', () => {
      beforeEach(() => {
        mockExistsSync.mockReturnValue(true);
      });

      it('should detect guard with CanLoad interface', () => {
        const guardContent = `
          import { CanLoad } from '@angular/router';
          export class TestGuard implements CanLoad {}
        `;
        mockReadFileSync.mockReturnValue(guardContent);

        const result = resolver.attemptConflictResolution('/path/to/test.guard.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a guard'
        });
      });

      it('should detect guard with both CanActivate and CanLoad', () => {
        const guardContent = `
          import { CanActivate, CanLoad } from '@angular/router';
          export class TestGuard implements CanActivate, CanLoad {}
        `;
        mockReadFileSync.mockReturnValue(guardContent);

        const result = resolver.attemptConflictResolution('/path/to/test.guard.ts');

        expect(result).toEqual({
          resolved: false,
          reason: 'Conflicting file is a guard'
        });
      });

      it('should classify file as OTHER when no Angular patterns match', () => {
        const otherContent = `
          export interface SomeInterface {}
          export class SomeClass {}
        `;
        mockReadFileSync.mockReturnValue(otherContent);
        mockDetectDomain.mockReturnValue('-utils');
        mockExistsSync
          .mockReturnValueOnce(true) // Original file exists
          .mockReturnValueOnce(false); // Proposed new name doesn't exist

        const result = resolver.attemptConflictResolution('/path/to/interfaces.ts');

        expect(result.resolved).toBe(true);
        expect(mockDetectDomain).toHaveBeenCalledWith(otherContent);
      });
    });
  });
});
