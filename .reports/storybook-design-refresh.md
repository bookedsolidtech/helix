# Storybook Design Refresh — Evaluation + Implementation Plan

**Status:** plan only — read-only session, no code changes
**Branch:** `feat/aaa-certification` (local)
**Author:** senior frontend engineering review
**Date:** 2026-05-06
**Scope:** evaluate the design-system review bundle at `~/Downloads/dist`, survey `apps/storybook/` current state, propose phased upgrade.

---

## 1. Design-system bundle analysis

### What this actually is

The bundle at `/Users/himerus/Downloads/dist` is **not** a generic "Claude Design" reference. It is a self-titled **HELiX Design System review bundle, v3.2.2** (`/Users/himerus/Downloads/dist/README.md:1-50`) — a 15-page static site that re-frames helix's own design tokens, brand registry, and component patterns into a chunked, presentation-grade format. The structure (`index.html` + 15 self-contained pages under `foundation/`, `components/`, `patterns/`) reads like an internal-stakeholder review deliverable: each page is fullscreen, framed in an iframe shell, navigable via `↑`/`↓`, with three demo brands (Meridian / Evergreen / Lumen) and three themes (light / dark / high-contrast) toggleable from a floating shell pill in the bottom-right corner.

It is the single best living artifact of how the HELiX visual language wants to be presented. Worth mining heavily — the foundation pages in particular are publishable-quality and overlap directly with what Storybook's Docs tab needs to deliver.

### Color system (`/Users/himerus/Downloads/dist/assets/helix-tokens.css`)

- **Three-tier cascade** identical to what `@helixui/tokens` already publishes: primitive ramps → semantic surface/text/border/action → component overrides.
- **8 ramps × 11 stops** (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950): `primary` (precision-cool teal, `#0F7078` at 600), `secondary`, `accent`, `neutral`, plus `success`/`warning`/`error`/`info` status ramps with abbreviated stops.
- **Mode handling**: `[data-theme='dark']` and `[data-theme='high-contrast']` selectors swap the semantic tier only — the primitive ramps stay constant in dark, but high-contrast actually remaps the primary ramp to higher-luminance blues plus pure black/white surfaces and yellow (`#FFFF00`) focus rings.
- **Brand registry** (`/Users/himerus/Downloads/dist/assets/helix-tokens.css:270-325`): three reference brands swap only the primary/secondary primitive ramps via `[data-brand='...']`. This is the model `well-helix` and other consumers should copy verbatim.
- **Surface contrast labelled inline** (`foundation/03-colors.html:138-141`) — every surface card prints its contrast ratio against text-primary as a token-level documentation contract, not a separate audit artifact. **This is a pattern worth lifting wholesale into Storybook.**

### Typography (`foundation/04-type.html`)

- **Inter** (loaded from `https://rsms.me/inter/inter.css` with OpenType variants `cv11`, `ss01`, `ss03` enabled at the body level) for prose; **JetBrains Mono** for token names, metadata, code, and "engineered" eyebrow labels.
- **10-step scale**: `2xs` (10px) → `5xl` (48px+), with `clamp()` used aggressively in hero headings (e.g. `clamp(48px, 6vw, 88px)`).
- **6 weights** exposed (light → extrabold), all used. Hero headlines lean on 800 weight, line-height 0.92–0.95, letter-spacing −0.035em — the heaviest, tightest typography this team uses anywhere.
- The **mono-eyebrow pattern** (uppercase, 11px, letter-spacing 0.08em, color `text-muted`) appears on every page above section headings and is the single most recognisable typographic signature of the visual language.

### Spacing / density (`foundation/05-spacing.html`)

- **Base unit 0.25rem** with named steps `space-0` through `space-24`. Half-steps at 0.5 and 1.5.
- **Three explicit density modes** demonstrated side-by-side (compact / default / touch) on the same component — clear visual proof that touch density meets the 44px minimum (`--hx-touch-target-min: 2.75rem`) and compact still passes a11y.
- Generous outer padding on cards (`64px`/`80px`) — this is presentation-deck spacing, not production-app spacing.

### Layout

