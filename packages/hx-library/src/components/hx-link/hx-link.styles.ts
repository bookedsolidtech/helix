import { css } from 'lit';

export const helixLinkStyles = css`
  :host {
    display: inline;
  }

  :host([disabled]) {
    cursor: not-allowed;
  }

  /* --- Base Link --- */

  .link {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    color: var(--hx-link-color, var(--hx-color-primary-600, #0f7078));
    font-family: var(--hx-link-font-family, var(--hx-font-family-sans, inherit));
    font-size: inherit;
    line-height: inherit;
    text-decoration: var(--hx-link-text-decoration, underline);
    text-underline-offset: var(--hx-link-underline-offset, 2px);
    cursor: pointer;
    outline: 0;
    transition:
      color var(--hx-transition-fast, 150ms ease),
      text-decoration-color var(--hx-transition-fast, 150ms ease);
  }

  .link:hover {
    color: var(--hx-link-color-hover, var(--hx-color-primary-700, #0f6363));
    text-decoration: var(--hx-link-text-decoration-hover, underline);
  }

  .link:active {
    color: var(--hx-link-color-active, var(--hx-color-primary-800, #07494a));
  }

  .link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-link-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* --- Variant: subtle --- */

  .link--subtle {
    color: var(--hx-link-color-subtle, var(--hx-color-text-secondary, #313e4b));
    text-decoration: none;
  }

  .link--subtle:hover {
    color: var(--hx-link-color-hover, var(--hx-color-primary-700, #0f6363));
    text-decoration: underline;
  }

  /* --- Variant: danger --- */

  .link--danger {
    color: var(--hx-link-color-danger, var(--hx-color-error-text, #c92a2a));
  }

  .link--danger:hover {
    color: var(--hx-link-color-danger-hover, var(--hx-color-error-700, #a21312));
  }

  /* --- Disabled --- */

  .link--disabled {
    color: var(--hx-link-color-disabled, var(--hx-color-text-disabled, #8e9c98));
    text-decoration: none;
    cursor: not-allowed;
  }

  /* --- External link icon --- */

  .link__external-icon {
    display: inline-flex;
    --hx-icon-size: 0.75em;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .link {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .link {
      forced-color-adjust: none;
      color: LinkText;
    }

    .link:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .link--disabled {
      color: GrayText;
    }
  }

  /* --- Visually hidden (sr-only) --- */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
`;
