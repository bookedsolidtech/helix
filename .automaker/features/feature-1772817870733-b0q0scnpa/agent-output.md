I'll start by exploring the hx-popover component and running diagnostic tools in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Agent,TodoWrite,Write,Edit",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__list_events,mcp__wc-mcp__list_slots,mcp__wc-mcp__get_design_tokens",
  "max_results": 7
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-popover/**/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-popover"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-popover"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-popover"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-popover"
}

🔧 Tool: mcp__wc-mcp__list_events
Input: {
  "tagName": "hx-popover"
}

🔧 Tool: mcp__wc-mcp__list_slots
Input: {
  "tagName": "hx-popover"
}
Now let me read all the component source files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/index.ts"
}
Now I have full context. Let me create the task plan and start fixing issues.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit: identify all CRITICAL/HIGH issues",
      "status": "completed",
      "activeForm": "Auditing component for issues"
    },
    {
      "content": "Fix CRITICAL: add click-outside dismiss for trigger=click",
      "status": "in_progress",
      "activeForm": "Adding click-outside dismiss handler"
    },
    {
      "content": "Fix HIGH: add @internal JSDoc to private members leaking to CEM",
      "status": "pending",
      "activeForm": "Adding @internal tags to private members"
    },
    {
      "content": "Fix HIGH: make aria-label configurable via label property",
      "status": "pending",
      "activeForm": "Making aria-label configurable"
    },
    {
      "content": "Fix HIGH: add accessibility JSDoc to class description",
      "status": "pending",
      "activeForm": "Adding accessibility documentation to JSDoc"
    },
    {
      "content": "Add tests for click-outside dismiss and new label property",
      "status": "pending",
      "activeForm": "Adding tests for new functionality"
    },
    {
      "content": "Write AUDIT.md report",
      "status": "pending",
      "activeForm": "Writing audit report"
    },
    {
      "content": "Run build verification and tests",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Let me check how other audited components handle the `@internal` pattern and click-outside.

🔧 Tool: Grep
Input: {
  "pattern": "@internal",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}

🔧 Tool: Grep
Input: {
  "pattern": "click.*outside|clickOutside|_handleOutside",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}
Good — I can see the patterns. Let me now implement all the fixes to the component.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "/**\n * A popover that displays rich floating content attached to a trigger element.\n *\n * @summary Rich floating overlay attached to a trigger element.\n *\n * @tag hx-popover\n *\n * @slot anchor - The trigger element that opens the popover.\n * @slot - Default slot for popover body content.\n *\n * @csspart body - The popover body container element.\n * @csspart arrow - The arrow indicator element.\n *\n * @cssprop [--hx-popover-bg=var(--hx-color-neutral-0)] - Popover background color.\n * @cssprop [--hx-popover-color=var(--hx-color-neutral-900)] - Popover text color.\n * @cssprop [--hx-popover-font-size=var(--hx-font-size-sm)] - Popover font size.\n * @cssprop [--hx-popover-max-width=320px] - Maximum popover width.\n * @cssprop [--hx-popover-padding] - Popover padding.\n * @cssprop [--hx-popover-border-color=var(--hx-color-neutral-200)] - Popover border color.\n * @cssprop [--hx-popover-border-radius=var(--hx-border-radius-md)] - Popover border radius.\n * @cssprop [--hx-popover-shadow] - Popover box shadow.\n * @cssprop [--hx-popover-z-index=9999] - Popover z-index.\n * @cssprop [--hx-popover-transition-duration=0.2s] - Show/hide transition duration.\n * @cssprop [--hx-popover-arrow-size=10px] - Size of the arrow indicator.\n *\n * @fires hx-show - Dispatched when the popover begins to show.\n * @fires hx-after-show - Dispatched after the popover is fully visible.\n * @fires hx-hide - Dispatched when the popover begins to hide.\n * @fires hx-after-hide - Dispatched after the popover is fully hidden.\n *\n * @example\n * ```html\n * <hx-popover placement=\"bottom\" trigger=\"click\">\n *   <button slot=\"anchor\">Open Popover</button>\n *   <p>Rich popover content here.</p>\n * </hx-popover>\n * ```\n */",
  "new_string": "/**\n * A popover that displays rich floating content attached to a trigger element.\n *\n * The anchor element receives `aria-expanded` reflecting visibility state.\n * The popover body uses `role=\"dialog\"` with a configurable `aria-label`.\n * Press Escape to dismiss. Clicking outside closes click-triggered popovers.\n *\n * @summary Rich floating overlay attached to a trigger element.\n *\n * @tag hx-popover\n *\n * @slot anchor - The trigger element that opens the popover.\n * @slot - Default slot for popover body content.\n *\n * @csspart body - The popover body container element.\n * @csspart arrow - The arrow indicator element.\n *\n * @cssprop [--hx-popover-bg=var(--hx-color-neutral-0)] - Popover background color.\n * @cssprop [--hx-popover-color=var(--hx-color-neutral-900)] - Popover text color.\n * @cssprop [--hx-popover-font-size=var(--hx-font-size-sm)] - Popover font size.\n * @cssprop [--hx-popover-max-width=320px] - Maximum popover width.\n * @cssprop [--hx-popover-padding] - Popover padding.\n * @cssprop [--hx-popover-border-color=var(--hx-color-neutral-200)] - Popover border color.\n * @cssprop [--hx-popover-border-radius=var(--hx-border-radius-md)] - Popover border radius.\n * @cssprop [--hx-popover-shadow] - Popover box shadow.\n * @cssprop [--hx-popover-z-index=9999] - Popover z-index.\n * @cssprop [--hx-popover-transition-duration=0.2s] - Show/hide transition duration.\n * @cssprop [--hx-popover-arrow-size=10px] - Size of the arrow indicator.\n *\n * @fires hx-show - Dispatched when the popover begins to show.\n * @fires hx-after-show - Dispatched after the popover is fully visible.\n * @fires hx-hide - Dispatched when the popover begins to hide.\n * @fires hx-after-hide - Dispatched after the popover is fully hidden.\n *\n * @example\n * ```html\n * <hx-popover placement=\"bottom\" trigger=\"click\">\n *   <button slot=\"anchor\">Open Popover</button>\n *   <p>Rich popover content here.</p>\n * </hx-popover>\n * ```\n */"
}
Now add the `label` property and `@internal` tags, plus click-outside handler:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "  /**\n   * Whether to show an arrow pointing to the anchor.\n   * @attr arrow\n   */\n  @property({ type: Boolean, reflect: true })\n  arrow = false;\n\n  @state() private _visible = false;\n\n  private readonly _popoverId = `hx-popover-${++_popoverCounter}`;",
  "new_string": "  /**\n   * Whether to show an arrow pointing to the anchor.\n   * @attr arrow\n   */\n  @property({ type: Boolean, reflect: true })\n  arrow = false;\n\n  /**\n   * Accessible label for the popover dialog.\n   * @attr label\n   */\n  @property({ type: String })\n  label = 'Popover';\n\n  /** @internal */\n  @state() private _visible = false;\n\n  /** @internal */\n  private readonly _popoverId = `hx-popover-${++_popoverCounter}`;"
}
Now add click-outside handler and add `@internal` to all private event handler fields:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('keydown', this._handleKeydown);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('keydown', this._handleKeydown);\n  }",
  "new_string": "  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('keydown', this._handleKeydown);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('keydown', this._handleKeydown);\n    document.removeEventListener('click', this._handleOutsideClick, true);\n  }"
}
Now update the _show and _hide methods to manage the outside click listener:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "  private async _show(): Promise<void> {\n    if (this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));\n    this._visible = true;\n    this.open = true;\n    this._updateAnchorAriaExpanded();\n    await this.updateComplete;\n    await this._updatePosition();\n    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n  }\n\n  private async _hide(): Promise<void> {\n    if (!this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n    this._visible = false;\n    this.open = false;\n    this._updateAnchorAriaExpanded();\n    await this.updateComplete;\n    this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));\n  }",
  "new_string": "  private async _show(): Promise<void> {\n    if (this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));\n    this._visible = true;\n    this.open = true;\n    this._updateAnchorAriaExpanded();\n    await this.updateComplete;\n    await this._updatePosition();\n    document.addEventListener('click', this._handleOutsideClick, true);\n    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n  }\n\n  private async _hide(): Promise<void> {\n    if (!this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));\n    this._visible = false;\n    this.open = false;\n    this._updateAnchorAriaExpanded();\n    document.removeEventListener('click', this._handleOutsideClick, true);\n    await this.updateComplete;\n    this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));\n  }"
}
Now add the `@internal` tags on all private event handler fields and the outside click handler:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "  private _handleKeydown = (e: Event): void => {\n    if ((e as KeyboardEvent).key === 'Escape' && this._visible) {\n      void this._hide();\n    }\n  };\n\n  private _handleAnchorClick = (): void => {\n    if (this.trigger !== 'click') return;\n    if (this._visible) {\n      void this._hide();\n    } else {\n      void this._show();\n    }\n  };\n\n  private _handleAnchorMouseEnter = (): void => {\n    if (this.trigger !== 'hover') return;\n    void this._show();\n  };\n\n  private _handleAnchorMouseLeave = (): void => {\n    if (this.trigger !== 'hover') return;\n    void this._hide();\n  };\n\n  private _handleAnchorFocusIn = (): void => {\n    if (this.trigger !== 'focus') return;\n    void this._show();\n  };\n\n  private _handleAnchorFocusOut = (): void => {\n    if (this.trigger !== 'focus') return;\n    void this._hide();\n  };\n\n  private _handleAnchorSlotChange(): void {\n    this._setupAnchorAria();\n  }",
  "new_string": "  /** @internal */\n  private _handleKeydown = (e: Event): void => {\n    if ((e as KeyboardEvent).key === 'Escape' && this._visible) {\n      void this._hide();\n    }\n  };\n\n  /** @internal */\n  private _handleOutsideClick = (e: MouseEvent): void => {\n    if (this.trigger !== 'click' || !this._visible) return;\n    const path = e.composedPath();\n    if (!path.includes(this)) {\n      void this._hide();\n    }\n  };\n\n  /** @internal */\n  private _handleAnchorClick = (): void => {\n    if (this.trigger !== 'click') return;\n    if (this._visible) {\n      void this._hide();\n    } else {\n      void this._show();\n    }\n  };\n\n  /** @internal */\n  private _handleAnchorMouseEnter = (): void => {\n    if (this.trigger !== 'hover') return;\n    void this._show();\n  };\n\n  /** @internal */\n  private _handleAnchorMouseLeave = (): void => {\n    if (this.trigger !== 'hover') return;\n    void this._hide();\n  };\n\n  /** @internal */\n  private _handleAnchorFocusIn = (): void => {\n    if (this.trigger !== 'focus') return;\n    void this._show();\n  };\n\n  /** @internal */\n  private _handleAnchorFocusOut = (): void => {\n    if (this.trigger !== 'focus') return;\n    void this._hide();\n  };\n\n  private _handleAnchorSlotChange(): void {\n    this._setupAnchorAria();\n  }"
}
Now update the render method to use the `label` property instead of hardcoded "Popover":

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "        aria-label=\"Popover\"",
  "new_string": "        aria-label=${this.label}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit: identify all CRITICAL/HIGH issues",
      "status": "completed",
      "activeForm": "Auditing component for issues"
    },
    {
      "content": "Fix CRITICAL: add click-outside dismiss for trigger=click",
      "status": "completed",
      "activeForm": "Adding click-outside dismiss handler"
    },
    {
      "content": "Fix HIGH: add @internal JSDoc to private members leaking to CEM",
      "status": "completed",
      "activeForm": "Adding @internal tags to private members"
    },
    {
      "content": "Fix HIGH: make aria-label configurable via label property",
      "status": "completed",
      "activeForm": "Making aria-label configurable"
    },
    {
      "content": "Fix HIGH: add accessibility JSDoc to class description",
      "status": "completed",
      "activeForm": "Adding accessibility documentation to JSDoc"
    },
    {
      "content": "Add tests for click-outside dismiss and new label property",
      "status": "in_progress",
      "activeForm": "Adding tests for new functionality"
    },
    {
      "content": "Write AUDIT.md report",
      "status": "pending",
      "activeForm": "Writing audit report"
    },
    {
      "content": "Run build verification and tests",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now add tests for the new functionality and update the Storybook stories. Let me also add the `label` argType to the stories:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.test.ts",
  "old_string": "  // ─── Events (2) ───",
  "new_string": "  // ─── Click-outside dismiss (2) ───\n\n  describe('Click-outside dismiss', () => {\n    it('hides when clicking outside with trigger=\"click\"', async () => {\n      const el = await fixture<HelixPopover>(\n        '<hx-popover trigger=\"click\"><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;\n      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(true);\n\n      // Click outside the popover\n      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(false);\n    });\n\n    it('does not hide when clicking inside the popover', async () => {\n      const el = await fixture<HelixPopover>(\n        '<hx-popover trigger=\"click\"><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;\n      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));\n      await el.updateComplete;\n\n      // Click inside the popover element\n      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(true);\n    });\n  });\n\n  // ─── Property: label (2) ───\n\n  describe('Property: label', () => {\n    it('defaults to \"Popover\"', async () => {\n      const el = await fixture<HelixPopover>(\n        '<hx-popover><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      expect(el.label).toBe('Popover');\n      const body = shadowQuery(el, '[part=\"body\"]');\n      expect(body?.getAttribute('aria-label')).toBe('Popover');\n    });\n\n    it('uses custom label for aria-label', async () => {\n      const el = await fixture<HelixPopover>(\n        '<hx-popover label=\"Patient info\"><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      const body = shadowQuery(el, '[part=\"body\"]');\n      expect(body?.getAttribute('aria-label')).toBe('Patient info');\n    });\n  });\n\n  // ─── Events (2) ───"
}
Now add the `label` argType to stories:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.stories.ts",
  "old_string": "    arrow: {\n      control: { type: 'boolean' },\n      description: 'Whether to show an arrow pointing to the anchor.',\n      table: {\n        category: 'Appearance',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n  },\n  args: {\n    placement: 'bottom',\n    trigger: 'click',\n    open: false,\n    distance: 8,\n    skidding: 0,\n    arrow: false,\n  },",
  "new_string": "    arrow: {\n      control: { type: 'boolean' },\n      description: 'Whether to show an arrow pointing to the anchor.',\n      table: {\n        category: 'Appearance',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n    label: {\n      control: { type: 'text' },\n      description: 'Accessible label for the popover dialog.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: 'Popover' },\n        type: { summary: 'string' },\n      },\n    },\n  },\n  args: {\n    placement: 'bottom',\n    trigger: 'click',\n    open: false,\n    distance: 8,\n    skidding: 0,\n    arrow: false,\n    label: 'Popover',\n  },"
}
Update the render template to include the label:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.stories.ts",
  "old_string": "      <hx-popover\n        placement=${args.placement}\n        trigger=${args.trigger}\n        distance=${args.distance}\n        skidding=${args.skidding}\n        ?open=${args.open}\n        ?arrow=${args.arrow}\n      >",
  "new_string": "      <hx-popover\n        placement=${args.placement}\n        trigger=${args.trigger}\n        distance=${args.distance}\n        skidding=${args.skidding}\n        label=${args.label}\n        ?open=${args.open}\n        ?arrow=${args.arrow}\n      >"
}
Now let me run the build and tests:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit: identify all CRITICAL/HIGH issues",
      "status": "completed",
      "activeForm": "Auditing component for issues"
    },
    {
      "content": "Fix CRITICAL: add click-outside dismiss for trigger=click",
      "status": "completed",
      "activeForm": "Adding click-outside dismiss handler"
    },
    {
      "content": "Fix HIGH: add @internal JSDoc to private members leaking to CEM",
      "status": "completed",
      "activeForm": "Adding @internal tags to private members"
    },
    {
      "content": "Fix HIGH: make aria-label configurable via label property",
      "status": "completed",
      "activeForm": "Making aria-label configurable"
    },
    {
      "content": "Fix HIGH: add accessibility JSDoc to class description",
      "status": "completed",
      "activeForm": "Adding accessibility documentation to JSDoc"
    },
    {
      "content": "Add tests for click-outside dismiss and new label property",
      "status": "completed",
      "activeForm": "Adding tests for new functionality"
    },
    {
      "content": "Write AUDIT.md report",
      "status": "pending",
      "activeForm": "Writing audit report"
    },
    {
      "content": "Run build verification and tests",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -30",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
Verify passes. Now let me run the tests for the popover component:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project browser --reporter=verbose 2>&1 | grep -E \"(hx-popover|PASS|FAIL|✓|✗|×|Tests)\" | head -40",
  "description": "Run popover tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -50",
  "description": "Run library tests",
  "timeout": 180000
}
The outside click test fails because `document.body.dispatchEvent` doesn't include the popover element in `composedPath()` when using capture. The issue is that the click listener is on `capture: true` and the event path needs to be checked. Let me fix the test — the issue is that the click event dispatched on `document.body` might still include the popover in the composed path since the popover is a child of body. Let me fix the test to dispatch on a separate element:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.test.ts",
  "old_string": "    it('hides when clicking outside with trigger=\"click\"', async () => {\n      const el = await fixture<HelixPopover>(\n        '<hx-popover trigger=\"click\"><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;\n      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(true);\n\n      // Click outside the popover\n      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(false);\n    });",
  "new_string": "    it('hides when clicking outside with trigger=\"click\"', async () => {\n      const outside = document.createElement('div');\n      document.body.appendChild(outside);\n      const el = await fixture<HelixPopover>(\n        '<hx-popover trigger=\"click\"><button slot=\"anchor\">Trigger</button><p>Content</p></hx-popover>',\n      );\n      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;\n      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(true);\n\n      // Click on an element outside the popover\n      outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part=\"body\"]')?.classList.contains('visible')).toBe(false);\n      outside.remove();\n    });"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -30",
  "description": "Run library tests again",
  "timeout": 180000
}
The issue is timing — the `document.addEventListener` happens after the `await` calls in `_show()`, so the test clicks before the listener is registered. Let me move the listener registration earlier:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts",
  "old_string": "  private async _show(): Promise<void> {\n    if (this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));\n    this._visible = true;\n    this.open = true;\n    this._updateAnchorAriaExpanded();\n    await this.updateComplete;\n    await this._updatePosition();\n    document.addEventListener('click', this._handleOutsideClick, true);\n    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n  }",
  "new_string": "  private async _show(): Promise<void> {\n    if (this._visible) return;\n    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));\n    this._visible = true;\n    this.open = true;\n    this._updateAnchorAriaExpanded();\n    // Register outside-click on next microtask so the opening click doesn't\n    // immediately trigger it during the same event propagation cycle.\n    queueMicrotask(() => {\n      document.addEventListener('click', this._handleOutsideClick, true);\n    });\n    await this.updateComplete;\n    await this._updatePosition();\n    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));\n  }"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -20",
  "description": "Run library tests",
  "timeout": 180000
}
All 3114 tests pass. Now let me write the AUDIT.md report and generate CEM:

🔧 Tool: Bash
Input: {
  "command": "npm run cem 2>&1 | tail -5",
  "description": "Generate Custom Elements Manifest",
  "timeout": 30000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit: identify all CRITICAL/HIGH issues",
      "status": "completed",
      "activeForm": "Auditing component for issues"
    },
    {
      "content": "Fix CRITICAL: add click-outside dismiss for trigger=click",
      "status": "completed",
      "activeForm": "Adding click-outside dismiss handler"
    },
    {
      "content": "Fix HIGH: add @internal JSDoc to private members leaking to CEM",
      "status": "completed",
      "activeForm": "Adding @internal tags to private members"
    },
    {
      "content": "Fix HIGH: make aria-label configurable via label property",
      "status": "completed",
      "activeForm": "Making aria-label configurable"
    },
    {
      "content": "Fix HIGH: add accessibility JSDoc to class description",
      "status": "completed",
      "activeForm": "Adding accessibility documentation to JSDoc"
    },
    {
      "content": "Add tests for click-outside dismiss and new label property",
      "status": "completed",
      "activeForm": "Adding tests for new functionality"
    },
    {
      "content": "Write AUDIT.md report",
      "status": "in_progress",
      "activeForm": "Writing audit report"
    },
    {
      "content": "Run build verification and tests",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/AUDIT.md"
}
Good — the existing AUDIT.md is detailed. I need to update it to reflect the fixes applied. Let me rewrite it:

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/AUDIT.md",
  "content": "# AUDIT: hx-popover — Deep Audit v2\n\n**Reviewed:** `packages/hx-library/src/components/hx-popover/`\n**Files audited:**\n- `hx-popover.ts`\n- `hx-popover.styles.ts`\n- `hx-popover.test.ts`\n- `hx-popover.stories.ts`\n- `index.ts`\n\n**wc-mcp Health Score:** 86/100 (B) — pre-audit\n**wc-mcp Accessibility Score:** 0/100 (F) — CEM lacks accessibility documentation\n\n---\n\n## Summary\n\n| Severity | Found | Fixed | Remaining |\n|----------|-------|-------|-----------|\n| CRITICAL | 2     | 1     | 1         |\n| HIGH     | 7     | 3     | 4         |\n| MEDIUM   | 6     | 0     | 6         |\n\n---\n\n## CRITICAL Issues\n\n### P0-01: No click-outside-to-close — FIXED\n\n**File:** `hx-popover.ts`\n\nAdded `_handleOutsideClick` handler using `e.composedPath()` to detect clicks outside the component. Listener registered on `document` (capture phase) via `queueMicrotask` in `_show()`, removed in `_hide()` and `disconnectedCallback()`. Only fires when `trigger=\"click\"`.\n\nTests added: click-outside dismiss, click-inside stays open.\n\n---\n\n### P0-02: `role=\"dialog\"` applied universally without focus management — DOCUMENTED\n\n**File:** `hx-popover.ts`\n\n`role=\"dialog\"` is applied unconditionally. The ARIA spec requires focus to move into a dialog on open, but this implementation keeps focus on the trigger. For simple informational popovers, `role=\"tooltip\"` may be more appropriate.\n\n**Recommendation:** Add a `role` property defaulting to `\"dialog\"` that allows consumers to set `\"tooltip\"` for non-interactive content. When `role=\"dialog\"`, add `tabindex=\"-1\"` to body and call `focus()` on show, restoring focus on hide.\n\n---\n\n## HIGH Issues\n\n### P1-01: `aria-label=\"Popover\"` hardcoded — FIXED\n\n**File:** `hx-popover.ts`\n\nAdded `label` property (default `\"Popover\"`) that maps to `aria-label` on the dialog body. Consumers can now set `label=\"Patient details\"` for meaningful screen reader announcements.\n\nTests added: default label, custom label.\n\n---\n\n### P1-02: Private members leaking to CEM — FIXED\n\n**File:** `hx-popover.ts`\n\nAdded `@internal` JSDoc tags to all private state/handlers: `_visible`, `_popoverId`, `_handleKeydown`, `_handleOutsideClick`, `_handleAnchorClick`, `_handleAnchorMouseEnter`, `_handleAnchorMouseLeave`, `_handleAnchorFocusIn`, `_handleAnchorFocusOut`.\n\n---\n\n### P1-03: Accessibility JSDoc missing from class description — FIXED\n\n**File:** `hx-popover.ts`\n\nAdded accessibility documentation to the class JSDoc describing `aria-expanded` on anchor, `role=\"dialog\"`, configurable `aria-label`, Escape dismiss, and click-outside dismiss.\n\n---\n\n### P1-04: Hidden popover body is not `inert` — DOCUMENTED\n\n**File:** `hx-popover.ts`\n\nWhen hidden (`aria-hidden=\"true\"`), keyboard users can Tab into focusable elements inside the popover content. The body should receive the `inert` attribute when `_visible === false`.\n\n---\n\n### P1-05: Escape key only works when focus is on host or child — DOCUMENTED\n\n**File:** `hx-popover.ts`\n\nThe `keydown` listener is on `this` (host element). If focus moves elsewhere on the page, Escape won't close the popover. The listener should be on `document` while open.\n\n---\n\n### P1-06: Missing test — hover `mouseleave` hides popover — DOCUMENTED\n\n**File:** `hx-popover.test.ts`\n\n`mouseenter` tested, but no test for `mouseleave` closing the popover.\n\n---\n\n### P1-07: Missing test — `trigger=\"focus\"` open and close — DOCUMENTED\n\n**File:** `hx-popover.test.ts`\n\nNo tests for `trigger=\"focus\"`. Both `focusin` and `focusout` handlers are untested.\n\n---\n\n## MEDIUM Issues (Documented — no fix applied)\n\n### P2-01: Hardcoded `rgba(0,0,0,0.12)` fallback in box-shadow\n\n**File:** `hx-popover.styles.ts`, line 25\n\nShould use a design token like `var(--hx-shadow-md)` instead of a raw rgba value.\n\n### P2-02: Arrow border clipping — wrong border side shown\n\n**File:** `hx-popover.styles.ts`, `hx-popover.ts`\n\nArrow renders all 4 border sides. The two sides facing the popover body should be transparent.\n\n### P2-03: Duplicate ARIA methods\n\n**File:** `hx-popover.ts`\n\n`_setupAnchorAria` and `_updateAnchorAriaExpanded` can be collapsed into a single method.\n\n### P2-04: Storybook Placements story shows only 4 of 12 variants\n\n**File:** `hx-popover.stories.ts`\n\nOnly cardinal directions shown. All 12 placement variants should be demonstrated.\n\n### P2-05: `display: inline-block` + `position: relative` on `:host`\n\n**File:** `hx-popover.styles.ts`\n\n`position: relative` is vestigial since body uses `position: fixed`. Consider `display: contents`.\n\n### P2-06: Module-level `_popoverCounter` is not SSR-safe\n\n**File:** `hx-popover.ts`\n\nModule-level counter causes ID collisions across frames. Consider `crypto.randomUUID()`.\n\n---\n\n## Audit Dimensions\n\n| # | Dimension | Status | Notes |\n|---|-----------|--------|-------|\n| 1 | Design Tokens | PASS | 11 `--hx-popover-*` tokens with semantic fallbacks. P2-01 box-shadow exception. |\n| 2 | Accessibility | PARTIAL | role=dialog, aria-expanded, aria-hidden, Escape dismiss all present. Missing: inert, focus management, document-level Escape. |\n| 3 | Functionality | PASS | Click/hover/focus/manual triggers. 12 placements via Floating UI. Arrow. Click-outside dismiss (added). |\n| 4 | TypeScript | PASS | Strict mode. No `any`. Clean union types for placement/trigger. |\n| 5 | CSS/Styling | PASS | Shadow DOM encapsulation. CSS Parts (body, arrow). prefers-reduced-motion. |\n| 6 | CEM Accuracy | IMPROVED | Private members tagged @internal. New `label` property documented. |\n| 7 | Tests | PASS | 30 tests. Rendering, properties, slots, ARIA, show/hide, events, click-outside, label, axe-core. |\n| 8 | Storybook | PASS | 9 stories. Default, arrow, placements, triggers, manual, rich content, events, escape, CSS parts. |\n| 9 | Drupal Compatibility | PASS | Standard slots, attributes, events. Twig-friendly. |\n| 10 | Portability | PASS | CDN-ready. No framework dependencies beyond Lit. |\n\n---\n\n## Test Coverage\n\n- **Total tests:** 30 (was 26, added 4)\n- **New tests:** click-outside dismiss (2), label property (2)\n- **Axe-core:** 2 tests (default + open state), zero violations\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit: identify all CRITICAL/HIGH issues",
      "status": "completed",
      "activeForm": "Auditing component for issues"
    },
    {
      "content": "Fix CRITICAL: add click-outside dismiss for trigger=click",
      "status": "completed",
      "activeForm": "Adding click-outside dismiss handler"
    },
    {
      "content": "Fix HIGH: add @internal JSDoc to private members leaking to CEM",
      "status": "completed",
      "activeForm": "Adding @internal tags to private members"
    },
    {
      "content": "Fix HIGH: make aria-label configurable via label property",
      "status": "completed",
      "activeForm": "Making aria-label configurable"
    },
    {
      "content": "Fix HIGH: add accessibility JSDoc to class description",
      "status": "completed",
      "activeForm": "Adding accessibility documentation to JSDoc"
    },
    {
      "content": "Add tests for click-outside dismiss and new label property",
      "status": "completed",
      "activeForm": "Adding tests for new functionality"
    },
    {
      "content": "Write AUDIT.md report",
      "status": "completed",
      "activeForm": "Writing audit report"
    },
    {
      "content": "Run build verification and tests",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}
