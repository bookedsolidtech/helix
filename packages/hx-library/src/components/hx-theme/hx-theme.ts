import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenEntries, darkTokenEntries, HelixBrandRegistry } from '@helixui/tokens';
import { helixThemeStyles } from './hx-theme.styles.js';
import { mergeBrandTokens } from '../../utils/token-merger.js';

export type { TokenDefinition, TokenEntry } from '@helixui/tokens';

/**
 * Controls the spacing density for all descendant `hx-*` components.
 * - `"comfortable"` (default): Standard spacing tokens.
 * - `"compact"`: Reduces `--hx-space-*` tokens ~25%. For data-dense clinical dashboards.
 * - `"spacious"`: Increases `--hx-space-*` tokens ~25%. For touch-optimized bedside tablets.
 */
export type DensityMode = 'comfortable' | 'compact' | 'spacious';

/**
 * Controls the motion behavior applied to all descendant `hx-*` components.
 * - `"full"` (default): Full animations. Respects OS `prefers-reduced-motion`.
 * - `"reduced"`: Collapses all animation durations to 0ms and easings to linear.
 * - `"none"`: Same as `"reduced"` — all motion tokens resolve to instant/linear.
 */
export type MotionMode = 'full' | 'reduced' | 'none';

/**
 * Supported theme names.
 *
 * Three-tier token cascade applied by this component:
 * - **Primitive tier** (`--hx-color-primary-500`, `--hx-space-4`, etc.) — raw values, always injected
 * - **Semantic tier** (`--hx-color-text-primary`, `--hx-color-surface-default`, etc.) — theme-sensitive,
 *   override primitives for dark / high-contrast themes
 * - **Component tier** (`--hx-button-bg`, `--hx-card-padding`, etc.) — set by individual components,
 *   consumed via semantic fallbacks; not managed by `hx-theme` directly
 *
 * Consumers should override at the semantic tier to respect theme scoping.
 */
export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

/**
 * High-contrast token overrides. Targets WCAG 7:1+ contrast ratios for low-vision users.
 * These are injected on top of the light primitives when theme="high-contrast".
 * Values here mirror the `high-contrast` section of tokens.json; kept in sync manually
 * until HC tokens are promoted to the published @helixui/tokens package.
 */
const _hcOverrides: Array<[string, string]> = [
  ['--hx-color-text-primary', '#FFFFFF'],
  ['--hx-color-text-secondary', '#FFFFFF'],
  ['--hx-color-text-muted', '#E0E0E0'],
  ['--hx-color-text-disabled', '#767676'],
  ['--hx-color-text-inverse', '#000000'],
  ['--hx-color-text-link', '#FFFF00'],
  ['--hx-color-text-link-hover', '#FFFF99'],
  ['--hx-color-text-link-visited', '#FF80FF'],
  ['--hx-color-text-link-active', '#FFFFFF'],
  ['--hx-color-surface-default', '#000000'],
  ['--hx-color-surface-raised', '#1A1A1A'],
  ['--hx-color-surface-sunken', '#000000'],
  ['--hx-color-surface-overlay', 'rgba(0, 0, 0, 0.95)'],
  ['--hx-color-border-default', '#FFFFFF'],
  ['--hx-color-border-subtle', '#C0C0C0'],
  ['--hx-color-border-strong', '#FFFFFF'],
  ['--hx-color-border-focus', '#FFFF00'],
  ['--hx-color-focus-ring', '#FFFF00'],
  ['--hx-color-selection-bg', '#1AEBFF'],
  ['--hx-color-selection-color', '#000000'],
  ['--hx-body-bg', '#000000'],
  ['--hx-body-color', '#FFFFFF'],
  ['--hx-shadow-sm', '0 1px 2px 0 rgb(255 255 255 / 0.2)'],
  [
    '--hx-shadow-md',
    '0 4px 6px -1px rgb(255 255 255 / 0.3), 0 2px 4px -2px rgb(255 255 255 / 0.2)',
  ],
  [
    '--hx-shadow-lg',
    '0 10px 15px -3px rgb(255 255 255 / 0.3), 0 4px 6px -4px rgb(255 255 255 / 0.2)',
  ],
  [
    '--hx-shadow-xl',
    '0 20px 25px -5px rgb(255 255 255 / 0.3), 0 8px 10px -6px rgb(255 255 255 / 0.2)',
  ],
  ['--hx-shadow-2xl', '0 25px 50px -12px rgb(255 255 255 / 0.4)'],
];