- **Iframe shell pattern** (`/Users/himerus/Downloads/dist/index.html`): 280px dark sidebar with section groups + numbered links + `aria-current="page"`, then a 44px stage bar with breadcrumb/title + "open in new tab" + keyboard hint, then the page iframe. Lightweight, opinionated, fast.
- **Floating pill switcher** (`assets/helix-shell.js`): a `position: fixed` toolbar pill in the bottom-right combining brand + theme toggles, persisted to localStorage (`helix-ds-theme`, `helix-ds-brand`). Applied immediately on load before paint to avoid FOUC. Uses `role="toolbar"` and dispatches `hx-theme-change` / `hx-brand-change` custom events.
- Foundation/component/pattern pages all share an **eyebrow + giant headline + lede** opening, then dense token tables / swatch grids / state matrices.

### Component patterns

- **Token tables** are uniformly `font-family: mono`, with the primitive token name on the left and the resolved hex / px on the right. Click-to-copy on swatches.
- **State matrices** (`/Users/himerus/Downloads/dist/components/07-buttons.html`) use a `forced-focus` / `forced-hover` / `forced-active` class trick to render every state in a static grid — useful for documentation since real `:hover` state can't be photographed.
- **Code samples** use a sunken surface (`--hx-color-surface-sunken`), mono font, and inline keyword highlighting via `.k` and `.v` classes.
- **Composition examples** ("scenes" page, `/Users/himerus/Downloads/dist/patterns/14-scenes.html`) show four full-page compositions (marketing / portal / settings / help) — the design-system equivalent of Storybook's "in context" stories.
- The **token playground** (`/Users/himerus/Downloads/dist/patterns/15-playground.html`) is a sticky-sidebar control panel + live components stage — sliders mutate `--play-radius` / `--play-pad-x` / colour pickers mutate `--hx-color-primary-500`, and every demo component reflows. This is the single most compelling artifact in the bundle and the most direct competitor to a Storybook Controls panel.

### Animation / motion

- Restrained. Tokens at `assets/helix-tokens.css:189-196`: `--hx-duration-fast: 100ms` / `normal: 200ms` / `slow: 300ms`, with three easings (`default`, `out`, `spring`).
- Hover transitions on swatches use `scale(1.04)` + `--hx-easing-spring` (visible on `foundation/03-colors.html:39`).
- Hero pages use static radial-gradient backdrops (`overview.html:14-25`) — no scroll animation, no parallax, no JS-driven entry effects.
- A `prefers-reduced-motion: reduce` clause exists in `apps/storybook/stories/Introduction.mdx:63-80` already; the bundle does not animate enough to need one but the discipline is correct.

### Accessibility posture (`patterns/13-a11y.html`)

- **Contrast matrix** with explicit AAA / AA / AA-large pills per token pair. This is the gold-standard reference doc for the contrast contract.
- **Focus rings** use `outline: 2px solid var(--hx-color-focus-ring)` with `outline-offset: 2px` — pure CSS, no box-shadow tricks, render correctly under `forced-colors`.
- **Multi-signal status badges** (`signal--ok` / `signal--warn` / `signal--err`) carry both colour and a leading dot, and the "don't rely on color" demo on the same page shows icon + text alternatives.
- 44px touch target visualisation matches WCAG 2.5.5.

### Honest assessment

**Worth adopting wholesale:**
- Mono-eyebrow pattern above every section.
- Inline contrast-ratio annotation on every surface token card.
- Three-mode (`light` / `dark` / `high-contrast`) theme switcher persisted to localStorage and applied pre-paint.
- Brand registry shape (`[data-brand='...']` swapping only primitive ramps).
- Token playground as a Storybook story.
- State matrix using forced classes — solves the "you can't screenshot hover" problem in autodocs.

**Worth adapting:**
- The 64–80px outer padding is too much for an in-iframe Storybook canvas; cut to `--hx-space-8` (32px).
- The fixed-position floating pill conflicts with Storybook's own toolbar — use Storybook's globalTypes / `addon-themes` instead and wire it to the same `data-theme` attribute.
- Hero typography (`clamp(56px, 8vw, 128px)`) is presentation-deck scale; the docs tab is a reading surface and should max out around `4xl`/`5xl`.

**Worth leaving:**
- The iframe-shell index page itself is reinventing what Storybook's manager UI already provides for free.
- The `hx-shell.js` bottom-right pill — Storybook's toolbar is the right home for theme switching.
- Inline `<style>` blocks per page — fine for a static review bundle, antipattern in MDX where the addon-docs CSS reset has to be fought (`apps/storybook/stories/Introduction.mdx:7-23` already shows this fight).

This is **not** Anthropic's "Claude Design" team output. The user's "I'm not the biggest fan, but still" comment lines up with what's there: it's a competent first cut at presenting helix to non-engineering reviewers, but it tries to do too much chrome and not enough docs work. The Storybook chrome already exists, free, with vastly more functionality. Mine the foundation pages for visual language; keep Storybook as the chrome.

