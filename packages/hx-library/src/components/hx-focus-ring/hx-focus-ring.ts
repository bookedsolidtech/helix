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
 * Automatically detects keyboard focus (`:focus-visible`) on slotted content
 * and shows the ring. The `visible` property can be used for manual control.
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
 * @cssprop [--hx-focus-ring-color=var(--hx-color-primary-500)] - Default ring color.
 * @cssprop [--hx-focus-ring-width=var(--hx-border-width-focus)] - Default ring width.
 * @cssprop [--hx-focus-ring-offset=var(--hx-spacing-focus-offset)] - Default ring offset from content.
 */
@customElement('hx-focus-ring')
export class HelixFocusRing extends LitElement {
  static override styles = [tokenStyles, helixFocusRingStyles];

  /**
   * Whether the focus ring is visible (manual control).
   * @attr visible
   */
  @property({ type: Boolean, reflect: true })
  visible = false;

  /**
   * CSS color override for the ring. Accepts any CSS color value or
   * design token reference (e.g., `var(--hx-color-danger-500)`).
   * Falls back to `--hx-focus-ring-color`.
   * @attr color
   */
  @property({ type: String })
  color: string | undefined = undefined;

  /**
   * Ring width override. Accepts any CSS length value or
   * design token reference (e.g., `var(--hx-border-width-lg)`).
   * Falls back to `--hx-focus-ring-width`.
   * @attr width
   */
  @property({ type: String })
  width: string | undefined = undefined;

  /**
   * Ring offset override. Accepts any CSS length value or
   * design token reference (e.g., `var(--hx-spacing-sm)`).
   * Falls back to `--hx-focus-ring-offset`.
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

  /** Whether the ring is auto-shown due to keyboard focus on slotted content. */
  @state()
  private _keyboardFocused = false;

  private static readonly _validShapes = new Set(['box', 'circle', 'pill']);

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

  private _handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as Element;
    try {
      if (target.matches(':focus-visible')) {
        this._keyboardFocused = true;
      }
    } catch {
      // :focus-visible not supported — show on all focus
      this._keyboardFocused = true;
    }
  };

  private _handleFocusOut = (): void => {
    this._keyboardFocused = false;
  };

  private _resolvedShape(): 'box' | 'circle' | 'pill' {
    if (HelixFocusRing._validShapes.has(this.shape)) {
      return this.shape;
    }
    return 'box';
  }

  override render() {
    const tokenOverrides: Record<string, string> = {};
    if (this.color) tokenOverrides['--_ring-color'] = this.color;
    if (this.width) tokenOverrides['--_ring-width'] = this.width;
    if (this.offset) tokenOverrides['--_ring-offset'] = this.offset;

    const hasOverrides = Object.keys(tokenOverrides).length > 0;
    const resolvedShape = this._resolvedShape();

    const ringClasses = {
      ring: true,
      [`ring--${resolvedShape}`]: true,
      'ring--active': this._keyboardFocused,
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
