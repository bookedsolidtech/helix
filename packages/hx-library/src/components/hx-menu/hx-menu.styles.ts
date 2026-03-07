import { css } from 'lit';

export const helixMenuStyles = css`
  :host {
    display: block;
  }

  .menu {
    display: flex;
    flex-direction: column;
    padding: var(--hx-space-1, 0.25rem);
    background: var(--hx-menu-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-menu-border-color, var(--hx-color-neutral-200, #e2e8f0));
    border-radius: var(--hx-menu-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-menu-shadow,
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1)
    );
    min-width: var(--hx-menu-min-width, 10rem);
    outline: none;
  }
`;
