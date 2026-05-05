import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixToggleButtonStyles } from './hx-toggle-button.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

const _nextToggleButtonId = createIdCounter('hx-toggle-button');

/** Detail for the hx-toggle event dispatched by hx-toggle-button. */
export interface HxToggleDetail {
  pressed: boolean;
}

/**
 * A two-state toggle button that communicates a pressed/unpressed status to
 * assistive technology via `aria-pressed`. Supports multiple visual variants
 * and sizes, prefix/suffix slots, full ElementInternals form association, and
 * a distinct pressed visual state for every variant.
 *
 * @summary Two-state toggle button with pressed/unpressed ARIA semantics.
 *
 * @tag hx-toggle-button
 *
 * @slot - Default slot for the button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{pressed: boolean}>} hx-toggle - Dispatched when the
 *   toggle state changes. Not dispatched when the button is disabled.
 *
 * @csspart button - The native `<button>` element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 *
 * @cssprop [--hx-toggle-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-toggle-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-toggle-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-toggle-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-toggle-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-toggle-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-toggle-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-toggle-button-pressed-bg=var(--hx-color-primary-500)] - Background when pressed (variant-specific fallback applies).
 * @cssprop [--hx-toggle-button-pressed-color=var(--hx-color-neutral-0)] - Text color when pressed (variant-specific fallback applies).
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-filter-brightness-hover] - CSS filter.
 * @cssprop [--hx-filter-brightness-active] - CSS filter.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-primary-700] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-toggle-button')
export class HelixToggleButton extends HelixElement {
  static override styles = [helixToggleButtonStyles, forcedColorsInteractive];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  /** @internal */
  @query('slot:not([name])') private _defaultSlot!: HTMLSlotElement | null;

  // ─── Public Properties ───

  /**
   * Whether the toggle button is in the pressed state.
   * Reflected as an attribute so CSS selectors like `:host([pressed])` work.
   * @attr pressed
   */
  @property({ type: Boolean, reflect: true })
  pressed = false;

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' = 'secondary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. Prevents all interaction and form actions.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Form field name submitted via ElementInternals when the button is pressed.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Form field value submitted via ElementInternals when the button is pressed.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * Accessible label forwarded to the inner `<button>` as `aria-label`.
   * Required for icon-only toggle buttons where no visible text is present.
   * @attr label
   */
  @property({ type: String })
  label: string | undefined = undefined;

  /**
   * When true, the button must be in the pressed state for the form to be submitted.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  // ─── Form API ───

  /** Returns the ValidityState object. */
  override get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Returns the current validation message. */
  override get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Checks whether the button satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * MutationObserver watching the resolved consumer-supplied
   * `aria-labelledby` / `aria-describedby` target elements for in-place text,
   * subtree, and visibility mutations. Without this, an i18n locale change
   * that flips `label.textContent = 'Unmute'` on an external label would
   * leave the toggle announcing the stale name on the no-IDL-ref fallback
   * path until some unrelated structural mutation triggered another sync.
   * Push-gate round-3 F2 (P2, codex 2026-05-05).
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  /**
   * Default-slot text content captured for use as the host's accessible name
   * when no explicit `label`/`aria-label`/`aria-labelledby` is supplied.
   * Codex round-1 finding #9.
   * @internal
   */
  @state() private _slotLabelText: string = '';

  /** No-IDL-ref fallback tokens applied to the inner button. @internal */
  @state() private _fallbackAriaLabelledBy: string | null = null;
  /**
   * Push-gate round-3 F1 (P1, codex 2026-05-05): no longer the consumer's
   * raw light-DOM token list — those IDs are not reachable from inside the
   * shadow root. Instead holds the id of the synthesized in-shadow `<span
   * id=_consumerDescId>` whose text content is the AccName-flattened
   * consumer description, or `null` when no consumer descriptions resolve.
   * @internal
   */
  @state() private _fallbackAriaDescribedBy: string | null = null;
  /** @internal */
  @state() private _fallbackAriaLabel: string | null = null;

  /**
   * Unique instance id used to compose stable shadow-root element ids.
   * @internal
   */
  private _toggleId = _nextToggleButtonId();
  /**
   * ID for the synthesized in-shadow span that mirrors consumer-supplied
   * description text on the no-IDL-ref fallback path. Push-gate round-3 F1
   * (P1, codex 2026-05-05). Light-DOM IDREFs from `aria-describedby` cannot
   * resolve from inside the shadow root, so we text-flatten the resolved
   * elements into this same-root span and append its id to the inner
   * button's aria-describedby chain.
   * @internal
   */
  private _consumerDescId = `${this._toggleId}-consumer-desc`;

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between the modern path (host is the
   * announced surface, inner button is `aria-hidden + tabindex=-1`) and the
   * fallback path (inner button is the announced surface, host is demoted).
   * Codex round-2 finding #2.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /**
   * Tracks whether the host's `tabindex` is managed by the component itself
   * (vs. set explicitly by a consumer). Codex round-14 P2: a consumer-supplied
   * `tabindex` (e.g. roving-tabindex toolbar pattern with `tabindex="-1"`)
   * must survive disabled flips and re-renders. Only re-assert tabindex in
   * `updated()` when the component originally claimed it.
   *
   * Codex round-15 P2 (push-gate F1): observe `tabindex` mutations on the host
   * via `_hostTabindexObserver` so the latch flips back to component-managed
   * when a consumer REMOVES the attribute they previously set. Without this,
   * a roving-tabindex toolbar that sets `tabindex="-1"` and later clears it
   * would leave the host permanently tabindex-less on the modern path.
   * @internal
   */
  private _internalTabindexManaged = false;

  /**
   * Observer for the host's `tabindex` attribute. Watches consumer mutations
   * so the component can release ownership when the consumer sets `tabindex`
   * and reclaim ownership (re-applying the default value) when the consumer
   * removes it. Codex round-15 P2 (push-gate F1).
   * @internal
   */
  private _hostTabindexObserver: MutationObserver | null = null;

  /**
   * Counter of pending self-driven `tabindex` mutations. MutationObserver
   * records arrive as microtasks AFTER `setAttribute` returns, so a counter
   * is required (a synchronous flag would already be false). Codex round-15 P2.
   * @internal
   */
  private _pendingOwnTabindexMutations = 0;

  /**
   * Re-applies the component's default `tabindex` after reclaiming ownership.
   * Codex round-15 P2 (push-gate F1).
   * @internal
   */
  private _applyDefaultTabindex(): void {
    const enabledTabIndex = this._supportsIdrefRefs ? '0' : '-1';
    this._setOwnTabindex(this.disabled ? '-1' : enabledTabIndex);
  }

  /**
   * Component-internal `tabindex` setter that tags the mutation as self-driven
   * so `_hostTabindexObserver` ignores it. No-op when the attribute already
   * matches the requested value. Codex round-15 P2 (push-gate F1).
   * @internal
   */
  private _setOwnTabindex(value: string): void {
    if (this.getAttribute('tabindex') === value) return;
    this._pendingOwnTabindexMutations++;
    this.setAttribute('tabindex', value);
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Detect platform support for IDL element references. Codex round-2
    // finding #2: drives the render-time branch between modern (host
    // announced) and fallback (inner button announced) paths.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Seed root-independent semantics from the moment of connection so AT
    // sees the toggle role + pressed state before the first paint.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #1: host is the canonical announced surface on
    // modern browsers, so the inner `<button>` is demoted via
    // `aria-hidden + tabindex=-1`.
    // Codex round-2 finding #2: on no-IDL-ref browsers the inner button is
    // the announced surface (it carries native button + aria-pressed), so
    // the host is demoted to `tabindex=-1` and lets the inner button own
    // tab order + activation.
    // Codex round-14 P2: only claim ownership of `tabindex` when no consumer
    // value is present. Consumers using roving-tabindex toolbar patterns
    // must be able to set `tabindex="-1"` on the host without it being
    // clobbered on every disabled flip. Note we still claim ownership when
    // disabled — the initial value is `-1` to keep the host out of tab order
    // and `updated()` re-asserts the appropriate value when disabled flips.
    // Codex round-15 P2 (push-gate F1): install the observer BEFORE the
    // connect-time `_setOwnTabindex()` write so the observer sees and properly
    // accounts for that mutation via the pending-counter.
    this._hostTabindexObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== 'attributes' || record.attributeName !== 'tabindex') continue;
        if (this._pendingOwnTabindexMutations > 0) {
          this._pendingOwnTabindexMutations--;
          continue;
        }
        if (this.hasAttribute('tabindex')) {
          this._internalTabindexManaged = false;
        } else {
          this._internalTabindexManaged = true;
          this._applyDefaultTabindex();
        }
      }
    });
    this._hostTabindexObserver.observe(this, {
      attributes: true,
      attributeFilter: ['tabindex'],
      attributeOldValue: true,
    });
    if (!this.hasAttribute('tabindex')) {
      this._internalTabindexManaged = true;
      const enabledTabIndex = this._supportsIdrefRefs ? '0' : '-1';
      this._setOwnTabindex(this.disabled ? '-1' : enabledTabIndex);
    }
    this.addEventListener('keydown', this._handleHostKeyDown);
    this.addEventListener('click', this._handleHostClickRouted);
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleHostKeyDown);
    this.removeEventListener('click', this._handleHostClickRouted);
    // Codex round-13 P2: tear down the assigned-node text observer so a
    // detached host does not receive mutation callbacks from nodes that may
    // outlive it (e.g. lifted out of the slot but kept in the document).
    this._slotTextObserver?.disconnect();
    this._slotTextObserver = null;
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._hostTabindexObserver?.disconnect();
    this._hostTabindexObserver = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
  }

  /**
   * (Re-)installs a `MutationObserver` against the deduped union of
   * consumer-resolved label/description elements. Watches `characterData`,
   * `childList`, `subtree`, and aria-hidden/hidden attribute toggles so any
   * in-place text or visibility mutation triggers a fresh sync. Push-gate
   * round-3 F2 (P2, codex 2026-05-05) — mirrors the hx-time-picker pattern.
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
   * Host-level keydown handler. Active only on the modern path; on the
   * no-IDL-ref fallback the inner `<button>` owns native Space/Enter
   * activation. Codex round-2 finding #2.
   * @internal
   */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    if (e.target !== this) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._invokeToggle();
    }
  };

  /**
   * Host-level click router. The inner `<button>` is `aria-hidden + tabindex=-1`
   * on modern browsers but still receives clicks via mouse activation; toggling
   * is handled by the inner `_handleClick`. Host-level clicks (composed path
   * origin === host) only come from AT activation or programmatic triggers,
   * so we route those to the toggle pipeline.
   *
   * Codex round-2 finding #2: on no-IDL-ref browsers the inner button is the
   * announced surface so this host-level routing is a no-op — AT activation
   * lands on the inner button directly.
   * @internal
   */
  private _handleHostClickRouted = (e: MouseEvent): void => {
    if (this.disabled) return;
    if (!this._supportsIdrefRefs) return;
    // Only fire when the host itself originated the click — inner-button
    // clicks bubble through here too but are handled by `_handleClick`.
    const path = e.composedPath();
    if (path[0] !== this) return;
    this._invokeToggle();
  };

  /** @internal */
  private _invokeToggle(): void {
    this.pressed = !this.pressed;
    this._syncFormValue();
    this.dispatchEvent(
      new CustomEvent<{ pressed: boolean }>('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: this.pressed },
      }),
    );
  }

  /**
   * Moves focus to the announced toggle-button surface. Codex round-1 finding
   * `#1` made the host the canonical focus target on modern engines so AT
   * announces a single widget. Round-7 finding `#9` extends that contract to
   * the no-IDL-ref fallback: when the host is demoted (`tabindex=-1`,
   * role/state cleared on `internals`) the inner `<button>` owns the announced
   * semantics and tab order, so programmatic `focus()` must redirect there —
   * otherwise scripted focus and error recovery land on the demoted host on
   * unsupported engines.
   */
  override focus(options?: FocusOptions): void {
    if (this._supportsIdrefRefs) {
      super.focus(options);
      return;
    }
    this.shadowRoot?.querySelector<HTMLButtonElement>('[part="button"]')?.focus(options);
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);

    // Track default-slot text content so it can serve as the accessible
    // name when no explicit label is set. Codex round-1 finding #9.
    this._captureSlotLabelText();
    // Codex round-13 P2: also observe in-place text mutations on assigned
    // nodes so framework-driven `Mute` → `Unmute` rewrites refresh the
    // cached label without requiring the consumer to swap the node.
    this._installSlotTextObserver();

    if (!this.label) {
      const slot = this._defaultSlot;
      const hasSlotText = slot
        ? slot.assignedNodes({ flatten: true }).some((n) => n.textContent?.trim())
        : false;
      if (!hasSlotText) {
        console.warn(
          '[hx-toggle-button] No accessible label found. Set the `label` attribute or provide slot text content for WCAG 4.1.2 compliance.',
        );
      }
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (
      changedProperties.has('pressed') ||
      changedProperties.has('value') ||
      changedProperties.has('required')
    ) {
      this._syncFormValue();
    }

    if (
      changedProperties.has('disabled') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_supportsIdrefRefs')
    ) {
      // Codex round-2 finding #2: align host tabindex with the chosen
      // announced surface. On no-IDL-ref browsers the inner button owns
      // tab order, so re-enabling the host should leave it `tabindex=-1`.
      // Codex round-14 P2: only re-assert when the component owns tabindex.
      // Consumer-managed values (e.g. roving-tabindex toolbar with `-1`) must
      // not be overwritten on disabled flips or supports-flag transitions.
      if (this._internalTabindexManaged) {
        const enabledTabIndex = this._supportsIdrefRefs ? '0' : '-1';
        this._setOwnTabindex(this.disabled ? '-1' : enabledTabIndex);
      }
    }

    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
  }

  /**
   * Reads the default slot's flattened accessible-name text into
   * `_slotLabelText`. Called from `firstUpdated()` and `slotchange` so
   * host-canonical semantics pick up slotted label text. Codex round-1
   * finding #9.
   *
   * Codex round-15 P2 (push-gate F2): the previous implementation concatenated
   * raw `textContent` from every assigned node, pulling in text from
   * `aria-hidden="true"` and `[hidden]` descendants. Rich labels like
   * `<button><svg aria-hidden="true"><title>icon</title></svg>Save</button>`
   * were announced as "icon Save" instead of "Save". Use the shared
   * `flattenAccName` helper (W3C AccName 1.2 §4.3.10) so hidden subtrees are
   * rejected. Element nodes go through the helper; raw text nodes (top-level
   * text directly assigned to the slot) contribute their own `textContent`.
   * @internal
   */
  private _captureSlotLabelText(): void {
    const slot = this._defaultSlot;
    if (!slot) {
      this._slotLabelText = '';
      return;
    }
    const parts: string[] = [];
    for (const node of slot.assignedNodes({ flatten: true })) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        parts.push(flattenAccName(node as Element));
      } else if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent ?? '');
      }
    }
    this._slotLabelText = parts
      .filter((s) => s.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Watches assigned default-slot nodes for in-place text mutations so the
   * cached `_slotLabelText` (and thus `internals.ariaLabel`) stays in sync
   * when a framework rewrites textContent of an already-assigned node without
   * replacing it. `slotchange` does NOT fire for those mutations, so a
   * separate observer is required. Codex round-13 P2.
   * @internal
   */
  private _slotTextObserver: MutationObserver | null = null;

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * default-slot nodes. Disconnects any prior observer first so detached
   * nodes stop firing into a torn-down host.
   * @internal
   */
  private _installSlotTextObserver(): void {
    this._slotTextObserver?.disconnect();
    const slot = this._defaultSlot;
    if (!slot) {
      this._slotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._captureSlotLabelText();
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes({ flatten: true }).forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
    this._slotTextObserver = observer;
  }

  /** @internal */
  private _handleDefaultSlotChange(): void {
    this._captureSlotLabelText();
    this._syncHostAriaSemantics();
    // Re-tune the in-place text observer over the new assigned-node set
    // (codex round-13 P2).
    this._installSlotTextObserver();
  }

  /**
   * Mirrors toggle-button semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-toggle-button>` reach the announced control. The codex aria-group-2
   * finding identified that the inner shadow `<button>` was the only carrier of
   * the toggle role + pressed state, leaving host-level IDREF tokens stranded
   * across the shadow boundary.
   *
   * The shadow `<button>` keeps `aria-pressed`/`aria-label` mirrored for
   * backwards-compat with existing tests and for browsers without IDL element
   * references; the host is the canonical announced surface.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const externalLabelTokens = this.getAttribute('aria-labelledby');
    const externalDescTokens = this.getAttribute('aria-describedby');
    const labelEls = resolveIdrefTokens(this, externalLabelTokens);
    const descEls = resolveIdrefTokens(this, externalDescTokens);

    // Push-gate round-3 F2 (P2, codex 2026-05-05): observe in-place text /
    // visibility mutations on the resolved external IDREF targets so an
    // i18n `label.textContent` flip refreshes the flattened fallback
    // `aria-label` and the consumer-desc synth span text immediately.
    this._installExternalRefsObserver([...labelEls, ...descEls]);

    // Codex round-35 finding (CR major): `aria-labelledby` is only "effective"
    // when at least one IDREF resolves. A typo or transiently-missing target
    // must NOT erase the visible label — fall back to label/slot text so a
    // visibly-labeled toggle never becomes unnamed.
    const hasEffectiveLabelledBy = labelEls.length > 0;
    let resolvedLabel: string | null;
    if (hostAriaLabel) {
      resolvedLabel = hostAriaLabel;
    } else if (hasEffectiveLabelledBy) {
      resolvedLabel = null;
    } else if (this.label) {
      resolvedLabel = this.label;
    } else {
      // Codex round-1 finding #9: default-slot text becomes the accessible
      // name when no explicit label is provided. Without this, slotted text
      // never reaches the host's announced surface.
      resolvedLabel = this._slotLabelText || null;
    }

    // Codex round-2 finding #2: branch on platform support. Modern path —
    // host carries `role=button` + aria-pressed via ElementInternals.
    // Fallback path — inner native `<button>` is the announced surface; clear
    // host role/state on internals so AT does not double-announce.
    if (this._supportsIdrefRefs) {
      // ─── Modern path ───
      internals.role = 'button';
      internals.ariaPressed = this.pressed ? 'true' : 'false';
      internals.ariaDisabled = this.disabled ? 'true' : 'false';
      // Codex round-1 finding #6: drive aria-invalid from the live ValidityState
      // so a required-but-unpressed toggle is announced as invalid even before
      // any visible affordance renders. `_updateValidity()` calls this method
      // synchronously after every `setValidity()`.
      internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
      internals.ariaLabel = resolvedLabel;

      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;

      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
      // Clear fallbacks when IDL refs are available. Also blank the
      // consumer-desc synth span so it does not double-announce when
      // `ariaDescribedByElements` already carries the resolved consumer
      // description elements directly.
      const consumerDescSpanModern = this.shadowRoot?.getElementById(this._consumerDescId);
      if (consumerDescSpanModern && consumerDescSpanModern.textContent !== '') {
        consumerDescSpanModern.textContent = '';
      }
      this._fallbackAriaLabelledBy = null;
      this._fallbackAriaDescribedBy = null;
      this._fallbackAriaLabel = null;
    } else {
      // ─── Fallback path: inner button is the announced surface ───
      // Round-2 finding #2: round-1 set host role/state via internals AND
      // mirrored aria-* onto the `aria-hidden` inner button — making the
      // mirrored attributes inert. The fix is to clear host role/state and
      // let the inner native `<button>` (rendered without aria-hidden, with
      // `tabindex=0`, with aria-pressed) carry semantics natively.
      internals.role = null;
      internals.ariaPressed = null;
      internals.ariaDisabled = null;
      internals.ariaInvalid = null;
      internals.ariaLabel = null;

      // Push-gate F1 (P1, codex 2026-05-05): on this fallback path the
      // announced surface is the inner shadow `<button>`. The consumer's
      // light-DOM `aria-labelledby` token list is unreachable from inside the
      // shadow root on engines without IDL element refs (Firefox, older
      // Safari), so mirroring those raw IDs onto the inner button leaves the
      // toggle anonymous to AT. Resolve the IDREFs against the host
      // (`labelEls`, computed above), text-flatten them via
      // `flattenAccName()` (W3C AccName 1.2 §4.3.10 — honors aria-hidden /
      // hidden), and write the result as `aria-label` on the inner button
      // instead. When NO consumer IDREFs resolve, fall through to the
      // existing resolvedLabel (host aria-label / property / slot text).
      //
      // Push-gate round-3 F1 (P1, codex 2026-05-05): the original fallback
      // wrote `externalDescTokens` (the raw light-DOM ID list) directly to
      // the inner button's `aria-describedby`. Same cross-shadow defect as
      // labelledby — light-DOM ids are not reachable from inside the shadow
      // root. Mirror the resolved description elements via flattenAccName
      // into a synthesized in-shadow `<span id=_consumerDescId>` and
      // reference that same-root id from the inner button instead.
      this._fallbackAriaLabelledBy = null;
      if (hasEffectiveLabelledBy) {
        const flattened = labelEls
          .map((el) => flattenAccName(el))
          .filter((t) => t.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        this._fallbackAriaLabel =
          flattened || resolvedLabel || this.label || this._slotLabelText || null;
      } else {
        this._fallbackAriaLabel = resolvedLabel;
      }

      // Push-gate round-3 F1: mirror the AccName-flattened consumer
      // description text into the same-root synth span.
      const consumerDescSpan = this.shadowRoot?.getElementById(this._consumerDescId);
      if (descEls.length > 0) {
        const flattenedDesc = descEls
          .map((el) => flattenAccName(el))
          .filter((t) => t.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (consumerDescSpan && consumerDescSpan.textContent !== flattenedDesc) {
          consumerDescSpan.textContent = flattenedDesc;
        }
        this._fallbackAriaDescribedBy = flattenedDesc ? this._consumerDescId : null;
      } else {
        if (consumerDescSpan && consumerDescSpan.textContent !== '') {
          consumerDescSpan.textContent = '';
        }
        this._fallbackAriaDescribedBy = null;
      }
    }
  }

  protected override _onFormReset(): void {
    this.pressed = false;
  }

  protected override _onFormStateRestore(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    this.pressed = typeof state === 'string' && state === 'pressed';
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Private Helpers ───

  /** @internal */
  private _syncFormValue(): void {
    if (this.pressed && this.value !== undefined) {
      // Pass explicit state 'pressed' so formStateRestoreCallback can reliably detect it.
      this._internals.setFormValue(this.value, 'pressed');
    } else {
      this._internals.setFormValue(null);
    }
    this._updateValidity();
  }

  /** @internal */
  private _updateValidity(): void {
    if (this.required && !this.pressed) {
      // Codex round-17 P2: anchor validity UI to the announced surface. On
      // the modern path the host is the canonical announced/focus surface
      // (the inner button is `aria-hidden + tabindex=-1`), so passing the
      // host avoids `reportValidity()` landing focus on a hidden node. On
      // the fallback path the inner button is the announced surface.
      const anchor: HTMLElement | undefined = this._supportsIdrefRefs
        ? this
        : (this.shadowRoot?.querySelector<HTMLElement>('[part="button"]') ?? undefined);
      this._internals.setValidity(
        { valueMissing: true },
        'Please activate this toggle button.',
        anchor,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: keep `internals.ariaInvalid` aligned with the
    // current `ValidityState`.
    this._syncHostAriaSemantics();
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.pressed = !this.pressed;
    this._syncFormValue();

    /**
     * Dispatched when the toggle state changes.
     * @event hx-toggle
     */
    this.dispatchEvent(
      new CustomEvent<{ pressed: boolean }>('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: this.pressed },
      }),
    );

    // Codex round-12 P2: on the modern path the host owns role="button" and
    // tabindex=0; the inner <button tabindex="-1"> is aria-hidden. Native
    // click activation on a `<button>` still focuses it, which would leave
    // `document.activeElement` and AT focus on a hidden node. Move focus to
    // the host so the announced surface is also the focus target.
    if (this._supportsIdrefRefs) {
      this.focus();
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderInner() {
    return html`
      <span part="prefix" class="button__prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="button__label">
        <slot @slotchange=${this._handleDefaultSlotChange}></slot>
      </span>
      <span part="suffix" class="button__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    const classes = {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
      'button--pressed': this.pressed,
    };

    // Codex round-2 finding #2: branch the inner button on platform support.
    // Modern path — host announced, inner button is `aria-hidden + tabindex=-1`.
    // Fallback path — inner native `<button>` is announced (NO aria-hidden,
    // tabindex=0) so consumer-mirrored aria-* attributes resolve through a
    // visible accessibility-tree node and AT can name + activate it natively.
    const innerIsAnnounced = !this._supportsIdrefRefs;
    const innerTabIndex = innerIsAnnounced && !this.disabled ? '0' : '-1';
    // Round-1 finding #8: on no-IDL-ref browsers mirror host aria tokens onto
    // the inner button so it carries an accessible name. On modern browsers
    // we still mirror `label` onto the inner button for non-AT consumers
    // (testing, devtools) — does not affect announced semantics.
    const innerAriaLabel = this._fallbackAriaLabel ?? this.label ?? undefined;
    const innerAriaLabelledBy = this._fallbackAriaLabelledBy ?? undefined;
    const innerAriaDescribedBy = this._fallbackAriaDescribedBy ?? undefined;

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type="button"
        tabindex=${innerTabIndex}
        aria-pressed=${this.pressed ? 'true' : 'false'}
        aria-label=${ifDefined(innerAriaLabel)}
        aria-labelledby=${ifDefined(innerAriaLabelledBy)}
        aria-describedby=${ifDefined(innerAriaDescribedBy)}
        aria-hidden=${innerIsAnnounced ? nothing : 'true'}
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </button>
      <!--
        Push-gate round-3 F1 (P1, codex 2026-05-05): synthesized in-shadow
        mirror of the consumer-resolved description text. On the no-IDL-ref
        fallback path, raw light-DOM aria-describedby IDs cannot resolve
        from inside the shadow root, so _syncHostAriaSemantics() flattens
        the resolved elements via flattenAccName() and writes the result
        here. Its id is appended to the inner button's aria-describedby chain
        when present. On the modern path,
        internals.ariaDescribedByElements carries the elements directly and
        this span is blanked.
      -->
      <span id=${this._consumerDescId} class="toggle-button__sr-only" aria-hidden="false"></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-toggle-button': HelixToggleButton;
  }
}
