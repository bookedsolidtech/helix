import { css } from 'lit';

export const helixBreadcrumbItemStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
  }

  /*
   * display: contents removes [part='item'] from the box model entirely.
   * This is intentional — the wrapper exists only for slot selection purposes.
   * Consumers using ::part(item) CANNOT apply box-model properties (padding,
   * margin, background, border) to this part. Use ::part(link) or ::part(text)
   * for visual styling of breadcrumb item content.
   */
  [part='item'] {
    display: contents;
  }

  [part='link'] {
    color: var(--hx-breadcrumb-link-color, var(--hx-color-primary-600));
    text-decoration: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    max-width: var(--hx-breadcrumb-item-max-width);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part='link']:hover {
    color: var(--hx-breadcrumb-link-hover-color, var(--hx-color-primary-700));
    text-decoration: underline;
  }

  [part='link']:focus-visible {
    outline: 2px solid var(--hx-focus-ring-color, var(--hx-color-primary-500));
    outline-offset: 2px;
    border-radius: var(--hx-border-radius-sm, 0.125rem);
  }

  [part='text'] {
    color: var(--hx-breadcrumb-text-color, var(--hx-color-neutral-700));
    font-family: inherit;
    font-size: inherit;
    max-width: var(--hx-breadcrumb-item-max-width);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .separator {
    margin-inline: var(--hx-breadcrumb-separator-gap, var(--hx-space-1, 0.25rem));
    color: var(--hx-breadcrumb-separator-color, var(--hx-color-neutral-400));
    user-select: none;
  }

  .separator::before {
    content: var(--hx-breadcrumb-separator-content, '/');
  }

  /* Normalize buttons slotted into breadcrumb items (e.g. the expand-ellipsis button). */
  ::slotted(button) {
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
    padding: 0;
  }
`;
