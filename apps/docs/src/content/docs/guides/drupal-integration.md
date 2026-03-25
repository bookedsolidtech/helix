---
title: Drupal Integration Guide
description: Complete guide for integrating HELiX web components into Drupal 10/11 themes
sidebar:
  order: 10
---

# Drupal Integration Guide

This guide covers every layer of HELiX integration with Drupal CMS: asset loading, Twig templates, Drupal behaviors, styling strategy, Single Directory Components, and migration from legacy theme frameworks. All patterns apply to both Drupal 10 and Drupal 11.

---

## Overview

HELiX (`@helixui/library`) ships Lit 3.x web components built for Shadow DOM, CSS custom properties, slots, and CustomEvents. Drupal renders HTML server-side; HELiX components hydrate client-side. The integration model is straightforward:

1. Load the component JavaScript via Drupal's library system
2. Render component markup in Twig templates (server-side HTML)
3. Wire up Drupal behaviors for event handling and AJAX integration
4. Override design tokens via CSS custom properties (`--hx-*`) for theming
5. Optionally adopt stylesheets for light-DOM slotted content

**Drupal version support:**

| Version | Status | Notes |
|---|---|---|
| Drupal 10 | Supported | Requires Drupal 10.1+ for SDC |
| Drupal 11 | Supported | Full SDC support, recommended |

**What this guide covers:**

- Theme setup and directory structure
- `mytheme.libraries.yml` configuration for npm and CDN strategies
- Twig template patterns for every major component
- `Drupal.behaviors` integration with `attach` and `detach` lifecycle
- Light DOM styling with `@helixui/adopted-stylesheets`
- Admin theme vs. frontend theme asset separation
- CDN fallback with SRI integrity checking
- Performance optimization and Core Web Vitals
- Single Directory Components (SDC) with `component.yml` schema
- Migration from Bootstrap and Foundation

---

## Theme setup

### Installing @helixui/library via npm

HELiX is distributed as `@helixui/library` on npm. Add it as a dependency in your theme's `package.json`:

```json
{
  "name": "mytheme",
  "private": true,
  "dependencies": {
    "@helixui/library": "^1.0.0"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

Install with your package manager:

```bash
# pnpm (recommended)
pnpm install

# npm
npm install

# yarn
yarn install
```

### Recommended directory structure

```
mytheme/
├── mytheme.info.yml
├── mytheme.libraries.yml
├── mytheme.theme
├── package.json
├── vite.config.js
├── dist/
│   └── js/
│       ├── wc-library.js        # full bundle
│       ├── hx-button.js         # per-component
│       ├── hx-card.js
│       └── hx-text-input.js
├── templates/
│   ├── components/
│   │   ├── hx-button.html.twig
│   │   ├── hx-card.html.twig
│   │   └── hx-text-input.html.twig
│   └── views/
│       └── views-view-unformatted--patients.html.twig
├── components/                  # SDC components (Drupal 10.1+)
│   ├── patient-card/
│   │   ├── patient-card.component.yml
│   │   ├── patient-card.html.twig
│   │   └── patient-card.css
│   └── alert-banner/
│       ├── alert-banner.component.yml
│       └── alert-banner.html.twig
└── src/
    ├── js/
    │   ├── behaviors.js
    │   └── entry.js
    └── css/
        └── tokens.css
```

### Compiling assets with Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/js/entry.js'),
      formats: ['es'],
    },
    rollupOptions: {
      input: {
        // Full bundle
        'wc-library': resolve(__dirname, 'src/js/entry.js'),
        // Per-component entries for tree-shaking
        'hx-button': resolve(__dirname, 'src/js/components/hx-button.js'),
        'hx-card': resolve(__dirname, 'src/js/components/hx-card.js'),
        'hx-text-input': resolve(__dirname, 'src/js/components/hx-text-input.js'),
      },
      output: {
        dir: 'dist/js',
        entryFileNames: '[name].js',
      },
    },
  },
});
```

```javascript
// src/js/entry.js — full bundle
export * from '@helixui/library';
```

```javascript
// src/js/components/hx-button.js — per-component entry
export { HxButton } from '@helixui/library/components/hx-button/index.js';
```

---

## libraries.yml

Drupal's library system controls when and how assets load. Define your web component libraries in `mytheme.libraries.yml`.

### Full bundle strategy

```yaml
# mytheme.libraries.yml

# Full bundle — loads all HELiX components at once
helix-full:
  version: 1.0.0
  js:
    dist/js/wc-library.js:
      attributes:
        type: module
  dependencies:
    - core/once
```

### Per-component strategy (recommended for large sites)

Loading only the components a page needs reduces initial JavaScript payload and improves Time to Interactive. This is the recommended strategy for healthcare applications where page load directly impacts clinician workflows.

