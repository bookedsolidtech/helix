import { css } from 'lit';

export const helixAvatarStyles = css`
  :host {
    display: inline-block;
  }

  /* P2-5: Respect the HTML hidden attribute — custom elements with explicit display ignore it otherwise. */
  :host([hidden]) {
    display: none !important;
  }

  /* P0-2: Wrapper provides the positioning context for the badge slot, outside overflow: hidden. */
  .avatar-wrapper {
    position: relative;
    display: inline-flex;
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    width: var(--hx-avatar-size);
    height: var(--hx-avatar-size);
    background-color: var(--hx-avatar-bg, var(--hx-color-primary-100));
    color: var(--hx-avatar-color, var(--hx-color-primary-700));
    border-radius: var(--hx-avatar-border-radius);
    flex-shrink: 0;
  }

  /* ─── Size Variants ─── */

  .avatar--xs {
    --hx-avatar-size: var(--hx-size-6, 1.5rem);
    --hx-avatar-font-size: var(--hx-font-size-2xs, 0.625rem);
  }

  .avatar--sm {
    --hx-avatar-size: var(--hx-size-8, 2rem);
    --hx-avatar-font-size: var(--hx-font-size-xs, 0.75rem);
  }

  .avatar--md {
    --hx-avatar-size: var(--hx-size-10, 2.5rem);
    --hx-avatar-font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .avatar--lg {
    --hx-avatar-size: var(--hx-size-12, 3rem);
    --hx-avatar-font-size: var(--hx-font-size-base, 1rem);
  }

  .avatar--xl {
    --hx-avatar-size: var(--hx-size-16, 4rem);
    --hx-avatar-font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Shape Variants ─── */

  .avatar--circle {
    --hx-avatar-border-radius: 50%;
  }

  .avatar--square {
    --hx-avatar-border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Image ─── */

  .avatar__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ─── Initials ─── */

  .avatar__initials {
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-avatar-font-size);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: var(--hx-letter-spacing-wide, 0.025em);
    user-select: none;
  }

  /* ─── Fallback Icon ─── */

  .avatar__fallback-icon {
    width: 60%;
    height: 60%;
    color: var(--hx-avatar-color, var(--hx-color-primary-700));
  }

  /* ─── Badge Slot ─── */

  /* P0-2: Positioned relative to .avatar-wrapper — outside the overflow: hidden on .avatar. */
  .avatar__badge {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  /* P2-2: Hide the badge wrapper when no slot content is present, preserving slotchange detection. */
  .avatar__badge--hidden {
    display: none;
  }
`;
