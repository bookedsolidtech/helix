# Migrating from Material Web (MWC) to Helix

This guide covers migrating a codebase using [Material Web Components](https://github.com/material-components/material-web) (`@material/web`, MWC v3 / "Material Design 3") to the Helix component library.

> Note: This guide covers the **Web Components** implementation (`@material/web`), not the React-based `@mui/material`. If you are migrating from the React library, the tag name patterns differ but the conceptual mapping is the same.

## Prerequisites

1. Install Helix:
   ```bash
   npm install @helix/library
   ```

2. Run automated migration analysis:
   ```bash
   npx helix migrate --from material-ui
   # Or with Material's CEM:
   npx helix migrate --from material-ui \
     --cem ./node_modules/@material/web/custom-elements.json
   ```

## Component Mapping

### Direct Replacements

| Material Web              | Helix            | Notes                                    |
|---------------------------|------------------|------------------------------------------|
| `<md-filled-button>`      | `<hx-button>`    | Use `variant="primary"`                  |
| `<md-outlined-button>`    | `<hx-button>`    | Use `variant="secondary"`                |
| `<md-text-button>`        | `<hx-button>`    | Use `variant="ghost"`                    |
| `<md-elevated-button>`    | `<hx-button>`    | Use `variant="secondary"`                |
| `<md-filled-text-field>`  | `<hx-text-input>`| Direct replacement                       |
| `<md-outlined-text-field>`| `<hx-text-input>`| Direct replacement (Helix default style) |
| `<md-checkbox>`           | `<hx-checkbox>`  | Direct replacement                       |

### Partial Replacements

| Material Web | Helix         | Action Required                                  |
|--------------|---------------|--------------------------------------------------|
| `<md-select>`| `<hx-select>` | Replace `<md-select-option>` with `<hx-option>`  |

### No Equivalent

| Material Component          | Action                                          |
|-----------------------------|-------------------------------------------------|
| `<md-dialog>`               | Track `hx-dialog` on the Helix roadmap          |
| `<md-circular-progress>`    | Track `hx-spinner` on the Helix roadmap         |
| `<md-linear-progress>`      | Track `hx-progress` on the Helix roadmap        |
| `<md-chip>` / `<md-chip-set>`| No equivalent yet                             |
| `<md-tabs>` / `<md-tab>`   | Track `hx-tabs` on the Helix roadmap            |
| `<md-list>` / `<md-list-item>`| No equivalent yet                           |
| `<md-switch>`               | Track `hx-toggle` / `hx-switch` on the roadmap |
| `<md-radio>`                | Track `hx-radio` on the Helix roadmap           |
| `<md-slider>`               | Track `hx-slider` on the Helix roadmap          |
| `<md-menu>` / `<md-menu-item>`| No equivalent yet                           |
| `<md-navigation-drawer>`    | No equivalent yet                               |
| `<md-tooltip>`              | Track `hx-tooltip` on the Helix roadmap         |

## Attribute Migration Reference

### Buttons

Material Web has separate tags for button variants. All map to `<hx-button>` with a `variant` attribute:

```html
<!-- Before (Material Web filled = primary) -->
<md-filled-button ?disabled="${disabled}" @click="${handleClick}">
  Submit
</md-filled-button>

<!-- Before (Material Web outlined = secondary) -->
<md-outlined-button ?disabled="${disabled}">Cancel</md-outlined-button>

<!-- Before (Material Web text = ghost) -->
<md-text-button>Learn more</md-text-button>

<!-- After (Helix) -->
<hx-button variant="primary" ?disabled="${disabled}" @hx-click="${handleClick}">Submit</hx-button>
<hx-button variant="secondary" ?disabled="${disabled}">Cancel</hx-button>
<hx-button variant="ghost">Learn more</hx-button>
```

Button variant mapping:

| Material Web tag              | Helix `variant` |
|-------------------------------|-----------------|
| `<md-filled-button>`          | `primary`       |
| `<md-outlined-button>`        | `secondary`     |
| `<md-text-button>`            | `ghost`         |
| `<md-elevated-button>`        | `secondary`     |
| `<md-filled-tonal-button>`    | `secondary`     |

### Text Fields

```html
<!-- Before (Material filled text field) -->
<md-filled-text-field
  label="Email"
  placeholder="you@example.com"
  type="email"
  required
  error-text="Invalid email"
  ?disabled="${disabled}"
  @input="${handleInput}"
  @change="${handleChange}"
></md-filled-text-field>

<!-- After (Helix) -->
<hx-text-input
  label="Email"
  placeholder="you@example.com"
  type="email"
  required
  error="Invalid email"
  ?disabled="${disabled}"
  @hx-input="${handleInput}"
  @hx-change="${handleChange}"
></hx-text-input>
```

Attribute mapping:

| Material `md-*-text-field` | Helix `hx-text-input` |
|----------------------------|-----------------------|
| `label`                    | `label`               |
| `placeholder`              | `placeholder`         |
| `value`                    | `value`               |
| `type`                     | `type`                |
| `required`                 | `required`            |
| `disabled`                 | `disabled`            |
| `error-text`               | `error`               |
| `supporting-text`          | `hint`                |
| `prefix-text`              | `prefix` (slot)       |
| `suffix-text`              | `suffix` (slot)       |

### Checkbox

```html
<!-- Before -->
<md-checkbox
  ?checked="${checked}"
  ?indeterminate="${indeterminate}"
  ?disabled="${disabled}"
  @change="${onChange}"
></md-checkbox>
<label>Accept terms</label>

<!-- After (label is slotted in Helix) -->
<hx-checkbox
  ?checked="${checked}"
  ?indeterminate="${indeterminate}"
  ?disabled="${disabled}"
  @hx-change="${onChange}"
>Accept terms</hx-checkbox>
```

### Select

```html
<!-- Before -->
<md-select value="b" @change="${onChange}">
  <md-select-option value="a"><div slot="headline">Option A</div></md-select-option>
  <md-select-option value="b"><div slot="headline">Option B</div></md-select-option>
</md-select>

<!-- After -->
<hx-select value="b" @hx-change="${onChange}">
  <hx-option value="a">Option A</hx-option>
  <hx-option value="b">Option B</hx-option>
</hx-select>
```

Note: Material Web's `<md-select-option>` uses a `slot="headline"` div for option text. Helix `<hx-option>` uses default slot content directly.

## Event Migration

| Material Web Event | Helix Event    |
|--------------------|----------------|
| `click`            | `hx-click`     |
| `input`            | `hx-input`     |
| `change`           | `hx-change`    |
| `focus`            | `hx-focus`     |
| `blur`             | `hx-blur`      |

Note: Material Web uses native DOM events (`click`, `input`, `change`). Helix uses prefixed custom events (`hx-click`, `hx-input`, `hx-change`) to avoid conflicts in shadow DOM contexts.

## CSS Token Migration

Material Web uses `--md-*` CSS custom properties. Map to Helix `--hx-*` semantic tokens:

```css
/* Before (Material Web) */
:root {
  --md-sys-color-primary: #0057d9;
  --md-sys-color-on-primary: #ffffff;
  --md-ref-typeface-brand: 'Roboto', sans-serif;
}

/* After (Helix) */
:root {
  --hx-color-primary: #0057d9;
  --hx-color-on-primary: #ffffff;
  --hx-font-family-base: 'Roboto', sans-serif;
}
```

Common token mapping:

| Material `--md-sys-*`          | Helix `--hx-*`               |
|--------------------------------|------------------------------|
| `--md-sys-color-primary`       | `--hx-color-primary`         |
| `--md-sys-color-secondary`     | `--hx-color-secondary`       |
| `--md-sys-color-error`         | `--hx-color-danger`          |
| `--md-sys-color-surface`       | `--hx-color-surface`         |
| `--md-sys-color-on-primary`    | `--hx-color-on-primary`      |
| `--md-ref-typeface-brand`      | `--hx-font-family-base`      |
| `--md-sys-shape-corner-medium` | `--hx-border-radius-md`      |

## Import Migration

```typescript
// Before (Material Web)
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/select/select.js';
import '@material/web/select/select-option.js';

// After (Helix)
import '@helix/library/components/hx-button';
import '@helix/library/components/hx-text-input';
import '@helix/library/components/hx-checkbox';
import '@helix/library/components/hx-select';
```

## Automated Analysis

```bash
# Built-in mapping (no CEM required)
npx helix migrate --from material-ui

# With Material Web CEM
npx helix migrate --from material-ui \
  --cem ./node_modules/@material/web/custom-elements.json \
  --json \
  --output ./mwc-migration-report.json

# Generate wrapper stubs
npx helix migrate --from material-ui --wrappers
```
