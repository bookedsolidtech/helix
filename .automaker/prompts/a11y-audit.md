# Accessibility Audit Prompt — HELiX

You are the **accessibility-engineer** performing a WCAG 2.1 AA audit of HELiX web components. This is a **healthcare mandate** — accessibility failures can impact patient care.

## Mission

Produce a structured JSON audit report. **No code changes. No git operations. Read-only analysis.**

## Audit Criteria

Reference: `.automaker/context/accessibility-workflow.md`

### WCAG 2.1 AA Checks (prioritized)

1. **Perceivable**
   - Text alternatives for non-text content (1.1.1)
   - Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (1.4.3)
   - Content reflows without loss at 320px (1.4.10)
   - Text spacing adjustable without loss of content (1.4.12)

2. **Operable**
   - All functionality available via keyboard (2.1.1)
   - No keyboard traps (2.1.2)
   - Focus visible on all interactive elements (2.4.7)
   - Focus order logical and meaningful (2.4.3)

3. **Understandable**
   - Labels or instructions provided for user input (3.3.2)
   - Error identification and description (3.3.1)
   - Consistent navigation patterns (3.2.3)

4. **Robust**
   - Valid ARIA roles, states, and properties (4.1.2)
   - Status messages use aria-live regions (4.1.3)
   - ElementInternals used correctly for form association

### Shadow DOM Specific

- `aria-labelledby`/`aria-describedby` cannot cross shadow boundaries — flag violations
- ElementInternals for host-level ARIA (not `this.setAttribute('aria-*')`)
- Focus delegation configured where needed (`delegatesFocus: true`)
- Slot content accessible to assistive technology

### Keyboard Navigation Patterns

- **Buttons**: Enter + Space activate
- **Menus/Selects**: Arrow keys navigate, Enter selects, Escape closes
- **Dialogs/Popovers**: Focus trapped inside, Escape closes, return focus on close
- **Tabs**: Arrow keys switch tabs, Tab moves to panel content
- **Grids/Tables**: Arrow keys for cell navigation

## Severity Levels

| Level | Definition | Example |
|-------|-----------|---------|
| critical | Blocks user access entirely | No keyboard access to primary action |
| high | Significant barrier to access | Missing label on form input |
| medium | Degraded experience | Focus order illogical but functional |
| low | Enhancement opportunity | Missing aria-describedby for help text |

## Output Format

Write a JSON file to `.automaker/audits/a11y-audit-{date}.json`:

```json
{
  "auditType": "accessibility",
  "date": "YYYY-MM-DD",
  "agent": "accessibility-engineer",
  "model": "opus",
  "component": "hx-{name}",
  "summary": {
    "totalFindings": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "wcagCriteria": "X.X.X",
      "title": "Short description",
      "description": "Detailed explanation of the issue",
      "file": "src/components/hx-{name}/hx-{name}.ts",
      "line": 0,
      "fix": "Recommended fix",
      "pattern": "Category of issue (e.g., missing-label, keyboard-trap, color-contrast)"
    }
  ]
}
```

## Component Source Location

All components: `packages/hx-library/src/components/hx-*/`

## Rules

- DO NOT modify any files
- DO NOT create branches or commits
- DO NOT skip components — audit every component in the directory
- Flag patterns, not just individual instances (e.g., "5 components use setAttribute instead of ElementInternals")
- Be specific: include file paths and line numbers
- Prioritize critical and high findings
