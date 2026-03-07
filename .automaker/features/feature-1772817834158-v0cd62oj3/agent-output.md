I'll start by reading the existing `hx-meter` component files and running the wc-mcp tools in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Bash,Write,Edit,TodoWrite,Agent",
  "max_results": 7
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-meter/**/*"
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
      "content": "Read all hx-meter source files",
      "status": "in_progress",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "pending",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit and fix CRITICAL/HIGH issues",
      "status": "pending",
      "activeForm": "Auditing and fixing issues"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/AUDIT.md"
}
Good — the existing AUDIT.md identifies 6 P1 issues. Let me run wc-mcp tools and then fix all CRITICAL/HIGH (P1) issues.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "in_progress",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "pending",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "pending",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "pending",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "pending",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "pending",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "pending",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-meter"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-meter"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-meter"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-meter"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "in_progress",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "pending",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "pending",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "pending",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "pending",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "pending",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Now I'll fix all P1 issues in the component. Let me start with the component source file — adding `aria-valuetext`, fixing the slot-label accessible name via `aria-labelledby`, and adding the `track` CSS part.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.ts",
  "old_string": " * @csspart base - The outer wrapper element.\n * @csspart indicator - The filled bar indicating the current value.\n * @csspart label - The label wrapper element.",
  "new_string": " * @csspart base - The outer wrapper element.\n * @csspart track - The track background element.\n * @csspart indicator - The filled bar indicating the current value.\n * @csspart label - The label wrapper element."
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.ts",
  "old_string": "  private _resolveState(): MeterState {\n    const v = this._clampedValue();\n    const hasLow = this.low !== undefined;\n    const hasHigh = this.high !== undefined;\n    const hasOptimum = this.optimum !== undefined;\n\n    if (!hasLow && !hasHigh && !hasOptimum) return 'default';\n\n    const inLowZone = hasLow && v < this.low!;\n    const inHighZone = hasHigh && v > this.high!;\n    const inMiddleZone = !inLowZone && !inHighZone;\n\n    if (!hasOptimum) {\n      if (inLowZone || inHighZone) return 'warning';\n      return 'optimum';\n    }\n\n    const opt = this.optimum!;\n    const optimumInLow = hasLow && opt < this.low!;\n    const optimumInHigh = hasHigh && opt > this.high!;\n    const optimumInMiddle = !optimumInLow && !optimumInHigh;\n\n    if (optimumInMiddle) {\n      if (inMiddleZone) return 'optimum';\n      if (inLowZone || inHighZone) return 'warning';\n    } else if (optimumInLow) {\n      if (inLowZone) return 'optimum';\n      if (inMiddleZone) return 'warning';\n      if (inHighZone) return 'danger';\n    } else if (optimumInHigh) {\n      if (inHighZone) return 'optimum';\n      if (inMiddleZone) return 'warning';\n      if (inLowZone) return 'danger';\n    }\n\n    return 'default';\n  }",
  "new_string": "  private _resolveState(): MeterState {\n    const v = this._clampedValue();\n    const hasLow = this.low !== undefined;\n    const hasHigh = this.high !== undefined;\n    const hasOptimum = this.optimum !== undefined;\n\n    if (!hasLow && !hasHigh && !hasOptimum) return 'default';\n\n    const inLowZone = hasLow && v < this.low!;\n    const inHighZone = hasHigh && v > this.high!;\n    const inMiddleZone = !inLowZone && !inHighZone;\n\n    if (!hasOptimum) {\n      if (inLowZone || inHighZone) return 'warning';\n      return 'optimum';\n    }\n\n    const opt = this.optimum!;\n    const optimumInLow = hasLow && opt < this.low!;\n    const optimumInHigh = hasHigh && opt > this.high!;\n\n    if (optimumInLow) {\n      if (inLowZone) return 'optimum';\n      if (inMiddleZone) return 'warning';\n      return 'danger';\n    }\n\n    if (optimumInHigh) {\n      if (inHighZone) return 'optimum';\n      if (inMiddleZone) return 'warning';\n      return 'danger';\n    }\n\n    // optimum is in middle zone\n    if (inMiddleZone) return 'optimum';\n    return 'warning';\n  }"
}
Now fix the render method — add `aria-valuetext`, `aria-labelledby` for slot labels, and `track` part:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.ts",
  "old_string": "  override render() {\n    const pct = this._percentage();\n    const state = this._resolveState();\n    const ariaLabel = this.label ?? `${this._clampedValue()} of ${this.max}`;\n    const hasLabel = this.label !== undefined;\n\n    return html`\n      <div\n        part=\"base\"\n        class=\"meter\"\n        role=\"meter\"\n        aria-valuenow=${this._clampedValue()}\n        aria-valuemin=${this.min}\n        aria-valuemax=${this.max}\n        aria-label=${ariaLabel}\n        data-state=${state}\n      >\n        ${hasLabel\n          ? html`<span part=\"label\" class=\"meter__label\">\n              <slot name=\"label\">${this.label}</slot>\n            </span>`\n          : html`<slot name=\"label\"></slot>`}\n        <div class=\"meter__track\">\n          <div\n            part=\"indicator\"\n            class=\"meter__indicator\"\n            style=${styleMap({ width: `${pct}%` })}\n          ></div>\n        </div>\n        <meter\n          class=\"meter__native\"\n          value=${this._clampedValue()}\n          min=${this.min}\n          max=${this.max}\n          low=${ifDefined(this.low)}\n          high=${ifDefined(this.high)}\n          optimum=${ifDefined(this.optimum)}\n          aria-hidden=\"true\"\n          tabindex=\"-1\"\n        ></meter>\n      </div>\n    `;\n  }",
  "new_string": "  private _valueText(): string {\n    const state = this._resolveState();\n    const base = `${this._clampedValue()} of ${this.max}`;\n    if (state === 'default') return base;\n    return `${base} (${state})`;\n  }\n\n  override render() {\n    const pct = this._percentage();\n    const state = this._resolveState();\n    const hasLabel = this.label !== undefined;\n\n    return html`\n      <div\n        part=\"base\"\n        class=\"meter\"\n        role=\"meter\"\n        aria-valuenow=${this._clampedValue()}\n        aria-valuemin=${this.min}\n        aria-valuemax=${this.max}\n        aria-valuetext=${this._valueText()}\n        aria-label=${ifDefined(this.label)}\n        aria-labelledby=${ifDefined(!hasLabel ? 'label' : undefined)}\n        data-state=${state}\n      >\n        ${hasLabel\n          ? html`<span part=\"label\" class=\"meter__label\">\n              <slot name=\"label\">${this.label}</slot>\n            </span>`\n          : html`<span id=\"label\" part=\"label\" class=\"meter__label\">\n              <slot name=\"label\"></slot>\n            </span>`}\n        <div part=\"track\" class=\"meter__track\">\n          <div\n            part=\"indicator\"\n            class=\"meter__indicator\"\n            style=${styleMap({ width: `${pct}%` })}\n          ></div>\n        </div>\n        <meter\n          class=\"meter__native\"\n          value=${this._clampedValue()}\n          min=${this.min}\n          max=${this.max}\n          low=${ifDefined(this.low)}\n          high=${ifDefined(this.high)}\n          optimum=${ifDefined(this.optimum)}\n          aria-hidden=\"true\"\n          tabindex=\"-1\"\n        ></meter>\n      </div>\n    `;\n  }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "completed",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "completed",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "completed",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "in_progress",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "pending",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "pending",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Now fix the Storybook default render to bind `low`, `high`, `optimum`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-meter\n      value=${args.value}\n      min=${args.min}\n      max=${args.max}\n      label=${args.label ?? ''}\n    ></hx-meter>\n  `,\n} satisfies Meta;",
  "new_string": "  render: (args) => html`\n    <hx-meter\n      value=${args.value}\n      min=${args.min}\n      max=${args.max}\n      low=${ifDefined(args.low)}\n      high=${ifDefined(args.high)}\n      optimum=${ifDefined(args.optimum)}\n      label=${args.label ?? ''}\n    ></hx-meter>\n  `,\n} satisfies Meta;"
}
Add the `ifDefined` import:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.stories.ts",
  "old_string": "import { html } from 'lit';\nimport { expect, within } from 'storybook/test';\nimport './hx-meter.js';",
  "new_string": "import { html } from 'lit';\nimport { ifDefined } from 'lit/directives/if-defined.js';\nimport { expect, within } from 'storybook/test';\nimport './hx-meter.js';"
}
Also fix the `LabelSlot` story to include a `label` attribute for accessible name:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.stories.ts",
  "old_string": "export const LabelSlot: Story = {\n  name: 'Label via slot',\n  render: () => html`\n    <hx-meter value=\"45\" min=\"0\" max=\"200\">\n      <span slot=\"label\">Disk usage: 45 GB of 200 GB</span>\n    </hx-meter>\n  `,\n};",
  "new_string": "export const LabelSlot: Story = {\n  name: 'Label via slot',\n  render: () => html`\n    <hx-meter value=\"45\" min=\"0\" max=\"200\" label=\"Disk usage: 45 GB of 200 GB\">\n      <span slot=\"label\">Disk usage: 45 GB of 200 GB</span>\n    </hx-meter>\n  `,\n};"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "completed",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "completed",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "completed",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "completed",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "in_progress",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "pending",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "pending",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Now update the test file — add aria-valuetext tests, slot-label a11y test, fix misleading description, add boundary/edge case tests:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts",
  "old_string": "    it('uses fallback aria-label when label not set', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"30\" max=\"100\"></hx-meter>');\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-label')).toBe('30 of 100');\n    });\n  });",
  "new_string": "    it('does not set aria-label when label is not provided', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"30\" max=\"100\"></hx-meter>');\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.hasAttribute('aria-label')).toBe(false);\n    });\n\n    it('sets aria-valuetext with value and max in default state', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"30\" max=\"100\"></hx-meter>');\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-valuetext')).toBe('30 of 100');\n    });\n\n    it('sets aria-valuetext including state when thresholds produce optimum', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"50\" min=\"0\" max=\"100\" low=\"25\" high=\"75\" optimum=\"50\"></hx-meter>',\n      );\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-valuetext')).toBe('50 of 100 (optimum)');\n    });\n\n    it('sets aria-valuetext including state when thresholds produce warning', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"80\" min=\"0\" max=\"100\" low=\"25\" high=\"75\" optimum=\"50\"></hx-meter>',\n      );\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-valuetext')).toBe('80 of 100 (warning)');\n    });\n\n    it('sets aria-valuetext including state when thresholds produce danger', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"10\" min=\"0\" max=\"100\" low=\"25\" high=\"75\" optimum=\"90\"></hx-meter>',\n      );\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-valuetext')).toBe('10 of 100 (danger)');\n    });\n\n    it('uses aria-labelledby when slot content is provided without label attribute', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"45\" min=\"0\" max=\"200\"><span slot=\"label\">Custom</span></hx-meter>',\n      );\n      await el.updateComplete;\n      const base = shadowQuery(el, '[part=\"base\"]');\n      expect(base?.getAttribute('aria-labelledby')).toBe('label');\n    });\n  });"
}
Now fix the misleading test description (P2):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts",
  "old_string": "    it('has data-state=\"default\" with only optimum set (no low/high)', async () => {",
  "new_string": "    it('has data-state=\"optimum\" with only optimum set (no low/high)', async () => {"
}
Now add boundary and edge case tests (P2) — add the `track` CSS part test too:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts",
  "old_string": "    it('exposes \"label\" part when label is set', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter label=\"Test\"></hx-meter>');\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part~=\"label\"]')).toBeTruthy();\n    });\n  });",
  "new_string": "    it('exposes \"track\" part', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');\n      expect(shadowQuery(el, '[part~=\"track\"]')).toBeTruthy();\n    });\n\n    it('exposes \"label\" part when label is set', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter label=\"Test\"></hx-meter>');\n      await el.updateComplete;\n      expect(shadowQuery(el, '[part~=\"label\"]')).toBeTruthy();\n    });\n  });"
}
Add boundary and edge case tests at the end of the file:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) ───",
  "new_string": "  // ─── Boundary / Edge Cases ───\n\n  describe('Boundary / Edge Cases', () => {\n    it('value exactly at low threshold is in middle zone (optimum)', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"25\" min=\"0\" max=\"100\" low=\"25\" high=\"75\" optimum=\"50\"></hx-meter>',\n      );\n      await el.updateComplete;\n      expect(el.dataset['state']).toBe('optimum');\n    });\n\n    it('value exactly at high threshold is in middle zone (optimum)', async () => {\n      const el = await fixture<HelixMeter>(\n        '<hx-meter value=\"75\" min=\"0\" max=\"100\" low=\"25\" high=\"75\" optimum=\"50\"></hx-meter>',\n      );\n      await el.updateComplete;\n      expect(el.dataset['state']).toBe('optimum');\n    });\n\n    it('handles min === max without throwing (zero-division guard)', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"5\" min=\"5\" max=\"5\"></hx-meter>');\n      await el.updateComplete;\n      const indicator = shadowQuery(el, '[part=\"indicator\"]') as HTMLElement;\n      expect(indicator?.style.width).toBe('0%');\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "completed",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "completed",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "completed",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "completed",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "completed",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "completed",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "in_progress",
      "activeForm": "Running build and tests"
    }
  ]
}
Now let me verify the changes compile and review the final files:

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Now let's run the tests:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project browser packages/hx-library/src/components/hx-meter/hx-meter.test.ts 2>&1 | tail -60",
  "description": "Run hx-meter tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests",
  "timeout": 180000
}
One test failure — the "does not show label part when label is not set" test fails because I now always render the label part (for `aria-labelledby`). I need to update this test since the behavior has intentionally changed — the label element is now always present to support slot-based labeling via `aria-labelledby`.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/hx-meter.test.ts",
  "old_string": "    it('does not show label part when label is not set', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"50\"></hx-meter>');\n      await el.updateComplete;\n      const labelPart = shadowQuery(el, '[part=\"label\"]');\n      expect(labelPart).toBeNull();\n    });",
  "new_string": "    it('renders label part even when label attribute is not set (for slot-based labeling)', async () => {\n      const el = await fixture<HelixMeter>('<hx-meter value=\"50\"></hx-meter>');\n      await el.updateComplete;\n      const labelPart = shadowQuery(el, '[part=\"label\"]');\n      expect(labelPart).toBeTruthy();\n    });"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -30",
  "description": "Run library tests again",
  "timeout": 180000
}
All 3109 tests pass. Let me verify the diff:

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Show changed files"
}
Only the 3 intended files changed (plus unrelated screenshot diffs from the test run). Let me also run verify:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -10",
  "description": "Run full verification (lint + format + type-check)",
  "timeout": 120000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read all hx-meter source files",
      "status": "completed",
      "activeForm": "Reading hx-meter source files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P1: Add aria-valuetext for semantic state",
      "status": "completed",
      "activeForm": "Adding aria-valuetext"
    },
    {
      "content": "Fix P1: Fix slot-only label accessible name (WCAG 2.5.3)",
      "status": "completed",
      "activeForm": "Fixing slot-only label accessible name"
    },
    {
      "content": "Fix P1: Add track CSS part",
      "status": "completed",
      "activeForm": "Adding track CSS part"
    },
    {
      "content": "Fix P1: Bind low/high/optimum in default story render",
      "status": "completed",
      "activeForm": "Fixing default story render"
    },
    {
      "content": "Fix P1: Add tests for aria-valuetext and slot-label a11y",
      "status": "completed",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P2: Fix misleading test description",
      "status": "completed",
      "activeForm": "Fixing test description"
    },
    {
      "content": "Fix P2: Add boundary and edge case tests",
      "status": "completed",
      "activeForm": "Adding boundary tests"
    },
    {
      "content": "Run build and tests to verify",
      "status": "completed",
      "activeForm": "Running build and tests"
    }
  ]
}
Now update the AUDIT.md to reflect the fixes:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/AUDIT.md"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-meter/packages/hx-library/src/components/hx-meter/AUDIT.md",
  "content": "# hx-meter — Deep Audit v2\n\n**Audited files:**\n\n- `hx-meter.ts`\n- `hx-meter.styles.ts`\n- `hx-meter.test.ts`\n- `hx-meter.stories.ts`\n\n---\n\n## wc-mcp Analysis\n\n- **CEM Score:** 100/100 (A)\n- **Accessibility Score:** 10/100 (F) — CEM does not document ARIA role/attributes (implementation has them in template)\n- **CSS Parts (CEM):** base, track, indicator, label\n\n---\n\n## P1 Findings — ALL FIXED\n\n| # | Area | Finding | Resolution |\n|---|------|---------|------------|\n| 1 | Accessibility | No `aria-valuetext` — semantic state not communicated to screen readers | Added `_valueText()` method; `aria-valuetext` now outputs e.g. `\"50 of 100 (optimum)\"` |\n| 2 | Accessibility | Slot-only label produces wrong accessible name (WCAG 2.5.3) | Added `aria-labelledby=\"label\"` when no `label` attribute is set; label part always renders with `id=\"label\"` for slot-based labeling |\n| 3 | CSS | Missing `track` CSS part | Added `part=\"track\"` to `.meter__track` div |\n| 4 | Storybook | Default story controls for `low`, `high`, `optimum` not bound in render | Added `ifDefined` bindings for all three threshold args in default render |\n| 5 | Tests | No test for `aria-valuetext` | Added 4 tests covering default, optimum, warning, and danger aria-valuetext values |\n| 6 | Tests | Slot-only label accessible name untested | Added test verifying `aria-labelledby=\"label\"` when slot content is used without `label` attribute |\n\n---\n\n## P2 Findings — FIXED\n\n| # | Area | Finding | Resolution |\n|---|------|---------|------------|\n| 7 | TypeScript | Unreachable `return 'default'` in `_resolveState()` | Refactored to eliminate dead code — branches now exhaustively return |\n| 11 | Tests | Test description says \"default\" but asserts \"optimum\" | Fixed description to say `\"optimum\"` |\n| 12 | Tests | Boundary values `value === low` and `value === high` not tested | Added 2 boundary tests |\n| 13 | Tests | `min === max` zero-division guard not tested | Added edge case test |\n| 15 | Storybook | `LabelSlot` story demonstrates accessibility failure | Added `label` attribute to match visible slot text |\n\n---\n\n## P2 Findings — REMAINING (documented, not blocking)\n\n| # | Area | Finding | Notes |\n|---|------|---------|-------|\n| 8 | TypeScript | No `size` property | Not part of current API design; `--hx-meter-track-height` token provides sizing |\n| 9 | Accessibility | `role=\"meter\"` not focusable (no `tabindex=\"0\"`) | `meter` is a non-interactive range widget; focusability is optional per ARIA spec |\n| 10 | Accessibility | `data-state` on both host and inner div | Host attr needed for CSS `:host([data-state])` selectors; inner attr used for `data-state` in template — both serve different purposes |\n| 14 | Tests | Duplicate CSS-part assertions | Minor redundancy between Rendering and CSS Parts suites |\n| 16 | Storybook | No aria-label-only story | Low priority; valid use case but not blocking |\n| 17 | CSS | No `size` CSS variants | See #8 — token-driven sizing via `--hx-meter-track-height` |\n| 18 | Performance | Bundle size not individually verified | General CI gate covers this |\n| 19 | Drupal | No Twig template | Twig rendering is straightforward; no special integration needed |\n\n---\n\n## Summary\n\n**P1 findings: 6 — ALL FIXED**\n**P2 findings: 5 fixed, 8 remaining (documented, non-blocking)**\n**Tests: 3109 passing (79 test files)**\n**Type-check: 0 errors**\n**Verify: passing (lint + format + type-check)**\n"
}
<summary>
## Summary: Deep Audit v2 — hx-meter

