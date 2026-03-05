---
title: SSR/SSG Compatibility
description: Server-side rendering and static site generation compatibility matrix for HELiX web components across Next.js, Nuxt, Astro, SvelteKit, and Angular Universal.
---

# SSR/SSG Compatibility

HELiX components are Lit 3.x web components. They rely on browser APIs (`customElements`, `shadowRoot`, `attachShadow`) that do not exist in Node.js server environments. This page documents the compatibility status and recommended patterns for each meta-framework.

---

## Why SSR is Complicated for Web Components

When a server renders HTML, it runs JavaScript in Node.js — a browser-API-free environment. `customElements.define()` throws in Node.js. This means:

1. **Registration fails on the server** — the import of `@wc-2026/library` will throw unless guarded
2. **Shadow DOM cannot be serialized** — the browser-native shadow DOM API has no Node.js equivalent
3. **Hydration requires re-registration** — the client must re-define elements when the JS bundle loads

The practical effect: web components render as empty/unstyled elements during SSR, then "pop in" once the client JS loads. The severity of this flash depends on the framework and the workaround used.

---

## Compatibility Matrix

| Framework            | SSR Support | SSG Support | Strategy                                             |
| -------------------- | :---------: | :---------: | ---------------------------------------------------- |
| **Astro 4+**         |     ✅      |     ✅      | `@astrojs/lit` handles SSR serialization natively    |
| **Next.js 14+**      |     ⚠️      |     ⚠️      | `use client` + `next/dynamic ssr:false`              |
| **Nuxt 3**           |     ⚠️      |     ⚠️      | `.client.ts` plugin or `<ClientOnly>` wrapper        |
| **SvelteKit 2+**     |     ⚠️      |     ⚠️      | `onMount` guard + `browser` check                    |
| **Angular Universal**|     ❌      |     ❌      | No support — client hydration only                   |
| **Remix**            |     ⚠️      |     N/A     | `useEffect` + dynamic import guard                   |
| **Gatsby**           |     ⚠️      |     ⚠️      | `typeof window !== 'undefined'` import guard         |

**Legend:** ✅ Full SSR support | ⚠️ Supported with workarounds | ❌ Not supported

---

## Astro (Best SSR Experience)

Astro has first-class Lit SSR support via `@astrojs/lit`. This is the only framework where HELiX components render correctly on the server with no flash-of-unstyled-content.

### Setup

```bash
npm install @astrojs/lit
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  integrations: [lit()],
});
```

### Usage in `.astro` files

```astro
---
// src/pages/patient/[id].astro
import '@wc-2026/library/components/hx-card';
import '@wc-2026/library/components/hx-button';

const patient = await fetchPatient(Astro.params.id);
---

<!-- Rendered on server with @astrojs/lit -->
<hx-card>
  <span slot="heading">{patient.name}</span>
  <p>Room {patient.room}</p>
  <hx-button slot="actions" variant="secondary">View Details</hx-button>
</hx-card>
```

With `@astrojs/lit`, the component's shadow DOM is serialized using Declarative Shadow DOM (DSD) — the HTML output includes the shadow root markup directly, so the user sees styled content immediately, even before JS loads.

### Declarative Shadow DOM Output

`@astrojs/lit` emits HTML like:

```html
<hx-card>
  <template shadowrootmode="open">
    <style>/* component styles inlined */</style>
    <slot name="heading"></slot>
    <slot></slot>
    <slot name="actions"></slot>
  </template>
  <span slot="heading">Jane Doe</span>
  <p>Room 204A</p>
</hx-card>
```

Browsers with DSD support (Chrome 111+, Safari 16.4+, Firefox 123+) render this immediately. Older browsers fall back to the client JS bundle.

---

## Next.js

Next.js uses React Server Components by default. Custom elements cannot be registered or rendered on the server.

### Recommended Pattern: `use client` + Dynamic Import

```tsx
// app/components/PatientDashboard.tsx
'use client';

import { useEffect, useState } from 'react';

export function PatientDashboard({ patient }: { patient: Patient }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import('@wc-2026/library').then(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="loading-skeleton" aria-busy="true">Loading...</div>;
  }

  return (
    <hx-card>
      <span slot="heading">{patient.name}</span>
      <p>Room {patient.room}</p>
    </hx-card>
  );
}
```

### `next/dynamic` Alternative

