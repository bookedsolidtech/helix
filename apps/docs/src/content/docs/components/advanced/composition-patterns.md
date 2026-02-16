---
title: Component Composition Patterns
description: Advanced patterns for composing, extending, and coordinating web components in the hx-library ecosystem.
order: 71
---

Web components enable powerful composition patterns that promote reusability, maintainability, and flexibility. This guide explores proven patterns used throughout hx-library for building complex, coordinated component hierarchies while maintaining encapsulation and accessibility.

## What is Composition?

Composition is the practice of building complex components from simpler building blocks. Unlike inheritance (extending class behavior), composition combines independent components through slots, events, and coordinated state management.

**Benefits:**

- **Flexibility** — Mix and match components without rigid hierarchies
- **Testability** — Test each component in isolation
- **Maintainability** — Change one component without cascading failures
- **Reusability** — Combine components in ways the original author never anticipated

**Core principle:** Favor composition over inheritance. Build small, focused components that work together rather than large, monolithic components that try to do everything.

## 1. Compound Components Pattern

Compound components are a set of components designed to work together as a cohesive unit. The parent component coordinates behavior while child components remain independent and reusable.

### Real Example: hx-radio-group + hx-radio

The radio group pattern demonstrates perfect compound component design:

```html
<hx-radio-group label="Notification Preference" value="email">
  <hx-radio value="email">Email notifications</hx-radio>
  <hx-radio value="sms">SMS notifications</hx-radio>
  <hx-radio value="push">Push notifications</hx-radio>
</hx-radio-group>
```

**How it works:**

1. **Parent manages state** — `hx-radio-group` owns the selected value
2. **Children remain independent** — Each `hx-radio` can be used standalone
3. **Coordination via events** — Radio buttons dispatch `hx-radio-select` events that bubble to the group
4. **Parent updates children** — Group syncs checked state and tabindex across radios

```typescript
// In hx-radio-group.ts
private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
  e.stopPropagation();

  const newValue = e.detail.value;
  if (newValue === this.value) return;

  this.value = newValue;
  this._internals.setFormValue(this.value);
  this._syncRadios(); // Update all child radios

  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
};

private _syncRadios(): void {
  const radios = this._getRadios();

  radios.forEach((radio) => {
    radio.checked = radio.value === this.value && this.value !== '';
    if (this.disabled) {
      radio.disabled = true;
    }
  });

  // Roving tabindex for keyboard navigation
  const checkedRadio = radios.find((r) => r.checked);
  radios.forEach((radio) => {
    radio.tabIndex = -1;
  });
  if (checkedRadio) {
    checkedRadio.tabIndex = 0;
  }
}
```

**Key characteristics:**

- Parent component queries children via `querySelectorAll('hx-radio')`
- Children dispatch custom events that parent listens for
- Parent syncs state to children on value changes
- Children remain functional when used standalone
- Keyboard navigation managed at parent level

### When to Use Compound Components

Use compound components when:

- Multiple components must coordinate behavior (select dropdown + options, accordion + panels)
- State management centralizes in a parent coordinator
- Children should remain independently reusable
- Keyboard navigation spans multiple child elements

**Anti-pattern:** Don't tightly couple children to parents. Children should work standalone and not assume parent presence.

## 2. Container/Presentational Separation

Separate components into two categories: containers (manage state and logic) and presentational (render UI based on props).

### Example: Smart Form Container + Dumb Field Components

```typescript
// Container: hx-form (manages validation, submission, state)
@customElement('hx-form')
export class HelixForm extends LitElement {
  checkValidity(): boolean {
    const formElements = this._getAllValidatableElements();
    return formElements.every((el) => {
      if ('checkValidity' in el && typeof el.checkValidity === 'function') {
        return (el as HTMLInputElement).checkValidity();
      }
      return true;
    });
  }

  getFormData(): FormData {
    const formData = new FormData();
    const elements = this.getNativeFormElements();
    for (const el of elements) {
      const input = el as HTMLInputElement;
      if (!input.name) continue;

      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          formData.append(input.name, input.value || 'on');
        }
      } else {
        formData.append(input.name, input.value);
      }
    }
    return formData;
  }
}
```

