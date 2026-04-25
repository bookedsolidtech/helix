import { css } from 'lit';

/**
 * hx-popover styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-popover-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   neutral-0 = #FFFFFF, neutral-200 = #D6DBD5, neutral-900 = #0D1825,
 *   primary-500 = #429797.
 */
export const helixPopoverStyles = css`
  :host {
    /* P2-05: display:contents lets the trigger-wrapper control layout inline;
       position:relative was vestigial — body uses position:fixed via Floating UI */
    display: contents;
  }

  .trigger-wrapper {
    display: inline-block;
  }

  [part='body'] {
    position: fixed;
    z-index: var(--hx-popover-z-index, 9999);
    max-width: var(--hx-popover-max-width, 320px);
    padding: var(--hx-popover-padding, var(--hx-space-3, 0.75rem));
    background: var(--hx-popover-bg, var(--hx-color-surface-default, #ffffff));
    color: var(--hx-popover-color, var(--hx-color-text-primary, #0d1825));
    font-family: var(--hx-popover-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-popover-font-size, var(--hx-font-size-sm, 0.875rem));
    line-height: var(--hx-line-height-normal, 1.5);
    border: 1px solid var(--hx-popover-border-color, var(--hx-color-border-default, #d6dbd5));
    border-radius: var(--hx-popover-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-popover-shadow,
      var(--hx-shadow-md, 0 4px 16px var(--hx-overlay-black-12, rgba(0, 0, 0, 0.12)))
    );
    visibility: hidden;
    opacity: 0;
    transition:
      opacity var(--hx-popover-transition-duration, 0.2s) ease,
      visibility var(--hx-popover-transition-duration, 0.2s) ease;
    word-wrap: break-word;
  }

  [part='body'].visible {
    visibility: visible;
    opacity: 1;
  }

  [part='body']:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-popover-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  [part='arrow'] {
    position: absolute;
    width: var(--hx-popover-arrow-size, 10px);
    height: var(--hx-popover-arrow-size, 10px);
    background: var(--hx-popover-bg, var(--hx-color-surface-default, #ffffff));
    border: 1px solid var(--hx-popover-border-color, var(--hx-color-border-default, #d6dbd5));
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='body'] {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Belt-and-suspenders: rich per-class HC overrides PLUS the forcedColorsSurface mixin. */

  @media (forced-colors: active) {
    [part='body'] {
      border-color: CanvasText;
    }

    [part='arrow'] {
      border-color: CanvasText;
    }
  }
`;
