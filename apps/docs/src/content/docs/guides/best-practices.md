---
title: 'Best Practices'
description: 'Recommended patterns for consuming HELiX components effectively — design tokens, accessibility, performance, forms, theming, and testing.'
sidebar:
  order: 3
---

# Best Practices

Recommendations for teams building with HELiX. These patterns reflect lessons from production deployments across healthcare applications.

---

## Component Usage

### Use semantic HTML as the content layer

Slot content into HELiX components using semantic HTML. The Shadow DOM handles presentation; your markup should carry meaning:

```html
<!-- Good: semantic content in slots -->
<hx-card>
  <h2 slot="header">Patient Summary</h2>
  <p>Last updated: <time datetime="2026-01-15">January 15, 2026</time></p>
</hx-card>

<!-- Avoid: presentational wrappers with no semantic value -->
<hx-card>
  <div slot="header"><span>Patient Summary</span></div>
</hx-card>
```

### Prefer properties over attributes for dynamic values

HTML attributes are strings. For booleans, numbers, and objects, set the property directly in JavaScript rather than the attribute:

```javascript
// Preferred for non-string values
const datePicker = document.querySelector('hx-date-picker');
datePicker.value = new Date('2026-01-15');
datePicker.disabled = userIsReadOnly;

// Only use attributes for initial static values or strings
// <hx-text-input placeholder="Search..." type="search"></hx-text-input>
```

### Wait for component definition before accessing properties

Components aren't available until their class is registered. Access the API after `whenDefined()`:

```javascript
// Safe pattern for accessing component API
await customElements.whenDefined('hx-select');
const select = document.querySelector('hx-select');
select.value = 'option-1';
```

In frameworks, this is typically handled by the component's own lifecycle. For vanilla JS, `whenDefined()` is the correct hook.

### Use `part::` selectors over inline styles for customization

Prefer `::part()` and CSS custom properties over inline styles. This keeps customization maintainable and lets you scope overrides:

```css
/* Scoped to a specific context */
.patient-form hx-text-input::part(input) {
  border-radius: 0;
}

/* Token override for a section */
.sidebar {
  --hx-button-font-size: var(--hx-font-size-sm);
}
```

---

## Design Token Usage

### Override at the semantic tier, not primitive

Consumers customize the design system by overriding semantic tokens, not primitive values. This ensures all components pick up the change:

```css
/* Correct: override the semantic token */
:root {
  --hx-color-primary: #005fcc;
  --hx-color-primary-hover: #004db3;
}

/* Avoid: override at the primitive tier */
:root {
  --hx-color-blue-600: #005fcc; /* Fragile — other semantics may reference this */
}
```

### Use component tokens for per-component exceptions

When one specific component needs to deviate from the theme, use its component-scoped token:

```css
/* Only affects hx-button — doesn't change the global primary color */
hx-button.cta {
  --hx-button-bg: var(--hx-color-accent);
  --hx-button-bg-hover: var(--hx-color-accent-hover);
}
```

### Never hardcode visual values

Every color, spacing value, border radius, and font size should reference a `--hx-*` token. Hardcoded values break theming and dark mode:

```css
/* Wrong */
.my-component { background: #1a73e8; padding: 12px 24px; }

/* Correct */
.my-component {
  background: var(--hx-color-primary);
  padding: var(--hx-spacing-sm) var(--hx-spacing-md);
}
```

For the full token reference, see [Design Token Tiers](/design-tokens/tiers).

---

## Accessibility

### Always provide accessible labels

Every interactive component needs a label. Use `label` properties, `aria-label`, or visible text content:

```html
<!-- hx-button with visible text — no extra label needed -->
<hx-button>Save changes</hx-button>

<!-- Icon-only button — must have aria-label -->
<hx-button aria-label="Close dialog" icon-only>
  <hx-icon name="x"></hx-icon>
</hx-button>

<!-- Form inputs — use label or aria-label -->
<hx-text-input label="Email address" type="email" name="email"></hx-text-input>
```

### Pair error messages with form inputs

