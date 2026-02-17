---
title: Dark Mode & Color Schemes
description: Implementing automatic and manual dark mode support in web components using CSS custom properties.
---

Dark mode is a standard user expectation in enterprise software. HELiX components support dark mode through the same CSS custom property cascade that powers the entire token system — no JavaScript framework required, no component internals touched. Swap semantic token values at the document level and every component on the page adapts automatically.

This guide covers everything from the `prefers-color-scheme` media query inside shadow DOM, to manual overrides with `[data-theme]`, to `hx-card` dark mode in practice, to testing both color schemes in Vitest browser mode.

---

## Prerequisites

Before implementing dark mode, ensure you understand:

- [Design Token Architecture](/components/styling/tokens) — Three-tier token system (Primitive → Semantic → Component)
- [Theming Web Components](/components/styling/theming) — How CSS custom properties inherit through shadow boundaries
- [Component Styling Fundamentals](/components/styling/fundamentals) — `:host`, CSS parts, Shadow DOM encapsulation

---

## How Dark Mode Works in Shadow DOM

CSS custom properties inherit across shadow boundaries. This is the foundational mechanism that makes dark mode work without any changes to component internals. A component defined in shadow DOM reads `--hx-card-bg` from its local styles. That value resolves by walking up the ancestor tree, crossing the shadow boundary, until it finds a definition. When you redefine `--hx-card-bg` (or the semantic token it references) on `:root` for dark mode, every component on the page picks up the new value on the next render.

Regular CSS selectors cannot reach inside a shadow root. CSS custom properties can. Dark mode in HELiX exploits this intentional W3C design decision.

### The Three-Level Resolution

For a property like the card background color:

```
Consumer sets: [data-theme="dark"] { --hx-color-neutral-0: #212529; }
                                    ↓
hx-card reads: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff))
                                    ↓
Step 1: --hx-card-bg defined? No. Fall through.
Step 2: --hx-color-neutral-0 defined? Yes — #212529 (dark mode override).
Step 3: Browser renders card with dark background.
```

No component code changes. No properties to set. Just CSS cascade.

---

## Design Token Architecture for Light and Dark

HELiX separates token concerns across two layers:

**Primitive tokens** — raw color values, never change between themes:

```css
/* These never change — they are the palette */
--hx-neutral-0: #ffffff;
--hx-neutral-50: #f8f9fa;
--hx-neutral-800: #343a40;
--hx-neutral-900: #212529;
--hx-blue-500: #3b82f6;
--hx-blue-400: #60a5fa;
```

**Semantic tokens** — purpose-based references that swap between themes:

```css
/* Light theme — semantic tokens point to light primitives */
:root {
  --hx-color-neutral-0: #ffffff; /* Surface background */
  --hx-color-neutral-50: #f8f9fa; /* Raised surface */
  --hx-color-neutral-200: #e9ecef; /* Border */
  --hx-color-neutral-600: #6c757d; /* Secondary text */
  --hx-color-neutral-800: #343a40; /* Primary text */
  --hx-color-neutral-900: #212529; /* Heading text */
  --hx-color-primary-500: #3b82f6; /* Brand / interactive (stays the same) */
  --hx-focus-ring-color: #3b82f6;
}

/* Dark theme — same tokens, different primitives */
[data-theme='dark'] {
  --hx-color-neutral-0: #212529; /* Surface background (inverted) */
  --hx-color-neutral-50: #343a40; /* Raised surface (inverted) */
  --hx-color-neutral-200: #495057; /* Border (darker range) */
  --hx-color-neutral-600: #ced4da; /* Secondary text (light range) */
  --hx-color-neutral-800: #f1f5f9; /* Primary text (light range) */
  --hx-color-neutral-900: #ffffff; /* Heading text (pure white) */
  --hx-color-primary-500: #3b82f6; /* Brand color unchanged */
  --hx-focus-ring-color: #60a5fa; /* Slightly lighter for dark bg contrast */
}
```

