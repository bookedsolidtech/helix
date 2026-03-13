---
title: Troubleshooting Common Issues
description: Complete guide to diagnosing and resolving HELIX Drupal integration issues
sidebar:
  order: 67
---

Drupal integration with HELIX web components is straightforward when working correctly, but several categories of issues can arise during development, deployment, and production operation. This comprehensive troubleshooting guide covers the most common problems, their root causes, diagnostic techniques, and proven solutions.

## Troubleshooting Overview

HELIX components integrate with Drupal through four primary mechanisms:

1. **Library System** - Drupal's asset management loads ES modules
2. **TWIG Templates** - Standard HTML elements project content into Shadow DOM
3. **Drupal Behaviors** - JavaScript lifecycle hooks for dynamic content
4. **Browser APIs** - Custom Elements, Shadow DOM, and module loading

Issues typically surface in one of these integration layers. Effective troubleshooting requires understanding which layer is failing and why.

### Quick Diagnostic Workflow

When a component issue occurs:

1. **Verify library attachment** - Is the library loaded on the page?
2. **Check browser console** - Are there JavaScript errors?
3. **Inspect network requests** - Did component files download successfully?
4. **Examine DOM structure** - Is the Shadow DOM present?
5. **Test in isolation** - Does the component work outside Drupal?

This guide organizes solutions by symptom category, making it easy to identify your specific issue and jump to the relevant fix.

---

## Category 1: Component Not Rendering

### Symptom 1.1: Raw HTML Tags Visible

**What you see:** `<hx-button variant="primary">Click Me</hx-button>` appears as plain text without styling or interactivity.

**Root causes:**

1. Library not attached to page
2. JavaScript file failed to load (404 error)
3. Script type not set to `module`
4. Drupal cache serving stale library definitions

**Diagnostic steps:**

**Step 1: Check if library is attached**

Open browser DevTools (F12) → Console:

```javascript
// Should return constructor function
customElements.get('hx-button');

// Returns undefined = component not registered
// Returns function = component loaded successfully
```

**Step 2: Inspect Network tab**

DevTools → Network → Filter: JS

Look for your component file (e.g., `hx-button.js` or `helix.bundled.js`):

- **200 OK** - File loaded successfully (move to Step 3)
- **404 Not Found** - File path incorrect (see Solution A)
- **No request** - Library not attached (see Solution B)

**Step 3: Verify script type**

DevTools → Elements → Search for your script tag:

```html
<!-- Correct (type="module") -->
<script type="module" src="/path/to/helix.bundled.js"></script>

<!-- Wrong (missing type="module") -->
<script src="/path/to/helix.bundled.js"></script>
```

**Solutions:**

**Solution A: Fix library path**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    # WRONG PATH
    # dist/hx-button.js: { attributes: { type: module } }

    # CORRECT PATH (relative to theme root)
    dist/js/hx-button.js: { attributes: { type: module } }
```

After fixing, clear Drupal cache:

```bash
drush cr
```

**Solution B: Attach library to page**

**Option 1: Global attachment (mytheme.info.yml)**

```yaml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11

libraries:
  - mytheme/helix-components # Loaded on every page
```

**Option 2: Template attachment (node--article.html.twig)**

```twig
{{ attach_library('mytheme/helix-components') }}

<article{{ attributes }}>
  <hx-card variant="featured">
    <span slot="heading">{{ node.label }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

**Option 3: Preprocess attachment (mytheme.theme)**

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  // Attach library conditionally
  $route_name = \Drupal::routeMatch()->getRouteName();

  if (str_starts_with($route_name, 'entity.node')) {
    $variables['#attached']['library'][] = 'mytheme/helix-components';
  }
}
```

**Solution C: Fix module type attribute**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    dist/js/helix.bundled.js:
      preprocess: false
      attributes:
        type: module # CRITICAL: Required for ES modules
```

**Why it matters:** Lit components use ES module syntax (`import`, `export`). Without `type="module"`, browsers throw syntax errors.

---

### Symptom 1.2: Components Flash, Then Disappear (FOUC)

**What you see:** Components briefly render correctly, then revert to unstyled HTML.

**Root causes:**

1. Multiple library versions loading (conflict)
2. Custom Elements registered twice with different definitions
3. Drupal aggregation corrupting module code

**Diagnostic steps:**

DevTools → Console:

```javascript
// Check how many times component is registered
customElements.get('hx-button');
// Should return same constructor each time

// Check for duplicate script tags
document.querySelectorAll('script[src*="helix"]');
// Should return 1-2 results (not 5+)
```

