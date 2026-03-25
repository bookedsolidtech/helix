import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixPhiFieldStyles } from './hx-phi-field.styles.js';

/**
 * HIPAA-compliant field component for rendering masked Protected Health Information (PHI).
 * PHI is masked by default and only rendered to the DOM when explicitly revealed. Access
 * events are fired on reveal, hide, and clipboard auto-clear for audit trail purposes.
 *
 * @summary HIPAA-compliant field for rendering masked Protected Health Information.
 *
 * @tag hx-phi-field
 *
 * @csspart container - The outer wrapper element.
 * @csspart value - The value display span (masked or revealed).
 * @csspart toggle - The reveal/hide toggle button.
 *
 * @fires {CustomEvent<PhiAccessEventDetail>} hx-phi-access - Fired on reveal, hide, and clipboard auto-clear.
 *
 * @cssprop [--hx-phi-field-font-family=var(--hx-font-family-mono,monospace)] - Font family for the masked value.
 * @cssprop [--hx-phi-field-value-color=var(--hx-color-neutral-900,#111827)] - Value text color.
 * @cssprop [--hx-phi-field-masked-color=var(--hx-color-neutral-500,#6b7280)] - Masked value text color.
 * @cssprop [--hx-phi-field-toggle-color=var(--hx-color-primary-500,#2563eb)] - Toggle button color.
 * @cssprop [--hx-phi-field-focus-ring-color=var(--hx-focus-ring-color,var(--hx-color-primary-500,#2563eb))] - Focus ring color.
 */
@customElement('hx-phi-field')
export class HelixPhiField extends LitElement {
  static override styles = [tokenStyles, helixPhiFieldStyles];

  // ─── Public Properties ───

  /**
   * The Protected Health Information value to display or mask.
   * @attr data
   */
  @property({ type: String })
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

  // ─── Internal State ───

  @state() private _masked = true;

  private _clipboardTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Enforce HIPAA compliance: prevent browser autofill on the host element
    this.setAttribute('autocomplete', 'off');
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelClipboardTimer();
  }

  // ─── Private Helpers ───

  private _cancelClipboardTimer(): void {
    if (this._clipboardTimer !== null) {
      clearTimeout(this._clipboardTimer);
      this._clipboardTimer = null;
    }
  }

  private _scheduleClipboardClear(): void {
    this._cancelClipboardTimer();
    this._clipboardTimer = setTimeout(() => {
      this._clearClipboard();
    }, this.clipboardTimeout);
  }

  private _clearClipboard(): void {
    this._clipboardTimer = null;
    navigator.clipboard.writeText('').catch(() => {
      // Clipboard clear failure is non-fatal — silently ignore
    });
    this.dispatchEvent(
      new CustomEvent<PhiAccessEventDetail>('hx-phi-access', {
        bubbles: true,
        composed: true,
        detail: {
          fieldId: this.fieldId || this.id || '',
          action: 'hide',
          timestamp: new Date().toISOString(),
          fieldType: this.fieldType,
        },
      }),
    );
    this._masked = true;
  }

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

  private _handleToggle(): void {
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

  private _handleCopy(e: ClipboardEvent): void {
    if (this._masked) {
      e.preventDefault();
    }
  }

  private _handlePaste(e: ClipboardEvent): void {
    if (this._masked) {
      e.preventDefault();
    }
  }

  // ─── Render Helpers ───

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
    return html`
      <div part="container" class="phi-field" @copy=${this._handleCopy} @paste=${this._handlePaste}>
        ${this._masked
          ? html`<span part="value" class="phi-field__value phi-field__value--masked"
              >${this._getMaskedValue()}</span
            >`
          : html`<span part="value" class="phi-field__value phi-field__value--revealed"
              >${this.data}</span
            >`}
        <span role="status" aria-live="polite" aria-atomic="true" class="phi-field__status">
          ${this._masked
            ? 'Protected health information is masked'
            : 'Protected health information is revealed'}
        </span>
        <button
          part="toggle"
          class="phi-field__toggle"
          type="button"
          aria-label=${this._masked
            ? 'Reveal protected health information'
            : 'Hide protected health information'}
          aria-pressed=${String(!this._masked)}
          @click=${this._handleToggle}
        >
          ${this._masked ? this._renderEyeIcon() : this._renderEyeOffIcon()}
        </button>
      </div>
    `;
  }
}

export interface PhiAccessEventDetail {
  fieldId: string;
  action: 'reveal' | 'hide';
  timestamp: string;
  fieldType: 'ssn' | 'mrn' | 'dob' | 'insurance';
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-phi-field': HelixPhiField;
  }
}
