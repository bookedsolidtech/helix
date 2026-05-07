---
'@helixui/library': minor
---

AAA Tier 3 Phase A + B — canonical priority-tier classification + rich `helixMeta` schema in CEM and figma-inventory.

**New canonical artifact:** `packages/hx-library/src/p0-priority-tiers.json` — single source of truth for component prioritization. 43 P0 (interactive + healthcare-critical, AAA-cert obligation) / 11 P1 (data display + progress, AA-strict) / 23 P2 (indicators + structural, AA-inherited) / 4 exempt (utility primitives) = 81 components classified exactly once.

**New `helixMeta` schema in custom-elements.json** (renamed `cem-plugins/aaa-certified.mjs` → `cem-plugins/helix-metadata.mjs`, expanded from 1 tag to 21):

- `aaa.{certified, certifiedDate, criteria, auditUrl}` — accessibility cert posture
- `keyboardContract.{activate, navigate, dismiss, disabledSuppresses}` — APG-aligned keyboard semantics
- `ariaPattern`, `ariaPatternSource` — declarative APG pattern reference
- `forcedColorsSupported`, `screenReaderTested` — assistive-technology coverage
- `stability`, `since` — public API guarantees
- `formAssociated`, `themeAware`, `brandAware`, `composesWith` — capability surface
- `drupalSdcEligible`, `reactWrapperStatus`, `figma.{componentName, page}` — integration metadata
- `priorityTier` — auto-populated for all 81 components from p0-priority-tiers.json
- `phiHandles`, `clinicalContext` — healthcare-specific posture

Top-level `aaaCertified` and `aaaCertifiedDate` retained for back-compat with consumers reading the 3.5.0 schema.

**figma-inventory.json mirror:** every component entry now carries the helixMeta surface (aaa, keyboardContract, ariaPattern, themeAware, brandAware, formAssociated, priorityTier) so figgy reads one canonical artifact for every signal it needs.

**Validator:** `scripts/validate-cem.mjs` extended with metadata-completeness gates — every roster member must surface `helixMeta.priorityTier`; every `aaaCertified=true` must carry non-empty `helixMeta.aaa.criteria` + `helixMeta.aaa.auditUrl`.

**Cert toolkit:** `scripts/aaa-cert.mjs <component>` — single-command per-component certifier. Generates AAA-AUDIT.md, applies the full 18-tag JSDoc metadata block, updates the allowlist + VPAT row + CEM + figma-inventory in one signed commit. Dry-run mode for verification. Used in subsequent Phase C/D releases as components reach AAA cert.

**State of certs in 3.6.0:** zero components carry `aaaCertified=true` yet. The schema, classification, and toolkit ship in this release; per-component certifications populate in subsequent releases as Phase C/D land. `helixMeta.priorityTier` IS populated on all 81 components today.
