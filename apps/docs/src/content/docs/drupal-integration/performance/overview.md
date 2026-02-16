---
title: Performance Optimization Strategies
description: Comprehensive guide to optimizing hx-library web components in Drupal CMS for enterprise healthcare performance standards.
sidebar:
  order: 46
---

Performance is not optional in healthcare applications. When patient care workflows depend on your interface, every millisecond of delay represents potential clinical impact. This guide provides enterprise-grade performance optimization strategies for deploying hx-library web components in Drupal 10 and 11 environments.

## Performance Philosophy

### Healthcare Performance Standards

Healthcare applications operate under stricter performance requirements than general web applications:

- **Sub-second page loads**: Clinical workflows cannot tolerate lag
- **Low bandwidth resilience**: Rural healthcare facilities often have limited connectivity
- **Mobile performance**: Clinicians use tablets, smartphones, and mobile workstations
- **Accessibility performance**: Screen readers and assistive technology require fast, predictable rendering
- **Offline resilience**: Critical functionality must survive network interruptions

### Performance Budget

hx-library enforces strict performance budgets:

- **Per-component**: <5KB minified + gzipped
- **Full bundle**: <50KB minified + gzipped
- **Time to Interactive (TTI)**: <3 seconds on 3G networks
- **First Contentful Paint (FCP)**: <1.5 seconds
- **Largest Contentful Paint (LCP)**: <2.5 seconds

These budgets are enforced in CI/CD pipelines and monitored in production.

## Drupal Asset Aggregation

### Understanding Drupal's Asset Pipeline

Drupal provides built-in asset aggregation and optimization through its library system. When properly configured, Drupal automatically:

1. Combines multiple JavaScript files into aggregated bundles
2. Minifies CSS and JavaScript
3. Serves aggregated assets with far-future cache headers
4. Manages asset dependencies and load order

### Aggregation Configuration

Enable aggregation in Drupal's performance settings:

```php
// settings.php
$config['system.performance']['css']['preprocess'] = TRUE;
$config['system.performance']['js']['preprocess'] = TRUE;
```

Or via the admin UI:
**Configuration → Performance → Bandwidth Optimization → Aggregate CSS files / Aggregate JavaScript files**

### ES Module Aggregation Challenges

**Critical limitation**: Drupal's aggregation system was designed for traditional scripts, not ES modules. Web components require `type="module"`, which bypasses standard aggregation.

**Solution**: Use external aggregation tools or CDN-level bundling:

```yaml
# mytheme.libraries.yml
# ANTI-PATTERN: Individual module files (no aggregation)
hx-library-individual:
  js:
    dist/hx-button.js: { attributes: { type: module } }
    dist/hx-card.js: { attributes: { type: module } }
    dist/hx-alert.js: { attributes: { type: module } }

# RECOMMENDED: Pre-bundled modules
hx-library-bundled:
  js:
    dist/hx-library.bundle.js: { attributes: { type: module } }
  dependencies:
    - core/once
```

### Conditional Loading per Page

Load only the components needed for each page:

```yaml
# mytheme.libraries.yml
hx-forms:
  js:
    dist/hx-forms.bundle.js: { attributes: { type: module } }

hx-content:
  js:
    dist/hx-content.bundle.js: { attributes: { type: module } }

hx-navigation:
  js:
    dist/hx-navigation.bundle.js: { attributes: { type: module } }
```

Attach libraries conditionally in templates:

```twig
{# node--patient-form.html.twig #}
{{ attach_library('mytheme/hx-forms') }}

<form method="post" action="{{ form_action }}">
  <hx-text-input name="patient_name" label="Patient Name"></hx-text-input>
  <hx-select name="department" label="Department"></hx-select>
  <hx-button type="submit">Submit</hx-button>
</form>
```

Or programmatically in preprocess functions:

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $route_name = \Drupal::routeMatch()->getRouteName();

  // Load form components only on patient intake pages
  if (str_starts_with($route_name, 'entity.patient.intake_form')) {
    $variables['#attached']['library'][] = 'mytheme/hx-forms';
  }

  // Load content components on display pages
  if (str_starts_with($route_name, 'entity.patient.canonical')) {
    $variables['#attached']['library'][] = 'mytheme/hx-content';
  }
}
```

### Dynamic Library Attachment in Controllers

For custom routes and controllers:

```php
namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;

