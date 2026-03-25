/**
 * CSS Layout-Only Tests
 *
 * Enforces the architectural rule that SDC CSS files contain ONLY layout and
 * spacing rules — never component-level visual styles with hardcoded values.
 *
 * Visual concerns belong exclusively to the hx-* web component internals via
 * Shadow DOM and design tokens.  SDC wrapper CSS is strictly structural.
 *
 * The rule: forbidden properties ARE allowed when their value is:
 *   - A CSS custom property reference: var(--hx-*)
 *   - A keyword that resets rather than sets: none, inherit, initial,
 *     transparent, currentColor, unset, revert
 *
 * Forbidden: hardcoded color values (hex, rgb, rgba, hsl, named colors),
 * hardcoded font values, hardcoded border-radius, hardcoded box-shadow, etc.
 *
 * Examples:
 *   color: red;                         — FORBIDDEN (hardcoded)
 *   color: var(--hx-color-primary);     — ALLOWED (token)
 *   color: inherit;                     — ALLOWED (reset keyword)
 *   background-color: rgba(0,0,0,0.5);  — FORBIDDEN (hardcoded)
 *   background-color: transparent;      — ALLOWED (reset keyword)
 *   font-weight: bold;                  — FORBIDDEN (hardcoded)
 *   font-weight: var(--hx-fw-semibold); — ALLOWED (token)
 *   text-decoration: none;              — ALLOWED (reset keyword)
 *   border-radius: 4px;                 — FORBIDDEN (hardcoded)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(PACKAGE_ROOT, 'components');

// ---------------------------------------------------------------------------
// Allowed value patterns
// ---------------------------------------------------------------------------

/** Values that are structural resets — allowed regardless of property. */
const ALLOWED_VALUE_PATTERNS: RegExp[] = [
  /^var\(--/,           // CSS custom property reference
  /^none$/i,            // none (reset)
  /^inherit$/i,         // inherit (cascade structural)
  /^initial$/i,         // initial (reset)
  /^unset$/i,           // unset (reset)
  /^revert$/i,          // revert (reset)
  /^transparent$/i,     // transparent (not a real color value)
  /^currentColor$/i,    // currentColor (inherits from context)
];

/**
 * Return true if a CSS value is allowed for a visual property.
 * A value is allowed if it matches any of the allowed value patterns.
 */
function isAllowedValue(value: string): boolean {
  const trimmed = value.trim();
  return ALLOWED_VALUE_PATTERNS.some((p) => p.test(trimmed));
}

// ---------------------------------------------------------------------------
// Forbidden CSS property names (visual concerns)
// ---------------------------------------------------------------------------

/**
 * Properties that are visual concerns and must only appear with token values.
 * Each entry is a regex matching the full property name (no vendor prefixes).
 */
const FORBIDDEN_PROPERTIES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'color',            pattern: /^color$/ },
  { name: 'background-color', pattern: /^background-color$/ },
  {
    // `background` shorthand — but NOT `background-color`, `background-image`,
    // `background-position`, etc.  Those are separate entries.
    name: 'background',
    pattern: /^background$/,
  },
  { name: 'font-size',        pattern: /^font-size$/ },
  { name: 'font-weight',      pattern: /^font-weight$/ },
  { name: 'font-family',      pattern: /^font-family$/ },
  { name: 'font-style',       pattern: /^font-style$/ },
  { name: 'line-height',      pattern: /^line-height$/ },
  { name: 'letter-spacing',   pattern: /^letter-spacing$/ },
  { name: 'text-transform',   pattern: /^text-transform$/ },
  { name: 'text-decoration',  pattern: /^text-decoration$/ },
  { name: 'border-color',     pattern: /^border-color$/ },
  { name: 'border-radius',    pattern: /^border-radius$/ },
  { name: 'box-shadow',       pattern: /^box-shadow$/ },
  { name: 'text-shadow',      pattern: /^text-shadow$/ },
  { name: 'outline',          pattern: /^outline$/ },
  { name: 'opacity',          pattern: /^opacity$/ },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip CSS comments from source so they are not matched as violations. */
function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Parse a single CSS declaration line and return { property, value } or null
 * if the line is not a simple `property: value` declaration.
 *
 * This is intentionally simple — it handles the common case without a full
 * CSS parser.  It will not match multi-line values or shorthand blocks.
 */
function parseDeclaration(line: string): { property: string; value: string } | null {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;
  const property = line.slice(0, colonIdx).trim().toLowerCase();
  const value = line.slice(colonIdx + 1).trim().replace(/;$/, '').trim();
  // Skip at-rules, selectors, etc.
  if (property.includes('{') || property.includes('}') || property.startsWith('@')) {
    return null;
  }
  return { property, value };
}

/**
 * Find all forbidden property violations in a CSS string.
 * Returns an array of violation descriptions.
 */
