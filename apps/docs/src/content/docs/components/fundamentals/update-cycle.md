---
title: The Reactive Update Cycle
description: Deep dive into Lit's asynchronous reactive update pipeline and how to hook into it.
---

# The Reactive Update Cycle

Lit's reactive update system is what makes components fast. Instead of re-rendering synchronously every time a property changes, Lit batches all changes within the current JavaScript task into a single asynchronous render. Understanding the full pipeline — from property mutation to DOM paint — lets you hook into precisely the right moment for derived state, DOM side effects, and coordinated updates.

---

## The Full Pipeline

```
Property change (or requestUpdate() call)
          │
          ▼
   scheduleUpdate()           ← Enqueues performUpdate() as a microtask.
          │                     If an update is already pending, does nothing.
          ▼
   performUpdate()            ← Runs the full update cycle synchronously.
          │
          ├─► shouldUpdate(changedProperties)
          │     Returns false → update aborted. No render.
          │     Returns true  → continue.
          │
          ├─► willUpdate(changedProperties)
          │     Compute derived state. SSR-compatible.
          │
          ├─► update(changedProperties)
          │     Reflect properties to attributes.
          │     Call render() and commit results to the DOM.
          │
          ├─► render()
          │     Return a TemplateResult.
          │
          ├─► firstUpdated(changedProperties)  [first render only]
          │     One-time DOM setup.
          │
          └─► updated(changedProperties)
                DOM side effects, measurements, external notifications.
                │
                ▼
         updateComplete resolves
```

---

## Triggering an Update: `requestUpdate()`

Every reactive property setter calls `requestUpdate()` internally. You can also call it directly when you have non-reactive state that should trigger a render.

### Signature

```typescript
requestUpdate(
  name?: PropertyKey,
  oldValue?: unknown,
  options?: PropertyDeclaration
): void
```

- **`name`** — The property key to record in the `changedProperties` Map for this update cycle. If omitted, the update is scheduled without recording a specific property change.
- **`oldValue`** — The previous value. Stored in `changedProperties` for use in `shouldUpdate`, `willUpdate`, and `updated`.
- **`options`** — A property declaration object. Rarely needed; only required when implementing custom accessors that want to participate in the full options pipeline (e.g., custom `hasChanged`).

### When to Call It Directly

**Custom accessor with manual reactivity:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-slider')
export class HxSlider extends LitElement {
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;

  // Custom accessor — Lit does not generate one when noAccessor is set
  private _value = 50;

  @property({ type: Number, noAccessor: true })
  get value(): number {
    return this._value;
  }

  set value(v: number) {
    const old = this._value;
    // Normalize: clamp to valid range
    this._value = Math.max(this.min, Math.min(this.max, v));
    // Manually notify Lit of the change
    this.requestUpdate('value', old);
  }

  override render() {
    return html`<input
      type="range"
      min=${this.min}
      max=${this.max}
      .value=${String(this._value)}
    />`;
  }
}
```

**Non-reactive internal state that drives rendering:**

```typescript
@customElement('hx-clock')
export class HxClock extends LitElement {
  // Not decorated — no reactive accessor generated
  private _now = new Date();
  private _interval: ReturnType<typeof setInterval> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this._interval = setInterval(() => {
      this._now = new Date();
      // Manually schedule a render. No property name needed —
      // we just want the DOM to update.
      this.requestUpdate();
    }, 1000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._interval);
  }

  override render() {
    return html`<time>${this._now.toLocaleTimeString()}</time>`;
  }
}
```

**Slot change tracking:**

Slotted content changes do not automatically trigger reactive updates. Handle the `slotchange` event and call `requestUpdate()`:

```typescript
@customElement('hx-tab-panel')
export class HxTabPanel extends LitElement {
  private _tabCount = 0;

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const tabs = slot.assignedElements({ flatten: true });
    this._tabCount = tabs.length;
    // requestUpdate() needed because _tabCount is not a reactive property
    this.requestUpdate();
  }

  override render() {
    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <p>${this._tabCount} tab(s) available</p>
    `;
  }
}
```

---

## Update Scheduling and the Microtask Queue

`requestUpdate()` does not run the update immediately. It calls `scheduleUpdate()`, which enqueues the update as a **microtask** using `Promise.resolve().then(...)`.

### What This Means in Practice

Microtasks run after all synchronous code in the current task has finished, but before the browser paints the next frame. This gives Lit a window to batch multiple property changes into one render.

```typescript
// Synchronous — all three changes are batched into one microtask
element.firstName = 'Jane';
element.lastName = 'Smith';
element.role = 'Pharmacist';
// No render has happened yet

// After this synchronous code completes, the microtask queue runs
// and exactly ONE render occurs with all three changes visible.
await element.updateComplete; // Now the DOM reflects all three changes
```

### Proof of Batching

```typescript
@customElement('hx-batch-demo')
export class HxBatchDemo extends LitElement {
  @property({ type: Number }) a = 0;
  @property({ type: Number }) b = 0;
  @property({ type: Number }) c = 0;

  private _renderCount = 0;

  override render() {
    this._renderCount++;
    console.log(`render #${this._renderCount}`);
    return html`<p>${this.a} ${this.b} ${this.c}</p>`;
  }
}

