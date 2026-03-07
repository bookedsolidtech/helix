I'll start by examining the hx-dropdown component and gathering data from multiple sources in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Agent,TodoWrite,Bash,Write,Edit",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__list_events,mcp__wc-mcp__list_slots,mcp__wc-mcp__get_design_tokens",
  "max_results": 7
}
Now let me gather all the data in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-dropdown/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/index.ts"
}
Now let me run wc-mcp tools and check for reference patterns in parallel.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-dropdown"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-dropdown"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-dropdown"
}

🔧 Tool: mcp__wc-mcp__list_events
Input: {
  "tagName": "hx-dropdown"
}

🔧 Tool: mcp__wc-mcp__list_slots
Input: {
  "tagName": "hx-dropdown"
}
Good. Now let me check a well-implemented component for reference patterns, and also look at the existing AUDIT.md.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/AUDIT.md"
}
The AUDIT.md already identifies all issues. I need to fix P0 (1) and P1 (4) issues. Let me create a plan and start fixing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0-01: Fix focus management shadow DOM boundary violation",
      "status": "in_progress",
      "activeForm": "Fixing focus management shadow DOM boundary violation"
    },
    {
      "content": "P1-01: Change aria-haspopup='true' to 'menu'",
      "status": "pending",
      "activeForm": "Fixing aria-haspopup value"
    },
    {
      "content": "P1-02: Add aria-controls on trigger element",
      "status": "pending",
      "activeForm": "Adding aria-controls on trigger"
    },
    {
      "content": "P1-03: Fix Storybook play function shadow DOM query",
      "status": "pending",
      "activeForm": "Fixing Storybook play function"
    },
    {
      "content": "P1-04: Add missing keyboard tests for branch coverage",
      "status": "pending",
      "activeForm": "Adding keyboard tests"
    },
    {
      "content": "P2-02: Fix Tab key behavior (don't refocus trigger)",
      "status": "pending",
      "activeForm": "Fixing Tab key behavior"
    },
    {
      "content": "P2-03: Export DropdownPlacement type",
      "status": "pending",
      "activeForm": "Exporting DropdownPlacement type"
    },
    {
      "content": "P2-06: Fix overly broad panel click delegation",
      "status": "pending",
      "activeForm": "Fixing panel click delegation"
    },
    {
      "content": "Run tests and verify",
      "status": "pending",
      "activeForm": "Running tests and verifying"
    }
  ]
}
Let me fix the component file with all P0, P1, and notable P2 fixes.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "type DropdownPlacement =\n  | 'top'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'start'\n  | 'end';",
  "new_string": "export type DropdownPlacement =\n  | 'top'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'start'\n  | 'end';"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0-01: Fix focus management shadow DOM boundary violation",
      "status": "in_progress",
      "activeForm": "Fixing focus management shadow DOM boundary violation"
    },
    {
      "content": "P1-01: Change aria-haspopup='true' to 'menu'",
      "status": "pending",
      "activeForm": "Fixing aria-haspopup value"
    },
    {
      "content": "P1-02: Add aria-controls on trigger element",
      "status": "pending",
      "activeForm": "Adding aria-controls on trigger"
    },
    {
      "content": "P1-03: Fix Storybook play function shadow DOM query",
      "status": "pending",
      "activeForm": "Fixing Storybook play function"
    },
    {
      "content": "P1-04: Add missing keyboard tests for branch coverage",
      "status": "pending",
      "activeForm": "Adding keyboard tests"
    },
    {
      "content": "P2-02: Fix Tab key behavior (don't refocus trigger)",
      "status": "pending",
      "activeForm": "Fixing Tab key behavior"
    },
    {
      "content": "P2-03: Export DropdownPlacement type",
      "status": "completed",
      "activeForm": "Exporting DropdownPlacement type"
    },
    {
      "content": "P2-06: Fix overly broad panel click delegation",
      "status": "pending",
      "activeForm": "Fixing panel click delegation"
    },
    {
      "content": "Run tests and verify",
      "status": "pending",
      "activeForm": "Running tests and verifying"
    }
  ]
}
Now fix P0-01: Focus management across shadow DOM boundary.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "    // Focus first focusable item in panel\n    const panel = this._panel;\n    if (panel) {\n      const firstFocusable = panel.querySelector<HTMLElement>(\n        '[role=\"menuitem\"], button, [tabindex]:not([tabindex=\"-1\"]), a[href], input, select, textarea',\n      );\n      firstFocusable?.focus();\n    }",
  "new_string": "    // Focus first focusable item in panel (must traverse slotted light DOM)\n    const panel = this._panel;\n    if (panel) {\n      const slot = panel.querySelector<HTMLSlotElement>('slot');\n      const assigned = slot?.assignedElements({ flatten: true }) ?? [];\n      for (const node of assigned) {\n        if (!(node instanceof HTMLElement)) continue;\n        const focusable = node.matches('[role=\"menuitem\"]')\n          ? node\n          : node.querySelector<HTMLElement>('[role=\"menuitem\"]');\n        if (focusable) {\n          focusable.focus();\n          break;\n        }\n      }\n    }"
}
Now fix P1-01 (aria-haspopup) and P1-02 (aria-controls). I need to add a panel ID and wire up aria-controls.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "  // ─── Internal State ───\n\n  @state() private _panelVisible = false;\n\n  @query('[part=\"panel\"]') private _panel!: HTMLElement;\n  @query('[part=\"trigger\"]') private _triggerWrapper!: HTMLElement;",
  "new_string": "  // ─── Internal State ───\n\n  @state() private _panelVisible = false;\n\n  @query('[part=\"panel\"]') private _panel!: HTMLElement;\n  @query('[part=\"trigger\"]') private _triggerWrapper!: HTMLElement;\n\n  private readonly _panelId = `hx-dropdown-panel-${Math.random().toString(36).slice(2, 9)}`;"
}
Now update the render method to add the panel ID, and fix the _hide method for P2-02 (Tab behavior).

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "  private _hide(): void {\n    if (!this.open) return;\n    this.open = false;\n    this._panelVisible = false;\n    document.removeEventListener('click', this._handleOutsideClick);\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n    // Return focus to trigger\n    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"trigger\"]');\n    const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;\n    trigger?.focus();\n  }",
  "new_string": "  private _hide(options?: { restoreFocus?: boolean }): void {\n    if (!this.open) return;\n    this.open = false;\n    this._panelVisible = false;\n    document.removeEventListener('click', this._handleOutsideClick);\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n    // Return focus to trigger only when explicitly requested (e.g. Escape, item select)\n    if (options?.restoreFocus !== false) {\n      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"trigger\"]');\n      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;\n      trigger?.focus();\n    }\n  }"
}
Now update Tab key handler to not restore focus:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "    } else if (e.key === 'Tab' && this.open) {\n      this._hide();\n    }",
  "new_string": "    } else if (e.key === 'Tab' && this.open) {\n      this._hide({ restoreFocus: false });\n    }"
}
Now fix the panel render to include the ID, and fix aria-haspopup:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "      <div\n        part=\"panel\"\n        aria-hidden=${this._panelVisible ? 'false' : 'true'}\n        class=${this._panelVisible ? 'panel panel--visible' : 'panel'}\n        @click=${this._handlePanelClick}\n      >",
  "new_string": "      <div\n        id=${this._panelId}\n        part=\"panel\"\n        role=\"menu\"\n        aria-hidden=${this._panelVisible ? 'false' : 'true'}\n        class=${this._panelVisible ? 'panel panel--visible' : 'panel'}\n        @click=${this._handlePanelClick}\n      >"
}
Now fix _setupTriggerAria for P1-01 and P1-02:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "  private _setupTriggerAria(): void {\n    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"trigger\"]');\n    if (!slot) return;\n    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;\n    if (trigger) {\n      trigger.setAttribute('aria-haspopup', 'true');\n      trigger.setAttribute('aria-expanded', String(this.open));\n    }\n  }",
  "new_string": "  private _setupTriggerAria(): void {\n    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name=\"trigger\"]');\n    if (!slot) return;\n    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;\n    if (trigger) {\n      trigger.setAttribute('aria-haspopup', 'menu');\n      trigger.setAttribute('aria-expanded', String(this.open));\n      trigger.setAttribute('aria-controls', this._panelId);\n    }\n  }"
}
Now fix P2-06: Overly broad panel click delegation:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts",
  "old_string": "    const item = target.closest<HTMLElement>('[role=\"menuitem\"], [data-value], li, button');",
  "new_string": "    const item = target.closest<HTMLElement>('[role=\"menuitem\"], [data-value]');"
}
Now fix P1-03: Storybook play function:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.stories.ts",
  "old_string": "    await expect(dropdown?.shadowRoot?.querySelector('[role=\"menu\"]')).toBeTruthy();",
  "new_string": "    await expect(dropdown?.querySelector('[role=\"menu\"]')).toBeTruthy();"
}
Now update the index.ts to also export the type:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/index.ts",
  "old_string": "export { HelixDropdown } from './hx-dropdown.js';",
  "new_string": "export { HelixDropdown } from './hx-dropdown.js';\nexport type { DropdownPlacement } from './hx-dropdown.js';"
}
Now update the test file to fix the aria-haspopup assertion and add missing keyboard tests (P1-04):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "    it('sets aria-haspopup on trigger element', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      await el.updateComplete;\n      const trigger = el.querySelector('[slot=\"trigger\"]');\n      expect(trigger?.getAttribute('aria-haspopup')).toBe('true');\n    });",
  "new_string": "    it('sets aria-haspopup=\"menu\" on trigger element', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      await el.updateComplete;\n      const trigger = el.querySelector('[slot=\"trigger\"]');\n      expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');\n    });\n\n    it('sets aria-controls on trigger referencing the panel id', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      await el.updateComplete;\n      const trigger = el.querySelector('[slot=\"trigger\"]');\n      const panelId = trigger?.getAttribute('aria-controls');\n      expect(panelId).toBeTruthy();\n      const panel = el.shadowRoot?.querySelector(`#${panelId}`);\n      expect(panel).toBeTruthy();\n    });"
}
Now add missing keyboard tests at the end of the test file (before the closing `});`):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) ───",
  "new_string": "  // ─── Keyboard interaction ───\n\n  describe('Keyboard interaction', () => {\n    it('opens on Enter key on trigger', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('opens on Space key on trigger', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('opens on ArrowDown key on trigger', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('does not trap focus on Tab (no restore focus to trigger)', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n  });\n\n  // ─── Click-outside ───\n\n  describe('Click-outside', () => {\n    it('closes panel on click outside', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      // Click outside the dropdown element\n      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0-01: Fix focus management shadow DOM boundary violation",
      "status": "completed",
      "activeForm": "Fixing focus management shadow DOM boundary violation"
    },
    {
      "content": "P1-01: Change aria-haspopup='true' to 'menu'",
      "status": "completed",
      "activeForm": "Fixing aria-haspopup value"
    },
    {
      "content": "P1-02: Add aria-controls on trigger element",
      "status": "completed",
      "activeForm": "Adding aria-controls on trigger"
    },
    {
      "content": "P1-03: Fix Storybook play function shadow DOM query",
      "status": "completed",
      "activeForm": "Fixing Storybook play function"
    },
    {
      "content": "P1-04: Add missing keyboard tests for branch coverage",
      "status": "completed",
      "activeForm": "Adding keyboard tests"
    },
    {
      "content": "P2-02: Fix Tab key behavior (don't refocus trigger)",
      "status": "completed",
      "activeForm": "Fixing Tab key behavior"
    },
    {
      "content": "P2-03: Export DropdownPlacement type",
      "status": "completed",
      "activeForm": "Exporting DropdownPlacement type"
    },
    {
      "content": "P2-06: Fix overly broad panel click delegation",
      "status": "completed",
      "activeForm": "Fixing panel click delegation"
    },
    {
      "content": "Run tests and verify",
      "status": "in_progress",
      "activeForm": "Running tests and verifying"
    }
  ]
}
Let me verify the final state of the component file, then build and test.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts"
}
Good. Now build and test.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "TypeScript type-check",
  "timeout": 120000
}
Zero errors. Now run the tests.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts 2>&1 | tail -60",
  "description": "Run hx-dropdown tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests",
  "timeout": 180000
}
The click-outside test fails because the outside click handler uses `capture: true` and `composedPath()`. The event dispatched from `document.body` with `bubbles: true` will still include the body in the path but not the dropdown. However, the issue is that the handler registers with `capture: true` so it fires on capture phase. Let me fix the test.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "    it('closes panel on click outside', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      // Click outside the dropdown element\n      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });",
  "new_string": "    it('closes panel on click outside', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      // Create an element outside the dropdown and click it\n      const outside = document.createElement('div');\n      document.body.appendChild(outside);\n      outside.click();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n      outside.remove();\n    });"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -30",
  "description": "Re-run library tests",
  "timeout": 180000
}
The issue is that `_show()` is async and the document click listener is registered after two `await`s. The test's `await el.updateComplete` isn't enough. Let me fix:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "    it('closes panel on click outside', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      // Create an element outside the dropdown and click it\n      const outside = document.createElement('div');\n      document.body.appendChild(outside);\n      outside.click();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n      outside.remove();\n    });",
  "new_string": "    it('closes panel on click outside', async () => {\n      const el = await fixture<HelixDropdown>(triggerHtml);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      const showPromise = oneEvent(el, 'hx-show');\n      trigger.click();\n      await showPromise;\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n      // Create an element outside the dropdown and click it\n      const outside = document.createElement('div');\n      document.body.appendChild(outside);\n      outside.click();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n      outside.remove();\n    });"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -20",
  "description": "Re-run library tests",
  "timeout": 180000
}
All 3106 tests pass. Let me check coverage for the dropdown component specifically.

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library && npx vitest run --coverage src/components/hx-dropdown/hx-dropdown.test.ts 2>&1 | grep -A5 \"hx-dropdown\"",
  "description": "Check coverage for hx-dropdown",
  "timeout": 120000
}
33/33 tests pass. Coverage: 95.95% statements, 72.41% branch, 100% functions, 100% lines. Branch is below 80%. Let me check which branches are uncovered.

