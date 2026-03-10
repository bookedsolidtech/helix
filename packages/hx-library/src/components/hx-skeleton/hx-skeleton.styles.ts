import { css } from 'lit';

export const helixSkeletonStyles = css`
  :host {
    display: block;
  }

  :host([loaded]) {
    display: none;
  }

  /* ─── Base ─── */

  .skeleton {
    display: block;
    background-color: var(--hx-skeleton-bg, var(--hx-color-neutral-200, #e2e8f0));
    overflow: hidden;
    position: relative;
    width: var(--_width, 100%);
    height: var(--_height, auto);
  }

  /* ─── Variant Shapes ─── */

  .skeleton--text {
    border-radius: var(--hx-skeleton-text-radius, var(--hx-border-radius-full, 9999px));
    height: var(--_height, 1em);
  }

  .skeleton--circle {
    border-radius: var(--hx-skeleton-circle-radius, 50%);
    aspect-ratio: var(--_circle-aspect-ratio, 1);
    width: var(--_width, 2.5rem);
    height: var(--_height, var(--_width, 2.5rem));
  }

  .skeleton--rect {
    border-radius: var(--hx-skeleton-rect-radius, var(--hx-border-radius-sm, 0.25rem));
    height: var(--_height, 1rem);
  }

  .skeleton--button {
    border-radius: var(--hx-skeleton-button-radius, var(--hx-border-radius-md, 0.375rem));
    height: var(--_height, 2.5rem);
  }

  .skeleton--paragraph {
    border-radius: var(--hx-skeleton-text-radius, var(--hx-border-radius-full, 9999px));
    height: var(--_height, auto);
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  /* ─── Shimmer Animation ─── */

  .skeleton--animated::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--hx-skeleton-shimmer-color, var(--hx-overlay-white-40, rgba(255, 255, 255, 0.4))) 50%,
      transparent 100%
    );
    background-size: var(--hx-skeleton-shimmer-width, 200%) 100%;
    animation: hx-skeleton-shimmer var(--hx-skeleton-duration, 1.5s) ease-in-out infinite;
  }

  @keyframes hx-skeleton-shimmer {
    from {
      background-position: 200% center;
    }
    to {
      background-position: -200% center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton--animated::after {
      display: none;
    }
  }
`;
