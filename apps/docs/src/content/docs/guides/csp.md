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

Six components use `Object.assign(el.style, ...)` or direct `.style` property manipulation for dynamic positioning that cannot be expressed in static CSS:

| Component | Reason |
|-----------|--------|
| `hx-tooltip` | Dynamic `top`/`left` positioning relative to trigger element |
| `hx-popover` | Dynamic floating positioning with collision detection |
| `hx-popup` | Base positioning utility used by popovers and dropdowns |
| `hx-overflow-menu` | Dynamic menu positioning relative to trigger |
| `hx-dropdown` | Floating listbox positioning below trigger |
| `hx-color-picker` | Gradient thumb and slider positions during drag |

These components calculate positions at runtime based on viewport dimensions and trigger element coordinates. Static CSS custom properties cannot replace this because the values are not known until layout time.

### Alternative: CSP Nonce

If your environment supports CSP nonces, you can avoid `'unsafe-inline'` by configuring a nonce on the document. However, Lit's rendering pipeline applies inline styles directly via the DOM API (`el.style.top = ...`), not via `<style>` tags, so CSP nonces do not currently help with this pattern.

### Future Improvement

The [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) specification (Chrome 125+) will eventually allow these components to express positioning in pure CSS. This is tracked as a future enhancement.

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
