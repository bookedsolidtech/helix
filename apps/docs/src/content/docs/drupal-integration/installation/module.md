---
title: Module-based Installation
description: Creating custom Drupal modules to distribute HELIX web components across multi-site installations
sidebar:
  order: 5
---

Module-based installation packages HELIX web components as a reusable Drupal module, providing centralized library management for enterprise multi-site deployments. This approach transforms HELIX from a theme-level asset into a site-wide resource available to all themes, modules, and custom code.

This comprehensive guide covers everything from basic module scaffolding to advanced patterns including dynamic library generation, Composer integration, update hooks, and enterprise distribution strategies.

---

## When to Use Module-Based Installation

**Best for:**

- **Multi-site installations** — Hospital systems with 10+ Drupal sites sharing component infrastructure
- **Enterprise governance** — Organizations requiring centralized version control and update management
- **Agency/vendor distribution** — Distributing HELIX to multiple clients via private Composer repositories
- **Decoupled architecture** — Separating component infrastructure from theme implementation
- **Shared hosting platforms** — Platform teams providing components to tenant sites (Acquia Site Factory, Pantheon)
- **Multiple theme environments** — Sites using different themes that share component library

**Not ideal for:**

- **Single-site custom themes** — npm integration is simpler and more direct
- **Rapid prototyping** — CDN approach is faster for POCs
- **Simple implementations** — Module overhead isn't justified for basic use cases
- **Teams unfamiliar with Drupal module development** — Steeper learning curve than theme-level integration

---

## Module-Based Approach Overview

A HELIX library module acts as a **library provider**, making web components available as Drupal library assets that any theme or module can attach. This creates a single source of truth for component versions, updates, and configuration.

**Architecture flow:**

1. Custom module defines HELIX libraries in `*.libraries.yml`
2. Module stores bundled component files in `libraries/` directory
3. Themes and modules attach HELIX libraries via standard Drupal mechanisms
4. Updates happen at module level, automatically propagating to all consumers
5. Configuration management tracks library settings across environments

**Key benefits:**

- **Version consistency** — All sites/themes use identical component versions
- **Simplified updates** — Update once at module level vs. per-theme
- **Composer integration** — Manage JavaScript dependencies alongside PHP packages
- **Configuration management** — Export/import library settings via Drupal config system
- **Reusability** — Install module on any Drupal 10/11 site without modification

---

## Module Structure and Scaffolding

### Recommended File Structure

```
web/modules/custom/hx_library/
├── hx_library.info.yml           # Module metadata
├── hx_library.libraries.yml      # Library definitions
├── hx_library.module             # Module hooks (optional)
├── hx_library.install            # Install/update hooks
├── config/
│   └── install/
│       └── hx_library.settings.yml   # Default config
├── libraries/
│   └── hx/
│       └── dist/
│           ├── hx.bundled.js         # Full bundle
│           └── components/           # Per-component builds
│               ├── hx-button.js
│               ├── hx-card.js
│               └── hx-text-input.js
├── src/
│   └── HxLibraryServiceProvider.php  # Service provider (advanced)
└── README.md                         # Module documentation
```

### Naming Conventions

**Module machine name:** Use lowercase, underscores (Drupal standard)

- ✅ `hx_library`
- ✅ `helix_components`
- ❌ `hx-library` (hyphens not allowed in PHP namespaces)
- ❌ `HxLibrary` (camelCase not Drupal convention)

**Library names:** Use hyphens, lowercase (YAML/CSS convention)

- ✅ `hx-components`
- ✅ `hx-button`
- ❌ `hx_button` (underscores less common in library names)

**File paths:** Follow Drupal's `libraries/` convention

- ✅ `libraries/hx/dist/hx.bundled.js`
- ✅ `libraries/helix/dist/components/hx-button.js`
- ❌ `js/hx.bundled.js` (wrong directory for shared libraries)

---

## Step 1: Create Module Scaffold

### Module Info File

**File:** `web/modules/custom/hx_library/hx_library.info.yml`

