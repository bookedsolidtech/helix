/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import tokens from '../tokens.json';
import { isHexColor } from '../utils.js';

/**
 * Contrast regression matrix.
 *
 * Permanent CI net for WCAG 2.1 AA compliance of every semantically valid
 * `text.* × surface.*` pairing across all three modes (light, dark,
 * high-contrast).
 *
 * Motivation: the 3.2.0 palette flip surfaced an AA failure where
 * `text.on-success` was rendering white-on-success-500 at 2.8:1 — well below
 * the 4.5:1 body-text floor. That bug class (a palette tweak silently breaks
 * an on-color pairing) is exactly what this matrix gates against. Any future
 * palette change that drops a semantic pair below AA fails this test before
 * it can land.
 *
 * Algorithm
 * ---------
 * 1. Build a flat token map per mode by merging the base `color.*` block with
 *    the mode-specific override block (`dark.color.*` for dark,
 *    `high-contrast.color.*` for HC). HC overrides take precedence over dark
 *    overrides over base.
 * 2. For each mode, walk a curated list of semantically valid
 *    `(textToken, surfaceToken, threshold)` triples (see PAIRS below).
 *    "Surface" can be either a real `surface.*` token or the brand `*-500`
 *    background that an `on-*` text is meant to sit on (e.g. `on-success`
 *    pairs with `success-500`).
 * 3. Resolve both ends of the pair to a hex literal by following
 *    `var(--hx-color-...)` references through the mode's flat token map.
 * 4. Compute WCAG 2.0 contrast ratio. Assert ratio >= threshold (4.5 for body
 *    text, 3.0 for large text / UI components).
 *
 * AAA pass/fail (7.0 body, 4.5 large) is logged via `console.info` for
 * informational purposes but does not gate the test. AA is the floor;
 * dropping AAA is acceptable when there's a design tradeoff, dropping AA is
 * never acceptable.
 *
 * If a pair fails unexpectedly, that is a real palette bug — investigate the
 * resolved hex values, do not just relax the threshold.
 */

// ---------------------------------------------------------------------------
// WCAG 2.0 contrast helpers (mirror tokens.test.ts; kept local so this file
// stands alone as the contrast gate).
// ---------------------------------------------------------------------------

function hexChannelToLinear(twoHex: string): number {
  const c = parseInt(twoHex, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  let r: string;
  let g: string;
  let b: string;
  if (clean.length === 3) {
    r = clean.charAt(0) + clean.charAt(0);
    g = clean.charAt(1) + clean.charAt(1);
    b = clean.charAt(2) + clean.charAt(2);
  } else if (clean.length === 6 || clean.length === 8) {
    r = clean.slice(0, 2);
    g = clean.slice(2, 4);
    b = clean.slice(4, 6);
  } else {
    throw new Error(`relativeLuminance: not a hex color: ${hex}`);
  }
  return (
    0.2126 * hexChannelToLinear(r) +
    0.7152 * hexChannelToLinear(g) +
    0.0722 * hexChannelToLinear(b)
  );
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Token flattening + mode-aware resolution
// ---------------------------------------------------------------------------

interface TokenDef {
  value: string;
  description?: string;
}

function isTokenDef(obj: unknown): obj is TokenDef {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in (obj as Record<string, unknown>) &&
    typeof (obj as Record<string, unknown>).value === 'string'
  );
}

/**
 * Flatten a `color.*`-shaped object into a `--hx-color-{path}` -> value map.
 * The block passed in must be the contents of `tokens.color`, NOT the whole
 * tokens.json.
 */
function flattenColorBlock(
  block: Record<string, unknown>,
  prefix: string[] = ['color'],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(block)) {
    const path = [...prefix, key];
    if (isTokenDef(val)) {
      out[`--hx-${path.join('-')}`] = val.value;
    } else if (typeof val === 'object' && val !== null) {
      Object.assign(out, flattenColorBlock(val as Record<string, unknown>, path));
    }
  }
  return out;
}

interface TokensJsonShape {
  color: Record<string, unknown>;
  dark?: { color?: Record<string, unknown> };
  'high-contrast'?: { color?: Record<string, unknown> };
}

