---
title: CDN Installation
description: Installing HELIX web components via CDN for Drupal integration
sidebar:
  order: 3
---

CDN installation is the fastest way to add HELIX web components to your Drupal site. This method requires no build pipeline, no npm dependencies, and no local compilation—just a library definition in your theme and you're ready to use components in TWIG templates.

This guide covers everything from basic setup to production-grade CDN strategies including version pinning, fallback patterns, caching optimization, and security considerations.

---

## When to Use CDN Installation

**Best for:**

- **Rapid prototyping** — Get components running in minutes without tooling setup
- **Small to medium sites** — 1-5 sites that don't require custom component builds
- **Simple themes** — Themes without existing JavaScript build pipelines
- **Third-party themes** — Adding components to contrib themes you don't maintain
- **Quick wins** — Demonstrating component library value before committing to npm workflow

**Not ideal for:**

- **Large-scale deployments** — Enterprise multi-site setups (use npm + build pipeline)
- **Offline development** — Environments without internet access (use local npm install)
- **Heavily customized components** — If you need to modify component source code
- **Strict CSP policies** — Environments that block external script sources

---

## CDN Installation Overview

HELIX components are distributed as ES modules via public CDNs (unpkg, jsDelivr). Drupal loads the library as an external JavaScript asset using the Libraries API, then components become available in all TWIG templates and Drupal Behaviors.

**Flow:**

1. Define external library in `*.libraries.yml`
2. Attach library to theme or specific pages
3. CDN delivers ES module bundle to browser
4. Browser registers custom elements (`<hx-button>`, `<hx-card>`, etc.)
5. TWIG templates render components as standard HTML tags

**File structure:**

```
web/themes/custom/mytheme/
├── mytheme.info.yml          # Theme definition
├── mytheme.libraries.yml     # Library definitions (YOU ADD CDN HERE)
└── templates/                # TWIG template overrides
    └── node--article.html.twig
```

---

## Step 1: Create Library Definition

Drupal's Libraries API loads external assets via `*.libraries.yml` files. Create or edit your theme's library definition file:

### Basic CDN Library (jsDelivr)

**File:** `mytheme.libraries.yml`

```yaml
# mytheme.libraries.yml

helix-components:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

**Explanation:**

- `helix-components` — Library machine name (use in TWIG: `{{ attach_library('mytheme/helix-components') }}`)
- `version: 0.0.1` — Drupal library version (for cache busting; increment when you change config)
- `type: external` — Tells Drupal this is an external URL, not a local file
- `attributes.type: module` — Critical: marks script as ES module (required for Lit components)

### Alternative: unpkg CDN

```yaml
helix-components:
  version: 0.0.1
  js:
    https://unpkg.com/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

Both jsDelivr and unpkg are reliable, fast, and provide automatic npm-to-CDN publishing.

---

## Step 2: Attach Library to Theme

To make components available site-wide, attach the library globally in your theme's `.info.yml` file:

**File:** `mytheme.info.yml`

```yaml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/helix-components # Loaded on every page
```

**Result:** All TWIG templates and Drupal Behaviors now have access to `<hx-button>`, `<hx-card>`, etc.

### Alternative: Conditional Attachment

For performance-sensitive sites, attach the library only where needed:

**File:** `templates/node--article.html.twig`