```yaml
# mytheme.libraries.yml

helix-button:
  version: 1.0.0
  js:
    dist/js/hx-button.js:
      attributes:
        type: module

helix-card:
  version: 1.0.0
  js:
    dist/js/hx-card.js:
      attributes:
        type: module

helix-text-input:
  version: 1.0.0
  js:
    dist/js/hx-text-input.js:
      attributes:
        type: module

helix-behaviors:
  version: 1.0.0
  js:
    dist/js/behaviors.js: {}
  dependencies:
    - core/drupal
    - core/once
```

### Attaching libraries in Twig

Use `attach_library()` to load assets conditionally — only on pages and components that need them:

```twig
{# Attach per-component in a template #}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-behaviors') }}

<hx-button variant="primary">Schedule Appointment</hx-button>
```

### Attaching libraries from mytheme.theme

```php
<?php
// mytheme.theme

/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];

  // Load card component only on article nodes
  if ($node->getType() === 'article') {
    $variables['#attached']['library'][] = 'mytheme/helix-card';
  }

  // Load form components only on patient intake nodes
  if ($node->getType() === 'patient_intake') {
    $variables['#attached']['library'][] = 'mytheme/helix-text-input';
    $variables['#attached']['library'][] = 'mytheme/helix-behaviors';
  }
}

/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(array &$variables): void {
  // Always load behaviors on every page
  $variables['#attached']['library'][] = 'mytheme/helix-behaviors';
}
```

### CSS custom properties and design tokens

```yaml
# mytheme.libraries.yml

helix-tokens:
  version: 1.0.0
  css:
    theme:
      css/tokens.css: {}
```

```css
/* css/tokens.css — global token overrides */
:root {
  --hx-color-primary: #005a9c;
  --hx-color-primary-hover: #004880;
  --hx-color-danger: #c0392b;
  --hx-spacing-md: 1rem;
  --hx-border-radius-md: 0.375rem;
  --hx-font-family-base: 'Inter', system-ui, sans-serif;
}
```

---

## Twig patterns

### hx-button

```twig
{# templates/components/hx-button.html.twig #}
{{ attach_library('mytheme/helix-button') }}

<hx-button
  variant="{{ variant|default('primary') }}"
  size="{{ size|default('md') }}"
  {% if disabled %}disabled{% endif %}
  {% if href %}href="{{ href }}"{% endif %}
  {% if type %}type="{{ type }}"{% endif %}
>
  {% if icon_before %}
    <hx-icon slot="prefix" name="{{ icon_before }}"></hx-icon>
  {% endif %}
  {{ label }}
  {% if icon_after %}
    <hx-icon slot="suffix" name="{{ icon_after }}"></hx-icon>
  {% endif %}
</hx-button>
```

Calling the button template from a node template:

```twig
{# Include with include() or embed() — pass variables explicitly #}
{% include 'mytheme:hx-button' with {
  label: 'Schedule Appointment',
  variant: 'primary',
  href: path('node', { node: node.id() }),
} only %}
```

### hx-text-input

```twig
{# templates/components/hx-text-input.html.twig #}
{{ attach_library('mytheme/helix-text-input') }}

<hx-text-input
  name="{{ name }}"
  label="{{ label }}"
  {% if placeholder %}placeholder="{{ placeholder }}"{% endif %}
  {% if required %}required{% endif %}
  {% if disabled %}disabled{% endif %}
  {% if readonly %}readonly{% endif %}
  {% if value %}value="{{ value }}"{% endif %}
  {% if type %}type="{{ type }}"{% endif %}
  {% if help_text %}help-text="{{ help_text }}"{% endif %}
  {% if error_message %}error-message="{{ error_message }}"{% endif %}
></hx-text-input>
```

Drupal Form API integration in a `.theme` preprocess:

```php
// Pass form element values into Twig variables
function mytheme_preprocess_form_element(array &$variables): void {
  $element = $variables['element'];
  $variables['hx_input_props'] = [
    'name'          => $element['#name'] ?? '',
    'label'         => $element['#title'] ?? '',
    'required'      => !empty($element['#required']),
    'value'         => $element['#value'] ?? '',
    'error_message' => implode(' ', $element['#errors'] ?? []),
  ];
}
```

### hx-card with slots

Slots map to child elements carrying a `slot` attribute. Drupal body content, entity fields, and media items slot in as light-DOM HTML:

```twig
{# templates/components/hx-card.html.twig #}
{{ attach_library('mytheme/helix-card') }}

{% set card_variant = variant|default('default') %}

<hx-card variant="{{ card_variant }}" elevation="{{ elevation|default('flat') }}">
  {% if image_url %}
    <img
      slot="image"
      src="{{ image_url }}"
      alt="{{ image_alt|default('') }}"
      loading="lazy"
    >
  {% endif %}

  <span slot="heading">{{ title }}</span>

  {% if meta %}
    <span slot="meta">{{ meta }}</span>
  {% endif %}

  {# Default slot receives body content — Drupal field markup #}
  {{ body|raw }}

  {% if cta_label %}
    <div slot="footer">
      <hx-button variant="secondary" href="{{ cta_url }}">
        {{ cta_label }}
      </hx-button>
    </div>
  {% endif %}
</hx-card>
```

