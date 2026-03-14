import { css } from 'lit';

export const helixRadioGroupStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
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
    gap: var(--hx-space-2, 0.5rem);
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Legend ─── */

  .fieldset__legend {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-radio-group-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
    padding: 0;
    margin-bottom: var(--hx-space-1, 0.25rem);
  }

  .fieldset__required-marker {
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Group Container ─── */

  .fieldset__group {
    display: flex;
    flex-direction: column;
    gap: var(--hx-radio-group-gap, var(--hx-space-3, 0.75rem));
  }

  :host([orientation='horizontal']) .fieldset__group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  /* ─── Error State ─── */

  .fieldset--error .fieldset__legend {
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #b91c1c));
  }

  /* ─── Help Text & Error Messages ─── */

  .fieldset__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-radio-group-help-text-color, var(--hx-color-neutral-500, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .fieldset__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
