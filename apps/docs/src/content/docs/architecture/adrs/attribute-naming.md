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

Accepted. **All component-specific attributes must use the `hx-` prefix.** Native HTML attributes that mirror standard HTMLElement behaviour are exempt.

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

Any attribute that does **NOT** mirror standard HTMLElement behaviour must be prefixed with `hx-`. This ensures zero conflict with any current or future HTML specification attribute.

The prefix acts as a **namespace**, clearly signaling to every layer of the stack — browsers, CMS engines, bundlers, and frameworks — that this attribute belongs exclusively to the web component and should be passed through without modification.

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

**Safe — prefixed attribute:**

```twig
{# SAFE: hx- prefix avoids all collisions #}
<hx-card
  hx-href="/article/{{ nid }}"
  hx-target="_blank"
>
  <h3 slot="heading">{{ title }}</h3>
</hx-card>
```

No CMS preprocessor touches `hx-href`. The attribute passes through every layer untouched and arrives safely at the web component.

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

## Must use hx- prefix

These attribute names have established meaning in HTML, ARIA, or CMS template engines. Using them directly on custom elements causes preprocessors, compilers, and parsers to intercept and modify them before the web component ever sees the value.

| Collision name | Use instead |
| --- | --- |
| `href` | `hx-href` |
| `src` | `hx-src` |
| `action` | `hx-action` |
| `target` | `hx-target` |
| `method` | `hx-method` |
| `role` | `hx-role` |
| `for` | `hx-for` |
| `data` | `hx-data` |

## Cross-platform safety matrix

How unprefixed attributes behave across the layers of the web stack that process HTML before a component receives it.

Legend: ✓ Safe — passes through unchanged. ⚠ Risky — may be intercepted or modified. ✗ Dangerous — will be rewritten or stripped.

| Attribute | HTML Parser | Drupal | WordPress | Frameworks | A11y Tree |
| --- | --- | --- | --- | --- | --- |
| `href` | ⚠ | ✗ | ✗ | ⚠ | ✗ |
| `src` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `action` | ⚠ | ✗ | ⚠ | ⚠ | ✓ |
| `target` | ⚠ | ✗ | ⚠ | ⚠ | ✓ |
| `method` | ⚠ | ⚠ | ✓ | ⚠ | ✓ |
| `role` | ✓ | ⚠ | ✓ | ✗ | ✗ |
| `for` | ⚠ | ✗ | ⚠ | ✗ | ✗ |
| `data` | ⚠ | ✗ | ✗ | ✗ | ✓ |
| `hx-href` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `hx-src` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `hx-action` | ✓ | ✓ | ✓ | ✓ | ✓ |

## Decision

**Prefix everything component-specific with `hx-`. Trust nothing else.**

When in doubt, use the `hx-` prefix. It is always safe. Omitting the prefix is only safe when you are **intentionally mirroring** native HTMLElement behaviour (form participation, `disabled`, `hidden`, etc.).

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
