import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixPatientBannerStyles } from './hx-patient-banner.styles.js';

/**
 * Patient identification banner implementing Joint Commission NPSG.01.01.01 two-identifier rule.
 * Renders as a landmark region containing named slots for patient identification fields.
 * Integrates with hx-phi-field for HIPAA-compliant display of masked identifiers.
 * Note: hx-phi-access events fired by slotted hx-phi-field elements bubble through this
 * component via composed: true — no re-dispatch is required.
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
 *
 * @fires {CustomEvent<PatientIdentifierRuleViolationDetail>} hx-identifier-rule-violation - Fired when fewer than 2 identifier slots are populated and enforce-identifier-rule is true.
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
 */
@customElement('hx-patient-banner')
export class HelixPatientBanner extends LitElement {
  static override styles = [tokenStyles, helixPatientBannerStyles];

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
  @property({ type: Boolean, attribute: 'enforce-identifier-rule' })
  enforceIdentifierRule: boolean = true;

  // ─── Internal State ───

  @state() private _identifierCount: number = 0;

  // ─── Slot Queries ───

  @query('slot[name="name"]') private _nameSlot!: HTMLSlotElement;
  @query('slot[name="mrn"]') private _mrnSlot!: HTMLSlotElement;
  @query('slot[name="dob"]') private _dobSlot!: HTMLSlotElement;

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
      this.removeAttribute('aria-invalid');
    }
  }

  // ─── Event Handlers ───

  private _handleSlotChange(): void {
    this._checkIdentifierRule();
  }

  // ─── Render ───

  override render() {
    return html`
      <div part="banner" class="banner">
        <div part="photo-area" class="banner__photo-area">
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
    `;
  }
}

export interface PatientIdentifierRuleViolationDetail {
  populatedIdentifiers: number;
  requiredIdentifiers: number;
  patientId: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-patient-banner': HelixPatientBanner;
  }
}
