---
title: Server-Side Rendering
description: Render HELiX components on the server with @lit-labs/ssr, stream HTML to the browser, and hydrate with Declarative Shadow DOM.
---

Server-Side Rendering (SSR) generates the component's initial HTML on the server and sends it to the browser as part of the HTTP response. The browser displays the static HTML immediately while the JavaScript loads — then the components "hydrate" into their interactive state. For HELiX components, SSR uses `@lit-labs/ssr` on Node.js and the browser's native Declarative Shadow DOM (DSD) for hydration.

## Installation

```bash
npm install @lit-labs/ssr
npm install @lit-labs/ssr-client  # for client-side hydration
```

## `@lit-labs/ssr` Render API

```typescript
import { render } from '@lit-labs/ssr';
import { html } from 'lit';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

// Import the component — registers it in the SSR environment
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
```

The `render()` function accepts a Lit `TemplateResult` and returns an async iterable of string chunks:

```typescript
import { render } from '@lit-labs/ssr';
import { html } from 'lit';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

async function renderComponent(): Promise<string> {
  const result = render(html`
    <hx-card>
      <hx-button variant="primary">Get Started</hx-button>
    </hx-card>
  `);

  // Collect all chunks into a single string
  return collectResult(result);
}

const htmlString = await renderComponent();
// htmlString includes <template shadowrootmode="open"> for each component
```

For streaming responses (Node.js HTTP or Fetch API):

```typescript
import { render } from '@lit-labs/ssr';
import { html } from 'lit';

export async function handler(req: Request): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const chunks = render(html`
        <html lang="en">
          <head><title>HELiX App</title></head>
          <body>
            <hx-card>
              <hx-button variant="primary">Click Me</hx-button>
            </hx-card>
          </body>
        </html>
      `);

      for await (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

## SSR Constraints

Lit's SSR runs in Node.js, where browser globals (`window`, `document`, `HTMLElement`) are absent. Components must avoid using these in their constructors or module-level code:

```typescript
// WRONG — window is undefined in SSR environment
@customElement('hx-scroll-tracker')
export class HelixScrollTracker extends LitElement {
  constructor() {
    super();
    // This crashes on the server
    this._scrollY = window.scrollY;
  }
}

// CORRECT — access browser globals only in connectedCallback or later
@customElement('hx-scroll-tracker')
export class HelixScrollTracker extends LitElement {
  @state()
  private _scrollY: number = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    // connectedCallback only runs in the browser — window is safe here
    this._scrollY = window.scrollY;
    window.addEventListener('scroll', this._handleScroll);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this._handleScroll);
  }

  private _handleScroll = (): void => {
    this._scrollY = window.scrollY;
    this.requestUpdate();
  };
}
```

## `isServer` Guard

Lit 3.x exports an `isServer` boolean for conditional server vs browser logic:

```typescript
import { LitElement, html, isServer } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-media-player')
export class HelixMediaPlayer extends LitElement {

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer) {
      // Browser-only initialization — MediaSession API not available in Node
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'HELiX Audio',
        });
      }
    }
  }

  override render() {
    if (isServer) {
      // Render a static placeholder on the server
      return html`<div class="player player--ssr-placeholder"></div>`;
    }
    return html`
      <div class="player">
        <button class="player__play">Play</button>
      </div>
    `;
  }
}
```

## Declarative Shadow DOM

SSR produces HTML with `<template shadowrootmode="open">` elements. This is the Declarative Shadow DOM (DSD) specification — browsers that support it attach the shadow root immediately during HTML parsing, before JavaScript runs:

```html
<!-- SSR output — browser renders this before any JS executes -->
<hx-button variant="primary">
  <template shadowrootmode="open">
    <style>/* component styles */</style>
    <button class="button button--primary">
      <span class="button__label">
        <!-- slotted content placeholder -->
      </span>
    </button>
  </template>
  Click Me
</hx-button>
```

Users see styled, rendered content immediately. When the `@helixui/library` JavaScript loads, the components hydrate in place.

## Hydration with `@lit-labs/ssr-client`

On the client, import `@lit-labs/ssr-client` to hydrate server-rendered components:

```typescript
// main.ts — entry point
import { LitElement } from 'lit';

// Import ssr-client BEFORE component imports to enable DSD hydration
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

// Now import components — they hydrate rather than re-render from scratch
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
```

With DSD hydration support loaded:
1. The server sends the page with DSD shadow roots already attached.
2. The browser renders the static HTML immediately.
3. `@helixui/library` loads asynchronously.
4. Each component upgrades and connects its reactive properties to the existing shadow DOM rather than wiping and re-rendering it.

## HELiX SSR Considerations

HELiX components are authored with SSR compatibility in mind:

- No browser globals in constructors or static initializers.
- `connectedCallback` and event listeners are the only places window/document are accessed.
- `isServer` checks gate any unavoidable browser-only paths.
- Component stylesheets are plain `CSSResult` values — they are safe in SSR as Lit inlines them into DSD `<style>` elements.

```typescript
// Component styles work in SSR — Lit writes them into the <template> shadow root
static override styles = helixButtonStyles;
```

The one area requiring care is document-level token adoption. `@helixui/library` calls `document.adoptedStyleSheets` in the browser — ensure this path is guarded with `isServer` when running in an SSR context. In practice, importing `@helixui/library` in SSR only registers custom elements; the `adoptedStyleSheets` assignment is browser-only.

## Next Steps

- [Lazy Loading Components](/components-guide/performance/lazy-loading/) — deferred loading after hydration
- [Bundle Size Optimization](/components-guide/performance/bundle-size/) — keeping the hydration bundle small
- [Rendering Performance](/components-guide/performance/rendering/) — reducing DOM work in the browser after hydration
