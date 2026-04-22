---
'@helixui/drupal-behaviors': patch
'@helixui/drupal-starter': patch
---

Unblock 3.0.0 release publish and drop Node 20 from all CI matrices.

- Replace `peerDependencies["@helixui/library"]` in `@helixui/drupal-behaviors` and `@helixui/drupal-starter` with `workspace:^`. pnpm rewrites this to `^3.0.0` at publish time; the old `^2.1.2 || ^3.0.0` range caused `ERR_PNPM_NO_MATCHING_VERSION` during `changesets version && pnpm install --no-frozen-lockfile` because 3.0.0 wasn't on npm yet.
- Drop Node 20 from `.nvmrc` (→22), root `package.json` engines, `packages/helixui-mcp/package.json` engines, and all GitHub Actions workflows (`ci.yml`, `publish.yml`, `release.yml`, `canary.yml`, `audit-batch-ci.yml`, `cross-browser.yml`). Node 20 reaches upstream EOL on 2026-04-30; this project standardizes on Node 22 LTS and Node 24 as the supported runtimes.
