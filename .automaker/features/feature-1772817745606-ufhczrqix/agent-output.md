I'll start by reading the component files and running wc-mcp analysis in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Agent,TodoWrite,Write,Edit",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__get_design_tokens",
  "max_results": 5
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
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit summary",
      "status": "pending",
      "activeForm": "Writing audit summary"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-field-label/**/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-field-label"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-field-label"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-field-label"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-field-label"
}
Now let me read all the source files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/AUDIT.md"
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
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit summary",
      "status": "pending",
      "activeForm": "Writing audit summary"
    }
  ]
}
Good — I have a thorough picture. The previous T4-06 audit found 3 P0, 3 P1, and 3 P2 issues. I need to fix CRITICAL (P0) and HIGH (P1) issues. Let me delegate fixes to specialists in parallel.

🔧 Tool: Agent
Input: {
  "description": "Fix P1-01 required indicator a11y",
  "subagent_type": "lit-specialist",
  "prompt": "You are fixing a P1 accessibility issue in `hx-field-label` component.\n\n**File:** `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts`\n\n**Problem (P1-01):** The required asterisk `*` is rendered with `aria-hidden=\"true\"` but there is NO visually-hidden text to communicate \"required\" to assistive technology. This violates WCAG 1.3.1 (Info and Relationships, Level A).\n\nCurrent code (lines 60-64):\n```ts\nconst requiredIndicator = this.required\n  ? html`<span part=\"required-indicator\" class=\"required-indicator\" aria-hidden=\"true\"\n      ><slot name=\"required-indicator\">*</slot></span\n    >`\n  : nothing;\n```\n\n**Required fix:** Change the required indicator to include visually-hidden \"required\" text:\n\n```ts\nconst requiredIndicator = this.required\n  ? html`<span part=\"required-indicator\" class=\"required-indicator\">\n      <span aria-hidden=\"true\"><slot name=\"required-indicator\">*</slot></span>\n      <span class=\"visually-hidden\">required</span>\n    </span>`\n  : nothing;\n```\n\n**Also needed:** Add the `.visually-hidden` class to the styles file at `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts`:\n\n```css\n.visually-hidden {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n```\n\n**Also fix P1-03:** The `--hx-color-danger` token is consumed but not documented. In the styles file, replace the required indicator color:\n\nFROM:\n```css\n.required-indicator {\n  color: var(--hx-color-danger, var(--hx-color-error-500, #ef4444));\n  font-weight: var(--hx-font-weight-bold, 700);\n}\n```\n\nTO:\n```css\n.required-indicator {\n  color: var(--hx-field-label-required-color, var(--hx-color-danger, var(--hx-color-error-500, #ef4444)));\n  font-weight: var(--hx-font-weight-bold, 700);\n}\n```\n\nAnd in the JSDoc of hx-field-label.ts, add a new `@cssprop` line after the existing ones:\n```\n * @cssprop [--hx-field-label-required-color=var(--hx-color-danger)] - Required indicator color.\n```\n\n**Also fix P0-01 (documentation):** Update the class JSDoc description to be accurate about the shadow DOM limitation:\n\nReplace the description block (lines 7-14) with:\n```\n * Standardized label for form fields. Used as a consistent sub-component\n * for hx-field and other form field components.\n *\n * When the `for` attribute is set, renders a native `<label for=\"...\">` element.\n * **Important:** Due to shadow DOM encapsulation, the `for` attribute only\n * associates with inputs in the same shadow root. For labeling inputs outside\n * the shadow boundary, use `aria-labelledby` on the input referencing this\n * component's `id` attribute instead.\n *\n * When `for` is unset, renders a `<span>` that can be referenced via\n * `aria-labelledby` for labeling controls across shadow DOM boundaries.\n```\n\nAlso update the `for` property JSDoc (lines 37-41):\n```\n  /**\n   * The ID of the associated form control. When set, renders a native\n   * `<label for=\"...\">` element. Note: due to shadow DOM encapsulation,\n   * this only works for inputs within the same shadow root. For cross-boundary\n   * labeling, use `aria-labelledby` on the target input instead.\n   * @attr for\n   */\n```\n\nMake ALL of these changes. Read the files first, then edit them."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Edit",
  "max_results": 2
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts",
  "old_string": " * Standardized label for form fields. Used as a consistent sub-component\n * for hx-field and other form field components.\n *\n * When the `for` attribute is set, renders a native `<label for=\"...\">` element\n * for direct label association with a same-document form control.\n *\n * When `for` is unset, renders a `<span>` that can be referenced via\n * `aria-labelledby` for labeling controls in a shadow DOM boundary.",
  "new_string": " * Standardized label for form fields. Used as a consistent sub-component\n * for hx-field and other form field components.\n *\n * When the `for` attribute is set, renders a native `<label for=\"...\">` element.\n * **Important:** Due to shadow DOM encapsulation, the `for` attribute only\n * associates with inputs in the same shadow root. For labeling inputs outside\n * the shadow boundary, use `aria-labelledby` on the input referencing this\n * component's `id` attribute instead.\n *\n * When `for` is unset, renders a `<span>` that can be referenced via\n * `aria-labelledby` for labeling controls across shadow DOM boundaries."
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts",
  "old_string": " * @cssprop [--hx-font-label-family=var(--hx-font-family-sans)] - Label font family.",
  "new_string": " * @cssprop [--hx-font-label-family=var(--hx-font-family-sans)] - Label font family.\n * @cssprop [--hx-field-label-required-color=var(--hx-color-danger)] - Required indicator color."
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts",
  "old_string": "  /**\n   * The ID of the associated form control. When set, renders a native\n   * `<label for=\"...\">` element for direct label association.\n   * @attr for\n   */",
  "new_string": "  /**\n   * The ID of the associated form control. When set, renders a native\n   * `<label for=\"...\">` element. Note: due to shadow DOM encapsulation,\n   * this only works for inputs within the same shadow root. For cross-boundary\n   * labeling, use `aria-labelledby` on the target input instead.\n   * @attr for\n   */"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts",
  "old_string": "    const requiredIndicator = this.required\n      ? html`<span part=\"required-indicator\" class=\"required-indicator\" aria-hidden=\"true\"\n          ><slot name=\"required-indicator\">*</slot></span\n        >`\n      : nothing;",
  "new_string": "    const requiredIndicator = this.required\n      ? html`<span part=\"required-indicator\" class=\"required-indicator\">\n          <span aria-hidden=\"true\"><slot name=\"required-indicator\">*</slot></span>\n          <span class=\"visually-hidden\">required</span>\n        </span>`\n      : nothing;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts",
  "old_string": "  .required-indicator {\n    color: var(--hx-color-danger, var(--hx-color-error-500, #ef4444));\n    font-weight: var(--hx-font-weight-bold, 700);\n  }",
  "new_string": "  .required-indicator {\n    color: var(--hx-field-label-required-color, var(--hx-color-danger, var(--hx-color-error-500, #ef4444)));\n    font-weight: var(--hx-font-weight-bold, 700);\n  }\n\n  .visually-hidden {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border: 0;\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts"
}

