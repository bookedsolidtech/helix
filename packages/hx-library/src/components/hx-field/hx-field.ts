import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixFieldStyles } from './hx-field.styles.js';

/** Native form control tag names that can receive ARIA attributes. */
const FORM_CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

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
 * @summary Layout wrapper for label, control, help text, and error message.
 *
 * @tag hx-field
 *
 * @slot - The form control element (native or custom).
 * @slot label - Custom label content (overrides the label property).
 * @slot help - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 * @slot description - Additional descriptive content above the control.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart control - The wrapper around slotted content.
 * @csspart help-text - The help text container.
 * @csspart error-message - The error message container.
 * @csspart required-indicator - The required asterisk span.
 *
 * @cssprop [--hx-field-label-color=var(--hx-color-neutral-700)] - Label color.
 * @cssprop [--hx-field-error-color=var(--hx-color-error-500)] - Error color.
 * @cssprop [--hx-field-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-field-gap=var(--hx-space-1, 0.25rem)] - Gap between field segments.
 * @cssprop [--hx-field-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 */
@customElement('hx-field')
export class HelixField extends LitElement {
  static override styles = [tokenStyles, helixFieldStyles];

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
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Layout variant. 'column' stacks label above control; 'inline' places them side-by-side.
   * @attr layout
   */
  @property({ type: String, reflect: true })
  layout: 'column' | 'inline' = 'column';

  // ─── Slot Tracking ───

  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;
  @state() private _hasHelpSlot = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
  }

  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedElements().length > 0;
  }

  // ─── Unique IDs for Accessibility ───

  private _fieldId = `hx-field-${crypto.randomUUID().slice(0, 8)}`;
  private _helpTextId = `${this._fieldId}-help`;
  private _errorId = `${this._fieldId}-error`;
  private _a11yDescId = `${this._fieldId}-desc`;

  // ─── A11y: Slotted control tracking + light-DOM description element ───

  /**
   * The first form control in the default slot. We set aria attributes on this
   * element to bridge the shadow DOM accessibility boundary.
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
   */
  private _a11yDescEl: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._ensureA11yDescEl();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._a11yDescEl?.remove();
    this._a11yDescEl = null;
    // Remove aria attributes we set on the slotted control
    if (this._slottedControl) {
      this._slottedControl.removeAttribute('aria-label');
      this._slottedControl.removeAttribute('aria-required');
      this._slottedControl.removeAttribute('aria-invalid');
      this._slottedControl.removeAttribute('aria-describedby');
      this._slottedControl = null;
    }
  }

  override updated(changedProps: Map<string, unknown>): void {
    super.updated(changedProps);

    // P2-01: Warn on invalid hxSize values
    if (changedProps.has('hxSize')) {
      const validSizes = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.hxSize)) {
        console.warn(
          `[hx-field] Invalid hx-size value: "${this.hxSize}". Expected "sm" | "md" | "lg". Defaulting to "md".`,
        );
      }
    }

    this._syncA11yDescEl();
    this._syncSlottedControl();
  }

  /** Creates a visually-hidden span in light DOM used as the ARIA description anchor. */
  private _ensureA11yDescEl(): void {
    if (this._a11yDescEl) return;
    const span = document.createElement('span');
    span.id = this._a11yDescId;
    // Visually hidden but present in the accessibility tree
    span.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    this.appendChild(span);
    this._a11yDescEl = span;
  }

  /** Keeps the light-DOM description span in sync with the current error/help text. */
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
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements();
    this._slottedControl = assigned.find(isFormControl) ?? null;
    this._syncSlottedControl();
  }

  /**
   * Focuses the slotted form control when the shadow DOM label is clicked.
   * The shadow `<label>` cannot use `for`/`id` to link to a slotted input
   * across the shadow boundary, so we handle focus programmatically.
   */
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
   */
  private _syncSlottedControl(): void {
    const control = this._slottedControl;
    if (!control) return;

    // hx-* elements manage their own ARIA attributes; skip bridging for them
    if (control.tagName.startsWith('HX-')) return;

    // Elements that declare data-aria-managed opt out of ARIA mutation
    if (control.hasAttribute('data-aria-managed')) return;

    const hasError = !!this.error || this._hasErrorSlot;
    const hasDesc = !!(this.error || this.helpText || this._hasErrorSlot || this._hasHelpSlot);

    // Label association: aria-label bridges the shadow DOM boundary
    if (this.label && !this._hasLabelSlot) {
      control.setAttribute('aria-label', this.label);
    } else {
      control.removeAttribute('aria-label');
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
      'field--size-sm': this.hxSize === 'sm',
      'field--size-md': this.hxSize === 'md',
      'field--size-lg': this.hxSize === 'lg',
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
                <div part="error-message" class="field__error" id=${this._errorId} role="alert">
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
          <slot name="help" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
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
