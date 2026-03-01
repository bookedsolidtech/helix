# Audit Report: wc-2026 (packages/hx-tokens)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: packages/hx-tokens/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

- **[ACCESSIBILITY] Focus ring composed contrast 1.24:1 on white — WCAG SC 1.4.11 fail**
  - File: `packages/hx-tokens/src/tokens.json`
  - Impact: Every interactive component using the default focus ring is nearly invisible to sighted keyboard users. Even at full opacity, primary-400 (#60A5FA) on white achieves only 2.54:1 — below the 3:1 SC 1.4.11 minimum. The `focus.ring-opacity: 0.25` token composites the ring to #D7E9FE on white, yielding **1.24:1**. Healthcare mandate: keyboard-only and low-vision users cannot identify focused controls.
  - Evidence: `focus.ring-color = var(--hx-color-primary-400) = #60A5FA`. `focus.ring-opacity = 0.25`. Alpha-composited over white (#FFFFFF): result #D7E9FE, contrast 1.24:1. At full opacity: 2.54:1. Both fail WCAG SC 1.4.11 (minimum 3:1).
  - Fix: Replace `focus.ring-color` with `primary-600` (#1D4ED8), which achieves 6.70:1 on white. Set `focus.ring-opacity` to `1` or eliminate it. In dark mode, retain primary-400 (achieves 7.02:1 on #0F172A). Alternatively apply a dual-layer focus indicator: 2px primary-700 outline plus 2px white offset ring.

- **[DEPLOYMENT] Package exports map points to .ts source files — broken for all non-TypeScript consumers**
  - File: `packages/hx-tokens/package.json:10`
  - Impact: Any consumer outside this Turborepo monorepo (Drupal CDN integration, plain Node.js scripts, standard npm install) will receive a package whose entry points are non-executable `.ts` files. The `files` field publishes `dist/` and `src/tokens.json` but NOT `src/*.ts` — so the exports map targets are absent from the published artifact. Compiled `dist/index.js`, `dist/css.js`, `dist/lit.js`, `dist/utils.js` all exist and are correct but are entirely unreachable.
  - Evidence: `exports['.'].import = './src/index.ts'`. `files = ['dist', 'src/tokens.json']` — `src/*.ts` not included. Compiled dist files confirmed present but not referenced by any export condition.
  - Fix: Update all export conditions: `{ '.': { types: './dist/index.d.ts', import: './dist/index.js' }, './css': { types: './dist/css.d.ts', import: './dist/css.js' }, './lit': { types: './dist/lit.d.ts', import: './dist/lit.js' }, './utils': { types: './dist/utils.d.ts', import: './dist/utils.js' } }`. Update top-level `main` and `types` fields accordingly.

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

- **[ACCESSIBILITY] text.on-secondary (white on secondary-500 #0891B2) fails WCAG SC 1.4.3 at 3.68:1**
  - File: `packages/hx-tokens/src/tokens.json:115`
  - Impact: Normal text rendered with `text.on-secondary` on secondary-500 backgrounds (badges, chips, filled buttons) fails WCAG 2.1 SC 1.4.3. In healthcare where secondary colours may indicate status, low-vision users cannot reliably read this text.
  - Evidence: `color.text.on-secondary = var(--hx-color-neutral-0) = #FFFFFF`. `secondary-500 = #0891B2`. Calculated: 3.68:1. WCAG minimum 4.5:1 — FAIL by 0.82 ratio points.
  - Fix: Replace `text.on-secondary` with `var(--hx-color-neutral-900)` (#0F172A on secondary-500 = 9.04:1). Or darken background reference to secondary-700 (#155E75) where white achieves 7.52:1.

- **[ACCESSIBILITY] text.on-success (white on success-500 #16A34A) fails WCAG SC 1.4.3 at 3.30:1**
  - File: `packages/hx-tokens/src/tokens.json:117`
  - Impact: Confirmation banners and positive-state indicators using `text.on-success` fail WCAG 2.1 SC 1.4.3. In healthcare, success states may confirm medication administration — low-vision users cannot reliably read these messages.
  - Evidence: `color.text.on-success = var(--hx-color-neutral-0) = #FFFFFF`. `success-500 = #16A34A`. Calculated: 3.30:1. WCAG minimum 4.5:1 — FAIL by 1.20 ratio points.
  - Fix: Replace with `var(--hx-color-neutral-900)` (#0F172A on success-500 = 9.13:1). If white text is required, minimum-passing background is success-600 (#15803D) at 4.72:1.

- **[ACCESSIBILITY] text.on-info (white on info-500 #0284C7) fails WCAG SC 1.4.3 at 4.10:1**
  - File: `packages/hx-tokens/src/tokens.json:119`
  - Impact: Informational banners and info-state chips using `text.on-info` fail WCAG 2.1 SC 1.4.3. Clinical guidance messages are unreadable for low-vision users.
  - Evidence: `color.text.on-info = var(--hx-color-neutral-0) = #FFFFFF`. `info-500 = #0284C7`. Calculated: 4.10:1. WCAG minimum 4.5:1 — FAIL by 0.40 ratio points.
  - Fix: Replace with `var(--hx-color-neutral-900)` (#0F172A on info-500 = 7.04:1). Or reference info-600 (#0369A1) as background where white achieves 5.24:1.

- **[DATA_INTEGRITY] color.accent and color.warning are identical across all 11 scale steps — copy-paste error**
  - File: `packages/hx-tokens/src/tokens.json:29`
  - Impact: Every consumer of `--hx-color-accent-*` gets warning amber instead of a distinct accent colour. Accent and warning states are visually indistinguishable, violating WCAG 1.4.1 (Use of Color). In healthcare dashboards, confusing decorative accent with clinical warning states is a patient-safety risk.
  - Evidence: Lines 29-41 (accent) and 69-81 (warning) are byte-for-byte identical across all 11 scales (50–950). Runtime comparison confirmed: `JSON.stringify(tokens.color.accent) === JSON.stringify(tokens.color.warning)` is `true`. `accent-500 = warning-500 = #D97706`.
  - Fix: Define a distinct accent colour ramp (e.g., Tailwind violet: 50=#F5F3FF, 500=#7C3AED, 950=#2E1065). This is a breaking change requiring a semver major bump and changeset.

- **[DATA_INTEGRITY] easing.default and easing.in-out share identical cubic-bezier values — easing.in-out is semantically wrong**
  - File: `packages/hx-tokens/src/tokens.json:256`
  - Impact: Components using `--hx-easing-in-out` for bidirectional transitions (accordions, drawers) get asymmetric fast-out-slow-in motion instead of true symmetric in-out, causing janky perceived animation in clinical workflows.
  - Evidence: `easing.default = 'cubic-bezier(0.4, 0, 0.2, 1)'`. `easing['in-out'] = 'cubic-bezier(0.4, 0, 0.2, 1)'`. Confirmed identical by script. Standard CSS ease-in-out = `cubic-bezier(0.42, 0, 0.58, 1)`.
  - Fix: Correct `easing.in-out` to `cubic-bezier(0.42, 0, 0.58, 1)`. Breaking change — components consuming `--hx-easing-in-out` will change animation behaviour.

- **[DATA_INTEGRITY] color.focus-ring and focus.ring-color are duplicate tokens that diverge in dark mode**
  - File: `packages/hx-tokens/src/tokens.json:137`
  - Impact: Components must choose between `--hx-color-focus-ring` and `--hx-focus-ring-color`. Both equal primary-400 in light mode, but only `--hx-color-focus-ring` is overridden in dark mode. Components using `--hx-focus-ring-color` retain the light-mode value in dark mode, causing inconsistent focus ring colouring.
  - Evidence: `color.focus-ring` (line 137) → `--hx-color-focus-ring`. `focus.ring-color` (line 268) → `--hx-focus-ring-color`. Dark mode (line 385) overrides `--hx-color-focus-ring` but has no `--hx-focus-ring-color` override. Both values confirmed identical in light mode.
  - Fix: Remove `color.focus-ring`. All components should use `--hx-focus-ring-color` exclusively. Add `dark.focus.ring-color` to the dark section.

- **[DATA_INTEGRITY] Dark mode missing all on-color text token overrides**
  - File: `packages/hx-tokens/src/tokens.json:361`
  - Impact: Dark mode has no overrides for `on-primary`, `on-secondary`, `on-error`, `on-success`, `on-warning`, `on-info`. If any surface background changes for dark theming, on-colour text won't update correspondingly. Additionally, `color.text.on-accent` is missing in both light and dark modes.
  - Evidence: `dark.color.text` keys (lines 361-389): primary, secondary, muted, disabled, inverse, link, link-hover, link-visited, link-active. Keys `on-*` are entirely absent. `color.text` also has no `on-accent` entry.
  - Fix: Add `on-*` overrides under `dark.color.text` for all six semantic states. Fix the three failing light-mode on-colour pairs first (on-secondary, on-success, on-info). Add `color.text.on-accent = var(--hx-color-neutral-900)` in both modes.

- **[TESTING] Zero test files in @helix/tokens — package invisible to Turborepo test pipeline**
  - File: `packages/hx-tokens/package.json:37`
  - Impact: 12 hx-library components import `tokenStyles` from `@helix/tokens/lit`. The admin dashboard imports 4 utility functions. The docs token-explorer imports `resolveTokenRef`. All consumers depend on logic with zero test coverage. The CLAUDE.md 100% test pass gate is structurally broken for this package — Turborepo silently skips it.
  - Evidence: `find /workspace/packages/hx-tokens -name '*.test.*'` returns no output. `package.json` scripts: `{ build, type-check, clean }` — no `test` key. No `vitest.config.ts` exists.
  - Fix: Create `vitest.config.ts` with `environment: 'node'`. Add `'test': 'vitest run --coverage'` to scripts. Add `vitest` and `@vitest/coverage-v8` to devDependencies. Priority test targets: `flattenTokens`, `getContrastColor`, `resolveTokenRef`, CSS string structure, `tokenMap` integrity.

- **[CODE_QUALITY] getContrastColor produces wrong output for 3-char hex — runtime confirmed**
  - File: `packages/hx-tokens/src/utils.ts:64`
  - Impact: The admin dashboard colors page and docs token explorer both call `getContrastColor` to determine black/white text for colour swatches. For 3-char hex (#fff, #000), `parseInt('', 16)` returns `NaN`. Luminance becomes `NaN`. `NaN > 0.5` is `false`, so `'#ffffff'` is always returned — meaning `#000` incorrectly returns white text.
  - Evidence: `utils.ts:68`: `parseInt(clean.substring(4, 6), 16)` — for 3-char hex, `substring(4, 6) = ''`, yielding `NaN`. `isHexColor()` regex (`/^#[0-9a-fA-F]{3,8}$/`) accepts 3-8 char hex, creating a false contract. Runtime confirmed: `getContrastColor('#fff') = '#ffffff'` (incorrect).
  - Fix: Expand 3-char hex before processing: `#abc → #aabbcc`. Handle 4-char alpha and strip alpha from 8-char inputs. Or constrain `isHexColor` to only accept 6-char hex to match what `getContrastColor` can process.

- **[SECURITY] lit.ts uses css() TemplateStringsArray double-cast — bypasses Lit's CSS injection safeguard**
  - File: `packages/hx-tokens/src/lit.ts:5`
  - Impact: Lit's `css()` tagged template enforces that CSS originates from static template strings to prevent injection. The `as unknown as TemplateStringsArray` cast bypasses this. If `tokens.json` is ever compromised, malicious CSS values could escape the `:host {}` block and inject rules into shadow DOM of all hx-library components.
  - Evidence: Lines 5-7 and 12-15: `css([...dynamic...] as unknown as TemplateStringsArray)`. The double `as unknown as` chain exists specifically because TypeScript rejects the direct cast. Token values are interpolated with no sanitization.
  - Fix: Replace with `unsafeCSS()` from `lit`: `import { unsafeCSS } from 'lit'`. Use `unsafeCSS(':host { ... }')` for both `tokenStyles` and `darkTokenStyles`. Add comment: `// unsafeCSS is appropriate: values are statically derived from tokens.json, not user input`.

- **[TYPE_SAFETY] groupBy casts entry[field] as string — silently corrupts path (string[]) and description (string | undefined)**
  - File: `packages/hx-tokens/src/index.ts:38`
  - Impact: `TokenEntry.path` is `string[]` and `description` is `string | undefined`. If `groupBy` is called with `field='path'`, the key becomes the string representation of an array (`'color,primary,500'`). If called with `field='description'`, `undefined` coerces to `'undefined'`. TypeScript cannot catch this because the signature accepts any `keyof TokenEntry`.
  - Evidence: Line 38: `const key = entry[field] as string`. `TokenEntry.path` (types.ts:12) = `string[]`; `description` (line 13) = `string | undefined`. Runtime confirmed: `entry['description']` returns `undefined`.
  - Fix: Constrain the parameter: `field: keyof Pick<TokenEntry, 'name' | 'value' | 'category' | 'group' | 'key'>`. Remove the cast — the constrained type is already `string`.

- **[TYPE_SAFETY] isTokenDefinition type guard does not verify value is a string**
  - File: `packages/hx-tokens/src/index.ts:6`
  - Impact: The guard returns `true` for any object with a `'value'` property regardless of its type. `{ value: 42 }` passes and is stored in `TokenEntry.value` (typed as `string`) without assertion. Any non-conforming token structure silently produces a corrupted `TokenEntry` propagated to all consumers.
  - Evidence: Line 7: `'value' in obj` — no `typeof` check on the property value. Runtime confirmed: `isTokenDefinition({ value: 42 })` returns `true`. `TokenDefinition.value` is typed as `string`.
  - Fix: `return typeof obj === 'object' && obj !== null && 'value' in obj && typeof (obj as Record<string, unknown>)['value'] === 'string'`

- **[PERFORMANCE] Missing sideEffects: false prevents tree-shaking of @helix/tokens**
  - File: `packages/hx-tokens/package.json`
  - Impact: Without `"sideEffects": false`, bundlers cannot eliminate unused exports. A consumer importing only `@helix/tokens/utils` (2,306 bytes, zero Lit dependency) will cause the bundler to retain the full module graph including `lit.ts`, pulling in the Lit runtime (~5KB min+gz). Critical for Drupal CDN scenarios where only CSS tokens are needed.
  - Evidence: `package.json` has no `sideEffects` field. `dist/utils.js` is 2,306 bytes with zero runtime dependencies. `dist/lit.js` imports from `'lit'`.
  - Fix: Add `"sideEffects": false` to `package.json`. Optionally refine: `"sideEffects": ["./dist/tokens.css"]` since the CSS file is the only genuine side-effect artifact.

- **[DEPLOYMENT] lit declared as runtime dependency — forces Lit on all consumers regardless of import subpath**
  - File: `packages/hx-tokens/package.json:43`
  - Impact: Any package importing `@helix/tokens` gets `lit` as a transitive dependency even if only consuming `./utils` or `./css`. `hx-library` already has `lit` as a direct dependency — adding it again via `@helix/tokens` risks duplicate Lit instances and broken `CSSResult` sharing between `tokenStyles` and component styles.
  - Evidence: `dependencies: { 'lit': '^3.3.2' }`. Lit imported only in `src/lit.ts`. All other entry points have zero Lit imports.
  - Fix: Move `lit` to `peerDependencies: { 'lit': '>=3.0.0' }` with `peerDependenciesMeta: { 'lit': { 'optional': true } }`.

- **[DEPLOYMENT] Build script uses npx tsx instead of locally installed tsx — non-deterministic CI builds**
  - File: `packages/hx-tokens/package.json:38`
  - Impact: `npx tsx` downloads from npm if not cached, potentially executing against a different tsx version than the pinned devDependency. Non-reproducible builds violate audit trail requirements for healthcare enterprise CI/CD.
  - Evidence: `scripts.build = 'tsc && npx tsx scripts/generate-css.ts'`. `tsx@^4.19.0` is in devDependencies and available at `./node_modules/.bin/tsx` after `npm ci`.
  - Fix: Change to `'tsc && tsx scripts/generate-css.ts'`. npm scripts automatically resolve from `./node_modules/.bin`.

- **[DEPLOYMENT] CI matrix tests Node.js 18 despite engines field requiring >=20**
  - File: `.github/workflows/ci-matrix.yml:33`
  - Impact: CI actively runs builds on an unsupported Node version, creating false confidence in Node 18 compatibility. `fail-fast: false` means other matrix jobs continue even on failure, obscuring root causes.
  - Evidence: `package.json engines: { 'node': '>=20.0.0' }`. `ci-matrix.yml:33 node-version: [18, 20, 22]`.
  - Fix: Remove Node 18 from the matrix: `node-version: [20, 22]`. If Node 18 support is intentional, update the engines field accordingly.

---

## MEDIUM (fix this month — polish, best practices, maintainability)

- **[ACCESSIBILITY] size.touch-target = 2.75rem — exactly at WCAG 2.5.5 minimum with no tolerance margin**
  - File: `packages/hx-tokens/src/tokens.json:345`
  - Impact: At 16px root: 44px exactly. At 15px root: 41.25px (FAIL). At 14px root: 38.5px (FAIL). Enterprise dashboards and clinical kiosks commonly reduce root font size, dropping below the WCAG minimum.
  - Evidence: `size.touch-target = '2.75rem'`. WCAG 2.5.5 requires 44 CSS pixels — not 44 rem-equivalent pixels. Sub-16px root font sizes are common in enterprise applications.
  - Fix: Change to `'3rem'` (48px at 16px root, with a safety margin aligned to iOS HIG 44pt recommendation).

- **[ACCESSIBILITY] duration.reduced undocumented as the canonical prefers-reduced-motion value**
  - File: `packages/hx-tokens/src/tokens.json:253`
  - Impact: `duration.reduced = '0ms'` and `duration.instant = '0ms'` are semantically identical with no distinguishing documentation. Component authors may use `duration.fast/normal` inside `@media (prefers-reduced-motion: reduce)` instead of `duration.reduced`, violating WCAG SC 2.3.3. `transition.*` tokens have no reduced counterparts.
  - Evidence: Line 248: `duration.instant = '0ms'`. Line 253: `duration.reduced = '0ms'`. No `description` field on either token.
  - Fix: Add description to `duration.reduced`: `"Use inside @media (prefers-reduced-motion: reduce) blocks only."` Add `transition.reduced: { value: '0ms ease' }` to complete the reduced-motion swap set.

- **[CODE_QUALITY] resolveTokenRef regex only resolves first var() per iteration — multi-var values partially unresolved**
  - File: `packages/hx-tokens/src/utils.ts:54`
  - Impact: `String.match()` without `'g'` flag returns only the first match. A value with two independent `var()` references (`'var(--a) var(--b)'`) resolves only `--a` in iteration 1. With `maxDepth=5`, values with 5+ parallel references remain partially unresolved silently.
  - Evidence: Line 54: `resolved.match(...)` — no `g` flag. Runtime confirmed: `resolveTokenRef('var(--a) var(--b)', map, 1)` returns only `--a` resolved, `var(--b)` untouched.
  - Fix: Use global replacement: `resolved = resolved.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (full, name, fb) => tokenMap[name] ?? fb?.trim() ?? full)` inside a depth-limited while loop that breaks when the string stops changing.

- **[CODE_QUALITY] Duplicate flatten logic between src/index.ts and scripts/generate-css.ts — DRY violation**
  - File: `packages/hx-tokens/scripts/generate-css.ts:11`
  - Impact: Both files implement identical path-joining (`'--hx-' + path.join('-')`) and recursive tree-walking. Any naming convention change must be applied in two places. `generate-css.ts` is excluded from type-checking (separate issue), making drift undetectable.
  - Evidence: `generate-css.ts:22`: `name = '--hx-${path.join('-')}'` identical to `index.ts:19`. Both check `'value' in val` and recurse. `generate-css.ts` declares `TokenDef` duplicating `TokenDefinition`.
  - Fix: Export a low-level flatten utility from `src/utils.ts` returning `{name, value}[]`. Import in `generate-css.ts`.

- **[ERROR_HANDLING] generate-css.ts has no error handling around readFileSync or JSON.parse**
  - File: `packages/hx-tokens/scripts/generate-css.ts:33`
  - Impact: If `tokens.json` is missing, contains merge conflict markers, or is malformed JSON, the build script throws a raw Node.js stack trace with no actionable message. In CI, this produces a red build with opaque output.
  - Evidence: Lines 33-34: `const tokens = JSON.parse(readFileSync(jsonPath, 'utf-8'))` — no `try/catch`.
  - Fix: Wrap in `try/catch`: `try { ... } catch (e) { console.error('[generate-css] Failed:', e instanceof Error ? e.message : e); process.exit(1); }`

- **[TYPE_SAFETY] tokensJson cast to Record<string, unknown> discards the precise typed JSON import**
  - File: `packages/hx-tokens/src/index.ts:51`
  - Impact: TypeScript infers a precise type for `tokensJson` from `resolveJsonModule`. The cast discards this, meaning a rename of the `'dark'` key in `tokens.json` would silently make `darkJson` undefined with no compile error.
  - Evidence: Line 51: `const { dark: darkJson, ...lightJson } = tokensJson as Record<string, unknown>`. The precise JSON import type knows the `'dark'` key exists — the cast is unnecessary.
  - Fix: Remove the cast. Access the dark key directly: `const { dark: darkJson, ...lightJson } = tokensJson`. If the inferred type resists destructuring, use `satisfies` to validate without widening.

- **[SECURITY] Token values injected into CSS output without schema validation — CSS injection surface across three code paths**
  - File: `packages/hx-tokens/scripts/generate-css.ts:50`
  - Impact: Token values are interpolated directly into CSS strings in `generate-css.ts`, `css.ts`, and `lit.ts` with no validation. A compromised `tokens.json` (unauthorized commit, supply chain attack) could inject arbitrary CSS into `dist/tokens.css` — the primary Drupal CDN artifact consumed by all healthcare applications.
  - Evidence: `generate-css.ts:50`: `lines.push('  ${t.name}: ${t.value};')`. `css.ts:5`: same pattern. `lit.ts:6`: same. Three independent injection surfaces sharing no validation logic.
  - Fix: Implement schema validation for `tokens.json` at build time. Validate all values are legitimate CSS. Reject values containing `{`, `}`, `/*`, `*/`. Centralize validation in `src/index.ts` so all three consumers benefit.

- **[DATA_INTEGRITY] transition tokens hardcode 'ease' keyword — disconnected from easing token system**
  - File: `packages/hx-tokens/src/tokens.json:262`
  - Impact: Consumers overriding `--hx-easing-default` for theming will have no effect on components using `--hx-transition-*` tokens. The easing and transition systems are disconnected, breaking cascade architecture.
  - Evidence: Lines 263-265: `transition.fast = '150ms ease'`, `transition.normal = '250ms ease'`, `transition.slow = '350ms ease'`. The easing token system (lines 255-261) defines 5 cubic-bezier curves unused by transition shortcuts.
  - Fix: Rewrite: `transition.fast = '150ms var(--hx-easing-default)'`, etc. CSS custom properties in transition shorthand timing-function position are valid CSS.

- **[DATA_INTEGRITY] opacity.disabled and opacity.overlay hardcode values that duplicate scale tokens**
  - File: `packages/hx-tokens/src/tokens.json:330`
  - Impact: `opacity.disabled (0.5) = opacity['50'] (0.5)` and `opacity.overlay (0.75) = opacity['75'] (0.75)`. Components using `--hx-opacity-50` instead of `--hx-opacity-disabled` won't respond to overrides of `--hx-opacity-disabled`. Theming is fragmented across parallel token paths.
  - Evidence: Lines 330-331: confirmed duplicate values. Script comparison: duplicate 50/disabled = true, duplicate 75/overlay = true.
  - Fix: `opacity.disabled.value = 'var(--hx-opacity-50)'`, `opacity.overlay.value = 'var(--hx-opacity-75)'`. Single source of truth via reference cascade.

- **[DATA_INTEGRITY] breakpoint and container token categories duplicate four identical pixel values**
  - File: `packages/hx-tokens/src/tokens.json:293`
  - Impact: `breakpoint.sm/md/lg/xl = container.sm/md/lg/xl` (640px, 768px, 1024px, 1280px). Any breakpoint update must change both locations. The schemas are also inconsistent: `container` has no `2xl`, `breakpoint` has `2xl = 1536px`.
  - Evidence: Lines 293-299 and 347-353 — four identical pixel values across both categories, confirmed.
  - Fix: `container.sm.value = 'var(--hx-breakpoint-sm)'`, etc. Retain `container.content` (72rem) as its own value. Add `container.2xl = 'var(--hx-breakpoint-2xl)'`.

- **[DATA_INTEGRITY] Dark mode missing focus.ring-color override — diverges from color.focus-ring**
  - File: `packages/hx-tokens/src/tokens.json:267`
  - Impact: Dark mode overrides `--hx-color-focus-ring` but not `--hx-focus-ring-color`. Components using `--hx-focus-ring-color` retain the light-mode value in dark mode.
  - Evidence: `dark` section (lines 360-402): `color`, `body`, `shadow` present — no `focus` key. `dist/tokens.css` dark block confirms `--hx-color-focus-ring` overridden but `--hx-focus-ring-color` absent.
  - Fix: Add `dark.focus.ring-color` to dark section. Long-term: consolidate to one focus ring token (see HIGH issue above).

- **[DATA_INTEGRITY] Missing healthcare-specific clinical status tokens**
  - File: `packages/hx-tokens/src/tokens.json`
  - Impact: Clinical UIs require distinct semantic tokens for patient alert states (critical, high, moderate, normal, low) separate from generic error/warning/success. Without them, component authors hardcode clinical colours, creating inconsistency across healthcare applications. A critical vital sign alert must be visually distinct from a form validation error.
  - Evidence: Color scales present: primary, secondary, accent, neutral, success, warning, error, info. No `color.status.*` or `color.clinical.*` category. CLAUDE.md explicitly identifies this as an enterprise healthcare library where software failures impact patient care.
  - Fix: Add `color.status: { critical, high, moderate, normal, low }` with distinct colour scales. Add `text.on-status.*` pairing tokens. Consider aligning with HL7 FHIR observation interpretation codes.

- **[DEPLOYMENT] dist/tokens.json is an unverified duplicate of src/tokens.json — drift possible**
  - File: `packages/hx-tokens/tsconfig.json:11`
  - Impact: `tsconfig.json` includes `src/**/*.json`, causing `tsc` to copy `src/tokens.json` to `dist/tokens.json`. Two independent copies of the token source of truth exist with no CI assertion they are identical. A cached build can produce CSS inconsistent with the dist copy.
  - Evidence: `tsconfig.json include: ['src/**/*.ts', 'src/**/*.json']`. Both `src/tokens.json` and `dist/tokens.json` confirmed present. No equality check in CI.
  - Fix: Remove `src/**/*.json` from `tsconfig.json include`. JSON files are resolved via `resolveJsonModule` at import time — they don't need compilation.

- **[DEPLOYMENT] Changeset config links private @helix/tokens with @helix/library — publish workflow conflict**
  - File: `.changeset/config.json`
  - Impact: Changesets bumps both packages together but skips publishing `@helix/tokens` (private: true). This creates a mismatch between recorded versions and published state, potentially corrupting release changelogs.
  - Evidence: `.changeset/config.json: "linked": [["@helix/library", "@helix/tokens"]]`. `packages/hx-tokens/package.json: "private": true`.
  - Fix: Remove `@helix/tokens` from the linked array. Use `updateInternalDependencies: 'patch'` to keep workspace references in sync automatically.

- **[DEPLOYMENT] Turborepo build outputs missing tsconfig.tsbuildinfo — incremental compilation cache not restored**
  - File: `turbo.json:7`
  - Impact: `hx-tokens` and `hx-library` both use TypeScript composite projects. Without `tsconfig.tsbuildinfo` in Turbo outputs, cache restores don't include the incremental build state, forcing full recompilation on every cache hit.
  - Evidence: `turbo.json build.outputs: ['dist/**', '.astro/**', '.next/**']`. `tsconfig.json: "composite": true`. `tsconfig.tsbuildinfo` exists on disk (46906 bytes) but is undeclared as a Turbo output.
  - Fix: Add `'tsconfig.tsbuildinfo'` to build outputs: `'outputs': ['dist/**', 'tsconfig.tsbuildinfo', '.astro/**', '.next/**']`.

- **[CODE_QUALITY] scripts/ excluded from tsconfig — generate-css.ts never type-checked**
  - File: `packages/hx-tokens/tsconfig.json:12`
  - Impact: `generate-css.ts` produces `dist/tokens.css` — the primary Drupal CDN artifact. Type errors in this script are invisible to `npm run type-check` and CI Gate 1. The script contains a redundant cast pattern that would be caught if type-checked.
  - Evidence: `tsconfig.json exclude: ['node_modules', 'dist', 'scripts']`. `generate-css.ts` is executed at build time via `tsx` (no type-checking).
  - Fix: Create `tsconfig.scripts.json` extending the base config with `include: ['scripts/**/*.ts']`. Update type-check script: `'tsc --noEmit && tsc -p tsconfig.scripts.json --noEmit'`.

- **[CODE_QUALITY] Missing README.md — package has no documentation**
  - File: `packages/hx-tokens/`
  - Impact: npm registry shows "No readme found". Developers cannot understand the package's purpose, API surface, or token structure without reading source code. Significantly increases onboarding time.
  - Evidence: Directory listing shows no `README.md`. Only source files present.
  - Fix: Create `README.md` covering: description, installation, import paths, usage examples for each entry point (`/`, `/css`, `/lit`, `/utils`, `/tokens.css`, `/tokens.json`), dark mode usage, and token structure overview.

- **[CODE_QUALITY] No lint script in package.json and hx-tokens dist/ not excluded from root ESLint config**
  - File: `packages/hx-tokens/package.json:37`
  - Impact: (1) Turborepo silently skips linting for `hx-tokens`. (2) Root `eslint.config.js` excludes `dist/**` relative to workspace root and `packages/hx-library/dist/**` explicitly, but `packages/hx-tokens/dist/**` is absent — generated `.js` files in dist are actively linted.
  - Evidence: `package.json scripts: { build, type-check, clean }` — no lint entry. `eslint.config.js ignores` does not include `packages/hx-tokens/dist/**`.
  - Fix: Add `'lint': 'eslint src/'` to scripts. Add `'packages/hx-tokens/dist/**'` to root `eslint.config.js` ignores.

---

## LOW (backlog — minor improvements, nice-to-haves)

- **[ACCESSIBILITY] text.disabled low contrast — intentional WCAG exemption undocumented**
  - File: `packages/hx-tokens/src/tokens.json:112`
  - Impact: `text.disabled` (#94A3B8 on white = 2.56:1) and `dark.color.text.disabled` (#475569 on #0F172A = 2.36:1) are intentionally low contrast under the WCAG SC 1.4.3 exemption for inactive components. However, no documentation of the exemption exists on the tokens — creating risk of misuse on non-disabled text.
  - Evidence: `color.text.disabled = var(--hx-color-neutral-400) = #94A3B8`. Contrast 2.56:1. WCAG 1.4.3 explicitly exempts inactive UI components with `aria-disabled=true` or native `disabled` attribute.
  - Fix: Add `description` fields to both tokens documenting the WCAG exemption condition and that these tokens must ONLY be used for inactive UI components.

- **[TYPE_SAFETY] Redundant as TokenDefinition cast after isTokenDefinition type guard**
  - File: `packages/hx-tokens/src/index.ts:17`
  - Impact: The type guard at line 16 already narrows `val` to `TokenDefinition`. The `const def = val as TokenDefinition` intermediate variable is redundant noise that establishes a pattern of preferring casts over type guards.
  - Evidence: Line 16: `if (isTokenDefinition(val)) {` — `val` is already `TokenDefinition`. Line 17: `const def = val as TokenDefinition` — unnecessary.
  - Fix: Remove the intermediate variable. Replace `def.value`/`def.description` with `val.value`/`val.description` directly.

- **[TYPE_SAFETY] TokenEntry.description typed as string | undefined but always set to string at runtime**
  - File: `packages/hx-tokens/src/index.ts:25`
  - Impact: Consumers reading the interface must null-check `description` even though it is always a non-undefined string at runtime. With `exactOptionalPropertyTypes` enabled in `tsconfig.base.json`, this mismatch is material.
  - Evidence: `types.ts:13: description?: string`. `index.ts:25: description: def.description ?? ''` — always a string, never undefined.
  - Fix: Change the interface to `description: string` to match the runtime guarantee.

- **[DATA_INTEGRITY] --hx-space-px sorts last in generated CSS due to JavaScript object key ordering**
  - File: `packages/hx-tokens/src/tokens.json:177`
  - Impact: `Object.entries()` processes integer-like string keys numerically first, then non-integer string keys. `'px'` sorts after `'64'`, so `--hx-space-px` appears after `--hx-space-64` in the generated CSS — a non-semantic ordering artifact.
  - Evidence: `dist/tokens.css`: numeric space tokens 0-64 appear in order; `--hx-space-px` appears last after `--hx-space-64`.
  - Fix: Move the `'px'` key before `'0'` in the space object in `tokens.json`.

- **[CODE_QUALITY] Missing package.json metadata: keywords, repository, homepage, author, license**
  - File: `packages/hx-tokens/package.json`
  - Impact: npm registry cannot display keywords, repository link, homepage, author, or license. Package is unsearchable. npm install may generate warnings about missing fields.
  - Evidence: Present fields: name, version, private, description, type, main, types, exports, files, scripts, dependencies, devDependencies. Absent: keywords, repository, homepage, author, license.
  - Fix: Add `keywords: ['design-tokens', 'css-variables', 'lit', 'web-components', 'healthcare']`, `repository`, `license`, and `author` fields.

- **[DEPLOYMENT] No engines field in hx-tokens package.json despite monorepo requiring Node >=20**
  - File: `packages/hx-tokens/package.json`
  - Impact: Consumers reading the package's own engines constraint see no restriction, potentially allowing installation on unsupported Node versions.
  - Evidence: Root `package.json: engines: { 'node': '>=20.0.0' }`. `hx-tokens/package.json` has no `engines` field.
  - Fix: Add `"engines": { "node": ">=20.0.0" }` to match the root constraint.

- **[DEPLOYMENT] No Turborepo remote cache configuration in CI pipeline**
  - File: `.github/workflows/ci.yml`
  - Impact: Every CI run performs a full cold build with no cache hits, increasing cycle time for all contributors.
  - Evidence: No `TURBO_TOKEN`, `TURBO_TEAM`, or Vercel Remote Cache configuration in `ci.yml` or `ci-matrix.yml`.
  - Fix: Add `TURBO_TOKEN` and `TURBO_TEAM` to GitHub Actions secrets. Configure turbo commands: `--team=${{ vars.TURBO_TEAM }} --token=${{ secrets.TURBO_TOKEN }}`.

- **[PERFORMANCE] Dark token CSS string built twice in memory — 1,626 bytes of redundant allocation**
  - File: `packages/hx-tokens/src/css.ts:9`
  - Impact: `darkMediaCSS` and `darkManualCSS` both iterate `darkTokenEntries`, producing the same 27 CSS declarations differing only in their selector wrapper. 1,626 bytes duplicated in memory; `fullTokensCSS` holds all three strings, repeating dark content a third time.
  - Evidence: Measured: `tokensCSS` = 10,093 bytes, `darkMediaCSS` = 1,731 bytes, `darkManualCSS` = 1,626 bytes, `fullTokensCSS` = 13,452 bytes. The 27 declarations appear separately in both media-query and manual blocks.
  - Fix: Extract shared declarations: `const darkDecls = darkTokenEntries.map(t => '    ${t.name}: ${t.value};').join('\\n')`. Compose both block strings by wrapping `darkDecls`.

- **[CODE_QUALITY] Eager evaluation in index.ts is architecturally correct but undocumented**
  - File: `packages/hx-tokens/src/index.ts:54`
  - Impact: All four exports are computed synchronously at import time. This is correct for static immutable data. Without documentation, a future developer may attempt to add lazy getters, introducing complexity with no benefit.
  - Evidence: `flattenTokens` (line 54), `groupBy` (line 62), `Object.fromEntries` (line 65) all run at module scope. ~300 tokens, sub-millisecond — appropriate.
  - Fix: Add a comment: `// Eagerly evaluated: tokens are immutable static data. Pre-computing at import time is intentional — lazy evaluation adds complexity with no runtime benefit.`

- **[CODE_QUALITY] resolveTokenRef does not support nested var() in fallback position**
  - File: `packages/hx-tokens/src/utils.ts:54`
  - Impact: The regex `[^)]+` stops at the first `)`. A fallback like `var(--hx-foo, var(--hx-bar))` captures `'var(--hx-bar'` (truncated) as the fallback. No current token uses this pattern, but the public API has no documented limitation.
  - Evidence: For `'var(--hx-foo, var(--hx-bar))'`, the fallback group captures `'var(--hx-bar'` (missing closing paren). Confirmed: 0 current tokens use nested var() as fallback.
  - Fix: Add `@remarks` JSDoc noting nested `var()` fallbacks are unsupported. Or expand the regex: `[^)]*(?:\([^)]*\))?[^)]*` to handle one nesting level.

---

## STATS

- Total issues found: 42
- Critical: 2 | High: 17 | Medium: 17 | Low: 6
- Files reviewed: 9 (src/index.ts, src/types.ts, src/utils.ts, src/css.ts, src/lit.ts, src/tokens.json, scripts/generate-css.ts, package.json, tsconfig.json)
- API routes reviewed: 0 (not applicable — token library package)
- Components reviewed: 0 (not applicable — token library package)
- Test files reviewed: 0 (none exist — zero test coverage)
- Specialists: Accessibility, TypeScript, Design System, Deployment/Config, Performance, Test Coverage, SEO/Metadata, Security, Next.js Integration
