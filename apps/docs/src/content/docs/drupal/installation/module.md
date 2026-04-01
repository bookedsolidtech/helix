---
title: Module Installation
description: Installing HELiX web components as a Drupal module for enterprise multi-site deployments — module scaffolding, Composer integration, auto-loading, multi-site setup, and Drupal 10/11 compatibility.
sidebar:
  order: 4
---

The module approach packages HELiX as a reusable Drupal module that acts as a library provider. Once installed and enabled, all themes and modules across a Drupal installation (or multi-site network) can attach HELiX libraries by name — no per-theme npm setup, no per-theme CDN configuration.

This is the recommended approach for enterprise multi-site deployments, agency distribution to multiple clients, and any situation where you want a single authoritative source for HELiX version management.

---

## When to Use Module-Based Installation

**Well suited for:**

- Multi-site installations (hospital systems, government portals, Acquia Site Factory tenants)
- Agencies distributing HELiX to multiple client projects via a private Composer repository
- Organizations that manage JavaScript dependencies through Composer rather than npm
- Architectures where the component library is decoupled from any specific theme
- Teams experienced with Drupal module development who find npm build pipelines unfamiliar

**Not suited for:**

- Single-site custom theme development (npm is simpler and more direct)
- Rapid prototyping (CDN is faster to set up)
- Teams unfamiliar with Drupal module architecture, install hooks, and configuration management

---

## Architecture Overview

A HELiX library module is a standard Drupal custom module that:

1. Declares HELiX JavaScript files as Drupal library assets in a `.libraries.yml` file
2. Stores the HELiX built files inside the module's `libraries/` directory
3. Optionally implements hooks for dynamic library configuration, environment switching, or version management

Any theme or module on the site attaches HELiX by referencing the module's library machine name (e.g., `hx_library/components`) in `.info.yml`, Twig templates, or render arrays.

**File structure:**

```
web/modules/custom/hx_library/
├── hx_library.info.yml           # Module metadata and Drupal version compatibility
├── hx_library.libraries.yml      # Library definitions (JS/CSS asset paths)
├── hx_library.module             # Drupal hooks (optional)
├── hx_library.install            # Install, update, and requirements hooks
├── config/
│   ├── install/
│   │   └── hx_library.settings.yml   # Default configuration
│   └── schema/
│       └── hx_library.schema.yml     # Config schema for type validation
└── libraries/
    └── helix/
        └── dist/
            ├── index.js               # Full component bundle
            ├── css/
            │   └── helix-all.css      # CSS bundle
            └── components/            # Per-component files
                ├── hx-button/
                │   └── index.js
                ├── hx-card/
                │   └── index.js
                └── hx-text-input/
                    └── index.js
```

---

## Step 1: Create Module Scaffold

### Module Info File

**`web/modules/custom/hx_library/hx_library.info.yml`:**

```yaml
name: HELiX Library
type: module
description: Provides HELiX web components as Drupal library assets for use across themes and modules.
core_version_requirement: ^10 || ^11
package: Custom

# Uncomment to hide from the Extend UI (infrastructure-only modules)
# hidden: true
```

The `core_version_requirement: ^10 || ^11` declaration ensures this module installs on both Drupal 10 and Drupal 11 without modification. The `^` operator allows minor and patch updates within each major version.

### Basic Module File (Optional)

If your module needs only the library definitions and no custom hooks, you can skip the `.module` file entirely. Create it when you need hooks:

**`web/modules/custom/hx_library/hx_library.module`:**