🔧 Tool: Agent
Input: {
  "description": "Fix P0-02 and P1-02 stories",
  "subagent_type": "storybook-specialist",
  "prompt": "You are fixing P0 and P1 issues in `hx-field-label` Storybook stories.\n\n**File:** `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts`\n\n**P0-02: Stories demonstrate broken cross-shadow-DOM label association as working examples.**\n\nThe `WithFor` story and `HealthcareFormLabels` story show `<hx-field-label for=\"id\">` with `<input id=\"id\">` in light DOM. Due to shadow DOM encapsulation, the `for` attribute on the `<label>` element inside the shadow root CANNOT reach inputs in light DOM. These stories mislead consumers.\n\n**Fix for P0-02:** \n1. Update the `WithFor` story to clearly document the shadow DOM limitation and show the `aria-labelledby` pattern as the recommended cross-boundary approach.\n2. Update `HealthcareFormLabels` to use the `aria-labelledby` pattern instead.\n3. Add an `AriaLabelledby` story showing the correct cross-boundary pattern:\n\nFor the `WithFor` story, change the render to show both approaches — keep `for` but add aria-labelledby on the input. The story name should explain this. Actually, the simplest fix: rename it, and demonstrate the correct aria-labelledby pattern. Here's what the WithFor story should become:\n\n```ts\nexport const WithAriaLabelledby: Story = {\n  name: 'Cross-boundary Label (aria-labelledby)',\n  render: () => html`\n    <div>\n      <hx-field-label id=\"email-label\">Patient Email</hx-field-label>\n      <input\n        id=\"patient-email\"\n        type=\"email\"\n        aria-labelledby=\"email-label\"\n        placeholder=\"clinician@hospital.org\"\n        style=\"display: block; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n      />\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host).toBeTruthy();\n    await expect(host.id).toBe('email-label');\n    \n    const input = canvasElement.querySelector('input');\n    await expect(input?.getAttribute('aria-labelledby')).toBe('email-label');\n  },\n};\n```\n\nFor HealthcareFormLabels, update all field/input pairings to use `aria-labelledby` + `id` on the label host instead of `for` attribute:\n\n```ts\nexport const HealthcareFormLabels: Story = {\n  name: 'Healthcare: Form Labels',\n  render: () => html`\n    <form style=\"display: flex; flex-direction: column; gap: 1.25rem; max-width: 400px;\">\n      <div>\n        <hx-field-label required id=\"patient-name-label\">Full Name</hx-field-label>\n        <input\n          id=\"patient-name\"\n          type=\"text\"\n          placeholder=\"First Middle Last\"\n          required\n          aria-labelledby=\"patient-name-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n\n      <div>\n        <hx-field-label required id=\"dob-label\">Date of Birth</hx-field-label>\n        <input\n          id=\"dob\"\n          type=\"date\"\n          required\n          aria-labelledby=\"dob-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n\n      <div>\n        <hx-field-label optional id=\"pcp-label\">Primary Care Provider</hx-field-label>\n        <input\n          id=\"pcp\"\n          type=\"text\"\n          placeholder=\"Dr. Eleanor Vance, MD\"\n          aria-labelledby=\"pcp-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n    </form>\n  `,\n};\n```\n\n**P1-02: Play tests use `getByRole('generic')` incorrectly for `<label>` elements.**\n\nIn the `Default` story play test, replace:\n```ts\nconst shadow = within(getShadowRoot(host));\nconst base = shadow.getByRole('generic', { hidden: true });\nawait expect(base.tagName.toLowerCase()).toBe('span');\n```\nwith:\n```ts\nconst base = host.shadowRoot!.querySelector('[part=\"base\"]');\nawait expect(base?.tagName.toLowerCase()).toBe('span');\n```\n\nThe `WithFor` story is being replaced, so its play test is handled. But also fix the other interaction test stories that use the same pattern.\n\nFor the `LabelRenderedWithFor` interaction story, update it to use `aria-labelledby` pattern and fix the querySelector approach:\n```ts\nexport const LabelRenderedWithFor: Story = {\n  name: 'Interaction: Renders label with for',\n  render: () => html`<hx-field-label for=\"some-input\">Patient ID</hx-field-label>`,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    const base = host.shadowRoot!.querySelector('[part=\"base\"]');\n    await expect(base?.tagName.toLowerCase()).toBe('label');\n    await expect(base?.getAttribute('for')).toBe('some-input');\n  },\n};\n```\n\nAlso fix `SpanRenderedWithoutFor` - it already uses `shadowRoot.querySelector` so it's fine.\n\nFor `CSSCustomProperties` story, change the `--hx-color-danger` demo to use the new `--hx-field-label-required-color` token instead:\nChange the third demo div from:\n```\n--hx-color-danger (required indicator)\n```\nto:\n```\n--hx-field-label-required-color\n```\nAnd the style attribute from `--hx-color-danger: #d97706` to `--hx-field-label-required-color: #d97706`.\n\nAlso update the `Required` story play test to not rely on `within(getShadowRoot(...))`:\n```ts\nplay: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host.hasAttribute('required')).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"required-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    await expect(indicator?.getAttribute('aria-hidden')).toBeNull();\n    \n    const ariaHidden = indicator?.querySelector('[aria-hidden=\"true\"]');\n    await expect(ariaHidden).toBeTruthy();\n  },\n```\n\nWait — actually after the P1-01 fix, the `aria-hidden` is now on a nested `<span>` inside the required-indicator part, not on the part itself. The indicator part no longer has `aria-hidden=\"true\"`. So the Required play test needs updating. Let me adjust:\n\nFor the `Required` story:\n```ts\nplay: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host.hasAttribute('required')).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"required-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    \n    const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n    await expect(hiddenSpan).toBeTruthy();\n  },\n```\n\nAnd `RequiredIndicatorPresent`:\n```ts\nplay: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement) as HelixFieldLabel;\n    await expect(host.required).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"required-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    \n    const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n    await expect(hiddenSpan).toBeTruthy();\n  },\n```\n\nAnd `Optional` and `OptionalIndicatorPresent` should also use `host.shadowRoot!.querySelector` instead of `within(getShadowRoot(...))`:\n\n```ts\n// Optional play test\nplay: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host.hasAttribute('optional')).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"optional-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    await expect(indicator?.textContent?.trim()).toBe('(optional)');\n  },\n```\n\nRead the stories file first, then make all these edits. Keep the same structure and patterns. Do NOT remove the `getShadowRoot` helper function — other code may reference it. Just update the play tests."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts"
}

🔧 Tool: Agent
Input: {
  "description": "Fix P2-02 slot test + update tests",
  "subagent_type": "qa-engineer-automation",
  "prompt": "You are fixing test issues in `hx-field-label` test file.\n\n**File:** `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts`\n\n**Important context — after fixes to the component, the required indicator template will change FROM:**\n```html\n<span part=\"required-indicator\" class=\"required-indicator\" aria-hidden=\"true\">\n  <slot name=\"required-indicator\">*</slot>\n</span>\n```\n\n**TO:**\n```html\n<span part=\"required-indicator\" class=\"required-indicator\">\n  <span aria-hidden=\"true\"><slot name=\"required-indicator\">*</slot></span>\n  <span class=\"visually-hidden\">required</span>\n</span>\n```\n\nThis means `aria-hidden=\"true\"` is NO LONGER on the `[part=\"required-indicator\"]` element — it's on a nested `<span>` inside it.\n\n**Fix 1:** Update the test at line 87-91 that checks for `aria-hidden`:\n\nFROM:\n```ts\nit('required indicator has aria-hidden=\"true\"', async () => {\n  const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n  const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n  expect(indicator?.getAttribute('aria-hidden')).toBe('true');\n});\n```\n\nTO:\n```ts\nit('required indicator has aria-hidden on visual asterisk', async () => {\n  const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n  const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n  const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n  expect(hiddenSpan).toBeTruthy();\n});\n```\n\n**Fix 2:** Add a new test after the above to verify the visually-hidden \"required\" text exists:\n\n```ts\nit('required indicator includes visually-hidden \"required\" text for AT', async () => {\n  const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n  const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n  const srText = indicator?.querySelector('.visually-hidden');\n  expect(srText).toBeTruthy();\n  expect(srText?.textContent?.trim()).toBe('required');\n});\n```\n\n**Fix 3 (P2-02):** Fix the slot test at lines 137-143. Currently it only queries light DOM. Add a shadow DOM assertion:\n\nFROM:\n```ts\nit('required-indicator slot overrides default asterisk', async () => {\n  const el = await fixture<HelixFieldLabel>(\n    '<hx-field-label required><span slot=\"required-indicator\">(req)</span></hx-field-label>',\n  );\n  const slotted = el.querySelector('[slot=\"required-indicator\"]');\n  expect(slotted?.textContent).toBe('(req)');\n});\n```\n\nTO:\n```ts\nit('required-indicator slot overrides default asterisk', async () => {\n  const el = await fixture<HelixFieldLabel>(\n    '<hx-field-label required><span slot=\"required-indicator\">(req)</span></hx-field-label>',\n  );\n  const slotted = el.querySelector('[slot=\"required-indicator\"]');\n  expect(slotted?.textContent).toBe('(req)');\n\n  const slot = el.shadowRoot?.querySelector('slot[name=\"required-indicator\"]') as HTMLSlotElement | null;\n  expect(slot).toBeTruthy();\n  const assignedNodes = slot?.assignedNodes({ flatten: false }) ?? [];\n  expect(assignedNodes.length).toBeGreaterThan(0);\n});\n```\n\nRead the test file first, then make these specific edits. Do not change any other tests."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Write",
  "max_results": 1
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts",
  "old_string": "    it('required indicator has aria-hidden=\"true\"', async () => {\n      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n      const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n      expect(indicator?.getAttribute('aria-hidden')).toBe('true');\n    });",
  "new_string": "    it('required indicator has aria-hidden on visual asterisk', async () => {\n      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n      const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n      const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n      expect(hiddenSpan).toBeTruthy();\n    });\n\n    it('required indicator includes visually-hidden \"required\" text for AT', async () => {\n      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');\n      const indicator = shadowQuery(el, '[part=\"required-indicator\"]');\n      const srText = indicator?.querySelector('.visually-hidden');\n      expect(srText).toBeTruthy();\n      expect(srText?.textContent?.trim()).toBe('required');\n    });"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts",
  "old_string": "    it('required-indicator slot overrides default asterisk', async () => {\n      const el = await fixture<HelixFieldLabel>(\n        '<hx-field-label required><span slot=\"required-indicator\">(req)</span></hx-field-label>',\n      );\n      const slotted = el.querySelector('[slot=\"required-indicator\"]');\n      expect(slotted?.textContent).toBe('(req)');\n    });",
  "new_string": "    it('required-indicator slot overrides default asterisk', async () => {\n      const el = await fixture<HelixFieldLabel>(\n        '<hx-field-label required><span slot=\"required-indicator\">(req)</span></hx-field-label>',\n      );\n      const slotted = el.querySelector('[slot=\"required-indicator\"]');\n      expect(slotted?.textContent).toBe('(req)');\n\n      const slot = el.shadowRoot?.querySelector('slot[name=\"required-indicator\"]') as HTMLSlotElement | null;\n      expect(slot).toBeTruthy();\n      const assignedNodes = slot?.assignedNodes({ flatten: false }) ?? [];\n      expect(assignedNodes.length).toBeGreaterThan(0);\n    });"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts",
  "content": "import type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport { expect } from 'storybook/test';\nimport type { HelixFieldLabel } from './hx-field-label.js';\nimport './hx-field-label.js';\n\n// ─────────────────────────────────────────────────\n// Test Helpers\n// ─────────────────────────────────────────────────\n\nfunction getLabelHost(canvasElement: Element): HTMLElement {\n  const host = canvasElement.querySelector('hx-field-label');\n  if (!host) {\n    throw new Error('hx-field-label element not found');\n  }\n  return host as HTMLElement;\n}\n\nfunction getShadowRoot(host: HTMLElement): HTMLElement {\n  if (!host.shadowRoot) {\n    throw new Error('shadowRoot not available on hx-field-label');\n  }\n  return host.shadowRoot as unknown as HTMLElement;\n}\n\n// ─────────────────────────────────────────────────\n// Meta Configuration\n// ─────────────────────────────────────────────────\n\nconst meta = {\n  title: 'Components/FieldLabel',\n  component: 'hx-field-label',\n  tags: ['autodocs'],\n  argTypes: {\n    for: {\n      control: 'text',\n      description:\n        'ID of the associated form control. When set, renders a native `<label for=\"...\">` element. **Note:** Due to shadow DOM encapsulation, the native `for` association only works for inputs within the same shadow root. For cross-boundary labeling (the common case), use `aria-labelledby` on the input referencing this component\\'s `id` instead.',\n      table: {\n        category: 'Association',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },\n    required: {\n      control: 'boolean',\n      description:\n        'Renders a required (*) indicator next to the label text. Does not add required validation to the associated control — set required on the control itself.',\n      table: {\n        category: 'State',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n    optional: {\n      control: 'boolean',\n      description: 'Renders an \"(optional)\" indicator next to the label text.',\n      table: {\n        category: 'State',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n  },\n  args: {\n    for: '',\n    required: false,\n    optional: false,\n  },\n  render: (args) => html`\n    <hx-field-label ?required=${args.required} ?optional=${args.optional} for=${args.for || ''}>\n      Email Address\n    </hx-field-label>\n  `,\n} satisfies Meta;\n\nexport default meta;\n\ntype Story = StoryObj;\n\n// ─────────────────────────────────────────────────\n// 1. DEFAULT — span (no for attribute)\n// ─────────────────────────────────────────────────\n\nexport const Default: Story = {\n  name: 'Default (span)',\n  args: {},\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host).toBeTruthy();\n\n    const base = host.shadowRoot!.querySelector('[part=\"base\"]');\n    await expect(base?.tagName.toLowerCase()).toBe('span');\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 2. CROSS-BOUNDARY LABEL — aria-labelledby pattern\n// ─────────────────────────────────────────────────\n\nexport const WithAriaLabelledby: Story = {\n  name: 'Cross-boundary Label (aria-labelledby)',\n  render: () => html`\n    <div>\n      <hx-field-label id=\"email-label\">Patient Email</hx-field-label>\n      <input\n        id=\"patient-email\"\n        type=\"email\"\n        aria-labelledby=\"email-label\"\n        placeholder=\"clinician@hospital.org\"\n        style=\"display: block; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n      />\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host).toBeTruthy();\n    await expect(host.id).toBe('email-label');\n\n    const input = canvasElement.querySelector('input');\n    await expect(input?.getAttribute('aria-labelledby')).toBe('email-label');\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 3. REQUIRED\n// ─────────────────────────────────────────────────\n\nexport const Required: Story = {\n  name: 'Required',\n  args: {\n    required: true,\n  },\n  render: () => html`\n    <hx-field-label required for=\"mrn\">Medical Record Number</hx-field-label>\n  `,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host.hasAttribute('required')).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"required-indicator\"]');\n    await expect(indicator).toBeTruthy();\n\n    const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n    await expect(hiddenSpan).toBeTruthy();\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 4. OPTIONAL\n// ─────────────────────────────────────────────────\n\nexport const Optional: Story = {\n  name: 'Optional',\n  args: {\n    optional: true,\n  },\n  render: () => html`\n    <hx-field-label optional for=\"notes\">Additional Notes</hx-field-label>\n  `,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    await expect(host.hasAttribute('optional')).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"optional-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    await expect(indicator?.textContent?.trim()).toBe('(optional)');\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 5. CUSTOM REQUIRED INDICATOR (slot)\n// ─────────────────────────────────────────────────\n\nexport const CustomRequiredIndicator: Story = {\n  name: 'Custom Required Indicator (slot)',\n  render: () => html`\n    <hx-field-label required for=\"insurance-id\">\n      Insurance ID\n      <span slot=\"required-indicator\" style=\"color: var(--hx-color-error-500, #ef4444);\">\n        (required)\n      </span>\n    </hx-field-label>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// 6. CSS PARTS DEMO\n// ─────────────────────────────────────────────────\n\nexport const CSSParts: Story = {\n  name: 'CSS Parts',\n  render: () => html`\n    <style>\n      .parts-demo hx-field-label::part(base) {\n        font-size: 0.6875rem;\n        text-transform: uppercase;\n        letter-spacing: 0.08em;\n        color: #0d6efd;\n        font-weight: 700;\n      }\n      .parts-demo hx-field-label::part(required-indicator) {\n        font-size: 1rem;\n        color: #dc3545;\n      }\n      .parts-demo hx-field-label::part(optional-indicator) {\n        font-style: italic;\n        color: #6c757d;\n      }\n    </style>\n    <div class=\"parts-demo\" style=\"display: flex; flex-direction: column; gap: 1rem;\">\n      <hx-field-label required for=\"demo-required\">\n        Required Field (styled via ::part)\n      </hx-field-label>\n      <hx-field-label optional for=\"demo-optional\">\n        Optional Field (styled via ::part)\n      </hx-field-label>\n    </div>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// 7. HEALTHCARE SCENARIOS\n// ─────────────────────────────────────────────────\n\nexport const HealthcareFormLabels: Story = {\n  name: 'Healthcare: Form Labels',\n  render: () => html`\n    <form style=\"display: flex; flex-direction: column; gap: 1.25rem; max-width: 400px;\">\n      <div>\n        <hx-field-label required id=\"patient-name-label\">Full Name</hx-field-label>\n        <input\n          id=\"patient-name\"\n          type=\"text\"\n          placeholder=\"First Middle Last\"\n          required\n          aria-labelledby=\"patient-name-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n\n      <div>\n        <hx-field-label required id=\"dob-label\">Date of Birth</hx-field-label>\n        <input\n          id=\"dob\"\n          type=\"date\"\n          required\n          aria-labelledby=\"dob-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n\n      <div>\n        <hx-field-label optional id=\"pcp-label\">Primary Care Provider</hx-field-label>\n        <input\n          id=\"pcp\"\n          type=\"text\"\n          placeholder=\"Dr. Eleanor Vance, MD\"\n          aria-labelledby=\"pcp-label\"\n          style=\"display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;\"\n        />\n      </div>\n    </form>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// 8. CSS CUSTOM PROPERTIES\n// ─────────────────────────────────────────────────\n\nexport const CSSCustomProperties: Story = {\n  name: 'CSS Custom Properties',\n  render: () => html`\n    <div style=\"display: flex; flex-direction: column; gap: 1.5rem;\">\n      <div>\n        <p\n          style=\"margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;\"\n        >\n          Default\n        </p>\n        <hx-field-label required>Default label color</hx-field-label>\n      </div>\n\n      <div>\n        <p\n          style=\"margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;\"\n        >\n          --hx-field-label-color\n        </p>\n        <hx-field-label required style=\"--hx-field-label-color: #2563eb;\">\n          Custom brand label color\n        </hx-field-label>\n      </div>\n\n      <div>\n        <p\n          style=\"margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;\"\n        >\n          --hx-field-label-required-color\n        </p>\n        <hx-field-label required style=\"--hx-field-label-required-color: #d97706;\">\n          Custom amber required indicator\n        </hx-field-label>\n      </div>\n    </div>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// INTERACTION TESTS\n// ─────────────────────────────────────────────────\n\nexport const SpanRenderedWithoutFor: Story = {\n  name: 'Interaction: Renders span without for',\n  render: () => html`<hx-field-label>Diagnosis Code</hx-field-label>`,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    const base = host.shadowRoot!.querySelector('[part=\"base\"]');\n    await expect(base?.tagName.toLowerCase()).toBe('span');\n  },\n};\n\nexport const LabelRenderedWithFor: Story = {\n  name: 'Interaction: Renders label with for',\n  render: () => html`<hx-field-label for=\"some-input\">Patient ID</hx-field-label>`,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement);\n    const base = host.shadowRoot!.querySelector('[part=\"base\"]');\n    await expect(base?.tagName.toLowerCase()).toBe('label');\n    await expect(base?.getAttribute('for')).toBe('some-input');\n  },\n};\n\nexport const RequiredIndicatorPresent: Story = {\n  name: 'Interaction: Required indicator present',\n  render: () => html`<hx-field-label required>MRN</hx-field-label>`,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement) as HelixFieldLabel;\n    await expect(host.required).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"required-indicator\"]');\n    await expect(indicator).toBeTruthy();\n\n    const hiddenSpan = indicator?.querySelector('[aria-hidden=\"true\"]');\n    await expect(hiddenSpan).toBeTruthy();\n  },\n};\n\nexport const OptionalIndicatorPresent: Story = {\n  name: 'Interaction: Optional indicator present',\n  render: () => html`<hx-field-label optional>Notes</hx-field-label>`,\n  play: async ({ canvasElement }) => {\n    const host = getLabelHost(canvasElement) as HelixFieldLabel;\n    await expect(host.optional).toBe(true);\n\n    const indicator = host.shadowRoot!.querySelector('[part=\"optional-indicator\"]');\n    await expect(indicator).toBeTruthy();\n    await expect(indicator?.textContent?.trim()).toBe('(optional)');\n  },\n};\n"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Bash",
  "max_results": 1
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --project packages/hx-library/tsconfig.json 2>&1 | head -30",
  "description": "Type-check the library to verify story file has no TS errors",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label diff packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts",
  "description": "Show diff of story file changes"
}
All fixes applied. Let me verify the changes and run the build.

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
      "content": "Run verification gates",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit summary",
      "status": "pending",
      "activeForm": "Writing audit summary"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -30",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
