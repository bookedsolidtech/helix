I'll start by reading the existing component files and running the wc-mcp tools in parallel.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Bash,Agent,TodoWrite,Write,Edit,Grep",
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
      "content": "Read existing hx-status-indicator component files",
      "status": "in_progress",
      "activeForm": "Reading existing component files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "in_progress",
      "activeForm": "Running wc-mcp analysis"
    },
    {
      "content": "Audit design tokens usage",
      "status": "pending",
      "activeForm": "Auditing design tokens"
    },
    {
      "content": "Audit accessibility compliance",
      "status": "pending",
      "activeForm": "Auditing accessibility"
    },
    {
      "content": "Fix CRITICAL and HIGH issues",
      "status": "pending",
      "activeForm": "Fixing critical and high issues"
    },
    {
      "content": "Update tests for coverage",
      "status": "pending",
      "activeForm": "Updating tests"
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
  "pattern": "packages/hx-library/src/components/hx-status-indicator/**/*"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-status-indicator"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-status-indicator"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-status-indicator"
}

🔧 Tool: mcp__wc-mcp__list_css_parts
Input: {
  "tagName": "hx-status-indicator"
}
Now let me read all the component files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/index.ts"
}
I now have a complete picture. Let me update my task list and begin fixing issues.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-status-indicator component files",
      "status": "completed",
      "activeForm": "Reading existing component files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis"
    },
    {
      "content": "Fix HIGH: Add CEM CSS custom property + ARIA documentation",
      "status": "in_progress",
      "activeForm": "Fixing CEM documentation gaps"
    },
    {
      "content": "Fix HIGH: Add component-level override tokens",
      "status": "pending",
      "activeForm": "Adding component-level override tokens"
    },
    {
      "content": "Run verification gates",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
## Audit Findings

**wc-mcp CEM Score: 100/100 (A)** — Well documented
**wc-mcp A11y Score: 10/100 (F)** — CEM metadata gaps, not code gaps

### Issues Found:

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **HIGH** | CEM: No `@cssproperty` tags — consumers can't discover theming tokens | Add JSDoc |
| 2 | **HIGH** | CEM: No ARIA documentation in metadata — causes F a11y score | Add JSDoc |
| 3 | **HIGH** | No component-level override tokens (e.g. `--hx-status-indicator-online-color`) — violates 3-tier cascade | Add tokens |
| 4 | LOW | `_getLabel` method shows in CEM as public | Already private naming |
| 5 | INFO | Color-alone indication — mitigated by aria-label + typical adjacent text usage | Document |

Let me fix the HIGH issues. First, adding component-level tokens and CEM documentation.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.ts",
  "old_string": "/**\n * A colored dot/badge indicating system or entity health status.\n * Purely visual — no slots. Supports an animated pulse ring.\n *\n * @summary Status indicator dot component.\n *\n * @tag hx-status-indicator\n *\n * @csspart base - The dot element.\n * @csspart pulse-ring - The animated pulse ring element.\n */",
  "new_string": "/**\n * A colored dot/badge indicating system or entity health status.\n * Purely visual — no slots. Supports an animated pulse ring.\n *\n * Uses `role=\"img\"` with an auto-generated `aria-label` (e.g. \"Status: Online\").\n * Set `aria-hidden=\"true\"` on the host when status is conveyed by adjacent text.\n *\n * @summary Status indicator dot component.\n *\n * @tag hx-status-indicator\n *\n * @csspart base - The dot element.\n * @csspart pulse-ring - The animated pulse ring element.\n *\n * @cssproperty [--hx-status-indicator-color-online] - Override color for the \"online\" status dot.\n * @cssproperty [--hx-status-indicator-color-offline] - Override color for the \"offline\" status dot.\n * @cssproperty [--hx-status-indicator-color-away] - Override color for the \"away\" status dot.\n * @cssproperty [--hx-status-indicator-color-busy] - Override color for the \"busy\" status dot.\n * @cssproperty [--hx-status-indicator-color-unknown] - Override color for the \"unknown\" status dot.\n * @cssproperty [--hx-status-indicator-size-sm] - Override size for the \"sm\" variant.\n * @cssproperty [--hx-status-indicator-size-md] - Override size for the \"md\" variant.\n * @cssproperty [--hx-status-indicator-size-lg] - Override size for the \"lg\" variant.\n * @cssproperty [--hx-status-indicator-pulse-duration] - Override pulse animation duration.\n * @cssproperty [--hx-status-indicator-pulse-scale] - Override pulse animation max scale.\n */"
}
Now update the styles to use the component-level tokens with semantic fallbacks.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.styles.ts",
  "old_string": "  /* ─── Size Variants ─── */\n\n  :host([size='sm']) {\n    --_indicator-size: var(--hx-size-2, 0.5rem);\n  }\n\n  :host([size='md']) {\n    --_indicator-size: var(--hx-size-3, 0.75rem);\n  }\n\n  :host([size='lg']) {\n    --_indicator-size: var(--hx-size-4, 1rem);\n  }\n\n  /* ─── Status Colors ─── */\n\n  :host([status='online']) {\n    --_dot-color: var(--hx-color-success-500, #22c55e);\n  }\n\n  :host([status='offline']) {\n    --_dot-color: var(--hx-color-neutral-400, #94a3b8);\n  }\n\n  :host([status='away']) {\n    --_dot-color: var(--hx-color-warning-500, #f59e0b);\n  }\n\n  :host([status='busy']) {\n    --_dot-color: var(--hx-color-danger-500, #ef4444);\n  }\n\n  :host([status='unknown']) {\n    --_dot-color: var(--hx-color-neutral-300, #cbd5e1);\n  }",
  "new_string": "  /* ─── Size Variants ─── */\n\n  :host([size='sm']) {\n    --_indicator-size: var(--hx-status-indicator-size-sm, var(--hx-size-2, 0.5rem));\n  }\n\n  :host([size='md']) {\n    --_indicator-size: var(--hx-status-indicator-size-md, var(--hx-size-3, 0.75rem));\n  }\n\n  :host([size='lg']) {\n    --_indicator-size: var(--hx-status-indicator-size-lg, var(--hx-size-4, 1rem));\n  }\n\n  /* ─── Status Colors ─── */\n\n  :host([status='online']) {\n    --_dot-color: var(--hx-status-indicator-color-online, var(--hx-color-success-500, #22c55e));\n  }\n\n  :host([status='offline']) {\n    --_dot-color: var(--hx-status-indicator-color-offline, var(--hx-color-neutral-400, #94a3b8));\n  }\n\n  :host([status='away']) {\n    --_dot-color: var(--hx-status-indicator-color-away, var(--hx-color-warning-500, #f59e0b));\n  }\n\n  :host([status='busy']) {\n    --_dot-color: var(--hx-status-indicator-color-busy, var(--hx-color-danger-500, #ef4444));\n  }\n\n  :host([status='unknown']) {\n    --_dot-color: var(--hx-status-indicator-color-unknown, var(--hx-color-neutral-300, #cbd5e1));\n  }"
}
Now add the pulse duration/scale override tokens.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.styles.ts",
  "old_string": "    animation: hx-status-pulse 1.5s ease-out infinite;",
  "new_string": "    animation: hx-status-pulse var(--hx-status-indicator-pulse-duration, 1.5s) ease-out infinite;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.styles.ts",
  "old_string": "      transform: scale(2.5);",
  "new_string": "      transform: scale(var(--hx-status-indicator-pulse-scale, 2.5));"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-status-indicator component files",
      "status": "completed",
      "activeForm": "Reading existing component files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis"
    },
    {
      "content": "Fix HIGH: Add CEM CSS custom property + ARIA documentation",
      "status": "completed",
      "activeForm": "Fixing CEM documentation gaps"
    },
    {
      "content": "Fix HIGH: Add component-level override tokens",
      "status": "completed",
      "activeForm": "Adding component-level override tokens"
    },
    {
      "content": "Run verification gates",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    }
  ]
}
Now let me run the verification gates.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -30",
  "description": "Run lint + format:check + type-check",
  "timeout": 120000
}
All gates pass — 0 errors. Let me run the tests for this component.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-status-indicator/ 2>&1 | tail -50",
  "description": "Run hx-status-indicator tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project=library --reporter=verbose 2>&1 | grep -E \"(status-indicator|PASS|FAIL|Tests|✓|×)\" | head -40",
  "description": "Run library tests filtered to status-indicator",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator/packages/hx-library && npx vitest run --reporter=verbose src/components/hx-status-indicator/ 2>&1 | tail -50",
  "description": "Run tests from hx-library directory",
  "timeout": 180000
}
All 29 tests pass. Let me check what files changed.

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-status-indicator && git diff --stat",
  "description": "Show changed files"
}
Only the two component files changed (plus screenshot PNGs from test runs — expected). Let me also regenerate the CEM to verify it picks up the new CSS properties.

