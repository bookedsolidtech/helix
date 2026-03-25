# HELiX Drupal Integration — Light DOM Style Injection

This directory contains Drupal-specific helpers for integrating HELiX web components
with Twig templates and Drupal behaviors.

## Problem: Shadow DOM Style Isolation

HELiX components use Shadow DOM for style encapsulation. When Drupal renders content
into a component's slot via Twig templates, that content lives in the **light DOM** —
it cannot inherit styles defined inside the Shadow DOM.

This causes styling breakdowns when rich text, CKEditor output, or structured
field content is slotted into components like `hx-card`.

## Solution: `hx-style-scope` + Light DOM Style Injection

The `hx-style-scope` web component wraps slotted content and triggers injection
of scoped `<style>` elements into `document.head`. These styles use scoped CSS
selectors (`[data-hx-styled="component-name"] child`) so they only apply to
content wrapped by an `hx-style-scope` element with the matching `component` attribute.

### Architecture

```
document.head
  └─ <style data-hx-light-styles="hx-card">
       [data-hx-styled="hx-card"] p { ... }
       [data-hx-styled="hx-card"] h2 { ... }
     </style>   ← injected once, deduplicated

<hx-card>
  <hx-style-scope component="hx-card" data-hx-styled="hx-card">
    {{ drupal_content }}   ← receives styles via [data-hx-styled] selector
  </hx-style-scope>
</hx-card>
```

## Usage in Twig Templates

### Using the Macro

```twig
{% import '@helix/hx-style-scope.macro.twig' as hx %}

<hx-card>
  {{ hx.scope('hx-card', content.body) }}
</hx-card>
```

### Inline Usage

```twig
<hx-card>
  <hx-style-scope
    component="hx-card"
    data-hx-styled="hx-card"
  >
    {{ content.body }}
  </hx-style-scope>
</hx-card>
```

### With Custom CSS

When you need to inject custom scoped CSS alongside the component's defaults:

```twig
<hx-style-scope
  component="hx-card"
  light-css="p { margin-bottom: var(--hx-space-4); }"
  data-hx-styled="hx-card"
>
  {{ content.body }}
</hx-style-scope>
```

## Style Deduplication

Regardless of how many `hx-style-scope` elements appear on a page for the same
component, the `<style>` element is only injected into `document.head` **once**.
The `lightStyleRegistry` (a `Map<string, HTMLStyleElement>`) prevents duplicate
injection across the page lifecycle.

## CSS Selector Scoping

Selectors are automatically scoped by `generateScopedSelectors`. For example:

```css
/* Input */
p { font-size: var(--hx-font-size-md); }
h2 { font-weight: var(--hx-font-weight-bold); }

/* Output (injected into document.head) */
[data-hx-styled="hx-card"] p { font-size: var(--hx-font-size-md); }
[data-hx-styled="hx-card"] h2 { font-weight: var(--hx-font-weight-bold); }
```

This prevents style leakage to unrelated content on the page.

## Drupal Behaviors

For JavaScript-driven initialization in Drupal contexts, attach a behavior to
reinitialize `hx-style-scope` elements after AJAX updates:

```javascript
(function (Drupal) {
  Drupal.behaviors.helixStyleScope = {
    attach(context) {
      context.querySelectorAll('hx-style-scope').forEach((el) => {
        // Re-trigger scope application for dynamically loaded content
        el.dispatchEvent(new CustomEvent('hx-reinit', { bubbles: true }));
      });
    },
  };
})(Drupal);
```