Key insight: `--hx-color-primary-500` does not change. Brand identity is preserved across both themes. Only neutral colors — surfaces, text, borders — invert. This is the correct model for healthcare design systems where the brand teal or blue carries safety signal meaning.

### Shadow and Surface Adjustments

In dark mode, shadows become less visible against dark surfaces. Increase opacity to maintain depth perception:

```css
/* Light theme shadows */
:root {
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --hx-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

/* Dark theme shadows — higher opacity for visibility */
[data-theme='dark'] {
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.2);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --hx-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);
}
```

---

## Method 1: System Preference (Automatic)

The `prefers-color-scheme` media query detects the user's OS-level dark mode setting. Use it to automatically apply dark tokens without any JavaScript:

```css
/* Default light theme */
:root {
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-800: #343a40;
  --hx-color-neutral-200: #e9ecef;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Automatic dark mode — no JavaScript needed */
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-neutral-0: #212529;
    --hx-color-neutral-800: #f1f5f9;
    --hx-color-neutral-200: #495057;
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  }
}
```

**Inside shadow DOM:** Media queries inside a component's `static styles` work identically. The component responds to the same `prefers-color-scheme` media query as the rest of the page. However, the preferred pattern is to let semantic tokens handle the swap at the document level — keep media queries out of component stylesheets entirely.

```typescript
// hx-card.styles.ts — no media queries needed in the component
export const helixCardStyles = css`
  .card {
    /* Token cascade handles dark mode automatically */
    background-color: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-card-color, var(--hx-color-neutral-800, #212529));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
  }
`;
```

When `--hx-color-neutral-0` is overridden by the `prefers-color-scheme` media query on `:root`, the card inherits the new value. The component is theme-agnostic by design.

---

## Method 2: Manual Override with `[data-theme]`

For user-controlled theme switching, use a `data-theme` attribute on the root element. This gives consumers explicit control independent of the OS preference:

```css
/* Explicit dark mode — set via JavaScript */
[data-theme='dark'] {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-50: #343a40;
  --hx-color-neutral-200: #495057;
  --hx-color-neutral-600: #ced4da;
  --hx-color-neutral-800: #f1f5f9;
  --hx-color-neutral-900: #ffffff;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}

/* Explicit light mode — force light even if OS is dark */
[data-theme='light'] {
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-50: #f8f9fa;
  --hx-color-neutral-200: #e9ecef;
  --hx-color-neutral-600: #6c757d;
  --hx-color-neutral-800: #343a40;
  --hx-color-neutral-900: #212529;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

Toggle via JavaScript:

```javascript
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hx-theme-preference', theme);
}

// Restore on page load (before first render to avoid flash)
const saved = localStorage.getItem('hx-theme-preference');
if (saved) {
  document.documentElement.setAttribute('data-theme', saved);
}
```

Usage with an HELiX button:

```html
<hx-button onclick="setTheme('dark')">Dark Mode</hx-button>
<hx-button onclick="setTheme('light')">Light Mode</hx-button>
```

---

## Method 3: Hybrid (Recommended)

The production-grade pattern combines both methods. Respect the OS preference by default. Allow users to override it. Persist the override across sessions.

```css
/* Default: light theme */
:root {
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-800: #343a40;
  --hx-color-neutral-200: #e9ecef;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Auto: respect OS preference, unless overridden by [data-theme] */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-neutral-0: #212529;
    --hx-color-neutral-800: #f1f5f9;
    --hx-color-neutral-200: #495057;
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  }
}

/* Manual override: dark — wins over everything */
:root[data-theme='dark'] {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-800: #f1f5f9;
  --hx-color-neutral-200: #495057;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
}
```

Three-state theme manager:

```typescript
type ThemePreference = 'light' | 'dark' | 'auto';

class HelixThemeManager {
  private readonly storageKey = 'hx-theme-preference';

