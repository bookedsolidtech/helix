# HELiX CDN Integration for Drupal

This directory provides everything needed to use the HELiX web component library in a Drupal 10/11 site without npm, Node.js, or any build pipeline on the Drupal server.

## What is CDN mode?

CDN mode produces self-contained JavaScript bundles where Lit and all component dependencies are bundled inline. You download the output files once and serve them from a CDN, an object store (S3, GCS, Azure Blob), or Drupal's own `sites/default/files/` directory. The Drupal site loads them as external scripts — no Node.js toolchain required at runtime.

## When to use CDN mode

Use CDN mode when:

- Your Drupal hosting environment does not have Node.js available
- You are a Drupal shop without a JavaScript build pipeline
- You want to prototype quickly without setting up `package.json` and a build step
- You are delivering components to a client's existing Drupal site

Use the npm/Vite pipeline instead when:

- You already have a JavaScript build pipeline in your Drupal theme
- You want tree-shaking to minimize bytes — only loading the exact components used
- You need to override design tokens at build time

## How to build the CDN artifacts

From the monorepo root (requires Node.js on the build machine, not the Drupal server):

```bash
cd packages/hx-library
pnpm run build:cdn
```

Or from the repo root:

```bash
pnpm --filter @helixui/library run build:cdn
```

Output appears at `packages/hx-library/dist/cdn/`:

```
dist/cdn/
  helix-1.1.2.min.js        # Full bundle — all components + Lit
  helix-1.1.2.min.js.map    # Source map
  helix-1.1.2.min.css       # All component CSS
  manifest.json             # Asset manifest with component list
  components/
    hx-button-1.1.2.js      # Per-component bundle (Lit inline)
    hx-button-1.1.2.css     # Per-component CSS
    hx-card-1.1.2.js
    hx-card-1.1.2.css
    ... (one pair per component)
```

## How to serve the files

### Option A: Drupal managed files directory

Copy the `dist/cdn/` output to your Drupal server:

```bash
# Example: rsync to Drupal managed files
rsync -av dist/cdn/ user@drupal-server:/var/www/drupal/sites/default/files/helix-cdn/1.1.2/
```

Your `{{CDN_URL}}` becomes `/sites/default/files/helix-cdn/1.1.2`.

### Option B: Drupal public files via drush

```bash
# Or use Drush to manage the path
drush php-eval "echo \Drupal::service('file_system')->realpath('public://');"
```

Then copy files to that path under a `helix-cdn/1.1.2/` subdirectory.

### Option C: External CDN (S3, CloudFront, jsDelivr, etc.)

Upload the entire `dist/cdn/` directory to your CDN provider. Your `{{CDN_URL}}` becomes the full URL, for example: `https://cdn.example.com/helix/1.1.2`.

### Option D: Drupal /libraries directory

Place files in Drupal's `/libraries/` directory (requires the Libraries API module or Drupal 10.3+ Libraries UI):

```bash
cp -r dist/cdn/ /path/to/drupal/libraries/helix-cdn/1.1.2/
```

Your `{{CDN_URL}}` becomes `/libraries/helix-cdn/1.1.2`.

## How to configure libraries.yml

1. Copy `helixui-cdn.libraries.yml.template` to your theme or module.
2. Rename it to `mytheme.libraries.yml` (or merge it into your existing libraries file).
3. Replace all occurrences of `{{CDN_URL}}` with your actual base URL.

Example with managed files:

```yaml
all:
  version: 1.1.2
  css:
    theme:
      /sites/default/files/helix-cdn/1.1.2/helix-1.1.2.min.css:
        type: external
        minified: true
  js:
    /sites/default/files/helix-cdn/1.1.2/helix-1.1.2.min.js:
      type: external
      attributes:
        type: module
      minified: true
```

## Attaching libraries in Twig

### Full bundle (all components)

Attach once in your base template (e.g., `page.html.twig` or `html.html.twig`):

```twig
{{ attach_library('helix_cdn/all') }}
```

All HELiX components are then available anywhere on the page.

### Per-component loading

Attach only the components you need on a specific template:

```twig
{# Only load hx-button and hx-card on this page #}
{{ attach_library('helix_cdn/hx-button') }}
{{ attach_library('helix_cdn/hx-card') }}
```

```twig
{# Patient record page: load form and status components #}
{{ attach_library('helix_cdn/hx-text-input') }}
{{ attach_library('helix_cdn/hx-select') }}
{{ attach_library('helix_cdn/hx-status-indicator') }}
{{ attach_library('helix_cdn/hx-dialog') }}
```

### In a preprocess hook

```php
function mytheme_preprocess_node(&$variables) {
  if ($variables['node']->getType() === 'patient_record') {
    $variables['#attached']['library'][] = 'helix_cdn/hx-status-indicator';
    $variables['#attached']['library'][] = 'helix_cdn/hx-alert';
  }
}
```

## Using components in Twig templates

Once the library is attached, use HELiX components directly in Twig:

```twig
{# Basic button #}
<hx-button variant="primary">Save Patient Record</hx-button>

{# Card with slots #}
<hx-card variant="featured" elevation="raised">
  <span slot="heading">{{ node.title.value }}</span>
  {{ content.body }}
  <div slot="footer">
    <hx-button variant="secondary" size="sm">View Details</hx-button>
  </div>
</hx-card>

{# Clinical status indicator #}
<hx-status-indicator
  status="{{ patient.status }}"
  label="{{ patient.status_label }}"
></hx-status-indicator>
```

## Progressive enhancement

HELiX components are built with progressive enhancement. Slot content renders as plain HTML before JavaScript loads. Ensure meaningful fallback content is present for accessibility and SEO:

```twig
<hx-button variant="primary">
  {# This text is visible immediately before JS loads #}
  Submit Form
</hx-button>
```

## Performance considerations

- The full bundle (`helix-1.1.2.min.js`) includes Lit and all 80+ components. Use per-component loading when only a few components are needed.
- Enable HTTP/2 on your server to allow parallel loading of per-component files without head-of-line blocking.
- All CDN files are versioned in their filename. Set long `Cache-Control: max-age` headers (one year is common) for these versioned URLs.
- Do not enable Drupal's JS aggregation for external (type: external) library entries. Drupal will not aggregate cross-origin scripts.
- Source maps are included for debugging but should not be served in production unless required by your team.

## Upgrading

When upgrading to a new HELiX version:

1. Run `pnpm run build:cdn` with the new version checked out.
2. Upload the new `dist/cdn/` output to a new versioned path (e.g., `1.2.0/`).
3. Update your `libraries.yml` to point to the new version.
4. Drupal's cache will serve the new version immediately after `drush cr`.

Old version files remain in place until you remove them — zero-downtime upgrade path.
