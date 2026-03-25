# HELiX Drupal Template Reference

Cross-reference of all Drupal starter kit Twig templates against the
canonical component twig files in `packages/hx-library/src/components/`.

---

## Template Inventory

| Drupal Template | hx-* Component | Drupal Theme Hook | Source Twig Reference |
|-----------------|---------------|-------------------|----------------------|
| `helix-button.html.twig` | `hx-button` | `helix_button` | `packages/hx-library/src/components/hx-button/hx-button.twig` |
| `helix-card.html.twig` | `hx-card` | `helix_card` | `packages/hx-library/src/components/hx-card/hx-card.twig` |
| `helix-form-input.html.twig` | `hx-text-input` | `helix_form_input` | _(no source twig — form-specific)_ |
| `helix-form-select.html.twig` | `hx-select` | `helix_form_select` | _(no source twig — form-specific)_ |
| `helix-alert.html.twig` | `hx-alert` | `helix_alert` | `packages/hx-library/src/components/hx-alert/hx-alert.twig` |
| `helix-badge.html.twig` | `hx-badge` | `helix_badge` | _(no source twig — new for Drupal)_ |
| `helix-checkbox.html.twig` | `hx-checkbox` | `helix_checkbox` | `packages/hx-library/src/components/hx-checkbox/hx-checkbox.twig` |
| `helix-radio.html.twig` | `hx-radio` | `helix_radio` | _(no source twig; hx-radio is in hx-radio-group dir)_ |
| `helix-tooltip.html.twig` | `hx-tooltip` | `helix_tooltip` | `packages/hx-library/src/components/hx-tooltip/hx-tooltip.twig` |
| `helix-modal.html.twig` | `hx-dialog` | `helix_modal` | _(no source twig — new for Drupal)_ |

---

## Component Variable Maps

### hx-button

| Template Variable | hx-button Attribute | Notes |
|-------------------|--------------------|-|
| `label` | slot default | Button label text |
| `variant` | `variant` | primary \| secondary \| tertiary \| danger \| ghost \| outline |
| `size` | `hx-size` | sm \| md \| lg. Prefixed to avoid native `size` conflict |
| `disabled` | `disabled` (bool) | Boolean attribute |
| `loading` | `loading` (bool) | Boolean attribute |
| `type` | `type` | button \| submit \| reset. Ignored when `href` is set |
| `href` | `href` | When set, renders an anchor element |
| `target` | `target` | Anchor target. Only used with `href` |
| `name` | `name` | Form field name (ElementInternals) |
| `value` | `value` | Form field value |
| `aria_label` | `aria-label` | Required for icon-only buttons |
| `attributes` | spread | Additional HTML attributes |

Source: `packages/hx-library/src/components/hx-button/hx-button.twig`

---

### hx-card

| Template Variable | hx-card Attribute / Slot | Notes |
|-------------------|--------------------------|-|
| `variant` | `variant` | default \| featured \| compact |
| `elevation` | `elevation` | flat \| raised \| floating |
| `heading` | slot `heading` | Use a semantic heading element |
| `heading_tag` | tag name of heading element | Default: h3 |
| `body` | slot default | Card body content |
| `footer` | slot `footer` | Optional footer content |
| `actions` | slot `actions` | NOT compatible with `href` |
| `image` | slot `image` | Object with `src` and `alt` keys |
| `href` | `hx-href` | Makes card interactive/clickable |
| `aria_label` | `hx-aria-label` | Required when `href` is set |
| `attributes` | spread | Additional HTML attributes |

Source: `packages/hx-library/src/components/hx-card/hx-card.twig`

---

### hx-text-input (form input)

No source twig in the library — this template is Drupal-specific. It maps
Drupal Form API text field elements to `hx-text-input`.

| Template Variable | hx-text-input Attribute | Notes |
|-------------------|------------------------|-|
| `label` | `label` | Visible label. Required for a11y |
| `name` | `name` | Form field name |
| `value` | `value` | Pre-populated value |
| `type` | `type` | text \| email \| password \| number \| tel \| url |
| `placeholder` | `placeholder` | Hint text |
| `required` | `required` (bool) | Boolean attribute |
| `disabled` | `disabled` (bool) | Boolean attribute |
| `error` | `error` | Error message string |
| `help_text` | `help-text` | Help text string |
| `attributes` | spread | Additional HTML attributes |

Preprocess function: `helix_module_preprocess_input()` in `helix_module.theme.inc`

---

### hx-select (form select)

No source twig in the library — this template is Drupal-specific.

| Template Variable | hx-select Attribute / Content | Notes |
|-------------------|-------------------------------|-|
| `label` | `label` | Visible label |
| `name` | `name` | Form field name |
| `options` | slotted `<option>` elements | Array of `{ value, label }` |
| `selected` | `selected` on matching `<option>` | Server-side selected value |
| `required` | `required` (bool) | Boolean attribute |
| `disabled` | `disabled` (bool) | Boolean attribute |
| `error` | `error` | Error message string |
| `help_text` | `help-text` | Help text string |
| `attributes` | spread | Additional HTML attributes |

Preprocess function: `helix_module_preprocess_select()` in `helix_module.theme.inc`

---

### hx-alert

| Template Variable | hx-alert Attribute / Slot | Notes |
|-------------------|--------------------------|-|
| `variant` | `variant` | info \| success \| warning \| error |
| `message` | slot default | Alert body content |
| `title` | slot `title` | Optional headline |
| `dismissible` | `dismissible` (bool) | Shows dismiss button |
| `show_icon` | `show-icon` (bool) | Default: true |
| `accent` | `accent` (bool) | Left-border accent style |
| `open` | `open` (bool) | Visibility. Default: true |
| `actions` | slot `actions` | Optional action buttons HTML |
| `attributes` | spread | Additional HTML attributes |

