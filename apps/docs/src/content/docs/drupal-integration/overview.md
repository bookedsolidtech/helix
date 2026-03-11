---
title: Drupal Integration Overview
description: Comprehensive guide to integrating HELIX web components with Drupal CMS - architecture, approaches, compatibility, and best practices
sidebar:
  order: 1
---

HELIX is an enterprise healthcare Web Component library built with Lit 3.x, architected from the ground up for seamless integration with Drupal CMS. This guide provides a comprehensive overview of integration approaches, architectural principles, compatibility matrices, and strategic considerations for Drupal development teams.

## Integration Philosophy: Zero Coupling by Design

HELIX components are **framework-agnostic Web Components** built on web standards (Custom Elements, Shadow DOM, slots). They integrate with Drupal without requiring custom modules, PHP code modifications, or architectural coupling. This zero-dependency design provides:

- **No vendor lock-in** - Components work with any CMS, framework, or static HTML
- **Independent versioning** - Library updates don't require Drupal upgrades or vice versa
- **Progressive enhancement** - Content remains accessible and visible without JavaScript
- **Standard Web APIs** - Built on platform primitives, not proprietary abstractions
- **Future-proof architecture** - Compatible with Drupal 10, 11, and beyond

The zero-coupling philosophy means HELIX respects Drupal's content management architecture rather than replacing it. **Drupal owns content rendering; components provide structure, styling, and interactivity.**

### What Zero Coupling Means in Practice

- **No Drupal module required** - Components load via standard Drupal library system
- **No PHP dependencies** - Works with vanilla Drupal 10/11 installations
- **No custom field formatters** - Drupal's existing formatters work unchanged
- **No theme engine modifications** - Standard Twig templating throughout
- **No JavaScript framework required** - Pure Web Components with Lit as implementation detail

This is not a "Drupal integration layer" - it is a component library that happens to work exceptionally well with Drupal's architecture.

---

## Integration Approaches

HELIX supports three primary integration strategies, each optimized for different organizational needs, technical constraints, and development workflows.

### 1. CDN Integration (Fastest to Deploy)

Load components directly from a CDN with a single `<script>` tag. This is the fastest path from zero to rendering components.

**How it works:**

```yaml
# mytheme.libraries.yml
helix_cdn:
  version: VERSION
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/index.js:
      type: external
      attributes:
        type: module
```

```twig
{# page.html.twig #}
{{ attach_library('mytheme/helix_cdn') }}
```

**Strengths:**

- **Minutes to setup** - One library definition, one `attach_library()` call
- **No build pipeline** - Zero local tooling or compilation required
- **Automatic browser caching** - CDN serves compressed assets with long TTLs
- **Zero maintenance** - CDN handles availability, compression, and edge distribution
- **Perfect for prototyping** - Validate component fit before deeper integration

**Limitations:**

- **External dependency** - Requires network access to CDN (unacceptable for air-gapped environments)
- **Version control challenges** - `@latest` means unpredictable updates; pinning versions is manual
- **Larger initial payload** - Full bundle loads (~80 KB Brotli) even if page uses 2 components
- **Less control** - Cannot tree-shake unused components or customize build output
- **GDPR/compliance considerations** - External requests may require legal review in some jurisdictions

**Best for:** Prototypes, proofs of concept, small marketing sites, internal tools, rapid development cycles.

---

### 2. npm Integration (Recommended for Production)

Install via npm and integrate with your theme's build pipeline. Full control over versioning, bundling strategy, and deployment.

**How it works:**

```bash
# In your Drupal theme directory
npm install @helixui/library
```