const el = document.createElement('hx-batch-demo') as HxBatchDemo;
document.body.appendChild(el);
await el.updateComplete; // render #1 (initial render)

el.a = 1;
el.b = 2;
el.c = 3;
await el.updateComplete; // render #2 — ONE render for all three changes
// Console: render #1, render #2 — not render #3 or #4
```

### Microtask Ordering

The Lit update runs after `Promise.resolve()` microtasks but before the browser's rendering cycle:

```
[Synchronous code]
  → el.count = 5   (schedules microtask)
  → el.count = 6   (no new microtask — update already pending)
[End of synchronous code]
[Microtask queue]
  → performUpdate() runs (render sees count === 6)
[requestAnimationFrame callbacks, if any]
[Browser paint]
```

---

## `shouldUpdate()`: Conditional Rendering

`shouldUpdate()` receives the `changedProperties` Map and returns `true` to proceed or `false` to abort the entire update cycle.

```typescript
import { PropertyValues } from 'lit';

override shouldUpdate(changed: PropertyValues): boolean {
  // Required: call super for Lit internals to work correctly
  // (ReactiveElement may have its own logic)
  // In practice, always return the result of your own logic
  return changed.has('value') || changed.has('variant');
}
```

### When to Use It

`shouldUpdate()` is appropriate for components where **some property changes are known to have no visual effect**. This is an optimization — use it only after profiling confirms it matters.

```typescript
@customElement('hx-audit-log')
export class HxAuditLog extends LitElement {
  // Displayed in template
  @property({ type: Array })
  entries: AuditEntry[] = [];

  // Used for analytics only — does not affect rendered output
  @property({ type: String })
  sessionId = '';

  override shouldUpdate(changed: PropertyValues): boolean {
    // Never re-render when only sessionId changes
    return changed.has('entries');
  }

  override render() {
    return html`
      <ul>
        ${this.entries.map((e) => html`<li>${e.timestamp}: ${e.action}</li>`)}
      </ul>
    `;
  }
}
```

**Caution:** If you return `false`, `updated()` also does not run, and `updateComplete` still resolves (with the value `false`). Reflected attributes also do not update.

---

## `willUpdate()`: Derived State

`willUpdate()` runs after `shouldUpdate()` returns `true` and before `render()`. This is the correct place to compute derived values that depend on multiple properties.

### Key Characteristics

- Called on server (SSR-compatible) — do not access the DOM here.
- Changes to `@state()` or `@property()` fields here do not schedule an additional update cycle during the current render. The values are available immediately in the subsequent `render()` call.
- Do not trigger side effects (event dispatch, external API calls) here.

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-patient-summary')
export class HxPatientSummary extends LitElement {
  @property({ type: String }) firstName = '';
  @property({ type: String }) lastName = '';
  @property({ type: String }) mrn = '';
  @property({ type: Number }) age = 0;

  // Derived values — computed once per update, referenced cheaply in render
  @state() private _displayName = '';
  @state() private _ageGroup: 'pediatric' | 'adult' | 'geriatric' = 'adult';

  override willUpdate(changed: PropertyValues) {
    if (changed.has('firstName') || changed.has('lastName') || changed.has('mrn')) {
      this._displayName =
        [this.firstName, this.lastName].filter(Boolean).join(' ') || `MRN ${this.mrn}`;
    }

    if (changed.has('age')) {
      this._ageGroup = this.age < 18 ? 'pediatric' : this.age >= 65 ? 'geriatric' : 'adult';
    }
  }

  override render() {
    // render() stays lean — derived values are ready
    return html`
      <header>
        <h2>${this._displayName}</h2>
        <span class="age-group">${this._ageGroup}</span>
      </header>
    `;
  }
}
```

