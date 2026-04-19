---
'@helixui/library': patch
---

fix(ci): resolve vitest 3.x browser.instances merge bug in cross-browser workflow

The cross-browser CI matrix was failing with "The 4th item in browser.instances doesn't have it" because Vitest 3.x appends CLI `--browser.instances` onto the config's 3-engine array instead of replacing it. Switched to env-var-driven config (`BROWSER=<engine>`) and removed the CLI flag.

fix(ci): build @helixui/library before type-check in CI workflow

Turbo's `^build` dependency on the `type-check` task was not reliably honored on fresh CI runners, causing `@helixui/react`'s deep-path imports (`@helixui/library/components/*`, which resolve through the `exports` map to `dist/`) to fail with TS2306. Added an explicit `pnpm turbo run build --filter=@helixui/library` step before type-check.
