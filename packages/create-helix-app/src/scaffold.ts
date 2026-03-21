import fs from 'fs-extra';
import path from 'node:path';
import { getTemplate, getComponentsForBundles } from './templates.js';
import type { ProjectOptions } from './types.js';

export async function scaffoldProject(options: ProjectOptions): Promise<void> {
  const template = getTemplate(options.framework);
  if (!template) {
    throw new Error(`Unknown framework: ${options.framework}`);
  }

  await fs.ensureDir(options.directory);

  // Check if template directory exists (bundled with package)
  const templateDir = path.join(
    new URL('.', import.meta.url).pathname,
    '..',
    'templates',
    options.framework,
  );
  const hasTemplate = await fs.pathExists(templateDir);

  if (hasTemplate) {
    // Copy the full template
    await fs.copy(templateDir, options.directory, { overwrite: true });
  }

  // Generate/overwrite core files based on options
  await writePackageJson(options, template);
  await writeReadme(options);

  if (options.designTokens) {
    await writeTokensConfig(options);
  }

  if (options.eslint) {
    await writeEslintConfig(options);
    await writePrettierConfig(options);
  }

  if (options.typescript) {
    await writeTsConfig(options);
  }

  // Framework-specific generation (always runs, fills gaps if no template dir)
  switch (options.framework) {
    case 'react-next':
      await scaffoldReactNext(options);
      break;
    case 'react-vite':
      await scaffoldReactVite(options);
      break;
    case 'vue-vite':
      await scaffoldVueVite(options);
      break;
    case 'vanilla':
      await scaffoldVanilla(options);
      break;
    case 'astro':
      await scaffoldAstro(options);
      break;
    case 'svelte-kit':
      await scaffoldSvelteKit(options);
      break;
    case 'vue-nuxt':
      await scaffoldVueNuxt(options);
      break;
    case 'angular':
      await scaffoldAngular(options);
      break;
    default:
      // For templates without generators yet, write a minimal starter
      await scaffoldMinimal(options);
      break;
  }

  // Write the HELiX integration helper
  await writeHelixSetup(options);

  // Write .gitignore
  await writeGitignore(options);
}

async function writePackageJson(
  options: ProjectOptions,
  template: ReturnType<typeof getTemplate> & object,
): Promise<void> {
  const pkg = {
    name: options.name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: getScripts(options),
    dependencies: {
      ...template.dependencies,
      ...(options.designTokens ? { '@helixui/tokens': '^0.3.0' } : {}),
    },
    devDependencies: {
      ...template.devDependencies,
    },
  };

  await fs.writeJson(path.join(options.directory, 'package.json'), pkg, {
    spaces: 2,
  });
}

function getScripts(options: ProjectOptions): Record<string, string> {
  switch (options.framework) {
    case 'react-next':
      return {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      };
    case 'react-vite':
      return {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      };
    case 'vue-vite':
      return {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      };
    case 'svelte-kit':
      return {
        dev: 'vite dev',
        build: 'vite build',
        preview: 'vite preview',
      };
    case 'astro':
      return {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      };
    case 'vue-nuxt':
      return {
        dev: 'nuxt dev',
        build: 'nuxt build',
        preview: 'nuxt preview',
      };
    case 'angular':
      return {
        dev: 'ng serve',
        build: 'ng build',
      };
    case 'vanilla':
      return {
        dev: 'npx http-server . -p 3000 -o',
      };
    default:
      return {
        dev: 'vite',
        build: 'vite build',
      };
  }
}

async function writeReadme(options: ProjectOptions): Promise<void> {
  const template = getTemplate(options.framework);
  const content = `# ${options.name}

Built with [HELiX](https://github.com/bookedsolidtech/helix) web components and ${template?.name ?? options.framework}.

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## HELiX Web Components

This project uses HELiX enterprise web components. Components work across any framework
because they're built on web standards (Custom Elements, Shadow DOM, CSS Custom Properties).

### Theming

Customize the design system using CSS custom properties:

\`\`\`css
:root {
  --hx-color-primary: #0066cc;
  --hx-color-primary-hover: #0052a3;
  --hx-spacing-md: 1rem;
  --hx-radius-md: 0.5rem;
}
\`\`\`

### Shadow DOM Styling

HELiX components use Shadow DOM for encapsulation. Style them with:

1. **CSS Custom Properties** — theme tokens cascade through Shadow DOM
2. **::part() selectors** — target exposed internal elements
3. **Slots** — project your own content into component slots

\`\`\`css
/* Theme tokens (cascade through Shadow DOM) */
hx-button {
  --hx-button-bg: var(--hx-color-primary);
}

/* ::part() for internal element access */
hx-button::part(button) {
  font-weight: 700;
}
\`\`\`

### Component Import Patterns

\`\`\`typescript
// Individual imports (tree-shakeable)
import '@helixui/library/hx-button';
import '@helixui/library/hx-card';

// Bundle import (all components)
import '@helixui/library';
\`\`\`

## Learn More

- [HELiX Documentation](https://helix-docs.example.com)
- [Component Storybook](https://helix-storybook.example.com)
- [API Reference (Custom Elements Manifest)](https://github.com/bookedsolidtech/helix)
`;
  await fs.writeFile(path.join(options.directory, 'README.md'), content);
}

async function writeTokensConfig(options: ProjectOptions): Promise<void> {
  const content = `/* HELiX Design Tokens — Theme Overrides */
/* Import the base token layer, then override as needed */

@import '@helixui/tokens/tokens.css';

:root {
  /* === Brand Overrides === */
  /* Uncomment and customize to match your brand */

  /* --hx-color-primary: #0066cc; */
  /* --hx-color-primary-hover: #0052a3; */
  /* --hx-color-primary-active: #003d7a; */

  /* --hx-color-success: #198754; */
  /* --hx-color-warning: #ffc107; */
  /* --hx-color-danger: #dc3545; */

  /* === Spacing Scale === */
  /* --hx-spacing-xs: 0.25rem; */
  /* --hx-spacing-sm: 0.5rem; */
  /* --hx-spacing-md: 1rem; */
  /* --hx-spacing-lg: 1.5rem; */
  /* --hx-spacing-xl: 2rem; */

  /* === Typography === */
  /* --hx-font-family: 'Inter', system-ui, sans-serif; */
  /* --hx-font-size-base: 1rem; */
  /* --hx-line-height-base: 1.5; */

  /* === Border Radius === */
  /* --hx-radius-sm: 0.25rem; */
  /* --hx-radius-md: 0.5rem; */
  /* --hx-radius-lg: 1rem; */
  /* --hx-radius-full: 9999px; */
}

${
  options.darkMode
    ? `/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    /* --hx-color-surface: #1a1a2e; */
    /* --hx-color-surface-hover: #16213e; */
    /* --hx-color-text: #e8e8e8; */
    /* --hx-color-text-secondary: #a0a0a0; */
  }
}

