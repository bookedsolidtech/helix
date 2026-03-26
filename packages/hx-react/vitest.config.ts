import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Workspace node_modules root (symlinked from the main project)
const WORKSPACE_MODULES = resolve(__dirname, '../../node_modules');
const PNPM_STORE = resolve(WORKSPACE_MODULES, '.pnpm');

/**
 * Find a package in the pnpm content-addressable store.
 * The main project's node_modules may have broken symlinks from deleted worktrees.
 * This function resolves directly from the .pnpm store to bypass broken symlinks.
 */
function findPnpmPkg(dirPrefix: string, pkgPath: string): string {
  const entries = readdirSync(PNPM_STORE);
  const dir = entries.find((d) => d.startsWith(dirPrefix));
  if (!dir)
    throw new Error(`Cannot find pnpm package starting with '${dirPrefix}' in ${PNPM_STORE}`);
  return resolve(PNPM_STORE, dir, 'node_modules', pkgPath);
}

const LIT_REACT = findPnpmPkg('@lit+react@', '@lit/react');
const FLOATING_UI_DOM = findPnpmPkg('@floating-ui+dom@', '@floating-ui/dom');
const FLOATING_UI_CORE = findPnpmPkg('@floating-ui+core@', '@floating-ui/core');
const FLOATING_UI_UTILS = findPnpmPkg('@floating-ui+utils@', '@floating-ui/utils');
const HELIX_LIBRARY_ROOT = resolve(__dirname, '../hx-library');
const HELIX_TOKENS_ROOT = resolve(__dirname, '../hx-tokens');

export default defineConfig({
  // Use Vite's built-in esbuild JSX transform (no @vitejs/plugin-react needed)
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: [
      // @helixui/tokens sub-path imports: map to workspace package source
      {
        find: /^@helixui\/tokens\/(.+)/,
        replacement: resolve(HELIX_TOKENS_ROOT, 'src/$1.ts'),
      },
      // @helixui/tokens root import
      {
        find: /^@helixui\/tokens$/,
        replacement: resolve(HELIX_TOKENS_ROOT, 'src/index.ts'),
      },
      // @helixui/library sub-path imports: map to workspace package source
      {
        find: /^@helixui\/library\/components\/(.*)/,
        replacement: resolve(HELIX_LIBRARY_ROOT, 'src/components/$1/index.ts'),
      },
      // @helixui/library root import
      {
        find: /^@helixui\/library$/,
        replacement: resolve(HELIX_LIBRARY_ROOT, 'src/index.ts'),
      },
      // @lit/react: resolve directly from pnpm store (bypasses broken symlinks)
      { find: '@lit/react', replacement: LIT_REACT },
      // @floating-ui/*: resolve directly from pnpm store (bypasses broken symlinks)
      { find: '@floating-ui/dom', replacement: FLOATING_UI_DOM },
      { find: '@floating-ui/core', replacement: FLOATING_UI_CORE },
      { find: '@floating-ui/utils', replacement: FLOATING_UI_UTILS },
      // Pin React to the workspace version
      {
        find: 'react/jsx-runtime',
        replacement: resolve(WORKSPACE_MODULES, 'react/jsx-runtime'),
      },
      {
        find: 'react-dom/client',
        replacement: resolve(WORKSPACE_MODULES, 'react-dom/client'),
      },
      {
        find: /^react-dom$/,
        replacement: resolve(WORKSPACE_MODULES, 'react-dom'),
      },
      {
        find: /^react$/,
        replacement: resolve(WORKSPACE_MODULES, 'react'),
      },
    ],
  },
  server: {
    fs: {
      // Allow the full monorepo including pnpm store
      allow: [resolve(__dirname, '../..'), resolve(__dirname, '../../../..'), PNPM_STORE],
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['test/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    reporters: ['verbose'],
  },
});
