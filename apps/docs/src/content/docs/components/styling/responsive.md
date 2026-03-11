---
title: Responsive Components
description: Deep dive into building responsive web components with container queries, media queries in shadow DOM, ResizeObserver patterns, and viewport units for adaptive layouts.
sidebar:
  order: 5
---

Responsive design in web components requires a fundamentally different approach than traditional CSS. Shadow DOM encapsulation changes how media queries work, viewport units behave unexpectedly in nested contexts, and component-driven design demands intrinsic responsiveness. Modern web components need to adapt to their container, not just the viewport.

This guide covers container queries, media queries within shadow DOM, ResizeObserver patterns, viewport unit considerations, and responsive design patterns that work across all contexts. You will learn how to build truly adaptive components that respond to their environment regardless of where they are placed.

---

## Prerequisites

Before diving into responsive patterns, ensure you understand:

- [Component Styling Fundamentals](/components/styling/fundamentals) — `:host` selectors, CSS custom properties, Shadow DOM encapsulation
- [Design Token Architecture](/components/styling/tokens) — Token-based theming and cascading custom properties
- Basic CSS responsive design concepts (media queries, flexible layouts)

---

## The Responsive Web Component Challenge

Traditional responsive design relies on viewport-based media queries, assuming components adapt to the screen size. This works for page-level layouts but breaks down for reusable components:

### Why Viewport Queries Fail Components

```html
<!-- Page A: Full-width hero -->
<hx-card class="hero">
  <!-- Component sees 1440px viewport, renders large variant -->
</hx-card>

<!-- Page B: Sidebar widget -->
<aside style="width: 300px;">
  <hx-card class="widget">
    <!-- PROBLEM: Component still sees 1440px viewport, renders large variant -->
    <!-- But card is only 300px wide — layout breaks -->
  </hx-card>
</aside>
```

**The issue:** Media queries inside shadow DOM read the **viewport width**, not the component's actual width. A card in a narrow sidebar on a wide desktop still thinks it is on a large screen.

### What Components Need

Web components need **intrinsic responsiveness** — the ability to adapt to their **container size** regardless of viewport:

- Card in 300px sidebar: Render stacked layout, smaller typography
- Same card in 1200px hero: Render horizontal layout, larger typography
- Move component between contexts: Automatically adjust without code changes

---

## Container Queries: The Modern Solution

Container queries allow elements to respond to their **containing element's size** rather than the viewport. This is the ideal solution for responsive web components.

### Browser Support

Container size queries achieved **baseline browser support in 2023**, supported across all modern browsers:

- Chrome/Edge: 105+ (September 2022)
- Safari: 16.0+ (September 2022)
- Firefox: 110+ (February 2023)

Container query length units (`cqw`, `cqh`, `cqi`, `cqb`) are also fully supported across all modern browsers.

### How Container Queries Work

Container queries require two steps:

1. **Establish a container context** — Mark an element as a query container
2. **Query the container** — Write conditional styles based on container dimensions

### Basic Container Query Pattern

```typescript
// hx-card.styles.ts
import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    container-type: inline-size; /* Establish container context */
    container-name: card; /* Optional: name for scoped queries */
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-4, 1rem);
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    background: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
  }

  /* Container query: When card is 600px or wider */
  @container (min-width: 600px) {
    .card {
      flex-direction: row; /* Switch to horizontal layout */
      gap: var(--hx-space-6, 1.5rem);
    }

    .card__content {
      flex: 1;
    }

    .card__image {
      width: 200px;
      flex-shrink: 0;
    }
  }

  /* Container query: When card is 900px or wider */
  @container (min-width: 900px) {
    .card {
      gap: var(--hx-space-8, 2rem);
    }

    .card__heading {
      font-size: var(--hx-font-size-2xl, 1.5rem);
    }
  }
`;
```

**Result:** The card adapts to its **own width**, not the viewport:

- Card in 250px sidebar: Stacked layout (vertical)
- Card in 700px content area: Horizontal layout
- Card in 1000px hero section: Horizontal layout with larger spacing

### Container Type Values

The `container-type` property defines what dimensions can be queried:

```css
/* Query inline dimension (width in horizontal writing mode) */
:host {
  container-type: inline-size;
}

