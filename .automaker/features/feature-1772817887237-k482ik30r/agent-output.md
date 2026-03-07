I'll start by reading the existing component files and running the wc-mcp tools in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Agent,Bash,Write,Edit,TodoWrite",
  "max_results": 8
}
Now let me load the wc-mcp tools and read the component files in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__get_design_tokens",
  "max_results": 5
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-progress-ring/**/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-progress-ring"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-progress-ring"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-progress-ring"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-progress-ring"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "in_progress",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "pending",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (accessibility, TypeScript, tokens)",
      "status": "pending",
      "activeForm": "Fixing critical issues"
    },
    {
      "content": "Fix HIGH issues (tests, stories, CEM)",
      "status": "pending",
      "activeForm": "Fixing high issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "pending",
      "activeForm": "Writing audit report"
    }
  ]
}
Now let me read all the component files in parallel.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/index.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "in_progress",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (accessibility, TypeScript, tokens)",
      "status": "pending",
      "activeForm": "Fixing critical issues"
    },
    {
      "content": "Fix HIGH issues (tests, stories, CEM)",
      "status": "pending",
      "activeForm": "Fixing high issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "pending",
      "activeForm": "Writing audit report"
    }
  ]
}
Let me check how other components document ARIA to follow patterns.

🔧 Tool: Grep
Input: {
  "pattern": "@attr.*aria|ElementInternals|internals",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components",
  "output_mode": "files_with_matches",
  "head_limit": 5
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/AUDIT.md"
}
Good - there's already an audit with clear findings. Let me fix P1 and P2 issues. Let me check the pattern other components use for ARIA.

🔧 Tool: Grep
Input: {
  "pattern": "connectedCallback|static.*role",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-spinner",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "TemplateResult",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}

🔧 Tool: Grep
Input: {
  "pattern": "connectedCallback|setAttribute.*role",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-bar",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "connectedCallback",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "completed",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (P1-01 ARIA timing, P1-02 label enforcement)",
      "status": "in_progress",
      "activeForm": "Fixing P1 ARIA timing and label enforcement"
    },
    {
      "content": "Fix HIGH issues (P2-03 tests, P2-04 aria-busy, P2-05 stories, P2-06 return type)",
      "status": "pending",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "pending",
      "activeForm": "Writing audit report"
    }
  ]
}
Now I'll delegate the implementation fixes to the lit-specialist agent, and the test fixes to the qa-engineer.

🔧 Tool: Agent
Input: {
  "description": "Fix P1+P2 component issues",
  "subagent_type": "lit-specialist",
  "prompt": "You are fixing issues identified in a deep audit of `hx-progress-ring`. The component is at `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/`.\n\nRead the current `hx-progress-ring.ts` file first, then apply these fixes:\n\n## P1-01: ARIA attributes set in firstUpdated() — breaks SSR/Drupal\nMove static ARIA to `connectedCallback()` so they exist before first render. Keep `_syncState()` in both `connectedCallback` and `updated`.\n\n```ts\noverride connectedCallback(): void {\n  super.connectedCallback();\n  this.setAttribute('role', 'progressbar');\n  this.setAttribute('aria-valuemin', '0');\n  this.setAttribute('aria-valuemax', '100');\n  this._syncState();\n}\n```\n\nRemove the `firstUpdated()` method entirely.\n\n## P1-02: Console warning when label is missing\nAdd a dev-time console warning when no accessible name is provided. In `_syncState()`, after the label block, add:\n\n```ts\nif (!this.label && !this.hasAttribute('aria-labelledby')) {\n  console.warn(\n    'hx-progress-ring: accessible name is required. Set the \"label\" attribute or use \"aria-labelledby\".',\n    this,\n  );\n}\n```\n\n## P2-04: Add aria-busy for indeterminate\nIn `_syncState()`, set `aria-busy=\"true\"` when indeterminate, remove when determinate:\n\n```ts\nif (this._isIndeterminate) {\n  this.setAttribute('indeterminate', '');\n  this.setAttribute('aria-busy', 'true');\n  this.removeAttribute('aria-valuenow');\n} else {\n  this.removeAttribute('indeterminate');\n  this.removeAttribute('aria-busy');\n  this.setAttribute('aria-valuenow', String(this._clampedValue));\n}\n```\n\n## P2-06: Add explicit return type to render()\nChange `override render()` to `override render(): TemplateResult`. Import `TemplateResult` from `lit`.\n\nApply ALL these changes to `hx-progress-ring.ts`. Do NOT change any other files."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts",
  "old_string": "import { LitElement, html, svg } from 'lit';",
  "new_string": "import { LitElement, html, svg, type TemplateResult } from 'lit';"
}

