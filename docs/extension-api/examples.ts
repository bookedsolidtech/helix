/**
 * Extension API Examples — wc-2026 Helix Component Library
 *
 * This file demonstrates how enterprise consumers extend Helix components.
 * Each example shows a healthcare-domain-specific extension using the
 * stable Extension API (protected methods) defined in each component.
 *
 * @see README.md for the full Extension API reference and version contract.
 * @since 1.0.0
 */

import {
  HelixAlert,
  HelixBadge,
  HelixButton,
  HelixCard,
  HelixCheckbox,
  HelixContainer,
  HelixForm,
  HelixProse,
  HelixRadioGroup,
  HelixSelect,
  HelixSwitch,
  HelixTextInput,
  HelixTextarea,
} from '@wc-2026/library';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// ─── hx-alert Example ───────────────────────────────────────────────────────

/**
 * PatientSafetyAlert — a high-priority alert for patient safety notifications.
 *
 * Extends HelixAlert to add a mandatory audit trail and prevent accidental dismissal
 * of safety-critical messages.
 *
 * @tag patient-safety-alert
 * @since 1.0.0
 */
@customElement('patient-safety-alert')
export class PatientSafetyAlert extends HelixAlert {
  /**
   * Audit ID for tracking safety alert acknowledgements.
   * @attr audit-id
   */
  @property({ type: String, attribute: 'audit-id' })
  auditId = '';

  /**
   * Renders a shield icon for safety-critical alerts instead of the default icon.
   * @protected
   */
  protected override renderDefaultIcon(): unknown {
    if (this.variant === 'error') {
      return html`
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1L3 4v5c0 4.55 2.95 8.8 7 10 4.05-1.2 7-5.45 7-10V4L10 1zm-1 11H9V8h2v4h-2zm0-6H9V4h2v2h-2z"/>
        </svg>
      `;
    }
    return super.renderDefaultIcon();
  }

  /**
   * Prevents accidental dismissal of safety-critical alerts by requiring confirmation.
   * @protected
   */
  protected override handleClose(): void {
    if (this.variant === 'error' || this.variant === 'warning') {
      const confirmed = window.confirm(
        'Are you sure you want to dismiss this safety alert?',
      );
      if (!confirmed) return;
    }

    // Log audit trail before dismissal
    if (this.auditId) {
      console.info(`[Audit] Safety alert ${this.auditId} dismissed by user`);
    }

    super.handleClose();
  }
}

// ─── hx-badge Example ───────────────────────────────────────────────────────

/**
 * StatusBadge — a badge that maps clinical status codes to badge variants.
 *
 * @tag status-badge
 * @since 1.0.0
 */
@customElement('status-badge')
export class StatusBadge extends HelixBadge {
  /**
   * Clinical status code that maps to the appropriate badge variant.
   * @attr status-code
   */
  @property({ type: String, attribute: 'status-code' })
  statusCode: 'active' | 'inactive' | 'critical' | 'stable' = 'stable';

  /**
   * Adds a status indicator class based on the clinical status code.
   * @protected
   */
  protected override getBadgeClasses(): Record<string, boolean> {
    return {
      ...super.getBadgeClasses(),
      [`badge--clinical-${this.statusCode}`]: true,
    };
  }

  /**
   * Renders the status code as a human-readable label with an icon prefix.
   * @protected
   */
  protected override renderContent(): unknown {
    const icons: Record<string, string> = {
      active: '●',
      inactive: '○',
      critical: '▲',
      stable: '■',
    };
    return html`<span aria-hidden="true">${icons[this.statusCode]} </span>${super.renderContent()}`;
  }
}

// ─── hx-button Example ──────────────────────────────────────────────────────

/**
 * ConfirmButton — a button that requires confirmation before executing destructive actions.
 *
 * @tag confirm-button
 * @since 1.0.0
 */
@customElement('confirm-button')
export class ConfirmButton extends HelixButton {
  /**
   * The confirmation message displayed before the action executes.
   * @attr confirm-message
   */
  @property({ type: String, attribute: 'confirm-message' })
  confirmMessage = 'Are you sure you want to proceed?';

  /**
   * Intercepts the click to require user confirmation.
   * @protected
   */
  protected override shouldHandleClick(_e: MouseEvent): boolean {
    if (this.disabled) return false;
    return window.confirm(this.confirmMessage);
  }

  /**
   * Logs the confirmed action for audit purposes.
   * @protected
   */
  protected override afterClick(_e: MouseEvent): void {
    console.info(`[Audit] Confirmed action executed: ${this.textContent?.trim()}`);
  }
}

