---
title: CSS Parts API
description: Master the CSS Shadow Parts API for styling web component internals with the ::part() selector, part forwarding, and enterprise theming patterns.
sidebar:
  order: 4
---

CSS Shadow Parts provide a standardized, powerful mechanism for styling elements inside a shadow DOM from outside the component. While CSS custom properties control values (colors, spacing), parts expose specific elements for direct styling—giving consumers precise control over component appearance while maintaining encapsulation boundaries.

This guide explores the CSS Parts API in depth, covering the `part` attribute, the `::part()` pseudo-element, part forwarding with `exportparts`, design patterns, and theming strategies proven in enterprise healthcare systems.

## Prerequisites

Before diving into CSS Parts, ensure you understand:

- [Shadow DOM Architecture](/components/shadow-dom/architecture) — Core concepts of shadow trees, shadow boundaries, and style encapsulation
- Basic CSS selector syntax and specificity
- Web component fundamentals (custom elements, templates)

## What Are CSS Shadow Parts?

Shadow DOM encapsulation prevents external CSS from penetrating component internals—a critical feature for isolation. But this creates a challenge: **how do consumers customize component appearance beyond what CSS custom properties allow?**

CSS Shadow Parts solve this by letting component authors **explicitly expose** internal elements for styling. These exposed elements become "parts" that consumers can target from outside the shadow boundary using the `::part()` pseudo-element.

### The Core Problem

Consider a button component with shadow DOM:

```html
<hx-button>
  #shadow-root (mode: open)
  <button class="button">
    <slot></slot>
  </button>
</hx-button>
```

**Without parts**, consumers cannot style the internal `<button>` element. Global CSS cannot penetrate the shadow boundary:

```css
/* ❌ This does NOT work — selector cannot cross shadow boundary */
hx-button button {
  border-radius: 0;
}
```

**With parts**, the component author exposes the button:

```typescript
// hx-button.ts
render() {
  return html`
    <button part="button" class="button">
      <slot></slot>
    </button>
  `;
}
```

**Now consumers can style it**:

```css
/* ✅ This works — ::part() crosses the shadow boundary */
hx-button::part(button) {
  border-radius: 0;
}
```

### The Contract Model

Parts establish a **styling contract** between component authors and consumers:

- **Authors** decide which elements are styleable by adding `part` attributes
- **Consumers** style those parts via `::part()` selectors
- **Browser** enforces the boundary—only exposed parts are accessible

This is **opt-in theming**. Unlike global CSS chaos, parts provide controlled, intentional styling access.

## Defining Parts: The `part` Attribute

Component authors define parts by adding the global `part` attribute to elements in their shadow DOM templates.

### Basic Syntax

```typescript
// hx-text-input.ts
override render() {
  return html`
    <div part="field" class="field">
      <label part="label" class="field__label">
        ${this.label}
      </label>
      <div part="input-wrapper" class="field__input-wrapper">
        <input part="input" class="field__input" type="text" />
      </div>
      <div part="help-text" class="field__help-text">
        ${this.helpText}
      </div>
      <div part="error" class="field__error">
        ${this.error}
      </div>
    </div>
  `;
}
```

Each `part` attribute exposes that element as a styleable part. The part name (e.g., `"input"`, `"label"`) becomes the identifier consumers use with `::part()`.

### Multiple Part Names on One Element

A single element can expose **multiple part names**, separated by spaces:

```typescript
render() {
  return html`
    <div part="alert message-container" class="alert">
      <div part="icon alert-icon" class="alert__icon">
        <slot name="icon"></slot>
      </div>
      <div part="message content" class="alert__message">
        <slot></slot>
      </div>
    </div>
  `;
}
```

**Consumer can target using any name**:

```css
/* All three selectors target the same element */
hx-alert::part(alert) {
  padding: 1rem;
}
hx-alert::part(message-container) {
  padding: 1rem;
}

/* Either name targets the icon */
hx-alert::part(icon) {
  color: blue;
}
hx-alert::part(alert-icon) {
  color: blue;
}
```

