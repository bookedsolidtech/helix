---
title: Adopted Stylesheets
description: How to use @helixui/adopted-stylesheets to style light-DOM slotted content in Drupal and every other framework — with reference counting, SSR fallback, and per-component loading.
sidebar:
  order: 1
---

# Adopted Stylesheets

`@helixui/adopted-stylesheets` is the standard way to inject styles into the
light DOM — the host document or a shadow root — from any framework. It is the
**default pattern** for styling slotted content in HELiX, not an optional extra.

---

## Why This Exists

### Shadow DOM encapsulation vs. slotted content

HELiX components use Shadow DOM. Their internal styles are fully encapsulated —
external CSS cannot reach them, and their styles do not leak out. That is
exactly what you want for component internals.

Slotted content is different. When you write:

```html
<hx-card>
  <p>Patient vitals updated at 14:32.</p>
</hx-card>
```

The `<p>` lives in the **light DOM**, not the shadow DOM. The browser projects
it into the `<slot>` visually, but CSS targeting that `<p>` must come from the
host document or a stylesheet adopted on the shadow root — not from inside the
component.

This creates the **slotted content styling problem**: your application's base
typography, link styles, and content spacing need to reach light-DOM content
that sits inside a shadow tree.

### The Drupal slotted-content problem

Drupal's CMS content — body text, embedded images, internal links, formatted
lists — is **light-DOM HTML** that gets slotted into HELiX components. Without
a mechanism to adopt stylesheets into the relevant document root, that content
is unstyled inside components.

The `@phase2/outline-adopted-stylesheets-controller` package solved this for
the Outline design system. `@helixui/adopted-stylesheets` is the HELiX
successor: a framework-agnostic package with reference counting, content-hash
deduplication, and built-in SSR safety.

---

## Quick Start

### 1. Install

```bash
npm install @helixui/adopted-stylesheets
```

Lit is an optional peer dependency. Install it only if you use the Lit
controller:

```bash
npm install lit
```

### 2. Create a stylesheet and adopt it

```ts
import { createStyleSheet, adoptStyles } from '@helixui/adopted-stylesheets';

const sheet = createStyleSheet(`
  :root {
    --hx-color-primary: #2563EB;
  }
  p { margin-block: 0.75rem; }
  a { color: var(--hx-color-primary); text-decoration: underline; }
`);

adoptStyles(document, sheet);
```

That is the entire surface for vanilla JS. The sheet is deduplicated by
content hash — calling `createStyleSheet` twice with identical CSS returns the
same `CSSStyleSheet` object.

---

## Patterns by Framework

### Vanilla JS

Use `adoptStyles` / `removeStyles` directly for manual lifecycle control.

```ts
import {
  createStyleSheet,
  adoptStyles,
  removeStyles,
} from '@helixui/adopted-stylesheets';

// Create once at module scope — identical CSS always reuses the same object.
const globalSheet = createStyleSheet(`
  :root { --hx-color-primary: #2563EB; }
  p { margin-block: 0.75rem; }
`);

// Adopt on the document for globally visible styles.
adoptStyles(document, globalSheet);

// Adopt on a shadow root to style slotted content within a specific component.
const host = document.querySelector('#my-host');
const shadow = host.attachShadow({ mode: 'open' });
adoptStyles(shadow, globalSheet);

// Reference counting: calling adoptStyles twice increments the count.
// The sheet is removed from adoptedStyleSheets only when removeStyles
// has been called the same number of times.
removeStyles(document, globalSheet);
removeStyles(shadow, globalSheet);
```

To adopt multiple sheets in one call:

```ts
import { createStyleSheet, adoptStyles } from '@helixui/adopted-stylesheets';

const tokenSheet = createStyleSheet(':root { --hx-color-primary: #2563EB; }');
const baseSheet = createStyleSheet('p { margin-block: 0.75rem; }');

adoptStyles(document, tokenSheet, baseSheet);
```

### Lit

Use `AdoptedStylesheetsController`. It calls `adoptStyles` on `hostConnected`
and `removeStyles` on `hostDisconnected` automatically.

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  AdoptedStylesheetsController,
  createStyleSheet,
} from '@helixui/adopted-stylesheets';

// Create at module scope — runs once, not per-instance.
const globalTokenSheet = createStyleSheet(`
  :root {
    --hx-color-primary: #2563EB;
    --hx-spacing-md: 1rem;
  }
`);

@customElement('my-element')
class MyElement extends LitElement {
  // Adopts globalTokenSheet when connected; removes it (ref-counted) when disconnected.
  private _globalStyles = new AdoptedStylesheetsController(this, globalTokenSheet);

