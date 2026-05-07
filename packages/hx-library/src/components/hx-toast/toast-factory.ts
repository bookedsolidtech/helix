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

/**
 * @internal
 *
 * Single coherent state machine per deferred toast (codex p1 round-2 holistic).
 *
 * ```
 *   queued ── timer fires ──► showing ──► hiding ──► done
 *      │
 *      └── consumer hide() / DOM detach ──► cancelled ──► removed (terminal)
 * ```
 *
 * Every state transition flows through ONE of two helpers:
 *
 *  - `promoteDeferredToShowing` — natural progression when the queued timer
 *    fires. Pops the append-deadline, decrements `_pendingAppends`, clears
 *    the inline `display: none` artifact, calls `show()`.
 *  - `cancelDeferredToast` — terminal cancellation, whether triggered by a
 *    consumer `.hide()` call inside the defer window OR by detecting a DOM
 *    detach inside the timer callback. Pops the append-deadline, decrements
 *    `_pendingAppends`, cancels the queued `setTimeout`, detaches the toast
 *    element from the DOM, clears the inline `display: none` artifact, and
 *    marks the deferred record as `cancelled` so the timer callback (if it
 *    still fires) is a no-op.
 *
 * Concentrating cleanup in these two helpers prevents the per-call leaks
 * that produced rounds 4–8 of codex findings (`_pendingAppends` drift,
 * `_pendingAppendDeadlines` zombie entries, DOM-resident `display: none`
 * elements, double-show on cancelled toasts).
 */
type DeferredStatus = 'queued' | 'showing' | 'cancelled';

/**
 * @internal
 * Captures a single displacement that THIS queued toast owns — the hide
 * timer it scheduled to free its slot. Recorded only for the survivor
 * branch (where we created the timer); the longer-burst fallback path
 * shares a previously-scheduled hide and stores `null` here.
 *
 * On cancellation we unwind the displacement: clearTimeout the hide
 * timer, drop the target from `_pendingDisplacements`, and pop its
 * `_pendingHideDeadlines` entry. Without this, decrementing the
 * pending-append count alone leaves the survivor pool under-counted —
 * the next `toast()` call sees fewer survivors than really exist and
 * skips the deferred-show path, briefly exceeding `stackLimit`.
 */
interface DisplacementClaim {
  target: HelixToast;
  fireAt: number;
  timerId: ReturnType<typeof setTimeout>;
}

interface DeferredRecord {
  /** Current state in the lifecycle. */
  status: DeferredStatus;
  /** Owning stack — needed for queue accounting. */
  stack: HelixToastStack;
  /** Date.now()+deferAppendMs — used to pop the append-deadline timeline. */
  fireAt: number;
  /** Handle to the queued setTimeout so cancellation can clear it. */
  timerId: ReturnType<typeof setTimeout> | null;
  /**
   * Displacement THIS queued toast owns (survivor branch only). `null` for
   * the longer-burst fallback branch where this toast claimed an existing
   * hide-deadline scheduled by an earlier call.
   */
  displacement: DisplacementClaim | null;
  /**
   * (codex p2 round-10) MutationObserver scoped to the parent stack that
   * watches for THIS queued toast appearing in `removedNodes`. Without this,
   * a consumer running `toastEl.remove()` (or detaching the parent) inside
   * the defer window leaves the queued reservation in `_pendingAppends` and
   * the displacement claim live until the timer eventually fires —
   * displacement claim drift, follow-on `toast()` overshoots, the orphaned
   * displacement timer eventually hides a still-needed survivor.
   *
   * The observer fires synchronously after the removal microtask completes,
   * so cleanup runs before any follow-on `toast()` call observes a stale
   * `_pendingAppends` count. Disconnected by both `promoteDeferredToShowing`
   * (natural promotion path) and `cancelDeferredToast` (cancellation path)
   * so the observer never lingers past the queued window.
   */
  removalObserver: MutationObserver | null;
}

const _deferredRecords = new WeakMap<HelixToast, DeferredRecord>();

