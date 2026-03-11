# AUDIT: hx-code-snippet — Antagonistic Quality Review (T3-13)

**Reviewer:** Automated antagonistic audit
**Date:** 2026-03-06
**Files audited:**

- `hx-code-snippet.ts`
- `hx-code-snippet.styles.ts`
- `hx-code-snippet.test.ts`
- `hx-code-snippet.stories.ts`
- `index.ts`

**Severity guide:** P0 = blocking defect / data loss / security | P1 = high / breaks functionality or a11y | P2 = medium / degrades quality

---

## 1. TypeScript

### P1 — No `lineNumbers` property exists

The feature specification explicitly calls out "line numbers prop typed" as an audit criterion. No `lineNumbers` (or equivalent) property is implemented anywhere in the component. The test file contains no line-number-related tests. This is a missing feature, not a gap in typing.

### P2 — `render()` lacks explicit return type

`override render()` has no return type annotation. Lit's base class accepts `TemplateResult | nothing`, but the strict project policy prefers explicit types. Should be `override render(): TemplateResult | typeof nothing`.

### P2 — Unsafe cast without null guard in `_handleSlotChange`

```ts
const slot = e.target as HTMLSlotElement;
```

`e.target` can be `null`. The cast is unchecked. Should be:

```ts
const slot = e.target as HTMLSlotElement | null;
if (!slot) return;
```

---

## 2. Accessibility

### P1 — `aria-expanded` missing on expand/collapse button

The expand button toggles between "Show more" / "Show less" but never sets `aria-expanded`. Screen readers receive no state signal beyond the label text change. WCAG 4.1.2 (Name, Role, Value) requires widget state to be programmatically determinable.

**Required:**

```html
<button aria-expanded="${this._expanded}" ...></button>
```

### P1 — Duplicate landmark labels: all instances share `aria-label="Code snippet"`

`<pre role="region" aria-label="Code snippet">` is applied to every instance. When a page contains multiple code snippets, all region landmarks have the identical label "Code snippet". This violates WCAG 1.3.6 and makes navigation landmarks useless for screen reader users who rely on landmark lists. Each instance must either use a unique descriptive label (e.g., incorporating the `language` attribute) or `role="region"` should be removed if the element does not represent a significant landmark.

### P1 — Copy success state not announced via live region

When the copy button is clicked, `aria-label` changes from "Copy code" to "Copied!" on the button element. A screen reader only announces an attribute change on a focused element in some implementations. A user who copies with a keyboard shortcut while focus is elsewhere will not hear the confirmation. An `aria-live="polite"` visually-hidden region should announce the "Copied!" state.

### P2 — No keyboard interaction tests

All test-file assertions use `btn.click()`. No tests use `dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))` or `{ key: ' ' }`. While native `<button>` elements handle keyboard activation, the absence of tests means regressions in keyboard behavior would go undetected.

### P2 — Language not surfaced on `<code>` element

Convention for syntax highlighter integration (Prism, highlight.js, Shiki) is to add `class="language-<name>"` to the `<code>` element. The `language` attribute is accepted but never applied to the rendered `<code>` tag. Third-party highlighter libraries that query `code[class*="language-"]` will not target these elements. The JSDoc claims "consumers integrating their own highlighter via slotted content" but the slot is hidden — this integration path doesn't work as described (see Architecture section).

---

## 3. Tests

### P1 — Boolean attribute `copyable="false"` test is misleading and documents wrong behavior

```ts
it('hides copy button when copyable=false', async () => {
  const el = await fixture<HelixCodeSnippet>(
    '<hx-code-snippet copyable="false">const x = 1;</hx-code-snippet>',
  );
  // Set programmatically since boolean false attr via HTML is tricky
  el.copyable = false;
```

The comment acknowledges the issue but the test still passes `copyable="false"` as HTML, then immediately overrides it with `el.copyable = false`. This tests the programmatic API only. The real behavior — that `copyable="false"` renders the copy button visible because the attribute is present — is untested and undocumented. In Drupal Twig templates, authors may write `copyable="false"` expecting it to hide the button. It will not.

**Required:** A test must assert that `copyable="false"` in HTML DOES show the copy button (confirming the boolean attribute trap), and the JSDoc must warn about this.

### P1 — No overflow scroll test

The specification calls out "overflow scroll" as a required test. No test verifies that `pre` has `overflow-x: auto` applied, or that long lines create horizontal scroll rather than clipping or wrapping.

### P1 — No timer cleanup test

`_copyTimer` is a stored timeout reference cleaned up in `disconnectedCallback`. No test verifies that disconnecting the element before the 2-second reset fires does not produce memory leaks or post-disconnect state mutations.

### P2 — No test that slot content flows into displayed `<code>` element

The component uses a hidden slot to capture text and re-inserts it into a `<code>` element. No test verifies that the text actually appears inside the shadow DOM's `<code>` element (as opposed to just checking the light-DOM `textContent`).

### P2 — axe-core test uses `page.screenshot()` as a prerequisite