Source: `packages/hx-library/src/components/hx-alert/hx-alert.twig`

---

### hx-badge

No source twig in the library — this template is Drupal-specific.

| Template Variable | hx-badge Attribute | Notes |
|-------------------|--------------------|-------|
| `label` | slot default | Badge text. Omit when using `count` |
| `variant` | `variant` | primary \| secondary \| success \| warning \| error \| neutral \| info |
| `size` | `hx-size` | sm \| md \| lg |
| `removable` | `removable` (bool) | Shows dismiss button |
| `pill` | `pill` (bool) | Fully rounded styling |
| `pulse` | `pulse` (bool) | Animated pulse indicator |
| `count` | `count` | Numeric count value |
| `max` | `max` | Count truncation threshold. Default: 99 |
| `attributes` | spread | Additional HTML attributes |

---

### hx-checkbox

| Template Variable | hx-checkbox Attribute | Notes |
|-------------------|-----------------------|-------|
| `label` | `label` | Required. Visible label text |
| `name` | `name` | Form field name |
| `value` | `value` | Submitted value. Default: 'on' |
| `checked` | `checked` (bool) | Pre-checked state |
| `disabled` | `disabled` (bool) | Disabled state |
| `required` | `required` (bool) | Required state |
| `error` | `error` | Error message string |
| `help_text` | `help-text` | Help text string |
| `size` | `hx-size` | sm \| md \| lg |
| `aria_label` | `aria-label` | Override accessible name |
| `attributes` | spread | Additional HTML attributes |

Source: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.twig`

---

### hx-radio

No source twig in the library (hx-radio lives inside `hx-radio-group/`).
This template handles individual radio elements from Drupal Form API.

| Template Variable | hx-radio Attribute | Notes |
|-------------------|-------------------|-------|
| `label` | `label` | Required. Visible label text |
| `value` | `value` | Submitted value when selected |
| `checked` | `checked` (bool) | Pre-selected state |
| `disabled` | `disabled` (bool) | Disabled state |
| `attributes` | spread | Additional HTML attributes |

Group usage: Wrap multiple `helix-radio.html.twig` includes inside a
`<hx-radio-group>` element with `name`, `label`, and optionally `required`.

---

### hx-tooltip

| Template Variable | hx-tooltip Attribute / Slot | Notes |
|-------------------|-----------------------------|-------|
| `trigger_label` | slot default (button text) | Trigger button label |
| `content` | slot `content` | Tooltip text |
| `placement` | `placement` | Floating UI placement value. Default: top |
| `show_delay` | `show-delay` | Milliseconds. Default: 300 |
| `hide_delay` | `hide-delay` | Milliseconds. Default: 100 |
| `trigger_type` | `type` on inner button | button \| submit \| reset |
| `aria_label` | `aria-label` on inner button | For icon-only triggers |
| `attributes` | spread | Additional HTML attributes |

Source: `packages/hx-library/src/components/hx-tooltip/hx-tooltip.twig`

---

### hx-dialog (modal)

No source twig in the library — this template is Drupal-specific.

| Template Variable | hx-dialog Attribute / Slot | Notes |
|-------------------|-----------------------------|-------|
| `label` | `heading` | Required. Dialog heading text |
| `body_content` | slot default | Dialog body content |
| `open` | `open` (bool) | Initial open state |
| `dismissible` | inverted `hide-close-button` | Default: true (close button shown) |
| `modal` | `modal` (bool) | Blocks background. Default: true |
| `footer` | slot `footer` | Action buttons or footer HTML |
| `dialog_id` | `id` | For data-hx-dialog-trigger wiring |
| `attributes` | spread | Additional HTML attributes |

Events dispatched by `hx-dialog`:
- `hx-open` — dialog opened
- `hx-close` — dialog closed for any reason
- `hx-cancel` — dismissed via Escape key or cancel

---

## Preprocess Function Reference

All preprocess functions live in `helix_module/helix_module.theme.inc`.

| Function | Drupal element type | Maps to |
|----------|--------------------|-|
| `helix_module_preprocess_input()` | text, email, password, number, tel, url | `helix_*` variables for `helix-form-input.html.twig` |
| `helix_module_preprocess_select()` | select | `helix_*` variables for `helix-form-select.html.twig` |
| `helix_module_preprocess_checkbox()` | checkbox | `helix_*` variables for `helix-checkbox.html.twig` |
| `helix_module_preprocess_radio()` | radio | `helix_*` variables for `helix-radio.html.twig` |
| `helix_module_preprocess_button()` | submit, button | `helix_*` variables for `helix-button.html.twig` |
| `helix_module_preprocess_form_element()` | all form elements | `helix_help_text`, `helix_required`, `helix_input_type` |

Each function also adds a `theme_hook_suggestions` entry so Drupal resolves
the correct HELiX template from the registry.

---

## CDN Bundle Reference

Library: `@helixui/library@1.1.2`
CDN: `https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/`

Custom elements registered by the bundle:

| Tag | Component Class | Category |
|-----|----------------|---------|
| `hx-button` | HelixButton | Action |
| `hx-card` | HelixCard | Layout |
| `hx-text-input` | HelixTextInput | Form |
| `hx-select` | HelixSelect | Form |
| `hx-checkbox` | HelixCheckbox | Form |
| `hx-radio` | HelixRadio | Form |
| `hx-radio-group` | HelixRadioGroup | Form |
| `hx-alert` | HelixAlert | Feedback |
| `hx-badge` | HelixBadge | Indicator |
| `hx-tooltip` | HelixTooltip | Overlay |
| `hx-dialog` | HelixDialog | Overlay |
