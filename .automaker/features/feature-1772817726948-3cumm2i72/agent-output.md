I'll start by examining the hx-drawer component and running the wc-mcp tools for scoring. Let me read the component files and gather diagnostic data in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Write,Edit,TodoWrite,Agent",
  "max_results": 10
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__list_events,mcp__wc-mcp__list_slots,mcp__wc-mcp__get_design_tokens",
  "max_results": 10
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "in_progress",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "pending",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Audit and fix design tokens",
      "status": "pending",
      "activeForm": "Auditing design tokens"
    },
    {
      "content": "Audit and fix accessibility (dialog role, focus trap, ARIA)",
      "status": "pending",
      "activeForm": "Auditing accessibility"
    },
    {
      "content": "Audit and fix functionality (placement, overlay, animation)",
      "status": "pending",
      "activeForm": "Auditing functionality"
    },
    {
      "content": "Audit and fix TypeScript strict compliance",
      "status": "pending",
      "activeForm": "Auditing TypeScript"
    },
    {
      "content": "Audit and fix CSS/styling (shadow DOM, parts, animation)",
      "status": "pending",
      "activeForm": "Auditing CSS and styling"
    },
    {
      "content": "Audit and fix tests (80%+ coverage)",
      "status": "pending",
      "activeForm": "Auditing tests"
    },
    {
      "content": "Audit and fix Storybook stories",
      "status": "pending",
      "activeForm": "Auditing Storybook stories"
    },
    {
      "content": "Verify CEM accuracy",
      "status": "pending",
      "activeForm": "Verifying CEM accuracy"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Let me read the component files and run wc-mcp diagnostics in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-drawer/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/index.ts"
}
Now let me run wc-mcp diagnostics.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-drawer"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-drawer"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Audit and fix design tokens",
      "status": "in_progress",
      "activeForm": "Auditing design tokens"
    },
    {
      "content": "Audit and fix accessibility (dialog role, focus trap, ARIA)",
      "status": "pending",
      "activeForm": "Auditing accessibility"
    },
    {
      "content": "Audit and fix functionality (placement, overlay, animation)",
      "status": "pending",
      "activeForm": "Auditing functionality"
    },
    {
      "content": "Audit and fix TypeScript strict compliance",
      "status": "pending",
      "activeForm": "Auditing TypeScript"
    },
    {
      "content": "Audit and fix CSS/styling (shadow DOM, parts, animation)",
      "status": "pending",
      "activeForm": "Auditing CSS and styling"
    },
    {
      "content": "Audit and fix tests (80%+ coverage)",
      "status": "pending",
      "activeForm": "Auditing tests"
    },
    {
      "content": "Audit and fix Storybook stories",
      "status": "pending",
      "activeForm": "Auditing Storybook stories"
    },
    {
      "content": "Verify CEM accuracy",
      "status": "pending",
      "activeForm": "Verifying CEM accuracy"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
The component is well-structured. Let me now do a thorough audit. I've identified several issues from reading the code and wc-mcp results. Let me check an existing well-audited component for patterns to follow, and check the existing AUDIT.md.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/AUDIT.md"
}
Excellent. The audit report is thorough. I now have a clear picture. The component has **1 P0, 6 P1, 5 P2, 3 P3** issues. Per the feature spec: "Fix CRITICAL+HIGH. Document rest."

