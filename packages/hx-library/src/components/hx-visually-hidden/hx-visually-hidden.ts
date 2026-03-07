import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixVisuallyHiddenStyles } from './hx-visually-hidden.styles.js';

/**
 * A utility component that hides content visually while keeping it
 * accessible to screen readers. Uses the standard visually-hidden CSS
 * technique — does NOT use `visibility: hidden` or `display: none`,
 * which would also hide content from assistive technologies.
 *
 * @summary Hides content visually while keeping it accessible to screen readers.
 *
 * @tag hx-visually-hidden
 *
 * @slot - The content to hide visually but expose to screen readers.
 *
 * @csspart base - The inner wrapper element containing the slotted content.
 *
 * @example
 * ```html
 * <button>
 *   <hx-icon name="close"></hx-icon>
 *   <hx-visually-hidden>Close dialog</hx-visually-hidden>
 * </button>
 * ```
 */
@customElement('hx-visually-hidden')
export class HelixVisuallyHidden extends LitElement {
  static override styles = [tokenStyles, helixVisuallyHiddenStyles];

  override render() {
    return html`<span part="base"><slot></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-visually-hidden': HelixVisuallyHidden;
  }
}
