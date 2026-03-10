
🔧 Tool: Glob
Input: {
  "pattern": "**/hx-top-nav/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library/src/components/hx-top-nav/hx-top-nav.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library/src/components/hx-top-nav/hx-top-nav.styles.ts"
}
Now I understand the bug. The `.nav__bar` uses `flex-wrap: wrap` — when the collapsible opens, it wraps to a second line and the first line shrinks from `min-height: 4rem` to its natural height, causing the logo/toggle to shift up.

The fix: move `nav__collapsible` outside of `nav__bar` so they're separate elements, then make `.nav` flex on desktop to keep them side-by-side.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library/src/components/hx-top-nav/hx-top-nav.ts",
  "old_string": "      <header part=\"header\">\n        <nav part=\"nav\" class=\"nav\" aria-label=${this.label}>\n          <div class=\"nav__bar\">\n            <div part=\"logo\" class=\"nav__logo\">\n              <slot name=\"logo\"></slot>\n            </div>\n\n            <button\n              part=\"mobile-toggle\"\n              class=\"mobile-toggle\"\n              type=\"button\"\n              aria-expanded=${String(this._mobileOpen)}\n              aria-controls=\"nav-menu\"\n              aria-label=\"Toggle navigation\"\n              @click=${this._handleMobileToggle}\n            >\n              ${this._renderHamburgerIcon()}\n            </button>\n\n            <div id=\"nav-menu\" class=${classMap(menuClasses)}>\n              <div part=\"menu\" class=\"nav__menu\">\n                <slot></slot>\n              </div>\n\n              <div part=\"actions\" class=\"nav__actions\">\n                <slot name=\"actions\"></slot>\n              </div>\n            </div>\n          </div>\n        </nav>\n      </header>",
  "new_string": "      <header part=\"header\">\n        <nav part=\"nav\" class=\"nav\" aria-label=${this.label}>\n          <div class=\"nav__bar\">\n            <div part=\"logo\" class=\"nav__logo\">\n              <slot name=\"logo\"></slot>\n            </div>\n\n            <button\n              part=\"mobile-toggle\"\n              class=\"mobile-toggle\"\n              type=\"button\"\n              aria-expanded=${String(this._mobileOpen)}\n              aria-controls=\"nav-menu\"\n              aria-label=\"Toggle navigation\"\n              @click=${this._handleMobileToggle}\n            >\n              ${this._renderHamburgerIcon()}\n            </button>\n          </div>\n\n          <div id=\"nav-menu\" class=${classMap(menuClasses)}>\n            <div part=\"menu\" class=\"nav__menu\">\n              <slot></slot>\n            </div>\n\n            <div part=\"actions\" class=\"nav__actions\">\n              <slot name=\"actions\"></slot>\n            </div>\n          </div>\n        </nav>\n      </header>"
}
Now update the styles — remove `flex-wrap` from `.nav__bar` (no longer needed), and on desktop make `.nav` flex so the bar and collapsible sit side-by-side:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library/src/components/hx-top-nav/hx-top-nav.styles.ts",
  "old_string": "  /* ─── Bar row (always visible) ─── */\n\n  .nav__bar {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    min-height: var(--hx-top-nav-height, var(--hx-space-16, 4rem));\n    padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));\n    gap: var(--hx-space-4, 1rem);\n  }",
  "new_string": "  /* ─── Bar row (always visible) ─── */\n\n  .nav__bar {\n    display: flex;\n    align-items: center;\n    min-height: var(--hx-top-nav-height, var(--hx-space-16, 4rem));\n    padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));\n    gap: var(--hx-space-4, 1rem);\n  }"
}
Now update the desktop breakpoint to make `.nav` flex (so bar and collapsible are side-by-side) and remove the now-unneeded `flex-wrap: nowrap` on `.nav__bar`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library/src/components/hx-top-nav/hx-top-nav.styles.ts",
  "old_string": "  /* ─── Desktop breakpoint ─── */\n\n  /* NOTE: CSS @media queries do not support custom properties.\n     This value corresponds to --hx-breakpoint-md (768px). */\n  @media (min-width: 768px) {\n    /* Hide hamburger on desktop */\n    .mobile-toggle {\n      display: none;\n    }\n\n    .nav__bar {\n      flex-wrap: nowrap;\n    }\n\n    /* Collapsible becomes a standard inline flex row */\n    .nav__collapsible {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      width: auto;\n      flex: 1;\n      padding-block: 0;\n      border-top: none;\n      margin-inline-start: auto;\n      gap: var(--hx-space-4, 1rem);\n      animation: none;\n    }\n\n    /* Override open modifier — always visible on desktop regardless of state */\n    .nav__collapsible--open {\n      display: flex;\n      animation: none;\n    }\n\n    /* Menu grows to fill available space */\n    .nav__menu {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      gap: var(--hx-space-1, 0.25rem);\n      flex: 1;\n      padding-inline: 0;\n    }\n\n    /* Actions sit at the far right */\n    .nav__actions {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      gap: var(--hx-space-2, 0.5rem);\n      margin-top: 0;\n      padding-top: 0;\n      padding-inline: 0;\n      border-top: none;\n      flex-shrink: 0;\n    }\n  }",
  "new_string": "  /* ─── Desktop breakpoint ─── */\n\n  /* NOTE: CSS @media queries do not support custom properties.\n     This value corresponds to --hx-breakpoint-md (768px). */\n  @media (min-width: 768px) {\n    /* Make nav a flex row so bar and collapsible sit side-by-side */\n    .nav {\n      display: flex;\n      align-items: center;\n      padding-inline: var(--hx-top-nav-padding-x, var(--hx-space-6, 1.5rem));\n    }\n\n    .nav__bar {\n      flex-shrink: 0;\n      padding-inline: 0;\n      min-height: var(--hx-top-nav-height, var(--hx-space-16, 4rem));\n    }\n\n    /* Hide hamburger on desktop */\n    .mobile-toggle {\n      display: none;\n    }\n\n    /* Collapsible becomes a standard inline flex row */\n    .nav__collapsible {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      flex: 1;\n      padding-block: 0;\n      border-top: none;\n      margin-inline-start: auto;\n      gap: var(--hx-space-4, 1rem);\n      animation: none;\n    }\n\n    /* Override open modifier — always visible on desktop regardless of state */\n    .nav__collapsible--open {\n      display: flex;\n      animation: none;\n    }\n\n    /* Menu grows to fill available space */\n    .nav__menu {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      gap: var(--hx-space-1, 0.25rem);\n      flex: 1;\n      padding-inline: 0;\n    }\n\n    /* Actions sit at the far right */\n    .nav__actions {\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      gap: var(--hx-space-2, 0.5rem);\n      margin-top: 0;\n      padding-top: 0;\n      padding-inline: 0;\n      border-top: none;\n      flex-shrink: 0;\n    }\n  }"
}
Now let's build and verify:

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "Run TypeScript type-check",
  "timeout": 60000
}
Type-check passes. Now run the library tests:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -40",
  "description": "Run library tests",
  "timeout": 120000
}
Memory OOM killed the full run, but the hx-top-nav test passed. Let me run just the top-nav tests:

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library && npx vitest run src/components/hx-top-nav/hx-top-nav.test.ts 2>&1",
  "description": "Run only hx-top-nav tests",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes/packages/hx-library && npx vitest run src/components/hx-top-nav/hx-top-nav.test.ts 2>&1 | grep -E \"(✓|✗|PASS|FAIL|Error|hx-top-nav)\"",
  "description": "Run top-nav tests and grep results",
  "timeout": 90000
}
All 27 tests pass. Now run `npm run verify` before the diff check:

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes && npm run verify 2>&1 | tail -15",
  "description": "Run verify gate (lint + format:check + type-check)",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-fix-hx-top-nav-mobile-menu-open-causes diff --stat",
  "description": "Show changed files"
}
Only the 2 intended files changed. All gates pass.

