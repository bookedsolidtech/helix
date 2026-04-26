import { css } from 'lit';

export const helixButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  :host([full]) {
    display: block;
    width: 100%;
  }

  :host([full]) .button {
    width: 100%;
    justify-content: center;
  }

  /* ─── Base Button ─── */

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-button-border-color, transparent);
    border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-button-bg, var(--hx-color-primary-500, #429797));
    color: var(--hx-button-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-button-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-button-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  /* WCAG 2.5.5 (healthcare mandate): minimum 44px touch target for sm variant.
     min-height uses --hx-touch-target-min to guarantee the interactive area
     meets the threshold even though the visual size token is smaller. */
  .button--sm {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
  }

  .button--md {
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    font-size: var(--hx-font-size-md, 1rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  .button--lg {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-6, 1.5rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-button-bg: var(--hx-color-action-primary-bg, #429797);
    /* Inline #0d1825 matches text.on-primary's resolved primitive (neutral-900);
       cold-start without the semantic still paints AA-tuned dark-on-primary
       rather than white-on-primary (3.43:1 fail). */
    --hx-button-color: var(--hx-color-text-on-primary, #0d1825);
    --hx-button-border-color: transparent;
  }

  .button--secondary {
    --hx-button-bg: transparent;
    /* primary-500 (#429797) text on white surface = 3.44:1 — fails AA.
       primary-600 (#0F7078) on white = 5.82:1 — AA pass. */
    --hx-button-color: var(--hx-color-action-secondary-fg, #0f7078);
    --hx-button-border-color: var(--hx-color-action-secondary-border, #0f7078);
  }

  .button--secondary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-action-secondary-bg-hover, #ebf8f8));
  }

  .button--tertiary {
    --hx-button-bg: var(--hx-color-surface-sunken, #ebeee9);
    --hx-button-color: var(--hx-color-text-primary, #0d1825);
    --hx-button-border-color: transparent;
  }

  .button--tertiary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-surface-raised, #f5f8f3));
  }

  .button--danger {
    --hx-button-bg: var(--hx-color-action-danger-bg, #e5493e);
    /* Inline #0d1825 matches text.on-error's resolved primitive (neutral-900);
       cold-start without the semantic still paints AA-tuned dark-on-error
       rather than white-on-error (3.92:1 fail). */
    --hx-button-color: var(--hx-color-text-on-error, #0d1825);
    --hx-button-border-color: transparent;
  }

  /* on-error tokens are tuned for error-500 (neutral-900 on #E5493E ≈ 4.59:1).
     error-600 (#C92A2A) drops that to 3.28:1 — AA fail. text.on-error-strong
     resolves to neutral-0 across modes (no dark flip) so the darker hover fill
     stays legible. Mirrors hx-toast precedent (commit 300e21ab0); routed
     through the semantic tier in 3.2.1 token-cascade remediation. */
  .button--danger:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-action-danger-bg-hover, #c92a2a));
    --hx-button-color: var(--hx-color-text-on-error-strong, #ffffff);
  }

  /* Pressed state binds explicitly to action.danger.bg-active (error-700,
     #A21312) + text.on-error-strong (neutral-0) = 7.96:1 AA. Base
     .button:active filter:brightness(0.8) would compound on top of bg-hover
     (#C92A2A) and produce ~3.3:1 sub-AA on the bound colors. Override the
     filter to none. HC override on action.danger.bg-active flips to HC
     error-500 so the on-error-strong (HC = #000) pair is AA in HC too. */
  .button--danger:active {
    --hx-button-bg: var(--hx-button-active-bg, var(--hx-color-action-danger-bg-active, #a21312));
    --hx-button-color: var(--hx-color-text-on-error-strong, #ffffff);
    filter: none;
  }

  .button--ghost {
    --hx-button-bg: transparent;
    /* primary-500 (#429797) text on white surface = 3.44:1 — fails AA.
       primary-600 (#0F7078) on white = 5.82:1 — AA pass. */
    --hx-button-color: var(--hx-color-action-ghost-fg, #0f7078);
    --hx-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-action-ghost-bg-hover, #ebf8f8));
  }

  .button--outline {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-text-primary, #0d1825);
    --hx-button-border-color: var(--hx-color-border-strong, #66787b);
  }

  .button--outline:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-surface-raised, #f5f8f3));
  }

  /* on-primary token resolves to neutral-900 (#0D1825) — tuned for primary-500.
     primary-600 (#0F7078) drops the pair to 3.07:1 — AA fail. text.on-primary-strong
     resolves to neutral-0 across modes (no dark flip) for the darker hover fill.
     Mirrors hx-toast precedent (commit 300e21ab0); routed through the semantic
     tier in 3.2.1 token-cascade remediation. */
  .button--primary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-action-primary-bg-hover, #0f7078));
    --hx-button-color: var(--hx-color-text-on-primary-strong, #ffffff);
  }

  /* Pressed state binds explicitly to action.primary.bg-active (primary-700,
     #0F6363) + text.on-primary-strong (neutral-0) = 7.03:1 AA. The base
     .button:active filter:brightness(0.8) would compound on top of bg-hover
     (#0F7078) and produce ~3.7:1 sub-AA on the bound colors. Override the
     filter to none so the action.*.bg-active token is what actually paints. */
  .button--primary:active {
    --hx-button-bg: var(--hx-button-active-bg, var(--hx-color-action-primary-bg-active, #0f6363));
    --hx-button-color: var(--hx-color-text-on-primary-strong, #ffffff);
    filter: none;
  }

  /* ─── Disabled ─── */

  /* Note: opacity is applied on :host([disabled]) above — do NOT add opacity here.
     Stacking opacity on both :host and .button[disabled] would multiply to 0.25. */
  .button[disabled] {
    cursor: not-allowed;
  }

  /* ─── Loading State ─── */

  .button--loading {
    position: relative;
    cursor: wait;
  }

  .button__spinner {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    animation: hx-spin var(--hx-duration-spinner, 750ms) linear infinite;
  }

  @keyframes hx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }

    .button__spinner {
      animation: none;
      opacity: var(--hx-opacity-muted, 0.6);
    }
  }

  /* ─── Inverted Mode ─── */

  /* Override text color and filter-based hover/active for all variants */
  :host([inverted]) .button {
    color: var(--hx-button-inverted-color, var(--hx-color-text-inverse, #ffffff));
    filter: none;
  }

  :host([inverted]) .button:hover {
    filter: none;
  }

  :host([inverted]) .button:active {
    filter: none;
  }

  :host([inverted]) .button:focus-visible {
    /* WCAG 1.4.11: focus indicator needs ≥3:1 against adjacent colors.
       border-on-dark-default (overlay-white-30) ≈ 2.7:1 on neutral-900 — fails.
       border-on-dark-strong (overlay-white-70) ≈ 5:1 — passes. */
    outline-color: var(
      --hx-button-inverted-focus-ring-color,
      var(--hx-color-border-on-dark-strong, rgba(255, 255, 255, 0.7))
    );
  }

  /* Primary inverted — resting bg routes through action.primary.bg-inverted-rest
     so dark mode can flip the fill to primary-600. surface.inverse becomes light
     (#EBEEE9) in dark mode; primary-500 on #EBEEE9 = 2.94:1 (sub-3:1 UI floor
     fail for the inverted-button boundary). primary-600 on #EBEEE9 = 4.97:1
     (AA pass). Light mode tracks action.primary.bg (primary-500, 5.20:1 on
     dark surface.inverse). */
  :host([inverted]) .button--primary {
    background-color: var(
      --hx-button-bg,
      var(--hx-color-action-primary-bg-inverted-rest, #429797)
    );
  }

  /* Primary inverted — hover/pressed lift to action.primary.bg-inverted-hover
     (primary-400, light teal). The base :host([inverted]) .button rule binds
     color to text.inverse, which flips by mode (neutral-0 in light, neutral-900
     in dark). On a permanent light-teal fill, white text drops to 2.4:1 in
     light mode (AA fail). Pin color to text.on-primary (neutral-900, no
     dark-mode flip) for both hover and active so the foreground is dark in
     both modes — neutral-900 on primary-400 = 7.27:1 (AA pass).
     Pressed === hover visually in inverted mode is acceptable UX (the
     transient absence of pointer over the button signals release).
     The fallback chain wraps --hx-button-active-bg (highest precedence) and
     --hx-button-hover-bg so consumer overrides on either prop apply under
     :host([inverted]) — the two share a paint here, so either knob is
     honored, with active-bg winning when both are set. */
  :host([inverted]) .button--primary:hover,
  :host([inverted]) .button--primary:active {
    --hx-button-bg: var(
      --hx-button-active-bg,
      var(--hx-button-hover-bg, var(--hx-color-action-primary-bg-inverted-hover, #6ab1b1))
    );
    color: var(
      --hx-button-inverted-primary-interactive-color,
      var(--hx-color-text-on-primary, #0d1825)
    );
  }

  /* Danger inverted — sister to primary. Hover/pressed lift to
     action.danger.bg-inverted-hover (error-400, #FC7264). Same foreground
     contract: text.inverse fails in light mode (white on light red ≈ 2.6:1);
     pin to text.on-error (neutral-900, no dark-mode flip) for 6.58:1 in both
     modes. Same active-bg → hover-bg → semantic fallback chain as primary. */
  :host([inverted]) .button--danger:hover,
  :host([inverted]) .button--danger:active {
    --hx-button-bg: var(
      --hx-button-active-bg,
      var(--hx-button-hover-bg, var(--hx-color-action-danger-bg-inverted-hover, #fc7264))
    );
    color: var(
      --hx-button-inverted-danger-interactive-color,
      var(--hx-color-text-on-error, #0d1825)
    );
  }

  /* Secondary inverted — white border and translucent hover fill */
  :host([inverted]) .button--secondary {
    --hx-button-border-color: var(--hx-color-border-on-dark-strong, rgba(255, 255, 255, 0.7));
  }

  :host([inverted]) .button--secondary:hover {
    --hx-button-bg: var(--hx-color-border-on-dark-default, rgba(255, 255, 255, 0.3));
  }

  /* Tertiary inverted — resting at subtle (10%) lifts to default (30%) on hover
     so the runtime hover delta is visually distinct, not collapsed onto a
     single token. */
  :host([inverted]) .button--tertiary {
    --hx-button-bg: var(--hx-color-border-on-dark-subtle, rgba(255, 255, 255, 0.1));
    --hx-button-border-color: transparent;
  }

  :host([inverted]) .button--tertiary:hover {
    --hx-button-bg: var(--hx-color-border-on-dark-default, rgba(255, 255, 255, 0.3));
  }

  /* Ghost inverted — transparent base, translucent hover bg */
  :host([inverted]) .button--ghost {
    --hx-button-bg: transparent;
    --hx-button-border-color: transparent;
  }

  :host([inverted]) .button--ghost:hover {
    --hx-button-bg: var(
      --hx-button-inverted-ghost-hover-bg,
      var(--hx-color-border-on-dark-default, rgba(255, 255, 255, 0.3))
    );
  }

  /* Outline inverted — white border */
  :host([inverted]) .button--outline {
    --hx-button-border-color: var(--hx-color-border-on-dark-strong, rgba(255, 255, 255, 0.7));
  }

  :host([inverted]) .button--outline:hover {
    --hx-button-bg: var(--hx-color-border-on-dark-default, rgba(255, 255, 255, 0.3));
  }

  /* ─── Prefix / Suffix / Label ─── */

  .button__prefix,
  .button__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .button__label {
    flex: 1 1 auto;
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .button {
      /* Ensure button outline is visible in Windows High Contrast mode.
         ButtonText/ButtonFace are system colors recognized by the browser. */
      forced-color-adjust: none;
      background-color: ButtonFace;
      color: ButtonText;
      border: 2px solid ButtonText;
    }

    .button:hover {
      /* Hover affordance must survive in HC. Highlight/HighlightText is the
         OS-level "selected" pair, mirroring the forcedColorsInteractive mixin's
         hover contract — kept inline since this component owns its bespoke HC
         block (XOR rule). */
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    .button:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .button[disabled] {
      background-color: ButtonFace;
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }

    :host([disabled]) {
      opacity: 1;
    }

    .button--loading .button__spinner {
      /* Ensure spinner is visible in HCM */
      forced-color-adjust: auto;
    }
  }
`;
