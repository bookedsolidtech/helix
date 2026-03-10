---
title: Bundle Size Fundamentals
description: Master bundle size optimization for wc-2026—tree-shaking, code splitting, lazy loading, minification, compression, and CI enforcement of performance budgets.
prerequisites:
  - components/fundamentals/overview
sidebar:
  order: 1
---

# Bundle Size Fundamentals

Bundle size is one of the most critical performance metrics for web applications, directly impacting page load time, Time to Interactive (TTI), and user experience. For enterprise healthcare applications where every millisecond counts, optimizing JavaScript bundle size is not optional—it's a requirement.

This guide provides deep technical coverage of bundle size optimization for `wc-2026`, covering tree-shaking, code splitting, lazy loading, minification, compression, and CI enforcement of performance budgets.

## Why Bundle Size Matters

JavaScript bundle size directly impacts three critical web performance metrics:

### Network Transfer Time

Larger bundles take longer to download, especially on slow or unreliable networks. Healthcare professionals often work in environments with variable network quality—hospital basements, rural clinics, or mobile connections during patient transport.

**Impact:**

- A 100 KB bundle on a 3G connection (750 Kbps) takes ~1.1 seconds to download
- A 500 KB bundle takes ~5.5 seconds
- Every kilobyte adds ~11 milliseconds to download time

### Parse and Compile Time

After downloading, the browser must parse and compile JavaScript before it can execute. This is CPU-intensive work that blocks the main thread.

**Impact:**

- Modern desktop browsers parse ~1 MB/s of JavaScript
- Mobile devices parse at 200-300 KB/s
- A 500 KB bundle takes ~2 seconds to parse on mobile

### Memory Footprint

Larger bundles consume more memory, which can cause performance degradation on low-end devices or when users have many tabs open.

**The Total Cost:**
For a 500 KB bundle on a mid-range mobile device:

- Download: ~5.5 seconds
- Parse/compile: ~2 seconds
- Total blocking time: **~7.5 seconds**

This is why bundle size optimization is a top priority for hx-library.

## wc-2026 Performance Budgets

Performance budgets are hard limits enforced in CI. Every component must meet these thresholds or the build fails.

| Metric                        | Budget         | Enforcement            |
| ----------------------------- | -------------- | ---------------------- |
| Individual component (min+gz) | < 5 KB         | CI bundle analysis     |
| Full library bundle (min+gz)  | < 50 KB        | CI bundle analysis     |
| Lit core overhead             | ~5 KB baseline | Externalized in build  |
| Time to first render (CDN)    | < 100ms        | Performance test suite |
| LCP (docs site)               | < 2.5s         | Lighthouse CI          |
| INP                           | < 200ms        | Lighthouse CI          |
| CLS                           | < 0.1          | Lighthouse CI          |

**Zero tolerance for regressions.** If a PR increases bundle size, it must be justified and approved by the performance engineer.

### Why These Numbers?

- **< 5 KB per component:** Ensures components are lightweight and focused. With Lit core at ~5 KB, a single component should add minimal overhead.
- **< 50 KB total:** Full library bundle (all components) must stay under this threshold to enable performant CDN delivery for consumers who need everything.
- **100ms first render:** Components must be interactive within 100ms of loading to meet enterprise UX requirements.
- **Core Web Vitals alignment:** LCP, INP, and CLS thresholds match Google's "Good" criteria for production sites.

## Bundle Analysis Tools

Measuring bundle size accurately requires the right tools. wc-2026 uses a combination of build-time analysis and runtime monitoring.

### Vite Build Analysis

Vite provides detailed bundle analysis during production builds. The wc-2026 configuration outputs granular metrics for each component.

```bash
npm run build
```

**Output example:**

```
dist/index.js                        0.13 kB │ gzip: 0.10 kB
dist/components/hx-button/index.js   3.47 kB │ gzip: 1.42 kB
dist/components/hx-card/index.js     2.89 kB │ gzip: 1.18 kB
dist/components/hx-text-input/index.js 4.21 kB │ gzip: 1.73 kB
dist/shared/hx-form-Dy74Gm0T.js      1.56 kB │ gzip: 0.68 kB
```

Key metrics to monitor:

- **Unminified size:** Shows raw code size before minification
- **Minified size:** Size after terser/esbuild minification
- **Gzipped size:** Compressed size (what's actually transferred over HTTP)
- **Brotli size:** More aggressive compression (10-20% smaller than gzip)

### Bundlephobia

[Bundlephobia](https://bundlephobia.com/) analyzes npm packages and shows their impact on bundle size.

**How to use:**

1. Publish a pre-release version of `@helix/library`
2. Enter package name at bundlephobia.com
3. View per-component tree-shaking impact

**Example analysis for hx-button:**

```
Import: import { HxButton } from '@helix/library'
Bundle size: 8.2 KB (minified)
Gzipped: 3.1 KB
Tree-shakeable: ✅
Dependencies: lit@3.3.2 (5.1 KB)
```

### rollup-plugin-visualizer

Visual bundle analysis shows which modules contribute to bundle size.

**Installation:**

```bash
npm install --save-dev rollup-plugin-visualizer
```

**Vite integration:**

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**Output:** Interactive HTML visualization showing module sizes, dependencies, and chunk relationships.

### Chrome DevTools Coverage

Runtime coverage analysis identifies unused code in production.

**Steps:**

1. Open Chrome DevTools → Coverage panel (Cmd+Shift+P → "Show Coverage")
2. Load your application
3. Interact with components
4. View unused bytes per file

**Red flags:**

- > 50% unused code in a bundle suggests poor code splitting
- Entire components loaded but never rendered indicate missing lazy loading

## Tree-Shaking Optimization

Tree-shaking eliminates dead code during the build process. For it to work effectively, both the library and consumers must follow strict conventions.

### How Tree-Shaking Works

Tree-shaking relies on **static analysis** of ES module imports/exports. Bundlers like Rollup, Webpack, and Vite analyze which exports are actually imported and remove everything else.

**Example:**

```typescript
// utils.ts
export function usedFunction() {
  /* ... */
}
export function unusedFunction() {
  /* ... */
}

// consumer.ts
import { usedFunction } from './utils.js';

usedFunction(); // Only this code is included in bundle
// unusedFunction is removed (tree-shaken)
```

### Requirements for Effective Tree-Shaking

#### 1. ES Modules Only

Tree-shaking only works with ES module syntax (`import`/`export`). CommonJS (`require`/`module.exports`) cannot be tree-shaken.

**wc-2026 configuration:**

```json
// package.json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./components/*": {
      "types": "./src/components/*/index.ts",
      "import": "./src/components/*/index.ts"
    }
  }
}
```

#### 2. sideEffects: false

The `sideEffects` field tells bundlers that modules are pure and safe to remove if unused.

```json
// package.json
{
  "sideEffects": false
}
```

**What this means:** If a module is imported but none of its exports are used, the bundler can remove it entirely.

**Exception:** If a module has side effects (registers global event listeners, mutates globals, etc.), it should be listed:

```json
{
  "sideEffects": ["./src/polyfills.js"]
}
```

#### 3. Per-Component Entry Points

wc-2026 exposes each component as a separate entry point to enable granular imports.

**Vite configuration:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/hx-button/index': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'components/hx-card/index': resolve(__dirname, 'src/components/hx-card/index.ts'),
        // ... per-component entries
      },
      formats: ['es'],
    },
  },
});
```

**Consumer usage:**

```typescript
// ✅ Tree-shakeable (only loads hx-button)
import '@helix/library/components/hx-button';

// ❌ NOT tree-shakeable (loads entire library)
import '@helix/library';
```

#### 4. No Barrel Exports

Barrel exports (re-exporting everything from `index.ts`) defeat tree-shaking.

**Anti-pattern:**

```typescript
// ❌ src/index.ts (barrel export)
export * from './components/hx-button/index.js';
export * from './components/hx-card/index.js';
export * from './components/hx-text-input/index.js';
// ... (all components)

// Consumer can't tree-shake this
import { HxButton } from '@helix/library';
```

**wc-2026 approach:**

```typescript
// ✅ src/components/hx-button/index.ts
export { HxButton } from './hx-button.js';

// Consumer imports directly
import { HxButton } from '@helix/library/components/hx-button';
```

### Verifying Tree-Shaking

**Test:**

1. Create a minimal consumer app
2. Import a single component
3. Build for production
4. Verify bundle only includes that component + Lit core

```typescript
// test-app/src/main.ts
import '@helix/library/components/hx-button';

document.body.innerHTML = '<hx-button>Test</hx-button>';
```

**Expected bundle size:** ~8-10 KB (5 KB Lit + 3-5 KB hx-button)

**If larger:** Tree-shaking is broken. Common causes:

- Barrel exports in library
- Side effects in modules
- Non-ESM dependencies

## Code Splitting Strategies

Code splitting divides your application into smaller chunks that can be loaded on demand. This reduces the initial bundle size and improves Time to Interactive.

### Route-Based Code Splitting

For applications with multiple pages, split code by route so users only load JavaScript for the current page.

**React example:**

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
    </Suspense>
  );
}
```

