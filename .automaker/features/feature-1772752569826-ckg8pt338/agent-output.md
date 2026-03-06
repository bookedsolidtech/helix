
🔧 Tool: ToolSearch
Input: {
  "query": "select:Glob,Read",
  "max_results": 2
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-button-group/**/*",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/hx-button-group.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/hx-button-group.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/hx-button-group.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/hx-button-group.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/index.ts"
}
Now let me check how `hx-button` handles the size cascade from the group's CSS custom property:

🔧 Tool: ToolSearch
Input: {
  "query": "select:Grep",
  "max_results": 1
}

🔧 Tool: Grep
Input: {
  "pattern": "hx-button-group-size",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button",
  "output_mode": "content"
}
The `--hx-button-group-size` CSS custom property is never read by `hx-button`. That's a critical finding. Now I have enough to write the full audit.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Write",
  "max_results": 1
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-audit-hx-button-group-t1-03/packages/hx-library/src/components/hx-button-group/AUDIT.md",
  "content": "# hx-button-group — Quality Audit (T1-03)\n\nAuditor: antagonistic review pass\nFiles reviewed: `hx-button-group.ts`, `hx-button-group.styles.ts`, `hx-button-group.test.ts`, `hx-button-group.stories.ts`, `index.ts`\nCross-referenced: `packages/hx-library/src/components/hx-button/` (for size cascade verification)\n\n---\n\n## P0 — Critical (must fix before merge)\n\n### P0-01: `--hx-button-group-size` cascade is completely non-functional\n\n**File:** `hx-button-group.ts:66`, `hx-button-group.stories.ts`\n\nThe component sets `--hx-button-group-size` as a CSS custom property with a string identifier value (`'sm'`, `'md'`, `'lg'`):\n\n```ts\nthis.style.setProperty('--hx-button-group-size', this.size);\n```\n\nA grep of `packages/hx-library/src/components/hx-button/` for `hx-button-group-size` returns **zero matches**. `hx-button` never reads this property. The size cascade the component claims to provide via `--hx-button-group-size` is entirely inert.\n\n**Evidence of workaround:** Every story in `hx-button-group.stories.ts` that sets a size manually applies `hx-size` to both the group element AND each individual child button (e.g., `SmallSize`, `MediumSize`, `LargeSize`). This pattern contradicts the component's stated API and confirms the cascade does not work.\n\n**Impact:** The `hx-size` prop, the `@cssprop` JSDoc for `--hx-button-group-size`, and the corresponding tests (`Property: size`) all document a feature that silently fails at runtime. Consumers who rely on the group-level `hx-size` prop will see no size change on child buttons.\n\n---\n\n### P0-02: `::slotted(:focus-within)` CSS selector is invalid and non-functional\n\n**File:** `hx-button-group.styles.ts:89`\n\n```css\n.group ::slotted(:focus-within) {\n  z-index: 1;\n  position: relative;\n}\n```\n\nThe CSS `::slotted()` pseudo-element argument must be a **simple selector**. `:focus-within` is a relational pseudo-class, not a simple selector, and is not a valid argument inside `::slotted()`. Browsers silently drop invalid `::slotted()` rules.\n\n**Impact:** The mechanism intended to raise focused buttons above their siblings (to prevent shared-border clipping of the focus ring) is completely broken. In a button group, the overlapping negative-margin layout causes the focus ring of a non-last button to be clipped by the z-index of its right/bottom sibling. No browser will apply this rule. This is a direct WCAG 2.4.11 violation (Focus Appearance) in healthcare contexts where keyboard navigation is mandatory.\n\n**Fix direction:** Apply a class or attribute to the focused child from a `focusin`/`focusout` event listener on the host, then use `::slotted(.is-focused)` which is a valid simple selector.\n\n---\n\n## P1 — High (significant quality gaps)\n\n### P1-01: `@media (prefers-reduced-motion)` rule is non-functional across Shadow DOM\n\n**File:** `hx-button-group.styles.ts:96`\n\n```css\n@media (prefers-reduced-motion: reduce) {\n  .group ::slotted(*) {\n    transition: none;\n  }\n}\n```\n\nShadow DOM encapsulation is bidirectional. The `hx-button-group` shadow root **cannot override styles inside `hx-button`'s shadow root** via `::slotted(*)`. `::slotted()` applies to the slotted element's host-context styles, not to styles inside the child's own shadow tree. Since `hx-button` defines its transitions inside its own shadow DOM, this `transition: none` rule has zero effect.\n\n**Impact:** Users with `prefers-reduced-motion` still see button transition animations when interacting with a grouped button set. This is a WCAG 2.3.3 (Motion from Animation) violation.\n\n**Fix direction:** `hx-button` must respond to `prefers-reduced-motion` internally. The group cannot fix this from outside.\n\n---\n\n### P1-02: No test verifies that `label` property actually sets `internals.ariaLabel`\n\n**File:** `hx-button-group.test.ts:150`\n\nThe sole `label` test only asserts:\n```ts\nexpect(el.label).toBe('Form actions');\n```\n\nThis confirms the DOM property round-trip, not the accessibility effect. There is no assertion that `el.internals.ariaLabel === 'Form actions'` or that the computed accessible name of the group is correct. `ElementInternals` properties are not reflected as DOM attributes, so `getAttribute('aria-label')` will also return `null` — meaning a simple DOM check can't substitute for the missing assertion.\n\n**Impact:** Regression risk. The label mechanism could be silently broken with no failing test.\n\n---\n\n### P1-03: No keyboard navigation tests\n\n**File:** `hx-button-group.test.ts`\n\nThe test suite has zero keyboard interaction tests. There is no test for:\n- Tab key moving focus through buttons in horizontal orientation\n- Tab key moving focus through buttons in vertical orientation\n- Shift+Tab reverse traversal\n- Disabled children being skipped by Tab\n\nFor a `role=\"group\"` container in a healthcare application where keyboard navigation is a WCAG 2.1 AA requirement, the absence of keyboard interaction tests is a material quality gap.\n\n---\n\n### P1-04: No test for disabled child buttons\n\n**File:** `hx-button-group.test.ts`\n\nNo test exercises a group containing a `disabled` `hx-button`. Questions that need test coverage:\n- Does the border/radius CSS still render correctly with mixed enabled/disabled buttons?\n- Does a disabled button at position `:first-child` or `:last-child` correctly affect border-radius?\n- Does axe-core pass with a group containing disabled buttons?\n\n---\n\n### P1-05: `label` property missing from Storybook `argTypes`\n\n**File:** `hx-button-group.stories.ts:15`\n\nThe `argTypes` object defines controls for `orientation` and `size`, but not `label`. Storybook autodocs will show the prop (from CEM), but the Controls panel will have no widget for it, making it invisible to developers exploring the component interactively.\n\n---\n\n### P1-06: No story demonstrating the `label` property\n\n**File:** `hx-button-group.stories.ts`\n\nEvery story that uses an accessible label uses the HTML `aria-label` attribute directly (e.g., `PatientRecord`). No story demonstrates the component's own `label` property. A `WithLabel` story showing both mechanisms (property vs. attribute) is missing.\n\n---\n\n### P1-07: Mixed-variant tests absent from test suite\n\n**File:** `hx-button-group.test.ts`\n\nNo test exercises a group with mixed button variants (`primary` + `secondary` + `ghost`). The `MixedVariants` story exists in Storybook but has no corresponding browser test. Mixed variants can produce unexpected border behavior (different border colors from different variants create visible seams at join points).\n\n---\n\n## P2 — Medium (quality debt)\n\n### P2-01: `private internals` should be `#internals` (ES private field)\n\n**File:** `hx-button-group.ts:26`\n\n```ts\nprivate internals: ElementInternals;\n```\n\nTypeScript's `private` keyword is compile-time only — it is erased at runtime. Any external code can access `el.internals` at runtime. ES private fields (`#internals`) provide true encapsulation that survives compilation and is enforced by the JavaScript engine. The project uses `LitElement` which uses `#` fields internally; consistency requires `#internals` here.\n\n---\n\n### P2-02: Stories manually set `hx-size` on individual buttons — contradicts stated API\n\n**File:** `hx-button-group.stories.ts:116,130,144`\n\n```ts\n// SmallSize story\n<hx-button-group hx-size=\"sm\">\n  <hx-button variant=\"secondary\" hx-size=\"sm\">Edit</hx-button>\n```\n\nIf the group is supposed to cascade size via `--hx-button-group-size`, the children should not need `hx-size` set individually. This is both confusing API documentation for consumers and evidence that the cascade (P0-01) was known not to work during story authoring.\n\n---\n\n### P2-03: No `@cssprop` JSDoc for `--hx-button-border-radius`\n\n**File:** `hx-button-group.ts:20`\n\nThe component's JSDoc documents `--hx-button-group-size` but not `--hx-button-border-radius`, which is set on slotted children via `::slotted()` rules. This is a public API surface — consumers wrapping a custom element inside a group need to know that this variable will be overridden. CEM will not capture it.\n\n---\n\n### P2-04: `hx-icon-button` documented in slot but never tested or demonstrated\n\n**File:** `hx-button-group.ts:16`, `hx-button-group.test.ts`, `hx-button-group.stories.ts`\n\nThe `@slot` JSDoc states the default slot accepts `hx-button and hx-icon-button children`. No test or story includes an `hx-icon-button`. If `hx-icon-button` has a different internal structure (different border properties, different focus behavior), it may not render correctly inside a button group.\n\n---\n\n### P2-05: `_handleSlotChange` calls `requestUpdate` unconditionally\n\n**File:** `hx-button-group.ts:84`\n\n```ts\nprivate _handleSlotChange(): void {\n  this.requestUpdate();\n}\n```\n\nThe comment claims this is needed for `::slotted` CSS re-evaluation. However:\n1. Lit's reactive update cycle already re-evaluates `::slotted` selectors after slot changes.\n2. `requestUpdate()` triggers a full re-render on every slot mutation, including cases where no visual change occurred.\n3. This causes a performance cost for dynamic slot manipulation (e.g., adding/removing buttons programmatically).\n\nThe comment is a maintenance trap: it implies the re-render is necessary, which future developers will not question.\n\n---\n\n### P2-06: No `WithDisabledButtons` story\n\n**File:** `hx-button-group.stories.ts`\n\nNo story renders a group with one or more `disabled` children. The visual result (partial border collapse with a greyed-out button) is a common UX pattern in form toolbars that consumers need to preview.\n\n---\n\n## P3 — Informational / Low\n\n### P3-01: `role=\"group\"` without accessible name is valid but inadvisable in healthcare\n\n**File:** `hx-button-group.ts:57`\n\nThe default state (no `label`, no `aria-label`) produces a `role=\"group\"` element with no accessible name. ARIA spec does not require groups to have names, and axe-core does not flag this as a violation. However, the WCAG 2.4.6 success criterion (Headings and Labels) and clinical workflow accessibility guidelines recommend that all landmark/grouping elements have descriptive labels. Given the healthcare mandate, this should be treated as a best-practice requirement and clearly documented.\n\n---\n\n### P3-02: `--hx-button-group-size` uses a string identifier, not a CSS value\n\n**File:** `hx-button-group.ts:66`\n\nCSS custom properties are designed to hold CSS values (lengths, colors, identifiers recognized by CSS properties). Using a string like `'sm'` as a custom property value is non-standard. If the cascade were to work, `hx-button` would need to parse this string and map it to internal tokens via `@container style()` queries or `env()` references — both of which have limited browser support. A more robust design would cascade actual CSS values (e.g., `--hx-button-group-min-height: 2rem`) rather than abstract identifiers.\n\n---\n\n### P3-03: No bundle size data in component directory\n\n**File:** `hx-button-group/` (directory)\n\nNo recorded baseline for the component's minified + gzipped bundle size. The quality gate requires `<5KB`. The component is simple and almost certainly passes, but without a recorded baseline, regressions cannot be detected. A `BUNDLE.md` or CI annotation with the measured value is recommended.\n\n---\n\n### P3-04: `connectedCallback` and `updated` both set `ariaLabel` — duplicated logic\n\n**File:** `hx-button-group.ts:69,77`\n\n`ariaLabel` is set in both `connectedCallback` (for initial connection) and `updated` (for property changes). The `connectedCallback` path only fires when `this.label` is truthy. The `updated` path handles both truthy and falsy (sets `null` when empty). This is fine functionally but the duplication increases maintenance risk — a future developer patching one branch may miss the other.\n\n---\n\n## Summary\n\n| Severity | Count | Description |\n|----------|-------|-------------|\n| P0 | 2 | Size cascade broken; focus-ring rule uses invalid CSS selector |\n| P1 | 7 | Non-functional reduced-motion; missing label/keyboard/disabled tests; Storybook gaps |\n| P2 | 6 | Private field convention; story inconsistency; missing JSDoc; unused slot type |\n| P3 | 4 | Informational / best-practice observations |\n\nThe two P0 findings represent silent functional failures: the size cascade property is documented but inert, and the focus-ring fix for shared-border layout uses an invalid CSS selector that all browsers silently discard. Both must be resolved before this component can be considered production-ready.\n"
}
Now let me commit and verify:

🔧 Tool: ToolSearch
Input: {
  "query": "select:Bash",
  "max_results": 1
}

🔧 Tool: Bash
Input: {
  "command": "git diff --stat && git status",
  "description": "Check git status and diff"
}

🔧 Tool: Bash
Input: {
  "command": "git add packages/hx-library/src/components/hx-button-group/AUDIT.md && git commit -m \"$(cat <<'EOF'\ndocs(hx-button-group): antagonistic quality audit findings (T1-03)\n\nDocuments 2 P0, 7 P1, 6 P2, and 4 P3 findings including a broken\n--hx-button-group-size cascade (hx-button never reads the property),\nan invalid ::slotted(:focus-within) CSS selector that silently drops\nthe focus-ring fix, and a non-functional prefers-reduced-motion rule.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nEOF\n)\"",
  "description": "Commit AUDIT.md"
}

🔧 Tool: Bash
Input: {
  "command": "git push && gh pr create --title \"REVIEW: hx-button-group — Quality Audit Findings (T1-03)\" --body \"$(cat <<'EOF'\n## Summary\n\nAntagonistic quality audit of `hx-button-group` per feature T1-03. Audit-only PR — no implementation changes, AUDIT.md only.\n\n## Findings Overview\n\n| Severity | Count |\n|----------|-------|\n| P0 | 2 |\n| P1 | 7 |\n| P2 | 6 |\n| P3 | 4 |\n\n## Critical P0 Findings\n\n**P0-01: `--hx-button-group-size` size cascade is entirely non-functional**\n`hx-button` never reads `--hx-button-group-size`. The prop is documented, tested, and storybooked — but silently does nothing. Stories work around this by setting `hx-size` directly on every child button.\n\n**P0-02: `::slotted(:focus-within)` is an invalid CSS selector**\nThe rule intended to raise focused buttons above sibling z-index (preventing focus-ring clipping from negative-margin layout) uses `::slotted(:focus-within)`, which browsers silently discard. Focus rings are clipped by adjacent buttons in all browsers. Direct WCAG 2.4.11 violation.\n\n## Notable P1 Findings\n\n- `@media (prefers-reduced-motion)` rule targets `::slotted(*)` but cannot override styles inside `hx-button`'s shadow DOM — non-functional\n- `internals.ariaLabel` is never asserted in any test (only `el.label` DOM property is checked)\n- No keyboard navigation tests (Tab through group)\n- No disabled-children tests\n- `label` property missing from Storybook `argTypes` (no control widget)\n- No `WithLabel` story showing the label prop\n\nSee `AUDIT.md` for full findings with fix directions.\n\n## Test plan\n- [ ] Read AUDIT.md and agree with severity classifications\n- [ ] Create follow-up features for P0 fixes\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\nEOF\n)\"",
  "description": "Push branch and create PR"
}

