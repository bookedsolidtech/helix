import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixNavStyles } from './hx-nav.styles.js';

/** A single navigation item, optionally with nested children. */
export interface NavItem {
  /** Display label for the item. */
  label: string;
  /** Href for the item link. Required unless children are provided. */
  href?: string;
  /** Whether this item represents the current page. */
  current?: boolean;
  /** Nested sub-menu items. */
  children?: NavItem[];
}

/** Layout orientation for the navigation. */
type NavOrientation = 'horizontal' | 'vertical';

/**
 * Primary and secondary navigation component.
 * Supports horizontal menu bar and vertical sidebar patterns.
 * Mobile responsive with hamburger toggle.
 *
 * @summary Navigation bar supporting horizontal and vertical layouts with nested submenus.
 *
 * @tag hx-nav
 *
 * @fires {CustomEvent<{item: NavItem}>} hx-nav-select - Dispatched when a nav item is activated.
 *
 * @csspart nav - The nav landmark element.
 * @csspart list - The top-level list element.
 * @csspart item - Each list item wrapper.
 * @csspart link - The anchor or button element inside each item.
 * @csspart toggle - The mobile hamburger toggle button.
 *
 * @cssprop [--hx-nav-bg=var(--hx-color-neutral-900)] - Navigation background color.
 * @cssprop [--hx-nav-color=var(--hx-color-neutral-100)] - Navigation text color.
 * @cssprop [--hx-nav-link-color=var(--hx-color-neutral-100)] - Link text color.
 * @cssprop [--hx-nav-link-hover-bg=var(--hx-color-neutral-700)] - Link hover background.
 * @cssprop [--hx-nav-link-hover-color=var(--hx-color-white)] - Link hover text color.
 * @cssprop [--hx-nav-link-active-bg=var(--hx-color-primary-600)] - Active link background.
 * @cssprop [--hx-nav-link-active-color=var(--hx-color-white)] - Active link text color.
 * @cssprop [--hx-nav-submenu-bg=var(--hx-color-neutral-800)] - Submenu background color.
 * @cssprop [--hx-nav-font-size=var(--hx-font-size-sm)] - Navigation font size.
 * @cssprop [--hx-nav-padding=var(--hx-space-2) var(--hx-space-4)] - Navigation padding.
 * @cssprop [--hx-nav-item-padding=var(--hx-space-2) var(--hx-space-3)] - Item padding.
 * @cssprop [--hx-nav-border-radius=var(--hx-border-radius-sm)] - Item border radius.
 */
@customElement('hx-nav')
export class HelixNav extends LitElement {
  static override styles = [tokenStyles, helixNavStyles];

  // ─── Properties ───