/**
 * Compact density overrides: ~75% of original --hx-space-* values.
 * Fixed tokens (--hx-space-0 and --hx-space-px) are intentionally omitted — they stay fixed.
 * Component height tokens are reduced one step to match the tighter spacing.
 */
const _compactDensityOverrides: Array<[string, string]> = [
  ['--hx-space-1', '0.1875rem'],
  ['--hx-space-2', '0.375rem'],
  ['--hx-space-3', '0.5625rem'],
  ['--hx-space-4', '0.75rem'],
  ['--hx-space-5', '0.9375rem'],
  ['--hx-space-6', '1.125rem'],
  ['--hx-space-7', '1.3125rem'],
  ['--hx-space-8', '1.5rem'],
  ['--hx-space-10', '1.875rem'],
  ['--hx-space-12', '2.25rem'],
  ['--hx-space-14', '2.625rem'],
  ['--hx-space-16', '3rem'],
  ['--hx-space-20', '3.75rem'],
  ['--hx-space-24', '4.5rem'],
  ['--hx-space-32', '6rem'],
  ['--hx-space-40', '7.5rem'],
  ['--hx-space-48', '9rem'],
  ['--hx-space-64', '12rem'],
  // Component heights — one step smaller
  ['--hx-input-height-sm', '1.75rem'],
  ['--hx-input-height-md', '2rem'],
  ['--hx-input-height-lg', '2.25rem'],
];

/**
 * Spacious density overrides: ~125% of original --hx-space-* values.
 * Fixed tokens (--hx-space-0 and --hx-space-px) are intentionally omitted — they stay fixed.
 * Component height tokens are increased one step to match the looser spacing.
 */
const _spaciousDensityOverrides: Array<[string, string]> = [
  ['--hx-space-1', '0.3125rem'],
  ['--hx-space-2', '0.625rem'],
  ['--hx-space-3', '0.9375rem'],
  ['--hx-space-4', '1.25rem'],
  ['--hx-space-5', '1.5625rem'],
  ['--hx-space-6', '1.875rem'],
  ['--hx-space-7', '2.1875rem'],
  ['--hx-space-8', '2.5rem'],
  ['--hx-space-10', '3.125rem'],
  ['--hx-space-12', '3.75rem'],
  ['--hx-space-14', '4.375rem'],
  ['--hx-space-16', '5rem'],
  ['--hx-space-20', '6.25rem'],
  ['--hx-space-24', '7.5rem'],
  ['--hx-space-32', '10rem'],
  ['--hx-space-40', '12.5rem'],
  ['--hx-space-48', '15rem'],
  ['--hx-space-64', '20rem'],
  // Component heights — one step larger
  ['--hx-input-height-sm', '2.25rem'],
  ['--hx-input-height-md', '2.75rem'],
  ['--hx-input-height-lg', '3.5rem'],
];

/**
 * Motion token overrides applied when reduced or no motion is requested.
 * All durations collapse to 0ms and all easings become linear so that
 * every animated component goes instantaneous without modifying its own CSS.
 */
const _reducedMotionOverrides: Array<[string, string]> = [
  ['--hx-duration-fast', '0ms'],
  ['--hx-duration-normal', '0ms'],
  ['--hx-duration-slow', '0ms'],
  ['--hx-duration-slower', '0ms'],
  ['--hx-duration-spinner', '0ms'],
  ['--hx-transition-fast', '0ms linear'],
  ['--hx-transition-normal', '0ms linear'],
  ['--hx-transition-slow', '0ms linear'],
  ['--hx-easing-default', 'linear'],
  ['--hx-easing-in', 'linear'],
  ['--hx-easing-out', 'linear'],
  ['--hx-easing-in-out', 'linear'],
  ['--hx-easing-decelerate', 'linear'],
  ['--hx-easing-accelerate', 'linear'],
  ['--hx-easing-spring', 'linear'],
];

