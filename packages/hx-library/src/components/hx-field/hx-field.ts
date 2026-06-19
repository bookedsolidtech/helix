import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixFieldStyles } from './hx-field.styles.js';
import { devWarn } from '../../utils/dev-warn.js';
import { applyLegacySizeAlias } from '../../utils/apply-legacy-size-alias.js';

/** Native form control tag names that can receive ARIA attributes. */
const FORM_CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

const _nextFieldId = createIdCounter('hx-field');

/** Returns true if the element is a native form control or a custom element. */
function isFormControl(el: Element): el is HTMLElement {
  return FORM_CONTROL_TAGS.has(el.tagName) || el.tagName.includes('-');
}

/**
 * Layout wrapper providing consistent label + input + help text + validation
 * message structure for any form control. Use this when wrapping non-HELiX
 * form controls or native HTML elements in the HELiX form field pattern.
 *
 * This component is NOT form-associated — it is a pure visual layout wrapper.
 *
 * **Light DOM side effect:** This component injects a visually-hidden `<span>`
 * into its light DOM children for ARIA describedby linkage across the shadow
 * DOM boundary. This span has `id="${fieldId}-desc"` and is removed on
 * `disconnectedCallback`. This is an intentional, documented accessibility
 * mechanism.
 *
 * **`aria-label` ownership model:** When `label` is set and no shadow `<label>`
 * is rendered, hx-field writes `aria-label` to the slotted control and stamps
 * a `data-hx-owns-label="true"` ownership marker.
 *
 * Consumers have two ways to keep their value safe from hx-field's writes:
 *   (a) **Suspend** all ARIA bridging by setting `data-aria-managed` on the
 *       control. While present, hx-field skips every aria-* mutation and
 *       leaves any existing marker/snapshot in place — removing
 *       `data-aria-managed` later may resume host ownership of an `aria-label`
 *       value that still matches the snapshot.
 *   (b) **Release** ownership permanently by overwriting `aria-label` to a
 *       different value than the one hx-field last wrote. The mismatch
 *       triggers `_releaseHostOwnedAriaLabel`, which strips the marker and
 *       clears the snapshot, transferring ownership to the consumer.
 *
 * **Limitation:** because release detection is snapshot-based, a consumer
 * rewrite to the *exact same value* hx-field last wrote is invisible. To
 * genuinely take ownership in that case the consumer must write a different
 * value (even briefly), or remove the `data-hx-owns-label` marker themselves.
 *
 * @summary Layout wrapper for label, control, help text, and error message.
 *
 * @tag hx-field
 *
 * @slot - The form control element (native or custom).
 * @slot label - Custom label content (overrides the label property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 * @slot description - Additional descriptive content above the control.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart control - The wrapper around slotted content.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 * @csspart required-indicator - The required asterisk span.
 *
 * @cssprop [--hx-field-label-color=var(--hx-color-neutral-700)] - Label color.
 * @cssprop [--hx-field-error-color=var(--hx-color-error-500)] - Error color.
 * @cssprop [--hx-field-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-field-gap=var(--hx-space-1, 0.25rem)] - Gap between field segments.
 * @cssprop [--hx-field-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-field/AAA-AUDIT.md
 * @aria-pattern label
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-field
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-field')
export class HelixField extends HelixElement {
  static override styles = [helixFieldStyles];

  // ─── Properties ───

  /**
   * The visible label text for the field.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the field is required. Shows a required indicator on the label.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the control for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Visual disabled state applied via opacity. Does not affect slotted control
   * interactivity — set disabled on the slotted control directly.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Size variant controlling label and help text font sizes.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Layout variant. 'column' stacks label above control; 'inline' places them side-by-side.
   * @attr layout
   */
  @property({ type: String, reflect: true })
  layout: 'column' | 'inline' = 'column';

  // ─── Slot Tracking ───

  /**
   * Tracks whether any content is assigned to the label slot, used to conditionally render the label property.
   * @internal
   */
  @state() private _hasLabelSlot = false;

  /**
   * Tracks whether any content is assigned to the error slot, used to toggle error state rendering.
   * @internal
   */
  @state() private _hasErrorSlot = false;

  /**
   * Tracks whether any content is assigned to the help-text slot, used to toggle help text rendering.
   * @internal
   */
  @state() private _hasHelpSlot = false;

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedElements().length > 0;
  }

  // ─── Unique IDs for Accessibility ───

  /**
   * Unique ID for this field instance, used as a base for all derived accessibility IDs.
   * @internal
   */
  private _fieldId = _nextFieldId();

  /**
   * ID for the help text element, allowing aria-describedby to reference it.
   * @internal
   */
  private _helpTextId = `${this._fieldId}-help`;

  /**
   * ID for the error message element, allowing aria-describedby to reference it.
   * @internal
   */
  private _errorId = `${this._fieldId}-error`;

  /**
   * ID for the light-DOM description span injected for cross-shadow-root aria-describedby linkage.
   * @internal
   */
  private _a11yDescId = `${this._fieldId}-desc`;

  // ─── A11y: Slotted control tracking + light-DOM description element ───

  /**
   * The first form control in the default slot. We set aria attributes on this
   * element to bridge the shadow DOM accessibility boundary.
   * @internal
   */
  private _slottedControl: HTMLElement | null = null;

  /**
   * A visually-hidden span injected into the host's light DOM (assigned to the
   * default slot). Because it lives in the same document as the slotted input,
   * `aria-describedby` can reference its ID without cross-shadow-root IDREF
   * limitations.
   *
   * **Documented side effect:** This element is intentionally injected into the
   * component's light DOM children. It is invisible to users but present in the
   * accessibility tree. It is removed in `disconnectedCallback`. Consumers
   * should not remove or modify this span (identifiable by its `id` ending in
   * `-desc`).
   * @internal
   */
  private _a11yDescEl: HTMLElement | null = null;

  /**
   * Marker attribute placed on the slotted control whenever hx-field writes
   * `aria-label` to it. Presence of this marker indicates host ownership of
   * the attribute; absence means the value belongs to the consumer.
   *
   * Ownership is recomputed from the live DOM on every `_syncSlottedControl()`
   * call rather than cached in a flag — this keeps post-mount mutations
   * (consumer adds/removes `aria-label`, toggles `data-aria-managed`)
   * authoritative instead of letting a stale snapshot win.
   *
   * See round-13 F2 for context on the precedence hazard.
   * @internal
   */
  private static readonly _ARIA_LABEL_OWNED_ATTR = 'data-hx-owns-label';

  /**
   * Last `aria-label` value written by hx-field to the currently adopted
   * control. Used in combination with the ownership marker to detect a
   * consumer overwrite: if the marker is present but the live value no
   * longer matches what we last wrote, the consumer has taken over and we
   * release the marker so subsequent syncs treat the value as consumer-
   * owned.
   * @internal
   */
  private _lastWrittenAriaLabel: string | null = null;

  /**
   * Tracks whether the dev-time competing-label warning has already been
   * emitted for the currently adopted slotted control.
   *
   * Latch semantics: this fires **once per adopted control**. The latch is
   * only reset on adoption (`_resolveSlottedControl()`) or disconnection.
   * Toggling `data-aria-managed` on/off on the same control after the
   * warning has fired does NOT re-arm the latch — by design, to avoid
   * console spam from consumers who toggle the attribute repeatedly.
   * @internal
   */
  private _competingLabelWarned = false;

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: forward the legacy unprefixed `size` attribute to the
    // `hx-size`-mapped property (3.x shim, removed in 4.0).
    applyLegacySizeAlias<'sm' | 'md' | 'lg'>(this, 'hx-field', (v) => {
      this.size = v;
    });
    this._ensureA11yDescEl();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._a11yDescEl?.remove();
    this._a11yDescEl = null;
    // Remove aria attributes we set on the slotted control. We only remove
    // `aria-label` if hx-field owns it (marker present) — otherwise the
    // value belongs to the consumer and removing would clobber their input.
    if (this._slottedControl) {
      this._releaseHostOwnedAriaLabel(this._slottedControl);
      this._slottedControl.removeAttribute('aria-required');
      this._slottedControl.removeAttribute('aria-invalid');
      this._slottedControl.removeAttribute('aria-describedby');
      this._slottedControl = null;
    }
    this._competingLabelWarned = false;
  }

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);

    // P2-01: Warn on invalid size values
    if (changedProps.has('size')) {
      const validSizes = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.size)) {
        devWarn(
          'hx-field',
          `Invalid hx-size value: "${this.size}". Expected "sm" | "md" | "lg". Defaulting to "md".`,
        );
      }
    }

    this._syncA11yDescEl();
    this._syncSlottedControl();
  }

  /** Creates a visually-hidden span in light DOM used as the ARIA description anchor. */
  /** @internal */
  private _ensureA11yDescEl(): void {
    if (this._a11yDescEl) return;
    // Guard for SSR — document is unavailable server-side
    if (typeof document === 'undefined') return;
    const span = document.createElement('span');
    span.id = this._a11yDescId;
    // Visually hidden but present in the accessibility tree
    span.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    this.appendChild(span);
    this._a11yDescEl = span;
  }

  /** Keeps the light-DOM description span in sync with the current error/help text. */
  /** @internal */
  private _syncA11yDescEl(): void {
    if (!this._a11yDescEl) return;
    const hasError = !!this.error || this._hasErrorSlot;
    if (hasError && this.error) {
      this._a11yDescEl.textContent = this.error;
    } else if (this.helpText) {
      this._a11yDescEl.textContent = this.helpText;
    } else {
      this._a11yDescEl.textContent = '';
    }
  }

  /** Tracks the first form control assigned to the default slot. */
  /** @internal */
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements();
    const next = assigned.find(isFormControl) ?? null;
    this._resolveSlottedControl(next);
  }

  /**
   * Adopts a new slotted control and re-syncs ARIA wiring.
   *
   * Ownership of `aria-label` is tracked via the
   * `data-hx-owns-label` marker attribute on the control itself, recomputed
   * on every `_syncSlottedControl()` call — there is no cached ownership
   * flag, so post-mount mutations of `aria-label` and `data-aria-managed`
   * by the consumer are always honored.
   * @internal
   */
  private _resolveSlottedControl(next: HTMLElement | null): void {
    const prev = this._slottedControl;
    if (prev === next) return;

    // If we are leaving a previous control, strip the aria attributes we own
    // so the host doesn't leave stale wiring on a control that is no longer
    // associated. We only remove `aria-label` if hx-field owns it
    // (round-13 F2 — respect consumer overrides).
    if (prev) {
      this._releaseHostOwnedAriaLabel(prev);
      prev.removeAttribute('aria-required');
      prev.removeAttribute('aria-invalid');
      prev.removeAttribute('aria-describedby');
    }

    this._slottedControl = next;
    // Reset the once-per-adoption warning latch so the warning can fire
    // again for the freshly adopted control.
    this._competingLabelWarned = false;
    // Drop the value snapshot from any previous adoption.
    this._lastWrittenAriaLabel = null;

    this._syncSlottedControl();
  }

  /**
   * Returns true if hx-field owns the `aria-label` on the given control —
   * i.e. the host wrote it, the marker attribute is still present, AND the
   * live value still matches the value the host last wrote.
   *
   * Side effect: when the marker is present but the value no longer matches
   * `_lastWrittenAriaLabel`, the consumer has overwritten the host value
   * directly. We release the marker (and reset the snapshot) so subsequent
   * syncs treat the value as consumer-owned. This keeps the marker honest
   * without a MutationObserver.
   *
   * Cross-host migration / pre-mounted marker: if the marker is present but
   * `_lastWrittenAriaLabel === null`, this host has never written to the
   * control. Either (a) the control was migrated from a prior hx-field that
   * stamped the marker, or (b) a consumer pre-mounted the marker themselves.
   * In both cases this host has no ownership claim, so we strip the orphan
   * marker and treat the value as consumer-owned. Without this, a fresh host
   * with `label=""` would silently strip the inherited aria-label.
   *
   * Note (snapshot limitation): if the consumer rewrites `aria-label` to the
   * exact same value we last wrote, we cannot detect the overwrite — to
   * genuinely take ownership in that case the consumer must either write a
   * different value or remove the `data-hx-owns-label` marker themselves.
   *
   * Absence of the marker (or presence of `data-aria-managed`) means the
   * consumer owns the value and hx-field must not touch it.
   * @internal
   */
  private _hostOwnsAriaLabel(control: HTMLElement): boolean {
    if (control.hasAttribute('data-aria-managed')) return false;
    if (!control.hasAttribute(HelixField._ARIA_LABEL_OWNED_ATTR)) return false;
    if (this._lastWrittenAriaLabel === null) {
      // Orphan marker — either migrated from a prior host or pre-mounted by
      // the consumer. This host has no claim; release and defer to consumer.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      return false;
    }
    const liveValue = control.getAttribute('aria-label');
    if (liveValue !== this._lastWrittenAriaLabel) {
      // Consumer rewrote the attribute under us — they are the owner now.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      this._lastWrittenAriaLabel = null;
      return false;
    }
    return true;
  }

  /**
   * Removes the host-owned `aria-label` and its ownership marker if (and only
   * if) hx-field still owns them. Consumer-set values are left untouched.
   * @internal
   */
  private _releaseHostOwnedAriaLabel(control: HTMLElement): void {
    if (this._hostOwnsAriaLabel(control)) {
      control.removeAttribute('aria-label');
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      this._lastWrittenAriaLabel = null;
    }
  }

  /**
   * Focuses the slotted form control when the shadow DOM label is clicked.
   * The shadow `<label>` cannot use `for`/`id` to link to a slotted input
   * across the shadow boundary, so we handle focus programmatically.
   */
  /** @internal */
  private _handleLabelClick(_e: Event): void {
    this._slottedControl?.focus();
  }

  /**
   * Applies ARIA attributes to the slotted form control, bridging the
   * shadow DOM accessibility boundary.
   *
   * - aria-label: associates the field label with the control
   * - aria-required: communicates required state to AT
   * - aria-invalid: communicates error state to AT
   * - aria-describedby: points to the light-DOM description span
   *
   * **Skip conditions:**
   * - `HX-*` elements manage their own ARIA attributes; bridging is skipped.
   * - Elements with `data-aria-managed` attribute opt out of ARIA mutation;
   *   bridging is skipped entirely for those elements.
   *
   * **Round-13 F2 ownership model:** `aria-label` ownership is recomputed
   * from the live DOM on every call. If the marker attribute
   * `data-hx-owns-label` is present, hx-field owns the value and may
   * overwrite or remove it. Otherwise the consumer owns it, and hx-field
   * leaves it alone. This makes post-mount consumer mutations
   * (add/remove/replace) authoritative without relying on a stale flag.
   */
  /** @internal */
  private _syncSlottedControl(): void {
    const control = this._slottedControl;
    if (!control) return;

    // hx-* elements manage their own ARIA attributes; skip bridging for them
    if (control.tagName.startsWith('HX-')) return;

    // Elements that declare data-aria-managed opt out of ARIA mutation
    // entirely — including any host-owned aria-label we may have written
    // before the attribute was added. We do NOT remove a host-owned label
    // here because doing so would silently strip the visible label simply
    // because the consumer toggled the opt-out.
    if (control.hasAttribute('data-aria-managed')) return;

    const hasError = !!this.error || this._hasErrorSlot;
    const hasDesc = !!(this.error || this.helpText || this._hasErrorSlot || this._hasHelpSlot);

    // Label association: aria-label bridges the shadow DOM boundary.
    //
    // Round-13 F2: ownership is decided by the marker on the control, not a
    // cached flag. A consumer-owned value is always left intact.
    const hostOwnsLabel = this._hostOwnsAriaLabel(control);
    const consumerHasLabel = control.hasAttribute('aria-label') && !hostOwnsLabel;

    if (consumerHasLabel) {
      // Consumer owns the value — never touch it.
      if (this.label && !this._hasLabelSlot && !this._competingLabelWarned) {
        // Dev-only: warn once per adoption that the consumer's aria-label
        // takes precedence over the visible `label` prop. Production builds
        // drop this call entirely via the `import.meta.env.DEV` gate inside
        // `devWarn`. The latch (`_competingLabelWarned`) is reset on every
        // adoption in `_resolveSlottedControl()`.
        devWarn(
          'hx-field',
          'Slotted control already has `aria-label`. The consumer override is being respected; the visible `label` prop will not be mirrored to the control. Remove one of the two to silence this warning.',
        );
        this._competingLabelWarned = true;
      }
    } else if (this.label && !this._hasLabelSlot) {
      // Host writes the label and stamps the ownership marker so a future
      // sync can tell its own value apart from a consumer override.
      control.setAttribute('aria-label', this.label);
      control.setAttribute(HelixField._ARIA_LABEL_OWNED_ATTR, 'true');
      this._lastWrittenAriaLabel = this.label;
    } else {
      // No host-supplied label and no consumer label — clean up any prior
      // host-owned value. (If the consumer set one in the meantime, the
      // `consumerHasLabel` branch above handles it.)
      this._releaseHostOwnedAriaLabel(control);
    }

    // Required state
    if (this.required) {
      control.setAttribute('aria-required', 'true');
    } else {
      control.removeAttribute('aria-required');
    }

    // Invalid state
    if (hasError) {
      control.setAttribute('aria-invalid', 'true');
    } else {
      control.removeAttribute('aria-invalid');
    }

    // Description (error or help text) via light-DOM span
    if (hasDesc) {
      control.setAttribute('aria-describedby', this._a11yDescId);
    } else {
      control.removeAttribute('aria-describedby');
    }
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--size-sm': this.size === 'sm',
      'field--size-md': this.size === 'md',
      'field--size-lg': this.size === 'lg',
      'field--layout-inline': this.layout === 'inline',
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label && !this._hasLabelSlot
              ? html`
                  <label part="label" class="field__label" @click=${this._handleLabelClick}>
                    ${this.label}
                    ${this.required
                      ? html`<span
                          part="required-indicator"
                          class="field__required-marker"
                          aria-hidden="true"
                          >*</span
                        >`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <!-- Description -->
        <slot name="description"></slot>

        <!-- Control (default slot) -->
        <div part="control" class="field__control">
          <slot @slotchange=${this._handleDefaultSlotChange}></slot>
        </div>

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div part="error" class="field__error" id=${this._errorId} role="alert">
                  ${this.error}
                </div>
              `
            : nothing}
        </slot>

        <!-- Slotted error live region — ensures slotted error content is announced -->
        <div aria-live="assertive" class="field__error-slot-announcer"></div>

        <!-- Help text (always in DOM so slot detection works; hidden when no help or error is shown) -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-field': HelixField;
  }
}
