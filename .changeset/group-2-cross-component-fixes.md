---
'@helixui/library': patch
---

Group 2 cross-component fixes (P2): tabindex ownership latch + AccName slot flatten

Two cross-component findings surfaced via the codex push-gate during Group 3 review (compares vs origin/main, so latent Group 2 issues were caught):

**F1 — Tabindex ownership latch never releases** (hx-checkbox, hx-switch, hx-toggle-button)

When a consumer renders `<hx-checkbox tabindex="-1">` (common roving-tabindex pattern) and later removes that attribute, the `_internalTabindexManaged` latch stayed `false` forever. Host never reclaimed its default tabindex; on the modern path the inner input remained `tabindex=-1`, leaving the control unreachable by Tab and breaking `reportValidity()` focus recovery.

Fixed via host MutationObserver on the `tabindex` attribute with `attributeOldValue: true`. On set → release ownership; on remove → reclaim and re-apply default. Self-write counter `_pendingOwnTabindexMutations` distinguishes component writes from consumer mutations (microtask-deferred MutationObserver records require a counter, not a boolean reentrancy flag).

**F2 — Slotted toggle label flatten leaks aria-hidden / hidden descendants** (hx-toggle-button)

`_captureSlotLabelText` concatenated raw `textContent` from every assigned node, pulling in text from `aria-hidden="true"` and `[hidden]` descendants. Rich labels like `<svg aria-hidden="true"><title>icon</title></svg>Save` were announced as "icon Save" instead of "Save".

Fixed by routing element-node flattening through `flattenAccName` (W3C AccName 1.2 §4.3.10 TreeWalker that rejects aria-hidden + [hidden] subtrees including roots). Helper extracted from `hx-time-picker.ts` to a shared utility at `packages/hx-library/src/utils/aria-flatten.ts` — single source of truth for AccName flattening across all components.

Test coverage: 6 new tests (2 per component × 3 for tabindex + 2 for slot flatten). 577/577 affected-component tests passing. `pnpm run verify` clean.
