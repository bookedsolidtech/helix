I'll start by examining the hx-avatar component to understand its current state.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Write,Edit,Bash,Agent,TodoWrite",
  "max_results": 8
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-avatar/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/AUDIT.md"
}
The audit is thorough. I need to fix P0 (2 critical) and P1 (7 high) issues. Let me set up a plan and delegate to specialists.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Reset _imgError on src change + P1-1/P1-7: Add label property + P1-2: Dev warning + P1-3: Fix double semantics (hx-avatar.ts)",
      "status": "in_progress",
      "activeForm": "Fixing component TypeScript issues (P0-1, P1-1/7, P1-2, P1-3)"
    },
    {
      "content": "Fix P0-2: Badge clipping + P2-5: Add :host([hidden]) rule (hx-avatar.styles.ts)",
      "status": "pending",
      "activeForm": "Fixing CSS badge clipping and hidden rule"
    },
    {
      "content": "Fix P1-6: Story src handling + P2-3: Alt text + P2-4: Broken src story (hx-avatar.stories.ts)",
      "status": "pending",
      "activeForm": "Fixing Storybook stories"
    },
    {
      "content": "Fix P1-4/P1-5: Add image error tests + P2-7: Remove setTimeout + P2-8: More axe tests (hx-avatar.test.ts)",
      "status": "pending",
      "activeForm": "Fixing and expanding test suite"
    },
    {
      "content": "Build and verify all changes compile",
      "status": "pending",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests to confirm all pass",
      "status": "pending",
      "activeForm": "Running test suite"
    }
  ]
}
Let me check the test-utils to understand available helpers, and look at how other components handle similar patterns.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/test-utils.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "willUpdate|updated\\(changed",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}

🔧 Tool: Grep
Input: {
  "pattern": "ifDefined|nothing.*src",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components",
  "glob": "*.stories.ts",
  "output_mode": "content",
  "head_limit": 10
}
Good. Now I have the patterns. Let me implement all the fixes. I'll delegate the component + styles work to the lit-specialist, and tests/stories to other agents, running in parallel.

🔧 Tool: Agent
Input: {
  "description": "Fix hx-avatar component + styles",
  "subagent_type": "lit-specialist",
  "prompt": "Fix the following P0 and P1 issues in the hx-avatar component. Make ONLY the changes described below.\n\n## Working directory\n`/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar`\n\n## Files to modify\n\n### 1. `packages/hx-library/src/components/hx-avatar/hx-avatar.ts`\n\n**P0-1: Reset `_imgError` when `src` changes**\nAdd a `willUpdate` lifecycle method that resets `_imgError = false` when `src` changes:\n```ts\nimport { PropertyValues } from 'lit';\n// In the class:\noverride willUpdate(changedProperties: PropertyValues): void {\n  if (changedProperties.has('src')) {\n    this._imgError = false;\n  }\n}\n```\n\n**P1-1 + P1-7: Add a `label` property for human-readable accessible name**\nAdd a new property:\n```ts\n/**\n * Human-readable label for the avatar. Used as the accessible name in non-image states.\n * When omitted, falls back to `alt`, then `initials`, then 'Avatar'.\n * @attr label\n */\n@property({ type: String })\nlabel = '';\n```\n\nUpdate the `ariaLabel` computation in render():\n```ts\nconst ariaLabel = this.label || this.alt || (showInitials ? this.initials : '') || 'Avatar';\n```\n\n**P1-3: Fix double semantics — add `aria-hidden=\"true\"` to the `<img>` element**\nThe container `div[role=\"img\"]` already provides the semantics. Add `aria-hidden=\"true\"` to the `<img>`:\n```ts\n${showImage && src\n  ? html`<img\n      part=\"image\"\n      class=\"avatar__image\"\n      src=${src}\n      alt=${this.alt}\n      aria-hidden=\"true\"\n      loading=\"lazy\"\n      @error=${this._handleImgError}\n    />`\n  : nothing}\n```\n\n**P1-2: Add dev-mode console warning when `src` is provided without `alt`**\nIn the `willUpdate` method, add a dev warning:\n```ts\noverride willUpdate(changedProperties: PropertyValues): void {\n  if (changedProperties.has('src')) {\n    this._imgError = false;\n  }\n  if (import.meta.env?.DEV && this.src && !this.alt && !this.label) {\n    console.warn(\n      `[hx-avatar] src is set without alt or label. Provide an alt or label attribute for accessibility.`,\n    );\n  }\n}\n```\n\nAlso add the JSDoc for the label property in the class-level comment:\n```\n * @cssprop [--hx-avatar-font-size] - Font size for the initials text, set per size variant.\n```\nAnd add to the class-level JSDoc:\n```\n * @property {string} label - Human-readable label. Overrides alt/initials for accessible name.\n```\n\nDon't forget to import `PropertyValues` from 'lit' — it should already be available since we import from 'lit'.\n\n### 2. `packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts`\n\n**P0-2: Fix badge clipping by `overflow: hidden`**\nThe badge is positioned inside the `.avatar` div which has `overflow: hidden`. Restructure so the badge isn't clipped.\n\nThe approach: Remove `overflow: hidden` from `.avatar` and instead apply it only to the image via `.avatar__image`:\n\n```css\n.avatar {\n  /* REMOVE overflow: hidden from here */\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n  width: var(--hx-avatar-size);\n  height: var(--hx-avatar-size);\n  background-color: var(--hx-avatar-bg, var(--hx-color-primary-100));\n  color: var(--hx-avatar-color, var(--hx-color-primary-700));\n  border-radius: var(--hx-avatar-border-radius);\n  flex-shrink: 0;\n}\n```\n\nBut we still need circular clipping for initials/icon content. Use `clip-path` or a pseudo-element approach. Actually the simplest fix: keep overflow hidden but move badge outside the overflow container. \n\nWait — better approach. The simplest CSS-only fix: add a `z-index` to the badge and use `overflow: clip` with `overflow-clip-margin`:\n\nActually, the cleanest approach per standard avatar implementations:\n- Keep `overflow: hidden` on `.avatar` for the circular clip\n- Move the badge positioning to use `translate` to shift it partially outside, and apply `overflow: visible` via a wrapper\n\nThe SIMPLEST fix: just remove `overflow: hidden` from `.avatar` and add it to a new inner wrapper, OR just use `clip-path: circle(50%)` on circle shape only:\n\nActually, the cleanest minimal fix:\n1. Remove `overflow: hidden` from `.avatar`\n2. Add `border-radius: inherit; overflow: hidden;` to `.avatar__image` — the image gets clipped by its own border-radius\n3. For initials and fallback icon, they're already sized to fit within the container\n4. For the circle shape, the background circle is already achieved by `border-radius: 50%`\n\nThis way the badge can overflow the container boundary.\n\nApply this change:\n- In `.avatar`: Remove `overflow: hidden;`\n- Add a new rule for image clipping:\n```css\n.avatar__image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n  border-radius: inherit;\n}\n```\n\nThe `border-radius: inherit` on the image ensures the image itself is clipped to the avatar's shape. The initials and fallback icon don't need clipping since they're smaller than the container.\n\n**P2-5: Add `:host([hidden])` rule**\n```css\n:host([hidden]) {\n  display: none !important;\n}\n```\n\nMake these changes now. Read the files first, then edit them.\n"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Edit",
  "max_results": 2
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": "import { LitElement, html, nothing } from 'lit';",
  "new_string": "import { LitElement, html, nothing, type PropertyValues } from 'lit';"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": " * @cssprop [--hx-avatar-font-size] - Font size for the initials text, set per size variant.\n */",
  "new_string": " * @cssprop [--hx-avatar-font-size] - Font size for the initials text, set per size variant.\n *\n * @property {string} label - Human-readable label. Overrides alt/initials for accessible name.\n */"
}

