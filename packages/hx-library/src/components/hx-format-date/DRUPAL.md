# `hx-format-date` — Drupal Integration Guide

## Overview

`hx-format-date` renders dates client-side using the browser's `Intl` APIs.
In a Drupal context, date values typically come from field values or computed tokens
on the server side.

---

## Server-Side Rendering Tradeoff

**The core tradeoff:** `hx-format-date` formats dates after JavaScript hydrates in the
browser. Before hydration, the element renders as an empty `<hx-format-date>` tag with
no visible content. This means:

- **FOUC (Flash of Unstyled Content):** Appointment times or lab result dates will be
  blank on initial page load, then appear after JS executes.
- **SEO:** Search engines may not index the formatted date text since it is generated
  client-side. Dates critical to SEO (e.g. article publish dates) should use server-side
  rendering instead.

Use `hx-format-date` when:

- The date display is non-critical to SEO
- You need client-side locale detection (`navigator.language`) to auto-format for
  the user's browser locale
- You need relative time display ("2 hours ago") that reflects the browser's current time

Use Drupal's `format_date` / `\Drupal::service('date.formatter')->format()` when:

- SEO matters for the date content
- You need the formatted date to appear without a JS dependency
- Server-side timezone handling is preferred

---

## Recommended Pattern (Hybrid)

Pass an ISO 8601 string from a Drupal date field, and let `hx-format-date` handle
locale-aware rendering in the browser:

```twig
<hx-format-date
  date="{{ node.field_appointment_date.value }}"
  lang="{{ language.id }}"
  month="long"
  year="numeric"
  day="numeric"
  hour="numeric"
  minute="2-digit"
  time-zone="America/New_York"
  time-zone-name="short"
></hx-format-date>
```

Drupal's date field `.value` property outputs an ISO 8601 string (e.g.
`2024-09-20T09:00:00`). Pass it directly to the `date` attribute.

For timezone: Drupal stores dates in UTC internally. Pass the site or user timezone
via `time-zone` to display the correct local time.

---

## Alternative: Pure Server-Side (Static `<time>`)

If client-side Intl formatting is not required, format the date in Twig and wrap it
in a static `<time>` element for semantic HTML:

```twig
{% set formatted = node.field_appointment_date.value|date('F j, Y g:i A') %}
<time datetime="{{ node.field_appointment_date.value }}">{{ formatted }}</time>
```

This approach requires no JavaScript and has no hydration delay.

---

## Relative Time in Drupal

Relative time ("2 hours ago") is best handled with `hx-format-date` since the
relative offset must be computed against the browser's current time — something
Drupal cannot know at render time:

```twig
<hx-format-date
  date="{{ node.field_created.value }}"
  lang="{{ language.id }}"
  relative
></hx-format-date>
```

**Important:** The relative string is computed once when the component renders. It
does not auto-update. If a live "X minutes ago" counter is required, the parent
must periodically re-set the `date` attribute (e.g. via a Drupal Behavior using
`setInterval`).

---

## Attribute Naming in Twig

All hyphenated attributes work natively in Twig without escaping:

| Component attribute | Twig example                   |
| ------------------- | ------------------------------ |
| `time-zone`         | `time-zone="America/New_York"` |
| `time-zone-name`    | `time-zone-name="short"`       |
| `hour-format`       | `hour-format="24"`             |

---

## Full Drupal Behavior Example

For a live relative time counter that updates every minute:

```js
// mytheme/js/hx-format-date-live.js
(function (Drupal) {
  Drupal.behaviors.hxFormatDateLive = {
    attach(context) {
      context.querySelectorAll('hx-format-date[relative][data-live]').forEach((el) => {
        setInterval(() => {
          // Re-assign the same date to trigger a re-render
          const current = el.getAttribute('date');
          el.setAttribute('date', current ?? '');
        }, 60000);
      });
    },
  };
})(Drupal);
```

```twig
<hx-format-date
  date="{{ node.field_lab_result_date.value }}"
  lang="{{ language.id }}"
  relative
  data-live
></hx-format-date>
```