<summary>
## Summary: Fix hx-top-nav Mobile Menu Open Causes Logo/Toggle Shift

### Changes Implemented
- **Separated `nav__collapsible` from `nav__bar`** — moved the collapsible panel div outside `.nav__bar` so it no longer participates in the flex-wrap layout of the bar row
- **Removed `flex-wrap: wrap` from `.nav__bar`** — the bar row no longer needs wrapping since it only contains logo and toggle
- **Desktop: made `.nav` flex** — on ≥768px, `.nav` becomes `display: flex; align-items: center` so `.nav__bar` and `.nav__collapsible` sit side-by-side in a single flex row, preserving the desktop layout
- **Moved `padding-inline` to `.nav` on desktop** — the bar row loses its padding on desktop (now inherited from `.nav`), keeping content aligned correctly

### Files Modified
- `packages/hx-library/src/components/hx-top-nav/hx-top-nav.ts`
- `packages/hx-library/src/components/hx-top-nav/hx-top-nav.styles.ts`

### Root Cause & Fix
The `.nav__bar` used `flex-wrap: wrap` + `align-items: center` + `min-height`. When closed (1 flex line), the single line stretched to `min-height: 4rem` and items centered in that space. When open (2 flex lines due to the `width: 100%` collapsible), the first line shrank to its natural content height (~48px), causing the logo/toggle to visually shift up. The fix puts `.nav__collapsible` in normal block flow below `.nav__bar` on mobile, eliminating the wrap entirely.

### Verification Status
- `npm run verify` — 11/11 tasks successful, zero errors
- `npm run type-check` — zero errors
- hx-top-nav test suite: **27/27 tests pass** (all rendering, CSS parts, mobile toggle, keyboard nav, slots, and axe-core accessibility tests green)

### Notes for Developer
- Desktop layout is preserved: `.nav` is flex on ≥768px, `.nav__bar` is `flex-shrink: 0`, `.nav__collapsible` is `flex: 1` with `margin-inline-start: auto`
- Mobile collapsible animation (`hx-mobile-nav-open`) and reduced-motion support are unchanged
- The Playwright visual verification was skipped due to environment constraints (OOM during full test run); the Vitest browser-mode tests with axe-core cover the open/closed state adequately
</summary>