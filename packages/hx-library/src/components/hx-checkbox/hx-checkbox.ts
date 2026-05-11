import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import '../hx-icon/hx-icon.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixCheckboxStyles } from './hx-checkbox.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

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
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-checkbox/AAA-AUDIT.md
 * @keyboard-contract activate=Space; disabled-suppresses=true
 * @aria-pattern checkbox
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.6.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-checkbox
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
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
    return (
      this.accessibleLabel?.trim() ||
      this.getAttribute('data-aria-label')?.trim() ||
      this.getAttribute('aria-label')?.trim() ||
      ''
    );
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
   * Set by `hx-checkbox-group` to mark this child as group-managed. While
   * truthy, `_updateFormValue()` short-circuits to `setFormValue(null)`
   * regardless of `name`, so the child does NOT participate in form submission
   * — only the group does. This is durable against post-attach mutations to
   * `cb.name` by consumers/frameworks (which would otherwise re-arm
   * `_updateFormValue()` via the `name` setter and cause double-submission).
   * Codex round-3 finding #1.
   *
   * Public via accessor for the group's exclusive use; the underscore prefix
   * marks it as group-internal (not consumer API). The group sets it during
   * `slotchange` and clears it (via the same setter) when a child is removed.
   * @internal
   */
  set _groupedSuppress(value: boolean) {
    if (this.__groupedSuppress === value) return;
    this.__groupedSuppress = value;
    // Re-run form-value sync so the suppression takes effect immediately.
    this._updateFormValue();
  }
  get _groupedSuppress(): boolean {
    return this.__groupedSuppress;
  }
  /** @internal */
  private __groupedSuppress = false;

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

  /**
   * Handle for the shared IDREF observer. Installed in `connectedCallback()`
   * so late-mutated `aria-labelledby`/`aria-describedby` and late-inserted
   * IDREF targets are picked up. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

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

  override connectedCallback(): void {
    super.connectedCallback();
    // Detect platform support for IDL element references. Cached as reactive
    // state so the render-time branch is consistent across update cycles and
    // tests can stub it deterministically. Codex round-2 finding #2.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Seed root-independent semantics so the host carries the checkbox role
    // and reactive ARIA state from the moment of connection — before the
    // first paint. This closes the gap where AT scanning between connect
    // and `firstUpdated()` would see an unannounced surface.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #1: host is the canonical announced surface on
    // modern browsers, so the inner `<input>` is demoted via
    // `aria-hidden + tabindex=-1` and the host owns tab order.
    //
    // Codex round-2 finding #2: on no-IDL-ref browsers the inner `<input>`
    // is the only surface AT can reach, so the host is demoted to
    // `tabindex=-1` and the inner input owns tab order. Without this,
    // `aria-labelledby`/`aria-describedby` on the inner input were inert
    // (the input was `aria-hidden`), leaving the control unnamed.
    // Codex round-14 P2: only claim ownership of `tabindex` when no consumer
    // value is present. Consumers using roving-tabindex toolbar patterns
    // must be able to set `tabindex="-1"` on the host without it being
    // clobbered on every disabled flip. Note we still claim ownership when
    // disabled — the initial value is `-1` to keep the host out of tab order
    // and `updated()` re-asserts the appropriate value when disabled flips.
    if (!this.hasAttribute('tabindex')) {
      this._internalTabindexManaged = true;
      const enabledTabIndex = this._supportsIdrefRefs ? '0' : '-1';
      this.setAttribute('tabindex', this.disabled ? '-1' : enabledTabIndex);
    }
    this.addEventListener('keydown', this._handleHostKeyDown);
    this.addEventListener('click', this._handleHostClick);
    // Install the shared IDREF observer once the host is in a tree. The
    // observer covers consumer mutations to `aria-labelledby`/`-describedby`
    // (or their `data-aria-*` mirrors), late-inserted IDREF targets, and
    // `id` renames in the host's resolved root.
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleHostKeyDown);
    this.removeEventListener('click', this._handleHostClick);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  /**
   * Host-level keydown handler. Space toggles per ARIA APG checkbox pattern
   * — but only on the modern path where the host is the announced focus
   * surface. On the no-IDL-ref fallback (round-2 finding #2), the inner
   * `<input>` owns focus + native Space activation, so the host stays out
   * of the activation pipeline to avoid double-toggle.
   * @internal
   */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    // Only handle when the host itself is the focus target — events from
    // slotted/nested controls bubble through here too.
    if (e.target !== this) return;
    if (e.key === ' ') {
      e.preventDefault();
      this._handleChange();
    }
  };

  /**
   * Host-level click handler. Routes clicks on the host (e.g. via assistive
   * tech activation) to the change handler — only on the modern path. On the
   * fallback path the inner input is the announced surface and natively
   * receives clicks/AT activation.
   * @internal
   */
  private _handleHostClick = (e: MouseEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    // Only respond to clicks that originated on the host itself. Bubbled
    // events from inner shadow elements (which toggle through the existing
    // label/input change handler) are skipped to avoid double-activation.
    const path = e.composedPath();
    if (path[0] !== this) return;
    this._handleChange();
  };

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('checked') ||
      changedProperties.has('value') ||
      changedProperties.has('name')
    ) {
      this._updateFormValue();
    }

    // Codex round-1 finding #1: keep host focusability in sync with disabled
    // state. Disabled custom elements should not be in tab order.
    // Codex round-2 finding #2: on no-IDL-ref browsers the host is demoted
    // to `tabindex=-1` so the inner input remains the announced surface.
    // Codex round-14 P2: only re-assert when the component owns tabindex.
    // Consumer-managed values (e.g. roving-tabindex toolbar with `-1`) must
    // not be overwritten on disabled flips or supports-flag transitions.
    if (
      changedProperties.has('disabled') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_supportsIdrefRefs')
    ) {
      if (this._internalTabindexManaged) {
        if (this.disabled) {
          this.setAttribute('tabindex', '-1');
        } else {
          this.setAttribute('tabindex', this._supportsIdrefRefs ? '0' : '-1');
        }
      }
    }

    // Re-resolve element references against the (possibly mutated) shadow
    // tree. `_syncHostAriaSemantics()` is also invoked from `_updateValidity()`
    // and by the IDREF mirror observer, so this keeps property-driven changes
    // current without depending on observer scheduling.
    this._syncHostAriaSemantics();
    // Warn when accessible-label is set alongside a visible label — they are mutually exclusive.
    // Checked unconditionally (not gated on changedProperties) because aria-label is supplied
    // via data-aria-label by mixinDelegatesAria and never appears in changedProperties.
    {
      const hasAccessibleLabel = !!(
        this.accessibleLabel?.trim() ||
        this.getAttribute('data-aria-label')?.trim() ||
        this.getAttribute('aria-label')?.trim()
      );
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
      // Codex round-17 P2: anchor validity UI to the announced surface. On
      // the modern path the host is the canonical announced/focus surface
      // (the inner input is `aria-hidden + tabindex=-1`), so reportValidity()
      // would otherwise focus a hidden node. On the fallback path the inner
      // input is the announced surface.
      const anchor: HTMLElement | undefined = this._supportsIdrefRefs
        ? this
        : (this._inputEl ?? undefined);
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        anchor,
      );
    } else {
      this._internals.setValidity({});
    }
    // Sync host ARIA semantics immediately after every setValidity() call so
    // `internals.ariaInvalid` reflects the current `ValidityState` rather than
    // the previous render cycle's snapshot. Codex round-1 finding #6.
    this._syncHostAriaSemantics();
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

  /**
   * Writes the checkbox value to ElementInternals' form value. Suppressed when
   * the checkbox is grouped — `hx-checkbox-group` flips `_groupedSuppress` on
   * children so the group is the sole form participant.
   *
   * Codex round-3 finding #1: round-2 used `cb.name = ''` as the suppression
   * signal, but a consumer (or framework binding) that re-set `cb.name = 'foo'`
   * after attach regained form participation through the `name` setter. The
   * `_groupedSuppress` flag is a durable, name-independent kill switch.
   * Stand-alone checkboxes (no parent group) are unaffected.
   * @internal
   */
  private _updateFormValue(): void {
    if (this.__groupedSuppress || !this.name) {
      this._internals.setFormValue(null);
      return;
    }
    this._internals.setFormValue(this.checked ? this.value : null);
  }

  /** @internal */
  private _handleChange(): void {
    if (this.disabled) return;

    this.indeterminate = false;
    this.checked = !this.checked;

    this._updateFormValue();
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

    // Codex round-12 P2 (parity with hx-switch / hx-toggle-button): on the
    // modern path the host owns role="checkbox" and tabindex=0; the inner
    // `<input>` is aria-hidden and tabindex=-1. Clicking the surrounding
    // `<label>` still routes activation to the input via native label-forward,
    // which focuses the input. Move focus to the host so the announced
    // surface is also the focus target.
    if (this._supportsIdrefRefs) {
      this.focus();
    }
  }

  /**
   * Handles native `change` events from the inner `<input type=checkbox>` on
   * the no-IDL-ref fallback path. On that path the inner input is the
   * announced surface (no `aria-hidden`, `tabindex=0`) and AT activates it
   * directly — pointer/keyboard activation flips `input.checked` natively.
   * We mirror the input's state onto the host, dispatch `hx-change`, and
   * update form participation.
   *
   * Codex round-3 finding #2: round-2 left the inner input click suppressed
   * on both paths, so on no-IDL-ref browsers AT activation could not toggle
   * the control. The fix is to NOT suppress click on the fallback path and
   * to honor the resulting `change` event here.
   * @internal
   */
  private _handleInternalChange = (e: Event): void => {
    e.stopPropagation();
    if (this.disabled) return;
    const input = e.currentTarget as HTMLInputElement;
    // The native input flipped its own state; mirror onto the host. Avoid
    // re-toggling — `_handleChange()` toggles `this.checked = !this.checked`,
    // which would invert the user's actual choice.
    this.indeterminate = false;
    this.checked = input.checked;

    this._updateFormValue();
    this._handleInteractionInput();

    this.dispatchEvent(
      new CustomEvent<{ checked: boolean; value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  };

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this._handleChange();
    }
  }

  /**
   * Stable inner-input click suppressor for the modern (announced-host) path.
   * Hoisted to a class field so Lit sees a stable listener identity across
   * renders; previously inline arrows were re-allocated each render and
   * caused listener detach/re-attach churn (codex round-4 F3 — performance).
   * @internal
   */
  private _suppressInnerClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Stable inner-input change suppressor for the modern (announced-host) path.
   * Mirrors the click suppressor above — stable identity across renders so
   * Lit's event-listener cache keeps a single registration (codex round-4 F3).
   * @internal
   */
  private _suppressInnerChange = (e: Event): void => {
    e.stopPropagation();
  };

  // ─── Public Methods ───

  /**
   * Moves focus to the announced checkbox surface. Codex round-1 finding #1
   * relocated the focus target from the inner `<input>` to the host on
   * modern engines so AT only sees one announced widget. Round-7 finding #3
   * extends that contract to the no-IDL-ref fallback: when the host is
   * demoted (`tabindex=-1`, role/state cleared on `internals`) the inner
   * `<input>` owns the announced semantics and tab order, so programmatic
   * `focus()` must redirect there — otherwise scripted focus and error
   * recovery land on the demoted host on unsupported engines.
   */
  override focus(options?: FocusOptions): void {
    if (this._supportsIdrefRefs) {
      super.focus(options);
      return;
    }
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
    const hostLabel = this._effectiveLabel;

    // Codex round-2 finding #2: branch on platform support for IDL element
    // references. On modern browsers the host is the canonical announced
    // surface and carries all checkbox semantics via ElementInternals. On
    // older browsers the inner `<input>` is the announced surface, so the
    // host's role/state are cleared and the consumer-supplied IDREFs are
    // mirrored to the inner input via render-time fallback state.
    if (this._supportsIdrefRefs) {
      // ─── Modern path: host is the announced surface ───
      internals.role = 'checkbox';
      internals.ariaChecked = this.indeterminate ? 'mixed' : this.checked ? 'true' : 'false';
      internals.ariaRequired = this.required ? 'true' : 'false';
      // Drive aria-invalid from validity state, not from visible error content.
      // A required-but-unchecked checkbox sets `valueMissing` via setValidity()
      // but may render no visible error yet — assistive tech still needs to hear
      // the invalid state.
      internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
      internals.ariaDisabled = this.disabled ? 'true' : 'false';
      internals.ariaLabel = hostLabel || null;

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
      // Codex round-13 P2: while an error is active, drop help text from the
      // described-by chain. The visible help node is suppressed in the render
      // tree, but referenced descriptions are announced even when their nodes
      // are hidden — leaving help in the chain would have AT read stale
      // guidance before the validation error. Otherwise help precedes error so
      // guidance reads before validation feedback when only one is shown.
      const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
      const errorEl = this.shadowRoot?.getElementById(this._errorId);
      const hasError = !!(this.error || this._hasErrorSlot);
      if (helpEl && (this.helpText || this._hasHelpTextSlot) && !hasError) {
        descEls.push(helpEl);
      }
      if (errorEl && hasError) {
        descEls.push(errorEl);
      }
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
      // Clear fallbacks — IDL refs path is the canonical surface.
      this._fallbackAriaLabelledBy = null;
      this._fallbackAriaDescribedBy = null;
    } else {
      // ─── Fallback path: inner <input> is the announced surface ───
      // Codex round-2 finding #2: in round-1 we set host role/state via
      // ElementInternals AND mirrored aria-labelledby/describedby onto the
      // inner input. But the inner input was kept `aria-hidden`, making the
      // mirrored attributes inert — the control had no accessible name on
      // older browsers. The fix is to demote the host (clear its role/state
      // on internals so AT does not double-announce) and let the inner native
      // `<input type=checkbox>` be the announced surface, with consumer
      // IDREFs mirrored as real `aria-*` attributes that resolve through the
      // shadow root for shadow-internal IDs (cross-boundary IDREFs remain
      // unreachable on these engines — same baseline as the pre-fix code).
      internals.role = null;
      internals.ariaChecked = null;
      internals.ariaRequired = null;
      internals.ariaInvalid = null;
      internals.ariaDisabled = null;
      internals.ariaLabel = null;

      const externalLabelTokens = this.getAttribute('data-aria-labelledby');
      const externalDescTokens = this.getAttribute('data-aria-describedby');
      this._fallbackAriaLabelledBy = externalLabelTokens || null;
      this._fallbackAriaDescribedBy = externalDescTokens || null;
    }
  }

  /**
   * Fallback `aria-labelledby` token list applied to the inner input on
   * browsers that lack IDL element references. Tracked as a reactive state
   * so the value flows through the next `render()` call.
   * @internal
   */
  @state() private _fallbackAriaLabelledBy: string | null = null;

  /**
   * Fallback `aria-describedby` token list applied to the inner input on
   * browsers that lack IDL element references.
   * @internal
   */
  @state() private _fallbackAriaDescribedBy: string | null = null;

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between the modern path (host is the
   * announced surface, inner input is `aria-hidden + tabindex=-1`) and the
   * fallback path (inner input is the announced surface, host is demoted).
   *
   * Round-2 finding #2: the previous fallback mirrored `aria-labelledby` /
   * `aria-describedby` onto an `aria-hidden` inner input, leaving older
   * browsers with no accessible name. The fallback now keeps the inner input
   * in the a11y tree so AT can name and activate it natively.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /**
   * Tracks whether the host's `tabindex` is managed by the component itself
   * (vs. set explicitly by a consumer). Codex round-14 P2: a consumer-supplied
   * `tabindex` (e.g. roving-tabindex toolbar pattern with `tabindex="-1"`)
   * must survive disabled flips and re-renders. Only re-assert tabindex in
   * `updated()` when the component originally claimed it.
   * @internal
   */
  private _internalTabindexManaged = false;

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

    // describedBy chain: while an error is active, the visible help text is
    // suppressed in the rendered tree, so we must also drop it from the
    // described-by chain — referenced descriptions are announced even when
    // their nodes are hidden, and announcing stale guidance before the
    // validation error confuses screen-reader users (codex round-13 P2).
    // Otherwise help-text precedes error in the chain so guidance is read
    // before validation feedback when only one is shown.
    const describedBy =
      [hasError ? null : hasHelpText ? this._helpTextId : null, hasError ? this._errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const hostAriaLabel = this._effectiveLabel || undefined;
    // Only point the inner input at `_labelId` when there is actual visible
    // label content; otherwise the input would reference an empty container.
    const useInternalLabelId = !hostAriaLabel && hasVisibleLabel;

    // Codex round-1 finding #7: on no-IDL-ref browsers, mirror consumer
    // tokens (stored as `data-aria-*`) onto the inner input so cross-shadow
    // labelling still resolves for shadow-internal IDs. The render fallbacks
    // are tracked as reactive state from `_syncHostAriaSemantics()`.
    const fallbackLabelledBy = this._fallbackAriaLabelledBy;
    const fallbackDescribedBy = this._fallbackAriaDescribedBy;

    // Merge internal describedBy chain with consumer fallback tokens.
    const innerDescribedBy =
      [describedBy ?? null, fallbackDescribedBy].filter(Boolean).join(' ') || undefined;
    // For labelledby, prefer consumer fallback tokens; otherwise keep the
    // internal label association.
    const innerLabelledBy = fallbackLabelledBy ?? (useInternalLabelId ? this._labelId : undefined);

    // Codex round-2 finding #2: branch the inner input on platform support.
    // Modern path — host is announced, inner input is `aria-hidden + tabindex=-1`.
    // Fallback path — inner input is announced (NO aria-hidden, tabindex=0)
    // so consumer-mirrored aria-labelledby/describedby actually resolve to a
    // visible accessibility-tree node. The inner input keeps its own click
    // suppressor because the visible activation surface is the surrounding
    // `<label>`; the input's native click activation is wired through that.
    const innerIsAnnounced = !this._supportsIdrefRefs;
    const innerTabIndex = innerIsAnnounced && !this.disabled ? '0' : '-1';

    // Codex round-3 finding #2: branch the inner input event model on
    // platform support.
    //
    // Modern path (`innerIsAnnounced === false`): the inner input is
    // `aria-hidden + tabindex=-1` — AT cannot reach it. Pointer clicks on the
    // inner input bubble through the surrounding `<label>` whose `@click`
    // handler runs `_handleChange()`. The inner click handler suppresses the
    // native click so the label's click is the sole activation pipeline,
    // avoiding double-toggle. Native `change` is also swallowed.
    //
    // Fallback path (`innerIsAnnounced === true`): the inner input IS the
    // announced surface (no `aria-hidden`, `tabindex=0`). AT activation lands
    // directly on the input and must produce a real toggle. We do NOT
    // suppress click; instead we wire `@change=${_handleInternalChange}` so
    // the host mirrors the input's state, fires `hx-change`, and updates
    // form participation. The label's `@click` is a no-op on this path —
    // pointer clicks on the label bubble to the input which toggles natively.
    // Codex round-4 F3 (performance): handlers are class-field arrows with
    // stable identity, so Lit's event-listener cache keeps a single
    // registration across re-renders instead of detach/re-attach churn.
    const innerClickHandler = innerIsAnnounced ? undefined : this._suppressInnerClick;
    const innerChangeHandler = innerIsAnnounced
      ? this._handleInternalChange
      : this._suppressInnerChange;
    const labelClickHandler = innerIsAnnounced ? undefined : this._handleChange;
    // On the fallback path the native input owns Space/Enter activation; its
    // native `change` event flows through `_handleInternalChange`. Wiring the
    // host-side `_handleKeyDown` here would double-toggle (native flips +
    // _handleChange flips again). On the modern path the input is `aria-hidden
    // + tabindex=-1` so this handler is defensive only.
    const innerKeyDownHandler = innerIsAnnounced ? undefined : this._handleKeyDown;

    return html`
      <div class=${classMap(containerClasses)}>
        <label part="control" class="checkbox__control" @click=${ifDefined(labelClickHandler)}>
          <input
            class="checkbox__input"
            type="checkbox"
            id=${this._id}
            tabindex=${innerTabIndex}
            .checked=${live(this.checked)}
            .indeterminate=${live(this.indeterminate)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            name=${ifDefined(this.name || undefined)}
            .value=${this.value}
            aria-checked=${this.indeterminate ? 'mixed' : nothing}
            aria-invalid=${isInvalid ? 'true' : nothing}
            aria-describedby=${ifDefined(innerDescribedBy)}
            aria-label=${ifDefined(hostAriaLabel)}
            aria-labelledby=${ifDefined(innerLabelledBy)}
            aria-hidden=${innerIsAnnounced ? nothing : 'true'}
            @keydown=${ifDefined(innerKeyDownHandler)}
            @click=${ifDefined(innerClickHandler)}
            @change=${innerChangeHandler}
          />

          <span part="checkbox" class="checkbox__box">
            <hx-icon
              part="checkmark"
              class="checkbox__icon checkbox__icon--check"
              library="helix"
              name="check"
              aria-hidden="true"
            ></hx-icon>
            <hx-icon
              class="checkbox__icon checkbox__icon--indeterminate"
              library="helix"
              name="dash"
              aria-hidden="true"
            ></hx-icon>
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
