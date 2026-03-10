---
title: Lazy Loading Web Components
description: Strategies for loading web components on demand to minimize initial page weight.
---

# Lazy Loading Web Components

Every byte of JavaScript you ship on the critical path is a byte the browser must download, parse, and compile before the page becomes interactive. For a healthcare application where staff are logging patient data under time pressure, a slow initial load is not an inconvenience — it is a clinical risk.

Lazy loading defers component registration until a component is actually needed. This page covers every practical technique for doing this with Lit web components in the HELiX library, including viewport-based loading, interaction-triggered loading, Drupal integration, and how to measure the impact.

---

## Why Components Are Expensive to Load

When you write `import '@helix/library/components/hx-data-table'`, three things happen:

1. **Network fetch** — The module file is downloaded from the server or cache.
2. **Parse** — The browser's JavaScript engine parses the file into an AST.
3. **Evaluate** — The module is executed, which runs the class definition and calls `customElements.define()`.

For a component like `hx-data-table`, steps 1–3 might take 80–200ms on a mid-range device over a hospital wireless network. If that component only appears when a user clicks "Show patient history," loading it at page startup wastes that budget every time — even for users who never open the panel.

The per-component entry points in `@helix/library` make granular lazy loading possible without any custom build configuration. Each component is independently importable:

```
@helix/library/components/hx-button
@helix/library/components/hx-card
@helix/library/components/hx-data-table
```

---

## Dynamic `import()` for Component Registration

The simplest lazy loading technique is a dynamic `import()` at the point of use. Unlike a static `import` at the top of the file, a dynamic import returns a Promise and creates a separate bundle chunk that is only fetched when the call executes.

```typescript
// Static import — always downloaded, always executed
import '@helix/library/components/hx-data-table';

// Dynamic import — fetched only when this code runs
async function showPatientHistory() {
  await import('@helix/library/components/hx-data-table');
  const table = document.createElement('hx-data-table');
  table.data = await fetchPatientRecords();
  document.getElementById('history-panel')?.appendChild(table);
}

document.getElementById('show-history-btn')?.addEventListener('click', showPatientHistory);
```

Vite automatically splits the dynamic import into a separate chunk during `npm run build`. The chunk is only fetched when the user clicks the button.

### Avoiding the Double-Load Race

If multiple events can trigger the same import concurrently, guard with a flag or use `customElements.get()`:

```typescript
let dataTableLoaded = false;

async function ensureDataTable() {
  if (dataTableLoaded || customElements.get('hx-data-table')) {
    return;
  }
  dataTableLoaded = true;
  await import('@helix/library/components/hx-data-table');
}
```

`customElements.get('hx-data-table')` returns the constructor if the element is already defined, or `undefined` if not. This is a reliable way to check registration state without managing your own flags.

---

## IntersectionObserver-Based Lazy Loading

Loading a component when it enters the viewport is the most impactful lazy loading pattern for below-the-fold content. The `IntersectionObserver` API fires a callback when an element crosses the viewport boundary.

### The Core Pattern

```typescript
function lazyDefine(tagName: string, loader: () => Promise<unknown>): void {
  // Already registered — nothing to do.
  if (customElements.get(tagName)) return;

  const targets = document.querySelectorAll<HTMLElement>(`${tagName}:not(:defined)`);

  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    async (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        // Unobserve immediately so this fires exactly once.
        obs.unobserve(entry.target);

        // If a concurrent entry already triggered the load, skip.
        if (customElements.get(tagName)) continue;

        await loader();
      }
    },
    {
      // Load 200px before the element enters the viewport
      // so there's no visible pop-in.
      rootMargin: '0px 0px 200px 0px',
    },
  );

  targets.forEach((el) => observer.observe(el));
}

// Call at page init time
lazyDefine('hx-data-table', () => import('@helix/library/components/hx-data-table'));
lazyDefine('hx-chart', () => import('@helix/library/components/hx-chart'));
```

### How the Browser Handles Undefined Elements

Until `customElements.define('hx-data-table', ...)` runs, `<hx-data-table>` renders as an unknown inline element — essentially an empty `<span>` with no styles. Browsers do not throw errors. This is specified behaviour: unknown elements are `HTMLUnknownElement` and remain inert until upgraded.

