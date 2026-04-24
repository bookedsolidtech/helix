# @helixui/drupal-behaviors

## 3.0.1

### Patch Changes

- Updated dependencies [36d5bde]
  - @helixui/library@3.1.0

  Note: the 3.1.0 release cycle initially published this package as `4.0.0` because changesets' default policy treats any peer-dependency update as a major bump. The bump was cosmetic — the peer range `^3.0.0` still satisfies `@helixui/library@3.1.0` and no API changed. `4.0.0` was unpublished from npm and this patch release (`3.0.1`) is the correct version. `.changeset/config.json` now sets `onlyUpdatePeerDependentsWhenOutOfRange: true` to prevent recurrence.

## 3.0.0

### Major Changes

- e4b79be: BREAKING: Drupal behaviors realigned with the `@helixui/library@3.0.0` canonical component API. Consumers attaching to these behaviors must verify their integrations against the updated surface.

  Changes:
  - Behaviors wired to the consolidated `FormMixin` event surface — the 15 form-associated library components now share a single event contract; behaviors listening for per-component events must migrate to the mixin-level events documented in `docs/UPGRADING-TO-3.md` §7
  - Component tag references corrected to match shipped element names (see commit `aef35b4c7`)
  - Behaviors now consume `accessible-label` attribute writes where they previously wrote `aria-label` (library renamed the public attribute)
  - Build pipeline added and types exported (FS-012) — package now ships type declarations under `dist/` for downstream TypeScript consumers

  Peer-dependency on `@helixui/library` is pinned to `^3.0.0` (rewritten from `workspace:^` at publish time). Consumers still on library 2.x must stay on `@helixui/drupal-behaviors@2.x`.

### Patch Changes

- 3d9a4b9: Unblock 3.0.0 release publish and drop Node 20 from all CI matrices.
  - Replace `peerDependencies["@helixui/library"]` in `@helixui/drupal-behaviors` and `@helixui/drupal-starter` with `workspace:^`. pnpm rewrites this to `^3.0.0` at publish time; the old `^2.1.2 || ^3.0.0` range caused `ERR_PNPM_NO_MATCHING_VERSION` during `changesets version && pnpm install --no-frozen-lockfile` because 3.0.0 wasn't on npm yet.
  - Drop Node 20 from `.nvmrc` (→22), root `package.json` engines, `packages/helixui-mcp/package.json` engines, and all GitHub Actions workflows (`ci.yml`, `publish.yml`, `release.yml`, `canary.yml`, `audit-batch-ci.yml`, `cross-browser.yml`). Node 20 reaches upstream EOL on 2026-04-30; this project standardizes on Node 22 LTS and Node 24 as the supported runtimes.

- Updated dependencies [1ae0509]
- Updated dependencies [a610bb7]
- Updated dependencies [aff17e8]
- Updated dependencies [373bf84]
- Updated dependencies [19e966b]
- Updated dependencies [c8a63a0]
- Updated dependencies [61911c1]
- Updated dependencies [50b36a3]
- Updated dependencies [ae1e6e8]
- Updated dependencies [49fdb6c]
- Updated dependencies [196094a]
- Updated dependencies [6d62cc2]
- Updated dependencies [9c8720f]
- Updated dependencies [fce3340]
- Updated dependencies [a0562c4]
- Updated dependencies [20d0129]
- Updated dependencies [700c329]
- Updated dependencies [d3f1d2a]
- Updated dependencies [04ddfae]
- Updated dependencies [2d16e9b]
- Updated dependencies [d830889]
- Updated dependencies [bfca244]
- Updated dependencies [3f6c595]
- Updated dependencies [1fb3e7a]
- Updated dependencies [91e00b4]
- Updated dependencies [9a8cafb]
- Updated dependencies [6b2500d]
- Updated dependencies [edee58a]
- Updated dependencies [5c36408]
  - @helixui/library@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [ba9c72d]
- Updated dependencies [97d75d9]
- Updated dependencies [56585b5]
- Updated dependencies [d6d2244]
- Updated dependencies [d887573]
- Updated dependencies [3c8937b]
  - @helixui/library@2.1.0