🔧 Tool: Bash
Input: {
  "command": "git push origin HEAD && gh pr create --title \"REVIEW: hx-button-group — Quality Audit Findings (T1-03)\" --base dev --body \"$(cat <<'EOF'\n## Summary\n\nAntagonistic quality audit of `hx-button-group` per feature T1-03. Audit-only PR — no implementation changes, AUDIT.md only.\n\n## Findings Overview\n\n| Severity | Count |\n|----------|-------|\n| P0 | 2 |\n| P1 | 7 |\n| P2 | 6 |\n| P3 | 4 |\n\n## Critical P0 Findings\n\n**P0-01: `--hx-button-group-size` size cascade is entirely non-functional**\n`hx-button` never reads `--hx-button-group-size`. The prop is documented, tested, and storybooked — but silently does nothing. Stories work around this by setting `hx-size` directly on every child button.\n\n**P0-02: `::slotted(:focus-within)` is an invalid CSS selector**\nThe rule intended to raise focused buttons above sibling z-index (preventing focus-ring clipping from negative-margin layout) uses `::slotted(:focus-within)`, which browsers silently discard. Focus rings are clipped by adjacent buttons in all browsers. Direct WCAG 2.4.11 violation.\n\n## Notable P1 Findings\n\n- `@media (prefers-reduced-motion)` rule targets `::slotted(*)` but cannot override styles inside `hx-button`'s shadow DOM — non-functional\n- `internals.ariaLabel` is never asserted in any test (only `el.label` DOM property is checked)\n- No keyboard navigation tests (Tab through group)\n- No disabled-children tests\n- `label` property missing from Storybook `argTypes` (no control widget)\n- No `WithLabel` story showing the label prop\n\nSee `AUDIT.md` for full findings with fix directions.\n\n## Test plan\n- [ ] Read AUDIT.md and agree with severity classifications\n- [ ] Create follow-up features for P0 fixes\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\nEOF\n)\"",
  "description": "Push to feature branch and create PR against dev"
}
PR created: https://github.com/bookedsolidtech/helix/pull/176