### hx-dialog (modal)

```twig
{# templates/components/hx-dialog.html.twig #}
{{ attach_library('mytheme/helix-dialog') }}
{{ attach_library('mytheme/helix-behaviors') }}

{% set dialog_id = dialog_id|default('hx-dialog-' ~ random()) %}

<hx-button
  variant="primary"
  data-dialog-trigger="{{ dialog_id }}"
>
  {{ trigger_label|default('Open') }}
</hx-button>

<hx-dialog
  id="{{ dialog_id }}"
  label="{{ dialog_label }}"
  {% if dialog_size %}size="{{ dialog_size }}"{% endif %}
>
  <span slot="header">{{ dialog_label }}</span>

  {{ dialog_body|raw }}

  <div slot="footer">
    <hx-button variant="secondary" data-dialog-close="{{ dialog_id }}">
      Cancel
    </hx-button>
    {% if confirm_label %}
      <hx-button variant="primary" data-dialog-confirm="{{ dialog_id }}">
        {{ confirm_label }}
      </hx-button>
    {% endif %}
  </div>
</hx-dialog>
```

### hx-tooltip

```twig
{# Tooltip wrapping a help icon — common in healthcare forms #}
{{ attach_library('mytheme/helix-tooltip') }}

<hx-tooltip content="{{ tooltip_text }}">
  <button
    slot="trigger"
    aria-label="More information about {{ field_label }}"
    type="button"
  >
    <hx-icon name="info-circle"></hx-icon>
  </button>
</hx-tooltip>
```

### Drupal Views integration

```twig
{# views/views-view-unformatted--patient-list.html.twig #}
{{ attach_library('mytheme/helix-card') }}

<div class="patient-list" {{ attributes }}>
  {% for row in rows %}
    {% set patient = row.content['#row'] %}
    <hx-card variant="default" elevation="raised">
      <span slot="heading">{{ patient.title }}</span>

      {% if patient.field_patient_id %}
        <span slot="meta">MRN: {{ patient.field_patient_id }}</span>
      {% endif %}

      <p>{{ patient.field_summary }}</p>

      <div slot="footer">
        <hx-button
          variant="secondary"
          href="{{ path('entity.node.canonical', { node: patient.nid }) }}"
        >
          View Record
        </hx-button>
      </div>
    </hx-card>
  {% endfor %}
</div>
```

### Using {% set %} to build complex attribute objects

```twig
{# Build component props cleanly before rendering #}
{% set alert_variant = message.type == 'error' ? 'danger' : message.type %}
{% set alert_props = {
  variant: alert_variant,
  closable: true,
  'aria-live': message.type == 'error' ? 'assertive' : 'polite',
} %}

<hx-alert
  {% for prop, value in alert_props %}
    {{ prop }}="{{ value }}"
  {% endfor %}
>
  {{ message.content }}
</hx-alert>
```

---

## Drupal behaviors

Drupal behaviors are the standard JavaScript lifecycle hook in Drupal. They run on initial page load and again after any AJAX response, BigPipe chunk delivery, or Turbo/turbolinks navigation. This makes them the correct place to wire up web component event listeners.

### attach and detach lifecycle

```javascript
// src/js/behaviors.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixComponents = {
    /**
     * attach() runs on initial page load and after every AJAX response.
     * Use once() to guarantee each element is initialized exactly once.
     *
     * @param {HTMLElement} context - The DOM context (document or AJAX-updated fragment)
     * @param {object} settings - Drupal.settings
     */
    attach(context, settings) {
      // Wire up card click navigation
      once('hx-card-init', 'hx-card[data-href]', context).forEach((card) => {
        card.addEventListener('hx-click', (event) => {
          const href = event.currentTarget.dataset.href;
          if (href) {
            window.location.href = href;
          }
        });
      });

      // Wire up dialog triggers
      once('hx-dialog-trigger', '[data-dialog-trigger]', context).forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const dialogId = trigger.dataset.dialogTrigger;
          const dialog = document.getElementById(dialogId);
          if (dialog) {
            dialog.open = true;
          }
        });
      });

      // Wire up dialog close buttons
      once('hx-dialog-close', '[data-dialog-close]', context).forEach((closeBtn) => {
        closeBtn.addEventListener('click', () => {
          const dialogId = closeBtn.dataset.dialogClose;
          const dialog = document.getElementById(dialogId);
          if (dialog) {
            dialog.open = false;
          }
        });
      });

      // Form submission feedback
      once('hx-form-feedback', 'form[data-hx-feedback]', context).forEach((form) => {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const submitBtn = form.querySelector('hx-button[type="submit"]');
          if (submitBtn) {
            submitBtn.loading = true;
          }
          // Drupal AJAX or native fetch goes here
        });
      });
    },

    /**
     * detach() runs before an element is removed from the DOM.
     * Use trigger === 'unload' to clean up listeners on page leave.
     *
     * @param {HTMLElement} context
     * @param {object} settings
     * @param {string} trigger - 'unload' | 'serialize' | 'move'
     */
    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Clean up any custom state attached to components
        // once() handles deregistration of processed flags automatically
      }
    },
  };
})(Drupal, once);
```