## 1.0.0

### Patch Changes

- de9ccbe: fix(hx-menu): repair drupal behavior hx-close integration, add max-height overflow scroll, add arrowleft submenu close event
  - Rewrite `hx-menu.behavior.js` to listen for the `hx-close` event dispatched by
    hx-menu instead of the no-op `menu.open = false` setter. Removes the redundant
    Escape keydown listener (hx-menu already fires hx-close on Escape). Adds optional
    trigger button `aria-expanded` toggle and focus-return on close.
  - Add `max-height: var(--hx-menu-max-height, 20rem)` and `overflow-y: auto` to the
    `.menu` rule in `hx-menu.styles.ts` so tall menus scroll instead of overflowing
    the viewport.
  - Add `@cssprop [--hx-menu-max-height=20rem]` doc annotation to `hx-menu.ts`.
  - Add `ArrowLeft` handler in `hx-menu-item._handleKeyDown` that dispatches
    `hx-item-submenu-close` (bubbles, composed) per the APG menu pattern.
  - Add `@fires hx-item-submenu-close` doc annotation to `hx-menu-item.ts`.
  - Add tests for max-height CSS, ArrowLeft event dispatch, and event properties.

- Updated dependencies [7641ef1]
- Updated dependencies [3bbe6a5]
- Updated dependencies [448c908]
- Updated dependencies [257cf7d]
- Updated dependencies [2d9d739]
- Updated dependencies [23f5f6f]
- Updated dependencies [4d85c91]
- Updated dependencies [bd97a70]
- Updated dependencies [262083c]
- Updated dependencies [8db97bd]
- Updated dependencies [5757017]
- Updated dependencies [0d22fe1]
- Updated dependencies [0a74c8c]
- Updated dependencies [670c553]
- Updated dependencies [923e9d1]
- Updated dependencies [1037809]
- Updated dependencies [2243d3c]
- Updated dependencies [91267a1]
- Updated dependencies [abb4de6]
- Updated dependencies [5c4e4c9]
- Updated dependencies [224884e]
- Updated dependencies [fd65331]
- Updated dependencies [727e99f]
- Updated dependencies [82bd233]
- Updated dependencies [6ceafc0]
- Updated dependencies [ff7bcfd]
- Updated dependencies [1f3791d]
- Updated dependencies [3b6017b]
- Updated dependencies [9c17779]
- Updated dependencies [de9ccbe]
- Updated dependencies [ba21f3f]
- Updated dependencies [5d9ccf7]
- Updated dependencies [917d707]
- Updated dependencies [3458dd0]
- Updated dependencies [d776f72]
- Updated dependencies [be9b080]
- Updated dependencies [984a6f6]
- Updated dependencies [64fd2fc]
- Updated dependencies [dad6c71]
- Updated dependencies [dd58277]
- Updated dependencies [dcf7a9c]
- Updated dependencies [e0ec673]
- Updated dependencies [27e5758]
- Updated dependencies [53ddf75]
- Updated dependencies [e0df165]
- Updated dependencies [87cdd7e]
- Updated dependencies [7f80a77]
- Updated dependencies [184d560]
- Updated dependencies [1f8eef7]
- Updated dependencies [0656b5f]
- Updated dependencies [cf0bc88]
- Updated dependencies [20d502c]
- Updated dependencies [af04577]
- Updated dependencies [4f5af84]
- Updated dependencies [c94a209]
- Updated dependencies [e0adb4e]
- Updated dependencies [281a09e]
- Updated dependencies [181876b]
- Updated dependencies [e89b4b9]
- Updated dependencies [3c48dba]
- Updated dependencies [31bab2a]
- Updated dependencies [9afb9c1]
- Updated dependencies [0660768]
- Updated dependencies [52868cd]
- Updated dependencies [8bf2c61]
- Updated dependencies [a6470e9]
- Updated dependencies [acb6076]
- Updated dependencies [1b587d2]
  - @helixui/library@2.0.0
