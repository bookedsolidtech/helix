import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixStackStyles } from './hx-stack.styles.js';

/**
 * A flexbox layout wrapper for consistent vertical/horizontal spacing between children.
 *
 * @summary Flexbox stack layout utility for arranging children with consistent spacing.
 *
 * @tag hx-stack
 *
 * @slot - Default slot for any child content.
 *
 * @csspart base - The inner flex container.
 */
@customElement('hx-stack')
export class HelixStack extends LitElement {
  static override styles = [tokenStyles, helixStackStyles];

  /**
   * Direction of the stack layout.
   * @attr direction
   */
  @property({ type: String, reflect: true })
  direction: 'horizontal' | 'vertical' = 'vertical';

  /**
   * Gap between children using design tokens.
   * @attr gap
   */
  @property({ type: String, reflect: true })
  gap: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /**
   * Align-items value for cross-axis alignment.
   * @attr align
   */
  @property({ type: String, reflect: true })
  align: 'start' | 'center' | 'end' | 'stretch' | 'baseline' = 'stretch';

  /**
   * Justify-content value for main-axis distribution.
   * @attr justify
   */
  @property({ type: String, reflect: true })
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' = 'start';

  /**
   * When true, children wrap onto multiple lines.
   * @attr wrap
   */
  @property({ type: Boolean, reflect: true })
  wrap = false;

  /**
   * When true, the component renders as `display: inline-flex`.
   * @attr inline
   */
  @property({ type: Boolean, reflect: true })
  inline = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'presentation');
    }
  }

  override render() {
    return html`
      <div part="base">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-stack': HelixStack;
  }
}