```tsx
import dynamic from 'next/dynamic';

const PatientDashboard = dynamic(
  () => import('./PatientDashboard').then((m) => m.PatientDashboard),
  {
    ssr: false,
    loading: () => <div>Loading patient data...</div>,
  }
);
```

### Static Site Generation (SSG)

Next.js SSG (`generateStaticParams`) pre-renders pages at build time in Node.js. The same limitation applies — web components cannot render server-side. Use the same `use client` / dynamic import pattern. The HTML output will include the loading skeleton, replaced by HELiX components on client hydration.

### SEO Considerations

For content that must be in the initial HTML for SEO (headings, body text), keep that content in standard HTML elements outside of HELiX components. HELiX components are ideal for interactive UI, not for SEO-critical content.

---

## Nuxt 3

Nuxt 3 runs server-side rendering by default with Vue's hydration system.

### `.client.ts` Plugin (Recommended)

```typescript
// plugins/helix.client.ts
import '@wc-2026/library';

export default defineNuxtPlugin(() => {
  // The .client.ts suffix ensures browser-only execution
});
```

### `<ClientOnly>` for Per-Page Control

```vue
<template>
  <ClientOnly>
    <hx-card>
      <span slot="heading">{{ patient.name }}</span>
    </hx-card>
    <template #fallback>
      <div class="card-skeleton">Loading...</div>
    </template>
  </ClientOnly>
</template>
```

### Nuxt SSG (`nuxt generate`)

`nuxt generate` pre-renders pages to static HTML. With the `.client.ts` plugin, HELiX components are excluded from the server render — the pre-generated HTML will show only the `<ClientOnly>` fallback content, replaced client-side after hydration.

---

## SvelteKit

SvelteKit supports SSR and SSG. Custom element registration must be guarded with an `onMount` or `browser` check.

### `onMount` Guard

```svelte
<!-- src/routes/patient/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let ready = false;

  onMount(async () => {
    await import('@wc-2026/library');
    ready = true;
  });
</script>

{#if ready}
  <hx-card>
    <span slot="heading">{data.patient.name}</span>
    <p>Room {data.patient.room}</p>
  </hx-card>
{:else}
  <div class="skeleton">Loading...</div>
{/if}
```

### `browser` Check (Module Level)

For shared utility files, use SvelteKit's `browser` flag:

```typescript
// src/lib/helix.ts
import { browser } from '$app/environment';

export async function initHelix(): Promise<void> {
  if (browser) {
    await import('@wc-2026/library');
  }
}
```

### SvelteKit Prerendering (SSG)

Set `export const prerender = true` in route files. HELiX components will not appear in the pre-generated HTML — they hydrate client-side. Use the `onMount` pattern for all pages with HELiX components.

---

## Angular Universal

Angular Universal does not support custom elements. The `customElements` global is not polyfillable in Node.js's V8 environment without a browser DOM implementation.

**Current recommendation:** Do not use Angular Universal with HELiX components in SSR mode. Build your Angular app without Universal, or use Angular's `TransferState` to pass server-fetched data to client-rendered components.

If Angular Universal support is a firm requirement, watch for the Angular team's work on Domino v2 and Angular CDK's server-side rendering utilities — future versions may support custom elements.

---

## Declarative Shadow DOM (DSD) — The Future of Web Component SSR

Declarative Shadow DOM (`<template shadowrootmode="open">`) is the HTML specification that enables server-rendered shadow roots. It is the technology behind Astro's excellent SSR support.

Browser support as of 2026:
- Chrome 111+ ✅
- Safari 16.4+ ✅
- Firefox 123+ ✅

Lit 3.x supports DSD via `@lit-labs/ssr`. As other frameworks adopt DSD serialization, SSR support for HELiX components will improve without code changes.

### Checking DSD Support

```javascript
const supportsDSD = HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode');
```

---

## Flash of Unstyled Content (FOUC) Mitigation

When web components load after the initial HTML render, users may briefly see unstyled content. Mitigate with:

### CSS Skeleton Fallback

```css
/* Use :not(:defined) to style unregistered elements */
hx-card:not(:defined) {
  display: block;
  min-height: 120px;
  background: var(--hx-color-surface-2);
  border-radius: var(--hx-radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### `customElements.whenDefined()`

```typescript
// Show content only after the element is registered
await customElements.whenDefined('hx-card');
document.querySelector('hx-card')?.removeAttribute('hidden');
```

---

## Related

- [React & Next.js](./react/)
- [Vue & Nuxt](./vue/)
- [Angular](./angular/)
- [Common Gotchas](./gotchas/)
