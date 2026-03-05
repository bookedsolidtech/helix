<script setup lang="ts">
import '@helix/library/components/hx-button'

interface Props {
  /** Visual style variant of the button. */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'
  /** Size of the button. */
  hxSize?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled. Prevents all interaction and form actions. */
  disabled?: boolean
  /** Whether the button is in a loading state. Shows spinner, prevents interaction,
and sets aria-busy. Does not set the disabled attribute. */
  loading?: boolean
  /** The type attribute for the underlying button element. Ignored when href is set. */
  type?: 'button' | 'submit' | 'reset'
  /** When set, renders an anchor element instead of a button. */
  href?: string | undefined
  /** Anchor target attribute. Only used when href is set. */
  target?: string | undefined
  /** Form field name submitted via ElementInternals.setFormValue on submit. */
  name?: string | undefined
  /** Form field value submitted via ElementInternals.setFormValue on submit. */
  value?: string | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'hx-click': [event: CustomEvent]
}>()
</script>

<template>
  <hx-button
    :variant="props.variant"
    :hx-size="props.hxSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :type="props.type"
    :href="props.href"
    :target="props.target"
    :name="props.name"
    :value="props.value"
    @hx-click="emit('hx-click', $event as CustomEvent)"
  >
    <slot />
    <slot name="prefix" slot="prefix" />
    <slot name="suffix" slot="suffix" />
  </hx-button>
</template>
