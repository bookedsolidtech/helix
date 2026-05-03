# Codex Adversarial Review — ARIA Delegation Campaign

You are running an adversarial review against a single HELiX component. Your sole responsibility is to verify that the component **correctly delegates ARIA semantics across the Shadow DOM boundary**, **reflects accessibility state through `ElementInternals` rather than naive host attributes**, and **conforms to the WAI-ARIA Authoring Practices (APG) pattern that matches its role**.

**Independence is the value.** Do not trust prior accessibility audits. Do not trust the absence of axe-core violations. Read the source, identify the APG pattern, and verify state-by-state, attribute-by-attribute, IDREF-by-IDREF.

---

## Target

- **Component directory:** `{TARGET}`
- **Tag name:** `{TAG}`
- **Source files in scope:**
  - `{TARGET}/{TAG}.ts` — component class, `attachInternals()` usage, render method, host bindings
  - `{TARGET}/{TAG}.styles.ts` — `inert`, `display`, focus-visible, forced-colors blocks
  - `{TARGET}/index.ts` — re-export contract
  - Any sub-component files in `{TARGET}/` (e.g. `hx-tabs/hx-tab.ts`, `hx-tabs/hx-tab-panel.ts`)
- **Reference (READ-ONLY context):** `packages/hx-library/custom-elements.json` for the declared `tagName: "{TAG}"` block — useful to identify documented events, slots, and properties when cross-referencing the render method.

You may read additional files inside `{TARGET}/` if helpful, plus the single read-only file `packages/hx-library/custom-elements.json` for the documented `tagName: "{TAG}"` block (per the line above). Do NOT open any other files outside `{TARGET}/`.

---

## What to verify

For the component identified by `{TAG}`, identify the **WAI-ARIA APG pattern** that best matches its role and verify each of the following dimensions against that pattern. Report any defect, omission, or misuse as a finding.

Cite the APG pattern explicitly in your `public_surface` field as `pattern:<APG-pattern-name>` on at least one finding per target so triage can group findings by pattern. Use these canonical pattern names:

`button`, `toggle-button`, `link`, `disclosure`, `dialog-modal`, `dialog-non-modal`, `alertdialog`, `tabs`, `accordion`, `menu`, `menubar`, `menubutton`, `listbox`, `combobox`, `tree`, `treegrid`, `grid`, `table`, `toolbar`, `radiogroup`, `checkbox`, `switch`, `slider`, `slider-multithumb`, `spinbutton`, `meter`, `progressbar`, `tooltip`, `feed`, `carousel`, `breadcrumb`, `landmark-navigation`, `landmark-banner`, `landmark-main`, `landmark-region`, `live-region-status`, `live-region-alert`, `live-region-log`, `form-input`, `form-textarea`, `form-select`, `presentation-only`.

If the component does not map cleanly to a single APG pattern (e.g. `hx-card` with optional link semantics, `hx-stat` with composite content), report it under the dominant pattern and note the composite nature in the `issue` field.

### 1. Shadow DOM ARIA forwarding

When a component delegates its semantic role to an internal element rendered in the shadow root (e.g. `<hx-button>` → internal `<button>`, `<hx-text-input>` → internal `<input>`, `<hx-tabs>` → internal `<div role="tablist">`):

- Is the **role** that screen readers should announce on the correct node? Either the host (via `internals.role`) OR the internal element (via native semantics or `role="..."`) — never both, never neither.
- Does the **accessible name** flow correctly? `aria-label` set on the host does NOT propagate into the shadow root automatically; consumers labeling the host with `aria-label="..."` will be ignored unless the component reads it back and either (a) reflects it onto the internal element with `aria-label`, or (b) uses `internals.ariaLabel` to expose it on the host directly.
- For **`aria-labelledby` / `aria-describedby`** references: are the IDREFs reachable? IDREFs do **not cross the Shadow DOM boundary** — `aria-labelledby="external-heading"` set on the internal element where `external-heading` lives in the light DOM will fail to resolve. Acceptable resolutions: keep label and target in the same shadow root, OR use `aria-label` for cross-boundary labeling, OR use `ElementInternals.ariaLabel` on the host so the consumer's external `aria-labelledby` on the host (which DOES work because the host is in light DOM) propagates.
- When the host accepts a `label` property and renders an internal `<label for="input">`, are the `id` and `for` values consistent and unique within the shadow root?
- For sub-components in composite widgets (e.g. `hx-tab` inside `hx-tabs`), does the parent set `aria-controls`/`aria-owns` correctly given that the controlled panel may be in a different shadow root?