**Solutions:**

**Solution A: Remove duplicate libraries**

Search for duplicate library definitions:

```bash
# In your theme directory
grep -r "helix.bundled.js" *.libraries.yml
grep -r "hx-button" *.libraries.yml
```

Remove duplicates. Keep only one library definition per component.

**Solution B: Disable aggregation for ES modules**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    dist/js/helix.bundled.js:
      preprocess: false # REQUIRED: Disables aggregation
      minified: true # Mark as pre-minified
      attributes:
        type: module
```

**Why it matters:** Drupal's aggregation system doesn't support ES modules. It concatenates files, which breaks `import` statements.

---

### Symptom 1.3: Components Work Locally, Fail in Production

**What you see:** Components render in local development but not on production/staging servers.

**Root causes:**

1. CDN blocked by firewall/CSP
2. Drupal caches not cleared after deployment
3. File permissions incorrect (web server can't read files)
4. HTTP/HTTPS mixed content blocking

**Diagnostic steps:**

**Check 1: Console errors**

Look for CSP violations:

```
Refused to load the script 'https://cdn.jsdelivr.net/...'
because it violates the following Content Security Policy directive
```

**Check 2: Network tab**

Look for:

- **Blocked** status (CSP issue)
- **403 Forbidden** (file permissions)
- **Mixed content warning** (HTTPS page loading HTTP script)

**Solutions:**

**Solution A: Update CSP headers**

**File:** `settings.php` (Drupal 9/10/11)

```php
// Allow CDN domains in CSP
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
];
```

**Alternative:** Use Security Kit module UI (admin/config/system/seckit)

**Solution B: Clear all production caches**

```bash
# Drupal cache
drush cr

# Varnish/CDN cache (if applicable)
drush purge:queue-browse
drush purge:purge everything

# Manually clear browser cache
# Chrome DevTools → Network → Disable cache (checkbox)
```

**Solution C: Fix file permissions**

```bash
# In your theme directory
chmod 644 dist/js/*.js
chmod 755 dist/js

# Verify web server can read
sudo -u www-data cat dist/js/helix.bundled.js
# Should output file contents
```

**Solution D: Force HTTPS for CDN**

```yaml
# mytheme.libraries.yml
helix-components:
  js:
    # WRONG (HTTP)
    # http://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js

    # CORRECT (HTTPS)
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

---

## Category 2: Styles Not Applied

### Symptom 2.1: Component Structure Correct, No Styles

**What you see:** Shadow DOM is present, HTML structure is correct, but component appears unstyled (default browser styles only).

**Root causes:**

1. CSS custom properties (design tokens) not defined
2. Shadow DOM encapsulation blocking global styles
3. `adoptedStyleSheets` not supported (old browser)

**Diagnostic steps:**

DevTools → Elements → Select component → Styles panel:

```css
/* Check for CSS custom properties */
:host {
  --hx-color-primary: var(--undefined-token); /* RED FLAG */
}
```

DevTools → Console:

```javascript
// Check if styles are attached to Shadow DOM
const button = document.querySelector('hx-button');
console.log(button.shadowRoot.adoptedStyleSheets);
// Should return array of CSSStyleSheet objects
```

**Solutions:**

**Solution A: Define design tokens globally**

**File:** `styles.css` (theme global CSS)

```css
:root {
  /* Brand colors */
  --hx-color-primary: #0066cc;
  --hx-color-secondary: #6c757d;
  --hx-color-success: #28a745;
  --hx-color-danger: #dc3545;
  --hx-color-warning: #ffc107;
  --hx-color-info: #17a2b8;

  /* Neutral palette */
  --hx-color-neutral-50: #f8f9fa;
  --hx-color-neutral-100: #e9ecef;
  --hx-color-neutral-200: #dee2e6;
  --hx-color-neutral-700: #495057;
  --hx-color-neutral-900: #212529;

  /* Spacing scale */
  --hx-spacing-xs: 0.25rem;
  --hx-spacing-sm: 0.5rem;
  --hx-spacing-md: 1rem;
  --hx-spacing-lg: 1.5rem;
  --hx-spacing-xl: 2rem;

  /* Typography */
  --hx-font-family-base: system-ui, -apple-system, sans-serif;
  --hx-font-size-sm: 0.875rem;
  --hx-font-size-base: 1rem;
  --hx-font-size-lg: 1.25rem;
}
```

**Why it matters:** CSS custom properties inherit through Shadow DOM. Components reference `--hx-*` tokens defined on `:root`.

**Solution B: Add theme-specific overrides**

```css
/* Theme-specific token overrides */
:root {
  /* Override default blue with brand color */
  --hx-color-primary: #8b0000; /* Healthcare brand red */

  /* Increase spacing for accessibility */
  --hx-spacing-md: 1.25rem;
}
```

---

### Symptom 2.2: Custom Theme Styles Not Affecting Components

**What you see:** You've added CSS rules targeting `hx-button`, but nothing changes.

**Root cause:** Shadow DOM encapsulation. External CSS cannot penetrate Shadow DOM.

**Solution: Use CSS custom properties (design tokens)**

**WRONG approach:**

```css
/* This will NOT work - can't pierce Shadow DOM */
hx-button {
  background-color: red; /* Ignored */
  padding: 20px; /* Ignored */
}
```

**CORRECT approach:**

```css
/* Override component-level CSS custom properties */
hx-button {
  --hx-button-padding-x: 2rem;
  --hx-button-padding-y: 1rem;
  --hx-button-bg-primary: #8b0000;
  --hx-button-text-primary: #ffffff;
}

