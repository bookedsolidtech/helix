# Audit Fix — Known CI Failure Patterns

These patterns have caused repeated CI failures across audit-fix features. Every agent working on an audit-fix MUST read this before writing any code.

---

## 1. Axe Violation: `aria-allowed-attr`

**Rule:** Elements must only use supported ARIA attributes.

**Common mistake:** Adding `aria-required` to a `<fieldset>` element.

```html
<!-- WRONG — fieldset has role="group" which does NOT support aria-required -->
<fieldset aria-required="true">

<!-- CORRECT — no aria-required on fieldset; use visual indicator + error message -->
<fieldset>
  <legend>Group label <span aria-hidden="true">*</span></legend>
```

**Other role/attribute mismatches to watch:**
- `role="group"` (fieldset, div) does NOT support: `aria-required`, `aria-checked`, `aria-selected`
- `role="presentation"` does NOT support any aria-* attributes
- `role="combobox"` DOES support: `aria-labelledby`, `aria-label`, `aria-expanded`, `aria-controls`, `aria-activedescendant`

---

## 2. Axe Violation: `aria-input-field-name`

**Rule:** Every ARIA input field (combobox, textbox, searchbox, spinbutton, slider) must have an accessible name.

**Common mistake:** Using `<label for="X">` where X is a `<div role="combobox">`. The HTML `for` attribute only works with native form elements — NOT with elements that have ARIA roles.

```ts
// WRONG — for= doesn't work on div[role=combobox]
html`<label for=${this._triggerId}>Label</label>
     <div id=${this._triggerId} role="combobox">...`

// CORRECT — use aria-labelledby pointing to the label's id
html`<label id=${this._labelId}>Label</label>
     <div role="combobox" aria-labelledby=${this._labelId}>...`
```

---

## 3. Axe Violation: `list`

**Rule:** `<ul>` and `<ol>` must only directly contain `<li>`, `<script>`, or `<template>` elements.

**The web component trap:** When `hx-*` custom elements are slotted into an `<ol>` or `<ul>`, axe sees them as non-`<li>` direct children — even though the custom element's shadow DOM renders `<li>` internally.

```ts
// WRONG — <ol><slot></slot></ol> with hx-list-item children fails axe
render() {
  return html`<ol><slot></slot></ol>`;
}

// CORRECT — use div[role="list"] instead
render() {
  return html`<div role="list"><slot></slot></div>`;
}
```

**And update any tests** that check for `<ul>` or `<ol>` element type — they should instead check `[part~="base"]` or `[role="list"]`.

---

## 4. Async Timing — `_show()` / `_hide()` methods

**The pattern that kills tests:** Registering event listeners or dispatching events AFTER `await` calls in async `_show()` methods. Tests do `await el.updateComplete` and then immediately check — they don't get a second await.

```ts
// WRONG — listener registered after two awaits; test fires event before it's registered
async _show() {
  this._visible = true;
  await this.updateComplete;
  await this._updatePosition(); // <-- test's continuation runs HERE
  document.addEventListener('keydown', this._handleKeydown); // TOO LATE
  this.dispatchEvent(new CustomEvent('hx-after-show', ...)); // TOO LATE
}

// CORRECT — listeners and events before or immediately after first await
async _show() {
  this._visible = true;
  // Register listener SYNCHRONOUSLY before any await
  document.addEventListener('keydown', this._handleKeydown);
  await this.updateComplete;
  // Dispatch events and set focus BEFORE _updatePosition
  this.dispatchEvent(new CustomEvent('hx-after-show', ...));
  bodyEl?.focus();
  // _updatePosition can go last — it doesn't affect test assertions
  await this._updatePosition();
}
```

**Rule of thumb:** If a test does `await el.updateComplete` then immediately checks something, that thing must be set up either synchronously or in the first microtask after `await this.updateComplete`.

---

## 5. Shadow DOM Focus — `document.activeElement` vs `shadowRoot.activeElement`

**The trap:** When a shadow DOM element receives focus, `document.activeElement` returns the **shadow host** (the custom element itself), NOT the internal focused element.

```ts
// WRONG — tests that check document.activeElement will get the custom element host
document.activeElement; // returns <hx-dialog>, not <button id="close">

// CORRECT — use shadowRoot.activeElement for internal focus
el.shadowRoot?.activeElement; // returns the actually focused element
```

**Consequence for focus trap:** Including shadow DOM elements (like a built-in close button) in a light DOM focus trap list causes Tab to focus the shadow host, not the internal button. The fix is to exclude shadow DOM elements from the focus trap list and let the native `<dialog>` tab order handle them.