/** @internal Tracks `show()` timestamps so the factory can defer displacement. */
const _shownAt = new WeakMap<HelixToast, number>();

/**
 * @internal
 * Tracks toasts that already have a deferred-hide scheduled so successive
 * `toast()` calls within the same MIN_DISPLAY_MS window do NOT pile multiple
 * timers on the same target while leaving newer overflow toasts untouched.
 */
const _pendingDisplacements = new WeakSet<HelixToast>();

/**
 * @internal
 * Per-stack count of toasts that have been created via `toast()` but whose
 * append-and-show is queued behind a deferred-hide. These toasts already
 * "own" a future visible slot, so a subsequent burst call must count them
 * when deciding whether further displacement is needed — otherwise the
 * stack briefly exceeds `stackLimit`.
 *
 * Mutated only by `promoteDeferredToShowing` and `cancelDeferredToast` so
 * the count stays in lockstep with the deferred-record lifecycle.
 */
const _pendingAppends = new WeakMap<HelixToastStack, number>();

/**
 * @internal
 * Per-stack ordered list of `Date.now()`-style timestamps when previously
 * scheduled deferred-hide timers will fire, plus when previously queued
 * appends will become visible. Used by longer-burst calls that exhaust the
 * live survivor pool: when every existing survivor has already been picked
 * for displacement by an earlier burst call, the next call has no fresh
 * target to hide. The new toast must still be queued so the stack never
 * exceeds `stackLimit`; we queue it for the NEXT free slot.
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

/** @internal Decrement the per-stack pending-append count (or clear at zero). */
function decrementPendingAppends(stack: HelixToastStack): void {
  const remaining = (_pendingAppends.get(stack) ?? 1) - 1;
  if (remaining > 0) {
    _pendingAppends.set(stack, remaining);
  } else {
    _pendingAppends.delete(stack);
  }
}

/**
 * @internal
 * Cancels a deferred toast in any pre-`show()` state. Safe to call multiple
 * times on the same element — the deferred-record check makes subsequent
 * calls no-ops. Used by:
 *
 *  1. The consumer-facing `hide()` override installed during the defer window
 *     (covers `t.hide()` mid-window).
 *  2. The deferred `setTimeout` callback when it discovers a non-connected
 *     element (covers plain `t.remove()` / parent removal).
 */
function cancelDeferredToast(toastEl: HelixToast): void {
  const record = _deferredRecords.get(toastEl);
  if (!record || record.status !== 'queued') return;

  // Mark cancelled FIRST so re-entry (e.g. from inside the timer callback,
  // or the removal observer firing on the same tick we're already in) sees
  // the terminal state and bails.
  record.status = 'cancelled';

  // Disconnect the parent-removal observer FIRST so its callback cannot
  // re-enter `cancelDeferredToast` for the `toastEl.remove()` we're about
  // to perform below. The status flip above already guards re-entry, but
  // disconnecting also frees the observer's reference to the stack subtree
  // immediately — no point keeping it armed for an already-cancelled record.
  if (record.removalObserver !== null) {
    record.removalObserver.disconnect();
    record.removalObserver = null;
  }

  // Clear the queued setTimeout so it cannot fire. (When cancellation is
  // triggered FROM that timer callback, timerId is set but the engine has
  // already dequeued it — clearTimeout on a fired id is a documented no-op.)
  if (record.timerId !== null) {
    clearTimeout(record.timerId);
    record.timerId = null;
  }

  // Decrement the per-stack queue count so subsequent burst calls do not
  // think this slot is still reserved.
  decrementPendingAppends(record.stack);
  popDeadline(_pendingAppendDeadlines, record.stack, record.fireAt);

  // Unwind the displacement we owned, if any. Without this, the
  // survivor-pool filter (`!_pendingDisplacements.has(t)`) keeps treating
  // the displaced target as already-leaving — a follow-on `toast()` call
  // observes too few survivors, skips the deferred-show path, and shows
  // immediately. Result: stack briefly exceeds `stackLimit` until the
  // orphaned displacement timer eventually fires. The fallback branch
  // (longer-burst path) does not own a displacement (`displacement ===
  // null`); it claimed an existing hide-deadline scheduled by an earlier
  // call, so cancellation is just our own queue-bookkeeping.
  if (record.displacement) {
    const { target, fireAt, timerId } = record.displacement;
    clearTimeout(timerId);
    _pendingDisplacements.delete(target);
    popDeadline(_pendingHideDeadlines, record.stack, fireAt);
  }

  // Clear the inline `display: none` we set during the defer window so a
  // still-attached toast does not leave a zero-box artifact behind.
  toastEl.style.removeProperty('display');

  // Detach from DOM. A cancelled toast must not linger as a zombie element
  // (codex p2 round-2 finding) — the public API contract is that the
  // element is gone after `hide()` resolves, just like for shown toasts
  // post-`hx-after-hide`.
  toastEl.remove();

  // Drop the record entirely; the toast has reached its terminal state.
  _deferredRecords.delete(toastEl);
}

