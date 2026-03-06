import { css } from 'lit';

export const helixStructuredListStyles = css`
  :host {
    display: block;
    --_border-color: var(--hx-structured-list-border-color, var(--hx-color-neutral-200, #e2e8f0));
    --_border-width: var(--hx-structured-list-border-width, var(--hx-border-width-thin, 1px));
    --_bg-stripe: var(--hx-structured-list-stripe-bg, var(--hx-color-neutral-50, #f8fafc));
    --_padding-block: var(--hx-structured-list-padding-block, var(--hx-space-4, 1rem));
    --_padding-inline: var(--hx-structured-list-padding-inline, var(--hx-space-4, 1rem));
  }

  :host([condensed]) {
    --_padding-block: var(--hx-structured-list-condensed-padding-block, var(--hx-space-2, 0.5rem));
    --_padding-inline: var(
      --hx-structured-list-condensed-padding-inline,
      var(--hx-space-3, 0.75rem)
    );
  }

  .list {
    display: block;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  :host([bordered]) .list {
    border: var(--_border-width) solid var(--_border-color);
    border-radius: var(--hx-border-radius-md, 0.375rem);
    overflow: hidden;
  }
`;

export const helixStructuredListRowStyles = css`
  :host {
    display: block;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: baseline;
    padding-block: var(--_padding-block, var(--hx-space-4, 1rem));
    padding-inline: var(--_padding-inline, var(--hx-space-4, 1rem));
    gap: var(--hx-space-4, 1rem);
  }

  :host(:not(:last-of-type)) .row {
    border-bottom: 1px solid var(--_border-color, var(--hx-color-neutral-200, #e2e8f0));
  }

  .row__label {
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-structured-list-label-color, var(--hx-color-neutral-700, #374151));
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .row__value {
    color: var(--hx-structured-list-value-color, var(--hx-color-neutral-900, #111827));
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .row__actions {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
  }

  .row__actions:empty {
    display: none;
  }
`;
