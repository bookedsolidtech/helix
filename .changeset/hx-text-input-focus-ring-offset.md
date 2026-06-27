---
'@helixui/library': patch
---

honor the component-specific `--hx-text-input-focus-ring-offset` hook on the `hx-text-input` focus indicator (default flush)

The component resolved a private `--_text-input-focus-ring-offset` token but the focus ring was
painted as a single `box-shadow` that never referenced it, so the documented offset hook was dead.
The three focus `box-shadow` declarations (normal `:host([focused])` / `:focus-within`, and the
invalid `:focus-within`) now use a transparent-spacer dual-shadow that opens a gap when the offset
is non-zero:

```css
box-shadow:
  0 0 0 var(--_text-input-focus-ring-offset) transparent,
  0 0 0 calc(var(--_text-input-focus-ring-offset) + var(--_text-input-focus-ring-width)) <color>;
```

The private offset now defaults to `0px` (flush), so at the default the ring evaluates to
`0 0 0 0 transparent, 0 0 0 2px <color>` — a zero-size invisible spacer plus the existing 2px ring —
i.e. byte-identical rendering to today, with no AAA focus-appearance (2.4.13) regression. Consumers
opt into a gap via `--hx-text-input-focus-ring-offset`.

The global `--hx-focus-ring-offset` remains the library-wide outline-offset token (consumed via
`outline-offset` on outline-based focus rings such as `hx-button`) and is intentionally not applied
to this component's box-shadow ring — chaining it here would push every consumer's flush ring out by
its 2px default. Ring color and width plumbing are unchanged.