```php
<?php

/**
 * @file
 * HELiX Library module — provides HELiX web components as Drupal library assets.
 */

use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function hx_library_help($route_name, RouteMatchInterface $route_match) {
  if ($route_name === 'help.page.hx_library') {
    $output = '<h3>' . t('About') . '</h3>';
    $output .= '<p>' . t('Provides HELiX web components (@helixui/library v1.1.2) as Drupal library assets.') . '</p>';
    $output .= '<h3>' . t('Usage') . '</h3>';
    $output .= '<pre><code>';
    $output .= "# In mytheme.info.yml\nlibraries:\n  - hx_library/components\n\n";
    $output .= "# In Twig\n{{ attach_library('hx_library/components') }}\n\n";
    $output .= "# In render array\n\$build['#attached']['library'][] = 'hx_library/components';";
    $output .= '</code></pre>';
    return $output;
  }
}
```

---

## Step 2: Define Libraries

**`web/modules/custom/hx_library/hx_library.libraries.yml`:**

### Full Bundle (Simplest Setup)

```yaml
# Full library bundle — loads all HELiX components
components:
  version: 1.1.2
  js:
    libraries/helix/dist/index.js:
      attributes:
        type: module
      preprocess: false
      minified: true
  css:
    theme:
      libraries/helix/dist/css/helix-all.css: {}
  dependencies:
    - core/once
```

**Usage in a theme:**

```yaml
# mytheme.info.yml
libraries:
  - hx_library/components
```

**Usage in a Twig template:**

```twig
{{ attach_library('hx_library/components') }}
```

**Usage in a render array:**

```php
$build['#attached']['library'][] = 'hx_library/components';
```

### Per-Component Libraries (Granular Loading)

For large sites where different page types use different components:

```yaml
# hx_library.libraries.yml

# Full bundle
components:
  version: 1.1.2
  js:
    libraries/helix/dist/index.js:
      attributes:
        type: module
      preprocess: false
      minified: true

# Individual component libraries
button:
  version: 1.1.2
  js:
    libraries/helix/dist/components/hx-button/index.js:
      attributes:
        type: module
      preprocess: false
      minified: true

card:
  version: 1.1.2
  js:
    libraries/helix/dist/components/hx-card/index.js:
      attributes:
        type: module
      preprocess: false
      minified: true

text-input:
  version: 1.1.2
  js:
    libraries/helix/dist/components/hx-text-input/index.js:
      attributes:
        type: module
      preprocess: false
      minified: true
```

This lets themes and templates attach only what they need:

```php
// In a form preprocess hook — only load form inputs on form pages
function mytheme_preprocess_node__patient_form(&$variables) {
  $variables['#attached']['library'][] = 'hx_library/text-input';
  $variables['#attached']['library'][] = 'hx_library/button';
}
```

---

## Step 3: Populate the Library Files

The module's `libraries/helix/dist/` directory must contain the actual HELiX JavaScript files. There are three strategies for populating this directory.

### Strategy A: Manual Copy (Simplest)

Install HELiX locally and copy the built files:

```bash
# Create the target directory
mkdir -p web/modules/custom/hx_library/libraries/helix

# Install HELiX in a temporary location
npm install @helixui/library@1.1.2 --prefix /tmp/helix-install

# Copy the dist directory
cp -r /tmp/helix-install/node_modules/@helixui/library/dist \
  web/modules/custom/hx_library/libraries/helix/

# Verify
ls web/modules/custom/hx_library/libraries/helix/dist/
# Expected: index.js  css/  components/
```

Commit the copied files to your repository. This ensures consistent deployments without requiring npm at deploy time.

**When to use:** Environments without Composer expertise, small teams, or one-off deployments.

### Strategy B: Composer + Asset Packagist

Use Composer to manage the JavaScript dependency alongside your PHP packages.

**Add Asset Packagist to `composer.json`:**

```json
{
  "repositories": [
    {
      "type": "composer",
      "url": "https://asset-packagist.org"
    }
  ]
}
```

**Require the package:**

```bash
composer require npm-asset/helixui--library:^1.1.2
```

**Configure installer path in `composer.json`:**

```json
{
  "extra": {
    "installer-paths": {
      "web/modules/custom/hx_library/libraries/helix": [
        "npm-asset/helixui--library"
      ]
    }
  }
}
```

