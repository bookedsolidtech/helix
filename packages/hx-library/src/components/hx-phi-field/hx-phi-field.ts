import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { helixPhiFieldStyles } from './hx-phi-field.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

/**
 * HIPAA-compliant field component for rendering masked Protected Health Information (PHI).
 * PHI is masked by default and only rendered to the DOM when explicitly revealed. Access
 * events are fired on reveal, hide, and clipboard auto-clear for audit trail purposes.
 *
 * ## Security Model — Event Composition
 *
 * The `hx-phi-access` event is dispatched with `composed: true` so it crosses shadow DOM
 * boundaries and reaches application-level audit listeners. This is intentional — audit
 * trail events MUST reach the host application regardless of shadow DOM nesting depth.
 *
 * **PHI is never included in event details.** The `PhiAccessEventDetail` payload contains
 * only audit metadata: `fieldId`, `action`, `timestamp`, and `fieldType`. The actual PHI
 * value (the `data` property) is deliberately excluded from all dispatched events.
 *
 * ### Consumer Responsibilities
 *
 * - **Audit logging**: Listen for `hx-phi-access` at the application root to build a
 *   HIPAA-compliant access audit trail. The `fieldId` and `timestamp` fields correlate
 *   access events to specific data elements without exposing the data itself.
 * - **Multi-tenant isolation**: In micro-frontend architectures where multiple patient
 *   contexts share a document, consumers MUST scope their `hx-phi-access` listeners to
 *   the appropriate DOM subtree (e.g., listen on a container element rather than
 *   `document`). Composed events from one patient context will bubble through shared
 *   ancestors.
 * - **Do not extend event details with PHI**: When wrapping this component, never add
 *   the raw `data` value to re-dispatched events. The separation of audit metadata from
 *   PHI content is a deliberate security boundary.
 *
 * @summary HIPAA-compliant field for rendering masked Protected Health Information.
 *
 * @tag hx-phi-field
 *
 * @csspart container - The outer wrapper element.
 * @csspart value - The value display span (masked or revealed).
 * @csspart toggle - The reveal/hide toggle button.
 *
 * @fires {CustomEvent<PhiAccessEventDetail>} hx-phi-access - Fired on reveal, hide, and
 *   clipboard-clear actions. Contains audit metadata only — never raw PHI. Dispatched with
 *   `composed: true` to cross shadow boundaries for application-level audit listeners.
 *
 * @cssprop [--hx-phi-field-font-family=var(--hx-font-family-mono,monospace)] - Font family for the masked value.
 * @cssprop [--hx-phi-field-value-color=var(--hx-color-neutral-900,#111827)] - Value text color.
 * @cssprop [--hx-phi-field-masked-color=var(--hx-color-neutral-500,#6b7280)] - Masked value text color.
 * @cssprop [--hx-phi-field-toggle-color=var(--hx-color-primary-500,#2563eb)] - Toggle button color.
 * @cssprop [--hx-phi-field-focus-ring-color=var(--hx-focus-ring-color,var(--hx-color-primary-500,#2563eb))] - Focus ring color.
 * @cssprop [--hx-phi-field-disabled-opacity=var(--hx-opacity-50,0.5)] - Opacity applied when the field is disabled.
 */
@customElement('hx-phi-field')
export class HelixPhiField extends HelixElement {
  static override styles = [helixPhiFieldStyles];

  // ─── Public Properties ───

  /**
   * The Protected Health Information value to display or mask.
   * Must be set via the JavaScript property (`element.data = "..."`) — not as an HTML attribute.
   * Setting PHI as an HTML attribute exposes it in the DOM and browser caches (HIPAA violation).
   */
  @property({ attribute: false })
  data: string = '';

  /**
   * The type of PHI field. Controls the masking pattern applied.
   * @attr field-type
   */
  @property({ type: String, reflect: true, attribute: 'field-type' })
  fieldType: 'ssn' | 'mrn' | 'dob' | 'insurance' = 'ssn';

  /**
   * Identifier used in audit events. Falls back to the element's id attribute.
   * @attr field-id
   */
  @property({ type: String, attribute: 'field-id' })
  fieldId: string = '';

  /**
   * Milliseconds after clipboard write before the clipboard is automatically cleared.
   * Defaults to 30000 (30 seconds).
   * @attr clipboard-timeout
   */
  @property({ type: Number, attribute: 'clipboard-timeout' })
  clipboardTimeout: number = 30000;

