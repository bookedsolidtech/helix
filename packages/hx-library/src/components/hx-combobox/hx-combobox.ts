import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import '../hx-icon/hx-icon.js';
import { helixComboboxStyles } from './hx-combobox.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

// PERF: hx-combobox exceeds 5KB budget (6.87kb gzipped) -- typeahead filtering, multi-select chips, async loading

// ─── Internal option model ───

// P1-7: Exported so TypeScript consumers can type option arrays programmatically
export interface ComboboxOption {
  value: string;
  label: string;
  disabled: boolean;
}

// P2-13: Exported size type for TypeScript consumers
export type HxComboboxSize = 'sm' | 'md' | 'lg';

const _nextComboboxId = createIdCounter('hx-combobox');

/**
 * AccName-aware text flattener. Walks the subtree of `root` and concatenates
 * text-node content, REJECTING any element subtree carrying `aria-hidden="true"`
 * or the `hidden` attribute per W3C AccName 1.2 §4.3.10. Used by hx-combobox
 * for both external IDREF flatten (host aria-labelledby/aria-describedby
 * targets) and slotted-label aggregation, so nested decorative content like
 * `<svg aria-hidden="true"><title>icon</title></svg>` does not leak into the
 * inner input's announced name/description.
 *
 * Round-11 F1/F2 (P2): the TreeWalker filter only inspects elements VISITED
 * during the walk — it never tests the root itself, so a hidden ROOT (e.g.
 * `<span slot="label" hidden>Secret</span>` or
 * `<span slot="help-text" aria-hidden="true">stale</span>`) would still
 * contribute its descendants' text. Per AccName 1.2 §4.3.10, a hidden root
 * contributes the empty string. Gate the walk here so every caller (slotted
 * label/help/error and external IDREF flatten) honors the rule symmetrically.
 */
function flattenAccName(root: Element): string {
  if (root.getAttribute('aria-hidden') === 'true' || root.hasAttribute('hidden')) {
    return '';
  }
  let result = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.getAttribute('aria-hidden') === 'true') {
          return NodeFilter.FILTER_REJECT;
        }
        if (el.hasAttribute('hidden')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let textNode: Node | null = walker.nextNode();
  while (textNode) {
    result += textNode.textContent ?? '';
    textNode = walker.nextNode();
  }
  return result.replace(/\s+/g, ' ').trim();
}

/** Detail for hx-input and hx-change events dispatched by hx-combobox. */
export interface HxComboboxDetail {
  value: string;
}