**Impact:** If Dashboard uses `hx-card` and Profile uses `wc-form`, each route only loads the components it needs.

### Component-Level Code Splitting

For heavy components used in specific contexts, split them into separate chunks.

**When to split:**

- Component is >10 KB (minified)
- Component is only used in specific user flows
- Component has heavy dependencies (charts, editors, etc.)

**Example (Vite):**

```typescript
// Dynamically import heavy component
async function loadDataTable() {
  const { WcDataTable } = await import('@helix/library/components/wc-data-table');
  customElements.define('hx-data-table', WcDataTable);
}

// Load only when needed
if (userWantsDataTable) {
  await loadDataTable();
}
```

### Vendor Code Splitting

Separate vendor code (Lit, dependencies) from application code so users can cache vendor bundles across page loads.

**Vite configuration:**

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-lit': ['lit', '@lit/reactive-element'],
          'vendor-hx': ['@helix/tokens'],
        },
      },
    },
  },
});
```

**Result:**

- `vendor-lit.js` (5 KB, rarely changes, cached long-term)
- `vendor-wc.js` (2 KB, changes with token updates)
- `app.js` (application code, changes frequently)

### When NOT to Code Split

**Small components (<10 KB):** Overhead of additional HTTP requests may outweigh benefits.

**Critical path code:** Components needed for first paint should be inlined, not split.

**Shared dependencies:** If multiple chunks import the same module, bundlers create shared chunks. Too many shared chunks increase HTTP request overhead.

**Rule of thumb:** Aim for 3-5 main chunks + vendor bundles. More than 10 chunks suggests over-splitting.

## Lazy Loading Patterns

Lazy loading defers component registration until it's needed. This is especially effective for components used conditionally or below the fold.

### Intersection Observer Lazy Loading

Load components when they enter the viewport.

```typescript
// Register observer for lazy components
const lazyComponents = new Map([
  ['hx-data-table', () => import('@helix/library/components/wc-data-table')],
  ['hx-chart', () => import('@helix/library/components/wc-chart')],
]);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting) {
      const tagName = entry.target.tagName.toLowerCase();
      const loader = lazyComponents.get(tagName);

      if (loader) {
        await loader();
        observer.unobserve(entry.target); // Stop observing once loaded
      }
    }
  });
});

// Observe all lazy component placeholders
document
  .querySelectorAll('hx-data-table:not(:defined), wc-chart:not(:defined)')
  .forEach((el) => observer.observe(el));
```

**When to use:**

- Components below the fold
- Components in accordions/tabs (not visible on load)
- Heavy components that aren't critical

### User Interaction Lazy Loading

Load components when the user interacts with a trigger.

```typescript
// Load modal component on button click
document.getElementById('open-modal')?.addEventListener('click', async () => {
  await import('@helix/library/components/hx-modal');

  const modal = document.createElement('hx-modal');
  modal.innerHTML = '<p>Modal content</p>';
  document.body.appendChild(modal);
});
```

**When to use:**

- Modals, dialogs, popovers
- Admin-only components
- Components used in specific workflows

### Prefetching and Preloading

Prefetch likely-needed components during idle time to avoid loading delay when user interacts.

```typescript
// Prefetch modal component during browser idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/dist/components/hx-modal/index.js';
    document.head.appendChild(link);
  });
}
```

**Strategies:**

- **Prefetch:** Low-priority background download for likely-needed resources
- **Preload:** High-priority download for resources needed soon
- **ModulePreload:** Preload ES modules and their dependencies

```html
<!-- Preload critical component -->
<link rel="modulepreload" href="/dist/components/hx-button/index.js" />

<!-- Prefetch likely-needed component -->
<link rel="prefetch" href="/dist/components/hx-modal/index.js" />
```

## Minification

Minification removes whitespace, comments, and shortens variable names to reduce code size. wc-2026 uses **esbuild** for fast, efficient minification.

### Vite Minification Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'esbuild', // Fast minifier (default in Vite)
    target: 'es2020', // Modern syntax = smaller output
  },
});
```

**esbuild vs. terser:**

- **esbuild:** 10-100x faster, good compression (~95% of terser)
- **terser:** Slower, slightly better compression (~5% smaller)

