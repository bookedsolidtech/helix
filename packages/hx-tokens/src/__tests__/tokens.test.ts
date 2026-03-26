/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { tokenEntries, tokenMap, darkTokenEntries, highContrastTokenEntries } from '../index.js';
import { tokensCSS, darkMediaCSS, darkManualCSS, fullTokensCSS } from '../css.js';
import { isHexColor, resolveTokenRef } from '../utils.js';

// ---------------------------------------------------------------------------
// WCAG contrast ratio helpers
// ---------------------------------------------------------------------------

function hexToLinear(twoHex: string): number {
  const c = parseInt(twoHex, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = (clean.charAt(0) + clean.charAt(0));
    const g = (clean.charAt(1) + clean.charAt(1));
    const b = (clean.charAt(2) + clean.charAt(2));
    return 0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b);
  }
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return 0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Token structure helpers
// ---------------------------------------------------------------------------

function isVarReference(value: string): boolean {
  return value.startsWith('var(--hx-');
}

// ---------------------------------------------------------------------------
// 1. Token naming convention
// ---------------------------------------------------------------------------

describe('token naming convention', () => {
  it('all token names start with --hx- prefix', () => {
    const violations = tokenEntries.filter((t) => !t.name.startsWith('--hx-'));
    expect(violations).toHaveLength(0);
  });

  it('all token names use lowercase letters, digits, and hyphens only', () => {
    const violations = tokenEntries.filter((t) => !/^--hx-[a-z0-9]+(-[a-z0-9.]+)*$/.test(t.name));
    expect(
      violations,
      `Names violating pattern: ${violations.map((v) => v.name).join(', ')}`,
    ).toHaveLength(0);
  });

  it('all dark token names start with --hx- prefix', () => {
    const violations = darkTokenEntries.filter((t) => !t.name.startsWith('--hx-'));
    expect(violations).toHaveLength(0);
  });

  it('all high-contrast token names start with --hx- prefix', () => {
    const violations = highContrastTokenEntries.filter((t) => !t.name.startsWith('--hx-'));
    expect(violations).toHaveLength(0);
  });

  it('no duplicate token names exist in the light theme', () => {
    const names = tokenEntries.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ---------------------------------------------------------------------------
// 2. Token value validation
// ---------------------------------------------------------------------------

describe('token value validation', () => {
  it('all tokens have non-empty string values', () => {
    const violations = tokenEntries.filter((t) => !t.value || t.value.trim() === '');
    expect(
      violations,
      `Tokens with empty values: ${violations.map((v) => v.name).join(', ')}`,
    ).toHaveLength(0);
  });

  it('color tokens with hex values are valid CSS hex colors', () => {
    const hexColors = tokenEntries.filter(
      (t) => t.category === 'color' && t.value.startsWith('#'),
    );
    const violations = hexColors.filter((t) => !isHexColor(t.value));
    expect(
      violations,
      `Invalid hex colors: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('space tokens have valid CSS length values', () => {
    const spaceTokens = tokenEntries.filter((t) => t.category === 'space');
    const violations = spaceTokens.filter((t) => {
      const v = t.value.trim();
      return (
        v !== '0' &&
        v !== '1px' &&
        !v.endsWith('rem') &&
        !v.endsWith('em') &&
        !v.endsWith('px') &&
        !v.endsWith('%') &&
        !v.startsWith('var(')
      );
    });
    expect(
      violations,
      `Invalid space values: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('font-size tokens have valid CSS values', () => {
    const fontSizeTokens = tokenEntries.filter(
      (t) => t.category === 'font' && t.group === 'size',
    );
    expect(fontSizeTokens.length).toBeGreaterThan(0);
    const violations = fontSizeTokens.filter((t) => {
      const v = t.value.trim();
      return !v.endsWith('rem') && !v.endsWith('em') && !v.endsWith('px') && !v.startsWith('var(');
    });
    expect(
      violations,
      `Invalid font-size values: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('z-index tokens have integer values', () => {
    const zTokens = tokenEntries.filter((t) => t.category === 'z-index');
    expect(zTokens.length).toBeGreaterThan(0);
    const violations = zTokens.filter((t) => {
      const v = t.value.trim();
      return !/^\d+$/.test(v) && !v.startsWith('var(');
    });
    expect(
      violations,
      `Non-integer z-index: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('opacity tokens have values between 0 and 1', () => {
    const opacityTokens = tokenEntries.filter(
      (t) => t.category === 'opacity' && !t.value.startsWith('var('),
    );
    expect(opacityTokens.length).toBeGreaterThan(0);
    const violations = opacityTokens.filter((t) => {
      const v = parseFloat(t.value);
      return isNaN(v) || v < 0 || v > 1;
    });
    expect(
      violations,
      `Invalid opacity values: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('all tokens have a defined category', () => {
    const violations = tokenEntries.filter((t) => !t.category || t.category.trim() === '');
    expect(
      violations,
      `Tokens missing category: ${violations.map((v) => v.name).join(', ')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Three-tier cascade: Primitive → Semantic → Component
// ---------------------------------------------------------------------------

describe('three-tier cascade validation', () => {
  it('semantic tokens reference only defined --hx-* primitives', () => {
    const semanticTokens = tokenEntries.filter((t) => isVarReference(t.value));
    const violations: string[] = [];

    for (const token of semanticTokens) {
      const match = token.value.match(/var\((--[\w-]+)(?:,\s*[^)]+)?\)/);
      if (!match) continue;
      const referencedName = match[1];
      if (referencedName && referencedName.startsWith('--hx-') && !(referencedName in tokenMap)) {
        violations.push(`${token.name} → ${referencedName} (not found)`);
      }
    }

    expect(violations, `Broken var() references:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('primitive tokens have raw CSS values (not var() references)', () => {
    const colorPrimitives = tokenEntries.filter(
      (t) => t.category === 'color' && t.value.startsWith('#'),
    );
    expect(colorPrimitives.length).toBeGreaterThan(0);
    const violations = colorPrimitives.filter((t) => t.value.startsWith('var('));
    expect(violations).toHaveLength(0);
  });

  it('semantic color tokens reference primitive color tokens', () => {
    const semanticColorTokens = tokenEntries.filter(
      (t) => t.category === 'color' && isVarReference(t.value),
    );
    expect(semanticColorTokens.length).toBeGreaterThan(0);

    for (const token of semanticColorTokens) {
      const resolved = resolveTokenRef(token.value, tokenMap);
      const isResolved =
        resolved.startsWith('#') ||
        resolved.startsWith('rgb') ||
        resolved === 'transparent' ||
        !resolved.startsWith('var(--hx-');
      expect(
        isResolved,
        `Token ${token.name} (${token.value}) does not resolve to a primitive — got: ${resolved}`,
      ).toBe(true);
    }
  });

  it('space primitives are raw CSS values', () => {
    const spacePrimitives = tokenEntries.filter(
      (t) => t.category === 'space' && !isVarReference(t.value),
    );
    expect(spacePrimitives.length).toBeGreaterThan(0);
    for (const token of spacePrimitives) {
      expect(
        token.value.startsWith('var('),
        `Space primitive ${token.name} should have raw value, got: ${token.value}`,
      ).toBe(false);
    }
  });

  it('border-width tokens reference or have direct pixel values', () => {
    const borderWidthTokens = tokenEntries.filter(
      (t) =>
        t.category === 'border' &&
        t.path.includes('width') &&
        !isVarReference(t.value),
    );
    expect(borderWidthTokens.length).toBeGreaterThan(0);
    const violations = borderWidthTokens.filter((t) => !t.value.endsWith('px'));
    expect(
      violations,
      `Border-width tokens with invalid values: ${violations.map((v) => `${v.name}=${v.value}`).join(', ')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Token completeness
// ---------------------------------------------------------------------------

describe('token completeness', () => {
  it('token map contains all light-mode token entries', () => {
    for (const entry of tokenEntries) {
      expect(tokenMap).toHaveProperty(entry.name);
      expect(tokenMap[entry.name]).toBe(entry.value);
    }
  });

  it('color category includes primary and neutral ramps', () => {
    const colorNames = tokenEntries
      .filter((t) => t.category === 'color')
      .map((t) => t.name);

    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    for (const shade of shades) {
      expect(colorNames, `Missing --hx-color-primary-${shade}`).toContain(
        `--hx-color-primary-${shade}`,
      );
    }
    for (const shade of shades) {
      expect(colorNames, `Missing --hx-color-neutral-${shade}`).toContain(
        `--hx-color-neutral-${shade}`,
      );
    }
  });

  it('semantic text colors reference neutral tokens that exist', () => {
    const textTokens = tokenEntries.filter(
      (t) => t.category === 'color' && t.path.includes('text'),
    );
    expect(textTokens.length).toBeGreaterThan(0);

    for (const token of textTokens) {
      if (isVarReference(token.value)) {
        const match = token.value.match(/var\((--[\w-]+)(?:,\s*[^)]+)?\)/);
        if (match) {
          const refName = match[1];
          if (refName && refName.startsWith('--hx-')) {
            expect(
              tokenMap,
              `${token.name} references ${refName} which is not defined`,
            ).toHaveProperty(refName);
          }
        }
      }
    }
  });

  it('all required spacing scale entries are present', () => {
    const requiredSpaces = ['0', 'px', '1', '2', '3', '4', '5', '6', '8', '10', '12'];
    const spaceNames = tokenEntries
      .filter((t) => t.category === 'space')
      .map((t) => t.key);

    for (const key of requiredSpaces) {
      expect(spaceNames, `Missing space.${key}`).toContain(key);
    }
  });

  it('all required border-radius entries are present', () => {
    const requiredRadii = ['none', 'sm', 'md', 'lg', 'full'];
    const radiusNames = tokenEntries
      .filter((t) => t.category === 'border' && t.path.includes('radius'))
      .map((t) => t.key);

    for (const key of requiredRadii) {
      expect(radiusNames, `Missing border-radius.${key}`).toContain(key);
    }
  });

  it('dark mode provides overrides for text and surface colors', () => {
    const darkNames = darkTokenEntries.map((t) => t.name);
    // Dark tokens override light tokens using the same CSS custom property names
    expect(darkNames).toContain('--hx-color-text-primary');
    expect(darkNames).toContain('--hx-color-surface-default');
  });

  it('dark and high-contrast token entries are non-empty', () => {
    expect(darkTokenEntries.length).toBeGreaterThan(0);
    expect(highContrastTokenEntries.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 5. CSS output validation
// ---------------------------------------------------------------------------

describe('css output validation', () => {
  it('tokensCSS contains :root block', () => {
    expect(tokensCSS).toContain(':root {');
    expect(tokensCSS).toContain('}');
  });

  it('tokensCSS contains all light-mode token declarations', () => {
    for (const entry of tokenEntries) {
      expect(
        tokensCSS,
        `tokensCSS missing declaration for ${entry.name}`,
      ).toContain(`${entry.name}: ${entry.value};`);
    }
  });

  it('darkMediaCSS targets prefers-color-scheme media query', () => {
    expect(darkMediaCSS).toContain('@media (prefers-color-scheme: dark)');
    expect(darkMediaCSS).toContain(':root:not([data-theme="light"])');
  });

  it('darkManualCSS targets [data-theme="dark"] selector', () => {
    expect(darkManualCSS).toContain(':root[data-theme="dark"]');
  });

  it('fullTokensCSS includes both light and dark declarations', () => {
    expect(fullTokensCSS).toContain(':root {');
    expect(fullTokensCSS).toContain('@media (prefers-color-scheme: dark)');
    expect(fullTokensCSS).toContain(':root[data-theme="dark"]');
  });

  it('generated CSS has correct custom property format', () => {
    const lines = tokensCSS.split('\n').filter((l) => l.includes(':'));
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('--hx-')) {
        expect(trimmed).toMatch(/^--hx-[\w-]+:\s*.+;$/);
      }
    }
  });

  it('light token count matches tokenEntries length', () => {
    const declarations = tokensCSS
      .split('\n')
      .filter((l) => l.trim().startsWith('--hx-'));
    expect(declarations).toHaveLength(tokenEntries.length);
  });
});

// ---------------------------------------------------------------------------
// 6. Token documentation
// ---------------------------------------------------------------------------

describe('token documentation', () => {
  it('tokens with description have non-empty description strings', () => {
    const withDesc = tokenEntries.filter(
      (t) => t.description !== undefined && t.description !== null,
    );
    const violations = withDesc.filter((t) => (t.description ?? '').trim() === '');
    expect(
      violations,
      `Tokens with blank descriptions: ${violations.map((v) => v.name).join(', ')}`,
    ).toHaveLength(0);
  });

  it('error-text token has a WCAG contrast description', () => {
    const errorTextToken = tokenEntries.find((t) => t.name === '--hx-color-error-text');
    expect(errorTextToken).toBeDefined();
    expect(errorTextToken!.description).toBeDefined();
    expect(errorTextToken!.description!.toLowerCase()).toContain('wcag');
  });

  it('success-text token has a WCAG contrast description', () => {
    const successTextToken = tokenEntries.find((t) => t.name === '--hx-color-success-text');
    expect(successTextToken).toBeDefined();
    expect(successTextToken!.description).toBeDefined();
    expect(successTextToken!.description!.toLowerCase()).toContain('wcag');
  });

  it('all token entries have required fields: name, value, category, path', () => {
    for (const token of tokenEntries) {
      expect(token.name).toBeTruthy();
      expect(token.value).toBeTruthy();
      expect(token.category).toBeTruthy();
      expect(Array.isArray(token.path)).toBe(true);
      expect(token.path.length).toBeGreaterThan(0);
    }
  });

  it('high-contrast tokens with descriptions mention contrast ratios', () => {
    const hcWithDesc = highContrastTokenEntries.filter(
      (t) => t.description && t.description.includes(':1'),
    );
    expect(hcWithDesc.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. WCAG 2.1 AA contrast ratio validation
// ---------------------------------------------------------------------------

describe('wcag 2.1 aa contrast ratio checks', () => {
  it('primary-500 on white meets WCAG AA for UI components (3:1)', () => {
    const primary500 = tokenMap['--hx-color-primary-500'];
    expect(primary500).toBeDefined();
    const ratio = contrastRatio(primary500!, '#FFFFFF');
    expect(
      ratio,
      `--hx-color-primary-500 (${primary500}) on white: ${ratio.toFixed(2)}:1 — need 3:1`,
    ).toBeGreaterThanOrEqual(3);
  });

  it('error-500 on white has sufficient contrast for UI elements (3:1)', () => {
    const error500 = tokenMap['--hx-color-error-500'];
    expect(error500).toBeDefined();
    const ratio = contrastRatio(error500!, '#FFFFFF');
    expect(
      ratio,
      `--hx-color-error-500 (${error500}) on white: ${ratio.toFixed(2)}:1 — need 3:1`,
    ).toBeGreaterThanOrEqual(3);
  });

  it('neutral-900 (primary text) on white meets WCAG AA for text (4.5:1)', () => {
    const neutral900 = tokenMap['--hx-color-neutral-900'];
    expect(neutral900).toBeDefined();
    const ratio = contrastRatio(neutral900!, '#FFFFFF');
    expect(
      ratio,
      `--hx-color-neutral-900 (${neutral900}) on white: ${ratio.toFixed(2)}:1 — need 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('neutral-600 (secondary text) on white meets WCAG AA for text (4.5:1)', () => {
    const neutral600 = tokenMap['--hx-color-neutral-600'];
    expect(neutral600).toBeDefined();
    const ratio = contrastRatio(neutral600!, '#FFFFFF');
    expect(
      ratio,
      `--hx-color-neutral-600 (${neutral600}) on white: ${ratio.toFixed(2)}:1 — need 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('error-text (#B91C1C) on white meets WCAG AA for text (4.5:1)', () => {
    // Documented in tokens.json as 5.08:1 on white
    const ratio = contrastRatio('#B91C1C', '#FFFFFF');
    expect(
      ratio,
      `error-text #B91C1C on white: ${ratio.toFixed(2)}:1 — need 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('success-text (#15803D) on white meets WCAG AA for text (4.5:1)', () => {
    // Documented in tokens.json as 4.55:1 on white
    const ratio = contrastRatio('#15803D', '#FFFFFF');
    expect(
      ratio,
      `success-text #15803D on white: ${ratio.toFixed(2)}:1 — need 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('high-contrast primary-500 (#3B82F6) on black exceeds WCAG AA for text (4.5:1)', () => {
    const ratio = contrastRatio('#3B82F6', '#000000');
    expect(
      ratio,
      `HC primary-500 #3B82F6 on black: ${ratio.toFixed(2)}:1 — need 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('white text on primary-500 meets WCAG AA large text (3:1)', () => {
    const primary500 = tokenMap['--hx-color-primary-500'];
    expect(primary500).toBeDefined();
    const ratio = contrastRatio('#FFFFFF', primary500!);
    expect(
      ratio,
      `White on primary-500 (${primary500}): ${ratio.toFixed(2)}:1 — need 3:1 for large text`,
    ).toBeGreaterThanOrEqual(3);
  });
});