```ts
await page.screenshot();
const { violations } = await checkA11y(el);
```

A screenshot is not a logical prerequisite for an accessibility audit. This pattern appears in every axe-core test. If `checkA11y` requires element rendering to be complete, `el.updateComplete` should be awaited instead.

---

## 4. Storybook

### P1 — MaxLines story content has no newlines — "Show more" never triggers

```ts
render: () => html`
  <hx-code-snippet language="javascript" max-lines="5">
    line 1: const a = 1; line 2: const b = 2; ...
  </hx-code-snippet>
`,
```

The content is a single long line. The `_isTruncated()` check splits on `\n`. No `\n` characters exist in this template literal. The "Show more" button will never appear. This story does not demonstrate the feature it is named for.

### P2 — `_canvas` variable declared but unused in `Default` play function

```ts
play: async ({ canvasElement }) => {
  const _canvas = within(canvasElement);  // unused
```

The `_canvas` variable is defined with an underscore prefix to suppress lint warnings, but it is never used. This is dead code in a story used for documentation.

### P2 — No play function for expand/collapse interaction

`MaxLines` has no `play` function. There is no interactive Storybook test demonstrating that clicking "Show more" expands the content and the button text changes.

### P2 — No `bash` or `typescript` named language stories

The audit spec calls out multiple languages. `bash` appears only in a healthcare scenario story and `typescript` only in CSSParts. Neither is a standalone language story for documentation clarity.

---

## 5. CSS

### P1 — Inline mode padding uses hardcoded values

```css
.code-snippet--inline {
  padding: 0.125em 0.375em;
```

These values are hardcoded. They should use `--hx-*` spacing tokens. Project rule: no hardcoded colors, spacing, or typography values. `0.125em` and `0.375em` have no token equivalents exposed in the component's custom property surface.

### P1 — No `header` CSS part

The audit specification explicitly requires "CSS parts (code, copy-btn, header)". No `header` element or `part="header"` exists in the component. There is no visual header region at all — the copy button floats absolutely over the code block. If a header section (e.g., for language labels or a title bar) was intended, it is absent.

### P2 — Hardcoded `tab-size: 2`

```css
.code-snippet__code {
  tab-size: 2;
```

Hardcoded value. Should be a token: `tab-size: var(--hx-code-snippet-tab-size, 2)` at minimum, or a global `--hx-tab-size` token if one exists.

### P2 — Hardcoded `z-index: 1` on copy button

```css
.code-snippet__copy-button {
  z-index: 1;
```

No `--hx-z-index-*` token used. Stacking context assumptions should be documented and tokenized.

### P2 — Hardcoded `line-height: 1` on copy button

```css
.code-snippet__copy-button {
  line-height: 1;
```

No token. Should be `line-height: var(--hx-line-height-none, 1)` or similar.

### P2 — `--hx-filter-brightness-active` is not a standard design token

```css
filter: brightness(var(--hx-filter-brightness-active, 0.8));
```

This token is not part of the documented `--hx-*` token system. If it does not exist in `@helixui/tokens`, the fallback value `0.8` is a hardcoded raw value.

---

## 6. Architecture / Correctness

### P1 — Hidden slot + manual re-render breaks slot content for syntax highlighters

The component hides its slot (`display: none`) and manually re-renders slot text content inside a `<code>` element:

```html
<!-- Hidden slot to capture text content for display and copy -->
<slot class="code-snippet__slot" @slotchange="${this._handleSlotChange}"></slot>
```

The JSDoc claims: "Pre-highlighted HTML is also accepted." This is **incorrect**. The `_handleSlotChange` handler extracts `textContent` from slotted nodes, discarding all HTML markup. Pre-highlighted HTML passed as slot content has its tags stripped, leaving only text. The JSDoc is actively misleading.

Additionally, this architecture causes a **flash of empty content**: on first render, `_codeText` is `''`. The slot fires `slotchange` asynchronously after the first render cycle. Until that resolves and `updateComplete` settles, the `<code>` element is empty. This is observable in SSR, slow parse contexts, or test environments.

### P1 — `copyable` defaults to `true` but the attribute is a boolean

`@property({ type: Boolean, reflect: true }) copyable: boolean = true`

With a `true` default, the `copyable` attribute is not reflected by default (Lit only reflects when you explicitly set the property). When `copyable` is `true` (default), no `copyable` attribute appears on the host element. When set to `false`, `reflect: true` would attempt to set `copyable=""` which is a presence attribute — but removing a boolean attribute to signal `false` is not how `reflect` works for booleans in Lit. Lit correctly handles this by removing the attribute when `false`. However, this inverts the expected convention: the default is `true` (copy enabled), but no attribute is present. Setting `copyable` in HTML always enables it. There is no HTML-only way to disable it after the fact without JavaScript.

---

## 7. Performance

### P1 — `tokenStyles` import from `@helixui/tokens/lit` — bundle impact unquantified

```ts
static override styles = [tokenStyles, helixCodeSnippetStyles];
```

