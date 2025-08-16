/**
 * Smart domain detection for plain TypeScript files
 * Analyzes TypeScript file content to determine appropriate domain-specific naming
 */

import { escapeRegExp, validateRegexPattern, DOMAIN_DETECTION } from '../shared/angular-patterns';

interface DomainPattern {
  suffix: string;
  patterns: {
    methods?: string[]; // Method/function name patterns (will be escaped)
    imports?: string[]; // Import patterns (literal strings, no escaping needed)
    keywords?: string[]; // Code content keywords (will be escaped)
    exports?: string[]; // Export patterns (regex patterns, no escaping needed)
  };
}

interface ProcessedDomainPattern {
  suffix: string;
  patterns: {
    methods?: string[]; // Pre-escaped method patterns
    imports?: string[]; // Import patterns (unchanged)
    keywords?: string[]; // Pre-escaped keyword patterns
    exports?: string[]; // Export patterns (unchanged)
  };
}

const TS_DOMAIN_PATTERNS_RAW: DomainPattern[] = [
  {
    suffix: '-model',
    patterns: {
      exports: ['class.*{', 'interface.*{'],
      keywords: ['id', 'name', 'title', 'email', 'phone', 'address', 'user', 'product', 'order', 'customer', 'entity'],
      methods: []
    }
  },
  {
    suffix: '-types',
    patterns: {
      exports: ['type.*='],
      keywords: ['union', 'literal', 'generic', 'mapped', 'type'],
      methods: []
    }
  },
  {
    suffix: '-interface',
    patterns: {
      exports: ['interface.*{'],
      keywords: ['contract', 'abstraction', 'definition', 'interface', 'Repository', 'Gateway'],
      methods: ['findById', 'save', 'delete', 'processPayment']
    }
  },
  {
    suffix: '-enum',
    patterns: {
      exports: ['enum.*{'],
      keywords: ['status', 'state', 'type', 'kind', 'category', 'enum'],
      methods: []
    }
  },
  {
    suffix: '-config',
    patterns: {
      keywords: ['config', 'configuration', 'settings', 'options', 'environment', 'apiUrl', 'timeout', 'Config'],
      exports: ['const.*=', 'interface.*Config'],
      methods: []
    }
  },
  {
    suffix: '-constants',
    patterns: {
      keywords: ['constant', 'CATEGORIES', 'DEFAULT', 'MAX', 'MIN', 'API_ENDPOINTS', 'HTTP_STATUS'],
      // Matches constant declarations with all-uppercase names, e.g. 'const MAX_VALUE=' or 'const MAX_VALUE ='
      // Matches constant declarations with names containing underscores, e.g. 'const API_ENDPOINTS=' or 'const API_ENDPOINTS ='
      exports: ['const\\s+[A-Z_]+\\s*=', 'const\\s+\\w*_\\w*\\s*='],
      methods: []
    }
  },
  {
    suffix: '-utils',
    patterns: {
      keywords: ['utility', 'helper', 'common', 'shared', 'util'],
      exports: ['function.*\\('],
      methods: ['format', 'parse', 'convert', 'transform', 'calculate']
    }
  },
  {
    suffix: '-helpers',
    patterns: {
      keywords: ['helper', 'assist', 'support', 'common'],
      exports: ['function.*\\('],
      methods: ['help', 'assist', 'support']
    }
  },
  {
    suffix: '-validator',
    patterns: {
      keywords: ['validate', 'validation', 'validator', 'rule', 'constraint'],
      methods: ['validate', 'isValid', 'check', 'verify'],
      imports: ['yup', 'joi', 'zod', '@angular/forms'],
      exports: ['function.*validate', 'function.*isValid', 'function.*check', 'function.*verify']
    }
  },
  {
    suffix: '-factory',
    patterns: {
      keywords: ['factory', 'create', 'build', 'make'],
      exports: ['class.*Factory', 'function.*create', 'function.*build', 'function.*make'],
      methods: ['create', 'build', 'make']
    }
  },
  {
    suffix: '-api',
    patterns: {
      keywords: ['api', 'http', 'request', 'response', 'endpoint', 'fetch'],
      imports: ['axios', '@angular/common/http'],
      methods: ['get', 'post', 'put', 'delete', 'fetch', 'request']
    }
  },
  {
    suffix: '-store',
    patterns: {
      keywords: ['store', 'state', 'signal', 'observable', 'subject'],
      imports: ['@ngrx/store', 'rxjs', '@angular/core'],
      methods: ['select', 'dispatch', 'update', 'setState', 'getState'],
      exports: ['const.*signal', 'const.*BehaviorSubject', 'const.*Store']
    }
  }
];