```yaml
name: HELIX Library
type: module
description: Provides HELIX web components for use across themes and modules in enterprise healthcare applications
core_version_requirement: ^10 || ^11
package: Healthcare Components

# Optional: Declare module dependencies
dependencies:
  - drupal:libraries

# Optional: Configure module as hidden from UI
# hidden: true
```

**Key fields explained:**

- `name` — Human-readable module name (shown in admin UI)
- `type: module` — Required (distinguishes from themes, profiles, etc.)
- `description` — Shown in module list, should explain purpose and scope
- `core_version_requirement` — Drupal 10 and 11 compatibility (^ allows minor/patch updates)
- `package` — Groups module in admin UI (use "Healthcare Components", "Custom", or organization name)
- `dependencies` — Optional, but `libraries` module helps with library management
- `hidden: true` — Optional, hides from UI if module is infrastructure-only

### Basic Module File

**File:** `web/modules/custom/hx_library/hx_library.module`

```php
<?php

/**
 * @file
 * HELIX Library module - Provides web components for healthcare applications.
 */

use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function hx_library_help($route_name, RouteMatchInterface $route_match) {
  switch ($route_name) {
    case 'help.page.hx_library':
      $output = '<h3>' . t('About') . '</h3>';
      $output .= '<p>' . t('HELIX Library provides enterprise-grade web components built with Lit for use in healthcare Drupal applications. Components are available as Drupal libraries that can be attached to themes, modules, and render arrays.') . '</p>';
      $output .= '<h3>' . t('Usage') . '</h3>';
      $output .= '<p>' . t('Attach HELIX libraries in your theme or module:') . '</p>';
      $output .= '<pre><code>';
      $output .= "// In render array\n";
      $output .= "\$build['#attached']['library'][] = 'hx_library/components';\n\n";
      $output .= "// In Twig template\n";
      $output .= "{{ attach_library('hx_library/components') }}";
      $output .= '</code></pre>';
      return $output;
  }
}

/**
 * Implements hook_library_info_alter().
 */
function hx_library_library_info_alter(&$libraries, $extension) {
  // Optional: Modify library definitions at runtime
  // Example: Swap CDN URLs based on environment
  if ($extension === 'hx_library') {
    $config = \Drupal::config('hx_library.settings');

    if ($config->get('use_cdn_fallback') && !empty($config->get('cdn_url'))) {
      // Add CDN fallback logic
    }
  }
}
```

**When to use `.module` file:**

- Implement `hook_help()` for documentation
- Use `hook_library_info_alter()` for dynamic library modification
- Add `hook_page_attachments()` for global library attachment (careful: performance impact)
- Register custom Drupal behaviors or services

**When to skip `.module` file:**

- Simple library provider with no custom logic
- All configuration in `.libraries.yml` is sufficient

---

## Step 2: Define Libraries

### Basic Library Definition

**File:** `web/modules/custom/hx_library/hx_library.libraries.yml`

```yaml
# Full bundle approach - simplest setup
components:
  version: 0.0.1
  js:
    libraries/hx/dist/hx.bundled.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - core/once
```

**Usage in theme:**

```yaml
# mytheme.info.yml
libraries:
  - hx_library/components
```

Or in Twig:

```twig
{{ attach_library('hx_library/components') }}
```

### Per-Component Libraries (Tree-Shaking Pattern)

**File:** `hx_library.libraries.yml`

```yaml
# Core utilities and shared dependencies
core:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-core.js:
      minified: true
      preprocess: false
      attributes:
        type: module

# Individual component libraries
button:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-button.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

card:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-card.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

text-input:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-text-input.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

# Form component bundle (meta-library)
forms:
  dependencies:
    - hx_library/text-input
    - hx_library/select
    - hx_library/checkbox
    - hx_library/radio-group
    - hx_library/textarea
    - hx_library/switch
```

**Usage in render array:**

```php
// Load only button component
$build['#attached']['library'][] = 'hx_library/button';

// Load all form components
$build['#attached']['library'][] = 'hx_library/forms';
```

### Hybrid Approach (Practical for Most Sites)

