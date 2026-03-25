---
title: PatientCard — Full Example
description: Complete source for the PatientCard component that extends HelixCard, demonstrating all key extension patterns.
sidebar:
  order: 2
---

# PatientCard — Full Example

The complete source for the `PatientCard` component from the [Extending HELiX Components](/extending/) tutorial.

Copy this into your project as `patient-card.ts` and adjust the import path for `@helixui/library` to match your setup.

```typescript
/**
 * patient-card.ts — Example: Extending HelixCard for a clinical context
 *
 * Key patterns:
 *  - static styles = [...ParentClass.styles, css`...`]
 *  - override render() calling super.render()
 *  - @property reactive properties with reflect: true
 *  - Custom event dispatch with typed detail interface
 *  - HTMLElementTagNameMap TypeScript augmentation
 *  - JSDoc CEM annotations (@element, @slot, @event, @cssprop)
 */

import { html, css, type TemplateResult, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { HelixCard } from '@helixui/library';

// ─── Event Detail Interface ───────────────────────────────────────────────────

export interface PatientCardStatusChangeDetail {
  previousStatus: PatientCard['status'];
  status: PatientCard['status'];
  mrn: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * A patient-context card that extends HelixCard with clinical status
 * indicators, severity banners, and a domain-specific status-change event.
 *
 * @element org-patient-card
 *
 * @summary Displays patient information with a live status badge and optional
 *   severity banner. Inherits all slots, CSS parts, and design token support
 *   from HelixCard.
 *
 * @slot image       - Patient photo or avatar media.
 * @slot heading     - Patient name. Use a semantic heading element (h2, h3, etc.).
 * @slot             - Default slot for patient details and clinical notes.
 * @slot footer      - Timestamps, last-updated metadata, status badge area.
 * @slot actions     - Action buttons (schedule, message, view chart).
 *
 * @fires {CustomEvent<PatientCardStatusChangeDetail>} org-status-change -
 *   Fired when the status property changes. bubbles: true, composed: true.
 *
 * @csspart card     - Inherited: the outer card container element.
 * @csspart image    - Inherited: the image slot container.
 * @csspart heading  - Inherited: the heading slot container.
 * @csspart body     - Inherited: the body slot container.
 * @csspart footer   - Inherited: the footer slot container.
 * @csspart actions  - Inherited: the actions slot container.
 *
 * @cssprop [--org-patient-card-status-color=var(--hx-color-neutral-500)]
 *   Color of the status badge text and background tint.
 *
 * @cssprop [--org-patient-card-severity-bg=var(--hx-color-warning-100,#fef3c7)]
 *   Background color of the high-severity banner.
 */
@customElement('org-patient-card')
export class PatientCard extends HelixCard {
  // ─── Styles ────────────────────────────────────────────────────────────────

  static override styles = [
    ...HelixCard.styles,
    css`
      :host([status='critical']) {
        --org-patient-card-status-color: var(--hx-color-danger-600, #dc2626);
      }
      :host([status='stable']) {
        --org-patient-card-status-color: var(--hx-color-success-600, #16a34a);
      }
      :host([status='monitoring']) {
        --org-patient-card-status-color: var(--hx-color-warning-600, #d97706);
      }
      :host([status='discharged']) {
        --org-patient-card-status-color: var(--hx-color-neutral-400, #9ca3af);
      }

      .patient-status-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--hx-space-1, 0.25rem);
        padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
        border-radius: var(--hx-border-radius-full, 9999px);
        font-size: var(--hx-font-size-xs, 0.75rem);
        font-weight: var(--hx-font-weight-semibold, 600);
        letter-spacing: var(--hx-letter-spacing-wide, 0.025em);
        text-transform: uppercase;
        color: var(--org-patient-card-status-color, var(--hx-color-neutral-500, #6b7280));
        background-color: color-mix(
          in srgb,
          var(--org-patient-card-status-color, var(--hx-color-neutral-500, #6b7280)) 12%,
          transparent
        );
      }

      .patient-severity-banner {
        padding: var(--hx-space-2, 0.5rem) var(--hx-card-padding, var(--hx-space-6, 1.5rem));
        background-color: var(
          --org-patient-card-severity-bg,
          var(--hx-color-warning-100, #fef3c7)
        );
        color: var(--hx-color-warning-800, #92400e);
        font-size: var(--hx-font-size-sm, 0.875rem);
        font-weight: var(--hx-font-weight-medium, 500);
        border-bottom: var(--hx-border-width-thin, 1px) solid
          var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
      }
    `,
  ];

  // ─── Properties ────────────────────────────────────────────────────────────

  /**
   * Clinical status of the patient.
   * @attr status
   */
  @property({ type: String, reflect: true })
  status: 'stable' | 'monitoring' | 'critical' | 'discharged' = 'stable';

  /**
   * Severity level. When 'high', renders a severity banner above the card body.
   * @attr severity
   */
  @property({ type: String, reflect: true })
  severity: 'low' | 'medium' | 'high' = 'low';

  /**
   * Medical Record Number — included in org-status-change event detail.
   * @attr mrn
   */
  @property({ type: String })
  mrn: string | undefined;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('status')) {
      const previousStatus = changedProperties.get('status') as PatientCard['status'];

      this.dispatchEvent(
        new CustomEvent<PatientCardStatusChangeDetail>('org-status-change', {
          bubbles: true,
          composed: true,
          detail: {
            previousStatus,
            status: this.status,
            mrn: this.mrn,
          },
        }),
      );
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  override render(): TemplateResult {
    return html`
      ${this.severity === 'high'
        ? html`
            <div class="patient-severity-banner" role="status" aria-live="polite">
              High severity — clinical review required
            </div>
          `
        : ''}

      ${super.render()}

      <span class="patient-status-badge" aria-label="Status: ${this.status}">
        ${this.status}
      </span>
    `;
  }
}

// ─── TypeScript Global Type Augmentation ───────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap {
    'org-patient-card': PatientCard;
  }
}
```

---

## Usage

```html
<org-patient-card
  variant="featured"
  elevation="raised"
  status="critical"
  severity="high"
  mrn="MRN-00123456"
  hx-aria-label="Navigate to patient James Martin's chart"
  hx-href="/patients/MRN-00123456"
>
  <img slot="image" src="/photos/patient-thumb.jpg" alt="" />
  <h2 slot="heading">James Martin</h2>
  <p>DOB: 1958-03-11 &bull; Room 412 &bull; Attending: Dr. Okafor</p>
  <time slot="footer" datetime="2026-03-24T14:22:00Z">Updated 14:22</time>
  <hx-button slot="actions" variant="primary" size="sm">View Chart</hx-button>
</org-patient-card>
```

```javascript
document.querySelector('org-patient-card')
  .addEventListener('org-status-change', (e) => {
    const { status, previousStatus, mrn } = e.detail;
    auditLog.record({ mrn, from: previousStatus, to: status, at: Date.now() });
  });
```

---

Return to the [tutorial](/extending/) for a walkthrough of each pattern.