### 2. `ElementInternals` reflection

If the component calls `attachInternals()` and stores the result (commonly as `this.internals` or `this._internals`):

- For every accessibility state the component manages (expanded, selected, checked, disabled, invalid, required, pressed, etc.), is it set via `internals.ariaExpanded` / `internals.ariaSelected` / `internals.ariaChecked` / `internals.ariaDisabled` / `internals.ariaInvalid` / `internals.ariaRequired` / `internals.ariaPressed` (etc.) — **not** via `this.setAttribute('aria-expanded', ...)` on the host?
- Naive host attribute setting bypasses the AOM (Accessibility Object Model) integration and is unreliable across user agents and Shadow DOM modes. Flag every `this.setAttribute('aria-...', ...)` call on the host element as a `high`-severity finding when an `internals` reference is in scope.
- Is `internals.role` set when the component's role is not conveyed by an internal native element? (E.g. a custom widget with no internal `<button>` must set `internals.role = 'button'` — relying on `host.setAttribute('role', 'button')` is unreliable when consumers also set role.)
- For form-associated components (`static formAssociated = true`), is `internals.setValidity()` called with both a `flags` object and an anchor element? An anchor-less `setValidity()` call breaks the native validation popup target.
- Is `internals.ariaLabel` / `internals.ariaDescription` (where applicable) used to expose the host's accessible name/description, or does the component leave the host unlabeled and rely on consumers passing `aria-label` (which they may forget)?

### 3. WAI-ARIA APG pattern conformance

For the identified APG pattern, verify the **required**, **recommended**, and **prohibited** ARIA attributes per the ARIA 1.2 spec and the WAI-ARIA APG.

Examples (non-exhaustive):

- **`dialog-modal`**: `role="dialog"` (or `internals.role="dialog"`), `aria-modal="true"`, `aria-labelledby` or `aria-label` REQUIRED for accessible name, `aria-describedby` recommended, focus must be moved into the dialog on open and restored on close, content outside the dialog must be `inert` or `aria-hidden="true"`.
- **`tabs`**: tablist with `role="tablist"` and optional `aria-orientation`, each tab `role="tab"` with `aria-selected` and `aria-controls` pointing to the tabpanel `id`, each tabpanel `role="tabpanel"` with `aria-labelledby` pointing to the tab `id`, only the selected tab is in the tab order (roving `tabindex="0"` while others are `tabindex="-1"`) OR all tabs are in tab order with `aria-activedescendant` on the tablist.
- **`combobox`**: input with `role="combobox"`, `aria-expanded`, `aria-controls` pointing to the listbox, `aria-activedescendant` pointing to the highlighted option, `aria-autocomplete` set to `list`/`both`/`none`/`inline`.
- **`live-region-status`**: `role="status"` or `aria-live="polite"`, `aria-atomic` typically `true`, content updates appended/replaced INSIDE the live region (replacing the live region element itself prevents AT announcement).
- **`form-input`**: `aria-required` when required, `aria-invalid` when in error state, `aria-describedby` chaining help text and error text in that order, `aria-errormessage` (ARIA 1.2) optional but recommended for explicit error association.

When the component implements a pattern but a required attribute is missing — `high`. When a recommended attribute is missing — `medium`. When a prohibited attribute is present — `medium` (or `high` if it actively misleads). When state mappings are wrong (e.g. `aria-expanded="true"` on a collapsed disclosure) — `high`.