### AJAX and BigPipe compatibility

Drupal's AJAX system and BigPipe both deliver HTML fragments to the page after initial load. Because `attach()` is called with the updated `context` element, behaviors automatically re-run on new content. The `once()` API prevents double-initialization:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.helixToast = {
    attach(context) {
      // context is the newly inserted DOM fragment after AJAX
      // once() ensures the listener is not added again if the same
      // element is somehow processed twice
      once('hx-toast-dismiss', 'hx-toast', context).forEach((toast) => {
        toast.addEventListener('hx-hide', () => {
          // Remove from DOM after hide animation completes
          toast.addEventListener('animationend', () => toast.remove(), { once: true });
        });
      });
    },
  };
})(Drupal, once);
```

### Handling Turbo (Turbolinks-style navigation)

If your Drupal site uses a Turbo-based navigation module, components must handle page transitions gracefully. Use the `detach` hook with `trigger === 'unload'` to reset component state before Turbo swaps the page:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.helixTurbo = {
    attach(context) {
      once('hx-turbo-nav', 'hx-top-nav', context).forEach((nav) => {
        nav.addEventListener('hx-nav-change', (event) => {
          Drupal.announce(event.detail.label, 'polite');
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Close any open overlays before Turbo swaps the body
        context.querySelectorAll('hx-dialog[open], hx-drawer[open]').forEach((overlay) => {
          overlay.open = false;
        });
      }
    },
  };
})(Drupal, once);
```

### Waiting for custom element registration

When using `type: module` script loading, components register asynchronously. If a behavior needs to call component methods immediately on attach, wait for definition:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.helixDataTable = {
    attach(context) {
      once('hx-data-table-init', 'hx-data-table', context).forEach(async (table) => {
        // Wait for the custom element to be defined before calling its API
        await customElements.whenDefined('hx-data-table');

        // Now safe to call component methods
        const patientId = table.dataset.patientId;
        if (patientId) {
          table.filter({ patientId });
        }
      });
    },
  };
})(Drupal, once);
```

---

## Light DOM styling

HELiX components use Shadow DOM. Their internal styles are fully encapsulated. Slotted content — Drupal body text, CKEditor output, media fields — lives in the **light DOM** and is projected into `<slot>` elements visually.

Without an explicit mechanism, light-DOM content inside a shadow tree inherits only inherited CSS properties (color, font-family, line-height) from the host document. Block-level resets, link underlines, list styles, and table formatting do not reach it.

### Using @helixui/adopted-stylesheets

`@helixui/adopted-stylesheets` is the default pattern for styling slotted content. It injects a `CSSStyleSheet` into the host document's `adoptedStyleSheets` array, making styles available to all light-DOM content:

```bash
pnpm add @helixui/adopted-stylesheets
```

```javascript
// src/js/entry.js
import { AdoptedStylesheetsController } from '@helixui/adopted-stylesheets';
import contentStyles from '../css/content.css?inline';

// Adopt content styles on the host document
// This makes them available to all light-DOM slotted content
const controller = new AdoptedStylesheetsController(document, contentStyles);
controller.connect();
```

```yaml
# mytheme.libraries.yml
helix-adopted-styles:
  version: 1.0.0
  js:
    dist/js/adopted-styles.js:
      attributes:
        type: module
