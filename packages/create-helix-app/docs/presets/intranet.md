# Intranet Preset

The intranet preset extends [standard](./standard.md) with components for internal employee portals and dashboards.

## SDCs Included

Includes all [standard SDCs](./standard.md), plus:

| SDC | Purpose |
|-----|---------|
| `dashboard-card` | Metric and status card for dashboard views |
| `notification-banner` | Dismissible system notification |
| `data-table-view` | Structured data table with Views integration |
| `user-profile` | Employee profile summary with avatar |

## Dependencies

```json
{
  "@helixui/drupal-starter": "^0.1.0",
  "@helixui/tokens": "^0.2.0"
}
```

## Usage

```bash
npx @helixui/create --drupal --preset intranet
```

## Architecture Notes

Extends standard with dashboard widgets, notifications, data tables, and user profile patterns for internal applications. The `data-table-view` SDC wraps Drupal Views table output and applies HELiX design tokens for consistent styling across intranet data displays.
