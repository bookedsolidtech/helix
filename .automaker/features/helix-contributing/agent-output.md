Let me check the current state of the CONTRIBUTING.md file.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/helix/CONTRIBUTING.md"
}
The file is complete with all required sections but is at 407 lines — slightly over the 400-line acceptance criterion. Let me trim a few lines to get under 400.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/helix/CONTRIBUTING.md",
  "old_string": "### Storybook Stories\n\nRequired for every component:\n\n- Default story\n- All variants\n- All states (disabled, loading, error, etc.)\n- Interactive controls\n- Accessibility documentation\n\n### Starlight Documentation\n\nRequired for new features:\n\n- Component guide page\n- Usage examples\n- API reference (auto-generated from CEM)\n- Accessibility notes\n- Drupal integration examples",
  "new_string": "### Storybook Stories\n\nRequired for every component: default story, all variants, all states, interactive controls, and accessibility documentation.\n\n### Starlight Documentation\n\nRequired for new features: component guide page, usage examples, API reference (auto-generated from CEM), accessibility notes, and Drupal integration examples."
}
Now verify the line count and run a final diff:

🔧 Tool: Bash
Input: {
  "command": "wc -l /Volumes/Development/helix/CONTRIBUTING.md",
  "description": "Count lines in CONTRIBUTING.md"
}

🔧 Tool: Bash
Input: {
  "command": "git diff --stat CONTRIBUTING.md",
  "description": "Show diff stats for CONTRIBUTING.md"
}
395 lines — under the 400-line limit. Now let me verify the commands referenced in the file are accurate:

🔧 Tool: Bash
Input: {
  "command": "node -e \"const p = require('./package.json'); const scripts = Object.keys(p.scripts); ['dev','build','type-check','lint','test','test:library','test:watch','test:ui','cem'].forEach(s => console.log(s + ':', scripts.includes(s) ? 'OK' : 'MISSING'))\"",
  "description": "Verify all commands referenced in CONTRIBUTING.md exist in package.json"
}
Two commands referenced in the file don't exist. Let me check what test scripts are actually available:

🔧 Tool: Bash
Input: {
  "command": "node -e \"const p = require('./package.json'); Object.keys(p.scripts).filter(s => s.startsWith('test')).forEach(s => console.log(s))\"",
  "description": "List all test-related npm scripts"
}
`test:watch` and `test:ui` don't exist. Fix those references:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/helix/CONTRIBUTING.md",
  "old_string": "```bash\n# Run all tests\nnpm run test\n\n# Run library tests only\nnpm run test:library\n\n# Watch mode\nnpm run test:watch\n\n# With UI\nnpm run test:ui\n```",
  "new_string": "```bash\n# Run all tests\nnpm run test\n\n# Run library tests only\nnpm run test:library\n\n# Visual regression tests\nnpm run test:vrt\n```"
}

🔧 Tool: Bash
Input: {
  "command": "wc -l /Volumes/Development/helix/CONTRIBUTING.md && git diff --stat CONTRIBUTING.md",
  "description": "Verify final line count and diff stats"
}
392 lines. Now verify all commands are accurate:

🔧 Tool: Bash
Input: {
  "command": "node -e \"const p = require('./package.json'); const scripts = Object.keys(p.scripts); ['dev','build','type-check','lint','test','test:library','test:vrt','cem'].forEach(s => console.log(s + ':', scripts.includes(s) ? 'OK' : 'MISSING'))\"",
  "description": "Re-verify all commands referenced in CONTRIBUTING.md"
}
All commands verified. Now run the verification gate — there's no build step for a markdown file, so verify git diff shows only the intended file:

🔧 Tool: Bash
Input: {
  "command": "git diff --name-only",
  "description": "Confirm only CONTRIBUTING.md was changed"
}
Only CONTRIBUTING.md was modified (the other two files were pre-existing changes). The feature is complete.

**Acceptance criteria check:**
- AI Agent Workflow section added (lines 97–124) ✓
- Branch Strategy section added (lines 163–180) ✓
- All commands verified against package.json ✓
- File is 392 lines — under 400 ✓
- Only `CONTRIBUTING.md` modified ✓

Note: Playwright verification is not applicable here — this is a documentation-only change with no runtime behavior to test.

<summary>
## Summary: Update CONTRIBUTING.md for Automaker AI Workflow

### Changes Implemented
- Added **AI Agent Workflow** section explaining how Automaker agents pick up features, what agent PRs look like, how to review them, and an escalate-vs-retry decision table
- Added **Branch Strategy** section documenting the `feature/* → dev → staging → main` three-branch promotion flow with promotion rules
- Updated TOC to include both new sections
- Updated all `main` branch references in Git Workflow to `dev` (rebase instructions, PR target, merge conflict check)
- Trimmed Commit Message Guidelines from ~40 lines to ~15 lines
- Fixed two non-existent commands (`test:watch`, `test:ui`) — replaced with `test:vrt` which actually exists

### Files Modified
- `CONTRIBUTING.md` (63 insertions, 57 deletions — net +6 lines, final: 392 lines)

### Risks/Blockers Encountered
- File was 408 lines after initial edits — trimmed Documentation Requirements section prose to get under 400
- Two commands referenced in the original file (`test:watch`, `test:ui`) did not exist in package.json — corrected to `test:vrt`

### Learnings
- Always verify npm script names against package.json before documenting them
- Markdown-only features don't need Playwright verification

### Verification Status
- Playwright: N/A — documentation-only change, no runtime behavior to test
- All 8 npm commands referenced verified against package.json: `dev`, `build`, `type-check`, `lint`, `test`, `test:library`, `test:vrt`, `cem` — all exist
- `git diff --name-only` confirms only `CONTRIBUTING.md` was modified
</summary>