# Antagonistic Quality Audit — `hx-format-date` (T4-08)

Reviewed files:

- `hx-format-date.ts`
- `hx-format-date.styles.ts`
- `hx-format-date.stories.ts`
- `hx-format-date.test.ts`
- `index.ts`

Severity scale: **P0** = ship blocker | **P1** = serious defect | **P2** = improvement/minor

---

## 1. TypeScript

### P0 — `_formatAbsolute` has no try/catch around `Intl.DateTimeFormat` constructor

**File:** `hx-format-date.ts:209`

`new Intl.DateTimeFormat(locale, options).format(date)` throws an uncaught `RangeError`
when `timeZone` is an invalid IANA identifier (e.g., `time-zone="Foo/Bar"`).
The `_formatRelative` method is equally unprotected at `hx-format-date.ts:176`.

An invalid `timeZone` from HTML attribute (consumer typo, CMS misconfiguration, Drupal field error)
silently kills the render cycle. In a healthcare UI this may blank out an appointment time with no
user-visible error.

**Fix required:** Wrap both Intl formatter constructions in try/catch and return `''` or a safe
fallback string on failure.

---

### P1 — `timeZoneName` type is incomplete vs. the Intl spec

**File:** `hx-format-date.ts:93`

The property is typed `'short' | 'long' | undefined`. Modern `Intl.DateTimeFormatOptions.timeZoneName`
also accepts `'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric'` (supported in all
evergreen browsers and Node 18+). The constrained type will cause a TypeScript error for consumers
attempting to use these values through property binding.

**Fix required:** Expand the union to match the full `Intl.DateTimeFormatOptions['timeZoneName']`
type or import it directly from `lib.es5.d.ts`.

---

### P1 — `WcFormatDate` type alias doesn't match project naming conventions

**File:** `hx-format-date.ts:223`

All other components in the library use the `Hx` prefix for exported types (e.g., `HxButton`,
`HxCard`). `WcFormatDate` uses the legacy `Wc` prefix, creating inconsistency in consumer
TypeScript and API documentation.

**Fix required:** Rename to `HxFormatDate`.

---

### P2 — `date` property default value creates a silent "current time" footgun

**File:** `hx-format-date.ts:29`

`date: string | number | Date = ''` uses an empty string as the sentinel for "current time."
This is documented in the JSDoc, but the type signature itself gives no indication that `''` is
special. A consumer passing an empty string as an error/reset value (e.g., clearing a bound
property) will inadvertently display the current time rather than an empty element.

A named sentinel like `undefined` or a boolean `useCurrentTime` property would be cleaner. This
is a design issue — not actionable without a breaking change, but worth documenting.

---

## 2. Accessibility

### P0 — axe-core test covers only one variant; relative mode is never tested by axe

**File:** `hx-format-date.test.ts:254–262`

The single axe test uses `month="long" year="numeric" day="numeric"` only. It does not test:

- `relative=true` (different DOM output — the text becomes "2 hours ago" inside `<time>`)
- The default no-args case (empty `date`, current time)
- A timezone-adjusted time

If the `<time datetime>` attribute is ever wrong (e.g., empty string, garbled value) in these
modes, it would fail axe's `valid-lang` or `time-datetime` rules without being caught.

**Fix required:** Add at minimum an axe test for `relative=true` and for the no-args default case.

---

### P1 — Relative time is static; no auto-update mechanism and no documented limitation

**File:** `hx-format-date.ts:161–184`

When `relative=true`, the component computes the relative string once on render and never
refreshes. An "hx-format-date" showing "2 minutes ago" will still say "2 minutes ago" 30 minutes
later unless the parent re-renders and passes a different `date`.

For screen reader users this is particularly problematic: the `<time>` text becomes factually
incorrect with no change event, no aria-live update, and no visual or programmatic signal.

In healthcare, stale relative timestamps on lab results or medication administration records carry
real patient safety implications.

**Fix required:** Either:
(a) Add a `live` boolean property that triggers a `setInterval` re-render and an `aria-live` region, or
(b) Document clearly in JSDoc, Storybook, and README that `relative=true` output is point-in-time
and consumers must manage refresh (e.g., `Date.now()` on a parent interval).

