---
title: Built-in Directives Catalog
description: Comprehensive guide to Lit's built-in directives including classMap, styleMap, ifDefined, live, repeat, map, range, when, choose, cache, and guard — declarative tools for efficient template rendering.
sidebar:
  order: 6
---

Directives are specialized functions that customize how Lit renders template expressions. Unlike ordinary values that simply render to the DOM, directives control rendering behavior, manage DOM updates, optimize performance, and provide declarative patterns for common template operations.

Lit's built-in directives solve specific rendering challenges: managing CSS classes, synchronizing form inputs, rendering conditional content, iterating over lists, caching expensive computations, and more. Each directive is tree-shakeable—only the directives you import are included in your bundle.

This guide covers all built-in Lit directives, their use cases, performance characteristics, and practical examples from the hx-2026 component library.

## What Are Directives?

Directives are functions that return special objects implementing Lit's `Directive` interface. They execute during the template rendering cycle and can:

- **Control DOM updates**: Decide when and how to update elements
- **Manage state**: Maintain state across renders
- **Access the DOM**: Read and manipulate rendered elements
- **Optimize performance**: Prevent unnecessary work through caching and diffing

### Importing Directives

Each directive is a separate module within the `lit/directives` package. Import only what you need:

```typescript
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
```

Directives are used directly in template expressions:

```typescript
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

render() {
  const classes = { active: this.active, disabled: this.disabled };
  return html`<div class=${classMap(classes)}>Content</div>`;
}
```

## Directive Categories

Lit's built-in directives fall into seven categories:

| Category           | Directives                                   | Purpose                                        |
| ------------------ | -------------------------------------------- | ---------------------------------------------- |
| **Styling**        | `classMap`, `styleMap`                       | Dynamic CSS classes and inline styles          |
| **Attributes**     | `ifDefined`, `live`                          | Conditional attributes and DOM synchronization |
| **Lists**          | `repeat`, `map`, `range`, `join`             | Efficient iteration and list rendering         |
| **Conditionals**   | `when`, `choose`                             | Lazy conditional rendering                     |
| **Caching**        | `cache`, `guard`                             | Template caching and performance optimization  |
| **Special Values** | `unsafeHTML`, `unsafeSVG`, `templateContent` | Parsing HTML/SVG and embedding templates       |
| **DOM References** | `ref`, `createRef`                           | Imperative element access                      |
| **Async**          | `until`, `asyncAppend`, `asyncReplace`       | Asynchronous content rendering                 |

---

## Styling Directives

### classMap

The `classMap` directive dynamically applies CSS classes based on an object where keys are class names and values are booleans. Classes with truthy values are applied; falsy values are removed.

#### Syntax

```typescript
import { classMap } from 'lit/directives/class-map.js';

const classes = {
  'class-name': boolean,
  'another-class': boolean,
};

html`<div class=${classMap(classes)}></div>`;
```

#### Example: hx-button Component

The `hx-button` component uses `classMap` to apply variant, size, and state classes:

```typescript
// packages/hx-library/src/components/hx-button/hx-button.ts
import { classMap } from 'lit/directives/class-map.js';

override render() {
  const classes = {
    button: true,
    [`button--${this.variant}`]: true,
    [`button--${this.size}`]: true,
    'button--loading': this.loading,
    'button--disabled': this.disabled,
  };

  return html`
    <button part="button" class=${classMap(classes)}>
      <slot></slot>
    </button>
  `;
}
```

**Output examples:**

```html
<!-- Default -->
<button class="button button--primary button--medium">Click me</button>

<!-- With loading state -->
<button class="button button--primary button--medium button--loading">Saving...</button>

<!-- Disabled -->
<button class="button button--secondary button--small button--disabled">Cancel</button>
```

#### Combining with Static Classes

The `classMap` directive must be the **only** expression in the `class` attribute, but you can combine it with static classes using multiple approaches:

**Option 1: Include static classes in the map:**

```typescript
const classes = {
  'static-class': true, // Always applied
  'dynamic-class': this.condition,
};

html`<div class=${classMap(classes)}></div>`;
```

**Option 2: Use string concatenation:**

```typescript
html`<div class="static-class ${classMap({ 'dynamic-class': this.condition })}"></div>`;
```

#### Performance Characteristics

`classMap` uses the native `classList` API for efficient class management:

