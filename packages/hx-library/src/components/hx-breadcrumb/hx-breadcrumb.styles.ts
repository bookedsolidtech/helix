import { css } from 'lit';

export const helixBreadcrumbStyles = css`
  :host {
    display: block;
    font-family: var(--hx-breadcrumb-font-family, var(--hx-font-family-sans));
    font-size: var(--hx-breadcrumb-font-size, var(--hx-font-size-sm));
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
`;
