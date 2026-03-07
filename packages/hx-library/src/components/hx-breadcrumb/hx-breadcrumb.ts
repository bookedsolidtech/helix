import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
 *   NOTE: If overriding this custom property directly in CSS (rather than via the `separator`
 *   attribute), the value MUST be quoted: `--hx-breadcrumb-separator-content: ">"`. An unquoted
 *   value is invalid for the CSS `content` property and will silently render nothing.
 * @cssprop [--hx-breadcrumb-separator-color=var(--hx-color-neutral-400)] - Separator color.
 * @cssprop [--hx-breadcrumb-separator-gap=var(--hx-space-1)] - Horizontal gap around separators.
 * @cssprop [--hx-breadcrumb-font-size=var(--hx-font-size-sm)] - Font size.
 * @cssprop [--hx-breadcrumb-link-color=var(--hx-color-primary-600)] - Link color.
 * @cssprop [--hx-breadcrumb-link-hover-color=var(--hx-color-primary-700)] - Link hover color.
 * @cssprop [--hx-breadcrumb-text-color=var(--hx-color-neutral-700)] - Current page text color.
 * @cssprop [--hx-breadcrumb-item-max-width] - Max-width for item text truncation (e.g. `12rem`).
 */
@customElement('hx-breadcrumb')
export class HelixBreadcrumb extends LitElement {
  static override styles = [tokenStyles, helixBreadcrumbStyles];

  /**
   * Per-instance counter used to generate stable, deterministic IDs for the
   * injected JSON-LD script tags. Deterministic IDs (vs Math.random()) allow
   * SSR frameworks to match server-rendered script tags during hydration.
   */
  private static _instanceCounter = 0;

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
   * Set to 0 (default) to show all items. The ellipsis is a keyboard-accessible
   * button; activating it expands the full breadcrumb by setting maxItems to 0.
   * @attr max-items
   */
  @property({ type: Number, attribute: 'max-items' })
  maxItems = 0;

  /**
   * When true, injects a JSON-LD BreadcrumbList structured data script into the document head.
   *
   * NOTE: Drupal manages `<head>` content via its own render pipeline. Injecting a
   * `<script>` directly via `document.head.appendChild()` in a Drupal context:
   * 1. Bypasses Drupal's deduplication and `hook_html_head_alter()` hook.
   * 2. Is not cacheable by Drupal's page cache.
   * 3. Will be wiped on BigPipe partial page replacements.
   *
   * For Drupal integrations, leave `json-ld` false and use the structured data
   * Twig template instead (see `hx-breadcrumb.twig` in the component directory).
   *
   * @attr json-ld
   */
  @property({ type: Boolean, attribute: 'json-ld' })
  jsonLd = false;

  private _ellipsisItem: Element | null = null;
  private _jsonLdScript: HTMLScriptElement | null = null;

  /**
   * Tracks which items had their `current` attribute set by this component
   * (as opposed to set by a consumer/Drupal template). This lets us re-evaluate
   * positional current-page detection on each slotchange without incorrectly
   * treating a previously component-set `current` attribute as a consumer-set
   * explicit override.
   */
  private readonly _managedCurrentItems = new WeakSet<Element>();

  /**
   * Stable per-instance ID used to tag the injected script element so that
   * multiple hx-breadcrumb instances on the same page don't produce conflicting
   * or duplicate structured-data blocks. Each instance owns exactly one script
   * tag identified by this ID; any stale tag from a previous render cycle is
   * removed before a new one is inserted.
   *
   * Uses a static counter (not Math.random()) so IDs are deterministic across
   * server and client renders, enabling SSR hydration matching.
   */
  private readonly _jsonLdId = `hx-breadcrumb-ld-${++HelixBreadcrumb._instanceCounter}`;

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

