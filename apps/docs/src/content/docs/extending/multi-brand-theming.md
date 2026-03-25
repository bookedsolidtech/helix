---
title: Multi-Brand Theming
description: White-label a single @helixui/library instance across multiple hospital brands using a 3-tier token override system, runtime brand switching, CSS parts for structural variation, and Drupal multisite architecture.
sidebar:
  order: 6
---

# Multi-Brand Theming

Enterprise healthcare organizations routinely serve multiple hospital brands from a single codebase — Harbor Health, St. Mary's Hospital, and Northwell Health may share the same EHR platform but require distinct color palettes, typography, logo treatments, and sometimes structural layout differences.

HELiX is designed for this. A single `@helixui/library` instance serves every brand. Token overrides do the visual work. CSS parts and conditional properties handle structural variation. Runtime brand switching requires no page reload.

This guide is the production architecture reference for multi-brand deployments.

---

## The 3-Tier Override Architecture {#architecture}

Multi-brand theming uses the same 3-tier token cascade as single-brand theming, extended with a brand-scoping layer.

```
Tier 1: Base @helixui/tokens
  (primitive values shipped with the library)
  --hx-color-primary-500: #2563eb
  --hx-font-family-sans: 'Inter', sans-serif

        ↓

Tier 2: Brand-specific CSS custom property overrides
  (loaded per brand, override tier 1 within a scope)
  [data-brand="harbor-health"] {
    --hx-color-primary-500: #006e8a;
    --hx-font-family-sans: 'Harbor Sans', 'Inter', sans-serif;
  }

        ↓

Tier 3: Runtime theme provider injection
  (hx-theme or ThemeProvider applies the active brand to the DOM)
  <hx-theme data-brand="harbor-health" theme="light">
    <!-- all components in this subtree use Harbor Health tokens -->
  </hx-theme>
```

### Cascade rules

The cascade resolves from most-specific to least-specific:

1. **Inline `style` attribute** — per-instance override, highest priority
2. **Component token** (`--hx-button-bg`) — per-component override
3. **Brand scope** (`[data-brand="x"]`) — brand-specific primitive override
4. **Semantic token** (`--hx-color-primary`) — purpose-driven alias
5. **Library default** — the `@helixui/tokens` baseline

Consumers override at tier 2 (brand scope). Components consume at tier 3 (component tokens) with tier 1/2 fallbacks. The structure means brands never need to know component internals — they set color palettes and typography, and every component updates automatically.

---

## brands/ Directory Structure {#directory-structure}

Organize brand token files in a `brands/` directory alongside your application code. Each brand gets its own subdirectory.

```
brands/
├── harbor-health/
│   ├── tokens.css          # Complete brand token override (load this)
│   ├── colors.json         # Brand palette in JSON (for tooling/documentation)
│   ├── typography.json     # Brand typeface definitions
│   └── assets/
│       └── logo.svg        # Brand logo
│
├── st-marys-hospital/
│   ├── tokens.css
│   ├── colors.json
│   ├── typography.json
│   └── assets/
│       └── logo.svg
│
└── northwell-health/
    ├── tokens.css
    ├── colors.json
    ├── typography.json
    └── assets/
        └── logo.svg
```

### Harbor Health — `brands/harbor-health/tokens.css`

Harbor Health's identity: deep teal primary, rounded corners, Inter typeface.

