import { css } from 'lit';

export const helixListStyles = css`
  :host {
    display: block;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--hx-list-gap, 0);
  }

  /* ─── Variant: bulleted ─── */

  .list--bulleted {
    padding-inline-start: var(--hx-space-6, 1.5rem);
    list-style: disc;
  }

  /* ─── Variant: numbered ─── */

  .list--numbered {
    padding-inline-start: var(--hx-space-6, 1.5rem);
    list-style: decimal;
  }

  /* ─── Variant: interactive ─── */

  .list--interactive {
    list-style: none;
    padding: 0;
  }

  /* ─── Dividers ─── */

  :host([divided]) .list > ::slotted(hx-list-item:not(:last-child)) {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-list-divider-color, var(--hx-color-neutral-200, #e2e8f0));
  }
`;