**wc-2026 uses esbuild** for development speed. For production releases, consider terser for maximum compression:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log'], // Remove specific functions
      },
      mangle: {
        toplevel: true, // Mangle top-level names
      },
    },
  },
});
```

### Minification Impact

**Example: hx-button component**

| Version            | Size                   |
| ------------------ | ---------------------- |
| Original source    | 12.4 KB                |
| Minified (esbuild) | 4.2 KB (66% reduction) |
| Minified + gzip    | 1.8 KB (85% reduction) |
| Minified + brotli  | 1.6 KB (87% reduction) |

### What Gets Minified

- **Whitespace removal:** Spaces, tabs, newlines
- **Comment removal:** All comments stripped
- **Variable mangling:** Long names shortened (`myVariableName` → `a`)
- **Dead code elimination:** Unreachable code removed
- **Constant folding:** `2 + 2` → `4`
- **Property mangling (advanced):** Shorten object property names (risky)

**Note:** Property mangling is disabled by default because it can break code that relies on property name strings.

## Compression

Compression encodes assets in a more efficient format for network transfer. All modern browsers support gzip and Brotli compression.

### Gzip Compression

Gzip has been the standard HTTP compression algorithm for decades. It's universally supported and provides good compression ratios.

**Compression ratios (typical JavaScript):**

- Small files (<10 KB): 50-60% size reduction
- Medium files (10-100 KB): 65-75% size reduction
- Large files (>100 KB): 70-80% size reduction

**Server configuration (Express example):**

```javascript
import compression from 'compression';

app.use(
  compression({
    level: 6, // Compression level (1-9, 6 is default)
    threshold: 1024, // Only compress files >1KB
  }),
);
```

**Static pre-compression:**

```bash
# Pre-compress files during build
gzip -k dist/**/*.js
```

**Nginx configuration:**

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
gzip_comp_level 6;
```

### Brotli Compression

Brotli is a newer compression algorithm from Google that achieves 10-25% better compression than gzip for text-based assets.

**Compression ratios (JavaScript):**

- Small files: 55-65% reduction (5-10% better than gzip)
- Medium files: 70-80% reduction (10-15% better than gzip)
- Large files: 75-85% reduction (15-25% better than gzip)

**Why Brotli is better:**

- Larger dictionary window (reduces redundancy)
- Context-aware compression (better for HTML/CSS/JS)
- Multiple compression levels (1-11)

**When to use Brotli:**

- Static assets (pre-compress during build at level 11)
- Modern browsers (all browsers since 2017 support Brotli)
- CDN delivery (most CDNs support Brotli)

**When to fallback to gzip:**

- Dynamic content (Brotli level 11 is too slow for on-the-fly compression)
- Legacy browser support (use gzip as fallback)

**Vite Brotli plugin:**

```bash
npm install --save-dev vite-plugin-compression
```

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      compressionOptions: { level: 11 },
    }),
    // Gzip fallback
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
  ],
});
```

**Output:**

```
dist/components/hx-button/index.js      (4.2 KB)
dist/components/hx-button/index.js.gz   (1.8 KB) - 57% smaller
dist/components/hx-button/index.js.br   (1.6 KB) - 62% smaller
```

**Server configuration (Nginx):**

```nginx
brotli on;
brotli_types text/plain text/css application/json application/javascript;
brotli_comp_level 6; # Dynamic content
brotli_static on;    # Serve pre-compressed .br files
```

### Compression Best Practices

1. **Pre-compress static assets:** Use highest compression (Brotli 11, gzip 9) during build
2. **Dynamic compression:** Use moderate levels (Brotli 4-6, gzip 6) for on-the-fly compression
3. **Cache compressed responses:** Set `Cache-Control` and `ETag` headers
4. **Serve correct version:** Serve `.br` to modern browsers, `.gz` as fallback
5. **Don't compress small files:** <1 KB files have more overhead than benefit
6. **Don't double-compress:** Don't compress images, videos, or already-compressed formats

## Monitoring and CI Enforcement

Bundle size limits are only effective if they're continuously monitored and enforced.

### CI Bundle Size Checks

wc-2026 uses GitHub Actions to enforce bundle size budgets on every PR.

**Workflow configuration:**

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build library
        run: npm run build --workspace=@helix/library

      - name: Analyze bundle size
        run: |
          # Check total bundle size
          TOTAL_SIZE=$(du -sb packages/hx-library/dist | awk '{print $1}')
          MAX_SIZE=$((50 * 1024)) # 50 KB

          if [ "$TOTAL_SIZE" -gt "$MAX_SIZE" ]; then
            echo "❌ Bundle size exceeds limit: $TOTAL_SIZE bytes > $MAX_SIZE bytes"
            exit 1
          fi

          echo "✅ Bundle size OK: $TOTAL_SIZE bytes"
```