---

### P1 — `<time datetime>` is always UTC ISO; timezone-adjusted display creates mismatch

**File:** `hx-format-date.ts:216`

`date.toISOString()` always produces UTC (e.g., `2024-09-20T09:00:00.000Z`). When
`time-zone="America/New_York"` is set, the rendered human-readable text shows Eastern time
(e.g., "5:00 AM EDT"), but the machine-readable `datetime` attribute shows UTC.

This is technically valid per the HTML spec (UTC is an acceptable datetime value), but
assistive technology that reads the `datetime` attribute directly will announce a different
time than what is displayed — a confusing, potentially dangerous mismatch for appointment
scheduling in healthcare.

**Fix required:** When `timeZone` is set, consider computing a timezone-offset ISO string
(e.g., `2024-09-20T05:00:00-04:00`) for the `datetime` attribute so AT and visual output agree.

---

### P2 — No `aria-label` override mechanism

There is no way for consumers to supply a custom accessible label for the `<time>` element
(e.g., `aria-label="Appointment on Friday, September 20, 2024 at 9:00 AM Eastern"`).
The formatted text IS the accessible label, which is usually fine, but in contexts where the
visual display is terse (e.g., `month="short" day="numeric"`) the accessible label may be
insufficient.

A `display-as` property or slot for the accessible label would close this gap.

---

## 3. Tests

### P1 — Zero test coverage for `timeZone` attribute

**File:** `hx-format-date.test.ts`

The `timeZone` property is a key differentiator for healthcare appointment scheduling. There
are no tests verifying that:

- `time-zone="America/New_York"` shifts the displayed time correctly
- An invalid `time-zone` value is handled gracefully (see P0 above — it currently throws)
- `time-zone-name="short"` or `"long"` appears in the rendered text

This means the P0 RangeError crash path is entirely uncovered by automated tests.

---

### P1 — Relative time tests are fragile to locale and platform

**File:** `hx-format-date.test.ts:196–198`

`expect(time.textContent).toMatch(/hours? ago/i)` hard-codes English phrasing. The test sets
`lang="en-US"` so this is intentional, but if the Playwright browser is launched with a
non-en-US system locale and `navigator.language` leaks through the shadow DOM (unlikely but
possible if `_getLocale` falls back), the assertion fails.

More critically, `toMatch(/hours? ago/i)` will fail for `numeric="always"` mode which outputs
"2 hours ago" (same), but it also means if `Intl` produces "2 hr. ago" in certain environments
the test fails. Use `toContain('ago')` or a broader matcher.

---

### P1 — No test for `numeric="auto"` producing natural language

**File:** `hx-format-date.test.ts`

The test at line 210 verifies `numeric="always"` produces "1 day ago". There is no test that
`numeric="auto"` produces "yesterday" for a date 24 hours ago. This is the primary behavioral
difference between the two modes and should be explicitly tested.

---

### P2 — No test for `second` attribute

**File:** `hx-format-date.test.ts`

The `second` property is implemented and exposed in Storybook but has no corresponding test.
A test verifying seconds appear in the output when `second="2-digit"` is set is missing.

---

### P2 — No test for `timeZoneName` attribute

**File:** `hx-format-date.test.ts`

`time-zone-name="short"` and `time-zone-name="long"` are untested. A basic test confirming the
timezone abbreviation or name appears in the output is missing.

---

### P2 — Test count vs. coverage claim

The test suite has 26 cases, which is solid breadth. However, given the untested `timeZone`,
`second`, `timeZoneName` paths and the unprotected `RangeError` code path, the actual branch
coverage is likely below the 80% threshold required by project standards. No coverage report
is included in the PR. Coverage must be measured and confirmed.

---

## 4. Storybook

### P0 — `render` function passes empty strings for undefined format options

**File:** `hx-format-date.stories.ts:158–175`

The meta `render` function outputs:

```ts
month=${args.month ?? ''}
year=${args.year ?? ''}
day=${args.day ?? ''}
```

When `args.month` is `undefined` (the "unset" state in Storybook controls), the attribute is set
to `''`. The component's `month` property receives `""` (not `undefined`). In `_formatAbsolute`:

```ts
if (this.month !== undefined) options.month = this.month;
```

`""` is not `undefined`, so `options.month = ""` is passed to `Intl.DateTimeFormat`. This throws
`RangeError: Value "" out of range for Intl.DateTimeFormat options property month`. The story
crashes in the Storybook canvas whenever a user clears a format control back to "undefined."

This is a P0 because it breaks the interactive Storybook demo for all format option controls.

**Fix required:** Use `month=${args.month}` (no fallback) or add conditional attribute binding
so the attribute is omitted when the value is undefined.

---

### P1 — `play` functions on only one story (`Default`)

**File:** `hx-format-date.stories.ts:194–201`

18 of 19 stories have no `play` function. Storybook interaction tests are the primary automated
verification for story correctness. The locale stories, relative time stories, and timezone story
have no assertions — they are purely visual and not CI-gated.

At minimum, `MultipleLocales`, `RelativeTimeAuto`, and `AppointmentTimestamp` should assert
expected locale-specific text appears.

---

### P2 — No "Invalid date" story

There is no story demonstrating graceful handling of `date="not-a-date"` or `date=""`. The
component has a fallback to current time, but this behaviour is invisible in Storybook. A story
would self-document the fallback contract.

---

### P2 — No side-by-side timezone comparison story

A story showing the same UTC moment displayed in multiple timezones (UTC, America/New_York,
Asia/Tokyo) would make the `timeZone` capability obvious and testable visually.

---

## 5. CSS

### P1 — `time {}` rule uses element selector instead of CSS part selector

**File:** `hx-format-date.styles.ts:8–12`

```css
time {
  display: inline;
  font: inherit;
  color: inherit;
}
```

The `time {}` selector is fragile: if the internal template structure changes (e.g., wrapping
the `<time>` in a `<span>` for live-region support), this rule silently stops applying. It also
duplicates the structural element selector with the CSS part selector (`[part="base"]`), making
the intent ambiguous.

**Fix required:** Replace with `[part="base"] { ... }` or `time[part] { ... }` for clarity and
resilience.

---

### P2 — No component-level `--hx-*` tokens defined or documented

**File:** `hx-format-date.styles.ts`

While the audit criteria notes "minimal — this is text output", the complete absence of
`--hx-format-date-*` tokens means there is no CSS API surface for consumers to style the
component without using `::part(base)`. For a healthcare design system, even a
`--hx-format-date-color` or `--hx-format-date-font-variant-numeric` would be useful for
compact appointment tables.

This is a design omission, not a bug. It should be a documented decision in a comment or the
component README.

---

## 6. Performance

### P1 — `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` instances created on every render

**File:** `hx-format-date.ts:176`, `hx-format-date.ts:209`

Both `_formatAbsolute` and `_formatRelative` construct a new `Intl` formatter object on every
call. `Intl` object construction is expensive, especially in Safari where it involves full locale
data loading. In a patient list view with 50+ `<hx-format-date>` elements, initial render will
create 50+ Intl objects.

**Fix required:** Memoize the formatter. Cache based on `[locale, options-hash]` or use a
`WeakMap`/`Map` keyed on the options fingerprint.

---

### P2 — No `shouldUpdate` guard for re-renders

When none of the component's properties have changed, Lit still calls `render()` if a parent
re-renders. For a pure date formatter that is read-only, adding:

```ts
override shouldUpdate(changed: Map<string, unknown>): boolean {
  return changed.size > 0;
}
```

would prevent unnecessary Intl construction in list-heavy UIs. This is a low-impact optimization
but matters when 50–200 date cells share a parent that updates frequently (e.g., a sortable table).

---

### P2 — Bundle size not measured

No bundle size metric is included in the PR. The requirement is <5KB min+gz per component. Given
that `hx-format-date` is text-only with no third-party dependencies, it almost certainly passes,
but without a measurement this cannot be confirmed.

---

## 7. Drupal Integration

### P0 — No Drupal documentation exists

**Requirement from feature spec:** "Drupal — Twig-renderable (most date formatting done
server-side, document the tradeoff)."

