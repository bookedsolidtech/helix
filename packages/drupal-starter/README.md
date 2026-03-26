# @helixui/drupal-starter

Drupal starter kit for [HELiX](https://github.com/bookedsolidtech/helix) enterprise healthcare web components. Includes pre-built SDC compositions, standalone Twig templates, Drupal behaviors, theme token overrides, and a module file for per-page asset loading.

## What This Package Provides

| Directory | Contents |
|-----------|----------|
| `components/` | 59 production-ready SDCs (Single Directory Components) |
| `templates/` | Standalone Twig templates for hx-button, hx-card, hx-text-input, hx-form |
| `js/` | Drupal behaviors for interactive components and form integration |
| `css/` | Theme token override template and form layout styles |
| `helixui.libraries.yml` | Per-component Drupal library definitions |
| `helixui.module` | Module hooks for asset loading, CDN switching, and theme registration |
| `helixui.info.yml` | Drupal module metadata (Drupal 10.1+ / 11.0+) |

## Requirements

- Drupal 10.1+ or 11.0+ (SDC support required)
- `@helixui/library` ^1.0.0 served to the frontend
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

Place `@helixui/library` dist files at `/libraries/helixui/dist/`. The default `helixui.libraries.yml` paths point here:

```
web/libraries/helixui/dist/
  index.js
  css/helix-tokens.css
  css/helix-core.css
  components/hx-button/index.js
  components/hx-card/index.js
  ...
```

### Strategy 2: CDN

Set the CDN URL in `settings.php` and the module's `hook_library_info_alter()` rewrites all local paths to CDN URLs:

```php
// settings.php
$settings['helixui_cdn_url'] = 'https://cdn.example.com/@helixui/library/dist';
```

Or via environment variable:

```bash
export HELIXUI_CDN_URL=https://cdn.example.com/@helixui/library/dist
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
<hx-button variant="primary" size="md">Book Now</hx-button>
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

HELiX components use CSS custom properties (`--hx-*`) as their theming API. Override these in your theme to apply your brand:

```css
/* In your theme CSS */
:root {
  --hx-color-primary: #0057b8;
  --hx-color-primary-hover: #004a9e;
  --hx-font-family: 'Open Sans', sans-serif;
  --hx-radius-md: 0.375rem;
}
```

The `css/helix-theme-overrides.css` file provides a commented template of all available semantic and component-level tokens. Copy it to your theme and uncomment the values you want to override.

### Dark Mode

Override tokens inside a media query or a theme class:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-surface: #1a1a2e;
    --hx-color-text: #e2e8f0;
    --hx-color-border: #2d3748;
  }
}
```

## Drupal Behaviors

All interactive behaviors use the `once()` pattern for safe re-execution during AJAX page loads, Layout Builder previews, and XB rendering.

### General Behaviors (`js/helixui-behaviors.js`)

| Behavior | Purpose |
|----------|---------|
| `helixuiCarousel` | Autoplay initialization and cleanup for carousel SDCs |
| `helixuiMobileDrawer` | Drawer open/close state and body scroll locking |
| `helixuiSearchForm` | Keyboard shortcut (/) to focus search input |
| `helixuiNewsletterSignup` | Client-side email validation before form submission |
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

All SDCs declare typed props and slots in `.component.yml` that map to Layout Builder and Experience Builder (XB) field types. SDCs can be placed as blocks in Layout Builder regions.

## Progressive Enhancement

HELiX components are designed for progressive enhancement. Content rendered in Twig is visible in the HTML before JavaScript loads. Web components hydrate client-side, adding interactivity. This ensures:

- Content is crawlable by search engines
- Pages are usable without JavaScript (degraded but functional)
- First Contentful Paint is not blocked by component JS

## License

MIT
