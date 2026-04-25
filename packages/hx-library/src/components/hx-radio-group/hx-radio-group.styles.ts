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
    font-family: var(--hx-radio-group-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Legend ─── */

  .fieldset__legend {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-radio-group-label-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
    padding: 0;
    margin-bottom: var(--hx-space-1, 0.25rem);
  }

  .fieldset__required-marker {
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #c92a2a));
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
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #c92a2a));
  }

  /* ─── Help Text & Error Messages ─── */

  .fieldset__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-radio-group-help-text-color, var(--hx-color-text-muted, #66787b));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .fieldset__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-radio-group-error-color, var(--hx-color-error-text, #c92a2a));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .fieldset {
      border: none;
    }

    .fieldset__legend {
      color: CanvasText;
    }

    .fieldset--error .fieldset__legend {
      color: LinkText;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .fieldset__legend {
      color: GrayText;
    }

    .fieldset__help-text {
      color: GrayText;
    }

    .fieldset__error {
      color: LinkText;
    }
  }
`;
