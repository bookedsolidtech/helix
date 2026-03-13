import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixTabsStyles } from './hx-tabs.styles.js';
import type { HelixTab } from './hx-tab.js';
import type { HelixTabPanel } from './hx-tab-panel.js';

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
let _hxTabsIdCounter = 0;

/**
 * A tabbed content organizer that manages a set of `<hx-tab>` and `<hx-tab-panel>` children.
 * Supports horizontal and vertical orientations, automatic and manual activation modes,
 * and full keyboard navigation per the ARIA Authoring Practices Guide.
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
 * @cssprop [--hx-tabs-border-color=var(--hx-color-neutral-200, #e9ecef)] - Tablist border color.
 * @cssprop [--hx-tabs-border-width=1px] - Tablist border width.
 * @cssprop [--hx-tabs-vertical-width=12rem] - Width of the tablist in vertical orientation.
 * @cssprop [--hx-tabs-gap=0] - Gap between the tablist and panels container.
 * @cssprop [--hx-tabs-tab-color=var(--hx-color-neutral-600, #495057)] - Inactive tab text color.
 * @cssprop [--hx-tabs-tab-active-color=var(--hx-color-primary-600, #1d4ed8)] - Active tab text color.
 * @cssprop [--hx-tabs-tab-hover-color=var(--hx-color-neutral-800, #212529)] - Tab hover text color.
 * @cssprop [--hx-tabs-tab-hover-bg=var(--hx-color-neutral-50, #f8f9fa)] - Tab hover background.
 * @cssprop [--hx-tabs-tab-font-size=var(--hx-font-size-md, 1rem)] - Tab font size.
 * @cssprop [--hx-tabs-tab-font-weight=var(--hx-font-weight-medium, 500)] - Tab font weight.
 * @cssprop [--hx-tabs-tab-active-font-weight=var(--hx-font-weight-semibold, 600)] - Active tab font weight.
 * @cssprop [--hx-tabs-tab-padding-x=var(--hx-space-4, 1rem)] - Horizontal tab padding.
 * @cssprop [--hx-tabs-tab-padding-y=var(--hx-space-2, 0.5rem)] - Vertical tab padding.
 * @cssprop [--hx-tabs-indicator-color=var(--hx-color-primary-500, #2563eb)] - Active indicator color.
 * @cssprop [--hx-tabs-indicator-size=2px] - Active indicator thickness.
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #2563eb)] - Focus ring color for tabs and panels.
 * @cssprop [--hx-tabs-panel-padding=var(--hx-space-4, 1rem)] - Panel inner padding.
 * @cssprop [--hx-tabs-panel-color=var(--hx-color-neutral-700, #343a40)] - Panel text color.
 */
@customElement('hx-tabs')
export class HelixTabs extends LitElement {
  static override styles = [tokenStyles, helixTabsStyles];

  // ─── Internal ID ───

  /** @internal */
  private _id = `hx-tabs-${++_hxTabsIdCounter}`;

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
   * @attr activation
   */
  @property({ type: String, attribute: 'activation', reflect: true })
  activation: 'manual' | 'automatic' = 'automatic';

  /**
   * Accessible label for the tablist. Rendered as `aria-label` on the tablist container.
   * Provide a brief description of what the tabs represent (e.g., "Patient record sections").
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  // ─── State ───

  /** @internal */
  @state() private _activePanel = '';

  // ─── Child Accessors ───

  /** @internal */
  private _cachedTabs: HelixTab[] | null = null;
  /** @internal */
  private _cachedPanels: HelixTabPanel[] | null = null;
  /** @internal */
  private _observer: MutationObserver | null = null;

  // ─── Public API ───

