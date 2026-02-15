# Design Token Documentation Strategy

**Status**: Implementation roadmap for Phase 2
**Priority**: CRITICAL - Tokens are the foundation of the design system

---

## Overview

Design tokens are the **single source of truth** for visual design decisions. They ensure consistency across:

1. **Web Component library** (Lit components)
2. **Documentation hub** (Astro/Starlight)
3. **Storybook** (component playground)
4. **Figma** (design team's design system)

---

## 3-Tier Token Architecture

### Tier 1: Primitives (Base Tokens)

**Private** - Not exposed to consumers

```json
{
  "color": {
    "blue": {
      "50": { "$type": "color", "$value": "#eff6ff" },
      "100": { "$type": "color", "$value": "#dbeafe" },
      "500": { "$type": "color", "$value": "#3b82f6" },
      "900": { "$type": "color", "$value": "#1e3a8a" }
    }
  },
  "spacing": {
    "1": { "$type": "dimension", "$value": "0.25rem" },
    "2": { "$type": "dimension", "$value": "0.5rem" },
    "4": { "$type": "dimension", "$value": "1rem" }
  },
  "fontSize": {
    "xs": { "$type": "dimension", "$value": "0.75rem" },
    "sm": { "$type": "dimension", "$value": "0.875rem" },
    "base": { "$type": "dimension", "$value": "1rem" }
  }
}
```

### Tier 2: Semantic (Decision Tokens)

**Public API** - Consumers reference these

```json
{
  "color": {
    "surface": {
      "primary": { "$type": "color", "$value": "{color.blue.50}" },
      "secondary": { "$type": "color", "$value": "{color.blue.100}" }
    },
    "text": {
      "primary": { "$type": "color", "$value": "{color.blue.900}" },
      "secondary": { "$type": "color", "$value": "{color.blue.700}" }
    },
    "interactive": {
      "primary-default": { "$type": "color", "$value": "{color.blue.500}" },
      "primary-hover": { "$type": "color", "$value": "{color.blue.600}" }
    }
  }
}
```

### Tier 3: Component (Component-Specific Tokens)

**Component overrides** - Optional customization

```json
{
  "button": {
    "background": { "$type": "color", "$value": "{color.interactive.primary-default}" },
    "text": { "$type": "color", "$value": "{color.text.inverse}" },
    "padding-x": { "$type": "dimension", "$value": "{spacing.4}" },
    "padding-y": { "$type": "dimension", "$value": "{spacing.2}" }
  }
}
```

---

## Documentation Strategy

### 1. Documentation Hub (Astro/Starlight)

**Location**: `apps/docs/src/content/docs/design-tokens/`

**Pages to Create**:

- `overview.md` - Introduction to token system, W3C DTCG compliance
- `tiers.md` - Explanation of 3-tier architecture with examples
- `primitives.md` - Complete reference of Tier 1 (private) tokens
- `semantic.md` - Complete reference of Tier 2 (public API) tokens
- `component.md` - Complete reference of Tier 3 (component-specific) tokens
- `theming.md` - How to create custom themes using tokens
- `customization.md` - Guide for overriding tokens in consumer applications
- `figma-integration.md` - How to sync tokens between code and Figma
- `color-modes.md` - Light/dark/high-contrast mode implementation
- `usage-examples.md` - Real-world examples of token usage

**Interactive Token Tables**:

```markdown
## Color Tokens

| Token                         | Value     | Preview | Usage                      |
| ----------------------------- | --------- | ------- | -------------------------- |
| `--hds-color-surface-primary` | `#eff6ff` | 🟦      | Primary surface background |
| `--hds-color-text-primary`    | `#1e3a8a` | 🟦      | Primary text color         |
```

**Live Token Previews**:
Create Astro components that render actual color swatches, spacing examples, typography specimens using the real tokens.

### 2. Storybook (Component Playground)

**Location**: `apps/storybook/stories/` (Phase 3)

**Token Visualization Stories**:

#### Colors Story

```typescript
// colors.stories.ts
export default {
  title: 'Design Tokens/Colors',
  parameters: {
    layout: 'padded',
  },
};

export const SurfaceColors = () => {
  return {
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <color-swatch token="--hds-color-surface-primary" name="Surface Primary"></color-swatch>
        <color-swatch token="--hds-color-surface-secondary" name="Surface Secondary"></color-swatch>
        <!-- More swatches -->
      </div>
    `,
  };
};
```

#### Spacing Story

```typescript
// spacing.stories.ts
export const SpacingScale = () => {
  return {
    template: `
      <div>
        <spacing-example size="1" label="Space 1 (0.25rem)"></spacing-example>
        <spacing-example size="2" label="Space 2 (0.5rem)"></spacing-example>
        <!-- More examples -->
      </div>
    `,
  };
};
```

#### Typography Story

```typescript
// typography.stories.ts
export const TypeScale = () => {
  return {
    template: `
      <type-specimen size="xs" text="The quick brown fox jumps over the lazy dog"></type-specimen>
      <type-specimen size="sm" text="The quick brown fox jumps over the lazy dog"></type-specimen>
      <!-- More specimens -->
    `,
  };
};
```

**Storybook Addons**:

- **`@whitespace/storybook-addon-html`** - View generated HTML with tokens applied
- **`storybook-addon-designs`** - Link to Figma design files
- **`@storybook/addon-a11y`** - Verify color contrast ratios meet WCAG standards
- **Custom addon**: Token inspector that shows which tokens are applied to each element

### 3. Figma Integration

**Figma Tokens Plugin** (https://www.figma.com/community/plugin/843461159747178978)

**Workflow**:

```
Code (W3C DTCG JSON)
    ↓
[Export tokens.json]
    ↓
Figma Tokens Plugin
    ↓
Figma Design System
    ↓
[Sync back to code]
    ↓
Code (W3C DTCG JSON)
```

**Implementation**:

1. Export tokens from code as W3C DTCG JSON
2. Import into Figma via Figma Tokens plugin
3. Design team works in Figma using tokens
4. Changes synced back to code repository
5. CI/CD validates token changes
6. Design team reviews automated PR

**Figma Integration Documentation** (`figma-integration.md`):

- Step-by-step setup guide for Figma Tokens plugin
- How to import tokens.json into Figma
- How to use tokens in Figma designs
- How to propose token changes from Figma
- How to sync Figma changes back to code

### 4. Token Build Pipeline

**Tools**:

- **Style Dictionary 4.x** or **Terrazzo** for token transformation
- **W3C DTCG format** as source of truth
- **Multiple output formats**: CSS custom properties, JSON, TypeScript, SCSS, Figma JSON

**Build Process**:

```bash
tokens/design-tokens.json (W3C DTCG source)
    ↓
[Terrazzo/Style Dictionary]
    ↓
    ├─→ dist/tokens.css (CSS custom properties)
    ├─→ dist/tokens.json (JSON for docs)
    ├─→ dist/tokens.d.ts (TypeScript types)
    ├─→ dist/tokens.scss (SCSS variables)
    └─→ dist/figma-tokens.json (Figma plugin format)
```

---

## Token Governance

### Documentation Requirements

Every token must have:

- **Name** - Descriptive, follows naming convention
- **Value** - Actual value or reference to another token
- **Type** - color, dimension, fontFamily, etc. (W3C DTCG types)
- **Description** - What the token is for
- **Usage** - Where and how to use it
- **Do/Don't** - Examples of correct and incorrect usage

### Naming Convention

**Format**: `--{prefix}-{category}-{property}-{variant}-{state}`

**Examples**:

- `--hds-color-text-primary` (semantic token)
- `--hds-color-text-primary-hover` (with state)
- `--hds-space-inset-md` (spacing token)
- `--chc-button-background-primary-default` (component token)

**Prefixes**:

- `--hds-` = Health Design System (semantic tokens)
- `--chc-` = Component Health Component (component tokens)
- No prefix = Primitive tokens (internal only)

### Token Documentation Template

```markdown
## Token: `--hds-color-interactive-primary-default`

**Category**: Color → Interactive
**Type**: `color`
**Value**: `#3b82f6`
**References**: `{color.blue.500}`

**Description**: Default background color for primary interactive elements (buttons, links, form inputs).

**Usage**:

- Primary action buttons
- Interactive links
- Active navigation items
- Primary badges

**Accessibility**:

- Contrast ratio with white text: 4.63:1 (WCAG AA Large Text)
- Contrast ratio with black text: 4.54:1 (WCAG AA Large Text)

**Do**:
✅ Use for primary call-to-action buttons
✅ Use for primary navigation active states
✅ Use with white or very light text for proper contrast

**Don't**:
❌ Don't use for body text
❌ Don't use with low-contrast text colors
❌ Don't use as background for large text blocks

**Examples**:
[Visual examples with code snippets]
```

---

## Token Usage in Components

### Example: Button Component

```typescript
// chc-button.ts
@customElement('chc-button')
export class ChcButton extends LitElement {
  static styles = css`
    :host {
      /* Component tokens with fallback to semantic tokens */
      --_button-bg: var(
        --chc-button-background-primary-default,
        var(--hds-color-interactive-primary-default)
      );
      --_button-text: var(--chc-button-text-primary, var(--hds-color-text-inverse));
      --_button-padding-x: var(--chc-button-padding-x, var(--hds-space-4));
      --_button-padding-y: var(--chc-button-padding-y, var(--hds-space-2));

      display: inline-flex;
      background: var(--_button-bg);
      color: var(--_button-text);
      padding: var(--_button-padding-y) var(--_button-padding-x);
    }

    :host(:hover) {
      --_button-bg: var(
        --chc-button-background-primary-hover,
        var(--hds-color-interactive-primary-hover)
      );
    }
  `;
}
```

**Three-Level Fallback Chain**:

1. Component token (most specific): `--chc-button-background-primary-default`
2. Semantic token (public API): `--hds-color-interactive-primary-default`
3. Hardcoded fallback: `#3b82f6`

---

## Validation & Testing

### Token CI/CD Checks

1. **Schema validation**: Tokens conform to W3C DTCG spec
2. **Naming convention**: All tokens follow naming rules
3. **Contrast ratios**: Color combinations meet WCAG AA/AAA
4. **No breaking changes**: Semantic token values/names don't change without major version bump
5. **Documentation**: Every token has required documentation fields

### Visual Regression Testing

Use **Chromatic** or **Percy** to catch unintended visual changes when tokens are updated.

---

## Rollout Plan

### Phase 2 (Weeks 3-6): Token Foundation

- [ ] Create `tokens/design-tokens.json` (W3C DTCG format)
- [ ] Configure Terrazzo/Style Dictionary build pipeline
- [ ] Generate CSS custom properties, JSON, TypeScript types
- [ ] Document all tokens in Astro/Starlight
- [ ] Create token usage examples

### Phase 3 (Week 7): Storybook Token Visualization

- [ ] Create Storybook stories for colors, spacing, typography
- [ ] Build custom token inspector addon
- [ ] Add links to Figma design files
- [ ] Verify WCAG contrast ratios with a11y addon

### Phase 4 (Week 8): Figma Integration

- [ ] Export tokens to Figma-compatible JSON
- [ ] Document Figma Tokens plugin setup
- [ ] Train design team on Figma token usage
- [ ] Establish token sync workflow (Figma ↔ Code)

### Phase 5 (Weeks 9-10): Documentation Polish

- [ ] Interactive token tables in docs
- [ ] Live token preview components
- [ ] Usage examples for each token
- [ ] Do/don't guidelines
- [ ] Figma integration guide

---

## Success Metrics

- [ ] 100% of tokens documented
- [ ] All color combinations pass WCAG AA contrast checks
- [ ] Figma design system synced with code tokens
- [ ] Design team using tokens in Figma (not hardcoded values)
- [ ] Zero inconsistencies between Figma and code
- [ ] Token changes trigger visual regression tests
- [ ] Documentation includes live previews of all tokens

---

## Resources

- [W3C Design Token Community Group](https://www.w3.org/community/design-tokens/)
- [DTCG Format Specification](https://tr.designtokens.org/format/)
- [Terrazzo Documentation](https://terrazzo.dev/)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Figma Tokens Plugin](https://www.figma.com/community/plugin/843461159747178978)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Last Updated**: February 13, 2026
**Status**: Ready for Phase 2 implementation
