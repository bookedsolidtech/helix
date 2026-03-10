---
title: Installation Methods Overview
description: Comprehensive guide to installing HELIX web components in Drupal - CDN, npm, and module approaches
order: 2
---

Choosing the right installation method for HELIX web components in your Drupal project is a critical architectural decision that affects performance, maintainability, security, and developer experience. This guide provides a comprehensive analysis of all three approaches—CDN, npm, and module—to help you make an informed decision based on your project's unique requirements.

## Installation Approaches Overview

HELIX supports three distinct installation strategies, each optimized for different project scales, team structures, and operational requirements:

1. **CDN Loading** - External script references via `libraries.yml`
2. **npm Integration** - Package manager with theme build pipeline
3. **Module Distribution** - Drupal library provider architecture

The choice between these approaches depends on factors including project scale, team expertise, deployment infrastructure, performance requirements, and long-term maintenance strategy. No single approach is universally "best"—each serves specific use cases where it excels.

## CDN Approach

### Overview

The CDN (Content Delivery Network) approach loads HELIX components from an external URL, typically a public package CDN like jsDelivr, unpkg, or CDNJS. This is the fastest path to getting components running in Drupal.

### Implementation

**Basic Setup** (`mytheme.libraries.yml`):

```yaml
hx-library:
  version: 1.0.0
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.0.0/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

**Version-Pinned Approach** (recommended over `@latest`):

```yaml
hx-library:
  version: 1.2.4
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.2.4/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

**Theme Attachment** (`mytheme.info.yml`):

```yaml
name: My Healthcare Theme
type: theme
core_version_requirement: ^10 || ^11
libraries:
  - mytheme/hx-library
```

**Per-Component CDN Loading** (tree-shaking alternative):

```yaml
hx-button:
  version: 1.2.4
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.2.4/dist/components/hx-button.js:
      type: external
      attributes:
        type: module

hx-card:
  version: 1.2.4
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.2.4/dist/components/hx-card.js:
      type: external
      attributes:
        type: module
```

### Advantages

**Speed of Implementation**: CDN is the fastest installation method, requiring only YAML configuration. No build tools, no npm, no asset compilation. Ideal for rapid prototyping, proof-of-concept work, or quick demos.

**Zero Build Pipeline**: No need for Node.js, npm, Webpack, Vite, or any front-end build tooling. This reduces complexity for teams without dedicated front-end engineers.

**Automatic Browser Caching**: Popular CDNs like jsDelivr serve assets with aggressive caching headers. If users have visited other sites using the same CDN URL, the library may already be cached locally, resulting in zero additional download time.

**Geographic Distribution**: CDN providers use globally distributed edge servers, reducing latency for international users. A user in Australia receives assets from an edge node near Sydney, not from your origin server.

**Bandwidth Offloading**: CDN traffic doesn't count against your hosting bandwidth limits, reducing infrastructure costs.

### Disadvantages

**External Dependency Risk**: Your site's functionality depends on a third-party service. If the CDN experiences an outage, DNS issues, or gets blocked by corporate firewalls, components fail to load. This is a **single point of failure** outside your control.

**Security Concerns**: Loading executable code from external domains introduces supply chain risk. While reputable CDNs use Subresource Integrity (SRI) hashes and HTTPS, you're trusting their security practices. Enterprise security audits often flag external dependencies.

**Privacy Compliance**: CDN requests may send user data (IP addresses, user agents, referers) to third-party servers, potentially violating GDPR, HIPAA, or other privacy regulations in healthcare contexts. Patient-facing applications may not be permitted to make external requests.

**Version Management Complexity**: Using `@latest` creates unpredictable updates—your site could break when HELIX releases a breaking change. Using pinned versions requires manual updates across all environments.

**Asset Aggregation Limitations**: Drupal's asset aggregation system cannot optimize external scripts. They load as separate requests, preventing bundle optimization.

**HTTP/2 Connection Overhead**: Even with browser caching, the browser must establish a separate connection to the CDN (DNS lookup, TLS handshake), adding 50-200ms of latency on first page load.

**No Offline Development**: Developers cannot work without internet access. Local development environments require network connectivity.

