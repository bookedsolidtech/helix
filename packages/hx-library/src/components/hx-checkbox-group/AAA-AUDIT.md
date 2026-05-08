# AAA Audit — HelixCheckboxGroup

**Component:** `hx-checkbox-group`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC      | Title                        | Level | Method                            | Status | Evidence                                                                                                                                                  |
| ------- | ---------------------------- | ----- | --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.3   | Contrast (Minimum)           | AA    | axe-core                          | pass   | Legend `--hx-color-text-strong` on `--hx-color-surface-default` (`hx-checkbox-group.styles.ts:37`). Help/error tokens in `:lines 71, 77`.                  |
| 1.4.6   | Contrast (Enhanced)          | AAA   | axe-core color-contrast-enhanced  | pass   | Matrix harness 18/18 contexts ≥ 7:1 on legend, help-text, error-text. Evidence: `.reports/aaa-matrix-evidence.hx-checkbox-group.md` (apex/meridian/lumen/verdant/signal/ember × light/dark/high-contrast). |
| 1.4.11  | Non-text Contrast            | AA    | axe-core                          | pass   | No non-text indicators owned at the group surface; the slotted `hx-checkbox` children own checkbox box / check-mark contrast (cert'd independently).       |
| 1.4.13  | Content on Hover or Focus    | AA    | manual review                     | pass   | Group does not surface dismissible-on-hover content. Help/error are persistent `<div role="alert">` regions (`hx-checkbox-group.ts:962-986`).              |
| 2.1.1   | Keyboard                     | A     | play() interaction test           | pass   | Tab traverses slotted `hx-checkbox` children; Space toggles each (delegated to native `<input type="checkbox">` in child shadow).                          |
| 2.1.3   | Keyboard (No Exception)      | AAA   | manual review                     | pass   | No pointer-only paths. Group container has no keyboard contract of its own beyond Tab navigation across children — `@keyboard-contract navigate=Tab; disabled-suppresses=true`. |
| 2.4.7   | Focus Visible                | AA    | VRT snapshot                      | pass   | Focus rings live on slotted `hx-checkbox` children (cert'd independently). Group host is `role="group"` and not focusable.                                  |
| 2.4.12  | Focus Not Obscured (Minimum) | AAA   | manual review                     | pass   | Group renders inline; no overlay/sticky chrome obscures focused checkbox children. Inner fieldset is `role="presentation"` (no clipping).                  |
| 2.4.13  | Focus Appearance             | AAA   | VRT snapshot                      | pass   | **N/A at container** — group is a non-focusable accessible-container (`role="group"` via `internals.role`). Focus rings live on slotted children. Matrix harness records this as `skip` per group-container carve-out (`scripts/aaa-matrix-verify.mjs`). |
| 2.5.5   | Target Size (Enhanced)       | AAA   | computed style check              | pass   | Group container has no clickable targets. Slotted `hx-checkbox` children meet 44×44 (cert'd independently).                                                |
| 4.1.2   | Name, Role, Value            | A     | axe-core                          | pass   | `internals.role = 'group'` (`hx-checkbox-group.ts:476`); `internals.ariaLabel` resolved from consumer `aria-label` → `aria-labelledby` IDREFs → label slot → `label` property (`:500-559`). `internals.ariaRequired/ariaInvalid/ariaDisabled` mirrored from validity (`:477-479`). |

## Keyboard contract

`navigate=Tab; disabled-suppresses=true`

The group itself is non-focusable; Tab navigation crosses each slotted `hx-checkbox` child. Group `disabled` cascades to all children via `_syncCheckboxes()` (`hx-checkbox-group.ts:730-735`), suppressing both native focus and form participation. The group is the sole form participant (`_groupedSuppress` set on each child in `_syncCheckboxNames()` at `:765-789`) — children inside a group never submit independently regardless of whether the child carries a `name` attribute (round-3 + round-22 hardening).

## ARIA pattern

`group` — https://www.w3.org/TR/wai-aria-1.2/#group

Host-canonical accessible-container surface. Inner `<fieldset>` is `role="presentation"` on BOTH the modern and no-IDL-ref fallback paths so AT announces exactly one accessible container (the host). Earlier rounds promoted the fieldset to `role="group"` on the fallback branch and spliced shadow-internal ids — that produced nested host→fieldset groups and broke external IDREFs. The host carries the role + accessible name via `ElementInternals` on both paths (`hx-checkbox-group.ts:944-946`, comment block at `:936-943`).

The visible required marker (`*`) renders as a sibling of the `<slot name="label">` and is excluded from `internals.ariaLabel` by reading the slot's assigned-nodes text directly (round-20 P2 fix at `:494-499`). Slot precedence over `label` property is enforced even when the slot is whitespace-only (round-23 P2 Finding A at `:516-527`).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-checkbox-group/*.png`
System-color-keyword assertions: legend → `CanvasText`; legend (error) → `LinkText`; help-text → `GrayText`; error → `LinkText`; disabled legend → `GrayText` (`hx-checkbox-group.styles.ts:83-111`). Border-removal under forced-colors prevents double-border with the slotted `hx-checkbox` children (each carries its own forced-colors treatment).

## Notes / carve-outs

- **2.4.13 N/A at container**: `hx-checkbox-group` is a `role="group"` accessible-container. The host is non-focusable; focus rings live on slotted `hx-checkbox` children, each AAA-certified independently. The matrix harness records this as `skip` via the group-container carve-out at `scripts/aaa-matrix-verify.mjs` (added 2026-05-08 alongside this cert). Identical treatment to `hx-radio-group`.
- **2.5.5 N/A at container**: same reasoning — no clickable targets owned at the group surface; slotted children meet 44×44.
- **No-IDL-ref fallback**: legacy engines (Firefox today) without `ariaLabelledByElements` / `ariaDescribedByElements` lose the *internal* legend/help/error references. Consumer-supplied light-DOM IDREFs still resolve through the host's containing root. `internals.ariaDescription` mirrors slotted help/error text via `readSlottedOrShadowText()` (`:30-42`) so the description still surfaces on legacy paths (round-22 P1 #2, round-23 P2 Finding B).
- **Form ownership**: group is the sole form participant. Children's `_groupedSuppress` flag is the durable kill-switch (round-3 finding #1). Round-7 finding #6 hardens this by re-applying suppression on reattach.