[data-theme="dark"] {
  /* Manual dark mode toggle support */
  /* --hx-color-surface: #1a1a2e; */
  /* --hx-color-text: #e8e8e8; */
}`
    : ''
}
`;
  await fs.writeFile(path.join(options.directory, 'helix-tokens.css'), content);
}

async function writeEslintConfig(options: ProjectOptions): Promise<void> {
  const content = `import js from '@eslint/js';
${options.typescript ? "import tseslint from 'typescript-eslint';" : ''}

export default [
  js.configs.recommended,
  ${options.typescript ? '...tseslint.configs.recommended,' : ''}
  {
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
`;
  await fs.writeFile(path.join(options.directory, 'eslint.config.js'), content);
}

async function writePrettierConfig(options: ProjectOptions): Promise<void> {
  const config = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100,
  };
  await fs.writeJson(path.join(options.directory, '.prettierrc'), config, {
    spaces: 2,
  });
}

async function writeTsConfig(options: ProjectOptions): Promise<void> {
  if (options.framework === 'react-next') {
    // Next.js manages its own tsconfig
    return;
  }

  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: options.framework.startsWith('react') ? 'react-jsx' : undefined,
    },
    include: ['src'],
    exclude: ['node_modules'],
  };

  await fs.writeJson(path.join(options.directory, 'tsconfig.json'), config, {
    spaces: 2,
  });
}

async function writeHelixSetup(options: ProjectOptions): Promise<void> {
  const components = getComponentsForBundles(options.componentBundles);
  const isAll = components.includes('*');

  const ext = options.typescript ? 'ts' : 'js';
  const srcDir = path.join(options.directory, 'src');
  await fs.ensureDir(srcDir);

  let content: string;

  if (isAll) {
    content = `/**
 * HELiX Web Components — Full library import
 * All 98 components registered as custom elements.
 */
import '@helixui/library';
${options.designTokens ? "\nimport '../helix-tokens.css';" : ''}

export {};
`;
  } else {
    content = `/**
 * HELiX Web Components — Selected bundles: ${options.componentBundles.join(', ')}
 *
 * Using the full library import for reliability.
 * For tree-shaking, switch to per-component imports:
 *   import '@helixui/library/components/hx-button';
 *   import '@helixui/library/components/hx-card';
 *
 * Full component list: https://github.com/bookedsolidtech/helix
 */
import '@helixui/library';
${options.designTokens ? "\nimport '../helix-tokens.css';" : ''}

export {};
`;
  }

  await fs.writeFile(path.join(srcDir, `helix-setup.${ext}`), content);
}

async function writeGitignore(options: ProjectOptions): Promise<void> {
  const content = `node_modules/
dist/
.next/
.nuxt/
.svelte-kit/
.astro/
.env
.env.local
*.log
.DS_Store
`;
  await fs.writeFile(path.join(options.directory, '.gitignore'), content);
}

// ─── Framework-specific scaffolding ───────────────────────────────────────────

