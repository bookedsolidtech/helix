import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/body-scroll-lock.js';
import { devWarn } from '../../utils/dev-warn.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixDrawerStyles } from './hx-drawer.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextDrawerId = createIdCounter('hx-drawer');

type DrawerSizePreset = 'sm' | 'md' | 'lg' | 'full';
type DrawerSize = DrawerSizePreset | (string & Record<never, never>);

const DRAWER_SIZE_MAP: Record<DrawerSizePreset, string> = {
  sm: '20rem',
  md: '30rem',
  lg: '40rem',
  full: '100%',
};

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
 * A slide-in drawer panel that can appear from any edge of the viewport.
 * Supports focus trapping, overlay backdrop, keyboard navigation, and full
 * ARIA labelling for enterprise healthcare accessibility requirements.
 *
 * ## Architecture Note: Host-Canonical ARIA (group-4 round-1, Path A)
 *
 * The host carries the announced dialog semantics via `ElementInternals`:
 *
 *   - `internals.role = 'dialog'` (the host IS the dialog surface)
 *   - `internals.ariaModal = 'true'` (modality declared on host)
 *   - `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements`
 *     project consumer light-DOM IDREFs across the shadow boundary.
 *   - `internals.ariaLabel` carries the resolved fallback name when no
 *     IDREF chain or slotted title exists.
 *
 * The inner `<div part="overlay">` no longer carries `role`, `aria-modal`,
 * `aria-labelledby`, or `aria-label` — those would create a nested-dialog
 * announcement above the host's canonical surface. Belt-and-suspenders
 * fallback: when the runtime does NOT expose IDL element references on
 * `ElementInternals` (older Firefox / Safari builds), the resolved label
 * text is text-flattened and written to the inner overlay's `aria-label`
 * so AT walking down from the host still finds an announceable name.
 *
 * Naming precedence (W3C AccName 1.2 §4.3.1):
 *
 *   1. Consumer `aria-labelledby` on the host — IDREFs resolved across the
 *      shadow boundary via `resolveIdrefTokens` (same scope walk used by
 *      every host-canonical hx-* control: own root → ancestor shadow hosts
 *      → owner document → slot owners).
 *   2. Consumer `aria-label` on the host.
 *   3. `<slot name="label">` text content (multi-node aggregation per
 *      AccName 1.2 §4.3.10 — decorative `aria-hidden` / `[hidden]` subtrees
 *      contribute zero to the name).
 *   4. `label` property — explicit author fallback string.
 *   5. Hard-coded literal `"Drawer"` (last-resort accessible name).
 *
 * Description channel: a synthesized `<span id="${id}-consumer-desc">` is
 * rendered inside the shadow root and updated to mirror consumer-resolved
 * description text. The host's `internals.ariaDescribedByElements` carries
 * the live element references on the modern path; the in-shadow span is the
 * fallback target for AT that does not walk IDL refs. `aria-description` is
 * intentionally NEVER written — the W3C AccName algorithm ignores it
 * whenever `aria-describedby` is also present.
 *
 * Slot mutation observers track:
 *   1. The label slot's text content (in-place i18n re-renders).
 *   2. Consumer-resolved external IDREF targets (so a consumer mutating
 *      `<label id="x">Patient</label>` in place re-flows the name).
 *   3. Host attribute mutations (delegated to `installAriaIdrefMirror`,
 *      which also catches late-inserted IDREF targets and id renames in
 *      every relevant root).
 *
 * Focus trap, ESC dismiss, focus-restore, and the inert-outside-content
 * sibling-walk are unchanged from the pre-host-canonical implementation —
 * they operate against the shadow-internal panel which is still the focus
 * target for keyboard users.
 *
 * ## Architecture Note: Native `<dialog>` Migration
 *
 * This component currently uses `role="dialog"` + `aria-modal="true"` on a
 * `<div>` rather than the native `<dialog>` element. This is intentional for
 * the current release because:
 *
 * 1. **SSR compatibility**: Native `<dialog>` requires `showModal()` to activate
 *    its modal behavior (focus trapping, backdrop, top-layer). This JavaScript
 *    call is not available during server-side rendering, which is a primary
 *    consumption pattern for Drupal/Twig templates.
 *
 * 2. **Contained mode**: The `contained` property constrains the drawer to a
 *    positioned parent. Native `<dialog>` in modal mode renders in the top layer
 *    and cannot be constrained to a parent element.
 *
 * 3. **Animation control**: The current CSS transition approach provides precise
 *    control over slide-in/slide-out animations. Native `<dialog>` `::backdrop`
 *    animations have inconsistent cross-browser support.
 *
 * Migration to native `<dialog>` is tracked as a future enhancement. When browser
 * support for `CloseWatcher`, `::backdrop` transitions, and declarative dialog
 * opening stabilizes, this component will be migrated to native semantics.
 *
 * @summary Slide-in panel overlay from any viewport edge.
 *
 * @tag hx-drawer
 *
 * @slot label - The drawer title text.
 * @slot header-actions - Action buttons displayed in the header near the close button.
 * @slot - Default slot for the drawer body content.
 * @slot footer - Action buttons or footer content.
 *
 * @fires {CustomEvent<void>} hx-show - Fired when the drawer begins to open.
 * @fires {CustomEvent<void>} hx-after-show - Fired after the drawer open animation completes.
 * @fires {CustomEvent<void>} hx-hide - Fired when the drawer begins to close.
 * @fires {CustomEvent<void>} hx-after-hide - Fired after the drawer close animation completes.
 * @fires {CustomEvent<void>} hx-initial-focus - Fired when initial focus is set inside the drawer. Cancelable to override focus behavior.
 *
 * **Event naming rationale:** hx-drawer uses the `hx-show`/`hx-hide`/`hx-after-show`/`hx-after-hide`
 * pattern shared by all overlay components (hx-popover, hx-tooltip, hx-dropdown). This differs from
 * hx-dialog's `hx-open`/`hx-close`/`hx-cancel` events, which align with native `<dialog>` semantics.
 * The distinction is intentional: overlays are transient visibility toggles, while dialog is a stateful
 * container with cancel semantics.
 *
 * @csspart overlay - The full-screen overlay container (includes backdrop and panel).
 * @csspart panel - The drawer panel itself.
 * @csspart header - The header region containing the title and actions.
 * @csspart title - The drawer title element.
 * @csspart close-button - The built-in close button.
 * @csspart close-btn - The visually-hidden close button rendered when noHeader is true.
 * @csspart body - The scrollable body region.
 * @csspart footer - The footer region.
 *
 * @attr [label] - Accessible label for the dialog when no visible label slot is provided.
 *
 * @cssprop [--hx-drawer-bg=var(--hx-color-neutral-0)] - Drawer panel background color.
 * @cssprop [--hx-drawer-color=var(--hx-color-neutral-900)] - Drawer panel text color.
 * @cssprop [--hx-drawer-shadow=var(--hx-shadow-xl)] - Drawer panel box shadow.
 * @cssprop [--hx-drawer-backdrop-color=var(--hx-color-neutral-900)] - Backdrop color.
 * @cssprop [--hx-drawer-backdrop-opacity=0.5] - Backdrop opacity.
 * @cssprop [--hx-drawer-header-padding] - Padding inside the header.
 * @cssprop [--hx-drawer-header-border-color=var(--hx-color-neutral-200)] - Header border color.
 * @cssprop [--hx-drawer-title-color=var(--hx-color-neutral-900)] - Title text color.
 * @cssprop [--hx-drawer-body-padding] - Padding inside the body.
 * @cssprop [--hx-drawer-footer-padding] - Padding inside the footer.
 * @cssprop [--hx-drawer-footer-border-color=var(--hx-color-neutral-200)] - Footer border color.
 * @cssprop [--hx-z-index-modal] - Z-index layer.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-duration-slow] - Animation duration.
 * @cssprop [--hx-easing-out] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-shadow-xl] - Box shadow.
 * @cssprop [--hx-drawer-size-md=30rem] - CSS custom property.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-5] - Spacing token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-drawer-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-duration-fast] - Animation duration.
 * @cssprop [--hx-easing-default] - CSS custom property.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-drawer-close-btn-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-space-3] - Spacing token.
 */
