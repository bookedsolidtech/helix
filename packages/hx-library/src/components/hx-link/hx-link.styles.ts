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
    color: var(--hx-link-color, var(--hx-color-primary-500, #2563eb));
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
    color: var(--hx-link-color-hover, var(--hx-color-primary-700, #1d4ed8));
    text-decoration: var(--hx-link-text-decoration-hover, underline);
  }

  .link:active {
    color: var(--hx-link-color-active, var(--hx-color-primary-800, #1e40af));
  }

  .link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-link-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.125rem);
  }

  /* --- Variant: subtle --- */

  .link--subtle {
    color: var(--hx-link-color-subtle, var(--hx-color-neutral-600, #475569));
    text-decoration: none;
  }

  .link--subtle:hover {
    color: var(--hx-link-color-hover, var(--hx-color-primary-700, #1d4ed8));
    text-decoration: underline;
  }

  /* --- Variant: danger --- */

  .link--danger {
    color: var(--hx-link-color-danger, var(--hx-color-error-500, #dc2626));
  }

  .link--danger:hover {
    color: var(--hx-link-color-danger-hover, var(--hx-color-error-700, #b91c1c));
  }

  /* --- Disabled --- */

  .link--disabled {
    color: var(--hx-link-color-disabled, var(--hx-color-neutral-400, #94a3b8));
    text-decoration: none;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* --- External link icon --- */

  .link__external-icon {
    display: inline-flex;
    width: 0.75em;
    height: 0.75em;
    flex-shrink: 0;
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
