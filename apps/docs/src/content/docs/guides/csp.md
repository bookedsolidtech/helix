---
title: Content Security Policy (CSP)
description: CSP configuration guidance for deploying HELiX components in enterprise environments.
---

## Overview

HELiX components are designed to work within Content Security Policy restrictions common in healthcare and enterprise environments. This guide documents the minimum CSP directives required.

## Minimum CSP Headers

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
```

## Why `style-src 'unsafe-inline'` is Required

Several components use `Object.assign(el.style, …)` or direct `.style` property manipulation for runtime values that cannot be expressed in static CSS. Floating-positioning components are the most visible reason; a handful of other components also write to `.style` for cross-axis layout values (e.g. progress bars setting widths from a percentage, sliders setting thumb positions during drag).

| Component | Reason |
|-----------|--------|
| `hx-tooltip` | Dynamic `top`/`left` positioning relative to trigger element |
| `hx-popover` | Dynamic floating positioning with collision detection |
| `hx-popup` | Base positioning utility used by popovers and dropdowns |
| `hx-overflow-menu` | Dynamic menu positioning relative to trigger |
| `hx-dropdown` | Floating listbox positioning below trigger |
| `hx-color-picker` | Gradient thumb and slider positions during drag |
| `hx-toast` | Stacked toast position offsets relative to container |
| `hx-drawer` | Drag-to-dismiss offset during gesture |
| `hx-carousel` | Slide translate offset during transition |

The list is illustrative, not exhaustive — any HELiX component that does runtime layout math may write to `.style` and therefore require `'unsafe-inline'` for `style-src`. The shipped CSP guidance is to permit `'unsafe-inline'` for `style-src` in the meantime.

### CSP Nonces and Inline Styles

CSP nonces do not currently replace `'unsafe-inline'` for HELiX runtime positioning. Nonces apply to `<style>` and `<link rel="stylesheet">` elements; components write to the inline-style attribute via the DOM (`el.style.top = …`), which is governed by the `'unsafe-inline'` style-src source rather than the nonce-source list. There is no nonce-bearing element in the runtime style path.

### Future Improvement

The [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) specification (Chrome 125+) could let many of these components express positioning in pure CSS once browser support is reliable across the targets HELiX guarantees. There is no committed tracking issue today — treat this as a candidate future enhancement, not a roadmap commitment.

## Design Tokens

HELiX design tokens are injected via `document.adoptedStyleSheets`, which does **not** require `'unsafe-inline'`. The Constructable Stylesheets API is CSP-compliant by design.

## SVG Icon Fetching

The `hx-icon` component in inline mode (`src` attribute) fetches SVG files via `fetch()`. Ensure your `connect-src` directive includes any CDN origins serving icon SVGs:

```http
connect-src 'self' https://cdn.example.com;
```

The component validates URL origins by default (same-origin only). Use the `allowed-origins` attribute to permit specific external origins:

```html
<hx-icon src="https://cdn.example.com/icons/check.svg"
         allowed-origins="https://cdn.example.com">
</hx-icon>
```

## Trusted Types

HELiX does not currently enforce [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API). The `hx-icon` component uses Lit's `unsafeHTML` directive for inline SVG rendering, which will require Trusted Types policy configuration if your application enforces `require-trusted-types-for 'script'`.

## Shadow DOM Considerations

Shadow DOM provides style encapsulation but does **not** provide a security boundary. Component styles declared in Shadow DOM via `adoptedStyleSheets` or `<style>` tags do not bypass CSP — they follow the same CSP rules as the host document.