```

### CSS custom properties and --hx- tokens

All HELiX component styles consume `--hx-*` design tokens. Override them at the `:root` or component level:

```css
/* css/tokens.css — global overrides applied to all hx- components */
:root {
  /* Brand colors */
  --hx-color-primary: #005a9c;
  --hx-color-primary-hover: #004880;
  --hx-color-primary-active: #003666;

  /* Semantic colors for healthcare context */
  --hx-color-danger: #c0392b;
  --hx-color-warning: #d35400;
  --hx-color-success: #27ae60;
  --hx-color-info: #2980b9;

  /* Typography */
  --hx-font-family-base: 'Inter', system-ui, -apple-system, sans-serif;
  --hx-font-size-base: 1rem;
  --hx-line-height-base: 1.5;

  /* Spacing */
  --hx-spacing-xs: 0.25rem;
  --hx-spacing-sm: 0.5rem;
  --hx-spacing-md: 1rem;
  --hx-spacing-lg: 1.5rem;
  --hx-spacing-xl: 2rem;

  /* Border radius */
  --hx-border-radius-sm: 0.25rem;
  --hx-border-radius-md: 0.375rem;
  --hx-border-radius-lg: 0.5rem;
}
```

Component-level token overrides via CSS parts:

```css
/* Target the button's internal part without piercing shadow DOM */
hx-button::part(button) {
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Component-level token scope */
.patient-card-section hx-button {
  --hx-button-bg: var(--hx-color-primary);
  --hx-button-border-radius: var(--hx-border-radius-lg);
}
```

### SMACSS integration

HELiX tokens map cleanly to SMACSS categories. The `--hx-` prefix makes them easy to scope in existing SMACSS-structured themes:

```css
/* SMACSS: Base — typography that slotted content inherits */
body {
  font-family: var(--hx-font-family-base);
  font-size: var(--hx-font-size-base);
  line-height: var(--hx-line-height-base);
  color: var(--hx-color-text-primary);
}

/* SMACSS: Module — component-level customization */
.l-content hx-card {
  --hx-card-padding: var(--hx-spacing-lg);
}

/* SMACSS: Theme — brand overrides at the theme layer */
[data-theme='clinical'] {
  --hx-color-primary: #0a4d8c;
  --hx-color-primary-hover: #083d6e;
}
```

### Shadow DOM encapsulation boundary

A critical design constraint: CSS outside a Shadow DOM **cannot style elements inside it**, and CSS inside a Shadow DOM **cannot leak out**. The only communication channels are:

1. **CSS custom properties** — inherited through shadow boundaries. Set `--hx-*` tokens on any ancestor, they reach component internals.
2. **CSS parts** (`::part()`) — explicit styling hooks the component author exposes. Not inherited; must be targeted directly.
3. **Slots** — content lives in the light DOM. Styles on the host document apply to slotted content directly.

---

## Admin vs frontend

Enterprise healthcare Drupal sites typically run a separate admin theme. Load only the components needed in each context.

### Separate library configurations

```yaml
# mytheme.libraries.yml — frontend theme

helix-frontend:
  version: 1.0.0
  js:
    dist/js/wc-library.js:
      attributes:
        type: module

# Admin-specific components (forms, data tables, admin chrome)
helix-admin:
  version: 1.0.0
  js:
    dist/js/hx-data-table.js:
      attributes:
        type: module
    dist/js/hx-form.js:
      attributes:
        type: module
```

### Conditional loading in hook_preprocess_html

```php
// mytheme.theme

function mytheme_preprocess_html(array &$variables): void {
  $is_admin = \Drupal::service('router.admin_context')->isAdminRoute();

  if ($is_admin) {
    $variables['#attached']['library'][] = 'mytheme/helix-admin';
  } else {
    $variables['#attached']['library'][] = 'mytheme/helix-frontend';
  }
}
```

### Admin theme (Gin/Claro) integration

When running a separate admin theme such as Gin or Claro, create a companion admin theme library:

```yaml
# myadmintheme.libraries.yml

helix-admin-data:
  version: 1.0.0
  js:
    dist/js/hx-data-table.js:
      attributes:
        type: module
    dist/js/hx-structured-list.js:
      attributes:
        type: module
  dependencies:
    - core/drupal
    - core/once
```

```twig
{# Attach only admin-specific components in admin templates #}
{{ attach_library('myadmintheme/helix-admin-data') }}

<hx-data-table
  data-endpoint="{{ path('mytheme.api.patients') }}"
  columns="{{ columns_json }}"
  sortable
  paginated
></hx-data-table>
```

### Selective component loading in info.yml

Components can be attached globally for a specific theme or only to specific paths:

```php
// Attach per content type in hook_preprocess_node
function mytheme_preprocess_node(array &$variables): void {
  $type = $variables['node']->getType();

  $component_map = [
    'patient_profile'  => ['mytheme/helix-card', 'mytheme/helix-avatar'],
    'appointment'      => ['mytheme/helix-card', 'mytheme/helix-badge'],
    'clinical_note'    => ['mytheme/helix-prose', 'mytheme/helix-tag'],
    'medication_list'  => ['mytheme/helix-data-table', 'mytheme/helix-tag'],
  ];

  if (isset($component_map[$type])) {
    foreach ($component_map[$type] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}
```

---

## CDN fallback

For teams that cannot use a build pipeline, or need a zero-configuration starting point, HELiX can be loaded directly from a CDN.

### Loading from unpkg

```yaml
# mytheme.libraries.yml — CDN strategy

helix-cdn:
  version: 1.x
  js:
    https://unpkg.com/@helixui/library@1.0.0/dist/index.js:
      type: external
      attributes:
        type: module
```

### Loading from jsDelivr

```yaml
helix-cdn-jsdelivr:
  version: 1.x
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.0.0/dist/index.js:
      type: external
      attributes:
        type: module
```

### SRI integrity checking

Subresource Integrity (SRI) guarantees the file served by the CDN has not been tampered with. Generate the hash with:

```bash
curl -s https://unpkg.com/@helixui/library@1.0.0/dist/index.js \
  | openssl dgst -sha384 -binary \
  | openssl base64 -A
```

```yaml
# mytheme.libraries.yml — CDN with integrity check

helix-cdn-secure:
  version: 1.0.0
  js:
    https://unpkg.com/@helixui/library@1.0.0/dist/index.js:
      type: external
      attributes:
        type: module
        integrity: 'sha384-<base64-hash-here>'
        crossorigin: anonymous
```

In HTML the resulting tag looks like:

```html
<script
  type="module"
  src="https://unpkg.com/@helixui/library@1.0.0/dist/index.js"
  integrity="sha384-<base64-hash-here>"
  crossorigin="anonymous"
></script>
```

### Version pinning

Pin to an exact version (`@1.0.0`) rather than a range (`@^1.0.0`) for CDN URLs. Unpkg and jsDelivr do not guarantee cache headers on range specifiers, and a minor version bump that introduces a new token name could affect visual rendering in production.

### Production trade-offs

| Factor | CDN | npm + build |
|---|---|---|
| Setup time | Minutes | Hours |
| Tree-shaking | No — full bundle | Yes — per-component |
| Offline development | No | Yes |
| SRI control | Manual per release | Automated in CI |
| HTTP/2 push | CDN-dependent | Full control |
| Cache busting | Version in URL | Drupal library version hash |

The CDN strategy is appropriate for prototyping, low-traffic editorial sites, or cases where the theme developer has no access to a Node.js build pipeline. Healthcare production systems should use the npm build pipeline for full control over versioning, integrity, and bundle optimization.

---

## Performance

Healthcare applications must meet Core Web Vitals thresholds. Slow component loading directly impacts clinician productivity and, in high-acuity settings, patient safety.

### Core Web Vitals targets

| Metric | Description | Target |
|---|---|---|
| LCP (Largest Contentful Paint) | Render time of the largest visible element | < 2.5 s |
| CLS (Cumulative Layout Shift) | Visual stability during load | < 0.1 |
| FID (First Input Delay) / INP | Responsiveness to first interaction | < 200 ms |

Web components loaded with `type: module` are deferred by default (equivalent to `defer`). This prevents render blocking and is the single most important performance optimization for HELiX in Drupal.

### Preventing CLS with defined dimensions

Custom elements are `inline` by default until their Shadow DOM renders. Reserve space to prevent layout shift:

```css
/* Prevent CLS for cards while component hydrates */
hx-card {
  display: block;
  min-height: 12rem; /* Match expected card height */
  contain: layout;
}

hx-button {
  display: inline-flex;
  min-height: 2.5rem;
  min-width: 6rem;
}

hx-text-input {
  display: block;
  min-height: 3.5rem;
}
```

### Lazy loading below-the-fold components

Use dynamic import to defer component registration until the element enters the viewport:

```javascript
// src/js/behaviors.js — lazy load non-critical components

(function (Drupal, once) {
  Drupal.behaviors.helixLazy = {
    attach(context) {
      if (!('IntersectionObserver' in window)) {
        // Fallback: load immediately for older browsers
        import('@helixui/library/components/hx-carousel/index.js');
        return;
      }

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              obs.unobserve(entry.target);
              import('@helixui/library/components/hx-carousel/index.js');
            }
          });
        },
        { rootMargin: '200px' },
      );

      once('hx-lazy-carousel', 'hx-carousel', context).forEach((el) => {
        observer.observe(el);
      });
    },
  };
})(Drupal, once);
```

### Per-component loading with defer

When using separate script tags outside Drupal's library system (uncommon but valid in certain setups):

```html
<!-- Critical components: load immediately -->
<script type="module" src="/dist/js/hx-button.js"></script>

