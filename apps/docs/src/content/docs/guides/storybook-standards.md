---
title: Storybook Story Standards
description: Standards for writing Storybook stories that serve as living documentation for HELiX components.
---

## Overview

Every HELiX component ships with a `.stories.ts` file colocated with the component source. These stories serve as living documentation, interactive examples, and visual regression test fixtures. This guide documents the standards every story file must meet.

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

A `Default` export showing the component with minimal props. This serves as the primary documentation entry point.

```ts
export const Default: Story = {
  args: { label: 'Button' },
};
```

### 2. All Visual Variants

One story per visual variant (`variant`, `size`, `appearance`, etc.). Name stories after the variant value.

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
      <hx-icon slot="prefix" name="check"></hx-icon>
      Save
    </hx-button>
  `,
};
```

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
  title: 'Components/hx-button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
  },
};
export default meta;
```

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

Run the story coverage audit to verify all components have stories:

```bash
node scripts/audit-story-coverage.js
```

This script is also run as part of the CI pipeline to prevent merging components without stories.
