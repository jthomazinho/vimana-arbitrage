module.exports = {
  preset: 'ts-jest',
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  rootDir: './',
  roots: [
    '.'
  ],
  moduleFileExtensions: [
    'ts',
    'js',
    'tsx',
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
    '/public/',
    '/coverage/',
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  clearMocks: true,
};
