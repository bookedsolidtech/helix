import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixCardStyles } from './hx-card.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

const _nextCardId = createIdCounter('hx-card');

/**
 * A flexible card component for displaying grouped content.
 *
 * @summary Content container with image, heading, body, footer, and action slots.
 *
 * @tag hx-card
 *
 * Group 10 host-canonical: when a card carries an accessible name (consumer
 * `aria-label` / `aria-labelledby`, the `hx-label` property, or slotted
 * heading text on the interactive variant) the announced role is written
 * to the host via `_internals.role`. The mapping is:
 *   - `hx-href` set         -> host role="link" + tabindex="0"
 *   - non-interactive named -> host role="region"
 *   - non-interactive plain -> no host role (generic container)
 *
 * `delegatesFocus: true` is preserved so that focusable descendants
 * slotted inside the card still receive Tab focus first; the host itself
 * is only focusable when it carries `role="link"`.
 *
 * On the legacy fallback path (engines without IDL element-references on
 * `ElementInternals`) the inner `[part="card"]` element keeps the role +
 * tabindex + aria-label so a single announced surface remains, and the
 * host writes are suppressed to avoid a duplicate-treeitem-style
 * problem. The resolved accessible name is mirrored onto the inner
 * element via `aria-label` for parity with the modern path.
 *
 * @slot image - Optional image or media content at the top of the card.
 * @slot heading - The card heading/title content. Use a semantic heading element (h2, h3, etc.) for proper accessibility.
 * @slot - Default slot for the card body content.
 * @slot footer - Optional footer content below the body.
 * @slot actions - Optional action buttons, rendered with a top border separator. Do NOT use together with hx-href (interactive card + focusable actions is an ARIA anti-pattern).
 *
 * @fires {CustomEvent<{href: string, originalEvent: MouseEvent | KeyboardEvent}>} hx-click - Dispatched when an interactive card (with hx-href) is clicked.
 *
 * @csspart card - The outer card container element.
 * @csspart image - The image slot container.
 * @csspart heading - The heading slot container.
 * @csspart body - The body slot container.
 * @csspart footer - The footer slot container.
 * @csspart actions - The actions slot container.
 *
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-color=var(--hx-color-neutral-800)] - Card text color.
 * @cssprop [--hx-card-border-color=var(--hx-color-neutral-200)] - Card border color.
 * @cssprop [--hx-card-border-radius=var(--hx-border-radius-lg)] - Card border radius.
 * @cssprop [--hx-card-padding=var(--hx-space-6)] - Internal padding for card sections.
 * @cssprop [--hx-card-gap=var(--hx-space-4)] - Gap between card sections.
 * @cssprop [--hx-card-image-aspect-ratio=16/9] - Aspect ratio for the image slot.
 * @cssprop [--hx-border-radius-lg] - CSS custom property.
 * @cssprop [--hx-border-width-medium] - Width.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-card-focus-ring-color=var(--hx-focus-ring-color)] - Color.
 * @cssprop [--hx-card-font-family=var(--hx-font-family-sans)] - Font family for card text content.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-font-size-xl] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-shadow-lg] - Box shadow.
 * @cssprop [--hx-shadow-md] - Box shadow.
 * @cssprop [--hx-shadow-xl] - Box shadow.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-transform-lift-md] - Transform applied on hover to lift the card.
 * @cssprop [--hx-transition-normal] - Transition timing.
 */