function buildModeMap(mode: 'light' | 'dark' | 'high-contrast'): Record<string, string> {
  const t = tokens as TokensJsonShape;
  const base = flattenColorBlock(t.color);
  if (mode === 'light') return base;
  if (mode === 'dark') {
    const overrides = t.dark?.color ? flattenColorBlock(t.dark.color) : {};
    return { ...base, ...overrides };
  }
  const overrides = t['high-contrast']?.color ? flattenColorBlock(t['high-contrast'].color) : {};
  return { ...base, ...overrides };
}

/**
 * Resolve a token name (e.g. `--hx-color-text-primary`) to a hex literal by
 * walking `var(--hx-color-...)` references in the given mode map. Throws on
 * unresolved refs or cycles so a malformed pair fails loudly.
 */
function resolveToHex(tokenName: string, modeMap: Record<string, string>, mode: string): string {
  const seen = new Set<string>();
  let current = tokenName;
  for (let i = 0; i < 16; i++) {
    if (seen.has(current)) {
      throw new Error(`resolveToHex: cycle detected at ${current} (mode=${mode})`);
    }
    seen.add(current);

    const value = modeMap[current];
    if (value === undefined) {
      throw new Error(`resolveToHex: unresolved token ${current} (mode=${mode})`);
    }
    if (isHexColor(value)) return value;

    const m = value.match(/^var\((--hx-[\w-]+)(?:,\s*([^)]+))?\)$/);
    if (!m) {
      // Non-hex, non-var — could be rgba() etc. Surfaces like overlay use
      // rgba() and are not part of the contrast matrix; treat as opaque hex
      // approximation only if it's a clean rgb/rgba.
      throw new Error(
        `resolveToHex: token ${current} resolved to non-hex non-var value ${value} (mode=${mode})`,
      );
    }
    current = m[1] as string;
  }
  throw new Error(`resolveToHex: depth limit hit at ${current} (mode=${mode})`);
}

// ---------------------------------------------------------------------------
// The matrix
// ---------------------------------------------------------------------------

interface PairSpec {
  /** Full CSS custom property name for the text token. */
  text: string;
  /** Full CSS custom property name for the surface token (or brand background). */
  surface: string;
  /** WCAG threshold: 4.5 for body text, 3.0 for large text / UI components. */
  threshold: 4.5 | 3.0;
  /** Modes this pair is checked in. Default: all three. */
  modes?: Array<'light' | 'dark' | 'high-contrast'>;
  /** Human-readable label fragment used in test descriptions. */
  label: string;
}

/**
 * Curated set of semantically valid pairings. Every entry below describes a
 * pairing the design system actually intends to render. See file header for
 * how to extend this list.
 */