class PatientDashboardController extends ControllerBase {

  public function dashboard() {
    return [
      '#theme' => 'patient_dashboard',
      '#attached' => [
        'library' => [
          'mytheme/hx-content',
          'mytheme/hx-navigation',
        ],
      ],
      '#patient' => $this->loadPatient(),
    ];
  }
}
```

## Compression and Transfer Optimization

### Gzip and Brotli Compression

Modern browsers support Brotli compression, which achieves 15-20% better compression than gzip for web assets.

**Apache configuration**:

```apache
# Enable Brotli compression
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/xml text/css text/javascript application/javascript application/json application/wasm
  BrotliCompressionQuality 6
</IfModule>

# Fallback to Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/wasm
</IfModule>
```

**Nginx configuration**:

```nginx
# Enable Brotli compression
brotli on;
brotli_comp_level 6;
brotli_types text/html text/plain text/xml text/css text/javascript application/javascript application/json application/wasm;

# Fallback to Gzip
gzip on;
gzip_comp_level 6;
gzip_types text/html text/plain text/xml text/css text/javascript application/javascript application/json application/wasm;
```

### Pre-Compression for Static Assets

Pre-compress assets during build time for maximum performance:

```bash
# Generate .br and .gz versions of all assets
find dist -type f \( -name "*.js" -o -name "*.css" \) -exec brotli -f {} \;
find dist -type f \( -name "*.js" -o -name "*.css" \) -exec gzip -f -k {} \;
```

Configure web server to serve pre-compressed files:

```nginx
# Nginx configuration for pre-compressed Brotli
location ~* \.(js|css)$ {
  brotli_static on;
  gzip_static on;
}
```

```apache
# Apache with mod_rewrite for pre-compressed files
<IfModule mod_rewrite.c>
  RewriteCond %{HTTP:Accept-Encoding} br
  RewriteCond %{REQUEST_FILENAME}.br -f
  RewriteRule ^(.*)$ $1.br [L]

  RewriteCond %{HTTP:Accept-Encoding} gzip
  RewriteCond %{REQUEST_FILENAME}.gz -f
  RewriteRule ^(.*)$ $1.gz [L]
</IfModule>
```

### HTTP/2 and HTTP/3

HTTP/2 multiplexing eliminates the need for aggressive file concatenation. Multiple small files can be transferred in parallel without head-of-line blocking.

**Benefits for web components**:

- Load individual component modules in parallel
- Reduce initial bundle size by deferring unused components
- Enable granular browser caching per component

**Nginx HTTP/2 configuration**:

```nginx
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  # HTTP/2 push for critical components (optional)
  http2_push /dist/hx-library-core.bundle.js;
}
```

**Apache HTTP/2 configuration**:

```apache
Protocols h2 h2c http/1.1

# HTTP/2 push for critical components (optional)
<Location />
  Header add Link "</dist/hx-library-core.bundle.js>; rel=preload; as=script"
</Location>
```

## Lazy Loading Strategies

### Component-Level Lazy Loading

Load web components only when they enter the viewport using the Intersection Observer API:

```javascript
/**
 * Drupal behavior for lazy-loading web components.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxLazyLoad = {
    attach(context) {
      // Define components that should be lazy-loaded
      const lazyComponents = ['hx-card', 'hx-accordion', 'hx-tabs'];

      // Create intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const componentTag = element.tagName.toLowerCase();

              // Trigger component definition loading
              if (!customElements.get(componentTag)) {
                import(`/dist/components/${componentTag}.js`);
              }

              // Stop observing once loaded
              observer.unobserve(element);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before viewport
        },
      );

      // Observe all lazy-loadable components
      lazyComponents.forEach((tag) => {
        once('hx-lazy-load', tag, context).forEach((element) => {
          observer.observe(element);
        });
      });
    },
  };
})(Drupal, once);
```

### Route-Based Code Splitting

Load component bundles based on route patterns:

```javascript
/**
 * Implements hook_preprocess_page() for route-based loading.
 */