This means your HTML can contain `<hx-data-table>` elements long before the JavaScript loads. The moment the module resolves, all existing instances in the document are upgraded simultaneously via the custom elements upgrade algorithm.

### Real Example: hx-data-table Loaded on Scroll

```html
<!-- index.html — shipped on first load with zero JS for the table -->
<section class="patient-history">
  <h2>Patient History</h2>
  <!-- Sits below the fold. Will be upgraded when scrolled to. -->
  <hx-data-table id="history-table"></hx-data-table>
</section>
```

```typescript
// app.ts
import { lazyDefine } from './lazy-define.js';

lazyDefine('hx-data-table', () => import('@helix/library/components/hx-data-table'));

// Separately, populate data when the component is ready
customElements.whenDefined('hx-data-table').then(async () => {
  const table = document.getElementById('history-table') as HTMLElement & {
    data: unknown[];
  };
  table.data = await fetchPatientHistory();
});
```

When the user scrolls to the patient history section, the IntersectionObserver fires. The import resolves, the element upgrades, `whenDefined` resolves, and data is set — all in sequence without any visible flash.

---

## `customElements.whenDefined()` for Progressive Enhancement

`customElements.whenDefined(tagName)` returns a Promise that resolves with the constructor once the element is defined. This is the correct hook for any logic that depends on an element being fully upgraded.

```typescript
// Set up interactions after hx-select is ready
customElements.whenDefined('hx-select').then(() => {
  const selects = document.querySelectorAll('hx-select');
  selects.forEach((el) => {
    el.addEventListener('hx-change', handleFilterChange);
  });
});
```

This pattern is particularly useful in progressively enhanced Drupal pages where the HTML is server-rendered and JavaScript adds behaviour after the fact. The `customElements.whenDefined` call does not care whether the element is already defined or defined in the future — it handles both cases.

### Waiting for Multiple Elements

```typescript
await Promise.all([
  customElements.whenDefined('hx-button'),
  customElements.whenDefined('hx-card'),
  customElements.whenDefined('hx-text-input'),
]);

// All three are now fully registered and ready
initializeForm();
```

---

## The `define-lazy` Pattern

For libraries that ship many components, a common pattern is a `define-lazy` entry point that registers every component behind a `customElements.get()` guard but does not actually load any module. Instead, it installs an observer that triggers imports on demand.

```typescript
// packages/hx-library/src/define-lazy.ts
const COMPONENT_LOADERS: Record<string, () => Promise<unknown>> = {
  'hx-button': () => import('./components/hx-button/index.js'),
  'hx-card': () => import('./components/hx-card/index.js'),
  'hx-text-input': () => import('./components/hx-text-input/index.js'),
  'hx-select': () => import('./components/hx-select/index.js'),
  'hx-data-table': () => import('./components/hx-data-table/index.js'),
  // ... all components
};

const loading = new Set<string>();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const tagName = (node as Element).tagName.toLowerCase();
      if (COMPONENT_LOADERS[tagName] && !customElements.get(tagName) && !loading.has(tagName)) {
        loading.add(tagName);
        COMPONENT_LOADERS[tagName]();
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

This approach means consumers only need:

```html
<script type="module" src="/dist/hx-library/define-lazy.js"></script>
```

And every HELiX element used in the document will load its module automatically when it is inserted into the DOM.

**Trade-off:** The `MutationObserver` approach does not prefetch anything and introduces a small latency between element insertion and upgrade. For components that must appear immediately (above the fold), prefer explicit static imports.

---

## Per-Component Entry Points in Vite Library Mode

The `@helix/library` build exposes each component as a named entry point, which is what makes any lazy loading strategy work:

```typescript
// packages/hx-library/vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        // Full-library entry (all components)
        index: resolve(__dirname, 'src/index.ts'),
        // Per-component entries (individually lazy-loadable)
        'components/hx-button/index': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'components/hx-card/index': resolve(__dirname, 'src/components/hx-card/index.ts'),
        'components/hx-data-table/index': resolve(
          __dirname,
          'src/components/hx-data-table/index.ts',
        ),
        // ... one entry per component
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize Lit so it is not bundled into every chunk
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js'],
    },
  },
});
```

The `package.json` `exports` map makes the per-component paths importable:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./src/index.ts"
    },
    "./components/*": {
      "import": "./dist/components/*/index.js",
      "types": "./src/components/*/index.ts"
    }
  }
}
```

