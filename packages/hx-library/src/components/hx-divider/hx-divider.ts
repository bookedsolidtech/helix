import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDividerStyles } from './hx-divider.styles.js';

/**
 * Visual separator for dividing content sections.
 *
 * @summary Horizontal or vertical visual separator line.
 *
 * @tag hx-divider
 *
 * @csspart divider - The hr element used as the visual separator.
 *
 * @cssprop [--hx-divider-color=var(--hx-color-neutral-200)] - Divider line color.
 * @cssprop [--hx-divider-thickness=1px] - Divider line thickness.
 * @cssprop [--hx-divider-spacing] - Margin around the divider (overrides spacing variant).
 */
@customElement('hx-divider')
export class HelixDivider extends LitElement {
  static override styles = [tokenStyles, helixDividerStyles];

  /**
   * Orientation of the divider line.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Line style variant of the divider.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'solid' | 'dashed' | 'dotted' = 'solid';

  /**
   * Spacing (margin) around the divider.
   * @attr spacing
   */
  @property({ type: String, reflect: true })
  spacing: 'sm' | 'md' | 'lg' = 'md';

  /**
   * ARIA role for the divider. Maps from the HTML `role` attribute.
   * Use `role="presentation"` to hide the divider from assistive technology.
   * @attr role
   */
  @property({ type: String, reflect: true, attribute: 'role' })
  separatorRole: 'separator' | 'presentation' = 'separator';

  // ─── Render ───

  override render() {
    const isPresentation = this.separatorRole === 'presentation';

    const classes = {
      divider: true,
      [`divider--${this.orientation}`]: true,
      [`divider--${this.variant}`]: true,
    };

    return html`
      <hr
        part="divider"
        class=${classMap(classes)}
        role=${this.separatorRole}
        aria-hidden=${isPresentation ? 'true' : 'false'}
        aria-orientation=${this.orientation === 'vertical' ? 'vertical' : 'horizontal'}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-divider': HelixDivider;
  }
}
