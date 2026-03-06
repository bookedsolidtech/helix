import { css } from 'lit';

export const helixRippleStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  .ripple__base {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }

  :host([unbounded]) .ripple__base {
    overflow: visible;
  }

  .ripple__wave {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    background-color: var(--hx-ripple-color, currentColor);
    opacity: var(--hx-ripple-opacity, 0.2);
    animation: hx-ripple-expand var(--hx-ripple-duration, 600ms) ease-out forwards;
    pointer-events: none;
    will-change: transform, opacity;
  }

  @keyframes hx-ripple-expand {
    to {
      transform: scale(var(--hx-ripple-scale, 4));
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ripple__wave {
      animation: none;
      opacity: 0;
    }
  }
`;
