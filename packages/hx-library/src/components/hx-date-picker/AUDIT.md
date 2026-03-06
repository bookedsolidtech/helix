# AUDIT: hx-date-picker — T2-32 Antagonistic Quality Review

**Date:** 2026-03-06
**Reviewer:** Antagonistic audit agent
**Source branch:** `rescue/abandoned-components` (PR #175)
**Severity scale:** P0 = ship blocker · P1 = must fix before GA · P2 = fix before stable

---

## Executive Summary

`hx-date-picker` is a healthcare-critical component (appointments, DOB, prescriptions). The implementation is substantial and well-structured for a rescue from an orphaned branch. However, it has **2 P0 blockers** in the ARIA grid structure, **8 P1 issues** across accessibility, tests, and CSS, and **11 P2 findings**. The component **MUST NOT ship** until P0 and P1 issues are resolved.

---

## P0 — Ship Blockers

### P0-1 · ARIA Grid: Missing `role="row"` — Structure Violation

**Area:** Accessibility
**File:** `hx-date-picker.ts` — `_renderWeekdayHeaders()`, `_renderDayGrid()`

The calendar uses `role="grid"` on the container, `role="columnheader"` on weekday headers, and `role="gridcell"` on day cells — but there are **no `role="row"` elements wrapping each week row**. The ARIA grid pattern requires a strict hierarchy:

```
role="grid"
  role="row"          ← MISSING
    role="columnheader" (or gridcell)
```

Both `_renderWeekdayHeaders()` and `_renderDayGrid()` render elements as flat direct children of the grid `div`. The CSS Grid layout visually groups them into rows, but ARIA has no concept of CSS Grid — it requires explicit `role="row"` wrappers. Screen readers using virtual cursor navigation will experience a broken, flat list of 49 cells with no row structure.

The `_getDaysInGrid()` method already produces a flat array; rows must be constructed explicitly by chunking into groups of 7 before rendering. Weekday headers should also be wrapped in a single `role="row"`.

**axe-core** would flag this as `aria-required-children` violation.

---

### P0-2 · Day Cells: `aria-pressed` Used Instead of `aria-selected`

**Area:** Accessibility
**File:** `hx-date-picker.ts` — `_renderDayGrid()` (line ~400)

Selected day buttons render `aria-pressed=${isSelected ? 'true' : 'false'}`. This is wrong on two levels:

1. **`aria-pressed` is for toggle buttons**, not for selected items in a grid. The semantically correct attribute for a selected item in `role="gridcell"` is **`aria-selected`**.
2. The ARIA authoring practices for date pickers specify that `aria-selected="true"` belongs on the `role="gridcell"` element (the `<div>` wrapper), not on the button inside it.

The test at line 655 (`'selected day has aria-pressed="true"'`) asserts the current (incorrect) behavior. Both the implementation and the test must be corrected.

---

## P1 — Must Fix Before GA

### P1-1 · `aria-current="date"` Missing on Today's Cell

**Area:** Accessibility
**File:** `hx-date-picker.ts` — `_renderDayGrid()`

Today's date cell applies the `calendar__day--today` CSS class and a visual indicator (dot via `::after`), but does not set `aria-current="date"` on the cell. The ARIA spec (and WCAG SC 1.3.1 Info and Relationships) requires that the programmatic meaning of "today" be conveyed to AT, not just visually. Screen reader users navigating the calendar will hear the date but have no way to know which date is "today."

```html
<!-- Required -->
<div role="gridcell">
  <button aria-current="date">15</button>
</div>
```

No test exists for this attribute. A test must be added.

---

### P1-2 · Focus Not Trapped in Calendar Dialog

**Area:** Accessibility
**File:** `hx-date-picker.ts` — calendar render block

The calendar popup has `role="dialog"` and `aria-modal="true"`. Per the ARIA dialog pattern and WCAG 2.1 SC 2.1.2 (No Keyboard Trap, Exception), when a modal dialog is open:
- **Focus MUST be trapped** within the dialog while it is open.
- Tab and Shift+Tab must cycle within the dialog's focusable elements (prev/next buttons, day grid).

The current implementation adds no focus trap. Users can Tab freely out of the calendar into surrounding page content — including other date pickers, links, and form fields — without closing it. This is a conformance failure for the ARIA dialog pattern. In healthcare forms, this could cause users to interact with incorrect fields.

No test verifies Tab/Shift+Tab focus cycling within the calendar.

---

### P1-3 · `role="combobox"` on Readonly Input Is Incorrect

**Area:** Accessibility
**File:** `hx-date-picker.ts` — `render()` (input element)

The readonly `<input>` is given `role="combobox"`. The ARIA 1.2 combobox pattern requires the combobox to be an editable text field that filters a listbox, tree, grid, or dialog. A **readonly** field cannot fulfill the combobox contract — there is no user-entered text, no filtering, and no active typing interaction. Screen readers (especially JAWS and NVDA) may announce "combobox" and then fail to expose the expected interaction model.

The correct pattern for a date-picker-with-popup-calendar is:
- A readonly text display (`role="textbox"` with `aria-readonly="true"`, or just a plain presentation element)
- A separate trigger button with `aria-haspopup="dialog"` and `aria-controls="<calendarId>"` (already present on the trigger)

The trigger button alone correctly represents the popup affordance. The input's role should be reconsidered.

---

### P1-4 · Conflicting `role="alert"` + `aria-live="polite"` on Error Div

**Area:** Accessibility
**File:** `hx-date-picker.ts` — `render()` error message block

The error message element is rendered with both `role="alert"` and `aria-live="polite"`:

```html
<div part="error" role="alert" aria-live="polite">
```

`role="alert"` implicitly sets `aria-live="assertive"` and `aria-atomic="true"`. Adding `aria-live="polite"` **overrides** the implicit assertive behavior, creating a contradictory element that browsers resolve inconsistently. For healthcare validation errors (e.g., "Please enter a valid date of birth"), assertive announcement is appropriate and intentional. The `aria-live="polite"` attribute should be removed.

---

### P1-5 · Prev/Next Month Buttons Not Disabled at Min/Max Boundaries

**Area:** Accessibility + UX
**File:** `hx-date-picker.ts` — `_renderDayGrid()`, month nav render

When `min` is set, navigating to a previous month where all dates are before `min` produces a calendar full of disabled days with no selectable options. The Previous Month button is never disabled, even when the current view is already at or before the `min` month. Similarly, Next Month is never disabled even when at the `max` boundary.

This creates a confusing experience: users can scroll backward indefinitely, encountering months where every date is disabled. The navigation buttons should be disabled (or at minimum use `aria-disabled` with visual feedback) when they would navigate beyond the meaningful date range.

---

### P1-6 · No Keyboard Navigation Tests (Arrow Keys, PageUp/Down, Home/End)

**Area:** Tests
**File:** `hx-date-picker.test.ts`

The test file covers Escape, Enter, and Space — but the calendar's arrow key navigation (defined in `_handleCalendarKeydown`) has **zero test coverage**:

| Key | Expected behavior | Tested? |
|-----|-------------------|---------|
| ArrowLeft | Move to previous day | ❌ |
| ArrowRight | Move to next day | ❌ |
| ArrowUp | Move up one week | ❌ |
| ArrowDown | Move down one week | ❌ |
| PageUp | Navigate to previous month | ❌ |
| PageDown | Navigate to next month | ❌ |
| Home | Move to start of week (Sunday) | ❌ |
| End | Move to end of week (Saturday) | ❌ |
| ArrowLeft at start of month | Wraps to previous month | ❌ |
| ArrowRight at end of month | Wraps to next month | ❌ |

These are the core calendar interactions for keyboard users. The grid keyboard navigation is untested code that could silently break.

---

### P1-7 · Axe-Core Tests Only Cover Closed State — Calendar Grid Not Audited

**Area:** Tests
**File:** `hx-date-picker.test.ts` — `Accessibility (axe-core)` describe block

All 4 axe tests instantiate the component in its default closed state. The calendar popup — with its `role="grid"`, `role="columnheader"`, and `role="gridcell"` elements — is **never rendered during axe testing**. The P0-1 violation (`aria-required-children` for missing `role="row"`) would be caught by axe if the calendar were open during the test.

An axe test must be added that:
1. Renders the component
2. Opens the calendar
3. Runs `checkA11y()` on the open state

---

### P1-8 · No High Contrast / Forced Colors Mode Support

**Area:** CSS
**File:** `hx-date-picker.styles.ts`

No `@media (forced-colors: active)` rules exist. In Windows High Contrast Mode (commonly used by visually impaired users, including in healthcare settings):

- `background-color` overrides on `.calendar__day--selected` will be stripped by the OS, making selected days visually indistinguishable from unselected days
- The today indicator (a `::after` dot using `background-color`) will become invisible
- The focus ring implemented via `box-shadow` will be invisible (HCM ignores `box-shadow`)
- Disabled day opacity (`opacity: 0.4`) may be overridden by the OS

At minimum, `outline` should be used alongside `box-shadow` for focus indicators, and the `selected` state should use a `border` or `outline` that survives forced colors.

---

## P2 — Fix Before Stable Release

### P2-1 · `tabindex: 0` Is Not a Valid CSS Property

**Area:** CSS
**File:** `hx-date-picker.styles.ts` — `.calendar__day` rule block

```css
.calendar__day {
  /* ... */
  tabindex: 0;  /* ← invalid CSS property, does nothing */
}
```

CSS does not have a `tabindex` property. The HTML attribute `tabindex` is set correctly via the Lit template (`tabindex=${isFocused ? '0' : '-1'}`). This line should be removed to avoid confusion.

---

### P2-2 · `.calendar__day--other-month` CSS Class Is Dead Code

**Area:** CSS
**File:** `hx-date-picker.styles.ts`

The styles define `.calendar__day--other-month` and `.calendar__day--other-month.calendar__day--disabled` rules, but `_renderDayGrid()` never applies this class. Leading/trailing cells are rendered as empty `null` placeholders, not as previous/next-month days. This dead CSS rule either represents an incomplete feature (showing surrounding-month days grayed out) or a copy-paste residual. It should be removed or implemented.

---

### P2-3 · `--hx-date-picker-calendar-shadow` Undocumented CSS Custom Property

**Area:** CSS / Documentation
**File:** `hx-date-picker.styles.ts` — `.calendar` rule; `hx-date-picker.ts` — JSDoc

The calendar's `box-shadow` uses `--hx-date-picker-calendar-shadow` as a customization point:

```css
box-shadow: var(--hx-date-picker-calendar-shadow, 0 4px 6px ...);
```

But this property is **not listed in the `@cssprop` JSDoc** block in the component class. Consumers have no way to discover this customization point via CEM or Storybook autodocs.

---

### P2-4 · `color-mix()` Without `@supports` Fallback

**Area:** CSS
**File:** `hx-date-picker.styles.ts` — focus ring and trigger hover rules

`color-mix(in srgb, ...)` is used for focus-ring opacity and trigger hover backgrounds. While browser support is good (Chrome 111+, Safari 16.2+, Firefox 113+), healthcare environments may mandate broader compatibility. No `@supports` fallback is provided for browsers where `color-mix` is unsupported.

---

### P2-5 · Calendar Popup Has No Viewport Overflow / Flip Logic

**Area:** CSS
**File:** `hx-date-picker.styles.ts` — `.calendar` rule

The calendar always opens below the input (`top: calc(100% + ...); left: 0`). In forms positioned near the bottom of the viewport (common in multi-field healthcare forms), the calendar will be clipped by the viewport or overflow behind other UI. No JavaScript or CSS detects this and repositions the popup above the input.

---

### P2-6 · `Math.random()` for Unique ID Generation Is Not Guaranteed Unique

**Area:** TypeScript
**File:** `hx-date-picker.ts` — `_id` field

```ts
private _id = `hx-date-picker-${Math.random().toString(36).slice(2, 9)}`;
```

Collision probability is low but non-zero. In a healthcare form with multiple date pickers rendered simultaneously (e.g., DOB + appointment + discharge date), an ID collision would break `for`/`id` label association and `aria-controls` linking. Use `crypto.randomUUID()` (available in all modern browsers) or a module-level integer counter.

---

### P2-7 · `key` Attribute on Lit Template Items Does Nothing

**Area:** TypeScript
**File:** `hx-date-picker.ts` — `_renderDayGrid()` (null cell branch)

```ts
return html`<div ... key=${index}></div>`;
```

Lit does not have a `key` prop like React. The `key` attribute is rendered as a literal HTML attribute on the element. To achieve keyed rendering in Lit, the `repeat()` directive from `lit/directives/repeat.js` must be used. This is a silent React-ism that does nothing in Lit — remove or replace with `repeat()`.

---

### P2-8 · Min/Max Boundary Tests Are Date-Dependent and Brittle

**Area:** Tests
**File:** `hx-date-picker.test.ts` — `Calendar: Min/Max` describe block

The min/max tests compute dates relative to `new Date()` (today). Tests like:

```ts
const minDate = `${year}-${month}-15`;
// Day 1 should be before the min date
const dayOne = Array.from(days).find((d) => d.dataset['day'] === '1');
if (dayOne) { ... }
```

If executed on the 1st of a month, the view would default to the current month. Day 1 at `min=15` IS disabled — but the test uses `if (dayOne)` (optional chaining) meaning if Day 1 doesn't render in the visible grid, the assertion is silently skipped. Similarly, `max=05` tests break if today is the 1st–5th of the month (all days would be after max). These tests need date-fixed scenarios using static ISO strings for the component's `value` to anchor the calendar view.

---

### P2-9 · No Test: Focus Returns to Trigger After Calendar Close

**Area:** Tests
**File:** `hx-date-picker.test.ts`

After selecting a date or pressing Escape, `_closeCalendar()` schedules `this._trigger?.focus()` via `updateComplete.then()`. No test verifies that the trigger button actually receives focus after close. This is a standard accessibility requirement for modal dialogs (focus must return to the element that opened the dialog).

---

### P2-10 · `live` Directive Unnecessary on Readonly Input

**Area:** TypeScript
**File:** `hx-date-picker.ts` — `render()` input element

```ts
.value=${live(displayValue)}
```

The `live` directive checks the live DOM value before applying updates, which is designed for inputs where user typing might diverge from the Lit model. Since this input is `readonly`, users cannot type into it — the live DOM value will always equal `displayValue`. The `live` directive adds unnecessary DOM reads on every render. Replace with `.value=${displayValue}`.

---

### P2-11 · `name` Attribute on Shadow DOM Readonly Input May Confuse Drupal Processors

**Area:** Drupal / Form Association
**File:** `hx-date-picker.ts` — render()

```ts
name=${ifDefined(this.name || undefined)}
```

The shadow DOM `<input>` has the `name` attribute set. While Shadow DOM inputs do not participate in `FormData` (so no double-submission occurs), Drupal's form processing may inspect the emitted HTML and be confused by a `name` attribute on a readonly display input inside the shadow root. The form value is correctly submitted via `ElementInternals.setFormValue()` using the `name` on the custom element host. The `name` attribute on the shadow input can be removed — the `label[for]` / `input[id]` association works via the `_inputId`, not via `name`.

---

## Summary Table

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| P0-1 | Accessibility | **P0** | Missing `role="row"` in ARIA grid — structure violation |
| P0-2 | Accessibility | **P0** | `aria-pressed` used instead of `aria-selected` on day cells |
| P1-1 | Accessibility | P1 | `aria-current="date"` missing on today's cell |
| P1-2 | Accessibility | P1 | No focus trap in `role="dialog"` calendar popup |
| P1-3 | Accessibility | P1 | `role="combobox"` on readonly input — incorrect ARIA pattern |
| P1-4 | Accessibility | P1 | `role="alert"` + `aria-live="polite"` — contradictory attributes |
| P1-5 | Accessibility/UX | P1 | Prev/Next month buttons not disabled at min/max boundaries |
| P1-6 | Tests | P1 | Zero keyboard navigation tests (arrows, PageUp/Down, Home/End) |
| P1-7 | Tests | P1 | Axe tests never open the calendar — grid structure never audited |
| P1-8 | CSS | P1 | No `forced-colors` media query — High Contrast Mode unsupported |
| P2-1 | CSS | P2 | `tabindex: 0` is invalid CSS (does nothing) |
| P2-2 | CSS | P2 | `.calendar__day--other-month` CSS class is dead code |
| P2-3 | CSS/Docs | P2 | `--hx-date-picker-calendar-shadow` undocumented CSS custom property |
| P2-4 | CSS | P2 | `color-mix()` used without `@supports` fallback |
| P2-5 | CSS | P2 | No viewport overflow / flip logic for calendar popup |
| P2-6 | TypeScript | P2 | `Math.random()` ID generation not collision-safe |
| P2-7 | TypeScript | P2 | `key` attribute on Lit templates is a React-ism (no-op in Lit) |
| P2-8 | Tests | P2 | Min/max boundary tests are date-dependent and silently skip assertions |
| P2-9 | Tests | P2 | No test: focus returns to trigger after calendar close |
| P2-10 | TypeScript | P2 | `live` directive unnecessary on readonly input |
| P2-11 | Drupal | P2 | `name` attribute on shadow DOM input may confuse Drupal processors |

---

## Do NOT Fix in This PR

This is a documentation-only audit. All findings above are **documented only**. No source files were modified.
