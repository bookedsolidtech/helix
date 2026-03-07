I'll start by examining the hx-select component and scoring it with wc-mcp tools.

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

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read hx-select component files and score with wc-mcp",
      "status": "in_progress",
      "activeForm": "Reading hx-select component files and scoring"
    },
    {
      "content": "Audit and fix design tokens (hardcoded values)",
      "status": "pending",
      "activeForm": "Auditing and fixing design tokens"
    },
    {
      "content": "Audit and fix accessibility (ARIA, keyboard)",
      "status": "pending",
      "activeForm": "Auditing and fixing accessibility"
    },
    {
      "content": "Fix TypeScript issues (strict, descriptions)",
      "status": "pending",
      "activeForm": "Fixing TypeScript issues"
    },
    {
      "content": "Fix CEM - add missing descriptions to 20 properties",
      "status": "pending",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Audit CSS/styling and CSS parts",
      "status": "pending",
      "activeForm": "Auditing CSS and CSS parts"
    },
    {
      "content": "Fix functionality issues",
      "status": "pending",
      "activeForm": "Fixing functionality issues"
    },
    {
      "content": "Run build and verify",
      "status": "pending",
      "activeForm": "Running build and verifying"
    }
  ]
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__list_events
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__list_slots
Input: {
  "tagName": "hx-select"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-select/**/*"
}
Now let me read the main component files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.test.ts"
}
Good. I now have a thorough understanding. The component is well-built. Key issues:
- **CEM**: 14 properties missing JSDoc descriptions (score blocker)
- **Accessibility**: 50/100 — missing ARIA role, aria-* attributes, keyboard events documentation in CEM
- **Design tokens/CSS**: Already using tokens properly, no hardcoded colors/spacing
- **TypeScript**: Clean, no `any` types
- **Tests**: 57 tests, comprehensive coverage

The primary fix is adding JSDoc descriptions to undocumented private members for CEM accuracy, plus enhancing the component-level a11y documentation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read hx-select component files and score with wc-mcp",
      "status": "completed",
      "activeForm": "Reading hx-select component files and scoring"
    },
    {
      "content": "Add JSDoc descriptions to 14 undocumented properties/methods",
      "status": "in_progress",
      "activeForm": "Adding JSDoc descriptions to undocumented properties"
    },
    {
      "content": "Enhance component-level accessibility documentation",
      "status": "pending",
      "activeForm": "Enhancing accessibility documentation"
    },
    {
      "content": "Run build, CEM, and tests to verify",
      "status": "pending",
      "activeForm": "Running build and verification"
    }
  ]
}
Now I'll add JSDoc descriptions to all undocumented members and enhance the accessibility documentation.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": " * @summary Form-associated custom select with label, error, and help text.\n *\n * @tag hx-select",
  "new_string": " * @summary Form-associated custom select with label, error, and help text.\n *\n * ### Accessibility\n *\n * The trigger uses `role=\"combobox\"` with `aria-expanded`, `aria-haspopup=\"listbox\"`,\n * `aria-controls`, and `aria-activedescendant` for screen-reader navigation.\n * Arrow keys, Home, End, Enter, Space, and Escape provide full keyboard support\n * following the ARIA combobox (select-only) pattern. When a label is provided it is\n * associated via `for`/`id`. Error and help-text are linked with `aria-describedby`.\n *\n * @tag hx-select"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Form Association ───\n\n  static formAssociated = true;\n\n  private _internals: ElementInternals;",
  "new_string": "  // ─── Form Association ───\n\n  /** Enables the browser's form-association lifecycle for this element. */\n  static formAssociated = true;\n\n  /** ElementInternals instance for form value, validity, and state management. */\n  private _internals: ElementInternals;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Stable IDs ───\n\n  private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;\n  private _instanceId = this._selectId;\n  private _listboxId = `${this._selectId}-listbox`;\n  private _helpTextId = `${this._selectId}-help`;\n  private _errorId = `${this._selectId}-error`;",
  "new_string": "  // ─── Stable IDs ───\n\n  /** Unique ID for the trigger element, used by the label `for` attribute. */\n  private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;\n  /** Instance identifier used to generate unique option IDs. */\n  private _instanceId = this._selectId;\n  /** ID for the listbox panel, referenced by `aria-controls`. */\n  private _listboxId = `${this._selectId}-listbox`;\n  /** ID for the help-text element, referenced by `aria-describedby`. */\n  private _helpTextId = `${this._selectId}-help`;\n  /** ID for the error element, referenced by `aria-describedby`. */\n  private _errorId = `${this._selectId}-error`;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Internal State ───\n\n  @state() private _options: SelectOption[] = [];\n  @state() private _hasErrorSlot = false;\n  @state() private _focusedOptionIndex = -1;",
  "new_string": "  // ─── Internal State ───\n\n  /** Parsed option models derived from slotted `<option>` elements. */\n  @state() private _options: SelectOption[] = [];\n  /** Whether the error slot has projected content. */\n  @state() private _hasErrorSlot = false;\n  /** Index of the currently keyboard-focused option in the listbox (-1 = none). */\n  @state() private _focusedOptionIndex = -1;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Queries ───\n\n  @query('.field__select')\n  private _select!: HTMLSelectElement;\n\n  @query('.field__trigger')\n  private _trigger!: HTMLButtonElement;",
  "new_string": "  // ─── Queries ───\n\n  /** Reference to the hidden native `<select>` used for form participation. */\n  @query('.field__select')\n  private _select!: HTMLSelectElement;\n\n  /** Reference to the visible trigger `<button>` acting as the combobox. */\n  @query('.field__trigger')\n  private _trigger!: HTMLButtonElement;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Computed helpers ───\n\n  private get _displayValue(): string {",
  "new_string": "  // ─── Computed helpers ───\n\n  /** The human-readable label of the currently selected option, or empty string. */\n  private get _displayValue(): string {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  // ─── Outside Click Handler ───\n\n  private _handleOutsideClick = (e: MouseEvent): void => {",
  "new_string": "  // ─── Outside Click Handler ───\n\n  /** Closes the dropdown when clicking outside the component. */\n  private _handleOutsideClick = (e: MouseEvent): void => {"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read hx-select component files and score with wc-mcp",
      "status": "completed",
      "activeForm": "Reading hx-select component files and scoring"
    },
    {
      "content": "Add JSDoc descriptions to 14 undocumented properties/methods",
      "status": "completed",
      "activeForm": "Adding JSDoc descriptions to undocumented properties"
    },
    {
      "content": "Enhance component-level accessibility documentation",
      "status": "completed",
      "activeForm": "Enhancing accessibility documentation"
    },
    {
      "content": "Run build, CEM, and tests to verify",
      "status": "in_progress",
      "activeForm": "Running build and verification"
    }
  ]
}
Now let me build, generate CEM, and run tests to verify.