**When to use multiple names**: Provide both generic (`message`) and specific (`alert-icon`) names for flexibility. Use when an element serves multiple conceptual roles.

### Part Naming Conventions

Follow these conventions for maintainability:

| Convention                   | Example                             | Rationale                                |
| ---------------------------- | ----------------------------------- | ---------------------------------------- |
| **Lowercase, hyphenated**    | `part="input-wrapper"`              | Consistent with HTML attribute style     |
| **Semantic, not structural** | `part="message"` not `part="div-3"` | Survives refactoring                     |
| **Scoped when needed**       | `part="card-header"`                | Prevents ambiguity in complex components |
| **Avoid generic names**      | `part="container"` is vague         | Use `part="alert-container"` instead     |

**Anti-pattern**: `part="wrapper-1"`, `part="elem-2"` — meaningless names break on refactor.

**Best practice**: `part="input"`, `part="close-button"`, `part="error-message"` — semantic names communicate intent.

## Styling Parts: The `::part()` Pseudo-Element

Consumers use the `::part()` CSS pseudo-element to style exposed parts from outside the shadow DOM.

### Basic Usage

```css
/* Target the button inside hx-button's shadow DOM */
hx-button::part(button) {
  border-radius: 0;
  text-transform: uppercase;
  font-weight: 700;
}

/* Target the input inside hx-text-input's shadow DOM */
hx-text-input::part(input) {
  border: 2px solid #d1d5db;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Target the card container */
hx-card::part(card) {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

### What You Can Style

The `::part()` selector gives you access to **nearly all CSS properties**:

- **Layout**: `display`, `position`, `flex`, `grid`, `float`
- **Box model**: `width`, `height`, `padding`, `margin`, `border`, `border-radius`
- **Typography**: `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`
- **Visual**: `color`, `background`, `box-shadow`, `opacity`, `filter`
- **Transforms & transitions**: `transform`, `transition`, `animation`
- **Interactions**: `cursor`, `pointer-events`, `user-select`

**Exception**: You cannot modify semantic attributes via CSS (e.g., `role`, `aria-*`). These remain JavaScript/HTML-only.

### Using Pseudo-Classes with Parts

Combine `::part()` with standard pseudo-classes:

```css
/* Hover state */
hx-button::part(button):hover {
  background: #1e40af;
  transform: translateY(-1px);
}

