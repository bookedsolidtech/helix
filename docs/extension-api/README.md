# Helix Extension API

**Version Contract: 1.0.0**

The Helix Extension API defines the stable, versioned contract that allows consumers to safely extend Helix components. Enterprise healthcare organizations can subclass components (e.g., `PatientCard extends HelixCard`) with confidence that their extensions will not break across minor and patch releases.

---

## Why Extend Instead of Compose?

Extending Helix components is appropriate when you need to:

- Add domain-specific behavior to an existing component (e.g., patient safety validation on form inputs)
- Override specific rendering sections while preserving the component's ARIA and accessibility patterns
- Integrate with a proprietary design system while maintaining Helix's token architecture
- Register a new custom element tag for an organization-specific variant

---

## Version Contract

### Semver Policy

| Change Type | Version Bump | Description |
|---|---|---|
| Add new `protected` method | **minor** | Safe — subclasses can optionally override |
| Add new `@property` | **minor** | Safe — additive, backwards-compatible |
| Rename `protected` method | **major** | Breaking — subclasses that override it will silently break |
| Remove `protected` method | **major** | Breaking — subclasses that override it will silently break |
| Change `protected` method signature | **major** | Breaking — subclasses must update their overrides |
| Change `protected` method semantics | **major** | Breaking — subclasses relying on behavior will break |
| Remove `@property` | **major** | Breaking |
| Change `@property` type | **major** | Breaking |
| Add internal `private` method | **patch** | No impact on subclasses |
| Change internal `private` implementation | **patch** | No impact on subclasses |

### What is NOT part of the Extension API

The following are **internal implementation details** and may change at any time:

- Private properties (prefixed with `_`)
- Internal `ElementInternals` usage (`_internals`)
- CSS class names within Shadow DOM (use CSS parts instead)
- Internal slot change handlers
- Private render helper methods (prefixed with `_render`)

---

## Extension Patterns

### Pattern 1: Render Hook Override

Override a protected render method to customize a specific section of the component template:

```typescript
import { HelixCard } from '@wc-2026/library';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit';

@customElement('patient-card')
export class PatientCard extends HelixCard {
  /** Add a patient-specific urgency badge to the image section. */
  protected override renderImageSection(): unknown {
    return html`
      <div class="urgency-badge">CRITICAL</div>
      ${super.renderImageSection()}
    `;
  }
}
```

### Pattern 2: Class Override

Override `getHostClasses()` or `getCardClasses()` to add CSS classes without replacing the full render:

```typescript
@customElement('compact-button')
export class CompactButton extends HelixButton {
  protected override getButtonClasses(): Record<string, boolean> {
    return {
      ...super.getButtonClasses(),
      'button--compact-theme': true,
    };
  }
}
```

### Pattern 3: Action Hook

Override `shouldHandleClick()` to intercept and conditionally cancel actions:

```typescript
@customElement('confirmation-button')
export class ConfirmationButton extends HelixButton {
  protected override shouldHandleClick(e: MouseEvent): boolean {
    // Require confirmation before processing
    return window.confirm('Are you sure?');
  }
}
```

### Pattern 4: Validation Override

Override `updateValidity()` to add domain-specific form validation:

```typescript
@customElement('patient-id-input')
export class PatientIdInput extends HelixTextInput {
  protected override updateValidity(): void {
    // Call base validation first
    super.updateValidity();
    // Add patient ID format validation
    if (this.value && !/^\d{6,10}$/.test(this.value)) {
      this._internals.setValidity(
        { patternMismatch: true },
        'Patient ID must be 6-10 digits',
      );
    }
  }
}
```

> **Note:** `_internals` remains private. If you need access, use the public form-associated API (`form`, `validity`, `checkValidity()`, `reportValidity()`). For custom validation, the `updateValidity()` hook provides access within the class.

---

## Component Extension Reference

### hx-alert — `HelixAlert`

| Protected Method | Since | Description |
|---|---|---|
| `getAlertClasses()` | 1.0.0 | Returns CSS class map for the alert container |
| `getAriaRole()` | 1.0.0 | Returns ARIA role string (`'alert'` or `'status'`) |
| `getAriaLive()` | 1.0.0 | Returns aria-live value |
| `renderDefaultIcon()` | 1.0.0 | Renders the default icon for the current variant |
| `renderCloseButton()` | 1.0.0 | Renders the dismiss button element |
| `handleClose()` | 1.0.0 | Called when user dismisses the alert |

**Example:** `PatientSafetyAlert extends HelixAlert` — see [examples.ts](./examples.ts)

---

### hx-badge — `HelixBadge`

| Protected Method | Since | Description |
|---|---|---|
| `getBadgeClasses()` | 1.0.0 | Returns CSS class map for the badge |
| `renderContent()` | 1.0.0 | Renders badge slot content |

**Example:** `StatusBadge extends HelixBadge` — see [examples.ts](./examples.ts)

---

### hx-button — `HelixButton`

| Protected Method | Since | Description |
|---|---|---|
| `getButtonClasses()` | 1.0.0 | Returns CSS class map for the button element |
| `renderContent()` | 1.0.0 | Renders the button's inner content |
| `shouldHandleClick(e)` | 1.0.0 | Return `false` to cancel click processing |
| `afterClick(e)` | 1.0.0 | Called after click event dispatched |

