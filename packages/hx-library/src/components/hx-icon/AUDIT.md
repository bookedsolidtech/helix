# AUDIT: hx-icon — T3-63 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit
**Date:** 2026-03-05
**Branch:** `feature/audit-hx-icon-t3-63-antagonistic`
**Files reviewed:**
- `hx-icon.ts`
- `hx-icon.styles.ts`
- `hx-icon.test.ts`
- `hx-icon.stories.ts`

---

## Findings

### 1. TypeScript

#### [P1] `name` property has no typed icon-name union or branded type

**File:** `hx-icon.ts:33`

```ts
@property({ type: String })
name = '';
```

`name` is a plain `string`. Typos like `name="chck"` fail silently at runtime — no TS error, no console warning, just an invisible icon. Peer libraries (Shoelace, Carbon, Spectrum) export a typed `IconName = 'check' | 'close' | ...` union so that editors provide autocomplete and mismatches are caught at build time. Without a bundled icon set this is structurally harder to provide, but the absence is a gap worth documenting. At minimum, a branded type or JSDoc enum comment would improve DX.

#### [P2] No `color` JS property — only a CSS custom property

**File:** `hx-icon.ts`, `hx-icon.styles.ts:10`

The feature description lists "color prop" as a TypeScript audit area. The component exposes `--hx-icon-color` as a CSS custom property but has no `color` JavaScript property. Consumers who want to imperatively set icon color must reach for CSS variables rather than an attribute. Whether this is intentional (CSS-only theming) or an omission is unclear, but it deviates from the stated contract.

#### [P2] `size` attribute uses the non-standard `hx-size` attribute name with a bare `size` property

**File:** `hx-icon.ts:56`

```ts
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
```

The JavaScript property is `size` but the HTML attribute is `hx-size`. This mismatch is intentional (namespace collision avoidance) but it is unusual and not documented in the JSDoc on the property. Consumers setting `el.size = 'lg'` via JS and `hx-size="lg"` via HTML are not obviously equivalent without reading the source. The CEM should explicitly document both names.

---

### 2. Accessibility

#### [P1] `style` attribute not stripped in inline SVG sanitizer — potential CSS injection vector

**File:** `hx-icon.ts:148–174`

The `_sanitizeSvg` method removes `<script>`, `<foreignObject>`, `on*` event-handler attributes, and `javascript:`/`data:` href values. However, **`style` attributes are not stripped**. Malicious SVG payloads can carry CSS via `style`:

```xml
<svg>
  <animate attributeName="href" values="javascript:alert(1)" style="fill:url(javascript:alert(1))"/>
</svg>
```

CSS-based vectors (`url()` with `javascript:` scheme, `expression()` in legacy engines) are not blocked. In a healthcare application that accepts externally-provided SVG URLs this is a meaningful attack surface.

Additionally, CSS `filter` and `clip-path` can reference external URLs (`filter: url(https://evil.example/data.svg#xss)`), and these are not blocked.

#### [P1] Inline-mode inner SVG lacks `focusable="false"`

**File:** `hx-icon.ts:213–234`

Sprite mode explicitly sets `focusable="false"` on the `<svg>` element (line 206), which prevents IE11/old Edge from tabbing into SVGs. Inline fetch mode embeds the raw `unsafeHTML` SVG without post-processing, so the inner `<svg>` element retains whatever `focusable` value it was authored with. The outer `<span part="svg">` wrapper cannot override this. Any inline SVG that lacks `focusable="false"` in its source will allow keyboard focus to land on a non-interactive element.

#### [P1] Inline mode: inner SVG ARIA attributes may conflict with wrapper ARIA

**File:** `hx-icon.ts:223–233`

The accessible label is applied to the `<span part="svg">` wrapper. The embedded SVG (from `unsafeHTML`) may carry its own `role`, `aria-label`, or `aria-hidden` attributes — these are not stripped by the sanitizer. This can produce double-announcement (e.g., AT reads both the wrapper label and the inner SVG title/label) or a mismatch (inner SVG is `aria-hidden="true"` while the wrapper has `role="img"`).

#### [P2] No `title` element inside sprite-mode SVG for additional AT context

**File:** `hx-icon.ts:196–210`

The sprite SVG uses `aria-label` for meaningful icons, which is sufficient. However, some screen reader + browser combinations give `aria-label` lower priority than an embedded `<title>` inside the SVG. Adding a dynamic `<title>` when `label` is non-empty would improve compatibility breadth at no cost.

---

### 3. Tests

#### [P1] No axe-core tests for inline SVG mode

**File:** `hx-icon.test.ts`

The accessibility `describe` block (lines 127–178) runs axe-core checks for sprite mode only (`name="check"`). There are no equivalent `checkA11y` tests for inline fetch mode (`src=`). An SVG fetched and rendered via `unsafeHTML` could introduce axe violations (e.g., nested `role="img"` conflicts, missing accessible names on inner elements) that the current test suite would not catch.

