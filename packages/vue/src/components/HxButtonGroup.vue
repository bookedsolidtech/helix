<script setup lang="ts">
import '@helix/library/components/hx-button-group'

interface Props {
  /** Layout orientation of the button group. */
  orientation?: 'horizontal' | 'vertical'
  /** Size applied to the button group and cascaded to child buttons via
the --hx-button-group-size CSS custom property. */
  hxSize?: 'sm' | 'md' | 'lg'
}

const props = defineProps<Props>()
</script>

<template>
  <hx-button-group
    :orientation="props.orientation"
    :hx-size="props.hxSize"
  >
    <slot />
  </hx-button-group>
</template>
