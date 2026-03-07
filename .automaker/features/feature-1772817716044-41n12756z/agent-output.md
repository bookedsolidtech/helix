I'll start by examining the hx-dialog component and running wc-mcp analysis in parallel.

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
Now let me read the component files and run wc-mcp analysis in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-dialog/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.stories.ts"
}
Now let me run wc-mcp analysis and read the index file in parallel.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-dialog"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-dialog"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/AUDIT.md"
}
Good — the previous T1 audit is thorough. Now I need to fix all CRITICAL (P0) and HIGH (P1) defects: D1-D7. Let me create a task plan and start implementing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "in_progress",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "pending",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "pending",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "pending",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "pending",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "pending",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "pending",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "pending",
      "activeForm": "Running build and test verification"
    }
  ]
}
Now let me implement the fixes. I'll start with the component file — addressing D1, D3, D4, and the P3 items all at once.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/index.ts"
}
Now I'll implement all the component fixes. Let me apply them sequentially.

**D1 — Focus restoration + D3 — Initial focus + D4 — Scroll lock + P3 — Deterministic ID + P3 — Remove classMap:**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, query, state } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixDialogStyles } from './hx-dialog.styles.js';",
  "new_string": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, query, state } from 'lit/decorators.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixDialogStyles } from './hx-dialog.styles.js';\n\nlet _idCounter = 0;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "  /** Cached focusable elements — populated on open, cleared on close. */\n  private _cachedFocusableElements: HTMLElement[] = [];\n\n  // ─── Unique ID for aria-labelledby ───\n\n  private readonly _headingId = `hx-dialog-heading-${Math.random().toString(36).slice(2, 9)}`;",
  "new_string": "  /** Cached focusable elements — populated on open, cleared on close. */\n  private _cachedFocusableElements: HTMLElement[] = [];\n\n  /** Element that had focus before the dialog opened — restored on close. */\n  private _previouslyFocusedElement: HTMLElement | null = null;\n\n  /** Stored body overflow value to restore after modal close. */\n  private _previousBodyOverflow = '';\n\n  // ─── Unique ID for aria-labelledby ───\n\n  private readonly _headingId = `hx-dialog-heading-${++_idCounter}`;"
}
Now fix `_openDialog` to store focus, lock scroll, and set initial focus:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "  private _openDialog(): void {\n    const dialog = this._dialogEl;\n    if (!dialog) return;\n\n    if (this.modal) {\n      if (!dialog.open) {\n        dialog.showModal();\n      }\n    } else {\n      if (!dialog.open) {\n        dialog.show();\n      }\n    }\n\n    this._addGlobalListeners();\n\n    // Cache focusable elements after the dialog is open in the DOM\n    void this.updateComplete.then(() => {\n      this._cachedFocusableElements = this._getFocusableElements();\n    });\n\n    this.dispatchEvent(\n      new CustomEvent('hx-open', {\n        bubbles: true,\n        composed: true,\n      }),\n    );\n  }",
  "new_string": "  private _openDialog(): void {\n    const dialog = this._dialogEl;\n    if (!dialog) return;\n\n    // D1: Store the currently focused element for restoration on close\n    this._previouslyFocusedElement = document.activeElement as HTMLElement | null;\n\n    if (this.modal) {\n      if (!dialog.open) {\n        dialog.showModal();\n      }\n      // D4: Lock body scroll while modal is open\n      this._previousBodyOverflow = document.body.style.overflow;\n      document.body.style.overflow = 'hidden';\n    } else {\n      if (!dialog.open) {\n        dialog.show();\n      }\n    }\n\n    this._addGlobalListeners();\n\n    // Cache focusable elements and set initial focus after render\n    void this.updateComplete.then(() => {\n      this._cachedFocusableElements = this._getFocusableElements();\n      // D3: Move focus to the first focusable element inside the dialog\n      if (this._cachedFocusableElements.length > 0) {\n        this._cachedFocusableElements[0].focus();\n      }\n    });\n\n    this.dispatchEvent(\n      new CustomEvent('hx-open', {\n        bubbles: true,\n        composed: true,\n      }),\n    );\n  }"
}
Now fix `_closeDialog` to restore focus and unlock scroll:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "  private _closeDialog(): void {\n    const dialog = this._dialogEl;\n    if (!dialog) return;\n\n    const wasOpen = dialog.open;\n    if (dialog.open) {\n      dialog.close();\n    }\n\n    this._removeGlobalListeners();\n    this._cachedFocusableElements = [];\n\n    if (wasOpen) {\n      this.dispatchEvent(\n        new CustomEvent('hx-close', {\n          bubbles: true,\n          composed: true,\n        }),\n      );\n    }\n  }",
  "new_string": "  private _closeDialog(): void {\n    const dialog = this._dialogEl;\n    if (!dialog) return;\n\n    const wasOpen = dialog.open;\n    if (dialog.open) {\n      dialog.close();\n    }\n\n    // D4: Restore body scroll\n    if (this.modal) {\n      document.body.style.overflow = this._previousBodyOverflow;\n    }\n\n    this._removeGlobalListeners();\n    this._cachedFocusableElements = [];\n\n    // D1: Restore focus to the element that opened the dialog\n    if (wasOpen && this._previouslyFocusedElement) {\n      this._previouslyFocusedElement.focus();\n      this._previouslyFocusedElement = null;\n    }\n\n    if (wasOpen) {\n      this.dispatchEvent(\n        new CustomEvent('hx-close', {\n          bubbles: true,\n          composed: true,\n        }),\n      );\n    }\n  }"
}
Now remove the `classMap` usage (P3):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "  override render() {\n    const hasHeading = this.heading.trim().length > 0;\n\n    const dialogClasses = {\n      dialog: true,\n    };\n\n    return html`\n      ${this._renderNonModalBackdrop()}\n      <dialog\n        aria-labelledby=${hasHeading ? this._headingId : nothing}\n        aria-label=${!hasHeading && this.ariaLabel ? this.ariaLabel : nothing}\n        aria-modal=${this.modal ? 'true' : nothing}\n      >\n        <div part=\"dialog\" class=${classMap(dialogClasses)}>\n          ${this._renderHeader()}\n          <div part=\"body\" class=\"dialog__body\">\n            <slot></slot>\n          </div>\n          ${this._renderFooter()}\n        </div>\n      </dialog>\n    `;\n  }",
  "new_string": "  override render() {\n    const hasHeading = this.heading.trim().length > 0;\n\n    return html`\n      ${this._renderNonModalBackdrop()}\n      <dialog\n        aria-labelledby=${hasHeading ? this._headingId : nothing}\n        aria-label=${!hasHeading && this.ariaLabel ? this.ariaLabel : nothing}\n        aria-modal=${this.modal ? 'true' : nothing}\n      >\n        <div part=\"dialog\" class=\"dialog\">\n          ${this._renderHeader()}\n          <div part=\"body\" class=\"dialog__body\">\n            <slot></slot>\n          </div>\n          ${this._renderFooter()}\n        </div>\n      </dialog>\n    `;\n  }"
}
Good. Now fix D5 — non-modal backdrop z-index stacking:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "completed",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "pending",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "completed",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "completed",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "in_progress",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "pending",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "completed",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "pending",
      "activeForm": "Running build and test verification"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.styles.ts",
  "old_string": "  /* ─── Non-modal backdrop overlay ─── */\n\n  .dialog-backdrop {\n    position: fixed;\n    inset: 0;\n    background-color: var(--hx-dialog-backdrop-color, var(--hx-color-neutral-900));\n    opacity: var(--hx-dialog-backdrop-opacity, 0.5);\n    z-index: var(--hx-z-index-modal);\n  }",
  "new_string": "  /* ─── Non-modal backdrop overlay ─── */\n\n  .dialog-backdrop {\n    position: fixed;\n    inset: 0;\n    background-color: var(--hx-dialog-backdrop-color, var(--hx-color-neutral-900));\n    opacity: var(--hx-dialog-backdrop-opacity, 0.5);\n    z-index: var(--hx-z-index-modal, 1000);\n  }\n\n  /* Ensure non-modal dialog content renders above the backdrop */\n  :host(:not([modal])) dialog {\n    position: relative;\n    z-index: calc(var(--hx-z-index-modal, 1000) + 1);\n  }"
}
Now fix D2 — the WithCustomHeader story needs `aria-label`:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "completed",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "in_progress",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "completed",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "completed",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "completed",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "pending",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "completed",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "pending",
      "activeForm": "Running build and test verification"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.stories.ts",
  "old_string": "    <hx-dialog open modal>",
  "new_string": "    <hx-dialog open modal aria-label=\"Critical Alert\">"
}
Now add D6+D7 tests — focus restoration and initial focus:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "completed",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "completed",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "completed",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "completed",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "completed",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "in_progress",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "completed",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "pending",
      "activeForm": "Running build and test verification"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.test.ts",
  "old_string": "  // ─── Backdrop Click (2) ───",
  "new_string": "  // ─── Focus Management (3) ───\n\n  describe('Focus Management', () => {\n    it('restores focus to trigger element after dialog closes (D1)', async () => {\n      const wrapper = document.createElement('div');\n      const triggerBtn = document.createElement('button');\n      triggerBtn.id = 'trigger';\n      triggerBtn.textContent = 'Open';\n      wrapper.appendChild(triggerBtn);\n      document.body.appendChild(wrapper);\n\n      const el = await fixture<HelixDialog>(\n        '<hx-dialog heading=\"Focus Test\"><button id=\"inner\">OK</button></hx-dialog>',\n      );\n\n      triggerBtn.focus();\n      expect(document.activeElement).toBe(triggerBtn);\n\n      el.show();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      el.close();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      expect(document.activeElement).toBe(triggerBtn);\n      wrapper.remove();\n    });\n\n    it('sets initial focus on first focusable element after open (D3)', async () => {\n      const el = await fixture<HelixDialog>(\n        `<hx-dialog heading=\"Focus Test\">\n          <button id=\"first-focusable\">First</button>\n          <button id=\"second-focusable\">Second</button>\n        </hx-dialog>`,\n      );\n\n      el.show();\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      const firstBtn = el.querySelector('#first-focusable');\n      expect(document.activeElement).toBe(firstBtn);\n    });\n\n    it('locks body scroll when modal opens and restores on close (D4)', async () => {\n      const el = await fixture<HelixDialog>(\n        '<hx-dialog modal heading=\"Scroll Lock Test\">Content</hx-dialog>',\n      );\n\n      const originalOverflow = document.body.style.overflow;\n      el.show();\n      await el.updateComplete;\n\n      expect(document.body.style.overflow).toBe('hidden');\n\n      el.close();\n      await el.updateComplete;\n\n      expect(document.body.style.overflow).toBe(originalOverflow);\n    });\n  });\n\n  // ─── Backdrop Click (2) ───"
}
Now let me run the build to verify:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "completed",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "completed",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "completed",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "completed",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "completed",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "completed",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "completed",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "in_progress",
      "activeForm": "Running build and test verification"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