function mytheme_preprocess_page(&$variables) {
  $route_name = \Drupal::routeMatch()->getRouteName();
  $variables['#cache']['contexts'][] = 'route.name';

  // Map routes to component bundles
  $route_library_map = [
    'entity.patient.intake_form' => 'mytheme/hx-forms',
    'entity.patient.canonical' => 'mytheme/hx-content',
    'view.patients.page_list' => 'mytheme/hx-tables',
    'entity.appointment.schedule' => 'mytheme/hx-scheduling',
  ];

  foreach ($route_library_map as $route_pattern => $library) {
    if (str_starts_with($route_name, $route_pattern)) {
      $variables['#attached']['library'][] = $library;
    }
  }
}
```

### Defer and Async Loading

For non-critical components, use `defer` or dynamic `import()`:

```yaml
# mytheme.libraries.yml
hx-analytics:
  js:
    dist/hx-analytics.bundle.js:
      attributes:
        type: module
        defer: true
```

Or load dynamically after page load:

```javascript
(function (Drupal) {
  'use strict';

  Drupal.behaviors.hxAnalyticsLoader = {
    attach(context, settings) {
      // Load analytics components after initial render
      if (context === document) {
        window.addEventListener('load', () => {
          import('/dist/hx-analytics.bundle.js');
        });
      }
    },
  };
})(Drupal);
```

## Drupal Caching Strategies

### Render Cache for Component-Heavy Pages

Drupal's render cache stores rendered output, eliminating expensive re-rendering:

```php
/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(&$variables) {
  $node = $variables['node'];

  // Cache rendered component output
  $variables['#cache'] = [
    'keys' => ['node', $node->id(), 'hx-components'],
    'contexts' => ['url.path', 'user.permissions'],
    'tags' => $node->getCacheTags(),
    'max-age' => 3600, // 1 hour
  ];
}
```

### Component-Level Caching

Cache individual component render arrays:

```php
/**
 * Build a cacheable patient card component.
 */
function build_patient_card($patient) {
  return [
    '#type' => 'html_tag',
    '#tag' => 'hx-card',
    '#attributes' => [
      'variant' => 'elevated',
      'patient-id' => $patient->id(),
    ],
    '#value' => $patient->label(),
    '#cache' => [
      'keys' => ['hx-card', 'patient', $patient->id()],
      'contexts' => ['user.permissions'],
      'tags' => $patient->getCacheTags(),
      'max-age' => 1800, // 30 minutes
    ],
  ];
}
```

### BigPipe for Progressive Enhancement

Drupal's BigPipe module streams placeholder content first, then replaces with actual components:

```php
/**
 * Use BigPipe for expensive patient data queries.
 */
function build_patient_dashboard($patient_id) {
  return [
    '#type' => 'html_tag',
    '#tag' => 'hx-card',
    '#attributes' => ['class' => ['patient-summary']],
    '#value' => 'Loading...',
    '#lazy_builder' => [
      'my_module.patient_builder:buildCard',
      [$patient_id],
    ],
    '#create_placeholder' => TRUE,
  ];
}
```

### Cache Tags for Invalidation

Properly tag component caches for automatic invalidation:

```php
$render_array = [
  '#type' => 'html_tag',
  '#tag' => 'hx-patient-list',
  '#cache' => [
    'tags' => [
      'patient_list',
      'node_list:patient',
      'config:views.view.patients',
    ],
  ],
];
```

Invalidate when data changes:

```php
use Drupal\Core\Cache\Cache;

// Invalidate patient list caches when patient is updated
Cache::invalidateTags(['patient_list', 'node:' . $patient->id()]);
```

## CDN Integration

### CDN-Hosted Component Bundles

Serve hx-library from a CDN for global edge caching:

```yaml
# mytheme.libraries.yml
hx-library-cdn:
  js:
    https://cdn.example.com/@hx-library/3.2.1/dist/hx-library.bundle.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
        integrity: sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxQ...
