---
title: Built-in Directives
description: Complete reference for Lit's built-in template directives.
---

# Built-in Directives

Directives are functions that customize how Lit renders a specific binding point in a template. Unlike ordinary values, directives can maintain state between renders, access the DOM directly, and control update behavior. Every built-in directive is tree-shakeable — import only what you use.

This reference covers every built-in directive grouped by purpose. For each directive you will find: the import path, the full signature, when to use it (and when not to), and a concrete example from a healthcare component context.

---

## Class and Style Directives

### `classMap`

**Import:** `import { classMap } from 'lit/directives/class-map.js';`

**Signature:**

```typescript
classMap(classInfo: { [name: string]: string | boolean | number | undefined | null }): DirectiveResult
```

Applies CSS classes from an object. Keys with truthy values are added; keys with falsy values are removed. Uses `classList.add()` / `classList.remove()` internally — only the changed entries are touched.

**Use when:** A component has multiple state-driven CSS classes that come and go independently.

**Do not use when:** Only one class is toggled — a ternary is cleaner. Or when the class attribute has both static and directive parts — `classMap` must be the sole binding on the `class` attribute (though you can include static classes as `true` keys in the object).

**Rules:**

- Must be used as the entire `class=${...}` binding.
- Static classes should be included in the object as `{ 'static-class': true, 'dynamic': condition }`.

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('hx-button')
export class HxButton extends LitElement {
  @property({ type: String, reflect: true }) variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @property({ type: String, reflect: true, attribute: 'hx-size' }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) loading = false;

  override render() {
    return html`
      <button
        part="button"
        class=${classMap({
          button: true, // Always applied
          [`button--${this.variant}`]: true, // Variant class always present
          [`button--${this.size}`]: true, // Size class always present
          'button--loading': this.loading, // Added when loading
          'button--disabled': this.disabled, // Added when disabled
        })}
        ?disabled=${this.disabled}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

The output element's class list is updated efficiently on each render: only the classes that actually changed are touched. Lit does not replace the entire `className` string.

---

### `styleMap`

**Import:** `import { styleMap } from 'lit/directives/style-map.js';`

**Signature:**

```typescript
styleMap(styleInfo: { [name: string]: string | number | undefined | null }): DirectiveResult
```

Applies inline styles from an object. Keys with `undefined` or `null` values are removed from the element's style. Accepts camelCase property names (`backgroundColor`), dash-case (`'background-color'`), and CSS custom properties (`'--hx-color-primary'`).

**Use when:** Styles must be computed at runtime from reactive state (position, dynamic colors, CSS custom property overrides).

**Do not use when:** The styles belong in the component stylesheet. Inline styles have higher specificity and make theming harder.

**Rules:**

- Must be the sole binding on the `style` attribute.
- All values must be strings, numbers, `null`, or `undefined`. Objects are not accepted.

**Example: Dynamic tooltip positioning**

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('hx-tooltip')
export class HxTooltip extends LitElement {
  @state() private _top = 0;
  @state() private _left = 0;
  @state() private _visible = false;

  override render() {
    return html`
      <div
        class="tooltip"
        style=${styleMap({
          position: 'absolute',
          top: `${this._top}px`,
          left: `${this._left}px`,
          // Null removes the property entirely when tooltip is hidden
          opacity: this._visible ? '1' : null,
          pointerEvents: this._visible ? 'auto' : null,
        })}
        role="tooltip"
      >
        <slot></slot>
      </div>
    `;
  }
}
```

**Example: Overriding component design tokens at runtime**

```typescript
override render() {
  // Consumer-provided brand color applied via token override
  const styles = this.brandColor
    ? { '--hx-color-primary-500': this.brandColor }
    : {};

  return html`
    <div style=${styleMap(styles)}>
      <hx-button>Book Appointment</hx-button>
    </div>
  `;
}
```

---

## Attribute Directives

### `ifDefined`

**Import:** `import { ifDefined } from 'lit/directives/if-defined.js';`

**Signature:**

```typescript
ifDefined(value: unknown | undefined): unknown | typeof nothing
```

Sets an attribute to the given value when the value is not `undefined`. When the value is `undefined`, the attribute is removed entirely. `null` is treated as a value (not removal) — use `|| undefined` to coerce empty strings and null to `undefined`.

**Use when:** An attribute should be absent from the DOM when a value is not provided. The difference between absent and empty string matters for HTML semantics (`name`, `placeholder`, `href`, `aria-*` attributes).

**Do not use with boolean attributes** — those use the `?attr=${condition}` binding.

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('hx-text-input')
export class HxTextInput extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) name = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) pattern = '';
  @property({ type: String }) ariaDescribedby = '';

  override render() {
    return html`
      <div class="field">
        <label>${this.label}</label>
        <input
          name=${ifDefined(this.name || undefined)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          pattern=${ifDefined(this.pattern || undefined)}
          aria-describedby=${ifDefined(this.ariaDescribedby || undefined)}
        />
      </div>
    `;
  }
}
```

Without `ifDefined`, an empty `name=""` or missing `name` would render as `name="undefined"` if you interpolate an undefined variable directly.

**Coercion patterns:**

```typescript
// || undefined: empty string and null both become undefined (attribute removed)
name=${ifDefined(this.name || undefined)}

