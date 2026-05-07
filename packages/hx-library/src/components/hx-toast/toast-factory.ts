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
 * @internal
 * Per-stack ordered list of `Date.now()`-style timestamps when previously
 * scheduled deferred-hide timers will fire, plus when previously queued
 * appends will become visible. Used by longer-burst calls (codex p1 round-2)
 * that exhaust the live survivor pool: when every existing survivor has
 * already been picked for displacement by an earlier burst call, the next
 * call has no fresh target to hide. The new toast must still be queued so
 * the stack never exceeds `stackLimit`; we queue it for the NEXT free slot,
 * which is the soonest of the pending hide deadlines that hasn't already
 * been claimed by a queued append.
 *
 * Each scheduled hide opens one slot; each queued append claims one slot
 * when its timer fires. We track both as monotonically-increasing arrays
 * so the math is just "next deadline ≥ now". Entries are popped (shifted)
 * when their corresponding timer fires.
 */
const _pendingHideDeadlines = new WeakMap<HelixToastStack, number[]>();
const _pendingAppendDeadlines = new WeakMap<HelixToastStack, number[]>();

/** @internal */
function pushDeadline(map: WeakMap<HelixToastStack, number[]>, stack: HelixToastStack, ts: number) {
  const list = map.get(stack);
  if (list) {
    list.push(ts);
    list.sort((a, b) => a - b);
  } else {
    map.set(stack, [ts]);
  }
}

/** @internal */
function popDeadline(
  map: WeakMap<HelixToastStack, number[]>,
  stack: HelixToastStack,
  ts: number,
): void {
  const list = map.get(stack);
  if (!list) return;
  const idx = list.indexOf(ts);
  if (idx >= 0) list.splice(idx, 1);
  if (list.length === 0) map.delete(stack);
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

    // Track which slots we've already accounted for in this call. Each
    // displacement we schedule below frees one slot; each pending hide we
    // claim from the existing timeline also frees one slot. The new toast
    // claims the soonest free slot — its deferAppendMs is set to that
    // deadline's remaining time (0 if a slot frees immediately).
    const claimedHideTimestamps: number[] = [];

    for (let i = 0; i < overflow; i++) {
      const target = survivors[i];
      if (target) {
        const shownAt = _shownAt.get(target);
        const elapsed = shownAt === undefined ? Number.POSITIVE_INFINITY : Date.now() - shownAt;
        if (elapsed >= MIN_DISPLAY_MS) {
          target.hide();
          // Slot frees synchronously; deferAppendMs stays at 0 unless a
          // later iteration of this loop forces it higher.
          continue;
        }
        const remaining = MIN_DISPLAY_MS - elapsed;
        const fireAt = Date.now() + remaining;
        _pendingDisplacements.add(target);
        pushDeadline(_pendingHideDeadlines, stack, fireAt);
        const stackRef = stack;
        setTimeout(() => {
          _pendingDisplacements.delete(target);
          popDeadline(_pendingHideDeadlines, stackRef, fireAt);
          // Guard: only hide if still open (consumer may have hidden it manually)
          if (target.open) target.hide();
        }, remaining);
        claimedHideTimestamps.push(fireAt);
        if (remaining > deferAppendMs) deferAppendMs = remaining;
        continue;
      }

      // No live survivor available for this overflow slot: every visible
      // toast is already queued for displacement by an earlier burst call.
      // (codex p1 round-2: longer-burst gap.) Find the next free slot from
      // the existing pending-hide timeline that we have not already
      // claimed in this call or by an earlier queued append.
      const allHideDeadlines = _pendingHideDeadlines.get(stack) ?? [];
      const allAppendDeadlines = _pendingAppendDeadlines.get(stack) ?? [];
      // A pending append CONSUMES a hide-slot when it fires, so any append
      // deadline ≤ a hide deadline cancels that hide-slot from the pool of
      // free slots available to *this* new toast. We pair them in
      // chronological order: each append claims the next hide slot.
      const availableHideDeadlines = [...allHideDeadlines].sort((a, b) => a - b);
      const queuedAppendsPending = [...allAppendDeadlines].sort((a, b) => a - b);
      // Pair each queued append with the soonest hide it depends on.
      for (const appendAt of queuedAppendsPending) {
        for (let j = 0; j < availableHideDeadlines.length; j++) {
          if ((availableHideDeadlines[j] as number) <= appendAt) {
            availableHideDeadlines.splice(j, 1);
            break;
          }
        }
      }
      // Subtract slots claimed by THIS call's earlier loop iterations.
      for (const claimed of claimedHideTimestamps) {
        const idx = availableHideDeadlines.indexOf(claimed);
        if (idx >= 0) availableHideDeadlines.splice(idx, 1);
      }
      const nextFreeAt = availableHideDeadlines[0];
      if (nextFreeAt === undefined) {
        // Pathological case: stackLimit > 0 and overflow > 0 but no
        // displacement target AND no pending hide left to claim. This
        // should be unreachable because overflow accounts for survivors +
        // queued-appends + 1 ≤ stackLimit; if there are queued appends we
        // must have pending hides. Bail rather than silently bypass the
        // limit.
        break;
      }
      claimedHideTimestamps.push(nextFreeAt);
      const remaining = nextFreeAt - Date.now();
      if (remaining > deferAppendMs) deferAppendMs = Math.max(0, remaining);
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

    // (codex p2) Hide the queued toast from layout flow during the defer
    // window. Without this, the toast's `:host { display: block }` keeps
    // it in the document layout even with `open=false` — its outer wrapper
    // pushes earlier toasts out of position and may be announced by some
    // ATs on insertion. `display: none` removes it from layout AND the
    // accessibility tree until `show()` flips it visible. The inline style
    // is cleared inside the deferred `setTimeout` below so the natural
    // `:host` display rule reasserts immediately before `show()` fires.
    toastEl.style.display = 'none';
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
    // count it when computing overflow against `stackLimit`. We also
    // record this append's expected fire timestamp so the longer-burst
    // gap-fix above (codex p1 round-2) knows which hide-slots are already
    // claimed when it falls back to the pending-hide timeline.
    const targetStack = stack;
    const appendFireAt = Date.now() + deferAppendMs;
    _pendingAppends.set(targetStack, (_pendingAppends.get(targetStack) ?? 0) + 1);
    pushDeadline(_pendingAppendDeadlines, targetStack, appendFireAt);
    setTimeout(() => {
      const remaining = (_pendingAppends.get(targetStack) ?? 1) - 1;
      if (remaining > 0) {
        _pendingAppends.set(targetStack, remaining);
      } else {
        _pendingAppends.delete(targetStack);
      }
      popDeadline(_pendingAppendDeadlines, targetStack, appendFireAt);
      // Guard: the consumer may have removed the toast before its slot
      // opened (e.g. test cleanup). Only show if still connected.
      if (toastEl.isConnected) {
        // (codex p2) Clear the inline `display: none` applied above so
        // the natural `:host { display: block }` rule reasserts before
        // `show()` flips `open=true`. The order here matters — clearing
        // display BEFORE show() ensures the toast is in layout flow on
        // the same frame visibility activates, avoiding a one-frame
        // invisible-but-allocated layout window.
        toastEl.style.removeProperty('display');
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