```

**Benefits**:

- Reduced origin server load
- Global edge caching (millisecond latency worldwide)
- Browser cache sharing across domains
- Automatic HTTP/2 and HTTP/3 support

**Drawbacks**:

- Requires SRI (Subresource Integrity) for security
- Cannot use Drupal's aggregation system
- Additional DNS lookup and TLS handshake (mitigated by `dns-prefetch`)

### DNS Prefetch and Preconnect

Optimize CDN latency with resource hints:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'dns-prefetch',
    'href' => 'https://cdn.example.com',
  ];

  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'preconnect',
    'href' => 'https://cdn.example.com',
    'crossorigin' => 'anonymous',
  ];
}
```

### Module Preloading

Preload critical component bundles for faster initial render:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'modulepreload',
    'href' => '/dist/hx-library-core.bundle.js',
  ];
}
```

### Private CDN with Origin Shield

For enterprise deployments, use a private CDN with origin shield:

```
User → Edge CDN (Cloudflare/Fastly/Akamai)
        ↓ (cache miss)
      Origin Shield (regional cache)
        ↓ (cache miss)
      Drupal Origin Server
```

**Benefits**:

- Reduces load on origin server
- Collapses redundant requests during cache invalidation
- Provides DDoS protection
- Enables advanced caching rules (stale-while-revalidate, stale-if-error)

## Performance Budgets and Monitoring

### Enforcing Bundle Size Budgets

Use Vite build analysis to enforce per-component budgets:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split each component into separate chunks
          if (id.includes('hx-button')) return 'hx-button';
          if (id.includes('hx-card')) return 'hx-card';
          if (id.includes('hx-alert')) return 'hx-alert';
        },
      },
    },
  },
  plugins: [
    visualizer({
      filename: 'dist/bundle-analysis.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

Enforce budgets in CI:

```bash
#!/bin/bash
# scripts/check-bundle-size.sh

MAX_COMPONENT_SIZE=5120  # 5KB in bytes
MAX_TOTAL_SIZE=51200     # 50KB in bytes

for file in dist/hx-*.js; do
  size=$(gzip -c "$file" | wc -c)

  if [ "$size" -gt "$MAX_COMPONENT_SIZE" ]; then
    echo "ERROR: $file exceeds 5KB budget (${size} bytes)"
    exit 1
  fi
done

total_size=$(find dist -name "*.js" -exec gzip -c {} \; | wc -c)

if [ "$total_size" -gt "$MAX_TOTAL_SIZE" ]; then
  echo "ERROR: Total bundle exceeds 50KB budget (${total_size} bytes)"
  exit 1
fi

echo "✓ All bundles within performance budget"
```

### Real User Monitoring (RUM)

Implement RUM using PerformanceObserver API:

```javascript
/**
 * Drupal behavior for Real User Monitoring.
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.hxPerformanceMonitoring = {
    attach(context, settings) {
      if (context !== document || !('PerformanceObserver' in window)) {
        return;
      }

      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Send LCP to analytics
        if (lastEntry.renderTime > 2500) {
          console.warn('LCP exceeds 2.5s threshold:', lastEntry.renderTime);
        }

        // Send to backend analytics
        fetch('/api/metrics/lcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: lastEntry.renderTime,
            url: window.location.pathname,
          }),
        });
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.processingStart - entry.startTime > 100) {
            console.warn('FID exceeds 100ms threshold:', entry.processingStart - entry.startTime);
          }
        });
      });

      fidObserver.observe({ type: 'first-input', buffered: true });

      // Monitor Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }

        if (clsScore > 0.1) {
          console.warn('CLS exceeds 0.1 threshold:', clsScore);
        }
      });

      clsObserver.observe({ type: 'layout-shift', buffered: true });
    },
  };
})(Drupal);
```

### Lighthouse CI Integration

Automate Lighthouse performance audits in CI/CD:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npm run build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:8080/patient-intake
            http://localhost:8080/patient-list
            http://localhost:8080/appointment-schedule
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

**lighthouse-budget.json**:

```json
{
  "performance": 90,
  "accessibility": 100,
  "best-practices": 90,
  "seo": 90,
  "resourceSummary": {
    "script": {
      "requestCount": 10,
      "size": 51200
    },
    "stylesheet": {
      "requestCount": 3,
      "size": 20480
    }
  }
}
```

### Drupal Performance Module Integration

Use Drupal's Performance module to monitor web component rendering:

```php
/**
 * Track web component render performance.
 */
