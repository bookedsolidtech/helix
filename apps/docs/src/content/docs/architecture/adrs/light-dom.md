---
title: 'ADR: Light DOM Rendering'
description: When HELiX components should skip Shadow DOM — CMS content containers, Drupal Form API integration, and the AdoptedStylesheetsController pattern.
sidebar:
  order: 4
  label: Light DOM
  badge:
    text: ADR
    variant: tip
---

Shadow DOM is the default for encapsulated UI controls — buttons, inputs, cards. But when content editors control the markup, when Drupal's Form API owns the `<form>` tag, or when CKEditor outputs unpredictable HTML, the shadow boundary becomes a **barrier**, not a benefit. Light DOM components solve this.

## Status

Accepted. **Default to Shadow DOM. Use Light DOM only when a concrete integration requirement demands it.** All Light DOM components must use `AdoptedStylesheetsController` for scoped styling.

## Context

Not every component benefits from Shadow DOM encapsulation. The rendering strategy depends on who controls the content inside the component.

- **Shadow DOM** — Component owns all rendering. Styles are encapsulated. External CSS cannot leak in or out.
- **Light DOM** — The CMS or content editor owns the markup. The component provides styling and behaviour without creating a shadow boundary.

## Shadow DOM — Encapsulated UI controls

The component owns all rendering. Styles are encapsulated. External CSS cannot leak in or out. Ideal for **interactive controls** with predictable internal markup.

Components currently using Shadow DOM:

- `hx-button`
- `hx-text-input`
- `hx-card`
- `hx-badge`
- `hx-alert`
- `hx-select`
- `hx-checkbox`
- `hx-switch`

**Use Shadow DOM when:**

- Component controls all internal markup
- Style isolation is required
- Interactive behaviour is self-contained
- Slots project content without styling it

## Light DOM — CMS content containers

The CMS or content editor owns the markup. The component provides **styling and behaviour** without creating a shadow boundary. CSS must reach deeply nested children.

Components currently using Light DOM:

- `hx-prose` — wraps WYSIWYG content; uses `AdoptedStylesheetsController` + `createRenderRoot()` returning the host
- `hx-form` — runs in two modes (see "Case study: hx-form" below); the dual-mode pattern is the Light-DOM-relevant piece

`hx-container` is **not** a Light DOM component today — it ships with the default Shadow DOM render root. The SEO-content-container case is still a candidate use of Light DOM, but no shipped HELiX component currently implements it.

**Use Light DOM when:**

- CMS editors control the child markup
- Drupal Form API provides the `<form>`
- WYSIWYG output must be styled directly
- SEO requires content in the main DOM

## The AdoptedStylesheetsController pattern

The `AdoptedStylesheetsController` injects CSS into the document via the Adopted Stylesheets API, with automatic deduplication and cleanup.

**Flow:**

1. **CSS Imported** — scoped CSS string imported from a `.styles.ts` barrel file.
2. **Controller Init** — controller created with host, cssText, and target root.
3. **Deduplicated** — a global cache ensures one `CSSStyleSheet` per unique CSS string.
4. **Injected** — the sheet is added to `document.adoptedStyleSheets` and removed on disconnect.

### Controller usage

```ts
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { HelixElement } from '../../base/helix-element.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixProseScopedCss } from './hx-prose.styles.js';

@customElement('hx-prose')
export class HelixProse extends HelixElement {
  // Render in Light DOM — no shadow boundary
  override createRenderRoot(): this {
    return this;
  }

  // Inject scoped CSS via adoptedStyleSheets
  private _styles = new AdoptedStylesheetsController(
    this,
    helixProseScopedCss,
    document,
  );
}
```

### Render pattern

```ts
// The createRenderRoot() pattern
override createRenderRoot(): HTMLElement {
  return this; // ← returns the host, not a shadow root
}

// Children are rendered into the Light DOM
override render() {
  return html`<slot></slot>`;
}

// CSS is injected via adoptedStyleSheets, not :host{}
// Selectors use the tag name: hx-prose h2 { ... }
```

### Benefits

- **No duplication.** Global cache keyed by CSS text — 100 instances of `hx-prose` create only one `CSSStyleSheet`.
- **Scoped selectors.** All rules are tag-qualified: `hx-prose h2`, `hx-form label`. No risk of global style leaks.
- **Auto cleanup.** Stylesheet is removed from `adoptedStyleSheets` when the last instance disconnects.

