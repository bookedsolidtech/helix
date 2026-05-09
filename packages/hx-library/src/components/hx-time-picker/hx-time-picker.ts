import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { helixTimePickerStyles } from './hx-time-picker.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

// ─── Time Slot ───────────────────────────────────────────────────────────────

interface TimeSlot {
  /** HH:MM in 24-hour format — canonical internal value. */
  value: string;
  /** Display label respecting the component's `format` property. */
  label: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:MM" into { hours, minutes }. Returns null when the string is not valid. */
function parseHHMM(raw: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/** Format { hours, minutes } as zero-padded "HH:MM". */
function toHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Convert a 24-hour HH:MM value to a 12-hour display string (e.g. "02:30 PM"). */
function to12h(value: string): string {
  const parsed = parseHHMM(value);
  if (!parsed) return value;
  const { hours, minutes } = parsed;
  const period = hours < 12 ? 'AM' : 'PM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Generate ordered time slots between `minTime` and `maxTime` (inclusive) at
 * `stepMinutes` intervals.  Both bounds are HH:MM strings; defaults fall back
 * to "00:00" / "23:59".
 */
function generateSlots(
  minTime: string,
  maxTime: string,
  stepMinutes: number,
  format: '12h' | '24h',
): TimeSlot[] {
  const minParsed = parseHHMM(minTime) ?? { hours: 0, minutes: 0 };
  const maxParsed = parseHHMM(maxTime) ?? { hours: 23, minutes: 59 };

  const minTotal = minParsed.hours * 60 + minParsed.minutes;
  const maxTotal = maxParsed.hours * 60 + maxParsed.minutes;

  // Guard against degenerate step values
  const step = Math.max(1, Math.round(stepMinutes));

  const slots: TimeSlot[] = [];
  for (let t = minTotal; t <= maxTotal; t += step) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    const value = toHHMM(h, m);
    slots.push({
      value,
      label: format === '12h' ? to12h(value) : value,
    });
  }
  return slots;
}

/** Clamp a raw HH:MM value to the [min, max] range; return '' when value is empty. */
function clampValue(value: string, minTime: string, maxTime: string): string {
  if (!value) return '';
  const parsed = parseHHMM(value);
  if (!parsed) return '';

  const total = parsed.hours * 60 + parsed.minutes;
  const minParsed = parseHHMM(minTime) ?? { hours: 0, minutes: 0 };
  const maxParsed = parseHHMM(maxTime) ?? { hours: 23, minutes: 59 };
  const minTotal = minParsed.hours * 60 + minParsed.minutes;
  const maxTotal = maxParsed.hours * 60 + maxParsed.minutes;

  if (total < minTotal) return toHHMM(minParsed.hours, minParsed.minutes);
  if (total > maxTotal) return toHHMM(maxParsed.hours, maxParsed.minutes);
  return toHHMM(parsed.hours, parsed.minutes);
}

/**
 * Attempt to parse a user-typed string (12 h or 24 h) into an HH:MM value.
 * Returns null when the string cannot be resolved.
 */
function parseUserInput(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();

  // 24-hour "HH:MM" or "H:MM"
  const hhmm = parseHHMM(trimmed);
  if (hhmm) return toHHMM(hhmm.hours, hhmm.minutes);

  // 12-hour patterns: "2:30 PM", "2:30PM", "02:30 AM", "230 pm", "2 PM"
  const twelve =
    /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/.exec(trimmed) ??
    /^(\d{1,2})(\d{2})\s*(AM|PM)$/.exec(trimmed);

  if (twelve) {
    let hours = parseInt(twelve[1] ?? '0', 10);
    const minutes = twelve[2] !== undefined ? parseInt(twelve[2], 10) : 0;
    const period = twelve[3] ?? '';
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (period === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
    return toHHMM(hours, minutes);
  }

  return null;
}

/**
 * AccName-aware text flattener. Walks the subtree of `root` and concatenates
 * text-node content, REJECTING any element subtree carrying `aria-hidden="true"`
 * or the `hidden` attribute per W3C AccName 1.2 §4.3.10. Used by hx-time-picker
 * for both external IDREF flatten (host aria-labelledby/aria-describedby
 * targets) and slotted-label aggregation, so nested decorative content like
 * `<svg aria-hidden="true"><title>icon</title></svg>` does not leak into the
 * inner input's announced name/description.
 *
 * The TreeWalker filter only inspects elements VISITED during the walk — it
 * never tests the root itself, so a hidden ROOT (e.g. `<span slot="label" hidden>`)
 * would still contribute its descendants' text. Per AccName 1.2 §4.3.10, a
 * hidden root contributes the empty string. Gate the walk here so every caller
 * (slotted label/help/error and external IDREF flatten) honors the rule
 * symmetrically.
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

const _nextTimePickerId = createIdCounter('hx-time-picker');

// ─── Component ───────────────────────────────────────────────────────────────

/** Detail for the hx-change event dispatched by hx-time-picker. */
export interface HxTimePickerChangeDetail {
  value: string;
}

/**
 * A time-picker component with a combobox pattern: a text input with format
 * masking and a dropdown listbox of pre-generated time slots.
 *
 * @summary Form-associated time picker with 12h/24h format support and dropdown listbox.
 *
 * @tag hx-time-picker
 *
 * @slot label - Custom label content; overrides the rendered label element when used.
 * @slot help-text - Help text displayed below the field.
 * @slot error - Custom error content; overrides the `error` property.
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected time changes. Detail value is HH:MM (24h).
 *
 * @csspart label - The label element.
 * @csspart input - The text input element.
 * @csspart toggle - The clock icon toggle button.
 * @csspart listbox - The dropdown `<ul>` element.
 * @csspart option - Each `<li>` option in the listbox.
 * @csspart field - The outer field wrapper element.
 * @csspart error - The error message element.
 * @csspart help-text - The help text element.
 *
 * @cssprop [--hx-time-picker-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-time-picker-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-time-picker-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-time-picker-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-time-picker-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-time-picker-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-time-picker-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-time-picker-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-time-picker-chevron-color=var(--hx-color-neutral-500)] - Toggle chevron color.
 * @cssprop [--hx-time-picker-listbox-bg=var(--hx-color-neutral-0)] - Listbox background.
 * @cssprop [--hx-time-picker-listbox-max-height=16rem] - Maximum height of the dropdown.
 * @cssprop [--hx-time-picker-listbox-shadow=0 4px 16px color-mix(in srgb, var(--hx-color-neutral-900) 12%, transparent)] - Box shadow for the dropdown listbox.
 * @cssprop [--hx-time-picker-option-color=var(--hx-color-neutral-800)] - Option text color.
 * @cssprop [--hx-time-picker-option-hover-bg=var(--hx-color-primary-50)] - Option hover background.
 * @cssprop [--hx-time-picker-option-hover-color=var(--hx-color-primary-700)] - Option hover text color.
 * @cssprop [--hx-time-picker-option-selected-bg=var(--hx-color-primary-100)] - Selected option background.
 * @cssprop [--hx-time-picker-option-selected-color=var(--hx-color-primary-800)] - Selected option text color.
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
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-primary-700] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-color-primary-800] - Color.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-time-picker/AAA-AUDIT.md
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
 * @figma-component-name hx-time-picker
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-time-picker')
export class HelixTimePicker extends FormMixin(HelixElement) {
  static override styles = [helixTimePickerStyles, forcedColorsField];

  // ─── Form Association ───

  /**
   * Declares this element as form-associated so it participates in native form submission.
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
   * The name submitted with the form. Value is always HH:MM (24-hour).
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The current value in HH:MM (24-hour) format.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * The earliest selectable time in HH:MM format.
   * @attr min
   */
  @property({ type: String })
  min = '00:00';

  /**
   * The latest selectable time in HH:MM format.
   * @attr max
   */
  @property({ type: String })
  max = '23:59';

  /**
   * Step interval between dropdown options, in minutes. Defaults to 30.
   * @attr step
   */
  @property({ type: Number })
  step = 30;

  /**
   * The visible label text for the field.
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
   * Display format for the time input. '12h' shows AM/PM; '24h' is bare HH:MM.
   * @attr format
   */
  @property({ type: String, reflect: true })
  format: '12h' | '24h' = '12h';

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
   * Whether the dropdown listbox is currently open.
   * @internal
   */
  @state() private _open = false;
  /**
   * Index of the currently keyboard-active option in the listbox; -1 when none is active.
   * @internal
   */
  @state() private _activeIndex = -1;
  /**
   * The display string shown in the text input, formatted according to the current `format` property.
   * @internal
   */
  @state() private _inputDisplayValue = '';
  /**
   * Whether the label slot has slotted content assigned to it.
   * @internal
   */
  @state() private _hasLabelSlot = false;
  /**
   * Whether the error slot has slotted content assigned to it.
   * @internal
   */
  @state() private _hasErrorSlot = false;
  /**
   * Whether the help-text slot has slotted content assigned to it.
   * @internal
   */
  @state() private _hasHelpSlot = false;
  /**
   * Source of the accessible name. Discriminated union avoids string sentinels.
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

  // ─── Stable IDs (monotonically incrementing counter for SSR safety) ───

  private readonly _id = _nextTimePickerId();
  /**
   * Unique ID for the listbox element, referenced by `aria-controls` on the combobox input.
   * @internal
   */
  private readonly _listboxId = `${this._id}-listbox`;
  /**
   * Unique ID for the error message element, referenced by `aria-describedby` on the input.
   * @internal
   */
  private readonly _errorId = `${this._id}-error`;
  /**
   * Unique ID for the help text element, referenced by `aria-describedby` on the input.
   * @internal
   */
  private readonly _helpId = `${this._id}-help`;
  /**
   * Unique ID for the internal `<label>` element, referenced by inner input
   * `aria-labelledby` when the `label` property names the field.
   * @internal
   */
  private readonly _labelId = `${this._id}-label`;
  /**
   * Id of the synthesized in-shadow span that mirrors the consumer-resolved
   * description text. Appended to the inner input's `aria-describedby` so AT
   * picks the consumer description up through the standard described-by
   * channel — `aria-description` is intentionally NOT written, because the
   * W3C AccName algorithm ignores `aria-description` whenever
   * `aria-describedby` is also present.
   * @internal
   */
  private readonly _consumerDescId = `${this._id}-consumer-desc`;

  // ─── Query References ───

  /**
   * Reference to the text input element inside the shadow DOM.
   * @internal
   */
  @query('.field__input')
  private _inputEl: HTMLInputElement | undefined;

  /**
   * Reference to the listbox `<ul>` element inside the shadow DOM.
   * @internal
   */
  @query('.field__listbox')
  private _listboxEl: HTMLUListElement | undefined;

  // ─── Memoized slot generation (avoids regenerating on every render call) ───

  /**
   * Memoized array of generated time slots; null until first access.
   * @internal
   */
  private _cachedSlots: TimeSlot[] | null = null;
  /**
   * Cache key composed of min, max, step, and format; used to detect when slots must be regenerated.
   * @internal
   */
  private _slotsKey = '';

  /**
   * Lazily generates and caches the list of time slots based on current min, max, step, and format.
   * @internal
   */
  private get _slots(): TimeSlot[] {
    const key = `${this.min}|${this.max}|${this.step}|${this.format}`;
    if (this._cachedSlots === null || key !== this._slotsKey) {
      this._slotsKey = key;
      this._cachedSlots = generateSlots(this.min, this.max, this.step, this.format);
    }
    return this._cachedSlots;
  }

  // ─── Host-canonical ARIA bookkeeping ───

  /** Handle for the shared IDREF observer. @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;
  /**
   * Watches assigned `<slot name="help-text">` nodes for in-place text
   * mutations so help-text effective state stays in sync with consumer
   * `textContent` writes that don't trigger a `slotchange` event.
   * @internal
   */
  private _helpSlotTextObserver: MutationObserver | null = null;
  /**
   * Watches assigned `<slot name="error">` nodes for in-place text mutations.
   * @internal
   */
  private _errorSlotTextObserver: MutationObserver | null = null;
  /**
   * Dedicated host observer scoped to `aria-describedby` with
   * `attributeOldValue: true`. Governed by the disconnect-during-strip
   * discipline.
   * @internal
   */
  private _hostDescribedByObserver: MutationObserver | null = null;
  /**
   * Most recently observed *consumer-supplied* `aria-labelledby` baseline.
   * Refreshed on every sync. Modern + legacy paths leave the host attribute
   * in place, so the live attribute IS the cache.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;
  /** @internal — see `_consumerLabelledBy`. */
  private _consumerDescribedBy: string | null = null;
  /**
   * Direct references to ALL labellable elements projected into
   * `<slot name="label">`. Aggregating every assigned element preserves
   * composed labels such as
   * `<svg slot="label" aria-hidden="true">…</svg><span slot="label">Time</span>`.
   * The modern path passes the visible subset to
   * `internals.ariaLabelledByElements`; the fallback path text-flattens every
   * non-hidden node into `_labelSlotText` per AccName 1.2.
   * @internal
   */
  private _slottedLabelEls: Element[] = [];
  /**
   * Watches in-place text mutations on the assigned slotted label nodes. The
   * `slotchange` event covers add/remove/replace; this MO covers
   * `node.textContent = '…'` updates on an unchanged node (consumer i18n
   * re-renders) and `aria-hidden` / `hidden` toggles per AccName 1.2 §4.3.10.
   * @internal
   */
  private _labelSlotTextObserver: MutationObserver | null = null;
  /**
   * Watches in-place text mutations on consumer light-DOM elements resolved
   * from host `aria-labelledby` / `aria-describedby`. Without this, a consumer
   * keeping the same `<label id="…">` but mutating its `textContent` (e.g.
   * i18n re-render) would leave the inner input's `aria-label` and
   * synthesized description span stale indefinitely.
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  // ─── Outside-click handler (bound reference for add/removeEventListener) ───

  /**
   * Closes the listbox when a click is detected outside the component; bound for stable add/removeEventListener calls.
   * @internal
   */
  private readonly _handleOutsideClick = (e: MouseEvent): void => {
    if (!this.isConnected) return;
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._closeListbox();
    }
  };

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);

    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs.
    const ctor = this.constructor as typeof HelixTimePicker;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // Install the dedicated `aria-describedby` retraction observer BEFORE
    // the seeded `_syncHostAriaSemantics()` call below, then govern its
    // lifetime with the disconnect-during-strip discipline.
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
    document.removeEventListener('click', this._handleOutsideClick);
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

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // Keep display value in sync whenever the canonical value or format changes
    if (changed.has('value') || changed.has('format')) {
      this._inputDisplayValue = this.value
        ? this.format === '12h'
          ? to12h(this.value)
          : this.value
        : '';
    }
    // Seed `_announcedError` BEFORE render so the persistent live region
    // renders with the error text in the SAME frame that removes `hidden`
    // from the alert container. Covers first paint AND runtime transitions
    // from "" to "Server rejected" via async/server-side validation.
    if (changed.has('error') || !this.hasUpdated) {
      this._announcedError = this.error ?? '';
    }
    if (changed.has('label')) {
      this._refreshLabelSource();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('value')) {
      this._internals.setFormValue(this.value || null);
    }
    // When the listbox opens, scroll the selected (or active) option into view
    if ((changed as Map<PropertyKey, unknown>).has('_open') && this._open) {
      this._scrollActiveOptionIntoView();
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Drive re-announcement from reactive state on error→error transitions
    // (rAF clear-and-re-set forces AT to re-read role="alert" content).
    if (changed.has('error')) {
      const previousError = changed.get('error') as string | undefined;
      if (previousError && this.error) {
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        this._announcedError = this.error;
      }
    }
  }

