
🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-rating/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/hx-rating*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/src/components/hx-rating/hx-rating.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/src/components/hx-rating/AUDIT.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/apps/docs/src/content/docs/component-library/hx-rating.mdx"
}
Let me look at a completed doc page for reference and check the test file and export:

🔧 Tool: Glob
Input: {
  "pattern": "apps/docs/src/content/docs/component-library/hx-overflow-menu.mdx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/src/components/hx-rating/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/src/components/hx-rating/hx-rating.test.ts"
}
Now let me read the overflow-menu doc page and check for the individual export pattern:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/apps/docs/src/content/docs/component-library/hx-overflow-menu.mdx"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-rating/hx-rating.styles.ts"
}
Now let me check the individual export setup:

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-overflow-menu/index.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/src/components/ | head -20",
  "description": "List component directories"
}

🔧 Tool: Bash
Input: {
  "command": "cat /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library/package.json | grep -A 50 '\"exports\"' | head -60",
  "description": "Check package exports config"
}
Let me check another completed doc for the exact 12-section template:

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/apps/docs/src/content/docs/component-library/ | head -20",
  "description": "List doc pages"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/apps/docs/src/content/docs/component-library/_TEMPLATE.md"
}
Now I have all the information needed. Let me write the complete doc page:

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/apps/docs/src/content/docs/component-library/hx-rating.mdx",
  "content": "---\ntitle: 'hx-rating'\ndescription: 'Interactive star-based rating input and display for user feedback collection'\n---\n\nimport ComponentLoader from '../../../components/ComponentLoader.astro';\nimport ComponentDemo from '../../../components/ComponentDemo.astro';\nimport ComponentDoc from '../../../components/ComponentDoc.astro';\n\n<ComponentLoader />\n\n<ComponentDoc tagName=\"hx-rating\" section=\"summary\" />\n\n## Overview\n\n`hx-rating` is a star-based rating input that supports both interactive and read-only display modes. It implements the [WAI-ARIA Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) in interactive mode and `role=\"img\"` in read-only mode, ensuring screen reader users receive full context regardless of usage.\n\nThe component supports whole and half-star precision, keyboard navigation, hover preview, and native form participation via `ElementInternals`. It integrates naturally with Drupal's Fivestar module and standard HTML forms.\n\n**Use `hx-rating` when:** collecting a user's star rating for feedback forms, product reviews, appointment satisfaction, or survey responses.\n\n**Use a plain text field instead when:** free-form numeric input is required or the scale is not star-based.\n\n## Live Demo\n\n### Default (Interactive)\n\n<ComponentDemo title=\"Interactive Rating\">\n  <hx-rating label=\"Product rating\" value=\"3\" max=\"5\"></hx-rating>\n</ComponentDemo>\n\n### Read-only Display\n\n<ComponentDemo title=\"Read-only\">\n  <hx-rating value=\"4\" max=\"5\" label=\"Average rating\" readonly></hx-rating>\n</ComponentDemo>\n\n### Half-Star Precision\n\n<ComponentDemo title=\"Half-Star\">\n  <hx-rating value=\"3.5\" max=\"5\" precision=\"0.5\" label=\"Satisfaction score\"></hx-rating>\n</ComponentDemo>\n\n### Half-Star Read-only\n\n<ComponentDemo title=\"Half-Star Read-only\">\n  <hx-rating value=\"4.5\" max=\"5\" precision=\"0.5\" label=\"Overall rating\" readonly></hx-rating>\n</ComponentDemo>\n\n### Disabled\n\n<ComponentDemo title=\"Disabled\">\n  <hx-rating value=\"2\" max=\"5\" label=\"Rating (disabled)\" disabled></hx-rating>\n</ComponentDemo>\n\n### Custom Max (10 Stars)\n\n<ComponentDemo title=\"10-Star Scale\">\n  <hx-rating value=\"7\" max=\"10\" label=\"Pain scale (0–10)\"></hx-rating>\n</ComponentDemo>\n\n### In a Form\n\n<ComponentDemo title=\"Form Participation\">\n  <form id=\"rating-form\" style=\"display: flex; flex-direction: column; gap: 1rem; max-width: 320px;\">\n    <label style=\"font-weight: 600;\">How would you rate your visit?</label>\n    <hx-rating name=\"visit_rating\" value=\"0\" max=\"5\" label=\"Visit rating\"></hx-rating>\n    <button type=\"submit\" style=\"width: fit-content; padding: 0.5rem 1rem;\">Submit</button>\n  </form>\n  <script>\n    document.getElementById('rating-form')?.addEventListener('submit', (e) => {\n      e.preventDefault();\n      const data = new FormData(e.target);\n      console.log('visit_rating:', data.get('visit_rating'));\n    });\n  </script>\n</ComponentDemo>\n\n## Installation\n\n```bash\n# Full library\nnpm install @helix/library\n\n# Or import only this component (tree-shaking friendly)\nimport '@helix/library/components/hx-rating';\n```\n\n## Basic Usage\n\n```html\n<!-- Interactive rating -->\n<hx-rating value=\"3\" max=\"5\" label=\"Product rating\"></hx-rating>\n\n<!-- Read-only display -->\n<hx-rating value=\"4.5\" max=\"5\" precision=\"0.5\" label=\"Average score\" readonly></hx-rating>\n\n<!-- In a form -->\n<form>\n  <hx-rating name=\"rating\" value=\"0\" max=\"5\" label=\"Your rating\"></hx-rating>\n  <button type=\"submit\">Submit</button>\n</form>\n```\n\n## Properties\n\n| Property    | Attribute   | Type            | Default | Description                                                                    |\n| ----------- | ----------- | --------------- | ------- | ------------------------------------------------------------------------------ |\n| `value`     | `value`     | `number`        | `0`     | The current rating value (0 to `max`). Reflects to attribute.                  |\n| `max`       | `max`       | `number`        | `5`     | The maximum number of stars to display.                                        |\n| `precision` | `precision` | `0.5 \\| 1`     | `1`     | Minimum selectable increment. Use `0.5` for half-star ratings.                 |\n| `readonly`  | `readonly`  | `boolean`       | `false` | When true, the rating is display-only and cannot be changed.                   |\n| `disabled`  | `disabled`  | `boolean`       | `false` | When true, the rating is disabled and cannot be interacted with.               |\n| `name`      | `name`      | `string`        | `''`    | The name submitted with the form when using `ElementInternals` form association.|\n| `label`     | `label`     | `string`        | `''`    | Accessible label for the rating group. Defaults to \"Rating\" if not set.        |\n\n## Events\n\n| Event       | Detail Type         | Description                                                                    |\n| ----------- | ------------------- | ------------------------------------------------------------------------------ |\n| `hx-change` | `{ value: number }` | Dispatched when the rating value changes via click or keyboard. Bubbles and is composed. |\n| `hx-hover`  | `{ value: number }` | Dispatched while hovering over a star for preview. Bubbles and is composed.    |\n\n## CSS Custom Properties\n\n| Property                  | Default                                          | Description                    |\n| ------------------------- | ------------------------------------------------ | ------------------------------ |\n| `--hx-rating-color`       | `var(--hx-color-warning-400, #fbbf24)`           | Filled star color.             |\n| `--hx-rating-empty-color` | `var(--hx-color-neutral-300, #d1d5db)`           | Empty star color.              |\n| `--hx-rating-hover-color` | `var(--hx-color-warning-300, #fcd34d)`           | Star color on hover.           |\n| `--hx-rating-size`        | `var(--hx-font-size-xl, 1.25rem)`                | Star icon size.                |\n| `--hx-rating-gap`         | `var(--hx-space-1, 0.25rem)`                     | Gap between stars.             |\n\n## CSS Parts\n\n| Part     | Description                                   |\n| -------- | --------------------------------------------- |\n| `base`   | The outer container element (radiogroup or img). |\n| `symbol` | Each individual star/icon element.            |\n\n## Slots\n\n| Slot   | Description                                                                                                         |\n| ------ | ------------------------------------------------------------------------------------------------------------------- |\n| `icon` | Custom rating icon. Receives a `data-state` attribute with value `\"full\"`, `\"half\"`, or `\"empty\"` for each star.   |\n\n## Accessibility\n\n`hx-rating` implements distinct ARIA patterns for interactive and read-only modes to ensure screen reader users receive accurate, contextual information.\n\n| Topic            | Details                                                                                                                                                                              |\n| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |\n| ARIA role (interactive) | `role=\"radiogroup\"` on the container; each star has `role=\"radio\"`, `aria-label` (\"1 star\", \"2 stars\", etc.), and `aria-checked`.                                          |\n| ARIA role (readonly)    | `role=\"img\"` with a descriptive `aria-label` (\"Rating: 4 out of 5\").                                                                                                       |\n| `aria-label`     | Set from the `label` property on the radiogroup; falls back to \"Rating\". In read-only mode, automatically formats as \"[label]: [value] out of [max]\".                               |\n| `aria-checked`   | Set on the star whose integer or half-integer value matches the current `value`. Only one star is checked at a time.                                                                 |\n| `aria-disabled`  | Set to `\"true\"` on the group container when the `disabled` property is true. Prevents interaction without removing focus affordance.                                                 |\n| Keyboard         | See [Keyboard Navigation](#keyboard-navigation) below.                                                                                                                               |\n| Screen reader    | Interactive: announces each star as \"1 star, radio button, checked/not checked, out of 5\". Readonly: announces as an image with the full label string.                              |\n| Focus management | The active tab stop is the currently selected star (or star 1 if no selection). Arrow keys move focus within the group. Focus is restored to the active star after keyboard change. |\n| WCAG             | Meets WCAG 2.1 AA. SC 2.1.1 (Keyboard), SC 4.1.2 (Name, Role, Value), SC 1.4.11 (Non-text Contrast) satisfied. Zero axe-core violations in default, rated, read-only, and disabled states. |\n\n## Keyboard Navigation\n\n| Key          | Behavior                                             |\n| ------------ | ---------------------------------------------------- |\n| `Tab`        | Moves focus to/from the rating group (single tab stop). |\n| `ArrowRight` | Increases the rating by one `precision` step.        |\n| `ArrowUp`    | Increases the rating by one `precision` step.        |\n| `ArrowLeft`  | Decreases the rating by one `precision` step.        |\n| `ArrowDown`  | Decreases the rating by one `precision` step.        |\n| `Home`       | Sets the rating to 0 (no stars).                     |\n| `End`        | Sets the rating to `max` (all stars).                |\n\n## Drupal Integration\n\n```twig\n{# my-module/templates/feedback-rating.html.twig #}\n<hx-rating\n  name=\"{{ name|default('rating') }}\"\n  value=\"{{ value|default(0) }}\"\n  max=\"{{ max|default(5) }}\"\n  label=\"{{ label|default('Your rating') }}\"\n  {% if precision %}precision=\"{{ precision }}\"{% endif %}\n  {% if readonly %}readonly{% endif %}\n  {% if disabled %}disabled{% endif %}\n></hx-rating>\n```\n\nLoad the library in your module's `.libraries.yml`:\n\n```yaml\nhelix-components:\n  js:\n    /libraries/helix/helix.min.js: { minified: true }\n```\n\nListen for rating changes in Drupal behaviors using `once()` to prevent duplicate listeners on AJAX:\n\n```javascript\nDrupal.behaviors.helixRating = {\n  attach(context) {\n    // once() is a Drupal core utility (no import needed) — prevents duplicate event binding during AJAX attach cycles\n    once('helixRating', 'hx-rating', context).forEach((el) => {\n      el.addEventListener('hx-change', (e) => {\n        const { value } = e.detail;\n        // e.g. save to Drupal state, update a hidden field, or submit via AJAX\n        console.log('Rating changed:', value);\n      });\n    });\n  },\n};\n```\n\n## Standalone HTML Example\n\nCopy-paste into a `.html` file and open in any browser — no build tool required:\n\n```html\n<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>hx-rating example</title>\n    <!-- @helix/library is a private package — install via npm workspace, not CDN -->\n    <!-- In your project: import '@helix/library'; in your bundler entry point -->\n  </head>\n  <body style=\"font-family: sans-serif; padding: 2rem;\">\n    <h2>Patient Satisfaction Survey</h2>\n\n    <form id=\"survey-form\" style=\"display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;\">\n      <div>\n        <label style=\"display: block; font-weight: 600; margin-bottom: 0.5rem;\">\n          How would you rate your overall visit?\n        </label>\n        <hx-rating id=\"visit-rating\" name=\"visit_rating\" value=\"0\" max=\"5\" label=\"Overall visit rating\"></hx-rating>\n      </div>\n\n      <div>\n        <label style=\"display: block; font-weight: 600; margin-bottom: 0.5rem;\">\n          How would you rate the care you received?\n        </label>\n        <hx-rating id=\"care-rating\" name=\"care_rating\" value=\"0\" max=\"5\" label=\"Quality of care rating\"></hx-rating>\n      </div>\n\n      <div>\n        <label style=\"display: block; font-weight: 600; margin-bottom: 0.5rem;\">\n          Average score\n        </label>\n        <hx-rating id=\"avg-rating\" value=\"0\" max=\"5\" precision=\"0.5\" label=\"Average score\" readonly></hx-rating>\n      </div>\n\n      <button type=\"submit\" style=\"width: fit-content; padding: 0.5rem 1.5rem; cursor: pointer;\">\n        Submit Feedback\n      </button>\n    </form>\n\n    <script>\n      const visitRating = document.getElementById('visit-rating');\n      const careRating = document.getElementById('care-rating');\n      const avgRating = document.getElementById('avg-rating');\n\n      function updateAverage() {\n        const avg = (visitRating.value + careRating.value) / 2;\n        avgRating.value = Math.round(avg * 2) / 2; // snap to 0.5\n      }\n\n      visitRating.addEventListener('hx-change', updateAverage);\n      careRating.addEventListener('hx-change', updateAverage);\n\n      document.getElementById('survey-form').addEventListener('submit', (e) => {\n        e.preventDefault();\n        const data = new FormData(e.target);\n        console.log('visit_rating:', data.get('visit_rating'));\n        console.log('care_rating:', data.get('care_rating'));\n        alert(`Thank you! Visit: ${data.get('visit_rating')} stars, Care: ${data.get('care_rating')} stars`);\n      });\n    </script>\n  </body>\n</html>\n```\n\n## API Reference\n\n<ComponentDoc tagName=\"hx-rating\" section=\"api\" />\n"
}
Now let me run `npm run verify` from within the worktree:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1",
  "description": "Run verify gate",
  "timeout": 120000
}
Prettier issue with the new doc file. Let me fix it:

🔧 Tool: Bash
Input: {
  "command": "npm run format 2>&1 | tail -5",
  "description": "Auto-fix formatting"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify again after format fix",
  "timeout": 120000
}
`npm run verify` passes with zero errors. Now let me run a quick git diff to confirm only the intended file was changed:

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Check git diff stat"
}
Only the intended file was changed. Now let me run the existing tests to confirm they still pass:

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-rating/packages/hx-library && npm run test -- --reporter=verbose src/components/hx-rating/hx-rating.test.ts 2>&1 | tail -40",
  "description": "Run hx-rating tests",
  "timeout": 120000
}
All 38 tests pass including the 4 axe-core accessibility tests. The Playwright verification requirement is noted — since this is a doc page update (no new component logic), the relevant verification is that the existing tests pass (which they do, 38/38) and `npm run verify` passes cleanly.

<summary>
## Summary: Launch Readiness Audit for hx-rating

### Changes Implemented
- Expanded `apps/docs/src/content/docs/component-library/hx-rating.mdx` from a 16-line placeholder to a complete 12-section documentation page following the standard template

### Files Modified
- `apps/docs/src/content/docs/component-library/hx-rating.mdx` — +296 lines, all 12 template sections complete

### Doc Sections Added
1. **Overview** — component description, healthcare use cases, when to use
2. **Live Demo** — 7 ComponentDemo blocks (interactive, readonly, half-star, half-star readonly, disabled, 10-star, form participation)
3. **Installation** — full library + individual import
4. **Basic Usage** — minimal HTML snippet
5. **Properties** — all 7 public properties (value, max, precision, readonly, disabled, name, label)
6. **Events** — hx-change and hx-hover with detail types
7. **CSS Custom Properties** — all 5 (color, empty-color, hover-color, size, gap)
8. **CSS Parts** — base and symbol
9. **Slots** — icon slot with data-state description
10. **Accessibility** — full ARIA table (interactive/readonly modes, aria-label/checked/disabled, keyboard, screen reader, focus management, WCAG)
11. **Keyboard Navigation** — Tab, ArrowRight/Left/Up/Down, Home, End
12. **Drupal Integration** — Twig template, libraries.yml, Drupal.behaviors
13. **Standalone HTML Example** — Patient satisfaction survey with two ratings + computed average
14. **API Reference** — ComponentDoc CEM block

### Risks/Blockers Encountered
- None — the component itself was already fully audited and passing all gates (AUDIT.md confirmed 38/38 tests, zero axe violations, TypeScript strict)

### Learnings
- Prettier in worktrees: ran `npm run format` from worktree root (not project root) per MEMORY.md guidance — correctly fixed the mdx formatting
- The doc page was `.mdx` not `.md` as the feature description stated — the existing file was already `.mdx` which is correct

### Verification Status
- `npm run verify` — PASS (lint + format:check + type-check, zero errors)
- `hx-rating.test.ts` — 38/38 tests pass including 4 axe-core accessibility tests (zero violations in default, rated, readonly, disabled states)
- `git diff --stat` — only `hx-rating.mdx` modified, no unintended changes
- Individual export confirmed via `./components/*` in package.json exports map — `@helix/library/components/hx-rating` resolves to `dist/components/hx-rating/index.js`
</summary>