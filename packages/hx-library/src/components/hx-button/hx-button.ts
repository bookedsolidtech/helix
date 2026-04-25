import { html, nothing, type TemplateResult, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import { helixButtonStyles } from './hx-button.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

/** Detail for the hx-click event dispatched by hx-button. */
export interface HxButtonClickDetail {
  originalEvent: MouseEvent;
}

/**
 * A production-grade button component for user interaction. Supports multiple
 * visual variants, sizes, loading state, prefix/suffix slots, anchor rendering,
 * and full ElementInternals form association.
 *
 * @summary Primary interactive element for triggering actions and form submission.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the button is clicked and is neither disabled nor loading.
 *
 * @csspart button - The native button or anchor element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 * @csspart spinner - The loading spinner SVG element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-action-primary-bg)] - Button background color (3.2.1 cascade — variant rules route through action.{primary,secondary,ghost,danger}.bg).
 * @cssprop [--hx-button-hover-bg] - Hover background override; when set, overrides the variant default hover background from outside the shadow DOM.
 * @cssprop [--hx-button-color=var(--hx-color-text-on-primary)] - Button text color (variants route through text.on-{role} / text.on-{role}-strong).
 * @cssprop [--hx-button-border-color=transparent] - Button border color (secondary/outline variants route through action.secondary.border).
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 *
 * @cssprop [--hx-button-inverted-color=var(--hx-color-text-inverse)] - Text color when inverted (resolves to neutral-0).
 * @cssprop [--hx-button-inverted-ghost-hover-bg=var(--hx-color-border-on-dark-default)] - Ghost hover bg when inverted (overlay-white-30 ≈ 5:1 vs neutral-900).
 * @cssprop [--hx-button-inverted-focus-ring-color=var(--hx-color-border-on-dark-strong)] - Focus ring color when inverted (overlay-white-70 = ~5:1 vs neutral-900).
 *
 * @cssprop [--hx-color-action-primary-bg] - Primary variant resting fill (3.2.1 semantic action layer).
 * @cssprop [--hx-color-action-primary-bg-hover] - Primary variant hover fill.
 * @cssprop [--hx-color-action-primary-bg-active] - Primary variant active/pressed fill.
 * @cssprop [--hx-color-action-secondary-fg] - Secondary/outline variant fg (resolves to primary-600 light, primary-400 dark).
 * @cssprop [--hx-color-action-secondary-border] - Secondary/outline variant border.
 * @cssprop [--hx-color-action-secondary-bg-hover] - Secondary/outline variant hover fill.
 * @cssprop [--hx-color-action-ghost-fg] - Ghost variant fg.
 * @cssprop [--hx-color-action-ghost-bg-hover] - Ghost variant hover fill.
 * @cssprop [--hx-color-action-danger-bg] - Danger variant resting fill.
 * @cssprop [--hx-color-action-danger-bg-hover] - Danger variant hover fill.
 * @cssprop [--hx-color-action-danger-bg-active] - Danger variant active fill.
 * @cssprop [--hx-color-text-on-primary] - Foreground for primary fill (resolves to neutral-900 — AA-tuned for primary-500).
 * @cssprop [--hx-color-text-on-primary-strong] - Foreground for primary-hover fill (resolves to neutral-0 across modes).
 * @cssprop [--hx-color-text-on-error] - Foreground for danger fill (resolves to neutral-900).
 * @cssprop [--hx-color-text-on-error-strong] - Foreground for danger-hover fill (resolves to neutral-0 across modes).
 * @cssprop [--hx-color-text-primary] - Foreground for tertiary variant on surface.sunken.
 * @cssprop [--hx-color-surface-sunken] - Tertiary variant resting fill.
 * @cssprop [--hx-color-surface-raised] - Tertiary variant hover fill.
 * @cssprop [--hx-color-border-on-dark-subtle] - Inverted-tertiary resting border (overlay-white-10).
 * @cssprop [--hx-color-border-on-dark-default] - Inverted-tertiary hover border + inverted-secondary/ghost hover border (overlay-white-30).
 * @cssprop [--hx-color-border-on-dark-strong] - Inverted focus-visible outline (overlay-white-70).
 */
@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(HelixElement) {
  // 3.2.1: forced-colors deference is owned by the bespoke @media block in
  // hx-button.styles.ts (covers loading/disabled/focus, not just the base).
  // Do NOT also compose forcedColorsInteractive here — the mixin's docstring
  // forbids dual composition (XOR rule) and the dual approach was flagged in
  // the token-cascade campaign findings.
  static override styles = [helixButtonStyles];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  // ─── Public Properties ───

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' = 'primary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. Prevents all interaction and form actions.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the button is in a loading state. Shows spinner, prevents interaction,
   * and sets aria-busy. Does not set the disabled attribute.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * The type attribute for the underlying button element. Ignored when href is set.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * When set, renders an anchor element instead of a button.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Anchor target attribute. Only used when href is set.
   * @attr target
   */
  @property({ type: String })
  target: string | undefined = undefined;

  /**
   * Form field name submitted via ElementInternals.setFormValue on submit.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Form field value submitted via ElementInternals.setFormValue on submit.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * When true, the button stretches to fill its container width.
   * Sets the host to `display: block` and the inner element to `width: 100%`.
   * @attr full
   */
  @property({ type: Boolean, reflect: true })
  full = false;

  /**
   * When true, flips button colors for placement on dark or gradient backgrounds.
   * Forces text to white and adjusts hover/focus ring colors across all variants.
   * @attr inverted
   */
  @property({ type: Boolean, reflect: true })
  inverted = false;

  /**
   * Accessible label for icon-only or text-less buttons.
   * Required when the button has no visible text content.
   *
   * Accepts both `accessible-label` and the standard `aria-label` HTML attribute.
   * `accessible-label` takes precedence when both are set.
   *
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string = '';

  /**
   * Returns the effective label for the button, checking accessible-label first,
   * then the aria-label attribute, falling back to empty string.
   * @internal
   */
  private get _effectiveLabel(): string {
    return this.accessibleLabel?.trim() || this.ariaLabel?.trim() || '';
  }

  // ─── Form API ───

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Lifecycle ───

  /** @internal */
  private static readonly _VALID_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'danger',
    'ghost',
    'outline',
  ] as const;

  // Prevents double-warn on browsers that fire slotchange for empty initial slots.
  private _emptySlotWarnEmitted = false;

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    const hasContent = (slot?.assignedNodes({ flatten: true }) ?? []).some(
      (n) => n.nodeType !== Node.TEXT_NODE || (n.textContent?.trim().length ?? 0) > 0,
    );
    if (!hasContent && !this._effectiveLabel) {
      this._emptySlotWarnEmitted = true;
      devWarn(
        'hx-button',
        'hx-button has no slot content and no accessible-label — button will have no accessible name.',
      );
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('variant')) {
      const validVariants: string[] = [...HelixButton._VALID_VARIANTS];
      if (!validVariants.includes(this.variant)) {
        devWarn(
          'hx-button',
          `Invalid variant "${this.variant}". Expected one of: ${validVariants.join(', ')}. Clamping to "primary".`,
        );
        this.variant = 'primary';
      }
    }
  }

  // ─── Slot Handlers ───

  /** @internal */
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const hasContent = slot
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent?.trim().length ?? 0) > 0);
    if (!hasContent && !this._effectiveLabel && !this._emptySlotWarnEmitted) {
      devWarn(
        'hx-button',
        'hx-button has no slot content and no accessible-label — button will have no accessible name.',
      );
    }
    // Only reset once content arrives so the guard stays armed for browsers
    // that fire a second slotchange for the same empty initial slot.
    if (hasContent) {
      this._emptySlotWarnEmitted = false;
    }
  }

  // ─── Event Handling ───

  /**
   * @private
   * @internal
   */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the button is clicked.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent<{ originalEvent: MouseEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );

    // Handle form submission/reset if form-associated and not in anchor mode
    if (this.href === undefined && this.type === 'submit' && this._internals.form) {
      if (this.name !== undefined && this.value !== undefined) {
        this._internals.setFormValue(this.value);
      }
      this._internals.form.requestSubmit();
    } else if (this.href === undefined && this.type === 'reset' && this._internals.form) {
      this._internals.form.reset();
    }
  }

  // ─── Render Helpers ───

  /**
   * @private
   * @internal
   */
  private _renderSpinner(): TemplateResult {
    return html`
      <svg
        class="button__spinner"
        part="spinner"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="button__spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          opacity="0.3"
        />
        <path
          class="button__spinner-arc"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  /**
   * @private
   * @internal
   */
  private _renderInner(): TemplateResult {
    return html`
      ${this.loading ? this._renderSpinner() : nothing}
      <span part="prefix" class="button__prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="button__label">
        <slot @slotchange=${this._handleDefaultSlotChange}></slot>
      </span>
      <span part="suffix" class="button__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    const classes = {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
      'button--loading': this.loading,
    };

    if (this.href !== undefined) {
      return html`
        <a
          part="button"
          class=${classMap(classes)}
          href=${this.disabled || this.loading ? nothing : ifDefined(this.href)}
          target=${ifDefined(this.target)}
          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}
          aria-label=${this._effectiveLabel || nothing}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          tabindex=${this.disabled ? '-1' : nothing}
          @click=${this._handleClick}
        >
          ${this._renderInner()}
        </a>
      `;
    }

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-label=${this._effectiveLabel || nothing}
        aria-busy=${this.loading ? 'true' : nothing}
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
  interface HTMLElementEventMap {
    'hx-click': CustomEvent<{ originalEvent: MouseEvent }>;
  }
}
