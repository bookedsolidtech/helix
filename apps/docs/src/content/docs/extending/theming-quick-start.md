---
title: Theming Quick Start
description: Override --hx-* design tokens to brand the entire library, scope themes to page regions, and apply dark mode or high-contrast overrides.
sidebar:
  order: 3
---

# Theming Quick Start

HELiX components expose a structured set of `--hx-*` CSS custom properties that let you rebrand the entire library, theme individual page sections, and toggle dark or high-contrast modes — all without modifying component source or fighting Shadow DOM.

This guide walks you from zero to a complete brand theme file in the order most teams need it.

---

## The Three-Tier Token Cascade

All `--hx-*` tokens belong to one of three tiers. Understanding this hierarchy is the single most important concept for effective theming.

```
Primitive tier   --hx-color-primary-500: #2563eb         (raw values)
                        ↓
Semantic tier    --hx-color-text-primary: var(--hx-color-neutral-900)  (meaning)
                        ↓
Component tier   --hx-button-bg: var(--hx-color-primary-500)  (per-component)
```

### What each tier does

| Tier | Examples | Purpose | When to override |
| --- | --- | --- | --- |
| **Primitive** | `--hx-color-primary-500`, `--hx-space-4` | Raw brand values: hex colors, rem sizes, font names | Replace to swap the raw brand palette |
| **Semantic** | `--hx-color-text-primary`, `--hx-color-surface-default` | Contextual meaning: text, surfaces, borders, focus | Replace to theme a region (dark, high-contrast, brand) |
| **Component** | `--hx-button-bg`, `--hx-card-padding` | Per-component overrides | Replace for surgical customization of one component |

### How a button background resolves

When the browser paints an `hx-button`, it resolves the background like this:

```
hx-button background
  ↓
--hx-button-bg (component tier, defined inside hx-button's shadow root)
  ↓
var(--hx-color-primary-500)  (fallback to primitive tier)
  ↓
#2563eb  (default raw value)
```

The key insight: components reference component-tier tokens with semantic or primitive fallbacks. Override at any level in the chain and all downstream consumers update automatically.

See [Token Tiers](/design-tokens/tiers/) for the full tier reference.

---

## Semantic-Level Override: Library-Wide Rebranding

Override the primary color ramp at the semantic (primitive) level to rebrand every component at once. This is the correct approach for a full brand theme.

### Why semantic level means everything updates

`hx-button`, `hx-badge`, `hx-text-input` focus rings, `hx-dialog` headers — every component that references `--hx-color-primary-*` or the semantic tokens that depend on it will reflect the new values. You change one ramp; the entire library follows.

### Full primary ramp override

The primary ramp runs from `-50` (near-white tint) to `-950` (near-black shade). Override all stops to ensure hover states, disabled states, and dark-mode variants all have intentional values rather than mismatched defaults.

```css
/* my-brand.css — primary color ramp override */
:root {
  /* Primitive tier: raw brand values */
  --hx-color-primary-50:  #eff6f8;
  --hx-color-primary-100: #d0e9ef;
  --hx-color-primary-200: #a3d3df;
  --hx-color-primary-300: #6eb8c9;
  --hx-color-primary-400: #3a9db4;
  --hx-color-primary-500: #006e8a;   /* primary action color */
  --hx-color-primary-600: #005f78;
  --hx-color-primary-700: #004f65;
  --hx-color-primary-800: #003f52;
  --hx-color-primary-900: #002f3e;
  --hx-color-primary-950: #001f2a;
}
```

After this override, every component that uses `var(--hx-color-primary-500)` — directly or through a semantic fallback — switches to the new brand teal.

To also adjust semantic-tier aliases (text on primary, focus borders), add:

```css
:root {
  /* Primary ramp (from above) ... */

  /* Semantic overrides that reference the primary ramp */
  --hx-color-border-focus: var(--hx-color-primary-500);
  --hx-color-text-link:    var(--hx-color-primary-600);
  --hx-color-text-link-hover: var(--hx-color-primary-700);
}
```

---

## Component-Level Override: Surgical Customization

When you want to change one component without affecting others, override its component-tier token on the element selector.

### Override a single button

