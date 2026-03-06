import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixBreadcrumbStyles } from './hx-breadcrumb.styles.js';

/**
 * Hierarchical page path navigation showing current location in site structure.
 *
 * @summary Navigation breadcrumb showing the page hierarchy. Works with Drupal's breadcrumb system.
 *
 * @tag hx-breadcrumb
 *
 * @slot - Default slot for hx-breadcrumb-item children.
 * @slot separator - Optional separator element. Its text content overrides the `separator` property.
 *
 * @csspart nav - The nav landmark element.
 * @csspart list - The ordered list containing items.
 *
 * @cssprop [--hx-breadcrumb-separator-content='/'] - Separator character between items.
 * @cssprop [--hx-breadcrumb-separator-color=var(--hx-color-neutral-400)] - Separator color.
 * @cssprop [--hx-breadcrumb-separator-gap=var(--hx-space-1)] - Horizontal gap around separators.
 * @cssprop [--hx-breadcrumb-font-size=var(--hx-font-size-sm)] - Font size.
 * @cssprop [--hx-breadcrumb-link-color=var(--hx-color-primary-600)] - Link color.
 * @cssprop [--hx-breadcrumb-link-hover-color=var(--hx-color-primary-700)] - Link hover color.
 * @cssprop [--hx-breadcrumb-text-color=var(--hx-color-neutral-700)] - Current page text color.
 */
@customElement('hx-breadcrumb')
export class HelixBreadcrumb extends LitElement {
  static override styles = [tokenStyles, helixBreadcrumbStyles];

  /**
   * The separator character displayed between breadcrumb items.
   * @attr separator
   */
  @property({ type: String })
  separator = '/';

  /**
   * The accessible label for the nav landmark.
   * @attr label
   */
  @property({ type: String })
  label = 'Breadcrumb';

  /**
   * Maximum number of items to show before collapsing middle items with an ellipsis.
   * Set to 0 (default) to show all items.
   * @attr max-items
   */
  @property({ type: Number, attribute: 'max-items' })
  maxItems = 0;

  /**
   * When true, injects a JSON-LD BreadcrumbList structured data script into the document head.
   * @attr json-ld
   */
  @property({ type: Boolean, attribute: 'json-ld' })
  jsonLd = false;

  @state() private _itemCount = 0;

  private _ellipsisItem: Element | null = null;
  private _jsonLdScript: HTMLScriptElement | null = null;

  // ─── Item Helpers ───

  /** Returns only real breadcrumb items, excluding the managed ellipsis element. */
  private _getBreadcrumbItems(slot: HTMLSlotElement): Element[] {
    return slot
      .assignedElements({ flatten: true })
      .filter(
        (el) =>
          el.tagName.toLowerCase() === 'hx-breadcrumb-item' &&
          !el.classList.contains('hx-bc-ellipsis'),
      );
  }

  // ─── Slot Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const items = this._getBreadcrumbItems(slot);

    this._itemCount = items.length;

    // Handle collapse behavior
    if (this.maxItems > 0 && items.length > this.maxItems) {
      this._applyCollapse(items);
    } else {
      this._removeCollapse(items);
    }

    // Check if any item has the explicit `current` attribute
    const hasExplicitCurrent = items.some((item) => item.hasAttribute('current'));

    // Update ARIA attributes on all real items
    items.forEach((item, i) => {
      const el = item as HTMLElement;
      const isLast = i === items.length - 1;
      const isCurrent = hasExplicitCurrent ? el.hasAttribute('current') : isLast;

      if (isCurrent) {
        el.setAttribute('aria-current', 'page');
      } else {
        el.removeAttribute('aria-current');
      }

      if (isLast) {
        el.setAttribute('data-bc-last', '');
      } else {
        el.removeAttribute('data-bc-last');
      }
    });

