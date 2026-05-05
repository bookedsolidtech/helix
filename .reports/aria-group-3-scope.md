# ARIA Group 3 — Selects, Combos, Pickers — Implementation Scope

**Status:** scoping (read-only). Local audit data — do not commit.
**Branch:** `feat/aria-group-3-selects-combos-pickers` (HEAD `9a128cd51`, identical to `origin/dev`)
**Author:** accessibility-engineer
**Task:** #62
**Reference exemplars:** `origin/feat/aria-group-2-selection-controls` (round-36, in PR #1625)

---

## 1. Component manifest

Group 3 contains five components matching the "selects / combos / pickers" theme. `hx-dropdown` is intentionally **excluded** — it is a menu-button (`role="menu"`) targeting Group 4 (overlays / disclosure), not a value selector.

| Component         | LOC   | Form-associated | Role surface today                                  | Host-canonical ARIA | hasEffectiveLabelledBy gate | setValidity anchor                     | Slot-aware describedby | Status         |
| ----------------- | ----- | --------------- | --------------------------------------------------- | ------------------- | --------------------------- | -------------------------------------- | ---------------------- | -------------- |
| `hx-select`       | 818   | yes             | inner `div role="combobox"` + inner `role="listbox"`| no                  | no                          | `_trigger ?? _select` (focusable OK)   | partial (no slot read) | not started    |
| `hx-combobox`     | 979   | yes             | inner `<input role="combobox">` + inner listbox     | no                  | no                          | `_input` (focusable OK)                | partial                | not started    |
| `hx-time-picker`  | 889   | yes             | inner `<input role="combobox">` + inner listbox     | no                  | no                          | `_input` (focusable OK)                | partial                | not started    |
| `hx-date-picker`  | 1234  | yes             | readonly `<input>` + `<button>` trigger + `<dialog>`| no                  | no                          | `_input` (readonly — anchor weak)      | partial                | not started    |
| `hx-color-picker` | 923   | yes             | `<button part="trigger">` + `role="group"` panel    | no                  | no                          | none — `_updateValidity` lacks anchor  | none                   | not started    |

**Total surface:** 4,843 LOC source + 6,819 LOC tests = ~11,660 LOC affected.

**Dependency:** All five components require `packages/hx-library/src/utils/aria-idref.ts`. That file does **not** exist on `dev` — it is added by Group 2 (PR #1625). Group 3 work is therefore **blocked** on Group 2 landing first, OR Group 3 must port `aria-idref.ts` into its own first commit. Recommend: rebase Group 3 onto `staging` once Group 2 is merged. If timeline forces parallel work, copy `aria-idref.ts` into Group 3 round-1 and resolve the duplicate at merge.

---

## 2. Group 3 vs Group 2 — structural differences

Group 2 (radio-group, checkbox-group, switch, toggle-button) operates on a **single composite control**: a fieldset of children OR a single switch/toggle. The host is the announced surface, period.

Group 3 has a fundamental ARIA pattern conflict: **APG combobox lives on the inner `<input>` (or div), not on the host.** ARIA 1.2 places `role="combobox"`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-activedescendant` on the editable text field, not its container. Putting `combobox` semantics on the host via `internals.role = 'combobox'` is **not safe** — it would compete with the inner input's role and AT would announce the host's combobox plus the inner input's combobox (or, worse, drop the inner one).

### Architectural decision (REQUIRED before round-1)

There are two viable patterns. **The implementation must commit to one and document it in a comment block at the top of each component.**

**Option A — Host-as-form-field, inner-as-combobox (RECOMMENDED).**
- Host owns: `internals.ariaLabel`, `internals.ariaLabelledByElements`, `internals.ariaDescribedByElements`, `internals.ariaRequired`, `internals.ariaInvalid`, `internals.ariaDisabled`. **No `internals.role`** — leave the host roleless so the inner combobox/listbox/dialog stays canonical.
- Inner combobox/dialog: keeps its ARIA role and `aria-controls` to the inner listbox. Its `aria-labelledby` and `aria-describedby` are **dropped** — the host carries naming via internals so cross-shadow consumer IDREFs resolve correctly.
- Validity anchor: focusable interactive trigger (input / button / div trigger). Already correct on 4/5 components.
- This matches Group 2's intent (host-canonical labels/descriptions) without overriding the APG combobox role contract.

**Option B — Inner-canonical, host-pass-through.**
- Skip `internals.role`/`internals.ariaLabel*` entirely. Use `installAriaIdrefMirror()` to mirror consumer host `aria-labelledby` token lists onto the inner `<input>`/`<button>` via attribute mirror only (the legacy fallback path from Group 2).
- Simpler but loses the modern `ariaLabelledByElements` cross-root resolution. Forfeits the round-15 P1 gain.

**Recommendation: Option A.** It mirrors Group 2's gains (cross-root IDREF resolution, slot-aware describedby) while respecting the APG combobox contract. The 7 reference patterns map cleanly with one substitution (no `internals.role`).

---

## 3. The 7 reference patterns — Group 3 mapping

| # | Pattern (Group 2)                                  | Group 3 application                                                                                |
|---|----------------------------------------------------|----------------------------------------------------------------------------------------------------|
| 1 | Host-canonical ARIA via ElementInternals           | **Modified.** Host owns label/describedby/required/invalid/disabled — but NOT role. Inner keeps `role="combobox"` (or `dialog` for date picker).|
| 2 | `hasEffectiveLabelledBy` gate                      | **Identical.** Resolve consumer `aria-labelledby` IDREFs; only treat as effective when ≥1 resolves; otherwise fall back to `label` prop. Applies to all 5 components.|
| 3 | Two render paths (modern vs legacy fallback)       | **Identical.** `_supportsIdrefRefs` flag at connect; modern uses `internals.ariaLabelledByElements`; fallback writes a sanitized host attribute mirror.|
| 4 | Validity anchor focusable                          | **Mostly already correct.** `hx-select`, `hx-combobox`, `hx-time-picker` already anchor to focusable trigger/input. `hx-date-picker` anchors to a readonly input (acceptable but trigger button is better). `hx-color-picker` has NO anchor today — must add.|
| 5 | Slot-aware describedby                             | **New work everywhere.** All 5 read `helpText` property only; none observe the help/error slot's projected text. Need `readSlottedOrShadowText()` helper + slot text observers (round-23 P2 pattern). Drop help from chain when error active.|
| 6 | Forced-colors host-focus parity                    | **Audit.** All 5 import `forcedColorsField` from styles. Verify `:host(:focus-visible)` rule exists for the new host-canonical focus ring (host is now the announced surface so `:host(:focus-visible)` must paint a ring at the same selector specificity as the forced-colors override — same gotcha as round-22 in Group 2).|
| 7 | `_consumerLabelledBy` cache + own-write guard      | **Identical.** Cache external token strings; refresh only when live attribute differs from `_lastWrittenLabelledBy`; replay when target later attaches.|

Two patterns are **not** in the Group 2 list but Group 3 will need them:

- **8. Combobox `aria-controls` integrity.** Inner combobox's `aria-controls` points to a shadow-internal listbox id. That's fine because both live in the same shadow root. No change. But: the host MUST NOT also set `aria-controls` (would cross the shadow boundary).
- **9. Calendar/dialog focus trap.** `hx-date-picker` has a focus trap (`_handleCalendarTab`) using `shadowRoot.activeElement`. Verify this still works with the host-canonical changes (it should — internals don't affect focus). Likely no edits, but tests must regress-check it.

---

## 4. Per-component delta

### 4.1 `hx-select` (818 LOC)

**Source:** `packages/hx-library/src/components/hx-select/hx-select.ts`

#### 4.1.1 Add imports (top of file, after line 11)
```ts
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
```

#### 4.1.2 New state + private members (after line 256, near `_focusedOptionIndex`)
```ts
@state() private _hasHelpSlot = false;
@state() private _supportsIdrefRefs = true;

private _ariaMirror: AriaIdrefMirrorHandle | null = null;
private _helpSlotTextObserver: MutationObserver | null = null;
private _errorSlotTextObserver: MutationObserver | null = null;
private _lastWrittenLabelledBy: string | null = null;
private _lastWrittenDescribedBy: string | null = null;
private _consumerLabelledBy: string | null = null;
private _consumerDescribedBy: string | null = null;
```

#### 4.1.3 `connectedCallback` — new override
The component currently has no `connectedCallback`. Add one that probes IDL refs, installs the mirror, and seeds `_syncHostAriaSemantics()`. Mirror lines 366-393 of the radio-group reference.

#### 4.1.4 `disconnectedCallback` (line 278) — extend
Add disconnect of `_ariaMirror`, `_helpSlotTextObserver`, `_errorSlotTextObserver`. Mirror lines 395-422.

#### 4.1.5 `updated` (line 289) — append `_syncHostAriaSemantics()` call
After the existing `if (changedProperties.has('error'))` block, call `this._syncHostAriaSemantics()`.

#### 4.1.6 New method `_syncHostAriaSemantics` (~80 LOC)
The single biggest change. Lifts the radio-group implementation (lines 461-638) almost verbatim, with these substitutions:
- **Drop** `internals.role = 'radiogroup'`, `internals.ariaOrientation`. Replace with `internals.role = null` (explicit; do NOT set role on host).
- Set `internals.ariaRequired`, `internals.ariaInvalid`, `internals.ariaDisabled`, and `internals.ariaLabel` per the gate logic.
- Use `_labelId` (already exists, line 143) as the internal labelled-by target instead of `${this._groupId}-legend`.
- Drop help text from describedby chain when `hasError` (round-16 P2 parity).
- Both modern and fallback paths.

#### 4.1.7 New method `_handleHelpSlotChange` + `_installHelpSlotTextObserver` + `_installErrorSlotTextObserver`
~50 LOC total. Mirror lines 211-308 of radio-group. Re-tune observers on slotchange. Track `_hasHelpSlot`.

#### 4.1.8 Render delta (line 667-801)
- Wire `<slot name="help-text" @slotchange=${this._handleHelpSlotChange}>` (currently the help-text div is conditionally rendered on `helpText` property only — needs to be persistent like radio-group lines 1131-1138).
- Drop `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid` from the inner `<div role="combobox">` AND the hidden native `<select>` when `_supportsIdrefRefs` is true. Keep them on the fallback path. Use `${this._supportsIdrefRefs ? nothing : ...}` ternaries.
- Persistent error live region (currently the `role="alert"` div is conditionally rendered — must always be in DOM with `?hidden=${!hasError}` and `_announcedError` state for re-announcement).

#### 4.1.9 `_updateValidity` (line 334) — minor
Add a final `this._syncHostAriaSemantics()` call so `aria-invalid` re-syncs after every validity change (round-1 finding #6 parity).

#### 4.1.10 `firstUpdated` — add devWarn for missing accessible name
The component already has `accessibleLabel`, `label`, and slotted label support; warn when none provided.

**Estimated effort:** ~6 hours implementation + ~4 hours codex iteration.

---

### 4.2 `hx-combobox` (979 LOC)

**Source:** `packages/hx-library/src/components/hx-combobox/hx-combobox.ts`

Largely the same delta as `hx-select` with these distinctions:

- The combobox is `multiple`-aware. The host's `internals.ariaMultiSelectable` is **not** valid for a combobox role surface, but we are NOT putting combobox on the host. Keep `aria-multiselectable` on the inner `<div role="listbox">` only.
- The chip-remove buttons each carry `aria-label=${this.labelRemoveOption(label)}`. No change there — they are descendant interactive elements, not part of the host accessible name.
- The `_filterAnnouncement` live region (line 947) is already in place. Verify it still works after the describedby changes.
- The `_input` is the validity anchor (line 375) — already focusable. No change.
- Loading state's `aria-busy` (line 857) on the inner input — keep; the host doesn't mirror this.

**Specific edits:**
1. Add imports + state members (same shape as `hx-select`).
2. New `connectedCallback`, extended `disconnectedCallback`, `_syncHostAriaSemantics`.
3. Render delta on lines 840-867 — drop `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid` from `<input>` on modern path.
4. Help text wrapper currently only renders when `helpText && !hasError` (line 938). Make it persistent like the radio-group reference.
5. Error wrapper currently only renders when `hasError` (line 930). Make it persistent with `?hidden=${!hasError}`.
6. devWarn for missing accessible name in `firstUpdated`.

**Risk callout:** the combobox supports `multiple` mode with chips. The chips render between prefix and the input (lines 802-837). Verify the host `aria-labelledby` doesn't accidentally name the chips when they project. They are descendants of the host shadow root, so they will not pollute the host's accessible name unless we mistakenly include their ids in `internals.ariaLabelledByElements`. Resolution: only push `_labelId` (the static label) into `labelEls`.

**Estimated effort:** ~7 hours implementation + ~5 hours codex iteration.

---

### 4.3 `hx-time-picker` (889 LOC)

**Source:** `packages/hx-library/src/components/hx-time-picker/hx-time-picker.ts`

Structurally identical to `hx-combobox` (text input + listbox of time slot options). Slightly simpler — no multi-select, no chips, no async loading.

**Already strong:**
- Has `_slottedLabelId` (line 333) and `_hasLabelSlot` (line 318) tracking — Group 3 work needs to fold these into the host-canonical `labelEls` resolution.
- Persistent help-text container exists (line 877) — already round-22-compliant. **Skip** the persistence rewrite for help text; only error needs persistence.
- Error wrapper is conditional (line 866-873) — needs persistence + re-announce.

**Specific edits:**
1. Imports, state, connect/disconnect lifecycle (same shape).
2. `_syncHostAriaSemantics()` — uses `_slottedLabelId` (when present) as a labelEl alongside the property-driven `label`. The condition `this._hasLabelSlot && this._slottedLabelId` already gates this on render line 786 — port to internals.
3. Drop inner-input `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid` on modern path (line 783-788).
4. Persistent error region with `_announcedError` state.
5. devWarn for missing accessible name.

**Estimated effort:** ~5 hours implementation + ~4 hours codex iteration.

---

### 4.4 `hx-date-picker` (1234 LOC) — HIGHER RISK

**Source:** `packages/hx-library/src/components/hx-date-picker/hx-date-picker.ts`

**Structural difference:** date-picker uses a **`<dialog>` calendar popup** (line 1152) with `aria-haspopup="dialog"` on both the readonly input (line 1116) and the trigger button (line 1124). The dialog has its own `aria-label` and a focus trap. The day grid uses `role="grid"` with `role="gridcell"` and `role="row"`/`role="columnheader"`.

**Architectural caveat for Option A:** When the dialog is open, AT enters a different accessible context (the dialog). The host's `internals.ariaLabel` only describes the closed/collapsed combobox surface — the dialog's own `aria-label="Choose a date"` is the announced name once focus moves into the calendar. This is correct and we should NOT remove the dialog's `aria-label`.

**Specific edits:**
1. Same import + state additions.
2. New `_syncHostAriaSemantics()` — host owns `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid`, `aria-disabled`. Does NOT own role (the readonly input is the focusable surface; or arguably the trigger button — see point 4 below).
3. Drop `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid` from the readonly input (line 1110-1115) on modern path. Keep `aria-haspopup="dialog"` (it describes the input's behavior, not its name).
4. **Validity anchor reconsideration.** Today: `_input` (the readonly text input). Per Group 2 round-35 the anchor should be focusable AND interactive. The readonly input IS focusable but is NOT used to recover from the error (the user clicks the trigger button to open the calendar). Recommend changing anchor to `_trigger ?? _input` to mirror the actual remediation surface. **Test for this.**
5. Persistent help/error regions.
6. The slotted label handler at line 377-386 already assigns an id (`-slotted-label`) — fold into `labelEls`.
7. **Calendar live region:** `_liveMessage` (line 265) already drives a polite live region (line 1160-1167) inside the dialog. No change.
8. **Focus trap regression test.** Modify nothing in `_handleCalendarTab`, but write a test that opens calendar, Tabs around, asserts shadow `activeElement` cycle, AFTER the host-canonical changes — confirms host internals don't interfere.

**Risk callout:** The calendar `<dialog>` element calls `.show()` (non-modal) — not `.showModal()`. That's already the chosen behavior (good — avoids the `aria-modal` trap that bit `hx-color-picker`). Don't change to `showModal` during this work.

**Estimated effort:** ~10 hours implementation + ~6 hours codex iteration. Highest risk in the group due to dialog + grid pattern.

---

### 4.5 `hx-color-picker` (923 LOC) — HIGHEST RISK

**Source:** `packages/hx-library/src/components/hx-color-picker/hx-color-picker.ts`

**Structural difference 1:** No `label` property, no `helpText` property, no `error` property, no slot-based label/help/error. This component is currently labeled exclusively via `labelTrigger(color)` callback rendering the trigger button's `aria-label` (line 903). It is form-associated (line 120) but has no field-style ARIA scaffolding. **Group 3 work must add this scaffolding** to bring it to parity, OR we must explicitly carve `hx-color-picker` out and document the deviation.

**Structural difference 2:** When open, the panel renders `role="group"` with `aria-label` (line 873) — explicitly NOT `role="dialog"` per the comment (line 865-870). The panel contains three `role="slider"` elements (gradient, hue, opacity — lines 726/757/790) and a `role="group"` swatches section (line 814). Each slider has its own `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`.

**Structural difference 3:** `_updateValidity` (line 365-373) calls `setValidity` with **no anchor argument** — fails the round-35 contract. There is no obvious focusable anchor: the trigger button is only present in popover mode (`!this.inline`); in inline mode there is no single anchor — sliders are the focusable surfaces.

**Decision required before round-1 — pick one of three paths:**

1. **Bring to full parity (recommended for the healthcare mandate).** Add `label`, `helpText`, `error`, `required`, slotted label/help/error to match the field family. Add validity anchor: `_triggerEl ?? _gridEl ?? _hueSliderEl`. Implement the full Group 2 host-canonical pattern. Estimated +250 LOC and significant API expansion.
2. **Field-light parity.** Skip property additions. Add validity anchor (focusable trigger / first slider). Add host-canonical `internals.ariaLabel` derivation from `labelTrigger(value)`. Skip describedby chain entirely. Document in component JSDoc as deviation. Estimated +50 LOC.
3. **Defer to a separate PR.** Move `hx-color-picker` to Group 3b (or a follow-up). Justification: API shape is fundamentally different from the rest of Group 3 (no label/help/error today) and it interacts with sliders that overlap Group 9 (indicators).

**Recommendation: Path 3 — defer.** The other 4 components share a common field pattern. Forcing color-picker through the same delta either expands its API (creates breaking changes / changesets) or accepts a known deviation that codex will flag every round. Better to land Group 3a (select, combobox, time-picker, date-picker) clean, then spec a dedicated color-picker accessibility uplift as a separate ticket with explicit API-design review.

**If Path 1/2 forced:** estimate 12 hours implementation + 8 hours codex iteration + design review.

---

## 5. Test coverage plan

Group 2's `hx-radio-group.test.ts` is 1626 LOC. Group 3 components already have extensive test files (1102-1611 LOC each). The deltas mirror Group 2's late-round additions — round-19 through round-36 patterns.

For each in-scope component (`hx-select`, `hx-combobox`, `hx-time-picker`, `hx-date-picker`):

### 5.1 Host-canonical surface tests (~10 cases per component)
- `internals.role` is **null** (NOT 'combobox') — verifies APG compliance is not broken
- `internals.ariaLabel` reflects `label` prop when no consumer aria-label
- `internals.ariaLabel` reflects host `aria-label` attribute when set
- `internals.ariaLabelledByElements` resolves consumer `aria-labelledby` token to a real Element
- `internals.ariaDescribedByElements` includes help element when no error
- `internals.ariaDescribedByElements` includes error element + drops help when error active (round-16 P2)
- `internals.ariaRequired === 'true'` when `required`, `'false'` otherwise
- `internals.ariaInvalid === 'true'` when validity invalid
- `internals.ariaDisabled === 'true'` when `disabled`
- Inner combobox/input does NOT carry `aria-labelledby`/`aria-describedby`/`aria-required`/`aria-invalid` on modern path

### 5.2 hasEffectiveLabelledBy parity (~3 cases per component)
- `aria-labelledby="missing-id"` does NOT erase visible label — `internals.ariaLabel` falls back to `label` prop (round-35 medium)
- `aria-labelledby="missing-id"` clears host `aria-labelledby` attribute on fallback path (round-36 medium)
- Effective once target attaches: replay via cached `_consumerLabelledBy` (round-22 P2)

### 5.3 setValidity anchor (~2 cases per component)
- `_internals.validity.valid === false` AND anchor is the focusable trigger/input (use `_internals` accessor or instrument `setValidity` calls)
- For `hx-date-picker`: anchor change to `_trigger ?? _input` if we make that change

### 5.4 Slot-aware describedby (~4 cases per component)
- Slotted help text contributes textContent to `internals.ariaDescription` on fallback path (round-22 P1 #2)
- In-place `textContent` rewrite of slotted help node fires the slot text observer and resyncs (round-23 P2)
- Slotted error text takes precedence when error active
- Empty slot collapses to `null` description, not empty string

### 5.5 Forced-colors host-focus parity (~1 case per component)
- `:host(:focus-visible)` outline is present when host receives focus and forced-colors media is forced (use `matchMedia` mock or testing-library helper)

### 5.6 Fallback path explicit tests (~3 cases per component)
Mirror radio-group lines 1460-1505:
- Inner element has no `aria-labelledby` / `aria-describedby` / `aria-required` / `aria-invalid` (those are on host attribute mirror only)
- Consumer `aria-labelledby` / `aria-describedby` mirror onto host (when target resolves)
- `internals.ariaDescription` is set to slot textContent (when describedby tokens unresolvable)

### 5.7 Date-picker-specific
- Calendar dialog opens, focus enters the dialog, focus trap cycles correctly (regression — assert host-canonical changes don't break trap)
- Calendar live region `_liveMessage` still announces month name on Page Up/Down

**Per-component test additions: ~22-25 cases × 4 components = ~90-100 new test cases.** Total LOC additions ~1500-2000 across the four test files.

---

## 6. Suggested commit sequence

### Round-3 update (2026-05-04) — Path A reverted in favour of host-canonical
After codex round-2 returned 8 findings against the "Path A — host roleless, inner trigger roleful" architecture, we reverted that decision in round-3. Rationale:
- Group 2's PR #1625 already shipped host-canonical for `hx-radio-group` / `hx-checkbox-group`, validating the pattern in production.
- Path A required dual-channel ARIA (host attributes + inner trigger ARIA) which created drift vectors codex flagged repeatedly.
- The APG-combobox concern that originally drove Path A turned out to be theoretical: with no role and no aria-* on the inner trigger, AT walks its subtree text as the combobox value content without producing a doubled accessible.

Round-3 architecture (now reflected in `hx-select.ts`):
- Host carries `internals.role = 'combobox'` AND a mirror `role="combobox"` host attribute on BOTH the modern (IDL element-references) and fallback (host-attribute mirror) paths.
- Host owns `tabindex`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-disabled`.
- Inner trigger (`<div part="trigger">`) is a styling surface only — no role, no ARIA, no tabindex.
- `setValidity()` anchor is the host (`this`).
- Keydown/click listeners are attached to the host (not the trigger) so the canonical surface owns input.
- `focus()` and Escape-key refocus route through `HTMLElement.prototype.focus.call(this, ...)` so focus lands on the host.
- New static test seam `__testSupportsIdrefRefsOverride: boolean | null` consumed in `connectedCallback` BEFORE the platform probe runs — eliminates the round-2 finding 4 stale-modern-internals leak that mid-life flag flips caused.
- Symmetric clear in the fallback branch nulls `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements` on every sync.
- Fallback `aria-describedby` mirror carries only consumer-resolved ids; shadow help/error wrapper ids surface via `internals.ariaDescription` text mirror only (round-3 finding 7).
- Discriminated `_labelSource: 'string' | 'slot' | 'none'` + `_labelSlotText` replace the previous `_slottedLabelId` consumer-DOM-mutation approach (round-2 findings 3, 5, 6, 8).

Tests updated: `hx-select.test.ts` now asserts host attributes for ARIA state (`Host ARIA attributes` describe block), `setValidity` anchor is `el` (host), and `focus()` lands on `document.activeElement === el`. Keyboard event dispatches use `composed: true` so they cross the shadow boundary to the host listener. New regression coverage in `Static path-selection seam (Group 3 round-3 finding 4)` describe block exercises the static override + symmetric clear contract.

Test status: 137/137 hx-select tests pass; type-check clean.

### Round-5 update (2026-05-04) — fallback `aria-label` dual snapshot + describedby single-channel decision
Codex round-4 returned 3 findings against the round-3 dirty tree (2 high, 1 low). Round-5 remediates findings 1 and 3 in code; finding 2 hits the round-5 stop condition and is escalated to the coordinator.

**Finding 1 — fallback `aria-label` mirror was self-sealing (FIXED).** Sync N wrote `aria-label="Country"` to the host; sync N+1 read that string back via `getAttribute('aria-label')` and treated it as a consumer override, caching it into `internals.ariaLabel` and short-circuiting `_writeHostAttributeMirror`. Subsequent `label`/`accessibleLabel`/slot-text mutations never propagated; cleared label sources never removed the host attribute. The fix mirrors the existing `_lastWrittenLabelledBy` / `_lastWrittenDescribedBy` pattern: a new `_lastWrittenAriaLabel: string | null` snapshot records what the component wrote so the next sync can distinguish "I wrote this last time" (treat as component-owned, recompute from sources) from "consumer wrote a divergent value" (treat as override, freeze at top of sync). `_writeHostAttributeMirror` updates the snapshot on every write/remove; the fallback recompute path correctly removes the host attribute when the live value matches the snapshot AND the candidate has emptied. New regression coverage in `Fallback aria-label mirror lifecycle (Group 3 round-5 finding 1)` describe block: 2 tests, 8 assertions covering set→mutate→clear and consumer-wins-across-mutation.

**Finding 2 — split-channel description on fallback path (ESCALATED, not fixed).** Codex flagged that the fallback path puts consumer `aria-describedby` IDs on the host attribute while internal shadow help/error text goes only into `internals.ariaDescription`. AT prioritises `aria-describedby` (when it resolves) over `aria-description` per W3C AccName 1.2, so consumer-only description is announced and internal validation/help text is silently dropped. The directive's recommended fix is to splice the shadow help/error wrapper id into the host's `aria-describedby` token list, but cross-shadow IDREF resolution is **not portable** per W3C: IDREFs are scoped to the same root, and Firefox/Safari (the engines that drive the fallback path) implement strict scoping. Round-5 stop condition triggered: coordinator must choose between (a) cross-shadow id resolution that works only on Chromium-derived AT, accepting silent failure on Firefox/VoiceOver, or (b) text-only `internals.ariaDescription` carrying the concatenation of consumer-resolved description text + internal help/error text, dropping the host `aria-describedby` mirror entirely (sacrifices the "consumer relationship preserved on host attribute" test contract at line 1821 of `hx-select.test.ts`). Single-channel is the right shape; the question is which channel survives.

**Finding 3 — static test seam global teardown (FIXED).** Added a top-of-file `afterEach` that resets `HelixSelect.__testSupportsIdrefRefsOverride = null` after every test in the worker as defense-in-depth against future careless tests forgetting the try/finally pattern.

Test status: 139/139 hx-select tests pass (137 → 139, +2 finding-1 coverage); type-check clean. Working tree remains dirty pending coordinator decision on finding 2.

### Round-6 update (2026-05-04) — fallback describedby single-channel collapse (option b)
Decided on option (b) single-channel fallback `internals.ariaDescription` per W3C AccName 1.2 precedence; sacrifices token-id-on-host-attribute mirror on fallback path; modern path unchanged. Rationale (verified against `/Volumes/Development/booked/data/web-llm-kb/Sources/W3C-ARIA/ARIA Spec - AccName.md`): `aria-describedby` takes precedence over `aria-description`/`internals.ariaDescription`, so any consumer-authored `aria-describedby` token surviving on the fallback path would block AT from reaching internal help/error text. Cross-shadow id splice (option a) was rejected — IDREFs are root-scoped per W3C, and Firefox/VoiceOver (the engines that exercise the fallback path) enforce strict scoping. Option (b) collapses both consumer-supplied description text and internal shadow help/error text into a single concatenated `internals.ariaDescription` string.

Implementation (`hx-select.ts:798-842`):
- Strip the host `aria-describedby` attribute on every fallback sync regardless of authorship; clear `_lastWrittenDescribedBy` accordingly. The consumer's intended description text is preserved through `internals.ariaDescription` (concatenation below); only the attribute mirror is removed. `_consumerDescribedBy` retains the consumer's original token list so the modern path continues to work if the platform later upgrades.
- Resolve consumer `aria-describedby` IDREFs through the existing `resolveIdrefTokens` helper (drops unresolved tokens silently, matching native AT) and concatenate their text content with internal `helpEl` / `errorEl` text via `readSlottedOrShadowText` into `internals.ariaDescription`. Symmetric clear (null) when all sources are empty.
- Modern path (lines 744-754) untouched — it continues to use `ariaDescribedByElements` which the platform concatenates correctly across shadow roots.

Test changes (`hx-select.test.ts`):
- Rewrote the round-3 test at the former line 1821 (`preserves consumer aria-describedby through error → recovery cycle (fallback path)`) to assert the new single-channel contract: host attribute is null, `internals.ariaDescription` carries both consumer and internal text. Test renamed: `Fallback path: description text reaches AT via internals.ariaDescription regardless of consumer aria-describedby channel — single-channel by design (W3C AccName precedence)`.
- Added two regression tests under `Slot-aware describedby — fallback path`: (1) concatenation of consumer text + internal help/error text into `internals.ariaDescription`, with help/error mutual-exclusion verified; (2) unresolved consumer IDREF tokens are silently dropped (no literal id leakage into description).

Test status: 141/141 hx-select tests pass (139 → 141, +2 round-6 regression coverage); type-check clean. Working tree remains dirty for codex round-7.

### Round-8 update (2026-05-04) — codex round-7 remediation (4 findings: 2 medium, 2 low — ALL CLOSED)

Codex round-7 returned `concerns` with 4 findings against the round-6 dirty tree (2 medium, 2 low). Per `.rea/policy.yaml` `review.concerns_blocks: true`, all four were closed in round-8 before commit. Working tree remains dirty for codex round-9.

**Finding 1 (medium) — consumer `aria-describedby` removal unobservable on fallback path (FIXED).** The round-6 strip (`hx-select.ts` ~line 825) removes the host `aria-describedby` and resets `_lastWrittenDescribedBy = null`. After the strip, the host attribute is absent. If the consumer subsequently calls `removeAttribute('aria-describedby')` (their authentic intent to retract), no DOM mutation fires (the attribute is already absent), so the post-strip `getAttribute` baseline diff at `hx-select.ts:691-694` cannot detect the change — `_consumerDescribedBy` stays pinned to the originally-cached string forever and the consumer's external description text keeps concatenating into `internals.ariaDescription` indefinitely. Round-8 fix: dedicated host MutationObserver scoped to `aria-describedby` with `attributeOldValue: true` (`hx-select.ts` lines ~424-447 declaration; ~488-538 wiring; cleanup in `disconnectedCallback`). The observer reads `oldValue` + `newValue` and uses a `_pendingInternalDescribedByStrips` counter to discriminate self-mutations (drained 1:1 with our strip writes) from authentic consumer retractions. On retraction (oldValue !== null && newValue === null && counter empty), `_consumerDescribedBy` is cleared and a resync runs so `internals.ariaDescription` rebuilds without the stale external text. Cost: one MutationObserver per host (one element, one attribute filter) — scope-bounded.

**Finding 2 (medium) — `_lastWrittenAriaLabel` consumer-override path didn't reset snapshot (FIXED).** `_writeHostAttributeMirror` returned early on the consumer-override branch (`hx-select.ts:938-944`) without resetting `_lastWrittenAriaLabel`. The snapshot stayed pinned to the value WE wrote last. If the consumer subsequently rewrote `aria-label` to a string that happened to equal our prior write, the disambiguation at `hx-select.ts` ~line 668 saw `liveAttr === _lastWrittenAriaLabel` and treated the consumer string as component-owned — a subsequent `label = ''` would then silently delete the consumer's attribute. Round-8 fix: null `_lastWrittenAriaLabel` in the consumer-override branch BEFORE the early return (`hx-select.ts:954-960`). The sentinel `null` means "we did NOT author the live attr," so a coincident-string round-trip differs from `null` and the disambiguation correctly classifies the consumer string as external on every subsequent sync.

**Finding 3 (low) — `_consumerDescribedBy` survival across fallback strip not asserted (FIXED).** Round-8 added a positive regression test (`Round-8 codex remediation > Finding 3`) asserting `_consumerDescribedBy` is captured on the initial sync and survives both `_syncHostAriaSemantics` re-entry and `requestUpdate`-driven re-renders. This locks the round-6 round-trip semantics that finding 1's observer-based retraction depends on.

**Finding 4 (low) — whitespace-only `aria-label` override silently overwritten (FIXED — codified intent option a).** Round-8 added a documenting comment at the disambiguation site (`hx-select.ts` ~lines 670-684) explaining the deliberate behaviour: a whitespace-only consumer `aria-label` (e.g. `aria-label=" "`) is treated as no consumer override, the internal candidate wins, and the host attribute is overwritten on the fallback path. Rationale: whitespace-only `aria-label` is a code smell pattern, the AT-suppression behaviour it sometimes produces is not part of the documented hx-select contract, and silently erasing the consumer's intended name would be the worse failure mode. New positive regression test (`Round-8 codex remediation > Finding 4`) locks intent.

**Canonical disambiguation pattern for groups 4-10.** Finding 2's "null the snapshot in the consumer-override branch BEFORE early return" pattern is the canonical fix for any host-attribute-mirror with consumer-override discrimination on the fallback path. Groups 4-10 (overlays, navigation, live regions, data display, buttons, indicators, structural) inheriting the round-3 host-canonical ARIA pattern MUST mirror this null-on-divergent-override discipline in their `_writeHostAttributeMirror` equivalent. Reference site: `packages/hx-library/src/components/hx-select/hx-select.ts:954-960`. Finding 1's "dedicated host observer with `attributeOldValue: true` + strip-counter discriminator" pattern applies to any component that strips a consumer-mirrored host attribute on the fallback path — see `hx-select.ts:488-538` for the canonical wiring.

Test status: 145/145 hx-select tests pass (141 → 145, +4 round-8 regression coverage: finding 1 retraction, finding 2 four-step round-trip, finding 3 cache survival, finding 4 whitespace-only override); type-check clean. Working tree remains dirty for codex round-9.

### Round-10 update (2026-05-04) — fallback describedby architecture confirmed (Option A) + counter race fix
Codex round-9 returned 2 findings (both medium): finding 1 a counter race in round-8's `_pendingInternalDescribedByStrips` discriminator, finding 2 an architectural challenge framing the bare-`removeAttribute` no-op case as a defect rather than a documented limitation. Round-10 architectural review (principal-engineer) re-evaluated options A (round-6 single-channel `internals.ariaDescription`), B (revert the strip), and C (hybrid ownership classification) against W3C AccName 1.2 description precedence, healthcare-mandate validation safety, observability across batched and imperative consumer mutation patterns, and copy-cost for groups 4-10. **Decision: KEEP Option A (single-channel `internals.ariaDescription`).** B silently drops internal validation text on Firefox/VoiceOver under the AccName precedence table — unacceptable for a healthcare component. C inherits the same defect on its consumer-authored branch and adds a fragile state machine. Round-9 finding 1 is fixed independently by replacing the counter+discriminator with a disconnect-during-strip observer discipline (the strip is bracketed by `observer.disconnect()` / `observer.observe(...)` so self-mutations never reach the callback at all). Round-9 finding 2's bare-`removeAttribute` case is reframed from "limitation" to "public contract" — DOM mutations on absent attributes are unobservable by spec (this is a property of the platform, not a fixable code defect), and the documented workaround for vanilla-imperative consumers is the explicit set-empty-then-remove sequence. Full decision document, citations, algorithmic spec, and test contracts: `.reports/aria-group-3-architecture-decision-r10.md`. Pattern guidance for groups 4-10: components that elevate describedby to the host (combobox/listbox patterns where APG lacks a host role) MUST adopt the strip + concatenate fallback pattern documented there; components whose role surface naturally lives on an inner element (Group 2's hx-radio-group, hx-checkbox-group) should keep `aria-describedby` on the inner element and skip this pattern entirely.

**Round-10 implementation deltas (lit-specialist, 2026-05-04):**
- `hx-select.ts:425-461` — counter field `_pendingInternalDescribedByStrips` and lockstep-discriminator JSDoc removed; observer JSDoc rewritten to describe the disconnect-during-strip discipline.
- `hx-select.ts:526-551` — observer callback simplified: counter drain branch removed; only the consumer-retraction branch (`oldValue !== null && newValue === null`) remains.
- `hx-select.ts` fallback `_syncHostAriaSemantics` strip site — `removeAttribute('aria-describedby')` is now bracketed by `_hostDescribedByObserver?.disconnect()` and `_hostDescribedByObserver?.observe(...)` so self-mutations never reach the callback.
- `hx-select.ts:585-587` — `_pendingInternalDescribedByStrips = 0` cleanup line removed from `disconnectedCallback`.
- `hx-select.test.ts` — round-8 `Finding 1 (medium) — consumer aria-describedby retraction observable on fallback` describe block deleted; replaced by `Round-10 architecture lockdown (Group 3 round-10)` sibling describe block with three `it` cases under a `Test 2 — public contract for the three retraction sequences` sub-describe (sequences 1/2/3) plus `Test 1` (counter race no longer reachable) and `Test 4` (LOAD-BEARING healthcare-critical validation safety regression).
- Public contract documented in the test file's round-10 lockdown comment block (three retraction sequences: framework batched, set-empty-then-remove, bare removeAttribute as documented non-feature).

Test status: 149/149 hx-select tests pass (145 → 149, +4 round-10 lockdown tests, −0 deleted: round-8 finding-1 retraction test was the only test removed and is replaced 1-to-1 by round-10 Test 2 sequence 1); type-check clean. Working tree remains dirty for codex round-11.

### Phase 0 — prerequisites (separate PR or first commits)
- **Commit 0.1** — `chore(aria-idref): port shared utility from group-2`
  Pulls `packages/hx-library/src/utils/aria-idref.ts` from Group 2. **Skip** if Group 2 has merged to dev by start time. Add a note in the PR description that the file is co-owned with Group 2 and changes must be coordinated.

### Phase 1 — round-1 (one commit per component, ~700 LOC src + ~500 LOC test each)
- **Commit 1.1** — `feat(hx-select): host-canonical aria + slot-aware describedby (group-3 round-1)`
- **Commit 1.2** — `feat(hx-combobox): host-canonical aria + slot-aware describedby (group-3 round-1)`
- **Commit 1.3** — `feat(hx-time-picker): host-canonical aria + slot-aware describedby (group-3 round-1)`
- **Commit 1.4** — `feat(hx-date-picker): host-canonical aria + dialog-aware describedby (group-3 round-1)`

Each commit must be self-contained: source change + tests + changeset entry. Run `pnpm run verify` (lint+format+type-check+build) before push. Smoke-test via `pnpm run test:smart`.

### Phase 2 — codex iteration rounds
Group 2 took 36 rounds, hx-field had 13 rounds late in the cycle. Realistic projection for Group 3:

| Component         | Expected codex rounds | Reasoning                                                                  |
|-------------------|-----------------------|----------------------------------------------------------------------------|
| `hx-select`       | 8-12                  | Cleanest pattern; mostly mechanical port from radio-group exemplar         |
| `hx-combobox`     | 12-18                 | Multiple-mode chips + filter live region add edge cases                    |
| `hx-time-picker`  | 10-14                 | Slotted-label dual path; option active-descendant interactions             |
| `hx-date-picker`  | 18-28                 | Dialog + grid + focus trap; widest surface for round-15-style discoveries  |

**Cumulative estimate: 48-72 codex rounds across all four.**

Mitigations to compress this:
1. Lift the entire round-19 / round-22 / round-23 / round-35 / round-36 fixes from Group 2 into round-1 — don't make codex re-discover them. Specifically: persistent error region, `_announcedError` state, slot text observers, `hasEffectiveLabelledBy`, host attribute clear when ineffective, `_consumerLabelledBy` cache + own-write guard.
2. Run `/codex-review` locally on the round-1 commit before push (per Jake's pre-push gate directive).
3. Re-use the Group 2 test patterns verbatim where possible (renaming `hx-radio-group` → `hx-select` etc.).

### Phase 3 — react wrapper regen + changesets
- Run `pnpm run cem` and `pnpm --filter=@helixui/react run generate:check` after final round.
- One changeset per component with `@helixui/library: minor` (no breaking changes — host-canonical is additive).

---

## 7. Risk callouts

### 7.1 APG combobox conflict (HIGH)
Putting `internals.role = 'combobox'` on the host while inner `<input role="combobox">` exists creates two combobox accessibles. Mitigation: do NOT set `internals.role`. Document in code comment.

### 7.2 `aria-controls` cross-shadow (MEDIUM)
Inner combobox uses `aria-controls` to point to inner listbox. Both in same shadow root — fine. Do NOT set `aria-controls` on host (would dangle).

### 7.3 Date-picker dialog focus trap (MEDIUM)
Existing `_handleCalendarTab` uses `shadowRoot.activeElement`. Host-canonical changes don't touch focus, but verify with explicit regression test.

### 7.4 Color-picker API shape mismatch (HIGH)
See section 4.5. Recommend Path 3 (defer to separate PR).

### 7.5 Aria-idref utility cross-PR ownership (MEDIUM)
`aria-idref.ts` lives in Group 2 PR. Mitigation: rebase Group 3 onto a base where Group 2 has landed, OR copy + reconcile at merge.

### 7.6 Forced-colors regression (MEDIUM)
Host becomes the announced surface. `:host(:focus-visible)` must paint a ring at the same selector specificity as the forced-colors override. This bit Group 2 in round-22. Pre-emptively add the rule and test.

### 7.7 Combobox `multiple` chips and accessible name (LOW-MEDIUM)
Chips are descendants — they are NOT included in host accessible name unless we explicitly push their ids into `ariaLabelledByElements`. Code review check: only `_labelId` goes into labelEls.

### 7.8 Test runtime (LOW)
+90-100 cases × 4 components = +400 cases in browser-mode Vitest. May push the `test:smart` total over the 5-min watchdog. Mitigate by sharding the test file changes per commit.

---

## 8. Recommended PR split

**Group 3a — selects + combos (RECOMMENDED PRIMARY PR):**
- `hx-select`, `hx-combobox`, `hx-time-picker`
- ~3,000 LOC delta (src + tests). Tractable.
- All three share an identical pattern shape (input + listbox).

**Group 3b — date picker (SEPARATE PR):**
- `hx-date-picker` only.
- ~1,500-2,000 LOC delta.
- Dialog + grid + focus trap warrant its own review cycle.

**Group 3c (deferred / new ticket):**
- `hx-color-picker` accessibility uplift. Spec it as its own task with API-design review.

**Justification for 3a/3b split:** Group 2 hit 36 rounds because it bundled four components into one PR. A 4-component PR with comparable risk would predictably be worse here (date-picker is the highest-risk single component in the group). Splitting after the input+listbox family lands keeps codex iteration tractable per PR. Each PR can ship an independent changeset.

---

## 9. Effort estimate

| Component         | Round-1 impl | Codex iteration | Tests | Total       |
|-------------------|--------------|------------------|-------|-------------|
| `hx-select`       | 6h           | 4h               | 4h    | **14h**     |
| `hx-combobox`     | 7h           | 5h               | 5h    | **17h**     |
| `hx-time-picker`  | 5h           | 4h               | 4h    | **13h**     |
| `hx-date-picker`  | 10h          | 6h               | 6h    | **22h**     |
| `hx-color-picker` | (deferred)   | (deferred)       | —     | **deferred**|

**Group 3a (select+combobox+time-picker):** ~44 hours
**Group 3b (date-picker):** ~22 hours
**Total Group 3 (a+b):** ~66 hours

Codex rounds: 48-72 cumulative across both PRs. Calendar time depends on agent concurrency; with single-agent serial work this is roughly 2-3 weeks elapsed.

---

## 10. Pre-flight checklist for the implementing lit-specialist

Before opening the round-1 PR, confirm:

- [ ] Group 2 PR #1625 has merged to dev (or `aria-idref.ts` has been ported into round-1)
- [ ] `pnpm run verify` runs clean on dev
- [ ] Read `hx-radio-group.ts` from `origin/feat/aria-group-2-selection-controls` end-to-end (this is the canonical exemplar)
- [ ] Read `hx-radio-group.test.ts` from same branch (test patterns)
- [ ] Decide and document Path A vs Path B (recommend A) at the top of each component file
- [ ] Confirm pre-push gate (`scripts/agent-verify.sh`) passes locally before every push
- [ ] Run `/codex-review` locally before every push (Jake's mandatory directive — feedback memo `feedback_codex_before_every_push.md`)
- [ ] One changeset per component, one component per commit, one component family per PR

---

## Appendix — file inventory

```
packages/hx-library/src/components/hx-select/        # 818 src + 1343 test
packages/hx-library/src/components/hx-combobox/      # 979 src + 1282 test
packages/hx-library/src/components/hx-time-picker/   # 889 src + 1481 test
packages/hx-library/src/components/hx-date-picker/   # 1234 src + 1611 test
packages/hx-library/src/components/hx-color-picker/  # 923 src + 1102 test (DEFERRED)
packages/hx-library/src/utils/aria-idref.ts          # NOT ON DEV — port from Group 2
```

End of scope document.