```css
/* Changes hx-button background only — no other component is affected */
hx-button {
  --hx-button-bg: var(--hx-color-primary-600);
}
```

### Target a specific variant or context

```css
/* Override only danger buttons */
hx-button[variant="danger"] {
  --hx-button-bg: #b91c1c;
}

/* Override buttons inside a specific section */
.sidebar hx-button {
  --hx-button-bg: var(--hx-color-neutral-700);
}
```

### Inline override for a single instance

```html
<hx-button style="--hx-button-bg: #7c3aed;">
  Schedule Appointment
</hx-button>
```

Component-tier overrides follow standard CSS specificity. The most specific selector wins.

See [Customization](/design-tokens/customization/) for the full component token catalog.

---

## The `hx-theme` Provider

`<hx-theme>` is a zero-layout infrastructure component that injects a full set of `--hx-*` tokens into its subtree. Wrap any region of your page with it to scope a named theme.

```html
<!-- The entire subtree gets dark-mode --hx-* tokens -->
<hx-theme theme="dark">
  <hx-card>
    <span slot="header">Medication Summary</span>
    <hx-button>Administer</hx-button>
  </hx-card>
</hx-theme>
```

### The `theme` attribute

| Value | Behavior |
| --- | --- |
| `light` | Standard light-mode token set (default) |
| `dark` | Dark-mode semantic overrides applied on top of light primitives |
| `high-contrast` | WCAG 7:1+ contrast token set for low-vision users |
| `auto` | Follows `prefers-color-scheme`; resolves to `light` or `dark` at runtime |

`hx-theme` has `display: contents` — it inserts no wrapper element into layout. There is no box, no margin, no padding.

### Read the active theme programmatically

When `theme="auto"`, the actual resolved value (light or dark) is available via the `effectiveTheme` getter:

```typescript
const themeEl = document.querySelector('hx-theme') as HTMLElement & {
  effectiveTheme: 'light' | 'dark' | 'high-contrast';
};

console.log(themeEl.effectiveTheme); // 'dark' if OS is dark mode
```

### Wrap a page section

```html
<body>
  <header>
    <hx-theme theme="dark">
      <nav>
        <hx-button variant="ghost">Dashboard</hx-button>
        <hx-button variant="ghost">Patients</hx-button>
      </nav>
    </hx-theme>
  </header>

  <main>
    <!-- main content uses whatever tokens :root provides -->
    <hx-card>...</hx-card>
  </main>
</body>
```

### Nest themes: dark sidebar inside a light page

Themes compose. Inner `hx-theme` elements override the outer scope cleanly because each injects its tokens into its own Shadow DOM's adopted stylesheet.

```html
<hx-theme theme="light">
  <main>
    <hx-card>Patient record panel</hx-card>
  </main>

  <hx-theme theme="dark">
    <aside>
      <!-- These components receive dark tokens,
           even though the page root is light -->
      <hx-card>Navigation sidebar</hx-card>
      <hx-button>Log Out</hx-button>
    </aside>
  </hx-theme>
</hx-theme>
```

The inner `hx-theme` does not bleed into the outer scope. Switching the outer theme to `high-contrast` will not affect the inner `dark` region unless you change it explicitly.

---

## Scoped Theming via CSS Selectors

When you cannot wrap a region with `hx-theme` — for example, if a CMS controls the DOM structure — apply overrides on a CSS class or container selector instead.

```css
/* Only components inside .brand-section get these overrides */
.brand-section {
  --hx-color-primary-500: #006e8a;
  --hx-color-primary-600: #005f78;
  --hx-color-border-focus: var(--hx-color-primary-500);
}
```

```html
<div class="brand-section">
  <hx-button>Book Appointment</hx-button>  <!-- teal -->
  <hx-text-input label="Patient Name"></hx-text-input>  <!-- teal focus ring -->
</div>

<div>
  <hx-button>Default Action</hx-button>  <!-- original blue -->
</div>
```

CSS custom properties inherit through the DOM. Any `hx-*` component inside `.brand-section` picks up the override automatically — even components added dynamically after the page loads.

### Scope to a Drupal region or block