🔧 Tool: Bash
Input: {
  "command": "npm run cem 2>&1 | tail -5",
  "description": "Regenerate Custom Elements Manifest",
  "timeout": 30000
}
Let me verify the CEM now has the CSS properties.

🔧 Tool: Bash
Input: {
  "command": "cat packages/hx-library/custom-elements.json | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(p['name']) for m in d['modules'] for dec in m.get('declarations',[]) if dec.get('tagName')=='hx-status-indicator' for p in dec.get('cssProperties',[])]\"",
  "description": "Verify CEM has CSS properties for hx-status-indicator"
}
All 10 CSS custom properties are now in the CEM. Let me re-run the wc-mcp tools to check the improved scores.

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-status-indicator"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-status-indicator"
}
The wc-mcp a11y score stays at 10/100 — this is expected and correct for a non-interactive status dot. The tool's rubric checks for keyboard events, focus, disabled, form association — none of which apply to a purely visual `role="img"` element. The actual accessibility is solid (role="img", aria-label, reduced-motion).

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing hx-status-indicator component files",
      "status": "completed",
      "activeForm": "Reading existing component files"
    },
    {
      "content": "Run wc-mcp analysis tools",
      "status": "completed",
      "activeForm": "Running wc-mcp analysis"
    },
    {
      "content": "Fix HIGH: Add CEM CSS custom property + ARIA documentation",
      "status": "completed",
      "activeForm": "Fixing CEM documentation gaps"
    },
    {
      "content": "Fix HIGH: Add component-level override tokens",
      "status": "completed",
      "activeForm": "Adding component-level override tokens"
    },
    {
      "content": "Run verification gates",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}
