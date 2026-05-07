import { HelixToast } from './hx-toast.js';
import { HelixToastStack } from './hx-toast-stack.js';
import type { ToastVariant } from './hx-toast.js';
import type { ToastStackPlacement } from './hx-toast-stack.js';

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
 * (group-6 §5.5) Minimum on-screen lifetime for any toast created via the
 * factory, regardless of `stackLimit`-driven displacement. Prevents
 * AT-clipping when rapid-fire `toast()` calls (e.g. during a Drupal
 * BigPipe re-attach burst) would otherwise hide a toast before NVDA/JAWS
 * finished reading it.
 */
const MIN_DISPLAY_MS = 1500;

/** @internal Tracks `show()` timestamps so the factory can defer displacement. */
const _shownAt = new WeakMap<HelixToast, number>();

/**
 * @internal
 * Tracks toasts that already have a deferred-hide scheduled so successive
 * `toast()` calls within the same MIN_DISPLAY_MS window do NOT pile multiple
 * timers on the same target while leaving newer overflow toasts untouched.
 *
 * (group-6 §5.5 burst-fix) Without this guard, a 5-call burst against a
 * limit-3 stack would schedule three hides on the SAME oldest toast (calls
 * 4, 5, and any subsequent within the window), and the stack would settle
 * at 4 visible toasts after the deferred hide fired — violating
 * `stackLimit`. The set + per-toast guard ensures each successive oldest
 * is hidden exactly once.
 */
const _pendingDisplacements = new WeakSet<HelixToast>();

/**
 * @internal
 * Per-stack count of toasts that have been created via `toast()` but whose
 * append-and-show is queued behind a deferred-hide (codex p2 stack-limit
 * fix). These toasts already "own" a future visible slot, so a subsequent
 * burst call must count them when deciding whether further displacement is
 * needed — otherwise the stack briefly exceeds `stackLimit`.
 */
