import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const worktreeRoot = fileURLToPath(new URL('../../../', import.meta.url));
const componentsDir = resolve(worktreeRoot, 'packages/drupal-starter/components');
const packageDir = resolve(worktreeRoot, 'packages/drupal-starter');

// ---------------------------------------------------------------------------
// Fixture data — loaded once
// ---------------------------------------------------------------------------

let componentDirs: string[] = [];

// ---------------------------------------------------------------------------
// CSS validation test suite
// ---------------------------------------------------------------------------

describe('CSS validation', () => {
  beforeAll(() => {
    componentDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  });

  // Test 1 — all CSS files parse without errors
  it('all CSS files parse without errors', () => {
    const errors: string[] = [];

    for (const dirName of componentDirs) {
      const cssPath = join(componentsDir, dirName, `${dirName}.css`);
      if (!existsSync(cssPath)) continue;
      const content = readFileSync(cssPath, 'utf8');

      try {
        postcss.parse(content, { from: cssPath });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${dirName}: ${message}`);
      }
    }

    expect(errors).toEqual([]);
  });

  // Test 2 — all CSS files are non-empty
  it('all CSS files are non-empty', () => {
    const empty: string[] = [];

    for (const dirName of componentDirs) {
      const cssPath = join(componentsDir, dirName, `${dirName}.css`);
      if (!existsSync(cssPath)) continue;
      const content = readFileSync(cssPath, 'utf8');
      if (content.trim().length === 0) {
        empty.push(dirName);
      }
    }

    expect(empty).toEqual([]);
  });

  // Test 3 — component CSS files use CSS custom properties for spacing values > 1px
  //
  // Checks that margin, padding, gap, and inset properties use `var(--hx-*)`
  // tokens rather than hardcoded px values greater than 1px. Allows: 0, 1px,
  // 0px, var(--hx-*), percentages, em, rem, and viewport units.
  // Files that contain only whitespace or comments are skipped.
  it('component CSS files use CSS custom properties for spacing (no raw px values > 1px)', () => {
    const violations: string[] = [];

    // Matches spacing properties with a raw px value that is > 1px.
    // Captures: property name, the px value (e.g. "16px").
    // Allows values that are 0, 1px, 0px, or use var()/em/rem/%.
    const rawPxRe =
      /(?:^|[;{])\s*(?:margin|padding|gap|top|right|bottom|left)[^:]*:\s*([^;}/]+)/gm;

    for (const dirName of componentDirs) {
      const cssPath = join(componentsDir, dirName, `${dirName}.css`);
      if (!existsSync(cssPath)) continue;
      const content = readFileSync(cssPath, 'utf8');

      // Skip files that are comment-only or whitespace-only
      const strippedOfComments = content.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (strippedOfComments.length === 0) continue;

      let match: RegExpExecArray | null;
      while ((match = rawPxRe.exec(content)) !== null) {
        const valueStr = match[1];

        // Extract individual px values from shorthand (e.g. "8px 16px 0 auto")
        const pxValues = valueStr.match(/\b(\d+)px\b/g) ?? [];
        for (const pxVal of pxValues) {
          const numericValue = parseInt(pxVal, 10);
          if (numericValue > 1) {
            violations.push(
              `${dirName}: hardcoded spacing value '${pxVal}' — use a var(--hx-*) token instead`,
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  // Test 4 — package-level CSS files exist
  it('package-level CSS files exist (helix-theme-overrides.css and helix-form-layout.css)', () => {
    const themeOverridesPath = resolve(packageDir, 'css/helix-theme-overrides.css');
    const formLayoutPath = resolve(packageDir, 'css/helix-form-layout.css');

    expect(existsSync(themeOverridesPath), `css/helix-theme-overrides.css not found`).toBe(true);
    expect(existsSync(formLayoutPath), `css/helix-form-layout.css not found`).toBe(true);
  });
});