// ?? undefined: only null/undefined become undefined (empty string is kept)
aria-label=${ifDefined(this.ariaLabel ?? undefined)}

// Direct undefined check
href=${ifDefined(this.url !== null ? this.url : undefined)}
```

---

### `live`

**Import:** `import { live } from 'lit/directives/live.js';`

**Signature:**

```typescript
live(value: unknown): DirectiveResult
```

Compares the binding value against the **live DOM property value** rather than the previous value Lit rendered. Forces a DOM update when the live value and the new value differ, even if Lit thinks nothing changed.

**Use when:** Form inputs where the user (or browser autocomplete, or external code) may have changed the DOM value outside of Lit's reactive system. Without `live`, Lit may skip updating an input because it thinks the value already matches — but it's comparing against its cached last-rendered value, not the actual DOM.

**Required for:** `.value` on text inputs, `.checked` on checkboxes, `.value` on selects, `.indeterminate` on checkboxes.

**Do not use for:** Non-form elements, or elements that are not modified outside of Lit's control. The additional DOM read on every render has a small but nonzero cost.

**Why it matters:**

```typescript
// Without live: bug scenario
// 1. User types "hello" into input (Lit doesn't know about it)
// 2. Component sets this.value = "hello" (same string)
// 3. Lit compares "hello" (new) === "hello" (previous rendered value)
// 4. Lit skips the DOM update
// 5. If the user had typed "hello " (with a trailing space), their edit is lost

// With live: correct behavior
// 3. Lit compares "hello" (new) against input.value (actual live DOM: "hello ")
// 4. They differ → Lit updates the DOM → user's edit is corrected
```

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

@customElement('hx-checkbox')
export class HxCheckbox extends LitElement {
  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) indeterminate = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }),
    );
  }

  override render() {
    return html`
      <label class="checkbox">
        <input
          type="checkbox"
          .checked=${live(this.checked)}
          .indeterminate=${live(this.indeterminate)}
          ?disabled=${this.disabled}
          @change=${this._handleChange}
        />
        <slot></slot>
      </label>
    `;
  }
}
```

**Type matching matters:** `live` uses strict equality. If the DOM property is a string and your value is a number, they will never match:

```typescript
// WRONG — number vs string mismatch, always updates the DOM
.value=${live(this.count)}        // count: number, input.value: string

// CORRECT — both strings
.value=${live(String(this.count))}
```

---

## List Rendering Directives

### `repeat`

**Import:** `import { repeat } from 'lit/directives/repeat.js';`

**Signature:**

```typescript
repeat<T>(
  items: Iterable<T>,
  keyFnOrTemplate: KeyFn<T> | ItemTemplate<T>,
  template?: ItemTemplate<T>
): DirectiveResult

type KeyFn<T> = (item: T, index: number) => unknown
type ItemTemplate<T> = (item: T, index: number) => unknown
```

Renders an iterable with optional keying for DOM stability. When provided with a key function, `repeat` associates each item with its rendered DOM node by key. On subsequent renders, if items reorder, the associated DOM nodes are physically moved rather than destroyed and recreated.

**Use when:**

- Items frequently reorder (sorting, drag-and-drop).
- Items contain stateful elements (form inputs, focused elements, video/audio players, custom components with internal state).

