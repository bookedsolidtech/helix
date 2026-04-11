# @helixui/drupal-behaviors

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