**Performance Unpredictability**: While CDNs are generally fast, performance can vary based on geographic location, CDN health, and network conditions. You have no control over response times.

### Use Cases

- **Prototyping and POCs**: Quick demos to stakeholders
- **Small internal sites**: Intranets with minimal traffic
- **Documentation sites**: Non-critical applications
- **Temporary implementations**: Bridge solutions during migrations

### Anti-Patterns

**Do NOT use CDN for**:

- HIPAA-compliant patient portals
- Sites requiring 99.9%+ uptime SLAs
- Enterprise production environments
- Sites behind restrictive corporate firewalls
- Applications requiring deterministic performance

## npm Approach

### Overview

The npm approach installs HELIX as a package dependency in your theme's `package.json`, then builds it into your theme's JavaScript bundle using a build tool like Webpack, Vite, Rollup, or Parcel. This is the **recommended approach for custom theme development**.

### Implementation

**Installation**:

```bash
cd web/themes/custom/mytheme
npm install @helixui/library --save
```

**Import in Theme JavaScript** (`src/js/theme.js`):

```javascript
// Import entire library
import '@helixui/library';

// Alternative: Import only needed components (tree-shaking)
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-text-input';
```

**Vite Build Configuration** (`vite.config.js`):

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/js',
    lib: {
      entry: resolve(__dirname, 'src/js/theme.js'),
      formats: ['es'],
      fileName: 'theme',
    },
    rollupOptions: {
      output: {
        manualChunks: {
          helix: ['@helixui/library'],
        },
      },
    },
  },
});
```

**Library Declaration** (`mytheme.libraries.yml`):

```yaml
global:
  version: VERSION
  js:
    dist/js/theme.js:
      attributes:
        type: module
      preprocess: false
  dependencies:
    - core/once
```

**Webpack Alternative** (`webpack.config.js`):

```javascript
module.exports = {
  entry: './src/js/theme.js',
  output: {
    filename: 'theme.js',
    path: path.resolve(__dirname, 'dist/js'),
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        helix: {
          test: /[\\/]node_modules[\\/]@helix[\\/]/,
          name: 'helix',
          chunks: 'all',
        },
      },
    },
  },
};
```

**Package.json Scripts**:

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "prod": "vite build --mode production"
  },
  "dependencies": {
    "@helixui/library": "^1.2.4"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

### Advantages

**Complete Control**: You own the entire asset pipeline. Version updates, build optimization, and asset structure are all under your team's control.

**Tree-Shaking**: Import only the components you use. If your site uses 5 of 20 components, you only ship those 5. This can reduce bundle size by 60-80% compared to full bundle loading.

**Build-Time Optimization**: Modern bundlers apply minification, code splitting, tree-shaking, and compression at build time. Assets are optimized once, served thousands of times.

**Asset Aggregation**: Drupal can aggregate your built JavaScript with other theme/module scripts, reducing HTTP requests.

**Version Locking**: `package-lock.json` ensures identical library versions across development, staging, and production. No surprises from CDN auto-updates.

**Offline Development**: Once installed, developers work entirely offline. No internet dependency for local development.

**Custom Bundling**: Combine HELIX with other npm packages (date pickers, charting libraries, utilities) into optimized bundles.

**Source Map Support**: Debug minified code in production using source maps that map back to original source.

**Monorepo Compatibility**: Works seamlessly with modern monorepo tools like Turborepo, Nx, or Lerna if your organization uses them.

### Disadvantages

**Build Pipeline Requirement**: You must set up and maintain a Node.js build pipeline. This adds complexity for teams unfamiliar with modern JavaScript tooling.

**Developer Skill Requirement**: Requires understanding of npm, package.json, bundlers (Webpack/Vite), ES modules, and build configuration. Steep learning curve for traditional Drupal/PHP teams.

**Build Time Overhead**: Every code change requires rebuilding assets. While watch mode helps during development, build times can grow to 10-30 seconds on large themes.

**Deployment Complexity**: Your deployment pipeline must run `npm install` and `npm run build` before deploying. Missing this step breaks the site.

**Node.js Infrastructure**: Requires Node.js on developer machines and CI/CD servers. Adds another runtime to manage.

**Dependency Management**: You're responsible for updating HELIX and resolving npm dependency conflicts. This requires ongoing maintenance.

**Disk Space**: `node_modules` can exceed 500MB for even modest projects. Multiplied across multiple environments, this adds storage overhead.

**Cache Invalidation**: Drupal's `VERSION` placeholder in libraries.yml doesn't auto-update. You must manually increment versions or use file hashing to bust browser caches.

### Use Cases

- **Custom theme development**: Bespoke themes for healthcare systems
- **Design system integration**: Themes consuming multiple component libraries
- **Performance-critical applications**: Sites requiring optimized bundles
- **Large development teams**: Teams with dedicated front-end engineers
- **Multi-environment workflows**: Projects with dev/stage/prod pipelines

### Best Practices

**Version Pinning**:

```json
{
  "dependencies": {
    "@helixui/library": "1.2.4"
  }
}
```

Use exact versions (not `^1.2.4` or `~1.2.4`) to prevent unexpected updates.

**Cache Busting via File Hashing**:

```yaml
global:
  version: 1.x
  js:
    dist/js/theme.[hash].js: {}
