import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTabsStyles } from './hx-tabs.styles.js';
import type { HelixTab } from './hx-tab.js';
import type { HelixTabPanel } from './hx-tab-panel.js';

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
 */
@customElement('hx-tabs')
export class HelixTabs extends LitElement {
  static override styles = [tokenStyles, helixTabsStyles];

  // ─── Internal ID ───

  private _id = `hx-tabs-${Math.random().toString(36).slice(2, 9)}`;

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
  @property({ type: String, attribute: 'activation' })
  activation: 'manual' | 'automatic' = 'automatic';

  // ─── State ───

  @state() private _activePanel = '';

  // ─── Child Accessors ───

  private _getTabs(): HelixTab[] {
    return Array.from(this.querySelectorAll('hx-tab')) as HelixTab[];
  }

  private _getPanels(): HelixTabPanel[] {
    return Array.from(this.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
  }

  private _getEnabledTabs(): HelixTab[] {
    return this._getTabs().filter((tab) => !tab.disabled);
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-tab-select', this._handleTabSelect as EventListener);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-tab-select', this._handleTabSelect as EventListener);
    this.removeEventListener('keydown', this._handleKeydown);
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

  override updated(changedProperties: Map<string, unknown>): void {
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
        tab.setAttribute('aria-controls', panelId);
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
      tab.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.name === this._activePanel;
      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
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

  private _handleTabSelect = (e: CustomEvent<{ panel: string }>): void => {
    e.stopPropagation();
    const tab = e
      .composedPath()
      .find((el): el is HelixTab => el instanceof Element && el.tagName.toLowerCase() === 'hx-tab');
    if (tab) {
      this._activateTab(tab);
    }
  };

  private _handleSlotChange = (): void => {
    this._syncTabsAndPanels();
  };

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
        <div part="tablist" class="tablist" role="tablist" aria-orientation=${this.orientation}>
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
