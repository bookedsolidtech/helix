import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixFieldStyles } from './hx-field.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

/** Native form control tag names that can receive ARIA attributes. */
const FORM_CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

const _nextFieldId = createIdCounter('hx-field');

/** Returns true if the element is a native form control or a custom element. */
function isFormControl(el: Element): el is HTMLElement {
  return FORM_CONTROL_TAGS.has(el.tagName) || el.tagName.includes('-');
}

/**
 * Layout wrapper providing consistent label + input + help text + validation
 * message structure for any form control. Use this when wrapping non-HELiX
 * form controls or native HTML elements in the HELiX form field pattern.
 *
 * This component is NOT form-associated — it is a pure visual layout wrapper.
 *
 * **Light DOM side effect:** This component injects a visually-hidden `<span>`
 * into its light DOM children for ARIA describedby linkage across the shadow
 * DOM boundary. This span has `id="${fieldId}-desc"` and is removed on
 * `disconnectedCallback`. This is an intentional, documented accessibility
 * mechanism.
 *
 * **`aria-label` ownership model:** When `label` is set and no shadow `<label>`
 * is rendered, hx-field writes `aria-label` to the slotted control and stamps
 * a `data-hx-owns-label="true"` ownership marker.
 *
 * Consumers have two ways to keep their value safe from hx-field's writes:
 *   (a) **Suspend** all ARIA bridging by setting `data-aria-managed` on the
 *       control. While present, hx-field skips every aria-* mutation and
 *       captures a snapshot of `aria-label` at the moment suspend begins.
 *       When `data-aria-managed` is removed, hx-field compares the live
 *       `aria-label` to that snapshot: if they still match it resumes
 *       bridging normally; if the consumer mutated `aria-label` during the
 *       suspend window (changed value, removed the attribute) hx-field
 *       treats it as a permanent takeover and stops mirroring `label`
 *       to the control.
 *   (b) **Release** ownership permanently by overwriting `aria-label` to a
 *       different value than the one hx-field last wrote. The mismatch
 *       triggers `_releaseHostOwnedAriaLabel`, which strips the marker and
 *       clears the snapshot, transferring ownership to the consumer.
 *
 * **Limitation:** because release detection is snapshot-based, a consumer
 * rewrite to the *exact same value* hx-field last wrote is invisible. To
 * genuinely take ownership in that case the consumer must write a different
 * value (even briefly), or remove the `data-hx-owns-label` marker themselves.
 *
 * @summary Layout wrapper for label, control, help text, and error message.
 *
 * @tag hx-field
 *
 * @slot - The form control element (native or custom).
 * @slot label - Custom label content (overrides the label property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 * @slot description - Additional descriptive content above the control.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart control - The wrapper around slotted content.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 * @csspart required-indicator - The required asterisk span.
 *
 * @cssprop [--hx-field-label-color=var(--hx-color-neutral-700)] - Label color.
 * @cssprop [--hx-field-error-color=var(--hx-color-error-500)] - Error color.
 * @cssprop [--hx-field-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-field-gap=var(--hx-space-1, 0.25rem)] - Gap between field segments.
 * @cssprop [--hx-field-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 */
@customElement('hx-field')
export class HelixField extends HelixElement {
  static override styles = [helixFieldStyles];

  // ─── Properties ───

  /**
   * The visible label text for the field.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the field is required. Shows a required indicator on the label.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the control for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Visual disabled state applied via opacity. Does not affect slotted control
   * interactivity — set disabled on the slotted control directly.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Size variant controlling label and help text font sizes.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Layout variant. 'column' stacks label above control; 'inline' places them side-by-side.
   * @attr layout
   */
  @property({ type: String, reflect: true })
  layout: 'column' | 'inline' = 'column';

  // ─── Slot Tracking ───

  /**
   * Tracks whether any content is assigned to the label slot, used to conditionally render the label property.
   * @internal
   */
  @state() private _hasLabelSlot = false;

