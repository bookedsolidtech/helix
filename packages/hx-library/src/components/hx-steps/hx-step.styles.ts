import { css } from 'lit';

export const helixStepStyles = css`
  :host {
    display: flex;
    flex: var(--hx-steps-item-flex, 1);
    width: var(--hx-steps-item-width, auto);
    min-width: 0;
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
    outline: 2px solid var(--hx-color-primary-500, #2563eb);
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
    border: 2px solid var(--hx-color-neutral-300, #cbd5e1);
    background-color: var(--hx-color-neutral-0, #ffffff);
    color: var(--hx-color-neutral-500, #64748b);
    font-size: var(--hx-steps-indicator-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-font-weight-semibold, 600);
    font-family: var(--hx-font-family-sans, sans-serif);
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
    height: 2px;
    min-width: 0;
    background-color: var(--hx-steps-connector-color, var(--hx-color-neutral-200, #e2e8f0));
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
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-steps-label-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-steps-label-color, var(--hx-color-neutral-600, #475569));
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .step__description {
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-steps-description-font-size, var(--hx-font-size-xs, 0.75rem));
    color: var(--hx-steps-description-color, var(--hx-color-neutral-500, #64748b));
    margin-top: var(--hx-space-1, 0.25rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Status: active ─── */

  :host([status='active']) .step__indicator {
    border-color: var(--hx-color-primary-500, #2563eb);
    background-color: var(--hx-color-primary-500, #2563eb);
    color: var(--hx-color-neutral-0, #ffffff);
  }

  :host([status='active']) .step__label {
    color: var(--hx-color-primary-700, #1d4ed8);
    font-weight: var(--hx-font-weight-semibold, 600);
  }

  /* ─── Status: complete ─── */

  :host([status='complete']) .step__indicator {
    border-color: var(--hx-color-primary-500, #2563eb);
    background-color: var(--hx-color-primary-500, #2563eb);
    color: var(--hx-color-neutral-0, #ffffff);
  }

  :host([status='complete']) .step__connector {
    background-color: var(--hx-color-primary-500, #2563eb);
  }

  :host([status='complete']) .step__label {
    color: var(--hx-color-neutral-700, #334155);
  }

  /* ─── Status: error ─── */

  :host([status='error']) .step__indicator {
    border-color: var(--hx-color-error-500, #ef4444);
    background-color: var(--hx-color-error-500, #ef4444);
    color: var(--hx-color-neutral-0, #ffffff);
  }

  :host([status='error']) .step__label {
    color: var(--hx-color-error-700, #b91c1c);
  }

  /* ─── Status: disabled ─── */

  :host([disabled]) .step {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  :host([disabled]) .step__indicator {
    border-color: var(--hx-color-neutral-300, #cbd5e1);
    background-color: var(--hx-color-neutral-100, #f1f5f9);
    color: var(--hx-color-neutral-400, #94a3b8);
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
    width: 2px;
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
      background-color: var(--hx-color-neutral-800, #1e293b);
      border-color: var(--hx-color-neutral-600, #475569);
      color: var(--hx-color-neutral-300, #cbd5e1);
    }

    .step__connector {
      background-color: var(--hx-color-neutral-700, #334155);
    }

    .step__label {
      color: var(--hx-color-neutral-300, #cbd5e1);
    }

    .step__description {
      color: var(--hx-color-neutral-400, #94a3b8);
    }

    :host([status='active']) .step__label {
      color: var(--hx-color-primary-300, #93c5fd);
    }

    :host([status='complete']) .step__label {
      color: var(--hx-color-neutral-200, #e2e8f0);
    }

    :host([status='error']) .step__label {
      color: var(--hx-color-error-300, #fca5a5);
    }

    :host([disabled]) .step__indicator {
      background-color: var(--hx-color-neutral-900, #0f172a);
      border-color: var(--hx-color-neutral-700, #334155);
      color: var(--hx-color-neutral-600, #475569);
    }
  }
`;