```

Or use Drupal's file modification timestamp:

```yaml
global:
  version: 1.x
  js:
    dist/js/theme.js: {}
  dependencies:
    - core/drupal
```

**Watch Mode During Development**:

```bash
npm run dev
```

Automatically rebuilds on file changes.

## Module Approach

### Overview

The module approach creates a Drupal module that provides HELIX as a reusable library, making it available to all themes and modules site-wide. This is the **recommended approach for enterprise multi-site installations**.

### Implementation

**Module Structure**:

```
web/modules/custom/helix_library/
├── helix_library.info.yml
├── helix_library.libraries.yml
├── libraries/
│   └── helix/
│       └── dist/
│           └── helix.bundled.js
```

**Module Info File** (`helix_library.info.yml`):

```yaml
name: HELIX Library
type: module
description: Provides HELIX web components for use across themes and modules
core_version_requirement: ^10 || ^11
package: Custom
```

**Library Definition** (`helix_library.libraries.yml`):

```yaml
components:
  version: 1.2.4
  js:
    libraries/helix/dist/helix.bundled.js:
      attributes:
        type: module
      preprocess: false
  dependencies:
    - core/once
```

**Programmatic Attachment** (in theme or module):

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  $attachments['#attached']['library'][] = 'helix_library/components';
}
```

**Composer-Based Distribution** (`composer.json`):

```json
{
  "name": "myorg/helix_library",
  "type": "drupal-module",
  "require": {
    "drupal/core": "^10 || ^11"
  },
  "extra": {
    "installer-paths": {
      "libraries/helix": ["npm-asset/helix--library"]
    }
  }
}
```

**Asset Packagist Integration**:

```json
{
  "repositories": [
    {
      "type": "composer",
      "url": "https://asset-packagist.org"
    }
  ],
  "require": {
    "npm-asset/helix--library": "^1.2.4"
  }
}
```

**Conditional Loading** (render array):

```php
$build['#attached']['library'][] = 'helix_library/components';
```

### Advantages

**Site-Wide Availability**: Once installed, all themes and modules can use HELIX without individual setup. Ideal for multi-site or multi-theme environments.

**Centralized Version Management**: Update HELIX once at the module level, and all consuming themes automatically receive the update. Eliminates version drift across themes.

**Composer Integration**: Combine with Asset Packagist to manage JavaScript dependencies via Composer, maintaining a single dependency management tool for both PHP and JavaScript.

**Decoupled from Themes**: Themes can be swapped, disabled, or updated without reinstalling HELIX. The library persists independently.

**Granular Control**: Attach libraries only where needed using render arrays or hooks, reducing unused code delivery.

**Enterprise Distribution**: Package the module in a private Composer repository for distribution across multiple projects or clients.

**Configuration Management**: Library settings can be exported via Drupal's configuration management system.

**Update Path**: Use Drupal's update system to manage library upgrades, providing a familiar workflow for site administrators.

### Disadvantages