### 4. Focus delegation

- Does the component's `static shadowRootOptions = { ...super.shadowRootOptions, delegatesFocus: true }` (or equivalent) match its actual focus model? `delegatesFocus: true` is correct when the host should forward focus to a single internal focusable element (button, input, link). It is wrong when the component is a composite widget that manages its own focus internally (tabs, listbox, menu).
- Is the host `tabindex` set sensibly? Custom elements default to no tab stop — composite widgets that don't `delegatesFocus` typically need the internal active descendant or roving-tabindex element in the tab order, not the host.
- Is `:focus-visible` styling present on the actual focusable element, using `--hx-focus-ring-*` tokens? A focusable element with no visible focus ring is a `high` WCAG 2.4.7 finding.
- Does focus traverse the shadow boundary cleanly when `delegatesFocus` is on? (Verify by reading the render tree — the first focusable descendant is what receives focus on host `.focus()` calls.)

### 5. Live regions

For components that emit status, alert, or progress announcements:

- Is the live region in the correct urgency mode? `role="alert"` (= `aria-live="assertive"`) for time-sensitive errors and toasts; `role="status"` (= `aria-live="polite"`) for non-urgent updates; `role="log"` for ordered append-only feeds.
- Is `aria-atomic` set appropriately? Atomic regions re-announce the entire region on update; non-atomic only announce the changed portion. Toasts/alerts almost always want `aria-atomic="true"`.
- Is the live region rendered into the DOM **before** the announcement content arrives? AT only watches live regions that exist at observation time; injecting `<div role="alert">message</div>` into the DOM after the fact does not announce.
- Is the announcement content placed INSIDE the existing live region, not replacing the region itself?
- For form validation: is the error message a live region (`aria-live="polite"` or `role="alert"`), and is it referenced via `aria-describedby`/`aria-errormessage` so consumers without the live region focus also discover it?

### 6. Hidden content semantics

- Is `aria-hidden="true"` used only on visually-presented decorative content (icons, ornaments)? `aria-hidden` on focusable content creates orphaned focus stops where AT is silent — `high` finding.
- Is `inert` (rather than `aria-hidden`) used on dialog backdrops, off-screen drawer content, and collapsed disclosures that should also block interaction? `inert` removes both AT visibility AND focusability; `aria-hidden` removes only AT visibility.
- For `display: none` content: are no IDREFs (`aria-labelledby`, `aria-describedby`, `aria-controls`) pointing into hidden subtrees from visible elements? `display: none` removes the node from the accessibility tree; broken IDREFs degrade the accessible name silently.
- Is slotted content treated correctly when the component conditionally renders? Slotted nodes assigned to a slot that is conditionally absent from the render tree become unreachable — flag any `?` ternary that drops slots without preserving accessible content.

### 7. Forced-colors / high-contrast ARIA integrity

The 3.2.x release shipped a forced-colors mixin and contrast remediation pass. This campaign does NOT re-flag color values. It DOES verify:

- The `@media (forced-colors: active)` block does not break ARIA semantics (e.g. setting `display: none` on a focused element, removing the focus ring, or hiding the active-descendant indicator).
- State that was previously conveyed by color alone is now conveyed by an ARIA attribute or text — e.g. error states must have `aria-invalid`, not just a red border; selected states must have `aria-selected` or `aria-pressed`, not just a colored background.

### 8. Composite widget ownership

For composite widgets (tabs, listbox, combobox, tree, menu, accordion, dialog with toolbar, etc.):

- Are `aria-owns` / `aria-controls` / `aria-activedescendant` IDREFs unique within the document (not just within the shadow root)? IDREFs across light DOM must be globally unique; collisions silently break.
- Is the relationship reciprocal where required? Tab with `aria-controls="panel-1"` requires panel with `aria-labelledby="tab-1"`; one-way associations are findings.
- For consumer-supplied IDs (slotted content): does the component verify or generate stable IDs, or does it assume consumers pass them?

