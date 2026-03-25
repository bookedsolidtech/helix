# CSS Bundles — @helixui/library

Per-component CSS extracted from Shadow DOM styles for enterprise light-DOM consumption.

## Output Structure

```
packages/hx-library/dist/css/
├── hx-button.css           # Individual component CSS
├── hx-card.css
├── hx-text-input.css
├── ...
├── helix-core.css          # Core components (buttons, cards, icons, etc.)
├── helix-forms.css         # Form components (inputs, selects, checkboxes, etc.)
├── helix-navigation.css    # Navigation (breadcrumb, tabs, menus, etc.)
├── helix-layout.css        # Layout (grid, stack, accordion, etc.)
├── helix-feedback.css      # Feedback (alerts, toasts, progress, etc.)
├── helix-overlay.css       # Overlays (dialog, drawer, tooltip, etc.)
├── helix-data.css          # Data display (tables, lists, code snippets)
├── helix-media.css         # Media (carousel, prose)
├── helix-utility.css       # Utilities (action-bar, split-button, etc.)
├── helix-all.css           # All components combined
├── helix-tokens.css        # Design tokens only (--hx-* custom properties)
└── manifest.json           # Component → token dependency map
```

## Importing CSS

### Individual component

```html
<link rel="stylesheet" href="node_modules/@helixui/library/dist/css/hx-button.css" />
```

### Category bundle

```html
<link rel="stylesheet" href="node_modules/@helixui/library/dist/css/helix-forms.css" />
```

### Everything

```html
<link rel="stylesheet" href="node_modules/@helixui/library/dist/css/helix-all.css" />
```

### Tokens only (for theming without components)

```html
<link rel="stylesheet" href="node_modules/@helixui/library/dist/css/helix-tokens.css" />
```

### Tokens + specific bundle (recommended for Drupal)

```html
<link rel="stylesheet" href=".../helix-tokens.css" />
<link rel="stylesheet" href=".../helix-forms.css" />
```

## Token Fallbacks

All CSS files include inline token fallback values. Components work standalone without requiring `helix-tokens.css`:

```css
/* Works without tokens loaded */
.button {
  background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
}
```

Loading `helix-tokens.css` allows overriding tokens at `:root` level for theming.

## manifest.json Schema

```json
{
  "generated": "ISO date string",
  "components": [
    {
      "name": "hx-button",
      "file": "hx-button.css",
      "tokens": ["--hx-color-primary-500", "--hx-button-bg", "..."]
    }
  ],
  "bundles": {
    "forms": {
      "components": ["hx-checkbox", "hx-text-input", "..."],
      "file": "helix-forms.css"
    },
    "all": {
      "components": ["hx-button", "hx-card", "..."],
      "file": "helix-all.css"
    }
  }
}
```

## Drupal Integration

In a Drupal theme or module `*.libraries.yml`:

```yaml
helix-forms:
  css:
    component:
      /libraries/helix/css/helix-tokens.css: {}
      /libraries/helix/css/helix-forms.css: {}
```

Then in a Twig template:

```twig
{{ attach_library('mytheme/helix-forms') }}
<hx-text-input label="Patient Name"></hx-text-input>
```

## Build Commands

```bash
# Generate all CSS bundles (run after main build)
pnpm run css:build

# Validate CSS output is present and valid
pnpm run css:validate

# Full build including CSS
pnpm run build
```

## Adding a New Component

1. Create the component with its `.styles.ts` file in `src/components/hx-new/`
2. Add the component name to the appropriate category in `build/component-categories.json`
3. Run `pnpm run css:build` to regenerate bundles

## Regeneration Trigger

CSS bundles are generated as a post-build step. They are **not** committed to git — the `dist/` directory is gitignored. Run `pnpm run build` (which runs `css:build` automatically) to regenerate.