```yaml
# mytheme.libraries.yml
helix_runtime:
  version: VERSION
  css:
    theme:
      dist/helix/tokens.css: { minified: true }
  js:
    dist/helix/lit-runtime.js:
      type: module
      minified: true
      preprocess: false

helix_button:
  version: VERSION
  js:
    dist/helix/components/hx-button/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix_runtime
```

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix_button') }}
<hx-button variant="primary" href="{{ url }}">Read More</hx-button>
```

**Strengths:**

- **Version control** - `package.json` locks library version; updates are explicit and testable
- **Tree-shaking support** - Per-component loading means pages download only what they use (14-35 KB Brotli typical)
- **Local development** - No external dependencies; works offline and in air-gapped environments
- **Custom builds** - Can create theme-specific bundles if needed
- **Performance optimization** - Granular control over what loads when (see [Per-Component Loading Strategy](/drupal-integration/per-component-loading/))
- **Drupal-native pattern** - Follows the same library model as core and contrib modules

**Limitations:**

- **Build tooling required** - Theme must have a build step (Vite, webpack, etc.)
- **Initial setup complexity** - 44+ library definitions to manage (can be automated)
- **Maintenance burden** - Must track component dependencies and keep libraries.yml in sync

**Best for:** Production sites, custom themes, enterprise environments, performance-critical applications, long-term maintainability.

---

### 3. Drupal Module Wrapper (Enterprise Governance)

A thin Drupal module that wraps the npm package and provides Drupal-native APIs: field formatters, Views plugins, Layout Builder integration, and administrative UI.

**How it works:**

```bash
composer require drupal/helix
```

The module provides:

- **Field formatters** - Render entity fields as component-wrapped output (e.g., "Render as Card" formatter for nodes)
- **Views row plugins** - Display Views results as component grids, lists, or carousels
- **Layout Builder blocks** - Drag-and-drop component insertion in Layout Builder UI
- **Configuration UI** - Admin forms for default component variants, sizes, and theme overrides
- **Single Directory Component (SDC) integration** - Components exposed as Drupal 10.1+ SDC definitions with type-safe prop validation

**Strengths:**

- **Drupal-native experience** - Content editors configure components through familiar Drupal UIs
- **Zero TWIG for editors** - Field formatters eliminate need for template-level component usage
- **Centralized configuration** - Site-wide component defaults managed in admin UI
- **Multi-site support** - Standardized component usage across dozens of Drupal sites
- **Governance layer** - Enterprise teams can enforce component usage policies via module configuration

**Limitations:**

- **Additional abstraction layer** - Module sits between Drupal and components; adds indirection
- **Module maintenance** - Must keep module in sync with library releases
- **Upgrade coupling** - Library updates may require corresponding module updates
- **Reduced flexibility** - Module opinions may conflict with site-specific needs

**Best for:** Multi-site enterprise environments (healthcare systems with 50+ sites), organizations with non-technical content editors, environments requiring centralized governance, teams with limited front-end development resources.

**Note:** The HELIX Drupal module is roadmapped but not yet released. Contact the HELIX team for early access.

---

## Architecture: Hybrid Property/Slot Pattern

HELIX uses a **hybrid integration strategy** where component APIs are determined by their position in the atomic design hierarchy. This respects Drupal's content rendering pipeline while maintaining component portability.

### The Governing Principle

> **Use properties for data. Use slots for content.**

- **Properties** - Scalar configuration values (variant, size, href, disabled, required)
- **Slots** - Drupal-rendered HTML content (media, body text, actions, metadata, form labels)

This distinction ensures:

1. Simple UI primitives remain portable and testable (property-driven atoms)
2. Content-rich components integrate seamlessly with Drupal's field system (slot-driven organisms)
3. Form components participate in Drupal's Form API via `ElementInternals` (hybrid pattern)

### Component Classification by Type

#### Atoms: Property-Driven

Simple UI primitives like `<hx-button>`, `<hx-badge>`, `<hx-icon>` accept configuration via properties and text content via the default slot. Self-contained and fully portable.

```twig
{# Property-driven: scalar configuration + text content #}
<hx-button variant="primary" size="lg" href="{{ url }}">
  {{ 'Schedule Appointment'|t }}
</hx-button>

<hx-badge variant="success" size="sm">Active</hx-badge>

<hx-icon name="chevron-right" size="24" label="Next"></hx-icon>
```

**Why properties:** Atoms have no Drupal rendering dependency. A button's variant, size, and href are simple values. The component owns all rendering logic.

#### Molecules: Balanced Mix

Components like `<hx-alert>`, `<hx-search-bar>`, `<hx-form-field>` mix properties for configuration with slots for rendered content areas.

```twig
{# Properties for config, slots for Drupal-rendered content #}
<hx-alert variant="info" dismissible>
  {{ content.message }}
</hx-alert>

<hx-search-bar
  placeholder="{{ 'Search articles...'|t }}"
  action="{{ path('view.search.page') }}"
  method="get"
>
  <button slot="submit-button" type="submit">
    {{ 'Search'|t }}
  </button>
</hx-search-bar>
```

**Why hybrid:** Configuration is scalar (property-friendly), but content passes through Drupal's text format system and requires slot projection.

#### Organisms: Slot-Dominant

Content-rich components like `<hx-card>`, `<hx-hero-banner>`, `<hx-article-layout>` use properties for metadata and slots for all Drupal-rendered content.

```twig
{# Properties for metadata, slots for all content areas #}
<hx-card
  heading="{{ node.label }}"
  href="{{ url }}"
  variant="featured"
  elevation="raised"
>
  {# Drupal's Media module renders responsive images #}
  <div slot="media">
    {{ content.field_hero_image }}
  </div>

  {# Drupal's text format renders body with filters #}
  {{ content.body }}

  {# Drupal renders taxonomy term links #}
  <div slot="meta">
    {{ content.field_tags }}
    <time datetime="{{ node.getCreatedTime()|date('c') }}">
      {{ node.getCreatedTime()|date('F j, Y') }}
    </time>
  </div>

  {# Actions slot contains Drupal-rendered links or buttons #}
  <div slot="actions">
    <hx-button variant="text" href="{{ url }}">
      {{ 'Read More'|t }}
    </hx-button>
  </div>
</hx-card>
```

**Why slots:** Drupal's field formatters, image styles, Media module output, and Paragraphs all produce HTML. Extracting raw data would bypass Drupal's rendering pipeline and break functionality.

#### Templates: Slot-Only

Page-level layouts like `<hx-page-layout>`, `<hx-article-page>` are pure structural containers. Drupal fills all regions.

```twig
{# Pure slot-based layout container #}
<hx-page-layout variant="default">
  <header slot="header">{{ page.header }}</header>
  <main slot="main">{{ page.content }}</main>
  {% if page.sidebar_first %}
    <aside slot="sidebar">{{ page.sidebar_first }}</aside>
  {% endif %}
  <footer slot="footer">{{ page.footer }}</footer>
</hx-page-layout>
```

**Why slot-only:** Templates are CSS Grid/Flexbox containers with no content knowledge. Drupal's block system fills regions.

### Form Components: ElementInternals Pattern

Form components like `<hx-text-input>`, `<hx-textarea>`, `<hx-select>` use a unique hybrid pattern:

- **`ElementInternals` for form participation** - Properties like `name`, `value`, `required`, `disabled` integrate with native `<form>` elements and Drupal's Form API
- **Slots for Drupal Form API content** - Labels, help text, and error messages render through Drupal's Form API and project into component slots

```twig
{# Form component: ElementInternals properties + Form API slots #}
<hx-text-input
  name="patient_name"
  type="text"
  required
  value="{{ form.patient_name['#default_value'] }}"
>
  <label slot="label">
    {{ form.patient_name['#title'] }}
    {% if form.patient_name['#required'] %}
      <span class="form-required" aria-hidden="true">*</span>
    {% endif %}
  </label>

  {% if form.patient_name['#description'] %}
    <div slot="help">{{ form.patient_name['#description'] }}</div>
  {% endif %}

  {% if errors.patient_name %}
    <div slot="error" role="alert">{{ errors.patient_name }}</div>
  {% endif %}
</hx-text-input>
```

This pattern ensures:

- Native HTML form submission works without JavaScript
- Drupal's Form API validation messages appear in the component
- Server-side form processing requires no changes
- Progressive enhancement: form works before component JavaScript loads

See [Form API Integration](/drupal-integration/forms/form-api/) for complete examples.

---

## Drupal Compatibility

### Supported Versions

| Drupal Version  | Support Level              | PHP Requirement | Notes                                          |
| --------------- | -------------------------- | --------------- | ---------------------------------------------- |
| **Drupal 11.x** | ✅ Full support            | PHP 8.3+        | Recommended for new projects                   |
| **Drupal 10.x** | ✅ Full support            | PHP 8.1+        | LTS through November 2026                      |
| **Drupal 9.x**  | ⚠️ Compatible but untested | PHP 8.0+        | EOL November 2023; upgrade to 10.x recommended |

HELIX has **zero Drupal core dependencies**. Components work via standard Web Component APIs that Drupal supports natively through its Twig rendering engine.

### Module Compatibility

HELIX is designed to integrate seamlessly with Drupal's most popular contributed modules:

#### Paragraphs

**Integration pattern:** Each paragraph type's template renders content into component slots.

```twig
{# paragraph--hero.html.twig #}
<hx-hero-banner
  variant="{{ content.field_variant[0]['#markup'] }}"
  overlay-opacity="0.4"
>
  <div slot="media">
    {{ content.field_background_media }}
  </div>
  <h1 slot="heading">{{ content.field_heading }}</h1>
  <div slot="cta">
    {{ content.field_cta_link }}
  </div>
</hx-hero-banner>
```

**Why it works:** Paragraph content renders through Drupal's standard pipeline, then projects into component slots. Nested paragraphs work naturally.

#### Layout Builder

**Integration pattern:** Section templates and custom blocks attach component libraries and wrap block content.

```twig
{# layout--twocol-section.html.twig #}
{{ attach_library('mytheme/helix_page_layout') }}
<hx-page-layout variant="two-column">
  <div slot="main">
    {{ content.content }}
  </div>
  <aside slot="sidebar">
    {{ content.sidebar }}
  </aside>
</hx-page-layout>
```

**Why it works:** Layout Builder's block output projects into layout component slots. Inline editing and preview work because Drupal renders the actual content.

#### Media Module

**Integration pattern:** Drupal's Media field formatter output (responsive images, video embeds, focal points) projects into component media slots.

```twig
{# Media field output goes directly into media slot #}
<hx-card heading="{{ label }}" href="{{ url }}">
  <div slot="media">
    {# Drupal's responsive image style renders <picture> element #}
    {{ content.field_hero_image }}
  </div>
  {{ content.body }}
</hx-card>
```

**Why it works:** The `<picture>` element with all responsive sources goes into the slot unchanged. Image styles, focal point, lazy loading all work as configured.

#### Views

**Integration pattern:** Views row templates use components for list item display. Views rendering pipeline is preserved.

```twig
{# views-view-unformatted--articles.html.twig #}
<div class="article-grid">
  {% for row in rows %}
    {{ attach_library('mytheme/helix_card') }}
    <hx-card
      heading="{{ row.content['#row'].title }}"
      href="{{ path('entity.node.canonical', {'node': row.content['#row'].nid}) }}"
      variant="default"
    >
      <div slot="media">
        {{ row.content['#row'].field_image }}
      </div>
      {{ row.content['#row'].body }}
    </hx-card>
  {% endfor %}
</div>
```

**Why it works:** Views renders row data, templates wrap it in components. AJAX paging, exposed filters, and contextual links all work normally.

#### Webform

**Integration pattern:** Form components use `ElementInternals` for native form participation. Drupal Form API labels and validation messages project into slots.

```twig
{# webform.html.twig #}
<hx-form action="{{ form_action }}" method="post">
  {% for element in form.elements %}
    <hx-text-input
      name="{{ element['#name'] }}"
      type="{{ element['#type'] }}"
      required="{{ element['#required'] }}"
    >
      <label slot="label">{{ element['#title'] }}</label>
      {% if element['#description'] %}
        <div slot="help">{{ element['#description'] }}</div>
      {% endif %}
    </hx-text-input>
  {% endfor %}

  <hx-button type="submit" variant="primary">Submit</hx-button>
</hx-form>
```

**Why it works:** Form components are form-associated custom elements. They participate in native form submission. Drupal's server-side validation and submission handlers require no changes.

#### Single Directory Components (SDC)

**Integration pattern:** HELIX components can be wrapped in Drupal SDC definitions for type-safe prop validation and component library integration.

```yaml
# components/card/card.component.yml
name: HELIX Card
status: stable
props:
  type: object
  properties:
    variant:
      type: string
      enum: [default, featured, compact]
      title: Card Variant
    heading:
      type: string
      title: Heading
    href:
      type: string
      format: uri
      title: Link URL
slots:
  media:
    title: Media (image or video)
  actions:
    title: Actions (CTA buttons)
```

```twig
{# components/card/card.twig #}
{{ attach_library('mytheme/helix_card') }}
<hx-card variant="{{ variant }}" heading="{{ heading }}" href="{{ href }}">
  {% if media %}
    <div slot="media">{{ media }}</div>
  {% endif %}
  {{ content }}
  {% if actions %}
    <div slot="actions">{{ actions }}</div>
  {% endif %}
</hx-card>
```

**Why it works:** The SDC wrapper provides a Drupal-native API (validation, schema, tooling) around the web component. Component logic stays in JavaScript; Drupal handles content and configuration.

---

## Key Benefits of Web Components in Drupal

### 1. Drupal's Rendering Pipeline is Preserved

Components don't bypass Drupal's architecture - they enhance it. Field formatters, image styles, text formats, render caching, and cache tags all operate as Drupal intends. Content passes through Drupal's rendering system and projects into component slots.

**What this means:**

- Field formatters work unchanged (e.g., "Trimmed" text formatter, image style formatters)
- Image styles and responsive images function as configured in Media settings
- Text formats (CKEditor output, Markdown, restricted HTML) render correctly
- Render cache and cache tags operate normally; no cache invalidation issues
- Contextual links and Layout Builder editing work in admin UI

### 2. Content Editor Experience

Because content renders through Drupal's standard pipeline, editors see accurate previews in Drupal's admin UI. There is no disconnect between admin preview and front-end display.

**What editors see:**

- Layout Builder inline editing displays actual component output
- Paragraphs preview shows real rendered content, not placeholder data
- Field widgets display formatted content as it will appear
- Quick Edit in-place editing works on slotted content

This eliminates the common problem where components require front-end preview to validate changes.

### 3. Progressive Enhancement

Before JavaScript loads, slotted content is visible in the light DOM as semantic HTML. Users on slow connections or with JavaScript disabled see meaningful content immediately. Components enhance the experience but don't block content access.

**Progressive enhancement in action:**

```html
<!-- Before component JavaScript loads -->
<hx-card>
  <img src="/image.jpg" alt="Article hero" />
  <h2>Article Title</h2>
  <p>Article summary text appears immediately.</p>
  <a href="/article">Read More</a>
</hx-card>

<!-- After component JavaScript loads -->
<hx-card>
  <!-- Now with Shadow DOM styles and interaction -->
  ...
</hx-card>
```

Users see content within milliseconds. Styling and interactivity arrive 200-500ms later as component definitions load.

### 4. Accessibility Built-In

Components implement WCAG 2.1 AA standards (HHS May 2026 mandate for healthcare). Keyboard navigation, screen reader support, focus management, and ARIA semantics are handled at the component level.

**What Drupal teams don't need to reimplement:**

- Keyboard navigation for modals, accordions, tabs, and dropdown menus
- Focus trapping and restoration
- ARIA live regions for dynamic content updates
- Screen reader announcements for state changes
- High contrast mode support
- Reduced motion preferences

Each component ships with comprehensive accessibility testing via axe-core and manual keyboard/screen reader verification.

### 5. Performance Optimization

Per-component library loading strategy means pages download only the JavaScript for components they actually render. Typical pages load 15-35 KB of component JavaScript (Brotli compressed) instead of the full ~80 KB bundle.

**Performance metrics:**

- **Typical article page:** 14-22 KB Brotli (3-5 components)
- **Complex landing page:** 35-45 KB Brotli (10-15 components)
- **Simple marketing page:** 8-15 KB Brotli (2-4 components)

See [Per-Component Loading Strategy](/drupal-integration/per-component-loading/) for detailed implementation.

---

## Trade-offs and Considerations

### Component Learning Curve

Drupal developers must learn:

1. The slot pattern (named slots vs default slot)
2. Component property APIs (which attributes are available)
3. When to use properties vs slots (the hybrid principle)
4. Library attachment strategy (per-component vs groups)

**Mitigation:** The pattern is consistent - simple components use properties, content-rich components use slots. Documentation includes comprehensive TWIG examples for every component. Storybook provides interactive property/slot exploration.

### Library Attachment Management

Unlike traditional Drupal themes where all JavaScript loads globally, HELIX requires explicit library attachment per component or via preprocess functions. This adds configuration but enables performance optimization.

**Mitigation:** Convenience library groups reduce the number of `attach_library()` calls needed. Preprocess functions can automate attachment based on content type or view mode.

### Slot Naming Contracts

Component slot names (`media`, `actions`, `heading`, `footer`) become stable API contracts. Renaming a slot is a breaking change that affects all consuming templates.

**Mitigation:** HELIX provides semantic, intuitive slot names that map to common Drupal field patterns. Slot names are documented in Storybook and the Custom Elements Manifest. Semantic versioning ensures breaking changes are communicated.

### Testing Strategy

Testing slot-driven components requires composing realistic light DOM content that mimics Drupal's output. Property-driven atoms test cleanly in isolation, but organisms require fixture content representing Drupal field rendering.

**Mitigation:** HELIX's test suite includes Drupal-like fixture generators. Component documentation includes TWIG examples that serve as integration test templates.

---

## When to Use Web Components vs Traditional Theming

### Use HELIX Components When:

- **Consistent UI patterns** - You need the same card, hero, or form across multiple content types
- **Accessibility compliance** - Required for healthcare, government, education (WCAG 2.1 AA)
- **Design system governance** - Enforceable standards across dozens of sites in a multi-site environment
- **Complex interactive patterns** - Accordions, tabs, modals, carousels with robust keyboard navigation
- **Performance budgets** - Require optimized component loading (per-component, not monolithic bundles)
- **Long-term maintainability** - Components are versioned, tested, and maintained independently of theme code

### Use Traditional Drupal Theming When:

- **Primarily prose content** - Articles, blog posts with minimal UI chrome
- **Site-specific design** - Unique layouts that won't be reused across projects
- **Limited JavaScript expertise** - Team is primarily backend Drupal developers
- **Highly variable content** - Content structure doesn't fit component patterns (e.g., highly customized field layouts)
- **Small, simple sites** - Overhead of component system isn't justified by site complexity

### Hybrid Approach (Recommended for Most Sites)

Most enterprise Drupal sites benefit from a **70/30 hybrid**:

- **70% HELIX components** for interactive UI elements:
  - Navigation, headers, footers
  - Cards, heroes, CTAs
  - Forms and form fields
  - Modals, accordions, tabs
  - Grids and layout containers

- **30% Traditional Twig/CSS** for content-heavy layouts:
  - Long-form article body content
  - Prose typography and reading experience
  - Custom editorial layouts
  - One-off landing pages

This approach leverages component benefits for UI patterns while maintaining flexibility for editorial content.

---

## Performance Considerations

### Asset Loading Strategy

HELIX supports three loading strategies:

1. **Monolithic bundle** - All components in one file (~80 KB Brotli). Fast for small sites with many components per page.
2. **Per-component loading** - Each component loads individually (14-35 KB Brotli typical). Optimal for large sites with varied page types.
3. **Group loading** - Components grouped by function (~25-35 KB per group). Balance between simplicity and optimization.

See [Per-Component Loading Strategy](/drupal-integration/per-component-loading/) for detailed analysis and recommendations.

### Caching Strategy

**Browser caching:**

- Component JavaScript: 1 year (immutable, hash-versioned)
- Design tokens CSS: 1 year (rarely changes)
- Lit runtime: 1 year (changes only on major version bumps)

**Drupal aggregation:**

- Enable CSS/JS aggregation in production
- Drupal combines per-component libraries into 2-4 aggregated files per page
- Hash-based filenames enable long cache TTLs

**CDN/Edge caching:**

- Per-component files cache independently
- Updating one component doesn't invalidate caches for others
- Cache hit rate >95% for returning visitors (with per-component loading)

### Progressive Loading

Critical above-the-fold components can use `<link rel="modulepreload">` for priority loading:

```twig
{# html.html.twig #}
<link rel="modulepreload" href="/themes/custom/mytheme/dist/helix/lit-runtime.js">
<link rel="modulepreload" href="/themes/custom/mytheme/dist/helix/components/hx-header/index.js">
<link rel="modulepreload" href="/themes/custom/mytheme/dist/helix/components/hx-hero-banner/index.js">
```

Below-the-fold components load naturally via script tags as the user scrolls.

---

## Security Considerations

### XSS Protection

HELIX components sanitize all property values and slot content to prevent XSS attacks. However, Drupal's existing XSS filtering remains the primary defense.

**Best practices:**

- Always use Drupal's `{{ }}` (escaped) syntax, not `{{ variable|raw }}` unless necessary
- Component properties are HTML attribute values - they're automatically HTML-escaped by Twig
- Slot content passes through Drupal's text format system (filtered HTML, basic HTML, etc.)

### Content Security Policy (CSP)

Web Components work with strict CSP configurations:

- No `eval()` or `new Function()`
- No inline scripts required
- All component JavaScript is external modules (`<script type="module">`)

**CSP headers for HELIX:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
```

No `'unsafe-inline'` or `'unsafe-eval'` required.

### Trusted Types

HELIX components are compatible with Trusted Types API for additional XSS protection. All dynamic HTML generation uses Lit's `html` tagged template literal, which provides trusted type semantics.

See [Security: XSS Prevention](/drupal-integration/security/xss/) for detailed guidance.

---

## Next Steps

Ready to integrate HELIX with your Drupal site?

### Quick Start Path (CDN)

1. [CDN Installation](/drupal-integration/installation/cdn/) - Load from CDN in 5 minutes
2. [Twig Fundamentals](/drupal-integration/twig/fundamentals/) - Render your first component
3. [Component Examples](/components/examples/) - Browse interactive component demos

### Production Path (npm)

1. [npm Installation](/drupal-integration/installation/npm/) - Install via npm and theme build pipeline
2. [Per-Component Loading](/drupal-integration/per-component-loading/) - Optimize JavaScript payload
3. [Library System](/drupal-integration/library-system/) - Manage component library definitions
4. [Drupal Behaviors](/drupal-integration/behaviors/) - JavaScript lifecycle integration

### Architectural Deep Dives

- [Integration Architecture (ADR-001)](/guides/drupal-integration-architecture/) - Hybrid property/slot pattern rationale
- [Loading Strategy (ADR-002)](/guides/drupal-component-loading-strategy/) - Per-component vs bundle analysis
- [Best Practices](/drupal-integration/best-practices/) - Patterns, anti-patterns, and real-world examples

### Troubleshooting

- [Common Issues](/drupal-integration/troubleshooting/common-issues/) - Debugging components not rendering, library conflicts, etc.
- [Performance Debugging](/drupal-integration/performance/overview/) - Lighthouse audits, TBT optimization

---

## Support and Community

- **GitHub Issues:** [github.com/your-org/helix/issues](https://github.com)
- **Documentation:** [helix-docs.example.com](https://example.com)
- **Drupal Slack:** #helix channel in [Drupal Slack](https://drupal.org/slack)
- **Stack Overflow:** Tag questions with `helix-web-components` and `drupal`

For enterprise support contracts, contact [enterprise@helix.example](mailto:enterprise@helix.example).