// ─── hx-card Example ────────────────────────────────────────────────────────

/**
 * PatientCard — a card variant for displaying patient information.
 *
 * Adds urgency indicators and a patient record link to the standard card.
 *
 * @tag patient-card
 * @since 1.0.0
 */
@customElement('patient-card')
export class PatientCard extends HelixCard {
  /**
   * Urgency level that determines card border treatment.
   * @attr urgency
   */
  @property({ type: String, reflect: true })
  urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

  /**
   * Adds urgency styling classes to the card.
   * @protected
   */
  protected override getCardClasses(): Record<string, boolean> {
    return {
      ...super.getCardClasses(),
      [`card--urgency-${this.urgency}`]: true,
    };
  }

  /**
   * Prepends an urgency banner to the image section when urgency is high or critical.
   * @protected
   */
  protected override renderImageSection(): unknown {
    if (this.urgency === 'high' || this.urgency === 'critical') {
      return html`
        <div role="alert" class="urgency-banner urgency-banner--${this.urgency}">
          ${this.urgency === 'critical' ? 'CRITICAL' : 'HIGH PRIORITY'}
        </div>
        ${super.renderImageSection()}
      `;
    }
    return super.renderImageSection();
  }

  /**
   * Prevents navigation for critical patients (require explicit action instead).
   * @protected
   */
  protected override shouldHandleClick(_e: MouseEvent): boolean {
    if (this.urgency === 'critical') {
      return false;
    }
    return true;
  }
}

// ─── hx-checkbox Example ────────────────────────────────────────────────────

/**
 * ConsentCheckbox — a checkbox that enforces informed-consent validation.
 *
 * Requires explicit user acknowledgement before the checkbox value is considered valid.
 *
 * @tag consent-checkbox
 * @since 1.0.0
 */
@customElement('consent-checkbox')
export class ConsentCheckbox extends HelixCheckbox {
  /**
   * Override validation to enforce that consent must be actively checked.
   * @protected
   */
  protected override updateValidity(): void {
    super.updateValidity();
    // Consent checkboxes are always required — even if required attr is not set
    if (!this.checked) {
      (this as unknown as { _internals: ElementInternals })._internals?.setValidity(
        { valueMissing: true },
        'You must provide consent to continue.',
      );
    }
  }
}

// ─── hx-container Example ───────────────────────────────────────────────────

/**
 * DashboardContainer — a container with max-width constraints for dashboard layouts.
 *
 * @tag dashboard-container
 * @since 1.0.0
 */
@customElement('dashboard-container')
export class DashboardContainer extends HelixContainer {
  /**
   * Adds dashboard-specific container classes.
   * @protected
   */
  protected override getContainerClasses(): Record<string, boolean> {
    return {
      ...super.getContainerClasses(),
      'container--dashboard': true,
    };
  }
}

// ─── hx-form Example ────────────────────────────────────────────────────────

/**
 * PatientForm — a form component with patient-data-specific attributes.
 *
 * @tag patient-form
 * @since 1.0.0
 */
@customElement('patient-form')
export class PatientForm extends HelixForm {
  /**
   * Patient encounter ID for form submission tracking.
   * @attr encounter-id
   */
  @property({ type: String, attribute: 'encounter-id' })
  encounterId = '';

  /**
   * Adds encounter tracking attributes to the form element.
   * @protected
   */
  protected override getFormAttributes(): Record<string, string | undefined> {
    return {
      ...super.getFormAttributes(),
      'data-encounter-id': this.encounterId || undefined,
      'data-form-type': 'patient-record',
    };
  }
}

// ─── hx-prose Example ───────────────────────────────────────────────────────

/**
 * ClinicalProse — prose component tuned for clinical documentation.
 *
 * Enforces narrower line lengths for readability in clinical contexts.
 *
 * @tag clinical-prose
 * @since 1.0.0
 */
@customElement('clinical-prose')
export class ClinicalProse extends HelixProse {
  /**
   * Applies a narrower max-width suitable for clinical note reading comfort.
   * @protected
   */
  protected override applyMaxWidth(value: string): void {
    // Enforce a maximum of 65ch for clinical readability, regardless of consumer setting
    const clampedWidth = value && value !== 'none' ? '65ch' : value;
    super.applyMaxWidth(clampedWidth);
  }
}

// ─── hx-radio-group Example ─────────────────────────────────────────────────

/**
 * TreatmentOptions — a radio group for selecting patient treatment options.
 *
 * Adds validation that prevents selection of contraindicated treatments.
 *
 * @tag treatment-options
 * @since 1.0.0
 */