@customElement('hx-drawer')
export class HelixDrawer extends HelixElement {
  static override styles = [helixDrawerStyles, forcedColorsSurface];

  // ─── Queries ───

  /**
   * Reference to the overlay element that wraps the backdrop and panel.
   * @internal
   */
  @query('.drawer-overlay')
  private _overlayEl: HTMLElement | null | undefined;

  /**
   * Reference to the drawer panel element used for focus management.
   * @internal
   */
  @query('.drawer-panel')
  private _panelEl: HTMLElement | null | undefined;

  // ─── Internal state ───

  /**
   * Whether the drawer is in the open state and visible to the user.
   * @internal
   */
  @state()
  private _isOpen = false;

  /**
   * Whether the header-actions slot has any assigned content.
   * @internal
   */
  @state()
  private _hasHeaderActionsSlot = false;

  /**
   * Whether the footer slot has any assigned content.
   * @internal
   */
  @state()
  private _hasFooterSlot = false;

  /**
   * Whether the label slot has any assigned content.
   * @internal
   */
  @state()
  private _hasLabelSlot = false;

  /**
   * Cached list of focusable elements within the drawer, used for focus trapping.
   * @internal
   */
  private _cachedFocusableElements: HTMLElement[] = [];
  /**
   * The element that triggered the drawer to open, restored focus when the drawer closes.
   * @internal
   */
  private _triggerElement: HTMLElement | null = null;
  /**
   * Handle for the pending animation end timeout, cleared when the drawer opens or closes again.
   * @internal
   */
  private _animationTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Whether this drawer instance currently holds a body-scroll lock. */
  /** @internal */
  private _hasScrollLock = false;
  /**
   * Elements outside the drawer that were given aria-hidden during open, restored on close.
   * @internal
   */
  private _siblingAriaHiddenElements: Element[] = [];

