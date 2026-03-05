import {
  Directive,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  Renderer2,
  forwardRef,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `ControlValueAccessor` for the `<hx-slider>` web component.
 *
 * Bridges Angular reactive/template-driven forms with `hx-slider`.
 * The model value is a `number`.
 * Activate by adding `formControlName`, `formControl`, or `ngModel`.
 *
 * SSR-safe: DOM property writes are guarded with `isPlatformBrowser`.
 */
@Directive({
  selector: 'hx-slider[formControlName], hx-slider[formControl], hx-slider[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HelixSliderValueAccessor),
      multi: true,
    },
  ],
})
export class HelixSliderValueAccessor implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};

  @HostListener('hx-input', ['$event'])
  onInput(event: CustomEvent<{ value: number }>): void {
    this._onChange(event.detail.value);
  }

  @HostListener('hx-change')
  onChangeTouched(): void {
    this._onTouched();
  }

  writeValue(value: number): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(
        this.el.nativeElement,
        'value',
        value !== null && value !== undefined ? value : 0,
      );
    }
  }

  registerOnChange(fn: (value: number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
    }
  }
}