  constructor() {
    this.restorePreference();
    this.watchSystemChanges();
  }

  private restorePreference(): void {
    const saved = localStorage.getItem(this.storageKey) as ThemePreference | null;
    if (saved) this.apply(saved);
  }

  private watchSystemChanges(): void {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      // Only react if the user has not set a manual preference
      if (this.getPreference() === 'auto') {
        // Remove and re-add nothing — the media query handles the CSS
        document.documentElement.removeAttribute('data-theme');
      }
    });
  }

  getPreference(): ThemePreference {
    return (localStorage.getItem(this.storageKey) as ThemePreference) ?? 'auto';
  }

  getEffectiveTheme(): 'light' | 'dark' {
    const pref = this.getPreference();
    if (pref !== 'auto') return pref;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  apply(preference: ThemePreference): void {
    localStorage.setItem(this.storageKey, preference);
    if (preference === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', preference);
    }
  }

  cycle(): void {
    const order: ThemePreference[] = ['auto', 'light', 'dark'];
    const current = this.getPreference();
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.apply(next);
  }
}

export const themeManager = new HelixThemeManager();
```

Avoid flash of unstyled content (FOUC) by applying the saved preference before the page renders. Place this inline script in `<head>`, before any stylesheets load:

```html
<head>
  <script>
    // Inline — runs synchronously before first paint
    (function () {
      var saved = localStorage.getItem('hx-theme-preference');
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      }
    })();
  </script>
  <link rel="stylesheet" href="/styles/tokens.css" />
</head>
```

---

## The `:host` Selector for Component-Level Dark Mode

Each HELiX component exposes its shadow root's `:host` for direct token overrides. This enables isolated dark sections without changing the document theme:

```css
/* Force a single card into dark mode regardless of document theme */
hx-card.dark-panel {
  --hx-card-bg: #212529;
  --hx-card-color: #f1f5f9;
  --hx-card-border-color: #495057;
}
```

The component's shadow DOM reads these tokens from the light DOM host element, crossing the shadow boundary via inheritance. This technique is useful for footer panels, hero sections, or sidebars that must be dark while the rest of the page remains light.

### `:host-context()` for Parent Theme Inheritance

The `:host-context()` selector matches when a given CSS selector applies to any ancestor of the host element, including ancestors outside the shadow root. Use it inside a component's styles to respond to an ancestor's theme class:

```typescript
// Component styles responding to an ancestor [data-theme="dark"]
export const helixCardStyles = css`
  :host-context([data-theme='dark']) .card {
    /* Apply dark styling when any ancestor has data-theme="dark" */
    background-color: var(--hx-card-bg, #212529);
    color: var(--hx-card-color, #f1f5f9);
    border-color: var(--hx-card-border-color, #495057);
  }
`;
```

**Important caveat:** `:host-context()` has limited cross-browser support as of early 2026 and is not in the CSS specification baseline. Prefer the token cascade approach — it is more robust, more performant, and fully cross-browser. Only use `:host-context()` when you need component styles to react to a class on a distant ancestor that cannot set tokens.

---

## Practical Example: `hx-card` with Dark Mode

Here is how `hx-card` handles dark mode in its actual implementation. The component's styles are entirely token-based — no hardcoded colors, no media queries, no theme logic:

```typescript
// hx-card.styles.ts (abbreviated)
import { css } from 'lit';

export const helixCardStyles = css`
  :host {
    display: block;
  }

  .card {
    display: flex;
    flex-direction: column;

    /* Three-level fallback: component token → semantic → primitive */
    background-color: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-card-color, var(--hx-color-neutral-800, #212529));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
    border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));
    overflow: hidden;
    font-family: var(--hx-font-family-sans, sans-serif);

    /* Transition applies to both themes — keeps shadow changes smooth */
    transition:
      box-shadow var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease);
  }

  .card--raised {
    box-shadow: var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  }

  .card__heading {
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    padding-bottom: 0;
    font-size: var(--hx-font-size-xl, 1.25rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .card__body {
    padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
    flex: 1;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    /* Note: body color pulls from a slightly muted neutral */
    color: var(--hx-color-neutral-600, #6c757d);
  }
`;
```

The consumer's theme stylesheet does all the work:

```css
/* themes/helix.css — applied once, affects every component */

