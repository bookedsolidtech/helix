---
title: Built-in Directives
description: Practical guide to Lit's built-in directives — classMap, styleMap, ifDefined, live, repeat, when, cache, and more.
---

Lit directives are special functions that extend template expressions with additional behavior. All built-in directives live in `lit/directives/`. This page covers the directives most commonly used in HELiX components.

## `classMap`

**Import:** `import { classMap } from 'lit/directives/class-map.js';`

Efficiently applies conditional CSS classes from an object. Keys are class names; values are booleans that control whether the class is applied.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [tokenStyles, css`...`];

  @property({ type: String })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  @property({ type: String })
  size: 'sm' | 'md' | 'lg' = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  override render() {
    const classes = {
      btn: true,
      [`btn--${this.variant}`]: true,
      [`btn--${this.size}`]: true,
      'btn--loading': this.loading,
      'btn--disabled': this.disabled,
    };

    return html`
      <button class=${classMap(classes)} ?disabled=${this.disabled || this.loading}>
        ${this.loading ? html`<hx-spinner size="sm"></hx-spinner>` : nothing}
        <slot></slot>
      </button>
    `;
  }
}
```

`classMap` is more efficient than string concatenation because Lit only applies the diff between the previous and current class sets.

## `styleMap`

**Import:** `import { styleMap } from 'lit/directives/style-map.js';`

Applies inline styles from an object. Keys are camelCase CSS property names; values are strings (or `undefined` to remove the property).

```typescript
import { styleMap } from 'lit/directives/style-map.js';

@customElement('hx-skeleton')
export class HelixSkeleton extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Number })
  width = 0;

  @property({ type: Number })
  height = 16;

  @property({ type: String })
  borderRadius = '';

  override render() {
    const styles = {
      width: this.width ? `${this.width}px` : '100%',
      height: `${this.height}px`,
      borderRadius: this.borderRadius || undefined,
    };

    return html`<div class="skeleton" style=${styleMap(styles)}></div>`;
  }
}
```

Prefer CSS custom properties and `classMap` over `styleMap` for theming. Use `styleMap` for genuinely dynamic per-instance values that cannot be expressed as static classes.

## `ifDefined`

**Import:** `import { ifDefined } from 'lit/directives/if-defined.js';`

Only sets an attribute when the value is not `undefined`. When the value is `undefined`, the attribute is removed entirely from the element.

```typescript
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder: string | undefined;

  @property({ type: String })
  autocomplete: string | undefined;

  @property({ type: String })
  name: string | undefined;

  override render() {
    return html`
      <label for="input">${this.label}</label>
      <input
        id="input"
        name=${ifDefined(this.name)}
        placeholder=${ifDefined(this.placeholder)}
        autocomplete=${ifDefined(this.autocomplete)}
      />
    `;
  }
}
```

This is important for accessibility attributes: setting `aria-describedby=""` is different from not setting it at all. `ifDefined` ensures the attribute is omitted rather than set to an empty string.

## `live`

**Import:** `import { live } from 'lit/directives/live.js';`

Forces Lit to always compare the current live DOM value against the template value, rather than using the previously set value. Use this for form inputs where the user can change the value directly.

```typescript
import { live } from 'lit/directives/live.js';

@customElement('hx-controlled-input')
export class HelixControlledInput extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  value = '';

  private _handleInput(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    // Parent component controls the value
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: input.value },
      }),
    );
  }

  override render() {
    return html`
      <!-- live() ensures the input always reflects this.value,
           even if the user has typed something -->
      <input .value=${live(this.value)} @input=${this._handleInput} />
    `;
  }
}
```

Without `live`, Lit skips updating the input's `.value` property if it thinks it already set that value — even if the user has changed it since.

## `repeat`

**Import:** `import { repeat } from 'lit/directives/repeat.js';`

Renders a list with key-based DOM reconciliation. Unlike mapping to `html` templates directly, `repeat` reuses existing DOM nodes by key when items are reordered, inserted, or removed.

```typescript
import { repeat } from 'lit/directives/repeat.js';

interface ListItem {
  id: string;
  label: string;
  selected: boolean;
}

