import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { helixPhiFieldStyles } from './hx-phi-field.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
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
 * @fires {CustomEvent<PhiAccessEventDetail>} hx-phi-access - Fired on reveal, hide,
 *   auto-hide, clipboard-clear, and clipboard-clear-failed actions. Contains audit
 *   metadata only — never raw PHI. Dispatched with `composed: true` to cross shadow
 *   boundaries for application-level audit listeners.
 *
 * @cssprop [--hx-phi-field-font-family=var(--hx-font-family-mono,monospace)] - Font family for the masked value.
 * @cssprop [--hx-phi-field-value-color=var(--hx-color-neutral-900,#0D1825)] - Value text color.
 * @cssprop [--hx-phi-field-masked-color=var(--hx-color-neutral-500,#66787B)] - Masked value text color.
 * @cssprop [--hx-phi-field-toggle-color=var(--hx-color-primary-500,#429797)] - Toggle button color.
 * @cssprop [--hx-phi-field-focus-ring-color=var(--hx-focus-ring-color,var(--hx-color-primary-500,#429797))] - Focus ring color.
 * @cssprop [--hx-phi-field-disabled-opacity=var(--hx-opacity-50,0.5)] - Opacity applied when the field is disabled.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-font-family-mono] - Font family.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-phi-field-letter-spacing=0.1em] - CSS custom property.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-opacity-90] - Opacity.
 * @cssprop [--hx-opacity-50] - Opacity.
 */
@customElement('hx-phi-field')
export class HelixPhiField extends HelixElement {
  static override styles = [helixPhiFieldStyles, forcedColorsField];

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
   * Seconds of inactivity after reveal before PHI is automatically re-masked.
   * Prevents PHI from remaining visible indefinitely when a clinician walks away.
   * Set to 0 to disable auto-hide. Defaults to 60 seconds.
   * @attr auto-hide-delay
   */
  @property({ type: Number, attribute: 'auto-hide-delay' })
  autoHideDelay: number = 60;

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

  /** @internal Timer ID for auto-re-mask after reveal. */
  private _autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  /** @internal Bound reference for visibilitychange listener cleanup. */
  private readonly _boundHandleVisibilityChange = (): void => {
    if (document.visibilityState !== 'hidden') return;
    // Only clear if the field has been revealed (unmasked) or an active
    // clipboard-clear timer is running. Otherwise there's nothing to clear,
    // and emitting hx-phi-access with action: 'clipboard-clear' would pollute
    // the HIPAA audit log with events for fields that were never accessed.
    if (this._masked && this._clipboardTimer === null) return;
    this._clearClipboard();
  };

  /** @internal Bound reference for interaction-based auto-hide timer reset. */
  private readonly _boundResetAutoHideTimer = (): void => {
    this._resetAutoHideTimer();
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
    this._cancelAutoHideTimer();
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

  /** @internal Cancel the auto-hide timer if running. */
  private _cancelAutoHideTimer(): void {
    if (this._autoHideTimer !== null) {
      clearTimeout(this._autoHideTimer);
      this._autoHideTimer = null;
    }
    this._removeAutoHideInteractionListeners();
  }

  /** @internal Start the auto-hide countdown. Resets if already running. */
  private _scheduleAutoHide(): void {
    this._cancelAutoHideTimer();
    if (this.autoHideDelay <= 0) return;

    this._addAutoHideInteractionListeners();
    this._autoHideTimer = setTimeout(() => {
      this._autoHideTimer = null;
      this._autoHide();
    }, this.autoHideDelay * 1000);
  }

  /** @internal Reset the auto-hide timer on user interaction. */
  private _resetAutoHideTimer(): void {
    if (this._autoHideTimer === null) return;
    this._scheduleAutoHide();
  }

  /** @internal Auto-hide PHI and dispatch audit event. */
  private _autoHide(): void {
    if (this._masked) return;

    this._removeAutoHideInteractionListeners();
    // Do NOT cancel the clipboard-clear timer — same reasoning as the manual
    // hide branch of `_handleToggle`. A reveal may have resulted in a copy,
    // and cancelling the scheduled clear would leave PHI on the clipboard
    // past the auto-hide ceiling.
    this._masked = true;

    this.dispatchEvent(
      new CustomEvent<PhiAccessEventDetail>('hx-phi-access', {
        bubbles: true,
        composed: true,
        detail: {
          fieldId: this.fieldId || this.id || '',
          action: 'auto-hide',
          timestamp: new Date().toISOString(),
          fieldType: this.fieldType,
        },
      }),
    );
  }

  /** @internal Interaction events that reset the auto-hide timer. */
  private static readonly _AUTO_HIDE_INTERACTION_EVENTS = [
    'mouseenter',
    'mousemove',
    'focusin',
    'keydown',
    'pointerdown',
  ] as const;

  /** @internal Add interaction listeners to reset auto-hide timer. */
  private _addAutoHideInteractionListeners(): void {
    for (const event of HelixPhiField._AUTO_HIDE_INTERACTION_EVENTS) {
      this.addEventListener(event, this._boundResetAutoHideTimer);
    }
  }

  /** @internal Remove interaction listeners. */
  private _removeAutoHideInteractionListeners(): void {
    for (const event of HelixPhiField._AUTO_HIDE_INTERACTION_EVENTS) {
      this.removeEventListener(event, this._boundResetAutoHideTimer);
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
    // Cancel any pending scheduled clear. When `_clearClipboard` is invoked
    // from the setTimeout callback the timer has already fired and this is a
    // no-op; when invoked from the visibilitychange pre-emption path it stops
    // the scheduled timer from firing again and dispatching a duplicate
    // clipboard-clear audit event.
    this._cancelClipboardTimer();
    // Also cancel the auto-hide timer and remove its interaction listeners.
    // `_clearClipboard` force-masks the field below, so any scheduled auto-hide
    // is now moot. Without this call the setTimeout stays pending and the
    // `mouseenter / mousemove / focusin / keydown / pointerdown` listeners
    // stay attached to the host; when the auto-hide timer later fires,
    // `_autoHide()` early-returns on `this._masked` WITHOUT removing the
    // listeners, leaking them until the next scheduleAutoHide/cancelAutoHideTimer
    // path runs. `_cancelAutoHideTimer` already closes both — one call suffices.
    this._cancelAutoHideTimer();
    this._masked = true;

    // `navigator.clipboard.writeText` requires transient user activation in
    // Chrome and Safari. The clipboard-clear timer fires async (activation
    // expired) and the visibilitychange pre-emption path has no activation
    // at all — both can reject silently. Dispatching an unconditional
    // clipboard-clear audit event in that case would be MISLEADING: the
    // audit trail would claim PHI was cleared while it in fact remains on
    // the clipboard. Instead we observe the writeText outcome and dispatch
    // `clipboard-clear` only on confirmed success, or `clipboard-clear-failed`
    // when the API is unavailable or the promise rejects. This gives
    // HIPAA audit consumers an accurate signal and lets them escalate
    // failures (prompt the user, flag the session, etc).
    const dispatchOutcome = (succeeded: boolean): void => {
      this.dispatchEvent(
        new CustomEvent<PhiAccessEventDetail>('hx-phi-access', {
          bubbles: true,
          composed: true,
          detail: {
            fieldId: this.fieldId || this.id || '',
            action: succeeded ? 'clipboard-clear' : 'clipboard-clear-failed',
            timestamp: new Date().toISOString(),
            fieldType: this.fieldType,
          },
        }),
      );
    };

    if (typeof navigator === 'undefined') {
      dispatchOutcome(false);
      return;
    }

    // Every remaining clipboard interaction — including the `navigator.clipboard`
    // read itself — runs inside this try. The Clipboard API's property descriptor
    // is UA-defined, so `navigator.clipboard` can legally be an accessor that
    // throws synchronously. Same for `clipboard.writeText`. Pulling the read
    // inside the try ensures any sync throw resolves to `clipboard-clear-failed`
    // instead of an uncaught error that would silently drop the HIPAA audit event.
    //
    // `navigator.clipboard` is captured exactly once and the same reference is
    // used for both the method read and the call's receiver. A shim that exposes
    // `navigator.clipboard` as a getter returning a fresh object per read (rare
    // but legal) would otherwise let us grab `writeText` from object A and invoke
    // it against object B — brand/instance checks inside a real polyfill would
    // then fail and the call would reject spuriously.
    //
    // Promise.resolve() on a non-thenable still resolves, so the then() path
    // normalizes the return value shape for us.
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard) {
        dispatchOutcome(false);
        return;
      }
      const writeText = clipboard.writeText;
      if (typeof writeText !== 'function') {
        dispatchOutcome(false);
        return;
      }
      void Promise.resolve(writeText.call(clipboard, '')).then(
        () => dispatchOutcome(true),
        () => dispatchOutcome(false),
      );
    } catch {
      dispatchOutcome(false);
    }
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
      // Revealing: start clipboard clear timer and auto-hide timer
      this._masked = false;
      this._scheduleClipboardClear();
      this._scheduleAutoHide();
    } else {
      // Hiding: cancel the auto-hide countdown (purpose already served — the
      // field is hidden). Do NOT cancel the clipboard-clear timer — the user
      // may have copied PHI while the field was revealed, and cancelling here
      // would strand it on the clipboard if the tab later backgrounds. The
      // timer fires naturally at `clipboardTimeout`, and the visibilitychange
      // handler will pre-empt it if the tab hides sooner.
      this._cancelAutoHideTimer();
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
    return html`<hx-icon
      class="phi-field__glyph"
      library="helix"
      name="eye"
      aria-hidden="true"
    ></hx-icon>`;
  }

  /** @internal */
  private _renderEyeOffIcon(): TemplateResult {
    return html`<hx-icon
      class="phi-field__glyph"
      library="helix"
      name="eye-off"
      aria-hidden="true"
    ></hx-icon>`;
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
  /**
   * The action that triggered the audit event.
   *
   * - `clipboard-clear`: `navigator.clipboard.writeText('')` resolved successfully
   *   — the clipboard has been confirmed cleared.
   * - `clipboard-clear-failed`: the clipboard API was unavailable OR `writeText('')`
   *   rejected (most commonly because the browser required transient user
   *   activation that the timer or visibilitychange pre-emption path did not
   *   provide). The clipboard MAY still contain PHI. HIPAA audit consumers
   *   should treat this as an actionable event — prompt the user to manually
   *   clear their clipboard, flag the session, or escalate per policy.
   */
  action: 'reveal' | 'hide' | 'auto-hide' | 'clipboard-clear' | 'clipboard-clear-failed';
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
