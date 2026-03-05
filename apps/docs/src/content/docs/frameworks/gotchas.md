---
title: Common Gotchas & Workarounds
description: Known issues, surprising behaviors, and practical workarounds when using HELiX web components across React, Vue, Angular, Next.js, Nuxt, and SvelteKit.
---

# Common Gotchas & Workarounds

This page documents the most frequently encountered issues when integrating HELiX web components with popular frameworks. Each entry includes the root cause and the recommended workaround.

---

## React

### Custom Events Are Not Synthetic Events

**Problem:** React's synthetic event system does not forward custom events. `onHxChange`, `onHxClick`, etc. are not valid React event props — React does not map `hx-*` events to JSX handlers.

**Symptom:**
```tsx
// This does NOT work — React ignores unknown event props
<hx-button onHxClick={handleClick}>Save</hx-button>
```

**Fix:** Use `useRef` and `addEventListener`:

```tsx
import { useRef, useEffect } from 'react';

export function SaveButton({ onClick }: { onClick: () => void }) {
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    el.addEventListener('hx-click', onClick);
    return () => el.removeEventListener('hx-click', onClick);
  }, [onClick]);

  return <hx-button ref={buttonRef} variant="primary">Save</hx-button>;
}
```

---

### TypeScript: "Property does not exist on type 'JSX.IntrinsicElements'"

**Problem:** TypeScript does not know about `hx-*` elements.

**Fix:** Declare them in a `.d.ts` file:

```typescript
// src/custom-elements.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
          size?: 'sm' | 'md' | 'lg';
          disabled?: boolean;
          type?: 'button' | 'submit' | 'reset';
        },
        HTMLElement
      >;
      'hx-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      // Add other elements as needed
    }
  }
}
```

---

### Objects and Arrays Cannot Be Passed as JSX Props

**Problem:** `<hx-select options={options} />` does not work — HTML attributes are strings, and React passes objects as strings (`[object Object]`).

**Fix:** Use `useRef` and assign the property directly after mount:

```tsx
import { useRef, useEffect } from 'react';

export function PatientSelect({ options }: { options: { value: string; label: string }[] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      (ref.current as HTMLElement & { options: typeof options }).options = options;
    }
  }, [options]);

  return <hx-select ref={ref} />;
}
```

---

### `ref` Does Not Work on Web Components in Older React Versions

**Problem:** In React 17 and below, `ref` forwarding to custom elements requires `React.forwardRef`. In React 18, refs work directly on custom elements.

**Fix:** Target React 18+, or use a wrapper component with `forwardRef` for older versions.

---

## Next.js

### `ReferenceError: customElements is not defined`

**Problem:** You imported `@wc-2026/library` in a Server Component. `customElements.define()` only exists in browsers.

**Fix:** Always import HELiX inside a `'use client'` component:

```tsx
// ❌ Server Component — will throw
import '@wc-2026/library';

// ✅ Client Component — safe
'use client';
import '@wc-2026/library';
```

---

### Components Render Blank During SSR

**Problem:** Next.js renders pages on the server. HELiX components have no server-side output, so the initial HTML contains empty `<hx-*>` tags.

**Fix:** Use `next/dynamic` with `{ ssr: false }` and show a loading skeleton:

```tsx
import dynamic from 'next/dynamic';

const PatientCard = dynamic(() => import('./PatientCard.client'), {
  ssr: false,
  loading: () => <div className="card-skeleton" aria-busy="true" />,
});
```

See the [SSR/SSG Compatibility guide](./ssr-compatibility/) for full patterns.

---

### Stale Hydration After Hot Module Replacement (HMR)

**Problem:** During development, HMR replaces modules but `customElements.define()` throws if called twice for the same tag. You may see `NotSupportedError: Operation is not supported`.

**Root cause:** Custom element definitions are permanent in the browser's registry — they cannot be overwritten once registered.

**Fix:** HELiX components guard against double registration:

```typescript
// HELiX components check before defining
if (!customElements.get('hx-button')) {
  customElements.define('hx-button', HxButton);
}
```

If you see this error with your own components, add the same guard.

---

## Vue

### `[Vue warn]: Failed to resolve component: hx-button`

**Problem:** Vue's template compiler treats unknown tags as unresolved Vue components and logs a warning.

**Fix:** Configure `isCustomElement` in `vite.config.ts`:

```typescript
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('hx-'),
    },
  },
})
```

---

### `v-model` Does Not Work with HELiX Inputs

**Problem:** Vue's `v-model` directive hooks into the native `input` and `change` events. HELiX inputs fire `hx-input` and `hx-change` custom events, not native ones.

**Fix:** Use `v-bind` for value and `@hx-input` for updates:

```vue
<template>
  <hx-text-input
    :value="patientName"
    @hx-input="patientName = $event.detail.value"
    label="Patient Name"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
const patientName = ref('');
</script>
```

---

### Event Detail Is `undefined` When Using `@hx-change`

**Problem:** Vue wraps the event argument. When you write `@hx-change="handler"`, Vue passes the event object. If you write `@hx-change="handler($event)"`, `$event` is the `CustomEvent` — but `$event.detail` may be `undefined` if you forgot the `CustomEvent` type.

**Fix:** Always type the event handler correctly:

