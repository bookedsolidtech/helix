import { describe, it, expect } from 'vitest';
import {
  parseHexColor,
  getRelativeLuminance,
  getContrastRatio,
  meetsAA,
  meetsAAA,
  validateTokenPair,
} from './contrast-checker.js';

describe('contrast-checker', () => {
  // ─── parseHexColor ───

  describe('parseHexColor', () => {
    it('parses 6-digit hex', () => {
      expect(parseHexColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('parses 6-digit hex without hash', () => {
      expect(parseHexColor('00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('parses 3-digit hex', () => {
      expect(parseHexColor('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('parses 3-digit hex to correct expanded values', () => {
      expect(parseHexColor('#ABC')).toEqual({ r: 170, g: 187, b: 204 });
    });

    it('parses 8-digit hex (ignores alpha)', () => {
      expect(parseHexColor('#FF000080')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns null for invalid input', () => {
      expect(parseHexColor('not-a-color')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseHexColor('')).toBeNull();
    });

    it('handles lowercase hex', () => {
      expect(parseHexColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles whitespace', () => {
      expect(parseHexColor('  #FF0000  ')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  // ─── getRelativeLuminance ───

  describe('getRelativeLuminance', () => {
    it('returns 1 for white', () => {
      expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1, 2);
    });

    it('returns 0 for black', () => {
      expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 5);
    });

    it('returns correct luminance for mid-gray', () => {
      // #808080 = sRGB 128/255 each
      const lum = getRelativeLuminance('#808080');
      expect(lum).toBeGreaterThan(0.2);
      expect(lum).toBeLessThan(0.25);
    });

    it('returns 0 for invalid color', () => {
      expect(getRelativeLuminance('invalid')).toBe(0);
    });
  });

  // ─── getContrastRatio ───

  describe('getContrastRatio', () => {
    it('returns 21:1 for black on white', () => {
      expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    });

    it('returns 21:1 for white on black (order independent)', () => {
      expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    });

    it('returns 1:1 for same color', () => {
      expect(getContrastRatio('#2563EB', '#2563EB')).toBeCloseTo(1, 1);
    });

    it('calculates correct ratio for primary-500 on white', () => {
      // #2563EB (primary-500) on white should be around 4.56:1
      const ratio = getContrastRatio('#2563EB', '#FFFFFF');
      expect(ratio).toBeGreaterThan(4);
      expect(ratio).toBeLessThan(5);
    });

    it('calculates correct ratio for error-600 on white', () => {
      // #B91C1C (error-600) on white — documented as 5.08:1
      const ratio = getContrastRatio('#B91C1C', '#FFFFFF');
      expect(ratio).toBeGreaterThan(5);
      expect(ratio).toBeLessThan(5.5);
    });
  });

  // ─── meetsAA ───

  describe('meetsAA', () => {
    it('returns true for ratio >= 4.5 (normal text)', () => {
      expect(meetsAA(4.5)).toBe(true);
      expect(meetsAA(7)).toBe(true);
    });

    it('returns false for ratio < 4.5 (normal text)', () => {
      expect(meetsAA(4.49)).toBe(false);
      expect(meetsAA(3)).toBe(false);
    });

    it('returns true for ratio >= 3 (large text)', () => {
      expect(meetsAA(3, true)).toBe(true);
      expect(meetsAA(4.5, true)).toBe(true);
    });

    it('returns false for ratio < 3 (large text)', () => {
      expect(meetsAA(2.99, true)).toBe(false);
    });
  });

  // ─── meetsAAA ───

  describe('meetsAAA', () => {
    it('returns true for ratio >= 7 (normal text)', () => {
      expect(meetsAAA(7)).toBe(true);
      expect(meetsAAA(21)).toBe(true);
    });

    it('returns false for ratio < 7 (normal text)', () => {
      expect(meetsAAA(6.99)).toBe(false);
      expect(meetsAAA(4.5)).toBe(false);
    });

    it('returns true for ratio >= 4.5 (large text)', () => {
      expect(meetsAAA(4.5, true)).toBe(true);
      expect(meetsAAA(7, true)).toBe(true);
    });

    it('returns false for ratio < 4.5 (large text)', () => {
      expect(meetsAAA(4.49, true)).toBe(false);
    });
  });

  // ─── validateTokenPair ───

  describe('validateTokenPair', () => {
    it('validates black on white as meeting all levels', () => {
      const result = validateTokenPair('#000000', '#FFFFFF');
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.meetsAA).toBe(true);
      expect(result.meetsAALargeText).toBe(true);
      expect(result.meetsAAA).toBe(true);
      expect(result.meetsAAALargeText).toBe(true);
    });

    it('validates low-contrast pair as failing all levels', () => {
      // Very light gray on white
      const result = validateTokenPair('#F0F0F0', '#FFFFFF');
      expect(result.ratio).toBeLessThan(1.5);
      expect(result.meetsAA).toBe(false);
      expect(result.meetsAALargeText).toBe(false);
      expect(result.meetsAAA).toBe(false);
      expect(result.meetsAAALargeText).toBe(false);
    });

    it('validates HC text primary (#FFFFFF) on HC surface (#000000) meets AAA', () => {
      const result = validateTokenPair('#FFFFFF', '#000000');
      expect(result.meetsAAA).toBe(true);
      expect(result.ratio).toBeCloseTo(21, 0);
    });

    it('validates HC link (#FFFF00) on HC surface (#000000) meets AAA', () => {
      const result = validateTokenPair('#FFFF00', '#000000');
      expect(result.meetsAAA).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('validates HC error-text (#FCA5A5) on HC surface (#000000) meets AAA', () => {
      const result = validateTokenPair('#FCA5A5', '#000000');
      expect(result.meetsAAA).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('validates HC success-text (#86EFAC) on HC surface (#000000) meets AAA', () => {
      const result = validateTokenPair('#86EFAC', '#000000');
      expect(result.meetsAAA).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('validates HC disabled text (#767676) on HC surface (#000000) meets AA', () => {
      const result = validateTokenPair('#767676', '#000000');
      expect(result.meetsAA).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('rounds ratio to 2 decimal places', () => {
      const result = validateTokenPair('#000000', '#FFFFFF');
      const decimalPlaces = result.ratio.toString().split('.')[1]?.length ?? 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  // ─── Healthcare-specific validations ───

  describe('Healthcare high-contrast token validation', () => {
    const HC_SURFACE = '#000000';

    it('all HC semantic colors meet at least AA on HC surface', () => {
      const hcColors = [
        { name: 'primary-500', hex: '#3B82F6' },
        { name: 'secondary-500', hex: '#22D3EE' },
        { name: 'error-500', hex: '#F87171' },
        { name: 'warning-500', hex: '#FBBF24' },
        { name: 'success-500', hex: '#4ADE80' },
        { name: 'info-500', hex: '#38BDF8' },
      ];

      for (const color of hcColors) {
        const result = validateTokenPair(color.hex, HC_SURFACE);
        expect(
          result.meetsAA,
          `${color.name} (${color.hex}) should meet AA on ${HC_SURFACE}, got ratio ${result.ratio}`,
        ).toBe(true);
      }
    });

    it('HC text tokens meet AAA on HC surface', () => {
      const hcTextColors = [
        { name: 'text-primary', hex: '#FFFFFF' },
        { name: 'text-secondary', hex: '#FFFFFF' },
        { name: 'text-muted', hex: '#E0E0E0' },
        { name: 'link', hex: '#FFFF00' },
      ];

      for (const color of hcTextColors) {
        const result = validateTokenPair(color.hex, HC_SURFACE);
        expect(
          result.meetsAAA,
          `${color.name} (${color.hex}) should meet AAA on ${HC_SURFACE}, got ratio ${result.ratio}`,
        ).toBe(true);
      }
    });

    it('HC focus ring color meets AAA on HC surface', () => {
      const result = validateTokenPair('#FFFF00', HC_SURFACE);
      expect(result.meetsAAA).toBe(true);
    });
  });
});