## Case study: hx-prose and the WYSIWYG problem

CKEditor, the WYSIWYG at the heart of Drupal, outputs unpredictable HTML. Field wrappers, media embeds, tables, blockquotes — all generated at authoring time. Shadow DOM cannot style any of it.

Content editors paste from Word, embed media, create tables, and format text using CKEditor's toolbar. The resulting HTML is **structurally unpredictable**. You cannot slot it. You cannot wrap each element in a shadow-aware template. You must style it **as-is, wherever it appears**.

**Raw Drupal output:**

```html
<div class="field field--name-body">
  <div class="field__item">
    <h2>Content Hub Overview</h2>
    <p>Welcome to the new content...</p>
    <div class="media media--type-image">
      <img src="/files/hero.jpg" alt="..." />
    </div>
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody><tr><td>BP</td><td>120/80</td></tr></tbody>
    </table>
    <blockquote>
      <p>"Excellent care experience"</p>
    </blockquote>
  </div>
</div>
```

**Wrapped in hx-prose:**

```twig
{# In node--article.html.twig #}
<hx-prose hx-size="base" max-width="720px">
  {{ content.body }}
</hx-prose>

{# CKEditor output is now styled with:
   - Consistent typography
   - Responsive tables
   - Styled blockquotes
   - Media embed treatment
   - Code block highlighting #}
```

### Scoped selectors

The scoped CSS targets the editor's output by tag and class, qualified with the host tag:

```css
/* Scoped selectors — tag-qualified */
hx-prose h2 {
  font-size: var(--hx-font-size-xl);
  margin-top: var(--hx-space-8);
  color: var(--hx-color-text-strong);
}

hx-prose .media-embed {
  border-radius: var(--hx-border-radius-lg);
  overflow: hidden;
  margin: var(--hx-space-6) 0;
}

hx-prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--hx-font-size-sm);
}

hx-prose blockquote {
  border-left: 3px solid var(--hx-color-primary-700);
  padding-left: var(--hx-space-4);
  font-style: italic;
}
```

## Case study: hx-form and the Drupal Form API

Drupal's Form API generates the `<form>` tag, CSRF tokens, AJAX wrappers, and submission handlers. A Shadow DOM component cannot wrap this without breaking form participation. `hx-form` solves this with a dual-mode pattern.

### Standalone mode (with `action` attribute)

When `action` is set, `hx-form` renders a native `<form>` and lets the browser handle submission via that action URL. The `hx-submit` event is **not** dispatched in this mode — `hx-form` only dispatches `hx-submit` in the action-less Drupal-wrapped mode where it intercepts the submit for client-side validation.

```twig
{# Standalone mode — hx-form renders <form>, native submit to action URL #}
<hx-form action="/api/contact" method="post">
  <hx-text-input name="email" type="email" required>
    <span slot="label">Email</span>
  </hx-text-input>

  <hx-button type="submit">Send</hx-button>
</hx-form>
```

### Drupal-wrapped mode (no `action`)

When no `action` is set, `hx-form` renders only a `<slot>` and listens for the inner `<form>`'s submit event. Drupal provides the actual `<form>` tag, CSRF tokens, and submission handling; `hx-form` runs client-side validation, dispatches `hx-submit` with the collected `FormData` when validation passes, and (for reset) dispatches `hx-reset` — it is not a pure styling wrapper.

```twig
{# Drupal mode — Drupal provides <form>; hx-form validates + dispatches hx-submit #}
{{ attach_library('helixui/hx-form') }}

<hx-form>
  {# Drupal's Form API renders the actual <form> tag #}
  {{ content }}
</hx-form>
```

The Drupal library key shipped by `@helixui/drupal-starter`'s `helixui.libraries.yml` is `helixui/hx-form` (and `helixui/core` for the base tokens/runtime). Some sites mount the package under a different namespace — adjust the `helixui/` prefix to match the namespace your `helixui.libraries.yml` is attached under.

## ElementInternals: bridging Shadow and Light DOM forms

Shadow DOM form controls use `ElementInternals` to participate in native `<form>` elements — reporting values, validity, and labels to the parent form. This means a Shadow DOM input can live inside a Light DOM form and still submit, validate, and integrate with `FormData`.

**Flow:** `formAssociated = true` → `attachInternals()` → `setFormValue()` → `setValidity()`.

