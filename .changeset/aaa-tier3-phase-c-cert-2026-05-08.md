---
'@helixui/library': minor
'@helixui/tokens': minor
'@helixui/react': minor
---

AAA Tier 3 Phase C — 5-component AAA cert + structural primary contrast fix.

**5 components AAA-certified** (`hx-button`, `hx-checkbox`, `hx-alert`, `hx-text-input`, `hx-dialog`). Each ships AAA-AUDIT.md, JSDoc helixMeta block, AAA-level axe tests, forced-colors VRT, and VPAT row promotion. Verified across the full **6 brands × 3 themes × 11 AAA criteria matrix** (522/0/468 pass/fail/skip — empirical evidence in `.reports/aaa-matrix-evidence.md`).

**A11y Status Card on every Storybook component page** (`apps/storybook/.storybook/docs/A11yStatusCard.tsx` + `HelixDocsPage.tsx`). Reads `helixMeta` from CEM, renders certified state, criteria chips, ARIA pattern + APG link, keyboard contract, capability badges, audit link, priority tier. AAA-cert'd components show "AAA Certified" with date + criteria; pending components show "AAA — Pending audit".

**Structural primary action token + 8-component re-bind:**

The previous Phase C cert relied on default Apex/light axe runs. Brand swap to Meridian/Lumen exposed a contrast gap — `text-on-primary` (neutral-900) on darker brand primary-500 stops landed at 1.88:1 (Meridian) — unreadable. Root cause: `text-on-primary` was over-loaded across two paint contracts (primary-500 direct vs action.primary.bg). Fixed by re-binding 8 components to consume the action.primary.bg/text-on-primary semantic pair, then shifting the token contract:

- `--hx-color-action-primary-bg`: primary-500 → primary-600 (AAA-large rest fill)
- `--hx-color-action-primary-bg-hover`: primary-600 → primary-700
- `--hx-color-action-primary-bg-active`: primary-700 → primary-800
- `--hx-color-text-on-primary`: neutral-900 → neutral-0 (white)

Components re-bound: hx-badge, hx-pagination, hx-checkbox, hx-date-picker, hx-toggle-button, hx-steps, hx-icon-button, hx-radio. hx-button INVERTED hover/active text repointed to neutral-900 primitive (since `text-primary` flips in dark mode and would regress the dark-on-light-primary-400 pair).

White-on-primary-600 verified across all 6 brands: Apex 5.82:1, Meridian 12.05:1, Lumen 7.10:1, Verdant 6.70:1, Signal 6.37:1, Ember 6.22:1 — all AAA-large compliant. Contrast report: **0 sub-AA pairs across light + dark + HC modes** (was 5).

**Storybook brand toolbar fix:** `apps/storybook/.storybook/docs/brand-overrides.css` `[data-brand="*"]` rules were silently disabled by `@layer hx-docs` wrapper — unlayered `:root` rules in `tokens.css` always win cascade priority over named layers. Unwrapped + promoted selectors to `:root[data-brand="*"]` for definitive specificity victory.

**Cert toolkit hardened:** `scripts/aaa-cert.mjs` round-1 P2 fixes — VPAT row matching, notes preservation, CEM staging order.

**State of the AAA cert claim**: 5/43 P0 components AAA-cert'd. VPAT v1.0 trigger at 30+ P0 cert (currently in Phase D queue). 38 P0 + 11 P1 + 23 P2 components remain on the roadmap.
