<script setup lang="ts">
import '@helix/library/components/hx-field'

interface Props {
  /** The visible label text for the field. */
  label?: string
  /** Whether the field is required. Shows a required indicator on the label. */
  required?: boolean
  /** Error message to display. When set, the field enters an error state. */
  error?: string
  /** Help text displayed below the control for guidance. */
  helpText?: string
  /** Visual disabled state applied via opacity. Does not affect slotted control
interactivity — set disabled on the slotted control directly. */
  disabled?: boolean
  /** Size variant controlling label and help text font sizes. */
  hxSize?: 'sm' | 'md' | 'lg'
}

const props = defineProps<Props>()
</script>

<template>
  <hx-field
    :label="props.label"
    :required="props.required"
    :error="props.error"
    :help-text="props.helpText"
    :disabled="props.disabled"
    :hx-size="props.hxSize"
  >
    <slot />
    <slot name="label" slot="label" />
    <slot name="help" slot="help" />
    <slot name="error" slot="error" />
    <slot name="description" slot="description" />
  </hx-field>
</template>
