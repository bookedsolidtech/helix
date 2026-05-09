import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../hx-icon/hx-icon.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixAccordionItemStyles } from './hx-accordion-item.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';

const chevronIcon = html`<hx-icon
  class="accordion-item__chevron"
  library="helix"
  name="chevron-down"
  aria-hidden="true"
></hx-icon>`;

const _nextAccordionItemId = createIdCounter('hx-accordion-item');

/** Detail for hx-expand and hx-collapse events dispatched by hx-accordion-item. */
export interface HxAccordionToggleDetail {
  expanded: boolean;
  itemId: string;
}

/**
 * An individual accordion item with collapsible content.
 *
 * ## Architecture Note: Slot Projection vs. Host-Canonical (group-4 round-1)
 *
 * `hx-accordion-item` deliberately does NOT participate in the
 * host-canonical / `internals.ariaLabelledByElements` pattern used by every
 * other group-2/3/4 component. Rationale:
 *
 *   1. The trigger label comes from `<slot name="trigger">` — consumer
 *      light-DOM projected directly into the `<summary>` element. AT reads
 *      the slot-projected text natively because slot projection preserves
 *      accessible name (the `<summary>` IS the heading and consumes the
 *      slotted text in its own accessible name computation).
 *   2. `aria-labelledby="${_uid}-trigger"` on the inner content region and
 *      `aria-controls="${_uid}-content"` on the summary BOTH resolve
 *      same-shadow-root, which works correctly across every AT — these
 *      IDREFs never cross a shadow boundary.
 *   3. Pushing these ids through `internals.ariaLabelledByElements` would
 *      either duplicate the wiring (heading announced twice) or break the
 *      native `<details>/<summary>` toggle semantics (the host carrying
 *      `role="heading"` would shadow the summary's own heading projection).
 *
 * `role="heading"` on `<summary>` (with `aria-level=N`) is the APG-canonical
 * Accordion pattern. Per the APG note, `<summary>` MUST be a direct child
 * of `<details>` for the native toggle to function — wrapping it in an
 * `<h3>` would forfeit native disclosure. The role-on-summary approach is
 * the authoritative compromise. NVDA, JAWS, and VoiceOver all announce the
 * summary as a heading at the configured level when this pattern is used.
 *
 * `aria-controls` on the summary points at the shadow-internal content
 * region; APG marks the relationship as implicit via the heading + region
 * structure, so AT not following the IDREF still announces correctly. The
 * IDREF is a hint, not a requirement — and because both ids are in the
 * same shadow root, it resolves cleanly when AT does follow it. This
 * matches the popover/dropdown intentional `aria-controls` omission for
 * the cross-shadow case (see those components' code comments).
 *
 * @summary Collapsible panel that can be expanded or collapsed.
 *
 * @tag hx-accordion-item
 *
 * @slot trigger - The heading/trigger content for this item.
 * @slot - Default slot for the collapsible body content.
 *
 * @attr {number} level - Heading level (1–6) for the trigger via `role="heading" aria-level`.
 *   Defaults to 3. Set this to match the document outline — e.g., use `level="2"` when the
 *   accordion appears under an `<h1>` landmark.
 *
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-expand - Dispatched when the item is expanded.
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-collapse - Dispatched when the item is collapsed.
 *
 * @csspart item - The outer details element container.
 * @csspart trigger - The summary/trigger element.
 * @csspart content - The collapsible content area.
 * @csspart icon - The expand/collapse icon.
 *
 * @cssprop [--hx-accordion-border-color=var(--hx-color-neutral-200)] - Border color between items.
 * @cssprop [--hx-accordion-trigger-padding=var(--hx-space-4)] - Trigger padding.
 * @cssprop [--hx-accordion-trigger-color=var(--hx-color-neutral-800)] - Trigger text color.
 * @cssprop [--hx-accordion-trigger-bg=transparent] - Trigger background color.
 * @cssprop [--hx-accordion-trigger-hover-bg=var(--hx-color-neutral-50)] - Trigger hover background.
 * @cssprop [--hx-accordion-icon-color=var(--hx-color-neutral-500)] - Icon color.
 * @cssprop [--hx-accordion-content-padding=0 var(--hx-space-4) var(--hx-space-4)] - Content padding.
 * @cssprop [--hx-accordion-content-color=var(--hx-color-neutral-600)] - Content text color.
 */
