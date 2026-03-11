import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixSkeletonStyles } from './hx-skeleton.styles.js';

/**
 * An animated placeholder used to indicate loading content.
 * Purely decorative — hidden from assistive technology.
 * Supports a `loaded` state that announces content availability to screen readers.
 *
 * @summary Animated shimmer placeholder for loading states.
 *
 * @tag hx-skeleton
 *
 * @csspart base - The inner skeleton element.
 *
 * @cssprop [--hx-skeleton-bg=var(--hx-color-neutral-200)] - Skeleton background color.
 * @cssprop [--hx-skeleton-shimmer-color=rgba(255,255,255,0.4)] - Shimmer highlight color.
 * @cssprop [--hx-skeleton-shimmer-width=200%] - Shimmer sweep width (background-size X axis).
 * @cssprop [--hx-skeleton-duration=1.5s] - Shimmer animation duration.
 * @cssprop [--hx-skeleton-text-radius=var(--hx-border-radius-full)] - Border radius for text variant.
 * @cssprop [--hx-skeleton-rect-radius=var(--hx-border-radius-sm)] - Border radius for rect variant.
 * @cssprop [--hx-skeleton-button-radius=var(--hx-border-radius-md)] - Border radius for button variant.
 * @cssprop [--hx-skeleton-circle-radius=50%] - Border radius for circle variant.
 *
 * @fires hx-loaded - Dispatched when `loaded` transitions to `true`. Consumers should use
 *   this event to update an external `aria-live` region announcing content availability.
 */
@customElement('hx-skeleton')
export class HelixSkeleton extends LitElement {
  static override styles = [tokenStyles, helixSkeletonStyles];

  /**
   * Shape variant of the skeleton placeholder.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'text' | 'circle' | 'rect' | 'button' | 'paragraph' = 'rect';

  /**
   * CSS width of the skeleton. Accepts any valid CSS width value.
   * @attr width
   */
  @property({ type: String })
  width = '100%';

  /**
   * CSS height of the skeleton. Accepts any valid CSS height value.
   * Defaults vary by variant when not set.
   * @attr height
   */
  @property({ type: String })
  height: string | undefined = undefined;

  /**
   * Whether the shimmer wave animation is active.
   * Set to false to display a static skeleton.
   * @attr animated
   */
  @property({ type: Boolean, reflect: true })
  animated = true;

  /**
   * When true, hides the skeleton and dispatches an `hx-loaded` event.
   * Consumers should pair this with an external `aria-live` region to
   * announce loading completion to assistive technology users.
   *
   * @example
   * ```html
   * <div aria-live="polite" aria-atomic="true" id="status"></div>
   * <hx-skeleton id="sk"></hx-skeleton>
   * <script>
   *   document.getElementById('sk').addEventListener('hx-loaded', () => {
   *     document.getElementById('status').textContent = 'Content has loaded.';
   *   });
   * </script>
   * ```
   * @attr loaded
   */
  @property({ type: Boolean, reflect: true })
  loaded = false;

  // ─── Lifecycle ───

  override connectedCallback() {
    super.connectedCallback();
    // Hide the skeleton host from the accessibility tree entirely (P1-01).
    // Some AT + browser combinations traverse shadow hosts even when children
    // are aria-hidden. Setting on the host ensures full concealment.
    this.setAttribute('aria-hidden', 'true');
  }

  override updated(changedProperties: Map<string | symbol, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('loaded') && this.loaded) {
      this.dispatchEvent(
        new CustomEvent('hx-loaded', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ─── Render ───

  override render() {
    // When loaded, render nothing — the skeleton is replaced by real content.
    if (this.loaded) {
      return html``;
    }

    const classes = {
      skeleton: true,
      [`skeleton--${this.variant}`]: true,
      'skeleton--animated': this.animated,
    };

    const styles: Record<string, string> = {
      '--_width': this.width,
    };
    if (this.height !== undefined) {
      styles['--_height'] = this.height;
    }

    return html`
      <span
        part="base"
        class=${classMap(classes)}
        style=${styleMap(styles)}
        aria-hidden="true"
        role="presentation"
      ></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-skeleton': HelixSkeleton;
  }
}
