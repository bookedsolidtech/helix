---
title: SSR Considerations
description: Understanding server-side rendering constraints and strategies for Lit web components.
---

# SSR Considerations

Server-side rendering (SSR) improves Time to First Byte, enables search engine indexing without client-side execution, and provides a better experience on slow networks. For web components built on Lit, SSR is technically possible but carries meaningful caveats that every implementer must understand before committing to an SSR architecture.

This page gives an honest account of where Lit SSR stands today, what the `@lit-labs/ssr` package does, how Declarative Shadow DOM works, and what to do when SSR is not practical for a given component.

---

## The Core Problem: Shadow DOM Does Not Exist on the Server

Standard SSR frameworks (Node.js, Deno, Bun) do not implement the browser DOM. They have no `document`, no `customElements`, and critically — no `ShadowRoot`. When you try to render a Lit component on the server without special handling, the class is defined but `attachShadow()` is never called, `render()` is never executed, and you get nothing useful in the output HTML.

This is not a Lit limitation. It is a fundamental property of the web components specification, which was designed as a browser API. Every SSR solution for web components is working around this gap.

### What Users See Without SSR (Client-Only)

```html
<!-- What ships to the browser -->
<hx-card></hx-card>

<!-- What the user sees before JS loads -->
(blank — custom element is undefined, renders as empty inline element)

<!-- What the user sees after JS loads and upgrades the element -->
(fully rendered card with shadow DOM)
```

The window between "page visible" and "component upgraded" is the Flash of Unstyled Content (FOUC) for web components. On a hospital wireless network with 50ms+ RTT and large JS bundles, this window can be 500ms–2 seconds.

SSR fills that gap by shipping the rendered HTML directly.

---

## Declarative Shadow DOM (DSD)

Declarative Shadow DOM is the browser mechanism that makes web component SSR possible. It allows a shadow root to be declared directly in HTML, without any JavaScript:

```html
<hx-card>
  <template shadowrootmode="open">
    <style>
      :host {
        display: block;
      }
      .card {
        padding: var(--hx-spacing-md);
      }
    </style>
    <div class="card">
      <slot></slot>
    </div>
  </template>
  <p>Patient: Jane Doe</p>
</hx-card>
```

When the browser parses this HTML, it immediately attaches a shadow root to `<hx-card>` with the content of the `<template shadowrootmode="open">` element. This happens synchronously during HTML parsing — no JavaScript required.

The result: the component renders visually before any JavaScript runs.

### Browser Support for DSD

As of early 2026, Declarative Shadow DOM is supported in:

- Chrome 90+
- Edge 90+
- Safari 16.4+
- Firefox 123+

For older browsers, a polyfill is needed.

### The DSD Polyfill

```html
<!-- In your <head>, before any HELiX components -->
<script>
  // DSD polyfill for older browsers
  // Only runs if the browser does not support DSD natively
  (function () {
    if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) return;

    document.querySelectorAll('template[shadowrootmode]').forEach(function (template) {
      const mode = template.getAttribute('shadowrootmode');
      const shadowRoot = template.parentNode.attachShadow({ mode });
      shadowRoot.appendChild(template.content.cloneNode(true));
      template.remove();
    });
  })();
</script>
```

This polyfill runs synchronously before the rest of the document parses, so it handles all DSD templates in the initial HTML. For dynamic content added after page load (AJAX responses, etc.), you need to re-run the polyfill on the new nodes.

---

## `@lit-labs/ssr`: How It Works

The `@lit-labs/ssr` package provides a Node.js-compatible render engine for Lit components. It implements a minimal DOM shim and executes Lit's template engine in a server environment, producing DSD-annotated HTML.

### Installation

```bash
npm install @lit-labs/ssr
```

`@lit-labs/ssr` is a labs package. This means it is experimental, subject to breaking changes, and not covered by Lit's standard semver guarantees. Evaluate the stability of the current version before adopting it in production.

### Basic Server Rendering

```typescript
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html } from 'lit';

// Import the component — this registers it with the SSR custom elements registry
import '@helix/library/components/hx-card';

const serverHtml = await collectResult(
  render(html`
    <hx-card>
      <span slot="heading">Patient Summary</span>
      <p>Jane Doe — Room 412</p>
    </hx-card>
  `),
);

console.log(serverHtml);
// Output:
// <hx-card>
//   <template shadowrootmode="open">
//     <style>/* ... component styles ... */</style>
//     <div part="card" class="card">
//       <div part="header"><slot name="heading"></slot></div>
//       <div part="body"><slot></slot></div>
//     </div>
//   </template>
//   <span slot="heading">Patient Summary</span>
//   <p>Jane Doe — Room 412</p>
// </hx-card>
```

The output is plain HTML that browsers can parse without executing any JavaScript to get the visual result.

### Streaming SSR with `renderToReadableStream`

For large pages, streaming SSR is preferable because it lets the browser start rendering before the full response is received:

```typescript
import { render } from '@lit-labs/ssr';
import { html } from 'lit';

// In a Node.js HTTP handler (e.g., Express or Hono)
export async function handleRequest(req: Request): Promise<Response> {
  const { Readable } = await import('node:stream');

  const templateResult = render(html`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="modulepreload" href="/dist/vendor-lit.js" />
        <link rel="modulepreload" href="/dist/hx-card.js" />
      </head>
      <body>
        <hx-card>
          <span slot="heading">Dashboard</span>
          <p>Loading patient data...</p>
        </hx-card>
        <script type="module" src="/dist/app.js"></script>
      </body>
    </html>
  `);

  const stream = Readable.from(templateResult);
  return new Response(stream as unknown as ReadableStream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

The browser receives and renders the opening `<html>`, `<head>`, and `<body>` content — including the DSD-rendered component — while the server is still streaming the rest of the document.

---

## Hydration: Connecting SSR Output to the Live Component

After the browser receives the DSD HTML and renders it visually, the client-side Lit component needs to "hydrate" — connect to the existing shadow root without destroying and re-creating it.

Without hydration, the client-side Lit component would re-render on first upgrade, causing a flash of replaced content.

### Installing the Hydration Module

```bash
npm install @lit-labs/ssr-client
```

```typescript
// client/app.ts
// This import enables hydration mode for ALL Lit elements on this page.
// It must be imported before any component definitions.
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

// Then import components as normal
import '@helix/library/components/hx-card';
```

When `lit-element-hydrate-support.js` is loaded, Lit's `LitElement` base class detects existing DSD shadow roots and adopts them rather than creating new ones. The component binds its event listeners and reactive properties to the existing DOM without re-rendering.

### What Hydration Does

1. Component is defined via `customElements.define()`.
2. All existing `<hx-card>` elements in the document are upgraded.
3. Lit detects the existing shadow root (from DSD).
4. Lit reads the server-rendered DOM as the initial render output.
5. Lit attaches event listeners to the shadow DOM elements.
6. Future reactive property changes trigger normal incremental updates.

The visual output does not change during hydration. The upgrade is invisible to the user.

---

## The `shimForSSR()` Pattern

Some components use browser APIs that do not exist in Node.js — `matchMedia`, `ResizeObserver`, `getBoundingClientRect`, etc. Before rendering these components server-side, you need to shim the missing APIs.

```typescript
// ssr-shims.ts — import this before rendering any components
import { installWindowOnGlobal } from '@lit-labs/ssr/lib/dom-shim.js';

// Install the basic DOM shim
installWindowOnGlobal();

// Patch any APIs that @lit-labs/ssr does not cover
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

Components in `@helix/library` are written to avoid using browser APIs in constructors and `render()`. All browser API calls are in `connectedCallback()` or `firstUpdated()`, which do not run during SSR. This discipline is what makes the components SSR-compatible.

---

## Avoiding `document` and `window` Access

The rule in HELiX components: **never access `document`, `window`, or any browser-specific global in the constructor or `render()`.**

```typescript
// ❌ BREAKS SSR — constructor runs on the server
@customElement('hx-media-query')
export class HxMediaQuery extends LitElement {
  constructor() {
    super();
    // ReferenceError on the server: window is not defined
    this._mql = window.matchMedia('(max-width: 768px)');
  }
}

// ✅ SSR-safe — connectedCallback does not run during SSR
@customElement('hx-media-query')
export class HxMediaQuery extends LitElement {
  private _mql?: MediaQueryList;

  connectedCallback() {
    super.connectedCallback();
    // Only runs in the browser
    this._mql = window.matchMedia('(max-width: 768px)');
    this._mql.addEventListener('change', this._handleChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mql?.removeEventListener('change', this._handleChange);
  }
}
```

Similarly, `render()` must not access browser APIs:

```typescript
// ❌ BREAKS SSR
render() {
  const width = document.documentElement.clientWidth; // ReferenceError on server
  return html`<div style="max-width: ${width}px">...</div>`;
}

// ✅ SSR-safe — use reactive properties instead
@state() private _width = 0;

connectedCallback() {
  super.connectedCallback();
  this._width = document.documentElement.clientWidth;
  window.addEventListener('resize', this._handleResize);
}

render() {
  return html`<div style="max-width: ${this._width || 1200}px">...</div>`;
}
```

---

## Astro and the `client:only` Directive

Astro's islands architecture is a natural fit for web components because Astro renders everything server-side by default and hydrates islands selectively.

### Server-Rendered Web Components in Astro

For HELiX components that are SSR-safe, render them directly in your `.astro` files:

```astro
---
// src/pages/patient-dashboard.astro
import '@helix/library/components/hx-card';
---

<html>
  <body>
    <!-- Astro renders this server-side using @lit-labs/ssr -->
    <hx-card>
      <span slot="heading">Patient Summary</span>
      <p>{patientName}</p>
    </hx-card>
  </body>
</html>
```

