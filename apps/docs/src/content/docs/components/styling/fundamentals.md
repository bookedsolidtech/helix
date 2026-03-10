---
title: Component Styling Fundamentals
description: Deep dive into Shadow DOM styling with :host selectors, :host() functions, style encapsulation, CSS custom properties, and the HELiX design token system.
sidebar:
  order: 1
---

Shadow DOM provides powerful style encapsulation for web components, creating a boundary where external styles cannot leak in and internal styles cannot leak out. This isolation is fundamental to building enterprise-grade component libraries where reliability and predictability are non-negotiable.

This guide covers the Shadow DOM styling mechanisms that power HELiX components: the `:host` selector, `:host()` function, `:host-context()` pattern, style boundaries, CSS custom properties, and the three-tier design token architecture.

---

## Prerequisites

Before diving into styling patterns, ensure you understand:

- [Shadow DOM Architecture](/components/shadow-dom/architecture) — Encapsulation, shadow boundaries, and DOM composition
- Basic CSS custom properties (`--property-name` syntax)
- CSS specificity and cascade rules

---

## The Style Encapsulation Model

Shadow DOM creates a **style boundary** that separates component implementation from consuming applications. This boundary has specific rules for how styles are scoped, inherited, and applied.

### Core Encapsulation Rules

**Rule 1: External selectors cannot reach inside shadow DOM**

```html
<style>
  /* Page styles */
  button {
    background: red;
    color: white;
  }
</style>

<button>Page Button</button>
<!-- Red background -->

<wc-button>
  #shadow-root
  <style>
    button {
      background: blue;
    }
  </style>
  <button>Component Button</button>
  <!-- Blue background -->
</wc-button>
```

The page-level `button { background: red; }` rule has **no effect** inside the shadow DOM. The shadow boundary blocks external selector matching.

**Rule 2: Internal styles cannot leak outside**

```html
<wc-card>
  #shadow-root
  <style>
    p {
      color: purple;
    }
  </style>
  <p>Inside shadow DOM</p>
  <slot></slot>
</wc-card>

<p>Outside shadow DOM</p>
<!-- NOT purple -->
```

The `p { color: purple; }` rule inside the shadow root only affects `<p>` elements in that shadow tree. Light DOM content (outside) is unaffected.

**Rule 3: Inheritable CSS properties cross the boundary**

While selector matching stops at the boundary, inheritable CSS properties pierce through:

```html
<style>
  body {
    font-family: Arial, sans-serif;
    color: #333;
    line-height: 1.5;
  }
</style>

<wc-card>
  #shadow-root
  <style>
    :host {
      display: block;
    }
  </style>
  <p>This text inherits font-family, color, and line-height from body</p>
</wc-card>
```

**Properties that inherit:**

- Typography: `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`
- Text: `color`, `text-align`, `text-indent`, `text-transform`
- List: `list-style`, `list-style-type`
- Visibility: `visibility`
- Other: `direction`, `cursor`, `letter-spacing`, `word-spacing`

**Properties that do NOT inherit:**

- Box model: `margin`, `padding`, `border`, `width`, `height`
- Background: `background`, `background-color`, `background-image`
- Position: `position`, `top`, `left`, `z-index`
- Display: `display`, `flex`, `grid`

This inheritance model allows components to **respect page typography** while maintaining **complete control over layout and structure**.

### Resetting Inheritance

If you need complete isolation from page styles, reset all inheritable properties:

```css
:host {
  all: initial; /* Reset everything to default */
  display: block; /* Then set what you need */
}
```

**Warning:** Use `all: initial` sparingly. Users **expect** components to inherit typography from their page. Resetting inheritance breaks this contract and creates a jarring visual disconnect.

---

## The `:host` Selector

The `:host` pseudo-class selector targets the **shadow host element itself**—the custom element tag that contains the shadow root.

### Basic Usage

