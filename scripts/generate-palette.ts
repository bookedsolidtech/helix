#!/usr/bin/env tsx
/**
 * "Precision Cool" palette generator — Helix 3.2.0.
 *
 * Deterministic OKLCH ramp generator. Given an anchor hex + anchor stop +
 * per-family curve (lightness range, chroma peak, hue shift), emits all 11
 * primitive stops (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).
 *
 * Usage:
 *   pnpm tsx scripts/generate-palette.ts           # emit JSON for all 7 families
 *   pnpm tsx scripts/generate-palette.ts primary   # emit single family
 *
 * Zero runtime deps. Hand-rolled OKLCH→linear-sRGB→sRGB per:
 *   https://bottosson.github.io/posts/oklab/
 *   https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = null;

// ─── Types ───

type Stop = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

type Oklch = { L: number; C: number; h: number };

interface RampCurve {
  /** Perceptual lightness at each stop. Hand-tuned per family. */
  L: Record<Stop, number>;
  /** Chroma (saturation) at each stop. Bell curve — peaks mid-ramp. */
  C: Record<Stop, number>;
  /** Hue in degrees. Can drift per stop if `hueShift` is nonzero. */
  baseHue: number;
  /** Per-stop hue delta (mostly 0; small shifts warm/cool the tails). */
  hueShift?: Partial<Record<Stop, number>>;
}

interface FamilySpec {
  /** Anchor hex (#RRGGBB). */
  anchor: string;
  /** Stop the anchor is pinned to. */
  anchorStop: Stop;
  /** Curve parameters — L/C/h per stop. */
  curve: RampCurve;
}

