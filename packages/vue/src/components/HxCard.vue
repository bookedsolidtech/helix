<script setup lang="ts">
import '@helix/library/components/hx-card'

interface Props {
  /** Visual style variant of the card. */
  variant?: 'default' | 'featured' | 'compact'
  /** Elevation (shadow depth) of the card. */
  elevation?: 'flat' | 'raised' | 'floating'
  /** Optional URL. When set, the card becomes interactive (clickable)
and navigates to this URL on click.
Uses wc-href to avoid conflicting with the native HTML href attribute. */
  hxHref?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-card-click': [event: CustomEvent]
  'wc-card-click': [event: CustomEvent]
}>()
</script>

<template>
  <hx-card
    :variant="props.variant"
    :elevation="props.elevation"
    :hx-href="props.hxHref"
    @hx-card-click="emit('hx-card-click', $event as CustomEvent)"
    @wc-card-click="emit('wc-card-click', $event as CustomEvent)"
  >
    <slot name="image" slot="image" />
    <slot name="heading" slot="heading" />
    <slot />
    <slot name="footer" slot="footer" />
    <slot name="actions" slot="actions" />
  </hx-card>
</template>
