import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixTabsStyles } from './hx-tabs.styles.js';
import type { HelixTab } from './hx-tab.js';
import type { HelixTabPanel } from './hx-tab-panel.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

const _nextTabsId = createIdCounter('hx-tabs');

/** Detail for the hx-tab-change event dispatched by hx-tabs. */
export interface HxTabChangeDetail {
  tabId: string;
  index: number;
}

/**
 * A tabbed content organizer that manages a set of `<hx-tab>` and `<hx-tab-panel>` children.
 * Supports horizontal and vertical orientations, automatic and manual activation modes,
 * and full keyboard navigation per the ARIA Authoring Practices Guide.
 *
 * Group 5a host-canonical: `role="tablist"` lives on the host via
 * `_internals.role`. `aria-orientation`, `aria-label`, and consumer
 * `aria-labelledby` resolve through the host. Per-tab `role="tab"` and
 * per-panel `role="tabpanel"` likewise live on their respective hosts.
 *
 * Activation defaults to **manual** per healthcare patterns — keyboard arrow
 * keys move focus only; Enter/Space activates. APG explicitly allows both
 * automatic and manual activation; manual is safer when panels are heavy or
 * announce changes via live regions.
 *
 * @summary Tab container that organizes content into selectable panels.
 *
 * @tag hx-tabs
 *
 * @slot tab - Slot for `<hx-tab>` elements. Rendered inside the tablist.
 * @slot - Default slot for `<hx-tab-panel>` elements.
 *
 * @fires {CustomEvent<{tabId: string, index: number}>} hx-tab-change - Dispatched when the active tab changes.
 *
 * @csspart tablist - The tablist container element.
 * @csspart panels - The panel content container element.
 *
 * @cssprop [--hx-tabs-border-color=var(--hx-color-neutral-200, #D6DBD5)] - Tablist border color.
 * @cssprop [--hx-tabs-border-width=1px] - Tablist border width.
 * @cssprop [--hx-tabs-vertical-width=12rem] - Width of the tablist in vertical orientation.
 * @cssprop [--hx-tabs-gap=0] - Gap between the tablist and panels container.
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
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #6AB1B1)] - Focus ring color for tabs and panels.
 * @cssprop [--hx-tabs-panel-padding=var(--hx-space-4, 1rem)] - Panel inner padding.
 * @cssprop [--hx-tabs-panel-color=var(--hx-color-neutral-700, #313E4B)] - Panel text color.
 * @cssprop [--hx-tabs-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-tabs/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow,Home,End; activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern tabs
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-tabs
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-tabs')
export class HelixTabs extends HelixElement {
  static override styles = [helixTabsStyles, forcedColorsInteractive];

  // ─── Internal ID ───

  /** @internal */
  private _id = _nextTabsId();

  // ─── Properties ───

  /**
   * The layout orientation of the tabs.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Controls how keyboard navigation activates tabs.
   * In `automatic` mode, focus also activates the tab.
   * In `manual` mode, focus moves independently; Space or Enter activates.
   *
   * Group 5a default: `manual` — safer for healthcare patterns where panel
   * content may be heavy or announce updates via live regions. APG explicitly
   * allows both modes; manual avoids disorienting auto-activation when users
   * scan tabs with arrow keys.
   *
   * @attr activation
   */
  @property({ type: String, attribute: 'activation', reflect: true })
  activation: 'manual' | 'automatic' = 'manual';

  /**
   * Accessible label for the tablist. Drives the host `internals.ariaLabel`.
   * Provide a brief description of what the tabs represent (e.g., "Patient
   * record sections"). Consumer `aria-label` / `aria-labelledby` on the host
   * override this property when present.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  // ─── State ───

  /** @internal */
  @state() private _activePanel = '';

  /** @internal */
  @state() private _supportsIdrefRefs = true;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  // ─── Child Accessors ───

  /** @internal */
  private _cachedTabs: HelixTab[] | null = null;
  /** @internal */
  private _cachedPanels: HelixTabPanel[] | null = null;
  /** @internal */
  private _observer: MutationObserver | null = null;
  /**
   * Stores a requested tab index from the `selected-index` attribute before the component
   * has finished its first update (e.g. server-rendered Drupal pages).
   * @internal
   */
  private _pendingIndex: number | null = null;

  // ─── Attribute Observation ───

  static override get observedAttributes(): string[] {
    return [...(super.observedAttributes ?? []), 'selected-index'];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === 'selected-index' && value !== null && old !== value) {
      const index = parseInt(value, 10);
      if (!isNaN(index) && index >= 0) {
        if (this.hasUpdated) {
          // Already initialised — apply immediately
          const tab = this._getTabs()[index];
          if (tab && !tab.disabled) {
            this._activateTab(tab, false);
          }
        } else {
          // Store for application in firstUpdated
          this._pendingIndex = index;
        }
      }
    }
  }

  // ─── Public API ───

  /**
   * Gets or sets the zero-based index of the currently selected tab.
   * Setting this programmatically activates the tab at the given index.
   * Can also be set via the `selected-index` HTML attribute for server-side
   * pre-selection (e.g. Drupal Twig templates).
   */
  get selectedIndex(): number {
    return this._getTabs().findIndex((tab) => tab.panel === this._activePanel);
  }

  set selectedIndex(index: number) {
    const tab = this._getTabs()[index];
    if (tab && !tab.disabled) {
      this._activateTab(tab, true);
    }
  }

  /** @internal */
  private _getTabs(): HelixTab[] {
    if (!this._cachedTabs) {
      this._cachedTabs = Array.from(this.querySelectorAll(':scope > hx-tab')).filter(
        (el): el is HelixTab => el.tagName.toLowerCase() === 'hx-tab',
      );
    }
    return this._cachedTabs;
  }

  /** @internal */
  private _getPanels(): HelixTabPanel[] {
    if (!this._cachedPanels) {
      this._cachedPanels = Array.from(this.querySelectorAll(':scope > hx-tab-panel')).filter(
        (el): el is HelixTabPanel => el.tagName.toLowerCase() === 'hx-tab-panel',
      );
    }
    return this._cachedPanels;
  }

  /** @internal */
  private _getEnabledTabs(): HelixTab[] {
    return this._getTabs().filter((tab) => !tab.disabled);
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    this.addEventListener('hx-tab-select', this._handleTabSelect);
    this.addEventListener('keydown', this._handleKeydown);
    // Watch for panel/name attribute changes on child tabs and panels
    if (typeof MutationObserver !== 'undefined') {
      this._observer = new MutationObserver(() => {
        this._cachedTabs = null;
        this._cachedPanels = null;
        this._syncTabsAndPanels();
      });
      this._observer.observe(this, {
        subtree: false,
        attributeFilter: ['panel', 'name'],
      });
    }
    // Seed host-canonical semantics so the role/label appear before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-tab-select', this._handleTabSelect);
    this.removeEventListener('keydown', this._handleKeydown);
    this._observer?.disconnect();
    this._observer = null;
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override firstUpdated(): void {
    if (this.label === '') {
      devWarn(
        'hx-tabs',
        'No accessible label provided. Set the `label` attribute on hx-tabs to describe what the tabs represent (e.g., "Patient record sections"). An unlabeled tablist violates WCAG 4.1.2.',
      );
    }

    this._syncTabsAndPanels();

    // Apply a pending selected-index (set via HTML attribute before upgrade, e.g. Drupal Twig)
    if (this._pendingIndex !== null) {
      const pendingTab = this._getTabs()[this._pendingIndex];
      this._pendingIndex = null;
      if (pendingTab && !pendingTab.disabled) {
        this._activateTab(pendingTab, false);
        return;
      }
    }

    // Activate the first enabled tab if none is selected
    if (!this._activePanel) {
      const firstEnabled = this._getEnabledTabs()[0];
      if (firstEnabled) {
        this._activateTab(firstEnabled, false);
      }
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if ((changedProperties as Map<PropertyKey, unknown>).has('_activePanel')) {
      this._updateTabsAndPanels();
    }
    if (
      (changedProperties as Map<PropertyKey, unknown>).has('orientation') ||
      (changedProperties as Map<PropertyKey, unknown>).has('label')
    ) {
      this._syncHostAriaSemantics();
    }
  }

  // ─── Host ARIA Sync ───

  /**
   * Mirror tablist semantics onto the host via ElementInternals so consumer-
   * supplied `aria-label`, `aria-labelledby`, and the `label` property all
   * reach the announced control. The host carries `role="tablist"` and the
   * orientation reflects the `orientation` property reactively.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'tablist';
    internals.ariaOrientation = this.orientation;

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
    }

    // Precedence: consumer aria-label > consumer aria-labelledby (resolved) >
    // `label` property. When labelledby resolves on the modern path, the IDL
    // refs above carry the live target; clear ariaLabel so the element refs
    // win. On the fallback path, flatten the labelledby targets to a string.
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (hasEffectiveLabelledBy) {
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      } else {
        internals.ariaLabel =
          labelEls
            .map((el) => flattenAccName(el))
            .filter(Boolean)
            .join(' ') ||
          this.label ||
          null;
      }
    } else {
      internals.ariaLabel = this.label || null;
    }
  }

  // ─── Tab / Panel Sync ───

  /** @internal */
  private _syncTabsAndPanels(): void {
    const tabs = this._getTabs();
    const panels = this._getPanels();

    tabs.forEach((tab, i) => {
      const tabId = tab.id || `hx-tab-${this._id}-${i}`;
      tab.id = tabId;

      // Connect tab to its panel by aria-controls
      const panelName = tab.panel;
      const panel = panels.find((p) => p.name === panelName) ?? panels[i];
      if (panel) {
        const panelId = panel.id || `hx-panel-${this._id}-${i}`;
        panel.id = panelId;
        // String IDREF (legacy fallback path) — the inner button mirrors this
        // when the platform lacks IDL element references.
        tab.controls = panelId;
        // Modern path: project the panel host as an element reference so AT
        // walks across the shadow boundary by reference rather than IDREF.
        tab.setControlsPanel(panel);
        // Project the tab host as the panel's labelledby reference. Cross-
        // shadow naming via IDL element references resolves the tab's
        // accessible name (its slotted label content) without serialization.
        // Legacy fallback: the parent additionally writes a flattened
        // `aria-label` string on the panel host so AT without IDL refs still
        // names the panel.
        panel.setLabelledByTabs([tab]);

        if (!this._supportsIdrefRefs) {
          // Extract only default-slot children (no `slot` attribute) to exclude
          // prefix/suffix slot content (e.g. badge counts) from the panel
          // accessible name (WCAG 1.3.1).
          const tabLabel = Array.from(tab.childNodes)
            .filter(
              (node) =>
                node.nodeType === Node.TEXT_NODE ||
                (node.nodeType === Node.ELEMENT_NODE && !(node as Element).hasAttribute('slot')),
            )
            .map((node) => node.textContent ?? '')
            .join('')
            .trim();
          if (tabLabel) {
            panel.setAttribute('aria-label', tabLabel);
            panel.removeAttribute('aria-labelledby');
          } else {
            // Fall back to aria-labelledby string ID if no text content yet;
            // this gets corrected on the next slotchange.
            panel.setAttribute('aria-labelledby', tabId);
          }
        } else {
          // Modern path: scrub legacy fallback attributes so a previously-
          // mounted-on-legacy panel doesn't leak stale strings.
          panel.removeAttribute('aria-label');
          panel.removeAttribute('aria-labelledby');
        }
      }
    });

    this._updateTabsAndPanels();
  }

  /** @internal */
  private _updateTabsAndPanels(): void {
    const tabs = this._getTabs();
    const panels = this._getPanels();

    tabs.forEach((tab) => {
      const isSelected = tab.panel === this._activePanel;
      tab.selected = isSelected;
      // Single-host roving tabindex (Group 5a): the host is the only focusable
      // surface for the tab. The inner button is `tabindex=-1` and
      // presentational on the modern path. document.activeElement compares
      // directly against the host.
      tab.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.name === this._activePanel;
      if (isActive) {
        panel.removeAttribute('hidden');
        panel.setAttribute('tabindex', '0');
      } else {
        panel.setAttribute('hidden', '');
        panel.setAttribute('tabindex', '-1');
      }
    });
  }

  // ─── Tab Activation ───

  /** @internal */
  private _activateTab(tab: HelixTab, dispatchEvent = true): void {
    if (tab.disabled) {
      return;
    }

    const tabs = this._getTabs();
    const previousPanel = this._activePanel;
    this._activePanel = tab.panel;

    if (dispatchEvent && previousPanel !== this._activePanel) {
      const index = tabs.indexOf(tab);
      /**
       * Dispatched when the active tab changes.
       * @event hx-tab-change
       */
      this.dispatchEvent(
        new CustomEvent<{ tabId: string; index: number }>('hx-tab-change', {
          bubbles: true,
          composed: true,
          detail: { tabId: tab.id, index },
        }),
      );
    }
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleTabSelect = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    e.stopPropagation();
    const tab = e
      .composedPath()
      .find((el): el is HelixTab => el instanceof Element && el.tagName.toLowerCase() === 'hx-tab');
    if (tab) {
      this._activateTab(tab);
      // Host-canonical (Group 5a): hx-tab renders a `div[tabindex="-1"]`
      // rather than a native button, so a click leaves activeElement on
      // whatever the user clicked from. Without an explicit focus call,
      // arrow/Home/End keyboard navigation has no anchor inside the
      // tablist until the user tabs back in. `preventScroll: true` keeps
      // the click from triggering a viewport scroll-into-view that the
      // user did not request — the tab is already in view because the
      // user just clicked it.
      if (!tab.disabled) {
        tab.focus({ preventScroll: true });
      }
    }
  };

  /** @internal */
  private _warnInvalidSlotContent(): void {
    const tabSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="tab"]');
    const panelSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (tabSlot) {
      const invalid = tabSlot
        .assignedElements()
        .filter((el) => el.tagName.toLowerCase() !== 'hx-tab');
      if (invalid.length > 0) {
        devWarn(
          'hx-tabs',
          `Slot "tab" expects <hx-tab> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
        );
      }
    }
    if (panelSlot) {
      const invalid = panelSlot
        .assignedElements()
        .filter((el) => el.tagName.toLowerCase() !== 'hx-tab-panel');
      if (invalid.length > 0) {
        devWarn(
          'hx-tabs',
          `Default slot expects <hx-tab-panel> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
        );
      }
    }
  }

  /** @internal */
  private _handleSlotChange = (): void => {
    this._warnInvalidSlotContent();
    this._cachedTabs = null;
    this._cachedPanels = null;
    this._syncTabsAndPanels();
    // If the active panel was removed, fall back to the first enabled tab
    const panels = this._getPanels();
    const activePanelExists = panels.some((p) => p.name === this._activePanel);
    if (!activePanelExists) {
      const firstEnabled = this._getEnabledTabs()[0];
      if (firstEnabled) {
        this._activateTab(firstEnabled, false);
      } else {
        this._activePanel = '';
      }
    }
  };

  /** @internal */
  private _handleKeydown = (e: KeyboardEvent): void => {
    // Use ALL tabs (including disabled) so keyboard users can discover disabled tabs
    // per ARIA APG tab pattern — disabled tabs receive focus but are not activated.
    const allTabs = this._getTabs();
    if (allTabs.length === 0) {
      return;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    const isNavigationKey = [prevKey, nextKey, 'Home', 'End', ' ', 'Enter'].includes(e.key);
    if (!isNavigationKey) {
      return;
    }

    // Determine focused tab — host-canonical: the host IS the focusable
    // surface, so document.activeElement matches the hx-tab host directly
    // (no shadow-DOM activeElement traversal needed on the modern path).
    // On the legacy fallback path, focus may land on the inner button; the
    // tab host is still the focused element in document.activeElement
    // because the shadow root is closed at the host boundary for outer-tree
    // queries.
    const focusedTab = allTabs.find((tab) => tab === document.activeElement);

    if (e.key === ' ' || e.key === 'Enter') {
      // Only activate if the focused tab is not disabled
      if (focusedTab && !focusedTab.disabled) {
        e.preventDefault();
        this._activateTab(focusedTab);
        focusedTab.focus();
      }
      return;
    }

    e.preventDefault();

    let currentIndex = focusedTab ? allTabs.indexOf(focusedTab) : -1;
    // Fall back to the active tab's index if nothing is focused yet
    if (currentIndex === -1) {
      const activeTab = allTabs.find((tab) => tab.panel === this._activePanel);
      currentIndex = activeTab ? allTabs.indexOf(activeTab) : 0;
    }

    let nextIndex: number;

    if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = allTabs.length - 1;
    } else if (e.key === nextKey) {
      nextIndex = (currentIndex + 1) % allTabs.length;
    } else {
      // prevKey
      nextIndex = currentIndex <= 0 ? allTabs.length - 1 : currentIndex - 1;
    }

    const targetTab = allTabs[nextIndex];
    if (!targetTab) {
      return;
    }

    // Focus the host directly — single-host roving tabindex (Group 5a).
    // The host owns the tab stop; the inner button is presentational.
    targetTab.focus();

    // Only activate in automatic mode if the target tab is not disabled
    if (this.activation === 'automatic' && !targetTab.disabled) {
      this._activateTab(targetTab);
    }
  };

  // ─── Render ───

  override render() {
    return html`
      <div class="tabs">
        <div part="tablist" class="tablist">
          <slot name="tab" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div part="panels" class="panels">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tabs': HelixTabs;
  }
  interface HTMLElementEventMap {
    'hx-tab-change': CustomEvent<{ tabId: string; index: number }>;
  }
}
