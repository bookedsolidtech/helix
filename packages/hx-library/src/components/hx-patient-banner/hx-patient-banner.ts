import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state, query } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { helixPatientBannerStyles } from './hx-patient-banner.styles.js';

/**
 * Patient identification banner implementing Joint Commission NPSG.01.01.01 two-identifier rule.
 * Renders as a landmark region containing named slots for patient identification fields.
 * Integrates with hx-phi-field for HIPAA-compliant display of masked identifiers.
 *
 * ## Security Model — Event Composition
 *
 * This component dispatches and propagates two categories of composed events:
 *
 * ### `hx-identifier-rule-violation` (dispatched by this component)
 * Fired with `composed: true` when the two-identifier rule is violated. The event detail
 * contains only structural metadata (`populatedIdentifiers` count, `requiredIdentifiers`
 * count) and the `patientId` attribute value. **No raw PHI is included.**
 *
 * The `patientId` is a developer-provided attribute intended as a correlation key for
 * application logic — it should be an opaque internal identifier (e.g., a UUID or
 * encounter ID), not a human-readable identifier like an MRN or SSN.
 *
 * ### `hx-phi-access` (bubbles from slotted hx-phi-field children)
 * Slotted `hx-phi-field` elements dispatch `hx-phi-access` with `composed: true`. These
 * events bubble through this component's shadow DOM via slot projection. This component
 * does NOT re-dispatch or modify these events. See `hx-phi-field` documentation for the
 * security model of those events.
 *
 * ### Consumer Responsibilities
 *
 * - **Multi-tenant isolation**: In micro-frontend architectures where multiple patient
 *   contexts share a document, scope event listeners to the appropriate DOM subtree.
 *   Both `hx-phi-access` and `hx-identifier-rule-violation` use `composed: true` and
 *   will bubble through shared ancestors across shadow boundaries.
 * - **patientId hygiene**: Set the `patient-id` attribute to an opaque internal
 *   identifier, not a human-readable clinical identifier. This value appears in
 *   composed events that cross shadow boundaries.
 *
 * @summary Patient identification banner with two-identifier rule enforcement.
 *
 * @tag hx-patient-banner
 *
 * @slot photo - Optional patient photo slot.
 * @slot name - Patient name field content.
 * @slot mrn - Medical record number field content. Use hx-phi-field for HIPAA compliance.
 * @slot dob - Date of birth field content. Use hx-phi-field for HIPAA compliance.
 * @slot allergies - Allergy status/flag content.
 * @slot code-status - Code status content.
 *
 * @csspart banner - The outer banner container.
 * @csspart photo-area - The photo slot wrapper.
 * @csspart fields - The fields grid container.
 * @csspart field - An individual field container (applied to all field wrappers).
 * @csspart field-label - The field label element.
 * @csspart field-value - The field value slot wrapper.
 * @csspart violation-message - The visually-hidden identifier rule violation status message.
 *
 * @fires {CustomEvent<PatientIdentifierRuleViolationDetail>} hx-identifier-rule-violation -
 *   Fired when fewer than 2 identifier slots are populated and enforce-identifier-rule is
 *   true. Contains structural metadata only — no raw PHI. Dispatched with `composed: true`.
 *
 * @cssprop [--hx-patient-banner-bg=var(--hx-color-neutral-50,#f9fafb)] - Banner background color.
 * @cssprop [--hx-patient-banner-border-color=var(--hx-color-neutral-200,#e5e7eb)] - Banner border color.
 * @cssprop [--hx-patient-banner-padding=var(--hx-space-3,0.75rem) var(--hx-space-4,1rem)] - Banner padding.
 * @cssprop [--hx-patient-banner-gap=var(--hx-space-4,1rem)] - Gap between banner fields.
 * @cssprop [--hx-patient-banner-font-family=var(--hx-font-family-sans,sans-serif)] - Banner font family.
 * @cssprop [--hx-patient-banner-label-color=var(--hx-color-neutral-500,#6b7280)] - Field label color.
 * @cssprop [--hx-patient-banner-label-font-size=var(--hx-font-size-xs,0.75rem)] - Field label font size.
 * @cssprop [--hx-patient-banner-value-color=var(--hx-color-neutral-900,#111827)] - Field value color.
 * @cssprop [--hx-patient-banner-value-font-size=var(--hx-font-size-sm,0.875rem)] - Field value font size.
 * @cssprop [--hx-patient-banner-photo-size=var(--hx-space-10,2.5rem)] - Photo area size.
 * @cssprop [--hx-patient-banner-photo-bg=var(--hx-color-neutral-200,#e5e7eb)] - Photo area background color when empty.
 */
@customElement('hx-patient-banner')
export class HelixPatientBanner extends HelixElement {
  static override styles = [helixPatientBannerStyles];

  // ─── Public Properties ───

  /**
   * Optional patient ID used as context in identifier rule violation events.
   * @attr patient-id
   */
  @property({ type: String, attribute: 'patient-id' })
  patientId: string = '';

  /**
   * Accessible label for the banner landmark region.
   * @attr label-patient
   */
  @property({ type: String, attribute: 'label-patient' })
  labelPatient: string = 'Patient identification';

  /**
   * Visible label for the name field.
   * @attr label-name
   */
  @property({ type: String, attribute: 'label-name' })
  labelName: string = 'Patient name';

  /**
   * Visible label for the MRN field.
   * @attr label-mrn
   */
  @property({ type: String, attribute: 'label-mrn' })
  labelMrn: string = 'MRN';

