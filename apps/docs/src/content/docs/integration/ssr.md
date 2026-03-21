---
title: SSR & Hydration Compatibility
description: Server-side rendering strategies for HELiX web components across Next.js, Astro, and Nuxt
---

HELiX web components are built with Lit 3.x and use Shadow DOM. This guide covers how to integrate them with server-side rendering frameworks, including hydration strategies, known blockers, and framework-specific patterns.

## Component SSR Categories

Every HELiX component falls into one of three categories based on its browser API usage:

| Category | Count | Description | Examples |
|----------|-------|-------------|----------|
| **ssr-safe** | 61 | No browser API access in render path. Compatible with @lit-labs/ssr and Declarative Shadow DOM. | hx-card, hx-badge, hx-text, hx-button, hx-divider, hx-grid, hx-stack |
| **needs-wrapper** | 27 | Browser APIs accessed in lifecycle/event handlers only. Safe for DSD render but needs client hydration for interactivity. | hx-accordion, hx-tabs, hx-popover, hx-select, hx-dialog, hx-combobox |
| **client-only** | 8 | Imperative DOM operations that require full browser environment. Must render exclusively on client. | hx-toast, hx-drawer, hx-carousel, hx-color-picker, hx-counter, hx-theme |

The full per-component audit is available in `.automaker/audits/ssr-hydration-audit.json`.

## Understanding the Blockers

### Why Web Components Need Special SSR Handling

Web components use the `CustomElementRegistry` (`customElements.define()`) which only exists in browsers. Without `@lit-labs/ssr`, web components render as empty custom element tags on the server:

```html
<!-- Server output without @lit-labs/ssr -->
<hx-card>
  <!-- Shadow DOM content missing - renders empty until client JS loads -->
</hx-card>
```

With `@lit-labs/ssr` and Declarative Shadow DOM (DSD), the server can emit the shadow root inline:

```html
<!-- Server output with @lit-labs/ssr -->
<hx-card>
  <template shadowrootmode="open">
    <style>/* component styles */</style>
    <div part="container"><slot></slot></div>
  </template>
  Card content here
</hx-card>
```

### Common SSR Blockers in HELiX

1. **`document.addEventListener`** (27 components): Used for outside-click detection and global keyboard handlers. Only called in interaction methods (open/close), not during construction or render. Safe for DSD but needs client JS for interactivity.

2. **`window.matchMedia`** (5 components): Used for `prefers-reduced-motion` and `prefers-color-scheme` detection. Called in `connectedCallback` or methods. Workaround: pass explicit props instead of relying on media queries.

3. **`document.createElement`** (4 components): Imperative DOM element creation. Used by hx-toast (toast factory), hx-breadcrumb (ellipsis/JSON-LD), hx-tooltip (a11y span), and hx-field (help text). These components must be client-only.

4. **`document.body.appendChild`** (2 components): hx-toast and hx-breadcrumb append elements to the document body. Fundamentally incompatible with SSR.

### What's Already SSR-Safe

HELiX components have already been updated to avoid common SSR pitfalls:

- **No `crypto.randomUUID()`**: All components use module-level monotonic counters for deterministic IDs. This eliminates hydration mismatch warnings caused by non-deterministic ID generation.
- **No `Math.random()` for IDs**: Replaced across all 14 components that generate IDs.
- **Form-associated components** use `ElementInternals` which is handled correctly by `@lit-labs/ssr`.

## Next.js 15 (App Router)

### Strategy: 'use client' Boundaries

All HELiX components require client-side JavaScript because they register custom elements. In Next.js App Router, this means using `'use client'` directives.

**Recommended pattern**: Create a single client boundary component:

```tsx
// components/HelixComponents.tsx
'use client';

// Import registers all custom elements
import '@helixui/library';

// Re-export for use in server components
export function HelixProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Then use it in your layout:

```tsx
// app/layout.tsx
import { HelixProvider } from '../components/HelixComponents';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HelixProvider>{children}</HelixProvider>
      </body>
    </html>
  );
}
```

### Dynamic Imports for Client-Only Components

For components in the **client-only** category, use `next/dynamic` with `ssr: false`:

```tsx
'use client';
import dynamic from 'next/dynamic';

// Toast, Drawer, Carousel, etc. must be dynamically imported
const ToastDemo = dynamic(
  () => import('./ToastDemo'),
  { ssr: false }
);

export default function Page() {
  return (
    <div>
      {/* SSR-safe and needs-wrapper components render normally */}
      <hx-card>
        <hx-text>Patient Summary</hx-text>
        <hx-badge variant="success">Active</hx-badge>
      </hx-card>

      {/* Client-only components use dynamic import */}
      <ToastDemo />
    </div>
  );
}
```

### Streaming SSR with React Suspense

Use Suspense boundaries to stream component-heavy sections:

```tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<hx-skeleton effect="wave" />}>
        <PatientVitals />
      </Suspense>
      <Suspense fallback={<hx-spinner />}>
        <MedicationList />
      </Suspense>
    </div>
  );
}
```

### Avoiding Hydration Mismatches

HELiX components use module-level counters for ID generation, which produces deterministic IDs when module evaluation order is consistent between server and client. This means:

- **No `suppressHydrationWarning` needed** for HELiX components
- **No `crypto.randomUUID()` warnings** in the console
- IDs like `hx-text-input-1`, `hx-text-input-2` are stable across renders

If you see hydration mismatch warnings, check for:
1. Conditional rendering based on `typeof window` (use the client boundary pattern instead)
2. Non-deterministic data in component props (dates, random values)
3. Browser extensions injecting content into your page

### Trip-Planner Team Recommendations

For the trip-planner Next.js App Router application:

1. Create a single `'use client'` boundary that imports `@helixui/library`
2. Use `next/dynamic` with `ssr: false` for: hx-toast, hx-drawer, hx-carousel, hx-counter, hx-color-picker
3. For `hx-theme`: pass explicit `theme="light"` or `theme="dark"` prop to avoid `window.matchMedia` SSR error
4. Wrap form-heavy sections in React Suspense for streaming SSR
5. Module-level counters in form components are already SSR-safe

## Astro 5 (Islands Architecture)

### Strategy: Client Directives

Astro's island architecture maps naturally to HELiX component categories:

| HELiX Category | Astro Directive | When to Use |
|----------------|-----------------|-------------|
| ssr-safe | No directive (with @astrojs/lit) or `client:idle` | Display-only components that benefit from DSD |
| needs-wrapper | `client:load` | Interactive components needed immediately |
| needs-wrapper | `client:idle` | Interactive components not immediately needed |
| client-only | `client:load` or `client:visible` | Components requiring browser APIs |

### Setup with @astrojs/lit

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  integrations: [lit()],
});
```

### Usage Examples

```astro
---
// src/pages/index.astro
---

<!-- SSR-safe: renders via Declarative Shadow DOM with @lit-labs/ssr -->
<hx-card>
  <hx-text variant="heading-md">Patient Info</hx-text>
  <hx-badge variant="info">New</hx-badge>
</hx-card>

<!-- Interactive: hydrate immediately -->
<hx-tabs client:load>
  <hx-tab slot="tab">Demographics</hx-tab>
  <hx-tab slot="tab">History</hx-tab>
  <hx-tab-panel slot="panel">Content...</hx-tab-panel>
  <hx-tab-panel slot="panel">Content...</hx-tab-panel>
</hx-tabs>

<!-- Below-fold: hydrate when visible -->
<hx-carousel client:visible autoplay>
  <hx-carousel-item>Slide 1</hx-carousel-item>
  <hx-carousel-item>Slide 2</hx-carousel-item>
</hx-carousel>
```

