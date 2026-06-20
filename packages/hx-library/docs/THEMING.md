# Theming HELiX

HELiX components are themed exclusively through CSS custom properties (`--hx-*`).
Because every component renders into Shadow DOM, custom properties are the only
styles that pierce the boundary — there are no global class overrides to fight,
and nothing leaks back out. This document explains the token cascade and where
to override it.

> See also: the **Design Tokens** section of the package README for the install
> and CDN wiring, and `docs/CSS-BUNDLES.md` for the stylesheet entry points.

## The three-tier cascade

Tokens flow through three layers. Each layer falls back to the one above it, so
you override at the highest layer that matches your intent and the change
cascades down.

```
Primitive            Raw, brand-agnostic values.
  --hx-color-primary-700, --hx-space-4, --hx-font-size-2
        │
        ▼
Semantic / action    Intent-named aliases of primitives. This is the layer
  --hx-color-action-primary-bg     you override for app-wide theming.
  --hx-color-text-primary, --hx-color-text-strong, --hx-color-text-muted
  --hx-color-surface-default, --hx-color-surface-raised, --hx-color-surface-sunken
  --hx-color-border-default, --hx-color-border-strong
        │
        ▼
Component             Per-component knobs. Override for surgical, one-component
  --hx-button-bg, --hx-button-color, --hx-button-border-color     changes.
  --hx-card-padding, --hx-icon-size, ...
```

Each component consumes at the **component** layer with a **semantic** fallback:

```css
:host {
  /* component token wins if set; otherwise the semantic action token; the
     pixel/hex literal is the last-resort fallback so the component still
     renders if tokens are absent. */
  --_bg: var(--hx-button-bg, var(--hx-color-action-primary-bg, #1d4ed8));
}
```

## Where to override

**App-wide theme** — set the semantic/action tokens once on `:root` (or on a
`<hx-theme>` boundary). Every component re-skins automatically:

```css
:root {
  --hx-color-action-primary-bg: #0b7285;
  --hx-color-text-primary: #0b1721;
  --hx-color-surface-raised: #ffffff;
}
```

**One component, everywhere** — set the component token on `:root`:

```css
:root {
  --hx-button-border-radius: 0; /* square buttons across the app */
}
```

**One instance** — set the component token inline or via a scoped selector:

```css
.danger-zone hx-button {
  --hx-button-bg: var(--hx-color-action-danger-bg);
}
```

```html
<hx-button style="--hx-button-bg: #b00020;">Delete</hx-button>
```

Precedence is ordinary CSS specificity + the cascade: an inline component token
beats a `:root` component token, which beats the semantic fallback, which beats
the built-in literal.

## Per-variant overrides

Variant attributes (`variant="primary"`, `variant="danger"`, …) select different
semantic tokens internally. To retarget a single variant without touching the
others, scope by the attribute:

```css
hx-button[variant='primary'] {
  --hx-button-bg: var(--hx-color-action-primary-bg);
}
hx-button[variant='danger'] {
  --hx-button-bg: var(--hx-color-action-danger-bg);
}
```

## Discovering a component's tokens

Every component documents its consumable tokens as `@cssprop` entries in the
**Custom Elements Manifest**, which ships as a package export:

```js
import manifest from '@helixui/library/custom-elements.json' with { type: 'json' };
```

The same file backs the `customElements` field in `package.json`, so editors and
design-system tooling (Storybook controls, VS Code Custom Data, the docs site)
read the token, attribute, event, slot, and CSS-part surface directly from it —
it is always in sync with the shipped API.

## Rules

- **Never hardcode** colors, spacing, or typography in consumer code — override a
  token instead, so dark mode, high-contrast, and brand themes keep working.
- Override at the **semantic** layer for breadth, the **component** layer for
  precision.
- Tokens are the contract. Reaching into Shadow DOM with `::part()` is supported
  for layout tweaks, but color/spacing should always route through `--hx-*`.
