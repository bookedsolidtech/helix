import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.next/**',
      '.astro/**',
      '**/*.d.ts',
      'custom-elements.json',
      '.turbo/**',
      '.cache/**',
      'apps/admin/.next/**',
      'apps/docs/.astro/**',
      'apps/storybook/dist/**',
      'packages/hx-library/dist/**',
      '.worktrees/**',
      '.claude/**',
      'coverage/**',
      '.automaker/**',
    ],
  },

  // ── Base JS recommended rules ───────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript strict rules ─────────────────────────────────────────
  ...tseslint.configs.strict,

  // ── Lit-specific rules (for web component source) ───────────────────
  {
    files: ['packages/hx-library/src/**/*.ts'],
    plugins: {
      lit,
      wc,
    },
    rules: {
      // Lit rules
      'lit/attribute-value-entities': 'error',
      'lit/binding-positions': 'error',
      'lit/no-duplicate-template-bindings': 'error',
      'lit/no-invalid-html': 'error',
      'lit/no-legacy-template-syntax': 'error',
      'lit/no-private-properties': 'off',
      'lit/no-property-change-update': 'error',
      'lit/no-useless-template-literals': 'warn',
      'lit/no-value-attribute': 'error',
      'lit/lifecycle-super': 'error',
      'lit/prefer-static-styles': 'warn',

      // Web component rules
      'wc/no-closed-shadow-root': 'error',
      'wc/no-constructor-params': 'error',
      'wc/no-typos': 'warn',
    },
  },

  // ── TypeScript-specific overrides ───────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Allow non-null assertions sparingly in test files only (overridden below)
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Enforce explicit return types on public module functions
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Disallow require() in ESM
      '@typescript-eslint/no-require-imports': 'error',
    },
  },

  // ── Test file overrides ─────────────────────────────────────────────
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test-utils.ts'],
    rules: {
      // Tests often need non-null assertions for DOM queries
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Tests may use empty functions for stubs
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  // ── Stories file overrides ──────────────────────────────────────────
  {
    files: ['**/*.stories.ts'],
    rules: {
      // Stories may use non-null assertions for controls
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Stories use inline <style> tags for demo layouts and CSS custom property showcases
      // This is intentional and appropriate for documentation purposes
      'lit/prefer-static-styles': 'off',
    },
  },

  // ── Config files (JS) ──────────────────────────────────────────────
  {
    files: ['*.config.js', '*.config.ts', '*.config.mjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ── Node.js scripts ────────────────────────────────────────────────
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },

  // ── Prettier (must be last to disable conflicting rules) ──────────
  prettierConfig,
);