### `willUpdate()` vs Computed in `render()`

For values that are cheap to compute and only referenced once, computing in `render()` is fine. Use `willUpdate()` when:

- The computation is expensive and references multiple properties.
- The result is referenced more than once in the template.
- You need the derived value available in `updated()` too.

```typescript
// Fine in render() — cheap, single use
override render() {
  const label = this.firstName ? `Hello, ${this.firstName}` : 'Hello';
  return html`<p>${label}</p>`;
}

// Better in willUpdate() — expensive, referenced multiple times
@state() private _filteredItems: Item[] = [];

override willUpdate(changed: PropertyValues) {
  if (changed.has('items') || changed.has('filter')) {
    // Sorting + filtering large arrays: do once, not on every template expression
    this._filteredItems = this.items
      .filter(i => i.name.toLowerCase().includes(this.filter.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
```

---

## `update()`: The Engine Room

`update()` is the method that does the actual work: it reflects properties to attributes and calls `render()`. You rarely override this, but understanding it helps debug subtle timing issues.

```typescript
override update(changed: PropertyValues) {
  // At this point: properties have been updated but attributes not yet reflected
  console.log('Before render, changed:', [...changed.keys()]);

  // MUST call super — this is what calls render() and commits to the DOM
  super.update(changed);

  // At this point: render() has run, DOM is updated
  // (But firstUpdated/updated haven't fired yet)
}
```

The only legitimate reason to override `update()` is to perform a DOM action that must happen after attribute reflection but before `firstUpdated` / `updated`, which is extremely rare.

---

## `firstUpdated()`: One-Time DOM Setup

`firstUpdated()` fires once — after the first render — and never again for the lifetime of a connection. Use it for setup that requires the shadow DOM to exist.

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';

@customElement('hx-search-input')
export class HxSearchInput extends LitElement {
  @query('input')
  private _input!: HTMLInputElement;

  private _observer!: ResizeObserver;

  override firstUpdated(_changed: PropertyValues) {
    // Focus the input on mount (if configured)
    if (this.hasAttribute('autofocus')) {
      this._input.focus();
    }

    // Attach observers — DOM exists now
    this._observer = new ResizeObserver(() => {
      this.requestUpdate();
    });
    this._observer.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._observer.disconnect();
  }

  override render() {
    return html`<input type="search" placeholder="Search..." />`;
  }
}
```

**Important:** `firstUpdated()` is called once per connection. If the element is removed from the DOM and re-inserted, `connectedCallback()` fires again but `firstUpdated()` does not. If you need to re-run setup on reconnection, use `connectedCallback()` with a guard:

```typescript
private _initialized = false;

override connectedCallback() {
  super.connectedCallback();
  // Will be called after the first render via updateComplete
  if (!this._initialized) {
    this.updateComplete.then(() => {
      this._initializeThirdPartyLibrary();
      this._initialized = true;
    });
  }
}
```

---

## `updated()`: Post-Render DOM Side Effects

`updated()` fires after every render — initial and subsequent. Use it for DOM measurements, imperative integrations, and dispatching events that reflect rendered state.

### Guard Every Access with `changed.has()`

Without guards, `updated()` logic runs on every render regardless of which properties changed, doing unnecessary work and potentially causing infinite loops.

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('hx-expandable')
export class HxExpandable extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;

  @query('.content')
  private _content!: HTMLDivElement;

  override updated(changed: PropertyValues) {
    // Only run when 'open' specifically changed
    if (!changed.has('open')) return;

    if (this.open) {
      // Measure content height for CSS animation
      const height = this._content.scrollHeight;
      this._content.style.setProperty('--_target-height', `${height}px`);
    }

    // Dispatch event so parent components know the state changed
    this.dispatchEvent(
      new CustomEvent('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      }),
    );
  }

  override render() {
    return html`
      <div class="content" ?hidden=${!this.open}>
        <slot></slot>
      </div>
    `;
  }
}
```