  render() {
    return html`<slot></slot>`;
  }
}
```

Multiple elements sharing the same sheet are safe — the reference count
prevents double-adoption and only removes the sheet when the last element
disconnects.

To manage multiple sheets in one controller:

```ts
private _styles = new AdoptedStylesheetsController(
  this,
  globalTokenSheet,
  baseTypographySheet,
);
```

### React

Use a `useEffect` hook to adopt styles on mount and remove them on unmount.

```tsx
import { useEffect, useRef } from 'react';
import {
  createStyleSheet,
  adoptStyles,
  removeStyles,
} from '@helixui/adopted-stylesheets';

// Create at module scope for deduplication.
const brandSheet = createStyleSheet(`
  :root { --brand-color: #2563EB; }
  p { margin-block: 0.75rem; }
`);

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

// Usage:
function BrandedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useAdoptedStylesheet(ref, brandSheet);
  return <div ref={ref}>{children}</div>;
}
```

For global document-level adoption, call `adoptStyles(document, sheet)` at
module scope — outside any component — so it runs once on load.

```ts
// app/globals.ts — import this at your app entry point
import { createStyleSheet, adoptStyles } from '@helixui/adopted-stylesheets';
import styles from './base.css?inline';

const baseSheet = createStyleSheet(styles);
adoptStyles(document, baseSheet);
```

### Vue

Use a composable to manage the stylesheet lifecycle.

```ts
// composables/useAdoptedStylesheet.ts
import { onMounted, onUnmounted, type Ref } from 'vue';
import {
  createStyleSheet,
  adoptStyles,
  removeStyles,
} from '@helixui/adopted-stylesheets';

export function useAdoptedStylesheet(
  elRef: Ref<HTMLElement | null>,
  sheet: CSSStyleSheet,
): void {
  onMounted(() => {
    const root = elRef.value?.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      adoptStyles(root, sheet);
    }
  });

  onUnmounted(() => {
    const root = elRef.value?.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      removeStyles(root, sheet);
    }
  });
}
```

```vue
<!-- BrandedSection.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { createStyleSheet } from '@helixui/adopted-stylesheets';
import { useAdoptedStylesheet } from '@/composables/useAdoptedStylesheet';

const sheet = createStyleSheet(':root { --brand-color: #2563EB; }');
const el = ref<HTMLElement | null>(null);
useAdoptedStylesheet(el, sheet);
</script>

<template>
  <div ref="el">
    <slot />
  </div>
</template>
```

### Drupal

Drupal's content is Twig-rendered HTML slotted into HELiX components. The
typical pattern is a **Drupal behavior** that adopts shared stylesheets once on
page load.

#### Twig macro

Expose the component from Twig and pass CMS content into slots:

```twig
{# templates/hx-card--article.html.twig #}
<hx-card class="article-card">
  <h2 slot="header">{{ node.title }}</h2>
  <div slot="content" class="article-body">
    {{ content.body }}
  </div>
</hx-card>
```

#### Drupal behavior

```js
// js/helix-adopted-styles.behavior.js
(function (Drupal) {
  'use strict';

  // Import is ESM — use a script type="module" or dynamic import.
  let globalSheet;

  async function ensureSheet() {
    if (globalSheet) return globalSheet;
    const { createStyleSheet } = await import('@helixui/adopted-stylesheets');
    globalSheet = createStyleSheet(`
      p { margin-block: 0.75rem; line-height: 1.6; }
      a { color: var(--hx-color-primary); text-decoration: underline; }
      ul, ol { padding-inline-start: 1.5rem; }
      img { max-width: 100%; height: auto; }
    `);
    return globalSheet;
  }

  Drupal.behaviors.helixAdoptedStyles = {
    attach: async function (context) {
      const sheet = await ensureSheet();
      // Adopt on document so slotted content inherits these styles.
      const { adoptStyles } = await import('@helixui/adopted-stylesheets');
      adoptStyles(document, sheet);
    },
  };
})(Drupal);
```

#### `libraries.yml`

Declare the behavior as a Drupal library so it loads alongside your components:

```yaml
# helix_components.libraries.yml
helix-adopted-styles:
  version: 1.0.0
  js:
    js/helix-adopted-styles.behavior.js:
      type: module
      preprocess: false
  dependencies:
    - core/drupal
```

Attach the library in your theme's `*.info.yml` or from a specific template:

```yaml
# mytheme.info.yml
libraries:
  - helix_components/helix-adopted-styles
```

Or from a Twig template:

```twig
{{ attach_library('helix_components/helix-adopted-styles') }}
```

---

## Per-Component CSS Loading

Import only the stylesheets you need. The package does not bundle CSS — you
control what gets adopted:

```ts
import {
  createStyleSheet,
  adoptStyles,
} from '@helixui/adopted-stylesheets';

// Each call is deduplicated by content hash.
// Importing the same CSS string twice returns the same CSSStyleSheet.
const buttonSheet = createStyleSheet(`
  hx-button::part(button) { border-radius: 0; }
`);

const cardSheet = createStyleSheet(`
  hx-card { --hx-card-shadow: 0 4px 24px rgba(0,0,0,0.12); }
`);

adoptStyles(document, buttonSheet, cardSheet);
```

When building for Drupal with per-component loading (see
[ADR-002: Drupal Component Loading Strategy](/guides/drupal-component-loading-strategy)),
each component can adopt its own stylesheet in its Drupal behavior:

```js
// Loads only when the component is on the page.
Drupal.behaviors.hxCardStyles = {
  attach: async function (context) {
    if (!context.querySelector('hx-card')) return;
    const { createStyleSheet, adoptStyles } = await import('@helixui/adopted-stylesheets');
    adoptStyles(document, createStyleSheet(`hx-card { ... }`));
  },
};
```

---

## SSR Pattern

`createStyleSheet` calls `new CSSStyleSheet()` internally and throws in SSR
environments where `window` is undefined. Use `createStyleSheetSSR` instead:

```ts
import {
  createStyleSheetSSR,
  createStyleSheet,
  adoptStyles,
} from '@helixui/adopted-stylesheets';

const CSS = `
  :root { --hx-color-primary: #2563EB; }
  p { margin-block: 0.75rem; }
`;

// Server (Next.js, Astro, Nuxt server component):
export function ServerLayout({ children }: { children: React.ReactNode }) {
  const cssText = createStyleSheetSSR(CSS);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      {children}
    </>
  );
}

