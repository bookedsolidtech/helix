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
| Property-driven | Component | Atoms with fixed API (Button, Badge, Toggle) |
| Hybrid | Component + Drupal | Forms with validation behavior and slotted labels |
| Slot-driven | Drupal | Organisms with rich content (Card, Hero, Modal) |

## Decision

**Default to slots for content flexibility. Use properties for behavior, configuration, and state.**

This approach maximises Drupal's strengths while keeping components powerful and testable.

### See the difference in code

The same card component, built two ways:

**Property-driven** — component controls all rendering:

```twig
{# Component controls ALL rendering #}
<hx-card
  title="{{ content.field_title }}"
  description="{{ content.field_body }}"
  image-src="{{ file_url(content.field_image) }}"
  image-alt="{{ content.field_image.alt }}"
  hx-href="{{ url }}"
  variant="elevated"
></hx-card>
```

```ts
// Perfect in Storybook — all props visible
export const Default = {
  args: {
    title: 'Article Title',
    description: 'Summary text...',
    imageSrc: '/placeholder.jpg',
    variant: 'elevated',
  },
};
```

**Slot-driven** — Drupal controls all content:

```twig
{# Drupal controls ALL content #}
<hx-card variant="elevated">
  <img slot="media"
    src="{{ file_url(content.field_image) }}"
    alt="{{ content.field_image.alt }}" />
  <h3 slot="heading">{{ content.field_title }}</h3>
  <div slot="body">{{ content.field_body }}</div>
  <a slot="actions" href="{{ url }}">Read More</a>
</hx-card>
```

```ts
// Slots need HTML strings in Storybook
export const Default = {
  args: { variant: 'elevated' },
  render: (args) => `
    <hx-card variant="${args.variant}">
      <img slot="media" ... />
      <h3 slot="heading">...</h3>
      <div slot="body">...</div>
    </hx-card>`,
};
```

## Drupal module compatibility

Not every Drupal module works equally well with every strategy. This matrix reflects observed behaviour with the modules HELiX teams use daily.

| Drupal module | Property-driven | Slot-driven | Hybrid |
| --- | --- | --- | --- |
| Layout Builder | Requires custom block plugins to map fields | Blocks drop content into slots naturally | Best of both — slots for layout, props for config |
| Paragraphs | Paragraph fields map directly to properties | Paragraph content renders into named slots | Ideal — structured data + flexible content |
| Media | Must extract URL/alt from media entity manually | Drupal renders media natively into slots | Slot for media, props for display config |
| Views | Views HTML output is hard to serialise to props | Views row output drops into slots perfectly | Slots for content, limited prop use |
| Webform | Props work for simple field config | Slots handle form rendering but lose validation | Props for validation/state, slots for layout |

## Strategy by component level

The component's complexity determines the right strategy. Simple atoms use properties. Complex organisms use slots. Forms use both.

### Atoms — Property-Driven

Small, self-contained components with a fixed API. All rendering logic lives in the component.

- `hx-button`
- `hx-badge`
- `hx-switch`
- `hx-tooltip`
- `hx-spinner`
- `hx-avatar`

### Organisms — Slot-Driven

Complex, content-rich components. Drupal editors need full control over what appears inside.

- `hx-card`
- `hx-hero`
- `hx-modal`
- `hx-navigation`
- `hx-data-table`
- `hx-accordion`

### Forms — Hybrid

Properties control validation, state, and behaviour. Slots allow custom labels, help text, and error messages.

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
- **Content-first.** Enterprise organisations need robust content governance. Slot-driven components give editorial teams control while maintaining WCAG accessibility standards.

### Negative

- **Storybook stories for slot-driven components require `render()` functions** that emit HTML strings. Controls cannot drive slot content directly.
- **Mixed strategy components require discipline.** Form components must clearly document which inputs are properties (validation rules) versus slots (label content).

## Related ADRs

- [Attribute Naming](/architecture/adrs/attribute-naming/) — applies to every property in this ADR.
- [Light DOM](/architecture/adrs/light-dom/) — explains when slot-driven components should drop the shadow boundary entirely.

## References

- [MDN: Using slots in custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [lit.dev: Working with shadow DOM](https://lit.dev/docs/components/shadow-dom/)
- [Drupal: Render API](https://www.drupal.org/docs/drupal-apis/render-api)
