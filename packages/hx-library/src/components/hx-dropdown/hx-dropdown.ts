import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import {
  computePosition,
  flip,
  shift,
  offset,
  type Placement as FloatingPlacement,
} from '@floating-ui/dom';
import { helixDropdownStyles } from './hx-dropdown.styles.js';

type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'start'
  | 'end';

/**
 * A dropdown component — a button that opens a floating panel on click.
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
 */
@customElement('hx-dropdown')
export class HelixDropdown extends LitElement {
  static override styles = [tokenStyles, helixDropdownStyles];

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
  placement: DropdownPlacement = 'bottom-start';

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

  @state() private _panelVisible = false;

  @query('[part="panel"]') private _panel!: HTMLElement;
  @query('[part="trigger"]') private _triggerWrapper!: HTMLElement;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('click', this._handleOutsideClick);
  }

  // ─── Open/Close ───

  private async _show(): Promise<void> {
    if (this.open || this.disabled) return;
    this.open = true;
    this._panelVisible = true;
    await this.updateComplete;
    await this._updatePosition();
    document.addEventListener('click', this._handleOutsideClick, { capture: true });
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
    // Focus first focusable item in panel
    const panel = this._panel;
    if (panel) {
      const firstFocusable = panel.querySelector<HTMLElement>(
        '[role="menuitem"], button, [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea',
      );
      firstFocusable?.focus();
    }
  }

  private _hide(): void {
    if (!this.open) return;
    this.open = false;
    this._panelVisible = false;
    document.removeEventListener('click', this._handleOutsideClick);
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
    // Return focus to trigger
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
    trigger?.focus();
  }

  // ─── Positioning ───

  private async _updatePosition(): Promise<void> {
    const reference = this._triggerWrapper;
    const panel = this._panel;
    if (!reference || !panel) return;

    // Map 'start' and 'end' to floating-ui's 'left'/'right'
    const floatingPlacement = this.placement
      .replace(/^start$/, 'left')
      .replace(/^end$/, 'right') as FloatingPlacement;

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

  private _handleTriggerClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  private _handleTriggerKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      void this._show();
    }
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.open) {
      e.stopPropagation();
      this._hide();
    } else if (e.key === 'Tab' && this.open) {
      this._hide();
    }
  }

  private _handleOutsideClick(e: MouseEvent): void {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  }

  private _handlePanelClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>('[role="menuitem"], [data-value], li, button');
    if (!item) return;

    const value = item.dataset['value'] ?? item.getAttribute('value') ?? null;
    const label = item.textContent?.trim() ?? '';

    this.dispatchEvent(
      new CustomEvent('hx-select', {
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
        aria-hidden=${this._panelVisible ? 'false' : 'true'}
        class=${this._panelVisible ? 'panel panel--visible' : 'panel'}
        @click=${this._handlePanelClick}
      >
        <slot></slot>
      </div>
    `;
  }

  // ─── ARIA setup for trigger slot ───

  private _onTriggerSlotChange(): void {
    this._setupTriggerAria();
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  private _setupTriggerAria(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;
    if (trigger) {
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', String(this.open));
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open')) {
      // Keep aria-expanded in sync
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
      if (trigger) {
        trigger.setAttribute('aria-expanded', String(this.open));
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-dropdown': HelixDropdown;
  }
}
