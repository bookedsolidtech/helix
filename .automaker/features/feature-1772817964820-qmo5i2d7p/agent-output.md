
🔧 Tool: ToolSearch
Input: {
  "query": "select:Glob,Read,Bash,Agent,TodoWrite,Write,Edit,Grep",
  "max_results": 8
}
Let me start by exploring the hx-split-button component and understanding an existing component for reference patterns.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-split-button/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-button/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/index.ts"
}
Good - the component exists with all expected files. Let me read them all.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/AUDIT.md"
}
Now let me check the hx-menu-item component and the hx-button reference for patterns.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Arrow key navigation broken in menu",
      "status": "in_progress",
      "activeForm": "Fixing P0-01: Arrow key navigation in menu"
    },
    {
      "content": "Fix P1-03: Remove dead _primaryButton @query",
      "status": "pending",
      "activeForm": "Removing dead _primaryButton @query"
    },
    {
      "content": "Fix P1-04: Remove dead focused variable and void suppression",
      "status": "pending",
      "activeForm": "Removing dead focused variable"
    },
    {
      "content": "Fix P1-06: Danger story missing label binding",
      "status": "pending",
      "activeForm": "Fixing Danger story label binding"
    },
    {
      "content": "Fix P1-02: Negative outline-offset on menu item focus ring",
      "status": "pending",
      "activeForm": "Fixing negative outline-offset on menu item"
    },
    {
      "content": "Fix P1-05: Add keyboard cycling tests for multi-item menus",
      "status": "pending",
      "activeForm": "Adding keyboard cycling tests"
    },
    {
      "content": "Run build and verify",
      "status": "pending",
      "activeForm": "Running build and verification"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-menu/hx-menu-item.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-menu/hx-menu-item.styles.ts"
}
Good. I have a complete picture. The AUDIT.md documents 1 P0 and 6 P1 issues. Let me fix the CRITICAL and HIGH ones. The key issues:

1. **P0-01**: `_getMenuItems()` returns inner shadow elements but compares against `document.activeElement` (which is the host) — arrow key navigation broken
2. **P1-03**: Dead `_primaryButton` @query
3. **P1-04**: Dead `focused` variable with `void` suppression  
4. **P1-05**: Missing keyboard cycling tests
5. **P1-06**: Danger story missing label binding
6. **P1-02**: Audit references negative outline-offset but styles show `outline: none` with bg-color focus — not actually present in current code

