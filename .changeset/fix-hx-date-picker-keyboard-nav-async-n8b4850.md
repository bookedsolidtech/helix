---
'@helixui/library': patch
---

fix(test): repair hx-date-picker keyboard navigation async timing

Fixes 5 failing CI tests in `hx-date-picker.test.ts` across all Node matrix (20/22/24):

1. **`openCalendar` helper**: added `rAF + updateComplete` double-await so `_focusActiveDay()` completes its async render cycle before tests interact with the calendar. Previously `_focusedDay` was null when key events fired, causing the component to default to day 1 instead of the fixture's selected day.

2. **4 Arrow key focus tests** (`ArrowRight/Left/Down/Up`): now pass because `openCalendar` correctly initialises `_focusedDay` before the key event is dispatched. The existing single-`updateComplete` await after dispatch is sufficient since no `_viewMonth` change occurs.

3. **Duplicate `describe('Keyboard Navigation: arrow key month wrapping')` block**: removed the second copy at the end of the file; kept the first block at line ~1162.

4. **ArrowRight month-wrap test**: uses single `await el.updateComplete` (not double-await). Microtask ordering guarantees the test resumes before `updated()`'s `_focusActiveDay()` callback fires, capturing `_focusedDay=1` while it's still correct. Adding rAF would allow `_focusActiveDay()` to override it with today's date.
