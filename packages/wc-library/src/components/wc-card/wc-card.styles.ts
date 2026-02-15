import { css } from 'lit';

export const wcCardStyles = css`
  :host {
    display: block;
  }

  .card {
    display: flex;
    flex-direction: column;
    background-color: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
    color: var(--wc-card-color, var(--wc-color-neutral-800, #212529));
    border: var(--wc-border-width-thin, 1px) solid var(--wc-card-border-color, var(--wc-color-neutral-200, #dee2e6));
    border-radius: var(--wc-card-border-radius, var(--wc-border-radius-lg, 0.5rem));
    overflow: hidden;
    font-family: var(--wc-font-family-sans, sans-serif);
    transition: box-shadow var(--wc-transition-normal, 250ms ease),
                transform var(--wc-transition-normal, 250ms ease);
  }

  /* ─── Elevation Variants ─── */

  .card--flat {
    box-shadow: none;
  }

  .card--raised {
    box-shadow: var(--wc-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  }

  .card--floating {
    box-shadow: var(--wc-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1));
  }

  /* ─── Style Variants ─── */

  .card--default {
    /* Default styling — uses base styles */
  }

  .card--featured {
    border-color: var(--wc-color-primary-500, #007878);
    border-width: var(--wc-border-width-medium, 2px);
  }

  .card--compact .card__body {
    padding: var(--wc-space-3, 0.75rem);
  }

  /* ─── Interactive ─── */

  .card--interactive {
    cursor: pointer;
  }

  .card--interactive:hover {
    box-shadow: var(--wc-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
    transform: translateY(var(--wc-transform-lift-md, -2px));
  }

  .card--interactive:focus-visible {
    outline: var(--wc-focus-ring-width, 2px) solid var(--wc-focus-ring-color, #007878);
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  .card--interactive:active {
    transform: translateY(0);
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
    height: auto;
    display: block;
    object-fit: cover;
  }

  .card__heading {
    padding-top: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-right: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-bottom: 0;
    padding-left: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    font-size: var(--wc-font-size-xl, 1.25rem);
    font-weight: var(--wc-font-weight-semibold, 600);
    line-height: var(--wc-line-height-tight, 1.25);
  }

  .card__body {
    padding: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    flex: 1;
    font-size: var(--wc-font-size-md, 1rem);
    line-height: var(--wc-line-height-normal, 1.5);
    color: var(--wc-color-neutral-600, #495057);
  }

  .card__footer {
    padding-top: 0;
    padding-right: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-bottom: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-left: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
  }

  .card__actions {
    display: flex;
    gap: var(--wc-space-2, 0.5rem);
    padding-top: var(--wc-space-4, 1rem);
    padding-right: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-bottom: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    padding-left: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
    border-top: var(--wc-border-width-thin, 1px) solid var(--wc-card-border-color, var(--wc-color-neutral-200, #dee2e6));
    margin-top: auto;
  }
`;
