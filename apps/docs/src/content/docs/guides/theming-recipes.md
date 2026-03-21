---
title: Theming Recipes
description: Practical recipes for customizing HELiX to match your brand — dark mode, healthcare contrast, compact layouts, custom typography, and more.
sidebar:
  order: 4
---

This guide is for teams consuming HELiX (like `booked-solid-tech` or `trip-planner`) who need to apply their own brand colors, typography, and spacing without modifying HELiX source.

HELiX uses a **three-tier token cascade**. Override at the right tier and every component updates automatically.

```
Primitive Tokens  (raw values — --hx-color-primary-500)
       ↓
Semantic Tokens   (purpose-driven — --hx-color-text-primary)
       ↓
Component Tokens  (scoped — --hx-button-bg)
```

**The rule**: override **Semantic tokens** for brand-wide changes. Override **Component tokens** for targeted, per-component changes. Never touch Primitive tokens directly from consuming apps — change the ramp values instead.

---

## Quick Start: Change the Entire Palette

The fastest way to apply a brand is to replace the primary color ramp. Every component that uses `--hx-color-primary-*` updates automatically.

**Before (HELiX default — blue)**:
All buttons, links, focus rings, and selected states are `#2563eb`.

**After (your brand — teal)**:
Same components, same structure, now rendered in your brand color.

```css
/* your-brand-theme.css — load this after the HELiX token stylesheet */

:root {
  /* Replace the primary ramp with your brand color */
  --hx-color-primary-50:  #f0fdfa;
  --hx-color-primary-100: #ccfbf1;
  --hx-color-primary-200: #99f6e4;
  --hx-color-primary-300: #5eead4;
  --hx-color-primary-400: #2dd4bf;
  --hx-color-primary-500: #14b8a6;  /* ← your brand primary */
  --hx-color-primary-600: #0d9488;
  --hx-color-primary-700: #0f766e;
  --hx-color-primary-800: #115e59;
  --hx-color-primary-900: #134e4a;

  /* Replace the secondary ramp if your brand has one */
  --hx-color-secondary-500: #7c3aed;
  --hx-color-secondary-600: #6d28d9;
}
```

Load this file after the HELiX tokens:

```html
<link rel="stylesheet" href="https://cdn.helixui.dev/tokens/latest/tokens.css" />
<link rel="stylesheet" href="/your-brand-theme.css" />
```

**What updates automatically**: buttons, links, focus rings, checkboxes, radio buttons, switches, selected tabs, badges, alerts, progress bars — any component that draws from the primary ramp.

---

## Recipe 1: Dark Mode Custom Theme

HELiX ships a built-in dark mode. If your brand needs a customized dark palette (different surface colors, branded dark accents), override the dark-mode semantic tokens.

**Activation**: HELiX dark mode activates via `data-theme="dark"` on `<html>` or automatically via `prefers-color-scheme: dark`.

```css
/* Activate dark mode manually */
/* html[data-theme="dark"] applies all dark-mode overrides */
```

**Customizing the dark theme**:

```css
/* Override dark-mode semantic tokens for your brand */
:root[data-theme='dark'] {
  /* Swap surfaces to your brand's dark palette */
  --hx-color-surface-default: #0d1117;   /* GitHub-dark-style near-black */
  --hx-color-surface-raised:  #161b22;
  --hx-color-surface-sunken:  #010409;

  /* Adjust text colors for contrast on your surfaces */
  --hx-color-text-primary:    #e6edf3;
  --hx-color-text-secondary:  #8b949e;
  --hx-color-text-muted:      #6e7681;

  /* Adjust borders */
  --hx-color-border-default:  #30363d;
  --hx-color-border-subtle:   #21262d;

  /* Keep your brand primary visible in dark mode */
  --hx-color-primary-400: #58a6ff;  /* lightened for dark bg contrast */
}
```