/* Query block dimension (height) */
:host {
  container-type: block-size;
}

/* Query both dimensions */
:host {
  container-type: size;
}

/* Default (no container context) */
:host {
  container-type: normal;
}
```

**Best practice for components:** Use `container-type: inline-size` (width-based queries). Querying both dimensions (`size`) can cause layout instability if the component's height depends on its content.

### Container Query Syntax

Container queries support the same media query syntax:

```css
/* Minimum width */
@container (min-width: 400px) {
  .card {
    /* styles */
  }
}

/* Maximum width */
@container (max-width: 600px) {
  .card {
    /* styles */
  }
}

/* Range (width between 400px and 800px) */
@container (min-width: 400px) and (max-width: 800px) {
  .card {
    /* styles */
  }
}

/* Modern range syntax (cleaner) */
@container (400px <= width <= 800px) {
  .card {
    /* styles */
  }
}

/* Orientation (aspect ratio) */
@container (orientation: landscape) {
  .card {
    /* styles */
  }
}

/* Aspect ratio */
@container (aspect-ratio > 16/9) {
  .card {
    /* styles */
  }
}
```

### Named Container Queries

Use `container-name` to query specific ancestors when multiple containers exist:

```css
:host {
  container-type: inline-size;
  container-name: card; /* Name this container */
}

/* Query the nearest container named "card" */
@container card (min-width: 600px) {
  .card__content {
    /* styles */
  }
}
```

**When to use names:**

- Nested components with multiple container contexts
- Disambiguating which ancestor to query
- Documentation clarity (explicit intent)

**When to skip names:**

- Simple single-container components
- No nested container contexts

### Container Query Units

Container queries provide new length units based on container dimensions:

| Unit    | Meaning                     | Example                                         |
| ------- | --------------------------- | ----------------------------------------------- |
| `cqw`   | 1% of container width       | `width: 50cqw` (50% of container width)         |
| `cqh`   | 1% of container height      | `height: 25cqh` (25% of container height)       |
| `cqi`   | 1% of container inline size | `font-size: 5cqi` (5% of container inline size) |
| `cqb`   | 1% of container block size  | `margin-block: 2cqb`                            |
| `cqmin` | Smaller of `cqi` or `cqb`   | `gap: 2cqmin`                                   |
| `cqmax` | Larger of `cqi` or `cqb`    | `padding: 3cqmax`                               |

**Best practice:** Use `cqi` instead of `vw` for intrinsic typography scaling:

```css
:host {
  container-type: inline-size;
}

.card__heading {
  /* BAD: Scales with viewport, not container */
  font-size: clamp(1rem, 3vw, 2rem);

  /* GOOD: Scales with container width */
  font-size: clamp(1rem, 5cqi, 2rem);
}
```

**Result:** Typography scales proportionally to the component's width, not the viewport. A card in a narrow sidebar has smaller text; the same card in a wide hero section has larger text.

### HELiX Container Query Pattern

HELiX components use container queries for all layout-level responsiveness:

```typescript
// hx-card.ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { wcCardStyles } from './hx-card.styles.js';

/**
 * A flexible card component with intrinsic responsive layout.
 *
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-padding=var(--hx-space-6)] - Card padding.
 *
 * @csspart card - The card container element.
 *
 * @slot - Default content slot.
 * @slot image - Card image (top or left depending on container width).
 * @slot heading - Card heading.
 * @slot actions - Card action buttons (footer).
 */
@customElement('hx-card')
export class HxCard extends LitElement {
  static styles = wcCardStyles;

