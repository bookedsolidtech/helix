import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state, query } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../hx-icon/hx-icon.js';
import { helixDatePickerStyles } from './hx-date-picker.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

// PERF: hx-date-picker exceeds 5KB budget (7.98kb gzipped) -- calendar grid, date parsing, keyboard navigation, localization

const _nextDatePickerId = createIdCounter('hx-date-picker');

/** Detail for the hx-change event dispatched by hx-date-picker. */
export interface HxDatePickerChangeDetail {
  value: string;
  date: Date | null;
}

/**
 * Date picker component for selecting dates with keyboard-accessible calendar popup.
 *
 * @summary Form-associated date picker with calendar popup and WCAG 2.1 AA accessibility.
 *
 * @tag hx-date-picker
 *
 * @slot label - Custom label content (overrides the label property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 *
 * @fires {CustomEvent<{value: string, date: Date | null}>} hx-change - Emitted when the selected date changes.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around input and trigger.
 * @csspart input - The readonly text input displaying the formatted date.
 * @csspart trigger - The calendar icon button.
 * @csspart calendar - The calendar popup dialog.
 * @csspart month-nav - The month navigation header.
 * @csspart day - An individual day button in the calendar grid.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-date-picker-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-date-picker-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-date-picker-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-date-picker-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-date-picker-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-date-picker-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-date-picker-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-date-picker-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-date-picker-trigger-color=var(--hx-color-neutral-500)] - Trigger icon color.
 * @cssprop [--hx-date-picker-calendar-bg=var(--hx-color-neutral-0)] - Calendar background color.
 * @cssprop [--hx-date-picker-calendar-border-color=var(--hx-color-neutral-200)] - Calendar border color.
 * @cssprop [--hx-date-picker-calendar-min-width=18rem] - Calendar minimum width.
 * @cssprop [--hx-date-picker-selected-bg=var(--hx-color-primary-500)] - Selected day background.
 * @cssprop [--hx-date-picker-selected-color=var(--hx-color-neutral-0)] - Selected day text color.
 * @cssprop [--hx-date-picker-today-color=var(--hx-color-primary-600)] - Today indicator color.
 * @cssprop [--hx-date-picker-calendar-shadow=0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)] - Calendar popup box shadow.
 * @cssprop [--hx-date-picker-calendar-border-radius=var(--hx-border-radius-lg)] - Border radius.
 * @cssprop [--hx-date-picker-selected-hover-bg=var(--hx-color-primary-600)] - Background color.
 * @cssprop [--hx-date-picker-trigger-hover-color=var(--hx-color-neutral-700)] - Color.
 * @cssprop [--hx-border-radius-lg] - CSS custom property.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-primary-600] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-shadow-md] - Box shadow.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-date-picker/AAA-AUDIT.md
 * @keyboard-contract dismiss=Escape; trap-focus=true
 * @aria-pattern dialog
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-date-picker
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-date-picker')
export class HelixDatePicker extends FormMixin(HelixElement) {
  static override styles = [helixDatePickerStyles, forcedColorsField];

  // ─── Form Association ───

  /**
   * Marks this component as form-associated for native form participation.
   * @internal
   */
  static override formAssociated = true;

  /**
   * Test seam: when set to `true` or `false`, overrides the platform
   * `supportsIdrefElementReferences` probe before `connectedCallback` seeds
   * `_supportsIdrefRefs`. Production code MUST NOT touch this field. It is a
   * `static` so the test stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  // ─── Properties ───

  /**
   * The name of the field, used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The current value as an ISO 8601 date string (e.g. 2026-03-04).
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * The minimum selectable date as an ISO 8601 string.
   * @attr min
   */
  @property({ type: String })
  min = '';

  /**
   * The maximum selectable date as an ISO 8601 string.
   * @attr max
   */
  @property({ type: String })
  max = '';

  /**
   * The visible label text.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the field is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the field is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the field for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Display format hint shown as placeholder (e.g. MM/DD/YYYY).
   * @attr format
   */
  @property({ type: String })
  format = 'MM/DD/YYYY';

  /**
   * Locale string used for formatting the display value.
   * @attr locale
   */
  @property({ type: String })
  locale = 'en-US';

  /**
   * Validation message shown when the field is required but empty.
   * @attr required-message
   */
  @property({ type: String, attribute: 'required-message' })
  requiredMessage = 'This field is required.';

  /**
   * Accessible label for the calendar dialog.
   * @attr choose-date-label
   */
  @property({ type: String, attribute: 'choose-date-label' })
  chooseDateLabel = 'Choose a date';

  /**
   * Accessible label for the calendar trigger button when the calendar is closed.
   * @attr open-calendar-label
   */
  @property({ type: String, attribute: 'open-calendar-label' })
  openCalendarLabel = 'Open calendar';

  /**
   * Accessible label for the calendar trigger button when the calendar is open.
   * @attr close-calendar-label
   */
  @property({ type: String, attribute: 'close-calendar-label' })
  closeCalendarLabel = 'Close calendar';

  /**
   * Accessible label for the previous month navigation button.
   * @attr previous-month-label
   */
  @property({ type: String, attribute: 'previous-month-label' })
  previousMonthLabel = 'Previous month';

  /**
   * Accessible label for the next month navigation button.
   * @attr next-month-label
   */
  @property({ type: String, attribute: 'next-month-label' })
  nextMonthLabel = 'Next month';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * Uses `accessible-label` attribute instead of `aria-label` to avoid
   * ARIAMixin shadowing on the host element. Highest-precedence naming source.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | null = null;

  // ─── Internal State ───

  /**
   * Tracks whether the calendar popup is currently visible.
   * @internal
   */
  @state() private _isOpen = false;
  /**
   * The year currently displayed in the calendar view.
   * @internal
   */
  @state() private _viewYear: number = new Date().getFullYear();
  /**
   * The month (0-indexed) currently displayed in the calendar view.
   * @internal
   */
  @state() private _viewMonth: number = new Date().getMonth();
  /**
   * The day number currently focused within the calendar grid, or null when the calendar is closed.
   * @internal
   */
  @state() private _focusedDay: number | null = null;
  /**
   * The message announced to screen readers when the calendar month changes.
   * @internal
   */
  @state() private _liveMessage = '';

  /**
   * Cached calendar day grid for the current view month/year.
   * Recomputed in willUpdate() only when _viewMonth or _viewYear changes.
   * @internal
   */
  private _dayGrid: (Date | null)[] = [];

  /**
   * Cached aria-label strings for each date in the current grid, keyed by ISO date string.
   * Recomputed in willUpdate() alongside _dayGrid.
   * @internal
   */
  private _dayAriaLabels: Map<string, string> = new Map();

  // ─── Memoized formatters ───

  /** @internal */
  private _weekdayFormatter: Intl.DateTimeFormat | null = null;
  /** @internal */
  private _monthFormatter: Intl.DateTimeFormat | null = null;
  /** @internal */
  private _formatterLocale = '';
  /** @internal */
  private _cachedWeekdayNames: string[] | null = null;

  // ─── Internal References ───

  /** @internal */
  @query('.field__input')
  private _input: HTMLInputElement | undefined;

  /** @internal */
  @query('.field__trigger')
  private _trigger: HTMLButtonElement | undefined;

  /** @internal */
  @query('.calendar')
  private _calendar: HTMLDialogElement | undefined;

  // ─── Unique IDs ───

  /** @internal */
  private _id = _nextDatePickerId();
  /** @internal */
  private _inputId = `${this._id}-input`;
  /** @internal */
  private _helpTextId = `${this._id}-help`;
  /** @internal */
  private _errorId = `${this._id}-error`;
  /** @internal */
  private _calendarId = `${this._id}-calendar`;
  /** @internal */
  private _liveRegionId = `${this._id}-live`;
  /** @internal */
  private _labelId = `${this._id}-label`;
  /**
   * Id of the synthesized in-shadow span that mirrors the consumer-resolved
   * description text. Appended to the inner input's `aria-describedby` so AT
   * picks the consumer description up through the standard described-by
   * channel — `aria-description` is intentionally NOT written, because the
   * W3C AccName algorithm ignores `aria-description` whenever
   * `aria-describedby` is also present.
   * @internal
   */
  private _consumerDescId = `${this._id}-consumer-desc`;

  // ─── Slot Tracking (host-canonical naming) ───

  /**
   * Whether the label slot has any assigned elements with a useful name.
   * Per AccName 1.2 §4.3.10, an empty/whitespace-only slot does NOT count.
   * @internal
   */
  @state() private _hasLabelSlot = false;
  /**
   * Whether the error slot has any meaningful (non-empty, non-hidden) content.
   * @internal
   */
  @state() private _hasErrorSlot = false;
  /**
   * Whether the help-text slot has any meaningful (non-empty, non-hidden) content.
   * @internal
   */
  @state() private _hasHelpSlot = false;
  /**
   * Discriminated label source — drives precedence between slotted label,
   * `label` property, and unnamed.
   * @internal
   */
  @state() private _labelSource: 'string' | 'slot' | 'none' = 'none';
  /**
   * Flattened, trimmed text content from all label-slot nodes — used to drive
   * the inner input's `aria-label` on the no-IDL-ref fallback path and to
   * gate `_hasLabelSlot` per AccName 1.2.
   * @internal
   */
  @state() private _labelSlotText = '';
  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the cross-shadow naming strategy for the inner `<input>`.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;
  /**
   * Cached invalidity flag derived from `internals.validity.valid`, the
   * `error` property, and the slotted error content. Drives `aria-invalid`
   * on the inner input.
   * @internal
   */
  @state() private _invalid = false;
  /**
   * Deferred copy of `error` driven through reactive state so the persistent
   * live region can re-announce on transitions without direct DOM mutation.
   * @internal
   */
  @state() private _announcedError = '';

  // ─── Host-canonical ARIA bookkeeping ───

  /** Handle for the shared IDREF observer. @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;
  /** @internal */
  private _helpSlotTextObserver: MutationObserver | null = null;
  /** @internal */
  private _errorSlotTextObserver: MutationObserver | null = null;
  /** @internal */
  private _hostDescribedByObserver: MutationObserver | null = null;
  /** @internal */
  private _consumerLabelledBy: string | null = null;
  /** @internal */
  private _consumerDescribedBy: string | null = null;
  /**
   * Direct references to ALL labellable elements projected into
   * `<slot name="label">`. Aggregating every assigned element preserves
   * composed labels such as
   * `<svg slot="label" aria-hidden="true">…</svg><span slot="label">Date</span>`.
   * @internal
   */
  private _slottedLabelEls: Element[] = [];
  /** @internal */
  private _labelSlotTextObserver: MutationObserver | null = null;
  /** @internal */
  private _externalRefsObserver: MutationObserver | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();

    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs.
    const ctor = this.constructor as typeof HelixDatePicker;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // Install the dedicated `aria-describedby` retraction observer BEFORE
    // the seeded `_syncHostAriaSemantics()` call below.
    this._hostDescribedByObserver = new MutationObserver((records) => {
      let consumerCleared = false;
      for (const record of records) {
        if (record.attributeName !== 'aria-describedby') continue;
        const oldValue = record.oldValue;
        const newValue = this.getAttribute('aria-describedby');
        if (oldValue !== null && newValue === null) {
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

    // Seed root-independent semantics from connect so the inner input
    // resolves naming before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick, true);
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

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);

    // Sync form state before render so the browser form participation is
    // always up-to-date without causing an extra render cycle.
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }

    // Seed `_announcedError` BEFORE render so the persistent live region
    // renders with the error text in the SAME frame that the alert container
    // appears. Covers first paint AND runtime transitions to a non-empty error.
    if (changedProperties.has('error') || !this.hasUpdated) {
      this._announcedError = this.error ?? '';
    }

    if (changedProperties.has('label')) {
      this._refreshLabelSource();
    }

    // Recompute the day grid and aria-labels only when the viewed month/year
    // or locale changes — not on every render.
    const gridChanged =
      (changedProperties as Map<PropertyKey, unknown>).has('_viewMonth') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_viewYear') ||
      changedProperties.has('locale') ||
      this._dayGrid.length === 0;

    if (gridChanged) {
      this._dayGrid = this._getDaysInGrid();
      this._dayAriaLabels = new Map(
        this._dayGrid
          .filter((d): d is Date => d !== null)
          .map((d) => [
            this._toISO(d),
            d.toLocaleDateString(this.locale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          ]),
      );
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    // Host-elevated ARIA semantics — runs after every render so the inner
    // input's announced name/description follow consumer-IDREF / slot /
    // property changes within the same frame.
    this._syncHostAriaSemantics();

    // Drive re-announcement from reactive state on error→error transitions
    // (rAF clear-and-re-set forces AT to re-read role="alert" content).
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string | undefined;
      if (previousError && this.error) {
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        this._announcedError = this.error;
      }
    }

    if ((changedProperties as Map<PropertyKey, unknown>).has('_isOpen')) {
      if (this._isOpen) {
        // Sync view to the currently selected date when opening.
        const selected = this._parseISODate(this.value);
        if (selected) {
          this._viewYear = selected.getFullYear();
          this._viewMonth = selected.getMonth();
        }
        void this.updateComplete.then(() => {
          this._calendar?.show();
          this._focusActiveDay();
          document.addEventListener('click', this._handleDocumentClick, true);
        });
      } else {
        this._calendar?.close();
        this._focusedDay = null;
        document.removeEventListener('click', this._handleDocumentClick, true);
      }
    }

    if (
      (changedProperties as Map<PropertyKey, unknown>).has('_viewMonth') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_viewYear')
    ) {
      if (this._isOpen) {
        const monthName = this._getMonthName(this._viewMonth);
        this._liveMessage = `${monthName} ${this._viewYear}`;
        void this.updateComplete.then(() => {
          this._focusActiveDay();
        });
      }
    }
  }

  override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // `slotchange` fires as a microtask after the initial synchronous render.
    // Without proactive seeding, the first `_syncHostAriaSemantics()` call
    // (driven from `updated()`) observes stale empty slot state. Seed
    // synchronously here so first paint announces the correct name/description.
    this._seedSlotStateSync();
    this._syncHostAriaSemantics();

    // WCAG 4.1.2: warn when no accessible name is available.
    if (
      !this.label &&
      !this.accessibleLabel &&
      !this._hasLabelSlot &&
      !this.getAttribute('aria-label') &&
      !this.getAttribute('aria-labelledby')
    ) {
      devWarn(
        'hx-date-picker',
        'No accessible label provided. Set the `label` attribute, `accessible-label`, `aria-label`, `aria-labelledby`, or project a `<slot name="label">` child. An unlabeled date picker violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  /**
   * Synchronous slot-state seed. Mirrors the side effects of the three
   * `_handle*SlotChange` handlers (label / help-text / error) but is driven by
   * direct `slot.assignedNodes()` reads so we can populate state BEFORE the
   * microtask `slotchange` events fire after the first render.
   * @internal
   */
  private _seedSlotStateSync(): void {
    const root = this.shadowRoot;
    if (!root) return;
    const labelSlot = root.querySelector<HTMLSlotElement>('slot[name="label"]');
    if (labelSlot) {
      const state = this._readLabelSlotState(labelSlot);
      this._hasLabelSlot = state.hasUsefulName;
      this._slottedLabelEls = state.elements;
      this._labelSlotText = state.text;
      this._installLabelSlotTextObserver(state.elements);
      this._refreshLabelSource();
    }
    const helpSlot = root.querySelector<HTMLSlotElement>('slot[name="help-text"]');
    if (helpSlot) {
      this._hasHelpSlot = this._readHelpSlotStateSync(helpSlot);
      this._installHelpSlotTextObserver(helpSlot);
    }
    const errorSlot = root.querySelector<HTMLSlotElement>('slot[name="error"]');
    if (errorSlot) {
      this._hasErrorSlot = this._readErrorSlotStateSync(errorSlot);
      this._installErrorSlotTextObserver(errorSlot);
    }
  }

  /**
   * Reads the label slot's assigned nodes and computes the discriminated
   * naming state. An empty whitespace-only slot does NOT count as a useful
   * name. Per AccName 1.2 §4.3.10, `aria-hidden="true"` and `[hidden]`
   * elements contribute zero to the accessible name.
   * @internal
   */
  private _readLabelSlotState(slot: HTMLSlotElement): {
    hasUsefulName: boolean;
    elements: Element[];
    text: string;
  } {
    // Use `assignedNodes()` WITHOUT `flatten: true` so we read only consumer-
    // projected nodes — never the slot's fallback content (the rendered
    // internal `<label>` element when `this.label` is set). Conflating
    // fallback content with consumer slot content makes `_hasLabelSlot`
    // truthy in the label-only case.
    const nodes = slot.assignedNodes();
    const elements: Element[] = [];
    const fragments: string[] = [];
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        elements.push(el);
        if (el.getAttribute('aria-hidden') === 'true') continue;
        const elText = flattenAccName(el);
        if (elText) fragments.push(elText);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const txt = (node.textContent ?? '').trim();
        if (txt) fragments.push(txt);
      }
    }
    const trimmedText = fragments.join(' ').replace(/\s+/g, ' ').trim();
    return {
      hasUsefulName: trimmedText.length > 0,
      elements,
      text: trimmedText,
    };
  }

  /**
   * Re-evaluate the help-text slot's "has meaningful content" state from its
   * current effective text. AccName-aware so descendants carrying
   * `aria-hidden="true"` or `hidden` do NOT count.
   * @internal
   */
  private _readHelpSlotStateSync(slot: HTMLSlotElement): boolean {
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node.textContent ?? '').trim().length > 0) return true;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (flattenAccName(node as Element).length > 0) return true;
      }
    }
    return false;
  }

  /**
   * Re-evaluate the error slot's "has meaningful content" state from its
   * current effective text.
   * @internal
   */
  private _readErrorSlotStateSync(slot: HTMLSlotElement): boolean {
    const nodes = slot.assignedNodes({ flatten: true });
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node.textContent ?? '').trim().length > 0) return true;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (flattenAccName(node as Element).length > 0) return true;
      }
    }
    return false;
  }

  /**
   * Recomputes the discriminated label source. Slot takes precedence over
   * the `label` property because the render path suppresses the internal
   * `<label>` when slotted content is present.
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

  /**
   * (Re-)installs a `MutationObserver` against the deduped union of
   * consumer-resolved label/description elements.
   * @internal
   */
  private _installExternalRefsObserver(elements: Element[]): void {
    if (this._externalRefsObserver) {
      this._externalRefsObserver.disconnect();
      this._externalRefsObserver = null;
    }
    if (elements.length === 0) return;
    const unique = new Set<Element>(elements);
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    for (const el of unique) {
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

  /**
   * Resolves consumer-supplied label/description IDREFs on the host and
   * writes the canonical ARIA onto the **inner readonly `<input>`** for the
   * W3C APG date-picker dialog pattern.
   *
   * The inner input is INTENTIONALLY NOT a `role="combobox"` — it is a
   * readonly text input with `aria-haspopup="dialog"` per W3C APG date picker
   * dialog. A separate trigger button owns `aria-expanded` /
   * `aria-controls=${calendarId}` for the dialog. (Cross-shadow `aria-controls`
   * referencing an in-shadow id is a documented limitation, mirrored from
   * hx-popover and hx-dropdown.)
   *
   * Cross-shadow naming uses a belt-and-suspenders strategy:
   *
   *   1. **Modern path** (`_supportsIdrefRefs === true`): consumer-resolved
   *      label/description elements are written onto
   *      `internals.ariaLabelledByElements` / `ariaDescribedByElements` on
   *      the host. Host-level `aria-labelledby` / `aria-describedby`
   *      attributes are LEFT IN PLACE so AT walking up the DOM also sees them.
   *      Resolved-element text is also flattened onto the inner input as
   *      `aria-label` so AT that does NOT walk up still announces the right
   *      name.
   *
   *   2. **Legacy fallback** (`_supportsIdrefRefs === false`): the resolved-
   *      element text is flattened onto the inner input as `aria-label` and
   *      mirrored into a synthesized in-shadow span pointed at by the inner
   *      input's `aria-describedby`.
   *
   * Writing `aria-labelledby="<light-DOM id>"` directly on the shadow-DOM
   * inner input is INTENTIONALLY avoided: light-DOM ids do not resolve from
   * inside a shadow root.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    const input = this._input;
    if (!input) {
      // Inner input not yet rendered; defer. Still derive `_invalid` so
      // `aria-invalid` first-paint is correct once the input renders.
      const isInvalidEarly = !internals.validity.valid || !!(this.error || this._hasErrorSlot);
      if (this._invalid !== isInvalidEarly) this._invalid = isInvalidEarly;
      return;
    }

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() || '' : '';

    const internalLabel = this.shadowRoot?.getElementById(this._labelId) ?? null;
    const slottedLabelEls = this._slottedLabelEls;
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId) ?? null;
    const errorEl = this.shadowRoot?.getElementById(this._errorId) ?? null;

    const liveLabelledBy = this.getAttribute('aria-labelledby');
    this._consumerLabelledBy = liveLabelledBy;
    const liveDescribedBy = this.getAttribute('aria-describedby');
    this._consumerDescribedBy = liveDescribedBy;

    const consumerLabelEls = resolveIdrefTokens(this, this._consumerLabelledBy);
    const hasEffectiveLabelledBy = consumerLabelEls.length > 0;

    const consumerDescEls = resolveIdrefTokens(this, this._consumerDescribedBy);

    // Observe in-place text mutations on the resolved external IDREF targets.
    this._installExternalRefsObserver([...consumerLabelEls, ...consumerDescEls]);

    const hasError = !!(this.error || this._hasErrorSlot);

    // `aria-invalid` reflects EVERY signal the consumer can use to express
    // invalidity: `setValidity()` (required-empty), explicit `error` property,
    // and slotted error content.
    const isInvalid = !internals.validity.valid || hasError;
    if (this._invalid !== isInvalid) this._invalid = isInvalid;

    // `accessibleLabel` is the canonical AT name when explicitly set; it
    // outranks visible label / aria-labelledby per the helix override.
    const explicitAccessibleLabel =
      typeof this.accessibleLabel === 'string' && this.accessibleLabel.trim().length > 0
        ? this.accessibleLabel
        : null;

    // Top-level `aria-hidden="true"` / `hidden` elements MUST NOT be forwarded
    // to `internals.ariaLabelledByElements` / `ariaDescribedByElements`.
    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    // Build the augmented element lists used by the modern (IDL-refs) path.
    const labelElsForInternals: Element[] = [];
    if (!explicitAccessibleLabel) {
      labelElsForInternals.push(...consumerLabelEls.filter(isVisibleForAccName));
      if (!hasEffectiveLabelledBy && !hostAriaLabel) {
        if (this._labelSource === 'slot' && slottedLabelEls.length > 0) {
          labelElsForInternals.push(...slottedLabelEls.filter(isVisibleForAccName));
        } else if (this._labelSource === 'string' && internalLabel) {
          labelElsForInternals.push(internalLabel);
        }
      }
    }

    const descElsForInternals: Element[] = [...consumerDescEls.filter(isVisibleForAccName)];
    if (helpEl && !hasError && this._hasHelpSlot) {
      descElsForInternals.push(helpEl);
    }
    if (errorEl && hasError) {
      descElsForInternals.push(errorEl);
    }

    // ─── Modern-path: ElementInternals IDL element references ───
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
      // Forward `accessibleLabel` to `internals.ariaLabel` when set; CLEAR
      // with `null` (NOT `''`) when absent, because per W3C AccName an empty
      // `aria-label` STILL outranks `aria-labelledby` and would erase the
      // name resolved from element references / fallbacks.
      if (explicitAccessibleLabel) {
        internals.ariaLabel = explicitAccessibleLabel;
      } else {
        internals.ariaLabel = null;
      }
    }

    // ─── Compute the inner input's accessible name (text-flatten path) ───
    const flattenText = (els: Element[]): string =>
      els
        .filter(isVisibleForAccName)
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ');

    let inputAriaLabel: string | null = null;
    let inputAriaLabelledBy: string | null = null;

    // Precedence (per AccName 1.2 §4.3.1 with helix override):
    //   1. accessibleLabel (helix-specific override)
    //   2. consumer aria-labelledby resolves → text-flatten
    //   3. consumer aria-label on the host
    //   4. slotted label → text content (NEVER cross-shadow id reference)
    //   5. label property → internal `<label>` id (same shadow root)
    //   6. else: unnamed
    let labelledByFlat = '';
    if (!explicitAccessibleLabel && hasEffectiveLabelledBy) {
      labelledByFlat = flattenText(consumerLabelEls);
    }
    if (explicitAccessibleLabel) {
      inputAriaLabel = explicitAccessibleLabel;
    } else if (labelledByFlat) {
      inputAriaLabel = labelledByFlat;
    } else if (hostAriaLabel) {
      inputAriaLabel = hostAriaLabel;
    } else if (this._labelSource === 'slot') {
      // Light-DOM ids do not resolve from inside a shadow root, so we MUST
      // text-flatten on the legacy/fallback path.
      if (this._labelSlotText) {
        inputAriaLabel = this._labelSlotText;
      } else if (slottedLabelEls.length > 0) {
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
    // Unify ALL descriptions through a single `aria-describedby` channel.
    // The W3C AccName algorithm ignores `aria-description` whenever
    // `aria-describedby` is also present, so consumer descriptions are
    // mirrored into a synthesized in-shadow span and that same-root id is
    // added to the chain.
    const consumerDescSpan = this.shadowRoot?.getElementById(this._consumerDescId) ?? null;
    const consumerDescText = flattenText(consumerDescEls);
    if (consumerDescSpan && consumerDescSpan.textContent !== consumerDescText) {
      consumerDescSpan.textContent = consumerDescText;
    }

    const describedByIds: string[] = [];
    if (consumerDescText && consumerDescSpan) {
      describedByIds.push(this._consumerDescId);
    }
    if (helpEl && !hasError && this._hasHelpSlot) {
      describedByIds.push(this._helpTextId);
    }
    if (errorEl && hasError) {
      describedByIds.push(this._errorId);
    }
    // The component's own helpText property renders an in-shadow help div;
    // chain that id when no slotted help is present (it's the same id and
    // the fallback content lives in the same div).
    if (
      !this._hasHelpSlot &&
      this.helpText &&
      !hasError &&
      helpEl &&
      !describedByIds.includes(this._helpTextId)
    ) {
      describedByIds.push(this._helpTextId);
    }
    if (describedByIds.length > 0) {
      const value = describedByIds.join(' ');
      if (input.getAttribute('aria-describedby') !== value) {
        input.setAttribute('aria-describedby', value);
      }
    } else if (input.hasAttribute('aria-describedby')) {
      input.removeAttribute('aria-describedby');
    }

    // Never write `aria-description` on the inner input — silently dropped by
    // AccName whenever `aria-describedby` is also present. Strip defensively.
    if (input.hasAttribute('aria-description')) {
      input.removeAttribute('aria-description');
    }
  }

  /**
   * (Re-)installs the help-text slot text/visibility observer.
   * @internal
   */
  private _installHelpSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._helpSlotTextObserver?.disconnect();
    if (!slot) {
      this._helpSlotTextObserver = null;
      return;
    }
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
   * (Re-)installs the error slot text/visibility observer.
   * @internal
   */
  private _installErrorSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._errorSlotTextObserver?.disconnect();
    if (!slot) {
      this._errorSlotTextObserver = null;
      return;
    }
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

  /**
   * (Re-)installs the label slot text/visibility observer over the current
   * set of slotted label elements.
   * @internal
   */
  private _installLabelSlotTextObserver(elements: Element[]): void {
    this._labelSlotTextObserver?.disconnect();
    if (elements.length === 0) {
      this._labelSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      const fragments: string[] = [];
      for (const el of elements) {
        if (el.getAttribute('aria-hidden') === 'true') continue;
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

  // ─── Slot Change Handlers ───

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readLabelSlotState(e.target);
    this._hasLabelSlot = state.hasUsefulName;
    this._slottedLabelEls = state.elements;
    this._labelSlotText = state.text;
    // Preserve back-compat: if the first slotted label element lacks an id,
    // assign a stable one — earlier callers relied on this for `for=…`-style
    // associations.
    if (state.elements.length > 0) {
      const slottedLabel = state.elements[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._inputId}-slotted-label`;
      }
    }
    this._installLabelSlotTextObserver(state.elements);
    this._refreshLabelSource();
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasErrorSlot = this._readErrorSlotStateSync(e.target);
    this._installErrorSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasHelpSlot = this._readHelpSlotStateSync(e.target);
    this._installHelpSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  // ─── Document Click ───

  private readonly _handleDocumentClick = (e: MouseEvent): void => {
    if (!this._isOpen) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._closeCalendar();
    }
  };

  // ─── Form Integration ───

  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
    // Re-sync ARIA after every setValidity() so `aria-invalid` reflects
    // freshly computed validity.
    this._syncHostAriaSemantics();
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._isOpen = false;
    this._resetInteractionState();
  }

  /** @internal */
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

  // ─── Public Methods ───

  override focus(options?: FocusOptions): void {
    this._trigger?.focus(options);
  }

  // ─── Date Utilities ───

  /** @internal */
  private _parseISODate(iso: string): Date | null {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  /** @internal */
  private _toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** @internal */
  private _formatForDisplay(iso: string): string {
    const date = this._parseISODate(iso);
    if (!date) return '';
    return date.toLocaleDateString(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /** @internal */
  private _isDateDisabled(date: Date): boolean {
    const iso = this._toISO(date);
    if (this.min && iso < this.min) return true;
    if (this.max && iso > this.max) return true;
    return false;
  }

  /** @internal */
  private _isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /** @internal */
  private _isToday(date: Date): boolean {
    return this._isSameDay(date, new Date());
  }

  /** @internal */
  private _ensureFormatters(): void {
    if (this._formatterLocale === this.locale && this._weekdayFormatter && this._monthFormatter) {
      return;
    }
    this._weekdayFormatter = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });
    this._monthFormatter = new Intl.DateTimeFormat(this.locale, { month: 'long' });
    this._formatterLocale = this.locale;
    this._cachedWeekdayNames = null;
  }

  /** @internal */
  private _getMonthName(month: number): string {
    this._ensureFormatters();
    const fmt = this._monthFormatter ?? new Intl.DateTimeFormat(this.locale, { month: 'long' });
    return fmt.format(new Date(2000, month, 1));
  }

  /** @internal */
  private _getDayName(dayIndex: number): string {
    this._ensureFormatters();
    const fmt =
      this._weekdayFormatter ?? new Intl.DateTimeFormat(this.locale, { weekday: 'short' });
    return fmt.format(new Date(2000, 0, 2 + dayIndex));
  }

  /** @internal */
  private _getWeekdayNames(): string[] {
    this._ensureFormatters();
    if (!this._cachedWeekdayNames) {
      this._cachedWeekdayNames = Array.from({ length: 7 }, (_, i) => this._getDayName(i));
    }
    return this._cachedWeekdayNames;
  }

  // ─── Calendar Grid ───

  /** @internal */
  private _getDaysInGrid(): (Date | null)[] {
    const firstOfMonth = new Date(this._viewYear, this._viewMonth, 1);
    const leadingBlanks = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(this._viewYear, this._viewMonth, d));
    }

    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
    }

    return cells;
  }

  // ─── Calendar Open/Close ───

  /** @internal */
  private _openCalendar(): void {
    if (this.disabled) return;
    this._isOpen = true;
  }

  /** @internal */
  private _closeCalendar(): void {
    this._isOpen = false;
    void this.updateComplete.then(() => {
      this._trigger?.focus();
    });
  }

  /** @internal */
  private _toggleCalendar(): void {
    if (this._isOpen) {
      this._closeCalendar();
    } else {
      this._openCalendar();
    }
  }

  // ─── Focus Management ───

  /** @internal */
  private _focusActiveDay(): void {
    if (!this._calendar) return;

    const selectedISO = this.value;
    const selected = this._parseISODate(selectedISO);

    let targetDay: number | null = null;

    if (
      selected &&
      selected.getFullYear() === this._viewYear &&
      selected.getMonth() === this._viewMonth
    ) {
      targetDay = selected.getDate();
    } else {
      const today = new Date();
      if (today.getFullYear() === this._viewYear && today.getMonth() === this._viewMonth) {
        const todayDate = new Date(this._viewYear, this._viewMonth, today.getDate());
        if (!this._isDateDisabled(todayDate)) {
          targetDay = today.getDate();
        }
      }
    }

    if (targetDay === null) {
      const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(this._viewYear, this._viewMonth, d);
        if (!this._isDateDisabled(date)) {
          targetDay = d;
          break;
        }
      }
    }

    if (targetDay !== null) {
      this._focusedDay = targetDay;
      void this.updateComplete.then(() => {
        const btn = this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${targetDay}"]`);
        btn?.focus();
      });
    }
  }

  // ─── Month Navigation ───

  /** @internal */
  private _prevMonth(): void {
    if (this._viewMonth === 0) {
      this._viewMonth = 11;
      this._viewYear = this._viewYear - 1;
    } else {
      this._viewMonth = this._viewMonth - 1;
    }
  }

  /** @internal */
  private _nextMonth(): void {
    if (this._viewMonth === 11) {
      this._viewMonth = 0;
      this._viewYear = this._viewYear + 1;
    } else {
      this._viewMonth = this._viewMonth + 1;
    }
  }

  // ─── Day Selection ───

  /** @internal */
  private _selectDay(date: Date): void {
    if (this._isDateDisabled(date)) return;

    const iso = this._toISO(date);
    this.value = iso;
    this._internals.setFormValue(iso);
    this._handleInteractionInput();
    this._handleInteractionBlur();

    this.dispatchEvent(
      new CustomEvent<{ value: string; date: Date }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: iso, date },
      }),
    );

    this._closeCalendar();
  }

  /** @internal */
  private readonly _handleGridClick = (e: Event): void => {
    const target = (e.target as Element).closest<HTMLElement>('[data-date]');
    if (!target) return;
    const iso = target.dataset['date'];
    if (!iso) return;
    const date = this._parseISODate(iso);
    if (date) {
      this._selectDay(date);
    }
  };

  // ─── Calendar Keyboard Navigation ───

  /** @internal */
  private _handleCalendarKeydown(e: KeyboardEvent): void {
    const { key } = e;

    if (key === 'Tab') {
      this._handleCalendarTab(e);
      return;
    }

    if (key === 'Escape') {
      e.stopPropagation();
      this._closeCalendar();
      return;
    }

    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== 'Enter' &&
      key !== ' ' &&
      key !== 'Home' &&
      key !== 'End' &&
      key !== 'PageUp' &&
      key !== 'PageDown'
    ) {
      return;
    }

    e.preventDefault();

    const currentFocused = this._focusedDay ?? 1;
    const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();

    if (key === 'Enter' || key === ' ') {
      const date = new Date(this._viewYear, this._viewMonth, currentFocused);
      if (!this._isDateDisabled(date)) {
        this._selectDay(date);
      }
      return;
    }

    if (key === 'PageUp') {
      this._prevMonth();
      return;
    }

    if (key === 'PageDown') {
      this._nextMonth();
      return;
    }

    if (key === 'Home') {
      const currentDate = new Date(this._viewYear, this._viewMonth, currentFocused);
      const dayOfWeek = currentDate.getDay();
      const newDay = currentFocused - dayOfWeek;
      if (newDay >= 1) {
        this._focusedDay = newDay;
        void this.updateComplete.then(() => {
          this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
        });
      }
      return;
    }

    if (key === 'End') {
      const currentDate = new Date(this._viewYear, this._viewMonth, currentFocused);
      const dayOfWeek = currentDate.getDay();
      const daysToSaturday = 6 - dayOfWeek;
      const newDay = currentFocused + daysToSaturday;
      if (newDay <= daysInMonth) {
        this._focusedDay = newDay;
        void this.updateComplete.then(() => {
          this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
        });
      }
      return;
    }

    let newDay = currentFocused;

    if (key === 'ArrowLeft') newDay = currentFocused - 1;
    if (key === 'ArrowRight') newDay = currentFocused + 1;
    if (key === 'ArrowUp') newDay = currentFocused - 7;
    if (key === 'ArrowDown') newDay = currentFocused + 7;

    if (newDay < 1) {
      this._prevMonth();
      const prevDaysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      this._focusedDay = prevDaysInMonth + newDay;
      void this.updateComplete.then(() => {
        const day = this._focusedDay;
        this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
      });
      return;
    }

    if (newDay > daysInMonth) {
      const overflow = newDay - daysInMonth;
      this._nextMonth();
      this._focusedDay = overflow;
      void this.updateComplete.then(() => {
        const day = this._focusedDay;
        this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
      });
      return;
    }

    this._focusedDay = newDay;
    void this.updateComplete.then(() => {
      this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
    });
  }

  // ─── Navigation Boundary Checks ───

  /** @internal */
  private _isPrevMonthDisabled(): boolean {
    if (!this.min) return false;
    const firstOfCurrentView = new Date(this._viewYear, this._viewMonth, 1);
    const minDate = this._parseISODate(this.min);
    if (!minDate) return false;
    return firstOfCurrentView <= minDate;
  }

  /** @internal */
  private _isNextMonthDisabled(): boolean {
    if (!this.max) return false;
    const lastOfCurrentView = new Date(this._viewYear, this._viewMonth + 1, 0);
    const maxDate = this._parseISODate(this.max);
    if (!maxDate) return false;
    return lastOfCurrentView >= maxDate;
  }

  // ─── Focus Trap ───

  /** @internal */
  private _handleCalendarTab(e: KeyboardEvent): void {
    if (e.key !== 'Tab' || !this._isOpen) return;

    const focusableEls = this._calendar?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex="0"]',
    );
    if (!focusableEls || focusableEls.length === 0) return;

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    // In shadow DOM, document.activeElement returns the host element, not the
    // focused inner element. Use shadowRoot.activeElement exclusively so the
    // comparison is accurate and the trap cannot malfunction and strand users.
    const shadowActive = this.shadowRoot?.activeElement;

    if (e.shiftKey) {
      if (shadowActive === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (shadowActive === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderWeekdayHeaders() {
    const names = this._getWeekdayNames();
    const headers = names.map(
      (name) =>
        html`<div class="calendar__weekday" role="columnheader" aria-label=${name}>
          ${name.slice(0, 2)}
        </div>`,
    );
    return html`<div class="calendar__row" role="row">${headers}</div>`;
  }

  /** @internal */
  private _renderDayGrid() {
    const cells = this._dayGrid;
    const selectedDate = this._parseISODate(this.value);
    const today = new Date();

    const rows: ReturnType<typeof html>[] = [];

    for (let rowStart = 0; rowStart < cells.length; rowStart += 7) {
      const rowCells = cells.slice(rowStart, rowStart + 7).map((date) => {
        if (date === null) {
          return html`<div class="calendar__day-cell" role="gridcell" aria-hidden="true"></div>`;
        }

        const isSelected = selectedDate ? this._isSameDay(date, selectedDate) : false;
        const isToday = this._isSameDay(date, today);
        const isDisabled = this._isDateDisabled(date);
        const isFocused = this._focusedDay === date.getDate();
        const dayNumber = date.getDate();
        const iso = this._toISO(date);
        const ariaLabel = this._dayAriaLabels.get(iso) ?? iso;

        const dayClasses = {
          calendar__day: true,
          'calendar__day--selected': isSelected,
          'calendar__day--today': isToday,
          'calendar__day--disabled': isDisabled,
        };

        return html`<div
          class="calendar__day-cell"
          role="gridcell"
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${isDisabled ? 'true' : nothing}
          aria-current=${isToday ? 'date' : nothing}
        >
          <button
            part="day"
            class=${classMap(dayClasses)}
            type="button"
            data-day=${dayNumber}
            data-date=${iso}
            aria-label=${ariaLabel}
            tabindex=${isFocused ? '0' : '-1'}
            ?disabled=${isDisabled}
          >
            ${dayNumber}
          </button>
        </div>`;
      });

      rows.push(html`<div class="calendar__row" role="row">${rowCells}</div>`);
    }

    return rows;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const displayValue = this._formatForDisplay(this.value);
    const monthName = this._getMonthName(this._viewMonth);

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`
                  <label part="label" id=${this._labelId} class="field__label" for=${this._inputId}>
                    ${this.label}
                    ${this.required
                      ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <!-- Input + Trigger -->
        <!--
          W3C APG date picker dialog pattern: the inner input is a readonly
          text input, NOT a combobox. Users do not type — they open the dialog
          via the trigger button (or by clicking the input). The trigger button
          owns aria-expanded and aria-controls (pointed at the in-shadow
          calendar id) for the dialog. Cross-shadow aria-controls referencing
          an in-shadow id is a documented limitation and matches the precedent
          set by hx-popover and hx-dropdown.
        -->
        <div part="input-wrapper" class="field__input-wrapper">
          <input
            part="input"
            class="field__input"
            id=${this._inputId}
            type="text"
            readonly
            .value=${displayValue}
            placeholder=${ifDefined(this.format || undefined)}
            ?disabled=${this.disabled}
            aria-invalid=${this._invalid ? 'true' : 'false'}
            aria-required=${this.required ? 'true' : 'false'}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-haspopup="dialog"
            @click=${this._openCalendar}
          />
          <button
            part="trigger"
            class="field__trigger"
            type="button"
            aria-label=${this._isOpen ? this.closeCalendarLabel : this.openCalendarLabel}
            aria-haspopup="dialog"
            aria-expanded=${this._isOpen ? 'true' : 'false'}
            aria-controls=${this._calendarId}
            ?disabled=${this.disabled}
            @click=${this._toggleCalendar}
          >
            <hx-icon
              class="field__trigger-glyph"
              library="helix"
              name="calendar"
              aria-hidden="true"
            ></hx-icon>
          </button>
        </div>

        <!-- Calendar Popup -->
        <dialog
          part="calendar"
          class="calendar"
          id=${this._calendarId}
          aria-label=${this.chooseDateLabel}
          @keydown=${this._handleCalendarKeydown}
        >
          <!-- Screen reader live region -->
          <div
            id=${this._liveRegionId}
            class="calendar__live-region"
            aria-live="polite"
            aria-atomic="true"
          >
            ${this._liveMessage}
          </div>

          <!-- Month Navigation -->
          <div part="month-nav" class="calendar__nav">
            <button
              class="calendar__nav-btn"
              type="button"
              aria-label=${this.previousMonthLabel}
              ?disabled=${this._isPrevMonthDisabled()}
              @click=${this._prevMonth}
            >
              &#8249;
            </button>
            <span class="calendar__month-label" aria-hidden="true">
              ${monthName} ${this._viewYear}
            </span>
            <button
              class="calendar__nav-btn"
              type="button"
              aria-label=${this.nextMonthLabel}
              ?disabled=${this._isNextMonthDisabled()}
              @click=${this._nextMonth}
            >
              &#8250;
            </button>
          </div>

          <!-- Day Grid -->
          <div
            class="calendar__grid"
            role="grid"
            aria-label="${monthName} ${this._viewYear}"
            @click=${this._handleGridClick}
          >
            ${this._renderWeekdayHeaders()} ${this._renderDayGrid()}
          </div>
        </dialog>

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

        <!-- Help Text -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${(!this.helpText && !this._hasHelpSlot) || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>

        <!--
          Synthesized in-shadow mirror of the consumer-resolved description
          text. Its id is appended to the inner input's aria-describedby chain
          so AT picks the consumer description up through the standard
          described-by channel without needing aria-description (which W3C
          AccName drops whenever aria-describedby is also present).
        -->
        <span id=${this._consumerDescId} class="field__sr-only" aria-hidden="false"></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-date-picker': HelixDatePicker;
  }
}