### Changes Implemented

**6 P1 fixes (all critical/high):**
1. **aria-valuetext** — Added `_valueText()` method that outputs semantic state (e.g. `"50 of 100 (optimum)"`) to screen readers
2. **Slot-label accessible name (WCAG 2.5.3)** — When no `label` attribute is set, `aria-labelledby="label"` now points to the label part element, which always renders with `id="label"` for slot-based labeling
3. **Track CSS part** — Added `part="track"` to `.meter__track` div
4. **Storybook default render** — Bound `low`, `high`, `optimum` args with `ifDefined` in the default render function
5. **aria-valuetext tests** — Added 4 tests for default, optimum, warning, danger states
6. **Slot-label a11y test** — Added test verifying `aria-labelledby` is set for slot-only usage

**5 P2 fixes:**
- Removed unreachable `return 'default'` dead code in `_resolveState()`
- Fixed misleading test description ("default" → "optimum")
- Added boundary tests for `value === low` and `value === high`
- Added `min === max` zero-division edge case test
- Fixed `LabelSlot` story to include `label` attribute

### Files Modified
- `packages/hx-library/src/components/hx-meter/hx-meter.ts` — aria-valuetext, aria-labelledby, track part, dead code removal
- `packages/hx-library/src/components/hx-meter/hx-meter.test.ts` — 10 new/updated tests
- `packages/hx-library/src/components/hx-meter/hx-meter.stories.ts` — ifDefined bindings, LabelSlot fix
- `packages/hx-library/src/components/hx-meter/AUDIT.md` — Updated with fix status

### Verification Status
- `npm run verify`: **passing** (0 errors)
- `npm run test:library`: **3109 tests passing** (79 test files, 0 failures)
- `git diff --stat`: Only 4 intended files modified (plus unrelated screenshot binary diffs)

### Risks/Blockers Encountered
- The slot-label fix changes behavior: `[part="label"]` now always renders (previously hidden when no `label` attribute). Updated the corresponding test to match the intentional behavior change.

### Notes for Developer
- 8 P2 findings remain documented in AUDIT.md as non-blocking (size variants, focusability, duplicate assertions, etc.)
- wc-mcp accessibility score is 10/100 (F) because CEM doesn't document ARIA attributes that exist in the template — this is a CEM documentation gap, not a component gap
</summary>