<summary>
## Summary: Deep antagonistic quality review of `hx-button-group` (T1-03)

### Changes Implemented
- Created `AUDIT.md` with 19 findings across 4 severity levels (2 P0, 7 P1, 6 P2, 4 P3)

### Files Modified
- `packages/hx-library/src/components/hx-button-group/AUDIT.md` (created)

### Key Findings

**P0-01 (Critical): `--hx-button-group-size` cascade is broken**
`hx-button` never reads `--hx-button-group-size`. The component's core size-cascade feature is entirely non-functional. Stories mask this by manually setting `hx-size` on each child button.

**P0-02 (Critical): `::slotted(:focus-within)` is an invalid CSS selector**
The focus-ring fix for negative-margin shared-border layout uses `::slotted(:focus-within)` — browsers silently discard this rule because `::slotted()` only accepts simple selectors. Focus rings are clipped by adjacent buttons in all browsers. This is a direct WCAG 2.4.11 violation.

**Notable P1s:** Non-functional `prefers-reduced-motion` rule (can't pierce shadow DOM); `internals.ariaLabel` never asserted in tests; no keyboard navigation tests; no disabled-button tests; `label` prop missing from Storybook argTypes.

### Risks/Blockers Encountered
None — audit only, no implementation.

### Verification Status
This is a documentation-only PR (AUDIT.md). No Playwright verification required — the task explicitly states "document only, do not fix."

### Notes for Developer
The two P0 findings need follow-up features:
1. Implement `--hx-button-group-size` consumption in `hx-button`, or drop the prop from the group
2. Fix focus-ring z-index via `focusin`/`focusout` event listeners + `::slotted(.is-focused)` class toggle
</summary>