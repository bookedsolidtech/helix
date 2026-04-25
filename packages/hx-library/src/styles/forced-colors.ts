/**
 * Forced-colors mixins — OS-level Windows High Contrast / `forced-colors: active`
 * system-color deference for hx-* components.
 *
 * Compose into a component's `static styles` array. Each export is already
 * wrapped in `@media (forced-colors: active) { ... }` — consumers do NOT add
 * the media query themselves.
 *
 * Usage:
 *   import { forcedColorsInteractive } from '../../styles/forced-colors.js';
 *   static override styles = [helixButtonStyles, forcedColorsInteractive];
 *
 * System color keywords (Canvas, CanvasText, ButtonFace, ButtonText, Field,
 * FieldText, Highlight, HighlightText, LinkText, VisitedText, GrayText) are
 * the only reliable theming surface in forced-colors mode — browsers strip
 * decorative hex values. Use `forced-color-adjust: none` sparingly — only
 * where default mapping erases critical affordance.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * COMPOSITION RULES — READ BEFORE USING
 *
 * Compose these mixins ONLY when the host component does not define its own
 * `@media (forced-colors: active) { ... }` block in the same `.styles.ts`.
 * Two stylesheets defining overlapping selectors inside the same media query
 * specificity-war: the later-loaded sheet wins, but the result depends on
 * `static styles` array order and is fragile to refactor.
 *
 * Pick exactly one of two approaches per component:
 *   1. Compose a mixin (preferred for the common cases). Don't add your own
 *      forced-colors block.
 *   2. Author a bespoke forced-colors block inline in the component's
 *      `.styles.ts`. Don't compose a mixin.
 *
 * If you genuinely need both (e.g., a niche component-specific affordance
 * the mixin doesn't cover), put the bespoke rules AFTER the mixin in the
 * `static styles` array and scope them to selectors the mixin does not
 * target. Document the divergence inline.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { css } from 'lit';

/**
 * INTERACTIVE — buttons, icon-buttons, switches, checkboxes, links-as-buttons.
 *
 * Do NOT use for:
 *   - surface containers (use `forcedColorsSurface`)
 *   - form text fields (use `forcedColorsField`)
 *   - inline links in prose (use `forcedColorsLink`)
 *
 * Matches the precedent set by hx-button: ButtonFace/ButtonText/ButtonText-
 * border, Highlight on focus, GrayText on disabled. Disabled controls keep
 * a ButtonFace background (not CanvasText) so the disabled state is visually
 * differentiable from an active button via GrayText foreground/border alone.
 */
export const forcedColorsInteractive = css`
  @media (forced-colors: active) {
    button,
    [part='button'],
    [part='control'] {
      background-color: ButtonFace;
      color: ButtonText;
      border: 1px solid ButtonText;
    }

    button:hover,
    [part='button']:hover,
    [part='control']:hover {
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    button:focus-visible,
    [part='button']:focus-visible,
    [part='control']:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--hx-focus-ring-offset, 2px);
    }

    :host([disabled]),
    :host([disabled]) button,
    :host([disabled]) [part='button'],
    :host([disabled]) [part='control'],
    button[disabled],
    [part='button'][disabled] {
      color: GrayText;
      border-color: GrayText;
      background-color: ButtonFace;
    }
  }
`;

/**
 * SURFACE — cards, dialogs, drawers, popovers, tooltips, toasts, alerts, banners.
 *
 * Do NOT use for:
 *   - interactive controls (use `forcedColorsInteractive`)
 *   - input fields (use `forcedColorsField`)
 *
 * Canvas/CanvasText is the OS-level "page" palette — appropriate for
 * container surfaces that hold content but are not themselves actionable.
 * A 1px CanvasText border ensures the container edge is visible against
 * other Canvas-tinted surfaces in HC mode (where multi-tier background
 * elevation is erased).
 */
export const forcedColorsSurface = css`
  @media (forced-colors: active) {
    :host {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    [part='header'],
    [part='footer'] {
      border-color: CanvasText;
    }
  }
`;

/**
 * FIELD — text-input, textarea, select, combobox, number-input, date-picker,
 * time-picker, color-picker, file-upload, phi-field.
 *
 * Do NOT use for:
 *   - buttons or action triggers inside the field (compose `forcedColorsInteractive`
 *     separately for those parts)
 *   - inline labels (labels inherit CanvasText from the surrounding surface)
 *
 * Field/FieldText are the OS-level "input" palette — distinct from Canvas
 * so users see the tappable/typable region. Highlight outline on focus is
 * additive to the browser's native focus ring, matching hx-text-input
 * precedent. Invalid state does NOT restyle border (forced-colors strips
 * decorative cues); rely on the component's aria-invalid + help-text role
 * for error conveyance.
 */
export const forcedColorsField = css`
  @media (forced-colors: active) {
    input,
    textarea,
    select,
    [part='input'],
    [part='control'] {
      background-color: Field;
      color: FieldText;
      border: 1px solid FieldText;
    }

    input::placeholder,
    textarea::placeholder,
    [part='input']::placeholder {
      color: GrayText;
    }

    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible,
    [part='input']:focus-visible,
    [part='control']:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--hx-focus-ring-offset, 2px);
    }

    :host([disabled]),
    input[disabled],
    textarea[disabled],
    select[disabled],
    [part='input'][disabled] {
      color: GrayText;
      border-color: GrayText;
    }
  }
`;

/**
 * LINK — `<a>` inside hx-link, hx-text, hx-prose, or any component rendering
 * an inline hyperlink.
 *
 * Do NOT use for:
 *   - buttons styled as links (use `forcedColorsInteractive`)
 *   - navigation items acting as buttons (side-nav, top-nav items — those
 *     compose `forcedColorsInteractive`)
 *
 * LinkText / VisitedText are the OS-level hyperlink palette. Browsers draw
 * their own underline in forced-colors mode; the outline on focus-visible
 * is redundant-but-explicit for assistive-tech consistency.
 */
export const forcedColorsLink = css`
  @media (forced-colors: active) {
    a,
    [part='link'] {
      color: LinkText;
    }

    a:visited,
    [part='link']:visited {
      color: VisitedText;
    }

    a:focus-visible,
    [part='link']:focus-visible {
      outline: 2px solid LinkText;
      outline-offset: var(--hx-focus-ring-offset, 2px);
    }

    a[aria-disabled='true'],
    [part='link'][aria-disabled='true'] {
      color: GrayText;
    }
  }
`;