### Avoiding Infinite Loops in `updated()`

If you change a reactive property inside `updated()`, it triggers a new update cycle. Always guard with `changed.has()` to ensure you only react once per external change:

```typescript
override updated(changed: PropertyValues) {
  // SAFE: Only runs once per external 'value' change.
  // The sanitized value assignment schedules another update,
  // but 'value' will not be in changedProperties on that update
  // because sanitize(value) === value after the first pass.
  if (changed.has('value')) {
    const sanitized = this._sanitize(this.value);
    if (sanitized !== this.value) {
      this.value = sanitized; // Schedules one more update
    }
  }
}

// DANGEROUS — unconstrained loop
override updated() {
  this.counter++; // Updates counter → triggers updated() → counter++ → ...
}
```

---

## `updateComplete`: The Completion Promise

`updateComplete` is a `Promise<boolean>` that resolves after the current update cycle has finished (including all `updated()` callbacks).

- Resolves with `true` if the update rendered.
- Resolves with `false` if `shouldUpdate()` returned `false`.
- Rejects if an unhandled error is thrown during the update cycle.

### Awaiting in Tests

This is the primary use case. Always await `updateComplete` before asserting DOM state:

```typescript
it('shows the error message when invalid', async () => {
  const el = await fixture<HxTextInput>(html`<hx-text-input required></hx-text-input>`);

  // Trigger validation
  el.reportValidity();
  // Wait for the reactive update to complete
  await el.updateComplete;

  const error = el.shadowRoot!.querySelector('.error-message');
  expect(error).not.toBeNull();
});
```

### Chaining Multiple Component Updates

When a parent change triggers a child to update, chain `updateComplete` promises:

```typescript
@customElement('hx-form-section')
export class HxFormSection extends LitElement {
  @query('hx-text-input')
  private _input!: HxTextInput;

  async validateAll(): Promise<boolean> {
    // Wait for this component to render
    await this.updateComplete;

    // Wait for the child component to render
    await this._input.updateComplete;

    return this._input.checkValidity();
  }
}
```

### Waiting for Multiple Components

```typescript
// Wait for all components to finish updating before proceeding
const components = Array.from(document.querySelectorAll('hx-card'));
await Promise.all(components.map((c) => c.updateComplete));
// All cards are now fully rendered
```

### Error Handling

```typescript
try {
  await element.updateComplete;
} catch (err) {
  // An error was thrown during render(), willUpdate(), or updated()
  console.error('Component update failed:', err);
}
```

---

## `hasUpdated`: The First-Render Guard

`hasUpdated` is a `boolean` property on every `LitElement`. It is `false` before the first render completes and `true` thereafter.

Use it when you need logic that differs between first render and subsequent renders, without using `firstUpdated()`:

```typescript
override updated(changed: PropertyValues) {
  if (!this.hasUpdated) {
    // This is the first render — skip expensive initialization
    // because firstUpdated() handles it
    return;
  }

  // This code only runs on subsequent updates
  if (changed.has('data')) {
    this._animateNewData();
  }
}
```

It is also useful inside `willUpdate()` to avoid computing derived state on the first render when you know defaults are already correct:

```typescript
override willUpdate(changed: PropertyValues) {
  if (!this.hasUpdated) return; // Skip on initial render

  if (changed.has('items')) {
    this._sortedItems = [...this.items].sort(this._comparator);
  }
}
```

---

## Advanced: `scheduleUpdate()` and `performUpdate()`

These two methods let you change **when** updates run. They are rarely needed but powerful when you have specific scheduling requirements.

### `scheduleUpdate()`: Changing Update Timing

Override `scheduleUpdate()` to control when `performUpdate()` is called. The default implementation uses `Promise.resolve()` (microtask). Returning a Promise defers the update until that Promise resolves.

**Deferring to the next animation frame:**

