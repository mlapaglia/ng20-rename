/**
 * Smart domain detection for plain TypeScript files
 * Analyzes TypeScript file content to determine appropriate domain-specific naming
 */

interface DomainPattern {
  suffix: string;
  patterns: {
    methods?: string[]; // Method/function name patterns
    imports?: string[]; // Import patterns
    keywords?: string[]; // Code content keywords
    exports?: string[]; // Export patterns
  };
}

const TS_DOMAIN_PATTERNS: DomainPattern[] = [
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

export class TsFileDomainDetector {
  /**
   * Analyzes TypeScript file content to detect the most appropriate domain suffix
   */
  static detectDomain(fileContent: string): string | null {
    const scores = new Map<string, number>();

    for (const pattern of TS_DOMAIN_PATTERNS) {
      let score = 0;

      // Check method names
      if (pattern.patterns.methods) {
        for (const method of pattern.patterns.methods) {
          if (new RegExp(`\\b${method}\\w*\\s*\\(`).test(fileContent)) {
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

      // Check keywords in content
      if (pattern.patterns.keywords) {
        for (const keyword of pattern.patterns.keywords) {
          if (new RegExp(`\\b${keyword}\\b`, 'i').test(fileContent)) {
            score += 1;
          }
        }
      }

      // Check exports
      if (pattern.patterns.exports) {
        for (const exportPattern of pattern.patterns.exports) {
          if (new RegExp(exportPattern, 'i').test(fileContent)) {
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
    if (bestScore >= 3) {
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
      const foundExports = pattern.patterns.exports.filter(exp => new RegExp(exp, 'i').test(fileContent));
      if (foundExports.length > 0) {
        reasons.push(`Exports: ${foundExports.join(', ')}`);
      }
    }

    const explanation = reasons.length > 0 ? reasons.join('; ') : 'Pattern match detected';
    return `Code structures detected: ${explanation}`;
  }
}
