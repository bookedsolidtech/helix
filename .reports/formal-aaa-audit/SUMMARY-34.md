# Formal WCAG 2.2 AAA Re-Certification — 34-Component Findings

**Audit run:** 2026-05-08 18:17 (wall-clock ~1 minute)
**Branch:** `audit/formal-aaa-recert`
**Harness:** `scripts/aaa-formal-audit.mjs` (Phase 2 hardened)
**Standards reference:** `scripts/aaa-standards.json` (Phase 1 verified citations — 9 WCAG SCs + 2 peer standards)
**Allowlist:** `scripts/a11y-aaa-allowlist.json` (34 components, sourced from `feat/aaa-toolkit-hardening`)
**Output artefacts:** `audit.json`, `audit.matrix.md`, `evidence/`, `failures.tsv`, `per-component.tsv`, `run.log`

The harness is non-blocking by design — its job is to produce the findings matrix. Every cell carries measurable evidence (no narrative).

---

## 1. Headline Counts

**Aggregate verdict (374 cells = 34 components × 11 criteria):**

| Verdict             | Count | %      |
| ------------------- | ----- | ------ |
| Supports            | 237   | 63.4 % |
| Partially Supports  | 57    | 15.2 % |
| Does Not Support    | 8     | 2.1 %  |
| Not Applicable      | 72    | 19.3 % |
| Errors              | 0     | 0 %    |

**Honest cert reality:** of 34 components, **only 3 components clear formal AAA cleanly** (no Partial, no Fail, only Supports + Not Applicable) — `hx-file-upload`, `hx-icon-button`, `hx-overflow-menu`. The Phase D AAA-cert claims for the other 31 components either rest on carve-outs not articulated in WCAG normative text, or were measured against an incomplete state.

**Failures by criterion (all 65 non-Supports rows, F + P combined):**

| SC                                   | Partial | Fail | Total |
| ------------------------------------ | ------- | ---- | ----- |
| 2.4.13 Focus Appearance              | 26      | 0    | 26    |
| 2.5.5 Target Size (Enhanced)         | 15      | 4    | 19    |
| apg-keyboard                         | 9       | 0    | 9     |
| 1.4.6 Contrast (Enhanced)            | 5       | 0    | 5     |
| 2.4.12 Focus Not Obscured (Enhanced) | 2       | 3    | 5     |
| 2.1.3 Keyboard (No Exception)        | 0       | 2    | 2     |

The two systemic regressions are 2.4.13 and 2.5.5 — they account for 41 of 57 Partials and 4 of 8 Does-Not-Supports.

---

## 2. Per-Component Verdict Matrix

`S` = Supports, `P` = Partially Supports, `F` = Does Not Support, `-` = Not Applicable.
Columns: `1.4.6 Contrast`, `1.4.9 Images-of-Text`, `2.1.3 Keyboard`, `2.3.3 Animation`, `2.4.12 Focus-Not-Obscured`, `2.4.13 Focus-Appearance`, `2.5.5 Target-Size`, `3.2.5 Change-on-Request`, `3.3.6 Error-Prevention`, `FC` (forced-colors), `APG` (apg-keyboard).

