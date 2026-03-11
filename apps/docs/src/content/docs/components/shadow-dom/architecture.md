---
title: Shadow DOM Architecture
description: Deep dive into Shadow DOM encapsulation, style scoping, event retargeting, and the fundamental architecture that powers modern web components.
sidebar:
  order: 1
---

Shadow DOM is the foundational technology that enables true component encapsulation in web development. It provides isolated DOM trees, scoped styles, and controlled composition boundaries that make enterprise-grade component systems possible. This guide explores the architecture, mechanisms, and patterns that make Shadow DOM essential for healthcare applications where reliability and isolation are non-negotiable.

## What is Shadow DOM?

Shadow DOM is a Web API that attaches a hidden, encapsulated DOM tree to an element. This shadow tree renders separately from the main document DOM, creating a **shadow boundary** that prevents external JavaScript and CSS from accidentally breaking component internals.

### The Problem Shadow DOM Solves

Before Shadow DOM, building reusable components faced fundamental challenges:

1. **CSS Namespace Pollution**: Global styles could break component appearance
2. **DOM Manipulation Conflicts**: Page scripts could modify component internals
3. **Selector Collisions**: Component IDs and classes could clash with page markup
4. **Style Specificity Wars**: Components needed increasingly specific selectors to override page styles

Shadow DOM eliminates these issues through **encapsulation**—a clean separation between component implementation and consuming application.

### Browser Native Example

You've been using Shadow DOM since HTML5. Native elements like `<video>`, `<audio>`, `<input type="range">`, and `<select>` hide their complex UI implementations behind Shadow DOM:

```html
<input type="range" min="0" max="100" value="50" />
<!-- Browser creates hidden shadow DOM internally:
  #shadow-root
    ├─ <div class="track">
    ├─ <div class="thumb">
    └─ <div class="fill">
-->
```

You see a single `<input>` element, but the browser renders an entire UI hierarchy in shadow DOM. This is the same encapsulation we leverage for custom components.

## Core Architecture

### Terminology

Understanding Shadow DOM requires precise terminology:

| Term                | Definition                                             |
| ------------------- | ------------------------------------------------------ |
| **Shadow Host**     | The regular DOM element that hosts a shadow root       |
| **Shadow Root**     | The root node of the shadow tree (document fragment)   |
| **Shadow Tree**     | The complete DOM tree inside the shadow root           |
| **Shadow Boundary** | The encapsulation barrier between shadow and light DOM |
| **Light DOM**       | The regular DOM (children of the shadow host)          |
| **Flattened DOM**   | The final rendered tree after slot composition         |

### Visual Structure

```
┌─ Document ─────────────────────────────────────────┐
│                                                     │
│  <wc-button id="my-btn" variant="primary">         │  ← Shadow Host
│    Click Me                                        │  ← Light DOM (child)
│  </wc-button>                                      │
│                                                     │
│  ┌─ #shadow-root (attached to wc-button) ────┐    │
│  │                                             │    │
│  │  <style>                                    │    │  ← Shadow Tree
│  │    button { background: var(--wc-primary) }│    │
│  │  </style>                                   │    │
│  │                                             │    │
│  │  <button part="button">                    │    │
│  │    <slot></slot>  ← Projects "Click Me"    │    │
│  │  </button>                                  │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
       ↑
   Shadow Boundary
   (encapsulation barrier)
```

### The Three DOM Trees

Every shadow host manages three conceptual DOM trees:

1. **Light DOM**: The actual children of the host element (visible in inspector)
2. **Shadow DOM**: The hidden implementation inside the shadow root
3. **Flattened DOM**: The final rendered output after slot distribution

```javascript
// HTML
<wc-card>
  <h2 slot="title">Patient Overview</h2>
  <p>Content goes here</p>
</wc-card>

// Light DOM (what developer writes)
wc-card
  ├─ h2[slot="title"]: "Patient Overview"
  └─ p: "Content goes here"

// Shadow DOM (hidden implementation)
#shadow-root
  ├─ header
  │   └─ slot[name="title"]
  └─ div.content
      └─ slot

// Flattened DOM (what browser renders)
wc-card
  └─ #shadow-root
      ├─ header
      │   └─ slot[name="title"]
      │       └─ h2: "Patient Overview" (projected)
      └─ div.content
          └─ slot
              └─ p: "Content goes here" (projected)
```

## Creating Shadow DOM

### Mode: Open vs Closed

Shadow roots have two modes that control JavaScript accessibility:

#### Open Mode (Recommended)

```javascript
const host = document.querySelector('#my-element');
const shadow = host.attachShadow({ mode: 'open' });

// Later, page code can access shadow root
console.log(host.shadowRoot); // Returns ShadowRoot instance
const internals = host.shadowRoot.querySelectorAll('button');
```

**Characteristics**:

- `element.shadowRoot` returns the shadow root
- External code can query and modify shadow DOM
- Provides debugging and testing access
- Default choice for most components

**Use when**: Building libraries, design systems, or any public components where developers may need to inspect or test internals.

#### Closed Mode (Rarely Used)

```javascript
const shadow = host.attachShadow({ mode: 'closed' });

console.log(host.shadowRoot); // null
// Shadow root is inaccessible from outside
```

**Characteristics**:

- `element.shadowRoot` returns `null`
- External code cannot access shadow internals
- Stronger encapsulation boundary
- Browser DevTools can still inspect

**Important**: Closed mode is **not a security mechanism**. Browser extensions and DevTools can bypass it. It signals "don't access my internals" but doesn't enforce security.

**Use when**: Rarely. Consider open mode with clear documentation instead. Closed mode prevents component authors from accessing their own shadow DOM in some scenarios.

### HELiX Convention

All HELiX components use **open mode** for testability, accessibility tooling compatibility, and developer experience:

```typescript
export class WcButton extends LitElement {
  constructor() {
    super();
    // Lit creates open shadow root automatically
  }
}
```

### Creation Timing

Create shadow roots as early as possible, ideally in the constructor:

```typescript
class WcCard extends HTMLElement {
  constructor() {
    super();

    // Create shadow root before any setup
    this.attachShadow({ mode: 'open' });

    // Now safe to append shadow content
    this.shadowRoot.innerHTML = `
      <style>:host { display: block; }</style>
      <slot></slot>
    `;
  }
}
```

**Why constructor?** You have exclusive control over implementation before the element is attached to the DOM. Waiting until `connectedCallback()` creates race conditions with attribute initialization.

### Additional Options

`attachShadow()` accepts additional configuration:

```typescript
element.attachShadow({
  mode: 'open',
  delegatesFocus: true, // Focus management (see below)
  slotAssignment: 'manual', // Manual slot distribution
});
```

**`delegatesFocus: true`**:

- Clicking a non-focusable area inside shadow DOM focuses the first focusable element
- Improves keyboard navigation for complex widgets
- Useful for composite form controls

**`slotAssignment: 'manual'`**:

- Requires manual slot assignment via `HTMLSlotElement.assign()`
- Advanced pattern for dynamic slot routing
- Rarely needed; default `'named'` works for most cases

## DOM Encapsulation

### Query Selector Boundaries

The shadow boundary blocks `document.querySelector()` and friends:

```javascript
// HTML
<wc-button>
  <span class="label">Click Me</span>
</wc-button>;

// Component shadow DOM contains:
// #shadow-root
//   <button>
//     <slot></slot>
//   </button>

// From page scope
document.querySelectorAll('button'); // [] (empty)
document.querySelectorAll('.label'); // [span.label] (light DOM only)

// Must query shadow root explicitly
const wcButton = document.querySelector('wc-button');
wcButton.shadowRoot.querySelectorAll('button'); // [button]
```

**Key principle**: Shadow DOM creates a **query barrier**. Global queries cannot penetrate shadow boundaries. This prevents page scripts from accidentally breaking component internals.

### ID Isolation

Element IDs inside shadow DOM don't pollute the global document namespace:

```html
<!-- Multiple components with same internal IDs -->
<wc-dialog>
  #shadow-root
  <div id="header">...</div>
  <div id="content">...</div>
</wc-dialog>

<wc-dialog>
  #shadow-root
  <div id="header">...</div>
  ← No conflict!
  <div id="content">...</div>
</wc-dialog>

<script>
  // This finds nothing—IDs are scoped to shadow trees
  document.getElementById('header'); // null
</script>
```

This allows components to use simple, semantic IDs without worrying about page-level conflicts.

### Event Retargeting

Events **do cross** the shadow boundary, but the `event.target` is **retargeted** to maintain encapsulation:

```javascript
// Component implementation
class WcButton extends LitElement {
  render() {
    return html`
      <button @click=${this._handleClick}>
        <slot></slot>
      </button>
    `;
  }

  _handleClick(e) {
    console.log(e.target); // <button> (internal element)
    console.log(e.currentTarget); // <button>
  }
}

// Page code
document.querySelector('wc-button').addEventListener('click', (e) => {
  console.log(e.target); // <wc-button> (shadow host, not <button>)
  console.log(e.composedPath()[0]); // <button> (original target)
});
```

**Why retargeting?** It prevents external code from depending on internal implementation details. If the component refactors its shadow DOM, external event listeners remain unaffected.

### Composed Events

Events must explicitly opt into crossing shadow boundaries:

```typescript
// Event that ESCAPES shadow DOM
this.dispatchEvent(
  new CustomEvent('wc-change', {
    bubbles: true,
    composed: true, // ← Crosses shadow boundaries
    detail: { value: this.value },
  }),
);

// Event that STAYS INSIDE shadow DOM
this.dispatchEvent(
  new CustomEvent('internal-update', {
    bubbles: true,
    composed: false, // ← Stops at shadow boundary
  }),
);
```

**HELiX convention**: All public component events use `composed: true` to ensure consumers can listen at any level. Internal implementation events use `composed: false`.

### Events That Automatically Compose

Most native events are `composed: true` by default:

- **Focus events**: `focus`, `blur`, `focusin`, `focusout`
- **Mouse events**: `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`
- **Touch events**: `touchstart`, `touchend`, `touchmove`
- **Keyboard events**: `keydown`, `keyup`, `keypress`
- **Input events**: `input`, `change`, `submit`

Events that do **NOT** compose (stay inside shadow DOM):

- `mouseenter`, `mouseleave` (use `mouseover`/`mouseout` instead)
- `load`, `unload`
- `abort`, `error`
- `select`

## Style Encapsulation

### The Style Boundary

CSS defined inside shadow DOM **only affects** that shadow tree. CSS defined outside **cannot reach inside**:

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

The page `button { background: red; }` rule has **no effect** inside the shadow DOM.

### CSS Inheritance

While selector matching stops at the shadow boundary, **inheritable CSS properties** pierce through:

**Properties that inherit**:

- `color`
- `font-family`, `font-size`, `font-weight`
- `line-height`
- `text-align`
- `direction`, `lang`

```html
<style>
  body {
    font-family: Arial, sans-serif;
    color: #333;
  }
</style>

<wc-card>
  #shadow-root
  <style>
    /* Inherits font-family and color from body */
    :host {
      display: block;
    }
  </style>
  <p>This text is Arial, #333 color</p>
</wc-card>
```

**Resetting inheritance**:

```css
:host {
  all: initial; /* Reset all inheritable properties */
  display: block; /* Then set what you need */
}
```

Use this sparingly—users expect components to inherit text styling.

### Applying Styles Inside Shadow DOM

Three primary methods:

#### 1. Constructable Stylesheets (Lit Default)

```typescript
import { LitElement, css } from 'lit';

export class WcButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      background: var(--wc-button-bg, var(--wc-color-primary));
    }
  `;
}
```

**Advantages**:

- Share single stylesheet across multiple instances
- Best performance for component libraries
- Dynamic updates via `adoptedStyleSheets`

**How it works**: Lit compiles `css`` templates to `CSSStyleSheet`objects and assigns them to`shadowRoot.adoptedStyleSheets`.

#### 2. Style Elements (Template-Based)

```javascript
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    button { padding: 8px 16px; }
  </style>
  <button><slot></slot></button>
`;

class WcButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}
```

**Advantages**:

- Simple for small components
- Self-contained templates
- No build step required

**Disadvantages**:

- Each instance clones styles (memory overhead)
- No stylesheet sharing

#### 3. Linked Stylesheets (Legacy)

```javascript
const linkElem = document.createElement('link');
linkElem.setAttribute('rel', 'stylesheet');
linkElem.setAttribute('href', 'styles.css');
shadowRoot.appendChild(linkElem);
```

**Avoid this pattern**. Constructable stylesheets are superior in every way.

### Special Shadow DOM Selectors

#### `:host` — Style the Shadow Host

```css
:host {
  display: block;
  contain: content; /* Performance optimization */
}
```

The `:host` selector targets the shadow host element itself (the `<wc-button>` tag).

**Important**: `:host` has **low specificity**. External styles can override:

```css
/* Inside shadow DOM */
:host {
  color: blue;
}

/* Page styles (higher specificity) */
wc-button {
  color: red;
} /* Wins! */
```

#### `:host()` — Conditional Host Styling

```css
:host(.primary) {
  --_bg: var(--wc-color-primary);
}