After `composer install`, the HELiX dist files land at `web/modules/custom/hx_library/libraries/helix/dist/index.js`.

**Updating:**

```bash
composer require npm-asset/helixui--library:^1.2.0
drush cr
```

**When to use:** Projects already using Composer for all dependency management, or organizations that want a single dependency manager for both PHP and JavaScript.

### Strategy C: Build Pipeline Inside the Module

Add a `package.json` to the module itself and run npm as part of module setup:

**`web/modules/custom/hx_library/package.json`:**

```json
{
  "name": "hx-library-drupal-module",
  "private": true,
  "scripts": {
    "sync": "npm install @helixui/library@1.1.2 && node scripts/copy-dist.js"
  },
  "devDependencies": {
    "@helixui/library": "1.1.2"
  }
}
```

**`web/modules/custom/hx_library/scripts/copy-dist.js`:**

```javascript
const { cpSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const src = resolve(__dirname, '../node_modules/@helixui/library/dist');
const dest = resolve(__dirname, '../libraries/helix/dist');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log('HELiX dist files synced to libraries/helix/dist/');
```

Run once after module installation:

```bash
cd web/modules/custom/hx_library
npm run sync
```

Commit the resulting `libraries/helix/dist/` files. The `node_modules/` directory inside the module is not committed (add it to `.gitignore`).

---

## Step 4: Enable the Module

```bash
drush en hx_library
drush cr
```

Or enable through the Drupal admin UI at **Extend** (`/admin/modules`).

---

## Step 5: Attach Libraries in Themes

### Global Attachment via Theme Info

```yaml
# web/themes/custom/mytheme/mytheme.info.yml

name: My Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - hx_library/components
```