```css
/* Harbor Health brand token overrides
 * Scope: [data-brand="harbor-health"]
 * Override tier: primitive + semantic
 */

[data-brand='harbor-health'] {
  /* ── Primary color ramp ─────────────────────────────────────── */
  --hx-color-primary-50:  #eff6f8;
  --hx-color-primary-100: #d0e9ef;
  --hx-color-primary-200: #a3d3df;
  --hx-color-primary-300: #6eb8c9;
  --hx-color-primary-400: #3a9db4;
  --hx-color-primary-500: #006e8a;   /* primary action */
  --hx-color-primary-600: #005f78;
  --hx-color-primary-700: #004f65;
  --hx-color-primary-800: #003f52;
  --hx-color-primary-900: #002f3e;
  --hx-color-primary-950: #001f2a;

  /* ── Typography ─────────────────────────────────────────────── */
  --hx-font-family-sans: 'Harbor Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --hx-font-family-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* ── Geometry ───────────────────────────────────────────────── */
  --hx-border-radius-sm: 4px;
  --hx-border-radius-md: 8px;
  --hx-border-radius-lg: 12px;

  /* ── Semantic overrides ─────────────────────────────────────── */
  --hx-color-text-link:       var(--hx-color-primary-600);
  --hx-color-text-link-hover: var(--hx-color-primary-700);
  --hx-color-border-focus:    var(--hx-color-primary-500);
  --hx-color-focus-ring:      var(--hx-color-primary-500);

  /* ── Brand-specific layout flags ────────────────────────────── */
  --brand-logo-width:      160px;
  --brand-sidebar-enabled: 1;   /* 1 = visible, 0 = hidden */
  --brand-header-layout:   'standard';
}
```

### St. Mary's Hospital — `brands/st-marys-hospital/tokens.css`

St. Mary's identity: warm maroon primary, rectangular corners for clinical density, Source Sans Pro typeface.

```css
/* St. Mary's Hospital brand token overrides */

[data-brand='st-marys-hospital'] {
  /* ── Primary color ramp ─────────────────────────────────────── */
  --hx-color-primary-50:  #fdf2f4;
  --hx-color-primary-100: #fad5db;
  --hx-color-primary-200: #f4abb8;
  --hx-color-primary-300: #eb7a8d;
  --hx-color-primary-400: #dd4c65;
  --hx-color-primary-500: #8b1a2e;   /* St. Mary's maroon */
  --hx-color-primary-600: #7a1628;
  --hx-color-primary-700: #661121;
  --hx-color-primary-800: #520d1a;
  --hx-color-primary-900: #3e0913;
  --hx-color-primary-950: #29060c;

  /* ── Typography ─────────────────────────────────────────────── */
  --hx-font-family-sans:    'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
  --hx-font-family-display: 'Georgia', 'Times New Roman', serif;

  /* ── Geometry: tight for clinical density ───────────────────── */
  --hx-border-radius-sm: 2px;
  --hx-border-radius-md: 3px;
  --hx-border-radius-lg: 4px;

  /* ── Semantic overrides ─────────────────────────────────────── */
  --hx-color-text-link:       var(--hx-color-primary-500);
  --hx-color-text-link-hover: var(--hx-color-primary-600);
  --hx-color-border-focus:    var(--hx-color-primary-500);
  --hx-color-focus-ring:      var(--hx-color-primary-500);

  /* ── Brand-specific layout flags ────────────────────────────── */
  --brand-logo-width:      140px;
  --brand-sidebar-enabled: 0;   /* St. Mary's uses top-nav only */
  --brand-header-layout:   'compact';
}
```

### Northwell Health — `brands/northwell-health/tokens.css`

Northwell's identity: deep navy primary, generous spacing, Lato typeface.

```css
/* Northwell Health brand token overrides */

[data-brand='northwell-health'] {
  /* ── Primary color ramp ─────────────────────────────────────── */
  --hx-color-primary-50:  #eef2f9;
  --hx-color-primary-100: #d0dcee;
  --hx-color-primary-200: #a3b9de;
  --hx-color-primary-300: #7596cd;
  --hx-color-primary-400: #4a73bb;
  --hx-color-primary-500: #003087;   /* Northwell navy */
  --hx-color-primary-600: #002875;
  --hx-color-primary-700: #002162;
  --hx-color-primary-800: #001a4f;
  --hx-color-primary-900: #00133c;
  --hx-color-primary-950: #000c28;

  /* ── Typography ─────────────────────────────────────────────── */
  --hx-font-family-sans: 'Lato', 'Helvetica Neue', Arial, sans-serif;

  /* ── Geometry: generous for patient-facing portals ──────────── */
  --hx-border-radius-sm: 6px;
  --hx-border-radius-md: 10px;
  --hx-border-radius-lg: 16px;

  /* ── Semantic overrides ─────────────────────────────────────── */
  --hx-color-text-link:       var(--hx-color-primary-500);
  --hx-color-text-link-hover: var(--hx-color-primary-600);
  --hx-color-border-focus:    var(--hx-color-primary-400);
  --hx-color-focus-ring:      var(--hx-color-primary-400);

  /* ── Brand-specific layout flags ────────────────────────────── */
  --brand-logo-width:      180px;
  --brand-sidebar-enabled: 1;
  --brand-header-layout:   'expanded';
}
```