```typescript
@customElement('hx-animation-sync')
export class HxAnimationSync extends LitElement {
  protected override async scheduleUpdate(): Promise<unknown> {
    // Wait for the next animation frame before rendering
    // This prevents mid-frame updates and reduces jank
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return super.scheduleUpdate();
  }
}
```

**Throttling updates to a maximum rate:**

```typescript
@customElement('hx-throttled-chart')
export class HxThrottledChart extends LitElement {
  private _lastScheduled = 0;
  private static readonly _MIN_INTERVAL_MS = 100; // Max 10 renders/sec

  protected override scheduleUpdate(): Promise<unknown> {
    const now = Date.now();
    const elapsed = now - this._lastScheduled;
    const remaining = HxThrottledChart._MIN_INTERVAL_MS - elapsed;

    if (remaining <= 0) {
      this._lastScheduled = now;
      return super.scheduleUpdate();
    }

    // Delay the update
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this._lastScheduled = Date.now();
        resolve();
      }, remaining);
    }).then(() => super.scheduleUpdate());
  }
}
```

### `performUpdate()`: Running the Cycle Synchronously

`performUpdate()` executes the full update cycle — `shouldUpdate`, `willUpdate`, `update`, `render`, `firstUpdated`, `updated`. Calling it directly forces a synchronous render without waiting for the microtask queue.

```typescript
// Force an immediate synchronous render (rare — prefer awaiting updateComplete)
element.performUpdate();
```

This is occasionally needed when you need the DOM updated synchronously before measuring layout, and you cannot use `await`:

```typescript
@customElement('hx-print-preview')
export class HxPrintPreview extends LitElement {
  @property({ type: Object }) data: ReportData | null = null;

  print() {
    // Update data synchronously, then print immediately
    this.data = this._generateReportData();
    // Force immediate render — print dialog needs current DOM
    this.performUpdate();
    window.print();
  }
}
```

**Caution:** Calling `performUpdate()` while an update is already pending can cause the update to run twice. Prefer `await updateComplete` wherever possible.

---

## The `changedProperties` Map

Every lifecycle method in the update cycle receives a `PropertyValues` Map (which is `Map<PropertyKey, unknown>` with a typed helper). Each entry maps a property key to its **previous value** (before the change).

```typescript
override willUpdate(changed: PropertyValues) {
  // Check if a specific property is in the current change set
  if (changed.has('status')) {
    const previousStatus = changed.get('status') as string;
    const currentStatus = this.status; // The new value is on `this`
    console.log(`status: ${previousStatus} → ${currentStatus}`);
  }
}
```

**Iterating all changes:**

```typescript
override updated(changed: PropertyValues) {
  for (const [key, oldValue] of changed) {
    console.log(`${String(key)}: ${String(oldValue)} → ${String(this[key as keyof this])}`);
  }
}
```

The Map only contains properties that **actually changed** in the current cycle. If `firstName` did not change, `changed.has('firstName')` is `false` even if `firstName` is a reactive property.

---

## Lifecycle Method Cheat Sheet

| Method                  | Runs                | SSR-safe | DOM Access | Use For                        |
| ----------------------- | ------------------- | -------- | ---------- | ------------------------------ |
| `shouldUpdate(changed)` | Before every render | Yes      | No         | Skip render conditionally      |
| `willUpdate(changed)`   | Before every render | Yes      | No         | Compute derived state          |
| `update(changed)`       | Every render        | No       | Limited    | Rarely override                |
| `render()`              | Every render        | Yes      | No         | Return template                |
| `firstUpdated(changed)` | First render only   | No       | Yes        | One-time DOM setup             |
| `updated(changed)`      | Every render        | No       | Yes        | DOM side effects, events       |
| `updateComplete`        | N/A (Promise)       | N/A      | N/A        | Await completion in tests/code |

---

## References

- [Lit Lifecycle](https://lit.dev/docs/components/lifecycle/)
- [Lit Reactive Properties](https://lit.dev/docs/components/properties/)
- [Component Lifecycle In-Depth](/components/fundamentals/lifecycle/) — Full walkthrough of the custom element and reactive lifecycle
- [Properties vs Attributes](/components/fundamentals/properties-vs-attributes/) — Understanding @property options
