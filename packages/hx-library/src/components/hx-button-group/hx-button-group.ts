import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { helixButtonGroupStyles } from './hx-button-group.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';

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
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 */
@customElement('hx-button-group')
export class HelixButtonGroup extends HelixElement {
  static override styles = [helixButtonGroupStyles, forcedColorsInteractive];

  /**
   * Layout orientation of the button group.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  get orientation(): 'horizontal' | 'vertical' {
    return this._orientation;
  }
  set orientation(value: string) {
    if (value !== 'horizontal' && value !== 'vertical') {
      devWarn('hx-button-group', `Invalid orientation "${value}", defaulting to "horizontal".`);
      value = 'horizontal';
    }
    this._orientation = value as 'horizontal' | 'vertical';
  }
  /**
   * Backing store for the orientation property, holding the validated orientation value.
   * @internal
   */
  private _orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Size applied to the button group and cascaded to child buttons via
   * the --hx-button-group-size CSS custom property.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible label for the button group. Sets aria-label on the host element.
   * **Strongly recommended** for WCAG 2.1 AA compliance — without it, screen
   * readers announce an unnamed "group". For Drupal/Twig compatibility, prefer
   * applying `aria-label` directly as an HTML attribute instead.
   * @attr label
   */
  @property({ type: String })
  label: string = '';

  // ─── Lifecycle ───

  /**
   * Tracks whether the consumer set `aria-label` directly as an HTML attribute
   * BEFORE the `label` property fired. Used to avoid clobbering consumer-set
   * aria-label when `label` is empty.
   * @internal
   */
  private _consumerAriaLabel: string | null = null;

  /**
   * Snapshot of the consumer-set `role` attribute taken at connect time.
   * When non-null, the consumer has explicitly set a role (e.g. `toolbar`,
   * `radiogroup`) and the host-canonical mirror MUST defer to that role
   * rather than overwriting `internals.role` with the default `"group"`.
   * Mirrors the `_consumerAriaLabel` snapshot pattern above.
   * @internal
   */
  private _consumerRole: string | null = null;

  /**
   * Tracks whether the no-label devWarn has already fired for this instance,
   * so disconnect/reconnect cycles do not spam the console.
   * @internal
   */
  private _emptyLabelWarnEmitted = false;

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('size')) {
      this.style.setProperty('--hx-button-group-size', this.size);
    }

    if (changedProperties.has('label')) {
      if (this.label) {
        this.setAttribute('aria-label', this.label);
      } else if (this._consumerAriaLabel !== null) {
        // Restore consumer-set aria-label rather than removing it. The
        // consumer's HTML attribute is the documented Drupal/Twig path
        // (lines 67-68 narrative) and must not be clobbered by an empty
        // `label` property.
        this.setAttribute('aria-label', this._consumerAriaLabel);
      } else {
        this.removeAttribute('aria-label');
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Capture any consumer-set aria-label BEFORE the `label` property writes
    // overwrite it. This snapshot wins back the host attribute when `label`
    // is later cleared.
    if (this._consumerAriaLabel === null && this.hasAttribute('aria-label')) {
      this._consumerAriaLabel = this.getAttribute('aria-label');
    }
    // CodeRabbit SHOULD-FIX (PR #1649 follow-up): snapshot the consumer's
    // explicit `role` BEFORE the host-canonical mirror overwrites it. When
    // a consumer sets `role="toolbar"` (or `radiogroup`, etc.), the mirror
    // must defer to that role; otherwise two surfaces disagree (host attr
    // says toolbar, internals says group) and AT picks one inconsistently.
    if (this._consumerRole === null && this.hasAttribute('role')) {
      this._consumerRole = this.getAttribute('role');
    }
    // Host-canonical role: use ElementInternals so the role survives in the
    // a11y tree even if a consumer attribute-strips the host. Mirror to the
    // host attribute as well for older AT/devtools that walk attributes.
    if (this._consumerRole) {
      // Defer to the consumer's role on both surfaces.
      this._internals.role = this._consumerRole;
    } else {
      this._internals.role = 'group';
      this.setAttribute('role', 'group');
    }
    this.style.setProperty('--hx-button-group-size', this.size);
    if (this.label) {
      this.setAttribute('aria-label', this.label);
    } else if (this._consumerAriaLabel !== null) {
      // Consumer-set aria-label is fine — no warning needed.
    } else if (!this._emptyLabelWarnEmitted) {
      this._emptyLabelWarnEmitted = true;
      devWarn(
        'hx-button-group',
        'Missing accessible label. Provide a `label` attribute so screen readers can announce the group purpose (WCAG 4.1.2).',
      );
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
