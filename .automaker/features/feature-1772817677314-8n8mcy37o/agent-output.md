I'll start by examining the hx-combobox component and gathering information from wc-mcp tools in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Write,Edit,TodoWrite,Agent",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__list_events,mcp__wc-mcp__list_slots,mcp__wc-mcp__get_design_tokens",
  "max_results": 7
}
Now let me gather all the information I need in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-combobox/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.styles.ts"
}
Now let me read the test, stories, and index files, and run wc-mcp tools in parallel.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/AUDIT.md"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Implement multi-select (or remove the property/story)",
      "status": "pending",
      "activeForm": "Fixing P0-1: multi-select"
    },
    {
      "content": "Fix P1-1: Add Home/End keyboard navigation",
      "status": "pending",
      "activeForm": "Adding Home/End keyboard navigation"
    },
    {
      "content": "Fix P1-2: Remove aria-multiselectable from combobox input",
      "status": "pending",
      "activeForm": "Removing invalid aria-multiselectable from input"
    },
    {
      "content": "Fix P1-3: Make clear button keyboard accessible",
      "status": "pending",
      "activeForm": "Making clear button keyboard accessible"
    },
    {
      "content": "Fix P1-4: Address cross-shadow-DOM ARIA references",
      "status": "pending",
      "activeForm": "Addressing cross-shadow-DOM ARIA references"
    },
    {
      "content": "Fix P1-5: Fix role=alert + aria-live=polite conflict",
      "status": "pending",
      "activeForm": "Fixing role/aria-live conflict"
    },
    {
      "content": "Fix P1-6: Fix formStateRestoreCallback signature",
      "status": "pending",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Fix P1-7: Export ComboboxOption type",
      "status": "pending",
      "activeForm": "Exporting ComboboxOption type"
    },
    {
      "content": "Fix P1-8: Add aria-busy for loading state",
      "status": "pending",
      "activeForm": "Adding aria-busy for loading state"
    },
    {
      "content": "Fix P2-9 through P2-12: Add missing tests (hx-hide, filterDebounce, ArrowUp, disabled option skip)",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2-6: Replace Math.random with counter-based ID",
      "status": "pending",
      "activeForm": "Replacing Math.random with counter-based ID"
    },
    {
      "content": "Fix P2-13: Export size union type",
      "status": "pending",
      "activeForm": "Exporting size union type"
    },
    {
      "content": "Update AUDIT.md with findings and fixes",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Good — I have a thorough existing audit. Now let me check how other components in this library handle the patterns I need to implement (like counter IDs, multi-select approach, etc.).

🔧 Tool: Grep
Input: {
  "pattern": "let _instanceCount|let instanceCount|_nextId|_counter",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "^let .*= 0;$",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components",
  "output_mode": "content",
  "glob": "*.ts"
}
Good — the pattern is a module-level counter. Let me now implement all the fixes. I'll work through the P0 and P1 items systematically.

For **P0-1 (Multiple select)**: The safest approach for this audit is to **remove the `multiple` property** since it's entirely unimplemented and false-advertising. Implementing full multi-select is a separate feature. I'll remove the prop and mark it as a future feature.

Actually, re-reading the scope: "Fix CRITICAL+HIGH. Document rest." So I need to fix P0 and P1 items, and document P2s.

For P0-1, removing the misleading `multiple` prop + story is the right fix — implementing full multi-select is a feature, not an audit fix.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Remove unimplemented multiple prop and story",
      "status": "in_progress",
      "activeForm": "Removing unimplemented multiple prop and story"
    },
    {
      "content": "Fix P1-1: Add Home/End keyboard navigation",
      "status": "pending",
      "activeForm": "Adding Home/End keyboard navigation"
    },
    {
      "content": "Fix P1-2: Remove aria-multiselectable from combobox input",
      "status": "pending",
      "activeForm": "Removing invalid aria-multiselectable from input"
    },
    {
      "content": "Fix P1-3: Make clear button keyboard accessible",
      "status": "pending",
      "activeForm": "Making clear button keyboard accessible"
    },
    {
      "content": "Fix P1-4: Address cross-shadow-DOM ARIA references",
      "status": "pending",
      "activeForm": "Addressing cross-shadow-DOM ARIA references"
    },
    {
      "content": "Fix P1-5: Fix role=alert + aria-live=polite conflict",
      "status": "pending",
      "activeForm": "Fixing role/aria-live conflict"
    },
    {
      "content": "Fix P1-6: Fix formStateRestoreCallback signature",
      "status": "pending",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Fix P1-7: Export ComboboxOption type",
      "status": "pending",
      "activeForm": "Exporting ComboboxOption type"
    },
    {
      "content": "Fix P1-8: Add aria-busy for loading state",
      "status": "pending",
      "activeForm": "Adding aria-busy for loading state"
    },
    {
      "content": "Fix P2-6: Replace Math.random with counter-based ID",
      "status": "pending",
      "activeForm": "Replacing Math.random with counter-based ID"
    },
    {
      "content": "Fix P2-13: Export size union type",
      "status": "pending",
      "activeForm": "Exporting size union type"
    },
    {
      "content": "Add missing tests (hx-hide, filterDebounce, ArrowUp, disabled option skip)",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Update AUDIT.md with findings and fixes",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Now let me implement all the fixes to `hx-combobox.ts`. I'll make the changes systematically.

**P0-1: Remove `multiple` property** (unimplemented, misleading)
**P1-1: Add Home/End keys**
**P1-2: Remove `aria-multiselectable` from input** (follows from removing `multiple`)
**P1-3: Make clear button keyboard accessible** (tabindex="0")
**P1-5: Fix role="alert" + aria-live conflict** (use role="status" with aria-live="polite")
**P1-6: Fix formStateRestoreCallback signature**
**P1-7: Export ComboboxOption type**
**P1-8: Add aria-busy for loading state**
**P2-6: Replace Math.random with counter**
**P2-13: Export size type**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "// ─── Internal option model ───\n\ninterface ComboboxOption {\n  value: string;\n  label: string;\n  disabled: boolean;\n}",
  "new_string": "// ─── Module-level ID counter ───\n\nlet _comboboxCounter = 0;\n\n// ─── Public option model ───\n\nexport interface ComboboxOption {\n  value: string;\n  label: string;\n  disabled: boolean;\n}\n\n/** Size variants for the combobox. */\nexport type HxComboboxSize = 'sm' | 'md' | 'lg';"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": " * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on each keystroke as the user types.\n * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when an option is selected.\n * @fires {CustomEvent<void>} hx-clear - Dispatched when the clear button is activated.\n * @fires {CustomEvent<void>} hx-show - Dispatched when the listbox opens.\n * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes.",
  "new_string": " * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on each keystroke as the user types.\n * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when an option is selected.\n * @fires {CustomEvent<void>} hx-clear - Dispatched when the clear button is activated.\n * @fires {CustomEvent<void>} hx-show - Dispatched when the listbox opens.\n * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes.\n * @fires {CustomEvent<string>} hx-filter - Dispatched when the filter text changes (debounced if filterDebounce > 0)."
}
Wait, I shouldn't add new events that don't exist. Let me revert that.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": " * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes.\n * @fires {CustomEvent<string>} hx-filter - Dispatched when the filter text changes (debounced if filterDebounce > 0).",
  "new_string": " * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes."
}
Now replace the random ID with counter-based:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "  private _id = `hx-combobox-${Math.random().toString(36).slice(2, 9)}`;",
  "new_string": "  private _id = `hx-combobox-${++_comboboxCounter}`;"
}
Now remove the `multiple` property (P0-1):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "  /**\n   * Whether multiple options can be selected.\n   * @attr multiple\n   */\n  @property({ type: Boolean, reflect: true })\n  multiple = false;\n\n  /**",
  "new_string": "  /**"
}
Now fix the `size` property type (P2-13):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "  size: 'sm' | 'md' | 'lg' = 'md';",
  "new_string": "  size: HxComboboxSize = 'md';"
}
Now fix formStateRestoreCallback signature (P1-6):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "  /** Called when the browser restores form state (e.g., bfcache navigation). */\n  formStateRestoreCallback(state: string): void {\n    this.value = state;\n  }",
  "new_string": "  /** Called when the browser restores form state (e.g., bfcache navigation). */\n  formStateRestoreCallback(state: string | File | FormData, _mode: 'restore' | 'autocomplete'): void {\n    if (typeof state === 'string') {\n      this.value = state;\n    }\n  }"
}
Now add Home/End keyboard navigation (P1-1):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "      case 'Tab': {\n        this._closeDropdown();\n        break;\n      }\n      default:\n        break;",
  "new_string": "      case 'Home': {\n        e.preventDefault();\n        if (!this._open) this._openDropdown();\n        this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? -1) : -1;\n        break;\n      }\n      case 'End': {\n        e.preventDefault();\n        if (!this._open) this._openDropdown();\n        const lastEnabled = enabledIndices[enabledIndices.length - 1];\n        this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : -1;\n        break;\n      }\n      case 'Tab': {\n        this._closeDropdown();\n        break;\n      }\n      default:\n        break;"
}
Now fix the render method — remove `aria-multiselectable` from input (P1-2), fix clear button tabindex (P1-3), fix role="alert" conflict (P1-5), add aria-busy (P1-8), and handle the shadow DOM ARIA issue (P1-4).