```html
<!-- Presentational: hx-text-input (renders UI, no business logic) -->
<hx-form>
  <hx-text-input label="Patient ID" name="patient_id" required></hx-text-input>

  <hx-text-input label="Email" name="email" type="email" required></hx-text-input>

  <button type="submit">Submit</button>
</hx-form>
```

**Benefits:**

- Container handles complex logic (validation, submission, error handling)
- Presentational components remain simple and testable
- Swap presentational components without touching container logic
- Container can be tested with mock/stub child components

### Implementation Pattern

**Container responsibilities:**

- Query child components via `querySelectorAll`
- Aggregate state from multiple children
- Coordinate behavior across children
- Handle business logic and side effects

**Presentational responsibilities:**

- Accept props/attributes as inputs
- Dispatch events for user interactions
- Render UI based on current state
- No side effects or external dependencies

## 3. Slot Forwarding Pattern

Slot forwarding passes slotted content from a parent component through to a child component, enabling flexible content projection across component boundaries.

### Example: Field Wrapper Forwarding Slots to Label/Error

```typescript
// hx-text-input forwards label slot to internal structure
override render() {
  return html`
    <div part="field">
      <!-- Label slot: consumer can provide custom label markup -->
      <slot name="label" @slotchange=${this._handleLabelSlotChange}>
        ${this.label
          ? html`
              <label part="label" for=${this._inputId}>
                ${this.label}
                ${this.required
                  ? html`<span aria-hidden="true">*</span>`
                  : nothing}
              </label>
            `
          : nothing}
      </slot>

      <div part="input-wrapper">
        <slot name="prefix"></slot>
        <input id=${this._inputId} />
        <slot name="suffix"></slot>
      </div>

      <!-- Error slot: Drupal can inject its own error markup -->
      <slot name="error" @slotchange=${this._handleErrorSlotChange}>
        ${this.error
          ? html`<div role="alert">${this.error}</div>`
          : nothing}
      </slot>
    </div>
  `;
}
```

**Usage in Drupal:**

```html
<hx-text-input name="email" required>
  <label slot="label" class="form-label">
    Email Address
    <span class="required-indicator">*</span>
  </label>

  <div slot="error" class="form-error" role="alert">Please enter a valid email address.</div>
</hx-text-input>
```

**Slot change detection:**

```typescript
private _handleErrorSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  this.requestUpdate(); // Re-render to reflect slot presence
}
```

**Benefits:**

- Consumer controls markup structure (critical for Drupal Form API compatibility)
- Component provides sensible defaults via fallback content
- Styling remains isolated to Shadow DOM
- Accessibility attributes remain component-managed

### Multi-Level Slot Forwarding

Complex components can forward slots through multiple layers:

```html
<!-- Outer wrapper -->
<hx-card>
  <div slot="heading">
    <hx-badge variant="success">Active</hx-badge>
    Patient Record #12345
  </div>

  <p>Patient details go here...</p>

  <div slot="actions">
    <hx-button variant="primary">Edit</hx-button>
    <hx-button variant="ghost">Archive</hx-button>
  </div>
</hx-card>
```

```typescript
// hx-card.ts
override render() {
  return html`
    <div part="card">
      <div part="heading" ?hidden=${!this._hasSlotContent['heading']}>
        <slot name="heading" @slotchange=${this._handleSlotChange('heading')}></slot>
      </div>

      <div part="body">
        <slot></slot>
      </div>

      <div part="actions" ?hidden=${!this._hasSlotContent['actions']}>
        <slot name="actions" @slotchange=${this._handleSlotChange('actions')}></slot>
      </div>
    </div>
  `;
}

private _handleSlotChange(slotName: string) {
  return (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this._hasSlotContent[slotName] = slot.assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  };
}
```

## 4. Render Props Equivalent (Slots with Templates)

