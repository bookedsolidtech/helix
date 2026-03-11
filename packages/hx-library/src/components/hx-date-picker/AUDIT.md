# AUDIT: hx-date-picker — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-date-picker.ts` — Component implementation (927 lines)
- `hx-date-picker.styles.ts` — Lit CSS styles (412 lines)
- `hx-date-picker.test.ts` — Vitest browser tests (60+ tests)
- `hx-date-picker.stories.ts` — Storybook stories (23 stories)
- `index.ts` — Barrel re-export
- `apps/docs/src/content/docs/component-library/hx-date-picker.mdx` — Starlight docs

---

## Quality Gate Results

| Gate | Check             | Status                                   |
| ---- | ----------------- | ---------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors, no `any` types       |
| 2    | Test suite        | PASS — 60+ tests covering all features   |
| 3    | Accessibility     | PASS — axe-core, ARIA grid, keyboard nav |
| 4    | Storybook         | PASS — 23 stories covering all variants  |
| 5    | CEM accuracy      | PASS — all exports match public API      |
| 6    | Bundle size       | PASS — component is well within budget   |
| 7    | Code review       | PASS — deep audit complete               |

---

## Previous Findings — Resolution Status

### P0 Findings (all resolved)

| #   | Finding                                        | Resolution                                                                              |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Missing `role="row"` in ARIA grid              | FIXED — `_renderWeekdayHeaders()` and `_renderDayGrid()` wrap rows in `role="row"` divs |
| 2   | `aria-pressed` used instead of `aria-selected` | FIXED — `aria-selected` on `role="gridcell"` elements                                   |

### P1 Findings (all resolved)

| #   | Finding                                        | Resolution                                                              |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `aria-current="date"` missing on today's cell  | FIXED — `aria-current=${isToday ? 'date' : nothing}` on day buttons     |
| 2   | No focus trap in calendar dialog               | FIXED — `_handleCalendarTab()` traps Tab/Shift+Tab within calendar      |
| 3   | `role="combobox"` on readonly input            | FIXED — removed; input has no role, uses `aria-haspopup="dialog"`       |
| 4   | Conflicting `role="alert"` + `aria-live`       | FIXED — error div uses `role="alert"` only, no `aria-live` override     |
| 5   | Prev/Next month buttons not disabled at bounds | FIXED — `_isPrevMonthDisabled()` / `_isNextMonthDisabled()` implemented |
| 6   | Zero keyboard navigation tests                 | FIXED — Arrow keys, PageUp/Down all tested                              |
| 7   | Axe tests never open the calendar              | FIXED — axe test with calendar open added                               |
| 8   | No `forced-colors` media query                 | FIXED — full `@media (forced-colors: active)` block in styles           |

### P2 Findings (resolved or accepted)

| #   | Finding                                         | Resolution                                                                    |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `tabindex: 0` invalid CSS property              | FIXED — removed from styles                                                   |
| 2   | `.calendar__day--other-month` dead CSS          | FIXED — removed from styles                                                   |
| 3   | `--hx-date-picker-calendar-shadow` undocumented | FIXED — documented in JSDoc `@cssprop` block                                  |
| 4   | `color-mix()` without `@supports` fallback      | ACCEPTED — browser support is universal in target environments                |
| 5   | No viewport overflow / flip logic               | ACCEPTED — standard positioning; flip logic deferred to future release        |
| 6   | `Math.random()` for ID generation               | FIXED — replaced with module-level integer counter                            |
| 7   | `key` attribute is a React-ism in Lit           | FIXED — removed; null cells render without key                                |
| 8   | Min/max tests date-dependent and brittle        | FIXED — tests use static ISO strings to anchor calendar view                  |
| 9   | No test: focus returns to trigger after close   | FIXED — test verifies `shadowRoot.activeElement === trigger` after Escape     |
| 10  | `live` directive unnecessary on readonly input  | FIXED — uses `.value=${displayValue}` directly                                |
| 11  | `name` on shadow DOM input confuses Drupal      | FIXED — `name` attribute removed from shadow input; form via ElementInternals |

---

## Component Capabilities Summary

### Properties (10)

`value`, `name`, `label`, `min`, `max`, `required`, `disabled`, `error`, `helpText`, `format`, `locale`

### Events (1)

`hx-change` — `{ value: string, date: Date | null }`

### CSS Parts (10)

`field`, `label`, `input-wrapper`, `input`, `trigger`, `calendar`, `month-nav`, `day`, `help-text`, `error`

### Slots (3)

`label`, `help`, `error`

### CSS Custom Properties (16)

All use `--hx-date-picker-*` prefix with semantic token fallbacks:
`bg`, `color`, `border-color`, `border-radius`, `font-family`, `focus-ring-color`, `error-color`, `label-color`, `trigger-color`, `calendar-bg`, `calendar-border-color`, `calendar-min-width`, `selected-bg`, `selected-color`, `today-color`, `calendar-shadow`

### Design Token Compliance

All colors, spacing, typography, border widths, focus rings, and transitions use design tokens. No hardcoded values in production styling. Full `@media (forced-colors: active)` support for Windows High Contrast Mode.

### Accessibility

