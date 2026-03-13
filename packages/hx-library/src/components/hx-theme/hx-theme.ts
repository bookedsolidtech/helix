import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenEntries, darkTokenEntries } from '@helixui/tokens';
import { helixThemeStyles } from './hx-theme.styles.js';

export type { TokenDefinition, TokenEntry } from '@helixui/tokens';

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
 * @summary Injects --hx-* design tokens for the specified theme scope.
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
  theme: ThemeName = 'light';

  /**
   * @deprecated Use `theme="auto"` instead.
   * When true, auto-detects the preferred color scheme via the
   * `prefers-color-scheme` media query, overriding the `theme` prop.
   * @attr system
   */
  @property({ type: Boolean, reflect: true })
  system = false;

  /** @internal */
  private _mediaQuery: MediaQueryList | null = null;
  /** @internal */
  private _mediaHandler: (() => void) | null = null;
  /** @internal */
  private _themeSheet: CSSStyleSheet | null = null;

  override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this._initThemeSheet();
    if (this.system || this.theme === 'auto') {
      this._attachMediaQuery();
    }
  }

  override updated(changed: PropertyValues): void {
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
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._detachMediaQuery();
  }

  /**
   * Returns the currently active theme name.
   * When `system=true` or `theme="auto"`, reflects the OS preference (`"light"` or `"dark"`).
   * Otherwise returns the `theme` property value.
   */
  get effectiveTheme(): ThemeName {
    if (this.system || this.theme === 'auto') {
      if (typeof window === 'undefined') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.theme;
  }

  /** @internal */
  private _initThemeSheet(): void {
    if (this.shadowRoot) {
      this._themeSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this._themeSheet,
      ];
      this._applyEffectiveTheme();
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
    void this._themeSheet.replace(_buildThemeCss(this.effectiveTheme));
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
