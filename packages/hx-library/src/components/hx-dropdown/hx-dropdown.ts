import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state, query } from 'lit/decorators.js';
import { devWarn } from '../../utils/dev-warn.js';
import { HelixElement } from '../../base/index.js';
import type { Placement as FloatingPlacement } from '@floating-ui/dom';
import { createIdCounter } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixDropdownStyles } from './hx-dropdown.styles.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

// P2-03: Export so TypeScript consumers can import this type for prop typing.
export type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'start'
  | 'end';

const _nextDropdownId = createIdCounter('hx-dropdown');

/**
 * A dropdown component — a button that opens a floating panel on click.
 *
 * ## Architecture Note: Host-Attribute Label Mirror (group-4 round-1)
 *
 * The announced surface is the inner `[part="panel"]` element, which carries
 * `role="menu"`. The host wraps a slotted trigger and the floating panel and
 * does NOT claim a role itself (apart from the round-35-style host
 * `aria-expanded` fallback used only when the trigger slot is empty).
 *
 * Because the panel lives in shadow DOM and `ElementInternals` IDL refs on
 * the host project semantics OUTWARD (host → AT) rather than INWARD
 * (host → shadow descendant), we use the **host-attribute mirror** pattern:
 * resolve consumer `aria-labelledby` IDREFs against the host's composed-tree
 * roots, text-flatten via `flattenAccName`, and write the result to the
 * panel's `aria-label`. Host `aria-label` outranks the `label` property in
 * the same precedence used by every host-canonical hx-* control.
 *
 * Naming precedence (W3C AccName 1.2 §4.3.1):
 *   1. Host `aria-labelledby` (resolved IDREFs, text-flattened)
 *   2. Host `aria-label`
 *   3. `label` property
 *   4. Hard-coded literal `"Menu"` (last-resort accessible name)
 *
 * **Group 4b → Group 5b boundary:** Group 4b added the host-attribute
 * label mirror **only** — additive on top of the existing dropdown
 * behaviour. Group 5b (this commit) adds the composite-navigation
 * portion that 4b explicitly deferred:
 *   - **Roving tabindex** inside the panel (`_applyRovingTabIndex` +
 *     `_rovingIndex`). Only the focused item carries `tabindex=0`.
 *   - **First-character typeahead** with 500ms timeout (`_handleTypeahead`)
 *     matching `hx-menu`, `hx-overflow-menu`, `hx-split-button`.
 *   - Submenu auto-handling is delegated to slotted `hx-menu` /
 *     `hx-menu-item` (whose `hx-item-submenu-open` / `hx-item-submenu-close`
 *     events are auto-handled by the parent `hx-menu` after Group 5b).
 *
 * The panel's inner-div `role="menu"` is intentionally NOT migrated to
 * the host: the host wraps a slotted consumer trigger AND the panel,
 * so it cannot canonically carry the menu role. Slotted `hx-menu-item`
 * children carry `role="menuitem"` on their HOST after Group 5b's menu
 * migration, which fixes the cross-shadow walk concern from the
 * consumer's perspective.
 *
 * `aria-controls` is intentionally omitted on the trigger: the panel lives
 * in shadow DOM and IDREF values cannot be resolved across shadow
 * boundaries by assistive technology (axe-core flags this as a critical
 * violation if attempted). See `_setupTriggerAria` for the inline note.
 *
 * @summary Button that opens a floating menu panel on click.
 *
 * @tag hx-dropdown
 *
 * @slot trigger - The element that opens the dropdown (e.g. hx-button).
 * @slot - Default slot for dropdown panel content (e.g. menu items).
 *
 * @fires {CustomEvent<void>} hx-show - Dispatched when the dropdown is opened.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the dropdown is closed.
 * @fires {CustomEvent<{value: string | null; label: string}>} hx-select - Dispatched when a menu item is selected.
 *
 * @csspart trigger - The trigger wrapper element.
 * @csspart panel - The floating panel element.
 *
 * @cssprop [--hx-dropdown-panel-bg=var(--hx-color-neutral-0)] - Panel background color.
 * @cssprop [--hx-dropdown-panel-border-color=var(--hx-color-neutral-200)] - Panel border color.
 * @cssprop [--hx-dropdown-panel-border-radius=var(--hx-border-radius-md)] - Panel border radius.
 * @cssprop [--hx-dropdown-panel-shadow=0 4px 16px rgba(0,0,0,0.12)] - Panel box shadow.
 * @cssprop [--hx-dropdown-panel-z-index=1000] - Panel z-index.
 * @cssprop [--hx-dropdown-panel-min-width=160px] - Panel minimum width.
 *
 * @example
 * ```html
 * <hx-dropdown>
 *   <button slot="trigger">Open Menu</button>
 *   <ul>
 *     <li data-value="edit">Edit</li>
 *     <li data-value="delete">Delete</li>
 *   </ul>
 * </hx-dropdown>
 * ```
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-overlay-black-12] - Overlay color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 */
@customElement('hx-dropdown')
export class HelixDropdown extends HelixElement {
  static override styles = [helixDropdownStyles, forcedColorsInteractive];

