import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixToastStyles } from './hx-toast.styles.js';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * A transient notification message that auto-dismisses after a configurable duration.
 * Supports multiple visual variants, a closable button, icon/action slots, and full
 * ARIA live region semantics for screen readers.
 *
 * @summary Transient notification toast component.
 *
 * @tag hx-toast
 *
 * @slot - Default slot for the notification message.
 * @slot icon - Optional icon rendered before the message.
 * @slot action - Optional action button rendered after the message.
 *
 * @fires {CustomEvent} hx-show - Dispatched when the toast becomes visible.
 * @fires {CustomEvent} hx-hide - Dispatched when the toast begins hiding.
 * @fires {CustomEvent} hx-after-hide - Dispatched after the hide animation completes.
 *
 * @csspart base - The inner toast container div.
 * @csspart icon - The icon slot wrapper.
 * @csspart message - The message slot wrapper.
 * @csspart close-button - The dismiss button (only when closable).
 * @csspart action - The action slot wrapper.
 *
 * @cssprop [--hx-toast-bg=var(--hx-color-neutral-900)] - Toast background color.
 * @cssprop [--hx-toast-color=var(--hx-color-neutral-0)] - Toast text color.
 * @cssprop [--hx-toast-border-radius=var(--hx-border-radius-md)] - Toast border radius.
 * @cssprop [--hx-toast-shadow] - Toast box shadow.
 * @cssprop [--hx-toast-width=20rem] - Toast width.
 */
@customElement('hx-toast')
export class HelixToast extends LitElement {
  static override styles = [tokenStyles, helixToastStyles];

  // ─── Public Properties ───

  /**
   * Visual style variant.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: ToastVariant = 'default';

  /**
   * Auto-dismiss duration in milliseconds. Set to 0 for persistent toasts.
   * @attr duration
   */
  @property({ type: Number })
  duration = 3000;

  /**
   * Whether to show a close button.
   * @attr closable
   */
  @property({ type: Boolean, reflect: true })
  closable = false;

  /**
   * Whether the toast is currently visible.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Accessible label for the close button. Override for localization.
   * @attr close-label
   */
  @property({ attribute: 'close-label' })
  closeLabel = 'Dismiss notification';

  // ─── Private State ───

  /** @internal */
  private _timer: ReturnType<typeof setTimeout> | null = null;

  // ─── Reduced Motion ───

  /** @internal Returns true when the user has opted into reduced motion. */
  private get _reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** @internal */
  private _timerStartedAt: number | null = null;

  /** @internal */
  private _timerRemaining: number | null = null;

  // ─── Lifecycle ───

  override updated(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.removeAttribute('aria-hidden');
        this._emitShow();
        if (this.duration > 0 && !this._reducedMotion) {
          this._startTimer();
        }
      } else {
        this.setAttribute('aria-hidden', 'true');
        this._clearTimer();
        this._emitHide();
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimer();
  }

  // ─── Public API ───

  /** Show the toast. */
  show(): void {
    if (!this.open) {
      this.open = true;
    }
  }

  /** Hide the toast. */
  hide(): void {
    if (this.open) {
      this.open = false;
    }
  }

  // ─── Private Helpers ───

  /** @internal */
  private _startTimer(remaining?: number): void {
    this._clearTimerHandle();
    const delay = remaining ?? this.duration;
    this._timerStartedAt = Date.now();
    this._timerRemaining = delay;
    this._timer = setTimeout(() => {
      this.open = false;
    }, delay);
  }

  /** @internal */
  private _pauseTimer(): void {
    if (this._timer === null || this._timerStartedAt === null || this._timerRemaining === null) {
      return;
    }
    const elapsed = Date.now() - this._timerStartedAt;
    this._timerRemaining = Math.max(0, this._timerRemaining - elapsed);
    this._clearTimerHandle();
  }

  /** @internal */
  private _clearTimerHandle(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /** @internal */
  private _clearTimer(): void {
    this._clearTimerHandle();
    this._timerStartedAt = null;
    this._timerRemaining = null;
  }

  /** @internal */
  private _emitShow(): void {
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _emitHide(): void {
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));

    let fired = false;
    const fireAfterHide = () => {
      if (fired) return;
      fired = true;
      this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));
    };

    // Fire on transitionend if available; fallback ensures it fires in test environments
    // and when transitions are disabled (prefers-reduced-motion, no CSS transitions).
    const base = this.shadowRoot?.querySelector('.toast');
    if (base) {
      base.addEventListener('transitionend', fireAfterHide, { once: true });
    }
    // Fallback fires after the CSS transition duration (250ms) plus a small buffer.
    setTimeout(fireAfterHide, 300);
  }

  // ─── Event Handlers ───

  /** @internal */
  private _handleMouseEnter(): void {
    this._pauseTimer();
  }

  /** @internal */
  private _handleMouseLeave(): void {
    if (this.open && this.duration > 0) {
      this._startTimer(this._timerRemaining ?? undefined);
    }
  }

  /** @internal */
  private _handleFocusIn(): void {
    this._pauseTimer();
  }

  /** @internal */
  private _handleFocusOut(): void {
    if (this.open && this.duration > 0) {
      this._startTimer(this._timerRemaining ?? undefined);
    }
  }

  /** @internal */
  private _handleClose(): void {
    this.hide();
  }

  // ─── ARIA Helpers ───

  /** @internal */
  private get _role(): 'alert' | 'status' {
    return this.variant === 'danger' ? 'alert' : 'status';
  }

  /** @internal */
  private get _ariaLive(): 'assertive' | 'polite' {
    return this.variant === 'danger' ? 'assertive' : 'polite';
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="base"
        class=${classMap({
          toast: true,
          [`toast--${this.variant}`]: true,
        })}
        role=${this._role}
        aria-live=${this._ariaLive}
        aria-atomic="true"
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._handleMouseLeave}
        @focusin=${this._handleFocusIn}
        @focusout=${this._handleFocusOut}
      >
        <span part="icon" class="toast__icon">
          <slot name="icon"></slot>
        </span>
        <span part="message" class="toast__message">
          <slot></slot>
        </span>
        <span part="action" class="toast__action">
          <slot name="action"></slot>
        </span>
        ${this.closable
          ? html`
              <button
                part="close-button"
                class="toast__close"
                aria-label=${this.closeLabel}
                @click=${this._handleClose}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

// ─── Declarative Global Types ───

declare global {
  interface HTMLElementTagNameMap {
    'hx-toast': HelixToast;
  }
}
