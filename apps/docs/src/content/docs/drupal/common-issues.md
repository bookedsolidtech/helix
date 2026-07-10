---
title: Common Issues
description: Quick-reference guide to the 10 most common HELiX + Drupal integration problems — CDN 404, missing type module, hx-size vs size, library attachment, AJAX re-initialization, once() double-init, CSP, Shadow DOM CSS, and more.
sidebar:
  order: 11
---

Quick-reference for the most frequently encountered HELiX + Drupal problems. Each entry includes the symptom, root cause, and the fix in a copy-paste format.

For detailed diagnostic walkthroughs, see [Troubleshooting](/drupal/troubleshooting/).

---

## Issue 1: CDN 404 — Component Script Not Found

**Symptom:** DevTools Network tab shows 404 for the component URL. Raw `<hx-button>` tags visible on page.

**Cause:** Incorrect CDN URL or outdated version number in the library YAML.

**Fix:**

```yaml
# mytheme.libraries.yml — use the correct versioned URL
helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
```

Full bundle alternative:

```text
https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js
```

Then `drush cr`.

---

## Issue 2: Missing `type: module` — Import Syntax Error

**Symptom:** Console error: `Uncaught SyntaxError: Cannot use import statement outside a module`

**Cause:** The `<script>` tag does not have `type="module"`. ES modules require it.

**Fix:**

```yaml
helix-button:
  js:
    dist/components/hx-button/index.js:
      preprocess: false
      attributes:
        type: module   # This is required — without it, the file is treated as a classic script
```

`drush cr` after editing.

---

## Issue 3: `hx-size` vs `size` Confusion

**Symptom:** Setting `size="lg"` on a HELiX component has no effect.

**Cause:** HELiX uses `hx-size` (not the native HTML `size`) to avoid conflicts with native form element attributes like `<input size="...">`.

**Fix:**

```twig
{# Wrong #}
<hx-button size="lg">Submit</hx-button>
<hx-avatar size="sm"></hx-avatar>

{# Correct #}
<hx-button hx-size="lg">Submit</hx-button>
<hx-avatar hx-size="sm"></hx-avatar>
```

---

## Issue 4: Library Not Attaching to Pages

**Symptom:** Components work on some pages but not others. Console shows `customElements.get('hx-card')` returns `undefined` on affected pages.

**Cause:** Library is attached via template or preprocess for one content type but not all pages that use the component.

**Fix — Global attachment for components used site-wide:**

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-button    # Used in navigation on every page
  - mytheme/helix-tokens    # CSS custom properties — always load
```

**Fix — Template-specific attachment:**

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix-card') }}
```

**Fix — Preprocess for route-based attachment:**

```php
function mytheme_preprocess_page(array &$variables): void {
  $route = \Drupal::routeMatch()->getRouteName();
  if (str_starts_with($route, 'entity.node.canonical')) {
    $variables['#attached']['library'][] = 'mytheme/helix-content';
  }
}
```

---

## Issue 5: AJAX Not Re-Initializing Components

**Symptom:** Drupal AJAX replaces a region. New `<hx-card>` elements in the replaced region do not upgrade or do not have their event listeners.

**Cause:** Drupal Behaviors are re-attached to the replaced region automatically, but your behavior may not be using `once()` with the `context` parameter correctly, or the component library was never loaded for AJAX responses.

**Fix — Use `once()` with context:**

```javascript
Drupal.behaviors.helixCard = {
  attach(context) {
    // context = the replaced DOM subtree on AJAX.
    // Scope to hx-href cards — hx-card only fires hx-click when
    // it is the interactive variant (i.e. has hx-href).
    once('hx-card-events', 'hx-card[hx-href]', context).forEach((card) => {
      card.addEventListener('hx-click', handleCardClick);
    });
  },
};
```

**Fix — Ensure library is attached to AJAX response:**

```php
$response = new AjaxResponse();
$response->addCommand(new HtmlCommand('#target', [
  '#markup' => '<hx-card>...</hx-card>',
  '#attached' => ['library' => ['mytheme/helix-card']],
]));
```

---

## Issue 6: `once()` Double-Initialization

**Symptom:** Event handlers fire twice. Behaviors run twice on the same element. Console logs appear doubled after AJAX.

**Cause:** `once()` is called without the `context` parameter, or the namespace key conflicts with another behavior.

