# Design Token Validation Workflow

Design tokens are the single source of truth for visual consistency. No hardcoded values. No exceptions.

---

## 3-Tier Token Cascade

```
Primitive Tokens (raw values)
  --hx-color-blue-500: #2563eb;
  --hx-spacing-4: 1rem;
  --hx-font-size-16: 1rem;

Semantic Tokens (purpose-driven, reference primitives)
  --hx-color-primary: var(--hx-color-blue-500);
  --hx-spacing-md: var(--hx-spacing-4);
  --hx-font-size-md: var(--hx-font-size-16);

Component Tokens (scoped, reference semantics)
  --hx-button-bg: var(--hx-color-primary);
  --hx-button-padding: var(--hx-spacing-md);
  --hx-button-font-size: var(--hx-font-size-md);
```

### Rules

1. **Primitives** define raw values. They are not used directly in components.
2. **Semantic tokens** map primitives to purposes (primary, secondary, surface, error). Consumers override at this level.
3. **Component tokens** are scoped to a single component. They reference semantic tokens as fallbacks.
4. Components consume through private custom properties with the fallback chain.

---

## CSS Custom Property Naming

### Prefix

All tokens use the `--hx-` prefix:

```
--hx-{category}-{property}          # Semantic
--hx-{component}-{property}         # Component-scoped
```

### Categories

| Category | Examples |
|----------|----------|
| `color` | `--hx-color-primary`, `--hx-color-error`, `--hx-color-surface` |
| `spacing` | `--hx-spacing-xs`, `--hx-spacing-sm`, `--hx-spacing-md`, `--hx-spacing-lg` |
| `radius` | `--hx-radius-sm`, `--hx-radius-md`, `--hx-radius-full` |
| `font-size` | `--hx-font-size-sm`, `--hx-font-size-md`, `--hx-font-size-lg` |
| `font-weight` | `--hx-font-weight-normal`, `--hx-font-weight-bold` |
| `line-height` | `--hx-line-height-tight`, `--hx-line-height-normal` |
| `shadow` | `--hx-shadow-sm`, `--hx-shadow-md`, `--hx-shadow-lg` |
| `transition` | `--hx-transition-fast`, `--hx-transition-normal` |
| `z-index` | `--hx-z-dropdown`, `--hx-z-modal`, `--hx-z-toast` |

---

## Token Fallback Chains in Shadow DOM

### Pattern

Components use private custom properties (`--_`) that reference the component token, falling back to the semantic token:

```css
:host {
  /* Private property = component token || semantic token */
  --_bg: var(--hx-button-bg, var(--hx-color-primary));
  --_color: var(--hx-button-color, var(--hx-color-on-primary));
  --_padding-x: var(--hx-button-padding-x, var(--hx-spacing-md));
  --_padding-y: var(--hx-button-padding-y, var(--hx-spacing-sm));
  --_radius: var(--hx-button-radius, var(--hx-radius-md));
  --_font-size: var(--hx-button-font-size, var(--hx-font-size-md));
  --_font-weight: var(--hx-button-font-weight, var(--hx-font-weight-bold));
  --_transition: var(--hx-button-transition, var(--hx-transition-fast));

  /* Use private properties in actual styles */
  background: var(--_bg);
  color: var(--_color);
  padding: var(--_padding-y) var(--_padding-x);
  border-radius: var(--_radius);
  font-size: var(--_font-size);
  font-weight: var(--_font-weight);
  transition: background var(--_transition), color var(--_transition);
}
```

### Why Private Properties

- Prevents accidental override of internal wiring
- Single place to change the fallback chain
- Cleaner CSS in pseudo-class and variant blocks

```css
/* Variants use the same private properties */
:host([variant="secondary"]) {
  --_bg: var(--hx-button-secondary-bg, var(--hx-color-secondary));
  --_color: var(--hx-button-secondary-color, var(--hx-color-on-secondary));
}
```

---

## Validating Token Usage

