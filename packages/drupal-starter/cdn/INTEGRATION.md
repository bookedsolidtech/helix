# HELiX CDN Integration Guide — Drupal 10/11

Detailed reference for integrating HELiX web components via CDN into a Drupal 10 or Drupal 11 site.

## Prerequisites

- Drupal 10.x or 11.x
- A location to serve static files (CDN, managed files, or `/libraries/`)
- The HELiX CDN artifacts (built from the monorepo or downloaded from a release)
- No Node.js required on the Drupal server

---

## Step 1: Obtain the CDN artifacts

### From a monorepo build

```bash
git clone https://github.com/bookedsolidtech/helix.git
cd helix
pnpm install
pnpm --filter @helixui/library run build:cdn
# Artifacts are in: packages/hx-library/dist/cdn/
```

### From a GitHub release

Download the `helix-cdn-1.1.2.tar.gz` asset from the GitHub Releases page and extract it.

---

## Step 2: Upload files to a serving location

### Option A: sites/default/files (managed files)

This approach works on any Drupal hosting and requires no special configuration.

```bash
# Create a versioned directory
mkdir -p /var/www/drupal/web/sites/default/files/helix-cdn/1.1.2

# Copy the CDN artifacts
cp -r packages/hx-library/dist/cdn/. \
  /var/www/drupal/web/sites/default/files/helix-cdn/1.1.2/
```

Verify the files are accessible:

```
https://your-drupal-site.example.com/sites/default/files/helix-cdn/1.1.2/helix-1.1.2.min.js
```

### Option B: External CDN (recommended for production)

Upload the `dist/cdn/` contents to your CDN provider. Structure the bucket so files are accessible at a URL like:

```
https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.js
https://cdn.example.com/helix/1.1.2/components/hx-button-1.1.2.js
```

Set `Cache-Control: public, max-age=31536000, immutable` on all files. The version is in the filename, so these URLs never change for a given release.

### Option C: Drupal /libraries directory

Requires either Libraries API module or Drupal 10.3+ native library discovery.

```bash
mkdir -p /var/www/drupal/web/libraries/helix-cdn/1.1.2
cp -r packages/hx-library/dist/cdn/. \
  /var/www/drupal/web/libraries/helix-cdn/1.1.2/
```

---

## Step 3: Configure libraries.yml

### In a custom theme