```css
/* Apply to a specific Drupal region */
.region-sidebar-first {
  --hx-color-primary-500: #4f46e5;
  --hx-color-surface-default: #f8f7ff;
}

/* Apply to a specific content type */
.node--type-clinical-alert {
  --hx-color-primary-500: #b91c1c;
  --hx-color-border-default: var(--hx-color-primary-500);
}
```

---

## Dark Mode Token Overrides

HELiX ships dark-mode tokens through `hx-theme` at the component level. For global dark mode in your application stylesheet — affecting all components not wrapped in an `hx-theme` — use either the attribute pattern or the media query pattern.

### Method 1: `[data-theme="dark"]` attribute

Apply `data-theme="dark"` to `<html>` (or any ancestor element) and override the semantic tier:

```css
[data-theme='dark'] {
  /* Text */
  --hx-color-text-primary:    var(--hx-color-neutral-100);
  --hx-color-text-secondary:  var(--hx-color-neutral-300);
  --hx-color-text-muted:      var(--hx-color-neutral-400);
  --hx-color-text-link:       var(--hx-color-primary-400);

  /* Surfaces */
  --hx-color-surface-default: var(--hx-color-neutral-900);
  --hx-color-surface-raised:  var(--hx-color-neutral-800);
  --hx-color-surface-sunken:  var(--hx-color-neutral-950);

  /* Borders */
  --hx-color-border-default:  var(--hx-color-neutral-700);
  --hx-color-border-subtle:   var(--hx-color-neutral-800);

  /* Body */
  --hx-body-bg:    var(--hx-color-surface-default);
  --hx-body-color: var(--hx-color-text-primary);

  /* Shadows — darken less against dark backgrounds */
  --hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.4);
  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.3);
}
```

Toggle it in JavaScript:

```typescript
// Enable dark mode
document.documentElement.dataset.theme = 'dark';

// Return to light mode
delete document.documentElement.dataset.theme;

// Read current mode
const isDark = document.documentElement.dataset.theme === 'dark';
```

### Method 2: `prefers-color-scheme` media query

Automatic dark mode that respects the OS preference, with a light-mode escape hatch:

```css
@media (prefers-color-scheme: dark) {
  /* Apply unless the user has explicitly chosen light mode */
  :root:not([data-theme='light']) {
    --hx-color-text-primary:    var(--hx-color-neutral-100);
    --hx-color-text-secondary:  var(--hx-color-neutral-300);
    --hx-color-text-muted:      var(--hx-color-neutral-400);
    --hx-color-text-link:       var(--hx-color-primary-400);

    --hx-color-surface-default: var(--hx-color-neutral-900);
    --hx-color-surface-raised:  var(--hx-color-neutral-800);
    --hx-color-surface-sunken:  var(--hx-color-neutral-950);

    --hx-color-border-default:  var(--hx-color-neutral-700);
    --hx-color-border-subtle:   var(--hx-color-neutral-800);

    --hx-body-bg:    var(--hx-color-surface-default);
    --hx-body-color: var(--hx-color-text-primary);

    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  }
}
```

The `:not([data-theme='light'])` guard means: if the user has explicitly set light mode via your theme toggle, the media query does not override their choice.

### Combining both methods

Use both together to support explicit user preference AND OS preference:

```css
/* Explicit dark mode — highest priority */
[data-theme='dark'] {
  /* dark overrides */
}

/* OS dark mode — applies when no explicit choice is set */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    /* same dark overrides */
  }
}
```

See [Theming](/design-tokens/theming/) for the full dark token reference.

---

## High-Contrast Token Set

`theme="high-contrast"` on `hx-theme` activates a WCAG 7:1+ contrast token set designed for low-vision users. This is a healthcare-specific accessibility feature.

### When to use it

High-contrast mode is not dark mode. It is an accessibility accommodation:

- Black backgrounds (`#000000`), white text (`#FFFFFF`)
- Yellow links (`#FFFF00`) with high luminance contrast
- White borders (`#FFFFFF`) on all interactive elements
- Yellow focus rings (`#FFFF00`) for maximum keyboard navigation visibility
- Minimum 7:1 contrast ratio throughout (exceeds WCAG AA, meets WCAG AAA)

Appropriate contexts:
- Patient-facing portals where users may have low vision or cataracts
- EHR interfaces used under bright clinical lighting
- Any screen where WCAG 7:1 contrast is a legal or contractual requirement

