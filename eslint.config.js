const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const pluginQuery = require('@tanstack/eslint-plugin-query');

module.exports = defineConfig([
  ...expoConfig,
  prettierConfig,
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'firebase', message: 'Firebase client SDK is forbidden; use the BFF /v1 API.' },
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
              message: 'Firebase client SDK is forbidden; use the BFF /v1 API.',
            },
            {
              group: ['@react-native-firebase/*'],
              message: 'React Native Firebase is forbidden; use the BFF /v1 API.',
            },
          ],
        },
      ],
    },
  },
]);
