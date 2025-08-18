module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/fixtures/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs'
      }
    }]
  },
  moduleNameMapper: {
    '^chalk$': '<rootDir>/src/__tests__/__mocks__/chalk.js',
    '^cli-table3$': '<rootDir>/src/__tests__/__mocks__/cli-table3.js'
  },
  collectCoverageFrom: [
    'src/**/*.ts', 
    '!src/**/*.test.ts', 
    '!src/**/*.spec.ts', 
    '!src/cli.ts', 
    '!src/__tests__/**/*'  // Exclude all test utilities and fixtures
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
