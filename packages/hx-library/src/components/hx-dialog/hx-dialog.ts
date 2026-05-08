import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/body-scroll-lock.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixDialogStyles } from './hx-dialog.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextDialogId = createIdCounter('hx-dialog');

// Module-level constant avoids rebuilding the selector string on every _getFocusableElements call.
// Pattern matches hx-drawer's FOCUSABLE_SELECTORS constant at module scope.
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

/**
 * A modal and non-modal dialog component built on the native HTML `<dialog>` element.
 * Provides focus trapping, backdrop interaction, keyboard navigation, and full
 * ARIA labelling for enterprise healthcare accessibility requirements.
 *
 * ## Architecture Note: Host-Canonical ARIA (group-4a round-1, Path A — native-dialog adaptation)
 *
 * Unlike `hx-drawer` (which uses an inner `<div role="dialog">` and can fully
 * host-canonicalize the role), `hx-dialog` is built on the native
 * `<dialog>` HTMLDialogElement. The native element has an **implicit
 * `role="dialog"`** baked in by the browser that **cannot be stripped**, so
 * full host-canonical role takeover would create nested-dialog announcements.
 *
 * **Path A (adopted):** the host owns label / description projection via
 * `ElementInternals` (`internals.ariaLabelledByElements`,
 * `internals.ariaDescribedByElements`, `internals.ariaLabel`) but **does NOT**
 * set `internals.role`. The native inner `<dialog>` continues to be the
 * announced surface. Consumer light-DOM IDREFs project across the shadow
 * boundary via `internals.aria*Elements` on the host.
 *
 * **Hybrid fallback (always-on belt-and-suspenders):** because some assistive
 * technologies may walk the native `<dialog>` first and ignore host
 * `internals.aria*Elements`, the resolved label / description text is **also**
 * serialized into `aria-label` / `aria-describedby` on the inner native
 * `<dialog>` element. Consumers therefore get name/description on every AT,
 * with the IDL-ref path providing live DOM-text-update tracking when the AT
 * honours it. This forfeits live-text tracking on the inner-dialog fallback
 * (the serialized text is recomputed on every sync, which is good enough since
 * mutation observers re-fire `_syncHostAriaSemantics` on consumer text edits).
 *
 * Why we do NOT set `internals.role = 'alertdialog'` either: setting role on
 * the host while the native `<dialog>` keeps `role="dialog"` would announce
 * BOTH a host alertdialog AND an inner dialog. Instead, the alertdialog
 * variant continues to write `role="alertdialog"` directly on the inner
 * `<dialog>` element (the platform allows overriding the implicit `dialog`
 * role with the more specific `alertdialog`).
 *
 * Naming precedence (W3C AccName 1.2 §4.3.1):
 *
 *   1. Consumer `aria-labelledby` on the host — IDREFs resolved across the
 *      shadow boundary via `resolveIdrefTokens` (closest scope first, then
 *      ancestor shadow hosts, then owner document).
 *   2. Consumer `aria-label` on the host.
 *   3. `<slot name="header">` text content (multi-node aggregation per
 *      AccName 1.2 §4.3.10 — decorative `aria-hidden` / `[hidden]` subtrees
 *      contribute zero to the name).
 *   4. `heading` property — explicit author-provided heading text.
 *   5. Hard-coded literal `"Dialog"` (last-resort accessible name).
 *
 * Description channel: the host's `internals.ariaDescribedByElements` carries
 * the resolved IDREF chain on the modern path. The inner native `<dialog>` ALSO
 * receives a serialized `aria-describedby` chain — when a consumer description
 * resolves, a synthesized in-shadow `<span id="${id}-consumer-desc">` is
 * appended to the existing `description` span (if any) and the inner
 * `<dialog>`'s `aria-describedby` references both same-root ids. `aria-description`
 * is intentionally NEVER written — W3C AccName ignores it whenever
 * `aria-describedby` is also present.
 *
 * Slot mutation observers track:
 *   1. The header slot's text content (in-place i18n re-renders).
 *   2. Consumer-resolved external IDREF targets (so a consumer mutating
 *      `<label id="x">Patient</label>` in place re-flows the name).
 *   3. Host attribute mutations (delegated to `installAriaIdrefMirror`,
 *      which also catches late-inserted IDREF targets and id renames in
 *      every relevant root).
 *   4. Authentic consumer `aria-describedby` retraction (oldValue !== null &&
 *      newValue === null) via a dedicated `attributeOldValue: true` observer.
 *
 * **First-paint slot state seeding intentionally omitted:** seeding
 * `_hasHeaderSlot` / `_headerSlotText` from `firstUpdated()` would schedule an
 * extra Lit re-render that subtly reorders the open-dialog promise chain
 * (`updateComplete.then(...) → showModal() → updateComplete.then(...) →
 * focus first focusable`). On Chromium, that reordering interleaves the
 * native dialog's modal activation with the focus-restore step and causes
 * focus-trap test failures. The slotchange handler runs one microtask later
 * and `_syncHostAriaSemantics()` from `updated()` picks up the resolved state
 * on the next paint — close enough that AT never observes the unnamed window.
 * Mirrors the same intentional decision documented in hx-drawer round-1.
 *
 * Focus trap, ESC dismiss with `hx-cancel` BEFORE `hx-close`, focus-restore
 * via `_triggerElement`, and native `showModal()` semantics are unchanged
 * from the pre-host-canonical implementation.
 *
 * @summary Accessible dialog overlay for confirmations, forms, and detailed content.
 *
 * @tag hx-dialog
 *
 * @slot - Default slot for the dialog body content.
 * @slot header - Slot for custom header content. When provided, replaces the built-in heading.
 * @slot footer - Slot for action buttons or footer content.
 *
 * @fires {CustomEvent<void>} hx-open - Fired when the dialog opens.
 * @fires {CustomEvent<void>} hx-close - Fired when the dialog closes for any reason.
 * @fires {CustomEvent<void>} hx-cancel - Fired when the dialog is dismissed via Escape key or cancel action.
 *
 * **Event naming rationale:** hx-dialog intentionally uses `hx-open`/`hx-close`/`hx-cancel`
 * instead of the `hx-show`/`hx-hide`/`hx-after-show`/`hx-after-hide` pattern used by overlay
 * components (hx-drawer, hx-popover, hx-tooltip). This aligns with the native `<dialog>`
 * element's `close` and `cancel` events and communicates that the dialog is a stateful container
 * (open/closed) rather than a transient visibility toggle (show/hide).
 *
 * @csspart dialog - The inner container div that holds the dialog content.
 * @csspart backdrop - The non-modal backdrop overlay element.
 * @csspart header - The header region containing the heading and header slot.
 * @csspart close-button - The built-in close button in the dialog header.
 * @csspart body - The scrollable body region containing the default slot.
 * @csspart footer - The footer region containing the footer slot.
 *
 * @cssprop [--hx-dialog-bg=var(--hx-color-neutral-0)] - Dialog background color.
 * @cssprop [--hx-dialog-color=var(--hx-color-neutral-900)] - Dialog text color.
 * @cssprop [--hx-dialog-border-radius=var(--hx-border-radius-lg)] - Dialog corner radius.
 * @cssprop [--hx-dialog-shadow=var(--hx-shadow-xl)] - Dialog box shadow.
 * @cssprop [--hx-dialog-width=32rem] - Dialog width.
 * @cssprop [--hx-dialog-backdrop-color=var(--hx-color-neutral-900)] - Backdrop overlay color.
 * @cssprop [--hx-dialog-backdrop-opacity=0.5] - Backdrop overlay opacity (set to 0 to hide; note
 *   that opacity:0 makes the backdrop invisible but still present in the layout — use pointer-events
 *   carefully if you need a fully non-blocking backdrop).
 * @cssprop [--hx-dialog-header-padding] - Padding inside the dialog header.
 * @cssprop [--hx-dialog-header-border-color=var(--hx-color-neutral-200)] - Header bottom border color.
 * @cssprop [--hx-dialog-heading-color=var(--hx-color-neutral-900)] - Heading text color.
 * @cssprop [--hx-dialog-body-padding] - Padding inside the dialog body.
 * @cssprop [--hx-dialog-footer-padding] - Padding inside the dialog footer.
 * @cssprop [--hx-dialog-footer-border-color=var(--hx-color-neutral-200)] - Footer top border color.
 *
 * @remarks
 * **Browser support for `::backdrop`:** The `dialog::backdrop` pseudo-element inside Shadow DOM
 * is well-supported in Chrome/Chromium and Firefox 122+. For Firefox < 122, modal backdrop
 * animation will silently fall back to no animation. A non-modal backdrop fallback is rendered
 * for non-modal dialogs.
 *
 * **Drupal integration:** This component is Twig-renderable via attributes (`heading`, `open`,
 * `modal`, `close-on-backdrop`). For trigger-button wiring in Drupal behaviors:
 * ```js
 * Drupal.behaviors.hxDialog = {
 *   attach(context) {
 *     context.querySelectorAll('[data-hx-dialog-trigger]').forEach((btn) => {
 *       btn.addEventListener('click', () => {
 *         const id = btn.getAttribute('data-hx-dialog-trigger');
 *         document.getElementById(id)?.showModal();
 *       });
 *     });
 *   },
 * };
 * ```
 * Focus restoration to the trigger element is handled automatically by the component.
 * @cssprop [--hx-z-index-modal] - Z-index layer.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-border-radius-lg] - CSS custom property.
 * @cssprop [--hx-shadow-xl] - Box shadow.
 * @cssprop [--hx-container-narrow] - CSS custom property.
 * @cssprop [--hx-space-8] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-duration-normal] - Animation duration.
 * @cssprop [--hx-easing-out] - CSS custom property.
 * @cssprop [--hx-space-5] - Spacing token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-dialog-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-font-size-xl] - Font size.
 * @cssprop [--hx-duration-fast] - Animation duration.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-dialog-close-btn-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-space-3] - Spacing token.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-dialog/AAA-AUDIT.md
 * @keyboard-contract dismiss=Escape; trap-focus=true
 * @aria-pattern dialog
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.6.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-dialog
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-dialog')
export class HelixDialog extends HelixElement {
  static override styles = [helixDialogStyles, forcedColorsSurface];

  // D10 — observe aria-label attribute without shadowing ARIAMixin.ariaLabel
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, 'aria-label'];
  }

  /**
   * Test seam: when set to `true` or `false`, overrides the platform
   * `supportsIdrefElementReferences` probe before `connectedCallback`
   * seeds `_supportsIdrefRefs`. Mirrors hx-drawer round-1 — tests must
   * select the path BEFORE the host connects so synthetic environments
   * match a legacy engine. Production code MUST NOT touch this field.
   * It is `static` so the cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  // ─── Queries ───

  /** @internal */
  @query('dialog')
  private _dialogEl: HTMLDialogElement | null | undefined;

  // ─── Internal state ───

  /** Tracks whether a header slot has been assigned content.  * @internal
   */
  @state()
  private _hasHeaderSlot = false;

  /** Tracks whether a footer slot has been assigned content.  * @internal
   */
  @state()
  private _hasFooterSlot = false;

  /** Cached focusable elements — populated on open, cleared on close. */
  /** @internal */
  private _cachedFocusableElements: HTMLElement[] = [];

  /**
   * Guards against re-entrant open/close calls within a single async open cycle.
   *
   * STATE MANAGEMENT CONTRACT
   * ─────────────────────────
   * `this.open` (the Lit property) is the single source of truth for dialog open state.
   * All native `<dialog>` state changes (`showModal()`, `show()`, `close()`) flow exclusively
   * from `updated()` → `_openDialog()` / `_closeDialog()`. External callers MUST only set
   * `this.open`; they must never call native dialog methods directly.
   *
   * `_isTransitioning` is set to `true` at the start of `_openDialog()` to prevent a second
   * open call from running concurrently while the first is awaiting `updateComplete`. It is
   * cleared synchronously after the async tail completes. A 200 ms fallback timeout ensures
   * the flag is always released even if `updateComplete` never resolves (e.g. detached DOM).
   *
   * `_closeDialog()` does NOT use `_isTransitioning` as a guard — it always runs immediately
   * to honour a `this.open = false` that arrives during the open async tail. The open async
   * tail checks `this.open` before touching focus so it can abort cleanly.
   */
  /** @internal */
  private _isTransitioning = false;

  /** Fallback timer that releases `_isTransitioning` if the open async tail never fires. */
  /** @internal */
  private _transitionFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  /** The element that had focus when the dialog opened — restored on close (D1). */
  /** @internal */
  private _triggerElement: HTMLElement | null = null;

  /** Pending returnValue to pass to native dialog.close() (D11). */
  /** @internal */
  private _pendingReturnValue: string | undefined = undefined;

  // ─── Unique IDs for aria-labelledby / aria-describedby ───

  /** @internal */
  private readonly _dialogId = _nextDialogId();
  /** @internal */
  private readonly _headingId = `${this._dialogId}-heading`;
  /** @internal */
  private readonly _descriptionId = `${this._dialogId}-description`;
  /**
   * Id of the synthesized in-shadow span that mirrors consumer-resolved
   * description text. Belt-and-suspenders: the host's
   * `internals.ariaDescribedByElements` carries the live element references on
   * the modern path; this in-shadow span is the fallback referenced via
   * `aria-describedby` on the inner native `<dialog>` so AT that walks the
   * native dialog first (and ignores host IDL refs) still finds an
   * announceable description.
   * @internal
   */
  private readonly _consumerDescId = `${this._dialogId}-consumer-desc`;
  /**
   * Id of the synthesized in-shadow span that mirrors the resolved accessible
   * NAME when consumer IDREFs / slotted header text need to be projected onto
   * the inner native `<dialog>`'s `aria-labelledby`. The native dialog cannot
   * cross the shadow boundary to resolve light-DOM ids, so we surface a
   * same-shadow-root span carrying the flattened text. The host
   * `internals.ariaLabelledByElements` continues to carry live IDL refs on the
   * modern path; this span is the hybrid-fallback target. `aria-label` carries
   * the same string as a second redundancy when no labelled-by chain exists.
   * @internal
   */
  private readonly _consumerLabelId = `${this._dialogId}-consumer-label`;

  // ─── Host-canonical ARIA state ───

  /**
   * Whether the runtime exposes IDL element references on ElementInternals.
   * Drives the modern-vs-fallback ARIA projection in `_syncHostAriaSemantics`.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /**
   * Direct references to ALL labellable elements projected into
   * `<slot name="header">`. Aggregates every assigned element so composed
   * headers (e.g. `<svg slot="header" aria-hidden="true">…</svg><span slot="header">Patient</span>`)
   * project the FULL visible label via `internals.ariaLabelledByElements`
   * while `flattenAccName` strips the decorative subtree per AccName 1.2.
   * @internal
   */
  private _slottedHeaderEls: Element[] = [];

  /**
   * Flattened text content of the slotted header nodes, used for the no-IDL-ref
   * fallback `internals.ariaLabel` and the inner-dialog hybrid `aria-label`.
   * @internal
   */
  @state() private _headerSlotText = '';

  /**
   * Most recently observed consumer-supplied `aria-labelledby` token list on
   * the host. Refreshed every sync via `getAttribute()` — the host attribute
   * IS the live source of truth, so `removeAttribute` is observable on the
   * next sync (it returns `null`).
   * @internal
   */
  private _consumerLabelledBy: string | null = null;
  /** @internal — see `_consumerLabelledBy`. */
  private _consumerDescribedBy: string | null = null;

  /**
   * Handle for the shared IDREF mirror. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Watches in-place text mutations on the assigned slotted header nodes
   * (e.g. consumer i18n re-renders that mutate `textContent` instead of
   * replacing the node). `slotchange` does NOT fire on descendant text
   * mutations, so this observer is the only signal that keeps the host's
   * accessible name synchronized with the visible header text.
   * @internal
   */
  private _headerSlotTextObserver: MutationObserver | null = null;

  /**
   * Watches in-place text / visibility mutations on consumer light-DOM
   * elements resolved from host `aria-labelledby` / `aria-describedby`.
   * Reinstalled on every sync against the deduped union of resolved
   * elements; disconnects automatically when the consumer retracts both
   * IDREF chains.
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  /**
   * Dedicated host observer scoped to `aria-describedby` with
   * `attributeOldValue: true`. Catches authentic consumer retraction
   * (oldValue !== null && newValue === null) so the cached baseline
   * follows the live attribute.
   * @internal
   */
  private _hostDescribedByObserver: MutationObserver | null = null;

  // ─── Public Properties ───

  /**
   * Controls whether the dialog is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * When true, dialog renders as a modal with backdrop and focus trap using the native
   * `showModal()` API. When false (default), dialog renders as a non-modal overlay using
   * the native `show()` API. Defaults to false, consistent with HTML boolean attribute
   * semantics (absent = false, present = true).
   * @attr modal
   */
  @property({ type: Boolean, reflect: true })
  modal = false;

  /**
   * When true, clicking the backdrop closes the dialog.
   * @attr close-on-backdrop
   */
  @property({
    attribute: 'close-on-backdrop',
    reflect: true,
    converter: {
      fromAttribute: (value: string | null) => value !== 'false',
      toAttribute: (value: boolean) => String(value),
    },
  })
  closeOnBackdrop = true;

  /**
   * Text content for the dialog heading. Used as the accessible label via aria-labelledby.
   * @attr heading
   */
  @property({ type: String, reflect: true })
  heading = '';

  /**
   * ARIA role variant. Use `'alertdialog'` for urgent dialogs requiring immediate attention
   * (e.g., drug interaction warnings, critical lab alerts). Defaults to `'dialog'`.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'dialog' | 'alertdialog' = 'dialog';

  /**
   * Optional description text linked to the dialog via `aria-describedby`.
   * When provided, screen readers will announce this text when the dialog receives focus.
   * Recommended for dialogs that surface critical clinical information.
   * @attr description
   */
  @property({ type: String })
  description = '';

  /** Accessible label for the close button. Override for localized text. */
  @property({ type: String, attribute: 'label-close' })
  labelClose = 'Close dialog';

  /**
   * Returns the dialog's return value — the string passed to `close(returnValue)`.
   * Mirrors `HTMLDialogElement.returnValue`.
   */
  get returnValue(): string {
    return this._dialogEl?.returnValue ?? '';
  }

  // ─── Lifecycle ───

  // D10 — re-render when aria-label attribute changes (without declaring a shadowing property)
  override attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null,
  ): void {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'aria-label' && oldVal !== newVal) {
      this.requestUpdate('aria-label', oldVal);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs.
    const ctor = this.constructor as typeof HelixDialog;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // ARCHITECTURE NOTE — Path A for native `<dialog>`:
    // We deliberately do NOT set `internals.role` here. The native inner
    // `<dialog>` already has an implicit `role="dialog"` baked in by the
    // browser and that role cannot be stripped. Setting `internals.role` on
    // the host would create nested-dialog announcements (host=dialog +
    // inner=dialog) on AT that honour both surfaces. The native dialog stays
    // the announced surface; the host only carries the LABEL/DESCRIPTION
    // projection chain via `internals.aria*Elements`. Likewise we do not set
    // `internals.ariaModal` — the native dialog's `showModal()` already
    // declares modality at the platform level.

    // Install the dedicated `aria-describedby` retraction observer BEFORE the
    // seeded `_syncHostAriaSemantics()` call below — mirrors hx-drawer round-1
    // (and hx-combobox round-10 finding 1) — so authentic consumer clears
    // propagate immediately instead of waiting for the next render.
    this._hostDescribedByObserver = new MutationObserver((records) => {
      let consumerCleared = false;
      for (const record of records) {
        if (record.attributeName !== 'aria-describedby') continue;
        const oldValue = record.oldValue;
        const newValue = this.getAttribute('aria-describedby');
        if (oldValue !== null && newValue === null) {
          this._consumerDescribedBy = null;
          consumerCleared = true;
        }
      }
      if (consumerCleared) {
        this._syncHostAriaSemantics();
      }
    });
    this._hostDescribedByObserver.observe(this, {
      attributes: true,
      attributeFilter: ['aria-describedby'],
      attributeOldValue: true,
    });

    // Seed root-independent semantics from connect so the host's accessible
    // name projects before first paint. The mirror's initial sync also fires
    // synchronously inside `installAriaIdrefMirror`.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override firstUpdated(): void {
    // Warn when no accessible heading is available.
    // _hasHeaderSlot is maintained by the slotchange handler; check it here
    // on first paint so a missing heading triggers the dev warning immediately.
    if (!this.heading.trim() && !this._hasHeaderSlot) {
      devWarn(
        'hx-dialog',
        'No heading or header slot provided. Dialog will use a fallback aria-label. Provide a `heading` attribute or populate the `header` slot for a descriptive accessible name.',
      );
    }
    // Intentionally NOT seeding `_hasHeaderSlot` / `_headerSlotText` from
    // firstUpdated. See the architecture note on the class JSDoc — proactive
    // seeding here schedules an extra Lit re-render that subtly reorders the
    // open-dialog promise chain (`updateComplete.then(...) → showModal() →
    // updateComplete.then(...) → focus first focusable`). On Chromium that
    // reordering interleaves modal activation with the focus-restore step
    // and breaks focus-trap test assertions. The slotchange handler runs one
    // microtask later and `_syncHostAriaSemantics()` from `updated()` picks
    // up the resolved state on the very next paint — close enough that AT
    // never observes the unnamed window.
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTransitionFallback();
    this._isTransitioning = false;
    this._removeGlobalListeners();
    // Restore body scroll if disconnected while open
    if (this.modal && this.open) {
      unlockBodyScroll();
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._headerSlotTextObserver?.disconnect();
    this._headerSlotTextObserver = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
    this._hostDescribedByObserver?.disconnect();
    this._hostDescribedByObserver = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this._openDialog();
      } else {
        this._closeDialog();
      }
    }

    // Re-sync host ARIA on every update — `heading` / `description` /
    // `_hasHeaderSlot` / `_headerSlotText` / consumer attributes can all
    // change between renders and the projection is the SSOT for AT.
    this._syncHostAriaSemantics();
  }

  // ─── Public Methods ───

  /** Opens the dialog in the mode determined by the `modal` property. */
  show(): void {
    this.open = true;
  }

  /** Opens the dialog as a modal regardless of the `modal` property setting. */
  showModal(): void {
    this.modal = true;
    this.open = true;
  }

  /**
   * Closes the dialog.
   * @param returnValue - Optional return value string stored as `dialog.returnValue`.
   */
  close(returnValue?: string): void {
    if (returnValue !== undefined) {
      this._pendingReturnValue = returnValue;
    }
    this.open = false;
  }

  // ─── Private: Open / Close ───

  /** Clears the fallback timer that releases `_isTransitioning`. @internal */
  private _clearTransitionFallback(): void {
    if (this._transitionFallbackTimer !== null) {
      clearTimeout(this._transitionFallbackTimer);
      this._transitionFallbackTimer = null;
    }
  }

  /** @internal */
  private _openDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    // Guard: already open in the native dialog — nothing to do.
    if (dialog.open) return;

    // Guard: re-entrant call during our own async open tail — skip.
    if (this._isTransitioning) return;

    this._isTransitioning = true;

    // 200 ms fallback — releases the transitioning flag if updateComplete never
    // resolves (e.g. component detached mid-cycle or in a test environment that
    // does not flush promises). Prevents the dialog from getting permanently stuck.
    this._clearTransitionFallback();
    this._transitionFallbackTimer = setTimeout(() => {
      this._transitionFallbackTimer = null;
      this._isTransitioning = false;
    }, 200);

    // D1 — store the element that triggered the dialog open for focus restoration on close
    const active = document.activeElement;
    this._triggerElement = active instanceof HTMLElement ? active : null;

    if (this.modal) {
      // showModal() throws if the dialog is already in the DOM as open — guard above
      // ensures dialog.open is false before reaching here.
      dialog.showModal();
      // D4 — lock body scroll when modal dialog is open. Uses a shared reference-counted
      // lock so that simultaneous hx-dialog / hx-drawer instances don't clobber each other
      // when one closes before the other (see utils/body-scroll-lock.ts).
      lockBodyScroll();
    } else {
      dialog.show();
    }

    this._addGlobalListeners();

    // Cache focusable elements after the dialog is open in the DOM.
    void this.updateComplete.then(() => {
      // Cancel if `this.open` was set to false during this async tail — `_closeDialog`
      // already ran synchronously and we must not clobber its state.
      this._clearTransitionFallback();
      this._isTransitioning = false;
      if (!this.open) return;

      this._cachedFocusableElements = this._getFocusableElements();
      // D3 — explicitly move initial focus to the first focusable element inside the dialog
      // (browser's built-in focus delegation cannot reach slotted light DOM through Shadow DOM)
      this._cachedFocusableElements[0]?.focus();
    });

    this.dispatchEvent(
      new CustomEvent<void>('hx-open', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** @internal */
  private _closeDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    // Guard: already closed in the native dialog — nothing to do, but still
    // release any stuck transitioning state so the next open can proceed.
    if (!dialog.open) {
      // Release transitioning lock in case we are in the open async tail.
      this._clearTransitionFallback();
      this._isTransitioning = false;
      return;
    }

    // Close always wins over a concurrent open async tail. We clear the
    // transitioning flag and cancel the fallback so the open tail's own
    // early-return check (`if (!this.open) return`) fires correctly.
    this._clearTransitionFallback();
    this._isTransitioning = false;

    // D11 — forward returnValue to native dialog.close() if provided
    if (this._pendingReturnValue !== undefined) {
      dialog.close(this._pendingReturnValue);
      this._pendingReturnValue = undefined;
    } else {
      dialog.close();
    }

    // D4 — release body scroll lock only when this dialog was opened as modal.
    // Non-modal dialogs never call lockBodyScroll(), so the unlock must be symmetric.
    if (this.modal) {
      unlockBodyScroll();
    }

    this._removeGlobalListeners();
    this._cachedFocusableElements = [];

    // D1 — restore focus to the element that opened the dialog (WCAG 2.4.3)
    this._triggerElement?.focus();
    this._triggerElement = null;

    this.dispatchEvent(
      new CustomEvent<void>('hx-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Event Listeners ───

  /** @internal */
  private _addGlobalListeners(): void {
    this._dialogEl?.addEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.addEventListener('click', this._handleDialogClick);
    this._dialogEl?.addEventListener('cancel', this._handleNativeCancel);
  }

  /** @internal */
  private _removeGlobalListeners(): void {
    this._dialogEl?.removeEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.removeEventListener('click', this._handleDialogClick);
    this._dialogEl?.removeEventListener('cancel', this._handleNativeCancel);
  }

  // ─── Keyboard Handler ───

  /** @internal */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      // Native dialog fires a 'cancel' event before close when Escape is pressed.
      // We prevent default here and handle it ourselves so we fire hx-cancel
      // before setting open = false (which triggers hx-close).
      e.preventDefault();
      this._cancel();
      return;
    }

    if (e.key === 'Tab' && this.modal) {
      this._trapFocus(e);
    }
  };

  // ─── Focus Trap ───

  /** @internal */
  private _getFocusableElements(): HTMLElement[] {
    // Collect focusable elements from slotted light DOM content only.
    // Shadow DOM elements (e.g., the built-in close button) remain accessible via
    // the native <dialog> tab order — including them here would cause focus to land
    // on shadow DOM elements whose document.activeElement resolves to the host,
    // breaking the test assertions and D7 initial focus behavior.
    const slots = this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot') ?? [];
    const lightFocusable: HTMLElement[] = [];

    slots.forEach((slot) => {
      slot.assignedElements({ flatten: true }).forEach((el) => {
        if (el instanceof HTMLElement) {
          if (el.matches(FOCUSABLE_SELECTORS)) {
            lightFocusable.push(el);
          }
          el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS).forEach((child) => {
            lightFocusable.push(child);
          });
        }
      });
    });

    const filtered = lightFocusable.filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1',
    );

    // WCAG 2.4.3: if no light DOM focusable elements exist, fall back to the shadow
    // close button so the dialog always has at least one reachable focus target.
    if (filtered.length === 0) {
      const closeBtn = this.shadowRoot?.querySelector<HTMLElement>('.dialog__close-btn');
      if (closeBtn) filtered.push(closeBtn);
    }

    return filtered;
  }

  /** @internal */
  private _trapFocus(e: KeyboardEvent): void {
    const focusable =
      this._cachedFocusableElements.length > 0
        ? this._cachedFocusableElements
        : this._getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const [first, ...rest] = focusable;
    const last = rest.length > 0 ? rest[rest.length - 1] : first;

    if (!first || !last) return;

    const active = document.activeElement;
    // Also check shadow root active element
    const shadowActive = this.shadowRoot?.activeElement;
    const currentActiveEl = shadowActive ?? active;
    const currentActive = currentActiveEl instanceof HTMLElement ? currentActiveEl : null;

    // The shadow close button may be the first focusable element when no light DOM
    // content exists (WCAG 2.1.2). Check both the element reference and shadow root
    // active element so Shift+Tab wraps correctly across the shadow boundary.
    const closeBtn = this.shadowRoot?.querySelector<HTMLElement>('.dialog__close-btn');

    if (e.shiftKey) {
      // Shift+Tab: if focus is on first, wrap to last
      const isOnFirst =
        currentActive === first ||
        (closeBtn !== null && shadowActive === closeBtn && first === closeBtn);
      if (isOnFirst) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on last, wrap to first
      if (currentActive === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ─── Backdrop Click ───

  /** @internal */
  private _handleDialogClick = (e: MouseEvent): void => {
    if (!this.closeOnBackdrop) return;

    // The native dialog element fills only the content area in showModal().
    // Clicks on the backdrop reach the <dialog> element itself.
    // We detect this by checking whether the click target is the dialog element.
    const target = e.target as HTMLElement;
    if (target === this._dialogEl) {
      this._cancel();
    }
  };

  // ─── Non-modal backdrop click ───

  /** @internal */
  private _handleBackdropClick = (): void => {
    if (!this.closeOnBackdrop) return;
    this._cancel();
  };

  // ─── Native cancel (Escape via browser, before our handler runs) ───

  /** @internal */
  private _handleNativeCancel = (e: Event): void => {
    // We always prevent the native cancel so we can manage close state ourselves.
    e.preventDefault();
  };

  // ─── Cancel logic ───

  /** @internal */
  private _cancel(): void {
    this.dispatchEvent(
      new CustomEvent<void>('hx-cancel', {
        bubbles: true,
        composed: true,
      }),
    );

    this.open = false;
    // hx-close is dispatched by _closeDialog() which is called via the open property setter
  }

  // ─── Slot change handlers ───

  /** @internal */
  private _handleHeaderSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readHeaderSlotState(e.target);
    this._hasHeaderSlot = state.hasUsefulName || state.hasAnyAssigned;
    this._slottedHeaderEls = state.elements;
    this._headerSlotText = state.text;
    this._installHeaderSlotTextObserver(state.elements);
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Host-canonical ARIA helpers ───

  /**
   * Reads the header slot's assigned nodes and computes the discriminated
   * naming state. Aggregates ALL assigned elements (not just the first) so
   * composed headers project the FULL visible label via
   * `internals.ariaLabelledByElements`. Per AccName 1.2 §4.3.10,
   * `aria-hidden="true"` / `[hidden]` elements contribute zero to the
   * accessible name but stay in `elements` so AT walking IDL refs sees the
   * full visible group. `hasUsefulName` is gated on the flattened text
   * length: a slot containing only decorative wrappers does NOT name the
   * dialog, and the host falls through to the next naming source.
   *
   * `hasAnyAssigned` is the legacy semantic kept for the existing dev-warning
   * + `_renderHeader()` empty-slot flag (the heading / built-in close button
   * area is rendered regardless of useful-name state when the consumer has
   * projected SOMETHING into the header slot).
   * @internal
   */
  private _readHeaderSlotState(slot: HTMLSlotElement): {
    hasUsefulName: boolean;
    hasAnyAssigned: boolean;
    elements: Element[];
    text: string;
  } {
    const nodes = slot.assignedNodes({ flatten: true });
    const elements: Element[] = [];
    const fragments: string[] = [];
    let hasAnyAssigned = false;
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        hasAnyAssigned = true;
        const el = node as Element;
        elements.push(el);
        if (el.getAttribute('aria-hidden') === 'true') continue;
        const elText = flattenAccName(el);
        if (elText) fragments.push(elText);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const txt = (node.textContent ?? '').trim();
        if (txt) {
          fragments.push(txt);
          hasAnyAssigned = true;
        }
      }
    }
    const trimmedText = fragments.join(' ').replace(/\s+/g, ' ').trim();
    return {
      hasUsefulName: trimmedText.length > 0,
      hasAnyAssigned,
      elements,
      text: trimmedText,
    };
  }

  /**
   * (Re-)installs the mutation observer over the current set of slotted header
   * elements. On any descendant text/visibility mutation we re-flatten and
   * re-sync so the host's accessible name tracks the visible header.
   * @internal
   */
  private _installHeaderSlotTextObserver(elements: Element[]): void {
    this._headerSlotTextObserver?.disconnect();
    if (elements.length === 0) {
      this._headerSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      const fragments: string[] = [];
      for (const el of elements) {
        if (el.getAttribute('aria-hidden') === 'true') continue;
        const t = flattenAccName(el);
        if (t) fragments.push(t);
      }
      const trimmed = fragments.join(' ').replace(/\s+/g, ' ').trim();
      this._headerSlotText = trimmed;
      this._syncHostAriaSemantics();
    });
    for (const el of elements) {
      observer.observe(el, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    }
    this._headerSlotTextObserver = observer;
  }

  /**
   * (Re-)installs a `MutationObserver` against the deduped union of
   * consumer-resolved label/description elements. Watches `characterData`,
   * `childList`, `subtree`, and `aria-hidden` / `hidden` attributes so any
   * in-place mutation on the referenced light-DOM nodes triggers a fresh
   * sync — keeping the modern-path IDL refs and the fallback-path text
   * flatten aligned with the live consumer text.
   * @internal
   */
  private _installExternalRefsObserver(elements: Element[]): void {
    if (this._externalRefsObserver) {
      this._externalRefsObserver.disconnect();
      this._externalRefsObserver = null;
    }
    if (elements.length === 0) return;
    const unique = new Set<Element>(elements);
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    for (const el of unique) {
      observer.observe(el, {
        characterData: true,
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    }
    this._externalRefsObserver = observer;
  }

  /**
   * Resolves consumer-supplied label/description IDREFs on the host and
   * projects the canonical dialog ARIA onto **both** surfaces:
   *
   *   1. The **host** via `ElementInternals` (modern path) — IDL element
   *      references that AT honouring the host-internals contract pick up
   *      across the shadow boundary.
   *   2. The inner native `<dialog>` via attribute writes — hybrid fallback
   *      so AT that walks the native dialog first (and ignores host
   *      `internals.aria*Elements`) still finds an announceable name and
   *      description.
   *
   * Path A native-dialog adaptation: the host does NOT carry `internals.role`
   * or `internals.ariaModal` — the native `<dialog>` already declares those at
   * the platform level and rewriting them on the host would create
   * nested-dialog announcements.
   *
   * The inner `<dialog>` keeps `role="alertdialog"` ONLY when `variant ===
   * 'alertdialog'` (the platform allows overriding the implicit `dialog` role
   * with the more specific `alertdialog`); otherwise the implicit `dialog`
   * role wins.
   *
   * Naming precedence (W3C AccName 1.2 §4.3.1):
   *   1. Consumer `aria-labelledby` (resolved IDREFs, text-flattened)
   *   2. Consumer `aria-label`
   *   3. Slotted `<slot name="header">` text
   *   4. `heading` property
   *   5. Hard-coded `"Dialog"`
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    // Refresh the consumer baseline. The host attribute IS the live source
    // of truth — `null` authentically represents consumer retraction.
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    this._consumerLabelledBy = liveLabelledBy;
    const liveDescribedBy = this.getAttribute('aria-describedby');
    this._consumerDescribedBy = liveDescribedBy;

    const consumerLabelEls = resolveIdrefTokens(this, this._consumerLabelledBy);
    const hasEffectiveLabelledBy = consumerLabelEls.length > 0;
    const consumerDescEls = resolveIdrefTokens(this, this._consumerDescribedBy);

    // Observe in-place mutations on the resolved external IDREF targets.
    // Without this a consumer mutating `<h2 id="x">Patient</h2>` → "Member"
    // in place leaves the host's flattened `aria-label` stuck on "Patient".
    this._installExternalRefsObserver([...consumerLabelEls, ...consumerDescEls]);

    // Per AccName 1.2 §4.3.10, top-level aria-hidden / hidden elements
    // contribute zero to the name. Filter them from the IDL-refs path so the
    // modern path matches the fallback path's text-flatten behavior.
    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() : '';

    // Build the augmented label-elements list used by the modern path.
    // Slotted-header elements feed in only when no consumer aria-labelledby
    // resolved (AccName 1.2 precedence: external > slot > property).
    const labelElsForInternals: Element[] = [];
    labelElsForInternals.push(...consumerLabelEls.filter(isVisibleForAccName));
    if (!hasEffectiveLabelledBy && !hostAriaLabel && this._slottedHeaderEls.length > 0) {
      // Aggregate every slotted header element so AT composes icon + text.
      labelElsForInternals.push(...this._slottedHeaderEls.filter(isVisibleForAccName));
    }

    const descElsForInternals: Element[] = [...consumerDescEls.filter(isVisibleForAccName)];

    // ─── Compute the resolved accessible name (text-flatten path) ───
    const flattenText = (els: Element[]): string =>
      els
        .filter(isVisibleForAccName)
        .map((el) => flattenAccName(el))
        .filter((t) => t.length > 0)
        .join(' ');

    let resolvedName = '';
    if (hasEffectiveLabelledBy) {
      resolvedName = flattenText(consumerLabelEls);
    }
    if (!resolvedName && hostAriaLabel) {
      resolvedName = hostAriaLabel;
    }
    if (!resolvedName && this._headerSlotText) {
      resolvedName = this._headerSlotText;
    }
    if (!resolvedName && this.heading.trim()) {
      resolvedName = this.heading.trim();
    }
    if (!resolvedName) {
      // Last-resort literal — preserves the pre-host-canonical default so an
      // unlabeled dialog still has SOME announced name. Consumer responsibility
      // to provide a meaningful one in real usage.
      resolvedName = 'Dialog';
    }

    // ─── Modern-path: ElementInternals IDL element references ───
    type InternalsWithIdrefRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
      ariaDescribedByElements: Element[] | null;
    };
    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithIdrefRefs;
      refsInternals.ariaLabelledByElements =
        labelElsForInternals.length > 0 ? labelElsForInternals : null;
      refsInternals.ariaDescribedByElements =
        descElsForInternals.length > 0 ? descElsForInternals : null;
      // Forward `aria-label` to `internals.ariaLabel` ONLY when no labelledby
      // resolved — per AccName 1.2 a non-empty aria-label outranks
      // aria-labelledby, and we never want to silently erase the IDL-ref
      // resolution. When labelledby is present, `null` removes the override
      // so element references win.
      if (hasEffectiveLabelledBy) {
        internals.ariaLabel = null;
      } else {
        internals.ariaLabel = resolvedName;
      }
    } else {
      // Fallback path: write the flattened name directly to internals.
      // Older engines without IDL refs use this as the canonical name.
      internals.ariaLabel = resolvedName;
    }

    // ─── Synthesized in-shadow consumer-description span ───
    // Mirror consumer-resolved description text into a same-root span so the
    // inner native `<dialog>`'s `aria-describedby` resolves cross-shadow
    // without pointing at light-DOM ids (which do not resolve from inside a
    // shadow root). `aria-description` is intentionally NEVER written.
    const consumerDescSpan = this.shadowRoot?.getElementById(this._consumerDescId) ?? null;
    const consumerDescText = flattenText(consumerDescEls);
    if (consumerDescSpan && consumerDescSpan.textContent !== consumerDescText) {
      consumerDescSpan.textContent = consumerDescText;
    }

    // ─── Synthesized in-shadow consumer-label span (hybrid fallback) ───
    // The native `<dialog>` cannot resolve light-DOM ids written to its
    // `aria-labelledby` from inside the shadow root, so we surface the
    // flattened resolved name on a same-shadow-root span and reference it.
    // The host's `internals.ariaLabelledByElements` continues to carry live
    // IDL refs on the modern path; this span is the hybrid-fallback target
    // when AT walks the native dialog first.
    const consumerLabelSpan = this.shadowRoot?.getElementById(this._consumerLabelId) ?? null;
    if (consumerLabelSpan && consumerLabelSpan.textContent !== resolvedName) {
      consumerLabelSpan.textContent = resolvedName;
    }

    // ─── Inner native <dialog> attribute reconciliation ───
    // Hybrid fallback: write `aria-label` / `aria-labelledby` /
    // `aria-describedby` directly on the inner native `<dialog>`. The native
    // dialog cannot be stripped of its implicit `role="dialog"`, so it stays
    // the announced surface; this projection guarantees AT that walks the
    // native dialog first still finds an announceable name and description.
    //
    // Naming-projection cascade for the inner <dialog>:
    //
    //   1. Consumer `aria-labelledby` resolved cross-shadow → write
    //      `aria-labelledby="${_consumerLabelId}"` (the synthesized span
    //      carries the flattened text from the cross-shadow IDREF chain).
    //   2. Slotted header text only (no consumer aria-* on host) →
    //      `aria-labelledby="${_consumerLabelId}"` (same span carries the
    //      flattened slot text — cross-shadow IDREF resolution from a native
    //      dialog inside a shadow root is unreliable, the same-root span is
    //      the stable target).
    //   3. Consumer `aria-label` literal on host → mirror to inner dialog's
    //      `aria-label` (no IDREF indirection needed).
    //   4. `heading` property → `aria-labelledby="${_headingId}"` (same-root
    //      <h2> id is the natural target; preserves the pre-host-canonical
    //      contract).
    //   5. Fallback "Dialog" literal → `aria-label="Dialog"`.
    //
    // Steps 1, 2, 4 take the `aria-labelledby` path. Steps 3, 5 take the
    // `aria-label` path. Per AccName precedence we never set both at once.
    const dialogEl = this._dialogEl ?? null;
    if (dialogEl) {
      const hasHeadingProp = this.heading.trim().length > 0;
      let wantLabelledBy: string | null = null;
      let wantLabel: string | null = null;
      if (hasEffectiveLabelledBy) {
        // Cross-shadow consumer IDREF chain → surface flattened name via the
        // synthesized consumer-label span.
        wantLabelledBy = this._consumerLabelId;
      } else if (this._headerSlotText) {
        // Slot-projected header content → surface flattened name via the
        // synthesized consumer-label span.
        wantLabelledBy = this._consumerLabelId;
      } else if (hostAriaLabel) {
        // Consumer aria-label is a literal string — mirror it directly,
        // preserving the pre-host-canonical contract on the inner dialog.
        wantLabel = hostAriaLabel;
      } else if (hasHeadingProp) {
        // Heading property renders as a same-root <h2 id={_headingId}>.
        wantLabelledBy = this._headingId;
      } else {
        // Last-resort literal "Dialog".
        wantLabel = resolvedName;
      }

      if (wantLabelledBy) {
        if (dialogEl.getAttribute('aria-labelledby') !== wantLabelledBy) {
          dialogEl.setAttribute('aria-labelledby', wantLabelledBy);
        }
      } else if (dialogEl.hasAttribute('aria-labelledby')) {
        dialogEl.removeAttribute('aria-labelledby');
      }
      if (wantLabel) {
        if (dialogEl.getAttribute('aria-label') !== wantLabel) {
          dialogEl.setAttribute('aria-label', wantLabel);
        }
      } else if (dialogEl.hasAttribute('aria-label')) {
        dialogEl.removeAttribute('aria-label');
      }

      // ─── aria-describedby on inner <dialog> ───
      // Chain the existing `description` span (when the property is set) and
      // the synthesized consumer-description span (when consumer IDREFs
      // resolved). Same-shadow-root ids resolve cleanly; cross-shadow consumer
      // ids are ignored at the AT level so we never write them directly.
      const descTokens: string[] = [];
      if (this.description) descTokens.push(this._descriptionId);
      if (consumerDescText && consumerDescSpan) descTokens.push(this._consumerDescId);
      const wantDescribedBy = descTokens.length > 0 ? descTokens.join(' ') : null;
      if (wantDescribedBy) {
        if (dialogEl.getAttribute('aria-describedby') !== wantDescribedBy) {
          dialogEl.setAttribute('aria-describedby', wantDescribedBy);
        }
      } else if (dialogEl.hasAttribute('aria-describedby')) {
        dialogEl.removeAttribute('aria-describedby');
      }

      // ─── aria-modal on inner <dialog> ───
      // Native `showModal()` already declares modality at the platform level,
      // making `aria-modal="true"` strictly redundant. We keep the explicit
      // attribute on the inner dialog for backward compatibility with
      // consumer code / tests that check for it, AND because some legacy AT
      // implementations rely on the explicit attribute rather than the
      // platform modal flag.
      if (this.modal) {
        if (dialogEl.getAttribute('aria-modal') !== 'true') {
          dialogEl.setAttribute('aria-modal', 'true');
        }
      } else if (dialogEl.hasAttribute('aria-modal')) {
        dialogEl.removeAttribute('aria-modal');
      }

      // Strip `aria-description` defensively — never written on either path.
      if (dialogEl.hasAttribute('aria-description')) {
        dialogEl.removeAttribute('aria-description');
      }
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderHeader() {
    const hasHeading = this.heading.trim().length > 0;

    // Always render header to include the built-in close button (D17)
    return html`
      <div part="header" class="dialog__header">
        ${hasHeading
          ? html`<h2 id=${this._headingId} class="dialog__heading">${this.heading}</h2>`
          : nothing}
        <slot name="header" @slotchange=${this._handleHeaderSlotChange}></slot>
        <button
          part="close-button"
          class="dialog__close-btn"
          type="button"
          aria-label=${this.labelClose}
          @click=${() => this.close()}
        ></button>
      </div>
    `;
  }

  /** @internal */
  private _renderFooter() {
    return html`
      <div part="footer" class="dialog__footer" ?hidden=${!this._hasFooterSlot}>
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }

  /** @internal */
  private _renderNonModalBackdrop() {
    if (this.modal || !this.open) return nothing;
    return html`
      <div
        part="backdrop"
        class="dialog-backdrop"
        @click=${this._handleBackdropClick}
        aria-hidden="true"
      ></div>
    `;
  }

  // D8 — render visually-hidden description for aria-describedby
  /** @internal */
  private _renderDescription() {
    if (!this.description) return nothing;
    return html`<span id=${this._descriptionId} class="dialog__description"
      >${this.description}</span
    >`;
  }

  // ─── Render ───

  override render() {
    // Path A native-dialog adaptation:
    //   - The inner native `<dialog>` no longer carries `aria-labelledby` /
    //     `aria-label` / `aria-describedby` / `aria-modal` from inline render
    //     bindings. Those are projected imperatively in
    //     `_syncHostAriaSemantics()` so the host-canonical IDL-ref path and
    //     the hybrid inner-dialog fallback stay in lockstep.
    //   - `role` is still bound inline because it depends on the
    //     `variant` property and the platform allows overriding the implicit
    //     `dialog` role with `alertdialog`.
    //   - `aria-modal` is intentionally OMITTED — `showModal()` already
    //     declares modality at the platform level. Setting it explicitly is
    //     redundant and creates double-announcement on some AT.
    return html`
      ${this._renderNonModalBackdrop()}
      <dialog role=${this.variant !== 'dialog' ? this.variant : nothing}>
        <div part="dialog" class="dialog">
          ${this._renderHeader()} ${this._renderDescription()}
          <div part="body" class="dialog__body">
            <slot></slot>
          </div>
          ${this._renderFooter()}
        </div>
        <!--
          Synthesized in-shadow span carrying the resolved accessible NAME for
          the hybrid inner-dialog fallback (consumer aria-labelledby IDREF
          chain flattened, or consumer aria-label, or slotted header text).
          The host's \`internals.ariaLabelledByElements\` carries the live IDL
          refs on the modern path; this span is the same-shadow-root target
          referenced by the inner native \`<dialog>\`'s \`aria-labelledby\`
          when the name source lives outside the shadow root. Updated
          imperatively in \`_syncHostAriaSemantics()\`.
        -->
        <span id=${this._consumerLabelId} class="dialog__description" aria-hidden="false"></span>
        <!--
          Synthesized in-shadow span carrying consumer-resolved description
          text. Updated imperatively on every sync. The inner native
          \`<dialog>\`'s \`aria-describedby\` references this span so
          cross-shadow consumer descriptions resolve through the standard
          described-by channel without writing light-DOM ids that cannot
          resolve from inside a shadow root. \`aria-description\` is
          intentionally NEVER written — AccName ignores it whenever
          \`aria-describedby\` is present.
        -->
        <span id=${this._consumerDescId} class="dialog__description" aria-hidden="false"></span>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-dialog': HelixDialog;
  }
  interface HTMLElementEventMap {
    'hx-open': CustomEvent<void>;
    'hx-close': CustomEvent<void>;
    'hx-cancel': CustomEvent<void>;
  }
}
