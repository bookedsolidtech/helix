# HX Format Date

Formats and displays a date/time value using the browser's `Intl.DateTimeFormat`
(or `Intl.RelativeTimeFormat` when `relative` is set). Renders as an inline
`<time>` element — machine-readable via `datetime`, human-readable via formatted text.

No external dependencies. Uses native Intl APIs only.

## Usage

```twig
{% include 'helix:hx-format-date' with {
  date: '',
  lang: '',
  month: 'undefined',
  year: 'undefined',
  day: 'undefined',
  weekday: 'undefined',
  hour: 'undefined',
  minute: 'undefined',
  second: 'undefined',
  timeZoneName: 'undefined',
  timeZone: 'undefined',
  hourFormat: 'auto',
  numeric: 'auto',
  relative: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| date | object |  | The date/time value to format. Accepts an ISO string, a Unix timestamp (ms), or
a `Date` object. Defaults to the current date/time when empty. |
| lang | string |  | BCP 47 locale tag used for formatting (e.g. `"en-US"`, `"de"`, `"ja"`).
Defaults to `document.documentElement.lang`, then `navigator.language`. |
| month | object | undefined | Month display format. |
| year | object | undefined | Year display format. |
| day | object | undefined | Day display format. |
| weekday | object | undefined | Weekday display format. |
| hour | object | undefined | Hour display format. |
| minute | object | undefined | Minute display format. |
| second | object | undefined | Second display format. |
| timeZoneName | object | undefined | Time zone name display format. Accepts all values supported by
`Intl.DateTimeFormatOptions.timeZoneName` including `'short'`, `'long'`,
`'shortOffset'`, `'longOffset'`, `'shortGeneric'`, and `'longGeneric'`. |
| timeZone | object | undefined | IANA time zone identifier (e.g. `"America/New_York"`, `"UTC"`). |
| hourFormat | object | auto | Whether to use 12-hour or 24-hour clock. `"auto"` defers to locale default. |
| numeric | object | auto | Controls whether `Intl.RelativeTimeFormat` always shows numeric output
(`"always"`) or uses natural language when possible (`"auto"`, e.g. "yesterday").
Only used when `relative` is true. |
| relative | boolean | false | When true, displays a relative time string such as "2 hours ago" or "in 3 days"
using `Intl.RelativeTimeFormat`.

**Important:** The relative time string is computed once at render time and does
not auto-update. If the displayed text must stay current (e.g. a live "X minutes
ago" counter), the consuming component must re-set the `date` property on its own
interval to trigger a re-render. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner `<time>` element. |