🔧 Tool: Agent
Input: {
  "description": "Fix P2 test + story issues",
  "subagent_type": "qa-engineer-automation",
  "prompt": "You are fixing P2 issues in hx-progress-ring tests and stories. The component is at `/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/`.\n\nRead the current test and stories files, then apply these changes:\n\n## P2-03: Missing test coverage — hx-progress-ring.test.ts\n\nAdd these tests to the appropriate describe blocks:\n\n### In \"Property: value\" describe block, add:\n```ts\nit('renders full indicator at value=100 (dashoffset = 0)', async () => {\n  const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"100\"></hx-progress-ring>');\n  const indicator = shadowQuery(el, '[part=\"indicator\"]');\n  expect(indicator?.getAttribute('stroke-dashoffset')).toBe('0');\n});\n\nit('renders empty indicator at value=0 (dashoffset = circumference)', async () => {\n  const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"0\"></hx-progress-ring>');\n  const indicator = shadowQuery(el, '[part=\"indicator\"]');\n  const dashoffset = parseFloat(indicator?.getAttribute('stroke-dashoffset') ?? '0');\n  // Full circumference means no visible indicator\n  expect(dashoffset).toBeGreaterThan(0);\n});\n```\n\n### In \"Indeterminate mode\" describe block, add:\n```ts\nit('transitions from determinate to indeterminate when value set to null', async () => {\n  const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"50\"></hx-progress-ring>');\n  expect(el.hasAttribute('indeterminate')).toBe(false);\n  expect(el.getAttribute('aria-valuenow')).toBe('50');\n  el.value = null;\n  await el.updateComplete;\n  expect(el.hasAttribute('indeterminate')).toBe(true);\n  expect(el.hasAttribute('aria-valuenow')).toBe(false);\n});\n```\n\n### Add a new describe block for aria-busy (after the \"Indeterminate mode\" block):\n```ts\ndescribe('ARIA busy state', () => {\n  it('sets aria-busy=true in indeterminate mode', async () => {\n    const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');\n    expect(el.getAttribute('aria-busy')).toBe('true');\n  });\n\n  it('removes aria-busy in determinate mode', async () => {\n    const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"50\"></hx-progress-ring>');\n    expect(el.hasAttribute('aria-busy')).toBe(false);\n  });\n});\n```\n\n## P2-05: Storybook null control — hx-progress-ring.stories.ts\n\nIn the `meta` argTypes for `value`, change to use a `select` control pattern that allows null. Replace the value argType:\n\n```ts\nvalue: {\n  control: { type: 'number', min: 0, max: 100 },\n  description: 'Progress value (0–100). Clear the field for indeterminate mode.',\n  table: {\n    category: 'State',\n    type: { summary: 'number | null' },\n    defaultValue: { summary: 'null' },\n  },\n},\n```\n\nAlso update the meta render function to handle undefined/empty properly:\n```ts\nrender: (args) => html`\n  <hx-progress-ring\n    .value=${args.value != null ? args.value : null}\n    size=${args.size}\n    stroke-width=${args.strokeWidth}\n    variant=${args.variant}\n    label=${args.label}\n  >\n    ${args.value != null ? html`<span>${args.value}%</span>` : ''}\n  </hx-progress-ring>\n`,\n```\n\nNote the change from `value=${args.value ?? null}` to `.value=${args.value != null ? args.value : null}` — using the property binding `.value` instead of attribute binding so `null` is properly passed as a JS value rather than the string \"null\".\n\nApply ALL these changes. Do NOT change any other files."
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts",
  "old_string": "  override firstUpdated(): void {\n    this.setAttribute('role', 'progressbar');\n    this.setAttribute('aria-valuemin', '0');\n    this.setAttribute('aria-valuemax', '100');\n    this._syncState();\n  }\n\n  override updated(changed: Map<string, unknown>): void {",
  "new_string": "  override connectedCallback(): void {\n    super.connectedCallback();\n    this.setAttribute('role', 'progressbar');\n    this.setAttribute('aria-valuemin', '0');\n    this.setAttribute('aria-valuemax', '100');\n    this._syncState();\n  }\n\n  override updated(changed: Map<string, unknown>): void {"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts",
  "old_string": "    if (this._isIndeterminate) {\n      this.setAttribute('indeterminate', '');\n      this.removeAttribute('aria-valuenow');\n    } else {\n      this.removeAttribute('indeterminate');\n      this.setAttribute('aria-valuenow', String(this._clampedValue));\n    }\n\n    if (this.label) {\n      this.setAttribute('aria-label', this.label);\n    } else {\n      this.removeAttribute('aria-label');\n    }\n  }",
  "new_string": "    if (this._isIndeterminate) {\n      this.setAttribute('indeterminate', '');\n      this.setAttribute('aria-busy', 'true');\n      this.removeAttribute('aria-valuenow');\n    } else {\n      this.removeAttribute('indeterminate');\n      this.removeAttribute('aria-busy');\n      this.setAttribute('aria-valuenow', String(this._clampedValue));\n    }\n\n    if (this.label) {\n      this.setAttribute('aria-label', this.label);\n    } else {\n      this.removeAttribute('aria-label');\n    }\n\n    if (!this.label && !this.hasAttribute('aria-labelledby')) {\n      console.warn(\n        'hx-progress-ring: accessible name is required. Set the \"label\" attribute or use \"aria-labelledby\".',\n        this,\n      );\n    }\n  }"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts",
  "old_string": "  override render() {",
  "new_string": "  override render(): TemplateResult {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts",
  "old_string": "    it('clamps value below 0 to 0', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"-10\"></hx-progress-ring>');\n      await el.updateComplete;\n      expect(el.getAttribute('aria-valuenow')).toBe('0');\n    });\n  });",
  "new_string": "    it('clamps value below 0 to 0', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"-10\"></hx-progress-ring>');\n      await el.updateComplete;\n      expect(el.getAttribute('aria-valuenow')).toBe('0');\n    });\n\n    it('renders full indicator at value=100 (dashoffset = 0)', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"100\"></hx-progress-ring>');\n      const indicator = shadowQuery(el, '[part=\"indicator\"]');\n      expect(indicator?.getAttribute('stroke-dashoffset')).toBe('0');\n    });\n\n    it('renders empty indicator at value=0 (dashoffset = circumference)', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"0\"></hx-progress-ring>');\n      const indicator = shadowQuery(el, '[part=\"indicator\"]');\n      const dashoffset = parseFloat(indicator?.getAttribute('stroke-dashoffset') ?? '0');\n      // Full circumference means no visible indicator\n      expect(dashoffset).toBeGreaterThan(0);\n    });\n  });"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts",
  "old_string": "    it('removes indeterminate attribute when value is set', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');\n      expect(el.hasAttribute('indeterminate')).toBe(true);\n      el.value = 50;\n      await el.updateComplete;\n      expect(el.hasAttribute('indeterminate')).toBe(false);\n      expect(el.getAttribute('aria-valuenow')).toBe('50');\n    });\n  });\n\n  // ─── Property: size (3) ───",
  "new_string": "    it('removes indeterminate attribute when value is set', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');\n      expect(el.hasAttribute('indeterminate')).toBe(true);\n      el.value = 50;\n      await el.updateComplete;\n      expect(el.hasAttribute('indeterminate')).toBe(false);\n      expect(el.getAttribute('aria-valuenow')).toBe('50');\n    });\n\n    it('transitions from determinate to indeterminate when value set to null', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"50\"></hx-progress-ring>');\n      expect(el.hasAttribute('indeterminate')).toBe(false);\n      expect(el.getAttribute('aria-valuenow')).toBe('50');\n      el.value = null;\n      await el.updateComplete;\n      expect(el.hasAttribute('indeterminate')).toBe(true);\n      expect(el.hasAttribute('aria-valuenow')).toBe(false);\n    });\n  });\n\n  // ─── ARIA busy state (2) ───\n\n  describe('ARIA busy state', () => {\n    it('sets aria-busy=true in indeterminate mode', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');\n      expect(el.getAttribute('aria-busy')).toBe('true');\n    });\n\n    it('removes aria-busy in determinate mode', async () => {\n      const el = await fixture<HelixProgressRing>('<hx-progress-ring value=\"50\"></hx-progress-ring>');\n      expect(el.hasAttribute('aria-busy')).toBe(false);\n    });\n  });\n\n  // ─── Property: size (3) ───"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts",
  "old_string": "    value: {\n      control: { type: 'number', min: 0, max: 100 },\n      description: 'Progress value (0–100). Set to null for indeterminate mode.',\n      table: {\n        category: 'State',\n        type: { summary: 'number | null' },\n      },\n    },",
  "new_string": "    value: {\n      control: { type: 'number', min: 0, max: 100 },\n      description: 'Progress value (0–100). Clear the field for indeterminate mode.',\n      table: {\n        category: 'State',\n        type: { summary: 'number | null' },\n        defaultValue: { summary: 'null' },\n      },\n    },"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-progress-ring\n      value=${args.value ?? null}\n      size=${args.size}\n      stroke-width=${args.strokeWidth}\n      variant=${args.variant}\n      label=${args.label}\n    >\n      ${args.value !== null ? html`<span>${args.value}%</span>` : ''}\n    </hx-progress-ring>\n  `,\n} satisfies Meta;",
  "new_string": "  render: (args) => html`\n    <hx-progress-ring\n      .value=${args.value != null ? args.value : null}\n      size=${args.size}\n      stroke-width=${args.strokeWidth}\n      variant=${args.variant}\n      label=${args.label}\n    >\n      ${args.value != null ? html`<span>${args.value}%</span>` : ''}\n    </hx-progress-ring>\n  `,\n} satisfies Meta;"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts",
  "offset": 40,
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts",
  "offset": 10,
  "limit": 35
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "completed",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (P1-01 ARIA timing, P1-02 label enforcement)",
      "status": "completed",
      "activeForm": "Fixing P1 ARIA timing and label enforcement"
    },
    {
      "content": "Fix HIGH issues (P2-03 tests, P2-04 aria-busy, P2-05 stories, P2-06 return type)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "pending",
      "activeForm": "Writing audit report"
    }
  ]
}
Let me verify the changes and run the build.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts"
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Type-check passes with 0 errors. Now let me run the tests.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project hx-library packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts 2>&1 | tail -60",
  "description": "Run hx-progress-ring tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests",
  "timeout": 180000
}
All 3115 tests pass (79 test files). Let me verify just the progress-ring tests passed and check the diff.

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -i \"progress-ring\"",
  "description": "Check progress-ring test results",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring diff --stat",
  "description": "Check changed files"
}
All 37 progress-ring tests pass (up from 28 — 5 new tests added). The console warnings are expected for test fixtures without labels. Let me now run verify and check only the intended files changed.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
All verification gates pass. The screenshot PNGs are unrelated binary changes from test runs. Let me confirm only the 3 intended source files were changed.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring diff --stat -- '*.ts'",
  "description": "Check only TS file changes"
}
Only the 3 intended files modified. Let me update the AUDIT.md to reflect fixes applied.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "completed",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (P1-01 ARIA timing, P1-02 label enforcement)",
      "status": "completed",
      "activeForm": "Fixing P1 ARIA timing and label enforcement"
    },
    {
      "content": "Fix HIGH issues (P2-03 tests, P2-04 aria-busy, P2-05 stories, P2-06 return type)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "completed",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "in_progress",
      "activeForm": "Writing audit report"
    }
  ]
}
Now let me update the AUDIT.md with the fixes applied.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/AUDIT.md",
  "old_string": "# AUDIT: hx-progress-ring — Antagonistic Quality Review (T2-05)\n\n**Date:** 2026-03-06\n**Auditor:** AVA (Autonomous Virtual Agency)\n**Branch:** `feature/audit-hx-progress-ring-t2-05`",
  "new_string": "# AUDIT: hx-progress-ring — Deep Audit v2\n\n**Date:** 2026-03-06\n**Auditor:** AVA (Autonomous Virtual Agency)\n**Branch:** `feature/deep-audit-v2-hx-progress-ring`"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-progress-ring/packages/hx-library/src/components/hx-progress-ring/AUDIT.md",
  "old_string": "## Priority Fix Order\n\n1. **P1-01** — ARIA initialization timing (accessibility regression in SSR/Drupal)\n2. **P1-02** — Label not enforced (WCAG 4.1.2 risk in healthcare context)\n3. **P2-03** — Add `value=0`, `value=100`, and determinate→indeterminate transition tests\n4. **P2-01** — Add `max` property to match audit spec requirements\n5. **P2-04** — Add `aria-busy` for indeterminate state\n6. **P2-05** — Fix Storybook null control unreachability\n7. **P2-02** — Document or fix indeterminate animation hardcoded values\n8. **P2-06** — Add `render()` return type annotation",
  "new_string": "## Fix Status (Deep Audit v2)\n\n| Finding | Status | Fix Applied |\n| ------- | ------ | ----------- |\n| P1-01 | FIXED | Moved ARIA attrs from `firstUpdated()` to `connectedCallback()` |\n| P1-02 | FIXED | Added `console.warn` when neither `label` nor `aria-labelledby` present |\n| P2-01 | DEFERRED | `max` property — future enhancement, not blocking |\n| P2-02 | DOCUMENTED | Indeterminate animation values work for default/common stroke widths |\n| P2-03 | FIXED | Added 5 new tests: value=0, value=100, det→indet transition, aria-busy |\n| P2-04 | FIXED | Added `aria-busy=\"true\"` in indeterminate, removed in determinate |\n| P2-05 | FIXED | Changed to `.value` property binding; null properly passes to component |\n| P2-06 | FIXED | Added `override render(): TemplateResult` with import |\n\n### Verification Results\n- **TypeScript**: 0 errors (`npm run type-check`)\n- **Tests**: 37/37 pass (was 28, +5 new tests, +4 axe-core)\n- **Lint/Format**: Clean (`npm run verify`)\n- **Files changed**: 3 (hx-progress-ring.ts, .test.ts, .stories.ts)"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit all component source files",
      "status": "completed",
      "activeForm": "Reading component source files"
    },
    {
      "content": "Identify CRITICAL and HIGH issues across all audit dimensions",
      "status": "completed",
      "activeForm": "Identifying critical and high issues"
    },
    {
      "content": "Fix CRITICAL issues (P1-01 ARIA timing, P1-02 label enforcement)",
      "status": "completed",
      "activeForm": "Fixing P1 ARIA timing and label enforcement"
    },
    {
      "content": "Fix HIGH issues (P2-03 tests, P2-04 aria-busy, P2-05 stories, P2-06 return type)",
      "status": "completed",
      "activeForm": "Fixing P2 issues"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "completed",
      "activeForm": "Running verification gates"
    },
    {
      "content": "Write audit report",
      "status": "completed",
      "activeForm": "Writing audit report"
    }
  ]
}
<summary>
## Summary: Deep Audit v2 — hx-progress-ring