---

## 1.5 Treatment decision (locked 2026-05-06)

**Option A: port the dist pages into MDX wholesale.** Lift HTML+CSS into Storybook MDX, replace asset paths with imports, swap mocked component HTML for real `hx-*` components, drive the editorial pages from the same theme switcher and tokens that drive the components themselves. Adopt full Storybook idioms — the bundle's own `helix-shell.js` toolbar pill is replaced by Storybook's toolbar, the iframe-shell index is replaced by Storybook's manager UI, the brand+theme `data-*` swap moves into `addon-themes`.

Why not B (iframe the static dist pages): two sources of truth forever (iframe markup ages independently of token changes), demos use static HTML rather than real components, and the iframe shell duplicates Storybook's own chrome.

Why not C (hybrid): foundations + components share the same visual idioms (eyebrow, section-head, mono-meta, contrast cards) — splitting them across iframe vs MDX leaves us maintaining the idioms in two places.

### 15 dist pages → Storybook primary pages

| Dist page | Storybook home | Treatment |
|---|---|---|
| `01-overview` | `Docs/Overview` (rewrites `Introduction.mdx`) | MDX with eyebrow + stat cards |
| `02-brand` | `Foundations/Brand registry` | MDX with live brand switcher (extends `addon-themes`) |
| `03-colors` | `Foundations/Color` (replaces `tokens/Colors.mdx`) | MDX using shared `<TokenSwatchGrid>` + `<SurfaceCard>` blocks |
| `04-type` | `Foundations/Typography` (replaces `tokens/Typography.mdx`) | MDX |
| `05-spacing` | `Foundations/Spacing & Density` (replaces `tokens/Spacing.mdx`) | MDX |
| `06-iconography` | `Foundations/Iconography` | MDX |
| `07-buttons` | `Components/Button` Docs tab | Force-state matrix becomes shared `<StateMatrix>` block, applied via custom autodocs template |
| `08-forms` | `Patterns/Forms` | MDX composition story |
| `09-feedback` | `Patterns/Feedback` | MDX |
| `10-data-display` | `Patterns/Data display` | MDX |
| `11-patterns` | `Patterns/Empty · Error · Search · Confirm · Wizard` | MDX |
| `12-layout` | `Foundations/Layout` | MDX |
| `13-a11y` | `Accessibility/Overview` (pairs with VPAT page) | MDX, contrast matrix is the AAA-cert dashboard |
| `14-scenes` | `Patterns/Scenes` | MDX with iframe escape hatches for full-page compositions |
| `15-playground` | `Playground/Tokens` | Story (not MDX) — live controls drive `--hx-*` overrides |

### Mining inventory (idioms to lift)

- **Editorial hero**: `clamp(48px, 6vw, 96px)` weight 800 line-height 0.95 letter-spacing -0.035em — `<EyebrowHeading>` shared component
- **6/4 column split header**: content-left, lede-right — `<SplitHeader>` shared component
- **Mono eyebrow**: 11px uppercase letter-spacing 0.08em — CSS class `.hx-docs-eyebrow`
- **Section-head + mono-meta**: h2 baseline-aligned with `--hx-color-{role}-{50…950}` annotation, divider underneath — `<SectionHead title="..." meta="..." />`
- **Stat cards**: 38px tabular numerals, mono sublabel, surface-raised — `<StatCard num="..." label="..." sub="..." />`
- **Ratio matrix**: AAA/AA/AA-large pills, contrast as headline number — `<RatioCard pair={...} ratio={...} grade={...} />`
- **Force-state classes**: `.force-hover` `.force-active` `.force-focus` visually cheats interactive states — solves the "can't screenshot hover" problem in static autodocs
- **Card-with-demo**: title/tag/p + dashed `.demo` zone — `<DocsCard title="..." tag="..." demo={...} />`
- **`color-mix(in oklch, ...)` tinted variants** — used inline in MDX, no shared abstraction needed
- **Spring-eased hover**: `transform: scale(1.04)` with `--hx-easing-spring` — single CSS class
- **Numbered sidebar**: 01-overview, 02-brand, 03-colors... — encoded in `preview.ts` `options.storySort.order` array

### Force-state CSS module

