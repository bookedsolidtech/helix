import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixColorPickerStyles } from './hx-color-picker.styles.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv';

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
  a: number; // 0-1
}

interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

// ─── Color utilities ──────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
  if (h.length === 4) h = h.replace(/(.)/g, '$1$1');
  if (h.length === 6) h += 'ff';
  if (h.length !== 8) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return {
    r: (n >>> 24) & 0xff,
    g: (n >>> 16) & 0xff,
    b: (n >>> 8) & 0xff,
    a: (n & 0xff) / 255,
  };
}

function toHex2(n: number): string {
  return Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, '0');
}

function rgbToHex(rgb: RGB, includeAlpha: boolean): string {
  const base = `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
  if (includeAlpha && rgb.a < 1) return base + toHex2(rgb.a * 255);
  return base;
}

function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100, a: rgb.a };
}

function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: hsv.a };
}

function rgbToHsl(rgb: RGB): { h: number; s: number; l: number; a: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100, a: rgb.a };
}

// P2-1: parseColor now handles HSV/HSVA input strings for round-trip correctness
function parseColor(value: string): HSV | null {
  if (!value) return null;

  if (value.startsWith('#')) {
    const rgb = hexToRgb(value);
    return rgb ? rgbToHsv(rgb) : null;
  }

  const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const [, rm1, rm2, rm3, rm4] = rgbMatch;
    return rgbToHsv({
      r: parseInt(rm1 ?? '0', 10),
      g: parseInt(rm2 ?? '0', 10),
      b: parseInt(rm3 ?? '0', 10),
      a: rm4 !== undefined ? parseFloat(rm4) : 1,
    });
  }

  const hslMatch = value.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  if (hslMatch) {
    const [, hm1, hm2, hm3, hm4] = hslMatch;
    const h = parseFloat(hm1 ?? '0');
    const s = parseFloat(hm2 ?? '0') / 100;
    const l = parseFloat(hm3 ?? '0') / 100;
    const a = hm4 !== undefined ? parseFloat(hm4) : 1;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return rgbToHsv({
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a,
    });
  }

  // P2-1: Support HSV/HSVA input strings (component's own output format)
  const hsvMatch = value.match(
    /hsva?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  if (hsvMatch) {
    const [, hm1, hm2, hm3, hm4] = hsvMatch;
    return {
      h: parseFloat(hm1 ?? '0'),
      s: parseFloat(hm2 ?? '0'),
      v: parseFloat(hm3 ?? '0'),
      a: hm4 !== undefined ? parseFloat(hm4) : 1,
    };
  }

  return null;
}

function formatColor(hsv: HSV, format: ColorFormat, includeAlpha: boolean): string {
  const rgb = hsvToRgb(hsv);
  switch (format) {
    case 'hex':
      return rgbToHex(rgb, includeAlpha);
    case 'rgb': {
      if (includeAlpha && hsv.a < 1) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(hsv.a * 100) / 100})`;
      }
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    case 'hsl': {
      const hsl = rgbToHsl(rgb);
      if (includeAlpha && hsv.a < 1) {
        return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${Math.round(hsv.a * 100) / 100})`;
      }
      return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
    }
    case 'hsv': {
      if (includeAlpha && hsv.a < 1) {
        return `hsva(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%, ${Math.round(hsv.a * 100) / 100})`;
      }
      return `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`;
    }
  }
}

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

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
    // P1-1: Store bound references so connectedCallback/disconnectedCallback use the same object
    this._boundPointerMove = this._handlePointerMove.bind(this);
    this._boundPointerUp = this._handlePointerUp.bind(this);
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

  // ─── Internal State ──────────────────────────────────────────────────────

  @state() private _hsv: HSV = { h: 0, s: 0, v: 0, a: 1 };
  @state() private _open = false;
  @state() private _inputValue = '#000000';

  // ─── Dragging state (not reactive, managed manually) ─────────────────────

  private _draggingGrid = false;
  private _draggingHue = false;
  private _draggingOpacity = false;

  // P1-1: Stored bound references to prevent memory leaks
  private _boundPointerMove: (e: PointerEvent) => void;
  private _boundPointerUp: () => void;

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._syncFromValue();
    this._handleDocumentClick = this._handleDocumentClick.bind(this);
    document.addEventListener('click', this._handleDocumentClick, true);
    // P1-1: Use stored bound references (not inline .bind() which creates new objects)
    document.addEventListener('pointermove', this._boundPointerMove);
    document.addEventListener('pointerup', this._boundPointerUp);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick, true);
    // P1-1: Remove using the same stored references added in connectedCallback
    document.removeEventListener('pointermove', this._boundPointerMove);
    document.removeEventListener('pointerup', this._boundPointerUp);
  }

  override willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this._syncFromValue();
    }
  }

  // ─── Sync ────────────────────────────────────────────────────────────────

  private _syncFromValue(): void {
    const parsed = parseColor(this.value);
    if (parsed) {
      this._hsv = parsed;
    }
    this._inputValue = formatColor(this._hsv, this.format, this.opacity);
    this._internals.setFormValue(this.value);
  }

  private _commit(source: 'drag' | 'change'): void {
    const formatted = formatColor(this._hsv, this.format, this.opacity);
    this.value = formatted;
    this._inputValue = formatted;
    this._internals.setFormValue(formatted);
    const eventName = source === 'drag' ? 'hx-input' : 'hx-change';
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail: { value: formatted },
      }),
    );
  }

  // ─── Panel open/close ────────────────────────────────────────────────────

  private _show(): void {
    if (this._open || this.inline) return;
    this._open = true;
  }

  private _hide(): void {
    if (!this._open) return;
    this._open = false;
  }

  private _handleDocumentClick(e: MouseEvent): void {
    if (!this._open) return;
    if (!e.composedPath().includes(this)) {
      this._hide();
    }
  }

  private _handleTriggerClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this._open) {
      this._hide();
    } else {
      this._show();
    }
  }

  private _handlePanelKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._hide();
      this.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]')?.focus();
    }
  }

  // ─── Gradient grid dragging ───────────────────────────────────────────────

  private _handleGridPointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingGrid = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._updateGridFromPointer(e);
  }

  private _updateGridFromPointer(e: PointerEvent): void {
    const grid = this.shadowRoot?.querySelector<HTMLElement>('[part="grid"]');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    this._hsv = { ...this._hsv, s: x * 100, v: (1 - y) * 100 };
    this._commit('drag');
    this.requestUpdate();
  }

  // P0-1: Keyboard support for gradient grid — fixes WCAG 2.1 SC 2.1.1 failure
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

  private _handleHuePointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingHue = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._updateHueFromPointer(e);
  }

  private _updateHueFromPointer(e: PointerEvent): void {
    const track = this.shadowRoot?.querySelector<HTMLElement>('[part="hue-slider"]');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this._hsv = { ...this._hsv, h: pct * 360 };
    this._commit('drag');
    this.requestUpdate();
  }

  // ─── Opacity slider dragging ──────────────────────────────────────────────

  private _handleOpacityPointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    this._draggingOpacity = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._updateOpacityFromPointer(e);
  }

  private _updateOpacityFromPointer(e: PointerEvent): void {
    const track = this.shadowRoot?.querySelector<HTMLElement>('[part="opacity-slider"]');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this._hsv = { ...this._hsv, a: pct };
    this._commit('drag');
    this.requestUpdate();
  }

  // ─── Document-level pointer handlers ─────────────────────────────────────

  private _handlePointerMove(e: PointerEvent): void {
    if (this._draggingGrid) this._updateGridFromPointer(e);
    else if (this._draggingHue) this._updateHueFromPointer(e);
    else if (this._draggingOpacity) this._updateOpacityFromPointer(e);
  }

  private _handlePointerUp(): void {
    if (this._draggingGrid || this._draggingHue || this._draggingOpacity) {
      this._draggingGrid = false;
      this._draggingHue = false;
      this._draggingOpacity = false;
      this._commit('change');
    }
  }

  // ─── Keyboard handling for sliders ───────────────────────────────────────

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
  private _handleInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const parsed = parseColor(input.value.trim());
    if (parsed) {
      this._hsv = parsed;
      this._commit('change');
    }
    this._inputValue = input.value;
  }

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

  private _handleFormatCycle(): void {
    const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsv'];
    const idx = formats.indexOf(this.format);
    const next = formats[(idx + 1) % formats.length];
    if (next !== undefined) this.format = next;
    this._inputValue = formatColor(this._hsv, this.format, this.opacity);
  }

  // ─── Swatches ────────────────────────────────────────────────────────────

  private _handleSwatchClick(color: string): void {
    const parsed = parseColor(color);
    if (parsed) {
      this._hsv = parsed;
      this._commit('change');
    }
  }

  // ─── Computed values ──────────────────────────────────────────────────────

  private _hueColor(): string {
    return `hsl(${Math.round(this._hsv.h)}, 100%, 50%)`;
  }

  private _previewColor(): string {
    const rgb = hsvToRgb(this._hsv);
    if (this.opacity && this._hsv.a < 1) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this._hsv.a})`;
    }
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  private _renderGrid() {
    const thumbX = `${this._hsv.s}%`;
    const thumbY = `${100 - this._hsv.v}%`;
    const hueColor = this._hueColor();

    // P0-1: Grid is now keyboard-operable — WCAG 2.1 SC 2.1.1 compliance
    // Arrow keys adjust saturation (left/right) and value (up/down)
    return html`
      <div
        part="grid"
        class="gradient-grid"
        role="slider"
        tabindex="0"
        aria-label="Color gradient"
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
        aria-label="Hue"
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

  private _renderOpacitySlider() {
    if (!this.opacity) return nothing;
    const pct = `${this._hsv.a * 100}%`;
    const rgb = hsvToRgb(this._hsv);
    const thumbColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this._hsv.a})`;
    const hueColor = this._hueColor();

    // P1-8: part="slider opacity-slider" — exposes the documented shared "slider" CSS part
    // P1-4: aria-valuetext announces the opacity as a percentage
    return html`
      <div
        part="slider opacity-slider"
        class="slider-track opacity-track"
        role="slider"
        tabindex="0"
        aria-label="Opacity"
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

  private _renderSwatches() {
    if (!this.swatches?.length) return nothing;
    return html`
      <div part="swatches" class="swatches" role="group" aria-label="Preset colors">
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
          aria-label="Switch color format"
          title="Switch format"
          @click=${this._handleFormatCycle}
        >
          ${this.format}
        </button>
        <input
          type="text"
          class="color-input"
          .value=${this._inputValue}
          aria-label="Color value"
          autocomplete="off"
          spellcheck="false"
          @input=${this._handleInputChange}
          @blur=${this._handleInputBlur}
        />
      </div>
    `;
  }

  private _renderPanel() {
    return html`
      <div
        class="panel"
        role="dialog"
        aria-label="Color picker"
        aria-modal="true"
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
        aria-label="Choose color: ${this._inputValue}"
        aria-haspopup="dialog"
        aria-expanded=${this._open ? 'true' : 'false'}
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