### Activate via `hx-theme`

```html
<!-- Entire page in high-contrast mode -->
<hx-theme theme="high-contrast">
  <main>
    <hx-button>Submit Order</hx-button>
    <hx-text-input label="Patient MRN"></hx-text-input>
  </main>
</hx-theme>
```

### Activate programmatically

```typescript
const themeEl = document.querySelector('hx-theme');
if (themeEl) {
  themeEl.setAttribute('theme', 'high-contrast');
}
```

### Add a user preference toggle

```typescript
function setAccessibilityMode(mode: 'standard' | 'high-contrast'): void {
  const themeEl = document.querySelector('hx-theme') as HTMLElement;
  if (!themeEl) return;

  themeEl.setAttribute('theme', mode === 'high-contrast' ? 'high-contrast' : 'light');

  // Persist the choice
  localStorage.setItem('hx-preferred-theme', mode);
}

// Restore on page load
const saved = localStorage.getItem('hx-preferred-theme');
if (saved === 'high-contrast') {
  setAccessibilityMode('high-contrast');
}
```

High-contrast mode is distinct from `prefers-contrast: more` media queries. If you also want to respect the OS accessibility preference, add:

```css
@media (prefers-contrast: more) {
  /* hx-theme cannot respond to this automatically — set it in JS */
}
```

```typescript
if (window.matchMedia('(prefers-contrast: more)').matches) {
  document.querySelector('hx-theme')?.setAttribute('theme', 'high-contrast');
}
```

---

## Complete Brand Theme Recipe

The following is a production-ready brand theme file. It overrides all three tiers for a complete visual rebrand.

### The theme file

```css
/* acme-health-theme.css
 *
 * Complete brand theme for Acme Health.
 * Override at the primitive tier (color ramps, type scale)
 * and semantic tier (text, surfaces, borders).
 * Component tier is left to component-level overrides.
 */

:root {
  /* ─── Primitive tier: Acme Health brand palette ─────────────────────────── */

  /* Primary: Acme teal */
  --hx-color-primary-50:  #ecfaf8;
  --hx-color-primary-100: #c9f2ed;
  --hx-color-primary-200: #94e4da;
  --hx-color-primary-300: #5fd1c3;
  --hx-color-primary-400: #2dbdad;
  --hx-color-primary-500: #00968a;  /* main action color */
  --hx-color-primary-600: #007d73;
  --hx-color-primary-700: #006560;
  --hx-color-primary-800: #004e4c;
  --hx-color-primary-900: #003737;
  --hx-color-primary-950: #002020;

  /* Typography */
  --hx-font-family-sans: 'Acme Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --hx-font-family-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Geometry */
  --hx-border-radius-sm: 3px;
  --hx-border-radius-md: 6px;
  --hx-border-radius-lg: 10px;

  /* ─── Semantic tier: light mode overrides ────────────────────────────────── */

  --hx-color-text-link:       var(--hx-color-primary-600);
  --hx-color-text-link-hover: var(--hx-color-primary-700);
  --hx-color-border-focus:    var(--hx-color-primary-500);
  --hx-color-focus-ring:      var(--hx-color-primary-500);
}

/* ─── Dark mode overrides ──────────────────────────────────────────────────── */

[data-theme='dark'] {
  --hx-color-text-primary:    var(--hx-color-neutral-100);
  --hx-color-text-secondary:  var(--hx-color-neutral-300);
  --hx-color-text-muted:      var(--hx-color-neutral-400);
  --hx-color-text-link:       var(--hx-color-primary-300);
  --hx-color-text-link-hover: var(--hx-color-primary-200);

  --hx-color-surface-default: var(--hx-color-neutral-900);
  --hx-color-surface-raised:  var(--hx-color-neutral-800);
  --hx-color-surface-sunken:  var(--hx-color-neutral-950);

  --hx-color-border-default:  var(--hx-color-neutral-700);
  --hx-color-border-subtle:   var(--hx-color-neutral-800);
  --hx-color-border-focus:    var(--hx-color-primary-400);
  --hx-color-focus-ring:      var(--hx-color-primary-400);

  --hx-body-bg:    var(--hx-color-surface-default);
  --hx-body-color: var(--hx-color-text-primary);

  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-text-primary:    var(--hx-color-neutral-100);
    --hx-color-text-secondary:  var(--hx-color-neutral-300);
    --hx-color-surface-default: var(--hx-color-neutral-900);
    --hx-color-surface-raised:  var(--hx-color-neutral-800);
    --hx-color-border-default:  var(--hx-color-neutral-700);
    --hx-color-border-focus:    var(--hx-color-primary-400);
    --hx-body-bg:    var(--hx-color-surface-default);
    --hx-body-color: var(--hx-color-text-primary);
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  }
}
```

