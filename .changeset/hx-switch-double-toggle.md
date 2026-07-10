---
"@helixui/library": patch
---

fix `hx-switch` toggling twice when a Space keypress originates on the inner track button

`_handleHostKeyDown` guarded against re-entry with `e.target !== this`. Shadow retargeting sets `target` to the host for any event that crosses the shadow boundary, so that check could not distinguish a keypress on the host from one that started on the inner `<button>` — where the track's own `@keydown` handler had already toggled. Both handlers ran, the switch toggled twice, and `checked` landed back where it started while two `hx-change` events fired.

The guard now compares `e.composedPath()[0]` against the host, which is the true origin regardless of retargeting. Only one handler acts on any given keypress.

This also fixes the component under Firefox and WebKit. Firefox delivers a `composed: false` event dispatched inside a shadow root to the host listener, where Chromium does not, so on Firefox the host handler ran for events it should never have seen — Space double-toggled to no-op and Enter toggled when it should not have. The origin check makes the behavior identical across all three engines; the `hx-switch` suite now passes 98/98 on Chromium, Firefox, and WebKit.

No API, ARIA, or token changes. Keyboard activation remains Space (and Enter, via native button semantics) per the ARIA APG switch pattern.
