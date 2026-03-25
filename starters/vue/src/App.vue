<script setup lang="ts">
import { ref } from 'vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import ButtonDemo from './components/ButtonDemo.vue';
import FormDemo from './components/FormDemo.vue';
import CardDemo from './components/CardDemo.vue';

type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

const theme = ref<ThemeName>('light');
</script>

<template>
  <hx-theme :theme="theme">
    <div style="padding: 2rem; max-width: 960px; margin: 0 auto">
      <header style="margin-bottom: 2rem">
        <h1>HELiX Vue Starter Kit</h1>
        <p>
          Demonstrates how to use HELiX web components in Vue 3 with
          <code>isCustomElement</code> configuration, typed event handling, and theme switching via
          <code>hx-theme</code>.
        </p>
      </header>

      <ThemeSwitcher :current-theme="theme" @theme-change="theme = $event" />

      <main>
        <ButtonDemo />
        <FormDemo />
        <CardDemo />
      </main>
    </div>
  </hx-theme>
</template>