### Import method 1: Plain CSS stylesheet (HTML / Drupal)

Add the theme file as a `<link>` before any HELiX component scripts. No build tools required.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- 1. Load the HELiX component library -->
    <script type="module" src="/dist/helix.js"></script>

    <!-- 2. Load your brand theme — overrides the default :root tokens -->
    <link rel="stylesheet" href="/css/acme-health-theme.css" />
  </head>
  <body>
    <hx-button>Book Appointment</hx-button>
  </body>
</html>
```

The link order matters: the brand theme file must load after any HELiX baseline CSS but the `<link>` tag placement does not matter for CSS custom properties — they resolve at paint time, not load time. Loading it anywhere in `<head>` is safe.

### Import method 2: Lit `css` tagged template (Lit component consumers)

When building Lit components that compose HELiX components, import the theme as a Lit `css` tagged template and spread it into `static styles`:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Import your brand theme as a Lit CSSResult
import { acmeHealthTheme } from './acme-health-theme.styles.js';

// acme-health-theme.styles.ts
// export const acmeHealthTheme = css`
//   :host {
//     --hx-color-primary-500: #00968a;
//     --hx-font-family-sans: 'Acme Sans', 'Inter', sans-serif;
//     /* ... all brand overrides scoped to :host */
//   }
// `;

