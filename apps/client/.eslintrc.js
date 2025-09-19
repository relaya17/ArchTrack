module.exports = {
  extends: ['next/core-web-vitals', 'eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Use TypeScript version instead
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],

    // React rules
    'react/prop-types': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Next.js handles this
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Next.js rules
    '@next/next/no-img-element': 'error',
    '@next/next/no-html-link-for-pages': 'error',

    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // Code style
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts',
  ],
};
