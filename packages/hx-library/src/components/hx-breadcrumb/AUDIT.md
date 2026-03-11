# AUDIT: hx-breadcrumb — Antagonistic Quality Review (T1-18)

**Reviewer:** Automated antagonistic audit
**Date:** 2026-03-05
**Files reviewed:**
- `hx-breadcrumb.ts`
- `hx-breadcrumb-item.ts`
- `hx-breadcrumb.styles.ts`
- `hx-breadcrumb-item.styles.ts`
- `hx-breadcrumb.test.ts`
- `hx-breadcrumb.stories.ts`
- `index.ts`

---

## Summary

The component is functionally solid for the happy path. ARIA structure, slot management, and separator logic are well-reasoned. However, several P1 issues block production readiness: hardcoded hex fallbacks violate the zero-tolerance token policy, the "current page is always last" assumption breaks Drupal compatibility, and Storybook coverage is incomplete. No P0s found.

---

## Findings

### 1. TypeScript

#### P2 — `_itemCount` reactive state is a render-trigger hack
**File:** `hx-breadcrumb.ts:60,227`

`_itemCount` is declared as `@state()` solely to force a re-render when slot contents change. The render method reads it via `void this._itemCount` — a comment acknowledges this is intentional but it is still an anti-pattern. The correct approach is to store actual derived data in `@state()` or restructure so that `_handleSlotChange` writes meaningful state (e.g., the items array itself). The current approach is fragile: any accidental read optimization by Lit's compiler could drop this.

#### P2 — `Record<string, unknown>` used in JSON-LD entry builder
**File:** `hx-breadcrumb.ts:178`

The `entry` variable is typed as `Record<string, unknown>` then mutated. A typed interface (`ListItem`) would be safer and self-documenting. Minor but inconsistent with the "zero `any`" philosophy since `Record<string, unknown>` is barely stronger than `Record<string, any>` here.

#### P2 — Private state accessed in tests via `as unknown as` cast
**File:** `hx-breadcrumb.test.ts:335,339,380`

Three test cases cast the component via `(el as unknown as { _jsonLdId: string })` to access a private field. This is a smell: private fields should not be tested directly. The tests should verify observable behavior (script presence, content, deduplication) without piercing encapsulation. If the field needs to be observable, consider a `@property` or `data-` attribute approach.

---

### 2. Accessibility

#### P1 — Current page item with `href` renders as a navigable link
**File:** `hx-breadcrumb-item.ts:63-68`, `hx-breadcrumb.ts:94-105`

The parent sets `aria-current="page"` on the last item regardless of whether that item has an `href`. If a consumer passes `href` to the last `hx-breadcrumb-item`, it renders as an `<a>` element pointing to the current page. The WAI-ARIA Authoring Practices Guide (Breadcrumb pattern) explicitly states the current page item MUST NOT be a link. WCAG 2.1 SC 2.4.4 (Link Purpose) is also impacted — a link to the current page with `aria-current="page"` is confusing to AT users. The component should either strip `href` from the last item when applying `aria-current`, or document this as a consumer responsibility and add a warning.

#### P2 — `aria-current="page"` placed on `listitem` host rather than the inner link/text
**File:** `hx-breadcrumb.ts:99`, `hx-breadcrumb-item.ts` (shadow DOM inner elements)

The canonical WAI-ARIA breadcrumb pattern (APG) places `aria-current="page"` on the `<a>` element representing the current page (or on the `<span>` if no link). In this implementation, `aria-current` is set on the `hx-breadcrumb-item` host element which has `role="listitem"`. While technically valid per ARIA 1.1 (the attribute is allowed on any role), screen reader behavior varies: some readers announce "current page, list item" while the canonical pattern yields "current page link" or "current page, Patient Records". Testing with VoiceOver (macOS), NVDA, and JAWS is required to verify the AT announcement is appropriate.

#### P2 — Ellipsis item acquires `role="listitem"` via `connectedCallback`
**File:** `hx-breadcrumb-item.ts:38-39`, `hx-breadcrumb.ts:136-141`