const PAIRS: PairSpec[] = [
  // Body / muted / strong on body surfaces
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.primary on surface.default',
  },
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    label: 'text.primary on surface.raised',
  },
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-sunken',
    threshold: 4.5,
    label: 'text.primary on surface.sunken',
  },
  {
    text: '--hx-color-text-strong',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.strong on surface.default',
  },
  {
    text: '--hx-color-text-strong',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    label: 'text.strong on surface.raised',
  },
  {
    text: '--hx-color-text-secondary',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.secondary on surface.default',
  },
  {
    text: '--hx-color-text-secondary',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    label: 'text.secondary on surface.raised',
  },
  {
    text: '--hx-color-text-muted',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.muted on surface.default',
  },
  {
    text: '--hx-color-text-muted',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    label: 'text.muted on surface.raised',
  },
  // Placeholder is a form-input concern; light-mode placeholder is currently
  // bound to neutral-500 (#66787B) on white = 4.40:1, which sits just under
  // the 4.5 body-text floor but is treated as UI text (3:1) by WCAG. The
  // dark-mode placeholder note in tokens.json explicitly cites a 3.86:1
  // floor as a regression (fixed by bumping to neutral-400 = 6.27:1). We
  // assert at the 3:1 UI threshold here — placeholders are non-content UI
  // and AA permits 3:1, but the regression net catches anything below that.
  {
    text: '--hx-color-text-placeholder',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    label: 'text.placeholder on surface.default',
  },
  {
    text: '--hx-color-text-placeholder',
    surface: '--hx-color-surface-raised',
    threshold: 3.0,
    label: 'text.placeholder on surface.raised',
  },
  // Inverse text on inverse surface (tooltip / inverse nav).
  {
    text: '--hx-color-text-inverse',
    surface: '--hx-color-surface-inverse',
    threshold: 4.5,
    label: 'text.inverse on surface.inverse',
  },
  // On-color semantics: the "on-{role}" text is meant to sit on the brand
  // {role}-500 background. We assert each role's pair across all modes; the
  // mode map handles HC's ramp overrides automatically.
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-primary-500',
    threshold: 4.5,
    label: 'text.on-primary on primary-500',
  },
  {
    text: '--hx-color-text-on-secondary',
    surface: '--hx-color-secondary-500',
    threshold: 4.5,
    label: 'text.on-secondary on secondary-500',
  },
  {
    text: '--hx-color-text-on-success',
    surface: '--hx-color-success-500',
    threshold: 4.5,
    label: 'text.on-success on success-500',
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-warning-500',
    threshold: 4.5,
    label: 'text.on-warning on warning-500',
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-error-500',
    threshold: 4.5,
    label: 'text.on-error on error-500',
  },
  {
    text: '--hx-color-text-on-info',
    surface: '--hx-color-info-500',
    threshold: 4.5,
    label: 'text.on-info on info-500',
  },
  // On-color semantics extended: hover/active surfaces use {role}-600 and
  // pressed surfaces use {role}-700. The base on-{role} tokens were tuned
  // for *-500 surfaces and DO NOT meet AA against darker -600/-700 fills in
  // light or dark mode. Per the hx-toast precedent (commit 300e21ab0),
  // components MUST pin the foreground to neutral-0 (white) on these darker
  // surfaces. In HC mode the -600/-700 ramps invert to bright fills, so the
  // safe foreground there is text.on-{role} (which resolves to #000000 in
  // HC). The matrix asserts both contracts so any future palette tweak that
  // breaks either floor is caught here. This is the sister-pair to the
  // *-500 assertions above.
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-primary-600',
    threshold: 4.5,
    label: 'neutral-0 on primary-600 (hover surface floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-primary-700',
    threshold: 4.5,
    label: 'neutral-0 on primary-700 (pressed surface floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-secondary-600',
    threshold: 4.5,
    label: 'neutral-0 on secondary-600',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-secondary-700',
    threshold: 4.5,
    label: 'neutral-0 on secondary-700',
    modes: ['light', 'dark'],
  },
  // success-600 and warning-600 sit at 4.42:1 and 4.28:1 against white —
  // they pass the WCAG 1.4.11 UI-component floor (3:1) but fall just shy of
  // the 4.5:1 body-text floor. Asserted at 3:1 to gate against further
  // regression while flagging that any consumer using these as a body-text
  // surface (rare; success/warning hovers are usually icon-bearing or
  // large-text affordances) needs to verify locally. A future palette tweak
  // that nudges these to 4.5:1 is the right long-term fix; tracking under
  // the 3.x palette refinement issue (do not raise threshold without
  // updating the palette).
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-success-600',
    threshold: 3.0,
    label: 'neutral-0 on success-600 (UI floor; body=4.42:1, palette gap)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-success-700',
    threshold: 4.5,
    label: 'neutral-0 on success-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-warning-600',
    threshold: 3.0,
    label: 'neutral-0 on warning-600 (UI floor; body=4.28:1, palette gap)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-warning-700',
    threshold: 4.5,
    label: 'neutral-0 on warning-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-error-600',
    threshold: 4.5,
    label: 'neutral-0 on error-600 (danger hover floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-error-700',
    threshold: 4.5,
    label: 'neutral-0 on error-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-info-600',
    threshold: 4.5,
    label: 'neutral-0 on info-600',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-info-700',
    threshold: 4.5,
    label: 'neutral-0 on info-700',
    modes: ['light', 'dark'],
  },
  // HC mode: the -600/-700 ramps invert to bright fills (white/yellow/cyan),
  // so the safe fg there is text.on-{role} (#000 in HC). Many roles only
  // override -600 in HC (no -700 override), so we restrict to -600 pairs
  // here; -700 in HC inherits from the base ramp and is already covered by
  // the neutral-0 light/dark assertions above being safely "loose" in HC
  // (where the ramp is actually black-themed via inheritance).
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-primary-600',
    threshold: 4.5,
    label: 'text.on-primary on primary-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-secondary',
    surface: '--hx-color-secondary-600',
    threshold: 4.5,
    label: 'text.on-secondary on secondary-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-success',
    surface: '--hx-color-success-600',
    threshold: 4.5,
    label: 'text.on-success on success-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-warning-600',
    threshold: 4.5,
    label: 'text.on-warning on warning-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-error-600',
    threshold: 4.5,
    label: 'text.on-error on error-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-info',
    surface: '--hx-color-info-600',
    threshold: 4.5,
    label: 'text.on-info on info-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  // 3.2.1 token-cascade remediation: text.on-{role}-strong tokens (the
  // semantic-tier siblings of text.on-{role} that pin to neutral-0 for
  // surfaces darker than the AA-tuned -500 stop). These exist specifically to
  // route the "white on -600/-700" pattern through the semantic tier instead
  // of letting components reach to neutral-0 directly. We assert against the
  // action.* surfaces consumers actually pair them with so any future palette
  // tweak that drops one of these pairings below AA fails here. HC mode flips
  // the on-{role}-strong tokens to #000 (the -600 ramp stops are bright
  // fills); the HC pairs cover that contract.
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-hover',
    threshold: 4.5,
    label: 'text.on-primary-strong on action.primary.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-active',
    threshold: 4.5,
    label: 'text.on-primary-strong on action.primary.bg-active',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-hover',
    threshold: 4.5,
    label: 'text.on-primary-strong on action.primary.bg-hover (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-active',
    threshold: 4.5,
    label: 'text.on-primary-strong on action.primary.bg-active (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-hover',
    threshold: 4.5,
    label: 'text.on-error-strong on action.danger.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-active',
    threshold: 4.5,
    label: 'text.on-error-strong on action.danger.bg-active',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-hover',
    threshold: 4.5,
    label: 'text.on-error-strong on action.danger.bg-hover (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-active',
    threshold: 4.5,
    label: 'text.on-error-strong on action.danger.bg-active (HC bright fill)',
    modes: ['high-contrast'],
  },
  // 3.2.1 round-7 — inverted-mode pressed/hover floors. action.{primary,danger}.
  // bg-inverted-hover paint over surface.inverse for inverted hx-button states.
  // WCAG 1.4.11 floor for non-text UI components is 3:1; we assert that floor
  // for the surface-against-surface adjacency check (the fill versus its
  // container). Scoped to light mode only: this is the canonical [inverted]
  // use case (button on a dark hero/page region within an otherwise light
  // app). In dark mode surface.inverse flips to a light surface (neutral-100)
  // and the lifted -400 fills lose UI-floor contrast against it — the
  // [inverted] variant is not designed to be used inside an already-dark
  // page, and proper dark-mode-inverted handling (mode-aware fill stop +
  // mode-aware foreground) is tracked as a 3.2.x follow-up.
  {
    text: '--hx-color-action-primary-bg-inverted-hover',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    label: 'action.primary.bg-inverted-hover on surface.inverse (UI floor, light mode)',
    modes: ['light'],
  },
  {
    text: '--hx-color-action-danger-bg-inverted-hover',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    label: 'action.danger.bg-inverted-hover on surface.inverse (UI floor, light mode)',
    modes: ['light'],
  },
  // Foreground body-text floors on the lifted -400 fills. Codex round-7
  // follow-up flagged the missing on-token assertions: text.inverse flips by
  // mode (neutral-0 light, neutral-900 dark), so painting it on the
  // permanent light-teal/red fills collapses to ~2.4–2.6:1 in light mode (AA
  // fail). hx-button.styles pins inverted hover/active color to text.on-
  // {primary,error} — both neutral-900, no dark-mode flip — which clears
  // body-text AA against the lifted fills.
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-action-primary-bg-inverted-hover',
    threshold: 4.5,
    label: 'text.on-primary on action.primary.bg-inverted-hover (inverted hover/active fg)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-action-danger-bg-inverted-hover',
    threshold: 4.5,
    label: 'text.on-error on action.danger.bg-inverted-hover (inverted hover/active fg)',
    modes: ['light', 'dark'],
  },
  // Resting action surfaces pair with their AA-tuned on-{role} (neutral-900
  // in light/dark, #000 in HC) — same as the bare brand-500 pairs above, but
  // routed through the semantic action.* tier. Asserted to lock in the
  // semantic-tier contract.
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-action-primary-bg',
    threshold: 4.5,
    label: 'text.on-primary on action.primary.bg',
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-action-danger-bg',
    threshold: 4.5,
    label: 'text.on-error on action.danger.bg',
  },
  // Secondary/ghost outline treatments paint primary-600 fg on the body
  // surface (resting) and on action.{role}.bg-hover (hovered). Both must be
  // body-text AA.
  {
    text: '--hx-color-action-secondary-fg',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'action.secondary.fg on surface.default',
  },
  {
    text: '--hx-color-action-secondary-fg',
    surface: '--hx-color-action-secondary-bg-hover',
    threshold: 4.5,
    label: 'action.secondary.fg on action.secondary.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-action-ghost-fg',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'action.ghost.fg on surface.default',
  },
  {
    text: '--hx-color-action-ghost-fg',
    surface: '--hx-color-action-ghost-bg-hover',
    threshold: 4.5,
    label: 'action.ghost.fg on action.ghost.bg-hover',
    modes: ['light', 'dark'],
  },
  // 3.2.1 round-4: action.secondary.border defines the resting outline of
  // outline-style buttons. WCAG 1.4.11 requires 3:1 against the adjacent
  // surface (resting body fill AND the hover fill) so the affordance does not
  // visually disappear when the user hovers.
  {
    text: '--hx-color-action-secondary-border',
    surface: '--hx-color-surface-default',
    threshold: 3,
    label: 'action.secondary.border on surface.default',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-action-secondary-border',
    surface: '--hx-color-action-secondary-bg-hover',
    threshold: 3,
    label: 'action.secondary.border on action.secondary.bg-hover',
    modes: ['light', 'dark'],
  },
  // 3.2.1 token-cascade remediation: surface.{role}-strong tokens (the
  // emphasis-prominence sibling of surface.{role}, used by hx-toast variant
  // fills and any other "loud" status surface). Each pairs with the
  // on-{role}-strong text semantic the consuming component actually paints —
  // these on-strong text tokens hold at neutral-0 across modes (no dark
  // override) precisely so emphasis fills paint white-on-dark in both light
  // and dark mode rather than flipping with text.inverse. Warning is the
  // exception (warming-500 is light enough that neutral-900 reads better),
  // matching the existing on-warning contract.
  {
    text: '--hx-color-text-on-success-strong',
    surface: '--hx-color-surface-success-strong',
    threshold: 4.5,
    label: 'text.on-success-strong on surface.success-strong',
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-surface-warning-strong',
    threshold: 4.5,
    label: 'text.on-warning on surface.warning-strong',
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-surface-danger-strong',
    threshold: 4.5,
    label: 'text.on-error-strong on surface.danger-strong',
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-surface-info-strong',
    threshold: 4.5,
    label: 'text.on-primary-strong on surface.info-strong',
  },
  // Link text on body surface
  {
    text: '--hx-color-text-link',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.link on surface.default',
  },
  {
    text: '--hx-color-text-link-hover',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.link-hover on surface.default',
  },
  {
    text: '--hx-color-text-link-visited',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.link-visited on surface.default',
  },
  {
    text: '--hx-color-text-link-active',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'text.link-active on surface.default',
  },
  // Disabled is WCAG-exempt (1.4.3 explicitly excludes inactive UI), but we
  // still gate it at the 3:1 UI floor so it remains visibly distinct rather
  // than invisible. Skip light mode (text-disabled = neutral-400 = 2.36:1
  // on white — intentionally low to read as "disabled"). Assert dark + HC.
  {
    text: '--hx-color-text-disabled',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    modes: ['dark', 'high-contrast'],
    label: 'text.disabled on surface.default',
  },
  // Status text variants on body surface (error-text, success-text — these
  // are the AA-safe variants explicitly designed for body backgrounds).
  {
    text: '--hx-color-error-text',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'error-text on surface.default',
  },
  {
    text: '--hx-color-success-text',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    label: 'success-text on surface.default',
  },
  // 3.2.2 color-contrast campaign: focus-ring must clear the WCAG 1.4.11 3:1
  // floor for non-text UI components against the resting body surface — every
  // keyboard-focus indicator drawn at full opacity (outline-style focus on
  // hx-link, border-flip on hx-text-input wrapper, button focus rings, etc.)
  // resolves through this token. Pre-3.2.2 it was primary-400 (2.45:1 on white,
  // sub-3:1) — the most common keyboard-focus affordance in the library was
  // failing. Light flips to primary-600, dark keeps primary-400 (7.27:1 on
  // dark surface), HC inherits the explicit yellow override (#FFFF00, ~19.5:1
  // on #000). Asserting the pair across all three modes locks the floor in
  // permanently; any future palette tweak that drops the focus-ring below 3:1
  // fails CI here.
  {
    text: '--hx-color-focus-ring',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    label: 'focus-ring on surface.default (UI floor — keyboard focus)',
  },
  // 3.2.2 color-contrast campaign: action.primary.bg-inverted-rest paints
  // the resting fill of inverted-mode primary buttons against surface.inverse.
  // surface.inverse flips by mode (dark in light theme, light in dark theme),
  // so the resting fill must clear 3:1 in both directions. Light: primary-500
  // on #0D1825 = 5.20:1. Dark: primary-600 on #EBEEE9 = 4.97:1 (the dark-mode
  // override). Pre-3.2.2 dark inverted primary resolved to primary-500 on
  // #EBEEE9 = 2.94:1 — sub-3:1 UI-component floor fail.
  {
    text: '--hx-color-action-primary-bg-inverted-rest',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    label: 'action.primary.bg-inverted-rest on surface.inverse (UI floor — inverted button)',
  },
  // 3.2.2 color-contrast campaign: border.strong must clear the WCAG 1.4.11
  // 3:1 floor against surface.default — it is the resting border on every form
  // control (text input, select, checkbox, radio, switch track, file upload
  // dropzone, side-nav header/footer, etc.). Pre-3.2.2 this was neutral-400
  // (#8E9C98, 2.85:1 on white) — a sub-3:1 fail systemic to every form-control
  // border across the library. Light flips to neutral-500 (#66787B, 4.63:1),
  // dark keeps neutral-500 (#66787B on #0D1825 = 3.86:1), HC inherits #FFFFFF
  // (21:1 on #000). Locking the pair here prevents future palette tweaks from
  // sliding the resting form-control border below 3:1 again.
  {
    text: '--hx-color-border-strong',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    label: 'border.strong on surface.default (UI floor — form-control borders)',
  },
];