Lint error: `getShadowRoot` is unused. Let me remove it from the stories file.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts",
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts",
  "old_string": "function getShadowRoot(host: HTMLElement): HTMLElement {\n  if (!host.shadowRoot) {\n    throw new Error('shadowRoot not available on hx-field-label');\n  }\n  return host.shadowRoot as unknown as HTMLElement;\n}\n\n// ─────────────────────────────────────────────────",
  "new_string": "// ─────────────────────────────────────────────────"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Re-run verify after fixing lint error",
  "timeout": 120000
}
Formatting issue. Let me fix it.

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts 2>&1",
  "description": "Format the styles file"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Re-run verify after formatting fix",
  "timeout": 120000
}
All gates pass. Now let me run the tests for this component.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-field-label/ 2>&1 | tail -50",
  "description": "Run hx-field-label tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -50",
  "description": "Run library tests via npm script",
  "timeout": 300000
}
All 3101 tests pass including the updated hx-field-label tests. Let me verify the diff.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label diff --stat",
  "description": "Check changed files"
}
Only the 4 target files changed (plus unrelated screenshot diffs from test runs). Let me update the AUDIT.md and write the summary.

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
      "content": "Run verification gates",
      "status": "completed",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit summary",
      "status": "in_progress",
      "activeForm": "Writing audit summary"
    }
  ]
}
Let me quickly verify the final state of the changed files to make sure everything is correct.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts"
}
Everything looks correct. Let me update the AUDIT.md with the fix status and finalize.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/AUDIT.md",
  "offset": 164
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-field-label/packages/hx-library/src/components/hx-field-label/AUDIT.md",
  "old_string": "| ID    | Severity | Area                         | Description                                                             |\n| ----- | -------- | ---------------------------- | ----------------------------------------------------------------------- |\n| P0-01 | **P0**   | Accessibility / Architecture | Cross-shadow-DOM `for` association is fundamentally broken              |\n| P0-02 | **P0**   | Storybook / Documentation    | Stories demonstrate broken association as working                       |\n| P1-01 | **P1**   | Accessibility (WCAG 1.3.1)   | Required `*` hidden from AT with no visually-hidden text supplement     |\n| P1-02 | **P1**   | Storybook / Tests            | `getByRole('generic')` does not select `<label>` elements correctly     |\n| P1-03 | **P1**   | CSS / Documentation          | `--hx-color-danger` consumed but not documented as `@cssprop`           |\n| P2-01 | **P2**   | Storybook / Conventions      | Hardcoded hex colors in story demos violate token convention            |\n| P2-02 | **P2**   | Tests                        | Slot test queries light DOM only; does not verify shadow slot rendering |\n| P2-03 | **P2**   | TypeScript                   | `for` as property name is a reserved keyword (low risk)                 |",
  "new_string": "| ID    | Severity | Area                         | Description                                                             | Status       |\n| ----- | -------- | ---------------------------- | ----------------------------------------------------------------------- | ------------ |\n| P0-01 | **P0**   | Accessibility / Architecture | Cross-shadow-DOM `for` association is fundamentally broken              | **FIXED** (docs updated, `aria-labelledby` pattern documented) |\n| P0-02 | **P0**   | Storybook / Documentation    | Stories demonstrate broken association as working                       | **FIXED** (stories use `aria-labelledby` pattern) |\n| P1-01 | **P1**   | Accessibility (WCAG 1.3.1)   | Required `*` hidden from AT with no visually-hidden text supplement     | **FIXED** (visually-hidden \"required\" text added) |\n| P1-02 | **P1**   | Storybook / Tests            | `getByRole('generic')` does not select `<label>` elements correctly     | **FIXED** (play tests use `shadowRoot.querySelector`) |\n| P1-03 | **P1**   | CSS / Documentation          | `--hx-color-danger` consumed but not documented as `@cssprop`           | **FIXED** (`--hx-field-label-required-color` token added) |\n| P2-01 | **P2**   | Storybook / Conventions      | Hardcoded hex colors in story demos violate token convention            | Open         |\n| P2-02 | **P2**   | Tests                        | Slot test queries light DOM only; does not verify shadow slot rendering | **FIXED** (shadow slot `assignedNodes` assertion added) |\n| P2-03 | **P2**   | TypeScript                   | `for` as property name is a reserved keyword (low risk)                 | Open         |"
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
      "status": "completed",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Run verification gates",
      "status": "completed",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit summary",
      "status": "completed",
      "activeForm": "Writing audit summary"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-field-label