**Do not use when:**

- The list is static or append-only — `map` is faster and lighter.
- Items never reorder — plain `Array.map()` works just as well.

**Key function requirements:** Keys must be unique across the list, stable (same item → same key across renders), and primitive (string, number, or symbol).

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface Appointment {
  id: string;
  patient: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'complete';
}

@customElement('hx-appointment-list')
export class HxAppointmentList extends LitElement {
  @property({ type: Array }) appointments: Appointment[] = [];

  private _sortByTime() {
    this.appointments = [...this.appointments].sort((a, b) => a.time.localeCompare(b.time));
  }

  override render() {
    return html`
      <button @click=${this._sortByTime}>Sort by time</button>

      <ul>
        ${repeat(
          this.appointments,
          // Key function — stable, unique, primitive
          (appt) => appt.id,
          // Template function
          (appt, index) => html`
            <li>
              <span class="index">${index + 1}.</span>
              <hx-appointment-card
                patient=${appt.patient}
                time=${appt.time}
                status=${appt.status}
              ></hx-appointment-card>
            </li>
          `,
        )}
      </ul>
    `;
  }
}
```

When the user clicks "Sort by time", Lit moves the existing `<hx-appointment-card>` elements into the new order rather than destroying and recreating them. Any internal state in those components (expanded details, in-progress edits) is preserved.

---

### `map`

**Import:** `import { map } from 'lit/directives/map.js';`

**Signature:**

```typescript
map<T>(items: Iterable<T> | undefined, f: (value: T, index: number) => unknown): Iterable<unknown>
```

Transforms any iterable into a sequence of template results. Accepts `undefined` gracefully (renders nothing). Lighter than `repeat` because it does not maintain key-to-node associations.

**Use when:** The list order is stable, items don't contain stateful elements, and you're working with non-array iterables (Set, Map, generator functions).

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

@customElement('hx-role-badges')
export class HxRoleBadges extends LitElement {
  // Set: no duplicates, order not guaranteed
  @property({ type: Object }) roles: Set<string> = new Set();

  override render() {
    return html`
      <div class="badges">
        ${map(this.roles, (role) => html`<span class="badge">${role}</span>`)}
      </div>
    `;
  }
}
```

`Array.prototype.map()` is equivalent for arrays, but `map` works with any iterable and handles `undefined` without an explicit check.

---

### `range`

**Import:** `import { range } from 'lit/directives/range.js';`

**Signature:**

```typescript
range(end: number): Iterable<number>
range(start: number, end: number): Iterable<number>
range(start: number, end: number, step: number): Iterable<number>
```

Generates a lazy numeric sequence, similar to Python's `range()`. Returns an iterable of numbers from `start` (inclusive) to `end` (exclusive) with the given `step`.

**Use when:** You need to render a fixed number of items or a sequence of page numbers without manually constructing an array.

**Example: Star rating display**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('hx-star-rating')
export class HxStarRating extends LitElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 5;

  override render() {
    return html`
      <div class="rating" role="img" aria-label="${this.value} out of ${this.max} stars">
        ${map(
          range(this.max),
          (i) => html`
            <span class=${classMap({ star: true, 'star--filled': i < this.value })}> ★ </span>
          `,
        )}
      </div>
    `;
  }
}
```

**Example: Pagination controls**

```typescript
override render() {
  return html`
    <nav class="pagination">
      ${map(
        range(1, this.totalPages + 1),
        (page) => html`
          <button
            class=${classMap({ 'page-btn': true, 'page-btn--active': page === this.currentPage })}
            aria-current=${page === this.currentPage ? 'page' : nothing}
            @click=${() => { this.currentPage = page; }}
          >
            ${page}
          </button>
        `,
      )}
    </nav>
  `;
}
```

---

### `join`

**Import:** `import { join } from 'lit/directives/join.js';`

**Signature:**

```typescript
join<T>(
  items: Iterable<T> | undefined,
  joiner: TemplateResult | ((index: number) => unknown)
): Iterable<T | TemplateResult>
```

Interleaves an iterable of template results with a separator. The separator can be a static template or a function that receives the item index (the separator before item `n` receives index `n - 1`).

**Use when:** You need visible separators between rendered items — breadcrumbs, tag lists with commas, pipeline stages with arrows.

**Example: Breadcrumb navigation**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { join } from 'lit/directives/join.js';

interface Crumb {
  label: string;
  href: string;
}

@customElement('hx-breadcrumbs')
export class HxBreadcrumbs extends LitElement {
  @property({ type: Array }) crumbs: Crumb[] = [];

  override render() {
    const lastIndex = this.crumbs.length - 1;

    return html`
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumbs">
          ${join(
            map(
              this.crumbs,
              (crumb, i) => html`
                <li>
                  ${i < lastIndex
                    ? html`<a href=${crumb.href}>${crumb.label}</a>`
                    : html`<span aria-current="page">${crumb.label}</span>`}
                </li>
              `,
            ),
            html`<li class="separator" aria-hidden="true">/</li>`,
          )}
        </ol>
      </nav>
    `;
  }
}
```

