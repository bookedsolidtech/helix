---
title: CSS Custom Properties in Drupal
description: Deep dive into theming HELIX web components with CSS custom properties in Drupal themes
order: 54
---

HELIX web components are designed to be themable through CSS custom properties (also known as CSS variables). Because components use Shadow DOM for encapsulation, traditional CSS selectors cannot penetrate component internals. Instead, components expose theming APIs through `--hx-*` prefixed custom properties that cascade through the Shadow DOM boundary.

This guide covers how to integrate HELIX's token-based theming system into your Drupal theme, from global token overrides to per-component customization.

## Understanding CSS Custom Properties

CSS custom properties are CSS variables that can inherit through the DOM tree and, crucially for web components, through Shadow DOM boundaries. They enable runtime theming without CSS preprocessing.

### Basic Syntax

```css
/* Define a custom property */
:root {
  --hx-color-primary-500: #2563eb;
}

/* Use the custom property with fallback */
.button {
  background-color: var(--hx-color-primary-500, #0066cc);
}

/* Chain multiple fallbacks */
.card {
  padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
}
```

### Shadow DOM Inheritance

Shadow DOM creates an encapsulation boundary. Styles defined outside a shadow root cannot reach inside, but CSS custom properties **do** inherit:

```html
<style>
  /* This CANNOT style the button inside the shadow root */
  hx-button button {
    color: red;
  }

  /* This CAN because custom properties inherit */
  hx-button {
    --hx-button-bg: red;
  }
</style>

<hx-button variant="primary">Click Me</hx-button>
```

This inheritance model is what makes HELIX components themable in Drupal without any JavaScript or special tooling.

## The Three-Tier Token Cascade

HELIX follows a three-tier token architecture that provides flexibility while maintaining consistency:

### 1. Primitive Tokens (Raw Values)

Primitive tokens are concrete values that define the design system's foundation. These rarely change between themes.

```css
/* Typography primitives */
--hx-font-size-xs: 0.75rem;
--hx-font-size-sm: 0.875rem;
--hx-font-size-md: 1rem;
--hx-font-size-lg: 1.125rem;

/* Spacing primitives */
--hx-space-1: 0.25rem;
--hx-space-2: 0.5rem;
--hx-space-3: 0.75rem;
--hx-space-4: 1rem;

/* Color primitives */
--hx-color-primary-500: #2563eb;
--hx-color-neutral-700: #374151;
--hx-color-error-500: #dc2626;
```

### 2. Semantic Tokens (Contextual Names)

Semantic tokens give meaning to primitives. They describe **purpose** rather than appearance:

```css
/* What primitives become */
--hx-color-primary-500: #2563eb;

/* Semantic meaning applied to primitives */
--hx-color-primary: var(--hx-color-primary-500);
--hx-focus-ring-color: var(--hx-color-primary);
--hx-link-color: var(--hx-color-primary);
```

Semantic tokens are where theme customization typically happens. Change `--hx-color-primary-500` once, and all primary-colored elements update automatically.

### 3. Component Tokens (Component-Specific)

Component tokens control individual component styling and always fall back to semantic tokens:

```css
/* hx-button internal styles */
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary-500));
  --_color: var(--hx-button-color, var(--hx-color-neutral-0));
  --_border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md));
}

.button {
  background-color: var(--_bg);
  color: var(--_color);
  border-radius: var(--_border-radius);
}
```

Notice the pattern:

1. Component checks for `--hx-button-bg` (component token)
2. Falls back to `--hx-color-primary-500` (semantic token)
3. Component uses private `--_bg` property internally

This cascade means you can theme globally (semantic) or surgically (component).

## Setting Global Tokens in Drupal

Global tokens apply site-wide and should be defined in your theme's CSS. There are two recommended approaches.

### Method 1: Dedicated Tokens File (Recommended)

Create a dedicated CSS file for HELIX token overrides:

```css
/* themes/custom/mytheme/css/helix-tokens.css */

/**
 * HELIX Web Component Theming
 * Global token overrides for enterprise healthcare brand
 */

:root {
  /* ─── Brand Colors ─── */
  --hx-color-primary-50: #eff6ff;
  --hx-color-primary-100: #dbeafe;
  --hx-color-primary-500: #0066cc; /* Brand primary */
  --hx-color-primary-600: #004d99;
  --hx-color-primary-700: #003366;

  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-100: #f5f5f5;
  --hx-color-neutral-700: #333333;
  --hx-color-neutral-800: #1a1a1a;

  /* ─── Semantic Colors ─── */
  --hx-color-success-500: #10b981;
  --hx-color-warning-500: #f59e0b;
  --hx-color-error-500: #dc2626;
  --hx-color-info-500: #3b82f6;

  /* ─── Typography ─── */
  --hx-font-family-sans: 'Open Sans', system-ui, -apple-system, sans-serif;
  --hx-font-family-serif: Georgia, 'Times New Roman', serif;
  --hx-font-family-mono: 'Fira Code', 'Courier New', monospace;

  --hx-font-weight-normal: 400;
  --hx-font-weight-medium: 500;
  --hx-font-weight-semibold: 600;
  --hx-font-weight-bold: 700;

  /* ─── Spacing Scale ─── */
  --hx-space-1: 0.25rem; /* 4px */
  --hx-space-2: 0.5rem; /* 8px */
  --hx-space-3: 0.75rem; /* 12px */
  --hx-space-4: 1rem; /* 16px */
  --hx-space-6: 1.5rem; /* 24px */
  --hx-space-8: 2rem; /* 32px */
  --hx-space-10: 2.5rem; /* 40px */
  --hx-space-12: 3rem; /* 48px */

  /* ─── Border Radius ─── */
  --hx-border-radius-sm: 0.25rem;
  --hx-border-radius-md: 0.375rem;
  --hx-border-radius-lg: 0.5rem;
  --hx-border-radius-xl: 0.75rem;
  --hx-border-radius-full: 9999px;

  /* ─── Transitions ─── */
  --hx-transition-fast: 150ms ease;
  --hx-transition-normal: 250ms ease;
  --hx-transition-slow: 350ms ease;

  /* ─── Focus Ring (Accessibility) ─── */
  --hx-focus-ring-width: 3px; /* Larger for WCAG AAA */
  --hx-focus-ring-offset: 2px;
  --hx-focus-ring-color: #0066cc;
  --hx-focus-ring-opacity: 0.25;

  /* ─── Shadows ─── */
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --hx-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

Attach this library in your theme's `.info.yml`:

```yaml
# themes/custom/mytheme/mytheme.info.yml
name: My Healthcare Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: false

libraries:
  - mytheme/global-styles
  - mytheme/helix-tokens
  - mytheme/helix-components
```

Define the library:

```yaml
# themes/custom/mytheme/mytheme.libraries.yml
helix-tokens:
  version: 1.x
  css:
    theme:
      css/helix-tokens.css: { weight: -10 }

helix-components:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
  dependencies:
    - mytheme/helix-tokens
```

The `weight: -10` ensures token definitions load early and can be overridden by component-specific rules.

### Method 2: Inline in Global Styles

For smaller projects, you can include tokens in your main theme stylesheet:

```css
/* themes/custom/mytheme/css/style.css */

/* ─── HELIX Token Overrides ─── */
:root {
  --hx-color-primary-500: #0066cc;
  --hx-font-family-sans: 'Open Sans', sans-serif;
  --hx-space-4: 1rem;
}

/* ─── Rest of theme styles ─── */
body {
  font-family: var(--hx-font-family-sans);
}
```

This works but makes tokens harder to locate and maintain as your theme grows.

## Component-Specific Overrides

While global tokens handle most theming, sometimes you need to customize a specific component instance.

### Override Pattern 1: Scoped to Page Section

```css
/* themes/custom/mytheme/css/components/hero.css */

/**
 * Hero section with custom button styling
 */
.hero-section {
  --hx-button-bg: transparent;
  --hx-button-color: #ffffff;
  --hx-button-border-color: #ffffff;
  --hx-button-border-radius: 0; /* Square buttons in hero */
}

