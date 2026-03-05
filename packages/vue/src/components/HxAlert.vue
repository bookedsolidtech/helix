<script setup lang="ts">
import '@helix/library/components/hx-alert'

interface Props {
  /** Visual variant of the alert that determines colors and ARIA semantics. */
  variant?: string
  /** Whether the alert can be dismissed by the user. */
  dismissible?: boolean
  /** Whether the alert is visible. Set to false to hide the alert. */
  open?: boolean
  /** Whether to show the default variant icon. Set to false to hide the icon container entirely. */
  icon?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-dismiss': [event: CustomEvent]
  'hx-after-dismiss': [event: CustomEvent]
}>()
</script>

<template>
  <hx-alert
    :variant="props.variant"
    :dismissible="props.dismissible"
    :open="props.open"
    :icon="props.icon"
    @hx-dismiss="emit('hx-dismiss', $event as CustomEvent)"
    @hx-after-dismiss="emit('hx-after-dismiss', $event as CustomEvent)"
  >
    <slot />
    <slot name="icon" slot="icon" />
    <slot name="actions" slot="actions" />
  </hx-alert>
</template>
