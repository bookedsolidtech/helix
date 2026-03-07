import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixFocusRingStyles } from './hx-focus-ring.styles.js';

/**
 * A utility component that renders a consistent visible focus indicator around
 * a slotted element using CSS custom properties from the design token system.
 * Purely visual — no ARIA semantics. The slotted element manages its own ARIA.
 *
 * The ring appears automatically when a slotted element receives keyboard focus
 * (`:focus-visible`). It can also be controlled externally via the `visible` prop.
 *
 * @summary Visual focus ring wrapper for consistent focus indication.
 *
 * @tag hx-focus-ring
 *
 * @slot - The focusable element being wrapped.
 *
 * @csspart base - The wrapper container element.
 * @csspart ring - The absolutely-positioned focus ring overlay.
 *
 * @cssprop [--hx-focus-ring-color=var(--hx-color-focus-ring)] - Ring color. Resolves through the design token cascade.
 * @cssprop [--hx-focus-ring-width=var(--hx-border-width-focus)] - Ring width. Resolves through the design token cascade.
 * @cssprop [--hx-focus-ring-offset=var(--hx-spacing-focus-offset)] - Ring offset from content. Resolves through the design token cascade.
 */
@customElement('hx-focus-ring')
export class HelixFocusRing extends LitElement {
  static override styles = [tokenStyles, helixFocusRingStyles];

  /**
   * Whether the focus ring is visible (externally controlled).
   * The ring also shows automatically on keyboard focus (`:focus-visible`).
   * @attr visible
   */
  @property({ type: Boolean, reflect: true })
  visible = false;

  /**
   * CSS custom property reference override for ring color.
   * Prefer token references, e.g., `var(--my-brand-color)`.
   * Falls back to `--hx-focus-ring-color` → `--hx-color-focus-ring`.
   * @remarks Passing raw color values (e.g., `#ff0000`) bypasses the design token system.
   * @attr color
   */
  @property({ type: String })
  color: string | undefined = undefined;

  /**
   * CSS custom property reference override for ring width.
   * Prefer token references, e.g., `var(--my-border-width)`.
   * Falls back to `--hx-focus-ring-width` → `--hx-border-width-focus`.
   * @remarks Passing raw values (e.g., `3px`) bypasses the design token system.
   * @attr width
   */
  @property({ type: String })
  width: string | undefined = undefined;

  /**
   * CSS custom property reference override for ring offset.
   * Prefer token references, e.g., `var(--my-spacing)`.
   * Falls back to `--hx-focus-ring-offset` → `--hx-spacing-focus-offset`.
   * @remarks Passing raw values (e.g., `4px`) bypasses the design token system.
   * @attr offset
   */
  @property({ type: String })
  offset: string | undefined = undefined;

  /**
   * Shape of the focus ring.
   * @attr shape
   */
  @property({ type: String, reflect: true })
  shape: 'box' | 'circle' | 'pill' = 'box';

  @state()
  private _keyboardVisible = false;

  private _handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as Element | null;
    if (target?.matches(':focus-visible')) {
      this._keyboardVisible = true;
    }
  };

  private _handleFocusOut = (): void => {
    this._keyboardVisible = false;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('focusin', this._handleFocusIn);
    this.addEventListener('focusout', this._handleFocusOut);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('focusin', this._handleFocusIn);
    this.removeEventListener('focusout', this._handleFocusOut);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('shape')) {
      const validShapes = ['box', 'circle', 'pill'];
      if (!validShapes.includes(this.shape)) {
        console.warn(`[hx-focus-ring] Invalid shape "${this.shape}". Falling back to "box".`);
        this.shape = 'box';
      }
    }
  }

  override render() {
    const tokenOverrides: Record<string, string> = {};
    if (this.color) tokenOverrides['--_ring-color'] = this.color;
    if (this.width) tokenOverrides['--_ring-width'] = this.width;
    if (this.offset) tokenOverrides['--_ring-offset'] = this.offset;

    const hasOverrides = Object.keys(tokenOverrides).length > 0;

    const ringClasses = {
      ring: true,
      [`ring--${this.shape}`]: true,
      'ring--keyboard-visible': this._keyboardVisible,
    };

    return html`
      <div part="base" class="base" style=${hasOverrides ? styleMap(tokenOverrides) : nothing}>
        <slot></slot>
        <div part="ring" class=${classMap(ringClasses)} aria-hidden="true"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-focus-ring': HelixFocusRing;
  }
}