### What to Check

1. **No hardcoded colors:** Search for hex values (`#`), `rgb(`, `hsl(` in component styles
2. **No hardcoded spacing:** Search for pixel values (`px`) or rem values not from tokens
3. **No hardcoded typography:** Search for `font-size`, `font-weight`, `line-height` with raw values
4. **No hardcoded timing:** Search for `transition`, `animation` with raw `ms` or `s` values
5. **No hardcoded z-index:** Search for `z-index` with raw numbers
6. **No hardcoded shadows:** Search for `box-shadow` with raw values
7. **No hardcoded border-radius:** Search for `border-radius` with raw values

### Automated Validation

```bash
# Search for hardcoded colors in component styles
grep -rn '#[0-9a-fA-F]\{3,8\}' packages/hx-library/src/components/ --include="*.styles.ts"
grep -rn 'rgb\|rgba\|hsl\|hsla' packages/hx-library/src/components/ --include="*.styles.ts"

# Search for hardcoded pixel values (excluding 0px, 1px for borders)
grep -rn '[2-9]px\|[0-9][0-9]px' packages/hx-library/src/components/ --include="*.styles.ts"

# Search for hardcoded font sizes
grep -rn 'font-size:.*[0-9]' packages/hx-library/src/components/ --include="*.styles.ts" | grep -v 'var('
```

### Exceptions

Some values are legitimately hardcoded:

- `0` (zero is zero, no token needed)
- `1px` for borders (unless there is a `--hx-border-width` token)
- `100%`, `50%` (relative values, not design decisions)
- `currentColor` (inherits, not hardcoded)
- `inherit`, `initial`, `unset` (CSS keywords)
- `transparent` (absence of color)

---

## Consumer Override Patterns

### Theming at Semantic Level

Consumers override semantic tokens to theme the entire library:

```css
:root {
  /* Override semantic tokens for brand theming */
  --hx-color-primary: #1a73e8;
  --hx-color-secondary: #5f6368;
  --hx-color-error: #d93025;
  --hx-spacing-md: 1.25rem;
}
```

### Per-Component Override

Consumers override component tokens for specific component customization:

```css
hx-button {
  --hx-button-bg: navy;
  --hx-button-radius: 0;
}
```

### Per-Instance Override

```html
<hx-button style="--hx-button-bg: green;">Custom</hx-button>
```

### Override Priority

1. Inline style (per-instance) -- highest specificity
2. Component token (per-component rule)
3. Semantic token (theme-level)
4. Default value in component styles -- lowest priority

---

## HELiXiR Integration for Token Scoring

The HELiXiR MCP server scores components on token usage. Use these tools to validate:

```
# Check token usage score for a component
mcp__helixir__score_component --name hx-button

# Find which tokens a component uses
mcp__helixir__find_components_using_token --token --hx-color-primary

# Get all design tokens defined in the library
mcp__helixir__get_design_tokens

# Find a specific token definition
mcp__helixir__find_token --name --hx-color-primary
```

### Token Score Criteria

- **100%:** All visual properties use tokens with proper fallback chains
- **Deductions for:** Hardcoded values, missing fallbacks, wrong cascade level, undocumented tokens
- **Target:** Every component should score 90%+ on token usage

---

## Token Documentation

Every CSS custom property must be documented in the component's JSDoc:

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary)] - Button background color
 * @cssprop [--hx-button-color=var(--hx-color-on-primary)] - Button text color
 * @cssprop [--hx-button-padding-x=var(--hx-spacing-md)] - Horizontal padding
 * @cssprop [--hx-button-padding-y=var(--hx-spacing-sm)] - Vertical padding
 * @cssprop [--hx-button-radius=var(--hx-radius-md)] - Border radius
 * @cssprop [--hx-button-font-size=var(--hx-font-size-md)] - Font size
 */
```

This drives CEM generation, Storybook autodocs, and the documentation site. If a token is not documented here, consumers do not know it exists.
