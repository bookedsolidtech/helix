---
'@helixui/library': patch
---

`hx-field`: harden `aria-label` ownership across the shadow-DOM bridge.

When `hx-field` writes `aria-label` to a slotted form control, it now stamps a `data-hx-owns-label="true"` marker and snapshots the written value. Consumers can:

- **Suspend** all ARIA bridging by setting `data-aria-managed` on the control. While present, `hx-field` skips every `aria-*` mutation; removing `data-aria-managed` may resume host ownership if the live value still matches the snapshot.
- **Release** ownership permanently by overwriting `aria-label` to any different value. The mismatch strips the marker and clears the snapshot.

Removed the unused IDREF MutationObserver (no IDREF surface exists on `hx-field`). Class-level JSDoc rewritten to clearly distinguish suspend vs release semantics, including the snapshot limitation (an exact-same-value rewrite is invisible to release detection — write a different value or remove the marker manually to take ownership in that case).
