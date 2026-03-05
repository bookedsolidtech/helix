---
title: Angular
description: Using HELiX web components in Angular 17+ applications, including module setup, event binding, property passing, and zone.js considerations.
---

# Angular

HELiX components work in Angular with minimal configuration. The primary requirement is telling Angular's compiler to allow custom element tags so it does not throw "unknown element" errors.

---

## Installation

```bash
npm install @wc-2026/library
```

---

## Setup

### Add `CUSTOM_ELEMENTS_SCHEMA`

Angular validates all HTML tags in templates against its known component registry. Add `CUSTOM_ELEMENTS_SCHEMA` to every module (or standalone component) that uses HELiX elements:

#### Standalone Components (Angular 17+ recommended)

```typescript
// src/app/patient-card.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-patient-card',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <hx-card>
      <span slot="heading">{{ patient.name }}</span>
      <p>Room {{ patient.room }}</p>
    </hx-card>
  `,
})
export class PatientCardComponent {
  patient = { name: 'Jane Doe', room: '204A' };
}
```

#### NgModule-Based (Legacy)

```typescript
// src/app/app.module.ts
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

### Register HELiX Components

Import HELiX once in `main.ts` before bootstrapping:

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// Register all HELiX components
import '@wc-2026/library';

bootstrapApplication(AppComponent).catch(console.error);
```

For selective imports:

```typescript
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-card';
import '@wc-2026/library/components/hx-text-input';
```

---

## Template Syntax

### Property Binding

Use Angular's `[property]` binding for reactive values:

```html
<!-- patient-list.component.html -->
<hx-button
  [attr.variant]="buttonVariant"
  [attr.disabled]="isLoading || null"
  [attr.size]="'md'"
>
  {{ isLoading ? 'Saving...' : 'Save Patient' }}
</hx-button>
```

> **Note:** Angular's `[property]` binding sets DOM properties when the element exists as a known Angular component. For unknown custom elements, use `[attr.name]` for attribute-based bindings or use `ElementRef` for property assignment.

### Event Binding

Angular's `(event)` syntax works with custom events, but you must use the full event name in parentheses:

```html
<!-- patient-form.component.html -->
<hx-text-input
  label="Patient Name"
  (hx-change)="onNameChange($event)"
  (hx-input)="onNameInput($event)"
/>

<hx-button variant="primary" (hx-click)="onSubmit()">
  Save
</hx-button>
```

```typescript
// patient-form.component.ts
import { Component } from '@angular/core';

@Component({ /* ... */ })
export class PatientFormComponent {
  onNameChange(event: CustomEvent<{ value: string }>) {
    console.log('Changed:', event.detail.value);
  }

  onNameInput(event: CustomEvent<{ value: string }>) {
    console.log('Input:', event.detail.value);
  }

  onSubmit() {
    console.log('Form submitted');
  }
}
```

> **Hyphenated events:** Angular's template parser accepts hyphenated event names like `(hx-change)` directly. No special handling needed.

---

## Using ElementRef for Object Properties

Angular cannot pass objects/arrays as HTML attributes. Use `ElementRef` and `ngOnInit` / `ngOnChanges`:

```typescript
// patient-select.component.ts
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  ElementRef,
  ViewChild,
  SimpleChanges,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-patient-select',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <hx-select
      #selectEl
      [attr.value]="selectedValue"
      (hx-change)="onSelectChange($event)"
    />
  `,
})
export class PatientSelectComponent implements OnInit, OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() selectedValue = '';
  @ViewChild('selectEl') selectEl!: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.setOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.selectEl) {
      this.setOptions();
    }
  }

  private setOptions(): void {
    if (this.selectEl?.nativeElement) {
      // Object property must be assigned via JS, not attribute
      (this.selectEl.nativeElement as HTMLElement & { options: SelectOption[] }).options =
        this.options;
    }
  }

  onSelectChange(event: CustomEvent<{ value: string }>): void {
    console.log('Selected:', event.detail.value);
  }
}
```

---

## Zone.js Considerations

HELiX components dispatch native DOM events. Angular's zone.js automatically patches DOM event listeners, so custom events fired from web components will trigger Angular's change detection.

However, if a HELiX component fires events synchronously inside a constructor or during `connectedCallback` before Angular has registered its listeners, change detection may not run. To be safe, use `NgZone.run()` when handling events in services:

```typescript
// patient.service.ts
import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private zone: NgZone) {}

  registerGlobalListeners(element: HTMLElement): void {
    element.addEventListener('hx-change', (event) => {
      // Ensure Angular sees this change
      this.zone.run(() => {
        const customEvent = event as CustomEvent<{ value: string }>;
        console.log('Global hx-change:', customEvent.detail.value);
      });
    });
  }
}
```

For component-level event binding in templates (`(hx-change)="handler($event)"`), zone.js handles this automatically — no manual wrapping needed.

---

## Signals (Angular 17+)

Angular Signals work well with HELiX events:

```typescript
// patient-form.component.ts
import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form (ngSubmit)="onSubmit()">
      <hx-text-input
        label="Patient Name"
        [attr.value]="patientName()"
        (hx-input)="patientName.set($event.detail.value)"
      />
      <hx-text-input
        label="MRN"
        [attr.value]="mrn()"
        (hx-input)="mrn.set($event.detail.value)"
      />
      <hx-button type="submit" variant="primary">
        Register Patient
      </hx-button>
    </form>
  `,
})
export class PatientFormComponent {
  patientName = signal('');
  mrn = signal('');

  onSubmit(): void {
    console.log({ name: this.patientName(), mrn: this.mrn() });
  }
}
```

---

## TypeScript: Declare Custom Element Types

Add HELiX element types for template type-checking:

```typescript
// src/custom-elements.d.ts
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HTMLElement & {
      variant: 'primary' | 'secondary' | 'ghost' | 'danger';
      size: 'sm' | 'md' | 'lg';
      disabled: boolean;
      type: 'button' | 'submit' | 'reset';
    };
    'hx-text-input': HTMLElement & {
      label: string;
      value: string;
      placeholder: string;
      required: boolean;
      disabled: boolean;
      error: string;
    };
    'hx-card': HTMLElement;
    'hx-select': HTMLElement & {
      value: string;
      options: Array<{ value: string; label: string }>;
    };
  }
}
```

---

## Angular Universal (SSR)

Angular Universal (server-side rendering) does not support custom elements — `customElements.define()` is a browser-only API. SSR-rendered HELiX markup will display as unstyled until the client hydrates.

**Current status:** Angular Universal + custom elements = client-side only for those components. Use Angular Universal for the shell/layout and let HELiX components render client-side after hydration.

See [SSR/SSG Compatibility](./ssr-compatibility/) for a full compatibility matrix.

---

## Related

- [React & Next.js](./react/)
- [Vue & Nuxt](./vue/)
- [SSR/SSG Compatibility](./ssr-compatibility/)
- [Common Gotchas](./gotchas/)