```yaml
# hx_library.libraries.yml

# Core foundation (always needed)
core:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-core.js:
      minified: true
      preprocess: false
      attributes:
        type: module

# Common UI components (bundled for performance)
common:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-common.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

# Heavy components loaded on-demand
data-table:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-data-table.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

chart:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-chart.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core
```

**Strategy:**

- `core` — Design tokens, shared utilities (10-15KB)
- `common` — Frequently-used components bundled together (20-30KB)
- Individual libraries for heavy/specialized components (5-15KB each)

**Theme attachment:**

```yaml
# mytheme.info.yml
libraries:
  - hx_library/common # Global load
```

```php
// mytheme.theme
function mytheme_preprocess_page(&$variables) {
  $route = \Drupal::routeMatch()->getRouteName();

  // Load data table only on specific views
  if ($route === 'view.patients.page_1') {
    $variables['#attached']['library'][] = 'hx_library/data-table';
  }
}
```

---

## Step 3: Populate Library Files

### Strategy 1: Manual Copy from npm

Install HELIX locally and copy build artifacts:

```bash
# In temporary directory
npm install @helixui/library

# Copy to module
mkdir -p web/modules/custom/hx_library/libraries/hx/dist
cp -r node_modules/@helixui/library/dist/* \
  web/modules/custom/hx_library/libraries/hx/dist/

# Verify files
ls -lh web/modules/custom/hx_library/libraries/hx/dist/
```

**Pros:**

- Simple, no build pipeline
- Complete control over files
- Works offline after initial copy

**Cons:**

- Manual update process
- No version locking (must document which version was copied)
- Larger repository size (committing vendor files)

### Strategy 2: Composer + Asset Packagist

Use Composer to manage JavaScript dependencies:

**File:** `composer.json` (project root)

```json
{
  "repositories": [
    {
      "type": "composer",
      "url": "https://asset-packagist.org"
    }
  ],
  "require": {
    "npm-asset/helix--library": "^0.0.1"
  },
  "extra": {
    "installer-paths": {
      "web/modules/custom/hx_library/libraries/hx": ["npm-asset/helix--library"]
    }
  }
}
```

**Install:**

```bash
composer require npm-asset/helix--library:^0.0.1
```

**Pros:**

- Version locking via `composer.lock`
- Automated updates via `composer update`
- Single dependency manager for PHP + JS
- No manual file copying

**Cons:**

- Requires Asset Packagist setup
- Adds Composer complexity
- Some organizations block Asset Packagist

### Strategy 3: Git Submodule (Advanced)

Reference HELIX as a Git submodule:

```bash
cd web/modules/custom/hx_library/libraries
git submodule add https://github.com/helix/library.git hx
git submodule update --init --recursive
```

**Pros:**

- Git-native version tracking
- Easy updates (`git submodule update --remote`)
- No vendor files in main repository

**Cons:**

- Team must understand Git submodules
- Deployment complexity (must clone with `--recursive`)
- Submodule pointer drift across environments

### Strategy 4: Build Pipeline in Module

Create npm build directly in module:

**File:** `web/modules/custom/hx_library/package.json`

```json
{
  "name": "hx-library-module",
  "private": true,
  "scripts": {
    "install-library": "npm install @helixui/library",
    "build": "npm run build:full && npm run build:components",
    "build:full": "cp node_modules/@helixui/library/dist/hx.bundled.js libraries/hx/dist/",
    "build:components": "cp -r node_modules/@helixui/library/dist/components/* libraries/hx/dist/components/"
  },
  "dependencies": {
    "@helixui/library": "^0.0.1"
  }
}
```

**Build and commit artifacts:**

```bash
cd web/modules/custom/hx_library
npm install
npm run build
git add libraries/hx/dist
git commit -m "Update HELIX library to 0.0.1"
```

**Pros:**

- Explicit version tracking (package.json + committed builds)
- No Composer/Asset Packagist dependency
- Simple deployment (pre-built files committed)

**Cons:**

- Committing build artifacts to Git
- Larger repository size
- Manual build step on updates

**Recommended:** Use **Strategy 2 (Composer)** for enterprise setups with Composer expertise, **Strategy 1 (Manual Copy)** for simpler environments, **Strategy 4 (Module Build)** for maximum control.

