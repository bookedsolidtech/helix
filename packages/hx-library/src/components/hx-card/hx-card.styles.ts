import { css } from 'lit';

export const helixCardStyles = css`
  :host {
    display: block;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--hx-card-gap, 0);
    background-color: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-card-color, var(--hx-color-neutral-800, #212529));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));
    overflow: hidden;
    font-family: var(--hx-font-family-sans, sans-serif);
    transition:
      box-shadow var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease);
  }

  /* ─── Elevation Variants ─── */

  .card--flat {
    box-shadow: none;
  }

  .card--raised {
    box-shadow: var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  }

  .card--floating {
    box-shadow: var(--hx-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1));
  }

  /* ─── Style Variants ─── */

  .card--default {
    /* Default styling — uses base styles */
  }

  .card--featured {
    border-color: var(--hx-color-primary-500, #2563eb);
    border-width: var(--hx-border-width-medium, 2px);
  }

  .card--compact .card__heading,
  .card--compact .card__body,
  .card--compact .card__footer,
  .card--compact .card__actions {
    padding-right: var(--hx-space-3, 0.75rem);
    padding-left: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__heading {
    padding-top: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__body {
    padding-top: var(--hx-space-3, 0.75rem);
    padding-bottom: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__footer {
    padding-bottom: var(--hx-space-3, 0.75rem);
  }

  .card--compact .card__actions {
    padding-top: var(--hx-space-3, 0.75rem);
    padding-bottom: var(--hx-space-3, 0.75rem);
  }

  /* ─── Interactive ─── */

  .card--interactive {
    cursor: pointer;
  }

  .card--interactive:hover {
    box-shadow: var(--hx-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
    transform: translateY(var(--hx-transform-lift-md, -2px));
  }

  .card--interactive:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
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
    padding-top: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-right: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: 0;
    padding-left: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    font-size: var(--hx-font-size-xl, 1.25rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .card__body {
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    flex: 1;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-color-neutral-600, #495057);
  }

  .card__footer {
    padding-top: 0;
    padding-right: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-left: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
  }

  .card__actions {
    display: flex;
    gap: var(--hx-space-2, 0.5rem);
    padding-top: var(--hx-space-4, 1rem);
    padding-right: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-left: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
    margin-top: auto;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }

    .card--interactive:hover {
      transform: none;
    }
  }
`;
