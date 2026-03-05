<script setup lang="ts">
import '@helix/library/components/hx-badge'

interface Props {
  /** Visual style variant of the badge. */
  variant?: | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'error' | 'neutral' | 'info'
  /** Size of the badge. */
  hxSize?: 'sm' | 'md' | 'lg'
  /** Whether the badge uses fully rounded (pill) styling. */
  pill?: boolean
  /** Whether the badge displays an animated pulse for attention. */
  pulse?: boolean
  /** Whether the badge renders a dismiss button. */
  removable?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-remove': [event: CustomEvent]
}>()
</script>

<template>
  <hx-badge
    :variant="props.variant"
    :hx-size="props.hxSize"
    :pill="props.pill"
    :pulse="props.pulse"
    :removable="props.removable"
    @hx-remove="emit('hx-remove', $event as CustomEvent)"
  >
    <slot />
    <slot name="prefix" slot="prefix" />
  </hx-badge>
</template>
