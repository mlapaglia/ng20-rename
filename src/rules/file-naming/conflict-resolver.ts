import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join, extname } from 'path';
import { AngularFileType } from '../../types';
import { TsFileDomainDetector } from '../ts-file-domain-detector';

export interface ConflictResolution {
  resolved: boolean;
  reason?: string;
  conflictingFileRename?: {
    oldPath: string;
    newPath: string;
  };
}

/**
 * Handles naming conflicts when renaming files
 */
export class ConflictResolver {
  /**
   * Attempts to resolve a naming conflict by analyzing the conflicting file
   * and potentially renaming it to a domain-specific name
   */
  attemptConflictResolution(conflictingFilePath: string): ConflictResolution {
    // Basic validation
    if (!existsSync(conflictingFilePath) || !conflictingFilePath.endsWith('.ts')) {
      return { resolved: false, reason: 'Conflicting file does not exist or is not a TypeScript file' };
    }

    try {
      const conflictingContent = readFileSync(conflictingFilePath, 'utf-8');
      const conflictingFileType = this.determineFileTypeFromContent(conflictingContent);

      // Don't auto-resolve conflicts with other Angular files (components, services, etc.)
      if (conflictingFileType !== AngularFileType.OTHER) {
        return { resolved: false, reason: `Conflicting file is a ${conflictingFileType}` };
      }

      // Try to detect domain for the conflicting file
      const detectedDomain = TsFileDomainDetector.detectDomain(conflictingContent);
      if (!detectedDomain) {
        return { resolved: false, reason: 'Could not determine domain for conflicting file' };
      }

      // Generate new name for the conflicting file
      const fileDir = dirname(conflictingFilePath);
      const fileExt = extname(conflictingFilePath);
      const baseFileName = basename(conflictingFilePath, fileExt);
      const newConflictingFileName = `${baseFileName}${detectedDomain}${fileExt}`; // Domain already includes hyphen
      const newConflictingFilePath = join(fileDir, newConflictingFileName);

      // Make sure the new name doesn't conflict with anything else
      if (existsSync(newConflictingFilePath)) {
        return { resolved: false, reason: `Proposed name ${newConflictingFileName} already exists` };
      }

      return {
        resolved: true,
        reason: `Renamed conflicting file to ${newConflictingFileName} (detected domain: ${detectedDomain})`,
        conflictingFileRename: {
          oldPath: conflictingFilePath,
          newPath: newConflictingFilePath
        }
      };
    } catch (error) {
      return {
        resolved: false,
        reason: `Error reading conflicting file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private determineFileTypeFromContent(content: string): AngularFileType {
    // Import patterns from the original file
    const ANGULAR_PATTERNS = {
      COMPONENT: { DECORATOR: '@Component' },
      SERVICE: { DECORATOR: '@Injectable' },
      DIRECTIVE: { DECORATOR: '@Directive' },
      PIPE: { DECORATOR: '@Pipe' },
      MODULE: { DECORATOR: '@NgModule' },
      GUARD: { CAN_ACTIVATE: 'CanActivate', CAN_LOAD: 'CanLoad' },
      INTERCEPTOR: { HTTP_INTERCEPTOR: 'HttpInterceptor' },
      RESOLVER: { RESOLVE: 'Resolve' }
    };

    if (content.includes(ANGULAR_PATTERNS.COMPONENT.DECORATOR)) {
      return AngularFileType.COMPONENT;
    }
    if (content.includes(ANGULAR_PATTERNS.SERVICE.DECORATOR)) {
      return AngularFileType.SERVICE;
    }
    if (content.includes(ANGULAR_PATTERNS.DIRECTIVE.DECORATOR)) {
      return AngularFileType.DIRECTIVE;
    }
    if (content.includes(ANGULAR_PATTERNS.PIPE.DECORATOR)) {
      return AngularFileType.PIPE;
    }
    if (content.includes(ANGULAR_PATTERNS.MODULE.DECORATOR)) {
      return AngularFileType.MODULE;
    }
    if (content.includes(ANGULAR_PATTERNS.GUARD.CAN_ACTIVATE) || content.includes(ANGULAR_PATTERNS.GUARD.CAN_LOAD)) {
      return AngularFileType.GUARD;
    }
    if (content.includes(ANGULAR_PATTERNS.INTERCEPTOR.HTTP_INTERCEPTOR)) {
      return AngularFileType.INTERCEPTOR;
    }
    if (content.includes(ANGULAR_PATTERNS.RESOLVER.RESOLVE)) {
      return AngularFileType.RESOLVER;
    }

    return AngularFileType.OTHER;
  }
}
