# Antagonistic Quality Audit — `hx-format-date`

Reviewed files:

- `hx-format-date.ts`
- `hx-format-date.styles.ts`
- `hx-format-date.stories.ts`
- `hx-format-date.test.ts`
- `index.ts`
- `DRUPAL.md`

Severity scale: **P0** = ship blocker | **P1** = serious defect | **P2** = improvement/minor

---

## Resolved Findings

All P0 and P1 findings from the initial audit have been resolved.

### T-1 (was P0) — `_formatAbsolute` / `_formatRelative` throw uncaught `RangeError` — RESOLVED

Both `_formatAbsolute` and `_formatRelative` now wrap `Intl.DateTimeFormat` and
`Intl.RelativeTimeFormat` construction in try/catch, returning `''` on failure.
The `_getDatetimeAttr` method also has a try/catch fallback to `date.toISOString()`.

### T-2 (was P0) — Storybook `render` fn passes empty strings — RESOLVED

The meta `render` function now uses `ifDefined()` for all optional format attributes,
correctly omitting attributes when the Storybook control value is `undefined`.

### T-3 (was P0) — No Drupal documentation — RESOLVED

`DRUPAL.md` added with server-side rendering tradeoffs, Twig examples, hybrid pattern,
and attribute naming guidance.

### T-4 (was P0) — axe-core test covers only one variant — RESOLVED

Three axe-core tests now cover: absolute mode, relative mode, and default no-args case.

### A-1 (was P1) — Relative time static with no documentation — RESOLVED

JSDoc on the `relative` property now explicitly documents that the relative string is
computed once at render time and consumers must re-set `date` on their own interval.

### A-2 (was P1) — UTC `datetime` vs. timezone-adjusted display mismatch — RESOLVED

`_getDatetimeAttr()` now computes a timezone-offset ISO string (e.g.,
`2024-09-20T05:00:00-04:00`) when `timeZone` is set, so AT and visual output agree.
Test confirms `-04:00` appears for `America/New_York` in June (EDT).

### A-3 (was P1) — `WcFormatDate` type alias — RESOLVED

Renamed to `HxFormatDate` to match project naming conventions.

### A-4 (was P1) — `timeZoneName` type incomplete — RESOLVED

Property now uses `Intl.DateTimeFormatOptions['timeZoneName']` directly, covering all
standard values including `shortOffset`, `longOffset`, `shortGeneric`, `longGeneric`.

### A-5 (was P1) — Zero test coverage for `timeZone` — RESOLVED

Three timezone tests added: shift verification (`10:30` for EDT), invalid timezone
graceful handling, and empty string fallback for invalid timezone formatted text.

### A-6 (was P1) — Relative time tests fragile; no `numeric="auto"` test — RESOLVED

Broader matchers used (`/ago/i`). `numeric="auto"` test added verifying "yesterday"
output for a date 25 hours in the past. `numeric="always"` test verifies numeric output.

### A-7 (was P1) — `play` functions absent — RESOLVED

Play functions added to `Default`, `MultipleLocales`, `RelativeTimeAuto`, and
`AppointmentTimestamp` stories with text content assertions.

### A-8 (was P1) — CSS `time {}` selector fragile — RESOLVED

Styles now use `[part='base']` selector instead of bare `time {}`.

### A-9 (was P1) — Intl objects created on every render — RESOLVED

Static `_dtfCache` and `_rtfCache` Maps memoize `Intl.DateTimeFormat` and
`Intl.RelativeTimeFormat` instances, keyed by `locale|options` fingerprint.

### A-10 (was P1) — No documentation file — RESOLVED

`DRUPAL.md` covers Drupal integration. Component JSDoc is comprehensive.

---

## Remaining P2 Items (deferred — non-blocking)

| ID  | Area          | Finding                                                        | Status   |
| --- | ------------- | -------------------------------------------------------------- | -------- |
| B-1 | TypeScript    | Empty-string sentinel for "current time" — design tradeoff     | Deferred |
| B-6 | CSS           | No `--hx-format-date-*` tokens — minimal text-output component | Deferred |
| B-7 | Performance   | No `shouldUpdate` guard — Lit handles this adequately          | Deferred |
| B-8 | Accessibility | No `aria-label` override — formatted text serves as label      | Deferred |

---

## Test Results

- **35 tests**, all passing
- **Test categories:** Rendering (4), datetime attribute (4), Date parsing (4), Locale formatting (3), Format options (7), Timezone (3), Relative time (5), Default formatting (2), Accessibility/axe-core (3)
- **axe-core:** 3 variants tested (absolute, relative, default)

## Storybook Coverage

- **19 stories** covering: Default, DateOnly, DateShort, DateNumeric, WithWeekday, TimeOnly, TimeWithSeconds, Time24Hour, TimeWithZone, MultipleLocales, RelativeTimeAuto, RelativeTimeAlways, RelativeTimeLocales, AppointmentTimestamp, LabResultAge, DischargeDate, InlineParagraph, InvalidDate, TimezoneComparison
- **4 play functions** with assertions (Default, MultipleLocales, RelativeTimeAuto, AppointmentTimestamp)

## Verification

- `npm run verify` — 0 errors (lint + format:check + type-check)
- `vitest run` — 35/35 tests pass

**P0 count: 0** — Component is **ready to ship**.
