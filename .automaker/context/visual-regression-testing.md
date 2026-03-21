# Visual Regression Testing Workflow

Catch unintended visual changes before they ship. Every component variant, every state, every theme.

---

## Overview

- **Tool:** Playwright screenshot comparison
- **Surface:** Storybook stories as the visual test baseline
- **CI:** Runs on every PR, blocks merge on unexpected diffs
- **Storage:** Screenshot baselines committed to the repository

---

## Playwright Screenshot Comparison

### Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:3151', // Storybook
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 1% pixel diff threshold
      animations: 'disabled',
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### Writing Visual Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('hx-button visual regression', () => {
  test('default variant', async ({ page }) => {
    await page.goto('/iframe.html?id=components-hx-button--default');
    await page.waitForSelector('hx-button');
    await expect(page.locator('hx-button')).toHaveScreenshot('hx-button-default.png');
  });

  test('hover state', async ({ page }) => {
    await page.goto('/iframe.html?id=components-hx-button--default');
    const button = page.locator('hx-button');
    await button.hover();
    await expect(button).toHaveScreenshot('hx-button-hover.png');
  });

  test('focus state', async ({ page }) => {
    await page.goto('/iframe.html?id=components-hx-button--default');
    const button = page.locator('hx-button');
    await button.focus();
    await expect(button).toHaveScreenshot('hx-button-focus.png');
  });

  test('disabled state', async ({ page }) => {
    await page.goto('/iframe.html?id=components-hx-button--disabled');
    await expect(page.locator('hx-button')).toHaveScreenshot('hx-button-disabled.png');
  });
});
```

---

## Storybook as Visual Test Surface

Every Storybook story is a potential visual regression test case. Stories should be structured to make VRT straightforward:

- One visual variant per story
- Stories render in a predictable, stable layout
- No randomized data in VRT-targeted stories
- Animations disabled for screenshot stability

### Story Naming Convention

```
components-hx-{component}--{variant}
```

Storybook iframe URL pattern:
```
/iframe.html?id=components-hx-button--primary
/iframe.html?id=components-hx-button--secondary
/iframe.html?id=components-hx-button--disabled
```

---

## Threshold Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxDiffPixelRatio` | 0.01 (1%) | Catches meaningful changes while allowing sub-pixel rendering differences |
| `maxDiffPixels` | 50 | Alternative: absolute pixel count for small components |
| `threshold` | 0.2 | Per-pixel color sensitivity (0 = exact, 1 = anything) |
| `animations` | `'disabled'` | Prevents animation frame timing from causing false diffs |

### Adjusting Thresholds

- Tighten thresholds (lower values) for components with precise visual requirements
- Loosen thresholds (slightly) for components with anti-aliased text at varying sizes
- Never set `maxDiffPixelRatio` above 0.05 (5%) -- at that point, real regressions slip through

---

## Component State Matrix

Every component must have VRT coverage for applicable states:

| State | Description | Applicable To |
|-------|-------------|---------------|
| Default | Resting state, no interaction | All components |
| Hover | Mouse hovering over interactive element | Buttons, links, inputs, cards |
| Focus | Keyboard focus visible | All interactive components |
| Focus-visible | Keyboard-only focus indicator | All interactive components |
| Active / Pressed | During click/tap | Buttons, toggles |
| Disabled | Non-interactive state | Form elements, buttons |
| Error | Validation error state | Form elements |
| Loading | Async operation in progress | Buttons, cards, tables |
| Selected | Chosen item | Select, radio, checkbox, tabs |
| Expanded | Open/expanded state | Accordion, dropdown, drawer |
| Collapsed | Closed state | Accordion, dropdown, drawer |
| Empty | No content/data | Tables, lists, cards |
| Overflow | Content exceeds bounds | Text, containers |

---

## Dark Mode / Theme Variant Coverage

Test each component in all supported themes:

```typescript
test.describe('hx-button themes', () => {
  const themes = ['light', 'dark'];

  for (const theme of themes) {
    test(`${theme} theme - default`, async ({ page }) => {
      await page.goto(`/iframe.html?id=components-hx-button--default&globals=theme:${theme}`);
      await expect(page.locator('hx-button')).toHaveScreenshot(`hx-button-default-${theme}.png`);
    });
  }
});
```

### Theme-Specific Checks

- Color contrast ratios maintained in all themes
- Focus indicators visible against all background colors
- Border colors distinguishable in all themes
- Disabled states visually distinct in all themes

---

## Responsive Breakpoint Testing

Test at standard breakpoints:

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`hx-card at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/iframe.html?id=components-hx-card--default');
    await expect(page.locator('hx-card')).toHaveScreenshot(`hx-card-${vp.name}.png`);
  });
}
```

---

## CI Integration

### PR Workflow

1. PR opened or updated
2. CI builds Storybook (`pnpm run build:storybook`)
3. CI serves built Storybook
4. Playwright runs VRT against served Storybook
5. On diff detected:
   - CI fails the check
   - Diff images uploaded as artifacts
   - PR comment with visual diff summary

### Updating Baselines

When a visual change is intentional:

```bash
# Update screenshots for a specific component
npx playwright test tests/visual/hx-button.spec.ts --update-snapshots

# Update all screenshots
npx playwright test tests/visual/ --update-snapshots
```

Commit updated baselines with the PR. Review baseline changes in the PR diff.

### Baseline Management

- Baselines stored in `tests/visual/__screenshots__/`
- Baselines are committed to git (not gitignored)
- Platform-specific baselines: `{name}-chromium-linux.png` (CI runs on Linux)
- Local development may produce different baselines due to font rendering -- always use CI baselines as source of truth

---

## Best Practices

1. **Stable selectors:** Use component tag names, not CSS classes that may change
2. **Wait for render:** Always `waitForSelector` before screenshotting
3. **Disable animations:** Set `animations: 'disabled'` globally
4. **Consistent fonts:** Ensure CI environment has the same fonts as development
5. **Clip to component:** Screenshot the component element, not the full page
6. **Avoid flaky tests:** No network-dependent content, no randomized data, no time-dependent displays
7. **Review diffs carefully:** Every baseline update should be intentional and reviewed