@customElement('hx-list-box')
export class HelixListBox extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Array })
  items: ListItem[] = [];

  override render() {
    return html`
      <ul role="listbox">
        ${repeat(
          this.items,
          (item) => item.id,           // key function — must be unique and stable
          (item) => html`
            <li
              role="option"
              aria-selected=${item.selected}
              @click=${() => this._selectItem(item.id)}
            >
              ${item.label}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private _selectItem(id: string) {
    this.items = this.items.map((item) => ({
      ...item,
      selected: item.id === id,
    }));
  }
}
```

Use `repeat` when list items have stable identities and the list is large or frequently reordered. For small static lists, a plain `.map()` is simpler and often equivalent.

## `when`

**Import:** `import { when } from 'lit/directives/when.js';`

A ternary helper for conditional rendering. Cleaner than a ternary expression when both branches are multi-line templates.

```typescript
import { when } from 'lit/directives/when.js';

@customElement('hx-async-content')
export class HelixAsyncContent extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  error = '';

  override render() {
    return html`
      ${when(
        this.loading,
        () => html`<hx-spinner></hx-spinner>`,
        () => html`
          ${when(
            this.error,
            () => html`<hx-alert variant="error">${this.error}</hx-alert>`,
            () => html`<slot></slot>`,
          )}
        `,
      )}
    `;
  }
}
```

`when(condition, trueCase, falseCase?)` — `falseCase` is optional; if omitted, `nothing` is rendered when the condition is false.

## `cache`

**Import:** `import { cache } from 'lit/directives/cache.js';`

Caches rendered templates so that switching between them preserves DOM state (scroll position, focus, form values) instead of destroying and recreating the DOM.

```typescript
import { cache } from 'lit/directives/cache.js';

@customElement('hx-tabs')
export class HelixTabs extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  activeTab = 'overview';

  private _renderTab(tabId: string) {
    switch (tabId) {
      case 'overview':
        return html`<div class="tab-panel"><slot name="overview"></slot></div>`;
      case 'details':
        return html`<div class="tab-panel"><slot name="details"></slot></div>`;
      case 'history':
        return html`<div class="tab-panel"><slot name="history"></slot></div>`;
      default:
        return nothing;
    }
  }

  override render() {
    return html`
      <div class="tab-bar">
        <button @click=${() => (this.activeTab = 'overview')}>Overview</button>
        <button @click=${() => (this.activeTab = 'details')}>Details</button>
        <button @click=${() => (this.activeTab = 'history')}>History</button>
      </div>
      <div class="tab-content">
        ${cache(this._renderTab(this.activeTab))}
      </div>
    `;
  }
}
```

Without `cache`, switching tabs would destroy and recreate the entire panel DOM. With `cache`, the inactive panels are detached from the document but kept in memory, preserving state.

## `guard`

**Import:** `import { guard } from 'lit/directives/guard.js';`

Only re-evaluates a template expression when one of the dependency values changes. Useful for expensive renders that depend on a subset of properties.

```typescript
import { guard } from 'lit/directives/guard.js';

override render() {
  return html`
    <div class="header">${this.title}</div>
    <!-- Only re-renders this expensive list when items change -->
    ${guard([this.items], () => html`
      <ul>
        ${this.items.map((item) => html`<li>${item.label}</li>`)}
      </ul>
    `)}
  `;
}
```

## Directive Import Reference

| Directive | Import |
|---|---|
| `classMap` | `lit/directives/class-map.js` |
| `styleMap` | `lit/directives/style-map.js` |
| `ifDefined` | `lit/directives/if-defined.js` |
| `live` | `lit/directives/live.js` |
| `repeat` | `lit/directives/repeat.js` |
| `when` | `lit/directives/when.js` |
| `cache` | `lit/directives/cache.js` |
| `guard` | `lit/directives/guard.js` |
| `ref` / `createRef` | `lit/directives/ref.js` |
| `unsafeHTML` | `lit/directives/unsafe-html.js` |
| `choose` | `lit/directives/choose.js` |
| `map` | `lit/directives/map.js` |
| `range` | `lit/directives/range.js` |

## Next Steps

- [Template Syntax](/components-guide/fundamentals/template-syntax/) — all binding types
- [Styles and CSS](/components-guide/fundamentals/styles-and-css/) — `css\`\`` and `classMap` together
- [Decorators](/components-guide/fundamentals/decorators/) — `@query`, `@queryAll`, `@queryAssignedElements`
