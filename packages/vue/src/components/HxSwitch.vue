<script setup lang="ts">
import '@helix/library/components/hx-switch'

interface Props {
  /** Whether the switch is disabled. */
  disabled?: boolean
  /** Whether the switch is required for form submission. */
  required?: boolean
  /** The name of the switch, used for form submission. */
  name?: string
  /** The value submitted when the switch is checked. */
  value?: string
  /** The visible label text for the switch. */
  label?: string
  /** Size variant of the switch. */
  hxSize?: 'sm' | 'md' | 'lg'
  /** Error message to display. When set, the switch enters an error state. */
  error?: string
  /** Help text displayed below the switch for guidance. */
  helpText?: string
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
  <hx-switch
    :checked="model"
    :disabled="props.disabled"
    :required="props.required"
    :name="props.name"
    :value="props.value"
    :label="props.label"
    :hx-size="props.hxSize"
    :error="props.error"
    :help-text="props.helpText"
    @hx-change="handleChange"
  >
    <slot />
    <slot name="error" slot="error" />
    <slot name="help-text" slot="help-text" />
  </hx-switch>
</template>
