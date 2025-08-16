// Sample config file - should detect as -config
export const appConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  environment: 'production'
};

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export const authConfig = {
  tokenExpiry: 3600,
  refreshTokenExpiry: 86400,
  secretKey: process.env.SECRET_KEY
};
