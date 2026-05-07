/**
 * Public WCAG 2.1 AAA classification helpers.
 *
 * Exposed from `@helixui/tokens` so downstream consumers (Storybook
 * dashboards, audit tooling, custom contrast reporters, theme builders)
 * can run their own AAA-aware contrast checks against the same
 * canonical role taxonomy used by HELiX's contrast matrix.
 *
 * The original definitions lived in `src/__tests__/contrast-helpers.ts`,
 * which is not part of the package's public surface — consumers had to
 * either redefine the role enum + threshold mapping locally or reach
 * into a deep test path that was never guaranteed to be stable.
 *
 * The matrix module (`src/__tests__/contrast-helpers.ts`) and the report
 * generator (`scripts/generate-contrast-report.ts`) re-import from this
 * file so there is exactly one source of truth.
 *
 * (codex p2 round-10)
 */

/**
 * The WCAG-applicable role of a contrast pair. Determines the AAA threshold
 * (1.4.6 Contrast Enhanced) applied by the report:
 *
 *   - `body-text`  → AAA ≥ 7.0:1 (small text, body prose, captions, link text,
 *                    inline messages, button labels, badge labels, callout
 *                    copy — anything below the WCAG large-text cutoff). Per
 *                    WCAG 2.1 1.4.6, large-scale text is 18 point regular
 *                    (≈24px) OR 14 point bold (≈18.66px bold). HELiX renders
 *                    button labels at ≥1rem (16px) — that's only 12pt, which
 *                    is below both the regular and the bold large-text
 *                    thresholds. Even at semibold (CSS weight 600), the spec
 *                    most authoritatively cites "bold" with weight ≥700 for
 *                    the 14pt-bold branch. Buttons therefore live in the
 *                    body-text tier and consumers wanting to clear AAA must
 *                    pick a brand stop where text-on-stop ≥ 7:1. See
 *                    ConsumerObligations.mdx.
 *   - `large-text` → AAA ≥ 4.5:1. Reserved for explicitly large headings or
 *                    display copy rendered at ≥24px regular / ≥18.66px true
 *                    bold (CSS weight ≥700). This codebase intentionally has
 *                    NO pairs in this tier — past misuse classified 16px
 *                    semibold button labels here, which the spec does not
 *                    permit. Kept as a type so future genuine large-display
 *                    pairs can opt in with the right rationale.
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