🔧 Tool: Bash
Input: {
  "command": "npm run cem 2>&1 | tail -20",
  "description": "Generate Custom Elements Manifest",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -30",
  "description": "Run lint + format:check + type-check",
  "timeout": 120000
}
CEM generated and verify passed (0 errors). Now let me run tests.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-select/hx-select.test.ts 2>&1 | tail -80",
  "description": "Run hx-select tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests via npm script",
  "timeout": 180000
}
All 3110 tests pass (79 files). Now let me re-score the component to confirm improvement.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-select"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-select"
}
The CEM was cached. Let me force regeneration and check the output.

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library && npx custom-elements-manifest analyze --litelement --globs \"src/components/**/*.ts\" --exclude \"**/*.stories.ts\" --exclude \"**/*.styles.ts\" 2>&1",
  "description": "Force CEM regeneration",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "cat custom-elements.json | python3 -c \"\nimport json, sys\ndata = json.load(sys.stdin)\nfor mod in data.get('modules', []):\n  for decl in mod.get('declarations', []):\n    if decl.get('name') == 'HelixSelect':\n      for m in decl.get('members', []):\n        name = m.get('name','')\n        desc = m.get('description','')\n        if not desc:\n          print(f'  MISSING: {name}')\n        elif name.startswith('_') or name == 'formAssociated':\n          print(f'  OK: {name} -> {desc[:60]}')\n\" 2>&1",
  "description": "Check CEM for missing descriptions on hx-select"
}
The 14 properties from the original issue are now described. There are still private methods missing descriptions, but wc-mcp only flagged 14 items. Let me re-score now that CEM is regenerated.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-select"
}
The wc-mcp tool appears to be caching the old CEM. Let me check if there's a specific CEM path it reads from.

🔧 Tool: Glob
Input: {
  "pattern": "**/mcpwc.config.*"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/custom-elements.json 2>&1 && head -1 /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/custom-elements.json",
  "description": "Check CEM file location and freshness"
}

