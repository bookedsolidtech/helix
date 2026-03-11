---
title: 'Vue Integration'
description: 'Using HELIX web components in Vue 3 and Nuxt, including v-model patterns, event handling, and SSR.'
sidebar:
  order: 3
---

# Vue Integration

Vue 3 has first-class support for custom elements. With one compiler option, Vue passes unknown element props directly to the DOM instead of treating them as Vue props.

## Installation

```bash
npm install @helixui/library
```

## Compiler Configuration

Tell Vue's template compiler to treat `hx-*` elements as custom elements. This prevents Vue from warning about unknown components.

### Vite (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat any element starting with hx- as a custom element
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
});
```

### Nuxt (`nuxt.config.ts`)

```ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('hx-'),
    },
  },
});
```

## Importing Components

Import once at the app entry point (or in a plugin):

```ts
// main.ts
import { createApp } from 'vue';
import '@helixui/library';
import App from './App.vue';

createApp(App).mount('#app');
```

### Nuxt Plugin

```ts
// plugins/helix.client.ts
export default defineNuxtPlugin(() => {
  import('@helixui/library');
});
```

## Basic Usage

```vue
<template>
  <hx-button variant="primary" @hx-click="handleSave">
    Save
  </hx-button>
</template>

<script setup lang="ts">
function handleSave() {
  console.log('saved');
}
</script>
```

## Event Handling

Vue forwards `@event-name` bindings as native DOM event listeners, so HELIX's `hx-` prefixed events work directly:

```vue
<template>
  <hx-text-input
    name="search"
    placeholder="Search..."
    @hx-input="onInput"
    @hx-change="onChange"
  />
</template>

<script setup lang="ts">
function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  console.log('input:', value);
}

function onChange(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  console.log('change:', value);
}
</script>
```

## v-model Patterns

HELIX components dispatch `hx-change` and `hx-input` events with `event.target.value`. Vue's `v-model` is not directly compatible, but a simple composable bridges the gap:

### Manual Two-Way Binding

```vue
<template>
  <hx-text-input
    :value="searchQuery"
    name="search"
    @hx-input="searchQuery = ($event.target as HTMLInputElement).value"
  />
  <p>You typed: {{ searchQuery }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const searchQuery = ref('');
</script>
```

### Reusable v-model Composable

```ts
// composables/useHxModel.ts
import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';

export function useHxModel(
  elRef: Ref<HTMLElement | null>,
  initialValue = '',
) {
  const value = ref(initialValue);

  function onInput(e: Event) {
    value.value = (e.target as HTMLInputElement).value;
  }

  onMounted(() => {
    elRef.value?.addEventListener('hx-input', onInput);
  });

  onUnmounted(() => {
    elRef.value?.removeEventListener('hx-input', onInput);
  });

  watch(value, (val) => {
    if (elRef.value) {
      (elRef.value as HTMLInputElement).value = val;
    }
  });

  return value;
}
```

```vue
<template>
  <hx-text-input ref="inputEl" name="email" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useHxModel } from '@/composables/useHxModel';

const inputEl = ref<HTMLElement | null>(null);
const email = useHxModel(inputEl);
</script>
```

## Boolean Attributes

Vue passes `false` booleans by omitting the attribute, which aligns with HELIX's [boolean attribute semantics](/guides/boolean-attributes):

```vue
<template>
  <!-- Correct: disabled attribute present when true, absent when false -->
  <hx-button :disabled="isDisabled">Submit</hx-button>
</template>
```

Avoid passing string `"false"`:

```vue
<!-- Wrong: disabled="false" still disables the button -->
<hx-button disabled="false">Submit</hx-button>
```

## Form Integration

HELIX form components participate in native HTML forms via `ElementInternals`. Wrap them in a `<form>` and read with `FormData`:

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <hx-text-input name="username" required />
    <hx-select name="role">
      <option value="admin">Admin</option>
      <option value="viewer">Viewer</option>
    </hx-select>
    <hx-button type="submit">Create User</hx-button>
  </form>
</template>

<script setup lang="ts">
function handleSubmit(e: Event) {
  const form = e.target as HTMLFormElement;
  const data = new FormData(form);
  console.log({
    username: data.get('username'),
    role: data.get('role'),
  });
}
</script>
```

## TypeScript Support

Add global type declarations to your `env.d.ts`:

```ts
// env.d.ts
declare module 'vue' {
  interface GlobalComponents {
    // Vue 3 does not auto-complete custom elements by default.
    // Add declarations here if you want IDE completion.
  }
}

// Extend standard HTML element interface
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HTMLElement & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      size?: 'sm' | 'md' | 'lg';
      disabled?: boolean;
    };
  }
}

export {};
```

## SSR / Nuxt

In Nuxt, register HELIX as a client-only plugin (see the plugin example above). Components will render as empty custom element shells during SSR and hydrate on the client — this is expected.

To suppress Vue warnings about unknown elements during SSR, configure `isCustomElement` in `nuxt.config.ts`.

## Next Steps

- [Angular Integration](/framework-integration/angular)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
