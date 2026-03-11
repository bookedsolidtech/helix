# HELiX Developer Experience Audit — Enterprise Adoption Readiness

**Date:** 2026-03-11
**Auditor:** Claude Opus 4.6 (deep audit)
**Scope:** End-to-end developer consumption experience for enterprise teams

---

## Executive Summary

HELiX has **strong npm package infrastructure** with excellent tree-shaking, strict TypeScript, and comprehensive documentation (229+ pages). The library is production-ready for npm-based consumption in modern bundler environments.

However, **critical gaps exist** for enterprise adoption: CDN delivery is placeholder-only, 8 components exceed the 5KB gzip budget, no framework wrappers exist, the extension model is undocumented, and the total bundle (228KB gzipped) far exceeds the stated 50KB budget. Drupal integration documentation is comprehensive but references non-existent CDN bundles.

**Verdict:** Ready for early adopters using npm + modern bundlers. Not yet ready for enterprise-wide rollout across diverse technology stacks.

---

## Findings by Category

### 1. Installation Paths (npm vs CDN)

#### npm: STRONG

| Aspect | Status | Details |
|--------|--------|---------|
| Package published | OK | `@helixui/library@0.1.3`, `@helixui/tokens@0.1.2` on npm |
| ESM exports | OK | Per-component + barrel entry points |
| TypeScript types | OK | Full `.d.ts` with declaration maps |
| Install command | OK | `npm install @helixui/library` |

#### CDN: CRITICAL GAP

| Finding | Severity | Details |
|---------|----------|---------|
| No UMD/IIFE build | **P0** | Vite configured for `formats: ['es']` only. CDN consumers need a self-contained bundle. |
| `helix.bundled.js` doesn't exist | **P0** | Drupal docs reference `cdn.jsdelivr.net/npm/@helixui/library/dist/helix.bundled.js` — this file does not exist. |
| Placeholder CDN docs | **P1** | README says "CDN (placeholder — coming soon)" but Drupal installation guide treats it as available. |
| No externals-included variant | **P1** | ESM build externalizes Lit, @lit/*, floating-ui. CDN consumers need these bundled. |

**Recommendation:** Create a `dist/helix.bundled.js` IIFE build that includes Lit runtime. This is the #1 blocker for Drupal/CDN adoption.

---

### 2. Tree-Shaking

**Status: EXCELLENT**

Per-component imports are fully supported:
```javascript
// Optimal: only pulls hx-button code (~3.5KB gzipped)
import '@helixui/library/components/hx-button';
```

- 72 component entry points at `dist/components/hx-*/index.js`
- Each entry point is a thin re-export (~125 bytes)
- Actual implementation in `dist/shared/hx-*-[hash].js` chunks
- `sideEffects` field correctly declared in package.json
- Barrel import available but documented as heavier option

**One concern:** The `sideEffects` array includes `src/components/**/*.ts` and `dist/components/**/*.js`, which tells bundlers these files have side effects (custom element registration). This is correct behavior but means unused components imported via barrel won't be tree-shaken. The per-component import path solves this.

---

### 3. Bundle Size

**Status: BUDGET VIOLATIONS DETECTED**

#### Per-Component Budget (5KB gzipped max)

**8 components exceed the budget:**

| Component | Gzipped | Over by |
|-----------|---------|---------|
| hx-form | 7,298B | +2,178B (42%) |
| hx-date-picker | 7,185B | +2,065B (40%) |
| hx-combobox | 6,787B | +1,667B (32%) |
| hx-color-picker | 6,441B | +1,321B (26%) |
| hx-select | 6,097B | +977B (19%) |
| hx-time-picker | 5,849B | +729B (14%) |
| hx-prose | 5,313B | +193B (4%) |
| hx-file-upload | 5,173B | +53B (1%) |

#### Full Bundle Budget (50KB gzipped max)

**Total: 228KB gzipped — 4.6x over budget.**

The 50KB budget appears aspirational rather than achievable with 87 components. With 73 shared chunks averaging ~3.1KB gzipped each, the math doesn't work. Either:
- The budget needs revision (realistic: ~250KB for full bundle, ~50KB for a "starter" subset)
- Or the barrel import should be discouraged entirely in favor of per-component imports

**Recommendation:** Redefine the 50KB budget as applying to a "core starter set" (e.g., button, card, text-input, checkbox, radio, select). Keep the per-component 5KB budget and fix the 8 violations. Add a CI gate that blocks PRs introducing new violations.

---

### 4. Drupal Integration

**Status: DOCUMENTATION STRONG, INFRASTRUCTURE INCOMPLETE**

#### What exists (comprehensive):
- 12+ documentation pages covering Twig, Behaviors, Form API, lazy loading
- 6 test Twig templates (`testing/drupal/templates/`)
- `helix.libraries.yml` definition
- Boolean attribute handling guidance (critical for Twig)
- Drupal behaviors patterns with `hx-*` events

#### What's missing:

| Finding | Severity | Details |
|---------|----------|---------|
| CDN bundle required for Method 1 | **P0** | `helix.bundled.js` referenced in docs doesn't exist |
| Scope mismatch in docs | **P1** | Some docs reference `@helix/library` (old scope) instead of `@helixui/library` |
| Only 10 Twig templates | **P2** | 87 components but only 10 have example Twig files |
| No Drupal module published | **P2** | "Method 3: Drupal module" is referenced but doesn't exist |
| No per-component loading for CDN | **P2** | Only npm path supports tree-shaking; CDN is all-or-nothing |

**Recommendation:** The npm installation path for Drupal themes works today. Focus on creating `helix.bundled.js` for the CDN path, which is the most common Drupal integration pattern.

---

### 5. Component Extension Model

**Status: TECHNICALLY POSSIBLE, COMPLETELY UNDOCUMENTED**

Components export their classes, making inheritance technically possible:
```typescript
import { HelixButton } from '@helixui/library';