---

## Theme Provider Component {#theme-provider}

The `ThemeProvider` loads the active brand token bundle, applies the `data-brand` attribute to the DOM scope, and exposes a `switchBrand()` function for runtime switching.

### ThemeProvider implementation

```typescript
// theme-provider.ts
// Framework-agnostic theme provider using standard Web Components

export type BrandId = 'harbor-health' | 'st-marys-hospital' | 'northwell-health';
export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'auto';

export interface BrandConfig {
  id: BrandId;
  name: string;
  tokensUrl: string;  // URL to the brand's tokens.css bundle
}

const BRAND_REGISTRY: Record<BrandId, BrandConfig> = {
  'harbor-health': {
    id: 'harbor-health',
    name: 'Harbor Health',
    tokensUrl: '/brands/harbor-health/tokens.css',
  },
  'st-marys-hospital': {
    id: 'st-marys-hospital',
    name: "St. Mary's Hospital",
    tokensUrl: '/brands/st-marys-hospital/tokens.css',
  },
  'northwell-health': {
    id: 'northwell-health',
    name: 'Northwell Health',
    tokensUrl: '/brands/northwell-health/tokens.css',
  },
};

class ThemeProviderElement extends HTMLElement {
  private _brand: BrandId | null = null;
  private _mode: ThemeMode = 'light';
  private _loadedBrands = new Set<BrandId>();

  static get observedAttributes(): string[] {
    return ['brand', 'theme'];
  }

  connectedCallback(): void {
    const brand = this.getAttribute('brand') as BrandId | null;
    const mode = (this.getAttribute('theme') as ThemeMode) ?? 'light';
    if (brand) {
      this._applyBrand(brand, mode);
    }
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (name === 'brand' && next) {
      this._applyBrand(next as BrandId, this._mode);
    }
    if (name === 'theme' && next) {
      this._mode = next as ThemeMode;
      this._updateThemeMode(this._mode);
    }
  }

  /** Switch to a different brand at runtime — no page reload required. */
  async switchBrand(brandId: BrandId, mode: ThemeMode = 'light'): Promise<void> {
    await this._applyBrand(brandId, mode);
  }

  /** The currently active brand identifier. */
  get activeBrand(): BrandId | null {
    return this._brand;
  }

  private async _applyBrand(brandId: BrandId, mode: ThemeMode): Promise<void> {
    const config = BRAND_REGISTRY[brandId];
    if (!config) {
      console.warn(`[ThemeProvider] Unknown brand: "${brandId}"`);
      return;
    }

    if (!this._loadedBrands.has(brandId)) {
      await this._loadBrandTokens(config.tokensUrl);
      this._loadedBrands.add(brandId);
    }

    // Apply the brand scope attribute — CSS [data-brand] selector activates tokens
    this.dataset['brand'] = brandId;
    this._brand = brandId;

    this._updateThemeMode(mode);

    this.dispatchEvent(
      new CustomEvent<{ brand: BrandId; mode: ThemeMode }>('hx-brand-change', {
        detail: { brand: brandId, mode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async _loadBrandTokens(url: string): Promise<void> {
    if (document.querySelector(`link[data-brand-tokens="${url}"]`)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset['brandTokens'] = url;
      link.addEventListener('load', () => resolve());
      link.addEventListener('error', () => reject(new Error(`Failed to load brand tokens: ${url}`)));
      document.head.appendChild(link);
    });
  }

  private _updateThemeMode(mode: ThemeMode): void {
    const themeEl = this.querySelector('hx-theme') ?? this;
    themeEl.setAttribute('theme', mode);
  }
}

customElements.define('hx-brand-provider', ThemeProviderElement);

declare global {
  interface HTMLElementTagNameMap {
    'hx-brand-provider': ThemeProviderElement;
  }
}
```

