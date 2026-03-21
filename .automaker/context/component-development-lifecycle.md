# Component Development Lifecycle

The full workflow from creation to merge for a HELiX web component.

---

## 1. Component Scaffolding

### File Structure

Every component follows this structure:

```
packages/hx-library/src/components/hx-{name}/
  index.ts              # Re-export
  hx-{name}.ts          # Component class
  hx-{name}.styles.ts   # Lit CSS tagged template
  hx-{name}.test.ts     # Vitest browser tests
```

Stories are in the Storybook app:

```
apps/storybook/src/stories/hx-{name}.stories.ts
```

### Naming Conventions

- Tag name: `hx-{name}` (lowercase, hyphenated)
- Class name: `Hx{Name}` (PascalCase with Hx prefix)
- File names: `hx-{name}.ts` (match tag name)
- Events: `hx-{event-name}` (e.g., `hx-change`, `hx-select`)
- CSS properties: `--hx-{name}-{property}` (e.g., `--hx-button-bg`)
- CSS parts: lowercase, hyphenated (e.g., `part="button"`, `part="input-wrapper"`)

### index.ts Template

```typescript
export { Hx{Name} } from './hx-{name}.js';
```

### Registration

Components are registered in the main library entry point:

```typescript
// packages/hx-library/src/index.ts
export { Hx{Name} } from './components/hx-{name}/index.js';
```

---

## 2. Implementation (Lit 3.x)

### Component Class Template

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styles } from './hx-{name}.styles.js';

/**
 * @tag hx-{name}
 * @summary Brief description of the component
 *
 * @slot - Default slot content
 * @slot prefix - Content before the main content
 *
 * @csspart container - The outer container
 *
 * @cssprop [--hx-{name}-bg=var(--hx-color-surface)] - Background color
 *
 * @fires hx-change - Fired when value changes
 */
@customElement('hx-{name}')
export class Hx{Name} extends LitElement {
  static styles = styles;

  /** Description of the property */
  @property({ type: String }) label = '';

  /** Internal reactive state */
  @state() private _internalState = false;

  render() {
    return html`
      <div part="container">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-{name}': Hx{Name};
  }
}
```

### Shadow DOM Patterns

- Always use Shadow DOM (Lit default)
- Use `<slot>` for content projection
- Named slots for structured content (`<slot name="header">`)
- CSS parts for external styling (`part="button"`)
- `delegatesFocus: true` for components wrapping focusable elements

### ElementInternals (Form Components)

```typescript
static formAssociated = true;

constructor() {
  super();
  this.internals = this.attachInternals();
}
```

---

## 3. Design Token Integration

### 3-Tier Cascade

```
Primitive → Semantic → Component
```

### Styles Template

```typescript
// hx-{name}.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    /* Component-level tokens with semantic fallbacks */
    --_bg: var(--hx-{name}-bg, var(--hx-color-surface));
    --_color: var(--hx-{name}-color, var(--hx-color-on-surface));
    --_padding: var(--hx-{name}-padding, var(--hx-spacing-md));
    --_radius: var(--hx-{name}-radius, var(--hx-radius-md));
    --_font-size: var(--hx-{name}-font-size, var(--hx-font-size-md));

    display: block;
    background: var(--_bg);
    color: var(--_color);
    padding: var(--_padding);
    border-radius: var(--_radius);
    font-size: var(--_font-size);
  }
`;
```

### Rules

- Never hardcode colors, spacing, typography, or timing values
- Always provide semantic fallbacks: `var(--hx-component-prop, var(--hx-semantic-prop))`
- Use private custom properties (`--_`) for internal consumption
- Document all CSS custom properties with `@cssprop` JSDoc

---

## 4. Test Authoring

### Test File Template

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, shadowQuery, oneEvent } from '../../test-utils.js';
import './hx-{name}.js';

describe('hx-{name}', () => {
  afterEach(cleanup);

  it('renders with default properties', async () => {
    const el = await fixture('<hx-{name}></hx-{name}>');
    expect(el).toBeDefined();
    expect(el.shadowRoot).toBeDefined();
  });

  it('reflects properties to attributes', async () => {
    const el = await fixture('<hx-{name} label="Test"></hx-{name}>');
    expect(el.label).toBe('Test');
  });

  it('fires hx-change event', async () => {
    const el = await fixture('<hx-{name}></hx-{name}>');
    const eventPromise = oneEvent(el, 'hx-change');
    // trigger change...
    const event = await eventPromise;
    expect(event).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const el = await fixture('<hx-{name} label="Test"></hx-{name}>');
    // axe-core audit
  });
});
```

### Test Coverage Requirements

- All public properties (default values, setting values, reflection)
- All public methods
- All events (firing, event detail, bubbling/composed)
- All slots (default content, slotted content)
- Keyboard interaction
- Accessibility (axe-core, ARIA attributes)
- Edge cases (empty strings, undefined, rapid updates)

---

## 5. Story Authoring

### Story File Template

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Import CEM data for autodocs
import '@helixui/library/components/hx-{name}';

const meta: Meta = {
  title: 'Components/hx-{name}',
  component: 'hx-{name}',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    label: 'Example',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
  },
};

export const WithSlot: Story = {
  render: () => html`
    <hx-{name}>
      <span slot="prefix">Icon</span>
      Slotted content
    </hx-{name}>
  `,
};
```

### Story Requirements

- Default story with all default properties
- Story for each variant (size, color, state)
- Story demonstrating slot usage
- Story demonstrating event handling
- Controls for all public properties (auto-generated from CEM)

---

## 6. CEM Generation and Validation

```bash
# Generate Custom Elements Manifest
pnpm run cem

# Output: packages/hx-library/custom-elements.json
```

### JSDoc Requirements for CEM

Every component must have these JSDoc tags:

- `@tag` - Custom element tag name
- `@summary` - Brief description
- `@slot` - Each slot (name and description)
- `@csspart` - Each CSS part
- `@cssprop` - Each CSS custom property (with default)
- `@fires` - Each event

Properties are picked up automatically from `@property` decorators.

---

## 7. Accessibility Audit

See `accessibility-workflow.md` for full details.

Minimum checks:
- axe-core audit passes (zero violations)
- Keyboard navigation works for all interactive elements
- Focus management is correct (delegation, trapping, return)
- Screen reader announces role, name, and state
- Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)

---

## 8. Performance Audit

- Bundle size: `< 5KB` minified + gzipped
- No unnecessary runtime dependencies
- Efficient rendering (avoid unnecessary re-renders)
- Lazy loading for heavy features
- Tree-shakeable exports

---

## 9. 3-Tier Code Review

See `3-tier-review-workflow.md` for full details.

1. Tier 1 (`code-reviewer`): Standards, patterns, basic quality
2. Tier 2 (`senior-code-reviewer`): Strict review, edge cases, API design
3. Tier 3 (`chief-code-reviewer`): Final precision review

All three tiers must approve before merge.

---

## 10. Changeset and PR

### Create Changeset

```bash
pnpm changeset
```

Select the package (`@helixui/library`), bump type (patch/minor/major), and write a summary.

### Changeset File

```markdown
---
'@helixui/library': minor
---

Add hx-{name} component with full a11y support, design token integration, and Storybook stories
```

### PR Checklist

- [ ] All 7 quality gates pass
- [ ] Changeset created with appropriate bump type
- [ ] `pnpm run verify` passes (lint + format + type-check)
- [ ] Tests pass with 80%+ coverage
- [ ] Stories render correctly in Storybook
- [ ] CEM is accurate and regenerated
- [ ] No bundle size regression
- [ ] 3-tier code review complete
