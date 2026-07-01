# HELiX 3.x Audit Register

**Scope:** the `@helixui/library` product and its downstream distribution —
`hx-library` (components + foundation: base class, mixins, adopted-stylesheet
machinery), `hx-tokens`, `hx-react` wrappers, the Drupal slotted-content surface
(`starters/drupal`, `packages/drupal-starter`), and the CI / release / packaging
machinery that governs how it ships.
**Out of scope (separate backlog):** `apps/admin`, `apps/mcp-servers`,
`packages/helixui-mcp` — see [BREAKING-CHANGES-4.0.md](./BREAKING-CHANGES-4.0.md) appendix.

**Library version at audit:** `@helixui/library` 3.10.0
**Constraint:** every remediation ships under 3.x (non-breaking). Genuinely-breaking
improvements are cataloged in [BREAKING-CHANGES-4.0.md](./BREAKING-CHANGES-4.0.md), not landed.
Where a breaking fix has a non-breaking on-ramp, we ship the compat shim now (dual
accept + DEV-only deprecation warning) and defer removal to 4.0.

**Method:** 6-dimension reconnaissance sweep, then a 7-agent adversarial verification
pass (refute-by-default) that confirmed each load-bearing finding against source with
file:line evidence and pinned the exact fix site + semver category. Findings below are
post-verification; recon claims that did **not** survive verification are listed in
§7 so they are not re-introduced.

**Semver legend:**
`NB` = non-breaking-3x (pure fix) · `SHIM` = additive on-ramp now, removal parked for 4.0 ·
`4.0` = breaking, parked entirely.

---

## 0. Executive summary

The foundation is genuinely strong: a clean `HelixElement` base + `FormMixin` /
`FocusMixin` / `mixinDelegatesAria` composition, a disciplined three-tier
`--hx-*` token cascade adopted idempotently into `document.adoptedStyleSheets`, a
CEM-driven React-wrapper pipeline with a real blocking drift gate, universal
ElementInternals form participation, and a 44-component P0 surface formally
AAA-certified. This is infrastructure built to a high bar.

The defects cluster in **enforcement, not construction** — the gates that are
supposed to protect the contract are wired loosely or not at all:

1. **The 3.0 shelf is not enforced by automation (CRITICAL).** The breaking-change
   detector (H18) and semver validator (H23) exist and are feature-complete, but
   run in **zero** automated paths — not CI, not preflight, not even the active
   husky pre-commit hook. The "Changeset Required" gate checks only that a changeset
   *file exists*, never that its bump matches the API delta. A deleted public
   property labeled `patch` passes every gate and publishes as a 3.x patch.
2. **Bundle-budget enforcement is three competing systems, and the enforced one was
   quietly relaxed** to 16KB/component & 200KB/bundle (vs the documented 5KB/50KB)
   on 2026-04-25 and never restored; a second script has a NaN-comparison bug that
   silently un-gates every over-budget component; a third is dormant.
3. **A publish-time CEM-staleness guard is dead code** (`git status --porcelain` on
   a gitignored file is always empty), giving false assurance.
4. **Security hardening gaps on the distribution surface:** no SRI on the jsDelivr
   Drupal loader (pinned to a stale 2.1.2), an unsanitized post-mutator path in
   `hx-icon`, attribute-**name** injection in 13 Drupal Twig templates, and no
   `SECURITY.md` / `THREAT_MODEL.md`.
