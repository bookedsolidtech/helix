---
title: Framework Wrapper Strategy
description: Why HELiX ships React wrappers, how CEM-driven auto-generation works, and when to use raw web components vs. the wrapper packages.
sidebar:
  order: 5
---

# Framework Wrapper Strategy

HELiX web components are standard custom elements — they work in any framework without modification. But for React teams, we also ship `@helixui/react`: a package of auto-generated React wrapper components that provide a native React development experience on top of the same battle-tested primitives.

## Why Wrappers?

Raw web components and React have a well-documented impedance mismatch:

| Problem | Impact |
|---------|--------|
| Custom events (`hx-click`) are not forwarded by React's synthetic event system | Requires `ref` + `addEventListener` boilerplate on every interactive component |
| Properties set via JSX become HTML string attributes, not DOM property assignments | Complex object props don't work without a `ref` |
| TypeScript has no built-in JSX types for custom element props or events | Every team maintains its own `helix.d.ts` type declaration file |
| React DevTools shows `<hx-button>` instead of a meaningful component name | Debugging component trees is harder |

The `@helixui/react` wrapper package solves all four problems while keeping a single implementation source — the web component itself.

### What You Get with Wrappers

```tsx
// Without wrapper — raw web component in React
'use client';
import { useRef, useEffect } from 'react';
import '@helixui/library/components/hx-button';

export function SaveButton({ onSave }: { onSave: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('hx-click', onSave);
    return () => el.removeEventListener('hx-click', onSave);
  }, [onSave]);
  return <hx-button ref={ref} variant="primary">Save</hx-button>;
}

// With wrapper — idiomatic React
'use client';
import { HxButton } from '@helixui/react';

export function SaveButton({ onSave }: { onSave: () => void }) {
  return <HxButton variant="primary" onHxClick={onSave}>Save</HxButton>;
}
```

## Architecture: CEM-Driven Auto-Generation

The wrapper package is generated automatically from the [Custom Elements Manifest (CEM)](/components/documentation/cem-fundamentals) — the machine-readable API description that HELiX generates for every component.

### How It Works

1. **CEM generation** — `pnpm run cem` reads each component's source, Lit `@property()`/`@customElement()` decorators, and JSDoc tags (`@fires`, `@slot`, `@csspart`, `@cssprop`), then generates `custom-elements.json`
2. **Wrapper generation** — The build pipeline reads `custom-elements.json` and uses `@lit/react`'s `createComponent` to produce a typed React wrapper for each component
3. **Event mapping** — Each `@fires` event in the CEM becomes a typed `on*` prop (e.g., `hx-click` → `onHxClick`)
4. **Type output** — The generator emits TypeScript declarations so consumers get full IntelliSense

The source of truth is always the web component. The React package is a thin, generated adapter — zero divergence, zero manual sync.

### `@lit/react` Under the Hood

`@helixui/react` is built on [`@lit/react`](https://lit.dev/docs/frameworks/react/), the official Lit-to-React bridge. `createComponent` handles:

- Property assignment via DOM APIs (not HTML attribute strings)
- Custom event forwarding to React callback props
- Ref forwarding to the underlying custom element
- React lifecycle compatibility

You don't need to install or configure `@lit/react` directly — `@helixui/react` bundles and re-exports the wrappers for you.

## Supported Frameworks

| Framework | Package | Status |
|-----------|---------|--------|
| React 18+ | `@helixui/react` | Shipping |
| Vue 3 | `@helixui/vue` | Planned |
| Angular | `@helixui/angular` | Planned |
| Svelte | `@helixui/svelte` | Planned |

Vue, Angular, and Svelte have much better native custom element support than React. Wrappers for those frameworks provide DX improvements (typed props, component names in DevTools) rather than correctness fixes.

## Raw Web Component vs. Wrapper

Both approaches use the same underlying component and produce identical rendered output. The choice is about developer experience.

### Use raw web components when

- You are in a plain HTML / no-build environment
- You are integrating with Drupal Twig templates
- You are using Vue, Angular, Svelte, or Astro (native CE support is excellent)
- You prefer minimal dependencies and are comfortable with `ref`-based event patterns
- You are building a server-rendered page where JavaScript is an enhancement

The library is published as ESM with bare dependency imports, so a browser-only setup needs an import map alongside the script tag. See the [Plain HTML / CDN guide](/framework-integration/html) for the full pattern. Short version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/css/helix-all.css" />
<script type="importmap">
{
  "imports": {
    "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js",
    "@helixui/tokens":  "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.0/dist/index.js",
    "@helixui/icons":   "https://cdn.jsdelivr.net/npm/@helixui/icons@1.0.0/dist/index.js",
    "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.6/+esm",
    "lit":              "https://cdn.jsdelivr.net/npm/lit@3/+esm",
    "lit/":             "https://cdn.jsdelivr.net/npm/lit@3/"
  }
}
</script>
<script type="module">import '@helixui/library';</script>

<hx-button variant="primary" id="save-btn">Save</hx-button>

<script>
  document.getElementById('save-btn').addEventListener('hx-click', () => {
    console.log('saved');
  });
</script>
```

### Use `@helixui/react` when

- You are building a React 18+ application or Next.js App Router project
- You want typed `onHxClick`, `onHxChange` callback props instead of `addEventListener` boilerplate
- You want React DevTools to show meaningful component names
- You want automatic ref forwarding to the underlying DOM element
- Your team's TypeScript config requires strict JSX types without manual `helix.d.ts` maintenance

```tsx
'use client';
import { useState } from 'react';
import { HxButton, HxTextInput } from '@helixui/react';

export function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <form>
      <HxTextInput
        label="Search"
        value={query}
        onHxInput={(event) =>
          setQuery((event as CustomEvent<{ value: string }>).detail.value)
        }
      />
      <HxButton variant="primary" onHxClick={() => onSearch(query)}>
        Search
      </HxButton>
    </form>
  );
}
```

## Comparison Table

| Feature | Raw WC | `@helixui/react` |
|---------|--------|-----------------|
| Works in any framework | Yes | React only |
| Custom event forwarding | Manual `addEventListener` | `onHxClick` prop |
| TypeScript JSX types | Manual `helix.d.ts` | Auto-generated, included |
| React DevTools display | `<hx-button>` | `<HxButton>` |
| Ref forwarding | Manual | Automatic |
| Bundle overhead | Zero | ~1 KB wrapper layer |
| Form participation | Yes | Yes (same element) |
| CSS parts / tokens | Yes | Yes (same element) |
| Slots | Yes | Yes (same element) |

## Next Steps

- [React Wrappers guide](/framework-integration/react-wrappers) — installation, usage patterns, and a complete example app
- [React Integration guide](/framework-integration/react) — raw web component patterns for React 18+
- [Next.js 15 guide](/framework-integration/nextjs) — SSR-safe patterns for App Router
