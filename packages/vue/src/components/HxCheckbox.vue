<script setup lang="ts">
import '@helix/library/components/hx-checkbox'

interface Props {
  /** Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns). */
  indeterminate?: boolean
  /** Whether the checkbox is disabled. */
  disabled?: boolean
  /** Whether the checkbox is required for form submission. */
  required?: boolean
  /** The name of the checkbox, used for form submission. */
  name?: string
  /** The value submitted when the checkbox is checked. */
  value?: string
  /** The visible label text for the checkbox. */
  label?: string
  /** Error message to display. When set, the checkbox enters an error state. */
  error?: string
  /** Help text displayed below the checkbox for guidance. */
  helpText?: string
  /** The size of the checkbox. */
  hxSize?: 'sm' | 'md' | 'lg'
}

const model = defineModel<boolean>({ default: false })

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-change': [event: CustomEvent]
}>()

function handleChange(e: Event): void {
  const detail = (e as CustomEvent<{ checked: boolean; value: string }>).detail
  model.value = detail.checked as boolean
  emit('hx-change', e as CustomEvent)
}
</script>

<template>
  <hx-checkbox
    :checked="model"
    :indeterminate="props.indeterminate"
    :disabled="props.disabled"
    :required="props.required"
    :name="props.name"
    :value="props.value"
    :label="props.label"
    :error="props.error"
    :help-text="props.helpText"
    :hx-size="props.hxSize"
    @hx-change="handleChange"
  >
    <slot />
    <slot name="error" slot="error" />
    <slot name="help-text" slot="help-text" />
  </hx-checkbox>
</template>