#### [P1] No test for inline SVG mode ARIA attributes

**File:** `hx-icon.test.ts`

Tests at lines 128–159 verify that `[part="svg"]` receives `role="img"` / `aria-label` / `aria-hidden` for sprite mode. There are no parallel tests verifying the same attributes on the `<span part="svg">` wrapper when using `src=` inline mode. A regression in `_renderInline` ARIA handling would go undetected.

#### [P1] No test for `src` fetch failure fallback

**File:** `hx-icon.test.ts`

The component silently returns `nothing` when `src` fetch fails (HTTP error or network exception). There is no test asserting this behavior — e.g., that the shadow root is empty and that `_fetchedSrc` is cleared. A regression that leaves stale SVG in the DOM after a failed re-fetch would not be caught.

#### [P2] No test for unknown icon name (silent empty render)

**File:** `hx-icon.test.ts`

When `name="nonexistent-icon"` is set without a `spriteUrl`, the component renders an `<svg>` with `<use href="#nonexistent-icon">` — producing an invisible icon with no error, no fallback slot, and no console warning. This failure mode is untested. A healthcare application displaying an empty space where a warning icon should appear (e.g., "critical alert") is a patient-safety concern.

#### [P2] No module-level fetch cache — duplicate network requests untested

**File:** `hx-icon.ts:98–126`

Multiple `hx-icon` elements sharing the same `src` URL each issue an independent `fetch()` call. There is no shared cache. This is a performance gap (documented under Performance) but it is also an observable correctness concern: the test suite does not verify that a second component instance for the same URL reads from cache or reuses prior data.

#### [P2] `waitForInlineSvg` polling helper is fragile

**File:** `hx-icon.test.ts:9–16`

```ts
for (let i = 0; i < 10; i += 1) {
  await Promise.resolve();
  await el.updateComplete;
  if (el.shadowRoot?.querySelector('[part="svg"]')) return;
}
throw new Error('Timed out waiting for inline SVG render');
```

This retry loop is not time-bounded by wall-clock time and will silently under-wait on slow CI runners. It also accesses `el.shadowRoot` directly rather than using the project-standard `shadowQuery` helper. Consider `@vitest/browser/context`'s `page.waitFor` or a proper element-observer.

---

### 4. Storybook

#### [P1] No icon catalog story

**File:** `hx-icon.stories.ts`

The feature description explicitly requires an "icon catalog (all available)" story. No such story exists. Developers integrating `hx-icon` cannot browse the available icon names from Storybook — they must consult external documentation or guess. For a healthcare design system where icon meaning is clinically significant (e.g., "warning" vs "alert" vs "error"), a browseable catalog is a critical DX requirement.

#### [P2] No color variant story

**File:** `hx-icon.stories.ts`

`--hx-icon-color` and `currentColor` inheritance are documented in the JSDoc but never demonstrated in a story. There is no story showing icons against colored backgrounds, inside colored buttons, or with an explicit `--hx-icon-color` override. Consumers discovering the color system must read source code.

#### [P2] `InlineSvgMode` story `play` function does not verify rendered SVG content

**File:** `hx-icon.stories.ts:291–296`

```ts
play: async ({ canvasElement }) => {
  const icon = canvasElement.querySelector('hx-icon');
  await expect(icon).toBeTruthy();
  await expect(icon?.getAttribute('src')).toBeTruthy();
},
```

The play function only confirms the `src` attribute is set — it does not wait for the async fetch to resolve nor verify that `[part="svg"]` appears. This means the story's interaction test does not actually prove that inline SVG renders correctly.

#### [P2] Default story `play` function has no meaningful assertion

**File:** `hx-icon.stories.ts:115–121`

The `Default` story play function only checks that `icon` is truthy and that `[part="svg"]` exists — it does not verify `aria-hidden`, `href`, or any behavioral property. Compare to `WithLabel` and `Decorative` which have richer assertions.

---

### 5. CSS

#### [P1] CSS part name `svg` used on a `<span>` element in inline mode

**File:** `hx-icon.ts:225`, `hx-icon.styles.ts:38`

```html
<span part="svg" class="icon__inline" ...>
```

The CSS part is named `svg` but in inline mode it is applied to a `<span>`. The CSS rule `svg[part='svg']` in `hx-icon.styles.ts:38` matches only the actual `<svg>` element, so inline-mode sizing styles (`width: 100%; height: 100%; fill: currentColor`) are handled by the `.icon__inline svg` rule instead. This inconsistency means consumers using `::part(svg)` in their CSS will style a `<span>` in inline mode and an `<svg>` in sprite mode — unexpected behavior.

#### [P2] No `overflow: hidden` safety net on `:host`

**File:** `hx-icon.styles.ts:5–12`

