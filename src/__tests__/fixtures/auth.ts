// Auth configuration - should be renamed to auth-config.ts when auth.service.ts wants to become auth.ts
export const authConfig = {
  apiUrl: 'https://api.example.com/auth',
  timeout: 5000,
  retries: 3,
  tokenStorage: 'localStorage'
};

export interface AuthOptions {
  rememberMe: boolean;
  redirectUrl?: string;
}