### useBrand hook (React consumers)

```typescript
// use-brand.ts — React hook wrapping ThemeProviderElement

import { useState, useEffect, useCallback } from 'react';

export type BrandId = 'harbor-health' | 'st-marys-hospital' | 'northwell-health';
export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'auto';

export interface UseBrandResult {
  activeBrand: BrandId | null;
  switchBrand: (brand: BrandId, mode?: ThemeMode) => Promise<void>;
}

export function useBrand(providerRef: React.RefObject<HTMLElement>): UseBrandResult {
  const [activeBrand, setActiveBrand] = useState<BrandId | null>(null);

  useEffect(() => {
    const el = providerRef.current;
    if (!el) return;

    const handleChange = (e: Event): void => {
      const detail = (e as CustomEvent<{ brand: BrandId }>).detail;
      setActiveBrand(detail.brand);
    };

    el.addEventListener('hx-brand-change', handleChange);
    return () => el.removeEventListener('hx-brand-change', handleChange);
  }, [providerRef]);

  const switchBrand = useCallback(
    async (brand: BrandId, mode: ThemeMode = 'light'): Promise<void> => {
      const el = providerRef.current as (HTMLElement & {
        switchBrand?: (b: BrandId, m: ThemeMode) => Promise<void>;
      }) | null;
      await el?.switchBrand?.(brand, mode);
    },
    [providerRef],
  );

  return { activeBrand, switchBrand };
}
```

### HTML usage

```html
<!-- Wrap your application in hx-brand-provider -->
<hx-brand-provider brand="harbor-health">
  <hx-theme theme="light">

    <header>
      <img
        src="/brands/harbor-health/assets/logo.svg"
        alt="Harbor Health"
        style="width: var(--brand-logo-width, 160px);"
      />
    </header>

    <main>
      <hx-button>Book Appointment</hx-button>
      <hx-text-input label="Patient Name"></hx-text-input>
    </main>

  </hx-theme>
</hx-brand-provider>
```

---

## Runtime Brand Switching {#runtime-switching}

### Complete switching example

```typescript
// brand-switcher.ts — Production-ready runtime brand switching

import type { BrandId, ThemeMode } from './theme-provider.js';

interface BrandSwitchOptions {
  mode?: ThemeMode;
  /** Optional CSS transition duration in ms (default: 200) */
  transitionDuration?: number;
}

/**
 * Switch the active brand at runtime with an optional fade transition.
 * The transition prevents jarring color flashes on brand switch.
 */
export async function switchBrand(
  brandId: BrandId,
  options: BrandSwitchOptions = {},
): Promise<void> {
  const { mode = 'light', transitionDuration = 200 } = options;

  const provider = document.querySelector('hx-brand-provider') as
    | (HTMLElement & { switchBrand: (b: BrandId, m: ThemeMode) => Promise<void> })
    | null;

  if (!provider) {
    console.warn('[switchBrand] No hx-brand-provider element found in document');
    return;
  }

  if (transitionDuration > 0) {
    provider.style.transition = `opacity ${transitionDuration}ms ease`;
    provider.style.opacity = '0';
    await new Promise<void>(resolve => setTimeout(resolve, transitionDuration));
  }

  await provider.switchBrand(brandId, mode);

  try {
    localStorage.setItem('hx-active-brand', brandId);
    localStorage.setItem('hx-active-theme', mode);
  } catch {
    // localStorage unavailable (private browsing, etc.) — non-fatal
  }

  if (transitionDuration > 0) {
    provider.style.opacity = '1';
    setTimeout(() => {
      provider.style.transition = '';
    }, transitionDuration);
  }
}

/** Restore the brand preference saved from a previous session. */
export async function restoreBrandPreference(): Promise<void> {
  let brand: BrandId | null = null;
  let mode: ThemeMode = 'light';

  try {
    brand = localStorage.getItem('hx-active-brand') as BrandId | null;
    mode = (localStorage.getItem('hx-active-theme') as ThemeMode) ?? 'light';
  } catch {
    // localStorage unavailable — use defaults
  }

  if (brand) {
    await switchBrand(brand, { mode, transitionDuration: 0 });
  }
}

// Restore on page load
restoreBrandPreference();
```