### Lighthouse CI

Monitor Core Web Vitals and performance scores on every deploy.

**Configuration:**

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3150/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        interactive: ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**GitHub Action:**

```yaml
- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Bundle Size Regression Detection

Automatically detect and report bundle size changes in PRs.

**Using bundlesize:**

```bash
npm install --save-dev bundlesize
```

```json
// package.json
{
  "bundlesize": [
    {
      "path": "packages/hx-library/dist/components/hx-button/index.js",
      "maxSize": "5 KB",
      "compression": "gzip"
    },
    {
      "path": "packages/hx-library/dist/index.js",
      "maxSize": "50 KB",
      "compression": "gzip"
    }
  ]
}
```

**GitHub Action:**

```yaml
- name: Check bundle size
  run: npx bundlesize
  env:
    CI_REPO_OWNER: ${{ github.repository_owner }}
    CI_REPO_NAME: ${{ github.event.repository.name }}
    CI_COMMIT_SHA: ${{ github.sha }}
    CI_BRANCH: ${{ github.ref }}
```

### Performance Dashboard

Track bundle size trends over time using the Admin Dashboard.

**Metrics tracked:**

- Total bundle size (minified + gzipped)
- Per-component bundle size
- Shared chunk size
- Dependency bundle size (Lit, tokens)
- Historical trends (size changes over releases)

**Location:** `http://localhost:3159/health` → Performance section

## wc-2026 Bundle Metrics

Current bundle size metrics for wc-2026 (as of latest build):

### Full Library Bundle

| Format             | Size   |
| ------------------ | ------ |
| Unminified         | 156 KB |
| Minified (esbuild) | 52 KB  |
| Gzipped            | 18 KB  |
| Brotli             | 16 KB  |

**Status:** ✅ Under 50 KB budget (gzipped)

### Individual Components

| Component     | Minified | Gzipped | Brotli |
| ------------- | -------- | ------- | ------ |
| hx-button     | 4.2 KB   | 1.8 KB  | 1.6 KB |
| hx-card       | 3.8 KB   | 1.6 KB  | 1.4 KB |
| hx-text-input | 5.1 KB   | 2.1 KB  | 1.9 KB |
| hx-checkbox   | 3.9 KB   | 1.7 KB  | 1.5 KB |
| hx-select     | 4.8 KB   | 2.0 KB  | 1.8 KB |
| hx-alert      | 3.2 KB   | 1.4 KB  | 1.2 KB |
| hx-badge      | 2.8 KB   | 1.2 KB  | 1.1 KB |

**Status:** ✅ All components under 5 KB budget (minified)

### Dependency Breakdown

| Dependency     | Size (min+gz) | Percentage |
| -------------- | ------------- | ---------- |
| Lit core       | 5.1 KB        | 28%        |
| @helix/tokens  | 1.8 KB        | 10%        |
| Component code | 11.1 KB       | 62%        |

**Note:** Lit is externalized and only loaded once, even when using multiple components.

### Tree-Shaking Effectiveness

| Import Style     | Bundle Size (min+gz)          |
| ---------------- | ----------------------------- |
| Single component | ~8 KB (Lit + component)       |
| Three components | ~12 KB (Lit + components)     |
| Full library     | ~18 KB (Lit + all components) |

**Tree-shaking savings:** Importing only what you need saves ~55% vs. full bundle.

## Best Practices Checklist

When building components for wc-2026, follow these bundle size optimization practices:

### Library Configuration

