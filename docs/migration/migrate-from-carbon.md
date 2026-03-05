# Migrating from IBM Carbon to Helix

This guide covers migrating a codebase using [IBM Carbon Design System Web Components](https://web-components.carbondesignsystem.com/) (`@carbon/web-components` v10/v11 or `@carbon/ibmdotcom-web-components`) to the Helix component library.

## Prerequisites

1. Install Helix:
   ```bash
   npm install @helix/library
   ```

2. Run automated migration analysis:
   ```bash
   npx helix migrate --from carbon
   # Or with Carbon's CEM:
   npx helix migrate --from carbon \
     --cem ./node_modules/@carbon/web-components/custom-elements.json
   ```

## Carbon Version Notes

Carbon uses different tag name prefixes across versions:

| Carbon Version | Tag Prefix |
|----------------|------------|
| v10 (CDN)      | `bx-`      |
| v11 (current)  | `cds-`     |
| IBM Dotcom     | `dds-`     |

This guide covers both `bx-` (v10) and `cds-` (v11). Replace accordingly.

## Component Mapping

### Direct Replacements

| Carbon v10        | Carbon v11          | Helix            | Notes                         |
|-------------------|---------------------|------------------|-------------------------------|
| `<bx-btn>`        | `<cds-button>`      | `<hx-button>`    | Map `kind` → `variant`        |
| `<bx-text-input>` | `<cds-text-input>`  | `<hx-text-input>`| Direct replacement            |
| `<bx-checkbox>`   | `<cds-checkbox>`    | `<hx-checkbox>`  | Direct replacement            |

### Partial Replacements

| Carbon v10   | Carbon v11     | Helix         | Action Required                        |
|--------------|----------------|---------------|----------------------------------------|
| `<bx-select>`| `<cds-select>` | `<hx-select>` | Replace `<bx-select-item>` with `<hx-option>` |

### No Equivalent

| Carbon Component    | Action                                             |
|---------------------|----------------------------------------------------|
| `<bx-modal>`        | Track `hx-dialog` on the Helix roadmap             |
| `<bx-data-table>`   | Complex component; requires custom implementation  |
| `<bx-loading>`      | Track `hx-spinner` on the Helix roadmap            |
| `<bx-notification>` | Use `<hx-field>` error state for form notifications|
| `<bx-accordion>`    | Track `hx-accordion` on the Helix roadmap          |

## Attribute Migration Reference

### Button: `<bx-btn>` / `<cds-button>` → `<hx-button>`

Carbon uses a `kind` attribute where Helix uses `variant`:

```html
<!-- Before (Carbon v10) -->
<bx-btn kind="primary" size="sm" disabled>Submit</bx-btn>

<!-- Before (Carbon v11) -->
<cds-button kind="primary" size="sm" disabled>Submit</cds-button>

<!-- After (Helix) -->
<hx-button variant="primary" size="sm" disabled>Submit</hx-button>
```

`kind` → `variant` mapping:

| Carbon `kind`    | Helix `variant` |
|------------------|-----------------|
| `primary`        | `primary`       |
| `secondary`      | `secondary`     |
| `tertiary`       | `ghost`         |
| `ghost`          | `ghost`         |
| `danger`         | `danger`        |
| `danger--primary`| `danger`        |

### Text Input: `<bx-text-input>` → `<hx-text-input>`

```html
<!-- Before (Carbon v10) -->
<bx-text-input
  label-text="Email"
  placeholder="you@example.com"
  value="${value}"
  ?disabled="${disabled}"
  @bx-text-input-changed="${handleChange}"
></bx-text-input>

<!-- After (Helix) -->
<hx-text-input
  label="Email"
  placeholder="you@example.com"
  value="${value}"
  ?disabled="${disabled}"
  @hx-change="${handleChange}"
></hx-text-input>
```

Note: Carbon uses `label-text`; Helix uses `label`.

### Checkbox: `<bx-checkbox>` → `<hx-checkbox>`

```html
<!-- Before -->
<bx-checkbox
  label-text="Accept terms"
  ?checked="${checked}"
  @bx-checkbox-changed="${onChange}"
></bx-checkbox>

<!-- After -->
<hx-checkbox
  ?checked="${checked}"
  @hx-change="${onChange}"
>Accept terms</hx-checkbox>
```

Note: Carbon uses `label-text` attribute; Helix uses slot content for the label.

### Select: `<bx-select>` → `<hx-select>`

```html
<!-- Before (Carbon v10) -->
<bx-select value="b" @bx-select-selected="${onChange}">
  <bx-select-item value="a">Option A</bx-select-item>
  <bx-select-item value="b">Option B</bx-select-item>
</bx-select>

<!-- After (Helix) -->
<hx-select value="b" @hx-change="${onChange}">
  <hx-option value="a">Option A</hx-option>
  <hx-option value="b">Option B</hx-option>
</hx-select>
```

## Event Migration

| Carbon Event                  | Helix Event    |
|-------------------------------|----------------|
| `bx-btn-clicked`              | `hx-click`     |
| `cds-button-clicked`          | `hx-click`     |
| `bx-text-input-changed`       | `hx-change`    |
| `cds-text-input-changed`      | `hx-change`    |
| `bx-checkbox-changed`         | `hx-change`    |
| `bx-select-selected`          | `hx-change`    |

## CSS Token Migration

Carbon uses `$carbon--` Sass variables and CSS custom properties with a `--cds-` prefix.

```css
/* Before (Carbon) */
:root {
  --cds-interactive-01: #0f62fe;
  --cds-text-01: #161616;
}

/* After (Helix) — map to semantic tokens */
:root {
  --hx-color-primary: #0f62fe;
  --hx-color-text: #161616;
}
```

## Import Migration

```typescript
// Before (Carbon v10)
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/input/index.js';

// Before (Carbon v11)
import '@carbon/web-components/es/components/button/button.js';

// After (Helix)
import '@helix/library/components/hx-button';
import '@helix/library/components/hx-text-input';
```

## Automated Analysis

```bash
# Built-in mapping (no CEM required)
npx helix migrate --from carbon

# With Carbon's CEM
npx helix migrate --from carbon \
  --cem ./node_modules/@carbon/web-components/custom-elements.json \
  --json \
  --output ./carbon-migration-report.json

# Generate wrapper stubs
npx helix migrate --from carbon --wrappers
```