### Brand token JSON structure

```json
{
  "brand": "harbor-health",
  "version": "2.1.0",
  "primitive": {
    "color-primary-50":  "#eff6f8",
    "color-primary-100": "#d0e9ef",
    "color-primary-200": "#a3d3df",
    "color-primary-300": "#6eb8c9",
    "color-primary-400": "#3a9db4",
    "color-primary-500": "#006e8a",
    "color-primary-600": "#005f78",
    "color-primary-700": "#004f65",
    "color-primary-800": "#003f52",
    "color-primary-900": "#002f3e",
    "color-primary-950": "#001f2a"
  },
  "semantic": {
    "color-text-link":    "var(--hx-color-primary-600)",
    "color-border-focus": "var(--hx-color-primary-500)",
    "color-focus-ring":   "var(--hx-color-primary-500)"
  },
  "layout": {
    "brand-logo-width":      "160px",
    "brand-sidebar-enabled": "1",
    "brand-header-layout":   "standard"
  }
}
```

---

## CSS Parts and Structural Variation {#css-parts}

Some brands require structural differences beyond color swaps — a different sidebar layout, an alternate header position for the logo, color-coded alert severity without relying on color alone.

### Using CSS `::part()` for structural variation

CSS `::part()` selectors style component internals from outside the shadow boundary. Use them with brand-scoped selectors to apply brand-specific structural styles.

```css
/* Harbor Health: uppercase tracking for clinical authority */
[data-brand='harbor-health'] hx-button::part(button) {
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
}

/* St. Mary's: compact button for clinical density */
[data-brand='st-marys-hospital'] hx-button::part(button) {
  letter-spacing: 0;
  font-weight: 500;
  padding-block: 0.375rem;
}

/* Northwell: large touch targets for patient-facing portals */
[data-brand='northwell-health'] hx-button::part(button) {
  min-block-size: 48px;
  padding-inline: 2rem;
  font-size: 1.0625rem;
}
```

### CSS custom property flags for conditional layout

Brand-specific layout flags (set in the tokens.css file) control structural behavior without requiring separate component trees.

```css
/* Sidebar visibility controlled by brand flag */
.app-sidebar {
  /* --brand-sidebar-enabled defaults to 1 if not set */
  display: calc(var(--brand-sidebar-enabled, 1) * 1px);
  /* When --brand-sidebar-enabled is 0, computed width is 0px = hidden */
  overflow: hidden;
  transition: width 200ms ease;
}

/* Logo sizing from brand token */
.app-logo img {
  width: var(--brand-logo-width, 160px);
  height: auto;
}

/* Header layout variant */
.app-header[data-layout='compact'] {
  block-size: 48px;
  padding-inline: var(--hx-space-4);
}

.app-header[data-layout='expanded'] {
  block-size: 80px;
  padding-inline: var(--hx-space-8);
}
```

Sync the header layout attribute in JavaScript after a brand switch:

```typescript
document.addEventListener('hx-brand-change', (e: Event) => {
  const header = document.querySelector('.app-header');
  if (!header) return;

  const layout = getComputedStyle(document.documentElement)
    .getPropertyValue('--brand-header-layout')
    .trim()
    .replace(/['"]/g, '');

  header.setAttribute('data-layout', layout || 'standard');
});
```

### Real healthcare examples

#### Color-coded alert severity (not color-only)

WCAG requires that information conveyed by color is also conveyed through text or icons. Brand-scoped alert variants follow this rule:

```css
[data-brand='st-marys-hospital'] hx-alert[variant='danger']::part(icon) {
  color: #b91c1c;
}

[data-brand='harbor-health'] hx-alert[variant='warning']::part(container) {
  border-inline-start: 4px solid var(--hx-color-primary-400);
}
```

```html
<!-- The icon slot ensures non-color differentiation for all brands -->
<hx-alert variant="danger">
  <hx-icon slot="icon" name="triangle-exclamation" aria-hidden="true"></hx-icon>
  <strong>Critical:</strong> Drug interaction detected — review before administering.
</hx-alert>
```

#### Sidebar slot controlled by brand flag

```html
<!-- Sidebar renders but brand CSS hides it when --brand-sidebar-enabled: 0 -->
<div class="app-layout">
  <aside class="app-sidebar" aria-label="Navigation sidebar">
    <hx-side-nav>
      <hx-nav-item href="/dashboard">Dashboard</hx-nav-item>
      <hx-nav-item href="/patients">Patients</hx-nav-item>
    </hx-side-nav>
  </aside>

  <main class="app-content">
    <slot></slot>
  </main>
</div>
```

#### Brand-specific logo position

```html
<hx-top-nav>
  <img
    slot="logo"
    src="/brands/current/logo.svg"
    alt="{{ brandName }}"
    style="width: var(--brand-logo-width, 160px);"
  />
  <hx-nav-item slot="nav" href="/dashboard">Dashboard</hx-nav-item>
</hx-top-nav>
```

```css
/* Northwell: center the logo in the header */
[data-brand='northwell-health'] hx-top-nav::part(logo-slot) {
  justify-self: center;
}

/* Harbor Health: logo flush left */
[data-brand='harbor-health'] hx-top-nav::part(logo-slot) {
  justify-self: start;
}
```

---

## Drupal Multisite Architecture {#drupal-multisite}

A single `@helixui/library` instance on a CDN serves all Drupal multisite installations. Each Drupal site loads its brand token bundle from its own theme directory.

```
                    ┌─────────────────────────────────┐
                    │   CDN / Static Asset Server     │
                    │                                 │
                    │  @helixui/library@2.1.0          │
                    │  ├── helix.esm.js               │
                    │  └── helix.css (base tokens)    │
                    └──────────────┬──────────────────┘
                                   │  loaded once
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ harbor.drupal   │    │ stmarys.drupal  │    │ northwell.drupal  │
│                 │    │                 │    │                   │
│ Theme:          │    │ Theme:          │    │ Theme:            │
│ harbor_health   │    │ st_marys        │    │ northwell         │
│                 │    │                 │    │                   │
│ Loads:          │    │ Loads:          │    │ Loads:            │
│ harbor-health/  │    │ st-marys/       │    │ northwell/        │
│ tokens.css      │    │ tokens.css      │    │ tokens.css        │
└────────┬────────┘    └────────┬────────┘    └────────┬──────────┘
         │                      │                      │
         ▼                      ▼                      ▼
   [data-brand=            [data-brand=          [data-brand=
   "harbor-health"]        "st-marys-hospital"]  "northwell-health"]
   on <body>               on <body>             on <body>
```

### Drupal library definition

Each Drupal theme defines a library for its brand token bundle:

```yaml
# harbor_health.libraries.yml

brand-tokens:
  css:
    theme:
      css/brand-tokens.css: {}
  dependencies:
    - core/drupal
```

The `css/brand-tokens.css` file is your `brands/harbor-health/tokens.css` content, copied into the Drupal theme.

### hook_preprocess_html

Apply the `data-brand` attribute to the `<body>` element:

```php
<?php
// harbor_health.theme

/**
 * Implements hook_preprocess_html().
 */
function harbor_health_preprocess_html(array &$variables): void {
  // Load brand token stylesheet
  $variables['#attached']['library'][] = 'harbor_health/brand-tokens';

  // Set the brand scope attribute on <body>
  $variables['attributes']['data-brand'] = 'harbor-health';
}
```

### Twig template integration

