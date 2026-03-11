import { css } from 'lit';

export const helixFieldLabelStyles = css`
  :host {
    display: block;
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-label-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-font-label-weight, var(--hx-font-weight-medium, 500));
    color: var(--hx-field-label-color, var(--hx-color-neutral-700, #374151));
    line-height: var(--hx-font-label-line-height, var(--hx-line-height-normal, 1.5));
    font-family: var(--hx-font-label-family, var(--hx-font-family-sans, sans-serif));
  }

  .required-indicator {
    color: var(
      --hx-field-label-required-color,
      var(--hx-color-danger, var(--hx-color-error-text, #b91c1c))
    );
    font-weight: var(--hx-font-weight-bold, 700);
  }

  .optional-indicator {
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-normal, 400);
    color: var(--hx-color-neutral-500, #6b7280);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
