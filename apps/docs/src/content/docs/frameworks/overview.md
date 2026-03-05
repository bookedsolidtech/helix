---
title: Framework Adapters Overview
description: Using HELiX web components with React, Vue, Angular, and modern meta-frameworks like Next.js, Nuxt, Astro, and SvelteKit.
---

# Framework Adapters Overview

HELiX components are standard web components — they work in any JavaScript environment that supports the Custom Elements specification. This section documents how to integrate them with popular frameworks and meta-frameworks, including setup, event handling patterns, SSR/SSG compatibility, and known gotchas.

---

## Why Web Components Work Across Frameworks

Custom Elements v1 is a browser-native standard. Once a component is registered with `customElements.define()`, any framework can render it as a plain HTML element. Frameworks that render to the DOM — React, Vue, Angular, Svelte — can all use HELiX components without framework-specific wrappers.

The integration surface is simple:

- **Properties**: Set via DOM attributes (strings) or JavaScript property assignment (any type)
- **Events**: Listen via `addEventListener` or framework-native event binding
- **Slots**: Fill via child elements
- **Styling**: Override via CSS custom properties (`--hx-*`)

---

## Framework Compatibility Matrix

| Framework         | Static Import | SSR | SSG | Notes                                      |
| ----------------- | :-----------: | :-: | :-: | ------------------------------------------ |
| React 18+         |      ✅       | ⚠️  | ⚠️  | Use `use client` + `next/dynamic` for SSR  |
| Next.js 14+       |      ✅       | ⚠️  | ⚠️  | Client-only import required                |
| Vue 3             |      ✅       | ⚠️  | ⚠️  | Set `compilerOptions.isCustomElement`      |
| Nuxt 3            |      ✅       | ⚠️  | ⚠️  | Client-only plugin or `<ClientOnly>` tag   |
| Angular 17+       |      ✅       | ⚠️  | ❌  | Add `CUSTOM_ELEMENTS_SCHEMA`               |
| Astro 4+          |      ✅       | ✅  | ✅  | Best SSR support via `@astrojs/lit`        |
| SvelteKit 2+      |      ✅       | ⚠️  | ⚠️  | Use `onMount` guard for registration       |
| Vanilla JS        |      ✅       | ✅  | ✅  | Native — no adapter required               |
| Drupal (Twig)     |      ✅       | ✅  | N/A | CDN or npm — primary integration target    |

**Legend:** ✅ Fully supported | ⚠️ Supported with configuration | ❌ Not supported

---

## Quick Setup by Framework

### React / Next.js

```bash
npm install @wc-2026/library
```

```tsx
// app/layout.tsx — import once at the app root (client boundary)
'use client';
import '@wc-2026/library';
```

See the [React guide](./react/) for complete setup, event handling, and TypeScript types.

### Vue / Nuxt

```bash
npm install @wc-2026/library
```

```typescript
// vite.config.ts — suppress custom element warnings
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
});
```

See the [Vue guide](./vue/) for complete setup, `v-bind` patterns, and Nuxt configuration.

### Angular

```bash
npm install @wc-2026/library
```

```typescript
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

See the [Angular guide](./angular/) for complete setup, event binding, and zone handling.

### Astro

```bash
npm install @wc-2026/library @astrojs/lit
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  integrations: [lit()],
});
```

Astro provides the best SSR support for HELiX components. See the [SSR compatibility guide](./ssr-compatibility/) for details.

---

## General Principles

### Always Import at the App Root

Import HELiX components once at the application root, not inside individual page components. Custom element registration is global — importing the same component twice from different routes has no harmful effect, but it wastes bytes if the module is bundled twice.

```typescript
// ✅ Import at root — applies globally
import '@wc-2026/library';

// ✅ Import individual components for better tree-shaking
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-card';
```

### Property Assignment vs Attribute Reflection

Frameworks differ in how they pass data to DOM elements:

| Data Type     | Use Attribute? | Use Property? |
| ------------- | :------------: | :-----------: |
| String        |      ✅        |      ✅       |
| Boolean       |      ✅        |      ✅       |
| Number        |      ✅        |      ✅       |
| Object/Array  |      ❌        |      ✅       |
| Function      |      ❌        |      ✅       |

For objects and arrays, always use JavaScript property assignment — attributes are strings only.

### Custom Events

HELiX components fire custom events with the `hx-` prefix. All events bubble and are composed (they cross shadow DOM boundaries):

```typescript
element.addEventListener('hx-change', (event: CustomEvent) => {
  console.log(event.detail); // framework-agnostic
});
```

Each framework guide shows the idiomatic syntax for listening to these events.

---

## Related Guides

- [React & Next.js](./react/)
- [Vue & Nuxt](./vue/)
- [Angular](./angular/)
- [SSR/SSG Compatibility Matrix](./ssr-compatibility/)
- [Common Gotchas](./gotchas/)
- [Storybook with React Wrappers](./storybook/)
