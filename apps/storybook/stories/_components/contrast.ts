/**
 * WCAG 2.1 relative-luminance contrast computation. Used by the docs
 * MDX components to print inline contrast ratios on surface cards and
 * AAA cert badges.
 *
 * The formula is the standard sRGB-relative-luminance computation from
 * WCAG 2.x §1.4.3 / §1.4.6:
 *   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where each channel is gamma-decoded to linear-light first.
 *
 * Returns 1.0 (no contrast) for malformed input rather than throwing —
 * docs MDX should never crash because a single token reference resolved
 * to something unparsable.
 */

function parseHex(input: string): { r: number; g: number; b: number } | null {
  const clean = input.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  return null;
}

function parseRgb(input: string): { r: number; g: number; b: number } | null {
  // Browsers normalize getComputedStyle color values to either
  //   rgb(R, G, B)
  //   rgba(R, G, B, A)
  //   rgb(R G B)              (color-4 syntax in newer engines)
  //   rgb(R G B / A)          (color-4 syntax in newer engines)
  // Match all four with a permissive regex, bytes only (we ignore alpha
  // because contrast computation here assumes opaque foreground/background;
  // tokens are designed against opaque surfaces).
  const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(input.trim());
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return { r, g, b };
}

/**
 * Normalize an arbitrary CSS color string to an uppercase `#RRGGBB` hex
 * value. Accepts hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`) and rgb()/rgba()
 * forms — the two shapes `getComputedStyle` produces for resolved tokens
 * across every browser we care about. Returns the empty string when the
 * value cannot be parsed; callers must handle that path explicitly.
 */
export function cssColorToHex(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const rgb = trimmed.startsWith('#') ? parseHex(trimmed) : parseRgb(trimmed);
  if (!rgb) return '';
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function channelLuminance(byte: number): number {
  const c = byte / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(value: string): number {
  const trimmed = value.trim();
  const rgb = trimmed.startsWith('#')
    ? parseHex(trimmed)
    : (parseRgb(trimmed) ?? parseHex(trimmed));
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/**
 * WCAG contrast ratio between two CSS color values. Accepts hex
 * (`#RGB`, `#RRGGBB`) or `rgb()`/`rgba()` strings — both shapes are
 * produced by `getComputedStyle` when reading resolved CSS custom
 * properties. Returns 1.0 when either value cannot be parsed.
 */
export function contrastRatio(colorA: string, colorB: string): number {
  const a = relativeLuminance(colorA);
  const b = relativeLuminance(colorB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Classify a contrast ratio against WCAG 2.1 thresholds:
 *   AAA       — ≥ 7.0 (normal text)
 *   AA        — ≥ 4.5 (normal text)
 *   AA-large  — ≥ 3.0 (large text / non-text UI)
 *   Fail      — below 3.0
 */
export function gradeRatio(ratio: number): 'AAA' | 'AA' | 'AA-large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'Fail';
}