  /**
   * Tracks whether any content is assigned to the error slot, used to toggle error state rendering.
   * @internal
   */
  @state() private _hasErrorSlot = false;

  /**
   * Tracks whether any content is assigned to the help-text slot, used to toggle help text rendering.
   * @internal
   */
  @state() private _hasHelpSlot = false;

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedElements().length > 0;
  }

  // ─── Unique IDs for Accessibility ───

  /**
   * Unique ID for this field instance, used as a base for all derived accessibility IDs.
   * @internal
   */
  private _fieldId = _nextFieldId();

  /**
   * ID for the help text element, allowing aria-describedby to reference it.
   * @internal
   */
  private _helpTextId = `${this._fieldId}-help`;

  /**
   * ID for the error message element, allowing aria-describedby to reference it.
   * @internal
   */
  private _errorId = `${this._fieldId}-error`;

  /**
   * ID for the light-DOM description span injected for cross-shadow-root aria-describedby linkage.
   * @internal
   */
  private _a11yDescId = `${this._fieldId}-desc`;

  // ─── A11y: Slotted control tracking + light-DOM description element ───

  /**
   * The first form control in the default slot. We set aria attributes on this
   * element to bridge the shadow DOM accessibility boundary.
   * @internal
   */
  private _slottedControl: HTMLElement | null = null;

  /**
   * A visually-hidden span injected into the host's light DOM (assigned to the
   * default slot). Because it lives in the same document as the slotted input,
   * `aria-describedby` can reference its ID without cross-shadow-root IDREF
   * limitations.
   *
   * **Documented side effect:** This element is intentionally injected into the
   * component's light DOM children. It is invisible to users but present in the
   * accessibility tree. It is removed in `disconnectedCallback`. Consumers
   * should not remove or modify this span (identifiable by its `id` ending in
   * `-desc`).
   * @internal
   */
  private _a11yDescEl: HTMLElement | null = null;

  /**
   * Marker attribute placed on the slotted control whenever hx-field writes
   * `aria-label` to it. Presence of this marker indicates host ownership of
   * the attribute; absence means the value belongs to the consumer.
   *
   * Ownership is recomputed from the live DOM on every `_syncSlottedControl()`
   * call rather than cached in a flag — this keeps post-mount mutations
   * (consumer adds/removes `aria-label`, toggles `data-aria-managed`)
   * authoritative instead of letting a stale snapshot win.
   *
   * See round-13 F2 for context on the precedence hazard.
   * @internal
   */
  private static readonly _ARIA_LABEL_OWNED_ATTR = 'data-hx-owns-label';

  /**
   * Last `aria-label` value written by hx-field to the currently adopted
   * control. Used in combination with the ownership marker to detect a
   * consumer overwrite: if the marker is present but the live value no
   * longer matches what we last wrote, the consumer has taken over and we
   * release the marker so subsequent syncs treat the value as consumer-
   * owned.
   * @internal
   */
  private _lastWrittenAriaLabel: string | null = null;

  /**
   * Tracks whether `data-aria-managed` was observed on the slotted control
   * during the previous sync. Combined with `_ariaLabelSnapshotAtSuspend`
   * this lets us detect a suspend → modify → resume sequence: when a
   * consumer adds `data-aria-managed`, mutates `aria-label`, then removes
   * `data-aria-managed`, the resume branch must NOT re-stamp `this.label`
   * because the mutation during the suspend window represents consumer
   * takeover.
   * @internal
   */
  private _lastSeenAriaManaged = false;

  /**
   * The `aria-label` value present on the slotted control at the moment
   * `data-aria-managed` was first observed (the suspend snapshot). When
   * suspend ends, we compare the live value to this snapshot — if the
   * consumer changed it during the suspend window we treat the change as a
   * permanent takeover and skip re-stamping `this.label`.
   * @internal
   */
  private _ariaLabelSnapshotAtSuspend: string | null = null;

  /**
   * Set on the resume edge when the consumer either removed `aria-label`
   * outright OR cleared its value during a suspend window (i.e. the live
   * value diverged from the snapshot AND no new attribute is present after
   * resume). The host treats this as a permanent "owned-by-absence"
   * takeover and refuses to re-stamp `this.label` on subsequent syncs
   * until the latch is reset. The latch is reset on adoption change, on
   * `aria-label` returning to the DOM (whether by host or consumer write),
   * or on disconnect.
   *
   * Codex round-17 F2 introduced a runtime MutationObserver on the slotted
   * control. That observer flushes the resume edge in its own microtask,
   * separate from any subsequent host-prop update — so the in-call local
   * `consumerTookOverDuringSuspend` flag would no longer survive long
   * enough to suppress a re-stamp on the next host sync. This persistent
   * latch is what carries that suppression forward. The latch is held on
   * the field rather than on the control because it represents host
   * intent ("we have surrendered ownership"), not control state.
   * @internal
   */
  private _consumerOwnsByAbsence = false;

  /**
   * Tracks whether the dev-time competing-label warning has already been
   * emitted for the currently adopted slotted control.
   *
   * Latch semantics: this fires **once per adopted control**. The latch is
   * only reset on adoption (`_resolveSlottedControl()`) or disconnection.
   * Toggling `data-aria-managed` on/off on the same control after the
   * warning has fired does NOT re-arm the latch — by design, to avoid
   * console spam from consumers who toggle the attribute repeatedly.
   * @internal
   */
  private _competingLabelWarned = false;

  /**
   * MutationObserver watching the currently adopted slotted control for
   * runtime changes to `data-aria-managed` and `aria-label`.
   *
   * Codex round-17 F2: `_syncSlottedControl()` was previously only invoked
   * from slot/host property updates. If a consumer added or removed
   * `data-aria-managed` on an already-mounted control AT RUNTIME (without
   * changing any hx-field property) the field kept the old bridged
   * `aria-required` / `aria-invalid` / `aria-describedby` state until some
   * unrelated render flushed it. The advertised suspend/resume API was
   * therefore non-reactive. This observer makes it reactive: any mutation
   * to either attribute schedules a resync.
   *
   * Lifecycle: created in `_installSlottedControlObserver()` whenever a
   * control is bound, disconnected in `_resolveSlottedControl()` (when the
   * control changes) and `disconnectedCallback()`. Reentry-safe: at the
   * end of every `_syncSlottedControl()` call we drain pending mutation
   * records via `observer.takeRecords()` so the host's own writes in this
   * cycle do not bounce back through the callback. Consumer mutations made
   * after the cycle flushes still flow through normally.
   * @internal
   */
  private _slottedControlObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._ensureA11yDescEl();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._a11yDescEl?.remove();
    this._a11yDescEl = null;
    // Tear down the runtime control observer first so any aria-* mutations
    // we make during teardown below don't bounce back through the callback.
    this._slottedControlObserver?.disconnect();
    this._slottedControlObserver = null;
    // Remove aria attributes we set on the slotted control. We only remove
    // `aria-label` if hx-field owns it (marker present) — otherwise the
    // value belongs to the consumer and removing would clobber their input.
    if (this._slottedControl) {
      this._releaseHostOwnedAriaLabelOnTeardown(this._slottedControl);
      this._slottedControl.removeAttribute('aria-required');
      this._slottedControl.removeAttribute('aria-invalid');
      this._slottedControl.removeAttribute('aria-describedby');
      this._slottedControl = null;
    }
    this._competingLabelWarned = false;
    this._lastSeenAriaManaged = false;
    this._ariaLabelSnapshotAtSuspend = null;
    this._consumerOwnsByAbsence = false;
  }

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);

    // P2-01: Warn on invalid size values
    if (changedProps.has('size')) {
      const validSizes = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.size)) {
        devWarn(
          'hx-field',
          `Invalid hx-size value: "${this.size}". Expected "sm" | "md" | "lg". Defaulting to "md".`,
        );
      }
    }

    this._syncA11yDescEl();
    this._syncSlottedControl();
  }

  /** Creates a visually-hidden span in light DOM used as the ARIA description anchor. */
  /** @internal */
  private _ensureA11yDescEl(): void {
    if (this._a11yDescEl) return;
    // Guard for SSR — document is unavailable server-side
    if (typeof document === 'undefined') return;
    const span = document.createElement('span');
    span.id = this._a11yDescId;
    // Visually hidden but present in the accessibility tree
    span.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    this.appendChild(span);
    this._a11yDescEl = span;
  }

  /** Keeps the light-DOM description span in sync with the current error/help text. */
  /** @internal */
  private _syncA11yDescEl(): void {
    if (!this._a11yDescEl) return;
    const hasError = !!this.error || this._hasErrorSlot;
    if (hasError && this.error) {
      this._a11yDescEl.textContent = this.error;
    } else if (this.helpText) {
      this._a11yDescEl.textContent = this.helpText;
    } else {
      this._a11yDescEl.textContent = '';
    }
  }

  /** Tracks the first form control assigned to the default slot. */
  /** @internal */
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements();
    const next = assigned.find(isFormControl) ?? null;
    this._resolveSlottedControl(next);
  }

  /**
   * Adopts a new slotted control and re-syncs ARIA wiring.
   *
   * Ownership of `aria-label` is tracked via the
   * `data-hx-owns-label` marker attribute on the control itself, recomputed
   * on every `_syncSlottedControl()` call — there is no cached ownership
   * flag, so post-mount mutations of `aria-label` and `data-aria-managed`
   * by the consumer are always honored.
   * @internal
   */
  private _resolveSlottedControl(next: HTMLElement | null): void {
    const prev = this._slottedControl;
    if (prev === next) return;

    // Tear down the runtime observer for the previous control before we
    // mutate any attributes — otherwise our own teardown writes would
    // bounce back through the callback as if a consumer made them.
    this._slottedControlObserver?.disconnect();
    this._slottedControlObserver = null;

    // If we are leaving a previous control, strip the aria attributes we own
    // so the host doesn't leave stale wiring on a control that is no longer
    // associated. We use the teardown variant so a stale `data-hx-owns-label`
    // marker is always cleaned up — even if the consumer added
    // `data-aria-managed` between when we wrote the label and now (round-14
    // F2: marker tracks WHO wrote, suspend is about CURRENT bridging; the
    // two are orthogonal at teardown).
    if (prev) {
      this._releaseHostOwnedAriaLabelOnTeardown(prev);
      prev.removeAttribute('aria-required');
      prev.removeAttribute('aria-invalid');
      prev.removeAttribute('aria-describedby');
    }

    this._slottedControl = next;
    // Reset the once-per-adoption warning latch so the warning can fire
    // again for the freshly adopted control.
    this._competingLabelWarned = false;
    // Drop the value snapshot from any previous adoption.
    this._lastWrittenAriaLabel = null;
    // Drop the suspend-window tracking — fresh control, fresh state.
    this._lastSeenAriaManaged = false;
    this._ariaLabelSnapshotAtSuspend = null;
    // Drop the absence-takeover latch — it tracks consumer intent for the
    // PREVIOUS control, not this fresh adoption.
    this._consumerOwnsByAbsence = false;

    // Install the runtime observer on the new control so post-mount
    // mutations of `data-aria-managed` and `aria-label` reactively trigger
    // a resync (codex round-17 F2). The observer is wired BEFORE the
    // initial sync so subsequent consumer mutations are picked up; the
    // initial sync itself is filtered by the callback's reentry guard.
    if (next) {
      this._installSlottedControlObserver(next);
    }

    this._syncSlottedControl();
  }

  /**
   * Wires a `MutationObserver` on the slotted control that reacts to
   * runtime changes to `data-aria-managed` and `aria-label`. See the field
   * doc on `_slottedControlObserver` for context.
   *
   * Reentry safety: `_syncSlottedControl()` mutates the control's aria-*
   * attributes itself, which would normally trigger the observer in a loop.
   * We avoid that by filtering on the attribute name (`aria-required`,
   * `aria-invalid`, `aria-describedby`, and the ownership marker are not
   * in the watched set, so they never bounce) AND by calling
   * `observer.takeRecords()` at the tail of every sync cycle to drop the
   * `aria-label` mutation our own write produced.
   * @internal
   */
  private _installSlottedControlObserver(control: Element): void {
    this._slottedControlObserver?.disconnect();
    if (typeof MutationObserver === 'undefined') return;
    this._slottedControlObserver = new MutationObserver(() => {
      // The control may have been replaced between mutation queue and
      // microtask flush. Defend against syncing a stale control by checking
      // identity against the current binding.
      if (this._slottedControl !== control) return;
      this._syncSlottedControl();
    });
    this._slottedControlObserver.observe(control, {
      attributes: true,
      attributeFilter: ['data-aria-managed', 'aria-label'],
    });
  }

  /**
   * Returns true if hx-field owns the `aria-label` on the given control —
   * i.e. the host wrote it, the marker attribute is still present, AND the
   * live value still matches the value the host last wrote.
   *
   * Side effect: when the marker is present but the value no longer matches
   * `_lastWrittenAriaLabel`, the consumer has overwritten the host value
   * directly. We release the marker (and reset the snapshot) so subsequent
   * syncs treat the value as consumer-owned. This keeps the marker honest
   * without a MutationObserver.
   *
   * Cross-host migration / pre-mounted marker: if the marker is present but
   * `_lastWrittenAriaLabel === null`, this host has never written to the
   * control. Either (a) the control was migrated from a prior hx-field that
   * stamped the marker, or (b) a consumer pre-mounted the marker themselves.
   * In both cases this host has no ownership claim, so we strip the orphan
   * marker and treat the value as consumer-owned. Without this, a fresh host
   * with `label=""` would silently strip the inherited aria-label.
   *
   * Note (snapshot limitation): if the consumer rewrites `aria-label` to the
   * exact same value we last wrote, we cannot detect the overwrite — to
   * genuinely take ownership in that case the consumer must either write a
   * different value or remove the `data-hx-owns-label` marker themselves.
   *
   * Absence of the marker (or presence of `data-aria-managed`) means the
   * consumer owns the value and hx-field must not touch it.
   * @internal
   */
  private _hostOwnsAriaLabel(control: HTMLElement): boolean {
    if (control.hasAttribute('data-aria-managed')) return false;
    if (!control.hasAttribute(HelixField._ARIA_LABEL_OWNED_ATTR)) return false;
    if (this._lastWrittenAriaLabel === null) {
      // Orphan marker — either migrated from a prior host or pre-mounted by
      // the consumer. This host has no claim; release and defer to consumer.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      return false;
    }
    const liveValue = control.getAttribute('aria-label');
    if (liveValue !== this._lastWrittenAriaLabel) {
      // Consumer rewrote the attribute under us — they are the owner now.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      this._lastWrittenAriaLabel = null;
      return false;
    }
    return true;
  }

  /**
   * Removes the host-owned `aria-label` and its ownership marker if (and only
   * if) hx-field still owns them. Consumer-set values are left untouched.
   *
   * **Active-bridging semantics.** This helper honors `data-aria-managed` —
   * if the consumer is currently suspending bridging we leave everything
   * alone. Use this from inside `_syncSlottedControl()` where active
   * bridging is the contract. For control-detachment cleanup (slot
   * replacement, disconnect) call `_releaseHostOwnedAriaLabelOnTeardown()`
   * instead, which always cleans up a stale ownership marker.
   * @internal
   */
  private _releaseHostOwnedAriaLabel(control: HTMLElement): void {
    if (this._hostOwnsAriaLabel(control)) {
      control.removeAttribute('aria-label');
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      this._lastWrittenAriaLabel = null;
    }
  }

  /**
   * Teardown variant of `_releaseHostOwnedAriaLabel`. Always cleans up a
   * stale `data-hx-owns-label` marker (and the value it points at) when the
   * control is leaving this hx-field — slot replacement or
   * `disconnectedCallback`. Unlike the active-bridging variant this DOES
   * NOT honor `data-aria-managed`: the marker tracks WHO wrote the label,
   * suspend tracks CURRENT bridging behavior, and the two are orthogonal at
   * teardown.
   *
   * Behavior:
   *   - No marker → nothing to clean up.
   *   - Marker present, snapshot null (orphan from a prior host or
   *     pre-mounted by a consumer) → strip marker only.
   *   - Marker present, value still equals the snapshot we last wrote →
   *     strip both `aria-label` and the marker.
   *   - Marker present, value differs from the snapshot (consumer changed
   *     it during a suspend window or via direct overwrite) → strip marker
   *     only and leave the consumer's value in place.
   * @internal
   */
  private _releaseHostOwnedAriaLabelOnTeardown(control: HTMLElement): void {
    if (!control.hasAttribute(HelixField._ARIA_LABEL_OWNED_ATTR)) return;

    if (this._lastWrittenAriaLabel === null) {
      // Orphan marker — we never wrote, so we cannot claim ownership of
      // whatever value (if any) is in `aria-label`. Strip the marker only.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
      return;
    }

    const liveValue = control.getAttribute('aria-label');
    if (liveValue === this._lastWrittenAriaLabel) {
      // Still our value — clean up both.
      control.removeAttribute('aria-label');
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
    } else {
      // Consumer overwrote (possibly during a suspend window). Strip the
      // stale marker so the control doesn't carry our metadata away, but
      // leave the consumer's value untouched.
      control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
    }
    this._lastWrittenAriaLabel = null;
  }

  /**
   * Focuses the slotted form control when the shadow DOM label is clicked.
   * The shadow `<label>` cannot use `for`/`id` to link to a slotted input
   * across the shadow boundary, so we handle focus programmatically.
   */
  /** @internal */
  private _handleLabelClick(_e: Event): void {
    this._slottedControl?.focus();
  }

  /**
   * Applies ARIA attributes to the slotted form control, bridging the
   * shadow DOM accessibility boundary.
   *
   * - aria-label: associates the field label with the control
   * - aria-required: communicates required state to AT
   * - aria-invalid: communicates error state to AT
   * - aria-describedby: points to the light-DOM description span
   *
   * **Skip conditions:**
   * - `HX-*` elements manage their own ARIA attributes; bridging is skipped.
   * - Elements with `data-aria-managed` attribute opt out of ARIA mutation;
   *   bridging is skipped entirely for those elements.
   *
   * **Round-13 F2 ownership model:** `aria-label` ownership is recomputed
   * from the live DOM on every call. If the marker attribute
   * `data-hx-owns-label` is present, hx-field owns the value and may
   * overwrite or remove it. Otherwise the consumer owns it, and hx-field
   * leaves it alone. This makes post-mount consumer mutations
   * (add/remove/replace) authoritative without relying on a stale flag.
   */
  /** @internal */
  private _syncSlottedControl(): void {
    const control = this._slottedControl;
    if (!control) return;

    // hx-* elements manage their own ARIA attributes; skip bridging for them
    if (control.tagName.startsWith('HX-')) return;

    this._syncSlottedControlInner(control);

    // Drop any MutationRecord queued by our own attribute writes above
    // (round-17 F2). The runtime observer is wired to `aria-label`, which
    // we may have just set/removed; without `takeRecords()` the next
    // microtask would re-deliver our own writes back into the callback,
    // triggering a redundant resync (and, for same-value rewrites, an
    // unbounded loop). Consumer mutations made AFTER this call still
    // arrive normally because they generate their own records post-flush.
    this._slottedControlObserver?.takeRecords();
  }

  /** @internal */
  private _syncSlottedControlInner(control: HTMLElement): void {
    // ── Suspend-window tracking (round-14 F1) ──────────────────────────
    // `data-aria-managed` opts the control out of ARIA mutation. We need
    // to know two things across the suspend window so the resume branch
    // can decide whether to re-stamp `this.label`:
    //   1. Was suspend active on the previous sync? (`_lastSeenAriaManaged`)
    //   2. What was `aria-label` when the suspend started? (the snapshot.)
    // If the consumer mutates `aria-label` while suspended (clears it,
    // changes it, removes the attribute) we treat that as a permanent
    // takeover and skip the re-stamp on resume.
    const ariaManaged = control.hasAttribute('data-aria-managed');
    if (ariaManaged) {
      // Capture the snapshot the first time we observe suspend. While
      // suspended we MUST NOT touch any aria-* attribute or the marker —
      // that's the contract.
      if (!this._lastSeenAriaManaged) {
        this._ariaLabelSnapshotAtSuspend = control.getAttribute('aria-label');
        this._lastSeenAriaManaged = true;
      }
      return;
    }

    // We are not suspended. If the previous sync was suspended, we are on
    // the resume edge — check whether the consumer mutated `aria-label`
    // during the suspend window. If yes, treat the change as permanent
    // takeover: strip our ownership marker (we are no longer the owner)
    // and skip re-stamping `this.label` for this cycle. When the consumer
    // *removed* the attribute (or cleared it), set the persistent
    // `_consumerOwnsByAbsence` latch so future syncs won't re-stamp either
    // — see the field doc for why this latch is necessary alongside the
    // in-call local flag (round-17 F2).
    let consumerTookOverDuringSuspend = false;
    if (this._lastSeenAriaManaged) {
      const liveValue = control.getAttribute('aria-label');
      if (liveValue !== this._ariaLabelSnapshotAtSuspend) {
        consumerTookOverDuringSuspend = true;
        // Release any stale ownership marker — the value isn't ours
        // anymore (or the attribute is gone entirely).
        if (control.hasAttribute(HelixField._ARIA_LABEL_OWNED_ATTR)) {
          control.removeAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
        }
        this._lastWrittenAriaLabel = null;
        // If the consumer's takeover left no `aria-label` on the control,
        // latch the absence so subsequent host syncs don't re-stamp.
        if (!control.hasAttribute('aria-label')) {
          this._consumerOwnsByAbsence = true;
        }
      }
      this._lastSeenAriaManaged = false;
      this._ariaLabelSnapshotAtSuspend = null;
    }

    const hasError = !!this.error || this._hasErrorSlot;
    const hasDesc = !!(this.error || this.helpText || this._hasErrorSlot || this._hasHelpSlot);

    // Label association: aria-label bridges the shadow DOM boundary.
    //
    // Round-13 F2: ownership is decided by the marker on the control, not a
    // cached flag. A consumer-owned value is always left intact.
    //
    // Round-14 F1 (no-suspend-observed variant): if the consumer toggled
    // `data-aria-managed` on and off without giving us a chance to sync
    // (or modified `aria-label` directly without the suspend dance), the
    // ownership-marker mismatch check inside `_hostOwnsAriaLabel` releases
    // ownership. In that case the consumer's intent is clear (they
    // changed our value) and we must respect it as a takeover even if
    // they cleared the attribute entirely. We capture the pre-call state
    // so we can detect that release-from-mismatch case and avoid
    // re-stamping below.
    const hadOwnershipMarker = control.hasAttribute(HelixField._ARIA_LABEL_OWNED_ATTR);
    const hadSnapshot = this._lastWrittenAriaLabel !== null;
    const hostOwnsLabel = this._hostOwnsAriaLabel(control);
    const ownershipReleasedByMismatch = hadOwnershipMarker && hadSnapshot && !hostOwnsLabel;
    if (ownershipReleasedByMismatch) {
      consumerTookOverDuringSuspend = true;
    }
    const consumerHasLabel = control.hasAttribute('aria-label') && !hostOwnsLabel;

    // If the consumer set `aria-label` again on the control (after a
    // prior absence-takeover), the latch is no longer accurate — they
    // own a real value now, which the consumer-precedence branch handles.
    // Clear the latch so a future host write (e.g. consumer eventually
    // removes their own value) can resume normally.
    if (this._consumerOwnsByAbsence && consumerHasLabel) {
      this._consumerOwnsByAbsence = false;
    }

    if (consumerHasLabel) {
      // Consumer owns the value — never touch it.
      if (this.label && !this._hasLabelSlot && !this._competingLabelWarned) {
        // Dev-only: warn once per adoption that the consumer's aria-label
        // takes precedence over the visible `label` prop. Production builds
        // drop this call entirely via the `import.meta.env.DEV` gate inside
        // `devWarn`. The latch (`_competingLabelWarned`) is reset on every
        // adoption in `_resolveSlottedControl()`.
        devWarn(
          'hx-field',
          'Slotted control already has `aria-label`. The consumer override is being respected; the visible `label` prop will not be mirrored to the control. Remove one of the two to silence this warning.',
        );
        this._competingLabelWarned = true;
      }
    } else if (consumerTookOverDuringSuspend || this._consumerOwnsByAbsence) {
      // The consumer mutated `aria-label` while bridging was suspended.
      // Per the documented "resume only if the snapshot still matches"
      // contract we honor that change and do NOT re-stamp `this.label`.
      // The consumer's value (or its absence) stays as they left it. The
      // `_consumerOwnsByAbsence` latch carries this suppression forward
      // across syncs that didn't see the resume edge themselves
      // (round-17 F2: the runtime observer flushes resume in its own
      // microtask, separate from any host-prop update that follows).
    } else if (this.label && !this._hasLabelSlot) {
      // Host writes the label and stamps the ownership marker so a future
      // sync can tell its own value apart from a consumer override.
      control.setAttribute('aria-label', this.label);
      control.setAttribute(HelixField._ARIA_LABEL_OWNED_ATTR, 'true');
      this._lastWrittenAriaLabel = this.label;
    } else {
      // No host-supplied label and no consumer label — clean up any prior
      // host-owned value. (If the consumer set one in the meantime, the
      // `consumerHasLabel` branch above handles it.)
      this._releaseHostOwnedAriaLabel(control);
    }

    // Required state
    if (this.required) {
      control.setAttribute('aria-required', 'true');
    } else {
      control.removeAttribute('aria-required');
    }

    // Invalid state
    if (hasError) {
      control.setAttribute('aria-invalid', 'true');
    } else {
      control.removeAttribute('aria-invalid');
    }

    // Description (error or help text) via light-DOM span
    if (hasDesc) {
      control.setAttribute('aria-describedby', this._a11yDescId);
    } else {
      control.removeAttribute('aria-describedby');
    }
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--size-sm': this.size === 'sm',
      'field--size-md': this.size === 'md',
      'field--size-lg': this.size === 'lg',
      'field--layout-inline': this.layout === 'inline',
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label && !this._hasLabelSlot
              ? html`
                  <label part="label" class="field__label" @click=${this._handleLabelClick}>
                    ${this.label}
                    ${this.required
                      ? html`<span
                          part="required-indicator"
                          class="field__required-marker"
                          aria-hidden="true"
                          >*</span
                        >`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <!-- Description -->
        <slot name="description"></slot>

        <!-- Control (default slot) -->
        <div part="control" class="field__control">
          <slot @slotchange=${this._handleDefaultSlotChange}></slot>
        </div>

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div part="error" class="field__error" id=${this._errorId} role="alert">
                  ${this.error}
                </div>
              `
            : nothing}
        </slot>

        <!-- Slotted error live region — ensures slotted error content is announced -->
        <div aria-live="assertive" class="field__error-slot-announcer"></div>

        <!-- Help text (always in DOM so slot detection works; hidden when no help or error is shown) -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-field': HelixField;
  }
}