The `.force-hover` / `.force-active` / `.force-focus` trick from `dist/components/07-buttons.html` lifts as a single shared stylesheet at `apps/storybook/.storybook/docs/force-states.css`, imported once in `preview-head.html`. Each component's own `.styles.ts` already encodes its hover/active/focus styles via `:hover` / `:active` / `:focus-visible` — the force-state CSS just bumps the same rule precedence onto the static `.force-*` classes. ~30 lines total.

---

## 2. Helix Storybook current state

### Versions and addons (`apps/storybook/package.json`)

- **Storybook 10.2.8** (current latest as of writing).
- **Framework**: `@storybook/web-components-vite@^10.2.8`.
- **Addons installed and wired** (`apps/storybook/.storybook/main.ts:12-18`):
  - `@storybook/addon-a11y@^10.2.8` — axe-core panel, color-contrast rule explicitly enabled (`apps/storybook/.storybook/preview.ts:45-56`).
  - `@storybook/addon-docs@^10.2.8` — autodocs, MDX, ToC.
  - `@storybook/addon-vitest@^10.2.8` — story-level test integration via `setProjectAnnotations` (`apps/storybook/.storybook/vitest.setup.ts:1-22`).
  - `@storybook/addon-links@^10.2.8`.
  - `@storybook/addon-themes@^10.2.8` — wired via `withThemeByDataAttribute` in `apps/storybook/.storybook/preview.ts:80-88` to swap `data-theme` between `light` and `dark`.
- **Not installed**: `addon-viewport`, `addon-measure`, `addon-outline`, `addon-actions`, `addon-controls` (latter is bundled in Storybook 10 core).

### Theming and token wiring

- `@helixui/tokens/tokens.css` is imported at the top of `apps/storybook/.storybook/preview.ts:1` so every story gets the full primitive + semantic + component cascade.
- `setCustomElementsManifest(customElements)` in `preview.ts:11` wires the CEM into autodocs, so component property/event/slot/CSS-part tables populate automatically from the manifest.
- The theme switcher (`preview.ts:80-87`) currently exposes only `light` and `dark`. **No high-contrast mode wired**, despite the tokens CSS file at `packages/hx-tokens/dist/tokens.css` defining `[data-theme='high-contrast']` overrides identical to the bundle.
- The theme attribute used is `data-theme`, **not** `data-hx-theme` as referenced in CLAUDE.md. The token file's selectors use `data-theme`; no rename needed — the original task description was slightly off.

### Manager (Storybook chrome) theme

- `apps/storybook/.storybook/manager.ts:1-33` defines a `helixTheme` via `storybook/theming.create()` with hardcoded hex colours (`colorPrimary: '#2563EB'`, `appBg: '#f8f9fa'`, `appContentBg: '#ffffff'`, `appBorderRadius: 6`).
- These are **not** sourced from `@helixui/tokens` and do **not** track theme changes — switching the preview to dark leaves the manager UI stuck on light.
- `colorPrimary: '#2563EB'` is also wrong: helix's actual primary is `#0F7078` (`packages/hx-tokens/dist/tokens.css` primary-600 from the bundle review).

### Preview-head and global decorators

- `apps/storybook/.storybook/preview-head.html` preconnects to Google Fonts and loads Inter weights 300/400/500/600/700/900. Bundle uses 800 (extrabold) too — that weight is currently missing from the preconnect list.
- The bundle uses JetBrains Mono; the preview-head currently does not load it. Mono labels in stories will fall back to system mono.
- A global `2rem` padding decorator wraps every story (`apps/storybook/.storybook/preview.ts:75`) — ensures stories never render edge-to-edge.

### Docs setup

- **Autodocs**: enabled per-component via `tags: ['autodocs']` (visible on `packages/hx-library/src/components/hx-button/hx-button.stories.ts:13`).
- **Custom MDX**: `apps/storybook/stories/Introduction.mdx` (53KB, `apps/storybook/stories/Introduction.mdx`), 5 token MDX files under `apps/storybook/stories/tokens/` (Colors, Typography, Spacing, Borders, Shadows — averaging 20–34KB each), 3 component MDX files under `apps/storybook/stories/components/` (`hx-card`, `hx-form`, `hx-select`), and 1 Drupal best-practices doc.
- The token MDX pages already import live data from `@helixui/tokens` and `@helixui/tokens/utils` (`stories/tokens/Colors.mdx:4-12`) — `tokenEntries`, `darkTokenEntries`, `getColorSubgroups`, `resolveTokenRef`, `getTokenStats`. **The infrastructure for token-driven docs already exists**; the MDX is fighting the addon-docs CSS reset (`stories/Colors.mdx:38-56` `all: unset` battles) which is the same problem the dist bundle solves by escaping into iframes.
- Story-sort order is defined in `preview.ts:33-44` and is sensible.

