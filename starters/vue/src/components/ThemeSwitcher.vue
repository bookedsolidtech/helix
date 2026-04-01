<script setup lang="ts">
import type { HxClickDetail } from '../helix.d.ts';

type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

const props = defineProps<{
  currentTheme: ThemeName;
}>();

const emit = defineEmits<{
  themeChange: [theme: ThemeName];
}>();

const themes: readonly ThemeName[] = ['light', 'dark', 'high-contrast', 'auto'];

function handleThemeClick(name: ThemeName) {
  return (_e: CustomEvent<HxClickDetail>) => emit('themeChange', name);
}
</script>

<template>
  <section style="margin-bottom: 2rem">
    <h2>Theme Switcher</h2>
    <p>
      Toggle themes. The <code>&lt;hx-theme&gt;</code> element wraps the entire app and injects
      <code>--hx-*</code> design tokens for the selected theme.
    </p>
    <hx-button-group>
      <hx-button
        v-for="name in themes"
        :key="name"
        :variant="currentTheme === name ? 'primary' : 'outline'"
        size="sm"
        @hx-click="handleThemeClick(name)"
      >
        {{ name }}
      </hx-button>
    </hx-button-group>
  </section>
</template>