function _buildProps(entries: Iterable<[string, string]>): string {
  return Array.from(entries)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
}

/** Module-level CSS cache: one string per ThemeName — avoids re-building on every theme change */
const _cssCache = new Map<ThemeName, string>();

function _buildThemeCss(theme: ThemeName): string {
  const cached = _cssCache.get(theme);
  if (cached) return cached;

  // Build light token base map from the @helixui/tokens package
  const lightMap = new Map(tokenEntries.map((t) => [t.name, t.value]));

  let css: string;
  if (theme === 'dark') {
    // Apply dark semantic overrides on top of light primitives
    const merged = new Map(lightMap);
    for (const t of darkTokenEntries) {
      merged.set(t.name, t.value);
    }
    css = `:host {\n${_buildProps(merged)}\n  color-scheme: dark;\n}`;
  } else if (theme === 'high-contrast') {
    // Apply HC overrides on top of light primitives — distinct WCAG 7:1+ token set
    const merged = new Map(lightMap);
    for (const [name, value] of _hcOverrides) {
      merged.set(name, value);
    }
    css = `:host {\n${_buildProps(merged)}\n  color-scheme: dark;\n}`;
  } else {
    // 'light' — 'auto' resolves to 'light' or 'dark' at runtime via effectiveTheme
    css = `:host {\n${_buildProps(lightMap)}\n  color-scheme: light;\n}`;
  }

  _cssCache.set(theme, css);
  return css;
}

/**
 * A theme provider that injects CSS custom property tokens for a named theme
 * onto a scoped root element. Wrapping content with this component scopes
 * all `--hx-*` design tokens to the selected theme.
 *
 * This is a pure infrastructure component with `display: contents` — it does
 * not affect layout. Use it to apply a theme to a subtree of components.
 *
 * Supported themes:
 * - `"light"` — standard light-mode token set (default)
 * - `"dark"` — dark-mode semantic overrides applied on top of light primitives
 * - `"high-contrast"` — WCAG 7:1+ contrast token set for low-vision accessibility
 * - `"auto"` — follows the OS `prefers-color-scheme` media query (light or dark)
 *
 * @summary Injects --hx-* design tokens for the specified theme scope and controls motion behavior.
 *
 * @tag hx-theme
 *
 * @slot - Default slot for themed content.
 *
 * @csspart base - The inner slot wrapper element. `display: contents` — no layout effect.
 *
 * @cssprop [--hx-*] - All design tokens for the selected theme are injected
 *   as CSS custom properties on the host element.
 *
 * @example Drupal Twig — wrap a region with a dark theme:
 * ```twig
 * <hx-theme theme="dark">
 *   {{ content }}
 * </hx-theme>
 * ```
 *
 * @example Nested scoping — dark sidebar inside a light page:
 * ```html
 * <hx-theme theme="light">
 *   <main>...</main>
 *   <hx-theme theme="dark">
 *     <aside>...</aside>
 *   </hx-theme>
 * </hx-theme>
 * ```
 *
 * @example Compact density for clinical dashboards:
 * ```html
 * <hx-theme theme="dark" density="compact">
 *   <!-- Clinical dashboard content -->
 * </hx-theme>
 * ```
 */
@customElement('hx-theme')
export class HelixTheme extends LitElement {
  static override styles = [helixThemeStyles];

  /**
   * The theme to apply. Determines which set of --hx-* tokens are injected.
   * - `"light"` (default): standard light-mode tokens
   * - `"dark"`: dark-mode semantic overrides applied on top of light primitives
   * - `"high-contrast"`: WCAG 7:1+ contrast tokens for low-vision users
   * - `"auto"`: follows OS `prefers-color-scheme`; resolves to `"light"` or `"dark"` at runtime
   * @attr theme
   */
  @property({ type: String, reflect: true })
  theme: 'light' | 'dark' | 'high-contrast' | 'auto' = 'light';