- `role="dialog"` with `aria-modal="true"` on calendar popup
- `role="grid"` with `role="row"` / `role="gridcell"` / `role="columnheader"` ARIA grid structure
- `aria-selected` on gridcells for selected day
- `aria-current="date"` on today's button
- `aria-invalid`, `aria-required`, `aria-describedby` on input
- `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` on trigger
- `aria-disabled` on out-of-range days
- `aria-live="polite"` live region for month change announcements
- Full keyboard grid navigation (Arrow keys, Home, End, PageUp, PageDown, Enter, Space, Escape)
- Focus trap via Tab/Shift+Tab cycling within calendar
- Focus management: calendar open focuses selected/today/first day; close returns focus to trigger
- Required `*` marker is `aria-hidden="true"`
- `prefers-reduced-motion` respects animation preferences
- `forced-colors` media query for Windows High Contrast Mode
- axe-core verified in default, error, disabled, required, and calendar-open states

### Form Association

- `static formAssociated = true`
- `ElementInternals` for form value submission
- `checkValidity()`, `reportValidity()`, `formResetCallback()`, `formStateRestoreCallback()`
- Required validation via `valueMissing` validity flag

### TypeScript

- Strict mode, zero `any` types
- Exported type: `HelixDatePicker`
- Proper CEM JSDoc annotations for all properties, events, CSS parts, slots, and CSS custom properties

### Drupal Integration

- No `name` attribute on shadow DOM input (prevents Drupal form processor confusion)
- Label slot for Drupal Form API label injection
- Error slot for Drupal server-side validation messages
- Documented in Starlight docs with Twig example and Drupal behaviors code

---

## Test Coverage

| Category              | Tests                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Rendering             | 4 (shadow DOM, readonly input, field part, input part)                                        |
| Property: label       | 3 (renders text, empty hides label, required asterisk)                                        |
| Property: value       | 3 (empty default, ISO format display, programmatic update)                                    |
| Property: required    | 2 (aria-required, required marker)                                                            |
| Property: disabled    | 3 (input disabled, trigger disabled, host attribute)                                          |
| Property: error       | 3 (role="alert", aria-invalid, hides help text)                                               |
| Property: helpText    | 2 (renders text, hidden on error)                                                             |
| Property: name        | 1 (no name attr on shadow input)                                                              |
| Property: format      | 1 (placeholder text)                                                                          |
| CSS Parts             | 2 (input-wrapper, trigger)                                                                    |
| Calendar: Open/Close  | 6 (closed default, open on click, aria-expanded, toggle, aria-expanded false, role="dialog")  |
| Calendar: Day Select  | 5 (hx-change fires, ISO value, Date object, value updates, calendar closes)                   |
| Calendar: Min/Max     | 3 (days before min disabled, days after max disabled, disabled day no event)                  |
| Calendar: Navigation  | 4 (prev month, next month, month-nav part, live region)                                       |
| Calendar: Day Grid    | 3 (part="day", aria-label, aria-selected)                                                     |
| Keyboard: Calendar    | 3 (Escape closes, Enter selects, Space selects)                                               |
| Keyboard: Arrow Keys  | 4 (ArrowRight, ArrowLeft, ArrowDown, ArrowUp)                                                 |
| Keyboard: PageUp/Down | 2 (PageDown next month, PageUp prev month)                                                    |
| Navigation Boundaries | 2 (prev disabled at min, next disabled at max)                                                |
| Events                | 2 (bubbles, composed)                                                                         |
| Form                  | 5 (formAssociated, form null, form present, formReset, formStateRestore)                      |
| Validation            | 8 (checkValidity, valueMissing, validationMessage, reportValidity, formReset closes calendar) |
| Focus Management      | 1 (focus returns to trigger after Escape)                                                     |
| Disabled Interaction  | 1 (trigger click no-op when disabled)                                                         |
| ARIA Grid Structure   | 3 (role="row", gridcells in rows, aria-current="date")                                        |
| Accessibility (axe)   | 5 (default, error, disabled, required, calendar open)                                         |

**Total: 70+ tests**

---

## Storybook Coverage

| Story                 | Variant                                  |
| --------------------- | ---------------------------------------- |
| Default               | Basic with label                         |
| WithValue             | Pre-filled ISO value                     |
| Required              | Required field with asterisk             |
| WithHelpText          | Help text guidance                       |
| WithError             | Error state                              |
| Disabled              | Disabled state with value                |
| WithMinMax            | Min/max date constraints                 |
| DOBPicker             | Healthcare: Date of Birth (max=18y ago)  |
| AppointmentPicker     | Healthcare: Appointment scheduling       |
| WithLabelSlot         | Drupal Form API label slot               |
| WithHelpSlot          | Custom help slot with icon               |
| WithErrorSlot         | Drupal Form API error slot               |
| CSSCustomProperties   | All 16 CSS custom properties demo        |
| CSSParts              | All 10 CSS parts styled                  |
| InAForm               | Multi-picker form with submit/reset      |
| AllStates             | Default/required/error/disabled/value    |
| OpenCalendar          | Interaction: opens calendar              |
| SelectDate            | Interaction: selects a date              |
| DischargeDate         | Healthcare: Discharge date               |
| LocaleVariants        | en-US, en-GB, de-DE, fr-FR               |
| KeyboardNavigation    | Interaction: keyboard navigation         |
| FormDataParticipation | Interaction: ElementInternals form data  |
| DisabledNoInteraction | Interaction: disabled prevents all input |

**Total: 23 stories**
