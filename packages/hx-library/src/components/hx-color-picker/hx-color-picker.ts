import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixColorPickerStyles } from './hx-color-picker.styles.js';
import {
  type ColorFormat,
  type HSV,
  clamp,
  hsvToRgb,
  parseColor,
  formatColor,
} from './color-utils.js';

// Re-export ColorFormat so existing consumers using this module path still work
export type { ColorFormat };

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A color picker control with gradient picker, hue/opacity sliders, swatches,
 * and formatted text input. Supports hex, rgb, hsl, and hsv output formats.
 *
 * @summary Color selection control with swatches, gradient picker, and formatted input.
 *
 * @tag hx-color-picker
 *
 * @slot trigger - Custom trigger element. Default: a color swatch button.
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
 */
@customElement('hx-color-picker')
export class HelixColorPicker extends LitElement {
  static override styles = [tokenStyles, helixColorPickerStyles];

  /**
   * Declares this element as form-associated so it participates in native form submission.
   * @internal
   */
  static formAssociated = true;

  /**
   * ElementInternals instance used for form participation and constraint validation.
   * @internal
   */
  private _internals: ElementInternals;

  constructor() {
    super();
    /** @internal */
    this._internals = this.attachInternals();
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
   * Generates the accessible label for the trigger button.
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
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('value')) {
      this._syncFromValue();
    }
    if (changedProperties.has('required')) {
      this._updateValidity();
    }
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
    this._updateValidity();
  }

  /** Called when a parent fieldset is disabled/enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** Called by the browser when the form is reset. */
  formResetCallback(): void {
    this.value = '#000000';
    this._internals.setFormValue(null);
  }

  /** Called by the browser to restore form state on navigation. */
  formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Returns the current validation message. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Checks whether the picker satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /** @internal */
  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        'Please select a color.',
        this.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]') ??
          this.shadowRoot?.querySelector<HTMLElement>('[part="grid"]') ??
          undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** @internal */
  private _commit(source: 'drag' | 'change'): void {
    const formatted = formatColor(this._hsv, this.format, this.opacity);
    this.value = formatted;
    this._inputValue = formatted;
    this._internals.setFormValue(formatted);
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
    return html`
      <div part="swatches" class="swatches" role="group" aria-label=${this.labelSwatches}>
        ${this.swatches.map(
          (color) => html`
            <button
              type="button"
              class="swatch-btn"
              style=${styleMap({ background: color })}
              aria-label=${color}
              title=${color}
              @click=${() => this._handleSwatchClick(color)}
            ></button>
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
          title="Switch format"
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

  // ─── Main render ─────────────────────────────────────────────────────────

  override render() {
    const previewColor = this._previewColor();

    if (this.inline) {
      return html`
        <div style=${styleMap({ '--_preview-color': previewColor })}>${this._renderPanel()}</div>
      `;
    }

    // P1-3: aria-label includes the current color value so AT users know the selected color
    return html`
      <button
        part="trigger"
        type="button"
        class="trigger"
        aria-label=${this.labelTrigger(this._inputValue)}
        aria-expanded=${this._open ? 'true' : nothing}
        ?disabled=${this.disabled}
        style=${styleMap({ '--_preview-color': previewColor })}
        @click=${this._handleTriggerClick}
      >
        <slot name="trigger">
          <span class="trigger-swatch" aria-hidden="true"></span>
          <span class="trigger-label">${this._inputValue}</span>
        </slot>
      </button>
      ${this._open ? this._renderPanel() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-color-picker': HelixColorPicker;
  }
}
