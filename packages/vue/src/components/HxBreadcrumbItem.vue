<script setup lang="ts">
import '@helix/library/components/hx-breadcrumb-item'

interface Props {
  /** The URL for this breadcrumb link. Omit for the current page (last item). */
  href?: string | undefined
}

const props = defineProps<Props>()
</script>

<template>
  <hx-breadcrumb-item
    :href="props.href"
  >
    <slot />
  </hx-breadcrumb-item>
</template>
