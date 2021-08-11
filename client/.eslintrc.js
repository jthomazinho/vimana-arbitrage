module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module'
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  ignorePatterns: [
    '.eslintrc.js',
    'serviceWorker.ts',
    'react-app-env.d.ts',
    'jest.config.js',
    'setupTests.ts',
    'node_modules/',
    'coverage/',
    'public/',
    'build/',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'import/prefer-default-export': 'off',
    'react/destructuring-assignment': [0],
    'react/jsx-filename-extension': [0, { 'extensions': ['.js', '.jsx', '.tsx'] }],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        'js': 'never',
        'ts': 'never',
        'tsx': 'never'
      }
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          'spec/**',
          '*.spec.ts',
          'jest.setup.ts',
        ],
      },
    ],
    'max-len': ['error', { 'code': 120 }],
    'prefer-destructuring': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.tsx']
    },
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
};
