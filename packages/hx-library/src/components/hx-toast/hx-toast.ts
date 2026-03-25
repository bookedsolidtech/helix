import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
  duration = 5000;

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
  @query('.toast') private _toastEl!: HTMLElement | null;

  /** @internal Tracks whether the action slot has slotted content. */
  @state() private _hasActionContent = false;

  /** @internal */
  private _timer: ReturnType<typeof setTimeout> | null = null;

  // ─── Reduced Motion ───

  /** @internal Returns true when the user has opted into reduced motion. */
  private get _reducedMotion(): boolean {
    // Guard for SSR — window.matchMedia is unavailable server-side
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** @internal */
  private _timerStartedAt: number | null = null;

  /** @internal */
  private _timerRemaining: number | null = null;

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      if (this.open) {
        this.removeAttribute('aria-hidden');
        this._emitShow();
        if (this.duration > 0 && !this._reducedMotion && !this._hasActionContent) {
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
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _emitHide(): void {
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));

    let fired = false;
    const fireAfterHide = () => {
      if (fired) return;
      fired = true;
      this.dispatchEvent(new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }));
    };

    // Fire on transitionend if available; fallback ensures it fires in test environments
    // and when transitions are disabled (prefers-reduced-motion, no CSS transitions).
    const base = this._toastEl;
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

  /** @internal */
  private _handleActionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasActionContent = slot.assignedNodes({ flatten: true }).length > 0;
    if (this._hasActionContent && this.open) {
      this._pauseTimer();
    }
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

  // ─── WCAG 1.4.1: Default Icons ───
  // Each semantic variant renders a default icon when no icon is slotted,
  // ensuring the severity is not conveyed by color alone.

  /** @internal */
  private _renderSuccessIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
      <path
        fill="currentColor"
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.03 6.28a.75.75 0 00-1.06-1.06L9 10.19 7.78 8.97a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.5-3.5z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderWarningIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
      <path
        fill="currentColor"
        d="M8.49 2.92a1.75 1.75 0 013.02 0l6.25 10.83A1.75 1.75 0 0116.25 16H3.75a1.75 1.75 0 01-1.51-2.25L8.49 2.92zM10 7a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderDangerIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
      <path
        fill="currentColor"
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1.72 5.22a.75.75 0 011.06 0L10 7.94l.66-.72a.75.75 0 111.06 1.06L11.06 9l.66.72a.75.75 0 11-1.06 1.06L10 10.06l-.66.72a.75.75 0 01-1.06-1.06L8.94 9l-.66-.72a.75.75 0 010-1.06z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderInfoIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
      <path
        fill="currentColor"
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.25 9a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V9z"
      />
    </svg>`;
  }

  /** @internal Returns the default icon for the current variant, or nothing for 'default'. */
  private get _defaultIcon() {
    switch (this.variant) {
      case 'success':
        return this._renderSuccessIcon();
      case 'warning':
        return this._renderWarningIcon();
      case 'danger':
        return this._renderDangerIcon();
      case 'info':
        return this._renderInfoIcon();
      default:
        return nothing;
    }
  }

  // ─── WCAG 1.4.1: Severity label map ───

  /** @internal */
  private static readonly _SEVERITY_LABELS: Partial<Record<ToastVariant, string>> = {
    success: 'Success',
    warning: 'Warning',
    danger: 'Error',
    info: 'Info',
  };

  /** @internal */
  private get _severityLabel(): string {
    return HelixToast._SEVERITY_LABELS[this.variant] ?? '';
  }

  // ─── Render ───

  override render() {
    const severityLabel = this._severityLabel;

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
        ${this.open
          ? html`
              ${severityLabel
                ? html`<span class="toast__severity-label">${severityLabel}: </span>`
                : nothing}
              <span part="icon" class="toast__icon">
                <slot name="icon">${this._defaultIcon}</slot>
              </span>
              <span part="message" class="toast__message">
                <slot></slot>
              </span>
              <span part="action" class="toast__action">
                <slot name="action" @slotchange=${this._handleActionSlotChange}></slot>
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
