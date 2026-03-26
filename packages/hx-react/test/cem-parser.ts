/**
 * CEM Parser — Simplified component metadata provider.
 *
 * The custom-elements.json may not be present in all environments (it is
 * generated output). This module provides hardcoded metadata for representative
 * components, derived from reading their TypeScript types in packages/hx-react/src/.
 *
 * Deviation rule applied: custom-elements.json missing → use manual component list.
 */

export interface ComponentMetadata {
  name: string;
  tagName: string;
  /** Native custom event names (NOT the React onXxx handler names). */
  events: string[];
  /** React prop names with example values for prop-forwarding tests. */
  props: Record<string, unknown>;
}

/** Metadata for representative components used in detailed testing. */
export const COMPONENT_METADATA: ComponentMetadata[] = [
  {
    name: 'HxButton',
    tagName: 'hx-button',
    events: ['hx-click'],
    props: { variant: 'secondary', disabled: false, size: 'sm', loading: false },
  },
  {
    name: 'HxTextInput',
    tagName: 'hx-text-input',
    events: ['hx-input', 'hx-change'],
    props: { label: 'Email', disabled: false, required: true },
  },
  {
    name: 'HxCheckbox',
    tagName: 'hx-checkbox',
    events: ['hx-change'],
    props: { label: 'Accept terms', disabled: false },
  },
  {
    name: 'HxSwitch',
    tagName: 'hx-switch',
    events: ['hx-change'],
    props: { label: 'Enable notifications', disabled: false },
  },
  {
    name: 'HxSelect',
    tagName: 'hx-select',
    events: ['hx-change'],
    props: { label: 'Country', disabled: false },
  },
  {
    name: 'HxTextarea',
    tagName: 'hx-textarea',
    events: ['hx-input', 'hx-change'],
    props: { label: 'Comments', rows: 4, disabled: false },
  },
  {
    name: 'HxCard',
    tagName: 'hx-card',
    events: ['hx-click'],
    props: { label: 'Card title' },
  },
  {
    name: 'HxAlert',
    tagName: 'hx-alert',
    events: [],
    props: { variant: 'info' },
  },
  {
    name: 'HxBadge',
    tagName: 'hx-badge',
    events: [],
    props: { variant: 'primary' },
  },
  {
    name: 'HxProgressBar',
    tagName: 'hx-progress-bar',
    events: [],
    props: { value: 50 },
  },
  {
    name: 'HxSpinner',
    tagName: 'hx-spinner',
    events: [],
    props: { size: 'md' },
  },
  {
    name: 'HxText',
    tagName: 'hx-text',
    events: [],
    props: { variant: 'body' },
  },
  {
    name: 'HxDivider',
    tagName: 'hx-divider',
    events: [],
    props: {},
  },
  {
    name: 'HxIcon',
    tagName: 'hx-icon',
    events: [],
    props: { name: 'check' },
  },
  {
    name: 'HxLink',
    tagName: 'hx-link',
    events: [],
    props: { href: 'https://example.com' },
  },
  {
    name: 'HxSlider',
    tagName: 'hx-slider',
    events: ['hx-change'],
    props: { min: 0, max: 100, value: 50 },
  },
  {
    name: 'HxRadio',
    tagName: 'hx-radio',
    events: ['hx-change'],
    props: { label: 'Option A', value: 'a' },
  },
  {
    name: 'HxToast',
    tagName: 'hx-toast',
    events: [],
    props: { variant: 'info' },
  },
  {
    name: 'HxTooltip',
    tagName: 'hx-tooltip',
    events: [],
    props: { content: 'Helpful tip' },
  },
  {
    name: 'HxDialog',
    tagName: 'hx-dialog',
    events: [],
    props: { label: 'Confirmation dialog' },
  },
  {
    name: 'HxDrawer',
    tagName: 'hx-drawer',
    events: [],
    props: { label: 'Side panel' },
  },
];
