---
title: Error Announcement Pattern
description: Standard accessibility pattern for error announcements in HELiX form components.
---

## Overview

HELiX form components follow a consistent pattern for announcing validation errors to assistive technology. This guide documents the standard and explains the rationale behind the design decisions.

## The Standard Pattern

Most form field components use `role="alert"` on error message containers (notable exception: `hx-checkbox` uses `role="status"` on its individual error state — see [hx-checkbox Exception](#hx-checkbox-exception) below):

```html
<!-- Rendered inside Shadow DOM when error property is set -->
<div part="error" class="field__error" id="error-id" role="alert">
  Error message text
</div>
```

### Why `role="alert"` (not `role="status"`)

- `role="alert"` implies `aria-live="assertive"` — the error is announced immediately, interrupting any current speech
- `role="status"` implies `aria-live="polite"` — the message waits until the screen reader is idle
- **In healthcare applications, validation errors demand immediate attention.** A missed error on a medication dosage field or patient identifier can have clinical consequences. Assertive announcement is the correct default.

### Rules

1. **Never combine `role="alert"` with `aria-live="polite"`** — this creates a contradictory signal. `role="alert"` already implies `aria-live="assertive"`. Adding `aria-live="polite"` downgrades the announcement priority, which is incorrect for error states.

2. **Do not add redundant `aria-live="assertive"`** — `role="alert"` already implies this. Adding it explicitly is harmless but unnecessary and adds DOM noise.

3. **Error containers must have an `id`** — the associated input references the error via `aria-describedby`. This creates a programmatic association between the input and its error message.

4. **Error containers are conditionally rendered in field-level components** — components like `hx-text-input`, `hx-textarea`, and `hx-select` only render the `role="alert"` container when `error` is set; Lit's conditional rendering (`${hasError ? html\`…\` : nothing}`) triggers the live region announcement on DOM insertion. Group-level and status components (`hx-checkbox-group`, `hx-toast`, `hx-banner`) instead keep a **persistent live region** in the DOM and rely on text-content mutation to trigger announcements. Both patterns are valid — pick based on whether announcements should fire on first appearance or on every text update.

## Components Using This Pattern

### Form Fields (role="alert" for validation errors)

| Component | Error container selector |
|-----------|------------------------|
| `hx-text-input` | `[part="error"]` |
| `hx-textarea` | `[part="error"]` |
| `hx-select` | `[part="error"]` |
| `hx-combobox` | `[part="error"]` |
| `hx-number-input` | `[part="error"]` |
| `hx-date-picker` | `[part="error"]` |
| `hx-time-picker` | `[part="error"]` |
| `hx-file-upload` | `[part="error"]` |
| `hx-checkbox-group` | `[part="error"]` |
| `hx-radio-group` | `[part="error"]` |
| `hx-switch` | `[part="error"]` |
| `hx-field` | `[part="error"]` |

### Status Components (role="status" for polite updates)

These components use `role="status"` or `aria-live="polite"` for non-critical status updates:

| Component | Pattern |
|-----------|---------|
| `hx-alert` (info, success, warning) | `role="status"` on host |
| `hx-banner` (info, success, warning) | `role="status"` on host (warning is intentionally polite — see `hx-banner.ts:212`) |
| `hx-toast` (non-danger) | `role="status"` on host |
| `hx-status-indicator` | `aria-live="polite"` region |
| `hx-spinner` | `role="status"` on host |
| `hx-carousel` | `role="status"` live region |
| `hx-phi-field` | `role="status"` for mask state |

### Alert Components (role="alert" for critical notifications)

| Component | Pattern |
|-----------|---------|
| `hx-alert` (error) | `role="alert"` on host |
| `hx-banner` (error / critical) | `role="alert"` on host |
| `hx-toast` (danger) | `role="alert"` on host |
| `hx-clinical-status` (critical, emergent) | `role="alert"` on host |

## Form-Level Error Summary

The `hx-form` component renders an error summary with `role="alert"` and `aria-atomic="true"` when validation fails on submit:

```html
<div class="hx-form-error-summary" role="alert" aria-atomic="true" tabindex="-1">
  <p>N errors found</p>
  <ul>...</ul>
</div>
```

The component renders the summary as a flat `<div>` + `<ul>` (no `<h3>` heading element today); consumers who want a heading can slot one in via their template, or wrap the form with their own labelled region.

The `tabindex="-1"` allows the summary to receive programmatic focus (via `focus()`) after form submission, ensuring keyboard users are moved to the error list.

## Testing Error Announcements

When testing error announcement behavior, verify:

```ts
// 1. Error container uses role="alert"
const errorDiv = shadowQuery(el, '[role="alert"]');
expect(errorDiv).toBeTruthy();

// 2. No conflicting aria-live attribute
expect(errorDiv?.hasAttribute('aria-live')).toBe(false);

// 3. Input references error via aria-describedby
const input = shadowQuery(el, 'input');
expect(input?.getAttribute('aria-describedby')).toContain(errorDiv?.id);
```

## Known Considerations

### Dynamic Error Insertion vs. Text Update

Field-level form components (`hx-text-input`, `hx-textarea`, `hx-select`, etc.) use Lit's conditional rendering — the `role="alert"` container is inserted into the shadow DOM when the `error` property is first set, which fires the live-region announcement. Subsequent text mutations on the same element also re-announce because `role="alert"` is on a continuously-present `aria-live="assertive"` region.

Group-level and toast/banner components instead keep a **persistent live region** in their shadow DOM. The container is always present (often empty / `aria-hidden` when idle); when the message text changes, the mutation triggers the announcement. This matters for testing — query for `[role="alert"]` after the first error appears in field-level components, but always present in group/toast/banner components.

### hx-checkbox Exception

The `hx-checkbox` component uses `role="status"` (polite) for its individual error state because checkbox errors are typically surfaced at the group level (`hx-checkbox-group`) where `role="alert"` is used. This avoids double-announcement when both the checkbox and its parent group display errors simultaneously.