The programmatically-created ellipsis element (`document.createElement('hx-breadcrumb-item')`) has `aria-hidden="true"` set before insertion. When inserted, `connectedCallback` fires on `hx-breadcrumb-item`, checks `closest('hx-breadcrumb')`, finds a match, and sets `role="listitem"`. The resulting element has both `aria-hidden="true"` and `role="listitem"`. While `aria-hidden` suppresses AT exposure of the entire subtree, the order-of-operations is fragile — if `connectedCallback` runs before `aria-hidden` is set in a future refactor, an empty list item appears in the AT tree. Setting `aria-hidden` before insertion (as currently done) is correct, but this dependency is undocumented.

#### P1 — No keyboard-accessible "expand" for collapsed breadcrumb
**File:** `hx-breadcrumb.ts:123-148`

When `max-items` collapses the middle items, the ellipsis (`…`) renders as a static custom element with no click handler, no `role="button"`, no `tabindex`, and no way for keyboard users to expand the full path. Sighted mouse users can at least see nothing is interactive, but keyboard users have no affordance at all. WCAG 2.1 SC 2.1.1 (Keyboard) requires all functionality available via mouse also be available via keyboard. If collapsed breadcrumbs are intended to remain permanently collapsed (no expand), this must be documented explicitly. If expand is intended, it needs full keyboard and ARIA support.

---

### 3. Tests

#### P1 — `_handleSeparatorSlotChange` is entirely untested
**File:** `hx-breadcrumb.ts:112-119`

The named `separator` slot handler reads slotted element text content and sets a CSS custom property. This code path has zero test coverage. A test with `<span slot="separator">›</span>` verifying the CSS property is set would be minimal; the absence is a coverage gap.

#### P1 — No test for collapsed state with keyboard interaction
**File:** `hx-breadcrumb.test.ts` (missing)

Given the keyboard accessibility gap noted above, there is no test verifying that collapsed breadcrumb content is accessible or that an expand mechanism exists.

#### P2 — JSON-LD href values not verified
**File:** `hx-breadcrumb.test.ts:371-386`

The "updates the existing script content when items change" test verifies `itemListElement` length but does not verify the `item` (href) or `name` values in the schema. A shallow length check can pass even if the href extraction logic is broken.

#### P2 — No test for `max-items` value equal to exactly item count
**File:** `hx-breadcrumb.test.ts:278-292`

This test exists (line 278) and passes — noted as complete. However, there is no test for `max-items="1"` (minimum viable collapse) or for the edge case where `max-items` exceeds item count.

#### P2 — No test for dynamic item insertion/removal
No test exercises adding or removing `hx-breadcrumb-item` children after initial render to verify the `slotchange` handler correctly re-evaluates `aria-current` and `data-bc-last`.

---

### 4. Storybook

#### P1 — `maxItems` and `jsonLd` properties missing from `argTypes`
**File:** `hx-breadcrumb.stories.ts:15-34`

Both `maxItems` (attribute: `max-items`) and `jsonLd` (attribute: `json-ld`) are public properties of `hx-breadcrumb` but are not declared in `argTypes`. The Storybook controls panel will not expose them, making these features invisible in the component playground. For an enterprise library where autodocs drive consumer discovery, this is a significant gap.

#### P1 — No story for collapsed/truncated breadcrumb (`maxItems`)
**File:** `hx-breadcrumb.stories.ts` (missing)

The `max-items` collapse feature is implemented and tested but has no Storybook story. Consumers cannot discover or visually verify this behavior.

#### P1 — No story with icon content
**File:** `hx-breadcrumb.stories.ts` (missing)

The feature specification calls for a story demonstrating icons within breadcrumb items (e.g., SVG or icon component slotted into `hx-breadcrumb-item`). This is entirely absent.

#### P2 — `subcomponents` declaration uses string value
**File:** `hx-breadcrumb.stories.ts:13`

```ts
subcomponents: { 'hx-breadcrumb-item': 'hx-breadcrumb-item' },
```

Storybook's `subcomponents` expects a component definition object (class reference or equivalent), not a string tag name. The current value `'hx-breadcrumb-item'` (a plain string) will produce no autodoc tab for the sub-component in Storybook 8+. The correct pattern is to import and pass the class:

```ts
import { HelixBreadcrumbItem } from './hx-breadcrumb-item.js';
subcomponents: { 'hx-breadcrumb-item': HelixBreadcrumbItem },
```

#### P2 — No story for separator slot (named slot usage)
**File:** `hx-breadcrumb.stories.ts` (missing)

The component exposes a `separator` named slot that overrides the `separator` property. There is no story demonstrating this pattern.

---

### 5. CSS

