
🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Agent,TodoWrite,Bash,Edit,Write",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__list_events,mcp__wc-mcp__get_design_tokens",
  "max_results": 6
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "in_progress",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "pending",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit and fix CRITICAL+HIGH issues",
      "status": "pending",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests",
      "status": "pending",
      "activeForm": "Running tests"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-switch/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-switch"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-switch"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-switch"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-switch"
}

🔧 Tool: mcp__wc-mcp__list_events
Input: {
  "tagName": "hx-switch"
}
Now let me read all the source files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/index.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit and fix CRITICAL+HIGH issues",
      "status": "in_progress",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests",
      "status": "pending",
      "activeForm": "Running tests"
    }
  ]
}
Component is well-built. The main issues are **CEM documentation gaps** — 8 properties missing descriptions, which also tanks the accessibility CEM score (50/100). The actual implementation has proper ARIA, keyboard, and form support. Let me fix the JSDoc.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "/**\n * A toggle switch component for on/off states.\n *\n * @summary Form-associated toggle switch with label, error, and help text.\n *\n * @tag hx-switch\n *\n * @slot - Custom label content (overrides the label property).\n * @slot error - Custom error content (overrides the error property).\n * @slot help-text - Custom help text content (overrides the helpText property).\n *\n * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the switch is toggled.\n *\n * @csspart switch - The switch container (track + thumb wrapper).\n * @csspart track - The track background element.\n * @csspart thumb - The sliding thumb element.\n * @csspart label - The label text element.\n * @csspart help-text - The help text container.\n * @csspart error - The error message container.\n *\n * @cssprop [--hx-switch-track-bg=var(--hx-color-neutral-300)] - Track background color.\n * @cssprop [--hx-switch-track-checked-bg=var(--hx-color-primary-500)] - Track background when checked.\n * @cssprop [--hx-switch-thumb-bg=var(--hx-color-neutral-0)] - Thumb background color.\n * @cssprop [--hx-switch-thumb-shadow=var(--hx-shadow-sm)] - Thumb box shadow.\n * @cssprop [--hx-switch-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.\n * @cssprop [--hx-switch-label-color=var(--hx-color-neutral-700)] - Label text color.\n * @cssprop [--hx-switch-error-color=var(--hx-color-error-500)] - Error message color.\n */",
  "new_string": "/**\n * A toggle switch component for on/off states.\n *\n * Uses `role=\"switch\"` with `aria-checked` to convey toggle state.\n * Supports keyboard activation via Space and Enter keys.\n * Label association is handled through `aria-labelledby`, and\n * error/help text are linked via `aria-describedby`.\n *\n * @summary Form-associated toggle switch with label, error, and help text.\n *\n * @tag hx-switch\n *\n * @slot - Custom label content (overrides the label property).\n * @slot error - Custom error content (overrides the error property).\n * @slot help-text - Custom help text content (overrides the helpText property).\n *\n * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the switch is toggled.\n *\n * @csspart switch - The switch container (track + thumb wrapper).\n * @csspart track - The track background element.\n * @csspart thumb - The sliding thumb element.\n * @csspart label - The label text element.\n * @csspart help-text - The help text container.\n * @csspart error - The error message container.\n *\n * @cssprop [--hx-switch-track-bg=var(--hx-color-neutral-300)] - Track background color.\n * @cssprop [--hx-switch-track-checked-bg=var(--hx-color-primary-500)] - Track background when checked.\n * @cssprop [--hx-switch-thumb-bg=var(--hx-color-neutral-0)] - Thumb background color.\n * @cssprop [--hx-switch-thumb-shadow=var(--hx-shadow-sm)] - Thumb box shadow.\n * @cssprop [--hx-switch-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.\n * @cssprop [--hx-switch-label-color=var(--hx-color-neutral-700)] - Label text color.\n * @cssprop [--hx-switch-error-color=var(--hx-color-error-500)] - Error message color.\n */"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  // ─── Form Association ───\n\n  static formAssociated = true;\n\n  private _internals: ElementInternals;",
  "new_string": "  // ─── Form Association ───\n\n  /** Enables the element to participate in form submission and validation. */\n  static formAssociated = true;\n\n  /** ElementInternals instance for form association, validation, and ARIA. */\n  private _internals: ElementInternals;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  @query('.switch__track')\n  private _trackEl!: HTMLButtonElement;\n\n  @state() private _hasErrorSlot = false;",
  "new_string": "  /** Reference to the native button element acting as the switch track. */\n  @query('.switch__track')\n  private _trackEl!: HTMLButtonElement;\n\n  /** Whether the error slot has assigned content. */\n  @state() private _hasErrorSlot = false;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _switchId = `hx-switch-${Math.random().toString(36).slice(2, 9)}`;\n  private _labelId = `${this._switchId}-label`;\n  private _helpTextId = `${this._switchId}-help`;\n  private _errorId = `${this._switchId}-error`;",
  "new_string": "  /** Unique ID for this switch instance, used for ARIA associations. */\n  private _switchId = `hx-switch-${Math.random().toString(36).slice(2, 9)}`;\n  /** ID for the label element, referenced by aria-labelledby. */\n  private _labelId = `${this._switchId}-label`;\n  /** ID for the help text element, referenced by aria-describedby. */\n  private _helpTextId = `${this._switchId}-help`;\n  /** ID for the error element, referenced by aria-describedby. */\n  private _errorId = `${this._switchId}-error`;"
}
Now let me also add JSDoc to the private methods that were missing descriptions in the CEM.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _updateValidity(): void {",
  "new_string": "  /** Recalculates and sets the validity state based on required and checked. */\n  private _updateValidity(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _handleErrorSlotChange(e: Event): void {",
  "new_string": "  /** Updates _hasErrorSlot when error slot content changes. */\n  private _handleErrorSlotChange(e: Event): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _toggle(): void {",
  "new_string": "  /** Toggles checked state and dispatches hx-change event. */\n  private _toggle(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _handleClick(): void {",
  "new_string": "  /** Handles click events on the track. */\n  private _handleClick(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  private _handleKeyDown(e: KeyboardEvent): void {",
  "new_string": "  /** Handles keydown events — Space and Enter toggle the switch. */\n  private _handleKeyDown(e: KeyboardEvent): void {"
}
Now let me build, run CEM, and run tests.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit and fix CRITICAL+HIGH issues",
      "status": "completed",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Build and verify",
      "status": "in_progress",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests",
      "status": "pending",
      "activeForm": "Running tests"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx turbo run cem --filter=@wc-2026/library 2>&1 | tail -10",
  "description": "Generate Custom Elements Manifest",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "npm run cem 2>&1 | tail -10",
  "description": "Run CEM generation",
  "timeout": 60000
}
Build and CEM pass. Now run tests.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit and fix CRITICAL+HIGH issues",
      "status": "completed",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Build and verify",
      "status": "completed",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests",
      "status": "in_progress",
      "activeForm": "Running tests"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-switch/hx-switch.test.ts 2>&1 | tail -60",
  "description": "Run hx-switch tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests via npm script",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch diff --stat",
  "description": "Check which files changed"
}
Only `hx-switch.ts` has code changes (18 additions — the JSDoc descriptions). The screenshot PNGs are from prior test runs (binary noise). Let me check on the test results.

