import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixMenuStyles } from './hx-menu.styles.js';
import type { HelixMenuItem } from './hx-menu-item.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * A menu container that manages keyboard navigation over a list of menu items.
 * Use with `hx-menu-item` and `hx-menu-divider`.
 *
 * Group 5b host-canonical: `role="menu"` lives on the **host** via
 * `_internals.role`. The host carries the announced surface so AT walks
 * `<hx-menu>` (role=menu) → slotted `<hx-menu-item>` (role=menuitem on host)
 * directly without two layers of indirection. Consumer-supplied
 * `aria-label` / `aria-labelledby` on the host are resolved via the shared
 * IDREF mirror; cross-shadow naming uses `ariaLabelledByElements` (modern)
 * with a flattened-string fallback (legacy).
 *
 * Submenu coordination: when an `hx-menu-item` emits `hx-item-submenu-open`
 * or `hx-item-submenu-close`, the parent menu auto-handles the toggle by
 * calling `setSubmenuOpen()` on the item — UNLESS the consumer has called
 * `event.preventDefault()` on the bubbled event, signaling that they own the
 * submenu lifecycle. This matches APG-mandated behaviour while leaving an
 * opt-out for advanced consumers.
 *
 * @summary Context/action menu with keyboard-navigable items.
 *
 * @tag hx-menu
 *
 * @slot - Default slot for hx-menu-item and hx-menu-divider elements.
 *
 * @fires {CustomEvent<{item: HelixMenuItem, value: string}>} hx-select - Dispatched when an item is selected.
 * @fires {CustomEvent<void>} hx-close - Dispatched when Escape is pressed.
 *
 * @csspart base - The root menu element.
 *
 * @cssprop [--hx-menu-bg=var(--hx-color-neutral-0)] - Menu background color.
 * @cssprop [--hx-menu-border-color=var(--hx-color-neutral-200)] - Menu border color.
 * @cssprop [--hx-menu-border-radius=var(--hx-border-radius-md)] - Menu border radius.
 * @cssprop [--hx-menu-shadow] - Menu box shadow.
 * @cssprop [--hx-menu-min-width=10rem] - Minimum menu width.
 * @cssprop [--hx-menu-max-height=20rem] - Maximum menu height before vertical scroll is activated.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-shadow-md] - Box shadow.
 */
@customElement('hx-menu')
export class HelixMenu extends HelixElement {
  static override styles = [helixMenuStyles, forcedColorsInteractive];

  /**
   * Accessible label for the menu. Used as a fallback when no consumer-supplied
   * `aria-label` / `aria-labelledby` is present on the host. On the modern
   * host-canonical path this projects onto `internals.ariaLabel`; on the
   * legacy fallback path it appears as `aria-label` on the inner div.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * Index of the currently focused menu item within the list of enabled items.
   * @internal
   */
  private _focusedIndex = -1;

  /**
   * Accumulated character buffer for typeahead search within menu items.
   * @internal
   */
  private _typeaheadBuffer = '';

  /**
   * Timer handle that clears the typeahead buffer after a period of inactivity.
   * @internal
   */
  private _typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _getItems(): HelixMenuItem[] {
    return Array.from(this.querySelectorAll<HelixMenuItem>('hx-menu-item')).filter(
      (item) => !item.disabled && !item.loading,
    );
  }

  /**
   * Synchronize roving tabindex across all enabled items.
   * Only the active item (or first item if none active) gets tabindex=0.
   */
  /** @internal */
  private _syncRovingTabIndex(): void {
    const items = this._getItems();
    const activeIndex = this._focusedIndex >= 0 ? this._focusedIndex : 0;
    items.forEach((item, i) => {
      item.setRovingTabIndex(i === activeIndex ? 0 : -1);
    });
  }

  /** Focus the first menu item. */
  focusFirst(): void {
    const items = this._getItems();
    const first = items[0];
    if (first !== undefined) {
      this._focusedIndex = 0;
      this._syncRovingTabIndex();
      first.focus();
    }
  }

