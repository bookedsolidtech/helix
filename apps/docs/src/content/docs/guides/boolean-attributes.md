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

The following HELIX boolean properties default to `true` (per `packages/hx-library/custom-elements.json`). These are the cases where you cannot set `false` from plain HTML alone:

| Component | Property | Attribute | Default | Effect when absent |
|---|---|---|---|---|
| `hx-banner` | `open` | `open` | `true` | Banner is hidden when explicitly removed via JS / Lit binding |
| `hx-dialog` | `closeOnBackdrop` | `close-on-backdrop` | `true` | Dialog will not close on backdrop click |
| `hx-patient-banner` | `enforceIdentifierRule` | `enforce-identifier-rule` | `true` | Patient-identifier validation is skipped |
| `hx-skeleton` | `animated` | `animated` | `true` | Pulse animation disabled |
| `hx-table` | `fullWidth` | `full-width` | `true` | Table renders at intrinsic width instead of stretching |

For comparison, properties that look like they should be default-true but **are not** (they default to `false`, so adding the attribute enables the feature):

| Component | Property | Default |
|---|---|---|
| `hx-alert` | `open`, `showIcon`, `dismissible`, `accent` | `false` — alert is hidden / icon hidden / dismissible off / no accent by default |
| `hx-code-snippet` | `copyable`, `inline`, `wrap`, `lineNumbers` | `false` — copy button hidden unless opted in |
| `hx-dialog` | `modal` | `false` — non-modal by default; use `modal` attribute or `showModal()` for modal behavior |

---

## Correct Usage Patterns

### Pattern 1: Omit the attribute (pure HTML, for default-false props)

For properties that default to `false`, omitting the attribute leaves them off — adding it (even as `attr="false"`) enables the feature.

```html
<!-- show-icon defaults to false — icon is hidden -->
<hx-alert variant="info" open>Alert without icon.</hx-alert>

<!-- show-icon attribute present → showIcon = true (icon visible) -->
<hx-alert variant="info" open show-icon>Alert with icon.</hx-alert>

<!-- WRONG: attribute string "false" still flips the property to true -->
<hx-alert variant="info" open show-icon="false">Still shows the icon</hx-alert>
```

For properties that default to `true` (the table above), the inverse rule applies — markup alone cannot turn the property off. There is no HTML syntax that conveys `false` for a boolean attribute (see [HTML Living Standard §2.3.2 — Boolean attributes](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)). Use JavaScript or a template framework binding (Patterns 2–3 below).

### Pattern 2: JavaScript property assignment

Set the property directly on the element reference after it is connected:

```javascript
// Disabling default-true properties from JS:
const dialog = document.querySelector('hx-dialog');
dialog.closeOnBackdrop = false;  // ✅ Dialog ignores backdrop clicks

const skeleton = document.querySelector('hx-skeleton');
skeleton.animated = false;       // ✅ Pulse animation disabled

const table = document.querySelector('hx-table');
table.fullWidth = false;         // ✅ Table renders at intrinsic width

// Enabling default-false properties also works from JS, but in plain HTML
// you'd just add the attribute. JS is mostly useful for dynamic toggles:
const alert = document.querySelector('hx-alert');
alert.showIcon = true;           // Equivalent to adding the show-icon attribute
```

### Pattern 3: Lit binding syntax (`?attr`)

In Lit templates, use the `?` boolean binding prefix. This adds or removes the attribute based on the expression value:

```typescript
html`
  <!-- Adds show-icon attribute when showIcon is true (false → attribute absent) -->
  <hx-alert ?show-icon=${this.showIcon} ?open=${this.alertOpen}>Message</hx-alert>

  <!-- For a default-true prop, ?attr=${false} is the canonical way to disable
       it from a template: -->
  <hx-skeleton ?animated=${false}></hx-skeleton>
  <hx-dialog ?close-on-backdrop=${false}>…</hx-dialog>
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

For default-true properties that need to be disabled in a Drupal context, use a Drupal behavior to set the property via JavaScript after the element is defined. The example below disables the dialog's backdrop close behavior on dialogs marked with a data attribute from Twig:

```javascript
// my_module/js/my-module.behaviors.js
Drupal.behaviors.myModuleStrictDialog = {
  attach(context) {
    once('hx-dialog-strict', 'hx-dialog[data-strict]', context).forEach((el) => {
      customElements.whenDefined('hx-dialog').then(() => {
        el.closeOnBackdrop = false;
      });
    });
  },
};
```

```twig
<hx-dialog
  heading="{{ heading }}"
  {% if strict_mode %}data-strict{% endif %}
>{{ message }}</hx-dialog>
```

---

## Why This Design Exists

Some features are "on by default" because turning them off is the exception. For example:

- `hx-skeleton.animated` defaults to `true` because the pulse motion is the visible "this is loading" signal — disabling it is the prefers-reduced-motion / hidden-skeleton case.
- `hx-dialog.closeOnBackdrop` defaults to `true` because a backdrop click escape hatch is the standard dialog UX — `false` is the destructive-confirmation special case.
- `hx-table.fullWidth` defaults to `true` because content-width tables are the rare exception in dashboards.

The trade-off is that disabling a default-true feature requires JavaScript (or a framework binding) rather than a plain HTML attribute. This is a known HTML limitation — the spec has no mechanism for a boolean attribute to convey `false` (see [HTML Living Standard §2.3.2](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)). Defaulting features that are commonly disabled (icons, copy buttons, modal mode) to `false` lets consumers opt in cleanly from plain HTML.

---

## Quick Reference

| Goal | Method |
|---|---|
| Enable a default-false boolean | Add the attribute: `<hx-button disabled>` |
| Disable a default-true boolean (JS) | `el.closeOnBackdrop = false` |
| Disable a default-true boolean (Lit) | `?close-on-backdrop=${false}` |
| Disable a default-true boolean (Twig) | Drupal behavior + JS property |
| **Do not use** | `attr="false"` — this enables the feature |

---

## Further Reading

- [Lit: Properties](https://lit.dev/docs/components/properties/) — Deep dive into the property/attribute duality in Lit components
- [Lit: Templates Overview](https://lit.dev/docs/templates/overview/) — Lit binding syntax reference including `?boolean` bindings
- [Drupal Behaviors](/drupal/behaviors/fundamentals/) — JavaScript lifecycle for Drupal-hosted components
