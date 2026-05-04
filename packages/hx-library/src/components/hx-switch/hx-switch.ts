import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixSwitchStyles } from './hx-switch.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextSwitchId = createIdCounter('hx-switch');

/** Detail for the hx-change event dispatched by hx-switch. */
export interface HxSwitchChangeDetail {
  checked: boolean;
  value: string;
}

/**
 * A toggle switch component for on/off states.
 *
 * Uses `role="switch"` with `aria-checked` to convey toggle state.
 * Supports keyboard activation via Space key (per ARIA APG switch pattern).
 * Label association is handled through `aria-labelledby`, and
 * error/help text are linked via `aria-describedby`.
 *
 * @summary Form-associated toggle switch with label, error, and help text.
 *
 * @tag hx-switch
 *
 * @slot - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the switch is toggled. Boolean-selection controls (`hx-switch`, `hx-checkbox`) include both `checked` (boolean state) and `value` (form value) in the detail; text-value controls (`hx-text-input`, `hx-combobox`, `hx-select`) emit only `{value}`.
 *
 * @csspart switch - The switch container (track + thumb wrapper).
 * @csspart track - The track background element.
 * @csspart thumb - The sliding thumb element.
 * @csspart label - The label text element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-switch-track-bg=var(--hx-color-neutral-300)] - Track background color.
 * @cssprop [--hx-switch-track-checked-bg=var(--hx-color-primary-500)] - Track background when checked.
 * @cssprop [--hx-switch-thumb-bg=var(--hx-color-neutral-0)] - Thumb background color.
 * @cssprop [--hx-switch-thumb-shadow=var(--hx-shadow-sm)] - Thumb box shadow.
 * @cssprop [--hx-switch-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-switch-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-switch-error-color=var(--hx-color-error-500)] - Error message color.
 * @cssprop [--hx-switch-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-switch-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-radius-full] - CSS custom property.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-shadow-sm] - Box shadow.
 * @cssprop [--hx-switch-track-width-sm=var(--hx-size-8)] - Width.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-switch-track-height-sm=var(--hx-size-4-5)] - Height.
 * @cssprop [--hx-size-4-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-sm=var(--hx-size-3-5)] - CSS custom property.
 * @cssprop [--hx-size-3-5] - Size token.
 * @cssprop [--hx-switch-thumb-offset=var(--hx-space-0-5)] - CSS custom property.
 * @cssprop [--hx-space-0-5] - Spacing token.
 * @cssprop [--hx-switch-track-width-md=var(--hx-size-10)] - Width.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-switch-track-height-md=var(--hx-size-5-5)] - Height.
 * @cssprop [--hx-size-5-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-md=var(--hx-size-4-5)] - CSS custom property.
 * @cssprop [--hx-switch-track-width-lg=var(--hx-size-12)] - Width.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-switch-track-height-lg=var(--hx-size-6-5)] - Height.
 * @cssprop [--hx-size-6-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-lg=var(--hx-size-5-5)] - CSS custom property.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-switch')
export class HelixSwitch extends FormMixin(HelixElement) {
  static override styles = [helixSwitchStyles, forcedColorsField];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * Whether the switch is toggled on.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the switch is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the switch is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * The name of the switch, used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The value submitted when the switch is checked.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = 'on';

  /**
   * The visible label text for the switch.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Size variant of the switch.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Error message to display. When set, the switch enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the switch for guidance.
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
   * Handle for the shared IDREF observer. Installed in `connectedCallback()`
   * so late-mutated `aria-labelledby`/`aria-describedby` and late-inserted
   * IDREF targets are picked up. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * No-IDL-ref fallback tokens applied to the inner button so consumer
   * labelling resolves through the shadow root. Tracked as reactive state
   * so values flow through the next `render()`.
   * @internal
   */
  @state() private _fallbackAriaLabelledBy: string | null = null;
  /** @internal */
  @state() private _fallbackAriaDescribedBy: string | null = null;
  /** @internal */
  @state() private _fallbackAriaLabel: string | null = null;

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between the modern path (host is the
   * announced surface, inner button is `aria-hidden + tabindex=-1`) and the
   * fallback path (inner button is the announced surface, host is demoted).
   * Codex round-2 finding #2.
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

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Detect platform support for IDL element references. Codex round-2
    // finding #2: drives the render-time branch.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Seed root-independent semantics so the host announces the switch role
    // immediately on connect — before the first paint.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #1: host is the canonical announced surface on
    // modern browsers, so the inner `<button role=switch>` is demoted via
    // `aria-hidden + tabindex=-1`.
    // Codex round-2 finding #2: on no-IDL-ref browsers the inner button is
    // the announced surface (it carries native button semantics + ARIA
    // role/state), so the host is demoted to `tabindex=-1`.
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
   * Host-level keydown handler. Active only on the modern path; on the
   * no-IDL-ref fallback the inner `<button>` owns native activation.
   * Codex round-2 finding #2.
   * @internal
   */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    if (e.target !== this) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._toggle();
    }
  };

  /**
   * Host-level click handler. Active only on the modern path; on the
   * fallback path AT activation flows directly to the inner button.
   * Codex round-2 finding #2.
   * @internal
   */
  private _handleHostClick = (e: MouseEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    const path = e.composedPath();
    if (path[0] !== this) return;
    this._toggle();
  };

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
    }
    if (
      changedProperties.has('disabled') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_supportsIdrefRefs')
    ) {
      // Codex round-2 finding #2: keep host tabindex aligned with the chosen
      // announced surface. On no-IDL-ref browsers the inner button owns tab
      // order, so re-enabling the host should leave it `tabindex=-1`.
      // Codex round-14 P2: only re-assert when the component owns tabindex.
      // Consumer-managed values (e.g. roving-tabindex toolbar with `-1`) must
      // not be overwritten on disabled flips or supports-flag transitions.
      if (this._internalTabindexManaged) {
        const enabledTabIndex = this._supportsIdrefRefs ? '0' : '-1';
        this.setAttribute('tabindex', this.disabled ? '-1' : enabledTabIndex);
      }
    }
    // Re-resolve element references against the (possibly mutated) shadow
    // tree. `_syncHostAriaSemantics()` is also invoked from `_updateValidity()`
    // and by the IDREF mirror observer.
    this._syncHostAriaSemantics();
  }

  /**
   * Mirrors switch semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-switch>` reach the announced control. The codex aria-group-2
   * finding identified that the inner shadow `<button role=switch>` was the
   * only carrier of switch semantics, leaving host-level IDREF tokens stranded
   * on the wrong side of the shadow boundary.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';

    // Codex round-2 finding #2: branch on platform support. Modern path —
    // host is the announced surface and carries `role=switch` + state via
    // ElementInternals. Fallback path — inner `<button role=switch>` is the
    // announced surface; clear host role/state so AT does not double-announce.
    if (this._supportsIdrefRefs) {
      // ─── Modern path ───
      internals.role = 'switch';
      internals.ariaChecked = this.checked ? 'true' : 'false';
      internals.ariaRequired = this.required ? 'true' : 'false';
      internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
      internals.ariaDisabled = this.disabled ? 'true' : 'false';

      if (hostAriaLabel) {
        internals.ariaLabel = hostAriaLabel;
      } else if (!this.getAttribute('aria-labelledby')) {
        internals.ariaLabel = this.label || null;
      } else {
        internals.ariaLabel = null;
      }

      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;

      const externalLabelTokens = this.getAttribute('aria-labelledby');
      const externalDescTokens = this.getAttribute('aria-describedby');

      const labelEls = resolveIdrefTokens(this, externalLabelTokens);
      const internalLabel = this.shadowRoot?.getElementById(this._labelId);
      const hasLabel = !!this.label || this._hasDefaultSlot;
      if (labelEls.length === 0 && !hostAriaLabel && hasLabel && internalLabel) {
        labelEls.push(internalLabel);
      }
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;

      const descEls = resolveIdrefTokens(this, externalDescTokens);
      const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
      const errorEl = this.shadowRoot?.getElementById(this._errorId);
      const hasError = !!(this.error || this._hasErrorSlot);
      // Codex round-15 P2: drop help text from the describedby chain while
      // an error is active. The render path hides the help wrapper in that
      // state (`?hidden=${... || hasError}`); appending the hidden node here
      // would have AT announce stale guidance ahead of the validation error.
      if (helpEl && !hasError && (this.helpText || this._hasHelpTextSlot)) {
        descEls.push(helpEl);
      }
      if (errorEl && hasError) {
        descEls.push(errorEl);
      }
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
      // Clear fallback state when IDL refs are available.
      this._fallbackAriaLabelledBy = null;
      this._fallbackAriaDescribedBy = null;
      this._fallbackAriaLabel = null;
    } else {
      // ─── Fallback path: inner button is the announced surface ───
      // Round-2 finding #2: round-1 set host role/state via internals AND
      // mirrored aria-* onto the `aria-hidden` inner button — making the
      // mirrored attributes inert. The fix is to clear host role/state on
      // internals so AT does not double-announce, and let the inner button
      // (rendered without aria-hidden, with `tabindex=0`, with role=switch
      // and aria-checked) be the announced surface.
      internals.role = null;
      internals.ariaChecked = null;
      internals.ariaRequired = null;
      internals.ariaInvalid = null;
      internals.ariaDisabled = null;
      internals.ariaLabel = null;

      this._fallbackAriaLabelledBy = this.getAttribute('aria-labelledby') || null;
      this._fallbackAriaDescribedBy = this.getAttribute('aria-describedby') || null;
      // Compute resolved label for the inner button: explicit aria-label
      // tokens, then the public `label` property as a last resort.
      this._fallbackAriaLabel = hostAriaLabel || null;
    }
  }

  // ─── Form Integration ───

  /** Recalculates and sets the validity state based on required and checked. */
  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.checked) {
      // Codex round-17 P2: anchor validity UI to the announced surface. On
      // the modern path the host carries `role=switch` via internals and is
      // the canonical focus target (the inner track button is `aria-hidden +
      // tabindex=-1`), so reportValidity() would otherwise focus a hidden
      // node. On the fallback path the inner button is the announced
      // surface.
      const anchor: HTMLElement | undefined = this._supportsIdrefRefs
        ? this
        : (this._trackEl ?? undefined);
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        anchor,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: sync host ARIA semantics immediately after
    // every `setValidity()` call so `internals.ariaInvalid` reflects the
    // current `ValidityState` rather than the previous render snapshot.
    this._syncHostAriaSemantics();
  }

  protected override _onFormReset(): void {
    this.checked = false;
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.checked = state === this.value;
    }
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** Reference to the native button element acting as the switch track.  * @internal
   */
  @query('.switch__track')
  private _trackEl: HTMLButtonElement | null | undefined;

  /** Whether the error slot has assigned content. */
  /** @internal */
  @state() private _hasErrorSlot = false;

  /** Whether the default slot has assigned content (slotted label). */
  /** @internal */
  @state() private _hasDefaultSlot = false;

  /** Whether the help-text slot has assigned content. */
  /** @internal */
  @state() private _hasHelpTextSlot = false;

  // ─── Slot Handlers ───

  /** Updates _hasErrorSlot when error slot content changes. */
  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** Updates _hasDefaultSlot when default slot content changes. */
  /** @internal */
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasDefaultSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** Updates _hasHelpTextSlot when help-text slot content changes. */
  /** @internal */
  private _handleHelpTextSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpTextSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  /** Toggles checked state and dispatches hx-change event. */
  /** @internal */
  private _toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this._handleInteractionInput();

    this.dispatchEvent(
      new CustomEvent<{ checked: boolean; value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  /** Handles click events on the track. */
  /** @internal */
  private _handleClick(): void {
    this._toggle();
    // Codex round-12 P2: on the modern path the host owns role="switch" and
    // tabindex=0; the inner <button tabindex="-1"> is aria-hidden. Native
    // click activation on a `<button>` still focuses it, which would leave
    // `document.activeElement` and AT focus on a hidden node. Move focus back
    // to the host so the announced surface is also the focus target.
    if (this._supportsIdrefRefs) {
      this.focus();
    }
  }

  /** Handles keydown events — Space toggles the switch per ARIA APG. */
  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  // ─── Public Methods ───

  /**
   * Moves focus to the announced switch surface. Codex round-1 finding #1
   * relocated the focus target to the host so AT announces a single widget;
   * the host carries the canonical role/state on modern engines. Round-7
   * finding #7 extends that contract to the no-IDL-ref fallback: when the
   * host is demoted (`tabindex=-1`, role/state cleared on `internals`) the
   * inner `<button role=switch>` owns the announced semantics and tab order,
   * so programmatic `focus()` must redirect there — otherwise scripted focus
   * and error recovery land on the demoted host on unsupported engines.
   */
  override focus(options?: FocusOptions): void {
    if (this._supportsIdrefRefs) {
      super.focus(options);
      return;
    }
    this._trackEl?.focus(options);
  }

  // ─── Render ───

  /** Unique ID for this switch instance, used for ARIA associations. */
  /** @internal */
  private _switchId = _nextSwitchId();
  /** ID for the label element, referenced by aria-labelledby. */
  /** @internal */
  private _labelId = `${this._switchId}-label`;
  /** ID for the help text element, referenced by aria-describedby. */
  /** @internal */
  private _helpTextId = `${this._switchId}-help`;
  /** ID for the error element, referenced by aria-describedby. */
  /** @internal */
  private _errorId = `${this._switchId}-error`;

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelpText = !!this.helpText || this._hasHelpTextSlot;
    const hasLabel = !!this.label || this._hasDefaultSlot;
    // Validity-driven invalid state: a required-but-unchecked switch is
    // invalid via setValidity() even before any visible error renders.
    const isInvalid = hasError || (this.required && !this.checked);

    const containerClasses = {
      switch: true,
      'switch--checked': this.checked,
      'switch--disabled': this.disabled,
      'switch--required': this.required,
      'switch--error': hasError,
      [`switch--${this.size}`]: true,
    };

    // help-text first, error appended — assistive tech announces guidance
    // before validation feedback. Both ids are persistent in the shadow tree.
    // Codex round-15 P2: drop help text from the chain when an error is
    // active. The help wrapper renders hidden in that state, so referencing
    // it would have AT announce stale guidance ahead of the validation
    // error. Mirrors the modern-path host-internals chain.
    const describedBy =
      [!hasError && hasHelpText ? this._helpTextId : null, hasError ? this._errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    // Codex round-1 finding #8: merge consumer fallback tokens with the
    // shadow-internal describedBy chain on browsers without IDL element
    // references. Internal `_labelId` is preferred when no consumer
    // labelledby tokens are supplied.
    const innerDescribedBy =
      [describedBy ?? null, this._fallbackAriaDescribedBy].filter(Boolean).join(' ') || undefined;
    // Codex round-14 P2: per ARIA spec, `aria-labelledby` overrides
    // `aria-label`. On the no-IDL-ref fallback path the consumer-set
    // `aria-label` was being shadowed because we always assigned the
    // internal `_labelId`. When the consumer supplied an `aria-label` (and
    // did NOT supply an `aria-labelledby`), omit the internal labelledby so
    // AT announces the consumer-supplied name — matching the modern path
    // and the spec. Consumer-supplied `aria-labelledby` (mirrored into
    // `_fallbackAriaLabelledBy`) still wins over the internal label.
    const innerAriaLabel = this._fallbackAriaLabel ?? undefined;
    const innerLabelledBy = this._fallbackAriaLabelledBy
      ? this._fallbackAriaLabelledBy
      : innerAriaLabel
        ? undefined
        : hasLabel
          ? this._labelId
          : undefined;

    // Codex round-2 finding #2: branch the inner button on platform support.
    // Modern path — host is announced, inner button is `aria-hidden + tabindex=-1`.
    // Fallback path — inner button is announced (NO aria-hidden, role=switch,
    // tabindex=0) so consumer-mirrored aria-* attributes resolve through a
    // visible accessibility-tree node and AT can name + activate it natively.
    const innerIsAnnounced = !this._supportsIdrefRefs;
    const innerTabIndex = innerIsAnnounced && !this.disabled ? '0' : '-1';
    // On the fallback path the inner button must carry role=switch so AT
    // announces "switch", aria-checked for state, and aria-required when set.
    const innerRole = innerIsAnnounced ? 'switch' : nothing;

    return html`
      <div part="switch" class=${classMap(containerClasses)}>
        <div class="switch__control-row">
          <button
            part="track"
            class="switch__track"
            id=${this._switchId}
            type="button"
            role=${innerRole}
            tabindex=${innerTabIndex}
            aria-checked=${this.checked ? 'true' : 'false'}
            aria-labelledby=${ifDefined(innerLabelledBy)}
            aria-describedby=${ifDefined(innerDescribedBy)}
            aria-label=${ifDefined(innerAriaLabel)}
            aria-invalid=${isInvalid ? 'true' : nothing}
            aria-required=${this.required ? 'true' : nothing}
            aria-hidden=${innerIsAnnounced ? nothing : 'true'}
            ?disabled=${this.disabled}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
          >
            <span part="thumb" class="switch__thumb"></span>
          </button>

          <label part="label" class="switch__label" id=${this._labelId} for=${this._switchId}>
            <slot @slotchange=${this._handleDefaultSlotChange}>${this.label}</slot>${this.required
              ? html`<span class="switch__required-marker" aria-hidden="true">*</span>`
              : nothing}
          </label>
        </div>

        <!--
          Persistent error live region. Slot fallback content provides the
          property-driven message; consumers can replace it via slot="error".
          The wrapper carries a stable id so aria-describedby remains valid
          across both code paths and across show/hide transitions.
        -->
        <div
          part="error"
          class="switch__error"
          id=${this._errorId}
          role="alert"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this._handleErrorSlotChange}>${this.error}</slot>
        </div>

        <!--
          Persistent help-text wrapper. Rendered whenever the property OR the
          slot has content; hidden when an error is present so guidance does
          not compete with validation feedback.
        -->
        <div
          part="help-text"
          class="switch__help-text"
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

/**
 * Per-component event map for type-safe addEventListener on hx-switch.
 * The `hx-change` detail always includes both `checked` and `value` for this component.
 */
export interface HxSwitchEventMap {
  'hx-change': CustomEvent<{ checked: boolean; value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-switch': HelixSwitch;
  }
}

export type HxSwitch = HelixSwitch;