  /**
   * Unique ID for the title element, used by aria-labelledby to link the dialog to its label.
   * @internal
   */
  private readonly _id = _nextDrawerId();
  /** @internal */
  private readonly _titleId = `${this._id}-title`;
  /**
   * Id of the synthesized in-shadow span that mirrors consumer-resolved
   * description text. Belt-and-suspenders: the host's
   * `internals.ariaDescribedByElements` carries the live element references
   * on the modern path; this in-shadow span is the fallback referenced via
   * `aria-describedby` on the inner overlay so AT that does not walk IDL refs
   * still finds an announceable description.
   * @internal
   */
  private readonly _consumerDescId = `${this._id}-consumer-desc`;

  // ─── Host-canonical ARIA state ───

  /**
   * Test seam: when set to `true` or `false`, overrides the platform
   * `supportsIdrefElementReferences` probe before `connectedCallback`
   * seeds `_supportsIdrefRefs`. Mirrors hx-combobox round-3 finding 4 —
   * tests must select the path BEFORE the host connects so the synthetic
   * environment matches a legacy engine. Production code MUST NOT touch
   * this field. It is `static` so the cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * Whether the runtime exposes IDL element references on ElementInternals.
   * Drives the modern-vs-fallback ARIA projection in `_syncHostAriaSemantics`.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /**
   * Direct references to ALL labellable elements projected into
   * `<slot name="label">`. Aggregates every assigned element so composed
   * labels (e.g. `<svg slot="label" aria-hidden="true">…</svg><span slot="label">Patient</span>`)
   * project the FULL visible label via `internals.ariaLabelledByElements`
   * while `flattenAccName` strips the decorative subtree per AccName 1.2.
   * @internal
   */
  private _slottedLabelEls: Element[] = [];

  /**
   * Flattened text content of the slotted label nodes, used for the no-IDL-ref
   * fallback `internals.ariaLabel` and the legacy inner-overlay `aria-label`.
   * @internal
   */
  @state() private _labelSlotText = '';

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
   * Watches in-place text mutations on the assigned slotted label nodes
   * (e.g. consumer i18n re-renders that mutate `textContent` instead of
   * replacing the node). `slotchange` does NOT fire on descendant text
   * mutations, so this observer is the only signal that keeps the host's
   * accessible name synchronized with the visible label.
   * @internal
   */
  private _labelSlotTextObserver: MutationObserver | null = null;

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
   * Controls whether the drawer is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Which edge of the viewport the drawer slides in from.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: 'start' | 'end' | 'top' | 'bottom' = 'end';

  /**
   * The size of the drawer panel. Use 'sm', 'md', 'lg', 'full', or any valid CSS length.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' | 'full' | (string & Record<never, never>) = 'md';

  /**
   * When true, the drawer is constrained to its positioned parent instead of the viewport.
   * The host element must have `position: relative` (or the library handles it via :host).
   * @attr contained
   */
  @property({ type: Boolean, reflect: true })
  contained = false;

  /**
   * When true, the header (title, header-actions, close button) is hidden.
   * @attr no-header
   */
  @property({ type: Boolean, reflect: true, attribute: 'no-header' })
  noHeader = false;

  /**
   * When true, the footer slot is hidden.
   * @attr no-footer
   */
  @property({ type: Boolean, reflect: true, attribute: 'no-footer' })
  noFooter = false;

