# @helixui/drupal-starter

Pre-built composition SDCs (Single Directory Components) for Drupal, using [HELiX](https://github.com/bookedsolidtech/helix) enterprise web components.

## What This Package Provides

29 production-ready SDCs that compose HELiX web components (`hx-*`) into common Drupal content patterns. Each SDC includes:

- **`.component.yml`** — SDC metadata with typed props matching Drupal field data
- **`.twig`** — Twig template composing HELiX web components in light DOM
- **`.css`** — Layout-only plain CSS (no Shadow DOM, no adopted stylesheets)

## Requirements

- Drupal 10.1+ or 11.0+ (SDC support required)
- `@helixui/library` ^1.0.0 installed and served to the frontend
- The `sdc` core module enabled

## Installation

```bash
npm install @helixui/drupal-starter
```

Copy the package contents into your Drupal module or theme:

```bash
cp -r node_modules/@helixui/drupal-starter/ modules/custom/helixui/
# or into your theme
cp -r node_modules/@helixui/drupal-starter/ themes/custom/mytheme/
```

Enable the module:

```bash
drush en helixui
```

## SDC Categories

| Category | SDCs | Description |
|----------|------|-------------|
| **Node Display** (5) | article-teaser, article-full, recipe-card, recipe-full, landing-page | Content type display templates |
| **Views/Lists** (4) | views-grid, views-list, views-carousel, topic-landing | Collection and listing patterns |
| **Navigation** (4) | main-nav, breadcrumb-nav, sidebar-nav, mobile-drawer | Navigation patterns |
| **Hero/Banner** (3) | hero-banner, featured-article, category-hero | Full-width hero sections |
| **Forms** (3) | search-form, newsletter-signup, contact-form | Form compositions |
| **Layout** (3) | site-header, site-footer, section-container | Page structure |
| **Content Blocks** (4) | author-byline, related-articles, share-buttons, tag-cloud | Content enrichment |
| **Healthcare** (3) | provider-card, appointment-cta, condition-tag | Healthcare-specific patterns |

## Usage in Twig

Reference SDCs using the Drupal SDC include syntax:

```twig
{% include 'helixui:article-teaser' with {
  title: node.label,
  body: node.field_body.value|striptags|truncate(150),
  image_url: file_url(node.field_image.entity.uri.value),
  image_alt: node.field_image.alt,
  author_name: node.uid.entity.name.value,
  date: node.created.value|date('M j, Y'),
  category: node.field_category.entity.label,
  url: path('entity.node.canonical', {'node': node.id}),
} %}
```

## Layout Builder / XB Compatibility

All SDCs declare props and slots in `.component.yml` that map to Layout Builder and Experience Builder (XB) field types. SDCs can be placed as blocks in Layout Builder regions.

## HELiX Component Loading

Each SDC uses `{{ attach_library('helixui/hx-*') }}` to load its HELiX component dependencies. The `helixui.libraries.yml` file maps each component to its JS entry point.

Ensure `@helixui/library` dist files are available at `/libraries/helixui/dist/` or update the library paths in `helixui.libraries.yml` to match your asset setup.

## Drupal Behaviors

Interactive SDCs (carousel, mobile drawer, search, share buttons, sidebar nav) use Drupal behaviors with the `once()` pattern in `js/helixui-behaviors.js`. This ensures safe re-execution during Layout Builder previews and AJAX updates.

## Dependency Tracking

The `helix-sdc.manifest.yml` file documents which HELiX components each SDC depends on, enabling impact analysis when upgrading `@helixui/library`.

## License

MIT