  override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // `slotchange` fires as a microtask after the initial synchronous render.
    // Without proactive seeding, the first `_syncHostAriaSemantics()` call
    // (driven from `updated()` in this same cycle, AFTER firstUpdated returns)
    // would observe stale `false` / empty state for `_hasLabelSlot`,
    // `_slottedLabelEls`, `_labelSlotText`, `_hasHelpSlot`, and
    // `_hasErrorSlot`. Seed synchronously here.
    this._seedSlotStateSync();
    // Re-sync now that the slot state is populated so AT sees the right
    // accessible name on first paint.
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
        'hx-time-picker',
        'No accessible label provided. Set the `label` attribute, `accessible-label`, `aria-label`, `aria-labelledby`, or project a `<slot name="label">` child. An unlabeled time picker violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
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
   * name. Aggregates ALL assigned elements (not just the first); per AccName
   * 1.2 §4.3.10, `aria-hidden="true"` and `[hidden]` elements contribute zero
   * to the accessible name (their text is skipped during flattening).
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
   * current effective text. Mirrors the slotchange-handler logic but is
   * invocable from the in-place mutation observer so that clearing
   * `textContent` on the same slotted node flips `_hasHelpSlot` back to
   * `false`. Uses AccName-aware flatten so descendants carrying
   * `aria-hidden="true"` or `hidden` do NOT count toward "has meaningful
   * content".
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
   * current effective text. AccName-aware so visibility-suppressed roots /
   * descendants don't keep the field stuck in error state.
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