class BrandedButton extends HelixButton {
  // Works, but undocumented
}
customElements.define('branded-button', BrandedButton);
```

**Issues:**

| Finding | Severity | Details |
|---------|----------|---------|
| No extension documentation | **P1** | No guide on how to extend components |
| No guidance on composition vs inheritance | **P1** | Shadow DOM makes inheritance tricky (styles don't cascade). Enterprise teams need clear patterns. |
| CSS Parts are the intended API | **P2** | Parts and slots are well-documented but not framed as "extension points" |
| No "wrapper component" pattern docs | **P2** | The most common enterprise pattern (wrapping hx-button in brand-button) isn't documented |

**Recommended pattern to document:**
1. **Theming** (easiest): Override CSS custom properties at `--hx-*` level
2. **Composition** (recommended): Wrap HELiX components, pass through slots/properties
3. **Inheritance** (advanced): Extend class, override render/styles (with caveats)
4. **CSS Parts** (styling): Use `::part()` for targeted style overrides

---

### 6. Theming Workflow

**Status: WELL-ARCHITECTED, WELL-DOCUMENTED**

Three-tier token cascade works correctly:
```
Primitive (raw: #2563eb)
  → Semantic (--hx-color-primary-500)
    → Component (--hx-button-bg)
```

- 5 theming strategies documented (global, component, contextual, multi-tenant, instance)
- Dark mode via `data-theme="dark"` attribute + `prefers-color-scheme` media query
- Token package (`@helixui/tokens`) provides CSS, Lit, JS, and JSON formats
- CSS custom properties correctly pierce Shadow DOM

**Minor gaps:**

| Finding | Severity | Details |
|---------|----------|---------|
| No theme builder tool | **P3** | Enterprise teams would benefit from a visual token override tool |
| No theme migration guide | **P3** | How to go from default HELiX theme to "OurBrand" theme step-by-step |
| Token JSON schema undocumented | **P3** | `tokens.json` format not formally specified |

---

### 7. Framework Interoperability

**Status: DOCUMENTATION EXISTS, NO WRAPPERS**

Framework guides exist for: React, Vue, Angular, HTML/CDN, Drupal

**The core question:** Are wrappers needed?

| Framework | Works natively? | Friction points | Wrapper needed? |
|-----------|----------------|-----------------|-----------------|
| **Vanilla/HTML** | Yes | None | No |
| **Drupal/Twig** | Yes | Boolean attrs, CDN bundle | No |
| **Vue 3** | Yes | Minor: `v-bind` for boolean attrs | No |
| **Angular** | Yes | `CUSTOM_ELEMENTS_SCHEMA` required | No |
| **React 18** | Partial | Events need `useRef` + `addEventListener`; no JSX types | **Yes** |
| **React 19+** | Yes | Custom element support improved in React 19 | No |

**Findings:**

| Finding | Severity | Details |
|---------|----------|---------|
| No `@lit/react` wrappers | **P2** | React 18 users must manually bind events via refs. `@lit/react` would generate proper React components. |
| No JSX type declarations package | **P2** | TypeScript React projects get no autocomplete for `<hx-button>` in JSX |
| React 19 not mentioned in docs | **P3** | React 19 improved custom element support — docs should note this |

**Recommendation:** Create a `@helixui/react` wrapper package using `@lit/react`. This covers the largest framework audience and eliminates the most friction. Vue and Angular work natively.

---

### 8. Getting Started Experience

**Status: EXISTS BUT NEEDS POLISH**

**Current flow:**
1. `getting-started/installation.md` — prerequisites, clone, install
2. `getting-started/quick-start.md` — dev server, basic usage
3. `getting-started/project-structure.md` — monorepo overview

**Assessment for "mid-level developer in under 30 minutes":**

| Step | Time estimate | Friction |
|------|--------------|----------|
| Find docs | 2 min | OK — `helixui.dev` exists |
| Install | 3 min | OK — `npm install @helixui/library` |
| First component | 5 min | OK — HTML example is clear |
| Understand tokens | 10 min | Moderate — need to cross-reference token docs |
| Add to React app | 15+ min | HIGH — must figure out event binding, no JSX types |
| Add to Drupal | 15+ min | HIGH — CDN path broken, npm path requires build tooling |

**Findings:**

| Finding | Severity | Details |
|---------|----------|---------|
| No "zero to working" single-page guide | **P1** | Getting started is split across 3+ pages. Enterprise devs want a single runnable example. |
| No CodeSandbox/StackBlitz starter | **P1** | No one-click "try it now" experience |
| No copy-paste starter HTML | **P2** | Should have a complete `index.html` that works with just a `<script>` tag (requires CDN fix) |
| Getting started assumes monorepo contributor | **P2** | Quick start focuses on cloning the repo, not consuming the package |
| No framework-specific starters | **P2** | "Add to React", "Add to Vue", "Add to Drupal" quick starts missing |

---

## Prioritized Action Items

### P0 — Blocks Enterprise Adoption

1. **Create CDN-ready bundled build** (`helix.bundled.js`)
   - Add IIFE/UMD format to Vite config
   - Include Lit runtime, tokens, all components
   - Publish to jsDelivr via npm
   - **Why:** Drupal integration path is broken without this

2. **Fix scope references in documentation**
   - Search-replace `@helix/library` → `@helixui/library` across all docs
   - **Why:** Wrong package name in install instructions is a show-stopper

### P1 — Required for "enterprise-ready" claim

3. **Fix 8 bundle size budget violations**
   - hx-form, hx-date-picker, hx-combobox, hx-color-picker, hx-select, hx-time-picker, hx-prose, hx-file-upload
   - **Why:** Stated 5KB budget is a quality gate; violations undermine trust

4. **Revise full-bundle size budget**
   - 50KB for 87 components is unrealistic
   - Redefine as: 50KB "core set" + no per-component limit for full bundle
   - **Why:** Budget that can't be met is worse than no budget

5. **Create single-page getting started guide**
   - "Consumer" getting started (not contributor)
   - npm install → import → use → customize tokens
   - Under 30 minutes, testable by a mid-level dev

6. **Document component extension model**
   - Theming (CSS vars) → Composition (wrapping) → Inheritance (class extension)
   - Clear guidance on when to use each

7. **Create `@helixui/react` wrapper package**
   - Use `@lit/react` to generate proper React components
   - Include JSX type declarations
   - **Why:** React is the largest frontend framework; manual event binding is unacceptable friction

### P2 — Should fix before enterprise rollout

8. **Create CodeSandbox/StackBlitz starters** for npm, React, Vue, Drupal
9. **Expand Twig template coverage** from 10 to all common components
10. **Add CI bundle size gate** that blocks PRs exceeding per-component budget
11. **Publish Drupal module** (even if it's just a libraries.yml + loader script)
12. **Add framework-specific quick start pages** to docs

### P3 — Nice to have

13. Visual theme builder tool
14. Token JSON schema specification
15. React 19 custom element support noted in docs
16. Theme migration step-by-step guide
17. Bundle analyzer integration (bundlephobia badge, size-limit CI)

---

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| npm installation | 9/10 | Excellent exports map, types, tree-shaking |
| CDN installation | 2/10 | Placeholder only, blocks Drupal path |
| Documentation depth | 9/10 | 229 pages, comprehensive coverage |
| Getting started speed | 5/10 | Exists but contributor-focused, not consumer-focused |
| Drupal integration | 6/10 | Great docs, broken CDN path |
| Extension model | 3/10 | Possible but undocumented |
| Theming | 9/10 | Well-architected token cascade |
| Tree-shaking | 10/10 | Per-component imports, correct sideEffects |
| Framework interop | 6/10 | Works everywhere but React friction, no wrappers |
| Bundle discipline | 5/10 | Budget exists but 8 violations, total 4.6x over |
| TypeScript DX | 10/10 | Strict mode, full declarations, zero any |
| Test infrastructure | 8/10 | 73 test files, browser mode, a11y auditing |

**Overall: 6.8/10 — Strong foundation, critical gaps in CDN and consumption DX**

---

## Conclusion

The statement _"THIS is how web components are done on EVERY project"_ is **defensible for the technical implementation** — the component architecture, token system, TypeScript strictness, and documentation depth are genuinely enterprise-grade.

It is **not yet defensible for the consumption experience**. An enterprise team evaluating HELiX today would find:
- npm path works great (if using a bundler)
- CDN path is broken
- React integration requires manual work
- No quick "try it" experience
- Extension patterns are unclear

The gap between "great library" and "enterprise platform" is primarily in **distribution and onboarding**, not in code quality. The fixes are well-scoped and achievable.
