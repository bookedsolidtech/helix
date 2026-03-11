---
title: Theming Web Components
description: Complete guide to CSS custom properties cascade through Shadow DOM, theming strategies, dark mode implementation, theme switching patterns, and design system integration for wc-2026 components.
sidebar:
  order: 4
---

Theming web components requires understanding how CSS custom properties pierce through Shadow DOM boundaries while maintaining encapsulation. This comprehensive guide explores how wc-2026's three-tier token architecture enables powerful, performant theming across all consumption contexts — from Drupal CMS to React, Vue, Angular, and vanilla HTML.

Master the cascade, understand token resolution, implement dark mode, build theme switchers, and integrate wc-2026 components into any design system.

---

## Prerequisites

Before diving into theming, ensure you understand:

- [Component Styling Fundamentals](/components/styling/fundamentals) — Shadow DOM, `:host`, CSS encapsulation
- [Design Token Architecture](/components/styling/tokens) — Three-tier token system (Primitive → Semantic → Component)
- Basic CSS custom properties syntax (`--property-name`, `var()`)
- CSS cascade and inheritance rules

---

## The Shadow DOM Theming Challenge

Web Components use Shadow DOM for style encapsulation. This creates a natural barrier that prevents external CSS from reaching component internals:

```html
<!-- Global CSS cannot reach inside -->
<hx-button>
  #shadow-root (open)
  <style>
    /* Component styles */
  </style>
  <button class="button">Click Me</button>
</hx-button>
```

Traditional CSS selectors stop at the shadow boundary:

```css
/* This will NOT work */
hx-button .button {
  background: #007878;
}

/* This will NOT work either */
hx-button button {
  color: white;
}
```

**This is intentional.** Shadow DOM encapsulation prevents style leaks and protects component internals from external interference. But it creates a problem: How do consumers theme components without breaking encapsulation?

### CSS Custom Properties: The Exception

CSS custom properties (CSS variables) are unique — they **inherit across shadow boundaries**. This is not a bug; it is a W3C design decision that makes them the perfect theming mechanism for Web Components.

```css
/* External stylesheet */
:root {
  --hx-color-primary-500: #007878;
}
```

```css
/* Inside hx-button's Shadow DOM */
.button {
  background-color: var(--hx-color-primary-500, #2563eb);
}
```

The component's shadow root inherits `--hx-color-primary-500` from the document's `:root`. When a consumer overrides the token, all components using it update automatically. No JavaScript required. No re-rendering. Just pure CSS cascade.

### How Inheritance Works Across Shadow Boundaries

CSS custom properties inherit like any other inherited property (`color`, `font-family`, `line-height`). When the browser computes styles for an element inside shadow DOM, it walks up the ancestor tree — crossing shadow boundaries — to resolve inherited values.

```html
<style>
  :root {
    --hx-color-primary-500: #2563eb; /* Default blue */
  }

  .teal-section {
    --hx-color-primary-500: #007878; /* Override with teal */
  }
</style>

<hx-button>Normal button</hx-button>
<!-- Uses #2563eb -->

<div class="teal-section">
  <hx-button>Teal section button</hx-button>
  <!-- Uses #007878 -->
</div>
```

The component doesn't need to know about `.teal-section`. It consumes the token and lets the cascade handle the rest. This is the power of inheritance-based theming.

---

## CSS Custom Properties Cascade Through Shadow DOM

Understanding the cascade is essential for effective theming. Let's trace how a token resolves from `:root` to component render.

### Token Resolution Flow

When a user sees a blue button background, tokens resolve through multiple layers:

```
User sees blue button background
  ↓
.button { background: var(--hx-button-bg); }
  ↓
Component token undefined, fallback to semantic:
  var(--hx-color-primary-500, #2563eb)
  ↓
--hx-color-primary-500 inherits from :root
  ↓
:root { --hx-color-primary-500: #2563eb; }
  ↓
Final computed value: #2563eb
```

If a consumer overrides `--hx-color-primary-500` at any ancestor level, the cascade uses that value instead.

### Cascade Specificity Hierarchy

The browser resolves custom property values in this order (highest specificity wins):

```
1. Inline styles (style="--hx-button-bg: red;")
   ↓
2. Class-based overrides (.primary-button { --hx-button-bg: blue; })
   ↓
3. Component-type overrides (hx-button { --hx-button-bg: green; })
   ↓
4. Section-level overrides (.hero { --hx-color-primary-500: teal; })
   ↓
5. Document-level overrides (:root { --hx-color-primary-500: blue; })
   ↓
6. Component internal defaults (:host { --hx-button-bg: var(--hx-color-primary-500); })
```

