# Multi-Brand Theming API

HELiX supports white-label hospital system implementations through a named brand
registry. Brands define CSS custom property overrides that are merged on top of
the base theme inside `<hx-theme>`.

---

## Quick Start

### 1. Register your brand (at application bootstrap)

```ts
import { HelixBrandRegistry } from '@helixui/tokens';

HelixBrandRegistry.register('mercy-health', {
  '--hx-color-primary-50':  '#EFF4FF',
  '--hx-color-primary-100': '#DCE8FF',
  '--hx-color-primary-200': '#BDD3FF',
  '--hx-color-primary-300': '#90B4FF',
  '--hx-color-primary-400': '#5B8AFF',
  '--hx-color-primary-500': '#003DA5',
  '--hx-color-primary-600': '#002D8A',
  '--hx-color-primary-700': '#002070',
  '--hx-color-primary-800': '#001559',
  '--hx-color-primary-900': '#000D3D',
  '--hx-color-primary-950': '#00061F',
  '--hx-color-secondary-50':  '#F0FAFB',
  // ... all secondary shades
});
```

### 2. Apply the brand via `<hx-theme brand="...">`

```html
<hx-theme theme="light" brand="mercy-health">
  <!-- All child components inherit Mercy Health brand tokens -->
  <hx-button>Schedule Appointment</hx-button>
</hx-theme>
```

---

## API Reference

### `HelixBrandRegistry.register(brandName, tokens)`

Registers a named brand token set. Throws if required tokens are missing or if
values are empty strings.

| Parameter  | Type           | Description                                           |
|------------|---------------|-------------------------------------------------------|
| `brandName`| `string`       | Unique identifier (e.g. `'mercy-health'`)             |
| `tokens`   | `BrandTokenMap`| CSS custom property name → value pairs                |

**Throws** `Error` when:
- `brandName` is empty or whitespace-only
- Any token in `REQUIRED_SEMANTIC_TOKENS` is absent or has an empty value

**Last-write wins:** Registering the same brand name twice replaces the first entry.

---

### `HelixBrandRegistry.getBrandTokens(brandName)`

Returns the stored `BrandTokenMap` for a registered brand, or `undefined` if
the brand is not registered.

---

### `HelixBrandRegistry.isRegistered(brandName)`

Returns `true` if a brand with the given name has been registered.

---

### `HelixBrandRegistry.validateTokens(tokens)`

Validates a token map without throwing. Returns a `BrandValidationResult`:

```ts
interface BrandValidationResult {
  valid: boolean;
  missingTokens: string[]; // empty when valid === true
}
```

Use this to check completeness before registration or to surface helpful error
messages in your own tooling.

---

## Required Semantic Tokens

Every brand registration must include all tokens in `REQUIRED_SEMANTIC_TOKENS`.
This constant is exported from `@helixui/tokens`.

The required set covers the **primary** and **secondary** color ramps (22 tokens):

```
--hx-color-primary-50   through  --hx-color-primary-950   (11 shades)
--hx-color-secondary-50 through  --hx-color-secondary-950 (11 shades)
```

All other HELiX tokens inherit their values from the base theme. Only the
tokens that visually distinguish the brand from the HELiX default need to be
overridden.

---

## Validation Rules

1. **Non-empty brand name** — `brandName` must not be an empty string or
   contain only whitespace.
2. **All required tokens present** — Every token in `REQUIRED_SEMANTIC_TOKENS`
   must have an entry in the submitted map.
3. **Non-empty token values** — Token values must be non-empty, non-whitespace
   strings. Empty values are treated as missing.

---

## Token Cascade Architecture

Brand tokens slot into the three-tier cascade as overrides at the **Tier 2
(semantic)** level:

```
Tier 1: Primitive   --hx-color-primary-500: #2563EB      (base defaults)
Tier 2: Semantic    --hx-color-primary-500: #003DA5      (brand override)
Tier 3: Component   --hx-button-bg: var(--hx-color-primary-500)
```

Inside `<hx-theme>`, brand tokens are injected as a secondary `:host` block
after the base theme tokens in the adopted stylesheet. The second `:host` block
takes cascade precedence, so brand values win over the base without breaking
component-level fallback chains.

---

## `<hx-theme>` Brand Attribute

```html
<hx-theme brand="brand-name">...</hx-theme>
```

| Attribute | Type     | Default | Description                                |
|-----------|----------|---------|--------------------------------------------|
| `brand`   | `string` | `''`    | Registered brand name. Empty string = no brand override. |

**When brand is not registered:** A `console.warn` is emitted and the base
theme is applied without brand overrides. The component does not throw.

**Theme + brand co-existence:** The `theme` and `brand` attributes are
independent. Setting `theme="dark" brand="mercy-health"` applies dark-mode
semantic overrides first, then brand primary/secondary overrides on top.

---

## White-Label Implementation Guide

### Drupal

Register brands in a Drupal behavior that runs before the page renders:

```js
// my_theme/js/helix-brands.js
(function (Drupal, drupalSettings) {
  Drupal.behaviors.helixBrands = {
    attach(context) {
      if (context === document) {
        const { HelixBrandRegistry } = window.HelixTokens;
        HelixBrandRegistry.register('my-hospital', drupalSettings.helixBrand.tokens);
      }
    },
  };
})(Drupal, drupalSettings);
```

Pass the token map from Drupal PHP into `drupalSettings` via
`hook_page_attachments()`.

### React

Register in your application entry point before rendering:

```tsx
// main.tsx
import { HelixBrandRegistry } from '@helixui/tokens';
import { mercyHealthTokens } from './brands/mercy-health';

HelixBrandRegistry.register('mercy-health', mercyHealthTokens);

// ... ReactDOM.createRoot(...)
```

### Angular

Register in `APP_INITIALIZER`:

```ts
// app.module.ts
import { APP_INITIALIZER } from '@angular/core';
import { HelixBrandRegistry } from '@helixui/tokens';

function registerBrands() {
  return () => {
    HelixBrandRegistry.register('my-brand', { /* tokens */ });
  };
}

@NgModule({
  providers: [
    { provide: APP_INITIALIZER, useFactory: registerBrands, multi: true },
  ],
})
export class AppModule {}
```

---

## See Also

- `packages/hx-tokens/examples/brand-definitions.ts` — complete example brand definitions
- `packages/hx-tokens/src/brand-registry.ts` — implementation source
- `packages/hx-tokens/src/types/brand.ts` — TypeScript interfaces
- `packages/hx-library/src/components/hx-theme/hx-theme.ts` — `<hx-theme>` component source