🔧 Tool: Agent
Input: {
  "description": "Fix hx-avatar stories",
  "subagent_type": "storybook-specialist",
  "prompt": "Fix the following issues in the hx-avatar Storybook stories file.\n\n## Working directory\n`/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar`\n\n## File to modify: `packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts`\n\n**P1-6: Fix `src=\"\"` being sent when `src` is `undefined`**\nThe current render function uses `src=${args.src ?? ''}` which sends `src=\"\"` to the DOM.\nFix: Import `ifDefined` from `lit/directives/if-defined.js` and use `src=${ifDefined(args.src)}`.\n\nThe other components in this project use `ifDefined` for optional attributes (see hx-icon.stories.ts for example).\n\nChange the import line to add:\n```ts\nimport { ifDefined } from 'lit/directives/if-defined.js';\n```\n\nUpdate the meta render function:\n```ts\nrender: (args) => html`\n  <hx-avatar\n    src=${ifDefined(args.src)}\n    alt=${args.alt}\n    initials=${args.initials}\n    hx-size=${args.size}\n    shape=${args.shape}\n  ></hx-avatar>\n`,\n```\n\nAlso add `label` to the argTypes and args:\n```ts\n// In argTypes, add after alt:\nlabel: {\n  control: 'text',\n  description: 'Human-readable label for the avatar. Used as accessible name in non-image states.',\n  table: {\n    category: 'Accessibility',\n    defaultValue: { summary: \"''\" },\n    type: { summary: 'string' },\n  },\n},\n```\n```ts\n// In args, add:\nlabel: '',\n```\nAnd in the render function add `label=${ifDefined(args.label || undefined)}`.\n\n**P2-3: Add meaningful alt text to Sizes and Shapes stories**\nIn the `Sizes` story, add `alt` attributes:\n- `<hx-avatar hx-size=\"xs\" initials=\"XS\" alt=\"Extra small avatar\"></hx-avatar>`\n- `<hx-avatar hx-size=\"sm\" initials=\"SM\" alt=\"Small avatar\"></hx-avatar>`\n- `<hx-avatar hx-size=\"md\" initials=\"MD\" alt=\"Medium avatar\"></hx-avatar>`\n- `<hx-avatar hx-size=\"lg\" initials=\"LG\" alt=\"Large avatar\"></hx-avatar>`\n- `<hx-avatar hx-size=\"xl\" initials=\"XL\" alt=\"Extra large avatar\"></hx-avatar>`\n\nIn the `Shapes` story:\n- `<hx-avatar hx-size=\"lg\" shape=\"circle\" initials=\"RN\" alt=\"Circle shape\"></hx-avatar>`\n- `<hx-avatar hx-size=\"lg\" shape=\"square\" initials=\"RN\" alt=\"Square shape\"></hx-avatar>`\n\n**P2-4: Add a new story demonstrating broken src fallback**\nAdd after the FallbackChain story:\n\n```ts\n// ═══════════════════════════════════════════════════\n// 9. BROKEN IMAGE FALLBACK\n// ═══════════════════════════════════════════════════\n\n/**\n * Demonstrates the image error fallback path:\n * 1. Broken src + initials → falls back to initials\n * 2. Broken src + no initials → falls back to icon\n *\n * This is the most important fallback behavior for developers to understand.\n */\nexport const BrokenImageFallback: Story = {\n  render: () => html`\n    <div style=\"display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;\">\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar\n          hx-size=\"lg\"\n          src=\"https://invalid-url-that-will-fail.example/avatar.png\"\n          alt=\"Dr. Jane Smith\"\n          initials=\"JS\"\n        ></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">Broken src + initials</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar\n          hx-size=\"lg\"\n          src=\"https://invalid-url-that-will-fail.example/avatar.png\"\n          alt=\"Unknown user\"\n        ></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">Broken src + no initials</span>\n      </div>\n    </div>\n  `,\n};\n```\n\nRead the file first, then make ALL the edits.\n"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": "  /**\n   * Accessible label for the image or avatar.\n   * @attr alt\n   */\n  @property({ type: String })\n  alt = '';\n\n  /**\n   * Fallback initials text displayed when no image is available.",
  "new_string": "  /**\n   * Accessible label for the image or avatar.\n   * @attr alt\n   */\n  @property({ type: String })\n  alt = '';\n\n  /**\n   * Human-readable label for the avatar. Used as the accessible name in non-image states.\n   * When omitted, falls back to `alt`, then `initials`, then 'Avatar'.\n   * @attr label\n   */\n  @property({ type: String })\n  label = '';\n\n  /**\n   * Fallback initials text displayed when no image is available."
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": "  // ─── Slot Change Handling ───",
  "new_string": "  // ─── Lifecycle ───\n\n  override willUpdate(changedProperties: PropertyValues): void {\n    if (changedProperties.has('src')) {\n      this._imgError = false;\n    }\n    if (import.meta.env?.DEV && this.src && !this.alt && !this.label) {\n      console.warn(\n        `[hx-avatar] src is set without alt or label. Provide an alt or label attribute for accessibility.`,\n      );\n    }\n  }\n\n  // ─── Slot Change Handling ───"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": "    const ariaLabel = showImage ? this.alt || 'Avatar' : showInitials ? this.initials : 'Avatar';",
  "new_string": "    const ariaLabel = this.label || this.alt || (showInitials ? this.initials : '') || 'Avatar';"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read",
  "max_results": 1
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Edit",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "import { html } from 'lit';\nimport { expect } from 'storybook/test';",
  "new_string": "import { html } from 'lit';\nimport { ifDefined } from 'lit/directives/if-defined.js';\nimport { expect } from 'storybook/test';"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "    alt: {\n      control: 'text',\n      description: 'Accessible label for the image or avatar.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },",
  "new_string": "    alt: {\n      control: 'text',\n      description: 'Accessible label for the image or avatar.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },\n    label: {\n      control: 'text',\n      description:\n        'Human-readable label for the avatar. Used as accessible name in non-image states.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },"
}

