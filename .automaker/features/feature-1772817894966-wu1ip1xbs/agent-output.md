I'll start by reading the existing component files and gathering wc-mcp data in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Agent,TodoWrite",
  "max_results": 4
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility,mcp__wc-mcp__list_css_parts,mcp__wc-mcp__get_design_tokens",
  "max_results": 5
}
Now let me gather all the information in parallel.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-prose/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/AUDIT.md"
}
Now let me get the scoped CSS and wc-mcp data.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-prose"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-prose"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read prose scoped CSS and unscoped partials",
      "status": "in_progress",
      "activeForm": "Reading prose CSS files"
    },
    {
      "content": "Fix P0-02: WcProse type import in test file",
      "status": "pending",
      "activeForm": "Fixing WcProse type import"
    },
    {
      "content": "Fix P0-01: --wc-* tokens in _media.css",
      "status": "pending",
      "activeForm": "Fixing stale --wc-* tokens in _media.css"
    },
    {
      "content": "Fix P1-01 through P1-06: Hardcoded values, caption-side, nowrap, lead paragraph",
      "status": "pending",
      "activeForm": "Fixing high-severity CSS issues"
    },
    {
      "content": "Fix P1-06: Strengthen test line-height assertion",
      "status": "pending",
      "activeForm": "Strengthening test assertions"
    },
    {
      "content": "Fix P1-07: Add missing test coverage",
      "status": "pending",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Fix P2-02: Token prefix in prose.css comments",
      "status": "pending",
      "activeForm": "Fixing token prefix in comments"
    },
    {
      "content": "Fix P2-06: Add base styles on hx-prose container",
      "status": "pending",
      "activeForm": "Adding base styles to hx-prose"
    },
    {
      "content": "Fix CEM: _styles missing description",
      "status": "pending",
      "activeForm": "Fixing _styles description for CEM"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/styles/prose/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/_media.css"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css"
}
Now let me read the prose.css unscoped barrel.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.css"
}
I now have a thorough understanding of the component. Let me implement the fixes systematically. I'll delegate the CSS fixes, test fixes, and component fixes to specialized agents working in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit,Write,Bash",
  "max_results": 3
}
Now I'll make all the fixes. Let me start with the critical ones and work down.

**P0-02: Fix `WcProse` type import in test file**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.test.ts",
  "old_string": "import type { WcProse } from './hx-prose.js';",
  "new_string": "import type { HelixProse } from './hx-prose.js';"
}

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.test.ts",
  "old_string": "fixture<WcProse>",
  "new_string": "fixture<HelixProse>"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read prose scoped CSS and unscoped partials",
      "status": "completed",
      "activeForm": "Reading prose CSS files"
    },
    {
      "content": "Fix P0-02: WcProse type import in test file",
      "status": "completed",
      "activeForm": "Fixing WcProse type import"
    },
    {
      "content": "Fix P0-01: --wc-* tokens in _media.css",
      "status": "in_progress",
      "activeForm": "Fixing stale --wc-* tokens in _media.css"
    },
    {
      "content": "Fix P1-01 through P1-06: Hardcoded values, caption-side, nowrap, lead paragraph",
      "status": "pending",
      "activeForm": "Fixing high-severity CSS issues"
    },
    {
      "content": "Fix P1-06: Strengthen test line-height assertion",
      "status": "pending",
      "activeForm": "Strengthening test assertions"
    },
    {
      "content": "Fix P1-07: Add missing test coverage",
      "status": "pending",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Fix P2-02: Token prefix in prose.css comments",
      "status": "pending",
      "activeForm": "Fixing token prefix in comments"
    },
    {
      "content": "Fix P2-06: Add base styles on hx-prose container",
      "status": "pending",
      "activeForm": "Adding base styles to hx-prose"
    },
    {
      "content": "Fix CEM: _styles missing description",
      "status": "pending",
      "activeForm": "Fixing _styles description for CEM"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
**P0-01: Fix `--wc-*` tokens in `_media.css`**

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/_media.css",
  "old_string": "--wc-",
  "new_string": "--hx-"
}
**P2-02: Fix token prefix in prose.css comments**

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.css",
  "old_string": "--wc-",
  "new_string": "--hx-"
}
Now the CSS fixes in `prose.scoped.css`:

**P1-01: Hardcoded font-size values for code/kbd/samp**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "/* Inline Code */\nhx-prose code {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: 0.875em;\n  font-weight: var(--hx-font-weight-normal, 400);\n  background-color: var(--hx-color-surface-sunken, var(--hx-color-neutral-100, #e9ecef));\n  color: var(--hx-color-error-600, #b02a37);\n  padding: 0.125em var(--hx-space-1, 0.25rem);\n  border-radius: var(--hx-border-radius-sm, 0.25rem);\n  word-break: break-word;\n}",
  "new_string": "/* Inline Code */\nhx-prose code {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: var(--hx-font-size-sm, 0.875em);\n  font-weight: var(--hx-font-weight-normal, 400);\n  background-color: var(--hx-color-surface-sunken, var(--hx-color-neutral-100, #e9ecef));\n  color: var(--hx-color-error-600, #b02a37);\n  padding: var(--hx-space-px, 0.125em) var(--hx-space-1, 0.25rem);\n  border-radius: var(--hx-border-radius-sm, 0.25rem);\n  word-break: break-word;\n}"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "/* Keyboard Input */\nhx-prose kbd {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: 0.875em;\n  padding: 0.125em var(--hx-space-2, 0.5rem);\n  background-color: var(--hx-color-neutral-800, #212529);\n  color: var(--hx-color-neutral-0, #ffffff);\n  border-radius: var(--hx-border-radius-sm, 0.25rem);\n  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);\n}",
  "new_string": "/* Keyboard Input */\nhx-prose kbd {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: var(--hx-font-size-sm, 0.875em);\n  padding: var(--hx-space-px, 0.125em) var(--hx-space-2, 0.5rem);\n  background-color: var(--hx-color-neutral-800, #212529);\n  color: var(--hx-color-neutral-0, #ffffff);\n  border-radius: var(--hx-border-radius-sm, 0.25rem);\n  box-shadow: var(--hx-shadow-inset-sm, inset 0 -1px 0 rgba(0, 0, 0, 0.25));\n}"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "/* Sample Output */\nhx-prose samp {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: 0.875em;\n}",
  "new_string": "/* Sample Output */\nhx-prose samp {\n  font-family: var(\n    --hx-font-family-mono,\n    'JetBrains Mono',\n    ui-monospace,\n    'Cascadia Code',\n    monospace\n  );\n  font-size: var(--hx-font-size-sm, 0.875em);\n}"
}
**P1-03: Fix `p:first-child` lead paragraph — change to opt-in only**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "/* Lead paragraph */\nhx-prose p:first-child,\nhx-prose p.lead {",
  "new_string": "/* Lead paragraph — opt-in only via .lead class to avoid\n   unintended styling of CMS-generated first paragraphs */\nhx-prose p.lead {"
}
**P1-04: Fix `caption-side: bottom` — remove, use default (top)**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "  caption-side: bottom;",
  "new_string": "  caption-side: top;"
}
**P1-05: Remove `white-space: nowrap` from `th`**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "  text-align: left;\n  white-space: nowrap;\n  background-color: var(--hx-color-surface-raised",
  "new_string": "  text-align: left;\n  background-color: var(--hx-color-surface-raised"
}
**P2-06: Add base styles on `hx-prose` container**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/styles/prose/prose.scoped.css",
  "old_string": "/* ==========================================================================\n   Headings\n   ========================================================================== */",
  "new_string": "/* ==========================================================================\n   Base Container\n   ========================================================================== */\n\nhx-prose {\n  display: block;\n  max-width: var(--hx-prose-max-width, 720px);\n  font-family: var(--hx-font-family-sans, sans-serif);\n  font-size: var(--hx-prose-font-size, var(--hx-font-size-md, 1rem));\n  line-height: var(--hx-prose-line-height, var(--hx-line-height-relaxed, 1.75));\n  color: var(--hx-prose-color, var(--hx-color-neutral-700, #343a40));\n}\n\n/* ==========================================================================\n   Headings\n   ========================================================================== */"
}
**Fix CEM: Add description to `_styles` property**

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.ts",
  "old_string": "  private _styles = new AdoptedStylesheetsController(this, helixProseScopedCss, document);",
  "new_string": "  /** Injects scoped prose CSS into the document via adopted stylesheets. */\n  private _styles = new AdoptedStylesheetsController(this, helixProseScopedCss, document);"
}
Now update the tests — **P1-06** (strengthen line-height assertion) and **P1-07** (add missing test coverage):

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read prose scoped CSS and unscoped partials",
      "status": "completed",
      "activeForm": "Reading prose CSS files"
    },
    {
      "content": "Fix P0-02: WcProse type import in test file",
      "status": "completed",
      "activeForm": "Fixing WcProse type import"
    },
    {
      "content": "Fix P0-01: --wc-* tokens in _media.css",
      "status": "completed",
      "activeForm": "Fixing stale --wc-* tokens in _media.css"
    },
    {
      "content": "Fix P1-01 through P1-06: Hardcoded values, caption-side, nowrap, lead paragraph",
      "status": "completed",
      "activeForm": "Fixing high-severity CSS issues"
    },
    {
      "content": "Fix P2-02: Token prefix in prose.css comments",
      "status": "completed",
      "activeForm": "Fixing token prefix in comments"
    },
    {
      "content": "Fix P2-06: Add base styles on hx-prose container",
      "status": "completed",
      "activeForm": "Adding base styles to hx-prose"
    },
    {
      "content": "Fix CEM: _styles missing description",
      "status": "completed",
      "activeForm": "Fixing _styles description for CEM"
    },
    {
      "content": "Strengthen test assertions and add missing coverage",
      "status": "in_progress",
      "activeForm": "Strengthening tests and adding coverage"
    },
    {
      "content": "Run build and tests to verify",
      "status": "pending",
      "activeForm": "Running build and tests"
    }
  ]
}
Now let me rewrite the test file with stronger assertions and additional coverage:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.test.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose/packages/hx-library/src/components/hx-prose/hx-prose.test.ts",
  "content": "import { describe, it, expect, afterEach } from 'vitest';\nimport { page } from '@vitest/browser/context';\nimport { fixture, cleanup, checkA11y } from '../../test-utils.js';\nimport type { HelixProse } from './hx-prose.js';\nimport './index.js';\n\nafterEach(cleanup);\n\ndescribe('hx-prose', () => {\n  // ─── Rendering (3) ───\n\n  describe('Rendering', () => {\n    it('renders as Light DOM (no shadowRoot)', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Hello</p></hx-prose>');\n      expect(el.shadowRoot).toBeNull();\n    });\n\n    it('content is accessible in light DOM', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Accessible text</p></hx-prose>');\n      const p = el.querySelector('p');\n      expect(p).toBeTruthy();\n      expect(p?.textContent).toBe('Accessible text');\n    });\n\n    it('displays as block', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Content</p></hx-prose>');\n      const computed = window.getComputedStyle(el);\n      expect(computed.display).toBe('block');\n    });\n  });\n\n  // ─── Properties (5) ───\n\n  describe('Properties', () => {\n    it('size defaults to \"base\"', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');\n      expect(el.size).toBe('base');\n    });\n\n    it('size attribute is reflected', async () => {\n      const el = await fixture<HelixProse>('<hx-prose size=\"sm\"><p>Text</p></hx-prose>');\n      expect(el.getAttribute('size')).toBe('sm');\n      expect(el.size).toBe('sm');\n    });\n\n    it('size=\"lg\" sets font-size CSS custom property', async () => {\n      const el = await fixture<HelixProse>('<hx-prose size=\"lg\"><p>Text</p></hx-prose>');\n      expect(el.size).toBe('lg');\n      const value = el.style.getPropertyValue('--hx-prose-font-size');\n      expect(value).toContain('--hx-font-size-lg');\n    });\n\n    it('max-width sets inline style', async () => {\n      const el = await fixture<HelixProse>('<hx-prose max-width=\"600px\"><p>Text</p></hx-prose>');\n      expect(el.style.maxWidth).toBe('600px');\n    });\n\n    it('clearing maxWidth removes inline style', async () => {\n      const el = await fixture<HelixProse>('<hx-prose max-width=\"600px\"><p>Text</p></hx-prose>');\n      expect(el.style.maxWidth).toBe('600px');\n      el.maxWidth = '';\n      await el.updateComplete;\n      expect(el.style.maxWidth).toBe('');\n    });\n\n    it('dynamically updating size changes CSS custom property', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');\n      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe('');\n      el.size = 'sm';\n      await el.updateComplete;\n      const value = el.style.getPropertyValue('--hx-prose-font-size');\n      expect(value).toContain('--hx-font-size-sm');\n    });\n  });\n\n  // ─── Scoped Styles (3) ───\n\n  describe('Scoped Styles', () => {\n    it('adopted stylesheet is injected into document', async () => {\n      const _el = await fixture<HelixProse>('<hx-prose><p>Styled</p></hx-prose>');\n      const hasProseSheet = document.adoptedStyleSheets.some((sheet) => {\n        try {\n          const rules = Array.from(sheet.cssRules);\n          return rules.some((rule) => rule.cssText.includes('hx-prose'));\n        } catch {\n          return false;\n        }\n      });\n      expect(hasProseSheet).toBe(true);\n    });\n\n    it('styles are scoped to hx-prose', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Scoped content</p></hx-prose>');\n      const p = el.querySelector('p');\n      expect(p).toBeTruthy();\n      const proseSheet = document.adoptedStyleSheets.find((sheet) => {\n        try {\n          const rules = Array.from(sheet.cssRules);\n          return rules.some((rule) => rule.cssText.includes('hx-prose'));\n        } catch {\n          return false;\n        }\n      });\n      expect(proseSheet).toBeTruthy();\n      const rules = Array.from(proseSheet!.cssRules);\n      const pRule = rules.find((rule) => rule.cssText.includes('hx-prose p'));\n      expect(pRule).toBeTruthy();\n    });\n\n    it('stylesheet is removed on disconnect', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Temp</p></hx-prose>');\n      const sheetCountBefore = document.adoptedStyleSheets.filter((sheet) => {\n        try {\n          const rules = Array.from(sheet.cssRules);\n          return rules.some((rule) => rule.cssText.includes('hx-prose'));\n        } catch {\n          return false;\n        }\n      }).length;\n      expect(sheetCountBefore).toBeGreaterThan(0);\n\n      el.remove();\n\n      const sheetCountAfter = document.adoptedStyleSheets.filter((sheet) => {\n        try {\n          const rules = Array.from(sheet.cssRules);\n          return rules.some((rule) => rule.cssText.includes('hx-prose'));\n        } catch {\n          return false;\n        }\n      }).length;\n      expect(sheetCountAfter).toBe(sheetCountBefore - 1);\n    });\n  });\n\n  // ─── Typography (5) ───\n\n  describe('Typography', () => {\n    it('headings are styled with bold weight', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><h2>My Heading</h2></hx-prose>');\n      const h2 = el.querySelector('h2');\n      expect(h2).toBeTruthy();\n      const computed = window.getComputedStyle(h2!);\n      expect(Number(computed.fontWeight)).toBeGreaterThanOrEqual(600);\n    });\n\n    it('paragraphs have healthcare-appropriate line-height (>=1.5)', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p>Paragraph text</p></hx-prose>');\n      const p = el.querySelector('p');\n      expect(p).toBeTruthy();\n      const computed = window.getComputedStyle(p!);\n      const fontSize = parseFloat(computed.fontSize);\n      const lineHeight = parseFloat(computed.lineHeight);\n      const ratio = lineHeight / fontSize;\n      expect(ratio).toBeGreaterThanOrEqual(1.5);\n    });\n\n    it('links are styled with underline', async () => {\n      const el = await fixture<HelixProse>('<hx-prose><p><a href=\"#\">Test link</a></p></hx-prose>');\n      const link = el.querySelector('a');\n      expect(link).toBeTruthy();\n      const computed = window.getComputedStyle(link!);\n      expect(computed.textDecorationLine).toContain('underline');\n    });\n\n    it('blockquotes have left border and italic style', async () => {\n      const el = await fixture<HelixProse>(\n        '<hx-prose><blockquote><p>Quote text</p></blockquote></hx-prose>',\n      );\n      const bq = el.querySelector('blockquote');\n      expect(bq).toBeTruthy();\n      const computed = window.getComputedStyle(bq!);\n      expect(computed.fontStyle).toBe('italic');\n      expect(computed.borderLeftStyle).not.toBe('none');\n    });\n\n    it('code blocks have monospace font', async () => {\n      const el = await fixture<HelixProse>(\n        '<hx-prose><pre><code>const x = 1;</code></pre></hx-prose>',\n      );\n      const pre = el.querySelector('pre');\n      expect(pre).toBeTruthy();\n      const computed = window.getComputedStyle(pre!);\n      expect(computed.fontFamily).toMatch(/mono/i);\n    });\n  });\n\n  // ─── Accessibility (4) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations with heading content', async () => {\n      const el = await fixture<HelixProse>(`\n        <hx-prose>\n          <h1>Main Heading</h1>\n          <p>Introduction paragraph with <a href=\"#\">a link</a>.</p>\n          <h2>Section Heading</h2>\n          <p>Section content goes here.</p>\n        </hx-prose>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with table content', async () => {\n      const el = await fixture<HelixProse>(`\n        <hx-prose>\n          <h2>Data Table</h2>\n          <table>\n            <thead>\n              <tr><th>Name</th><th>Value</th></tr>\n            </thead>\n            <tbody>\n              <tr><td>Item A</td><td>100</td></tr>\n              <tr><td>Item B</td><td>200</td></tr>\n            </tbody>\n          </table>\n        </hx-prose>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with list content', async () => {\n      const el = await fixture<HelixProse>(`\n        <hx-prose>\n          <h2>Procedure Steps</h2>\n          <ol>\n            <li>Verify patient identity</li>\n            <li>Review medication list</li>\n            <li>Document findings</li>\n          </ol>\n          <ul>\n            <li>Gloves</li>\n            <li>Mask</li>\n            <li>Gown</li>\n          </ul>\n        </hx-prose>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with images that have alt text', async () => {\n      const el = await fixture<HelixProse>(`\n        <hx-prose>\n          <h2>Patient Chart</h2>\n          <img src=\"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==\" alt=\"Patient vital signs chart\">\n          <img src=\"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==\" alt=\"\">\n        </hx-prose>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read prose scoped CSS and unscoped partials",
      "status": "completed",
      "activeForm": "Reading prose CSS files"
    },
    {
      "content": "Fix P0-02: WcProse type import in test file",
      "status": "completed",
      "activeForm": "Fixing WcProse type import"
    },
    {
      "content": "Fix P0-01: --wc-* tokens in _media.css",
      "status": "completed",
      "activeForm": "Fixing stale --wc-* tokens in _media.css"
    },
    {
      "content": "Fix P1-01 through P1-06: Hardcoded values, caption-side, nowrap, lead paragraph",
      "status": "completed",
      "activeForm": "Fixing high-severity CSS issues"
    },
    {
      "content": "Fix P2-02: Token prefix in prose.css comments",
      "status": "completed",
      "activeForm": "Fixing token prefix in comments"
    },
    {
      "content": "Fix P2-06: Add base styles on hx-prose container",
      "status": "completed",
      "activeForm": "Adding base styles to hx-prose"
    },
    {
      "content": "Fix CEM: _styles missing description",
      "status": "completed",
      "activeForm": "Fixing _styles description for CEM"
    },
    {
      "content": "Strengthen test assertions and add missing coverage",
      "status": "completed",
      "activeForm": "Strengthening tests and adding coverage"
    },
    {
      "content": "Run build and tests to verify",
      "status": "in_progress",
      "activeForm": "Running build and tests"
    }
  ]
}
Now let me run the build and tests.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Now run the tests for hx-prose.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-prose/hx-prose.test.ts 2>&1 | tail -60",
  "description": "Run hx-prose tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests via npm script",
  "timeout": 180000
}
All 3116 tests pass, zero failures. Let me also verify the diff.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-prose diff --stat",
  "description": "Show changed files"
}
The only non-screenshot files changed are exactly the ones we intended:
- `hx-prose.test.ts` — fixed type import, strengthened assertions, added coverage
- `hx-prose.ts` — added JSDoc for `_styles`
- `_media.css` — migrated `--wc-*` → `--hx-*` tokens
- `prose.css` — fixed comment token prefix
- `prose.scoped.css` — tokenized hardcoded values, fixed lead paragraph, caption-side, nowrap, added base container styles

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read prose scoped CSS and unscoped partials",
      "status": "completed",
      "activeForm": "Reading prose CSS files"
    },
    {
      "content": "Fix P0-02: WcProse type import in test file",
      "status": "completed",
      "activeForm": "Fixing WcProse type import"
    },
    {
      "content": "Fix P0-01: --wc-* tokens in _media.css",
      "status": "completed",
      "activeForm": "Fixing stale --wc-* tokens in _media.css"
    },
    {
      "content": "Fix P1-01 through P1-06: Hardcoded values, caption-side, nowrap, lead paragraph",
      "status": "completed",
      "activeForm": "Fixing high-severity CSS issues"
    },
    {
      "content": "Fix P2-02: Token prefix in prose.css comments",
      "status": "completed",
      "activeForm": "Fixing token prefix in comments"
    },
    {
      "content": "Fix P2-06: Add base styles on hx-prose container",
      "status": "completed",
      "activeForm": "Adding base styles to hx-prose"
    },
    {
      "content": "Fix CEM: _styles missing description",
      "status": "completed",
      "activeForm": "Fixing _styles description for CEM"
    },
    {
      "content": "Strengthen test assertions and add missing coverage",
      "status": "completed",
      "activeForm": "Strengthening tests and adding coverage"
    },
    {
      "content": "Run build and tests to verify",
      "status": "completed",
      "activeForm": "Running build and tests"
    }
  ]
}
<summary>
## Summary: Deep Audit v2 — hx-prose