**Example:** `ConfirmButton extends HelixButton` — see [examples.ts](./examples.ts)

---

### hx-card — `HelixCard`

| Protected Method | Since | Description |
|---|---|---|
| `getCardClasses()` | 1.0.0 | Returns CSS class map for the card container |
| `renderImageSection()` | 1.0.0 | Renders the image slot section |
| `renderHeadingSection()` | 1.0.0 | Renders the heading slot section |
| `renderBodySection()` | 1.0.0 | Renders the body/default slot section |
| `renderFooterSection()` | 1.0.0 | Renders the footer slot section |
| `renderActionsSection()` | 1.0.0 | Renders the actions slot section |
| `shouldHandleClick(e)` | 1.0.0 | Return `false` to cancel navigation |
| `afterClick(e)` | 1.0.0 | Called after card-click event dispatched |

**Example:** `PatientCard extends HelixCard` — see [examples.ts](./examples.ts)

---

### hx-checkbox — `HelixCheckbox`

| Protected Method | Since | Description |
|---|---|---|
| `getCheckboxClasses()` | 1.0.0 | Returns CSS class map for the field wrapper |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |
| `shouldHandleChange(e)` | 1.0.0 | Return `false` to cancel change processing |

**Example:** `ConsentCheckbox extends HelixCheckbox` — see [examples.ts](./examples.ts)

---

### hx-container — `HelixContainer`

| Protected Method | Since | Description |
|---|---|---|
| `getContainerClasses()` | 1.0.0 | Returns CSS class map for the container |
| `renderContent()` | 1.0.0 | Renders slot content |

**Example:** `DashboardContainer extends HelixContainer` — see [examples.ts](./examples.ts)

---

### hx-form — `HelixForm`

| Protected Method | Since | Description |
|---|---|---|
| `getFormAttributes()` | 1.0.0 | Returns attributes applied to the form element |
| `renderFormContent()` | 1.0.0 | Renders the form's inner content |

**Example:** `PatientForm extends HelixForm` — see [examples.ts](./examples.ts)

---

### hx-prose — `HelixProse`

| Protected Method | Since | Description |
|---|---|---|
| `applyMaxWidth(value)` | 1.0.0 | Applies max-width to the host element |
| `renderContent()` | 1.0.0 | Renders the prose content |

**Example:** `ClinicalProse extends HelixProse` — see [examples.ts](./examples.ts)

---

### hx-radio-group — `HelixRadioGroup`

| Protected Method | Since | Description |
|---|---|---|
| `getGroupClasses()` | 1.0.0 | Returns CSS class map for the group container |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |

**Example:** `TreatmentOptions extends HelixRadioGroup` — see [examples.ts](./examples.ts)

---

### hx-select — `HelixSelect`

| Protected Method | Since | Description |
|---|---|---|
| `getSelectClasses()` | 1.0.0 | Returns CSS class map for the select field |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |
| `shouldHandleChange(e)` | 1.0.0 | Return `false` to cancel change processing |

**Example:** `MedicationSelect extends HelixSelect` — see [examples.ts](./examples.ts)

---

### hx-switch — `HelixSwitch`

| Protected Method | Since | Description |
|---|---|---|
| `getSwitchClasses()` | 1.0.0 | Returns CSS class map for the switch field |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |
| `shouldHandleChange(e)` | 1.0.0 | Return `false` to cancel change processing |

**Example:** `FeatureSwitch extends HelixSwitch` — see [examples.ts](./examples.ts)

---

### hx-text-input — `HelixTextInput`

| Protected Method | Since | Description |
|---|---|---|
| `getFieldClasses()` | 1.0.0 | Returns CSS class map for the field wrapper |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |
| `shouldHandleInput(e)` | 1.0.0 | Return `false` to cancel input processing |

**Example:** `PatientIdInput extends HelixTextInput` — see [examples.ts](./examples.ts)

---

### hx-textarea — `HelixTextarea`

| Protected Method | Since | Description |
|---|---|---|
| `getFieldClasses()` | 1.0.0 | Returns CSS class map for the field wrapper |
| `updateValidity()` | 1.0.0 | Override to add custom validation logic |

**Example:** `ClinicalNotesTextarea extends HelixTextarea` — see [examples.ts](./examples.ts)

---

## Stability Guarantees

### Stable (do not change in minor/patch)

- All `protected` methods listed in the tables above
- All `@property` decorated class properties
- All `@customElement` tag names
- All CSS `@csspart` names
- All `@slot` names
- All `@fires` event names and detail shapes

### Internal (may change in any release)

- Private properties (`_*`)
- Shadow DOM CSS class names
- Internal rendering order within `render()` not exposed via protected hooks
- `static styles` (override via CSS parts and custom properties instead)

---

## Healthcare Compliance Notes

When extending components for healthcare applications:

1. **Never remove ARIA attributes** — Always call `super.render()` or preserve the ARIA patterns from the base implementation
2. **Preserve keyboard navigation** — Extensions must maintain tab order and keyboard interaction patterns
3. **Test with screen readers** — Extensions must pass the same accessibility audit as base components
4. **Error boundary** — Override `updateValidity()` to enforce domain-specific constraints before patient data reaches form submission

---

## Migration Guide

When the Extension API changes across major versions, a migration guide will be published in this directory as `MIGRATION-vX.md`.

Current major version: **1.x**
