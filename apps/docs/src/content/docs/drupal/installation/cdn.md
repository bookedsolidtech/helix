---
title: CDN Installation
description: Complete guide to loading HELiX web components from a CDN in Drupal 10/11 — library definitions, version pinning, per-component loading, SRI hash verification, and fallback patterns.
sidebar:
  order: 2
---

CDN installation is the fastest way to add HELiX web components to a Drupal site. It requires no build pipeline, no npm, and no compiled assets — just a library definition in your theme's `.libraries.yml` file pointing to the jsDelivr or unpkg CDN.

This guide covers the complete CDN workflow: basic setup, version pinning strategies, per-component loading, SRI hash verification, CSS bundle loading, fallback patterns, and cache management.

---

## When to Use CDN Installation

**Well suited for:**

- Rapid prototyping and proof-of-concept work
- Small-to-medium sites without existing JavaScript build pipelines
- Third-party or contrib themes you don't maintain
- Teams without Node.js or front-end build expertise
- Short-lived projects where setup overhead is not justified

**Not suited for:**

- HIPAA-compliant or patient-facing applications (external dependency risk)
- Sites behind restrictive corporate firewalls that block external CDNs
- Applications with strict Content Security Policy rules blocking external scripts
- Environments requiring offline development
- High-traffic sites where CDN downtime would be unacceptable

---

## How CDN Loading Works in Drupal

Drupal's Libraries API manages JavaScript and CSS assets. When you define a library with a URL as the asset path and `type: external`, Drupal renders a `<script>` tag pointing to that URL. Adding `attributes: { type: module }` marks it as an ES module, which is required for HELiX components built with Lit.

**Loading sequence:**

1. Drupal renders a `<script type="module" src="https://cdn.jsdelivr.net/...">` tag
2. Browser downloads the ES module from the CDN
3. Module registers all HELiX custom elements (`hx-button`, `hx-card`, etc.)
4. Twig templates render those elements as standard HTML tags
5. Browser upgrades each custom element with its Shadow DOM and styles

---

## Step 1: Define the Library

Create or edit your theme's `.libraries.yml` file.

:::tip[Strategy B is the recommended 3.0.0 path]
Load `dist/cdn/core.js` (registry + tokens, ~8.4KB min+gz) once, then load each `dist/cdn/hx-<component>.js` module for the components the site actually uses. The full-bundle fallback further down remains available but is **not recommended for production** — it ships every component whether you use it or not.
:::

### Strategy B — core + per-component (recommended, jsDelivr)

```yaml
# mytheme.libraries.yml

helix-components:
  version: 3.0.0
  js:
    # Core: registry + tokens, ~8.4KB min+gz
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/core.js:
      type: external
      attributes:
        type: module
      preprocess: false
    # Per-component modules — ~2KB each; only list what the theme uses
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/hx-button.js:
      type: external
      attributes:
        type: module
      preprocess: false
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/hx-card.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

**Field explanations:**

- `helix-components` — Library machine name. Referenced as `mytheme/helix-components` in templates and hooks.
- `version: 3.0.0` — Drupal's internal library version for cache invalidation. Increment this when you update the CDN URL.
- `type: external` — Tells Drupal this is a URL, not a local file path.
- `attributes: { type: module }` — Required. Without this, browsers load the script as a classic script and ES module `import` statements fail.
- `preprocess: false` — Prevents Drupal from attempting to aggregate this external URL.

### Strategy A — single-file bundle (prototyping, not recommended for production)

```yaml
helix-components:
  version: 3.0.0
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

The `@helixui/library` package.json declares `main: "./dist/index.js"` — this is the entry point for bundler-driven builds. Loading it from a CDN pulls every component (~150KB gzipped) whether the site uses it or not.

### unpkg mirror

Both jsDelivr and unpkg are reliable and serve correct ES module MIME types. jsDelivr is recommended for production due to its multi-CDN architecture (Cloudflare + Fastly + CloudFront) and higher uptime SLA.