    if (this.jsonLd) {
      this._updateJsonLd(items);
    }
  }

  private _handleSeparatorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    if (assigned.length > 0) {
      const text = (assigned[0] as HTMLElement).textContent?.trim() ?? '';
      this.style.setProperty('--hx-breadcrumb-separator-content', JSON.stringify(text));
    }
  }

  // ─── Collapse ───

  private _applyCollapse(items: Element[]): void {
    // Show only first and last; hide all middle items
    items.forEach((item, i) => {
      const el = item as HTMLElement;
      if (i === 0 || i === items.length - 1) {
        el.removeAttribute('data-bc-hidden');
      } else {
        el.setAttribute('data-bc-hidden', '');
      }
    });

    // Create the ellipsis element once
    if (!this._ellipsisItem) {
      const el = document.createElement('hx-breadcrumb-item');
      el.classList.add('hx-bc-ellipsis');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Show all breadcrumb items');
      el.textContent = '…';
      el.addEventListener('click', () => this._expandCollapsed());
      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._expandCollapsed();
        }
      });
      this._ellipsisItem = el;
    }

    // Insert ellipsis after first item only if not already correctly placed
    const firstItem = items[0];
    if (!firstItem) return;
    if (this._ellipsisItem.previousElementSibling !== firstItem) {
      firstItem.after(this._ellipsisItem);
    }
  }

  private _expandCollapsed(): void {
    this.maxItems = 0;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (slot) {
      const items = this._getBreadcrumbItems(slot);
      this._removeCollapse(items);
    }
  }

  private _removeCollapse(items: Element[]): void {
    items.forEach((item) => {
      (item as HTMLElement).removeAttribute('data-bc-hidden');
    });

    if (this._ellipsisItem?.isConnected) {
      this._ellipsisItem.remove();
    }
  }

  // ─── JSON-LD ───

  /**
   * Stable per-instance ID used to tag the injected script element so that
   * multiple hx-breadcrumb instances on the same page don't produce conflicting
   * or duplicate structured-data blocks. Each instance owns exactly one script
   * tag identified by this ID; any stale tag from a previous render cycle is
   * removed before a new one is inserted.
   */
  private readonly _jsonLdId = `hx-breadcrumb-ld-${Math.random().toString(36).slice(2)}`;

  private _updateJsonLd(items: Element[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => {
        const href = (item as HTMLElement).getAttribute('href');
        const entry: Record<string, unknown> = {
          '@type': 'ListItem',
          position: i + 1,
          name: (item as HTMLElement).textContent?.trim() ?? '',
        };
        if (href) entry['item'] = href;
        return entry;
      }),
    };

    if (!this._jsonLdScript) {
      // Dedup guard: remove any stale script with this instance's ID before
      // creating a fresh one. This handles the edge case where the element was
      // reconnected to the DOM after being disconnected without the script
      // reference being re-established.
      document.getElementById(this._jsonLdId)?.remove();

      this._jsonLdScript = document.createElement('script');
      this._jsonLdScript.type = 'application/ld+json';
      this._jsonLdScript.id = this._jsonLdId;
      this._jsonLdScript.setAttribute('data-hx-breadcrumb', '');
      document.head.appendChild(this._jsonLdScript);
    }

    this._jsonLdScript.textContent = JSON.stringify(schema);
  }

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._jsonLdScript?.remove();
    this._jsonLdScript = null;
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('separator')) {
      this.style.setProperty('--hx-breadcrumb-separator-content', JSON.stringify(this.separator));
    }

    if (changedProperties.has('jsonLd')) {
      if (this.jsonLd) {
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
        if (slot) {
          this._updateJsonLd(this._getBreadcrumbItems(slot));
        }
      } else {
        this._jsonLdScript?.remove();
        this._jsonLdScript = null;
      }
    }
  }

  // ─── Render ───

  override render() {
    // _itemCount is read to ensure Lit re-renders when the item count changes,
    // keeping the template reactive to slotchange updates.
    void this._itemCount;

    return html`
      <nav part="nav" aria-label=${this.label}>
        <ol part="list">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </ol>
      </nav>
      <slot
        name="separator"
        class="separator-slot"
        @slotchange=${this._handleSeparatorSlotChange}
      ></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-breadcrumb': HelixBreadcrumb;
  }
}