---

## 6. Label + Input Double-Click (hx-change fires twice)

**The trap:** Wrapping `<input>` inside `<label @click=${handler}>`. When the label is clicked:
1. Label click fires → handler runs → dispatches event
2. Browser fires a **synthetic click** on the `<input>` → bubbles back to label → handler runs again

```ts
// WRONG — missing stopPropagation; double-fires on label click
@click=${(e: Event) => e.preventDefault()}

// CORRECT — prevent AND stop so synthetic input click doesn't re-trigger label
@click=${(e: Event) => {
  e.preventDefault();
  e.stopPropagation();
}}
```

---

## 7. Lit `@property({ type: Array })` Returns null on Bad JSON

When a `@property({ type: Array })` attribute receives invalid JSON (e.g. from Drupal), Lit's default converter tries `JSON.parse()` internally and returns `null` on failure — NOT an empty array, NOT the original string.

```ts
// WRONG — null.map() crashes
@property({ type: Array })
columns: Column[] = [];

// CORRECT — guard in willUpdate for both null and non-array
override willUpdate(changed: Map<string, unknown>) {
  if (changed.has('columns')) {
    if (typeof (this.columns as unknown) === 'string') {
      try { this.columns = JSON.parse(this.columns as unknown as string); }
      catch { this.columns = []; }
    } else if (!Array.isArray(this.columns)) {
      this.columns = [];
    }
  }
}
```

---

## 8. `@query` Decorator with `= null` Initializer (CRITICAL — Test Timeout)

**The trap:** Adding `= null` to a `@query`-decorated field creates an **own property** on the class instance that permanently shadows the decorator's prototype getter. The `@query` getter never runs, so the queried element is always `null`.

This causes `updateComplete` to never resolve if any lifecycle method passes the queried element to something like `ElementInternals.setValidity()` → **every test hangs at 30s timeout**.

```ts
// WRONG — = null shadows the @query getter; element is ALWAYS null
@query('.switch__track')
private _trackEl: HTMLButtonElement | null = null;

// CORRECT — non-null assertion; @query getter works properly
@query('.switch__track')
private _trackEl!: HTMLButtonElement;
```

**Why this happens:** With `experimentalDecorators: true` and `useDefineForClassFields: false` (our tsconfig), field initializers create own properties via `Object.defineProperty` that shadow the decorator's getter on the prototype.

**Rule:** NEVER add `= null` or any initializer to `@query`, `@queryAll`, or `@queryAsync` decorated fields. Always use `!` (non-null assertion).

**Also:** When you see existing `@query` fields using `!`, do NOT "fix" them to `| null = null` even if the AUDIT.md suggests removing non-null assertions. The `!` on `@query` fields is correct and required.

---

## 9. `setAttribute()` in Constructor (CRITICAL — Test Timeout)

**The trap:** Calling `this.setAttribute()`, `this.role = ...`, or any DOM mutation in a custom element's `constructor()` violates the [custom element spec](https://html.spec.whatwg.org/#custom-element-conformance). When the element is created via `innerHTML` (which our `fixture()` test helper uses), the HTML parser hangs.

```ts
// WRONG — setAttribute in constructor violates custom element spec
constructor() {
  super();
  this.setAttribute('role', 'radio');
}

// CORRECT — DOM mutations go in connectedCallback
override connectedCallback(): void {
  this.setAttribute('role', 'radio');
  super.connectedCallback();
}
```

**Rule:** Constructor must ONLY call `super()` and `this.attachInternals()`. All other initialization goes in `connectedCallback()` or `firstUpdated()`.

---

## 10. Running Tests in This Project

**CRITICAL:** Do NOT use `npx vitest run` or `npm run test` directly in the worktree. These can produce zombie Playwright processes.

**Safe verification pattern:**
```bash
npm run verify        # lint + format:check + type-check (always safe, always run)
npm run build:library # build confirmation (safe)
# DO NOT run vitest directly — CI will run the tests
```

**Trust CI:** Push your changes and let CI run the browser tests. If CI fails, read the log, fix the specific issue, push again.

---

## 11. Before Writing Any Component Code

1. Read the component's `AUDIT.md` fully
2. Read the component's existing `.ts`, `.styles.ts`, and `.test.ts` files
3. Check if any of the above patterns apply to your changes
4. Verify with `npm run verify` before pushing
5. Push and let CI validate — don't assume the tests pass without CI confirmation
