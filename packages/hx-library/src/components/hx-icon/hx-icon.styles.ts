import { css } from 'lit';

export const helixIconStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-icon-size, var(--hx-size-6, 1.5rem));
    height: var(--hx-icon-size, var(--hx-size-6, 1.5rem));
    color: var(--hx-icon-color, var(--hx-color-text-primary, currentColor));
    flex-shrink: 0;
  }

  /* ─── Size Variants ─── */

  :host([hx-size='xs']) {
    --hx-icon-size: var(--hx-size-4, 1rem);
  }

  :host([hx-size='sm']) {
    --hx-icon-size: var(--hx-size-5, 1.25rem);
  }

  :host([hx-size='md']) {
    --hx-icon-size: var(--hx-size-6, 1.5rem);
  }

  :host([hx-size='lg']) {
    --hx-icon-size: var(--hx-size-8, 2rem);
  }

  :host([hx-size='xl']) {
    --hx-icon-size: var(--hx-size-10, 2.5rem);
  }

  /* ─── SVG ─── */

  svg[part='svg'] {
    width: 100%;
    height: 100%;
    fill: currentColor;
    display: block;
    overflow: visible;
  }

  /* ─── Inline SVG wrapper ─── */

  .icon__inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .icon__inline svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
    display: block;
  }
`;