function mytheme_preprocess_page(&$variables) {
  $start = microtime(TRUE);

  // Component rendering logic
  $variables['hx_components'] = build_hx_components();

  $duration = microtime(TRUE) - $start;

  // Log if rendering exceeds threshold
  if ($duration > 0.1) {
    \Drupal::logger('performance')->warning('Slow component render: @duration ms', [
      '@duration' => round($duration * 1000, 2),
    ]);
  }
}
```

## Real-World Optimization Examples

### Example 1: Optimizing Patient List Page

**Before**: 850KB bundle, 4.2s TTI

**Problem**: Loading all components upfront, including unused scheduling and form components.

**Solution**:

```php
/**
 * Load only patient list components.
 */
function mytheme_preprocess_page__patient_list(&$variables) {
  // Remove global component library
  if (isset($variables['#attached']['library'])) {
    $key = array_search('mytheme/hx-library-all', $variables['#attached']['library']);
    if ($key !== FALSE) {
      unset($variables['#attached']['library'][$key]);
    }
  }

  // Attach only patient list components
  $variables['#attached']['library'][] = 'mytheme/hx-content';
  $variables['#attached']['library'][] = 'mytheme/hx-navigation';
}
```

```yaml
# mytheme.libraries.yml
hx-content:
  js:
    dist/hx-content.bundle.js:
      attributes:
        type: module
  version: 1.0.0
```

**After**: 125KB bundle, 1.8s TTI (85% reduction)

### Example 2: Optimizing Form-Heavy Pages

**Before**: Blocking form validation library, 3.5s FCP

**Solution**: Defer validation until first interaction

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxFormValidation = {
    attach(context) {
      once('hx-form-validation', 'hx-form', context).forEach((form) => {
        // Lazy-load validation library on first focus
        form.addEventListener(
          'focusin',
          () => {
            import('/dist/hx-validation.bundle.js').then((module) => {
              module.enableValidation(form);
            });
          },
          { once: true },
        );
      });
    },
  };
})(Drupal, once);
```

**After**: 2.1s FCP, validation loads on-demand (40% improvement)

### Example 3: CDN + Local Hybrid Strategy

**Problem**: CDN reduces latency but increases deployment complexity.

**Solution**: Use CDN for stable core, local builds for custom components

```yaml
# mytheme.libraries.yml
hx-library-core:
  js:
    https://cdn.example.com/@hx-library/3.2.1/dist/hx-library-core.bundle.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
        integrity: sha384-ABC123...
  version: 3.2.1

hx-custom-components:
  js:
    dist/custom-components.bundle.js:
      attributes:
        type: module
  dependencies:
    - mytheme/hx-library-core
  version: VERSION
```

**Benefits**:

- Core library cached globally via CDN
- Custom components versioned independently
- Fastest possible load for standard components

## Troubleshooting Slow Pages

### Diagnosis: Waterfall Analysis

Use browser DevTools Network tab to identify bottlenecks:

1. **Long TTFB (Time to First Byte)**:
   - **Cause**: Slow Drupal render or database queries
   - **Fix**: Enable render cache, optimize database queries, enable Redis/Memcached

2. **Sequential module loading**:
   - **Cause**: Missing HTTP/2, modules not loading in parallel
   - **Fix**: Enable HTTP/2, use `<link rel="modulepreload">`

3. **Large bundle sizes**:
   - **Cause**: Loading unused components
   - **Fix**: Implement route-based code splitting

4. **Render-blocking resources**:
   - **Cause**: Synchronous scripts in `<head>`
   - **Fix**: Use `defer`, move scripts to bottom, or use ES modules (deferred by default)

### Common Anti-Patterns

**ANTI-PATTERN: Loading entire library on every page**

```yaml
# DON'T DO THIS
hx-library:
  js:
    dist/hx-library-all.bundle.js: { attributes: { type: module } }
```

**SOLUTION: Route-specific bundles**

```yaml
# DO THIS
hx-forms:
  js:
    dist/hx-forms.bundle.js: { attributes: { type: module } }

hx-content:
  js:
    dist/hx-content.bundle.js: { attributes: { type: module } }
```

**ANTI-PATTERN: Inline component definitions**

