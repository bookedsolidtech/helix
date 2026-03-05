<script setup lang="ts">
import '@helix/library/components/hx-breadcrumb'

interface Props {
  /** The separator character displayed between breadcrumb items. */
  separator?: string
  /** The accessible label for the nav landmark. */
  label?: string
}

const props = defineProps<Props>()
</script>

<template>
  <hx-breadcrumb
    :separator="props.separator"
    :label="props.label"
  >
    <slot />
  </hx-breadcrumb>
</template>