5. **A11y consistency gaps:** the button family has *no* focus delegation at all
   (host `focus()` is a no-op), 37 components lack an `AAA-AUDIT.md`, `hx-link`'s
   axe suite is fully `describe.skip`ed (and it's its only a11y gate), and the two
   PHI components are P1/uncertified despite being foundational healthcare surfaces.

Every item is fixable under 3.x. Priority order: **B (lock the shelf) → C (security)
→ D (foundation/a11y) → E (API ergonomics)**, with breaking normalizations parked.

---

## 1. Workstream B — Release Integrity & the 3.0 Shelf Guard `[PRIORITY]`

| # | Finding | Sev | Semver | Fix site |
|---|---------|-----|--------|----------|
| B1 | **H18 (api-breaking-change-detection) runs in no automated path.** Only consumer is `scripts/pre-commit-check.sh:375`, which is itself orphaned — the active `.husky/pre-commit` runs only gitleaks + an env check. Not in CI, preflight, or the Docker `act` gate. | Critical | SHIM | `.github/workflows/ci.yml` (new required job) |
| B2 | **H23 (semantic-versioning) runs nowhere at all** — no shell script references it. It is the exact guard that fails when a breaking change lacks a `major` changeset. Its `CONFIG.workspacePackages` also omits `@helixui/react`. | Critical | SHIM | `ci.yml` + `scripts/hooks/semantic-versioning.ts:124,127` |
| B3 | **"Changeset Required" gate checks existence only**, never bump correctness (`ci.yml:1022-1061`). Same blind spot in preflight Gate 7. | High | SHIM | covered by B1/B2 job |
| B4 | **CEM API Diff job is informational-only** (`ci.yml:775-830`, comment "does not block merge"); `cem-diff.js` exits 0 on a successful diff and isn't in `quality-gates.needs[]`. | Medium | NB | leave as PR-comment; enforcement lands in B1 job |
| B5 | **publish.yml / release.yml re-run no tests and no API gate** — the changeset bump is taken at face value at publish time. | High | SHIM | making B1 job required on dev/staging/main covers it (no publish.yml edit) |
| B6 | **Enforced bundle budget was relaxed to 16KB/200KB** (`bundle-budgets.json`, commit `10cae84f` 2026-04-25, "temporary" per its own comment, Task #44) vs documented 5KB/50KB. | High | NB | `bundle-budgets.json` + reconcile w/ CLAUDE.md |
| B7 | **`check-bundle-size.mjs` NaN bug:** `OVERRIDES[name] ?? PER_COMPONENT` returns the `{budget,reason}` object, so `gzBytes > object` is always `false` — every overridden component is un-gated. Script is also orphaned (not in CI/preflight). | High | NB | `scripts/check-bundle-size.mjs:51-53` |
| B8 | **Dead CEM-staleness guard in publish.yml** (`:66-77`, `:245-249`): `git status --porcelain` on the gitignored `custom-elements.json` is always empty, so the gate can never fire. Shipped CEM is still fresh (build regenerates), but the guard is misleading dead code. | High | NB | `publish.yml` (remove or replace w/ before/after temp-diff) |
| B9 | **`SKIP_CDN_SIZE` local bypass** in preflight Gate 4.5; CDN gate is correctly blocking in CI. | Medium | NB | `scripts/preflight.sh:104-116` (ignore when `CI=true`) |

**Implementation subtlety (load-bearing):** H18/H23 gate on **git-staged files vs HEAD
CEM** — a commit-time model. A naive CI wiring that shells out to the hook's `main()`
will mis-scope or no-op on PR runners (nothing staged; HEAD is the merge commit). The
CI job must drive the **exported** `detectBreakingChanges` / `parseCEM`
(`api-breaking-change-detection.ts:275,376`) against explicitly-generated **base vs
head** CEM JSON. Add the new job to `quality-gates.needs[]` + the hard-fail loop
(`ci.yml:1229-1243`); because `quality-gates` is already the single required check and
the `pull_request` trigger covers dev/staging/main, no branch-protection API change is
needed.

---

## 2. Workstream C — Security & Distribution Integrity

| # | Finding | Sev | Semver | Fix site |
|---|---------|-----|--------|----------|
| C1 | **No SRI on the jsDelivr Drupal loader**, pinned to a stale `@2.1.2`. Exactly one real CDN-loading YML. Docs already prescribe the fix (doc/reality gap). | High | NB | `starters/drupal/helix_module/helix_module.libraries.yml:6,14` |
| C2 | **`hx-icon` trusts post-mutator output:** sanitize → `library.mutator(svg)` → `svg.outerHTML` → `unsafeHTML` with **no re-sanitization**. A hostile/compromised icon-library mutator can reintroduce `<script>`/`on*`/`javascript:`. Untested gap. | High | NB | `hx-icon.ts:551-567` (`_applyLibraryMutator`) |
| C3 | **13 Drupal Twig templates emit unescaped attribute *names*** (`{% for key,val in attributes %}{{ key }}="{{ val }}"` escapes value, not key → `onfocus=` breaks out). `attributes` is a raw PHP array, not a Drupal `Attribute` object. `packages/drupal-starter` templates already do this safely. | High | NB | `starters/drupal/helix_module/templates/*.html.twig` (13) + `helix_module.theme.inc` |
| C4 | **`hx-prose` renders raw CMS HTML in Light DOM with zero sanitization** (upstream-trust by design); no opt-in `sanitize` hook or per-component security note. (`hx-tooltip`/`hx-toast` are slot-projection-only — *not* injection sinks; recon over-flagged them.) | Medium | SHIM | `hx-prose.ts` (opt-in `sanitize` prop, default off) |
| C5 | **No `SECURITY.md` / `THREAT_MODEL.md`** at repo root (a strong `apps/docs/.../drupal/security-xss.md` exists and is the natural anchor). | Low | NB | repo root |
| C6 | **`hx-phi-field` SSR `data`-attribute exposure** has only post-hoc rescue, no opt-in fail-closed `strict` mode. (Note: strict mode is a *detector*, not a cure — the PHI already serialized server-side; it forces the misconfig to fail loudly in dev/test.) | High | SHIM | `hx-phi-field.ts:177-189` (new `strict` prop, default false) |

`hx-icon` is the **only** component-source file with an `unsafeHTML`/`innerHTML` sink.

---

## 3. Workstream D — Foundation & A11y Consistency

### 3a. FocusMixin adoption (API-preserving)

`FocusMixin` delegates host `focus()`/`blur()` to a single inner `_focusableNode` and
reflects `focused`/`focused-visible`. **Only `hx-text-input` adopts it today.** The
sweep bucketed every interactive component:

**(b) SAFE NON-BREAKING ADOPT (8) — host `focus()` currently broken or hand-rolled,
no `:host([focused])` styling exists so reflected attrs are purely additive:**
- `hx-button`, `hx-icon-button`, `hx-link`, `hx-copy-button` — **zero focus delegation
  today** (host `focus()` is a no-op); highest-value, lowest-risk win.
- `hx-textarea` — replace hand-rolled `focus()` with `_focusableNode` (cleanest; no
  `firstUpdated` to merge).
- `hx-number-input`, `hx-slider` — same, **but must thread `super.firstUpdated()`**
  through their existing override or autofocus/pending-focus flush breaks.
- `hx-file-upload` — `_focusableNode` must target `.dropzone` (role=button), **not**
  the hidden `.file-input`.

**(c) PARK FOR 4.0 — adoption changes observable focus semantics:** `hx-checkbox`,
`hx-switch`, `hx-toggle-button`, `hx-color-picker` (dual-mode host-focusable via
`_supportsIdrefRefs`); `hx-select` (host *is* the combobox surface); `hx-combobox`,
`hx-date-picker`, `hx-time-picker` (composite popups + ARIA-mirror). FocusMixin's
inner-only contract would *regress* these — they are **correct as-is**. Roving-tabindex
composites (`hx-menu`, `hx-tabs`, `hx-tree-view`, `hx-dialog`, `hx-drawer`, …) have no
single focusable node and are not FocusMixin candidates at all.

### 3b. Accessibility coverage

| # | Finding | Sev | Semver | Fix site |
|---|---------|-----|--------|----------|
| D1 | **37 components lack `AAA-AUDIT.md`** (8 interactive: phi-field, patient-banner, link, pagination, data-table, table, structured-list, list; 29 presentational). Generated by `scripts/regenerate-audits.mjs` from formal-audit JSON. | Medium | NB | per-component, via formal audit → regenerate |
| D2 | **`hx-link` `describe.skip('Accessibility (axe-core)')`** disables 5 axe cases (`hx-link.test.ts:281`). hx-link is P1 and **not** on the AAA allowlist, so the formal audit doesn't cover it — the skipped unit tests are its **only** a11y gate. Root cause: axe × `hx-icon` shadow-root vitest deadlock. | High | NB | `hx-link.test.ts:281` |
| D3 | **72 `it.todo()` placeholders** across 3 `hx-theme` test files (13/21/38; headers claim 12/20/24 — stale). Includes forced-colors/high-contrast brand-split (cert-relevant). | Medium | NB | `hx-theme-{replacesync-hardening,hc-brand-split,data-brand-reflection}.test.ts` |
| D4 | **`hx-phi-field` + `hx-patient-banner` are P1, uncertified, zero helixMeta tags.** Promotion to P0 is **metadata + audit only — non-breaking** (no exported property/attr/event/slot/part changes). phi-field is genuinely interactive (has `<button part=toggle>`); patient-banner is a landmark (interactive SCs resolve N/A). | Medium | NB | `p0-priority-tiers.json`, JSDoc, allowlist, VPAT |
| D5 | **`hx-phi-field` copy/paste doesn't reset the auto-hide timer** — a clinician actively copying revealed PHI can have it auto-mask mid-workflow. | Medium | NB | `hx-phi-field.ts:470-481` |
| D6 | **`hx-form` + `hx-prose` never bootstrap tokens.** 98 components import the auto-running `document-token-adoption.js`; these two Light-DOM components (the Drupal pattern) don't — if a page loads only them, the `:root` token layer is never adopted and styling silently degrades. | High | NB | `hx-form.ts`, `hx-prose.ts` (add side-effect import + `ensureDocumentTokens()` in `connectedCallback`) |
| D7 | **`hx-phi-access` analytics-forwarding boundary** lacks a tag-shaped `@note` at the event/interface site (class-level prose exists). | Low | NB | `hx-phi-field.ts:550-559`, `@fires` |

`aaa-cert.mjs` refuses `@aaa-certified` unless all 11 criteria resolve Supports/Not
Applicable from the **formal audit** — promotion (D4) cannot be faked. It needs an
explicit `--pattern` (no heuristic for these two) and `detectPhiHandles` hardcodes
phi-field + clinical-status (not patient-banner — a one-line detector tweak).

---

## 4. Workstream E — API Consistency & Flexibility (additive compat shims)

| # | Finding | Sev | Semver | Fix site |
|---|---------|-----|--------|----------|
| E1 | **Legacy `size` alias is on only 10 of 29 size components.** (The `size`-vs-`hx-size` "split" is **refuted** — all 29 uniformly use the `hx-size` attribute.) 13 non-form components should gain the alias via a shared helper; **exclude the 6 form controls** (native `<input size>` collision — the reason `hx-size` exists). | Medium | SHIM | new `src/utils/apply-legacy-size-alias.ts` + 13 `connectedCallback`s |
| E2 | **18 of ~28 event-emitting components lack `HTMLElementEventMap` augmentation** — `detail` is `any` for `addEventListener` consumers. All change/input details already carry `value`. | Medium | SHIM | per-component `declare global` blocks + exported named detail types |
| E3 | **Variant additive gaps:** `hx-icon-button` lacks `outline`; `hx-toggle-button` lacks `danger`. Safe to add now. | Medium | SHIM | `hx-icon-button.ts:100`, `hx-toggle-button.ts:133` |
| E4 | **`mixinDelegatesAria` is now publicly re-exported** from `packages/hx-library/src/index.ts` (resolved in 3.11.0 alongside the `@helixui/library/authoring` subpath; FocusMixin/FormMixin were already public). | Low | DONE (3.11.0) | `src/index.ts` re-export + `@helixui/library/authoring` subpath |
| E5 | **CEM `./custom-elements.json` is already a published export** (recon's "not exported" branch refuted). Additive: advertise the subpath + `customElements` field for tooling. | Low | NB | docs only |
| E6 | **`danger`↔`error` value naming diverges** (`hx-tag` uses `danger`; `hx-alert`/`hx-banner`/`hx-badge` use `error`). Unification removes a value → **4.0**. 3.x bridge: dual-accept alias + DEV warn. | Low | 4.0 (+SHIM) | parked |

`devWarn` (`src/utils/dev-warn.ts`) is DEV/test-gated and tree-shaken from prod, so all
proposed deprecation warnings are **zero-cost in production**.

---

## 5. Workstream F — 4.0 Breaking Backlog (parked)

Cataloged in [BREAKING-CHANGES-4.0.md](./BREAKING-CHANGES-4.0.md). Headline items:
deprecated-token removal (`--hx-color-border-on-dark-*`), legacy `size` attribute
removal, `danger`↔`error` value unification, variant-enum normalization,
host-focusable FocusMixin mode for the parked (c) components, and a possible
`hx-prose` `sanitize`-default flip. Plus the out-of-scope `apps/admin` + MCP security
backlog (no-auth dashboard, test-runner process-spawn, FS race conditions).

---

## 6. Remediation sequencing

1. **B — shelf guard** (protected paths, codex-review required). Lock the contract
   first; the new gate then proves every later PR is non-breaking.
2. **C — security/distribution.** SRI, `hx-icon` re-sanitize, Twig attribute names,
   `hx-prose` opt-in sanitize, `hx-phi-field` strict mode, SECURITY/THREAT_MODEL docs.
3. **D — foundation/a11y.** FocusMixin (8), token-bootstrap self-heal, `hx-link`
   un-skip, `hx-theme` todos, PHI promotion, copy/paste timer, telemetry `@note`.
4. **E — API ergonomics.** Legacy-size helper (13), event-map typing, variant adds,
   `mixinDelegatesAria` export.

Each workstream is a batched PR through `pnpm run preflight` (12 gates) + codex-review
for protected paths. The B gate is the proof obligation for C/D/E.

---

## 7. Recon claims that did NOT survive verification (do not re-introduce)

- ❌ "size vs hx-size split across components" — **all 29 use `hx-size`**; the real gap
  is the legacy-`size` *compat shim* coverage (E1).
- ❌ "FocusMixin/FormMixin/mixinDelegatesAria are unexported" — FocusMixin, FormMixin
  **and** `mixinDelegatesAria` are all public as of 3.11.0 (E4 resolved via the
  `src/index.ts` re-export + the `@helixui/library/authoring` subpath).
- ❌ "CEM not published as an export" — it **is** (`exports`, `files`, `customElements`);
  it's simultaneously gitignored + generated-on-build + published (E5).
- ❌ "hx-tooltip/hx-toast render unsanitized HTML" — slot-projection only; **`hx-icon`
  is the sole `unsafeHTML` sink** (C2/C4).
- ❌ "the bundle/CDN gate has a CI bypass" — the CDN gate is genuinely blocking in CI;
  the real issues are the relaxed budget (B6), the NaN bug (B7), and the local
  `SKIP_CDN_SIZE` (B9).
- ⚠️ "hx-phi-access telemetry boundary undocumented" — class-level prose exists; only a
  targeted `@note` is missing (D7, downgraded to low).