**System-preference dark mode** (respects `prefers-color-scheme` unless overridden):

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-surface-default: #0d1117;
    --hx-color-surface-raised:  #161b22;
    --hx-color-text-primary:    #e6edf3;
    /* ... rest of your dark overrides */
  }
}
```

**Theme toggle** (JavaScript):

```js
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Restore persisted preference on load
const saved = localStorage.getItem('theme');
if (saved) setTheme(saved);
```

> **Contrast check**: After applying custom dark colors, verify contrast ratios. Use the browser DevTools accessibility inspector or a tool like `axe` to confirm 4.5:1 for normal text and 3:1 for UI components. HELiX components will not enforce your custom values.

---

## Recipe 2: Healthcare Brand Compliance (HIPAA-Friendly Color Contrast)

Healthcare applications have non-negotiable contrast requirements (WCAG 2.1 AA minimum). This recipe configures a high-contrast palette suitable for clinical environments.

**Requirements**:
- 4.5:1 contrast ratio for normal text
- 3:1 contrast ratio for large text and UI components
- Error and warning states must never rely on color alone (icons + text required)
- No red-green combinations for status indicators (colorblindness)

```css
/* healthcare-theme.css */

:root {
  /* High-contrast neutral ramp */
  --hx-color-neutral-0:    #ffffff;
  --hx-color-neutral-50:   #f8f9fa;
  --hx-color-neutral-100:  #e9ecef;
  --hx-color-neutral-200:  #dee2e6;
  --hx-color-neutral-500:  #6c757d;
  --hx-color-neutral-700:  #495057;
  --hx-color-neutral-900:  #212529;  /* 16:1 contrast on white */

  /* WCAG-compliant error — avoid pure red for colorblindness users */
  --hx-color-error-500:    #c0392b;  /* 4.6:1 on white */
  --hx-color-error-600:    #a93226;  /* 5.8:1 on white */

  /* Warning — avoid yellow/green confusion */
  --hx-color-warning-500:  #e67e22;  /* amber, not yellow */
  --hx-color-warning-600:  #ca6f1e;

  /* Success — use blue-green, not pure green */
  --hx-color-success-500:  #1a7f64;  /* teal-leaning green */
  --hx-color-success-600:  #148f72;

  /* Info — distinct from primary to separate informational vs. interactive */
  --hx-color-info-500:     #2980b9;
  --hx-color-info-600:     #2471a3;

  /* Semantic: text must have strong contrast */
  --hx-color-text-primary:   var(--hx-color-neutral-900);  /* 16:1 on white */
  --hx-color-text-secondary: var(--hx-color-neutral-700);  /* 7:1 on white */
  --hx-color-text-muted:     var(--hx-color-neutral-500);  /* 4.5:1 on white ← minimum */

  /* Focus ring: 3px width ensures visibility for motor-impaired users */
  --hx-focus-ring-width:  3px;
  --hx-focus-ring-offset: 2px;

  /* Touch targets: 44x44px minimum for clinical/touchscreen use */
  --hx-size-touch-target: 2.75rem;  /* 44px */
}
```

**Additional CSS for clinical environments**:

```css
/* Ensure touch targets on interactive components */
hx-button,
hx-checkbox,
hx-radio,
hx-switch {
  min-height: var(--hx-size-touch-target);
}

/* Respect motion sensitivity (critical for patients with vestibular disorders) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

> **Note**: HELiX components are built with WCAG 2.1 AA as the minimum bar. When you override color tokens, the components themselves do not re-validate contrast — that is your responsibility. Always run an accessibility audit (`axe`, browser a11y inspector, or Lighthouse) after applying a custom theme.

---

## Recipe 3: Compact Mode (Data-Dense UIs)

For dashboards, data tables, and admin panels where information density matters, reduce spacing without changing the visual language.

**Before**: Default HELiX spacing — comfortable for reading, designed for consumer UIs.

**After**: 30% tighter spacing — same components, more content visible per screen.

```css
/* compact-mode.css */