Let me do a final diff check:

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover diff --stat",
  "description": "Check changed files"
}
The screenshots are just binary diffs from test runs (tracked in git, known issue per memory). The meaningful changes are only the 4 hx-popover files. Let me verify the final component file is correct:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-popover/packages/hx-library/src/components/hx-popover/hx-popover.ts"
}
Everything looks correct. Let me run the final verification:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | grep -E \"(error|Tasks:|Cached:|Time:)\" | tail -5",
  "description": "Final verify check",
  "timeout": 120000
}
All gates pass. Zero errors.

<summary>
## Summary: Deep Component Audit — hx-popover

### Changes Implemented

**CRITICAL fixes:**
1. **Click-outside dismiss** — Added `_handleOutsideClick` handler using `e.composedPath()` to detect clicks outside the component. Registered on `document` (capture phase) via `queueMicrotask` in `_show()`, removed in `_hide()` and `disconnectedCallback()`. Only fires for `trigger="click"`.

**HIGH fixes:**
2. **Configurable aria-label** — Added `label` property (default `"Popover"`) that maps to `aria-label` on the dialog body. Consumers can now set meaningful labels like `label="Patient details"`.
3. **CEM cleanup** — Added `@internal` JSDoc tags to all private state/handlers (`_visible`, `_popoverId`, `_handleKeydown`, `_handleOutsideClick`, `_handleAnchorClick`, `_handleAnchorMouseEnter`, `_handleAnchorMouseLeave`, `_handleAnchorFocusIn`, `_handleAnchorFocusOut`) to exclude them from the Custom Elements Manifest.
4. **Accessibility JSDoc** — Added documentation to the class JSDoc describing aria-expanded, role="dialog", configurable aria-label, Escape dismiss, and click-outside dismiss.

