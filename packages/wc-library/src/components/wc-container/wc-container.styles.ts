import { css } from 'lit';

export const wcContainerStyles = css`
  :host {
    display: block;
    width: 100%;
    background-color: var(--wc-container-bg, transparent);
    box-sizing: border-box;
  }

  /* ─── Vertical Padding Variants ─── */

  :host([padding='none']) {
    padding-top: 0;
    padding-bottom: 0;
  }

  :host([padding='sm']) {
    padding-top: var(--wc-space-6, 1.5rem);
    padding-bottom: var(--wc-space-6, 1.5rem);
  }

  :host([padding='md']) {
    padding-top: var(--wc-space-12, 3rem);
    padding-bottom: var(--wc-space-12, 3rem);
  }

  :host([padding='lg']) {
    padding-top: var(--wc-space-16, 4rem);
    padding-bottom: var(--wc-space-16, 4rem);
  }

  :host([padding='xl']) {
    padding-top: var(--wc-space-24, 6rem);
    padding-bottom: var(--wc-space-24, 6rem);
  }

  :host([padding='2xl']) {
    padding-top: var(--wc-space-32, 8rem);
    padding-bottom: var(--wc-space-32, 8rem);
  }

  /* ─── Inner Container ─── */

  .container__inner {
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--wc-container-gutter, var(--wc-space-6, 1.5rem));
    padding-right: var(--wc-container-gutter, var(--wc-space-6, 1.5rem));
    box-sizing: border-box;
    width: 100%;
  }

  /* ─── Width Variants ─── */

  .container__inner--full {
    max-width: none;
  }

  .container__inner--content {
    max-width: var(--wc-container-max-width, var(--wc-container-content, 72rem));
  }

  .container__inner--narrow {
    max-width: var(--wc-container-max-width, 48rem);
  }

  .container__inner--sm {
    max-width: var(--wc-container-max-width, var(--wc-container-sm, 640px));
  }

  .container__inner--md {
    max-width: var(--wc-container-max-width, var(--wc-container-md, 768px));
  }

  .container__inner--lg {
    max-width: var(--wc-container-max-width, var(--wc-container-lg, 1024px));
  }

  .container__inner--xl {
    max-width: var(--wc-container-max-width, var(--wc-container-xl, 1280px));
  }
`;