// Client (same file, hydration):
if (typeof window !== 'undefined') {
  const sheet = createStyleSheet(CSS);
  adoptStyles(document, sheet);
}
```

`adoptStyles` and `removeStyles` are silent no-ops in SSR, so you can call
them unconditionally in isomorphic code without guards.

For more SSR patterns across Next.js, Astro, and Nuxt, see the
[SSR & Hydration Guide](/integration/ssr).

---

## Performance

### Deduplication

`createStyleSheet` uses a djb2 content hash to key `CSSStyleSheet` instances.
Identical CSS strings always return the same object — no duplicate allocations
regardless of how many components or modules import the same CSS.

```ts
const a = createStyleSheet('p { color: red; }');
const b = createStyleSheet('p { color: red; }');
console.log(a === b); // true — same object
```

### Reference counting

`adoptStyles` increments a per-root reference count for each sheet. `removeStyles`
decrements it. The sheet is removed from `adoptedStyleSheets` only when the
count reaches zero — the last consumer that adopted it has disconnected.

This prevents two bugs:
1. **Premature removal** — component A removes a sheet that component B still needs.
2. **Orphaned sheets** — sheets that live forever because no cleanup mechanism exists.

```ts
// Component A and B both adopt the same sheet.
adoptStyles(document, sheet); // count = 1
adoptStyles(document, sheet); // count = 2

// A disconnects — count drops to 1, sheet stays.
removeStyles(document, sheet);

// B disconnects — count drops to 0, sheet removed from adoptedStyleSheets.
removeStyles(document, sheet);
```

### Memory management

The internal registry uses a plain `Map<DocumentOrShadowRoot, Map<CSSStyleSheet, number>>`.
Entries are deleted when their reference count reaches zero, so the registry
self-prunes. There is no manual cleanup required in production.

For tests only: `clearStyleSheetCache()` clears the deduplication cache and
`clearRegistry()` clears the reference-count registry. Never call either in
production.

---

## Migration from `@phase2/outline-adopted-stylesheets-controller`

The Outline-era controller was Lit-specific and lacked reference counting. The
API migration is minimal.

### API comparison

| Feature | `@phase2/outline-adopted-stylesheets-controller` | `@helixui/adopted-stylesheets` |
|---|---|---|
| Lit controller | `AdoptedStylesheetsController` | `AdoptedStylesheetsController` |
| Vanilla adoption | Not supported | `adoptStyles(root, ...sheets)` |
| React / Vue | Not supported | `useEffect` / composable patterns |
| SSR fallback | Not supported | `createStyleSheetSSR(css)` |
| Reference counting | No | Yes — sheets removed only when all consumers disconnect |
| Deduplication | No | Yes — content hash, identical CSS = same object |
| Per-sheet removal | No | `removeStyles(root, ...sheets)` |

### Upgrade path

1. **Replace the import**

```ts
// Before
import { AdoptedStylesheetsController } from '@phase2/outline-adopted-stylesheets-controller';

// After
import {
  AdoptedStylesheetsController,
  createStyleSheet,
} from '@helixui/adopted-stylesheets';
```

2. **Wrap raw CSS strings in `createStyleSheet`**

The Outline controller accepted a `CSSStyleSheet` or a CSS string depending on
the version. The HELiX controller requires a `CSSStyleSheet` instance — always
use `createStyleSheet`:

```ts
// Before (Outline — passing CSS string directly)
new AdoptedStylesheetsController(this, ':root { --color: red; }');

