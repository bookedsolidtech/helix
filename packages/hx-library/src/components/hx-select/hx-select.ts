import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixSelectStyles } from './hx-select.styles.js';
// Round-2 finding 7: do NOT compose `forcedColorsField`. The shared mixin's
// selectors target real `<input>`/`<select>`/`[part="input"]`/`[part="control"]`
// surfaces, which `hx-select` does not expose — the announced control is the
// `[part="trigger"]` div. The bespoke `.field__trigger:focus-visible` rule
// inside `hx-select.styles.ts` is the only forced-colors path that paints,
// so composing the mixin would only add dead selectors. Per the
// `forced-colors.ts` contract ("compose mixin OR author bespoke block, not
// both"), we author the bespoke block.
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

/**
 * Reads visible text from a shadow wrapper that contains a `<slot>`. Prefers
 * the slot's flattened assigned-nodes text when light DOM is projected,
 * otherwise falls back to the wrapper's own `textContent` (so property-driven
 * fallback content rendered inside the slot is still readable). Aligned with
 * the Group 2 round-23 P2 helper used by `hx-radio-group` / `hx-checkbox-group`.
 */
function readSlottedOrShadowText(wrapper: Element): string {
  const slot = wrapper.querySelector('slot');
  if (slot) {
    const assigned = (slot as HTMLSlotElement).assignedNodes({ flatten: true });
    if (assigned.length > 0) {
      return assigned
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
    }
  }
  return (wrapper.textContent ?? '').trim();
}

// PERF: hx-select exceeds 5KB budget (6.31kb gzipped) -- custom listbox, keyboard navigation, grouped options

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
const _nextSelectId = createIdCounter('hx-select');

// ─── Internal option model ───

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

/** Detail for the hx-change event dispatched by hx-select. */
export interface HxSelectChangeDetail {
  value: string;
}

/**
 * A form-associated select component with custom styling, label, error, and
 * help text. Options are provided via slotted `<option>` (and `<optgroup>`)
 * elements in the light DOM. The component wraps a hidden native `<select>`
 * for form participation and provides a combobox trigger for consistent
 * cross-browser styling.
 *
 * @remarks Multi-select is intentionally not supported. This component
 * implements a single-value select (combobox) pattern only. For multi-value
 * selection use a separate multi-select component.
 *
 * @remarks The listbox panel uses `position: absolute` and may be clipped by
 * ancestor elements with `overflow: hidden` or `overflow: auto`. This is a
 * known limitation when embedding the component inside cards, tables, or
 * dialogs. Use the CSS custom property `--hx-select-listbox-shadow` or
 * restructure the containing layout to avoid clipping.
 *
 * @summary Form-associated custom select with label, error, and help text.
 *
 * @tag hx-select
 *
 * @slot - Default slot for `<option>` and `<optgroup>` elements.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected option changes.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart select-wrapper - The wrapper containing the trigger and listbox.
 * @csspart select - The hidden native select element (kept for form participation).
 * @csspart trigger - The button that opens/closes the dropdown.
 * @csspart listbox - The dropdown panel containing options.
 * @csspart option - Individual option items in the listbox.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-select-bg=var(--hx-color-neutral-0)] - Select background color.
 * @cssprop [--hx-select-color=var(--hx-color-neutral-800)] - Select text color.
 * @cssprop [--hx-select-border-color=var(--hx-color-neutral-300)] - Select border color.
 * @cssprop [--hx-select-border-radius=var(--hx-border-radius-md)] - Select border radius.
 * @cssprop [--hx-select-font-family=var(--hx-font-family-sans)] - Select font family.
 * @cssprop [--hx-select-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-select-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-select-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-select-chevron-color=var(--hx-color-neutral-500)] - Chevron indicator color.
 * @cssprop [--hx-select-chevron-size=0.5rem] - Chevron indicator size (width/height base unit).
 * @cssprop [--hx-select-listbox-bg=var(--hx-color-neutral-0)] - Listbox panel background color.
 * @cssprop [--hx-select-option-hover-bg=var(--hx-color-primary-50)] - Option hover background color.
 * @cssprop [--hx-select-option-selected-bg=var(--hx-color-primary-100)] - Selected option background color.
 * @cssprop [--hx-select-placeholder-color=var(--hx-color-neutral-400)] - Placeholder text color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-input-height-md] - Height.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-input-height-sm] - Height.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-input-height-lg] - Height.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-px] - Spacing token.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 * @cssprop [--hx-select-listbox-shadow] - CSS custom property.
 * @cssprop [--hx-overlay-neutral-12] - Overlay color.
 * @cssprop [--hx-select-listbox-max-height=16rem] - Height.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-select-option-focus-ring-offset=-2px] - Focus ring styling.
 * @cssprop [--hx-font-size-xs] - Font size.
 */
@customElement('hx-select')
export class HelixSelect extends FormMixin(HelixElement) {
  static override styles = helixSelectStyles;

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  // ─── Stable IDs ───

  /** @internal */
  private _selectId = _nextSelectId();
  /** @internal */
  private _listboxId = `${this._selectId}-listbox`;
  /** @internal */
  private _labelId = `${this._selectId}-label`;
  /** @internal */
  private _helpTextId = `${this._selectId}-help`;
  /** @internal */
  private _errorId = `${this._selectId}-error`;

