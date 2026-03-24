---
title: 'Troubleshooting Hub'
description: 'Common issues and solutions for HELiX web components, organized by category.'
sidebar:
  order: 2
---

# Troubleshooting Hub

Quick reference for common issues when building with HELiX components. Find your category below, or search for a specific error message.

---

## Installation & Setup

### Component not defined / `hx-button is not a valid custom element`

The component script hasn't loaded before the element is parsed.

```html
<!-- Wrong: element appears before the script -->
<hx-button>Click me</hx-button>
<script type="module" src="hx-button.js"></script>

<!-- Correct: script loads first, or use defer -->
<script type="module" src="hx-button.js"></script>
<hx-button>Click me</hx-button>
```

Or use `customElements.whenDefined()` to await registration:

```javascript
await customElements.whenDefined('hx-button');
const btn = document.querySelector('hx-button');
```

### Tree-shaking not working — full bundle included

Import from the per-component entry point, not the barrel:

```javascript
// Wrong: imports the entire library
import '@helixui/library';

// Correct: only loads hx-button
import '@helixui/library/components/hx-button';
```

### TypeScript: `Property 'X' does not exist on type 'HTMLElement'`

Add the HELiX type declarations to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@helixui/library"]
  }
}
```

Or import the component type directly:

```typescript
import type { HxButton } from '@helixui/library/components/hx-button';
const btn = document.querySelector('hx-button') as HxButton;
```

---

## Shadow DOM Styling

### CSS styles not applying to a component

External styles cannot pierce Shadow DOM boundaries. Use the supported styling APIs:

```css
/* Wrong: descendant selector can't reach inside shadow root */
hx-button span { color: red; }

/* Correct 1: CSS custom properties (design tokens) */
hx-button { --hx-button-bg: red; }

/* Correct 2: ::part() pseudo-element */
hx-button::part(button) { background: red; }
```

### `::part()` selector not working

Check the component's documentation for the exact part name. Part names are case-sensitive and hyphenated:

```css
/* Wrong */
hx-button::part(Button) { ... }

/* Correct */
hx-button::part(button) { ... }
```

Part names for every component are listed in the component's API reference page.

### Inheritable CSS not reaching inside the component

Shadow DOM inherits a subset of CSS properties — primarily typography and color. Layout and box-model properties do not inherit. For typography inheritance:

```css
/* This DOES work — font properties are inherited */
hx-button { font-family: 'Inter', sans-serif; }

/* This does NOT work — background is not inherited */
hx-button { background: blue; } /* applies to host, not internals */
```

### `:host` styles seem to have no effect

`:host` styles apply to the custom element itself (the host element). They have lower specificity than styles applied from outside:

```css
/* In your app CSS — this overrides :host styles */
hx-button { display: block; }
```

If you're authoring a component, use `:host` in the component's shadow styles. If you're consuming a component, apply styles directly to the element selector.

---

## Form Integration

### Form submission not including component values

HELiX form components use `ElementInternals` for form association. Ensure you're not wrapping in a `<div>` that breaks the form context, and that the component has a `name` attribute:

```html
<!-- Wrong: name attribute missing -->
<form>
  <hx-text-input></hx-text-input>
</form>

<!-- Correct -->
<form>
  <hx-text-input name="email" type="email"></hx-text-input>
</form>
```

### `FormData` doesn't contain the component's value

HELiX form components call `internals.setFormValue()` internally. Verify the component supports form association — check the API reference for `static formAssociated = true`. If the component doesn't declare this, it won't participate in native form submission.

For unsupported components, use a hidden `<input>` and sync it manually:

```javascript
const hxSelect = document.querySelector('hx-select');
const hidden = document.querySelector('input[name="myField"]');

hxSelect.addEventListener('hx-change', (e) => {
  hidden.value = e.detail.value;
});
```

### Validation not triggering on submit

HELiX form components use the Constraint Validation API. Call `reportValidity()` on the form to trigger validation display:

```javascript
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  if (!form.reportValidity()) {
    e.preventDefault();
  }
});
```

For programmatic validation state, see [Form Validation](/components/forms/validation).

### `ElementInternals` errors in older browsers

`ElementInternals` requires Chrome 77+, Firefox 93+, Safari 16.4+. For older browser support, use the [@ungap/custom-elements](https://github.com/ungap/custom-elements) polyfill:

```javascript
import '@ungap/custom-elements';
```

---

## Event Handling

### Custom events not bubbling outside the component

HELiX events use `bubbles: true, composed: true` so they cross shadow boundaries. If you're not receiving events on a parent element, verify:

1. The event name — HELiX events use the `hx-` prefix (e.g., `hx-change`, `hx-click`)
2. The event listener is on an ancestor element, not inside a shadow root
3. You're not calling `e.stopPropagation()` somewhere in the tree

```javascript
// Correct: listen on any ancestor
document.addEventListener('hx-change', (e) => {
  console.log(e.target, e.detail);
});
```

### Event fires but `e.target` is not the component

When an event crosses a shadow root, `e.target` is retargeted to the host element from the perspective of the listener. This is expected shadow DOM behavior:

```javascript
// Inside shadow root: target = internal <input>
// Outside shadow root: target = hx-text-input (host)
hxInput.addEventListener('hx-change', (e) => {
  console.log(e.target); // hx-text-input ✓
});
```

Use `e.composedPath()` to inspect the full path including shadow internals.

### Event not firing at expected time

Check if the component dispatches the event synchronously or asynchronously. Components that await user interaction (e.g., `hx-change` on blur vs. `hx-input` on keypress) may fire at different times. Review the component's API reference for event timing details.

---

## SSR / Hydration

### `document is not defined` during SSR

HELiX components are browser-only — they rely on the DOM. Do not import component definitions in server-side render paths:

```javascript
// Wrong: runs during SSR
import '@helixui/library/components/hx-button';

