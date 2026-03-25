# HX Step

An individual step, designed to be used inside an `<hx-steps>` container.
Represents a single step in a multi-step wizard or progress indicator.

## Usage

```twig
{% include 'helix:hx-step' with {
  label: '',
  status: 'pending',
  description: '',
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The step label text. |
| status | object | pending | Current status of the step. |
| description | string |  | Optional description text shown below the label. |
| disabled | boolean | false | Whether the step is disabled and non-interactive. |

## Slots

| Slot | Description |
|------|-------------|
| icon | Custom icon for the step indicator. Shown when status is `pending` or `active`. |
| label | Step label text. Falls back to the `label` property. |
| description | Step description text. Falls back to the `description` property. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-steps-indicator-size | 2rem | Indicator circle diameter. |
| --hx-steps-indicator-font-size | var(--hx-font-size-sm) | Indicator text size. |
| --hx-steps-indicator-icon-size | 1rem | Indicator icon size. |
| --hx-steps-label-font-size | var(--hx-font-size-sm) | Label font size. |
| --hx-steps-description-font-size | var(--hx-font-size-xs) | Description font size. |
| --hx-steps-connector-color | var(--hx-color-neutral-200) | Connector line color. |
| --hx-steps-connector-complete-color | var(--hx-color-primary-500) | Connector color when step is complete. |
| --hx-steps-connector-thickness | var(--hx-border-width,2px) | Connector line thickness. |
| --hx-steps-label-color | var(--hx-color-neutral-600) | Label text color. |
| --hx-steps-description-color | var(--hx-color-neutral-500) | Description text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The outermost wrapper element. |
| indicator | The circular step indicator. |
| connector | The line connecting this step to the next. |
| label | The step label element. |
| description | The step description element. |