Web components use slots where React uses render props. This pattern allows consumers to inject custom rendering logic while maintaining component coordination.

### Example: Custom Option Rendering in Select

```html
<hx-select label="Medication" value="aspirin">
  <option value="aspirin">Aspirin (100mg)</option>
  <option value="ibuprofen">Ibuprofen (200mg)</option>
  <option value="acetaminophen">Acetaminophen (500mg)</option>
</hx-select>
```

The select component clones slotted options into its internal native `<select>`:

```typescript
private _syncOptions(): void {
  const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
  const slottedOptions = slot
    ?.assignedElements({ flatten: true })
    .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);

  // Remove previously cloned options
  const existingCloned = this._select.querySelectorAll('option[data-cloned]');
  existingCloned.forEach((opt) => opt.remove());

  // Clone slotted options into the native select
  slottedOptions?.forEach((option) => {
    const clone = option.cloneNode(true) as HTMLOptionElement;
    clone.setAttribute('data-cloned', '');
    this._select.appendChild(clone);
  });
}
```

**Benefits:**

- Consumer controls option markup and content
- Component maintains form participation and accessibility
- Works seamlessly with Drupal's Form API option rendering

### Template-Based Slots

For more complex rendering scenarios, consumers can provide full templates:

```html
<hx-alert variant="warning" closable>
  <div slot="icon">
    <!-- Custom SVG icon -->
    <svg>...</svg>
  </div>

  <strong>System Maintenance Scheduled</strong>
  <p>Downtime expected: Feb 20, 2026 at 02:00 UTC</p>

  <div slot="actions">
    <hx-button variant="ghost" size="sm">Learn More</hx-button>
  </div>
</hx-alert>
```

## 5. Higher-Order Component Pattern (Mixins)

TypeScript mixins enable higher-order component patterns by composing class behaviors without deep inheritance hierarchies.

### Example: Form-Associated Behavior Mixin

```typescript
// Form participation mixin (hypothetical)
type Constructor<T = {}> = new (...args: any[]) => T;

export function FormAssociatedMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  return class FormAssociated extends Base {
    static formAssociated = true;

    private _internals!: ElementInternals;

    constructor(...args: any[]) {
      super(...args);
      this._internals = this.attachInternals();
    }

    get form(): HTMLFormElement | null {
      return this._internals.form;
    }

    get validity(): ValidityState {
      return this._internals.validity;
    }

    checkValidity(): boolean {
      return this._internals.checkValidity();
    }

    reportValidity(): boolean {
      return this._internals.reportValidity();
    }

    formResetCallback(): void {
      // Override in subclass
    }
  };
}

// Usage
@customElement('hx-custom-input')
export class CustomInput extends FormAssociatedMixin(LitElement) {
  @property({ type: String }) value = '';

  override formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }
}
```

**Benefits:**

- Share behavior across multiple components without inheritance
- Compose multiple mixins for complex behavior
- Type-safe with proper TypeScript generics
- Test mixins independently

**Real-world use case:** All form components (hx-text-input, hx-select, hx-checkbox, hx-switch, hx-textarea, hx-radio-group) implement ElementInternals API with nearly identical boilerplate. A mixin reduces duplication.

## 6. Provider/Consumer Pattern (Context)

The provider/consumer pattern shares state across distant components without prop drilling. Web components use custom events for this pattern.

### Example: Theme Provider

```typescript
// Theme provider component
@customElement('hx-theme-provider')
export class ThemeProvider extends LitElement {
  @property({ type: String }) theme: 'light' | 'dark' = 'light';

  override connectedCallback(): void {
    super.connectedCallback();
    this._broadcastTheme();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('theme')) {
      this._broadcastTheme();
    }
  }

  private _broadcastTheme(): void {
    // Dispatch non-bubbling event to all descendants
    const event = new CustomEvent('hx-theme-change', {
      detail: { theme: this.theme },
      bubbles: false,
      composed: false,
    });

    // Notify all children
    this.querySelectorAll('*').forEach((child) => {
      child.dispatchEvent(event);
    });
  }

  override render() {
    return html`
      <div class="theme-provider" data-theme=${this.theme}>
        <slot></slot>
      </div>
    `;
  }
}
```

