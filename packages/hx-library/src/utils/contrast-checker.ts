/**
 * WCAG 2.1 contrast ratio calculation utilities.
 *
 * Pure functions with zero side effects. Tree-shakeable when imported
 * individually. All calculations follow the W3C WCAG 2.1 specification:
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * Healthcare requirement: clinical staff and patients need high-contrast
 * mode in varying lighting conditions. These utilities validate that
 * token pairs meet WCAG AA (4.5:1) and AAA (7:1) contrast ratios.
 */

/** Result of validating a foreground/background token pair */
export interface ContrastValidation {
  /** The calculated contrast ratio (e.g. 4.5) */
  ratio: number;
  /** Whether the pair meets WCAG AA for normal text (4.5:1) */
  meetsAA: boolean;
  /** Whether the pair meets WCAG AA for large text (3:1) */
  meetsAALargeText: boolean;
  /** Whether the pair meets WCAG AAA for normal text (7:1) */
  meetsAAA: boolean;
  /** Whether the pair meets WCAG AAA for large text (4.5:1) */
  meetsAAALargeText: boolean;
}

/**
 * Parse a hex color string into its RGB components.
 * Supports 3-digit (#RGB), 4-digit (#RGBA), 6-digit (#RRGGBB),
 * and 8-digit (#RRGGBBAA) hex values.
 *
 * Returns null if the input is not a valid hex color.
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace('#', '');

  if (!/^[0-9a-fA-F]{3,8}$/.test(clean)) {
    return null;
  }

  let r: number;
  let g: number;
  let b: number;

  if (clean.length === 3 || clean.length === 4) {
    const rChar = clean[0];
    const gChar = clean[1];
    const bChar = clean[2];
    if (rChar === undefined || gChar === undefined || bChar === undefined) {
      return null;
    }
    r = parseInt(rChar + rChar, 16);
    g = parseInt(gChar + gChar, 16);
    b = parseInt(bChar + bChar, 16);
  } else if (clean.length === 6 || clean.length === 8) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return null;
  }

  return { r, g, b };
}

/**
 * Calculate the relative luminance of a color per WCAG 2.1.
 *
 * The formula converts sRGB values to linear RGB, then computes
 * luminance as: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(hex: string): number {
  const parsed = parseHexColor(hex);
  if (parsed === null) {
    return 0;
  }

  const { r, g, b } = parsed;

  const toLinear = (c: number): number => {
    const srgb = c / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate the contrast ratio between two colors per WCAG 2.1.
 *
 * The contrast ratio is defined as (L1 + 0.05) / (L2 + 0.05) where
 * L1 is the lighter of the two luminance values and L2 is the darker.
 *
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a contrast ratio meets WCAG AA requirements.
 *
 * WCAG AA requires:
 * - 4.5:1 for normal text (< 18pt or < 14pt bold)
 * - 3:1 for large text (>= 18pt or >= 14pt bold)
 *
 * @param ratio - The contrast ratio to check
 * @param largeText - Whether to use the large text threshold (3:1 instead of 4.5:1)
 */
export function meetsAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if a contrast ratio meets WCAG AAA requirements.
 *
 * WCAG AAA requires:
 * - 7:1 for normal text
 * - 4.5:1 for large text
 *
 * @param ratio - The contrast ratio to check
 * @param largeText - Whether to use the large text threshold (4.5:1 instead of 7:1)
 */
export function meetsAAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Validate a foreground/background color pair against all WCAG contrast levels.
 *
 * Returns a comprehensive result object with the calculated ratio and
 * pass/fail status for AA and AAA at both normal and large text sizes.
 */
export function validateTokenPair(fg: string, bg: string): ContrastValidation {
  const ratio = getContrastRatio(fg, bg);

  return {
    ratio: Math.round(ratio * 100) / 100,
    meetsAA: meetsAA(ratio),
    meetsAALargeText: meetsAA(ratio, true),
    meetsAAA: meetsAAA(ratio),
    meetsAAALargeText: meetsAAA(ratio, true),
  };
}
