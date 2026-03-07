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

  /* Visually hide the separator slot — used only to read text content */
  .separator-slot {
    display: none;
  }
`;