@customElement('treatment-options')
export class TreatmentOptions extends HelixRadioGroup {
  /**
   * Comma-separated list of contraindicated option values for this patient.
   * @attr contraindicated
   */
  @property({ type: String })
  contraindicated = '';

  /**
   * Validates that the selected value is not contraindicated.
   * @protected
   */
  protected override updateValidity(): void {
    super.updateValidity();
    if (this.contraindicated && this.value) {
      const contraList = this.contraindicated.split(',').map((s) => s.trim());
      if (contraList.includes(this.value)) {
        (this as unknown as { _internals: ElementInternals })._internals?.setValidity(
          { customError: true },
          'This treatment is contraindicated for this patient.',
        );
      }
    }
  }
}

// ─── hx-select Example ──────────────────────────────────────────────────────

/**
 * MedicationSelect — a select for choosing patient medications.
 *
 * Adds formulary validation to ensure only approved medications are selected.
 *
 * @tag medication-select
 * @since 1.0.0
 */
@customElement('medication-select')
export class MedicationSelect extends HelixSelect {
  /**
   * Comma-separated list of approved formulary medication codes.
   * @attr formulary
   */
  @property({ type: String })
  formulary = '';

  /**
   * Validates that the selected medication is on the formulary.
   * @protected
   */
  protected override updateValidity(): void {
    super.updateValidity();
    if (this.formulary && this.value) {
      const approved = this.formulary.split(',').map((s) => s.trim());
      if (!approved.includes(this.value)) {
        (this as unknown as { _internals: ElementInternals })._internals?.setValidity(
          { customError: true },
          'This medication is not on the approved formulary.',
        );
      }
    }
  }
}

// ─── hx-switch Example ──────────────────────────────────────────────────────

/**
 * FeatureSwitch — a switch that controls feature flags with permission checks.
 *
 * @tag feature-switch
 * @since 1.0.0
 */
@customElement('feature-switch')
export class FeatureSwitch extends HelixSwitch {
  /**
   * Required permission level to toggle this feature.
   * @attr required-permission
   */
  @property({ type: String, attribute: 'required-permission' })
  requiredPermission = '';

  /**
   * Simulated current user permission level (replace with real auth integration).
   * @attr user-permission
   */
  @property({ type: String, attribute: 'user-permission' })
  userPermission = '';

  /**
   * Prevents toggle if user lacks the required permission.
   * @protected
   */
  protected override shouldHandleChange(_e: Event): boolean {
    if (this.requiredPermission && this.userPermission !== this.requiredPermission) {
      console.warn(
        `[FeatureSwitch] User lacks permission '${this.requiredPermission}' to toggle this feature.`,
      );
      return false;
    }
    return true;
  }
}

// ─── hx-text-input Example ──────────────────────────────────────────────────

/**
 * PatientIdInput — a text input that validates patient ID format.
 *
 * @tag patient-id-input
 * @since 1.0.0
 */
@customElement('patient-id-input')
export class PatientIdInput extends HelixTextInput {
  /**
   * Validates that the value matches the expected patient ID format (6-10 digits).
   * @protected
   */
  protected override updateValidity(): void {
    super.updateValidity();
    if (this.value && !/^\d{6,10}$/.test(this.value)) {
      (this as unknown as { _internals: ElementInternals })._internals?.setValidity(
        { patternMismatch: true },
        'Patient ID must be 6–10 digits.',
      );
    }
  }

  /**
   * Strips non-numeric characters from input before processing.
   * @protected
   */
  protected override shouldHandleInput(e: Event): boolean {
    const input = (e.target as HTMLInputElement);
    // Sanitize: strip non-digit characters
    input.value = input.value.replace(/\D/g, '');
    return true;
  }
}

// ─── hx-textarea Example ────────────────────────────────────────────────────

/**
 * ClinicalNotesTextarea — a textarea for clinical note entry.
 *
 * Enforces minimum content requirements and adds character counting.
 *
 * @tag clinical-notes-textarea
 * @since 1.0.0
 */
@customElement('clinical-notes-textarea')
export class ClinicalNotesTextarea extends HelixTextarea {
  /**
   * Minimum required character count for valid clinical notes.
   * @attr min-length
   */
  @property({ type: Number, attribute: 'min-length' })
  minLength = 20;

  /**
   * Validates that clinical notes meet the minimum length requirement.
   * @protected
   */
  protected override updateValidity(): void {
    super.updateValidity();
    if (this.value && this.value.length < this.minLength) {
      (this as unknown as { _internals: ElementInternals })._internals?.setValidity(
        { tooShort: true },
        `Clinical notes must be at least ${this.minLength} characters.`,
      );
    }
  }
}
