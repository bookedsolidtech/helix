---
title: 'ADR: Attribute Naming'
description: HTML safety convention for HELiX components — the hx- prefix prevents silent attribute collisions across Drupal, frameworks, and browser parsers.
sidebar:
  order: 3
  label: Attribute Naming
  badge:
    text: ADR
    variant: tip
---

When a custom element uses an attribute name that matches a standard HTML attribute, CMS preprocessors, framework compilers, and browser parsers may intercept, rewrite, or strip it **before** the web component ever receives it. The result is **silent failures** that are nearly impossible to debug in production.

## Status

Accepted with a narrow scope. **Component-specific attributes that would collide with established HTML/Drupal-render/framework-compiler attribute namespaces use the `hx-` prefix.** Attributes that intentionally mirror standard HTMLElement behaviour (form participation, link semantics, label association) are intentionally left unprefixed even when they share a name with a native attribute — the value still has to behave like the native attribute does. The current public API uses both patterns: `hx-href` on card-style activation surfaces, `href` on link-like surfaces, `action`/`method` on form-associated elements, `for` on labels.

## Context

HTML attribute names are not a free namespace. Five layers of the web stack process HTML before a custom element's `attributeChangedCallback` fires:

1. **HTML parser** — may normalise or strip non-spec attributes on known element types.
2. **CMS preprocessors** — Drupal's render system, WordPress shortcodes, and CKEditor filters mutate attributes that they recognise.
3. **Framework compilers** — React, Vue, and Angular template compilers treat some attribute names as bindings rather than literals.
4. **Browser HTML parsers** — bake certain attributes into the IDL (e.g. `href` on anchors becomes a resolved URL).
5. **Accessibility tree** — ARIA-related attribute names are interpreted by assistive technology.

If a custom element uses a name claimed by any of these layers, the value can vanish before reaching the component. No error is thrown. No warning appears. The attribute simply disappears.

## The problem

When a custom element uses an attribute name that matches a standard HTML attribute — like `href`, `src`, `action`, `target`, `method`, `role`, `for`, or `data` — CMS preprocessors, framework compilers, and browser HTML parsers may intercept, rewrite, or strip these attributes before the web component receives them.

This causes **silent failures** that are extremely difficult to debug. The component renders, but the data never arrives. No error is thrown. No warning appears in the console. The attribute simply vanishes.

## The rule

For each component-specific attribute, pick by intent:

- If the attribute carries link, form-control, or label semantics that browsers and frameworks already know how to handle (`href` on a link, `action`/`method` on a form, `for` on a label, `target`/`rel`/`download` on a link), keep the native name so native semantics flow through (focus, keyboard activation, form submission, AT exposure).
- If the attribute is a HELiX-specific behaviour grafted onto a non-native surface (`hx-href` on `hx-card` to make a card a navigation target, `hx-label` for a non-`aria-label` accessible name, `hx-size` to avoid the native numeric `size` semantics), use the `hx-` prefix so CMS preprocessors and template compilers leave it alone.

The prefix is a deliberate namespace signal: it tells every layer of the stack — browsers, CMS engines, bundlers, frameworks — "this attribute is mine, do not touch." Native names retain native machinery; prefixed names ride through that machinery untouched.

## Wrong vs correct

**Dangerous — attribute collision:**

```twig
{# DANGER: href collides with HTML spec #}
<hx-card
  href="/article/{{ nid }}"
  target="_blank"
>
  <h3 slot="heading">{{ title }}</h3>
</hx-card>
```

Drupal's link preprocessor intercepts `href` and attempts to resolve it as a route. The attribute may be rewritten, stripped, or cause a Twig rendering error.

**Safe — prefixed attribute on a non-native surface:**

```twig
{# SAFE: hx-href turns hx-card into a navigation target without colliding
   with native href semantics on real anchor elements. hx-card does not
   expose target/rel — wrap the card with a real <a> instead if you need
   _blank/_self behavior. #}
<hx-card
  hx-href="/article/{{ nid }}"
  hx-label="{{ 'Open: ' ~ title }}"
  variant="featured"
  elevation="raised"
>
  <h3 slot="heading">{{ title }}</h3>
</hx-card>
```

No CMS preprocessor touches `hx-href` or `hx-label` — they are pure namespace passthroughs, and `hx-card` reads them to wire its activation behavior internally. Link-like components (`hx-button`, `hx-link`) keep the bare `href`/`target`/`rel` attributes because they implement real link semantics and route through the same browser machinery as `<a>`.

## Allowed without prefix

Some attribute names mirror native HTMLElement behaviour. Using them without a prefix ensures compatibility with native form participation, accessibility APIs, and framework bindings.