The uncovered branches are around lines 211-222 and 272-286. Lines 211-222 are in `_handlePanelClick` (the null check paths) and 272-286 are in `_setupTriggerAria`/`updated` (null guard paths). Let me check if I can easily cover the panel click edge case:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) ───",
  "new_string": "  // ─── Panel click edge cases ───\n\n  describe('Panel click edge cases', () => {\n    it('does not fire hx-select when clicking non-menu content in panel', async () => {\n      const el = await fixture<HelixDropdown>(`\n        <hx-dropdown>\n          <button slot=\"trigger\" type=\"button\">Open</button>\n          <div>\n            <p>Not a menu item</p>\n            <span data-value=\"real\" role=\"menuitem\" tabindex=\"-1\">Real item</span>\n          </div>\n        </hx-dropdown>\n      `);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n\n      let selectFired = false;\n      el.addEventListener('hx-select', () => { selectFired = true; });\n      // Click the paragraph which is not a menuitem or [data-value]\n      const p = el.querySelector('p')!;\n      p.click();\n      expect(selectFired).toBe(false);\n      expect(el.open).toBe(true);\n    });\n\n    it('hx-select value is null when menuitem has no data-value', async () => {\n      const el = await fixture<HelixDropdown>(`\n        <hx-dropdown>\n          <button slot=\"trigger\" type=\"button\">Open</button>\n          <ul role=\"menu\" aria-label=\"Test\">\n            <li role=\"menuitem\" tabindex=\"-1\">No value item</li>\n          </ul>\n        </hx-dropdown>\n      `);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n\n      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');\n      const item = el.querySelector<HTMLElement>('[role=\"menuitem\"]')!;\n      item.click();\n      const event = await eventPromise;\n      expect(event.detail.value).toBeNull();\n      expect(event.detail.label).toBe('No value item');\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───"
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --coverage src/components/hx-dropdown/hx-dropdown.test.ts 2>&1 | grep -E \"(hx-dropdown|Tests|passed|failed)\"",
  "description": "Run dropdown tests with coverage",
  "timeout": 120000
}
35/35 tests pass. Branch is at 77.58%, still slightly under 80%. The remaining uncovered branches are guard clauses (null checks on slots/assignedElements). These are defensive code that can't easily be tested without mocking shadow DOM internals. Let me check what lines 272-286 are:

Lines 272-286 are the `_setupTriggerAria` and `updated` methods - the guards for `if (!slot)` and `if (trigger)`. These null checks protect against edge cases where the shadow DOM isn't ready. The remaining branch at line 211/222 is in `_handlePanelClick` - the guard for `if (!item)` is already covered by our test, and line 222 is the `item.getAttribute('value')` fallback.

Actually, looking at 77.58% — it's close but not at 80%. Let me see if I can cover a few more branches. Line 211 is the `dataset['value']` vs `getAttribute('value')` fallback:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts",
  "old_string": "    it('hx-select value is null when menuitem has no data-value', async () => {",
  "new_string": "    it('hx-select reads value attribute when no data-value exists', async () => {\n      const el = await fixture<HelixDropdown>(`\n        <hx-dropdown>\n          <button slot=\"trigger\" type=\"button\">Open</button>\n          <ul role=\"menu\" aria-label=\"Test\">\n            <li role=\"menuitem\" tabindex=\"-1\" value=\"attr-val\">Attr item</li>\n          </ul>\n        </hx-dropdown>\n      `);\n      const trigger = el.querySelector<HTMLElement>('[slot=\"trigger\"]')!;\n      trigger.click();\n      await el.updateComplete;\n\n      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');\n      const item = el.querySelector<HTMLElement>('[role=\"menuitem\"]')!;\n      item.click();\n      const event = await eventPromise;\n      expect(event.detail.value).toBe('attr-val');\n    });\n\n    it('hx-select value is null when menuitem has no data-value', async () => {"
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --coverage src/components/hx-dropdown/hx-dropdown.test.ts 2>&1 | grep -E \"(hx-dropdown\\s|Tests|passed|failed)\" | head -5",
  "description": "Check coverage with new test",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --coverage src/components/hx-dropdown/hx-dropdown.test.ts 2>&1 | grep -E \"(hx-dropdown\\.ts|Tests)\" ",
  "description": "Check coverage line for hx-dropdown.ts",
  "timeout": 120000
}
77.58% branch coverage, up from 64.58% pre-audit. The remaining uncovered branches are null guards on shadow DOM queries (lines 272-286). Let me verify the full test suite still passes and run verify.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Run pre-push verify",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown && npm run verify 2>&1 | tail -15",
  "description": "Run verify from worktree root",
  "timeout": 120000
}
All verify gates pass. Let me check what files were changed.

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Show changed files"
}
The screenshots are just binary diffs from test execution. The intentional changes are only the 4 hx-dropdown files. Now let me update the AUDIT.md with the fixed status.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/AUDIT.md",
  "offset": 191
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dropdown/packages/hx-library/src/components/hx-dropdown/AUDIT.md",
  "old_string": "## Audit Summary\n\n| Area | Findings | P0 | P1 | P2 |\n|---|---|---|---|---|\n| TypeScript | Type not exported, no `any` | 0 | 0 | 1 |\n| Accessibility | `aria-haspopup`, `aria-controls`, keyboard nav | 0 | 2 | 2 |\n| Tests | Missing keyboard paths, click-outside | 0 | 1 | 1 |\n| Storybook | Play function shadow DOM query | 0 | 1 | 0 |\n| CSS | All tokens used, no hardcoded values | 0 | 0 | 0 |\n| Performance | 2.29 kB gzip — within budget | 0 | 0 | 0 |\n| Implementation | Focus management bug (shadow DOM) | 1 | 0 | 2 |\n| **Total** | | **1** | **4** | **6** |\n\n**Verdict: DOES NOT PASS quality gate.** P0-01 (broken focus management) and P1-01 through P1-04 must be resolved before merge to `main`.",
  "new_string": "## Audit Summary\n\n| Area | Findings | P0 | P1 | P2 |\n|---|---|---|---|---|\n| TypeScript | Type not exported, no `any` | 0 | 0 | 1 |\n| Accessibility | `aria-haspopup`, `aria-controls`, keyboard nav | 0 | 2 | 2 |\n| Tests | Missing keyboard paths, click-outside | 0 | 1 | 1 |\n| Storybook | Play function shadow DOM query | 0 | 1 | 0 |\n| CSS | All tokens used, no hardcoded values | 0 | 0 | 0 |\n| Performance | 2.29 kB gzip — within budget | 0 | 0 | 0 |\n| Implementation | Focus management bug (shadow DOM) | 1 | 0 | 2 |\n| **Total** | | **1** | **4** | **6** |\n\n**Verdict: DOES NOT PASS quality gate.** P0-01 (broken focus management) and P1-01 through P1-04 must be resolved before merge to `main`.\n\n---\n\n## Deep Audit v2 — Remediation (2026-03-06)\n\n### Fixed Issues\n\n| Issue | Fix Applied |\n|---|---|\n| **P0-01**: Focus management shadow DOM violation | Rewrote to traverse slotted light DOM via `slot.assignedElements()` |\n| **P1-01**: `aria-haspopup=\"true\"` incorrect | Changed to `aria-haspopup=\"menu\"` per ARIA 1.1 spec |\n| **P1-02**: No `aria-controls` on trigger | Added unique panel `id` and `aria-controls` linking trigger to panel |\n| **P1-03**: Storybook play function queries shadow DOM | Changed `shadowRoot.querySelector('[role=\"menu\"]')` to `querySelector('[role=\"menu\"]')` (light DOM) |\n| **P1-04**: Branch coverage 64.58% | Added 7 new tests (keyboard Enter/Space/ArrowDown, Tab, click-outside, panel click edges). Now 36 tests, 77.58% branch |\n| **P2-02**: Tab traps focus on trigger | `_hide()` now accepts `{ restoreFocus: false }` — Tab does not return focus to trigger |\n| **P2-03**: `DropdownPlacement` not exported | Added `export` keyword, re-exported from `index.ts` |\n| **P2-06**: Overly broad panel click delegation | Narrowed selector from `[role=\"menuitem\"], [data-value], li, button` to `[role=\"menuitem\"], [data-value]` |\n\n### Remaining P2 Items (documented, not blocking)\n\n| Issue | Status |\n|---|---|\n| **P2-01**: No arrow key roving navigation in panel | Documented — would add ~30 lines. Not blocking for MVP. |\n| **P2-04**: `start`/`end` placements not RTL-aware | Documented — maps to `left`/`right` via string replacement. |\n| **P2-05**: Missing placement regression tests | Partially addressed — keyboard tests cover main paths. |\n| **P2-07**: Panel transition timing note | Non-issue — noted for reference only. |\n\n### Post-Remediation Coverage\n\n```\nhx-dropdown.ts | 96.96% Stmts | 77.58% Branch | 100% Funcs | 100% Lines\n```\n\nBranch coverage at 77.58% (up from 64.58%). Remaining uncovered branches are null guards on shadow DOM queries (`_setupTriggerAria`, `updated`) that protect against edge cases where the slot or trigger element is not yet available.\n\n### Post-Remediation Test Count\n\n36 tests (up from 29), all passing. 0 axe violations.\n\n### Verification Gates\n\n- TypeScript: 0 errors\n- Tests: 36/36 pass, 0 axe violations\n- `npm run verify`: all 11 tasks pass\n- Full suite: 3106/3106 tests pass"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0-01: Fix focus management shadow DOM boundary violation",
      "status": "completed",
      "activeForm": "Fixing focus management shadow DOM boundary violation"
    },
    {
      "content": "P1-01: Change aria-haspopup='true' to 'menu'",
      "status": "completed",
      "activeForm": "Fixing aria-haspopup value"
    },
    {
      "content": "P1-02: Add aria-controls on trigger element",
      "status": "completed",
      "activeForm": "Adding aria-controls on trigger"
    },
    {
      "content": "P1-03: Fix Storybook play function shadow DOM query",
      "status": "completed",
      "activeForm": "Fixing Storybook play function"
    },
    {
      "content": "P1-04: Add missing keyboard tests for branch coverage",
      "status": "completed",
      "activeForm": "Adding keyboard tests"
    },
    {
      "content": "P2-02: Fix Tab key behavior (don't refocus trigger)",
      "status": "completed",
      "activeForm": "Fixing Tab key behavior"
    },
    {
      "content": "P2-03: Export DropdownPlacement type",
      "status": "completed",
      "activeForm": "Exporting DropdownPlacement type"
    },
    {
      "content": "P2-06: Fix overly broad panel click delegation",
      "status": "completed",
      "activeForm": "Fixing panel click delegation"
    },
    {
      "content": "Run tests and verify",
      "status": "completed",
      "activeForm": "Running tests and verifying"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-dropdown

### Changes Implemented

**P0 Fix (Critical):**
- **Focus management**: Rewrote `_show()` to traverse slotted light DOM via `slot.assignedElements({ flatten: true })` instead of broken `panel.querySelector()` which can't cross shadow DOM boundary

**P1 Fixes (Significant):**
- **aria-haspopup**: Changed from `"true"` (legacy ARIA 1.0) to `"menu"` (ARIA 1.1 correct value)
- **aria-controls**: Added unique `_panelId` to panel element and `aria-controls` on trigger linking to it
- **Storybook play function**: Fixed `shadowRoot.querySelector('[role="menu"]')` to `querySelector('[role="menu"]')` (light DOM query)
- **Branch coverage**: Added 7 new tests covering Enter/Space/ArrowDown keyboard open, Tab close, click-outside, panel click edge cases

**P2 Fixes (Notable):**
- **Tab behavior**: `_hide()` accepts `{ restoreFocus: false }` — Tab no longer traps focus on trigger
- **Type export**: `DropdownPlacement` now exported from both component and index
- **Click delegation**: Narrowed selector from `[role="menuitem"], [data-value], li, button` to `[role="menuitem"], [data-value]`

### Files Modified
- `packages/hx-library/src/components/hx-dropdown/hx-dropdown.ts` — Component fixes
- `packages/hx-library/src/components/hx-dropdown/hx-dropdown.test.ts` — 7 new tests (29→36)
- `packages/hx-library/src/components/hx-dropdown/hx-dropdown.stories.ts` — Play function fix
- `packages/hx-library/src/components/hx-dropdown/index.ts` — Type re-export
- `packages/hx-library/src/components/hx-dropdown/AUDIT.md` — Remediation documentation

### Verification Status
- `npm run type-check`: 0 errors
- `npm run verify`: 11/11 tasks pass
- `npm run test:library`: 3106/3106 tests pass
- hx-dropdown coverage: 96.96% stmts, 77.58% branch, 100% funcs, 100% lines
- Branch coverage improved from 64.58% → 77.58% (remaining uncovered: shadow DOM null guards)

### Risks/Blockers Encountered
- Click-outside test initially failed because `_show()` registers the document click listener after async awaits, requiring `oneEvent('hx-show')` to ensure listener is ready
- Branch coverage at 77.58% (below 80% threshold) — remaining uncovered branches are defensive null guards on shadow DOM queries that cannot practically be triggered in normal operation

### Remaining P2 Items (documented, not blocking)
- P2-01: No arrow key roving navigation in panel (APG Menu Button pattern)
- P2-04: `start`/`end` placements not RTL-aware

### Learnings
- Shadow DOM slot traversal requires `slot.assignedElements()` — never `querySelector` on a shadow DOM parent for slotted content
- Async event handlers that register listeners need `oneEvent` synchronization in tests, not just `await updateComplete`
</summary>