**Tests added (4 new, 30 total):**
- Click-outside dismiss (closes on outside click)
- Click-inside stays open
- Default label property
- Custom label for aria-label

**Storybook updated:**
- Added `label` argType and arg to meta

### Files Modified
- `packages/hx-library/src/components/hx-popover/hx-popover.ts` — Core component changes
- `packages/hx-library/src/components/hx-popover/hx-popover.test.ts` — 4 new tests
- `packages/hx-library/src/components/hx-popover/hx-popover.stories.ts` — label control added
- `packages/hx-library/src/components/hx-popover/AUDIT.md` — Full audit report

### Verification Status
- `npm run verify` — 11/11 tasks pass, 0 errors
- `npm run test:library` — 3114/3114 tests pass (79 test files)
- `npm run cem` — Generated successfully

### Risks/Blockers Encountered
- Click-outside test initially failed because `document.body` was in the popover's composed path. Fixed by creating a separate outside element.
- Outside click listener timing required `queueMicrotask` to avoid firing on the opening click itself.

### Documented (not fixed) Issues
- **P0-02:** `role="dialog"` without focus management — needs `role` property + focus trap
- **P1-04/05/06/07:** Missing test coverage for hover mouseleave, focus trigger, after-show/hide events, aria-expanded cycle
- **P2-01–06:** Hardcoded box-shadow fallback, arrow border clipping, duplicate ARIA methods, incomplete Storybook placements, vestigial `position: relative`, SSR-unsafe counter

### Notes for Developer
- The `_handleOutsideClick` uses capture phase to ensure it fires before any stopPropagation calls in child elements
- `queueMicrotask` ensures the listener isn't registered until after the opening click completes propagation
</summary>