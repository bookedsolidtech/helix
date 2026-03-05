<script setup lang="ts">
import '@helix/library/components/hx-select'

interface Props {
  /** The visible label text for the select. */
  label?: string
  /** Placeholder text shown in the trigger when no option is selected. */
  placeholder?: string
  /** Whether the select is required for form submission. */
  required?: boolean
  /** Whether the select is disabled. */
  disabled?: boolean
  /** The name used for form submission. */
  name?: string
  /** Error message to display. When set, the field enters an error state. */
  error?: string
  /** Help text displayed below the select for guidance. */
  helpText?: string
  /** Size variant of the select trigger. */
  hxSize?: 'sm' | 'md' | 'lg'
  /** Accessible name for screen readers, if different from the visible label. */
  ariaLabel?: string
  /** Enables multi-select mode. Selected values are stored internally as a Set
and surfaced as removable tags inside the trigger. */
  multiple?: boolean
  /** Enables a search/filter input inside the listbox. */
  searchable?: boolean
  /** Controls whether the dropdown listbox is open. */
  open?: boolean
}

const model = defineModel<string>({ default: '' })

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-input': [event: CustomEvent]
  'hx-change': [event: CustomEvent]
}>()

function handleChange(e: Event): void {
  const detail = (e as CustomEvent<{ value: string }>).detail
  model.value = detail.value as string
  emit('hx-change', e as CustomEvent)
}
</script>

<template>
  <hx-select
    :value="model"
    :label="props.label"
    :placeholder="props.placeholder"
    :required="props.required"
    :disabled="props.disabled"
    :name="props.name"
    :error="props.error"
    :help-text="props.helpText"
    :hx-size="props.hxSize"
    :aria-label="props.ariaLabel"
    :multiple="props.multiple"
    :searchable="props.searchable"
    :open="props.open"
    @hx-change="handleChange"
    @hx-input="emit('hx-input', $event as CustomEvent)"
  >
    <slot />
    <slot name="label" slot="label" />
    <slot name="error" slot="error" />
    <slot name="help-text" slot="help-text" />
  </hx-select>
</template>