@customElement('hx-accordion-item')
export class HelixAccordionItem extends HelixElement {
  static override styles = [helixAccordionItemStyles, forcedColorsInteractive];

  /** @internal */
  private _uid = _nextAccordionItemId();

  /**
   * Whether this item is expanded.
   * @attr expanded
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Whether this item is disabled (cannot be toggled).
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Heading level (1–6) applied via `role="heading" aria-level` on the summary
   * trigger. Defaults to 3. Set to match the document outline around the
   * accordion so screen readers surface accordion items in the heading list.
   * @attr level
   */
  @property({ type: Number })
  level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.closest('hx-accordion')) {
      devWarn(
        'hx-accordion-item',
        'Used outside hx-accordion. Single-expand coordination will not function.',
      );
    }
  }

  // ─── Slot Handlers ───

  /** @internal */
  private _handleTriggerSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const hasContent = slot.assignedNodes({ flatten: true }).length > 0;
    if (!hasContent) {
      devWarn(
        'hx-accordion-item',
        'trigger slot is empty — provide a visible label for keyboard and screen reader users.',
      );
    }
  }

  // ─── Heading Level Helper ───

  /**
   * Returns a clamped heading level (1–6) for use as `aria-level` on the
   * `<summary>` element. Per the WAI-ARIA APG Accordion pattern, the
   * `<summary>` must be a **direct child** of `<details>` for native
   * disclosure behaviour to work. Instead of wrapping `<summary>` inside
   * an `<h3>` (which breaks the native toggle), we apply
   * `role="heading" aria-level="N"` directly on `<summary>`.
   */
  /** @internal */
  private get _headingLevel(): number {
    return Math.max(1, Math.min(6, this.level));
  }

  // ─── Toggle Logic ───

  /** @internal */
  private _toggle(): void {
    if (this.disabled) return;

    const willExpand = !this.expanded;
    this.expanded = willExpand;

    this._dispatchToggleEvent(willExpand);
  }

  /** @internal */
  _dispatchToggleEvent(expanded: boolean): void {
    const detail = { expanded, itemId: this.id || '' };
    const options = { bubbles: true, composed: true, detail };

    if (expanded) {
      this.dispatchEvent(
        new CustomEvent<{ expanded: boolean; itemId: string }>('hx-expand', options),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent<{ expanded: boolean; itemId: string }>('hx-collapse', options),
      );
    }
  }

  // ─── Event Handlers ───

  /** @internal */
  private _handleSummaryClick(e: MouseEvent): void {
    e.preventDefault();
    this._toggle();
  }

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  // ─── Render ───

  override render() {
    const itemClasses = {
      item: true,
      'item--expanded': this.expanded,
      'item--disabled': this.disabled,
    };

    return html`
      <details part="item" class=${classMap(itemClasses)} ?open=${this.expanded}>
        <summary
          id=${`${this._uid}-trigger`}
          part="trigger"
          class="trigger"
          role="heading"
          aria-level=${this._headingLevel}
          tabindex=${this.disabled ? '-1' : '0'}
          aria-expanded=${this.expanded ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-controls=${`${this._uid}-content`}
          @click=${this._handleSummaryClick}
          @keydown=${this._handleKeyDown}
        >
          <slot name="trigger" @slotchange=${this._handleTriggerSlotChange}></slot>
          <span part="icon" class="icon">${chevronIcon}</span>
        </summary>
        <div class="content-wrapper">
          <div class="content-inner">
            <div
              id=${`${this._uid}-content`}
              part="content"
              class="content"
              role="region"
              aria-labelledby=${`${this._uid}-trigger`}
              aria-hidden=${this.expanded ? nothing : 'true'}
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </details>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion-item': HelixAccordionItem;
  }
}
