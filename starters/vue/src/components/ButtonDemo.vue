<script setup lang="ts">
import { ref } from 'vue';
import type { HxClickDetail } from '../helix.d.ts';

const clickCount = ref(0);
const loading = ref(false);

const variants = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

function handleLoadingClick(_e: CustomEvent<HxClickDetail>) {
  loading.value = true;
  setTimeout(() => (loading.value = false), 2000);
}
</script>

<template>
  <section style="margin-bottom: 2rem">
    <h2>Button Demo</h2>

    <h3>Variants</h3>
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
      <hx-button v-for="v in variants" :key="v" :variant="v">{{ v }}</hx-button>
    </div>

    <h3>Sizes</h3>
    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap">
      <hx-button v-for="s in sizes" :key="s" :size="s" variant="primary">{{ s }}</hx-button>
    </div>

    <h3>Event handling</h3>
    <div style="display: flex; gap: 0.5rem; align-items: center">
      <hx-button variant="primary" @hx-click="clickCount++">Click me</hx-button>
      <span>
        Clicked <strong>{{ clickCount }}</strong> time{{ clickCount !== 1 ? 's' : '' }}
      </span>
    </div>

    <h3>Loading state</h3>
    <hx-button variant="secondary" :loading="loading" @hx-click="handleLoadingClick">
      {{ loading ? 'Processing...' : 'Simulate async action' }}
    </hx-button>

    <h3>Disabled</h3>
    <hx-button variant="primary" disabled>Disabled button</hx-button>

    <h3>Full width</h3>
    <hx-button variant="outline" full>Full-width button</hx-button>
  </section>
</template>