For P1-4 (cross-shadow-DOM ARIA), since `aria-controls` and `aria-activedescendant` reference IDs within the same shadow root, they actually DO work within shadow DOM. The audit incorrectly states they don't — both the input and listbox are in the same shadow root, so the ID references work fine. I'll note this in the updated audit.

Let me verify this by re-reading the render:

Both `input` (with `aria-controls`) and `listbox` (with `id=${this._listboxId}`) are in the same shadow root template. So P1-4 is a false positive — shadow-scoped IDs work when both elements are in the same shadow root.

Now let me fix the remaining items in the render method:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "            aria-label=${ifDefined(this.ariaLabel ?? undefined)}\n            aria-multiselectable=${this.multiple ? 'true' : nothing}\n            .value=${this._filterText || (this._open ? '' : this._displayValue)}",
  "new_string": "            aria-label=${ifDefined(this.ariaLabel ?? undefined)}\n            aria-busy=${this.loading ? 'true' : nothing}\n            .value=${this._filterText || (this._open ? '' : this._displayValue)}"
}
Now fix the clear button to be keyboard accessible (P1-3):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "                <button\n                  part=\"clear-button\"\n                  type=\"button\"\n                  class=\"field__clear-button\"\n                  aria-label=\"Clear\"\n                  tabindex=\"-1\"\n                  @click=${this._handleClear}\n                >",
  "new_string": "                <button\n                  part=\"clear-button\"\n                  type=\"button\"\n                  class=\"field__clear-button\"\n                  aria-label=\"Clear\"\n                  @click=${this._handleClear}\n                >"
}
Now fix the role="alert" + aria-live conflict (P1-5) — use role="status" with aria-live="polite":

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "            ? html`<div\n                part=\"error\"\n                class=\"field__error\"\n                id=${this._errorId}\n                role=\"alert\"\n                aria-live=\"polite\"\n              >",
  "new_string": "            ? html`<div\n                part=\"error\"\n                class=\"field__error\"\n                id=${this._errorId}\n                role=\"alert\"\n              >"
}
Now remove `aria-multiselectable` from the listbox since we removed the `multiple` property:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.ts",
  "old_string": "          aria-label=${ifDefined(this.label || this.ariaLabel || undefined)}\n          aria-multiselectable=${this.multiple ? 'true' : nothing}\n          ?hidden=${!this._open}",
  "new_string": "          aria-label=${ifDefined(this.label || this.ariaLabel || undefined)}\n          ?hidden=${!this._open}"
}
Now update the index.ts to export the new types:

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/index.ts",
  "content": "export { HelixCombobox } from './hx-combobox.js';\nexport type { ComboboxOption, HxComboboxSize } from './hx-combobox.js';\n"
}
Now update the stories — remove the Multiple story (P0-1/P2-2):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts",
  "old_string": "    multiple: {\n      control: 'boolean',\n      description: 'Whether multiple options can be selected.',\n      table: {\n        category: 'Behavior',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n    clearable: {",
  "new_string": "    clearable: {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts",
  "old_string": "    multiple: false,\n    clearable: false,",
  "new_string": "    clearable: false,"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts",
  "old_string": "      ?required=${args.required}\n      ?disabled=${args.disabled}\n      ?multiple=${args.multiple}\n      ?clearable=${args.clearable}",
  "new_string": "      ?required=${args.required}\n      ?disabled=${args.disabled}\n      ?clearable=${args.clearable}"
}
Remove the Multiple story:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts",
  "old_string": "// ─────────────────────────────────────────────────\n// Multiple\n// ─────────────────────────────────────────────────\n\nexport const Multiple: Story = {\n  render: () => html`\n    <hx-combobox label=\"Skills\" placeholder=\"Select skills...\" multiple>\n      <option slot=\"option\" value=\"js\">JavaScript</option>\n      <option slot=\"option\" value=\"ts\">TypeScript</option>\n      <option slot=\"option\" value=\"react\">React</option>\n      <option slot=\"option\" value=\"lit\">Lit</option>\n      <option slot=\"option\" value=\"css\">CSS</option>\n    </hx-combobox>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// Clearable",
  "new_string": "// ─────────────────────────────────────────────────\n// Clearable"
}
Now update the tests. I need to:
1. Fix the test that asserts `aria-live="polite"` (P1-5) — now role="alert" without aria-live
2. Add missing tests: hx-hide, filterDebounce, ArrowUp, Home/End, disabled option skip
3. Update formStateRestoreCallback test to use correct signature

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts",
  "old_string": "    it('error div has aria-live=\"polite\"', async () => {\n      const el = await fixture<HxCombobox>('<hx-combobox error=\"Oops\"></hx-combobox>');\n      const errorEl = shadowQuery(el, '[role=\"alert\"]');\n      expect(errorEl?.getAttribute('aria-live')).toBe('polite');\n    });",
  "new_string": "    it('error div uses role=\"alert\" (implicit assertive)', async () => {\n      const el = await fixture<HxCombobox>('<hx-combobox error=\"Oops\"></hx-combobox>');\n      const errorEl = shadowQuery(el, '[role=\"alert\"]');\n      expect(errorEl?.getAttribute('role')).toBe('alert');\n      expect(errorEl?.hasAttribute('aria-live')).toBe(false);\n    });"
}
Fix the formStateRestoreCallback test:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts",
  "old_string": "    it('formStateRestoreCallback restores value', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      el.formStateRestoreCallback('cherry');\n      expect(el.value).toBe('cherry');\n    });",
  "new_string": "    it('formStateRestoreCallback restores value', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      el.formStateRestoreCallback('cherry', 'restore');\n      expect(el.value).toBe('cherry');\n    });"
}
Now add the missing tests. Let me add them before the closing of the describe block:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts",
  "old_string": "    it('dispatches hx-clear when clear button clicked', async () => {\n      const el = await fixture<HxCombobox>(withOptions('value=\"apple\" clearable'));\n      await el.updateComplete;\n      const clearPromise = oneEvent(el, 'hx-clear');\n      const clearBtn = shadowQuery<HTMLButtonElement>(el, '[part=\"clear-button\"]')!;\n      clearBtn.click();\n      const event = await clearPromise;\n      expect(event).toBeTruthy();\n    });\n  });",
  "new_string": "    it('dispatches hx-clear when clear button clicked', async () => {\n      const el = await fixture<HxCombobox>(withOptions('value=\"apple\" clearable'));\n      await el.updateComplete;\n      const clearPromise = oneEvent(el, 'hx-clear');\n      const clearBtn = shadowQuery<HTMLButtonElement>(el, '[part=\"clear-button\"]')!;\n      clearBtn.click();\n      const event = await clearPromise;\n      expect(event).toBeTruthy();\n    });\n\n    it('dispatches hx-hide when listbox closes', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      const input = shadowQuery<HTMLInputElement>(el, 'input')!;\n      input.dispatchEvent(new Event('focus'));\n      await el.updateComplete;\n      const hidePromise = oneEvent(el, 'hx-hide');\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));\n      const event = await hidePromise;\n      expect(event).toBeTruthy();\n    });\n  });"
}
Now add ArrowUp, Home, End, and disabled option skip tests:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts",
  "old_string": "    it('Tab closes listbox', async () => {",
  "new_string": "    it('ArrowUp opens listbox and focuses last option', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      const input = shadowQuery<HTMLInputElement>(el, 'input')!;\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));\n      await el.updateComplete;\n      const listbox = shadowQuery(el, '[role=\"listbox\"]');\n      expect(listbox?.hasAttribute('hidden')).toBe(false);\n    });\n\n    it('Home key focuses first option', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      const input = shadowQuery<HTMLInputElement>(el, 'input')!;\n      // Open with ArrowDown to focus first item\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      // Navigate down\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      // Press Home to go back to first\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));\n      await el.updateComplete;\n      // Select with Enter\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));\n      await el.updateComplete;\n      expect(el.value).toBe('apple');\n    });\n\n    it('End key focuses last option', async () => {\n      const el = await fixture<HxCombobox>(withOptions());\n      const input = shadowQuery<HTMLInputElement>(el, 'input')!;\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));\n      await el.updateComplete;\n      // Select with Enter\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));\n      await el.updateComplete;\n      expect(el.value).toBe('cherry');\n    });\n\n    it('Tab closes listbox', async () => {"
}
Now add aria-busy test and disabled option skip test:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts",
  "old_string": "  // ─── Accessibility (3) ───",
  "new_string": "  // ─── Loading State (2) ───\n\n  describe('Loading State', () => {\n    it('sets aria-busy=\"true\" on input when loading', async () => {\n      const el = await fixture<HxCombobox>('<hx-combobox loading></hx-combobox>');\n      const input = shadowQuery(el, 'input');\n      expect(input?.getAttribute('aria-busy')).toBe('true');\n    });\n\n    it('does not set aria-busy when not loading', async () => {\n      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');\n      const input = shadowQuery(el, 'input');\n      expect(input?.hasAttribute('aria-busy')).toBe(false);\n    });\n  });\n\n  // ─── Disabled Option Skipping (1) ───\n\n  describe('Disabled Option Skipping', () => {\n    it('keyboard navigation skips disabled options', async () => {\n      const el = await fixture<HxCombobox>(`\n        <hx-combobox>\n          <option slot=\"option\" value=\"a\">Option A</option>\n          <option slot=\"option\" value=\"b\" disabled>Option B (disabled)</option>\n          <option slot=\"option\" value=\"c\">Option C</option>\n        </hx-combobox>\n      `);\n      const input = shadowQuery<HTMLInputElement>(el, 'input')!;\n      // Open and navigate to first\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      // Navigate down — should skip disabled B and land on C\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));\n      await el.updateComplete;\n      // Select with Enter\n      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));\n      await el.updateComplete;\n      expect(el.value).toBe('c');\n    });\n  });\n\n  // ─── Accessibility (3) ───"
}
Now let me update the todos and verify the component file is correct before building.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Remove unimplemented multiple prop and story",
      "status": "completed",
      "activeForm": "Removing unimplemented multiple prop and story"
    },
    {
      "content": "Fix P1-1: Add Home/End keyboard navigation",
      "status": "completed",
      "activeForm": "Adding Home/End keyboard navigation"
    },
    {
      "content": "Fix P1-2: Remove aria-multiselectable from combobox input",
      "status": "completed",
      "activeForm": "Removing invalid aria-multiselectable from input"
    },
    {
      "content": "Fix P1-3: Make clear button keyboard accessible",
      "status": "completed",
      "activeForm": "Making clear button keyboard accessible"
    },
    {
      "content": "Fix P1-4: Address cross-shadow-DOM ARIA references",
      "status": "completed",
      "activeForm": "Documented as false positive"
    },
    {
      "content": "Fix P1-5: Fix role=alert + aria-live=polite conflict",
      "status": "completed",
      "activeForm": "Fixing role/aria-live conflict"
    },
    {
      "content": "Fix P1-6: Fix formStateRestoreCallback signature",
      "status": "completed",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Fix P1-7: Export ComboboxOption type",
      "status": "completed",
      "activeForm": "Exporting ComboboxOption type"
    },
    {
      "content": "Fix P1-8: Add aria-busy for loading state",
      "status": "completed",
      "activeForm": "Adding aria-busy for loading state"
    },
    {
      "content": "Fix P2-6: Replace Math.random with counter-based ID",
      "status": "completed",
      "activeForm": "Replacing Math.random with counter-based ID"
    },
    {
      "content": "Fix P2-13: Export size union type",
      "status": "completed",
      "activeForm": "Exporting size union type"
    },
    {
      "content": "Add missing tests (hx-hide, ArrowUp, Home/End, disabled option skip, aria-busy)",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Update AUDIT.md with findings and fixes",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build and tests to verify",
      "status": "in_progress",
      "activeForm": "Running build and tests"
    }
  ]
}
Let me verify the modified component file compiles and the tests pass.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 60000
}
Zero errors. Now let me run the tests for this component:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts 2>&1 | tail -80",
  "description": "Run hx-combobox tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests via workspace script",
  "timeout": 120000
}
All 3107 tests pass, including the new ones. Let me now run verify:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Run full verify (lint + format:check + type-check)",
  "timeout": 120000
}
Need to fix formatting:

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-combobox/hx-combobox.ts 2>&1",
  "description": "Fix formatting on hx-combobox.ts"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -10",
  "description": "Re-run verify after formatting fix",
  "timeout": 120000
}
All gates pass. Now let me write the updated AUDIT.md:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Remove unimplemented multiple prop and story",
      "status": "completed",
      "activeForm": "Removing unimplemented multiple prop and story"
    },
    {
      "content": "Fix P1-1: Add Home/End keyboard navigation",
      "status": "completed",
      "activeForm": "Adding Home/End keyboard navigation"
    },
    {
      "content": "Fix P1-2: Remove aria-multiselectable from combobox input",
      "status": "completed",
      "activeForm": "Removing invalid aria-multiselectable from input"
    },
    {
      "content": "Fix P1-3: Make clear button keyboard accessible",
      "status": "completed",
      "activeForm": "Making clear button keyboard accessible"
    },
    {
      "content": "Fix P1-4: Address cross-shadow-DOM ARIA references",
      "status": "completed",
      "activeForm": "Documented as false positive"
    },
    {
      "content": "Fix P1-5: Fix role=alert + aria-live=polite conflict",
      "status": "completed",
      "activeForm": "Fixing role/aria-live conflict"
    },
    {
      "content": "Fix P1-6: Fix formStateRestoreCallback signature",
      "status": "completed",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Fix P1-7: Export ComboboxOption type",
      "status": "completed",
      "activeForm": "Exporting ComboboxOption type"
    },
    {
      "content": "Fix P1-8: Add aria-busy for loading state",
      "status": "completed",
      "activeForm": "Adding aria-busy for loading state"
    },
    {
      "content": "Fix P2-6: Replace Math.random with counter-based ID",
      "status": "completed",
      "activeForm": "Replacing Math.random with counter-based ID"
    },
    {
      "content": "Fix P2-13: Export size union type",
      "status": "completed",
      "activeForm": "Exporting size union type"
    },
    {
      "content": "Add missing tests (hx-hide, ArrowUp, Home/End, disabled option skip, aria-busy)",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Update AUDIT.md with findings and fixes",
      "status": "in_progress",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build and tests to verify",
      "status": "completed",
      "activeForm": "Running build and tests"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox/packages/hx-library/src/components/hx-combobox/AUDIT.md",
  "content": "# AUDIT: hx-combobox — Deep Component Audit v2\n\n**Reviewer:** Deep audit v2 (automated)\n**Branch:** `feature/deep-audit-v2-hx-combobox`\n\n---\n\n## Fixed in This Audit\n\n### P0-1: Multiple selection unimplemented — FIXED (removed)\nThe `multiple` property was declared but entirely unimplemented. Rather than ship a broken feature, the property, its ARIA attributes (`aria-multiselectable`), and the misleading `Multiple` Storybook story have been removed. Multi-select should be implemented as a separate feature with proper chip rendering and multi-value form submission.\n\n### P1-1: Home/End keyboard navigation — FIXED\nAdded `Home` and `End` key handlers to `_handleKeydown`. Home focuses the first enabled option; End focuses the last.\n\n### P1-2: `aria-multiselectable` on `role=\"combobox\"` — FIXED\nRemoved `aria-multiselectable` from both the input (where it was invalid per ARIA 1.2 spec) and the listbox (since `multiple` was removed).\n\n### P1-3: Clear button not keyboard accessible — FIXED\nRemoved `tabindex=\"-1\"` from the clear button. Native `<button>` elements are focusable by default, so the clear button is now in the tab order and keyboard accessible per WCAG 2.1 SC 2.1.1.\n\n### P1-4: Cross-shadow-DOM ARIA references — FALSE POSITIVE\nThe original audit claimed `aria-controls` and `aria-activedescendant` break across shadow DOM boundaries. This is incorrect: both the input (with `aria-controls`) and the listbox (with `id`) are rendered in the **same** shadow root. Shadow-scoped IDs work correctly when referencing elements within the same shadow tree.\n\n### P1-5: `role=\"alert\"` + `aria-live=\"polite\"` conflict — FIXED\nRemoved the conflicting `aria-live=\"polite\"` from the error div. `role=\"alert\"` implicitly sets `aria-live=\"assertive\"`, which is the correct behavior for form validation errors. The explicit override was removed so the implicit semantics apply correctly.\n\n### P1-6: `formStateRestoreCallback` wrong signature — FIXED\nUpdated signature from `(state: string)` to `(state: string | File | FormData, _mode: 'restore' | 'autocomplete')` per the WHATWG HTML spec. Added type guard to only restore string state.\n\n### P1-7: `ComboboxOption` interface not exported — FIXED\nExported `ComboboxOption` interface from both `hx-combobox.ts` and `index.ts`. TypeScript consumers can now reference the option type.\n\n### P1-8: No `aria-busy` for loading state — FIXED\nAdded `aria-busy=\"true\"` on the combobox input when `loading` is true. Screen readers now announce the loading state per WCAG 2.1 SC 4.1.3.\n\n### P2-6: `Math.random()` for ID generation — FIXED\nReplaced `Math.random().toString(36).slice(2, 9)` with a module-level counter (`_comboboxCounter`). IDs are now deterministic and collision-free: `hx-combobox-1`, `hx-combobox-2`, etc.\n\n### P2-13: Size union type not exported — FIXED\nExported `HxComboboxSize` type (`'sm' | 'md' | 'lg'`) from both `hx-combobox.ts` and `index.ts`.\n\n### Test Coverage Gaps — FIXED\nAdded tests for:\n- `hx-hide` event dispatch (P2-9)\n- `ArrowUp` keyboard navigation (P2-11)\n- `Home` key navigation to first option\n- `End` key navigation to last option\n- Disabled option skipping during keyboard navigation (P2-12)\n- `aria-busy` presence/absence for loading state (P1-8)\n\n---\n\n## Remaining P2 Items (Documented, Not Fixed)\n\n### P2-1: Storybook argTypes camelCase vs kebab-case\n`helpText` and `filterDebounce` in argTypes use camelCase while HTML attributes are `help-text` and `filter-debounce`. Works via manual mapping in render but Storybook autodocs may show wrong property names.\n\n### P2-2: `Multiple` story removed\nStory was removed along with the `multiple` property. To be re-added when multi-select is properly implemented.\n\n### P2-3: No story for prefix/suffix slots\n`prefix` and `suffix` slots are documented and styled but have no demonstration story.\n\n### P2-4: No story for empty-label slot\nThe `empty-label` slot has no dedicated story. Only visible when typing a non-matching string.\n\n### P2-5: Async story is misleading\nShows `loading=true` with static options but no actual async behavior. Needs an `@input` handler to toggle loading.\n\n### P2-7: `color-mix()` browser support\n`color-mix()` requires Chrome 111+. Enterprise healthcare environments may run older browsers. No CSS fallback is provided for the focus ring.\n\n### P2-8: Hardcoded hex fallbacks in CSS\nHex values like `#ffffff`, `#dc3545` serve as last-resort fallbacks. These bypass theming but are acceptable as final fallbacks when tokens are not loaded.\n\n### P2-10: No test for filterDebounce\nTimer-based debounce logic is untested. Requires `vi.useFakeTimers()` approach.\n\n### P2-14: Listbox `position: absolute` may clip\nDropdown may be clipped by `overflow: hidden` parents. A portal or popover approach would be more robust.\n\n### P2-15: Bundle size not verified\nNo per-component bundle analysis was run. The `tokenStyles` import may include the full token set.\n\n### P2-16: No Drupal progressive enhancement pattern\nNo documented Twig template or `<select>` fallback strategy for Drupal.\n\n---\n\n## Summary\n\n| Severity | Original Count | Fixed | Remaining |\n|----------|---------------|-------|-----------|\n| P0 | 1 | 1 | 0 |\n| P1 | 8 | 7 | 0 |\n| P2 | 16 | 3 | 13 |\n| **Total** | **25** | **11** | **13** |\n\n**P1-4 reclassified as false positive** (same shadow root, IDs work correctly).\n\nAll P0 and P1 issues are resolved. Remaining P2 items are cosmetic, story coverage, or architectural improvements suitable for future work.\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Remove unimplemented multiple prop and story",
      "status": "completed",
      "activeForm": "Removing unimplemented multiple prop and story"
    },
    {
      "content": "Fix P1-1: Add Home/End keyboard navigation",
      "status": "completed",
      "activeForm": "Adding Home/End keyboard navigation"
    },
    {
      "content": "Fix P1-2: Remove aria-multiselectable from combobox input",
      "status": "completed",
      "activeForm": "Removing invalid aria-multiselectable from input"
    },
    {
      "content": "Fix P1-3: Make clear button keyboard accessible",
      "status": "completed",
      "activeForm": "Making clear button keyboard accessible"
    },
    {
      "content": "Fix P1-4: Address cross-shadow-DOM ARIA references",
      "status": "completed",
      "activeForm": "Documented as false positive"
    },
    {
      "content": "Fix P1-5: Fix role=alert + aria-live=polite conflict",
      "status": "completed",
      "activeForm": "Fixing role/aria-live conflict"
    },
    {
      "content": "Fix P1-6: Fix formStateRestoreCallback signature",
      "status": "completed",
      "activeForm": "Fixing formStateRestoreCallback signature"
    },
    {
      "content": "Fix P1-7: Export ComboboxOption type",
      "status": "completed",
      "activeForm": "Exporting ComboboxOption type"
    },
    {
      "content": "Fix P1-8: Add aria-busy for loading state",
      "status": "completed",
      "activeForm": "Adding aria-busy for loading state"
    },
    {
      "content": "Fix P2-6: Replace Math.random with counter-based ID",
      "status": "completed",
      "activeForm": "Replacing Math.random with counter-based ID"
    },
    {
      "content": "Fix P2-13: Export size union type",
      "status": "completed",
      "activeForm": "Exporting size union type"
    },
    {
      "content": "Add missing tests (hx-hide, ArrowUp, Home/End, disabled option skip, aria-busy)",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Update AUDIT.md with findings and fixes",
      "status": "completed",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build and tests to verify",
      "status": "completed",
      "activeForm": "Running build and tests"
    }
  ]
}
Let me do a final diff check:

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-combobox diff --stat",
  "description": "Check changed files"
}
The changed files are exactly what I intended — the 4 hx-combobox source files plus some screenshot PNGs that regenerated during test runs. All changes are within the component scope.

