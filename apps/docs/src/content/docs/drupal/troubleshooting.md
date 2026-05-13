---
title: Troubleshooting
description: Component lifecycle issues, Shadow DOM upgrade problems, event firing, form submission, Drupal-specific cache issues, library attachment problems, and AJAX behavior re-initialization.
sidebar:
  order: 10
---

This guide covers the most common HELiX integration problems in Drupal, organized by symptom. For a quick-reference checklist of the top 10 issues, see [Common Issues](/drupal/common-issues/).

---

## Diagnostic Starting Point

Before diving into specific symptoms, run this quick check in the browser console:

```javascript
// Is the component registered?
customElements.get('hx-button');
// → Returns the class constructor if loaded, undefined if not

// Does it have a Shadow DOM?
document.querySelector('hx-button')?.shadowRoot;
// → Returns a ShadowRoot object if upgraded, null if not

// Is it form-associated?
document.querySelector('hx-text-input')?.form;
// → Returns the parent <form> element if correctly form-associated
```

---

## Component Not Rendering

### Raw HTML tags visible on the page

The element is in the DOM but the Custom Element registry does not contain a definition for it. The browser displays the tag as an unknown element (inline box, no styles).

**Checklist:**

1. Open DevTools → Network → filter to JS. Does the component script load with HTTP 200?
2. Is `type="module"` set on the `<script>` tag? Inspect the page source or Elements panel.
3. Run `customElements.get('hx-button')` in the console. If `undefined`, the module never executed.

**Fix — Missing `type: module` in library YAML:**

```yaml
# mytheme.libraries.yml
helix-button:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes:
        type: module # Without this, the ES module fails to parse
```

