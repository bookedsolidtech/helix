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
    /*
     * AAA 2.5.5 Target Size (Enhanced) — links rendered as inline text
     * default to ~17px tall, well below the 44×44 AAA bar. Use
     * inline-flex + min-height + vertical padding to grow the
     * interactive area to ≥44×44 without enlarging the visible text.
     * The padding is symmetrical so the visible label stays vertically
     * centered against adjacent separators.
     */
    display: inline-flex;
    align-items: center;
    min-height: var(--hx-breadcrumb-link-min-height, var(--hx-touch-target-min, 44px));
    padding-block: var(--hx-breadcrumb-link-padding-y, var(--hx-space-2, 0.5rem));
    padding-inline: var(--hx-breadcrumb-link-padding-x, var(--hx-space-1, 0.25rem));
    color: var(--hx-breadcrumb-link-color, var(--hx-color-text-link, #0f6363));
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
    color: var(--hx-breadcrumb-link-hover-color, var(--hx-color-text-link-hover, #07494a));
    text-decoration: underline;
  }

  [part='link']:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-breadcrumb-link-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  [part='text'] {
    color: var(--hx-breadcrumb-text-color, var(--hx-color-text-strong, #202b39));
    font-family: inherit;
    font-size: inherit;
    max-width: var(--hx-breadcrumb-item-max-width);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .separator {
    margin-inline: var(--hx-breadcrumb-separator-gap, var(--hx-space-1, 0.25rem));
    color: var(--hx-breadcrumb-separator-color, var(--hx-color-text-muted, #4a5362));
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

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    [part='link'] {
      color: LinkText;
    }

    [part='link']:hover {
      color: LinkText;
    }

    .separator {
      color: CanvasText;
    }
  }
`;