:root {
  /* Reduce the spacing scale by ~30% */
  --hx-space-1:  0.125rem;   /* was 0.25rem */
  --hx-space-2:  0.25rem;    /* was 0.5rem */
  --hx-space-3:  0.375rem;   /* was 0.75rem */
  --hx-space-4:  0.625rem;   /* was 1rem */
  --hx-space-5:  0.75rem;    /* was 1.25rem */
  --hx-space-6:  0.875rem;   /* was 1.5rem */
  --hx-space-8:  1.25rem;    /* was 2rem */
  --hx-space-10: 1.5rem;     /* was 2.5rem */
  --hx-space-12: 1.75rem;    /* was 3rem */
  --hx-space-16: 2.5rem;     /* was 4rem */

  /* Tighter typography for data density */
  --hx-font-size-sm:  0.75rem;   /* was 0.875rem */
  --hx-font-size-md:  0.875rem;  /* was 1rem */
  --hx-font-size-lg:  1rem;      /* was 1.125rem */

  /* Tighter line height for dense content */
  --hx-line-height-normal: 1.4;  /* was 1.5 */
  --hx-line-height-tight:  1.2;  /* was 1.25 */

  /* Tighter border radius for a more utilitarian look */
  --hx-border-radius-sm: 2px;
  --hx-border-radius-md: 4px;
  --hx-border-radius-lg: 6px;
}
```

**Scope compact mode to specific sections** (without affecting the rest of the page):

```css
/* Scoped compact mode — only affects .data-panel and descendants */
.data-panel {
  --hx-space-4:  0.625rem;
  --hx-font-size-md: 0.875rem;
  --hx-line-height-normal: 1.4;
}
```

```html
<div class="data-panel">
  <hx-card>
    <hx-text-input label="Filter" />
    <!-- All HELiX components here use compact spacing -->
  </hx-card>
</div>
```

> **Accessibility note**: Compact mode reduces touch target sizes. In clinical environments, maintain `--hx-size-touch-target: 2.75rem` even in compact mode, or restrict compact layouts to desktop/pointer-primary contexts with `@media (pointer: fine)`.

---

## Recipe 4: Custom Typography (Brand Fonts)

Load your brand's typeface and wire it into HELiX's font tokens. Every component that uses typography tokens (buttons, inputs, cards, alerts) picks up the new font automatically.

**Step 1**: Load your font (Google Fonts, Adobe Fonts, self-hosted, etc.)

```html
<!-- Google Fonts example -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

```css
/* Self-hosted example */
@font-face {
  font-family: 'BrandSans';
  src: url('/fonts/BrandSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'BrandSans';
  src: url('/fonts/BrandSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

**Step 2**: Override HELiX font family tokens

```css
/* brand-typography.css */

:root {
  /* Override the sans-serif stack */
  --hx-font-family-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* If your brand uses a distinct mono font */
  --hx-font-family-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Adjust weights if your font uses non-standard values */
  --hx-font-weight-normal:   400;
  --hx-font-weight-medium:   500;
  --hx-font-weight-semibold: 600;
  --hx-font-weight-bold:     700;

  /* Adjust size scale if your font has different optical sizing */
  /* (leave these unchanged if your font is optically similar to Inter) */
  --hx-font-size-xs:  0.75rem;
  --hx-font-size-sm:  0.875rem;
  --hx-font-size-md:  1rem;
  --hx-font-size-lg:  1.125rem;
  --hx-font-size-xl:  1.25rem;
  --hx-font-size-2xl: 1.5rem;

  /* Letter spacing adjustments for brand fonts with different tracking */
  --hx-letter-spacing-tight:  -0.02em;
  --hx-letter-spacing-normal:  0;
  --hx-letter-spacing-wide:    0.02em;
}
```

**Step 3**: Verify rendering in Storybook

Open Storybook and confirm your font loads in buttons, inputs, and text components. If you see a flash of the default font, check that your `@font-face` or Google Fonts link loads before the HELiX stylesheet.

> **Performance**: `font-display: swap` prevents layout shift during font load. For healthcare apps with time-sensitive interfaces, consider `font-display: optional` to avoid FOUT entirely.

---

## Recipe 5: Per-Component Overrides (Just the Button)

When you need to customize a single component without affecting others, override its **Component tokens** directly on the element or a wrapper class.

```css
/* Override only hx-button — no other components affected */
hx-button {
  --hx-button-bg:            #1a1a2e;  /* dark navy */
  --hx-button-color:         #e8e8f0;  /* light text */
  --hx-button-border-radius: 0;        /* sharp corners */
  --hx-button-padding-x:     var(--hx-space-6);
  --hx-button-padding-y:     var(--hx-space-3);
  --hx-button-font-size:     var(--hx-font-size-sm);
  --hx-button-font-weight:   var(--hx-font-weight-medium);
  --hx-button-shadow:        none;
}

