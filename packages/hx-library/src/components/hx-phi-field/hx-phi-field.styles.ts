import { css } from 'lit';

export const helixPhiFieldStyles = css`
  :host {
    display: inline-flex;
  }

  /* ─── Container ─── */

  .phi-field {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    font-family: var(--hx-phi-field-font-family, var(--hx-font-family-mono, monospace));
  }

  /* ─── Value ─── */

  .phi-field__value--masked {
    user-select: none;
    -webkit-user-select: none;
    color: var(--hx-phi-field-masked-color, var(--hx-color-text-muted, #4A5362));
    letter-spacing: var(--hx-phi-field-letter-spacing, 0.1em);
  }

  .phi-field__value--revealed {
    color: var(--hx-phi-field-value-color, var(--hx-color-text-primary, #0d1825));
  }

  /* ─── Screen Reader Status ─── */

  .phi-field__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
    padding: 0;
    margin: -1px;
  }

  /* ─── Toggle Button ─── */

  .phi-field__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: var(--hx-space-1, 0.25rem);
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    color: var(--hx-phi-field-toggle-color, var(--hx-color-primary-500, #429797));
    cursor: pointer;
    line-height: 1;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  .phi-field__toggle:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-phi-field-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .phi-field__toggle:hover {
    opacity: var(--hx-opacity-90, 0.9);
  }

  .phi-field__toggle:active {
    opacity: var(--hx-opacity-50, 0.5);
  }

  .phi-field__toggle svg {
    width: 1em;
    height: 1em;
    pointer-events: none;
  }

  /* ─── Disabled State ─── */

  :host([disabled]) {
    opacity: var(--hx-phi-field-disabled-opacity, var(--hx-opacity-50, 0.5));
    pointer-events: none;
    cursor: not-allowed;
  }

  .phi-field--disabled .phi-field__toggle {
    cursor: not-allowed;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .phi-field__toggle {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast Mode) ─── */

  @media (forced-colors: active) {
    .phi-field__toggle {
      border: 1px solid ButtonText;
      forced-color-adjust: none;
    }

    .phi-field__toggle:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
`;
