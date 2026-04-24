# Codex Adversarial Review — CEM Accuracy Campaign

You are running an adversarial review against a single HELiX component. Your sole responsibility is to verify that the **Custom Elements Manifest (CEM)** declaration for this component is a faithful, complete, and accurate description of the component's actual public surface.

**Independence is the value.** Do not trust prior CEM regeneration. Diff what is documented against what the source actually exposes.

---

## Target

- **Component directory:** `{TARGET}`
- **Tag name:** `{TAG}`
- **CEM file (canonical):** `packages/hx-library/custom-elements.json`
- **Source files in scope:**
  - `{TARGET}/{TAG}.ts` — component class, decorators, render method
  - `{TARGET}/{TAG}.styles.ts` — CSS custom properties consumed and CSS parts emitted via `::part()`
  - `{TARGET}/index.ts` — re-export contract

You may read additional files in `{TARGET}/` if helpful, but do not stray outside it.

---

## What to verify

For the component identified by `{TAG}`, locate its `declaration` block in `packages/hx-library/custom-elements.json` and verify each of the following dimensions. Report any mismatch as a finding.

### 1. `@property` (reactive properties)

For every `@property` decorator in the source:

- Is it documented in CEM `members[]` (kind `field`)?
- Does the documented `type.text` match the TypeScript type?
- Does the documented `default` match the source default?
- Does the JSDoc description in CEM accurately describe what the property does, or is it stale / lifted from another component / placeholder text?
- If the property has a custom `attribute` name, is the attribute name in CEM correct?
- If `reflect: true`, is the CEM `reflects` flag set?

For every property documented in CEM, verify it actually exists in the source. Flag CEM entries that no longer correspond to source code.

### 2. Public methods

For every public method in the source (anything not `private` or prefixed with `_`):

- Is it documented in CEM `members[]` (kind `method`)?
- Are parameters and return type accurate?
- Is the JSDoc description meaningful?

For every documented method, verify it exists.

#### Out of scope for this campaign

The `@custom-elements-manifest/analyzer` deliberately does **not** surface framework lifecycle overrides. Do NOT flag any of the following as "undocumented methods" — they are audited by a separate lifecycle-correctness campaign, not this one:

- Lit lifecycle: `connectedCallback`, `disconnectedCallback`, `adoptedCallback`, `attributeChangedCallback`, `render`, `createRenderRoot`, `firstUpdated`, `updated`, `willUpdate`, `shouldUpdate`, `getUpdateComplete`, `scheduleUpdate`, `performUpdate`
- Form-associated mixin hooks (protected, `_`-prefixed): `_onFormReset`, `_onFormStateRestore`, `_onFormDisabled`, `_onFormAssociated`
- Slot-coordination mixin hooks: `_onSlotChange`, `_onSlotAssign`
- Private fields (`private` modifier or `_`-prefix). If one leaks into CEM `members[]` anyway, that IS a finding — flag it as `cem-accuracy` against the CEM file, not the source.

### 3. Dispatched events

Search the source for `dispatchEvent(new CustomEvent(...))`, `dispatchEvent(new Event(...))`, and any helper that wraps event dispatch.

- Is every dispatched event documented in CEM `events[]`?
- Is the documented `name` exactly the dispatched event name?
- Is the documented `type.text` accurate (CustomEvent generic argument)?
- Is the description meaningful?

For every documented event, verify it is actually dispatched somewhere.

### 4. Slots

For every `<slot>` in the render method (default and named):

- Is it documented in CEM `slots[]`?
- Is the `name` correct (`""` for default slot, otherwise the named-slot name)?
- Is the description meaningful?

### 5. CSS parts

For every `part="..."` attribute in the render method:

- Is the part name documented in CEM `cssParts[]`?
- Is the description meaningful?

### 6. CSS custom properties (`--hx-*`)

**Policy: every `--hx-*` token a component consumes must be documented as an `@cssprop` on that component's JSDoc.** Semantic-tier tokens (`--hx-space-*`, `--hx-color-*`, `--hx-transition-*`, `--hx-size-*`, `--hx-focus-ring-*`, `--hx-opacity-*`, `--hx-overlay-*`, etc.) are NOT exempt — if the component consumes them, the component documents them. This is the HELiX authoring standard.

For every `--hx-*` custom property the styles consume (`var(--hx-...)`) or define (`--hx-...:`) on `:host`:

- Is it documented in CEM `cssProperties[]`?
- Is the description meaningful?
- Is the default value documented when the styles assign one on `:host`?
- When the `var()` chains through a semantic fallback (e.g. `var(--hx-button-bg, var(--hx-color-primary-500))`), does the CEM `default` reflect the semantic token (`var(--hx-color-primary-500)`) rather than the raw literal at the end of the chain? A raw-literal `default` that hides the semantic cascade is a `cem-accuracy` finding.

### 7. `formAssociated` / `ElementInternals`

If the component has `static formAssociated = true` or uses `ElementInternals`:

- Is `formAssociated` set to `true` in the CEM declaration?
- Are form-related events (`change`, `input`, `invalid`) documented?
- Is the validation contract documented (custom error messages, validity flags consumed)?

### 8. Stale CEM entries

Anything documented in CEM that does NOT exist in the source is a finding (severity `medium` minimum). Stale documentation is worse than missing documentation because it actively misleads consumers.

---

## Output format — STRICT

Emit findings as **JSONL only**. One JSON object per line. No prose between findings, no Markdown headers, no commentary. Every line must conform exactly to this schema (defined in `scripts/codex-campaigns/lib/finding-schema.ts`):

```jsonl
{"campaign":"cem-accuracy","target":"{TARGET}","tag":"{TAG}","ts":"<ISO 8601 UTC>","codex_run":"{HEAD_SHA}","severity":"high|medium|low|info","category":"cem-completeness|cem-accuracy","file":"<path>","line":<int>,"public_surface":"<property:NAME|method:NAME|event:NAME|slot:NAME|part:NAME|css-property:NAME>","issue":"<one sentence>","evidence":"<exact quote from source or CEM>","fix":"<concrete change>","verdict_for_target":"pass|concerns|blocking"}
```

### Field rules

- `campaign`: literal string `"cem-accuracy"`
- `target`: the value of `{TARGET}` exactly as passed in
- `tag`: the value of `{TAG}` exactly as passed in
- `ts`: the current UTC ISO 8601 timestamp
- `codex_run`: the value of `{HEAD_SHA}` exactly as passed in
- `severity`:
  - `high` — undocumented public property, method, or dispatched event; stale CEM entry that points to nothing
  - `medium` — undocumented slot, CSS part, or CSS custom property; CEM `default` value that materially diverges from the actual style cascade
  - `low` — private or underscore-prefixed field leaking into public CEM `members[]`
  - `info` — description present but missing/stale/copy-pasted/placeholder; phrasing improvement; any documentation-quality issue on an otherwise-correct surface. **Description quality findings are always `info` — they are batched into a later documentation sweep, not triaged with correctness issues.**
- `category`:
  - `cem-completeness` — surface exists in source but is missing from CEM
  - `cem-accuracy` — surface is documented but the documentation is wrong or stale
- `file`: the source file (`.ts`, `.styles.ts`) when the issue is "source has X but CEM doesn't"; the CEM file (`packages/hx-library/custom-elements.json`) when the issue is "CEM claims X but source doesn't"
- `line`: 1-based line number — must point at real code that proves the finding
- `public_surface`: identifier of what was checked, in the form `kind:name`
- `evidence`: a literal quote from the file at that line (escape quotes properly for JSON)
- `fix`: concrete and actionable — name the JSDoc tag to add, the CEM key to update, or the source code to change
- `verdict_for_target`:
  - `pass` — zero findings, or all findings are `info` only
  - `concerns` — at least one `low` or `medium` finding (but no `high`)
  - `blocking` — at least one `high` finding

### Per-target verdict consistency

Every finding for the same target must carry the same `verdict_for_target` value — pick the highest-severity verdict the target qualifies for and stamp it on every line. This is a denormalization that lets `jq 'group_by(.target)'` queries trivially recover per-target verdicts.

### If the component is clean

Emit exactly one info-level "no findings" line so the consolidator can confirm the target was reviewed:

```jsonl
{"campaign":"cem-accuracy","target":"{TARGET}","tag":"{TAG}","ts":"<ISO>","codex_run":"{HEAD_SHA}","severity":"info","category":"cem-accuracy","file":"packages/hx-library/custom-elements.json","line":1,"public_surface":"declaration:{TAG}","issue":"No CEM accuracy issues detected for this component","evidence":"reviewed declaration against source files in {TARGET}","fix":"none","verdict_for_target":"pass"}
```

---

## Anti-patterns — do NOT do these

- Do NOT emit Markdown. JSONL only.
- Do NOT emit prose summaries before or after the findings.
- Do NOT cite line numbers you have not verified by reading the file.
- Do NOT invent `public_surface` identifiers — use only kinds the schema lists.
- Do NOT escalate severity beyond what the rules specify above.
- Do NOT skip the per-target verdict denormalization. It is required.