/* Hover/focus states — target the component token, not internal CSS */
hx-button:hover {
  --hx-button-bg: #16213e;
}
```

**Card component overrides**:

```css
hx-card {
  --hx-card-bg:             #fafafa;
  --hx-card-border:         1px solid var(--hx-color-border-default);
  --hx-card-border-radius:  var(--hx-border-radius-lg);
  --hx-card-padding:        var(--hx-space-6);
  --hx-card-shadow:         var(--hx-shadow-sm);
}
```

**Text input overrides**:

```css
hx-text-input {
  --hx-text-input-border-radius: var(--hx-border-radius-sm);
  --hx-text-input-border-color:  var(--hx-color-neutral-300);
  --hx-text-input-bg:            var(--hx-color-neutral-50);
  --hx-text-input-focus-ring:    2px solid var(--hx-color-primary-500);
}
```

**Finding a component's tokens**: Each component lists its CSS custom properties in the Storybook docs panel under "CSS Custom Properties." You can also find them in the component's JSDoc in the source.

---

## Recipe 6: Per-Page Theming (Scope Tokens to a Section)

CSS custom properties cascade down the DOM. You can scope an entire HELiX theme to a specific section without affecting the rest of the page.

**Use case**: A marketing landing page uses your brand theme, but an embedded portal section uses a neutral/clinical theme.

```html
<body>
  <!-- Uses default/brand theme -->
  <header>
    <hx-button>Brand Button</hx-button>
  </header>

  <!-- Scoped clinical theme — only applies inside this section -->
  <section class="clinical-portal" data-theme="clinical">
    <hx-button>Clinical Button</hx-button>
    <hx-card>
      <hx-text-input label="Patient ID" />
    </hx-card>
  </section>
</body>
```

```css
/* Scoped theme — applies only inside [data-theme="clinical"] */
[data-theme='clinical'] {
  --hx-color-primary-500:         #1a7f64;  /* teal for clinical */
  --hx-color-primary-600:         #148f72;
  --hx-color-surface-default:     #f8f9fa;
  --hx-color-surface-raised:      #ffffff;
  --hx-color-text-primary:        #212529;
  --hx-font-family-sans:          'Source Sans Pro', sans-serif;
  --hx-border-radius-md:          2px;      /* utilitarian corners */
  --hx-shadow-sm:                 none;     /* flat clinical aesthetic */
}
```

**Scope to a CSS class instead**:

```css
.brand-section {
  --hx-color-primary-500: #e91e63;  /* pink brand */
}

.neutral-section {
  --hx-color-primary-500: #607d8b;  /* grey-blue neutral */
}
```

HELiX Shadow DOM components inherit custom properties from their host's inherited scope — tokens set on a parent element flow into the shadow root correctly. This is a fundamental feature of CSS custom properties and requires no special HELiX setup.

---

## Anti-Patterns: What Not To Do

### Do not pierce Shadow DOM with `::part()` for layout

`::part()` is for **styling exposed parts** (colors, fonts, borders). It is not for changing layout or structure.

```css
/* BAD — overriding layout inside shadow root breaks encapsulation */
hx-button::part(button) {
  display: grid;           /* ⚠️ unexpected layout side effects */
  position: absolute;      /* ⚠️ breaks stacking context */
}