```twig
{# page.html.twig — Harbor Health Drupal theme #}
<!DOCTYPE html>
<html{{ html_attributes }}>
  <head>
    <title>{{ head_title }}</title>
    {{ head }}
    {# HELiX library — loaded from CDN or Drupal library #}
    <script type="module" src="/cdn/helix/2.1.0/helix.esm.js"></script>
    {# Brand tokens loaded via Drupal library (harbor_health/brand-tokens) #}
  </head>
  <body{{ attributes.setAttribute('data-brand', 'harbor-health') }}>

    <hx-theme theme="light">

      <hx-top-nav>
        <img
          slot="logo"
          src="{{ base_path ~ directory }}/assets/logo.svg"
          alt="Harbor Health"
          style="width: var(--brand-logo-width, 160px);"
        />
        {{ page.header }}
      </hx-top-nav>

      <div class="layout-container">

        {% if page.sidebar_first %}
          <aside class="app-sidebar" aria-label="{{ 'Navigation'|t }}">
            {{ page.sidebar_first }}
          </aside>
        {% endif %}

        <main role="main">
          {{ page.content }}
        </main>

      </div>

      {{ page.footer }}

    </hx-theme>

  </body>
</html>
```

### Drupal multisite deployment

Each subsite in a Drupal multisite network uses its own Drupal theme. The `sites/` directory maps each domain to its theme:

```
sites/
├── harbor.example.com/
│   └── settings.php    # theme: harbor_health
│
├── stmarys.example.com/
│   └── settings.php    # theme: st_marys
│
└── northwell.example.com/
    └── settings.php    # theme: northwell
```

The shared `@helixui/library` bundle is loaded from a CDN or a common assets directory — it does not change per subsite. Only the brand token CSS file differs. This keeps the combined download for each user to a minimum.

---

## CSS Custom Property Reference {#custom-properties}

The following CSS custom properties are available for brand override.

### Color

| Property | Type | Default | Use case |
|---|---|---|---|
| `--hx-color-primary-50` | `<color>` | `#eff6ff` | Near-white primary tint (backgrounds) |
| `--hx-color-primary-100` | `<color>` | `#dbeafe` | Light primary tint (hover backgrounds) |
| `--hx-color-primary-200` | `<color>` | `#bfdbfe` | Soft primary (decorative borders) |
| `--hx-color-primary-300` | `<color>` | `#93c5fd` | Muted primary (disabled states) |
| `--hx-color-primary-400` | `<color>` | `#60a5fa` | Light primary action (dark mode links) |
| `--hx-color-primary-500` | `<color>` | `#2563eb` | **Primary action** (buttons, links, focus) |
| `--hx-color-primary-600` | `<color>` | `#1d4ed8` | Primary hover |
| `--hx-color-primary-700` | `<color>` | `#1e40af` | Primary active/pressed |
| `--hx-color-primary-800` | `<color>` | `#1e3a8a` | Dark primary (dark mode surfaces) |
| `--hx-color-primary-900` | `<color>` | `#1e3a8a` | Darkest primary |
| `--hx-color-primary-950` | `<color>` | `#172554` | Near-black primary shade |
| `--hx-color-text-link` | `<color>` | `var(--hx-color-primary-600)` | Hyperlink color |
| `--hx-color-text-link-hover` | `<color>` | `var(--hx-color-primary-700)` | Hyperlink hover color |
| `--hx-color-border-focus` | `<color>` | `var(--hx-color-primary-500)` | Focus ring border |
| `--hx-color-focus-ring` | `<color>` | `var(--hx-color-primary-500)` | Focus ring outline |

### Status colors (override with care — WCAG contrast required)

| Property | Type | Default | Healthcare use case |
|---|---|---|---|
| `--hx-color-status-success` | `<color>` | `#16a34a` | Lab results normal, medication given |
| `--hx-color-status-warning` | `<color>` | `#d97706` | Abnormal lab, order pending review |
| `--hx-color-status-error` | `<color>` | `#dc2626` | Critical alert, overdue order |
| `--hx-color-status-info` | `<color>` | `#2563eb` | Information, scheduled event |

**Healthcare note:** Status color differentiation must never be the only indicator. Always pair with an icon or text label. See [WCAG 1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color).

