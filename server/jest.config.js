module.exports = {
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    '{app,lib,services}/**/*.{js,ts}',
  ],
  testEnvironment: 'node',
  rootDir: './',
  roots: [
    '.'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'json'
  ],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'ts-jest'
  },
  testMatch: [
    '**/*.spec.(ts|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  setupFiles: [
    './spec/jest.setup.ts'
  ],
  setupFilesAfterEnv: [
    'jest-extended'
  ],
  clearMocks: true,
};