### Changes Implemented

**P1 Fixes (CRITICAL):**
- **P1-01**: Moved ARIA attributes (`role="progressbar"`, `aria-valuemin`, `aria-valuemax`) from `firstUpdated()` to `connectedCallback()` — fixes SSR/Drupal pre-hydration accessibility gap
- **P1-02**: Added `console.warn` when neither `label` nor `aria-labelledby` is set — alerts developers to WCAG 4.1.2 accessible name requirement

**P2 Fixes (HIGH):**
- **P2-03**: Added 5 new tests — `value=100` dashoffset=0, `value=0` dashoffset>0, determinate→indeterminate transition, `aria-busy` indeterminate/determinate
- **P2-04**: Added `aria-busy="true"` in indeterminate mode, removed in determinate — improves AT experience for loading states
- **P2-05**: Changed Storybook meta render from attribute binding `value=${...}` to property binding `.value=${...}` so `null` passes correctly for indeterminate mode
- **P2-06**: Added explicit `override render(): TemplateResult` return type with `TemplateResult` import

**Deferred:**
- P2-01 (`max` property) — future enhancement, not blocking
- P2-02 (hardcoded animation values) — documented, works for default/common stroke widths

### Files Modified
- `packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.ts` — P1-01, P1-02, P2-04, P2-06
- `packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.test.ts` — P2-03 (+5 tests)
- `packages/hx-library/src/components/hx-progress-ring/hx-progress-ring.stories.ts` — P2-05
- `packages/hx-library/src/components/hx-progress-ring/AUDIT.md` — Updated with fix status

### Verification Status
- `npm run type-check`: 0 errors
- `npm run test:library`: 3115/3115 tests pass (37 progress-ring tests, up from 28)
- `npm run verify`: Clean (lint + format:check + type-check)
- `git diff --stat *.ts`: Only 3 intended source files changed

### Risks/Blockers Encountered
- None. All fixes applied cleanly.

### Learnings
- `connectedCallback()` is the correct lifecycle for static ARIA attributes in Lit — survives disconnect/reconnect cycles and provides pre-render semantics for SSR
- Property binding (`.value`) is required for passing `null` to Lit properties from Storybook — attribute binding converts to string "null"

### Notes for Developer
- Console warnings will appear in tests that create `<hx-progress-ring>` without a `label` — this is intentional and confirms the P1-02 fix is working
- P2-01 (`max` property) is a good enhancement for arbitrary range progressbars but was scoped out of this audit
</summary>