:root {
  /* Light theme defaults */
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-50: #f8f9fa;
  --hx-color-neutral-200: #e9ecef;
  --hx-color-neutral-600: #6c757d;
  --hx-color-neutral-800: #343a40;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-neutral-0: #212529;
    --hx-color-neutral-50: #343a40;
    --hx-color-neutral-200: #495057;
    --hx-color-neutral-600: #adb5bd; /* Lighter muted text on dark bg */
    --hx-color-neutral-800: #f1f5f9;
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  }
}

:root[data-theme='dark'] {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-50: #343a40;
  --hx-color-neutral-200: #495057;
  --hx-color-neutral-600: #adb5bd;
  --hx-color-neutral-800: #f1f5f9;
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
}
```

Usage — the markup never changes between themes:

```html
<hx-card elevation="raised">
  <div slot="heading">Patient Summary</div>
  <p>Blood pressure: 120/80 — within normal range.</p>
  <div slot="actions">
    <hx-button variant="primary">View Chart</hx-button>
  </div>
</hx-card>
```

In light mode: white card, dark text, light border, soft shadow.
In dark mode: the same markup renders with a dark surface, light text, dark border, and higher-opacity shadow. No attribute changes. No JavaScript property changes on the component.

---

## Alert Variant Colors in Dark Mode

HELiX `hx-alert` uses feedback color tokens (`--hx-color-info-*`, `--hx-color-success-*`, etc.) that may need adjustment in dark mode for sufficient contrast. The WCAG 2.1 AA requirement is 4.5:1 for text, 3:1 for UI components.

Light mode alert backgrounds (very light tints) become nearly invisible on dark surfaces. Override the feedback color tokens for dark mode:

```css
[data-theme='dark'] {
  /* Info: lighter text, darker tinted background */
  --hx-color-info-50: #0c1a2e;
  --hx-color-info-200: #1e3a5f;
  --hx-color-info-800: #bfdbfe;

  /* Success */
  --hx-color-success-50: #052e16;
  --hx-color-success-200: #14532d;
  --hx-color-success-800: #bbf7d0;

  /* Warning */
  --hx-color-warning-50: #2d1a00;
  --hx-color-warning-200: #7c3700;
  --hx-color-warning-800: #fde68a;

  /* Error */
  --hx-color-error-50: #2d0404;
  --hx-color-error-200: #7f1d1d;
  --hx-color-error-800: #fecaca;
}
```

With these overrides, `hx-alert` renders dark-tinted backgrounds with light text in dark mode, maintaining the semantic color identity (blue = info, green = success, etc.) while achieving adequate contrast.

---

## Drupal Integration

In Drupal, add a theme library for HELiX tokens and apply dark mode overrides in a single CSS file:

```yaml
# mysite.libraries.yml
helix-tokens:
  css:
    theme:
      css/helix-tokens.css: {}
```

```css
/* css/helix-tokens.css */
:root {
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-800: #343a40;
  --hx-color-primary-500: #007878; /* Healthcare teal brand */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-neutral-0: #212529;
    --hx-color-neutral-800: #f1f5f9;
  }
}

