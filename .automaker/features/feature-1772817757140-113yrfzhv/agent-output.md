I'll start by reading the existing component files and running wc-mcp tools in parallel to gather the full picture.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Agent,Bash,Write,Edit,TodoWrite",
  "max_results": 8
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__get_design_tokens",
  "max_results": 5
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "in_progress",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "in_progress",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit design tokens usage",
      "status": "pending",
      "activeForm": "Auditing design tokens usage"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "pending",
      "activeForm": "Auditing accessibility compliance"
    },
    {
      "content": "Audit TypeScript strictness",
      "status": "pending",
      "activeForm": "Auditing TypeScript strictness"
    },
    {
      "content": "Audit tests and coverage",
      "status": "pending",
      "activeForm": "Auditing tests and coverage"
    },
    {
      "content": "Fix CRITICAL and HIGH issues",
      "status": "pending",
      "activeForm": "Fixing CRITICAL and HIGH issues"
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
  "pattern": "packages/hx-library/src/components/hx-focus-ring/**/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-focus-ring"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-focus-ring"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-focus-ring"
}
Good — CEM score is 100/A, accessibility F is expected for a purely visual utility component. Let me read all the source files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/index.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "completed",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit design tokens usage",
      "status": "in_progress",
      "activeForm": "Auditing design tokens usage"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "pending",
      "activeForm": "Auditing accessibility compliance"
    },
    {
      "content": "Audit TypeScript strictness",
      "status": "pending",
      "activeForm": "Auditing TypeScript strictness"
    },
    {
      "content": "Audit tests and coverage",
      "status": "pending",
      "activeForm": "Auditing tests and coverage"
    },
    {
      "content": "Fix CRITICAL and HIGH issues",
      "status": "pending",
      "activeForm": "Fixing CRITICAL and HIGH issues"
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
Let me check existing patterns for reduced-motion and forced-colors, plus token usage.

🔧 Tool: Grep
Input: {
  "pattern": "prefers-reduced-motion",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "forced-colors",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "--hx-color-focus|--hx-focus|--wc-color-focus|--wc-focus",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "focus-ring",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src",
  "output_mode": "files_with_matches"
}
Let me check the existing reduced-motion pattern used by other components.

🔧 Tool: Grep
Input: {
  "pattern": "prefers-reduced-motion",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-button/hx-button.styles.ts",
  "output_mode": "content",
  "-C": 3
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/AUDIT.md"
}
Now I have a complete picture. There's already an extensive AUDIT.md documenting 3 P0, 4 P1, and 6 P2 issues. I need to fix P0 and P1 issues. Let me implement the fixes.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "completed",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit design tokens usage",
      "status": "completed",
      "activeForm": "Auditing design tokens usage"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "completed",
      "activeForm": "Auditing accessibility compliance"
    },
    {
      "content": "Fix P0: Hardcoded values in styles + dark mode",
      "status": "in_progress",
      "activeForm": "Fixing P0 hardcoded values and dark mode"
    },
    {
      "content": "Fix P1: Add focus-visible detection + update types/JSDoc",
      "status": "pending",
      "activeForm": "Adding focus-visible detection"
    },
    {
      "content": "Fix P1: Add missing tests",
      "status": "pending",
      "activeForm": "Adding missing tests"
    },
    {
      "content": "Fix P1: Add missing stories",
      "status": "pending",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Fix P2: nothing directive, shape validation, story fixes",
      "status": "pending",
      "activeForm": "Fixing P2 issues"
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
Let me fix the styles first (P0-01, P0-02, P0-03) and the component (P1-01, P2-01).

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.styles.ts",
  "content": "import { css } from 'lit';\n\nexport const helixFocusRingStyles = css`\n  :host {\n    display: inline-block;\n    position: relative;\n\n    --_ring-color: var(\n      --hx-focus-ring-color,\n      var(--hx-color-primary-500, #2563eb)\n    );\n    --_ring-width: var(\n      --hx-focus-ring-width,\n      var(--hx-border-width-focus, 2px)\n    );\n    --_ring-offset: var(\n      --hx-focus-ring-offset,\n      var(--hx-spacing-focus-offset, 2px)\n    );\n  }\n\n  /* ─── Base ─── */\n\n  .base {\n    display: inline-block;\n    position: relative;\n  }\n\n  /* ─── Ring ─── */\n\n  .ring {\n    position: absolute;\n    inset: calc(-1 * var(--_ring-offset));\n    border: var(--_ring-width) solid var(--_ring-color);\n    pointer-events: none;\n    opacity: 0;\n    transition: opacity var(--hx-transition-fast, 150ms ease);\n  }\n\n  :host([visible]) .ring,\n  .ring--active {\n    opacity: 1;\n  }\n\n  /* ─── Shape Variants ─── */\n\n  .ring--box {\n    border-radius: var(--hx-border-radius-md, 0.375rem);\n  }\n\n  .ring--circle {\n    border-radius: 50%;\n  }\n\n  .ring--pill {\n    border-radius: 9999px;\n  }\n\n  /* ─── Dark Mode ─── */\n\n  @media (prefers-color-scheme: dark) {\n    :host {\n      --_ring-color: var(\n        --hx-focus-ring-color,\n        var(--hx-color-primary-300, #93c5fd)\n      );\n    }\n  }\n\n  /* ─── Reduced Motion ─── */\n\n  @media (prefers-reduced-motion: reduce) {\n    .ring {\n      transition: none;\n    }\n  }\n\n  /* ─── Forced Colors (Windows High Contrast) ─── */\n\n  @media (forced-colors: active) {\n    .ring {\n      border-color: Highlight;\n    }\n  }\n`;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.ts",
  "content": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, state } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { styleMap } from 'lit/directives/style-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixFocusRingStyles } from './hx-focus-ring.styles.js';\n\n/**\n * A utility component that renders a consistent visible focus indicator around\n * a slotted element using CSS custom properties from the design token system.\n * Purely visual — no ARIA semantics. The slotted element manages its own ARIA.\n *\n * Automatically detects keyboard focus (`:focus-visible`) on slotted content\n * and shows the ring. The `visible` property can be used for manual control.\n *\n * @summary Visual focus ring wrapper for consistent focus indication.\n *\n * @tag hx-focus-ring\n *\n * @slot - The focusable element being wrapped.\n *\n * @csspart base - The wrapper container element.\n * @csspart ring - The absolutely-positioned focus ring overlay.\n *\n * @cssprop [--hx-focus-ring-color=var(--hx-color-primary-500)] - Default ring color.\n * @cssprop [--hx-focus-ring-width=var(--hx-border-width-focus)] - Default ring width.\n * @cssprop [--hx-focus-ring-offset=var(--hx-spacing-focus-offset)] - Default ring offset from content.\n */\n@customElement('hx-focus-ring')\nexport class HelixFocusRing extends LitElement {\n  static override styles = [tokenStyles, helixFocusRingStyles];\n\n  /**\n   * Whether the focus ring is visible (manual control).\n   * @attr visible\n   */\n  @property({ type: Boolean, reflect: true })\n  visible = false;\n\n  /**\n   * CSS color override for the ring. Accepts any CSS color value or\n   * design token reference (e.g., `var(--hx-color-danger-500)`).\n   * Falls back to `--hx-focus-ring-color`.\n   * @attr color\n   */\n  @property({ type: String })\n  color: string | undefined = undefined;\n\n  /**\n   * Ring width override. Accepts any CSS length value or\n   * design token reference (e.g., `var(--hx-border-width-lg)`).\n   * Falls back to `--hx-focus-ring-width`.\n   * @attr width\n   */\n  @property({ type: String })\n  width: string | undefined = undefined;\n\n  /**\n   * Ring offset override. Accepts any CSS length value or\n   * design token reference (e.g., `var(--hx-spacing-sm)`).\n   * Falls back to `--hx-focus-ring-offset`.\n   * @attr offset\n   */\n  @property({ type: String })\n  offset: string | undefined = undefined;\n\n  /**\n   * Shape of the focus ring.\n   * @attr shape\n   */\n  @property({ type: String, reflect: true })\n  shape: 'box' | 'circle' | 'pill' = 'box';\n\n  /** Whether the ring is auto-shown due to keyboard focus on slotted content. */\n  @state()\n  private _keyboardFocused = false;\n\n  private static readonly _validShapes = new Set(['box', 'circle', 'pill']);\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('focusin', this._handleFocusIn);\n    this.addEventListener('focusout', this._handleFocusOut);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('focusin', this._handleFocusIn);\n    this.removeEventListener('focusout', this._handleFocusOut);\n  }\n\n  private _handleFocusIn = (e: FocusEvent): void => {\n    const target = e.target as Element;\n    try {\n      if (target.matches(':focus-visible')) {\n        this._keyboardFocused = true;\n      }\n    } catch {\n      // :focus-visible not supported — show on all focus\n      this._keyboardFocused = true;\n    }\n  };\n\n  private _handleFocusOut = (): void => {\n    this._keyboardFocused = false;\n  };\n\n  private _resolvedShape(): 'box' | 'circle' | 'pill' {\n    if (HelixFocusRing._validShapes.has(this.shape)) {\n      return this.shape;\n    }\n    return 'box';\n  }\n\n  override render() {\n    const tokenOverrides: Record<string, string> = {};\n    if (this.color) tokenOverrides['--_ring-color'] = this.color;\n    if (this.width) tokenOverrides['--_ring-width'] = this.width;\n    if (this.offset) tokenOverrides['--_ring-offset'] = this.offset;\n\n    const hasOverrides = Object.keys(tokenOverrides).length > 0;\n    const resolvedShape = this._resolvedShape();\n\n    const ringClasses = {\n      ring: true,\n      [`ring--${resolvedShape}`]: true,\n      'ring--active': this._keyboardFocused,\n    };\n\n    return html`\n      <div\n        part=\"base\"\n        class=\"base\"\n        style=${hasOverrides ? styleMap(tokenOverrides) : nothing}\n      >\n        <slot></slot>\n        <div\n          part=\"ring\"\n          class=${classMap(ringClasses)}\n          aria-hidden=\"true\"\n        ></div>\n      </div>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-focus-ring': HelixFocusRing;\n  }\n}\n"
}
Now let me update the tests and stories in parallel.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "completed",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit design tokens usage",
      "status": "completed",
      "activeForm": "Auditing design tokens usage"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "completed",
      "activeForm": "Auditing accessibility compliance"
    },
    {
      "content": "Fix P0: Hardcoded values in styles + dark mode",
      "status": "completed",
      "activeForm": "Fixing P0 hardcoded values and dark mode"
    },
    {
      "content": "Fix P1: Add focus-visible detection + update types/JSDoc",
      "status": "completed",
      "activeForm": "Adding focus-visible detection"
    },
    {
      "content": "Fix P1+P2: Update tests",
      "status": "in_progress",
      "activeForm": "Updating tests"
    },
    {
      "content": "Fix P1+P2: Update stories",
      "status": "in_progress",
      "activeForm": "Updating stories"
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

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.test.ts",
  "content": "import { describe, it, expect, afterEach } from 'vitest';\nimport { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';\nimport type { HelixFocusRing } from './hx-focus-ring.js';\nimport './index.js';\n\nafterEach(cleanup);\n\ndescribe('hx-focus-ring', () => {\n  // ─── Rendering ───\n\n  describe('Rendering', () => {\n    it('renders with shadow DOM', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      expect(el.shadowRoot).toBeTruthy();\n    });\n\n    it('exposes \"base\" CSS part', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      const base = shadowQuery(el, '[part~=\"base\"]');\n      expect(base).toBeTruthy();\n    });\n\n    it('exposes \"ring\" CSS part', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring).toBeTruthy();\n    });\n\n    it('renders a default slot', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><button>Test</button></hx-focus-ring>',\n      );\n      const slot = shadowQuery(el, 'slot');\n      expect(slot).toBeTruthy();\n    });\n\n    it('ring has aria-hidden=\"true\"', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.getAttribute('aria-hidden')).toBe('true');\n    });\n  });\n\n  // ─── Property: visible ───\n\n  describe('Property: visible', () => {\n    it('defaults visible to false', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      expect(el.visible).toBe(false);\n    });\n\n    it('reflects visible attribute to host', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring visible></hx-focus-ring>');\n      expect(el.visible).toBe(true);\n      expect(el.hasAttribute('visible')).toBe(true);\n    });\n\n    it('visible=true sets the visible attribute on host', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      el.visible = true;\n      await el.updateComplete;\n      expect(el.hasAttribute('visible')).toBe(true);\n    });\n\n    it('visible=false removes the visible attribute from host', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring visible></hx-focus-ring>');\n      el.visible = false;\n      await el.updateComplete;\n      expect(el.hasAttribute('visible')).toBe(false);\n    });\n  });\n\n  // ─── Property: shape ───\n\n  describe('Property: shape', () => {\n    it('defaults shape to \"box\"', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      expect(el.shape).toBe('box');\n    });\n\n    it('reflects shape attribute to host', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape=\"circle\"></hx-focus-ring>');\n      expect(el.getAttribute('shape')).toBe('circle');\n    });\n\n    it('applies ring--box class for box shape', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape=\"box\"></hx-focus-ring>');\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--box')).toBe(true);\n    });\n\n    it('applies ring--circle class for circle shape', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape=\"circle\"></hx-focus-ring>');\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--circle')).toBe(true);\n    });\n\n    it('applies ring--pill class for pill shape', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape=\"pill\"></hx-focus-ring>');\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--pill')).toBe(true);\n    });\n\n    it('falls back to box shape for invalid value', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring shape=\"invalid\"></hx-focus-ring>',\n      );\n      await el.updateComplete;\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--box')).toBe(true);\n    });\n  });\n\n  // ─── Property: color/width/offset overrides ───\n\n  describe('Token overrides', () => {\n    it('sets --_ring-color on base when color prop is set', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring color=\"#ff0000\"></hx-focus-ring>',\n      );\n      const base = shadowQuery<HTMLElement>(el, '[part~=\"base\"]');\n      expect(base?.style.getPropertyValue('--_ring-color')).toBe('#ff0000');\n    });\n\n    it('sets --_ring-width on base when width prop is set', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring width=\"4px\"></hx-focus-ring>',\n      );\n      const base = shadowQuery<HTMLElement>(el, '[part~=\"base\"]');\n      expect(base?.style.getPropertyValue('--_ring-width')).toBe('4px');\n    });\n\n    it('sets --_ring-offset on base when offset prop is set', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring offset=\"6px\"></hx-focus-ring>',\n      );\n      const base = shadowQuery<HTMLElement>(el, '[part~=\"base\"]');\n      expect(base?.style.getPropertyValue('--_ring-offset')).toBe('6px');\n    });\n\n    it('does not set inline style on base when no overrides are set', async () => {\n      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');\n      const base = shadowQuery<HTMLElement>(el, '[part~=\"base\"]');\n      expect(base?.getAttribute('style')).toBeNull();\n    });\n  });\n\n  // ─── Focus-visible detection ───\n\n  describe('Focus-visible detection', () => {\n    it('shows ring when slotted button receives focus', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><button>Click</button></hx-focus-ring>',\n      );\n      const button = el.querySelector('button')!;\n      button.focus();\n      await el.updateComplete;\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--active')).toBe(true);\n    });\n\n    it('hides ring when slotted element loses focus', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><button>Click</button></hx-focus-ring>',\n      );\n      const button = el.querySelector('button')!;\n      button.focus();\n      await el.updateComplete;\n      button.blur();\n      await el.updateComplete;\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--active')).toBe(false);\n    });\n\n    it('shows ring when slotted input receives focus', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><input type=\"text\" /></hx-focus-ring>',\n      );\n      const input = el.querySelector('input')!;\n      input.focus();\n      await el.updateComplete;\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--active')).toBe(true);\n    });\n\n    it('shows ring when slotted anchor receives focus', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><a href=\"#\">Link</a></hx-focus-ring>',\n      );\n      const anchor = el.querySelector('a')!;\n      anchor.focus();\n      await el.updateComplete;\n      const ring = shadowQuery(el, '[part~=\"ring\"]');\n      expect(ring?.classList.contains('ring--active')).toBe(true);\n    });\n  });\n\n  // ─── Accessibility ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations in default state', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><button>Click</button></hx-focus-ring>',\n      );\n      const { violations } = await checkA11y(el);\n      expect(violations).toHaveLength(0);\n    });\n\n    it('has no axe violations when visible', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring visible><button>Click</button></hx-focus-ring>',\n      );\n      const { violations } = await checkA11y(el);\n      expect(violations).toHaveLength(0);\n    });\n\n    it('has no axe violations when wrapping an input', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><label>Name <input type=\"text\" /></label></hx-focus-ring>',\n      );\n      const { violations } = await checkA11y(el);\n      expect(violations).toHaveLength(0);\n    });\n\n    it('has no axe violations when wrapping a link', async () => {\n      const el = await fixture<HelixFocusRing>(\n        '<hx-focus-ring><a href=\"#\">Learn more</a></hx-focus-ring>',\n      );\n      const { violations } = await checkA11y(el);\n      expect(violations).toHaveLength(0);\n    });\n  });\n});\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring/packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.stories.ts",
  "content": "import type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport { ifDefined } from 'lit/directives/if-defined.js';\nimport './hx-focus-ring.js';\n\n// ─────────────────────────────────────────────────\n// Meta Configuration\n// ─────────────────────────────────────────────────\n\nconst meta = {\n  title: 'Components/FocusRing',\n  component: 'hx-focus-ring',\n  tags: ['autodocs'],\n  argTypes: {\n    visible: {\n      control: 'boolean',\n      description: 'Whether the focus ring is visible.',\n      table: {\n        category: 'State',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n    shape: {\n      control: { type: 'select' },\n      options: ['box', 'circle', 'pill'],\n      description: 'Shape of the focus ring.',\n      table: {\n        category: 'Visual',\n        defaultValue: { summary: 'box' },\n        type: { summary: \"'box' | 'circle' | 'pill'\" },\n      },\n    },\n    color: {\n      control: 'color',\n      description: 'CSS color override for the ring. Falls back to --hx-focus-ring-color.',\n      table: {\n        category: 'Visual',\n        type: { summary: 'string' },\n      },\n    },\n    width: {\n      control: 'text',\n      description: 'Ring width override. Falls back to --hx-focus-ring-width.',\n      table: {\n        category: 'Visual',\n        type: { summary: 'string' },\n      },\n    },\n    offset: {\n      control: 'text',\n      description: 'Ring offset override. Falls back to --hx-focus-ring-offset.',\n      table: {\n        category: 'Visual',\n        type: { summary: 'string' },\n      },\n    },\n  },\n  args: {\n    visible: true,\n    shape: 'box',\n  },\n} satisfies Meta;\n\nexport default meta;\ntype Story = StoryObj;\n\n// ─────────────────────────────────────────────────\n// Stories\n// ─────────────────────────────────────────────────\n\nexport const Default: Story = {\n  args: {\n    visible: true,\n    shape: 'box',\n  },\n  render: (args) => html`\n    <hx-focus-ring\n      ?visible=${args['visible']}\n      shape=${args['shape']}\n      color=${ifDefined(args['color'] || undefined)}\n      width=${ifDefined(args['width'] || undefined)}\n      offset=${ifDefined(args['offset'] || undefined)}\n      style=\"margin: 1rem;\"\n    >\n      <button>Focused Button</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const Hidden: Story = {\n  args: {\n    visible: false,\n    shape: 'box',\n  },\n  render: (args) => html`\n    <hx-focus-ring ?visible=${args['visible']} shape=${args['shape']} style=\"margin: 1rem;\">\n      <button>Button (ring hidden)</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const ShapeBox: Story = {\n  name: 'Shape: Box',\n  args: { visible: true, shape: 'box' },\n  render: () => html`\n    <hx-focus-ring visible shape=\"box\" style=\"margin: 1rem;\">\n      <button>Box shape</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const ShapeCircle: Story = {\n  name: 'Shape: Circle',\n  args: { visible: true, shape: 'circle' },\n  render: () => html`\n    <hx-focus-ring visible shape=\"circle\" style=\"margin: 1rem;\">\n      <button style=\"border-radius: 50%; width: 40px; height: 40px; padding: 0;\">○</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const ShapePill: Story = {\n  name: 'Shape: Pill',\n  args: { visible: true, shape: 'pill' },\n  render: () => html`\n    <hx-focus-ring visible shape=\"pill\" style=\"margin: 1rem;\">\n      <button style=\"border-radius: 9999px; padding: 0.5rem 1.5rem;\">Pill Button</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const CustomColor: Story = {\n  name: 'Custom Color',\n  args: { visible: true, shape: 'box', color: '#dc2626' },\n  render: (args) => html`\n    <hx-focus-ring visible shape=\"box\" color=${ifDefined(args['color'] || undefined)} style=\"margin: 1rem;\">\n      <button>Custom red ring</button>\n    </hx-focus-ring>\n  `,\n};\n\nexport const WrappingInput: Story = {\n  name: 'Wrapping Input',\n  render: () => html`\n    <hx-focus-ring visible shape=\"box\" style=\"margin: 1rem;\">\n      <input type=\"text\" placeholder=\"Text input\" style=\"padding: 0.5rem;\" />\n    </hx-focus-ring>\n  `,\n};\n\nexport const WrappingLink: Story = {\n  name: 'Wrapping Link',\n  render: () => html`\n    <hx-focus-ring visible shape=\"pill\" style=\"margin: 1rem;\">\n      <a href=\"#\" style=\"padding: 0.25rem 0.5rem;\">Learn more</a>\n    </hx-focus-ring>\n  `,\n};\n\nexport const OffsetVariations: Story = {\n  name: 'Offset Variations',\n  render: () => html`\n    <div style=\"display: flex; gap: 2rem; align-items: center; margin: 1rem;\">\n      <hx-focus-ring visible shape=\"box\" offset=\"0px\">\n        <button>0px offset</button>\n      </hx-focus-ring>\n      <hx-focus-ring visible shape=\"box\" offset=\"2px\">\n        <button>2px offset</button>\n      </hx-focus-ring>\n      <hx-focus-ring visible shape=\"box\" offset=\"4px\">\n        <button>4px offset</button>\n      </hx-focus-ring>\n      <hx-focus-ring visible shape=\"box\" offset=\"8px\">\n        <button>8px offset</button>\n      </hx-focus-ring>\n    </div>\n  `,\n};\n\nexport const DarkModePreview: Story = {\n  name: 'Dark Mode Preview',\n  render: () => html`\n    <div\n      style=\"background: #111827; padding: 2rem; border-radius: 0.5rem; display: flex; gap: 2rem; align-items: center;\"\n    >\n      <hx-focus-ring visible shape=\"box\" style=\"--hx-focus-ring-color: #93c5fd;\">\n        <button style=\"background: #374151; color: #f9fafb; border: 1px solid #4b5563; padding: 0.5rem 1rem; border-radius: 0.375rem;\">\n          Dark mode button\n        </button>\n      </hx-focus-ring>\n      <hx-focus-ring visible shape=\"pill\" style=\"--hx-focus-ring-color: #93c5fd;\">\n        <a href=\"#\" style=\"color: #93c5fd; padding: 0.25rem 0.5rem;\">Dark mode link</a>\n      </hx-focus-ring>\n    </div>\n  `,\n};\n\nexport const WrappingHelixButton: Story = {\n  name: 'Wrapping hx-button',\n  render: () => {\n    import('../hx-button/index.js').catch((e: unknown) =>\n      console.error('[hx-focus-ring story] Failed to load hx-button:', e),\n    );\n    return html`\n      <hx-focus-ring visible shape=\"box\" style=\"margin: 1rem;\">\n        <hx-button>Click Me</hx-button>\n      </hx-focus-ring>\n    `;\n  },\n};\n\nexport const AutoFocusDetection: Story = {\n  name: 'Auto Focus Detection',\n  render: () => html`\n    <p style=\"margin-bottom: 1rem;\">Tab to the elements below to see the focus ring appear automatically:</p>\n    <div style=\"display: flex; gap: 2rem; align-items: center; margin: 1rem;\">\n      <hx-focus-ring shape=\"box\">\n        <button>Tab to me</button>\n      </hx-focus-ring>\n      <hx-focus-ring shape=\"box\">\n        <input type=\"text\" placeholder=\"Or tab here\" style=\"padding: 0.5rem;\" />\n      </hx-focus-ring>\n      <hx-focus-ring shape=\"pill\">\n        <a href=\"#\">Or here</a>\n      </hx-focus-ring>\n    </div>\n  `,\n};\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "completed",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Audit design tokens usage",
      "status": "completed",
      "activeForm": "Auditing design tokens usage"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "completed",
      "activeForm": "Auditing accessibility compliance"
    },
    {
      "content": "Fix P0: Hardcoded values in styles + dark mode",
      "status": "completed",
      "activeForm": "Fixing P0 hardcoded values and dark mode"
    },
    {
      "content": "Fix P1: Add focus-visible detection + update types/JSDoc",
      "status": "completed",
      "activeForm": "Adding focus-visible detection"
    },
    {
      "content": "Fix P1+P2: Update tests",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Fix P1+P2: Update stories",
      "status": "completed",
      "activeForm": "Updating stories"
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
Now let me run the build and verify.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Let me run the tests for the component.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.test.ts 2>&1 | tail -50",
  "description": "Run hx-focus-ring tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -50",
  "description": "Run library tests",
  "timeout": 180000
}
All 3107 tests pass (79 files). Let me also run verify and check the diff.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-focus-ring/ 2>&1",
  "description": "Format hx-focus-ring files"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -10",
  "description": "Re-run verify after formatting",
  "timeout": 120000
}
All gates pass. Let me verify the diff.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-focus-ring diff --stat",
  "description": "Show changed files"
}
4 source files changed (component, styles, tests, stories) plus screenshot binaries from test runs. Exactly the intended scope.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-focus-ring component files",
      "status": "completed",
      "activeForm": "Reading existing hx-focus-ring component files"
    },
    {
      "content": "Run wc-mcp analysis tools (score, accessibility, CEM)",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis tools"
    },
    {
      "content": "Fix P0: Hardcoded values in styles + dark mode",
      "status": "completed",
      "activeForm": "Fixing P0 hardcoded values and dark mode"
    },
    {
      "content": "Fix P1: Add focus-visible detection + update types/JSDoc",
      "status": "completed",
      "activeForm": "Adding focus-visible detection"
    },
    {
      "content": "Fix P1+P2: Update tests",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Fix P1+P2: Update stories",
      "status": "completed",
      "activeForm": "Updating stories"
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
<summary>
## Summary: Deep Component Audit — hx-focus-ring

### Changes Implemented

**P0 Fixes (Blockers):**
- **P0-01/P0-02**: Replaced hardcoded `#2563eb` and `2px` fallbacks with three-tier token cascade: `var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb))`, `var(--hx-focus-ring-width, var(--hx-border-width-focus, 2px))`, `var(--hx-focus-ring-offset, var(--hx-spacing-focus-offset, 2px))`
- **P0-03**: Added `@media (prefers-color-scheme: dark)` block with `--hx-color-primary-300` (#93c5fd) for dark mode contrast
- Added `@media (prefers-reduced-motion: reduce)` — disables ring transition
- Added `@media (forced-colors: active)` — uses `Highlight` system color for Windows High Contrast

**P1 Fixes (Critical):**
- **P1-01**: Added automatic `:focus-visible` detection via `focusin`/`focusout` event listeners with `_keyboardFocused` reactive state. Ring auto-shows on keyboard focus, hides on blur. Manual `visible` property still works as override.
- **P1-02**: Enhanced JSDoc on `color`/`width`/`offset` properties with guidance to use token references
- **P1-03**: Added 4 focus-visible detection tests (button focus/blur, input focus, anchor focus)
- **P1-04**: Added 4 missing stories — `WrappingInput`, `WrappingLink`, `OffsetVariations`, `DarkModePreview`, plus `AutoFocusDetection` interactive demo

**P2 Fixes:**
- **P2-01**: Replaced empty string `''` with `nothing` from Lit for cleaner DOM
- **P2-02**: Added shape runtime validation with `_resolvedShape()` falling back to `'box'`
- **P2-03**: Added axe-core tests with `<input>` and `<a>` slotted content
- **P2-04**: Updated `@cssprop` JSDoc to reference token names instead of hardcoded values
- **P2-05**: Fixed Storybook stories to use `ifDefined()` instead of empty string fallbacks
- **P2-06**: Fixed `WrappingHelixButton` story to log import errors instead of swallowing them
- Switched from string concatenation to `classMap` directive for ring classes

### Files Modified
- `packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.ts` — component class
- `packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.styles.ts` — styles
- `packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.test.ts` — tests
- `packages/hx-library/src/components/hx-focus-ring/hx-focus-ring.stories.ts` — stories

### Verification Status
- `npm run type-check`: 0 errors
- `npm run test:library`: 3107 tests pass (79 files), including all new hx-focus-ring tests
- `npm run verify`: All gates pass (lint + format:check + type-check)
- `git diff --stat`: Only 4 source files + screenshot binaries changed

### Risks/Blockers Encountered
- None. All fixes applied cleanly.

### Learnings
- The `focusin`/`focusout` approach is reliable for `:focus-visible` detection across shadow DOM boundaries — the events bubble through the slot boundary into the host element
- `classMap` is preferred over string interpolation for dynamic class names in Lit templates
- The existing AUDIT.md from the previous T4-03 antagonistic review provided a comprehensive issue list that guided all fixes

### Notes for Developer
- The wc-mcp accessibility score remains F (5/100) — this is **expected** for a purely visual utility component with no ARIA role, no form association, no keyboard events of its own
- The `--hx-border-width-focus` and `--hx-spacing-focus-offset` semantic tokens are referenced but may not yet exist in the token package — they degrade gracefully to the `2px` primitive fallback
- The dark mode `--hx-color-primary-300` token reference may need to be defined in the token layer for full cascade support
</summary>