:host(.secondary) {
  --_bg: var(--wc-color-secondary);
}

:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
}
```

Style the host based on classes or attributes.

#### `:host-context()` — Parent-Based Styling

```css
:host-context(.dark-theme) {
  --_text-color: white;
}

:host-context(form[data-readonly]) {
  pointer-events: none;
}
```

Style based on ancestors outside the shadow DOM.

**Browser support**: Not supported in Firefox. Use CSS custom properties for theming instead.

#### `::slotted()` — Style Slotted Content

```css
::slotted(*) {
  margin: 0;
}

::slotted(p) {
  line-height: 1.6;
}

::slotted(.highlight) {
  background: yellow;
}
```

**Limitations**:

- Only selects **top-level** slotted nodes, not descendants
- `::slotted(p span)` does **not work**
- `::slotted(p)` works

**Why?** The selector boundary must remain at the shadow root. Reaching deep into light DOM would break encapsulation.

### Design Token Strategy

HELiX uses a **three-tier cascade** for theming:

```css
/* Tier 1: Primitive tokens (defined globally) */
:root {
  --wc-blue-500: #3b82f6;
  --wc-spacing-md: 1rem;
}

/* Tier 2: Semantic tokens (defined globally) */
:root {
  --wc-color-primary: var(--wc-blue-500);
  --wc-button-padding: var(--wc-spacing-md);
}

/* Tier 3: Component-local tokens (inside shadow DOM) */
:host {
  --_bg: var(--wc-button-bg, var(--wc-color-primary));
  --_padding: var(--wc-button-padding, 0.5rem 1rem);
}

button {
  background: var(--_bg);
  padding: var(--_padding);
}
```

**Pattern**: Internal variables prefixed with `--_` are private. Public `--wc-*` variables are the theming API.

## Slots: Light DOM Composition

Slots are the mechanism for projecting light DOM into shadow DOM. They create **insertion points** where user content renders.

### Basic Slot Usage

```typescript
// Component definition
class WcCard extends LitElement {
  render() {
    return html`
      <div class="card">
        <slot></slot>  <!-- Default slot -->
      </div>
    `;
  }
}

// Usage
<wc-card>
  <p>This content projects into the slot.</p>
</wc-card>

// Rendered result (flattened DOM)
<wc-card>
  #shadow-root
    <div class="card">
      <slot>
        <p>This content projects into the slot.</p>
      </slot>
    </div>
</wc-card>
```

### Named Slots

```typescript
render() {
  return html`
    <header><slot name="title"></slot></header>
    <div class="content"><slot></slot></div>
    <footer><slot name="actions"></slot></footer>
  `;
}
```

```html
<wc-card>
  <h2 slot="title">Patient Record</h2>
  <p>Patient details go here.</p>
  <button slot="actions">Save</button>
  <button slot="actions">Cancel</button>
</wc-card>
```

**Key points**:

- Multiple elements can target the same named slot
- Elements without `slot` attribute project to the default (unnamed) slot
- Unmatched slots render fallback content

For full slot patterns, see the [Slots guide](/components/shadow-dom/slots).

## CSS Parts: Controlled Styling Hooks

CSS Parts allow component authors to expose specific shadow DOM elements for external styling:

```typescript
// Component definition
render() {
  return html`
    <button part="button">
      <slot></slot>
    </button>
  `;
}
```

```css
/* External styles */
wc-button::part(button) {
  border-radius: 0;
  text-transform: uppercase;
}
```

**Why parts?** They provide **controlled** styling access. Authors choose which elements are styleable, preventing consumers from depending on internal implementation details.

For full parts documentation, see the [CSS Parts guide](/components/shadow-dom/parts).

## Accessibility Considerations

Shadow DOM must preserve accessibility:

### ARIA and Semantic HTML

ARIA attributes work across shadow boundaries:

```html
<wc-button aria-label="Close dialog">
  <svg>...</svg>
