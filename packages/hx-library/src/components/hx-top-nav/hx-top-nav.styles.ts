import { css } from 'lit';

export const helixTopNavStyles = css`
  /* ─── Host ─── */

  :host {
    display: block;
  }

  /* ─── Header wrapper (landmark) ─── */

  header {
    display: block;
    margin: 0;
    padding: 0;
  }

  /* ─── Sticky mode ─── */

  :host([sticky]) .nav {
    position: sticky;
    top: 0;
    /* Fallback 1000 is appropriate for sticky navbars (below modals ~1300, above content) */
    z-index: var(--hx-top-nav-z-index, var(--hx-z-index-sticky, 1000));
  }

  /* ─── Nav container ─── */

  .nav {
    background-color: var(--hx-top-nav-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-top-nav-color, var(--hx-color-neutral-800, #212529));
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-top-nav-border-color, var(--hx-color-neutral-200, #dee2e6));
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Bar row (always visible) ─── */

  .nav__bar {
    display: flex;
    align-items: center;
    min-height: var(--hx-top-nav-height, var(--hx-space-16, 4rem));
    padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));
    gap: var(--hx-space-4, 1rem);
  }

  /* ─── Logo ─── */

  .nav__logo {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ─── Mobile toggle (hamburger) ─── */

  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-start: auto;
    /* var(--hx-space-3, 0.75rem) padding + 24px icon = 48×48px touch target (exceeds WCAG 2.5.5 44×44px) */
    padding: var(--hx-space-3, 0.75rem);
    background: transparent;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    color: var(--hx-top-nav-toggle-color, var(--hx-color-neutral-700, #343a40));
    cursor: pointer;
    line-height: 0;
  }

  .mobile-toggle:hover {
    background: var(--hx-color-neutral-100, #f1f3f5);
  }

  .mobile-toggle:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .mobile-toggle__icon {
    width: var(--hx-space-6, 1.5rem);
    height: var(--hx-space-6, 1.5rem);
  }

  /* ─── Collapsible panel (mobile) ─── */

  .nav__collapsible {
    display: none;
    flex-direction: column;
    width: 100%;
    padding-block: var(--hx-space-3, 0.75rem);
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-top-nav-border-color, var(--hx-color-neutral-200, #dee2e6));
  }

  .nav__collapsible--open {
    display: flex;
    animation: hx-mobile-nav-open var(--hx-duration-fast, 150ms) ease-out;
  }

  /* ─── Menu and actions in collapsible (mobile) ─── */

  .nav__menu,
  .nav__actions {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));
  }

  .nav__actions {
    margin-top: var(--hx-space-3, 0.75rem);
    padding-top: var(--hx-space-3, 0.75rem);
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-top-nav-border-color, var(--hx-color-neutral-200, #dee2e6));
  }

  /* ─── Desktop breakpoint ─── */

  /* NOTE: CSS @media queries do not support custom properties.
     This value corresponds to --hx-breakpoint-md (768px). */
  @media (min-width: 768px) {
    /* Make nav a flex row so bar and collapsible sit side-by-side */
    .nav {
      display: flex;
      align-items: center;
      padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));
    }

    .nav__bar {
      flex-shrink: 0;
      padding-inline: 0;
      min-height: var(--hx-top-nav-height, var(--hx-space-16, 4rem));
    }

    /* Hide hamburger on desktop */
    .mobile-toggle {
      display: none;
    }

    /* Collapsible becomes a standard inline flex row */
    .nav__collapsible {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex: 1;
      padding-block: 0;
      border-top: none;
      margin-inline-start: auto;
      gap: var(--hx-space-4, 1rem);
      animation: none;
    }

    /* Override open modifier — always visible on desktop regardless of state */
    .nav__collapsible--open {
      display: flex;
      animation: none;
    }

    /* Menu grows to fill available space */
    .nav__menu {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--hx-space-1, 0.25rem);
      flex: 1;
      padding-inline: 0;
    }

    /* Actions sit at the far right */
    .nav__actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--hx-space-2, 0.5rem);
      margin-top: 0;
      padding-top: 0;
      padding-inline: 0;
      border-top: none;
      flex-shrink: 0;
    }
  }

  /* ─── Mobile menu open animation ─── */

  @keyframes hx-mobile-nav-open {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ─── Reduced motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .nav__collapsible--open {
      animation: none;
    }
  }
`;