  // ─── Public Properties ───

  /**
   * The visible label text for the select.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown in the trigger when no option is selected.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the select.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Whether the select is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the select is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The name used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the select for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Size variant of the select trigger.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * Uses `accessible-label` attribute instead of `aria-label` to avoid
   * ARIAMixin shadowing on the host element.
   *
   * Note: `mixinDelegatesAria` is not applied to this component because form
   * inputs with associated labels delegate accessible naming via `<label>`
   * association and `aria-labelledby`, not host-level ARIA delegation. The
   * `accessible-label` attribute is a fallback for label-free usage. The value is forwarded to the
   * internal trigger button's `aria-label`.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | null = null;

  /**
   * Controls whether the dropdown listbox is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Validation message when no option is selected. Override for i18n.
   * @attr label-required
   */
  @property({ attribute: 'label-required' }) labelRequired = 'Please select an option.';

  /**
   * Label shown when no options are available. Override for i18n.
   * @attr label-no-options
   */
  @property({ attribute: 'label-no-options' }) labelNoOptions = 'No options found';

  // ─── Internal State ───

  /** Parsed option models derived from slotted `<option>` and `<optgroup>` elements. @internal */
  @state() private _options: SelectOption[] = [];
  /** Whether the named error slot contains projected content. @internal */
  @state() private _hasErrorSlot = false;
  /** Whether the named label slot contains projected content. @internal */
  @state() private _hasLabelSlot = false;
  /** Whether the help-text slot contains projected content. @internal */
  @state() private _hasHelpSlot = false;
  /**
   * The id assigned to the first slotted label node so it can join the
   * accessible-name chain (parity with `hx-time-picker`). The slot's projected
   * light-DOM elements stay in the light tree, so we attach a stable id and
   * resolve the element directly into `labelEls` for the modern path. Round-2
   * finding 3.
   * @internal
   */
  @state() private _slottedLabelId = '';
  /** Zero-based index of the keyboard-focused option in the listbox; -1 means none. @internal */
  @state() private _focusedOptionIndex = -1;
  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between modern (host-canonical via internals
   * element references) and fallback (host-attribute mirror only). Aligned
   * with Group 2 round-17 P1.
   *
   * ARCHITECTURE — Path A (host-as-form-field, inner-as-combobox):
   * The host owns `internals.ariaLabel`, `internals.ariaLabelledByElements`,
   * `internals.ariaDescribedByElements`, `internals.ariaRequired`,
   * `internals.ariaInvalid`, `internals.ariaDisabled`. The host does NOT own
   * `internals.role` — `role="combobox"` stays on the inner trigger element
   * per the APG combobox pattern (ARIA 1.2 places `combobox` semantics on
   * the editable text field, not its container). Promoting the host to
   * `combobox` would conflict with the inner trigger's role and produce a
   * doubled accessible.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;
  /**
   * Deferred copy of `error` driven through reactive state so the persistent
   * live region can re-announce on transitions without direct DOM mutation.
   * Aligned with Group 2 round-1 finding #10.
   * @internal
   */
  @state() private _announcedError = '';
  /**
   * Cached invalidity flag derived from `internals.validity.valid` after the
   * latest `setValidity()` call. Both the modern (`internals.ariaInvalid`)
   * and fallback (host attribute) writes read from the same source so they
   * cannot disagree. Round-2 finding 2.
   * @internal
   */
  @state() private _invalid = false;
  /**
   * Whether to render fallback host-canonical ARIA. On the fallback path the
   * host carries `role="combobox"` and the consumer-facing ARIA attributes
   * (label, describedby, required, invalid, expanded, haspopup, controls,
   * activedescendant, disabled), and the inner trigger drops its role + ARIA
   * mirror so AT does not see a doubled accessible. Round-2 finding 1
   * (Option B parity with Group 2 round-36). Tracks `!_supportsIdrefRefs`.
   * @internal
   */
  private get _useFallbackHostRole(): boolean {
    return !this._supportsIdrefRefs;
  }

  // ─── Queries ───

  /** Reference to the hidden native select element used for form participation. @internal */
  @query('.field__select')
  private _select: HTMLSelectElement | undefined;

  /** Reference to the visible combobox trigger element that receives keyboard focus. @internal */
  @query('.field__trigger')
  private _trigger: HTMLElement | undefined;

  // ─── Computed helpers ───