🔧 Tool: Bash
Input: {
  "command": "cat /private/tmp/claude-501/-Volumes-Development-booked-helix--worktrees-feature-deep-audit-v2-hx-switch/tasks/brsxmxeq0.output 2>&1 | tail -60",
  "description": "Check test output"
}

🔧 Tool: Bash
Input: {
  "command": "cat /private/tmp/claude-501/-Volumes-Development-booked-helix--worktrees-feature-deep-audit-v2-hx-switch/tasks/brsxmxeq0.output 2>&1 | wc -l",
  "description": "Check output length"
}
Tests are still running. Let me wait a moment and check again.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --config packages/hx-library/vitest.config.ts packages/hx-library/src/components/hx-switch/hx-switch.test.ts 2>&1 | tail -60",
  "description": "Run hx-switch tests with library config",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library && npx vitest run src/components/hx-switch/hx-switch.test.ts 2>&1 | tail -80",
  "description": "Run hx-switch tests from library dir",
  "timeout": 180000
}
All 60 tests pass. Let me update the AUDIT.md and finalize.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/AUDIT.md"
}
The existing AUDIT.md identifies real issues. Let me fix the CRITICAL and HIGH ones.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix CEM descriptions (8 missing)",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Fix A-01 P0: role=alert + aria-live=polite contradiction",
      "status": "in_progress",
      "activeForm": "Fixing aria-live contradiction"
    },
    {
      "content": "Fix A-06: Enter double-toggle bug",
      "status": "pending",
      "activeForm": "Fixing Enter double-toggle"
    },
    {
      "content": "Fix A-03 P1: Slotted label yields unlabeled button",
      "status": "pending",
      "activeForm": "Fixing slotted label accessibility"
    },
    {
      "content": "Fix A-04 P1: Add prefers-reduced-motion",
      "status": "pending",
      "activeForm": "Adding prefers-reduced-motion"
    },
    {
      "content": "Fix A-05 P1: formStateRestoreCallback signature",
      "status": "pending",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests",
      "status": "pending",
      "activeForm": "Running tests"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts"
}
Now let me fix all the CRITICAL/HIGH issues:

**A-01 (P0):** Remove `aria-live="polite"` — contradicts `role="alert"`
**A-06 (P0-adjacent):** Remove Enter from keydown — native button fires click on Enter, causing double-toggle
**A-03 (P1):** Add slotchange to default slot for label detection + always set aria-labelledby
**A-04 (P1):** Add prefers-reduced-motion
**A-05 (P1):** Fix formStateRestoreCallback signature

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "                role=\"alert\"\n                aria-live=\"polite\"",
  "new_string": "                role=\"alert\""
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  /** Handles keydown events — Space and Enter toggle the switch. */\n  private _handleKeyDown(e: KeyboardEvent): void {\n    if (e.key === ' ' || e.key === 'Enter') {\n      e.preventDefault();\n      this._toggle();\n    }\n  }",
  "new_string": "  /** Handles keydown events — Space toggles the switch per ARIA APG. */\n  private _handleKeyDown(e: KeyboardEvent): void {\n    if (e.key === ' ') {\n      e.preventDefault();\n      this._toggle();\n    }\n  }"
}
Now fix A-03: Always set `aria-labelledby` since the label span is always rendered, and add slotchange detection.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  /** Whether the error slot has assigned content. */\n  @state() private _hasErrorSlot = false;",
  "new_string": "  /** Whether the error slot has assigned content. */\n  @state() private _hasErrorSlot = false;\n\n  /** Whether the default slot has assigned content (slotted label). */\n  @state() private _hasDefaultSlot = false;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  /** Updates _hasErrorSlot when error slot content changes. */\n  private _handleErrorSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;\n  }",
  "new_string": "  /** Updates _hasErrorSlot when error slot content changes. */\n  private _handleErrorSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;\n  }\n\n  /** Updates _hasDefaultSlot when default slot content changes. */\n  private _handleDefaultSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasDefaultSlot = slot.assignedNodes({ flatten: true }).length > 0;\n  }"
}
Now update the render method to always set `aria-labelledby` when there's a label (prop or slot):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "    const hasError = !!this.error;\n    const hasLabel = !!this.label;",
  "new_string": "    const hasError = !!this.error;\n    const hasLabel = !!this.label || this._hasDefaultSlot;"
}
Now update the slot rendering to include `@slotchange` on the default slot:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "          ${hasLabel\n            ? html`\n                <span\n                  part=\"label\"\n                  class=\"switch__label\"\n                  id=${this._labelId}\n                  @click=${this._handleClick}\n                >\n                  <slot>${this.label}</slot>${this.required\n                    ? html`<span class=\"switch__required-marker\" aria-hidden=\"true\">*</span>`\n                    : nothing}\n                </span>\n              `\n            : html`<span class=\"switch__label\" id=${this._labelId}><slot></slot></span>`}",
  "new_string": "          <span\n            part=\"label\"\n            class=\"switch__label\"\n            id=${this._labelId}\n            @click=${this._handleClick}\n          >\n            <slot @slotchange=${this._handleDefaultSlotChange}>${this.label}</slot>${this.required\n              ? html`<span class=\"switch__required-marker\" aria-hidden=\"true\">*</span>`\n              : nothing}\n          </span>"
}
Now fix A-05: formStateRestoreCallback signature.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": "  /** Called when the form restores state (e.g., back/forward navigation). */\n  formStateRestoreCallback(state: string): void {\n    this.checked = state === this.value;\n  }",
  "new_string": "  /** Called when the form restores state (e.g., back/forward navigation). */\n  formStateRestoreCallback(state: File | string | null, _mode: 'restore' | 'autocomplete'): void {\n    if (typeof state === 'string') {\n      this.checked = state === this.value;\n    }\n  }"
}
Now fix A-04: Add prefers-reduced-motion to styles.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.styles.ts",
  "old_string": "  .switch__error {\n    font-size: var(--hx-font-size-xs, 0.75rem);\n    color: var(--hx-switch-error-color, var(--hx-color-error-500, #dc3545));\n    line-height: var(--hx-line-height-normal, 1.5);\n  }\n`;",
  "new_string": "  .switch__error {\n    font-size: var(--hx-font-size-xs, 0.75rem);\n    color: var(--hx-switch-error-color, var(--hx-color-error-500, #dc3545));\n    line-height: var(--hx-line-height-normal, 1.5);\n  }\n\n  /* --- Reduced Motion --- */\n\n  @media (prefers-reduced-motion: reduce) {\n    .switch__track,\n    .switch__thumb {\n      transition: none;\n    }\n  }\n`;"
}
Now update the JSDoc description to reflect the Space-only change:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.ts",
  "old_string": " * Supports keyboard activation via Space and Enter keys.",
  "new_string": " * Supports keyboard activation via Space key (per ARIA APG switch pattern)."
}
Now update the test for Enter key — it should still toggle because `<button>` fires native click on Enter:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.test.ts",
  "old_string": "    it('Enter toggles the switch', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');\n      const track = shadowQuery<HTMLElement>(el, '.switch__track');\n      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));\n      await el.updateComplete;\n      expect(el.checked).toBe(true);\n    });",
  "new_string": "    it('Enter does not double-toggle (native button click handles it)', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');\n      const track = shadowQuery<HTMLElement>(el, '.switch__track');\n      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));\n      await el.updateComplete;\n      expect(el.checked).toBe(false);\n    });"
}
Now update the formStateRestoreCallback test to match the new signature:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.test.ts",
  "old_string": "    it('formStateRestoreCallback restores checked state', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');\n      el.formStateRestoreCallback('on');\n      await el.updateComplete;\n      expect(el.checked).toBe(true);\n    });",
  "new_string": "    it('formStateRestoreCallback restores checked state', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');\n      el.formStateRestoreCallback('on', 'restore');\n      await el.updateComplete;\n      expect(el.checked).toBe(true);\n    });"
}
Also need to update the `aria-live="polite"` test — it should no longer expect that attribute:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.test.ts",
  "old_string": "    it('error div has aria-live=\"polite\"', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch error=\"Error\"></hx-switch>');\n      const errorDiv = shadowQuery(el, '.switch__error');\n      expect(errorDiv?.getAttribute('aria-live')).toBe('polite');\n    });",
  "new_string": "    it('error div uses role=\"alert\" (implicit assertive live region)', async () => {\n      const el = await fixture<WcSwitch>('<hx-switch error=\"Error\"></hx-switch>');\n      const errorDiv = shadowQuery(el, '.switch__error');\n      expect(errorDiv?.getAttribute('role')).toBe('alert');\n      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);\n    });"
}
Now the label test with slot-only needs updating — the label should always have a `part` now:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.test.ts",
  "old_string": "    it('default slot overrides label prop text', async () => {\n      const el = await fixture<WcSwitch>(\n        '<hx-switch label=\"Prop Label\"><strong>Slot Label</strong></hx-switch>',\n      );\n      const slotContent = el.querySelector('strong');\n      expect(slotContent).toBeTruthy();\n      expect(slotContent?.textContent).toBe('Slot Label');\n    });",
  "new_string": "    it('default slot overrides label prop text', async () => {\n      const el = await fixture<WcSwitch>(\n        '<hx-switch label=\"Prop Label\"><strong>Slot Label</strong></hx-switch>',\n      );\n      const slotContent = el.querySelector('strong');\n      expect(slotContent).toBeTruthy();\n      expect(slotContent?.textContent).toBe('Slot Label');\n    });\n\n    it('slotted label content sets aria-labelledby on track', async () => {\n      const el = await fixture<WcSwitch>(\n        '<hx-switch><strong>Slotted Label</strong></hx-switch>',\n      );\n      await el.updateComplete;\n      const track = shadowQuery(el, '[role=\"switch\"]');\n      const label = shadowQuery(el, '[part=\"label\"]');\n      expect(track?.getAttribute('aria-labelledby')).toBe(label?.id);\n    });"
}
Now let me update the Storybook story for the keyboard test — remove Enter assertion:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library/src/components/hx-switch/hx-switch.stories.ts",
  "old_string": "    // Press Enter to toggle off\n    await userEvent.keyboard('{Enter}');\n    await waitForUpdate(canvasElement);\n    await expect(track.getAttribute('aria-checked')).toBe('false');",
  "new_string": "    // Press Space again to toggle off\n    await userEvent.keyboard(' ');\n    await waitForUpdate(canvasElement);\n    await expect(track.getAttribute('aria-checked')).toBe('false');"
}
Now build and test.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix CEM descriptions (8 missing)",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Fix A-01 P0: role=alert + aria-live=polite contradiction",
      "status": "completed",
      "activeForm": "Fixing aria-live contradiction"
    },
    {
      "content": "Fix A-06: Enter double-toggle bug",
      "status": "completed",
      "activeForm": "Fixing Enter double-toggle"
    },
    {
      "content": "Fix A-03 P1: Slotted label yields unlabeled button",
      "status": "completed",
      "activeForm": "Fixing slotted label accessibility"
    },
    {
      "content": "Fix A-04 P1: Add prefers-reduced-motion",
      "status": "completed",
      "activeForm": "Adding prefers-reduced-motion"
    },
    {
      "content": "Fix A-05 P1: formStateRestoreCallback signature",
      "status": "completed",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Build, verify, and test",
      "status": "in_progress",
      "activeForm": "Building, verifying, and testing"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify --workspace=helix 2>&1 | tail -20",
  "description": "Run verify from root",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch && npm run verify 2>&1 | tail -20",
  "description": "Run verify from worktree root",
  "timeout": 120000
}
Format issue. Let me fix it.

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-switch/hx-switch.ts 2>&1",
  "description": "Format hx-switch.ts with prettier"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Verify again after format fix",
  "timeout": 120000
}
Verify passes — 0 errors. Now run tests.

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch/packages/hx-library && npx vitest run src/components/hx-switch/hx-switch.test.ts 2>&1 | tail -80",
  "description": "Run hx-switch tests",
  "timeout": 180000
}
All 61 tests pass (60 original + 1 new slotted label test). Let me verify the diff is clean.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-switch diff --stat",
  "description": "Check final diff"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix CEM descriptions (8 missing)",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Fix A-01 P0: role=alert + aria-live=polite contradiction",
      "status": "completed",
      "activeForm": "Fixing aria-live contradiction"
    },
    {
      "content": "Fix A-06: Enter double-toggle bug",
      "status": "completed",
      "activeForm": "Fixing Enter double-toggle"
    },
    {
      "content": "Fix A-03 P1: Slotted label yields unlabeled button",
      "status": "completed",
      "activeForm": "Fixing slotted label accessibility"
    },
    {
      "content": "Fix A-04 P1: Add prefers-reduced-motion",
      "status": "completed",
      "activeForm": "Adding prefers-reduced-motion"
    },
    {
      "content": "Fix A-05 P1: formStateRestoreCallback signature",
      "status": "completed",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Build, verify, and test",
      "status": "completed",
      "activeForm": "Building, verifying, and testing"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-switch

### Changes Implemented

**CEM Documentation (8 missing descriptions fixed):**
- Added JSDoc to `formAssociated`, `_internals`, `_trackEl`, `_hasErrorSlot`, `_switchId`, `_labelId`, `_helpTextId`, `_errorId`
- Added accessibility documentation to class-level JSDoc (role, aria-checked, keyboard, aria-labelledby, aria-describedby)
- Added descriptions to private methods: `_updateValidity`, `_handleErrorSlotChange`, `_toggle`, `_handleClick`, `_handleKeyDown`

**A-01 (P0) — `role="alert"` + `aria-live="polite"` contradiction:**
- Removed `aria-live="polite"` from error div — `role="alert"` already implies assertive live region

**A-06 (P0-adjacent) — Enter double-toggle bug:**
- Removed Enter key from `_handleKeyDown` — native `<button>` fires click on Enter, which called `_toggle` a second time, causing a net no-op
- Now Space-only per ARIA APG switch pattern

**A-03 (P1) — Slotted label yields unlabeled button:**
- Added `_hasDefaultSlot` state and `_handleDefaultSlotChange` slotchange handler
- `hasLabel` now checks both `label` prop and slot content: `!!this.label || this._hasDefaultSlot`
- Label element always renders with `part="label"` and `aria-labelledby` works for both prop and slotted content

**A-04 (P1) — No `prefers-reduced-motion` support:**
- Added `@media (prefers-reduced-motion: reduce)` block to disable track and thumb transitions

**A-05 (P1) — `formStateRestoreCallback` signature incorrect:**
- Changed signature to `(state: File | string | null, _mode: 'restore' | 'autocomplete')` per spec
- Added type guard for string state

### Files Modified
- `packages/hx-library/src/components/hx-switch/hx-switch.ts` — Main component (all fixes)
- `packages/hx-library/src/components/hx-switch/hx-switch.styles.ts` — Added prefers-reduced-motion
- `packages/hx-library/src/components/hx-switch/hx-switch.test.ts` — Updated 3 tests, added 1 new test (61 total)
- `packages/hx-library/src/components/hx-switch/hx-switch.stories.ts` — Updated keyboard story to use Space instead of Enter

### Verification Status
- `npm run verify`: 0 errors, 0 warnings (lint + format:check + type-check)
- `npx vitest run`: 61 tests passed (1 file), 0 failures
- `npm run cem`: CEM generated successfully

### Risks/Blockers Encountered
- None. All fixes were straightforward.

### Remaining P2 Issues (documented in AUDIT.md, not blocking)
- A-07: `_trackEl!` non-null assertion (standard Lit pattern, defensive guard exists)
- A-08: Missing `--hx-switch-help-text-color` CSS token
- A-09: `WcSwitch` type alias uses legacy prefix
- A-10: Storybook `size` argType key mismatch
- A-11: `Math.random()` for IDs (non-deterministic)
- A-12: Keyboard disabled test is vacuous
- A-13: Duplicate `@event` JSDoc in method body
- A-14: Stale screenshot artifacts

### Notes for Developer
- The Enter key still works for toggling via the native `<button>` click behavior — it's just not double-handled anymore
- The label element is now always rendered (not conditional), simplifying the template and ensuring `aria-labelledby` works for both prop and slot usage
</summary>