### `client:only` for Components That Cannot SSR

Some components are inherently client-only — they measure the DOM, use `canvas`, or require user agent detection. Use `client:only="lit"` to skip SSR entirely for those components:

```astro
---
import HxChart from '@helix/library/components/hx-chart';
---

<!--
  client:only tells Astro:
  1. Do not render this server-side (no DSD output)
  2. Load and hydrate on the client only
  3. Show nothing until the JS loads
-->
<HxChart client:only="lit" data={chartData} />
```

Use `client:only` sparingly. For every `client:only` component, users see nothing until JavaScript loads and executes. For charts and data visualisations this is usually acceptable because a meaningful server-rendered fallback would require significant additional work. For interactive form components, it is almost never the right choice.

### Astro Configuration for Lit SSR

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  integrations: [
    lit(), // Enables @lit-labs/ssr for Lit components
  ],
});
```

---

## Testing SSR Output

Testing that SSR output is correct and that hydration is lossless requires a different approach than standard browser-mode Vitest tests.

### Unit Testing SSR Render Output

```typescript
// tests/ssr/hx-card.ssr.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html } from 'lit';
import '@helix/library/components/hx-card';

describe('hx-card SSR', () => {
  it('produces DSD output with shadow root template', async () => {
    const result = await collectResult(render(html`<hx-card><p slot="body">Content</p></hx-card>`));

    expect(result).toContain('<template shadowrootmode="open">');
    expect(result).toContain('part="card"');
    expect(result).toContain('<slot></slot>');
  });

  it('includes component styles in DSD output', async () => {
    const result = await collectResult(render(html`<hx-card></hx-card>`));

    // Styles should be inlined in the shadow root
    expect(result).toContain('<style>');
  });

  it('does not include undefined-element markers', async () => {
    const result = await collectResult(render(html`<hx-card></hx-card>`));

    // Should not have hydration markers for undefined elements
    expect(result).not.toContain('<!--hx-card-->');
  });
});
```

### Integration Testing with Playwright

For full SSR + hydration testing, Playwright can load the SSR-rendered HTML and verify that components are interactive:

```typescript
// e2e/ssr-hydration.spec.ts
import { test, expect } from '@playwright/test';

test('hx-card hydrates correctly after SSR', async ({ page }) => {
  await page.goto('/patient-dashboard');

  // Check that the card is visible before JS loads
  // (Playwright can intercept JS loading)
  const card = page.locator('hx-card');
  await expect(card).toBeVisible();

  // Verify the shadow DOM was rendered by SSR (DSD), not by JS
  const hasDSDOutput = await page.evaluate(() => {
    const card = document.querySelector('hx-card');
    return card?.shadowRoot !== null;
  });
  expect(hasDSDOutput).toBe(true);

  // After hydration, interactive features should work
  await page.click('hx-card hx-button[slot="actions"]');
  await expect(page.locator('.detail-panel')).toBeVisible();
});
```

---

## Honest Assessment of Maturity

Before adopting Lit SSR in production, understand where it stands:

| Aspect                                           | Status                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `@lit-labs/ssr` stability                        | Labs — experimental, semver not guaranteed                   |
| DSD browser support                              | Good (Chrome, Edge, Safari 16.4+, Firefox 123+)              |
| Hydration support                                | Available via `@lit-labs/ssr-client`, works for most cases   |
| Streaming SSR                                    | Supported via async iterables                                |
| Form-associated elements (`ElementInternals`)    | Not SSR-safe — skip server rendering                         |
| Components using `ResizeObserver` / `matchMedia` | Need shimming — adds complexity                              |
| Astro integration                                | Official `@astrojs/lit` integration — stable and recommended |
| Next.js integration                              | No official support — requires manual configuration          |
| Drupal integration                               | No SSR support — use client-only approach in Drupal          |

**Recommendation for HELiX consumers:**

- Use **Astro + `@astrojs/lit`** if you need SSR for HELiX components. It is the best-supported path.
- Use **`client:only`** for components that use browser APIs unavailable during SSR.
- For **Drupal**, SSR is not applicable. Use the standard CDN or npm approach with progressive enhancement.
- For **Next.js or Remix**, treat HELiX components as client-only islands and import them inside a `'use client'` boundary with dynamic imports (`next/dynamic` with `{ ssr: false }`).

SSR for Lit components is real and works. But it adds architectural complexity. Apply it only where the LCP improvement justifies the investment — typically marketing pages, dashboards with above-the-fold data visualisations, and public-facing health portals where SEO matters.

---

## Related Pages

- [Lazy Loading Web Components](./lazy-loading/) — Defer component registration until needed
- [Bundle Size Fundamentals](./bundle-size/) — Keeping component footprint small
- [CDN Distribution](../distribution/cdn/) — Distributing HELiX for zero-install consumption