  // ─── Inner-input ARIA sync (W3C APG editable combobox) ───

  /**
   * (Re-)installs a `MutationObserver` against the deduped union of
   * consumer-resolved label/description elements. Watches `characterData`,
   * `childList`, `subtree`, and aria-hidden/hidden attribute toggles so any
   * in-place text or visibility mutation triggers a fresh sync.
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
   * Resolves consumer-supplied label/description IDREFs on the host and writes
   * the canonical combobox ARIA onto the **inner `<input>`** per W3C APG
   * editable combobox pattern. The inner input owns `role="combobox"`
   * (replacing its implicit textbox role) and all combobox state ARIA so AT
   * sees a single announced + focused surface.
   *
   * Cross-shadow naming uses a belt-and-suspenders strategy:
   *
   *   1. **Modern path** (`_supportsIdrefRefs === true`): consumer-resolved
   *      label/description elements are written onto
   *      `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements`
   *      on the host. Host-level `aria-labelledby` / `aria-describedby`
   *      attributes are LEFT IN PLACE so AT walking up the DOM also sees them.
   *      The text content of the resolved elements is also flattened onto the
   *      inner input as `aria-label` so AT that does not walk up still
   *      announces the right name.
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

    const input = this._inputEl;
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
    const helpEl = this.shadowRoot?.getElementById(this._helpId) ?? null;
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
      describedByIds.push(this._helpId);
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

  /**
   * Recomputes the discriminated label source. @internal
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

  // ─── Form Integration ───

  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select a time.',
        this._inputEl ?? undefined,
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
    this._inputDisplayValue = '';
    this._internals.setFormValue(null);
    this._closeListbox();
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state !== 'string') return;
    const clamped = clampValue(state, this.min, this.max);
    this.value = clamped;
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Listbox helpers ───

  /** @internal */
  private _openListbox(): void {
    if (this._open) return;
    const selectedIndex = this._slots.findIndex((s) => s.value === this.value);
    this._activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this._open = true;
  }

