<script setup lang="ts">
import '@helix/library/components/hx-radio-group'

interface Props {
  /** The name used for form submission. */
  name?: string
  /** The fieldset legend/label text. */
  label?: string
  /** Whether a selection is required for form submission. */
  required?: boolean
  /** Whether the entire group is disabled. */
  disabled?: boolean
  /** Error message to display. When set, the group enters an error state. */
  error?: string
  /** Help text displayed below the group for guidance. */
  helpText?: string
  /** Layout orientation of the radio items. */
  orientation?: 'vertical' | 'horizontal'
}

const model = defineModel<string>({ default: '' })

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-change': [event: CustomEvent]
}>()

function handleChange(e: Event): void {
  const detail = (e as CustomEvent<{ value: string }>).detail
  model.value = detail.value as string
  emit('hx-change', e as CustomEvent)
}
</script>

<template>
  <hx-radio-group
    :value="model"
    :name="props.name"
    :label="props.label"
    :required="props.required"
    :disabled="props.disabled"
    :error="props.error"
    :help-text="props.helpText"
    :orientation="props.orientation"
    @hx-change="handleChange"
  >
    <slot />
    <slot name="error" slot="error" />
    <slot name="help-text" slot="help-text" />
  </hx-radio-group>
</template>