/**
 * @internal
 * Natural progression: the queued `setTimeout` fired and the slot is
 * available. Pop the append-deadline, decrement the queue count, clear the
 * inline `display: none`, and call `show()`.
 */
function promoteDeferredToShowing(toastEl: HelixToast, wireAutoRemove: () => void): void {
  const record = _deferredRecords.get(toastEl);
  if (!record || record.status !== 'queued') return;

  record.status = 'showing';
  record.timerId = null;
  // (codex p2 round-10) Disconnect the parent-removal observer — once the
  // toast promotes to `showing`, its lifecycle is governed by the standard
  // auto-dismiss / `hx-after-hide` path which already handles cleanup.
  // Leaving the observer armed would leak a long-lived MutationObserver
  // reference per shown toast.
  if (record.removalObserver !== null) {
    record.removalObserver.disconnect();
    record.removalObserver = null;
  }
  decrementPendingAppends(record.stack);
  popDeadline(_pendingAppendDeadlines, record.stack, record.fireAt);

  // Clearing display BEFORE show() ensures the toast is in layout flow on
  // the same frame visibility activates — avoids a one-frame
  // invisible-but-allocated layout window.
  toastEl.style.removeProperty('display');
  wireAutoRemove();
  toastEl.show();
  _shownAt.set(toastEl, Date.now());

  // Showing toasts no longer need the deferred record — their lifecycle is
  // now governed by the standard auto-dismiss / hx-after-hide path.
  _deferredRecords.delete(toastEl);
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
  let deferAppendMs = 0;
  // Displacements scheduled by THIS call's overflow loop (survivor branch
  // only). Captured per call so the deferred record below can take
  // ownership of them and unwind them on cancellation. Practically this
  // list has at most one entry — the round-1 fix keeps overflow at 1 per
  // call — but the array form is honest about the loop shape.
  const scheduledDisplacements: DisplacementClaim[] = [];
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
        const timerId = setTimeout(() => {
          _pendingDisplacements.delete(target);
          popDeadline(_pendingHideDeadlines, stackRef, fireAt);
          // Guard: only hide if still open (consumer may have hidden it manually)
          if (target.open) target.hide();
        }, remaining);
        claimedHideTimestamps.push(fireAt);
        // Record this displacement on a per-call list so the deferred
        // record (created later, after the toast element exists) can take
        // ownership of it for cancellation cleanup. Pre-existing deferred
        // records on OTHER toasts are unaffected; this list resets per
        // call.
        scheduledDisplacements.push({ target, fireAt, timerId });
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
    // is cleared inside the deferred `setTimeout` (or the cancellation
    // helper) so the natural `:host` display rule reasserts.
    toastEl.style.display = 'none';

    // Override `hide()` so a consumer call inside the defer window flows
    // through the canonical cancellation helper. After cancellation the
    // toast is no longer in the DOM (and its deferred record is gone), so
    // any subsequent `hide()` calls fall through to the original
    // implementation — which itself is a safe no-op on a detached toast.
    const originalHide = toastEl.hide.bind(toastEl);
    toastEl.hide = function deferredHide(this: HelixToast): void {
      const record = _deferredRecords.get(toastEl);
      if (record?.status === 'queued') {
        cancelDeferredToast(toastEl);
        return;
      }
      originalHide();
    };
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
    const targetStack = stack;
    const appendFireAt = Date.now() + deferAppendMs;
    _pendingAppends.set(targetStack, (_pendingAppends.get(targetStack) ?? 0) + 1);
    pushDeadline(_pendingAppendDeadlines, targetStack, appendFireAt);

    // Register the deferred record so `cancelDeferredToast` and
    // `promoteDeferredToShowing` can drive a single coherent state machine.
    // The timerId is filled in immediately below; the record is created
    // first so cancellation reaching the lookup before assignment still
    // sees a 'queued' status and works correctly.
    //
    // Take ownership of the displacement THIS call scheduled (survivor
    // branch). Practically `scheduledDisplacements` has at most one entry
    // per call — round-1 burst-fix keeps overflow at 1 — and the
    // longer-burst fallback path schedules nothing here, instead reusing
    // an existing hide-deadline. We pick the soonest entry (in case the
    // shape ever changes) and leave any others orphaned (they'd still
    // fire as plain hides; they aren't owned by THIS toast). The
    // fallback path stores `displacement: null` so cancellation only
    // unwinds our own queue bookkeeping.
    const ownedDisplacement = scheduledDisplacements.length > 0 ? scheduledDisplacements[0]! : null;
    const record: DeferredRecord = {
      status: 'queued',
      stack: targetStack,
      fireAt: appendFireAt,
      timerId: null,
      displacement: ownedDisplacement,
      removalObserver: null,
    };
    _deferredRecords.set(toastEl, record);

    // (codex p2 round-10) Watch for direct DOM removal during the defer
    // window. Without this, a consumer running `toastEl.remove()` (or
    // detaching the parent stack) skips the `hide()` override AND the
    // `setTimeout` does not run cleanup until the full `deferAppendMs`
    // window elapses. Result: `_pendingAppends` stays incremented, the
    // displacement claim hangs (the displaced survivor still hides on
    // schedule even though no replacement is coming), follow-on
    // `toast()` overshoots the stack limit, and a MutationObserver on
    // the stack subtree leaks until the orphaned timer eventually fires.
    //
    // The observer fires synchronously after the removal microtask, so
    // any follow-on `toast()` call observes the post-cleanup state.
    // Cancellation routes through the canonical helper, which is
    // idempotent (status check at the top) and disconnects this
    // observer first.
    const removalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed === toastEl) {
            cancelDeferredToast(toastEl);
            return;
          }
        }
      }
    });
    removalObserver.observe(targetStack, { childList: true });
    record.removalObserver = removalObserver;

    record.timerId = setTimeout(() => {
      // The setTimeout callback covers two paths:
      //
      //   1. Plain DOM removal. The consumer ran `toastEl.remove()` (or a
      //      parent was detached) without going through `hide()`, so the
      //      `hide()` override above never ran. Treat the missing
      //      connection as cancellation — the canonical helper already
      //      handles all bookkeeping idempotently.
      //
      //   2. Natural promotion. The defer window elapsed and the slot is
      //      free. Promote 'queued' → 'showing'.
      const currentRecord = _deferredRecords.get(toastEl);
      if (!currentRecord || currentRecord.status === 'cancelled') {
        // Already cancelled (consumer hide() during defer window). All
        // bookkeeping was performed in `cancelDeferredToast`; nothing to
        // do here.
        return;
      }
      if (!toastEl.isConnected) {
        cancelDeferredToast(toastEl);
        return;
      }
      promoteDeferredToShowing(toastEl, wireAutoRemove);
    }, deferAppendMs);
  } else {
    wireAutoRemove();
    toastEl.show();
    _shownAt.set(toastEl, Date.now());
  }

  return toastEl;
}
