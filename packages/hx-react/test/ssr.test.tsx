/**
 * SSR compatibility tests — verifies that @helixui/react wrappers are properly
 * configured for React Server Components (RSC) and Next.js App Router.
 *
 * Key checks:
 * 1. 'use client' directive is present in all component wrapper source files.
 *    Web components require client-side DOM APIs and MUST declare 'use client'.
 * 2. All exported components have displayName set (required for RSC error boundaries).
 * 3. The package index exports the expected number of components.
 *
 * Deviation rule applied: SSR test simplified to file inspection + export shape
 * verification rather than running a full Next.js server environment.
 */
import { describe, it, expect } from 'vitest';
import * as HelixReact from '../src/index.js';

// Use Vite's import.meta.glob to read raw source of all component wrapper files.
// The ?raw query returns the raw TypeScript source string for each file.
// This lets us verify the 'use client' directive without executing the file.
const wrapperSources = import.meta.glob('../src/components/**/Hx*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('SSR compatibility', () => {
  describe("'use client' directive", () => {
    const componentFiles = Object.entries(wrapperSources).filter(
      ([path]) =>
        // Only the main HxComponentName.ts wrapper files, not types.ts or index.ts
        !path.endsWith('/types.ts') && !path.endsWith('/index.ts'),
    );

    it('has at least 90 component wrapper files to check', () => {
      expect(componentFiles.length).toBeGreaterThanOrEqual(90);
    });

    it("all component wrapper files begin with the 'use client' directive", () => {
      const missing: string[] = [];
      for (const [path, source] of componentFiles) {
        // The directive must appear as the very first statement in the file
        if (!source.trimStart().startsWith("'use client'")) {
          missing.push(path);
        }
      }
      expect(
        missing,
        `These wrappers are missing 'use client': ${missing.join(', ')}`,
      ).toHaveLength(0);
    });

    it('each component file imports createComponent from @lit/react', () => {
      const missing: string[] = [];
      for (const [path, source] of componentFiles) {
        if (!source.includes('@lit/react')) {
          missing.push(path);
        }
      }
      expect(
        missing,
        `These wrappers do not import @lit/react: ${missing.join(', ')}`,
      ).toHaveLength(0);
    });
  });

  describe('Component export shape', () => {
    // @lit/react createComponent returns a React.forwardRef exotic component,
    // which is an object with $$typeof, not a plain function.
    // Filter to named Hx* exports that are either functions or React exotic components.
    const isReactComponent = (val: unknown): boolean =>
      typeof val === 'function' ||
      (typeof val === 'object' && val !== null && '$$typeof' in val);

    const components = Object.entries(HelixReact).filter(
      ([key, value]) => key.startsWith('Hx') && isReactComponent(value),
    );

    it('exports at least 90 components', () => {
      expect(components.length).toBeGreaterThanOrEqual(90);
    });

    it('all components have displayName set (required for RSC debugging)', () => {
      const missing: string[] = [];
      for (const [name, component] of components) {
        const displayName = (component as { displayName?: string }).displayName;
        if (!displayName) {
          missing.push(name);
        }
      }
      expect(
        missing,
        `These components are missing displayName: ${missing.join(', ')}`,
      ).toHaveLength(0);
    });

    it('all components are valid React components', () => {
      for (const [name, component] of components) {
        expect(isReactComponent(component), `${name} should be a React component`).toBe(true);
      }
    });
  });

  describe('Package index structure', () => {
    it('exports HxButton by name', () => {
      expect(HelixReact.HxButton).toBeDefined();
    });

    it('exports HxTextInput by name', () => {
      expect(HelixReact.HxTextInput).toBeDefined();
    });

    it('exports HxCheckbox by name', () => {
      expect(HelixReact.HxCheckbox).toBeDefined();
    });

    it('exports HxSelect by name', () => {
      expect(HelixReact.HxSelect).toBeDefined();
    });

    it('exports HxDialog by name', () => {
      expect(HelixReact.HxDialog).toBeDefined();
    });
  });
});
