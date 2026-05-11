---
'@helixui/tokens': minor
'@helixui/library': patch
---

bump text.muted and success-text to AAA-strict (1.4.6) ratios

The story-audit harness flagged hundreds of contrast failures that
trace to two semantic text tokens being tuned to AA, not AAA-strict.
The 7:1 strict floor for body-sized text (WCAG 1.4.6 AAA) is the
HELiX cert authority — the AA tunings let the harness flag every
docs / MDX prose body that paints muted text on a sunken surface,
and every success callout that paints success text on a tinted
success-50 surface.

`text.muted` shifts from `neutral-600` (#4A5362) to `neutral-700`
(#313E4B). The prior value cleared 7.76:1 on white, 7.25:1 on
surface.raised, but only 6.63:1 on surface.sunken — sub-7:1 across
every audit story that paints muted text on the sunken background
chrome. The new value clears 10.93 / 10.20 / 9.34 across all three
surfaces. The shift collapses muted with secondary (also
neutral-700); the original neutral-600 / neutral-700 visual delta
was already imperceptible in body copy, and the AAA mandate
permits this collapse. text.muted retains its semantic identity
for italics / smaller-size affordances and remains brand-overridable.

`success-text` shifts from `success-700` (#146831) to `success-800`
(#0B4D23). The prior value cleared 6.88:1 on white but only 6.35:1
on success-50 and 5.85:1 on success-100 — sub-7:1 on every tinted
success callout. The new value clears 10.00 / 9.23 / 8.50 across
all three surfaces. Sister token `error-text` is already at
error-700 (7.96:1 on white) per the 3.8.0 AAA recert; this commit
brings the success ramp into matching AAA-strict territory.

The dark-mode override for text.muted (neutral-400 = 6.27:1 on
dark surface.default) is unchanged — dark-mode contrast was
already AAA-tuned via the 3.2.0 dark.color.text.muted override.