Use `aria-describedby` (or the component's `error` property) to associate error text with the field:

```html
<hx-text-input
  name="dob"
  label="Date of birth"
  error="Enter a date in MM/DD/YYYY format"
  invalid
></hx-text-input>
```

HELiX form components handle the `aria-describedby` wiring internally when you use the `error` property.

### Test with keyboard navigation

All interactive HELiX components are keyboard-accessible by default. Verify your integration doesn't break this:

- Custom click handlers should also respond to `Enter` and `Space`
- Don't use `tabindex="-1"` on focusable components unless you're managing focus programmatically
- Ensure focus returns to the trigger after closing dialogs, drawers, and dropdowns

### Respect `prefers-reduced-motion`

If you add custom animations to your layouts, mirror HELiX's motion handling:

```css
@media (prefers-reduced-motion: reduce) {
  .my-transition {
    transition: none;
  }
}
```

HELiX components handle this internally — the recommendation applies to animations you add in your own CSS.

---

## Performance

### Lazy-load components not needed on initial render

Use dynamic imports for components that appear only after user interaction:

```javascript
// Load hx-dialog only when the user opens it
button.addEventListener('click', async () => {
  await import('@helixui/library/components/hx-dialog');
  const dialog = document.querySelector('hx-dialog');
  dialog.open = true;
});
```

### Use `IntersectionObserver` for below-the-fold components

For complex components below the fold (data tables, carousels), defer loading until they're about to enter the viewport:

```javascript
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    await import('@helixui/library/components/hx-data-table');
    observer.disconnect();
  }
}, { rootMargin: '200px' });

observer.observe(document.querySelector('hx-data-table'));
```

### Avoid re-registering components

Calling `customElements.define()` for an already-registered element throws an error. HELiX component imports are safe to call multiple times — they check for existing registration internally. Don't guard imports yourself:

```javascript
// Unnecessary — safe to import multiple times
if (!customElements.get('hx-button')) {
  await import('@helixui/library/components/hx-button');
}

// Simpler — the import handles deduplication
await import('@helixui/library/components/hx-button');
```

### Tree-shake unused components

Only import the components you use. Barrel imports load every component:

```javascript
// Wrong: loads all 87 components
import '@helixui/library';

// Correct: loads only what you need
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-text-input';
```

For bundle analysis guidance, see [Bundle Size](/components/performance/bundle-size).

---

## Form Handling

### Use native form submission where possible

HELiX form components participate in native HTML form submission via `ElementInternals`. Prefer `<form>` with a submit handler over manually collecting values:

```html
<form id="patient-form">
  <hx-text-input name="name" label="Patient name" required></hx-text-input>
  <hx-select name="department" label="Department" required></hx-select>
  <hx-button type="submit">Save</hx-button>
</form>
```

```javascript
document.getElementById('patient-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  // data.get('name'), data.get('department') are available
});
```

### Validate before submit, report after

Use `reportValidity()` to trigger browser-native validation UI, and `setCustomValidity()` for server-side errors:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.reportValidity()) return; // Show built-in validation errors

  const result = await submitToServer(new FormData(form));

  if (result.errors) {
    // Show server-side errors using the component API
    document.querySelector('hx-text-input[name="email"]').error = result.errors.email;
  }
});
```

### Keep form state in one place

Don't split form state between the DOM and JavaScript. Either read values from the DOM on submit (using `FormData`), or manage state with a framework and bind back to component properties — not both:

```javascript
// Avoid: reading both from DOM and separate JS state
const nameFromDom = document.querySelector('hx-text-input[name="name"]').value;
const nameFromState = this.formState.name; // Which is the source of truth?

// Prefer: single source of truth
const formData = new FormData(form);
const name = formData.get('name');
```

---

## Theming Strategy

### Apply theme tokens at the `:root` level

Global theme overrides belong on `:root` (or `<html>`). Component-scoped overrides target the element or a containing selector:

```css
/* Global brand theme */
:root {
  --hx-color-primary: #005fcc;
  --hx-font-family-base: 'Inter', sans-serif;
  --hx-radius-md: 0.25rem;
}

/* Page-section variant */
.admin-panel {
  --hx-color-primary: #7c3aed;
}
```

### Use `hx-theme` for scoped theming

For dark mode sections or multi-brand layouts, use the `hx-theme` component to scope token overrides without CSS class gymnastics:

```html
<hx-theme color-scheme="dark">
  <!-- All HELiX components inside use dark mode tokens -->
  <hx-card>
    <hx-button>Dark mode button</hx-button>
  </hx-card>
</hx-theme>
```

### Define theme variants as CSS classes

For healthcare applications with multiple brand or department themes, define each as a CSS class on the root element:

```css
.theme-cardiology { --hx-color-primary: #dc2626; }
.theme-neurology  { --hx-color-primary: #7c3aed; }
.theme-oncology   { --hx-color-primary: #059669; }
```

```javascript
document.documentElement.className = `theme-${department}`;
```

For full theming guidance, see [Theming](/design-tokens/theming) and [Theming Recipes](/guides/theming-recipes).

---

## Testing Your HELiX Integration

### Test component behavior, not implementation details

Write tests that verify user-visible outcomes, not internal state:

```javascript
// Good: tests what the user experiences
it('submits the form with the entered email', async () => {
  const input = document.querySelector('hx-text-input[name="email"]');
  input.value = 'test@example.com';
  form.submit();
  expect(submittedData.get('email')).toBe('test@example.com');
});

// Avoid: tests internal implementation
it('sets _internalValue', () => { ... });
```

### Query shadow DOM content for assertions

If you need to inspect rendered output inside a component, use the shadow root:

```javascript
const button = document.querySelector('hx-button');
const internalButton = button.shadowRoot.querySelector('button');
expect(internalButton.getAttribute('aria-disabled')).toBe('true');
```

### Run accessibility audits in your test suite

Integrate axe-core to catch WCAG violations introduced by your integration:

```javascript
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const results = await axe(document.querySelector('form'));
  expect(results.violations).toEqual([]);
});
```

### Test keyboard navigation paths

Don't rely on mouse-only tests. Verify keyboard users can complete critical flows:

```javascript
it('can submit the form using only keyboard', async () => {
  document.querySelector('hx-text-input').focus();
  // Tab through fields, Enter to submit
  await userEvent.keyboard('{Tab}{Tab}{Enter}');
  expect(submitSpy).toHaveBeenCalled();
});
```

For complete testing patterns, see [Shadow DOM Testing](/components/testing/shadow-dom) and [Form Testing](/components/testing/form-testing).
