---
'@helixui/library': patch
---

fix(storybook): fix story findings for hx-slider (#813) and hx-tag (#823)

hx-slider: add Page Up/Page Down keyboard steps to KeyboardNavigation play function (P2-10); add OutOfRangeValue story exposing native range clamping behaviour as a regression baseline for the missing property-level value clamp (P2-11).

hx-tag: clarify hx-size vs size attribute/property naming in argType description (P2-05); add keyboard-driven play function to RemovableInteractive that tabs to the remove button, activates via Enter, and asserts tag removal from DOM (P2-08).
