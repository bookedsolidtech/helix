# HELiX UI Starter Theme

A production-ready Drupal 10/11 starter theme demonstrating full integration with the
`@helixui/library` enterprise web component library. The theme uses Single Directory
Components (SDC), Drupal behaviors, the `@helixui/adopted-stylesheets` pattern, and
CSS custom property theming to compose HELiX `hx-*` web components into a complete
Drupal front-end.

---

## Table of Contents

1. [Overview and Architecture](#overview-and-architecture)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [How SDC Works with HELiX](#how-sdc-works-with-helix)
6. [CSS Adopted Stylesheets](#css-adopted-stylesheets)
7. [Drupal Behaviors Integration](#drupalbehaviors-integration)
8. [Component Customization with CSS Custom Properties](#component-customization-with-css-custom-properties)
9. [Theming Examples](#theming-examples)
10. [Asset Loading Strategy](#asset-loading-strategy)
11. [Building for Production](#building-for-production)
12. [Troubleshooting](#troubleshooting)
13. [API Reference — SDC Components](#api-reference--sdc-components)
14. [Migration Guide from Traditional Themes](#migration-guide-from-traditional-themes)
15. [Accessibility Compliance](#accessibility-compliance)

---

## Overview and Architecture

The HELiX integration architecture has three layers:

```
Layer 1: @helixui/library
  - Lit 3.x web components with Shadow DOM encapsulation
  - Tag names: hx-button, hx-card, hx-text-input, etc.
  - Styled via --hx-* CSS custom properties (tokens)
  - Zero Drupal dependency

Layer 2: @helixui/drupal-starter (module-level SDCs)
  - Composition SDCs mapping Drupal field variables to hx-* slots
  - Drupal behaviors for interactive patterns (carousel, forms)
  - helixui.module + helixui.libraries.yml for asset loading
  - Installed at: /modules/contrib/helixui OR /libraries/helixui

Layer 3: helixui theme (this directory)
  - Full-page templates (page.html.twig, node.html.twig, block.html.twig)
  - Theme-level SDC wrappers: hero, card, site-header
  - Brand token overrides in css/theme.css
  - Light-DOM layout in css/light-dom-scoping.css
  - Adopted-stylesheets bridge in css/adopted-stylesheets.css
```

### What "Shadow DOM" means for Drupal developers

HELiX components use Shadow DOM internally for CSS encapsulation. This means:

- Normal Drupal CSS (base.css, claro.css, your theme.css) does **not** reach inside
  `hx-button`, `hx-card`, etc. — it stops at the shadow boundary.
- You theme the components exclusively via `--hx-*` CSS custom properties, which
  do cross the shadow boundary.
- Drupal SDC templates render in the **light DOM** — Twig outputs raw `<hx-button>`
  tags into the page. The Shadow DOM is created by the web component JavaScript.
- Meaningful fallback content inside HELiX component tags is visible before JS loads,
  ensuring progressive enhancement and SEO.

---

## Prerequisites

- **Node.js** 20+ (for local builds and asset copying)
- **PHP** 8.2+ with Composer
- **Drupal** 10.1+ or Drupal 11
- **Drupal modules** (required):
  - `sdc` — Single Directory Components (included in Drupal core 10.1+)
  - `helixui` — HELiX asset loader module (from `@helixui/drupal-starter`)
- **Drupal modules** (recommended):
  - `layout_builder` — Layout Builder compatibility tested
  - `big_pipe` — BigPipe streaming compatibility tested
- **npm packages** (in Drupal project):
  - `@helixui/library` — the web component library
  - `@helixui/tokens` — design token CSS
  - `@helixui/adopted-stylesheets` — the light-DOM/shadow-DOM bridge utilities

---

## Installation

### Step 1 — Install the Drupal module (helixui asset loader)

The `helixui` module provides `helixui.libraries.yml` which registers all
`hx-*` components as separate Drupal libraries loaded from `/libraries/helixui/`.

```bash
# Option A: via Composer (when published to Packagist)
composer require helixui/drupal-starter

# Option B: via local path repository in composer.json
# Add to your project's composer.json:
# "repositories": [
#   {
#     "type": "path",
#     "url": "../packages/drupal-starter"
#   }
# ]
composer require helixui/drupal-starter
```

### Step 2 — Enable the module

```bash
drush pm:enable helixui
```

### Step 3 — Copy assets from @helixui/library

The `helixui.libraries.yml` expects built JS/CSS files at `/libraries/helixui/`.

```bash
# Install @helixui/library in your Drupal project root
npm install @helixui/library @helixui/tokens

# Copy built assets to the libraries directory
# (This script is provided by the helixui module)
drush helixui:assets:install

# OR copy manually:
cp -r node_modules/@helixui/library/dist web/libraries/helixui/dist
cp -r node_modules/@helixui/tokens/dist web/libraries/helixui/dist/css/helix-tokens.css
```

### Step 4 — Install the theme

Copy this `theme/` directory to your Drupal project:

```bash
# Option A: copy to themes/contrib/
cp -r packages/drupal-starter/theme web/themes/contrib/helixui

# Option B: create a sub-theme and override from there (recommended for production)
mkdir -p web/themes/custom/mysite
# Then reference helixui as a base or copy files selectively
```

### Step 5 — Enable the theme

```bash
drush theme:enable helixui
drush config:set system.theme default helixui
drush cr
```

---

## Configuration

### settings.php additions

HELiX components use CSS custom properties for theming. To ensure the token sheet
is cached correctly with Drupal's CSS aggregation, add to `settings.php`:

```php
// Disable CSS aggregation for the token file during development.
// Remove in production — aggregation is safe with CSS custom properties.
$config['system.performance']['css']['preprocess'] = TRUE;

// Enable Declarative Shadow DOM polyfill for browsers that need it.
// Not required for Chrome 111+, Firefox 124+, Safari 16.4+.
$settings['helixui_dsd_polyfill'] = FALSE;
```

### SDC configuration

SDC component discovery is automatic from Drupal 10.1 onward. If you need
to verify SDC is active:

```php
// Check that SDC is enabled in your site's installed modules.
drush pm:list | grep sdc
```

To disable SDC in tests (performance isolation):

```php
// phpunit.xml.dist or kernel test base
$this->disableModules(['sdc']);
```

### Asset aggregation settings

For production, CSS and JS aggregation is recommended and fully compatible:

```php
$config['system.performance']['css']['preprocess'] = TRUE;
$config['system.performance']['js']['preprocess'] = TRUE;
```

`<script type="module">` tags are excluded from aggregation by Drupal core.
HELiX component JS files use `type: module` in `helixui.libraries.yml` and
are therefore loaded individually in the page `<head>` as ES modules.

---

## How SDC Works with HELiX

### The composition pattern

SDC (Single Directory Components) in Drupal are Twig templates with a YAML schema.
HELiX SDCs in this theme are **wrappers** — they accept Drupal-idiomatic props
(entity field values, render arrays) and map them to `hx-*` web component slots.

```
Drupal render pipeline:
  Entity / Views row
    -> node.html.twig (or views-view-unformatted.html.twig)
      -> {% include 'helixui:card' with { title, body, ... } %}
        -> card.twig renders: <hx-card>...</hx-card> (light DOM)
          -> hx-card JavaScript upgrades the element (Shadow DOM created)
```

### SDC namespace

All SDC components in this theme are discovered under the `helixui` namespace.
Reference them in Twig as `helixui:<component-name>`:

```twig
{# Include the theme-level card SDC #}
{% include 'helixui:card' with {
  title: node.label,
  body: content.body|render,
  link_url: url,
  link_text: 'Read more',
} only %}

{# Include the module-level hx-card SDC (lower-level API) #}
{% include 'helixui:hx-card' with {
  hx_href: url,
  heading: node.label,
  content: content.body,
} only %}
```

### Slot projection

HELiX web components use named slots for content areas. In SDC Twig templates,
slots are filled by placing content inside the custom element tag with a `slot`
attribute:

```twig
{# Twig fills web component slots via HTML slot attribute #}
<hx-card variant="outlined">
  <img slot="image" src="{{ image_url }}" alt="{{ image_alt }}" />
  <h3 slot="heading">{{ title }}</h3>
  {{ body }}
  <div slot="footer">{{ author_name }} &mdash; {{ date }}</div>
  <div slot="actions">
    <hx-button href="{{ url }}" variant="secondary">Read more</hx-button>
  </div>
</hx-card>
```

The default slot (no `slot` attribute) becomes the card's body content.

### Writing a new SDC component

1. Create a directory in `components/`:

```
components/my-component/
  my-component.component.yml
  my-component.twig
  my-component.css           # Light-DOM layout only
```

2. Define the YAML schema:

```yaml
# components/my-component/my-component.component.yml
$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json'
name: 'My Component'
description: 'Description for component library browser.'
status: stable
group: 'My Group'
props:
  type: object
  properties:
    title:
      type: string
      title: Title
      description: 'The component headline.'
    variant:
      type: string
      enum: [default, featured]
      default: 'default'
slots:
  footer:
    title: Footer
```

3. Write the Twig template:

```twig
{# components/my-component/my-component.twig #}
{{ attach_library('helixui/hx-card') }}
{{ attach_library('helixui/hx-text') }}

<div{{ attributes.addClass('my-component') }}>
  <hx-card variant="{{ variant|default('default') }}">
    <div slot="heading">
      <hx-text variant="heading-sm">{{ title }}</hx-text>
    </div>
    {{ content }}
    {% if footer %}
      <div slot="footer">{{ footer }}</div>
    {% endif %}
  </hx-card>
</div>
```

4. Clear Drupal caches:

```bash
drush cr
```

The component is immediately available as `helixui:my-component`.

---

## CSS Adopted Stylesheets

### What are adopted stylesheets?

The Constructable Stylesheets API (`document.adoptedStyleSheets`) allows JavaScript
to create `CSSStyleSheet` objects and inject them into any `Document` or `ShadowRoot`
at runtime. This is the standard mechanism for sharing styles between the light DOM
and shadow DOM without duplicating CSS text.

The `@helixui/adopted-stylesheets` package exposes:

```javascript
import { adoptStyles, removeStyles } from '@helixui/adopted-stylesheets';
import { createStyleSheet } from '@helixui/adopted-stylesheets';

const tokenSheet = createStyleSheet(`
  :root {
    --hx-color-primary: #1a56db;
  }
`);

// Adopt into the document (affects light DOM)
adoptStyles(document, tokenSheet);

// Adopt into a shadow root (affects one component's internals)
adoptStyles(myComponent.shadowRoot, tokenSheet);

// Reference-counted — remove when done
removeStyles(document, tokenSheet);
```

### How it is used in this theme

**Light DOM side** (`css/adopted-stylesheets.css`):

This CSS file handles styles that co-ordinate between light DOM elements and
shadow DOM components:

- Focus ring styles on `hx-button:focus-visible` (the ring appears in light DOM)
- Form item wrapper resets (`.form-item:has(hx-text-input)`)
- Adjacent element spacing (`hx-text + hx-button`)
- Drupal-specific integration points

**JavaScript side** (`js/theme.behaviors.js` — `helixuiAdoptedStylesheets` behavior):

If a scope root element (`hx-theme` or `[data-helixui-scope]`) is present, the
behavior injects a global token sheet into that element's shadow root at runtime.
This is only needed for components that need to receive token overrides from outside
their own shadow DOM in environments that do not yet fully support CSS custom property
inheritance through shadow DOM (older browsers).

Modern browsers (Chrome 111+, Firefox 124+, Safari 16.4+) inherit CSS custom
properties across shadow boundaries natively. The adopted-stylesheets path is a
belt-and-suspenders approach for enterprise healthcare environments with controlled
browser fleets that may include older browser versions.

---

## Drupal.behaviors Integration

### Why Drupal.behaviors matter for web components

Drupal's JavaScript system uses `Drupal.behaviors` to run JavaScript initialization
code that must be safe to re-execute. This is critical for:

- **Layout Builder** live previews (the page is partially re-rendered)
- **AJAX forms** (form regions are replaced via AJAX)
- **BigPipe** (page sections stream in asynchronously)
- **Views AJAX** (listing pages refresh without full page reload)

Web components work with all of these patterns because the browser upgrades custom
elements as soon as they appear in the DOM. However, **event listeners and secondary
initialization** must use `once()` to avoid doubling up.

### Pattern: once() for all web component event listeners

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.myBehavior = {
    attach: function (context) {
      // once() returns only elements that have NOT been processed with this key.
      once('my-key', 'hx-card[data-href]', context).forEach(function (card) {
        card.addEventListener('hx-navigate', function (event) {
          // Handle navigation
          window.location.href = event.detail.href;
        });
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        // once.remove() un-marks elements so they can be re-processed on
        // the next attach cycle (e.g. after Layout Builder moves them).
        once.remove('my-key', 'hx-card[data-href]', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: waiting for custom element upgrade

The web component JavaScript loads asynchronously (ES module, no `defer`). If your
behavior needs to call methods on the element (not just listen for events), wait for
the upgrade:

```javascript
once('my-key', 'hx-carousel', context).forEach(function (carousel) {
  customElements.whenDefined('hx-carousel').then(function () {
    // Now safe to call carousel.play(), carousel.pause(), etc.
    if (typeof carousel.play === 'function') {
      carousel.play(5000);
    }
  });
});
```

### Pattern: AJAX form integration

When Drupal's AJAX system replaces a form field with a rebuilt version, the new
custom element is already upgraded. Your behavior will re-attach to the new element
because `once()` keys are stored on the element node, which was just replaced:

```javascript
Drupal.behaviors.myFormBehavior = {
  attach: function (context) {
    // context is the newly inserted DOM fragment after AJAX.
    // once() finds the hx-text-input elements that are NEW in this fragment.
    once('my-input', 'hx-text-input[data-my-field]', context).forEach(function (input) {
      input.addEventListener('hx-change', function (event) {
        var value = event.detail.value;
        // Trigger Drupal's AJAX submit for dependent fields.
        var ajaxTrigger = input.closest('form').querySelector('[data-drupal-ajax-trigger]');
        if (ajaxTrigger) {
          ajaxTrigger.dispatchEvent(new Event('change'));
        }
      });
    });
  },

  detach: function (context, settings, trigger) {
    if (trigger === 'unload') {
      once.remove('my-input', 'hx-text-input[data-my-field]', context);
    }
  },
};
```

### Behaviors provided by this theme

| Behavior | Description |
|---|---|
| `helixuiTheme` | Marks `[data-helixui]` elements as ready; waits for upgrade |
| `helixuiAdoptedStylesheets` | Injects token sheet into shadow roots via adoptStyles() |
| `helixuiFocusManagement` | Restores focus after hx-dialog and hx-drawer close |
| `helixuiToastRegion` | Creates global hx-toast container; exposes `Drupal.helixui.notify()` |
| `helixuiFormEnhancement` | Syncs hx-change events to Drupal AJAX system |
| `helixuiMobileDrawer` | Manages mobile nav drawer open/close and body scroll lock |

---

## Component Customization with CSS Custom Properties

HELiX components expose a three-tier token system:

```
Primitive tokens    → raw values: #2563EB, 0.375rem
Semantic tokens     → purpose-named: --hx-color-primary, --hx-spacing-md
Component tokens    → per-component: --hx-button-bg, --hx-card-padding
```

### Override at the semantic level (recommended)

Overriding semantic tokens in `css/theme.css` affects all components at once:

```css
:root {
  /* Your brand's blue instead of HELiX default */
  --hx-color-primary: #1a56db;
  --hx-color-primary-hover: #1e429f;
  --hx-color-primary-contrast: #ffffff;

  /* Your brand typography */
  --hx-font-family: 'Open Sans', Arial, sans-serif;
  --hx-font-family-heading: 'Merriweather', Georgia, serif;
}
```

### Override at the component level (surgical)

```css
:root {
  /* Only affects hx-button border radius — not other components */
  --hx-button-border-radius: 9999px; /* pill-shaped buttons */

  /* Only affects hx-card */
  --hx-card-padding: 2rem;
  --hx-card-border-radius: 1rem;
}
```

### Override per-context (scope-specific)

CSS custom properties cascade. Override tokens inside a specific region to scope
them to that region only:

```css
/* Dark hero section — invert button colors */
.hero--variant-dark {
  --hx-color-primary: #ffffff;
  --hx-color-primary-contrast: #1a56db;
}

/* Patient portal sidebar — compact spacing */
.layout-sidebar-first {
  --hx-spacing-md: 0.75rem;
}
```

### Responsive tokens

Override tokens inside media queries to adapt spacing and typography:

```css
@media (max-width: 768px) {
  :root {
    --hx-spacing-2xl: 2rem; /* reduce hero padding on mobile */
    --hx-font-size-2xl: 1.5rem; /* scale down display headings */
  }
}
```

---

## Theming Examples

### Example 1 — Brand color palette

```css
/* css/theme.css */
:root {
  --hx-color-primary: #005d6e;      /* Healthcare teal */
  --hx-color-primary-hover: #004b59;
  --hx-color-primary-active: #003a46;
  --hx-color-primary-contrast: #ffffff;

  --hx-color-secondary: #8a4000;    /* Warm accent */
  --hx-color-secondary-hover: #6e3300;
  --hx-color-secondary-contrast: #ffffff;

  --hx-color-success: #2e7d32;
  --hx-color-danger: #c62828;
  --hx-color-warning: #e65100;
}
```

### Example 2 — Typography overrides

```css
/* Load custom fonts in page.html.twig via attach_library or @font-face */
:root {
  --hx-font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
  --hx-font-family-heading: 'Playfair Display', Georgia, serif;
  --hx-line-height-normal: 1.6;
  --hx-font-size-md: 1.0625rem; /* slightly larger base for accessibility */
}
```

### Example 3 — Clinical theme (high-contrast, conservative)

```css
/* Healthcare accessibility: high contrast, no rounded corners */
:root {
  --hx-color-primary: #0050b3;
  --hx-color-primary-contrast: #ffffff;
  --hx-radius-sm: 0;
  --hx-radius-md: 0;
  --hx-radius-lg: 2px;
  --hx-radius-xl: 2px;
  --hx-focus-ring-width: 3px;
  --hx-focus-ring-color: #ffb300;  /* High-contrast gold on dark */
  --hx-focus-ring-offset: 3px;
}
```

### Example 4 — Theming a node teaser via Twig

Override the card SDC for a specific content type without creating a new SDC:

```twig
{# templates/node--provider--teaser.html.twig #}
{{ attach_library('helixui/hx-card') }}
{{ attach_library('helixui/hx-badge') }}
{{ attach_library('helixui/hx-text') }}
{{ attach_library('helixui/hx-button') }}
{{ attach_library('helixui/hx-avatar') }}

<hx-card variant="outlined" elevation="raised">
  <hx-avatar
    slot="image"
    src="{{ content.field_headshot|render }}"
    size="xl"
    label="{{ node.label }}"
  ></hx-avatar>

  <div slot="heading">
    <hx-text variant="heading-sm">{{ node.label }}</hx-text>
    <hx-badge variant="neutral">{{ content.field_specialty|render }}</hx-badge>
  </div>

  <hx-text variant="body-sm">
    Accepting new patients
  </hx-text>

  <div slot="actions">
    <hx-button variant="primary" href="{{ url }}">View Profile</hx-button>
    <hx-button variant="secondary" href="/book/{{ node.id() }}">Book Appointment</hx-button>
  </div>
</hx-card>
```

### Example 5 — Views integration

Override the Views unformatted row template for a patient listing:

```twig
{# templates/views/views-view-unformatted--patients--card-grid.html.twig #}
{{ attach_library('helixui/light-dom-scoping') }}

<div class="hx-component-grid">
  {% for row in rows %}
    <div{{ row.attributes }}>
      {% include 'helixui:card' with {
        title: row.content['#row'].title,
        body: row.content['#row'].field_specialty,
        image_url: row.content['#row'].field_headshot,
        image_alt: row.content['#row'].title ~ ' headshot',
        link_url: row.content['#row'].path,
        link_text: 'View Profile',
        variant: 'outlined',
      } only %}
    </div>
  {% endfor %}
</div>
```

---

## Asset Loading Strategy

### CDN loading (simplest)

Replace the `helixui.libraries.yml` paths with CDN URLs:

```yaml
# In helixui.libraries.yml (theme level)
global:
  version: VERSION
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/drupal
```

Use CDN when:
- You cannot run a build step on the Drupal server
- You want zero-config setup for prototyping
- You are using Drupal's managed hosting (Acquia, Pantheon, Platform.sh)

### npm + Drupal libraries (recommended for production)

```bash
# In your Drupal project root
npm install @helixui/library@1.1.2

# Copy to /libraries/helixui/ (or use a post-install script)
npx helixui-copy-assets  # provided by the helixui module
```

This strategy:
- Locks the component version in `package.json`
- Works with Drupal's CSS/JS aggregation pipeline
- Allows HTTP/2 server push for component bundles
- Passes OWASP security scans (no runtime CDN dependency)

### Per-component loading (performance-optimized)

Attach only the libraries needed by each template:

```twig
{# Only loads hx-card and hx-text — not the full bundle #}
{{ attach_library('helixui/hx-card') }}
{{ attach_library('helixui/hx-text') }}
```

Drupal's library system deduplicates assets — if multiple templates on the
same page all attach `helixui/hx-card`, the JS loads only once.

---

## Building for Production

This theme has no build step for its own files — Twig, YAML, and plain CSS/JS.
The HELiX library dist files are pre-built by the `@helixui/library` package.

Production deployment checklist:

1. Run `drush helixui:assets:install` to copy component JS to `/libraries/helixui/`
2. Enable CSS and JS aggregation in `settings.php`
3. Set `Drupal::configFactory()->getEditable('system.performance')` preprocess flags
4. Run `drush cr` to rebuild theme registry and clear caches
5. Run `drush deploy:hook` in your deployment pipeline

### Cache busting

Library version is declared in `helixui.libraries.yml`:

```yaml
global:
  version: 1.1.2
```

Update the version when you update `@helixui/library`. Drupal appends the version
as a query string to all aggregated files, invalidating CDN and browser caches.

---

## Troubleshooting

### Components not rendering (blank elements)

**Symptom**: `<hx-button>` appears in the DOM but shows no styles or content.

**Cause**: The component JavaScript did not load, so the custom element was never
upgraded from an `HTMLElement` to the full web component.

**Fix**:
1. Check browser DevTools Network tab for failed requests to `hx-button/index.js`
2. Verify `/libraries/helixui/` exists and contains the dist files
3. Run `drush helixui:assets:install`
4. Clear Drupal caches: `drush cr`
5. Check `helixui.libraries.yml` paths match the actual file locations

### Flash of unstyled content (FOUC)

**Symptom**: Page momentarily shows raw text before components style themselves.

**Cause**: CSS custom properties (`--hx-*`) are set, but the component JS
has not upgraded the element yet.

**Fix** — add a CSS rule to hide unupgraded elements:

```css
/* In css/theme.css */
hx-button:not(:defined),
hx-card:not(:defined),
hx-text-input:not(:defined) {
  opacity: 0;
  transition: opacity 0.1s;
}

/* Show immediately once the JS upgrades the element */
hx-button:defined,
hx-card:defined,
hx-text-input:defined {
  opacity: 1;
}
```

### SDC component not found (Twig error)

**Symptom**: `Unable to find component 'helixui:card'`

**Cause**: SDC auto-discovery has not found the component directory.

**Fix**:
1. Verify the `components/` directory exists at the theme root
2. Check `helixui.info.yml` has `components: components/`
3. Ensure each SDC subdirectory contains a matching `.component.yml` file
4. Run `drush cr` to rebuild the SDC registry

### Drupal.behaviors not running after AJAX

**Symptom**: Event listeners on `hx-*` elements stop working after a Views AJAX refresh.

**Cause**: `once()` key is still stored on the old element, which was removed from DOM.
The new element has no key so `once()` should work — but if you are using `document`
as the context instead of the `context` argument from `attach()`, `once()` sees the
document and thinks initialization already happened.

**Fix**: Always pass `context` to `once()`:

```javascript
// CORRECT — uses context (the AJAX-replaced fragment)
once('my-key', 'hx-card', context).forEach(fn);

// WRONG — uses document, so once() thinks it already ran
once('my-key', 'hx-card', document).forEach(fn);
```

### Token overrides not taking effect

**Symptom**: You set `--hx-color-primary: #ff0000` in your CSS but components still
show the default blue.

**Cause**: CSS specificity or load order. The `helixui/core` library loads
`helix-tokens.css` which defines the defaults. Your theme CSS must load **after**
to win the specificity.

**Fix**:
1. Verify `helixui/global` is listed in `helixui.info.yml` libraries
2. Ensure `css/theme.css` sets tokens at `:root` level (not nested in a class)
3. Disable CSS aggregation temporarily to check raw load order

### Focus rings missing

**Symptom**: Keyboard focus on `hx-button` shows no visible ring.

**Cause**: The `adopted-stylesheets.css` file is not loaded, or your CSS resets
`outline` too aggressively.

**Fix**:
1. Verify `helixui/adopted-stylesheets` is in `helixui.info.yml` libraries
2. Check that your CSS does not contain `* { outline: none }` or similar
3. Verify `--hx-focus-ring-color` and `--hx-focus-ring-width` tokens are set
4. Run an axe accessibility audit: `drush helixui:a11y:check --url=/`

---

## API Reference — SDC Components

### helixui:hero

Full-width hero section. Use for landing pages and healthcare service entry points.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Headline. Rendered as `h1`. Use once per page. |
| `subtitle` | string | — | Supporting text below the headline. |
| `cta_text` | string | — | Call-to-action button label. Requires `cta_url`. |
| `cta_url` | string | — | CTA button destination URL. |
| `image_url` | string | — | Background image URL. |
| `image_alt` | string | `''` | Alt text for background image. Use empty for decorative. |
| `variant` | string | `'primary'` | Color scheme: `light`, `dark`, or `primary`. |

**Slots**: `default` — additional content below the CTA (trust indicators, stats).

**Example**:

```twig
{% include 'helixui:hero' with {
  title: 'Expert Care for Your Family',
  subtitle: 'Board-certified physicians serving the region since 1987.',
  cta_text: 'Find a Doctor',
  cta_url: '/find-a-doctor',
  image_url: file_url(node.field_background.entity.uri.value),
  image_alt: '',
  variant: 'dark',
} only %}
```

---

### helixui:card

Content card with image, heading, body, footer, and optional CTA action.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card heading. |
| `body` | string | — | Body content (HTML allowed). |
| `image_url` | string | — | Optional card header image. |
| `image_alt` | string | `''` | Alt text for image. |
| `link_url` | string | — | When set with no `link_text`, makes the whole card a link. |
| `link_text` | string | — | CTA button label. When set, renders a button in the actions slot. |
| `variant` | string | `'default'` | `default`, `outlined`, or `filled`. |

**Slots**: `footer` — metadata row (author, date, taxonomy).

**Example**:

```twig
{% include 'helixui:card' with {
  title: node.label,
  body: content.field_summary|render,
  image_url: content.field_image|render,
  link_url: url,
  link_text: 'Learn More',
  footer: author_name ~ ' &mdash; ' ~ date,
  variant: 'outlined',
} only %}
```

---

### helixui:site-header

Global site header with logo, navigation, and mobile drawer.

| Prop | Type | Description |
|---|---|---|
| `site_name` | string | Site name linked to front page. |
| `logo_url` | string | Logo image URL. Falls back to site_name text. |

**Slots**:
- `navigation` — primary nav menu (rendered from `page.primary_menu`)
- `search` — search block or secondary menu

**Note**: The mobile drawer toggle is managed by the `helixuiMobileDrawer` Drupal
behavior in `js/theme.behaviors.js`. Ensure `helixui/adopted-stylesheets` is loaded.

---

## Migration Guide from Traditional Themes

Migrating an existing Drupal theme to use HELiX components is a gradual process.
The following phases allow zero-downtime, progressive migration.

### Phase 1 — Load the library (one day)

Add the helixui module and asset libraries without changing any templates. This
makes `hx-*` custom element tags available throughout the theme with no visual impact.

```bash
composer require helixui/drupal-starter
drush pm:enable helixui
drush helixui:assets:install
drush cr
```

### Phase 2 — Replace leaf components (1-2 weeks)

Start with the smallest, lowest-risk components: buttons, badges, status indicators.
Override template files one at a time:

```twig
{# Before: standard Drupal anchor-as-button #}
<a href="{{ url }}" class="button button--primary">{{ text }}</a>

{# After: hx-button (drop-in replacement) #}
{{ attach_library('helixui/hx-button') }}
<hx-button variant="primary" href="{{ url }}">{{ text }}</hx-button>
```

Test each replacement with keyboard navigation, screen reader, and automated axe audit.

### Phase 3 — Replace content cards (2-4 weeks)

Swap node teaser templates and Views row templates to use `helixui:card`:

```twig
{# node--article--teaser.html.twig #}
{% include 'helixui:card' with {
  title: node.label,
  body: content.body|render,
  link_url: url,
  image_url: file_url(node.field_image.entity.uri.value),
  image_alt: node.field_image.alt,
} only %}
```

### Phase 4 — Replace layout chrome (2-4 weeks)

Migrate the site header, navigation, breadcrumb, and footer to use HELiX SDCs.
This is the highest-risk phase — test thoroughly in all viewport sizes.

### Phase 5 — Replace form components (4-8 weeks)

Form component migration is the most complex phase due to Drupal's Form API
validation and AJAX systems. Use the AJAX integration patterns in this theme's
`js/theme.behaviors.js` as reference.

### Phase 6 — Full SDC theme (ongoing)

Move all remaining template overrides into SDC components. At this point you have
a fully declarative, component-driven Drupal theme.

---

## Accessibility Compliance

This theme and all HELiX components are designed for WCAG 2.1 AA compliance,
which is the minimum standard for healthcare applications in the United States
(Section 508 requirement).

### Built-in accessibility features

- All interactive `hx-*` components are keyboard navigable (Tab, Enter, Space, Arrow keys)
- Focus management in `hx-dialog`, `hx-drawer`, and `hx-popover` (focus trap)
- ARIA roles, states, and properties on all interactive elements
- Screen reader announcements via `aria-live` for dynamic content
- Color contrast ratios meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
- Focus rings use `--hx-focus-ring-color` token with fallback to a 3:1 contrast ratio

### Theme-level obligations

The theme must not break the accessibility built into the components:

1. Do NOT suppress `outline` on `hx-*` elements
2. Do NOT use `pointer-events: none` on elements that need keyboard access
3. Do NOT add `aria-hidden="true"` to elements that contain interactive components
4. DO use semantic heading levels (`h1` on hero, `h2` on sidebar blocks, `h3` on cards)
5. DO provide meaningful `alt` text for all content images (empty string for decorative)
6. DO test with a screen reader (NVDA + Firefox, VoiceOver + Safari) before release

### Running an accessibility audit

```bash
# axe-core audit via Drush (requires drush/helixui-a11y-commands)
drush helixui:a11y:check --url=http://localhost

# Or use the Drupal accessibility scanner module
drush pm:enable editoria11y
```

---

## License

This theme is part of the HELiX enterprise web component library.
See the root `LICENSE` file for license information.

## Contributing

See `CONTRIBUTING.md` in the `@helixui/drupal-starter` package root.