### Gaps vs target

| Area | Current | Target |
|---|---|---|
| High-contrast mode | not exposed in switcher | `light` / `dark` / `high-contrast` |
| Manager chrome theme | hardcoded hex, light-only | sources from `@helixui/tokens`, follows preview |
| Manager primary colour | `#2563EB` (wrong) | `#0F7078` (`primary-600`) |
| Inter weight 800 | not preconnected | preconnect list extended |
| JetBrains Mono | not loaded | preconnect + load |
| Backgrounds | three hardcoded hex (`preview.ts:57-63`) | sourced from `surface.default`/`surface.raised`/`surface.sunken` |
| `addon-viewport` | missing | install for responsive testing |
| `addon-measure`, `addon-outline` | missing | install for layout debug |
| Token playground story | not present | port from `dist/patterns/15-playground.html` |
| State matrix story template | ad-hoc per component | shared decorator |
| Contrast annotations | only in token MDX | also on every component's autodocs |
| AAA cert badge in autodocs | not present | template slot |

---

## 3. Target state

### Storybook version

Stay on **10.2.x**, bump to whatever the latest patch is at execution time. No major-version migration is needed — 10.2.8 is current.

### A11y plugin set (final shape)

| Addon | Status | Reason |
|---|---|---|
| `@storybook/addon-a11y` | already installed | axe panel per story; opt in to AAA rules for P0 components |
| `@storybook/addon-themes` | already installed | extend from 2-mode to 3-mode (`light` / `dark` / `high-contrast`) |
| `@storybook/addon-vitest` | already installed | story-level tests; keep |
| `@storybook/addon-docs` | already installed | autodocs + MDX |
| `@storybook/addon-links` | already installed | cross-story navigation |
| `@storybook/addon-viewport` | **add** | responsive testing for layout components (drawer, navbar, table) |
| `@storybook/addon-measure` | **add** | spacing/density verification against the spacing scale |
| `@storybook/addon-outline` | **add** | layout debug, particularly useful for shadow-DOM wrappers |
| `@storybook/addon-actions` | **add** | event panel — `hx-click`, `hx-input`, `hx-change` event verification without writing `play()` blocks |

### Theme switcher contract

- Three modes: `light`, `dark`, `high-contrast`.
- Wired via `addon-themes` `withThemeByDataAttribute` to set `data-theme` on `<html>` (already the contract; keep it).
- The same attribute is read by `packages/hx-tokens/dist/tokens.css` and propagates through Shadow DOM via the inherited custom-property cascade — no per-component wiring needed.
- Manager chrome reads the same global and switches the `helixTheme` via `addons.setConfig` on every theme change (Storybook 10 supports manager-side theme reactivity through `addon-themes`).

### Color system in Storybook chrome

- Replace the hardcoded hex in `manager.ts` with values pulled from `@helixui/tokens` at build time (token JSON consumed by `manager.ts` — avoids drift).
- For runtime theme changes, ship a `helixManagerThemeLight` / `…Dark` / `…HighContrast` and switch via `addons.setConfig({ theme })` in a manager addon channel listener.

### Docs page treatment

- Adopt the **mono-eyebrow + bold headline** opening per autodocs and per MDX page.
- Adopt the **inline contrast-ratio annotation** on the token MDX swatch cards (already partially present via `getContrastColor` in `Colors.mdx:8`).
- Adopt the **token-driven swatch grid** from `dist/foundation/03-colors.html:186-207` as a shared MDX block.
- **Replace the `all: unset` reset war** in token MDX with a scoped CSS layer (`@layer hx-docs { ... }`) and a single shared stylesheet imported via `preview-head.html`.

---

## 4. Implementation plan (phased)

### Phase A — Storybook minor bump + a11y plugin completion (~2–3h)

Owner: `frontend-specialist` + `staff-software-engineer`.

