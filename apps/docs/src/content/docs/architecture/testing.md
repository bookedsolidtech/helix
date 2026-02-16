---
title: Testing Strategy
description: Enterprise testing approach with Vitest 4.x, Chromatic, and axe-core for HELIX
---

HELIX follows a comprehensive testing strategy designed for enterprise compliance.

## Testing Pyramid

```
          ╱╲
         ╱  ╲         E2E Tests (Playwright)
        ╱────╲        Visual Regression (Chromatic)
       ╱      ╲
      ╱────────╲      Integration Tests
     ╱          ╲     Accessibility Audits (axe-core)
    ╱────────────╲
   ╱              ╲   Unit Tests (Vitest 4.x Browser Mode)
  ╱────────────────╲
```

## Test Types

### Unit Tests - Vitest 4.x Browser Mode

- Real DOM testing (not jsdom)
- Component lifecycle testing
- Reactive property testing
- Event handling verification

### Visual Regression Testing

HELIX uses Playwright for visual regression testing to catch unintended UI changes across browsers.

#### Running VRT Locally

```bash
# Start Storybook (required)
npm run dev:storybook

# Run VRT tests
npm run test:vrt

# Generate new baselines after intentional UI changes
npm run test:vrt:update
```

#### Browser Coverage

VRT runs against three browsers:

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

#### Updating Baselines

When you intentionally change component appearance:

1. Verify the change is correct in Storybook
2. Update baselines: `npm run test:vrt:update`
3. Review the updated screenshots in `packages/hx-library/__screenshots__/`
4. Commit the updated screenshots with your PR

#### CI Integration

VRT runs automatically on every PR. If tests fail:

1. Check the CI artifacts for diff images showing what changed
2. If the change is intentional, update baselines locally and push
3. If the change is a bug, fix the component code

#### Screenshot Storage

- Location: `packages/hx-library/__screenshots__/vrt.spec.ts/`
- Format: PNG images named `{component}--{variant}.png`
- One baseline per component variant (shared across browsers)
- Baselines are committed to git for version control

#### Adding New VRT Tests

To add VRT coverage for a new component or variant:

1. Create the Storybook story first
2. Add the variant to `COMPONENT_VARIANTS` in `packages/hx-library/e2e/vrt.spec.ts`
3. Run `npm run test:vrt:update` to generate baselines
4. Commit the new screenshots

### Accessibility - axe-core

- Automated WCAG 2.1 AA compliance checks
- Color contrast verification
- ARIA attribute validation
- Keyboard navigation testing

### Integration Tests

- Component composition testing
- Slot content rendering
- Form participation (ElementInternals)
- Drupal Behaviors integration

## Coverage Targets

| Category          | Target                 |
| ----------------- | ---------------------- |
| Unit tests        | >90% line coverage     |
| Accessibility     | 100% axe-core pass     |
| Visual regression | All component variants |
| Integration       | Critical user flows    |

See the [Pre-Planning Component Architecture](/pre-planning/components/) for detailed testing patterns.
