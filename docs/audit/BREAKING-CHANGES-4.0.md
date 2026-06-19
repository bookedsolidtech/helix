# HELiX 4.0 Breaking-Change Backlog

Every item here is a **deliberately deferred** breaking change surfaced by the 3.x
audit ([AUDIT-3x-register.md](./AUDIT-3x-register.md)). None of these land under 3.x.
Each lists the **3.x compat shim** (if any) that bridges consumers toward it, so the
4.0 migration is a removal of already-deprecated behavior rather than a surprise.

**Rule of thumb:** a change is 4.0 if it *removes or renames* a public
attribute, property, event field, slot, CSS part, CSS custom property, or variant
value — i.e. anything `api-breaking-change-detection` (H18) flags as a removal/retype.
Once the B-workstream gate is live, H18 is the automated arbiter of this list.

---

## 1. Design tokens

### 1.1 Remove deprecated `--hx-color-border-on-dark-*` tokens
- **What:** drop `--hx-color-border-on-dark-subtle` / `--hx-color-border-on-dark-default`
  (renamed to `--hx-color-surface-on-dark-overlay-*`; the old names paint translucent
  fills, not borders — the rename is also a semantic correction).
- **Where:** `hx-button.ts` (~`:77`), `hx-side-nav.ts`, and any consume site reading
  both names via the deprecated-first fallback chain.
- **3.x shim (already shipped):** both names resolve via CSS fallback, so existing
  overrides keep working.
- **Migration:** consumers replace `--hx-color-border-on-dark-*` overrides with
  `--hx-color-surface-on-dark-overlay-*`.
- **4.0 action:** delete the deprecated fallback arm.

---

## 2. Component attributes

### 2.1 Remove legacy `size` attribute acceptance
- **What:** drop the `size` → `hx-size` backward-compat shim across all components
  (the 10 that have it today + the 13 the E1 workstream adds).
- **3.x shim:** `size` is honored only when `hx-size` is absent, with a DEV-only
  one-time `devWarn`. `hx-size` always wins.
- **Migration:** consumers rename `size="…"` → `hx-size="…"` in Twig/HTML.
- **4.0 action:** delete `applyLegacySizeAlias` + the inline shims + their back-compat
  tests. Keep `hx-size` only.

---

## 3. Event payloads

### 3.1 Unify single-control change/input detail shape
- **What:** collapse the intentional `{checked,value}` (boolean controls) vs `{value}`
  (text controls) vs `{values}` (`hx-checkbox-group`) divergence into one universal
  envelope.
- **3.x shim:** all single-value controls already carry `{value}`; additive fields and
  full `HTMLElementEventMap` typing land in 3.x (E2) so consumers can migrate types
  early. No field is removed in 3.x.
- **4.0 action:** standardize the shape (e.g. always `{value, checked?}`), removing the
  per-family divergence.

---

## 4. Variant enums

### 4.1 Unify `danger` ↔ `error` value naming
- **What:** pick one canonical error-state value. Today `hx-tag` + button family use
  `danger`; `hx-alert`/`hx-banner`/`hx-badge` use `error`.
- **3.x shim:** dual-accept both values (alias → canonical styling) with a DEV warn on
  the non-canonical one.
- **Migration:** consumers move to the single canonical value.
- **4.0 action:** remove the deprecated value from each enum.
- **Note:** `hx-status-indicator`'s `status` axis (`online|offline|away|busy|unknown`)
  is intentionally distinct from `variant` and is **not** merged.

---

## 5. Focus architecture

### 5.1 Host-focusable `FocusMixin` mode for dual-mode / composite controls
- **What:** the components parked from the 3.x FocusMixin adoption — `hx-checkbox`,
  `hx-switch`, `hx-toggle-button`, `hx-select`, `hx-color-picker`, `hx-combobox`,
  `hx-date-picker`, `hx-time-picker` — use a deliberate host-focusable or composite
  model that the current inner-only `FocusMixin` would regress.
- **Why 4.0:** unifying them requires a `FocusMixin` host-focusable mode that changes
  observable focus target / tabindex / reflected-attribute state for these components.
- **3.x posture:** they are **correct as-is**; no shim. Tracked here only so the
  consistency work is not lost.
- **4.0 action:** extend `FocusMixin` with a host-focusable mode and migrate the 8.

---

## 6. Component defaults

### 6.1 (Candidate) flip `hx-prose` `sanitize` default to `true`
- **What:** the 3.x C4 fix adds an opt-in `sanitize` prop defaulting **off** (preserves
  current upstream-trust behavior). A fail-safe-by-default posture would flip it on.
- **Why 4.0:** changing a default that alters rendered output for existing consumers is
  breaking.
- **3.x shim:** opt-in `sanitize` available now.
- **4.0 action:** evaluate flipping the default to `true` with an explicit
  `sanitize="false"` escape hatch.

### 6.2 (Candidate) `hx-phi-field` `strict` mode as default
- **What:** the 3.x C6 fix adds an opt-in `strict` prop (fail-closed on SSR
  `data`-attribute exposure) defaulting **off**.
- **4.0 action:** consider making fail-closed the default.

---

## Appendix A — Out-of-scope platform security backlog

These are **real, verified** findings outside this cycle's scope (the operator scoped
remediation to the library + downstream distribution, not the internal tooling). They
are **not** part of 4.0 of the library — they belong to the `apps/` platform and want
their own remediation cycle. Recorded here so they are not lost.

- **`apps/admin` has no authentication/authorization.** All API routes
  (`/api/issues`, `/api/libraries/[id]/score`, `/api/tests/run`) are unprotected;
  the dashboard mutates issues/libraries/test state on an "assume trusted internal"
  basis with no enforcement.
- **`apps/admin` test runner spawns child processes over unauthenticated HTTP**
  (`/api/tests/run` → `child_process.spawn(vitest)`), gated only by `NODE_ENV`.
  No auth, rate limit, or concurrency control → resource-exhaustion DoS vector.
- **Filesystem persistence without locking** (`health-history-writer.ts`,
  `issues-loader.ts` use `writeFileSync` with no atomic write/lock → TOCTOU races).
- **MCP session/resource leaks** (`mcp-client.ts` — no overall session timeout; hung
  child processes accumulate).
- **Silent sync failure** (`syncToMcpHealthHistory()` swallows errors with no logging →
  MCP consumers see stale scores indefinitely).
- **Library-registry ID collisions** (kebab-case derivation, no UUID/uniqueness).
- **MCP error categorization** lacks Transport/Network/Timeout variants.

Suggested owners: `apps/admin` → backend/security; MCP servers → mcp-protocol +
security. Track as a separate epic.
