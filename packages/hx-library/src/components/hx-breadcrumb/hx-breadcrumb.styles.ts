import { css } from 'lit';

export const helixBreadcrumbStyles = css`
  :host {
    display: block;
    font-family: var(
      --hx-breadcrumb-font-family,
      var(--hx-font-family-sans, system-ui, sans-serif)
    );
    font-size: var(--hx-breadcrumb-font-size, var(--hx-font-size-sm, 0.875rem));
  }

  [part='nav'] {
    /* nav landmark — no additional styling needed */
  }

  [part='list'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0;
  }

  /* Hide middle items when collapsed via maxItems */
  ::slotted([data-bc-hidden]) {
    display: none;
  }

  /*
   * Ellipsis ordering when collapsed (FS-014 fix):
   * The ellipsis <hx-breadcrumb-item> lives in shadow DOM to avoid mutating
   * the consumer's light DOM. CSS order places it between the first item
   * (order: 0, default) and the last item (order: 2) in the flex <ol>.
   */
  .hx-bc-ellipsis {
    order: 1;
  }

  ::slotted([data-bc-last]) {
    order: 2;
  }

  /* Visually hide the separator slot — used only to read text content.
   * display:none is intentional: the slot contains no interactive or focusable
   * content. If a future change adds focusable elements to this slot, switch to
   * visibility:hidden + position:absolute to preserve focus reachability. */
  .separator-slot {
    display: none;
  }
`;
