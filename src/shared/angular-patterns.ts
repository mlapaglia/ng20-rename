/**
 * Shared Angular-related regex patterns and constants
 * Used across multiple files to avoid duplication and ensure consistency
 */

// Common Angular file type detection patterns
export const ANGULAR_PATTERNS = {
  COMPONENT: {
    DECORATOR: '@Component',
    CLASS_EXPORT: /export\s+class\s+\w*Component\s*{/,
    TEMPLATE_URL: 'templateUrl',
    STYLE_URLS: 'styleUrls'
  },
  SERVICE: {
    DECORATOR: '@Injectable'
  },
  DIRECTIVE: {
    DECORATOR: '@Directive'
  },
  PIPE: {
    DECORATOR: '@Pipe'
  },
  MODULE: {
    DECORATOR: '@NgModule'
  },
  GUARD: {
    CAN_ACTIVATE: 'CanActivate',
    CAN_LOAD: 'CanLoad'
  },
  INTERCEPTOR: {
    HTTP_INTERCEPTOR: 'HttpInterceptor'
  },
  RESOLVER: {
    RESOLVE: 'Resolve'
  }
};

// Security: Escape special regex characters to prevent ReDoS attacks
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Domain detection constants
export const DOMAIN_DETECTION = {
  MINIMUM_CONFIDENCE_THRESHOLD: 3
};

// Validate that export patterns are safe regex patterns
export function validateRegexPattern(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}
