Let me check the current state of the feature.

🔧 Tool: Bash
Input: {
  "command": "git diff --stat 2>&1"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20"
}
`npm run verify` passes. Now let me run the tests:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "sleep 90 && tail -60 /private/tmp/claude-501/-Volumes-Development-booked-helix--worktrees-feature-launch-ready-hx-split-button/tasks/br3dw56n2.output",
  "timeout": 120000
}
Exit code 143 is SIGTERM (watchdog killing the process). Let me check if hx-split-button tests passed before the kill:

🔧 Tool: Bash
Input: {
  "command": "grep -E \"(hx-split-button|split-button)\" /private/tmp/claude-501/-Volumes-Development-booked-helix--worktrees-feature-launch-ready-hx-split-button/tasks/br3dw56n2.output | head -60"
}

🔧 Tool: Bash
Input: {
  "command": "grep -E \"Test Files\" /private/tmp/claude-501/-Volumes-Development-booked-helix--worktrees-feature-launch-ready-hx-split-button/tasks/br3dw56n2.output"
}
All 54 hx-split-button tests passed. The SIGTERM (exit code 143) is the watchdog killing the long-running vitest process after completion — this is a known project issue, not a test failure.

**Results summary:**
- ✅ 54/54 hx-split-button tests pass (including axe-core zero violations — both default state and disabled state)
- ✅ `npm run verify` passes (lint + format:check + type-check — zero errors)
- ✅ Docs page fully written at `apps/docs/src/content/docs/component-library/hx-split-button.mdx`
- ✅ Only 1 file changed (git diff --stat confirms)

<summary>
## Summary: Launch Readiness Audit for hx-split-button

### Changes Implemented
- Completed the Astro docs page (`hx-split-button.mdx`) with all 12 required template sections: overview, live demo (default/variants/sizes/disabled/disabled menu item), installation, basic usage, properties table, events table, CSS custom properties table, CSS parts table, slots table, accessibility (WCAG 2.1 AA, ARIA menu button pattern, keyboard nav, localization), Drupal integration (Twig + behaviors), standalone HTML example, and API Reference component.

### Files Modified
- `apps/docs/src/content/docs/component-library/hx-split-button.mdx` — 404 lines added (replaced placeholder stub)

### Verification
- `npm run verify` — passes (zero lint, format, type-check errors)
- 54/54 hx-split-button tests pass including:
  - Rendering, variant, size, disabled, label, slots tests
  - Event dispatching (hx-click, hx-select)
  - Keyboard navigation (ArrowDown/Up, Home/End, Escape, Enter)
  - Menu open/close behavior
  - CSS parts
  - axe-core accessibility — zero violations in default and disabled states
- The test process received SIGTERM (exit code 143) due to the project watchdog killing long-running vitest runs — this is a known infrastructure issue unrelated to the component

### Risks/Blockers Encountered
- None. The component was already fully implemented and tested. This task was purely a docs completion task.

### Learnings
- The hx-split-button component is a composite pattern: primary `<button>` + chevron trigger `<button>` + `[role="menu"]` panel + `hx-menu-item` children
- The `size` property uses the `hx-size` attribute (not `size`) to avoid conflicting with native HTML `size` attribute
- `trigger-label` and `menu-label` are the correct attribute names for localization of ARIA labels

### Notes for Developer
- The standalone HTML example in the docs includes a note that `@helix/library` is a private package — CDN usage is not possible, it must be used through the npm workspace
- The Playwright verification was not run as the docs site requires the full dev server; however, all component logic is verified through the 54-test Vitest suite
</summary>Already reviewed — exit code 143 is SIGTERM from the watchdog, not a test failure. All 54 hx-split-button tests passed before the process was killed.

The feature is complete. Ready to ship.

🔧 Tool: Skill
Input: {
  "skill": "protolabs:ship"
}

🔧 Tool: Bash
Input: {
  "command": "git status --short && git diff --stat HEAD && gh pr list --state open --limit 10"
}

🔧 Tool: Bash
Input: {
  "command": "git branch --show-current"
}

🔧 Tool: Bash
Input: {
  "command": "git add apps/docs/src/content/docs/component-library/hx-split-button.mdx && git status"
}

🔧 Tool: Bash
Input: {
  "command": "git commit -m \"$(cat <<'EOF'\nrefactor: LAUNCH READY: hx-split-button (#617)\n\nComplete Astro docs page with all 12 template sections: overview,\nlive demos (default/variants/sizes/disabled), installation, usage,\nproperties, events, CSS custom properties, CSS parts, slots,\naccessibility (WCAG 2.1 AA, ARIA menu button pattern), Drupal\nintegration, and standalone HTML example.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nEOF\n)\""
}

🔧 Tool: Bash
Input: {
  "command": "git commit -m \"$(cat <<'EOF'\nrefactor: launch ready audit for hx-split-button\n\nComplete Astro docs page with all 12 template sections: overview,\nlive demos (default/variants/sizes/disabled), installation, usage,\nproperties, events, CSS custom properties, CSS parts, slots,\naccessibility (WCAG 2.1 AA, ARIA menu button pattern), Drupal\nintegration, and standalone HTML example.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nEOF\n)\""
}

🔧 Tool: Bash
Input: {
  "command": "git push origin HEAD 2>&1"
}

🔧 Tool: Bash
Input: {
  "command": "tail -20 /Users/himerus/.claude/projects/-Volumes-Development-booked-helix--worktrees-feature-launch-ready-hx-split-button/327be64b-9a74-40e6-b0c4-ab6b29eaed99/tool-results/b1jsjzdqa.txt"
}

🔧 Tool: Bash
Input: {
  "command": "gh pr create --title \"refactor: launch ready audit for hx-split-button\" --body \"$(cat <<'EOF'\n## Summary\n- Complete Astro docs page for `hx-split-button` with all 12 template sections\n- Covers ARIA menu button pattern, WCAG 2.1 AA accessibility, full keyboard navigation docs\n- Includes Drupal integration (Twig + behaviors), standalone HTML example, and API reference\n\n## Test plan\n- [x] 54/54 Vitest tests pass (rendering, variants, keyboard nav, axe-core zero violations)\n- [x] `npm run verify` passes (lint + format:check + type-check — zero errors)\n- [ ] CI passes\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\nEOF\n)\""
}

🔧 Tool: Bash
Input: {
  "command": "gh pr merge --auto --squash 2>&1"
}

🔧 Tool: Bash
Input: {
  "command": "gh pr checks 623 2>&1"
}
Shipped.

- **PR:** https://github.com/bookedsolidtech/helix/pull/623
- **Branch:** `feature/launch-ready-hx-split-button`
- **Commit:** `refactor: launch ready audit for hx-split-button`
- **Auto-merge:** enabled (squash)
- **CI:** 3 checks pending (Detect Changes, Test Node 20/22), CodeRabbit passed