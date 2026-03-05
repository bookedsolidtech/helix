---
title: Vue & Nuxt
description: Using HELiX web components in Vue 3 and Nuxt 3 applications, including compiler configuration, event binding, and SSR setup.
---

# Vue & Nuxt

HELiX components integrate cleanly with Vue 3. The main requirement is configuring Vue's template compiler to recognize `hx-*` tags as custom elements so it does not treat them as Vue components.

---

## Installation

```bash
npm install @wc-2026/library
```

---

## Vue 3 Setup

### Vite Configuration

Tell Vue's template compiler that `hx-*` tags are custom elements, not Vue components:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat any tag starting with hx- as a custom element
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
});
```

Without this, Vue will log warnings like `[Vue warn]: Failed to resolve component: hx-button`.

### Registering Components

Import HELiX at the app entry point:

```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';

// Register all HELiX components
import '@wc-2026/library';

createApp(App).mount('#app');
```

For selective imports:

```typescript
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-card';
```

### Basic Usage in Templates

```vue
<!-- src/components/PatientCard.vue -->
<template>
  <hx-card>
    <span slot="heading">{{ patient.name }}</span>
    <p>Room {{ patient.room }}</p>
    <hx-button slot="actions" variant="primary" @hx-click="handleEdit">
      Edit
    </hx-button>
  </hx-card>
</template>

<script setup lang="ts">
interface Patient {
  name: string;
  room: string;
}

defineProps<{ patient: Patient }>();
const emit = defineEmits<{ edit: [] }>();

function handleEdit() {
  emit('edit');
}
</script>
```

### Event Binding with `v-on`

Vue's `v-on` (`@`) syntax works with custom events:

```vue
<template>
  <!-- Listen to hx-change custom event -->
  <hx-text-input
    label="Patient Name"
    @hx-change="onNameChange"
    @hx-input="onNameInput"
  />

  <!-- Listen to hx-click -->
  <hx-button variant="primary" @hx-click="onSubmit">Save</hx-button>
</template>

<script setup lang="ts">
function onNameChange(event: CustomEvent<{ value: string }>) {
  console.log('Changed:', event.detail.value);
}

function onNameInput(event: CustomEvent<{ value: string }>) {
  console.log('Input:', event.detail.value);
}

function onSubmit() {
  console.log('Submitted');
}
</script>
```

### Passing Data with `:` Bindings

For string/boolean/number attributes, use Vue's `:` binding syntax:

```vue
<template>
  <hx-button
    :variant="buttonVariant"
    :disabled="isLoading"
    :size="buttonSize"
  >
    {{ isLoading ? 'Saving...' : 'Save Patient' }}
  </hx-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isLoading = ref(false);
const buttonVariant = ref<'primary' | 'secondary'>('primary');
const buttonSize = ref<'sm' | 'md' | 'lg'>('md');
</script>
```

### Passing Objects via Template Refs

Objects and arrays cannot be passed as HTML attributes. Use `templateRef` and direct property assignment:

```vue
<template>
  <hx-select ref="selectEl" :value="selectedValue" @hx-change="onSelectChange" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Option {
  value: string;
  label: string;
}

const props = defineProps<{ options: Option[] }>();
const selectedValue = ref('');
const selectEl = ref<HTMLElement | null>(null);

// Set object property via DOM ref
onMounted(() => {
  if (selectEl.value) {
    (selectEl.value as HTMLElement & { options: Option[] }).options = props.options;
  }
});

// Update when options change
watch(
  () => props.options,
  (newOptions) => {
    if (selectEl.value) {
      (selectEl.value as HTMLElement & { options: Option[] }).options = newOptions;
    }
  }
);

function onSelectChange(event: CustomEvent<{ value: string }>) {
  selectedValue.value = event.detail.value;
}
</script>
```

### TypeScript: Global Element Types

Declare `hx-*` elements for TypeScript JSX/template support:

```typescript
// src/env.d.ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

// Global custom element declarations
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HTMLElement & {
      variant: 'primary' | 'secondary' | 'ghost' | 'danger';
      size: 'sm' | 'md' | 'lg';
      disabled: boolean;
      type: 'button' | 'submit' | 'reset';
    };
    'hx-text-input': HTMLElement & {
      label: string;
      value: string;
      placeholder: string;
      required: boolean;
      disabled: boolean;
      error: string;
    };
    'hx-card': HTMLElement;
    'hx-select': HTMLElement & {
      value: string;
      options: Array<{ value: string; label: string }>;
    };
  }
}
```

---

## Nuxt 3 Setup

Nuxt 3 runs server-side rendering by default. HELiX components require the browser's `customElements` API, which is not available on the server.

### Option 1: Client-Only Plugin (Recommended)

Create a Nuxt plugin that registers components client-side only:

```typescript
// plugins/helix.client.ts
import '@wc-2026/library';

export default defineNuxtPlugin(() => {
  // Registration happens via the import above.
  // The .client.ts suffix ensures this plugin only runs in the browser.
});
```

The `.client.ts` suffix tells Nuxt to skip this plugin during SSR. No additional configuration needed.

### Option 2: `<ClientOnly>` Wrapper

For components that are only needed in specific pages, wrap them in Nuxt's built-in `<ClientOnly>`:

```vue
<!-- pages/patient/[id].vue -->
<template>
  <div>
    <h1>Patient Dashboard</h1>

    <!-- HELiX renders only on the client -->
    <ClientOnly>
      <hx-card>
        <span slot="heading">{{ patient.name }}</span>
        <p>Room {{ patient.room }}</p>
      </hx-card>

      <!-- Shown during SSR / before hydration -->
      <template #fallback>
        <div class="loading-skeleton">Loading patient data...</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { data: patient } = await useFetch(`/api/patients/${route.params.id}`);
</script>
```

### Option 3: Nuxt `vite` Config

Configure Vue's template compiler in `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    plugins: [],
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    },
  },
});
```

### Complete Nuxt Page Example

```vue
<!-- pages/patients.vue -->
<template>
  <div class="patients-page">
    <h1>Patients</h1>

    <ClientOnly>
      <div class="patient-grid">
        <hx-card v-for="patient in patients" :key="patient.id">
          <span slot="heading">{{ patient.name }}</span>
          <dl>
            <dt>MRN</dt>
            <dd>{{ patient.mrn }}</dd>
            <dt>Room</dt>
            <dd>{{ patient.room }}</dd>
          </dl>
          <hx-button
            slot="actions"
            variant="secondary"
            @hx-click="viewPatient(patient.id)"
          >
            View Details
          </hx-button>
        </hx-card>
      </div>

      <template #fallback>
        <p>Loading patients...</p>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
interface Patient {
  id: string;
  name: string;
  mrn: string;
  room: string;
}

const { data: patients } = await useFetch<Patient[]>('/api/patients');

function viewPatient(id: string) {
  navigateTo(`/patients/${id}`);
}
</script>
```

---

## Related

- [React & Next.js](./react/)
- [Angular](./angular/)
- [SSR/SSG Compatibility](./ssr-compatibility/)
- [Common Gotchas](./gotchas/)