  /**
   * Visible label for the date of birth field.
   * @attr label-dob
   */
  @property({ type: String, attribute: 'label-dob' })
  labelDob: string = 'Date of birth';

  /**
   * Visible label for the allergies field.
   * @attr label-allergies
   */
  @property({ type: String, attribute: 'label-allergies' })
  labelAllergies: string = 'Allergies';

  /**
   * Visible label for the code status field.
   * @attr label-code-status
   */
  @property({ type: String, attribute: 'label-code-status' })
  labelCodeStatus: string = 'Code status';

  /**
   * Whether to enforce the Joint Commission NPSG.01.01.01 two-identifier rule.
   * When true, fires hx-identifier-rule-violation if fewer than 2 identifier
   * slots (name, mrn, dob) are populated.
   * @attr enforce-identifier-rule
   */
  @property({
    attribute: 'enforce-identifier-rule',
    reflect: true,
    converter: {
      fromAttribute: (value: string | null) => value !== 'false',
      toAttribute: (value: boolean) => String(value),
    },
  })
  enforceIdentifierRule: boolean = true;

  // ─── Internal State ───

  /** @internal */
  @state() private _identifierCount: number = 0;

  /** @internal */
  @state() private _isViolating: boolean = false;

  // ─── Slot Queries ───

  /** @internal */
  @query('slot[name="name"]') private _nameSlot!: HTMLSlotElement | null;

  /** @internal */
  @query('slot[name="mrn"]') private _mrnSlot!: HTMLSlotElement | null;

  /** @internal */
  @query('slot[name="dob"]') private _dobSlot!: HTMLSlotElement | null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'banner');
    this.setAttribute('aria-label', this.labelPatient);
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('labelPatient')) {
      this.setAttribute('aria-label', this.labelPatient);
    }

    if (changedProperties.has('enforceIdentifierRule')) {
      this._checkIdentifierRule();
    }
  }

  // ─── Private Helpers ───

  private _countPopulatedIdentifiers(): number {
    let count = 0;

    const slots = [this._nameSlot, this._mrnSlot, this._dobSlot];
    for (const slot of slots) {
      if (slot && slot.assignedNodes({ flatten: true }).length > 0) {
        count++;
      }
    }

    return count;
  }

  private _checkIdentifierRule(): void {
    const count = this._countPopulatedIdentifiers();
    this._identifierCount = count;

    if (this.enforceIdentifierRule && count < 2) {
      this._isViolating = true;
      this.setAttribute('aria-invalid', 'true');
      this.dispatchEvent(
        new CustomEvent<PatientIdentifierRuleViolationDetail>('hx-identifier-rule-violation', {
          bubbles: true,
          composed: true,
          detail: {
            populatedIdentifiers: count,
            requiredIdentifiers: 2,
            patientId: this.patientId,
          },
        }),
      );
    } else {
      this._isViolating = false;
      this.removeAttribute('aria-invalid');
    }
  }

  // ─── Event Handlers ───

  private _handleSlotChange(): void {
    this._checkIdentifierRule();
  }

  // ─── Render ───

  override render() {
    const violationMessage = this._isViolating
      ? `Warning: patient identification incomplete. ${this._identifierCount} of 2 required identifiers present.`
      : nothing;

    return html`
      <div part="banner" class="banner">
        <div part="photo-area" class="banner__photo-area" aria-hidden="true">
          <slot name="photo"></slot>
        </div>

        <div part="fields" class="banner__fields">
          <div part="field" class="field">
            <span part="field-label" class="field__label">${this.labelName}</span>
            <div part="field-value" class="field__value">
              <slot name="name" @slotchange=${this._handleSlotChange}></slot>
            </div>
          </div>

          <div part="field" class="field">
            <span part="field-label" class="field__label">${this.labelMrn}</span>
            <div part="field-value" class="field__value">
              <slot name="mrn" @slotchange=${this._handleSlotChange}></slot>
            </div>
          </div>

          <div part="field" class="field">
            <span part="field-label" class="field__label">${this.labelDob}</span>
            <div part="field-value" class="field__value">
              <slot name="dob" @slotchange=${this._handleSlotChange}></slot>
            </div>
          </div>

          <div part="field" class="field">
            <span part="field-label" class="field__label">${this.labelAllergies}</span>
            <div part="field-value" class="field__value">
              <slot name="allergies"></slot>
            </div>
          </div>

          <div part="field" class="field">
            <span part="field-label" class="field__label">${this.labelCodeStatus}</span>
            <div part="field-value" class="field__value">
              <slot name="code-status"></slot>
            </div>
          </div>
        </div>
      </div>

      ${violationMessage !== nothing
        ? html`<div
            part="violation-message"
            class="violation-message"
            role="alert"
            aria-live="assertive"
          >
            ${violationMessage}
          </div>`
        : nothing}
    `;
  }
}

/**
 * Event detail for identifier rule violations. Contains only structural metadata
 * about the validation state — never raw PHI values.
 *
 * **Security note**: The `patientId` field reflects the `patient-id` HTML attribute,
 * which should be set to an opaque internal identifier (UUID, encounter ID), not a
 * human-readable clinical identifier. This value crosses shadow DOM boundaries via
 * `composed: true` events.
 */
export interface PatientIdentifierRuleViolationDetail {
  /** Number of identifier slots currently populated (0, 1, or 2). */
  populatedIdentifiers: number;
  /** Minimum required identifiers per NPSG.01.01.01 (always 2). */
  requiredIdentifiers: number;
  /** Opaque patient identifier from the patient-id attribute. Should NOT contain raw PHI. */
  patientId: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-patient-banner': HelixPatientBanner;
  }
}
