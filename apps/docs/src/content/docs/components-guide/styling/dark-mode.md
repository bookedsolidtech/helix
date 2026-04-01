---
title: Dark Mode
description: Implement dark mode in HELiX components using prefers-color-scheme, host-context, and class-based theme switching.
---

HELiX components support dark mode through CSS custom property overrides. Because tokens control all visual values, switching to dark mode is a matter of redefining the relevant tokens under the appropriate CSS selector — no component logic changes are required.

## `prefers-color-scheme` Media Query

The most basic dark mode implementation responds automatically to the operating system preference. Inside a component stylesheet, the `:host` selector is used inside the media query:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-surface')
export class HelixSurface extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host {
        display: block;
        background: var(--hx-color-neutral-0);
        color: var(--hx-color-neutral-900);
        padding: var(--hx-spacing-lg);
        border-radius: var(--hx-border-radius-md);
        transition: background var(--hx-motion-duration-fast) var(--hx-motion-easing-standard),
                    color var(--hx-motion-duration-fast) var(--hx-motion-easing-standard);
      }

      @media (prefers-color-scheme: dark) {
        :host {
          background: var(--hx-color-neutral-900);
          color: var(--hx-color-neutral-50);
        }
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}
```

## `:host-context()` for Class-Based Theming

When an application needs to toggle dark mode programmatically (a "dark mode" switch in the UI, for example), use `:host-context()` to respond to an ancestor element's class or data attribute:

```typescript
static override styles = [
  tokenStyles,
  css`
    :host {
      display: block;
      background: var(--hx-color-neutral-0);
      color: var(--hx-color-neutral-900);
    }

    /* Activated when any ancestor has data-theme="dark" */
    :host-context([data-theme="dark"]) {
      background: var(--hx-color-neutral-900);
      color: var(--hx-color-neutral-50);
    }
  `,
];
```

The `:host-context()` selector matches if the component itself or any of its ancestors matches the argument. It crosses shadow DOM boundaries, which makes it ideal for class-based theming systems.

## Dark Mode Token Variants

The preferred HELiX pattern defines dark-mode token overrides at the application level rather than inside each component. This way, the components themselves only reference tokens and dark mode is handled by a single theme definition:

```css
/* Application global stylesheet */

/* Light mode (default) */
:root {
  --hx-color-surface: var(--hx-color-neutral-0);
  --hx-color-on-surface: var(--hx-color-neutral-900);
  --hx-color-border: var(--hx-color-neutral-200);
}

/* Dark mode via OS preference */
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-surface: var(--hx-color-neutral-900);
    --hx-color-on-surface: var(--hx-color-neutral-50);
    --hx-color-border: var(--hx-color-neutral-700);
  }
}

/* Dark mode via explicit data attribute */
[data-theme="dark"] {
  --hx-color-surface: var(--hx-color-neutral-900);
  --hx-color-on-surface: var(--hx-color-neutral-50);
  --hx-color-border: var(--hx-color-neutral-700);
}
```

Components then use the semantic tokens and are dark-aware automatically:

```typescript
static override styles = [
  tokenStyles,
  css`
    :host {
      background: var(--hx-color-surface);
      color: var(--hx-color-on-surface);
      border: 1px solid var(--hx-color-border);
    }
  `,
];
```

## Class-Based Theme Switching

Toggle dark mode from JavaScript by setting a `data-theme` attribute on `document.documentElement`:

```typescript
type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    delete root.dataset.theme;
    // Falls back to prefers-color-scheme
  } else {
    root.dataset.theme = theme;
  }

  // Persist preference
  localStorage.setItem('hx-theme', theme);
}

// Read saved preference on startup
const saved = localStorage.getItem('hx-theme') as Theme | null;
if (saved) {
  applyTheme(saved);
}

// Expose to UI toggle
document.querySelector('#theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme ?? 'system';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
```

## Full Component Dark Mode Example

A complete `hx-badge` component that supports both OS-level and class-based dark mode:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-badge')
export class HelixBadge extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        padding: var(--hx-spacing-xs) var(--hx-spacing-sm);
        border-radius: var(--hx-border-radius-full);
        font-size: var(--hx-font-size-xs);
        font-weight: var(--hx-font-weight-semibold);
        background: var(--hx-color-primary-100);
        color: var(--hx-color-primary-800);
        transition: background var(--hx-motion-duration-fast),
                    color var(--hx-motion-duration-fast);
      }

      @media (prefers-color-scheme: dark) {
        :host {
          background: var(--hx-color-primary-900);
          color: var(--hx-color-primary-100);
        }
      }

      :host-context([data-theme="dark"]) {
        background: var(--hx-color-primary-900);
        color: var(--hx-color-primary-100);
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}
```

## Next Steps

- [Theming](/components-guide/styling/theming/) — global and scoped token overrides
- [Animations and Transitions](/components-guide/styling/animations/) — `prefers-reduced-motion` alongside dark mode
- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — expose dark mode style hooks per component
