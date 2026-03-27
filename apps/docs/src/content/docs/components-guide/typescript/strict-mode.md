---
title: Strict Mode TypeScript
description: Write HELiX components under strict TypeScript settings — handling definite assignment, null checks, and implicit any in a Lit 3.x context.
---

HELiX compiles with `strict: true` plus several additional strictness flags. This page explains what each setting means for component authoring and the patterns that keep code clean under all of them.

## HELiX `tsconfig.base.json`

The project baseline is:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

`strict: true` enables the entire family of strict checks. The additional flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) push further.

## `strictPropertyInitialization` — Definite Assignment

`strictPropertyInitialization` requires every class property to be initialized in the constructor or via a field initializer. Lit components break this rule in two common situations.

### `ElementInternals` in the constructor

```typescript
// ERROR: Property '_internals' has no initializer and is not definitely
// assigned in the constructor.
private _internals: ElementInternals;

// CORRECT: Definite assignment assertion — you know attachInternals()
// always runs before any method accesses _internals.
private _internals!: ElementInternals;

constructor() {
  super();
  this._internals = this.attachInternals();
}
```

The `!` is an assertion to the TypeScript compiler that you, the author, guarantee the property will be set before it is read. Use it only when that guarantee is real. The `HelixElement` base class uses a lazy private field approach instead:

```typescript
// HelixElement pattern — lazy, no assertion needed
#internals: ElementInternals | undefined;

get _internals(): ElementInternals {
  if (!this.#internals) {
    this.#internals = this.attachInternals();
  }
  return this.#internals;
}
```

### `@query` decorated shadow DOM references

`@query` returns `null` when the element is not in the DOM. Annotate accordingly:

```typescript
import { LitElement, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = [tokenStyles];

  // Correctly typed as nullable — the element may not exist yet
  @query('input')
  private _input: HTMLInputElement | null = null;

  // Use optional chaining everywhere you access _input
  focus(): void {
    this._input?.focus();
  }

  override render() {
    return html`<input type="text" />`;
  }
}
```

## `strictNullChecks` — Handling Possibly-Null Shadow DOM Queries

With `strictNullChecks: true`, the TypeScript compiler tracks `null` and `undefined` through every assignment. Shadow DOM queries always have a nullable type.

```typescript
import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-select')
export class HelixSelect extends LitElement {
  static override styles = [tokenStyles];

  @query('select')
  private _select: HTMLSelectElement | null = null;

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    // Null-safe: if _select is null, this is a no-op
    this._select?.setAttribute('aria-expanded', 'false');
  }

  // Non-null assertion only when you are certain the element exists
  // (e.g., called from a user event, which guarantees the shadow DOM is rendered)
  private _handleChange(e: Event): void {
    const select = this._select!; // safe: called from a DOM event on the rendered element
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: select.value },
      }),
    );
  }

  override render() {
    return html`<select @change=${this._handleChange}><slot></slot></select>`;
  }
}
```

Prefer optional chaining (`?.`) over non-null assertion (`!`) wherever possible. Reserve `!` for situations where you have absolute certainty from context.

## `noImplicitAny` — Typing Event Handlers

Without explicit types, event handler parameters default to `any`, which TypeScript permits but HELiX's linter rejects. Always annotate them:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-file-input')
export class HelixFileInput extends LitElement {
  static override styles = [tokenStyles];

  // Correctly typed — no implicit any
  private _handleChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    this.dispatchEvent(
      new CustomEvent<{ files: FileList }>('hx-file-change', {
        bubbles: true,
        composed: true,
        detail: { files },
      }),
    );
  }

  private _handleDrop(e: DragEvent): void {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    // handle dropped files
  }

  override render() {
    return html`
      <div @drop=${this._handleDrop} @dragover=${(e: DragEvent) => e.preventDefault()}>
        <input type="file" @change=${this._handleChange} />
      </div>
    `;
  }
}
```

## `exactOptionalPropertyTypes`

With `exactOptionalPropertyTypes: true`, TypeScript distinguishes between a property that is absent and one set to `undefined`. This matters when building component option objects:

```typescript
// With exactOptionalPropertyTypes, these are NOT interchangeable:
interface ButtonOptions {
  href?: string;       // may be absent — not the same as href: undefined
}

// This fails — explicitly setting to undefined is different from omission
const opts: ButtonOptions = { href: undefined }; // ERROR with exactOptionalPropertyTypes

// Correct: either omit the key, or add undefined to the union explicitly
interface ButtonOptions {
  href?: string | undefined;
}
```

In HELiX components, `@property` fields that can be absent use `undefined` in the type union explicitly:

```typescript
@property({ type: String })
href: string | undefined = undefined;

@property({ type: String })
target: string | undefined = undefined;
```

## Next Steps

- [Typing Web Components](/components-guide/typescript/typing-components/) — `@property()` types and `PropertyValues<this>`
- [Generic Components](/components-guide/typescript/generics/) — parameterized component classes
- [Declaration Files](/components-guide/typescript/declaration-files/) — `.d.ts` generation and publishing