---

## Conditional Rendering Directives

### `when`

**Import:** `import { when } from 'lit/directives/when.js';`

**Signature:**

```typescript
when<T, F>(
  condition: boolean,
  trueCase: () => T,
  falseCase?: () => F
): T | F | undefined
```

Lazily renders one of two template branches. Unlike a ternary expression, the non-selected branch **never evaluates**. Both branch factories are functions — they are called only if selected.

**Use when:** One or both branches are expensive to compute (involve method calls, sorting, filtering), and you want to avoid evaluating the unused branch on every render.

**Use a ternary instead when:** Both branches are cheap (inline `html` snippets without method calls) — the syntax is more readable.

**Example:**

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

@customElement('hx-lab-results')
export class HxLabResults extends LitElement {
  @state() private _loading = false;
  @state() private _error: Error | null = null;
  @property({ type: Array }) results: LabResult[] = [];

  override render() {
    return html`
      ${when(
        this._loading,
        // Only runs when loading is true
        () => html`
          <div class="loading" role="status">
            <hx-spinner></hx-spinner>
            <p>Retrieving lab results...</p>
          </div>
        `,
        // Only runs when loading is false
        () =>
          when(
            this._error !== null,
            () => html`
              <div class="error" role="alert">
                <p>Failed to load results: ${this._error!.message}</p>
                <hx-button @click=${this._retry}>Retry</hx-button>
              </div>
            `,
            () => this._renderResults(), // Expensive table render — skipped when in error
          ),
      )}
    `;
  }

  private _renderResults() {
    // Complex rendering — only called when not loading and no error
    return html`
      <table>
        ${this.results.map(
          (r) =>
            html`<tr>
              <td>${r.name}</td>
              <td>${r.value}</td>
            </tr>`,
        )}
      </table>
    `;
  }

  private _retry() {
    /* ... */
  }
}
```

---

### `choose`

**Import:** `import { choose } from 'lit/directives/choose.js';`

**Signature:**

```typescript
choose<T, V>(
  value: T,
  cases: Array<[T, () => V]>,
  defaultCase?: () => V
): V | undefined
```

Selects a rendering function based on value matching using strict equality (`===`). Analogous to a `switch` statement. Like `when`, the selected function is called lazily; the others are not evaluated.

**Use when:** A single value determines which of three or more distinct templates to render. Cleaner than chained ternaries.

**Use `when` instead when:** There are only two cases.

**Use `if/else` instead when:** The condition involves non-equality comparisons or complex boolean logic.

**Example: Appointment status display**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

type AppointmentStatus = 'scheduled' | 'in-progress' | 'complete' | 'cancelled' | 'no-show';

@customElement('hx-appointment-status')
export class HxAppointmentStatus extends LitElement {
  @property({ type: String }) status: AppointmentStatus = 'scheduled';
  @property({ type: String }) patientName = '';

  override render() {
    return html`
      <div class="status-card">
        <p class="patient">${this.patientName}</p>

        ${choose<AppointmentStatus, unknown>(
          this.status,
          [
            [
              'scheduled',
              () => html`
                <span class="badge badge--info">Scheduled</span>
                <hx-button variant="primary" hx-size="sm">Check In</hx-button>
              `,
            ],
            [
              'in-progress',
              () => html`
                <span class="badge badge--warning">In Progress</span>
                <hx-button variant="secondary" hx-size="sm">Complete</hx-button>
              `,
            ],
            ['complete', () => html` <span class="badge badge--success">Complete</span> `],
            ['cancelled', () => html` <span class="badge badge--error">Cancelled</span> `],
            [
              'no-show',
              () => html`
                <span class="badge badge--error">No Show</span>
                <hx-button variant="ghost" hx-size="sm">Reschedule</hx-button>
              `,
            ],
          ],
          // Default case — renders if status doesn't match any case
          () => html`<span class="badge">Unknown</span>`,
        )}
      </div>
    `;
  }
}
```

