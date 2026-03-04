import { css } from 'lit';

export const helixDividerStyles = css`
  :host {
    display: block;
    --_color: var(--hx-divider-color, var(--hx-color-neutral-200, #e5e7eb));
    --_thickness: var(--hx-divider-thickness, 1px);
  }

  :host([orientation='vertical']) {
    display: inline-block;
    height: 100%;
  }

  /* ─── Spacing Variants (horizontal) ─── */

  :host([spacing='sm']) {
    margin-block: var(--hx-divider-spacing, var(--hx-space-2, 0.5rem));
  }

  :host([spacing='md']) {
    margin-block: var(--hx-divider-spacing, var(--hx-space-4, 1rem));
  }

  :host([spacing='lg']) {
    margin-block: var(--hx-divider-spacing, var(--hx-space-8, 2rem));
  }

  /* ─── Spacing Variants (vertical — swap margin axis) ─── */

  :host([orientation='vertical'][spacing='sm']) {
    margin-block: 0;
    margin-inline: var(--hx-divider-spacing, var(--hx-space-2, 0.5rem));
  }

  :host([orientation='vertical'][spacing='md']) {
    margin-block: 0;
    margin-inline: var(--hx-divider-spacing, var(--hx-space-4, 1rem));
  }

  :host([orientation='vertical'][spacing='lg']) {
    margin-block: 0;
    margin-inline: var(--hx-divider-spacing, var(--hx-space-8, 2rem));
  }

  /* ─── Base <hr> Reset ─── */

  hr {
    border: none;
    margin: 0;
    padding: 0;
  }

  /* ─── Orientation Variants ─── */

  .divider--horizontal {
    width: 100%;
    height: var(--_thickness);
    background-color: var(--_color);
  }

  .divider--vertical {
    width: var(--_thickness);
    height: 100%;
    background-color: var(--_color);
  }

  /* ─── Line Style Variants ─── */

  .divider--solid {
    /* background-color handles the solid line */
  }

  .divider--dashed {
    background-color: transparent;
  }

  .divider--horizontal.divider--dashed {
    border-top: var(--_thickness) dashed var(--_color);
    height: 0;
  }

  .divider--vertical.divider--dashed {
    border-left: var(--_thickness) dashed var(--_color);
    width: 0;
  }

  .divider--dotted {
    background-color: transparent;
  }

  .divider--horizontal.divider--dotted {
    border-top: var(--_thickness) dotted var(--_color);
    height: 0;
  }

  .divider--vertical.divider--dotted {
    border-left: var(--_thickness) dotted var(--_color);
    width: 0;
  }
`;