  // ─── Public Properties ───

  /**
   * Whether the dropdown panel is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Preferred placement of the panel relative to the trigger.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'start'
    | 'end' = 'bottom-start';

  /**
   * Accessible label for the dropdown menu panel. Override for i18n.
   * @attr label
   */
  @property() label = 'Menu';

  /**
   * Whether the dropdown is disabled. Prevents opening.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Gap in pixels between the trigger and the panel.
   * @attr distance
   */
  @property({ type: Number })
  distance = 4;

  // ─── Internal State ───

  /**
   * Whether the dropdown panel is currently visible.
   * @internal
   */
  @state() private _panelVisible = false;

  /**
   * Index within the panel's focusable menu items of the item currently
   * holding the roving tabindex (and thus visual focus). −1 means the
   * panel has not been keyboard-focused yet.
   * @internal
   */
  private _rovingIndex = -1;

  /**
   * Accumulated character buffer for typeahead search within the panel's
   * menu items. Cleared after 500ms of inactivity.
   * @internal
   */
  private _typeaheadBuffer = '';

  /**
   * Timer handle that clears the typeahead buffer after a period of inactivity.
   * @internal
   */
  private _typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Resolved accessible name for the menu panel — the value written to the
   * inner `[part="panel"]` `aria-label`. Recomputed on every sync per
   * AccName 1.2 §4.3.1 precedence: host `aria-labelledby` (flattened) >
   * host `aria-label` > `label` property > literal `"Menu"`.
   * @internal
   */
  @state() private _resolvedLabel = '';

  /**
   * Most recently observed consumer-supplied `aria-labelledby` token list on
   * the host. Refreshed every sync via `getAttribute()`.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;

  /**
   * Handle for the shared host attribute / root id observer.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Watches in-place text / visibility mutations on consumer light-DOM
   * elements resolved from the host's `aria-labelledby`.
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  /**
   * Guards against accumulating multiple document click listeners when open state
   * changes faster than the microtask queue can process removeEventListener calls.
   * @internal
   */
  private _documentListenerAttached = false;

  // P1-02: Unique panel ID for aria-controls.
  /**
   * Unique ID assigned to the floating panel element, referenced by `aria-controls` on the trigger.
   * @internal
   */
  private _panelId = `${_nextDropdownId()}-panel`;