  /**
   * @deprecated Use `theme="auto"` instead.
   * When true, auto-detects the preferred color scheme via the
   * `prefers-color-scheme` media query, overriding the `theme` prop.
   * @attr system
   */
  @property({ type: Boolean, reflect: true })
  system = false;

  /**
   * The registered brand name to apply on top of the base theme.
   * When set, brand-specific CSS custom property overrides are merged
   * after the base theme tokens in the adopted stylesheet, enabling
   * hospital system white-label implementations.
   *
   * The brand must first be registered via `HelixBrandRegistry.register()`.
   * If the brand name is non-empty but not registered, a warning is logged
   * and the base theme is applied without brand overrides.
   *
   * @attr brand
   * @example
   * ```html
   * <hx-theme theme="light" brand="mercy-health">
   *   <!-- Content inherits Mercy Health brand tokens -->
   * </hx-theme>
   * ```
   */
  @property({ type: String, reflect: true })
  brand = '';

  /**
   * Controls motion behavior for all descendant `hx-*` components.
   * - `"full"` (default): Full animations. Respects OS `prefers-reduced-motion`.
   * - `"reduced"`: Collapses all animation durations to 0ms and easings to linear.
   *   Use this for devices where OS accessibility settings cannot be relied on
   *   (e.g. healthcare bedside terminals).
   * - `"none"`: Same as `"reduced"` — all motion tokens resolve to instant/linear.
   *
   * When `motion="full"` and the OS reports `prefers-reduced-motion: reduce`,
   * the same token overrides are applied automatically.
   * @attr motion
   */
  @property({ type: String, reflect: true })
  motion: MotionMode = 'full';

  /**
   * Controls the spacing density for all descendant `hx-*` components.
   * - `"comfortable"` (default): Standard spacing tokens.
   * - `"compact"`: Reduces `--hx-space-*` tokens ~25%. For data-dense clinical dashboards.
   * - `"spacious"`: Increases `--hx-space-*` tokens ~25%. For touch-optimized bedside tablets.
   * @attr density
   */
  @property({ type: String, reflect: true })
  density: DensityMode = 'comfortable';

  /** @internal */
  private _mediaQuery: MediaQueryList | null = null;
  /** @internal */
  private _mediaHandler: (() => void) | null = null;
  /** @internal */
  private _themeSheet: CSSStyleSheet | null = null;
  /** @internal */
  private _densitySheet: CSSStyleSheet | null = null;
  /** @internal — media query for OS prefers-reduced-motion */
  private _motionQuery: MediaQueryList | null = null;
  /** @internal */
  private _motionHandler: (() => void) | null = null;

  override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this._initThemeSheet();
    if (this.system || this.theme === 'auto') {
      this._attachMediaQuery();
    }
    if (this.motion === 'full') {
      this._attachMotionQuery();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const autoMode = this.system || this.theme === 'auto';
    if (changed.has('system') || changed.has('theme')) {
      if (autoMode) {
        this._attachMediaQuery();
      } else {
        this._detachMediaQuery();
      }
      this._applyEffectiveTheme();
    }
    if (changed.has('motion')) {
      if (this.motion === 'full') {
        this._attachMotionQuery();
      } else {
        this._detachMotionQuery();
      }
      this._applyEffectiveTheme();
    }
    if (changed.has('brand')) {
      this._applyEffectiveTheme();
    }
    if (changed.has('density')) {
      this._applyDensity();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._detachMediaQuery();
    this._detachMotionQuery();
  }

  /**
   * Returns the currently active theme name.
   * When `system=true` or `theme="auto"`, reflects the OS preference (`"light"` or `"dark"`).
   * Otherwise returns the `theme` property value.
   */
  get effectiveTheme(): 'light' | 'dark' | 'high-contrast' | 'auto' {
    if (this.system || this.theme === 'auto') {
      if (typeof window === 'undefined') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.theme;
  }

  /**
   * Returns the resolved motion level after considering the `motion` attribute and OS preference.
   * When `motion="full"` and the OS reports `prefers-reduced-motion: reduce`, returns `"reduced"`.
   * Otherwise returns `"full"` or `"reduced"` based on the `motion` attribute.
   */
  get effectiveMotion(): 'full' | 'reduced' {
    if (this.motion === 'reduced' || this.motion === 'none') return 'reduced';
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 'reduced';
    }
    return 'full';
  }

  /** @internal */
  private _initThemeSheet(): void {
    if (this.shadowRoot) {
      this._themeSheet = new CSSStyleSheet();
      this._densitySheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this._themeSheet,
        this._densitySheet,
      ];
      this._applyEffectiveTheme();
      this._applyDensity();
    }
  }