**Higher Initial Complexity**: Requires creating a custom module, understanding Drupal's library system, and configuring asset paths. Higher barrier to entry than CDN or npm.

**Deployment Coordination**: Library updates require module updates, which may involve database updates, cache clearing, and configuration imports. More deployment steps than updating a theme.

**Module Maintenance Overhead**: You're now maintaining a custom module, which must be tested, documented, and supported across Drupal versions.

**Asset Path Complexity**: Files must be placed in `libraries/`, `modules/custom/*/libraries/`, or managed via Composer installer paths, requiring careful configuration.

**Potential for Overuse**: If attached globally (e.g., via `hook_page_attachments`), components load on every page even if unused, increasing bundle size unnecessarily.

**Composer Configuration**: Integrating npm packages via Asset Packagist requires modifying `composer.json` repositories, which may conflict with organizational Composer policies.

**Version Conflicts**: If multiple modules depend on different HELIX versions, Composer resolution can fail, requiring manual conflict resolution.

### Use Cases

- **Multi-site installations**: Hospital systems with 10+ Drupal sites
- **Agency/vendor distribution**: Agencies deploying HELIX to multiple clients
- **Enterprise governance**: Organizations requiring centralized library management
- **Shared hosting platforms**: Platform teams providing components to tenant sites
- **Acquia Site Factory**: Multi-tenant environments

### Best Practices

**Use Configuration for Version Tracking**:

```yaml
# helix_library.settings.yml
version: 1.2.4
cdn_fallback: true
```

**Provide Uninstall Hook**:

```php
/**
 * Implements hook_uninstall().
 */
function helix_library_uninstall() {
  // Clean up any configuration or state.
}
```

**Add Update Hooks for Library Upgrades**:

```php
/**
 * Update HELIX library to version 1.3.0.
 */
function helix_library_update_9001() {
  // Clear cache to reload new library files.
  drupal_flush_all_caches();
}
```

## Comparison Matrix

| Criterion                 | CDN                 | npm                    | Module                  |
| ------------------------- | ------------------- | ---------------------- | ----------------------- |
| **Setup Time**            | Minutes             | Hours                  | Days                    |
| **Developer Skill**       | Low (YAML)          | Medium (npm, bundlers) | High (Drupal, Composer) |
| **Build Pipeline**        | None                | Required               | Optional                |
| **Bundle Size Control**   | Limited             | Excellent              | Good                    |
| **Version Control**       | Manual              | Lockfile               | Module version          |
| **Offline Development**   | No                  | Yes                    | Yes                     |
| **Multi-Site**            | Per-site setup      | Per-theme setup        | One-time setup          |
| **Security Posture**      | External dependency | Internal, reviewed     | Internal, reviewed      |
| **HIPAA Compliance**      | Risky               | Compliant              | Compliant               |
| **Performance Control**   | Low                 | High                   | Medium                  |
| **Cache Management**      | CDN-controlled      | Build-controlled       | Drupal-controlled       |
| **Deployment Complexity** | Minimal             | Moderate (npm build)   | High (module deploy)    |
| **Update Frequency**      | Immediate (risk)    | Controlled             | Controlled              |
| **Tree-Shaking**          | No (or manual)      | Yes                    | No (or manual)          |
| **Drupal Aggregation**    | No                  | Yes                    | Yes                     |
| **Maintenance Overhead**  | Low                 | Medium                 | High                    |

## Decision Tree

Use this decision tree to determine the best approach for your project:

### Start Here: What is your project type?

**Prototype, POC, or demo?**
→ **Use CDN**. Speed matters more than production concerns.

**Small site (<10 pages), internal/non-critical?**
→ **Use CDN**. Simplicity outweighs external dependency risk.

**Custom theme development?**
→ Continue to next question.

### Do you have front-end build expertise?

**No** (PHP/Drupal-only team):
→ **Use Module approach**. Avoids npm/bundler complexity.

**Yes** (modern JavaScript team):
→ **Use npm approach**. Maximizes control and optimization.

### Is this a multi-site installation?

**Yes** (5+ sites):
→ **Use Module approach**. Centralized management scales better.

