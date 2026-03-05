<script setup lang="ts">
import '@helix/library/components/hx-form'

interface Props {
  /** The URL to submit the form to. When empty, the form handles
submission client-side only and dispatches `wc-submit`. */
  action?: string
  /** The HTTP method used when submitting the form. */
  method?: 'get' | 'post'
  /** When true, disables the browser's built-in constraint validation
on form submission. */
  novalidate?: boolean
  /** Identifies the form for scripting and form discovery. */
  name?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'wc-submit': [event: CustomEvent]
  'wc-invalid': [event: CustomEvent]
  'wc-reset': [event: CustomEvent]
}>()
</script>

<template>
  <hx-form
    :action="props.action"
    :method="props.method"
    :novalidate="props.novalidate"
    :name="props.name"
    @wc-submit="emit('wc-submit', $event as CustomEvent)"
    @wc-invalid="emit('wc-invalid', $event as CustomEvent)"
    @wc-reset="emit('wc-reset', $event as CustomEvent)"
  >
    <slot />
  </hx-form>
</template>