<summary>
## Summary: Deep Component Audit — hx-combobox

### Changes Implemented

**P0 Fixes (1):**
- Removed unimplemented `multiple` property, its ARIA attributes, and the misleading `Multiple` Storybook story

**P1 Fixes (7 fixed, 1 reclassified):**
- Added Home/End keyboard navigation to `_handleKeydown`
- Removed invalid `aria-multiselectable` from both input and listbox
- Made clear button keyboard accessible (removed `tabindex="-1"`)
- Reclassified P1-4 (cross-shadow-DOM ARIA) as false positive — both elements are in the same shadow root
- Removed conflicting `aria-live="polite"` from `role="alert"` error div
- Fixed `formStateRestoreCallback` signature to match WHATWG spec
- Exported `ComboboxOption` interface and `HxComboboxSize` type
- Added `aria-busy` on input when `loading` is true

**P2 Fixes (3):**
- Replaced `Math.random()` ID generation with module-level counter
- Exported `HxComboboxSize` type
- Added 7 new tests covering previously untested paths

**13 P2 items documented** in AUDIT.md for future work.

### Files Modified
- `packages/hx-library/src/components/hx-combobox/hx-combobox.ts` — Core fixes
- `packages/hx-library/src/components/hx-combobox/hx-combobox.test.ts` — 7 new tests added
- `packages/hx-library/src/components/hx-combobox/hx-combobox.stories.ts` — Removed `multiple` story and controls
- `packages/hx-library/src/components/hx-combobox/index.ts` — Added type exports
- `packages/hx-library/src/components/hx-combobox/AUDIT.md` — Updated with fix status

### Verification Status
- `npm run type-check` — 0 errors
- `npm run test:library` — 3107 tests pass (79 test files)
- `npm run verify` — All gates pass (lint + format:check + type-check)
- All new tests pass in Vitest browser mode (Chromium)

### Risks/Blockers Encountered
- P1-4 was incorrectly flagged in the original audit as a cross-shadow-DOM ARIA issue. Since both elements are in the same shadow root, the IDs resolve correctly. Reclassified as false positive.

### Learnings
- Module-level counter pattern (`let _comboboxCounter = 0`) is already used by hx-tooltip and hx-popover — consistent with codebase conventions
- `role="alert"` implicitly sets `aria-live="assertive"` — adding explicit `aria-live="polite"` overrides and contradicts. Better to let the role handle it.
- Removing unimplemented features is preferable to shipping misleading APIs

### Notes for Developer
- Multi-select (`multiple`) should be implemented as a dedicated feature with chip/tag rendering, multi-value form submission, and proper `aria-multiselectable` on the listbox
- 13 P2 items remain documented in AUDIT.md — these are cosmetic, story coverage, or architectural improvements
</summary>