**No** (single site):
→ **Use npm approach** (custom theme) or **Module approach** (contrib theme).

### Is this a healthcare/HIPAA-compliant application?

**Yes**:
→ **Do NOT use CDN**. Use npm or Module approach.

**No**:
→ Any approach is viable based on other criteria.

### Performance Requirements

**High performance critical** (Lighthouse score >95):
→ **Use npm approach** with tree-shaking and code splitting.

**Standard performance** acceptable:
→ Any approach works.

### Team and Infrastructure

**Have CI/CD pipeline with Node.js support?**
→ **npm approach** is well-supported.

**No CI/CD or only PHP-based pipeline?**
→ **Module approach** fits existing infrastructure.

**Multiple teams/vendors contributing?**
→ **Module approach** centralizes library, reducing coordination.

## Performance Implications

### Load Time Analysis

**CDN Approach**:

- DNS lookup: 20-50ms
- TLS handshake: 50-100ms
- Download time: 100-300ms (first visit)
- Total first load: ~200-450ms
- Subsequent loads: 0ms (browser cache) or 50-150ms (CDN cache)

**npm Approach** (optimized):

- Bundled with theme JavaScript: +0ms overhead
- Tree-shaken bundle: 40-60% smaller than full library
- Compressed and minified: 70-80% size reduction
- Served from same origin: No extra connection overhead
- Total first load: ~100-200ms (combined theme bundle)

**Module Approach**:

- Similar to npm if using Composer + Asset Packagist
- Slightly slower than npm if loading full bundle without tree-shaking
- Total first load: ~150-250ms

### Bundle Size Comparison

Example: Site using 5 of 20 components

| Approach               | Size (min+gzip) | Components Loaded    |
| ---------------------- | --------------- | -------------------- |
| CDN (full bundle)      | 48KB            | All 20               |
| npm (tree-shaken)      | 18KB            | Only 5               |
| Module (full bundle)   | 48KB            | All 20               |
| Module (per-component) | 22KB            | Only 5 + shared code |

### HTTP/2 Considerations

With HTTP/2 multiplexing, loading multiple small component files is nearly as fast as loading one large bundle. This makes per-component loading viable:

**Per-Component npm Build**:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      input: {
        'hx-button': 'src/components/hx-button.js',
        'hx-card': 'src/components/hx-card.js',
        'hx-text-input': 'src/components/hx-text-input.js',
      },
    },
  },
};
```

This generates separate files that can be conditionally loaded, combining tree-shaking benefits with flexibility.

## Maintenance Considerations

### Update Frequency

**CDN**:

- Pinned version: Manual updates across all environments
- `@latest`: Automatic but risky (breaking changes)

**npm**:

- Run `npm update @helixui/library`
- Review changelog, test, rebuild, deploy
- Controlled timeline

**Module**:

- Update module code or Composer dependency
- Run database updates
- Clear caches
- Deploy via Drupal's update workflow

### Long-Term Maintenance

**CDN** requires:

- Monitoring CDN health
- Tracking library version across sites
- Manual YAML updates

**npm** requires:

- Keeping build tools updated (Vite, Webpack)
- Managing `node_modules` size
- Resolving dependency conflicts
- Maintaining build configuration

**Module** requires:

- Drupal version compatibility testing
- Update hooks for library upgrades
- Configuration management
- Module documentation for site builders

## Recommended Approach by Scenario

### Scenario 1: Healthcare Portal (Patient-Facing)

**Requirements**: HIPAA compliance, 99.9% uptime, high performance

**Recommendation**: **npm approach**

- No external dependencies (compliance)
- Tree-shaking for optimal performance
- Full control over security updates

### Scenario 2: Hospital System (10 Sites)

**Requirements**: Consistency across sites, centralized management

**Recommendation**: **Module approach**

- Deploy once, use everywhere
- Single source of truth for versions
- Update coordination across sites

### Scenario 3: Marketing Microsite

**Requirements**: Fast development, short-lived project

**Recommendation**: **CDN approach**

- Minimal setup overhead
- No build pipeline needed
- External dependency acceptable for low-stakes project

### Scenario 4: Custom Theme for Large Academic Medical Center

**Requirements**: Custom design, performance optimization, dedicated dev team

**Recommendation**: **npm approach**

- Full control over bundle optimization
- Integration with existing theme build pipeline
- Tree-shaking for unused components

### Scenario 5: Acquia Site Factory Multi-Tenant Platform

**Requirements**: Shared library across tenants, version governance

**Recommendation**: **Module approach**

- Platform team maintains central module
- Tenants consume via standard Drupal library system
- Configuration management for tenant-specific settings

### Scenario 6: Agency Building Multiple Client Sites

**Requirements**: Reusable across clients, easy updates

**Recommendation**: **Module approach** (packaged via Composer)

- Distribute private Composer package to clients
- Clients install via `composer require`
- Standardized update path

## Migration Paths

### CDN to npm

1. Install library: `npm install @helixui/library`
2. Import in theme JavaScript
3. Build theme assets
4. Update `libraries.yml` to reference built files
5. Remove CDN references
6. Test and deploy

**Downtime**: None (parallel deployment possible)

### CDN to Module

1. Create custom module structure
2. Download library files to `libraries/helix/`
3. Create `libraries.yml` in module
4. Enable module
5. Update theme to depend on module library
6. Remove CDN references
7. Test and deploy

**Downtime**: None (parallel deployment possible)

### npm to Module

1. Create module structure
2. Move library files to module's `libraries/` directory
3. Create module's `libraries.yml`
4. Enable module
5. Update theme to use module library instead of built assets
6. Remove npm dependency and build step
7. Test and deploy

**Downtime**: None (swap at deployment time)

### Module to npm

1. Add `@helixui/library` to theme's `package.json`
2. Import in theme JavaScript
3. Set up build pipeline
4. Build theme assets
5. Update theme's `libraries.yml`
6. Disable module
7. Test and deploy

**Downtime**: None (parallel deployment possible)

## Next Steps

### If You Chose CDN

1. [CDN Installation Guide](/drupal-integration/installation/cdn/) - Detailed setup
2. [Version Pinning Best Practices](/drupal-integration/installation/cdn/#version-pinning)
3. [CDN Fallback Strategies](/drupal-integration/troubleshooting/#cdn-failures)

### If You Chose npm

1. [npm Installation Guide](/drupal-integration/installation/npm/) - Full build pipeline setup
2. [Vite Configuration](/drupal-integration/installation/npm/#vite-setup)
3. [Tree-Shaking Guide](/drupal-integration/installation/npm/#tree-shaking)

### If You Chose Module

1. [Module Installation Guide](/drupal-integration/installation/module/) - Module creation
2. [Composer Integration](/drupal-integration/installation/module/#composer-setup)
3. [Multi-Site Configuration](/drupal-integration/installation/module/#multi-site)

### Common Next Steps

- [TWIG Patterns](/drupal-integration/twig/) - Using components in templates
- [Drupal Behaviors](/drupal-integration/behaviors/) - JavaScript integration
- [Troubleshooting](/drupal-integration/troubleshooting/) - Common issues

---

## Sources

Research for this guide was informed by current Drupal community best practices:

- [Adding assets (CSS, JS) to a Drupal theme via \*.libraries.yml](https://www.drupal.org/docs/develop/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml)
- [Using Drupal 10's Asset Library to streamline asset handling](https://www.specbee.com/blogs/drupal-10s-asset-library-to-streamline-asset-handling)
- [Best practices for handling external libraries in Drupal](https://www.drupal.org/project/documentation/issues/2605130)
- [Four ways to add third-party Javascript libraries to Drupal](https://www.rapiddg.com/article/four-ways-add-third-party-javascript-libraries-drupal)
- [A Guide to Loading External JavaScript in Drupal](https://www.bounteous.com/insights/2020/04/22/guide-loading-external-javascript-drupal/)
- [Drupal Module And Theme Optimization Best Practices](https://loadforge.com/guides/drupal-module-and-theme-optimization-best-practices)
- [Smarter Theming: Single Directory Components in Drupal](https://www.drupalhelps.com/tip/smarter-theming-single-directory-components-drupal)