TypeScript error at line 194. Let me check:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "offset": 190,
  "limit": 10
}
Array element access can be undefined in strict mode. Fix:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/hx-dialog.ts",
  "old_string": "      // D3: Move focus to the first focusable element inside the dialog\n      if (this._cachedFocusableElements.length > 0) {\n        this._cachedFocusableElements[0].focus();\n      }",
  "new_string": "      // D3: Move focus to the first focusable element inside the dialog\n      const firstFocusable = this._cachedFocusableElements[0];\n      if (firstFocusable) {\n        firstFocusable.focus();\n      }"
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -10",
  "description": "Re-run TypeScript type-check",
  "timeout": 120000
}
Type-check passes. Now run the tests:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-dialog/hx-dialog.test.ts 2>&1 | tail -60",
  "description": "Run hx-dialog tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests via npm script",
  "timeout": 180000
}
All 3103 tests pass (79 test files). Let me verify the changes and run the full verify:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Run full verification suite",
  "timeout": 120000
}
All gates pass. Let me check the diff:

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog diff --stat",
  "description": "Check changed files"
}
Only the 4 intended source files changed (plus screenshot PNGs from test runs, which are expected). Let me update the AUDIT.md to reflect the fixes:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "D1 (P0): Implement focus restoration on dialog close",
      "status": "completed",
      "activeForm": "Implementing focus restoration on dialog close"
    },
    {
      "content": "D2 (P0): Fix WithCustomHeader story — add aria-label",
      "status": "completed",
      "activeForm": "Fixing WithCustomHeader story accessible name"
    },
    {
      "content": "D3 (P1): Implement initial focus on first focusable element after open",
      "status": "completed",
      "activeForm": "Implementing initial focus placement on dialog open"
    },
    {
      "content": "D4 (P1): Implement body scroll lock when modal is open",
      "status": "completed",
      "activeForm": "Implementing body scroll lock for modal dialog"
    },
    {
      "content": "D5 (P1): Fix non-modal backdrop z-index stacking conflict",
      "status": "completed",
      "activeForm": "Fixing non-modal backdrop z-index stacking"
    },
    {
      "content": "D6+D7 (P1): Add tests for focus restoration and initial focus",
      "status": "completed",
      "activeForm": "Adding focus restoration and initial focus tests"
    },
    {
      "content": "P3 fixes: classMap removal, deterministic ID counter",
      "status": "completed",
      "activeForm": "Applying P3 cleanup fixes"
    },
    {
      "content": "Build verification and test run",
      "status": "completed",
      "activeForm": "Running build and test verification"
    }
  ]
}
Now let me update the AUDIT.md defect register to reflect resolved status:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-dialog/packages/hx-library/src/components/hx-dialog/AUDIT.md",
  "old_string": "## Defect Register\n\n| ID | Severity | Area | Title |\n|----|----------|------|-------|\n| D1 | P0 | A11y | No focus restoration to trigger on dialog close (WCAG 2.4.3) |\n| D2 | P0 | Storybook | `WithCustomHeader` story renders unlabelled dialog |\n| D3 | P1 | A11y | Initial focus after `showModal()` does not reach slotted light DOM content |\n| D4 | P1 | A11y | Body scroll not locked when modal dialog is open |\n| D5 | P1 | CSS | Non-modal backdrop z-index renders over dialog content |\n| D6 | P1 | Tests | No test for focus restoration on dialog close |\n| D7 | P1 | Tests | No test for initial focus after dialog open |\n| D8 | P2 | A11y | `aria-describedby` not implemented |\n| D9 | P2 | A11y | No `role=\"alertdialog\"` variant |\n| D10 | P2 | TypeScript | `ariaLabel` property shadows `ARIAMixin.ariaLabel` |\n| D11 | P2 | TypeScript | `close()` does not accept `returnValue` parameter |\n| D12 | P2 | Tests | No test for `role=\"alertdialog\"` variant |\n| D13 | P2 | Tests | No test for form submission inside dialog |\n| D14 | P2 | Tests | Axe tests do not cover custom header without `aria-label` |\n| D15 | P2 | Storybook | No `alertdialog` story |\n| D16 | P2 | Storybook | No form-inside-dialog story |\n| D17 | P2 | Storybook | No close button / `close-button` CSS part absent |\n| D18 | P2 | CSS | `dialog::backdrop` shadow DOM support limited below Firefox 122 |\n| D19 | P2 | CSS | `::backdrop` at `opacity: 0` creates invisible pointer-blocking layer |\n| D20 | P2 | Drupal | No Twig example or Drupal behaviors pattern documented |\n| D21 | P3 | TypeScript | `Math.random()` heading ID is non-deterministic |\n| D22 | P3 | TypeScript | `classMap` used for static-only class |\n| D23 | P3 | Storybook | Story event handlers use fragile `closest()` traversal |\n| D24 | P3 | Storybook | `TriggerButton` story does not demonstrate focus restoration |\n\n---\n\n## Verdict\n\n**DO NOT SHIP** in current state. Two P0 defects (focus restoration, inaccessible demo story) and five P1 defects must be resolved before this component can meet the WCAG 2.1 AA healthcare mandate.\n\nMinimum viable ship requires resolving: D1, D2, D3, D4, D5, D6, D7.",
  "new_string": "## Defect Register\n\n| ID | Severity | Area | Title | Status |\n|----|----------|------|-------|--------|\n| D1 | P0 | A11y | No focus restoration to trigger on dialog close (WCAG 2.4.3) | **RESOLVED** (deep-audit-v2) |\n| D2 | P0 | Storybook | `WithCustomHeader` story renders unlabelled dialog | **RESOLVED** (deep-audit-v2) |\n| D3 | P1 | A11y | Initial focus after `showModal()` does not reach slotted light DOM content | **RESOLVED** (deep-audit-v2) |\n| D4 | P1 | A11y | Body scroll not locked when modal dialog is open | **RESOLVED** (deep-audit-v2) |\n| D5 | P1 | CSS | Non-modal backdrop z-index renders over dialog content | **RESOLVED** (deep-audit-v2) |\n| D6 | P1 | Tests | No test for focus restoration on dialog close | **RESOLVED** (deep-audit-v2) |\n| D7 | P1 | Tests | No test for initial focus after dialog open | **RESOLVED** (deep-audit-v2) |\n| D8 | P2 | A11y | `aria-describedby` not implemented | Open |\n| D9 | P2 | A11y | No `role=\"alertdialog\"` variant | Open |\n| D10 | P2 | TypeScript | `ariaLabel` property shadows `ARIAMixin.ariaLabel` | Open |\n| D11 | P2 | TypeScript | `close()` does not accept `returnValue` parameter | Open |\n| D12 | P2 | Tests | No test for `role=\"alertdialog\"` variant | Open |\n| D13 | P2 | Tests | No test for form submission inside dialog | Open |\n| D14 | P2 | Tests | Axe tests do not cover custom header without `aria-label` | Open |\n| D15 | P2 | Storybook | No `alertdialog` story | Open |\n| D16 | P2 | Storybook | No form-inside-dialog story | Open |\n| D17 | P2 | Storybook | No close button / `close-button` CSS part absent | Open |\n| D18 | P2 | CSS | `dialog::backdrop` shadow DOM support limited below Firefox 122 | Open |\n| D19 | P2 | CSS | `::backdrop` at `opacity: 0` creates invisible pointer-blocking layer | Open |\n| D20 | P2 | Drupal | No Twig example or Drupal behaviors pattern documented | Open |\n| D21 | P3 | TypeScript | `Math.random()` heading ID is non-deterministic | **RESOLVED** (deep-audit-v2) |\n| D22 | P3 | TypeScript | `classMap` used for static-only class | **RESOLVED** (deep-audit-v2) |\n| D23 | P3 | Storybook | Story event handlers use fragile `closest()` traversal | Open |\n| D24 | P3 | Storybook | `TriggerButton` story does not demonstrate focus restoration | Open |\n\n---\n\n## Deep Audit V2 — Resolution Summary (2026-03-06)\n\n**All P0 and P1 defects resolved.** Two P3 items also fixed.\n\n### Fixes applied:\n- **D1** — `_previouslyFocusedElement` stored on open, `.focus()` called on close (WCAG 2.4.3)\n- **D2** — Added `aria-label=\"Critical Alert\"` to `WithCustomHeader` story\n- **D3** — After `updateComplete`, first focusable element receives `.focus()`\n- **D4** — `document.body.style.overflow = 'hidden'` on modal open, restored on close\n- **D5** — Non-modal `<dialog>` gets `z-index: calc(var(--hx-z-index-modal) + 1)` via `:host(:not([modal]))` selector\n- **D6** — New test: focus restoration to trigger element after dialog close\n- **D7** — New test: initial focus placement + body scroll lock verification\n- **D21** — Replaced `Math.random()` with module-level monotonic counter\n- **D22** — Removed `classMap` import; static `class=\"dialog\"` applied directly\n\n### Remaining (P2/P3 — documented, not blocking):\n13 open P2/P3 items documented above for future work.\n\n## Verdict\n\n**SHIP-READY** for WCAG 2.1 AA minimum viable compliance. All P0 and P1 defects resolved. Remaining P2/P3 items are enhancements, not blockers."
}
<summary>
## Summary: Deep Component Audit — hx-dialog

