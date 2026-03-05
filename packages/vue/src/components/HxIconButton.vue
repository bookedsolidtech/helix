<script setup lang="ts">
import '@helix/library/components/hx-icon-button'

interface Props {
  /** Accessible name for the button. Required. Rendered as `aria-label` and
`title` on the underlying element. A console warning is emitted when absent. */
  label?: string
  /** Visual style variant of the button. */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'
  /** Size of the button. */
  hxSize?: 'sm' | 'md' | 'lg'
  /** The type attribute for the underlying button element.
Has no effect when `href` is set. */
  type?: 'button' | 'submit' | 'reset'
  /** Whether the button is disabled. */
  disabled?: boolean
  /** When set, renders an `<a>` element instead of a `<button>`. */
  href?: string | undefined
  /** Name submitted with form data. Only applicable when rendering as a button. */
  name?: string | undefined
  /** Value submitted with form data. Only applicable when rendering as a button. */
  value?: string | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-click': [event: CustomEvent]
}>()
</script>

<template>
  <hx-icon-button
    :label="props.label"
    :variant="props.variant"
    :hx-size="props.hxSize"
    :type="props.type"
    :disabled="props.disabled"
    :href="props.href"
    :name="props.name"
    :value="props.value"
    @hx-click="emit('hx-click', $event as CustomEvent)"
  >
    <slot />
  </hx-icon-button>
</template>
