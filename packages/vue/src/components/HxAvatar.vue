<script setup lang="ts">
import '@helix/library/components/hx-avatar'

interface Props {
  /** Image URL. When provided and successfully loaded, displays the image. */
  src?: string | undefined
  /** Accessible label for the image or avatar. */
  alt?: string
  /** Fallback initials text displayed when no image is available. */
  initials?: string
  /** Size variant of the avatar. */
  hxSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Shape variant of the avatar. */
  shape?: 'circle' | 'square'
}

const props = defineProps<Props>()
</script>

<template>
  <hx-avatar
    :src="props.src"
    :alt="props.alt"
    :initials="props.initials"
    :hx-size="props.hxSize"
    :shape="props.shape"
  >
    <slot />
    <slot name="badge" slot="badge" />
  </hx-avatar>
</template>