### wc-mcp Scores
- **Component health:** 100/A (all dimensions maxed)
- **Accessibility CEM score:** 5/100 (F) — expected for a label component that doesn't need ARIA role, focus, disabled, etc.

### Changes Implemented

**P0-01 FIXED — Cross-shadow-DOM `for` association documentation:**
- Updated JSDoc class description and `for` property docs to accurately document the shadow DOM limitation
- Documented `aria-labelledby` as the canonical cross-boundary labeling pattern

**P0-02 FIXED — Stories demonstrate correct patterns:**
- Replaced `WithFor` story with `WithAriaLabelledby` showing correct cross-boundary pattern
- Updated `HealthcareFormLabels` to use `aria-labelledby` instead of broken `for` association

**P1-01 FIXED — Required indicator WCAG 1.3.1 compliance:**
- Added visually-hidden "required" text alongside the `aria-hidden="true"` asterisk
- Added `.visually-hidden` CSS utility to styles

**P1-02 FIXED — Storybook play tests:**
- Replaced all `getByRole('generic')` queries with direct `shadowRoot.querySelector('[part="base"]')`
- Updated indicator assertions to match new DOM structure
- Removed unused `getShadowRoot` helper and `within` import

**P1-03 FIXED — Undocumented CSS token:**
- Added `--hx-field-label-required-color` component-level token with fallback cascade
- Documented via `@cssprop` in JSDoc for CEM generation

