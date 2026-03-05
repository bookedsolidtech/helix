<script setup lang="ts">
import '@helix/library/components/hx-prose'

interface Props {
  /** Typography scale for the prose content. */
  size?: 'sm' | 'base' | 'lg'
  /** Maximum content width. When set, overrides the --hx-prose-max-width token.
Accepts any valid CSS width value (e.g., '640px', '80ch', '100%'). */
  maxWidth?: string
}

const props = defineProps<Props>()
</script>

<template>
  <hx-prose
    :size="props.size"
    :max-width="props.maxWidth"
  >
    <slot />
  </hx-prose>
</template>