```typescript
// Consumer component
@customElement('hx-themed-card')
export class ThemedCard extends LitElement {
  @state() private _theme: 'light' | 'dark' = 'light';

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-theme-change', this._handleThemeChange as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-theme-change', this._handleThemeChange as EventListener);
  }

  private _handleThemeChange = (e: CustomEvent<{ theme: 'light' | 'dark' }>): void => {
    this._theme = e.detail.theme;
  };

  override render() {
    return html`
      <div class="card card--${this._theme}">
        <slot></slot>
      </div>
    `;
  }
}
```

**Usage:**

```html
<hx-theme-provider theme="dark">
  <hx-themed-card>This card is dark themed</hx-themed-card>
  <hx-themed-card>So is this one</hx-themed-card>
</hx-theme-provider>
```

**Alternative: CSS Custom Properties**

For styling-only context, CSS custom properties are simpler:

```typescript
@customElement('hx-theme-provider')
export class ThemeProvider extends LitElement {
  @property({ type: String }) theme: 'light' | 'dark' = 'light';

  override render() {
    return html`
      <div
        class="theme-provider"
        style="
          --hx-theme-bg: ${this.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
          --hx-theme-color: ${this.theme === 'dark' ? '#ffffff' : '#000000'};
        "
      >
        <slot></slot>
      </div>
    `;
  }
}
```

Children inherit CSS custom properties automatically:

```css
/* In hx-card.styles.ts */
:host {
  background: var(--hx-theme-bg, var(--hx-card-bg));
  color: var(--hx-theme-color, var(--hx-card-color));
}
```

## 7. Controlled vs Uncontrolled Components

Controlled components derive their state from props/attributes (single source of truth external). Uncontrolled components manage their own internal state.

### Controlled Example: hx-text-input

```html
<!-- Value controlled by parent component -->
<hx-text-input
  id="email-input"
  label="Email"
  .value="${this.emailValue}"
  @hx-input="${this._handleEmailInput}"
></hx-text-input>
```

```typescript
// Parent controls state
private _handleEmailInput(e: CustomEvent<{ value: string }>): void {
  this.emailValue = e.detail.value;
  // Validate, transform, or sync with other state
}
```

**Characteristics:**

- Parent component owns state
- Component dispatches events on user interaction
- Parent updates component's value prop
- Two-way data flow: user interaction → event → parent update → prop change

### Uncontrolled Example: hx-alert

```html
<!-- Component manages its own open/closed state -->
<hx-alert variant="info" closable open> This alert manages its own visibility. </hx-alert>
```

```typescript
// Component manages internal state
@property({ type: Boolean, reflect: true })
open = true;

private _handleClose(): void {
  this.open = false; // Component updates its own state

  this.dispatchEvent(
    new CustomEvent('hx-close', {
      bubbles: true,
      composed: true,
      detail: { reason: 'user' },
    })
  );
}
```

**Characteristics:**

- Component owns state
- Parent can set initial value via attribute
- Component updates its own state directly
- Parent observes changes via events (optional)

### Hybrid: Controlled with Uncontrolled Fallback

Most form components support both modes:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  @property({ type: String }) value = '';

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;

    // Update internal state (uncontrolled)
    this.value = target.value;

    // Dispatch event (allows controlled mode)
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        detail: { value: this.value },
      }),
    );
  }
}
```

**Usage patterns:**

```html
<!-- Uncontrolled: component manages state -->
<hx-text-input label="Name" name="name"></hx-text-input>

<!-- Controlled: parent manages state -->
<hx-text-input label="Name" .value="${this.name}" @hx-input="${(e)" ="">
  this.name = e.detail.value} ></hx-text-input
