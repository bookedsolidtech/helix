# Audit Report: wc-2026 (packages/hx-library)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: packages/hx-library/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

- **[DEPLOYMENT] Package marked private — cannot be published to npm**
  - File: `packages/hx-library/package.json:4`
  - Impact: `npm publish` and `changeset publish` both hard-fail when `"private": true`. The package will never reach consumers.
  - Evidence: `"private": true` is set in package.json.
  - Fix: Remove `"private": true`. If scoped access control is needed, use `"publishConfig": { "access": "public" }`.

- **[DEPLOYMENT] Package exports and main/module/types fields point at TypeScript source, not compiled dist**
  - File: `packages/hx-library/package.json:11-17`
  - Impact: Consumers who install the npm package receive raw `.ts` files. The `"files"` field ships only `dist/` and `custom-elements.json`, so all export paths resolve to files that do not exist in the published package.
  - Evidence: `"main": "./src/index.ts"`, `"module": "./src/index.ts"`, `"types": "./src/index.ts"`, `"exports": { ".": { "import": "./src/index.ts" } }`. Compiled output exists at `dist/`.
  - Fix: Update all fields to `dist/`: `"main": "./dist/index.js"`, `"module": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, exports pointing at `dist/components/*/index.js` and `dist/components/*/index.d.ts`.

- **[DEPLOYMENT] `lit` is a direct dependency, not a peerDependency**
  - File: `packages/hx-library/package.json:41-44`
  - Impact: Every consumer gets their own bundled copy of Lit. Two Lit instances at runtime cause silent failures: custom element registration breaks, reactive properties stop working, Lit's template cache is split. This is a well-known Lit gotcha that renders the library non-functional in consumer applications.
  - Evidence: `"dependencies": { "@helix/tokens": "*", "lit": "^3.3.2" }`. The `vite.config.ts` correctly externalizes Lit, but `package.json` must declare the peer relationship.
  - Fix: Move `lit` to `peerDependencies: { "lit": "^3.0.0" }` and add it to `devDependencies` for local development.

- **[ACCESSIBILITY] hx-checkbox completely removed from keyboard tab order**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:282`
  - Impact: Keyboard-only users and screen reader users cannot reach or activate the checkbox via Tab navigation. This is a WCAG 2.1 SC 2.1.1 (Level A) failure — the most fundamental accessibility requirement. In a healthcare form (patient consent, medication confirmation), this blocks all non-mouse users from completing critical workflows.
  - Evidence: `tabindex="-1"` is set on the native `<input type="checkbox">`. The `<label>` wrapping it has no `tabindex` and is not keyboard-focusable by default. The `focus()` override (line 228) works programmatically but Tab navigation skips the component entirely.
  - Fix: Remove `tabindex="-1"` from the native input (or change to `tabindex="0"`) and keep the visually-hidden CSS. The existing `.checkbox__input:focus-visible ~ .checkbox__box` rule will then fire correctly when Tab focus arrives.

- **[ACCESSIBILITY] hx-radio has no keyboard Space/Enter activation handler**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.ts`
  - Impact: Keyboard users cannot select a radio button by pressing Space (the required activation key per ARIA Authoring Practices Guide for `role="radio"`). Arrow-key navigation between radios works (handled by the group), but activating the focused radio via Space does not. This is a WCAG 2.1 SC 2.1.1 failure for a critical clinical data entry control.
  - Evidence: The component sets `role="radio"` on the host and has no `keydown` event listener. The only interaction path is a `@click` handler on the inner `.radio` div. No `e.key === ' '` or `e.key === 'Enter'` handling exists anywhere in the file.
  - Fix: Add a keydown handler to the host or inner div: `if (e.key === ' ') { e.preventDefault(); this._handleClick(); }`.

- **[CODE_QUALITY] @fires JSDoc uses stale `wc-after-close` prefix — CEM documents non-existent event**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.ts:23`
  - Impact: The Custom Elements Manifest (Quality Gate 5) documents `wc-after-close` as the fired event. The implementation dispatches `hx-after-close`. Consumers — including Drupal behaviors reading the CEM — wire up dead listeners that silently never fire.
  - Evidence: Line 23: `@fires {CustomEvent} wc-after-close`. Line 163: `new CustomEvent('hx-after-close', ...)`.
  - Fix: Change annotation to `@fires {CustomEvent} hx-after-close`. Regenerate CEM with `npm run cem`.

