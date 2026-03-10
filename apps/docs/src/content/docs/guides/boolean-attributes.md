---
title: 'Boolean Attributes'
description: 'How HTML boolean attribute semantics work in HELIX web components, and how to correctly control boolean properties that default to true.'
sidebar:
  order: 1
---

# Boolean Attributes

HTML boolean attributes follow a simple rule: **the presence of the attribute means `true`; the absence means `false`.**
The _value_ of the attribute is irrelevant.

```html
<!-- All three of these set `disabled` to true -->
<hx-button disabled></hx-button>
<hx-button disabled=""></hx-button>
<hx-button disabled="false"></hx-button>  <!-- ⚠️ STILL DISABLED -->

<!-- Only this sets `disabled` to false -->
<hx-button></hx-button>
```

This is how the HTML specification defines boolean attributes (see [HTML Living Standard §2.3.2](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)), and HELIX components follow it exactly.

---

## The Common Gotcha

The confusion arises when a boolean property **defaults to `true`**. A consumer may try to opt out by writing:

```html
<!-- Intent: hide the icon. Actual result: icon still shows -->
<hx-alert show-icon="false">Your message</hx-alert>
```

Because `show-icon` is a boolean attribute, its _presence_ flips the property to `true` — regardless of the `"false"` string value. The attribute is present, so `showIcon` is `true`.

---

## Components with Boolean Properties Defaulting to `true`

The following HELIX components have one or more boolean properties whose default value is `true`. These are the components where the gotcha is most likely to trip up consumers.

| Component | Property | Attribute | Default | Effect when absent |
|---|---|---|---|---|
| [`hx-alert`](/component-library/hx-alert) | `open` | `open` | `true` | Alert is hidden |
| [`hx-alert`](/component-library/hx-alert) | `showIcon` | `show-icon` | `true` | Icon is hidden |
| [`hx-code-snippet`](/component-library/hx-code-snippet) | `copyable` | `copyable` | `true` | Copy button is hidden |
| [`hx-dialog`](/component-library/hx-dialog) | `modal` | `modal` | `true` | Dialog is non-modal |
| [`hx-skeleton`](/component-library/hx-skeleton) | `animated` | `animated` | `true` | Pulse animation disabled |

---

## Correct Usage Patterns

### Pattern 1: Omit the attribute (pure HTML)

To disable a boolean feature that defaults to `true`, **do not include the attribute at all**:

```html
<!-- showIcon defaults to true — icon is visible -->
<hx-alert variant="info">Alert with icon.</hx-alert>

<!-- Attribute absent — showIcon is false, icon is hidden -->
<hx-alert variant="info" show-icon="...">
  <!--
    Wait — this still shows the icon! Attribute presence = true.
    Remove the attribute entirely:
  -->
</hx-alert>

<!-- Correct: no show-icon attribute means showIcon = false -->
<!-- But wait — showIcon defaults to true, so absence = false.
     Omitting the attribute gives you the DEFAULT (true).
     To get false, you need JavaScript (see Pattern 2). -->
```

Because `showIcon` defaults to `true`, omitting the attribute means the component uses its default — `true`. To set it to `false` in markup alone is not possible (see [HTML Living Standard §2.3.2](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)). Use JavaScript or a template framework for that.

### Pattern 2: JavaScript property assignment

Set the property directly on the element reference after it is connected:

```javascript
const alert = document.querySelector('hx-alert');
alert.showIcon = false;  // ✅ Sets the property, not the attribute

const snippet = document.querySelector('hx-code-snippet');
snippet.copyable = false;  // ✅ Copy button hidden

const dialog = document.querySelector('hx-dialog');
dialog.modal = false;  // ✅ Non-modal dialog

const skeleton = document.querySelector('hx-skeleton');
skeleton.animated = false;  // ✅ Pulse animation disabled
```

### Pattern 3: Lit binding syntax (`?attr`)

In Lit templates, use the `?` boolean binding prefix. This adds or removes the attribute based on the expression value:

```typescript
html`
  <!-- Adds show-icon attribute when showIcon is true, removes it when false -->
  <hx-alert ?show-icon=${this.showIcon}>Message</hx-alert>

  <!-- Removes copyable attribute — copy button hidden -->
  <hx-code-snippet ?copyable=${false}>const x = 1;</hx-code-snippet>
`
```

When the expression evaluates to `false`, Lit calls `removeAttribute()` — the attribute is absent, and the component property resolves to its own default or `false`.

### Pattern 4: Drupal Twig templates

In Twig, conditionally render boolean attributes using the conditional block syntax:

```twig
{# WRONG: always sets show-icon = true regardless of value #}
<hx-alert show-icon="{{ show_icon }}">{{ message }}</hx-alert>

{# CORRECT: only emit the attribute when true #}
<hx-alert
  variant="{{ variant|default('info') }}"
  {% if show_icon %}show-icon{% endif %}
>{{ message }}</hx-alert>
```

For properties that default to `true` and must be disabled, use a Drupal behavior to set the property via JavaScript after the element is defined:

```javascript
// my_module/js/my-module.behaviors.js
Drupal.behaviors.myModuleAlertIcon = {
  attach(context) {
    once('hx-alert-icon', 'hx-alert[data-hide-icon]', context).forEach((el) => {
      customElements.whenDefined('hx-alert').then(() => {
        el.showIcon = false;
      });
    });
  },
};
```

```twig
<hx-alert
  variant="{{ variant }}"
  {% if not show_icon %}data-hide-icon{% endif %}
>{{ message }}</hx-alert>
```

---

## Why This Design Exists

Some features are "on by default" because hiding or disabling them is the exception. For example:

- `hx-alert` shows an icon by default because icons reinforce semantic meaning (error = red X, success = green check). Most consumers want icons; only edge-case dense UIs hide them.
- `hx-code-snippet` shows a copy button by default because copy-to-clipboard is the primary value of a code block component.
- `hx-dialog` is modal by default because non-modal dialogs are rare and accessibility-risky.

The trade-off is that disabling a default-true feature requires JavaScript (or a framework binding) rather than a plain HTML attribute. This is a known HTML limitation — the spec has no mechanism for a boolean attribute to convey `false`.

---

## Quick Reference

| Goal | Method |
|---|---|
| Enable a default-false boolean | Add the attribute: `<hx-button disabled>` |
| Disable a default-true boolean (JS) | `el.showIcon = false` |
| Disable a default-true boolean (Lit) | `?show-icon=${false}` |
| Disable a default-true boolean (Twig) | Drupal behavior + JS property |
| **Do not use** | `attr="false"` — this enables the feature |

---

## Further Reading

- [Properties vs Attributes](/components/fundamentals/properties-vs-attributes) — Deep dive into the property/attribute duality in Lit components
- [Template Syntax](/components/fundamentals/template-syntax) — Lit binding syntax reference including `?boolean` bindings
- [Drupal Behaviors](/drupal-integration/behaviors/fundamentals) — JavaScript lifecycle for Drupal-hosted components