1. Bump `storybook`, `@storybook/web-components-vite`, and every `@storybook/addon-*` to the latest patch in `apps/storybook/package.json`.
2. Add `@storybook/addon-viewport`, `@storybook/addon-measure`, `@storybook/addon-outline`, `@storybook/addon-actions` to `devDependencies` and to the `addons` array in `apps/storybook/.storybook/main.ts`.
3. In `apps/storybook/.storybook/preview.ts`:
   - Configure `viewport` parameters with helix's documented breakpoints.
   - Configure `actions` matchers for `hx-*` events (`{ argTypesRegex: '^hx-.*' }`).
   - Extend the existing `a11y.config.rules` array — keep the `color-contrast` rule on by default; add a per-story override pattern (`parameters.a11y.config.rules[].id = 'color-contrast-enhanced'` for AAA-cert components).
4. Run `pnpm --filter=@helixui/storybook run build` to confirm the upgrade compiles, then `pnpm --filter=@helixui/storybook run test` to verify VRT/vitest still passes.

Acceptance: `pnpm --filter=@helixui/storybook run build` exits 0, all 5 addons appear in the right rail, color-contrast rule shows results in the a11y panel.

### Phase B — Theming (manager + preview, three modes) (~2–3h)

Owner: `design-system-developer` + `frontend-specialist`.

1. Extend `withThemeByDataAttribute` in `apps/storybook/.storybook/preview.ts:80-88` to include `'high-contrast': 'high-contrast'`.
2. Add a `parameters.backgrounds` map sourced from `surface.default` / `surface.raised` / `surface.sunken` per mode (use CSS custom-property values at build time via the existing `@helixui/tokens` import).
3. Rewrite `apps/storybook/.storybook/manager.ts`:
   - Build three `create()` themes: `helixLightTheme`, `helixDarkTheme`, `helixHighContrastTheme`, each consuming token values from `@helixui/tokens` (a small `manager-theme.ts` helper that maps token JSON → Storybook theme keys).
   - Use a Storybook 10 manager-channel listener to call `addons.setConfig({ theme })` when the preview's `THEME_CHANGED` event fires.
4. Extend `apps/storybook/.storybook/preview-head.html`:
   - Add Inter weight 800 to the preconnected font URL.
   - Add JetBrains Mono preconnect + stylesheet (mirror `dist/assets/helix-tokens.css:5-6`).

Acceptance: switching theme in the toolbar updates **both** the preview canvas and the Storybook chrome simultaneously; high-contrast mode renders pure black/white with yellow focus rings; mono labels in autodocs render in JetBrains Mono.

### Phase C — Docs page redesign (~3–5h)

Owner: `storybook-specialist` + `design-system-developer`.

1. Create `apps/storybook/.storybook/docs/helix-docs.css` and import in `preview-head.html` inside an `@layer hx-docs` block — kills the per-MDX `all: unset` reset wars.
2. Build a small set of shared MDX components in `apps/storybook/stories/_components/`:
   - `<TokenSwatchGrid ramp="primary" />` — renders the 11-stop ramp with click-to-copy + computed-contrast badge per stop. Lifted from `dist/foundation/03-colors.html:186-207`.
   - `<SurfaceCard token="surface.default" pairedWith="text.primary" />` — renders a surface tile with inline contrast ratio (`19.6:1` style label). Lifted from `dist/foundation/03-colors.html:138-141`.
   - `<StateMatrix component="hx-button" variants={[...]} states={['rest','hover','active','focus','disabled']} />` — uses the `forced-*` class trick from `dist/components/07-buttons.html:67-76` so every state renders statically.
   - `<EyebrowHeading eyebrow="Color · primitive ramps" title="11 stops, AA-tuned, every ramp." />` — single component for the bundle's signature opening pattern.
3. Refactor `apps/storybook/stories/tokens/*.mdx` to use the new shared components — drops file size from ~30KB to ~5KB each, eliminates duplication.
4. Refactor `apps/storybook/stories/Introduction.mdx` to use `<EyebrowHeading>` + a small set of stat cards mirroring `dist/foundation/01-overview.html:229-246`. Keep the existing animated DNA hero behind `prefers-reduced-motion: reduce` (already correctly handled).
5. Refresh sidebar grouping in `preview.ts:33-44` to mirror the bundle's three sections (`Foundation` / `Components` / `Patterns`).

Acceptance: token MDX pages render the new shared blocks; `Introduction.mdx` opens with the eyebrow+stat-card pattern; no MDX file references `all: unset`.

### Phase D — Autodocs template (~2–3h)

Owner: `storybook-specialist` + `accessibility-engineer`.

