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
 * `ControlValueAccessor` for the `<hx-checkbox>` web component.
 *
 * Bridges Angular reactive/template-driven forms with `hx-checkbox`.
 * The model value is a `boolean`.
 * Activate by adding `formControlName`, `formControl`, or `ngModel`.
 *
 * SSR-safe: DOM property writes are guarded with `isPlatformBrowser`.
 */
@Directive({
  selector: 'hx-checkbox[formControlName], hx-checkbox[formControl], hx-checkbox[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HelixCheckboxValueAccessor),
      multi: true,
    },
  ],
})
export class HelixCheckboxValueAccessor implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private _onChange: (value: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  @HostListener('hx-change', ['$event'])
  onChange(event: CustomEvent<{ checked: boolean; value: string }>): void {
    this._onChange(event.detail.checked);
    this._onTouched();
  }

  writeValue(value: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(this.el.nativeElement, 'checked', Boolean(value));
    }
  }

  registerOnChange(fn: (value: boolean) => void): void {
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