Consumers then import:

```typescript
// Lazy-imports only the data-table module (~4KB gzipped)
// Lit is loaded separately and shared across all components
await import('@helix/library/components/hx-data-table');
```

---

## Code Splitting with Rollup/Vite

When building an application that consumes HELiX, configure Vite to split HELiX components into separate chunks automatically:

```typescript
// app/vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep Lit in its own long-cached chunk
          if (id.includes('node_modules/lit')) {
            return 'vendor-lit';
          }
          // Each HELiX component gets its own chunk
          const match = id.match(/hx-library\/src\/components\/(hx-[^/]+)/);
          if (match) {
            return `hx-${match[1]}`;
          }
        },
      },
    },
  },
});
```

This produces output like:

```
dist/vendor-lit.js          5.1 KB gzip  (cached across deploys)
dist/hx-button.js           1.8 KB gzip
dist/hx-card.js             1.6 KB gzip
dist/hx-data-table.js       4.2 KB gzip
dist/app.js                 8.3 KB gzip
```

Each component chunk is independently cacheable. When you ship a patch to `hx-button`, only `hx-button.js` is invalidated — users re-download 1.8 KB, not the full library.

---

## Preloading Critical Components with `<link rel="modulepreload">`

Lazy loading defers non-critical components. But some components — `hx-button`, `hx-text-input` — are needed on almost every page and should be preloaded to avoid a render-blocking fetch on first interaction.

```html
<head>
  <!-- Preload Lit so it is ready before any component runs -->
  <link rel="modulepreload" href="/dist/vendor-lit.js" />

  <!-- Preload components needed above the fold -->
  <link rel="modulepreload" href="/dist/hx-button.js" />
  <link rel="modulepreload" href="/dist/hx-text-input.js" />

  <!-- Prefetch components likely needed soon (low priority) -->
  <link rel="prefetch" href="/dist/hx-data-table.js" />
</head>
```

The difference:

| Hint            | Priority          | When fetched             | Use for                                                  |
| --------------- | ----------------- | ------------------------ | -------------------------------------------------------- |
| `modulepreload` | High              | Immediately, in parallel | Components needed for first paint or first interaction   |
| `prefetch`      | Low               | During idle time         | Components that will likely be needed on this page later |
| `preload`       | High (non-module) | Immediately              | Non-module resources (fonts, images)                     |

Use `modulepreload` for components in the initial viewport. Use `prefetch` for components behind a user interaction that is likely but not immediate.

---

## Lazy Loading in Drupal

Drupal's library system assumes all JavaScript is loaded at page init via `*.libraries.yml`. To integrate lazy loading with Drupal behaviors, use an IntersectionObserver inside the behavior itself.

### Drupal Behavior with IntersectionObserver

```javascript
// themes/custom/helix_theme/js/lazy-components.behavior.js
(function (Drupal) {
  'use strict';

  const CDN_BASE = 'https://cdn.example.com/hx-library@2.0.0/components';

  const LAZY_COMPONENTS = {
    'hx-data-table': `${CDN_BASE}/hx-data-table/index.js`,
    'hx-chart': `${CDN_BASE}/hx-chart/index.js`,
  };

  function lazyDefineAll() {
    Object.entries(LAZY_COMPONENTS).forEach(([tagName, url]) => {
      if (customElements.get(tagName)) return;

      const targets = document.querySelectorAll(`${tagName}:not(:defined)`);
      if (!targets.length) return;

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            obs.unobserve(entry.target);
            if (!customElements.get(tagName)) {
              import(url);
            }
          });
        },
        { rootMargin: '0px 0px 200px 0px' },
      );

      targets.forEach((el) => observer.observe(el));
    });
  }

  Drupal.behaviors.helixLazyComponents = {
    attach(context) {
      // Run on full page attach and on AJAX-injected content
      if (context === document) {
        lazyDefineAll();
      } else {
        // For AJAX-loaded content, check for new component instances
        Object.keys(LAZY_COMPONENTS).forEach((tagName) => {
          const newInstances = context.querySelectorAll(`${tagName}:not(:defined)`);
          if (newInstances.length && !customElements.get(tagName)) {
            import(LAZY_COMPONENTS[tagName]);
          }
        });
      }
    },
  };
})(Drupal);
```

