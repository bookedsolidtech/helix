---
title: 'SSR & Hydration Guide'
description: 'Server-side rendering compatibility for HELiX web components across Next.js 15 App Router, Astro 5, and Nuxt 4.'
sidebar:
  order: 1
---

# SSR & Hydration Guide

HELiX web components are built on [Lit 3.x](https://lit.dev) and use the Custom Elements standard. This guide explains how they interact with server-side rendering across Next.js 15 App Router, Astro 5, and Nuxt 4.

## How Web Components Behave on the Server

When a server renders an unknown HTML element like `<hx-button>`, it produces the tag verbatim in the HTML output. The browser receives valid HTML and displays it as an undefined custom element (visually unstyled until the JavaScript loads). After the JS bundle executes and custom elements are registered, the element **upgrades** — it gets its Shadow DOM, styles, and behavior.

This means:

- **No crashes** from `customElements.define` not existing on the server
- **No hydration mismatches** from the tag itself — Next.js, Astro, and Nuxt all handle unknown HTML elements safely
- **Flash of unstyled content (FOUC)** if JS is deferred — mitigate with critical CSS or a `<link rel="modulepreload">`

The key constraint: **never import `@helixui/library` at module scope in code that runs on the server.** The `customElements` registry and browser APIs like `window` don't exist in Node.js.

## Component SSR Compatibility Reference

All 77 HELiX components fall into one of three categories:

### SSR Safe (43 components)

These components are purely presentational. Their HTML output is meaningful as static markup and they access no browser APIs in their rendering path.

Render these directly in Server Components (Next.js RSC, Astro server-rendered templates, Nuxt pages):

| Component | Notes |
|-----------|-------|
| `hx-avatar` | Display only |
| `hx-badge` | Display only |
| `hx-banner` | Static layout |
| `hx-button` | Form-associated; HTML renders without JS |
| `hx-button-group` | Layout wrapper |
| `hx-card` | Display container |
| `hx-checkbox` | Form-associated; renders as inert input without JS |
| `hx-checkbox-group` | Layout wrapper |
| `hx-container` | Layout wrapper |
| `hx-data-table` | Static table structure |
| `hx-divider` | Decorative |
| `hx-field-label` | Label element |
| `hx-file-upload` | Form-associated |
| `hx-form` | Wraps native form |
| `hx-grid` | Layout |
| `hx-help-text` | Display only |
| `hx-icon` | SVG display |
| `hx-icon-button` | Display only |
| `hx-image` | Display only |
| `hx-link` | Anchor element |
| `hx-list` | Display only |
| `hx-meter` | Display only |
| `hx-number-input` | Form-associated |
| `hx-pagination` | Display + navigation |
| `hx-progress-bar` | Display only |
| `hx-progress-ring` | Display only |
| `hx-prose` | Text container |
| `hx-radio-group` | Form-associated |
| `hx-rating` | Display/form |
| `hx-spinner` | Display only |
| `hx-stack` | Layout |
| `hx-stat` | Display only |
| `hx-status-indicator` | Display only |
| `hx-steps` | Display only |
| `hx-structured-list` | Display only |
| `hx-switch` | Form-associated |
| `hx-table` | Display only |
| `hx-tag` | Display only |
| `hx-text` | Typography |
| `hx-text-input` | Form-associated |
| `hx-textarea` | Form-associated |
| `hx-toggle-button` | Display only |
| `hx-visually-hidden` | Accessibility wrapper |

### Needs `'use client'` Boundary (33 components)

These components access browser APIs (`document`, `window`, `navigator`) in lifecycle hooks (`connectedCallback`, `firstUpdated`) or event handlers — not in their rendering path. They render as valid HTML on the server but need a client boundary for full interactivity.

**Strategy:** The HTML tag renders fine in RSC. Wrap event handling and `ref` usage in a `'use client'` component.

| Component | Browser APIs Used | Notes |
|-----------|------------------|-------|
| `hx-accordion` | `document.activeElement` | Focus management |
| `hx-action-bar` | `document.activeElement` | Keyboard navigation |
| `hx-alert` | `document.addEventListener` | Auto-dismiss timer |
| `hx-breadcrumb` | `document.createElement`, `document.head` | ⚠️ JSON-LD injection into `<head>` — client-side only |
| `hx-carousel` | `window.matchMedia` | Reduced-motion |
| `hx-code-snippet` | `navigator.clipboard` | Copy button |
| `hx-color-picker` | `document.addEventListener` | Pointer capture |
| `hx-combobox` | `document.activeElement`, `document.addEventListener` | Focus + outside-click |
| `hx-counter` | `window.matchMedia` | Animation timing |
| `hx-date-picker` | `document.addEventListener` | Outside-click, keyboard |
| `hx-dialog` | `document.activeElement` | Focus trap and return |
| `hx-drawer` | `window.matchMedia`, `document.activeElement` | Motion + focus |
| `hx-dropdown` | `document.addEventListener` | Outside-click |
| `hx-field` | `document.createElement` | Accessible description span |
| `hx-format-date` | `document.documentElement.lang`, `navigator.language` | ⚠️ See note below |
| `hx-menu` | `document.activeElement` | Type-ahead focus |
| `hx-nav` | `window.location.href` | Active link detection |
| `hx-overflow-menu` | `document.addEventListener` | Outside-click |
| `hx-popover` | `document.addEventListener`, `document.activeElement` | Focus trap |
| `hx-popup` | `window`, `document.getElementById` | Float positioning |
| `hx-select` | `document.addEventListener` | Outside-click |
| `hx-side-nav` | `document.activeElement` | Keyboard focus |
| `hx-skeleton` | `setTimeout`, `requestAnimationFrame` | Animation timing |
| `hx-slider` | `document.addEventListener` | Drag handlers |
| `hx-split-button` | `document.addEventListener` | Outside-click, keyboard |
| `hx-split-panel` | `document.addEventListener` | Resize drag |
| `hx-tabs` | `document.activeElement` | Arrow key navigation |
| `hx-theme` | `window.matchMedia` | Has SSR guard; safe |
| `hx-time-picker` | `document.addEventListener` | Outside-click |
| `hx-toast` | `document.body` | Stacking and positioning |
| `hx-tooltip` | `document.createElement`, `document.body` | Light DOM description |
| `hx-top-nav` | `window`, `document.addEventListener` | Scroll detection |
| `hx-tree-view` | `document.activeElement` | Tree keyboard nav |

> **`hx-format-date` special case:** This component calls `document.documentElement.lang` and `navigator.language` inside its `_getLocale()` method, which is called from `render()`. In standard browser-only Lit execution this is harmless, but it bypasses the public `lang` prop. Always pass `lang` explicitly to avoid the browser API lookup:
>
> ```html
> <!-- Always provide lang to avoid document.documentElement.lang lookup -->
> <hx-format-date lang="en-US" date="2026-01-15"></hx-format-date>
> ```

> **`hx-breadcrumb` JSON-LD note:** `hx-breadcrumb` injects a JSON-LD `<script>` into `document.head` for SEO structured data. This runs in `updated()` and requires a live `document.head`. If you need the JSON-LD for SEO in SSR, emit the structured data from your server instead and suppress the component's injection by omitting the `json-ld` attribute.

### Client Only (1 component)

| Component | Reason |
|-----------|--------|
| `hx-copy-button` | `navigator.clipboard.writeText` is only available in secure browser contexts |

Use `next/dynamic` with `ssr: false`, or wrap in `<ClientOnly>` / `<client-only>`.

---

## Next.js 15 App Router

### Recommended Pattern: Global HelixLoader

Register components once in a Client Component at the root. Server Components can then use `<hx-*>` tags freely.

```tsx
// components/helix-loader.tsx
'use client';

import { useEffect } from 'react';

export function HelixLoader() {
  useEffect(() => {
    import('@helixui/library');
  }, []);
  return null;
}
```

```tsx
// app/layout.tsx  — Server Component
import { HelixLoader } from '@/components/helix-loader';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HelixLoader />
        {children}
      </body>
    </html>
  );
}
```

Server Components can now render HELiX tags as static HTML:

```tsx
// app/dashboard/page.tsx  — Server Component (no 'use client')
export default async function DashboardPage() {
  const data = await fetchData();
  return (
    <main>
      <hx-card>
        <hx-text slot="heading">{data.title}</hx-text>
        <hx-badge variant="success">Active</hx-badge>
      </hx-card>
    </main>
  );
}
```

### Interactive Components: Client Boundary

For components needing event listeners, create a thin `'use client'` wrapper:

```tsx
// components/patient-form.tsx
'use client';

import { useRef, useEffect } from 'react';

export function PatientForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handler = (e: Event) => {
      e.preventDefault();
      // FormData picks up hx-text-input values via ElementInternals
      onSubmit(new FormData(form as HTMLFormElement));
    };
    form.addEventListener('submit', handler);
    return () => form.removeEventListener('submit', handler);
  }, [onSubmit]);

  return (
    <hx-form ref={formRef}>
      <hx-text-input name="name" label="Patient name" required />
      <hx-text-input name="dob" type="date" label="Date of birth" required />
      <hx-button type="submit" variant="primary">Save</hx-button>
    </hx-form>
  );
}
```

### `next/dynamic` for Client-Only Components

For `hx-copy-button` or page-specific heavy components, use `next/dynamic`:

```tsx
import dynamic from 'next/dynamic';

const CopyButton = dynamic(
  () => import('@helixui/library/components/hx-copy-button').then(() => {
    // Return a wrapper that renders the element
    return function HxCopyButtonWrapper(props: { value: string }) {
      return <hx-copy-button value={props.value} />;
    };
  }),
  { ssr: false, loading: () => null }
);
```

### Trip-Planner Checklist

If you are the trip-planner team integrating HELiX into Next.js 15:

- [ ] Add `HelixLoader` to `app/layout.tsx`
- [ ] Add `transpilePackages: ['@helixui/library']` to `next.config.ts` if you see ESM warnings
- [ ] Create `src/helix.d.ts` with JSX intrinsic element types (see [Next.js guide](/framework-integration/nextjs))
- [ ] Use `ref` + `addEventListener` for all `hx-*` custom events (not React's `onClick`)
- [ ] Pass `lang` explicitly to `hx-format-date` — do not rely on `document.documentElement.lang`
- [ ] Use `next/dynamic` with `ssr: false` for `hx-copy-button`

---

## Astro 5

Astro's island architecture is a natural fit for web components.

### Global registration via `<script>`

Register HELiX in your base layout:

```astro
---
// src/layouts/Base.astro
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{Astro.props.title}</title>
  </head>
  <body>
    <slot />
    <script>
      import '@helixui/library';
    </script>
  </body>
</html>
```

The `<script>` tag is bundled by Vite and runs only in the browser — no Node.js execution.

### Server-rendered pages

Use HELiX tags directly in `.astro` files. They render as inert HTML on the server and upgrade in the browser:

```astro
---
const patients = await fetchPatients();
---
<ul>
  {patients.map(p => (
    <li>
      <hx-card>
        <hx-text slot="heading">{p.name}</hx-text>
        <hx-badge variant={p.status === 'active' ? 'success' : 'neutral'}>
          {p.status}
        </hx-badge>
      </hx-card>
    </li>
  ))}
</ul>
```

### Interactive islands

For components needing JavaScript interactivity, use `client:load` or `client:visible`:

```astro
---
import PatientSearch from './PatientSearch.tsx';
---

<!-- Loads and hydrates immediately -->
<PatientSearch client:load />

<!-- Loads when visible in viewport (lazy) -->
<PatientSearch client:visible />
```

Inside the island component (React/Solid/Vue), use standard HELiX patterns.

### Reduced-motion and SSR in Astro

Components like `hx-carousel`, `hx-counter`, and `hx-drawer` access `window.matchMedia` in `connectedCallback`. Astro does not run `connectedCallback` during SSR — this is safe.

---

## Nuxt 4

### Client plugin for global registration

Create a Nuxt client plugin to register HELiX components:

```ts
// plugins/helix.client.ts
export default defineNuxtPlugin(async () => {
  if (process.client) {
    await import('@helixui/library');
  }
});
```

The `.client.ts` suffix ensures this plugin only runs in the browser. No `customElements` error in SSR.

### Using components in pages

After the plugin loads, use HELiX tags anywhere:

```vue
<!-- pages/dashboard.vue -->
<template>
  <main>
    <hx-card v-for="item in items" :key="item.id">
      <hx-text slot="heading">{{ item.title }}</hx-text>
    </hx-card>
  </main>
</template>
```

### Client-only wrapper for browser-dependent components

For `hx-copy-button` or components you want to delay until after hydration:

```vue
<template>
  <ClientOnly>
    <hx-copy-button :value="codeSnippet" />
    <template #fallback>
      <hx-spinner />
    </template>
  </ClientOnly>
</template>
```

### Event handling in Vue

Nuxt/Vue does not forward web component custom events through `v-on`. Use a template ref:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const buttonRef = ref(null);

function handleClick(e) {
  console.log('hx-click', e.detail);
}

onMounted(() => {
  buttonRef.value?.addEventListener('hx-click', handleClick);
});
onUnmounted(() => {
  buttonRef.value?.removeEventListener('hx-click', handleClick);
});
</script>

<template>
  <hx-button ref="buttonRef" variant="primary">Save</hx-button>
</template>
```

---

## Declarative Shadow DOM (DSD)

Lit 3.x supports [Declarative Shadow DOM](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom) via `@lit-labs/ssr`. This allows the Shadow DOM to be rendered in server HTML, eliminating FOUC entirely.

**Current status: not recommended for production.**

Two HELiX components have known blockers for streaming SSR:

1. **`hx-format-date`** — calls `document.documentElement.lang` inside `render()`. Pass an explicit `lang` prop to work around this.
2. **`hx-breadcrumb`** — injects `<script type="application/ld+json">` into `document.head` in `updated()`. Incompatible with streaming SSR where `<head>` is already sent.

Until these are resolved and `@lit-labs/ssr` is integrated into the build pipeline, use the `'use client'` / island patterns above.

---

## Hydration Mismatch Prevention

### What causes mismatches

Hydration mismatches occur when the server-rendered HTML differs from what the client-side JavaScript produces on first render. For HELiX, the common culprits are:

**1. Dynamic values that differ between server and client**

```tsx
// Bad — different values server vs client
<hx-card data-rendered-at={Date.now()}>...</hx-card>

// Good — stable server-safe value
<hx-card data-id={item.id}>...</hx-card>
```

**2. Checking `typeof window` to conditionally render**

```tsx
// Bad — boolean flips between SSR and browser
<hx-button disabled={typeof window === 'undefined'}>...</hx-button>

// Good — mount guard
'use client';
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return <hx-button disabled={!mounted || undefined}>...</hx-button>;
```

**3. Locale-dependent rendering without explicit locale**

```tsx
// Bad — hx-format-date falls back to document.documentElement.lang
<hx-format-date date="2026-01-15" />

// Good — explicit locale from server
<hx-format-date lang={locale} date="2026-01-15" />
```

### Suppressing unavoidable warnings

If a third-party wrapper produces unavoidable warnings, use `suppressHydrationWarning` on the wrapper element only (not broadly):

```tsx
<div suppressHydrationWarning>
  <hx-some-component />
</div>
```

Use sparingly — it hides real bugs too.

---

## Audit Report

The full per-component SSR compatibility data is in `.automaker/audits/ssr-hydration-audit-2026-03-24.json`. This includes:
- Per-component browser API usage
- SSR category classification
- Per-framework recommendations
- Known `@lit-labs/ssr` blockers

---

## Next Steps

- [Next.js 15 App Router Integration](/framework-integration/nextjs) — full guide with Server Actions and TypeScript
- [React Integration](/framework-integration/react) — React 18+ patterns
- [Astro Integration](/framework-integration/astro) — Astro 5 islands
- [Vue Integration](/framework-integration/vue) — Vue 3 / Nuxt patterns
- [Design Tokens](/design-tokens/overview) — theming in SSR contexts