Add to `mytheme.libraries.yml` (or create the file if it doesn't exist):

```yaml
# mytheme.libraries.yml

helix-all:
  version: 1.1.2
  css:
    theme:
      https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.css:
        type: external
        minified: true
  js:
    https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.js:
      type: external
      attributes:
        type: module
      minified: true

helix-button:
  version: 1.1.2
  css:
    theme:
      https://cdn.example.com/helix/1.1.2/components/hx-button-1.1.2.css:
        type: external
        minified: true
  js:
    https://cdn.example.com/helix/1.1.2/components/hx-button-1.1.2.js:
      type: external
      attributes:
        type: module
      minified: true
```

### In a custom module

Add to `mymodule.libraries.yml`:

```yaml
# mymodule.libraries.yml

helix-components:
  version: 1.1.2
  js:
    /sites/default/files/helix-cdn/1.1.2/helix-1.1.2.min.js:
      type: external
      attributes:
        type: module
      minified: true
  css:
    theme:
      /sites/default/files/helix-cdn/1.1.2/helix-1.1.2.min.css:
        type: external
        minified: true
```

---

## Step 4: Attach the library

### In Twig templates

Attach the full library in your base page template:

```twig
{# themes/mytheme/templates/layout/page.html.twig #}
{{ attach_library('mytheme/helix-all') }}
```

Or attach per-component libraries in specific templates:

```twig
{# templates/node/node--patient-record.html.twig #}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-status-indicator') }}
```

### In a preprocess hook

```php
// mytheme.theme or mymodule.module

function mytheme_preprocess_page(&$variables) {
  // Attach HELiX to every page
  $variables['#attached']['library'][] = 'mytheme/helix-all';
}

function mytheme_preprocess_node(&$variables) {
  // Attach only on patient record nodes
  if ($variables['node']->bundle() === 'patient_record') {
    $variables['#attached']['library'][] = 'mytheme/helix-status-indicator';
    $variables['#attached']['library'][] = 'mytheme/helix-alert';
  }
}
```

### Programmatically in a module

```php
// In a controller or form:
use Drupal\Core\Render\RendererInterface;

$build['#attached']['library'][] = 'mymodule/helix-components';
```

---

## Step 5: Use components in Twig

Components are standard HTML custom elements. Once the library script is loaded, they work anywhere in your Twig templates:

```twig
{# Buttons #}
<hx-button variant="primary" size="md">Save</hx-button>
<hx-button variant="secondary" size="sm">Cancel</hx-button>
<hx-button variant="destructive">Delete Record</hx-button>

{# Card with slots #}
<hx-card variant="featured" elevation="raised">
  <span slot="heading">{{ node.title.value }}</span>
  <div>{{ content.body }}</div>
  <div slot="footer">
    <hx-button variant="primary" size="sm">View Full Record</hx-button>
  </div>
</hx-card>

{# Text input integrated with Drupal forms #}
<hx-text-input
  name="patient_id"
  label="Patient ID"
  required
  value="{{ form.patient_id['#value']|default('') }}"
  helper-text="Enter the 8-digit patient identifier"
></hx-text-input>

{# Clinical status #}
<hx-status-indicator
  status="{{ node.field_clinical_status.value }}"
></hx-status-indicator>

{# Alert for patient warnings #}
{% if patient.has_allergy_alert %}
<hx-alert variant="warning" dismissible>
  <strong>Allergy Alert:</strong> {{ patient.allergy_summary }}
</hx-alert>
{% endif %}
```

---

## Drupal-specific considerations

### Aggregation

Drupal's built-in JS/CSS aggregation does NOT work with `type: external` libraries. This is expected and correct — external URLs are served as-is from the CDN. Do not attempt to enable aggregation for these libraries.

```yaml
# Correct — type: external prevents aggregation
js:
  https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.js:
    type: external
    attributes:
      type: module
```

### Script type: module

All HELiX bundles are ES modules. The `attributes: { type: module }` configuration is required. ES modules load deferred by default — they do not block page rendering, which is the correct behavior for web components.

### Content Security Policy (CSP)

If your Drupal site enforces CSP headers, you must add the CDN domain to your `script-src` and `style-src` directives:

```
Content-Security-Policy: script-src 'self' https://cdn.example.com; style-src 'self' https://cdn.example.com;
```

For sites using managed files (`/sites/default/files/`), these are same-origin requests and no CSP changes are needed.

### Drupal render cache

Twig `attach_library()` calls are cached with the render element. When switching CDN versions, always run:

```bash
drush cr
# or
drush cache-rebuild
```

### AdvAgg module

If you use the AdvAgg (Advanced Aggregation) module, mark the HELiX library entries as `preprocess: false` to prevent AdvAgg from attempting to process them:

```yaml
all:
  version: 1.1.2
  js:
    https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.js:
      type: external
      preprocess: false
      attributes:
        type: module
```

### Cross-origin headers (CORS)

If loading HELiX from a different domain than your Drupal site, the CDN server must include `Access-Control-Allow-Origin` headers. Most CDN providers (CloudFront, Cloudflare, Fastly) set these by default for static assets. Verify with:

```bash
curl -I https://cdn.example.com/helix/1.1.2/helix-1.1.2.min.js | grep -i access-control
```

### Drupal behaviors and CustomEvents

HELiX components dispatch custom events with the `hx-` prefix. Wire Drupal behaviors to these events using `Drupal.behaviors`:

```javascript
// themes/mytheme/js/helix-behaviors.js
(function (Drupal, once) {
  Drupal.behaviors.helixPatientCard = {
    attach(context) {
      once('helix-card-init', 'hx-card[data-patient-id]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          const patientId = card.dataset.patientId;
          window.location.href = `/patient/${patientId}`;
        });
      });
    },
  };
})(Drupal, once);
```

Include this behaviors file in your `mytheme.libraries.yml` alongside the HELiX library:

```yaml
helix-behaviors:
  version: 1.1.2
  js:
    js/helix-behaviors.js: {}
  dependencies:
    - core/drupal
    - core/once
    - mytheme/helix-all
```

---

## Upgrading to a new HELiX version

1. Build the new CDN artifacts from the updated source.
2. Upload them to a new versioned path (e.g., `1.2.0/`).
3. Update `version:` and all file paths in your `libraries.yml`.
4. Run `drush cr`.
5. The old version files remain in place until you remove them — this allows a zero-downtime rollout.

Do not overwrite versioned files in place. The versioned filename is the cache key.

---

## Troubleshooting

**Components render as plain text (no Shadow DOM)**
The JavaScript bundle failed to load. Check the browser console for network errors. Verify the file URL is correct and the server returns HTTP 200 with `Content-Type: application/javascript`.

**TypeError: Illegal invocation or customElements is not defined**
The browser does not support Custom Elements v1. HELiX targets Chrome 80+, Firefox 78+, Safari 14+. If you need older browser support, contact the HELiX team for polyfill guidance.

**Styles not applied**
Ensure the CSS file is also loading (check Network tab in DevTools). Components with CSS-in-JS (Lit `css` template literals) render their styles inside Shadow DOM — they do not require the external CSS file to render, but design token overrides do.

**Drupal error: "The specified library ... was not found"**
The library name in `attach_library()` must match the key in your `libraries.yml`. The format is `module_or_theme_name/library_key`. Run `drush cr` after editing `libraries.yml`.

**Script loads but components do not register**
Verify that `attributes: { type: module }` is set. Without it, Drupal injects the script as a classic script, and ES module syntax causes a syntax error in older processing paths.
