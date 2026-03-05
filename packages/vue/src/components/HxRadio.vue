<script setup lang="ts">
import '@helix/library/components/hx-radio'

interface Props {
  /** The value this radio represents. */
  value?: string
  /** Visible label text for the radio. */
  label?: string
  /** Whether this radio is disabled. */
  disabled?: boolean
  /** Whether this radio is checked. Managed by the parent group. */
  checked?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <hx-radio
    :value="props.value"
    :label="props.label"
    :disabled="props.disabled"
    :checked="props.checked"
  >
    <slot />
  </hx-radio>
</template>