  /** @internal */
  private _attachMediaQuery(): void {
    if (this._mediaQuery || typeof window === 'undefined') return;
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaHandler = () => {
      this._applyEffectiveTheme();
      this._announceThemeChange();
    };
    this._mediaQuery.addEventListener('change', this._mediaHandler);
  }

  /** @internal */
  private _detachMediaQuery(): void {
    if (this._mediaQuery && this._mediaHandler) {
      this._mediaQuery.removeEventListener('change', this._mediaHandler);
    }
    this._mediaQuery = null;
    this._mediaHandler = null;
  }

  /** @internal — attach OS prefers-reduced-motion listener when motion="full" */
  private _attachMotionQuery(): void {
    if (this._motionQuery || typeof window === 'undefined') return;
    this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._motionHandler = () => {
      this._applyEffectiveTheme();
    };
    this._motionQuery.addEventListener('change', this._motionHandler);
  }

  /** @internal */
  private _detachMotionQuery(): void {
    if (this._motionQuery && this._motionHandler) {
      this._motionQuery.removeEventListener('change', this._motionHandler);
    }
    this._motionQuery = null;
    this._motionHandler = null;
  }

  /** @internal — notifies AT users when system theme changes programmatically */
  private _announceThemeChange(): void {
    const announcer = this.shadowRoot?.querySelector('[role="status"]');
    if (announcer) {
      announcer.textContent = `Theme changed to ${this.effectiveTheme}`;
    }
  }

  /** @internal */
  private _applyEffectiveTheme(): void {
    if (!this._themeSheet) return;

    let css = _buildThemeCss(this.effectiveTheme);

    if (this.brand !== '') {
      const brandTokens = HelixBrandRegistry.getBrandTokens(this.brand);
      if (brandTokens !== undefined) {
        css = mergeBrandTokens(css, brandTokens);
      } else {
        console.warn(
          `[hx-theme] Brand "${this.brand}" is not registered. ` +
            `Register it via HelixBrandRegistry.register() before use. ` +
            `Applying base theme only.`,
        );
      }
    }

    if (this.effectiveMotion === 'reduced') {
      css += `\n:host {\n${_buildProps(_reducedMotionOverrides)}\n}`;
    }

    void this._themeSheet.replace(css);
  }

  /** @internal */
  private _applyDensity(): void {
    if (!this._densitySheet) return;

    let css = '';
    if (this.density === 'compact') {
      css = `:host {\n${_buildProps(_compactDensityOverrides)}\n}`;
    } else if (this.density === 'spacious') {
      css = `:host {\n${_buildProps(_spaciousDensityOverrides)}\n}`;
    }
    // comfortable = no overrides needed (defaults from theme sheet)

    void this._densitySheet.replace(css);
  }

  override render() {
    return html`
      <div part="base" class="theme-base">
        <slot></slot>
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" class="visually-hidden"></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-theme': HelixTheme;
  }
}

/** Canonical type alias for HelixTheme. Use this when typing hx-theme element references. */
export type HxTheme = HelixTheme;

/** @deprecated Use {@link HxTheme} instead. The `Wc` prefix was a legacy naming convention. */
export type WcTheme = HelixTheme;