[data-theme='dark'] {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-800: #f1f5f9;
}
```

In your `page.html.twig`, attach the library and add the theme toggle button:

```twig
{# templates/page.html.twig #}
{{ attach_library('mysite/helix-tokens') }}

<hx-button
  id="theme-toggle"
  variant="ghost"
  aria-label="Toggle dark mode"
>
  Toggle Theme
</hx-button>

<script>
  (function () {
    var btn = document.getElementById('theme-toggle');
    var html = document.documentElement;
    btn.addEventListener('click', function () {
      var current = html.getAttribute('data-theme');
      html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });
  })();
</script>
```

HELiX components loaded via CDN or Drupal libraries inherit the tokens automatically — no per-component configuration required.

---

## Testing Dark Mode

Vitest browser mode runs in real Chromium, which means you can manipulate CSS custom properties directly in tests to simulate dark mode without requiring system-level preference emulation.

### Testing Token Inheritance

```typescript
// hx-card.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, html, cleanup } from '@open-wc/testing';
import '../src/components/hx-card/hx-card.js';

describe('hx-card dark mode', () => {
  afterEach(() => cleanup());

  it('inherits dark surface token from ancestor', async () => {
    // Simulate dark mode by setting the token on an ancestor
    const wrapper = document.createElement('div');
    wrapper.style.setProperty('--hx-color-neutral-0', '#212529');
    document.body.appendChild(wrapper);

    const el = await fixture<HTMLElement>(html`<hx-card></hx-card>`, {
      parentNode: wrapper,
    });

    const card = el.shadowRoot!.querySelector('.card') as HTMLElement;
    const bg = getComputedStyle(card).backgroundColor;

    // #212529 = rgb(33, 37, 41)
    expect(bg).toBe('rgb(33, 37, 41)');

    document.body.removeChild(wrapper);
  });

  it('uses light defaults when no override is set', async () => {
    const el = await fixture<HTMLElement>(html`<hx-card></hx-card>`);
    const card = el.shadowRoot!.querySelector('.card') as HTMLElement;
    const bg = getComputedStyle(card).backgroundColor;

    // Default: #ffffff = rgb(255, 255, 255)
    expect(bg).toBe('rgb(255, 255, 255)');
  });
});
```

### Testing the `[data-theme]` Attribute Approach

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixture, html, cleanup } from '@open-wc/testing';

describe('dark mode via data-theme attribute', () => {
  beforeEach(() => {
    // Inject test token overrides
    const style = document.createElement('style');
    style.id = 'test-dark-tokens';
    style.textContent = `
      [data-theme="dark"] {
        --hx-color-neutral-0: #212529;
        --hx-color-neutral-800: #f1f5f9;
        --hx-color-neutral-200: #495057;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('test-dark-tokens')?.remove();
    cleanup();
  });

  it('card updates when document theme switches to dark', async () => {
    const el = await fixture<HTMLElement>(html`<hx-card></hx-card>`);
    const card = el.shadowRoot!.querySelector('.card') as HTMLElement;

    // Light: white background
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(255, 255, 255)');

    // Apply dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    await el.updateComplete;

    // Dark: #212529 background
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(33, 37, 41)');
  });

  it('card border color updates in dark mode', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const el = await fixture<HTMLElement>(html`<hx-card></hx-card>`);
    await el.updateComplete;

    const card = el.shadowRoot!.querySelector('.card') as HTMLElement;
    const border = getComputedStyle(card).borderColor;

    // Dark border: #495057 = rgb(73, 80, 87)
    expect(border).toBe('rgb(73, 80, 87)');
  });
});
```

### Playwright Visual Regression

For visual regression tests across themes, use Playwright's `--force-dark-mode` flag and the `colorScheme` option:

```typescript
// e2e/dark-mode.spec.ts
import { test, expect } from '@playwright/test';

