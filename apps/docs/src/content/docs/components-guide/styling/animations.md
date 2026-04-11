---
title: Animations and Transitions
description: Add motion to HELiX components with CSS transitions, keyframe animations, and the Web Animations API — always respecting prefers-reduced-motion.
---

Motion in HELiX serves communication, not decoration. Transitions confirm state changes, animations guide attention, and micro-interactions provide tactile feedback. Every motion effect must be invisible to users who have requested reduced motion.

## CSS Transitions

CSS transitions are the right tool for state changes: hover, focus, active, disabled, open/closed. Define them on the default state and let the browser interpolate:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [
    css`
      button {
        background: var(--hx-color-primary-500);
        color: var(--hx-color-neutral-0);
        border: none;
        padding: var(--hx-spacing-sm) var(--hx-spacing-md);
        border-radius: var(--hx-border-radius-sm);
        cursor: pointer;

        /* Transitions defined on the default state */
        transition:
          background var(--hx-motion-duration-fast) var(--hx-motion-easing-standard),
          box-shadow var(--hx-motion-duration-fast) var(--hx-motion-easing-standard),
          transform   var(--hx-motion-duration-fast) var(--hx-motion-easing-standard);
      }

      button:hover {
        background: var(--hx-color-primary-600);
        box-shadow: var(--hx-shadow-sm);
      }

      button:active {
        transform: translateY(1px);
      }
    `,
  ];

  override render() {
    return html`<button><slot></slot></button>`;
  }
}
```

## `prefers-reduced-motion` — Always Respect It

**This is not optional.** Users who enable "Reduce Motion" in their OS have vestibular disorders, motion sickness, or strong preferences. Always wrap motion in a `prefers-reduced-motion: no-preference` query, or remove motion when `reduce` is set:

```css
button {
  /* No transition by default */
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  button {
    transition:
      background var(--hx-motion-duration-fast) var(--hx-motion-easing-standard),
      box-shadow  var(--hx-motion-duration-fast) var(--hx-motion-easing-standard);
  }
}
```

An alternative approach — define transitions freely and override to `none` when motion is reduced:

```css
button {
  transition:
    background var(--hx-motion-duration-fast) var(--hx-motion-easing-standard),
    box-shadow  var(--hx-motion-duration-fast) var(--hx-motion-easing-standard);
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
```

Both patterns are valid. The first is slightly more explicit about the safe default.

## CSS Animations with `@keyframes`

Use `@keyframes` for multi-step animations: spinners, skeletons, entrance effects. Define the animation inside the component's `css` block:

```typescript
static override styles = [
  css`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--hx-color-neutral-200);
      border-top-color: var(--hx-color-primary-500);
      border-radius: 50%;
      animation: spin var(--hx-motion-duration-slow) linear infinite;
    }

    .panel {
      animation: fade-in var(--hx-motion-duration-normal) var(--hx-motion-easing-decelerate) both;
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
        border-top-color: var(--hx-color-primary-500);
      }

      .panel {
        animation: none;
      }
    }
  `,
];
```

## HELiX Motion Tokens

Use the motion token scale rather than hard-coded millisecond values:

| Token | Typical value | Use case |
|---|---|---|
| `--hx-motion-duration-instant` | 0ms | Immediate, no motion |
| `--hx-motion-duration-fast` | 100ms | State changes, hover |
| `--hx-motion-duration-normal` | 200ms | Entrances, reveals |
| `--hx-motion-duration-slow` | 300ms | Larger movements |
| `--hx-motion-duration-slower` | 500ms | Complex choreography |
| `--hx-motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `--hx-motion-easing-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `--hx-motion-easing-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |

## Web Animations API for Imperative Control

When you need to trigger an animation from JavaScript — for example, after data loads or on user interaction — use the Web Animations API via `this.animate()`:

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-toast')
export class HelixToast extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property({ type: Boolean }) open = false;

  override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has('open')) {
      this._animateVisibility(this.open);
    }
  }

  private _animateVisibility(visible: boolean) {
    // Respect user preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const duration = 200;
    const easing = 'cubic-bezier(0, 0, 0.2, 1)';

    if (visible) {
      this.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration, easing, fill: 'both' }
      );
    } else {
      this.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(8px)' },
        ],
        { duration: 150, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }
      );
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
```

## Using `firstUpdated` for Entrance Animations

`firstUpdated` fires after the component's first render, making it the right place to trigger a one-time entrance animation:

```typescript
override firstUpdated() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  this.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    {
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'backwards',
    }
  );
}
```

## Next Steps

- [Dark Mode](/components-guide/styling/dark-mode/) — `prefers-color-scheme` alongside `prefers-reduced-motion`
- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — expose motion duration as a style prop
- [Design Tokens](/components-guide/styling/tokens/) — motion token reference
