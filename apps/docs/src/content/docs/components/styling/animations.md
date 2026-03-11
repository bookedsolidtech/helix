---
title: Animations & Transitions
description: Building performant CSS animations and transitions in Lit web components with design token-driven timing.
---

Animations in web components are constrained by shadow DOM in ways that make naive approaches brittle. Styles cannot leak in from outside, `::slotted()` reaches only one level deep, and the browser paints shadow DOM subtrees independently. Done right, these constraints produce well-encapsulated, highly performant motion that works uniformly across every consumer context.

This guide covers CSS transitions on `:host` and `::part()`, `@keyframes` inside component styles, animating shadow DOM elements versus slotted content, `prefers-reduced-motion` as an accessibility non-negotiable, design token timing variables, `updated()` lifecycle for JavaScript-triggered animations, runtime control via CSS custom properties, composite layer management, and a complete `hx-alert` enter/exit animation implementation.

---

## Prerequisites

Before working with animations in HELiX components, ensure you understand:

- [Component Styling Fundamentals](/components/styling/fundamentals) — Shadow DOM, `:host`, CSS parts, encapsulation rules
- [Design Token Architecture](/components/styling/tokens) — `--hx-duration-*` and `--hx-easing-*` timing tokens
- Basic CSS transition and animation syntax

---

## Timing Design Tokens

All animation durations and easing values in HELiX are driven by design tokens. Never hardcode timing values — a consumer must be able to globally adjust animation speed (or disable it entirely for accessibility) without touching component internals.

### Duration Tokens

```css
:root {
  /* Instant — imperceptible, for state corrections */
  --hx-duration-instant: 0ms;

  /* Fast — micro-interactions: focus rings, hover states, toggles */
  --hx-duration-fast: 150ms;

  /* Normal — component transitions: panel slides, tab switches */
  --hx-duration-normal: 250ms;

  /* Slow — deliberate entry/exit: modals, alerts, drawers */
  --hx-duration-slow: 350ms;

  /* Slower — cinematic: onboarding sequences, hero reveals */
  --hx-duration-slower: 500ms;
}
```

### Easing Tokens

```css
:root {
  /* Standard — general-purpose ease-in-out for most state changes */
  --hx-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Decelerate — element enters screen (fast start, slows to stop) */
  --hx-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);

  /* Accelerate — element exits screen (starts slow, exits fast) */
  --hx-easing-accelerate: cubic-bezier(0.4, 0, 1, 1);

  /* Sharp — quick snaps, toggles, menu open/close */
  --hx-easing-sharp: cubic-bezier(0.4, 0, 0.6, 1);

  /* Spring — playful elastic feel (use sparingly in healthcare UI) */
  --hx-easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

These tokens are also referenced by the existing `--hx-transition-fast`, `--hx-transition-normal`, and `--hx-transition-slow` composite tokens:

```css
:root {
  --hx-transition-fast: var(--hx-duration-fast, 150ms) var(--hx-easing-standard, ease);
  --hx-transition-normal: var(--hx-duration-normal, 250ms) var(--hx-easing-standard, ease);
  --hx-transition-slow: var(--hx-duration-slow, 350ms) var(--hx-easing-standard, ease);
}
```

Use the composite tokens when the easing is always standard. Use discrete duration and easing tokens when you need finer control (e.g., enter with decelerate, exit with accelerate).

---

## CSS Transitions on `:host` and `::part()`

### Transitions on `:host`

The `:host` pseudo-class targets the custom element itself — the element in the light DOM that acts as the shadow root's boundary. Transitions applied here affect the component's outer box, not its shadow internals:

```typescript
// hx-card.styles.ts
import { css } from 'lit';

