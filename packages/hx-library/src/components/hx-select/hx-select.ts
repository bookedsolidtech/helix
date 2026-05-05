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
  /**
   * Whether the named label slot contributes a useful name. Round-3 finding 3:
   * the previous boolean tracked `assignedNodes().length > 0`, which is `true`
   * for whitespace-only slot content. That suppressed the unlabeled devWarn
   * even when the slot only carried a stray newline. This flag now requires
   * either a labellable element OR non-empty trimmed text content.
   * @internal
   */
  @state() private _hasLabelSlot = false;
  /**
   * Source of the accessible name. Round-3 finding 8 replaces the magic
   * sentinel `'*slotted*'` with a discriminated union so a future caller
   * setting `label="*slotted*"` literally cannot be confused with a slotted
   * label.
   * @internal
   */
  @state() private _labelSource: 'string' | 'slot' | 'none' = 'none';
  /**
   * Flattened, trimmed text content of any text nodes in the label slot —
   * used to drive `internals.ariaLabel` when the consumer projects only a
   * text node (no element to add to `labelEls`). Round-3 finding 3.
   * @internal
   */
  @state() private _labelSlotText = '';
  /** Whether the help-text slot contains projected content. @internal */
  @state() private _hasHelpSlot = false;
  /**
   * Direct reference to the first labellable element projected into the
   * `<slot name="label">`. Round-3 finding 5 replaces the previous round-trip
   * through `document.getElementById(this._slottedLabelId)` so we no longer
   * mutate consumer light-DOM (assigning ids) and the lookup is robust under
   * nested shadow roots (round-3 finding 6).
   * @internal
   */
  private _slottedLabelEl: Element | null = null;
  /** Zero-based index of the keyboard-focused option in the listbox; -1 means none. @internal */
  @state() private _focusedOptionIndex = -1;
  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the cross-shadow naming strategy: modern path uses
   * `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements`
   * to bridge consumer light-DOM IDREFs into the host accessible node;
   * fallback path mirrors the consumer's `aria-labelledby` / `aria-describedby`
   * tokens onto host attributes and text-mirrors shadow help/error wrappers
   * via `internals.ariaDescription`.
   *
   * ARCHITECTURE — Round-3 host-canonical (overturns scope doc Path A).
   * Codex round-2 finding 1 demonstrated that the dual-channel approach
   * (host roleless on modern, host-announced on fallback) creates a "named
   * surface ≠ focused surface" gap on legacy engines. Round-3 commits to a
   * single canonical surface — the HOST — on BOTH paths:
   *
   * - `internals.role = 'combobox'` on both paths (and `role="combobox"`
   *   attribute mirror so CSS / `getAttribute` / AT inspecting the DOM see it).
   * - `tabindex="0"` on the host (so it is the focusable surface).
   * - Click + keydown listeners on the host (so user input lands on the
   *   announced surface).
   * - `focus()` routes to the host (so programmatic focus matches AT focus).
   * - `setValidity()` anchor = host (so UA validation UI routes to the
   *   focusable announced surface).
   * - Inner trigger drops `role`, `tabindex`, and the combobox ARIA mirror
   *   on both paths so AT does not see a doubled accessible.
   *
   * This matches Group 2's host-canonical pattern (PR #1625, validated for
   * `hx-radio-group` and `hx-checkbox-group`). The scope doc's APG concern
   * about doubled comboboxes is moot once the inner role is dropped.
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
   * Round-10 finding 1 (supersedes round-8 counter): dedicated host observer
   * scoped to `aria-describedby` with `attributeOldValue: true`. The fallback
   * path strips the host `aria-describedby` attribute on every sync (per
   * round-6 single-channel design). Once stripped, a subsequent consumer
   * `removeAttribute('aria-describedby')` causes NO DOM mutation (the
   * attribute is already absent), so the post-sync `getAttribute()` baseline
   * diff at the top of `_syncHostAriaSemantics` cannot detect the retraction
   * — `_consumerDescribedBy` would remain pinned to the originally-cached
   * string forever and the consumer's external help text would keep
   * concatenating into `internals.ariaDescription` indefinitely.
   *
   * Round-10 architectural lockdown (`.reports/aria-group-3-architecture-
   * decision-r10.md` section 7.1): the observer is governed by the
   * **disconnect-during-strip** discipline. Before the fallback strip
   * `removeAttribute('aria-describedby')` runs, this observer is
   * `disconnect()`ed; immediately after the strip, it is re-`observe()`d.
   * Self-mutations are therefore never delivered to the callback, so the
   * observer only sees consumer-driven mutations. This eliminates the
   * round-8 pending-strip counter / discriminator entirely and the lockstep
   * invariant it depended on.
   *
   * The observer detects `oldValue !== null && newValue === null`
   * (consumer authentically retracted the attribute) and clears
   * `_consumerDescribedBy`. Framework-batched attach-then-detach (Vue /
   * React / Lit reconciliation flipping `aria-describedby` from a string to
   * null in one render commit) produces two records in the same callback
   * batch — the second record's `oldValue` is observable. The bare
   * `removeAttribute` no-op on an already-absent attribute is unobservable
   * by design (a null → null DOM operation is not a mutation); see
   * `hx-select.test.ts` round-10 contract block for the three documented
   * retraction sequences.
   *
   * @internal
   */
  private _hostDescribedByObserver: MutationObserver | null = null;
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
   * Last value of `aria-label` we wrote to the host. Used to distinguish
   * external (consumer) attribute mutations from our own internal mirror
   * writes on the fallback path. Round-5 finding 1: without this snapshot
   * the round-3 fallback `aria-label` mirror was self-sealing — sync N
   * wrote `aria-label="Country"`, sync N+1 read that same string back via
   * `getAttribute('aria-label')` and treated it as a consumer override,
   * caching it into `internals.ariaLabel` and short-circuiting
   * `_writeHostAttributeMirror`. Subsequent label/accessibleLabel/slot
   * mutations never propagated.
   * @internal
   */
  private _lastWrittenAriaLabel: string | null = null;
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
    // so the cross-shadow naming strategy can branch between modern (host
    // `internals.aria*Elements`) and fallback (host-attribute mirror).
    //
    // Round-3 finding 4: honour the static test override so synthetic
    // environments choose the path BEFORE connect runs. Without this seam,
    // tests had to flip the `_supportsIdrefRefs` flag mid-life — by then,
    // the modern branch had already written `internals.ariaLabelledByElements`
    // and the fallback branch never cleared it, so stale modern artifacts
    // leaked into "fallback" assertions.
    const ctor = this.constructor as typeof HelixSelect;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    // Round-3 finding 1: host is the canonical combobox surface, so user
    // input listeners attach to the host (not the inner trigger).
    this.addEventListener('click', this._handleHostClick);
    this.addEventListener('keydown', this._handleKeydown);
    // Round-10 finding 1 (supersedes round-8 counter): install the dedicated
    // `aria-describedby` retraction observer BEFORE the seeded
    // `_syncHostAriaSemantics()` call below, then govern its lifetime with
    // the disconnect-during-strip discipline (see `_syncHostAriaSemantics`
    // fallback branch). The observer therefore sees only consumer-driven
    // mutations; self-strips never reach the callback. No counter, no
    // discriminator, no lockstep invariant.
    this._hostDescribedByObserver = new MutationObserver((records) => {
      let consumerCleared = false;
      for (const record of records) {
        if (record.attributeName !== 'aria-describedby') continue;
        const oldValue = record.oldValue;
        const newValue = this.getAttribute('aria-describedby');
        if (oldValue !== null && newValue === null) {
          // Consumer authentically retracted `aria-describedby`. Clear the
          // cached baseline so the next sync's description recompute drops
          // the external help text.
          this._consumerDescribedBy = null;
          consumerCleared = true;
        }
      }
      if (consumerCleared) {
        // Resync so `internals.ariaDescription` rebuilds without the
        // stale external description text on the fallback path.
        this._syncHostAriaSemantics();
      }
    });
    this._hostDescribedByObserver.observe(this, {
      attributes: true,
      attributeFilter: ['aria-describedby'],
      attributeOldValue: true,
    });
    // Seed root-independent semantics from connect so the host announces the
    // combobox role before first paint. Per round-10 finding 1, the
    // dedicated `aria-describedby` observer is wired above so the
    // disconnect-during-strip helper inside the sync method has a live
    // observer to disconnect/reconnect against.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Safety net: remove listener if component is removed while dropdown is open
    document.removeEventListener('click', this._handleOutsideClick);
    this.removeEventListener('click', this._handleHostClick);
    this.removeEventListener('keydown', this._handleKeydown);
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
    this._hostDescribedByObserver?.disconnect();
    this._hostDescribedByObserver = null;
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
    if (changedProperties.has('label')) {
      // Round-3 finding 8: keep the discriminated label-source state in sync
      // when the `label` property toggles between empty and non-empty.
      this._refreshLabelSource();
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
    // Round-3 finding 3: `slotchange` fires as a microtask after the
    // initial synchronous render, so reading the lazily-tracked
    // `_hasLabelSlot` here would observe its stale `false` seed. Read the
    // slot's assigned nodes directly so the unlabeled devWarn observes the
    // real first-paint state.
    const labelSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="label"]');
    const hasLabellableSlotContent = labelSlot
      ? this._readLabelSlotState(labelSlot).hasUsefulName
      : false;
    // WCAG 4.1.2: warn when no accessible name is available. The host (the
    // canonical announced surface) needs either a `label` prop, an
    // `accessible-label` attribute, or a host-level `aria-label` /
    // `aria-labelledby` so AT can identify the form field.
    if (
      !this.label &&
      !this.accessibleLabel &&
      !hasLabellableSlotContent &&
      !this.getAttribute('aria-label') &&
      !this.getAttribute('aria-labelledby')
    ) {
      devWarn(
        'hx-select',
        'No accessible label provided. Set the `label` attribute, `accessible-label`, `aria-label`, `aria-labelledby`, or project a `<slot name="label">` child. An unlabeled select violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  /**
   * Reads the label slot's assigned nodes and computes the discriminated
   * naming state. Round-3 finding 3 + 5 + 8: an empty whitespace-only slot
   * does NOT count as a useful name; the first labellable element is
   * captured by reference (no consumer-DOM mutation); the result drives a
   * discriminated `_labelSource` rather than a magic `'*slotted*'` string.
   * @internal
   */
  private _readLabelSlotState(slot: HTMLSlotElement): {
    hasUsefulName: boolean;
    element: Element | null;
    text: string;
  } {
    const nodes = slot.assignedNodes({ flatten: true });
    let element: Element | null = null;
    let text = '';
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE && !element) {
        element = node as Element;
      } else if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent ?? '';
      }
    }
    const trimmedText = text.trim();
    return {
      hasUsefulName: element !== null || trimmedText.length > 0,
      element,
      text: trimmedText,
    };
  }

  // ─── Host-canonical ARIA sync ───

  /**
   * Mirrors combobox semantics onto the host via ElementInternals so that the
   * host IS the canonical announced surface on BOTH the modern (IDL element
   * references) and fallback paths. Round-3 finding 1: codex round-2
   * demonstrated that putting `role="combobox"` on the host on fallback while
   * leaving focus/click/keyboard/validity anchored to the inner trigger
   * created a "named surface ≠ focused surface" gap. Round-3 collapses both
   * paths to the host-canonical model used by Group 2's `hx-radio-group` /
   * `hx-checkbox-group` (PR #1625):
   *
   * - `internals.role = 'combobox'` so AT advertises the combobox role.
   * - Host attribute `role="combobox"` mirror so legacy engines, axe-core,
   *   and `getAttribute('role')` agree with the internals default.
   * - Host attribute `tabindex="0"` so the host is the focusable surface.
   * - Host attributes `aria-expanded`, `aria-haspopup`, `aria-controls`,
   *   `aria-activedescendant`, `aria-required`, `aria-invalid`,
   *   `aria-disabled` so AT walking the host's attribute graph sees the
   *   combobox state without depending on internals defaults.
   * - Modern path additionally sets `internals.ariaLabelledByElements` /
   *   `internals.ariaDescribedByElements` so consumer light-DOM IDREFs cross
   *   the shadow boundary into the host's accessible node.
   * - Fallback path mirrors consumer label/desc tokens onto the host
   *   attribute and text-mirrors shadow help/error wrappers via
   *   `internals.ariaDescription`.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    // Round-3 finding 1: host IS the canonical combobox on both paths.
    internals.role = 'combobox';
    internals.ariaRequired = this.required ? 'true' : 'false';
    // Round-2 finding 2 (preserved): read `internals.validity.valid` once and
    // cache the derived flag in reactive state so both the IDREF-elements
    // path and the host-attribute mirror read from the same source.
    const isInvalid = !internals.validity.valid;
    this._invalid = isInvalid;
    internals.ariaInvalid = isInvalid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';
    internals.ariaExpanded = this.open ? 'true' : 'false';
    internals.ariaHasPopup = 'listbox';

    // Round-5 finding 1: the live `aria-label` attribute may be either a
    // consumer-authored override OR our own previous mirror write. Compare
    // against `_lastWrittenAriaLabel` to distinguish — if the live value
    // matches what we wrote last sync, treat as component-owned (empty
    // string here) so the recompute pass below picks fresh values from
    // `label` / `accessibleLabel` / slotted text. Only a divergent live
    // value is treated as a consumer override.
    //
    // Round-8 finding 4 (low — deliberate behaviour): the `.trim() || ''`
    // collapse means a whitespace-only consumer override (e.g.
    // `aria-label=" "`) is treated as no consumer override at all — the
    // internal candidate (`label` / `accessibleLabel` / slotted text) wins
    // and overwrites the host attribute on the fallback path. This is a
    // deliberate choice: whitespace-only `aria-label` is a code smell
    // pattern that is hard to author intentionally, the AT-suppression
    // behaviour it sometimes produces is not part of the documented
    // hx-select contract, and silently erasing the consumer's intended
    // name would be the worse failure mode. A positive regression test in
    // `hx-select.test.ts` (`whitespace-only consumer aria-label is treated
    // as no override on fallback`) locks this intent.
    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel =
      liveAriaLabel !== null && liveAriaLabel !== this._lastWrittenAriaLabel
        ? liveAriaLabel.trim() || ''
        : '';

    // Resolve the candidate label/desc element references once — the IDL-ref
    // path consumes them as `Element[]`, the fallback path mirrors consumer
    // tokens onto the host attribute.
    const internalLabel = this.shadowRoot?.getElementById(this._labelId) ?? null;
    // Round-3 finding 5 + 6: hold the slotted label element by direct
    // reference (captured in `_handleLabelSlotChange`) so we no longer
    // mutate consumer light DOM with a tracked id and the lookup survives
    // nested shadow roots without a fragile `getElementById` chain.
    const slottedLabelEl = this._slottedLabelEl;
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId) ?? null;
    const errorEl = this.shadowRoot?.getElementById(this._errorId) ?? null;

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
    // Group 2 round-35: `aria-labelledby` is only "effective" when at least
    // one IDREF resolves. A typo or transiently-missing target must NOT erase
    // the visible label.
    const hasEffectiveLabelledBy = labelEls.length > 0;

    // Round-3 finding 8: discriminated union replaces the magic
    // `'*slotted*'` sentinel. The state name drives both the modern
    // `internals.ariaLabel` decision and the labelEls fallback append.
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (hasEffectiveLabelledBy) {
      // labelledby chain wins — ariaLabel must be null so it does not
      // shadow the chain.
      internals.ariaLabel = null;
    } else if (this._labelSource === 'slot') {
      if (slottedLabelEl) {
        // labelEls path will append the slotted element below; no string.
        internals.ariaLabel = null;
      } else {
        // Text-only slot — no element to add to labelEls. Mirror the
        // flattened text into ariaLabel so AT still announces the name.
        internals.ariaLabel = this._labelSlotText || this.accessibleLabel || null;
      }
    } else if (this._labelSource === 'string') {
      internals.ariaLabel = this.label || this.accessibleLabel || null;
    } else {
      internals.ariaLabel = this.accessibleLabel || null;
    }
    if (!hasEffectiveLabelledBy && !hostAriaLabel) {
      if (this._labelSource === 'slot' && slottedLabelEl) {
        labelEls.push(slottedLabelEl);
      } else if (this._labelSource === 'string' && internalLabel) {
        labelEls.push(internalLabel);
      }
    }

    const descEls = resolveIdrefTokens(this, externalDescTokens);
    const hasError = !!(this.error || this._hasErrorSlot);
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
      // Clear stale fallback ariaDescription string in case a prior sync ran
      // on the fallback path (e.g. tests using the static override seam).
      internals.ariaDescription = null;
    } else {
      // ─── No-IDL-ref fallback (Group 2 round-19 P1 parity) ───
      // The IDL element-references API is unavailable, so internal shadow
      // help/error/label wrappers cannot be projected onto the host
      // accessibility node via `internals.aria*Elements`. The host owns the
      // ARIA strings (via `internals.ariaLabel`, `internals.ariaDescription`)
      // and we mirror only consumer-supplied tokens onto the host attribute
      // (shadow ids cannot resolve across the boundary).
      //
      // Round-3 finding 4 (symmetric clear): explicitly null the modern
      // IDL element-reference fields so a stub-flipped fallback test cannot
      // inherit modern artifacts seeded on a previous sync. Production code
      // never hits this branch with non-null modern refs (the platform
      // probe is once-per-connect), but the symmetric clear hardens the
      // contract for tests using the static override seam.
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = null;
      refsInternals.ariaDescribedByElements = null;

      // Round-3 finding 7: build the host `aria-labelledby` mirror from
      // *resolved* token ids only — `labelEls.map(e => e.id).filter(Boolean)`.
      // The previous round-2 implementation ran the consumer token strings
      // through `filter(Boolean)`, which only stripped empty strings, not
      // unresolved ids. A consumer `aria-labelledby="resolved missing"` was
      // written back wholesale, so MutationObservers and legacy AT saw a
      // persistent broken IDREF on the host.
      const resolvedLabelIds = labelEls.map((el) => el.id).filter((id): id is string => !!id);
      const hostLabel = hasEffectiveLabelledBy ? resolvedLabelIds.join(' ') : '';
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

      // Round-6 (option b — single-channel fallback): per W3C AccName 1.2,
      // an `aria-describedby` token list — even one authored by the
      // consumer — takes precedence over `internals.ariaDescription`. When
      // a consumer authors any working `aria-describedby` token on the
      // host, AT may announce only the consumer text and never reach the
      // internal help/error strings the component renders in its shadow
      // root. Cross-shadow id splice (option a) does not portably resolve
      // on Firefox / VoiceOver, so we collapse to a single channel:
      // concatenate the consumer-described text with internal help/error
      // text into `internals.ariaDescription` (below) and strip the host
      // `aria-describedby` attribute on this path regardless of authorship.
      // The consumer's intended description text is preserved (it surfaces
      // through `internals.ariaDescription`); only the attribute mirror is
      // removed. `_consumerDescribedBy` retains the consumer's original
      // token list (see baseline diff at lines 691-694) so the modern path
      // continues to work if the platform later upgrades and re-syncs.
      // Modern path is unchanged (it uses `ariaDescribedByElements` which
      // the platform concatenates correctly across shadow roots).
      if (this.hasAttribute('aria-describedby')) {
        // Round-10 finding 1 (supersedes round-8 counter): disconnect the
        // dedicated host observer, perform our self-mutation strip, then
        // reconnect. The observer therefore never delivers our own write
        // to the callback, eliminating the round-8 counter / discriminator
        // and the lockstep invariant it depended on. See architecture
        // decision `.reports/aria-group-3-architecture-decision-r10.md`
        // section 7.1. Genuine consumer-driven mutations (set / set-empty
        // / framework attach-then-detach) continue to be observed because
        // we reconnect immediately, with no microtask boundary inside the
        // strip block where a consumer mutation could slip through.
        this._hostDescribedByObserver?.disconnect();
        this.removeAttribute('aria-describedby');
        this._hostDescribedByObserver?.observe(this, {
          attributes: true,
          attributeFilter: ['aria-describedby'],
          attributeOldValue: true,
        });
      }
      this._lastWrittenDescribedBy = null;

      // Resolve consumer-described elements through the same idref helper
      // the modern path uses, then concatenate their text with internal
      // shadow help/error text. Tokens that fail to resolve are dropped by
      // `resolveIdrefTokens` (matching native AT behaviour) so unresolved
      // ids do not leak into the description as literal strings. Broken
      // consumer tokens stay cached in `_consumerDescribedBy` and replay
      // when their target later attaches.
      const consumerDescEls = resolveIdrefTokens(this, externalDescTokens);
      const consumerDescText = consumerDescEls
        .map((el) => (el.textContent ?? '').trim())
        .filter(Boolean)
        .join(' ');
      const helpText =
        helpEl && !hasError && (this.helpText || this._hasHelpSlot)
          ? readSlottedOrShadowText(helpEl)
          : '';
      const errorText = errorEl && hasError ? readSlottedOrShadowText(errorEl) : '';
      const combinedDescription = [consumerDescText, helpText, errorText]
        .filter(Boolean)
        .join(' ')
        .trim();
      internals.ariaDescription = combinedDescription || null;

      // Round-3 finding 1 (host-canonical): on the fallback path the host
      // attributes carry the combobox state in addition to the internals
      // defaults. CSS / `getAttribute` / axe-core read these attributes
      // (internals defaults are not exposed to either).
      this._writeHostAttributeMirror({ hostAriaLabel, isInvalid });
    }

    // Round-3 finding 1: host attributes for the canonical combobox state.
    // Always written on BOTH paths (the modern path's internals defaults
    // are invisible to CSS/getAttribute, so attribute writes are required
    // to match `expect(el.getAttribute('role')).toBe('combobox')` and to
    // make `:host(:focus-visible)` paint a focus ring).
    this._writeHostRoleAndTabindex();
    this._writeHostComboboxStateAttributes();
  }

  /**
   * Writes host `role="combobox"` and `tabindex` so the host is the
   * focusable, AT-visible canonical surface. Round-3 finding 1.
   * @internal
   */
  private _writeHostRoleAndTabindex(): void {
    if (this.getAttribute('role') !== 'combobox') {
      this.setAttribute('role', 'combobox');
    }
    const tab = this.disabled ? '-1' : '0';
    if (this.getAttribute('tabindex') !== tab) {
      this.setAttribute('tabindex', tab);
    }
  }

  /**
   * Writes the host's combobox state attributes (`aria-expanded`,
   * `aria-haspopup`, `aria-controls`, `aria-activedescendant`,
   * `aria-required`, `aria-invalid`, `aria-disabled`) on every sync. CSS
   * selectors and AT inspecting the live attribute graph read these — the
   * `internals.aria*` defaults are invisible. Round-3 finding 1.
   * @internal
   */
  private _writeHostComboboxStateAttributes(): void {
    if (this.getAttribute('aria-haspopup') !== 'listbox') {
      this.setAttribute('aria-haspopup', 'listbox');
    }
    if (this.getAttribute('aria-controls') !== this._listboxId) {
      this.setAttribute('aria-controls', this._listboxId);
    }
    const expanded = this.open ? 'true' : 'false';
    if (this.getAttribute('aria-expanded') !== expanded) {
      this.setAttribute('aria-expanded', expanded);
    }
    const activeDescendant =
      this.open && this._focusedOptionIndex >= 0 ? this._optionId(this._focusedOptionIndex) : null;
    if (activeDescendant) {
      if (this.getAttribute('aria-activedescendant') !== activeDescendant) {
        this.setAttribute('aria-activedescendant', activeDescendant);
      }
    } else if (this.hasAttribute('aria-activedescendant')) {
      this.removeAttribute('aria-activedescendant');
    }
    if (this.required) {
      if (this.getAttribute('aria-required') !== 'true') {
        this.setAttribute('aria-required', 'true');
      }
    } else if (this.hasAttribute('aria-required')) {
      this.removeAttribute('aria-required');
    }
    if (this._invalid) {
      if (this.getAttribute('aria-invalid') !== 'true') {
        this.setAttribute('aria-invalid', 'true');
      }
    } else if (this.hasAttribute('aria-invalid')) {
      this.removeAttribute('aria-invalid');
    }
    if (this.disabled) {
      if (this.getAttribute('aria-disabled') !== 'true') {
        this.setAttribute('aria-disabled', 'true');
      }
    } else if (this.hasAttribute('aria-disabled')) {
      this.removeAttribute('aria-disabled');
    }
  }

  /**
   * Writes a host `aria-label` attribute mirror on the fallback path so AT
   * inspecting the live attribute graph sees the resolved name even when
   * the platform lacks IDL element references. Skip when an effective
   * `aria-labelledby` is already set on the host (labelledby > label by
   * ARIA priority). Round-3 finding 1 + round-2 finding 5.
   * @internal
   */
  private _writeHostAttributeMirror(args: { hostAriaLabel: string; isInvalid: boolean }): void {
    const { hostAriaLabel } = args;
    if (hostAriaLabel) {
      // Round-8 finding 2 (medium): consumer-authored aria-label path. The
      // caller already disambiguated against `_lastWrittenAriaLabel` (see
      // `_syncHostAriaSemantics` line ~668) — `hostAriaLabel` is non-empty
      // ONLY when the live attribute diverges from our last write. We must
      // null the snapshot here so the next sync's disambiguation correctly
      // classifies the consumer string as external on every subsequent pass.
      //
      // Without this null, the snapshot stays pinned to the value WE wrote
      // last. If the consumer subsequently rewrites `aria-label` to a string
      // that happens to equal our prior write, the disambiguation would see
      // `liveAttr === _lastWrittenAriaLabel` and treat the consumer string
      // as component-owned — a later internal `label = ''` would then
      // silently delete the consumer's attribute. The sentinel `null` means
      // "we did NOT author the live attr," which makes a coincident-string
      // round-trip still differ from `null` and correctly classify the
      // consumer string as external.
      this._lastWrittenAriaLabel = null;
      return;
    }
    const candidate =
      this.accessibleLabel ||
      this.label ||
      (this._labelSource === 'slot' ? this._labelSlotText : '') ||
      '';
    const hasLabelledBy = this.hasAttribute('aria-labelledby');
    const liveAttr = this.getAttribute('aria-label');
    if (!hasLabelledBy && candidate) {
      if (liveAttr !== candidate) {
        this.setAttribute('aria-label', candidate);
      }
      // Round-5 finding 1: record what we just wrote so the next sync can
      // distinguish "I wrote this" from "consumer overrode this."
      this._lastWrittenAriaLabel = candidate;
    } else {
      // No candidate (label/accessibleLabel cleared) OR labelledby chain
      // wins. Round-5 finding 1: if the live attribute matches our last
      // mirror write, it is component-owned and must be removed now that
      // the source has emptied. Otherwise (whitespace-only attribute or no
      // attribute at all) keep historical behaviour.
      if (liveAttr !== null && liveAttr === this._lastWrittenAriaLabel) {
        this.removeAttribute('aria-label');
        this._lastWrittenAriaLabel = null;
      } else if (this.hasAttribute('aria-label') && !liveAttr?.trim()) {
        this.removeAttribute('aria-label');
        this._lastWrittenAriaLabel = null;
      } else if (!this.hasAttribute('aria-label')) {
        // No mirror present — clear the snapshot so a future consumer
        // write starts from a clean slate.
        this._lastWrittenAriaLabel = null;
      }
    }
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
      // Round-3 finding 1: the host is now the canonical announced + focused
      // combobox surface, so anchor `setValidity()` to the host. The UA
      // routes validation UI / error recovery to a focusable element with
      // a stable accessible name — that is the host (which carries
      // `role="combobox"`, `tabindex="0"`, and the resolved name via
      // `internals.ariaLabel*`). Anchoring to the inner trigger would route
      // recovery into the shadow tree, where the consumer cannot intercept.
      this._internals.setValidity({ valueMissing: true }, this.error || this.labelRequired, this);
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
   * Tracks the slotted label so projected `<span slot="label">` content joins
   * the accessible-name chain without forcing the consumer to also pass the
   * `label` property.
   *
   * Round-3 findings 3, 5, 6, 8:
   * - 3: count whitespace-only text as "no useful name" (devWarn must fire).
   * - 5: hold the slotted element by direct reference instead of mutating
   *   consumer light DOM with a tracked id.
   * - 6: lookup is by reference, so it survives nested shadow roots without
   *   the fragile `getElementById` chain.
   * - 8: discriminated `_labelSource` replaces the magic `'*slotted*'`
   *   sentinel string.
   * @internal
   */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readLabelSlotState(e.target);
    this._hasLabelSlot = state.hasUsefulName;
    this._slottedLabelEl = state.element;
    this._labelSlotText = state.text;
    this._refreshLabelSource();
    this._syncHostAriaSemantics();
  }

  /**
   * Recomputes the discriminated label source. Round-3 finding 8.
   *
   * CodeRabbit F2: slotted label wins over the `label` prop. When a
   * consumer provides BOTH a `<span slot="label">` AND a `label="..."`
   * attribute the visible label is the slotted node (rendered by the
   * named slot's default content branch never firing). Preferring the
   * string form here would route the accessible name through the prop
   * and diverge from the rendered text. The slot is the canonical
   * source whenever it has useful content.
   * @internal
   */
  private _refreshLabelSource(): void {
    if (this._hasLabelSlot) {
      this._labelSource = 'slot';
    } else if (this.label) {
      this._labelSource = 'string';
    } else {
      this._labelSource = 'none';
    }
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

  // ─── Host Click ───

  /**
   * Click handler attached to the host. Round-3 finding 1: the host is the
   * canonical combobox surface, so user input listeners live here. Clicks
   * inside the open listbox are handled by the per-option `@click` binding
   * in `_renderOptions()` and stop here only if `composedPath` indicates
   * the original click target was the open listbox panel (so option clicks
   * don't double-toggle the dropdown).
   * @internal
   */
  private _handleHostClick = (e: MouseEvent): void => {
    const path = e.composedPath();
    // Ignore clicks that originated inside the open listbox panel — the
    // option's own `@click` handler already routed selection.
    const listbox = this.shadowRoot?.querySelector('.field__listbox') ?? null;
    if (listbox && path.includes(listbox)) {
      return;
    }
    // CodeRabbit F3: only toggle when the click traverses the trigger
    // element. Clicks on the slotted label, help text, error text, or
    // any other host-light-DOM content must NOT toggle the dropdown —
    // they are consumer-owned regions that happen to live inside the
    // host. The `<label for=${selectId}>` we render in shadow DOM
    // forwards label clicks to the <button> trigger natively, so those
    // clicks reach this handler with the trigger in their composedPath
    // and toggle correctly.
    const trigger = this._trigger ?? this.shadowRoot?.querySelector('.field__trigger') ?? null;
    if (!trigger || !path.includes(trigger)) {
      return;
    }
    this._toggleDropdown();
  };

  // ─── Keyboard Navigation ───

  /** @internal */
  private _handleKeydown = (e: KeyboardEvent): void => {
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
        // Round-3 finding 1: refocus the host (the canonical combobox).
        this.focus();
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
  };

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

  /**
   * Moves focus to the host. Round-3 finding 1: the host is the canonical
   * combobox surface (`role="combobox"`, `tabindex="0"`), so programmatic
   * focus must land there to match where AT routes focus and where
   * `setValidity()` anchors recovery.
   */
  override focus(options?: FocusOptions): void {
    HTMLElement.prototype.focus.call(this, options);
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

    // Round-3 finding 1: the host is the canonical announced + focused
    // combobox surface on BOTH paths. The inner trigger is a presentational
    // visual surface only — it carries no role, no tabindex, and no ARIA
    // attributes. User input listeners (click, keydown) live on the host so
    // the focused surface IS the announced surface; programmatic `focus()`
    // and `setValidity()` anchor to the host for the same reason. The hidden
    // native `<select>` is `aria-hidden="true"`, never the announced surface.

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
            Visual trigger surface. Round-3 finding 1: role, tabindex,
            and combobox ARIA all live on the host so AT sees a single
            announced + focused surface. The trigger is rendered as a
            <button type="button"> (a labelable element) so the visible
            label[for=selectId] performs native click activation —
            mouse users clicking the label focus the trigger which
            bubbles to the host click handler and toggles the dropdown.
            type="button" prevents implicit form submission. The trigger
            has no role and no ARIA, so AT walks its subtree text as
            the combobox's value content (host carries the real
            association via internals.ariaLabel*).
          -->
          <button
            type="button"
            part="trigger"
            id=${this._selectId}
            class=${classMap(triggerClasses)}
          >
            <span class="field__trigger-value"
              >${this._displayValue || this.placeholder || nothing}</span
            >
            <span class="field__chevron" aria-hidden="true"></span>
          </button>

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
