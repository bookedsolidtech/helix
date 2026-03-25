# @helixui/adopted-stylesheets

Framework-agnostic adopted stylesheets registry for the HELiX enterprise healthcare web component library.

Provides:

- Content-hash deduplication via `createStyleSheet` — identical CSS always reuses the same `CSSStyleSheet` object
- Reference-counted lifecycle via `adoptStyles` / `removeStyles` — sheets are removed from `adoptedStyleSheets` only when every consumer has disconnected
- Lit `ReactiveController` wrapper — `AdoptedStylesheetsController` for zero-boilerplate integration
- SSR fallback — SSR guards on every browser API; `createStyleSheetSSR` returns raw CSS strings for `<style>` tag emission

---

## Installation

```bash
pnpm add @helixui/adopted-stylesheets
```

Lit is an optional peer dependency. Install it only when using `AdoptedStylesheetsController`:

```bash
pnpm add lit
```

---

## Usage

### Lit (ReactiveController)

The recommended pattern for Lit elements. The controller handles `hostConnected` / `hostDisconnected` automatically.

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  AdoptedStylesheetsController,
  createStyleSheet,
} from '@helixui/adopted-stylesheets';

// Create once at module level — deduplication ensures one CSSStyleSheet
// regardless of how many element instances are created.
const globalTokenSheet = createStyleSheet(`
  :root {
    --hx-color-primary: #2563EB;
    --hx-spacing-md: 1rem;
  }
`);

@customElement('my-element')
class MyElement extends LitElement {
  // The controller adopts globalTokenSheet on the element's root node when
  // connected, and removes it (ref-counted) when disconnected.
  private _globalStyles = new AdoptedStylesheetsController(this, globalTokenSheet);

  render() {
    return html`<slot></slot>`;
  }
}
```

Multiple controllers can share the same sheet. The sheet is removed from `adoptedStyleSheets` only when every controller has disconnected.

---

### Vanilla JS (adoptStyles / removeStyles)

Use the low-level API for non-Lit environments or manual lifecycle management.

```ts
import { adoptStyles, removeStyles, createStyleSheet } from '@helixui/adopted-stylesheets';

const sheet = createStyleSheet(':root { --color-brand: #2563EB; }');

// Adopt on a shadow root
const el = document.createElement('div');
const shadow = el.attachShadow({ mode: 'open' });
adoptStyles(shadow, sheet);

// Adopt on document
adoptStyles(document, sheet);

// Reference counting: remove from shadow → count drops to 1, sheet stays on document
removeStyles(shadow, sheet);

// Remove from document → count drops to 0, sheet removed
removeStyles(document, sheet);
```

---

### React (custom hook pattern)

```tsx
import { useEffect } from 'react';
import { adoptStyles, removeStyles, createStyleSheet } from '@helixui/adopted-stylesheets';

// Create at module scope for deduplication.
const brandSheet = createStyleSheet(':root { --color-brand: #2563EB; }');

function useAdoptedStylesheet(
  ref: React.RefObject<HTMLElement | null>,
  sheet: CSSStyleSheet,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = el.getRootNode();
    if (!(root instanceof ShadowRoot || root instanceof Document)) return;
    adoptStyles(root, sheet);
    return () => removeStyles(root, sheet);
  }, [ref, sheet]);
}

// Usage in a component:
function BrandedSection() {
  const ref = useRef<HTMLDivElement>(null);
  useAdoptedStylesheet(ref, brandSheet);
  return <div ref={ref}>Hello</div>;
}
```

---

### SSR / Server-Side Rendering

`createStyleSheet` throws in SSR environments where `window` is not available. Use `createStyleSheetSSR` to obtain the raw CSS string and emit a `<style>` tag:

```ts
import { createStyleSheetSSR } from '@helixui/adopted-stylesheets';

// In a Next.js / Astro server component:
const cssText = createStyleSheetSSR(':root { --color-primary: #2563EB; }');
return `<style>${cssText}</style>`;
```

`adoptStyles` and `removeStyles` are silent no-ops in SSR, so they are safe to call unconditionally if you wrap the sheet creation separately.

---

## API Reference

### `createStyleSheet(css: string): CSSStyleSheet`

Creates or returns a cached `CSSStyleSheet` for the given CSS string. Identical CSS content always returns the same object instance.

**Throws** in SSR environments — use `createStyleSheetSSR` instead.

---

### `createStyleSheetSSR(css: string): string`

SSR-safe identity function. Returns the CSS string unchanged for use in `<style>` tag emission during server rendering.

---

### `adoptStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void`

Adopts one or more stylesheets on the given root, incrementing the reference count for each. A sheet is appended to `adoptedStyleSheets` only if not already present.

No-op in SSR environments.

---

### `removeStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void`

Decrements the reference count for each sheet. Removes the sheet from `adoptedStyleSheets` when the count reaches zero.

No-op in SSR environments.

---

### `getRefCount(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): number`

Returns the current reference count for a sheet on a given root. Useful for debugging and diagnostics.

---

### `getRootSheets(root: DocumentOrShadowRoot): CSSStyleSheet[]`

Returns all sheets currently tracked on a root.

---

### `class AdoptedStylesheetsController`

Lit `ReactiveController` that calls `adoptStyles` on `hostConnected` and `removeStyles` on `hostDisconnected`.

**Constructor:** `new AdoptedStylesheetsController(host, ...sheets)`

| Parameter | Type                              | Description                          |
| --------- | --------------------------------- | ------------------------------------ |
| `host`    | `ReactiveControllerHost & Element` | The Lit element that owns this controller |
| `sheets`  | `CSSStyleSheet[]`                  | One or more sheets to manage         |

---

### `clearStyleSheetCache(): void`

Clears the internal content-hash deduplication cache. **Test use only** — do not call in production.

### `clearRegistry(): void`

Clears the internal reference-count registry. **Test use only** — does not remove sheets from DOM roots.

---

## Design Principles

- **Zero runtime Lit dependency** — `lit-controller.ts` uses `import type` exclusively; the Lit package is not included in the runtime bundle for non-Lit consumers.
- **Content-hash deduplication** — uses a djb2 hash to key `CSSStyleSheet` instances. Collision probability is negligible for typical CSS payloads.
- **Reference counting over WeakRef** — reference counting provides deterministic cleanup with zero observable GC timing variance, which matters for healthcare UI correctness.
- **SSR safety** — every browser-dependent code path is guarded with `typeof window === 'undefined'`. No `window` access at module evaluation time.