export const helixCardStyles = css`
  :host {
    display: block;

    /*
     * Transition the entire component's opacity and transform.
     * Useful for page-level mount/unmount animations.
     */
    transition:
      opacity var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease);
  }

  :host([hidden]) {
    display: none;
  }

  /* A class applied by JS to trigger an exit animation */
  :host(.is-exiting) {
    opacity: 0;
    transform: translateY(var(--hx-space-2, 0.5rem));
  }
`;
```

### Transitions on Shadow DOM Elements

Transitions inside shadow DOM work identically to regular CSS transitions. Apply them to internal class selectors:

```typescript
export const helixCardStyles = css`
  .card {
    /* These properties animate on state change */
    transition:
      box-shadow var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease),
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease);
  }

  .card--interactive:hover {
    box-shadow: var(--hx-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
    transform: translateY(var(--hx-transform-lift-md, -2px));
  }

  .card--interactive:active {
    transform: translateY(0);
    box-shadow: var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
  }

  .card--interactive:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #3b82f6);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }
`;
```

### Transitions via `::part()`

CSS parts are the public styling API of a component. Consumers can apply transitions to parts from outside the shadow boundary, but only to CSS properties that the part exposes. Components cannot apply transitions inside `::part()` selectors from within their own styles — `::part()` is an outside-in mechanism.

The correct pattern is to define transitions inside the component's shadow styles on the internal element, then expose the part for override:

```typescript
// Inside hx-button shadow styles — set transitions internally
export const helixButtonStyles = css`
  .button {
    /*
     * Declare transitions here. External ::part() rules cannot
     * override transition-property — they can only set new properties
     * on the part that then participate in the same transition.
     */
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease),
      outline-offset var(--hx-transition-fast, 150ms ease);
  }
`;
```

Consumer can then set `background-color` on the part and it will transition because the transition is already declared internally:

```css
/* Consumer stylesheet — adds a custom hover color that transitions */
hx-button::part(button):hover {
  background-color: #005f5f; /* Transitions via the component's internal declaration */
}
```

---

## `@keyframes` Inside Component Styles

CSS `@keyframes` declared inside a `static styles` Lit template are scoped to the shadow root. They are not global — a `@keyframes fadeIn` inside `hx-alert` does not conflict with a `fadeIn` in `hx-card` or in the consumer's global stylesheet.

```typescript
// hx-alert.styles.ts
import { css } from 'lit';

export const helixAlertStyles = css`
  /* Keyframes are shadow-scoped — no naming conflicts */
  @keyframes alert-enter {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes alert-exit {
    from {
      opacity: 1;
      transform: translateY(0);
      max-height: 200px;
    }
    to {
      opacity: 0;
      transform: translateY(-0.5rem);
      max-height: 0;
    }
  }

  :host {
    display: block;
    overflow: hidden; /* Required for max-height animation */
  }

  :host(:not([open])) {
    display: none;
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-alert-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-alert-padding, var(--hx-space-4, 1rem));
    border: var(--hx-alert-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-alert-border-color, var(--hx-color-info-200, #b3d9ef));
    border-radius: var(--hx-alert-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-alert-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-alert-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-alert-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /*
   * Apply the enter animation when the component mounts.
   * fill-mode: both holds the from-state before the animation starts,
   * preventing a flash of the final state.
   */
  :host([open]) .alert {
    animation: alert-enter var(--hx-alert-enter-duration, var(--hx-duration-normal, 250ms))
      var(--hx-easing-decelerate, cubic-bezier(0, 0, 0.2, 1)) both;
  }

  /* Exit animation state — applied via JS before removing [open] */
  :host(.is-exiting) .alert {
    animation: alert-exit var(--hx-alert-exit-duration, var(--hx-duration-fast, 150ms))
      var(--hx-easing-accelerate, cubic-bezier(0.4, 0, 1, 1)) both;
  }
`;
```

Note the different easing for enter vs. exit. Enter uses `decelerate` (fast start, soft landing) — the element arrives with energy and settles. Exit uses `accelerate` (starts slow, leaves fast) — the element politely defers and disappears. This asymmetry is a well-established motion design principle and makes animations feel purposeful rather than mechanical.

---

## Animating Shadow DOM Elements vs. Slotted Content

### Animating Shadow DOM Elements

Elements rendered in the component's `render()` method are inside the shadow root. Animate them freely with any CSS technique:

```typescript
// Shadow DOM element — full CSS control
override render() {
  return html`
    <div class="alert__icon" part="icon">
      <slot name="icon">${this._renderDefaultIcon()}</slot>
    </div>
    <div class="alert__message" part="message">
      <slot></slot>
    </div>
  `;
}
```

```css
/* Shadow styles — can apply any transition or keyframe */
.alert__icon {
  flex-shrink: 0;
  transition: transform var(--hx-transition-fast, 150ms ease);
}

