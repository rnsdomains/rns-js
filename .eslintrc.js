module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    // 'jest/globals': true
  },
  extends: [
    'eslint:recommended',
    'airbnb-typescript/base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'jest'
  ],
  rules: {
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'eol-last': 'error',
    'no-underscore-dangle': ['error', { 'allowAfterThis': true }],
    'max-len': ['error', { 'code': 100, 'ignoreStrings': true, 'ignoreComments': true }],
    'class-methods-use-this': ['error', { 'exceptMethods': ['_validateDomainAndLabel', '_createResolver', '_getCoinTypeFromChainId'] }]
  }
}
