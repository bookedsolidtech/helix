import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixRadioStyles } from './hx-radio.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';

const _nextRadioId = createIdCounter('hx-radio');

/**
 * An individual radio button, designed to be used inside a `<hx-radio-group>`.
 *
 * @summary Presentational radio button managed by its parent radio group.
 *
 * @tag hx-radio
 *
 * @slot - Custom label content (overrides the label property).
 *
 * @csspart radio - The visual radio circle.
 * @csspart label - The label text.
 *
 * @cssprop [--hx-radio-size=var(--hx-size-5, 1.25rem)] - Radio circle size.
 * @cssprop [--hx-radio-border-color=var(--hx-color-neutral-300, #B6BFB9)] - Radio border color.
 * @cssprop [--hx-radio-checked-bg=var(--hx-color-primary-500, #429797)] - Checked background color.
 * @cssprop [--hx-radio-checked-border-color=var(--hx-color-primary-500, #429797)] - Checked border color.
 * @cssprop [--hx-radio-dot-color=var(--hx-color-neutral-0, #ffffff)] - Inner dot color when checked.
 * @cssprop [--hx-radio-focus-ring-color=var(--hx-focus-ring-color, #6AB1B1)] - Focus ring color.
 * @cssprop [--hx-radio-label-color=var(--hx-color-neutral-700, #313E4B)] - Label text color.
 */
@customElement('hx-radio')
export class HelixRadio extends HelixElement {
  static override styles = [helixRadioStyles, forcedColorsField];

  // ─── Properties ───

  /**
   * The value this radio represents.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Visible label text for the radio.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether this radio is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether this radio is checked. Managed by the parent group.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Set by `hx-radio-group` to mark this child as group-managed. `hx-radio` is
   * not form-associated (the group is the sole form participant), so this
   * flag is currently inert on this element. It exists for symmetry with
   * `hx-checkbox._groupedSuppress` so the group/child contract is identical
   * across both selection-control families and any future form-association
   * change on `hx-radio` is automatically suppressed inside a group. Codex
   * round-3 finding #1 (defense-in-depth).
   * @internal
   */
  set _groupedSuppress(value: boolean) {
    this.__groupedSuppress = value;
  }
  get _groupedSuppress(): boolean {
    return this.__groupedSuppress;
  }
  /** @internal */
  private __groupedSuppress = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // ARIA role and state are projected to the accessibility tree via
    // ElementInternals rather than imperative setAttribute calls. This keeps
    // the host element's attribute surface clean — consumers cannot accidentally
    // override role/aria-* — and aligns with the standards pattern for
    // custom elements. See https://wicg.github.io/aom/spec/aria-reflection.html.
    this._internals.role = 'radio';
    this._syncAriaState();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('checked') ||
      changedProperties.has('label') ||
      changedProperties.has('disabled')
    ) {
      this._syncAriaState();
    }
  }

  /**
   * Mirror reactive ARIA state onto ElementInternals. Setting a value to `null`
   * removes it from the accessibility tree (matching the previous
   * removeAttribute behavior).
   *
   * WCAG 4.1.2: expose the label text as ariaLabel on the host so assistive
   * technology can associate the visible label with the radio role. The label
   * span lives inside Shadow DOM and aria-labelledby cannot cross shadow
   * boundaries, so ariaLabel on the host is the correct pattern here.
   *
   * WCAG 4.1.2: omit ariaDisabled entirely when not disabled. Setting
   * aria-disabled="false" is verbose and unnecessary — omission is preferred.
   *
   * @internal
   */
  private _syncAriaState(): void {
    this._internals.ariaChecked = String(this.checked);
    this._internals.ariaLabel = this.label || null;
    this._internals.ariaDisabled = this.disabled ? 'true' : null;
  }

  // ─── Internal IDs ───

  /** @internal */
  private _inputId = _nextRadioId();

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(): void {
    if (this.disabled) {
      return;
    }

    /**
     * Internal event dispatched to signal selection to the parent group.
     * Not part of the public API.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-radio-select', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  // ─── Render ───

  override render() {
    const classes = {
      radio: true,
      'radio--checked': this.checked,
      'radio--disabled': this.disabled,
    };

    return html`
      <div class=${classMap(classes)} @click=${this._handleClick}>
        <input
          class="radio__input"
          type="radio"
          id=${this._inputId}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          tabindex="-1"
          aria-hidden="true"
        />
        <span part="radio" class="radio__control" aria-hidden="true">
          <span class="radio__dot"></span>
        </span>
        <span part="label" class="radio__label">
          <slot>${this.label}</slot>
        </span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-radio': HelixRadio;
  }
}

/** Canonical type alias for the hx-radio component. */
export type HxRadio = HelixRadio;