### Deferred Island Rendering

For healthcare dashboards with many components, use priority-based hydration:

```astro
<!-- Critical: hydrate immediately (patient actions) -->
<hx-button variant="danger" client:load>Emergency Alert</hx-button>

<!-- Important: hydrate when idle (navigation) -->
<hx-side-nav client:idle>
  <hx-nav-item href="/patients">Patients</hx-nav-item>
</hx-side-nav>

<!-- Nice-to-have: hydrate when visible (charts, data) -->
<hx-data-table client:visible>...</hx-data-table>
```

## Nuxt 4

### Strategy: Client-Only Plugin + ClientOnly Wrapper

### Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      // Tell Vue to treat hx-* tags as custom elements
      isCustomElement: (tag) => tag.startsWith('hx-'),
    },
  },
});
```

### Client-Only Plugin for Component Registration

```ts
// plugins/helix.client.ts
export default defineNuxtPlugin(() => {
  // This runs only on the client
  import('@helixui/library');
});
```

### Using Components in Templates

```vue
<template>
  <!-- SSR-safe components render as custom element tags -->
  <!-- Vue passes attributes through; Lit hydrates on client -->
  <hx-card>
    <hx-text>Patient Card</hx-text>
    <hx-badge variant="success">Active</hx-badge>
  </hx-card>

  <!-- Client-only components wrapped in <ClientOnly> -->
  <ClientOnly>
    <hx-toast-stack placement="top-end" />
    <template #fallback>
      <div class="toast-placeholder" />
    </template>
  </ClientOnly>

  <!-- Conditional rendering with composable -->
  <hx-tooltip v-if="isMounted" content="Patient details">
    <hx-button>View</hx-button>
  </hx-tooltip>
</template>

<script setup>
const { isMounted } = useSsrSafe();
</script>
```

### SSR-Safe Composable

```ts
// composables/useSsrSafe.ts
export function useSsrSafe() {
  const isMounted = ref(false);

  onMounted(() => {
    isMounted.value = true;
  });

  const safeWindow = computed(() =>
    typeof window !== 'undefined' ? window : undefined
  );

  return { isMounted, safeWindow };
}
```

## @lit-labs/ssr Compatibility

### Status: Experimental

`@lit-labs/ssr` provides server-side rendering for Lit components using Declarative Shadow DOM. Current compatibility:

| Category | Compatible | Notes |
|----------|-----------|-------|
| ssr-safe (61) | Yes | Full DSD rendering on server |
| needs-wrapper (27) | Partial | DSD renders structure; browser APIs need client hydration |
| client-only (8) | No | Must render client-side only |

### How Declarative Shadow DOM Works

```html
<!-- Browser support: Chrome 111+, Edge 111+, Firefox 123+, Safari 16.4+ -->
<hx-card>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <div part="container">
      <slot></slot>
    </div>
  </template>
  <!-- Light DOM content -->
  <hx-text>Visible immediately, no JS needed</hx-text>
</hx-card>
```

Users see styled content before JavaScript loads. When Lit hydrates, it attaches to the existing shadow root instead of creating a new one.

### Streaming SSR Patterns

| Framework | Pattern | HELiX Integration |
|-----------|---------|-------------------|
| Next.js | React Suspense boundaries | Wrap component sections in `<Suspense>` with hx-skeleton fallbacks |
| Astro | Island architecture | Use `client:visible` for below-fold, `client:idle` for non-critical |
| Nuxt | `<ClientOnly>` + asyncData | Use `<ClientOnly>` with `#fallback` slots for loading states |

## Debugging Hydration Issues

