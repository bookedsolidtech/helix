---
title: Visual Regression Testing
description: Catching visual regressions in web components using Playwright screenshot comparison.
---

Visual regression testing catches unintended visual changes that unit tests cannot detect. A component can pass all functional tests and still have incorrect colors, broken layout, or misaligned elements. Playwright screenshot comparison provides pixel-level verification that the rendered output matches an approved baseline.

HELIX uses Playwright for visual regression testing (VRT) via the file at `packages/hx-library/e2e/vrt.spec.ts`. Tests run against a live Storybook instance on port 3151 and compare captured screenshots against committed baselines stored in `packages/hx-library/__screenshots__/`.

## How VRT Fits Into the Testing Strategy

Visual regression tests are distinct from Vitest unit tests and Storybook interaction tests:

| Test Type                   | What It Catches                       | When to Use                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| Vitest unit tests           | Logic, state, events, DOM structure   | Always — every component       |
| Storybook interaction tests | User interaction flows in the browser | Complex interaction sequences  |
| Playwright VRT              | Pixel-level visual output             | Visual states, CSS correctness |

Do not use VRT as a substitute for unit tests. Use it to verify things that only a screenshot can confirm: that a button's border radius is correct, that a disabled state applies the right opacity, that error state text is red.

## Project Setup