.alert--success .alert__icon {
  animation: icon-pop var(--hx-duration-normal, 250ms)
    var(--hx-easing-spring, cubic-bezier(0.175, 0.885, 0.32, 1.275)) both;
}

@keyframes icon-pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Animating Slotted Content

Slotted content lives in the light DOM. The component cannot apply arbitrary CSS to it — `::slotted()` selectors are limited to direct children of the slot, and cannot match deeply nested elements or apply keyframe animations.

What you can do:

```css
/* Animate the slotted element's outer box — limited but useful */
::slotted(*) {
  transition: opacity var(--hx-transition-normal, 250ms ease);
}

/* Target specific slotted elements (direct children only) */
::slotted(img) {
  transition: transform var(--hx-transition-slow, 350ms ease);
}
```

What you cannot do from inside shadow DOM:

```css
/* INVALID — ::slotted() cannot match descendants */
::slotted(div p) {
  color: red;
}

/* INVALID — keyframes cannot be driven onto slotted content from shadow styles */
::slotted(*) {
  animation: fadeIn 300ms ease; /* This does NOT work cross-browser reliably */
}
```

For complex slotted content animations, the correct approach is to let the consumer define the animation in light DOM CSS and coordinate timing via CSS custom properties exposed by the component:

```css
/* Consumer light DOM styles */
hx-card .my-content {
  animation: fadeIn var(--hx-duration-normal, 250ms) var(--hx-easing-decelerate, ease) both;
}
```

The component exposes duration tokens so the consumer can match timing to the component's own animations.

---

## `prefers-reduced-motion` — An Accessibility Non-Negotiable

The `prefers-reduced-motion: reduce` media query indicates the user has requested minimal non-essential motion. In healthcare contexts, this preference must be unconditionally respected. Users with vestibular disorders, epilepsy, or motion sensitivity can trigger real physical symptoms from excessive animation.

Every animation and transition in every HELiX component must be gated behind a `prefers-reduced-motion` check.

### Component-Level Pattern

```typescript
// In component static styles — apply to every component that has motion
export const helixAlertStyles = css`
  .alert {
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease);
  }

  :host([open]) .alert {
    animation: alert-enter var(--hx-alert-enter-duration, var(--hx-duration-normal, 250ms))
      var(--hx-easing-decelerate, cubic-bezier(0, 0, 0.2, 1)) both;
  }

  /*
   * Required in every component with motion.
   * Removes animation and snaps to final state instantly.
   * prefers-reduced-motion: reduce means "minimize motion",
   * not "remove all visual change" — state changes should
   * still be visible, just without the transition.
   */
  @media (prefers-reduced-motion: reduce) {
    :host([open]) .alert {
      animation: none;
    }

    .alert,
    .alert__icon,
    .alert__close-button {
      transition: none;
    }
  }
`;
```

### Global Token Override

Consumers can globally disable all HELiX animations by zeroing the duration tokens. This is the preferred approach for enterprise deployments where motion must be disabled organization-wide:

```css
/* Disable all HELiX animations globally */
@media (prefers-reduced-motion: reduce) {
  :root {
    --hx-duration-instant: 0ms;
    --hx-duration-fast: 0ms;
    --hx-duration-normal: 0ms;
    --hx-duration-slow: 0ms;
    --hx-duration-slower: 0ms;
  }
}
```

When durations are zero, all CSS transitions and animations still execute — they just complete in zero milliseconds, producing an immediate state snap. This is functionally equivalent to `transition: none` and works because `animation-duration: 0ms` causes the animation to jump immediately to its fill state.

### Checking in JavaScript

For JavaScript-driven animations (Web Animations API, GSAP, etc.), check the preference programmatically:

```typescript
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// In a Lit component:
private _runEnterAnimation(): void {
  if (prefersReducedMotion()) {
    // Skip animation — apply final state directly
    this.style.opacity = '1';
    return;
  }

  this.animate(
    [
      { opacity: 0, transform: 'translateY(-0.5rem)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: 250,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'both',
    }
  );
}
```

