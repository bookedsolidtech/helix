import { css } from 'lit';

export const helixFileUploadStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-2, 0.5rem);
    font-family: var(--hx-file-upload-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-color-text-strong, #202b39);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Dropzone ─── */

  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    min-height: var(--hx-space-32, 8rem);
    padding: var(--hx-space-6, 1.5rem) var(--hx-space-4, 1rem);
    border: var(--hx-border-width-thin, 1px) dashed
      var(--hx-file-upload-dropzone-border-color, var(--hx-color-border-strong, #66787b));
    border-radius: var(--hx-file-upload-dropzone-border-radius, var(--hx-border-radius-lg, 0.5rem));
    background-color: var(--hx-file-upload-dropzone-bg, var(--hx-color-surface-raised, #f5f8f3));
    cursor: pointer;
    text-align: center;
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    user-select: none;
    color: var(--hx-color-text-secondary, #313e4b);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .dropzone:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-file-upload-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-color: var(--hx-file-upload-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
  }

  .dropzone--drag-over {
    border-color: var(--hx-color-primary-500, #429797);
    background-color: var(
      --hx-file-upload-dropzone-active-bg,
      color-mix(
        in srgb,
        var(--hx-color-primary-500, #429797) 8%,
        var(--hx-color-surface-default, #ffffff)
      )
    );
    border-style: solid;
  }

  .dropzone--error {
    border-color: var(--hx-file-upload-error-color, var(--hx-color-error-500, #e5493e));
  }

  @media (prefers-reduced-motion: reduce) {
    .dropzone {
      transition: none;
    }
  }

  /* ─── Hidden file input ─── */

  .file-input {
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

  /* ─── File list ─── */

  .file-list {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-2, 0.5rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .file-list:empty {
    display: none;
  }

  /* ─── File item ─── */

  .file-item {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default, #d6dbd5);
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background-color: var(--hx-color-surface-default, #ffffff);
  }

  .file-item__row {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
  }

  .file-item__name {
    flex: 1;
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-color-text-strong, #202b39);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-item__size {
    flex-shrink: 0;
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-text-muted, #4a5362);
  }

  .file-item__remove {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: var(--hx-space-1, 0.25rem);
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-color-text-muted, #4a5362);
    cursor: pointer;
    line-height: 1;
    transition:
      color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease);
  }

  .file-item__remove:hover {
    color: var(--hx-file-upload-error-color, var(--hx-color-error-text, #c92a2a));
    background-color: color-mix(in srgb, var(--hx-color-error-500, #e5493e) 8%, transparent);
  }

  .file-item__remove:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-file-upload-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .file-item__remove {
      transition: none;
    }
  }

  /* ─── Progress bar ─── */

  .progress-track {
    width: 100%;
    height: var(--hx-file-upload-progress-height, var(--hx-space-1, 0.25rem));
    background-color: var(--hx-color-border-default, #d6dbd5);
    border-radius: var(--hx-border-radius-full, 9999px);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    width: 100%;
    background-color: var(--hx-file-upload-progress-color, var(--hx-color-primary-500, #429797));
    border-radius: inherit;
    transform-origin: left center;
    transform: scaleX(var(--_progress-ratio, 0));
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      transition: none;
    }
  }

  /* ─── Screen-reader only utility ─── */

  .sr-only {
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

  /* ─── Error message ─── */

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-file-upload-error-color, var(--hx-color-error-text, #c92a2a));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Forced colors (Windows High Contrast / Forced Colors Mode) ─── */

  @media (forced-colors: active) {
    .dropzone {
      border: 2px dashed ButtonText;
      background-color: Canvas;
      color: ButtonText;
    }

    .dropzone--drag-over {
      border: 2px solid Highlight;
      outline: none;
      background-color: Canvas;
    }

    .dropzone--error {
      border: 2px solid LinkText;
    }

    .dropzone:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    .progress-bar {
      background: Highlight;
      forced-color-adjust: none;
    }

    .file-item__remove:hover {
      outline: 2px solid Highlight;
      background-color: transparent;
      color: ButtonText;
    }

    .file-item__remove:focus-visible {
      outline: 2px solid Highlight;
    }

    :host([disabled]) .dropzone {
      border-color: GrayText;
      color: GrayText;
      opacity: 1;
    }
  }
`;