```ts
// HelixTextInput uses the FormMixin from packages/hx-library/src/mixins/,
// which centralises ElementInternals attachment, value/validity reporting,
// and validation-message wiring across every form-associated HELiX
// component. The illustrative pattern below shows what FormMixin does on
// the host's behalf — components do not typically open-code this.

class IllustrativeHelixTextInput extends HelixElement {
  static formAssociated = true;

  private _internals = this.attachInternals();

  override updated(changed: Map<string, unknown>) {
    if (changed.has('value')) {
      // Report value to the parent <form>
      this._internals.setFormValue(this.value);

      // Report validity state — FormMixin computes validity flags from
      // declared constraints (required, minlength, pattern, etc.) and
      // the active validationMessage convention.
      if (this.required && !this.value) {
        this._internals.setValidity(
          { valueMissing: true },
          this.requiredMessage || 'This field is required',
        );
      } else {
        this._internals.setValidity({});
      }
    }
  }
}
```

### Benefits

- **Native validation.** The Constraint Validation API works across Shadow DOM — `:invalid` pseudo-class, custom messages, and browser-native UI all behave as expected.
- **FormData integration.** `new FormData(form)` automatically includes values from Shadow DOM controls with `formAssociated = true`.
- **Drupal compatible.** Drupal behaviors run against the light-DOM ancestor tree, and most attach without modification when targeting `hx-*` form controls. The `@helixui/drupal-behaviors` package documents the patterns that need a small adapter (e.g. behaviors that previously read `event.target.value` on a native `<input>` need to read from the `hx-input` / `hx-change` event detail instead).

## Decision matrix

When should you choose Light DOM?

| Scenario | Shadow DOM | Light DOM |
| --- | --- | --- |
| CMS WYSIWYG content | ✗ Cannot style child content | ✓ Direct styling via scoped CSS |
| Drupal Form API | ✗ Breaks form participation | ✓ Native form wrapping |
| UI controls | ✓ Full encapsulation | ✗ Style leaks risk |
| SEO / reader modes | ⚠ Content in shadow root | ✓ Content in main DOM |
| Style isolation | ✓ Complete isolation | ⚠ Tag-scoped selectors |

## Decision

**Default to Shadow DOM. Use Light DOM only when content editors control the markup, Drupal Form API is required, SEO is critical, or global styles must reach children. Always use `AdoptedStylesheetsController` for Light DOM styling.**

### Principles

- **Shadow First.** Every new component starts with Shadow DOM. Only break the boundary when a concrete integration requirement demands it — never for convenience or familiarity with global CSS.
- **Light When Needed.** The two **shipped** cases today are CMS WYSIWYG (`hx-prose`) and dual-mode Drupal Form API integration (`hx-form` when its action-less Drupal mode is used; `hx-form` itself still uses the default Shadow DOM render root). SEO-critical content containers are a candidate Light-DOM use case but are not yet implemented in any shipped component.
- **Bridge the Gap.** `ElementInternals` lets Shadow DOM controls participate in Light DOM forms. The two strategies are complementary, not competing. Use both in the same form.

## Consequences

### Positive

- **Capability matched to integration.** Shadow DOM for controls, Light DOM for content. Each component picks the boundary that fits its job.
- **CSS deduplication.** `AdoptedStylesheetsController` ensures hundreds of `hx-prose` instances share one stylesheet.
- **Form participation works everywhere.** Drupal forms can mix native inputs and shadow-DOM `hx-text-input` without losing validation or submission.

### Negative

- **Two patterns to learn.** Component authors must understand both `static styles` and `AdoptedStylesheetsController`.
- **Scoped selectors are stricter than `:host`.** Light DOM CSS must always be tag-qualified; a stray global selector leaks immediately.

## Related ADRs

- [Slots vs Props](/architecture/adrs/slots-vs-props/) — `hx-prose` and `hx-form` are extreme slot-driven components.
- [Component Loading](/architecture/adrs/component-loading/) — light-DOM components ship through the same library system.
- [Attribute Naming](/architecture/adrs/attribute-naming/) — applies equally to Light DOM and Shadow DOM components.

## References

- [MDN: Constructable Stylesheets and adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet)
- [MDN: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [lit.dev: Rendering into the light DOM via createRenderRoot()](https://lit.dev/docs/components/shadow-dom/#renderroot)
- [WHATWG HTML: Form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