1. Build `apps/storybook/.storybook/docs/HelixAutodocsTemplate.tsx` — a custom autodocs `Page` template (Storybook 10 supports `parameters.docs.page` as a React component for the docs tab, even in a web-components project).
2. Template structure:
   - **Eyebrow + headline** sourced from CEM `summary` and `tagName`.
   - **AAA cert badge slot** — renders a green pill if the component has earned the cert (read from a static `apps/storybook/.storybook/aaa-certified.json` registry; empty placeholder otherwise).
   - **Description** from CEM.
   - **Live primary story** (current Storybook behavior).
   - **Properties / events / slots / CSS parts / CSS custom properties** tables — already auto-generated by `setCustomElementsManifest`.
   - **Keyboard contract table** — sourced from a per-component `parameters.helix.keyboard` array (`{ key: 'Enter', action: 'Activate the button' }`).
   - **Forced-colors snapshot** — embedded `<iframe srcdoc="..." style="forced-color-adjust: none">` of the primary story rendered under `forced-colors: active` simulation.
   - **Contrast pairs used** — auto-extracted from the component's CEM `cssProperties` cross-referenced against the contrast registry.
3. Wire as the default docs page in `preview.ts` `parameters.docs.page`.
4. Apply incrementally: keep the legacy MDX docs for components that have custom MDX (`hx-card`, `hx-form`, `hx-select`); use the new template for everything else.

Acceptance: any `tags: ['autodocs']` component renders the new template with at least the eyebrow, AAA-badge slot, keyboard table, and contrast-pairs section populated. CEM-driven sections continue to populate.

### Phase E — Mining into `create-helix-app` scaffold (~2–3h, separate session)

Owner: `staff-software-engineer` + `storybook-specialist`.

1. Once helix Storybook stabilises, extract the `manager.ts`, `preview.ts`, `preview-head.html`, `helix-docs.css`, shared MDX components, and `HelixAutodocsTemplate` into a `@helixui/storybook-preset` package under `packages/`.
2. Update `create-helix-app`'s scaffolded Storybook to install and use the preset by default — figgy-generated sites inherit the same chrome, theme switcher, autodocs template, and shared MDX blocks.
3. Document the preset in `apps/docs/src/content/docs/storybook-preset.mdx`.

Acceptance: `create-helix-app my-test && cd my-test && pnpm dev:storybook` opens a Storybook with the helix chrome, three-mode switcher, and helix-shaped autodocs out of the box.

---

## 5. A11y plugin matrix

| Addon | Adds | Decision criterion |
|---|---|---|
| `@storybook/addon-a11y` | Per-story axe panel, configurable rules (WCAG 2.1 AA default + AAA opt-in via `parameters.a11y.config.rules`) | Already installed. **Gate `color-contrast` rule failures on PR** for components with AAA cert; keep informational for everything else. |
| `@storybook/addon-themes` | Toolbar theme switcher; sets `data-theme` on `<html>` so token cascade triggers; integrates with `parameters.backgrounds` | Already installed. Extend to 3-mode in Phase B. |
| `@storybook/addon-viewport` | Responsive testing presets | **Add**. Required for verifying layout components (`hx-drawer`, `hx-nav`, `hx-table`) at documented breakpoints. |
| `@storybook/addon-measure` | Hover any element to see padding/margin/border in pixels overlaid | **Add**. Lets reviewers verify against the spacing scale without DevTools. |
| `@storybook/addon-outline` | Keyboard-toggleable outlines on every element | **Add**. Useful for shadow-DOM debugging where DevTools' hover overlay is awkward. |
| `@storybook/addon-actions` | Event-log panel with auto-detected event handlers | **Add**. Replaces the `play()` event-listener boilerplate visible at `packages/hx-library/src/components/hx-button/hx-button.stories.ts:163-177` for human verification. |
| `@storybook/addon-vitest` | Story-level vitest tests, portable-stories integration | Already installed. **Keep** — it's the test runner for `pnpm --filter=@helixui/storybook run test`. |
| `@storybook/addon-docs` | Autodocs + MDX | Already installed. **Keep**, customise via `parameters.docs.page` in Phase D. |
| `@storybook/addon-links` | Story-to-story links | Already installed. **Keep**, used in MDX cross-references. |

**Gating policy** for `color-contrast`:
- **Block PR** when an AAA-certified component shows new contrast failures.
- **Informational** for non-certified components.
- Wired via the test-runner integration: `pnpm --filter=@helixui/storybook run test` runs portable stories through vitest with `@storybook/addon-a11y` configured to fail on `wcag2aaa` rules for components in `apps/storybook/.storybook/aaa-certified.json`.

---

## 6. Open questions