/**
 * A form-associated combobox component combining a text input with a listbox
 * for autocomplete and typeahead. Supports filtering, free-text entry,
 * keyboard navigation, and async option loading.
 *
 * @summary Form-associated combobox with autocomplete, filtering, and keyboard navigation.
 *
 * @tag hx-combobox
 *
 * @slot option - Slot for `<option>` elements that populate the listbox.
 * @slot prefix - Content to display before the text input.
 * @slot suffix - Content to display after the text input.
 * @slot empty-label - Content shown when no options match the filter.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on each keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when an option is selected.
 * @fires {CustomEvent<void>} hx-clear - Dispatched when the clear button is activated.
 * @fires {CustomEvent<void>} hx-show - Dispatched when the listbox opens.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes.
 *
 * @csspart input - The native text input element.
 * @csspart listbox - The dropdown panel containing options.
 * @csspart trigger - The input wrapper element acting as the combobox trigger.
 * @csspart clear-button - The button that clears the current value.
 * @csspart loading-indicator - The loading spinner shown during async operations.
 * @csspart field - The outer field wrapper element.
 * @csspart label - The label element.
 * @csspart option - An individual option item in the listbox.
 * @csspart error - The error message element.
 * @csspart help-text - The help text element.
 *
 * @cssprop [--hx-combobox-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-combobox-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-combobox-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-combobox-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-combobox-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-combobox-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-combobox-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-combobox-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-combobox-listbox-bg=var(--hx-color-neutral-0)] - Listbox background color.
 * @cssprop [--hx-combobox-option-hover-bg=var(--hx-color-primary-50)] - Option hover background.
 * @cssprop [--hx-combobox-option-selected-bg=var(--hx-color-primary-100)] - Selected option background.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-input-height-md] - Height.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-touch-target-min] - Minimum 44px touch-target floor (WCAG 2.5.5).
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-input-height-sm] - Height.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-input-height-lg] - Height.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-border-radius-full] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 * @cssprop [--hx-combobox-listbox-shadow] - CSS custom property.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-combobox-listbox-max-height=16rem] - Height.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-combobox-option-focus-ring-offset=-2px] - Focus ring styling.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-combobox-chip-bg=var(--hx-color-primary-100)] - Background color.
 * @cssprop [--hx-combobox-chip-color=var(--hx-color-primary-800)] - Color.
 * @cssprop [--hx-color-primary-800] - Color.
 * @cssprop [--hx-combobox-chip-remove-hover-bg=var(--hx-color-primary-200)] - Background color.
 * @cssprop [--hx-color-primary-200] - Color.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-combobox/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow,Home,End; activate=Enter; dismiss=Escape; disabled-suppresses=true
 * @aria-pattern combobox
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-combobox
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-combobox')
export class HelixCombobox extends FormMixin(HelixElement) {
  static override styles = [helixComboboxStyles, forcedColorsField];

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  /**
   * Test seam (round-3 finding 4): when set to `true` or `false`, overrides
   * the platform `supportsIdrefElementReferences` probe before
   * `connectedCallback` seeds `_supportsIdrefRefs`. Mid-life flag flips on a
   * connected instance allowed stale modern internals (set during connect)
   * to leak into the fallback branch — tests must select the path BEFORE
   * the host connects so the synthetic environment matches a legacy engine.
   *
   * Production code MUST NOT touch this field. It is a `static` so the test
   * stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  // ─── Stable IDs ───

  /** @internal */
  private _id = _nextComboboxId();
  /** @internal */
  private _listboxId = `${this._id}-listbox`;
  /** @internal */
  private _helpTextId = `${this._id}-help`;
  /** @internal */
  private _errorId = `${this._id}-error`;
  /** @internal */
  private _labelId = `${this._id}-label`;
  /** @internal */
  private _liveRegionId = `${this._id}-live`;
  /**
   * Round-5 F1 (P1): id of the synthesized in-shadow span that mirrors the
   * consumer-resolved description text. This id is appended to the inner
   * input's `aria-describedby` so AT picks the consumer description up
   * through the standard described-by channel — `aria-description` is
   * intentionally NOT written, because the W3C AccName algorithm ignores
   * `aria-description` whenever `aria-describedby` is also present.
   * @internal
   */
  private _consumerDescId = `${this._id}-consumer-desc`;

  // ─── Public Properties ───

  /**
   * The visible label text for the combobox.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown in the input when no value is entered.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the combobox.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Whether the combobox is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the combobox is disabled.
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
   * Help text displayed below the combobox for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Size variant of the combobox.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether multiple options can be selected.
   * @attr multiple
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Whether the combobox shows a clear button when a value is set.
   * @attr clearable
   */
  @property({ type: Boolean, reflect: true })
  clearable = false;

  /**
   * Whether the combobox is in a loading state (shows spinner).
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Debounce delay in milliseconds for the filter input event.
   * @attr filter-debounce
   */
  @property({ type: Number, attribute: 'filter-debounce' })
  filterDebounce = 0;

  /**
   * Accessible name for screen readers, if different from the visible label.
   * Uses `accessible-label` attribute instead of `aria-label` to avoid
   * ARIAMixin shadowing on the host element.
   *
   * Note: `mixinDelegatesAria` is not applied to this component because form
   * inputs with associated labels delegate accessible naming via `<label>`
   * association and `aria-labelledby`, not host-level ARIA delegation. The
   * `accessible-label` attribute is a fallback for label-free usage. The value is forwarded to the
   * host's `internals.ariaLabel` on the modern path.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | null = null;

  /**
   * Text shown when no options match the current filter.
   * @attr label-no-options
   */
  @property({ type: String, attribute: 'label-no-options' })
  labelNoOptions = 'No options found';

  /**
   * Validation message shown when the field is required but empty.
   * @attr label-required
   */
  @property({ type: String, attribute: 'label-required' })
  labelRequired = 'Please select an option.';

  /**
   * Generates the accessible label for multi-select chip remove buttons.
   * @param label - the option label text
   */
  @property({ attribute: false })
  labelRemoveOption: (label: string) => string = (label) => `Remove ${label}`;

  // ─── Internal State ───

  /** Parsed option models derived from slotted `<option>` and `<optgroup>` elements. @internal */
  @state() private _options: ComboboxOption[] = [];
  /** Current text typed in the input, used to filter the option list. @internal */
  @state() private _filterText = '';
  /** Whether the listbox dropdown is currently visible. @internal */
  @state() private _open = false;
  /** Zero-based index of the keyboard-focused option within the filtered list; -1 means none. @internal */
  @state() private _focusedOptionIndex = -1;
  /** Whether the named error slot contains projected content. @internal */
  @state() private _hasErrorSlot = false;
  /** Whether the named help-text slot contains projected content. @internal */
  @state() private _hasHelpSlot = false;
  /** Live-region announcement text describing the current number of filtered options. @internal */
  @state() private _filterAnnouncement = '';
  /**
   * Source of the accessible name. Discriminated union replaces the magic
   * `'*slotted*'` sentinel so a future caller setting `label="*slotted*"`
   * literally cannot be confused with a slotted label.
   * @internal
   */
  @state() private _labelSource: 'string' | 'slot' | 'none' = 'none';
  /**
   * Flattened, trimmed text content of any text nodes in the label slot —
   * used to drive `internals.ariaLabel` when the consumer projects only a
   * text node (no element to add to `labelEls`).
   * @internal
   */
  @state() private _labelSlotText = '';
  /**
   * Whether the named label slot contributes a useful name. Requires either
   * a labellable element OR non-empty trimmed text content (whitespace-only
   * does NOT count).
   * @internal
   */
  @state() private _hasLabelSlot = false;
  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the cross-shadow naming strategy for the inner `<input>`: modern
   * path resolves consumer light-DOM IDREFs and writes them as cloned/proxied
   * ids into the inner input's `aria-labelledby` / `aria-describedby`;
   * fallback path mirrors only consumer `aria-labelledby` / `aria-describedby`
   * tokens (resolved through the IDREF resolver) onto the inner input.
   *
   * ARCHITECTURE — W3C APG editable combobox (option I):
   * `role="combobox"` lives on the inner `<input>` (replaces the implicit
   * textbox role). All combobox state ARIA — `aria-expanded`, `aria-controls`,
   * `aria-activedescendant`, `aria-autocomplete`, `aria-haspopup`,
   * `aria-required`, `aria-invalid`, `aria-disabled`, `aria-busy` — lives on
   * the inner input. The host carries no role and no tabindex; it is not a
   * tab stop and not an announced AT surface.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;
  /**
   * Cached invalidity flag derived from `internals.validity.valid` after the
   * latest `setValidity()` call. Drives the inner input's `aria-invalid`.
   * @internal
   */
  @state() private _invalid = false;
  /**
   * Deferred copy of `error` driven through reactive state so the persistent
   * live region can re-announce on transitions without direct DOM mutation.
   * @internal
   */
  @state() private _announcedError = '';

  // ─── Queries ───

  /** Reference to the native text input element inside the shadow DOM. @internal */
  @query('.field__input')
  private _input: HTMLInputElement | undefined;

  // ─── Debounce timer ───

  /** @internal */
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Multiple Selection ───

  // P0-1: Derive selected values Set from the comma-separated value property
  /** @internal */
  private get _selectedValuesSet(): Set<string> {
    if (!this.multiple || !this.value) return new Set();
    return new Set(this.value.split(',').filter(Boolean));
  }

  // ─── Filtered options ───

  /** @internal */
  private get _filteredOptions(): ComboboxOption[] {
    if (!this._filterText) return this._options;
    const lower = this._filterText.toLowerCase();
    return this._options.filter((o) => o.label.toLowerCase().includes(lower));
  }

  // ─── Host-canonical ARIA bookkeeping ───

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;
  /**
   * Watches assigned `<slot name="help-text">` nodes for in-place text
   * mutations so the no-IDL-ref fallback `internals.ariaDescription` stays in sync.
   * @internal
   */
  private _helpSlotTextObserver: MutationObserver | null = null;
  /**
   * Watches assigned `<slot name="error">` nodes for in-place text mutations.
   * @internal
   */
  private _errorSlotTextObserver: MutationObserver | null = null;
  /**
   * Round-10 finding 1: dedicated host observer scoped to `aria-describedby`
   * with `attributeOldValue: true`. Governed by the disconnect-during-strip
   * discipline. See `_syncHostAriaSemantics` fallback branch.
   * @internal
   */
  private _hostDescribedByObserver: MutationObserver | null = null;
  /**
   * Most recently observed *consumer-supplied* `aria-labelledby` baseline.
   * Refreshed only when the host attribute changes via an external write.
   * On the modern path the host attribute is preserved; on the legacy
   * fallback the attribute is stripped during sync, so this baseline is the
   * only durable record of what the consumer asked for.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;
  /** @internal — see `_consumerLabelledBy`. */
  private _consumerDescribedBy: string | null = null;
  /**
   * Direct references to ALL labellable elements projected into
   * `<slot name="label">`. Round-4 F1 (P2): aggregating every assigned element
   * — not just the first — preserves composed labels such as
   * `<svg slot="label" aria-hidden="true">…</svg><span slot="label">Patient</span>`
   * or `<span slot="label">First</span><span slot="label">name</span>`. The
   * modern path passes the full array to `internals.ariaLabelledByElements`
   * and the fallback path text-flattens every node into `_labelSlotText` per
   * AccName 1.2. Avoids mutating consumer light-DOM and survives nested
   * shadow roots without fragile getElementById chains.
   * @internal
   */
  private _slottedLabelEls: Element[] = [];
  /**
   * Round-4 F2 (P2): observes in-place text mutations on the assigned slotted
   * label nodes (e.g. consumer i18n re-renders that mutate the same
   * `<span slot="label">` `textContent` instead of replacing it). Mirrors the
   * round-23 P2 pattern from `_helpSlotTextObserver` / `_errorSlotTextObserver`.
   * `slotchange` does NOT fire when only the descendant text mutates, so this
   * observer is the only signal that keeps the no-IDL-ref fallback
   * `aria-label` and the announced name in sync with the visible label.
   * @internal
   */
  private _labelSlotTextObserver: MutationObserver | null = null;
  /**
   * Round-7 F1 (P2): observes in-place text mutations on consumer light-DOM
   * elements resolved from host `aria-labelledby` / `aria-describedby`. When a
   * consumer keeps the same `<label id="...">` but mutates its `textContent`
   * (e.g. an i18n rerender), `slotchange` does not fire and the host
   * attribute does not change — so without this observer the inner input's
   * `aria-label` and the synthesized description span keep announcing the
   * old flattened text indefinitely. Reinstalled on every sync against the
   * deduped union of resolved label/desc elements; disconnects automatically
   * when the consumer retracts both attribute chains.
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Round-3 finding 4: honour the static test override so synthetic
    // environments choose the path BEFORE connect runs.
    const ctor = this.constructor as typeof HelixCombobox;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // Round-10 finding 1: install the dedicated `aria-describedby` retraction
    // observer BEFORE the seeded `_syncHostAriaSemantics()` call below, then
    // govern its lifetime with the disconnect-during-strip discipline.
    this._hostDescribedByObserver = new MutationObserver((records) => {
      let consumerCleared = false;
      for (const record of records) {
        if (record.attributeName !== 'aria-describedby') continue;
        const oldValue = record.oldValue;
        const newValue = this.getAttribute('aria-describedby');
        if (oldValue !== null && newValue === null) {
          // Consumer authentically retracted `aria-describedby`.
          this._consumerDescribedBy = null;
          consumerCleared = true;
        }
      }
      if (consumerCleared) {
        this._syncHostAriaSemantics();
      }
    });
    this._hostDescribedByObserver.observe(this, {
      attributes: true,
      attributeFilter: ['aria-describedby'],
      attributeOldValue: true,
    });

    // Seed root-independent semantics from connect so the host announces
    // combobox role before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Safety net: remove listener if component is removed while dropdown is open
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this._handleOutsideClick);
    }
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }
    // Reset open state to prevent persisted open state on reconnect
    if (this._open) {
      this._open = false;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._helpSlotTextObserver?.disconnect();
    this._helpSlotTextObserver = null;
    this._errorSlotTextObserver?.disconnect();
    this._errorSlotTextObserver = null;
    this._labelSlotTextObserver?.disconnect();
    this._labelSlotTextObserver = null;
    this._hostDescribedByObserver?.disconnect();
    this._hostDescribedByObserver = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._updateFormValue();
    }
    if (changedProperties.has('label')) {
      this._refreshLabelSource();
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Drive re-announcement from reactive state so the persistent live region
    // stays in the shadow tree across error transitions.
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

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    // Round-7 F2 (P2) / round-10 F2 (P2): seed `_announcedError` BEFORE render
    // so the persistent live region renders with the error text in the SAME
    // frame that removes `hidden` from the alert container.
    //
    // Round-7 covered first paint (initial property/attribute). Round-10
    // extended this to RUNTIME transitions: when `error` flips from "" to
    // "Server rejected" via async/server-side validation, updating
    // `_announcedError` only in `updated()` left one frame where the alert
    // container was visible but empty — `aria-describedby` also pointed at an
    // empty error node for that cycle. Seeding here keeps the first visible
    // frame populated.
    //
    // The error-to-error rAF toggle in `updated()` still owns re-announcement
    // semantics for subsequent transitions (clearing then re-setting to force
    // AT to re-read role="alert" content).
    if (changedProperties.has('error') || !this.hasUpdated) {
      this._announcedError = this.error ?? '';
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    // Round-5 F2 (P2): `slotchange` fires as a microtask after the initial
    // synchronous render. Without proactive seeding, the first
    // `_syncHostAriaSemantics()` call (driven from `updated()` in this same
    // cycle, AFTER firstUpdated returns) would observe stale `false` /
    // empty state for `_hasLabelSlot`, `_slottedLabelEls`, `_labelSlotText`,
    // `_hasHelpSlot`, and `_hasErrorSlot`. That would break flows that
    // mount a combobox with slot-only label/help/error and then focus
    // immediately — AT would announce an unnamed control until the
    // microtask `slotchange` corrected the state on the second update.
    //
    // Seed the slot-derived state synchronously here by reading the
    // assigned-nodes lists directly. The slot-change handlers remain wired
    // for subsequent slot mutations; this is purely a first-paint fix.
    this._seedSlotStateSync();
    // WCAG 4.1.2: warn when no accessible name is available. Now that the
    // label-slot state is seeded above, this check sees the same surface
    // area the next sync will, so the warning matches AT-observed reality.
    if (
      !this.label &&
      !this.accessibleLabel &&
      !this._hasLabelSlot &&
      !this.getAttribute('aria-label') &&
      !this.getAttribute('aria-labelledby')
    ) {
      devWarn(
        'hx-combobox',
        'No accessible label provided. Set the `label` attribute, `accessible-label`, `aria-label`, `aria-labelledby`, or project a `<slot name="label">` child. An unlabeled combobox violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  /**
   * Round-5 F2 (P2): synchronous slot-state seed. Mirrors the side effects of
   * the three `_handle*SlotChange` handlers (label / help-text / error) but
   * is driven by direct `slot.assignedNodes()` reads so we can populate the
   * state BEFORE the microtask `slotchange` events fire after the first
   * render. Idempotent — calling it later is a no-op when state already
   * matches the slot contents.
   *
   * Also installs the label slot text observer so consumer in-place text
   * mutations on slotted label nodes are tracked even if the slotchange
   * event has not yet fired.
   * @internal
   */
  private _seedSlotStateSync(): void {
    const root = this.shadowRoot;
    if (!root) return;
    // Label slot — use the existing _readLabelSlotState helper to capture
    // the discriminated state (elements + flattened text + has-useful-name).
    const labelSlot = root.querySelector<HTMLSlotElement>('slot[name="label"]');
    if (labelSlot) {
      const state = this._readLabelSlotState(labelSlot);
      this._hasLabelSlot = state.hasUsefulName;
      this._slottedLabelEls = state.elements;
      this._labelSlotText = state.text;
      // Install the text-mutation observer now so consumer i18n re-renders
      // that mutate the same slotted node's textContent are picked up even
      // before the first slotchange event lands.
      this._installLabelSlotTextObserver(state.elements);
      this._refreshLabelSource();
    }
    // Help-text slot — match `_handleHelpSlotChange` exactly.
    const helpSlot = root.querySelector<HTMLSlotElement>('slot[name="help-text"]');
    if (helpSlot) {
      // Round-6 F1 (P2): use the effective-text reader so first-paint state
      // matches the MO's re-read logic. An empty/whitespace-only slot is NOT
      // a usable help text.
      this._hasHelpSlot = this._readHelpSlotStateSync(helpSlot);
      this._installHelpSlotTextObserver(helpSlot);
    }
    // Error slot — match `_handleErrorSlotChange` exactly.
    const errorSlot = root.querySelector<HTMLSlotElement>('slot[name="error"]');
    if (errorSlot) {
      // Round-6 F1 (P2): use the effective-text reader so first-paint state
      // matches the MO's re-read logic.
      this._hasErrorSlot = this._readErrorSlotStateSync(errorSlot);
      this._installErrorSlotTextObserver(errorSlot);
    }
  }

  /**
   * Reads the label slot's assigned nodes and computes the discriminated
   * naming state. An empty whitespace-only slot does NOT count as a useful
   * name.
   *
   * Round-4 F1 (P2): aggregates ALL assigned elements (not just the first) and
   * concatenates `textContent` from every assigned node — element OR text —
   * trimmed and space-joined per AccName 1.2 text-flatten rules. This preserves
   * composed labels such as
   * `<svg slot="label" aria-hidden="true">…</svg><span slot="label">Patient</span>`
   * or `<span slot="label">First</span><span slot="label">name</span>` on both
   * the modern (`internals.ariaLabelledByElements`) path and the no-IDL-ref
   * fallback (`aria-label`) path.
   *
   * Round-6 F2 (P2): per AccName 1.2 §4.3.10, `aria-hidden="true"` elements
   * contribute zero to the accessible name. They are still tracked in
   * `elements` (so the modern `internals.ariaLabelledByElements` path projects
   * the FULL visible label — icon + text — for AT that walks IDL refs), but
   * they are skipped during text flattening. `hasUsefulName` is gated on the
   * flattened text length, so a slot containing ONLY decorative elements (or
   * empty wrappers) is NOT considered usable: `_labelSource` falls through to
   * the next naming source and the firstUpdated() devWarn fires for unnamed
   * controls. A composed `<svg aria-hidden><span>Patient</span>` slot still
   * resolves: text = "Patient" → usable; both elements still project on the
   * modern path.
   * @internal
   */
  private _readLabelSlotState(slot: HTMLSlotElement): {
    hasUsefulName: boolean;
    elements: Element[];
    text: string;
  } {
    const nodes = slot.assignedNodes({ flatten: true });
    const elements: Element[] = [];
    const fragments: string[] = [];
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        elements.push(el);
        // Per AccName 1.2 §4.3.10, aria-hidden elements contribute zero to the
        // accessible name. Skip their text in the flatten — the element itself
        // remains in `elements` so the modern path still projects it via
        // `internals.ariaLabelledByElements` (full visible-label fidelity).
        if (el.getAttribute('aria-hidden') === 'true') continue;
        // Round-8 F2 (P2): use the deep walker so NESTED aria-hidden / hidden
        // subtrees inside a slotted parent element (e.g. an inline decorative
        // `<svg aria-hidden><title>icon</title></svg>` inside a slotted
        // `<span>Patient</span>`) are skipped per AccName 1.2 §4.3.10.
        const elText = flattenAccName(el);
        if (elText) fragments.push(elText);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const txt = (node.textContent ?? '').trim();
        if (txt) fragments.push(txt);
      }
    }
    const trimmedText = fragments.join(' ').replace(/\s+/g, ' ').trim();
    return {
      // Round-6 F2 (P2): gate on flattened TEXT, not element presence. A slot
      // with only decorative/aria-hidden elements (or empty wrappers) yields
      // text === '' and is NOT a usable name.
      hasUsefulName: trimmedText.length > 0,
      elements,
      text: trimmedText,
    };
  }

  /**
   * Round-6 F1 (P2): re-evaluate the help-text slot's "has meaningful content"
   * state from its current effective text. Mirrors the slotchange-handler
   * logic but is invocable from the in-place mutation observer so that
   * clearing `textContent` on the same slotted node flips `_hasHelpSlot`
   * back to `false` (without this, the help wrapper stays visible, the help
   * id stays in the inner input's `aria-describedby`, and AT keeps announcing
   * stale guidance).
   * @internal
   */
  private _readHelpSlotStateSync(slot: HTMLSlotElement): boolean {
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node.textContent ?? '').trim().length > 0) return true;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Round-10 F3 (P3): use AccName-aware flatten so descendants carrying
        // `aria-hidden="true"` or the `hidden` attribute do NOT count toward
        // "has meaningful content". Raw `textContent` would treat
        // `<span hidden>foo</span>` as non-empty, leaving an empty help
        // description attached to the inner input. The slot-text observer
        // (round-9 F2) watches characterData/childList/attributes so toggling
        // `hidden` on a descendant correctly flips `_hasHelpSlot` to false.
        if (flattenAccName(node as Element).length > 0) return true;
      }
    }
    return false;
  }

  /**
   * Round-6 F1 (P2): re-evaluate the error slot's "has meaningful content"
   * state from its current effective text. Mirrors the slotchange-handler
   * logic but is invocable from the in-place mutation observer so that
   * clearing `textContent` on the same slotted node flips `_hasErrorSlot`
   * back to `false` (without this, the combobox stays in its error state
   * indefinitely: `aria-invalid` stays `true`, the error id stays in
   * `aria-describedby`, and help text stays hidden).
   * @internal
   */
  private _readErrorSlotStateSync(slot: HTMLSlotElement): boolean {
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node.textContent ?? '').trim().length > 0) return true;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Round-10 F3 (P3): same AccName-aware flatten as
        // `_readHelpSlotStateSync` — `<span hidden>foo</span>` or
        // `<span aria-hidden="true">foo</span>` must not keep the combobox
        // in its error state once they are the sole descendants.
        if (flattenAccName(node as Element).length > 0) return true;
      }
    }
    return false;
  }

  // ─── Inner-input ARIA sync (W3C APG editable combobox) ───

  /**
   * Resolves consumer-supplied label/description IDREFs on the host and
   * writes the canonical combobox ARIA onto the **inner `<input>`** per W3C
   * APG editable combobox pattern. The inner input owns `role="combobox"`
   * (replacing its implicit textbox role) and all combobox state ARIA so
   * AT sees a single announced + focused surface.
   *
   * Cross-shadow naming uses a belt-and-suspenders strategy:
   *
   *   1. **Modern path** (`_supportsIdrefRefs === true`): consumer-resolved
   *      label/description elements are written onto
   *      `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements`
   *      on the host. AT that walks up from the focused inner input for naming
   *      finds them through ElementInternals. Host-level `aria-labelledby` /
   *      `aria-describedby` attributes are LEFT IN PLACE so AT walking up the
   *      DOM also sees them. The text content of the resolved elements is also
   *      flattened onto the inner input as `aria-label` / `aria-description`
   *      so AT that does not walk up still announces the right name.
   *
   *   2. **Legacy fallback** (`_supportsIdrefRefs === false`): host attrs are
   *      stripped (AccName precedence cleanup) and the resolved-element text
   *      is flattened onto the inner input as `aria-label` /
   *      `aria-description`. Live updates to the consumer-referenced elements
   *      do not propagate, but the initial accessible name resolves on every
   *      AT — closing the cross-shadow naming gap that broke this on engines
   *      without IDL element references.
   *
   * Writing `aria-labelledby="<light-DOM id>"` directly on the shadow-DOM
   * inner input is INTENTIONALLY avoided: light-DOM ids do not resolve from
   * inside a shadow root, so that pattern leaves the control AT-anonymous.
   * Internal label ids (in the same shadow root) ARE written via
   * `aria-labelledby`.
   * @internal
   */
  /**
   * Round-7 F1 (P2): (re)install a `MutationObserver` against the deduped
   * union of consumer-resolved label/description elements. Watches
   * `characterData`, `childList`, and `subtree` so any in-place text
   * mutation on the referenced light-DOM nodes triggers a fresh sync —
   * keeping the inner input's flattened `aria-label` and the synthesized
   * description span aligned with the live consumer text. Blanket
   * disconnect-and-reinstall on every sync; if the consumer retracts both
   * IDREF chains the union is empty and the observer is disconnected.
   * @internal
   */
  private _installExternalRefsObserver(elements: Element[]): void {
    if (this._externalRefsObserver) {
      this._externalRefsObserver.disconnect();
      this._externalRefsObserver = null;
    }
    if (elements.length === 0) return;
    // Dedupe references in case the same element is referenced from both
    // `aria-labelledby` and `aria-describedby` — observing it once is enough.
    const unique = new Set<Element>(elements);
    const observer = new MutationObserver(() => {
      // External text changed — re-sync, which re-flattens the resolved
      // elements onto the inner input and the synthesized description span.
      this._syncHostAriaSemantics();
    });
    for (const el of unique) {
      // Round-9 F2 (P2): also observe `aria-hidden` / `hidden` toggles on the
      // referenced element AND its descendants. `flattenAccName` skips
      // aria-hidden subtrees per AccName 1.2 §4.3.10, so a consumer flipping
      // visibility in place changes the flattened text — but without attribute
      // observation the inner input keeps its stale mirrored `aria-label` /
      // synthesized description. `subtree: true` combined with `attributes: true`
      // covers descendant attribute mutations too.
      observer.observe(el, {
        characterData: true,
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    }
    this._externalRefsObserver = observer;
  }

  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    const input = this._input;
    if (!input) {
      // Inner input not yet rendered; defer. The post-render `updated()` call
      // will re-invoke this sync once the input exists.
      // Round-12 F3: still derive `_invalid` so `aria-invalid` first-paint
      // is correct once the input renders.
      const isInvalidEarly = !internals.validity.valid || !!(this.error || this._hasErrorSlot);
      this._invalid = isInvalidEarly;
      return;
    }

    // The host carries no `aria-label` we wrote — any live value is purely
    // a consumer override. Forwarded onto the inner input below.
    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() || '' : '';

    // Resolve the candidate label/desc element references once.
    const internalLabel = this.shadowRoot?.getElementById(this._labelId) ?? null;
    // Round-4 F1 (P2): aggregate ALL assigned label-slot elements so composed
    // labels (icon + text, multi-span) name the inner input fully.
    const slottedLabelEls = this._slottedLabelEls;
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId) ?? null;
    const errorEl = this.shadowRoot?.getElementById(this._errorId) ?? null;

    // Refresh the consumer baseline. The host attribute is the live source
    // of truth on BOTH paths (round-12 F4: legacy no longer strips, so the
    // observer-cached fallback is no longer required). A `null` live value
    // authentically represents consumer retraction.
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    this._consumerLabelledBy = liveLabelledBy;
    const liveDescribedBy = this.getAttribute('aria-describedby');
    this._consumerDescribedBy = liveDescribedBy;
    const externalLabelTokens = this._consumerLabelledBy;
    const externalDescTokens = this._consumerDescribedBy;

    const consumerLabelEls = resolveIdrefTokens(this, externalLabelTokens);
    const hasEffectiveLabelledBy = consumerLabelEls.length > 0;

    const consumerDescEls = resolveIdrefTokens(this, externalDescTokens);

    // Round-7 F1 (P2): observe in-place text mutations on the resolved
    // external IDREF targets. Without this, a consumer that mutates
    // `<label id="ext">Patient</label>` → "Member" in place leaves the
    // inner input's flattened `aria-label` stuck on "Patient". Blanket
    // disconnect-and-reinstall keeps the bookkeeping trivial and matches
    // the slotted-label observer pattern.
    this._installExternalRefsObserver([...consumerLabelEls, ...consumerDescEls]);

    const hasError = !!(this.error || this._hasErrorSlot);

    // Round-12 F3: `aria-invalid` reflects EVERY signal the consumer can use
    // to express invalidity. setValidity() drives the required-empty case;
    // an explicit `error` property/slot is a server-/async-validation signal
    // that AT must announce as invalid, not just "described by an alert".
    const isInvalid = !internals.validity.valid || hasError;
    this._invalid = isInvalid;

    // Round-12 F2: `accessibleLabel` is documented as the screen-reader name
    // when it should differ from the visible label. When the consumer
    // explicitly sets it (non-empty), it is the canonical AT name and must
    // override visible label / aria-labelledby — both for the modern path's
    // ElementInternals references and for the inner input's aria-label.
    const explicitAccessibleLabel =
      typeof this.accessibleLabel === 'string' && this.accessibleLabel.trim().length > 0
        ? this.accessibleLabel
        : null;

    // Round-9 F1 (P2): top-level `aria-hidden="true"` / `hidden` elements MUST
    // NOT be forwarded to `internals.ariaLabelledByElements` /
    // `ariaDescribedByElements`. On engines with IDL element refs, AT walks
    // those references and would recursively read e.g. an
    // `<svg aria-hidden="true"><title>icon</title></svg>` slotted alongside a
    // visible `<span slot="label">Patient</span>` — yielding "icon Patient".
    // The fallback text-flatten path already strips these via `flattenAccName`,
    // so the filter aligns the modern path with AccName 1.2 §4.3.10.
    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    // Build the augmented element lists used by the modern (IDL-refs) path.
    // When `accessibleLabel` is the chosen name we omit element references
    // entirely so AT does not double-announce against the explicit override.
    const labelElsForInternals: Element[] = [];
    if (!explicitAccessibleLabel) {
      labelElsForInternals.push(...consumerLabelEls.filter(isVisibleForAccName));
      if (!hasEffectiveLabelledBy && !hostAriaLabel) {
        if (this._labelSource === 'slot' && slottedLabelEls.length > 0) {
          // Round-4 F1 (P2): expose every assigned element so AT can compose
          // the full visible label across icon + text fragments.
          // Round-9 F1 (P2): filter top-level aria-hidden / hidden so the
          // modern path matches the fallback path's AccName behavior. The
          // unfiltered `_slottedLabelEls` is still used downstream by the
          // text-flatten fallback (its TreeWalker handles nested visibility).
          labelElsForInternals.push(...slottedLabelEls.filter(isVisibleForAccName));
        } else if (this._labelSource === 'string' && internalLabel) {
          labelElsForInternals.push(internalLabel);
        }
      }
    }

    // Round-9 F1 (P2): same hidden-filter for description element refs. A
    // consumer-referenced `aria-describedby` target that flips to
    // `aria-hidden="true"` must not name through the modern path.
    const descElsForInternals: Element[] = [...consumerDescEls.filter(isVisibleForAccName)];
    if (helpEl && !hasError && (this.helpText || this._hasHelpSlot)) {
      descElsForInternals.push(helpEl);
    }
    if (errorEl && hasError) {
      descElsForInternals.push(errorEl);
    }

    // ─── Modern-path: ElementInternals IDL element references ───
    // Set when supported so AT walking up from the focused inner input picks
    // up the host's referenced labels/descriptions across the shadow boundary.
    type InternalsWithIdrefRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
      ariaDescribedByElements: Element[] | null;
    };
    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithIdrefRefs;
      refsInternals.ariaLabelledByElements =
        labelElsForInternals.length > 0 ? labelElsForInternals : null;
      refsInternals.ariaDescribedByElements =
        descElsForInternals.length > 0 ? descElsForInternals : null;
      // Modern path: forward `accessibleLabel` to `internals.ariaLabel` so AT
      // walking the host (or reading internals) sees the explicit override.
      // Round-8 F1 (P2): when `accessibleLabel` is absent, CLEAR the override
      // with `null` (not `''`). Per W3C AccName, an empty-string `aria-label`
      // STILL has higher precedence than `aria-labelledby`, so writing `''`
      // would erase the name resolved from `ariaLabelledByElements`, the
      // `label` property, the slotted label, or host `aria-labelledby`. `null`
      // removes the override entirely so element references / fallbacks win.
      if (explicitAccessibleLabel) {
        internals.ariaLabel = explicitAccessibleLabel;
      } else {
        internals.ariaLabel = null;
      }
    }

    // Round-12 F4: the host's `aria-labelledby` / `aria-describedby` are
    // intentionally LEFT IN PLACE on both paths. The inner input owns the
    // canonical AT surface (role="combobox") and consumes the consumer's
    // intent via text-flatten + (modern path) ElementInternals references.
    // The host is roleless on both paths, so leaving these attributes in
    // place has no AT effect — and importantly, lets consumers retract them
    // dynamically: the live attribute IS the cache, so `removeAttribute` is
    // observable in the next sync (it returns `null` from `getAttribute`).

    // ─── Compute the inner input's accessible name (text-flatten path) ───
    // We never write `aria-labelledby="<light-DOM id>"` to the inner input —
    // light-DOM ids do not resolve from inside a shadow root, so that pattern
    // would leave the control AT-anonymous. Internal label ids (same shadow
    // root) ARE allowed via `aria-labelledby`. For consumer-referenced
    // light-DOM elements we flatten their textContent into `aria-label`.
    // Round-8 F2 (P2): use the module-level `flattenAccName` walker which
    // REJECTS `aria-hidden="true"` and `hidden` subtrees per AccName 1.2
    // §4.3.10. Without this, a consumer label like
    // `<label id="x"><svg aria-hidden="true"><title>icon</title></svg>Search</label>`
    // would flatten to "icon Search" and leak the decorative title into the
    // inner input's aria-label / synthesized description span.
    // Round-9 F2 (P2): also strip top-level aria-hidden / hidden roots before
    // flattening. `flattenAccName`'s TreeWalker checks DESCENDANTS, not the
    // root itself, so without this filter a consumer flipping aria-hidden on
    // a referenced label root would leave the mirrored aria-label / consumer
    // description span stale. Mirrors the F1 modern-path filter so both
    // surfaces agree per AccName 1.2 §4.3.10.
    const flattenText = (els: Element[]): string =>
      els
        .filter(isVisibleForAccName)
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ');

    let inputAriaLabel: string | null = null;
    let inputAriaLabelledBy: string | null = null;
    // Round-13 F1 (P2) precedence — aligns with W3C AccName 1.2 §4.3.1, with
    // one helix-specific deviation called out below:
    //   1. `accessibleLabel` (HELIX-SPECIFIC public-API override; documented
    //      contract — see Round-3 F2 from the round-3 push-gate. The property
    //      is the explicit AT-only name and intentionally outranks both
    //      `aria-labelledby` and `aria-label`. The matching modern-path write
    //      above clears `internals.ariaLabel` to `null` when this is unset so
    //      we never erase a labelledby resolution.)
    //   2. consumer `aria-labelledby` resolves → text-flatten (AccName winner
    //      over `aria-label`; previously incorrectly demoted below it, which
    //      meant a consumer setting both saw the inner input announce the
    //      `aria-label` string instead of the referenced label's text)
    //   3. consumer `aria-label` on the host (consumer escape hatch; only
    //      reached when labelledby is absent or unresolvable)
    //   4. slotted label → text content (NEVER cross-shadow id reference)
    //   5. `label` property → internal `<label>` id (same shadow root) or text
    //   6. else: unnamed
    // Round-13 F1 (P2): the labelledby branch is allowed to fall through to
    // the next strategy when `flattenText` returns empty (e.g. the resolved
    // elements are visible-but-empty or filtered by AccName visibility).
    // Without this, an aria-labelledby pointing at an empty target would
    // park `inputAriaLabel` at `null` AND skip the host aria-label fallback,
    // leaving the control AT-anonymous.
    let labelledByFlat = '';
    if (!explicitAccessibleLabel && hasEffectiveLabelledBy) {
      labelledByFlat = flattenText(consumerLabelEls);
    }
    if (explicitAccessibleLabel) {
      inputAriaLabel = explicitAccessibleLabel;
    } else if (labelledByFlat) {
      // Consumer aria-labelledby resolved to one or more elements. Flatten
      // their text into aria-label so the inner input announces correctly
      // regardless of cross-shadow id resolution. The modern-path
      // ElementInternals write above gives AT the live IDREF chain in
      // addition to this flattened text. Round-13 F1 (P2): this branch sits
      // ABOVE the host `aria-label` branch so AccName 1.2 §4.3.1 precedence
      // is preserved when the consumer sets both attributes.
      inputAriaLabel = labelledByFlat;
    } else if (hostAriaLabel) {
      // Round-13 F1 (P2): host aria-label is the next fallback after
      // accessibleLabel + a *resolved* aria-labelledby. Reaching this branch
      // means either no aria-labelledby was set, or its IDREFs did not
      // resolve to any element (e.g. typo, target removed, empty content) —
      // in which case AccName 1.2 falls through to aria-label.
      inputAriaLabel = hostAriaLabel;
    } else if (this._labelSource === 'slot') {
      // Round-12 F1: the slotted label may carry a light-DOM id. We MUST NOT
      // write that id as `aria-labelledby` on the inner input — light-DOM
      // ids do not resolve from inside a shadow root, so on engines without
      // ElementInternals IDL refs the control would be AT-anonymous. Always
      // text-flatten on the legacy/fallback path; the modern path already
      // carries the live element reference via `ariaLabelledByElements`.
      if (this._labelSlotText) {
        inputAriaLabel = this._labelSlotText;
      } else if (slottedLabelEls.length > 0) {
        // Round-4 F1 (P2): flatten textContent across every assigned element.
        // Round-8 F2 (P2): use the deep walker so nested `aria-hidden="true"`
        // (e.g. an inline `<svg aria-hidden><title>icon</title></svg>` inside a
        // slotted `<span>`) does not leak into the inner input's aria-label.
        // The top-level slotted-element aria-hidden filter is already applied
        // by `_readLabelSlotState` when populating `_labelSlotText`; this fall-
        // through aggregator handles the case where text wasn't pre-flattened.
        const flat = flattenText(slottedLabelEls);
        if (flat) inputAriaLabel = flat;
      }
    } else if (this._labelSource === 'string') {
      if (internalLabel?.id) {
        inputAriaLabelledBy = internalLabel.id;
      } else if (this.label) {
        inputAriaLabel = this.label;
      }
    }

    // Apply the resolved name to the inner input via attribute writes.
    if (inputAriaLabelledBy) {
      if (input.getAttribute('aria-labelledby') !== inputAriaLabelledBy) {
        input.setAttribute('aria-labelledby', inputAriaLabelledBy);
      }
      if (input.hasAttribute('aria-label')) input.removeAttribute('aria-label');
    } else if (inputAriaLabel) {
      if (input.getAttribute('aria-label') !== inputAriaLabel) {
        input.setAttribute('aria-label', inputAriaLabel);
      }
      if (input.hasAttribute('aria-labelledby')) input.removeAttribute('aria-labelledby');
    } else {
      if (input.hasAttribute('aria-label')) input.removeAttribute('aria-label');
      if (input.hasAttribute('aria-labelledby')) input.removeAttribute('aria-labelledby');
    }

    // ─── Write the inner input's aria-describedby chain ───
    // Round-5 F1 (P1): unify ALL descriptions through a single
    // `aria-describedby` channel on the inner input. The W3C AccName algorithm
    // ignores `aria-description` whenever `aria-describedby` is also present,
    // so the previous split (internal ids on `aria-describedby`, consumer text
    // on `aria-description`) silently dropped consumer descriptions whenever
    // help/error text was present.
    //
    // For consumer-referenced light-DOM elements we cannot point inner-input
    // `aria-describedby` directly at the consumer ids (light-DOM ids do not
    // resolve from inside a shadow root), so the consumer text is mirrored
    // into a synthesized in-shadow span and that same-root id is added to
    // the chain. The synthesized span is rendered unconditionally with the
    // visually-hidden style and updated here on every sync (idempotent).
    const consumerDescSpan = this.shadowRoot?.getElementById(this._consumerDescId) ?? null;
    const consumerDescText = flattenText(consumerDescEls);
    if (consumerDescSpan && consumerDescSpan.textContent !== consumerDescText) {
      consumerDescSpan.textContent = consumerDescText;
    }

    const describedByIds: string[] = [];
    if (consumerDescText && consumerDescSpan) {
      describedByIds.push(this._consumerDescId);
    }
    if (helpEl && !hasError && (this.helpText || this._hasHelpSlot)) {
      describedByIds.push(this._helpTextId);
    }
    if (errorEl && hasError) {
      describedByIds.push(this._errorId);
    }
    if (describedByIds.length > 0) {
      const value = describedByIds.join(' ');
      if (input.getAttribute('aria-describedby') !== value) {
        input.setAttribute('aria-describedby', value);
      }
    } else if (input.hasAttribute('aria-describedby')) {
      input.removeAttribute('aria-describedby');
    }

    // Round-5 F1 (P1): never write `aria-description` on the inner input.
    // It is silently dropped when `aria-describedby` is also present (a
    // common case once help/error text exists), and we now route consumer
    // descriptions through the synthesized in-shadow span instead. Strip
    // any legacy value defensively in case an earlier sync wrote one.
    if (input.hasAttribute('aria-description')) {
      input.removeAttribute('aria-description');
    }
  }

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * help-text-slot nodes.
   * @internal
   */
  private _installHelpSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._helpSlotTextObserver?.disconnect();
    if (!slot) {
      this._helpSlotTextObserver = null;
      return;
    }
    // Round-6 F1 (P2): capture the slot reference so the MO callback can
    // re-evaluate `_hasHelpSlot` from the slot's current effective text. An
    // in-place `textContent = ''` on the same slotted node leaves
    // `assignedNodes().length > 0` true but yields empty effective text, so
    // we must re-read on every mutation, not just on slotchange.
    const observer = new MutationObserver(() => {
      this._hasHelpSlot = this._readHelpSlotStateSync(slot);
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        observer.observe(node, {
          characterData: true,
          childList: true,
          subtree: true,
        });
        return;
      }
      // Round-9 F2 (P2): observe aria-hidden / hidden toggles so a consumer
      // flipping visibility on the slotted help-text node (or a descendant)
      // re-evaluates effective text and re-syncs the inner input.
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    });
    this._helpSlotTextObserver = observer;
  }

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * error-slot nodes.
   * @internal
   */
  private _installErrorSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._errorSlotTextObserver?.disconnect();
    if (!slot) {
      this._errorSlotTextObserver = null;
      return;
    }
    // Round-6 F1 (P2): capture the slot reference so the MO callback can
    // re-evaluate `_hasErrorSlot` from the slot's current effective text. If
    // a consumer keeps the same `<span slot="error">` node and clears its
    // `textContent`, only the MO fires (no slotchange). Without re-reading the
    // slot state, the combobox stays stuck in its error state: `aria-invalid`
    // remains true, the error id stays in `aria-describedby`, and the help
    // text stays hidden.
    const observer = new MutationObserver(() => {
      this._hasErrorSlot = this._readErrorSlotStateSync(slot);
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        observer.observe(node, {
          characterData: true,
          childList: true,
          subtree: true,
        });
        return;
      }
      // Round-9 F2 (P2): observe aria-hidden / hidden toggles so a consumer
      // flipping visibility on the slotted error node (or a descendant)
      // re-evaluates effective text and re-syncs the inner input.
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
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
      // W3C APG editable combobox: the inner `<input>` is the canonical
      // announced + focused combobox surface, so anchor `setValidity()` to
      // the inner input. Native validation popups attach to the focusable
      // form-control surface.
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.labelRequired,
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
    // Re-sync ARIA after every setValidity() so `aria-invalid` on the inner
    // input reflects the freshly computed validity state. The render template
    // binds `aria-invalid` from `_invalid`; mutating `_invalid` (a `@state`)
    // inside sync schedules a Lit update if the value actually changed.
    this._syncHostAriaSemantics();
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '';
    this._filterText = '';
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  /** @internal */
  // P1-6: Correct signature per WHATWG spec — includes mode param and all state types
  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Option Syncing from Slot ───

  /** @internal */
  private _handleSlotChange(): void {
    this._readOptions();
  }

  /** @internal */
  private _parseOption(el: HTMLOptionElement): ComboboxOption {
    return { value: el.value, label: el.textContent?.trim() ?? el.value, disabled: el.disabled };
  }

  /** @internal */
  private _readOptions(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="option"]');
    if (!slot) return;

    const parsed: ComboboxOption[] = [];

    for (const el of slot.assignedElements({ flatten: true })) {
      if (el instanceof HTMLOptionElement) {
        parsed.push(this._parseOption(el));
      } else if (el instanceof HTMLOptGroupElement) {
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLOptionElement) parsed.push(this._parseOption(child));
        }
      }
    }

    this._options = parsed;
  }

  // ─── Slot Change Handlers ───

  /**
   * Tracks the slotted label so projected `<span slot="label">` content joins
   * the accessible-name chain.
   * @internal
   */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readLabelSlotState(e.target);
    this._hasLabelSlot = state.hasUsefulName;
    this._slottedLabelEls = state.elements;
    this._labelSlotText = state.text;
    // Round-4 F2 (P2): re-install the in-place text-mutation observer on the
    // current set of slotted elements. `slotchange` covers ADD/REMOVE/REPLACE
    // of assigned nodes; this MO covers `node.textContent = '…'` updates on
    // an unchanged node (e.g. consumer i18n re-render keeping the same span).
    this._installLabelSlotTextObserver(state.elements);
    this._refreshLabelSource();
    this._syncHostAriaSemantics();
  }

  /**
   * (Re-)installs the mutation observer over the current set of slotted label
   * elements. Round-4 F2 (P2): mirrors the round-23 P2 pattern from
   * `_helpSlotTextObserver` / `_errorSlotTextObserver`. On any descendant text
   * change we re-read the slot state (to refresh `_labelSlotText` and the
   * element list) and re-sync host ARIA so the inner input's `aria-label`
   * tracks the live label text.
   * @internal
   */
  private _installLabelSlotTextObserver(elements: Element[]): void {
    this._labelSlotTextObserver?.disconnect();
    if (elements.length === 0) {
      this._labelSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      // Re-aggregate text from the same elements (the MO does not give us a
      // slot reference). The element list itself only changes on `slotchange`,
      // which re-installs this observer with the new list.
      //
      // Round-6 F2 (P2): mirror `_readLabelSlotState` — skip aria-hidden
      // elements per AccName 1.2 §4.3.10, and gate `_hasLabelSlot` on the
      // flattened TEXT (not element presence). An in-place clear of the
      // visible label's textContent must flip `_hasLabelSlot` back to false
      // so `_labelSource` falls through to other naming sources or the host
      // becomes unnamed (consumer responsibility).
      const fragments: string[] = [];
      for (const el of elements) {
        if (el.getAttribute('aria-hidden') === 'true') continue;
        // Round-8 F2 (P2): use the deep walker so nested aria-hidden / hidden
        // subtrees inside slotted parents are skipped per AccName 1.2 §4.3.10.
        const t = flattenAccName(el);
        if (t) fragments.push(t);
      }
      const trimmed = fragments.join(' ').replace(/\s+/g, ' ').trim();
      this._labelSlotText = trimmed;
      this._hasLabelSlot = trimmed.length > 0;
      this._refreshLabelSource();
      this._syncHostAriaSemantics();
    });
    for (const el of elements) {
      // Round-9 F2 (P2): observe `aria-hidden` / `hidden` toggles on the
      // slotted label root AND its descendants. The MO callback above re-runs
      // `flattenAccName` and re-derives `_hasLabelSlot` from effective text —
      // so an in-place visibility flip on a child must trigger a fresh sync.
      observer.observe(el, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    }
    this._labelSlotTextObserver = observer;
  }

  /**
   * Recomputes the discriminated label source.
   * @internal
   */
  private _refreshLabelSource(): void {
    if (this.label) {
      this._labelSource = 'string';
    } else if (this._hasLabelSlot) {
      this._labelSource = 'slot';
    } else {
      this._labelSource = 'none';
    }
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    // Round-6 F1 (P2): single-source-of-truth state read.
    this._hasErrorSlot = this._readErrorSlotStateSync(e.target);
    this._installErrorSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    // Round-6 F1 (P2): single-source-of-truth state read.
    this._hasHelpSlot = this._readHelpSlotStateSync(e.target);
    this._installHelpSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  // ─── Dropdown Control ───

  /** @internal */
  private _openDropdown(): void {
    if (this.disabled || this._open) return;
    this._open = true;
    this._focusedOptionIndex = -1;
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this._handleOutsideClick);
    }
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _closeDropdown(): void {
    if (!this._open) return;
    this._open = false;
    this._focusedOptionIndex = -1;
    this._handleInteractionBlur();
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this._handleOutsideClick);
    }
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));
  }

  // ─── Input Handling ───

  /** @internal */
  private _handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._filterText = input.value;

    if (!this._open) {
      this._openDropdown();
    }

    this._focusedOptionIndex = -1;

    if (this.filterDebounce > 0) {
      if (this._debounceTimer !== null) {
        clearTimeout(this._debounceTimer);
      }
      this._debounceTimer = setTimeout(() => {
        this._emitInput();
        this._announceFilterResults();
      }, this.filterDebounce);
    } else {
      this._emitInput();
      this._announceFilterResults();
    }
  }

  /** @internal */
  private _announceFilterResults(): void {
    const count = this._filteredOptions.length;
    this._filterAnnouncement =
      count === 0
        ? 'No matching options'
        : `${count} ${count === 1 ? 'option' : 'options'} available`;
  }

  /** @internal */
  private _emitInput(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this._filterText },
      }),
    );
  }

  /** @internal */
  private _handleFocus(): void {
    this._openDropdown();
  }

  // ─── Keyboard Navigation ───

  /** @internal */
  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const filtered = this._filteredOptions;
    const enabledIndices = filtered
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled)
      .map(({ i }) => i);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : -1;
          break;
        }
        const nextDown = enabledIndices.find((i) => i > this._focusedOptionIndex);
        this._focusedOptionIndex =
          nextDown !== undefined ? nextDown : (enabledIndices[0] ?? this._focusedOptionIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          const lastEnabled = enabledIndices[enabledIndices.length - 1];
          this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : -1;
          break;
        }
        const prevUp = [...enabledIndices].reverse().find((i) => i < this._focusedOptionIndex);
        const lastEnabledUp = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex =
          prevUp !== undefined ? prevUp : (lastEnabledUp ?? this._focusedOptionIndex);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          break;
        }
        if (this._focusedOptionIndex >= 0 && this._focusedOptionIndex < filtered.length) {
          const opt = filtered[this._focusedOptionIndex];
          if (opt) this._selectOption(opt);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeDropdown();
        this._filterText = '';
        if (this._input) this._input.value = '';
        // Note: do NOT call this.focus() here — the inner <input> already has
        // focus when Escape is pressed and refocusing would re-trigger
        // _handleFocus → _openDropdown, immediately re-opening the listbox.
        // The input remains focused so the user can continue typing.
        break;
      }
      case 'Tab': {
        this._closeDropdown();
        break;
      }
      // P1-1: Home/End keyboard navigation for option list
      case 'Home': {
        e.preventDefault();
        if (!this._open) this._openDropdown();
        this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? -1) : -1;
        break;
      }
      case 'End': {
        e.preventDefault();
        if (!this._open) this._openDropdown();
        this._focusedOptionIndex =
          enabledIndices.length > 0 ? (enabledIndices[enabledIndices.length - 1] ?? -1) : -1;
        break;
      }
      default:
        break;
    }
  }

  // ─── Selection ───

  // P0-1: Handle both single and multiple selection modes
  /** @internal */
  private _selectOption(option: ComboboxOption): void {
    if (option.disabled) return;
    if (this.multiple) {
      const current = this._selectedValuesSet;
      const next = new Set(current);
      if (next.has(option.value)) {
        next.delete(option.value);
      } else {
        next.add(option.value);
      }
      this.value = [...next].join(',');
      // Keep dropdown open for multiple selection so user can pick more
    } else {
      this.value = option.value;
      this._closeDropdown();
    }
    this._handleInteractionInput();
    this._filterText = '';
    if (this._input) this._input.value = '';
    this._dispatchChange();
  }

  // P0-1: Remove a single value from multi-selection
  /** @internal */
  private _removeValue(val: string): void {
    const next = this._selectedValuesSet;
    next.delete(val);
    this.value = [...next].join(',');
    this._dispatchChange();
  }

  // ─── Clear ───

  /** @internal */
  private _handleClear(e: Event): void {
    e.stopPropagation();
    this.value = '';
    this._filterText = '';
    if (this._input) {
      this._input.value = '';
      this._input.focus();
    }
    this._internals.setFormValue(null);
    this._updateValidity();
    this.dispatchEvent(new CustomEvent<void>('hx-clear', { bubbles: true, composed: true }));
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

  // ─── Outside Click Handler ───

  /** @internal */
  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this._open && !e.composedPath().includes(this)) {
      this._closeDropdown();
    }
  };

  // ─── Public Methods ───

  /**
   * Routes programmatic focus to the inner text input. Per W3C APG editable
   * combobox pattern, the inner `<input>` carries `role="combobox"` (replacing
   * its implicit textbox role) so it IS the canonical announced + focused
   * surface. Shadow DOM focus causes `document.activeElement` to report the
   * host externally, but the input retains focus inside the shadow root and
   * AT announces its role/state.
   */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  // ─── Render Helpers ───

  /** @internal */
  private _optionId(index: number): string {
    return `${this._id}-option-${index}`;
  }

  /** @internal */
  private get _displayValue(): string {
    // P0-1: In multiple mode, chips render selected values — input shows only filter text
    if (this.multiple) return '';
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  /** @internal */
  private _renderOptions() {
    const filtered = this._filteredOptions;

    if (filtered.length === 0) {
      return html`
        <slot name="empty-label">
          <div class="field__no-options">${this.labelNoOptions}</div>
        </slot>
      `;
    }

    return repeat(
      filtered,
      (opt) => opt.value,
      (opt, index) => {
        // P0-1: Use Set membership for multiple mode, direct equality for single mode
        const isSelected = this.multiple
          ? this._selectedValuesSet.has(opt.value)
          : opt.value === this.value;
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
            aria-selected=${this.multiple
              ? isSelected
                ? 'true'
                : 'false'
              : isSelected
                ? 'true'
                : nothing}
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
    const showClear = this.clearable && !!this.value && !this.disabled;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--open': this._open,
    };

    const inputClasses = {
      field__input: true,
      [`field__input--${this.size}`]: true,
    };

    // W3C APG editable combobox (option I): role="combobox" lives on the
    // inner <input>, replacing the implicit textbox role so AT sees a single
    // canonical announced + focused surface. All combobox state ARIA —
    // aria-expanded, aria-controls, aria-activedescendant, aria-autocomplete,
    // aria-haspopup, aria-required, aria-invalid, aria-disabled, aria-busy —
    // is bound on the input via Lit. aria-label / aria-labelledby /
    // aria-describedby are written imperatively by _syncHostAriaSemantics
    // after consumer-IDREF resolution.
    const activeOptionId =
      this._open && this._focusedOptionIndex >= 0 ? this._optionId(this._focusedOptionIndex) : '';

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`<label id=${this._labelId} for=${this._id} part="label" class="field__label">
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <!-- Input Wrapper -->
        <div part="trigger" class="field__input-wrapper">
          <!-- Prefix Slot -->
          <slot name="prefix" class="field__prefix"></slot>

          <!-- P0-1: Selected value chips for multiple mode -->
          ${this.multiple && this._selectedValuesSet.size > 0
            ? [...this._selectedValuesSet].map((val) => {
                const opt = this._options.find((o) => o.value === val);
                const label = opt ? opt.label : val;
                return html`
                  <span class="field__chip">
                    <span class="field__chip-label">${label}</span>
                    <button
                      type="button"
                      class="field__chip-remove"
                      aria-label=${this.labelRemoveOption(label)}
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this._removeValue(val);
                      }}
                    >
                      <hx-icon
                        class="field__chip-remove-glyph"
                        library="helix"
                        name="close"
                        aria-hidden="true"
                      ></hx-icon>
                    </button>
                  </span>
                `;
              })
            : nothing}

          <!--
            Text input — W3C APG editable combobox (option I).
            role="combobox" REPLACES the implicit textbox role; all combobox
            state ARIA lives here so AT sees one canonical surface.
            aria-label / aria-labelledby / aria-describedby are written
            imperatively by _syncHostAriaSemantics after consumer IDREF
            resolution and are not bound here.
          -->
          <input
            part="input"
            type="text"
            id=${this._id}
            role="combobox"
            class=${classMap(inputClasses)}
            .value=${this._filterText || (this._open ? '' : this._displayValue)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            name=${ifDefined(this.name || undefined)}
            autocomplete="off"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls=${this._listboxId}
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-activedescendant=${ifDefined(activeOptionId || undefined)}
            aria-required=${this.required ? 'true' : 'false'}
            aria-invalid=${this._invalid ? 'true' : 'false'}
            aria-busy=${this.loading ? 'true' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            @input=${this._handleInput}
            @focus=${this._handleFocus}
            @keydown=${this._handleKeydown}
          />

          <!-- Loading Indicator -->
          ${this.loading
            ? html`
                <div part="loading-indicator" class="field__loading-indicator" aria-hidden="true">
                  <div class="field__loading-spinner"></div>
                </div>
              `
            : nothing}

          <!-- Clear Button -->
          ${showClear
            ? html`
                <button
                  part="clear-button"
                  type="button"
                  class="field__clear-button"
                  aria-label=${`Clear ${this.label || this.accessibleLabel || 'selection'}`}
                  tabindex="0"
                  @click=${this._handleClear}
                >
                  <hx-icon
                    class="field__clear-button-glyph"
                    library="helix"
                    name="close"
                    aria-hidden="true"
                  ></hx-icon>
                </button>
              `
            : nothing}

          <!-- Suffix Slot -->
          <slot name="suffix" class="field__suffix"></slot>
        </div>

        <!-- Listbox -->
        <div
          part="listbox"
          role="listbox"
          id=${this._listboxId}
          class="field__listbox"
          aria-label=${ifDefined(this.label || this.accessibleLabel || undefined)}
          aria-multiselectable=${this.multiple ? 'true' : nothing}
          ?hidden=${!this._open}
        >
          <div class="field__options">${this._renderOptions()}</div>
        </div>

        <!-- Hidden slot (options read from here) -->
        <slot name="option" @slotchange=${this._handleSlotChange} style="display:none;"></slot>

        <!--
          Persistent error live region. role="alert" is set from first paint
          so the WAI-ARIA contract for live updates is honoured.
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
          the slot has content; hidden when an error is present.
        -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>

        <!-- Filter results live region -->
        <div id=${this._liveRegionId} aria-live="polite" aria-atomic="true" class="field__sr-only">
          ${this._filterAnnouncement}
        </div>

        <!--
          Round-5 F1 (P1): synthesized in-shadow mirror of the consumer-
          resolved description text. Its id is appended to the inner input's
          aria-describedby chain so AT picks the consumer description up
          through the standard described-by channel without needing
          aria-description (which W3C AccName drops whenever
          aria-describedby is also present). Same-root id resolves from
          inside the shadow tree; consumer light-DOM ids do not. The text
          content is updated by _syncHostAriaSemantics on every sync.
        -->
        <span id=${this._consumerDescId} class="field__sr-only" aria-hidden="false"></span>
      </div>
    `;
  }
}

/**
 * Per-component event map for type-safe addEventListener on hx-combobox.
 * The `hx-change` detail is `{ value: string }` only — no `checked` property.
 */
export interface HxComboboxEventMap {
  'hx-input': CustomEvent<{ value: string }>;
  'hx-change': CustomEvent<{ value: string }>;
  'hx-clear': CustomEvent<void>;
  'hx-show': CustomEvent<void>;
  'hx-hide': CustomEvent<void>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-combobox': HelixCombobox;
  }
  interface HTMLElementEventMap {
    'hx-input': CustomEvent<{ value: string }>;
    // hx-change is also declared by hx-checkbox with a wider union; both
    // declarations must agree — the union covers all components that fire it.
    'hx-change': CustomEvent<{ value: string } | { checked: boolean; value: string }>;
    'hx-clear': CustomEvent<void>;
    'hx-show': CustomEvent<void>;
    'hx-hide': CustomEvent<void>;
  }
}

export type { HelixCombobox as HxCombobox };