const _pendingAppends = new WeakMap<HelixToastStack, number>();

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
  if (typeof document === 'undefined') throw new Error('toast() requires a browser environment');
  const placement = options.placement ?? 'bottom-end';

  // Find or create a dedicated stack for this placement
  const stackSelector = `hx-toast-stack[placement="${placement}"]`;
  let stack = document.querySelector<HelixToastStack>(stackSelector);
  if (!stack) {
    stack = document.createElement('hx-toast-stack');
    stack.placement = placement;
    // Intentional design decision: the toast stack is appended to document.body rather
    // than inserted near the caller. This is required so that the fixed-position overlay
    // is not clipped by an ancestor with `overflow: hidden`, `transform`, or `filter`
    // (all of which create a new stacking context and break fixed positioning).
    // Drupal compatibility note: Drupal's BigPipe / AJAX behaviors can re-attach the
    // document body without removing these stacks. The selector check above
    // (`document.querySelector`) ensures only one stack per placement is ever created,
    // preventing duplicates on re-attach cycles.
    document.body.appendChild(stack);
  }

  // Enforce stack limit: hide oldest open toasts if at capacity.
  // (group-6 §5.5) Minimum display time prevents AT-clipping under rapid-fire
  // bursts. If a toast has not yet been on screen for MIN_DISPLAY_MS, defer
  // its hide until the remainder elapses; otherwise hide immediately.
  //
  // Burst-fix (round-1): previously this branch only inspected the single
  // oldest toast, so calls 4..N within the same MIN_DISPLAY_MS window all
  // scheduled hides on the same target. We now walk every overflow slot and
  // use `_pendingDisplacements` to guarantee each successive oldest is
  // hidden exactly once.
  //
  // Stack-limit fix (codex p2): even with deferred hides scheduled, the
  // *new* toast was appended immediately — meaning a 4-call burst against
  // a limit-3 stack briefly showed 4 toasts on screen for up to
  // MIN_DISPLAY_MS, breaking the "maximum simultaneously visible" contract.
  // We now compute the longest deferred-hide remainder across the chosen
  // overflow targets and defer this new toast's append by that amount, so
  // the count never exceeds `stackLimit` while still honoring MIN_DISPLAY_MS.
  let deferAppendMs = 0;
  if (stack.stackLimit > 0) {
    const openToasts = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter((t) => t.open);
    // Treat anything already queued for displacement as already-hiding so we
    // pick the next surviving oldest. Since the new toast is appended after
    // this block, we must overshoot by 1 to cover it. We also count toasts
    // that are already queued behind a deferred append on this same stack —
    // they "own" a visible slot when their timer fires, so the displacement
    // math must reserve room for them too.
    const survivors = openToasts.filter((t) => !_pendingDisplacements.has(t));
    const queuedAppends = _pendingAppends.get(stack) ?? 0;
    const overflow = survivors.length + queuedAppends + 1 - stack.stackLimit;
    for (let i = 0; i < overflow; i++) {
      const target = survivors[i];
      if (!target) break;
      const shownAt = _shownAt.get(target);
      const elapsed = shownAt === undefined ? Number.POSITIVE_INFINITY : Date.now() - shownAt;
      if (elapsed >= MIN_DISPLAY_MS) {
        target.hide();
      } else {
        const remaining = MIN_DISPLAY_MS - elapsed;
        _pendingDisplacements.add(target);
        setTimeout(() => {
          _pendingDisplacements.delete(target);
          // Guard: only hide if still open (consumer may have hidden it manually)
          if (target.open) target.hide();
        }, remaining);
        // Track the longest remaining window so we can hold the new toast's
        // append until at least one slot has actually freed up.
        if (remaining > deferAppendMs) deferAppendMs = remaining;
      }
    }
  }

  // Create toast element. We attach the auto-remove `hx-after-hide` listener
  // ONLY after the first `show()` has fired, otherwise the toast's initial
  // mount with the default `open=false` causes its `updated()` to dispatch a
  // spurious `hx-hide` → `hx-after-hide` chain that would self-remove the
  // queued toast before its slot ever opens.
  const toastEl = document.createElement('hx-toast');
  toastEl.variant = options.variant ?? 'default';
  toastEl.duration = options.duration ?? 3000;
  toastEl.closable = true;
  toastEl.textContent = options.message;

  /** Wires the lifecycle hide listener — called once, the first time `show()` fires. */
  const wireAutoRemove = (): void => {
    toastEl.addEventListener('hx-after-hide', () => {
      _shownAt.delete(toastEl);
      _pendingDisplacements.delete(toastEl);
      toastEl.remove();
    });
  };

  if (deferAppendMs > 0) {
    // Suppress the spurious initial `hx-hide` / `hx-after-hide` events that
    // hx-toast's `updated()` dispatches when an element mounts with the
    // default `open=false`. Consumers should only see hide events for
    // toasts that actually showed; for a QUEUED toast the first real hide
    // is its own auto-dismiss or the displaced-hide later. The listeners
    // are `{ once: true }` so they fire exactly once on the spurious mount
    // events and never interfere with subsequent legitimate hides.
    const swallowInitial = (e: Event): void => {
      e.stopImmediatePropagation();
      e.stopPropagation();
    };
    toastEl.addEventListener('hx-hide', swallowInitial, { once: true });
    toastEl.addEventListener('hx-after-hide', swallowInitial, { once: true });
  }

  // Append the toast to the stack synchronously so the host element is
  // connected and consumers awaiting `t.updateComplete` after `toast()`
  // resolve immediately. For the immediate-show path the very next line
  // calls `show()` so the toast renders open on its first Lit update; for
  // the deferred path the toast renders with `open=false` (queued) and
  // flips open when the slot frees up.
  stack.appendChild(toastEl);
  if (deferAppendMs > 0) {
    // Defer `show()` (which flips `open=true` and starts the auto-dismiss
    // timer) by exactly the longest deferred-hide window so the new toast
    // becomes visible as the displaced one disappears — preserving both
    // `stackLimit` (max visible) and MIN_DISPLAY_MS (min lifetime). Until
    // then the toast is in the DOM but `open=false`, so the visible count
    // never exceeds `stackLimit`.
    //
    // Track the queued show on the target stack so subsequent burst calls
    // count it when computing overflow against `stackLimit`.
    const targetStack = stack;
    _pendingAppends.set(targetStack, (_pendingAppends.get(targetStack) ?? 0) + 1);
    setTimeout(() => {
      const remaining = (_pendingAppends.get(targetStack) ?? 1) - 1;
      if (remaining > 0) {
        _pendingAppends.set(targetStack, remaining);
      } else {
        _pendingAppends.delete(targetStack);
      }
      // Guard: the consumer may have removed the toast before its slot
      // opened (e.g. test cleanup). Only show if still connected.
      if (toastEl.isConnected) {
        wireAutoRemove();
        toastEl.show();
        _shownAt.set(toastEl, Date.now());
      }
    }, deferAppendMs);
  } else {
    wireAutoRemove();
    toastEl.show();
    _shownAt.set(toastEl, Date.now());
  }

  return toastEl;
}