`tokenStyles` inlines the entire token CSS into every component's shadow root. If this represents the full token set, it could be 10–50KB of CSS per shadow root instance on a page with many snippets. The per-component bundle target is <5KB. This import's actual size has not been audited. If `tokenStyles` is shared across all components via the same Lit stylesheet (deduplicated by the browser's adopted stylesheets), this is acceptable. If not, it is a critical bundle issue.

### P2 — No actual bundle size measurement documented

The component has never had its min+gz size measured and reported. The performance gate requires <5KB. Given the token import, this must be verified via `mcp__wc-mcp__estimate_bundle_size` or equivalent before merge.

---

## 8. Drupal Integration

### P1 — No Twig template or integration documentation

The audit specification requires the component to be "Twig-renderable." No Twig template, Drupal library definition, or integration example exists anywhere in the component directory. Other audited components (e.g., hx-action-bar, hx-tile) include Drupal integration examples. This is absent here.

### P2 — Clipboard API requires HTTPS — no user-facing documentation

`navigator.clipboard.writeText()` requires a secure context (HTTPS or localhost). Drupal staging environments often run HTTP. The failure is silently caught and the `hx-copy` event still fires, but the clipboard is not populated. No documentation warns integrators of this limitation. The catch block should ideally set a flag or provide a fallback using `document.execCommand('copy')` (deprecated but broadly supported).

---

## Summary Table

| #   | Area          | Severity | Finding                                                                                                                              |
| --- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | TypeScript    | P1       | `lineNumbers` property is entirely missing                                                                                           |
| 2   | TypeScript    | P2       | `render()` lacks explicit return type                                                                                                |
| 3   | TypeScript    | P2       | Unsafe cast in `_handleSlotChange` — no null guard                                                                                   |
| 4   | Accessibility | P1       | `aria-expanded` missing on expand/collapse button                                                                                    |
| 5   | Accessibility | P1       | All instances share identical `role="region"` label "Code snippet"                                                                   |
| 6   | Accessibility | P1       | Copy success "Copied!" not announced via `aria-live`                                                                                 |
| 7   | Accessibility | P2       | No keyboard interaction tests                                                                                                        |
| 8   | Accessibility | P2       | `language` not applied as `class="language-*"` on `<code>`                                                                           |
| 9   | Tests         | P1       | `copyable="false"` HTML test is misleading — documents wrong behavior                                                                |
| 10  | Tests         | P1       | No overflow scroll test                                                                                                              |
| 11  | Tests         | P1       | No timer cleanup test (disconnectedCallback path)                                                                                    |
| 12  | Tests         | P2       | No test that slot text appears in shadow `<code>` element                                                                            |
| 13  | Tests         | P2       | `page.screenshot()` used as prerequisite for axe-core tests                                                                          |
| 14  | Storybook     | P1       | MaxLines story has no newlines — "Show more" never appears                                                                           |
| 15  | Storybook     | P2       | `_canvas` variable declared but never used in Default play fn                                                                        |
| 16  | Storybook     | P2       | No play function for expand/collapse interaction                                                                                     |
| 17  | Storybook     | P2       | No dedicated bash/typescript language stories                                                                                        |
| 18  | CSS           | P1       | Inline padding `0.125em 0.375em` — hardcoded, not tokenized                                                                          |
| 19  | CSS           | P1       | No `header` CSS part — required by spec                                                                                              |
| 20  | CSS           | P2       | `tab-size: 2` hardcoded                                                                                                              |
| 21  | CSS           | P2       | `z-index: 1` hardcoded                                                                                                               |
| 22  | CSS           | P2       | `line-height: 1` hardcoded                                                                                                           |
| 23  | CSS           | P2       | `--hx-filter-brightness-active` is not a documented token                                                                            |
| 24  | Architecture  | P1       | Hidden slot + `textContent` strips HTML — JSDoc "pre-highlighted HTML accepted" is false                                             |
| 25  | Architecture  | P1       | Flash of empty `<code>` on initial render before `slotchange` fires                                                                  |
| 26  | Architecture  | P1       | `copyable` default `true` + boolean attribute semantics undocumented — Twig/HTML authors cannot disable via attribute string "false" |
| 27  | Performance   | P1       | `tokenStyles` bundle impact unquantified — could exceed 5KB target                                                                   |
| 28  | Performance   | P2       | No bundle size measurement on record                                                                                                 |
| 29  | Drupal        | P1       | No Twig template or integration documentation                                                                                        |
| 30  | Drupal        | P2       | Clipboard API requires HTTPS — no documentation or fallback                                                                          |

**P0 count:** 0
**P1 count:** 13
**P2 count:** 11

**Verdict: NOT ready for merge.** Thirteen P1 findings must be resolved before this component meets the project quality bar. The most critical issues are: missing `aria-expanded` on expand button, duplicate landmark labels, unanounced copy state, the broken MaxLines story, incorrect JSDoc about slot HTML support, and missing Drupal integration documentation.
