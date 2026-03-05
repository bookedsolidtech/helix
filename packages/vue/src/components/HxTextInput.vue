<script setup lang="ts">
import '@helix/library/components/hx-text-input'

interface Props {
  /** The visible label text for the input. */
  label?: string
  /** Placeholder text shown when the input is empty. */
  placeholder?: string
  /** The type of the native input element. */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date'
  /** Whether the input is required for form submission. */
  required?: boolean
  /** Whether the input is disabled. */
  disabled?: boolean
  /** Error message to display. When set, the input enters an error state. */
  error?: string
  /** Help text displayed below the input for guidance. */
  helpText?: string
  /** The name of the input, used for form submission. */
  name?: string
  /** Accessible name for screen readers, if different from the visible label. */
  ariaLabel?: string
  /** Whether the input is read-only. */
  readonly?: boolean
  /** Minimum number of characters allowed. */
  minlength?: number | undefined
  /** Maximum number of characters allowed. */
  maxlength?: number | undefined
  /** A regular expression pattern the value must match for form validation. */
  pattern?: string
  /** Hint for the browser's autocomplete feature. Accepts standard HTML autocomplete values. */
  autocomplete?: string
  /** Visual size of the input field. */
  hxSize?: 'sm' | 'md' | 'lg'
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
  <hx-text-input
    :value="model"
    :label="props.label"
    :placeholder="props.placeholder"
    :type="props.type"
    :required="props.required"
    :disabled="props.disabled"
    :error="props.error"
    :help-text="props.helpText"
    :name="props.name"
    :aria-label="props.ariaLabel"
    :readonly="props.readonly"
    :minlength="props.minlength"
    :maxlength="props.maxlength"
    :pattern="props.pattern"
    :autocomplete="props.autocomplete"
    :hx-size="props.hxSize"
    @hx-input="handleInput"
    @hx-change="handleChange"
  >
    <slot name="label" slot="label" />
    <slot name="prefix" slot="prefix" />
    <slot name="suffix" slot="suffix" />
    <slot name="help-text" slot="help-text" />
    <slot name="error" slot="error" />
    <slot />
  </hx-text-input>
</template>
