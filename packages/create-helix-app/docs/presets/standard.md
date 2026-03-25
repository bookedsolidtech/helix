# Standard Preset

The standard preset provides the core SDC set for a general-purpose Drupal site. It is the base from which all other presets extend.

## SDCs Included

| SDC | Purpose |
|-----|---------|
| `node-teaser` | Teaser display of a node entity |
| `views-grid` | Grid layout wrapper for Views output |
| `hero-banner` | Full-width hero with title and CTA |
| `site-header` | Global site header with navigation |
| `site-footer` | Global site footer with links |
| `breadcrumb` | Breadcrumb navigation trail |
| `search-form` | Site search input and submit |

## Dependencies

```json
{
  "@helixui/drupal-starter": "^0.1.0",
  "@helixui/tokens": "^0.2.0"
}
```

## Usage

```bash
npx @helixui/create --drupal --preset standard
```

## Architecture Notes

Includes core content display, navigation, and search patterns suitable for most Drupal sites. This preset is intentionally minimal — extend it with `blog`, `healthcare`, or `intranet` for additional patterns.