---

## Caching and Identity Directives

### `cache`

**Import:** `import { cache } from 'lit/directives/cache.js';`

**Signature:**

```typescript
cache(value: TemplateResult | typeof nothing): DirectiveResult
```

Caches the DOM tree for a template result when it is switched out. When the same template result type returns, the cached DOM is restored rather than recreated.

**Use when:** The user switches frequently between expensive views and the views contain stateful content (form inputs, video players, components with internal state) that must be preserved across switches.

**Do not use when:**

- There are many possible templates — each is kept in memory simultaneously.
- Templates are cheap to render — the memory cost is not worth it.
- Stale state in cached views would cause confusion.

**Example: Clinical note editor with preview**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { choose } from 'lit/directives/choose.js';

@customElement('hx-note-editor')
export class HxNoteEditor extends LitElement {
  @property({ type: String }) activeTab: 'compose' | 'preview' | 'history' = 'compose';

  override render() {
    return html`
      <nav class="tabs">
        <button
          @click=${() => {
            this.activeTab = 'compose';
          }}
        >
          Compose
        </button>
        <button
          @click=${() => {
            this.activeTab = 'preview';
          }}
        >
          Preview
        </button>
        <button
          @click=${() => {
            this.activeTab = 'history';
          }}
        >
          History
        </button>
      </nav>

      ${cache(
        choose(this.activeTab, [
          ['compose', () => this._renderCompose()],
          ['preview', () => this._renderPreview()],
          ['history', () => this._renderHistory()],
        ]),
      )}
    `;
  }

  private _renderCompose() {
    // Rich text editor with significant internal state
    return html`<hx-rich-text-editor></hx-rich-text-editor>`;
  }

  private _renderPreview() {
    return html`<div class="preview"><slot name="preview"></slot></div>`;
  }

  private _renderHistory() {
    return html`<hx-revision-list></hx-revision-list>`;
  }
}
```

When the user navigates from "Compose" to "Preview" and back, the rich text editor's DOM (cursor position, selection, undo history) is preserved in memory and swapped back in.

---

### `guard`

**Import:** `import { guard } from 'lit/directives/guard.js';`

**Signature:**

```typescript
guard(dependencies: unknown[], valueFn: () => unknown): DirectiveResult
```

Only re-evaluates `valueFn` when one or more items in `dependencies` change identity (strict inequality). Prevents expensive computations from running on every render when their inputs haven't changed.

**Use when:** The template function is expensive (parsing, sorting, filtering large datasets, external library calls) and its dependencies change infrequently.

**Do not use when:** The template is cheap, or dependencies change on every render anyway.

**Requires immutable updates:** `guard` uses `===` for dependency comparison. If you mutate an array in-place, its identity stays the same and the guard never triggers.

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

@customElement('hx-clinical-note')
export class HxClinicalNote extends LitElement {
  @property({ type: String }) markdown = '';

  // The note may change — but locale affects display of dates in the rendered output
  @property({ type: String }) locale = 'en-US';

  override render() {
    return html`
      <article class="note">
        ${guard(
          // Dependencies: re-render only when markdown OR locale changes
          [this.markdown, this.locale],
          () => {
            // Expensive: parse Markdown, then sanitize HTML
            const raw = marked.parse(this.markdown) as string;
            const safe = DOMPurify.sanitize(raw);
            return unsafeHTML(safe);
          },
        )}
      </article>
    `;
  }
}
```

---

### `keyed`

**Import:** `import { keyed } from 'lit/directives/keyed.js';`

**Signature:**

```typescript
keyed(key: unknown, value: unknown): DirectiveResult
```

Forces complete destruction and recreation of the template's DOM when the `key` changes. The opposite of `cache` — instead of preserving DOM across template changes, `keyed` destroys DOM when data changes.

