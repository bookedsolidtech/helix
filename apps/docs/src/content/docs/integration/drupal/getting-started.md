---
title: Getting Started with HELiX in Drupal
description: Quick start guide for integrating HELiX web components with Drupal 10 and 11 — install, configure, and render your first component in minutes.
sidebar:
  order: 1
---

HELiX components are standard Web Components. Drupal renders the tags as HTML; the browser upgrades them into interactive components when the JavaScript loads. No custom Drupal modules required.

This guide walks from zero to a working `hx-button` in a Drupal 10 or 11 theme.

---

## Prerequisites

- Drupal 10.x or 11.x
- A custom theme (Starterkit, Olivero sub-theme, or your own)
- Node.js 18+ if installing via npm

---

## Option A: CDN (5 minutes)

The fastest path. No build pipeline required.

### Step 1: Define the library

Add to your theme's `mytheme.libraries.yml`:

```yaml
helix:
  version: 0.1.0
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.1.0/dist/index.js:
      type: external
      attributes:
        type: module
```

### Step 2: Attach the library

Add to your `mytheme.info.yml` to load on every page:

```yaml
libraries:
  - mytheme/helix
```

Or attach only where needed in a Twig template:

```twig
{{ attach_library('mytheme/helix') }}
```

### Step 3: Use a component

In any Twig template:

```twig
<hx-button variant="primary">Schedule Appointment</hx-button>
```

That is all that is required. Clear Drupal's cache (`drush cr`) and the button renders with full HELiX styling.

---

## Option B: npm + Build Pipeline (Recommended for Production)

Gives you version control, tree-shaking, and offline capability.

### Step 1: Install the package

From your theme directory:

```bash
npm install @helixui/library
```

### Step 2: Add a build step

If your theme does not already have a build step, add a minimal Vite config (`vite.config.js`):

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/helix.js',
      formats: ['es'],
      fileName: 'helix',
    },
    outDir: 'dist/js',
    rollupOptions: {
      external: [],
    },
  },
});
```

Create `src/helix.js` to import the full library:

```js
import '@helixui/library';
```

Build with:

```bash
npx vite build
```

### Step 3: Define the library

In `mytheme.libraries.yml`:

```yaml
helix:
  version: 0.1.0
  js:
    dist/js/helix.js:
      preprocess: false
      attributes:
        type: module
```

### Step 4: Attach and use

```twig
{{ attach_library('mytheme/helix') }}
<hx-button variant="primary">Schedule Appointment</hx-button>
```

---

## Your First Component: hx-button

Once the library is loaded, any `hx-*` element in a Twig template renders as a HELiX component.

### Basic button

```twig
<hx-button variant="primary" size="md">
  Save Patient Record
</hx-button>
```

### Button as a link

```twig
<hx-button variant="secondary" href="{{ path('entity.node.canonical', {'node': node.id()}) }}">
  View Details
</hx-button>
```

### Disabled state from Drupal logic

```twig
<hx-button
  variant="primary"
  type="submit"
  {% if not form_is_valid %}disabled{% endif %}
>
  {{ 'Submit'|t }}
</hx-button>
```

### With an icon

```twig
<hx-button variant="primary">
  <hx-icon slot="prefix" name="calendar" size="16"></hx-icon>
  Schedule Appointment
</hx-button>
```

---

## Verify It Is Working

Open your browser's developer console and run:

```js
customElements.get('hx-button')
```

If it returns a class (not `undefined`), the component is registered and ready.

You can also check the DOM: a registered `hx-button` will have a `#shadow-root` visible in the Elements panel.

### Common first-render issues

**Component renders as unstyled text**

The JavaScript has not loaded yet. Check the Network tab for the `helix` JS file. Confirm `attach_library` is in the template, and `drush cr` has been run after library changes.

**`attach_library` throws a missing library error**

The library key in `mytheme.libraries.yml` does not match the string passed to `attach_library()`. Both must be `mytheme/helix` (theme machine name, slash, library key).

**`type: module` not appearing on the script tag**

Drupal's asset aggregation strips unknown attributes. Set `preprocess: false` on the JS entry in `libraries.yml`:

```yaml
helix:
  js:
    dist/js/helix.js:
      preprocess: false
      attributes:
        type: module
```

---

## Next Steps

- [Architecture](/integration/drupal/architecture/) — Understand the 3-layer pattern
- [CDN vs npm](/integration/drupal/cdn/) — Detailed comparison and configuration
- [Theming](/integration/drupal/theming/) — Override design tokens for your brand
- [Forms](/integration/drupal/forms/) — Integrate with Drupal Form API