/* Or globally */
:root {
  --hx-button-padding-x: 2rem;
}
```

**Check component documentation** for available CSS custom properties:

- [hx-button CSS Variables](/components/hx-button/#css-custom-properties)
- [hx-card CSS Variables](/components/hx-card/#css-custom-properties)

---

### Symptom 2.3: CSS Parts Not Styling as Expected

**What you see:** You're using `::part()` but styles don't apply.

**Root causes:**

1. Part name misspelled
2. Part doesn't exist on component
3. Browser doesn't support `::part()` (unlikely in 2026)

**Diagnostic steps:**

DevTools → Elements → Inspect Shadow DOM:

```html
<hx-button>
  #shadow-root
  <button part="button" class="button button--primary">
    <slot></slot>
  </button>
</hx-button>
```

**Solutions:**

**Solution A: Verify part name**

Check component documentation for exported parts:

```css
/* WRONG */
hx-button::part(btn) {
  /* Wrong name */
  background: red;
}

/* CORRECT */
hx-button::part(button) {
  /* Matches part="button" */
  background: red;
}
```

**Solution B: Check if part exists**

DevTools → Console:

```javascript
const button = document.querySelector('hx-button');
const shadowButton = button.shadowRoot.querySelector('[part="button"]');
console.log(shadowButton); // Should return element, not null
```

If `null`, the part doesn't exist or has a different name.

---

## Category 3: JavaScript Errors

### Symptom 3.1: "Cannot use import statement outside a module"

**Error message:**

```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**Root cause:** Script tag missing `type="module"` attribute.

**Solution:**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  js:
    dist/js/helix.bundled.js:
      attributes:
        type: module # ADD THIS