---

## Step 4: Dynamic Library Generation with `hook_library_info_build()`

For advanced use cases, generate library definitions programmatically at runtime.

### Use Case 1: Environment-Based CDN Fallback

**File:** `hx_library.module`

```php
<?php

/**
 * Implements hook_library_info_build().
 */
function hx_library_library_info_build() {
  $libraries = [];
  $config = \Drupal::config('hx_library.settings');

  // Determine source: local vs. CDN
  $use_cdn = $config->get('use_cdn') ?? FALSE;
  $version = $config->get('version') ?? '0.0.1';

  if ($use_cdn) {
    $cdn_url = $config->get('cdn_url') ?? 'https://cdn.jsdelivr.net/npm/@helixui/library';

    $libraries['components'] = [
      'version' => $version,
      'js' => [
        "{$cdn_url}@{$version}/dist/hx.bundled.js" => [
          'type' => 'external',
          'minified' => TRUE,
          'preprocess' => FALSE,
          'attributes' => [
            'type' => 'module',
            'crossorigin' => 'anonymous',
          ],
        ],
      ],
    ];
  } else {
    // Use local files
    $libraries['components'] = [
      'version' => $version,
      'js' => [
        'libraries/hx/dist/hx.bundled.js' => [
          'minified' => TRUE,
          'preprocess' => FALSE,
          'attributes' => [
            'type' => 'module',
          ],
        ],
      ],
    ];
  }

  return $libraries;
}
```

**Configuration:** `config/install/hx_library.settings.yml`

```yaml
use_cdn: false
version: '0.0.1'
cdn_url: 'https://cdn.jsdelivr.net/npm/@helixui/library'
```

**Admin UI for toggling (requires Config UI):**

```php
// In hx_library.routing.yml
hx_library.settings:
  path: '/admin/config/system/hx-library'
  defaults:
    _form: '\Drupal\hx_library\Form\SettingsForm'
    _title: 'HELIX Library Settings'
  requirements:
    _permission: 'administer site configuration'
```

### Use Case 2: Auto-Discovery of Components

Automatically generate per-component libraries by scanning directory:

```php
/**
 * Implements hook_library_info_build().
 */
function hx_library_library_info_build() {
  $libraries = [];
  $module_path = \Drupal::service('extension.list.module')->getPath('hx_library');
  $components_path = DRUPAL_ROOT . '/' . $module_path . '/libraries/hx/dist/components';

  if (is_dir($components_path)) {
    $files = scandir($components_path);

    foreach ($files as $file) {
      if (pathinfo($file, PATHINFO_EXTENSION) === 'js') {
        $component_name = pathinfo($file, PATHINFO_FILENAME);

        $libraries[$component_name] = [
          'version' => '0.0.1',
          'js' => [
            "libraries/hx/dist/components/{$file}" => [
              'minified' => TRUE,
              'preprocess' => FALSE,
              'attributes' => [
                'type' => 'module',
              ],
            ],
          ],
          'dependencies' => [
            'hx_library/core',
          ],
        ];
      }
    }
  }

  return $libraries;
}
```

**Result:** Adding `hx-modal.js` to `libraries/hx/dist/components/` automatically creates `hx_library/hx-modal` library.

### Use Case 3: Multisite-Specific Libraries

Generate different libraries per multisite:

```php
/**
 * Implements hook_library_info_build().
 */
function hx_library_library_info_build() {
  $libraries = [];

  // Detect current site (multisite)
  $site_path = \Drupal::service('site.path');
  $site_name = basename($site_path);

  // Site-specific library variants
  $libraries['components'] = [
    'version' => '0.0.1',
    'js' => [
      "libraries/hx/dist/hx.bundled.js" => [
        'minified' => TRUE,
        'preprocess' => FALSE,
        'attributes' => [
          'type' => 'module',
        ],
      ],
    ],
  ];

  // Add site-specific overrides
  if ($site_name === 'hospital_a') {
    $libraries['components']['css'] = [
      'theme' => [
        'libraries/hx/themes/hospital-a.css' => [],
      ],
    ];
  }

  return $libraries;
}
```

