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

  /* ─── Variant: description ─── */

  .list--description {
    padding: 0;
    list-style: none;
  }

  /* ─── Dividers ─── */

  :host([divided]) .list > ::slotted(hx-list-item:not(:last-child)) {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-list-divider-color, var(--hx-color-neutral-200, #d6dbd5));
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    /* Divider borders are already using a border property, which forced-colors respects.
       Ensure the system color is used for divider borders. */
    :host([divided]) .list > ::slotted(hx-list-item:not(:last-child)) {
      border-bottom-color: CanvasText;
    }
  }
`;
