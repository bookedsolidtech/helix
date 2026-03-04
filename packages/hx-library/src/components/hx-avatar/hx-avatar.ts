import { LitElement, html, nothing } from 'lit';
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
 * @slot badge - Status indicator overlay, positioned at the bottom-right of the avatar.
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
   * Accessible label for the image or avatar.
   * @attr alt
   */
  @property({ type: String })
  alt = '';

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

    const ariaLabel = showImage ? this.alt || 'Avatar' : showInitials ? this.initials : 'Avatar';

    const classes = {
      avatar: true,
      [`avatar--${this.size}`]: true,
      [`avatar--${this.shape}`]: true,
    };

    return html`
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
              loading="lazy"
              @error=${this._handleImgError}
            />`
          : nothing}
        ${showInitials
          ? html`<span part="initials" class="avatar__initials">${this.initials.trim()}</span>`
          : nothing}
        ${showFallback ? this._renderFallbackIcon() : nothing}
        <span part="badge" class="avatar__badge">
          <slot name="badge"></slot>
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
