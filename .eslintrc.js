module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['google'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'require-jsdoc': 0,
    'arrow-parens': 0,
    // The following rules are disabled because they flag issues with how
    // Prettier formats things:
    indent: 0,
    'object-curly-spacing': 0,
    // These rules are disabled because the TypeScript compiler already takes care of them.
    'no-unused-vars': 0,
    'no-unused-parameters': 0,
  },
};