Later (more specific) overrides always win due to CSS specificity rules.

### Multi-Level Fallback Chains

wc-2026 components use two-level or three-level fallback chains to ensure robust token resolution:

**Two-level fallback (most common):**

```css
.card {
  background: var(--hx-color-neutral-0, #ffffff);
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Semantic token    | Primitive fallback
   */
}
```

**Three-level fallback (for component customization):**

```css
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Component token  | Semantic token     | Primitive fallback
   */
}
```

**Resolution order:**

1. `--hx-button-bg` (component token — most specific, optional)
2. `--hx-color-primary-500` (semantic token — global theming layer)
3. `#2563eb` (primitive fallback — last resort if everything unset)

This pattern ensures components always render correctly, even if consumers override nothing.

---

## Theming Strategies

wc-2026's token architecture enables multiple theming approaches, each suited to different use cases.

### Strategy 1: Global Brand Theming

**Use case:** Change the primary brand color, typography, or spacing across all components.

**Approach:** Override semantic tokens (Tier 2) at `:root`.

```css
/* Consumer's theme file */
:root {
  /* Rebrand to teal (wc-2026's primary color) */
  --hx-color-primary-50: #e6f7f7;
  --hx-color-primary-100: #cceff0;
  --hx-color-primary-200: #99dfe0;
  --hx-color-primary-300: #66cfd1;
  --hx-color-primary-400: #33bfc1;
  --hx-color-primary-500: #007878; /* Base teal */
  --hx-color-primary-600: #006666;
  --hx-color-primary-700: #005555;
  --hx-color-primary-800: #004444;
  --hx-color-primary-900: #003333;

  /* Update typography */
  --hx-font-family-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --hx-font-weight-semibold: 600;

  /* Rounder corners across all components */
  --hx-border-radius-md: 0.5rem;
  --hx-border-radius-lg: 0.75rem;
}
```

**Result:** All components that reference `--hx-color-primary-*`, `--hx-font-family-sans`, or `--hx-border-radius-*` update automatically. This is the **preferred approach** for brand customization.

**Why this works:** Components consume semantic tokens, so changing those tokens at `:root` cascades to every component on the page. No need to override individual component tokens.

### Strategy 2: Component-Specific Theming

**Use case:** Customize one component type without affecting others.

**Approach:** Override component tokens (Tier 3) using element selectors.

```css
/* Make all buttons pill-shaped and bold */
hx-button {
  --hx-button-border-radius: var(--hx-border-radius-full, 9999px);
  --hx-button-font-weight: var(--hx-font-weight-bold, 700);
}

/* Make all cards use elevated shadow */
hx-card {
  --hx-card-shadow: var(--hx-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1));
  --hx-card-padding: var(--hx-space-8, 2rem);
}

/* Make all text inputs larger */
hx-text-input {
  --hx-input-font-size: var(--hx-font-size-lg, 1.125rem);
  --hx-input-padding: var(--hx-space-4, 1rem);
}
```

**Result:** Only the specified component types change. Other components continue using global semantic tokens.

**Why this works:** Component tokens (Tier 3) have higher specificity than semantic tokens (Tier 2), so they override the global theme for specific components.

### Strategy 3: Contextual Theming

**Use case:** Apply different themes to specific sections of a page.

**Approach:** Override tokens on ancestor elements using CSS cascade.

```css
/* Hero section uses accent colors and large shadows */
.hero {
  --hx-color-primary-500: #ff6b35; /* Accent orange */
  --hx-shadow-md: var(--hx-shadow-xl); /* Upgrade shadows */
}

.hero hx-button {
  --hx-button-font-size: var(--hx-font-size-lg, 1.125rem);
}

/* Sidebar uses muted colors and tighter spacing */
.sidebar {
  --hx-color-neutral-0: #f8f9fa;
  --hx-space-4: 0.75rem;
  --hx-space-6: 1rem;
}

/* Footer uses dark theme even in light mode */
.footer {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-800: #f8f9fa;
  --hx-color-primary-500: #60a5fa;
}
```

**Usage:**

