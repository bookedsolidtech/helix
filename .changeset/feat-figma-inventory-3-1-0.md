---
'@helixui/library': minor
---

feat(hx-library): figma inventory extractor from cem

introduces a deterministic extractor that transforms the custom elements
manifest into a figma-ready component inventory. the extractor walks the cem,
normalizes variant/state axes, applies tier overrides, and emits a stable
json document consumable by figma plugins and downstream design tooling.

- new script: `scripts/generate-figma-inventory.ts`
- new lib: `scripts/lib/extractor.ts` with full unit coverage
- config: `figma-tier-overrides.json` for per-component tier curation
- output: `figma-inventory.json` (snapshot artifact, regeneratable)
- tests: `scripts/__tests__/extractor.test.ts` (vitest scripts config)

no runtime/component changes. additive tooling only.
