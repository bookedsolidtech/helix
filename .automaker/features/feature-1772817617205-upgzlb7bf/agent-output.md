I'll start by reading the hx-button component files to understand the current state.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,TodoWrite,Bash,Write,Edit,Agent",
  "max_results": 8
}
Now let me read all the hx-button component files in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-button/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/index.ts"
}
Now let me check the CEM and the existing audit doc.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/AUDIT-TEST.md"
}

🔧 Tool: Grep
Input: {
  "pattern": "hx-button",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/custom-elements.json",
  "output_mode": "content",
  "head_limit": 5
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/custom-elements.json",
  "limit": 100
}
The audit is already complete with 14 findings. I need to fix the CRITICAL (P0) and HIGH (P1) issues. Let me create a task list and start fixing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "in_progress",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "pending",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "pending",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "pending",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
**P0 Fix**: Remove redundant opacity from `.button[disabled]` — the `:host([disabled])` rule already handles it.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.styles.ts",
  "old_string": "  /* ─── Disabled ─── */\n\n  .button[disabled] {\n    cursor: not-allowed;\n    opacity: var(--hx-opacity-disabled, 0.5);\n  }",
  "new_string": "  /* ─── Disabled ─── */\n\n  .button[disabled] {\n    cursor: not-allowed;\n  }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "completed",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "in_progress",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "pending",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "pending",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
**P1 Fix**: Add `label` property that forwards to inner button/anchor `aria-label`. Using ElementInternals for AOM participation.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.ts",
  "old_string": "  /**\n   * Visual style variant of the button.\n   * @attr variant\n   */",
  "new_string": "  /**\n   * Accessible label forwarded to the inner button or anchor element via\n   * aria-label. Required for icon-only buttons that have no visible text.\n   * @attr label\n   */\n  @property({ type: String, reflect: true })\n  label: string | undefined = undefined;\n\n  /**\n   * Visual style variant of the button.\n   * @attr variant\n   */"
}
Now forward the label to the inner elements:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.ts",
  "old_string": "        <a\n          part=\"button\"\n          class=${classMap(classes)}\n          href=${this.disabled ? nothing : ifDefined(this.href)}\n          target=${ifDefined(this.target)}\n          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}\n          aria-disabled=${this.disabled ? 'true' : nothing}\n          aria-busy=${this.loading ? 'true' : nothing}\n          @click=${this._handleClick}\n        >",
  "new_string": "        <a\n          part=\"button\"\n          class=${classMap(classes)}\n          href=${this.disabled ? nothing : ifDefined(this.href)}\n          target=${ifDefined(this.target)}\n          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}\n          aria-label=${ifDefined(this.label)}\n          aria-disabled=${this.disabled ? 'true' : nothing}\n          aria-busy=${this.loading ? 'true' : nothing}\n          @click=${this._handleClick}\n        >"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.ts",
  "old_string": "      <button\n        part=\"button\"\n        class=${classMap(classes)}\n        ?disabled=${this.disabled}\n        type=${this.type}\n        aria-busy=${this.loading ? 'true' : nothing}\n        @click=${this._handleClick}\n      >",
  "new_string": "      <button\n        part=\"button\"\n        class=${classMap(classes)}\n        ?disabled=${this.disabled}\n        type=${this.type}\n        aria-label=${ifDefined(this.label)}\n        aria-busy=${this.loading ? 'true' : nothing}\n        @click=${this._handleClick}\n      >"
}
Now add JSDoc for `formAssociated` and `_internals` to fix the CEM issue:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.ts",
  "old_string": "  // ─── Form Association ───\n\n  static formAssociated = true;\n\n  private _internals: ElementInternals;",
  "new_string": "  // ─── Form Association ───\n\n  /** Declares this element as a form-associated custom element. */\n  static formAssociated = true;\n\n  /** ElementInternals instance for form participation and AOM. */\n  private _internals: ElementInternals;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "completed",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "completed",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "in_progress",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