/* Focus state */
hx-text-input::part(input):focus {
  border-color: var(--hx-color-primary-500);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

/* Disabled state */
hx-button::part(button):disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Checked state (for checkboxes, radios) */
hx-checkbox::part(control):checked {
  background: var(--hx-color-primary-500);
  border-color: var(--hx-color-primary-500);
}
```

**Supported pseudo-classes**: `:hover`, `:focus`, `:active`, `:disabled`, `:checked`, `:invalid`, `:valid`, `:first-child`, `:last-child`, `:nth-child()`, and more.

**Unsupported pseudo-classes**: Structural pseudo-classes that match based on tree information **outside** the shadow root (like `:empty` or `:last-child` where siblings are in light DOM) may not work as expected. Test thoroughly.

### Combining with Attribute Selectors

Target parts on specific component states:

```css
/* Style primary button variant */
hx-button[variant='primary']::part(button) {
  background: var(--hx-color-primary-500);
  color: white;
}

/* Style error state inputs */
hx-text-input[error]::part(input) {
  border-color: var(--hx-color-error-500);
}

/* Style disabled cards */
hx-card[disabled]::part(card) {
  opacity: 0.6;
  pointer-events: none;
}
```

**Pattern**: Combine host attribute selectors with part selectors for state-based styling.

### Important Limitations

The `::part()` selector has intentional restrictions to preserve encapsulation:

#### 1. No Descendant Selection

You **cannot** traverse into parts:

```css
/* ❌ These do NOT work */
hx-card::part(body) .some-class {
}
hx-card::part(body) > p {
}
hx-text-input::part(input-wrapper) input {
}
```

**Why?** Allowing descendant selection would expose the entire internal DOM structure, defeating encapsulation.

**Workaround**: If you need to style descendants, the component author must expose them as separate parts:

```typescript
// Expose both wrapper AND input as parts
render() {
  return html`
    <div part="input-wrapper">
      <input part="input" />
    </div>
  `;
}
```

#### 2. No Pseudo-Element Chaining

You **cannot** target pseudo-elements on parts:

```css
/* ❌ This does NOT work */
hx-button::part(button)::before {
  content: '→';
}

/* ❌ This does NOT work either */
hx-text-input::part(label)::after {
  content: ' *';
}
```

**Why?** `::part()` is itself a pseudo-element. CSS doesn't allow chaining pseudo-elements.

**Workaround**: Component authors must expose wrapper elements if consumers need to style pseudo-elements:

```typescript
render() {
  return html`
    <div part="label-wrapper" class="label-wrapper">
      <label part="label">${this.label}</label>
    </div>
  `;
}
```

```css
/* ✅ Now this works */
hx-text-input::part(label-wrapper)::after {
  content: ' *';
  color: red;
}
```

#### 3. Parts Are Scoped to Direct Parent

Without `exportparts`, parts are only visible to the **immediate parent DOM**. Parts in nested shadow roots are hidden (see next section).

## Part Forwarding: `exportparts`

When components nest other components, parts from child components are **not visible** to the outer page by default. The `exportparts` attribute solves this by explicitly forwarding parts up the component tree.

### The Nested Shadow Root Problem

Consider a card component that contains a button:

```html
<!-- Page (Light DOM) -->
<hx-card>
  <!-- hx-card shadow root -->
  #shadow-root
  <div part="card">
    <hx-button>
      <!-- hx-button shadow root (nested) -->
      #shadow-root
      <button part="button">Click</button>
    </hx-button>
  </div>
</hx-card>
```

**Without `exportparts`**:

```css
/* ✅ This works — hx-card exposes its own part */
hx-card::part(card) {
  padding: 2rem;
}

/* ❌ This does NOT work — hx-button's part is hidden */
hx-card::part(button) {
  background: blue;
}
```

The `part="button"` inside `hx-button` is encapsulated within its own shadow root. The page cannot see it through `hx-card`.

### Solution: Forward Parts with `exportparts`

The `hx-card` component can forward the button's parts using `exportparts`:

```typescript
// hx-card.ts
override render() {
  return html`
    <div part="card" class="card">
      <div part="body" class="card__body">
        <slot></slot>
      </div>
      <div part="actions" class="card__actions">
        <hx-button exportparts="button">
          <slot name="action"></slot>
        </hx-button>
      </div>
    </div>
  `;
}
```

**Now the page can style it**:

```css
/* ✅ Button part is now accessible through hx-card */
hx-card::part(button) {
  background: blue;
  text-transform: uppercase;
}
```

### Renaming Parts During Forwarding

Rename parts while forwarding to avoid naming collisions or provide clearer semantics:

```html
<!-- Forward "button" as "action-button" -->
<hx-button exportparts="button: action-button"></hx-button>
```

**Consumer styling**:

```css
/* Target the renamed part */
hx-card::part(action-button) {
  background: green;
  padding: 1rem 2rem;
}
```

**Use case**: When a component contains multiple buttons, rename them to indicate their roles (`save-button`, `cancel-button`, `close-button`).

### Forwarding Multiple Parts

Forward multiple parts with commas:

```html
<hx-text-input exportparts="input, label, error, help-text"></hx-text-input>
```

With renaming:

```html
<hx-text-input
  exportparts="
    input: field-input,
    label: field-label,
    error: field-error,
    help-text: field-help
  "
></hx-text-input>
```

### Forwarding with Wildcards and Prefixes

Forward all parts from a child component with a prefix to prevent naming conflicts:

```html
<!-- Forward all parts from hx-text-input with "field-" prefix -->
<hx-text-input exportparts="*: field-*"></hx-text-input>
```

**Result**:

```css
/* Original part names in hx-text-input */
hx-text-input::part(input) {
}
hx-text-input::part(label) {
}
hx-text-input::part(error) {
}

/* After forwarding with prefix from hx-form */
hx-form::part(field-input) {
}
hx-form::part(field-label) {
}
hx-form::part(field-error) {
}
```

**Best practice**: Always use prefixed forwarding when composing components. This prevents part name collisions and maintains clear ownership.

**Note**: The wildcard syntax `exportparts="*: *"` is invalid and will not work. Always include a prefix when using wildcards.

## Design Patterns for Parts

### Pattern 1: Structural Parts (Layout Control)

Expose major layout containers to allow consumers to control component structure, spacing, and flow.

**Example: Card Component**

```typescript
// hx-card.ts (simplified)
override render() {
  return html`
    <div part="card" class="card">
      <div part="image" class="card__image" ?hidden=${!this._hasSlotContent.image}>
        <slot name="image"></slot>
      </div>
      <div part="heading" class="card__heading" ?hidden=${!this._hasSlotContent.heading}>
        <slot name="heading"></slot>
      </div>
      <div part="body" class="card__body">
        <slot></slot>
      </div>
      <div part="footer" class="card__footer" ?hidden=${!this._hasSlotContent.footer}>
        <slot name="footer"></slot>
      </div>
      <div part="actions" class="card__actions" ?hidden=${!this._hasSlotContent.actions}>
        <slot name="actions"></slot>
      </div>
    </div>
  `;
}
```

**Consumer use case**: Create horizontal card layouts using CSS Grid.

```css
/* Horizontal card layout */
.feature-cards hx-card::part(card) {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-areas:
    'image heading'
    'image body'
    'image actions';
  gap: 1.5rem;
}

.feature-cards hx-card::part(image) {
  grid-area: image;
}
.feature-cards hx-card::part(heading) {
  grid-area: heading;
}
.feature-cards hx-card::part(body) {
  grid-area: body;
}
.feature-cards hx-card::part(actions) {
  grid-area: actions;
}
```

### Pattern 2: Interactive Parts (State Styling)

Expose interactive elements (buttons, inputs, links) for state-specific styling (hover, focus, active, disabled).

**Example: Button Component**

```typescript
// hx-button.ts
override render() {
  return html`
    <button
      part="button"
      class="button"
      ?disabled=${this.disabled}
    >
      <slot></slot>
    </button>
  `;
}
```

**Consumer use case**: Apply custom focus indicators for WCAG 2.1 AAA compliance.

```css
/* Custom focus ring with increased contrast */
hx-button::part(button):focus {
  outline: 3px solid #ff6b00;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(255, 107, 0, 0.2);
}

/* Custom disabled state for healthcare context */
hx-button::part(button):disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #e5e7eb;
  color: #9ca3af;
}

