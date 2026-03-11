import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixToastStyles, helixToastStackStyles } from './hx-toast.styles.js';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type ToastStackPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

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
        if (this.duration > 0) {
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
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

/**
 * A fixed-position container that stacks `hx-toast` elements at the specified
 * corner of the viewport. Enforces a maximum visible toast count via `stack-limit`.
 *
 * @summary Toast stack container managing position and count limits.
 *
 * @tag hx-toast-stack
 *
 * @slot - Accepts `hx-toast` elements.
 *
 * @csspart base - The inner stack container div.
 *
 * @cssprop [--hx-z-index-toast=9000] - Z-index for the fixed stack.
 */
@customElement('hx-toast-stack')
export class HelixToastStack extends LitElement {
  static override styles = [tokenStyles, helixToastStackStyles];

  /**
   * Corner of the viewport where toasts appear.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: ToastStackPlacement = 'bottom-end';

  /**
   * Maximum number of simultaneously visible toasts. 0 = unlimited.
   * @attr stack-limit
   */
  @property({ type: Number, attribute: 'stack-limit' })
  stackLimit = 3;

  override render() {
    return html`
      <div
        part="base"
        class=${classMap({
          'toast-stack': true,
          [`toast-stack--${this.placement}`]: true,
        })}
      >
        <slot></slot>
      </div>
    `;
  }
}

// ─── Declarative Global Types ───

declare global {
  interface HTMLElementTagNameMap {
    'hx-toast': HelixToast;
    'hx-toast-stack': HelixToastStack;
  }
}

// ─── Imperative toast() Utility ───

export interface ToastOptions {
  /** The notification message text. */
  message: string;
  /** Visual variant. Defaults to 'default'. */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms. 0 = persistent. Defaults to 3000. */
  duration?: number;
  /** Placement of the shared stack. Defaults to 'bottom-end'. */
  placement?: ToastStackPlacement;
}

/**
 * Imperatively create and display a toast notification.
 *
 * Creates a shared `hx-toast-stack` on `document.body` if one does not exist,
 * then appends a new `hx-toast` with the given options. Respects the stack's
 * `stackLimit` by hiding the oldest visible toast when the limit is exceeded.
 *
 * @example
 * import { toast } from '@helixui/library/components/hx-toast/index.js';
 * toast({ message: 'Patient record saved.', variant: 'success' });
 */
export function toast(options: ToastOptions): HelixToast {
  const placement = options.placement ?? 'bottom-end';

  // Find or create a dedicated stack for this placement
  const stackSelector = `hx-toast-stack[placement="${placement}"]`;
  let stack = document.querySelector<HelixToastStack>(stackSelector);
  if (!stack) {
    stack = document.createElement('hx-toast-stack') as HelixToastStack;
    stack.placement = placement;
    document.body.appendChild(stack);
  }

  // Enforce stack limit: hide oldest open toast if at capacity
  if (stack.stackLimit > 0) {
    const openToasts = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter((t) => t.open);
    if (openToasts.length >= stack.stackLimit) {
      openToasts[0]?.hide();
    }
  }

  // Create toast element
  const toastEl = document.createElement('hx-toast') as HelixToast;
  toastEl.variant = options.variant ?? 'default';
  toastEl.duration = options.duration ?? 3000;
  toastEl.closable = true;
  toastEl.textContent = options.message;

  // Remove from DOM after hiding
  toastEl.addEventListener('hx-after-hide', () => {
    toastEl.remove();
  });

  stack.appendChild(toastEl);
  toastEl.show();

  return toastEl;
}
