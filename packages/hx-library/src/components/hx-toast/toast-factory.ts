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