```yaml
# Swap the host — same paths work on unpkg
helix-components:
  version: 3.0.0
  js:
    https://unpkg.com/@helixui/library@3.0.0/dist/cdn/core.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

### CSS Bundle

To load the HELiX CSS bundle alongside the JavaScript:

```yaml
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-all.css:
        type: external
        preprocess: false
```

The `helix-all.css` bundle includes design token custom properties and base styles used by all components. Load it if your theme is not already importing the CSS through a separate channel (such as npm-installed tokens).

---

## Step 2: Attach the Library

### Global Attachment (Every Page)

Add the library to your theme's `.info.yml`:

```yaml
# mytheme.info.yml

name: My Healthcare Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/helix-components
```

This loads HELiX on every page of your site. Suitable when components appear across most page types.

### Template-Level Attachment

For performance-sensitive sites, attach the library only where components are used:

```twig
{# templates/node--article.html.twig #}

{{ attach_library('mytheme/helix-components') }}

<article{{ attributes }}>
  <hx-card variant="featured">
    <span slot="heading">{{ node.title.value }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

### Hook-Based Attachment

Attach programmatically based on route, content type, or other conditions:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  // Attach HELiX on all pages.
  $attachments['#attached']['library'][] = 'mytheme/helix-components';
}
```

Or conditionally:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  $route = \Drupal::routeMatch()->getRouteName();

  // Only load on node pages.
  if (str_starts_with($route, 'entity.node')) {
    $attachments['#attached']['library'][] = 'mytheme/helix-components';
  }
}
```

---

## Step 3: Use Components in Templates

Once the library is attached, HELiX custom elements are available in any Twig template on the same page.

### Button

```twig
<hx-button variant="primary" hx-size="lg">Save Changes</hx-button>
<hx-button variant="secondary" hx-size="md">Cancel</hx-button>
<hx-button variant="ghost" hx-size="sm">Learn More</hx-button>
```

Note: Use `hx-size` (not `size`) — HELiX uses the `hx-` prefix on size and other attributes to avoid conflicts with native HTML element attributes.

### Card

```twig
<hx-card variant="elevated">
  <span slot="heading">{{ node.title.value }}</span>
  <p>{{ content.body }}</p>
</hx-card>
```

For link cards, use `href` (not `href`):

```twig
<hx-card variant="outlined" href="{{ url('entity.node.canonical', {'node': node.id}) }}">
  <span slot="heading">{{ node.title.value }}</span>
  <p>{{ node.field_summary.value }}</p>
</hx-card>
```

---

## Version Pinning

### Exact Version (Production Recommended)

```yaml
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

Exact version pinning guarantees identical behavior across all environments and deployments. The CDN serves versioned URLs with `Cache-Control: public, max-age=31536000, immutable` — meaning the browser caches the file permanently and never refetches it for the same URL.

### Updating to a New Version

When a new HELiX version is available:

1. Update the CDN URL version number
2. Update the Drupal library `version` field to match (triggers Drupal cache invalidation)
3. Clear Drupal caches: `drush cr`
4. Hard-reload the browser (Cmd+Shift+R) to bypass browser cache

```yaml
# Before
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false

# After upgrade
helix-components:
  version: 1.2.0
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

### Never Use `@latest` in Production

```yaml
# DO NOT do this in production
js:
  https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
    type: external
    attributes:
      type: module
```

`@latest` resolves to whatever version is current at request time. A breaking HELiX release would instantly propagate to your production site with no review or testing. Reserve `@latest` for local sandbox exploration only.

---

## Per-Component Loading

Loading the full bundle delivers all HELiX components. If your site uses only a few components, load them individually to reduce the browser's initial download.

### Per-Component Library Definitions

```yaml
# mytheme.libraries.yml

helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js:
      type: external
      attributes:
        type: module
      preprocess: false

helix-card:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-card/index.js:
      type: external
      attributes:
        type: module
      preprocess: false

helix-text-input:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-text-input/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

The per-component CDN path pattern is:

```
https://cdn.jsdelivr.net/npm/@helixui/library@{version}/dist/components/{component-name}/index.js
```

### Attaching Per-Component Libraries in Templates

```twig
{# Article template — only needs card #}
{{ attach_library('mytheme/helix-card') }}

<hx-card variant="elevated">
  <span slot="heading">{{ node.title.value }}</span>
  {{ content.body }}
</hx-card>
```

```twig
{# Contact form template — only needs button and text-input #}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-text-input') }}

<form>
  <hx-text-input name="email" label="Email Address" required></hx-text-input>
  <hx-button variant="primary" hx-size="md" type="submit">Submit</hx-button>
</form>
```

**Trade-off:** Per-component loading reduces payload per page but increases the number of distinct CDN requests. With HTTP/2 multiplexing, the overhead per request is minimal, so this trade-off generally favors per-component loading when a page uses three or fewer components.

---

## SRI Hash Verification

Subresource Integrity (SRI) lets browsers verify that CDN-delivered files haven't been tampered with. When the browser fetches the script, it computes a hash and compares it to the `integrity` attribute — if they don't match, the script is blocked.

### Generating the SRI Hash

```bash
curl -s https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

This outputs a base64-encoded SHA-384 hash. Prepend `sha384-` to form the integrity value.

### Adding SRI to the Library Definition

```yaml
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
        integrity: sha384-REPLACE_WITH_ACTUAL_HASH
        crossorigin: anonymous
      preprocess: false
```

The `crossorigin: anonymous` attribute is required when using `integrity` — without it the browser cannot perform the integrity check on cross-origin resources.

**Operational note:** You must regenerate the hash every time you update to a new HELiX version. Automate this in your deployment pipeline or store the hash alongside your `libraries.yml` in source control.

---

## Content Security Policy

If your site uses a Content Security Policy, whitelist the CDN domains to permit the external script load.

### In settings.php (Security Kit module)

```php
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
];

$config['security_kit.settings']['seckit_xss']['csp']['style-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
];
```

### In .htaccess (Apache)

```apache
Header always set Content-Security-Policy "script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net;"
```

---

## CDN Fallback Pattern

CDNs can experience downtime. For production sites where component availability matters, implement a local fallback.

### Library Structure with Fallback

```
web/themes/custom/mytheme/
├── mytheme.libraries.yml
├── js/
│   └── helix-cdn-fallback.js    # Fallback detection script
└── libraries/
    └── helix/
        └── dist/
            └── index.js          # Local copy downloaded from npm
```

### Libraries Definition

```yaml
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
    js/helix-cdn-fallback.js:
      attributes:
        type: module
      preprocess: false
```

### Fallback Script

```javascript
// js/helix-cdn-fallback.js

// Wait for the CDN module to register custom elements.
// hx-button is the smallest component — if it loaded, the bundle loaded.
setTimeout(() => {
  if (!customElements.get('hx-button')) {
    console.warn('[HELiX] CDN load failed — switching to local fallback');
    import('/themes/custom/mytheme/libraries/helix/dist/index.js')
      .then(() => console.info('[HELiX] Local fallback loaded successfully'))
      .catch((err) => console.error('[HELiX] Local fallback also failed:', err));
  }
}, 2000);
```

Download the local copy to include in your theme:

```bash
cd web/themes/custom/mytheme/libraries/helix
npm pack @helixui/library@3.0.0
tar -xf helixui-library-3.0.0.tgz --strip-components=1 package/dist
rm helixui-library-3.0.0.tgz
```

---

## Performance Optimization

### Preconnect to CDN

Add a preconnect hint to your `html.html.twig` override. This tells the browser to establish a TCP/TLS connection to the CDN origin before it encounters the `<script>` tag, saving 100–300ms on first page load:

```twig
{# templates/html.html.twig #}

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

### Load in Head

By default Drupal places scripts at the bottom of `<body>`. To load HELiX earlier (reduces flash of unstyled custom elements):

```yaml
helix-components:
  version: 1.1.2
  header: true
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

---

## Verifying Installation

### Browser DevTools Checklist

1. **Network tab** — Filter by `index.js`. The CDN request should show status `200 OK` and type `script`.
2. **Console** — No errors from `@helixui/library`.
3. **Elements tab** — Inspect an `<hx-button>` element. It should have `#shadow-root (open)` inside it.

### Console Verification

```javascript
// Returns the constructor function if HELiX loaded successfully
customElements.get('hx-button');

// Lists all HELiX custom elements present on the page
[...document.querySelectorAll('*')]
  .filter(el => el.tagName.startsWith('HX-'))
  .map(el => el.tagName.toLowerCase());
```

---

## Troubleshooting

### Components render as unstyled text

**Cause:** The `attributes: { type: module }` line is missing or indented incorrectly in `.libraries.yml`.

**Fix:**

```yaml
helix-components:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module   # This line must be present and indented under attributes
      preprocess: false
```

### CDN request returns 404

**Cause:** Wrong file path in the URL.

**Fix:** The 3.0.0 CDN layout ships `dist/cdn/core.js` (registry + tokens) plus per-component modules at `dist/cdn/hx-<component>.js`. Legacy single-file paths from pre-3.0 releases are not published and will return 404. The npm entry for bundlers is `dist/index.js`.

### Components load but appear unstyled (no color/spacing)

**Cause:** CSS bundle not loaded, or design tokens missing.

**Fix:** Add the CSS bundle to your library definition:

```yaml
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-all.css:
        type: external
        preprocess: false
```

### Stale components after version update

**Cause:** Drupal has cached the old library definition, or the browser has cached the old script URL.

**Fix:**

```bash
drush cr
```

Then hard-reload in the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux).

Ensure the Drupal library `version` field also changed — Drupal uses it to generate cache-busting query strings.

### CORS error in console

**Cause:** Missing `crossorigin` attribute (required when using `integrity`).

**Fix:**

```yaml
attributes:
  type: module
  crossorigin: anonymous
```

---

## Complete Production-Ready Example

**`mytheme.info.yml`:**

```yaml
name: My Healthcare Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/helix-components
```

**`mytheme.libraries.yml`:**

```yaml
helix-components:
  version: 1.1.2
  header: true
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
      preprocess: false
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-all.css:
        type: external
        preprocess: false
```

**`templates/node--article.html.twig`:**

```twig
<article{{ attributes }}>
  <hx-card variant="elevated" href="{{ url('entity.node.canonical', {'node': node.id}) }}">
    <span slot="heading">{{ node.title.value }}</span>
    {{ content.body }}
    <div slot="footer">
      <hx-button variant="secondary" hx-size="sm">Read More</hx-button>
    </div>
  </hx-card>
</article>
```

---

## Production Checklist

- [ ] Exact version pinned (`@1.1.2`, not `@latest`)
- [ ] `attributes: { type: module }` present in library definition
- [ ] `preprocess: false` set to prevent aggregation errors
- [ ] Drupal library `version` field matches HELiX version
- [ ] Caches cleared after library changes (`drush cr`)
- [ ] CDN request verified in browser Network tab (HTTP 200)
- [ ] Shadow DOM visible in Elements tab for at least one component
- [ ] `crossorigin: anonymous` added if using `integrity` SRI hash
- [ ] CSP headers updated to whitelist `cdn.jsdelivr.net` if applicable
- [ ] Preconnect hint added to `html.html.twig` for performance

---

## Next Steps

- [npm Installation](/drupal/installation/npm/) — Move to a local build pipeline for tree-shaking and offline development
- [Module Installation](/drupal/installation/module/) — Package HELiX as a Drupal module for multi-site deployments
