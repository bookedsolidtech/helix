I'll start by examining the hx-card component to understand its current state, then perform the deep audit.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Write,Edit,Bash,Agent,TodoWrite",
  "max_results": 8
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-card component files",
      "status": "in_progress",
      "activeForm": "Reading and auditing hx-card component files"
    },
    {
      "content": "Fix CRITICAL and HIGH issues found in audit",
      "status": "pending",
      "activeForm": "Fixing CRITICAL and HIGH issues"
    },
    {
      "content": "Update tests for comprehensive coverage",
      "status": "pending",
      "activeForm": "Updating tests for comprehensive coverage"
    },
    {
      "content": "Update Storybook stories",
      "status": "pending",
      "activeForm": "Updating Storybook stories"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-card/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/index.ts"
}
Now let me check the existing AUDIT.md and the CEM for this component.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/AUDIT.md"
}

🔧 Tool: Grep
Input: {
  "pattern": "hx-card",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/custom-elements.json",
  "output_mode": "content",
  "head_limit": 5
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/test-utils.ts"
}
Excellent. I have a comprehensive picture of the component and the existing audit. The AUDIT.md identifies 7 P1 issues. Let me fix all of them.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-card component files",
      "status": "completed",
      "activeForm": "Reading and auditing hx-card component files"
    },
    {
      "content": "Fix P1: TypeScript — @fires JSDoc + generic CustomEvent",
      "status": "in_progress",
      "activeForm": "Fixing TypeScript issues"
    },
    {
      "content": "Fix P1: Accessibility — aria-label, prefers-reduced-motion, interactive+actions guard",
      "status": "pending",
      "activeForm": "Fixing accessibility issues"
    },
    {
      "content": "Fix P1: CSS — --hx-card-gap usage, compact variant padding",
      "status": "pending",
      "activeForm": "Fixing CSS issues"
    },
    {
      "content": "Fix P1: Storybook — wrong event detail property, stale wcHref arg name",
      "status": "pending",
      "activeForm": "Fixing Storybook issues"
    },
    {
      "content": "Update tests for new features and coverage",
      "status": "pending",
      "activeForm": "Updating tests"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now let me fix all P1 issues. Starting with `hx-card.ts`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": " * @fires {CustomEvent<{href: string, originalEvent: MouseEvent}>} hx-card-click - Dispatched when an interactive card (with hx-href) is clicked.",
  "new_string": " * @fires {CustomEvent<{href: string, originalEvent: MouseEvent | KeyboardEvent}>} hx-card-click - Dispatched when an interactive card (with hx-href) is clicked or activated via keyboard."
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": "  /**\n   * Optional URL. When set, the card becomes interactive (clickable)\n   * and navigates to this URL on click.\n   * Uses hx-href to avoid conflicting with the native HTML href attribute.\n   * @attr hx-href\n   */\n  @property({ type: String, attribute: 'hx-href' })\n  hxHref = '';\n\n  // ─── Slot Detection ───\n\n  @state() private _hasImage = false;\n  @state() private _hasHeading = false;\n  @state() private _hasFooter = false;\n  @state() private _hasActions = false;",
  "new_string": "  /**\n   * Optional URL. When set, the card becomes interactive (clickable)\n   * and navigates to this URL on click.\n   * Uses hx-href to avoid conflicting with the native HTML href attribute.\n   * @attr hx-href\n   */\n  @property({ type: String, attribute: 'hx-href' })\n  hxHref = '';\n\n  /**\n   * Accessible label for interactive cards. When set, overrides the default\n   * \"Navigate to {hx-href}\" aria-label with a descriptive label.\n   * Recommended for all interactive cards in healthcare contexts.\n   * @attr hx-label\n   */\n  @property({ type: String, attribute: 'hx-label' })\n  hxLabel = '';\n\n  // ─── Slot Detection ───\n\n  @state() private _hasImage = false;\n  @state() private _hasHeading = false;\n  @state() private _hasFooter = false;\n  @state() private _hasActions = false;"
}
Now fix the generic typing on CustomEvent dispatch:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": "    this.dispatchEvent(\n      new CustomEvent('hx-card-click', {\n        bubbles: true,\n        composed: true,\n        detail: { href: this.hxHref, originalEvent },\n      }),\n    );",
  "new_string": "    this.dispatchEvent(\n      new CustomEvent<{ href: string; originalEvent: MouseEvent | KeyboardEvent }>(\n        'hx-card-click',\n        {\n          bubbles: true,\n          composed: true,\n          detail: { href: this.hxHref, originalEvent },\n        },\n      ),\n    );"
}
Now fix the `aria-label` to use `hxLabel` when available:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": "        aria-label=${isInteractive ? `Navigate to ${this.hxHref}` : nothing}",
  "new_string": "        aria-label=${isInteractive ? (this.hxLabel || `Navigate to ${this.hxHref}`) : nothing}"
}
Now add the `hx-label` to the JSDoc block:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": " * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.",
  "new_string": " * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.\n * @cssprop [--hx-card-image-aspect-ratio] - Optional aspect ratio for image slot (e.g., 16/9)."
}
Now fix the styles — add `--hx-card-gap`, fix compact variant, add prefers-reduced-motion:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts",
  "old_string": "  .card {\n    display: flex;\n    flex-direction: column;\n    background-color: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));\n    color: var(--hx-card-color, var(--hx-color-neutral-800, #212529));\n    border: var(--hx-border-width-thin, 1px) solid\n      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));\n    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));\n    overflow: hidden;\n    font-family: var(--hx-font-family-sans, sans-serif);\n    transition:\n      box-shadow var(--hx-transition-normal, 250ms ease),\n      transform var(--hx-transition-normal, 250ms ease);\n  }",
  "new_string": "  .card {\n    display: flex;\n    flex-direction: column;\n    gap: var(--hx-card-gap, var(--hx-space-4, 1rem));\n    background-color: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));\n    color: var(--hx-card-color, var(--hx-color-neutral-800, #212529));\n    border: var(--hx-border-width-thin, 1px) solid\n      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));\n    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));\n    overflow: hidden;\n    font-family: var(--hx-font-family-sans, sans-serif);\n    transition:\n      box-shadow var(--hx-transition-normal, 250ms ease),\n      transform var(--hx-transition-normal, 250ms ease);\n  }"
}
Now fix the compact variant to apply reduced padding to all sections:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts",
  "old_string": "  .card--compact .card__body {\n    padding: var(--hx-space-3, 0.75rem);\n  }",
  "new_string": "  .card--compact .card__heading,\n  .card--compact .card__body,\n  .card--compact .card__footer,\n  .card--compact .card__actions {\n    padding-right: var(--hx-space-3, 0.75rem);\n    padding-left: var(--hx-space-3, 0.75rem);\n  }\n\n  .card--compact .card__heading {\n    padding-top: var(--hx-space-3, 0.75rem);\n  }\n\n  .card--compact .card__body {\n    padding-top: var(--hx-space-3, 0.75rem);\n    padding-bottom: var(--hx-space-3, 0.75rem);\n  }\n\n  .card--compact .card__footer {\n    padding-bottom: var(--hx-space-3, 0.75rem);\n  }\n\n  .card--compact .card__actions {\n    padding-top: var(--hx-space-3, 0.75rem);\n    padding-bottom: var(--hx-space-3, 0.75rem);\n  }"
}
Now add `prefers-reduced-motion` and the `--hx-card-gap` removal from section padding (since gap now handles spacing). Let me also add the reduced-motion media query at the end:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts",
  "old_string": "  .card__actions {\n    display: flex;\n    gap: var(--hx-space-2, 0.5rem);\n    padding-top: var(--hx-space-4, 1rem);\n    padding-right: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    padding-left: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    border-top: var(--hx-border-width-thin, 1px) solid\n      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));\n    margin-top: auto;\n  }\n`;",
  "new_string": "  .card__actions {\n    display: flex;\n    gap: var(--hx-space-2, 0.5rem);\n    padding-top: var(--hx-space-4, 1rem);\n    padding-right: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    padding-bottom: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    padding-left: var(--hx-card-padding, var(--hx-space-6, 1.5rem));\n    border-top: var(--hx-border-width-thin, 1px) solid\n      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));\n    margin-top: auto;\n  }\n\n  /* ─── Reduced Motion ─── */\n\n  @media (prefers-reduced-motion: reduce) {\n    .card {\n      transition: none;\n    }\n\n    .card--interactive:hover {\n      transform: none;\n    }\n  }\n`;"
}
Actually, adding `gap: var(--hx-space-4)` as default will change the visual spacing since padding already handles section spacing. Let me set the default gap to 0 so existing layout is preserved while making the token functional:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts",
  "old_string": "    gap: var(--hx-card-gap, var(--hx-space-4, 1rem));",
  "new_string": "    gap: var(--hx-card-gap, 0);"
}
Update the JSDoc for `--hx-card-gap` to reflect the actual default:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts",
  "old_string": " * @cssprop [--hx-card-gap=var(--hx-space-4)] - Gap between card sections.",
  "new_string": " * @cssprop [--hx-card-gap=0] - Gap between card sections. Set to add extra spacing between image, heading, body, footer, and actions."
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-card component files",
      "status": "completed",
      "activeForm": "Reading and auditing hx-card component files"
    },
    {
      "content": "Fix P1: TypeScript — @fires JSDoc + generic CustomEvent",
      "status": "completed",
      "activeForm": "Fixing TypeScript issues"
    },
    {
      "content": "Fix P1: Accessibility — aria-label, prefers-reduced-motion, interactive+actions guard",
      "status": "completed",
      "activeForm": "Fixing accessibility issues"
    },
    {
      "content": "Fix P1: CSS — --hx-card-gap usage, compact variant padding",
      "status": "completed",
      "activeForm": "Fixing CSS issues"
    },
    {
      "content": "Fix P1: Storybook — wrong event detail property, stale wcHref arg name",
      "status": "in_progress",
      "activeForm": "Fixing Storybook issues"
    },
    {
      "content": "Update tests for new features and coverage",
      "status": "pending",
      "activeForm": "Updating tests"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now fix the Storybook issues — rename `wcHref` to `hxHref` and fix the wrong `detail.url` → `detail.href`:

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "wcHref",
  "new_string": "hxHref"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "    const callDetail = interactiveClickHandler.mock.calls[0]?.[0]?.detail;\n    await expect(callDetail?.url).toBe('https://ehr.example.com/patient/67890');",
  "new_string": "    const callDetail = interactiveClickHandler.mock.calls[0]?.[0]?.detail;\n    await expect(callDetail?.href).toBe('https://ehr.example.com/patient/67890');"
}
Now fix the stories that combine `hx-href` with actions slot (ARIA anti-pattern). Remove `hx-href` from cards that also have actions:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <hx-card\n        variant=\"featured\"\n        elevation=\"raised\"\n        hx-href=\"https://ehr.example.com/patient/00-54321\"\n        style=\"max-width: 420px;\"\n      >",
  "new_string": "      <hx-card\n        variant=\"featured\"\n        elevation=\"raised\"\n        style=\"max-width: 420px;\"\n      >"
}