---

## Step 5: Dependency Management

### Internal Dependencies

HELIX components depend on each other:

```yaml
# hx_library.libraries.yml

core:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-core.js:
      attributes:
        type: module

button:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-button.js:
      attributes:
        type: module
  dependencies:
    - hx_library/core

form:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-form.js:
      attributes:
        type: module
  dependencies:
    - hx_library/core
    - hx_library/button # Form uses button
```

**Result:** Attaching `hx_library/form` automatically loads `core` and `button`.

### External Dependencies (Drupal Core)

Depend on Drupal core libraries for behaviors:

```yaml
behaviors:
  version: 0.0.1
  js:
    js/hx-behaviors.js: {}
  dependencies:
    - core/drupal # Drupal global
    - core/drupalSettings # Settings from PHP
    - core/once # Run-once utility
    - hx_library/components
```

### Third-Party Library Dependencies

For components requiring external libraries (e.g., Chart.js):

```yaml
chart:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-chart.js:
      attributes:
        type: module
  dependencies:
    - hx_library/core
    - hx_library/chartjs # External dependency

chartjs:
  version: 4.4.0
  js:
    https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js:
      type: external
      minified: true
```

**Alternative:** Include third-party libraries in module:

```yaml
chartjs:
  version: 4.4.0
  js:
    libraries/vendor/chart.js:
      minified: true
```

---

## Step 6: Installation and Update Hooks

### Install Hook

**File:** `hx_library.install`

```php
<?php

/**
 * @file
 * Install, update, and uninstall functions for HELIX Library module.
 */

use Drupal\Core\File\FileSystemInterface;

/**
 * Implements hook_install().
 */
function hx_library_install() {
  $messenger = \Drupal::messenger();
  $config = \Drupal::configFactory()->getEditable('hx_library.settings');

  // Set default configuration
  $config->set('version', '0.0.1');
  $config->set('use_cdn', FALSE);
  $config->save();

  $messenger->addStatus(t('HELIX Library installed successfully. Components are now available as Drupal libraries.'));

  // Optional: Log installation
  \Drupal::logger('hx_library')->info('HELIX Library module installed with version @version', [
    '@version' => '0.0.1',
  ]);
}

/**
 * Implements hook_uninstall().
 */
function hx_library_uninstall() {
  // Clean up configuration
  \Drupal::configFactory()->getEditable('hx_library.settings')->delete();

  \Drupal::messenger()->addStatus(t('HELIX Library uninstalled. All configuration removed.'));
}

/**
 * Implements hook_requirements().
 */
function hx_library_requirements($phase) {
  $requirements = [];

  if ($phase === 'runtime') {
    $module_path = \Drupal::service('extension.list.module')->getPath('hx_library');
    $library_path = DRUPAL_ROOT . '/' . $module_path . '/libraries/hx/dist/hx.bundled.js';

    if (file_exists($library_path)) {
      $requirements['hx_library_files'] = [
        'title' => t('HELIX Library Files'),
        'value' => t('Library files present'),
        'severity' => REQUIREMENT_OK,
      ];
    } else {
      $requirements['hx_library_files'] = [
        'title' => t('HELIX Library Files'),
        'value' => t('Library files missing'),
        'description' => t('HELIX component files not found at @path. Run `composer install` or copy files manually.', [
          '@path' => $library_path,
        ]),
        'severity' => REQUIREMENT_ERROR,
      ];
    }
  }

  return $requirements;
}
```

### Update Hooks

Manage library version updates:

```php
/**
 * Update HELIX library to version 0.0.2.
 */
function hx_library_update_9001() {
  $config = \Drupal::configFactory()->getEditable('hx_library.settings');
  $config->set('version', '0.0.2');
  $config->save();

  // Clear cache to reload library definitions
  drupal_flush_all_caches();

  return t('HELIX Library updated to version 0.0.2');
}

/**
 * Enable CDN fallback for production environments.
 */
function hx_library_update_9002() {
  $config = \Drupal::configFactory()->getEditable('hx_library.settings');

  // Only enable CDN in production
  $environment = getenv('DRUPAL_ENV') ?: 'development';
  if ($environment === 'production') {
    $config->set('use_cdn', TRUE);
    $config->set('cdn_url', 'https://cdn.jsdelivr.net/npm/@helixui/library');
  }

  $config->save();

  return t('CDN fallback configured for production environment');
}

/**
 * Migrate from full bundle to per-component libraries.
 */
function hx_library_update_9003() {
  // This update hook signals a breaking change
  // Themes must update library attachments from:
  //   hx_library/components
  // To component-specific libraries:
  //   hx_library/button, hx_library/card, etc.

  \Drupal::messenger()->addWarning(t('HELIX Library now uses per-component libraries. Update theme library attachments.'));

  return t('Switched to per-component library pattern. Review and update theme integrations.');
}
```

**Run updates:**

```bash
drush updatedb
# Or via UI: /update.php
```

---

## Step 7: Version Management

### Semantic Versioning Strategy

**File:** `config/install/hx_library.settings.yml`

```yaml
version: '0.0.1'
use_cdn: false
cdn_url: 'https://cdn.jsdelivr.net/npm/@helixui/library'
```

**Update workflow:**

1. **Patch update** (0.0.1 → 0.0.2): Bug fixes, no breaking changes

   ```bash
   # Update library files
   composer update npm-asset/helix--library

   # Update config
   drush config:set hx_library.settings version '0.0.2'

   # Clear cache
   drush cr
   ```

2. **Minor update** (0.0.x → 0.1.0): New components, backward-compatible

   ```bash
   composer update npm-asset/helix--library
   drush config:set hx_library.settings version '0.1.0'
   drush updatedb  # Run update hooks if needed
   drush cr
   ```

3. **Major update** (0.x.x → 1.0.0): Breaking changes

   ```bash
   # Test in development first
   composer require npm-asset/helix--library:^1.0.0

   # Create update hook for migration
   # See hx_library_update_9003() example above

   drush updatedb
   drush cr

   # Manually test all consuming themes
   ```

### Version Tracking in Git

**Commit message pattern:**

```bash
git commit -m "chore(hx_library): update HELIX to v0.0.2

- Security patch for hx-text-input XSS vulnerability
- Performance improvement in hx-card rendering
- No breaking changes, safe to deploy

Library files updated via Composer.
Drupal update hooks not required for this release."
```

### Changelog Documentation

**File:** `web/modules/custom/hx_library/CHANGELOG.md`

```markdown
# Changelog

All notable changes to HELIX Library module will be documented in this file.

## [0.0.2] - 2026-02-16

### Security

- Fixed XSS vulnerability in hx-text-input (HELIX-2024-001)

### Changed

- Improved hx-card rendering performance by 15%
- Updated CDN fallback logic

### Upgrade Notes

- No breaking changes
- Run `drush cr` to clear caches
- No manual theme updates required

## [0.0.1] - 2026-01-15

### Added

- Initial release
- Core components: button, card, text-input, select, checkbox
- CDN fallback support
- Drupal 10/11 compatibility
```

---

## Step 8: Configuration Management

### Exportable Configuration

**File:** `config/schema/hx_library.schema.yml`

```yaml
hx_library.settings:
  type: config_object
  label: 'HELIX Library Settings'
  mapping:
    version:
      type: string
      label: 'Library Version'
    use_cdn:
      type: boolean
      label: 'Use CDN Fallback'
    cdn_url:
      type: string
      label: 'CDN Base URL'
```

**Export configuration:**

```bash
# Export all config
drush config:export

# Config appears in config/sync/hx_library.settings.yml
```

**Import on other environments:**

```bash
# Staging/production
drush config:import
```

### Environment-Specific Configuration

**Development:** `settings.local.php`

```php
$config['hx_library.settings']['use_cdn'] = FALSE;
$config['hx_library.settings']['version'] = '0.0.1';
```

**Production:** `settings.php`

```php
if (getenv('DRUPAL_ENV') === 'production') {
  $config['hx_library.settings']['use_cdn'] = TRUE;
  $config['hx_library.settings']['cdn_url'] = 'https://cdn.jsdelivr.net/npm/@helixui/library';
}
```

