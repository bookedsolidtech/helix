<script setup lang="ts">
import '@helix/library/components/hx-slider'

interface Props {
  /** The name submitted with the form. */
  name?: string
  /** The minimum allowed value. */
  min?: number
  /** The maximum allowed value. */
  max?: number
  /** The stepping interval between values. */
  step?: number
  /** Whether the slider is disabled. */
  disabled?: boolean
  /** The visible label text for the slider. */
  label?: string
  /** Help text displayed below the slider for guidance. */
  helpText?: string
  /** When true, the current value is shown next to the label. */
  showValue?: boolean
  /** When true, tick marks are rendered at each step interval. */
  showTicks?: boolean
  /** The size variant of the slider. */
  hxSize?: 'sm' | 'md' | 'lg'
}

const model = defineModel<number>({ default: 0 })

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-input': [event: CustomEvent]
  'hx-change': [event: CustomEvent]
}>()

function handleChange(e: Event): void {
  const detail = (e as CustomEvent<{ value: number }>).detail
  model.value = detail.value as number
  emit('hx-change', e as CustomEvent)
}
</script>

<template>
  <hx-slider
    :value="model"
    :name="props.name"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :disabled="props.disabled"
    :label="props.label"
    :help-text="props.helpText"
    :show-value="props.showValue"
    :show-ticks="props.showTicks"
    :hx-size="props.hxSize"
    @hx-change="handleChange"
    @hx-input="emit('hx-input', $event as CustomEvent)"
  >
    <slot name="label" slot="label" />
    <slot name="help" slot="help" />
    <slot name="min-label" slot="min-label" />
    <slot name="max-label" slot="max-label" />
    <slot />
  </hx-slider>
</template>
