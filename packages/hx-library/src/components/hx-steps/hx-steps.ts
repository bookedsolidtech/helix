import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixStepsStyles } from './hx-steps.styles.js';
import type { HelixStep } from './hx-step.js';

/**
 * A multi-step wizard / stepper progress indicator. Renders a sequence of
 * `<hx-step>` children as a horizontal or vertical step tracker with connector
 * lines and status-based styling.
 *
 * Provide an `aria-label` on `<hx-steps>` to describe the step process for assistive technology.
 *
 * @summary Multi-step progress indicator container.
 *
 * @tag hx-steps
 *
 * @slot - Default slot for `<hx-step>` elements.
 *
 * @fires {CustomEvent<{step: HelixStep, index: number}>} hx-step-click - Dispatched when
 *   a step is clicked. Detail contains the clicked `step` element and its zero-based `index`.
 *
 * @csspart base - The inner wrapper element.
 *
 * @cssprop [--hx-steps-indicator-size=2rem] - Step indicator circle diameter.
 * @cssprop [--hx-steps-connector-color=var(--hx-color-neutral-200)] - Connector line color.
 * @cssprop [--hx-steps-label-color=var(--hx-color-neutral-600)] - Step label text color.
 * @cssprop [--hx-steps-description-color=var(--hx-color-neutral-500)] - Step description color.
 */
@customElement('hx-steps')
export class HelixSteps extends LitElement {
  static override styles = [tokenStyles, helixStepsStyles];

  // ─── Public Properties ───

  /**
   * Layout orientation of the steps.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Size variant of the steps.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'list');
    }
    this.addEventListener('hx-step-click-internal', this._handleStepClickInternal as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener(
      'hx-step-click-internal',
      this._handleStepClickInternal as EventListener,
    );
  }

  override firstUpdated(): void {
    this._syncChildren();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('orientation') || changedProperties.has('size')) {
      this._syncChildren();
    }
  }

  // ─── Child Sync ───

  /** @internal */
  private _getSteps(): HelixStep[] {
    return Array.from(this.querySelectorAll(':scope > hx-step')) as HelixStep[];
  }

  /** @internal */
  private _syncChildren(): void {
    const steps = this._getSteps();
    steps.forEach((step, i) => {
      step.orientation = this.orientation;
      step.size = this.size;
      step.index = i;
    });
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleSlotChange = (): void => {
    this._syncChildren();
  };

  /** @internal */
  private _handleStepClickInternal = (e: Event): void => {
    e.stopPropagation();
    const steps = this._getSteps();
    const step = e
      .composedPath()
      .find(
        (el): el is HelixStep => el instanceof Element && el.tagName.toLowerCase() === 'hx-step',
      );
    if (!step) return;
    const index = steps.indexOf(step);

    /**
     * Dispatched when a step is clicked.
     * @event hx-step-click
     */
    this.dispatchEvent(
      new CustomEvent('hx-step-click', {
        bubbles: true,
        composed: true,
        detail: { step, index },
      }),
    );
  };

  // ─── Render ───

  override render() {
    return html`
      <div part="base" class="steps">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-steps': HelixSteps;
  }
}
