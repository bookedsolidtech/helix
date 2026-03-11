---
title: Theming Web Components
description: Complete guide to CSS custom properties cascade through Shadow DOM, theming strategies, dark mode implementation, theme switching patterns, and design system integration for HELiX components.
sidebar:
  order: 4
---

Theming web components requires understanding how CSS custom properties pierce through Shadow DOM boundaries while maintaining encapsulation. This comprehensive guide explores how HELiX's three-tier token architecture enables powerful, performant theming across all consumption contexts — from Drupal CMS to React, Vue, Angular, and vanilla HTML.

Master the cascade, understand token resolution, implement dark mode, build theme switchers, and integrate HELiX components into any design system.

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
<wc-button>
  #shadow-root (open)
  <style>
    /* Component styles */
  </style>
  <button class="button">Click Me</button>
</wc-button>
```

Traditional CSS selectors stop at the shadow boundary:

```css
/* This will NOT work */
wc-button .button {
  background: #007878;
}

/* This will NOT work either */
wc-button button {
  color: white;
}
```

**This is intentional.** Shadow DOM encapsulation prevents style leaks and protects component internals from external interference. But it creates a problem: How do consumers theme components without breaking encapsulation?

### CSS Custom Properties: The Exception

CSS custom properties (CSS variables) are unique — they **inherit across shadow boundaries**. This is not a bug; it is a W3C design decision that makes them the perfect theming mechanism for Web Components.

```css
/* External stylesheet */
:root {
  --wc-color-primary-500: #007878;
}
```

```css
/* Inside wc-button's Shadow DOM */
.button {
  background-color: var(--wc-color-primary-500, #2563eb);
}
```

The component's shadow root inherits `--wc-color-primary-500` from the document's `:root`. When a consumer overrides the token, all components using it update automatically. No JavaScript required. No re-rendering. Just pure CSS cascade.

### How Inheritance Works Across Shadow Boundaries

CSS custom properties inherit like any other inherited property (`color`, `font-family`, `line-height`). When the browser computes styles for an element inside shadow DOM, it walks up the ancestor tree — crossing shadow boundaries — to resolve inherited values.

```html
<style>
  :root {
    --wc-color-primary-500: #2563eb; /* Default blue */
  }

  .teal-section {
    --wc-color-primary-500: #007878; /* Override with teal */
  }
</style>

<wc-button>Normal button</wc-button>
<!-- Uses #2563eb -->

<div class="teal-section">
  <wc-button>Teal section button</wc-button>
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
.button { background: var(--wc-button-bg); }
  ↓
Component token undefined, fallback to semantic:
  var(--wc-color-primary-500, #2563eb)
  ↓
--wc-color-primary-500 inherits from :root
  ↓
:root { --wc-color-primary-500: #2563eb; }
  ↓
Final computed value: #2563eb
```

If a consumer overrides `--wc-color-primary-500` at any ancestor level, the cascade uses that value instead.

### Cascade Specificity Hierarchy

The browser resolves custom property values in this order (highest specificity wins):

```
1. Inline styles (style="--wc-button-bg: red;")
   ↓
2. Class-based overrides (.primary-button { --wc-button-bg: blue; })
   ↓
3. Component-type overrides (wc-button { --wc-button-bg: green; })
   ↓
4. Section-level overrides (.hero { --wc-color-primary-500: teal; })
   ↓
5. Document-level overrides (:root { --wc-color-primary-500: blue; })
   ↓
6. Component internal defaults (:host { --wc-button-bg: var(--wc-color-primary-500); })
```

Later (more specific) overrides always win due to CSS specificity rules.

### Multi-Level Fallback Chains

HELiX components use two-level or three-level fallback chains to ensure robust token resolution:

**Two-level fallback (most common):**

```css
.card {
  background: var(--wc-color-neutral-0, #ffffff);
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Semantic token    | Primitive fallback
   */
}
```

**Three-level fallback (for component customization):**

```css
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Component token  | Semantic token     | Primitive fallback
   */
}
```

**Resolution order:**

1. `--wc-button-bg` (component token — most specific, optional)
2. `--wc-color-primary-500` (semantic token — global theming layer)
3. `#2563eb` (primitive fallback — last resort if everything unset)

This pattern ensures components always render correctly, even if consumers override nothing.

---

## Theming Strategies

HELiX's token architecture enables multiple theming approaches, each suited to different use cases.

### Strategy 1: Global Brand Theming

**Use case:** Change the primary brand color, typography, or spacing across all components.

**Approach:** Override semantic tokens (Tier 2) at `:root`.

```css
/* Consumer's theme file */
:root {
  /* Rebrand to teal (HELiX's primary color) */
  --wc-color-primary-50: #e6f7f7;
  --wc-color-primary-100: #cceff0;
  --wc-color-primary-200: #99dfe0;
  --wc-color-primary-300: #66cfd1;
  --wc-color-primary-400: #33bfc1;
  --wc-color-primary-500: #007878; /* Base teal */
  --wc-color-primary-600: #006666;
  --wc-color-primary-700: #005555;
  --wc-color-primary-800: #004444;
  --wc-color-primary-900: #003333;

  /* Update typography */
  --wc-font-family-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --wc-font-weight-semibold: 600;

  /* Rounder corners across all components */
  --wc-border-radius-md: 0.5rem;
  --wc-border-radius-lg: 0.75rem;
}
```

**Result:** All components that reference `--wc-color-primary-*`, `--wc-font-family-sans`, or `--wc-border-radius-*` update automatically. This is the **preferred approach** for brand customization.

**Why this works:** Components consume semantic tokens, so changing those tokens at `:root` cascades to every component on the page. No need to override individual component tokens.

### Strategy 2: Component-Specific Theming

**Use case:** Customize one component type without affecting others.

**Approach:** Override component tokens (Tier 3) using element selectors.

```css
/* Make all buttons pill-shaped and bold */
wc-button {
  --wc-button-border-radius: var(--wc-border-radius-full, 9999px);
  --wc-button-font-weight: var(--wc-font-weight-bold, 700);
}

/* Make all cards use elevated shadow */
wc-card {
  --wc-card-shadow: var(--wc-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1));
  --wc-card-padding: var(--wc-space-8, 2rem);
}

/* Make all text inputs larger */
wc-text-input {
  --wc-input-font-size: var(--wc-font-size-lg, 1.125rem);
  --wc-input-padding: var(--wc-space-4, 1rem);
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
  --wc-color-primary-500: #ff6b35; /* Accent orange */
  --wc-shadow-md: var(--wc-shadow-xl); /* Upgrade shadows */
}

.hero wc-button {
  --wc-button-font-size: var(--wc-font-size-lg, 1.125rem);
}

/* Sidebar uses muted colors and tighter spacing */
.sidebar {
  --wc-color-neutral-0: #f8f9fa;
  --wc-space-4: 0.75rem;
  --wc-space-6: 1rem;
}

/* Footer uses dark theme even in light mode */
.footer {
  --wc-color-neutral-0: #212529;
  --wc-color-neutral-800: #f8f9fa;
  --wc-color-primary-500: #60a5fa;
}
```

**Usage:**

```html
<div class="hero">
  <wc-button>Get Started</wc-button>
  <!-- Uses orange accent and large font -->
</div>

<div class="sidebar">
  <wc-card>
    <div slot="heading">Quick Links</div>
    <p>Navigation content</p>
  </wc-card>
  <!-- Uses muted background and tighter spacing -->
</div>

<footer class="footer">
  <wc-button variant="secondary">Contact Us</wc-button>
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
  --wc-color-primary-500: #2563eb; /* Blue */
  --wc-font-family-sans: system-ui, sans-serif;
}

/* Tenant A: Healthcare (Teal + Frutiger) */
.theme-healthcare {
  --wc-color-primary-500: #007878;
  --wc-color-primary-600: #006666;
  --wc-font-family-sans: 'Frutiger', Arial, sans-serif;
  --wc-focus-ring-width: 3px; /* Accessibility-focused */
}

/* Tenant B: Finance (Navy + Serif) */
.theme-finance {
  --wc-color-primary-500: #003366;
  --wc-color-accent-500: #d4af37; /* Gold */
  --wc-font-family-sans: Georgia, serif;
  --wc-border-radius-md: 0; /* Square corners */
}

/* Tenant C: Education (Google Blue + Roboto) */
.theme-education {
  --wc-color-primary-500: #1a73e8;
  --wc-color-success-500: #34a853;
  --wc-font-family-sans: 'Roboto', sans-serif;
  --wc-border-radius-lg: 1rem; /* Playful, rounded */
}
```

**Usage:**

```html
<div class="theme-healthcare">
  <wc-button>Patient Portal</wc-button>
  <wc-card>Healthcare content</wc-card>
</div>

<div class="theme-finance">
  <wc-button>Account Dashboard</wc-button>
  <wc-card>Financial data</wc-card>
</div>

<div class="theme-education">
  <wc-button>Learning Center</wc-button>
  <wc-card>Course materials</wc-card>
</div>
```

**Why this works:** Each theme container creates a scoped context where all descendant components inherit that theme's token values. No component-level logic required.

### Strategy 5: Instance-Level Overrides

**Use case:** One-off customization of a single component instance.

**Approach:** Use inline styles or unique classes.

```html
<!-- Inline override -->
<wc-button style="--wc-button-bg: linear-gradient(135deg, #ff6b35, #f7931e);">
  Gradient Button
</wc-button>

<!-- Class-based override -->
<style>
  .hero-cta {
    --wc-button-bg: #10b981;
    --wc-button-font-size: 1.25rem;
    --wc-button-padding-x: 2rem;
  }
</style>

<wc-button class="hero-cta">Start Free Trial</wc-button>
```

**Why this works:** Inline styles and class selectors have higher specificity than element selectors, so they override component-type and global themes.

---

## Dark Mode Implementation

Dark mode is no longer optional in 2026 — it is a standard user expectation. HELiX supports dark mode by swapping semantic token values while keeping primitives unchanged.

### Light Theme (Default)

```css
:root {
  /* Text colors point to dark neutrals */
  --wc-color-text-primary: var(--wc-color-neutral-900, #212529);
  --wc-color-text-secondary: var(--wc-color-neutral-600, #6c757d);
  --wc-color-text-on-primary: var(--wc-color-neutral-0, #ffffff);

  /* Surfaces point to light neutrals */
  --wc-color-surface-default: var(--wc-color-neutral-0, #ffffff);
  --wc-color-surface-raised: var(--wc-color-neutral-50, #f8f9fa);

  /* Borders use mid-range neutrals */
  --wc-color-border-default: var(--wc-color-neutral-200, #e9ecef);
  --wc-color-border-focus: var(--wc-color-primary-500, #2563eb);

  /* Shadows use subtle opacity */
  --wc-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --wc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --wc-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Dark Theme

```css
:root[data-theme='dark'] {
  /* Text colors point to light neutrals */
  --wc-color-text-primary: var(--wc-color-neutral-100, #f1f5f9);
  --wc-color-text-secondary: var(--wc-color-neutral-400, #ced4da);
  --wc-color-text-on-primary: var(--wc-color-neutral-900, #212529);

  /* Surfaces point to dark neutrals */
  --wc-color-surface-default: var(--wc-color-neutral-900, #212529);
  --wc-color-surface-raised: var(--wc-color-neutral-800, #343a40);

  /* Borders use dark-range neutrals */
  --wc-color-border-default: var(--wc-color-neutral-700, #495057);
  --wc-color-border-focus: var(--wc-color-primary-400, #60a5fa);

  /* Shadows increase opacity for visibility */
  --wc-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.2);
  --wc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --wc-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}
```

**Key insight:** `--wc-color-primary-500` stays the same in both themes (`#2563eb`). What changes is which neutrals the semantic tokens point to. This keeps brand colors consistent while adapting backgrounds, text, and borders.

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
  --wc-color-text-primary: var(--wc-color-neutral-900);
  --wc-color-surface-default: var(--wc-color-neutral-0);
}

/* Dark mode (automatic via system preference) */
@media (prefers-color-scheme: dark) {
  :root {
    --wc-color-text-primary: var(--wc-color-neutral-100);
    --wc-color-surface-default: var(--wc-color-neutral-900);
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
  --wc-color-text-primary: var(--wc-color-neutral-900);
  --wc-color-surface-default: var(--wc-color-neutral-0);
}

/* Auto dark mode via system preference (unless overridden) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --wc-color-text-primary: var(--wc-color-neutral-100);
    --wc-color-surface-default: var(--wc-color-neutral-900);
  }
}

/* Manual dark mode override */
:root[data-theme='dark'] {
  --wc-color-text-primary: var(--wc-color-neutral-100);
  --wc-color-surface-default: var(--wc-color-neutral-900);
}

/* Manual light mode override */
:root[data-theme='light'] {
  --wc-color-text-primary: var(--wc-color-neutral-900);
  --wc-color-surface-default: var(--wc-color-neutral-0);
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
<wc-button onclick="toggleTheme()"> Toggle Dark Mode </wc-button>
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
<wc-button onclick="themeManager.cycleTheme()">
  Cycle Theme (Auto → Light → Dark → Auto)
</wc-button>
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
<wc-select id="theme-selector" label="Theme Preference">
  <option value="auto">Auto (System)</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</wc-select>

<script>
  const themeManager = new ThemeManager();
  const selector = document.getElementById('theme-selector');

  // Set initial value
  selector.value = themeManager.getPreference();

  // Listen for changes
  selector.addEventListener('wc-change', (e) => {
    themeManager.setPreference(e.target.value);
  });
</script>
```

---

## Design System Integration

HELiX components work in any framework or CMS. Here's how to integrate theming.

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
  --wc-color-primary-500: #007878; /* Healthcare teal */
  --wc-font-family-sans: 'Frutiger', Arial, sans-serif;
  --wc-border-radius-md: 0.375rem;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --wc-color-surface-default: #212529;
    --wc-color-text-primary: #f8f9fa;
  }
}
```

```twig
{# templates/page.html.twig #}
{{ attach_library('mysite/wc-theme') }}

<wc-button href="/appointments">Book Appointment</wc-button>
<wc-card>
  <div slot="heading">Patient Portal</div>
  <p>Access your medical records securely.</p>
</wc-card>
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
      <wc-button onClick={handleClick}>Click Me</wc-button>
      <wc-card>
        <div slot="heading">Card Title</div>
        <p>Card content here.</p>
      </wc-card>
    </div>
  );
}
```

```css
/* theme.css */
:root {
  --wc-color-primary-500: #1a73e8; /* Google Blue */
  --wc-border-radius-md: 0.5rem;
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
      <wc-button onClick={cycleTheme}>Current: {theme}</wc-button>
      <wc-card>
        <div slot="heading">Themed Content</div>
        <p>This card adapts to the current theme.</p>
      </wc-card>
    </>
  );
}
```

### Vue Applications

```vue
<template>
  <div :data-theme="theme">
    <wc-button @click="toggleTheme"> Toggle Theme ({{ theme }}) </wc-button>
    <wc-card>
      <div slot="heading">Vue Integration</div>
      <p>Themed with Vue state management</p>
    </wc-card>
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
  --wc-color-primary-500: #42b983; /* Vue green */
  --wc-border-radius-lg: 0.5rem;
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
    <wc-button (click)="toggleTheme()"> Toggle Theme ({{ theme }}) </wc-button>
    <wc-card>
      <div slot="heading">Angular Integration</div>
      <p>Themed components in Angular</p>
    </wc-card>
  `,
  styles: [
    `
      :host {
        --wc-color-primary-500: #dd0031; /* Angular red */
        --wc-font-family-sans: 'Roboto', sans-serif;
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
    <title>HELiX Theming Example</title>

    <!-- Load components from CDN -->
    <script type="module" src="https://unpkg.com/@helixui/library"></script>

    <style>
      /* Global theme tokens */
      :root {
        --wc-color-primary-500: #007878;
        --wc-font-family-sans: 'Inter', sans-serif;
      }

      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) {
          --wc-color-surface-default: #212529;
          --wc-color-text-primary: #f8f9fa;
        }
      }
    </style>
  </head>
  <body>
    <wc-button onclick="toggleTheme()">Toggle Dark Mode</wc-button>

    <wc-card>
      <div slot="heading">Welcome</div>
      <p>Theming works in vanilla HTML too.</p>
    </wc-card>

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
  --wc-color-text-primary: #000000;
  --wc-color-surface-default: #ffffff;
  --wc-color-border-default: #000000;

  /* Thicker borders for clarity */
  --wc-border-width-thin: 2px;
  --wc-border-width-medium: 3px;

  /* Larger focus indicators */
  --wc-focus-ring-width: 4px;
  --wc-focus-ring-offset: 3px;

  /* Remove shadows (can reduce contrast) */
  --wc-shadow-sm: none;
  --wc-shadow-md: none;
  --wc-shadow-lg: none;
}

/* Also support Windows High Contrast Mode */
@media (forced-colors: active) {
  wc-button,
  wc-card,
  wc-text-input {
    border: 2px solid currentColor !important;
  }
}
```

### Reduced Motion

Respect `prefers-reduced-motion` by disabling transitions:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --wc-transition-fast: 0ms;
    --wc-transition-normal: 0ms;
    --wc-transition-slow: 0ms;
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
  --wc-color-primary-500: #007878;
  --wc-font-family-sans: 'Frutiger', Arial, sans-serif;
}

/* Brand B: Finance */
:root[data-brand='finance'] {
  --wc-color-primary-500: #003366;
  --wc-color-accent-500: #d4af37;
  --wc-border-radius-md: 0; /* Square corners */
}

/* Brand C: Education */
:root[data-brand='education'] {
  --wc-color-primary-500: #1a73e8;
  --wc-border-radius-lg: 1rem; /* Playful, rounded */
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
  --wc-space-1: 0.25rem;
  --wc-space-2: 0.5rem;
  --wc-space-3: 0.75rem;
  /* ... 100+ more */
}

/* Good: Override only what changes */
:root {
  --wc-color-primary-500: #007878;
  --wc-font-family-sans: 'Inter', sans-serif;
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
const button = document.querySelector('wc-button');
const computedBg = getComputedStyle(button).getPropertyValue('--wc-button-bg');
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
  --wc-color-primary-500: #007878;
}
/* <div class="sidebar"></div>
   <wc-button>Button</wc-button> Won't inherit */

/* Correct: Tokens on ancestor */
.page {
  --wc-color-primary-500: #007878;
}
/* <div class="page">
     <wc-button>Button</wc-button> Inherits
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