There is no Drupal documentation anywhere in the component directory — no `DRUPAL.md`, no
README section, no Twig example, no JSDoc note. This is an explicit deliverable for T4-08 and
it is entirely absent.

**Fix required:** Add a `DRUPAL.md` or README section covering at minimum:

1. **Server-side rendering tradeoff:** Drupal typically formats dates via `format_date()` /
   `\Drupal::service('date.formatter')->format()` or Twig's `|format_date`. Using
   `<hx-format-date>` for client-side formatting means the date appears formatted only after
   JavaScript hydrates — prior to hydration, the element is empty. This is a FOUC/SEO tradeoff.

2. **Recommended pattern (hybrid):** Pass an ISO 8601 string from Drupal field value:

   ```twig
   <hx-format-date
     date="{{ node.field_appointment_date.value }}"
     lang="{{ language.id }}"
     month="long"
     year="numeric"
     day="numeric"
   ></hx-format-date>
   ```

3. **Alternative (pure server-side):** Use Drupal's `format_date` and wrap the result in a
   static `<time>` element if client-side Intl formatting is not required.

4. **Attribute naming with Twig:** Hyphenated attributes (`time-zone`, `time-zone-name`,
   `hour-format`) work natively in Twig without escaping.

---

### P1 — No README or documentation file for the component at all

There is no `README.md` for `hx-format-date`. While other components in the library may also
lack READMEs, the feature spec explicitly required Drupal documentation as a deliverable. The
absence of any documentation file means the entire documentation requirement is unmet.

---

## Summary

| ID   | Severity | Area          | Finding                                                                                 |
| ---- | -------- | ------------- | --------------------------------------------------------------------------------------- |
| T-1  | **P0**   | TypeScript    | `_formatAbsolute` / `_formatRelative` throw uncaught `RangeError` on invalid `timeZone` |
| T-2  | **P0**   | Storybook     | `render` fn passes `month=""` etc., crashing `Intl.DateTimeFormat`                      |
| T-3  | **P0**   | Drupal        | No Drupal documentation — explicit feature spec deliverable missing                     |
| T-4  | **P0**   | Accessibility | axe-core test covers only one variant; relative mode untested by axe                    |
| A-1  | **P1**   | Accessibility | Relative time is static; stale output for AT with no documented limitation              |
| A-2  | **P1**   | Accessibility | UTC `datetime` vs. timezone-adjusted display creates AT mismatch                        |
| A-3  | **P1**   | TypeScript    | `WcFormatDate` alias breaks naming convention; should be `HxFormatDate`                 |
| A-4  | **P1**   | TypeScript    | `timeZoneName` union type incomplete vs. Intl spec                                      |
| A-5  | **P1**   | Tests         | Zero test coverage for `timeZone` attribute (including RangeError path)                 |
| A-6  | **P1**   | Tests         | Relative time locale tests fragile; missing `numeric="auto"` natural language test      |
| A-7  | **P1**   | Storybook     | `play` functions absent on 18 of 19 stories                                             |
| A-8  | **P1**   | CSS           | `time {}` element selector fragile; should use `[part="base"]`                          |
| A-9  | **P1**   | Performance   | `Intl` objects created on every render; not memoized                                    |
| A-10 | **P1**   | Drupal        | No README or documentation file exists for the component                                |
| B-1  | **P2**   | TypeScript    | Empty-string sentinel for "current time" creates silent footgun                         |
| B-2  | **P2**   | Tests         | `second` and `timeZoneName` attributes untested                                         |
| B-3  | **P2**   | Tests         | Coverage not measured; likely below 80% threshold                                       |
| B-4  | **P2**   | Storybook     | No "invalid date" story                                                                 |
| B-5  | **P2**   | Storybook     | No side-by-side timezone comparison story                                               |
| B-6  | **P2**   | CSS           | No `--hx-format-date-*` tokens; omission not documented                                 |
| B-7  | **P2**   | Performance   | No `shouldUpdate` guard; no bundle size measurement                                     |
| B-8  | **P2**   | Accessibility | No `aria-label` override mechanism                                                      |

**P0 count: 4** — Component is **not ready to ship** until all P0 findings are resolved.