>
```

### Decision Matrix

| Pattern          | When to Use                                                            | Example                         |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------- |
| **Controlled**   | Complex validation, multi-field coordination, sync with external state | Form wizard, dependent fields   |
| **Uncontrolled** | Simple forms, independent fields, minimal parent involvement           | Newsletter signup, search input |
| **Hybrid**       | General-purpose components that support both modes                     | All hx-library form inputs      |

## 8. Composition vs Inheritance

Web components encourage composition over inheritance, but inheritance has valid uses.

### When to Use Inheritance

Extend a base component when:

- Changing behavior without changing structure
- Adding new properties/methods to existing component
- Creating specialized variants of existing component

```typescript
// Valid: Extend existing component for specialization
@customElement('hx-icon-button')
export class IconButton extends HelixButton {
  @property({ type: String }) icon = '';

  override render() {
    return html`
      <button part="button">
        <svg class="icon">${this._renderIcon()}</svg>
        <span class="sr-only"><slot></slot></span>
      </button>
    `;
  }
}
```

### When to Use Composition

Compose multiple components when:

- Combining distinct behaviors
- Building complex UI from simpler pieces
- Maintaining independent reusability

```html
<!-- Preferred: Compose existing components -->
<hx-button variant="primary">
  <svg slot="prefix" class="icon">...</svg>
  Save Changes
</hx-button>
```

**Anti-pattern:** Deep inheritance hierarchies.

```typescript
// Avoid: Fragile inheritance chain
class BaseInput extends LitElement {}
class ValidatedInput extends BaseInput {}
class FormInput extends ValidatedInput {}
class IconFormInput extends FormInput {} // Too deep!
```

**Better:** Composition with mixins.

```typescript
// Preferred: Flat hierarchy with composed behaviors
@customElement('hx-icon-form-input')
export class IconFormInput extends FormAssociatedMixin(LitElement) {
  render() {
    return html`
      <hx-text-input>
        <svg slot="prefix">${this.icon}</svg>
      </hx-text-input>
    `;
  }
}
```

## 9. Real-World Composition Examples

### Example 1: Patient Alert Dashboard

Compose multiple components for complex healthcare UI:

```html
<hx-container size="lg">
  <hx-card variant="featured">
    <h2 slot="heading">Active Patient Alerts</h2>

    <hx-alert variant="error" closable open>
      <strong>Critical: Allergy Alert</strong>
      <p>Patient has documented penicillin allergy.</p>
      <hx-button slot="actions" variant="primary" size="sm"> Review History </hx-button>
    </hx-alert>

    <hx-alert variant="warning" closable open>
      <strong>Lab Results Pending</strong>
      <p>Blood work results expected within 2 hours.</p>
    </hx-alert>

    <hx-alert variant="info">
      <strong>Medication Schedule</strong>
      <p>Next dose due at 14:00 UTC.</p>
    </hx-alert>

    <div slot="actions">
      <hx-button variant="primary">Acknowledge All</hx-button>
      <hx-button variant="ghost">Export Report</hx-button>
    </div>
  </hx-card>
</hx-container>
```

**Composition benefits:**

- Each component tested independently
- Alerts can be added/removed dynamically
- Card provides visual structure without coupling to alert logic
- Container manages responsive layout
- All components remain reusable

### Example 2: Multi-Step Form with Validation

```html
<hx-form id="patient-intake">
  <hx-radio-group label="Visit Type" name="visit_type" required value="new-patient">
    <hx-radio value="new-patient">New Patient</hx-radio>
    <hx-radio value="follow-up">Follow-Up</hx-radio>
    <hx-radio value="emergency">Emergency</hx-radio>
  </hx-radio-group>

  <hx-text-input
    label="Patient ID"
    name="patient_id"
    required
    pattern="[A-Z]{2}[0-9]{6}"
  ></hx-text-input>

  <hx-select label="Primary Physician" name="physician" required>
    <option value="">Select physician...</option>
    <option value="dr-smith">Dr. Smith</option>
    <option value="dr-jones">Dr. Jones</option>
  </hx-select>

  <hx-textarea label="Reason for Visit" name="reason" required rows="4"></hx-textarea>

  <hx-checkbox name="consent" required> I consent to treatment and data processing. </hx-checkbox>

  <hx-button type="submit" variant="primary"> Submit Intake Form </hx-button>