---

## `PropertyValues` and `updated()` for JS-Driven Animation Triggers

Lit's `updated()` lifecycle method fires after every render cycle, with a `PropertyValues` map containing the previous values of changed properties. This is the correct place to trigger JavaScript-driven animations in response to property changes.

### Pattern: Animate on Property Change

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-alert')
export class HelixAlert extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = true;

  @property({ type: String, reflect: true })
  variant: 'info' | 'success' | 'warning' | 'error' = 'info';

  private _alertEl: HTMLElement | null = null;

  override firstUpdated(): void {
    // Cache reference after first render
    this._alertEl = this.shadowRoot?.querySelector('.alert') ?? null;
    this._playEnterAnimation();
  }

  override updated(changed: PropertyValues<this>): void {
    // React specifically to the `open` property change
    if (changed.has('open')) {
      const wasOpen = changed.get('open') as boolean;
      if (!wasOpen && this.open) {
        // Transitioned from closed → open
        this._playEnterAnimation();
      }
    }
  }

  private _playEnterAnimation(): void {
    const el = this._alertEl;
    if (!el) return;

    // Respect user's motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.animate(
      [
        { opacity: '0', transform: 'translateY(-0.5rem)' },
        { opacity: '1', transform: 'translateY(0)' },
      ],
      {
        duration: 250,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        fill: 'both',
      },
    );
  }
}
```

### Pattern: Animated Exit Before DOM Removal

The trickiest animation pattern is exit animations — you need to play the animation and then remove the element after it completes. Lit's reactive property system removes elements from the DOM synchronously on the next render. You must intercept that removal:

```typescript
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = true;

  @property({ type: Boolean })
  closable = false;

  private _isAnimating = false;

  private async _handleClose(): Promise<void> {
    if (this._isAnimating) return;

    const el = this.shadowRoot?.querySelector('.alert') as HTMLElement | null;
    if (!el) {
      this.open = false;
      return;
    }

    // Check motion preference before running animation
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced) {
      this._isAnimating = true;

      // Play exit animation and await its completion
      const animation = el.animate(
        [
          { opacity: '1', transform: 'translateY(0)', maxHeight: '200px' },
          { opacity: '0', transform: 'translateY(-0.5rem)', maxHeight: '0px' },
        ],
        {
          duration: 150,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'both',
        },
      );

      await animation.finished;
      this._isAnimating = false;
    }

    // Now update the property — Lit re-renders and removes the element
    this.open = false;

    this.dispatchEvent(
      new CustomEvent('hx-close', {
        bubbles: true,
        composed: true,
        detail: { reason: 'user' },
      }),
    );
  }

  override render() {
    if (!this.open) return html``;

    return html`
      <div part="alert" class="alert alert--${this.variant}">
        <div part="icon" class="alert__icon">
          <slot name="icon"></slot>
        </div>
        <div part="message" class="alert__message">
          <slot></slot>
        </div>
        ${this.closable
          ? html`
              <button
                part="close-button"
                class="alert__close-button"
                aria-label="Close"
                @click=${this._handleClose}
              >
                <!-- close icon SVG -->
              </button>
            `
          : nothing}
      </div>
    `;
  }
}
```

The `animation.finished` promise resolves when the animation completes. Only after that do we set `this.open = false`, which triggers Lit to re-render and remove the alert element from the DOM. The user sees the exit animation before the element disappears.

---

## Animating with CSS Custom Properties for Runtime Control

CSS custom properties can be set at runtime to control animation parameters without re-rendering the component. This is more performant than triggering a Lit render cycle for timing adjustments.

### Exposing Animation Tokens as Component API

```typescript
/**
 * A feedback alert with enter/exit animations.
 *
 * @cssprop [--hx-alert-enter-duration=var(--hx-duration-normal)] - Duration of the enter animation.
 * @cssprop [--hx-alert-exit-duration=var(--hx-duration-fast)] - Duration of the exit animation.
 * @cssprop [--hx-alert-enter-easing=var(--hx-easing-decelerate)] - Easing of the enter animation.
 * @cssprop [--hx-alert-exit-easing=var(--hx-easing-accelerate)] - Easing of the exit animation.
 */