### Typography

| Property | Type | Default | Notes |
|---|---|---|---|
| `--hx-font-family-sans` | `<family-name>` | `'Inter', -apple-system, sans-serif` | Primary UI typeface |
| `--hx-font-family-mono` | `<family-name>` | `'JetBrains Mono', ui-monospace` | Code, identifiers, MRN display |
| `--hx-font-family-display` | `<family-name>` | Same as sans | Optional: display headings |

### Geometry

| Property | Type | Default | Effect |
|---|---|---|---|
| `--hx-border-radius-sm` | `<length>` | `4px` | Small elements (badges, tags) |
| `--hx-border-radius-md` | `<length>` | `6px` | Standard elements (buttons, inputs) |
| `--hx-border-radius-lg` | `<length>` | `8px` | Containers (cards, dialogs) |

### Brand layout flags

These are not `--hx-*` library tokens. They are brand-defined custom properties that your application code reads to control layout.

| Property | Type | Convention | Meaning |
|---|---|---|---|
| `--brand-logo-width` | `<length>` | `160px` | Logo element width in header |
| `--brand-sidebar-enabled` | `0` or `1` | `1` | Whether the sidebar nav is visible |
| `--brand-header-layout` | `<string>` | `'standard'` | `'standard'`, `'compact'`, `'expanded'` |

---

## Production Deployment {#deployment}

### Token bundle generation

```bash
#!/usr/bin/env bash
# scripts/build-brand-tokens.sh

set -euo pipefail

BRANDS_DIR="brands"
OUTPUT_DIR="dist/brands"

mkdir -p "$OUTPUT_DIR"

for brand_dir in "$BRANDS_DIR"/*/; do
  brand=$(basename "$brand_dir")
  input="$brand_dir/tokens.css"
  output="$OUTPUT_DIR/$brand/tokens.css"

  if [[ ! -f "$input" ]]; then
    echo "Skipping $brand — no tokens.css found"
    continue
  fi

  mkdir -p "$OUTPUT_DIR/$brand"

  # Minify with postcss (install: pnpm add -D postcss postcss-cli cssnano)
  npx postcss "$input" \
    --use cssnano \
    --output "$output" \
    --no-map

  echo "Built $brand: $output ($(wc -c < "$output") bytes)"
done
```

### HIPAA compliance note

- Brand token CSS files are visual configuration — they contain no PHI
- Token JSON files (`colors.json`, `typography.json`) are design documentation — they contain no PHI
- `localStorage` use for brand preference stores only a brand identifier string — no patient data
- **High-contrast requirement:** Every brand must pass WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for UI components) before deploying

### CDN structure for multisite

```
cdn.yourdomain.com/
├── helix/
│   └── 2.1.0/
│       ├── helix.esm.js          (shared — all brands)
│       └── helix.css             (base tokens — all brands)
│
└── brands/
    ├── harbor-health/
    │   └── tokens.css            (brand-specific)
    ├── st-marys-hospital/
    │   └── tokens.css
    └── northwell-health/
        └── tokens.css
```

Cache headers:

- `helix.esm.js`, `helix.css`: `Cache-Control: public, max-age=31536000, immutable`
- `tokens.css`: `Cache-Control: public, max-age=86400` (1 day — brands update more frequently)

### Troubleshooting

**Brand tokens not applying** — check that `data-brand` is set on an ancestor element:

```javascript
console.log(document.body.dataset.brand); // should print the brand id
```

**Token specificity conflict** — if a `:root` override clashes with a `[data-brand]` override, the brand selector wins because attribute selectors have higher specificity than `:root`. If an external stylesheet re-declares a property on `:root` after the brand tokens load, move the override to `[data-brand]` instead.

---

## Related Guides {#related}

- [Theming Quick Start](/extending/theming-quick-start/) — Single-brand theming, dark mode, high contrast
- [CSS Parts](/extending/style-components-with-css-parts/) — Styling component internals with `::part()`
- [Drupal Integration](/getting-started/drupal/) — Loading HELiX in Twig templates