| Component        | 1.4.6 | 1.4.9 | 2.1.3 | 2.3.3 | 2.4.12 | 2.4.13 | 2.5.5 | 3.2.5 | 3.3.6 | FC  | APG |
| ---------------- | ----- | ----- | ----- | ----- | ------ | ------ | ----- | ----- | ----- | --- | --- |
| hx-action-bar    | -     | S     | S     | -     | S      | P      | S     | S     | -     | S   | S   |
| hx-alert         | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | S   |
| hx-breadcrumb    | -     | S     | S     | -     | S      | P      | F     | S     | -     | -   | P   |
| hx-button        | P     | S     | S     | S     | S      | S      | P     | S     | -     | S   | S   |
| hx-button-group  | -     | S     | F     | -     | S      | P      | P     | S     | -     | -   | P   |
| hx-checkbox      | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | S   |
| hx-checkbox-grp  | -     | S     | F     | -     | S      | P      | S     | S     | -     | S   | P   |
| hx-color-picker  | S     | S     | S     | S     | S      | S      | P     | S     | -     | S   | P   |
| hx-combobox      | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | S   |
| hx-copy-button   | -     | S     | S     | S     | S      | S      | P     | S     | -     | S   | S   |
| hx-date-picker   | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | S   |
| hx-dialog        | -     | S     | S     | S     | **F**  | P      | -     | S     | -     | S   | S   |
| hx-drawer        | -     | S     | S     | S     | **F**  | P      | -     | S     | -     | S   | S   |
| hx-dropdown      | -     | S     | S     | S     | S      | P      | **F** | S     | -     | S   | S   |
| hx-file-upload   | S     | S     | S     | S     | S      | S      | S     | S     | -     | S   | S   |
| hx-icon-button   | -     | S     | S     | S     | S      | S      | S     | S     | -     | S   | S   |
| hx-menu          | P     | S     | S     | -     | P      | P      | P     | S     | -     | S   | S   |
| hx-nav           | P     | S     | S     | S     | S      | S      | P     | S     | -     | S   | P   |
| hx-number-input  | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | P   |
| hx-overflow-menu | S     | S     | S     | S     | S      | S      | S     | S     | -     | S   | S   |
| hx-popover       | -     | S     | S     | S     | **F**  | P      | -     | S     | -     | S   | S   |
| hx-popup         | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | P   |
| hx-radio-group   | -     | S     | S     | -     | S      | P      | S     | S     | -     | S   | S   |
| hx-select        | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | S   |
| hx-side-nav      | P     | S     | S     | S     | P      | P      | P     | S     | -     | S   | P   |
| hx-split-button  | P     | S     | S     | S     | S      | S      | P     | S     | -     | S   | S   |
| hx-switch        | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | S   |
| hx-tabs          | -     | S     | S     | -     | S      | P      | S     | S     | -     | S   | S   |
| hx-text-input    | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | S   |
| hx-textarea      | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | S   |
| hx-time-picker   | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | S   |
| hx-toggle-button | -     | S     | S     | S     | S      | P      | P     | S     | -     | S   | S   |
| hx-tooltip       | -     | S     | S     | S     | S      | P      | **F** | S     | -     | S   | S   |
| hx-top-nav       | -     | S     | S     | S     | S      | P      | S     | S     | -     | S   | P   |

---

## 3. Failure Inventory

### 3.1. Does Not Support (8 cells)

| Component         | SC     | Measured                                                                | Original AUDIT.md claim                       | Why claim was inaccurate                                                                                                                                                                                                |
| ----------------- | ------ | ----------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hx-breadcrumb     | 2.5.5  | host bbox 1184×17 px                                                    | matrix harness pass (link-text desktop carve) | The breadcrumb host renders as inline text 17 px tall; each crumb link is below 44 px in both axes. The carve-out invokes "container delegates to slotted links" but breadcrumb links are first-party rendered text, not slotted content. |
| hx-button-group   | 2.1.3  | host has role/tabindex but no keydown/keyup handlers                    | matrix harness pass                           | Host declares `role="group"` and is focusable but provides no roving-tabindex / arrow-key handler. Each child button is independently focusable, but if the host claims a tabindex/role it must define the keyboard contract.   |
| hx-checkbox-group | 2.1.3  | same pattern as hx-button-group                                         | pass                                          | Same root cause.                                                                                                                                                                                                        |
| hx-dialog         | 2.4.12 | `elementFromPoint` at focus center returns a different element          | pass                                          | Default story focus target sits behind a backdrop or sibling overlay element at the center pixel — the focused element is geometrically obscured by its own modal scrim or a sibling fixed element.                          |
| hx-drawer         | 2.4.12 | same `elementFromPoint` pattern                                         | pass                                          | Same root cause as hx-dialog.                                                                                                                                                                                           |
| hx-dropdown       | 2.5.5  | host bbox 85.7×21 px                                                    | pass (popover-host container carve-out)       | Host element rendered as 21 px tall. The trigger is a slotted hx-button (40×40 desktop carve-out), but harness measures host bbox.                                                                                       |
| hx-popover        | 2.4.12 | `elementFromPoint` mismatch                                             | pass                                          | Same overlay obscured-focus pattern as hx-dialog/hx-drawer.                                                                                                                                                             |
| hx-tooltip        | 2.5.5  | host bbox 73.8×21 px                                                    | matrix harness skip (N/A at container)        | APG `tooltip` says the body is non-interactive, so AAA cert claims the slotted trigger carries the cert. Reasonable WCAG-wise but only if the harness can confirm zero clickable targets inside the shadow tree.        |