- `disabled`
- `required`
- `name`
- `value`
- `type`
- `placeholder`
- `hidden`
- `tabindex`

These attributes mirror behaviour that browsers and frameworks expect on form-associated and interactive elements.

## Prefix rule by component

The actual mapping is **per-component** rather than a blanket "always prefix" rule. The CEM is the canonical list — the table below summarises the rationale:

| Attribute (native) | When HELiX keeps it bare | When HELiX uses `hx-` prefix |
| --- | --- | --- |
| `href` | `hx-button`, `hx-link` — link-like surfaces with real anchor semantics | `hx-card` — card-as-navigation (no native `<a>` semantics on the card surface) → `hx-href` |
| `src` | `hx-icon` (`src` for inline SVG URL), `hx-image` and similar media surfaces | (none currently) |
| `action`, `method` | `hx-form` — wraps a native `<form>`, attributes route to native form submission | (none currently) |
| `target`, `rel`, `download` | `hx-link`, `hx-button` — link-like, native attributes flow through | (none currently) |
| `for` | `hx-field-label` — must match a native `for`/`id` pair for label association | (none currently) |
| `size` | (none) | `hx-button`, `hx-icon`, `hx-spinner`, `hx-avatar`, `hx-badge` → `hx-size` (native `size` is numeric on `<input>`/`<select>`) |
| `label` | (none — `label` is intentionally repurposed) | (none) — components use `accessible-label` or a slot instead of grafting `hx-label`, except `hx-card` which uses `hx-label` for the activation surface's accessible name |
| `data` (HIPAA PHI) | (none — PHI never rides as an HTML attribute) | (none — `hx-phi-field` accepts data as a JS property, never serialized to DOM) |

When you add a component, the question to answer is: **does this attribute carry semantics that browsers, ATs, or CMS preprocessors already know how to handle?** If yes, keep it bare. If you are inventing a new behavior on a non-native surface, prefix it.

## Cross-platform safety matrix

How unprefixed attributes behave across the layers of the web stack that process HTML before a component receives it.

Legend: ✓ Safe — passes through unchanged. ⚠ Risky — may be intercepted or modified by the listed layer when used on a **non-native** custom element (without the matching native semantics).

| Attribute on non-native surface | HTML Parser | Drupal | WordPress | Frameworks | A11y Tree |
| --- | --- | --- | --- | --- | --- |
| `href` | ⚠ | ✗ | ✗ | ⚠ | ✗ |
| `action` | ⚠ | ✗ | ⚠ | ⚠ | ✓ |
| `size` (non-numeric) | ⚠ | ⚠ | ✓ | ⚠ | ✓ |
| `hx-href` (the prefix form) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `hx-size` | ✓ | ✓ | ✓ | ✓ | ✓ |

The table only applies when the custom element is not implementing the native attribute's semantics. `hx-button[href]`, `hx-link[href]`, and `hx-field-label[for]` rely on the native semantics flowing through; the table does not say those usages are unsafe.

## Decision

**Prefix invented behaviors. Keep native semantics native.**

When the attribute is a HELiX-specific affordance (turning a card into a navigation target, choosing a token-driven size from `sm|md|lg`, providing an accessible-name override without using `aria-label`), use the `hx-` prefix. When the attribute is doing what the native HTMLElement counterpart does (form submission via `action`/`method`, link navigation via `href`/`target`, label association via `for`), keep the bare native name so browsers, AT, and CMS preprocessors see the semantics they expect.

## Consequences

### Positive

- **Silent failures eliminated.** An attribute stripped by a CMS preprocessor produces no error, no warning, and no stack trace. The component renders, but the data is gone. In enterprise applications, silent data loss is unacceptable. The prefix eliminates this entire class of bug.
- **Future-proof by default.** The HTML specification adds new attributes over time. An attribute name safe today may collide tomorrow. The `hx-` prefix guarantees permanent safety because no specification will ever use that namespace.
- **Universal compatibility.** Prefixed attributes pass through every layer of every stack without interference: Drupal Twig, WordPress PHP, React JSX, Vue templates, Angular bindings, and browser HTML parsers all leave them untouched.

### Negative

- **Verbose.** Every component-specific prop on every element carries the prefix. `hx-href`, `hx-target`, `hx-data-source` — there is no way to omit it.
- **Migration friction.** Pre-existing consumers using bare attributes must update Twig templates and React props. The migration is mechanical but touches every page.

## Related ADRs

- [Slots vs Props](/architecture/adrs/slots-vs-props/) — every property declared by a component is subject to this rule.

## References

- [WHATWG HTML Standard: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [MDN: data-* attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*)
- [Drupal: Filter system and HTML restrictions](https://www.drupal.org/docs/8/api/filter-api/filter-api-overview)