```twig
{# DON'T: Inline component code in Twig #}
<script type="module">
  import { HxButton } from '/dist/hx-button.js';
  customElements.define('hx-button', HxButton);
</script>
```

**SOLUTION: Library-based loading**

```twig
{# DO: Attach library in preprocess or template #}
{{ attach_library('mytheme/hx-forms') }}
<hx-button>Click Me</hx-button>
```

**ANTI-PATTERN: Synchronous font loading**

```css
/* DON'T: Blocks rendering */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700');
```

**SOLUTION: Async font loading**

```html
<!-- DO: Non-blocking font load -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
/>
```

### Performance Debugging Tools

**Drupal Devel Module**:

```php
// Enable query logging
$settings['devel_query_log'] = TRUE;

// Log slow queries
$settings['database']['default']['default']['log_slow_queries'] = TRUE;
```

**WebPageTest for multi-region testing**:

```bash
# Test from multiple geographic locations
curl "https://www.webpagetest.org/runtest.php?url=https://example.com/patient-list&location=Dulles:Chrome&runs=3&f=json&k=YOUR_API_KEY"
```

**Chrome DevTools Performance profiling**:

1. Open DevTools → Performance
2. Start recording
3. Navigate to target page
4. Stop recording
5. Analyze:
   - Scripting time (component initialization)
   - Rendering time (Shadow DOM construction)
   - Painting time (CSS custom property resolution)

## CI/CD Performance Enforcement

### GitHub Actions Performance Gate

```yaml
# .github/workflows/performance-gate.yml
name: Performance Gate

on:
  pull_request:
    paths:
      - 'packages/hx-library/**'
      - 'apps/docs/**'

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build library
        run: npm run build

      - name: Check bundle sizes
        run: |
          chmod +x scripts/check-bundle-size.sh
          ./scripts/check-bundle-size.sh

      - name: Comment PR with bundle sizes
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const sizes = fs.readFileSync('dist/bundle-sizes.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Bundle Size Report\n\n${sizes}`
            });
```

### Pre-Deployment Performance Checks

```bash
#!/bin/bash
# scripts/pre-deployment-check.sh

echo "Running pre-deployment performance checks..."

# 1. Bundle size check
npm run build
./scripts/check-bundle-size.sh

# 2. Lighthouse CI audit
npm run lighthouse:ci

# 3. Load time simulation (3G network)
npx lighthouse https://staging.example.com \
  --throttling.rttMs=300 \
  --throttling.throughputKbps=1638.4 \
  --throttling.cpuSlowdownMultiplier=4 \
  --only-categories=performance \
  --min-score=85

# 4. Check for unminified code
if grep -r "console.log" dist/; then
  echo "ERROR: Found console.log statements in production build"
  exit 1
fi

echo "✓ All performance checks passed"
```

## Conclusion

Performance optimization in healthcare environments is a continuous, multi-layered effort. By combining Drupal's built-in caching and aggregation with modern web component best practices—lazy loading, code splitting, CDN distribution, and strict performance budgets—you can deliver enterprise-grade experiences that meet clinical workflow demands.

### Checklist for Production Deployments

- [ ] Enable Drupal CSS/JS aggregation
- [ ] Configure gzip and Brotli compression
- [ ] Implement route-based code splitting
- [ ] Set up CDN with SRI for static assets
- [ ] Enable HTTP/2 or HTTP/3
- [ ] Configure render caching with appropriate cache contexts and tags
- [ ] Implement lazy loading for below-fold components
- [ ] Set up Real User Monitoring (RUM)
- [ ] Run Lighthouse CI in pull requests
- [ ] Enforce bundle size budgets in CI/CD
- [ ] Test on 3G network conditions
- [ ] Verify performance on mobile devices
- [ ] Document performance baselines and budgets
- [ ] Set up alerting for performance regressions

### Performance Resources

- [Drupal Performance Best Practices](https://www.drupal.org/docs/administering-a-drupal-site/performance-optimization)
- [Web.dev Performance Patterns](https://web.dev/patterns/web-vitals-patterns/)
- [MDN: Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [HTTP/2 Server Push Best Practices](https://web.dev/performance-http2/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)

Performance is a feature. Treat it as one.
