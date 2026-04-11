---
title: Lazy Loading Components
description: Defer loading HELiX components until they are needed using dynamic import, IntersectionObserver, and module preloading.
---

Lazy loading defers the download and parsing of a component's JavaScript until the component is actually needed. For applications that use many HELiX components but only show a few on any given page, lazy loading can significantly reduce initial bundle size and time-to-interactive.

## Dynamic Import

The `import()` function is a native JavaScript feature that loads a module on demand and returns a `Promise`. The browser downloads and executes the module only when `import()` is called:

```typescript
// Eagerly loaded — downloaded on page load even if the dialog is never opened
import '@helixui/library/components/hx-dialog';

// Lazily loaded — downloaded only when openDialog() is called
async function openDialog(): Promise<void> {
  await import('@helixui/library/components/hx-dialog');
  const dialog = document.querySelector('hx-dialog');
  dialog?.show();
}
```

For components inside a Lit template, conditionally import when needed:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-settings-page')
export class HelixSettingsPage extends LitElement {

  @state()
  private _showAdvanced: boolean = false;

  private async _toggleAdvanced(): Promise<void> {
    if (!this._showAdvanced) {
      // Load hx-advanced-settings only when the user first opens it
      await import('@helixui/library/components/hx-advanced-settings');
    }
    this._showAdvanced = !this._showAdvanced;
  }

  override render(): TemplateResult {
    return html`
      <section>
        <hx-button @hx-click=${this._toggleAdvanced}>
          ${this._showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </hx-button>
        ${this._showAdvanced ? html`<hx-advanced-settings></hx-advanced-settings>` : ''}
      </section>
    `;
  }
}
```

## `customElements.whenDefined()` — Waiting for Registration

When using lazy-loaded components, the browser may parse and render the HTML that contains a custom element tag before the JavaScript that defines it has loaded. In this case the element is an `HTMLElement` instance with no custom behavior until the definition arrives.

`customElements.whenDefined(tagName)` returns a `Promise<CustomElementConstructor>` that resolves when the definition is registered:

```typescript
// Safe to call before the module loads — it queues until registration happens
async function initializeDialog(): Promise<void> {
  // Start the import in parallel with the whenDefined check
  const [, HelixDialog] = await Promise.all([
    customElements.whenDefined('hx-dialog'),
    import('@helixui/library/components/hx-dialog'),
  ]);

  const dialog = document.querySelector('hx-dialog')!;
  // Now safe to call custom methods — the element is fully initialized
  dialog.show();
}
```

You can also use `customElements.upgrade(element)` to force the upgrade of a specific element after its definition arrives, without waiting for the next microtask:

```typescript
const placeholder = document.createElement('hx-spinner');
document.body.appendChild(placeholder);

await import('@helixui/library/components/hx-spinner');
customElements.upgrade(placeholder); // immediately upgrades the element
```

## IntersectionObserver — Viewport-Triggered Loading

Load components only when they scroll into view. This is ideal for components below the fold — charts, media players, comment sections:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-lazy-section')
export class HelixLazySection extends LitElement {

  @property({ type: String })
  component: string = '';

  @state()
  private _loaded: boolean = false;

  private _observer: IntersectionObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !this._loaded) {
          this._loadComponent();
          // Stop observing after first intersection
          this._observer?.disconnect();
        }
      },
      { rootMargin: '200px' }, // start loading 200px before visible
    );
    this._observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = null;
  }

  private async _loadComponent(): Promise<void> {
    if (!this.component) return;
    await import(`@helixui/library/components/${this.component}`);
    this._loaded = true;
  }

  override render(): TemplateResult {
    return html`
      ${this._loaded ? html`<slot></slot>` : html`<div class="placeholder"></div>`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-lazy-section': HelixLazySection;
  }
}
```

Usage:

```html
<hx-lazy-section component="hx-data-chart">
  <hx-data-chart data=${JSON.stringify(chartData)}></hx-data-chart>
</hx-lazy-section>
```

## Route-Level Code Splitting

In a router-driven application, load all components for a route together when the route activates:

```typescript
// router.ts
const routes = {
  '/dashboard': async () => {
    await Promise.all([
      import('@helixui/library/components/hx-card'),
      import('@helixui/library/components/hx-chart'),
      import('@helixui/library/components/hx-data-table'),
    ]);
  },
  '/settings': async () => {
    await Promise.all([
      import('@helixui/library/components/hx-form'),
      import('@helixui/library/components/hx-toggle'),
      import('@helixui/library/components/hx-select'),
    ]);
  },
};

async function navigateTo(path: string): Promise<void> {
  const loadRoute = routes[path as keyof typeof routes];
  if (loadRoute) await loadRoute();
  // Render the route content
}
```

## Preloading Critical Components

For components that are not on the initial paint but are likely to be needed immediately (e.g., a modal triggered by the user's first action), use `<link rel="modulepreload">` to download them in parallel with the page load without executing them:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Eagerly executed — renders immediately -->
    <script type="module" src="./main.js"></script>

    <!-- Downloaded early, executed on demand -->
    <link rel="modulepreload" href="/components/hx-dialog.js" />
    <link rel="modulepreload" href="/components/hx-toast.js" />
  </head>
  <body>...</body>
</html>
```

Or dynamically create `modulepreload` hints after the page loads for components likely needed soon:

```typescript
function preloadComponent(path: string): void {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = path;
  document.head.appendChild(link);
}

// After initial render — preload components for anticipated next actions
preloadComponent('/components/hx-dialog.js');
preloadComponent('/components/hx-drawer.js');
```

## Next Steps

- [Bundle Size Optimization](/components-guide/performance/bundle-size/) — tree-shaking and `sideEffects: false`
- [Rendering Performance](/components-guide/performance/rendering/) — reducing unnecessary DOM updates
- [Server-Side Rendering](/components-guide/performance/ssr/) — SSR and hydration for initial load performance