function findViolations(css: string): string[] {
  const stripped = stripCssComments(css);
  const lines = stripped.split('\n');
  const violations: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    const decl = parseDeclaration(trimmed);
    if (!decl) continue;

    for (const { name, pattern } of FORBIDDEN_PROPERTIES) {
      if (!pattern.test(decl.property)) continue;

      // Property matches — check if the value is allowed.
      if (!isAllowedValue(decl.value)) {
        violations.push(
          `line ${i + 1}: forbidden property "${name}" with hardcoded value — ${trimmed}`,
        );
      }
    }
  }

  return violations;
}

/**
 * Collect all `.css` files in SDC component directories.
 * Each SDC has exactly one CSS file: `components/{name}/{name}.css`.
 */
function collectSdcCssFiles(): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(COMPONENTS_DIR)) {
    const sdcDir = join(COMPONENTS_DIR, entry);
    if (!statSync(sdcDir).isDirectory()) continue;
    const cssFile = join(sdcDir, `${entry}.css`);
    try {
      statSync(cssFile);
      files.push(cssFile);
    } catch {
      // No CSS file for this SDC — that is fine.
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SDC CSS files — collected', () => {
  it('found at least 20 SDC CSS files', () => {
    const files = collectSdcCssFiles();
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  it('article-teaser.css is present', () => {
    const files = collectSdcCssFiles();
    const names = files.map((f) => basename(f));
    expect(names).toContain('article-teaser.css');
  });

  it('provider-card.css is present', () => {
    const files = collectSdcCssFiles();
    const names = files.map((f) => basename(f));
    expect(names).toContain('provider-card.css');
  });
});

describe('SDC CSS files — no hardcoded visual property values', () => {
  const cssFiles = collectSdcCssFiles();

  for (const cssFile of cssFiles) {
    const relativePath = cssFile.replace(PACKAGE_ROOT + '/', '');
    const source = readFileSync(cssFile, 'utf-8');

    it(`${relativePath} — contains no forbidden hardcoded visual values`, () => {
      const violations = findViolations(source);
      expect(
        violations,
        `${relativePath} contains hardcoded component-level CSS that should use design tokens:\n  ${violations.join('\n  ')}`,
      ).toHaveLength(0);
    });
  }
});

describe('findViolations() helper', () => {
  it('flags hardcoded color value', () => {
    expect(findViolations('  color: red;').length).toBeGreaterThan(0);
  });

  it('flags hardcoded hex color', () => {
    expect(findViolations('  color: #ff0000;').length).toBeGreaterThan(0);
  });

  it('allows color via CSS custom property', () => {
    expect(findViolations('  color: var(--hx-color-primary);')).toHaveLength(0);
  });

  it('allows color: inherit', () => {
    expect(findViolations('  color: inherit;')).toHaveLength(0);
  });

  it('flags hardcoded background-color with rgba', () => {
    expect(findViolations('  background-color: rgba(0, 0, 0, 0.5);').length).toBeGreaterThan(0);
  });

  it('allows background-color via CSS custom property', () => {
    expect(findViolations('  background-color: var(--hx-bg-surface);')).toHaveLength(0);
  });

  it('allows background-color: transparent', () => {
    expect(findViolations('  background-color: transparent;')).toHaveLength(0);
  });

  it('flags hardcoded background with linear-gradient containing hardcoded color', () => {
    expect(
      findViolations('  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);').length,
    ).toBeGreaterThan(0);
  });

  it('allows background: var(--hx-*)', () => {
    expect(findViolations('  background: var(--hx-bg-muted);')).toHaveLength(0);
  });

  it('flags hardcoded font-size', () => {
    expect(findViolations('  font-size: 16px;').length).toBeGreaterThan(0);
  });

  it('allows font-size via CSS custom property', () => {
    expect(findViolations('  font-size: var(--hx-font-size-md);')).toHaveLength(0);
  });

  it('flags hardcoded font-weight: bold', () => {
    expect(findViolations('  font-weight: bold;').length).toBeGreaterThan(0);
  });

  it('allows font-weight via CSS custom property with fallback', () => {
    expect(findViolations('  font-weight: var(--hx-font-weight-semibold, 600);')).toHaveLength(0);
  });

  it('flags hardcoded border-radius', () => {
    expect(findViolations('  border-radius: 4px;').length).toBeGreaterThan(0);
  });

  it('flags hardcoded box-shadow', () => {
    expect(findViolations('  box-shadow: 0 2px 4px rgba(0,0,0,.2);').length).toBeGreaterThan(0);
  });

  it('allows box-shadow: none', () => {
    expect(findViolations('  box-shadow: none;')).toHaveLength(0);
  });

  it('allows display: flex (not a forbidden property)', () => {
    expect(findViolations('  display: flex;')).toHaveLength(0);
  });

  it('allows gap with token and fallback', () => {
    expect(findViolations('  gap: var(--hx-spacing-md, 1rem);')).toHaveLength(0);
  });

  it('ignores commented-out violations', () => {
    expect(findViolations('/* color: red; */')).toHaveLength(0);
  });

  it('allows text-decoration: none', () => {
    expect(findViolations('  text-decoration: none;')).toHaveLength(0);
  });

  it('flags text-decoration: underline', () => {
    expect(findViolations('  text-decoration: underline;').length).toBeGreaterThan(0);
  });
});
