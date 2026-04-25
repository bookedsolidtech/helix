---
'@helixui/tokens': patch
---

Fix WCAG AA contrast failures across `--hx-color-text-on-{role}` and the muted/secondary body-text hierarchy surfaced by the new contrast regression matrix.

The 3.2.0 precision-cool palette refresh (commit 2) silently dropped six pairs below the WCAG AA 4.5:1 floor for body text. The new contrast regression test in `packages/hx-tokens/src/__tests__/contrast.test.ts` is the gate that caught these — exactly the bug class it was built to prevent.

**Light-mode `text.on-{role}` rebindings (neutral-0 → neutral-900):**

- `text.on-primary` on `primary-500` (#429797): 3.44:1 → 5.20:1 (AA pass)
- `text.on-secondary` on `secondary-500` (#40969F): 3.45:1 → 5.18:1 (AA pass)
- `text.on-error` on `error-500` (#E5493E): 3.92:1 → 4.56:1 (AA pass)
- `text.on-info` on `info-500` (#0C8BEB): 3.55:1 → 5.03:1 (AA pass)

These join `on-success` (fixed in commit 1) and `on-warning` in the dark-text-on-brand-surface pattern. The four precision-cool brand-500 hues (primary/secondary/error/info) are too light to carry white text at AA — dark text is the only AA-safe option without darkening the brand ramps.

**Light-mode body-text hierarchy adjustment (caught unexpectedly by the matrix):**

- `text.muted`: `neutral-500` (#66787B) → `neutral-600` (#4A5362). Muted on `surface.raised` (#F5F8F3) was 4.32:1 — pre-existing AA fail from commit 2's neutral ramp. Now 7.36:1.
- `text.secondary`: `neutral-600` → `neutral-700` (#313E4B). Bumped to preserve the primary > strong > secondary > muted hierarchy now that muted occupies the slot secondary used to live in. neutral-700 on every light surface is 9.01:1 or better (AAA).

**Dark-mode `text.disabled` rebinding (`neutral-600` → `neutral-500`):**

`neutral-600` (#4A5362) on dark `surface.default` (#0D1825) = 2.30:1, fails the 3:1 UI floor. `neutral-500` (#66787B) = 3.86:1, AA UI pass. Disabled is WCAG-exempt under 1.4.3 but we still gate at 3:1 so it stays visibly distinct rather than invisible.

No dark or high-contrast `on-{role}` changes — those modes already passed.

Components painting text on primary/secondary/error/info surfaces (badges, buttons, alerts, toasts, status pills) will flip from white text to dark text in light mode. Every prior render at the AA failure was a defect.
