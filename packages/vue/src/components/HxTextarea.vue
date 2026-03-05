<script setup lang="ts">
import '@helix/library/components/hx-textarea'

interface Props {
  /** The visible label text for the textarea. */
  label?: string
  /** Placeholder text shown when the textarea is empty. */
  placeholder?: string
  /** Whether the textarea is required for form submission. */
  required?: boolean
  /** Whether the textarea is disabled. */
  disabled?: boolean
  /** Error message to display. When set, the textarea enters an error state. */
  error?: string
  /** Help text displayed below the textarea for guidance. */
  helpText?: string
  /** The name of the textarea, used for form submission. */
  name?: string
  /** The number of visible text rows. */
  rows?: number
  /** Maximum number of characters allowed. */
  maxlength?: number | undefined
  /** Controls how the textarea can be resized. Use 'auto' for auto-grow behavior. */
  resize?: 'none' | 'vertical' | 'both' | 'auto'
  /** Whether to show a character count below the textarea. */
  showCount?: boolean
  /** Accessible name for screen readers, if different from the visible label. */
  ariaLabel?: string
}

const model = defineModel<string>({ default: '' })

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-input': [event: CustomEvent]
  'hx-change': [event: CustomEvent]
}>()

function handleInput(e: Event): void {
  const detail = (e as CustomEvent<{ value: string }>).detail
  model.value = detail.value as string
  emit('hx-input', e as CustomEvent)
}
function handleChange(e: Event): void {
  const detail = (e as CustomEvent<{ value: string }>).detail
  model.value = detail.value as string
  emit('hx-change', e as CustomEvent)
}
</script>

<template>
  <hx-textarea
    :value="model"
    :label="props.label"
    :placeholder="props.placeholder"
    :required="props.required"
    :disabled="props.disabled"
    :error="props.error"
    :help-text="props.helpText"
    :name="props.name"
    :rows="props.rows"
    :maxlength="props.maxlength"
    :resize="props.resize"
    :show-count="props.showCount"
    :aria-label="props.ariaLabel"
    @hx-input="handleInput"
    @hx-change="handleChange"
  >
    <slot name="label" slot="label" />
    <slot name="help-text" slot="help-text" />
    <slot name="error" slot="error" />
    <slot />
  </hx-textarea>
</template>