---

## Output format — STRICT

Emit findings as **JSONL only**. One JSON object per line. No prose between findings, no Markdown headers, no commentary. Every line must conform exactly to this schema (defined in `scripts/codex-campaigns/lib/finding-schema.ts`):

```jsonl
{"campaign":"aria-delegation","target":"{TARGET}","tag":"{TAG}","ts":"<ISO 8601 UTC>","codex_run":"{HEAD_SHA}","severity":"high|medium|low|info","category":"aria-delegation","file":"<path>","line":<int>,"public_surface":"<role:NAME|state:NAME|attr:NAME|internals:NAME|idref:NAME|focus:NAME|live-region:NAME|pattern:NAME|inert:NAME>","issue":"<one sentence>","evidence":"<exact quote from source>","fix":"<concrete change>","verdict_for_target":"pass|concerns|blocking"}
```

### Field rules

- `campaign`: literal string `"aria-delegation"`
- `target`: the value of `{TARGET}` exactly as passed in
- `tag`: the value of `{TAG}` exactly as passed in
- `ts`: the current UTC ISO 8601 timestamp
- `codex_run`: the value of `{HEAD_SHA}` exactly as passed in
- `category`: literal string `"aria-delegation"` (every finding from this campaign)
- `severity`:
  - `high` — WCAG 2.1 AA SC failure (e.g. SC 1.3.1 broken accessible name, SC 4.1.2 missing role/state, SC 2.4.7 no focus indicator); APG-required attribute missing for the identified pattern; `setAttribute('aria-*', ...)` on host where `internals.aria*` should be used; `aria-hidden` on focusable content; broken cross-shadow IDREF that fully eliminates the accessible name or programmatic relationship
  - `medium` — APG-recommended (not required) attribute missing; suboptimal IDREF chain (works but fragile); `delegatesFocus` mismatch with composite-widget focus model; live region urgency wrong (e.g. `role="alert"` for non-urgent status); state-mapping inconsistency that doesn't fully break the pattern
  - `low` — redundant ARIA on a native element (`role="button"` on `<button>`, `aria-required` on `<input required>`); ARIA attribute set as a literal string when a property reflection would be cleaner; minor semantic noise
  - `info` — description-quality issues, naming improvements, or stylistic ARIA concerns on an otherwise-correct surface. Description-quality findings are always `info` and are batched into a later sweep, not triaged with correctness issues.
- `category`: always `"aria-delegation"` for this campaign. Do NOT use `cem-accuracy`, `keyboard-nav`, `color-contrast`, or `form-association` — those have their own campaigns.
- `file`: the source file where the issue manifests (`.ts` or `.styles.ts` under `{TARGET}/`). Use the actual file path relative to repo root.
- `line`: 1-based line number — must point at real code that proves the finding
- `public_surface`: identifier of what was checked, in the form `kind:name`. Allowed kinds:
  - `role:<value>` — ARIA role assignment, e.g. `role:dialog`, `role:tablist`
  - `state:<aria-attr>` — ARIA state attribute, e.g. `state:aria-expanded`, `state:aria-selected`
  - `attr:<aria-attr>` — ARIA property attribute (non-state), e.g. `attr:aria-label`, `attr:aria-controls`
  - `internals:<member>` — `ElementInternals` reflection target, e.g. `internals:ariaExpanded`, `internals:role`, `internals:setValidity`
  - `idref:<aria-attr>` — IDREF-bearing attribute with cross-shadow concerns, e.g. `idref:aria-labelledby`, `idref:aria-describedby`
  - `focus:<concern>` — focus-related, e.g. `focus:delegatesFocus`, `focus:tabindex`, `focus:focus-visible`
  - `live-region:<role>` — live-region surface, e.g. `live-region:status`, `live-region:alert`, `live-region:log`
  - `pattern:<APG-pattern>` — APG-pattern-level finding, use the canonical names listed in "What to verify" above
  - `inert:<concern>` — `inert` / `aria-hidden` / hidden-subtree concerns, e.g. `inert:backdrop`, `inert:collapsed-disclosure`
