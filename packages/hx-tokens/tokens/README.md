# Design Token Architecture — @helix/tokens

Three-tier cascade processed by [Style Dictionary 4.x](https://styledictionary.com/).

```
Primitive  →  Semantic  →  Component
```

---

## Tier 1 — Primitive (`tokens/primitive/`)

Raw values: the palette. Never consumed directly by components.

| File              | Contents                                         |
| ----------------- | ------------------------------------------------ |
| `color.json`      | Color scales (primary, secondary, neutral, etc.) |
| `spacing.json`    | Spacing scale (`space.0` … `space.64`)           |
| `typography.json` | Font families, sizes, weights, line-heights      |
| `effects.json`    | Border radius, widths, shadows                   |
| `motion.json`     | Duration and easing values                       |

All tokens use W3C DTCG format:
```json
{ "$value": "#2563EB", "$type": "color" }
```

## Tier 2 — Semantic (`tokens/semantic/`)

Intent-based aliases of primitives. Consumed by Tier 3 and directly by layout styles.

| File         | Contents                                                       |
| ------------ | -------------------------------------------------------------- |
| `color.json` | `color.text.*`, `color.surface.*`, `color.border.*`, focus, state |
| `dark.json`  | Dark-mode overrides under the `dark.*` namespace               |

Semantic tokens reference primitives via DTCG alias syntax:
```json
{ "$value": "{color.neutral.900}", "$type": "color" }
```

## Tier 3 — Component (`packages/hx-library/tokens/component/`)

Per-component token files consumed by Lit component styles. These sit in `hx-library` to keep component-specific decisions co-located with the component package.

| File          | Contents                          |
| ------------- | --------------------------------- |
| `button.json` | `button.bg`, `button.color`, etc. |
| `card.json`   | `card.bg`, `card.shadow`, etc.    |
| `form.json`   | `input.*` tokens                  |

---

## Build Pipeline

```bash
# From repo root:
npm run build:sd --workspace=packages/hx-tokens

# Or directly:
node packages/hx-tokens/sd.config.mjs
```

### Outputs (`packages/hx-tokens/dist/`)

| File                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `tokens.css`           | `:root` CSS custom properties (light mode)          |
| `tokens-dark-auto.css` | `@media (prefers-color-scheme: dark)` overrides     |
| `tokens-dark-manual.css` | `[data-theme="dark"]` selector overrides          |
| `tokens-lit.js`        | Lit `css\`\`` tagged template exports               |

---

## CSS Custom Property Convention

All generated CSS custom properties use the `--hx-` prefix:

```css
/* Primitive */
--hx-color-primary-500: #2563EB;
--hx-color-neutral-900: #0F172A;

/* Semantic (references primitives) */
--hx-color-text-primary: var(--hx-color-neutral-900);
--hx-color-border-focus:  var(--hx-color-primary-500);

/* Component (in Lit shadow host, references semantic) */
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary-500));
}
```

Consumers override at the **semantic level** via `--hx-color-*`.
Components consume at the **component level** with semantic fallbacks.

---

## Token Format Reference (W3C DTCG)

```json
{
  "color": {
    "primary": {
      "500": {
        "$value": "#2563EB",
        "$type": "color",
        "$description": "Primary brand blue"
      }
    }
  }
}
```

Supported `$type` values: `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `shadow`, `string`.