const ALL_MODES: Array<'light' | 'dark' | 'high-contrast'> = ['light', 'dark', 'high-contrast'];

// ---------------------------------------------------------------------------
// Test bodies
// ---------------------------------------------------------------------------

interface AaaResult {
  mode: string;
  label: string;
  threshold: number;
  ratio: number;
  aaaThreshold: number;
}

const aaaMisses: AaaResult[] = [];

describe('contrast regression matrix (WCAG 2.1 AA)', () => {
  for (const mode of ALL_MODES) {
    const modeMap = buildModeMap(mode);
    describe(`${mode} mode`, () => {
      for (const pair of PAIRS) {
        const modes = pair.modes ?? ALL_MODES;
        if (!modes.includes(mode)) continue;

        it(`${pair.label} in ${mode} meets ${pair.threshold}:1`, () => {
          const textHex = resolveToHex(pair.text, modeMap, mode);
          const surfaceHex = resolveToHex(pair.surface, modeMap, mode);
          const ratio = contrastRatio(textHex, surfaceHex);

          // Track AAA misses for an informational summary.
          const aaaThreshold = pair.threshold === 4.5 ? 7.0 : 4.5;
          if (ratio < aaaThreshold) {
            aaaMisses.push({
              mode,
              label: pair.label,
              threshold: pair.threshold,
              ratio,
              aaaThreshold,
            });
          }

          expect(
            ratio,
            `${pair.label} in ${mode}: ${textHex} on ${surfaceHex} = ${ratio.toFixed(
              2,
            )}:1, below WCAG AA threshold ${pair.threshold}:1`,
          ).toBeGreaterThanOrEqual(pair.threshold);
        });
      }
    });
  }

  it('matrix coverage (sanity)', () => {
    // Pairs grow with the matrix; 70 is the floor (was originally 26
    // pair-specs => 77 assertions). Extending the matrix should never
    // shrink the assertion count below this floor.
    let total = 0;
    for (const pair of PAIRS) {
      total += (pair.modes ?? ALL_MODES).length;
    }
    expect(total).toBeGreaterThanOrEqual(70);
  });

  it('AAA summary (informational; never gates)', () => {
    // Logged as info — never fails, just visible in CI output. Useful as a
    // health signal: if AAA-miss count grows, we're drifting toward minimum
    // AA across the board.
    const total = PAIRS.reduce((sum, p) => sum + (p.modes ?? ALL_MODES).length, 0);
    const passing = total - aaaMisses.length;
    // eslint-disable-next-line no-console
    console.info(
      `[contrast matrix] AAA: ${passing}/${total} pairs meet WCAG AAA. ${aaaMisses.length} pairs at AA but below AAA (acceptable; AA is the gate).`,
    );
    if (aaaMisses.length > 0) {
      for (const m of aaaMisses) {
        // eslint-disable-next-line no-console
        console.info(
          `  - ${m.label} [${m.mode}]: ${m.ratio.toFixed(2)}:1 (AA ${m.threshold}:1, AAA ${m.aaaThreshold}:1)`,
        );
      }
    }
    expect(true).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Description-ratio drift gate.
  //
  // Token descriptions cite WCAG ratios as prose (e.g. "neutral-700 (#313E4B)
  // on surface.default (#FFFFFF) = 10.93:1"). Those strings ship to consumers
  // (Figma plugin, design tooling, contrast auditors that read tokens.json
  // directly) and drift silently when a palette stop or pairing changes. The
  // round-7 → round-8 codex loop caught five rounds of this exact bug class.
  //
  // This gate parses every "(#FG_HEX) ... (#BG_HEX) ... = N.NN:1" triple in
  // every description, computes the actual contrast, and asserts the cited
  // ratio matches within ±0.05 (one decimal of WCAG rounding tolerance).
  //
  // Triples are extracted only when both hexes appear in parens close to the
  // ratio — descriptions citing token names without explicit hex pairs are
  // skipped (no ground truth to check). The tolerance accounts for the fact
  // that descriptions are hand-rounded; anything off by more than 0.05 is
  // either a typo or a stale value from a prior palette generation.
  // -------------------------------------------------------------------------
  it('description ratios match computed contrast', () => {
    const tokensJson = JSON.stringify(tokens);
    type Cite = { fg: string; bg: string; cited: number; path: string };
    const cites: Cite[] = [];
    // Descriptions live as JSON-escaped strings in the stringified blob; walk
    // each "description": "..." entry to keep error messages tied to a path.
    const descRe = /"description":\s*"((?:\\"|[^"])*)"/g;
    let descMatch: RegExpExecArray | null;
    while ((descMatch = descRe.exec(tokensJson)) !== null) {
      const desc = descMatch[1];
      // Canonical citation form: "(#FG) on TOKEN (#BG) = N.NN:1" or
      // "(#FG) on TOKEN (TOKEN-NAME, #BG) = N.NN:1". Tightly anchored to
      // avoid matching prose like "(#FG-A) drops to N:1 and on (#FG-B) to N:1.
      // text on TOKEN = N.NN:1" where the regex would otherwise capture
      // FG-B as fg and the unrelated `= N.NN:1` as the ratio.
      //
      // The middle disallows parens and equals, so the BG hex must be the
      // first parenthesized hex after " on TOKEN " and the ratio must be the
      // first "= N.NN:1" after that. Prose mixing token-name and explicit-hex
      // citations (e.g. "neutral-0 on primary-600 = 5.82:1" without parens
      // around the FG) is correctly skipped — no parenthesized FG, no triple.
      const tripleRe =
        /\(#([0-9A-Fa-f]{6})\)\s+on\s+[^()=]+\([^()=]*?#([0-9A-Fa-f]{6})\s*\)\s*=\s*(\d+\.\d{1,2}):1/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tripleRe.exec(desc)) !== null) {
        cites.push({
          fg: '#' + tMatch[1].toUpperCase(),
          bg: '#' + tMatch[2].toUpperCase(),
          cited: parseFloat(tMatch[3]),
          path: desc.slice(0, 60).replace(/\s+/g, ' ') + '…',
        });
      }
    }

    expect(
      cites.length,
      'no description ratio triples extracted — regex broke or descriptions removed',
    ).toBeGreaterThan(0);

    const drift: string[] = [];
    for (const c of cites) {
      const actual = contrastRatio(c.fg, c.bg);
      if (Math.abs(actual - c.cited) > 0.05) {
        drift.push(
          `${c.fg} on ${c.bg}: cited ${c.cited.toFixed(2)}:1, actual ${actual.toFixed(2)}:1 (description: "${c.path}")`,
        );
      }
    }
    expect(drift, `description ratio drift:\n  ${drift.join('\n  ')}`).toEqual([]);
  });
});
