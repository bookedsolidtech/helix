import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { HelixElement } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { helixColorPickerStyles } from './hx-color-picker.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  type ColorFormat,
  type HSV,
  clamp,
  hsvToRgb,
  parseColor,
  formatColor,
} from './color-utils.js';

/** Internal counter used to mint stable IDs for inner aria-related elements. */
let _hxColorPickerCounter = 0;

// Re-export ColorFormat so existing consumers using this module path still work
export type { ColorFormat };

// ─── Component ────────────────────────────────────────────────────────────────

/** Detail for hx-input and hx-change events dispatched by hx-color-picker. */
export interface HxColorPickerDetail {
  value: string;
}

/**
 * A color picker control with gradient picker, hue/opacity sliders, swatches,
 * and formatted text input. Supports hex, rgb, hsl, and hsv output formats.
 *
 * @summary Color selection control with swatches, gradient picker, and formatted input.
 *
 * @tag hx-color-picker
 *
 * @slot trigger - Custom trigger element. Default: a color swatch button.
 * @slot label - Visible label projected above the trigger; aggregated text contributes to the host's accessible name when no stronger naming source (aria-labelledby/aria-label/accessible-label/label) is supplied.
 * @slot help-text - Help text rendered below the trigger and joined into the host's announced description channel.
 * @slot error - Error message rendered below help text. When present, marks the trigger as aria-invalid and is announced via a polite live region.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched while dragging sliders or grid.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when a color is committed.
 *
 * @csspart trigger - The trigger button element.
 * @csspart swatches - The swatch color buttons container.
 * @csspart grid - The 2D saturation/value gradient picker area.
 * @csspart slider - Shared slider container (also on hue-slider and opacity-slider).
 * @csspart hue-slider - The hue slider track.
 * @csspart opacity-slider - The alpha/opacity slider track.
 * @csspart input - The text input area.
 * @csspart label - The visible label container above the trigger.
 * @csspart help-text - The help-text container rendered below the trigger.
 * @csspart error - The error-message container rendered below help text.
 *
 * @cssprop [--hx-color-picker-z-index=1000] - z-index of the popover panel.
 * @cssprop [--hx-color-picker-width=260px] - Width of the picker panel.
 * @cssprop [--hx-color-picker-grid-height=160px] - Height of the gradient grid.
 * @cssprop [--hx-color-picker-thumb-border=#fff] - Border color of slider/grid thumbs.
 * @cssprop [--hx-color-picker-thumb-shadow=rgba(0,0,0,0.3)] - Shadow color of slider/grid thumbs.
 * @cssprop [--hx-color-picker-panel-shadow=rgba(0,0,0,0.15)] - Panel drop-shadow color.
 * @cssprop [--hx-color-picker-swatch-border=rgba(0,0,0,0.1)] - Swatch button border color.
 * @cssprop [--hx-color-picker-swatch-border-hover=rgba(0,0,0,0.3)] - Swatch button border on hover.
 *
 * @example
 * ```html
 * <hx-color-picker value="#3b82f6" format="hex"></hx-color-picker>
 * ```
 *
 * @example Drupal / Twig usage
 * The `swatches` property must be set via JavaScript (Drupal behavior) because arrays
 * cannot be serialized as HTML attributes:
 * ```js
 * // my-theme/js/color-picker-behavior.js
 * Drupal.behaviors.helixColorPicker = {
 *   attach(context) {
 *     context.querySelectorAll('hx-color-picker[data-swatches]').forEach((el) => {
 *       el.swatches = JSON.parse(el.dataset.swatches);
 *     });
 *   },
 * };
 * ```
 * ```twig
 * <hx-color-picker
 *   value="{{ color }}"
 *   data-swatches='{{ swatches | json_encode }}'
 * ></hx-color-picker>
 * ```
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-overlay-black-10] - Overlay color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-font-family-mono] - Font family.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-lg] - CSS custom property.
 * @cssprop [--hx-overlay-black-15] - Overlay color.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-overlay-black-30] - Overlay color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-color-picker/AAA-AUDIT.md
 * @keyboard-contract navigate=ArrowLeft,ArrowRight,ArrowUp,ArrowDown,Home,End,PageUp,PageDown; dismiss=Escape; disabled-suppresses=true
 * @aria-pattern slider
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-color-picker
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-color-picker')
export class HelixColorPicker extends FormMixin(HelixElement) {
  static override styles = [helixColorPickerStyles, forcedColorsField];

  /**
   * Declares this element as form-associated so it participates in native form submission.
   * @internal
   */
  static override formAssociated = true;

  constructor() {
    super();
    // P1-1: Store bound references so connectedCallback/disconnectedCallback use the same object
    /** @internal */
    this._boundPointerMove = this._handlePointerMove.bind(this);
    /** @internal */
    this._boundPointerUp = this._handlePointerUp.bind(this);
    /** @internal */
    this._boundDocumentClick = this._handleDocumentClick.bind(this);
  }

  // ─── Public Properties ───────────────────────────────────────────────────

  /**
   * Current color value as a CSS color string.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '#000000';

  /**
   * Output format for the color value.
   * @attr format
   */
  @property({ type: String, reflect: true })
  format: ColorFormat = 'hex';

  /**
   * Whether to show the alpha/opacity channel slider and include alpha in the output.
   * @attr opacity
   */
  @property({ type: Boolean, reflect: true })
  opacity = false;

  /**
   * Array of preset swatch color strings.
   * Set via JS property only — arrays cannot be serialized as HTML attributes.
   * In Drupal/Twig, use a behavior to read `data-swatches` and set this property.
   * See JSDoc example above.
   */
  @property({ attribute: false })
  swatches: string[] = [];

  /**
   * When true, hides the gradient grid and sliders, showing only swatches and the input.
   * Useful for compact preset-only color selection UIs.
   * @attr swatches-only
   */
  @property({ type: Boolean, reflect: true, attribute: 'swatches-only' })
  swatchesOnly = false;

  /**
   * Whether the control is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Form field name for form participation.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * When true the picker is shown inline instead of in a popover.
   * @attr inline
   */
  @property({ type: Boolean, reflect: true })
  inline = false;

  /**
   * When true, the picker requires a non-empty value for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /** Accessible label for the color gradient canvas. */
  @property({ type: String, attribute: 'label-gradient' })
  labelGradient = 'Color gradient';

  /** Accessible label for the hue slider. */
  @property({ type: String, attribute: 'label-hue' })
  labelHue = 'Hue';

  /** Accessible label for the opacity slider. */
  @property({ type: String, attribute: 'label-opacity' })
  labelOpacity = 'Opacity';

  /** Accessible label for the preset color swatches section. */
  @property({ type: String, attribute: 'label-swatches' })
  labelSwatches = 'Preset colors';

  /** Accessible label for the format-switch button. */
  @property({ type: String, attribute: 'label-switch-format' })
  labelSwitchFormat = 'Switch color format';

  /** Accessible label for the color value input. */
  @property({ type: String, attribute: 'label-color-value' })
  labelColorValue = 'Color value';

  /** Accessible label for the color picker dialog/panel. */
  @property({ type: String, attribute: 'label-picker' })
  labelPicker = 'Color picker';

  /**
   * Visible label rendered above the trigger. When set this becomes the
   * announced name of the trigger surface unless a stronger source
   * (`aria-labelledby`, `aria-label`, or `accessible-label`) is supplied.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label: string | undefined = undefined;

  /**
   * Visually-hidden accessible name. Highest-priority self-naming source —
   * outranks `label`, slotted label content, and the generated trigger label,
   * but defers to consumer `aria-labelledby` (effective) and `aria-label`.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | undefined = undefined;

  /**
   * Help text rendered below the trigger and joined into the host's
   * announced description channel.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText: string | undefined = undefined;

  /**
   * Error message. When non-empty, marks the trigger surface as `aria-invalid`
   * and joins the host's announced description channel via a live alert.
   * @attr error
   */
  @property({ type: String, reflect: true })
  error: string | undefined = undefined;

  /**
   * Generates the accessible label for the trigger button when no other
   * naming source is provided.
   * @param color - current color value string
   */
  @property({ attribute: false })
  labelTrigger: (color: string) => string = (color) => `Choose color: ${color}`;

  // ─── Internal State ──────────────────────────────────────────────────────

  /**
   * Internal HSV representation of the current color, used to drive all picker UI elements.
   * @internal
   */
  @state() private _hsv: HSV = { h: 0, s: 0, v: 0, a: 1 };
  /**
   * Whether the color picker popover panel is currently open.
   * @internal
   */
  @state() private _open = false;
  /**
   * The formatted color string displayed in the text input, kept in sync with `_hsv` and `format`.
   * @internal
   */
  @state() private _inputValue = '#000000';

  // ─── Cross-shadow ARIA-delegation infrastructure ─────────────────────────

  /**
   * Whether the platform supports the IDL element-references API on
   * `ElementInternals` (`ariaLabelledByElements` / `ariaDescribedByElements`).
   * Drives the modern (host-canonical) vs. fallback (mirror onto trigger)
   * branches in `_syncHostAriaSemantics()`.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /**
   * Test seam for forcing the no-IDL-ref path in synthetic environments.
   * Production code MUST NOT touch this. `null` = use platform detection;
   * `true`/`false` = force the corresponding branch on connect.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /** Slotted label elements (multi-node aggregation). @internal */
  @state() private _slottedLabelEls: Element[] = [];
  /** Aggregated text from slotted label, AccName-flattened. @internal */
  @state() private _labelSlotText: string = '';
  /** True when the label slot carries useful text. @internal */
  @state() private _hasLabelSlot = false;
  /** Aggregated text from slotted help-text, AccName-flattened. @internal */
  @state() private _helpSlotText: string = '';
  /** Aggregated text from slotted error, AccName-flattened. @internal */
  @state() private _errorSlotText: string = '';

  /** Effective error text exposed in the live region. @internal */
  @state() private _announcedError: string = '';

  /** Stable IDs for inner help / error elements. @internal */
  private readonly _instanceId = ++_hxColorPickerCounter;
  /** @internal */ private readonly _helpId = `hx-color-picker-help-${this._instanceId}`;
  /** @internal */ private readonly _errorId = `hx-color-picker-error-${this._instanceId}`;
  /** Hidden host-level description span ID (synthesized aria-description channel). @internal */
  private readonly _hostDescId = `hx-color-picker-host-desc-${this._instanceId}`;

  /** Fallback aria-* for the trigger button when IDL refs are unsupported. @internal */
  @state() private _fallbackTriggerAriaLabelledBy: string | null = null;
  /** @internal */ @state() private _fallbackTriggerAriaDescribedBy: string | null = null;
  /** @internal */ @state() private _fallbackTriggerAriaLabel: string | null = null;

  /** Cached resolved external description text for the synthesized host span. @internal */
  @state() private _externalDescText: string = '';

  /** Handle for the shared IDREF observer. @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;
  /** Mutation observer over the label-slot assigned-node text. @internal */
  private _labelSlotTextObserver: MutationObserver | null = null;
  /** Mutation observer over the help-slot assigned-node text. @internal */
  private _helpSlotTextObserver: MutationObserver | null = null;
  /** Mutation observer over the error-slot assigned-node text. @internal */
  private _errorSlotTextObserver: MutationObserver | null = null;
  /** Mutation observer over external aria-labelledby / aria-describedby targets. @internal */
  private _externalRefsObserver: MutationObserver | null = null;

  // ─── Cached element references ───────────────────────────────────────────

  /** Cached reference to the gradient grid element. @internal */
  @query('[part="grid"]') private _gridEl!: HTMLElement | null;
  /** Cached reference to the hue slider element. @internal */
  @query('[part="hue-slider"]') private _hueSliderEl!: HTMLElement | null;
  /** Cached reference to the opacity slider element. @internal */
  @query('[part="opacity-slider"]') private _opacitySliderEl!: HTMLElement | null;

  // ─── Dragging state (not reactive, managed manually) ─────────────────────

  /**
   * Whether the user is actively dragging within the gradient grid.
   * @internal
   */
  private _draggingGrid = false;
  /**
   * Whether the user is actively dragging the hue slider thumb.
   * @internal
   */
  private _draggingHue = false;
  /**
   * Whether the user is actively dragging the opacity slider thumb.
   * @internal
   */
  private _draggingOpacity = false;

  /**
   * Cached bounding rect from pointerdown; avoids repeated getBoundingClientRect on every pointermove.
   * @internal
   */
  private _dragRect: DOMRect | null = null;

  // P1-1: Stored bound references to prevent memory leaks
  /**
   * Stable bound reference to the pointermove handler, stored to allow correct listener removal.
   * @internal
   */
  private _boundPointerMove: (e: PointerEvent) => void;
  /**
   * Stable bound reference to the pointerup handler, stored to allow correct listener removal.
   * @internal
   */
  private _boundPointerUp: () => void;
  /**
   * Stable bound reference to the document click handler, stored to allow correct listener removal.
   * @internal
   */
  private _boundDocumentClick: (e: MouseEvent) => void;

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._syncFromValue();

    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect-time syncs run.
    const ctor = this.constructor as typeof HelixColorPicker;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // Seed root-independent semantics from connect so consumer-supplied
    // aria-labelledby / aria-describedby on the host resolves to live
    // light-DOM elements before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // P1-1: Remove using the same stored references added in connectedCallback
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this._boundDocumentClick, true);
      document.removeEventListener('pointermove', this._boundPointerMove);
      document.removeEventListener('pointerup', this._boundPointerUp);
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._labelSlotTextObserver?.disconnect();
    this._labelSlotTextObserver = null;
    this._helpSlotTextObserver?.disconnect();
    this._helpSlotTextObserver = null;
    this._errorSlotTextObserver?.disconnect();
    this._errorSlotTextObserver = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('value')) {
      this._syncFromValue();
    }
    // Seed `_announcedError` BEFORE render so the persistent live region
    // renders with the error text in the SAME frame that removes `hidden`
    // from the alert container. Covers first paint AND runtime transitions
    // from "" to "Server rejected" via async/server-side validation.
    if (changedProperties.has('error') || !this.hasUpdated) {
      this._announcedError = this.error ?? '';
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    // `slotchange` fires as a microtask after the initial synchronous render.
    // Seed slot-derived state synchronously so `_syncHostAriaSemantics()` —
    // driven by `updated()` in this same cycle — observes a populated state.
    this._seedSlotStateSync();
    this._syncHostAriaSemantics();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    // Drive re-announcement on error→error transitions (rAF clear-and-re-set
    // forces AT to re-read `role="alert"` content).
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string | undefined;
      if (previousError && this.error) {
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error ?? '';
        });
      } else {
        this._announcedError = this.error ?? '';
      }
    }
    this._syncHostAriaSemantics();
  }

  // ─── Sync ────────────────────────────────────────────────────────────────

  /** @internal */
  private _syncFromValue(): void {
    const parsed = parseColor(this.value);
    if (parsed) {
      this._hsv = parsed;
    }
    this._inputValue = formatColor(this._hsv, this.format, this.opacity);
    this._internals.setFormValue(this.value);
  }

  // ─── Slot state seeding ──────────────────────────────────────────────────

  /**
   * Synchronous slot-state seed. Mirrors the side effects of the slotchange
   * handlers but is driven by direct `slot.assignedNodes()` reads so we can
   * populate state BEFORE the microtask `slotchange` events fire after the
   * first render.
   * @internal
   */
  private _seedSlotStateSync(): void {
    const root = this.shadowRoot;
    if (!root) return;
    const labelSlot = root.querySelector<HTMLSlotElement>('slot[name="label"]');
    if (labelSlot) this._captureLabelSlot(labelSlot);
    const helpSlot = root.querySelector<HTMLSlotElement>('slot[name="help-text"]');
    if (helpSlot) this._captureHelpSlot(helpSlot);
    const errorSlot = root.querySelector<HTMLSlotElement>('slot[name="error"]');
    if (errorSlot) this._captureErrorSlot(errorSlot);
  }

  /** @internal */
  private _captureLabelSlot(slot: HTMLSlotElement): void {
    const assigned = slot
      .assignedNodes({ flatten: true })
      .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE);
    const elements = assigned.length > 0 ? assigned : [];
    const text = elements
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    this._slottedLabelEls = elements;
    this._labelSlotText = text;
    this._hasLabelSlot = text.length > 0;
    this._installLabelSlotTextObserver(elements);
  }

  /** @internal */
  private _captureHelpSlot(slot: HTMLSlotElement): void {
    const text = slot
      .assignedNodes({ flatten: true })
      .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    this._helpSlotText = text;
    this._installHelpSlotTextObserver(slot);
  }

  /** @internal */
  private _captureErrorSlot(slot: HTMLSlotElement): void {
    const text = slot
      .assignedNodes({ flatten: true })
      .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    this._errorSlotText = text;
    this._installErrorSlotTextObserver(slot);
  }

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    this._captureLabelSlot(e.target as HTMLSlotElement);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    this._captureHelpSlot(e.target as HTMLSlotElement);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    this._captureErrorSlot(e.target as HTMLSlotElement);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _installLabelSlotTextObserver(nodes: Element[]): void {
    this._labelSlotTextObserver?.disconnect();
    if (nodes.length === 0) {
      this._labelSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      const text = this._slottedLabelEls
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      this._labelSlotText = text;
      this._hasLabelSlot = text.length > 0;
      this._syncHostAriaSemantics();
    });
    nodes.forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    });
    this._labelSlotTextObserver = observer;
  }

  /** @internal */
  private _installHelpSlotTextObserver(slot: HTMLSlotElement): void {
    this._helpSlotTextObserver?.disconnect();
    const observer = new MutationObserver(() => {
      const text = slot
        .assignedNodes({ flatten: true })
        .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      this._helpSlotText = text;
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes({ flatten: true }).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
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

  /** @internal */
  private _installErrorSlotTextObserver(slot: HTMLSlotElement): void {
    this._errorSlotTextObserver?.disconnect();
    const observer = new MutationObserver(() => {
      const text = slot
        .assignedNodes({ flatten: true })
        .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      this._errorSlotText = text;
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes({ flatten: true }).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
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
   * Watches the elements referenced by `aria-labelledby` / `aria-describedby`
   * for in-place text mutations so the announced name/description stays
   * accurate when consumers rewrite external label text without swapping the
   * referenced node.
   * @internal
   */
  private _installExternalRefsObserver(targets: Element[]): void {
    this._externalRefsObserver?.disconnect();
    if (targets.length === 0) {
      this._externalRefsObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    targets.forEach((target) => {
      observer.observe(target, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    });
    this._externalRefsObserver = observer;
  }

  // ─── Host-canonical ARIA-delegation sync ─────────────────────────────────

  /**
   * Compute and apply the cross-shadow ARIA contract for the trigger surface.
   *
   * Naming precedence (highest first):
   *   1. consumer `aria-labelledby` (when at least one IDREF resolves)
   *   2. consumer `aria-label`
   *   3. `accessible-label` property
   *   4. `label` property
   *   5. slotted `<slot name="label">` text
   *   6. `labelTrigger(value)` (default)
   *
   * Description channel (joined, deduped):
   *   - consumer `aria-describedby` resolved text
   *   - `help-text` property + slotted help-text
   *   - `error` property + slotted error (when present)
   *
   * Modern path (`_supportsIdrefRefs === true`): host owns the announced
   * surface via `internals.aria*` + IDL refs. Trigger button mirrors only.
   *
   * Fallback path (`_supportsIdrefRefs === false`): trigger button carries
   * the full aria contract via attribute mirrors.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const externalLabelTokens = this.getAttribute('aria-labelledby');
    const externalDescTokens = this.getAttribute('aria-describedby');
    const labelEls = resolveIdrefTokens(this, externalLabelTokens);
    const descEls = resolveIdrefTokens(this, externalDescTokens);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    // Resolve the announced name.
    let resolvedLabel: string | null;
    if (hasEffectiveLabelledBy) {
      // Will be set via IDL refs (modern) or token mirror (fallback). Compute
      // a flattened text fallback for the IDL-ref-unsupported branch.
      resolvedLabel =
        labelEls
          .map((el) => flattenAccName(el))
          .filter((t) => t.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim() || null;
    } else if (hostAriaLabel) {
      resolvedLabel = hostAriaLabel;
    } else if (this.accessibleLabel) {
      resolvedLabel = this.accessibleLabel;
    } else if (this.label) {
      resolvedLabel = this.label;
    } else if (this._hasLabelSlot && this._labelSlotText) {
      resolvedLabel = this._labelSlotText;
    } else {
      resolvedLabel = this.labelTrigger(this._inputValue);
    }

    // External description text (flattened from consumer-resolved IDREFs).
    const externalDescText =
      descEls.length > 0
        ? descEls
            .map((el) => flattenAccName(el))
            .filter((t) => t.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';
    this._externalDescText = externalDescText;

    // Re-tune the external-refs observer to the union of resolved targets.
    this._installExternalRefsObserver([...labelEls, ...descEls]);

    // Validity surface — union: internals.validity ∪ this.error ∪ slotted error.
    const hasError = !!(this.error || this._errorSlotText);
    const validityInvalid = !internals.validity.valid;
    const isInvalid = validityInvalid || hasError;

    if (this._supportsIdrefRefs) {
      // ─── Modern path: host is canonical ───
      // Use `null` (not `''`) when no override — `''` removes the attribute
      // but stamps a stale empty string on `internals.ariaLabel` that some
      // engines still expose to AT.
      internals.ariaLabel = resolvedLabel ?? null;
      internals.ariaInvalid = isInvalid ? 'true' : 'false';
      internals.ariaDisabled = this.disabled ? 'true' : 'false';
      internals.ariaRequired = this.required ? 'true' : 'false';

      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;

      // Clear fallbacks so the trigger doesn't double-announce.
      this._fallbackTriggerAriaLabelledBy = null;
      this._fallbackTriggerAriaDescribedBy = null;
      this._fallbackTriggerAriaLabel = null;
    } else {
      // ─── Fallback path: trigger carries the full contract ───
      internals.ariaLabel = null;
      internals.ariaInvalid = null;
      internals.ariaDisabled = null;
      internals.ariaRequired = null;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = null;
      refsInternals.ariaDescribedByElements = null;

      this._fallbackTriggerAriaLabelledBy = hasEffectiveLabelledBy ? externalLabelTokens : null;
      this._fallbackTriggerAriaDescribedBy = externalDescTokens || null;
      this._fallbackTriggerAriaLabel = resolvedLabel;
    }
  }

  // ─── Effective text helpers (rendered into hidden host-desc span) ────────

  /** @internal */
  private _effectiveHelpText(): string {
    return (this.helpText?.trim() || this._helpSlotText || '').trim();
  }

  /** @internal */
  private _effectiveErrorText(): string {
    return (this._announcedError?.trim() || this._errorSlotText || '').trim();
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '#000000';
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormStateRestore(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** @internal */
  override _updateValidity(): void {
    // Anchor validity UI to the announced surface — the trigger button on
    // the popover path, or the grid in inline mode.
    const anchor: HTMLElement | undefined =
      this.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]') ??
      this.shadowRoot?.querySelector<HTMLElement>('[part="grid"]') ??
      undefined;

    // Union of constraint failures: required + consumer-supplied `error` /
    // slotted error. The consumer error projects through `customError` so
    // `validity.valid` reflects the announced state.
    const consumerError = (this.error || this._errorSlotText || '').trim();
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true, customError: !!consumerError },
        consumerError || 'Please select a color.',
        anchor,
      );
    } else if (consumerError) {
      this._internals.setValidity({ customError: true }, consumerError, anchor);
    } else {
      this._internals.setValidity({});
    }
    // Re-sync host aria semantics so `internals.ariaInvalid` reflects the
    // newly-computed `ValidityState`.
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _commit(source: 'drag' | 'change'): void {
    const formatted = formatColor(this._hsv, this.format, this.opacity);
    this.value = formatted;
    this._inputValue = formatted;
    this._internals.setFormValue(formatted);
    this._handleInteractionInput();
    const detail = { value: formatted };
    const opts: CustomEventInit<{ value: string }> = {
      bubbles: true,
      composed: true,
      detail,
    };
    if (source === 'drag') {
      this.dispatchEvent(new CustomEvent<{ value: string }>('hx-input', opts));
    } else {
      this.dispatchEvent(new CustomEvent<{ value: string }>('hx-change', opts));
    }
  }

  // ─── Panel open/close ────────────────────────────────────────────────────

  /** @internal */
  private _show(): void {
    if (this._open || this.inline) return;
    this._open = true;
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this._boundDocumentClick, true);
    }
    // WCAG 2.4.3: move focus into the panel after it renders so keyboard/AT
    // users land on the first interactive element rather than staying on the trigger.
    void this.updateComplete.then(() => {
      const panel = this.shadowRoot?.querySelector<HTMLElement>('.panel');
      // Prefer the color value input; fall back to the panel itself (tabindex="-1").
      const firstFocusable = panel?.querySelector<HTMLElement>('input, button') ?? panel;
      firstFocusable?.focus();
    });
  }

  /** @internal */
  private _hide(): void {
    if (!this._open) return;
    this._open = false;
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this._boundDocumentClick, true);
    }
  }

  /** @internal */
  private _handleDocumentClick(e: MouseEvent): void {
    if (!this._open) return;
    if (!e.composedPath().includes(this)) {
      this._hide();
    }
  }

  /** @internal */
  private _handleTriggerClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this._open) {
      this._hide();
    } else {
      this._show();
    }
  }

  /** @internal */
  private _handlePanelKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._hide();
      this.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]')?.focus();
    }
  }

  // ─── Gradient grid dragging ───────────────────────────────────────────────

  /** @internal */
  private _handleGridPointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingGrid = true;
    // Cache rect at pointerdown — element doesn't move during drag
    this._dragRect = this._gridEl?.getBoundingClientRect() ?? null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', this._boundPointerMove);
      document.addEventListener('pointerup', this._boundPointerUp);
    }
    this._updateGridFromPointer(e);
  }

  /** @internal */
  private _updateGridFromPointer(e: PointerEvent): void {
    const rect = this._dragRect ?? this._gridEl?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    this._hsv = { ...this._hsv, s: x * 100, v: (1 - y) * 100 };
    this._commit('drag');
    this.requestUpdate();
  }

  // P0-1: Keyboard support for gradient grid — fixes WCAG 2.1 SC 2.1.1 failure
  /** @internal */
  private _handleGridKeydown(e: KeyboardEvent): void {
    let sDelta = 0;
    let vDelta = 0;
    if (e.key === 'ArrowLeft') sDelta = -1;
    else if (e.key === 'ArrowRight') sDelta = 1;
    else if (e.key === 'ArrowUp') vDelta = 1;
    else if (e.key === 'ArrowDown') vDelta = -1;
    else if (e.key === 'PageUp') vDelta = 10;
    else if (e.key === 'PageDown') vDelta = -10;
    else if (e.key === 'Home') {
      this._hsv = { ...this._hsv, s: 0, v: 100 };
      this._commit('change');
      return;
    } else if (e.key === 'End') {
      this._hsv = { ...this._hsv, s: 100, v: 0 };
      this._commit('change');
      return;
    }
    if (sDelta !== 0 || vDelta !== 0) {
      e.preventDefault();
      this._hsv = {
        ...this._hsv,
        s: clamp(this._hsv.s + sDelta, 0, 100),
        v: clamp(this._hsv.v + vDelta, 0, 100),
      };
      this._commit('change');
    }
  }

  // ─── Hue slider dragging ─────────────────────────────────────────────────

  /** @internal */
  private _handleHuePointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingHue = true;
    // Cache rect at pointerdown — element doesn't move during drag
    this._dragRect = this._hueSliderEl?.getBoundingClientRect() ?? null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', this._boundPointerMove);
      document.addEventListener('pointerup', this._boundPointerUp);
    }
    this._updateHueFromPointer(e);
  }

  /** @internal */
  private _updateHueFromPointer(e: PointerEvent): void {
    const rect = this._dragRect ?? this._hueSliderEl?.getBoundingClientRect();
    if (!rect) return;
    const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this._hsv = { ...this._hsv, h: pct * 360 };
    this._commit('drag');
    this.requestUpdate();
  }

  // ─── Opacity slider dragging ──────────────────────────────────────────────

  /** @internal */
  private _handleOpacityPointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingOpacity = true;
    // Cache rect at pointerdown — element doesn't move during drag
    this._dragRect = this._opacitySliderEl?.getBoundingClientRect() ?? null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Guard for SSR — document is unavailable server-side
    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', this._boundPointerMove);
      document.addEventListener('pointerup', this._boundPointerUp);
    }
    this._updateOpacityFromPointer(e);
  }

  /** @internal */
  private _updateOpacityFromPointer(e: PointerEvent): void {
    const rect = this._dragRect ?? this._opacitySliderEl?.getBoundingClientRect();
    if (!rect) return;
    const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this._hsv = { ...this._hsv, a: pct };
    this._commit('drag');
    this.requestUpdate();
  }

  // ─── Document-level pointer handlers ─────────────────────────────────────

  /** @internal */
  private _handlePointerMove(e: PointerEvent): void {
    if (this._draggingGrid) this._updateGridFromPointer(e);
    else if (this._draggingHue) this._updateHueFromPointer(e);
    else if (this._draggingOpacity) this._updateOpacityFromPointer(e);
  }

  /** @internal */
  private _handlePointerUp(): void {
    if (this._draggingGrid || this._draggingHue || this._draggingOpacity) {
      this._draggingGrid = false;
      this._draggingHue = false;
      this._draggingOpacity = false;
      this._dragRect = null;
      // Guard for SSR — document is unavailable server-side
      if (typeof document !== 'undefined') {
        document.removeEventListener('pointermove', this._boundPointerMove);
        document.removeEventListener('pointerup', this._boundPointerUp);
      }
      this._commit('change');
    }
  }

  // ─── Keyboard handling for sliders ───────────────────────────────────────

  /** @internal */
  private _handleHueKeydown(e: KeyboardEvent): void {
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 1;
    else if (e.key === 'PageDown') delta = -10;
    else if (e.key === 'PageUp') delta = 10;
    else if (e.key === 'Home') {
      this._hsv = { ...this._hsv, h: 0 };
      this._commit('change');
      return;
    } else if (e.key === 'End') {
      this._hsv = { ...this._hsv, h: 360 };
      this._commit('change');
      return;
    }
    if (delta !== 0) {
      e.preventDefault();
      this._hsv = { ...this._hsv, h: clamp(this._hsv.h + delta, 0, 360) };
      this._commit('change');
    }
  }

  /** @internal */
  private _handleOpacityKeydown(e: KeyboardEvent): void {
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -0.01;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 0.01;
    else if (e.key === 'PageDown') delta = -0.1;
    else if (e.key === 'PageUp') delta = 0.1;
    else if (e.key === 'Home') {
      this._hsv = { ...this._hsv, a: 0 };
      this._commit('change');
      return;
    } else if (e.key === 'End') {
      this._hsv = { ...this._hsv, a: 1 };
      this._commit('change');
      return;
    }
    if (delta !== 0) {
      e.preventDefault();
      this._hsv = { ...this._hsv, a: clamp(this._hsv.a + delta, 0, 1) };
      this._commit('change');
    }
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  // P1-7: Bound to @input (was @change) for real-time color preview while typing
  /** @internal */
  private _handleInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const parsed = parseColor(input.value.trim());
    if (parsed) {
      this._hsv = parsed;
      this._commit('change');
    }
    this._inputValue = input.value;
  }

  /** @internal */
  private _handleInputBlur(e: FocusEvent): void {
    const input = e.target as HTMLInputElement;
    const parsed = parseColor(input.value.trim());
    if (parsed) {
      this._hsv = parsed;
      this._commit('change');
    } else {
      // Revert to current valid value
      this._inputValue = formatColor(this._hsv, this.format, this.opacity);
    }
  }

  /** @internal */
  private _handleFormatCycle(): void {
    const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsv'];
    const idx = formats.indexOf(this.format);
    const next = formats[(idx + 1) % formats.length];
    if (next !== undefined) this.format = next;
    this._inputValue = formatColor(this._hsv, this.format, this.opacity);
  }

  // ─── Swatches ────────────────────────────────────────────────────────────

  /** @internal */
  private _handleSwatchClick(color: string): void {
    const parsed = parseColor(color);
    if (parsed) {
      this._hsv = parsed;
      this._commit('change');
    }
  }

  // ─── Computed values ──────────────────────────────────────────────────────

  /** @internal */
  private _hueColor(): string {
    return `hsl(${Math.round(this._hsv.h)}, 100%, 50%)`;
  }

  /** @internal */
  private _previewColor(): string {
    const rgb = hsvToRgb(this._hsv);
    if (this.opacity && this._hsv.a < 1) {
      return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${Math.round(this._hsv.a * 100) / 100})`;
    }
    return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  /** @internal */
  private _renderGrid() {
    const thumbX = `${this._hsv.s}%`;
    const thumbY = `${100 - this._hsv.v}%`;
    const hueColor = this._hueColor();

    // P0-1: Grid is now keyboard-operable — WCAG 2.1 SC 2.1.1 compliance
    // Arrow keys adjust saturation (left/right) and value (up/down)
    //
    // A11y note (WCAG 4.1.2 — 2D slider aria-valuenow limitation): The ARIA slider role
    // requires a single numeric aria-valuenow. This 2D control has two axes (saturation and
    // value), so aria-valuenow reports only saturation (the primary/horizontal axis) per
    // the ARIA 1.2 "slider" pattern. aria-valuetext compensates by announcing both axes
    // ("Saturation X%, Value Y%") for all assistive technologies that support it.
    return html`
      <div
        part="grid"
        class="gradient-grid"
        role="slider"
        tabindex="0"
        aria-label=${this.labelGradient}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${Math.round(this._hsv.s)}
        aria-valuetext="Saturation ${Math.round(this._hsv.s)}%, Value ${Math.round(this._hsv.v)}%"
        @pointerdown=${this._handleGridPointerDown}
        @keydown=${this._handleGridKeydown}
      >
        <div class="gradient-grid-bg" style=${styleMap({ '--_hue-color': hueColor })}></div>
        <div
          class="gradient-thumb"
          style=${styleMap({ '--_thumb-x': thumbX, '--_thumb-y': thumbY })}
          aria-hidden="true"
        ></div>
      </div>
    `;
  }

  /** @internal */
  private _renderHueSlider() {
    const pct = `${(this._hsv.h / 360) * 100}%`;
    const hueColor = this._hueColor();

    // P1-8: part="slider hue-slider" — exposes the documented shared "slider" CSS part
    // P1-4: aria-valuetext announces the hue angle with degree symbol
    return html`
      <div
        part="slider hue-slider"
        class="slider-track hue-track"
        role="slider"
        tabindex="0"
        aria-label=${this.labelHue}
        aria-valuemin="0"
        aria-valuemax="360"
        aria-valuenow=${Math.round(this._hsv.h)}
        aria-valuetext="${Math.round(this._hsv.h)}°"
        @pointerdown=${this._handleHuePointerDown}
        @keydown=${this._handleHueKeydown}
      >
        <div
          class="slider-thumb"
          style=${styleMap({ '--_slider-pct': pct, '--_thumb-color': hueColor })}
          aria-hidden="true"
        ></div>
      </div>
    `;
  }

  /** @internal */
  private _renderOpacitySlider() {
    if (!this.opacity) return nothing;
    const pct = `${this._hsv.a * 100}%`;
    const rgb = hsvToRgb(this._hsv);
    const thumbColor = `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${Math.round(this._hsv.a * 100) / 100})`;
    const hueColor = this._hueColor();

    // P1-8: part="slider opacity-slider" — exposes the documented shared "slider" CSS part
    // P1-4: aria-valuetext announces the opacity as a percentage
    return html`
      <div
        part="slider opacity-slider"
        class="slider-track opacity-track"
        role="slider"
        tabindex="0"
        aria-label=${this.labelOpacity}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${Math.round(this._hsv.a * 100)}
        aria-valuetext="${Math.round(this._hsv.a * 100)}%"
        style=${styleMap({ '--_hue-color': hueColor })}
        @pointerdown=${this._handleOpacityPointerDown}
        @keydown=${this._handleOpacityKeydown}
      >
        <div
          class="slider-thumb"
          style=${styleMap({ '--_slider-pct': pct, '--_thumb-color': thumbColor })}
          aria-hidden="true"
        ></div>
      </div>
    `;
  }

  /** @internal */
  private _renderSwatches() {
    if (!this.swatches?.length) return nothing;
    // Native-tooltip carrier: `title` must NOT sit on the focusable swatch
    // button — with an identical `aria-label` it maps to the accessible
    // description and NVDA announces the color twice. The aria-hidden,
    // non-focusable overlay carries `title` instead, keeping the exact color
    // value visible on hover (close shades are otherwise indistinguishable
    // without clicking) while the description stays empty.
    return html`
      <div part="swatches" class="swatches" role="group" aria-label=${this.labelSwatches}>
        ${this.swatches.map(
          (color) => html`
            <button
              type="button"
              class="swatch-btn"
              style=${styleMap({ background: color })}
              aria-label=${color}
              @click=${() => this._handleSwatchClick(color)}
            >
              <span class="tooltip-carrier" title=${color} aria-hidden="true"></span>
            </button>
          `,
        )}
      </div>
    `;
  }

  /** @internal */
  private _renderInput() {
    return html`
      <div part="input" class="input-area">
        <div
          class="input-preview"
          style=${styleMap({ '--_preview-color': this._previewColor() })}
          aria-hidden="true"
        ></div>
        <button
          type="button"
          class="format-btn"
          aria-label=${this.labelSwitchFormat}
          @click=${this._handleFormatCycle}
        >
          ${this.format}
        </button>
        <input
          type="text"
          class="color-input"
          .value=${this._inputValue}
          aria-label=${this.labelColorValue}
          autocomplete="off"
          spellcheck="false"
          @input=${this._handleInputChange}
          @blur=${this._handleInputBlur}
        />
      </div>
    `;
  }

  /** @internal */
  private _renderPanel() {
    // A11y fix (WCAG 4.1.2): use role="group" instead of role="dialog" + aria-modal="true".
    // aria-modal="true" requires a programmatic focus trap so screen readers restrict virtual
    // cursor navigation to the dialog. Without Tab-key trapping, aria-modal causes JAWS/NVDA
    // to hide all content outside the panel, stranding keyboard users who Tab out. role="group"
    // with aria-label provides the same grouping semantics without the false modal contract.
    return html`
      <div
        class="panel"
        role="group"
        aria-label=${this.labelPicker}
        tabindex="-1"
        @keydown=${this._handlePanelKeydown}
      >
        ${this.swatchesOnly
          ? nothing
          : html`${this._renderGrid()} ${this._renderHueSlider()} ${this._renderOpacitySlider()}`}
        ${this._renderSwatches()} ${this._renderInput()}
      </div>
    `;
  }

  // ─── Description-channel helpers ─────────────────────────────────────────

  /**
   * Builds the synthesized host-level description span text by joining the
   * external (consumer-resolved) description text with help and error text.
   * The hidden span lives in the shadow root so AT can resolve a single
   * `aria-describedby` token to it without leaving the host's name surface.
   * @internal
   */
  private _hostDescriptionText(): string {
    const parts = [
      this._externalDescText,
      this._effectiveHelpText(),
      this._effectiveErrorText(),
    ].filter((p) => p.length > 0);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  /** @internal */
  private _renderHostDescriptionSpan() {
    const text = this._hostDescriptionText();
    if (!text) return nothing;
    return html`<span
      id=${this._hostDescId}
      class="hx-visually-hidden"
      aria-hidden="true"
      data-hx-host-desc
      style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;"
      >${text}</span
    >`;
  }

  /** @internal */
  private _renderLabelSlot() {
    // The label slot is rendered visually so consumers projecting a `<span
    // slot="label">` see it above the trigger. AT consumes the same nodes via
    // aggregated text → `internals.ariaLabel` (modern path). When the consumer
    // supplies `aria-label` / `aria-labelledby` / `accessible-label` the slot
    // still renders visibly but is excluded from the announced name by the
    // precedence in `_syncHostAriaSemantics`.
    return html`<span class="hx-color-picker__label" part="label">
      <slot name="label" @slotchange=${this._handleLabelSlotChange}>${this.label ?? ''}</slot>
    </span>`;
  }

  /** @internal */
  private _renderHelpSlot() {
    const helpText = this._effectiveHelpText();
    return html`<span
      id=${this._helpId}
      class="hx-color-picker__help"
      part="help-text"
      ?hidden=${!helpText}
    >
      <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText ?? ''}</slot>
    </span>`;
  }

  /** @internal */
  private _renderErrorSlot() {
    const errorText = this._effectiveErrorText();
    return html`<span
      id=${this._errorId}
      class="hx-color-picker__error"
      part="error"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      ?hidden=${!errorText}
    >
      <slot name="error" @slotchange=${this._handleErrorSlotChange}
        >${this._announcedError ?? ''}</slot
      >
    </span>`;
  }

  // ─── Main render ─────────────────────────────────────────────────────────

  override render() {
    const previewColor = this._previewColor();
    const hostDescText = this._hostDescriptionText();
    const triggerDescribedBy = hostDescText ? this._hostDescId : undefined;

    // Modern path: host owns the aria contract via `internals.*` — the
    // trigger button just mirrors a stable visible label for non-AT consumers
    // (testing, devtools).
    // Fallback path: trigger carries the full contract via attributes.
    const innerAriaLabel = this._supportsIdrefRefs
      ? this.labelTrigger(this._inputValue)
      : (this._fallbackTriggerAriaLabel ?? this.labelTrigger(this._inputValue));
    const innerAriaLabelledBy = this._supportsIdrefRefs
      ? undefined
      : (this._fallbackTriggerAriaLabelledBy ?? undefined);
    const innerAriaDescribedBy = this._supportsIdrefRefs
      ? triggerDescribedBy
      : [this._fallbackTriggerAriaDescribedBy, triggerDescribedBy]
          .filter((t): t is string => !!t && t.length > 0)
          .join(' ') || undefined;

    const isInvalid = !this._internals.validity.valid || !!this._effectiveErrorText();

    if (this.inline) {
      return html`
        <div style=${styleMap({ '--_preview-color': previewColor })}>
          ${this._renderLabelSlot()} ${this._renderHostDescriptionSpan()} ${this._renderPanel()}
          ${this._renderHelpSlot()} ${this._renderErrorSlot()}
        </div>
      `;
    }

    // P1-3: trigger aria-label includes current color value (preserved for
    // AT on legacy engines and as a backup name for testing).
    return html`
      ${this._renderLabelSlot()} ${this._renderHostDescriptionSpan()}
      <button
        part="trigger"
        type="button"
        class="trigger"
        aria-label=${innerAriaLabel}
        aria-labelledby=${ifDefined(innerAriaLabelledBy)}
        aria-describedby=${ifDefined(innerAriaDescribedBy)}
        aria-expanded=${this._open ? 'true' : 'false'}
        aria-invalid=${isInvalid ? 'true' : 'false'}
        ?disabled=${this.disabled}
        style=${styleMap({ '--_preview-color': previewColor })}
        @click=${this._handleTriggerClick}
      >
        <slot name="trigger">
          <span class="trigger-swatch" aria-hidden="true"></span>
          <span class="trigger-label">${this._inputValue}</span>
        </slot>
      </button>
      ${this._renderHelpSlot()} ${this._renderErrorSlot()}
      ${this._open ? this._renderPanel() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-color-picker': HelixColorPicker;
  }
}
