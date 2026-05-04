import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixCheckboxStyles } from './hx-checkbox.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import { resolveIdrefTokens, supportsIdrefElementReferences } from '../../utils/aria-idref.js';

// P2-05: monotonic counter — collision-free, deterministic, SSR-safe
const _nextCheckboxId = createIdCounter('hx-checkbox');

/** Detail for the hx-change event dispatched by hx-checkbox. */
export interface HxCheckboxChangeDetail {
  checked: boolean;
  value: string;
}

/**
 * A checkbox component with label, validation, and form association.
 *
 * @summary Form-associated checkbox with built-in label, error, and help text.
 *
 * @tag hx-checkbox
 *
 * @slot - Custom label content (overrides the label property). Rich HTML allowed — Drupal can include links in consent labels.
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the checkbox is toggled. Boolean-selection controls (`hx-switch`, `hx-checkbox`) include both `checked` (boolean state) and `value` (form value) in the detail; text-value controls (`hx-text-input`, `hx-combobox`, `hx-select`) emit only `{value}`.
 *
 * @csspart checkbox - The visual checkbox element.
 * @csspart checkmark - The SVG checkmark icon inside the checkbox.
 * @csspart label - The label element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 * @csspart control - The wrapper around checkbox and label.
 *
 * @cssprop [--hx-checkbox-size=var(--hx-size-5, 1.25rem)] - Checkbox dimensions.
 * @cssprop [--hx-checkbox-bg=var(--hx-color-neutral-0, #ffffff)] - Unchecked background color.
 * @cssprop [--hx-checkbox-border-color=var(--hx-color-neutral-300, #B6BFB9)] - Checkbox border color.
 * @cssprop [--hx-checkbox-border-radius=var(--hx-border-radius-sm, 0.25rem)] - Checkbox border radius.
 * @cssprop [--hx-checkbox-checked-bg=var(--hx-color-primary-500, #429797)] - Checked background color.
 * @cssprop [--hx-checkbox-checked-border-color=var(--hx-color-primary-500, #429797)] - Checked border color.
 * @cssprop [--hx-checkbox-checkmark-color=var(--hx-color-neutral-0, #ffffff)] - Checkmark color.
 * @cssprop [--hx-checkbox-focus-ring-color=var(--hx-focus-ring-color, #6AB1B1)] - Focus ring color.
 * @cssprop [--hx-checkbox-label-color=var(--hx-color-neutral-700, #313E4B)] - Label text color.
 * @cssprop [--hx-checkbox-help-text-color=var(--hx-color-neutral-500, #66787B)] - Help text color.
 * @cssprop [--hx-checkbox-hover-border-color=var(--hx-checkbox-border-color)] - Border color on hover.
 * @cssprop [--hx-checkbox-error-color=var(--hx-color-error-500, #E5493E)] - Error state color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-checkbox-font-family=var(--hx-font-family-sans)] - Font family for checkbox label and help text.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-size-5] - Size token.
 * @cssprop [--hx-border-width-medium] - Width.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-space-px] - Spacing token.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-filter-brightness-hover] - CSS filter.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-size-4] - Size token.
 * @cssprop [--hx-size-6] - Size token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-error-500] - Color.
 */