  /** Focus the last menu item. */
  focusLast(): void {
    const items = this._getItems();
    const last = items[items.length - 1];
    if (last !== undefined) {
      this._focusedIndex = items.length - 1;
      this._syncRovingTabIndex();
      last.focus();
    }
  }

  /** @internal */
  private _focusItem(index: number): void {
    const items = this._getItems();
    if (items.length === 0) return;
    this._focusedIndex = Math.max(0, Math.min(index, items.length - 1));
    this._syncRovingTabIndex();
    const target = items[this._focusedIndex];
    if (target !== undefined) target.focus();
  }

  /** @internal */
  private _updateFocusedIndex(): void {
    const items = this._getItems();
    const active = this.shadowRoot?.activeElement ?? document.activeElement;
    // Find the active item by checking if any item's shadow root contains the active element
    const idx = items.findIndex((item) => item.matches(':focus-within') || item === active);
    if (idx !== -1) this._focusedIndex = idx;
  }

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    this._updateFocusedIndex();
    const items = this._getItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._focusItem(this._focusedIndex + 1 < items.length ? this._focusedIndex + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._focusItem(this._focusedIndex > 0 ? this._focusedIndex - 1 : items.length - 1);
        break;
      case 'Home':
        e.preventDefault();
        this._focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        this._focusItem(items.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        this.dispatchEvent(new CustomEvent<void>('hx-close', { bubbles: true, composed: true }));
        break;
      default:
        if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this._handleTypeahead(e.key, items);
        }
        break;
    }
  }

  /** @internal */
  private _handleTypeahead(char: string, items: HelixMenuItem[]): void {
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
    }
    this._typeaheadBuffer += char.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeaheadBuffer = '';
      this._typeaheadTimer = null;
    }, 500);

    const match = items.findIndex((item) => {
      if (item.disabled || item.hasAttribute('disabled')) return false;
      const text = item.textContent?.trim().toLowerCase() ?? '';
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._focusItem(match);
    }
  }

  /** @internal */
  private _handleSlotChange(e: Event): void {
    const slot = e.target;
    if (!(slot instanceof HTMLSlotElement)) return;
    const validTags = new Set(['hx-menu-item', 'hx-menu-divider']);
    const invalid = slot
      .assignedElements()
      .filter((el) => !validTags.has(el.tagName.toLowerCase()));
    if (invalid.length > 0) {
      devWarn(
        'hx-menu',
        `Default slot expects <hx-menu-item> or <hx-menu-divider> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
      );
    }
    // Initialize roving tabindex when items are slotted
    this._syncRovingTabIndex();
  }

  /** @internal */
  private _handleItemSelect(e: Event): void {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<{ item: HelixMenuItem; value: string }>).detail;
    const items = this._getItems();
    this._focusedIndex = items.indexOf(detail.item);

    this.dispatchEvent(
      new CustomEvent<{ item: HelixMenuItem; value: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item: detail.item, value: detail.value },
      }),
    );
  }

  /**
   * Auto-handle submenu open/close events emitted by child `hx-menu-item`
   * children. APG-mandated behaviour: ArrowRight on a parent item opens the
   * nested submenu and focuses its first item; ArrowLeft closes the submenu
   * and returns focus to the parent item. Consumers that own submenu
   * lifecycle themselves can `event.preventDefault()` to opt out.
   * @internal
   */
  private _handleSubmenuOpen = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<{ item: HelixMenuItem }>).detail;
    const item = detail?.item;
    if (!item) return;
    // Defer to a microtask so consumer listeners (which may be registered
    // AFTER the menu's auto-handler in event order) get a chance to call
    // `event.preventDefault()` and opt out of default submenu lifecycle
    // handling. APG-mandated default: open the nested submenu and focus
    // its first item; consumers that own this themselves cancel the
    // default by calling preventDefault on the event.
    queueMicrotask(() => {
      if (e.defaultPrevented) return;
      item.setSubmenuOpen(true);
      void item.updateComplete
        .then(() => {
          const submenuSlot =
            item.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="submenu"]');
          const nested = submenuSlot
            ?.assignedElements({ flatten: true })
            .find((el) => el.tagName.toLowerCase() === 'hx-menu') as HelixMenu | undefined;
          nested?.focusFirst();
        })
        .catch(() => undefined);
    });
  };

  /** @internal */
  private _handleSubmenuClose = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<{ item: HelixMenuItem }>).detail;
    const item = detail?.item;
    if (!item) return;
    queueMicrotask(() => {
      if (e.defaultPrevented) return;
      item.setSubmenuOpen(false);
      item.focus();
    });
  };

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    // Keydown is bound on the HOST so events from focused host-canonical
    // menu items (which keep keydown out of this menu's shadow DOM)
    // still reach the navigation handler. hx-item-select bubbles
    // through the composed path and is caught here as well.
    this.addEventListener('keydown', this._handleHostKeyDown);
    this.addEventListener('hx-item-select', this._handleItemSelectHost);
    this.addEventListener('hx-item-submenu-open', this._handleSubmenuOpen);
    this.addEventListener('hx-item-submenu-close', this._handleSubmenuClose);
    // Seed host-canonical semantics so role/label appear before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this.removeEventListener('keydown', this._handleHostKeyDown);
    this.removeEventListener('hx-item-select', this._handleItemSelectHost);
    this.removeEventListener('hx-item-submenu-open', this._handleSubmenuOpen);
    this.removeEventListener('hx-item-submenu-close', this._handleSubmenuClose);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  /** @internal */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    this._handleKeyDown(e);
  };

  /** @internal */
  private _handleItemSelectHost = (e: Event): void => {
    this._handleItemSelect(e);
  };

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('label')) {
      this._syncHostAriaSemantics();
    }
  }

  override firstUpdated(): void {
    const hasEffectiveLabel =
      this.hasAttribute('aria-label') ||
      this.hasAttribute('aria-labelledby') ||
      Boolean(this.label);
    if (!hasEffectiveLabel) {
      devWarn(
        'hx-menu',
        'No accessible label provided. Set the `label` attribute, or supply `aria-label` / `aria-labelledby` on hx-menu so screen readers can identify this menu (WCAG 4.1.2).',
      );
    }
  }

  /**
   * Mirror menu semantics onto the host via ElementInternals so consumer-
   * supplied `aria-label`, `aria-labelledby`, and the `label` property all
   * reach the announced control. Falls back to a flattened-string label on
   * engines that do not implement `ariaLabelledByElements`.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'menu';

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
    // `label` property > literal "Menu" (last-resort).
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (hasEffectiveLabelledBy) {
      if (this._supportsIdrefRefs) {
        // Modern path: element refs win; clear ariaLabel so they aren't
        // shadowed by a stale string.
        internals.ariaLabel = null;
      } else {
        internals.ariaLabel =
          labelEls
            .map((el) => flattenAccName(el))
            .filter(Boolean)
            .join(' ') ||
          this.label ||
          'Menu';
      }
    } else {
      internals.ariaLabel = this.label || 'Menu';
    }
  }

  override render() {
    // Host-canonical Path A: `role="menu"` and the resolved label live on
    // the host via `_internals`. The inner div is roleless on the modern
    // path so AT does not see a duplicated container role nested inside
    // the host. Legacy fallback keeps the inner role + aria-label so AT
    // without IDL element references still announces the menu.
    // Keydown + hx-item-select listeners are bound on the host in
    // connectedCallback() — keydown does not propagate INTO this menu's
    // shadow DOM, so events from focused host-canonical menu items
    // would never fire on inner-div bindings. hx-item-select bubbles
    // composed through the host either way; we listen on the host for
    // symmetry.
    if (this._supportsIdrefRefs) {
      return html`
        <div part="base" class="menu">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      `;
    }

    return html`
      <div part="base" class="menu" role="menu" aria-label=${this.label || nothing}>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-menu': HelixMenu;
  }
}
