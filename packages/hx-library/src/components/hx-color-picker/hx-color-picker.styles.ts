import { css } from 'lit';

export const helixColorPickerStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--hx-font-family-base, sans-serif);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.4);
  }

  /* ─── Trigger ─── */

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-1, 0.25rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-300, #d1d5db);
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background: var(--hx-color-neutral-0, #fff);
    cursor: pointer;
    transition: border-color var(--hx-transition-fast, 0.15s ease);
  }

  .trigger:hover:not([disabled]) {
    border-color: var(--hx-color-primary-500, #3b82f6);
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .trigger-swatch {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: var(--_preview-color, #000);
    display: block;
    flex-shrink: 0;
  }

  .trigger-label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    color: var(--hx-color-neutral-700, #374151);
    font-family: var(--hx-font-family-mono, monospace);
    white-space: nowrap;
  }

  /* ─── Panel ─── */

  .panel {
    position: absolute;
    z-index: var(--hx-color-picker-z-index, 1000);
    top: calc(100% + 4px);
    left: 0;
    background: var(--hx-color-neutral-0, #fff);
    border: 1px solid var(--hx-color-neutral-200, #e5e7eb);
    border-radius: var(--hx-border-radius-lg, 0.5rem);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: var(--hx-space-4, 1rem);
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-3, 0.75rem);
    outline: none;
  }

  :host([inline]) .panel {
    position: static;
    box-shadow: none;
    border: 1px solid var(--hx-color-neutral-200, #e5e7eb);
    border-radius: var(--hx-border-radius-lg, 0.5rem);
  }

  /* ─── Gradient Grid ─── */

  .gradient-grid {
    position: relative;
    width: 100%;
    height: 160px;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    cursor: crosshair;
    overflow: hidden;
    touch-action: none;
    flex-shrink: 0;
  }

  .gradient-grid:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .gradient-grid-bg {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, transparent, #000),
      linear-gradient(to right, #fff, var(--_hue-color, hsl(0, 100%, 50%)));
    pointer-events: none;
  }

  .gradient-thumb {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
    top: var(--_thumb-y, 0%);
    left: var(--_thumb-x, 100%);
  }

  /* ─── Sliders ─── */

  .slider-track {
    position: relative;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    cursor: pointer;
    touch-action: none;
    flex-shrink: 0;
  }

  .slider-track:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .hue-track {
    background: linear-gradient(
      to right,
      hsl(0, 100%, 50%),
      hsl(30, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(90, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(150, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(210, 100%, 50%),
      hsl(240, 100%, 50%),
      hsl(270, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(330, 100%, 50%),
      hsl(360, 100%, 50%)
    );
  }

  .opacity-track {
    background-image:
      linear-gradient(to right, transparent, var(--_hue-color, hsl(0, 100%, 50%))),
      repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px;
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
    left: var(--_slider-pct, 0%);
    background: var(--_thumb-color, hsl(0, 100%, 50%));
  }

  /* ─── Swatches ─── */

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--hx-space-1, 0.25rem);
  }

  .swatch-btn {
    width: 20px;
    height: 20px;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: transform var(--hx-transition-fast, 0.15s ease);
  }

  .swatch-btn:hover {
    transform: scale(1.15);
    border-color: rgba(0, 0, 0, 0.3);
  }

  .swatch-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Input ─── */

  .input-area {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
  }

  .format-btn {
    flex-shrink: 0;
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    background: var(--hx-color-neutral-100, #f3f4f6);
    border: 1px solid var(--hx-color-neutral-300, #d1d5db);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    cursor: pointer;
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-600, #4b5563);
    text-transform: uppercase;
    font-weight: var(--hx-font-weight-semibold, 600);
    letter-spacing: 0.05em;
  }

  .format-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .color-input {
    flex: 1;
    min-width: 0;
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    border: 1px solid var(--hx-color-neutral-300, #d1d5db);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    font-family: var(--hx-font-family-mono, monospace);
    font-size: var(--hx-font-size-sm, 0.875rem);
    color: var(--hx-color-neutral-900, #111827);
    background: var(--hx-color-neutral-0, #fff);
    outline: none;
  }

  .color-input:focus {
    border-color: var(--hx-focus-ring-color, #2563eb);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }

  /* ─── Color preview strip in input area ─── */

  .input-preview {
    width: 24px;
    height: 24px;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: var(--_preview-color, #000);
    flex-shrink: 0;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .trigger,
    .swatch-btn {
      transition: none;
    }
  }
`;