  /**
   * Navigation items array.
   * @attr items
   */
  @property({
    type: Array,
    converter: {
      fromAttribute(value: string | null): NavItem[] {
        if (!value) return [];
        try {
          const parsed: unknown = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as NavItem[]) : [];
        } catch {
          return [];
        }
      },
    },
  })
  items: NavItem[] = [];

  /**
   * Layout orientation: 'horizontal' (menu bar) or 'vertical' (sidebar).
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: NavOrientation = 'horizontal';

  /**
   * Accessible label for the nav landmark.
   * @attr label
   */
  @property({ type: String })
  label = 'Main navigation';

  // ─── State ───

  /** @internal */
  @state() private _mobileOpen = false;
  /** @internal */
  @state() private _expandedIndex: number | null = null;

  // ─── Private: bound event handler reference ───

  /** @internal */
  private _boundOutsideClick: (e: MouseEvent) => void = this._handleOutsideClick.bind(this);

  /**
   * Sanitizes a URL to prevent XSS via javascript: or data: URIs.
   * Only allows http:, https:, relative paths, and fragment-only links.
   */
  private _sanitizeHref(href: string | undefined): string {
    if (!href || href === '#') return '#';
    // Allow relative paths, fragments, and http(s)
    if (
      href.startsWith('/') ||
      href.startsWith('./') ||
      href.startsWith('../') ||
      href.startsWith('#')
    ) {
      return href;
    }
    try {
      const url = new URL(href, window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return href;
      }
    } catch {
      // Invalid URL — fall through to safe default
    }
    return '#';
  }

  // ─── Event Handling ───

  private _handleToggle(): void {
    this._mobileOpen = !this._mobileOpen;
    if (!this._mobileOpen) {
      this._expandedIndex = null;
    }
  }

  private _handleItemClick(item: NavItem, index: number, e: Event): void {
    e.preventDefault();
    if (item.children?.length) {
      this._expandedIndex = this._expandedIndex === index ? null : index;
    } else {
      this._mobileOpen = false;
      this._expandedIndex = null;
      this.dispatchEvent(
        new CustomEvent('hx-nav-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );
    }
  }

  private _handleSubItemClick(item: NavItem): void {
    this._mobileOpen = false;
    this._expandedIndex = null;
    this.dispatchEvent(
      new CustomEvent('hx-nav-select', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    );
  }

  private _handleKeydown(e: KeyboardEvent, index: number, item: NavItem): void {
    const items = this.shadowRoot?.querySelectorAll<HTMLElement>(
      ':scope > [part="nav"] > [part="list"] > [part="item"] > [part="link"]',
    );
    if (!items) return;
    const itemsArr = Array.from(items);
    const current = itemsArr[index];

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        if (item.children?.length && e.key === 'ArrowDown' && this.orientation === 'horizontal') {
          // open submenu and focus first item
          this._expandedIndex = index;
          this.updateComplete.then(() => {
            const firstSub = this.shadowRoot?.querySelector<HTMLElement>(
              `.nav__submenu [part="link"]`,
            );
            firstSub?.focus();
          });
        } else {
          const next = itemsArr[index + 1] ?? itemsArr[0];
          next?.focus();
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prev = itemsArr[index - 1] ?? itemsArr[itemsArr.length - 1];
        prev?.focus();
        break;
      }
      case 'Escape': {
        this._expandedIndex = null;
        current?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        if (item.children?.length) {
          e.preventDefault();
          this._expandedIndex = this._expandedIndex === index ? null : index;
        }
        break;
      }
    }
  }

  private _handleSubKeydown(e: KeyboardEvent, parentIndex: number): void {
    const subItems = this.shadowRoot?.querySelectorAll<HTMLElement>(
      `.nav__submenu:not([hidden]) [part="link"]`,
    );
    if (!subItems) return;
    const arr = Array.from(subItems);
    const focused = this.shadowRoot?.activeElement as HTMLElement;
    const currentIdx = arr.indexOf(focused);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = arr[currentIdx + 1] ?? arr[0];
        next?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = arr[currentIdx - 1] ?? arr[arr.length - 1];
        prev?.focus();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._expandedIndex = null;
        const parentLinks = this.shadowRoot?.querySelectorAll<HTMLElement>(
          ':scope > [part="nav"] > [part="list"] > [part="item"] > [part="link"]',
        );
        parentLinks?.[parentIndex]?.focus();
        break;
      }
    }
  }

  private _handleOutsideClick(e: MouseEvent): void {
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._expandedIndex = null;
    }
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._boundOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._boundOutsideClick);
  }

  // ─── Render Helpers ───

  private _renderHamburgerIcon() {
    return html`<svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      ${this._mobileOpen
        ? html`<line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>`
        : html`<line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>`}
    </svg>`;
  }

  private _renderChevronIcon() {
    return html`<svg
      class="nav__chevron"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M4.5 6L8 9.5 11.5 6"
        stroke="currentColor"
        stroke-width="1.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`;
  }

  private _renderSubMenu(children: NavItem[], parentIndex: number) {
    const isExpanded = this._expandedIndex === parentIndex;
    return html`
      <ul class="nav__submenu" role="menu" aria-label="Submenu" ?hidden=${!isExpanded}>
        ${children.map(
          (child) => html`
            <li class="nav__submenu-item" role="none">
              <a
                role="menuitem"
                part="link"
                href=${this._sanitizeHref(child.href)}
                class=${classMap({
                  nav__link: true,
                  'nav__link--active': !!child.current,
                })}
                aria-current=${child.current ? 'page' : nothing}
                @click=${() => this._handleSubItemClick(child)}
                @keydown=${(e: KeyboardEvent) => this._handleSubKeydown(e, parentIndex)}
              >
                ${child.label}
              </a>
            </li>
          `,
        )}
      </ul>
    `;
  }

  private _renderItem(item: NavItem, index: number) {
    const hasChildren = !!item.children?.length;
    const isExpanded = this._expandedIndex === index;

    const linkClasses = {
      nav__link: true,
      'nav__link--active': !!item.current,
      'nav__link--has-submenu': hasChildren,
      'nav__link--expanded': isExpanded,
    };

    const content = hasChildren
      ? html`
          <button
            part="link"
            class=${classMap(linkClasses)}
            aria-expanded=${isExpanded ? 'true' : 'false'}
            aria-haspopup="menu"
            @click=${(e: Event) => this._handleItemClick(item, index, e)}
            @keydown=${(e: KeyboardEvent) => this._handleKeydown(e, index, item)}
          >
            ${item.label} ${this._renderChevronIcon()}
          </button>
          ${this._renderSubMenu(item.children ?? [], index)}
        `
      : html`
          <a
            part="link"
            href=${this._sanitizeHref(item.href)}
            class=${classMap(linkClasses)}
            aria-current=${item.current ? 'page' : nothing}
            @click=${(e: Event) => this._handleItemClick(item, index, e)}
            @keydown=${(e: KeyboardEvent) => this._handleKeydown(e, index, item)}
          >
            ${item.label}
          </a>
        `;

    return html` <li part="item" class="nav__item">${content}</li> `;
  }

  // ─── Render ───

  override render() {
    const listClasses = {
      nav__list: true,
      'nav__list--open': this._mobileOpen,
    };

    return html`
      <nav part="nav" aria-label=${this.label}>
        <button
          part="toggle"
          class="nav__toggle"
          aria-expanded=${this._mobileOpen ? 'true' : 'false'}
          aria-controls="nav-list"
          aria-label=${this._mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          @click=${this._handleToggle}
        >
          ${this._renderHamburgerIcon()}
        </button>

        <ul part="list" id="nav-list" class=${classMap(listClasses)} role="list">
          ${repeat(
            this.items,
            (item) => item.label,
            (item, i) => this._renderItem(item, i),
          )}
        </ul>
      </nav>
    `;
  }
}

/** Convenience alias matching library naming convention. */
export type WcNav = HelixNav;

declare global {
  interface HTMLElementTagNameMap {
    'hx-nav': HelixNav;
  }
}