/* GOOD — styling the exposed surface only */
hx-button::part(button) {
  border-radius: 0;        /* ✅ visual customization */
  letter-spacing: 0.05em;  /* ✅ typography adjustment */
}
```

### Do not use `!important` to override tokens

`!important` creates specificity debt that cannot be overridden downstream. It breaks the cascade.

```css
/* BAD — !important prevents per-page or per-component overrides */
:root {
  --hx-color-primary-500: #e91e63 !important;
}

/* GOOD — use specificity through scope, not !important */
[data-brand='acme'] {
  --hx-color-primary-500: #e91e63;
}
```

### Do not hardcode values in component tokens

If you override a component token with a raw value instead of a token reference, you break the theming cascade. Dark mode and compact mode overrides will not propagate.

```css
/* BAD — hardcoded value breaks dark mode */
hx-button {
  --hx-button-bg: #2563eb;          /* ⚠️ won't update in dark mode */
}

/* GOOD — reference semantic token so it updates with the theme */
hx-button {
  --hx-button-bg: var(--hx-color-primary-500);  /* ✅ updates with theme */
}
```

### Do not style internal shadow DOM with non-exposed selectors

HELiX shadow roots are closed to external CSS selectors. Attempting to target internal elements by guessing tag names or classes will silently fail.

```css
/* BAD — this selector does nothing (shadow DOM is encapsulated) */
hx-button button {
  background: red;
}

/* GOOD — use the CSS custom property API */
hx-button {
  --hx-button-bg: red;  /* ✅ uses the published theming API */
}
```

### Do not override primitive tokens with semantically wrong values

Primitive tokens are the shared vocabulary. Overriding `--hx-color-primary-500` with a neutral grey will break all the semantic tokens that rely on it for interactive affordances.

```css
/* BAD — turning primary into a neutral breaks interactive states */
:root {
  --hx-color-primary-500: #888888;  /* ⚠️ focus rings, buttons, links all go grey */
}

/* GOOD — if you want neutral interactive elements, override the semantic tokens */
:root {
  --hx-color-border-focus:   #555555;  /* ✅ just the focus ring color */
  --hx-color-text-link:      #333333;  /* ✅ just link text */
}
```

---

## Token Reference Cheat Sheet

The most commonly overridden tokens, organized by use case:

| Goal | Token to Override | Tier |
|---|---|---|
| Brand primary color | `--hx-color-primary-500` (+ full ramp) | Primitive |
| Dark mode surfaces | `--hx-color-surface-default/raised/sunken` | Semantic |
| Body text | `--hx-color-text-primary` | Semantic |
| Muted/secondary text | `--hx-color-text-secondary`, `--hx-color-text-muted` | Semantic |
| Focus ring | `--hx-color-border-focus`, `--hx-focus-ring-width` | Semantic |
| Default font | `--hx-font-family-sans` | Primitive |
| Button styles | `--hx-button-bg`, `--hx-button-color`, `--hx-button-border-radius` | Component |
| Card styles | `--hx-card-bg`, `--hx-card-padding`, `--hx-card-shadow` | Component |
| Global spacing | `--hx-space-4` (and scale) | Primitive |
| Border radius | `--hx-border-radius-md` (and scale) | Primitive |
| Shadows | `--hx-shadow-sm/md/lg` | Primitive |
| Error color | `--hx-color-error-500` | Primitive |
| Success color | `--hx-color-success-500` | Primitive |

For the complete token list, see the [Design Tokens Overview](/design-tokens/overview/) and [Token Tiers](/design-tokens/tiers/).