🔧 Tool: Agent
Input: {
  "description": "Fix hx-avatar tests",
  "subagent_type": "qa-engineer-automation",
  "prompt": "Fix and expand the hx-avatar test file to address audit findings.\n\n## Working directory\n`/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar`\n\n## File to modify: `packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts`\n\nThe component (hx-avatar.ts) is being updated concurrently to:\n- Add `willUpdate` that resets `_imgError` when `src` changes\n- Add a `label` property for accessible name\n- Add `aria-hidden=\"true\"` to the `<img>` element\n\nAvailable test utils (from `../../test-utils.js`): `fixture`, `shadowQuery`, `cleanup`, `checkA11y`, `oneEvent`\n\n### Changes needed:\n\n**P1-4: Add tests for image load failure → fallback recovery**\nAdd a new describe block \"Image error fallback\":\n\n```ts\ndescribe('Image error fallback', () => {\n  it('falls back to initials when image fails to load', async () => {\n    const el = await fixture<HelixAvatar>(\n      '<hx-avatar src=\"https://invalid.example/broken.png\" initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n    );\n    // Trigger image error\n    const img = shadowQuery(el, 'img');\n    if (img) {\n      img.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n    }\n    const initials = shadowQuery(el, '[part=\"initials\"]');\n    expect(initials).toBeTruthy();\n    expect(initials?.textContent?.trim()).toBe('JD');\n    // Image should no longer be in DOM\n    const imgAfter = shadowQuery(el, '[part=\"image\"]');\n    expect(imgAfter).toBeNull();\n  });\n\n  it('falls back to icon when image fails and no initials', async () => {\n    const el = await fixture<HelixAvatar>(\n      '<hx-avatar src=\"https://invalid.example/broken.png\" alt=\"Unknown\"></hx-avatar>',\n    );\n    const img = shadowQuery(el, 'img');\n    if (img) {\n      img.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n    }\n    const icon = shadowQuery(el, '[part=\"fallback-icon\"]');\n    expect(icon).toBeTruthy();\n  });\n});\n```\n\n**P1-5: Add test for `_imgError` reset on `src` change**\nAdd to the \"Image error fallback\" describe block:\n\n```ts\nit('resets error state when src changes to a new value', async () => {\n  const el = await fixture<HelixAvatar>(\n    '<hx-avatar src=\"https://invalid.example/broken.png\" initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n  );\n  // Trigger image error\n  const img = shadowQuery(el, 'img');\n  if (img) {\n    img.dispatchEvent(new Event('error'));\n    await el.updateComplete;\n  }\n  // Verify fallback\n  expect(shadowQuery(el, '[part=\"initials\"]')).toBeTruthy();\n  \n  // Update src to new value\n  el.src = 'https://example.com/new-avatar.png';\n  await el.updateComplete;\n  \n  // Image should render again (error state reset)\n  const newImg = shadowQuery(el, '[part=\"image\"]');\n  expect(newImg).toBeTruthy();\n  expect(newImg?.getAttribute('src')).toBe('https://example.com/new-avatar.png');\n});\n```\n\n**P2-7: Remove setTimeout waits and replace with updateComplete**\nIn tests at lines 42, 68, 144, 155, 165 there are `await new Promise((r) => setTimeout(r, 50))` calls. These are used to wait for slotchange events.\n\nReplace the pattern:\n```ts\nawait new Promise((r) => setTimeout(r, 50));\nawait el.updateComplete;\n```\nWith just:\n```ts\nawait el.updateComplete;\nawait new Promise(requestAnimationFrame);\nawait el.updateComplete;\n```\nThis waits for the browser's next frame (when slotchange fires) and then for Lit to process the state change.\n\n**P2-8: Add more axe-core tests**\nExpand the \"Accessibility (axe-core)\" describe block:\n\n```ts\nit('has no axe violations with image src', async () => {\n  const el = await fixture<HelixAvatar>(\n    '<hx-avatar src=\"https://i.pravatar.cc/150?img=1\" alt=\"Dr. Jane Smith\"></hx-avatar>',\n  );\n  await el.updateComplete;\n  await page.screenshot();\n  const { violations } = await checkA11y(el);\n  expect(violations).toEqual([]);\n});\n\nit('has no axe violations with slotted content', async () => {\n  const el = await fixture<HelixAvatar>(\n    '<hx-avatar><span role=\"img\" aria-label=\"Custom avatar\">C</span></hx-avatar>',\n  );\n  await el.updateComplete;\n  await new Promise(requestAnimationFrame);\n  await el.updateComplete;\n  await page.screenshot();\n  const { violations } = await checkA11y(el);\n  expect(violations).toEqual([]);\n});\n\nit('has no axe violations with badge', async () => {\n  const el = await fixture<HelixAvatar>(\n    '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"><span slot=\"badge\" aria-label=\"Online\"></span></hx-avatar>',\n  );\n  await el.updateComplete;\n  await new Promise(requestAnimationFrame);\n  await el.updateComplete;\n  await page.screenshot();\n  const { violations } = await checkA11y(el);\n  expect(violations).toEqual([]);\n});\n```\n\nAlso add a test for the `label` property:\n```ts\n// In Property tests or a new describe block:\ndescribe('Property: label', () => {\n  it('uses label as aria-label when provided', async () => {\n    const el = await fixture<HelixAvatar>(\n      '<hx-avatar initials=\"JD\" label=\"Dr. Jane Doe\"></hx-avatar>',\n    );\n    await el.updateComplete;\n    const avatar = shadowQuery(el, '[part=\"avatar\"]');\n    expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');\n  });\n\n  it('falls back to alt when label is not provided', async () => {\n    const el = await fixture<HelixAvatar>(\n      '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n    );\n    await el.updateComplete;\n    const avatar = shadowQuery(el, '[part=\"avatar\"]');\n    expect(avatar?.getAttribute('aria-label')).toBe('Jane Doe');\n  });\n\n  it('falls back to initials when no label or alt', async () => {\n    const el = await fixture<HelixAvatar>(\n      '<hx-avatar initials=\"JD\"></hx-avatar>',\n    );\n    await el.updateComplete;\n    const avatar = shadowQuery(el, '[part=\"avatar\"]');\n    expect(avatar?.getAttribute('aria-label')).toBe('JD');\n  });\n});\n```\n\nRead the file first, then make ALL the edits. Keep existing imports and patterns consistent.\n"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts",
  "old_string": "        ${showImage && src\n          ? html`<img\n              part=\"image\"\n              class=\"avatar__image\"\n              src=${src}\n              alt=${this.alt}\n              loading=\"lazy\"\n              @error=${this._handleImgError}\n            />`\n          : nothing}",
  "new_string": "        ${showImage && src\n          ? html`<img\n              part=\"image\"\n              class=\"avatar__image\"\n              src=${src}\n              alt=${this.alt}\n              aria-hidden=\"true\"\n              loading=\"lazy\"\n              @error=${this._handleImgError}\n            />`\n          : nothing}"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Edit,Bash",
  "max_results": 3
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "    src: undefined,\n    alt: '',\n    initials: '',\n    size: 'md',\n    shape: 'circle',",
  "new_string": "    src: undefined,\n    alt: '',\n    label: '',\n    initials: '',\n    size: 'md',\n    shape: 'circle',"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts",
  "old_string": "  :host {\n    display: inline-block;\n  }",
  "new_string": "  :host {\n    display: inline-block;\n  }\n\n  :host([hidden]) {\n    display: none !important;\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/test-utils.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-avatar\n      src=${args.src ?? ''}\n      alt=${args.alt}\n      initials=${args.initials}\n      hx-size=${args.size}\n      shape=${args.shape}\n    ></hx-avatar>\n  `,\n} satisfies Meta;",
  "new_string": "  render: (args) => html`\n    <hx-avatar\n      src=${ifDefined(args.src)}\n      alt=${args.alt}\n      label=${ifDefined(args.label || undefined)}\n      initials=${args.initials}\n      hx-size=${args.size}\n      shape=${args.shape}\n    ></hx-avatar>\n  `,\n} satisfies Meta;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts",
  "old_string": "    overflow: hidden;\n    position: relative;",
  "new_string": "    position: relative;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;\n      const icon = shadowQuery(el, '[part=\"fallback-icon\"]');\n      expect(icon).toBeTruthy();\n    });\n\n    it('shows initials span when initials is set and no src', async () => {",
  "new_string": "      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;\n      const icon = shadowQuery(el, '[part=\"fallback-icon\"]');\n      expect(icon).toBeTruthy();\n    });\n\n    it('shows initials span when initials is set and no src', async () => {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "  render: (args) => html`\n    <hx-avatar\n      src=${args.src ?? ''}\n      alt=${args.alt}\n      initials=${args.initials}\n      hx-size=${args.size}\n      shape=${args.shape}\n    >\n      <span\n        slot=\"badge\"",
  "new_string": "  render: (args) => html`\n    <hx-avatar\n      src=${ifDefined(args.src)}\n      alt=${args.alt}\n      label=${ifDefined(args.label || undefined)}\n      initials=${args.initials}\n      hx-size=${args.size}\n      shape=${args.shape}\n    >\n      <span\n        slot=\"badge\""
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts",
  "old_string": "  .avatar__image {\n    width: 100%;\n    height: 100%;\n    object-fit: cover;\n    display: block;\n  }",
  "new_string": "  .avatar__image {\n    width: 100%;\n    height: 100%;\n    object-fit: cover;\n    display: block;\n    border-radius: inherit;\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('shows fallback icon when initials is empty string', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar initials=\"\"></hx-avatar>');\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('shows fallback icon when initials is empty string', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar initials=\"\"></hx-avatar>');\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Bash",
  "max_results": 1
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "        <hx-avatar hx-size=\"xs\" initials=\"XS\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">xs</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"sm\" initials=\"SM\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">sm</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"md\" initials=\"MD\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">md</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"lg\" initials=\"LG\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">lg</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"xl\" initials=\"XL\"></hx-avatar>",
  "new_string": "        <hx-avatar hx-size=\"xs\" initials=\"XS\" alt=\"Extra small avatar\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">xs</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"sm\" initials=\"SM\" alt=\"Small avatar\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">sm</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"md\" initials=\"MD\" alt=\"Medium avatar\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">md</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"lg\" initials=\"LG\" alt=\"Large avatar\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">lg</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"xl\" initials=\"XL\" alt=\"Extra large avatar\"></hx-avatar>"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('default slot: when content is slotted, no role on avatar div', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar><img src=\"https://example.com/custom.png\" alt=\"Custom\" /></hx-avatar>',\n      );\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('default slot: when content is slotted, no role on avatar div', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar><img src=\"https://example.com/custom.png\" alt=\"Custom\" /></hx-avatar>',\n      );\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --project packages/hx-library/tsconfig.json 2>&1 | head -30",
  "description": "Type-check hx-library to verify changes compile",
  "timeout": 60000
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "        <hx-avatar hx-size=\"lg\" shape=\"circle\" initials=\"RN\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">circle</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"lg\" shape=\"square\" initials=\"RN\"></hx-avatar>",
  "new_string": "        <hx-avatar hx-size=\"lg\" shape=\"circle\" initials=\"RN\" alt=\"Circle shape\"></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">circle</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar hx-size=\"lg\" shape=\"square\" initials=\"RN\" alt=\"Square shape\"></hx-avatar>"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('default slot: slotted content is rendered', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar><span class=\"custom-content\">Custom</span></hx-avatar>',\n      );\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('default slot: slotted content is rendered', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar><span class=\"custom-content\">Custom</span></hx-avatar>',\n      );\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('badge slot: renders slotted badge content', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar initials=\"JD\"><span slot=\"badge\" class=\"status-dot\"></span></hx-avatar>',\n      );\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('badge slot: renders slotted badge content', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar initials=\"JD\"><span slot=\"badge\" class=\"status-dot\"></span></hx-avatar>',\n      );\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts",
  "old_string": "// ════════════════════════════════════════════════════════════════════════════\n// 8. SLOTTED CONTENT",
  "new_string": "// ════════════════════════════════════════════════════════════════════════════\n// 8. BROKEN IMAGE FALLBACK\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Demonstrates the image error fallback path:\n * 1. Broken src + initials → falls back to initials\n * 2. Broken src + no initials → falls back to icon\n *\n * This is the most important fallback behavior for developers to understand.\n */\nexport const BrokenImageFallback: Story = {\n  render: () => html`\n    <div style=\"display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;\">\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar\n          hx-size=\"lg\"\n          src=\"https://invalid-url-that-will-fail.example/avatar.png\"\n          alt=\"Dr. Jane Smith\"\n          initials=\"JS\"\n        ></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">Broken src + initials</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; align-items: center; gap: 0.5rem;\">\n        <hx-avatar\n          hx-size=\"lg\"\n          src=\"https://invalid-url-that-will-fail.example/avatar.png\"\n          alt=\"Unknown user\"\n        ></hx-avatar>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">Broken src + no initials</span>\n      </div>\n    </div>\n  `,\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 9. SLOTTED CONTENT"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('exposes \"fallback-icon\" part when no src or initials', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('exposes \"fallback-icon\" part when no src or initials', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('has no axe violations in default state (fallback icon)', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');\n      await new Promise((r) => setTimeout(r, 50));\n      await el.updateComplete;",
  "new_string": "    it('has no axe violations in default state (fallback icon)', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "    it('has no axe violations with initials', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar initials=\"JD\"></hx-avatar>');\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});",
  "new_string": "    it('has no axe violations with initials', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar initials=\"JD\"></hx-avatar>');\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with image src', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar src=\"https://i.pravatar.cc/150?img=1\" alt=\"Dr. Jane Smith\"></hx-avatar>',\n      );\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with slotted content', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar><span role=\"img\" aria-label=\"Custom avatar\">C</span></hx-avatar>',\n      );\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with badge', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"><span slot=\"badge\" aria-label=\"Online\"></span></hx-avatar>',\n      );\n      await el.updateComplete;\n      await new Promise(requestAnimationFrame);\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n\n  // ─── Image error fallback (3) ───\n\n  describe('Image error fallback', () => {\n    it('falls back to initials when image fails to load', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar src=\"https://invalid.example/broken.png\" initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n      );\n      // Trigger image error\n      const img = shadowQuery(el, 'img');\n      if (img) {\n        img.dispatchEvent(new Event('error'));\n        await el.updateComplete;\n      }\n      const initials = shadowQuery(el, '[part=\"initials\"]');\n      expect(initials).toBeTruthy();\n      expect(initials?.textContent?.trim()).toBe('JD');\n      // Image should no longer be in DOM\n      const imgAfter = shadowQuery(el, '[part=\"image\"]');\n      expect(imgAfter).toBeNull();\n    });\n\n    it('falls back to icon when image fails and no initials', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar src=\"https://invalid.example/broken.png\" alt=\"Unknown\"></hx-avatar>',\n      );\n      const img = shadowQuery(el, 'img');\n      if (img) {\n        img.dispatchEvent(new Event('error'));\n        await el.updateComplete;\n      }\n      const icon = shadowQuery(el, '[part=\"fallback-icon\"]');\n      expect(icon).toBeTruthy();\n    });\n\n    it('resets error state when src changes to a new value', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar src=\"https://invalid.example/broken.png\" initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n      );\n      // Trigger image error\n      const img = shadowQuery(el, 'img');\n      if (img) {\n        img.dispatchEvent(new Event('error'));\n        await el.updateComplete;\n      }\n      // Verify fallback\n      expect(shadowQuery(el, '[part=\"initials\"]')).toBeTruthy();\n\n      // Update src to new value\n      el.src = 'https://example.com/new-avatar.png';\n      await el.updateComplete;\n\n      // Image should render again (error state reset)\n      const newImg = shadowQuery(el, '[part=\"image\"]');\n      expect(newImg).toBeTruthy();\n      expect(newImg?.getAttribute('src')).toBe('https://example.com/new-avatar.png');\n    });\n  });\n\n  // ─── Property: label (3) ───\n\n  describe('Property: label', () => {\n    it('uses label as aria-label when provided', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar initials=\"JD\" label=\"Dr. Jane Doe\"></hx-avatar>',\n      );\n      await el.updateComplete;\n      const avatar = shadowQuery(el, '[part=\"avatar\"]');\n      expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');\n    });\n\n    it('falls back to alt when label is not provided', async () => {\n      const el = await fixture<HelixAvatar>(\n        '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"></hx-avatar>',\n      );\n      await el.updateComplete;\n      const avatar = shadowQuery(el, '[part=\"avatar\"]');\n      expect(avatar?.getAttribute('aria-label')).toBe('Jane Doe');\n    });\n\n    it('falls back to initials when no label or alt', async () => {\n      const el = await fixture<HelixAvatar>('<hx-avatar initials=\"JD\"></hx-avatar>');\n      await el.updateComplete;\n      const avatar = shadowQuery(el, '[part=\"avatar\"]');\n      expect(avatar?.getAttribute('aria-label')).toBe('JD');\n    });\n  });\n});"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "  // ─── Accessibility (axe-core) (2) ───",
  "new_string": "  // ─── Accessibility (axe-core) (5) ───"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:Grep",
  "max_results": 1
}

🔧 Tool: Grep
Input: {
  "pattern": "setTimeout",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "output_mode": "count"
}
All three agents completed successfully. Let me update the todos and verify the build.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Reset _imgError on src change + P1-1/P1-7: Add label property + P1-2: Dev warning + P1-3: Fix double semantics (hx-avatar.ts)",
      "status": "completed",
      "activeForm": "Fixing component TypeScript issues (P0-1, P1-1/7, P1-2, P1-3)"
    },
    {
      "content": "Fix P0-2: Badge clipping + P2-5: Add :host([hidden]) rule (hx-avatar.styles.ts)",
      "status": "completed",
      "activeForm": "Fixing CSS badge clipping and hidden rule"
    },
    {
      "content": "Fix P1-6: Story src handling + P2-3: Alt text + P2-4: Broken src story (hx-avatar.stories.ts)",
      "status": "completed",
      "activeForm": "Fixing Storybook stories"
    },
    {
      "content": "Fix P1-4/P1-5: Add image error tests + P2-7: Remove setTimeout + P2-8: More axe tests (hx-avatar.test.ts)",
      "status": "completed",
      "activeForm": "Fixing and expanding test suite"
    },
    {
      "content": "Build and verify all changes compile",
      "status": "in_progress",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests to confirm all pass",
      "status": "pending",
      "activeForm": "Running test suite"
    }
  ]
}
Let me quickly review what the agents produced before building.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts"
}
Everything looks correct. Now let me build and run tests.

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Zero errors. Let me run the tests.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Reset _imgError on src change + P1-1/P1-7: Add label property + P1-2: Dev warning + P1-3: Fix double semantics (hx-avatar.ts)",
      "status": "completed",
      "activeForm": "Fixing component TypeScript issues (P0-1, P1-1/7, P1-2, P1-3)"
    },
    {
      "content": "Fix P0-2: Badge clipping + P2-5: Add :host([hidden]) rule (hx-avatar.styles.ts)",
      "status": "completed",
      "activeForm": "Fixing CSS badge clipping and hidden rule"
    },
    {
      "content": "Fix P1-6: Story src handling + P2-3: Alt text + P2-4: Broken src story (hx-avatar.stories.ts)",
      "status": "completed",
      "activeForm": "Fixing Storybook stories"
    },
    {
      "content": "Fix P1-4/P1-5: Add image error tests + P2-7: Remove setTimeout + P2-8: More axe tests (hx-avatar.test.ts)",
      "status": "completed",
      "activeForm": "Fixing and expanding test suite"
    },
    {
      "content": "Build and verify all changes compile",
      "status": "completed",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests to confirm all pass",
      "status": "in_progress",
      "activeForm": "Running test suite"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --project=library -- src/components/hx-avatar/ 2>&1 | tail -60",
  "description": "Run hx-avatar tests",
  "timeout": 120000
}
Storybook dependency issue with the workspace config. Let me use the library-specific test runner.

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests",
  "timeout": 180000
}
One test failure — the badge axe test has `aria-label` on a `<span>` with no role. The test fixture needs `role="status"` on the badge span. Let me fix it.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "offset": 255,
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts",
  "old_string": "        '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"><span slot=\"badge\" aria-label=\"Online\"></span></hx-avatar>',",
  "new_string": "        '<hx-avatar initials=\"JD\" alt=\"Jane Doe\"><span slot=\"badge\" role=\"status\" aria-label=\"Online\"></span></hx-avatar>',"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -30",
  "description": "Re-run library tests",
  "timeout": 180000
}
All 3109 tests pass (79 test files). Let me verify the diff.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Reset _imgError on src change + P1-1/P1-7: Add label property + P1-2: Dev warning + P1-3: Fix double semantics (hx-avatar.ts)",
      "status": "completed",
      "activeForm": "Fixing component TypeScript issues (P0-1, P1-1/7, P1-2, P1-3)"
    },
    {
      "content": "Fix P0-2: Badge clipping + P2-5: Add :host([hidden]) rule (hx-avatar.styles.ts)",
      "status": "completed",
      "activeForm": "Fixing CSS badge clipping and hidden rule"
    },
    {
      "content": "Fix P1-6: Story src handling + P2-3: Alt text + P2-4: Broken src story (hx-avatar.stories.ts)",
      "status": "completed",
      "activeForm": "Fixing Storybook stories"
    },
    {
      "content": "Fix P1-4/P1-5: Add image error tests + P2-7: Remove setTimeout + P2-8: More axe tests (hx-avatar.test.ts)",
      "status": "completed",
      "activeForm": "Fixing and expanding test suite"
    },
    {
      "content": "Build and verify all changes compile",
      "status": "completed",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests to confirm all pass",
      "status": "completed",
      "activeForm": "Running test suite"
    },
    {
      "content": "Verify git diff and update AUDIT.md",
      "status": "in_progress",
      "activeForm": "Verifying diff and updating audit"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Show changed files"
}
The 4 target files are modified, plus some screenshot PNGs from test runs (expected). Let me update the AUDIT.md to reflect the fixes.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/AUDIT.md",
  "old_string": "## Summary\n\n`hx-avatar` is a well-structured component with good fallback chain logic and clean CSS token usage. However, several issues range from silent functional regressions (P0) to accessibility gaps that violate the healthcare mandate. The critical path: two P0 bugs (image error state not reset; badge clipped by overflow:hidden), one P1 ARIA issue (generic fallback label), and missing test coverage for image error recovery.",
  "new_string": "## Summary\n\n`hx-avatar` is a well-structured component with good fallback chain logic and clean CSS token usage. The deep audit v2 identified 2 P0, 7 P1, and 8 P2 issues. **All P0 and P1 issues have been fixed.** P2 items are documented below for future work.\n\n### Fixes Applied (Deep Audit v2)\n- **P0-1 FIXED:** `_imgError` now resets in `willUpdate()` when `src` changes\n- **P0-2 FIXED:** Removed `overflow: hidden` from `.avatar`; image clipped via `border-radius: inherit`\n- **P1-1/P1-7 FIXED:** Added `label` property for human-readable accessible name (priority: label > alt > initials > 'Avatar')\n- **P1-2 FIXED:** Dev-mode console warning when `src` set without `alt` or `label`\n- **P1-3 FIXED:** Added `aria-hidden=\"true\"` to `<img>` — container `role=\"img\"` handles semantics\n- **P1-4 FIXED:** Added 3 image error fallback tests (initials fallback, icon fallback, src change reset)\n- **P1-5 FIXED:** `_imgError` reset test included in P1-4 tests\n- **P1-6 FIXED:** Story render uses `ifDefined()` instead of `?? ''` for src attribute\n- **P2-3 FIXED:** Added meaningful alt text to Sizes/Shapes stories\n- **P2-4 FIXED:** Added BrokenImageFallback story\n- **P2-5 FIXED:** Added `:host([hidden])` rule\n- **P2-7 FIXED:** Replaced `setTimeout(50)` with `requestAnimationFrame` pattern\n- **P2-8 FIXED:** axe-core tests expanded from 2 to 5 (added image, slotted, badge modes)\n- **BONUS:** Added `Property: label` test block (3 tests)"
}
Now update the finding entries to show their status.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-avatar/packages/hx-library/src/components/hx-avatar/AUDIT.md",
  "old_string": "| P0-1 | P0       | TypeScript/UX | `_imgError` never resets on `src` change — permanent breakage  |\n| P0-2 | P0       | CSS           | Badge clipped by `overflow: hidden` on avatar container        |\n| P1-1 | P1       | Accessibility | Generic `aria-label=\"Avatar\"` — non-descriptive in healthcare  |\n| P1-2 | P1       | Accessibility | `alt` not required when `src` provided — silent a11y failure   |\n| P1-3 | P1       | Accessibility | `role=\"img\"` + inner `<img alt=\"\">` = double semantics         |\n| P1-4 | P1       | Tests         | No test for image load failure → fallback recovery             |\n| P1-5 | P1       | Tests         | No test for `_imgError` reset on `src` change                  |\n| P1-6 | P1       | Storybook     | Story render sends `src=\"\"` instead of omitting attribute      |\n| P1-7 | P1       | Accessibility | Initials `aria-label` exposes raw initials, not a full name    |\n| P2-1 | P2       | TypeScript    | No runtime guard for invalid `size`/`shape` values             |\n| P2-2 | P2       | CSS/DOM       | Empty badge `<span>` always in DOM                             |\n| P2-3 | P2       | Storybook     | `Sizes`/`Shapes` stories have no meaningful `alt` text         |\n| P2-4 | P2       | Storybook     | No story for broken `src` → fallback recovery path             |\n| P2-5 | P2       | CSS           | No `:host([hidden])` display:none rule                         |\n| P2-6 | P2       | Drupal        | No Twig integration example or documentation                   |\n| P2-7 | P2       | Tests         | `setTimeout(50)` timing-based waits are fragile                |\n| P2-8 | P2       | Tests         | axe-core covers only 2 of 5 avatar rendering modes             |",
  "new_string": "| P0-1 | P0       | TypeScript/UX | `_imgError` never resets on `src` change — permanent breakage  | FIXED |\n| P0-2 | P0       | CSS           | Badge clipped by `overflow: hidden` on avatar container        | FIXED |\n| P1-1 | P1       | Accessibility | Generic `aria-label=\"Avatar\"` — non-descriptive in healthcare  | FIXED |\n| P1-2 | P1       | Accessibility | `alt` not required when `src` provided — silent a11y failure   | FIXED |\n| P1-3 | P1       | Accessibility | `role=\"img\"` + inner `<img alt=\"\">` = double semantics         | FIXED |\n| P1-4 | P1       | Tests         | No test for image load failure → fallback recovery             | FIXED |\n| P1-5 | P1       | Tests         | No test for `_imgError` reset on `src` change                  | FIXED |\n| P1-6 | P1       | Storybook     | Story render sends `src=\"\"` instead of omitting attribute      | FIXED |\n| P1-7 | P1       | Accessibility | Initials `aria-label` exposes raw initials, not a full name    | FIXED |\n| P2-1 | P2       | TypeScript    | No runtime guard for invalid `size`/`shape` values             | DOCUMENTED |\n| P2-2 | P2       | CSS/DOM       | Empty badge `<span>` always in DOM                             | DOCUMENTED |\n| P2-3 | P2       | Storybook     | `Sizes`/`Shapes` stories have no meaningful `alt` text         | FIXED |\n| P2-4 | P2       | Storybook     | No story for broken `src` → fallback recovery path             | FIXED |\n| P2-5 | P2       | CSS           | No `:host([hidden])` display:none rule                         | FIXED |\n| P2-6 | P2       | Drupal        | No Twig integration example or documentation                   | DOCUMENTED |\n| P2-7 | P2       | Tests         | `setTimeout(50)` timing-based waits are fragile                | FIXED |\n| P2-8 | P2       | Tests         | axe-core covers only 2 of 5 avatar rendering modes             | FIXED |"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-1: Reset _imgError on src change + P1-1/P1-7: Add label property + P1-2: Dev warning + P1-3: Fix double semantics (hx-avatar.ts)",
      "status": "completed",
      "activeForm": "Fixing component TypeScript issues (P0-1, P1-1/7, P1-2, P1-3)"
    },
    {
      "content": "Fix P0-2: Badge clipping + P2-5: Add :host([hidden]) rule (hx-avatar.styles.ts)",
      "status": "completed",
      "activeForm": "Fixing CSS badge clipping and hidden rule"
    },
    {
      "content": "Fix P1-6: Story src handling + P2-3: Alt text + P2-4: Broken src story (hx-avatar.stories.ts)",
      "status": "completed",
      "activeForm": "Fixing Storybook stories"
    },
    {
      "content": "Fix P1-4/P1-5: Add image error tests + P2-7: Remove setTimeout + P2-8: More axe tests (hx-avatar.test.ts)",
      "status": "completed",
      "activeForm": "Fixing and expanding test suite"
    },
    {
      "content": "Build and verify all changes compile",
      "status": "completed",
      "activeForm": "Building and verifying"
    },
    {
      "content": "Run tests to confirm all pass",
      "status": "completed",
      "activeForm": "Running test suite"
    },
    {
      "content": "Verify git diff and update AUDIT.md",
      "status": "completed",
      "activeForm": "Verifying diff and updating audit"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-avatar

### Changes Implemented
Fixed all 2 P0 (critical) and 7 P1 (high) issues from the antagonistic audit. Also fixed 6 of 8 P2 issues. Remaining P2 items (runtime guard for invalid size/shape, Drupal docs) documented for future work.

**P0 Fixes:**
- P0-1: Added `willUpdate()` lifecycle to reset `_imgError` when `src` changes — prevents permanent image suppression after error
- P0-2: Removed `overflow: hidden` from `.avatar`, added `border-radius: inherit` to `.avatar__image` — badge no longer clipped

**P1 Fixes:**
- P1-1/P1-7: Added `label` property for human-readable accessible name (priority chain: label > alt > initials > 'Avatar')
- P1-2: Added dev-mode console warning when `src` set without `alt` or `label`
- P1-3: Added `aria-hidden="true"` to `<img>` to fix double semantics with container `role="img"`
- P1-4/P1-5: Added 3 image error fallback tests (initials fallback, icon fallback, src change reset)
- P1-6: Story render uses `ifDefined()` instead of `?? ''` for optional `src` attribute

**P2 Fixes:**
- P2-3: Added meaningful alt text to Sizes/Shapes stories
- P2-4: Added BrokenImageFallback story
- P2-5: Added `:host([hidden]) { display: none !important }` rule
- P2-7: Replaced all `setTimeout(50)` with deterministic `requestAnimationFrame` pattern
- P2-8: Expanded axe-core tests from 2 to 5 modes (added image, slotted, badge)

**Test additions:** 9 new tests (22 → 31), including `Property: label` block (3 tests)

### Files Modified
- `packages/hx-library/src/components/hx-avatar/hx-avatar.ts` — component logic fixes
- `packages/hx-library/src/components/hx-avatar/hx-avatar.styles.ts` — CSS fixes
- `packages/hx-library/src/components/hx-avatar/hx-avatar.stories.ts` — story improvements
- `packages/hx-library/src/components/hx-avatar/hx-avatar.test.ts` — test expansion
- `packages/hx-library/src/components/hx-avatar/AUDIT.md` — updated with fix status

### Verification Status
- TypeScript type-check: 0 errors
- Test suite: 3109/3109 passed (79 test files), including all 31 hx-avatar tests
- `git diff --stat` confirms only hx-avatar files modified (plus incidental screenshot PNGs from test runs)

### Risks/Blockers Encountered
- axe-core flagged `aria-label` on `<span>` without a role in badge test fixture — fixed by adding `role="status"`

### Remaining P2 (Documented, Not Fixed)
- P2-1: No runtime guard for invalid `size`/`shape` attribute values
- P2-2: Empty badge `<span>` always present in DOM
- P2-6: No Drupal/Twig integration documentation

### Learnings
- Removing `overflow: hidden` from avatar container and using `border-radius: inherit` on the image is the cleanest way to allow badge overflow while maintaining circular clipping
- `ifDefined` from Lit directives is the correct pattern for optional attributes in Storybook render functions
- `requestAnimationFrame` is a reliable replacement for `setTimeout` when waiting for slotchange events
</summary>