/**
 * @helixds/vue — Vue 3 wrapper components for the Helix Design System
 *
 * Thin adapter layer over @helix/library web components. Each component
 * provides typed props, v-model support (where applicable), and proper
 * slot pass-through for Shadow DOM composition.
 *
 * @example
 * import { HxButton, HxTextInput } from '@helixds/vue'
 */

// Layout & structure
export { default as HxContainer } from './components/HxContainer.vue'
export { default as HxCard } from './components/HxCard.vue'
export { default as HxProse } from './components/HxProse.vue'

// Navigation & wayfinding
export { default as HxBreadcrumb } from './components/HxBreadcrumb.vue'
export { default as HxBreadcrumbItem } from './components/HxBreadcrumbItem.vue'

// Feedback & status
export { default as HxAlert } from './components/HxAlert.vue'
export { default as HxAvatar } from './components/HxAvatar.vue'
export { default as HxBadge } from './components/HxBadge.vue'

// Actions
export { default as HxButton } from './components/HxButton.vue'
export { default as HxButtonGroup } from './components/HxButtonGroup.vue'
export { default as HxIconButton } from './components/HxIconButton.vue'

// Form structure
export { default as HxForm } from './components/HxForm.vue'
export { default as HxField } from './components/HxField.vue'

// Form controls (with v-model support)
export { default as HxTextInput } from './components/HxTextInput.vue'
export { default as HxTextarea } from './components/HxTextarea.vue'
export { default as HxSelect } from './components/HxSelect.vue'
export { default as HxRadioGroup } from './components/HxRadioGroup.vue'
export { default as HxRadio } from './components/HxRadio.vue'
export { default as HxSlider } from './components/HxSlider.vue'
export { default as HxCheckbox } from './components/HxCheckbox.vue'
export { default as HxSwitch } from './components/HxSwitch.vue'

// Shared types
export type {
  HxSize,
  HxSizeXl,
  HxButtonVariant,
  HxButtonType,
  HxAlertVariant,
  HxBadgeVariant,
  HxAvatarShape,
  HxOrientation,
  HxInputType,
  HxTextareaResize,
  HxInputEventDetail,
  HxChangeStringEventDetail,
  HxChangeNumberEventDetail,
  HxChangeBooleanEventDetail,
  HxClickEventDetail,
  HxDismissEventDetail,
} from './types'