```html
<div class="hero">
  <hx-button>Get Started</hx-button>
  <!-- Uses orange accent and large font -->
</div>

<div class="sidebar">
  <hx-card>
    <div slot="heading">Quick Links</div>
    <p>Navigation content</p>
  </hx-card>
  <!-- Uses muted background and tighter spacing -->
</div>

<footer class="footer">
  <hx-button variant="secondary">Contact Us</hx-button>
  <!-- Dark theme, even if page is light -->
</footer>
```

**Why this works:** CSS custom properties inherit from parent to child, crossing shadow boundaries. Components inside `.hero`, `.sidebar`, or `.footer` inherit those overrides automatically.

### Strategy 4: Scoped Multi-Tenant Themes

**Use case:** Multi-tenant SaaS applications where different organizations need distinct visual identities.

**Approach:** Define theme classes with complete token overrides.

```css
/* Default theme */
:root {
  --hx-color-primary-500: #2563eb; /* Blue */
  --hx-font-family-sans: system-ui, sans-serif;
}

/* Tenant A: Healthcare (Teal + Frutiger) */
.theme-healthcare {
  --hx-color-primary-500: #007878;
  --hx-color-primary-600: #006666;
  --hx-font-family-sans: 'Frutiger', Arial, sans-serif;
  --hx-focus-ring-width: 3px; /* Accessibility-focused */
}

/* Tenant B: Finance (Navy + Serif) */
.theme-finance {
  --hx-color-primary-500: #003366;
  --hx-color-accent-500: #d4af37; /* Gold */
  --hx-font-family-sans: Georgia, serif;
  --hx-border-radius-md: 0; /* Square corners */
}

/* Tenant C: Education (Google Blue + Roboto) */
.theme-education {
  --hx-color-primary-500: #1a73e8;
  --hx-color-success-500: #34a853;
  --hx-font-family-sans: 'Roboto', sans-serif;
  --hx-border-radius-lg: 1rem; /* Playful, rounded */
}
```

**Usage:**

```html
<div class="theme-healthcare">
  <hx-button>Patient Portal</hx-button>
  <hx-card>Healthcare content</hx-card>
</div>

<div class="theme-finance">
  <hx-button>Account Dashboard</hx-button>
  <hx-card>Financial data</hx-card>
</div>

<div class="theme-education">
  <hx-button>Learning Center</hx-button>
  <hx-card>Course materials</hx-card>
</div>
```

**Why this works:** Each theme container creates a scoped context where all descendant components inherit that theme's token values. No component-level logic required.

### Strategy 5: Instance-Level Overrides

**Use case:** One-off customization of a single component instance.

**Approach:** Use inline styles or unique classes.

```html
<!-- Inline override -->
<hx-button style="--hx-button-bg: linear-gradient(135deg, #ff6b35, #f7931e);">
  Gradient Button
</hx-button>

<!-- Class-based override -->
<style>
  .hero-cta {
    --hx-button-bg: #10b981;
    --hx-button-font-size: 1.25rem;
    --hx-button-padding-x: 2rem;
  }
</style>

<hx-button class="hero-cta">Start Free Trial</hx-button>
```

**Why this works:** Inline styles and class selectors have higher specificity than element selectors, so they override component-type and global themes.

---

## Dark Mode Implementation

Dark mode is no longer optional in 2026 — it is a standard user expectation. wc-2026 supports dark mode by swapping semantic token values while keeping primitives unchanged.

### Light Theme (Default)

