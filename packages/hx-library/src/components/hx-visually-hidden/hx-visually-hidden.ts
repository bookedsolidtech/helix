import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
 * @example Basic usage — accessible label for an icon button
 * ```html
 * <button>
 *   <hx-icon name="close"></hx-icon>
 *   <hx-visually-hidden>Close dialog</hx-visually-hidden>
 * </button>
 * ```
 *
 * @example Skip link — becomes visible when focused
 * ```html
 * <hx-visually-hidden focusable>
 *   <a href="#main-content">Skip to main content</a>
 * </hx-visually-hidden>
 * ```
 */
@customElement('hx-visually-hidden')
export class HelixVisuallyHidden extends LitElement {
  static override styles = [tokenStyles, helixVisuallyHiddenStyles];

  /**
   * When true, the component becomes visible when a focusable child
   * (such as a skip link) receives focus. This enables the standard
   * "skip to content" accessibility pattern.
   */
  @property({ type: Boolean, reflect: true })
  focusable = false;

  override render() {
    return html`<span part="base"><slot></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-visually-hidden': HelixVisuallyHidden;
  }
}