  /**
   * Gets or sets the zero-based index of the currently selected tab.
   * Setting this programmatically activates the tab at the given index.
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

  private _getTabs(): HelixTab[] {
    if (!this._cachedTabs) {
      this._cachedTabs = Array.from(this.querySelectorAll(':scope > hx-tab')) as HelixTab[];
    }
    return this._cachedTabs;
  }

  private _getPanels(): HelixTabPanel[] {
    if (!this._cachedPanels) {
      this._cachedPanels = Array.from(
        this.querySelectorAll(':scope > hx-tab-panel'),
      ) as HelixTabPanel[];
    }
    return this._cachedPanels;
  }

  private _getEnabledTabs(): HelixTab[] {
    return this._getTabs().filter((tab) => !tab.disabled);
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-tab-select', this._handleTabSelect as EventListener);
    this.addEventListener('keydown', this._handleKeydown);
    // Watch for panel/name attribute changes on child tabs and panels
    this._observer = new MutationObserver(() => {
      this._cachedTabs = null;
      this._cachedPanels = null;
      this._syncTabsAndPanels();
    });
    this._observer.observe(this, {
      subtree: true,
      attributeFilter: ['panel', 'name'],
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-tab-select', this._handleTabSelect as EventListener);
    this.removeEventListener('keydown', this._handleKeydown);
    this._observer?.disconnect();
    this._observer = null;
  }

  override firstUpdated(): void {
    this._syncTabsAndPanels();
    // Activate the first enabled tab if none is selected
    if (!this._activePanel) {
      const firstEnabled = this._getEnabledTabs()[0];
      if (firstEnabled) {
        this._activateTab(firstEnabled, false);
      }
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('_activePanel')) {
      this._updateTabsAndPanels();
    }
  }

  // ─── Tab / Panel Sync ───

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
        // Set controls on the tab so aria-controls lands on the inner button (role="tab")
        tab.controls = panelId;
        panel.setAttribute('aria-labelledby', tabId);
      }
    });

    this._updateTabsAndPanels();
  }

  private _updateTabsAndPanels(): void {
    const tabs = this._getTabs();
    const panels = this._getPanels();

    tabs.forEach((tab) => {
      const isSelected = tab.panel === this._activePanel;
      tab.selected = isSelected;
      // Tabindex is managed by the inner button in hx-tab via the `selected` property.
      // We also set it on the host for the roving tabindex pattern so document.activeElement
      // comparisons work correctly when the inner button is focused.
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
        new CustomEvent('hx-tab-change', {
          bubbles: true,
          composed: true,
          detail: { tabId: tab.id, index },
        }),
      );
    }
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleTabSelect = (e: CustomEvent<{ panel: string }>): void => {
    e.stopPropagation();
    const tab = e
      .composedPath()
      .find((el): el is HelixTab => el instanceof Element && el.tagName.toLowerCase() === 'hx-tab');
    if (tab) {
      this._activateTab(tab);
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
        console.warn(
          `[hx-tabs] Slot "tab" expects <hx-tab> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
        );
      }
    }
    if (panelSlot) {
      const invalid = panelSlot
        .assignedElements()
        .filter((el) => el.tagName.toLowerCase() !== 'hx-tab-panel');
      if (invalid.length > 0) {
        console.warn(
          `[hx-tabs] Default slot expects <hx-tab-panel> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
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
    const enabledTabs = this._getEnabledTabs();
    if (enabledTabs.length === 0) {
      return;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    const isNavigationKey = [prevKey, nextKey, 'Home', 'End', ' ', 'Enter'].includes(e.key);
    if (!isNavigationKey) {
      return;
    }

    // Determine focused tab — when a button inside shadow DOM is focused,
    // document.activeElement returns the shadow host (hx-tab), not the inner button.
    const focusedTab = enabledTabs.find((tab) => tab === document.activeElement);

    if (e.key === ' ' || e.key === 'Enter') {
      if (focusedTab) {
        e.preventDefault();
        this._activateTab(focusedTab);
        focusedTab.shadowRoot?.querySelector('button')?.focus();
      }
      return;
    }

    e.preventDefault();

    let currentIndex = focusedTab ? enabledTabs.indexOf(focusedTab) : -1;
    // Fall back to the active tab's index if nothing is focused yet
    if (currentIndex === -1) {
      const activeTab = enabledTabs.find((tab) => tab.panel === this._activePanel);
      currentIndex = activeTab ? enabledTabs.indexOf(activeTab) : 0;
    }

    let nextIndex: number;

    if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledTabs.length - 1;
    } else if (e.key === nextKey) {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else {
      // prevKey
      nextIndex = currentIndex <= 0 ? enabledTabs.length - 1 : currentIndex - 1;
    }

    const targetTab = enabledTabs[nextIndex];
    if (!targetTab) {
      return;
    }

    // Focus the tab button inside the shadow root
    targetTab.shadowRoot?.querySelector('button')?.focus();

    if (this.activation === 'automatic') {
      this._activateTab(targetTab);
    }
  };

  // ─── Render ───

  override render() {
    return html`
      <div class="tabs">
        <div
          part="tablist"
          class="tablist"
          role="tablist"
          aria-orientation=${this.orientation}
          aria-label=${this.label || nothing}
        >
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
}
