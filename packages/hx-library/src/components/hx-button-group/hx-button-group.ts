import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixButtonGroupStyles } from './hx-button-group.styles.js';

/**
 * A container component that groups related hx-button elements into a cohesive
 * horizontal or vertical action set. Eliminates double borders between adjacent
 * buttons and squares off inner border-radius for a unified visual appearance.
 *
 * **Accessibility:** Always provide an accessible label via `aria-label` or
 * `aria-labelledby` so screen readers can announce the group purpose.
 *
 * @summary Groups hx-button elements into a horizontal or vertical action set with shared borders.
 *
 * @tag hx-button-group
 *
 * @slot - Default slot accepting hx-button children.
 *
 * @csspart group - The container div element wrapping all slotted buttons.
 *
 * @cssprop [--hx-button-group-size=md] - Size token forwarded to child buttons. Accepts 'sm', 'md', or 'lg'.
 */
@customElement('hx-button-group')
export class HelixButtonGroup extends LitElement {
  static override styles = [tokenStyles, helixButtonGroupStyles];

  private internals: ElementInternals;

  /**
   * Layout orientation of the button group.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Size applied to the button group and cascaded to child buttons via
   * the --hx-button-group-size CSS custom property.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible label for the button group. Sets aria-label via ElementInternals.
   * **Strongly recommended** for WCAG 2.1 AA compliance — without it, screen
   * readers announce an unnamed "group". For Drupal/Twig compatibility, prefer
   * applying `aria-label` directly as an HTML attribute instead.
   * @attr label
   */
  @property({ type: String })
  label: string = '';

  // ─── Constructor ───

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = 'group';
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('size')) {
      this.style.setProperty('--hx-button-group-size', this.size);
    }

    if (changedProperties.has('label')) {
      this.internals.ariaLabel = this.label || null;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.setProperty('--hx-button-group-size', this.size);
    if (this.label) {
      this.internals.ariaLabel = this.label;
    }
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="group"
        class=${classMap({
          group: true,
          'group--horizontal': this.orientation === 'horizontal',
          'group--vertical': this.orientation === 'vertical',
        })}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button-group': HelixButtonGroup;
  }
}