```typescript
// Component definition
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('wc-button')
export class WcButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      contain: content; /* Performance optimization */
    }

    .button {
      padding: 0.5rem 1rem;
      background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
    }
  `;

  render() {
    return html`<button class="button"><slot></slot></button>`;
  }
}
```

```html
<!-- Usage -->
<wc-button>Click Me</wc-button>
```

The `:host` selector applies styles to the `<wc-button>` element itself, not to elements inside the shadow DOM.

### Why `:host` Matters

**1. Default display mode**

Custom elements default to `display: inline` (like `<span>`). Most components need `display: block` or `display: inline-block`:

```css
:host {
  display: block; /* Makes component a block-level element */
}
```

**2. Performance optimization**

Use CSS containment to optimize rendering:

```css
:host {
  display: block;
  contain: content; /* Tells browser component internals don't affect external layout */
}
```

**3. Component-level spacing**

Apply margins or positioning to the host:

```css
:host {
  display: block;
  margin-bottom: 1rem; /* Space between stacked components */
}
```

**4. Host-level theming**

Accept CSS custom properties at the host level:

```css
:host {
  --_bg: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  --_color: var(--wc-button-color, var(--wc-color-neutral-0, #ffffff));
}

.button {
  background: var(--_bg);
  color: var(--_color);
}
```

### `:host` Specificity

`:host` has **low specificity** (equivalent to a single class selector, `0,0,1,0`). External styles can easily override it:

```css
/* Inside shadow DOM */
:host {
  color: blue;
}

/* Page styles (higher specificity) */
wc-button {
  color: red; /* WINS — overrides :host */
}

wc-button.primary {
  color: green; /* ALSO WINS — two classes > one class */
}
```

**This is intentional.** Low specificity allows consumers to style the host element without needing `!important`. Component authors provide **default** host styles; consumers can override them naturally.

### HELiX `:host` Patterns

**Pattern 1: Display mode + containment**

```css
:host {
  display: inline-block;
  contain: content;
}
```

**Pattern 2: Disabled state**

```css
:host([disabled]) {
  pointer-events: none;
  opacity: var(--wc-opacity-disabled, 0.5);
}
```

**Pattern 3: Hidden state**

```css
:host([hidden]) {
  display: none !important; /* Override consumer display changes */
}
```

---

## The `:host()` Function

The `:host(selector)` pseudo-class function enables **conditional host styling** based on the host element's classes, attributes, or state.

### Syntax

```css
:host(selector) {
  /* Styles applied when host matches selector */
}
```

The `selector` argument matches **against the host element**, not against children.

### Attribute-Based Styling

Style the component based on attributes:

```typescript
// Component definition
static styles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.5;
  }

  :host([variant='primary']) .button {
    background: var(--wc-color-primary-500, #2563eb);
    color: white;
  }

  :host([variant='secondary']) .button {
    background: transparent;
    color: var(--wc-color-primary-500, #2563eb);
    border: 1px solid var(--wc-color-primary-500, #2563eb);
  }

  :host([variant='danger']) .button {
    background: var(--wc-color-error-500, #dc3545);
    color: white;
  }
`;
```

```html
<!-- Usage -->
<wc-button variant="primary">Save</wc-button>
<wc-button variant="secondary">Cancel</wc-button>
<wc-button variant="danger">Delete</wc-button>
<wc-button disabled>Disabled</wc-button>
```

### Class-Based Styling

Style based on host classes:

```css
:host(.large) {
  --_font-size: var(--wc-font-size-lg, 1.125rem);
  --_padding: var(--wc-space-3, 0.75rem) var(--wc-space-6, 1.5rem);
}

:host(.compact) {
  --_font-size: var(--wc-font-size-sm, 0.875rem);
  --_padding: var(--wc-space-1, 0.25rem) var(--wc-space-2, 0.5rem);
}
```

```html
<wc-button class="large">Large Button</wc-button>
<wc-button class="compact">Compact Button</wc-button>
```

### Pseudo-Class Styling

Style based on host pseudo-classes:

```css
:host(:hover) .button {
  filter: brightness(0.9);
}

:host(:focus-visible) {
  outline: 2px solid var(--wc-focus-ring-color, #2563eb);
  outline-offset: 2px;
}

:host(:active) .button {
  filter: brightness(0.8);
}
```

### Combining Selectors

Combine multiple conditions:

```css
:host([variant='primary']:not([disabled])) .button {
  cursor: pointer;
}

:host([variant='primary'][size='large']) .button {
  font-size: 1.25rem;
  padding: 1rem 2rem;
}
```

### HELiX `:host()` Patterns

**Pattern 1: Variant-driven token overrides**

```css
:host([variant='primary']) {
  --_bg: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  --_color: var(--wc-button-color, var(--wc-color-neutral-0, #ffffff));
}

:host([variant='secondary']) {
  --_bg: transparent;
  --_color: var(--wc-color-primary-500, #2563eb);
  --_border-color: var(--wc-color-primary-500, #2563eb);
}
```

**Pattern 2: Form validation states**

```css
:host([invalid]) .input-wrapper {
  border-color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
}

:host([invalid]) .error-message {
  display: block;
  color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
}
```

---

## The `:host-context()` Function

The `:host-context(selector)` pseudo-class function styles the host based on **ancestor elements outside the shadow DOM**.

### Syntax

```css
:host-context(selector) {
  /* Styles applied when any ancestor matches selector */
}
```

The `selector` argument matches **against ancestors** of the shadow host, traversing up the document tree outside the shadow boundary.

### Browser Support Warning

**Critical limitation:** `:host-context()` is **not supported in Firefox** (as of 2026). Safari and Chromium-based browsers support it.

**Best practice:** **Avoid `:host-context()` for critical theming.** Use CSS custom properties instead, which work universally.

### Use Cases (Where Supported)

**Theme-based styling:**

```css
:host-context(.theme-dark) {
  --_bg: var(--wc-color-neutral-800, #212529);
  --_color: var(--wc-color-neutral-0, #ffffff);
}

:host-context(.theme-light) {
  --_bg: var(--wc-color-neutral-0, #ffffff);
  --_color: var(--wc-color-neutral-800, #212529);
}
```

**Form context styling:**

```css
:host-context(form[data-readonly]) {
  pointer-events: none;
  opacity: 0.6;
}

:host-context(fieldset[disabled]) {
  opacity: 0.5;
}
```

### Why CSS Custom Properties Are Better

Instead of relying on `:host-context()`, use CSS custom properties for theming:

```css
/* Component stylesheet */
:host {
  background: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
  color: var(--wc-card-color, var(--wc-color-neutral-800, #212529));
}
```

```css
/* Consumer theme styles (works everywhere) */
.theme-dark {
  --wc-color-neutral-0: #212529; /* Swap light/dark */
  --wc-color-neutral-800: #ffffff;
}

.theme-light {
  --wc-color-neutral-0: #ffffff;
  --wc-color-neutral-800: #212529;
}
```

**Advantages:**

- Universal browser support (CSS custom properties work in all modern browsers)
- Better performance (property inheritance vs. selector matching)
- Explicit theming API (documented tokens vs. implicit context dependency)
- Testable (override tokens in tests vs. wrapping in context divs)

### HELiX Policy on `:host-context()`

**Policy:** HELiX components **do not use `:host-context()`** for theming or critical functionality. All theming is CSS custom property-based to ensure Firefox compatibility.

**Exception:** `:host-context()` may be used for **optional enhancements** in Chromium/Safari (e.g., experimental features, developer tools), but never for core component behavior.

---

## Style Encapsulation Boundaries

Understanding where styles apply and how they're blocked is critical for effective Shadow DOM styling.

### Query Selector Boundaries

Selectors defined inside shadow DOM **only match elements inside that shadow tree**. They cannot reach outside, and external selectors cannot reach in.

```html
<style>
  /* Page styles */
  .card {
    border: 2px solid red;
  }
</style>

<div class="card">Page Card</div>
<!-- Red border -->

<wc-card>
  #shadow-root
  <style>
    .card {
      border: 2px solid blue;
    }
  </style>
  <div class="card">Shadow Card</div>
  <!-- Blue border -->
</wc-card>
```

Neither selector affects the other's target. The shadow boundary creates **complete isolation**.

### Scoping Benefits

**Simpler selectors:**

```css
/* No need for BEM or complex specificity */
.button {
  /* Styles only this component's buttons */
}
.card {
  /* Styles only this component's cards */
}
.header {
  /* Styles only this component's header */
}
```

Component authors can use simple, semantic class names without worrying about page-level conflicts.

**Performance benefits:**

- CSS engines only match styles within the shadow scope
- Reduced selector evaluation overhead
- Isolated subtree updates don't trigger full-page recalculations

**Maintainability:**

```css
/* Change this component's .button without affecting any other component */
.button {
  padding: 1rem; /* Only affects THIS component */
}
```

### ID Isolation

Element IDs inside shadow DOM don't pollute the global document namespace:

```html
<wc-dialog>
  #shadow-root
  <div id="header">Header 1</div>
  <div id="content">Content 1</div>
</wc-dialog>

<wc-dialog>
  #shadow-root
  <div id="header">Header 2</div>
  <!-- No conflict! -->
  <div id="content">Content 2</div>
</wc-dialog>

<script>
  document.getElementById('header'); // null (IDs scoped to shadow trees)
</script>
```

This allows components to use simple, semantic IDs without worrying about conflicts between multiple instances or with page markup.

### Constructable Stylesheets

Lit uses **constructable stylesheets** (via `adoptedStyleSheets`) for optimal performance:

```typescript
export class WcButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    .button {
      padding: 0.5rem 1rem;
    }
  `;
}
```

**How it works:**

1. Lit compiles `css`` templates to `CSSStyleSheet` objects at module load time
2. All component instances **share the same stylesheet object** in memory
3. The browser reuses the parsed stylesheet across thousands of instances

**Benefits:**

- **Memory efficient**: Single stylesheet serves all instances
- **Fast initial render**: No per-instance style parsing
- **Dynamic updates**: Change stylesheet, all instances update instantly

---

## CSS Custom Properties in Shadow DOM

CSS custom properties (CSS variables) are the **only mechanism** that allows external styles to configure component internals. They inherit across the shadow boundary, creating a theming API.

### Inheritance Across Boundaries

```html
<style>
  :root {
    --wc-color-primary-500: #007878;
    --wc-font-family-sans: 'Inter', sans-serif;
  }
</style>

<wc-button>
  #shadow-root
  <style>
    .button {
      background: var(--wc-color-primary-500, #2563eb); /* Inherits #007878 */
      font-family: var(--wc-font-family-sans, sans-serif); /* Inherits 'Inter' */
    }
  </style>
  <button class="button">Click</button>
</wc-button>
```

Even though the shadow boundary blocks selector matching, CSS custom properties **inherit naturally** from parent to child, crossing shadow boundaries.

### The Fallback Pattern

HELiX uses a **two-level fallback chain** for every CSS custom property:

```css
property: var(--wc-component-token, var(--wc-semantic-token, primitive-value));
```

**Example:**

```css
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
}
```

**Resolution order:**

1. `--wc-button-bg` (component-level override)
2. `--wc-color-primary-500` (semantic token for global theming)
3. `#2563eb` (primitive fallback, factory default)

**Why two levels?**

- **One level** (`var(--wc-button-bg, #2563eb)`) forces consumers to set per-component tokens for every component, duplicating work
- **Two levels** allow global theming (override `--wc-color-primary-500` once) and per-component precision (override `--wc-button-bg` for surgical changes)
- **Three+ levels** create debugging complexity and performance overhead

### Private vs. Public Tokens

**Public tokens** (API surface):

```css
/* Exposed to consumers, documented in JSDoc/CEM */
--wc-button-bg
--wc-button-color
--wc-button-border-radius
```

**Private tokens** (internal implementation):

```css
/* Prefixed with --_, not documented, can change without breaking changes */
--_button-shadow-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
--_button-focus-offset: 2px;
```

**Pattern in component styles:**

```css
:host {
  /* Private tokens computed from public tokens */
  --_bg: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  --_color: var(--wc-button-color, var(--wc-color-neutral-0, #ffffff));
}

.button {
  background: var(--_bg);
  color: var(--_color);
}
```

### Token Documentation

Every public token is documented via JSDoc:

```typescript
/**
 * @cssprop [--wc-button-bg=var(--wc-color-primary-500)] - Button background color.
 * @cssprop [--wc-button-color=var(--wc-color-neutral-0)] - Button text color.
 * @cssprop [--wc-button-border-color=transparent] - Button border color.
 * @cssprop [--wc-button-border-radius=var(--wc-border-radius-md)] - Button corner radius.
 * @cssprop [--wc-button-font-family=var(--wc-font-family-sans)] - Button font family.
 * @cssprop [--wc-button-font-weight=var(--wc-font-weight-semibold)] - Button font weight.
 * @cssprop [--wc-button-focus-ring-color=var(--wc-focus-ring-color)] - Focus ring color.
 *
 * @csspart button - The native button element.
 */
@customElement('wc-button')
export class WcButton extends LitElement {
  // ...
}
```

This JSDoc is processed by Custom Elements Manifest (CEM) to generate machine-readable API documentation for Storybook, IDEs, and doc sites.

---

## HELiX Design Token System

HELiX uses a **three-tier token architecture** that separates primitive values, semantic meaning, and component-specific overrides.

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Tier 1: PRIMITIVE TOKENS (private, hardcoded fallbacks)│
│ #2563eb, 1rem, 600, 150ms                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Tier 2: SEMANTIC TOKENS (public API, global theming)   │
│ --wc-color-primary-500, --wc-space-4, --wc-font-weight │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Tier 3: COMPONENT TOKENS (optional, surgical overrides)│
│ --wc-button-bg, --wc-card-padding, --wc-input-border   │
└─────────────────────────────────────────────────────────┘
```

### Token Naming Convention

All tokens follow a strict pattern:

```
--wc-{category}-{property}-{variant?}
```

**Examples:**

```css
--wc-color-primary-500           /* Color category, primary palette, 500 shade */
--wc-space-4                     /* Spacing category, scale position 4 */
--wc-font-size-md                /* Font category, medium size */
--wc-button-bg                   /* Component category, background property */
--wc-border-radius-lg            /* Border category, large radius */
```

### Core Token Categories

**Colors:**

```css
/* Primary palette (blue) */
--wc-color-primary-50: #eff6ff;
--wc-color-primary-500: #2563eb; /* Base primary */
--wc-color-primary-700: #1e40af;

/* Neutral palette (grayscale) */
--wc-color-neutral-0: #ffffff;
--wc-color-neutral-100: #f1f5f9;
--wc-color-neutral-200: #dee2e6;
--wc-color-neutral-800: #212529;

/* Semantic colors */
--wc-color-success-500: #10b981;
--wc-color-error-500: #ef4444;
--wc-color-warning-500: #f59e0b;
--wc-color-info-500: #3b82f6;
```

**Spacing:**

```css
--wc-space-1: 0.25rem; /* 4px */
--wc-space-2: 0.5rem; /* 8px */
--wc-space-3: 0.75rem; /* 12px */
--wc-space-4: 1rem; /* 16px */
--wc-space-6: 1.5rem; /* 24px */
--wc-space-8: 2rem; /* 32px */
```

**Typography:**

```css
--wc-font-family-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
--wc-font-size-sm: 0.875rem; /* 14px */
--wc-font-size-md: 1rem; /* 16px */
--wc-font-size-lg: 1.125rem; /* 18px */
--wc-font-weight-normal: 400;
--wc-font-weight-semibold: 600;
--wc-line-height-tight: 1.25;
--wc-line-height-normal: 1.5;
```

**Borders:**

```css
--wc-border-width-thin: 1px;
--wc-border-width-medium: 2px;
--wc-border-radius-sm: 0.25rem; /* 4px */
--wc-border-radius-md: 0.375rem; /* 6px */
--wc-border-radius-lg: 0.5rem; /* 8px */
```

**Shadows:**

```css
--wc-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--wc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--wc-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

**Transitions:**

```css
--wc-transition-fast: 150ms ease;
--wc-transition-normal: 250ms ease;
--wc-transition-slow: 350ms ease;
```

**Focus indicators:**

```css
--wc-focus-ring-width: 2px;
--wc-focus-ring-offset: 2px;
--wc-focus-ring-color: #2563eb;
--wc-focus-ring-opacity: 0.25;
```

### Component Token Examples

**wc-button:**

```css
--wc-button-bg: var(--wc-color-primary-500, #2563eb);
--wc-button-color: var(--wc-color-neutral-0, #ffffff);
--wc-button-border-color: transparent;
--wc-button-border-radius: var(--wc-border-radius-md, 0.375rem);
--wc-button-font-family: var(--wc-font-family-sans, sans-serif);
--wc-button-font-weight: var(--wc-font-weight-semibold, 600);
--wc-button-focus-ring-color: var(--wc-focus-ring-color, #2563eb);
```

**wc-card:**

```css
--wc-card-bg: var(--wc-color-neutral-0, #ffffff);
--wc-card-color: var(--wc-color-neutral-800, #212529);
--wc-card-border-color: var(--wc-color-neutral-200, #dee2e6);
--wc-card-border-radius: var(--wc-border-radius-lg, 0.5rem);
--wc-card-padding: var(--wc-space-6, 1.5rem);
```

### Theming Example

**Global brand theming:**

```css
/* Consumer's theme file */
:root {
  /* Override primary color (teal instead of blue) */
  --wc-color-primary-50: #e6f7f7;
  --wc-color-primary-500: #007878;
  --wc-color-primary-700: #005555;

  /* Custom font stack */
  --wc-font-family-sans: 'Inter', 'Helvetica Neue', sans-serif;

  /* Tighter spacing */
  --wc-space-4: 0.875rem;
  --wc-space-6: 1.25rem;
}
```

**Result:** All HELiX components automatically adopt the new theme without code changes. Every component that uses `--wc-color-primary-500` now renders in teal. Every component using `--wc-font-family-sans` uses Inter.

**Component-specific override:**

```css
/* Surgical styling for hero CTA button */
wc-button.hero-cta {
  --wc-button-bg: linear-gradient(135deg, #ff6b35, #f7931e);
  --wc-button-font-size: 1.25rem;
  --wc-button-border-radius: 2rem; /* Pill shape */
}
```

---

## Best Practices

### 1. Always Use `:host` for Display Mode

```css
/* DO THIS */
:host {
  display: block;
  contain: content;
}

/* NOT THIS */
.wrapper {
  display: block; /* Host is still inline */
}
```

### 2. Never Hardcode Values

```css
/* BAD */
.button {
  background: #2563eb;
  padding: 0.5rem 1rem;
  font-weight: 600;
}

/* GOOD */
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  padding: var(--wc-space-2, 0.5rem) var(--wc-space-4, 1rem);
  font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));
}
```

### 3. Two-Level Fallback Chains

```css
/* BAD (missing semantic fallback) */
.card {
  background: var(--wc-card-bg, #ffffff);
}

/* GOOD */
.card {
  background: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
}
```

### 4. Use `:host()` for Variants

```css
/* GOOD — declarative, testable */
:host([variant='primary']) .button {
  /* ... */
}
:host([variant='secondary']) .button {
  /* ... */
}

/* AVOID — imperative, requires JS class toggling */
.button--primary {
  /* ... */
}
.button--secondary {
  /* ... */
}
```

### 5. Document All Public Tokens

```typescript
/**
 * @cssprop [--wc-button-bg=var(--wc-color-primary-500)] - Button background color.
 * @cssprop [--wc-button-color=var(--wc-color-neutral-0)] - Button text color.
 */
@customElement('wc-button')
export class WcButton extends LitElement {
  /* ... */
}
```

### 6. Avoid `!important` with Tokens

```css
/* BAD — prevents consumer customization */
:host {
  background: var(--wc-card-bg, #ffffff) !important;
}

/* GOOD — allows override cascade */
:host {
  background: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
}
```

### 7. Maintain Color Contrast

All token combinations must meet WCAG 2.1 AA contrast requirements:

- **4.5:1** for normal text
- **3:1** for large text (18pt+ or 14pt+ bold)
- **3:1** for UI components

```css
/* VERIFY: Does this meet 4.5:1? */
.button {
  background: var(--wc-color-primary-500, #2563eb);
  color: var(--wc-color-neutral-0, #ffffff);
}
/* Answer: Yes — #2563eb on #ffffff = 7.2:1 ratio */
```

---

## Summary

Shadow DOM styling provides the foundation for enterprise-grade component libraries through:

- **`:host` selector** — Style the shadow host element with low specificity for consumer overrides
- **`:host()` function** — Conditionally style based on host attributes, classes, or states
- **`:host-context()` function** — Style based on ancestors (limited browser support, avoid for critical features)
- **Style encapsulation** — Complete isolation of selectors, IDs, and internal styles
- **CSS custom properties** — The only mechanism for external styling, creating a theming API
- **Three-tier tokens** — Primitive → Semantic → Component cascade for flexible, maintainable theming

For HELiX, these patterns are non-negotiable. Every component uses `:host` for display mode, `:host()` for variants, two-level token fallbacks, and complete JSDoc documentation for all CSS custom properties.

**Key takeaways:**

1. `:host` has low specificity by design — consumers can override
2. Use `:host()` for attribute/class-based variants
3. Avoid `:host-context()` for critical theming (Firefox incompatibility)
4. CSS custom properties are the theming API — document every token
5. Two-level fallback chains enable component-level and global theming
6. Never hardcode values — always use design tokens
7. Maintain WCAG 2.1 AA contrast ratios for all color token combinations

---

## Next Steps

- [Design Token Architecture](/components/styling/tokens) — Complete token inventory and theming patterns
- [CSS Parts Guide](/components/shadow-dom/parts) — Expose controlled styling hooks for consumers
- [Slots Guide](/components/shadow-dom/slots) — Compose light DOM into shadow DOM templates
- [Component Fundamentals](/components/fundamentals/overview) — Core concepts and lifecycle

---

## Sources

- [Lit: Styles](https://lit.dev/docs/components/styles/) — Official Lit styling documentation
- [MDN: :host](https://developer.mozilla.org/en-US/docs/Web/CSS/:host) — `:host` selector reference
- [MDN: :host()](https://developer.mozilla.org/en-US/docs/Web/CSS/:host_function) — `:host()` function reference
- [MDN: :host-context()](https://developer.mozilla.org/en-US/docs/Web/CSS/:host-context) — `:host-context()` reference
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — CSS variables guide
- [web.dev: Shadow DOM v1](https://web.dev/articles/shadowdom-v1) — Shadow DOM styling patterns