**Use when:** Switching between distinct data entities and you want all prior state (form validation, scroll position, third-party library state) completely discarded.

**Do not use for:** Performance optimization — `keyed` is expensive. It is a correctness tool for stateful resets.

**Example: Multi-patient form — ensure form resets when patient changes**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

interface Patient {
  id: string;
  name: string;
  dob: string;
}

@customElement('hx-patient-intake-form')
export class HxPatientIntakeForm extends LitElement {
  @property({ type: Object }) patient: Patient | null = null;

  override render() {
    if (!this.patient) {
      return html`<p>No patient selected.</p>`;
    }

    return html`
      <section>
        <h2>Intake — ${this.patient.name}</h2>

        ${keyed(
          // Key by patient ID — new patient = entire form discarded and recreated
          this.patient.id,
          html`
            <form>
              <hx-text-input label="Chief Complaint" name="complaint"></hx-text-input>
              <hx-text-input label="Allergies" name="allergies"></hx-text-input>
              <hx-textarea label="Current Medications" name="medications"></hx-textarea>
              <hx-button type="submit">Save Intake</hx-button>
            </form>
          `,
        )}
      </section>
    `;
  }
}
```

Without `keyed`, switching from Patient A to Patient B would update the `patient` property and re-render the form fields — but the inputs' previous values, validation state, and focus position would persist because Lit reuses the existing DOM nodes. `keyed` guarantees a clean slate.

---

## Async Directives

### `until`

**Import:** `import { until } from 'lit/directives/until.js';`

**Signature:**

```typescript
until(...values: unknown[]): DirectiveResult
```

Accepts one or more values or Promises ordered by priority (highest first). Renders the first value immediately available. When Promises resolve, updates to show the resolved value. Renders fallback content while waiting.

**Use when:** Fetching async data and you want to render a loading state while waiting, then the real content when ready.

**Do not use when:** You can use an `@state()` property with async loading — that pattern (set `_loading = true`, fetch, set `_data`, set `_loading = false`) gives you more control over error states and is easier to test.

**Example:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';

interface Provider {
  id: string;
  name: string;
  specialty: string;
}

@customElement('hx-provider-card')
export class HxProviderCard extends LitElement {
  @property({ type: String }) providerId = '';

  private _fetchProvider(id: string): Promise<unknown> {
    return fetch(`/api/providers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(
        (p: Provider) => html`
          <div class="provider">
            <h3>${p.name}</h3>
            <p>${p.specialty}</p>
          </div>
        `,
      )
      .catch(
        () => html` <div class="error" role="alert">Failed to load provider information.</div> `,
      );
  }

  override render() {
    return html`
      <div class="card">
        ${until(
          // Priority 1: Resolved template (shown when fetch completes)
          this.providerId ? this._fetchProvider(this.providerId) : undefined,
          // Priority 2: Fallback (shown immediately while fetching)
          html`<hx-spinner aria-label="Loading provider..."></hx-spinner>`,
        )}
      </div>
    `;
  }
}
```

**Multiple priorities:**

```typescript
// Fast placeholder (resolves in <100ms), then full content
${until(
  this._fetchFullContent(),   // Priority 1: Full content (slow)
  this._fetchSummary(),       // Priority 2: Summary (fast)
  html`<div>Loading...</div>` // Priority 3: Immediate fallback
)}
```

---

### `asyncAppend`

**Import:** `import { asyncAppend } from 'lit/directives/async-append.js';`

**Signature:**

```typescript
asyncAppend<T>(
  value: AsyncIterable<T>,
  mapper?: (v: T, index?: number) => unknown
): DirectiveResult
```

Renders an async iterable by appending each yielded value to the DOM. Previously rendered values accumulate — they are not replaced.

**Use when:** Streaming data arrives incrementally and all of it should be visible (log streams, chat messages, test output).

**Example: Real-time vital signs log**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { asyncAppend } from 'lit/directives/async-append.js';

@customElement('hx-vitals-stream')
export class HxVitalsStream extends LitElement {
  @property({ type: String }) patientId = '';

  private async *_streamVitals(): AsyncIterable<string> {
    const url = `/api/patients/${this.patientId}/vitals/stream`;
    const response = await fetch(url);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  }

  override render() {
    return html`
      <div class="vitals-log" role="log" aria-live="polite">
        ${asyncAppend(this._streamVitals(), (reading) => html`<p class="reading">${reading}</p>`)}
      </div>
    `;
  }
}
```

