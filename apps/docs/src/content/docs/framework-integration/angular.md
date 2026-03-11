---
title: 'Angular Integration'
description: 'Using HELIX web components in Angular 16+, including CUSTOM_ELEMENTS_SCHEMA, event binding, form integration, and TypeScript types.'
sidebar:
  order: 4
---

# Angular Integration

Angular requires an explicit schema declaration to allow custom elements in templates. Once configured, HELIX components work with Angular's standard template binding syntax.

## Installation

```bash
npm install @helix/library
```

## Schema Configuration

Add `CUSTOM_ELEMENTS_SCHEMA` to any module or standalone component that uses HELIX elements. Without it, Angular throws a template parsing error for unknown elements.

### Standalone Components (Angular 16+)

```ts
// my.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-my',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <hx-button variant="primary" (hx-click)="save()">Save</hx-button>
  `,
})
export class MyComponent {
  save() {
    console.log('saved');
  }
}
```

### NgModule

```ts
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## Importing Components

Import HELIX once in `main.ts` (or `app.config.ts`):

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import '@helix/library';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);
```

## Basic Usage

```html
<!-- my.component.html -->
<hx-button variant="primary">Save</hx-button>
<hx-text-input name="search" placeholder="Search..."></hx-text-input>
```

## Event Binding

Angular binds to DOM events using `(eventName)` syntax. HELIX dispatches `hx-` prefixed custom events — use the full event name in parentheses:

```html
<hx-button (hx-click)="onSave($event)">Save</hx-button>
<hx-text-input (hx-input)="onInput($event)" (hx-change)="onChange($event)"></hx-text-input>
```

```ts
export class MyComponent {
  onSave(event: Event) {
    console.log('button clicked', event);
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('input:', value);
  }

  onChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('change:', value);
  }
}
```

## Property Binding

Bind dynamic values to HELIX properties using `[property]` syntax:

```html
<hx-button
  [disabled]="isLoading"
  [attr.variant]="buttonVariant"
  (hx-click)="submit()"
>
  {{ isLoading ? 'Saving...' : 'Save' }}
</hx-button>
```

> **Note:** Use `[attr.variant]` (attribute binding) rather than `[variant]` (property binding) when binding to custom element string attributes. Angular's `[property]` binding sets DOM properties, which works for booleans and objects; `[attr.name]` sets HTML attributes, which is appropriate for string/enum values.

## Boolean Attributes

Angular's `[disabled]="false"` omits the attribute when the value is falsy, matching HELIX's [boolean attribute semantics](/guides/boolean-attributes):

```html
<!-- Correct: attribute absent when false, present when true -->
<hx-button [disabled]="isDisabled">Submit</hx-button>
```

Avoid static string `"false"`:

```html
<!-- Wrong: disabled="false" still disables the button -->
<hx-button disabled="false">Submit</hx-button>
```

## Form Integration

### Template-Driven Forms

HELIX components participate in native HTML forms via `ElementInternals`. Read submitted values with `FormData`:

```html
<form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)">
  <hx-text-input name="email" required></hx-text-input>
  <hx-button type="submit">Send</hx-button>
</form>
```

```ts
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({ /* ... */ })
export class ContactComponent {
  onSubmit(form: NgForm) {
    const formEl = document.querySelector('form') as HTMLFormElement;
    const data = new FormData(formEl);
    console.log(data.get('email'));
  }
}
```

### Reactive Forms (Manual Sync)

HELIX components are not `ControlValueAccessor` implementations by default. For Reactive Forms, sync values via event listeners using `ElementRef`:

```ts
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<hx-text-input #emailInput name="email"></hx-text-input>`,
})
export class EmailInputComponent implements OnInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLElement>;

  emailControl = new FormControl('');

  ngOnInit() {
    const el = this.emailInput.nativeElement;

    el.addEventListener('hx-change', (e: Event) => {
      this.emailControl.setValue((e.target as HTMLInputElement).value);
    });

    this.emailControl.valueChanges.subscribe((val) => {
      (el as HTMLInputElement).value = val ?? '';
    });
  }
}
```

## TypeScript Types

Extend Angular's known elements for IDE autocompletion. Create a `helix-types.d.ts`:

```ts
// src/helix-types.d.ts
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HTMLElement & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      size?: 'sm' | 'md' | 'lg';
      disabled?: boolean;
      loading?: boolean;
      type?: 'button' | 'submit' | 'reset';
    };
    'hx-text-input': HTMLElement & {
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
      name?: string;
    };
  }
}

export {};
```

## SSR / Angular Universal

Custom element registration is browser-only. Guard imports with a platform check:

```ts
// app.component.ts
import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({ selector: 'app-root', template: `<router-outlet />` })
export class AppComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('@helix/library');
    }
  }
}
```

## Next Steps

- [Plain HTML / CDN Integration](/framework-integration/html)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
