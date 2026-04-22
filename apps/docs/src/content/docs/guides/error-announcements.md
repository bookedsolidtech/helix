---
title: Error Announcement Pattern
description: Standard accessibility pattern for error announcements in HELiX form components.
---

## Overview

HELiX form components follow a consistent pattern for announcing validation errors to assistive technology. This guide documents the standard and explains the rationale behind the design decisions.

## The Standard Pattern

All form field components use `role="alert"` on error message containers:

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

4. **Error containers are conditionally rendered** — the `role="alert"` element is only present in the DOM when an error exists. Lit's conditional rendering (`${hasError ? html\`...\` : nothing}`) ensures the element is inserted dynamically, which triggers the live region announcement.

## Components Using This Pattern

### Form Fields (role="alert" for validation errors)

| Component | Error container selector |
|-----------|------------------------|
| `hx-text-input` | `[part="error"]` |
| `hx-textarea` | `[part="error"]` |
| `hx-select` | `[part="error"]` |
| `hx-combobox` | `[part="error"]` |
| `hx-number-input` | `[part="error-message"]` |
| `hx-date-picker` | `[part="error"]` |
| `hx-time-picker` | `[part="error"]` |
| `hx-file-upload` | `[part="error"]` |
| `hx-checkbox-group` | `[part="error-message"]` |
| `hx-radio-group` | `[part="error"]` |
| `hx-switch` | `[part="error"]` |
| `hx-field` | `[part="error-message"]` |

### Status Components (role="status" for polite updates)

These components use `role="status"` or `aria-live="polite"` for non-critical status updates:

| Component | Pattern |
|-----------|---------|
| `hx-alert` (info, success, warning) | `role="status"` on host |
| `hx-banner` (info, success) | `role="status"` on host |
| `hx-toast` (non-danger) | `role="status"` on base |
| `hx-status-indicator` | `aria-live="polite"` region |
| `hx-spinner` | `role="status"` on host |
| `hx-carousel` | `role="status"` live region |
| `hx-phi-field` | `role="status"` for mask state |

### Alert Components (role="alert" for critical notifications)

| Component | Pattern |
|-----------|---------|
| `hx-alert` (error) | `role="alert"` on host |
| `hx-banner` (warning, error) | `role="alert"` on host |
| `hx-toast` (danger) | `role="alert"` on base |
| `hx-clinical-status` (critical, emergent) | `role="alert"` on host |

## Form-Level Error Summary

The `hx-form` component renders an error summary with `role="alert"` and `aria-atomic="true"` when validation fails on submit:

```html
<div class="hx-form-error-summary" role="alert" aria-atomic="true" tabindex="-1">
  <h3>N errors found</h3>
  <ul>...</ul>
</div>
```

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

Lit's conditional rendering inserts the `role="alert"` element into the DOM when an error first appears. This DOM insertion triggers the live region announcement. If the error text changes while the element is already present, the mutation also triggers re-announcement because `role="alert"` announces on any content change.

### hx-checkbox Exception

The `hx-checkbox` component uses `role="status"` (polite) for its individual error state because checkbox errors are typically surfaced at the group level (`hx-checkbox-group`) where `role="alert"` is used. This avoids double-announcement when both the checkbox and its parent group display errors simultaneously.