### Changes Implemented

**P0 Fixes (Blockers):**
- **P0-01**: Migrated all `--wc-*` tokens to `--hx-*` in `_media.css` (14 occurrences) — images, figures, video, iframes, and embeds now use the correct token namespace
- **P0-02**: Fixed `WcProse` type import → `HelixProse` in test file (was referencing a nonexistent export)

**P1 Fixes (High):**
- **P1-01**: Tokenized hardcoded `0.875em` font-size on `code`, `kbd`, `samp` → `var(--hx-font-size-sm, 0.875em)`. Tokenized `0.125em` padding → `var(--hx-space-px, 0.125em)`
- **P1-02**: Replaced raw `rgba()` box-shadow on `kbd` → `var(--hx-shadow-inset-sm, ...)`
- **P1-03**: Changed `p:first-child` lead paragraph from auto-apply to opt-in only (`.lead` class) — prevents CMS content from unintentionally getting lead styles
- **P1-04**: Changed `caption-side: bottom` → `caption-side: top` for better screen reader alignment (WCAG H39)
- **P1-05**: Removed `white-space: nowrap` on `th` to prevent mobile overflow on clinical data tables
- **P1-06**: Strengthened test line-height assertion from `> 0` to `>= 1.5` (healthcare readability mandate)
- **P1-07**: Added test coverage for: `size="lg"`, dynamic size update, maxWidth reset, blockquote styles, code block monospace font, image alt text a11y