Let me fix P0-01 first — the critical keyboard navigation bug.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "old_string": "  /**\n   * Returns the focusable inner button elements of enabled hx-menu-item children\n   * assigned to the `menu` slot.\n   */\n  private _getMenuItems(): HTMLElement[] {\n    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"menu\"]');\n    if (!slot) return [];\n\n    return slot\n      .assignedElements({ flatten: true })\n      .filter(\n        (el): el is HelixMenuItem =>\n          el.tagName.toLowerCase() === 'hx-menu-item' && !(el as HelixMenuItem).disabled,\n      )\n      .map(\n        (item) =>\n          item.shadowRoot?.querySelector<HTMLElement>('.menu-item') ??\n          item.shadowRoot?.querySelector<HTMLElement>('[role=\"menuitem\"]') ??\n          null,\n      )\n      .filter((el): el is HTMLElement => el !== null);\n  }",
  "new_string": "  /**\n   * Returns enabled hx-menu-item host elements assigned to the `menu` slot.\n   * Uses the host elements (not inner shadow elements) so that focus tracking\n   * via `document.activeElement` works correctly across shadow boundaries.\n   */\n  private _getMenuItems(): HelixMenuItem[] {\n    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"menu\"]');\n    if (!slot) return [];\n\n    return slot\n      .assignedElements({ flatten: true })\n      .filter(\n        (el): el is HelixMenuItem =>\n          el.tagName.toLowerCase() === 'hx-menu-item' && !(el as HelixMenuItem).disabled,\n      );\n  }"
}
Now fix the `_handleMenuKeydown` to use `document.activeElement` correctly (it now compares against host elements which is what `document.activeElement` returns):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "old_string": "  private _handleMenuKeydown(e: KeyboardEvent): void {\n    const items = this._getMenuItems();\n    if (items.length === 0) return;\n\n    const focused = this.shadowRoot?.activeElement as HTMLElement | null;\n    // The shadow activeElement is the menu panel; actual focus is in light DOM.\n    // Use document.activeElement to find which item has focus.\n    const lightActive = document.activeElement as HTMLElement | null;\n    const currentIndex = items.findIndex((item) => item === lightActive);\n\n    switch (e.key) {\n      case 'ArrowDown': {\n        e.preventDefault();\n        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;\n        items[next]?.focus();\n        break;\n      }\n      case 'ArrowUp': {\n        e.preventDefault();\n        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;\n        items[prev]?.focus();\n        break;\n      }\n      case 'Escape': {\n        e.preventDefault();\n        this._closeMenu();\n        this._triggerButton?.focus();\n        break;\n      }\n      case 'Home': {\n        e.preventDefault();\n        items[0]?.focus();\n        break;\n      }\n      case 'End': {\n        e.preventDefault();\n        items[items.length - 1]?.focus();\n        break;\n      }\n      default:\n        // Suppress the unused-variable warning for the focused variable\n        void focused;\n        break;\n    }\n  }",
  "new_string": "  private _handleMenuKeydown(e: KeyboardEvent): void {\n    const items = this._getMenuItems();\n    if (items.length === 0) return;\n\n    const currentIndex = items.findIndex((item) => item === document.activeElement);\n\n    switch (e.key) {\n      case 'ArrowDown': {\n        e.preventDefault();\n        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;\n        items[next]?.focus();\n        break;\n      }\n      case 'ArrowUp': {\n        e.preventDefault();\n        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;\n        items[prev]?.focus();\n        break;\n      }\n      case 'Escape': {\n        e.preventDefault();\n        this._closeMenu();\n        this._triggerButton?.focus();\n        break;\n      }\n      case 'Home': {\n        e.preventDefault();\n        items[0]?.focus();\n        break;\n      }\n      case 'End': {\n        e.preventDefault();\n        items[items.length - 1]?.focus();\n        break;\n      }\n      default:\n        break;\n    }\n  }"
}
Now fix P1-03 (remove dead `_primaryButton` @query) and P1-04 (already removed `focused` variable above):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "old_string": "  @query('.split-button__primary')\n  private _primaryButton!: HTMLButtonElement;\n\n  // ─── Internal State ───",
  "new_string": "  // ─── Internal State ───"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Arrow key navigation broken in menu",
      "status": "completed",
      "activeForm": "Fixing P0-01: Arrow key navigation in menu"
    },
    {
      "content": "Fix P1-03: Remove dead _primaryButton @query",
      "status": "completed",
      "activeForm": "Removing dead _primaryButton @query"
    },
    {
      "content": "Fix P1-04: Remove dead focused variable and void suppression",
      "status": "completed",
      "activeForm": "Removing dead focused variable"
    },
    {
      "content": "Fix P1-06: Danger story missing label binding",
      "status": "in_progress",
      "activeForm": "Fixing Danger story label binding"
    },
    {
      "content": "Fix P1-02: Negative outline-offset on menu item focus ring",
      "status": "completed",
      "activeForm": "Verified not present in current code — no fix needed"
    },
    {
      "content": "Fix P1-05: Add keyboard cycling tests for multi-item menus",
      "status": "pending",
      "activeForm": "Adding keyboard cycling tests"
    },
    {
      "content": "Run build and verify",
      "status": "pending",
      "activeForm": "Running build and verification"
    }
  ]
}
Fix P1-06 — Danger story missing label binding:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-split-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>\n      <hx-menu-item slot=\"menu\" value=\"archive\">Archive Record</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"flag\">Flag for Review</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"delete-all\">Delete All Related</hx-menu-item>\n    </hx-split-button>\n  `,\n};",
  "new_string": "  render: (args) => html`\n    <hx-split-button\n      variant=${args.variant}\n      hx-size=${args.size}\n      ?disabled=${args.disabled}\n      .label=${args.label}\n    >\n      <hx-menu-item slot=\"menu\" value=\"archive\">Archive Record</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"flag\">Flag for Review</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"delete-all\">Delete All Related</hx-menu-item>\n    </hx-split-button>\n  `,\n};"
}
Also fix the `MenuItemDisabled` story which has the same issue:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-split-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>\n      <hx-menu-item slot=\"menu\" value=\"save-draft\">Save as Draft</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"save-publish\" disabled>\n        Save &amp; Publish (Unavailable)\n      </hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"save-notify\">Save &amp; Notify Team</hx-menu-item>\n    </hx-split-button>\n  `,",
  "new_string": "  render: (args) => html`\n    <hx-split-button\n      variant=${args.variant}\n      hx-size=${args.size}\n      ?disabled=${args.disabled}\n      .label=${args.label}\n    >\n      <hx-menu-item slot=\"menu\" value=\"save-draft\">Save as Draft</hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"save-publish\" disabled>\n        Save &amp; Publish (Unavailable)\n      </hx-menu-item>\n      <hx-menu-item slot=\"menu\" value=\"save-notify\">Save &amp; Notify Team</hx-menu-item>\n    </hx-split-button>\n  `,"
}
Now fix P1-05 — add keyboard cycling tests:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Arrow key navigation broken in menu",
      "status": "completed",
      "activeForm": "Fixing P0-01: Arrow key navigation in menu"
    },
    {
      "content": "Fix P1-03: Remove dead _primaryButton @query",
      "status": "completed",
      "activeForm": "Removing dead _primaryButton @query"
    },
    {
      "content": "Fix P1-04: Remove dead focused variable and void suppression",
      "status": "completed",
      "activeForm": "Removing dead focused variable"
    },
    {
      "content": "Fix P1-06: Danger story missing label binding",
      "status": "completed",
      "activeForm": "Fixing Danger story label binding"
    },
    {
      "content": "Fix P1-02: Negative outline-offset on menu item focus ring",
      "status": "completed",
      "activeForm": "Verified not present in current code — no fix needed"
    },
    {
      "content": "Fix P1-05: Add keyboard cycling tests for multi-item menus",
      "status": "in_progress",
      "activeForm": "Adding keyboard cycling tests"
    },
    {
      "content": "Run build and verify",
      "status": "pending",
      "activeForm": "Running build and verification"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.test.ts",
  "old_string": "    it('Enter on primary button fires hx-click', async () => {",
  "new_string": "    it('ArrowDown cycles through menu items', async () => {\n      const el = await fixture<HelixSplitButton>(`\n        <hx-split-button>\n          Save Record\n          <hx-menu-item slot=\"menu\" value=\"a\">Item A</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"b\">Item B</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"c\">Item C</hx-menu-item>\n        </hx-split-button>\n      `);\n      // Open menu\n      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');\n      trigger?.click();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      // First item should be focused after open\n      const items = el.querySelectorAll('hx-menu-item');\n      expect(document.activeElement).toBe(items[0]);\n\n      // ArrowDown → second item\n      const menu = shadowQuery(el, '.split-button__menu');\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[1]);\n\n      // ArrowDown → third item\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[2]);\n\n      // ArrowDown wraps → first item\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[0]);\n    });\n\n    it('ArrowUp cycles through menu items in reverse', async () => {\n      const el = await fixture<HelixSplitButton>(`\n        <hx-split-button>\n          Save Record\n          <hx-menu-item slot=\"menu\" value=\"a\">Item A</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"b\">Item B</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"c\">Item C</hx-menu-item>\n        </hx-split-button>\n      `);\n      // Open menu\n      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');\n      trigger?.click();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      // ArrowUp from first item wraps to last\n      const menu = shadowQuery(el, '.split-button__menu');\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));\n      await el.updateComplete;\n      const items = el.querySelectorAll('hx-menu-item');\n      expect(document.activeElement).toBe(items[2]);\n\n      // ArrowUp → second item\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[1]);\n    });\n\n    it('Home key focuses first item, End key focuses last item', async () => {\n      const el = await fixture<HelixSplitButton>(`\n        <hx-split-button>\n          Save Record\n          <hx-menu-item slot=\"menu\" value=\"a\">Item A</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"b\">Item B</hx-menu-item>\n          <hx-menu-item slot=\"menu\" value=\"c\">Item C</hx-menu-item>\n        </hx-split-button>\n      `);\n      // Open menu\n      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');\n      trigger?.click();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      const menu = shadowQuery(el, '.split-button__menu');\n      const items = el.querySelectorAll('hx-menu-item');\n\n      // End → last item\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[2]);\n\n      // Home → first item\n      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));\n      await el.updateComplete;\n      expect(document.activeElement).toBe(items[0]);\n    });\n\n    it('Enter on primary button fires hx-click', async () => {"
}
Now let me also check that the `query` import is still correct after removing `_primaryButton` (the `query` decorator is still used for `_menuPanel` and `_triggerButton`):

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "limit": 55
}
Good — `query` is still used. Now let me check if `_menuPanel` is actually used anywhere:

🔧 Tool: Grep
Input: {
  "pattern": "_menuPanel",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "output_mode": "content"
}
`_menuPanel` is also dead code — only declared, never used. Let me remove it:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-split-button/packages/hx-library/src/components/hx-split-button/hx-split-button.ts",
  "old_string": "  // ─── Internal References ───\n\n  @query('.split-button__menu')\n  private _menuPanel!: HTMLElement;\n\n  @query('.split-button__trigger')\n  private _triggerButton!: HTMLButtonElement;",
  "new_string": "  // ─── Internal References ───\n\n  @query('.split-button__trigger')\n  private _triggerButton!: HTMLButtonElement;"
}
Now let me run the build to verify:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Arrow key navigation broken in menu",
      "status": "completed",
      "activeForm": "Fixing P0-01: Arrow key navigation in menu"
    },
    {
      "content": "Fix P1-03: Remove dead _primaryButton @query",
      "status": "completed",
      "activeForm": "Removing dead _primaryButton @query"
    },
    {
      "content": "Fix P1-04: Remove dead focused variable and void suppression",
      "status": "completed",
      "activeForm": "Removing dead focused variable"
    },
    {
      "content": "Fix P1-06: Danger story missing label binding",
      "status": "completed",
      "activeForm": "Fixing Danger story label binding"
    },
    {
      "content": "Fix P1-02: Negative outline-offset on menu item focus ring",
      "status": "completed",
      "activeForm": "Verified not present in current code — no fix needed"
    },
    {
      "content": "Fix P1-05: Add keyboard cycling tests for multi-item menus",
      "status": "completed",
      "activeForm": "Adding keyboard cycling tests"
    },
    {
      "content": "Run build and verify",
      "status": "in_progress",
      "activeForm": "Running build and verification"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1",
  "description": "Run lint, format check, and type check",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "tail -20 /Users/himerus/.claude/projects/-Volumes-Development-booked-helix--worktrees-feature-deep-audit-v2-hx-split-button/6314afae-4334-48e0-af9b-3a9859868797/tool-results/b593wkrhd.txt",
  "description": "Check end of verify output"
}
All verification passes — 0 errors. Let me also check the diff to confirm only intended files were changed:

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Check which files changed"
}
Only the 3 hx-split-button files were modified. Now let me run the tests for this component:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-split-button/hx-split-button.test.ts 2>&1 | tail -80",
  "description": "Run hx-split-button tests",
  "timeout": 120000
}
The test runner needs the library-specific config. Let me use the project's test command:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests",
  "timeout": 300000
}
All 3113 tests pass (79 test files). Let me confirm the split-button specific tests passed:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"split-button|menu-item\" | head -60",
  "description": "Filter split-button test results",
  "timeout": 300000
}
All split-button tests pass including the new keyboard cycling tests. Let me also grep for the new test names specifically:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"ArrowDown cycles|ArrowUp cycles|Home key\" | head -10",
  "description": "Verify new keyboard tests passed",
  "timeout": 300000
}
All 3 new keyboard cycling tests pass. Let me mark the final task complete:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Arrow key navigation broken in menu",
      "status": "completed",
      "activeForm": "Fixing P0-01: Arrow key navigation in menu"
    },
    {
      "content": "Fix P1-03: Remove dead _primaryButton @query",
      "status": "completed",
      "activeForm": "Removing dead _primaryButton @query"
    },
    {
      "content": "Fix P1-04: Remove dead focused variable and void suppression",
      "status": "completed",
      "activeForm": "Removing dead focused variable"
    },
    {
      "content": "Fix P1-06: Danger story missing label binding",
      "status": "completed",
      "activeForm": "Fixing Danger story label binding"
    },
    {
      "content": "Fix P1-02: Negative outline-offset on menu item focus ring",
      "status": "completed",
      "activeForm": "Verified not present in current code"
    },
    {
      "content": "Fix P1-05: Add keyboard cycling tests for multi-item menus",
      "status": "completed",
      "activeForm": "Adding keyboard cycling tests"
    },
    {
      "content": "Run build and verify",
      "status": "completed",
      "activeForm": "Running build and verification"
    }
  ]
}
<summary>
## Summary: Deep Audit v2: hx-split-button