@customElement('hx-card')
export class HelixCard extends HelixElement {
  /** @internal */
  static override shadowRootOptions = {
    ...HelixElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [helixCardStyles, forcedColorsSurface];

  /**
   * Test seam (codex push-gate round-1 lift): when set to `true` or
   * `false`, overrides the platform `supportsIdrefElementReferences`
   * probe before `connectedCallback` seeds `_supportsIdrefRefs`. Mirrors
   * the hx-menu-item / hx-tree-item / hx-select seam — required so tests
   * can deterministically exercise the legacy fallback render branch.
   *
   * Production code MUST NOT touch this field. It is `static` so the
   * test stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * Visual style variant of the card.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  /**
   * Elevation (shadow depth) of the card.
   * @attr elevation
   */
  @property({ type: String, reflect: true })
  elevation: 'flat' | 'raised' | 'floating' = 'flat';

  /**
   * Optional URL. When set, the card becomes interactive (clickable)
   * and navigates to this URL on click.
   * Uses the hx-href attribute to avoid conflicting with the native HTML href attribute.
   * @attr hx-href
   */
  @property({ type: String, attribute: 'hx-href' })
  href: string | undefined = undefined;

  /**
   * Accessible label for interactive cards. Use this to provide a meaningful
   * description of the card's purpose rather than exposing the raw URL.
   * Only applies when hx-href is set.
   * @attr hx-label
   */
  @property({ type: String, attribute: 'hx-label' })
  label: string | undefined = undefined;

  // ─── Slot Detection ───

  /**
   * Tracks whether any content is assigned to the image slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasImage = false;

  /**
   * Tracks whether any content is assigned to the heading slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasHeading = false;

  /**
   * Tracks whether any content is assigned to the footer slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasFooter = false;

  /**
   * Tracks whether any content is assigned to the actions slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasActions = false;

  /**
   * Text content extracted from the heading slot, used as a fallback accessible
   * name for interactive cards when no explicit `hx-label` is provided.
   * @internal
   */
  @state() private _headingText = '';

  /**
   * Unique identifier for this card instance, used in ARIA attributes.
   * @internal
   */
  private _cardId = _nextCardId();
  /**
   * Unique identifier for the heading element, used in aria-labelledby.
   * @internal
   */
  private _headingId = `${this._cardId}-heading`;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Resolved accessible name for the card — read by both
   * `_syncHostAriaSemantics()` (modern path: host `internals.ariaLabel`)
   * and the fallback `render()` branch (legacy path: inner
   * `[part="card"]` `aria-label`). Empty string means "no override" —
   * for the interactive variant slotted heading text provides the
   * implicit name through the announced surface (host on modern; inner
   * div on fallback).
   *
   * AccName 1.2 §4.3.1 precedence: consumer host `aria-labelledby`
   * (flattened) > consumer host `aria-label` > component `hx-label`
   * property > implicit slotted heading text.
   * @internal
   */
  private _resolvedAccessibleName = '';

  /** @internal */
  private _onImageSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasImage = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _onHeadingSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasHeading = nodes.length > 0;
    this._headingText = nodes
      .map((n) => n.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    // Heading text contributes to the accessible name on the interactive
    // path; resync host semantics so consumer-supplied overrides still
    // win and the fallback render branch has a fresh `_resolvedAccessibleName`.
    this._syncHostAriaSemantics();
  }

  /** @internal */
  private _onFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooter = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _onActionsSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasActions = slot.assignedNodes({ flatten: true }).length > 0;
    if (this._hasActions && this.href) {
      devWarn(
        'hx-card',
        'Using hx-href (interactive card) together with the actions slot is an ARIA anti-pattern: ' +
          'interactive controls cannot be nested inside role="link". ' +
          'Use either hx-href or the actions slot, not both.',
      );
    }
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Honour the static test override so synthetic environments choose
    // the path BEFORE connect runs — the fallback render branch needs
    // to be selected at first paint so the role + aria-label placement
    // matches a legacy engine for the entire lifecycle.
    const ctor = this.constructor as typeof HelixCard;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);

    this._syncHostAriaSemantics();

