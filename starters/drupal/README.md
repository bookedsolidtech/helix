# HELiX Drupal Starter Kit

Enterprise-grade integration of the HELiX UI web component library
(`@helixui/library`) with Drupal 10 and 11. Provides a ready-to-use Drupal
module (`helix_module`) with CDN asset loading, Twig templates for all core
components, Drupal.behaviors integration, and PHP preprocess functions that
map Drupal Form API render arrays to `hx-*` custom elements.

## Requirements

- Drupal 10.x or 11.x
- PHP 8.1+
- A modern browser (ES2020+ for web components)
- No Node.js required on the server (CDN loading is the default)

---

## Installation

### Option 1 — Composer (recommended)

Place the `helix_module` directory inside your Drupal installation at
`web/modules/custom/helix_module`, then enable the module:

```bash
cp -r starters/drupal/helix_module web/modules/custom/helix_module
drush en helix_module
drush cr
```

### Option 2 — Composer package (future)

When published to Packagist/Drupal.org:

```bash
composer require helixui/drupal-helix-module
drush en helix_module
drush cr
```

---

## CDN Configuration (default — no Node.js required)

The module loads `@helixui/library@1.1.2` from jsDelivr by default. No npm
install or build step is required on the server. The library definition in
`helix_module.libraries.yml` references:

```
https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/helix-library.js
```

The script is loaded as `type="module"` for native ES module parsing.

To pin a different version, update the URL in `helix_module.libraries.yml`
and increment the `version:` key to bust Drupal's asset cache.

---

## Local npm Build (offline / development)

For environments without external CDN access, use the `helix-local` library
instead. Build the bundle and copy it to the module directory:

```bash
npm install @helixui/library@1.1.2
cp node_modules/@helixui/library/dist/helix-library.js \
   web/modules/custom/helix_module/dist/helix-library.js
```

Then switch the library in `helix_module.module`:

```php
// In helix_module_page_attachments():
$attachments['#attached']['library'][] = 'helix_module/helix-local';
```

---

## Twig Template Usage

### Direct include in templates

All HELiX templates live in `helix_module/templates/`. Include them directly
in any Drupal Twig template:

```twig
{# Render a primary action button #}
{% include 'helix-button.html.twig' with {
  label: 'Save Patient Record',
  variant: 'primary',
  type: 'submit',
} %}

{# Render a content card #}
{% include 'helix-card.html.twig' with {
  heading: node.title.value,
  body: node.body.summary,
  variant: 'default',
  elevation: 'raised',
} %}

{# Render an error alert #}
{% include 'helix-alert.html.twig' with {
  variant: 'error',
  title: 'Submission failed',
  message: 'Please correct the highlighted fields.',
  dismissible: false,
} %}
```

### Using the theme system (render arrays)

Use the `#theme` key to render HELiX components from PHP render arrays:

```php
$build['save_button'] = [
  '#theme'   => 'helix_button',
  '#label'   => 'Save Patient Record',
  '#variant' => 'primary',
  '#type'    => 'submit',
];

$build['status_card'] = [
  '#theme'     => 'helix_card',
  '#heading'   => 'Margaret Thompson',
  '#body'      => 'Last visit: 2026-03-15',
  '#elevation' => 'raised',
];
```

### Views integration

Override the unformatted view template to wrap rows in `hx-card`:

```twig
{# views/views-view-unformatted--patients.html.twig #}
<div class="patient-list">
  {% for row in rows %}
    {% include 'helix-card.html.twig' with {
      heading: row.content['#row'].title,
      body: row.content['#row'].body,
      variant: 'default',
      elevation: 'raised',
    } %}
  {% endfor %}
</div>
```

### Status messages (map Drupal message types to alert variants)

```twig
{# templates/misc/status-messages.html.twig #}
{% for type, messages in message_list %}
  {% set helix_variant = type == 'status' ? 'success'
    : (type == 'error' ? 'error'
    : (type == 'warning' ? 'warning' : 'info')) %}
  {% for msg in messages %}
    {% include 'helix-alert.html.twig' with {
      variant: helix_variant,
      message: msg,
      dismissible: true,
    } %}
  {% endfor %}
{% endfor %}
```

---

## Drupal.behaviors for AJAX

The `js/helix.behaviors.js` file is loaded automatically with the library.
It bridges HELiX custom events to Drupal AJAX patterns.