.hero-section hx-button:hover {
  --hx-button-bg: rgba(255, 255, 255, 0.1);
}
```

In Twig:

```twig
{# node--page--hero.html.twig #}
<div class="hero-section">
  <h1>{{ label }}</h1>
  <hx-button variant="secondary" href="{{ cta_url }}">
    {{ cta_text }}
  </hx-button>
</div>
```

### Override Pattern 2: Inline Component Styles

For one-off customizations, set tokens directly on the component:

```twig
{# Danger button with custom red #}
<hx-button
  variant="primary"
  style="--hx-button-bg: #cc0000; --hx-button-color: #ffffff;"
>
  Delete Account
</hx-button>
```

While convenient, use sparingly. This approach bypasses the design system and can lead to inconsistency.

### Override Pattern 3: BEM-Style Modifiers

Create modifier classes in your theme CSS:

```css
/* themes/custom/mytheme/css/components/buttons.css */

/**
 * Button modifiers for common use cases
 */
.hx-button--cta {
  --hx-button-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --hx-button-border-radius: var(--hx-border-radius-full);
  --hx-button-font-weight: var(--hx-font-weight-bold);
}

.hx-button--subtle {
  --hx-button-bg: transparent;
  --hx-button-color: var(--hx-color-neutral-600);
  --hx-button-border-color: var(--hx-color-neutral-300);
}
```

Apply in Twig:

```twig
<hx-button class="hx-button--cta" variant="primary">
  Get Started
</hx-button>

<hx-button class="hx-button--subtle" variant="secondary">
  Learn More
</hx-button>
```

This keeps styling decisions in CSS while allowing Twig templates to apply semantic modifiers.

## Dark Mode Implementation

HELIX components support dark mode through token overrides. The recommended pattern uses `prefers-color-scheme` media query and Drupal's color scheme detection.

### Automatic Dark Mode (CSS-Based)

```css
/* themes/custom/mytheme/css/helix-tokens.css */

:root {
  /* Light mode (default) */
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-50: #f9fafb;
  --hx-color-neutral-800: #1f2937;
  --hx-color-neutral-900: #111827;

  --hx-card-bg: var(--hx-color-neutral-0);
  --hx-card-color: var(--hx-color-neutral-800);
  --hx-input-bg: var(--hx-color-neutral-0);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-neutral-0: #111827; /* Inverted */
    --hx-color-neutral-50: #1f2937;
    --hx-color-neutral-800: #f9fafb; /* Inverted */
    --hx-color-neutral-900: #ffffff;

    --hx-card-bg: var(--hx-color-neutral-900, #1a1a1a);
    --hx-card-color: var(--hx-color-neutral-100, #f5f5f5);
    --hx-card-border-color: var(--hx-color-neutral-700, #404040);

    --hx-input-bg: var(--hx-color-neutral-800);
    --hx-input-border-color: var(--hx-color-neutral-600);

    /* Reduce shadow intensity in dark mode */
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3);
    --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4);
  }
}
```

### User-Controlled Dark Mode

For explicit dark mode toggles (common in healthcare applications):

```css
/* themes/custom/mytheme/css/helix-tokens.css */

/* Light mode (default) */
:root,
[data-theme='light'] {
  --hx-card-bg: #ffffff;
  --hx-card-color: #1f2937;
}

/* Dark mode via data attribute */
[data-theme='dark'] {
  --hx-card-bg: #1a1a1a;
  --hx-card-color: #f9fafb;
  --hx-card-border-color: #404040;

  --hx-button-focus-ring-color: #60a5fa; /* Brighter focus ring for dark bg */

  --hx-input-bg: #262626;
  --hx-input-border-color: #525252;
  --hx-input-color: #f5f5f5;

  /* Adjust alert contrast */
  --hx-color-info-50: #1e3a5f;
  --hx-color-success-50: #064e3b;
  --hx-color-warning-50: #451a03;
  --hx-color-error-50: #7f1d1d;
}
```

JavaScript to toggle (Drupal Behavior):

```javascript
// themes/custom/mytheme/js/dark-mode.js
(function (Drupal) {
  'use strict';

  Drupal.behaviors.darkMode = {
    attach(context, settings) {
      const toggle = document.getElementById('dark-mode-toggle');
      if (!toggle) return;

      // Load saved preference
      const currentTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);

      toggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      });
    },
  };
})(Drupal);
```

Twig template:

```twig
{# themes/custom/mytheme/templates/layout/page.html.twig #}
<div class="theme-toggle">
  <label>
    <hx-switch id="dark-mode-toggle"></hx-switch>
    <span>Dark Mode</span>
  </label>
</div>
```

## Per-Page Token Overrides

Sometimes specific pages need unique component styling. Use Drupal's template suggestions to scope overrides.

### Example: Patient Portal Landing

```css
/* themes/custom/mytheme/css/pages/patient-portal.css */

/**
 * Patient portal uses calming blue palette
 */
body.path-patient-portal {
  --hx-color-primary-500: #0ea5e9; /* Sky blue */
  --hx-color-primary-600: #0284c7;

  --hx-button-border-radius: var(--hx-border-radius-lg); /* Softer edges */
  --hx-card-border-radius: var(--hx-border-radius-xl);
}

body.path-patient-portal .hero {
  --hx-card-bg: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}
```

Attach the library conditionally in a preprocess hook:

```php
// themes/custom/mytheme/mytheme.theme

/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $current_path = \Drupal::service('path.current')->getPath();

  if (strpos($current_path, '/patient-portal') === 0) {
    $variables['#attached']['library'][] = 'mytheme/patient-portal-tokens';
  }
}
```

Library definition:

```yaml
# mytheme.libraries.yml
patient-portal-tokens:
  version: 1.x
  css:
    theme:
      css/pages/patient-portal.css: {}
  dependencies:
    - mytheme/helix-tokens
