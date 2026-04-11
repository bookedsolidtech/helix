---
title: Responsive Design
description: Build responsive HELiX components using CSS container queries, ResizeObserver, and mobile-first token scales.
---

Web components live in unpredictable layout contexts. A component dropped into a narrow sidebar needs to look different from the same component spanning a full-width content area. CSS container queries and `ResizeObserver` give components the tools to adapt to their own dimensions rather than the viewport.

## CSS Container Queries

Container queries let a component respond to its own available width rather than the viewport. They are the preferred responsive tool for shadow DOM because each component can define its own containment context.

### Defining a Container

Establish a containment context on the host element or an internal wrapper:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-media-card')
export class HelixMediaCard extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
        container-type: inline-size;
        container-name: media-card;
      }

      .layout {
        display: flex;
        flex-direction: column;
        gap: var(--hx-spacing-md);
      }

      /* When the component is at least 480px wide, switch to row layout */
      @container media-card (min-width: 480px) {
        .layout {
          flex-direction: row;
          align-items: flex-start;
        }

        .image {
          flex: 0 0 160px;
        }
      }

      /* Larger breakpoint — more generous spacing */
      @container media-card (min-width: 720px) {
        .layout {
          gap: var(--hx-spacing-xl);
        }

        .image {
          flex: 0 0 240px;
        }
      }
    `,
  ];

  override render() {
    return html`
      <div class="layout">
        <div class="image"><slot name="image"></slot></div>
        <div class="content"><slot></slot></div>
      </div>
    `;
  }
}
```

### Mobile-First with `min-width`

Always write container queries mobile-first using `min-width`. Start with the smallest, most constrained layout and progressively enhance:

```css
/* Base — single column, compact */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--hx-spacing-sm);
}

/* At 480px+ — two columns */
@container (min-width: 480px) {
  .grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--hx-spacing-md);
  }
}

/* At 768px+ — three columns, generous gap */
@container (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--hx-spacing-lg);
  }
}
```

## `ResizeObserver` for JavaScript-Based Responsive Logic

Sometimes CSS alone is not enough — you may need to conditionally render different templates or adjust JavaScript behavior based on component size. `ResizeObserver` handles this.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-data-table')
export class HelixDataTable extends LitElement {
  static override styles = css`:host { display: block; }`;

  @state() private _compact = false;

  private _resizeObserver: ResizeObserver | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      this._compact = width < 600;
    });
    this._resizeObserver.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  override render() {
    return this._compact
      ? html`<div class="card-list"><slot></slot></div>`
      : html`<table><slot></slot></table>`;
  }
}
```

Always disconnect `ResizeObserver` in `disconnectedCallback` to avoid memory leaks.

## Responsive Token Scales

HELiX spacing and typography tokens provide a built-in scale. Use larger tokens at larger sizes:

```css
:host {
  padding: var(--hx-spacing-sm);
  font-size: var(--hx-font-size-sm);
}

@container (min-width: 480px) {
  :host {
    padding: var(--hx-spacing-md);
    font-size: var(--hx-font-size-base);
  }
}

@container (min-width: 768px) {
  :host {
    padding: var(--hx-spacing-lg);
  }
}
```

## Container Query Units

Container query length units (`cqi`, `cqb`, `cqw`, `cqh`) are relative to the container's dimensions, similar to how `vw`/`vh` are relative to the viewport. Use them for fluid sizing within a component:

```css
:host {
  container-type: inline-size;
}

.hero-title {
  /* Font scales fluidly with the component's width */
  font-size: clamp(
    var(--hx-font-size-xl),
    5cqi,
    var(--hx-font-size-4xl)
  );
}
```

## Viewport Queries as a Fallback

Container queries are the preferred approach, but viewport media queries remain appropriate for truly global breakpoints — page-level layout shifts, print styles, or conditions that genuinely depend on the viewport:

```css
/* OK: print is inherently viewport-level */
@media print {
  :host {
    display: none;
  }
}
```

Avoid `@media (max-width: ...)` inside component styles for anything layout-related — container queries make the component more reusable across different layout contexts.

## Next Steps

- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — expose responsive style hooks to consumers
- [Animations and Transitions](/components-guide/styling/animations/) — motion that respects user preferences
- [Design Tokens](/components-guide/styling/tokens/) — spacing and typography scale reference