const STOPS: Stop[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// ─── sRGB ↔ linear-sRGB ↔ OKLab ↔ OKLCh ───

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '');
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const to8 = (v: number): string =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${to8(r)}${to8(g)}${to8(b)}`;
}

/** Linear sRGB → OKLab (Björn Ottosson). */
function linearRgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** OKLab → linear sRGB. */
function oklabToLinearRgb([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Convert {L, C, h} → hex, gamut-mapped via chroma reduction (CSS Color 4 intent). */
function oklchToHex({ L, C, h }: Oklch): string {
  const hr = (h * Math.PI) / 180;
  let c = C;
  // Binary-search-lite: if out of sRGB gamut, reduce chroma until in-gamut.
  for (let i = 0; i < 20; i += 1) {
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const lin = oklabToLinearRgb([L, a, b]);
    if (lin[0] >= 0 && lin[0] <= 1 && lin[1] >= 0 && lin[1] <= 1 && lin[2] >= 0 && lin[2] <= 1) {
      const srgb: [number, number, number] = [
        linearToSrgb(lin[0]),
        linearToSrgb(lin[1]),
        linearToSrgb(lin[2]),
      ];
      return rgbToHex(srgb);
    }
    c *= 0.92; // pull chroma in 8% at a time
  }
  // Last-resort: clip to [0,1] in linear light and ship.
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const lin = oklabToLinearRgb([L, a, b]);
  const srgb: [number, number, number] = [
    linearToSrgb(clamp01(lin[0])),
    linearToSrgb(clamp01(lin[1])),
    linearToSrgb(clamp01(lin[2])),
  ];
  return rgbToHex(srgb);
}

/** Hex → OKLCh. */
function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bb] = linearRgbToOklab([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]);
  const C = Math.sqrt(a * a + bb * bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

// ─── Ramp generation ───

/**
 * Generate an 11-stop ramp anchored on a specific hex at a specific stop.
 * The anchor's OKLCh is measured, then used to scale the curve so the emitted
 * hex at `anchorStop` round-trips as close to the input as gamut allows.
 */
export function generateRamp(spec: FamilySpec): Record<Stop, string> {
  const anchorOklch = hexToOklch(spec.anchor);
  // Chroma auto-scales so curve's 1.0 at the anchor stop resolves to the
  // anchor's measured chroma. Lightness does NOT auto-scale — the ladder is
  // authoritative per stop (otherwise darker anchors drag the bright end down
  // and the 50/100 stops never reach true page-background brightness).
  const cScale = anchorOklch.C / Math.max(spec.curve.C[spec.anchorStop], 1e-6);
  const out = {} as Record<Stop, string>;
  for (const stop of STOPS) {
    const L = clamp01(spec.curve.L[stop]);
    const C = Math.max(0, spec.curve.C[stop] * cScale);
    const h = spec.curve.baseHue + (spec.curve.hueShift?.[stop] ?? 0);
    out[stop] = oklchToHex({ L, C, h });
  }
  // Pin the anchor stop to the exact input hex so small rounding errors don't
  // drift the brand color.
  out[spec.anchorStop] = spec.anchor.toUpperCase();
  return out;
}

// ─── Family curves ───
//
// Every family uses the same broad-stroke lightness ladder for visual
// consistency across ramps, but each has its own chroma envelope + hue so the
// palette reads as one family, not seven disconnected ramps.

/** Shared lightness ladder, tuned for perceptual evenness (OKLab-L, not HSL).
 * Pulled slightly darker at the light end so chroma can express without
 * washing stops to near-white. L[600]≈0.55 aligns with the mean anchor L
 * across the 7 families so 500↔600↔700 transitions feel even-spaced. */
const L_LADDER: Record<Stop, number> = {
  '50': 0.97,
  '100': 0.94,
  '200': 0.884,
  '300': 0.81,
  '400': 0.715,
  '500': 0.625,
  '600': 0.54,
  '700': 0.455,
  '800': 0.37,
  '900': 0.29,
  '950': 0.205,
};

/** Chroma envelope for chromatic families (primary/accent/success/warning/error/info).
 * Expressed as a SHAPE (ratios relative to the anchor stop's measured chroma,
 * which is always set to 1.0 in the generator via auto-scale). Bell-shaped,
 * peaks at 500–600, richer-than-Tailwind tips. */
const C_CHROMATIC: Record<Stop, number> = {
  '50': 0.18,
  '100': 0.28,
  '200': 0.48,
  '300': 0.68,
  '400': 0.88,
  '500': 1.0,
  '600': 1.0, // anchor baseline
  '700': 0.9,
  '800': 0.74,
  '900': 0.52,
  '950': 0.33,
};

/** Neutral chroma envelope — SHAPE (ratios relative to the anchor stop's
 * measured chroma). Very restrained; the anchor's ~0.027 chroma is the peak. */
const C_NEUTRAL: Record<Stop, number> = {
  '50': 0.22,
  '100': 0.28,
  '200': 0.35,
  '300': 0.45,
  '400': 0.6,
  '500': 0.8,
  '600': 1.0, // anchor baseline (~0.027)
  '700': 1.05,
  '800': 1.1,
  '900': 1.15,
  '950': 1.2,
};

/** Neutral hue drift — cool blue at the dark end (baseHue 255°),
 * drifts toward 130° (neutral warm-gray) at the bright end to reduce screen glare.
 * 130° in OKLCh is a muted olive/putty — subtle at these chroma levels. */
const NEUTRAL_HUE_SHIFT: Partial<Record<Stop, number>> = {
  '50': -125, // 255 → 130 (slight warm drift, barely perceptible)
  '100': -120,
  '200': -115,
  '300': -100,
  '400': -80,
  '500': -50,
  '600': -20,
  '700': -5,
  '800': 0,
  '900': 0,
  '950': 0,
};

// ─── Family specs ───

/** Primary: brand teal. Anchor #0F7078 at 600. */
const PRIMARY: FamilySpec = {
  anchor: '#0F7078',
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 195, // teal (cyan-green lean)
  },
};

/** Accent: cool steel-indigo. Anchor 600 — NOT Tailwind violet, NOT teal-adjacent.
 * Hue 265° = indigo with a steel lean; distinct from primary-700 (~195°) by >70° ΔH. */
const ACCENT: FamilySpec = {
  anchor: '#3A4BC9', // steel-indigo, ~AA at 600 on white
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 265,
  },
};

/** Neutral: hand-tuned cool-gray, slight blue cast at dark end, warm drift at bright end.
 * Uses its own L ladder because the neutral anchor (L≈0.44) sits lower than the
 * chromatic average; if we reused L_LADDER, 600/700/800 would collapse. */
const L_LADDER_NEUTRAL: Record<Stop, number> = {
  '50': 0.975,
  '100': 0.945,
  '200': 0.885,
  '300': 0.795,
  '400': 0.68,
  '500': 0.56,
  '600': 0.44, // natural L of #4A5362
  '700': 0.358,
  '800': 0.285,
  '900': 0.205,
  '950': 0.13,
};

const NEUTRAL: FamilySpec = {
  anchor: '#4A5362', // neutral-600, cool but not slate
  anchorStop: '600',
  curve: {
    L: L_LADDER_NEUTRAL,
    C: C_NEUTRAL,
    baseHue: 255, // base: cool blue-gray
    hueShift: NEUTRAL_HUE_SHIFT,
  },
};

/** Success: deeper than Tailwind green-500. Reads "confident", not "neon".
 * Pairs with on-success = neutral-900 (fixed in commit 1). */
const SUCCESS: FamilySpec = {
  anchor: '#0E8A4A', // rich green, deeper than #16A34A
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 150, // green with tiny blue lean — NOT yellowy spring
  },
};

/** Warning: warmer than Tailwind amber, less yellow than gold. "Alert but not alarmed." */
const WARNING: FamilySpec = {
  anchor: '#B8650E', // warm burnt amber at 600
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 60, // warm orange-gold, NOT Tailwind amber 41°
  },
};

/** Error: powerful red, not delete-button red. Anchor #C92A2A at 600 per Jake. */
const ERROR: FamilySpec = {
  anchor: '#C92A2A',
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 28, // warm red, distinct from warning's 60°
  },
};

/** Info: clear medium-blue, distinguishable from primary teal. Anchor #1B6FD4 at 600. */
const INFO: FamilySpec = {
  anchor: '#1B6FD4',
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 250, // blue, 55° off teal primary (195°) — readable distinction
  },
};

/** Secondary: deep sea-teal. Coordinated cousin of primary (195° teal), but
 * shifted cooler to 175° and lower-chroma at the peak — reads as "primary's
 * quieter companion" (think: secondary button against a primary CTA).
 * Distinct from accent-indigo (265°) and info-blue (250°). */
const SECONDARY: FamilySpec = {
  anchor: '#0F6B7E', // deeper sea-teal than primary, AA on white
  anchorStop: '600',
  curve: {
    L: L_LADDER,
    C: C_CHROMATIC,
    baseHue: 205, // 10° toward blue from primary's 195°
  },
};

const FAMILIES: Record<string, FamilySpec> = {
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT,
  neutral: NEUTRAL,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
};

// ─── CLI ───

function generateAll(): Record<string, Record<Stop, string>> {
  const out: Record<string, Record<Stop, string>> = {};
  for (const [name, spec] of Object.entries(FAMILIES)) {
    out[name] = generateRamp(spec);
  }
  return out;
}

export { FAMILIES, generateAll };

// Entry point when run directly (tsx scripts/generate-palette.ts [family])
// process is globally available in Node.
const argv = (globalThis as unknown as { process?: { argv: string[] } }).process?.argv ?? [];
const isMain = argv[1]?.endsWith('generate-palette.ts');
if (isMain) {
  const family = argv[2];
  const all = generateAll();
  if (family) {
    if (!(family in all)) {
      // eslint-disable-next-line no-console
      console.error(`Unknown family: ${family}. Known: ${Object.keys(all).join(', ')}`);
      (globalThis as unknown as { process: { exit: (code: number) => void } }).process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ [family]: all[family] }, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(all, null, 2));
  }
}
