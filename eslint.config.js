const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const pluginQuery = require('@tanstack/eslint-plugin-query');

const restrictedOutsideFirebase = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'firebase',
          message: 'Import the Firebase JS SDK only via `@/lib/firebase` (Expo Go–compatible).',
        },
        {
          name: 'axios',
          message: 'Use the shared HTTP client in src/api instead of axios.',
        },
        { name: 'moment', message: 'Use date-fns instead of moment.' },
        { name: 'redux', message: 'Server state uses React Query; no Redux.' },
        {
          name: '@reduxjs/toolkit',
          message: 'Server state uses React Query; no Redux Toolkit.',
        },
      ],
      patterns: [
        {
          group: ['firebase/*'],
          message:
            'Import Firebase modules only inside `src/lib/firebase/*` or via `@/lib/firebase`.',
        },
        {
          group: ['@react-native-firebase/*'],
          message: 'Use the `firebase` JS SDK via `@/lib/firebase` (works in Expo Go).',
        },
      ],
    },
  ],
};

module.exports = defineConfig([
  ...expoConfig,
  prettierConfig,
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/firebase/**'],
    rules: restrictedOutsideFirebase,
  },
]);