@customElement('acme-app-shell')
export class AcmeAppShell extends LitElement {
  // Spread brand theme before component-specific styles
  static override styles = [
    acmeHealthTheme,
    css`
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ];

  override render() {
    return html`
      <hx-theme theme="light">
        <slot></slot>
      </hx-theme>
    `;
  }
}
```

The `acme-health-theme.styles.ts` file uses `:host` rather than `:root` because the tokens need to apply to the Shadow DOM scope of the shell component and cascade into its slotted content:

```typescript
// acme-health-theme.styles.ts
import { css } from 'lit';

export const acmeHealthTheme = css`
  :host {
    /* Primary ramp */
    --hx-color-primary-50:  #ecfaf8;
    --hx-color-primary-500: #00968a;
    --hx-color-primary-600: #007d73;
    --hx-color-primary-950: #002020;

    /* Typography */
    --hx-font-family-sans: 'Acme Sans', 'Inter', -apple-system, sans-serif;

    /* Geometry */
    --hx-border-radius-md: 6px;

    /* Semantic overrides */
    --hx-color-text-link:    var(--hx-color-primary-600);
    --hx-color-border-focus: var(--hx-color-primary-500);
    --hx-color-focus-ring:   var(--hx-color-primary-500);
  }
`;
```

---

## Drupal Use Case: No Build Tools

Drupal teams frequently work without npm or a bundler. HELiX theming is fully compatible with this workflow because CSS custom properties are a native browser feature.

### Method 1: Use `hx-theme` in a Twig template

Load the HELiX library via CDN (or your Drupal library definition) and wrap a region with `hx-theme`:

```twig
{# page--clinical-portal.html.twig #}
<!DOCTYPE html>
<html{{ html_attributes }}>
  <head>
    <title>{{ head_title }}</title>
    {{ head }}

    {# HELiX via CDN — substitute with your Drupal library path #}
    <script type="module" src="https://cdn.example.com/helix/helix.esm.js"></script>

    {# Brand theme — a plain CSS file, no build step needed #}
    <link rel="stylesheet" href="/themes/custom/acme_health/css/acme-health-theme.css" />
  </head>
  <body{{ attributes }}>

    {# Wrap the entire page in a light theme provider #}
    <hx-theme theme="light">

      {{ page.header }}

      {# Dark sidebar — nested inside the light page theme #}
      <hx-theme theme="dark">
        {{ page.sidebar_first }}
      </hx-theme>

      <main role="main">
        {{ page.content }}
      </main>

      {{ page.footer }}

    </hx-theme>

  </body>
</html>
```

### Method 2: Inline `<style>` block with CSS custom property overrides

For per-template overrides without a separate CSS file, place a `<style>` block directly in the Twig template. This is appropriate for region-scoped overrides on a specific content type:

```twig
{# node--clinical-alert--full.html.twig #}

<style>
  .clinical-alert-node {
    /* Override primary color to clinical red for this node type */
    --hx-color-primary-500: #b91c1c;
    --hx-color-primary-600: #991b1b;
    --hx-color-primary-400: #dc2626;

    /* Tighten border radius for clinical density */
    --hx-border-radius-md: 2px;
  }
</style>

<div class="clinical-alert-node">
  <hx-alert variant="danger">
    {{ content.field_alert_body }}
  </hx-alert>

  <hx-button>Acknowledge Alert</hx-button>
</div>
```

### Method 3: Dark mode in a Drupal block template

Apply dark mode to a specific block — no JavaScript required:

```twig
{# block--sidebar-nav.html.twig #}
<hx-theme theme="dark">
  <div{{ attributes.addClass('block', 'block-sidebar-nav') }}>
    {% if label %}
      <h2{{ title_attributes }}>{{ label }}</h2>
    {% endif %}

    <nav>
      {{ content }}
    </nav>
  </div>
</hx-theme>
```

### Drupal library definition

Register the brand theme CSS as a Drupal library so it loads only where needed:

```yaml
# acme_health.libraries.yml
brand-theme:
  css:
    theme:
      css/acme-health-theme.css: {}
  dependencies:
    - core/drupal
```

```php
// In hook_preprocess_page() or your theme's preprocess functions
function acme_health_preprocess_page(array &$variables): void {
  $variables['#attached']['library'][] = 'acme_health/brand-theme';
}
```

The CSS file loads as a standard stylesheet — no npm, no Webpack, no build pipeline required.

---

## Quick Reference

### Override target decision

| Goal | Where to override | Selector |
| --- | --- | --- |
| Rebrand the entire library | Primitive ramp | `:root` |
| Theme a page region | Semantic tokens | `.my-section` or `hx-theme` |
| Customize one component type | Component token | `hx-button` |
| Customize a single instance | Component token | `hx-button[data-id="submit"]` or inline `style` |
| Apply dark mode globally | Semantic tokens | `[data-theme="dark"]` or `@media (prefers-color-scheme: dark)` |
| Apply high-contrast mode | `hx-theme` attribute | `<hx-theme theme="high-contrast">` |

### Token naming reference

| Pattern | Tier | Example |
| --- | --- | --- |
| `--hx-color-{palette}-{stop}` | Primitive | `--hx-color-primary-500` |
| `--hx-space-{step}` | Primitive | `--hx-space-4` |
| `--hx-font-family-{variant}` | Primitive | `--hx-font-family-sans` |
| `--hx-color-text-{role}` | Semantic | `--hx-color-text-primary` |
| `--hx-color-surface-{role}` | Semantic | `--hx-color-surface-default` |
| `--hx-color-border-{role}` | Semantic | `--hx-color-border-focus` |
| `--hx-{component}-{property}` | Component | `--hx-button-bg` |

---

## References

- [Token Tiers](/design-tokens/tiers/) — Full three-tier token hierarchy reference
- [Theming](/design-tokens/theming/) — Dark mode token catalog
- [Customization](/design-tokens/customization/) — Per-component token override reference
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — CSS custom property inheritance and cascade
- [MDN: `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) — Media query for OS color scheme preference
- [MDN: `prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) — Media query for OS contrast preference
- [WCAG 2.1 — Contrast (Enhanced) 1.4.6](https://www.w3.org/TR/WCAG21/#contrast-enhanced) — The 7:1 contrast ratio requirement
- [Drupal.org: Adding stylesheets and JavaScript](https://www.drupal.org/docs/develop/theming-drupal/adding-stylesheets-css-and-javascript-js-to-a-drupal-theme) — Drupal library system for CSS assets
