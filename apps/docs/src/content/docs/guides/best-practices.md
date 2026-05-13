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
  <h2 slot="heading">Patient Summary</h2>
  <p>Last updated: <time datetime="2026-01-15">January 15, 2026</time></p>
</hx-card>

<!-- Avoid: presentational wrappers with no semantic value -->
<hx-card>
  <div slot="heading"><span>Patient Summary</span></div>
</hx-card>
```

### Prefer properties over attributes for dynamic values

HTML attributes are strings. For booleans, numbers, and objects, set the property directly in JavaScript rather than the attribute:

```javascript
// Preferred for non-string values
const datePicker = document.querySelector('hx-date-picker');
datePicker.value = '2026-01-15'; // hx-date-picker.value is an ISO date string
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

### Use `::part()` selectors over inline styles for customization

Prefer `::part()` and CSS custom properties over inline styles. This keeps customization maintainable and lets you scope overrides:

```css
/* Scoped to a specific context */
.patient-form hx-text-input::part(input) {
  border-radius: 0;
}

/* Token override for a section — drive button typography via the typographic
   token chain (hx-button reads --hx-font-family-sans / weight tokens directly;
   pair with --hx-button-bg / --hx-button-color for color, and --hx-size-* for
   spacing). */
.sidebar {
  --hx-font-family-sans: var(--hx-font-family-mono);
}
```

---

## Design Token Usage

### Override at the semantic tier, not primitive

Consumers customize the design system by overriding semantic tokens, not primitive values. This ensures all components pick up the change:

```css
/* Correct: override semantic action tokens — every primary-surface component picks this up */
:root {
  --hx-color-action-primary-bg: #005fcc;
  --hx-color-action-primary-bg-hover: #004db3;
}

/* Also correct: shift the primary ramp itself (semantic action tokens chain from it) */
:root {
  --hx-color-primary-700: #005fcc;
  --hx-color-primary-800: #004db3;
}

/* Avoid: ad-hoc overrides outside the documented chain */
:root {
  --hx-color-blue-600: #005fcc; /* No --hx-color-blue-* tokens exist in the public API */
}
```

### Use component tokens for per-component exceptions

When one specific component needs to deviate from the theme, use its component-scoped token:

```css
/* Only affects hx-button.cta — doesn't change the global primary color.
   For variant-aware overrides, target the variant token instead so the
   shadow-root variant rules pick up the change (see Theming guide). */
hx-button.cta[variant='primary'] {
  --hx-color-action-primary-bg: var(--hx-color-primary-900);
  --hx-color-action-primary-bg-hover: var(--hx-color-primary-950, var(--hx-color-primary-900));
}
```

### Never hardcode visual values

Every color, spacing value, border radius, and font size should reference a `--hx-*` token. Hardcoded values break theming and dark mode:

```css
/* Wrong */
.my-component { background: #1a73e8; padding: 12px 24px; }

/* Correct */
.my-component {
  background: var(--hx-color-action-primary-bg);
  padding: var(--hx-space-3) var(--hx-space-6);
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

<!-- Icon-only button — must have an accessible-label; use hx-icon-button for the icon-only surface. -->
<hx-icon-button accessible-label="Close dialog">
  <hx-icon library="default" name="x"></hx-icon>
</hx-icon-button>

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

Calling `customElements.define()` for an already-registered element throws an error. HELiX components call `@customElement('hx-…')` directly at module load — the **module loader** itself dedupes imports (a second `import` returns the cached module without re-executing it), not a runtime guard inside the component. The practical rule is the same:

```javascript
// Safe to call from many places; the ESM cache prevents double registration
await import('@helixui/library/components/hx-button');
```

If you load the library across multiple realms (e.g. a CMS that injects scripts into multiple shadow roots), then a guard becomes useful — `customElements.get('hx-button')` is fine for that case.

### Tree-shake unused components

Only import the components you use. Barrel imports load every component:

```javascript
// Wrong: loads the entire library
import '@helixui/library';

// Correct: loads only what you need
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-text-input';
```

For bundle analysis guidance, see [Bundle Size](/guides/bundle-size/).

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

Use the form's `reportValidity()` to trigger browser-native validation UI (HELiX form controls participate via `ElementInternals`, so the native form-level validity sweep includes them). For server-side errors, set the component's `error` property — HELiX form controls do not expose `setCustomValidity()` as a public API; they own validity state via `ElementInternals` internally and surface the user-facing error string through the `error` property.

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.reportValidity()) return; // Native form-level validity report

  const result = await submitToServer(new FormData(form));

  if (result.errors) {
    // Server-side errors flow through the component API:
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
/* Global brand theme — override the primary palette and the canonical font/radius tokens */
:root {
  --hx-color-primary-700: #005fcc;
  --hx-color-action-primary-bg: var(--hx-color-primary-700);
  --hx-font-family-sans: 'Inter', sans-serif;
  --hx-border-radius-md: 0.25rem;
}

/* Page-section variant — scoped brand swap */
.admin-panel {
  --hx-color-primary-700: #7c3aed;
}
```

### Use `hx-theme` for scoped theming

For dark mode sections or multi-brand layouts, use the `hx-theme` component to scope token overrides without CSS class gymnastics:

```html
<hx-theme theme="dark">
  <!-- All HELiX components inside use dark mode tokens -->
  <hx-card>
    <hx-button>Dark mode button</hx-button>
  </hx-card>
</hx-theme>
```

### Define theme variants as CSS classes

For healthcare applications with multiple brand or department themes, define each as a CSS class on the root element:

```css
.theme-cardiology { --hx-color-primary-700: #dc2626; }
.theme-neurology  { --hx-color-primary-700: #7c3aed; }
.theme-oncology   { --hx-color-primary-700: #059669; }
```

```javascript
const root = document.documentElement;
const themeClasses = Array.from(root.classList).filter((c) => c.startsWith('theme-'));
if (themeClasses.length) root.classList.remove(...themeClasses);
root.classList.add(`theme-${department}`);
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
button.disabled = true;
await button.updateComplete;
const internalButton = button.shadowRoot.querySelector('button');
// hx-button's internal native <button> uses the native `disabled` property —
// aria-disabled is intentionally not set, because disabled is the canonical signal.
expect(internalButton.disabled).toBe(true);
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

For complete testing patterns, see [Testing Strategy](/architecture/testing/), [Vitest Setup](/components/testing/vitest-setup/), and [Form Testing](/components/testing/form-testing/).