The `attach` callback is called both on initial page load and after every AJAX response (Views refresh, form reload, etc.), so newly injected components are handled automatically.

### Drupal Libraries Configuration

```yaml
# helix_theme.libraries.yml
helix-lazy-loader:
  version: '1.0.0'
  js:
    js/lazy-components.behavior.js: { scope: footer, defer: true }
  dependencies:
    - core/drupal
```

Attach the library only on pages that use lazy HELiX components:

```php
// helix_theme.theme
function helix_theme_preprocess_node(&$variables) {
  if ($variables['node']->getType() === 'patient_record') {
    $variables['#attached']['library'][] = 'helix_theme/helix-lazy-loader';
  }
}
```

---

## Measuring Lazy Loading Impact with Lighthouse

Lighthouse's "Reduce unused JavaScript" audit directly flags eagerly loaded modules that are not used on the critical path. Run it before and after implementing lazy loading to quantify the improvement.

### Running the Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit the page that has been refactored
lighthouse https://your-site.com/patient-dashboard \
  --only-audits=unused-javascript,uses-rel-preload,uses-rel-preconnect \
  --output=json \
  --output-path=./lighthouse-before.json

# After lazy loading implementation
lighthouse https://your-site.com/patient-dashboard \
  --only-audits=unused-javascript,uses-rel-preload,uses-rel-preconnect \
  --output=json \
  --output-path=./lighthouse-after.json
```

### Key Metrics to Compare

| Metric                        | What it tells you                                                |
| ----------------------------- | ---------------------------------------------------------------- |
| **Reduce unused JavaScript**  | Bytes that were loaded but not executed during the audit session |
| **Time to Interactive (TTI)** | When the main thread is free enough for reliable interaction     |
| **Total Blocking Time (TBT)** | Sum of long task durations — lazy loading reduces this directly  |
| **JavaScript coverage**       | % of loaded JS actually used — target above 80%                  |

### Chrome Coverage Panel

For detailed byte-level analysis before Lighthouse:

1. Open DevTools (F12) and press Ctrl+Shift+P (or Cmd+Shift+P on macOS).
2. Type "Show Coverage" and select it.
3. Click the reload button in the Coverage panel.
4. Interact with the page normally.
5. Sort by "Unused Bytes" descending.

Any HELiX component module with greater than 50% unused bytes at first load is a candidate for lazy loading.

---

## Summary: Choosing the Right Strategy

| Scenario                                                  | Strategy                                                 |
| --------------------------------------------------------- | -------------------------------------------------------- |
| Component always visible above the fold                   | Static `import` + `modulepreload` hint                   |
| Component below the fold, already in HTML                 | `IntersectionObserver` + `whenDefined`                   |
| Component loaded on user interaction (click, form submit) | Dynamic `import()` inside event handler                  |
| All components across a large Drupal site                 | `define-lazy` MutationObserver pattern                   |
| Application build with route-based pages                  | Vite `manualChunks` + route-level dynamic imports        |
| CDN-only Drupal integration                               | Drupal behavior + IntersectionObserver + CDN URL imports |

Apply `modulepreload` for every component that is in the critical path of the first interaction. Everything else should be lazy unless profiling shows it is not worth the complexity.

---

## Related Pages

- [Bundle Size Fundamentals](./bundle-size/) — Tree-shaking, minification, and CI enforcement
- [Render Performance In-Depth](./rendering/) — Core Web Vitals and the browser rendering pipeline
- [CDN Distribution](../distribution/cdn/) — Serving HELiX components via CDN for Drupal
- [SSR Considerations](./ssr/) — Server-side rendering constraints and strategies
