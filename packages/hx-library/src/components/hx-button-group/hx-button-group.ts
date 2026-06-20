import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { helixButtonGroupStyles } from './hx-button-group.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import { applyLegacySizeAlias } from '../../utils/apply-legacy-size-alias.js';

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
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-button-group/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow; activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern toolbar
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-button-group
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
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

  /**
   * Cached list of focusable items inside the group. Invalidated on
   * slotchange. Used by the roving-tabindex keyboard contract.
   * @internal
   */
  private _focusableCache: HTMLElement[] | null = null;

  /**
   * APG toolbar pattern roving-tabindex keyboard handler.
   * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
   *
   * - ArrowRight / ArrowDown (vertical): focus next item, wrap.
   * - ArrowLeft  / ArrowUp   (vertical): focus prev item, wrap.
   * - Home: focus first item.
   * - End:  focus last item.
   * @internal
   */
  private _handleKeydown = (e: KeyboardEvent): void => {
    const isVertical = this._orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (e.key === nextKey) {
      e.preventDefault();
      this._moveFocus('next');
    } else if (e.key === prevKey) {
      e.preventDefault();
      this._moveFocus('prev');
    } else if (e.key === 'Home') {
      e.preventDefault();
      const items = this._getFocusableItems();
      if (items.length) {
        items.forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
        items[0]?.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      const items = this._getFocusableItems();
      const last = items.length - 1;
      if (items.length) {
        items.forEach((el, i) => el.setAttribute('tabindex', i === last ? '0' : '-1'));
        items[last]?.focus();
      }
    }
  };

  /** @internal */
  private _isFocusable(el: HTMLElement): boolean {
    if (el.hasAttribute('disabled')) return false;
    const elWithDisabled = el as HTMLElement & { disabled?: boolean };
    if (elWithDisabled.disabled === true) return false;
    if (el.tabIndex >= 0) return true;
    const tag = el.tagName.toLowerCase();
    return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
  }

  /** @internal */
  private _getFocusableItems(): HTMLElement[] {
    if (this._focusableCache) return this._focusableCache;
    const slot = this.shadowRoot?.querySelector('slot');
    const items: HTMLElement[] = [];
    if (slot) {
      const assigned = (slot as HTMLSlotElement).assignedElements({ flatten: true });
      for (const el of assigned) {
        if (!(el instanceof HTMLElement)) continue;
        if (this._isFocusable(el)) {
          items.push(el);
        } else {
          const descendants = el.querySelectorAll<HTMLElement>('*');
          for (const d of Array.from(descendants)) {
            if (this._isFocusable(d)) items.push(d);
          }
        }
      }
    }
    this._focusableCache = items;
    return items;
  }

  /** @internal */
  private _initRovingTabindex(): void {
    this._focusableCache = null;
    const items = this._getFocusableItems();
    if (!items.length) return;
    const activeIndex = items.findIndex((el) => el.getAttribute('tabindex') === '0');
    const targetIndex = activeIndex === -1 ? 0 : activeIndex;
    items.forEach((el, i) => el.setAttribute('tabindex', i === targetIndex ? '0' : '-1'));
  }

  /** @internal */
  private _moveFocus(direction: 'next' | 'prev'): void {
    const items = this._getFocusableItems();
    if (!items.length) return;
    const focused = document.activeElement as HTMLElement | null;
    const currentIndex = items.indexOf(focused as HTMLElement);
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }
    items.forEach((el, i) => el.setAttribute('tabindex', i === nextIndex ? '0' : '-1'));
    items[nextIndex]?.focus();
  }

  /** @internal */
  private _handleSlotChange = (): void => {
    this._initRovingTabindex();
  };

  override firstUpdated(): void {
    this._initRovingTabindex();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: forward the legacy unprefixed `size` attribute to the
    // `hx-size`-mapped property (3.x shim, removed in 4.0).
    applyLegacySizeAlias<'sm' | 'md' | 'lg'>(this, 'hx-button-group', (v) => {
      this.size = v;
    });
    this.addEventListener('keydown', this._handleKeydown);
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
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button-group': HelixButtonGroup;
  }
}
