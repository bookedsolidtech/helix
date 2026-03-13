import { css } from 'lit';

export const helixContainerStyles = css`
  :host {
    display: block;
    contain: layout style;
    width: 100%;
    background-color: var(--hx-container-bg, transparent);
    box-sizing: border-box;
  }

  /* ─── Vertical Padding Variants ─── */

  /* Defensive reset: ensures zero vertical padding even if a future base rule adds it */
  :host([padding='none']) {
    padding-top: 0;
    padding-bottom: 0;
  }

  :host([padding='sm']) {
    padding-top: var(--hx-space-6, 1.5rem);
    padding-bottom: var(--hx-space-6, 1.5rem);
  }

  :host([padding='md']) {
    padding-top: var(--hx-space-12, 3rem);
    padding-bottom: var(--hx-space-12, 3rem);
  }

  :host([padding='lg']) {
    padding-top: var(--hx-space-16, 4rem);
    padding-bottom: var(--hx-space-16, 4rem);
  }

  :host([padding='xl']) {
    padding-top: var(--hx-space-24, 6rem);
    padding-bottom: var(--hx-space-24, 6rem);
  }

  :host([padding='2xl']) {
    padding-top: var(--hx-space-32, 8rem);
    padding-bottom: var(--hx-space-32, 8rem);
  }

  /* ─── Inner Container ─── */

  .container__inner {
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--hx-container-gutter, var(--hx-space-6, 1.5rem));
    padding-right: var(--hx-container-gutter, var(--hx-space-6, 1.5rem));
    box-sizing: border-box;
    width: 100%;
  }

  /* ─── Width Variants ─── */

  .container__inner--full {
    max-width: none;
  }

  .container__inner--content {
    max-width: var(--hx-container-max-width, var(--hx-container-content, 1152px));
  }

  .container__inner--narrow {
    max-width: var(--hx-container-max-width, var(--hx-container-narrow, 768px));
  }

  .container__inner--sm {
    max-width: var(--hx-container-max-width, var(--hx-container-sm, 640px));
  }

  .container__inner--md {
    max-width: var(--hx-container-max-width, var(--hx-container-md, 768px));
  }

  .container__inner--lg {
    max-width: var(--hx-container-max-width, var(--hx-container-lg, 1024px));
  }

  .container__inner--xl {
    max-width: var(--hx-container-max-width, var(--hx-container-xl, 1280px));
  }
`;