</hx-form>

<script>
  const form = document.getElementById('patient-intake');

  form.addEventListener('hx-submit', (e) => {
    const { valid, values } = e.detail;
    console.log('Form submitted:', values);
  });

  form.addEventListener('hx-invalid', (e) => {
    const { errors } = e.detail;
    console.error('Validation failed:', errors);
  });
</script>
```

**Composition benefits:**

- Form coordinates validation across all fields
- Each input manages its own UI and ElementInternals
- Form collects data without knowing field implementation details
- Fields can be reordered or removed without breaking form logic

## 10. Best Practices

### Do: Keep Components Focused

Each component should have a single, clear responsibility.

```html
<!-- Good: Each component has one job -->
<hx-card>
  <hx-badge slot="heading" variant="success">Active</hx-badge>
  <hx-prose>
    <p>Patient discharge summary...</p>
  </hx-prose>
</hx-card>
```

### Do: Use Custom Events for Coordination

Components communicate through well-defined custom events.

```typescript
// Component dispatches semantic event
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }),
);
```

### Do: Provide Slot Fallbacks

Always provide sensible defaults when slots are empty.

```typescript
render() {
  return html`
    <slot name="icon">
      ${this._renderDefaultIcon()} <!-- Fallback -->
    </slot>
  `;
}
```

### Do: Detect Slot Content

Track slot presence to conditionally render wrappers.

```typescript
private _handleSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasContent = slot.assignedNodes({ flatten: true }).length > 0;
  this.requestUpdate();
}

render() {
  return html`
    <div ?hidden=${!this._hasContent}>
      <slot @slotchange=${this._handleSlotChange}></slot>
    </div>
  `;
}
```

### Don't: Tightly Couple Components

Avoid direct references or assumptions about component structure.

```typescript
// Bad: Assumes parent structure
const parent = this.closest('hx-form');
parent.value = 'bad'; // Fragile!

// Good: Dispatch event
this.dispatchEvent(
  new CustomEvent('hx-input', {
    bubbles: true,
    detail: { value: this.value },
  }),
);
```

### Don't: Overuse Inheritance

Extend components sparingly. Prefer composition.

```typescript
// Bad: Deep inheritance for behavior reuse
class MyInput extends HelixTextInput {
  // Brittle!
}

// Good: Compose existing components
render() {
  return html`
    <hx-text-input
      label=${this.label}
      .value=${this.value}
      @hx-input=${this._handleInput}
    ></hx-text-input>
  `;
}
```

### Don't: Manipulate Slotted Content

Let slotted content remain under consumer control.

```typescript
// Bad: Mutating slotted content
const slot = this.shadowRoot.querySelector('slot');
const nodes = slot.assignedElements();
nodes[0].classList.add('modified'); // Don't do this!

// Good: Style via CSS parts or custom properties
render() {
  return html`
    <slot></slot>
  `;
}
```

## Summary

Composition patterns enable flexible, maintainable component architectures:

1. **Compound Components** — Parent coordinates children via events and shared state
2. **Container/Presentational** — Separate business logic from UI rendering
3. **Slot Forwarding** — Project content through component boundaries
4. **Render Props Equivalent** — Use slots for consumer-controlled rendering
5. **Mixins** — Share behavior across components without inheritance
6. **Provider/Consumer** — Share context across distant descendants
7. **Controlled/Uncontrolled** — Support both parent-managed and self-managed state
8. **Composition over Inheritance** — Build complex UIs from simple, focused components

These patterns appear throughout hx-library, enabling enterprise-grade healthcare applications while maintaining testability, accessibility, and developer experience.

**Next steps:**

- Review [Form Patterns](/components/forms/patterns) for form-specific composition
- Explore [Accessibility Patterns](/components/accessibility/patterns) for inclusive coordination
- Study [Custom Events](/components/advanced/events) for component communication
