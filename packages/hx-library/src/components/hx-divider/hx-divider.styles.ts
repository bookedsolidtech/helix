import { css } from 'lit';

export const helixDividerStyles = css`
  :host {
    display: block;
    --_divider-color: var(--hx-divider-color, var(--hx-color-neutral-200, #e2e8f0));
    --_divider-width: var(--hx-divider-width, var(--hx-border-width-thin, 1px));
    --_divider-label-color: var(--hx-divider-label-color, var(--hx-color-neutral-500, #64748b));
    --_divider-label-size: var(--hx-divider-label-font-size, var(--hx-font-size-sm, 0.875rem));
    --_divider-label-gap: var(--hx-divider-label-gap, var(--hx-space-3, 0.75rem));
  }

  /* ─── Spacing Variants ─── */

  :host([spacing='none']) {
    --_spacing: 0;
  }

  :host([spacing='sm']) {
    --_spacing: var(--hx-space-2, 0.5rem);
  }

  :host,
  :host([spacing='md']) {
    --_spacing: var(--hx-space-4, 1rem);
  }

  :host([spacing='lg']) {
    --_spacing: var(--hx-space-6, 1.5rem);
  }

  /* ─── Horizontal (default) ─── */

  :host([orientation='horizontal']) {
    margin-block: var(--_spacing);
  }

  /* ─── Vertical ─── */

  :host([orientation='vertical']) {
    display: inline-flex;
    align-self: stretch;
    margin-inline: var(--_spacing);
  }

  /* ─── Base (hr) — horizontal ─── */

  .divider {
    display: flex;
    align-items: center;
    gap: var(--_divider-label-gap);
    border: none;
    margin: 0;
    padding: 0;
  }

  /* ─── Base — vertical ─── */

  :host([orientation='vertical']) .divider {
    flex-direction: column;
    height: 100%;
  }

  /* ─── Lines flanking label ─── */

  .divider__line {
    flex: 1;
    background-color: var(--_divider-color);
  }

  :host(:not([orientation='vertical'])) .divider__line {
    height: var(--_divider-width);
  }

  :host([orientation='vertical']) .divider__line {
    width: var(--_divider-width);
    height: auto;
    min-height: 0;
  }

  /* ─── Label ─── */

  .divider__label {
    flex-shrink: 0;
    color: var(--_divider-label-color);
    font-size: var(--_divider-label-size);
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
  }
`;