@customElement('hx-checkbox')
export class HelixCheckbox extends mixinDelegatesAria(FormMixin(HelixElement)) {
  static override styles = [helixCheckboxStyles, forcedColorsField];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * Whether the checkbox is checked.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns).
   * @attr indeterminate
   */
  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  /**
   * Whether the checkbox is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the checkbox is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * The name of the checkbox, used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The value submitted when the checkbox is checked.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = 'on';

  /**
   * The visible label text for the checkbox.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Error message to display. When set, the checkbox enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the checkbox for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Validation message shown when the field is required but empty.
   * @attr required-message
   */
  @property({ attribute: 'required-message' })
  requiredMessage = 'This field is required.';

  /**
   * The size of the checkbox.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible label for the checkbox when no visible label text is provided.
   * Use when embedding a checkbox in a context where a label element is not practical.
   *
   * Accepts both `accessible-label` and the standard `aria-label` HTML attribute.
   * `accessible-label` takes precedence when both are set.
   * When set, replaces the visible label as the input's accessible name. Cannot be combined
   * with a visible label — set either `accessible-label` or the `label` slot, not both.
   *
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string = '';

  /**
   * Returns the effective label for the checkbox, checking accessible-label first,
   * then the aria-label attribute, falling back to empty string.
   * @internal
   */
  private get _effectiveLabel(): string {
    return this.accessibleLabel?.trim() || this.ariaLabel?.trim() || '';
  }

  /** @internal */
  @query('.checkbox__input')
  private _inputEl: HTMLInputElement | undefined;

  /** @internal */
  @state() private _hasErrorSlot = false;

  /** @internal */
  @state() private _hasHelpTextSlot = false;

  /** @internal */
  @state() private _hasLabelSlot = false;

  /**
   * Deferred copy of this.error used inside the live region. Injected after
   * the region is visible (via requestAnimationFrame) so screen readers
   * re-announce the message even if it was set before the region became
   * visible — see WCAG 4.1.3.
   * @internal
   */
  @state() private _announcedError = '';

  /** @internal */
  private _hasWarnedLabelConflict = false;

  // ─── Slot Handlers ───

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleHelpTextSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpTextSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    // Default slot may include the fallback `${this.label}` text node — count
    // assigned (not flattened) nodes so the slot fallback is not mistaken for
    // user-supplied content. The visible label is independently tracked via
    // the `label` property below.
    this._hasLabelSlot = slot.assignedNodes().length > 0;
  }

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
    }

    // Host-elevated ARIA semantics. The checkbox role lives on the host so that
    // consumer-supplied `aria-label`/`aria-labelledby`/`aria-describedby` on
    // `<hx-checkbox>` resolve in light DOM and reach the announced control.
    // Without this, the semantic surface is the inner shadow `<input>` which
    // cannot see light-DOM IDREF targets across the shadow boundary.
    this._syncHostAriaSemantics();
    // Warn when accessible-label is set alongside a visible label — they are mutually exclusive.
    // Checked unconditionally (not gated on changedProperties) because ariaLabel is provided by
    // mixinDelegatesAria via Object.defineProperty and never appears in changedProperties.
    {
      const hasAccessibleLabel = !!(this.accessibleLabel?.trim() || this.ariaLabel?.trim());
      const hasVisibleLabel =
        !!this.label ||
        (this.shadowRoot
          ?.querySelector<HTMLSlotElement>('.checkbox__label slot')
          ?.assignedNodes({ flatten: true }).length ?? 0) > 0;
      if (hasAccessibleLabel && hasVisibleLabel && !this._hasWarnedLabelConflict) {
        this._hasWarnedLabelConflict = true;
        devWarn(
          'hx-checkbox',
          'accessible-label is set alongside a visible label. Use either accessible-label or the label slot, not both.',
        );
      } else if (!hasAccessibleLabel || !hasVisibleLabel) {
        this._hasWarnedLabelConflict = false;
      }
    }
    // WCAG 4.1.3: Keep _announcedError in sync with the error property.
    // When error changes from one non-empty value to another, clear the live region
    // first then re-inject after a rAF tick so screen readers re-announce the updated
    // message (clearing content before the region is re-populated triggers a new event).
    // When transitioning from empty to non-empty (initial display), set directly so
    // the text is immediately available for synchronous DOM assertions.
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string;
      if (previousError && this.error) {
        // Changing from one error message to another: defer to trigger re-announcement.
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        // Transitioning from empty→error or error→empty: set directly.
        this._announcedError = this.error;
      }
    }
  }

  // ─── Form Integration ───

  /** Returns the associated form element, if any. */
  override get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** Returns the validation message. */
  override get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Returns the ValidityState object. */
  override get validity(): ValidityState {
    return this._internals.validity;
  }

  /** @internal */
  _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        this._inputEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // ─── Form Lifecycle Hooks ───

  protected override _onFormReset(): void {
    this.checked = false;
    this.indeterminate = false;
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    this.checked = typeof state === 'string' && state === this.value;
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleChange(): void {
    if (this.disabled) return;

    this.indeterminate = false;
    this.checked = !this.checked;

    this._internals.setFormValue(this.checked ? this.value : null);
    this._handleInteractionInput();

    /**
     * Dispatched when the checkbox is toggled.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent<{ checked: boolean; value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this._handleChange();
    }
  }

  // ─── Public Methods ───

  /** Moves focus to the checkbox input element. */
  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  // ─── Host ARIA Semantics (ElementInternals) ───

  /**
   * Mirrors checkbox semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-checkbox>` reach the announced control. Without this, those
   * attributes — intercepted by `mixinDelegatesAria` and stored on the host —
   * would not propagate through to the inner shadow `<input>`.
   *
   * Codex finding (aria-delegation, severity high): the announced semantic
   * node was the inner `<input>` and the host's labelled-by tokens could not
   * cross the shadow boundary.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'checkbox';
    internals.ariaChecked = this.indeterminate ? 'mixed' : this.checked ? 'true' : 'false';
    internals.ariaRequired = this.required ? 'true' : 'false';
    // Drive aria-invalid from validity state, not from visible error content.
    // A required-but-unchecked checkbox sets `valueMissing` via setValidity()
    // but may render no visible error yet — assistive tech still needs to hear
    // the invalid state.
    internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';

    const hostLabel = this._effectiveLabel;
    internals.ariaLabel = hostLabel || null;

    // Resolve consumer-supplied IDREF tokens (stored as data-aria-* by
    // mixinDelegatesAria) against the host's root node, then merge with
    // shadow-internal label/help/error elements via the IDL element-references
    // API. Element references work cross-shadow in a way that ID strings on
    // the host cannot.
    if (supportsIdrefElementReferences(internals)) {
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;

      const externalLabelTokens = this.getAttribute('data-aria-labelledby');
      const externalDescTokens = this.getAttribute('data-aria-describedby');

      const labelEls = resolveIdrefTokens(this, externalLabelTokens);
      // Append the internal label element when the visible label has content
      // and no external labelling source already names the host.
      const internalLabel = this.shadowRoot?.getElementById(this._labelId);
      const hasVisibleLabel = !!this.label || this._hasLabelSlot;
      if (labelEls.length === 0 && !hostLabel && hasVisibleLabel && internalLabel) {
        labelEls.push(internalLabel);
      }
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;

      const descEls = resolveIdrefTokens(this, externalDescTokens);
      // Help-text-first ordering: guidance precedes validation feedback.
      const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
      const errorEl = this.shadowRoot?.getElementById(this._errorId);
      if (helpEl && (this.helpText || this._hasHelpTextSlot)) {
        descEls.push(helpEl);
      }
      if (errorEl && (this.error || this._hasErrorSlot)) {
        descEls.push(errorEl);
      }
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
    }
  }

  // ─── Render ───

  // P2-05: monotonic counter — collision-free and deterministic
  /** @internal */
  private _id = _nextCheckboxId();
  /** @internal */
  private _helpTextId = `${this._id}-help`;
  /** @internal */
  private _errorId = `${this._id}-error`;
  /** @internal */
  private _labelId = `${this._id}-label`;

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelpText = !!this.helpText || this._hasHelpTextSlot;
    const hasVisibleLabel = !!this.label || this._hasLabelSlot;
    // Drive aria-invalid from the same validity source used by setValidity()
    // so a required-unchecked checkbox is announced as invalid even before any
    // visible error content has rendered.
    const isInvalid = hasError || (this.required && !this.checked);

    const containerClasses = {
      checkbox: true,
      'checkbox--checked': this.checked,
      'checkbox--indeterminate': this.indeterminate,
      'checkbox--error': hasError,
      'checkbox--disabled': this.disabled,
      'checkbox--required': this.required,
      'checkbox--sm': this.size === 'sm',
      'checkbox--md': this.size === 'md',
      'checkbox--lg': this.size === 'lg',
    };

    // describedBy chain: help-text first, error appended (assistive tech reads
    // guidance before validation feedback). Both ids are persistent in the
    // shadow tree so this list is stable across content transitions.
    const describedBy =
      [hasHelpText ? this._helpTextId : null, hasError ? this._errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const hostAriaLabel = this._effectiveLabel || undefined;
    // Only point the inner input at `_labelId` when there is actual visible
    // label content; otherwise the input would reference an empty container.
    const useInternalLabelId = !hostAriaLabel && hasVisibleLabel;

    return html`
      <div class=${classMap(containerClasses)}>
        <label part="control" class="checkbox__control" @click=${this._handleChange}>
          <input
            class="checkbox__input"
            type="checkbox"
            id=${this._id}
            .checked=${live(this.checked)}
            .indeterminate=${live(this.indeterminate)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            name=${ifDefined(this.name || undefined)}
            .value=${this.value}
            aria-checked=${this.indeterminate ? 'mixed' : nothing}
            aria-invalid=${isInvalid ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-label=${ifDefined(hostAriaLabel)}
            aria-labelledby=${ifDefined(useInternalLabelId ? this._labelId : undefined)}
            @keydown=${this._handleKeyDown}
            @click=${(e: Event) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            @change=${(e: Event) => e.stopPropagation()}
          />

          <span part="checkbox" class="checkbox__box">
            <svg
              part="checkmark"
              class="checkbox__icon checkbox__icon--check"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <polyline points="3.5 8 6.5 11 12.5 5"></polyline>
            </svg>
            <svg
              class="checkbox__icon checkbox__icon--indeterminate"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <line x1="4" y1="8" x2="12" y2="8"></line>
            </svg>
          </span>

          <span part="label" class="checkbox__label" id=${this._labelId}>
            <slot @slotchange=${this._handleLabelSlotChange}>${this.label}</slot>
            ${this.required
              ? html`<span class="checkbox__required-marker" aria-hidden="true">*</span>`
              : nothing}
          </span>
        </label>

        <!--
          P0-01: wrapper div always owns _errorId so aria-describedby works
          regardless of whether error content comes from the .error property
          or the named slot. role="status" replaces aria-live="polite" to
          avoid conflicting live-region semantics.
        -->
        <div
          part="error"
          class="checkbox__error"
          id=${this._errorId}
          role="status"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this._handleErrorSlotChange}>
            ${this._announcedError}
          </slot>
        </div>

        <!--
          Persistent help-text container. Rendered whenever the property OR
          the slot has content, hidden when an error is present so guidance
          does not compete with validation feedback. Always present in the
          shadow tree so the host's aria-describedby chain remains stable.
        -->
        <div
          part="help-text"
          class="checkbox__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelpText || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpTextSlotChange}
            >${this.helpText}</slot
          >
        </div>
      </div>
    `;
  }
}

/** Canonical type alias for the hx-checkbox component. */
export type HxCheckbox = HelixCheckbox;

/**
 * Per-component event map for type-safe addEventListener on hx-checkbox.
 * The `hx-change` detail always includes both `checked` and `value` for this component.
 */
export interface HxCheckboxEventMap {
  'hx-change': CustomEvent<{ checked: boolean; value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-checkbox': HelixCheckbox;
  }
  /**
   * Global hx-change event type. The detail shape is a union because hx-change is dispatched
   * by multiple components: form-field components (value only) and toggle components
   * (checked + value). Use per-component EventMap types (e.g. HxCheckboxEventMap) for
   * narrowed addEventListener calls.
   */
  interface HTMLElementEventMap {
    'hx-change': CustomEvent<{ value: string } | { checked: boolean; value: string }>;
  }
}
