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
npm install @helixui/library
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
import '@helixui/library';
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
  // HELiX events are CustomEvents — type the detail payload, don't read from event.target.
  onSave(event: CustomEvent<{ originalEvent: MouseEvent | KeyboardEvent }>) {
    console.log('button clicked', event.detail.originalEvent);
  }

  onInput(event: CustomEvent<{ value: string }>) {
    console.log('input:', event.detail.value);
  }

  onChange(event: CustomEvent<{ value: string }>) {
    console.log('change:', event.detail.value);
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
import { Component, ElementRef, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<hx-text-input #emailInput name="email"></hx-text-input>`,
})
export class EmailInputComponent implements AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLElement>;

  emailControl = new FormControl('');

  // Use AfterViewInit so the @ViewChild query is resolved before we wire listeners.
  ngAfterViewInit() {
    const el = this.emailInput.nativeElement;

    // hx-change is a CustomEvent<{ value: string }> — read from .detail, not .target.
    el.addEventListener('hx-change', (e: Event) => {
      const detail = (e as CustomEvent<{ value: string }>).detail;
      this.emailControl.setValue(detail.value);
    });

    this.emailControl.valueChanges.subscribe((val) => {
      (el as HTMLInputElement).value = val ?? '';
    });
  }
}
```

## TypeScript Types

`@helixui/library` ships full TypeScript declarations including `HTMLElementTagNameMap` entries for every `hx-*` element. Once the package is in your dependencies, IDE autocompletion and `document.createElement('hx-button')` typing work without any extra type files.

If you need app-local helpers (e.g. typed event-detail shorthand types), do NOT redeclare the existing tag keys in `HTMLElementTagNameMap` — that creates incompatible duplicate globals. Reference the published exports instead:

```ts
// src/helix-types.d.ts (helpers only)
import type { HelixButton, HelixTextInput } from '@helixui/library';

// Example: a derived type that extracts the variant union from the canonical HelixButton type
type HxButtonVariant = HelixButton['variant'];
// = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'
```

If you previously copied tag-map entries inline, delete them and rely on the package types. The legacy inline samples shipped stale variant unions and conflicting member shapes.

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
      import('@helixui/library');
    }
  }
}
```

## Next Steps

- [Plain HTML / CDN Integration](/framework-integration/html)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Storybook](https://storybook.helix.bookedsolid.tech/)
