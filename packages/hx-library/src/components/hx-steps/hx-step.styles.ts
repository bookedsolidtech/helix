import { css } from 'lit';

export const helixStepStyles = css`
  :host {
    display: flex;
    flex: var(--hx-steps-item-flex, 1);
    width: var(--hx-steps-item-width, auto);
    min-width: 0;
  }

  /* ─── Visually Hidden (SR only) ─── */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ─── Step Wrapper ─── */

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    cursor: pointer;
  }

  /* ─── Focus ─── */

  :host(:focus-visible) .step__indicator {
    outline: 2px solid var(--hx-color-primary-500);
    outline-offset: 2px;
  }

  /* ─── Track (indicator + connector) ─── */

  .step__track {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }

  /* ─── Indicator ─── */

  .step__indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-steps-indicator-size, 2rem);
    height: var(--hx-steps-indicator-size, 2rem);
    border-radius: var(--hx-border-radius-full, 9999px);
    border: 2px solid var(--hx-color-neutral-300);
    background-color: var(--hx-color-neutral-0);
    color: var(--hx-color-neutral-500);
    font-size: var(--hx-steps-indicator-font-size, var(--hx-font-size-sm));
    font-weight: var(--hx-font-weight-semibold);
    font-family: var(--hx-font-family-sans);
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease);
    position: relative;
    z-index: 1;
  }

  .step__indicator svg {
    width: var(--hx-steps-indicator-icon-size, 1rem);
    height: var(--hx-steps-indicator-icon-size, 1rem);
  }

  /* ─── Connector ─── */

  .step__connector {
    flex: 1;
    height: var(--hx-steps-connector-thickness, var(--hx-border-width, 2px));
    min-width: 0;
    background-color: var(--hx-steps-connector-color, var(--hx-color-neutral-200));
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  :host(:last-child) .step__connector {
    display: none;
  }

  /* ─── Label Area ─── */

  .step__label-area {
    text-align: center;
    margin-top: var(--hx-space-2, 0.5rem);
    width: 100%;
    padding: 0 var(--hx-space-1, 0.25rem);
  }

  .step__label {
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-steps-label-font-size, var(--hx-font-size-sm));
    font-weight: var(--hx-font-weight-medium);
    color: var(--hx-steps-label-color, var(--hx-color-neutral-600));
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .step__description {
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-steps-description-font-size, var(--hx-font-size-xs));
    color: var(--hx-steps-description-color, var(--hx-color-neutral-500));
    margin-top: var(--hx-space-1, 0.25rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Status: active ─── */

  /* Active: outlined indicator (in-progress) — visually distinct from complete (filled) */
  :host([status='active']) .step__indicator {
    border-color: var(--hx-color-primary-500);
    background-color: var(--hx-color-primary-500);
    color: var(--hx-color-neutral-0);
  }

  :host([status='active']) .step__label {
    color: var(--hx-color-primary-700);
    font-weight: var(--hx-font-weight-semibold);
  }

  /* ─── Status: complete ─── */

  /* Complete: filled indicator with darker shade — visually distinct from active */
  :host([status='complete']) .step__indicator {
    border-color: var(--hx-color-primary-700);
    background-color: var(--hx-color-primary-700);
    color: var(--hx-color-neutral-0);
  }

  :host([status='complete']) .step__connector {
    background-color: var(--hx-steps-connector-complete-color, var(--hx-color-primary-500));
  }

  :host([status='complete']) .step__label {
    color: var(--hx-color-neutral-700);
  }

  /* ─── Status: error ─── */

  :host([status='error']) .step__indicator {
    border-color: var(--hx-color-error-500);
    background-color: var(--hx-color-error-500);
    color: var(--hx-color-neutral-0);
  }

  :host([status='error']) .step__label {
    color: var(--hx-color-error-700);
  }

  /* ─── Status: disabled ─── */

  :host([disabled]) .step {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  :host([disabled]) .step__indicator {
    border-color: var(--hx-color-neutral-300);
    background-color: var(--hx-color-neutral-100);
    color: var(--hx-color-neutral-400);
  }

  /* ─── Vertical Layout ─── */

  :host([orientation='vertical']) {
    flex: initial;
    width: 100%;
  }

  :host([orientation='vertical']) .step {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--hx-space-3, 0.75rem);
  }

  :host([orientation='vertical']) .step__track {
    flex-direction: column;
    align-items: center;
    width: auto;
    flex-shrink: 0;
  }

  :host([orientation='vertical']) .step__connector {
    width: var(--hx-steps-connector-thickness, var(--hx-border-width, 2px));
    height: auto;
    min-height: var(--hx-space-8, 2rem);
    flex: 1;
  }

  :host([orientation='vertical']) .step__label-area {
    text-align: left;
    margin-top: 0;
    padding-bottom: var(--hx-space-4, 1rem);
    padding-inline-start: 0;
  }

  :host([orientation='vertical']:last-child) .step__label-area {
    padding-bottom: 0;
  }

  /* ─── Dark Mode ─── */

  @media (prefers-color-scheme: dark) {
    .step__indicator {
      background-color: var(--hx-color-neutral-800);
      border-color: var(--hx-color-neutral-600);
      color: var(--hx-color-neutral-300);
    }

    .step__connector {
      background-color: var(--hx-color-neutral-700);
    }

    .step__label {
      color: var(--hx-color-neutral-300);
    }

    .step__description {
      color: var(--hx-color-neutral-400);
    }

    :host([status='active']) .step__label {
      color: var(--hx-color-primary-300);
    }

    :host([status='complete']) .step__label {
      color: var(--hx-color-neutral-200);
    }

    :host([status='error']) .step__label {
      color: var(--hx-color-error-300);
    }

    :host([disabled]) .step__indicator {
      background-color: var(--hx-color-neutral-900);
      border-color: var(--hx-color-neutral-700);
      color: var(--hx-color-neutral-600);
    }
  }
`;
