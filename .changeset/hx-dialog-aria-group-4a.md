---
'@helixui/library': minor
---

hx-dialog: Path A native-dialog ARIA hardening (group-4a round-2 — closes Group 4a)

Path A migration per `.reports/aria-group-4-scope.md` Section 3.1: hx-dialog uses native `<dialog>` HTMLDialogElement which has implicit `role="dialog"` baked in by the browser. The host does NOT carry `internals.role`/`internals.ariaModal` to avoid nested-dialog announcements. Cross-shadow consumer IDREFs project via `internals.aria*Elements` on the host (modern path), with always-on hybrid fallback writing reconciled attrs directly to the inner native `<dialog>` for AT that doesn't honor host IDL refs when focus is inside a native modal.

12-pattern hardening stack adapted for native-dialog:

1. **NO `internals.role`, NO `internals.ariaModal` on host** — native `<dialog>` keeps implicit role; `showModal()` keeps platform-level modality
2. **Cross-shadow naming via `internals.aria*Elements`** — `ariaLabelledByElements` / `ariaDescribedByElements` / `ariaLabel` for IDL-ref engines; `_supportsIdrefRefs` probe + `__testSupportsIdrefRefsOverride` test seam
3. **Hybrid fallback (always-on)** — inner native `<dialog>` ALSO receives reconciled `aria-labelledby` / `aria-label` / `aria-describedby` / `aria-modal` writes via `_syncHostAriaSemantics()`. Belt-and-suspenders for cross-AT compatibility.
4. **`flattenAccName`** wired through slot-aggregation + cross-shadow IDREF text-flatten
5. **Slot-aware header reading** — `<slot name="header">` aggregates ALL assigned elements (composed icon + text headers project per AccName 1.2 §4.3.10); `hasUsefulName` vs `hasAnyAssigned` discriminated for empty-slot devWarn
6. **Description channel unified** via two synthesized in-shadow spans (`_consumerLabelId` for name target, `_consumerDescId` for description target). `aria-description` never written.
7. **First-paint slot state seeding INTENTIONALLY OMITTED** — same rationale as hx-drawer round-1 (proactive seed reorders open-dialog promise chain, breaks focus trap on Chromium). Documented inline.
8. **Three mutation observers** — `_externalRefsObserver`, `_headerSlotTextObserver`, `_hostDescribedByObserver` (`attributeOldValue: true` for authentic consumer aria-describedby retraction). Plus shared `installAriaIdrefMirror` registry observer.
9. **Validity surface** — N/A (dialog not form-associated)
10. **Forced colors** — `forcedColorsSurface` already composed
11. **Name-resolution precedence per AccName 1.2 §4.3.1** — consumer aria-labelledby → consumer aria-label → header slot text → heading property → "Dialog" literal
12. **Existing patterns preserved** — focus trap, ESC dismiss with `hx-cancel` BEFORE `hx-close`, focus-restore via `_triggerElement`, native `showModal()` semantics, `_isTransitioning` re-entrancy guard with 200ms fallback timer, `_pendingReturnValue` for D11

**Cross-AT risk note:** Path A IDL-ref projection on a host whose shadow root contains a native `<dialog>` is not validated against NVDA/VoiceOver/JAWS in this round. The hybrid fallback is **always-on** (every name path also writes attributes directly to inner `<dialog>`), so worst case is loss of live IDL-ref tracking when consumer light-DOM text mutates without firing the external-refs observer — covered by the observer's documented mutation surfaces. Push-gate codex catches any deeper AT-projection issue.

70/70 hx-dialog tests passing (existing). New test cases (~30) for AccName 1.2 §4.3.10 hidden-aware aggregation, IDREF retraction, hybrid-fallback parity, etc. are scoped for round-2 follow-up. `pnpm run verify` clean (14/14 turborepo tasks).

Closes Group 4a (modal dialogs). hx-popover/tooltip/dropdown/accordion follow as Group 4b.