<!-- Non-critical: defer until after parse -->
<script type="module" defer src="/dist/js/hx-carousel.js"></script>
<script type="module" defer src="/dist/js/hx-data-table.js"></script>
```

With Drupal's library system, `type: module` already implies `defer`, so explicit `defer` is redundant but not harmful.

### HTTP/2 server push (nginx example)

```nginx
location /dist/js/ {
  # Push critical component scripts when the HTML page is requested
  http2_push /dist/js/hx-button.js;
  http2_push /dist/js/hx-text-input.js;
}
```

### Drupal asset aggregation

Enable Drupal's built-in JS aggregation for production. It combines library files into fewer HTTP requests. For `type: module` scripts, aggregation requires Drupal 10.2+ with the `core/modules/system/js/system.js` aggregation support for ES modules.

```php
// settings.php — production configuration
$config['system.performance']['js']['preprocess'] = TRUE;
$config['system.performance']['css']['preprocess'] = TRUE;
```

### Critical CSS for above-the-fold components

Inline the minimum styles needed to prevent CLS before the main stylesheet loads:

```twig
{# html.html.twig — inline critical styles #}
<style>
  /* Reserve space for HELiX components before hydration */
  hx-button { display: inline-flex; min-height: 2.5rem; }
  hx-card { display: block; min-height: 8rem; contain: layout; }
  hx-text-input { display: block; min-height: 3.5rem; }
  hx-nav { display: block; min-height: 3.5rem; }
</style>
```

### Caching strategy

Drupal appends a query-string version hash to aggregated files (`?v=abc123`). For un-aggregated CDN loads, pin to an exact version in the URL. The Drupal library `version:` key feeds into cache-busting in development mode.

---

## Single Directory Components

Drupal 10.1+ includes Single Directory Components (SDC), a first-class system for self-contained component files co-located with their templates. HELiX integrates cleanly with SDC: Twig SDC templates wrap HELiX web components and define the component's public interface via `component.yml`.

### component.yml schema

The `component.yml` file defines the component's name, status, props, and slots. Drupal uses this schema for component discovery, validation, and Storybook integration:

```yaml
# components/patient-card/patient-card.component.yml
name: Patient Card
status: stable
description: Displays a patient record summary using hx-card.
group: Clinical

props:
  type: object
  required:
    - patient_name
    - mrn
  properties:
    patient_name:
      type: string
      title: Patient Name
    mrn:
      type: string
      title: Medical Record Number
    dob:
      type: string
      title: Date of Birth
      format: date
    status:
      type: string
      title: Patient Status
      enum:
        - active
        - discharged
        - pending
      default: active
    cta_label:
      type: string
      title: CTA Label
      default: View Record
    cta_url:
      type: string
      title: CTA URL

slots:
  additional_info:
    title: Additional Information
    description: Optional supplemental content rendered below the primary fields.
  actions:
    title: Actions
    description: Additional action buttons for the card footer.

libraryOverrides:
  dependencies:
    - mytheme/helix-card
    - mytheme/helix-button
    - mytheme/helix-badge
```

### SDC Twig template

```twig
{# components/patient-card/patient-card.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-badge') }}

{% set status_variant = status == 'active' ? 'success' : (status == 'pending' ? 'warning' : 'neutral') %}

<hx-card variant="default" elevation="raised">
  <span slot="heading">{{ patient_name }}</span>
  <span slot="meta">MRN: {{ mrn }}</span>

  <dl class="patient-meta">
    {% if dob %}
      <dt>Date of Birth</dt>
      <dd>{{ dob }}</dd>
    {% endif %}
    <dt>Status</dt>
    <dd>
      <hx-badge variant="{{ status_variant }}">
        {{ status|capitalize }}
      </hx-badge>
    </dd>
  </dl>

  {% if additional_info %}
    {{ additional_info }}
  {% endif %}

  <div slot="footer">
    <hx-button
      variant="secondary"
      href="{{ cta_url }}"
    >
      {{ cta_label }}
    </hx-button>
    {% if actions %}
      {{ actions }}
    {% endif %}
  </div>
</hx-card>
```

### Preview template

Drupal SDC supports a `preview` section in `component.yml` for Storybook and the component library browser:

```yaml
# components/patient-card/patient-card.component.yml (with preview)
name: Patient Card
status: stable

props:
  type: object
  properties:
    patient_name:
      type: string
    mrn:
      type: string
    status:
      type: string
      enum: [active, discharged, pending]
      default: active

slots:
  additional_info:
    title: Additional Information

previews:
  default:
    title: Default Patient Card
    props:
      patient_name: 'Jane Doe'
      mrn: '1234567'
      dob: '1975-08-14'
      status: active
      cta_label: View Record
      cta_url: '/patient/1234567'
  discharged:
    title: Discharged Patient
    props:
      patient_name: 'John Smith'
      mrn: '7654321'
      status: discharged
      cta_label: View History
      cta_url: '/patient/7654321/history'
```

### Component discovery

Drupal discovers SDC components in these locations:

- `themes/mytheme/components/` — theme-level components
- `modules/mymodule/components/` — module-level components

Enable the SDC module:

```bash
drush en sdc -y
```

Invoke a theme SDC component in Twig:

```twig
{# Invoke an SDC component by theme:component-name #}
{% include 'mytheme:patient-card' with {
  patient_name: node.title.value,
  mrn: node.field_mrn.value,
  dob: node.field_dob.value,
  status: node.field_status.value,
  cta_url: path('entity.node.canonical', { node: node.id() }),
} only %}
```

Invoke from PHP:

```php
// In a block plugin or preprocess function
use Drupal\Core\Render\Element\ComponentElement;

$render_array = [
  '#type' => 'component',
  '#component' => 'mytheme:patient-card',
  '#props' => [
    'patient_name' => $node->label(),
    'mrn'          => $node->field_mrn->value,
    'status'       => $node->field_status->value,
  ],
];
```

---

## Migration

Migrating from a Bootstrap or Foundation-based Drupal theme to HELiX is a phased process. Because HELiX components are valid HTML elements, they can coexist with legacy markup during the transition. There is no big-bang rewrite required.

### Bootstrap to HELiX component mapping

| Bootstrap | HELiX | Notes |
|---|---|---|
| `<button class="btn btn-primary">` | `<hx-button variant="primary">` | Shadow DOM encapsulated |
| `<div class="card">` | `<hx-card>` | Slot-based content projection |
| `<input class="form-control">` | `<hx-text-input>` | ElementInternals form participation |
| `<div class="alert alert-danger">` | `<hx-alert variant="danger">` | Includes dismiss, ARIA live |
| `<div class="modal">` | `<hx-dialog>` | Native `dialog` element base |
| `<div class="tooltip">` | `<hx-tooltip>` | Accessible by default |
| `<nav class="navbar">` | `<hx-top-nav>` | ARIA navigation landmark |
| `<div class="badge">` | `<hx-badge>` | Color variants via tokens |
| `<div class="progress">` | `<hx-progress-bar>` | ARIA `progressbar` built in |
| `<ul class="nav nav-tabs">` | `<hx-tabs>` | ARIA `tablist` pattern |
| `<div class="accordion">` | `<hx-accordion>` | ARIA `tree` / disclosure |
| `<div class="spinner-border">` | `<hx-spinner>` | Accessible loading indicator |

### Foundation to HELiX component mapping

| Foundation | HELiX | Notes |
|---|---|---|
| `<a class="button">` | `<hx-button>` | Renders as `<a>` or `<button>` |
| `<div class="card">` | `<hx-card>` | |
| `<div class="callout">` | `<hx-alert>` | |
| `<select>` in Chosen/Select2 | `<hx-select>` | Keyboard-accessible, Shadow DOM |
| `<div class="reveal">` | `<hx-dialog>` | |
| `<div class="orbit">` | `<hx-carousel>` | |
| `<ul class="tabs">` | `<hx-tabs>` | |
| `<div class="tooltip">` | `<hx-tooltip>` | |
| Foundation grid | `<hx-grid>` / `<hx-stack>` | CSS Grid and Flexbox |
| `<div class="top-bar">` | `<hx-top-nav>` | |

### Gradual, phased migration strategy

A phased migration minimizes risk in healthcare environments where theme regressions can affect patient-facing applications.

**Phase 1 — Leaf components (1-2 sprints)**

Start with atomic components that have no children and minimal state. These are safe to swap with zero risk of layout regression:

```twig
{# Before: Bootstrap button #}
<a href="{{ url }}" class="btn btn-primary">{{ label }}</a>

{# After: HELiX button — same HTML position, no layout change #}
<hx-button href="{{ url }}" variant="primary">{{ label }}</hx-button>
```

Components to migrate in Phase 1: `hx-button`, `hx-badge`, `hx-icon`, `hx-spinner`, `hx-tag`, `hx-tooltip`.

**Phase 2 — Form controls (2-3 sprints)**

Form controls require Drupal Form API integration via `#theme` overrides and field formatter plugins. Coordinate with QA to regression-test all form submissions:

```php
// Override the text_input form element theme
function mytheme_theme(): array {
  return [
    'input__text' => [
      'template'  => 'input--hx-text-input',
      'base hook' => 'input',
    ],
  ];
}
```

Components to migrate in Phase 2: `hx-text-input`, `hx-textarea`, `hx-checkbox`, `hx-radio`, `hx-select`, `hx-switch`.

**Phase 3 — Composite containers (3-4 sprints)**

Containers that receive slotted content need adopted stylesheets to ensure Drupal's rich-text output renders correctly inside Shadow DOM-projected slots:

```javascript
// Adopt content styles alongside container component migration
import { AdoptedStylesheetsController } from '@helixui/adopted-stylesheets';
import baseContentCss from '../css/content-base.css?inline';

new AdoptedStylesheetsController(document, baseContentCss).connect();
```

Components to migrate in Phase 3: `hx-card`, `hx-alert`, `hx-accordion`, `hx-dialog`, `hx-tabs`.

**Phase 4 — Navigation and layout (4-6 sprints)**

Navigation and layout components have the highest risk profile. Drupal's menu system, block layout, and responsive images must all be tested end-to-end:

Components to migrate in Phase 4: `hx-top-nav`, `hx-side-nav`, `hx-breadcrumb`, `hx-grid`, `hx-stack`.

**Phase 5 — Remove legacy framework**

Once all components are migrated and regression-tested, remove Bootstrap/Foundation from `mytheme.libraries.yml` and `package.json`. Run a full CLS audit with Lighthouse before removing — any element without a reserved space in CSS will shift on load.

### Coexistence pattern during migration

Bootstrap and HELiX can coexist in the same page during migration. The only conflict to watch for is CSS reset scoping. If Bootstrap's global `box-sizing: border-box` reset conflicts with HELiX token expectations, scope Bootstrap to a wrapper:

```css
/* Scope Bootstrap resets to legacy sections only */
.legacy-section * {
  box-sizing: border-box;
}

/* HELiX components use their own encapsulated box-model */
hx-button,
hx-card,
hx-text-input {
  /* External styles do not reach Shadow DOM internals */
}
```