```vue
<script setup lang="ts">
function onNameChange(event: CustomEvent<{ value: string }>) {
  // event.detail.value is typed correctly
  console.log(event.detail.value);
}
</script>
```

---

## Nuxt 3

### `window is not defined` During SSR

**Problem:** Importing `@wc-2026/library` in a regular Nuxt plugin runs server-side and throws because `window` does not exist.

**Fix:** Use the `.client.ts` plugin suffix to restrict execution to the browser:

```typescript
// plugins/helix.client.ts  ← .client.ts suffix is the fix
import '@wc-2026/library';

export default defineNuxtPlugin(() => {});
```

---

### HELiX Components Not Rendering in `nuxt generate` Output

**Problem:** `nuxt generate` pre-renders pages to static HTML on the server. Without the `.client.ts` plugin, HELiX imports fail. With the plugin, components are excluded from the static HTML.

**Expected behavior:** This is correct. HELiX components hydrate client-side. Use `<ClientOnly>` with a `#fallback` slot to provide server-rendered placeholder content.

```vue
<ClientOnly>
  <hx-card>...</hx-card>
  <template #fallback>
    <div class="card-placeholder">Loading...</div>
  </template>
</ClientOnly>
```

---

## Angular

### `NG0304: 'hx-button' is not a known element`

**Problem:** Angular validates all HTML elements in templates. Custom elements are unknown unless you add `CUSTOM_ELEMENTS_SCHEMA`.

**Fix:**

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  // ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyComponent {}
```

---

### Event Binding with Hyphens: `(hx-change)` vs `(hxChange)`

**Problem:** Angular's template parser has limited support for hyphenated event names. In some versions, `(hx-change)` may not be recognized.

**Fix:** Angular 17+ handles `(hx-change)` correctly. For older versions, use a host listener or `@HostListener` approach with `ElementRef`:

```typescript
import { Component, ElementRef, OnInit } from '@angular/core';

@Component({ /* ... */ })
export class MyComponent implements OnInit {
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.el.nativeElement.addEventListener('hx-change', (e: CustomEvent) => {
      // handle event
    });
  }
}
```

---

### Change Detection Not Triggering After HELiX Events

**Problem:** If a HELiX event fires outside Angular's zone (e.g., from a `setTimeout` inside the web component), Angular's change detection may not run.

**Fix:** Wrap the handler in `NgZone.run()`:

```typescript
constructor(private zone: NgZone) {}

ngOnInit(): void {
  this.el.nativeElement.addEventListener('hx-change', (e: Event) => {
    this.zone.run(() => {
      this.value = (e as CustomEvent<{ value: string }>).detail.value;
    });
  });
}
```

For template event bindings like `(hx-change)="handler($event)"`, Angular automatically runs change detection — no `NgZone.run()` needed.

---

## SvelteKit

### `ReferenceError: customElements is not defined` During SSR

**Problem:** SvelteKit runs components server-side. Any top-level `import '@wc-2026/library'` runs on the server and throws.

**Fix:** Use `onMount` to defer registration to the browser:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let ready = false;

  onMount(async () => {
    await import('@wc-2026/library');
    ready = true;
  });
</script>

{#if ready}
  <hx-card>...</hx-card>
{/if}
```

---

### HELiX Events Don't Bind with `on:hx-change`

**Problem:** Svelte's event directive uses `on:eventname`. For hyphenated events, Svelte requires the event name as-is: `on:hx-change`.

**Status:** This works in Svelte 4+. If you're on Svelte 3, use `createEventDispatcher` patterns or bind via DOM APIs in `onMount`.

```svelte
<hx-text-input
  on:hx-change={handleChange}
  on:hx-input={handleInput}
  label="Patient Name"
/>
```

---

## Cross-Framework

### Flash of Unstyled Content (FOUC)

**Problem:** Before the HELiX JS bundle loads and registers custom elements, users see unstyled empty elements.

**Fix:** Add a CSS rule targeting `:not(:defined)`:

```css
hx-button:not(:defined),
hx-card:not(:defined),
hx-text-input:not(:defined) {
  visibility: hidden;
}
```

This hides undefined elements until they upgrade. Alternatively, provide a skeleton loading state via the framework's conditional rendering.

---

### Shadow DOM Events Do Not Bubble Through Framework Event Systems

**Problem:** HELiX events are `composed: true` and `bubbles: true`, so they cross shadow DOM boundaries. However, some framework event systems (particularly React's synthetic events) only intercept events at the React root, not at the document level. This means you must attach event listeners directly to the element, not rely on event delegation patterns.

**Fix:** Always attach event listeners directly to the element using `ref` + `addEventListener` in React. In Vue and Angular, use template event binding which attaches listeners directly.

---

### `@wc-2026/library` Import Registers All Components

**Problem:** Importing `@wc-2026/library` registers every component, adding all of them to the bundle.

**Fix:** Import individual components for better tree-shaking:

```typescript
// ✅ Only loads hx-button and hx-card
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-card';

// ❌ Loads everything
import '@wc-2026/library';
```

---

## Related

- [React & Next.js](./react/)
- [Vue & Nuxt](./vue/)
- [Angular](./angular/)
- [SSR/SSG Compatibility](./ssr-compatibility/)
- [Storybook with React Wrappers](./storybook/)