#### P1 — Hardcoded hex fallback values throughout item styles
**File:** `hx-breadcrumb-item.styles.ts:14,23,28,33,40`

Five distinct hex color values are hardcoded as final fallbacks in CSS custom property chains:

| Line | Value | Token it should use |
|------|-------|---------------------|
| 14 | `#0369a1` | `--hx-color-primary-600` (already declared — remove the hex) |
| 23 | `#075985` | `--hx-color-primary-700` |
| 28 | `#0ea5e9` | `--hx-color-primary-500` |
| 33 | `#374151` | `--hx-color-neutral-700` |
| 40 | `#9ca3af` | `--hx-color-neutral-400` |

These violate the project's zero-tolerance "no hardcoded values" policy. If design tokens are not resolved (e.g., tokens package not loaded), the fallback silently bakes in a specific palette rather than failing visibly. Enterprise themes that remap these tokens will see unexpected behavior.

#### P2 — No CSS truncation for long item text
**File:** `hx-breadcrumb.styles.ts`, `hx-breadcrumb-item.styles.ts`

Neither the breadcrumb container nor item styles include `overflow: hidden`, `text-overflow: ellipsis`, or `white-space: nowrap`. In a constrained viewport (common in healthcare application sidebars), long page titles will cause layout overflow. The `max-items` feature handles item count but not label length. A `--hx-breadcrumb-item-max-width` token with truncation CSS should be provided.

#### P2 — `separator-slot` hidden via `display: none` without `visibility: hidden`
**File:** `hx-breadcrumb.styles.ts:33-35`

The named `separator` slot is hidden with `display: none`. `display: none` removes the element from layout and accessibility tree, which is intentional. However, if the separator slot ever contains interactive elements or receives focus, `display: none` prevents focus entirely. This is an edge case but worth documenting.

#### P2 — CSS `content` property value injection is fragile
**File:** `hx-breadcrumb.ts:218`, `hx-breadcrumb-item.styles.ts:44-46`

The separator character is set via `JSON.stringify(this.separator)` which wraps the value in double quotes (e.g., `"/"`, `">"`). This is correct for CSS `content`. However, if a consumer directly sets `--hx-breadcrumb-separator-content` without quoting (e.g., `style="--hx-breadcrumb-separator-content: /"`) the CSS `content` property receives an unquoted value and silently renders nothing. This footgun is not documented.

---

### 6. Performance

#### P2 — JSON-LD side effect mutates `document.head`
**File:** `hx-breadcrumb.ts:188-202`

Injecting a `<script>` tag into `document.head` is a global side effect. In server-side rendering (Next.js, Astro, etc.) this runs in a browser context and will work, but:
1. Multiple components on one page each inject their own `<script>` — the deduplication logic uses `Math.random()` for instance IDs (`_jsonLdId` at line 170), meaning IDs are not deterministic. This prevents hydration matching in SSR frameworks.
2. The script is not cleaned up if `json-ld` attribute is toggled false — `disconnectedCallback` removes it but attribute change does not.
3. No `updated()` handler watches `jsonLd` property changes — if `json-ld` is set after initial render via JS (`el.jsonLd = true`), nothing happens until the next `slotchange` event.

#### P2 — Bundle size: cannot verify without build output
No bundle size measurement was produced as part of this audit. `npm run cem` and a build run are required to confirm the `<5KB` gate. The `tokenStyles` import from `@helixui/tokens/lit` is an unknown size contribution.

---

### 7. Drupal

#### P1 — "Current page is always last item" assumption breaks Drupal rendering
**File:** `hx-breadcrumb.ts:94-105`

Drupal's breadcrumb API (`\Drupal\Core\Breadcrumb\Breadcrumb`) generates breadcrumb items where the current page item is typically the last, but server-side Drupal templates may not control item order after hydration. More critically: Drupal themes often render breadcrumbs with the current page explicitly marked via a CSS class or attribute on a specific item (not necessarily the last). The component unconditionally applies `aria-current="page"` and `data-bc-last` to the last slotted item. A Drupal template that renders items in a different order or marks current page via a `data-current` attribute has no supported mechanism to override this behavior.

**Recommended fix:** Support an explicit `current` attribute on `hx-breadcrumb-item` that takes precedence over positional last-item detection.

#### P1 — JSON-LD head injection incompatible with Drupal's head management
**File:** `hx-breadcrumb.ts:195-199`