Playwright is configured at the monorepo root in `playwright.config.ts`:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages/hx-library/e2e',
  outputDir: './packages/hx-library/.cache/vrt-results',
  snapshotDir: './packages/hx-library/__screenshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['json', { outputFile: './packages/hx-library/.cache/vrt-results.json' }]],
  use: {
    baseURL: 'http://localhost:3151',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

Key points:

- **Storybook is the test harness.** Tests navigate to isolated story iframes via `?viewMode=story`.
- **Snapshots are committed to git.** The `__screenshots__` directory is in the repository so baselines are shared across the team.
- **CI runs single-threaded.** `workers: process.env.CI ? 1 : undefined` prevents flaky failures from parallel browser rendering differences.
- **Retries on CI.** `retries: 2` handles transient network or rendering timing issues.

## The e2e/vrt.spec.ts Structure

Tests are organized as a data-driven loop over component variants. Each variant has a Storybook story ID, component tag name, and story label:

```typescript
// packages/hx-library/e2e/vrt.spec.ts
import { test, expect } from '@playwright/test';

const STORYBOOK_URL = 'http://localhost:3151';

interface ComponentVariant {
  component: string;
  story: string;
  id: string;
}

const COMPONENT_VARIANTS: ComponentVariant[] = [
  // hx-button
  { component: 'hx-button', story: 'Primary', id: 'components-button--primary' },
  { component: 'hx-button', story: 'Secondary', id: 'components-button--secondary' },
  { component: 'hx-button', story: 'Ghost', id: 'components-button--ghost' },
  { component: 'hx-button', story: 'Disabled', id: 'components-button--disabled' },

  // hx-text-input
  { component: 'hx-text-input', story: 'Default', id: 'components-text-input--default' },
  { component: 'hx-text-input', story: 'WithError', id: 'components-text-input--with-error' },
  { component: 'hx-text-input', story: 'Disabled', id: 'components-text-input--disabled' },

  // ... one entry per component variant
];

for (const variant of COMPONENT_VARIANTS) {
  test(`${variant.component} - ${variant.story}`, async ({ page }) => {
    // Navigate to the isolated story iframe
    const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${variant.id}&viewMode=story`;
    await page.goto(storyUrl);

    // Wait for the component custom element to render
    await page.waitForSelector(variant.component, { timeout: 10000 });

    // Wait for fonts and CSS transitions to settle
    await page.waitForTimeout(500);

    // Screenshot comparison with 2% pixel tolerance
    await expect(page).toHaveScreenshot(
      `${variant.component}--${variant.story.toLowerCase()}.png`,
      {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      },
    );
  });
}
```

The `iframe.html?id=...&viewMode=story` URL loads the story in isolation without the Storybook shell, giving clean screenshots that contain only the component.

## Taking Screenshots

### Full-Page Screenshots

`expect(page).toHaveScreenshot()` captures the full visible page. This works well for Storybook stories where the iframe contains only the component:

```typescript
await expect(page).toHaveScreenshot('hx-button--primary.png', {
  maxDiffPixelRatio: 0.02,
  animations: 'disabled',
});
```

### Locator Screenshots

For tighter crops, use `locator.screenshot()` to capture only the component element. This is useful when the story has additional surrounding context:

```typescript
test('hx-button - Primary (element only)', async ({ page }) => {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-button--primary&viewMode=story`);
  await page.waitForSelector('hx-button');
  await page.waitForTimeout(500);

  const locator = page.locator('hx-button');
  await expect(locator).toHaveScreenshot('hx-button--primary-element.png', {
    animations: 'disabled',
  });
});
```

Locator screenshots exclude whitespace outside the component's bounding box. Use this when testing components in context (e.g., inside a card) where full-page screenshots would include irrelevant surroundings.

### Page vs Locator: When to Use Each

Use `page.screenshot()` when:

- The story is a standalone component without surrounding context
- You want to verify the full layout including spacing

Use `locator.screenshot()` when:

- The story renders the component inside a container
- You want to test multiple components in a single screenshot (use a wrapper locator)
- You need consistent framing regardless of viewport changes

## Handling Shadow DOM in Playwright

Playwright's standard selectors can query into shadow DOM using the `>>` pierce selector syntax. However, for VRT, you typically do not need to pierce shadow DOM — you are capturing the visual output of the component, not querying internal elements.

For cases where you need to interact with shadow DOM before taking a screenshot (e.g., clicking inside a component to trigger hover state), use the `locator.locator()` chain:

```typescript
test('hx-text-input - Focus state', async ({ page }) => {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-text-input--default&viewMode=story`);
  await page.waitForSelector('hx-text-input');

  // Click the native input inside the shadow DOM
  await page.click('hx-text-input >> input');

  await expect(page).toHaveScreenshot('hx-text-input--focused.png', {
    animations: 'disabled',
  });
});
```

The `>>` operator pierces shadow boundaries. For standard CSS selectors inside shadow DOM, use `:shadow()` in newer Playwright versions.

### Pierce Selectors for State Setup

When a VRT requires an element to be in a specific interactive state (hover, focus, active), drive it through the browser before taking the screenshot:

```typescript
test('hx-button - Hover state', async ({ page }) => {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-button--primary&viewMode=story`);
  await page.waitForSelector('hx-button');

  // Move mouse over the native button inside shadow DOM
  await page.hover('hx-button >> button');

  await expect(page).toHaveScreenshot('hx-button--primary-hover.png', {
    animations: 'disabled',
  });
});
```

## Diff Threshold Configuration

Pixel-perfect comparison is impractical across browsers, operating systems, and font rendering engines. HELIX uses `maxDiffPixelRatio: 0.02`, which allows up to 2% of pixels to differ before the test fails.

```typescript
await expect(page).toHaveScreenshot('component.png', {
  maxDiffPixelRatio: 0.02, // 2% tolerance
  animations: 'disabled', // Prevent animation frames mid-screenshot
});
```

Alternative options:

```typescript
// Absolute pixel count instead of ratio
await expect(page).toHaveScreenshot('component.png', {
  maxDiffPixels: 100, // At most 100 pixels may differ
});

// Full threshold object with both pixel and ratio
await expect(page).toHaveScreenshot('component.png', {
  maxDiffPixelRatio: 0.02,
  threshold: 0.2, // Per-pixel color difference tolerance (0–1)
});
```

Set `threshold` higher for components with gradients or anti-aliased borders where sub-pixel differences accumulate.

## Updating Baseline Screenshots

When a component's appearance intentionally changes (new design token, corrected CSS), the baseline screenshots must be updated:

```bash
# Run Playwright with --update-snapshots to overwrite baselines
npx playwright test --update-snapshots

# Update baselines for a specific component only
npx playwright test --update-snapshots -g "hx-button"

# Update baselines for a specific story
npx playwright test --update-snapshots -g "hx-button - Primary"
```

After running `--update-snapshots`:

1. Review the diff for each updated file in your git diff
2. Confirm every change is intentional
3. Commit the new baseline files with the code change

Never commit updated screenshots without reviewing them. A careless `--update-snapshots` run that overwrites an incorrect state becomes the new approved baseline.

## Storing Baseline Screenshots in Git

The `__screenshots__` directory is committed to the repository:

```
packages/hx-library/__screenshots__/
├── vrt.spec.ts/
│   ├── hx-button--primary.png
│   ├── hx-button--secondary.png
│   ├── hx-button--ghost.png
│   ├── hx-button--disabled.png
│   ├── hx-text-input--default.png
│   ├── hx-text-input--witherror.png
│   ├── hx-text-input--disabled.png
│   └── ...
```

Storing screenshots in git provides:

- **Baseline history** — You can see exactly what the component looked like at any commit
- **PR reviews** — Reviewers can see the visual diff in GitHub
- **Consistent CI** — Every CI run uses the same approved baselines

The `.gitattributes` file should mark `.png` files in this directory as binary to prevent merge conflicts:

```gitattributes
packages/hx-library/__screenshots__/**/*.png binary
```

## Testing Component States

Every meaningful visual state needs a dedicated story and a corresponding VRT entry. Do not rely on a single "default" screenshot to catch all regressions.

States to cover for each component:

```typescript
const COMPONENT_VARIANTS: ComponentVariant[] = [
  // Default / base state
  { component: 'hx-button', story: 'Primary', id: 'components-button--primary' },

  // All visual variants
  { component: 'hx-button', story: 'Secondary', id: 'components-button--secondary' },
  { component: 'hx-button', story: 'Ghost', id: 'components-button--ghost' },

  // Disabled state
  { component: 'hx-button', story: 'Disabled', id: 'components-button--disabled' },

  // Error state (for form components)
  { component: 'hx-text-input', story: 'WithError', id: 'components-text-input--with-error' },

  // Size variants
  { component: 'hx-button', story: 'SizeSm', id: 'components-button--size-sm' },
  { component: 'hx-button', story: 'SizeLg', id: 'components-button--size-lg' },
];
```

For interactive states (hover, focus) that require interaction before screenshotting, write a separate dedicated test rather than adding them to the data loop:

```typescript
test('hx-text-input - Focus ring visible', async ({ page }) => {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-text-input--default&viewMode=story`);
  await page.waitForSelector('hx-text-input');
  await page.waitForTimeout(300);

  await page.click('hx-text-input >> input');
  await page.waitForTimeout(100); // Let focus ring animation settle

  await expect(page).toHaveScreenshot('hx-text-input--focus-ring.png', {
    animations: 'disabled',
  });
});
```

## Testing Dark Mode

If the library supports a dark mode (via `prefers-color-scheme` or a data attribute), test it with Playwright's `colorScheme` option:

```typescript
test('hx-button - Primary (dark mode)', async ({ page }) => {
  // Emulate system dark mode preference
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-button--primary&viewMode=story`);
  await page.waitForSelector('hx-button');
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot('hx-button--primary-dark.png', {
    animations: 'disabled',
  });
});

test('hx-text-input - Error state (dark mode)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(
    `${STORYBOOK_URL}/iframe.html?id=components-text-input--with-error&viewMode=story`,
  );
  await page.waitForSelector('hx-text-input');
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot('hx-text-input--error-dark.png', {
    animations: 'disabled',
  });
});
```

Dark mode baselines are separate files from light mode baselines. Store them with descriptive names that include the mode.

## CI Integration

The GitHub Actions workflow runs VRT after Storybook is built and served:

```yaml
# .github/workflows/ci.yml (relevant portion)
- name: Build Storybook
  run: npm run build:storybook

- name: Serve Storybook
  run: npx serve storybook-static --port 3151 &
  # The & runs it in the background

- name: Wait for Storybook
  run: npx wait-on http://localhost:3151 --timeout 60000

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium firefox webkit

- name: Run Visual Regression Tests
  run: npx playwright test
  env:
    CI: true

- name: Upload VRT results
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: vrt-results
    path: packages/hx-library/.cache/vrt-results/
```

In CI:

- `forbidOnly: !!process.env.CI` prevents `.only` tests from accidentally blocking all other tests
- `retries: 2` handles transient rendering timing issues
- `workers: 1` prevents race conditions between browser instances
- The results artifact captures diffs and traces only on failure to keep artifact size small

### What Happens When VRT Fails in CI

1. The CI pipeline marks the step as failed
2. The `vrt-results` artifact is uploaded (diffs, traces, actual vs expected images)
3. The developer downloads the artifact and reviews which pixels changed
4. If the change is intentional: update baselines locally with `--update-snapshots`, commit the new PNGs, push
5. If the change is a regression: fix the CSS or component code

## What to Test Visually vs What to Test with Unit Tests

Not everything needs a screenshot. Apply this filter when deciding whether to write a VRT:

**Test visually when:**

- You need to verify color, spacing, or font rendering
- The feature is purely visual (drop shadows, gradients, focus rings)
- You want to catch CSS regression from design token changes
- You're verifying a component's appearance across browsers (Firefox, WebKit)

**Test with unit tests when:**

- You need to verify DOM structure or attributes
- You need to verify event dispatch or payload
- You need to verify JavaScript logic or state
- You need to verify form participation or validation

**Examples:**

```
// ✅ Worth a VRT
hx-button variant=ghost should have transparent background
hx-text-input error state should show red border and error text
hx-badge variant=warning should have amber background

// ❌ Not worth a VRT — unit test instead
hx-button should set aria-disabled="true" when disabled
hx-text-input should dispatch hx-input on keystroke
hx-checkbox should call form.requestSubmit() on check
```

## Running VRT Locally

Prerequisites: Storybook must be running on port 3151.

```bash
# Terminal 1: Start Storybook
npm run dev:storybook

# Terminal 2: Run all VRT
npx playwright test

# Run a specific component
npx playwright test -g "hx-button"

# Run in headed mode to watch the browser
npx playwright test --headed

# View the HTML report after a run
npx playwright show-report

# Update baselines (after intentional visual change)
npx playwright test --update-snapshots
```

The first time you run VRT on a fresh checkout, Playwright will create the baseline screenshots because none exist yet. Review them carefully before committing.

## Snapshot File Naming

Playwright generates snapshot paths from the test name and `snapshotPathTemplate` in the config:

```
snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}'
```

For the test `hx-button - Primary` with screenshot name `hx-button--primary.png`, the file is stored at:

```
packages/hx-library/__screenshots__/
  vrt.spec.ts/
    hx-button--primary.png        # Chromium
    hx-button--primary-firefox.png  # Firefox (if multi-browser)
    hx-button--primary-webkit.png   # WebKit (if multi-browser)
```

When using multiple browser projects, Playwright appends the browser name automatically. Review the generated paths after your first run to confirm the naming matches your expectations.

---

**Related:**

- [Storybook Interaction Tests](/components/documentation/storybook-interaction) — `play()` functions for behavioral testing in Storybook
- [Testing Events](/components/testing/event-testing) — Unit testing event dispatch and payloads
- [Storybook Documentation](/components/documentation/storybook) — Setting up stories that serve as VRT targets