Before Phase A starts, confirm:

1. **Mining ratio from the bundle.** Resolved 2026-05-06 → **heavy adoption (Option A)**, see §1.5. All 15 pages port into MDX. Floating-pill switcher relocates to Storybook toolbar via `addon-themes` 3-mode wiring. Iframe-shell `index.html` replaced by Storybook's manager UI. Force-state classes lift as shared CSS module. Token playground becomes a real Storybook story driving `--hx-*` overrides via Controls.

2. **Storybook deployment target.** Currently `apps/storybook/vercel.json` exists, suggesting Vercel. Confirm vs Cloudflare Pages or GitHub Pages — affects build output dir conventions and headers.

3. **Versioned docs.** Single live URL or per-release snapshot? If per-release, this affects Phase E (`create-helix-app` preset would need to support a `versionLabel` parameter).

4. **A11y gate strictness.** Block PRs on:
   - `wcag21aa` failures on every story (current `addon-a11y` default behaviour is informational)?
   - `wcag21aa` failures only on AAA-certified components?
   - `wcag21aaa` failures on AAA-certified components only?
   - **Recommendation**: third option. AAA cert is a contract; failure should block. Non-certified components run axe informationally so issues surface without blocking velocity.

5. **Manager UI scope.** Should the manager also reskin (sidebar fonts, toolbar buttons, settings drawer) or only colours? Storybook 10's `theming.create()` is colours + a few fonts; deeper reskin requires a custom manager addon.

6. **Storybook chrome respecting `prefers-reduced-motion`.** The existing `Introduction.mdx` does the right thing; should the manager itself disable its own `addon-themes` switcher animation? Probably yes — confirm.

7. **JetBrains Mono via Google Fonts vs self-hosted.** The bundle uses Google Fonts CDN (`dist/assets/helix-tokens.css:6`). Storybook is internal-facing, so CDN is fine, but for consistency with `apps/docs` (Astro Starlight) we may want both to self-host via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`.

---

## Reference paths cited

**Bundle** (`/Users/himerus/Downloads/dist/`):
- `README.md` — bundle structure and conventions
- `index.html` — iframe shell pattern
- `assets/helix-tokens.css` — full 3-tier token cascade, dark + HC overrides, brand registry
- `assets/helix-shell.js` — floating-pill theme/brand switcher
- `foundation/01-overview.html` — hero pattern, stats grid, pillar cards
- `foundation/03-colors.html` — swatch grid, contrast annotations, status cards
- `foundation/04-type.html` — type scale presentation
- `foundation/05-spacing.html` — spacing scale, density modes
- `components/07-buttons.html` — state matrix, forced-state classes
- `patterns/13-a11y.html` — contrast matrix, focus rings, signal badges
- `patterns/15-playground.html` — live token playground

**Helix Storybook** (`/Volumes/Development/booked/helix/apps/storybook/`):
- `package.json` — Storybook 10.2.8, addons inventory
- `.storybook/main.ts` — addon registration, vite config
- `.storybook/preview.ts` — global decorators, theme switcher, a11y rules, story sort
- `.storybook/manager.ts` — manager chrome theme (hardcoded hex, light-only)
- `.storybook/preview-head.html` — font preconnect (Inter only, missing weight 800 + JetBrains Mono)
- `.storybook/manager-head.html` — same fonts as preview-head
- `.storybook/vitest.setup.ts` — portable-stories wiring
- `stories/Introduction.mdx` — current welcome page
- `stories/tokens/Colors.mdx` — token-driven color docs (uses `@helixui/tokens/utils`)
- `stories/components/{hx-card,hx-form,hx-select}.mdx` — custom component MDX

**Helix tokens package** (`/Volumes/Development/booked/helix/packages/hx-tokens/`):
- `dist/tokens.css` — published 3-tier cascade (consumed by Storybook)
- `src/utils.ts` — `getColorSubgroups`, `resolveTokenRef`, `getTokenStats`, `getContrastColor`, `isHexColor`

**Sample component story** (`/Volumes/Development/booked/helix/packages/hx-library/src/components/hx-button/`):
- `hx-button.stories.ts` — autodocs reference: argTypes shape, render block, `play()` interaction tests, kitchen-sink stories

---

**Total estimated effort:** Phases A–D = 9–14h. Phase E = 2–3h additional.
**Recommended sequencing:** A → B → C → D in series (each phase produces a shippable Storybook). E only after D stabilises and the patterns survive 1–2 weeks of real component development.
