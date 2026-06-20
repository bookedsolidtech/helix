import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../hx-icon/hx-icon.js';

import { HelixElement, createIdCounter } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixOverflowMenuStyles } from './hx-overflow-menu.styles.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import { getMenuItemTypeaheadLabel } from '../../utils/menu-label.js';
import { writeMenuItemRovingTabIndex } from '../../utils/menu-roving.js';
import { findClosestMenuAncestor } from '../../utils/menu-tree.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { applyLegacySizeAlias } from '../../utils/apply-legacy-size-alias.js';

const _nextOverflowMenuId = createIdCounter('hx-overflow-menu');

/**
 * An overflow menu (kebab/meatball menu) that reveals hidden actions via a
 * floating panel. Composed from a trigger button and a slotted menu panel.
 *
 * ## Architecture Note: Host-Attribute Trigger Label Mirror (group-5b)
 *
 * The composite has TWO ARIA-bearing surfaces inside its shadow DOM: the
 * trigger button (`role` defaulted from `<button>`, with `aria-haspopup`,
 * `aria-expanded`, `aria-controls`) and the panel (`role="menu"` on the
 * inner div). The host wraps both — it cannot carry either canonical role
 * itself, so role placement remains on the inner elements.
 *
 * What Group 5b adds:
 * - **Roving tabindex** on slotted menu items (only the focused item has
 *   tabindex=0; arrow keys move focus and rewrite tabindex). Closing-Tab
 *   path is preserved (Tab moves focus past the menu and closes it).
 * - **First-character typeahead** with 500ms timeout matching `hx-menu`.
 * - **Host-attribute label mirror**: consumer-supplied `aria-label` /
 *   `aria-labelledby` on the host flow to the trigger button's
 *   `aria-label` (the trigger is the announced surface of the disclosure
 *   pattern; consumer override wins over the `label` property). The panel
 *   continues to use `labelMenu` for its own slot label.
 *
 * @summary "..." or kebab icon button that reveals hidden actions.
 *
 * @tag hx-overflow-menu
 *
 * @slot - Menu items (e.g. `<button role="menuitem">` or `<hx-menu-item>` elements).
 *
 * @fires {CustomEvent<{value: string}>} hx-select - Dispatched when a menu item is selected.
 * @fires {CustomEvent<void>} hx-show - Dispatched when the panel opens.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the panel closes.
 *
 * @csspart button - The trigger icon button element.
 * @csspart trigger - Alias for button — the trigger icon button element.
 * @csspart panel - The floating menu panel container.
 * @csspart menu - Alias for panel — the floating menu panel container.
 *
 * @cssprop [--hx-overflow-menu-panel-bg=var(--hx-color-neutral-0,#fff)] - Panel background color.
 * @cssprop [--hx-overflow-menu-panel-border=1px solid var(--hx-color-neutral-200,#e5e7eb)] - Panel border.
 * @cssprop [--hx-overflow-menu-panel-border-radius=var(--hx-border-radius-md)] - Panel border radius.
 * @cssprop [--hx-overflow-menu-panel-shadow=0 4px 16px rgba(0,0,0,0.12)] - Panel box shadow.
 * @cssprop [--hx-overflow-menu-panel-min-width=160px] - Minimum panel width.
 * @cssprop [--hx-overflow-menu-panel-z-index=1000] - Panel z-index.
 * @cssprop [--hx-overflow-menu-button-color=var(--hx-color-neutral-600)] - Trigger icon color.
 *
 * @example
 * ```html
 * <hx-overflow-menu>
 *   <button role="menuitem">Edit</button>
 *   <button role="menuitem">Delete</button>
 * </hx-overflow-menu>
 * ```
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-overflow-menu-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-size-touch-target] - Size token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-overlay-black-12] - Overlay color.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-overflow-menu/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow,Home,End; activate=Enter,Space; dismiss=Escape; disabled-suppresses=true
 * @aria-pattern menu
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-overflow-menu
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-overflow-menu')
export class HelixOverflowMenu extends HelixElement {
  static override styles = [helixOverflowMenuStyles, forcedColorsInteractive];

  /**
   * Preferred placement of the floating panel relative to the trigger.
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
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end' = 'bottom-end';

  /**
   * Size of the trigger button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the trigger button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Icon orientation: vertical (kebab ⋮) or horizontal (meatball ···).
   * @attr icon
   */
  @property({ type: String, reflect: true })
  icon: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Accessible label for the trigger button. Used as a fallback when no
   * consumer-supplied `aria-label` / `aria-labelledby` is present on the
   * host. Consumer host attributes win in the AccName 1.2 §4.3.1 cascade.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'More actions';

  /**
   * Accessible label for the menu panel. Reflected as `label-menu`.
   * @attr label-menu
   */
  @property({ type: String, reflect: true, attribute: 'label-menu' })
  labelMenu = 'Actions';

  /**
   * Tracks whether the overflow menu panel is currently open and visible.
   * @internal
   */
  @state() private _open = false;

  /**
   * Resolved accessible name for the trigger button — written to the inner
   * button's `aria-label`. Recomputed via the host-attribute mirror on
   * every aria-* mutation. AccName 1.2 §4.3.1 precedence: host
   * `aria-labelledby` (flattened) > host `aria-label` > `label` property.
   * @internal
   */
  @state() private _resolvedTriggerLabel = '';

  /**
   * Index within `_getMenuItems()` of the item currently holding the
   * roving tabindex (and thus visual focus). −1 means the panel has not
   * been keyboard-focused yet (first key press lands on item 0).
   * @internal
   */
  private _rovingIndex = -1;

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

  /**
   * Handle for the shared host attribute / root id observer.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Unique ID for the floating panel element, used to wire aria-controls on the trigger button.
   * @internal
   */
  private readonly _panelId = `${_nextOverflowMenuId()}-panel`;

  /** @internal */
  @query('[part~="button"]') private _buttonEl!: HTMLButtonElement | null;

  /** @internal */
  @query('[part~="panel"]') private _panelEl!: HTMLElement | null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: forward the legacy unprefixed `size` attribute to the
    // `hx-size`-mapped property (3.x shim, removed in 4.0).
    applyLegacySizeAlias<'sm' | 'md' | 'lg'>(this, 'hx-overflow-menu', (v) => {
      this.size = v;
    });
    document.addEventListener('click', this._handleDocumentClick, true);
    this.addEventListener('keydown', this._handleKeydown);
    this._syncResolvedTriggerLabel();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncResolvedTriggerLabel();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick, true);
    this.removeEventListener('keydown', this._handleKeydown);
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('label')) {
      this._syncResolvedTriggerLabel();
    }
  }

  // ─── Open / Close ───

  /** @internal */
  private async _show(): Promise<void> {
    if (this._open || this.disabled) return;
    this._open = true;
    await this.updateComplete;
    await this._updatePosition();
    this._initRovingTabIndex();
    this._focusFirstItem();
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _hide(): void {
    if (!this._open) return;
    this._open = false;
    this._rovingIndex = -1;
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _toggle(): void {
    if (this._open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  // ─── Positioning (Floating UI) ───

  /** @internal */
  private async _updatePosition(): Promise<void> {
    const trigger = this._buttonEl as HTMLElement | null;
    const panel = this._panelEl;
    if (!trigger || !panel) return;

    const { computePosition, flip, shift, offset } = await import('@floating-ui/dom');
    const { x, y } = await computePosition(trigger, panel, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [offset(4), flip(), shift({ padding: 8 })],
    });

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Focus management ───

  /** @internal */
  private _focusFirstItem(): void {
    const items = this._getMenuItems();
    if (items.length === 0) return;
    this._rovingIndex = 0;
    this._applyRovingTabIndex();
    items[0]?.focus();
  }

  /**
   * Codex push-gate round-2 finding 3: write the roving tabindex through
   * the right surface for each item shape. Implementation moved to the
   * shared `writeMenuItemRovingTabIndex` util (round-8 finding 2) so
   * `hx-dropdown` and any future host-canonical menu shape route through
   * one source of truth instead of duplicating the host-vs-inner-element
   * branch per component.
   *
   * - `hx-menu-item` is host-canonical: on the modern path the roving
   *   tabindex must land on the host (it carries the announced role +
   *   IDL ARIA), and on the fallback path it must land on the inner
   *   `.menu-item` (the host is forced to `tabindex=-1` so there is
   *   exactly one focusable surface per item). The util's
   *   `setRovingTabIndex(value)` route handles both paths internally.
   * - Plain slotted `[role="menuitem"]` elements (legacy `<button>`-style
   *   children) keep the direct `item.tabIndex = value` write.
   *
   * Without this routing, host-canonical items on the fallback path stay
   * at `tabindex=-1` because the host write never reaches the inner
   * focusable surface — Tab would land on a non-focusable host and arrow
   * navigation would fail to advance the announced item.
   * @internal
   */

  /**
   * Initialize roving tabindex on all enabled menu items: only the first
   * receives tabindex=0; the rest are tabindex=-1. Maintains the closing-
   * Tab semantics required by APG (tabbing past the menu closes it via
   * the keydown handler below).
   * @internal
   */
  private _initRovingTabIndex(): void {
    const items = this._getMenuItems();
    items.forEach((item, i) => {
      writeMenuItemRovingTabIndex(item, i === 0 ? 0 : -1);
    });
    this._rovingIndex = items.length > 0 ? 0 : -1;
  }

  /** @internal */
  private _applyRovingTabIndex(): void {
    const items = this._getMenuItems();
    items.forEach((item, i) => {
      writeMenuItemRovingTabIndex(item, i === this._rovingIndex ? 0 : -1);
    });
  }

  /** @internal */
  private _getMenuItems(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    // Allow-list of host-canonical menu-item shapes — `hx-menu-item` carries
    // its `role` via `_internals.role` (AT-only, no DOM attribute), so the
    // role-attribute checks below would miss it. Restrict the wc allow-list
    // to known menu-item hosts so siblings like `hx-menu-divider`
    // (`role="separator"`) and decorative `hx-text` / `hx-icon` slotted into
    // the panel are NOT treated as focus / typeahead targets — APG mandates
    // separators stay non-focusable.
    const isHostCanonicalMenuItem = (el: Element): boolean => el.localName === 'hx-menu-item';
    return (
      (slot
        ?.assignedElements({ flatten: true })
        .filter(
          (el) =>
            el instanceof HTMLElement &&
            !el.hasAttribute('disabled') &&
            !(el as HTMLButtonElement).disabled &&
            (el.getAttribute('role') === 'menuitem' ||
              el.getAttribute('role') === 'menuitemcheckbox' ||
              el.getAttribute('role') === 'menuitemradio' ||
              isHostCanonicalMenuItem(el)),
        ) as HTMLElement[]) ?? []
    );
  }

  // ─── Event Handlers (arrow function class fields — stable reference, no bind needed) ───

  /** @internal */
  private readonly _handleTriggerClick = (e: MouseEvent): void => {
    e.stopPropagation();
    this._toggle();
  };

  /** @internal */
  private readonly _handleDocumentClick = (e: MouseEvent): void => {
    if (!this._open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  };

  /** @internal */
  private readonly _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._hide();
      this._buttonEl?.focus();
      return;
    }
    if (e.key === 'Tab') {
      // APG: Tab moves focus past the menu and closes it. Do not
      // preventDefault; let focus advance naturally.
      this._hide();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      const items = this._getMenuItems();
      if (items.length === 0) return;
      const focused = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === 'ArrowDown') {
        next = focused < 0 || focused >= items.length - 1 ? 0 : focused + 1;
      } else if (e.key === 'ArrowUp') {
        next = focused <= 0 ? items.length - 1 : focused - 1;
      } else if (e.key === 'Home') {
        next = 0;
      } else {
        next = items.length - 1;
      }
      this._rovingIndex = next;
      this._applyRovingTabIndex();
      items[next]?.focus();
      return;
    }
    // First-character typeahead — letters only, no modifier keys, ignore Space.
    if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this._handleTypeahead(e.key);
    }
  };

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

    const items = this._getMenuItems();
    // Codex push-gate round-7 finding 3: shared submenu-aware label
    // extractor — see hx-menu / hx-dropdown for rationale.
    const match = items.findIndex((item) => {
      const text = getMenuItemTypeaheadLabel(item).toLowerCase();
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._rovingIndex = match;
      this._applyRovingTabIndex();
      items[match]?.focus();
    }
  }

  /** @internal */
  private readonly _handleSlotClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    // Group 5b round-3 (codex): bail FIRST on host-canonical `hx-menu-item`,
    // independently of what `closest()` resolves with the legacy selectors.
    // If a consumer slots a `[role="menuitem*"]` descendant inside an
    // `hx-menu-item`, `closest()` would resolve to the descendant first
    // (nearest match) and the legacy localName guard would miss, double-firing
    // `hx-select` (once here, once from `_handleSlotItemSelect`). The host
    // owns its own dispatch path; descendants of the host must defer.
    if (target.closest('hx-menu-item')) return;
    const menuItem = target.closest(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ) as HTMLElement | null;
    if (!menuItem) return;
    if (menuItem.hasAttribute('disabled') || (menuItem as HTMLButtonElement).disabled) return;
    const value = menuItem.getAttribute('data-value') ?? menuItem.textContent?.trim() ?? '';
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._hide();
  };

  /**
   * Handle `hx-item-select` bubbling from slotted `hx-menu-item` children.
   * The host-canonical shape owns its own activation (click + Enter/Space),
   * so route its event through to the composite's `hx-select` contract and
   * close the panel. Disabled items never emit `hx-item-select`, so no
   * disabled-guard is needed here.
   * @internal
   */
  private readonly _handleSlotItemSelect = (e: Event): void => {
    const detail = (e as CustomEvent<{ item: HTMLElement; value: string }>).detail;
    const value = detail?.value ?? '';
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._hide();
  };

  /**
   * Bubbled `hx-item-submenu-open` from a slotted `hx-menu-item` host.
   * Codex push-gate round-9 P1: when slotted `hx-menu-item`s open / close
   * a nested submenu inside this panel (no enclosing `hx-menu`), the
   * events fly past with no handler. Match the round-4
   * `hx-menu._handleSubmenuOpen` shape so APG behaviour holds. Defer to
   * an inner `hx-menu` when present (it owns the toggle). Otherwise this
   * panel is the enclosing menu surface — call `setSubmenuOpen(true)` on
   * the dispatching item and focus its first nested child.
   * @internal
   */
  private readonly _handleSlotSubmenuOpen = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<{ item: HTMLElement }>).detail;
    const item = detail?.item;
    if (!item) return;
    if (findClosestMenuAncestor(item) !== null) return;
    queueMicrotask(() => {
      if (e.defaultPrevented) return;
      const setter = (item as HTMLElement & { setSubmenuOpen?: (v: boolean) => void })
        .setSubmenuOpen;
      if (typeof setter !== 'function') return;
      setter.call(item, true);
      const updateComplete = (item as HTMLElement & { updateComplete?: Promise<unknown> })
        .updateComplete;
      if (updateComplete) {
        void updateComplete
          .then(() => {
            const submenuSlot = (
              item as HTMLElement & { shadowRoot?: ShadowRoot | null }
            ).shadowRoot?.querySelector<HTMLSlotElement>('slot[name="submenu"]');
            const nested = submenuSlot
              ?.assignedElements({ flatten: true })
              .find((el) => el.tagName.toLowerCase() === 'hx-menu') as
              | (HTMLElement & { focusFirst?: () => void })
              | undefined;
            nested?.focusFirst?.();
          })
          .catch(() => undefined);
      }
    });
  };

  /**
   * Bubbled `hx-item-submenu-close` from a slotted `hx-menu-item` host.
   * Codex push-gate round-9 P1: when an inner `hx-menu` (a nested
   * submenu) handles its own close, the event still bubbles through this
   * panel — defer in that case so the panel stays open. When the
   * dispatching item is top-level inside this panel (no enclosing
   * `hx-menu`), there is no parent submenu to collapse, so close the
   * composite's panel and return focus to the trigger.
   * @internal
   */
  private readonly _handleSlotSubmenuClose = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<{ item: HTMLElement }>).detail;
    const item = detail?.item;
    if (!item) return;
    if (findClosestMenuAncestor(item) !== null) return;
    if (e.defaultPrevented) return;
    this._hide();
    // CodeRabbit MUST-FIX (WCAG 2.1.1 / 2.4.3): ArrowLeft close from a
    // top-level slotted item dropped focus to <body>. Mirror the Escape
    // branch and restore focus to the trigger so keyboard continuity is
    // preserved.
    this._buttonEl?.focus();
  };

  /** @internal */
  private readonly _handleSlotChange = (): void => {
    if (this._open) {
      this._initRovingTabIndex();
    }
  };

  // ─── Host-attribute trigger label mirror ───

  /**
   * Resolves the trigger button's accessible name from host attributes and
   * the `label` property. AccName 1.2 §4.3.1 precedence:
   *   1. Host `aria-labelledby` (resolved IDREFs, flattened)
   *   2. Host `aria-label`
   *   3. `label` property
   * @internal
   */
  private _syncResolvedTriggerLabel(): void {
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    const consumerLabelEls = resolveIdrefTokens(this, liveLabelledBy);

    // CodeRabbit MUST-FIX: AccName 1.2 §4.3.2 — `aria-labelledby` references
    // their target text content REGARDLESS of visibility. The previous
    // outer visibility filter dropped legitimate accessible names from
    // visually-hidden labels. `flattenAccName` already handles aria-hidden
    // subtree pruning per §4.3.10.
    const flattenedFromIdrefs = consumerLabelEls
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() : '';

    let resolved: string;
    if (flattenedFromIdrefs) {
      resolved = flattenedFromIdrefs;
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else {
      resolved = this.label;
    }

    this._resolvedTriggerLabel = resolved;
  }

  // ─── SVG Icons ───

  /**
   * @internal Helix's curated set provides the horizontal `ellipsis` glyph.
   * For the vertical variant we fall back to FA Free's `ellipsis-vertical`
   * since it isn't part of helix's 32-glyph vocabulary.
   */
  private _renderIcon() {
    if (this.icon === 'horizontal') {
      return html`<hx-icon
        class="trigger__glyph"
        library="helix"
        name="ellipsis"
        aria-hidden="true"
      ></hx-icon>`;
    }
    return html`<hx-icon
      class="trigger__glyph"
      library="fa-free"
      name="ellipsis-vertical"
      aria-hidden="true"
    ></hx-icon>`;
  }

  // ─── Render ───

  override render() {
    const btnClasses = {
      trigger: true,
      [`trigger--${this.size}`]: true,
      'trigger--open': this._open,
    };

    return html`
      <button
        part="button trigger"
        class=${classMap(btnClasses)}
        type="button"
        aria-label=${this._resolvedTriggerLabel}
        aria-haspopup="menu"
        aria-expanded=${String(this._open)}
        aria-controls=${this._open ? this._panelId : nothing}
        ?disabled=${this.disabled}
        @click=${this._handleTriggerClick}
      >
        ${this._renderIcon()}
      </button>
      ${this._open
        ? html`
            <div
              id=${this._panelId}
              part="panel menu"
              role="menu"
              aria-label=${this.labelMenu}
              class="panel"
              @click=${this._handleSlotClick}
              @hx-item-select=${this._handleSlotItemSelect}
              @hx-item-submenu-open=${this._handleSlotSubmenuOpen}
              @hx-item-submenu-close=${this._handleSlotSubmenuClose}
            >
              <slot @slotchange=${this._handleSlotChange}></slot>
            </div>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-overflow-menu': HelixOverflowMenu;
  }
}
