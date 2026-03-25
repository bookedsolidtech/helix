# Blog Preset

The blog preset extends [standard](./standard.md) with editorial content components for article-driven sites.

## SDCs Included

Includes all [standard SDCs](./standard.md), plus:

| SDC | Purpose |
|-----|---------|
| `article-full` | Full article display with body and metadata |
| `author-byline` | Author name, avatar, and bio snippet |
| `related-articles` | Contextual related content block |
| `tag-cloud` | Taxonomy term cloud with weighting |
| `newsletter-signup` | Email capture with consent messaging |

## Dependencies

```json
{
  "@helixui/drupal-starter": "^0.1.0",
  "@helixui/tokens": "^0.2.0"
}
```

## Usage

```bash
npx @helixui/create --drupal --preset blog
```

## Architecture Notes

Extends standard with article display, authoring, taxonomy, and newsletter patterns. Appropriate for content-heavy editorial sites, news portals, and knowledge bases.
