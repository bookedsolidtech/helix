import { css } from 'lit';

export const helixLinkStyles = css`
  :host {
    display: inline;
  }

  :host([disabled]) {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Base Link ─── */

  .link {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    color: var(--hx-link-color, var(--hx-color-primary-500, #2563eb));
    font-family: var(--hx-link-font-family, inherit);
    font-weight: var(--hx-link-font-weight, inherit);
    font-size: inherit;
    line-height: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    cursor: pointer;
    transition: color var(--hx-transition-fast, 150ms ease);
  }

  .link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-link-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.125rem);
  }

  .link:hover {
    color: var(--hx-link-color-hover, var(--hx-color-primary-700, #1d4ed8));
  }

  .link:visited {
    color: var(--hx-link-color-visited, var(--hx-color-primary-700, #1d4ed8));
  }

  /* ─── Variants ─── */

  .link--default {
    --hx-link-color: var(--hx-color-primary-500, #2563eb);
    --hx-link-color-hover: var(--hx-color-primary-700, #1d4ed8);
  }

  .link--subtle {
    --hx-link-color: var(--hx-color-neutral-600, #475569);
    --hx-link-color-hover: var(--hx-color-neutral-900, #0f172a);
    text-decoration-color: var(--hx-color-neutral-400, #94a3b8);
  }

  .link--subtle:hover {
    text-decoration-color: var(--hx-color-neutral-600, #475569);
  }

  .link--danger {
    --hx-link-color: var(--hx-color-error-600, #dc2626);
    --hx-link-color-hover: var(--hx-color-error-700, #b91c1c);
  }

  /* ─── Disabled ─── */

  .link--disabled {
    cursor: not-allowed;
    text-decoration: none;
    pointer-events: none;
  }

  /* ─── Prefix / Suffix / Label ─── */

  .link__prefix,
  .link__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .link__label {
    flex: 1 1 auto;
  }

  /* ─── Visually Hidden ─── */

  .link__visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