  @property({ reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  render() {
    return html`
      <div part="card" class="card card--${this.variant}">
        <div class="card__image" ?hidden="${!this.hasSlot('image')}">
          <slot name="image"></slot>
        </div>
        <div class="card__content">
          <div class="card__heading" ?hidden="${!this.hasSlot('heading')}">
            <slot name="heading"></slot>
          </div>
          <div class="card__body">
            <slot></slot>
          </div>
        </div>
        <div class="card__actions" ?hidden="${!this.hasSlot('actions')}">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  private hasSlot(name: string): boolean {
    return !!this.querySelector(`[slot="${name}"]`);
  }
}
```

```typescript
// hx-card.styles.ts
import { css } from 'lit';

export const wcCardStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    container-name: card;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-4, 1rem);
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    background: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));
  }

  .card__image {
    overflow: hidden;
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  .card__image ::slotted(img) {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .card__heading {
    font-size: var(--hx-font-size-xl, 1.25rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
    margin-bottom: var(--hx-space-2, 0.5rem);
  }

  .card__body {
    flex: 1;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-color-neutral-600, #495057);
  }

  .card__actions {
    display: flex;
    gap: var(--hx-space-2, 0.5rem);
    padding-top: var(--hx-space-4, 1rem);
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
    margin-top: var(--hx-space-4, 1rem);
  }

  /* ─── RESPONSIVE: Horizontal layout at 600px+ ─── */
  @container card (min-width: 600px) {
    .card {
      flex-direction: row;
      align-items: flex-start;
    }

    .card__image {
      width: 200px;
      flex-shrink: 0;
    }

    .card__content {
      flex: 1;
    }

    .card__actions {
      border-top: none;
      border-left: var(--hx-border-width-thin, 1px) solid
        var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
      padding-left: var(--hx-space-4, 1rem);
      padding-top: 0;
      margin-top: 0;
      margin-left: var(--hx-space-4, 1rem);
      flex-direction: column;
    }
  }

  /* ─── RESPONSIVE: Larger spacing at 900px+ ─── */
  @container card (min-width: 900px) {
    .card {
      gap: var(--hx-space-8, 2rem);
      padding: var(--hx-space-8, 2rem);
    }

    .card__heading {
      font-size: var(--hx-font-size-2xl, 1.5rem);
    }

    .card__body {
      font-size: var(--hx-font-size-lg, 1.125rem);
    }
  }
`;
```

**Usage:**

```html
<!-- Narrow sidebar (300px) — vertical layout -->
<aside style="width: 300px;">
  <hx-card>
    <img slot="image" src="thumb.jpg" alt="Thumbnail" />
    <h3 slot="heading">Recent Article</h3>
    <p>Lorem ipsum dolor sit amet...</p>
  </hx-card>
</aside>

<!-- Content area (800px) — horizontal layout -->
<main style="max-width: 800px;">
  <hx-card>
    <img slot="image" src="featured.jpg" alt="Featured image" />
    <h3 slot="heading">Featured Post</h3>
    <p>Consectetur adipiscing elit...</p>
    <div slot="actions">
      <hx-button>Read More</hx-button>
    </div>
  </hx-card>
</main>
```

The card automatically adapts to its container width without any additional configuration.

---

## Media Queries in Shadow DOM

While container queries are the modern solution, media queries still have a role for viewport-based decisions (e.g., mobile navigation patterns, global layout shifts).

### How Media Queries Work in Shadow DOM

Media queries inside shadow DOM **always query the viewport**, not the component or its container:

```typescript
// wc-nav.styles.ts
export const navStyles = css`
  :host {
    display: block;
  }

  .nav {
    display: flex;
    flex-direction: column;
  }

  /* Applies when VIEWPORT is 768px+ */
  @media (min-width: 768px) {
    .nav {
      flex-direction: row;
    }
  }
`;
```

**Key behavior:** This media query checks the **window width**, not the `<wc-nav>` element width. Even if the nav is in a 400px sidebar, it switches to horizontal layout on wide viewports.

### When to Use Media Queries

Media queries are appropriate for:

**1. Global layout patterns:**

```css
/* Mobile-first navigation: vertical on small screens, horizontal on desktop */
@media (min-width: 768px) {
  .nav {
    flex-direction: row;
  }
}
```

**2. Viewport-specific features:**

```css
/* Hide decorative elements on small screens */
@media (max-width: 640px) {
  .decorative-icon {
    display: none;
  }
}

/* Adjust for touch interfaces */
@media (pointer: coarse) {
  .button {
    min-height: 44px; /* Larger touch targets */
  }
}
```

**3. Print styles:**

```css
@media print {
  :host {
    page-break-inside: avoid;
  }

  .no-print {
    display: none;
  }
}
```

**4. Reduced motion preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**5. Dark mode detection:**

```css
@media (prefers-color-scheme: dark) {
  :host {
    --_bg: var(--hx-color-neutral-900, #1a1a1a);
    --_color: var(--hx-color-neutral-0, #ffffff);
  }
}
```

### When to Use Container Queries Instead

Container queries are better for:

- Component layout changes (stacked vs. horizontal)
- Typography scaling based on available space
- Image sizing/cropping relative to container
- Any adaptation based on component width

**Rule of thumb:** If the decision is about **the component's context**, use container queries. If the decision is about **the user's device/preferences**, use media queries.

### Combining Media and Container Queries

You can combine both for nuanced responsive behavior:

```css
:host {
  container-type: inline-size;
}

/* Mobile-first base styles */
.card {
  padding: var(--hx-space-4, 1rem);
}

/* Container-based layout (intrinsic responsiveness) */
@container (min-width: 600px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}

/* Viewport-based spacing (global adjustment) */
@media (min-width: 1024px) {
  .card {
    padding: var(--hx-space-6, 1.5rem);
  }
}

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

---

## ResizeObserver: JavaScript-Based Responsiveness

For cases where CSS alone cannot solve responsive challenges, the ResizeObserver API provides JavaScript-driven adaptation based on element dimensions.

### What is ResizeObserver?

`ResizeObserver` is a browser API that watches elements for size changes and fires a callback with the new dimensions. It is the JavaScript equivalent of container queries.

**Browser support:** ResizeObserver is supported in all modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+, Edge 79+).

### Basic ResizeObserver Pattern

```typescript
// wc-responsive-grid.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-responsive-grid')
export class WcResponsiveGrid extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .grid {
      display: grid;
      gap: var(--hx-space-4, 1rem);
    }

    .grid--small {
      grid-template-columns: 1fr;
    }

    .grid--medium {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid--large {
      grid-template-columns: repeat(3, 1fr);
    }

    .grid--xlarge {
      grid-template-columns: repeat(4, 1fr);
    }
  `;

  @state()
  private _size: 'small' | 'medium' | 'large' | 'xlarge' = 'small';

  private _resizeObserver?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this._setupResizeObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  private _setupResizeObserver() {
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        this._size = this._getSizeBreakpoint(width);
      }
    });

    this._resizeObserver.observe(this);
  }

  private _getSizeBreakpoint(width: number): 'small' | 'medium' | 'large' | 'xlarge' {
    if (width >= 1200) return 'xlarge';
    if (width >= 900) return 'large';
    if (width >= 600) return 'medium';
    return 'small';
  }

  render() {
    return html`
      <div class="grid grid--${this._size}">
        <slot></slot>
      </div>
    `;
  }
}
```

**Usage:**

```html
<wc-responsive-grid>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</wc-responsive-grid>
```

**Behavior:** As the grid container resizes, it automatically adjusts column count based on width.

### When to Use ResizeObserver

ResizeObserver is appropriate when:

**1. Dynamic class-based styling:**

Apply classes based on size thresholds that affect multiple unrelated properties:

```typescript
// Complex responsive behavior that requires coordinated changes
private _updateLayout(width: number) {
  if (width < 400) {
    this.classList.add('compact-mode');
    this._showMobileNav();
    this._hideToolbar();
  }
}
```

**2. Conditional rendering:**

Show/hide elements based on available space:

```typescript
render() {
  return html`
    <div class="toolbar">
      ${this._width > 600 ? html`<div class="filters">...</div>` : nothing}
      ${this._width < 400 ? html`<button>Menu</button>` : nothing}
    </div>
  `;
}
```

**3. Dynamic calculations:**

Compute values that CSS cannot express:

```typescript
private _updateItemWidth(containerWidth: number) {
  const itemsPerRow = Math.floor(containerWidth / 200);
  const gap = 16;
  const itemWidth = (containerWidth - gap * (itemsPerRow - 1)) / itemsPerRow;
  this._itemWidth = itemWidth;
}
```

**4. Third-party integrations:**

Notify external libraries of size changes:

```typescript
private _handleResize(width: number, height: number) {
  this._chart?.resize(width, height);
}
```

### ResizeObserver Best Practices

**1. Clean up on disconnect:**

```typescript
disconnectedCallback() {
  super.disconnectedCallback();
  this._resizeObserver?.disconnect();
  this._resizeObserver = undefined;
}
```

**2. Debounce expensive operations:**

```typescript
private _resizeDebounceTimeout?: number;

private _setupResizeObserver() {
  this._resizeObserver = new ResizeObserver((entries) => {
    clearTimeout(this._resizeDebounceTimeout);
    this._resizeDebounceTimeout = window.setTimeout(() => {
      this._handleResize(entries[0].contentRect.width);
    }, 100);
  });
  this._resizeObserver.observe(this);
}
```

**3. Prefer container queries when possible:**

If CSS can handle it, use container queries. ResizeObserver is for cases CSS cannot solve.

```typescript
// AVOID: This can be done with container queries
@state() private _layout: 'horizontal' | 'vertical' = 'vertical';

// PREFER: CSS container query
@container (min-width: 600px) {
  .card { flex-direction: row; }
}
```

**4. Use `requestAnimationFrame` for DOM updates:**

```typescript
private _handleResize(width: number) {
  requestAnimationFrame(() => {
    this._updateLayout(width);
  });
}
```

---

## Viewport Units in Shadow DOM

Viewport units (`vw`, `vh`, `vi`, `vb`) refer to the **browser viewport** and work the same inside shadow DOM as outside. However, they have limitations for component-level responsiveness.

### Viewport Unit Reference

| Unit   | Meaning                    | Example                                |
| ------ | -------------------------- | -------------------------------------- |
| `vw`   | 1% of viewport width       | `width: 50vw` (50% of viewport width)  |
| `vh`   | 1% of viewport height      | `height: 100vh` (full viewport height) |
| `vi`   | 1% of viewport inline size | `font-size: 2vi`                       |
| `vb`   | 1% of viewport block size  | `margin-block: 5vb`                    |
| `vmin` | Smaller of `vw` or `vh`    | `padding: 2vmin`                       |
| `vmax` | Larger of `vw` or `vh`     | `gap: 3vmax`                           |

### The Problem with Viewport Units in Components

Viewport units scale with the **browser window**, not the component's container:

```css
/* PROBLEM: Card in 300px sidebar still uses viewport width */
.card__heading {
  font-size: clamp(1rem, 3vw, 2rem);
}
```

**Result on 1440px screen:**

- Card in sidebar (300px wide): Heading is `3vw` = 43px (too large!)
- Card in hero (1200px wide): Heading is `3vw` = 43px (appropriate)

The font size is the same regardless of container width because `vw` queries the viewport.

### When Viewport Units Are Appropriate

**1. Full-screen components:**

```css
/* Modal overlay covering entire viewport */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
}
```

**2. Viewport-relative spacing:**

```css
/* Hero section with height relative to viewport */
.hero {
  min-height: 80vh;
  padding: 5vh 5vw;
}
```

**3. Responsive typography with limits:**

```css
/* Page-level heading that scales with viewport */
.page-heading {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

### Prefer Container Query Units

For component-internal responsive sizing, use container query units (`cqi`, `cqw`) instead:

```css
:host {
  container-type: inline-size;
}

/* GOOD: Scales with component width */
.card__heading {
  font-size: clamp(1rem, 5cqi, 2rem);
}

/* Component in 300px sidebar: 5cqi = 15px (base 1rem) */
/* Component in 1000px hero: 5cqi = 50px (capped at 2rem) */
```

### Dynamic Viewport Units

Modern browsers support dynamic viewport units that account for browser UI:

| Unit  | Meaning                 | Use Case                                  |
| ----- | ----------------------- | ----------------------------------------- |
| `dvh` | Dynamic viewport height | Adjust for mobile browser toolbars        |
| `dvw` | Dynamic viewport width  | Full-width on mobile                      |
| `lvh` | Large viewport height   | Maximum viewport height (toolbars hidden) |
| `lvw` | Large viewport width    | Maximum viewport width                    |
| `svh` | Small viewport height   | Minimum viewport height (toolbars shown)  |
| `svw` | Small viewport width    | Minimum viewport width                    |

**Use case: Mobile full-screen modals:**

```css
/* Traditional (doesn't account for mobile toolbars) */
.modal {
  height: 100vh; /* May be obscured by address bar on mobile */
}

/* Modern (adjusts dynamically as toolbars show/hide) */
.modal {
  height: 100dvh; /* Adapts to visible viewport */
}
```

**Browser support:** Dynamic viewport units are supported in Safari 15.4+, Chrome 108+, Firefox 101+.

---

## Responsive Design Patterns

### Pattern 1: Fluid Typography

Use `clamp()` with container query units for proportional scaling:

```css
:host {
  container-type: inline-size;
}

.heading {
  /* Minimum 1.25rem, scales with container, max 2.5rem */
  font-size: clamp(1.25rem, 5cqi, 2.5rem);
  line-height: var(--hx-line-height-tight, 1.25);
}

.body {
  font-size: clamp(0.875rem, 3cqi, 1.125rem);
  line-height: var(--hx-line-height-normal, 1.5);
}
```

**Result:** Typography scales smoothly with component width, maintaining readability at all sizes.

### Pattern 2: Aspect-Ratio Containers

Use `aspect-ratio` for consistent proportions:

```css
.card__image {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.card__image ::slotted(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Different ratio for narrow cards */
@container (max-width: 400px) {
  .card__image {
    aspect-ratio: 4 / 3;
  }
}
```

### Pattern 3: Flex Wrapping

Allow flex items to wrap based on container width:

```css
.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--hx-space-2, 0.5rem);
}

/* Stack vertically in narrow containers */
@container (max-width: 400px) {
  .card__actions {
    flex-direction: column;
  }

  .card__actions ::slotted(hx-button) {
    width: 100%;
  }
}
```

### Pattern 4: Grid Auto-Fit

Use `auto-fit` for responsive grid columns without media queries:

```css
.grid {
  display: grid;
  /* Auto-fill columns at minimum 200px width */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--hx-space-4, 1rem);
}

.card {
  /* Grow to fill available space */
  min-width: 0; /* Allow grid items to shrink below min-content */
}
```

**Behavior:** Grid automatically adjusts column count based on available space. When container is 650px wide, it shows 3 columns (200px each + gaps). When container is 450px, it shows 2 columns.

### Pattern 5: Conditional Slot Display

Show/hide slots based on container size using container queries:

```css
.card__metadata {
  display: none;
}

@container (min-width: 500px) {
  .card__metadata {
    display: block;
  }
}
```

```typescript
render() {
  return html`
    <div class="card">
      <slot name="image"></slot>
      <slot></slot>
      <div class="card__metadata">
        <slot name="author"></slot>
        <slot name="date"></slot>
      </div>
    </div>
  `;
}
```

**Result:** Metadata slots only display when card is wide enough to accommodate them.

### Pattern 6: Responsive Padding

Scale padding with container size using `cqi` units:

```css
:host {
  container-type: inline-size;
}

.card {
  /* Minimum 1rem, scales with container, max 2rem */
  padding: clamp(1rem, 4cqi, 2rem);
}
```

**Alternative with breakpoints:**

```css
.card {
  padding: var(--hx-space-4, 1rem);
}

@container (min-width: 600px) {
  .card {
    padding: var(--hx-space-6, 1.5rem);
  }
}

@container (min-width: 900px) {
  .card {
    padding: var(--hx-space-8, 2rem);
  }
}
```

### Pattern 7: Responsive Icons

Adjust icon size based on container:

```css
.icon {
  width: 1.5rem;
  height: 1.5rem;
}

@container (min-width: 600px) {
  .icon {
    width: 2rem;
    height: 2rem;
  }
}

@container (min-width: 900px) {
  .icon {
    width: 2.5rem;
    height: 2.5rem;
  }
}
```

---

## Testing Responsive Components

### Manual Testing Strategy

Test components at multiple container widths, not just viewport sizes:

```html
<!-- Test grid: Multiple widths simultaneously -->
<div style="display: grid; gap: 2rem; margin: 2rem;">
  <!-- 300px (sidebar) -->
  <div style="width: 300px; border: 1px solid red;">
    <hx-card>
      <h3 slot="heading">300px Container</h3>
      <p>Content here...</p>
    </hx-card>
  </div>

  <!-- 600px (tablet) -->
  <div style="width: 600px; border: 1px solid orange;">
    <hx-card>
      <h3 slot="heading">600px Container</h3>
      <p>Content here...</p>
    </hx-card>
  </div>

  <!-- 900px (desktop) -->
  <div style="width: 900px; border: 1px solid green;">
    <hx-card>
      <h3 slot="heading">900px Container</h3>
      <p>Content here...</p>
    </hx-card>
  </div>

  <!-- 1200px (wide) -->
  <div style="width: 1200px; border: 1px solid blue;">
    <hx-card>
      <h3 slot="heading">1200px Container</h3>
      <p>Content here...</p>
    </hx-card>
  </div>
</div>
```

### Automated Testing with Playwright

Test responsive behavior at specific container widths:

```typescript
// hx-card.test.ts
import { test, expect } from '@playwright/test';

test('card switches to horizontal layout at 600px', async ({ page }) => {
  await page.setContent(`
    <style>
      .container { width: 700px; }
    </style>
    <div class="container">
      <hx-card>
        <img slot="image" src="test.jpg" alt="Test" />
        <h3 slot="heading">Test Card</h3>
        <p>Content</p>
      </hx-card>
    </div>
  `);

  const card = page.locator('hx-card');
  const shadowCard = card.locator('.card');

  // Check flex-direction changes at breakpoint
  const flexDirection = await shadowCard.evaluate((el) => getComputedStyle(el).flexDirection);

  expect(flexDirection).toBe('row'); // Horizontal at 700px
});

test('card uses vertical layout below 600px', async ({ page }) => {
  await page.setContent(`
    <style>
      .container { width: 400px; }
    </style>
    <div class="container">
      <hx-card>
        <img slot="image" src="test.jpg" alt="Test" />
        <h3 slot="heading">Test Card</h3>
        <p>Content</p>
      </hx-card>
    </div>
  `);

  const card = page.locator('hx-card');
  const shadowCard = card.locator('.card');

  const flexDirection = await shadowCard.evaluate((el) => getComputedStyle(el).flexDirection);

  expect(flexDirection).toBe('column'); // Vertical at 400px
});
```

### Visual Regression Testing

Capture screenshots at multiple container widths:

```typescript
// e2e/vrt.spec.ts
import { test } from '@playwright/test';

test('hx-card responsive layouts', async ({ page }) => {
  await page.goto('/components/hx-card');

  const widths = [300, 600, 900, 1200];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.screenshot({
      path: `screenshots/hx-card-${width}px.png`,
      fullPage: true,
    });
  }
});
```

---

## Accessibility Considerations

### 1. Responsive Focus Indicators

Ensure focus rings remain visible at all container sizes:

```css
.button:focus-visible {
  outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
  outline-offset: var(--hx-focus-ring-offset, 2px);
}

/* Maintain focus visibility even in compact mode */
@container (max-width: 400px) {
  .button:focus-visible {
    outline-width: 3px; /* Thicker ring on small screens */
  }
}
```

### 2. Touch Target Sizing

Maintain WCAG 2.1 minimum touch target size (44x44px):

```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
}

/* Larger touch targets on mobile */
@media (pointer: coarse) {
  .button {
    min-height: 48px;
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-5, 1.25rem);
  }
}
```

### 3. Text Readability

Ensure text remains readable at all container sizes:

```css
.card__body {
  /* Never smaller than 0.875rem (14px) */
  font-size: clamp(0.875rem, 3cqi, 1.125rem);
  line-height: var(--hx-line-height-normal, 1.5); /* Maintain readability */
}
```

### 4. Reduced Motion

Respect `prefers-reduced-motion` for all responsive transitions:

```css
.card {
  transition:
    flex-direction var(--hx-transition-normal, 250ms ease),
    padding var(--hx-transition-normal, 250ms ease);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

---

## Performance Considerations

### 1. Container Query Performance

Container queries are highly performant and comparable to media queries. Modern browsers optimize container query evaluation.

**Best practice:** Prefer container queries over ResizeObserver for layout changes. CSS-driven responsiveness is faster than JavaScript-driven.

### 2. Avoid Layout Thrashing

When using ResizeObserver, batch DOM reads and writes:

```typescript
// BAD: Layout thrashing (read-write-read-write)
private _handleResize(width: number) {
  this._element1.style.width = `${width / 2}px`; // Write
  const height1 = this._element1.offsetHeight; // Read (forces reflow)
  this._element2.style.height = `${height1}px`; // Write
  const height2 = this._element2.offsetHeight; // Read (forces reflow)
}

// GOOD: Batch reads, then batch writes
private _handleResize(width: number) {
  // Phase 1: Read
  const height1 = this._element1.offsetHeight;
  const height2 = this._element2.offsetHeight;

  // Phase 2: Write
  requestAnimationFrame(() => {
    this._element1.style.width = `${width / 2}px`;
    this._element2.style.height = `${height1}px`;
  });
}
```

### 3. Debounce ResizeObserver Callbacks

Avoid running expensive operations on every resize event:

```typescript
private _resizeDebounce?: number;

private _setupResizeObserver() {
  this._resizeObserver = new ResizeObserver(() => {
    clearTimeout(this._resizeDebounce);
    this._resizeDebounce = window.setTimeout(() => {
      this._updateLayout();
    }, 100); // Wait 100ms after last resize
  });
}
```

### 4. Use `content-visibility` for Large Lists

Optimize rendering of off-screen content:

```css
.list-item {
  content-visibility: auto; /* Browser skips rendering off-screen items */
  contain-intrinsic-size: 0 200px; /* Placeholder size for layout */
}
```

---

## Summary

Modern responsive web components require a fundamentally different approach than traditional page-level responsive design:

- **Container queries** provide intrinsic responsiveness, allowing components to adapt to their container size regardless of viewport
- **Media queries** still have a role for viewport-based decisions (mobile nav, print styles, user preferences)
- **ResizeObserver** enables JavaScript-driven responsiveness when CSS cannot solve the problem
- **Viewport units** are appropriate for full-screen components but fail for nested contexts; prefer container query units (`cqi`, `cqw`) for component-internal sizing
- **Responsive patterns** include fluid typography, aspect-ratio containers, flex wrapping, and conditional slot display

**HELiX responsive strategy:**

1. Use container queries for all layout-level responsiveness
2. Use media queries for viewport-based and user preference queries
3. Use ResizeObserver only when CSS cannot solve the problem
4. Use container query units (`cqi`) instead of viewport units (`vw`) for intrinsic scaling
5. Test components at multiple container widths, not just viewport sizes
6. Maintain accessibility (focus indicators, touch targets, text readability) at all sizes

Container queries are the foundation of truly reusable, context-independent web components. They enable components to adapt to their environment without knowledge of where they are placed, making them genuinely composable.

---

## Next Steps

- [Design Token Architecture](/components/styling/tokens) — Token-based theming for responsive design
- [CSS Parts Guide](/components/shadow-dom/parts) — Expose responsive styling hooks
- [Performance Optimization](/components/advanced/performance) — Optimize responsive component rendering
- [Testing Guide](/testing/component-tests) — Test responsive behavior

---

## Sources

- [Container Queries in Web Components | Max Böck](https://mxb.dev/blog/container-queries-web-components/)
- [CSS Container Queries in Web Components | Cory Rylan](https://coryrylan.com/blog/css-container-queries-in-web-components)
- [Container queries in 2026: Powerful, but not a silver bullet - LogRocket Blog](https://blog.logrocket.com/container-queries-2026/)
- [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [How You Can Use Responsive Web Components Today — SitePoint](https://www.sitepoint.com/responsive-web-components/)
- [ResizeObserver - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Using Resize Observer For Responsive Design | Medium](https://medium.com/geekculture/using-resize-observer-for-responsive-design-5034ec2e785b)
- [Hyper-responsive web components | Trys Mudford](https://www.trysmudford.com/blog/hyper-responsive-web-components/)
- [CSS Shadow DOM Pitfalls: Styling Web Components Correctly](https://blog.pixelfreestudio.com/css-shadow-dom-pitfalls-styling-web-components-correctly/)
- [MDN: CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [web.dev: Container Queries](https://web.dev/articles/cq-stable)