// Pre-process patterns to escape static strings for better performance
const TS_DOMAIN_PATTERNS: ProcessedDomainPattern[] = TS_DOMAIN_PATTERNS_RAW.map(pattern => ({
  suffix: pattern.suffix,
  patterns: {
    methods: pattern.patterns.methods?.map(method => escapeRegExp(method)),
    imports: pattern.patterns.imports, // No escaping needed for import strings
    keywords: pattern.patterns.keywords?.map(keyword => escapeRegExp(keyword)),
    exports: pattern.patterns.exports // No escaping needed for regex patterns
  }
}));

export class TsFileDomainDetector {
  /**
   * Analyzes TypeScript file content to detect the most appropriate domain suffix
   */
  static detectDomain(fileContent: string): string | null {
    const scores = new Map<string, number>();

    for (const pattern of TS_DOMAIN_PATTERNS) {
      let score = 0;

      // Check method names (pre-escaped)
      if (pattern.patterns.methods) {
        for (const escapedMethod of pattern.patterns.methods) {
          if (new RegExp(`\\b${escapedMethod}\\w*\\s*\\(`).test(fileContent)) {
            score += 2;
          }
        }
      }

      // Check imports
      if (pattern.patterns.imports) {
        for (const imp of pattern.patterns.imports) {
          if (fileContent.includes(`'${imp}'`) || fileContent.includes(`"${imp}"`)) {
            score += 3;
          }
        }
      }

      // Check keywords in content (pre-escaped)
      if (pattern.patterns.keywords) {
        for (const escapedKeyword of pattern.patterns.keywords) {
          if (new RegExp(`\\b${escapedKeyword}\\b`, 'i').test(fileContent)) {
            score += 1;
          }
        }
      }

      // Check exports
      if (pattern.patterns.exports) {
        for (const exportPattern of pattern.patterns.exports) {
          // Validate regex pattern for security
          if (validateRegexPattern(exportPattern) && new RegExp(exportPattern, 'i').test(fileContent)) {
            score += 3;
          }
        }
      }

      scores.set(pattern.suffix, score);
    }

    // Find highest scoring pattern
    const sortedScores = [...scores.entries()].sort(([, a], [, b]) => b - a);
    const [bestSuffix, bestScore] = sortedScores[0];

    // Only use domain-specific naming if confidence is high enough
    // and significantly better than other options
    if (bestScore >= DOMAIN_DETECTION.MINIMUM_CONFIDENCE_THRESHOLD) {
      const [, secondBestScore] = sortedScores[1] || [null, 0];
      if (bestScore > secondBestScore) {
        // Clear winner
        return bestSuffix;
      }
    }

    // Not confident enough - return null for fallback behavior
    return null;
  }

  /**
   * Gets a human-readable explanation of why a domain was detected
   */
  static explainDetection(fileContent: string, detectedDomain: string): string {
    const pattern = TS_DOMAIN_PATTERNS.find(p => p.suffix === detectedDomain);
    if (!pattern) return 'Unknown domain detection';

    const reasons: string[] = [];

    // Check what triggered the detection
    if (pattern.patterns.imports) {
      const foundImports = pattern.patterns.imports.filter(
        imp => fileContent.includes(`'${imp}'`) || fileContent.includes(`"${imp}"`)
      );
      if (foundImports.length > 0) {
        reasons.push(`Imports: ${foundImports.join(', ')}`);
      }
    }

    if (pattern.patterns.exports) {
      const foundExports = pattern.patterns.exports.filter(
        exp => validateRegexPattern(exp) && new RegExp(exp, 'i').test(fileContent)
      );
      if (foundExports.length > 0) {
        reasons.push(`Exports: ${foundExports.join(', ')}`);
      }
    }

    const explanation = reasons.length > 0 ? reasons.join('; ') : 'Pattern match detected';
    return `Code structures detected: ${explanation}`;
  }
}