/* Hover state for ghost buttons */
hx-button[variant='ghost']::part(button):hover {
  background: rgba(37, 99, 235, 0.1);
  border-color: var(--hx-color-primary-500);
}
```

### Pattern 3: Form Field Parts (Comprehensive Theming)

Expose all major elements of form components for full design system integration.

**Example: Text Input Component**

The `hx-text-input` component exposes six parts for complete theming control:

```typescript
// hx-text-input.ts (actual implementation)
override render() {
  return html`
    <div part="field" class="field">
      <label part="label" class="field__label" for=${this._inputId}>
        ${this.label}
      </label>
      <div part="input-wrapper" class="field__input-wrapper">
        <span class="field__prefix">
          <slot name="prefix"></slot>
        </span>
        <input
          part="input"
          class="field__input"
          id=${this._inputId}
          type=${this.type}
          .value=${live(this.value)}
        />
        <span class="field__suffix">
          <slot name="suffix"></slot>
        </span>
      </div>
      <div part="help-text" class="field__help-text">${this.helpText}</div>
      <div part="error" class="field__error">${this.error}</div>
    </div>
  `;
}
```

**Consumer use case**: Apply enterprise design system overrides.

```css
/* Label styling for healthcare brand */
hx-text-input::part(label) {
  font-family: var(--hx-font-family-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

/* Input styling with increased touch targets */
hx-text-input::part(input) {
  border: 2px solid #d1d5db;
  border-radius: 6px;
  padding: 0.875rem 1rem; /* Larger for accessibility */
  font-size: 1rem;
  min-height: 44px; /* WCAG 2.1 AA minimum touch target */
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

/* Focus state with visible outline */
hx-text-input::part(input):focus {
  border-color: var(--hx-color-primary-500);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: 2px solid transparent; /* Ensures Windows High Contrast Mode shows outline */
}

/* Error state styling */
hx-text-input[error]::part(input) {
  border-color: var(--hx-color-error-500);
  background: var(--hx-color-error-50);
}

hx-text-input::part(error) {
  color: var(--hx-color-error-700);
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
}
```

## Theming Strategy: Parts vs Custom Properties

CSS Shadow Parts and CSS custom properties (variables) both enable theming, but serve fundamentally different purposes.

### CSS Custom Properties (Values)

**Purpose**: Control **values**—colors, spacing, typography, timing, z-index.

**Scope**: Cascade through shadow DOM boundaries automatically (inherited properties).

**Use case**: Global theming, brand colors, spacing scales, typography systems.

**Example**:

```css
/* Global theme overrides at :root level */
:root {
  --hx-color-primary-500: #007878; /* Teal brand color */
  --hx-space-4: 1.5rem; /* Increased spacing scale */
  --hx-border-radius-md: 8px; /* Rounded corners */
  --hx-font-family-sans: 'Inter', sans-serif;
}
```

Components consume these tokens internally:

```css
/* Inside hx-button.styles.ts */
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500));
  padding: var(--hx-button-padding, var(--hx-space-4));
  border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md));
  font-family: var(--hx-button-font-family, var(--hx-font-family-sans));
}
```

### CSS Parts (Elements)

**Purpose**: Control **elements**—layout, structure, element-specific overrides.

**Scope**: Requires explicit exposure via `part` attribute; does not cascade.

**Use case**: Fine-grained overrides, per-instance customization, structural changes.

**Example**:

```css
/* Specific component instance overrides */
.hero hx-button::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1.5rem 3rem;
  min-width: 200px;
}

