
🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-card/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/hx-card.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/src/components/hx-card/hx-card.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/src/components/hx-card/hx-card.test.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/*.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/_TEMPLATE.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/src/components/hx-card/hx-card.styles.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/hx-button.md"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/*.mdx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/src/components/hx-card/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/hx-card.mdx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/hx-button.mdx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/src/components/hx-card/AUDIT.md"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-card*"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/vite*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library/vite.config.ts"
}
Now I can see the issues. The `hx-card.mdx` references the old event name `hx-card-click` in two places, but the component fires `hx-click`. Also, the Drupal Integration section is missing the `Drupal.behaviors` JS block that the template requires. Let me fix these:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/hx-card.mdx",
  "old_string": "## Events\n\n| Event           | Detail Type                                                    | Description                                                                                                                 |\n| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |\n| `hx-card-click` | `{ href: string; originalEvent: MouseEvent \\| KeyboardEvent }` | Dispatched when an interactive card (with `hx-href`) is clicked or activated via keyboard. `bubbles: true, composed: true`. |",
  "new_string": "## Events\n\n| Event      | Detail Type                                                    | Description                                                                                                                 |\n| ---------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |\n| `hx-click` | `{ href: string; originalEvent: MouseEvent \\| KeyboardEvent }` | Dispatched when an interactive card (with `hx-href`) is clicked or activated via keyboard. `bubbles: true, composed: true`. |"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/hx-card.mdx",
  "old_string": "    <script>\n      document.getElementById('interactive-card').addEventListener('hx-card-click', (e) => {\n        console.log('Card clicked, href:', e.detail.href);\n        // Handle navigation here or let the browser follow the href\n      });\n    </script>",
  "new_string": "    <script>\n      document.getElementById('interactive-card').addEventListener('hx-click', (e) => {\n        console.log('Card clicked, href:', e.detail.href);\n        // Handle navigation here or let the browser follow the href\n      });\n    </script>"
}
Now add the missing `Drupal.behaviors` JS block to the Drupal Integration section:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/apps/docs/src/content/docs/component-library/hx-card.mdx",
  "old_string": "Load the library in your module's `.libraries.yml`:\n\n```yaml\nhelix-components:\n  js:\n    /libraries/helix/helix.min.js: { minified: true }\n```\n\n## Standalone HTML Example",
  "new_string": "Load the library in your module's `.libraries.yml`:\n\n```yaml\nhelix-components:\n  js:\n    /libraries/helix/helix.min.js: { minified: true }\n```\n\nListen for events in Drupal behaviors using `once()` to prevent duplicate listeners on AJAX:\n\n```javascript\nDrupal.behaviors.helixCard = {\n  attach(context) {\n    // once() is a Drupal core utility (no import needed) — prevents duplicate event binding during AJAX attach cycles\n    once('helixCard', 'hx-card[hx-href]', context).forEach((el) => {\n      el.addEventListener('hx-click', (e) => {\n        window.location.href = e.detail.href;\n      });\n    });\n  },\n};\n```\n\n## Standalone HTML Example"
}
Now run `npm run verify` and the tests:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cat /Users/himerus/.claude/projects/-Volumes-Development-booked-helix--worktrees-feature-launch-ready-hx-card/2763736c-0a78-4cce-821d-f36570a2b8c6/tool-results/bzc6qzk7w.txt | tail -50"
}
`npm run verify` passes with 0 errors. Now run the tests:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library -- --reporter=verbose 2>&1 | grep -A 5 \"hx-card\\|PASS\\|FAIL\\|axe\\|Error\\|✓\\|✗\\|×\" | head -100",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-card/hx-card.test.ts 2>&1 | tail -60",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card/packages/hx-library && npx vitest run --reporter=verbose src/components/hx-card/hx-card.test.ts 2>&1 | tail -60",
  "timeout": 120000
}
All 42 tests pass, including all 4 axe-core accessibility tests. Now let me verify the git diff to confirm only the intended files were changed:

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-card diff --stat"
}
Only `hx-card.mdx` was modified. The Playwright verification step is not applicable here since this is a documentation update — the component itself is unchanged and all 42 tests (including axe-core) already verify the functionality and accessibility.

<summary>
## Summary: Launch readiness audit for hx-card

### Changes Implemented
- Fixed incorrect event name in the Events table: `hx-card-click` → `hx-click` (matches what the component actually dispatches)
- Fixed incorrect event name in the Standalone HTML Example script: `hx-card-click` → `hx-click`
- Added missing `Drupal.behaviors` JS block to the Drupal Integration section (required by the 12-section template)

### Files Modified
- `apps/docs/src/content/docs/component-library/hx-card.mdx`

### Risks/Blockers Encountered
- The AUDIT.md (dated 2026-03-05) described many issues with the component source, but the actual component code had already been fixed (event name, aria-label pattern, prefers-reduced-motion, etc.). The audit was stale.
- The doc page (`hx-card.mdx`) still referenced the old event name `hx-card-click` while the component fires `hx-click` — corrected.
- The Drupal Integration section was missing the `Drupal.behaviors` JS block that the template requires — added.

### Learnings
- The component source (`hx-card.ts`) was already in good shape: zero axe violations, WCAG 2.1 AA compliant, correct event name, proper reduced-motion support
- The individual export entry point is auto-discovered via `vite.config.ts` — no manual wiring needed
- All 42 tests pass including 4 axe-core a11y tests covering default, interactive, aria-label, and all variants

### Notes for Developer
- `npm run verify`: ✅ 0 errors, 0 warnings
- `npm run test:library` (hx-card): ✅ 42/42 passed (including all 4 axe-core tests)
- Git diff: exactly 1 file changed (hx-card.mdx only)

### Verification Status
- All 42 unit tests pass via Vitest browser mode (Chromium), including 4 axe-core accessibility tests with zero violations across all variants. Documentation correctness was verified by cross-referencing the component source event dispatch code against the doc page.
</summary>