**Fix — Always pass `context`:**

```javascript
Drupal.behaviors.helixCard = {
  attach(context) {
    // Provide a unique namespace key ('hx-card-events') + the context
    once('hx-card-events', 'hx-card', context).forEach((card) => {
      // Only runs once per element, per namespace
      card.addEventListener('hx-click', handler);
    });
  },
};
```

**Fix — Use unique namespace keys** across behaviors to avoid collisions.

---

## Issue 7: CSP Blocking ES Modules

**Symptom:** Console CSP violation: `Refused to load the script 'https://cdn.jsdelivr.net/...'`

**Cause:** Content Security Policy does not allow scripts from external CDN origins.

**Fix:**

```php
// settings.php
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
];
```

Or configure Security Kit at **Admin → Configuration → Security → Security Kit**.

**Alternative fix — Use local npm build instead of CDN** to avoid external origins entirely. See [npm Installation](/drupal/installation/npm/).

---

## Issue 8: Shadow DOM CSS Not Applying

**Symptom:** You added CSS targeting `hx-button .inner-element` and it has no effect. The component looks unstyled.

**Cause:** Shadow DOM encapsulation prevents external CSS selectors from reaching inside the component's shadow root.

**Fix — Use CSS custom properties that inherit through Shadow DOM boundaries:**

```css
/* Wrong — cannot pierce Shadow DOM */
hx-button button {
  background-color: red;
}

/* Correct — CSS custom properties inherit through Shadow DOM */
hx-button {
  --hx-button-bg: var(--hx-color-action-primary-bg);
  --hx-button-color: var(--hx-color-text-on-primary);
}
```

Check each component's documentation (or its CEM entry) for its exposed `--hx-*` CSS custom
properties — the component-level tokens (e.g. `--hx-button-bg`) fall back to the semantic action
tokens (e.g. `--hx-color-action-primary-bg`), which fall back to the primitive palette.

---

## Issue 9: Drupal Aggregation Breaking Components

**Symptom:** Components work with Drupal's JS aggregation disabled, fail when enabled.

**Cause:** Drupal concatenates JS files during aggregation. This breaks ES module `import` statements.

**Fix:**

```yaml
helix-button:
  js:
    dist/components/hx-button/index.js:
      preprocess: false  # Opt out of aggregation — required for ALL ES modules
      minified: true
      attributes:
        type: module
```

Set `preprocess: false` on every HELiX library entry. Then `drush cr`.

---

## Issue 10: Form Value Not Submitted

**Symptom:** `$form_state->getValue('field_name')` returns `null` or empty. The component's value is not in `$_POST`.

**Cause (most common):** Missing `name` attribute on the component. Without `name`, `ElementInternals.setFormValue()` has no key to submit under.

**Fix:**

```twig
{# Wrong — no name attribute #}
<hx-text-input label="Email Address"></hx-text-input>

{# Correct #}
<hx-text-input name="email" label="Email Address"></hx-text-input>
```

**Cause (less common):** Component is not inside a `<form>` element. `ElementInternals` form association requires the component to be a DOM descendant of the form.

**Verify association in console:**

```javascript
document.querySelector('hx-text-input[name="email"]')?.form;
// Returns <form> element if correctly associated, null if not
```

---

## Quick Diagnostic Commands

```bash
# Clear all Drupal caches
drush cr

# Verify library is discoverable
drush eval "print_r(\Drupal::service('library.discovery')->getLibrariesByExtension('mytheme'));"

# Check page for type=module script tags
curl -s https://your-site.com/some-page | grep 'type="module"'
```

```javascript
// Browser console — run on any page with a HELiX component
const checks = ['hx-button', 'hx-card', 'hx-text-input', 'hx-select'];
checks.forEach(tag => {
  const defined = customElements.get(tag) ? 'registered' : 'MISSING';
  const el = document.querySelector(tag);
  const upgraded = el?.shadowRoot ? 'upgraded' : (el ? 'NOT upgraded' : 'not on page');
  console.log(`${tag}: ${defined}, ${upgraded}`);
});
```

---

## Related

- [Troubleshooting](/drupal/troubleshooting/) — Full diagnostic walkthroughs per symptom
- [Installation: CDN](/drupal/installation/cdn/) — Correct library YAML setup
- [Behaviors](/drupal/behaviors/once-api/) — `once()` API reference
