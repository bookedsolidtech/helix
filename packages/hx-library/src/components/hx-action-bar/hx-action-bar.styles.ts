import { css } from 'lit';

export const helixActionBarStyles = css`
  :host {
    display: block;
  }

  /* ─── Base ─── */

  .base {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--hx-action-bar-gap, var(--hx-space-2, 0.5rem));
    padding: var(--hx-action-bar-padding, var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem));
    background: var(--hx-action-bar-bg, transparent);
    border: var(--hx-action-bar-border, none);
    box-sizing: border-box;
    width: 100%;
  }

  /* ─── Sticky (top) ─── */

  .base--sticky {
    position: sticky;
    top: 0;
    padding-top: max(var(--hx-action-bar-padding-block-start, 0px), env(safe-area-inset-top, 0px));
    z-index: var(--hx-action-bar-z-index, 10);
    /*
     * Consumers: when this bar is sticky, add scroll-padding-top to the scroll container
     * equal to the bar's rendered height so anchor targets are not hidden behind the bar.
     * Example: .scroll-container { scroll-padding-top: 2.5rem; }
     */
  }

  /* ─── Bottom sticky ─── */

  .base--bottom {
    position: sticky;
    bottom: 0;
    /*
     * Respect iOS home-indicator safe area on devices with notch/home bar.
     * Falls back to 0px on devices that do not support env().
     */
    padding-bottom: max(
      var(--hx-action-bar-padding-block-end, 0px),
      env(safe-area-inset-bottom, 0px)
    );
    z-index: var(--hx-action-bar-z-index, 10);
  }

  /* ─── Variant: outlined ─── */

  .base--outlined {
    background: var(--hx-action-bar-bg, var(--hx-color-neutral-0, #fff));
    border: var(
      --hx-action-bar-border,
      var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #e5e7eb)
    );
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Variant: filled ─── */

  .base--filled {
    background: var(--hx-action-bar-bg, var(--hx-color-neutral-50, #f9fafb));
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Size modifiers ─── */

  .base--sm {
    padding: var(--hx-action-bar-padding, var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem));
    gap: var(--hx-action-bar-gap, var(--hx-space-1, 0.25rem));
    min-height: var(--hx-size-8, 2rem);
  }

  .base--md {
    min-height: var(--hx-size-10, 2.5rem);
  }

  .base--lg {
    padding: var(--hx-action-bar-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
    gap: var(--hx-action-bar-gap, var(--hx-space-3, 0.75rem));
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Sections ─── */

  .section {
    display: flex;
    align-items: center;
    gap: inherit;
  }

  /*
   * Equal flex-basis on start and end guarantees the center section is visually centered
   * within the full bar width, regardless of how wide start and end content are.
   */
  .section--start {
    flex: 1 1 0;
    justify-content: flex-start;
  }

  .section--center {
    flex: 0 0 auto;
    justify-content: center;
  }

  .section--end {
    flex: 1 1 0;
    justify-content: flex-end;
  }

  /* ─── Slotted content ─── */

  ::slotted(*) {
    flex-shrink: 0;
  }
`;