  /**
   * Applies aria/state attributes to the item list.
   *
   * Current-page detection: if any item has an explicit `current` attribute
   * (e.g. set by a Drupal Twig template), that item is treated as the current
   * page. Otherwise the last item is the current page (default behaviour).
   *
   * This separation allows Drupal to control current-page marking without
   * relying on item order.
   */
  private _applyItemAttributes(items: Element[]): void {
    // Detect consumer-set 'current' attributes. An item has an explicit consumer
    // current if it has the 'current' attribute AND the component did not set it
    // (tracked via _managedCurrentItems). This prevents component-managed state
    // from being misread as a consumer override on subsequent slotchange events.
    const hasExplicitCurrent = items.some(
      (el) => el.hasAttribute('current') && !this._managedCurrentItems.has(el),
    );

    items.forEach((item, i) => {
      const el = item as HTMLElement;
      const isLast = i === items.length - 1;

      // Separator hiding: always positional — last item has no trailing separator.
      if (isLast) {
        el.setAttribute('data-bc-last', '');
      } else {
        el.removeAttribute('data-bc-last');
      }

      // Current-page marker: explicit consumer attribute wins over positional last.
      // The item component renders aria-current="page" on its inner element
      // based on this attribute (see hx-breadcrumb-item.ts).
      if (!hasExplicitCurrent) {
        if (isLast) {
          el.setAttribute('current', '');
          this._managedCurrentItems.add(el);
        } else {
          el.removeAttribute('current');
          this._managedCurrentItems.delete(el);
        }
      }
      // When hasExplicitCurrent is true, leave 'current' attributes as-is so
      // consumer or Drupal template markup is not overridden.
    });
  }

  // ─── Slot Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const items = this._getBreadcrumbItems(slot);

    // Handle collapse behaviour
    if (this.maxItems > 0 && items.length > this.maxItems) {
      this._applyCollapse(items);
    } else {
      this._removeCollapse(items);
    }

    this._applyItemAttributes(items);

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
      const ellipsis = document.createElement('hx-breadcrumb-item');
      ellipsis.classList.add('hx-bc-ellipsis');

      // Keyboard-accessible expand button. Slotted into hx-breadcrumb-item's
      // default slot so it renders inside the item wrapper with correct styles.
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '…';
      btn.setAttribute('aria-label', 'Show all breadcrumb items');
      btn.addEventListener('click', () => this._expandBreadcrumb());
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._expandBreadcrumb();
        }
      });
      ellipsis.appendChild(btn);

      this._ellipsisItem = ellipsis;
    }

    // Insert ellipsis after first item only if not already correctly placed
    const firstItem = items[0];
    if (!firstItem) return;
    if (this._ellipsisItem.previousElementSibling !== firstItem) {
      firstItem.after(this._ellipsisItem);
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

  /**
   * Expands a collapsed breadcrumb by resetting maxItems to 0.
   * Called by the ellipsis expand button (click or Enter/Space).
   */
  private _expandBreadcrumb(): void {
    this.maxItems = 0;
    // updated() will detect the maxItems change and call _removeCollapse.
  }

  // ─── JSON-LD ───

  /**
   * JSON-LD ListItem entry with typed fields to avoid Record<string, unknown>.
   */
  private _buildListItem(
    item: Element,
    position: number,
  ): { '@type': string; position: number; name: string; item?: string } {
    const href = (item as HTMLElement).getAttribute('href');
    const name = (item as HTMLElement).textContent?.trim() ?? '';
    const entry: { '@type': string; position: number; name: string; item?: string } = {
      '@type': 'ListItem',
      position,
      name,
    };
    if (href) entry.item = href;
    return entry;
  }

  private _updateJsonLd(items: Element[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => this._buildListItem(item, i + 1)),
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

  private _removeJsonLd(): void {
    this._jsonLdScript?.remove();
    this._jsonLdScript = null;
  }

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeJsonLd();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('separator')) {
      // JSON.stringify wraps the string in quotes so the value is valid
      // for use in the CSS `content` property (e.g. '/' becomes '"/"').
      this.style.setProperty('--hx-breadcrumb-separator-content', JSON.stringify(this.separator));
    }

    if (changedProperties.has('maxItems')) {
      // Re-evaluate collapse state when maxItems changes programmatically
      // (e.g. when the expand button resets maxItems to 0).
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
      if (slot) {
        const items = this._getBreadcrumbItems(slot);
        if (this.maxItems > 0 && items.length > this.maxItems) {
          this._applyCollapse(items);
        } else {
          this._removeCollapse(items);
        }
        this._applyItemAttributes(items);
      }
    }

    if (changedProperties.has('jsonLd')) {
      if (this.jsonLd) {
        // json-ld toggled on after initial render — inject script immediately.
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
        if (slot) {
          this._updateJsonLd(this._getBreadcrumbItems(slot));
        }
      } else {
        // json-ld toggled off — remove existing script.
        this._removeJsonLd();
      }
    }
  }

  // ─── Render ───

  override render() {
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