```

## Responsive Token Values

CSS custom properties can be redefined at different breakpoints for responsive theming.

### Mobile-First Spacing

```css
/* themes/custom/mytheme/css/helix-tokens.css */

:root {
  /* Mobile spacing (default) */
  --hx-card-padding: var(--hx-space-4, 1rem);
  --hx-button-font-size: var(--hx-font-size-sm, 0.875rem);
}

/* Tablet and up */
@media (min-width: 768px) {
  :root {
    --hx-card-padding: var(--hx-space-6, 1.5rem);
    --hx-button-font-size: var(--hx-font-size-md, 1rem);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  :root {
    --hx-card-padding: var(--hx-space-8, 2rem);
  }
}
```

Components automatically respond because they reference these tokens internally.

### Container-Relative Sizing

For modern browsers, container queries allow components to adapt to their container size:

```css
/* themes/custom/mytheme/css/components/card-grid.css */

.card-grid {
  container-type: inline-size;
  container-name: card-grid;
}

/* Small containers: compact cards */
@container card-grid (max-width: 600px) {
  .card-grid hx-card {
    --hx-card-padding: var(--hx-space-3);
    --hx-font-size-md: var(--hx-font-size-sm);
  }
}

/* Large containers: spacious cards */
@container card-grid (min-width: 900px) {
  .card-grid hx-card {
    --hx-card-padding: var(--hx-space-8);
  }
}
```

This is especially useful in Drupal's Layout Builder where component container sizes vary by region.

## Complete Theming Example

Here's a full example showing enterprise healthcare theme with brand tokens, dark mode, and responsive overrides.

### File Structure

```
themes/custom/healthsystem/
├── healthsystem.info.yml
├── healthsystem.libraries.yml
└── css/
    ├── helix-tokens.css          # Global token definitions
    ├── helix-dark-mode.css       # Dark mode overrides
    ├── helix-components.css      # Component customizations
    └── helix-responsive.css      # Responsive adjustments
```

### healthsystem.info.yml

```yaml
name: HealthSystem Theme
type: theme
description: Enterprise healthcare design system powered by HELIX
core_version_requirement: ^10 || ^11
base theme: false

libraries:
  - healthsystem/helix-tokens
  - healthsystem/helix-dark-mode
  - healthsystem/helix-components
  - healthsystem/helix-responsive
  - healthsystem/helix-library
```

### healthsystem.libraries.yml

```yaml
helix-tokens:
  version: 1.x
  css:
    theme:
      css/helix-tokens.css: { weight: -10 }

helix-dark-mode:
  version: 1.x
  css:
    theme:
      css/helix-dark-mode.css: { weight: -9 }

helix-components:
  version: 1.x
  css:
    theme:
      css/helix-components.css: { weight: 0 }

helix-responsive:
  version: 1.x
  css:
    theme:
      css/helix-responsive.css: { weight: 1 }

helix-library:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
  dependencies:
    - helix-tokens
    - helix-dark-mode
```

### css/helix-tokens.css

```css
/**
 * HealthSystem HELIX Token Overrides
 * Brand-aligned design tokens for enterprise healthcare
 */

:root {
  /* ─── Brand Identity ─── */
  --hx-color-primary-500: #004d99; /* HealthSystem Blue */
  --hx-color-primary-600: #003d7a;
  --hx-color-primary-700: #002d5c;

  --hx-color-secondary-500: #00a3e0; /* Accent Teal */

  /* ─── Typography (WCAG AA Compliance) ─── */
  --hx-font-family-sans: 'Source Sans Pro', 'Open Sans', system-ui, sans-serif;
  --hx-font-size-base: 16px;

  /* ─── Accessibility (WCAG AAA Focus Indicators) ─── */
  --hx-focus-ring-width: 3px;
  --hx-focus-ring-color: #004d99;
  --hx-focus-ring-offset: 3px;

  /* ─── Semantic Colors (Healthcare Context) ─── */
  --hx-color-success-500: #00875a; /* Positive results */
  --hx-color-warning-500: #ff8b00; /* Caution/review needed */
  --hx-color-error-500: #c9372c; /* Critical alerts */
  --hx-color-info-500: #0065ff; /* Informational notices */

  /* ─── Component Defaults ─── */
  --hx-button-border-radius: var(--hx-border-radius-md);
  --hx-card-border-radius: var(--hx-border-radius-lg);
  --hx-input-border-radius: var(--hx-border-radius-md);

  /* ─── Interaction Timing (Reduced Motion Considered) ─── */
  --hx-transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --hx-transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  :root {
    --hx-transition-fast: 50ms linear;
    --hx-transition-normal: 50ms linear;
  }
}
```

### css/helix-dark-mode.css

```css
/**
 * Dark Mode for HealthSystem
 * Optimized for low-light clinical environments
 */

@media (prefers-color-scheme: dark) {
  :root {
    /* ─── Inverted Neutrals ─── */
    --hx-color-neutral-0: #0a0a0a;
    --hx-color-neutral-50: #1a1a1a;
    --hx-color-neutral-100: #2a2a2a;
    --hx-color-neutral-700: #d4d4d4;
    --hx-color-neutral-800: #e5e5e5;
    --hx-color-neutral-900: #f5f5f5;

    /* ─── Component Backgrounds ─── */
    --hx-card-bg: #1a1a1a;
    --hx-card-color: #e5e5e5;
    --hx-card-border-color: #3a3a3a;

    --hx-input-bg: #2a2a2a;
    --hx-input-border-color: #404040;
    --hx-input-color: #e5e5e5;

    --hx-button-bg: #004d99; /* Primary button stays vibrant */

    /* ─── Alert Adjustments (Maintain WCAG Contrast) ─── */
    --hx-color-success-50: #002d1a;
    --hx-color-success-800: #4ade80;

    --hx-color-warning-50: #331a00;
    --hx-color-warning-800: #fbbf24;

    --hx-color-error-50: #330a0a;
    --hx-color-error-800: #f87171;

    /* ─── Reduced Shadow Intensity ─── */
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5);
    --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.6);
  }
}
```

### css/helix-components.css

```css
/**
 * Component-Specific Customizations
 */