---

### `asyncReplace`

**Import:** `import { asyncReplace } from 'lit/directives/async-replace.js';`

**Signature:**

```typescript
asyncReplace<T>(
  value: AsyncIterable<T>,
  mapper?: (v: T, index?: number) => unknown
): DirectiveResult
```

Renders an async iterable by replacing the rendered value with each new yielded value. Only the most recent value is visible.

**Use when:** A stream of values represents the "current state" and old values are no longer relevant (live price feeds, real-time sensor readings, live status indicators).

**Example: Live heart rate monitor**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { asyncReplace } from 'lit/directives/async-replace.js';

@customElement('hx-heart-rate-monitor')
export class HxHeartRateMonitor extends LitElement {
  @property({ type: String }) deviceId = '';

  private async *_streamHeartRate(): AsyncIterable<number> {
    // Simulated WebSocket or Server-Sent Events stream
    while (true) {
      const reading = await this._pollDevice();
      yield reading;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  private async _pollDevice(): Promise<number> {
    const r = await fetch(`/api/devices/${this.deviceId}/bpm`);
    const data = (await r.json()) as { bpm: number };
    return data.bpm;
  }

  override render() {
    return html`
      <div class="monitor">
        <span class="label">Heart Rate</span>
        <span class="value">
          ${asyncReplace(
            this._streamHeartRate(),
            (bpm) => html`${bpm} <abbr title="beats per minute">bpm</abbr>`,
          )}
        </span>
      </div>
    `;
  }
}
```

---

## Directive Comparison Tables

### Choosing a List Directive

| Scenario                                 | Directive                   |
| ---------------------------------------- | --------------------------- |
| Static list, never reorders              | `Array.map()` or `map`      |
| Non-array iterable (Set, Map, generator) | `map`                       |
| List that reorders; items have state     | `repeat` with key function  |
| Numeric sequence (pagination, stars)     | `range` combined with `map` |
| Items need separator (breadcrumbs, tags) | `join`                      |

### Choosing a Conditional Directive

| Scenario                                 | Directive                           |
| ---------------------------------------- | ----------------------------------- |
| Two branches, both cheap                 | Ternary `condition ? a : b`         |
| Two branches, one or both expensive      | `when`                              |
| Three or more branches on a single value | `choose`                            |
| Render nothing conditionally             | `condition ? html\`...\` : nothing` |

### Choosing a Caching/Identity Directive

| Scenario                                       | Directive |
| ---------------------------------------------- | --------- |
| Preserve DOM and state across view switches    | `cache`   |
| Skip expensive computation when deps unchanged | `guard`   |
| Discard all state when data entity changes     | `keyed`   |

### Choosing an Async Directive

| Scenario                                      | Directive      |
| --------------------------------------------- | -------------- |
| Show fallback until one-shot Promise resolves | `until`        |
| Accumulate all values from stream             | `asyncAppend`  |
| Show only the latest value from stream        | `asyncReplace` |

---

## Import Quick Reference

```typescript
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';
import { join } from 'lit/directives/join.js';
import { when } from 'lit/directives/when.js';
import { choose } from 'lit/directives/choose.js';
import { cache } from 'lit/directives/cache.js';
import { guard } from 'lit/directives/guard.js';
import { keyed } from 'lit/directives/keyed.js';
import { until } from 'lit/directives/until.js';
import { asyncAppend } from 'lit/directives/async-append.js';
import { asyncReplace } from 'lit/directives/async-replace.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { ref, createRef } from 'lit/directives/ref.js';
```

All directives are individually tree-shakeable. Only imported directives are included in the bundle.

---

## References

- [Lit Directives Documentation](https://lit.dev/docs/templates/directives/)
- [Lit List Rendering](https://lit.dev/docs/templates/lists/)
- [Lit Conditional Rendering](https://lit.dev/docs/templates/conditionals/)
- [Custom Directives](/components/fundamentals/custom-directives/) — Building your own directives
- [Template Syntax Guide](/components/fundamentals/template-syntax/) — Full template binding reference