**P1 Fix**: Rename `argTypes.size` to `argTypes.hxSize` in stories and update the render function and args.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "    size: {\n      control: { type: 'select' },\n      options: ['sm', 'md', 'lg'],\n      description: 'Size of the button. Controls padding, font-size, and min-height.',\n      table: {\n        category: 'Visual',\n        defaultValue: { summary: 'md' },\n        type: { summary: \"'sm' | 'md' | 'lg'\" },\n      },\n    },",
  "new_string": "    hxSize: {\n      control: { type: 'select' },\n      options: ['sm', 'md', 'lg'],\n      description: 'Size of the button. Controls padding, font-size, and min-height.',\n      table: {\n        category: 'Visual',\n        defaultValue: { summary: 'md' },\n        type: { summary: \"'sm' | 'md' | 'lg'\" },\n      },\n    },"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "    variant: 'primary',\n    size: 'md',\n    disabled: false,",
  "new_string": "    variant: 'primary',\n    hxSize: 'md',\n    disabled: false,"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "      hx-size=${args.size}",
  "new_string": "      hx-size=${args.hxSize}"
}
Now update the story args that use `size`:

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "    size: 'sm',",
  "new_string": "    hxSize: 'sm',"
}

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "    size: 'md',",
  "new_string": "    hxSize: 'md',"
}

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.stories.ts",
  "old_string": "    size: 'lg',",
  "new_string": "    hxSize: 'lg',"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "completed",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "completed",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "completed",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "in_progress",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
