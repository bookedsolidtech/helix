---
'@helixui/library': minor
---

hx-drawer: host-canonical modal dialog ARIA hardening (group-4a round-1)

Path A migration per `.reports/aria-group-4-scope.md` Section 3.2: drawer's inner `<div role="dialog" aria-modal="true">` migrates to host-canonical via `internals.role = 'dialog'` + `internals.ariaModal = 'true'`. Inner div drops role + aria-modal + aria-* naming. Host carries the announced dialog surface.

12-pattern hardening stack (modal-dialog adaptation of the hx-combobox canonical):

1. **Host-canonical role + modal flag** — `internals.role = 'dialog'`, `internals.ariaModal = 'true'` seeded in `connectedCallback`
2. **Cross-shadow naming (belt-and-suspenders)** — `internals.ariaLabelledByElements` / `ariaDescribedByElements` for IDL-ref engines; `internals.ariaLabel` always carries flattened-text fallback; legacy fallback writes `aria-label`/`aria-labelledby` to inner overlay
3. **`flattenAccName` shared util** — slot-label aggregation + external IDREF flatten per AccName 1.2 §4.3.10
4. **Multi-node slot-label aggregation** — `_slottedLabelEls: Element[]`; aria-hidden/[hidden] filtered from IDL refs
5. **Description channel unified** — synthesized hidden `<span id="${_id}-consumer-desc">` mirrors consumer-resolved description text; chained via inner overlay's `aria-describedby`. Never write `aria-description`
6. **Validity surface** — N/A (drawer not form-associated)
7. **First-paint slot state seeding** — intentionally NOT seeded from firstUpdated due to focus-trap timing interaction (see below). Slotchange microtask handles state one tick later
8. **3 mutation observers** — external IDREF targets + label-slot text + dedicated `aria-describedby` retraction observer with `attributeOldValue: true`
9. **Help/error effective text** — N/A (drawer has no help/error slots)
10. **Forced colors** — `forcedColorsSurface` already composed; host `display: contents` so `:host(:focus-visible)` is moot (focus is on inner panel)
11. **Name-resolution precedence per W3C AccName 1.2 §4.3.1** — consumer aria-labelledby → host aria-label → slotted label → label property → literal "Drawer"
12. **Focus trap, ESC dismiss, focus-restore, inert-outside-content** — preserved from prior implementation

**Pre-flight cross-AT validation:** Path A is sound for hx-drawer because inner is `<div>` (no native `<dialog>` implicit-role conflict). Single announced dialog surface via `internals.role`. Validates the baseline before hx-dialog (round-2) faces the native-`<dialog>` coexistence question.

**Focus-trap timing discovery for hx-dialog round-2:** Initial seed-from-firstUpdated implementation interleaved Lit re-render with the open-drawer focus chain (`updateComplete.then(...) → _isOpen = true → updateComplete.then(...) → _setInitialFocus()`), breaking slotted-children focus on consumer code that calls `.focus()` immediately after the first updateComplete. Resolution: seed omitted; slotchange microtask handles state one tick later. Sub-frame lost-name window. Documented in source so a future round can reintroduce the seed only after the open-drawer chain is restructured. **Forward-relevance:** hx-dialog uses native `<dialog>.showModal()` rather than the `_isOpen` CSS-visibility pattern; if the seed is reintroduced there, validate against the same .focus()-immediately-after-fixture test scaffolding.

99/99 hx-drawer tests passing (75 existing + 24 new — 3 retargeted to host-canonical surface). 323 adjacent component tests (drawer + dialog + popover + popup) green — no regression. `pnpm run verify` clean.
