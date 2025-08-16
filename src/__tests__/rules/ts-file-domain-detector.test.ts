import { TsFileDomainDetector } from '../../rules/ts-file-domain-detector';
import * as fs from 'fs';
import * as path from 'path';

describe('TsFileDomainDetector', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/domain-samples');

  describe('detectDomain', () => {
    it('should detect model files based on data structure patterns', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'model-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-model');
    });

    it('should detect types files based on type definitions', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'types-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-types');
    });

    it('should detect interface files based on interface definitions', () => {
      const content = fs.readFileSync(path.join(fixturesDir, 'interface-sample.ts'), 'utf-8');
      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-interface');
    });

    it('should detect enum files based on enum definitions', () => {
      const content = `
        export enum UserStatus {
          ACTIVE = 'active',
          INACTIVE = 'inactive',
          PENDING = 'pending'
        }

        export enum OrderType {
          ONLINE,
          OFFLINE
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-enum');
    });

    it('should detect config files based on configuration patterns', () => {
      const content = `
        export const appConfig = {
          apiUrl: 'https://api.example.com',
          timeout: 5000,
          retries: 3
        };

        export interface DatabaseConfig {
          host: string;
          port: number;
          database: string;
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-config');
    });

    it('should detect constants files based on constant patterns', () => {
      const content = `
        export const API_ENDPOINTS = {
          USERS: '/api/users',
          ORDERS: '/api/orders'
        };

        export const DEFAULT_TIMEOUT = 5000;
        export const MAX_RETRIES = 3;
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-constants');
    });

    it('should detect utils files based on utility function patterns', () => {
      const content = `
        export function formatDate(date: Date): string {
          return date.toISOString();
        }

        export const calculateTotal = (items: Item[]): number => {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-utils');
    });

    it('should detect validator files based on validation patterns', () => {
      const content = `
        export function validateEmail(email: string): boolean {
          return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
        }

        export function isValidUser(user: User): boolean {
          return user.name && user.email && validateEmail(user.email);
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-validator');
    });

    it('should detect factory files based on factory patterns', () => {
      const content = `
        export class UserFactory {
          static createUser(data: Partial<User>): User {
            return {
              id: data.id || 0,
              name: data.name || '',
              email: data.email || ''
            };
          }
        }

        export function createApiClient(config: ApiConfig): ApiClient {
          return new ApiClient(config);
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-factory');
    });

    it('should detect store files based on state management patterns', () => {
      const content = `
        import { signal } from '@angular/core';
        import { BehaviorSubject } from 'rxjs';

        export const userStore = signal<User[]>([]);
        export const loading$ = new BehaviorSubject<boolean>(false);
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-store');
    });

    it('should detect api files based on HTTP patterns', () => {
      const content = `
        import { HttpClient } from '@angular/common/http';

        export const userApi = {
          getUsers: () => http.get('/api/users'),
          createUser: (user: User) => http.post('/api/users', user),
          fetchData: () => fetch('/api/data')
        };
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBe('-api');
    });

    it('should return null for files that do not match any pattern strongly', () => {
      const content = `
        // Just some random code
        const x = 5;
        function doSomething() {
          console.log('hello');
        }
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBeNull();
    });

    it('should return null for low confidence matches', () => {
      const content = `
        // File with only weak matches
        const data = { name: 'test' };
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      expect(result).toBeNull();
    });

    it('should prefer higher scoring patterns', () => {
      const content = `
        export interface UserConfig {
          name: string;
          settings: AppSettings;
        }

        export const defaultConfig = {
          timeout: 5000,
          retries: 3
        };
      `;

      const result = TsFileDomainDetector.detectDomain(content);
      // Should detect as config due to higher score from structure + keywords
      expect(result).toBe('-config');
    });
  });

  describe('explainDetection', () => {
    it('should provide explanation for model detection', () => {
      const content = `
        export interface User {
          id: number;
          name: string;
        }
      `;

      const explanation = TsFileDomainDetector.explainDetection(content, '-model');
      expect(explanation).toContain('Code structures detected');
    });

    it('should provide explanation for config detection', () => {
      const content = `
        import { HttpClient } from '@angular/common/http';
        export const appConfig = { apiUrl: 'test' };
      `;

      const explanation = TsFileDomainDetector.explainDetection(content, '-config');
      expect(explanation).toContain('Code structures detected');
    });

    it('should handle unknown domain', () => {
      const content = 'test';
      const explanation = TsFileDomainDetector.explainDetection(content, '-unknown');
      expect(explanation).toBe('Unknown domain detection');
    });
  });
});