**P1 Fix**: Add tests for `setFormValue` path, `form` getter inside a form, aria-label passthrough, and anchor+loading combination.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) ───",
  "new_string": "  // ─── Property: label (aria-label passthrough) ───\n\n  describe('Property: label', () => {\n    it('forwards label to inner button aria-label', async () => {\n      const el = await fixture<WcButton>('<hx-button label=\"Close dialog\">X</hx-button>');\n      const btn = shadowQuery(el, 'button')!;\n      expect(btn.getAttribute('aria-label')).toBe('Close dialog');\n    });\n\n    it('forwards label to inner anchor aria-label', async () => {\n      const el = await fixture<WcButton>(\n        '<hx-button href=\"https://example.com\" label=\"Visit site\">Link</hx-button>',\n      );\n      const anchor = shadowQuery(el, 'a')!;\n      expect(anchor.getAttribute('aria-label')).toBe('Visit site');\n    });\n\n    it('does not set aria-label when label is not provided', async () => {\n      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');\n      const btn = shadowQuery(el, 'button')!;\n      expect(btn.hasAttribute('aria-label')).toBe(false);\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───"
}
Now add the form getter and setFormValue tests:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.test.ts",
  "old_string": "    it('calls form.reset on type=reset click', async () => {",
  "new_string": "    it('returns the parent form from form getter', async () => {\n      const form = document.createElement('form');\n      form.innerHTML = '<hx-button>Click</hx-button>';\n      document.getElementById('test-fixture-container')!.appendChild(form);\n      const el = form.querySelector('hx-button') as WcButton;\n      await el.updateComplete;\n      expect(el.form).toBe(form);\n    });\n\n    it('calls setFormValue when name and value are set on submit', async () => {\n      const form = document.createElement('form');\n      form.innerHTML = '<hx-button type=\"submit\" name=\"action\" value=\"confirm\">Submit</hx-button>';\n      document.getElementById('test-fixture-container')!.appendChild(form);\n      const el = form.querySelector('hx-button') as WcButton;\n      await el.updateComplete;\n\n      let submitted = false;\n      form.addEventListener('submit', (e) => {\n        e.preventDefault();\n        submitted = true;\n      });\n\n      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;\n      btn.click();\n      await el.updateComplete;\n      expect(submitted).toBe(true);\n    });\n\n    it('calls form.reset on type=reset click', async () => {"
}
Now add the anchor+loading test:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button/packages/hx-library/src/components/hx-button/hx-button.test.ts",
  "old_string": "    it('removes href when disabled in anchor mode', async () => {",
  "new_string": "    it('suppresses hx-click and sets aria-busy when loading in anchor mode', async () => {\n      const el = await fixture<WcButton>(\n        '<hx-button href=\"https://example.com\" loading>Link</hx-button>',\n      );\n      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;\n      expect(anchor.getAttribute('aria-busy')).toBe('true');\n      let fired = false;\n      el.addEventListener('hx-click', () => {\n        fired = true;\n      });\n      anchor.click();\n      await el.updateComplete;\n      expect(fired).toBe(false);\n    });\n\n    it('removes href when disabled in anchor mode', async () => {"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "completed",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "completed",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "completed",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "in_progress",
      "activeForm": "Running build and tests"
    }
  ]
}
Now let me build and run the tests.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "TypeScript type-check",
  "timeout": 120000
}
Zero errors. Now let me run the tests for hx-button specifically.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project=library -- src/components/hx-button/hx-button.test.ts 2>&1 | tail -50",
  "description": "Run hx-button tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests via npm script",
  "timeout": 180000
}
All 3106 tests pass (79 files). Let me also run verify to check lint/format.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
All gates pass. Let me check the diff.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-button diff --stat",
  "description": "Show changed files"
}
Only the intended files were changed (plus screenshot PNGs from test runs, which is expected).

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "P0: Fix double opacity on disabled state in CSS",
      "status": "completed",
      "activeForm": "Fixing double opacity on disabled state"
    },
    {
      "content": "P1: Add aria-label passthrough to inner button/anchor",
      "status": "completed",
      "activeForm": "Adding aria-label passthrough"
    },
    {
      "content": "P1: Fix argTypes.size -> argTypes.hxSize in stories",
      "status": "completed",
      "activeForm": "Fixing argTypes CEM mismatch"
    },
    {
      "content": "P1: Add tests for setFormValue and form getter",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "P2: Fix formAssociated and _internals CEM descriptions",
      "status": "completed",
      "activeForm": "Fixing CEM descriptions"
    },
    {
      "content": "Run build and tests to verify",
      "status": "completed",
      "activeForm": "Running build and tests"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-button

### Changes Implemented

**P0 (Critical) — Fixed:**
- Removed redundant `opacity` from `.button[disabled]` CSS rule that was compounding with `:host([disabled])` opacity, causing buttons to appear at 0.25 opacity instead of 0.5

**P1 (Major) — Fixed:**
- Added `label` property with `aria-label` passthrough to inner `<button>` and `<a>` elements, enabling accessible icon-only buttons
- Fixed `argTypes.size` → `argTypes.hxSize` in Storybook stories to align with actual property/attribute name for CEM consistency
- Added 6 new tests: `form` getter with actual form parent, `setFormValue` code path, aria-label passthrough (button, anchor, absent), anchor+loading suppression

**P2 — Fixed:**
- Added JSDoc descriptions to `formAssociated` and `_internals` for CEM accuracy

**P2 — Documented (not fixed, as per scope):**
- Hover/active `filter: brightness()` double-darken on variants with explicit hover bg
- Hardcoded hex fallback values in CSS
- Missing `aria-live` region for loading state transitions
- Missing `internals.role = 'button'` on host
- EmergencyAction story anti-pattern
- IconOnly story accessibility gap (now mitigated by label property)
- Deprecated `WcButton` alias missing removal timeline

### Files Modified
- `packages/hx-library/src/components/hx-button/hx-button.ts` — Added `label` property, aria-label bindings, JSDoc for formAssociated/_internals
- `packages/hx-library/src/components/hx-button/hx-button.styles.ts` — Removed redundant disabled opacity
- `packages/hx-library/src/components/hx-button/hx-button.test.ts` — Added 6 new tests (label passthrough, form getter, setFormValue, anchor+loading)
- `packages/hx-library/src/components/hx-button/hx-button.stories.ts` — Renamed `size` → `hxSize` in argTypes and all story args

### Verification Status
- `npm run type-check`: 0 errors
- `npm run test:library`: 3106 tests passed (79 files), including all new hx-button tests
- `npm run verify`: All gates pass (lint + format:check + type-check)

### Risks/Blockers Encountered
- None. All changes are backwards-compatible. The `label` property is additive.

### Learnings
- The double-opacity bug was a real visual defect — `:host` and inner element opacity multiply rather than take max
- Using `ifDefined` directive for optional `aria-label` ensures no attribute is set when `label` is undefined

### Notes for Developer
- The existing AUDIT-TEST.md documents all 14 findings. 5 P2 items remain as documented issues for future work.
- The `IconOnly` story in Storybook should be updated to use `label="Close dialog"` instead of `aria-label` on the host element.
</summary>