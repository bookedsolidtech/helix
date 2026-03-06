import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenEntries, darkTokenEntries } from '@helix/tokens';
import { helixThemeStyles } from './hx-theme.styles.js';

/** Supported theme names */
export type ThemeName = 'light' | 'dark' | 'high-contrast';

/**
 * A theme provider that injects CSS custom property tokens for a named theme
 * onto a scoped root element. Wrapping content with this component scopes
 * all `--hx-*` design tokens to the selected theme.
 *
 * This is a pure infrastructure component with `display: contents` — it does
 * not affect layout. Use it to apply a theme to a subtree of components.
 *
 * @summary Injects --hx-* design tokens for the specified theme scope.
 *
 * @tag hx-theme
 *
 * @slot - Default slot for themed content.
 *
 * @csspart base - The inner slot wrapper element.
 *
 * @cssprop [--hx-*] - All design tokens for the selected theme are injected
 *   as CSS custom properties on the host element.
 */
@customElement('hx-theme')
export class HelixTheme extends LitElement {
  static override styles = [helixThemeStyles];

  /**
   * The theme to apply. Determines which set of --hx-* tokens are injected.
   * - `"light"` (default): standard light-mode tokens
   * - `"dark"`: dark-mode token overrides applied on top of light primitives
   * - `"high-contrast"`: uses dark token overrides (extend tokens.json for full HC support)
   * @attr theme
   */
  @property({ type: String, reflect: true })
  theme: ThemeName = 'light';

  /**
   * When true, auto-detects the preferred color scheme via the
   * `prefers-color-scheme` media query, overriding the `theme` prop.
   * Changes to system preference trigger a live theme update.
   * @attr system
   */
  @property({ type: Boolean, reflect: true })
  system = false;

  private _mediaQuery: MediaQueryList | null = null;
  private _mediaHandler: (() => void) | null = null;
  private _themeSheet: CSSStyleSheet | null = null;

  override firstUpdated(): void {
    this._initThemeSheet();
    if (this.system) {
      this._attachMediaQuery();
    }
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('system')) {
      if (this.system) {
        this._attachMediaQuery();
      } else {
        this._detachMediaQuery();
      }
      this._applyEffectiveTheme();
    } else if (changed.has('theme') && !this.system) {
      this._applyEffectiveTheme();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._detachMediaQuery();
  }

  /**
   * Returns the currently active theme name.
   * When `system` is true, reflects the OS preference; otherwise returns `theme`.
   */
  get effectiveTheme(): ThemeName {
    if (this.system) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.theme;
  }

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

  private _attachMediaQuery(): void {
    if (this._mediaQuery) return;
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaHandler = () => this._applyEffectiveTheme();
    this._mediaQuery.addEventListener('change', this._mediaHandler);
  }

  private _detachMediaQuery(): void {
    if (this._mediaQuery && this._mediaHandler) {
      this._mediaQuery.removeEventListener('change', this._mediaHandler);
    }
    this._mediaQuery = null;
    this._mediaHandler = null;
  }

  private _buildTokenCss(theme: ThemeName): string {
    let entries: Array<{ name: string; value: string }>;

    if (theme === 'dark' || theme === 'high-contrast') {
      // Merge: light primitives first, then dark semantic overrides
      const merged = new Map(tokenEntries.map((t) => [t.name, t.value]));
      for (const t of darkTokenEntries) {
        merged.set(t.name, t.value);
      }
      entries = Array.from(merged.entries()).map(([name, value]) => ({ name, value }));
    } else {
      entries = tokenEntries;
    }

    const props = entries.map((t) => `  ${t.name}: ${t.value};`).join('\n');
    return `:host {\n${props}\n}`;
  }

  private _applyEffectiveTheme(): void {
    if (!this._themeSheet) return;
    this._themeSheet.replaceSync(this._buildTokenCss(this.effectiveTheme));
  }

  override render() {
    return html`
      <div part="base" class="theme-base">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-theme': HelixTheme;
  }
}

/** @deprecated Use HelixTheme */
export type WcTheme = HelixTheme;
