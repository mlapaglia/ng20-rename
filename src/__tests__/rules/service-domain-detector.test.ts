import { ServiceDomainDetector } from '../../rules/service-domain-detector';

describe('ServiceDomainDetector', () => {
  describe('detectDomain', () => {
    it('should detect API domain for HttpClient services', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        import { HttpClient } from '@angular/common/http';
        
        @Injectable()
        export class UserService {
          constructor(private http: HttpClient) {}
          
          getUsers() {
            return this.http.get('/api/users');
          }
          
          createUser(user: any) {
            return this.http.post('/api/users', user);
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-api');
    });

    it('should detect store domain for state management services', () => {
      const serviceContent = `
        import { Injectable, signal } from '@angular/core';
        import { BehaviorSubject } from 'rxjs';
        
        @Injectable()
        export class UserStore {
          private state = signal({ users: [] });
          private subject = new BehaviorSubject(null);
          
          select(selector: any) {
            return this.state();
          }
          
          dispatch(action: any) {
            // update state
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-store');
    });

    it('should detect notifications domain for MatSnackBar services', () => {
      const serviceContent = `
        import { Injectable, inject } from '@angular/core';
        import { MatSnackBar } from '@angular/material/snack-bar';
        
        @Injectable()
        export class NotificationService {
          private snackBar = inject(MatSnackBar);
          
          show(message: string) {
            this.snackBar.open(message);
          }
          
          error(message: string) {
            this.snackBar.open(message, 'Close');
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-notifications');
    });

    it('should detect client domain for external integrations', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        import { stripe } from 'stripe';
        
        @Injectable()
        export class PaymentClient {
          connect() {
            // connect to stripe
          }
          
          process(payment: any) {
            // process payment
          }
          
          authenticate() {
            // authenticate with external service
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-client');
    });

    it('should detect cache domain for caching services', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        
        @Injectable()
        export class DataCache {
          get(key: string) {
            return localStorage.getItem(key);
          }
          
          set(key: string, value: any) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          
          clear() {
            localStorage.clear();
          }
          
          invalidate(key: string) {
            localStorage.removeItem(key);
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-cache');
    });

    it('should detect validator domain for validation services', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        import { AbstractControl } from '@angular/forms';
        
        @Injectable()
        export class FormValidator {
          validate(control: AbstractControl) {
            return null;
          }
          
          isValid(value: any) {
            return true;
          }
          
          check(constraint: any) {
            return true;
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBe('-validator');
    });

    it('should return null for low confidence scores', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        
        @Injectable()
        export class GenericService {
          doSomething() {
            return 'generic';
          }
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBeNull();
    });

    it('should return null when multiple patterns have similar scores', () => {
      const serviceContent = `
        import { Injectable } from '@angular/core';
        
        @Injectable()
        export class AmbiguousService {
          doSomething() { return 'data'; }  // Generic method
        }
      `;

      const result = ServiceDomainDetector.detectDomain(serviceContent);
      expect(result).toBeNull();
    });
  });

  describe('explainDetection', () => {
    it('should explain API detection', () => {
      const serviceContent = `
        import { HttpClient } from '@angular/common/http';
        export class UserService {
          constructor(private http: HttpClient) {}
        }
      `;

      const explanation = ServiceDomainDetector.explainDetection(serviceContent, '-api');
      expect(explanation).toContain('Dependencies: HttpClient');
      expect(explanation).toContain('Imports: @angular/common/http');
    });

    it('should explain notifications detection', () => {
      const serviceContent = `
        import { MatSnackBar } from '@angular/material/snack-bar';
        export class NotificationService {
          constructor(private snackBar: MatSnackBar) {}
        }
      `;

      const explanation = ServiceDomainDetector.explainDetection(serviceContent, '-notifications');
      expect(explanation).toContain('Dependencies: MatSnackBar');
      expect(explanation).toContain('Imports: @angular/material/snack-bar');
    });

    it('should return default message for unknown domain', () => {
      const serviceContent = 'export class TestService {}';
      const explanation = ServiceDomainDetector.explainDetection(serviceContent, '-unknown');
      expect(explanation).toBe('Unknown domain detection');
    });

    it('should return pattern match message when no specific reasons found', () => {
      const serviceContent = 'export class TestService {}';
      const explanation = ServiceDomainDetector.explainDetection(serviceContent, '-api');
      expect(explanation).toBe('Pattern match detected');
    });
  });
});