  /** @internal */
  private _closeListbox(): void {
    if (!this._open) return;
    this._open = false;
    this._activeIndex = -1;
    this._handleInteractionBlur();
  }

  /** @internal */
  private _scrollActiveOptionIntoView(): void {
    if (!this._listboxEl) return;
    const active = this._listboxEl.querySelector<HTMLElement>('.field__option--active');
    active?.scrollIntoView({ block: 'nearest' });
  }

  /** @internal */
  private _selectSlot(slot: TimeSlot): void {
    const clamped = clampValue(slot.value, this.min, this.max);
    this.value = clamped;
    this._handleInteractionInput();
    this._closeListbox();
    this._dispatchChange(clamped);
  }

  // ─── Slot tracking ───

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readLabelSlotState(e.target);
    this._hasLabelSlot = state.hasUsefulName;
    this._slottedLabelEls = state.elements;
    this._labelSlotText = state.text;
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

  // ─── Event Dispatch ───

  /** @internal */
  private _dispatchChange(value: string): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  // ─── Input Handlers ───

  /** @internal */
  private _handleInputClick(): void {
    if (!this.disabled) this._openListbox();
  }

  /** @internal */
  private _handleToggleClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled) return;
    if (this._open) {
      this._closeListbox();
    } else {
      this._openListbox();
      this._inputEl?.focus();
    }
  }

  /** @internal */
  private _handleInputInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._inputDisplayValue = target.value;
    if (!this._open) this._openListbox();
  }

  /** @internal */
  private _handleInputChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const raw = target.value.trim();

    if (!raw) {
      this.value = '';
      this._handleInteractionInput();
      this._handleInteractionBlur();
      this._internals.setFormValue(null);
      this._dispatchChange('');
      return;
    }

    const parsed = parseUserInput(raw);
    if (parsed) {
      const clamped = clampValue(parsed, this.min, this.max);
      this.value = clamped;
      this._handleInteractionInput();
      this._handleInteractionBlur();
      this._dispatchChange(clamped);
    } else {
      this._inputDisplayValue = this.value
        ? this.format === '12h'
          ? to12h(this.value)
          : this.value
        : '';
    }
  }

  /** @internal */
  private _handleInputKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) {
          this._openListbox();
        } else {
          this._activeIndex = Math.min(this._activeIndex + 1, this._slots.length - 1);
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this._open) {
          this._activeIndex = Math.max(this._activeIndex - 1, 0);
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'Enter':
        if (this._open && this._activeIndex >= 0) {
          e.preventDefault();
          const slot = this._slots[this._activeIndex];
          if (slot) this._selectSlot(slot);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this._closeListbox();
        break;

      case 'Home':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = 0;
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'End':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = this._slots.length - 1;
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'Tab':
        this._closeListbox();
        break;
    }
  }

  /** @internal */
  private _handleOptionPointerDown(e: MouseEvent): void {
    e.preventDefault();
  }

  /** @internal */
  private _handleOptionClick(slot: TimeSlot): void {
    this._selectSlot(slot);
    this._inputEl?.focus();
  }

  /** @internal */
  private _handleOptionMouseEnter(index: number): void {
    this._activeIndex = index;
  }

  // ─── Public API ───

  /** Moves focus to the time input element. */
  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const slots = this._slots;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this._listboxId}-option-${this._activeIndex}`
        : undefined;

    const placeholder = this.format === '12h' ? 'hh:mm AM' : 'hh:mm';

    // W3C APG editable combobox (option I): role="combobox" lives on the
    // inner <input>, replacing the implicit textbox role. All combobox state
    // ARIA — aria-expanded, aria-controls, aria-activedescendant,
    // aria-autocomplete, aria-haspopup, aria-required, aria-invalid,
    // aria-disabled — is bound on the input via Lit. aria-label /
    // aria-labelledby / aria-describedby are written imperatively by
    // _syncHostAriaSemantics after consumer-IDREF resolution.
    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`
                <label part="label" id=${this._labelId} class="field__label" for=${this._id}>
                  ${this.label}
                  ${this.required
                    ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                    : nothing}
                </label>
              `
            : nothing}
        </slot>

        <!-- Combobox wrapper; role="combobox" lives on the input per ARIA 1.2 -->
        <div class="field__combobox">
          <input
            part="input"
            class="field__input"
            id=${this._id}
            type="text"
            inputmode="text"
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-haspopup="listbox"
            .value=${live(this._inputDisplayValue)}
            placeholder=${placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-autocomplete="list"
            aria-controls=${this._listboxId}
            aria-activedescendant=${ifDefined(activeDescendant)}
            aria-invalid=${this._invalid ? 'true' : 'false'}
            aria-required=${this.required ? 'true' : 'false'}
            aria-disabled=${this.disabled ? 'true' : nothing}
            @click=${this._handleInputClick}
            @input=${this._handleInputInput}
            @change=${this._handleInputChange}
            @keydown=${this._handleInputKeyDown}
          />

          <!-- Toggle button -->
          <button
            part="toggle"
            type="button"
            class="field__toggle"
            tabindex="-1"
            aria-label=${this._open ? 'Close time picker' : 'Open time picker'}
            ?disabled=${this.disabled}
            @click=${this._handleToggleClick}
          >
            <!-- Clock icon -->
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.25" />
              <path
                d="M8 4.5V8L10.5 10"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- Dropdown listbox: always in DOM so aria-controls is never a dangling reference (WCAG 4.1.2). Hidden via the boolean hidden attribute when closed. -->
          <ul
            part="listbox"
            class="field__listbox"
            id=${this._listboxId}
            role="listbox"
            aria-label=${this.label || this.accessibleLabel || 'Time options'}
            ?hidden=${!this._open}
          >
            ${this._open
              ? repeat(
                  slots,
                  (slot) => slot.value,
                  (slot, index) => {
                    const isSelected = slot.value === this.value;
                    const isActive = index === this._activeIndex;
                    return html`
                      <li
                        part="option"
                        class=${classMap({
                          field__option: true,
                          'field__option--selected': isSelected,
                          'field__option--active': isActive,
                        })}
                        id="${this._listboxId}-option-${index}"
                        role="option"
                        aria-selected=${isSelected ? 'true' : 'false'}
                        @pointerdown=${this._handleOptionPointerDown}
                        @click=${() => this._handleOptionClick(slot)}
                        @mouseenter=${() => this._handleOptionMouseEnter(index)}
                      >
                        ${slot.label}
                      </li>
                    `;
                  },
                )
              : nothing}
          </ul>
        </div>

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

        <!-- Help slot -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpId}
          ?hidden=${!this._hasHelpSlot || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}></slot>
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
    'hx-time-picker': HelixTimePicker;
  }
}
