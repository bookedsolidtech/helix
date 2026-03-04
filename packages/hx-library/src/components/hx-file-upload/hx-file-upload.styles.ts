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
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-color-neutral-700, #343a40);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Dropzone ─── */

  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    min-height: var(--hx-size-32, 8rem);
    padding: var(--hx-space-6, 1.5rem) var(--hx-space-4, 1rem);
    border: var(--hx-border-width-thin, 1px) dashed
      var(
        --hx-file-upload-dropzone-border-color,
        var(--hx-color-neutral-300, #ced4da)
      );
    border-radius: var(
      --hx-file-upload-dropzone-border-radius,
      var(--hx-border-radius-lg, 0.5rem)
    );
    background-color: var(
      --hx-file-upload-dropzone-bg,
      var(--hx-color-neutral-50, #f8f9fa)
    );
    cursor: pointer;
    text-align: center;
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    user-select: none;
    color: var(--hx-color-neutral-600, #495057);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .dropzone:focus-visible {
    outline: none;
    border-color: var(--hx-focus-ring-color, #2563eb);
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-focus-ring-color, #2563eb)
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  .dropzone--drag-over {
    border-color: var(--hx-color-primary-500, #2563eb);
    background-color: var(
      --hx-file-upload-dropzone-active-bg,
      color-mix(
        in srgb,
        var(--hx-color-primary-500, #2563eb) 8%,
        var(--hx-color-neutral-0, #ffffff)
      )
    );
    border-style: solid;
  }

  .dropzone--error {
    border-color: var(
      --hx-file-upload-error-color,
      var(--hx-color-error-500, #dc3545)
    );
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
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-color-neutral-200, #e9ecef);
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background-color: var(--hx-color-neutral-0, #ffffff);
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
    color: var(--hx-color-neutral-800, #212529);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-item__size {
    flex-shrink: 0;
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
  }

  .file-item__remove {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--hx-space-1, 0.25rem);
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-color-neutral-500, #6c757d);
    cursor: pointer;
    line-height: 1;
    transition: color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease);
  }

  .file-item__remove:hover {
    color: var(
      --hx-file-upload-error-color,
      var(--hx-color-error-500, #dc3545)
    );
    background-color: color-mix(
      in srgb,
      var(--hx-color-error-500, #dc3545) 8%,
      transparent
    );
  }

  .file-item__remove:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, #2563eb);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .file-item__remove {
      transition: none;
    }
  }

  /* ─── Progress bar ─── */

  .progress-track {
    width: 100%;
    height: 4px;
    background-color: var(--hx-color-neutral-200, #e9ecef);
    border-radius: var(--hx-border-radius-full, 9999px);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background-color: var(
      --hx-file-upload-progress-color,
      var(--hx-color-primary-500, #2563eb)
    );
    border-radius: inherit;
    transition: width var(--hx-transition-fast, 150ms ease);
    width: 0%;
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      transition: none;
    }
  }

  /* ─── Error message ─── */

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(
      --hx-file-upload-error-color,
      var(--hx-color-error-500, #dc3545)
    );
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