async function scaffoldReactNext(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  const appDir = path.join(srcDir, 'app');
  await fs.ensureDir(appDir);

  // next.config.ts
  await fs.writeFile(
    path.join(options.directory, 'next.config.ts'),
    `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Web components need client-side hydration
  // No special config needed — Next.js 15 handles custom elements natively
  reactStrictMode: true,
};

export default nextConfig;
`,
  );

  // tsconfig.json for Next.js
  await fs.writeJson(
    path.join(options.directory, 'tsconfig.json'),
    {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    { spaces: 2 },
  );

  // React wrappers for HELiX components
  await fs.ensureDir(path.join(srcDir, 'components', 'helix'));
  await fs.writeFile(
    path.join(srcDir, 'components', 'helix', 'wrappers.tsx'),
    `'use client';

/**
 * React wrappers for HELiX web components.
 *
 * @lit/react creates type-safe React components that properly bridge:
 * - Properties (not just attributes)
 * - Events (CustomEvent → React callbacks)
 * - Refs
 *
 * Usage:
 *   import { HxButton, HxCard, HxTextInput } from '@/components/helix/wrappers';
 *   <HxButton variant="primary" onHxClick={handleClick}>Save</HxButton>
 */
import { createComponent } from '@lit/react';
import React from 'react';

// Import the web components (registers custom elements)
// Uses the ./components/* export map from @helixui/library
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-select';
import '@helixui/library/components/hx-checkbox';
import '@helixui/library/components/hx-switch';
import '@helixui/library/components/hx-dialog';
import '@helixui/library/components/hx-alert';
import '@helixui/library/components/hx-badge';
import '@helixui/library/components/hx-tabs';
// hx-tab and hx-tab-panel are registered by the hx-tabs import
import '@helixui/library/components/hx-avatar';
import '@helixui/library/components/hx-divider';
import '@helixui/library/components/hx-tooltip';
import '@helixui/library/components/hx-textarea';
import '@helixui/library/components/hx-data-table';

// Type declarations for the custom elements
// These map to the actual Lit component classes

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-text-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-alert': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-tab-panel': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-avatar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-tooltip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
      'hx-data-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

/**
 * React-wrapped HELiX Button
 *
 * @example
 * <HxButton variant="primary" size="md" onHxClick={() => alert('clicked!')}>
 *   Save Changes
 * </HxButton>
 */
export const HxButton = createComponent({
  tagName: 'hx-button',
  elementClass: customElements.get('hx-button') as CustomElementConstructor,
  react: React,
  events: {
    onHxClick: 'hx-click',
    onHxFocus: 'hx-focus',
    onHxBlur: 'hx-blur',
  },
});

export const HxCard = createComponent({
  tagName: 'hx-card',
  elementClass: customElements.get('hx-card') as CustomElementConstructor,
  react: React,
});

export const HxTextInput = createComponent({
  tagName: 'hx-text-input',
  elementClass: customElements.get('hx-text-input') as CustomElementConstructor,
  react: React,
  events: {
    onHxInput: 'hx-input',
    onHxChange: 'hx-change',
    onHxFocus: 'hx-focus',
    onHxBlur: 'hx-blur',
  },
});

export const HxSelect = createComponent({
  tagName: 'hx-select',
  elementClass: customElements.get('hx-select') as CustomElementConstructor,
  react: React,
  events: {
    onHxChange: 'hx-change',
  },
});

export const HxCheckbox = createComponent({
  tagName: 'hx-checkbox',
  elementClass: customElements.get('hx-checkbox') as CustomElementConstructor,
  react: React,
  events: {
    onHxChange: 'hx-change',
  },
});

export const HxSwitch = createComponent({
  tagName: 'hx-switch',
  elementClass: customElements.get('hx-switch') as CustomElementConstructor,
  react: React,
  events: {
    onHxChange: 'hx-change',
  },
});

export const HxDialog = createComponent({
  tagName: 'hx-dialog',
  elementClass: customElements.get('hx-dialog') as CustomElementConstructor,
  react: React,
  events: {
    onHxClose: 'hx-close',
    onHxOpen: 'hx-open',
  },
});

export const HxAlert = createComponent({
  tagName: 'hx-alert',
  elementClass: customElements.get('hx-alert') as CustomElementConstructor,
  react: React,
  events: {
    onHxClose: 'hx-close',
  },
});

export const HxBadge = createComponent({
  tagName: 'hx-badge',
  elementClass: customElements.get('hx-badge') as CustomElementConstructor,
  react: React,
});

export const HxTabs = createComponent({
  tagName: 'hx-tabs',
  elementClass: customElements.get('hx-tabs') as CustomElementConstructor,
  react: React,
  events: {
    onHxChange: 'hx-change',
  },
});

export const HxTab = createComponent({
  tagName: 'hx-tab',
  elementClass: customElements.get('hx-tab') as CustomElementConstructor,
  react: React,
});

export const HxTabPanel = createComponent({
  tagName: 'hx-tab-panel',
  elementClass: customElements.get('hx-tab-panel') as CustomElementConstructor,
  react: React,
});

export const HxAvatar = createComponent({
  tagName: 'hx-avatar',
  elementClass: customElements.get('hx-avatar') as CustomElementConstructor,
  react: React,
});

export const HxDivider = createComponent({
  tagName: 'hx-divider',
  elementClass: customElements.get('hx-divider') as CustomElementConstructor,
  react: React,
});

export const HxTooltip = createComponent({
  tagName: 'hx-tooltip',
  elementClass: customElements.get('hx-tooltip') as CustomElementConstructor,
  react: React,
});

export const HxTextarea = createComponent({
  tagName: 'hx-textarea',
  elementClass: customElements.get('hx-textarea') as CustomElementConstructor,
  react: React,
  events: {
    onHxInput: 'hx-input',
    onHxChange: 'hx-change',
  },
});

export const HxDataTable = createComponent({
  tagName: 'hx-data-table',
  elementClass: customElements.get('hx-data-table') as CustomElementConstructor,
  react: React,
  events: {
    onHxSort: 'hx-sort',
    onHxRowSelect: 'hx-row-select',
  },
});
`,
  );

  // Client-side HELiX provider component
  await fs.writeFile(
    path.join(srcDir, 'components', 'helix', 'provider.tsx'),
    `'use client';

/**
 * HelixProvider — Client component that initializes HELiX web components.
 *
 * Web components require client-side JavaScript to register custom elements.
 * Wrap your layout with this provider to ensure components are available.
 *
 * In Next.js App Router, this MUST be a client component ('use client').
 *
 * SSR Notes (from HELiX SSR audit):
 * - 61 components are fully SSR-safe (no browser API in render path)
 * - 27 components need client hydration for interactivity
 * - 8 components are client-only (toast, drawer, carousel, color-picker, counter, theme)
 * - All form components use module-level counters (no crypto.randomUUID — SSR-safe)
 * - For client-only components, use next/dynamic with ssr: false
 */
import { useEffect, useState, type ReactNode } from 'react';

interface HelixProviderProps {
  children: ReactNode;
  /** Explicit theme — avoids window.matchMedia SSR error from hx-theme */
  theme?: 'light' | 'dark' | 'system';
}

export function HelixProvider({ children, theme }: HelixProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Dynamic import ensures HELiX only loads on the client
    import('@helixui/library').then(() => {
      // Set explicit theme to avoid hx-theme's matchMedia SSR issue
      if (theme && theme !== 'system') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [theme]);

  // Render children immediately — components will upgrade when loaded
  return <>{children}</>;
}
`,
  );

  // JSX type declarations for custom elements
  await fs.writeFile(
    path.join(srcDir, 'helix.d.ts'),
    `/**
 * JSX type declarations for HELiX web components.
 *
 * This allows TypeScript to understand hx-* elements in JSX.
 * Properties are typed as 'any' for flexibility — for strict typing,
 * use the @lit/react wrappers in src/components/helix/wrappers.tsx.
 */
import 'react';

type HxElement = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'hx-accordion': HxElement;
      'hx-accordion-item': HxElement;
      'hx-alert': HxElement;
      'hx-avatar': HxElement;
      'hx-badge': HxElement;
      'hx-banner': HxElement;
      'hx-breadcrumb': HxElement;
      'hx-button': HxElement;
      'hx-button-group': HxElement;
      'hx-card': HxElement;
      'hx-carousel': HxElement;
      'hx-checkbox': HxElement;
      'hx-checkbox-group': HxElement;
      'hx-code-snippet': HxElement;
      'hx-color-picker': HxElement;
      'hx-combobox': HxElement;
      'hx-counter': HxElement;
      'hx-data-table': HxElement;
      'hx-date-picker': HxElement;
      'hx-dialog': HxElement;
      'hx-divider': HxElement;
      'hx-drawer': HxElement;
      'hx-dropdown': HxElement;
      'hx-field': HxElement;
      'hx-field-label': HxElement;
      'hx-file-upload': HxElement;
      'hx-grid': HxElement;
      'hx-icon': HxElement;
      'hx-icon-button': HxElement;
      'hx-menu': HxElement;
      'hx-menu-item': HxElement;
      'hx-meter': HxElement;
      'hx-nav': HxElement;
      'hx-pagination': HxElement;
      'hx-popover': HxElement;
      'hx-progress-bar': HxElement;
      'hx-progress-ring': HxElement;
      'hx-radio-group': HxElement;
      'hx-rating': HxElement;
      'hx-select': HxElement;
      'hx-skeleton': HxElement;
      'hx-slider': HxElement;
      'hx-spinner': HxElement;
      'hx-split-button': HxElement;
      'hx-split-panel': HxElement;
      'hx-stat': HxElement;
      'hx-status-indicator': HxElement;
      'hx-switch': HxElement;
      'hx-tab': HxElement;
      'hx-tab-panel': HxElement;
      'hx-tabs': HxElement;
      'hx-tag': HxElement;
      'hx-text': HxElement;
      'hx-text-input': HxElement;
      'hx-textarea': HxElement;
      'hx-toast': HxElement;
      'hx-tooltip': HxElement;
      'hx-tree-item': HxElement;
      'hx-tree-view': HxElement;
    }
  }
}

export {};
`,
  );

  // Layout with provider
  await fs.writeFile(
    path.join(appDir, 'layout.tsx'),
    `import type { Metadata } from 'next';
import { HelixProvider } from '@/components/helix/provider';
${options.designTokens ? "import '../../helix-tokens.css';" : ''}
import './globals.css';

export const metadata: Metadata = {
  title: '${options.name}',
  description: 'Built with HELiX web components',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en"${options.darkMode ? ' suppressHydrationWarning' : ''}>
      <body>
        <HelixProvider>
          {children}
        </HelixProvider>
      </body>
    </html>
  );
}
`,
  );

  // Global styles
  await fs.writeFile(
    path.join(appDir, 'globals.css'),
    `@import '@helixui/tokens/tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--hx-font-family, system-ui, -apple-system, sans-serif);
  line-height: var(--hx-line-height-base, 1.5);
  color: var(--hx-color-text, #1a1a1a);
  background: var(--hx-color-surface, #ffffff);
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--hx-spacing-lg, 1.5rem);
}
`,
  );

  // Main page — interactive demo using custom elements directly
  await fs.writeFile(
    path.join(appDir, 'page.tsx'),
    `'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * HELiX + Next.js — Interactive Demo
 *
 * This page demonstrates using HELiX web components directly in React/Next.js.
 * Web components work in JSX — you just need to handle events via refs or addEventListener.
 *
 * Three patterns shown:
 * 1. Direct custom elements in JSX (simplest)
 * 2. Event handling via useRef + addEventListener
 * 3. @lit/react wrappers (see src/components/helix/wrappers.tsx for type-safe approach)
 */
export default function Home() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef<HTMLElement>(null);
  const greetBtnRef = useRef<HTMLElement>(null);

  // Pattern: addEventListener for custom events from web components
  useEffect(() => {
    const input = nameInputRef.current;
    const btn = greetBtnRef.current;

    const handleInput = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setName(detail?.value ?? '');
    };

    const handleClick = () => {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    };

    input?.addEventListener('hx-input', handleInput);
    btn?.addEventListener('hx-click', handleClick);

    return () => {
      input?.removeEventListener('hx-input', handleInput);
      btn?.removeEventListener('hx-click', handleClick);
    };
  }, []);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            Welcome to HELiX
          </h1>
          <p style={{ color: '#666' }}>
            Enterprise web components, running in Next.js 15.
          </p>
        </div>
      </div>

      <hx-divider></hx-divider>

      <hx-tabs style={{ marginTop: '2rem' }}>
        <hx-tab slot="nav">Interactive Demo</hx-tab>
        <hx-tab slot="nav">Theming</hx-tab>
        <hx-tab slot="nav">Patterns</hx-tab>

        <hx-tab-panel>
          <div style={{ padding: '2rem 0', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <hx-card>
              <div slot="header">
                <h3>Quick Start</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <hx-text-input
                  ref={nameInputRef}
                  label="Your name"
                  placeholder="Enter your name"
                ></hx-text-input>
                <hx-button ref={greetBtnRef} variant="primary">
                  Say Hello
                </hx-button>
                {submitted && (
                  <hx-alert variant="success" open>
                    Hello, {name || 'World'}! HELiX components are working in React.
                  </hx-alert>
                )}
              </div>
            </hx-card>

            <hx-card>
              <div slot="header">
                <h3>Button Variants</h3>
                <hx-badge variant="info">Shadow DOM</hx-badge>
              </div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                HELiX components use Shadow DOM. Style them via CSS custom properties
                and ::part() selectors.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <hx-button variant="primary" size="sm">Primary</hx-button>
                <hx-button variant="secondary" size="sm">Secondary</hx-button>
                <hx-button variant="danger" size="sm">Danger</hx-button>
                <hx-button variant="ghost" size="sm">Ghost</hx-button>
              </div>
            </hx-card>

            <hx-card>
              <div slot="header">
                <h3>Event Handling</h3>
              </div>
              <p style={{ color: '#666' }}>
                Use <code>useRef</code> + <code>addEventListener</code> for custom events,
                or use the @lit/react wrappers in <code>src/components/helix/wrappers.tsx</code>
                for a more React-native experience.
              </p>
              <pre style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                background: '#f5f5f5',
                fontSize: '0.8rem',
                overflow: 'auto',
              }}>
{String.raw\`// Option 1: useRef + addEventListener
const ref = useRef(null);
useEffect(() => {
  ref.current?.addEventListener(
    'hx-click', handler
  );
}, []);

// Option 2: @lit/react wrappers
import { HxButton } from './wrappers';
<HxButton onHxClick={handler} />\`}
              </pre>
            </hx-card>
          </div>
        </hx-tab-panel>

        <hx-tab-panel>
          <div style={{ padding: '2rem 0' }}>
            <hx-card>
              <div slot="header"><h3>CSS Custom Properties</h3></div>
              <p>Override design tokens to match your brand:</p>
              <pre style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
{String.raw\`:root {
  --hx-color-primary: #0066cc;
  --hx-spacing-md: 1rem;
  --hx-radius-md: 0.5rem;
}

/* ::part() for internal elements */
hx-button::part(button) {
  font-weight: 700;
}\`}
              </pre>
            </hx-card>
          </div>
        </hx-tab-panel>

        <hx-tab-panel>
          <div style={{ padding: '2rem 0' }}>
            <hx-card>
              <div slot="header"><h3>Next.js Patterns</h3></div>
              <ul style={{ lineHeight: '2' }}>
                <li><strong>Client Components:</strong> Web components need <code>&apos;use client&apos;</code> — they require DOM</li>
                <li><strong>HelixProvider:</strong> Wraps your layout to initialize components client-side</li>
                <li><strong>Dynamic Import:</strong> HELiX loads via <code>import(&apos;@helixui/library&apos;)</code> in useEffect</li>
                <li><strong>SSR:</strong> Components render as empty custom elements server-side, hydrate on client</li>
              </ul>
            </hx-card>
          </div>
        </hx-tab-panel>
      </hx-tabs>
    </main>
  );
}
`,
  );

  // Forms example page — demonstrates form participation with web components
  const examplesDir = path.join(appDir, 'examples');
  const formsDir = path.join(examplesDir, 'forms');
  await fs.ensureDir(formsDir);

  await fs.writeFile(
    path.join(formsDir, 'page.tsx'),
    `'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * Form Participation Example
 *
 * HELiX form components use ElementInternals to participate in native HTML forms.
 * This means they work with FormData, form validation, and submit/reset events.
 *
 * Key patterns demonstrated:
 * 1. Native form submission with FormData
 * 2. Custom event handling for real-time validation
 * 3. Form reset behavior
 * 4. Accessible error states
 */
export default function FormsExample() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      const data = new FormData(form);
      const entries: Record<string, string> = {};
      data.forEach((value, key) => {
        entries[key] = value.toString();
      });
      setFormData(entries);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    };

    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, []);

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Form Participation</h1>
      <p style={{ color: 'var(--hx-color-text-secondary, #666)', marginBottom: '2rem' }}>
        HELiX form components participate in native HTML forms via ElementInternals.
        No special React wrappers needed — just use a standard {'<form>'} element.
      </p>

      <hx-card>
        <div slot="header"><h2>Registration Form</h2></div>
        <form ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <hx-text-input name="firstName" label="First name" placeholder="Jane" required></hx-text-input>
            <hx-text-input name="lastName" label="Last name" placeholder="Doe" required></hx-text-input>
          </div>
          <hx-text-input name="email" label="Email" type="email" placeholder="jane@example.com" required></hx-text-input>
          <hx-textarea name="bio" label="Bio" placeholder="Tell us about yourself..." rows={3}></hx-textarea>
          <hx-select name="role" label="Role">
            <option value="">Select a role...</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
          </hx-select>
          <hx-checkbox name="terms" label="I agree to the terms and conditions" required></hx-checkbox>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <hx-button variant="primary" type="submit">Submit</hx-button>
            <hx-button variant="secondary" type="reset">Reset</hx-button>
          </div>
        </form>
      </hx-card>

      {submitted && (
        <hx-card style={{ marginTop: '1.5rem' }}>
          <div slot="header">
            <h3>Form Data (from FormData API)</h3>
            <hx-badge variant="success">Submitted</hx-badge>
          </div>
          <pre style={{
            padding: '1rem',
            background: 'var(--hx-color-surface-hover, #f5f5f5)',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            overflow: 'auto',
          }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </hx-card>
      )}

      <hx-card style={{ marginTop: '1.5rem' }}>
        <div slot="header"><h3>How It Works</h3></div>
        <ul style={{ lineHeight: '2' }}>
          <li><strong>ElementInternals:</strong> Each HELiX form component calls <code>this.internals.setFormValue()</code></li>
          <li><strong>FormData:</strong> Values appear in <code>new FormData(form)</code> automatically</li>
          <li><strong>Validation:</strong> Components report validity via <code>internals.setValidity()</code></li>
          <li><strong>Reset:</strong> Forms reset web components via <code>formResetCallback()</code></li>
          <li><strong>No wrappers needed:</strong> This is native browser behavior, not framework-specific</li>
        </ul>
      </hx-card>
    </main>
  );
}
`,
  );

  // Dashboard example page
  const dashboardDir = path.join(examplesDir, 'dashboard');
  await fs.ensureDir(dashboardDir);

  await fs.writeFile(
    path.join(dashboardDir, 'page.tsx'),
    `'use client';

/**
 * Dashboard Example
 *
 * Shows data display components, layout patterns, and theming with CSS custom properties.
 */
export default function DashboardExample() {
  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--hx-color-text-secondary, #666)' }}>HELiX data display components in action.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <hx-button variant="secondary" size="sm">Export</hx-button>
          <hx-button variant="primary" size="sm">New Report</hx-button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
        <hx-card>
          <div slot="header"><h3 style={{ fontSize: '0.85rem', color: 'var(--hx-color-text-secondary, #888)' }}>Total Users</h3></div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>2,847</div>
          <hx-badge variant="success" style={{ marginTop: '0.5rem' }}>+12.5%</hx-badge>
        </hx-card>
        <hx-card>
          <div slot="header"><h3 style={{ fontSize: '0.85rem', color: 'var(--hx-color-text-secondary, #888)' }}>Active Sessions</h3></div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>1,024</div>
          <hx-badge variant="info" style={{ marginTop: '0.5rem' }}>Live</hx-badge>
        </hx-card>
        <hx-card>
          <div slot="header"><h3 style={{ fontSize: '0.85rem', color: 'var(--hx-color-text-secondary, #888)' }}>Uptime</h3></div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>99.9%</div>
          <hx-progress-bar value={99.9} max={100} style={{ marginTop: '0.5rem' }}></hx-progress-bar>
        </hx-card>
        <hx-card>
          <div slot="header"><h3 style={{ fontSize: '0.85rem', color: 'var(--hx-color-text-secondary, #888)' }}>Response Time</h3></div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>142ms</div>
          <hx-badge variant="warning" style={{ marginTop: '0.5rem' }}>Avg</hx-badge>
        </hx-card>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '2fr 1fr' }}>
        <hx-card>
          <div slot="header">
            <h3>Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { user: 'Sarah Chen', action: 'Deployed v2.4.1', time: '2 min ago', variant: 'success' as const },
              { user: 'Mike Johnson', action: 'Created pull request #847', time: '15 min ago', variant: 'info' as const },
              { user: 'Emily Park', action: 'Merged feature/auth-flow', time: '1 hr ago', variant: 'info' as const },
              { user: 'Alex Rivera', action: 'Reported bug #312', time: '3 hrs ago', variant: 'warning' as const },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--hx-color-border, #eee)' }}>
                <hx-avatar size="sm">{item.user.split(' ').map(n => n[0]).join('')}</hx-avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.user}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--hx-color-text-secondary, #888)' }}>{item.action}</div>
                </div>
                <hx-badge variant={item.variant}>{item.time}</hx-badge>
              </div>
            ))}
          </div>
        </hx-card>

        <hx-card>
          <div slot="header"><h3>System Status</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>CPU</span><span>67%</span>
              </div>
              <hx-progress-bar value={67} max={100}></hx-progress-bar>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Memory</span><span>4.2 / 8 GB</span>
              </div>
              <hx-progress-bar value={52} max={100}></hx-progress-bar>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Storage</span><span>180 / 500 GB</span>
              </div>
              <hx-progress-bar value={36} max={100}></hx-progress-bar>
            </div>
            <hx-divider></hx-divider>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <hx-tag>us-east-1</hx-tag>
              <hx-tag>production</hx-tag>
              <hx-tag>k8s</hx-tag>
            </div>
          </div>
        </hx-card>
      </div>

      <hx-card style={{ marginTop: '1.5rem' }}>
        <div slot="header"><h3>Styling Web Components</h3></div>
        <p>All components above are styled via CSS custom properties. Override them in your globals.css:</p>
        <pre style={{ marginTop: '1rem', padding: '1rem', background: 'var(--hx-color-surface-hover, #f5f5f5)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
{String.raw\`/* Override design tokens globally */
:root {
  --hx-color-primary: #0066cc;
  --hx-color-success: #22c55e;
}

/* Style specific component internals via ::part() */
hx-card::part(card) {
  border: 1px solid var(--hx-color-border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

hx-button::part(button) {
  font-weight: 600;
  letter-spacing: 0.025em;
}\`}
        </pre>
      </hx-card>
    </main>
  );
}
`,
  );

  // Examples layout with navigation
  await fs.writeFile(
    path.join(examplesDir, 'layout.tsx'),
    `'use client';

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav style={{
        padding: '0.75rem 2rem',
        borderBottom: '1px solid var(--hx-color-border, #eee)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
      }}>
        <a href="/" style={{ textDecoration: 'none', fontWeight: 600 }}>HELiX</a>
        <hx-divider vertical style={{ height: '1.5rem' }}></hx-divider>
        <a href="/examples/forms" style={{ textDecoration: 'none', color: 'var(--hx-color-text-secondary, #666)' }}>Forms</a>
        <a href="/examples/dashboard" style={{ textDecoration: 'none', color: 'var(--hx-color-text-secondary, #666)' }}>Dashboard</a>
      </nav>
      {children}
    </div>
  );
}
`,
  );
}

async function scaffoldReactVite(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  await fs.ensureDir(srcDir);

  // vite.config.ts
  await fs.writeFile(
    path.join(options.directory, 'vite.config.ts'),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
  );

  // index.html
  await fs.writeFile(
    path.join(options.directory, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  );

  // main.tsx
  await fs.writeFile(
    path.join(srcDir, 'main.tsx'),
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
${options.designTokens ? "import './helix-setup';" : "import '@helixui/library';"}
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
  );

  // App.tsx
  await fs.writeFile(
    path.join(srcDir, 'App.tsx'),
    `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>HELiX + React + Vite</h1>
      <hx-card>
        <div slot="header"><h2>Counter Demo</h2></div>
        <p>Count: {count}</p>
        <hx-button variant="primary" onClick={() => setCount(c => c + 1)}>
          Increment
        </hx-button>
      </hx-card>
    </div>
  );
}
`,
  );

  // index.css
  await fs.writeFile(
    path.join(srcDir, 'index.css'),
    `@import '@helixui/tokens/tokens.css';

body {
  font-family: var(--hx-font-family, system-ui, sans-serif);
  margin: 0;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}
`,
  );
}

async function scaffoldVueVite(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  await fs.ensureDir(srcDir);

  // vite.config.ts
  await fs.writeFile(
    path.join(options.directory, 'vite.config.ts'),
    `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat all hx-* tags as custom elements
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
});
`,
  );

  // index.html
  await fs.writeFile(
    path.join(options.directory, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
  );

  // main.ts
  await fs.writeFile(
    path.join(srcDir, 'main.ts'),
    `import { createApp } from 'vue';
import App from './App.vue';
import '@helixui/library';
${options.designTokens ? "import './helix-setup';" : ''}
import './style.css';

const app = createApp(App);
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('hx-');
app.mount('#app');
`,
  );

  // App.vue
  await fs.writeFile(
    path.join(srcDir, 'App.vue'),
    `<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const submitted = ref(false);

function handleSubmit() {
  submitted.value = true;
  setTimeout(() => { submitted.value = false; }, 3000);
}
</script>

<template>
  <div class="container">
    <h1>HELiX + Vue</h1>

    <hx-card>
      <div slot="header"><h2>Interactive Demo</h2></div>

      <hx-text-input
        label="Your name"
        placeholder="Enter your name"
        :value="name"
        @hx-input="name = $event.detail?.value ?? ''"
      />

      <hx-button
        variant="primary"
        style="margin-top: 1rem"
        @hx-click="handleSubmit"
      >
        Say Hello
      </hx-button>

      <hx-alert
        v-if="submitted"
        variant="success"
        open
        style="margin-top: 1rem"
      >
        Hello, {{ name || 'World' }}!
      </hx-alert>
    </hx-card>

    <hx-card style="margin-top: 1.5rem">
      <div slot="header">
        <h2>Vue + Web Components</h2>
        <hx-badge variant="info">Native Support</hx-badge>
      </div>
      <p>Vue has first-class custom element support. Properties bind with
      <code>:prop</code>, events with <code>@hx-event</code>.</p>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <hx-button variant="primary" size="sm">Primary</hx-button>
        <hx-button variant="secondary" size="sm">Secondary</hx-button>
        <hx-button variant="danger" size="sm">Danger</hx-button>
      </div>
    </hx-card>
  </div>
</template>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
`,
  );

  // style.css
  await fs.writeFile(
    path.join(srcDir, 'style.css'),
    `@import '@helixui/tokens/tokens.css';

body {
  font-family: var(--hx-font-family, system-ui, sans-serif);
  margin: 0;
  color: var(--hx-color-text, #1a1a1a);
}
`,
  );
}

async function scaffoldVanilla(options: ProjectOptions): Promise<void> {
  await fs.writeFile(
    path.join(options.directory, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.name}</title>

  <!-- HELiX via CDN — zero build step -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/index.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@helixui/tokens@latest/dist/tokens.css">

  <style>
    body {
      font-family: var(--hx-font-family, system-ui, sans-serif);
      margin: 0;
      padding: 2rem;
      color: var(--hx-color-text, #1a1a1a);
    }
    .container { max-width: 800px; margin: 0 auto; }
    .card-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>HELiX — No Framework Required</h1>
    <p>Web components work in plain HTML. No build step. No bundler. Just components.</p>

    <div class="card-grid">
      <hx-card>
        <div slot="header"><h3>Interactive Form</h3></div>
        <hx-text-input id="nameInput" label="Your name" placeholder="Type here..."></hx-text-input>
        <hx-button variant="primary" style="margin-top: 1rem" id="greetBtn">
          Say Hello
        </hx-button>
        <div id="output" style="margin-top: 1rem;"></div>
      </hx-card>

      <hx-card>
        <div slot="header"><h3>Button Variants</h3></div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <hx-button variant="primary" size="sm">Primary</hx-button>
          <hx-button variant="secondary" size="sm">Secondary</hx-button>
          <hx-button variant="danger" size="sm">Danger</hx-button>
          <hx-button variant="ghost" size="sm">Ghost</hx-button>
        </div>
      </hx-card>

      <hx-card>
        <div slot="header">
          <h3>For CMS Teams</h3>
          <hx-badge variant="info">Drupal / WordPress</hx-badge>
        </div>
        <p>Drop HELiX components into any CMS template. Works with Twig, Blade, PHP — anywhere HTML works.</p>
      </hx-card>
    </div>
  </div>

  <script>
    document.getElementById('greetBtn').addEventListener('hx-click', () => {
      const name = document.getElementById('nameInput').value || 'World';
      document.getElementById('output').innerHTML =
        \`<hx-alert variant="success" open>Hello, \${name}!</hx-alert>\`;
    });
  </script>
</body>
</html>
`,
  );
}

async function scaffoldAstro(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  const pagesDir = path.join(srcDir, 'pages');
  await fs.ensureDir(pagesDir);

  // astro.config.mjs
  await fs.writeFile(
    path.join(options.directory, 'astro.config.mjs'),
    `import { defineConfig } from 'astro/config';

export default defineConfig({});
`,
  );

  // Main page
  await fs.writeFile(
    path.join(pagesDir, 'index.astro'),
    `---
// HELiX components load client-side
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 2rem;
      }
      .container { max-width: 800px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>HELiX + Astro</h1>
      <p>Zero JS by default. Components hydrate as islands.</p>

      <hx-card>
        <div slot="header"><h2>Astro Islands</h2></div>
        <p>HELiX components are custom elements — they self-register and work without a framework runtime.</p>
        <hx-button variant="primary">Interactive Button</hx-button>
      </hx-card>
    </div>

    <script>
      import '@helixui/library';
    </script>
  </body>
</html>
`,
  );
}

async function scaffoldSvelteKit(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  const routesDir = path.join(srcDir, 'routes');
  await fs.ensureDir(routesDir);

  // svelte.config.js
  await fs.writeFile(
    path.join(options.directory, 'svelte.config.js'),
    `import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
};

export default config;
`,
  );

  // vite.config.ts
  await fs.writeFile(
    path.join(options.directory, 'vite.config.ts'),
    `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
});
`,
  );

  // +page.svelte
  await fs.writeFile(
    path.join(routesDir, '+page.svelte'),
    `<script lang="ts">
  import { onMount } from 'svelte';

  let name = $state('');
  let submitted = $state(false);

  onMount(async () => {
    await import('@helixui/library');
  });

  function handleSubmit() {
    submitted = true;
    setTimeout(() => { submitted = false; }, 3000);
  }
</script>

<svelte:head>
  <title>${options.name}</title>
</svelte:head>

<div class="container">
  <h1>HELiX + SvelteKit</h1>
  <p>Svelte has the best native custom element support of any framework.</p>

  <hx-card>
    <div slot="header"><h2>Interactive Demo</h2></div>
    <hx-text-input
      label="Your name"
      placeholder="Enter your name"
      value={name}
      on:hx-input={(e) => name = e.detail?.value ?? ''}
    />
    <hx-button variant="primary" style="margin-top: 1rem" on:hx-click={handleSubmit}>
      Say Hello
    </hx-button>
    {#if submitted}
      <hx-alert variant="success" open style="margin-top: 1rem">
        Hello, {name || 'World'}!
      </hx-alert>
    {/if}
  </hx-card>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
`,
  );

  // +layout.svelte
  await fs.writeFile(
    path.join(routesDir, '+layout.svelte'),
    `<script>
  import '@helixui/tokens/tokens.css';
</script>

<slot />
`,
  );

  // app.html
  await fs.writeFile(
    path.join(srcDir, 'app.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`,
  );
}

async function scaffoldVueNuxt(options: ProjectOptions): Promise<void> {
  const appDir = path.join(options.directory, 'app');
  const pagesDir = path.join(appDir, 'pages');
  const pluginsDir = path.join(options.directory, 'plugins');
  await fs.ensureDir(pagesDir);
  await fs.ensureDir(pluginsDir);

  // nuxt.config.ts
  await fs.writeFile(
    path.join(options.directory, 'nuxt.config.ts'),
    `export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  vue: {
    compilerOptions: {
      // Tell Vue to treat hx-* tags as custom elements
      isCustomElement: (tag: string) => tag.startsWith('hx-'),
    },
  },
${options.designTokens ? `  css: ['~/helix-tokens.css'],` : ''}
});
`,
  );

  // HELiX plugin (client-only)
  await fs.writeFile(
    path.join(pluginsDir, 'helix.client.ts'),
    `export default defineNuxtPlugin(async () => {
  await import('@helixui/library');
});
`,
  );

  // app.vue
  await fs.writeFile(
    path.join(appDir, 'app.vue'),
    `<template>
  <NuxtPage />
</template>
`,
  );

  // index page
  await fs.writeFile(
    path.join(pagesDir, 'index.vue'),
    `<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const submitted = ref(false);

function handleSubmit() {
  submitted.value = true;
  setTimeout(() => { submitted.value = false; }, 3000);
}

function handleInput(e: Event) {
  const detail = (e as CustomEvent).detail;
  name.value = detail?.value ?? '';
}
</script>

<template>
  <div class="container">
    <h1>HELiX + Nuxt 4</h1>
    <p>Full-stack Vue with SSR. Web components auto-hydrate on the client.</p>

    <hx-card>
      <div slot="header"><h2>Interactive Form</h2></div>
      <hx-text-input
        label="Your name"
        placeholder="Enter your name"
        :value="name"
        @hx-input="handleInput"
      />
      <hx-button variant="primary" style="margin-top: 1rem" @hx-click="handleSubmit">
        Say Hello
      </hx-button>
      <hx-alert v-if="submitted" variant="success" open style="margin-top: 1rem">
        Hello, {{ name || 'World' }}!
      </hx-alert>
    </hx-card>

    <hx-card style="margin-top: 1.5rem">
      <div slot="header"><h2>Component Showcase</h2></div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <hx-button variant="primary">Primary</hx-button>
        <hx-button variant="secondary">Secondary</hx-button>
        <hx-button variant="danger">Danger</hx-button>
        <hx-badge variant="info">Badge</hx-badge>
        <hx-badge variant="success">Success</hx-badge>
      </div>
    </hx-card>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
`,
  );
}

async function scaffoldAngular(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  const appDir = path.join(srcDir, 'app');
  await fs.ensureDir(appDir);

  // angular.json (minimal)
  await fs.writeFile(
    path.join(options.directory, 'angular.json'),
    JSON.stringify(
      {
        $schema: './node_modules/@angular/cli/lib/config/schema.json',
        version: 1,
        newProjectRoot: 'projects',
        projects: {
          [options.name]: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: {
                  outputPath: 'dist',
                  index: 'src/index.html',
                  browser: 'src/main.ts',
                  tsConfig: 'tsconfig.json',
                  styles: ['src/styles.css', ...(options.designTokens ? ['helix-tokens.css'] : [])],
                },
              },
              serve: {
                builder: '@angular/build:dev-server',
              },
            },
          },
        },
      },
      null,
      2,
    ),
  );

  // index.html
  await fs.writeFile(
    path.join(srcDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${options.name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`,
  );

  // main.ts
  await fs.writeFile(
    path.join(srcDir, 'main.ts'),
    `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// Register HELiX web components
import '@helixui/library';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
`,
  );

  // styles.css
  await fs.writeFile(
    path.join(srcDir, 'styles.css'),
    `body {
  font-family: var(--hx-font-family, system-ui, sans-serif);
  margin: 0;
  padding: 0;
}
`,
  );

  // app.component.ts
  await fs.writeFile(
    path.join(appDir, 'app.component.ts'),
    `import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <div class="container">
      <h1>HELiX + Angular 18</h1>
      <p>Enterprise Angular with native custom element support via CUSTOM_ELEMENTS_SCHEMA.</p>

      <hx-card>
        <div slot="header"><h2>Interactive Form</h2></div>
        <hx-text-input
          label="Your name"
          placeholder="Enter your name"
          [attr.value]="name"
          (hx-input)="onInput($event)"
        ></hx-text-input>
        <hx-button variant="primary" style="margin-top: 1rem" (hx-click)="onSubmit()">
          Say Hello
        </hx-button>
        @if (submitted) {
          <hx-alert variant="success" open style="margin-top: 1rem">
            Hello, {{ name || 'World' }}!
          </hx-alert>
        }
      </hx-card>

      <hx-card style="margin-top: 1.5rem">
        <div slot="header"><h2>Angular Signals + WC</h2></div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <hx-button variant="primary">Primary</hx-button>
          <hx-button variant="secondary">Secondary</hx-button>
          <hx-button variant="danger">Danger</hx-button>
          <hx-badge variant="info">Angular 18</hx-badge>
        </div>
      </hx-card>
    </div>
  \`,
  styles: [\`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
  \`],
})
export class AppComponent {
  name = '';
  submitted = false;

  onInput(event: Event) {
    const detail = (event as CustomEvent).detail;
    this.name = detail?.value ?? '';
  }

  onSubmit() {
    this.submitted = true;
    setTimeout(() => { this.submitted = false; }, 3000);
  }
}
`,
  );
}

async function scaffoldMinimal(options: ProjectOptions): Promise<void> {
  const srcDir = path.join(options.directory, 'src');
  await fs.ensureDir(srcDir);

  await fs.writeFile(
    path.join(srcDir, 'main.ts'),
    `import '@helixui/library';
${options.designTokens ? "import '../helix-tokens.css';" : ''}

console.log('HELiX components loaded');
`,
  );
}
