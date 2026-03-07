import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { helixRippleStyles } from './hx-ripple.styles.js';

/**
 * An optional touch/click ripple effect utility for interactive elements.
 * Used by interactive components when the active theme calls for tactile feedback.
 * Wrap the target element in the default slot; the ripple expands from the click point.
 *
 * @summary Material-style ripple effect overlay for interactive elements.
 *
 * @tag hx-ripple
 *
 * @slot - The element to apply the ripple effect to.
 *
 * @csspart base - The ripple container positioned over the slotted element.
 * @csspart ripple - The expanding ripple wave circle (created dynamically).
 *
 * @cssprop [--hx-ripple-color=currentColor] - Color of the ripple wave.
 * @cssprop [--hx-ripple-opacity=0.2] - Opacity of the ripple wave.
 * @cssprop [--hx-ripple-duration=600ms] - Duration of the ripple animation.
 */
@customElement('hx-ripple')
export class HelixRipple extends LitElement {
  static override styles = [helixRippleStyles];

  /**
   * Color of the ripple. Overrides the --hx-ripple-color CSS custom property.
   * @attr color
   */
  @property({ type: String, reflect: true })
  color: string | undefined = undefined;

  /**
   * When true, disables ripple creation on pointer events.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  private _reduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private _handlePointerDown = (e: PointerEvent): void => {
    if (this.disabled || this._reduceMotion()) return;

    const base = this.shadowRoot?.querySelector<HTMLElement>('.ripple__base');
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple__wave';
    ripple.setAttribute('part', 'ripple');
    ripple.setAttribute('aria-hidden', 'true');

    if (this.color) {
      ripple.style.backgroundColor = this.color;
    }

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    base.appendChild(ripple);

    ripple.addEventListener(
      'animationend',
      () => {
        ripple.remove();
      },
      { once: true },
    );
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerdown', this._handlePointerDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this._handlePointerDown);
  }

  override render() {
    return html`
      <slot></slot>
      <span class="ripple__base" part="base" aria-hidden="true"></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-ripple': HelixRipple;
  }
}