```css
:root {
  /* Text colors point to dark neutrals */
  --hx-color-text-primary: var(--hx-color-neutral-900, #212529);
  --hx-color-text-secondary: var(--hx-color-neutral-600, #6c757d);
  --hx-color-text-on-primary: var(--hx-color-neutral-0, #ffffff);

  /* Surfaces point to light neutrals */
  --hx-color-surface-default: var(--hx-color-neutral-0, #ffffff);
  --hx-color-surface-raised: var(--hx-color-neutral-50, #f8f9fa);

  /* Borders use mid-range neutrals */
  --hx-color-border-default: var(--hx-color-neutral-200, #e9ecef);
  --hx-color-border-focus: var(--hx-color-primary-500, #2563eb);

  /* Shadows use subtle opacity */
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Dark Theme

```css
:root[data-theme='dark'] {
  /* Text colors point to light neutrals */
  --hx-color-text-primary: var(--hx-color-neutral-100, #f1f5f9);
  --hx-color-text-secondary: var(--hx-color-neutral-400, #ced4da);
  --hx-color-text-on-primary: var(--hx-color-neutral-900, #212529);

  /* Surfaces point to dark neutrals */
  --hx-color-surface-default: var(--hx-color-neutral-900, #212529);
  --hx-color-surface-raised: var(--hx-color-neutral-800, #343a40);

  /* Borders use dark-range neutrals */
  --hx-color-border-default: var(--hx-color-neutral-700, #495057);
  --hx-color-border-focus: var(--hx-color-primary-400, #60a5fa);

  /* Shadows increase opacity for visibility */
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.2);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}
```

**Key insight:** `--hx-color-primary-500` stays the same in both themes (`#2563eb`). What changes is which neutrals the semantic tokens point to. This keeps brand colors consistent while adapting backgrounds, text, and borders.

### Method 1: Manual Data Attribute

Explicitly set the theme via `data-theme` attribute:

```html
<html data-theme="dark">
  <!-- All components render in dark mode -->
</html>
```

**Pros:**

- Complete control over theme state
- Works in all browsers (no media query support required)
- Easy to toggle via JavaScript

**Cons:**

- Requires JavaScript to toggle
- Doesn't respect system preference by default

### Method 2: System Preference (Automatic)

Respect user's OS-level preference using `prefers-color-scheme`:

```css
/* Light mode (default) */
:root {
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-surface-default: var(--hx-color-neutral-0);
}

/* Dark mode (automatic via system preference) */
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-text-primary: var(--hx-color-neutral-100);
    --hx-color-surface-default: var(--hx-color-neutral-900);
  }
}
```

**Pros:**

- Respects user's system preference automatically
- No JavaScript required
- Progressive enhancement

**Cons:**

- Users cannot override system preference
- Requires browser support (95%+ in 2026)

### Method 3: Hybrid Approach (Recommended)

Combine both methods for maximum flexibility:

```css
/* Default light theme */
:root {
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-surface-default: var(--hx-color-neutral-0);
}

/* Auto dark mode via system preference (unless overridden) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-text-primary: var(--hx-color-neutral-100);
    --hx-color-surface-default: var(--hx-color-neutral-900);
  }
}

/* Manual dark mode override */
:root[data-theme='dark'] {
  --hx-color-text-primary: var(--hx-color-neutral-100);
  --hx-color-surface-default: var(--hx-color-neutral-900);
}

/* Manual light mode override */
:root[data-theme='light'] {
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-surface-default: var(--hx-color-neutral-0);
}
```

**Pros:**

- Respects system preference by default
- Allows users to manually override
- Maximum flexibility

**Cons:**

- More CSS (but still minimal)
- Requires JavaScript for manual toggle

---

## Theme Switching Patterns

### Basic Toggle (Light / Dark)

```javascript
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme-preference', newTheme);
}

// Restore theme on page load
const savedTheme = localStorage.getItem('theme-preference');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}
```

**Usage:**

```html
<hx-button onclick="toggleTheme()"> Toggle Dark Mode </hx-button>
```

### Three-State Toggle (Light / Dark / Auto)

```javascript
class ThemeManager {
  constructor() {
    this.storageKey = 'theme-preference';
    this.init();
  }

  init() {
    const preference = this.getPreference();
    this.applyTheme(preference);
    this.listenForSystemChanges();
  }

  getPreference() {
    return localStorage.getItem(this.storageKey) || 'auto';
  }

  setPreference(preference) {
    localStorage.setItem(this.storageKey, preference);
    this.applyTheme(preference);
  }

  applyTheme(preference) {
    const html = document.documentElement;

    if (preference === 'auto') {
      // Remove data-theme to let media query take over
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', preference);
    }
  }

  listenForSystemChanges() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.getPreference() === 'auto') {
        // Re-apply auto to trigger media query re-evaluation
        this.applyTheme('auto');
      }
    });
  }

  cycleTheme() {
    const current = this.getPreference();
    const cycle = { auto: 'light', light: 'dark', dark: 'auto' };
    this.setPreference(cycle[current]);
  }

  getCurrentEffectiveTheme() {
    const preference = this.getPreference();
    if (preference === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preference;
  }
}

// Initialize
const themeManager = new ThemeManager();
```

**Usage:**

```html
<hx-button onclick="themeManager.cycleTheme()">
  Cycle Theme (Auto → Light → Dark → Auto)
</hx-button>
```

### Smooth Transitions

Avoid jarring theme switches by temporarily disabling transitions:

```javascript
function setThemeWithoutTransition(theme) {
  const html = document.documentElement;

  // Create a style element to disable all transitions
  const style = document.createElement('style');
  style.textContent = `
    *,
    *::before,
    *::after {
      transition: none !important;
      animation: none !important;
    }
  `;
  document.head.appendChild(style);

  // Apply theme
  html.setAttribute('data-theme', theme);

  // Re-enable transitions after two animation frames
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.head.removeChild(style);
    });
  });
}
```

**Why this works:** The first `requestAnimationFrame` waits for the browser to paint the new theme. The second waits one more frame to ensure all styles have updated. Then we re-enable transitions.

### Theme Picker with Select Menu

```html
<hx-select id="theme-selector" label="Theme Preference">
  <option value="auto">Auto (System)</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</hx-select>

<script>
  const themeManager = new ThemeManager();
  const selector = document.getElementById('theme-selector');

  // Set initial value
  selector.value = themeManager.getPreference();

  // Listen for changes
  selector.addEventListener('hx-change', (e) => {
    themeManager.setPreference(e.target.value);
  });
</script>
```

---

## Design System Integration

wc-2026 components work in any framework or CMS. Here's how to integrate theming.

### Drupal CMS

Components work via CDN + Twig templates. Theme tokens in a centralized stylesheet.

```yaml
# themes/custom/mysite/mysite.libraries.yml
wc-theme:
  css:
    theme:
      css/wc-theme.css: {}
```

```css
/* themes/custom/mysite/css/wc-theme.css */
:root {
  --hx-color-primary-500: #007878; /* Healthcare teal */
  --hx-font-family-sans: 'Frutiger', Arial, sans-serif;
  --hx-border-radius-md: 0.375rem;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-surface-default: #212529;
    --hx-color-text-primary: #f8f9fa;
  }
}
```

```twig
{# templates/page.html.twig #}
{{ attach_library('mysite/wc-theme') }}

<hx-button href="/appointments">Book Appointment</hx-button>
<hx-card>
  <div slot="heading">Patient Portal</div>
  <p>Access your medical records securely.</p>
</hx-card>
```

All components automatically inherit the brand tokens.

### React Applications

Components work as native custom elements. Apply theming via global CSS.

```jsx
// App.jsx
import './theme.css';

function App() {
  return (
    <div className="app">
      <hx-button onClick={handleClick}>Click Me</hx-button>
      <hx-card>
        <div slot="heading">Card Title</div>
        <p>Card content here.</p>
      </hx-card>
    </div>
  );
}
```

```css
/* theme.css */
:root {
  --hx-color-primary-500: #1a73e8; /* Google Blue */
  --hx-border-radius-md: 0.5rem;
}
```

**Dynamic theming with React state:**

```jsx
import { useEffect, useState } from 'react';

function ThemedApp() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme-preference') || 'auto';
  });

  useEffect(() => {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  const cycleTheme = () => {
    const cycle = { auto: 'light', light: 'dark', dark: 'auto' };
    setTheme(cycle[theme]);
  };

  return (
    <>
      <hx-button onClick={cycleTheme}>Current: {theme}</hx-button>
      <hx-card>
        <div slot="heading">Themed Content</div>
        <p>This card adapts to the current theme.</p>
      </hx-card>
    </>
  );
}
```

### Vue Applications

```vue
<template>
  <div :data-theme="theme">
    <hx-button @click="toggleTheme"> Toggle Theme ({{ theme }}) </hx-button>
    <hx-card>
      <div slot="heading">Vue Integration</div>
      <p>Themed with Vue state management</p>
    </hx-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const theme = ref(localStorage.getItem('theme-preference') || 'light');

watch(theme, (newTheme) => {
  localStorage.setItem('theme-preference', newTheme);
});

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}
</script>

<style>
:root {
  --hx-color-primary-500: #42b983; /* Vue green */
  --hx-border-radius-lg: 0.5rem;
}
</style>
```

### Angular Applications

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <hx-button (click)="toggleTheme()"> Toggle Theme ({{ theme }}) </hx-button>
    <hx-card>
      <div slot="heading">Angular Integration</div>
      <p>Themed components in Angular</p>
    </hx-card>
  `,
  styles: [
    `
      :host {
        --hx-color-primary-500: #dd0031; /* Angular red */
        --hx-font-family-sans: 'Roboto', sans-serif;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  theme = 'light';

  ngOnInit() {
    this.theme = localStorage.getItem('theme-preference') || 'light';
    this.applyTheme(this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    localStorage.setItem('theme-preference', this.theme);
  }

  applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

### Vanilla HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>wc-2026 Theming Example</title>

    <!-- Load components from CDN -->
    <script type="module" src="https://unpkg.com/@helixui/library"></script>

    <style>
      /* Global theme tokens */
      :root {
        --hx-color-primary-500: #007878;
        --hx-font-family-sans: 'Inter', sans-serif;
      }

      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) {
          --hx-color-surface-default: #212529;
          --hx-color-text-primary: #f8f9fa;
        }
      }
    </style>
  </head>
  <body>
    <hx-button onclick="toggleTheme()">Toggle Dark Mode</hx-button>

    <hx-card>
      <div slot="heading">Welcome</div>
      <p>Theming works in vanilla HTML too.</p>
    </hx-card>

    <script>
      function toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
      }
    </script>
  </body>
</html>
```

---

## Advanced Theming Patterns

### High Contrast Mode (Accessibility)

Support users with low vision by increasing contrast and border thickness:

```css
:root[data-theme='high-contrast'] {
  /* Use pure black and white for maximum contrast */
  --hx-color-text-primary: #000000;
  --hx-color-surface-default: #ffffff;
  --hx-color-border-default: #000000;

  /* Thicker borders for clarity */
  --hx-border-width-thin: 2px;
  --hx-border-width-medium: 3px;

  /* Larger focus indicators */
  --hx-focus-ring-width: 4px;
  --hx-focus-ring-offset: 3px;

  /* Remove shadows (can reduce contrast) */
  --hx-shadow-sm: none;
  --hx-shadow-md: none;
  --hx-shadow-lg: none;
}

/* Also support Windows High Contrast Mode */
@media (forced-colors: active) {
  hx-button,
  hx-card,
  hx-text-input {
    border: 2px solid currentColor !important;
  }
}
```

### Reduced Motion

Respect `prefers-reduced-motion` by disabling transitions:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --hx-transition-fast: 0ms;
    --hx-transition-normal: 0ms;
    --hx-transition-slow: 0ms;
  }

  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

### Multiple Brand Themes

For organizations managing multiple brands:

```css
/* Brand A: Healthcare */
:root[data-brand='healthcare'] {
  --hx-color-primary-500: #007878;
  --hx-font-family-sans: 'Frutiger', Arial, sans-serif;
}

/* Brand B: Finance */
:root[data-brand='finance'] {
  --hx-color-primary-500: #003366;
  --hx-color-accent-500: #d4af37;
  --hx-border-radius-md: 0; /* Square corners */
}

/* Brand C: Education */
:root[data-brand='education'] {
  --hx-color-primary-500: #1a73e8;
  --hx-border-radius-lg: 1rem; /* Playful, rounded */
}
```

```javascript
function setBrand(brandName) {
  document.documentElement.setAttribute('data-brand', brandName);
  localStorage.setItem('brand', brandName);
}
```

---

## Performance Considerations

### Custom Property Inheritance is Fast

CSS custom properties inherit efficiently. The browser's style recalculation is optimized for inheritance, so theming via custom properties adds minimal performance overhead (<5ms in most cases).

### Avoid Excessive Overrides

Only override tokens that differ from defaults:

```css
/* Bad: Override every token unnecessarily */
:root {
  --hx-space-1: 0.25rem;
  --hx-space-2: 0.5rem;
  --hx-space-3: 0.75rem;
  /* ... 100+ more */
}

/* Good: Override only what changes */
:root {
  --hx-color-primary-500: #007878;
  --hx-font-family-sans: 'Inter', sans-serif;
}
```

### Lazy Load Themes

For applications with many themes, load theme CSS on-demand:

```javascript
async function loadTheme(themeName) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${themeName}.css`;
  document.head.appendChild(link);

  return new Promise((resolve) => {
    link.onload = resolve;
  });
}

// Usage
await loadTheme('healthcare');
document.documentElement.setAttribute('data-brand', 'healthcare');
```

### Measure Performance

Use Lighthouse and Chrome DevTools Performance panel to measure style recalculation time. Theming should add <10ms to recalculation in most cases.

---

## Troubleshooting

### Theme Not Applying

**Problem:** Tokens not updating after override.

**Solution:** Check CSS specificity using browser DevTools:

```javascript
// Debug token resolution in console
const button = document.querySelector('hx-button');
const computedBg = getComputedStyle(button).getPropertyValue('--hx-button-bg');
console.log('Computed background:', computedBg);
```

### Flash of Unstyled Content (FOUC)

**Problem:** Page briefly shows default theme before switching.

**Solution:** Apply theme before rendering:

```html
<head>
  <script>
    // Block rendering until theme applied
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme && savedTheme !== 'auto') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  </script>
  <!-- Stylesheets and content load after -->
</head>
```

### Components Not Inheriting Tokens

**Problem:** Component shows defaults despite token overrides.

**Solution:** Ensure tokens are defined on an ancestor element:

```css
/* Wrong: Tokens on sibling */
.sidebar {
  --hx-color-primary-500: #007878;
}
/* <div class="sidebar"></div>
   <hx-button>Button</hx-button> Won't inherit */

/* Correct: Tokens on ancestor */
.page {
  --hx-color-primary-500: #007878;
}
/* <div class="page">
     <hx-button>Button</hx-button> Inherits
   </div> */
```

---

## Best Practices Summary

1. **Override semantic tokens (Tier 2)** for global brand changes — they cascade automatically to all components
2. **Override component tokens (Tier 3)** for targeted component customization without affecting others
3. **Avoid modifying primitive tokens** unless replacing an entire palette (breaking change)
4. **Test both light and dark themes** after any customization
5. **Verify WCAG AA compliance** (4.5:1 for text, 3:1 for UI) on all color overrides
6. **Use `var()` references in overrides** to stay connected to the token system
7. **Document your overrides** so teams understand what's been customized and why
8. **Minimize transition animations during theme switches** to avoid jank (or disable temporarily)
9. **Load themes on-demand** if supporting many themes to reduce initial CSS bundle size
10. **Respect user preferences** (`prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors`)

---

## Summary

CSS custom properties are the theming mechanism for Web Components. They inherit across shadow boundaries, enabling powerful, flexible theming without breaking encapsulation.

**Key takeaways:**

- **CSS custom properties inherit through Shadow DOM** — the only CSS feature that does
- **Three-tier token architecture** enables global, component, and instance-level theming
- **Semantic tokens (Tier 2) are the primary theming API** — override these for brand customization
- **Component tokens (Tier 3) enable surgical customization** — override these for specific components
- **Dark mode works via token overrides** — swap semantic references, keep primitives unchanged
- **Theme switching requires minimal JavaScript** — just set `data-theme` attribute
- **Integration works in any framework** — Drupal, React, Vue, Angular, vanilla HTML
- **Performance is excellent** — CSS custom property inheritance is fast (<5ms overhead)
- **Accessibility is non-negotiable** — verify contrast, focus indicators, high contrast mode, reduced motion

---

## Next Steps

- [Component Styling Fundamentals](/components/styling/fundamentals) — Shadow DOM, `:host`, CSS encapsulation
- [Design Token Architecture](/components/styling/tokens) — Complete three-tier token system reference
- [Responsive Design Patterns](/components/styling/responsive) — Container queries, fluid typography, responsive spacing
- [Performance Optimization](/components/styling/performance) — CSS optimization, Constructable Stylesheets, bundle size

---

## Sources

- [How Nordhealth uses Custom Properties in Web Components | web.dev](https://web.dev/articles/custom-properties-web-components)
- [Dark and Light Theme Switch | Theming patterns | web.dev](https://web.dev/patterns/theming/theme-switch)
- [Using shadow DOM - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [Shadow DOM v1 - Self-Contained Web Components | web.dev](https://web.dev/articles/shadowdom-v1)
- [Shadow DOM styling | javascript.info](https://javascript.info/shadow-dom-style)
- [Styling: Styles Piercing Shadow DOM: Open Web Components](https://open-wc.org/guides/knowledge/styling/styles-piercing-shadow-dom/)
- [Why Dark Mode is Mandatory in 2026 | Siva Designer](https://www.sivadesigner.in/blog/dark-mode-evolution-modern-web-design/)
- [Design Tokens & Theming: How to Build Scalable UI Systems in 2025 | Material UI](https://materialui.co/blog/design-tokens-and-theming-scalable-ui-2025)
