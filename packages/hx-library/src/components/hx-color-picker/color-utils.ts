// ─── Color utility types ──────────────────────────────────────────────────────

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
  a: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv';

// ─── Color utilities ──────────────────────────────────────────────────────────

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
  if (h.length === 4) h = h.replace(/(.)/g, '$1$1');
  if (h.length === 6) h += 'ff';
  if (h.length !== 8) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return {
    r: (n >>> 24) & 0xff,
    g: (n >>> 16) & 0xff,
    b: (n >>> 8) & 0xff,
    a: (n & 0xff) / 255,
  };
}

function toHex2(n: number): string {
  return Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, '0');
}

export function rgbToHex(rgb: RGB, includeAlpha: boolean): string {
  const base = `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
  if (includeAlpha && rgb.a < 1) return base + toHex2(rgb.a * 255);
  return base;
}

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100, a: rgb.a };
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: hsv.a };
}

export function rgbToHsl(rgb: RGB): { h: number; s: number; l: number; a: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100, a: rgb.a };
}

// P2-1: parseColor handles HSV/HSVA input strings for round-trip correctness
export function parseColor(value: string): HSV | null {
  if (!value) return null;

  if (value.startsWith('#')) {
    const rgb = hexToRgb(value);
    return rgb ? rgbToHsv(rgb) : null;
  }

  const rgbMatch = value.match(
    /rgba?\(\s*(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*(?:\/|,)\s*([\d.]+))?\s*\)/,
  );
  if (rgbMatch) {
    const [, rm1, rm2, rm3, rm4] = rgbMatch;
    return rgbToHsv({
      r: parseInt(rm1 ?? '0', 10),
      g: parseInt(rm2 ?? '0', 10),
      b: parseInt(rm3 ?? '0', 10),
      a: rm4 !== undefined ? parseFloat(rm4) : 1,
    });
  }

  const hslMatch = value.match(
    /hsla?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)%(?:\s*,\s*|\s+)([\d.]+)%(?:\s*(?:\/|,)\s*([\d.]+))?\s*\)/,
  );
  if (hslMatch) {
    const [, hm1, hm2, hm3, hm4] = hslMatch;
    const h = parseFloat(hm1 ?? '0');
    const s = parseFloat(hm2 ?? '0') / 100;
    const l = parseFloat(hm3 ?? '0') / 100;
    const a = hm4 !== undefined ? parseFloat(hm4) : 1;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return rgbToHsv({
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a,
    });
  }

  // P2-1: Support HSV/HSVA input strings (component's own output format)
  const hsvMatch = value.match(
    /hsva?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  if (hsvMatch) {
    const [, hm1, hm2, hm3, hm4] = hsvMatch;
    return {
      h: parseFloat(hm1 ?? '0'),
      s: parseFloat(hm2 ?? '0'),
      v: parseFloat(hm3 ?? '0'),
      a: hm4 !== undefined ? parseFloat(hm4) : 1,
    };
  }

  return null;
}

export function formatColor(hsv: HSV, format: ColorFormat, includeAlpha: boolean): string {
  const rgb = hsvToRgb(hsv);
  switch (format) {
    case 'hex':
      return rgbToHex(rgb, includeAlpha);
    case 'rgb': {
      if (includeAlpha && hsv.a < 1) {
        return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${Math.round(hsv.a * 100) / 100})`;
      }
      return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
    }
    case 'hsl': {
      const hsl = rgbToHsl(rgb);
      if (includeAlpha && hsv.a < 1) {
        return `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}% / ${Math.round(hsv.a * 100) / 100})`;
      }
      return `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
    }
    case 'hsv': {
      if (includeAlpha && hsv.a < 1) {
        return `hsva(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%, ${Math.round(hsv.a * 100) / 100})`;
      }
      return `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`;
    }
  }
}