    // Click + keydown live on the HOST so a single dispatch fires per
    // logical activation regardless of which surface is focused: on
    // the modern path the host (role="link") receives focus directly;
    // on the legacy fallback path the inner element receives focus and
    // its events bubble through the composed path to the host. The
    // inner template intentionally does NOT wire the same handlers to
    // avoid a double dispatch.
    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);

    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleClick);
    this.removeEventListener('keydown', this._handleKeyDown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    // WCAG 4.1.2: interactive cards (with hx-href) must have an accessible name
    if (
      (changedProperties.has('href') || changedProperties.has('label')) &&
      this.href &&
      !this.label &&
      !this._headingText
    ) {
      devWarn(
        'hx-card',
        "Interactive card (hx-href is set) is missing an accessible name. Set `hx-label` or provide heading slot content to describe the card's destination or purpose (WCAG 4.1.2).",
      );
    }
    if (changedProperties.has('href') || changedProperties.has('label')) {
      this._syncHostAriaSemantics();
    }
  }

  /**
   * Mirror card semantics onto the host via ElementInternals so
   * consumer-supplied `aria-label` / `aria-labelledby` reaches the
   * announced surface and the role honours the link / region / generic
   * mapping.
   *
   * Suppression rule: on the legacy fallback path the inner
   * `[part="card"]` element already exposes role + aria-label via the
   * template. Writing the same fields on the host's ElementInternals
   * would surface TWO announced controls for one logical card, so all
   * host writes are cleared on the fallback path; the inner element is
   * the canonical announced surface and `_resolvedAccessibleName` is
   * mirrored onto it via the render branch.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const isInteractive = !!this.href;

    // Resolve the consumer's effective accessible-name overrides first
    // — these win over the hx-label property and slotted heading text
    // per AccName 1.2 §4.3.1.
    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    // AccName precedence ladder for the resolved string used by the
    // fallback render branch:
    //   aria-labelledby (flattened) > aria-label > hx-label > heading text
    let resolved = '';
    if (hasEffectiveLabelledBy) {
      resolved =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        this.label ||
        this._headingText ||
        '';
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else if (this.label) {
      resolved = this.label;
    } else if (this._headingText) {
      resolved = this._headingText;
    }

    // Whether the card has an EXPLICIT accessible-name override
    // (aria-label / aria-labelledby / hx-label). Slotted heading text
    // alone is not enough to trigger the default-mode role promotion
    // to "region": the user prompt scopes Option B to "promote only
    // when a name exists" with name-source = explicit consumer
    // override or component property, not implicit slotted content
    // (otherwise every card with a heading silently becomes a
    // landmark, which clutters AT navigation).
    const hasExplicitName = hasEffectiveLabelledBy || !!hostAriaLabel || !!this.label;

    if (!this._supportsIdrefRefs) {
      // Legacy fallback: keep the inner element as the canonical
      // announced surface. Clear any host writes to avoid a duplicate
      // role + label; the render branch mirrors `_resolvedAccessibleName`
      // onto the inner div.
      internals.role = null;
      internals.ariaLabel = null;
    } else {
      // Modern host-canonical path: host carries the role and label.
      if (isInteractive) {
        internals.role = 'link';
      } else if (hasExplicitName) {
        // ARIA-in-HTML: a region without an accessible name fails
        // 4.1.2, so the role is only promoted when an explicit name
        // exists. Implicit heading text does not promote.
        internals.role = 'region';
      } else {
        internals.role = null;
      }

      // Project consumer aria-labelledby IDREFs through the IDL
      // element-references API so cross-shadow targets resolve. The
      // implicit heading element lives inside this component's shadow
      // root, so for the heading-fallback case we still rely on
      // `internals.ariaLabel` (set below) — the heading is not in the
      // host's light DOM and IDREFs cannot reach it from outside.
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;

      // `internals.ariaLabel` cascade:
      //   - aria-labelledby resolved -> null (element refs win, don't shadow them)
      //   - host aria-label -> use it directly (consumer wins over property)
      //   - hx-label property -> mirror onto host
      //   - else if heading text exists and host carries a role ->
      //     mirror heading text so AT announces something even when
      //     ariaLabelledByElements isn't supported
      if (hasEffectiveLabelledBy) {
        internals.ariaLabel = null;
      } else if (hostAriaLabel) {
        internals.ariaLabel = hostAriaLabel;
      } else if (this.label) {
        internals.ariaLabel = this.label;
      } else if (resolved && (isInteractive || hasExplicitName)) {
        internals.ariaLabel = resolved;
      } else {
        internals.ariaLabel = null;
      }
    }

    // Tabindex: link cards are focusable on the host. Region/generic
    // cards stay non-focusable so the host doesn't add a stop in the
    // sequential tab order — `delegatesFocus` will still route focus to
    // a focusable descendant if one is slotted into the body. On the
    // legacy fallback path the inner element carries tabindex via the
    // template, so the host stays out of the tab order entirely.
    if (this._supportsIdrefRefs && isInteractive) {
      this.tabIndex = 0;
    } else {
      // Defer to the absence of an explicit attribute (matches the
      // pre-migration default of "no host tabindex") rather than -1,
      // which would block delegated focus into focusable descendants.
      if (this.hasAttribute('tabindex')) {
        this.removeAttribute('tabindex');
      }
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      if (!this._supportsIdrefRefs) {
        this.requestUpdate();
      }
    }
  }

  // ─── Event Handling ───

  /** @internal */
  private _dispatchCardClick(originalEvent: MouseEvent | KeyboardEvent): void {
    if (!this.href) return;

    /**
     * Dispatched when an interactive card is clicked.
     * Includes the target href in the detail.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent<{ href: string; originalEvent: MouseEvent | KeyboardEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { href: this.href, originalEvent },
      }),
    );
  }

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    this._dispatchCardClick(e);
  }

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this.href) return;

    // WCAG 2.1.1 / ARIA APG: role="link" activates on Enter only.
    // Space is reserved for scrolling and must not activate links.
    if (e.key === 'Enter') {
      e.preventDefault();
      this._dispatchCardClick(e);
    }
  }

  // ─── Render ───

  override render() {
    const isInteractive = !!this.href;
    // On the legacy fallback path the inner element is the canonical
    // announced surface and must carry the role, tabindex, and resolved
    // accessible name. On the modern path the host owns those via
    // `_internals` and the inner element stays presentational.
    const useFallbackAria = !this._supportsIdrefRefs;
    const fallbackResolved = this._resolvedAccessibleName;
    // Region promotion on the fallback path mirrors the modern path:
    // only an explicit consumer override (aria-label / aria-labelledby
    // / hx-label) triggers the role. Heading text alone stays as
    // implicit body content under a generic container.
    const hostAriaLabelAttr = this.getAttribute('aria-label')?.trim() || '';
    const hostAriaLabelledByAttr = this.getAttribute('aria-labelledby')?.trim() || '';
    const fallbackHasExplicitName = !!hostAriaLabelAttr || !!hostAriaLabelledByAttr || !!this.label;

    const classes = {
      card: true,
      [`card--${this.variant}`]: true,
      [`card--${this.elevation}`]: true,
      'card--interactive': isInteractive,
    };

    const innerRole = useFallbackAria
      ? isInteractive
        ? 'link'
        : fallbackHasExplicitName
          ? 'region'
          : nothing
      : nothing;
    const innerTabindex = useFallbackAria && isInteractive ? '0' : nothing;
    const innerAriaLabel = useFallbackAria && fallbackResolved ? fallbackResolved : nothing;
    const innerAriaLabelledBy =
      useFallbackAria && this._hasHeading && !fallbackResolved ? this._headingId : nothing;

    // Click + keydown are wired on the HOST in connectedCallback so the
    // event path is uniform across the modern and fallback paths and a
    // single dispatch fires per logical activation regardless of where
    // the focused surface lives. The inner template stays free of
    // @click/@keydown to avoid a double-dispatch when bubbling.
    return html`
      <div
        part="card"
        class=${classMap(classes)}
        role=${innerRole}
        tabindex=${innerTabindex}
        aria-label=${innerAriaLabel}
        aria-labelledby=${innerAriaLabelledBy}
      >
        <div class="card__image" part="image" ?hidden=${!this._hasImage}>
          <slot name="image" @slotchange=${this._onImageSlotChange}></slot>
        </div>

        <div
          class="card__heading"
          part="heading"
          id=${this._headingId}
          ?hidden=${!this._hasHeading}
        >
          <slot name="heading" @slotchange=${this._onHeadingSlotChange}></slot>
        </div>

        <div class="card__body" part="body">
          <slot></slot>
        </div>

        <div class="card__footer" part="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
        </div>

        <div class="card__actions" part="actions" ?hidden=${!this._hasActions}>
          <slot name="actions" @slotchange=${this._onActionsSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-card': HelixCard;
  }
}
