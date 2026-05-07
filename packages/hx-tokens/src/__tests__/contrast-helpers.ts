/**
 * Shared WCAG 2.1 contrast helpers + the canonical PAIRS matrix.
 *
 * Originally inlined in `contrast.test.ts`; extracted so the
 * `scripts/generate-contrast-report.ts` reporter can reuse the exact same
 * computation and matrix without duplication. The test file re-imports from
 * here; behavior is unchanged.
 */
import tokens from '../tokens.json';
import { isHexColor } from '../utils.js';

// ---------------------------------------------------------------------------
// WCAG 2.0 contrast helpers
// ---------------------------------------------------------------------------

export function hexChannelToLinear(twoHex: string): number {
  const c = parseInt(twoHex, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
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
    0.2126 * hexChannelToLinear(r) + 0.7152 * hexChannelToLinear(g) + 0.0722 * hexChannelToLinear(b)
  );
}

export function contrastRatio(hex1: string, hex2: string): number {
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
export function flattenColorBlock(
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

export type ContrastMode = 'light' | 'dark' | 'high-contrast';

export const ALL_MODES: ContrastMode[] = ['light', 'dark', 'high-contrast'];

export function buildModeMap(mode: ContrastMode): Record<string, string> {
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
export function resolveToHex(
  tokenName: string,
  modeMap: Record<string, string>,
  mode: string,
): string {
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

/**
 * The WCAG-applicable role of a contrast pair. Determines the AAA threshold
 * (1.4.6 Contrast Enhanced) applied by the report:
 *
 *   - `body-text`  → AAA ≥ 7.0:1 (small text, body prose, captions, link text,
 *                    inline messages — anything below the WCAG large-text
 *                    cutoff of 18pt regular / 14pt bold ≈ 18.66px / 24px).
 *   - `large-text` → AAA ≥ 4.5:1 (heading text, button labels rendered at
 *                    ≥18.66px bold, badge labels, callout strong text). Per
 *                    WCAG 2.1 1.4.6: "large-scale text" is 18 point or 14
 *                    point bold (https://www.w3.org/TR/WCAG21/#dfn-large-scale).
 *                    HELiX `hx-button` renders labels at 0.875rem/1rem with
 *                    600+ weight — a 1rem (16px) bold label clears the bold
 *                    threshold of 14pt (≈18.66px) at the spec's *bold*
 *                    branch. We document this carve-out at the pair site.
 *   - `ui-element` → AAA ≥ 3.0:1 (focus rings, borders, dividers, status
 *                    indicators, glyph-only icons, hover-state overlays).
 *                    1.4.6 *has no AAA tier for non-text contrast*; the AA
 *                    non-text floor from 1.4.11 (3:1) is the strictest tier
 *                    WCAG defines, so AAA is operationally equivalent to AA
 *                    for these pairs. We track them at 3:1 so the report's
 *                    AAA column is honest.
 */
export type PairRole = 'body-text' | 'large-text' | 'ui-element';

/** AAA threshold for a given role per WCAG 2.1 1.4.6 + 1.4.11. */
export function aaaThresholdForRole(role: PairRole): number {
  if (role === 'ui-element') return 3.0;
  if (role === 'large-text') return 4.5;
  return 7.0;
}

export interface PairSpec {
  /** Full CSS custom property name for the text token. */
  text: string;
  /** Full CSS custom property name for the surface token (or brand background). */
  surface: string;
  /** WCAG threshold: 4.5 for body text, 3.0 for large text / UI components. */
  threshold: 4.5 | 3.0;
  /**
   * WCAG 1.4.6 role for AAA classification. Defaults to `body-text` (7:1) when
   * omitted; explicitly tag pairs that are large-text or UI-element so the
   * report doesn't penalize them at the body-text ceiling.
   */
  role?: PairRole;
  /** Modes this pair is checked in. Default: all three. */
  modes?: ContrastMode[];
  /** Human-readable label fragment used in test descriptions. */
  label: string;
}

/**
 * Curated set of semantically valid pairings. Every entry below describes a
 * pairing the design system actually intends to render.
 *
 * IMPORTANT: This list is the SOURCE OF TRUTH for both the AA gate
 * (contrast.test.ts) and the AAA report (scripts/generate-contrast-report.ts).
 */
export const PAIRS: PairSpec[] = [
  // Body / muted / strong on body surfaces — body-text role (AAA 7:1)
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.primary on surface.default',
  },
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.primary on surface.raised',
  },
  {
    text: '--hx-color-text-primary',
    surface: '--hx-color-surface-sunken',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.primary on surface.sunken',
  },
  {
    text: '--hx-color-text-strong',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.strong on surface.default',
  },
  {
    text: '--hx-color-text-strong',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.strong on surface.raised',
  },
  {
    text: '--hx-color-text-secondary',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.secondary on surface.default',
  },
  {
    text: '--hx-color-text-secondary',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.secondary on surface.raised',
  },
  {
    text: '--hx-color-text-muted',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.muted on surface.default',
  },
  {
    text: '--hx-color-text-muted',
    surface: '--hx-color-surface-raised',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.muted on surface.raised',
  },
  // Placeholder text is readable text inside a form control. WCAG 1.4.3 covers
  // *all* text content unless explicitly exempted (logos, decorative,
  // incidental, inactive-control text); placeholder text is none of those.
  // Classify as body-text so the AAA report holds it to the 7:1 ceiling
  // honestly. The AA *gate* threshold is held at the 1.4.11 non-text floor
  // (3:1) here because the active palette's light-mode placeholder
  // (neutral-500 = #66787B) clears 5.05:1 on surface.default but only 4.32:1
  // on surface.raised — below the WCAG 1.4.3 4.5:1 small-text floor. Bumping
  // the AA gate to 4.5 requires a token-design conversation to lift the
  // light-mode placeholder color (analogous to the dark-mode bump from
  // neutral-500 → neutral-400 documented in tokens.json). Tracked as a
  // follow-up; this commit fixes only the AAA misclassification (codex P1).
  {
    text: '--hx-color-text-placeholder',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    role: 'body-text',
    label: 'text.placeholder on surface.default',
  },
  {
    text: '--hx-color-text-placeholder',
    surface: '--hx-color-surface-raised',
    threshold: 3.0,
    role: 'body-text',
    label: 'text.placeholder on surface.raised',
  },
  {
    text: '--hx-color-text-inverse',
    surface: '--hx-color-surface-inverse',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.inverse on surface.inverse',
  },
  // Button labels on brand fills — large-text per WCAG 2.1 1.4.6.
  // hx-button renders labels at ≥1rem (16px) with weight ≥600 ("semibold").
  // WCAG large-text branch: ≥14pt bold ≈ 18.66px bold; CSS 600 is the
  // accepted threshold for "bold" in browser computed styles. AAA 4.5:1.
  // See ConsumerObligations.mdx for the consumer's obligation to keep
  // button slot content in ≥1rem semibold (the default — overriding it
  // shrinks the carve-out).
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-primary-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary on primary-500',
  },
  {
    text: '--hx-color-text-on-secondary',
    surface: '--hx-color-secondary-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-secondary on secondary-500',
  },
  {
    text: '--hx-color-text-on-success',
    surface: '--hx-color-success-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-success on success-500',
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-warning-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-warning on warning-500',
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-error-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error on error-500',
  },
  {
    text: '--hx-color-text-on-info',
    surface: '--hx-color-info-500',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-info on info-500',
  },
  // Button hover/pressed surfaces with neutral-0 label — large-text role.
  // These are the hover/active states of the primary/secondary buttons,
  // labels still rendered ≥1rem semibold.
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-primary-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on primary-600 (hover surface floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-primary-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on primary-700 (pressed surface floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-secondary-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on secondary-600',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-secondary-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on secondary-700',
    modes: ['light', 'dark'],
  },
  // Status badge fills (success/warning/info/error) — non-text UI elements
  // (badge backgrounds against page surface) per the existing UI floor
  // labelling on success/warning. AAA non-text has no tier above 1.4.11's
  // 3:1; classify as ui-element.
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-success-600',
    threshold: 3.0,
    role: 'ui-element',
    label: 'neutral-0 on success-600 (UI floor; body=4.42:1, palette gap)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-success-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on success-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-warning-600',
    threshold: 3.0,
    role: 'ui-element',
    label: 'neutral-0 on warning-600 (UI floor; body=4.28:1, palette gap)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-warning-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on warning-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-error-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on error-600 (danger hover floor)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-error-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on error-700',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-info-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on info-600',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-neutral-0',
    surface: '--hx-color-info-700',
    threshold: 4.5,
    role: 'large-text',
    label: 'neutral-0 on info-700',
    modes: ['light', 'dark'],
  },
  // High-contrast bright button fills — large-text (button labels).
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-primary-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary on primary-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-secondary',
    surface: '--hx-color-secondary-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-secondary on secondary-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-success',
    surface: '--hx-color-success-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-success on success-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-warning-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-warning on warning-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-error-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error on error-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-info',
    surface: '--hx-color-info-600',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-info on info-600 (HC bright fill)',
    modes: ['high-contrast'],
  },
  // Action.primary / action.danger button labels in hover/active states —
  // large-text (button labels at ≥1rem semibold).
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary-strong on action.primary.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-active',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary-strong on action.primary.bg-active',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary-strong on action.primary.bg-hover (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-action-primary-bg-active',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary-strong on action.primary.bg-active (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error-strong on action.danger.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-active',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error-strong on action.danger.bg-active',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error-strong on action.danger.bg-hover (HC bright fill)',
    modes: ['high-contrast'],
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-action-danger-bg-active',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error-strong on action.danger.bg-active (HC bright fill)',
    modes: ['high-contrast'],
  },
  // Inverted button surfaces — non-text UI element backgrounds.
  {
    text: '--hx-color-action-primary-bg-inverted-hover',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    role: 'ui-element',
    label: 'action.primary.bg-inverted-hover on surface.inverse (UI floor, light mode)',
    modes: ['light'],
  },
  {
    text: '--hx-color-action-danger-bg-inverted-hover',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    role: 'ui-element',
    label: 'action.danger.bg-inverted-hover on surface.inverse (UI floor, light mode)',
    modes: ['light'],
  },
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-action-primary-bg-inverted-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary on action.primary.bg-inverted-hover (inverted hover/active fg)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-action-danger-bg-inverted-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error on action.danger.bg-inverted-hover (inverted hover/active fg)',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-text-on-primary',
    surface: '--hx-color-action-primary-bg',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary on action.primary.bg',
  },
  {
    text: '--hx-color-text-on-error',
    surface: '--hx-color-action-danger-bg',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error on action.danger.bg',
  },
  // Secondary / ghost button labels — large-text. Buttons render labels at
  // ≥1rem semibold; the WCAG large-text bold branch applies.
  {
    text: '--hx-color-action-secondary-fg',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'large-text',
    label: 'action.secondary.fg on surface.default',
  },
  {
    text: '--hx-color-action-secondary-fg',
    surface: '--hx-color-action-secondary-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'action.secondary.fg on action.secondary.bg-hover',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-action-ghost-fg',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'large-text',
    label: 'action.ghost.fg on surface.default',
  },
  {
    text: '--hx-color-action-ghost-fg',
    surface: '--hx-color-action-ghost-bg-hover',
    threshold: 4.5,
    role: 'large-text',
    label: 'action.ghost.fg on action.ghost.bg-hover',
    modes: ['light', 'dark'],
  },
  // Border tokens — non-text UI elements (1.4.11).
  {
    text: '--hx-color-action-secondary-border',
    surface: '--hx-color-surface-default',
    threshold: 3,
    role: 'ui-element',
    label: 'action.secondary.border on surface.default',
    modes: ['light', 'dark'],
  },
  {
    text: '--hx-color-action-secondary-border',
    surface: '--hx-color-action-secondary-bg-hover',
    threshold: 3,
    role: 'ui-element',
    label: 'action.secondary.border on action.secondary.bg-hover',
    modes: ['light', 'dark'],
  },
  // Status callout text on solid status surfaces — large-text. These render
  // in alerts/banners as bold ≥1rem callout copy; not body prose.
  {
    text: '--hx-color-text-on-success-strong',
    surface: '--hx-color-surface-success-strong',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-success-strong on surface.success-strong',
  },
  {
    text: '--hx-color-text-on-warning',
    surface: '--hx-color-surface-warning-strong',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-warning on surface.warning-strong',
  },
  {
    text: '--hx-color-text-on-error-strong',
    surface: '--hx-color-surface-danger-strong',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-error-strong on surface.danger-strong',
  },
  {
    text: '--hx-color-text-on-primary-strong',
    surface: '--hx-color-surface-info-strong',
    threshold: 4.5,
    role: 'large-text',
    label: 'text.on-primary-strong on surface.info-strong',
  },
  // Inline link text in body prose — body-text (small text in paragraphs).
  {
    text: '--hx-color-text-link',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.link on surface.default',
  },
  {
    text: '--hx-color-text-link-hover',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.link-hover on surface.default',
  },
  {
    text: '--hx-color-text-link-visited',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.link-visited on surface.default',
  },
  {
    text: '--hx-color-text-link-active',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'text.link-active on surface.default',
  },
  // Disabled text — UI affordance, not prose. WCAG 1.4.3 carves out
  // disabled controls, and 1.4.11 non-text floor (3:1) is the operative
  // ceiling.
  {
    text: '--hx-color-text-disabled',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    role: 'ui-element',
    modes: ['dark', 'high-contrast'],
    label: 'text.disabled on surface.default',
  },
  // Inline form helper / status text — body-text (small text rendered
  // beside inputs at 0.875rem regular). 7:1 AAA applies.
  {
    text: '--hx-color-error-text',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'error-text on surface.default',
  },
  {
    text: '--hx-color-success-text',
    surface: '--hx-color-surface-default',
    threshold: 4.5,
    role: 'body-text',
    label: 'success-text on surface.default',
  },
  // Non-text UI elements — 1.4.11 only, no AAA tier above 3:1.
  {
    text: '--hx-color-focus-ring',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    role: 'ui-element',
    label: 'focus-ring on surface.default (UI floor — keyboard focus)',
  },
  {
    text: '--hx-color-action-primary-bg-inverted-rest',
    surface: '--hx-color-surface-inverse',
    threshold: 3.0,
    role: 'ui-element',
    label: 'action.primary.bg-inverted-rest on surface.inverse (UI floor — inverted button)',
  },
  {
    text: '--hx-color-border-strong',
    surface: '--hx-color-surface-default',
    threshold: 3.0,
    role: 'ui-element',
    label: 'border.strong on surface.default (UI floor — form-control borders)',
  },
];