> **Heads up:** the per-component CDN module above imports a shared chunk that pulls `lit` and `@helixui/icons` from bare specifiers, so the page also needs an [import map](#) (or a CDN that bundles dependencies) for the module to resolve. The simpler path is to load the aggregate `https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js` after an import map. See [Theming HELiX Components in Drupal](/drupal/theming/) and [XSS Prevention](/drupal/security-xss/) for the canonical import-map snippet.

**Fix — Library not attached:**

```yaml
# mytheme.info.yml — attach globally
libraries:
  - mytheme/helix-button
```

Or in a template:

```twig
{{ attach_library('mytheme/helix-button') }}
```

**Fix — Drupal cache serving stale library definitions:**

```bash
drush cr
```

### Component renders with fallback styling (theme tokens not applied)

The Shadow DOM upgraded successfully but design tokens are not defined, so the component falls back to its inline default values rather than the theme palette.

**Fix — Load `@helixui/tokens` CSS:**

```yaml
# mytheme.libraries.yml
helix-tokens:
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.0/dist/tokens.css:
        type: external
```

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-tokens
```

**Fix — Define the `--hx-` properties manually in your theme CSS:**

```css
/* styles.css */
:root {
  --hx-color-primary-500: #2563eb;
  --hx-color-neutral-900: #111827;
  /* ... */
}
```

---

## Shadow DOM Not Upgrading

### Element stays in its "pre-upgrade" state

Custom Elements upgrade automatically when the browser encounters a registered element in the DOM, or when the definition is registered for elements already in the DOM. If the element is present but `shadowRoot` is null, the definition has not run.

**Check for JS errors first** — a thrown error in a module prevents subsequent `customElements.define()` calls.

**Check for duplicate script loading:**

```javascript
document.querySelectorAll('script[src*="hx-button"]').length;
// Should be 1 — if 2 or more, remove duplicate library attachments
```

**Check for Drupal aggregation breaking the module:**

```yaml
# REQUIRED for ES modules — aggregation concatenates files, breaking imports
helix-button:
  js:
    dist/components/hx-button/index.js:
      preprocess: false
```

### Component defined but not upgraded after AJAX

The Custom Elements registry is global — once a definition is registered, all existing and future elements with that tag name are upgraded. If a component does not upgrade after AJAX, the definition was never registered.

```javascript
// After AJAX response, check:
customElements.get('hx-card');
// If undefined, the component library script was not loaded before or during AJAX
```

Ensure the library is attached to the AJAX response's render array, or loaded globally before any AJAX requests.

---

## Event Not Firing

### AJAX #ajax listener not triggering

Drupal's `#ajax` binds to DOM events. HELiX form controls emit custom events — `hx-change` and `hx-input` for value-bearing inputs, plus `hx-change` on selection components like `hx-select`, `hx-combobox`, `hx-radio-group`, and `hx-checkbox-group` — rather than the native `change` and `input` events. There is no `hx-select` event; the selection components dispatch `hx-change`.

```php
// Wrong: listens for 'change' — HELiX emits 'hx-change'
$form['search'] = [
  '#ajax' => [
    'event' => 'change',  // Will not fire for hx-text-input
  ],
];

// Correct: listens for HELiX custom event
$form['search'] = [
  '#ajax' => [
    'event' => 'hx-change',
  ],
];
```

### Drupal Behavior event listener not firing

If you attach a listener in a Drupal behavior and it does not fire, verify:

1. The behavior runs after the component is defined (use `customElements.whenDefined` if loading order is uncertain).
2. The event bubbles and is `composed: true` — HELiX events set both.
3. You are not adding the listener inside a Shadow DOM that intercepts the event.

```javascript
Drupal.behaviors.myBehavior = {
  attach(context) {
    once('mytheme:hx-search', 'hx-text-input[name="search"]', context).forEach((input) => {
      input.addEventListener('hx-change', (e) => {
        console.log('value:', e.detail.value);
      });
    });
  },
};
```

Use a project-scoped `once()` key (e.g. `mytheme:…`) so project-local behaviors don't collide with the namespace used by `@helixui/drupal-behaviors` (which owns the bare `hx-*` keys).

---

## Form Not Submitting

### Value missing from $\_POST

The component does not have a `name` attribute. Without `name`, `ElementInternals.setFormValue()` has no key to submit under.

```twig
{# Wrong: no name #}
<hx-text-input label="Email"></hx-text-input>

{# Correct #}
<hx-text-input name="email" label="Email"></hx-text-input>
```

### Component not inside a <form>

`ElementInternals` requires the component to be a descendant of a `<form>` element. If the component is rendered outside the form (e.g., in a Drupal block separate from the form region), form association fails.

```javascript
document.querySelector('hx-text-input')?.form; // Returns null if not inside <form>
```

### Using hx-size instead of size

HELiX form components use `hx-size` for the size attribute to avoid collisions with native HTML `size`. If you set `size` instead, it has no effect:

```twig
{# Wrong — native HTML attribute, no effect on HELiX components #}
<hx-text-input size="lg"></hx-text-input>

{# Correct #}
<hx-text-input hx-size="lg"></hx-text-input>
```

---

## Drupal-Specific Issues

### Library not attaching — `#attached` ignored

`#attached` on a render array that is returned from an AJAX callback but not rendered via the standard render pipeline may be ignored. Use `AjaxResponse` with proper `HtmlCommand` or ensure the render array passes through `\Drupal::service('renderer')->render()`.

```php
// Correct: attach library in the render array before rendering
$build = [
  '#markup' => '<hx-card>...</hx-card>',
  '#attached' => ['library' => ['mytheme/helix-card']],
];

$response = new AjaxResponse();
$response->addCommand(new HtmlCommand('#target', $build));
return $response;
```

### Cache returning component-less HTML

Old cached pages may not include the component library if the library was added after the cache was primed.

```bash
# Full cache rebuild
drush cr

# If using Varnish or a reverse proxy, also purge the edge cache
drush purge:queue-browse
```

After deploying a library change, increment the `version` key in your libraries YAML so Drupal generates a new cache-busting URL:

```yaml
helix-card:
  version: 1.1.2 # Was 1.1.1 — increment on every component update
```

### Drupal aggregation breaking ES modules

Drupal's JS aggregation concatenates files — this breaks `import` statements inside ES modules.

```yaml
# Required on every HELiX library entry
helix-button:
  js:
    dist/components/hx-button/index.js:
      preprocess: false # Disables aggregation for this file
      minified: true
      attributes:
        type: module
```

### AJAX not re-initializing components

After Drupal AJAX replaces DOM content, components in the replaced region need their Drupal Behaviors to re-run. This happens automatically when behaviors use `once()` correctly.

```javascript
// Wrong — listeners are never cleaned up when DOM is replaced
Drupal.behaviors.myBehavior = {
  attach(context) {
    document.querySelectorAll('hx-card').forEach((card) => {
      card.addEventListener('hx-click', handler);
    });
  },
};

// Correct — once() tracks initialization, runs only for new elements.
// hx-card only dispatches hx-click when it has hx-href (interactive card mode),
// so scope the selector to interactive cards.
Drupal.behaviors.myBehavior = {
  attach(context) {
    once('mytheme:card-behavior', 'hx-card[hx-href]', context).forEach((card) => {
      card.addEventListener('hx-click', handler);
    });
  },
};
```

The `context` parameter is the DOM subtree that was just modified by AJAX. `once()` with `context` ensures only new elements in that subtree receive the behavior. The `mytheme:` prefix on the once key keeps project-local behaviors out of the `@helixui/drupal-behaviors` namespace.

---

## CSP Blocking Components

If the browser console shows a Content Security Policy violation, external CDN scripts are blocked:

```
Refused to load the script 'https://cdn.jsdelivr.net/...'
because it violates the following Content Security Policy directive
```

**Fix — Add jsDelivr to your CSP script-src:**

```php
// settings.php
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
];
```

Or in the Security Kit module UI: **Admin → Configuration → Security → Security Kit**.

---

## Debugging Checklist

When a component issue occurs, work through this list in order:

1. **Check the console** for JavaScript errors — a thrown exception blocks all subsequent module execution.
2. **Check the network tab** — did the component script load (200 OK)? Is `type="module"` on the `<script>` tag?
3. **Run `customElements.get('hx-button')`** — if `undefined`, the module did not execute.
4. **Inspect the Shadow DOM** — `document.querySelector('hx-button').shadowRoot` — present means upgraded, null means not.
5. **Check for duplicate library attachments** — `document.querySelectorAll('script[src*="hx-button"]').length` should be 1.
6. **Verify `preprocess: false`** in your libraries YAML for all ES module entries.
7. **Clear Drupal cache** with `drush cr` after any library or template change.
8. **Check CSP headers** if the site loads from CDN.

---

## Related

- [Common Issues](/drupal/common-issues/) — Quick-reference top 10 issues
- [AJAX Integration](/drupal/ajax/) — Behavior re-initialization and `once()` patterns
- [Performance: Overview](/drupal/performance/overview/) — Library attachment and caching