@customElement('hx-alert')
export class HelixAlert extends LitElement {}
```

```css
/* In hx-alert.styles.ts */
:host([open]) .alert {
  animation-name: alert-enter;
  animation-duration: var(--hx-alert-enter-duration, var(--hx-duration-normal, 250ms));
  animation-timing-function: var(
    --hx-alert-enter-easing,
    var(--hx-easing-decelerate, cubic-bezier(0, 0, 0.2, 1))
  );
  animation-fill-mode: both;
}
```

Consumer overrides timing without touching component internals:

```html
<!-- Slower enter for emphasis -->
<hx-alert
  variant="error"
  style="--hx-alert-enter-duration: 400ms; --hx-alert-enter-easing: var(--hx-easing-spring);"
>
  Critical: Patient allergy alert.
</hx-alert>
```

### JavaScript Driving CSS Custom Properties

```typescript
// Drive animation parameters from JavaScript
function configureAlertTiming(el: HTMLElement, options: { fast: boolean }): void {
  if (options.fast) {
    el.style.setProperty('--hx-alert-enter-duration', '100ms');
    el.style.setProperty('--hx-alert-exit-duration', '75ms');
  } else {
    el.style.removeProperty('--hx-alert-enter-duration');
    el.style.removeProperty('--hx-alert-exit-duration');
  }
}

const alert = document.querySelector('hx-alert') as HTMLElement;
configureAlertTiming(alert, { fast: true });
```

This pattern is more performant than dispatching property changes because it does not trigger Lit's reactive update cycle.

---

## `will-change` and Composite Layer Management

The browser paints web pages in layers. Promoting an element to its own compositor layer allows the GPU to handle transforms and opacity without triggering layout or paint. Use `will-change` to signal impending animation to the browser.

### When to Use `will-change`

```typescript
export const helixAlertStyles = css`
  /*
   * Promote to compositor layer before animation starts.
   * This prevents paint jank on the first frame.
   * Only apply will-change during animation — not persistently.
   */
  :host([open]) .alert {
    will-change: opacity, transform;
    animation: alert-enter var(--hx-duration-normal, 250ms)
      var(--hx-easing-decelerate, cubic-bezier(0, 0, 0.2, 1)) both;
  }

  /* Remove will-change after animation completes via animation-fill-mode and targeting the resting state */
  /* (The alert is in [open] state with no further transition — will-change is no longer needed) */
`;
```

For components that animate frequently (tooltips, toasts, drawers), remove `will-change` after the animation completes to free the compositor layer:

```typescript
private async _playEnterAnimation(): Promise<void> {
  const el = this._alertEl;
  if (!el) return;

  // Hint to browser: animation is coming
  el.style.willChange = 'opacity, transform';

  const animation = el.animate(
    [
      { opacity: '0', transform: 'translateY(-0.5rem)' },
      { opacity: '1', transform: 'translateY(0)' },
    ],
    {
      duration: 250,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'both',
    }
  );

  await animation.finished;

  // Release the compositor layer — animation is done
  el.style.willChange = 'auto';
}
```

### Composite-Safe Properties

Animate only these properties for zero-jank performance. They run on the compositor thread and never trigger layout or paint:

| Property    | Use Case                                              |
| ----------- | ----------------------------------------------------- |
| `opacity`   | Fade in/out                                           |
| `transform` | Translate, scale, rotate                              |
| `filter`    | Blur, brightness (GPU-accelerated in modern browsers) |

**Never animate these** — they trigger full layout recalculation:

| Property                         | Impact                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| `width`, `height`                | Full layout                                                         |
| `margin`, `padding`              | Full layout                                                         |
| `top`, `left`, `right`, `bottom` | Full layout (use `transform: translate()` instead)                  |
| `font-size`                      | Full layout                                                         |
| `max-height`                     | Layout (acceptable for accordion-style reveals if no better option) |

Use `max-height` animation only when `clip-path` or `transform` cannot achieve the same effect. For collapsible regions, prefer `display: grid` with `grid-template-rows: 0fr → 1fr` which achieves the same visual without forcing layout on every frame.

---

## Complete Example: `hx-alert` with Enter/Exit Animations

This is the full production-quality implementation of animated enter and exit for `hx-alert`, combining all the patterns above.

### Styles (`hx-alert.styles.ts`)

```typescript
import { css } from 'lit';

