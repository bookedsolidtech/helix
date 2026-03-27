---
title: JSDoc for Components
description: Document HELiX web components with JSDoc tags that generate Custom Elements Manifest entries, Storybook autodocs, and IDE tooltips.
---

JSDoc comments in HELiX component source files serve two purposes: they document intent for human readers and they feed the Custom Elements Manifest analyzer to produce machine-readable API descriptions. This page covers every tag in use.

## The Standard Tag Set

HELiX uses these JSDoc tags on every component class:

| Tag | Purpose |
|---|---|
| `@summary` | One-line description used in CEM and docs |
| `@tag` | Custom element tag name (sometimes inferred from `@customElement`) |
| `@slot` | Named and default slot documentation |
| `@fires` | Custom event documentation with type |
| `@csspart` | CSS part documentation |
| `@cssprop` | CSS custom property with default value |

## Full Example — `hx-button`

```typescript
/**
 * A production-grade button component for user interaction. Supports multiple
 * visual variants, sizes, loading state, prefix/suffix slots, anchor rendering,
 * and full ElementInternals form association.
 *
 * @summary Primary interactive element for triggering actions and form submission.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the button is clicked and is neither disabled nor loading.
 *
 * @csspart button - The native button or anchor element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 * @csspart spinner - The loading spinner element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(LitElement) {
```

## `@summary`

A single sentence that describes what the component does. This appears in:

- CEM `summary` field (consumed by Storybook and design tools)
- IDE hover documentation
- HELiX docs site component index

```typescript
/**
 * @summary Displays a dismissable notification banner at page level.
 */
```

Keep it under 120 characters. Do not repeat the component name.

## `@tag`

Explicitly documents the custom element tag name. Often inferred from `@customElement`, but explicit documentation is required for components that register multiple tag names or for abstract base classes:

```typescript
/**
 * @tag hx-alert
 */
```

## `@slot`

Document each slot. The unnamed default slot uses an empty name:

```typescript
/**
 * @slot - Main content area.
 * @slot header - Optional header content displayed above the body.
 * @slot footer - Optional footer with actions.
 * @slot icon - Icon displayed in the leading position.
 */
```

Slots appear in the Storybook autodocs table and in CEM `slots[]`.

## `@fires`

Document every custom event with its full type signature:

```typescript
/**
 * @fires {CustomEvent<void>} hx-dismiss - Fired when the user dismisses the component.
 * @fires {CustomEvent<{checked: boolean}>} hx-change - Fired when the checked state changes.
 * @fires {CustomEvent<{value: string; label: string}>} hx-select - Fired when an option is selected.
 */
```

Format: `@fires {EventType<DetailType>} event-name - Description.`

The CEM analyzer reads the type expression from the `{}` block and the event name that follows. Storybook displays these in the "Events" section of autodocs.

## `@csspart`

Document every named CSS part that consumers can style via `::part()`:

```typescript
/**
 * @csspart base - The root container element.
 * @csspart input - The native input element.
 * @csspart label - The floating label element.
 * @csspart helper - The helper/error text container.
 */
```

HELiX naming convention: `base` for the root, semantic names for inner regions. Avoid generic names like `wrapper` or `container`.

## `@cssprop`

Document CSS custom properties that consumers can override to style the component. Include the default value in square brackets:

```typescript
/**
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-border-color=var(--hx-color-neutral-200)] - Card border color.
 * @cssprop [--hx-card-border-radius=var(--hx-border-radius-lg)] - Card corner radius.
 * @cssprop [--hx-card-padding=var(--hx-spacing-lg)] - Internal padding.
 * @cssprop [--hx-card-shadow=var(--hx-shadow-sm)] - Card drop shadow.
 */
```

Format: `@cssprop [--property-name=defaultValue] - Description.`

The default value must be a valid CSS expression. Wrapping it in `[]` is required by the CEM analyzer.

## Documenting Properties

Property-level JSDoc comments appear above the `@property` decorator:

```typescript
/**
 * Visual style variant of the component.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'tertiary' = 'primary';

/**
 * Whether the component is disabled. Prevents all user interaction.
 * @attr disabled
 */
@property({ type: Boolean, reflect: true })
disabled = false;
```

The `@attr` tag documents the corresponding HTML attribute name. When the attribute name matches the property name (the most common case), the CEM analyzer infers it automatically.

## Marking Internal Members

Use `@internal` to exclude private implementation details from the CEM:

```typescript
/** @internal */
private _internals: ElementInternals;

/** @internal */
private _handleClick(e: MouseEvent) { /* ... */ }
```

Fields and methods marked `@internal` are excluded from the generated `custom-elements.json` and do not appear in Storybook or IDE completions.

## Next Steps

- [Custom Elements Manifest](/components-guide/documentation/cem-fundamentals/) — how CEM is generated from these tags
- [Storybook for Web Components](/components-guide/documentation/storybook/) — autodocs pages powered by JSDoc + CEM
- [API Documentation](/components-guide/documentation/api-docs/) — publishing the documented API