test.describe('dark mode visual regression', () => {
  test('hx-card renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/storybook/iframe.html?id=components-hx-card--default');
    await expect(page).toHaveScreenshot('hx-card-dark.png');
  });

  test('hx-alert variants in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/storybook/iframe.html?id=components-hx-alert--all-variants');
    await expect(page).toHaveScreenshot('hx-alert-dark.png');
  });

  test('manual dark theme via data-theme attribute', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=components-hx-card--default');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(page).toHaveScreenshot('hx-card-data-theme-dark.png');
  });
});
```

---

## WCAG Contrast Verification

Every dark mode color combination must meet WCAG 2.1 AA:

- **4.5:1** minimum for normal text (body copy, labels)
- **3:1** minimum for large text (18pt+ or 14pt+ bold) and UI components (borders, icons)

Spot-check critical combinations in dark mode:

| Context             | Foreground                         | Background                         | Minimum Ratio |
| ------------------- | ---------------------------------- | ---------------------------------- | ------------- |
| Body text           | `--hx-color-neutral-800` (#f1f5f9) | `--hx-color-neutral-0` (#212529)   | 4.5:1         |
| Card border         | `--hx-color-neutral-200` (#495057) | `--hx-color-neutral-0` (#212529)   | 3:1           |
| Primary button text | #ffffff                            | `--hx-color-primary-500` (#3b82f6) | 4.5:1         |
| Focus ring          | `--hx-focus-ring-color` (#60a5fa)  | dark surface (#212529)             | 3:1           |

Use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or Chrome DevTools' Accessibility panel to verify ratios during token definition.

---

## Common Mistakes

**Hardcoding colors in component styles.** Any hardcoded hex value in a component's `static styles` will not respond to theme changes. Every color must reference a token.

**Defining media queries inside component stylesheets.** This works but is fragile — it duplicates theme logic inside the component. Prefer defining dark mode overrides on `:root` or `[data-theme]` in the document stylesheet, and let the token cascade do the rest.

**Forgetting feedback colors.** Info, success, warning, and error color tokens (`--hx-color-info-*`, etc.) have light-tint backgrounds that look wrong on dark surfaces. Always include dark overrides for these when enabling dark mode.

**Not testing with `prefers-color-scheme: dark` AND `[data-theme="dark"]` separately.** The hybrid approach uses different CSS selectors for each. Test both paths independently to catch specificity issues.

**Missing FOUC protection.** If the theme preference is restored after the first render, users see a flash. Apply the saved `[data-theme]` attribute synchronously in a `<head>` inline script.

---

## Summary

Dark mode in HELiX works because CSS custom properties inherit through shadow boundaries. Components are theme-agnostic by design — they read semantic tokens and render. The consumer's stylesheet is the only place where light and dark values are defined.

**Key takeaways:**

- Define all colors using `--hx-` semantic tokens with primitive fallbacks — never hardcode hex values in components
- Override semantic tokens on `:root` or `[data-theme]` in the document stylesheet — components respond automatically
- Use the hybrid approach (`prefers-color-scheme` + `[data-theme]`) for maximum flexibility
- Override feedback color tokens (`--hx-color-info-50`, etc.) in dark mode — their default tints are too light for dark surfaces
- Protect against FOUC with an inline `<head>` script that restores the saved preference before first render
- Test dark mode by setting tokens directly on wrapper elements in Vitest and by using `page.emulateMedia()` in Playwright
- Verify WCAG 2.1 AA contrast ratios for every dark mode color combination

---

## Next Steps

- [Animations & Transitions](/components/styling/animations) — `prefers-reduced-motion` and animation tokens
- [Design Token Architecture](/components/styling/tokens) — Complete three-tier token system reference
- [Theming Web Components](/components/styling/theming) — Full theming strategies and multi-brand patterns
- [Responsive Components](/components/styling/responsive) — Container queries and adaptive layouts

---

## Sources

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [web.dev: Dark mode best practices](https://web.dev/articles/prefers-color-scheme)
- [WCAG 2.1: Contrast (Minimum) — 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Playwright: emulateMedia colorScheme](https://playwright.dev/docs/api/class-page#page-emulate-media)
- [web.dev: Shadow DOM v1](https://web.dev/articles/shadowdom-v1)
- [CSS Tricks: Dark Mode in CSS](https://css-tricks.com/dark-modes-with-css/)