</wc-button>
```

```typescript
render() {
  return html`
    <button
      aria-label=${this.getAttribute('aria-label') || nothing}
      aria-pressed=${this.pressed ? 'true' : 'false'}
    >
      <slot></slot>
    </button>
  `;
}
```

**Pattern**: Forward relevant ARIA attributes from the host to internal interactive elements.

### Focus Delegation

```typescript
this.attachShadow({
  mode: 'open',
  delegatesFocus: true,
});
```

**Behavior**:

- Clicking the shadow host focuses the first focusable element inside
- Improves keyboard navigation for complex widgets
- Use for composite controls (search input + button, etc.)

### Keyboard Navigation

Ensure shadow DOM doesn't create keyboard traps:

```typescript
render() {
  return html`
    <div role="dialog" aria-modal="true">
      <button @click=${this._close}>Close</button>
      <div><slot></slot></div>
      <button>OK</button>
    </div>
  `;
}
```

Implement focus trapping for modals, manage tab order for complex widgets.

### Screen Reader Testing

- Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)
- Verify semantic HTML traversal
- Ensure custom events announce state changes

Shadow DOM does **not** break screen readers when used correctly. Semantic HTML and ARIA work the same as in light DOM.

## Performance Characteristics

### Benefits

**Style Scoping Performance**:

- Simpler selectors (no need for BEM or complex specificity)
- CSS engine only matches styles within shadow scope
- Reduced style recalculation on page changes

**Encapsulation Reduces Overhead**:

- Fewer global selectors to evaluate
- Isolated subtree updates don't trigger full page reflows

**Shared Stylesheets**:

```javascript
const sharedStyles = new CSSStyleSheet();
sharedStyles.replaceSync('button { padding: 8px; }');

// Reused across all instances
shadow1.adoptedStyleSheets = [sharedStyles];
shadow2.adoptedStyleSheets = [sharedStyles];
```

Memory efficient—single stylesheet serves thousands of components.

### CSS Containment

```css
:host {
  contain: content; /* layout + paint containment */
}
```

Tells the browser the component's internal layout won't affect external layout, enabling optimizations.

### Costs

**Memory Overhead**:

- Each shadow root has some memory cost
- Deep shadow trees (shadow inside shadow) multiply overhead
- Non-issue for typical component counts (<1000)

**Initial Attachment**:

- `attachShadow()` has minor upfront cost
- Negligible for normal usage patterns

**DevTools Overhead**:

- Shadow DOM trees appear collapsed in inspector
- Slightly more clicks to inspect internals

## Browser Support

Shadow DOM v1 is supported in all modern browsers:

- Chrome 53+ (2016)
- Firefox 63+ (2018)
- Safari 10+ (2016)
- Edge 79+ (Chromium-based, 2020)

### Feature Detection

```javascript
if ('attachShadow' in Element.prototype) {
  // Shadow DOM supported
  element.attachShadow({ mode: 'open' });
} else {
  // Fallback (not needed in 2026)
  console.warn('Shadow DOM not supported');
}
```

### Polyfills (Legacy)

For older browsers (IE11, pre-Chromium Edge), polyfills exist:

- **ShadyDOM**: Emulates shadow DOM scoping
- **ShadyCSS**: Emulates style scoping

**Note**: HELiX does **not** support IE11. All target browsers have native Shadow DOM.

## When NOT to Use Shadow DOM

Shadow DOM is not appropriate for:

### 1. Content-Heavy Documents

Shadow DOM adds overhead for text-heavy content. Use semantic HTML directly:

```html
<!-- Don't wrap every paragraph in shadow DOM -->
<wc-paragraph>Lorem ipsum...</wc-paragraph> ❌

<!-- Use native elements -->
<p class="article-text">Lorem ipsum...</p>
✅
```

### 2. SEO-Critical Content

Search engine crawlers may not index shadow DOM content reliably. For blog posts, articles, and marketing content:

```html
<!-- Avoid -->
<wc-blog-post>
  #shadow-root
  <article>SEO content here</article>
</wc-blog-post>
❌

<!-- Use light DOM -->
<article class="blog-post">
  <h1>SEO content here</h1>
</article>
✅
```

### 3. Simple Wrappers

If a component just wraps existing elements without custom behavior:

```html
<!-- Overkill -->
<wc-link href="/page">Click</wc-link> ❌

<!-- Use native element -->
<a href="/page" class="custom-link">Click</a> ✅
```

### 4. Non-Interactive Presentational Elements

Purely presentational components that don't need encapsulation:

```html
<!-- Probably overkill -->
<wc-spacer height="20px"></wc-spacer> ❌

