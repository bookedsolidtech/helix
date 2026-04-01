import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HxButtonDirective, HxTextInputDirective } from '../../lib/helix.directives.js';
import type { HxClickDetail, HxInputDetail } from '../../lib/helix.directives.js';

interface FormState {
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-form-demo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [HxButtonDirective, HxTextInputDirective],
  template: `
    <section style="margin-bottom: 2rem">
      <h2>Form Demo</h2>
      <p>Text inputs with typed <code>hxInput</code> outputs and signal-based state.</p>

      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px">
        <hx-text-input
          label="Full name"
          placeholder="Jane Doe"
          [value]="form().name"
          required
          (hxInput)="updateField('name', $event)"
        />

        <hx-text-input
          label="Email address"
          type="email"
          placeholder="jane@example.com"
          [value]="form().email"
          required
          help-text="We will never share your email."
          (hxInput)="updateField('email', $event)"
        />

        <hx-text-input
          label="Phone number"
          type="tel"
          placeholder="(555) 123-4567"
          [value]="form().phone"
          pattern="[0-9()+\\-\\s]+"
          help-text="Optional. Digits, parentheses, dashes, and spaces only."
          (hxInput)="updateField('phone', $event)"
        />

        <hx-text-input label="Read-only field" value="This value cannot be changed" readonly />

        <hx-text-input
          label="Error state"
          value="bad-email"
          type="email"
          error="Please enter a valid email address."
        />

        <div style="display: flex; gap: 0.5rem; align-items: center">
          <hx-button variant="primary" (hxClick)="handleSubmit($event)">Submit</hx-button>
          @if (submitted()) {
            <span style="color: green"> Submitted: {{ form().name }}, {{ form().email }} </span>
          }
        </div>
      </div>
    </section>
  `,
})
export class FormDemoComponent {
  form = signal<FormState>({ name: '', email: '', phone: '' });
  submitted = signal(false);

  updateField(field: keyof FormState, detail: HxInputDetail): void {
    this.form.update((f) => ({ ...f, [field]: detail.value }));
  }

  handleSubmit(_detail: HxClickDetail): void {
    this.submitted.set(true);
    setTimeout(() => this.submitted.set(false), 3000);
  }
}
