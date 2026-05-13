---
title: 'ADR: Slots vs Props'
description: Composition strategy for HELiX components — when the component controls rendering versus when Drupal does.
sidebar:
  order: 1
  label: Slots vs Props
  badge:
    text: ADR
    variant: tip
---

Every web component in the system must answer one fundamental question: does the **component** control the rendering, or does **Drupal**? This architectural decision shapes every integration pattern, every Twig template, and every content editor's experience.

## Status

Accepted. The default for new components is **slot-first, property-enhanced**.

## Context

HELiX components are consumed primarily by Drupal Twig templates. Drupal already provides a powerful field system, media library, and WYSIWYG editor. Components must coexist with these tools rather than replace them.

Two extremes are possible:

- **Property-driven** — The component owns all rendering. Data is passed via attributes and properties. Drupal serializes field values into a flat prop list.
- **Slot-driven** — The component provides structure via named slots. Drupal renders content directly into those slots. "Let Drupal Drupal."

Each end of the spectrum has tradeoffs in Storybook usability, Drupal module compatibility, and editorial control.

## The spectrum

Every component sits somewhere on a spectrum between these two strategies:

| Strategy | Who controls content | Best for |
| --- | --- | --- |
| Property-driven | Component | Atoms with fixed API (Button, Badge, Switch) |
| Hybrid | Component + Drupal | Forms with validation behavior and slotted labels |
| Slot-driven | Drupal | Organisms with rich content (Card, Dialog, Data Table) |

## Decision

**Default to slots for content flexibility. Use properties for behavior, configuration, and state.**

This approach maximises Drupal's strengths while keeping components powerful and testable.

### See the difference in code

The same card component, built two ways:

**Property-driven (hypothetical)** — a card component that owned all rendering would expose every content field as a prop. `hx-card` does **not** ship this API — the snippet below is a deliberate anti-pattern for contrast:

```twig
{# ❌ Hypothetical property-driven card — these props don't exist on real hx-card #}
<hx-card
  title="{{ content.field_title }}"
  description="{{ content.field_body }}"
  image-src="{{ file_url(content.field_image) }}"
  image-alt="{{ content.field_image.alt }}"
  hx-href="{{ url }}"
  variant="featured"
></hx-card>
```

```ts
// In Storybook the hypothetical version would look like this — every value is a control:
export const HypotheticalPropertyDriven = {
  args: {
    title: 'Article Title',
    description: 'Summary text...',
    imageSrc: '/placeholder.jpg',
    variant: 'featured',
  },
};
```

**Slot-driven (actual `hx-card` API)** — Drupal projects content into named slots; the component owns the chrome:

```twig
{# Drupal controls all content; hx-card exposes variant + elevation + hx-href #}
<hx-card variant="featured" elevation="raised" hx-href="{{ url }}">
  <img slot="image"
    src="{{ file_url(content.field_image) }}"
    alt="{{ content.field_image.alt }}" />
  <h3 slot="heading">{{ content.field_title }}</h3>
  {{ content.field_body }}
  <a slot="actions" href="{{ url }}">Read More</a>
</hx-card>
```

```ts
// Slot-driven Storybook stories use a render function with Lit's html``
// tagged template — the repo's standard pattern. Slot content can't be
// driven by Controls directly, but the render function can interpolate args.
import { html } from 'lit';

export const Default = {
  args: { variant: 'featured', elevation: 'raised' },
  render: (args) => html`
    <hx-card variant=${args.variant} elevation=${args.elevation}>
      <img slot="image" src="/placeholder.jpg" alt="Placeholder" />
      <h3 slot="heading">Article Title</h3>
      <p>Summary text…</p>
      <a slot="actions" href="#">Read more</a>
    </hx-card>
  `,
};
```

## Drupal module compatibility

Not every Drupal module works equally well with every strategy. The matrix below is implementation guidance distilled from the HELiX Drupal integration packages (`@helixui/drupal-starter`, `@helixui/drupal-behaviors`) rather than a controlled test matrix — verify against your site's stack before treating any cell as a guarantee.