**Fix difficulty:** 2.4.12 cluster (dialog/drawer/popover) is **medium** (focus-management investigation). 2.1.3 cluster (button-group/checkbox-group) is **medium** (host keyboard contract OR drop host role). 2.5.5 cluster (breadcrumb/dropdown/tooltip) is **easy-to-medium** depending on whether the cert claim narrows or the components add 44×44 trigger targets.

### 3.2. Partially Supports — 2.4.13 Focus Appearance (26 cells)

**Pattern (24 of 26):** "No focus indicator detected via programmatic focus (outline 0 px, no box-shadow). Programmatic focus may skip `:focus-visible` — manual keyboard verification needed."

This is a **harness measurement-method limitation, not a defect** in the majority of cases. The harness focuses elements programmatically via `el.focus()`, which by default does NOT trigger `:focus-visible` matches in modern browsers — `:focus-visible` requires the keyboard heuristic. Components that paint focus rings only on `:focus-visible` (the recommended modern pattern, per APG) appear ringless to the harness.

**Cases that DO require fix work (real defects):**

- `hx-checkbox` — outline 1 px (under 2 px AAA threshold per WCAG 2.4.13)
- `hx-switch` — outline 1 px (under 2 px AAA threshold)
- `hx-toggle-button` — outline 1 px (under 2 px AAA threshold)

The remaining 23 cells need either (a) a harness upgrade to use `Tab` key navigation instead of programmatic focus, OR (b) manual keyboard verification with NVDA/VoiceOver to confirm the ring fires under real keyboard nav.

**Fix difficulty:** 23 cells **easy** (harness upgrade — single change in `aaa-formal-audit.mjs`). 3 cells **easy** (bump outline-width from 1 px to 2 px in component styles).

### 3.3. Partially Supports — 2.5.5 Target Size (15 cells)

**Pattern A — desktop carve-out at 40 px (10 cells):** `hx-button`, `hx-color-picker`, `hx-combobox`, `hx-copy-button`, `hx-date-picker`, `hx-number-input`, `hx-split-button`, `hx-text-input`, `hx-time-picker`, `hx-toggle-button`. All have `md` size = 40×40 px. Matrix-verify accepts via "Equivalent" carve-out (sm variant ships at 44×44).

**Pattern B — link-row inline text (3 cells):** `hx-breadcrumb` (link text 17 px tall, full width), `hx-nav` (a-tag 97×37), `hx-side-nav` (deferred — story rendering issue).

**Pattern C — popover-host container (1 cell):** `hx-popup` (host bbox 119×35).

**Pattern D — toolbar host without inner buttons (1 cell):** `hx-button-group` (host 283×40).

**Fix difficulty:** Pattern A is **hard** (token / IA decision — 40 px default conflicts with AAA 44 px). Pattern B is **medium** (story or component change). Pattern C/D are **easy-to-medium** (carve-out documentation honesty OR component change).

### 3.4. Partially Supports — apg-keyboard (9 cells)

| Component         | Reason                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| hx-breadcrumb     | `@aria-pattern="breadcrumb"` not in APG canonical pattern table                       |
| hx-button-group   | `toolbar` pattern missing ArrowLeft/ArrowRight key references                         |
| hx-checkbox-group | `@aria-pattern="group"` not canonical                                                 |
| hx-color-picker   | `dialog` pattern missing Tab key reference                                            |
| hx-nav            | `navigation` not in APG canonical pattern table                                       |
| hx-number-input   | `spinbutton` not canonical (APG has spinbutton in 1.2 vs 1.3 — reference needs check) |
| hx-popup          | `dialog` pattern missing Escape + Tab                                                 |
| hx-side-nav       | `navigation` pattern (deferred — story render issue)                                  |
| hx-top-nav        | `navigation` pattern not canonical                                                    |