```twig
{# Attach library only on Article nodes #}
{{ attach_library('mytheme/helix-components') }}

<article>
  <hx-card variant="featured" elevation="raised">
    <span slot="heading">{{ node.title.value }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

**File:** `templates/page.html.twig`

```twig
{# Attach library on specific page types #}
{% if node.bundle == 'article' or node.bundle == 'landing_page' %}
  {{ attach_library('mytheme/helix-components') }}
{% endif %}

{{ page.content }}
```

---

## Step 3: Verify Installation

After attaching the library, verify components render correctly.

### Test Template

**File:** `templates/block--system-main.html.twig`

```twig
{{ attach_library('mytheme/helix-components') }}

{# Test button component #}
<hx-button variant="primary" size="lg">
  Test Button
</hx-button>

{# Test card component #}
<hx-card variant="featured">
  <span slot="heading">Installation Test</span>
  <p>If you see this card with styling, HELIX is loaded correctly.</p>
</hx-card>

{{ content }}
```

### Browser DevTools Check

1. **Open browser DevTools** (F12 or Cmd+Option+I)
2. **Check Console** — Should see no errors related to `@helixui/library`
3. **Inspect Elements** — `<hx-button>` should have Shadow DOM attached
4. **Network Tab** — Verify CDN request succeeded (status 200)

**What to look for:**

```html
<!-- Before Lit hydration -->
<hx-button variant="primary">Test Button</hx-button>

<!-- After Lit hydration (Shadow DOM present) -->
<hx-button variant="primary">
  #shadow-root (open)
  <button part="button" class="button button--primary">
    <slot></slot>
  </button>
  Test Button
</hx-button>
```

If Shadow DOM appears, installation is successful.

---

## Version Pinning Strategies

CDN URLs support flexible version targeting. Choose the strategy that matches your stability requirements.

### Strategy 1: Exact Version (Production Recommended)

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

**Pros:**

- Guaranteed stability (no surprise updates)
- Predictable behavior across deployments
- Cacheable (same URL = same content forever)

**Cons:**

- Manual updates required
- Miss automatic bug fixes and security patches

**Use when:** Production sites, healthcare/regulated industries, mission-critical applications.

### Strategy 2: Minor Version Range

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@^0.0/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

**Pros:**

- Automatic patch updates (0.0.1 → 0.0.2)
- Inherits bug fixes without manual updates

**Cons:**

- Potential breaking changes if semver violated
- Harder to debug "it worked yesterday" issues

**Use when:** Development sites, staging environments, low-risk projects.

### Strategy 3: Latest (Development Only)

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

**Pros:**

- Always on cutting edge
- No update burden

**Cons:**

- Breaking changes can hit production
- Cache invalidation issues
- Impossible to reproduce bugs

**Use when:** Local development only. **NEVER use in production.**

### Recommended: Exact Versions with Update Process

**Production:**

```yaml
helix-components:
  version: 0.0.1 # Drupal library version
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

**Update workflow:**

1. Test new version in staging: change URL to `@0.0.2`
2. Run QA suite (visual regression, accessibility tests)
3. If tests pass, update production `libraries.yml`
4. Increment Drupal library `version: 0.0.2` to bust Drupal's internal cache
5. Clear Drupal caches: `drush cr`

---

## CDN Providers Comparison

### jsDelivr (Recommended)

**URL format:**

```
https://cdn.jsdelivr.net/npm/@helixui/library@{version}/dist/helix.bundled.js
```

**Features:**

- Multi-CDN (Cloudflare, Fastly, CloudFront)
- 99.9% uptime SLA
- China-friendly (works without VPN)
- ESM support (serves correct MIME types)

**Example:**

```yaml
helix-cdn:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

### unpkg

**URL format:**

```
https://unpkg.com/@helixui/library@{version}/dist/helix.bundled.js
```

**Features:**

- Fast, reliable (backed by Cloudflare)
- Automatic npm publishing (no delay)
- Smaller provider (higher risk of downtime)

**Example:**

```yaml
helix-cdn:
  js:
    https://unpkg.com/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

### esm.sh

**URL format:**

```
https://esm.sh/@helixui/library@{version}
```

**Features:**

- Advanced ESM optimization
- Automatic dependency resolution
- Smaller bundle sizes (dead code elimination)

**Example:**

```yaml
helix-cdn:
  js:
    https://esm.sh/@helixui/library@0.0.1:
      type: external
      attributes:
        type: module
```

**Recommendation:** Use **jsDelivr** for production (best uptime + China support). Use **unpkg** for development (fastest npm sync).

---

## Caching Strategies

CDNs cache assets aggressively. Drupal also caches library definitions. Understand both layers to avoid stale code.

### CDN-Level Caching

**How it works:**

- CDNs cache by exact URL
- Versioned URLs (`@0.0.1`) cache forever (immutable)
- Unversioned URLs (`@latest`) cache with TTL (5-60 minutes)

**Cache headers (jsDelivr):**

```
Cache-Control: public, max-age=31536000, immutable
```

**Result:** Once a browser fetches `@0.0.1`, it NEVER refetches (perfect for performance).

### Drupal-Level Caching

**How it works:**

- Drupal caches library definitions in database
- `libraries.yml` changes require cache clear
- Drupal adds `?v={library_version}` query string to URLs

**Force cache clear:**

```bash
drush cr  # Drupal 8/9/10/11
```

**Force browser refetch (change Drupal library version):**

```yaml
helix-components:
  version: 0.0.2 # Increment this
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

Drupal now serves:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js?v=0.0.2"
></script>
```

Browsers see different query string = new resource = fetch again.

### Best Practice: Version Lockstep

Keep Drupal library version in sync with HELIX version:

```yaml
helix-components:
  version: 0.0.1 # Matches HELIX version
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

When you upgrade HELIX, both versions change:

```yaml
helix-components:
  version: 0.0.2 # Updated
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.2/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

---

## Performance Optimization

CDN delivery is fast, but you can optimize further.

### 1. Preconnect to CDN Origin

Tell browsers to establish connection early:

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  header: true # Load in <head> for early download
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
```

**File:** `templates/html.html.twig` (override base theme)

```twig
<head>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  {{ page_top }}
  <head-placeholder token="{{ placeholder_token }}">
  <title>{{ head_title|safe_join(' | ') }}</title>
  <css-placeholder token="{{ placeholder_token }}">
  <js-placeholder token="{{ placeholder_token }}">
</head>
```

**Result:** Browser starts DNS lookup + TLS handshake immediately (saves 200-500ms).

### 2. Use Module Preload (Advanced)

For critical components, preload the module:

**File:** `templates/html.html.twig`

```twig
<head>
  <link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js" crossorigin>
  {{ page_top }}
  <!-- rest of head -->
</head>
```

**Result:** Browser downloads module before parser discovers script tag (saves 100-300ms on first load).

### 3. Conditional Loading (Tree-Shaking)

Load only components you use (reduces bundle size):

**File:** `mytheme.libraries.yml`

```yaml
helix-button:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/components/hx-button.js:
      type: external
      attributes:
        type: module

helix-card:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/components/hx-card.js:
      type: external
      attributes:
        type: module
```

**File:** `templates/node--article.html.twig`

```twig
{# Load only hx-card for articles #}
{{ attach_library('mytheme/helix-card') }}

<hx-card variant="featured">
  <span slot="heading">{{ node.title.value }}</span>
  {{ content.body }}
</hx-card>
```

**Trade-off:** Better performance (smaller payloads), but more complex library management.

---

## Fallback Patterns

CDNs can fail (outages, network issues, corporate firewalls). Implement fallbacks for resilience.

### Strategy 1: Local Fallback Script

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
    js/helix-fallback.js:
      attributes:
        type: module
```

**File:** `js/helix-fallback.js`

```javascript
// Check if CDN loaded
setTimeout(() => {
  if (!customElements.get('hx-button')) {
    console.warn('HELIX CDN failed, loading local fallback');
    import('/themes/custom/mytheme/libraries/helix/dist/helix.bundled.js');
  }
}, 1000);
```

**File structure:**

```
mytheme/
├── libraries/
│   └── helix/
│       └── dist/
│           └── helix.bundled.js  # Local copy (backup)
├── js/
│   └── helix-fallback.js
└── mytheme.libraries.yml
```

### Strategy 2: Multiple CDN Fallback (Aggressive)

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    # Try jsDelivr first
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        onerror: "this.onerror=null;this.remove();document.head.appendChild(Object.assign(document.createElement('script'),{type:'module',src:'https://unpkg.com/@helixui/library@0.0.1/dist/helix.bundled.js'}))"
```

**Result:** If jsDelivr fails, browser immediately tries unpkg.

**Note:** This pattern is aggressive and may cause double-loads in edge cases. Use only for critical production sites.

### Strategy 3: Graceful Degradation (No JS Fallback)

**File:** `templates/node--article.html.twig`

```twig
{{ attach_library('mytheme/helix-components') }}

{# Web component with fallback content #}
<hx-card variant="featured">
  <span slot="heading">{{ node.title.value }}</span>

  {# Fallback: visible if HELIX fails to load #}
  <noscript>
    <div class="card card--featured">
      <h2>{{ node.title.value }}</h2>
      {{ content.body }}
    </div>
  </noscript>

  {{ content.body }}
</hx-card>
```

**CSS:** `styles.css`

```css
/* Hide noscript content when JS loads */
hx-card:defined + noscript {
  display: none;
}
```

---

## Security Considerations

CDNs introduce third-party code execution. Mitigate risks with security headers.

### 1. Subresource Integrity (SRI)

Verify CDN delivers untampered files:

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        integrity: sha384-HASH_GOES_HERE
        crossorigin: anonymous
```

**Generate SRI hash:**

```bash
curl https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

**Result:** Browser rejects file if hash doesn't match (prevents CDN compromise attacks).

**Trade-off:** Must regenerate hash on every version update.

### 2. Content Security Policy (CSP)

Whitelist CDN domains in Drupal's CSP headers:

**File:** `settings.php` (Drupal 9/10/11)

```php
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  "'unsafe-inline'",  // Required for Drupal behaviors
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
];
```

**Alternative:** Use Security Kit module UI (admin/config/system/seckit).

**Result:** Browser blocks scripts from unauthorized CDNs.

### 3. CORS Headers

CDNs serve with CORS headers enabled. Verify in DevTools:

```
Access-Control-Allow-Origin: *
```

If missing, add `crossorigin` attribute:

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
```

---

## Complete Example: Production-Ready CDN Setup

**File:** `mytheme.info.yml`

```yaml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/helix-components
```

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  header: true # Load early
  js:
    # Primary CDN (jsDelivr)
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      minified: true
      attributes:
        type: module
        crossorigin: anonymous
    # Fallback checker
    js/helix-cdn-check.js:
      attributes:
        type: module
```

**File:** `js/helix-cdn-check.js`

```javascript
/**
 * HELIX CDN Fallback
 * Checks if CDN loaded successfully, falls back to local copy if not.
 */
setTimeout(() => {
  // Check if hx-button is registered (confirms HELIX loaded)
  if (!customElements.get('hx-button')) {
    console.warn('[HELIX] CDN failed, loading local fallback');

    // Load local backup
    import('/libraries/helix/dist/helix.bundled.js')
      .then(() => console.info('[HELIX] Local fallback loaded'))
      .catch((err) => console.error('[HELIX] Fallback failed:', err));
  }
}, 2000); // Wait 2s for CDN
```

**File:** `templates/html.html.twig`

```twig
<!DOCTYPE html>
<html{{ html_attributes }}>
<head>
  {# Preconnect to CDN for faster initial load #}
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">

  {# Preload critical component module #}
  <link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js" crossorigin>

  {{ page_top }}
  <head-placeholder token="{{ placeholder_token }}">
  <title>{{ head_title|safe_join(' | ') }}</title>
  <css-placeholder token="{{ placeholder_token }}">
  <js-placeholder token="{{ placeholder_token }}">
</head>
<body{{ attributes }}>
  {{ page_top }}
  {{ page }}
  {{ page_bottom }}
  <js-bottom-placeholder token="{{ placeholder_token }}">
</body>
</html>
```

**File:** `templates/node--article.html.twig`

```twig
{# Library already loaded globally via .info.yml #}

<article{{ attributes }}>
  <hx-card variant="featured" elevation="raised">
    <span slot="heading">{{ node.title.value }}</span>

    {# Progressive enhancement: content visible without JS #}
    {{ content.body }}

    <div slot="footer">
      <hx-button variant="secondary" href="{{ url('<front>') }}">
        Back to Home
      </hx-button>
    </div>
  </hx-card>
</article>
```

**File structure:**

```
web/themes/custom/mytheme/
├── mytheme.info.yml
├── mytheme.libraries.yml
├── js/
│   └── helix-cdn-check.js
├── libraries/
│   └── helix/
│       └── dist/
│           └── helix.bundled.js  # Local backup (copied from node_modules or CDN)
└── templates/
    ├── html.html.twig
    └── node--article.html.twig
```

---

## Testing CDN Installation

### 1. Clear All Caches

```bash
# Drupal cache
drush cr

# Browser cache (DevTools)
# Chrome: Cmd+Shift+R (hard reload)
# Firefox: Cmd+Shift+R
```

### 2. Verify Network Request

**DevTools → Network Tab:**

- Filter: `helix`
- Look for: `helix.bundled.js` from `cdn.jsdelivr.net`
- Status: `200 OK`
- Type: `script`
- Size: ~45KB (gzipped)

### 3. Check Custom Elements Registry

**DevTools → Console:**

```javascript
// Should return constructor function
customElements.get('hx-button');

// Should list all HELIX components
Array.from(document.querySelectorAll('*'))
  .filter((el) => el.tagName.startsWith('HX-'))
  .map((el) => el.tagName.toLowerCase());
// Expected: ['hx-button', 'hx-card', ...]
```

### 4. Inspect Shadow DOM

**DevTools → Elements:**

```html
<hx-button variant="primary">
  #shadow-root (open)
  <button part="button" class="button button--primary">
    <slot></slot>
  </button>
  Click Me
</hx-button>
```

If `#shadow-root` is present, component hydrated successfully.

### 5. Test Fallback (Optional)

Simulate CDN failure:

**DevTools → Network Tab:**

- Right-click `helix.bundled.js` request
- Select "Block request URL"
- Hard reload (Cmd+Shift+R)
- Check Console: should see "HELIX CDN failed, loading local fallback"

---

## Troubleshooting

### Components Don't Render

**Symptom:** `<hx-button>` appears as plain text, no styling.

**Causes:**

1. Library not attached to page
2. CDN request failed (network issue, wrong URL)
3. Script type not set to `module`

**Fix:**

```yaml
# Check libraries.yml has correct config
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module # MUST BE PRESENT
```

### CORS Errors

**Symptom:** Console error: "has been blocked by CORS policy".

**Cause:** Missing `crossorigin` attribute.

**Fix:**

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous # ADD THIS
```

### CDN Loads But Components Missing

**Symptom:** Network tab shows 200 OK, but `customElements.get('hx-button')` returns `undefined`.

**Cause:** Wrong file loaded (not the bundled build).

**Fix:** Verify URL ends with `/dist/helix.bundled.js` (NOT `/src/index.ts` or `/dist/index.js`).

### Stale Code After Update

**Symptom:** Updated HELIX version, but old components still render.

**Cause:** Drupal cache + browser cache.

**Fix:**

```bash
# Clear Drupal cache
drush cr

# Increment Drupal library version
# mytheme.libraries.yml
helix-components:
  version: 0.0.2  # WAS 0.0.1
```

Hard reload browser (Cmd+Shift+R).

---

## Migration Path: CDN → npm

As your site scales, you may outgrow CDN installation. Migration path:

### Phase 1: Add npm Package (Parallel)

```bash
cd web/themes/custom/mytheme
npm install @helixui/library
```

Keep CDN library definition active.

### Phase 2: Create Local Build Pipeline

**File:** `package.json`

```json
{
  "scripts": {
    "build": "vite build"
  },
  "dependencies": {
    "@helixui/library": "^0.0.1"
  }
}
```

**File:** `vite.config.js`

```javascript
export default {
  build: {
    rollupOptions: {
      input: 'src/main.js',
      output: {
        dir: 'dist',
        format: 'es',
      },
    },
  },
};
```

**File:** `src/main.js`

```javascript
import '@helixui/library';
```

### Phase 3: Switch Library Definition

**File:** `mytheme.libraries.yml`

```yaml
helix-components:
  version: 0.0.1
  js:
    # OLD (CDN)
    # https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
    #   type: external
    #   attributes:
    #     type: module

    # NEW (Local)
    dist/main.js:
      attributes:
        type: module
```

### Phase 4: Remove CDN References

Delete preconnect hints, fallback scripts, and CDN URLs from templates.

---

## Summary

CDN installation provides the fastest path to HELIX integration with Drupal:

**Key Steps:**

1. Create library definition in `mytheme.libraries.yml` with `type: external` and `type: module`
2. Attach library globally (`mytheme.info.yml`) or conditionally (TWIG templates)
3. Pin to exact versions for production stability
4. Implement preconnect + fallback patterns for performance and resilience
5. Add SRI hashes and CSP headers for security

**Production Checklist:**

- [ ] Exact version pinned (`@0.0.1`, not `@latest`)
- [ ] Drupal library version matches HELIX version
- [ ] `type: module` attribute present
- [ ] `crossorigin: anonymous` for CORS
- [ ] Preconnect to CDN in `<head>`
- [ ] Local fallback script implemented
- [ ] CSP headers whitelist CDN domains
- [ ] Components tested in target browsers

**Next Steps:**

- [TWIG Patterns](/drupal-integration/twig/) — Learn component rendering patterns
- [Drupal Behaviors](/drupal-integration/behaviors/) — Integrate with Drupal's JavaScript lifecycle
- [npm Installation](/drupal-integration/installation/npm/) — Migrate to build pipeline for larger sites

---

**CDN installation is production-ready for small-to-medium Drupal sites. For enterprise multi-site deployments, see the [npm installation guide](/drupal-integration/installation/npm/).**