export const helixAlertStyles = css`
  /* ─── Enter keyframe ─── */
  @keyframes alert-enter {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--hx-space-2, 0.5rem)));
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ─── Host ─── */

  :host {
    display: block;
    overflow: hidden;
  }

  :host(:not([open])) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Alert Container ─── */

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-alert-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-alert-padding, var(--hx-space-4, 1rem));
    border: var(--hx-alert-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-alert-border-color, var(--hx-color-info-200, #b3d9ef));
    border-radius: var(--hx-alert-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-alert-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-alert-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-alert-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);

    /* Color transitions for variant changes */
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease);
  }

  /* ─── Enter animation ─── */

  :host([open]) .alert {
    will-change: opacity, transform;
    animation-name: alert-enter;
    animation-duration: var(--hx-alert-enter-duration, var(--hx-duration-normal, 250ms));
    animation-timing-function: var(
      --hx-alert-enter-easing,
      var(--hx-easing-decelerate, cubic-bezier(0, 0, 0.2, 1))
    );
    animation-fill-mode: both;
  }

  /* ─── Icon ─── */

  .alert__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-alert-icon-color, var(--hx-color-info-500, #3b82f6));
    transition: color var(--hx-transition-fast, 150ms ease);
  }

  .alert__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
  }

  /* ─── Message ─── */

  .alert__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Close Button ─── */

  .alert__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-space-6, 1.5rem);
    height: var(--hx-space-6, 1.5rem);
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-alert-color, var(--hx-color-info-800, #1a3a4a));
    cursor: pointer;
    opacity: 0.7;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
  }

  .alert__close-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .alert__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #3b82f6);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .alert__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Variants ─── */

  :host([variant='success']) .alert {
    --hx-alert-bg: var(--hx-color-success-50, #ecfdf5);
    --hx-alert-border-color: var(--hx-color-success-200, #a7f3d0);
    --hx-alert-color: var(--hx-color-success-800, #065f46);
    --hx-alert-icon-color: var(--hx-color-success-500, #10b981);
  }

  :host([variant='warning']) .alert {
    --hx-alert-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-alert-border-color: var(--hx-color-warning-200, #fde68a);
    --hx-alert-color: var(--hx-color-warning-800, #92400e);
    --hx-alert-icon-color: var(--hx-color-warning-500, #f59e0b);
  }

  :host([variant='error']) .alert {
    --hx-alert-bg: var(--hx-color-error-50, #fef2f2);
    --hx-alert-border-color: var(--hx-color-error-200, #fecaca);
    --hx-alert-color: var(--hx-color-error-800, #991b1b);
    --hx-alert-icon-color: var(--hx-color-error-500, #ef4444);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    :host([open]) .alert {
      animation: none;
      will-change: auto;
    }

    .alert,
    .alert__icon,
    .alert__close-button {
      transition: none;
    }
  }
`;
```

### Component (`hx-alert.ts`) — animated close

```typescript
import { LitElement, html, nothing, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixAlertStyles } from './hx-alert.styles.js';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * A feedback alert with enter/exit animations.
 *
 * @cssprop [--hx-alert-enter-duration=var(--hx-duration-normal)] - Enter animation duration.
 * @cssprop [--hx-alert-exit-duration=var(--hx-duration-fast)] - Exit animation duration.
 * @cssprop [--hx-alert-enter-easing=var(--hx-easing-decelerate)] - Enter easing function.
 * @cssprop [--hx-alert-exit-easing=var(--hx-easing-accelerate)] - Exit easing function.
 */
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  static override styles = [tokenStyles, helixAlertStyles];

  @property({ type: String, reflect: true })
  variant: AlertVariant = 'info';

  @property({ type: Boolean, reflect: true })
  closable = false;

  @property({ type: Boolean, reflect: true })
  open = true;

  private _isAnimating = false;

  private get _alertEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.alert') ?? null;
  }

  private _prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  override updated(changed: PropertyValues<this>): void {
    // Trigger enter animation when `open` transitions false → true
    if (changed.has('open') && this.open && changed.get('open') === false) {
      this._playEnterAnimation();
    }
  }

  private _playEnterAnimation(): void {
    if (this._prefersReducedMotion()) return;

    const el = this._alertEl;
    if (!el) return;

    el.style.willChange = 'opacity, transform';

    const duration = parseInt(
      getComputedStyle(this).getPropertyValue('--hx-alert-enter-duration').trim() || '250',
      10,
    );

    const animation = el.animate(
      [
        { opacity: '0', transform: 'translateY(-0.5rem)' },
        { opacity: '1', transform: 'translateY(0)' },
      ],
      {
        duration,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        fill: 'both',
      },
    );

    animation.finished.then(() => {
      el.style.willChange = 'auto';
    });
  }

  private async _handleClose(): Promise<void> {
    if (this._isAnimating) return;

    const el = this._alertEl;
    if (!el) {
      this.open = false;
      this._dispatchCloseEvent();
      return;
    }

    if (!this._prefersReducedMotion()) {
      this._isAnimating = true;
      el.style.willChange = 'opacity, transform';

      const duration = parseInt(
        getComputedStyle(this).getPropertyValue('--hx-alert-exit-duration').trim() || '150',
        10,
      );

      const animation = el.animate(
        [
          { opacity: '1', transform: 'translateY(0)' },
          { opacity: '0', transform: 'translateY(-0.5rem)' },
        ],
        {
          duration,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'both',
        },
      );

      await animation.finished;
      el.style.willChange = 'auto';
      this._isAnimating = false;
    }

    this.open = false;
    this._dispatchCloseEvent();
  }

  private _dispatchCloseEvent(): void {
    this.dispatchEvent(
      new CustomEvent('hx-close', {
        bubbles: true,
        composed: true,
        detail: { reason: 'user' },
      }),
    );
  }

  private get _role(): string {
    return this.variant === 'error' || this.variant === 'warning' ? 'alert' : 'status';
  }

  private get _ariaLive(): string {
    return this.variant === 'error' || this.variant === 'warning' ? 'assertive' : 'polite';
  }

  override render() {
    const classes = {
      alert: true,
      [`alert--${this.variant}`]: true,
    };

    return html`
      <div part="alert" class=${classMap(classes)} role=${this._role} aria-live=${this._ariaLive}>
        <div part="icon" class="alert__icon">
          <slot name="icon"></slot>
        </div>
        <div part="message" class="alert__message">
          <slot></slot>
        </div>
        ${this.closable
          ? html`
              <button
                part="close-button"
                class="alert__close-button"
                aria-label="Close"
                @click=${this._handleClose}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                  />
                </svg>
              </button>
            `
          : nothing}
      </div>
    `;
  }
}
```

Usage:

```html
<!-- Default — animates in on mount -->
<hx-alert variant="success"> Lab results received successfully. </hx-alert>

