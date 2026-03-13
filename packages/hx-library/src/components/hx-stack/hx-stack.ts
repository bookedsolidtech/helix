import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
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

  /**
   * Sets `role="presentation"` on connect so assistive technologies treat this
   * element as a purely visual layout wrapper with no semantic meaning. This
   * suppresses any implicit ARIA role that a custom element might otherwise
   * inherit, preventing screen readers from announcing "group" or "region"
   * for what is purely a spacing/alignment container.
   *
   * **Consumer override:** If you need a semantic grouping role (e.g. for a
   * form fieldset equivalent), set `role="group"` or any other ARIA role
   * directly on the element — the guard `!this.hasAttribute('role')` ensures
   * the component will not overwrite it.
   *
   * @example
   * <!-- Layout stack — role="presentation" applied automatically -->
   * <hx-stack gap="md">...</hx-stack>
   *
   * @example
   * <!-- Semantic group — consumer role preserved -->
   * <hx-stack role="group" aria-labelledby="form-heading" gap="md">...</hx-stack>
   */
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