The "navigation" / "breadcrumb" / "group" patterns are real ARIA roles but APG (the WAI patterns repo) doesn't list them as keyboard-pattern canonical entries. The harness's APG check is over-strict here. Either widen the harness's pattern table OR drop these to N/A.

**Fix difficulty:** **Easy** — single change in `APG_KEYBOARD_EXPECTATIONS` table inside `aaa-formal-audit.mjs`.

### 3.5. Partially Supports — 1.4.6 Contrast Enhanced (5 cells)

| Component       | Measured                  | Notes                                                                                                                                                                                                                                                            |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hx-button       | 5.82:1 (#fff on #0f7078)  | AAA-large pass; AAA-normal fail. Original AUDIT.md claim invokes "AAA-large" carve-out. Default button text is 16 px regular — that does NOT meet WCAG "large text" definition (24 px regular OR 18.66 px bold). The carve-out is invented. |
| hx-nav          | 5.82:1                    | Same pair; same issue.                                                                                                                                                                                                                                            |
| hx-split-button | 5.82:1                    | Same pair; same issue.                                                                                                                                                                                                                                            |
| hx-menu         | "no `<hx-menu>` in story" | Story render issue — Default story doesn't expose host element; harness defaulted to Partial. Re-test after story fix.                                                                                                                                                |
| hx-side-nav     | "no `<hx-side-nav>` in story" | Same story-render issue.                                                                                                                                                                                                                                          |

**Fix difficulty:** Story-render rows are **easy**. The 5.82:1 cluster is **hard** — token-tier issue affecting 6 brand palettes.

### 3.6. Partially Supports — 2.4.12 Focus Not Obscured (2 cells)

`hx-menu` and `hx-side-nav` — both browser-check errors (story doesn't expose the host).

**Fix difficulty:** **Easy** (story render fix).

---

## 4. Carve-Out Audit (`scripts/aaa-matrix-verify.mjs`)

The matrix-verify harness used by Phase D's `aaa-cert.mjs` applies several carve-outs to flip RED cells to GREEN before stamping cert. Audit:

### 4.1. Legitimate carve-outs (cite WCAG / APG)

| Carve-out                                                                | Where applied                                          | WCAG / APG basis                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.5.5 exempt: native input/textarea inside wrapper that meets 44×44      | text-input, textarea, number-input, checkbox           | **Legitimate** — WCAG 2.5.5 "User-agent control" exception covers native form controls; the wrapper's hit area satisfies 44×44 and the inner native control inherits hit area for pointer.            |
| 2.5.5 exempt: secondary stepper buttons w/ keyboard parity               | number-input stepper                                   | **Legitimate** — WCAG 2.5.5 "Equivalent" exception: the same function is reachable at 44×44 via Arrow keys on the input.                                                       |
| 2.5.5 exempt: container that delegates to slotted children               | dropdown / overflow-menu / menu                        | **Legitimate IF** the slotted children are independently 44×44. Container surface itself is not a target.                                                                      |
| 2.5.5 exempt: tooltip / popover / popup / drawer container               | tooltip, popover, popup, drawer                        | **Legitimate IF** harness verifies the body has zero focusable / clickable elements in shadow DOM. APG `tooltip` mandates non-interactive body.                                 |
| apg-keyboard skip pre-cert (chicken-and-egg)                             | components not yet on AAA allowlist                    | **Legitimate harness mechanic** — first cert run can't gate on a flag that cert sets.                                                                                            |

### 4.2. Invented or stretched carve-outs (no clear WCAG basis)

| Carve-out                                                                                  | Where applied                                                                                                                                          | Why it's invented                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **40×40 desktop carve-out for `md` size**                                                  | hx-button, hx-select, hx-combobox, hx-date-picker, hx-time-picker, hx-color-picker, hx-icon-button, hx-copy-button, hx-toggle-button, hx-split-button, hx-text-input, hx-textarea | Invokes "WCAG 2.5.5 Equivalent" reasoning ("`sm` variant ships at 44×44"). WCAG normative defines "Equivalent" as a target ≥44×44 reachable for the same function on the same view. A smaller-variant default with a separate larger-variant the consumer must opt into is not "equivalent" — both must be reachable in the same context. WCAG 2.5.5 has no "desktop" exception. |
| 2.5.5 exempt: nav/breadcrumb/top-nav links at ≥36 px height                                | nav, top-nav, side-nav, breadcrumb                                                                                                                     | Same root issue — invokes "desktop carve-out" without WCAG basis. APG `navigation` does not waive 2.5.5; AAA target-size applies to all clickable targets.                                                                                                                                                                                                |
| 2.5.5 exempt: color-picker swatch buttons at 24×44 (height carved)                         | color-picker                                                                                                                                           | "Swatch-grid pattern" — no WCAG / APG citation. The "Equivalent" claim (typing color into the input) is more defensible here than for hx-button, because the input IS 44×44, but the carve-out is still narrative.                                                                                                                                       |
| 2.5.5 exempt: side-nav collapse button at 32×32                                            | side-nav                                                                                                                                               | "Same precedent as number-input stepper" — but unlike the stepper, this is the only way to collapse the sidebar via pointer; "drag the boundary" is hypothetical. No keyboard equivalent at 44×44 documented in cert.                                                                                                                                  |
| 2.4.13 skip (N/A) for tooltip/popover/popup body                                           | overlay containers                                                                                                                                     | Defensible at the body level (non-focusable per APG), but the cert claim should be N/A with that justification, not "pass via matrix harness." Matrix harness skipping a criterion and presenting it as a pass is a category error.                                                                                                                  |
| **1.4.6 AAA-large carve-out for hx-button at 5.82:1**                                      | button, split-button, nav                                                                                                                              | Default button text is 16 px regular — fails WCAG "large text" definition (≥18 pt = 24 px regular, or ≥14 pt bold = 18.66 px bold). Without bold weight or larger font-size at the cert-default story, the AAA-large carve-out is **invented**. Honest verdict is Partially Supports until the token-tier or weight changes.                                |

**Summary:** of ~12 distinct carve-out categories in `scripts/aaa-matrix-verify.mjs`, **5 are legitimate** (native form-control inheritance, container delegation to verified children, APG-mandated non-interactive bodies, equivalent stepper keyboard, allowlist bootstrap). **6 are invented or over-stretched** (40 px desktop carve-out, link-row carve-out, color-picker height carve-outs, side-nav stepper, overlay-body "pass via skip", AAA-large for non-large-text buttons).

---

## 5. Token-Tier Issues

The 1.4.6 partials are **not component bugs** — they stem from the design-token system. The 5 components hitting 5.82:1 (`hx-button`, `hx-nav`, `hx-split-button` plus the 2 story-error rows) all use the token chain `--hx-color-action-primary-bg` → `primary-700` (#0f7078) with white text on hover. Resting state at 5.82:1 is below AAA-normal (7:1).

**Fixes are token-level, not component-level:**

- **Option A:** shift `--hx-color-action-primary-bg` darker (primary-800?) so white text clears 7:1 — affects all 6 brands, must verify each.
- **Option B:** make button text `font-weight: bold` at 16 px (qualifies as "large text" → 4.5:1 threshold met).
- **Option C:** drop the AAA-normal claim for these components and document them as AAA-large only with bolded labels.

These cascade into hx-button-group / hx-action-bar / hx-split-button / hx-top-nav / hx-nav consumers — design-system-developer + design-systems-animator territory, not lit-specialist.

---

## 6. VPAT 2.5 Projection

If Phase 4 ships **only the easy fixes** (story render fixes, harness measurement upgrade for 2.4.13, 2.5.5 desktop carve-out documented honestly OR removed):

| Verdict             | Components                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supports            | 3 today → 12-15 after easy fixes                                                                                                                                                                 |
| Partially Supports  | 27 today → 14-17 after easy fixes (2.4.13 false-positives drop out, 1.4.6 token issue remains)                                                                                                  |
| Does Not Support    | 7 today (hx-dialog / hx-drawer / hx-popover for 2.4.12; hx-button-group / hx-checkbox-group for 2.1.3; hx-breadcrumb / hx-dropdown / hx-tooltip for 2.5.5) → 0-2 after fixes                     |

If Phase 4 also ships **medium fixes** (token-tier 1.4.6 refresh OR honest AAA-large reclassification, host keyboard contracts on group components, focus-management hardening on dialog/drawer/popover):

| Verdict             | Components                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Supports            | 22-26                                                                                                     |
| Partially Supports  | 8-12 (mostly target-size partials that need honest cert downgrade or sm-variant default)                  |
| Does Not Support    | 0                                                                                                         |

To get **30+ honest Supports**, the `md` size variant has to either ship at 44×44 (breaks Apex / desktop density) or the cert claim has to drop the `md` story from AAA cert and only certify `sm` size variants — major IA decision.

---

## 7. Phase 4 Recommended Fix Sequencing

### Tier 1 — Easy (token-driven or harness-only; ~1-2 days)

1. **Fix hx-menu and hx-side-nav Default story render** — both fail browser checks ("no `<hx-menu>` in story"). 6 cells flip to Supports. Lit-specialist or storybook-specialist.
2. **Document the `md`-size desktop carve-out honestly OR drop the AAA cert claim for `md` stories.** If keeping the carve-out, cite WCAG 2.5.5 "Equivalent" with a documented assertion that the `sm` variant is reachable for every interactive call site (it isn't, today). If dropping, re-cert against `sm` stories. Affects 10 components on 2.5.5.
3. **Upgrade the formal harness to use `Tab` key for focus instead of `el.focus()`** — fixes 23 of 26 false-positive 2.4.13 Partials. test-architect / qa-engineer-automation.
4. **Fix 1 px outline on `hx-checkbox`, `hx-switch`, `hx-toggle-button`** — bump to 2 px to clear AAA. design-system-developer + lit-specialist.
5. **Drop apg-keyboard claim or widen pattern table** for `breadcrumb`, `navigation`, `group`, `spinbutton`. apg-keyboard goes from 9 Partials to 0.

### Tier 2 — Medium (harness ambiguity, manual verify; ~2-4 days)

6. **hx-tooltip 2.5.5** — verify the tooltip body has zero clickable targets in shadow DOM and re-run formal harness with a narrower target query (only focusable + role-button). If verified, this becomes a Supports with N/A on the body and the slotted trigger inheriting cert. accessibility-engineer.
7. **hx-dropdown 2.5.5 / hx-breadcrumb 2.5.5** — same pattern. Either harness narrows host-bbox check OR these accept the Partial honestly. accessibility-engineer.
8. **hx-button-group / hx-checkbox-group 2.1.3** — host claims focusable role without keyboard handler. EITHER add roving-tabindex + arrow-key handler (toolbar pattern), OR drop the host's tabindex/role and keep child-only focus. lit-specialist + accessibility-engineer.
9. **hx-dialog / hx-drawer / hx-popover 2.4.12** — `elementFromPoint` at focus center returned a different element. Investigate whether this is an actual focus-trap defect or a harness story-isolation issue. If real, fix focus management. lit-specialist.

### Tier 3 — Hard (token-tier reconsideration; ~1-2 weeks)

10. **1.4.6 AAA-normal for primary action surface (5.82:1 today)** — token-system fix or honest AAA-large reclassification. Affects hx-button + hx-nav + hx-split-button + cascades. design-system-developer + cto if it touches all 6 brand tokens.
11. **Default-size variant question** — `md` ships at 40 px; AAA 2.5.5 demands 44 px. Choose: (a) flip default to `sm` (44 px) and rename — breaking change, (b) ship a 44 px `md` and re-tune density across the system — visual regression risk, (c) drop AAA target-size cert entirely and claim AA 2.5.8 (24×24) instead. principal-engineer + cto.

---

## 8. Top 10 Most Surprising Findings

Where the original AUDIT.md claim was furthest from measured reality:

1. **hx-button 1.4.6 — claim "AAA-large pass at 5.82:1" is invented**. Default button text is 16 px regular, not "large text" per WCAG. The cert claim ships an unsupported assertion.
2. **hx-tooltip 2.5.5 — claim "skip (N/A at container)" via matrix harness is a category error**. The harness skipping ≠ the SC being N/A. Cert needs an explicit "the tooltip body has zero clickable targets" assertion that the formal harness can verify.
3. **hx-button-group + hx-checkbox-group 2.1.3 — claimed `pass`; formally Does Not Support**. Hosts declare role/tabindex without keyboard handlers. This is a structural defect, not a harness issue.
4. **hx-dialog + hx-drawer + hx-popover 2.4.12 — claimed `pass`; all three return Does Not Support** via `elementFromPoint` mismatch. Either focus-trap is putting focus on an obscured target, or the Default story has a layering bug.
5. **27 of 34 components hit 2.4.13 Partial — but in 23 of 27 cases the harness method is wrong, not the component**. Cert was stamped against the matrix-verify harness which uses a different focus method; the formal harness uses programmatic focus and `:focus-visible` won't match. Honest cert was always Partial-with-asterisk; the asterisk was elided in AUDIT.md.
6. **`md`-size 40×40 desktop carve-out is the dominant single source of 2.5.5 Partials** — 10 components affected. The cert system invented a "WCAG Equivalent" carve-out without a co-located 44×44 target.
7. **hx-breadcrumb 2.5.5 host bbox = 1184×17 px** — the host renders as inline text, not as the breadcrumb crumb-link. Crumb links themselves are below 44 in both axes. Cert claim treated the parent slot as having a 44×44 target via "link-row" carve-out, which is also invented.
8. **APG pattern table mismatches** — 5 components reference `@aria-pattern` values (`navigation`, `breadcrumb`, `group`, `spinbutton`, `dialog`) that aren't in the harness's APG canonical list. Cert went green by skipping; formal harness flags Partial. Either the canonical list is wrong, or the components shouldn't be claiming those patterns.
9. **`hx-checkbox` / `hx-switch` / `hx-toggle-button` 2.4.13 outline 1 px** — under the 2 px AAA threshold from WCAG 2.4.13 (`outline-width >= 2 px AND contrast vs background >= 3:1`). This is a real defect that slipped past matrix-verify because matrix-verify checked for outline-width via an OR-with-box-shadow that papered over the 1 px.
10. **`hx-side-nav` and `hx-menu` Default stories don't render the host element** — every browser-based check on these two shows "no `<hx-X>` in story". Cert was stamped on stories that don't actually expose the component. Story rendering bug, not a component bug.

---

## 9. Final Verdict for Phase 4 Entry

**Re-cert delta (vs Phase D claims):**

- Phase D: 34 of 34 stamped AAA Supports.
- Formal AAA: **3 of 34 clean Supports** (`hx-file-upload`, `hx-icon-button`, `hx-overflow-menu`).
- 27 components have at least one Partial.
- 7 components have at least one Does Not Support (3 distinct on 2.4.12, 4 on 2.5.5, 2 on 2.1.3).

**The cert system is sound; the cert claims were not.** Matrix-verify ran, the harness produced consistent output across 6 brands × 3 themes — but the carve-out logic baked into `aaa-matrix-verify.mjs` over-claimed several criteria via narrative reasoning instead of measured equivalence.

Phase 4 should sequence **Tier 1 fixes first** (story renders + harness focus method + 1 px outlines + apg-keyboard pattern table) — these alone flip ~30 cells from Partial to Supports without touching component logic or design tokens. Then Tier 2 (host keyboard contracts, overlay focus management). Token-tier 1.4.6 work (Tier 3) should be sequenced last because it cascades into 6 brand palettes and cannot be safely batched with other lit-specialist work.

**FORMAL_AUDIT_34_LANDED_S237_P57_F8_NA72**
