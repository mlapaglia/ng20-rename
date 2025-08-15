export interface RefactorOptions {
  /** Directory to scan for Angular files */
  rootDir: string;
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Whether to perform a dry run without making changes */
  dryRun?: boolean;
  /** Whether to show verbose output */
  verbose?: boolean;
}

export interface RefactorResult {
  /** Files that were processed */
  processedFiles: string[];
  /** Files that were renamed */
  renamedFiles: RenamedFile[];
  /** Content changes made */
  contentChanges: ContentChange[];
  /** Any errors encountered */
  errors: RefactorError[];
}

export interface RenamedFile {
  /** Original file path */
  oldPath: string;
  /** New file path */
  newPath: string;
  /** Reason for the rename */
  reason: string;
}

export interface ContentChange {
  /** File that was modified */
  filePath: string;
  /** Line number where change was made */
  line: number;
  /** Original content */
  oldContent: string;
  /** New content */
  newContent: string;
  /** Reason for the change */
  reason: string;
}

export interface RefactorError {
  /** File where error occurred */
  filePath: string;
  /** Error message */
  message: string;
  /** Line number if applicable */
  line?: number;
}

export interface AngularFile {
  /** Full file path */
  path: string;
  /** File content */
  content: string;
  /** File type (component, service, directive, etc.) */
  type: AngularFileType;
}

export enum AngularFileType {
  COMPONENT = 'component',
  SERVICE = 'service',
  DIRECTIVE = 'directive',
  PIPE = 'pipe',
  MODULE = 'module',
  GUARD = 'guard',
  INTERCEPTOR = 'interceptor',
  RESOLVER = 'resolver',
  SPEC = 'spec',
  HTML_TEMPLATE = 'html-template',
  STYLESHEET = 'stylesheet',
  OTHER = 'other'
}