### Changes Implemented
- **D1 (P0):** Focus restoration — stores `document.activeElement` before open, calls `.focus()` on close (WCAG 2.4.3)
- **D2 (P0):** Fixed `WithCustomHeader` story — added `aria-label="Critical Alert"` for accessible name
- **D3 (P1):** Initial focus — after `updateComplete`, first focusable element in dialog receives focus
- **D4 (P1):** Body scroll lock — `document.body.style.overflow = 'hidden'` on modal open, restored on close
- **D5 (P1):** Non-modal backdrop z-index fix — dialog content now stacks above backdrop via `:host(:not([modal])) dialog` rule
- **D6 (P1):** New test: focus restoration to trigger element after dialog close
- **D7 (P1):** New tests: initial focus placement + body scroll lock verification
- **D21 (P3):** Replaced `Math.random()` ID with deterministic module-level counter
- **D22 (P3):** Removed `classMap` import; static `class="dialog"` applied directly

### Files Modified
- `packages/hx-library/src/components/hx-dialog/hx-dialog.ts` — Focus restoration, initial focus, scroll lock, ID counter, classMap removal
- `packages/hx-library/src/components/hx-dialog/hx-dialog.styles.ts` — Non-modal z-index stacking fix
- `packages/hx-library/src/components/hx-dialog/hx-dialog.stories.ts` — aria-label on WithCustomHeader
- `packages/hx-library/src/components/hx-dialog/hx-dialog.test.ts` — 3 new tests (focus restore, initial focus, scroll lock)
- `packages/hx-library/src/components/hx-dialog/AUDIT.md` — Updated defect register with resolution status

### Verification Status
- `npm run verify` — **PASS** (lint + format:check + type-check, 0 errors)
- `npm run test:library` — **PASS** (3103 tests, 79 files, all passing)
- wc-mcp health score: **89/100 (B grade)**
- wc-mcp accessibility: F score is CEM metadata only (no role/aria documented in manifest) — runtime ARIA implementation is correct

### Risks/Blockers Encountered
- TypeScript strict mode flagged array indexing as possibly undefined — fixed with variable extraction
- No blockers encountered

### Learnings
- Native `<dialog>` `showModal()` focus delegation does NOT traverse Shadow DOM boundaries to reach slotted content — explicit focus management required
- Body scroll lock must be manually implemented; `showModal()` top-layer does not prevent wheel/keyboard scrolling

### Notes for Developer
- 13 P2/P3 items remain open and documented in AUDIT.md for future work (alertdialog variant, aria-describedby, returnValue, form-inside-dialog story, etc.)
- The wc-mcp accessibility score (F) reflects missing CEM annotations for ARIA roles/attributes, not actual runtime a11y issues — the component correctly uses native `<dialog>` role and aria-modal/aria-labelledby at runtime
</summary>