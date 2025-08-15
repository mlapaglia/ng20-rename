/**
 * Smart domain detection for Angular services
 * Analyzes service code to determine appropriate domain-specific naming
 */

interface DomainPattern {
  suffix: string;
  patterns: {
    dependencies?: string[];      // Injected services/dependencies
    methods?: string[];          // Method name patterns  
    imports?: string[];          // Import patterns
    keywords?: string[];         // Code content keywords
  };
}

const DOMAIN_PATTERNS: DomainPattern[] = [
  {
    suffix: '-api',
    patterns: {
      dependencies: ['HttpClient', 'HttpService'],
      methods: ['get', 'post', 'put', 'delete', 'fetch', 'request'],
      imports: ['@angular/common/http'],
      keywords: ['http.get', 'http.post', 'http.put', 'http.delete', 'api', 'endpoint', 'fetch']
    }
  },
  {
    suffix: '-store',
    patterns: {
      dependencies: ['Store', 'StateService'],
      methods: ['select', 'dispatch', 'update', 'setState', 'getState', 'subscribe'],
      imports: ['@ngrx/store', 'rxjs'],
      keywords: ['state', 'reducer', 'action', 'signal\\(', 'BehaviorSubject', 'Subject']
    }
  },
  {
    suffix: '-notifications',
    patterns: {
      dependencies: ['MatSnackBar', 'ToastrService', 'NotificationService'],
      methods: ['show', 'error', 'success', 'warn', 'toast', 'alert', 'notify', 'open'],
      imports: ['@angular/material/snack-bar', 'ngx-toastr'],
      keywords: ['snackBar', 'toast', 'notification', 'alert', 'message', 'popup']
    }
  },
  {
    suffix: '-client',
    patterns: {
      methods: ['connect', 'authenticate', 'process', 'send', 'initialize', 'configure'],
      keywords: ['client', 'external', 'third-party', 'integration', 'sdk', 'wrapper'],
      imports: ['stripe', 'paypal', 'firebase', 'aws-sdk']
    }
  },
  {
    suffix: '-cache',
    patterns: {
      methods: ['get', 'set', 'clear', 'remove', 'invalidate', 'refresh'],
      keywords: ['cache', 'storage', 'localStorage', 'sessionStorage', 'memory'],
      imports: ['@angular/common/http']
    }
  },
  {
    suffix: '-validator',
    patterns: {
      methods: ['validate', 'isValid', 'check', 'verify'],
      keywords: ['validate', 'validation', 'validator', 'rule', 'constraint'],
      imports: ['@angular/forms']
    }
  }
];

export class ServiceDomainDetector {
  /**
   * Analyzes service content to detect the most appropriate domain suffix
   */
  static detectDomain(serviceContent: string, className: string): string | null {
    const scores = new Map<string, number>();
    
    for (const pattern of DOMAIN_PATTERNS) {
      let score = 0;
      
      // Check dependencies (constructor injection)
      if (pattern.patterns.dependencies) {
        for (const dep of pattern.patterns.dependencies) {
          if (new RegExp(`\\b${dep}\\b`).test(serviceContent)) {
            score += 3;
          }
        }
      }
      
      // Check method names
      if (pattern.patterns.methods) {
        for (const method of pattern.patterns.methods) {
          if (new RegExp(`\\b${method}\\w*\\s*\\(`).test(serviceContent)) {
            score += 2;
          }
        }
      }
      
      // Check imports
      if (pattern.patterns.imports) {
        for (const imp of pattern.patterns.imports) {
          if (serviceContent.includes(`'${imp}'`) || serviceContent.includes(`"${imp}"`)) {
            score += 3;
          }
        }
      }
      
      // Check keywords in content
      if (pattern.patterns.keywords) {
        for (const keyword of pattern.patterns.keywords) {
          if (new RegExp(`\\b${keyword}\\b`, 'i').test(serviceContent)) {
            score += 1;
          }
        }
      }
      
      scores.set(pattern.suffix, score);
    }
    
    // Find highest scoring pattern
    const sortedScores = [...scores.entries()].sort(([,a], [,b]) => b - a);
    const [bestSuffix, bestScore] = sortedScores[0];
    
    // Only use domain-specific naming if confidence is high enough
    // and significantly better than other options
    if (bestScore >= 4) {
      const [, secondBestScore] = sortedScores[1] || [null, 0];
      if (bestScore > secondBestScore + 1) { // Clear winner
        return bestSuffix;
      }
    }
    
    // Not confident enough - return null for fallback behavior
    return null;
  }

  /**
   * Gets a human-readable explanation of why a domain was detected
   */
  static explainDetection(serviceContent: string, detectedDomain: string): string {
    const pattern = DOMAIN_PATTERNS.find(p => p.suffix === detectedDomain);
    if (!pattern) return 'Unknown domain detection';

    const reasons: string[] = [];

    // Check what triggered the detection
    if (pattern.patterns.dependencies) {
      const foundDeps = pattern.patterns.dependencies.filter(dep => 
        new RegExp(`\\b${dep}\\b`).test(serviceContent)
      );
      if (foundDeps.length > 0) {
        reasons.push(`Dependencies: ${foundDeps.join(', ')}`);
      }
    }

    if (pattern.patterns.imports) {
      const foundImports = pattern.patterns.imports.filter(imp => 
        serviceContent.includes(`'${imp}'`) || serviceContent.includes(`"${imp}"`)
      );
      if (foundImports.length > 0) {
        reasons.push(`Imports: ${foundImports.join(', ')}`);
      }
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Pattern match detected';
  }
}