  /** @internal */
  private get _displayValue(): string {
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  // ─── Host-canonical ARIA bookkeeping ───

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;
  /**
   * Watches assigned `<slot name="help-text">` nodes for in-place text
   * mutations so the no-IDL-ref fallback `internals.ariaDescription` stays in
   * sync. Aligned with Group 2 round-23 P2 (Finding C).
   * @internal
   */
  private _helpSlotTextObserver: MutationObserver | null = null;
  /**
   * Watches assigned `<slot name="error">` nodes for in-place text mutations.
   * Aligned with Group 2 round-23 P2 (Finding C).
   * @internal
   */
  private _errorSlotTextObserver: MutationObserver | null = null;
  /**
   * Last value of `aria-labelledby` we wrote to the host. Used to distinguish
   * external (consumer) attribute mutations from our own internal augmentation
   * writes. Aligned with Group 2 round-10 P2.
   * @internal
   */
  private _lastWrittenLabelledBy: string | null = null;
  /** @internal — see `_lastWrittenLabelledBy`. */
  private _lastWrittenDescribedBy: string | null = null;
  /**
   * Most recently observed *consumer-supplied* `aria-labelledby` baseline.
   * Refreshed only when the host attribute changes via an external write —
   * internal writes leave the baseline untouched. Cached so consumer tokens
   * can replay if their target element later attaches to the DOM.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;
  /** @internal — see `_consumerLabelledBy`. */
  private _consumerDescribedBy: string | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Group 2 round-17 P1 parity: detect IDL element-references API support
    // so render() can branch between modern (host-canonical via internals
    // element references) and fallback (host-attribute mirror) treatments.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Seed root-independent semantics from connect so the host announces the
    // form-field semantics before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Safety net: remove listener if component is removed while dropdown is open
    document.removeEventListener('click', this._handleOutsideClick);
    // Reset open state to prevent persisted open state on reconnect
    if (this.open) {
      this.open = false;
      this._focusedOptionIndex = -1;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._helpSlotTextObserver?.disconnect();
    this._helpSlotTextObserver = null;
    this._errorSlotTextObserver?.disconnect();
    this._errorSlotTextObserver = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      if (this.open) {
        document.addEventListener('click', this._handleOutsideClick);
      } else {
        document.removeEventListener('click', this._handleOutsideClick);
      }
    }
    if (changedProperties.has('value')) {
      this._syncNativeSelect();
      this._updateFormValue();
    }
    if (changedProperties.has('size')) {
      const validSizes: string[] = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.size)) {
        devWarn(
          'hx-select',
          `Invalid size "${this.size}". Expected one of: ${validSizes.join(', ')}.`,
        );
      }
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Group 2 round-1 finding #10: drive re-announcement from reactive state
    // so the persistent live region stays in the shadow tree across error
    // transitions. The persistent `<div role="alert">` always lives in DOM;
    // changing `_announcedError` re-paints its slot fallback content and AT
    // re-announces.
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string;
      if (previousError && this.error) {
        // Error→error: clear then re-set after rAF so AT re-announces.
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        this._announcedError = this.error;
      }
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    // WCAG 4.1.2: warn when no accessible name is available. The trigger
    // needs either a `label` prop, an `accessible-label` attribute, or a
    // host-level `aria-label` / `aria-labelledby` so AT can identify the
    // form field.
    if (
      !this.label &&
      !this.accessibleLabel &&
      !this._hasLabelSlot &&
      !this.getAttribute('aria-label') &&
      !this.getAttribute('aria-labelledby')
    ) {
      devWarn(
        'hx-select',
        'No accessible label provided. Set the `label` attribute, `accessible-label`, `aria-label`, `aria-labelledby`, or project a `<slot name="label">` child. An unlabeled select violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  // ─── Host-canonical ARIA sync ───

  /**
   * Mirrors form-field semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-select>` reach the announced control. The Group 3 scope identified
   * that the inner combobox `<div>` was the announced node and the host's
   * external IDREF tokens could not cross the shadow boundary.
   *
   * Path A: host owns label/describedby/required/invalid/disabled. Host does
   * NOT own role — `role="combobox"` stays on the inner trigger per APG.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    // Path A: explicitly leave host roleless so the inner combobox/listbox
    // surface stays canonical. Setting `internals.role = 'combobox'` here
    // would conflict with the inner trigger and produce a doubled accessible.
    internals.role = null;
    internals.ariaRequired = this.required ? 'true' : 'false';
    // Round-2 finding 2: read `internals.validity.valid` once and cache the
    // derived flag in reactive state so the modern (`internals.ariaInvalid`)
    // and fallback (inner-trigger / host-mirror attribute) writes both read
    // from the same source. Decoupling `aria-invalid` from `hasError` was the
    // round-1 defect — required+empty with no `error` prop was announced
    // valid on fallback but invalid on modern.
    const isInvalid = !internals.validity.valid;
    this._invalid = isInvalid;
    internals.ariaInvalid = isInvalid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';

    // Resolve the candidate label/desc element references once — the IDL-ref
    // path consumes them as `Element[]`, the fallback path mirrors consumer
    // tokens onto the host attribute.
    const internalLabel = this.shadowRoot?.getElementById(this._labelId);
    // Round-2 finding 3: the `<slot name="label">` projects light-DOM nodes,
    // so the visible-label element lives outside the shadow tree and cannot
    // be looked up via shadowRoot.getElementById. Resolve the slotted-label
    // element via its tracked id so the accessible-name chain includes the
    // consumer's slotted label even when the `label` property is empty.
    const slottedLabelEl =
      this._slottedLabelId && this._hasLabelSlot
        ? (document.getElementById(this._slottedLabelId) ?? this.querySelector(`#${this._slottedLabelId}`))
        : null;
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
    const errorEl = this.shadowRoot?.getElementById(this._errorId);

    // Group 2 round-10 P2: refresh the consumer baseline only when the host
    // attribute moved due to an *external* write. Compare the live attribute
    // against our last-written snapshot — if it differs, the consumer wrote.
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    if (liveLabelledBy !== this._lastWrittenLabelledBy) {
      this._consumerLabelledBy = liveLabelledBy;
    }
    const liveDescribedBy = this.getAttribute('aria-describedby');
    if (liveDescribedBy !== this._lastWrittenDescribedBy) {
      this._consumerDescribedBy = liveDescribedBy;
    }
    const externalLabelTokens = this._consumerLabelledBy;
    const externalDescTokens = this._consumerDescribedBy;

    const labelEls = resolveIdrefTokens(this, externalLabelTokens);
    // Group 2 round-35 (CR major + codex follow-up): `aria-labelledby` is
    // only "effective" when at least one IDREF resolves. A typo or
    // transiently-missing target must NOT erase the visible label — fall back
    // to `label` / `accessibleLabel` / slotted label so the field keeps a name
    // on both paths.
    const hasEffectiveLabelledBy = labelEls.length > 0;
    // Round-2 finding 3: when the consumer projects a `<span slot="label">`
    // they expect that element to contribute to the accessible name with
    // zero additional API. Treat it equivalently to `this.label` — and like
    // any other non-resolving labelledby, it must not erase the visible
    // label when missing.
    const effectiveLabelText = this.label || (this._hasLabelSlot ? '*slotted*' : '');
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (!hasEffectiveLabelledBy) {
      // Prefer the slotted label element via labelledByElements over a string
      // mirror so AT walks the visible label node directly.
      if (this._hasLabelSlot && slottedLabelEl) {
        internals.ariaLabel = null;
      } else if (effectiveLabelText && effectiveLabelText !== '*slotted*') {
        internals.ariaLabel = this.label || this.accessibleLabel || null;
      } else {
        internals.ariaLabel = this.accessibleLabel || null;
      }
    } else {
      internals.ariaLabel = null;
    }
    if (labelEls.length === 0 && !hostAriaLabel) {
      if (this._hasLabelSlot && slottedLabelEl) {
        labelEls.push(slottedLabelEl);
      } else if (this.label && internalLabel) {
        labelEls.push(internalLabel);
      }
    }

    const descEls = resolveIdrefTokens(this, externalDescTokens);
    const hasError = !!(this.error || this._hasErrorSlot);
    // Group 2 round-16 P2: drop help text from the describedby chain while an
    // error is active so AT does not announce stale guidance ahead of the
    // validation error.
    if (helpEl && !hasError && (this.helpText || this._hasHelpSlot)) {
      descEls.push(helpEl);
    }
    if (errorEl && hasError) {
      descEls.push(errorEl);
    }

    if (this._supportsIdrefRefs) {
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
      // Clear stale fallback ariaDescription string if a prior sync ran on
      // the fallback path (e.g. tests flipping `_supportsIdrefRefs`).
      internals.ariaDescription = null;
      // Round-2 finding 1: ensure host fallback role/ARIA attributes are not
      // lingering from a previous fallback-path sync (e.g. tests that flip
      // `_supportsIdrefRefs`). The modern path keeps the host roleless so
      // the inner trigger remains the announced combobox.
      this._clearHostFallbackAria();
    } else {
      // ─── No-IDL-ref fallback (Group 2 round-19 P1 parity) ───
      // The IDL element-references API is unavailable, so internal shadow
      // help/error/label wrappers cannot be projected onto the host
      // accessibility node via `internals.aria*Elements`. The host owns the
      // ARIA strings (via `internals.ariaLabel`, `internals.ariaDescription`)
      // and we mirror only consumer-supplied tokens onto the host attribute
      // (shadow ids cannot resolve across the boundary).
      const consumerLabelIds = new Set((externalLabelTokens?.split(/\s+/) ?? []).filter(Boolean));
      const consumerDescIds = new Set((externalDescTokens?.split(/\s+/) ?? []).filter(Boolean));

      // Group 2 round-35 (medium) + round-36 (medium): mirror consumer tokens
      // to the host attribute ONLY when at least one resolves. Otherwise
      // actively clear the host attribute — per ARIA priority a broken
      // `aria-labelledby` would otherwise erase the accessible name on
      // legacy engines. The original tokens stay cached in
      // `_consumerLabelledBy` so they replay if the target later attaches.
      const hostLabel = hasEffectiveLabelledBy
        ? [...consumerLabelIds].filter(Boolean).join(' ')
        : '';
      const liveLabel = this.getAttribute('aria-labelledby');
      if (hostLabel) {
        if (liveLabel !== hostLabel) {
          this.setAttribute('aria-labelledby', hostLabel);
        }
        this._lastWrittenLabelledBy = hostLabel;
      } else if (liveLabel !== null) {
        this.removeAttribute('aria-labelledby');
        this._lastWrittenLabelledBy = null;
      }

      const hostDesc = [...consumerDescIds].filter(Boolean).join(' ') || '';
      const liveDesc = this.getAttribute('aria-describedby');
      // Round-2 finding 4: symmetric clears — both describedby and labelledby
      // drop the host attribute when the consumer's tokens are unresolvable
      // / empty. The previous `_lastWrittenDescribedBy !== null` guard left a
      // consumer-set `aria-describedby="missing-id"` on initial paint
      // un-cleared, so legacy engines saw a broken IDREF that erased the
      // accessible description. Cache replay via `_consumerDescribedBy` is
      // unaffected — the original tokens stay cached for future resolution.
      if (hostDesc) {
        if (liveDesc !== hostDesc) {
          this.setAttribute('aria-describedby', hostDesc);
        }
        this._lastWrittenDescribedBy = hostDesc;
      } else if (liveDesc !== null) {
        this.removeAttribute('aria-describedby');
        this._lastWrittenDescribedBy = null;
      }

      // Group 2 round-22 P1 #2 + round-23 P2 (Finding C): mirror shadow
      // help/error textContent into `internals.ariaDescription` so the host's
      // accessible description still surfaces the live help/error strings on
      // legacy engines. Slot-aware text read crosses the shadow → light-DOM
      // boundary; the slot text observers replay this on in-place edits.
      const helpText =
        helpEl && !hasError && (this.helpText || this._hasHelpSlot)
          ? readSlottedOrShadowText(helpEl)
          : '';
      const errorText = errorEl && hasError ? readSlottedOrShadowText(errorEl) : '';
      const internalDescriptionText = [helpText, errorText].filter(Boolean).join(' ');
      internals.ariaDescription = internalDescriptionText || null;

      // Round-2 finding 1 (Option B parity with Group 2 round-36): on the
      // fallback path, promote the *host* to the announced combobox surface.
      // Without IDL element references the consumer's `aria-label` /
      // `aria-labelledby` / `aria-describedby` cannot reach the inner trigger
      // across the shadow boundary, so the trigger announces only the host
      // attribute mirror. Move `role="combobox"` and the ARIA mirror to the
      // host so AT walks the consumer-authored naming chain. The inner
      // trigger drops its role + ARIA on fallback (see render()) to avoid a
      // doubled accessible.
      this._writeHostFallbackAria({
        hostAriaLabel,
        isInvalid,
      });
    }
  }

  /**
   * Writes host-level fallback ARIA attributes when the platform lacks IDL
   * element-reference support. Pairs with the render-time branch that drops
   * the inner trigger's role + ARIA mirror on fallback. Round-2 finding 1
   * (Option B). Internal writes are tracked so we do not double-process them
   * via the IDREF mirror.
   * @internal
   */
  private _writeHostFallbackAria(args: {
    hostAriaLabel: string;
    isInvalid: boolean;
  }): void {
    const { hostAriaLabel, isInvalid } = args;

    // Combobox role + popup wiring lives on the host so AT consumes it.
    if (this.getAttribute('role') !== 'combobox') {
      this.setAttribute('role', 'combobox');
    }
    if (this.getAttribute('aria-haspopup') !== 'listbox') {
      this.setAttribute('aria-haspopup', 'listbox');
    }
    if (this.getAttribute('aria-controls') !== this._listboxId) {
      this.setAttribute('aria-controls', this._listboxId);
    }
    // aria-expanded mirrors `open`.
    const expanded = this.open ? 'true' : 'false';
    if (this.getAttribute('aria-expanded') !== expanded) {
      this.setAttribute('aria-expanded', expanded);
    }
    // aria-activedescendant mirrors the keyboard-focused option.
    const activeDescendant =
      this.open && this._focusedOptionIndex >= 0 ? this._optionId(this._focusedOptionIndex) : null;
    if (activeDescendant) {
      if (this.getAttribute('aria-activedescendant') !== activeDescendant) {
        this.setAttribute('aria-activedescendant', activeDescendant);
      }
    } else if (this.hasAttribute('aria-activedescendant')) {
      this.removeAttribute('aria-activedescendant');
    }
    // aria-required / aria-invalid / aria-disabled mirror the boolean state.
    const requiredAttr = this.required ? 'true' : null;
    if (requiredAttr) {
      if (this.getAttribute('aria-required') !== requiredAttr) {
        this.setAttribute('aria-required', requiredAttr);
      }
    } else if (this.hasAttribute('aria-required')) {
      this.removeAttribute('aria-required');
    }
    const invalidAttr = isInvalid ? 'true' : null;
    if (invalidAttr) {
      if (this.getAttribute('aria-invalid') !== invalidAttr) {
        this.setAttribute('aria-invalid', invalidAttr);
      }
    } else if (this.hasAttribute('aria-invalid')) {
      this.removeAttribute('aria-invalid');
    }
    const disabledAttr = this.disabled ? 'true' : null;
    if (disabledAttr) {
      if (this.getAttribute('aria-disabled') !== disabledAttr) {
        this.setAttribute('aria-disabled', disabledAttr);
      }
    } else if (this.hasAttribute('aria-disabled')) {
      this.removeAttribute('aria-disabled');
    }
    // aria-label mirrors consumer `aria-label`, then `accessibleLabel`, then
    // `label`. Skip when an effective `aria-labelledby` or slotted-label
    // resolves — labelledby has higher ARIA priority.
    if (!hostAriaLabel) {
      const candidate = this.accessibleLabel || this.label || '';
      // Only set a label string when there is no labelledby chain; otherwise
      // the label string would shadow the labelledby reference.
      const hasLabelledBy = this.hasAttribute('aria-labelledby');
      if (!hasLabelledBy && candidate) {
        if (this.getAttribute('aria-label') !== candidate) {
          this.setAttribute('aria-label', candidate);
        }
      } else if (this.hasAttribute('aria-label') && !this.getAttribute('aria-label')?.trim()) {
        this.removeAttribute('aria-label');
      }
    }
  }

  /**
   * Removes any host-level fallback ARIA attributes the component may have
   * written on a previous sync. Used when the platform supports IDL element
   * references — the host stays roleless on the modern path so the inner
   * trigger keeps its `role="combobox"` and AT does not see two announced
   * surfaces. Round-2 finding 1.
   * @internal
   */
  private _clearHostFallbackAria(): void {
    if (this.getAttribute('role') === 'combobox') this.removeAttribute('role');
    if (this.hasAttribute('aria-haspopup')) this.removeAttribute('aria-haspopup');
    if (this.hasAttribute('aria-controls')) this.removeAttribute('aria-controls');
    if (this.hasAttribute('aria-expanded')) this.removeAttribute('aria-expanded');
    if (this.hasAttribute('aria-activedescendant')) this.removeAttribute('aria-activedescendant');
    if (this.hasAttribute('aria-required')) this.removeAttribute('aria-required');
    if (this.hasAttribute('aria-invalid')) this.removeAttribute('aria-invalid');
    if (this.hasAttribute('aria-disabled')) this.removeAttribute('aria-disabled');
  }

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * help-text-slot nodes. Aligned with Group 2 round-23 P2 (Finding C).
   * @internal
   */
  private _installHelpSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._helpSlotTextObserver?.disconnect();
    if (!slot) {
      this._helpSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
    this._helpSlotTextObserver = observer;
  }

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * error-slot nodes. Aligned with Group 2 round-23 P2 (Finding C).
   * @internal
   */
  private _installErrorSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._errorSlotTextObserver?.disconnect();
    if (!slot) {
      this._errorSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
    this._errorSlotTextObserver = observer;
  }

  // ─── Form Integration ───

  /** @internal */
  private _updateFormValue(): void {
    this._internals.setFormValue(this.value || null);
  }

  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      // Group 2 round-35 finding (CR major): anchor `setValidity()` to a
      // focusable, interactive element so the UA can route validation UI /
      // error recovery to the actual control surface. The visible trigger
      // div is the `role="combobox"` focus target; prefer it. The hidden
      // native `<select>` is `tabindex="-1"` and aria-hidden so it cannot
      // host UA validation UI — only fall through to it when the trigger
      // has not yet rendered (defensive; should not happen post-firstUpdated).
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.labelRequired,
        this._trigger ?? this._select,
      );
    } else {
      this._internals.setValidity({});
    }
    // Group 2 round-1 finding #6: re-sync host ARIA after every setValidity()
    // so `aria-invalid` reflects the freshly computed validity state.
    this._syncHostAriaSemantics();
  }

  // ─── Form Lifecycle Hooks ───

  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Native Select Sync ───

  /** @internal */
  private _syncNativeSelect(): void {
    if (!this._select) return;
    if (this.value) {
      this._select.value = this.value;
    }
  }

  // ─── Option Syncing from Slot ───

  /** @internal */
  private _parseOption(el: HTMLOptionElement): SelectOption {
    return { value: el.value, label: el.textContent?.trim() ?? el.value, disabled: el.disabled };
  }

  /**
   * Single-pass slot handler: reads options into _options for the custom
   * listbox AND clones them into the native <select> for form participation.
   * Handles both top-level <option> and <optgroup> children.
   */
  /** @internal */
  private _handleSlotChange(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const parsed: SelectOption[] = [];

    // Remove previously cloned options from native select
    if (this._select) {
      this._select.querySelectorAll('option[data-cloned]').forEach((opt) => opt.remove());
    }

    const cloneIntoSelect = (optEl: HTMLOptionElement): void => {
      if (!this._select) return;
      const clone = optEl.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    };

    for (const el of slot.assignedElements({ flatten: true })) {
      if (el instanceof HTMLOptionElement) {
        parsed.push(this._parseOption(el));
        cloneIntoSelect(el);
      } else if (el instanceof HTMLOptGroupElement) {
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLOptionElement) {
            parsed.push(this._parseOption(child));
            cloneIntoSelect(child);
          }
        }
      }
    }

    this._options = parsed;

    if (parsed.length === 0) {
      devWarn(
        'hx-select',
        'hx-select has no options — add <option> or <optgroup> elements as children.',
      );
    }

    if (this._select) {
      if (this.value) {
        this._select.value = this.value;
      } else if (!this.placeholder && parsed.length > 0) {
        this.value = this._select.value;
        this._updateFormValue();
      }
    }
  }

  // ─── Slot Change Handlers ───

  /**
   * Round-2 finding 3: tracks the slotted label so projected `<span slot="label">`
   * content joins the accessible-name chain without forcing the consumer to
   * also pass the `label` property. Mirrors the `hx-time-picker` pattern:
   * assign a stable id, expose it as `_slottedLabelId`, and re-resolve the
   * label element in `_syncHostAriaSemantics`. `slotchange` fires once on
   * connect for any initially projected children, so the ARIA chain is
   * primed before `firstUpdated`.
   * @internal
   */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const nodes = e.target.assignedNodes({ flatten: true });
    this._hasLabelSlot = nodes.length > 0;
    if (this._hasLabelSlot) {
      const labelEl = nodes.find((n) => n.nodeType === Node.ELEMENT_NODE) as HTMLElement | undefined;
      if (labelEl) {
        if (!labelEl.id) {
          labelEl.id = `${this._selectId}-slotted-label`;
        }
        this._slottedLabelId = labelEl.id;
      } else {
        // Slot has only text nodes — no element to id, fall through to
        // text-only naming via internals.ariaLabel.
        this._slottedLabelId = '';
      }
    } else {
      this._slottedLabelId = '';
    }
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasErrorSlot = e.target.assignedNodes({ flatten: true }).length > 0;
    // Group 2 round-23 P2 (Finding C): re-tune the in-place text observer
    // over the new assigned-node set so in-place `textContent` rewrites of
    // slotted error nodes resync `internals.ariaDescription` on the no-IDL-ref
    // fallback path. `slotchange` only fires when the *node set* changes.
    this._installErrorSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasHelpSlot = e.target.assignedNodes({ flatten: true }).length > 0;
    this._installHelpSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  // ─── Dropdown Control ───

  /** @internal */
  private _toggleDropdown(): void {
    if (!this.disabled) {
      this.open = !this.open;
      if (this.open) {
        // Pre-focus the currently selected option (or first enabled) when opening
        const selectedIndex = this._options.findIndex((o) => o.value === this.value);
        this._focusedOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
      } else {
        this._focusedOptionIndex = -1;
      }
    }
  }

  // ─── Keyboard Navigation ───

  /** @internal */
  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const enabledIndices = this._options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled)
      .map(({ i }) => i);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : 0;
          break;
        }
        const nextDown = enabledIndices.find((i) => i > this._focusedOptionIndex);
        this._focusedOptionIndex =
          nextDown !== undefined ? nextDown : (enabledIndices[0] ?? this._focusedOptionIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          const lastEnabled = enabledIndices[enabledIndices.length - 1];
          this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : 0;
          break;
        }
        const prevUp = [...enabledIndices].reverse().find((i) => i < this._focusedOptionIndex);
        const lastEnabledUp = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex =
          prevUp !== undefined ? prevUp : (lastEnabledUp ?? this._focusedOptionIndex);
        break;
      }
      case 'Home': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        }
        this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : 0;
        break;
      }
      case 'End': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        }
        const lastEnabled = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : 0;
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          const selIdx = this._options.findIndex((o) => o.value === this.value);
          this._focusedOptionIndex = selIdx >= 0 ? selIdx : (enabledIndices[0] ?? 0);
          break;
        }
        if (this._focusedOptionIndex >= 0 && this._focusedOptionIndex < this._options.length) {
          const opt = this._options[this._focusedOptionIndex];
          if (opt) this._selectOption(opt);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this.open = false;
        this._focusedOptionIndex = -1;
        this._trigger?.focus();
        break;
      }
      case 'Tab': {
        // Close the dropdown but allow Tab to move focus naturally
        if (this.open) {
          this.open = false;
          this._focusedOptionIndex = -1;
        }
        break;
      }
      default: {
        // Typeahead: single printable character jumps to first matching option
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
          const char = e.key.toLowerCase();
          const startIndex = this.open ? this._focusedOptionIndex + 1 : 0;
          const matching = this._options
            .map((o, i) => ({ o, i }))
            .filter(({ o }) => !o.disabled && o.label.toLowerCase().startsWith(char));
          const afterCurrent = matching.find(({ i }) => i >= startIndex);
          const target = afterCurrent ?? matching[0];
          if (target) {
            if (!this.open) {
              this.open = true;
            }
            this._focusedOptionIndex = target.i;
            e.preventDefault();
          }
        }
        break;
      }
    }
  }

  // ─── Selection ───

  /** @internal */
  private _selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.value = option.value; // triggers updated() → sync + formValue + validity
    this._handleInteractionInput();
    this._handleInteractionBlur();
    this._dispatchChange();
    this.open = false;
    this._focusedOptionIndex = -1;
  }

  // ─── Event Dispatchers ───

  /** @internal */
  private _dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleNativeChange(e: Event): void {
    this.value = (e.target as HTMLSelectElement).value; // triggers updated()
    this._handleInteractionInput();
    this._handleInteractionBlur();
    this._dispatchChange();
  }

  // ─── Outside Click Handler ───

  /** @internal */
  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this.open && !e.composedPath().includes(this)) {
      this.open = false;
    }
  };

  // ─── Public Methods ───

  /** Moves focus to the visible trigger button. */
  override focus(options?: FocusOptions): void {
    this._trigger?.focus(options);
  }

  // ─── Render Helpers ───

  /** @internal */
  private _optionId(index: number): string {
    return `hx-select-option-${this._selectId}-${index}`;
  }

  /** @internal */
  private _renderOptions() {
    if (this._options.length === 0) {
      return html`<div class="field__no-options">${this.labelNoOptions}</div>`;
    }

    return repeat(
      this._options,
      (opt) => opt.value,
      (opt, index) => {
        const isSelected = opt.value === this.value;
        const isFocused = index === this._focusedOptionIndex;

        return html`
          <div
            id=${this._optionId(index)}
            part="option"
            role="option"
            class=${classMap({
              field__option: true,
              'field__option--selected': isSelected,
              'field__option--focused': isFocused,
              'field__option--disabled': opt.disabled,
            })}
            aria-selected=${isSelected ? 'true' : 'false'}
            aria-disabled=${opt.disabled ? 'true' : nothing}
            @click=${() => this._selectOption(opt)}
          >
            <span class="field__option-label">${opt.label}</span>
          </div>
        `;
      },
    );
  }

  // ─── Main Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--open': this.open,
    };

    const triggerClasses = {
      field__trigger: true,
      [`field__trigger--${this.size}`]: true,
      'field__trigger--placeholder': !this.value,
    };

    const selectClasses = {
      field__select: true,
      [`field__select--${this.size}`]: true,
    };

    // Round-2 finding 1: both paths drop the inner-trigger and hidden-native
    // ARIA mirror. Modern path: host owns labelledby/describedby/required/
    // invalid via ElementInternals. Fallback path: the host carries the
    // combobox role + ARIA mirror as an attribute (see `_writeHostFallbackAria`),
    // and the inner trigger drops its role so AT does not announce a doubled
    // accessible. The hidden native `<select>` is `aria-hidden="true"`, so it
    // is never the announced surface and needs no ARIA either way.

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`<label
                part="label"
                class="field__label"
                id=${this._labelId}
                for=${this._selectId}
              >
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <!-- Select Wrapper: trigger + listbox -->
        <div part="select-wrapper" class="field__select-wrapper">
          <!--
            Custom trigger — div carries role=combobox per the APG combobox
            pattern. Path A: the host stays roleless via internals so the inner
            combobox role remains canonical and AT does not see a doubled
            accessible. On the modern path (_supportsIdrefRefs) the host owns
            labelledby/describedby/required/invalid via ElementInternals, so
            we omit those attributes here.
          -->
          <div
            part="trigger"
            id=${this._selectId}
            class=${classMap(triggerClasses)}
            role=${this._useFallbackHostRole ? nothing : 'combobox'}
            tabindex=${this.disabled ? '-1' : '0'}
            aria-expanded=${this._useFallbackHostRole ? nothing : this.open ? 'true' : 'false'}
            aria-haspopup=${this._useFallbackHostRole ? nothing : 'listbox'}
            aria-controls=${this._useFallbackHostRole ? nothing : this._listboxId}
            aria-activedescendant=${this._useFallbackHostRole
              ? nothing
              : this.open && this._focusedOptionIndex >= 0
                ? this._optionId(this._focusedOptionIndex)
                : nothing}
            aria-invalid=${nothing}
            aria-describedby=${nothing}
            aria-required=${nothing}
            aria-disabled=${this._useFallbackHostRole ? nothing : this.disabled ? 'true' : nothing}
            aria-labelledby=${nothing}
            aria-label=${this._useFallbackHostRole
              ? nothing
              : (this.getAttribute('aria-label')?.trim() ||
                  this.label ||
                  this.accessibleLabel ||
                  nothing)}
            @click=${this._toggleDropdown}
            @keydown=${this._handleKeydown}
          >
            <span class="field__trigger-value"
              >${this._displayValue || this.placeholder || nothing}</span
            >
            <span class="field__chevron" aria-hidden="true"></span>
          </div>

          <!-- Custom Listbox Panel -->
          <div
            part="listbox"
            role="listbox"
            id=${this._listboxId}
            class="field__listbox"
            aria-label=${ifDefined(this.label || this.accessibleLabel || undefined)}
            ?hidden=${!this.open}
          >
            <div class="field__options">${this._renderOptions()}</div>
          </div>

          <!-- Hidden native select (form participation + test compat) -->
          <select
            part="select"
            class=${classMap(selectClasses)}
            tabindex="-1"
            aria-hidden="true"
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            @change=${this._handleNativeChange}
          >
            ${this.placeholder
              ? html`<option value="" disabled selected>${this.placeholder}</option>`
              : nothing}
          </select>
        </div>

        <!-- Hidden slot (options are read from here) -->
        <slot @slotchange=${this._handleSlotChange} style="display:none;"></slot>

        <!--
          Persistent error live region. role="alert" is set from first paint
          so the WAI-ARIA contract for live updates is honoured: content
          changes in place rather than the container being toggled. Aligned
          with Group 2 round-1 finding #10.
        -->
        <div
          part="error"
          class="field__error"
          id=${this._errorId}
          role="alert"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this._handleErrorSlotChange}
            >${this._announcedError}</slot
          >
        </div>

        <!--
          Persistent help-text container. Rendered whenever the property OR
          the slot has content; hidden when an error is present so guidance
          does not compete with validation feedback. Always in the shadow
          tree so the host's aria-describedby chain is stable.
        -->
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

/**
 * Per-component event map for type-safe addEventListener on hx-select.
 * The `hx-change` detail is `{ value: string }` only — no `checked` property.
 */
export interface HxSelectEventMap {
  'hx-change': CustomEvent<{ value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-select': HelixSelect;
  }
}

export type { HelixSelect as HxSelect };
