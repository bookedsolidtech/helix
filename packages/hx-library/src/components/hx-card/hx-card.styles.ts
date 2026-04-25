import { css } from 'lit';

/**
 * hx-card styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-card-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   neutral-0 = #FFFFFF, neutral-200 = #D6DBD5, neutral-800 = #202B39,
 *   neutral-600 = #4A5362, primary-500 = #429797.
 */
export const helixCardStyles = css`
  :host {
    display: block;
    color: var(--hx-card-color, inherit);
    background-color: var(--hx-card-bg, var(--hx-color-surface-default, #ffffff));
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--hx-card-gap, var(--hx-space-4, 1rem));
    background-color: var(--hx-card-bg, var(--hx-color-surface-default, #ffffff));
    color: var(--hx-card-color, var(--hx-color-text-strong, #202b39));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-border-default, #d6dbd5));
    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));
    overflow: hidden;
    font-family: var(--hx-card-font-family, var(--hx-font-family-sans, sans-serif));
    transition:
      box-shadow var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease);
  }

  /* ─── Elevation Variants ─── */

  .card--flat {
    box-shadow: none;
  }

  .card--raised {
    box-shadow: var(--hx-card-shadow, var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1)));
  }

  .card--floating {
    box-shadow: var(
      --hx-card-shadow-floating,
      var(--hx-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1))
    );
  }

  /* ─── Style Variants ─── */

  .card--default {
    /* Default styling — uses base styles */
  }

  .card--featured {
    border-color: var(--hx-card-featured-border-color, var(--hx-color-primary-500, #429797));
    border-width: var(--hx-card-featured-border-width, var(--hx-border-width-medium, 2px));
  }

  .card--compact .card__body {
    padding: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__heading {
    padding-top: var(--hx-space-3, 0.75rem);
    padding-inline-end: var(--hx-space-3, 0.75rem);
    padding-inline-start: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__footer {
    padding-inline-end: var(--hx-space-3, 0.75rem);
    padding-bottom: var(--hx-space-3, 0.75rem);
    padding-inline-start: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__actions {
    padding-inline-end: var(--hx-space-3, 0.75rem);
    padding-bottom: var(--hx-space-3, 0.75rem);
    padding-inline-start: var(--hx-space-3, 0.75rem);
  }

  /* ─── Interactive ─── */

  .card--interactive {
    cursor: pointer;
  }

  .card--interactive:hover {
    box-shadow: var(--hx-card-shadow-hover, var(--hx-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1)));
    transform: translateY(var(--hx-transform-lift-md, -2px));
  }

  .card--interactive:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-card-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .card--interactive:active {
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }

    .card--interactive:hover {
      transform: none;
    }

    .card--interactive:active {
      transform: none;
    }
  }

  /* ─── Hidden empty slot wrappers ─── */

  [hidden] {
    display: none !important;
  }

  /* ─── Sections ─── */

  .card__image {
    overflow: hidden;
    line-height: 0;
  }

  .card__image ::slotted(img) {
    width: 100%;
    aspect-ratio: var(--hx-card-image-aspect-ratio, 16 / 9);
    display: block;
    object-fit: cover;
  }

  .card__heading {
    padding-top: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-inline-end: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: 0;
    padding-inline-start: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    font-size: var(--hx-font-size-xl, 1.25rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .card__body {
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    flex: 1;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-card-body-color, var(--hx-color-text-secondary, #4a5362));
  }

  .card__footer {
    padding-top: 0;
    padding-inline-end: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-inline-start: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
  }

  .card__actions {
    display: flex;
    gap: var(--hx-space-2, 0.5rem);
    padding-top: var(--hx-space-4, 1rem);
    padding-inline-end: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-inline-start: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-border-default, #d6dbd5));
    margin-top: auto;
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Belt-and-suspenders: rich per-class HC overrides PLUS the forcedColorsSurface mixin. */

  @media (forced-colors: active) {
    .card {
      border-color: CanvasText;
    }

    .card__actions {
      border-top-color: CanvasText;
    }
  }
`;