### Common Symptoms and Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Hydration mismatch" warning | Non-deterministic rendering | HELiX uses module counters; check your own data |
| Empty custom elements | Missing client JS | Add `'use client'` (Next.js) or `client:load` (Astro) |
| "window is not defined" | SSR accessing browser API | Use `<ClientOnly>` or dynamic import with `ssr: false` |
| "document is not defined" | Component in SSR render | Move to client boundary; check audit JSON for category |
| Flash of unstyled content | DSD not supported in browser | Add polyfill or accept brief flash |
| Double rendering | Client creates new shadow root | Ensure @lit-labs/ssr hydration mode; Lit 3.x handles this |

### Debug Checklist

1. Check the component's category in `ssr-hydration-audit.json`
2. Verify the component is in the correct boundary (`'use client'`, `client:load`, `<ClientOnly>`)
3. If using `hx-theme`, pass an explicit `theme` prop
4. Check that `@helixui/library` is imported in a client-side context
5. Look for non-deterministic data in props (timestamps, random IDs)

## Complete Component Reference

### SSR-Safe Components (61)

These can render via Declarative Shadow DOM and hydrate without issues:

`hx-accordion-item`, `hx-avatar`, `hx-badge`, `hx-banner`, `hx-breadcrumb-item`, `hx-button`, `hx-button-group`, `hx-card`, `hx-carousel-item`, `hx-checkbox`, `hx-checkbox-group`, `hx-container`, `hx-data-table`, `hx-divider`, `hx-field-label`, `hx-form`, `hx-grid`, `hx-help-text`, `hx-icon`, `hx-icon-button`, `hx-image`, `hx-link`, `hx-list`, `hx-list-item`, `hx-menu-item`, `hx-menu-divider`, `hx-meter`, `hx-nav-item`, `hx-pagination`, `hx-popup`, `hx-progress-bar`, `hx-progress-ring`, `hx-prose`, `hx-radio`, `hx-radio-group`, `hx-rating`, `hx-skeleton`, `hx-spinner`, `hx-stack`, `hx-stat`, `hx-status-indicator`, `hx-step`, `hx-steps`, `hx-structured-list`, `hx-switch`, `hx-table`, `hx-tbody`, `hx-td`, `hx-tfoot`, `hx-th`, `hx-thead`, `hx-tr`, `hx-tab`, `hx-tab-panel`, `hx-tag`, `hx-text`, `hx-text-input`, `hx-toggle-button`, `hx-top-nav`, `hx-tree-item`, `hx-visually-hidden`

### Needs-Wrapper Components (27)

These use browser APIs in lifecycle/event handlers but can render server-side with client hydration:

`hx-accordion`, `hx-action-bar`, `hx-alert`, `hx-code-snippet`, `hx-combobox`, `hx-copy-button`, `hx-date-picker`, `hx-dialog`, `hx-dropdown`, `hx-field`, `hx-file-upload`, `hx-format-date`, `hx-menu`, `hx-nav`, `hx-number-input`, `hx-overflow-menu`, `hx-popover`, `hx-select`, `hx-side-nav`, `hx-slider`, `hx-split-button`, `hx-split-panel`, `hx-tabs`, `hx-textarea`, `hx-time-picker`, `hx-tooltip`, `hx-tree-view`

### Client-Only Components (8)

These must render exclusively on the client:

`hx-breadcrumb`, `hx-carousel`, `hx-color-picker`, `hx-counter`, `hx-drawer`, `hx-theme`, `hx-toast`, `hx-toast-stack`

**Why these are client-only:**

- **hx-toast / hx-toast-stack**: Factory pattern creates elements on `document.body`
- **hx-drawer**: Uses `document.body.children` for `inert` attribute, `window.matchMedia`
- **hx-carousel**: `window.matchMedia` in `connectedCallback`, `setInterval` for autoplay
- **hx-counter**: `requestAnimationFrame` animation, `window.matchMedia`
- **hx-color-picker**: Canvas 2D context, pointer event tracking on `document`
- **hx-theme**: `window.matchMedia` for system theme detection in `connectedCallback`
- **hx-breadcrumb**: Imperative `document.createElement` and `document.head.appendChild` for JSON-LD
