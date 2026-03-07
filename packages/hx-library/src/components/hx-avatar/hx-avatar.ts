import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAvatarStyles } from './hx-avatar.styles.js';

/**
 * A user avatar component that displays an image, initials, or a fallback icon.
 * Supports a badge slot for status indicator overlays.
 *
 * @summary User avatar with image, initials, and fallback icon support for healthcare applications.
 *
 * @tag hx-avatar
 *
 * @slot - Default slot for custom avatar content. Overrides src and initials when slotted content is present.
 * @slot badge - Status indicator overlay, positioned at the bottom-right of the avatar container.
 *
 * @csspart avatar - The outer container element.
 * @csspart image - The img element shown when src is provided.
 * @csspart initials - The initials text span shown as a fallback.
 * @csspart fallback-icon - The SVG person silhouette shown when no src or initials are available.
 * @csspart badge - The badge slot container.
 *
 * @cssprop [--hx-avatar-size] - Computed width and height from the size variant.
 * @cssprop [--hx-avatar-border-radius] - Circle = 50%, Square = var(--hx-border-radius-md).
 * @cssprop [--hx-avatar-bg=var(--hx-color-primary-100)] - Background color of the avatar container.
 * @cssprop [--hx-avatar-color=var(--hx-color-primary-700)] - Text and icon color inside the avatar.
 * @cssprop [--hx-avatar-font-size] - Font size for the initials text, set per size variant.
 */
@customElement('hx-avatar')
export class HelixAvatar extends LitElement {
  static override styles = [tokenStyles, helixAvatarStyles];

  /**
   * Image URL. When provided and successfully loaded, displays the image.
   * @attr src
   */
  @property({ type: String })
  src: string | undefined = undefined;

  /**
   * Accessible label for the image. Required when `src` is provided.
   * Used as the container's aria-label in image mode.
   * @attr alt
   */
  @property({ type: String })
  alt = '';

  /**
   * Human-readable accessible name for non-image states (initials, fallback icon).
   * In healthcare contexts, provide the full person name (e.g., "Dr. Jane Doe") rather than
   * relying on raw initials, which screen readers announce as individual letters.
   * When set, takes precedence over raw initials and the generic "Avatar" fallback.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Fallback initials text displayed when no image is available.
   * @attr initials
   */
  @property({ type: String })
  initials = '';

  /**
   * Size variant of the avatar.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /**
   * Shape variant of the avatar.
   * @attr shape
   */
  @property({ type: String, reflect: true })
  shape: 'circle' | 'square' = 'circle';

  /**
   * Tracks whether the image failed to load, triggering the fallback chain.
   */
  @state()
  private _imgError = false;

  /**
   * Tracks whether the default slot has assigned content.
   */
  @state()
  private _hasDefaultSlot = false;

  /**
   * Tracks whether the badge slot has assigned content.
   */
  @state()
  private _hasBadgeSlot = false;

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues): void {
    // P0-1: Reset image error state when src changes so a new valid src renders correctly.
    if (changedProperties.has('src')) {
      this._imgError = false;
    }

    // P1-2: Warn when src is provided without alt — silent accessibility failure in healthcare UIs.
    if (changedProperties.has('src') || changedProperties.has('alt')) {
      if (this.src && !this.alt) {
        console.warn(
          '[hx-avatar] Accessibility: "alt" attribute is required when "src" is provided. ' +
            'Without alt text, screen readers announce a non-descriptive label. ' +
            'Add alt="Full name or description" to your hx-avatar element.',
        );
      }
    }

    // P2-1: Warn when invalid size or shape attribute values are used (e.g., from Twig templates).
    const validSizes: ReadonlyArray<string> = ['xs', 'sm', 'md', 'lg', 'xl'];
    if (changedProperties.has('size') && !validSizes.includes(this.size)) {
      console.warn(
        `[hx-avatar] Invalid hx-size="${String(this.size)}". Valid values: xs, sm, md, lg, xl. Rendering with "md".`,
      );
    }
    const validShapes: ReadonlyArray<string> = ['circle', 'square'];
    if (changedProperties.has('shape') && !validShapes.includes(this.shape)) {
      console.warn(
        `[hx-avatar] Invalid shape="${String(this.shape)}". Valid values: circle, square. Rendering with "circle".`,
      );
    }
  }

  // ─── Slot Change Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasDefaultSlot = nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').trim().length > 0;
      }
      return false;
    });
  }

  private _handleBadgeSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasBadgeSlot = nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').trim().length > 0;
      }
      return false;
    });
  }

  // ─── Image Error Handling ───

  private _handleImgError(): void {
    this._imgError = true;
  }

  // ─── Fallback Icon ───

  private _renderFallbackIcon() {
    return html`
      <svg
        part="fallback-icon"
        class="avatar__fallback-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path
          d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
        />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const src = this.src;
    const showSlot = this._hasDefaultSlot;
    const showImage = !showSlot && !!src && !this._imgError;
    const showInitials = !showSlot && !showImage && !!this.initials.trim();
    const showFallback = !showSlot && !showImage && !showInitials;

    // P1-1 / P1-7: Use label property for human-readable accessible name in non-image states.
    const ariaLabel = showImage
      ? this.alt || this.label || 'Avatar'
      : showInitials
        ? this.label || this.initials
        : this.label || 'Avatar';

    // P2-1: Safe class fallback for invalid attribute values supplied via HTML/Twig.
    const validSizes: ReadonlyArray<string> = ['xs', 'sm', 'md', 'lg', 'xl'];
    const validShapes: ReadonlyArray<string> = ['circle', 'square'];
    const sizeClass = validSizes.includes(this.size) ? this.size : 'md';
    const shapeClass = validShapes.includes(this.shape) ? this.shape : 'circle';

    const classes = {
      avatar: true,
      [`avatar--${sizeClass}`]: true,
      [`avatar--${shapeClass}`]: true,
    };

    // P2-2: Badge wrapper is hidden (not removed) when empty so slotchange detection still works.
    const badgeClasses = {
      avatar__badge: true,
      'avatar__badge--hidden': !this._hasBadgeSlot,
    };

    return html`
      <div class="avatar-wrapper">
        <div
          part="avatar"
          class=${classMap(classes)}
          role=${showSlot ? nothing : 'img'}
          aria-label=${showSlot ? nothing : ariaLabel}
        >
          <slot @slotchange=${this._handleSlotChange}></slot>
          ${showImage && src
            ? html`<img
                part="image"
                class="avatar__image"
                src=${src}
                alt=${this.alt}
                aria-hidden="true"
                loading="lazy"
                @error=${this._handleImgError}
              />`
            : nothing}
          ${showInitials
            ? html`<span part="initials" class="avatar__initials">${this.initials.trim()}</span>`
            : nothing}
          ${showFallback ? this._renderFallbackIcon() : nothing}
        </div>
        <span part="badge" class=${classMap(badgeClasses)}>
          <slot name="badge" @slotchange=${this._handleBadgeSlotChange}></slot>
        </span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-avatar': HelixAvatar;
  }
}