### Changes Implemented

**P0-01 (CRITICAL) — Fixed arrow key navigation in menu:**
- `_getMenuItems()` now returns `HelixMenuItem` host elements instead of inner shadow DOM elements
- `document.activeElement` correctly matches against host elements, so `currentIndex` is no longer always `-1`
- Arrow keys now properly cycle through menu items

**P1-03 — Removed dead `_primaryButton` @query** (never referenced in any method)

**P1-04 — Removed dead `_menuPanel` @query** (also never referenced — discovered during audit)

**P1-04 — Removed dead `focused` variable and `void focused` suppression** (cleaned up in the `_handleMenuKeydown` rewrite)

**P1-05 — Added 3 new keyboard cycling tests:**
- ArrowDown cycles through items and wraps
- ArrowUp cycles in reverse and wraps
- Home/End key navigation

**P1-06 — Fixed Danger and MenuItemDisabled stories** missing `.label=${args.label}` binding (primary button had no accessible text)

**P1-02 — Investigated, no fix needed:** The audit referenced `outline-offset: -2px` on menu items, but the current styles use `outline: none` with background-color for focus indication. No negative offset exists.

### Files Modified
- `packages/hx-library/src/components/hx-split-button/hx-split-button.ts` — P0 fix, dead code removal
- `packages/hx-library/src/components/hx-split-button/hx-split-button.test.ts` — 3 new keyboard tests
- `packages/hx-library/src/components/hx-split-button/hx-split-button.stories.ts` — label binding fix

### Verification Status
- `npm run verify` — 0 errors (lint + format:check + type-check all pass)
- `npm run test:library` — **3113 tests pass** across 79 test files, including all new keyboard cycling tests
- `git diff --stat` — only 3 intended files changed

### Risks/Blockers Encountered
- None. All fixes were straightforward.

### Learnings
- When shadow DOM components slot children that themselves have shadow roots, `document.activeElement` returns the slotted host element, not the inner shadow element. Focus tracking must compare against hosts.
- The `HelixMenuItem.focus()` override correctly delegates to the inner `.menu-item` div, so calling `.focus()` on the host works correctly.

### Notes for Developer
- P2 items (i18n aria-labels, menu max-height, menu animation, standalone hx-menu-item story) were intentionally left unfixed per audit scope (CRITICAL + HIGH only).
- P1-01 (cross-shadow ARIA relationship) requires manual AT testing with NVDA/VoiceOver/JAWS — cannot be verified programmatically.
</summary>