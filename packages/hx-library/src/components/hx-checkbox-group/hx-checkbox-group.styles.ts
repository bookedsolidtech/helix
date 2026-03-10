import { css } from 'lit';

export const helixCheckboxGroupStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled);
    cursor: not-allowed;
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
    gap: var(--hx-space-2);
    font-family: var(--hx-font-family-sans);
  }

  /* ─── Legend ─── */

  .fieldset__legend {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1);
    font-size: var(--hx-font-size-sm);
    font-weight: var(--hx-font-weight-medium);
    color: var(--hx-checkbox-group-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-normal);
    padding: 0;
    margin-bottom: var(--hx-space-1);
  }

  .fieldset__required-marker {
    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold);
  }

  /* ─── Items Container ─── */

  .fieldset__items {
    display: flex;
    flex-direction: column;
    gap: var(--hx-checkbox-group-gap, var(--hx-space-3));
  }

  :host([orientation='horizontal']) .fieldset__items {
    flex-direction: row;
    flex-wrap: wrap;
  }

  /* ─── Error State ─── */

  .fieldset--error .fieldset__legend {
    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-text, #b91c1c));
  }

  /* ─── Help Text & Error Messages ─── */

  .fieldset__help-text {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-color-neutral-500);
    line-height: var(--hx-line-height-normal);
  }

  .fieldset__error {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal);
  }
`;