  /**
   * Accessible label describing the PHI field. Used as a prefix in screen reader
   * announcements (e.g., "Social Security Number is masked").
   * @attr label
   */
  @property({ type: String })
  label: string = '';

  /**
   * When set, disables all interaction with the field and prevents reveal.
   * @attr disabled
   * @reflect
   */
  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;

  // ─── Internal State ───

  /** @internal */
  @state() private _masked = true;

  /** @internal */
  private _clipboardTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  /** @internal Bound reference for visibilitychange listener cleanup. */
  private readonly _boundHandleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this._clearClipboard();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    // Enforce HIPAA compliance: prevent browser autofill on the host element
    this.setAttribute('autocomplete', 'off');
    // HIPAA: Clear clipboard immediately when tab is hidden (prevents PHI exposure
    // when setTimeout is throttled in backgrounded tabs on mobile/laptop lid close).
    document.addEventListener('visibilitychange', this._boundHandleVisibilityChange);
    // FS-029: PHI SSR/attribute exposure prevention.
    // If a developer (or server-rendered HTML) mistakenly sets PHI via the
    // `data` HTML attribute, the raw value is readable in the DOM source before
    // JavaScript initialises — a HIPAA risk on SSR pages. We recover the value
    // into the JS-only property and then immediately remove the attribute so
    // that no PHI is ever left exposed in the DOM tree or HTML source.
    if (this.hasAttribute('data')) {
      devWarn(
        'hx-phi-field',
        'Setting PHI via the `data` HTML attribute is not supported and exposes sensitive data in the DOM source. Use the `data` JS property (element.data = "...") instead.',
      );
      // Rescue the value into the private property so the component still works,
      // then strip the attribute so the raw PHI is no longer readable in the DOM.
      const rawValue = this.getAttribute('data');
      if (rawValue !== null) {
        this.data = rawValue;
      }
      this.removeAttribute('data');
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelClipboardTimer();
    document.removeEventListener('visibilitychange', this._boundHandleVisibilityChange);
  }

  // ─── Private Helpers ───

  /** @internal */
  private _cancelClipboardTimer(): void {
    if (this._clipboardTimer !== null) {
      clearTimeout(this._clipboardTimer);
      this._clipboardTimer = null;
    }
  }

  /** @internal */
  private _scheduleClipboardClear(): void {
    this._cancelClipboardTimer();
    this._clipboardTimer = setTimeout(() => {
      this._clearClipboard();
    }, this.clipboardTimeout);
  }