  /**
   * Accessible label for the dialog when the `label` slot is not populated.
   * When the `label` slot is used, `aria-labelledby` takes precedence.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /** Accessible label for the built-in close button. Override for localized text. */
  @property({ type: String, attribute: 'label-close' })
  labelClose = 'Close drawer';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-drawer', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as DrawerSize;
    }

    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs.
    const ctor = this.constructor as typeof HelixDrawer;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    // Establish host-canonical ARIA semantics BEFORE first paint. The host
    // carries `role="dialog"` and `aria-modal="true"` via ElementInternals,
    // but ONLY while the drawer is open — a CLOSED drawer is invisible to AT
    // and must not surface a "modal dialog" announcement before the consumer
    // ever flips `open`. Initial state is gated through
    // `_syncHostDialogSemantics()`, which is called from `connectedCallback`
    // (here) and on every `open` change in `updated()`.
    this._syncHostDialogSemantics();

    // Install the dedicated `aria-describedby` retraction observer BEFORE the
    // seeded `_syncHostAriaSemantics()` call below — mirrors hx-combobox
    // round-10 finding 1 — so authentic consumer clears propagate immediately.
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

    // Seed root-independent semantics from connect so the host announces its
    // dialog role + accessible name before first paint. The mirror's initial
    // sync also fires synchronously inside `installAriaIdrefMirror`.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeListeners();
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
    }
    this._restoreBodyScroll();
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._labelSlotTextObserver?.disconnect();
    this._labelSlotTextObserver = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
    this._hostDescribedByObserver?.disconnect();
    this._hostDescribedByObserver = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      // Lift role=dialog + aria-modal onto the host BEFORE the open animation
      // begins so AT announces the dialog surface as it appears; retract
      // them after close so a closed drawer is invisible to the AT tree.
      this._syncHostDialogSemantics();
      if (this.open) {
        this._openDrawer();
      } else {
        this._closeDrawer();
      }
    }

    if (changedProperties.has('size')) {
      this._applySizeVar();
    }

    // Re-sync host ARIA on every update — `label` / `_hasLabelSlot` /
    // `_slottedLabelEls` / `_labelSlotText` / consumer attributes can all
    // change between renders and the projection is the SSOT for AT.
    this._syncHostAriaSemantics();
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    // The native `slotchange` event fires as a microtask after the initial
    // synchronous render. We deliberately do NOT proactively seed
    // `_hasLabelSlot` / `_labelSlotText` from `firstUpdated` because doing so
    // schedules an additional Lit re-render that subtly reorders the
    // promise-chain inside `_openDrawer` (`updateComplete.then(...) →
    // _isOpen = true → updateComplete.then(...) → _setInitialFocus()`). On
    // Chromium that reordering interleaves the inner `is-open` visibility
    // flip with `_setInitialFocus()` and breaks slotted-children focus for
    // consumer test code that calls `.focus()` immediately after the first
    // `updateComplete` (regression: `Focus Trap > traps forward Tab at the
    // last focusable element`). The slotchange handler runs one microtask
    // later and the `_syncHostAriaSemantics()` call from `updated()` picks
    // up the resolved state on the very next paint — close enough that AT
    // never observes the unnamed window. If a future round needs the seed
    // for a stricter timing requirement, re-introduce it here AND update the
    // open-drawer chain to await `_isOpen` activation before the focus
    // restoration test runs (likely needs an extra `updateComplete`).
  }

  // ─── Public Methods ───

  /** Opens the drawer. */
  show(): void {
    this.open = true;
  }

  /** Closes the drawer. */
  hide(): void {
    this.open = false;
  }

  // ─── Private: Size CSS variable ───

  /** @internal */
  private _applySizeVar(): void {
    const resolvedSize = DRAWER_SIZE_MAP[this.size as DrawerSizePreset] ?? this.size;
    this.style.setProperty('--_drawer-size', resolvedSize);
  }

  // ─── Private: Open / Close ───

  /** @internal */
  private _lockBodyScroll(): void {
    if (this.contained || this._hasScrollLock) return;
    // Uses a shared reference-counted lock so that simultaneous hx-dialog / hx-drawer
    // instances don't clobber each other when one closes before the other
    // (see utils/body-scroll-lock.ts).
    lockBodyScroll();
    this._hasScrollLock = true;
  }

  /** @internal */
  private _restoreBodyScroll(): void {
    if (!this._hasScrollLock) return;
    unlockBodyScroll();
    this._hasScrollLock = false;
  }

  /** @internal */
  private _openDrawer(): void {
    // Capture trigger for focus restoration (P2-04: use instanceof guard)
    const active = document.activeElement;
    this._triggerElement = active instanceof HTMLElement ? active : null;

    // P1-05: clear any pending animation timeout before scheduling a new one
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    this._applySizeVar();
    this._lockBodyScroll();
    this._hideBackgroundFromScreenReaders();

    // Dispatch hx-show before visual update
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));

    // Transition to open state
    void this.updateComplete
      .then(() => {
        this._isOpen = true;
        this._addListeners();

        // Set initial focus after next render
        return this.updateComplete;
      })
      .then(() => {
        this._cachedFocusableElements = this._getFocusableElements();
        this._setInitialFocus();

        // Dispatch hx-after-show when the panel's CSS transition completes.
        // If prefers-reduced-motion is active (duration === 0) or the element
        // is missing, fire immediately — transitionend will never fire.
        const duration = this._getAnimationDuration();
        const panel = this._panelEl;
        if (duration === 0 || !panel) {
          this.dispatchEvent(
            new CustomEvent<void>('hx-after-show', { bubbles: true, composed: true }),
          );
        } else {
          const emitAfterShow = () => {
            if (this._animationTimeout !== null) {
              clearTimeout(this._animationTimeout);
              this._animationTimeout = null;
            }
            this.dispatchEvent(
              new CustomEvent<void>('hx-after-show', { bubbles: true, composed: true }),
            );
          };
          panel.addEventListener('transitionend', emitAfterShow, { once: true });
          // Safety fallback: if transitionend never fires (e.g. transition
          // cancelled, element removed), ensure the event is still dispatched.
          this._animationTimeout = setTimeout(emitAfterShow, duration + 50);
        }
      })
      .catch(console.error);
  }

  /** @internal */
  private _closeDrawer(): void {
    // P1-05: clear any pending animation timeout before scheduling a new one
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    this._isOpen = false;
    this._removeListeners();
    this._cachedFocusableElements = [];
    this._restoreBodyScroll();
    this._restoreBackgroundForScreenReaders();

    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));

    // Restore focus to the trigger immediately — before any animation timeout.
    // WCAG 2.4.3: focus must never remain on invisible or inert content.
    if (this._triggerElement && typeof this._triggerElement.focus === 'function') {
      this._triggerElement.focus();
    }
    this._triggerElement = null;

    // Dispatch hx-after-hide when the panel's CSS transition completes.
    // If prefers-reduced-motion is active (duration === 0) or the element
    // is missing, fire immediately — transitionend will never fire.
    const duration = this._getAnimationDuration();
    const panel = this._panelEl;
    if (duration === 0 || !panel) {
      this.dispatchEvent(new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }));
    } else {
      const emitAfterHide = () => {
        if (this._animationTimeout !== null) {
          clearTimeout(this._animationTimeout);
          this._animationTimeout = null;
        }
        this.dispatchEvent(
          new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }),
        );
      };
      panel.addEventListener('transitionend', emitAfterHide, { once: true });
      // Safety fallback: if transitionend never fires (e.g. transition
      // cancelled, element removed), ensure the event is still dispatched.
      this._animationTimeout = setTimeout(emitAfterHide, duration + 50);
    }
  }

  /** @internal */
  private _getAnimationDuration(): number {
    if (typeof window === 'undefined') return 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    return 300;
  }

  // ─── Background aria-hidden management (P1-03) ───

  /** @internal */
  private _hideBackgroundFromScreenReaders(): void {
    if (this.contained) return;
    this._siblingAriaHiddenElements = [];
    // Walk the parent chain once to find which body child is an ancestor of this component.
    // This avoids calling child.contains(this) in a loop (which is O(n * depth)).
    // Starting from parentElement avoids aliasing `this` to a local variable.
    let ancestorBodyChild: Element | null = null;
    let el: Element | null = this.parentElement;
    while (el && el.parentElement !== document.body) {
      el = el.parentElement;
    }
    if (el && el.parentElement === document.body) {
      ancestorBodyChild = el;
    }
    Array.from(document.body.children).forEach((child) => {
      if (child === this || child === ancestorBodyChild) return;
      if (!child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        this._siblingAriaHiddenElements.push(child);
      }
    });
  }

  /** @internal */
  private _restoreBackgroundForScreenReaders(): void {
    this._siblingAriaHiddenElements.forEach((el) => {
      el.removeAttribute('aria-hidden');
    });
    this._siblingAriaHiddenElements = [];
  }

  // ─── Event Listeners (P1-01: use only document listener, not overlay) ───

  /** @internal */
  private _addListeners(): void {
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /** @internal */
  private _removeListeners(): void {
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  // ─── Keyboard Handler ───

  /**
   * Handles keyboard events on the document to trap focus and close the drawer on Escape.
   * @internal
   */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (!this._isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.open = false;
      return;
    }

    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  };

  // ─── Focus ───

  /** @internal */
  private _setInitialFocus(): void {
    const event = new CustomEvent<void>('hx-initial-focus', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);

    if (!event.defaultPrevented) {
      const focusable = this._cachedFocusableElements;
      if (focusable.length > 0 && focusable[0]) {
        focusable[0].focus();
      } else {
        this._panelEl?.focus();
      }
    }
  }

  /** @internal */
  private _getFocusableElements(): HTMLElement[] {
    const shadowFocusable = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [],
    );

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

    return [...shadowFocusable, ...lightFocusable].filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1',
    );
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

    // P1-02: Use document.activeElement for reliable detection of slotted (light DOM) elements.
    // shadowRoot.activeElement returns the <slot> host for slotted content, not the actual element.
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ─── Overlay Click ───

  /**
   * Handles clicks on the overlay backdrop to close the drawer when the user clicks outside the panel.
   * @internal
   */
  private _handleOverlayClick = (e: MouseEvent): void => {
    // Only close when clicking the overlay itself (backdrop), not the panel
    const target = e.target as HTMLElement;
    if (target === this._overlayEl || target.classList.contains('drawer-backdrop')) {
      this.open = false;
    }
  };

  // ─── Slot change handlers ───

  /** @internal */
  private _handleHeaderActionsSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHeaderActionsSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    const state = this._readLabelSlotState(e.target);
    this._hasLabelSlot = state.hasUsefulName;
    this._slottedLabelEls = state.elements;
    this._labelSlotText = state.text;
    this._installLabelSlotTextObserver(state.elements);
    this._syncHostAriaSemantics();
  }

  // ─── Host-canonical ARIA helpers ───

  /**
   * Reads the label slot's assigned nodes and computes the discriminated
   * naming state. Aggregates ALL assigned elements (not just the first) so
   * composed labels project the FULL visible label via
   * `internals.ariaLabelledByElements`. Per AccName 1.2 §4.3.10,
   * `aria-hidden="true"` / `[hidden]` elements contribute zero to the
   * accessible name but stay in `elements` so AT walking IDL refs sees the
   * full visible group. `hasUsefulName` is gated on the flattened text
   * length: a slot containing only decorative wrappers does NOT name the
   * dialog, and the host falls through to the next naming source.
   * @internal
   */
  private _readLabelSlotState(slot: HTMLSlotElement): {
    hasUsefulName: boolean;
    elements: Element[];
    text: string;
  } {
    const nodes = slot.assignedNodes({ flatten: true });
    const elements: Element[] = [];
    const fragments: string[] = [];
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        elements.push(el);
        if (el.getAttribute('aria-hidden') === 'true') continue;
        const elText = flattenAccName(el);
        if (elText) fragments.push(elText);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const txt = (node.textContent ?? '').trim();
        if (txt) fragments.push(txt);
      }
    }
    const trimmedText = fragments.join(' ').replace(/\s+/g, ' ').trim();
    return {
      hasUsefulName: trimmedText.length > 0,
      elements,
      text: trimmedText,
    };
  }

  /**
   * (Re-)installs the mutation observer over the current set of slotted label
   * elements. On any descendant text/visibility mutation we re-flatten and
   * re-sync so the host's accessible name tracks the visible label.
   * @internal
   */
  private _installLabelSlotTextObserver(elements: Element[]): void {
    this._labelSlotTextObserver?.disconnect();
    if (elements.length === 0) {
      this._labelSlotTextObserver = null;
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
      this._labelSlotText = trimmed;
      this._hasLabelSlot = trimmed.length > 0;
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
    this._labelSlotTextObserver = observer;
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
   * Gates `role="dialog"` + `aria-modal="true"` on the host's
   * `ElementInternals` behind the `open` boolean. A closed drawer must NOT
   * surface as a modal dialog to the accessibility tree — otherwise screen
   * readers announce an invisible modal before the consumer ever opens it
   * (regression introduced when the ARIA surface moved from the inner
   * overlay to the host in group-4 round-1).
   *
   * Open  → `role = 'dialog'`, `ariaModal = 'true'`
   * Closed → `role = null`, `ariaModal = null` (cleared from the AT tree)
   *
   * Called from `connectedCallback()` (initial state) and from `updated()`
   * whenever `open` changes. Idempotent: writing the same value twice is a
   * no-op for both AT and the accessibility tree builder.
   * @internal
   */
  private _syncHostDialogSemantics(): void {
    if (this.open) {
      this._internals.role = 'dialog';
      this._internals.ariaModal = 'true';
    } else {
      this._internals.role = null;
      this._internals.ariaModal = null;
    }
  }

  /**
   * Resolves consumer-supplied label/description IDREFs on the host and
   * projects the canonical dialog ARIA onto the **host** via
   * `ElementInternals` (modern path) and onto the inner overlay via attribute
   * writes (fallback path).
   *
   * Cross-shadow naming is belt-and-suspenders:
   *
   *   1. **Modern path** (`_supportsIdrefRefs === true`): consumer-resolved
   *      label/description elements are written onto
   *      `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements`
   *      on the host. AT walking the host's accessibility tree finds them
   *      across the shadow boundary. `internals.ariaLabel` carries the
   *      flattened text fallback (only when no labelledby resolves) so AT
   *      that does not walk IDL refs still announces a name.
   *   2. **Fallback path** (`_supportsIdrefRefs === false`): the resolved
   *      element text is flattened and written to `internals.ariaLabel` AND
   *      mirrored to the inner overlay's `aria-label`.
   *
   * The synthesized `<span id="${_consumerDescId}">` mirrors the resolved
   * description text on every sync. The inner overlay's `aria-describedby`
   * chains the in-shadow span. `aria-description` is intentionally NEVER
   * written — W3C AccName ignores it whenever `aria-describedby` is set.
   *
   * Naming precedence (W3C AccName 1.2 §4.3.1):
   *   1. Consumer `aria-labelledby` (resolved IDREFs, text-flattened)
   *   2. Consumer `aria-label`
   *   3. Slotted `<slot name="label">` text
   *   4. `label` property
   *   5. Hard-coded `"Drawer"`
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    // The host's canonical role + modal flag are managed separately by
    // `_syncHostDialogSemantics()` — they are gated on `this.open` so a
    // CLOSED drawer is invisible to the accessibility tree (no orphan
    // `role="dialog"` / `aria-modal="true"` before the consumer flips open).
    // Naming/description state below is independent of open-state because
    // the resolved label still composes correctly while closed and the
    // dialog surface only becomes visible to AT when role/aria-modal lift.

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
    // Slotted-title elements feed in only when no consumer aria-labelledby
    // resolved (AccName 1.2 precedence: external > slot > property).
    const labelElsForInternals: Element[] = [];
    labelElsForInternals.push(...consumerLabelEls.filter(isVisibleForAccName));
    if (!hasEffectiveLabelledBy && !hostAriaLabel && this._hasLabelSlot) {
      // Aggregate every slotted label element so AT composes icon + text.
      labelElsForInternals.push(...this._slottedLabelEls.filter(isVisibleForAccName));
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
    if (!resolvedName && this._hasLabelSlot && this._labelSlotText) {
      resolvedName = this._labelSlotText;
    }
    if (!resolvedName && this.label) {
      resolvedName = this.label;
    }
    if (!resolvedName) {
      // Last-resort literal — preserves the pre-host-canonical default so an
      // unlabeled drawer still has SOME announced name. Consumer responsibility
      // to provide a meaningful one in real usage.
      resolvedName = 'Drawer';
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
    // inner overlay's `aria-describedby` resolves cross-shadow without
    // pointing at light-DOM ids (which do not resolve from inside a shadow
    // root). `aria-description` is intentionally NEVER written.
    const consumerDescSpan = this.shadowRoot?.getElementById(this._consumerDescId) ?? null;
    const consumerDescText = flattenText(consumerDescEls);
    if (consumerDescSpan && consumerDescSpan.textContent !== consumerDescText) {
      consumerDescSpan.textContent = consumerDescText;
    }

    // ─── Inner overlay attribute reconciliation ───
    // The overlay no longer carries `role` / `aria-modal` / `aria-labelledby`
    // / `aria-label` on the modern path — the host owns those via internals.
    // Strip stale attributes defensively in case an earlier sync wrote them
    // and reconcile the fallback `aria-label` only when IDL refs are not
    // supported (so screen readers walking the inner overlay still find a
    // name on legacy engines).
    const overlay = this._overlayEl ?? null;
    if (overlay) {
      // Belt-and-suspenders: never write `role` / `aria-modal` to the inner
      // overlay on either path — that would create nested-dialog semantics
      // above the host's canonical surface.
      if (overlay.hasAttribute('role')) overlay.removeAttribute('role');
      if (overlay.hasAttribute('aria-modal')) overlay.removeAttribute('aria-modal');
      // Internal slotted-title id on the SAME shadow root resolves cleanly,
      // so we project it onto the overlay's `aria-labelledby` only on the
      // fallback path. The modern path uses `internals.ariaLabelledByElements`.
      const wantOverlayLabelledBy =
        !this._supportsIdrefRefs && this._hasLabelSlot ? this._titleId : null;
      const wantOverlayLabel =
        !this._supportsIdrefRefs && !wantOverlayLabelledBy ? resolvedName : null;
      if (wantOverlayLabelledBy) {
        if (overlay.getAttribute('aria-labelledby') !== wantOverlayLabelledBy) {
          overlay.setAttribute('aria-labelledby', wantOverlayLabelledBy);
        }
      } else if (overlay.hasAttribute('aria-labelledby')) {
        overlay.removeAttribute('aria-labelledby');
      }
      if (wantOverlayLabel) {
        if (overlay.getAttribute('aria-label') !== wantOverlayLabel) {
          overlay.setAttribute('aria-label', wantOverlayLabel);
        }
      } else if (overlay.hasAttribute('aria-label')) {
        overlay.removeAttribute('aria-label');
      }

      // Inner overlay's `aria-describedby` chains the in-shadow consumer-desc
      // span. Same-root id resolves cleanly; cross-shadow consumer ids are
      // ignored at the AT level (light-DOM ids do not resolve from inside a
      // shadow root) so we never write them directly.
      if (consumerDescText && consumerDescSpan) {
        const value = this._consumerDescId;
        if (overlay.getAttribute('aria-describedby') !== value) {
          overlay.setAttribute('aria-describedby', value);
        }
      } else if (overlay.hasAttribute('aria-describedby')) {
        overlay.removeAttribute('aria-describedby');
      }

      // Forced-colors: the host has display: contents so :host(:focus-visible)
      // has no painting surface — focus is on the inner panel. The existing
      // `forcedColorsSurface` mixin paints the host CanvasText border which
      // the panel inherits via the parent box. No change owed here, but if a
      // future change makes the host focusable directly we'd add the rule.
    }

    // Strip `aria-description` defensively — never written on either path.
    if (overlay && overlay.hasAttribute('aria-description')) {
      overlay.removeAttribute('aria-description');
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderHeader() {
    if (this.noHeader) {
      // WCAG 4.1.2: When the header is hidden there must still be a reachable close
      // mechanism for keyboard and mouse/touch users. Render a visually-hidden close
      // button that is focusable and announced by screen readers.
      return html`
        <button
          part="close-btn"
          class="drawer-close-button drawer-close-button--sr-only"
          aria-label=${this.labelClose}
          @click=${() => {
            this.open = false;
          }}
        ></button>
      `;
    }

    return html`
      <div part="header" class="drawer-header">
        <h2 part="title" id=${this._titleId} class="drawer-title">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}></slot>
        </h2>
        <div class="drawer-header-actions">
          ${this._hasHeaderActionsSlot
            ? html`<slot
                name="header-actions"
                @slotchange=${this._handleHeaderActionsSlotChange}
              ></slot>`
            : html`<slot
                name="header-actions"
                @slotchange=${this._handleHeaderActionsSlotChange}
                style="display:none"
              ></slot>`}
          <button
            part="close-button"
            class="drawer-close-button"
            aria-label=${this.labelClose}
            @click=${() => {
              this.open = false;
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /** @internal */
  private _renderFooter() {
    if (this.noFooter) return nothing;

    return html`
      <div part="footer" class="drawer-footer" ?hidden=${!this._hasFooterSlot}>
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }

  // ─── Render ───

  override render() {
    const overlayClasses = {
      'drawer-overlay': true,
      'is-open': this._isOpen,
    };

    // Host-canonical: the inner overlay carries NO `role` / `aria-modal` /
    // `aria-labelledby` / `aria-label` here. Those are projected onto the
    // host via `ElementInternals` in `_syncHostAriaSemantics()`. On the
    // legacy (no-IDL-ref) fallback path the sync method imperatively writes
    // `aria-label` / `aria-labelledby` onto the overlay so AT walking down
    // from the host still finds an announceable name.
    return html`
      <div
        part="overlay"
        class=${classMap(overlayClasses)}
        tabindex="-1"
        @click=${this._handleOverlayClick}
      >
        <div class="drawer-backdrop" aria-hidden="true"></div>
        <div part="panel" class="drawer-panel" tabindex="-1">
          ${this._renderHeader()}
          <div part="body" class="drawer-body">
            <slot></slot>
          </div>
          ${this._renderFooter()}
        </div>
        <!--
          Synthesized in-shadow span carrying consumer-resolved description
          text. Updated imperatively on every sync. The inner overlay's
          \`aria-describedby\` references this span so cross-shadow consumer
          descriptions resolve through the standard described-by channel
          without writing light-DOM ids that cannot resolve from inside a
          shadow root. \`aria-description\` is intentionally NEVER written —
          AccName ignores it whenever \`aria-describedby\` is present.
        -->
        <span id=${this._consumerDescId} class="drawer-sr-only" aria-hidden="false"></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-drawer': HelixDrawer;
  }
  interface HTMLElementEventMap {
    'hx-show': CustomEvent<void>;
    'hx-after-show': CustomEvent<void>;
    'hx-hide': CustomEvent<void>;
    'hx-after-hide': CustomEvent<void>;
    'hx-initial-focus': CustomEvent<void>;
  }
}