/* Layout modification */
.sidebar hx-card::part(card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar hx-card::part(body) {
  flex: 1; /* Body takes remaining space */
}
```

### Decision Matrix

| Scenario                             | Solution              | Rationale                                      |
| ------------------------------------ | --------------------- | ---------------------------------------------- |
| Global brand colors                  | CSS custom properties | Cascades automatically, affects all components |
| Spacing/typography scales            | CSS custom properties | Design system tokens should be global          |
| Component-level defaults             | CSS custom properties | Affects all instances of that component type   |
| Element-specific overrides           | CSS parts             | Targets specific internal elements             |
| Layout modifications                 | CSS parts             | Structural changes require element access      |
| State styling (hover, focus, active) | CSS parts             | Pseudo-classes need element target             |
| Per-instance customization           | CSS parts             | Instance-specific, not global                  |

### The Ideal Combination: Layered Theming

Use **both** in tandem for maximum flexibility and maintainability:

```css
/* Layer 1: Global theme via custom properties */
:root {
  --hx-color-primary-500: #007878;
  --hx-color-primary-600: #006060;
  --hx-space-4: 1rem;
  --hx-border-radius-md: 6px;
}

/* Layer 2: Component-level overrides via custom properties */
.admin-panel {
  --hx-button-bg: var(--hx-color-primary-600); /* Darker in admin */
  --hx-card-padding: var(--hx-space-6); /* More padding */
}

/* Layer 3: Instance-specific structural changes via parts */
.admin-panel hx-button.cta::part(button) {
  text-transform: uppercase; /* Structural change */
  letter-spacing: 0.1em;
  padding: 1.5rem 3rem;
  border-left: 4px solid var(--hx-color-primary-500); /* Use theme color */
}

.admin-panel hx-card.dashboard::part(card) {
  display: grid; /* Layout override */
  grid-template-columns: 1fr 2fr;
}
```

**Pattern**: Use custom properties for values that apply broadly. Use parts for structural or instance-specific changes.

## Browser Support

The CSS Shadow Parts API is supported in all modern browsers:

| Browser     | Version | Release Date |
| ----------- | ------- | ------------ |
| **Chrome**  | 73+     | March 2019   |
| **Edge**    | 79+     | January 2020 |
| **Safari**  | 13.1+   | March 2020   |
| **Firefox** | 72+     | January 2020 |

**Current coverage**: 96%+ of global browser usage (February 2026).

**No polyfill needed**: CSS Parts are natively supported. Unsupported browsers (e.g., IE11) simply ignore `::part()` rules—components still function, just without custom part styling.

**Testing note**: Always test in Firefox, as it has the strictest Shadow DOM implementation. If it works in Firefox, it works everywhere.

## Best Practices

### For Component Authors

1. **Expose parts intentionally**: Only expose elements consumers **should** style. Over-exposure creates maintenance burden and implicit dependencies.

2. **Use semantic naming**: `part="button"` is better than `part="wrapper-1"`. Part names are a contract—make them meaningful.

3. **Document parts in JSDoc**: Use `@csspart` comments for Custom Elements Manifest generation.

   ```typescript
   /**
    * @csspart button - The native button element.
    * @csspart icon - The icon container (if slotted).
    */
   ```

4. **Coordinate with CSS custom properties**: Parts handle structure; variables handle values. Provide both for flexibility.

5. **Use `exportparts` sparingly**: Only forward parts when composition requires it. Avoid blindly forwarding all parts from all children.

6. **Prefix when forwarding**: Use `exportparts="*: prefix-*"` to prevent naming collisions in nested components.

7. **Version carefully**: Removing a part is a breaking change. Adding a part is non-breaking. Document part stability in release notes.

### For Consumers

1. **Prefer CSS custom properties for global theming**: Override brand colors, spacing, and typography at the `:root` level for consistency.

2. **Use `::part()` for targeted overrides**: Style specific component instances or variants, not the entire design system.

3. **Avoid implementation assumptions**: Parts are a contract, but internal structure may change. Style the part itself, not presumed descendants.

4. **Combine with attribute selectors**: Use `hx-button[variant="primary"]::part(button)` to target specific component states.

5. **Test across component updates**: Since parts can be added or removed, test your overrides after library updates.

6. **Respect encapsulation**: If a part isn't exposed, there's likely a reason. Request new parts via issues rather than hacking around the shadow boundary.

## Summary

CSS Shadow Parts provide the precision and control needed for enterprise component theming. They bridge the gap between **encapsulation** (necessary for isolation) and **customization** (necessary for diverse use cases).

**Key takeaways**:

- Parts are **opt-in styling hooks**—only exposed elements are styleable
- Use `part` attribute in shadow DOM to expose elements
- Use `::part()` pseudo-element from outside to style them
- Use `exportparts` to forward parts through nested shadow roots
- Combine parts (for structure) with custom properties (for values) for layered theming
- Parts are a **contract**—document and version them carefully

For HELiX (hx-library), parts are essential for integrating components into diverse healthcare design systems. They enable the **foundation** (the library) to serve **infinite variations** (client implementations) without sacrificing encapsulation or maintainability.

## Next Steps

- [Shadow DOM Slots](/components/shadow-dom/slots) — Master content projection and composition
- [Shadow DOM Events](/components/shadow-dom/events) — Understand event retargeting and composed events
- [Advanced Slots](/components/shadow-dom/advanced-slots) — Conditional rendering, fallback content, slot observation
- [Component Styling Guide](/components/styling) — Design token integration and theming architecture

## Sources

- [::part() - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [CSS shadow parts - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Shadow_parts)
- [Styling in the Shadow DOM With CSS Shadow Parts | CSS-Tricks](https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/)
- [CSS Shadow Parts Module Level 1 (W3C Spec)](https://drafts.csswg.org/css-shadow-parts/)
- [Using shadow DOM - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