  /** @internal */
  private _clearClipboard(): void {
    this._clipboardTimer = null;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator?.clipboard?.writeText('').catch(() => {
        // Clipboard clear failure is non-fatal — silently ignore
      });
    }
    this.dispatchEvent(
      new CustomEvent<PhiAccessEventDetail>('hx-phi-access', {
        bubbles: true,
        composed: true,
        detail: {
          fieldId: this.fieldId || this.id || '',
          action: 'clipboard-clear',
          timestamp: new Date().toISOString(),
          fieldType: this.fieldType,
        },
      }),
    );
    this._masked = true;
  }

  /** @internal */
  private _getMaskedValue(): string {
    if (!this.data) return '';

    switch (this.fieldType) {
      case 'ssn': {
        // Format: xxx-xx-xxxx → ***-**-xxxx (show last 4 digits)
        // Match the separator-delimited pattern first
        const ssnMatch = this.data.match(/^(\d{3})(-?)(\d{2})(-?)(\d{4})$/);
        if (ssnMatch) {
          return `***${ssnMatch[2]}**${ssnMatch[4]}${ssnMatch[5]}`;
        }
        // Fallback: mask all but last 4 chars
        return this.data.slice(0, -4).replace(/\d/g, '*') + this.data.slice(-4);
      }

      case 'mrn': {
        // Mask all but last 4 alphanumeric characters, preserve separators
        const chars = this.data.split('');
        const alphanumericIndices: number[] = [];
        chars.forEach((ch, i) => {
          if (/[a-zA-Z0-9]/.test(ch)) {
            alphanumericIndices.push(i);
          }
        });
        const revealCount = Math.min(4, alphanumericIndices.length);
        const maskUntilIdx = alphanumericIndices.length - revealCount;
        const indicesToMask = new Set(alphanumericIndices.slice(0, maskUntilIdx));
        return chars.map((ch, i) => (indicesToMask.has(i) ? '*' : ch)).join('');
      }

      case 'dob': {
        // Replace ALL digits with *, preserve separators
        return this.data.replace(/\d/g, '*');
      }

      case 'insurance': {
        // Format: xxxx-xxxx-xxxx-xxxx → ****-****-****-xxxx (show last 4 digits)
        const insMatch = this.data.match(/^(\d{4})(-?)(\d{4})(-?)(\d{4})(-?)(\d{4})$/);
        if (insMatch) {
          return `****${insMatch[2]}****${insMatch[4]}****${insMatch[6]}${insMatch[7]}`;
        }
        // Fallback: mask all but last 4 chars
        return this.data.slice(0, -4).replace(/[a-zA-Z0-9]/g, '*') + this.data.slice(-4);
      }

      default: {
        // Exhaustive check — fieldType is typed, but guard defensively
        const _exhaustive: never = this.fieldType;
        return _exhaustive;
      }
    }
  }

  // ─── Event Handlers ───

  /** @internal */
  private _handleToggle(): void {
    if (this.disabled) return;

    // Dispatch BEFORE toggling state so action reflects the upcoming state
    this.dispatchEvent(
      new CustomEvent<PhiAccessEventDetail>('hx-phi-access', {
        bubbles: true,
        composed: true,
        detail: {
          fieldId: this.fieldId || this.id || '',
          action: this._masked ? 'reveal' : 'hide',
          timestamp: new Date().toISOString(),
          fieldType: this.fieldType,
        },
      }),
    );

    if (this._masked) {
      // Revealing: start clipboard clear timer
      this._masked = false;
      this._scheduleClipboardClear();
    } else {
      // Hiding: cancel any pending clipboard clear
      this._cancelClipboardTimer();
      this._masked = true;
    }
  }

  /** @internal */
  private _handleCopy(e: ClipboardEvent): void {
    if (this._masked) {
      e.preventDefault();
    }
  }

  /** @internal */
  private _handlePaste(e: ClipboardEvent): void {
    if (this._masked) {
      e.preventDefault();
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderEyeIcon(): TemplateResult {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    `;
  }

  /** @internal */
  private _renderEyeOffIcon(): TemplateResult {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const fieldLabel = this.label || 'Protected health information';
    const maskedLabel = `${fieldLabel} is masked`;
    const revealedLabel = `${fieldLabel} is revealed`;
    const revealActionLabel = `Reveal ${fieldLabel.toLowerCase()}`;
    const hideActionLabel = `Hide ${fieldLabel.toLowerCase()}`;

    return html`
      <div
        part="container"
        class=${classMap({ 'phi-field': true, 'phi-field--disabled': this.disabled })}
        @copy=${this._handleCopy}
        @paste=${this._handlePaste}
      >
        ${this._masked
          ? html`<span
              part="value"
              class="phi-field__value phi-field__value--masked"
              aria-hidden="true"
              >${this._getMaskedValue()}</span
            >`
          : html`<span part="value" class="phi-field__value phi-field__value--revealed"
              >${this.data}</span
            >`}
        <span role="status" aria-live="polite" aria-atomic="true" class="phi-field__status">
          ${this._masked ? maskedLabel : revealedLabel}
        </span>
        <button
          part="toggle"
          class="phi-field__toggle"
          type="button"
          ?disabled=${this.disabled}
          aria-label=${this._masked ? revealActionLabel : hideActionLabel}
          aria-pressed=${String(!this._masked)}
          @click=${this._handleToggle}
        >
          ${this._masked ? this._renderEyeIcon() : this._renderEyeOffIcon()}
        </button>
      </div>
    `;
  }
}

/**
 * Audit metadata for PHI access events. This interface intentionally contains
 * only identifiers and action metadata — never raw PHI values. The separation
 * of audit trail data from PHI content is a deliberate HIPAA security boundary.
 *
 * **Security invariant**: No field in this interface should ever contain the
 * actual protected health information (SSN digits, MRN value, date of birth,
 * insurance number). The `fieldId` is a developer-assigned logical identifier,
 * not the PHI value itself.
 */
export interface PhiAccessEventDetail {
  /** Developer-assigned logical identifier for the field (NOT the PHI value). */
  fieldId: string;
  /** The action that triggered the audit event. */
  action: 'reveal' | 'hide' | 'clipboard-clear';
  /** ISO 8601 timestamp of the access event. */
  timestamp: string;
  /** The category of PHI this field contains. */
  fieldType: 'ssn' | 'mrn' | 'dob' | 'insurance';
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-phi-field': HelixPhiField;
  }
}