- **Adds classes** when values become truthy
- **Removes classes** when values become falsy
- **Only updates changed classes** (doesn't replace entire class list)
- **Maintains static classes** not managed by the directive

#### When to Use

Use `classMap` when:

- Component has multiple state-dependent classes
- Classes change based on reactive properties
- You need readable, maintainable class logic
- You want to avoid manual string concatenation

**Don't use** for:

- Single static class: `html`<div class="static">\`` is cleaner
- Simple ternary: `html`<div class="${this.active ? 'active' : ''}">\`` is simpler

---

### styleMap

The `styleMap` directive applies inline styles dynamically through an object interface. Style properties with `undefined` or `null` values are removed from the element.

#### Syntax

```typescript
import { styleMap } from 'lit/directives/style-map.js';

const styles = {
  color: 'red',
  fontSize: '16px',
  '--custom-prop': 'value',
};

html`<div style=${styleMap(styles)}></div>`;
```

#### CSS Property Formats

`styleMap` accepts three property name formats:

**Camel-case (recommended):**

```typescript
const styles = {
  backgroundColor: 'blue',
  fontSize: '14px',
  fontWeight: 'bold',
};
```

**Dash-case (quoted):**

```typescript
const styles = {
  'background-color': 'blue',
  'font-size': '14px',
  'font-weight': 'bold',
};
```

**CSS custom properties:**

```typescript
const styles = {
  '--hx-color-primary': '#007bff',
  '--hx-spacing-md': '16px',
};
```

#### Example: Dynamic Progress Bar

```typescript
@customElement('hx-progress')
class HxProgress extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: String })
  color = 'var(--hx-color-primary)';

  override render() {
    const styles = {
      width: `${this.value}%`,
      backgroundColor: this.color,
      transition: 'width 0.3s ease',
    };

    return html`
      <div class="progress">
        <div class="progress__bar" style=${styleMap(styles)}></div>
      </div>
    `;
  }
}
```

#### Removing Styles

Set properties to `undefined` or `null` to remove them:

```typescript
const styles = {
  color: this.error ? 'red' : undefined, // Removes 'color' when no error
  fontWeight: this.bold ? 'bold' : null, // Removes 'font-weight' when not bold
};
```

#### Performance and Best Practices

**Rule:** `styleMap` must be the **only** expression in the `style` attribute.

```typescript
// ✓ Correct
html`<div style=${styleMap(styles)}></div>`;

// ✗ Wrong: multiple expressions
html`<div style="color: red; ${styleMap(styles)}"></div>`;
```

**When to use `styleMap`:**

- Styles computed from reactive properties
- Multiple related style properties
- Dynamic theming or customization
- CSS custom properties need runtime updates

**When to avoid:**

- Prefer CSS classes for static styles
- Use design tokens instead of hardcoded values
- Avoid for styles that should be in component stylesheets

#### Example: Dynamic Tooltip Positioning

```typescript
@customElement('hx-tooltip')
class HxTooltip extends LitElement {
  @state()
  private _position = { top: 0, left: 0 };

  override render() {
    const styles = {
      position: 'absolute',
      top: `${this._position.top}px`,
      left: `${this._position.left}px`,
      zIndex: '1000',
    };

    return html`
      <div class="tooltip" style=${styleMap(styles)}>
        <slot></slot>
      </div>
    `;
  }

  private _updatePosition(targetEl: HTMLElement): void {
    const rect = targetEl.getBoundingClientRect();
    this._position = {
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    };
  }
}
```

---

## Attribute Directives

### ifDefined

The `ifDefined` directive conditionally sets an attribute based on whether a value is defined. If the value is `undefined`, the attribute is removed; otherwise, it's set to the value.

#### Syntax

```typescript
import { ifDefined } from 'lit/directives/if-defined.js';

html`<input name=${ifDefined(this.name || undefined)} />`;
```

#### Use Case: Optional Attributes

HTML attributes should be omitted entirely when not needed, not set to empty strings or `"undefined"`:

```typescript
// ✗ Wrong: Sets invalid href
html`<a href=${this.url}>Link</a>`;
// Output when url is undefined: <a href="undefined">Link</a>

// ✓ Correct: Removes href when undefined
html`<a href=${ifDefined(this.url)}>Link</a>`;
// Output when url is undefined: <a>Link</a>
```

#### Example: hx-text-input Component

The `hx-text-input` component uses `ifDefined` for optional form attributes:

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.ts
override render() {
  return html`
    <input
      part="input"
      type=${this.type}
      name=${ifDefined(this.name || undefined)}
      placeholder=${ifDefined(this.placeholder || undefined)}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-describedby=${ifDefined(this._describedBy || undefined)}
    />
  `;
}
```

**Behavior:**

- If `name` is `""` or `undefined`, no `name` attribute renders
- If `name` is `"email"`, renders `name="email"`

#### Common Pattern: Coalescing to Undefined

Use logical OR to coerce empty strings to `undefined`:

```typescript
// Empty string becomes undefined
name=${ifDefined(this.name || undefined)}

// Nullish coalescing (only null/undefined)
aria-label=${ifDefined(this.ariaLabel ?? undefined)}
```

#### Combining with Boolean Attributes

Don't use `ifDefined` with boolean attributes—use the `?` prefix instead:

```typescript
// ✗ Wrong: ifDefined not needed for boolean
?disabled=${ifDefined(this.disabled)}

// ✓ Correct: Boolean attribute binding
?disabled=${this.disabled}
```

#### When to Use

Use `ifDefined` when:

- Attribute should be absent (not empty) when value is missing
- Form fields have optional `name`, `placeholder`, `pattern` attributes
- Links have optional `href`, `target`, `rel` attributes
- ARIA attributes should only exist when meaningful

---

### live

The `live` directive ensures property bindings update based on the **live DOM value** rather than the last rendered value. This is critical for form inputs where external code may modify values directly.

#### The Problem: Desynchronization

Lit's default behavior compares new property values against the **last set value**, not the actual DOM value. If something modifies the DOM directly (user input, browser autocomplete, external scripts), Lit may not detect changes:

```typescript
// Without live directive
html`<input .value=${this.value} />`;

// User types "hello" → Lit doesn't know about change
// Component sets value to "hello" → Lit thinks no update needed
// Result: Input value doesn't update!
```

#### Syntax

```typescript
import { live } from 'lit/directives/live.js';

html`<input .value=${live(this.value)} />`;
```

The `live` directive:

1. Reads the **current DOM property value**
2. Compares it to the new value
3. Only updates if they differ

#### Example: hx-text-input Component

All form inputs in hx-2026 use `live` for proper synchronization:

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.ts
import { live } from 'lit/directives/live.js';

override render() {
  return html`
    <input
      part="input"
      .value=${live(this.value)}
      @input=${this._handleInput}
    />
  `;
}

private _handleInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  this.value = input.value; // Updates property
}
```

**Flow:**

1. User types "a" → `input` event fires
2. `_handleInput` sets `this.value = "a"`
3. Component re-renders with `.value=${live("a")}`
4. `live` checks actual DOM value (already "a")
5. `live` sees they match, skips update
6. No cursor position issues

#### When to Use

Use `live` for:

- **Text inputs**: `<input type="text">`, `<input type="email">`, `<textarea>`
- **Checkboxes/radios**: `.checked` property bindings
- **Select menus**: `.value` property bindings
- **contenteditable elements**: Any element with `contenteditable="true"`

**Required for:**

- Two-way binding patterns
- Form inputs with `@input` or `@change` handlers
- Any scenario where DOM values change outside Lit's control

#### Performance Considerations

`live` performs a DOM read on every render, which has a small performance cost. However, this cost is negligible for form inputs and prevents serious bugs.

**Warning:** `live` uses strict equality (`===`). If you convert types in event handlers, ensure consistency:

```typescript
// ✓ Correct: Both strings
.value=${live(String(this.count))}

// ✗ Wrong: Type mismatch (number vs. string)
.value=${live(this.count)} // count is number, DOM value is string
```

#### Example: hx-checkbox Component

```typescript
// packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts
override render() {
  return html`
    <input
      type="checkbox"
      .checked=${live(this.checked)}
      .indeterminate=${live(this.indeterminate)}
      @change=${this._handleChange}
    />
  `;
}
```

---

## List Rendering Directives

### repeat

The `repeat` directive renders iterables with optional keying for DOM stability. When items reorder or update, `repeat` maintains the association between data and DOM nodes, preserving element state and improving performance.

#### Syntax

```typescript
import { repeat } from 'lit/directives/repeat.js';

html`
  ${repeat(
    items, // Iterable data
    (item) => item.id, // Key function (optional)
    (item, index) => template, // Template function
  )}
`;
```

#### Without Keys (Simple Iteration)

If you omit the key function, `repeat` behaves like `map`:

```typescript
html`
  <ul>
    ${repeat(this.items, (item) => html`<li>${item.name}</li>`)}
  </ul>
`;
```

#### With Keys (DOM Stability)

Provide a key function to maintain DOM node identity across reorders:

```typescript
html`
  <ul>
    ${repeat(
      this.items,
      (item) => item.id, // Unique key
      (item) => html`<li>${item.name}</li>`,
    )}
  </ul>
`;
```

**What keys do:**

- **Preserve DOM nodes**: When item with `id: 5` moves from index 2 to index 0, its DOM node physically moves
- **Maintain state**: Input focus, scroll position, and component state persist
- **Improve performance**: Lit reorders existing nodes instead of destroying and recreating

#### Example: Sortable Task List

```typescript
@customElement('hx-task-list')
class HxTaskList extends LitElement {
  @property({ type: Array })
  tasks: Array<{ id: string; title: string; completed: boolean }> = [];

  override render() {
    return html`
      <ul>
        ${repeat(
          this.tasks,
          (task) => task.id,
          (task) => html`
            <li>
              <input
                type="checkbox"
                .checked=${task.completed}
                @change=${(e: Event) => this._toggleTask(task.id, e)}
              />
              <span>${task.title}</span>
            </li>
          `,
        )}
      </ul>
    `;
  }

  private _toggleTask(id: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, completed: checked } : t));
  }
}
```

**Why this works:**

When tasks reorder (e.g., by completed status), the checkbox elements move with their data. Checked state persists because the same `<input>` element is reused.

#### Key Function Requirements

Keys must be:

- **Unique**: No two items should share the same key
- **Stable**: Same item should always return the same key
- **Primitive**: Strings, numbers, or symbols (not objects)

```typescript
// ✓ Good keys
(item) => item.id
(item) => item.uuid
(item) => `${item.type}-${item.id}`

// ✗ Bad keys
(item) => item              // Object reference (not primitive)
(item) => Math.random()     // Not stable
(item) => item.name         // Not unique
```

#### Using Index as Parameter

The template function receives both item and index:

```typescript
${repeat(
  this.items,
  (item) => item.id,
  (item, index) => html`
    <li>
      <span class="index">${index + 1}.</span>
      <span class="name">${item.name}</span>
    </li>
  `
)}
```

#### Performance: repeat vs. map

| Scenario                        | Use `repeat` | Use `map`      |
| ------------------------------- | ------------ | -------------- |
| Items frequently reorder        | Yes          | No             |
| Items contain stateful elements | Yes          | No             |
| Simple static lists             | No           | Yes            |
| List never changes order        | No           | Yes            |
| Performance critical            | Depends      | Usually faster |

**map is lighter and faster** when you don't need DOM stability. Use `repeat` only when keying provides value.

---

### map

The `map` directive transforms iterables into template results. It's simpler and faster than `repeat` but doesn't provide DOM stability across data changes.

#### Syntax

```typescript
import { map } from 'lit/directives/map.js';

html` ${map(items, (item, index) => template)} `;
```

#### Example: Simple List

```typescript
@customElement('hx-menu')
class HxMenu extends LitElement {
  @property({ type: Array })
  items: Array<{ label: string; href: string }> = [];

  override render() {
    return html`
      <nav>${map(this.items, (item) => html`<a href=${item.href}>${item.label}</a>`)}</nav>
    `;
  }
}
```

#### Comparison with Array.map()

The `map` directive is nearly identical to JavaScript's `Array.prototype.map()`:

```typescript
// Using map directive
${map(items, (item) => html`<li>${item}</li>`)}

// Using Array.map (equivalent)
${items.map(item => html`<li>${item}</li>`)}
```

**Why use the directive?**

- **Works with iterables**: Not just arrays (Sets, Maps, generators)
- **Consistent API**: Matches other Lit directives
- **Explicit intent**: Signals template transformation

#### Example: Rendering a Set

```typescript
@property({ type: Object })
tags = new Set(['urgent', 'bug', 'frontend']);

override render() {
  return html`
    <div class="tags">
      ${map(this.tags, (tag) => html`<span class="tag">${tag}</span>`)}
    </div>
  `;
}
```

#### When to Use

Use `map` when:

- Rendering static or append-only lists
- List order never changes
- Items don't contain stateful elements (inputs, custom components with internal state)
- Performance is critical (lighter than `repeat`)

Use `repeat` when:

- List items reorder frequently
- Items contain form inputs or stateful components
- You need to preserve DOM element identity

---

### range

The `range` directive generates numeric sequences for iteration, similar to Python's `range()` function.

#### Syntax

```typescript
import { range } from 'lit/directives/range.js';

// range(end)
range(5); // → [0, 1, 2, 3, 4]

// range(start, end)
range(2, 6); // → [2, 3, 4, 5]

// range(start, end, step)
range(0, 10, 2); // → [0, 2, 4, 6, 8]
```

#### Example: Pagination

```typescript
@customElement('hx-pagination')
class HxPagination extends LitElement {
  @property({ type: Number })
  total = 10;

  @property({ type: Number })
  current = 1;

  override render() {
    return html`
      <nav class="pagination">
        ${map(
          range(1, this.total + 1),
          (page) => html`
            <button
              class=${classMap({ active: page === this.current })}
              @click=${() => this._goToPage(page)}
            >
              ${page}
            </button>
          `,
        )}
      </nav>
    `;
  }
}
```

#### Example: Star Rating

```typescript
@customElement('hx-rating')
class HxRating extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 5;

  override render() {
    return html`
      <div class="rating">
        ${map(
          range(this.max),
          (i) => html` <span class=${classMap({ filled: i < this.value })}>★</span> `,
        )}
      </div>
    `;
  }
}
```

#### Use Cases

- Generating numbered lists
- Rendering pagination controls
- Creating grid layouts with fixed dimensions
- Iterating a specific number of times

---

### join

The `join` directive interleaves iterable values with separator content, similar to `Array.join()` but for templates.

#### Syntax

```typescript
import { join } from 'lit/directives/join.js';

// Static separator
html`${join(items, html`<hr />`)}`;

// Function separator (receives item index)
html`${join(items, (index) => html`<span class="sep">${index}</span>`)}`;
```

#### Example: Breadcrumbs

```typescript
@customElement('hx-breadcrumbs')
class HxBreadcrumbs extends LitElement {
  @property({ type: Array })
  items: Array<{ label: string; href: string }> = [];

  override render() {
    return html`
      <nav class="breadcrumbs">
        ${join(
          map(this.items, (item) => html`<a href=${item.href}>${item.label}</a>`),
          html`<span class="separator">/</span>`,
        )}
      </nav>
    `;
  }
}
```

**Output:**

```html
<nav class="breadcrumbs">
  <a href="/home">Home</a>
  <span class="separator">/</span>
  <a href="/products">Products</a>
  <span class="separator">/</span>
  <a href="/shoes">Shoes</a>
</nav>
```

#### Example: Tag List with Commas

```typescript
override render() {
  const tags = ['JavaScript', 'Lit', 'Web Components'];

  return html`
    <div class="tags">
      ${join(
        tags.map(tag => html`<span class="tag">${tag}</span>`),
        html`, `
      )}
    </div>
  `;
}
```

**Output:**

```
JavaScript, Lit, Web Components
```

---

## Conditional Rendering Directives

### when

The `when` directive renders one of two templates based on a condition. Unlike ternary operators, `when` evaluates templates **lazily**—the non-selected branch never executes.

#### Syntax

```typescript
import { when } from 'lit/directives/when.js';

html`
  ${when(
    condition,
    () => trueTemplate,
    () => falseTemplate, // Optional
  )}
`;
```

#### Example: Lazy Loading Indicator

```typescript
@customElement('hx-data-table')
class HxDataTable extends LitElement {
  @state()
  private _loading = false;

  @state()
  private _data: any[] = [];

  override render() {
    return html`
      ${when(
        this._loading,
        () => html`
          <div class="loading">
            <hx-spinner></hx-spinner>
            <p>Loading data...</p>
          </div>
        `,
        () => html`
          <table>
            ${map(this._data, (row) => this._renderRow(row))}
          </table>
        `,
      )}
    `;
  }
}
```

#### Lazy Evaluation Benefits

The key advantage of `when` is that unused branches **never execute**:

```typescript
// ✓ Lazy: _renderExpensiveView() only runs when condition is true
${when(
  this.showExpensiveView,
  () => this._renderExpensiveView(),
  () => html`<p>Simple view</p>`
)}

// ✗ Eager: Both branches execute every render
${this.showExpensiveView
  ? this._renderExpensiveView()
  : html`<p>Simple view</p>`
}
```

#### When to Use vs. Ternary

**Use `when` for:**

- Expensive template computations
- Templates that shouldn't execute unless needed
- Cleaner syntax than nested ternaries

**Use ternary for:**

- Simple, cheap expressions
- Inline value selection
- When both branches are already computed

```typescript
// Simple value: ternary is fine
html`<p>${this.active ? 'Active' : 'Inactive'}</p>`

// Complex template: use when
${when(
  this.showDetails,
  () => this._renderDetailedView(),
  () => html`<button @click=${this._showDetails}>Show Details</button>`
)}
```

---

### choose

The `choose` directive selects a template from multiple options based on value matching, similar to a `switch` statement.

#### Syntax

```typescript
import { choose } from 'lit/directives/choose.js';

html`
  ${choose(
    value,
    [
      [caseValue1, () => template1],
      [caseValue2, () => template2],
    ],
    () => defaultTemplate,
  )}
`;
```

#### Example: View Mode Switcher

```typescript
@customElement('hx-product-grid')
class HxProductGrid extends LitElement {
  @property({ type: String })
  viewMode: 'grid' | 'list' | 'compact' = 'grid';

  @property({ type: Array })
  products: Product[] = [];

  override render() {
    return html`
      <div class="controls">
        <button @click=${() => (this.viewMode = 'grid')}>Grid</button>
        <button @click=${() => (this.viewMode = 'list')}>List</button>
        <button @click=${() => (this.viewMode = 'compact')}>Compact</button>
      </div>

      ${choose(
        this.viewMode,
        [
          ['grid', () => this._renderGrid()],
          ['list', () => this._renderList()],
          ['compact', () => this._renderCompact()],
        ],
        () => html`<p>Unknown view mode</p>`,
      )}
    `;
  }

  private _renderGrid() {
    return html`
      <div class="grid">
        ${map(
          this.products,
          (p) => html`
            <hx-card>
              <img slot="image" src=${p.image} alt=${p.name} />
              <h3 slot="heading">${p.name}</h3>
              <p>${p.price}</p>
            </hx-card>
          `,
        )}
      </div>
    `;
  }

  private _renderList() {
    return html`
      <ul class="list">
        ${map(this.products, (p) => html` <li><strong>${p.name}</strong> - ${p.price}</li> `)}
      </ul>
    `;
  }

  private _renderCompact() {
    return html`
      <div class="compact">${map(this.products, (p) => html`<span>${p.name}</span>`)}</div>
    `;
  }
}
```

#### Matching Behavior

`choose` uses **strict equality** (`===`) for matching:

```typescript
// ✓ Matches: both numbers
choose(this.count, [
  [0, () => html`None`],
  [1, () => html`One`],
]);

// ✗ Doesn't match: '0' (string) !== 0 (number)
choose('0', [
  [0, () => html`Zero`], // Won't match
]);
```

#### When to Use vs. if/else

**Use `choose` for:**

- Multiple distinct cases (3+)
- Value-based routing between templates
- Cleaner than chained ternaries

**Use if/else for:**

- Two cases (ternary is simpler)
- Complex boolean conditions
- When you need non-equality comparisons

---

## Caching and Performance Directives

### cache

The `cache` directive preserves DOM nodes for templates that aren't currently rendered. When switching between templates, previously rendered DOM is restored instead of recreated.

#### Syntax

```typescript
import { cache } from 'lit/directives/cache.js';

html` ${cache(this.view === 'view1' ? template1 : template2)} `;
```

#### Example: Tab Panel

```typescript
@customElement('hx-tabs')
class HxTabs extends LitElement {
  @property({ type: String })
  activeTab = 'details';

  override render() {
    return html`
      <div class="tabs">
        <button @click=${() => (this.activeTab = 'details')}>Details</button>
        <button @click=${() => (this.activeTab = 'reviews')}>Reviews</button>
        <button @click=${() => (this.activeTab = 'specs')}>Specs</button>
      </div>

      <div class="panels">
        ${cache(
          choose(this.activeTab, [
            ['details', () => this._renderDetails()],
            ['reviews', () => this._renderReviews()],
            ['specs', () => this._renderSpecs()],
          ]),
        )}
      </div>
    `;
  }
}
```

**Without `cache`:**

- Switch to "Reviews" → Destroys "Details" DOM, creates "Reviews" DOM
- Switch back to "Details" → Destroys "Reviews" DOM, recreates "Details" DOM

**With `cache`:**

- Switch to "Reviews" → Hides "Details" DOM (preserved in memory), shows "Reviews" DOM
- Switch back to "Details" → Shows existing "Details" DOM (input state, scroll position intact)

#### Memory vs. Performance Trade-off

`cache` uses more memory to improve perceived performance:

- **Memory cost**: Each cached template stores its DOM tree
- **Performance benefit**: No re-rendering expensive templates
- **State preservation**: Form inputs, scroll positions, component state persist

**When to use:**

- Switching between large/expensive templates
- Templates contain stateful content (forms, videos, iframes)
- User switches frequently between views

**When to avoid:**

- Many possible templates (high memory usage)
- Templates are cheap to re-render
- No meaningful state to preserve

#### Combining with choose

`cache` pairs perfectly with `choose` for multi-view components:

```typescript
${cache(choose(this.mode, [
  ['edit', () => this._renderEditMode()],
  ['preview', () => this._renderPreviewMode()],
  ['publish', () => this._renderPublishMode()],
]))}
```

---

### guard

The `guard` directive re-evaluates a template only when one or more dependencies change identity. This optimizes expensive computations by skipping unnecessary work.

#### Syntax

```typescript
import { guard } from 'lit/directives/guard.js';

html` ${guard([dep1, dep2], () => expensiveTemplate())} `;
```

The template function only runs when dependencies change (using strict inequality `!==`).

#### Example: Expensive Markdown Rendering

```typescript
@customElement('hx-markdown-viewer')
class HxMarkdownViewer extends LitElement {
  @property({ type: String })
  markdown = '';

  override render() {
    return html`
      <div class="markdown">${guard([this.markdown], () => this._renderMarkdown())}</div>
    `;
  }

  private _renderMarkdown() {
    // Expensive: parses markdown and sanitizes HTML
    const html = marked.parse(this.markdown);
    const sanitized = DOMPurify.sanitize(html);
    return unsafeHTML(sanitized);
  }
}
```

**Without `guard`:**

`_renderMarkdown()` runs on **every render**, even when `markdown` hasn't changed.

**With `guard`:**

`_renderMarkdown()` only runs when `this.markdown` changes.

#### Immutability Pattern

`guard` works best with immutable data patterns:

```typescript
@property({ type: Array })
items: Item[] = [];

override render() {
  return html`
    ${guard([this.items], () => this._renderExpensiveList())}
  `;
}

addItem(item: Item) {
  // ✓ Correct: Creates new array (identity changes)
  this.items = [...this.items, item];
}

updateItem(index: number, item: Item) {
  // ✗ Wrong: Mutates array (identity unchanged, guard won't trigger)
  this.items[index] = item;
  this.requestUpdate('items');
}
```

#### Multiple Dependencies

Track multiple dependencies:

```typescript
${guard([this.data, this.sortOrder, this.filters], () => (
  this._renderFilteredSortedData()
))}
```

The template re-renders only when **any** dependency changes identity.

#### When to Use

Use `guard` when:

- Template computation is expensive (parsing, sorting, filtering large datasets)
- Dependencies change infrequently
- You follow immutable data patterns
- Profiling shows rendering bottlenecks

**Don't use** for:

- Simple templates (overhead outweighs benefit)
- Mutable data patterns
- When dependencies change on every render anyway

---

### keyed

The `keyed` directive forces complete re-rendering of a template when its key changes. It destroys the old DOM and creates fresh instances, opposite of `cache` which preserves DOM.

#### Syntax

```typescript
import { keyed } from 'lit/directives/keyed.js';

html` ${keyed(uniqueKey, () => template)} `;
```

#### Example: Resetting Form on User Change

When editing different users, you want form inputs to reset completely:

```typescript
@customElement('hx-user-editor')
class HxUserEditor extends LitElement {
  @property({ type: Object })
  user: { id: string; name: string; email: string } | null = null;

  override render() {
    return html`
      <div class="editor">
        <h2>Editing User</h2>
        ${keyed(
          this.user?.id ?? 'no-user',
          () => html`
            <form>
              <input type="text" name="name" .value=${this.user?.name ?? ''} placeholder="Name" />
              <input
                type="email"
                name="email"
                .value=${this.user?.email ?? ''}
                placeholder="Email"
              />
              <button type="submit">Save</button>
            </form>
          `,
        )}
      </div>
    `;
  }
}
```

**Without `keyed`:**

- Switch from User A to User B
- Lit updates `.value` properties
- But input validation state, focus, selection persist
- Can cause bugs with dirty form tracking

**With `keyed`:**

- Switch from User A to User B
- Entire form DOM is destroyed
- New form created from scratch
- All state completely reset (validation, focus, dirty flags)

#### Example: Video Player Reset

When changing videos, you want the player to completely reset:

```typescript
@customElement('hx-video-player')
class HxVideoPlayer extends LitElement {
  @property({ type: String })
  videoUrl = '';

  override render() {
    return html`
      <div class="player">
        ${keyed(
          this.videoUrl,
          () => html`
            <video controls autoplay>
              <source src=${this.videoUrl} type="video/mp4" />
            </video>
          `,
        )}
      </div>
    `;
  }
}
```

**Why `keyed` helps:**

- Changing `videoUrl` destroys the `<video>` element
- New `<video>` element created with new source
- Ensures video loads from beginning, not current position
- Resets all video state (volume, playback rate, captions)

#### Example: Third-Party Component Reset

When integrating third-party components that maintain internal state:

```typescript
import 'third-party-date-picker';

@customElement('hx-booking-form')
class HxBookingForm extends LitElement {
  @property({ type: String })
  bookingId = '';

  override render() {
    return html`
      <div class="form">
        ${keyed(this.bookingId, () => html` <third-party-date-picker></third-party-date-picker> `)}
      </div>
    `;
  }
}
```

**Use case:**

- Third-party component has internal state that doesn't reset via properties
- `keyed` forces component recreation, ensuring clean state

#### Keyed vs. Cache

These directives have opposite purposes:

| Directive | Behavior                          | Use Case                    |
| --------- | --------------------------------- | --------------------------- |
| `keyed`   | **Destroys** DOM when key changes | Reset stateful components   |
| `cache`   | **Preserves** DOM when switching  | Maintain state across views |

```typescript
// cache: Keep form state when switching tabs
${cache(choose(this.tab, [
  ['profile', () => html`<profile-form></profile-form>`],
  ['settings', () => html`<settings-form></settings-form>`],
]))}

// keyed: Reset form when user changes
${keyed(this.userId, () => html`<user-form></user-form>`)}
```

#### When to Use

Use `keyed` when:

- Resetting complex stateful components
- Switching between distinct data entities (users, documents)
- Forcing third-party components to re-initialize
- Clearing form inputs without manual reset logic
- Reloading media elements (video, audio, iframe)
- Ensuring clean slate for components with hidden state

**Don't use** for:

- Simple property updates (use reactive properties)
- Preserving state across changes (use `cache`)
- Performance optimization (it destroys and recreates DOM)
- Static content

#### Performance Cost

`keyed` is expensive:

- **High**: Destroys entire DOM subtree
- **High**: Creates new DOM from scratch
- **High**: Loses all element state
- **High**: Re-runs connectedCallback, constructor, etc.

Use sparingly, only when complete reset is required.

#### Example: Dialog Reset

```typescript
@customElement('hx-dialog-manager')
class HxDialogManager extends LitElement {
  @property({ type: String })
  dialogId = '';

  override render() {
    return html`
      ${keyed(
        this.dialogId,
        () => html`
          <hx-dialog>
            <h2 slot="header">Dialog ${this.dialogId}</h2>
            <form>
              <!-- Complex form with validation, state machine, etc. -->
            </form>
          </hx-dialog>
        `,
      )}
    `;
  }
}
```

Each new `dialogId` creates a completely fresh dialog instance.

---

## Special Value Directives

### unsafeHTML

The `unsafeHTML` directive parses and renders HTML strings as markup. This is **dangerous** and should only be used with trusted, developer-controlled content.

#### Syntax

```typescript
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

html`<div>${unsafeHTML(this.trustedHTML)}</div>`;
```

#### Security Warning

**NEVER** use `unsafeHTML` with user-provided content. It opens the door to XSS (cross-site scripting) attacks:

```typescript
// ✗ DANGEROUS: XSS vulnerability
const userInput = '<script>alert("XSS")</script>';
html`<div>${unsafeHTML(userInput)}</div>`;
// Result: Script executes!
```

#### Safe Usage Pattern

Only use with content you control or sanitize through a trusted library like DOMPurify:

```typescript
import DOMPurify from 'dompurify';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

@customElement('hx-content')
class HxContent extends LitElement {
  @property({ type: String })
  rawHTML = '';

  override render() {
    // Sanitize before rendering
    const sanitized = DOMPurify.sanitize(this.rawHTML);
    return html`<div>${unsafeHTML(sanitized)}</div>`;
  }
}
```

#### When to Use

Valid use cases:

- Rendering CMS content (sanitized)
- Displaying markdown-converted HTML (sanitized)
- Embedding SVG or HTML from trusted sources
- Developer-controlled HTML snippets

**Prefer alternatives:**

- Use Lit templates instead of HTML strings
- Use `lit-html` to render dynamic templates
- Use `unsafeSVG` specifically for SVG content

---

### unsafeSVG

The `unsafeSVG` directive parses and renders SVG strings as markup. Like `unsafeHTML`, it's unsafe with untrusted content.

#### Syntax

```typescript
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

html`<div>${unsafeSVG(this.svgString)}</div>`;
```

#### Example: Dynamic SVG Icons

```typescript
@customElement('hx-icon')
class HxIcon extends LitElement {
  @property({ type: String })
  name = '';

  private _icons: Record<string, string> = {
    check:
      '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  };

  override render() {
    const svg = this._icons[this.name] || '';
    return html`<div class="icon">${unsafeSVG(svg)}</div>`;
  }
}
```

#### Security Considerations

Same security rules as `unsafeHTML`:

- Only use with trusted, developer-controlled SVG
- Never render user-provided SVG without sanitization
- Prefer loading SVG as external files or components

### templateContent

The `templateContent` directive renders the content of HTML `<template>` elements into the DOM. This is useful for embedding static HTML templates that are defined in the document.

#### Syntax

```typescript
import { templateContent } from 'lit/directives/template-content.js';

const templateEl = document.querySelector<HTMLTemplateElement>('#my-template');
html`${templateContent(templateEl)}`;
```

#### Example: Embedding Template Elements

```typescript
@customElement('hx-template-loader')
class HxTemplateLoader extends LitElement {
  @property({ type: String })
  templateId = '';

  override render() {
    const template = document.getElementById(this.templateId) as HTMLTemplateElement;

    if (!template) {
      return html`<p>Template not found: ${this.templateId}</p>`;
    }

    return html` <div class="template-container">${templateContent(template)}</div> `;
  }
}
```

**HTML usage:**

```html
<template id="user-card-template">
  <div class="user-card">
    <h3>Default User</h3>
    <p>This is template content</p>
  </div>
</template>

<hx-template-loader template-id="user-card-template"></hx-template-loader>
```

#### Security Considerations

**CRITICAL**: Only use `templateContent` with developer-controlled templates. Never use it with user-provided content, as it can lead to XSS vulnerabilities similar to `unsafeHTML`.

```typescript
// ✓ Safe: Developer-controlled template
const template = document.getElementById('known-template');
html`${templateContent(template)}`;

// ✗ DANGEROUS: User-controlled template ID
const userTemplateId = getUserInput(); // Could reference malicious template
const template = document.getElementById(userTemplateId);
html`${templateContent(template)}`; // XSS risk!
```

#### When to Use

Valid use cases:

- Embedding static HTML defined in index.html
- Server-rendered templates loaded once
- Reusable HTML snippets that don't need JavaScript logic
- Integration with server-side template systems

**Prefer alternatives:**

- Use Lit templates for dynamic content
- Use Web Components for reusable UI patterns
- Avoid for content that needs reactivity

---

## DOM Reference Directives

### ref

The `ref` directive provides imperative access to rendered DOM elements. It's an alternative to `@query()` decorators for functional or dynamic element access.

#### Syntax with createRef

```typescript
import { ref, createRef, Ref } from 'lit/directives/ref.js';

class MyElement extends LitElement {
  private _inputRef: Ref<HTMLInputElement> = createRef();

  override render() {
    return html`<input ${ref(this._inputRef)} />`;
  }

  focus() {
    this._inputRef.value?.focus();
  }
}
```

#### Accessing Referenced Elements

The `Ref` object has a `value` property that holds the element reference (or `undefined` if not yet rendered):

```typescript
private _buttonRef: Ref<HTMLButtonElement> = createRef();

override render() {
  return html`<button ${ref(this._buttonRef)}>Click</button>`;
}

override firstUpdated() {
  // Access element after first render
  if (this._buttonRef.value) {
    this._buttonRef.value.addEventListener('special-event', this._handler);
  }
}
```

#### Callback Syntax

For more control, use a callback function instead of `createRef()`:

```typescript
override render() {
  return html`
    <input ${ref((el?: Element) => {
      if (el) {
        // Element rendered or moved
        (el as HTMLInputElement).focus();
        console.log('Input element:', el);
      } else {
        // Element removed from DOM
        console.log('Input removed');
      }
    })}>
  `;
}
```

**Callback behavior:**

- Called with element when it renders
- Called with element when it moves in DOM
- Called with `undefined` when element is removed

#### Example: Canvas Drawing Context

```typescript
@customElement('hx-canvas')
class HxCanvas extends LitElement {
  private _canvasRef: Ref<HTMLCanvasElement> = createRef();

  override render() {
    return html`<canvas ${ref(this._canvasRef)} width="400" height="300"></canvas>`;
  }

  override firstUpdated() {
    const canvas = this._canvasRef.value;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this._drawContent(ctx);
      }
    }
  }

  private _drawContent(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'blue';
    ctx.fillRect(10, 10, 100, 100);
  }
}
```

#### Example: Measuring Element Dimensions

```typescript
@customElement('hx-resizable')
class HxResizable extends LitElement {
  private _containerRef: Ref<HTMLDivElement> = createRef();

  @state()
  private _dimensions = { width: 0, height: 0 };

  override render() {
    return html`
      <div ${ref(this._containerRef)} class="container">
        <p>Width: ${this._dimensions.width}px</p>
        <p>Height: ${this._dimensions.height}px</p>
        <slot></slot>
      </div>
    `;
  }

  override updated() {
    if (this._containerRef.value) {
      const { width, height } = this._containerRef.value.getBoundingClientRect();
      this._dimensions = { width, height };
    }
  }
}
```

#### When to Use vs. @query

**Use `ref` for:**

- Dynamic element references that may or may not exist
- Conditional elements (rendered based on state)
- Multiple elements with same selector
- Functional component patterns
- Elements created in repeated templates
- When you need lifecycle hooks (element added/removed)

**Use `@query` for:**

- Static element references that always exist
- Class-based components with fixed structure
- When decorator syntax is preferred
- Single element per unique selector
- Simpler syntax for straightforward cases

#### Example: Multiple Dynamic Refs

````typescript
@customElement('hx-image-gallery')
class HxImageGallery extends LitElement {
  @property({ type: Array })
  images: string[] = [];

  private _imageRefs = new Map<string, HTMLImageElement>();

  override render() {
    return html`
      <div class="gallery">
        ${this.images.map((src) => html`
          <img
            src=${src}
            ${ref((el?: Element) => {
              if (el) {
                this._imageRefs.set(src, el as HTMLImageElement);
              } else {
                this._imageRefs.delete(src);
              }
            })}
          >
        `)}
      </div>
    `;
  }

  getImageElement(src: string): HTMLImageElement | undefined {
    return this._imageRefs.get(src);
  }
}

---

## Asynchronous Directives

### until

The `until` directive displays fallback content while waiting for Promises to resolve, then renders the resolved value.

#### Syntax

```typescript
import { until } from 'lit/directives/until.js';

html`
  ${until(
    fetch('/api/data').then(r => r.json()).then(data => html`<div>${data}</div>`),
    html`<div>Loading...</div>`
  )}
`;
````

#### Example: Async Data Loading

```typescript
@customElement('hx-user-profile')
class HxUserProfile extends LitElement {
  @property({ type: String })
  userId = '';

  override render() {
    return html`
      <div class="profile">${until(this._loadUser(), html`<hx-spinner></hx-spinner>`)}</div>
    `;
  }

  private async _loadUser() {
    const response = await fetch(`/api/users/${this.userId}`);
    const user = await response.json();

    return html`
      <img src=${user.avatar} alt=${user.name} />
      <h2>${user.name}</h2>
      <p>${user.bio}</p>
    `;
  }
}
```

**Rendering sequence:**

1. Initial render: Shows spinner (fallback)
2. Promise resolves: Shows user profile
3. `userId` changes: Shows spinner again, then new profile

#### Multiple Fallbacks (Priority-based)

You can provide multiple arguments with decreasing priority:

```typescript
html`
  ${until(
    slowPromise, // Priority 1: Show when resolved
    fastPromise, // Priority 2: Show when resolved
    html`Loading...`, // Priority 3: Show immediately
  )}
`;
```

---

### asyncAppend and asyncReplace

These directives handle async iterables (generators, async iterators):

- **asyncAppend**: Accumulates values (appends each yielded value)
- **asyncReplace**: Shows only the latest value (replaces previous value)

#### Example: Real-time Log Stream

```typescript
import { asyncAppend } from 'lit/directives/async-append.js';

@customElement('hx-log-viewer')
class HxLogViewer extends LitElement {
  override render() {
    return html`
      <ul>
        ${asyncAppend(this._streamLogs(), (log) => html`<li>${log}</li>`)}
      </ul>
    `;
  }

  private async *_streamLogs() {
    const response = await fetch('/api/logs/stream');
    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield new TextDecoder().decode(value);
    }
  }
}
```

---

## Performance Best Practices

### Bundle Size Optimization

Import only the directives you use:

```typescript
// ✓ Good: Tree-shakeable
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