The sprite SVG sets `overflow: visible` (line 43), which is appropriate for icons that extend slightly beyond their viewBox. However, the `:host` has no `overflow: hidden` guard. An oversized or malformed icon could overflow and paint outside the component bounds, affecting adjacent layout. Adding `overflow: hidden` to `:host` with `overflow: visible` on the SVG via `::part(svg)` override would allow the SVG to control its own overflow while protecting the host box.

#### [P2] No `line-height: 0` or `vertical-align: middle` on `:host`

**File:** `hx-icon.styles.ts:5–12`

`:host` is `display: inline-flex`, which is correct. However, without `vertical-align: middle` (or `top`), inline-flex elements are baseline-aligned by default. An `hx-icon` placed inline alongside text will align to the text baseline rather than the visual center — a common icon-in-text layout bug. The `Decorative` story demonstrates this pattern but does not expose the alignment.

#### [P2] Size token fallbacks use hardcoded pixel values

**File:** `hx-icon.styles.ts:16–34`

```css
:host([hx-size='xs']) {
  --hx-icon-size: var(--hx-size-4, 1rem);
}
```

The fallback values (`1rem`, `1.25rem`, `1.5rem`, `2rem`, `2.5rem`) are hardcoded. If the project's token values change (e.g., `--hx-size-6` is updated from `1.5rem` to `1.75rem`), these fallbacks become stale and create inconsistency when tokens are unavailable. Fallbacks should ideally reference other tokens or document that they mirror the token values at the time of writing.

---

### 6. Performance

#### [P1] No module-level fetch cache for inline SVG mode

**File:** `hx-icon.ts:98–126`

Every `hx-icon` instance with a `src` URL performs its own independent `fetch()`. A page rendering 20 warning icons from the same SVG file issues 20 sequential network requests. No shared cache (e.g., a module-level `Map<string, Promise<string>>`) exists. This is a standard optimization in peer icon libraries (Shoelace, Spectrum, Carbon) and its absence is a significant performance deficiency for high-density icon usage in healthcare dashboards.

#### [P1] Sanitizer runs on main thread synchronously for each fetch

**File:** `hx-icon.ts:133–177`

`_sanitizeSvg` creates a `DOMParser`, parses the full SVG, traverses all elements, and serializes the result — synchronously in the update lifecycle. For complex SVGs (e.g., detailed clinical diagrams) this can cause frame drops. No off-thread processing (Web Worker, `scheduler.yield`) is used.

#### [P2] Bundle size not verified in this component's test/CI configuration

No bundle-size snapshot or assertion exists for `hx-icon`. The feature description requires `< 3KB` for the component. The inline fetch and sanitizer logic adds meaningful byte weight over a pure sprite wrapper. A size budget check should be added.

---

### 7. Drupal

#### [P1] Inline fetch mode is not server-side renderable — gap undocumented

**File:** `hx-icon.ts:98–126`

Inline SVG mode relies on browser `fetch()` and `DOMParser`. These APIs are unavailable server-side (PHP/Twig). A Drupal theme rendering `<hx-icon src="/path/to/icon.svg">` will produce an empty element on initial page load until client-side JavaScript hydrates it. This is a content-shift / accessibility-before-JS concern. The component does not document which mode should be used in Drupal contexts, nor does it provide a server-rendered fallback slot.

#### [P2] No Drupal-specific Storybook story or documentation

**File:** `hx-icon.stories.ts`

There is no story demonstrating the Twig-compatible usage pattern (sprite mode with `sprite-url` pointing to a Drupal CDN path). Drupal integrators must infer the correct attribute names and sprite URL convention from the generic Storybook stories.

#### [P2] `hx-size` attribute name may conflict with Drupal field naming conventions

**File:** `hx-icon.ts:56`

The `hx-size` attribute (with a hyphen prefix on a non-standard prefix) is valid HTML but unusual. Drupal Twig templates using `{{ attributes.setAttribute('hx-size', size) }}` will work, but Drupal's attribute system may require explicit handling. This is not documented.

---

## Summary by Severity

| Severity | Count | Areas |
|----------|-------|-------|
| **P0** | 0 | — |
| **P1** | 9 | Security (sanitizer CSS injection), A11y (inline ARIA/focusable), Tests (inline axe, ARIA, fetch-fail), Storybook (catalog), CSS (part name mismatch), Performance (no cache, sync sanitizer), Drupal (SSR gap) |
| **P2** | 12 | TS (color prop, attribute doc), A11y (SVG title), Tests (unknown icon, cache, helper fragility), Storybook (color story, weak play fns), CSS (overflow, line-height, token fallbacks), Perf (no size budget), Drupal (docs, attribute naming) |

**No P0 blockers identified.** The component has a solid foundation but carries meaningful P1 gaps in the SVG sanitizer (CSS injection), inline-mode accessibility, and performance (no fetch cache) that must be addressed before this component is suitable for production healthcare use.
