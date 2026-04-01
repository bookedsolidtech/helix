/**
 * Typed Angular directive wrappers for HELiX web components.
 *
 * Angular does not automatically infer event types from custom elements.
 * These directives bridge the gap by re-emitting native `hx-*` CustomEvents
 * as typed Angular `@Output()` EventEmitters.
 *
 * Pattern derived from the HELiX Custom Elements Manifest (CEM):
 * - hx-button fires: hx-click (detail: { originalEvent: MouseEvent })
 * - hx-text-input fires: hx-input (detail: { value: string })
 *                        hx-change (detail: { value: string })
 */
import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

/** Typed detail for hx-click events from hx-button. */
export interface HxClickDetail {
  originalEvent: MouseEvent;
}

/** Typed detail for hx-input and hx-change events from hx-text-input. */
export interface HxInputDetail {
  value: string;
}

/**
 * Directive for `hx-button`.
 * Provides a typed `(hxClick)` output that re-emits the native `hx-click` event detail.
 *
 * Usage:
 * ```html
 * <hx-button variant="primary" (hxClick)="onButtonClick($event)">Submit</hx-button>
 * ```
 */
@Directive({ selector: 'hx-button', standalone: true })
export class HxButtonDirective {
  /** Emits `HxClickDetail` when the button is clicked. */
  @Output() hxClick = new EventEmitter<HxClickDetail>();

  @HostListener('hx-click', ['$event'])
  onHxClick(event: CustomEvent<HxClickDetail>): void {
    this.hxClick.emit(event.detail);
  }
}

/**
 * Directive for `hx-text-input`.
 * Provides typed `(hxInput)` and `(hxChange)` outputs.
 *
 * Usage:
 * ```html
 * <hx-text-input label="Name" (hxInput)="onInput($event)" (hxChange)="onChange($event)" />
 * ```
 */
@Directive({ selector: 'hx-text-input', standalone: true })
export class HxTextInputDirective {
  /** Emits `HxInputDetail` on every keystroke. */
  @Output() hxInput = new EventEmitter<HxInputDetail>();

  /** Emits `HxInputDetail` when the input loses focus after value changed. */
  @Output() hxChange = new EventEmitter<HxInputDetail>();

  @HostListener('hx-input', ['$event'])
  onHxInput(event: CustomEvent<HxInputDetail>): void {
    this.hxInput.emit(event.detail);
  }

  @HostListener('hx-change', ['$event'])
  onHxChange(event: CustomEvent<HxInputDetail>): void {
    this.hxChange.emit(event.detail);
  }
}
