import { css } from 'lit';

export const wcRadioGroupStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--wc-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Fieldset ─── */

  .fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--wc-space-2, 0.5rem);
    font-family: var(--wc-font-family-sans, sans-serif);
  }

  /* ─── Legend ─── */

  .fieldset__legend {
    display: flex;
    align-items: baseline;
    gap: var(--wc-space-1, 0.25rem);
    font-size: var(--wc-font-size-sm, 0.875rem);
    font-weight: var(--wc-font-weight-medium, 500);
    color: var(--wc-radio-group-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
    padding: 0;
    margin-bottom: var(--wc-space-1, 0.25rem);
  }

  .fieldset__required-marker {
    color: var(--wc-radio-group-error-color, var(--wc-color-error-500, #dc3545));
    font-weight: var(--wc-font-weight-bold, 700);
  }

  /* ─── Group Container ─── */

  .fieldset__group {
    display: flex;
    flex-direction: column;
    gap: var(--wc-radio-group-gap, var(--wc-space-3, 0.75rem));
  }

  :host([orientation='horizontal']) .fieldset__group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  /* ─── Error State ─── */

  .fieldset--error .fieldset__legend {
    color: var(--wc-radio-group-error-color, var(--wc-color-error-500, #dc3545));
  }

  /* ─── Help Text & Error Messages ─── */

  .fieldset__help-text {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .fieldset__error {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-radio-group-error-color, var(--wc-color-error-500, #dc3545));
    line-height: var(--wc-line-height-normal, 1.5);
  }
`;