### Conditional Attachment via hook_page_attachments

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  // Load HELiX on all pages with node content.
  $node = \Drupal::routeMatch()->getParameter('node');
  if ($node) {
    $attachments['#attached']['library'][] = 'hx_library/components';
  }
}
```

### Template-Level Attachment

```twig
{# templates/node--article.html.twig #}

{{ attach_library('hx_library/components') }}

<article{{ attributes }}>
  <hx-card variant="elevated">
    <span slot="heading">{{ node.title.value }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

---

## Step 6: Using Components in Templates

```twig
{# Button with size attribute (hx-size, not size) #}
<hx-button variant="primary" hx-size="lg">Submit</hx-button>
<hx-button variant="secondary" hx-size="md">Cancel</hx-button>

{# Card with hx-href for link behavior (not href) #}
<hx-card
  variant="outlined"
  hx-href="{{ url('entity.node.canonical', {'node': node.id}) }}"
>
  <span slot="heading">{{ node.title.value }}</span>
  <p>{{ node.field_summary.value }}</p>
</hx-card>

{# Text input in a form #}
<hx-text-input
  name="patient_name"
  label="Patient Name"
  required
></hx-text-input>
```

Key attribute notes:
- Use `hx-size` (not `size`) for component sizing
- Use `hx-href` (not `href`) on `hx-card` for link card behavior

---

## Install and Update Hooks

**`web/modules/custom/hx_library/hx_library.install`:**

```php
<?php

/**
 * @file
 * Install, update, and uninstall functions for HELiX Library module.
 */

/**
 * Implements hook_install().
 */
function hx_library_install() {
  \Drupal::messenger()->addStatus(
    t('HELiX Library installed. Components available as hx_library/* Drupal libraries.')
  );
}

/**
 * Implements hook_uninstall().
 */
function hx_library_uninstall() {
  \Drupal::configFactory()
    ->getEditable('hx_library.settings')
    ->delete();
}

/**
 * Implements hook_requirements().
 *
 * Verifies that the HELiX library files are present at the expected path.
 */
function hx_library_requirements($phase) {
  $requirements = [];

  if ($phase === 'runtime') {
    $module_path = \Drupal::service('extension.list.module')->getPath('hx_library');
    $library_file = DRUPAL_ROOT . '/' . $module_path . '/libraries/helix/dist/index.js';

    if (file_exists($library_file)) {
      $requirements['hx_library_files'] = [
        'title' => t('HELiX Library files'),
        'value' => t('Present'),
        'severity' => REQUIREMENT_OK,
      ];
    }
    else {
      $requirements['hx_library_files'] = [
        'title' => t('HELiX Library files'),
        'value' => t('Missing'),
        'description' => t(
          'HELiX component files not found at @path. Copy the files from @helixui/library@1.1.2/dist/ or run composer install.',
          ['@path' => $library_file]
        ),
        'severity' => REQUIREMENT_ERROR,
      ];
    }
  }

  return $requirements;
}

/**
 * Update HELiX library version to 1.1.2.
 */
function hx_library_update_10001() {
  // Clear all caches to reload updated library definitions.
  drupal_flush_all_caches();
  return t('HELiX Library updated to version 1.1.2. Cache cleared.');
}
```

The `hook_requirements()` implementation makes the status report at `/admin/reports/status` show a clear error if the library files are missing — a common issue after fresh deployments.

---

## Configuration Management

### Default Configuration

**`config/install/hx_library.settings.yml`:**

```yaml
version: '1.1.2'
use_cdn_fallback: false
cdn_url: 'https://cdn.jsdelivr.net/npm/@helixui/library'
```

### Config Schema

**`config/schema/hx_library.schema.yml`:**

```yaml
hx_library.settings:
  type: config_object
  label: 'HELiX Library Settings'
  mapping:
    version:
      type: string
      label: 'Library version'
    use_cdn_fallback:
      type: boolean
      label: 'Enable CDN fallback when local files missing'
    cdn_url:
      type: string
      label: 'CDN base URL'
```

Export and import configuration across environments:

```bash
# Export on development
drush config:export

# Import on staging/production
drush config:import
```

---

## Multi-Site Setup

In a Drupal multi-site setup, you install the module once and enable it per site. All sites in the multi-site share the same module code and files, but each maintains its own configuration.

### Shared Codebase Setup

```
docroot/
├── sites/
│   ├── site-a.example.com/
│   │   └── settings.php        # Site A configuration
│   ├── site-b.example.com/
│   │   └── settings.php        # Site B configuration
│   └── default/
│       └── settings.php        # Default/shared settings
└── modules/
    └── custom/
        └── hx_library/         # Shared by all sites
```

### Enable Per Site

```bash
# Enable on Site A
drush -l https://site-a.example.com en hx_library

# Enable on Site B
drush -l https://site-b.example.com en hx_library
```

### Site-Specific Library Overrides with hook_library_info_alter

If different sites need different HELiX configurations (e.g., one site uses a CDN source, another uses local files):

```php
/**
 * Implements hook_library_info_alter().
 */
function hx_library_library_info_alter(&$libraries, $extension) {
  if ($extension !== 'hx_library') {
    return;
  }

  $config = \Drupal::config('hx_library.settings');

  // Allow per-site CDN fallback via settings.
  if ($config->get('use_cdn_fallback')) {
    $version = $config->get('version') ?? '1.1.2';
    $cdn_url = $config->get('cdn_url') ?? 'https://cdn.jsdelivr.net/npm/@helixui/library';

    $libraries['components']['js'] = [
      "{$cdn_url}@{$version}/dist/index.js" => [
        'type' => 'external',
        'attributes' => ['type' => 'module'],
        'preprocess' => FALSE,
      ],
    ];
  }
}
```

Override in a site-specific `settings.php`:

```php
// sites/site-a.example.com/settings.php
$config['hx_library.settings']['use_cdn_fallback'] = TRUE;
$config['hx_library.settings']['version'] = '1.1.2';
```

---

## Drupal 10 and 11 Compatibility

HELiX itself has no Drupal PHP version dependencies — it is entirely a JavaScript/CSS library. Drupal-side compatibility comes from the module scaffolding:

| Feature | Drupal 10 | Drupal 11 |
|---|---|---|
| `core_version_requirement: ^10 \|\| ^11` | Yes | Yes |
| Libraries API (`*.libraries.yml`) | Yes | Yes |
| `attributes: { type: module }` in libraries | Yes (since D9.3) | Yes |
| `hook_page_attachments()` | Yes | Yes |
| `hook_library_info_alter()` | Yes | Yes |
| Configuration management | Yes | Yes |
| Composer dependency management | Yes | Yes |

No conditional code or version detection is needed in the module. The same `.info.yml`, `.libraries.yml`, and hook implementations work identically on Drupal 10 and 11.

---

## Troubleshooting

### Components not rendering — module enabled but nothing appears

**Check 1:** Is the library attached?

```bash
# Inspect the rendered page source
# Look for a <script type="module" src="/modules/custom/hx_library/...">
```

If the script tag is missing, the library isn't attached. Add `{{ attach_library('hx_library/components') }}` to a Twig template or attach it globally via `mytheme.info.yml`.

**Check 2:** Are the files present?

Visit `/admin/reports/status` — the `hook_requirements()` implementation shows an error if the dist files are missing.

Or check directly:

```bash
ls -la web/modules/custom/hx_library/libraries/helix/dist/
# Should show index.js
```

**Check 3:** Clear caches.

```bash
drush cr
```

### 404 errors for `index.js`

**Cause:** The `libraries/helix/dist/index.js` file doesn't exist at the path declared in `.libraries.yml`.

**Fix:** Verify the file path matches exactly. The library definition:

```yaml
libraries/helix/dist/index.js:
```

...resolves relative to the module directory (`web/modules/custom/hx_library/`), producing the full path `web/modules/custom/hx_library/libraries/helix/dist/index.js`.

### Library files present but components unstyled

**Cause:** `attributes: { type: module }` is missing from the `.libraries.yml` definition.

**Fix:**

```yaml
components:
  version: 1.1.2
  js:
    libraries/helix/dist/index.js:
      attributes:
        type: module    # This line is required
      preprocess: false
```

### Multi-site: one site shows old version

**Cause:** Drupal caches library definitions per site. After updating the module files, each site's cache must be cleared independently.

```bash
drush -l https://site-a.example.com cr
drush -l https://site-b.example.com cr
```

---

## Updating HELiX in the Module

When a new HELiX version is available:

1. Update the library files in `libraries/helix/dist/` using whichever strategy you chose (manual copy, Composer, or module build script)
2. Update the `version` field in `hx_library.libraries.yml` to match the new version
3. Add an update hook in `hx_library.install` to clear caches
4. Run `drush updatedb && drush cr` on each site

```php
/**
 * Update HELiX library files to version 1.2.0.
 */
function hx_library_update_10002() {
  drupal_flush_all_caches();
  return t('HELiX Library updated to version 1.2.0.');
}
```

---

## Production Checklist

- [ ] Module enabled on all target sites: `drush en hx_library`
- [ ] `libraries/helix/dist/index.js` file present
- [ ] `core_version_requirement: ^10 || ^11` in `.info.yml`
- [ ] `attributes: { type: module }` in `.libraries.yml` for each JS entry
- [ ] `hook_requirements()` reports OK on `/admin/reports/status`
- [ ] Library attached in at least one theme (`mytheme.info.yml` or template)
- [ ] Components render with Shadow DOM in browser DevTools
- [ ] Configuration exported and committed: `drush config:export`
- [ ] Multi-site caches cleared on all sites after updates
- [ ] Update hooks added for future library version upgrades

---

## Next Steps

- [CDN Installation](/drupal/installation/cdn/) — Simpler approach if multi-site distribution is not required
- [npm Installation](/drupal/installation/npm/) — Per-theme build pipeline for maximum optimization
- [Getting Started](/drupal/installation/getting-started/) — Decision guide for choosing between all three approaches
