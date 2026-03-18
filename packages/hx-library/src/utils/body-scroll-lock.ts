/**
 * Shared body-scroll-lock utility for overlay components (hx-dialog, hx-drawer).
 *
 * Problem: Multiple overlays each calling `document.body.style.overflow = 'hidden'`
 * and then restoring it independently creates a race condition. When two overlays are
 * open simultaneously, the first one to close sets `overflow = ''`, immediately
 * re-enabling scroll even though the second overlay is still open.
 *
 * Solution: A module-level reference-counted stack. The counter tracks how many
 * overlays are currently requesting scroll lock. Body overflow is set to 'hidden'
 * only when the counter transitions from 0 → 1 (first locker). It is restored
 * only when the counter transitions from 1 → 0 (last locker releases). All
 * intermediate increments / decrements are no-ops against the DOM.
 *
 * The previous `overflow` value is captured once on first lock and restored exactly
 * once on final unlock, preserving any pre-existing overflow setting on the host page.
 */

/** Number of active overlay components holding a body-scroll lock. */
let _lockCount = 0;

/** The overflow value captured before the first lock was applied. */
let _savedOverflow = '';

/**
 * Increment the scroll-lock counter. Sets `document.body.style.overflow = 'hidden'`
 * only on the 0 → 1 transition (i.e., the first overlay to request a lock).
 */
export function lockBodyScroll(): void {
  if (_lockCount === 0) {
    _savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  _lockCount += 1;
}

/**
 * Decrement the scroll-lock counter. Restores `document.body.style.overflow` to its
 * pre-lock value only on the 1 → 0 transition (i.e., the last overlay releasing its lock).
 *
 * Safe to call even if no lock is currently held — the counter will not go below zero.
 */
export function unlockBodyScroll(): void {
  if (_lockCount <= 0) return;
  _lockCount -= 1;
  if (_lockCount === 0) {
    document.body.style.overflow = _savedOverflow;
    _savedOverflow = '';
  }
}

/**
 * Returns the current number of active scroll locks. Primarily useful for testing.
 */
export function getBodyScrollLockCount(): number {
  return _lockCount;
}
