# ARIA Group 3 — Round-10 Architectural Decision: Fallback `describedby` Channel

**Status:** Decision (not yet implemented). Local audit data — do not commit.
**Branch:** `feat/aria-group-3-selects-combos-pickers` (DIRTY working tree, rounds 3+5+6+8 stacked)
**Component under review:** `hx-select` (canonical for groups 4-10)
**Decision authority:** principal-engineer
**Date:** 2026-05-04
**Supersedes:** round-6 architectural assumption that the fallback path must be single-channel `internals.ariaDescription`.

---

## TL;DR

**Decision: Option A (KEEP round-6 single-channel `internals.ariaDescription` text concatenation), with the round-8 retraction observer hardened per Codex round-9 finding 1 and the bare-`removeAttribute` corner case explicitly documented as a public contract limitation, NOT a bug.**

Confidence: high. The W3C AccName 1.2 precedence table forces our hand — any consumer-authored `aria-describedby` token that survives on the host will shadow internal validation/help text on AT that respects the spec. Option B silently drops healthcare-critical validation messages on Firefox today; Option C piles a state machine on top of an already-leaky discriminator. The bare-`removeAttribute` "limitation" is in fact a property of the browser DOM event surface, not a fixable code defect: a no-op DOM mutation IS unobservable, and no architecture short of an active poll on `getAttribute` can change that. The cost of accepting it is negligible (it requires a vanilla-JS consumer to explicitly imperative-retract a token they previously added — an edge case orders of magnitude rarer than the framework-batched attach-then-detach pattern Round-8's observer already handles correctly).

---

## 1. Problem statement

`hx-select` exposes an accessible description through two channels depending on whether the engine supports `ElementInternals.ariaDescribedByElements` (modern: Chromium 126+/Safari 18+/Firefox post-impl) or not (fallback: Firefox today, older Safari, older Chromium).

- On the **modern path**, `internals.ariaDescribedByElements` carries an `Element[]` that resolves cross-shadow-root, so consumer `aria-describedby` IDREFs and internal shadow help/error wrappers can both be passed to AT in one list. No tradeoff.
- On the **fallback path**, the IDL element-references API does not exist. Cross-shadow IDREFs do not portably resolve in legacy AT (W3C IDREFs are root-scoped and Firefox/VoiceOver enforce strict scoping). Three options exist for surfacing both consumer and internal description text — see section 4.

The W3C AccName 1.2 description precedence table is the constraint that makes this decision non-arbitrary:

> | Precedence | Attribute | Conditions |
> |---|---|---|
> | 1 | `aria-describedby` | Any element |
> | 2 | `aria-description` | Any element |
> | 3 | host language description features | If not used for name |
> | 4 | host language tooltip | If not used for name |
>
> "User agents MUST use the first applicable entry from the table where the listed conditions are met... The user agent MUST NOT use any markup other that the first relevant markup found, even if that markup results in an empty description."
>
> — `/Volumes/Development/booked/data/web-llm-kb/Sources/W3C-ARIA/ARIA Spec - AccName.md` lines 108-149

Per this precedence table, **`aria-describedby` strictly shadows `aria-description` / `internals.ariaDescription`** when at least one IDREF resolves. A consumer-authored `aria-describedby` left on the host attribute will (on a spec-compliant AT) cause the user-agent to ignore `internals.ariaDescription` entirely. Any internal validation error rendered into the shadow root via `internals.ariaDescription` would be silently dropped — fatal for a healthcare-mandated WCAG 2.1 AA component.

---

## 2. Why this matters more than it seems

Healthcare systems are the primary consumer of HELiX. A clinician filling out a form whose `<hx-select>` says "This field is required" must hear that message on Firefox/VoiceOver/JAWS. Silent failure is not an option:

- WCAG 4.1.3 Status Messages: validation errors must be programmatically determinable.
- WCAG 3.3.1 Error Identification: errors must be identified and described in text.

A consumer that authored `aria-describedby="custom-help-text"` on `<hx-select>` (a perfectly reasonable thing to do — they want to add field-level help) MUST NOT cause the component's own `error="This patient ID is required"` to vanish from the AT announcement.

This is the failure mode round-6 set out to fix. It is not theoretical: the round-3 architecture ran straight into it on the fallback path.

---

## 3. What round-6 actually did, and why round-8 wasn't enough

Round-6 strips the host `aria-describedby` attribute on every fallback sync (`hx-select.ts:910-919`) and concatenates consumer-resolved description text + internal help/error text into `internals.ariaDescription` (`hx-select.ts:929-943`).

The strip introduces a subtle observability problem: after the strip, the host attribute is absent. If the consumer subsequently calls `removeAttribute('aria-describedby')` (their authentic retraction intent), the DOM mutation is a null → null no-op and no MutationObserver callback fires. `_consumerDescribedBy` therefore stays pinned to its originally-cached value, and internal `ariaDescription` keeps concatenating the consumer's retracted text indefinitely.

Round-8 attempted a fix: a dedicated host MutationObserver scoped to `aria-describedby` with `attributeOldValue: true` and a `_pendingInternalDescribedByStrips` counter that drains 1:1 with the component's own strip writes. The intent: framework-batched attach-then-detach (set then remove inside the same render commit — Vue / React / Lit reconciliation pattern) produces TWO mutation records the observer can read `oldValue` from, so the consumer's authentic retraction is detectable.

**Codex round-9 finding 1 correctly identifies a counter race in round-8's implementation:** the callback reads the LIVE `getAttribute` rather than each record's `newValue`, so when batched mutations end with non-null state, the drain branch never fires for the records inside that batch. A later batch with terminal-null state may then mis-drain a consumer's authentic retraction. This is a 5-10 line fix (disconnect → strip → reconnect, or use `record.oldValue`/`record.newValue` directly per-record), independent of the architectural question.

**Codex round-9 finding 2 is the architectural question.** It points at the test comment at `hx-select.test.ts:2303-2317` that documents the bare-`removeAttribute('aria-describedby')` case as "the documented limitation" — an unobservable null → null no-op. Finding 2 frames this as evidence that the architecture is wrong: stale `_consumerDescribedBy` keeps concatenating retracted text indefinitely.

This is where the decision must be made.

---

## 4. The three options on the table

(Restating from the coordinator's brief for completeness.)

### Option A — KEEP round-6 single-channel `internals.ariaDescription`
- Strip host `aria-describedby` every fallback sync.
- Concatenate consumer-resolved text + internal help/error text into `internals.ariaDescription`.
- Round-8 observer (with finding-1 fix) handles framework-batched attach-then-detach retractions.
- Bare-`removeAttribute` retraction by a vanilla-JS imperative consumer is **documented as a public contract limitation**.

### Option B — REVERT (no strip)
- Don't strip. Consumer's `aria-describedby` survives on the host attribute.
- Internal help/error reaches AT only if consumer wires it.
- Modern path unchanged.

### Option C — HYBRID (strip when component-owned, preserve when consumer-authored)
- Inspect pre-existing `aria-describedby` on first sync. If present, classify as consumer-owned and never strip. If absent, component is free to write/strip.
- Track `_descriptionOwnership: 'consumer' | 'component' | 'none'`.

---

## 5. Evaluation against the constraint criteria

| Constraint | Option A | Option B | Option C |
|---|---|---|---|
| **Correct under W3C AccName 1.2 precedence?** | YES — strip enforces `aria-description` is the only description channel; spec table is satisfied. | NO — consumer `aria-describedby` shadows `internals.ariaDescription` and silently drops internal validation text. Healthcare blocker. | PARTIAL — when consumer-authored, behaves like B (drops internal text). When unauthored, behaves like A. Ownership rules don't change AT precedence. |
| **Observable for batched-framework reconciliation?** | YES — round-8 observer (with finding-1 fix) reads `oldValue` on the second of two records in the same callback batch. | YES (trivially — every consumer mutation is observable because the host attribute is canonical). | YES on consumer-authored branch (no strip); YES with same observer machinery on component-owned branch. |
| **Observable for vanilla-imperative bare `removeAttribute`?** | NO — null → null no-op fires no mutation. Stale cache persists. **DOCUMENTED LIMITATION.** | YES (every mutation observable). | YES on consumer-authored branch; NO on component-owned branch (same limit as A). |
| **Implementable without races?** | YES with finding-1 fix (disconnect/reconnect or per-record `oldValue`/`newValue` reading). | YES — no observer or counter required. | NO — ownership classification at first sync is fragile when consumer adds attribute mid-life. AccName precedence still drops internal text on consumer-authored branch. |
| **Cognitive load to copy across groups 4-10?** | MEDIUM — strip + observer + counter pattern (well-documented in code comments). | LOW — no special-case code at all. | HIGH — state machine + ownership rules + dual code paths per branch. |
| **Healthcare validation safety (the load-bearing concern)?** | SAFE — internal error text always reaches AT through `ariaDescription`. | UNSAFE — internal error text silently dropped if consumer authored their own description. | UNSAFE on consumer-authored branch (same defect as B). |

---

## 6. Decision: Option A

**Rationale:**

1. **AccName precedence is non-negotiable.** Options B and C both violate it on the consumer-authored branch. Healthcare validation messages disappearing on Firefox is unacceptable. This single criterion eliminates B and C.

2. **The bare-`removeAttribute` "limitation" is a property of the DOM, not the architecture.** Mutation observers report mutations. A no-op DOM operation is by definition not a mutation. No code change can make `removeAttribute('foo')` on an already-absent attribute fire a record. The only architecture that could "fix" it would be active polling of `getAttribute` (which we will not ship) or `Reflect.defineProperty`-style monkey-patching of `Element.prototype.removeAttribute` (which we will not ship). Round-9 finding 2 frames this as a defect; it is more accurately framed as the cost of choosing the spec-compliant channel architecture.

3. **The retraction case it forecloses is rare in practice.** Vanilla-imperative consumers calling `removeAttribute` on an already-stripped attribute is several orders of magnitude rarer than:
   - Framework-driven attach-then-detach reconciliation (Vue/React/Lit) — Round-8 observer handles this.
   - Consumer changing the value to a different token list — observable (oldValue !== null, newValue !== null with different content).
   - Consumer setting then removing in the same tick — observable (two records, oldValue on the second).
   The unobservable case is: consumer set a token at construction → component stripped it → consumer later imperatively `removeAttribute`s. This is a self-defeating sequence; the consumer's intent was already honoured (text in `ariaDescription`) and the retraction is a no-op from the consumer's perspective too (the attribute they thought existed already doesn't).

4. **Round-9 finding 1 is independently fixable.** The counter race is a 5-10 line implementation fix. It does not require an architectural revisit.

5. **Group 2's pattern does not apply here.** The scope document positioned Group 2's `hx-radio-group` as the canonical exemplar for describedby handling, but Group 2 puts `aria-describedby` on an INNER `<fieldset>` element — not on the host (`hx-radio-group.ts:482`). Group 2 never had to solve cross-shadow describedby because it never elevated describedby to the host. Group 3's host-canonical decision (round-3) is what created the problem. Reverting Group 3 to inner-element describedby is exactly Option B in the original architectural decision (host-pass-through, `installAriaIdrefMirror` only), already rejected in round-3.

---

## 7. Round-10 algorithmic spec for `_syncHostAriaSemantics` fallback branch

This is the spec the lit-specialist implements in round-10. Source: `packages/hx-library/src/components/hx-select/hx-select.ts`. Affected lines: 525-565 (connect / observer install), 838-950 (sync method fallback branch), and the `hx-select.test.ts:2303-2317` comment block (clarify intent).

### 7.1 Round-9 finding 1 fix (counter race)

**Replace the current observer callback with the disconnect-during-strip pattern.** This is simpler and more robust than per-record `getAttribute` reading.

```text
Before each strip:
  1. observer.disconnect()
  2. removeAttribute('aria-describedby')
  3. observer.observe(this, { attributes: true, attributeFilter: ['aria-describedby'], attributeOldValue: true })

The counter and the per-record getAttribute reading go away entirely.
The observer now only sees consumer-driven mutations. No discrimination logic required.
```

**Why disconnect/reconnect is preferred over per-record reading:**
- Eliminates the counter, the discriminator, and the lockstep invariant.
- Cannot drift out of phase under any batching pattern.
- Fewer LOC, fewer comments, fewer load-bearing assertions.
- No risk of self-mutation reaching the observer at all.

**Edge case to verify:** disconnect/reconnect is synchronous; a consumer mutation that happens between disconnect and reconnect is missed. Practically impossible in real consumers (no microtask boundary in our strip), but document the assumption.

### 7.2 Channel architecture (unchanged from round-6)

Modern path:
- `internals.ariaDescribedByElements = [...consumerEls, helpEl?, errorEl?]` (filtered).
- `internals.ariaDescription = null` (defensive clear).
- Host `aria-describedby` attribute is NOT stripped on the modern path. The platform handles cross-shadow resolution natively.

Fallback path:
- Strip host `aria-describedby` every sync (under the disconnect-during-strip discipline above).
- Resolve consumer-described elements via `resolveIdrefTokens` (drops unresolved tokens silently).
- Concatenate: `[consumerDescText, helpText, errorText].filter(Boolean).join(' ').trim()` → `internals.ariaDescription`.
- `_consumerDescribedBy` retains the original token list so the modern path can re-resolve if the platform later upgrades.

### 7.3 Documented contract

Update `hx-select.test.ts:2303-2317`'s comment block to call this what it is — a public contract, not an internal limitation:

> **Public contract:** When the consumer's intent is to retract a previously-set `aria-describedby` on the fallback path, they must either:
>
> 1. Use any framework-driven attach-then-detach pattern (Vue/React/Lit reactive bindings flipping from string to null/undefined within the same render commit produce two mutation records — observable).
> 2. Set the attribute to an empty string or unresolvable token list before retracting (produces an observable mutation record with non-null oldValue).
> 3. Explicitly call `el.removeAttribute('aria-describedby')` AFTER first asserting `el.hasAttribute('aria-describedby')` — if the attribute is already absent (because the component stripped it on the fallback path), the consumer has no work to do; their previously-cached description text remains active in `internals.ariaDescription` until the property/binding driving it changes through one of the above mechanisms.
>
> The bare-`removeAttribute` no-op case is unobservable by design (DOM mutations on absent attributes do not fire MutationRecord events) and is intentionally not handled. Real-world frameworks do not produce this pattern; vanilla-JS consumers who hit it are encouraged to use the explicit set-empty-then-remove sequence.

This reframes the "limitation" as documented intent and locks the contract.

### 7.4 Tests for the canonical pattern

Round-10 lit-specialist must add or update these test cases in `hx-select.test.ts`:

1. **Round-9 finding 1 regression: counter race no longer reachable.** Rapid alternating sequences of `el.setAttribute('aria-describedby', 'a')` followed by `el.removeAttribute('aria-describedby')` across multiple microtask boundaries; assert `_consumerDescribedBy` tracks correctly through every transition. The disconnect/reconnect implementation makes this test trivially pass; what we are locking is the absence of the lockstep invariant.

2. **Public contract documentation test (replaces round-8 finding-1 retraction test).** Same setup as today's `hx-select.test.ts:2303-2327`, but with three sub-cases:
   - **Framework attach-then-detach:** `setAttribute` then `removeAttribute` in same tick → `_consumerDescribedBy = null`, `ariaDescription` drops external text. (Already covered.)
   - **Set-empty-then-remove sequence:** `setAttribute('aria-describedby', '')` (observable) then `removeAttribute` → same end state. (Locks the documented contract.)
   - **Bare retraction is intentionally unobservable:** `removeAttribute` on already-absent attribute → `_consumerDescribedBy` retains cached value. Test assertion documents this is BY DESIGN, with a comment pointing at this decision document.

3. **Modern path is unaffected.** Existing test at line 1871 (`preserves consumer aria-describedby on the modern path through error cycle`) continues to pass without change.

4. **Healthcare-critical validation safety regression.** New test:
   - Consumer authors `<hx-select aria-describedby="custom-help">`.
   - Force fallback path.
   - Set `error="Patient ID required"`.
   - Assert `internals.ariaDescription` contains BOTH the consumer text AND the error text.
   - Assert host attribute `aria-describedby` is null (so AT does not shadow `ariaDescription` per AccName 1.2).
   - This is the canonical "this is why we strip" assertion.

### 7.5 Notes for groups 4-10

The pattern Round-10 codifies is the canonical fallback describedby pattern for any component in groups 4-10 that elevates ARIA to the host:

- If your component does NOT elevate describedby to the host (i.e. you put `aria-describedby` on an inner element like Group 2's radio-group does on the inner fieldset), you do NOT need this pattern. Inner-element describedby works without modification on every engine. Strongly prefer this approach when the component's role surface naturally lives on an inner element.
- If your component DOES elevate describedby to the host (true for combobox/listbox patterns where APG does not have a "host" role and we are synthesising one), you MUST adopt the strip + concatenate fallback pattern documented here. Reference site after round-10: `packages/hx-library/src/components/hx-select/hx-select.ts:838-950`.
- The disconnect-during-strip pattern (round-10 finding-1 fix) is the canonical observer discipline. Do NOT re-introduce a pending-strip counter in any component — it adds a load-bearing invariant that is fragile across batching patterns.
- The public contract for vanilla-imperative bare-`removeAttribute` retraction is documented (section 7.3 above). Copy that comment block into each component that adopts this pattern, with the appropriate component name substituted.

---

## 8. Implementation guidance for round-10 lit-specialist

1. Apply round-9 finding 1 fix per section 7.1 (disconnect-during-strip; remove counter and discriminator).
2. Update test comment per section 7.3 (reframe limitation as public contract).
3. Add tests per section 7.4. The healthcare-critical validation safety test (item 4) is the load-bearing assertion — if it ever regresses, the architecture is broken.
4. Do NOT touch the modern path code.
5. Do NOT change the strip behaviour itself — only the observer discipline around it.
6. After round-10, the public surface area for round-11 codex review is: the disconnect-during-strip discipline, the contract documentation, and the four new tests.

Estimated effort: 1.5 hours implementation + 1 hour codex iteration. Lower than typical round because we are tightening, not redesigning.

---

## 9. Cross-framework notes

- **Drupal (Twig + Drupal behaviors):** Drupal renders attributes server-side; `aria-describedby` is rendered once at first paint and rarely mutated. The fallback path's strip happens once, and the consumer's `aria-describedby` cached value drives `ariaDescription` for the lifetime of the element. No edge case.
- **React:** React's reconciliation produces attach-then-detach when a binding flips from string to null. Round-8's observer (after finding-1 fix) handles this correctly via the disconnect-during-strip discipline.
- **Vue:** Same as React.
- **Vanilla JS:** Consumers must use one of the three documented retraction sequences (section 7.3). The bare-`removeAttribute` no-op case is documented as intentionally unobservable.

---

## 10. Citations

- W3C AccName 1.2 description precedence: `/Volumes/Development/booked/data/web-llm-kb/Sources/W3C-ARIA/ARIA Spec - AccName.md` lines 108-149.
- W3C AccName 1.2 must-not-fall-through clause: same file, line 108: "User agents MUST NOT use any markup other that the first relevant markup found, even if that markup results in an empty description."
- Group 2 reference (does NOT use this pattern; describedby is on inner fieldset): `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:482`.
- Round-3 architectural decision (host-canonical combobox): `.reports/aria-group-3-scope.md` section 6, round-3 update.
- Round-6 single-channel decision (this document confirms): `.reports/aria-group-3-scope.md` section 6, round-6 update.
- Round-8 retraction observer (this document tightens, does not replace): `packages/hx-library/src/components/hx-select/hx-select.ts:425-461, 518-565`.
- Round-9 finding 1 (counter race — fixed in round-10 per section 7.1): codex audit log.
- Round-9 finding 2 (architectural question — answered Option A in this document): codex audit log.

---

## 11. What this decision is NOT

- It is NOT a re-litigation of round-3's host-canonical decision. The host IS the announced combobox. That stays.
- It is NOT a re-litigation of round-6's single-channel decision. The strip stays.
- It is NOT a claim that round-8's observer was wrong. It was right in shape, wrong in implementation detail (the counter race). Round-10 simplifies the implementation.
- It is NOT permission to expand `_consumerDescribedBy` ownership rules into a state machine. Option C is rejected.

End of decision document.
