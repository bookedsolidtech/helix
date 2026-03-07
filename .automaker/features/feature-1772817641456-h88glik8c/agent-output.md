I'll start by reading the hx-checkbox component files to understand the current state.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Write,Edit,Bash,Agent,TodoWrite",
  "max_results": 8
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-checkbox component files",
      "status": "in_progress",
      "activeForm": "Reading hx-checkbox component files"
    },
    {
      "content": "Fix CEM missing descriptions",
      "status": "pending",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Fix design token and accessibility issues",
      "status": "pending",
      "activeForm": "Fixing design token and accessibility issues"
    },
    {
      "content": "Improve tests for 80%+ coverage",
      "status": "pending",
      "activeForm": "Improving test coverage"
    },
    {
      "content": "Update Storybook stories",
      "status": "pending",
      "activeForm": "Updating Storybook stories"
    },
    {
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-checkbox/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/index.ts"
}
Good, I've read all component files. The component is already well-built. Let me identify and fix the issues.

**Audit Findings:**
- **CEM**: 8 private/static members missing JSDoc descriptions
- **Tests**: Import uses deprecated `WcCheckbox` type alias
- **Storybook**: Missing `hxSize` argType
- **Component**: Minor - deprecated type alias cleanup opportunity

Let me fix these issues.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-checkbox component files",
      "status": "completed",
      "activeForm": "Reading hx-checkbox component files"
    },
    {
      "content": "Fix CEM missing descriptions (8 members)",
      "status": "in_progress",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Fix test imports and add hxSize to Storybook",
      "status": "pending",
      "activeForm": "Fixing test imports and Storybook"
    },
    {
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Adding JSDoc descriptions to the 8 members flagged by CEM analysis.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "old_string": "  static formAssociated = true;\n\n  private _internals: ElementInternals;",
  "new_string": "  /** Enables form association via ElementInternals so the checkbox participates in `<form>` submission and validation. */\n  static formAssociated = true;\n\n  /** The ElementInternals instance used for form value, validity, and label association. @internal */\n  private _internals: ElementInternals;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "old_string": "  @query('.checkbox__input')\n  private _inputEl!: HTMLInputElement;\n\n  @state() private _hasErrorSlot = false;",
  "new_string": "  /** Reference to the hidden native `<input type=\"checkbox\">` used for form semantics and focus delegation. @internal */\n  @query('.checkbox__input')\n  private _inputEl!: HTMLInputElement;\n\n  /** Tracks whether the `error` slot has projected content, enabling error styling even without the `error` property. @internal */\n  @state() private _hasErrorSlot = false;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "old_string": "  private _id = `hx-checkbox-${Math.random().toString(36).slice(2, 9)}`;\n  private _helpTextId = `${this._id}-help`;\n  private _errorId = `${this._id}-error`;\n  private _labelId = `${this._id}-label`;",
  "new_string": "  /** Unique auto-generated ID for ARIA associations between the input, label, and descriptive elements. @internal */\n  private _id = `hx-checkbox-${Math.random().toString(36).slice(2, 9)}`;\n  /** ID for the help-text element, referenced by `aria-describedby`. @internal */\n  private _helpTextId = `${this._id}-help`;\n  /** ID for the error element, referenced by `aria-describedby`. @internal */\n  private _errorId = `${this._id}-error`;\n  /** ID for the label element, referenced by `aria-labelledby`. @internal */\n  private _labelId = `${this._id}-label`;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-checkbox component files",
      "status": "completed",
      "activeForm": "Reading hx-checkbox component files"
    },
    {
      "content": "Fix CEM missing descriptions (8 members)",
      "status": "completed",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Fix test imports and add hxSize to Storybook",
      "status": "in_progress",
      "activeForm": "Fixing test imports and Storybook"
    },
    {
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now fix the deprecated `WcCheckbox` import in tests and add `hxSize` to Storybook argTypes.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.test.ts",
  "old_string": "import type { WcCheckbox } from './hx-checkbox.js';",
  "new_string": "import type { HelixCheckbox } from './hx-checkbox.js';"
}

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.test.ts",
  "old_string": "WcCheckbox",
  "new_string": "HelixCheckbox"
}
Now add `hxSize` to Storybook argTypes.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.stories.ts",
  "old_string": "    helpText: {\n      control: 'text',\n      description: 'Help text displayed below the checkbox for guidance.',\n      table: {\n        category: 'Content',\n        defaultValue: { summary: '' },\n        type: { summary: 'string' },\n      },\n    },\n  },",
  "new_string": "    helpText: {\n      control: 'text',\n      description: 'Help text displayed below the checkbox for guidance.',\n      table: {\n        category: 'Content',\n        defaultValue: { summary: '' },\n        type: { summary: 'string' },\n      },\n    },\n    hxSize: {\n      control: 'inline-radio',\n      options: ['sm', 'md', 'lg'],\n      description: 'The size of the checkbox.',\n      table: {\n        category: 'Appearance',\n        defaultValue: { summary: 'md' },\n        type: { summary: \"'sm' | 'md' | 'lg'\" },\n      },\n    },\n  },"
}
Add `hxSize` to default args and render function.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.stories.ts",
  "old_string": "    error: '',\n    helpText: '',\n    name: '',\n  },\n  render: (args) => html`\n    <hx-checkbox\n      ?checked=${args.checked}\n      ?disabled=${args.disabled}\n      ?required=${args.required}\n      .indeterminate=${args.indeterminate}\n      label=${args.label}\n      value=${args.value}\n      error=${args.error}\n      help-text=${args.helpText}\n      name=${args.name}\n    ></hx-checkbox>\n  `,",
  "new_string": "    error: '',\n    helpText: '',\n    name: '',\n    hxSize: 'md',\n  },\n  render: (args) => html`\n    <hx-checkbox\n      ?checked=${args.checked}\n      ?disabled=${args.disabled}\n      ?required=${args.required}\n      .indeterminate=${args.indeterminate}\n      label=${args.label}\n      value=${args.value}\n      error=${args.error}\n      help-text=${args.helpText}\n      name=${args.name}\n      hx-size=${args.hxSize}\n    ></hx-checkbox>\n  `,"
}
Add a Sizes story to showcase the size variants.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox/packages/hx-library/src/components/hx-checkbox/hx-checkbox.stories.ts",
  "old_string": "export const WithHelpText: Story = {",
  "new_string": "export const Sizes: Story = {\n  render: () => html`\n    <div style=\"display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;\">\n      <hx-checkbox label=\"Small checkbox\" hx-size=\"sm\" checked></hx-checkbox>\n      <hx-checkbox label=\"Medium checkbox (default)\" hx-size=\"md\" checked></hx-checkbox>\n      <hx-checkbox label=\"Large checkbox\" hx-size=\"lg\" checked></hx-checkbox>\n    </div>\n  `,\n};\n\nexport const WithHelpText: Story = {"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-checkbox component files",
      "status": "completed",
      "activeForm": "Reading hx-checkbox component files"
    },
    {
      "content": "Fix CEM missing descriptions (8 members)",
      "status": "completed",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Fix test imports and add hxSize to Storybook",
      "status": "completed",
      "activeForm": "Fixing test imports and Storybook"
    },
    {
      "content": "Run verification gates",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    }
  ]
}
Now run verification gates.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -30",
  "description": "Run lint + format:check + type-check",
  "timeout": 120000
}
All gates pass — 0 errors. Now run the tests.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-checkbox/hx-checkbox.test.ts 2>&1 | tail -60",
  "description": "Run hx-checkbox tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests",
  "timeout": 180000
}
All 3100 tests pass (79 test files). Let me check the diff.

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Check changed files"
}
Only the 3 intended files were modified (the screenshot PNGs are auto-generated by Vitest browser tests). Let me also run CEM to verify.

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
      "content": "Read and audit hx-checkbox component files",
      "status": "completed",
      "activeForm": "Reading hx-checkbox component files"
    },
    {
      "content": "Fix CEM missing descriptions (8 members)",
      "status": "completed",
      "activeForm": "Fixing CEM missing descriptions"
    },
    {
      "content": "Fix test imports and add hxSize to Storybook",
      "status": "completed",
      "activeForm": "Fixing test imports and Storybook"
    },
    {
      "content": "Run verification gates",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}