<summary>
## Summary: Deep Audit v2 — hx-status-indicator

### Audit Results

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Design Tokens | **A** (after fix) | Now uses 3-tier cascade: component → semantic → hardcoded fallback |
| Accessibility | **A** | role="img", auto aria-label, reduced-motion, axe-core clean |
| Functionality | **A** | 5 statuses, 3 sizes, pulse animation, custom labels |
| TypeScript | **A** | Strict types, no `any`, proper exports |
| CSS/Styling | **A** | Shadow DOM, CSS Parts, token-based, reduced-motion |
| CEM Accuracy | **A** (after fix) | 10 CSS custom properties now documented |
| Tests | **A** | 29/29 passing, comprehensive coverage |
| Storybook | **A** | All variants, healthcare scenario, decorative usage |
| Drupal Compatibility | **A** | Attribute-only API, Twig-friendly |
| Portability | **A** | Self-contained, no external deps |

### Changes Implemented
- **Added 10 component-level CSS custom property tokens** following 3-tier cascade pattern (component → semantic → fallback)
- **Added ARIA documentation** to JSDoc (role="img", aria-label guidance)
- **Added `@cssproperty` JSDoc tags** for all consumer-facing tokens (colors, sizes, pulse timing)

### Files Modified
- `packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.ts` — Added CEM JSDoc tags
- `packages/hx-library/src/components/hx-status-indicator/hx-status-indicator.styles.ts` — Added component-level token cascade

### Verification Status
- `npm run verify`: 0 errors (lint, format, type-check all pass)
- `npm run cem`: 10 CSS properties now in CEM for hx-status-indicator
- Tests: 29/29 passing (Vitest browser mode, Chromium)
- wc-mcp CEM score: 100/100 (A)
- wc-mcp a11y score: 10/100 (F) — expected for non-interactive component; rubric checks keyboard/focus/form/disabled which don't apply

### Risks/Blockers Encountered
- None. Component was already well-built; audit fixes were additive.

### Learnings
- wc-mcp accessibility scoring is designed for interactive widgets — purely visual/informational components will always score low on dimensions like keyboard events, focus, and form association. This is a known limitation, not a bug.
- The 3-tier token cascade (component → semantic → primitive) was missing the component layer — now all status colors and sizes can be overridden at the component level.

### Notes for Developer
- The `--hx-status-indicator-*` tokens are the public theming API. Consumers override at this level.
- `aria-hidden="true"` should be set on the host when status text appears in adjacent content (documented in JSDoc and shown in Storybook DecorativeUsage story).
</summary>