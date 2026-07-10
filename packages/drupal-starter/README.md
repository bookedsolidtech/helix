# @helixui/drupal-starter

Drupal starter kit for [HELiX](https://github.com/bookedsolidtech/helix) enterprise healthcare web components. Includes pre-built SDC compositions, standalone Twig templates, Drupal behaviors, theme token overrides, and a module file for per-page asset loading.

## What This Package Provides

| Directory | Contents |
|-----------|----------|
| `components/` | 72 SDC (Single Directory Component) scaffolds. Most are marked `experimental` in their `.component.yml` schema — review each one before relying on it for production output. |
| `templates/` | Standalone Twig templates for hx-button, hx-card, hx-text-input, hx-form |
| `js/` | Drupal behaviors for interactive components and form integration |
| `css/` | Theme token override template and form layout styles |
| `helixui.libraries.yml` | Per-component Drupal library definitions for the top-level `hx-*` tags. CEM-listed child custom elements (e.g. `hx-tab-panel`, `hx-accordion-item`) ship inside their parent's bundle and do not get separate library entries. |
| `helixui.module` | Module hooks for asset loading, CDN switching, and theme registration |
| `helixui.info.yml` | Drupal module metadata (Drupal 10.1+ / 11.0+) |

## Requirements

- Drupal 10.1+ or 11.0+ (SDC support required)
- `@helixui/library` (workspace tracks the current 3.x release; pin to the version you've tested in your theme)
- The `sdc` core module enabled (for SDC compositions)

## Installation

```bash
npm install @helixui/drupal-starter
```

Copy into your Drupal installation:

```bash
# As a custom module
cp -r node_modules/@helixui/drupal-starter/ modules/custom/helixui/

# Or as part of your theme
cp -r node_modules/@helixui/drupal-starter/ themes/custom/mytheme/
```

Enable the module:

```bash
drush en helixui
drush cr
```

## Asset Loading Strategy

HELiX uses Drupal's library system for per-page component loading. Each web component has its own library entry in `helixui.libraries.yml`, and SDC templates declare their dependencies via `attach_library()`. Drupal deduplicates automatically.

### Strategy 1: Local Files (recommended for production)

Place the `@helixui/library` distribution at `/libraries/helixui/`. Copy the package's
`dist/` tree **and** the top-level `fouc.css` (the pre-upgrade flash-of-unstyled-content
guard) — both are referenced by the default `helixui.libraries.yml`:

```
web/libraries/helixui/
  fouc.css
  dist/
    index.js
    css/helix-tokens.css
    css/helix-core.css
    components/hx-button/index.js
    components/hx-card/index.js
    …
```

### Strategy 2: CDN

Set the CDN URL in `settings.php` and the module's `hook_library_info_alter()` rewrites all local paths to CDN URLs:

```php
// settings.php — point at the package root on the CDN. The module's
// asset rewrite appends per-file paths (dist/index.js, fouc.css, …)
// itself; don't include /dist in the CDN URL or you'll get
// duplicate /dist/dist/ paths in the rendered <script> srcs.
$settings['helixui_cdn_url'] = 'https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2';
```

Or via environment variable:

```bash
export HELIXUI_CDN_URL=https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2
```

### Strategy 3: Per-Route Loading

The `helixui.module` file demonstrates conditional library attachment based on the current route. Edit `helixui_page_attachments_alter()` to load component bundles only on pages that need them:

```php
// Load form components only on node add/edit pages.
if (in_array($route_name, ['node.add', 'entity.node.edit_form'])) {
  $attachments['#attached']['library'][] = 'helixui/hx-text-input';
  $attachments['#attached']['library'][] = 'helixui/hx-select';
  $attachments['#attached']['library'][] = 'helixui/hx-button';
}
```

## Twig Templates

### SDC Usage (compositions)

SDCs compose multiple HELiX components into Drupal content patterns. Use the SDC include syntax:

```twig
{% include 'helixui:article-teaser' with {
  title: node.label,
  body: node.field_body.value|striptags|truncate(150),
  image_url: file_url(node.field_image.entity.uri.value),
  image_alt: node.field_image.alt,
  author_name: node.uid.entity.name.value,
  date: node.created.value|date('M j, Y'),
  url: path('entity.node.canonical', {'node': node.id}),
} %}
```

### Standalone Templates (individual components)

The `templates/` directory provides theme-level templates for individual HELiX components. Register them via `hook_theme()` (already implemented in `helixui.module`):

```twig
{# Render an hx-button via the theme system #}
{{ include('@helixui/hx-button', {
  variant: 'primary',
  size: 'md',
  content: 'Schedule Appointment',
  icon_start: 'calendar',
}) }}

{# Render an hx-card #}
{{ include('@helixui/hx-card', {
  variant: 'featured',
  elevation: 'raised',
  heading: node.label,
  body: node.field_body.value,
  image_url: file_url(node.field_image.entity.uri.value),
  url: path('entity.node.canonical', {'node': node.id}),
}) }}
```

### Direct Markup (simplest)

HELiX web components are standard HTML custom elements. Use them directly in any Twig template:

```twig
{{ attach_library('helixui/hx-button') }}
<hx-button variant="primary" hx-size="md">Book Now</hx-button>
```

## Form Integration

HELiX form components participate in native HTML form submission via `ElementInternals`. They work with standard `<form>` elements without JavaScript glue code.

### In Drupal Form API Templates

Override a form element template to use HELiX components:

```twig
{# templates/form-element--textfield.html.twig #}
{{ attach_library('helixui/hx-text-input') }}
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  value="{{ element['#value'] }}"
  {% if element['#required'] %}required{% endif %}
  {% if element['#errors'] %}error="{{ element['#errors']|render|striptags }}"{% endif %}
></hx-text-input>
```

### Form Behaviors

`js/helixui-form-behaviors.js` provides Drupal behaviors for:

- **Form validation**: Maps Drupal server-side error messages to `hx-text-input` error attributes
- **AJAX form rebuild**: Syncs values between HELiX components and hidden Drupal form elements
- **Conditional fields**: Show/hide fields based on other field values (similar to `#states`)
- **Inline validation**: Real-time validation feedback on blur

Load form behaviors on pages with forms:

```yaml
# In your theme's .libraries.yml
my-forms:
  dependencies:
    - helixui/helixui-form-behaviors
    - helixui/helix-form-layout
```

## Theme Token Overrides

HELiX components use CSS custom properties (`--hx-*`) as their theming API. The canonical
token names live in `@helixui/tokens` — override the **action / surface / text / border**
semantic tokens that components consume, not invented flat aliases like `--hx-color-primary`.
For colour swaps, prefer `HelixBrandRegistry.register()` (atomic 22-token ramp) over individual
overrides:

```css
/* In your theme CSS */
:root {
  /* Real semantic action surface (resolves through to primary-700 on Apex). */
  --hx-color-action-primary-bg: #0057b8;
  --hx-color-action-primary-bg-hover: #004a9e;
  /* Canonical typography family token (canonical: -sans / -mono / -serif). */
  --hx-font-family-sans: 'Open Sans', sans-serif;
  /* Canonical border-radius token (canonical: --hx-border-radius-*). */
  --hx-border-radius-md: 0.375rem;
}
```

The `css/helix-theme-overrides.css` file ships a partial commented template covering common
override hooks — it is not exhaustive. The complete token surface lives in
`@helixui/tokens`'s exported CSS; copy this template into your theme and uncomment the values
you want to override, then consult the tokens package for any handle this template doesn't
list.

### Dark Mode

Override tokens inside a media query or a theme class. Real token names: `surface-default`,
`text-primary`, `border-default`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-surface-default: #1a1a2e;
    --hx-color-text-primary: #e2e8f0;
    --hx-color-border-default: #2d3748;
  }
}
```

## Drupal Behaviors

All interactive behaviors use the `once()` pattern for safe re-execution during AJAX page loads, Layout Builder previews, and XB rendering.

### General Behaviors (`js/helixui-behaviors.js`)

| Behavior | Purpose |
|----------|---------|
| `helixuiCarousel` | Wires consumer-defined autoplay state for carousel SDCs (hx-carousel exposes the slide-management surface; this behavior toggles autoplay on top of it) |
| `helixuiMobileDrawer` | Drawer open/close state and body scroll locking |
| `helixuiSearchForm` | Keyboard shortcut (/) to focus search input |
| `helixuiNewsletterSignup` | Client-side empty-value guard before form submission (no email-format validation — that's the server's job) |
| `helixuiShareButtons` | Opens share links in centered popup windows |
| `helixuiSidebarNav` | Expand/collapse for sidebar navigation groups |

### Form Behaviors (`js/helixui-form-behaviors.js`)

| Behavior | Purpose |
|----------|---------|
| `helixuiFormValidation` | Maps Drupal server error messages to HELiX input error attributes |
| `helixuiFormAjax` | Syncs HELiX component values with hidden Drupal form elements |
| `helixuiConditionalFields` | Show/hide fields based on other field values |
| `helixuiInlineValidation` | Real-time required/email/pattern validation on blur |

## SDC Categories

### Composition SDCs (content patterns)

| Category | Count | SDCs |
|----------|-------|------|
| Node Display | 5 | article-teaser, article-full, recipe-card, recipe-full, landing-page |
| Views/Lists | 4 | views-grid, views-list, views-carousel, topic-landing |
| Navigation | 4 | main-nav, breadcrumb-nav, sidebar-nav, mobile-drawer |
| Hero/Banner | 3 | hero-banner, featured-article, category-hero |
| Forms | 3 | search-form, newsletter-signup, contact-form |
| Layout | 3 | site-header, site-footer, section-container |
| Content Blocks | 4 | author-byline, related-articles, share-buttons, tag-cloud |
| Healthcare | 3 | provider-card, appointment-cta, condition-tag |

### Primitive Component SDCs (direct wrappers)

| Category | Count | SDCs |
|----------|-------|------|
| Form Components | 12 | hx-text-input, hx-select, hx-checkbox, hx-radio-group, hx-textarea, hx-date-picker, hx-time-picker, hx-file-upload, hx-number-input, hx-slider, hx-switch, hx-combobox |
| Navigation | 5 | hx-tabs, hx-side-nav, hx-top-nav, hx-pagination, hx-steps |
| Data Display | 5 | hx-data-table, hx-tree-view, hx-accordion, hx-list, hx-carousel |
| Feedback | 6 | hx-alert, hx-toast, hx-dialog, hx-drawer, hx-popover, hx-tooltip |
| Healthcare | 2 | hx-patient-banner, hx-phi-field |

## CKEditor 5 Integration

To allow HELiX web components in CKEditor 5 content, configure General HTML Support (GHS):

```yaml
# In your editor configuration (admin/config/content/formats)
# Allow all hx-* elements with any attributes:
editor.editor.full_html:
  settings:
    plugins:
      ckeditor5_htmlSupport:
        allowed_html:
          - '<hx-button *>'
          - '<hx-card *>'
          - '<hx-text *>'
          - '<hx-badge *>'
          - '<hx-icon *>'
          - '<hx-image *>'
          - '<hx-link *>'
```

## Layout Builder / XB Compatibility

SDCs declare typed props in `.component.yml` that map to Layout Builder and Experience Builder
(XB) field types; many also declare slots. Not every shipped SDC defines both a `props:` and a
`slots:` section — review the individual `.component.yml` for the SDCs you intend to expose to
Layout Builder. SDCs can be placed as blocks in Layout Builder regions.

## Progressive Enhancement

Most HELiX components support progressive enhancement: text + link content rendered in Twig
(card body, prose, link anchors) is visible in the HTML before JavaScript loads, and the
custom-element upgrade adds shadow-DOM rendering on top. **Form components are the exception** —
`hx-text-input`, `hx-select`, `hx-textarea`, `hx-checkbox`, etc. render no native
`<input>`/`<select>` fallback before upgrade. Pages that must accept form input under
no-JavaScript conditions need a native-control fallback rendered alongside the HELiX form
components and removed after upgrade. This ensures:

- Content is crawlable by search engines
- Pages are usable without JavaScript (degraded but functional)
- First Contentful Paint is not blocked by component JS

## License

MIT