Let me fix P0 + P1 issues (and easy P2s) in the component, then update tests and stories. I'll delegate the implementation work to specialists.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "in_progress",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "pending",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "pending",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "pending",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "pending",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "pending",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "pending",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "pending",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "pending",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Agent
Input: {
  "description": "Fix hx-drawer P0+P1+P2 issues",
  "subagent_type": "lit-specialist",
  "prompt": "You are fixing critical and high-severity issues in the hx-drawer component. The component is at:\n`/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts`\n\nHere are the EXACT fixes to apply. Do them ALL in order:\n\n## P0-01: Body scroll lock\nIn `_openDrawer()`, before dispatching `hx-show`, save `document.body.style.overflow` and set it to `'hidden'` — but ONLY when `!this.contained`. In `_closeDrawer()`, restore the saved overflow value (only when `!this.contained`).\n\nAdd a private field:\n```ts\nprivate _previousBodyOverflow = '';\n```\n\nIn `_openDrawer()`, after `this._triggerElement = ...` line, add:\n```ts\nif (!this.contained) {\n  this._previousBodyOverflow = document.body.style.overflow;\n  document.body.style.overflow = 'hidden';\n}\n```\n\nIn `_closeDrawer()`, inside the setTimeout callback, after focus restoration and before `this._triggerElement = null`, add:\n```ts\nif (!this.contained) {\n  document.body.style.overflow = this._previousBodyOverflow;\n}\n```\n\n## P1-01: Remove duplicate keydown listener\nIn `_addListeners()`, REMOVE the line:\n```ts\nthis._overlayEl?.addEventListener('keydown', this._handleKeyDown);\n```\nKeep only `document.addEventListener('keydown', this._handleKeyDown);`\n\nIn `_removeListeners()`, REMOVE the line:\n```ts\nthis._overlayEl?.removeEventListener('keydown', this._handleKeyDown);\n```\nKeep only `document.removeEventListener('keydown', this._handleKeyDown);`\n\n## P1-02: Fix focus trap for slotted elements\nIn `_trapFocus()`, change:\n```ts\nconst shadowActive = this.shadowRoot?.activeElement;\nconst active = (shadowActive ?? document.activeElement) as HTMLElement | null;\n```\nto:\n```ts\nconst active = document.activeElement as HTMLElement | null;\n```\n\n## P1-03: Background content aria-hidden on open\nAdd two private methods:\n\n```ts\nprivate _hiddenSiblings: Element[] = [];\n\nprivate _hideBackgroundContent(): void {\n  if (this.contained) return;\n  this._hiddenSiblings = [];\n  for (const child of Array.from(document.body.children)) {\n    if (child === this || child === this.parentElement) continue;\n    if (child.getAttribute('aria-hidden') === 'true') continue;\n    child.setAttribute('aria-hidden', 'true');\n    this._hiddenSiblings.push(child);\n  }\n}\n\nprivate _restoreBackgroundContent(): void {\n  for (const el of this._hiddenSiblings) {\n    el.removeAttribute('aria-hidden');\n  }\n  this._hiddenSiblings = [];\n}\n```\n\nCall `this._hideBackgroundContent()` in `_openDrawer()` right after the scroll lock code.\nCall `this._restoreBackgroundContent()` in `_closeDrawer()` right after the scroll restoration code (inside the setTimeout callback).\n\n## P1-05: Animation timeout race condition\nAt the START of `_openDrawer()`, add:\n```ts\nif (this._animationTimeout !== null) {\n  clearTimeout(this._animationTimeout);\n  this._animationTimeout = null;\n}\n```\n\nAt the START of `_closeDrawer()`, add:\n```ts\nif (this._animationTimeout !== null) {\n  clearTimeout(this._animationTimeout);\n  this._animationTimeout = null;\n}\n```\n\n## P1-06: Accessible name when label empty\nAdd a new public property:\n```ts\n/**\n * An accessible label for the drawer. Used as aria-label when no label slot is provided.\n * @attr label\n */\n@property({ type: String, reflect: true })\nlabel = '';\n```\n\nUpdate the render method's aria attributes on the overlay div:\n```ts\naria-labelledby=${this._hasLabelSlot ? this._titleId : nothing}\naria-label=${!this._hasLabelSlot && this.label ? this.label : nothing}\n```\n\n## P2-01: Fix DrawerSize | string type collapse\nChange the `size` property type from `DrawerSize | string` to just `string` but add the JSDoc:\n```ts\n/**\n * The size of the drawer panel.\n * Accepts 'sm' | 'md' | 'lg' | 'full', or any valid CSS length via --hx-drawer-size token.\n * @attr size\n */\n@property({ type: String, reflect: true })\nsize: string = 'md';\n```\n\n## P2-03: Footer hidden CSS override\nIn the styles file at `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts`, add inside the template literal right after `:host([contained])` block:\n\n```css\n[hidden] {\n  display: none !important;\n}\n```\n\n## P2-04: _triggerElement instanceof guard\nIn `_openDrawer()`, change:\n```ts\nthis._triggerElement = document.activeElement as HTMLElement | null;\n```\nto:\n```ts\nconst activeEl = document.activeElement;\nthis._triggerElement = activeEl instanceof HTMLElement ? activeEl : null;\n```\n\n## P3-01: Remove redundant firstUpdated\nRemove the entire `firstUpdated()` override method. The slotchange handlers already handle initialization.\n\n## P3-03: Already fixed by P1-01\n\nRead both files first, then apply ALL edits. Make sure to preserve exact whitespace/indentation patterns from the existing code."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Edit",
  "max_results": 2
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  private _cachedFocusableElements: HTMLElement[] = [];\n  private _triggerElement: HTMLElement | null = null;\n  private _animationTimeout: ReturnType<typeof setTimeout> | null = null;",
  "new_string": "  private _cachedFocusableElements: HTMLElement[] = [];\n  private _triggerElement: HTMLElement | null = null;\n  private _animationTimeout: ReturnType<typeof setTimeout> | null = null;\n  private _previousBodyOverflow = '';\n  private _hiddenSiblings: Element[] = [];"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  /**\n   * When true, the footer slot is hidden.\n   * @attr no-footer\n   */\n  @property({ type: Boolean, reflect: true, attribute: 'no-footer' })\n  noFooter = false;\n\n  // ─── Lifecycle ───",
  "new_string": "  /**\n   * When true, the footer slot is hidden.\n   * @attr no-footer\n   */\n  @property({ type: Boolean, reflect: true, attribute: 'no-footer' })\n  noFooter = false;\n\n  /**\n   * An accessible label for the drawer. Used as aria-label when no label slot is provided.\n   * @attr label\n   */\n  @property({ type: String, reflect: true })\n  label = '';\n\n  // ─── Lifecycle ───"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  /**\n   * The size of the drawer panel. Use 'sm', 'md', 'lg', 'full', or any valid CSS length.\n   * @attr size\n   */\n  @property({ type: String, reflect: true })\n  size: DrawerSize | string = 'md';",
  "new_string": "  /**\n   * The size of the drawer panel.\n   * Accepts 'sm' | 'md' | 'lg' | 'full', or any valid CSS length via --hx-drawer-size token.\n   * @attr size\n   */\n  @property({ type: String, reflect: true })\n  size: string = 'md';"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  override firstUpdated(): void {\n    this._hasHeaderActionsSlot = this.querySelector('[slot=\"header-actions\"]') !== null;\n    this._hasFooterSlot = this.querySelector('[slot=\"footer\"]') !== null;\n    this._hasLabelSlot = this.querySelector('[slot=\"label\"]') !== null;\n  }\n\n  override disconnectedCallback",
  "new_string": "  override disconnectedCallback"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  private _openDrawer(): void {\n    // Capture trigger for focus restoration\n    this._triggerElement = document.activeElement as HTMLElement | null;\n\n    this._applySizeVar();",
  "new_string": "  private _openDrawer(): void {\n    if (this._animationTimeout !== null) {\n      clearTimeout(this._animationTimeout);\n      this._animationTimeout = null;\n    }\n\n    // Capture trigger for focus restoration\n    const activeEl = document.activeElement;\n    this._triggerElement = activeEl instanceof HTMLElement ? activeEl : null;\n\n    if (!this.contained) {\n      this._previousBodyOverflow = document.body.style.overflow;\n      document.body.style.overflow = 'hidden';\n    }\n\n    this._hideBackgroundContent();\n\n    this._applySizeVar();"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  private _closeDrawer(): void {\n    this._isOpen = false;\n    this._removeListeners();\n    this._cachedFocusableElements = [];\n\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n\n    // Restore focus to the trigger\n    const duration = this._getAnimationDuration();\n    this._animationTimeout = setTimeout(() => {\n      this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));\n      if (this._triggerElement && typeof this._triggerElement.focus === 'function') {\n        this._triggerElement.focus();\n      }\n      this._triggerElement = null;\n    }, duration);\n  }",
  "new_string": "  private _closeDrawer(): void {\n    if (this._animationTimeout !== null) {\n      clearTimeout(this._animationTimeout);\n      this._animationTimeout = null;\n    }\n\n    this._isOpen = false;\n    this._removeListeners();\n    this._cachedFocusableElements = [];\n\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n\n    // Restore focus to the trigger\n    const duration = this._getAnimationDuration();\n    this._animationTimeout = setTimeout(() => {\n      this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));\n      if (this._triggerElement && typeof this._triggerElement.focus === 'function') {\n        this._triggerElement.focus();\n      }\n      if (!this.contained) {\n        document.body.style.overflow = this._previousBodyOverflow;\n      }\n      this._restoreBackgroundContent();\n      this._triggerElement = null;\n    }, duration);\n  }"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  private _addListeners(): void {\n    this._overlayEl?.addEventListener('keydown', this._handleKeyDown);\n    document.addEventListener('keydown', this._handleKeyDown);\n  }\n\n  private _removeListeners(): void {\n    this._overlayEl?.removeEventListener('keydown', this._handleKeyDown);\n    document.removeEventListener('keydown', this._handleKeyDown);\n  }",
  "new_string": "  private _addListeners(): void {\n    document.addEventListener('keydown', this._handleKeyDown);\n  }\n\n  private _removeListeners(): void {\n    document.removeEventListener('keydown', this._handleKeyDown);\n  }"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "    const shadowActive = this.shadowRoot?.activeElement;\n    const active = (shadowActive ?? document.activeElement) as HTMLElement | null;",
  "new_string": "    const active = document.activeElement as HTMLElement | null;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "  // ─── Overlay Click ───",
  "new_string": "  // ─── Background Content Visibility ───\n\n  private _hideBackgroundContent(): void {\n    if (this.contained) return;\n    this._hiddenSiblings = [];\n    for (const child of Array.from(document.body.children)) {\n      if (child === this || child === this.parentElement) continue;\n      if (child.getAttribute('aria-hidden') === 'true') continue;\n      child.setAttribute('aria-hidden', 'true');\n      this._hiddenSiblings.push(child);\n    }\n  }\n\n  private _restoreBackgroundContent(): void {\n    for (const el of this._hiddenSiblings) {\n      el.removeAttribute('aria-hidden');\n    }\n    this._hiddenSiblings = [];\n  }\n\n  // ─── Overlay Click ───"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "        aria-labelledby=${this._hasLabelSlot ? this._titleId : nothing}\n        tabindex=\"-1\"",
  "new_string": "        aria-labelledby=${this._hasLabelSlot ? this._titleId : nothing}\n        aria-label=${!this._hasLabelSlot && this.label ? this.label : nothing}\n        tabindex=\"-1\""
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts",
  "old_string": "  :host([contained]) {\n    display: block;\n    position: relative;\n    overflow: hidden;\n  }\n\n  /* ─── Overlay ─── */",
  "new_string": "  :host([contained]) {\n    display: block;\n    position: relative;\n    overflow: hidden;\n  }\n\n  [hidden] {\n    display: none !important;\n  }\n\n  /* ─── Overlay ─── */"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts",
  "limit": 20
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Bash",
  "max_results": 1
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --project packages/hx-library/tsconfig.json 2>&1 | head -30",
  "description": "Type-check hx-library to verify edits compile",
  "timeout": 60000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "completed",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "completed",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "completed",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "completed",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "completed",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "completed",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "in_progress",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "pending",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Let me verify the changes and then update tests and stories in parallel.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts"
}
All fixes are applied correctly. Now let me update tests and add the Storybook story in parallel.

🔧 Tool: Agent
Input: {
  "description": "Update hx-drawer tests",
  "subagent_type": "qa-engineer-automation",
  "prompt": "You are updating the test file for hx-drawer at:\n`/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts`\n\nThe component was just audited and several fixes were applied. You need to ADD tests for the new behaviors. Do NOT change existing tests — only ADD new test cases.\n\nRead the test file first, then add these test sections:\n\n## 1. Body Scroll Lock (under a new `describe('Body Scroll Lock', ...)`)\n\n```ts\nit('locks body scroll when opened (non-contained)', async () => {\n  document.body.style.overflow = '';\n  const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n  el.open = true;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 50));\n  expect(document.body.style.overflow).toBe('hidden');\n  el.open = false;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 400));\n  expect(document.body.style.overflow).toBe('');\n});\n\nit('does not lock body scroll when contained', async () => {\n  document.body.style.overflow = '';\n  const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');\n  el.open = true;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 50));\n  expect(document.body.style.overflow).toBe('');\n});\n```\n\n## 2. Focus Restoration (under a new `describe('Focus Restoration', ...)`)\n\n```ts\nit('restores focus to trigger element on close', async () => {\n  const trigger = document.createElement('button');\n  trigger.textContent = 'Trigger';\n  document.body.appendChild(trigger);\n  trigger.focus();\n\n  const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n  el.open = true;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 50));\n\n  el.open = false;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 400));\n\n  expect(document.activeElement).toBe(trigger);\n  trigger.remove();\n});\n```\n\n## 3. Label Property (under a new `describe('Label Property', ...)`)\n\n```ts\nit('uses aria-label when label property is set and no label slot', async () => {\n  const el = await fixture<HelixDrawer>('<hx-drawer label=\"Patient Details\"></hx-drawer>');\n  await el.updateComplete;\n  const overlay = shadowQuery(el, '[part=\"overlay\"]');\n  expect(overlay?.getAttribute('aria-label')).toBe('Patient Details');\n  expect(overlay?.hasAttribute('aria-labelledby')).toBe(false);\n});\n\nit('prefers aria-labelledby over aria-label when label slot is populated', async () => {\n  const el = await fixture<HelixDrawer>(\n    '<hx-drawer label=\"Fallback\"><span slot=\"label\">Visible Title</span></hx-drawer>',\n  );\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 50));\n  const overlay = shadowQuery(el, '[part=\"overlay\"]');\n  expect(overlay?.hasAttribute('aria-labelledby')).toBe(true);\n  expect(overlay?.hasAttribute('aria-label')).toBe(false);\n});\n```\n\n## 4. Contained Mode (add to existing Contained describe)\n\n```ts\nit('uses position: absolute for overlay in contained mode', async () => {\n  const el = await fixture<HelixDrawer>('<hx-drawer contained open></hx-drawer>');\n  await el.updateComplete;\n  const overlay = shadowQuery<HTMLElement>(el, '[part=\"overlay\"]');\n  const style = overlay ? getComputedStyle(overlay) : null;\n  expect(style?.position).toBe('absolute');\n});\n```\n\n## 5. Animation Race Condition (new `describe('Animation Race Condition', ...)`)\n\n```ts\nit('does not fire stale hx-after-show after rapid open/close', async () => {\n  const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n  const events: string[] = [];\n  el.addEventListener('hx-after-show', () => events.push('hx-after-show'));\n  el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));\n\n  el.open = true;\n  await el.updateComplete;\n  // Close immediately (within animation duration)\n  el.open = false;\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 500));\n\n  // hx-after-show should NOT appear after hx-after-hide\n  const afterShowIdx = events.indexOf('hx-after-show');\n  const afterHideIdx = events.indexOf('hx-after-hide');\n  if (afterShowIdx !== -1 && afterHideIdx !== -1) {\n    expect(afterShowIdx).toBeLessThan(afterHideIdx);\n  }\n});\n```\n\n## 6. Overlay Part (add to existing CSS Parts describe)\n\n```ts\nit('exposes \"overlay\" part on the overlay container', async () => {\n  const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n  await el.updateComplete;\n  const part = shadowQuery(el, '[part=\"overlay\"]');\n  expect(part).toBeTruthy();\n  expect(part?.getAttribute('part')).toBe('overlay');\n});\n\nit('exposes \"footer\" part on the footer region', async () => {\n  const el = await fixture<HelixDrawer>(\n    '<hx-drawer><button slot=\"footer\">OK</button></hx-drawer>',\n  );\n  await el.updateComplete;\n  await new Promise((r) => setTimeout(r, 50));\n  const part = shadowQuery(el, '[part=\"footer\"]');\n  expect(part).toBeTruthy();\n  expect(part?.getAttribute('part')).toBe('footer');\n});\n```\n\nAdd ALL of these tests. The imports at the top already include everything needed (`fixture`, `shadowQuery`, `oneEvent`, `cleanup`, `checkA11y`, `page`). The type import for `HelixDrawer` is also present.\n\nIMPORTANT: Follow the EXACT patterns from the existing test file for indentation, style, and structure."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "old_string": "    it('exposes \"title\" part on the title element', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      await el.updateComplete;\n      const part = shadowQuery(el, '[part=\"title\"]');\n      expect(part).toBeTruthy();\n      expect(part?.getAttribute('part')).toBe('title');\n    });\n  });",
  "new_string": "    it('exposes \"title\" part on the title element', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      await el.updateComplete;\n      const part = shadowQuery(el, '[part=\"title\"]');\n      expect(part).toBeTruthy();\n      expect(part?.getAttribute('part')).toBe('title');\n    });\n\n    it('exposes \"overlay\" part on the overlay container', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      await el.updateComplete;\n      const part = shadowQuery(el, '[part=\"overlay\"]');\n      expect(part).toBeTruthy();\n      expect(part?.getAttribute('part')).toBe('overlay');\n    });\n\n    it('exposes \"footer\" part on the footer region', async () => {\n      const el = await fixture<HelixDrawer>(\n        '<hx-drawer><button slot=\"footer\">OK</button></hx-drawer>',\n      );\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n      const part = shadowQuery(el, '[part=\"footer\"]');\n      expect(part).toBeTruthy();\n      expect(part?.getAttribute('part')).toBe('footer');\n    });\n  });"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "old_string": "    it('contained attribute reflects on the element', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');\n      await el.updateComplete;\n      expect(el.contained).toBe(true);\n      expect(el.hasAttribute('contained')).toBe(true);\n    });\n  });",
  "new_string": "    it('contained attribute reflects on the element', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');\n      await el.updateComplete;\n      expect(el.contained).toBe(true);\n      expect(el.hasAttribute('contained')).toBe(true);\n    });\n\n    it('uses position: absolute for overlay in contained mode', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer contained open></hx-drawer>');\n      await el.updateComplete;\n      const overlay = shadowQuery<HTMLElement>(el, '[part=\"overlay\"]');\n      const style = overlay ? getComputedStyle(overlay) : null;\n      expect(style?.position).toBe('absolute');\n    });\n  });"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) (2) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations in closed state', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations in open state with label', async () => {\n      const el = await fixture<HelixDrawer>(\n        '<hx-drawer open><span slot=\"label\">Patient Info</span><p>Content</p></hx-drawer>',\n      );\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});",
  "new_string": "  // ─── Accessibility (axe-core) (2) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations in closed state', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations in open state with label', async () => {\n      const el = await fixture<HelixDrawer>(\n        '<hx-drawer open><span slot=\"label\">Patient Info</span><p>Content</p></hx-drawer>',\n      );\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n\n  // ─── Body Scroll Lock (2) ───\n\n  describe('Body Scroll Lock', () => {\n    it('locks body scroll when opened (non-contained)', async () => {\n      document.body.style.overflow = '';\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      el.open = true;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n      expect(document.body.style.overflow).toBe('hidden');\n      el.open = false;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 400));\n      expect(document.body.style.overflow).toBe('');\n    });\n\n    it('does not lock body scroll when contained', async () => {\n      document.body.style.overflow = '';\n      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');\n      el.open = true;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n      expect(document.body.style.overflow).toBe('');\n    });\n  });\n\n  // ─── Focus Restoration (1) ───\n\n  describe('Focus Restoration', () => {\n    it('restores focus to trigger element on close', async () => {\n      const trigger = document.createElement('button');\n      trigger.textContent = 'Trigger';\n      document.body.appendChild(trigger);\n      trigger.focus();\n\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      el.open = true;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n\n      el.open = false;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 400));\n\n      expect(document.activeElement).toBe(trigger);\n      trigger.remove();\n    });\n  });\n\n  // ─── Label Property (2) ───\n\n  describe('Label Property', () => {\n    it('uses aria-label when label property is set and no label slot', async () => {\n      const el = await fixture<HelixDrawer>(\n        '<hx-drawer label=\"Patient Details\"></hx-drawer>',\n      );\n      await el.updateComplete;\n      const overlay = shadowQuery(el, '[part=\"overlay\"]');\n      expect(overlay?.getAttribute('aria-label')).toBe('Patient Details');\n      expect(overlay?.hasAttribute('aria-labelledby')).toBe(false);\n    });\n\n    it('prefers aria-labelledby over aria-label when label slot is populated', async () => {\n      const el = await fixture<HelixDrawer>(\n        '<hx-drawer label=\"Fallback\"><span slot=\"label\">Visible Title</span></hx-drawer>',\n      );\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 50));\n      const overlay = shadowQuery(el, '[part=\"overlay\"]');\n      expect(overlay?.hasAttribute('aria-labelledby')).toBe(true);\n      expect(overlay?.hasAttribute('aria-label')).toBe(false);\n    });\n  });\n\n  // ─── Animation Race Condition (1) ───\n\n  describe('Animation Race Condition', () => {\n    it('does not fire stale hx-after-show after rapid open/close', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      const events: string[] = [];\n      el.addEventListener('hx-after-show', () => events.push('hx-after-show'));\n      el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));\n\n      el.open = true;\n      await el.updateComplete;\n      // Close immediately (within animation duration)\n      el.open = false;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 500));\n\n      // hx-after-show should NOT appear after hx-after-hide\n      const afterShowIdx = events.indexOf('hx-after-show');\n      const afterHideIdx = events.indexOf('hx-after-hide');\n      if (afterShowIdx !== -1 && afterHideIdx !== -1) {\n        expect(afterShowIdx).toBeLessThan(afterHideIdx);\n      }\n    });\n  });\n});"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "offset": 240
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "completed",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "completed",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "completed",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "completed",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "completed",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "completed",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "in_progress",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now let me add the missing Storybook story and update the AUDIT.md.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts",
  "offset": 240
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts",
  "old_string": "  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};",
  "new_string": "  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};\n\n/** Drawer with navigation content — demonstrates focus trap with multiple interactive elements. */\nexport const WithNavigationContent: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Navigation Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=\"start\"\n        size=${args.size}\n        label=\"Site Navigation\"\n      >\n        <span slot=\"label\">Navigation</span>\n        <nav>\n          <ul style=\"list-style: none; padding: 0; margin: 0;\">\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#dashboard\">Dashboard</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#patients\">Patients</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#appointments\">Appointments</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#records\">Records</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#settings\">Settings</a></li>\n          </ul>\n        </nav>\n        <button slot=\"footer\">Log Out</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    size: 'sm',\n  },\n};\n\n/** Drawer with a form — demonstrates focus trap with form inputs. */\nexport const WithForm: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Form Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=${args.placement}\n        size=${args.size}\n      >\n        <span slot=\"label\">Patient Details</span>\n        <form style=\"display: flex; flex-direction: column; gap: 1rem;\">\n          <label>\n            First Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Last Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Date of Birth\n            <input type=\"date\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Notes\n            <textarea rows=\"3\" style=\"display: block; width: 100%; padding: 0.5rem;\"></textarea>\n          </label>\n        </form>\n        <button slot=\"footer\">Cancel</button>\n        <button slot=\"footer\">Save Patient</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts",
  "old_string": "  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};\n",
  "new_string": "  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};\n\n/** Drawer with navigation content — demonstrates focus trap with multiple interactive elements. */\nexport const WithNavigationContent: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Navigation Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=\"start\"\n        size=${args.size}\n        label=\"Site Navigation\"\n      >\n        <span slot=\"label\">Navigation</span>\n        <nav>\n          <ul style=\"list-style: none; padding: 0; margin: 0;\">\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#dashboard\">Dashboard</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#patients\">Patients</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#appointments\">Appointments</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#records\">Records</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#settings\">Settings</a></li>\n          </ul>\n        </nav>\n        <button slot=\"footer\">Log Out</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    size: 'sm',\n  },\n};\n\n/** Drawer with a form — demonstrates focus trap with form inputs. */\nexport const WithForm: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Form Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=${args.placement}\n        size=${args.size}\n      >\n        <span slot=\"label\">Patient Details</span>\n        <form style=\"display: flex; flex-direction: column; gap: 1rem;\">\n          <label>\n            First Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Last Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Date of Birth\n            <input type=\"date\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Notes\n            <textarea rows=\"3\" style=\"display: block; width: 100%; padding: 0.5rem;\"></textarea>\n          </label>\n        </form>\n        <button slot=\"footer\">Cancel</button>\n        <button slot=\"footer\">Save Patient</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};\n"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts",
  "old_string": "        <button slot=\"footer\">Save</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};",
  "new_string": "        <button slot=\"footer\">Save</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};\n\n/** Drawer with navigation content — demonstrates focus trap with multiple interactive elements. */\nexport const WithNavigationContent: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Navigation Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=\"start\"\n        size=${args.size}\n        label=\"Site Navigation\"\n      >\n        <span slot=\"label\">Navigation</span>\n        <nav>\n          <ul style=\"list-style: none; padding: 0; margin: 0;\">\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#dashboard\">Dashboard</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#patients\">Patients</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#appointments\">Appointments</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#records\">Records</a></li>\n            <li style=\"margin-bottom: 0.5rem;\"><a href=\"#settings\">Settings</a></li>\n          </ul>\n        </nav>\n        <button slot=\"footer\">Log Out</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    size: 'sm',\n  },\n};\n\n/** Drawer with a form — demonstrates focus trap with form inputs. */\nexport const WithForm: Story = {\n  render: (args) => html`\n    <div>\n      <button\n        @click=${(e: Event) => {\n          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {\n            open: boolean;\n          };\n          if (host) host.open = true;\n        }}\n      >\n        Open Form Drawer\n      </button>\n      <hx-drawer\n        ?open=${args.open}\n        placement=${args.placement}\n        size=${args.size}\n      >\n        <span slot=\"label\">Patient Details</span>\n        <form style=\"display: flex; flex-direction: column; gap: 1rem;\">\n          <label>\n            First Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Last Name\n            <input type=\"text\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Date of Birth\n            <input type=\"date\" style=\"display: block; width: 100%; padding: 0.5rem;\" />\n          </label>\n          <label>\n            Notes\n            <textarea rows=\"3\" style=\"display: block; width: 100%; padding: 0.5rem;\"></textarea>\n          </label>\n        </form>\n        <button slot=\"footer\">Cancel</button>\n        <button slot=\"footer\">Save Patient</button>\n      </hx-drawer>\n    </div>\n  `,\n  args: {\n    open: false,\n    placement: 'end',\n    size: 'md',\n  },\n};"
}
Now let me build and run type-check to verify everything compiles.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "completed",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "completed",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "completed",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "completed",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "completed",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "completed",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "completed",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "in_progress",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Let me run the tests now.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-drawer/ 2>&1 | tail -80",
  "description": "Run hx-drawer tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests only",
  "timeout": 300000
}
One test failure — the animation race condition test logic is slightly wrong. The `hx-after-show` fires at index 1 but `hx-after-hide` at index 0 because the close timeout has already cleared the open timeout, but the `_openDrawer` callback from `updateComplete` still fires. Let me fix the test — the key assertion should verify `hx-after-show` does NOT fire after close.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "offset": 513,
  "limit": 30
}
The issue is a real bug — the `updateComplete.then()` callback in `_openDrawer` fires after `_closeDrawer` runs and sets a NEW timeout. I need to fix the component code, not just the test. The inner callbacks need to check if the drawer is still open.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.ts",
  "old_string": "    // Transition to open state\n    void this.updateComplete.then(() => {\n      this._isOpen = true;\n      this._addListeners();\n\n      // Set initial focus after next render\n      void this.updateComplete.then(() => {\n        this._cachedFocusableElements = this._getFocusableElements();\n        this._setInitialFocus();\n\n        // Dispatch hx-after-show after animation duration\n        const duration = this._getAnimationDuration();\n        this._animationTimeout = setTimeout(() => {\n          this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n        }, duration);\n      });\n    });",
  "new_string": "    // Transition to open state\n    void this.updateComplete.then(() => {\n      if (!this.open) return;\n      this._isOpen = true;\n      this._addListeners();\n\n      // Set initial focus after next render\n      void this.updateComplete.then(() => {\n        if (!this.open) return;\n        this._cachedFocusableElements = this._getFocusableElements();\n        this._setInitialFocus();\n\n        // Dispatch hx-after-show after animation duration\n        const duration = this._getAnimationDuration();\n        this._animationTimeout = setTimeout(() => {\n          this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n        }, duration);\n      });\n    });"
}
Now let me also fix the test assertion to be more precise — it should verify that `hx-after-show` does NOT fire after `hx-after-hide` at all:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts",
  "old_string": "    it('does not fire stale hx-after-show after rapid open/close', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      const events: string[] = [];\n      el.addEventListener('hx-after-show', () => events.push('hx-after-show'));\n      el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));\n\n      el.open = true;\n      await el.updateComplete;\n      // Close immediately (within animation duration)\n      el.open = false;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 500));\n\n      // hx-after-show should NOT appear after hx-after-hide\n      const afterShowIdx = events.indexOf('hx-after-show');\n      const afterHideIdx = events.indexOf('hx-after-hide');\n      if (afterShowIdx !== -1 && afterHideIdx !== -1) {\n        expect(afterShowIdx).toBeLessThan(afterHideIdx);\n      }\n    });",
  "new_string": "    it('does not fire stale hx-after-show after rapid open/close', async () => {\n      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');\n      const events: string[] = [];\n      el.addEventListener('hx-after-show', () => events.push('hx-after-show'));\n      el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));\n\n      el.open = true;\n      await el.updateComplete;\n      // Close immediately (within animation duration)\n      el.open = false;\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 500));\n\n      // After rapid open/close, hx-after-hide should fire but hx-after-show should not\n      expect(events).toContain('hx-after-hide');\n      expect(events).not.toContain('hx-after-show');\n    });"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests after race condition fix",
  "timeout": 300000
}
All 3109 tests pass, 79 test files. Now let me verify the build and run the verify command.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
All gates pass. Let me check the diff and update the AUDIT.md.

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Check files changed"
}
Only intended files changed (plus screenshot PNGs from test runs, which is expected). Now let me update the AUDIT.md with resolution status.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "completed",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "completed",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "completed",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "completed",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "completed",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "completed",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "completed",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "in_progress",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "completed",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-drawer/packages/hx-library/src/components/hx-drawer/AUDIT.md",
  "old_string": "**Total: 1 P0, 6 P1, 5 P2, 3 P3 — Merge BLOCKED pending P0 and P1 resolution.**",
  "new_string": "**Total: 1 P0, 6 P1, 5 P2, 3 P3 — Merge BLOCKED pending P0 and P1 resolution.**\n\n---\n\n## Deep Audit v2 — Resolution Status\n\n**Auditor:** Deep Audit v2 Agent\n**Branch:** `feature/deep-audit-v2-hx-drawer`\n\n### Resolved Issues\n\n| ID    | Severity | Status       | Resolution                                                                         |\n| ----- | -------- | ------------ | ---------------------------------------------------------------------------------- |\n| P0-01 | P0       | **FIXED**    | Body scroll lock implemented. `overflow: hidden` on open, restore on close. Skipped for `contained` mode. Tests added. |\n| P1-01 | P1       | **FIXED**    | Removed duplicate `_overlayEl` keydown listener. Only `document` listener remains. |\n| P1-02 | P1       | **FIXED**    | `_trapFocus` now uses `document.activeElement` directly instead of unreliable `shadowRoot.activeElement`. |\n| P1-03 | P1       | **FIXED**    | `_hideBackgroundContent()` / `_restoreBackgroundContent()` set `aria-hidden=\"true\"` on siblings. Skipped for `contained`. |\n| P1-04 | P1       | **DEFERRED** | Drupal behaviors file — separate feature scope. Not part of component audit.       |\n| P1-05 | P1       | **FIXED**    | `clearTimeout` at start of both `_openDrawer` and `_closeDrawer`. Guard checks `this.open` in async callbacks. |\n| P1-06 | P1       | **FIXED**    | Added `label` property with `@attr`. Renders `aria-label` when no label slot is present. |\n| P2-01 | P2       | **FIXED**    | `size` typed as `string` with JSDoc documenting valid values. `DrawerSize` retained for internal size map. |\n| P2-02 | P2       | Documented   | `close-button` part name kept — more readable than `close-btn`. Spec should be updated. |\n| P2-03 | P2       | **FIXED**    | Added `[hidden] { display: none !important; }` to styles.                          |\n| P2-04 | P2       | **FIXED**    | `_triggerElement` now uses `instanceof HTMLElement` guard.                          |\n| P2-05 | P2       | **FIXED**    | Added `WithNavigationContent` and `WithForm` Storybook stories.                    |\n| P3-01 | P3       | **FIXED**    | Removed redundant `firstUpdated()` slot detection.                                 |\n| P3-02 | P3       | Documented   | `void` promise pattern — low risk inside Shadow DOM lifecycle.                     |\n| P3-03 | P3       | **FIXED**    | Resolved by P1-01 (overlay listener removed).                                     |\n\n### New Tests Added (9 test cases)\n\n- Body scroll lock (non-contained) — open locks, close restores\n- Body scroll lock skipped for `contained` mode\n- Focus restoration to trigger element on close\n- `label` property renders `aria-label` when no label slot\n- `aria-labelledby` preferred over `aria-label` when label slot populated\n- Contained mode uses `position: absolute` for overlay\n- Animation race condition — rapid open/close does not fire stale events\n- CSS part: `overlay`\n- CSS part: `footer`\n\n### Verification\n\n- `npm run verify` — 0 errors (lint + format:check + type-check)\n- `npm run test:library` — 3109 tests pass, 79 test files\n- All hx-drawer tests pass (42 test cases)"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and assess hx-drawer component files",
      "status": "completed",
      "activeForm": "Reading hx-drawer component files"
    },
    {
      "content": "Run wc-mcp diagnostics (score, accessibility, parts, events, slots)",
      "status": "completed",
      "activeForm": "Running wc-mcp diagnostics"
    },
    {
      "content": "Fix P0-01: Body scroll lock",
      "status": "completed",
      "activeForm": "Fixing body scroll lock"
    },
    {
      "content": "Fix P1-01: Remove duplicate keydown listener",
      "status": "completed",
      "activeForm": "Fixing duplicate keydown listener"
    },
    {
      "content": "Fix P1-02: Focus trap for slotted elements",
      "status": "completed",
      "activeForm": "Fixing focus trap"
    },
    {
      "content": "Fix P1-03: Background aria-hidden on open",
      "status": "completed",
      "activeForm": "Fixing background aria-hidden"
    },
    {
      "content": "Fix P1-05: Animation timeout race condition",
      "status": "completed",
      "activeForm": "Fixing animation timeout race"
    },
    {
      "content": "Fix P1-06: Accessible name when label empty",
      "status": "completed",
      "activeForm": "Fixing accessible name fallback"
    },
    {
      "content": "Fix P2 issues (type collapse, hidden CSS, instanceof guard, redundant firstUpdated)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Update tests for new behaviors",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Add missing Storybook story (WithNavigationContent)",
      "status": "completed",
      "activeForm": "Adding Storybook story"
    },
    {
      "content": "Update AUDIT.md with resolution status",
      "status": "completed",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "completed",
      "activeForm": "Building and verifying"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-drawer

### Changes Implemented

**Fixed 11 of 15 audit issues (all P0 + 5/6 P1 + 4/5 P2 + 2/3 P3):**

- **P0-01 FIXED**: Body scroll lock — `document.body.style.overflow = 'hidden'` on open, restored on close. Skipped for `contained` mode.
- **P1-01 FIXED**: Removed duplicate `_overlayEl` keydown listener; only `document` listener remains.
- **P1-02 FIXED**: Focus trap now uses `document.activeElement` directly for reliable slotted element detection.
- **P1-03 FIXED**: Background siblings get `aria-hidden="true"` when drawer opens (skipped for `contained`).
- **P1-05 FIXED**: `clearTimeout` at start of both `_openDrawer`/`_closeDrawer` + guard checks `this.open` in async callbacks to prevent stale events.
- **P1-06 FIXED**: Added `label` property with `@attr`. Renders `aria-label` fallback when no label slot is present.
- **P2-01 FIXED**: `size` typed as `string` with JSDoc documenting valid values.
- **P2-03 FIXED**: Added `[hidden] { display: none !important; }` to styles.
- **P2-04 FIXED**: `_triggerElement` uses `instanceof HTMLElement` guard.
- **P2-05 FIXED**: Added `WithNavigationContent` and `WithForm` Storybook stories.
- **P3-01 FIXED**: Removed redundant `firstUpdated()` slot detection.

**Deferred:**
- P1-04: Drupal behaviors file — separate feature scope
- P2-02: `close-button` part name kept (more readable, spec should update)
- P3-02: `void` promise pattern — low risk

### Files Modified
- `packages/hx-library/src/components/hx-drawer/hx-drawer.ts` — Core fixes (scroll lock, focus trap, aria-hidden, race condition, label property, instanceof guard)
- `packages/hx-library/src/components/hx-drawer/hx-drawer.styles.ts` — Added `[hidden]` CSS override
- `packages/hx-library/src/components/hx-drawer/hx-drawer.test.ts` — Added 9 new test cases (42 total)
- `packages/hx-library/src/components/hx-drawer/hx-drawer.stories.ts` — Added WithNavigationContent, WithForm stories
- `packages/hx-library/src/components/hx-drawer/AUDIT.md` — Updated with resolution status

### Verification Status
- `npm run verify` — 0 errors (lint + format:check + type-check all pass)
- `npm run test:library` — **3109 tests pass**, 79 test files, 0 failures
- All 42 hx-drawer tests pass including 9 new tests

### Risks/Blockers Encountered
- Animation race condition test initially failed — the `updateComplete.then()` callbacks in `_openDrawer` needed guard checks (`if (!this.open) return`) to prevent stale timeouts after rapid open/close. Fixed in both component and test.

### Learnings
- `shadowRoot.activeElement` returns the `<slot>` element for light DOM focus, not the actual focused element. Always use `document.activeElement` for focus trap boundary detection.
- Chained `updateComplete.then()` callbacks create a race condition window — always guard with state checks when the component's state could have changed between scheduling and execution.

### Notes for Developer
- P1-04 (Drupal behaviors file) should be a separate feature ticket
- The `label` property is a new public API addition — CEM will pick it up automatically via `@attr` JSDoc
</summary>