🔧 Tool: Grep
Input: {
  "pattern": "hx-href.*patient/00-54321",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "offset": 964,
  "limit": 10
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "    <hx-card\n      variant=\"featured\"\n      elevation=\"raised\"\n      hx-href=\"https://ehr.example.com/patient/00-54321\"\n      style=\"max-width: 420px;\"\n    >",
  "new_string": "    <hx-card\n      variant=\"featured\"\n      elevation=\"raised\"\n      style=\"max-width: 420px;\"\n    >"
}
Now fix the PatientDashboard story — remove `hx-href` from cards that have actions slots. Let me check that section:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "offset": 1009,
  "limit": 30
}
All 6 cards in PatientDashboard have `hx-href` AND `actions`. I need to remove `hx-href` from all of them. Let me do this with targeted edits:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- Critical patient -->\n      <hx-card\n        variant=\"featured\"\n        elevation=\"raised\"\n        hx-href=\"https://ehr.example.com/patient/00-11001\"\n      >",
  "new_string": "      <!-- Critical patient -->\n      <hx-card\n        variant=\"featured\"\n        elevation=\"raised\"\n      >"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- Observation patient -->\n      <hx-card elevation=\"raised\" hx-href=\"https://ehr.example.com/patient/00-11002\">",
  "new_string": "      <!-- Observation patient -->\n      <hx-card elevation=\"raised\">"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- Stable patient -->\n      <hx-card elevation=\"raised\" hx-href=\"https://ehr.example.com/patient/00-11003\">",
  "new_string": "      <!-- Stable patient -->\n      <hx-card elevation=\"raised\">"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- Discharge pending -->\n      <hx-card elevation=\"raised\" hx-href=\"https://ehr.example.com/patient/00-11004\">",
  "new_string": "      <!-- Discharge pending -->\n      <hx-card elevation=\"raised\">"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- Stable patient 2 -->\n      <hx-card elevation=\"raised\" hx-href=\"https://ehr.example.com/patient/00-11005\">",
  "new_string": "      <!-- Stable patient 2 -->\n      <hx-card elevation=\"raised\">"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "      <!-- New admission -->\n      <hx-card elevation=\"raised\" hx-href=\"https://ehr.example.com/patient/00-11006\">",
  "new_string": "      <!-- New admission -->\n      <hx-card elevation=\"raised\">"
}
Now add the `hx-label` demo to the Interactive story:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.stories.ts",
  "old_string": "    <hx-card\n      hx-href=\"https://ehr.example.com/patient/12345\"\n      elevation=\"raised\"\n      style=\"max-width: 400px;\"\n      @hx-card-click=${cardClickHandler}\n    >\n      <span slot=\"heading\">Patient Record: James Wilson</span>",
  "new_string": "    <hx-card\n      hx-href=\"https://ehr.example.com/patient/12345\"\n      hx-label=\"Open patient record for James Wilson\"\n      elevation=\"raised\"\n      style=\"max-width: 400px;\"\n      @hx-card-click=${cardClickHandler}\n    >\n      <span slot=\"heading\">Patient Record: James Wilson</span>"
}
Now update the tests. I need to add tests for the new `hxLabel` property and the `hxHref` property change after render:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.test.ts",
  "old_string": "  // ─── Interactivity (3) ───",
  "new_string": "  // ─── Property: hx-label (2) ───\n\n  describe('Property: hx-label', () => {\n    it('uses hx-label for aria-label when set', async () => {\n      const el = await fixture<HelixCard>(\n        '<hx-card hx-href=\"/test\" hx-label=\"Open patient record\">Content</hx-card>',\n      );\n      const card = shadowQuery(el, '.card')!;\n      expect(card.getAttribute('aria-label')).toBe('Open patient record');\n    });\n\n    it('falls back to Navigate to URL when hx-label not set', async () => {\n      const el = await fixture<HelixCard>('<hx-card hx-href=\"/test\">Content</hx-card>');\n      const card = shadowQuery(el, '.card')!;\n      expect(card.getAttribute('aria-label')).toBe('Navigate to /test');\n    });\n  });\n\n  // ─── Property reactivity (2) ───\n\n  describe('Property reactivity', () => {\n    it('updates interactive state when hxHref set after render', async () => {\n      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');\n      const card = shadowQuery(el, '.card')!;\n      expect(card.classList.contains('card--interactive')).toBe(false);\n      expect(card.hasAttribute('role')).toBe(false);\n\n      el.hxHref = '/new-path';\n      await el.updateComplete;\n\n      expect(card.classList.contains('card--interactive')).toBe(true);\n      expect(card.getAttribute('role')).toBe('link');\n      expect(card.getAttribute('tabindex')).toBe('0');\n      expect(card.getAttribute('aria-label')).toBe('Navigate to /new-path');\n    });\n\n    it('removes interactive state when hxHref cleared', async () => {\n      const el = await fixture<HelixCard>('<hx-card hx-href=\"/test\">Content</hx-card>');\n      const card = shadowQuery(el, '.card')!;\n      expect(card.classList.contains('card--interactive')).toBe(true);\n\n      el.hxHref = '';\n      await el.updateComplete;\n\n      expect(card.classList.contains('card--interactive')).toBe(false);\n      expect(card.hasAttribute('role')).toBe(false);\n    });\n  });\n\n  // ─── Interactivity (3) ───"
}
Now add a CSS parts test for the image and actions parts (which were missing):

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/packages/hx-library/src/components/hx-card/hx-card.test.ts",
  "old_string": "    it('footer part exposed', async () => {\n      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');\n      const footer = shadowQuery(el, '[part=\"footer\"]');\n      expect(footer).toBeTruthy();\n    });\n  });",
  "new_string": "    it('footer part exposed', async () => {\n      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');\n      const footer = shadowQuery(el, '[part=\"footer\"]');\n      expect(footer).toBeTruthy();\n    });\n\n    it('image part exposed', async () => {\n      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');\n      const image = shadowQuery(el, '[part=\"image\"]');\n      expect(image).toBeTruthy();\n    });\n\n    it('actions part exposed', async () => {\n      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');\n      const actions = shadowQuery(el, '[part=\"actions\"]');\n      expect(actions).toBeTruthy();\n    });\n  });"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-card component files",
      "status": "completed",
      "activeForm": "Reading and auditing hx-card component files"
    },
    {
      "content": "Fix P1: TypeScript — @fires JSDoc + generic CustomEvent",
      "status": "completed",
      "activeForm": "Fixing TypeScript issues"
    },
    {
      "content": "Fix P1: Accessibility — aria-label, prefers-reduced-motion, interactive+actions guard",
      "status": "completed",
      "activeForm": "Fixing accessibility issues"
    },
    {
      "content": "Fix P1: CSS — --hx-card-gap usage, compact variant padding",
      "status": "completed",
      "activeForm": "Fixing CSS issues"
    },
    {
      "content": "Fix P1: Storybook — wrong event detail property, stale wcHref arg name",
      "status": "completed",
      "activeForm": "Fixing Storybook issues"
    },
    {
      "content": "Update tests for new features and coverage",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "in_progress",
      "activeForm": "Running verification gates"
    }
  ]
}
Now let me run verification gates. First, type-check and build:

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Now let me run the build:

🔧 Tool: Bash
Input: {
  "command": "npm run build --filter=@wc-2026/library 2>&1 | tail -20",
  "description": "Build the library",
  "timeout": 120000
}
The library and docs builds succeeded (6 cached). The Storybook build failed — let me check what went wrong:

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card/apps/storybook && npm run build 2>&1 | tail -40",
  "description": "Build Storybook to see error details",
  "timeout": 120000
}
The Storybook build fails due to a missing `@storybook/addon-a11y` package — this is a pre-existing issue unrelated to my changes. The library build itself succeeds.

Let me verify the library build specifically:

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-card && npx turbo run build --filter=@wc-2026/library 2>&1 | tail -15",
  "description": "Build only the library package",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx turbo run build --filter=@helix/library 2>&1 | tail -15",
  "description": "Build only the helix library package",
  "timeout": 120000
}
Library builds successfully. Now run the tests:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-card/hx-card.test.ts 2>&1 | tail -80",
  "description": "Run hx-card tests",
  "timeout": 180000
}
Storybook addon missing is breaking the vitest workspace. Let me try running tests for just the library project:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests using project script",
  "timeout": 180000
}
All **3106 tests pass** across 79 test files. Let me verify the diff:

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Show changed files"
}
The screenshot binary diffs are from test runs (normal noise). The meaningful changes are exactly the 4 hx-card files. Let me run `npm run verify` to confirm:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run pre-push verification (lint + format:check + type-check)",
  "timeout": 120000
}
Formatting issue. Let me fix it:

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-card/hx-card.ts 2>&1",
  "description": "Fix formatting on hx-card.ts"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -15",
  "description": "Re-run verification after formatting fix",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run format:check 2>&1 | tail -5",
  "description": "Verify formatting passes"
}
All gates pass. Now let me update the AUDIT.md with the fixes applied:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read and audit hx-card component files",
      "status": "completed",
      "activeForm": "Reading and auditing hx-card component files"
    },
    {
      "content": "Fix P1: TypeScript — @fires JSDoc + generic CustomEvent",
      "status": "completed",
      "activeForm": "Fixing TypeScript issues"
    },
    {
      "content": "Fix P1: Accessibility — aria-label, prefers-reduced-motion, interactive+actions guard",
      "status": "completed",
      "activeForm": "Fixing accessibility issues"
    },
    {
      "content": "Fix P1: CSS — --hx-card-gap usage, compact variant padding",
      "status": "completed",
      "activeForm": "Fixing CSS issues"
    },
    {
      "content": "Fix P1: Storybook — wrong event detail property, stale wcHref arg name",
      "status": "completed",
      "activeForm": "Fixing Storybook issues"
    },
    {
      "content": "Update tests for new features and coverage",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Run verification gates (build, test, type-check)",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-card

### Changes Implemented

**7 P1 issues fixed:**

1. **TypeScript: `@fires` JSDoc type mismatch** — Updated `originalEvent` type from `MouseEvent` to `MouseEvent | KeyboardEvent` in JSDoc and added generic typing to `new CustomEvent<>()` dispatch.

2. **Accessibility: Non-descriptive aria-label** — Added `hxLabel` property (`hx-label` attribute) allowing consumers to provide descriptive accessible names instead of the formulaic "Navigate to {URL}". Falls back to URL-based label when not set.

3. **Accessibility: Interactive card + actions anti-pattern** — Removed `hx-href` from all Storybook stories that also use the `actions` slot (PatientSummaryCard + all 6 PatientDashboard cards), eliminating the `role="link"` + interactive descendants ARIA violation.

4. **Accessibility: No `prefers-reduced-motion` guard** — Added `@media (prefers-reduced-motion: reduce)` CSS that disables transitions and hover transforms for users with motion sensitivity.

5. **CSS: `--hx-card-gap` documented but unused** — Added `gap: var(--hx-card-gap, 0)` to `.card` flex container. Default is `0` to preserve existing layout; consumers can set the token for additional section spacing.

6. **CSS: Compact variant half-implemented** — Extended `.card--compact` to reduce padding on heading, footer, and actions sections (not just body), creating consistent compact visual rhythm.

7. **Storybook: Wrong event detail property + stale arg name** — Fixed `InteractiveClickTest` to check `detail.href` instead of `detail.url`. Renamed all `wcHref` references to `hxHref` to match the actual component API.

**Tests added (6 new):**
- `hx-label` property usage and fallback behavior (2 tests)
- `hxHref` reactivity after render — setting and clearing (2 tests)
- Missing CSS parts: image and actions (2 tests)

### Files Modified
- `packages/hx-library/src/components/hx-card/hx-card.ts` — JSDoc fixes, `hxLabel` property, generic CustomEvent
- `packages/hx-library/src/components/hx-card/hx-card.styles.ts` — `gap`, compact variant, `prefers-reduced-motion`
- `packages/hx-library/src/components/hx-card/hx-card.test.ts` — 6 new tests
- `packages/hx-library/src/components/hx-card/hx-card.stories.ts` — `wcHref`→`hxHref`, `detail.url`→`detail.href`, remove hx-href+actions anti-pattern

### Verification Status
- `npm run type-check`: 0 errors
- `npm run verify` (lint + format:check + type-check): All pass
- `npm run test:library`: **3106 tests pass** across 79 test files
- Library build: Success

### Risks/Blockers Encountered
- Storybook build fails due to missing `@storybook/addon-a11y` package — pre-existing issue, not caused by these changes
- Adding `gap` to `.card` required default of `0` instead of documented `--hx-space-4` to avoid breaking existing layout (section padding already handles spacing)

### Learnings
- The gap token needed careful defaulting — sections use asymmetric padding for spacing, so a non-zero gap default would double the visual spacing
- The compact variant was only half-implemented (body-only) — extending it to all sections was straightforward

### Notes for Developer
- P2 issues documented in AUDIT.md remain unfixed (by design — per audit scope "Fix CRITICAL+HIGH. Document rest")
- The `hx-label` property should be recommended in docs for all interactive cards in healthcare contexts where URL-based labels are non-descriptive
- Consider adding a dev-mode console.warn when `hx-href` and `actions` slot are both populated (currently prevented only in story examples)
</summary>