```

Clear cache:

```bash
drush cr
```

---

### Symptom 3.2: "Failed to execute 'define' on 'CustomElementRegistry'"

**Error message:**

```
DOMException: Failed to execute 'define' on 'CustomElementRegistry':
the name "hx-button" has already been used with this registry
```

**Root causes:**

1. Component script loaded twice
2. Multiple library versions conflict
3. Hot module reloading in development

**Diagnostic steps:**

DevTools → Console:

```javascript
// Count script tags
document.querySelectorAll('script[src*="hx-button"]').length;
// Should be 1, not 2+
```

**Solutions:**

**Solution A: Remove duplicate library attachments**

Check your TWIG templates for multiple `attach_library()` calls:

```twig
{# WRONG - attaching same library twice #}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-components') }} {# Also includes hx-button #}
```

**Solution B: Use library dependencies**

**File:** `mytheme.libraries.yml`

```yaml
# Define button as separate library
helix-button:
  js:
    dist/js/hx-button.js: { attributes: { type: module } }

# Card library depends on button
helix-card:
  js:
    dist/js/hx-card.js: { attributes: { type: module } }
  dependencies:
    - mytheme/helix-button # Drupal ensures loaded only once
```

---

### Symptom 3.3: "Illegal constructor" or "Illegal invocation"

**Error message:**

```
TypeError: Illegal constructor
```

**Root causes:**

1. Trying to `new HxButton()` directly (not allowed)
2. Component not registered before use
3. Browser doesn't support Custom Elements (ancient browser)

**Solutions:**

**Solution A: Use `document.createElement()` or HTML**

```javascript
// WRONG
const button = new HxButton(); // Illegal constructor

// CORRECT
const button = document.createElement('hx-button');
button.variant = 'primary';
document.body.appendChild(button);
```

**Solution B: Wait for component definition**

```javascript
// Wait for component to be defined
await customElements.whenDefined('hx-button');

// Now safe to create
const button = document.createElement('hx-button');
```

---

## Category 4: AJAX and Dynamic Content Issues

### Symptom 4.1: Components Don't Initialize After AJAX

**What you see:** Drupal AJAX loads new content containing `<hx-card>`, but components don't hydrate.

**Root cause:** Drupal Behaviors not configured or library not re-attached.

**Solutions:**

**Solution A: Use Drupal Behaviors (Recommended)**

**File:** `js/helix-behaviors.js`

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixComponents = {
    attach(context) {
      // `context` contains AJAX-loaded content
      // `once()` ensures initialization runs only once per element

      once('helix-card-init', 'hx-card', context).forEach((card) => {
        // Custom Elements upgrade automatically when added to DOM
        // Additional setup if needed
        console.log('Card initialized:', card);
      });
    },
  };
})(Drupal, once);
```

**File:** `mytheme.libraries.yml`

```yaml
helix-behaviors:
  js:
    js/helix-behaviors.js: {}
  dependencies:
    - core/drupal
    - core/once
    - mytheme/helix-components
```

**Attach behavior library:**

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-components
  - mytheme/helix-behaviors
```

**Why it works:** `Drupal.behaviors.attach()` runs on:

1. Page load
2. AJAX responses
3. BigPipe placeholder replacements

**Solution B: Re-attach library in AJAX command**

If you control the AJAX callback:

```php
// In custom controller or form submit handler
public function ajaxCallback(array &$form, FormStateInterface $form_state) {
  $response = new AjaxResponse();

  // Add content
  $response->addCommand(new HtmlCommand('#target', '<hx-card>...</hx-card>'));

  // Re-attach library
  $response->addCommand(new InvokeCommand(NULL, 'attachBehaviors'));

  return $response;
}
```

---

### Symptom 4.2: Components Lose State After AJAX Refresh

**What you see:** User expands an `<hx-accordion>`, then AJAX refreshes the region, accordion resets to collapsed.

**Root cause:** AJAX replaces DOM, destroying component state.

**Solutions:**

**Solution A: Exclude component from AJAX replacement**

Use more specific AJAX selectors to avoid replacing the component:

```php
// WRONG - replaces entire region (loses state)
$response->addCommand(new ReplaceCommand('#sidebar', $new_content));

// CORRECT - replace only specific child
$response->addCommand(new ReplaceCommand('#sidebar .data-table', $new_table));
```

**Solution B: Store state in localStorage**

**File:** `js/helix-state-persistence.js`

```javascript
Drupal.behaviors.helixStatePersistence = {
  attach(context) {
    // Save accordion state
    once('helix-accordion-persist', 'hx-accordion', context).forEach((accordion) => {
      accordion.addEventListener('hx-toggle', (e) => {
        const id = accordion.id;
        const state = { expanded: e.detail.expanded };
        localStorage.setItem(`hx-accordion-${id}`, JSON.stringify(state));
      });

      // Restore state on load
      const id = accordion.id;
      const savedState = localStorage.getItem(`hx-accordion-${id}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        accordion.expanded = state.expanded;
      }
    });
  },
};
```

**Solution C: Use AJAX append instead of replace**

```php
// Append new content instead of replacing
$response->addCommand(new AppendCommand('#list', $new_item));
```

---

### Symptom 4.3: BigPipe Placeholders Break Components

**What you see:** Components in BigPipe-loaded regions don't render or throw errors.

**Root cause:** Library not loaded when BigPipe streams content.

**Solution: Attach library to BigPipe placeholder**

```php
// In your block plugin or lazy builder
public function build() {
  return [
    '#markup' => '<hx-card>Lazy loaded content</hx-card>',
    '#attached' => [
      'library' => [
        'mytheme/helix-components', // Ensure library loads with placeholder
      ],
    ],
  ];
}
```

---

## Category 5: Aggregation and Caching Issues

### Symptom 5.1: Components Work in Dev, Break with Aggregation Enabled

**What you see:** Components work with aggregation disabled (`/admin/config/development/performance` → unchecked), break when enabled.

**Root cause:** Drupal aggregation doesn't support ES modules.

**Solution: Disable preprocessing for component libraries**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  js:
    dist/js/helix.bundled.js:
      preprocess: false # CRITICAL for ES modules
      minified: true
      attributes:
        type: module
```

**Why it matters:** Drupal concatenates JS files during aggregation, which breaks ES module syntax.

---

### Symptom 5.2: Component Updates Not Visible After Deployment

**What you see:** You updated to HELIX 0.0.2, deployed, cleared caches, but old component behavior persists.

**Root causes:**

1. Browser cache (client-side)
2. Drupal library version unchanged (cache key unchanged)
3. CDN cache (if using CDN)
4. Varnish/reverse proxy cache

**Solutions:**

**Solution A: Increment Drupal library version**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.2 # INCREMENT THIS (was 0.0.1)
  js:
    dist/js/helix.bundled.js:
      preprocess: false
      attributes:
        type: module
```

**Why it works:** Drupal appends `?v=0.0.2` to script URL, bypassing browser cache.

**Solution B: Hard refresh clients**

Instruct users to hard refresh:

- **Chrome/Edge:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- **Firefox:** Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
- **Safari:** Cmd+Option+R

**Solution C: Purge CDN cache**

If using CDN, purge after deployment:

```bash
# jsDelivr (auto-purges on npm publish)
# Manual: https://www.jsdelivr.com/tools/purge

# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -d '{"files":["https://example.com/dist/js/helix.bundled.js"]}'
```

**Solution D: Clear Varnish cache**

```bash
# Purge all
drush purge:queue-browse
drush purge:purge everything

# Or specific URL
varnishadm "ban req.url ~ /dist/js/helix"
```

---

### Symptom 5.3: TWIG Debug Comments Break Components

**What you see:** Components break when TWIG debugging is enabled (`services.yml` → `twig.config.debug: true`).

**Root cause:** TWIG debug comments injected into component slots break parsing.

**Example of the problem:**

```html
<hx-card variant="featured">
  <!-- THEME DEBUG -->
  <!-- BEGIN OUTPUT from 'field--body.html.twig' -->
  <p>Body content</p>
  <!-- END OUTPUT from 'field--body.html.twig' -->
</hx-card>
```

**Solution: Disable TWIG debugging in production**

**File:** `sites/default/services.yml` or `settings.php`

```yaml
# services.yml
parameters:
  twig.config:
    debug: false # DISABLE in staging/production
```

```php
// settings.php alternative
$config['system.logging']['error_level'] = 'hide';
```

**Development workaround:** TWIG comments usually don't break components. If they do, it's a component bug (report it).

---

## Category 6: Library Loading Issues

### Symptom 6.1: "CustomElements is not defined"

**Error message:**

```
ReferenceError: customElements is not defined
```

**Root causes:**

1. Ancient browser (pre-2018)
2. Polyfill required but not loaded
3. Script running in Node.js context (SSR issue)

**Solutions:**

**Solution A: Check browser support**

HELIX requires:

- **Chrome/Edge:** 67+ (2018)
- **Firefox:** 63+ (2018)
- **Safari:** 12.1+ (2019)

Check actual browser: DevTools → Console:

```javascript
console.log(navigator.userAgent);
```

**Solution B: Add polyfills (if supporting older browsers)**

```yaml
# mytheme.libraries.yml
webcomponents-polyfills:
  js:
    https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-bundle.js:
      type: external
      preprocess: false

helix-components:
  js:
    dist/js/helix.bundled.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/webcomponents-polyfills
```

---

### Symptom 6.2: Components Load in Wrong Order

**What you see:** `<hx-form>` tries to use `<hx-text-input>` before it's defined.

**Root cause:** Library dependencies not declared.

**Solution: Define explicit dependencies**

**File:** `mytheme.libraries.yml`

```yaml
helix-text-input:
  version: 0.0.1
  js:
    dist/js/hx-text-input.js:
      preprocess: false
      attributes:
        type: module

helix-form:
  version: 0.0.1
  js:
    dist/js/hx-form.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-text-input # Ensures text-input loads first
```

---

### Symptom 6.3: CDN Loading Fails Intermittently

**What you see:** Components work sometimes, fail other times with CDN timeout/404.

**Root causes:**

1. CDN outage (rare but possible)
2. Corporate firewall blocking CDN
3. Slow network

**Solutions:**

**Solution A: Implement local fallback**

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  js:
    # Primary: CDN
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      preprocess: false
      attributes:
        type: module
    # Fallback: local check
    js/helix-fallback.js:
      preprocess: false
      attributes:
        type: module
```

**File:** `js/helix-fallback.js`

```javascript
/**
 * HELIX CDN Fallback
 * Loads local copy if CDN fails.
 */
setTimeout(() => {
  if (!customElements.get('hx-button')) {
    console.warn('[HELIX] CDN failed, loading local fallback');

    // Dynamic import of local backup
    import('/themes/custom/mytheme/libraries/helix/dist/helix.bundled.js')
      .then(() => console.info('[HELIX] Local fallback loaded'))
      .catch((err) => console.error('[HELIX] Fallback failed:', err));
  }
}, 2000); // Wait 2 seconds for CDN
```

**Keep local backup:**

```
mytheme/
├── libraries/
│   └── helix/
│       └── dist/
│           └── helix.bundled.js  # Downloaded from npm or CDN
└── js/
    └── helix-fallback.js
```

**Solution B: Switch to npm installation**

More reliable for production: [npm Installation Guide](/drupal-integration/installation/npm/)

---

## Category 7: Performance Problems

### Symptom 7.1: Page Load Slow Due to Components

**What you see:** Lighthouse shows long JavaScript execution time, components are the culprit.

**Diagnostic steps:**

DevTools → Performance → Record page load

Look for:

- Long Task warnings (>50ms)
- Large JavaScript bundles (>100KB)

**Solutions:**

**Solution A: Use per-component libraries (tree-shaking)**

**File:** `mytheme.libraries.yml`

```yaml
# Instead of one large bundle
# helix-all: (80KB - loads everything)

# Split into component libraries
helix-button:
  js:
    dist/js/hx-button.js: { preprocess: false, attributes: { type: module } }

helix-card:
  js:
    dist/js/hx-card.js: { preprocess: false, attributes: { type: module } }

helix-text-input:
  js:
    dist/js/hx-text-input.js: { preprocess: false, attributes: { type: module } }
```

**Attach only what you need:**

```twig
{# Article template - only needs card #}
{{ attach_library('mytheme/helix-card') }}
```

**Solution B: Lazy load heavy components**

```javascript
// Load data table only when needed
document.querySelector('#load-table-btn').addEventListener('click', async () => {
  // Dynamic import
  await import('/themes/custom/mytheme/dist/js/hx-data-table.js');

  // Now create table
  const table = document.createElement('hx-data-table');
  document.body.appendChild(table);
});
```

**Solution C: Preconnect to CDN**

**File:** `templates/html.html.twig`

```twig
<head>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">

  {{ page_top }}
  <!-- rest of head -->
</head>
```

---

### Symptom 7.2: Flash of Unstyled Content (FOUC)

**What you see:** Components briefly appear as raw HTML before styling applies.

**Root cause:** Components upgrade asynchronously after page render.

**Solutions:**

**Solution A: Hide undefined components**

**File:** `styles.css`

```css
/* Hide components until defined */
hx-button:not(:defined),
hx-card:not(:defined),
hx-text-input:not(:defined) {
  display: none;
}

/* Fade in when defined */
hx-button:defined,
hx-card:defined,
hx-text-input:defined {
  animation: fade-in 0.2s ease-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Solution B: Skeleton loading states**

```css
/* Show skeleton while loading */
hx-card:not(:defined) {
  display: block;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

---

## Category 8: Form Submission Issues

### Symptom 8.1: Form Data Not Submitting

**What you see:** Drupal form contains `<hx-text-input>` but value doesn't submit.

**Root cause:** Form element not implementing `ElementInternals` or missing `name` attribute.

**Solutions:**

**Solution A: Verify `name` attribute**

```twig
{# WRONG - no name #}
<hx-text-input label="Patient Name"></hx-text-input>

{# CORRECT - has name #}
<hx-text-input
  name="patient_name"
  label="Patient Name"
></hx-text-input>
```

**Solution B: Check form association**

DevTools → Console:

```javascript
const input = document.querySelector('hx-text-input[name="patient_name"]');

// Should return parent form element
console.log(input.form);

// Should return entered value
console.log(input.value);
```

If `input.form` is `null`, component is not form-associated (bug - report it).

---

### Symptom 8.2: Drupal Validation Not Working with Components

**What you see:** Drupal server-side validation errors don't display next to component form fields.

**Root cause:** Drupal's Form API error rendering expects standard inputs.

**Solution: Use Drupal form element wrappers**

```twig
{# Wrap component in Drupal form item structure #}
<div class="form-item form-type-textfield">
  <label for="edit-patient-name">Patient Name</label>

  <hx-text-input
    id="edit-patient-name"
    name="patient_name"
    value="{{ form.patient_name['#value'] }}"
    {% if form.patient_name['#errors'] %}
      aria-invalid="true"
      aria-describedby="edit-patient-name-error"
    {% endif %}
  ></hx-text-input>

  {% if form.patient_name['#errors'] %}
    <div id="edit-patient-name-error" class="form-item--error-message">
      {{ form.patient_name['#errors'] }}
    </div>
  {% endif %}
</div>
```

---

## Category 9: Browser Compatibility

### Symptom 9.1: Components Don't Work in Safari

**What you see:** Components work in Chrome but not Safari.

**Root causes:**

1. Safari versions < 12.1 (pre-2019) don't support Custom Elements v1
2. Module preload not supported (Safari 15+)
3. Declarative Shadow DOM not supported (Safari 16.4+)

**Solutions:**

**Solution A: Check minimum Safari version**

HELIX requires **Safari 12.1+** (March 2019).

Check user's version: DevTools → Console:

```javascript
console.log(navigator.userAgent);
// Look for "Version/12.1" or higher
```

**Solution B: Remove module preload (unsupported in old Safari)**

```twig
{# Remove this if supporting Safari < 15 #}
<link rel="modulepreload" href="...">
```

**Solution C: Feature detect and show fallback**

```javascript
if ('customElements' in window && 'attachShadow' in Element.prototype) {
  // Browser supports Web Components
  import('/themes/custom/mytheme/dist/js/helix.bundled.js');
} else {
  // Show fallback message
  document.body.innerHTML = '<p>Please upgrade your browser.</p>';
}
```

---

### Symptom 9.2: Components Flicker in Firefox

**What you see:** Components briefly show unstyled, then styled, then unstyled again (Firefox only).

**Root cause:** Firefox bug with Shadow DOM and CSS animations.

**Solution: Use `will-change` CSS property**

```css
/* Add to component wrapper or global styles */
hx-button,
hx-card,
hx-text-input {
  will-change: contents;
}
```

---

## Complete Troubleshooting Checklist

Use this checklist when components don't work as expected:

### 1. Library Loading

- [ ] Library attached to page (`{{ attach_library() }}` or `.info.yml`)
- [ ] Drupal cache cleared (`drush cr`)
- [ ] Browser cache cleared (hard refresh)
- [ ] Network request succeeded (200 OK, not 404)
- [ ] Script has `type="module"` attribute
- [ ] File path correct (relative to theme/module root)

### 2. JavaScript Execution

- [ ] No console errors
- [ ] `customElements.get('hx-button')` returns constructor
- [ ] Shadow DOM present in DevTools → Elements
- [ ] No duplicate script loads

### 3. Styling

- [ ] CSS custom properties defined (`:root { --hx-* }`)
- [ ] Shadow DOM has styles (check `adoptedStyleSheets`)
- [ ] Using `::part()` for external styling (not direct CSS selectors)

### 4. TWIG Integration

- [ ] Component has `name` attribute (form elements)
- [ ] Slots use immediate children (no wrapper divs)
- [ ] Boolean attributes use `{% if %}` (not `="{{ value }}"`)

### 5. Production Environment

- [ ] Aggregation disabled for ES modules (`preprocess: false`)
- [ ] CSP headers allow CDN (if using CDN)
- [ ] HTTPS for all resources (no mixed content)
- [ ] File permissions correct (web server can read)

### 6. Dynamic Content

- [ ] Drupal Behaviors implemented for AJAX
- [ ] `once()` utility used to prevent double-init
- [ ] Library re-attached after AJAX

### 7. Performance

- [ ] Per-component libraries (not full bundle on every page)
- [ ] FOUC mitigation (`:not(:defined)` styles)
- [ ] Preconnect to CDN (if using CDN)

---

## Debugging Workflow

When you encounter an issue, follow this systematic debugging process:

### Step 1: Isolate the Problem

**Test component outside Drupal:**

Create `test.html` in your theme:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Component Test</title>
  </head>
  <body>
    <hx-button variant="primary">Test Button</hx-button>

    <script type="module">
      import 'https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js';
    </script>
  </body>
</html>
```

- **Works in test.html but not Drupal?** → Drupal configuration issue
- **Doesn't work in either?** → Component or browser issue

### Step 2: Check Browser Console

DevTools → Console

Look for:

- **Red errors** - JavaScript exceptions (component failed to load)
- **Yellow warnings** - Non-critical issues (deprecated APIs)
- **CSP violations** - Security policy blocking resources

### Step 3: Inspect Network Traffic

DevTools → Network → Filter: JS

Check:

- **Status codes** - 200 = success, 404 = not found, 403 = forbidden
- **Size** - Should be 15-80KB (component bundle), not 0KB or 2KB (404 page)
- **Timing** - Slow load? Check CDN or server performance

### Step 4: Examine DOM Structure

DevTools → Elements

Look for:

- `#shadow-root` - Present = component hydrated successfully
- Slot content - Projected correctly or missing?
- Part names - Match what you're targeting with `::part()`?

### Step 5: Test Component API

DevTools → Console

```javascript
// Get component reference
const button = document.querySelector('hx-button');

// Check if defined
console.log(customElements.get('hx-button'));

// Inspect properties
console.log(button.variant); // Should match attribute
console.log(button.disabled);

// Test methods
button.focus(); // Should focus button

// Check Shadow DOM
console.log(button.shadowRoot);
console.log(button.shadowRoot.querySelector('[part="button"]'));
```

### Step 6: Compare Working vs Broken Environments

If component works in one environment but not another:

| Check           | Working Env | Broken Env                      |
| --------------- | ----------- | ------------------------------- |
| Browser version | Chrome 120  | Safari 12.0 (too old!)          |
| Drupal version  | 10.2        | 10.2                            |
| Aggregation     | Disabled    | **Enabled** (breaks ES modules) |
| CSP headers     | Permissive  | **Strict** (blocks CDN)         |
| Library version | 0.0.1       | **0.0.0** (wrong version)       |

Differences reveal root cause.

---

## Getting Help

If you've worked through this guide and still have issues:

### 1. Check Documentation

- [HELIX Drupal Overview](/drupal-integration/overview/)
- [Installation Guide](/drupal-integration/installation/)
- [TWIG Patterns](/drupal-integration/twig/)
- [Component API Reference](/components/)

### 2. Search Existing Issues

[GitHub Issues](https://github.com/bookedsolidtech/helix/issues) - Search for your error message or symptom.

### 3. File a Bug Report

Include:

- **Drupal version** (e.g., 10.2.3)
- **HELIX version** (e.g., 0.0.1)
- **Browser** (e.g., Chrome 120, Safari 16)
- **Error messages** (full console output)
- **Minimal reproduction** (TWIG template + library definition)
- **Expected behavior** vs **actual behavior**

### 4. Community Support

- **Drupal Slack** - #webcomponents channel
- **Stack Overflow** - Tag `drupal` + `web-components` + `helix`

---

## Prevention Best Practices

Avoid common issues by following these patterns:

### During Development

1. **Always use `type: module`** for component libraries
2. **Set `preprocess: false`** for all ES modules
3. **Clear cache after every `.libraries.yml` change** (`drush cr`)
4. **Test with aggregation enabled** before deploying
5. **Use TWIG debug** locally, disable in production

### For Deployment

1. **Increment library version** on every component update
2. **Pin exact CDN versions** (no `@latest` in production)
3. **Test in staging** with production-like settings (aggregation, caching, CDN)
4. **Monitor browser console** for errors post-deploy
5. **Keep local fallback** for CDN reliability

### For Maintenance

1. **Update components regularly** (security patches)
2. **Run accessibility audits** (WCAG 2.1 AA compliance)
3. **Monitor bundle sizes** (keep <50KB total)
4. **Test browser compatibility** (Chrome, Firefox, Safari, Edge)
5. **Document custom integrations** (future developer thank-you)

---

## Summary

HELIX web components integrate cleanly with Drupal when configuration is correct. Most issues fall into these categories:

1. **Library not loaded** → Attach via `.info.yml`, TWIG, or preprocess
2. **Wrong script type** → Always use `type: module` attribute
3. **Aggregation enabled** → Set `preprocess: false` for ES modules
4. **Cache not cleared** → Run `drush cr` after config changes
5. **AJAX incompatibility** → Use Drupal Behaviors pattern
6. **Styling issues** → Define CSS custom properties (design tokens)
7. **Performance problems** → Use per-component libraries (tree-shaking)

**Quick diagnostic command:**

```bash
# Run from theme directory
drush cr && \
  echo "Cache cleared" && \
  grep -r "type: module" *.libraries.yml && \
  echo "✓ Module type configured" || echo "✗ Missing type: module"
```

**Next steps:**

- Review [TWIG Integration Patterns](/drupal-integration/twig/fundamentals/)
- Implement [Drupal Behaviors](/drupal-integration/behaviors/)
- Optimize [Library Loading Strategy](/drupal-integration/library-system/)

---

**Have a troubleshooting tip not covered here?** [Contribute to this guide](https://github.com/bookedsolidtech/helix/edit/main/apps/docs/src/content/docs/drupal-integration/troubleshooting/common-issues.md)