// Correct: dynamic import on client only
if (typeof window !== 'undefined') {
  await import('@helixui/library/components/hx-button');
}
```

In frameworks like Astro, use `client:only` directive:

```astro
<hx-button client:only="lit">Click me</hx-button>
```

### Hydration mismatch warnings

Web components render their shadow DOM on the client. Server-rendered HTML will not include the shadow DOM content, causing hydration mismatches in frameworks that compare server vs client output.

Use the `client:only` pattern and avoid rendering component internals server-side. The custom element tag itself (`<hx-button>`) is safe to include in server HTML — the shadow DOM is created on the client when the element upgrades.

### Component appears unstyled / FOUC (Flash of Unstyled Content)

Components may appear unstyled briefly before the JavaScript loads and upgrades them. Mitigate with CSS:

```css
/* Hide unupgraded elements */
hx-button:not(:defined) {
  visibility: hidden;
}
```

Or use `customElements.whenDefined()` to show content only after upgrade:

```javascript
await Promise.allSettled([
  customElements.whenDefined('hx-button'),
  customElements.whenDefined('hx-text-input'),
]);
document.body.classList.add('components-ready');
```

---

## TypeScript

### `JSX.IntrinsicElements` errors with custom elements in React

Add HELiX element types to your React type declarations:

```typescript
// src/custom-elements.d.ts
import type { HxButton } from '@helixui/library/components/hx-button';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HxButton> & Partial<HxButton>,
        HxButton
      >;
    }
  }
}
```

### Generic component props not resolving correctly

HELiX components use TypeScript strict mode. If a prop type appears as `never` or doesn't match, verify you're importing the component's type (not the element class) and using the correct property name (camelCase in TypeScript, kebab-case in HTML):

```typescript
import type { HxSelect } from '@helixui/library/components/hx-select';
// Property: el.selectedValue (TS) → attribute: selected-value (HTML)
```

### `@property` decorator type errors

When extending HELiX components, ensure your `tsconfig.json` includes the `experimentalDecorators` and `useDefineForClassFields: false` settings required for Lit:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

---

## Bundle Size

### Bundle size is larger than expected

1. Verify you're using per-component imports (not the barrel export)
2. Check for accidental side-effect imports
3. Run bundle analysis to find the source:

```bash
npx vite-bundle-visualizer
# or
npx webpack-bundle-analyzer stats.json
```

### Design tokens CSS file is large

The full token file includes all primitive, semantic, and component tokens. For production, import only the tokens your theme uses, or generate a minimal token file using the HELiX token build script.

### Lit is bundled multiple times

If you use multiple HELiX components and Lit appears duplicated in your bundle, ensure all components resolve to the same `lit` package version. Check for version conflicts:

```bash
npm ls lit
# or
pnpm why lit
```

All HELiX components share Lit as a peer dependency. If versions diverge, deduplication may fail.

---

## Drupal Integration

### Component not upgrading in Drupal

Drupal's AJAX system may inject HTML after the initial page load. Components inserted via AJAX need the library to already be loaded. Ensure the HELiX library attachment is global (not lazy):

```yaml
# my_module.libraries.yml
my-helix-components:
  js:
    js/my-helix-components.js: {}
  dependencies:
    - core/drupal
```

Attach the library in a hook so it loads on every page that might use AJAX to inject components:

```php
function my_module_page_attachments(array &$attachments) {
  $attachments['#attached']['library'][] = 'my_module/my-helix-components';
}
```

### Drupal Behaviors not re-attaching to upgraded components

The `customElements.whenDefined()` check inside your behavior ensures the component's API is available before use:

```javascript
Drupal.behaviors.myComponent = {
  attach(context) {
    once('my-component', 'hx-button[data-action]', context).forEach((el) => {
      customElements.whenDefined('hx-button').then(() => {
        el.addEventListener('hx-click', handleAction);
      });
    });
  },
};
```

### Twig template rendering attribute as `"false"` string

Boolean attributes in HTML are presence-based — the string `"false"` is truthy. Use conditional Twig syntax:

```twig
{# Wrong: renders disabled="false" which still disables the button #}
<hx-button disabled="{{ disabled }}">Submit</hx-button>

{# Correct: only renders the attribute when true #}
<hx-button {% if disabled %}disabled{% endif %}>Submit</hx-button>
```

See [Boolean Attributes](/guides/boolean-attributes) for full details.

### Component styles conflict with Drupal theme CSS

Shadow DOM prevents most conflicts, but global CSS resets can affect the host element. Scope your resets to avoid targeting custom elements:

```css
/* Wrong: affects hx-button host element */
* { box-sizing: border-box; margin: 0; }

/* Better: exclude custom elements */
*:not(:defined) { box-sizing: border-box; }
```

For complete Drupal integration guidance, see [Drupal Integration Overview](/drupal-integration/overview).

---

## Still Stuck?

If your issue isn't covered here:

- **GitHub Issues**: [Search existing issues](https://github.com/bookedsolidtech/helix/issues) or file a new one with a minimal reproduction
- **Drupal-specific issues**: Include your Drupal version, theme, and the HELiX library attachment method
- **Component API reference**: Each component page lists all properties, events, slots, and CSS parts
- **Architecture docs**: [Shadow DOM Architecture](/components/shadow-dom/architecture) and [Design Token Tiers](/design-tokens/tiers) cover foundational concepts
