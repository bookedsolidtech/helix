<script setup lang="ts">
import '@helix/library/components/hx-container'

interface Props {
  /** Controls the max-width of the inner content wrapper. */
  width?: 'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl'
  /** Vertical padding applied to the outer wrapper. */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const props = defineProps<Props>()
</script>

<template>
  <hx-container
    :width="props.width"
    :padding="props.padding"
  >
    <slot />
  </hx-container>
</template>
