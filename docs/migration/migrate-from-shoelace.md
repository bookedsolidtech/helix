# Migrating from Shoelace to Helix

This guide covers migrating a codebase using [Shoelace](https://shoelace.style) (`@shoelace-style/shoelace`) to the Helix component library.

## Prerequisites

1. Install the Helix library:
   ```bash
   npm install @helix/library
   ```

2. Run the automated migration analysis:
   ```bash
   npx helix migrate --from shoelace
   # Or with your project's CEM for precise analysis:
   npx helix migrate --from shoelace --cem ./node_modules/@shoelace-style/shoelace/dist/custom-elements.json
   ```

## Component Mapping

### Direct Replacements

These components have a 1:1 equivalent. Search-and-replace the tag names and remap attributes.

| Shoelace             | Helix            | Notes                                      |
|----------------------|------------------|--------------------------------------------|
| `<sl-button>`        | `<hx-button>`    | Map `variant` prop values (see below)      |
| `<sl-input>`         | `<hx-text-input>`| Rename tag; attributes are compatible      |
| `<sl-checkbox>`      | `<hx-checkbox>`  | Direct replacement                         |
| `<sl-select>`        | `<hx-select>`    | Map `<sl-option>` children to `<hx-option>`|
| `<sl-card>`          | `<hx-card>`      | Direct replacement                         |

### Partial Replacements

These require attribute or event remapping.

| Shoelace      | Helix     | Action Required                                |
|---------------|-----------|------------------------------------------------|
| `<sl-select>` | `<hx-select>` | Replace `<sl-option>` with `<hx-option>` children |

### No Equivalent (Manual Migration)

| Shoelace       | Action                                              |
|----------------|-----------------------------------------------------|
| `<sl-alert>`   | Use `<hx-field>` error state for form-level alerts  |
| `<sl-badge>`   | Implement with CSS custom properties or native HTML |
| `<sl-dialog>`  | Track `hx-dialog` on the Helix roadmap              |
| `<sl-tooltip>` | Track `hx-tooltip` on the Helix roadmap             |
| `<sl-dropdown>`| Track `hx-dropdown` on the Helix roadmap            |

## Attribute Migration Reference

### `<sl-button>` → `<hx-button>`

```html
<!-- Before (Shoelace) -->
<sl-button variant="primary" size="medium" loading>Submit</sl-button>

<!-- After (Helix) -->
<hx-button variant="primary" size="medium" loading>Submit</hx-button>
```

Variant mapping:

| Shoelace `variant` | Helix `variant` |
|--------------------|-----------------|
| `primary`          | `primary`       |
| `default`          | `secondary`     |
| `neutral`          | `secondary`     |
| `success`          | `primary`       |
| `warning`          | `secondary`     |
| `danger`           | `danger`        |
| `text`             | `ghost`         |

### `<sl-input>` → `<hx-text-input>`

```html
<!-- Before -->
<sl-input
  label="Email"
  placeholder="you@example.com"
  type="email"
  required
  ?disabled="${disabled}"
  @sl-input="${handleInput}"
  @sl-change="${handleChange}"
></sl-input>

<!-- After -->
<hx-text-input
  label="Email"
  placeholder="you@example.com"
  type="email"
  required
  ?disabled="${disabled}"
  @hx-input="${handleInput}"
  @hx-change="${handleChange}"
></hx-text-input>
```

### `<sl-checkbox>` → `<hx-checkbox>`

```html
<!-- Before -->
<sl-checkbox ?checked="${checked}" @sl-change="${onChange}">Accept terms</sl-checkbox>

<!-- After -->
<hx-checkbox ?checked="${checked}" @hx-change="${onChange}">Accept terms</hx-checkbox>
```

### `<sl-select>` + `<sl-option>` → `<hx-select>` + `<hx-option>`

```html
<!-- Before -->
<sl-select value="b" @sl-change="${onChange}">
  <sl-option value="a">Option A</sl-option>
  <sl-option value="b">Option B</sl-option>
</sl-select>

<!-- After -->
<hx-select value="b" @hx-change="${onChange}">
  <hx-option value="a">Option A</hx-option>
  <hx-option value="b">Option B</hx-option>
</hx-select>
```

## Event Migration

| Shoelace Event    | Helix Event    |
|-------------------|----------------|
| `sl-click`        | `hx-click`     |
| `sl-input`        | `hx-input`     |
| `sl-change`       | `hx-change`    |
| `sl-focus`        | `hx-focus`     |
| `sl-blur`         | `hx-blur`      |

## CSS Custom Property Migration

Helix uses the `--hx-*` prefix for all design tokens. Shoelace uses `--sl-*`.

```css
/* Before (Shoelace) */
sl-button::part(base) {
  --sl-color-primary-600: #0066cc;
}

/* After (Helix) — override at the semantic token level */
:root {
  --hx-color-primary: #0066cc;
}
```

Helix's three-tier token architecture: `Primitive → Semantic → Component`.
Override at the semantic level (`--hx-color-*`, `--hx-spacing-*`) for global theming.
Override at the component level (`--hx-button-bg`) for per-component customization.

## Drupal / Twig Migration

```twig
{# Before (Shoelace) #}
<sl-button variant="primary">{{ label }}</sl-button>

{# After (Helix) #}
<hx-button variant="primary">{{ label }}</hx-button>
```

No Drupal behavior changes are required for attribute-compatible components.

## Import Migration

```typescript
// Before (Shoelace)
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

// After (Helix)
import '@helix/library/components/hx-button';
import '@helix/library/components/hx-text-input';
```

Or import the full library:
```typescript
import '@helix/library';
```

## Automated Analysis

Run the CLI to get a component-by-component migration report:

```bash
# Using built-in mapping (no CEM required)
npx helix migrate --from shoelace

# Using Shoelace's CEM for precise per-project analysis
npx helix migrate --from shoelace \
  --cem ./node_modules/@shoelace-style/shoelace/dist/custom-elements.json \
  --json \
  --output ./migration-report.json

# Generate wrapper stub files
npx helix migrate --from shoelace --wrappers
```