---

## Complete Module Example

### Full Production-Ready Module

**File structure:**

```
web/modules/custom/hx_library/
├── hx_library.info.yml
├── hx_library.libraries.yml
├── hx_library.module
├── hx_library.install
├── config/
│   ├── install/
│   │   └── hx_library.settings.yml
│   └── schema/
│       └── hx_library.schema.yml
├── libraries/
│   └── hx/
│       └── dist/
│           ├── hx.bundled.js
│           └── components/
│               ├── hx-button.js
│               ├── hx-card.js
│               └── [more components]
├── src/
│   └── Form/
│       └── SettingsForm.php
├── composer.json
├── package.json
├── CHANGELOG.md
└── README.md
```

**File:** `hx_library.info.yml`

```yaml
name: HELIX Library
type: module
description: Enterprise healthcare web component library for Drupal
core_version_requirement: ^10 || ^11
package: Healthcare Components
dependencies:
  - drupal:libraries
configure: hx_library.settings
```

**File:** `hx_library.libraries.yml`

```yaml
# Core design tokens and utilities
core:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-core.js:
      minified: true
      preprocess: false
      attributes:
        type: module

# Common UI bundle (button, badge, alert, card)
common:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-common.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

# Form components bundle
forms:
  version: 0.0.1
  js:
    libraries/hx/dist/hx-forms.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core

# Heavy components (load on-demand)
data-table:
  version: 0.0.1
  js:
    libraries/hx/dist/components/hx-data-table.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - hx_library/core
```

**File:** `config/install/hx_library.settings.yml`

```yaml
version: '0.0.1'
use_cdn: false
cdn_url: 'https://cdn.jsdelivr.net/npm/@helixui/library'
enable_debug_mode: false
```

**File:** `README.md`

````markdown
# HELIX Library Module

Enterprise healthcare web component library for Drupal 10/11.

## Installation

### Via Composer (Recommended)

1. Add Asset Packagist repository to `composer.json`
2. Require module: `composer require custom/hx_library`
3. Enable module: `drush en hx_library`

### Manual Installation

1. Copy module to `web/modules/custom/hx_library`
2. Run `npm install` in module directory (if using package.json)
3. Enable module via UI or `drush en hx_library`

## Usage

### In Theme

Attach HELIX libraries globally:

```yaml
# mytheme.info.yml
libraries:
  - hx_library/common
```
````

### In Twig

Attach libraries conditionally:

```twig
{{ attach_library('hx_library/forms') }}

<hx-text-input name="patient_name" label="Patient Name" required></hx-text-input>
```

### In Render Array

```php
$build['#attached']['library'][] = 'hx_library/data-table';
```

## Configuration

Visit `/admin/config/system/hx-library` to configure:

- Library version
- CDN fallback settings
- Debug mode

## Updating

```bash
# Update via Composer
composer update npm-asset/helix--library

# Run database updates
drush updatedb

# Clear caches
drush cr
```

## Support

For issues, see: https://github.com/bookedsolidtech/helix/issues

````

---

## Best Practices

### 1. Version Locking

Always pin exact versions in production:

```yaml
# config/install/hx_library.settings.yml
version: '0.0.1'  # NOT '0.0.x' or 'latest'
````

### 2. Update Communication

Document breaking changes in update hooks:

```php
function hx_library_update_9004() {
  \Drupal::messenger()->addWarning(t('BREAKING CHANGE: hx-button now requires `variant` attribute. Update all templates.'));

  return t('Updated to HELIX v1.0.0 with breaking changes.');
}
```

### 3. Modular Library Design

Separate concerns:

```yaml
core: # Design tokens, utilities (always loaded)
common: # Frequent components (loaded globally)
forms: # Form-specific bundle (loaded on forms)
data-table: # Heavy component (on-demand)
```

### 4. Configuration Management

Use Drupal config for all settings (never hardcode):

```php
$config = \Drupal::config('hx_library.settings');
$version = $config->get('version');
```

### 5. Testing Before Deployment

Test updates in development:

```bash
# Development
composer require npm-asset/helix--library:^0.0.2
drush cr
# Test all consuming themes