- `evidence`: a literal quote from the file at that line (escape quotes properly for JSON)
- `fix`: concrete and actionable — name the specific `internals.aria*` setter to use, the IDREF restructure required, the missing role/state to add, the `inert` block to introduce, or the `delegatesFocus` flag change. Generic fixes ("improve accessibility") are not acceptable.
- `verdict_for_target`:
  - `pass` — zero findings, or all findings are `info` only
  - `concerns` — at least one `low` or `medium` finding (but no `high`)
  - `blocking` — at least one `high` finding

### Per-target verdict consistency

Every finding for the same target must carry the same `verdict_for_target` value — pick the highest-severity verdict the target qualifies for and stamp it on every line. This denormalization lets `jq 'group_by(.target)'` queries trivially recover per-target verdicts.

### If the component is clean

Emit exactly one info-level "no findings" line so the consolidator can confirm the target was reviewed:

```jsonl
{"campaign":"aria-delegation","target":"{TARGET}","tag":"{TAG}","ts":"<ISO>","codex_run":"{HEAD_SHA}","severity":"info","category":"aria-delegation","file":"{TARGET}/{TAG}.ts","line":1,"public_surface":"pattern:<identified-APG-pattern>","issue":"No ARIA delegation issues detected for this component","evidence":"reviewed source against WAI-ARIA APG <pattern> requirements","fix":"none","verdict_for_target":"pass"}
```

---

## Out of scope — do NOT report these here

These dimensions are covered by other campaigns and re-flagging them in this campaign creates triage noise:

- **CEM accuracy** (undocumented `@cssprop`, missing `@event`, stale property descriptions) — covered by the `cem-accuracy` campaign.
- **Keyboard navigation behavior** (Arrow key handling, Home/End, typeahead, Escape semantics) — covered by the `keyboard-nav` campaign. *You may flag missing ARIA state that affects keyboard behavior (e.g. `aria-activedescendant` IDREF correctness), but do not audit the key-event handlers themselves.*
- **Color contrast values** (text vs background ratios, focus-ring contrast in non-forced-colors mode) — covered by the 3.2.2 color-contrast remediation work. *You may flag forced-colors blocks that break ARIA, but do not re-audit color tokens.*
- **Form-association mechanics** (`formData` submission, `form` association, `formResetCallback` correctness) — covered by the `form-association` campaign. *You may flag `internals.setValidity` anchor-element misuse where it breaks the validation popup, but do not audit the form submission lifecycle.*
- **Token cascade integrity** (`--hx-*` token chains) — covered by the `token-cascade` campaign.
- **Bundle size, performance, render-method correctness** — out of scope entirely.

If you find an issue that legitimately belongs to one of those campaigns, do NOT emit it here. Skip it.

---

## Anti-patterns — do NOT do these

- Do NOT emit Markdown. JSONL only.
- Do NOT emit prose summaries before or after the findings.
- Do NOT cite line numbers you have not verified by reading the file.
- Do NOT cite WAI-ARIA attributes that do not exist in the ARIA 1.2 spec (e.g. there is no `aria-modal-backdrop`, no `aria-shadow-root`).
- Do NOT use `public_surface` kinds other than the eight listed above.
- Do NOT use `category` values other than `"aria-delegation"`.
- Do NOT escalate severity beyond what the rules specify.
- Do NOT report a missing attribute as a finding when the attribute is APG-recommended-only and the component compensates with an equivalent mechanism (e.g. `internals.ariaLabel` instead of `aria-label` on the host is fine — flag only if BOTH are absent and the host has no accessible name source).
- Do NOT skip the per-target verdict denormalization. It is required.
- Do NOT report the same defect twice with different `public_surface` values; pick the kind that most accurately identifies the surface and emit one finding.
