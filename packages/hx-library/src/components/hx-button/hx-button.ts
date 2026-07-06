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
 * @cssprop [--hx-button-bg=var(--hx-color-action-primary-bg)] - Button background color. **Variant-shadowed**: every `.button--{variant}` rule rebinds this property at descendant scope, so a host-level override (`style="--hx-button-bg: …"` or `:host`-targeting CSS) does not reach paint for primary/secondary/tertiary/danger/ghost/outline buttons. To recolor a variant fill, override the upstream semantic instead — e.g. `--hx-color-action-primary-bg` (light primary), `--hx-color-action-primary-bg-inverted-rest` (inverted primary), `--hx-color-action-danger-bg` (danger), or the inverted overlay tokens for tertiary/secondary/ghost/outline. The `--hx-button-bg` hook still works for the rare case of an unstyled base button without a `variant` class, and is internally rebound by the variant rules to participate in the active/hover override chain.
 * @cssprop [--hx-button-hover-bg] - Hover background override (primary and danger variants only). Other variants (secondary/outline, ghost) keep their hover fills routed through their semantic action.* tokens and do not consume this hook. Under [inverted] for primary/danger, hover and active share a paint (combined :hover, :active rule), so this override applies to both states unless --hx-button-active-bg also takes precedence.
 * @cssprop [--hx-button-active-bg] - Pressed/active background override (primary and danger variants only, including their inverted modes). Takes precedence over --hx-button-hover-bg in the fallback chain. Standard-mode primary/danger default to action.{primary,danger}.bg-active (with filter:none) for AA-pinned pressed contrast. Inverted-mode primary/danger reuse action.{primary,danger}.bg-inverted-hover (combined :hover, :active rule); setting --hx-button-active-bg under [inverted] therefore overrides the lifted hover fill as well as the pressed fill — the two share a paint in inverted mode. Other variants do not consume this hook.
 * @cssprop [--hx-button-color=var(--hx-color-text-on-primary)] - Button text color (variants route through text.on-{role} / text.on-{role}-strong).
 * @cssprop [--hx-button-border-color=transparent] - Button border color (secondary/outline variants route through action.secondary.border).
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 *
 * @cssprop [--hx-button-inverted-color=var(--hx-color-text-inverse)] - Text color when inverted (resolves to neutral-0).
 * @cssprop [--hx-button-inverted-primary-interactive-color=var(--hx-color-text-on-primary)] - Foreground override for inverted primary hover and pressed (combined :hover, :active rule). Defaults to text.on-primary (neutral-900, no dark-mode flip) so dark text rides the lifted primary-400 fill — text.inverse on light teal collapses to ~2.4:1 in light mode.
 * @cssprop [--hx-button-inverted-danger-interactive-color=var(--hx-color-text-on-error)] - Foreground override for inverted danger hover and pressed (combined :hover, :active rule). Defaults to text.on-error (neutral-900); same rationale as the primary override.
 * @cssprop [--hx-button-inverted-ghost-hover-bg=var(--hx-color-surface-on-dark-overlay-default)] - Ghost hover bg when inverted (overlay-white-30 — translucent fill, not a border; contrast not applicable).
 * @cssprop [--hx-button-inverted-focus-ring-color=var(--hx-color-border-on-dark-strong)] - Focus ring color when inverted (overlay-white-70 ≈ 5:1 vs neutral-900 — clears WCAG 1.4.11 3:1 floor for non-text UI).
 *
 * @cssprop [--hx-color-action-primary-bg] - Primary variant resting fill (3.2.1 semantic action layer).
 * @cssprop [--hx-color-action-primary-bg-hover] - Primary variant hover fill.
 * @cssprop [--hx-color-action-primary-bg-active] - Primary variant active/pressed fill.
 * @cssprop [--hx-color-action-secondary-fg] - Secondary/outline variant fg (resolves to primary-600 light, primary-400 dark). Consumed only by .button--secondary; the actual border/surface paint for outline currently routes through --hx-color-border-strong / --hx-color-surface-raised in styles, with this token reserved for the foreground.
 * @cssprop [--hx-color-action-secondary-border] - Secondary/outline variant border (3.2.1 semantic; outline still routes through --hx-color-border-strong by default).
 * @cssprop [--hx-color-action-secondary-bg-hover] - Secondary/outline variant hover fill (3.2.1 semantic; outline still routes through --hx-color-surface-raised by default).
 * @cssprop [--hx-color-action-ghost-fg] - Ghost variant fg.
 * @cssprop [--hx-color-action-ghost-bg-hover] - Ghost variant hover fill.
 * @cssprop [--hx-color-action-danger-bg] - Danger variant resting fill.
 * @cssprop [--hx-color-action-danger-bg-hover] - Danger variant hover fill.
 * @cssprop [--hx-color-action-danger-bg-active] - Danger variant active fill.
 * @cssprop [--hx-color-action-primary-bg-inverted-hover] - Primary variant hover/pressed fill on dark/inverted surface (resolves to primary-400, 7.27:1 on neutral-900).
 * @cssprop [--hx-color-action-danger-bg-inverted-hover] - Danger variant hover/pressed fill on dark/inverted surface (resolves to error-400, 6.58:1 on neutral-900).
 * @cssprop [--hx-color-text-on-primary] - Foreground for primary fill (resolves to neutral-900 — AA-tuned for primary-500).
 * @cssprop [--hx-color-text-on-primary-strong] - Foreground for primary-hover fill (resolves to neutral-0 across modes).
 * @cssprop [--hx-color-text-on-error] - Foreground for danger fill (resolves to neutral-900).
 * @cssprop [--hx-color-text-on-error-strong] - Foreground for danger-hover fill (resolves to neutral-0 across modes).
 * @cssprop [--hx-color-text-primary] - Foreground for tertiary variant on surface.sunken.
 * @cssprop [--hx-color-surface-sunken] - Tertiary variant resting fill.
 * @cssprop [--hx-color-surface-raised] - Tertiary variant hover fill.
 * @cssprop [--hx-color-surface-on-dark-overlay-subtle] - Inverted-tertiary resting fill (overlay-white-10 — translucent fill, not a border).
 * @cssprop [--hx-color-surface-on-dark-overlay-default] - Inverted-tertiary hover fill + inverted-secondary/ghost/outline hover fill (overlay-white-30 — translucent fill, not a border).
 * @cssprop [--hx-color-border-on-dark-strong] - Inverted-secondary/outline border + inverted focus-visible outline (overlay-white-70 ≈ 5:1 — clears WCAG 1.4.11 3:1 floor).
 * @cssprop [--hx-color-border-on-dark-subtle] - DEPRECATED 3.2.2; renamed to --hx-color-surface-on-dark-overlay-subtle (the value paints a translucent fill, not a border). Consume sites read both names via deprecated-first fallback so existing overrides keep working until removal in 4.0.0.
 * @cssprop [--hx-color-border-on-dark-default] - DEPRECATED 3.2.2; renamed to --hx-color-surface-on-dark-overlay-default (the value paints a translucent fill, not a border). Consume sites read both names via deprecated-first fallback so existing overrides keep working until removal in 4.0.0.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-button/AAA-AUDIT.md
 * @keyboard-contract activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern button
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/button/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.6.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-button
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
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
  @property({ type: String, reflect: true })
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
   *
   * **Mode scope:** `[inverted]` is validated for placement on a dark *region*
   * within a light-mode-active page (hero banners, gradient sections, dark
   * cards). It is NOT validated for use within a dark-mode-active root
   * context: in dark mode, `surface.inverse` flips to a light surface
   * (neutral-100), and the lifted `-400` hover/active fills lose UI-floor
   * contrast against it (primary 2.10:1, danger 2.32:1 vs WCAG 1.4.11's 3:1
   * floor). Mode-aware fill stops + foreground for the dark-mode-inverted
   * combination are tracked as a 3.2.x follow-up.
   *
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
   * then the consumer-set aria-label attribute (read via data-aria-label which
   * mixinDelegatesAria writes when consumers set the host's `aria-label`),
   * then the still-pending `aria-label` attribute (in case the mixin has not
   * yet processed it), falling back to empty string.
   *
   * HX-015 migration: never read `this.ariaLabel` (the native HTMLElement IDL
   * property). The mixin overrides `ariaLabel` to read `data-aria-label` in
   * modern browsers, but the IDL fallback path breaks in fallback browsers and
   * confuses consumers who follow the v3 upgrade guide. Read the attribute
   * storage directly so the source-of-truth is unambiguous.
   *
   * @internal
   */
  private get _effectiveLabel(): string {
    return (
      this.accessibleLabel?.trim() ||
      this.getAttribute('data-aria-label')?.trim() ||
      this.getAttribute('aria-label')?.trim() ||
      ''
    );
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

    // mixinDelegatesAria forwarding: consumer-set aria-* (aria-pressed for
    // toggle buttons, aria-expanded/aria-haspopup/aria-controls for
    // menu/dropdown triggers, aria-describedby for inline help, aria-current
    // for active-link semantics in href mode) land in data-aria-* on the
    // host. Project them onto the inner role-bearing native element so AT
    // walks them on the <button>/<a>, not the generic host.
    const projectedPressed = this.getAttribute('data-aria-pressed');
    const projectedExpanded = this.getAttribute('data-aria-expanded');
    const projectedHasPopup = this.getAttribute('data-aria-haspopup');
    const projectedControls = this.getAttribute('data-aria-controls');
    const projectedDescribedBy = this.getAttribute('data-aria-describedby');
    const projectedCurrent = this.getAttribute('data-aria-current');
    const projectedLabelledBy = this.getAttribute('data-aria-labelledby');

    if (this.href !== undefined) {
      return html`
        <a
          part="button"
          class=${classMap(classes)}
          href=${this.disabled || this.loading ? nothing : ifDefined(this.href)}
          target=${ifDefined(this.target)}
          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}
          aria-label=${this._effectiveLabel || nothing}
          aria-labelledby=${ifDefined(projectedLabelledBy ?? undefined)}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          aria-pressed=${ifDefined(projectedPressed ?? undefined)}
          aria-expanded=${ifDefined(projectedExpanded ?? undefined)}
          aria-haspopup=${ifDefined(projectedHasPopup ?? undefined)}
          aria-controls=${ifDefined(projectedControls ?? undefined)}
          aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
          aria-current=${ifDefined(projectedCurrent ?? undefined)}
          tabindex=${this.disabled || this.loading ? '-1' : nothing}
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
        aria-labelledby=${ifDefined(projectedLabelledBy ?? undefined)}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-pressed=${ifDefined(projectedPressed ?? undefined)}
        aria-expanded=${ifDefined(projectedExpanded ?? undefined)}
        aria-haspopup=${ifDefined(projectedHasPopup ?? undefined)}
        aria-controls=${ifDefined(projectedControls ?? undefined)}
        aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
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
