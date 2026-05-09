import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { devWarn } from '../../utils/dev-warn.js';
import { helixToastStyles } from './hx-toast.styles.js';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

// (group-6) WCAG 2.2.3 minimum display times by variant. When `duration > 0`
// and shorter than the role-implied minimum, a devWarn fires recommending the
// caller either lengthen `duration` or set `duration=0` for persistent
// toasts. AT cannot reliably finish reading a danger announcement in less
// than ~6 seconds; success/info polite announcements need at least ~3s.
const MIN_DISPLAY_MS_BY_VARIANT: Record<ToastVariant, number> = {
  default: 3000,
  info: 3000,
  success: 3000,
  warning: 4000,
  danger: 6000,
};

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
 * @cssprop [--hx-toast-bg=var(--hx-color-surface-inverse)] - Toast background color.
 * @cssprop [--hx-toast-color=var(--hx-color-text-inverse)] - Toast text color.
 * @cssprop [--hx-toast-border-radius=var(--hx-border-radius-md)] - Toast border radius.
 * @cssprop [--hx-toast-shadow] - Toast box shadow.
 * @cssprop [--hx-toast-width=20rem] - Toast width.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-surface-inverse] - Default-variant background semantic (neutral-900 anchor; flipped per mode).
 * @cssprop [--hx-color-text-inverse] - Default-variant foreground semantic (neutral-0 anchor; flipped per mode).
 * @cssprop [--hx-toast-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-shadow-md] - Box shadow.
 * @cssprop [--hx-toast-enter-translate=var(--hx-space-2)] - CSS custom property.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-transition-normal] - Transition timing.
 * @cssprop [--hx-color-surface-success-strong] - Success-variant background semantic (3.2.1 cascade).
 * @cssprop [--hx-color-surface-warning-strong] - Warning-variant background semantic (3.2.1 cascade).
 * @cssprop [--hx-color-surface-danger-strong] - Danger-variant background semantic (3.2.1 cascade).
 * @cssprop [--hx-color-surface-info-strong] - Info-variant background semantic (3.2.1 cascade).
 * @cssprop [--hx-color-text-on-success-strong] - Success-variant foreground semantic (neutral-0 across modes).
 * @cssprop [--hx-color-text-on-warning] - Warning-variant foreground semantic (neutral-900; warning sits on lighter -500 fill).
 * @cssprop [--hx-color-text-on-error-strong] - Danger-variant foreground semantic (neutral-0 across modes).
 * @cssprop [--hx-color-text-on-primary-strong] - Info-variant foreground semantic (neutral-0 across modes).
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-opacity-75] - Opacity.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-toast/AAA-AUDIT.md
 * @keyboard-contract dismiss=Escape
 * @aria-pattern alert
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-toast
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-toast')
export class HelixToast extends HelixElement {
  // 3.2.1: forced-colors deference is owned by the bespoke @media block in
  // hx-toast.styles.ts (per-class overrides on .toast and .toast__close —
  // strictly more than the shared mixin's :host/[part] surface contract).
  // XOR rule per styles/forced-colors.ts: do NOT also compose
  // forcedColorsSurface — overlapping selectors inside the same media query
  // create a fragile specificity war.
  static override styles = [helixToastStyles];

  // ─── Public Properties ───

  /**
   * Visual style variant.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';

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
   * @attr label-close
   */
  @property({ attribute: 'label-close' })
  labelClose = 'Dismiss notification';

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

  override connectedCallback(): void {
    super.connectedCallback();
    // (group-6) Host-canonical role + aria-atomic via ElementInternals.
    // role implies aria-live per ARIA spec (alert→assertive, status→polite),
    // so we do NOT also set explicit aria-live (avoids §5.1 double-announce
    // on older NVDA/JAWS).
    //
    // (group-6 codex round-1) Dual-write: keep an attribute fallback for
    // `role` on the host, harmonized with hx-alert/hx-banner. Some AT +
    // browser combos still ignore internals-backed ARIA reflection on
    // custom elements (notably older JAWS + Chrome and certain
    // VoiceOver+Safari builds); without an attribute they would stop
    // announcing toasts entirely. role implies aria-live, so we do NOT
    // also write an explicit aria-live attribute (the implicit live region
    // is what `role` already provides — adding aria-live duplicates the
    // signal and re-introduces the §5.1 double-announce on those same
    // older AT+browser combos).
    this._internals.role = this._role;
    this._internals.ariaAtomic = 'true';
    this.setAttribute('role', this._role);
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('variant')) {
      // Keep host role in sync with variant (alert vs status).
      // Dual-write: internals (modern) + attribute (legacy fallback).
      this._internals.role = this._role;
      this.setAttribute('role', this._role);
    }
    if (changedProperties.has('open') || changedProperties.has('duration')) {
      this._auditWcag223();
    }
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

  /**
   * (group-6 §5.3) WCAG 2.2.3 (Level AA — No Time Limits) audit. When
   * `duration` is shorter than the role-implied minimum-display-time for the
   * current variant, surface a developer warning recommending a longer
   * duration or `duration=0` for persistent toasts. Danger toasts in
   * particular are safety-critical and routinely need more than 5 seconds
   * for screen readers to finish reading.
   *
   * Fires only in DEV builds (Vite tree-shakes the call in production).
   *
   * @internal
   */
  private _auditWcag223(): void {
    if (this.duration <= 0) return;
    const min = MIN_DISPLAY_MS_BY_VARIANT[this.variant] ?? 0;
    if (this.duration < min) {
      devWarn(
        'hx-toast',
        `duration=${this.duration}ms is shorter than the WCAG 2.2.3 minimum (${min}ms) for variant="${this.variant}". Increase duration or set duration=0 for persistent toasts (recommended for variant="danger").`,
      );
    }
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

  /**
   * @internal
   * Variant→role mapping (harmonized with hx-alert/hx-banner per group-6):
   * only `danger` is assertive (role=alert); all other variants are polite
   * (role=status). role implies aria-live, so we do NOT also expose an
   * `_ariaLive` getter — that path was removed when the inner div stopped
   * carrying explicit aria-live (§5.1 double-announce mitigation).
   */
  private get _role(): 'alert' | 'status' {
    return this.variant === 'danger' ? 'alert' : 'status';
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
  //
  // (group-6) Host-canonical live region: role + aria-atomic live on the
  // host via ElementInternals (set in connectedCallback). The inner base
  // div is a presentation-only wrapper — it does NOT carry role, aria-live,
  // or aria-atomic. role implies aria-live per ARIA spec, so the host has
  // NO explicit aria-live attribute either (avoids §5.1 double-announce on
  // older NVDA/JAWS that read both role and aria-live as separate live
  // regions).

  override render() {
    const severityLabel = this._severityLabel;

    return html`
      <div
        part="base"
        class=${classMap({
          toast: true,
          [`toast--${this.variant}`]: true,
        })}
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
                      aria-label=${this.labelClose}
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