# If tests pass, deploy to staging
# If staging tests pass, deploy to production
```

### 6. Documentation

Document all configuration in README.md, include:

- Installation steps
- Library usage examples
- Update procedures
- Troubleshooting
- Contact information

### 7. Security

Never commit sensitive data:

```yaml
# BAD
cdn_url: 'https://api-key-12345@private-cdn.com'

# GOOD (use environment variables)
cdn_url: 'https://cdn.example.com'
```

Access API keys via settings.php:

```php
$config['hx_library.settings']['cdn_auth_token'] = getenv('HX_CDN_TOKEN');
```

---

## Troubleshooting

### Components Not Loading

**Symptom:** `<hx-button>` appears unstyled

**Check:**

1. Module enabled? `drush pm:list | grep hx_library`
2. Library attached? Add `{{ attach_library('hx_library/common') }}` to Twig
3. Files present? Check `libraries/hx/dist/` exists
4. Clear cache: `drush cr`

### Library Files Missing

**Symptom:** 404 errors for `hx.bundled.js`

**Fix:**

```bash
# If using Composer
composer install

# If using manual copy
# Copy files from node_modules/@helixui/library/dist to libraries/hx/dist

# Verify
ls -la web/modules/custom/hx_library/libraries/hx/dist/
```

### Update Hooks Not Running

**Symptom:** Config not updated after running `drush updatedb`

**Fix:**

```bash
# Force update hook execution
drush updatedb --no-cache-clear

# Then clear cache
drush cr
```

### Multisite Version Conflicts

**Symptom:** Different sites show different component versions

**Fix:** Use `hook_library_info_build()` to set site-specific versions:

```php
function hx_library_library_info_build() {
  $site = basename(\Drupal::service('site.path'));
  $version = \Drupal::config("hx_library.{$site}.settings")->get('version');

  // Return site-specific library definitions
}
```

---

## Migration Paths

### From CDN to Module

1. Create `hx_library` module
2. Copy HELIX files to `libraries/hx/dist/`
3. Define libraries in `.libraries.yml`
4. Enable module: `drush en hx_library`
5. Update themes: Change `{{ attach_library('mytheme/helix-cdn') }}` to `{{ attach_library('hx_library/components') }}`
6. Remove CDN references from theme `.libraries.yml`
7. Test and deploy

### From npm (Theme) to Module

1. Create `hx_library` module
2. Move HELIX build artifacts from theme to module
3. Define module libraries
4. Enable module
5. Update theme to attach module libraries instead of theme libraries
6. Remove HELIX from theme's `package.json`
7. Remove HELIX build steps from theme
8. Test and deploy

---

## Summary

Module-based installation provides enterprise-grade HELIX distribution:

**Key Benefits:**

- Centralized version management across sites/themes
- Composer integration for automated dependency management
- Configuration management for environment-specific settings
- Update hooks for controlled migration paths
- Reusable across unlimited themes and sites

**Production Checklist:**

- [ ] Module scaffold created with `.info.yml`, `.libraries.yml`, `.install`
- [ ] Library files populated (Composer, manual, or build pipeline)
- [ ] Semantic versioning configured
- [ ] Update hooks implemented for version migrations
- [ ] Configuration schema defined
- [ ] `hook_requirements()` validates library files
- [ ] README.md documents installation and usage
- [ ] CHANGELOG.md tracks version history
- [ ] Module tested in development and staging
- [ ] Deployment procedure documented for production

**Next Steps:**

- [TWIG Patterns](/drupal-integration/twig/) — Use HELIX components in templates
- [Drupal Behaviors](/drupal-integration/behaviors/) — Integrate with Drupal JavaScript
- [Library System Deep Dive](/drupal-integration/library-system/) — Advanced library patterns
- [Troubleshooting](/drupal-integration/troubleshooting/) — Common issues and solutions

---

**Module-based installation is the foundation for enterprise HELIX deployments. For single-site custom themes, consider [npm installation](/drupal-integration/installation/npm/). For rapid prototyping, see [CDN installation](/drupal-integration/installation/cdn/).**