🔧 Tool: Bash
Input: {
  "command": "python3 -c \"\nimport json\nwith open('/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/custom-elements.json') as f:\n  data = json.load(f)\nfor mod in data.get('modules', []):\n  for decl in mod.get('declarations', []):\n    if decl.get('name') == 'HelixSelect':\n      for m in decl.get('members', []):\n        name = m.get('name','')\n        if name == 'formAssociated':\n          print(json.dumps(m, indent=2))\n          break\n\" 2>&1",
  "description": "Check CEM for formAssociated description"
}
The CEM file has the descriptions — the wc-mcp tool is using a stale cache. The descriptions ARE in the generated CEM. Let me also add descriptions to the private methods that are still missing, for completeness.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "offset": 228,
  "limit": 100
}
Now let me add JSDoc descriptions to all the remaining private methods.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _updateFormValue(): void {",
  "new_string": "  /** Pushes the current value to ElementInternals for form submission. */\n  private _updateFormValue(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _updateValidity(): void {",
  "new_string": "  /** Recalculates and sets the element's validity via ElementInternals. */\n  private _updateValidity(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _syncNativeSelect(): void {",
  "new_string": "  /** Synchronizes the hidden native select's value with the component value. */\n  private _syncNativeSelect(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _handleSlotChange(): void {",
  "new_string": "  /** Re-reads options and syncs clones when slotted content changes. */\n  private _handleSlotChange(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _parseOption(el: HTMLOptionElement): SelectOption {",
  "new_string": "  /** Extracts value, label, and disabled state from an `<option>` element. */\n  private _parseOption(el: HTMLOptionElement): SelectOption {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _readOptions(): void {",
  "new_string": "  /** Parses all slotted `<option>` and `<optgroup>` elements into internal models. */\n  private _readOptions(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _syncClonedOptions(): void {",
  "new_string": "  /** Clones slotted options into the hidden native select for form participation. */\n  private _syncClonedOptions(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _handleErrorSlotChange(e: Event): void {",
  "new_string": "  /** Tracks whether the error slot has projected content. */\n  private _handleErrorSlotChange(e: Event): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _toggleDropdown(): void {",
  "new_string": "  /** Toggles the dropdown open/closed, updating focused option index. */\n  private _toggleDropdown(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _handleKeydown(e: KeyboardEvent): void {",
  "new_string": "  /** Handles keyboard navigation (Arrow, Home, End, Enter, Space, Escape). */\n  private _handleKeydown(e: KeyboardEvent): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _selectOption(option: SelectOption): void {",
  "new_string": "  /** Selects the given option, updates value, dispatches change, and closes dropdown. */\n  private _selectOption(option: SelectOption): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _dispatchChange(): void {",
  "new_string": "  /** Fires the `hx-change` CustomEvent with the current value. */\n  private _dispatchChange(): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _handleNativeChange(e: Event): void {",
  "new_string": "  /** Forwards the native select's change event as a component value update. */\n  private _handleNativeChange(e: Event): void {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _optionId(index: number): string {",
  "new_string": "  /** Generates a unique DOM id for the option at the given index. */\n  private _optionId(index: number): string {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library/src/components/hx-select/hx-select.ts",
  "old_string": "  private _renderOptions() {",
  "new_string": "  /** Renders the listbox option elements with selection and focus states. */\n  private _renderOptions() {"
}
Now let me verify everything still passes.

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select && npm run verify 2>&1 | tail -10",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select/packages/hx-library && npx custom-elements-manifest analyze --litelement --globs \"src/components/**/*.ts\" --exclude \"**/*.stories.ts\" --exclude \"**/*.styles.ts\" 2>&1 && python3 -c \"\nimport json\nwith open('custom-elements.json') as f:\n  data = json.load(f)\nfor mod in data.get('modules', []):\n  for decl in mod.get('declarations', []):\n    if decl.get('name') == 'HelixSelect':\n      missing = [m['name'] for m in decl.get('members', []) if not m.get('description')]\n      print(f'Members without description: {len(missing)}')\n      if missing:\n        for n in missing: print(f'  - {n}')\n      else:\n        print('All members have descriptions!')\n\"",
  "description": "Regenerate CEM and check all descriptions",
  "timeout": 30000
}
All members now have descriptions. Let me verify the diff is clean.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select diff --stat",
  "description": "Check which files changed"
}
Only the `hx-select.ts` file was changed (the PNG files are screenshot artifacts from the test run). Let me confirm just the TS change.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-select diff -- packages/hx-library/src/components/hx-select/hx-select.ts | head -100",
  "description": "Show diff for hx-select.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read hx-select component files and score with wc-mcp",
      "status": "completed",
      "activeForm": "Reading hx-select component files and scoring"
    },
    {
      "content": "Add JSDoc descriptions to all undocumented properties/methods",
      "status": "completed",
      "activeForm": "Adding JSDoc descriptions to undocumented properties"
    },
    {
      "content": "Enhance component-level accessibility documentation",
      "status": "completed",
      "activeForm": "Enhancing accessibility documentation"
    },
    {
      "content": "Run build, CEM, and tests to verify",
      "status": "completed",
      "activeForm": "Running build and verification"
    }
  ]
}
All verification gates pass. Here's the final state:

- **verify**: 0 errors (lint + format:check + type-check all pass)
- **CEM**: All members have descriptions (0 missing, was 14+)
- **Tests**: 3110 passed across 79 files
- **Only file modified**: `packages/hx-library/src/components/hx-select/hx-select.ts`

<summary>
## Summary: Deep Component Audit — hx-select

### Changes Implemented
- Added JSDoc descriptions to all 14 originally flagged undocumented properties (`formAssociated`, `_internals`, `_selectId`, `_instanceId`, `_listboxId`, `_helpTextId`, `_errorId`, `_options`, `_hasErrorSlot`, `_focusedOptionIndex`, `_select`, `_trigger`, `_displayValue`, `_handleOutsideClick`)
- Added JSDoc descriptions to 16 additional private methods that were also undocumented (`_updateFormValue`, `_updateValidity`, `_syncNativeSelect`, `_handleSlotChange`, `_parseOption`, `_readOptions`, `_syncClonedOptions`, `_handleErrorSlotChange`, `_toggleDropdown`, `_handleKeydown`, `_selectOption`, `_dispatchChange`, `_handleNativeChange`, `_optionId`, `_renderOptions`)
- Enhanced the component-level JSDoc with an Accessibility section documenting ARIA patterns (combobox role, aria-expanded, aria-haspopup, aria-controls, aria-activedescendant), keyboard navigation (Arrow, Home, End, Enter, Space, Escape), and label/describedby associations

### Audit Findings (No Code Changes Needed)
- **Design Tokens**: All values use `--hx-` tokens with semantic fallbacks. No hardcoded colors, spacing, or typography found.
- **Accessibility**: Implementation is solid — combobox pattern, full keyboard nav, aria-describedby for error/help-text, aria-invalid, focus management. CEM documentation was the gap (now fixed).
- **TypeScript**: Strict mode, no `any` types, proper typing throughout.
- **CSS/Styling**: Shadow DOM encapsulated, 9 CSS parts, 12 CSS custom properties documented, reduced-motion support.
- **Functionality**: Single select, placeholder, form integration (ElementInternals), validation (checkValidity/reportValidity), disabled options, optgroup support all working.
- **Tests**: 57 tests covering rendering, properties, events, slots, CSS parts, form integration, validation, accessibility (axe-core), dropdown interaction, keyboard navigation, and aria-activedescendant.

### Files Modified
- `packages/hx-library/src/components/hx-select/hx-select.ts` (JSDoc additions only, +37 lines)
- `packages/hx-library/custom-elements.json` (regenerated, all members now described)

### Verification Status
- `npm run verify`: 0 errors
- `npm run test:library`: 3110 tests passed (79 files)
- CEM: All HelixSelect members have descriptions (0 missing)

### Risks/Blockers Encountered
- wc-mcp score_component tool uses a cached CEM and did not reflect the updated scores. The actual `custom-elements.json` file was verified directly to confirm all 30 members now have descriptions.

### Learnings
- The wc-mcp tool caches CEM data and does not pick up regenerated manifests within the same session
- hx-select was already well-implemented — the primary gap was CEM documentation (JSDoc comments on private members), not code quality

### Notes for Developer
- The component scored 88 (B) in wc-mcp. The remaining 12 points come from `propertyDescriptions` dimension scoring — now that all members have descriptions, a re-score with fresh CEM cache should show improvement.
- The accessibility implementation score (50/F) in wc-mcp is a documentation detection issue, not an actual a11y gap. The component has proper combobox ARIA patterns, keyboard navigation, and passes all axe-core audits.
</summary>