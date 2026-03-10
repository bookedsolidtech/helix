# hx-steps — Drupal Integration Guide

## Overview

`hx-steps` is a multi-step progress indicator composed of a parent `<hx-steps>` container and one or more `<hx-step>` children.

## Twig Template

Use the provided `hx-steps.twig` template. Pass a `steps` array and optional `orientation`, `size`, and `aria_label` variables.

### Template Variables

| Variable      | Type                           | Default           | Description                                      |
|---------------|--------------------------------|-------------------|--------------------------------------------------|
| `steps`       | array of step objects          | required          | Array of step data (see Step Object below)       |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'`    | Layout orientation                               |
| `size`        | `'sm'` \| `'md'` \| `'lg'`    | `'md'`            | Size variant                                     |
| `aria_label`  | string                         | `'Progress steps'`| Accessible name for the step list (required for WCAG) |

### Step Object Properties

| Property      | Type                                               | Required | Description                                          |
|---------------|----------------------------------------------------|----------|------------------------------------------------------|
| `label`       | string                                             | Yes      | Step label text                                      |
| `status`      | `'pending'` \| `'active'` \| `'complete'` \| `'error'` | Yes | Current step status                             |
| `description` | string                                             | No       | Optional description shown below the label           |
| `disabled`    | boolean                                            | No       | If true, step is non-interactive                     |

## Example Usage

```twig
{% include 'hx-steps.twig' with {
  aria_label: 'Checkout progress',
  orientation: 'horizontal',
  size: 'md',
  steps: [
    { label: 'Cart', status: 'complete', description: 'Items added' },
    { label: 'Payment', status: 'active', description: 'Enter payment info' },
    { label: 'Confirm', status: 'pending', description: 'Review order' },
  ]
} %}
```

## Attribute Mapping

Map Drupal field values to `hx-step` attributes as follows:

| Drupal Field          | hx-step Attribute | Notes                                                        |
|-----------------------|-------------------|--------------------------------------------------------------|
| step title / label    | `label`           | Required. Shown as the step label.                           |
| step state / workflow | `status`          | `pending`, `active`, `complete`, or `error`                  |
| step description      | `description`     | Optional. Shown below the label.                             |
| step disabled         | `disabled`        | Boolean. Prevents interaction.                               |

## Properties Managed by the Container

**Do NOT set these attributes on individual `<hx-step>` elements** in Twig templates:

- `orientation` — set on `<hx-steps>`, automatically propagated to children
- `size` — set on `<hx-steps>`, automatically propagated to children
- `index` — automatically set by `<hx-steps>` based on DOM order

Setting these directly on `<hx-step>` will be overridden after upgrade but may cause a flash of incorrect layout during server-side rendering or initial hydration.

## Accessibility Notes

- Always provide `aria-label` on `<hx-steps>` describing the overall process (e.g., "Checkout progress", "Application steps").
- The component uses `role="list"` / `role="listitem"` to communicate step structure to screen readers.
- Active steps announce `aria-current="step"` automatically.
- Complete and error steps include visually hidden text ("Complete" / "Error") for screen reader users.
- Steps are keyboard-navigable (Tab to focus, Enter/Space to activate).

## Dynamic Step Count

For forms with conditional steps, render all steps in the Twig template. Use the `disabled` attribute to prevent interaction on steps the user has not yet reached:

```twig
{% for step in steps %}
  {% set is_disabled = step.index > current_step_index %}
  { label: step.title, status: step.status, disabled: is_disabled }
{% endfor %}
```