<!-- Closable — exit animation plays before removal -->
<hx-alert variant="warning" closable> Patient has a documented penicillin allergy. </hx-alert>

<!-- Custom timing via component token -->
<hx-alert variant="error" style="--hx-alert-enter-duration: 400ms;">
  Critical: Medication dosage exceeds safe threshold.
</hx-alert>

<!-- Listen for close event -->
<hx-alert variant="info" closable id="my-alert"> New protocol updates are available. </hx-alert>
<script>
  document.getElementById('my-alert').addEventListener('hx-close', (e) => {
    console.log('Alert dismissed by:', e.detail.reason);
  });
</script>
```

---

## Testing Animations

Testing CSS animations in Vitest browser mode requires waiting for animation completion and respecting the reduced-motion preference.

### Testing Enter Animation

```typescript
// hx-alert.test.ts (animation section)
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, html, cleanup } from '@open-wc/testing';
import '../src/components/hx-alert/hx-alert.js';

describe('hx-alert animations', () => {
  afterEach(() => cleanup());

  it('applies will-change before enter animation starts', async () => {
    const el = await fixture<HTMLElement>(html`<hx-alert open>Test</hx-alert>`);
    const alert = el.shadowRoot!.querySelector('.alert') as HTMLElement;

    // During or just after enter animation
    expect(['opacity, transform', 'auto']).toContain(alert.style.willChange);
  });

  it('removes will-change after enter animation completes', async () => {
    const el = await fixture<HTMLElement>(html`<hx-alert open>Test</hx-alert>`);
    const alert = el.shadowRoot!.querySelector('.alert') as HTMLElement;

    // Wait for animation to complete (default 250ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(alert.style.willChange).toBe('auto');
  });

  it('skips animation when prefers-reduced-motion is set', async () => {
    // Override matchMedia in test environment
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    const el = await fixture<HTMLElement>(html`<hx-alert open>Test</hx-alert>`);
    const alert = el.shadowRoot!.querySelector('.alert') as HTMLElement;

    // will-change should never be set when motion is reduced
    expect(alert.style.willChange).not.toBe('opacity, transform');

    window.matchMedia = original;
  });

  it('dispatches hx-close after exit animation completes', async () => {
    const el = await fixture<HTMLElement>(html` <hx-alert open closable>Test alert</hx-alert> `);

    const closePromise = new Promise<CustomEvent>((resolve) => {
      el.addEventListener('hx-close', (e) => resolve(e as CustomEvent), { once: true });
    });

    const closeBtn = el.shadowRoot!.querySelector('.alert__close-button') as HTMLButtonElement;
    closeBtn.click();

    const event = await closePromise;
    expect(event.detail.reason).toBe('user');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('sets open to false after exit animation', async () => {
    const el = (await fixture<HTMLElement>(html`
      <hx-alert open closable>Test alert</hx-alert>
    `)) as any;

    const closeBtn = el.shadowRoot!.querySelector('.alert__close-button') as HTMLButtonElement;
    closeBtn.click();

    // Wait for exit animation (150ms) + buffer
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(el.open).toBe(false);
  });
});
```

---

## Summary

Animations in HELiX components are CSS-first, token-driven, and unconditionally respectful of user motion preferences.

**Key rules:**

- Use `--hx-duration-*` and `--hx-easing-*` tokens for all timing — never hardcode milliseconds or cubic-bezier values in component styles
- Use `@keyframes` inside `static styles` — they are shadow-scoped and cannot conflict with other components or consumer global CSS
- Apply different easing for enter (`decelerate`) and exit (`accelerate`) — this asymmetry makes motion feel purposeful
- Gate every transition and animation behind `@media (prefers-reduced-motion: reduce)` — this is mandatory in HELiX, not optional
- Animate only `opacity`, `transform`, and `filter` for zero-jank performance — these run on the compositor thread
- Use `will-change: opacity, transform` before animations start, and reset to `will-change: auto` after `animation.finished` resolves
- Use `updated(changed: PropertyValues)` to react to property changes and trigger JS animations
- Use `animation.finished` to play exit animations before updating reactive properties — this keeps Lit from removing DOM before the animation completes
- Expose `--hx-alert-enter-duration`, `--hx-alert-exit-duration` (and easing equivalents) as component token APIs so consumers can tune timing without touching source

---

## Next Steps

- [Dark Mode & Color Schemes](/components/styling/dark-mode) — `prefers-color-scheme` and token-based theming
- [Design Token Architecture](/components/styling/tokens) — Complete token reference including timing tokens
- [Performance Optimization](/components/styling/performance) — Constructable Stylesheets and style recalculation
- [Accessibility Guide](/components/accessibility/overview) — `prefers-reduced-motion`, ARIA live regions, and focus management

---

## Sources

- [MDN: CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN: Web Animations API — Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [MDN: CSS ::part() pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [web.dev: Animations performance](https://web.dev/articles/animations-guide)
- [web.dev: An animated adventure with prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- [Google Material Design: Motion principles](https://m3.material.io/styles/motion/overview)
- [Lit: ReactiveElement — updated()](https://lit.dev/docs/components/lifecycle/#updated)