| Drupal module | Property-driven | Slot-driven | Hybrid |
| --- | --- | --- | --- |
| Layout Builder | Requires custom block plugins to map fields | Blocks drop content into slots naturally | Best of both — slots for layout, props for config |
| Paragraphs | Paragraph fields map directly to properties | Paragraph content renders into named slots | Ideal — structured data + flexible content |
| Media | Must extract URL/alt from media entity manually | Drupal renders media natively into slots | Slot for media, props for display config |
| Views | Views HTML output is hard to serialise to props | Views row output drops into slots perfectly | Slots for content, limited prop use |
| Webform | Props work for simple field config | Slots handle form rendering but lose validation | Props for validation/state, slots for layout |

## Strategy by component level

The component's complexity determines the right strategy. Simple atoms use properties. Complex organisms use slots. Forms use both.

### Atoms — Fixed API, constrained slots

Small, self-contained components with a fixed prop API. Some expose at most one or two narrow slots (`prefix`/`suffix` icons, default label content); rendering logic still lives in the component.

- `hx-button` (default + `prefix`/`suffix` slots)
- `hx-badge`
- `hx-switch`
- `hx-tooltip`
- `hx-spinner`
- `hx-avatar`

### Organisms — Slot-Driven (or Hybrid)

Complex, content-rich components. Drupal editors need full control over what appears inside.

- `hx-card` — slot-driven (`image`, `heading`, default, `footer`, `actions`)
- `hx-dialog` — slot-driven (header, default body, `footer`)
- `hx-accordion` / `hx-accordion-item` — slot-driven (`trigger`, default body)
- `hx-nav`, `hx-top-nav`, `hx-side-nav` — hybrid (props for orientation/labels, slots for nav items)
- `hx-data-table` — primarily property-driven (rows/columns are bound via props); slots cover toolbar, empty, and loading states

### Forms — Hybrid

Properties control validation, state, and behaviour. Many form controls expose slots for labels, help text, and error overrides — but exceptions exist (e.g. `hx-file-upload` and `hx-radio-group` use props for label/help text rather than slots).

- `hx-text-input`
- `hx-select`
- `hx-checkbox`
- `hx-radio-group`
- `hx-date-picker`
- `hx-file-upload`

## Consequences

### Positive

- **Let Drupal own content.** Content editors already know how to use Drupal's field system, media library, and WYSIWYG. Slots let them keep using these tools without learning component APIs.
- **Properties for behaviour.** Use properties for things content editors should not control: variant styles, validation rules, accessibility states, animation settings.
- **Content-first.** Enterprise organisations need robust content governance. Slot-driven components give editorial teams control. Each component's accessibility profile is documented in its CEM entry and `AAA-AUDIT.md` — the audited contract guarantees the component's chrome; consumer-supplied slotted markup still has to be semantic (headings in `heading` slots, accessible names on `image` slots, etc.) for the composition to meet WCAG.

### Negative

- **Storybook stories for slot-driven components require a `render()` function** that projects markup via Lit's `html` tagged template (the repo's standard story pattern). Storybook Controls can drive props passed into the render function, but cannot drive slotted DOM directly.
- **Mixed strategy components require discipline.** Form components must clearly document which inputs are properties (validation rules) versus slots (label content).

## Related ADRs

- [Attribute Naming](/architecture/adrs/attribute-naming/) — applies to every property in this ADR.
- [Light DOM](/architecture/adrs/light-dom/) — covers the narrow cases (Drupal Form API interop, scoped CSS via Lit controllers) where a slot-driven component drops the shadow boundary entirely; default remains Shadow DOM.

## References

- [MDN: Using slots in custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [lit.dev: Working with shadow DOM](https://lit.dev/docs/components/shadow-dom/)
- [Drupal: Render API](https://www.drupal.org/docs/drupal-apis/render-api)
