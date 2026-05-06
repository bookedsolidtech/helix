import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { helixTabPanelStyles } from './hx-tab-panel.styles.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

/**
 * A content panel associated with an `<hx-tab>`, managed by a parent `<hx-tabs>`.
 * Group 5a host-canonical: `role="tabpanel"` lives on the host via
 * `_internals.role`. The host carries the canonical AT surface — consumer
 * `aria-labelledby` / `aria-describedby` on the host resolve through the
 * shared IDREF mirror. The parent `hx-tabs` writes `internals.ariaLabelledByElements`
 * referencing the corresponding `<hx-tab>` host so cross-shadow naming works
 * via IDL element references (the modern path) without serializing tab text.
 *
 * @summary Tab content panel shown when its corresponding tab is selected.
 *
 * @tag hx-tab-panel
 *
 * @slot - Default slot for panel content.
 *
 * @csspart panel - The panel content wrapper.
 *
 * @cssprop [--hx-tabs-panel-padding=var(--hx-space-4, 1rem)] - Panel inner padding.
 * @cssprop [--hx-tabs-panel-color=var(--hx-color-neutral-700, #313E4B)] - Panel text color.
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #6AB1B1)] - Focus ring color.
 */
@customElement('hx-tab-panel')
export class HelixTabPanel extends HelixElement {
  static override styles = [helixTabPanelStyles, forcedColorsField];

  // ─── Properties ───

  /**
   * The name that corresponds to the `panel` attribute on the associated `<hx-tab>`.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  // ─── Host-canonical ARIA bookkeeping ───

  /**
   * Element references for the controlling `<hx-tab>` host(s). Set by the
   * parent `<hx-tabs>` via `setLabelledByTabs()` and projected onto
   * `internals.ariaLabelledByElements` so cross-shadow naming via IDL element
   * references resolves to the live tab host without flattening text.
   * @internal
   */
  private _labelledByTabs: Element[] = [];

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Host-canonical role via ElementInternals — replaces the imperative
    // setAttribute('role', 'tabpanel') from pre-aria-group-5 code.
    this._internals.role = 'tabpanel';
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
    this._syncHostAriaSemantics();
  }

  /**
   * Set by `<hx-tabs>` whenever the tab→panel relationship is recomputed.
   * Drives `internals.ariaLabelledByElements` so AT walks across the shadow
   * boundary to the announcing tab host(s) by element reference rather than
   * IDREF string. Pass an empty array to clear.
   * @internal
   */
  setLabelledByTabs(tabs: Element[]): void {
    this._labelledByTabs = tabs;
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    // Re-assert role on every sync so a stale connect path doesn't leave the
    // panel role-less if internals are accessed before connect (e.g. tests).
    internals.role = 'tabpanel';

    // Resolve consumer-supplied IDREFs — host-canonical: light-DOM aria-labelledby
    // / aria-describedby on `<hx-tab-panel>` should reach the announced surface.
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const consumerDescribedBy = this.getAttribute('aria-describedby');
    const consumerLabelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const consumerDescEls = resolveIdrefTokens(this, consumerDescribedBy);

    // Host aria-label, if explicitly provided by the consumer, wins.
    const hostAriaLabel = this.getAttribute('aria-label');

    // Build the labelledBy element list: consumer takes precedence; otherwise
    // fall back to the parent-projected `<hx-tab>` host references so the
    // panel announces with the tab's accessible name without text flattening.
    const labelEls: Element[] =
      consumerLabelEls.length > 0 ? consumerLabelEls : [...this._labelledByTabs];

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
      ariaDescribedByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;
      refsInternals.ariaDescribedByElements = consumerDescEls.length > 0 ? consumerDescEls : null;
      // Modern path: the consumer's `aria-label` (if any) wins via internals.
      // When absent, leave it null so the element-references path supplies the name.
      internals.ariaLabel = hostAriaLabel && hostAriaLabel.trim() ? hostAriaLabel : null;
    } else {
      // No-IDL-ref fallback: cross-shadow tab→panel naming via element refs is
      // unavailable. The parent `hx-tabs` mirrors a serialized `aria-label`
      // string onto the host attribute (legacy fallback) — leave that in
      // place. Consumer `aria-label` overrides via internals string.
      internals.ariaLabel = hostAriaLabel && hostAriaLabel.trim() ? hostAriaLabel : null;
    }
  }

  // ─── Render ───

  override render() {
    return html`
      <div part="panel" class="panel">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tab-panel': HelixTabPanel;
  }
}