// ✗ Bad: Imports all directives
import * as directives from 'lit/directives.js';
```

### Avoid Overuse

Don't use directives where simple expressions suffice:

```typescript
// ✗ Overkill: Simple ternary is cleaner
${when(this.show, () => html`<div>Content</div>`)}

// ✓ Better: Use ternary
${this.show ? html`<div>Content</div>` : nothing}
```

### Combine Directives Wisely

Some directives work well together:

```typescript
// cache + choose: Preserve DOM when switching views
${cache(choose(this.view, [...]))}

// guard + repeat: Optimize expensive lists
${guard([this.items], () => repeat(this.items, ...))}

// when + until: Lazy async rendering
${when(this.enabled, () => until(this._load(), html`Loading...`))}
```

### Use map for Simple Lists

`repeat` has overhead—use `map` or plain `Array.map()` for simple lists:

```typescript
// ✓ Fast: No keying needed
${this.items.map(item => html`<li>${item}</li>`)}

// ✗ Slower: Unnecessary keying
${repeat(this.items, item => item, item => html`<li>${item}</li>`)}
```

---

## Summary

| Directive    | Use For                | Avoid For             |
| ------------ | ---------------------- | --------------------- |
| `classMap`   | Dynamic CSS classes    | Single static class   |
| `styleMap`   | Dynamic inline styles  | Styles in stylesheets |
| `ifDefined`  | Optional attributes    | Boolean attributes    |
| `live`       | Form input bindings    | Non-input elements    |
| `repeat`     | Reorderable lists      | Static lists          |
| `map`        | Simple iterations      | Lists that reorder    |
| `range`      | Numeric sequences      | Arbitrary iterables   |
| `when`       | Expensive conditionals | Simple ternaries      |
| `choose`     | Multi-case routing     | Two cases             |
| `cache`      | View switching         | Many possible views   |
| `guard`      | Expensive computations | Simple templates      |
| `unsafeHTML` | Sanitized HTML         | User input            |
| `ref`        | Dynamic elements       | Static elements       |
| `until`      | Async content          | Synchronous data      |

Directives are powerful tools for solving specific rendering challenges. Choose the right directive for your use case, avoid overuse, and leverage tree-shaking to keep bundle sizes small. When in doubt, start with simple expressions and add directives only when they provide clear value.

## References

- [Lit Directives Documentation](https://lit.dev/docs/templates/directives/)
- [Lit List Rendering](https://lit.dev/docs/templates/lists/)
- [Lit Conditional Rendering](https://lit.dev/docs/templates/conditionals/)
- [Custom Directives API](https://lit.dev/docs/templates/custom-directives/)

## Related Documentation

- [Template Syntax Guide](/components/fundamentals/template-syntax)
- [Decorators Reference](/components/fundamentals/decorators)
- [Component Performance Optimization](/components/fundamentals/performance)