/* Primary CTA buttons have gradient treatment */
.button--primary-cta {
  --hx-button-bg: linear-gradient(135deg, #004d99 0%, #00a3e0 100%);
  --hx-button-border-radius: var(--hx-border-radius-full);
  --hx-button-font-weight: var(--hx-font-weight-bold);
}

/* Patient cards need extra padding for touch targets */
.patient-list hx-card {
  --hx-card-padding: var(--hx-space-6);
  --hx-card-gap: var(--hx-space-4);
}

/* Form inputs in clinical workflows use larger touch targets */
.clinical-form hx-text-input,
.clinical-form hx-select {
  --hx-input-height-md: var(--hx-size-12, 3rem);
  --hx-font-size-md: var(--hx-font-size-lg, 1.125rem);
}

/* Alert banners span full width with prominent borders */
.page__alert hx-alert {
  --hx-alert-border-width: var(--hx-border-width-medium, 2px);
  --hx-alert-padding: var(--hx-space-6);
}
```

### css/helix-responsive.css

```css
/**
 * Responsive Token Adjustments
 */

/* Mobile: Compact spacing */
:root {
  --hx-card-padding: var(--hx-space-4);
  --hx-button-padding-x: var(--hx-space-3);
}

/* Tablet: Comfortable spacing */
@media (min-width: 768px) {
  :root {
    --hx-card-padding: var(--hx-space-6);
    --hx-button-padding-x: var(--hx-space-4);
  }
}

/* Desktop: Spacious layout */
@media (min-width: 1024px) {
  :root {
    --hx-card-padding: var(--hx-space-8);
    --hx-button-padding-x: var(--hx-space-6);
  }

  /* Larger touch targets not needed on desktop */
  .clinical-form hx-text-input,
  .clinical-form hx-select {
    --hx-input-height-md: var(--hx-size-10, 2.5rem);
  }
}
```

## Debugging Token Values

When theming isn't working as expected, use these debugging techniques.

### Browser DevTools

Inspect a component and check computed values:

```javascript
// In browser console
const button = document.querySelector('hx-button');
const styles = getComputedStyle(button);

// Check what token resolved to
console.log(styles.getPropertyValue('--hx-button-bg'));

// List all custom properties starting with --hx-
Array.from(styles)
  .filter((prop) => prop.startsWith('--hx-'))
  .forEach((prop) => console.log(prop, styles.getPropertyValue(prop)));
```

### Visual Token Inspector (Development)

Add a temporary utility to your theme:

```css
/* themes/custom/mytheme/css/debug/token-inspector.css */

/**
 * Visual token inspector (remove in production)
 */
body::before {
  content: 'Primary: ' var(--hx-color-primary-500) ' | ' 'Focus Ring: ' var(--hx-focus-ring-width)
    ' | ' 'Card Padding: ' var(--hx-card-padding);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 1rem;
  font-size: 0.75rem;
  font-family: monospace;
  z-index: 99999;
  white-space: pre-wrap;
}
```

### Drupal Twig Debug

Enable Twig debugging to see which template is rendering components:

```yaml
# sites/default/services.yml
parameters:
  twig.config:
    debug: true
```

This helps identify where to add component-specific token overrides.

## Best Practices

### Do's

- **Always use fallback chains**: `var(--hx-button-bg, var(--hx-color-primary-500, #2563eb))`
- **Define tokens at `:root`** for global scope
- **Use semantic tokens** for theme-wide changes
- **Document custom tokens** with comments explaining purpose
- **Test in both light and dark modes** if supporting dark mode
- **Respect `prefers-reduced-motion`** for transitions
- **Maintain WCAG AAA contrast ratios** for text and focus indicators

### Don'ts

- **Don't hardcode values** in component overrides; reference tokens
- **Don't override internal `--_private` tokens**; they're implementation details
- **Don't use `!important`** with custom properties; it breaks the cascade
- **Don't define tokens inline** on many elements; use CSS classes
- **Don't forget responsive considerations** for touch targets and spacing
- **Don't skip testing** with actual assistive technologies
- **Don't theme excessively**; visual consistency matters in healthcare

## Token Reference

See the complete list of available HELIX tokens in the [Design Tokens documentation](/design-tokens/). Key categories:

- **Colors**: `--hx-color-*` (primitives), `--hx-color-primary`, `--hx-color-success`, etc.
- **Typography**: `--hx-font-family-*`, `--hx-font-size-*`, `--hx-font-weight-*`
- **Spacing**: `--hx-space-*`, `--hx-size-*`
- **Borders**: `--hx-border-radius-*`, `--hx-border-width-*`
- **Effects**: `--hx-shadow-*`, `--hx-transition-*`
- **Focus**: `--hx-focus-ring-*`
- **Component**: `--hx-button-*`, `--hx-card-*`, `--hx-input-*`, etc.

## Next Steps

- [Drupal Forms Integration](/drupal-integration/forms/) - Form component theming
- [Drupal Behaviors](/drupal-integration/behaviors/) - JavaScript integration with themed components
- [Design Tokens](/design-tokens/) - Complete token reference
- [Accessibility Guidelines](/guides/accessibility/) - WCAG compliance patterns