  /**
   * Reference to the floating panel element inside the shadow DOM.
   * @internal
   */
  @query('[part="panel"]') private _panel: HTMLElement | undefined;
  /**
   * Reference to the trigger wrapper element inside the shadow DOM.
   * @internal
   */
  @query('[part="trigger"]') private _triggerWrapper: HTMLElement | undefined;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
    // Seed the host-attribute label mirror BEFORE first paint so the panel's
    // `aria-label` carries the resolved name on its very first render.
    this._syncResolvedLabel();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncResolvedLabel();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
    if (this._documentListenerAttached) {
      document.removeEventListener('click', this._handleOutsideClick, { capture: true });
      this._documentListenerAttached = false;
    }
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
  }

  // ─── Open/Close ───

  /** @internal */
  private async _show(): Promise<void> {
    if (this.open || this.disabled) return;
    this.open = true;
    this._panelVisible = true;
    // Add outside-click listener synchronously before any await so it is registered
    // by the time the test fires an outside click after a single await el.updateComplete.
    if (!this._documentListenerAttached) {
      document.addEventListener('click', this._handleOutsideClick, { capture: true });
      this._documentListenerAttached = true;
    }
    await this.updateComplete;
    // P0-01: Fix focus management — use slot.assignedElements() to traverse slotted (light DOM) content.
    // Focus is set after updateComplete (panel is rendered) but before _updatePosition so
    // it executes in the same microtask as the test's await-continuation.
    const panel = this._panel;
    if (panel) {
      // Group 5b: initialize roving tabindex on slotted menu items
      // before focusing the first one. Tab from outside lands on the
      // same item that has visual focus.
      const items = this._getFocusableMenuItems();
      if (items.length > 0) {
        this._rovingIndex = 0;
        this._applyRovingTabIndex(items);
      }
      const firstFocusable = this._getFirstFocusableItem();
      firstFocusable?.focus();
    }
    await this._updatePosition();
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
  }

  // P2-02: returnFocus=true only on Escape; Tab should let focus advance naturally.
  /** @internal */
  private _hide(returnFocus = true): void {
    if (!this.open) return;
    this.open = false;
    this._panelVisible = false;
    this._rovingIndex = -1;
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this._typeaheadBuffer = '';
    if (this._documentListenerAttached) {
      document.removeEventListener('click', this._handleOutsideClick, { capture: true });
      this._documentListenerAttached = false;
    }
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));
    if (returnFocus) {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
      trigger?.focus();
    }
  }

  // ─── Positioning ───

  /** @internal */
  private async _updatePosition(): Promise<void> {
    const reference = this._triggerWrapper;
    const panel = this._panel;
    if (!reference || !panel) return;

    // Map 'start' and 'end' to floating-ui's 'left'/'right'
    const floatingPlacement = this.placement
      .replace(/^start$/, 'left')
      .replace(/^end$/, 'right') as FloatingPlacement;

    const { computePosition, flip, shift, offset } = await import('@floating-ui/dom');
    const { x, y } = await computePosition(reference, panel, {
      placement: floatingPlacement,
      strategy: 'fixed',
      middleware: [offset(this.distance), flip(), shift({ padding: 8 })],
    });

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Event Handlers ───

  /** @internal */
  private _handleTriggerClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  /** @internal */
  private _handleTriggerKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      void this._show();
    }
  }

  /** @internal */
  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) {
      e.stopPropagation();
      this._hide(true); // return focus to trigger on Escape
    } else if (e.key === 'Tab' && this.open) {
      // P2-02: Do not return focus to trigger on Tab — let focus advance naturally to next page element.
      this._hide(false);
    } else if (
      this.open &&
      (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')
    ) {
      // P2-01: Arrow key roving within panel per APG Menu Button pattern.
      e.preventDefault();
      this._handleMenuNavigation(e.key);
    } else if (
      this.open &&
      e.key.length === 1 &&
      e.key !== ' ' &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      // Group 5b: first-character typeahead within the panel's menu
      // items. 500ms timeout matching hx-menu / hx-overflow-menu.
      this._handleTypeahead(e.key);
    }
  };

  // P2-01: Move focus among menuitem elements using arrow keys.
  /** @internal */
  private _handleMenuNavigation(key: string): void {
    const items = this._getFocusableMenuItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;
    if (key === 'ArrowDown') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else if (key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else {
      nextIndex = items.length - 1;
    }
    this._rovingIndex = nextIndex;
    this._applyRovingTabIndex(items);
    items[nextIndex]?.focus();
  }

  /**
   * Roving tabindex inside the panel: only the focused item carries
   * tabindex=0; the rest are tabindex=-1. APG-compliant for the menu
   * button pattern. Closing-Tab semantics are preserved by the
   * `_handleKeydown` Tab branch above (which lets focus advance
   * naturally and closes the panel).
   *
   * Group 5b: introduced to align hx-dropdown's panel keyboard contract
   * with hx-menu / hx-overflow-menu / hx-split-button. Group 4b only
   * added the host-attribute label mirror (additive); this is the
   * keyboard portion deferred until Group 5.
   * @internal
   */
  private _applyRovingTabIndex(items: HTMLElement[]): void {
    items.forEach((item, i) => {
      item.tabIndex = i === this._rovingIndex ? 0 : -1;
    });
  }

  /** @internal */
  private _handleTypeahead(char: string): void {
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
    }
    this._typeaheadBuffer += char.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeaheadBuffer = '';
      this._typeaheadTimer = null;
    }, 500);

    const items = this._getFocusableMenuItems();
    const match = items.findIndex((item) => {
      const text = item.textContent?.trim().toLowerCase() ?? '';
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._rovingIndex = match;
      this._applyRovingTabIndex(items);
      items[match]?.focus();
    }
  }

  // P0-01 / P2-01: Get focusable menu items from slotted content.
  /** @internal */
  private _getFocusableMenuItems(): HTMLElement[] {
    const panel = this._panel;
    if (!panel) return [];
    const slot = panel.querySelector<HTMLSlotElement>('slot');
    const assignedNodes = slot?.assignedElements({ flatten: true }) ?? [];
    const items: HTMLElement[] = [];
    for (const node of assignedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches('[role="menuitem"]')) {
        items.push(node);
      } else {
        node.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((item) => items.push(item));
      }
    }
    return items;
  }

  // P0-01: Find the first focusable element in slotted panel content.
  /** @internal */
  private _getFirstFocusableItem(): HTMLElement | null {
    const panel = this._panel;
    if (!panel) return null;
    const slot = panel.querySelector<HTMLSlotElement>('slot');
    const assignedNodes = slot?.assignedElements({ flatten: true }) ?? [];
    const focusableSelector =
      '[role="menuitem"], button, [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea';
    for (const node of assignedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(focusableSelector)) return node;
      const found = node.querySelector<HTMLElement>(focusableSelector);
      if (found) return found;
    }
    return null;
  }

  /** @internal */
  private _handleOutsideClick = (e: MouseEvent): void => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  };

  /** @internal */
  private _handlePanelClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    // P2-06: Narrow selector — bare 'li' and 'button' cause spurious hx-select events.
    const item = target.closest<HTMLElement>('[role="menuitem"], [data-value]');
    if (!item) return;

    const value = item.dataset['value'] ?? item.getAttribute('value') ?? null;
    const label = item.textContent?.trim() ?? '';

    this.dispatchEvent(
      new CustomEvent<{ value: string | null; label: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value, label },
      }),
    );

    this._hide();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="trigger"
        class="trigger-wrapper"
        @click=${this._handleTriggerClick}
        @keydown=${this._handleTriggerKeydown}
      >
        <slot name="trigger" @slotchange=${this._onTriggerSlotChange}></slot>
      </div>
      <div
        part="panel"
        id=${this._panelId}
        role="menu"
        aria-hidden=${this._panelVisible ? nothing : 'true'}
        aria-label=${this._resolvedLabel}
        class=${this._panelVisible ? 'panel panel--visible' : 'panel'}
        @click=${this._handlePanelClick}
      >
        <slot @slotchange=${this._onPanelSlotChange}></slot>
      </div>
    `;
  }

  // ─── Panel slot validation ───

  /** @internal */
  private _onPanelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    const nonItems = assigned.filter((el) => el.tagName.toLowerCase() !== 'hx-dropdown-item');
    if (nonItems.length > 0) {
      devWarn(
        'hx-dropdown',
        `Default slot should contain only hx-dropdown-item elements. Found unexpected: ${nonItems.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}. Non-hx-dropdown-item children will be included in keyboard navigation incorrectly.`,
      );
    }
  }

  // ─── ARIA setup for trigger slot ───

  /** @internal */
  private _onTriggerSlotChange(): void {
    this._setupTriggerAria();
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  /** @internal */
  private _setupTriggerAria(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;
    if (trigger) {
      // P1-01: Use aria-haspopup="menu" per ARIA 1.1+ / APG Menu Button pattern.
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', String(this.open));
      // aria-controls is intentionally omitted: the panel lives in Shadow DOM and
      // IDREF values cannot be resolved across shadow boundaries by assistive technology.
      // P2-06: Remove host fallback when a trigger element is present.
      this.removeAttribute('aria-expanded');
    } else {
      // P2-06: Fallback — set aria-expanded on host when trigger slot is empty or unassigned.
      this.setAttribute('aria-expanded', String(this.open));
    }
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    // `label` property changes must flow into the resolved name BEFORE
    // render so the new fallback is in place on the same paint. See
    // `hx-popover.willUpdate()` for the same rationale.
    if (changedProperties.has('label')) {
      this._syncResolvedLabel();
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      // Keep aria-expanded in sync
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
      if (trigger) {
        trigger.setAttribute('aria-expanded', String(this.open));
      } else {
        // P2-06: Fallback — keep host aria-expanded in sync when trigger slot is empty.
        this.setAttribute('aria-expanded', String(this.open));
      }
    }
  }

  // ─── Host-attribute label mirror ───

  /**
   * (Re-)installs a `MutationObserver` over the deduped union of
   * consumer-resolved label elements, watching for in-place text /
   * visibility mutations so the panel's `aria-label` tracks live consumer
   * text. See `hx-popover._installExternalRefsObserver` for the matching
   * shape used across the host-attribute-mirror family.
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
      this._syncResolvedLabel();
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
   * Resolves the menu panel's accessible name from host attributes and the
   * `label` property. AccName 1.2 §4.3.1 precedence:
   *   1. Host `aria-labelledby` (resolved IDREFs, flattened)
   *   2. Host `aria-label`
   *   3. `label` property
   *   4. Literal `"Menu"` (last-resort)
   * @internal
   */
  private _syncResolvedLabel(): void {
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    this._consumerLabelledBy = liveLabelledBy;
    const consumerLabelEls = resolveIdrefTokens(this, liveLabelledBy);

    this._installExternalRefsObserver(consumerLabelEls);

    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    const flattenedFromIdrefs = consumerLabelEls
      .filter(isVisibleForAccName)
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() : '';

    let resolved = '';
    if (flattenedFromIdrefs) {
      resolved = flattenedFromIdrefs;
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else if (this.label) {
      resolved = this.label;
    } else {
      resolved = 'Menu';
    }

    this._resolvedLabel = resolved;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-dropdown': HelixDropdown;
  }
  interface HTMLElementEventMap {
    'hx-show': CustomEvent<void>;
    'hx-hide': CustomEvent<void>;
    'hx-select': CustomEvent<{ value: string | null; label: string }>;
  }
}