**P2 Fixes (Medium):**
- **P2-02**: Fixed `--wc-*` → `--hx-*` token prefix in `prose.css` header comments
- **P2-06**: Added base `hx-prose` container styles (display, max-width, font-family, font-size, line-height, color) in CSS to prevent FOUC and establish a font-family baseline

**CEM Fix:**
- Added JSDoc description to `_styles` private member to resolve CEM health score issue

### Files Modified
- `packages/hx-library/src/components/hx-prose/hx-prose.ts` — JSDoc on `_styles`
- `packages/hx-library/src/components/hx-prose/hx-prose.test.ts` — type fix, stronger assertions, new tests
- `packages/hx-library/src/styles/prose/_media.css` — `--wc-*` → `--hx-*` migration
- `packages/hx-library/src/styles/prose/prose.css` — comment token prefix fix
- `packages/hx-library/src/styles/prose/prose.scoped.css` — tokenized values, lead paragraph, caption-side, nowrap, base container

### Verification Status
- `npm run type-check`: 0 errors
- `npm run test:library`: 3116 tests passed, 79 test files, 0 failures
- `git diff --stat`: only intended files modified (+ screenshot binary updates from test runs)

### Risks/Blockers Encountered
- None. All fixes applied cleanly.

### Documented but NOT Fixed (P2, by design):
- **P2-01**: `prose.css` unscoped barrel global selectors — requires consumer documentation, not a code change
- **P2-03**: `clear: none` on aligned images — complex CMS layout behavior, needs broader discussion
- **P2-04**: `_styles` underscore convention — codebase convention needs consistency check
- **P2-05**: Deprecated `align` attribute selectors — intentional CKEditor compatibility shims
- **P2-07**: Axe test for `img` without `alt` — added alt-present test; negative test (missing alt) is consumer validation
- **P2-08**: Storybook coverage — existing stories are comprehensive; incremental additions tracked separately

### Notes for Developer
- The `p:first-child` lead removal is a visual change — CMS content will no longer auto-style first paragraphs. Use `<p class="lead">` explicitly.
- `caption-side: top` changes table caption visual position. Verify with existing Drupal content.
- `th` text can now wrap on narrow screens, which improves mobile readability but changes table layout.
</summary>