**P2-02 FIXED — Slot test shadow DOM assertion:**
- Added `assignedNodes()` assertion to verify slot rendering end-to-end

### Files Modified
- `packages/hx-library/src/components/hx-field-label/hx-field-label.ts` — JSDoc + required indicator template
- `packages/hx-library/src/components/hx-field-label/hx-field-label.styles.ts` — required color token + visually-hidden class
- `packages/hx-library/src/components/hx-field-label/hx-field-label.test.ts` — updated 2 tests, added 1 new test
- `packages/hx-library/src/components/hx-field-label/hx-field-label.stories.ts` — all play tests + story patterns fixed
- `packages/hx-library/src/components/hx-field-label/AUDIT.md` — status column added

### Verification Status
- `npm run verify` — passes (0 lint errors, 0 format issues, 0 type errors)
- `npm run test:library` — 3101/3101 tests pass (all 79 test files)
- `git diff --stat` — only target component files changed (+ unrelated test screenshot diffs)

### Remaining P2 Items (not fixed — low priority)
- **P2-01:** Hardcoded hex colors in story CSS Parts demo
- **P2-03:** `for` as property name (reserved keyword, low risk)

### Risks/Blockers Encountered
- None

### Learnings
- Shadow DOM label `for` association is a common misconception — must always document the `aria-labelledby` alternative prominently
- Visually-hidden text pattern is essential when hiding decorative indicators from AT
</summary>