### AJAX bridge via data attribute

Any HELiX component with `data-helix-ajax="<url>"` executes a Drupal AJAX
request when the component fires an `hx-click` event:

```twig
<hx-button data-helix-ajax="/ajax/save-draft">Save Draft</hx-button>
```

### Dialog trigger wiring

Wire a button to open an `hx-dialog` by matching IDs:

```twig
<hx-button
  variant="primary"
  type="button"
  data-hx-dialog-trigger="confirm-discharge"
>Discharge Patient</hx-button>

{% include 'helix-modal.html.twig' with {
  dialog_id: 'confirm-discharge',
  label: 'Confirm Discharge',
  body_content: 'Are you sure you want to discharge this patient?',
  footer: '<hx-button variant="danger" type="button">Confirm</hx-button>
           <hx-button variant="secondary" type="button">Cancel</hx-button>',
} %}
```

### Custom behavior example

Extend `Drupal.behaviors` in your own theme or module JS:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.myHelixIntegration = {
    attach: function (context) {
      once('my-hx-card-nav', 'hx-card[data-nid]', context).forEach(function (card) {
        card.addEventListener('hx-click', function (e) {
          var nid = card.getAttribute('data-nid');
          window.location.href = '/node/' + nid;
        });
      });
    },
  };

})(Drupal, once);
```

---

## Form API Automatic Mapping

The preprocess functions in `helix_module.theme.inc` automatically map Drupal
Form API render arrays to HELiX component attributes when you override the
relevant theme templates in your theme.

Supported form element types:

| Drupal type | HELiX component  |
|-------------|-----------------|
| text        | hx-text-input   |
| email       | hx-text-input   |
| password    | hx-text-input   |
| number      | hx-text-input   |
| tel         | hx-text-input   |
| url         | hx-text-input   |
| select      | hx-select       |
| checkbox    | hx-checkbox     |
| radio       | hx-radio        |
| submit      | hx-button       |
| button      | hx-button       |

To activate the mapping, copy the HELiX templates into your theme's
`templates/` directory and clear caches:

```bash
drush cr
```

---

## Lando Local Development

A `lando.yml` is included for local development with Lando:

```bash
lando start
lando drush si --site-name="HELiX Drupal" -y
lando drush en helix_module -y
lando drush cr
```

The site will be available at `https://helix-drupal.lndo.site`.

---

## Theming and Design Tokens

HELiX components use CSS custom properties for all visual styling. Override
at the semantic token level in your theme's CSS:

```css
/* Override primary brand color across all hx-* components */
:root {
  --hx-color-primary-500: #0057b8;
  --hx-color-primary-600: #004a99;
  --hx-font-family-sans: 'Inter', system-ui, sans-serif;
}
```

The three-tier token cascade:

```
Primitive (raw values)
  → Semantic (--hx-color-primary, --hx-spacing-md)
    → Component (--hx-button-bg, --hx-card-padding)
```

Always override at the semantic level. Component-level tokens are internal.

---

## Decoupled Drupal / Next.js

See `DECOUPLED.md` for patterns on consuming Drupal JSON:API with HELiX
components in a Next.js frontend.

---

## Troubleshooting

**Components are not rendering / showing as plain text.**
JavaScript has not loaded or has an error. Open the browser console. Ensure
the CDN URL is reachable. Check that `type="module"` is present on the script
tag (view page source).

**Twig templates are not being found.**
Run `drush cr` to rebuild the theme registry. Verify the module is enabled
with `drush pml | grep helix`.

**Form elements are not using HELiX components.**
Copy the relevant Twig templates from `helix_module/templates/` to your active
theme's `templates/` directory. Clear caches. Preprocess functions only inject
variables; the templates must exist in the theme registry.

**The dialog does not open when the trigger button is clicked.**
Verify the `data-hx-dialog-trigger` value matches the `id` on the `hx-dialog`
element. Check that `helix.behaviors.js` loaded without errors.

**htmx conflicts.**
HELiX uses `hx-*` attribute names (e.g. `hx-size`, `hx-href`) on its custom
elements. htmx also uses `hx-*` attribute names as directives. These do not
conflict because htmx processes `hx-*` attributes on standard HTML elements,
not on custom elements with unknown tag names. If you observe conflicts,
consult the htmx documentation on attribute exclusions.