Drupal manages `<head>` content via `drupal_add_html_head()` and its render pipeline. Injecting a `<script>` tag directly via `document.head.appendChild()` in a Drupal context:
1. Bypasses Drupal's deduplication logic
2. Is not cacheable by Drupal's page cache
3. Will be wiped on BigPipe partial page replacements
4. Cannot be targeted by Drupal's `hook_html_head_alter()`

The JSON-LD feature should either be disabled by default (it is) with explicit documentation of this incompatibility, or provide a server-side alternative via a structured data Twig template.

#### P2 — No Twig template or Drupal integration example
**File:** (missing from component directory)

No `hx-breadcrumb.twig`, no `README.md` with Drupal usage, and no documentation of how to integrate with `\Drupal\Core\Breadcrumb\BreadcrumbBuilderInterface`. Other enterprise component libraries in this space (USWDS, Carbon) ship Twig macros alongside components. Without this, Drupal integrators must reverse-engineer the HTML structure.

#### P2 — Server-side `aria-current` not documented
When Drupal pre-renders the breadcrumb server-side (for SEO/accessibility with JS disabled), the `aria-current="page"` attribute will NOT be present — it is set only via JavaScript `slotchange`. If a Drupal render occurs without JS, the current page item has no `aria-current`. The component should document that server-side rendering requires explicit `aria-current="page"` on the appropriate item via the Twig template.

---

## Issue Register

| ID | Severity | Area | Title |
|----|----------|------|-------|
| BC-01 | P1 | Accessibility | Last item with `href` renders as navigable link despite `aria-current="page"` |
| BC-02 | P1 | Accessibility | No keyboard/ARIA support for collapsed breadcrumb expansion |
| BC-03 | P1 | CSS | Hardcoded hex fallback values violate token policy |
| BC-04 | P1 | Tests | `_handleSeparatorSlotChange` is entirely untested |
| BC-05 | P1 | Storybook | `maxItems` and `jsonLd` missing from `argTypes` |
| BC-06 | P1 | Storybook | No story for collapsed/truncated state |
| BC-07 | P1 | Storybook | No story with icon content |
| BC-08 | P1 | Drupal | "Current page is always last" breaks Drupal breadcrumb rendering |
| BC-09 | P1 | Drupal | JSON-LD `document.head` injection incompatible with Drupal head pipeline |
| BC-10 | P2 | TypeScript | `_itemCount` render-trigger hack |
| BC-11 | P2 | TypeScript | Private `_jsonLdId` accessed via unsafe cast in tests |
| BC-12 | P2 | Accessibility | `aria-current="page"` on `listitem` host vs. inner link (non-canonical) |
| BC-13 | P2 | Accessibility | Ellipsis element `role="listitem"` + `aria-hidden` order dependency |
| BC-14 | P2 | Tests | JSON-LD href values not verified in schema output |
| BC-15 | P2 | Tests | No test for dynamic item insertion/removal post-render |
| BC-16 | P2 | Storybook | `subcomponents` has string value instead of class reference |
| BC-17 | P2 | Storybook | No story for named `separator` slot |
| BC-18 | P2 | CSS | No CSS truncation for long item text |
| BC-19 | P2 | CSS | `separator-slot` `display: none` hides focusable content |
| BC-20 | P2 | CSS | CSS `content` injection undocumented footgun for direct CSS overrides |
| BC-21 | P2 | Performance | JSON-LD `jsonLd` property toggle does not update head script |
| BC-22 | P2 | Performance | Non-deterministic `_jsonLdId` prevents SSR hydration matching |
| BC-23 | P2 | Drupal | No Twig template or Drupal integration example |
| BC-24 | P2 | Drupal | Server-side `aria-current` absence not documented |

---

## What Is Working Well

- `<nav aria-label>` + `<ol>` structure is semantically correct
- Separators are presentational (`aria-hidden="true"`) with CSS `content` — correct pattern
- `role="listitem"` guard in `connectedCallback` prevents invalid ARIA when used standalone
- axe-core tests pass in all three scenarios (default, single item, custom separator)
- Deduplication logic for multiple JSON-LD instances on one page is well-considered
- `disconnectedCallback` cleans up injected scripts
- `data-bc-hidden` + `::slotted` CSS approach for collapse is clean
- Focus ring on links uses `focus-visible` (not `:focus`) — correct
- `separator` slot override pattern is a clean progressive enhancement