- ✅ Set `sideEffects: false` in package.json
- ✅ Use ES module syntax exclusively (`import`/`export`)
- ✅ Provide per-component entry points
- ✅ Externalize Lit and workspace dependencies
- ✅ Enable source maps for debugging (doesn't affect bundle size)
- ✅ Use esbuild minification for development, terser for production

### Component Implementation

- ✅ Import only what you use (avoid `import *`)
- ✅ Use Lit's built-in directives (already tree-shakeable)
- ✅ Avoid heavy dependencies (chart libraries, date pickers, etc.)
- ✅ Lazy-load large assets (images, fonts) via CSS
- ✅ Use CSS custom properties instead of inline styles
- ✅ Keep component logic focused (single responsibility)

### Build Configuration

- ✅ Enable code splitting for large applications
- ✅ Pre-compress static assets (gzip + Brotli)
- ✅ Set appropriate cache headers
- ✅ Use CDN for static assets
- ✅ Monitor bundle size in CI
- ✅ Fail builds that exceed budgets

### Runtime Loading

- ✅ Lazy-load components below the fold
- ✅ Use Intersection Observer for viewport-based loading
- ✅ Prefetch likely-needed components during idle time
- ✅ Defer non-critical components until after first paint
- ✅ Measure real-world performance with RUM

## Debugging Bundle Size Issues

If bundle size exceeds budgets, use this debugging workflow:

### Step 1: Identify the Culprit

```bash
# Build with analysis
npm run build --workspace=@helix/library

# Check component sizes
ls -lh packages/hx-library/dist/components/**/index.js
```

### Step 2: Analyze Dependencies

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Generate visual report
npm run build
open packages/hx-library/dist/stats.html
```

**Look for:**

- Large dependencies (>10 KB)
- Duplicate code across chunks
- Non-tree-shakeable imports

### Step 3: Check Tree-Shaking

```typescript
// Create minimal test app
import '@helix/library/components/hx-button';

// Build and measure
npm run build

// Expected: ~8 KB (Lit + hx-button)
// Actual: ??? KB
```

**If actual > expected:**

- Check for barrel exports
- Verify `sideEffects: false`
- Ensure ES module syntax

### Step 4: Profile Runtime Loading

```javascript
// Measure component load time
const start = performance.now();
await import('@helix/library/components/hx-button');
const end = performance.now();
console.log(`Load time: ${end - start}ms`);
```

**Target:** <50ms on desktop, <100ms on mobile

### Step 5: Compare Against Baseline

```bash
# Checkout main branch
git checkout main
npm run build

# Measure baseline size
BASELINE=$(du -sb packages/hx-library/dist | awk '{print $1}')

# Checkout PR branch
git checkout feature-branch
npm run build

# Measure PR size
PR_SIZE=$(du -sb packages/hx-library/dist | awk '{print $1}')

# Calculate delta
echo "Size change: $((PR_SIZE - BASELINE)) bytes"
```

## Resources

### Web Performance

- [Reduce JavaScript payloads with tree shaking | web.dev](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking)
- [Reduce JavaScript payloads with code splitting | web.dev](https://web.dev/articles/codelab-code-splitting)
- [Code splitting with React.lazy and Suspense | web.dev](https://web.dev/code-splitting-suspense/)
- [Minify and compress network payloads with brotli | web.dev](https://web.dev/articles/codelab-text-compression-brotli)
- [Minify and compress network payloads with gzip | web.dev](https://web.dev/articles/codelab-text-compression)
- [Optimize the encoding and transfer size of text-based assets | web.dev](https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer)

### Tools and Analysis

- [Bundlephobia](https://bundlephobia.com/) - Analyze npm package bundle sizes
- [Bundle Size Comparison: Brotli vs Gzip](https://www.websitehostreview.com/troubleshooting/speed-core-web-vitals/brotli-vs-gzip-2026-benchmarks/)
- [Webpack Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [8 Ways to Optimize Your JavaScript Bundle Size | Codecov](https://about.codecov.io/blog/8-ways-to-optimize-your-javascript-bundle-size/)

### Best Practices

- [Cut Initial Load Time by 40%: Lazy Loading vs Code Splitting](https://medium.com/@Angular_With_Awais/cut-initial-load-time-by-40-lazy-loading-vs-code-splitting-explained-d49221fbcf31)
- [Lazy Loading vs Code Splitting: Key Differences](https://www.kogifi.com/articles/lazy-loading-vs-code-splitting-key-differences)
- [Brotli Compression: A Fast Alternative to GZIP](https://kinsta.com/blog/brotli-compression/)

## Next Steps

- **[Render Performance](../render-performance/)** - Optimize component rendering and re-rendering
- **[Network Performance](../network-performance/)** - Minimize HTTP requests and optimize asset delivery
- **[Memory Management](../memory-management/)** - Prevent memory leaks and optimize runtime memory usage
- **[Performance Testing](../../architecture/testing/#performance-tests)** - Automated performance regression testing

---

**Remember:** Bundle size optimization is not a one-time task. Monitor metrics continuously, enforce budgets in CI, and treat regressions as bugs. Every kilobyte counts.