<!-- CSS utility class is simpler -->
<div class="spacer-lg"></div>
✅
```

## Shadow DOM Use Cases (When to Use It)

Use Shadow DOM for:

### 1. Reusable Interactive Components

Form controls, buttons, dialogs, tooltips—anything with behavior and internal state:

```html
<wc-button variant="primary">Save</wc-button>
<wc-text-input label="Email" type="email"></wc-text-input>
```

### 2. Complex Widgets

Multi-part components with internal structure consumers shouldn't depend on:

```html
<wc-data-table data="${tableData}"></wc-data-table>
```

### 3. Style Isolation Requirements

Components that must look consistent regardless of page styles:

```html
<!-- Always renders correctly, even with aggressive global CSS -->
<wc-modal>...</wc-modal>
```

### 4. Third-Party Embeds

Widgets distributed to external sites where you have no control over page styles:

```html
<!-- Embedded on any site, isolated from their CSS -->
<medical-appointment-widget></medical-appointment-widget>
```

### 5. Design System Components

Library components consumed across multiple applications:

```html
<!-- HELiX use case -->
<wc-card>
  <wc-button>Action</wc-button>
</wc-card>
```

## Shadow DOM Debugging

### Chrome DevTools

**Viewing shadow DOM**:

1. Inspect element
2. Look for `#shadow-root` in Elements panel
3. Expand to view shadow tree

**Forcing shadow root inspection**:

```javascript
// In console
$0.shadowRoot; // Access shadow root of selected element
$0.shadowRoot.querySelector('button'); // Query shadow DOM
```

**Show user-agent shadow DOM**:
Settings → Preferences → Elements → Show user agent shadow DOM

### Firefox DevTools

Shadow DOM appears inline in the inspector with a `#shadow-root` label. No special settings needed.

### Safari Web Inspector

Shadow roots appear as `#shadow-root` nodes. Expand to inspect contents.

### Common Issues

**Styles not applying**:

```javascript
// Wrong: styles in light DOM
document.head.appendChild(style); ❌

// Right: styles in shadow DOM
shadowRoot.adoptedStyleSheets = [sheet]; ✅
```

**Event listeners not firing**:

```javascript
// Custom events need composed: true
this.dispatchEvent(
  new CustomEvent('wc-change', {
    composed: true, // ← Required
    bubbles: true,
  }),
);
```

**Query selectors returning null**:

```javascript
// Wrong: querying from document
document.querySelector('.internal-button'); ❌

// Right: querying from shadow root
element.shadowRoot.querySelector('.internal-button'); ✅
```

## Advanced Patterns

### Nested Shadow DOM

Shadow roots can contain elements that themselves have shadow roots:

```html
<wc-dialog>
  #shadow-root
  <wc-button>Close</wc-button>
  #shadow-root (nested)
  <button>...</button>
</wc-dialog>
```

**Style isolation**: Each shadow boundary creates a new scope. wc-button styles are isolated from wc-dialog styles.

### Imperative Slot Assignment

```typescript
const shadow = this.attachShadow({
  mode: 'open',
  slotAssignment: 'manual',
});

const slot = shadow.querySelector('slot');
slot.assign(...this.children); // Manual assignment
```

Rare pattern. Use for dynamic slot routing based on runtime conditions.

### Form-Associated Custom Elements

Combine shadow DOM with `ElementInternals` for custom form controls:

```typescript
class WcTextInput extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this._internals = this.attachInternals();
  }

  set value(val) {
    this._internals.setFormValue(val);
  }
}
```

Full pattern in wc-text-input implementation.

## Summary

Shadow DOM is the foundation that makes web components viable for enterprise systems. It provides:

- **DOM Encapsulation**: Components own their internal structure
- **Style Scoping**: CSS cannot leak in or out
- **Event Retargeting**: Implementation details stay hidden
- **Composition**: Slots enable declarative content projection
- **Performance**: Scoped styles and shared stylesheets optimize rendering
- **Accessibility**: Works transparently with ARIA and assistive tech

For HELiX, Shadow DOM is non-negotiable. Every component uses it. Every pattern depends on it. Encapsulation is not a feature—it's the guarantee that makes healthcare-grade reliability possible.

## Next Steps

- [Slots Guide](/components/shadow-dom/slots) — Master content projection patterns
- [CSS Parts Guide](/components/shadow-dom/parts) — Expose controlled styling hooks
- [Styling Guide](/components/styling) — Design token integration
- [Component Fundamentals](/components/fundamentals/overview) — Prerequisite concepts

## Sources

- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [web.dev: Shadow DOM v1](https://web.dev/articles/shadowdom-v1)
- [MDN: ShadowRoot Interface](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)
- [web.dev: Custom Elements Best Practices](https://web.dev/articles/custom-elements-best-practices)