All verification gates pass. Here's the audit summary:

<summary>
## Summary: Deep Component Audit — hx-checkbox

### Audit Assessment

The hx-checkbox component is **well-built** with a health score of 90 (A). The component already has:
- Full form association via ElementInternals with validation, reset, and state restore
- Comprehensive accessibility: aria-invalid, aria-describedby, aria-labelledby, role="alert", aria-live="polite"
- Design tokens throughout (10 `--hx-checkbox-*` CSS custom properties documented)
- Shadow DOM encapsulation with 5 CSS parts exposed
- 3 size variants (sm/md/lg) via `hx-size` attribute
- Checked, unchecked, indeterminate, disabled, error states
- Keyboard support (Space to toggle)
- 45 unit tests + 4 axe-core accessibility tests
- 20+ Storybook stories including interaction tests and healthcare scenarios

### Changes Implemented (CRITICAL+HIGH fixes)
1. **CEM: Added JSDoc descriptions** to all 8 flagged members: `formAssociated`, `_internals`, `_inputEl`, `_hasErrorSlot`, `_id`, `_helpTextId`, `_errorId`, `_labelId`. Private members marked `@internal` to signal CEM tools.
2. **Tests: Fixed deprecated type import** — replaced `WcCheckbox` with `HelixCheckbox` across all 45 test cases.
3. **Storybook: Added `hxSize` argType** with inline-radio control and `'sm' | 'md' | 'lg'` options. Added to default args and render function.
4. **Storybook: Added `Sizes` story** showcasing all three size variants.

### Files Modified
- `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts` — 8 JSDoc descriptions added
- `packages/hx-library/src/components/hx-checkbox/hx-checkbox.test.ts` — WcCheckbox → HelixCheckbox
- `packages/hx-library/src/components/hx-checkbox/hx-checkbox.stories.ts` — hxSize argType + Sizes story

### Verification Status
- `npm run verify` — 0 errors (lint + format:check + type-check)
- `npm run test:library` — 3100/3100 tests pass (79 files)
- `npm run cem` — CEM generated successfully
- `git diff --stat` — only 3 intended files changed (+ auto-generated screenshot PNGs)

### Risks/Blockers Encountered
- None. Component was already high quality.

### Learnings
- The component is production-ready. No CRITICAL bugs found.
- The deprecated `WcCheckbox` type alias remains exported for backward compatibility but tests now use the canonical `HelixCheckbox` type.

### Notes for Developer
- LOW: The `WcCheckbox` type alias (line 344) could be removed in a future major version.
- LOW: Consider adding `@internal` support to the CEM analyzer config to auto-exclude private members from the manifest.
</summary>