---
title: Storybook Story Standards
description: Standards for writing Storybook stories that serve as living documentation for HELiX components.
---

## Overview

Every public HELiX custom element ships with a colocated `.stories.ts` file. (Internal child elements that exist purely to be slotted under their parent — e.g. `hx-accordion-item` or `hx-radio` — may not have their own story file; the parent's stories exercise them. The story-coverage audit excludes those by directory.) These stories serve as living documentation, interactive examples, and visual regression test fixtures. This guide documents the standards every story file must meet.

## File Structure

```
src/components/hx-button/
  hx-button.ts           # Component source
  hx-button.styles.ts    # Styles
  hx-button.test.ts      # Tests
  hx-button.stories.ts   # Stories (this file)
```

## Minimum Story Requirements

Every component story file must include:

### 1. Default Story

A `Default` export showing the component with minimal props (with rare exceptions like `hx-theme`, which is a configuration-only element with no visible default state). This serves as the primary documentation entry point.

```ts
// hx-button's default slot is the label — pass it via render, not an args 'label' prop.
export const Default: Story = {
  render: () => html`<hx-button>Button</hx-button>`,
};
```

### 2. All Visual Variants

One story per visual variant (`variant`, `hx-size`, etc.). Name stories after the variant value. HELiX components don't use an `appearance` property — drop that if it appears in legacy stories.

```ts
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger' } };
```

### 3. State Stories

Stories for interactive states: disabled, loading, error, readonly.

```ts
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = { args: { error: 'This field is required' } };
```

### 4. Slot Stories

Stories demonstrating named slots when the component uses them.

```ts
export const WithIcon: Story = {
  render: () => html`
    <hx-button>
      <hx-icon slot="prefix" library="default" name="check"></hx-icon>
      Save
    </hx-button>
  `,
};
```

`hx-icon` requires an explicit `library` attribute to resolve from a registered icon library (e.g. `default`, `helix`); without it the component falls back to document-local sprite lookup.

## CEM-Driven Autodocs

Storybook 10.x reads the Custom Elements Manifest (`custom-elements.json`) to auto-generate:

- Property tables with types, defaults, and descriptions
- Event documentation
- CSS custom property tables
- Slot documentation
- CSS part documentation

Ensure all public API surfaces have JSDoc in the component source. The CEM analyzer extracts documentation from:

- `@property()` decorator descriptions
- `@fires` JSDoc tags
- `@slot` JSDoc tags
- `@csspart` JSDoc tags
- `@cssprop` JSDoc tags

## Story Metadata

Use the meta object to configure story behavior:

```ts
const meta: Meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'],
    },
  },
};
export default meta;
```

Storybook titles use a humanized name (`Components/Button`), not the tag name. Keep the `component` field as the literal tag name so Storybook can wire CEM-driven autodocs. The `variant` options list must match the component's CEM union exactly — for `hx-button` that's `'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'`.

## Accessibility Stories

Components with complex ARIA patterns should include stories that demonstrate accessibility behavior:

```ts
/** Demonstrates keyboard navigation through the listbox. */
export const KeyboardNavigation: Story = { ... };

/** Screen reader announcement when error state is set. */
export const ErrorAnnouncement: Story = { ... };
```

## Healthcare-Specific Stories

For clinical components (`hx-phi-field`, `hx-patient-banner`, `hx-clinical-status`), include stories that demonstrate the healthcare-specific behavior:

```ts
/** PHI field with masked SSN value. */
export const MaskedSSN: Story = { ... };

/** Patient banner with two-identifier rule enforcement. */
export const TwoIdentifierRule: Story = { ... };
```

## Story Coverage Audit

Run the story coverage audit to verify component directories have a `.stories.ts` file:

```bash
node scripts/audit-story-coverage.js
```

The audit walks `packages/hx-library/src/components/*/` and reports any directory missing a `.stories.ts` file. The check is **local-only** today — it is not wired into the GitHub Actions CI pipeline. Run it manually before opening a PR that adds or restructures component directories.
