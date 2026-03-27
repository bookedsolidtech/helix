---
title: Rendering Performance
description: Write efficient HELiX component render methods using Lit's diffing, keyed lists, and directives that skip unnecessary work.
---

Lit's rendering is already fast by default — it only updates the DOM nodes that changed between renders. But there are authoring patterns that make things faster, and anti-patterns that silently defeat Lit's optimizations. This page covers both.

## How Lit Diffing Works

Lit's `html` tagged template literal compiles to a template definition at module load time. At runtime, Lit creates the DOM once from the template, then on subsequent renders only patches the parts of the DOM that contain dynamic expressions. Static HTML is never re-parsed or re-created.

```typescript
override render() {
  return html`
    <!-- This span is static — never touched after first render -->
    <span class="label">Name:</span>
    <!-- Only this text node is updated when this.name changes -->
    <span class="value">${this.name}</span>
  `;
}
```

This means `render()` can be called frequently — the DOM work is proportional to what changed, not the template size.

## `repeat` Directive for Keyed Lists

When rendering lists, Lit's default behavior associates each rendered item with its index. Adding an item at the start of a list causes Lit to re-render every existing item to match the new indices.

The `repeat` directive uses a key function to associate rendered nodes with their data identity. When items are reordered or an item is inserted, Lit moves the existing DOM nodes rather than destroying and recreating them:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helixui/tokens/lit';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

@customElement('hx-task-list')
export class HelixTaskList extends LitElement {
  static override styles = [tokenStyles];

  @property({ attribute: false })
  tasks: Task[] = [];

  override render(): TemplateResult {
    return html`
      <ul class="task-list">
        ${repeat(
          this.tasks,
          (task) => task.id, // key function — must return a unique stable value
          (task) => html`
            <li class="task-item ${task.completed ? 'task-item--done' : ''}">
              ${task.title}
            </li>
          `,
        )}
      </ul>
    `;
  }
}
```

Use `repeat` when:
- Items have stable unique IDs.
- The list is long (> ~100 items) and frequently reordered.
- Items have expensive child components that should not be destroyed on reorder.

For short static lists, `Array.map()` is fine and has less overhead.

## Avoid Creating Objects in `render()`

Every call to `render()` creates new instances of objects and functions in the template. Lit's efficient diffing handles this for template expressions, but creating large objects inside `render()` still wastes GC pressure and prevents referential stability checks from working:

```typescript
// Inefficient — new style object created every render cycle
override render() {
  return html`
    <div style=${styleMap({ color: this.color, padding: this.padding })}>
  `;
}

// Efficient — computed in willUpdate, stable reference
@state()
private _styles: Record<string, string> = {};

override willUpdate(changed: PropertyValues<this>): void {
  if (changed.has('color') || changed.has('padding')) {
    this._styles = { color: this.color, padding: this.padding };
  }
}

override render() {
  return html`<div style=${styleMap(this._styles)}>`;
}
```

The same applies to arrays and event handler callbacks passed to child components — create them once in `willUpdate()` or as class fields, not inline in `render()`.

## `guard` Directive — Skip Re-Renders

The `guard` directive takes a list of dependencies and a template factory. It only re-evaluates the template factory when a dependency changes (by strict equality):

```typescript
import { guard } from 'lit/directives/guard.js';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-expensive-chart')
export class HelixExpensiveChart extends LitElement {
  static override styles = [tokenStyles];

  @property({ attribute: false })
  data: number[] = [];

  @property({ type: String })
  theme: 'light' | 'dark' = 'light';

  override render() {
    return html`
      <div class="chart-wrapper">
        <!--
          Only re-renders the chart SVG when this.data reference changes.
          theme changes do NOT trigger a chart re-render.
        -->
        ${guard([this.data], () => html`
          <svg class="chart">
            <!-- expensive path calculations based on this.data -->
            ${this.data.map(
              (val, i) => html`<rect x=${i * 10} height=${val}></rect>`,
            )}
          </svg>
        `)}
        <div class="chart-overlay theme--${this.theme}"></div>
      </div>
    `;
  }
}
```

`guard` is most useful when a subtree is expensive to render and you can guarantee it only needs to change based on a subset of the component's reactive state.

## `live` Directive for Form Inputs

By default, Lit does not update a property that is already set in the DOM — this prevents fighting with user input. The `live` directive forces Lit to always sync the DOM attribute/property to the current template value:

```typescript
import { live } from 'lit/directives/live.js';

override render() {
  // Without live: if the user has typed in the input, setting value= won't override it
  // With live: the input value is always synced to this.value
  return html`
    <input
      type="text"
      .value=${live(this.value)}
      @input=${this._handleInput}
    />
  `;
}
```

Use `live` when your component owns the value and programmatic changes must always be reflected (e.g., a controlled input in a form component).

## `cache` Directive for Conditional Templates

When toggling between two complex templates, the default behavior destroys the inactive template's DOM and recreates it on each toggle. The `cache` directive keeps both templates in memory, only hiding the inactive one:

```typescript
import { cache } from 'lit/directives/cache.js';

@customElement('hx-view-switcher')
export class HelixViewSwitcher extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  view: 'list' | 'grid' = 'list';

  override render() {
    return html`
      ${cache(
        this.view === 'list'
          ? html`<hx-list-view></hx-list-view>`
          : html`<hx-grid-view></hx-grid-view>`,
      )}
    `;
  }
}
```

`cache` is beneficial when the hidden template contains stateful components (form inputs, video players) that should retain their state across toggles, or when the cost of recreating the DOM is significant.

## Avoid Expensive Computations in `render()`

Move derived values to `willUpdate()` so they only recompute when relevant properties change:

```typescript
@customElement('hx-data-summary')
export class HelixDataSummary extends LitElement {
  static override styles = [tokenStyles];

  @property({ attribute: false })
  items: number[] = [];

  // Computed once per items change, not every render
  @state()
  private _stats: { min: number; max: number; avg: number } = { min: 0, max: 0, avg: 0 };

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('items') && this.items.length > 0) {
      const sorted = [...this.items].sort((a, b) => a - b);
      this._stats = {
        min: sorted[0]!,
        max: sorted[sorted.length - 1]!,
        avg: this.items.reduce((sum, v) => sum + v, 0) / this.items.length,
      };
    }
  }

  override render() {
    // Only reads _stats — no computation here
    return html`
      <dl class="stats">
        <dt>Min</dt><dd>${this._stats.min}</dd>
        <dt>Max</dt><dd>${this._stats.max}</dd>
        <dt>Avg</dt><dd>${this._stats.avg.toFixed(1)}</dd>
      </dl>
    `;
  }
}
```

## Next Steps

- [Lazy Loading Components](/components-guide/performance/lazy-loading/) — defer non-critical component code
- [Bundle Size Optimization](/components-guide/performance/bundle-size/) — tree-shaking and granular imports
- [Server-Side Rendering](/components-guide/performance/ssr/) — SSR constraints and hydration
