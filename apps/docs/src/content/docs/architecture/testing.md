---
title: Testing Strategy
description: Enterprise testing approach with Vitest 4.x, Chromatic, and axe-core for HELIX
---

HELIX follows a comprehensive testing strategy designed for enterprise healthcare compliance.

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

### Visual Regression - Chromatic

- Automated screenshot comparison
- Cross-browser consistency
- Theme variation testing (light/dark/high-contrast)
- Responsive breakpoint verification

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
