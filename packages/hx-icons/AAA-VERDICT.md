# Per-Library AAA Verdict — `@helixui/icons`

This document records the WCAG 2.2 AAA-relevant verdict for each icon
library bundled with `@helixui/icons`. The component itself
(`<hx-icon>`) is certed independently against WCAG 2.2 AAA — see
[`packages/hx-library/src/components/hx-icon/AAA-AUDIT.md`](../hx-library/src/components/hx-icon/AAA-AUDIT.md).
The verdicts below cover the dimensions only the *library* can change:
glyph contrast at minimum render size, forced-colors flow, and optical
sizing.

For the canonical machine-readable verdict, call
`iconLibraryAaaVerdict(name)` from `@helixui/icons`. The shape is
defined in [`src/aaa.ts`](./src/aaa.ts).

## Verdict shape

Every verdict is a triple of three states:

- **`'pass'`** — measured by `pnpm aaa:audit` and confirmed at the
  documented minimum render size.
- **`'fail'`** — measured below threshold; do not use the library
  below the documented minimum render size.
- **`'unknown'`** — no evidence on file. Returned for consumer
  libraries until they re-run the formal harness.

The three dimensions are:

1. **`contrast`** — WCAG 1.4.11 Non-text Contrast (3:1) on the rendered
   glyph at the documented minimum render size, against the document
   background.
2. **`forcedColors`** — Forced-colors mode (Windows High Contrast etc.)
   honors the glyph silhouette without information loss.
3. **`opticalSizing`** — Glyph silhouettes remain legible at the documented
   minimum render size; no thin lines disappear, no even-odd fills
   collapse below resolvable area.

---

## Library: `helix`

| Dimension       | Verdict | Notes                                                          |
| --------------- | ------- | -------------------------------------------------------------- |
| `contrast`      | pass    | All 32 glyphs cleared 3:1 at `hx-size="md"` (24px) and above.  |
| `forcedColors`  | pass    | Every glyph paints with `fill="currentColor"` only.            |
| `opticalSizing` | pass    | Min render size 12px (`hx-size="xs"`) clears the borderline glyph set documented below. |

**Paint mode:** `fill`
**Total glyphs:** 32 (`packages/hx-icons/dist/helix-names.json`)
**Sprite sheet:** `packages/hx-icons/dist/helix.svg`

### Borderline glyphs (use ≥16px when possible)

The harness flagged three helix glyphs whose silhouette is thin enough
that consumers should prefer `hx-size="md"` (24px) or larger when used
*standalone*. All three are safe at any size when contained in their
canonical host (e.g. `dot` inside `hx-radio` already meets the
host-component target-size and contrast obligations):

- **`dot`** — Single-pixel-area dot. Safe inside selection-control hosts;
  flag for standalone use below 16px.
- **`dash`** — Thin on the minor axis. Safe inside `hx-checkbox`'s
  indeterminate state (host enforces target size); flag for standalone use
  below 16px.
- **`star-outline`** — Even-odd ring may collapse below 16px. Recommend
  `hx-size="md"` (24px) minimum for standalone use.

### Recommended minimum render sizes per glyph

| Glyph          | Recommended min  | Rationale                                              |
| -------------- | ---------------- | ------------------------------------------------------ |
| `dot`          | 16px (`sm`)      | Single-pixel-area dot; below 16px the silhouette merges into the surrounding background |
| `dash`         | 16px (`sm`)      | Thin minor axis collapses below 16px                   |
| `star-outline` | 24px (`md`)      | Even-odd outline ring under-resolves below 24px        |
| All others     | 12px (`xs`)      | Cleared 3:1 contrast and silhouette at 12px            |

---

## Library: `fa-free`

| Dimension       | Verdict | Notes                                                                                |
| --------------- | ------- | ------------------------------------------------------------------------------------ |
| `contrast`      | pass    | FA Free Solid uniformly painted with `fill="currentColor"` — clears 3:1 at every size. |
| `forcedColors`  | pass    | `fill="currentColor"` flows naturally through CanvasText / ButtonText cascade.         |
| `opticalSizing` | pass    | Solid silhouettes legible at `hx-size="sm"` (16px) and above.                         |

**Paint mode:** `fill`
**Total glyphs:** 2000 (`packages/hx-icons/dist/fa-free-names.json`)
**Sprite sheet:** `packages/hx-icons/dist/fa-free-solid.svg`
**License / attribution:** CC BY 4.0 — see [`NOTICE.md`](./NOTICE.md).

### Borderline glyphs

None flagged for the FA Free Solid set in the Phase 4 audit. The Solid
tier is uniformly thick-stroke fill paint; FA Free's optical sizing
considerations fall to the Light, Regular, Thin, and Sharp tiers (FA Pro)
which are NOT bundled.

### Recommended minimum render sizes

| Glyph      | Recommended min | Rationale                                              |
| ---------- | --------------- | ------------------------------------------------------ |
| All glyphs | 16px (`sm`)     | Solid silhouettes legible at 16px and above            |

For standalone use below `hx-size="sm"`, prefer the curated `helix`
library (designed for the 12px `xs` cell).

---

## Consumer library obligation

A consumer registering a custom library via `registerIconLibrary()`
inherits **zero** AAA evidence by default. The
`iconLibraryAaaVerdict('your-lib')` lookup returns `undefined`, which
callers must treat as the `'unknown'` state across all three dimensions.

To opt into the surface, the consumer must:

1. Run the formal AAA audit harness against `<hx-icon library="your-lib">`
   stories rendered against the consumer's primary surface tokens.
2. Determine per-glyph borderline cases (or assert "no borderline
   glyphs" with evidence).
3. Document the verdict in a sibling AAA-VERDICT.md.
4. Re-export the verdict via the same shape — typically by composing a
   wrapper module that calls `iconLibraryAaaVerdict('your-lib')` and
   falls back to a hardcoded local verdict.

Phase 5 docs (`apps/docs/src/content/docs/iconography/`) will publish the
full consumer recipe.

---

## Re-certification triggers

This per-library verdict is invalidated when:

- The library's sprite sheet (`dist/helix.svg`, `dist/fa-free-solid.svg`)
  is regenerated from a different source set.
- A new glyph is added that has not been measured by the harness.
- The minimum render-size cell of `<hx-icon>` changes.
- The semantic icon color cascade (`--hx-icon-color`,
  `--hx-color-text-*`) changes value or fallback.

When any of the above happen, re-run `pnpm aaa:audit --component hx-icon`
and update both this file and the hardcoded verdicts in
[`src/aaa.ts`](./src/aaa.ts).
