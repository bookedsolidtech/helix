import { css } from 'lit';

export const helixStepsStyles = css`
  :host {
    display: block;

    /* ─── Size defaults (md) ─── */
    --hx-steps-indicator-size: 2rem;
    --hx-steps-indicator-font-size: var(--hx-font-size-sm, 0.875rem);
    --hx-steps-indicator-icon-size: 1rem;
    --hx-steps-label-font-size: var(--hx-font-size-sm, 0.875rem);
    --hx-steps-description-font-size: var(--hx-font-size-xs, 0.75rem);

    /* ─── Item layout defaults (horizontal) ─── */
    --hx-steps-item-flex: 1;
    --hx-steps-item-width: auto;
  }

  .steps {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  /* ─── Orientation: vertical ─── */

  :host([orientation='vertical']) {
    --hx-steps-item-flex: initial;
    --hx-steps-item-width: 100%;
  }

  :host([orientation='vertical']) .steps {
    flex-direction: column;
  }

  /* ─── Size: sm ─── */

  :host([size='sm']) {
    --hx-steps-indicator-size: 1.5rem;
    --hx-steps-indicator-font-size: var(--hx-font-size-xs, 0.75rem);
    --hx-steps-indicator-icon-size: 0.75rem;
    --hx-steps-label-font-size: var(--hx-font-size-xs, 0.75rem);
    --hx-steps-description-font-size: var(--hx-font-size-xs, 0.75rem);
  }

  /* ─── Size: lg ─── */

  :host([size='lg']) {
    --hx-steps-indicator-size: 2.5rem;
    --hx-steps-indicator-font-size: var(--hx-font-size-md, 1rem);
    --hx-steps-indicator-icon-size: 1.25rem;
    --hx-steps-label-font-size: var(--hx-font-size-md, 1rem);
    --hx-steps-description-font-size: var(--hx-font-size-sm, 0.875rem);
  }
`;
