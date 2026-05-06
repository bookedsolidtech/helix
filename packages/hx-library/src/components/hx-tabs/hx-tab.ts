import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixTabStyles } from './hx-tab.styles.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * An individual tab button, designed to be used inside an `<hx-tabs>` container.
 * Must be placed in the `tab` named slot of `<hx-tabs>`.
 *
 * Group 5a host-canonical: `role="tab"` lives on the **host** via
 * `_internals.role`. The host is the focusable surface (carries the roving
 * tabindex); the inner `<button>` retains click activation semantics
 * (Enter/Space and pointer events) but is no longer the AT-announced surface
 * — its role and ARIA state are stripped on the modern path so the host's
 * canonical surface wins. `internals.ariaSelected`, `ariaDisabled`, and
 * `ariaControlsElements` mirror reactive state. The host `aria-label` /
 * `aria-labelledby` resolved via the shared IDREF mirror name the tab
 * cross-shadow.
 *
 * @summary Presentational tab button that activates a corresponding panel.
 *
 * @tag hx-tab
 *
 * @slot - Default slot for the tab label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @csspart tab - The underlying button element.
 * @csspart prefix - The container for prefix slot content (e.g. icons).
 * @csspart suffix - The container for suffix slot content (e.g. badges).
 *
 * @cssprop [--hx-tabs-tab-color=var(--hx-color-neutral-600, #4A5362)] - Inactive tab text color.
 * @cssprop [--hx-tabs-tab-active-color=var(--hx-color-primary-600, #0F7078)] - Active tab text color.
 * @cssprop [--hx-tabs-tab-hover-color=var(--hx-color-neutral-800, #202B39)] - Tab hover text color.
 * @cssprop [--hx-tabs-tab-hover-bg=var(--hx-color-neutral-50, #F5F8F3)] - Tab hover background.
 * @cssprop [--hx-tabs-tab-font-size=var(--hx-font-size-md, 1rem)] - Tab font size.
 * @cssprop [--hx-tabs-tab-font-weight=var(--hx-font-weight-medium, 500)] - Tab font weight.
 * @cssprop [--hx-tabs-tab-active-font-weight=var(--hx-font-weight-semibold, 600)] - Active tab font weight.
 * @cssprop [--hx-tabs-tab-padding-x=var(--hx-space-4, 1rem)] - Horizontal tab padding.
 * @cssprop [--hx-tabs-tab-padding-y=var(--hx-space-2, 0.5rem)] - Vertical tab padding.
 * @cssprop [--hx-tabs-indicator-color=var(--hx-color-primary-500, #429797)] - Active indicator color.
 * @cssprop [--hx-tabs-indicator-size=2px] - Active indicator thickness.
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #6AB1B1)] - Focus ring color.
 */
@customElement('hx-tab')
export class HelixTab extends HelixElement {
  static override styles = [helixTabStyles, forcedColorsInteractive];

  // ─── Properties ───

  /**
   * The name of the `<hx-tab-panel>` this tab controls. Must match the `name`
   * attribute on the corresponding `<hx-tab-panel>`.
   * @attr panel
   */
  @property({ type: String, reflect: true })
  panel = '';

  /**
   * Whether this tab is currently selected. Managed by the parent `<hx-tabs>`.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * Whether this tab is disabled. Prevents selection and keyboard navigation.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The id of the panel this tab controls. Set by the parent `<hx-tabs>` to
   * establish the aria-controls relationship via element references on the
   * host (modern path) or as a string fallback (legacy path).
   * @internal
   */
  @property({ type: String, attribute: false })
  controls = '';

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  @state() private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Element reference for the controlled `<hx-tab-panel>` host. Set by the
   * parent `<hx-tabs>` via `setControlsPanel()` and projected onto
   * `internals.ariaControlsElements` so cross-shadow controls resolution
   * works via IDL element references. Falls through to the `controls`
   * string property on the legacy path.
   * @internal
   */
  private _controlledPanel: Element | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    if (!this.closest('hx-tabs')) {
      devWarn('hx-tab', 'hx-tab must be a direct child of hx-tabs to function correctly.');
    }
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('selected') ||
      changedProperties.has('disabled') ||
      changedProperties.has('controls') ||
      changedProperties.has('panel')
    ) {
      this._syncHostAriaSemantics();
    }
  }

  /**
   * Set by `<hx-tabs>` whenever the tab→panel relationship is recomputed.
   * Drives `internals.ariaControlsElements` (modern path) so AT walks across
   * the shadow boundary to the controlled panel by element reference.
   * @internal
   */
  setControlsPanel(panel: Element | null): void {
    this._controlledPanel = panel;
    this._syncHostAriaSemantics();
  }

  /**
   * Mirror reactive ARIA state onto ElementInternals on the **host**. The
   * inner `<button>` no longer carries role/aria-* on the modern path — the
   * host is the canonical AT-announced surface. The button stays as the
   * activation surface (Enter/Space/click) but is `tabindex=-1` and
   * presentational from AT's perspective.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'tab';
    internals.ariaSelected = this.selected ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : null;

    // ariaControls — modern path uses element references; legacy path falls
    // back to a string IDREF (set on the host element directly via
    // setAttribute below so AT that does not implement element references
    // still has a token to walk).
    type InternalsWithRefs = ElementInternals & {
      ariaControlsElements: Element[] | null;
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaControlsElements = this._controlledPanel ? [this._controlledPanel] : null;
    }

    // Resolve consumer host aria-labelledby / aria-label so the tab announces
    // with the consumer's chosen name when present. Default name comes from
    // the slotted text content (handled by AT walking the host's children
    // through the shadow slot — works for accessible name computation in
    // modern engines because the host carries the role).
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const hostAriaLabel = this.getAttribute('aria-label');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;
    }

    if (hostAriaLabel && hostAriaLabel.trim()) {
      internals.ariaLabel = hostAriaLabel;
    } else if (!this._supportsIdrefRefs && labelEls.length > 0) {
      // Legacy fallback: flatten consumer aria-labelledby targets into a
      // string so AT without IDL refs still names the tab.
      internals.ariaLabel =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') || null;
    } else {
      internals.ariaLabel = null;
    }
  }

  // ─── Slot Visibility ───

  /** @internal */
  @state() private _hasPrefixSlot = false;
  /** @internal */
  @state() private _hasSuffixSlot = false;

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(): void {
    if (this.disabled) {
      return;
    }
    /**
     * Internal event dispatched to signal tab selection to the parent container.
     * Not part of the public API.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent<{ panel: string }>('hx-tab-select', {
        bubbles: true,
        composed: true,
        detail: { panel: this.panel },
      }),
    );
  }

  /** @internal */
  private _handlePrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasPrefixSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleSuffixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSuffixSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render ───

  override render() {
    // Host-canonical Path A: `role="tab"`, `aria-selected`, `aria-disabled`,
    // and `aria-controls` are projected onto the HOST via `_internals` —
    // NOT on the inner button. The inner button is the activation surface
    // (Enter/Space/click) but is presentational from AT's perspective:
    // tabindex=-1 keeps focus on the host (which carries the roving tabindex
    // managed by `<hx-tabs>`), and no role/aria-* attributes leak through.
    //
    // Legacy fallback: when the platform lacks IDL element references on
    // ElementInternals, mirror `aria-controls` as a string IDREF on the host
    // so AT that walks string tokens still resolves the panel relationship.
    if (!this._supportsIdrefRefs && this.controls) {
      this.setAttribute('aria-controls', this.controls);
    } else if (this._supportsIdrefRefs && this.hasAttribute('aria-controls')) {
      this.removeAttribute('aria-controls');
    }

    // Modern path: the inner element is a presentational <div> click
    // surface — no native button semantics to leak to AT alongside the
    // host's `role="tab"`. ARIA 1.2 forbids `role="presentation"` on
    // focusable elements, so the cleanest strip is to use a non-button
    // tag. Click handler still fires; keyboard activation is owned by the
    // parent `<hx-tabs>` keydown handler operating on the host (which
    // carries the canonical `role="tab"` + roving tabindex).
    //
    // Legacy fallback (no IDL element references): keep the `<button>`
    // with `role="tab"` and ARIA state on the button, since `_internals`
    // can't expose element-references on engines without that API. The
    // host attribute mirror (this.controls → aria-controls string) is
    // applied above for AT that walks string IDREFs.
    if (this._supportsIdrefRefs) {
      // `aria-disabled` is mirrored on the inner element so axe-core's
      // color-contrast rule recognizes the disabled state and excludes the
      // surface from contrast checks (axe excludes `aria-disabled="true"`
      // elements). The HOST is the canonical AT surface — its
      // `internals.ariaDisabled` is what AT announces; this attribute on the
      // inner div is a presentational signal for static analyzers and CSS.
      return html`
        <div
          part="tab"
          class="tab"
          tabindex="-1"
          aria-disabled=${this.disabled ? 'true' : nothing}
          @click=${this._handleClick}
        >
          <span part="prefix" class="tab__prefix" ?hidden=${!this._hasPrefixSlot}>
            <slot name="prefix" @slotchange=${this._handlePrefixSlotChange}></slot>
          </span>
          <slot></slot>
          <span part="suffix" class="tab__suffix" ?hidden=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${this._handleSuffixSlotChange}></slot>
          </span>
        </div>
      `;
    }

    return html`
      <button
        part="tab"
        class="tab"
        role="tab"
        tabindex="-1"
        aria-selected=${this.selected ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-controls=${this.controls || nothing}
        @click=${this._handleClick}
      >
        <span part="prefix" class="tab__prefix" ?hidden=${!this._hasPrefixSlot}>
          <slot name="prefix" @slotchange=${this._handlePrefixSlotChange}></slot>
        </span>
        <slot></slot>
        <span part="suffix" class="tab__suffix" ?hidden=${!this._hasSuffixSlot}>
          <slot name="suffix" @slotchange=${this._handleSuffixSlotChange}></slot>
        </span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tab': HelixTab;
  }
}