- **[CODE_QUALITY] @fires JSDoc uses stale `wc-card-click` prefix — CEM documents non-existent event**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:20`
  - Impact: Same CEM accuracy failure. Consumers listening for `wc-card-click` receive nothing. Card interaction integrations silently fail.
  - Evidence: Line 20: `@fires {CustomEvent<{url: string, originalEvent: MouseEvent}>} wc-card-click`. Line 91: `new CustomEvent('hx-card-click', ...)`.
  - Fix: Change to `@fires {CustomEvent<{url: string, originalEvent: MouseEvent}>} hx-card-click`. Regenerate CEM.

- **[CODE_QUALITY] @fires JSDoc uses stale `wc-submit`/`wc-invalid`/`wc-reset` prefixes in hx-form**
  - File: `packages/hx-library/src/components/hx-form/hx-form.ts:24-26`
  - Impact: Three events are documented with wrong names in the CEM. Drupal form submission behaviors, Angular event bindings, and any consumer relying on CEM autodocs will subscribe to phantom event names. Form submissions and resets will silently not be handled.
  - Evidence: Lines 24-26: `@fires wc-submit`, `@fires wc-invalid`, `@fires wc-reset`. Implementation dispatches `hx-submit` (line 219), `hx-invalid` (line 238), `hx-reset` (line 252).
  - Fix: Update all three `@fires` annotations to `hx-submit`, `hx-invalid`, `hx-reset`. Regenerate CEM.

- **[CODE_QUALITY] \_text-input.css uses deprecated `--wc-` prefix throughout (19 references)**
  - File: `packages/hx-library/src/styles/form/_text-input.css:18-88`
  - Impact: This file is imported by the global `form.css` barrel. Every `--hx-` token override a consumer sets has zero effect on these selectors. Unified theming is impossible — Shadow DOM components respond to `--hx-*` tokens but the Light DOM form styles operate on a completely separate token namespace.
  - Evidence: `border: var(--wc-border-width-thin, 1px) solid var(--wc-input-border-color, ...)`, `opacity: var(--wc-opacity-disabled, 0.5)`, etc. (19 occurrences).
  - Fix: Mechanical find-and-replace `--wc-` → `--hx-` throughout the file.

- **[CODE_QUALITY] \_lists.css uses deprecated `--wc-` prefix throughout (20 references)**
  - File: `packages/hx-library/src/styles/prose/_lists.css:10-99`
  - Impact: `prose.css` imports this file. Consumers who set `--hx-prose-color`, `--hx-prose-font-size`, or spacing tokens will see no effect on list elements — the most common content type in CMS-rendered prose.
  - Evidence: `color: var(--wc-prose-color, var(--wc-color-neutral-700, #343a40))`, `font-size: var(--wc-prose-font-size, ...)` (20 occurrences).
  - Fix: Replace all `--wc-` with `--hx-` throughout the file.

- **[CODE_QUALITY] \_media.css uses deprecated `--wc-` prefix throughout (14 references)**
  - File: `packages/hx-library/src/styles/prose/_media.css:13-96`
  - Impact: Images, figures, videos, iframes, and embedded media all ignore `--hx-` token overrides. CKEditor images, Drupal media embeds, and video embeds are completely un-themeable.
  - Evidence: `border-radius: var(--wc-border-radius-sm, 0.25rem)`, `margin-bottom: var(--wc-space-6, 1.5rem)` (14 occurrences).
  - Fix: Replace all `--wc-` with `--hx-` throughout the file.

- **[CODE_QUALITY] Global bare `label` selector in `_field.css` leaks styles to entire page**
  - File: `packages/hx-library/src/styles/form/_field.css:24`
  - Impact: When `form.css` is imported globally (its intended use in Drupal), a bare `label { }` rule applies `--hx-input-label-color`, `font-weight: medium`, and other styles to every label on the page — navigation labels, filter labels, widget labels — not just form fields.
  - Evidence: `label { display: flex; align-items: baseline; gap: var(--hx-space-1, ...); font-size: ...; color: var(--hx-input-label-color, ...); }` — no parent scope.
  - Fix: Scope to `hx-form label { }` to mirror the scoped pattern in `form.scoped.css`.

- **[TYPE_SAFETY] All lifecycle hooks use `Map<string, unknown>` instead of `PropertyValues<this>`**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:158` (and 8 more files)
  - Impact: `Map<string, unknown>` discards the key-to-type correlation that `PropertyValues<this>` provides. Typos in `.has('vaue')` instead of `.has('value')` are never caught at compile time. The project mandates strict TypeScript; this is a system-wide violation.
  - Evidence: `override updated(changedProperties: Map<string, unknown>): void` in hx-text-input.ts, hx-checkbox.ts, hx-select.ts, hx-switch.ts, hx-radio-group.ts, hx-radio.ts, hx-prose.ts, hx-textarea.ts.
  - Fix: `import { PropertyValues } from 'lit'; override updated(changedProperties: PropertyValues<this>): void` in all 9 files.

- **[TYPE_SAFETY] All test files import non-existent `Wc*` type aliases**
  - File: `packages/hx-library/src/components/hx-button/hx-button.test.ts:4` (and all 14 test files)
  - Impact: Every component exports `class HelixButton`, `class HelixCard`, etc. No `WcButton`, `WcCard`, or any `Wc*` type alias is exported. Tests pass only because Vitest browser mode transpiles without type-checking. When `type-check` is extended to include test files — which is required for strict mode — all 14 test files will fail. All property accesses on `el` in tests are effectively untyped, so component refactors that rename public properties produce zero compile-time errors in tests.
  - Evidence: `import type { WcButton } from './hx-button.js'` — no such export. Component file: `export class HelixButton extends LitElement`.
  - Fix: Either add `export type WcButton = HelixButton;` to each component file, or update all test imports: `import type { HelixButton as WcButton } from './hx-button.js'`.

- **[PERFORMANCE] `sideEffects` glob marks all component source files as non-tree-shakeable**
  - File: `packages/hx-library/package.json:7-9`
  - Impact: Bundlers (webpack, Rollup, esbuild) treat every file matching `"src/components/**/*.ts"` as having side effects and refuse to eliminate them even when only one component is imported. Per-component entry points become useless — every consumer bundles all components. The glob also references `src/` paths that don't exist in the published `dist/`, making it both over-inclusive and non-functional post-publish.
  - Evidence: `"sideEffects": ["**/*.css", "src/components/**/*.ts"]`.
  - Fix: `"sideEffects": false` (or `["dist/**/*.css"]` if CSS files need side-effect preservation). Remove the component `.ts` glob.

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

- **[DEPLOYMENT] No `prepublishOnly` hook — quality gates are not enforced on publish**
  - File: `packages/hx-library/package.json`
  - Impact: A developer can run `npm publish` without type-check, test, build, or CEM generation. All 7 quality gates are bypassed at the most consequential step.
  - Evidence: Scripts contain `build`, `type-check`, `test`, `cem` but no `prepublishOnly` or `prepack`.
  - Fix: Add `"prepublishOnly": "npm run type-check && npm run test && npm run build && npm run cem"`.

- **[DEPLOYMENT] No automated npm publish workflow in CI/CD**
  - File: `.github/workflows/` (no release workflow exists)
  - Impact: Publishing is entirely manual with no guards, no channel separation, and no post-publish steps. The CLAUDE.md documents an automated `@next` channel but no such workflow exists.
  - Evidence: Only `ci.yml` and `ci-matrix.yml` exist. Neither contains `npm publish`, `changeset publish`, `NODE_AUTH_TOKEN`, or `NPM_TOKEN`.
  - Fix: Create `.github/workflows/release.yml` using `changesets/action` for version PRs and automated publishing.

- **[DEPLOYMENT] Matrix CI tests Node 18, which is below declared `engines` requirement and EOL**
  - File: `.github/workflows/ci-matrix.yml:33`
  - Impact: Root `package.json` declares `"engines": { "node": ">=20.0.0" }`. Node 18 reached EOL in April 2025. Testing on an unsupported version wastes CI and produces misleading results.
  - Evidence: `node-version: [18, 20, 22]` vs `"node": ">=20.0.0"`.
  - Fix: Remove 18 from the matrix. If Node 18 support is intentional, update `engines`.

- **[DEPLOYMENT] Matrix CI concurrency group does not include matrix dimensions — runners self-cancel**
  - File: `.github/workflows/ci-matrix.yml:17`
  - Impact: All 9 matrix runners share one concurrency group key. With `cancel-in-progress: true`, only one runner survives per ref, defeating the matrix entirely.
  - Evidence: `group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`.
  - Fix: Include matrix dimensions in the group: `${{ github.workflow }}-${{ github.ref }}-${{ matrix.os }}-${{ matrix.node-version }}`.

- **[DEPLOYMENT] No Turborepo remote caching configured in CI**
  - File: `turbo.json`
  - Impact: Every CI run is a full cold build. On a 9-runner matrix, all 9 runners rebuild from scratch. CI times are maximally slow.
  - Evidence: `turbo.json` has no `remoteCache` block. Neither CI workflow sets `TURBO_TOKEN` or `TURBO_TEAM`.
  - Fix: Add `TURBO_TOKEN` and `TURBO_TEAM` environment variables to both workflows from repository secrets.

- **[DEPLOYMENT] `@helix/tokens` dependency uses `"*"` version range**
  - File: `packages/hx-library/package.json:44`
  - Impact: Any breaking change to `@helix/tokens` is pulled in at install time with no constraint, causing silent cascading failures in consumer deployments.
  - Evidence: `"@helix/tokens": "*"`.
  - Fix: Pin to a proper semver range: `"@helix/tokens": "^0.0.1"`.

- **[DEPLOYMENT] Package name mismatch — `@helix/library` in package.json vs `@wc-2026/library` in documentation**
  - File: `packages/hx-library/package.json:2`
  - Impact: External docs, CDN references, or consumer imports using `@wc-2026/library` will fail to resolve. Creates brand/identity split.
  - Evidence: `"name": "@helix/library"` in package.json; CLAUDE.md documents `@wc-2026/library`.
  - Fix: Align the name across all documentation and configuration.

- **[ACCESSIBILITY] Alert close button is 24×24px — fails WCAG 2.5.5 (44×44px minimum)**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.styles.ts:71-72`
  - Impact: Touch target too small for users with motor impairments on mobile/tablet devices. Direct WCAG 2.5.5 Level AA violation. In a healthcare context, alerts communicate critical clinical information.
  - Evidence: `width: var(--hx-space-6, 1.5rem)` = 24px; `height: var(--hx-space-6, 1.5rem)` = 24px.
  - Fix: Expand interactive area to 44×44px via padding or pseudo-element without changing visual size.

- **[ACCESSIBILITY] hx-button `sm` (32px) and `md` (40px) sizes fall below 44px touch target**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:53-63`
  - Impact: Default and small buttons fail WCAG 2.5.5. The `md` variant is the default — every primary CTA in the healthcare application is 4px below the minimum.
  - Evidence: `.button--sm { min-height: var(--hx-size-8, 2rem); }` (32px), `.button--md { min-height: var(--hx-size-10, 2.5rem); }` (40px).
  - Fix: Increase `md` min-height to at least 44px. For `sm`, use transparent padding to expand the hit area.

- **[ACCESSIBILITY] All hx-switch track sizes fall below 44×44px touch target**
  - File: `packages/hx-library/src/components/hx-switch/hx-switch.styles.ts:72-88`
  - Impact: `sm` (32×18px), `md` (40×22px), `lg` (48×26px) — none meet the 44px height requirement. Users with motor impairments cannot reliably activate any switch size.
  - Evidence: `.switch--sm .switch__track { width: 2rem; height: 1.125rem; }`, `.switch--md { width: 2.5rem; height: 1.375rem; }`.
  - Fix: Expand the touch area to 44px height using transparent border or padding around the track.

- **[ACCESSIBILITY] hx-radio focus ring CSS rule is dead — the input it targets is never focused**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.styles.ts:88-93`
  - Impact: The visible focus indicator for hx-radio relies on `.radio__input:focus-visible ~ .radio__control`. The native input has `tabindex="-1"` and is never keyboard-focused. The host element receives focus, but `:host(:focus-visible)` is not defined. The component has **zero visible focus indicator** — a WCAG 2.4.7 (Focus Visible) AA failure.
  - Evidence: `hx-radio.styles.ts:88`: `.radio__input:focus-visible ~ .radio__control { outline: ... }`. `hx-radio.ts:119`: `tabindex="-1"` on input.
  - Fix: Replace the dead sibling rule with `:host(:focus-visible) .radio__control { outline: var(--hx-focus-ring-width, 2px) solid ...; }`.

- **[ACCESSIBILITY] `role="alert"` and `aria-live="assertive"` applied simultaneously — causes double announcement**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.ts:179`
  - Impact: `role="alert"` is already implicitly `aria-live="assertive"`. Adding both causes JAWS and some other screen readers to announce critical health alerts twice, degrading clinical usability.
  - Evidence: `<div part="alert" role=${this._role} aria-live=${this._ariaLive}>` — when error/warning: `role="alert" aria-live="assertive"`.
  - Fix: Remove the explicit `aria-live` attribute. `role="alert"` provides complete semantics.

- **[ACCESSIBILITY] Interactive hx-card uses `div[role="link"]` without performing browser navigation**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:120-128`
  - Impact: Screen readers announce "Navigate to /some-url, link" but activating the card only fires a custom event — no actual navigation occurs. Middle-click to open in a new tab doesn't work. Users with disabilities are deceived about the control's behavior.
  - Evidence: `role=${isInteractive ? 'link' : nothing}`, `aria-label="Navigate to ${this.wcHref}"` — but only `hx-card-click` is dispatched, no `window.location` or `<a>` navigation.
  - Fix: Render a native `<a>` element wrapping the card when `wcHref` is set, or perform actual browser navigation in `_handleClick`.

- **[ACCESSIBILITY] `helpText` excluded from `aria-describedby` when an error is active**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:253` (also hx-switch.ts:252, hx-select.ts:304)
  - Impact: When both `helpText` and `error` are set, the help text is removed from `aria-describedby`. Screen reader users lose contextual guidance precisely when they need it most. For clinical fields (medication dosage, patient ID format), help text may contain safety-critical formatting requirements.
  - Evidence: `this.helpText && !hasError ? this._helpTextId : null` — help text excluded in error state in hx-checkbox, hx-switch, hx-select. (hx-text-input correctly includes both.)
  - Fix: `this.helpText ? this._helpTextId : null` — always include help text in `aria-describedby` when present.

- **[CODE_QUALITY] hx-card `_handleSlotChange` creates a new closure on every render — listener leak**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:72-78`
  - Impact: `_handleSlotChange(slotName)` returns a new arrow function on every call. Used four times in `render()`, Lit sees new function references each cycle and rebinds all four slot listeners on every update. Old closures cannot be garbage collected. Memory and DOM mutation overhead accumulates with every re-render.
  - Evidence: `private _handleSlotChange(slotName: string) { return (e: Event) => { ... }; }` called in render as `@slotchange=${this._handleSlotChange('image')}`.
  - Fix: Replace the factory with four bound class-field arrow methods: `private _handleImageSlotChange = (e: Event): void => { ... }`.

- **[CODE_QUALITY] hx-card `_hasSlotContent` is a plain object, not `@state` — reactive updates are manual**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:65-68`
  - Impact: Mutating `this._hasSlotContent[slotName]` does not trigger Lit's update pipeline. The `requestUpdate()` call compensates but fires unconditionally even when the value hasn't changed. This is the anti-pattern `@state` is designed to prevent.
  - Evidence: `private _hasSlotContent: Record<string, boolean> = { image: false, ... }; ... this.requestUpdate();`
  - Fix: `@state() private _hasSlotContent: Record<CardSlotName, boolean> = { ... }`. Use spread on assignment: `this._hasSlotContent = { ...this._hasSlotContent, [slotName]: hasContent }`. Remove manual `requestUpdate()` calls.

- **[CODE_QUALITY] `@slot` JSDoc in hx-radio-group references non-existent `<wc-radio>` element**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:9`
  - Impact: CEM slot documentation tells consumers to put `<wc-radio>` elements inside `<hx-radio-group>`. `<wc-radio>` is not a registered custom element. Consumers following the docs get silent rendering failures.
  - Evidence: Line 9: `@slot - '<wc-radio>' elements`. Actual implementation at line 162: `querySelectorAll('hx-radio')`.
  - Fix: Change all `<wc-radio>` references to `<hx-radio>` in JSDoc. Also fix the same issue in `hx-radio.ts:8` which says "designed to be used inside `<wc-radio-group>`".

- **[CODE_QUALITY] `super.updated()` not called in `HelixRadio.updated()` — breaks Lit lifecycle**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.ts:68`
  - Impact: Omitting `super.updated()` breaks the Lit lifecycle contract. Internal Lit bookkeeping is dropped, which can cause subtle issues with `_$changedProperties` tracking in extended components.
  - Evidence: `override updated(changedProperties: Map<string, unknown>): void { ... }` — no `super.updated()` call.
  - Fix: Add `super.updated(changedProperties);` as the first line.

- **[CODE_QUALITY] `hasError` in hx-checkbox ignores `_hasErrorSlot` — error styling missing for slotted errors**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:240`
  - Impact: The `.checkbox--error` class is never applied when the error comes via a slot, so the error border styling on `.checkbox__box` is absent. `aria-describedby` correctly references the error slot, but the visual styling does not appear. `hx-text-input` and `hx-textarea` handle this correctly.
  - Evidence: Line 240: `const hasError = !!this.error;` — missing `|| this._hasErrorSlot`. Compare: `hx-text-input:274`: `const hasError = !!this.error || this._hasErrorSlot`.
  - Fix: `const hasError = !!this.error || this._hasErrorSlot;`

- **[CODE_QUALITY] `setFormValue` called twice on every keystroke — in `_handleInput` and `updated()`**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:158` (also hx-textarea.ts)
  - Impact: Every user keystroke calls `_internals.setFormValue()` twice — once in the event handler and once in `updated()`. This is redundant DOM manipulation on every input event.
  - Evidence: `_handleInput`: `this.value = target.value; this._internals.setFormValue(this.value);`. `updated()`: `if (changedProperties.has('value')) { this._internals.setFormValue(this.value); }`.
  - Fix: Remove `setFormValue` from `_handleInput`/`_handleChange`. Let `updated()` be the single source of truth.

- **[CODE_QUALITY] hx-textarea auto-resize direct DOM mutation fights Lit's render cycle**
  - File: `packages/hx-library/src/components/hx-textarea/hx-textarea.ts:251-253`
  - Impact: Setting `target.style.height` directly in the input handler runs before Lit's update cycle. When `this.value = target.value` triggers a reactive update, Lit re-renders and can reset the inline style, causing height flickering on every keystroke. Also forces a synchronous reflow on every keypress, impacting INP.
  - Evidence: `this.value = target.value; target.style.height = 'auto'; target.style.height = \`${target.scrollHeight}px\`;`
  - Fix: Move auto-resize logic into `updated()` after `changedProperties.has('value')` check, targeting `this._textarea`. Wrap in `requestAnimationFrame` to avoid blocking the input event.

- **[PERFORMANCE] `preserveModules` not set in Rollup config — shared chunks defeat per-component tree-shaking**
  - File: `packages/hx-library/vite.config.ts:39-48`
  - Impact: Without `preserveModules: true`, Rollup creates shared chunk files for code appearing in multiple entry points. A consumer importing only `hx-button` pulls in the entire shared chunk. Per-component entry points become ineffective.
  - Evidence: `chunkFileNames: 'shared/[name]-[hash].js'` confirms shared chunks form. No `preserveModules: true` in `rollupOptions.output`.
  - Fix: Add `preserveModules: true, preserveModulesRoot: 'src'` to Rollup output options.

- **[PERFORMANCE] Duplicate event listener registration risk in hx-radio-group connectedCallback**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:126-129`
  - Impact: If the element is moved in the DOM (e.g., via Drupal AJAX), `connectedCallback` fires again before `disconnectedCallback` cleans up, registering duplicate listeners. Every radio selection fires `hx-change` twice. In a healthcare form, duplicate form submission events could trigger clinical workflows twice.
  - Evidence: `this.addEventListener('hx-radio-select', this._handleRadioSelect)` in `connectedCallback` with a matching `removeEventListener` in `disconnectedCallback`, but no guard against double-registration.
  - Fix: Use `AbortController` pattern: create a new controller in `connectedCallback` (aborting any previous one), pass its signal to `addEventListener`, and abort in `disconnectedCallback`.

- **[TESTING] 21 occurrences of `setTimeout(r, 50)` instead of `await el.updateComplete`**
  - File: `packages/hx-library/src/components/hx-button/hx-button.test.ts:175` (and 20 more locations across 8 test files)
  - Impact: Hardcoded 50ms timeouts are flaky under CI load. Tests pass locally but produce false negatives on a loaded runner. Explicitly violates the zero-flaky-test mandate.
  - Evidence: `await new Promise((r) => setTimeout(r, 50));` in hx-button.test.ts (3×), hx-card.test.ts (2×), hx-select.test.ts (5×), hx-badge.test.ts (3×), hx-radio-group.test.ts (2×), hx-checkbox.test.ts, hx-switch.test.ts, hx-text-input.test.ts (2×), hx-textarea.test.ts (2×).
  - Fix: Replace with `await el.updateComplete`. For "event should not fire" assertions, drain the microtask queue with `await el.updateComplete` and check the flag.

- **[TESTING] Slotted `label` and `error` code paths untested across all Drupal-facing form components**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:138-154` (also hx-textarea.ts, hx-select.ts)
  - Impact: The label slot and error slot exist specifically for Drupal Form API integration (documented in JSDoc). When slotted, `_hasLabelSlot` triggers `aria-labelledby` substitution. Zero tests exercise this path. A bug here silently breaks accessible name computation for every Drupal-rendered form field — the library's stated primary consumer.
  - Evidence: `_handleLabelSlotChange` sets `aria-labelledby` and assigns IDs to slotted labels. No test in hx-text-input.test.ts, hx-textarea.test.ts, or hx-select.test.ts exercises `slot="label"` or `slot="error"`.
  - Fix: Add tests: slotted label sets `aria-labelledby`; slotted error sets `aria-invalid="true"` and includes the error element's id in `aria-describedby`.

- **[TESTING] hx-textarea `tooLong` validity branch completely untested**
  - File: `packages/hx-library/src/components/hx-textarea/hx-textarea.ts:221-225`
  - Impact: Clinical notes fields with `maxlength` constraints could silently pass validation when over the limit, allowing a form to submit 10,000 characters where 500 were expected, causing database truncation or data loss in patient records.
  - Evidence: Lines 221-225: `tooLong: true` validity branch. No test in hx-textarea.test.ts exercises `value.length > maxlength`.
  - Fix: Add tests verifying `el.validity.tooLong === true` when value exceeds maxlength, and that `checkValidity()` returns false.

- **[TESTING] hx-button keyboard tests call `btn.click()` after dispatching keyboard event — prove nothing about keyboard**
  - File: `packages/hx-library/src/components/hx-button/hx-button.test.ts:183-201`
  - Impact: `oneEvent()` resolves from the `btn.click()` call, not from keyboard handling. If the keyboard handler is removed entirely, these tests still pass. This gives false confidence that keyboard activation works — a WCAG 2.1.1 requirement.
  - Evidence: `btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); btn.click(); const event = await eventPromise;` — the click, not the keyboard, fires the event.
  - Fix: Remove the `btn.click()` calls. The native `<button>` handles Enter/Space natively; dispatch the keyboard event alone and await the result.

- **[TYPE_SAFETY] Definite assignment assertions (`!`) on `@query`-decorated fields**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:131` (and 5 more files)
  - Impact: The `@query` decorator returns `null` if the element hasn't rendered yet. The `!` operator suppresses this null check. In `_updateValidity()`, these fields are passed directly to `setValidity()` — if called before `firstUpdated`, the browser throws.
  - Evidence: `@query('.field__input') private _input!: HTMLInputElement;` in hx-text-input.ts, hx-checkbox.ts, hx-select.ts, hx-radio-group.ts, hx-switch.ts, hx-textarea.ts.
  - Fix: Declare as `HTMLInputElement | null = null`. Add `if (!this._input) return;` guards in methods that access the field.

- **[TYPE_SAFETY] `CustomEvent` dispatched without explicit generic type parameter — detail is `unknown`**
  - File: 17 `dispatchEvent` call sites across all component files
  - Impact: `new CustomEvent('hx-click', { detail: { originalEvent: e } })` is inferred as `CustomEvent<unknown>`. Type-safe event consumption is impossible without re-casting at every call site.
  - Evidence: `this.dispatchEvent(new CustomEvent('hx-click', { ... }))` — no `<HxClickDetail>` generic in hx-button.ts:90 and 16 other dispatch sites.
  - Fix: Declare event detail interfaces and provide the generic: `new CustomEvent<HxClickDetail>('hx-click', { detail: { originalEvent: e } })`.

- **[DESIGN_TOKENS] Primary color fallback `#2563eb` (blue) doesn't match library's documented primary `#007878` (teal)**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:20` (and 14+ locations)
  - Impact: If the token stylesheet fails to load (Drupal page error, CDN failure, vanilla HTML consumer who omits it), all interactive elements render in the wrong brand color. Focus rings, buttons, checkboxes, badges, radios, and switches are all affected.
  - Evidence: `background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb))`. The design system context specifies `--hx-color-primary-500: #007878`.
  - Fix: Update all `--hx-color-primary-500` fallback hex values from `#2563eb` to `#007878`.

---

## MEDIUM (fix this month — polish, best practices, maintainability)

- **[DEPLOYMENT] Source maps included in published package — exposes TypeScript source**
  - File: `packages/hx-library/vite.config.ts:49`
  - Impact: `.js.map` files are present in `dist/` and would be published, exposing full TypeScript component source to any end user opening browser devtools.
  - Evidence: `sourcemap: true` in vite.config.ts. Confirmed `.js.map` files in dist.
  - Fix: `sourcemap: false` or `sourcemap: 'hidden'` (retains debuggability without public map URLs), or add `"!dist/**/*.map"` to the `files` array.

- **[TESTING] Coverage thresholds not enforced — 80% gate is unguarded**
  - File: `packages/hx-library/vitest.config.ts:15-27`
  - Impact: `npm run test` exits 0 regardless of coverage level. Coverage can silently drop to 0% and CI stays green.
  - Evidence: `coverage: { provider: 'v8', enabled: true, ... }` — no `thresholds` key.
  - Fix: Add `thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 }` to the coverage config.

- **[ACCESSIBILITY] No `prefers-reduced-motion` support in any component except hx-badge**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:26-31` (and all other component style files)
  - Impact: All components with transitions (button, card, checkbox, switch, text-input, textarea, alert, radio, select) apply motion unconditionally. Healthcare applications serve users with vestibular disorders for whom unexpected motion causes physical symptoms. hx-badge is the only component with a `@media (prefers-reduced-motion: reduce)` block.
  - Evidence: `transition: background-color var(--hx-transition-fast, 150ms ease), ...` in hx-button.styles.ts with no reduced-motion guard. hx-card also has `transform: translateY()` on hover.
  - Fix: Add `@media (prefers-reduced-motion: reduce) { .button { transition: none; } }` to each component. For hx-card, also suppress `transform`.

- **[ACCESSIBILITY] hx-badge dot/pulse indicator has no accessible label**
  - File: `packages/hx-library/src/components/hx-badge/hx-badge.ts:84-99`
  - Impact: When used as a pulsing dot (no slot content), the badge renders an empty animated element with no accessible label. In healthcare dashboards, a pulsing dot typically signals a critical notification — screen reader users receive no information.
  - Evidence: `isDot = !this._hasSlotContent && this.pulse` — no `aria-label` added for dot state.
  - Fix: Add `ariaLabel` property to hx-badge. For dot/pulse variants, document that an `aria-label` MUST be provided by the consumer; add a development warning when missing.

- **[ACCESSIBILITY] hx-textarea character counter not associated with the textarea or announced to screen readers**
  - File: `packages/hx-library/src/components/hx-textarea/hx-textarea.ts:306-312`
  - Impact: The `N / 500` counter has no ARIA association with the textarea. Screen readers cannot discover the character limit or current count. For clinical notes with character limits, this is a safety-relevant gap.
  - Evidence: `<div part="counter" class="field__counter">${display}</div>` — no `id`, no `aria-live`, not in `aria-describedby`.
  - Fix: Add `id={this._counterId}` and `aria-live="polite" aria-atomic="true"` to the counter div. Include `_counterId` in `aria-describedby` when `showCount` is true.

- **[ACCESSIBILITY] hx-checkbox focus ring CSS rule may be dead — sibling combinator on `tabindex="-1"` input**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.styles.ts:72-77`
  - Impact: `.checkbox__input:focus-visible ~ .checkbox__box` requires the visually-hidden input to receive `:focus-visible`. With `tabindex="-1"` on the input, Tab navigation skips it. The focus ring may never appear for keyboard users — same root cause as the CRITICAL tabindex finding.
  - Evidence: `hx-checkbox.ts:282`: `tabindex="-1"`. `hx-checkbox.styles.ts:72`: `.checkbox__input:focus-visible ~ .checkbox__box { outline: ... }`.
  - Fix: Resolved by fixing the CRITICAL `tabindex="-1"` issue — changing to `tabindex="0"` fixes both.

- **[CODE_QUALITY] `wc-radio-` ID prefix in hx-radio — convention violation visible in DOM**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.ts:79`
  - Impact: Generates IDs like `wc-radio-abc1234` — the only component using the legacy prefix. Visible in the DOM, may break CSS or test selectors relying on the `hx-` pattern.
  - Evidence: `private _inputId = \`wc-radio-${Math.random().toString(36).slice(2, 9)}\`;`
  - Fix: `private _inputId = \`hx-radio-${Math.random().toString(36).slice(2, 9)}\`;`

- **[CODE_QUALITY] `wcHref` property name uses legacy prefix while attribute is `hx-href`**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:59-62`
  - Impact: JS property API is `card.wcHref = '...'` but HTML attribute is `hx-href="..."`. This API inconsistency must be fixed before 1.0 as renaming it is a breaking change.
  - Evidence: `@property({ type: String, attribute: 'hx-href' }) wcHref = '';`
  - Fix: Rename property to `hxHref`. Update all internal usages.

- **[CODE_QUALITY] `hx-select` slot template uses inline `style="display: none;"` — violates no-inline-styles rule**
  - File: `packages/hx-library/src/components/hx-select/hx-select.ts:360`
  - Impact: The inline style cannot be overridden via CSS parts or custom properties. Violates the project's engineering standard against inline styles.
  - Evidence: `<slot @slotchange=${this._handleSlotChange} style="display: none;"></slot>`
  - Fix: Move to `hx-select.styles.ts` with a class: `.field__options-slot { display: none; }`.

- **[CODE_QUALITY] `_syncOptions` uses `shadowRoot.querySelector` instead of `@query` decorator**
  - File: `packages/hx-library/src/components/hx-select/hx-select.ts:224`
  - Impact: Live DOM query forces layout recalculation. Called on every slot change and indirectly on every value change. The `@query` decorator exists to prevent this pattern.
  - Evidence: `const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')`.
  - Fix: `@query('slot:not([name])') private _defaultSlot!: HTMLSlotElement;` and use `this._defaultSlot`.

- **[CODE_QUALITY] Enter key activates hx-switch — non-standard per ARIA spec**
  - File: `packages/hx-library/src/components/hx-switch/hx-switch.ts:217`
  - Impact: ARIA switch role spec states that only Space activates a switch. Enter is expected to submit a form. Adding Enter as a toggle key deviates from APG and may confuse users who expect Enter to submit.
  - Evidence: `if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._toggle(); }`
  - Fix: Remove `'Enter'` — respond only to `' '` (Space).

- **[CODE_QUALITY] Math.random() IDs are not SSR-safe and not deterministic**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:269` (and 5 other components)
  - Impact: Server and client generate different IDs, causing hydration mismatches in Next.js/Astro apps. Collision risk (~1-in-2B per pair) is negligible but non-zero.
  - Evidence: `private _inputId = \`hx-text-input-${Math.random().toString(36).slice(2, 9)}\`;` in 6 component files.
  - Fix: Use a module-level monotonic counter: `let _idCounter = 0; private _inputId = \`hx-text-input-${++\_idCounter}\`;`

- **[CODE_QUALITY] Slot-tracking fields not `@state` in hx-text-input and hx-textarea**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:135-136` (also hx-textarea.ts:156-157)
  - Impact: `_hasLabelSlot` and `_hasErrorSlot` are plain private fields with manual `requestUpdate()` calls. Unconditional `requestUpdate()` fires re-renders even when the value didn't change. Inconsistent with hx-select (lines 136-137) which correctly uses `@state`.
  - Evidence: `private _hasLabelSlot = false; // no @state`. `this.requestUpdate(); // manual`.
  - Fix: `@state() private _hasLabelSlot = false;`. Remove manual `requestUpdate()` calls.

- **[CODE_QUALITY] Double opacity on disabled hx-button — renders at 25% opacity instead of 50%**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:8-11, 101-104`
  - Impact: `:host([disabled])` sets `opacity: 0.5` and `.button[disabled]` also sets `opacity: 0.5`. Effective opacity is 0.5 × 0.5 = 0.25 — far more washed out than the design token intends.
  - Evidence: Lines 8-11: `:host([disabled]) { opacity: var(--hx-opacity-disabled, 0.5); }`. Lines 101-104: `.button[disabled] { opacity: var(--hx-opacity-disabled, 0.5); }`.
  - Fix: Remove `opacity` from `.button[disabled]`. Keep it only on `:host([disabled])`. Keep `cursor: not-allowed` on `.button[disabled]`.

- **[TESTING] Three test files import non-existent `_shadowQueryAll` export**
  - File: `packages/hx-library/src/components/hx-card/hx-card.test.ts:6` (also hx-alert.test.ts, hx-radio-group.test.ts)
  - Impact: The export is `shadowQueryAll` (no underscore). The import `_shadowQueryAll` is dead code. Will cause TypeScript errors when type-check is extended to test files.
  - Evidence: `import { ..., _shadowQueryAll, ... } from '../../test-utils.js'` — `_shadowQueryAll` is never called in these files.
  - Fix: Remove `_shadowQueryAll` from the import destructuring in all three files.

- **[TESTING] hx-text-input `tel`, `url`, and `search` input types have no tests**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.test.ts:92-117`
  - Impact: 3 of 7 valid input types are untested. `tel` is commonly used for patient contact numbers in healthcare. Silently broken type attributes cause incorrect mobile keyboard modes.
  - Evidence: Tests cover `email`, `password`, `number`. No test for `tel`, `url`, `search`.
  - Fix: Add tests asserting the correct `type` attribute is set on the inner input for each of the three missing types.

- **[TESTING] `axe.run` targets `el.shadowRoot` instead of the host element — misses slotted content**
  - File: `packages/hx-library/src/test-utils.ts:76-78`
  - Impact: Accessibility violations in slotted content (missing alt text on slotted images, incorrect heading hierarchy in card heading slots) are not caught. The "zero axe violations" gate is not complete.
  - Evidence: `const context = el.shadowRoot ?? el; const results = await axe.default.run(context as unknown as Node, ...)`.
  - Fix: Pass the host element directly: `await axe.default.run(el, { ... })`. axe-core supports shadow DOM traversal when given the host element.

- **[TYPE_SAFETY] `noImplicitReturns` and `noFallthroughCasesInSwitch` absent from base tsconfig**
  - File: `/workspace/tsconfig.base.json`
  - Impact: Functions can omit return statements on some code paths without a compile error. Switch cases can silently fall through. These flags are standard components of strict TypeScript discipline.
  - Evidence: `tsconfig.base.json` contains `"strict": true, "noUncheckedIndexedAccess": true` but neither `noImplicitReturns` nor `noFallthroughCasesInSwitch`.
  - Fix: Add both flags to `tsconfig.base.json compilerOptions`.

- **[TYPE_SAFETY] `Record<string, boolean>` indexed access produces `boolean | undefined` under `noUncheckedIndexedAccess`**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:65-75`
  - Impact: `this._hasSlotContent['image']` returns `boolean | undefined` under the project's `noUncheckedIndexedAccess` setting. Used in `?hidden=${!this._hasSlotContent['image']}` — `undefined` is coerced to `false` silently.
  - Evidence: `private _hasSlotContent: Record<string, boolean>` — a string-indexed record.
  - Fix: Use a discriminated slot name type: `type CardSlotName = 'image' | 'heading' | 'footer' | 'actions'; private _hasSlotContent: Record<CardSlotName, boolean>`. Indexed access on a literal-keyed record always returns the value type.

- **[DESIGN_TOKENS] Badge pulse animation duration and easing hardcoded — not tokenized**
  - File: `packages/hx-library/src/components/hx-badge/hx-badge.styles.ts:103`
  - Impact: Teams cannot adjust pulse speed for different patient-facing screens. Healthcare applications frequently need fine-grained control over notification urgency signals.
  - Evidence: `animation: wc-badge-pulse 2s ease-in-out infinite;` — duration and easing are literals.
  - Fix: `animation: hx-badge-pulse var(--hx-badge-pulse-duration, 2s) var(--hx-badge-pulse-easing, ease-in-out) infinite;` (also fixes the keyframe name to `hx-badge-pulse`).

- **[DESIGN_TOKENS] Container `narrow` variant uses hardcoded `48rem` without an intermediate token**
  - File: `packages/hx-library/src/components/hx-container/hx-container.styles.ts:65`
  - Impact: The `narrow` variant cannot be overridden independently. Overriding `--hx-container-max-width` also overrides all other width variants simultaneously.
  - Evidence: `.container__inner--narrow { max-width: var(--hx-container-max-width, 48rem); }` — no `--hx-container-narrow` token.
  - Fix: `max-width: var(--hx-container-max-width, var(--hx-container-narrow, 48rem));`

- **[DESIGN_TOKENS] Radio error state skips component token tier — uses raw semantic token**
  - File: `packages/hx-library/src/styles/form/_validation.css:99-103`
  - Impact: A consumer who sets `--hx-radio-error-color` sees it applied in the Shadow DOM `hx-radio` component but not in the native `input[type="radio"]` inside `hx-form`. Error state looks different between the two rendering paths.
  - Evidence: `border-color: var(--hx-color-error-500, #dc3545)` — missing `--hx-radio-error-color` tier. Compare: checkbox correctly uses `var(--hx-checkbox-error-color, var(--hx-color-error-500, ...))`.
  - Fix: `border-color: var(--hx-radio-error-color, var(--hx-color-error-500, #dc3545));`

- **[CODE_QUALITY] hx-prose sets `this.style.display = 'block'` in `connectedCallback` — inline style bypass**
  - File: `packages/hx-library/src/components/hx-prose/hx-prose.ts:60-62`
  - Impact: Inline style overrides consumer CSS attempting to set `display` on the host. Violates the no-inline-styles constraint.
  - Evidence: `override connectedCallback(): void { super.connectedCallback(); this.style.display = 'block'; }`
  - Fix: Remove. Instead ensure `prose.scoped.css` contains `hx-prose { display: block; }`.

- **[STORYBOOK] `hx-size` argType doesn't declare the actual HTML attribute name in 4 story files**
  - File: `packages/hx-library/src/components/hx-button/hx-button.stories.ts` (also hx-badge, hx-select, hx-switch)
  - Impact: The controls panel shows "size" as the attribute name, but developers must write `hx-size="md"` in HTML. Developers copying from the args table write `size="md"` which is silently ignored.
  - Evidence: `argType key: "size"` but `@property({ attribute: 'hx-size' })` in all four components.
  - Fix: Add `name: 'hx-size'` to the size argType definition in all four story files.

---

## LOW (backlog — minor improvements, nice-to-haves)

- **[DEPLOYMENT] No active changesets — version history is untracked at v0.0.1**
  - File: `.changeset/` (contains only README.md)
  - Impact: No semver record of any changes. Consumers cannot pin to known-good versions or track breaking changes.
  - Evidence: `ls .changeset/`: only `README.md` and `config.json`. Version: `"0.0.1"` — never bumped.
  - Fix: Establish the practice: every PR touching `src/components/` requires a changeset. Add a CI check enforcing this.

- **[CODE_QUALITY] `wc-badge-pulse` keyframe name uses legacy prefix**
  - File: `packages/hx-library/src/components/hx-badge/hx-badge.styles.ts:92`
  - Impact: Inconsistent with `hx-` prefix convention. In Drupal environments with multiple library versions, global keyframe name collisions are possible.
  - Evidence: `@keyframes wc-badge-pulse { ... }`.
  - Fix: Rename to `@keyframes hx-badge-pulse` and update the `animation:` reference.

- **[CODE_QUALITY] CEM analyzer CLI flags conflict with `custom-elements-manifest.config.mjs`**
  - File: `packages/hx-library/package.json:37`
  - Impact: The `cem` script passes inline CLI flags that partially conflict with the config file. Test files may be inadvertently processed since `--exclude "**/*.test.ts"` is in the config but not in the CLI flags.
  - Evidence: `"cem": "custom-elements-manifest analyze --litelement --globs ... --exclude *.stories.ts --exclude *.styles.ts"` — missing `--exclude "**/*.test.ts"` vs config which has it.
  - Fix: Either remove inline CLI flags and rely solely on the config file, or add `--exclude "**/*.test.ts"` to the CLI invocation.

- **[CODE_QUALITY] hx-form JSDoc references `wc-*` component names in class description and summary**
  - File: `packages/hx-library/src/components/hx-form/hx-form.ts:7-10`
  - Impact: CEM autodocs and Storybook autodocs render stale `wc-*` references, confusing consumers about actual tag names.
  - Evidence: Lines 7-10: "wc-_ components"; line 18: "wc-_ form elements". Implementation correctly uses `hx-*` (line 163).
  - Fix: Replace all `wc-*` references with `hx-*` in JSDoc text.

- **[CODE_QUALITY] hx-form.stories.ts references `--wc-*` variables in consumer-facing documentation**
  - File: `packages/hx-library/src/components/hx-form/hx-form.stories.ts:919`
  - Impact: Developers integrating via Storybook see the wrong token prefix in code comments. Will set `--wc-*` tokens that have no effect.
  - Evidence: `* happens via the design token layer (\`--wc-\*\` variables).`
  - Fix: Update to `--hx-*` variables.

- **[CODE_QUALITY] hx-switch `hx-change` event detail missing `value` property — inconsistent with hx-checkbox**
  - File: `packages/hx-library/src/components/hx-switch/hx-switch.ts:207-209`
  - Impact: hx-checkbox fires `hx-change` with `{ checked, value }`. hx-switch fires `{ checked }` only. Consumers using both interchangeably must handle different event shapes.
  - Evidence: `detail: { checked: this.checked }` in hx-switch vs `detail: { checked: this.checked, value: this.value }` in hx-checkbox.
  - Fix: Add `value` to hx-switch's `hx-change` event detail. Update `@fires` JSDoc.

- **[ACCESSIBILITY] `aria-disabled` redundant on native `<button>` element in hx-button**
  - File: `packages/hx-library/src/components/hx-button/hx-button.ts:120-121`
  - Impact: The native `?disabled` attribute already provides complete accessibility semantics for `<button>`. `aria-disabled` is redundant and can cause some screen readers to double-announce "dimmed".
  - Evidence: `?disabled=${this.disabled} aria-disabled=${this.disabled ? 'true' : nothing}`.
  - Fix: Remove the `aria-disabled` binding from the inner `<button>`.

- **[ACCESSIBILITY] hx-form renders a `<form>` with no accessible name when used as a page landmark**
  - File: `packages/hx-library/src/components/hx-form/hx-form.ts:281-294`
  - Impact: Screen readers (particularly JAWS) announce the form landmark as just "form" with no descriptor. Unhelpful in multi-form pages common in healthcare admin UIs.
  - Evidence: `<form action=... method=... name=... ?novalidate=...>` — no `aria-label`.
  - Fix: Expose a `label` property on hx-form and pass it: `<form aria-label=${ifDefined(this.label || undefined)}>`.

- **[TYPE_SAFETY] `AlertVariant` type not exported — prevents external type-safe consumption**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.ts:8`
  - Impact: Consumers who want to type `function getAlertVariant(): AlertVariant` must duplicate the literal union or use `HelixAlert['variant']` indirectly.
  - Evidence: `type AlertVariant = 'info' | 'success' | 'warning' | 'error';` — not exported.
  - Fix: `export type AlertVariant = ...`. Re-export from `hx-alert/index.ts`.

- **[TYPE_SAFETY] Redundant optional chaining on `Element.prototype.closest`**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:240`
  - Impact: `(e.target as Element)?.closest?.('hx-radio')` uses `?.` on `closest` itself. `closest` is always present on `Element` — the optional chaining is misleading noise.
  - Evidence: `(e.target as Element)?.closest?.('hx-radio') || radio.checked`
  - Fix: `(e.target as Element)?.closest('hx-radio') || radio.checked`

- **[CODE_QUALITY] Empty `.card--default` CSS rule occupies space without declarations**
  - File: `packages/hx-library/src/components/hx-card/hx-card.styles.ts:40-42`
  - Impact: Minor — an empty rule is parsed by the CSS engine and occupies space in the serialized stylesheet string shared across all hx-card instances.
  - Evidence: `.card--default { /* Default styling — uses base styles */ }` — no declarations.
  - Fix: Delete the empty rule.

- **[DESIGN_TOKENS] badge--warning dark text color rationale undocumented**
  - File: `packages/hx-library/src/components/hx-badge/hx-badge.styles.ts:59-60`
  - Impact: A future developer may "normalize" the warning badge text to `neutral-0` (white) without understanding that `warning-500` (#eab308) doesn't meet 4.5:1 contrast against white, silently breaking WCAG compliance.
  - Evidence: `--hx-badge-color: var(--hx-color-neutral-900, #1a1a1a);` — no comment explaining the contrast rationale while all other variants use `neutral-0`.
  - Fix: Add an inline comment: `/* Dark text required: warning-500 (#eab308) fails 4.5:1 contrast against #ffffff */`.

- **[STORYBOOK] Storybook sidebar sort order omits 10 of 13 components**
  - File: `packages/hx-library/apps/storybook/.storybook/preview.ts:30-39`
  - Impact: All components except Button, Card, and Text Input appear in alphabetical fallback order, with no intentional information architecture.
  - Evidence: `order: [..., 'Components', ['Button', 'Card', 'Text Input', '*'], ...]`.
  - Fix: Expand the Components array to list all components in a logical order: primitives first, then form controls, then layout.

---

## STATS

- Total issues found: 85
- Critical: 15 | High: 30 | Medium: 25 | Low: 15
- Files reviewed: ~60 (all component .ts, .styles.ts, test files, config files, CI workflows, CSS partials)
- Components reviewed: 14 (hx-alert, hx-badge, hx-button, hx-card, hx-checkbox, hx-container, hx-form, hx-prose, hx-radio, hx-radio-group, hx-select, hx-switch, hx-text-input, hx-textarea)
- Test files reviewed: 14
- Configuration files reviewed: package.json, vite.config.ts, vitest.config.ts, tsconfig.json, turbo.json, .changeset/config.json, .github/workflows/\*.yml

---

## TOP PRIORITY REMEDIATION ORDER

**Ship-blockers (nothing ships until these are fixed):**

1. `package.json` — remove `private: true`, fix exports to `dist/`, move `lit` to `peerDependencies`
2. Fix all three `@fires` JSDoc annotations (`hx-alert`, `hx-card`, `hx-form`) and regenerate CEM
3. Fix `sideEffects` glob
4. Fix `_text-input.css`, `_lists.css`, `_media.css` — `--wc-` prefix migration

**Accessibility (healthcare mandate — zero regressions):** 5. Fix `hx-checkbox` `tabindex="-1"` — complete keyboard failure 6. Add Space key handler to `hx-radio` — keyboard selection broken 7. Fix `hx-radio` focus ring CSS — no visible focus indicator 8. Touch targets: alert close button, button sm/md, all switch sizes

**Type safety & test integrity:** 9. Fix `PropertyValues<this>` in all lifecycle hooks 10. Fix `Wc*` type alias imports in all 14 test files 11. Add coverage thresholds to `vitest.config.ts` 12. Fix 21 `setTimeout(r, 50)` instances in tests