// After (HELiX — explicit createStyleSheet)
const sheet = createStyleSheet(':root { --color: red; }');
new AdoptedStylesheetsController(this, sheet);
```

3. **Remove cleanup workarounds**

If you had manual cleanup code to avoid Outline's lack of reference counting,
remove it. `@helixui/adopted-stylesheets` handles cleanup automatically.

4. **Uninstall the old package**

```bash
npm uninstall @phase2/outline-adopted-stylesheets-controller
```

---

## Troubleshooting

### Styles not applying to slotted content

Slotted content lives in the light DOM. Styles must be adopted on the
**host document** or the **shadow root** containing the `<slot>` — not inside
the component's own shadow root.

```ts
// Wrong: adopting on the wrong root
const hostShadow = myHost.shadowRoot;
adoptStyles(hostShadow, sheet); // Styles apply inside the component, not to slotted content

// Correct: adopt on document so all slotted content inherits the styles
adoptStyles(document, sheet);
```

### `createStyleSheet is not available in SSR environments`

You are calling `createStyleSheet` during server-side rendering. Use
`createStyleSheetSSR` instead, or guard the call:

```ts
const CSS = 'p { color: red; }';

// SSR-safe
const cssText = createStyleSheetSSR(CSS);

// Browser only
if (typeof window !== 'undefined') {
  const sheet = createStyleSheet(CSS);
  adoptStyles(document, sheet);
}
```

### Sheet not removed after component unmounts

Ensure you call `removeStyles` in the cleanup phase. For the Lit controller,
this is automatic via `hostDisconnected`. For vanilla JS and React `useEffect`,
return a cleanup function:

```ts
useEffect(() => {
  adoptStyles(document, sheet);
  return () => removeStyles(document, sheet); // ← required
}, []);
```

### Styles applied but inheritance broken inside Shadow DOM

CSS custom properties (design tokens like `--hx-color-primary`) cross the
shadow boundary through inheritance — standard CSS properties do not. If you
need to style slotted content _inside_ a specific shadow root, adopt the sheet
on that shadow root rather than the document:

```ts
const host = document.querySelector('hx-card');
adoptStyles(host.shadowRoot, sheet);
```

For cross-component global styles (typography, link colours, list spacing),
adopt on `document`. Custom properties defined on `:root` will inherit into
all shadow trees automatically.

### Multiple components, duplicate sheet adoption

This is safe. The reference counter tracks each `adoptStyles` call independently.
The sheet appears in `adoptedStyleSheets` exactly once regardless of how many
components have adopted it.

```ts
adoptStyles(document, sheet); // count → 1
adoptStyles(document, sheet); // count → 2, still one entry in adoptedStyleSheets
removeStyles(document, sheet); // count → 1, sheet stays
removeStyles(document, sheet); // count → 0, sheet removed
```

---

## API Reference

### `createStyleSheet(css: string): CSSStyleSheet`

Creates or returns a cached `CSSStyleSheet` for the given CSS string. Identical
CSS content always returns the same object instance (content-hash deduplication).

**Throws** in SSR environments. Use `createStyleSheetSSR` instead.

---

### `createStyleSheetSSR(css: string): string`

SSR-safe identity function. Returns the CSS string as-is for use in `<style>`
tag emission during server rendering.

---

### `adoptStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void`

Adopts one or more stylesheets on the given root, incrementing the reference
count for each. A sheet is appended to `adoptedStyleSheets` only if not already
present. Silent no-op in SSR.

---

### `removeStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void`

Decrements the reference count for each sheet. Removes the sheet from
`adoptedStyleSheets` when the count reaches zero. Silent no-op in SSR.

---

### `class AdoptedStylesheetsController`

Lit `ReactiveController` that calls `adoptStyles` on `hostConnected` and
`removeStyles` on `hostDisconnected`.

**Constructor:** `new AdoptedStylesheetsController(host, ...sheets)`

| Parameter | Type | Description |
|---|---|---|
| `host` | `ReactiveControllerHost & Element` | The Lit element that owns this controller |
| `sheets` | `CSSStyleSheet[]` | One or more sheets to manage |

---

### `getRefCount(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): number`

Returns the current reference count for a sheet on a given root. Returns `0`
if the sheet has never been adopted on that root. Useful for debugging.

---

### `getRootSheets(root: DocumentOrShadowRoot): CSSStyleSheet[]`

Returns all sheets currently tracked on a root. Returns `[]` in SSR.

---

### `clearStyleSheetCache(): void` _(test use only)_

Clears the content-hash deduplication cache. Do not call in production.

---

### `clearRegistry(): void` _(test use only)_

Clears the reference-count registry without removing sheets from DOM roots.
Do not call in production.
