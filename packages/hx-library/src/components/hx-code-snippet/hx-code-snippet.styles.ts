import { css } from 'lit';

export const helixCodeSnippetStyles = css`
  :host {
    display: block;
  }

  :host([inline]) {
    display: inline;
  }

  /* ─── Inline Mode ─── */

  .code-snippet--inline {
    display: inline;
    font-family: var(--hx-code-snippet-font-family, var(--hx-font-family-mono, monospace));
    font-size: var(--hx-code-snippet-font-size, var(--hx-font-size-sm, 0.875em));
    background-color: var(--hx-code-snippet-inline-bg, var(--hx-color-neutral-100, #f1f5f9));
    color: var(--hx-code-snippet-inline-color, var(--hx-color-neutral-900, #0f172a));
    padding: var(--hx-code-snippet-inline-padding-y, 0.125em)
      var(--hx-code-snippet-inline-padding-x, 0.375em);
    border-radius: var(--hx-code-snippet-border-radius, var(--hx-border-radius-sm, 0.25rem));
  }

  /* ─── Block Mode Container ─── */

  .code-snippet {
    position: relative;
    background-color: var(--hx-code-snippet-bg, var(--hx-color-neutral-900, #0f172a));
    border-radius: var(--hx-code-snippet-border-radius, var(--hx-border-radius-md, 0.375rem));
    overflow: hidden;
  }

  /* ─── Hidden Slot ─── */

  .code-snippet__slot {
    display: none;
  }

  /* ─── Header ─── */

  .code-snippet__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-2, 0.5rem) 0;
    min-height: var(--hx-space-8, 2rem);
  }

  /* ─── Pre / Code ─── */

  .code-snippet__pre {
    margin: 0;
    padding: var(--hx-code-snippet-padding, var(--hx-space-4, 1rem));
    overflow-x: auto;
    white-space: pre;
  }

  .code-snippet__pre--wrap {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .code-snippet__code {
    display: block;
    font-family: var(--hx-code-snippet-font-family, var(--hx-font-family-mono, monospace));
    font-size: var(--hx-code-snippet-font-size, var(--hx-font-size-sm, 0.875rem));
    line-height: var(--hx-line-height-relaxed, 1.625);
    color: var(--hx-code-snippet-color, var(--hx-color-neutral-100, #f1f5f9));
    tab-size: var(--hx-code-snippet-tab-size, 2);
  }

  /* ─── Copy Button ─── */

  .code-snippet__copy-button {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-600, #475569);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background-color: var(--hx-color-neutral-800, #1e293b);
    color: var(--hx-color-neutral-200, #e2e8f0);
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-none, 1);
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease);
    white-space: nowrap;
    z-index: var(--hx-z-index-raised, 1);
  }

  .code-snippet__copy-button:hover {
    background-color: var(--hx-color-neutral-700, #334155);
    border-color: var(--hx-color-neutral-500, #64748b);
  }

  .code-snippet__copy-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .code-snippet__copy-button:active {
    /* Non-standard token — fallback 0.8 applies if token is absent */
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Expand Button ─── */

  .code-snippet__expand-button {
    display: block;
    width: 100%;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    border: none;
    border-top: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-700, #334155);
    background-color: var(--hx-color-neutral-800, #1e293b);
    color: var(--hx-color-neutral-300, #cbd5e1);
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    text-align: center;
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .code-snippet__expand-button:hover {
    background-color: var(--hx-color-neutral-700, #334155);
    color: var(--hx-color-neutral-100, #f1f5f9);
  }

  .code-snippet__expand-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Line Numbers ─── */

  .code-snippet__line-number {
    display: inline-block;
    min-width: var(--hx-space-8, 2rem);
    padding-right: var(--hx-space-3, 0.75rem);
    color: var(--hx-code-snippet-line-number-color, var(--hx-color-neutral-500, #64748b));
    user-select: none;
    text-align: right;
  }

  /* ─── Screen-reader only ─── */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
