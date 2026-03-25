---
title: Extending HELiX Components
description: Build custom domain-specific components by extending HelixCard and other HELiX base classes through Lit class inheritance.
sidebar:
  order: 1
---

# Extending HELiX Components

HELiX components are plain Lit 3.x classes. You can extend them using standard JavaScript class inheritance to create domain-specific components that carry your application's logic while inheriting HELiX's accessibility guarantees, design token integration, and slot architecture.

This tutorial walks through building a `PatientCard` component that extends `HelixCard` — demonstrating every key pattern: style extension, reactive properties, `super.render()` composition, custom events, and TypeScript type augmentation.

---

## Prerequisites

Before extending a HELiX component you should be comfortable with:

- [Reactive Properties](/components/fundamentals/reactive-properties) — `@property` and `@state` decorators
- [Shadow DOM Slots](/components/shadow-dom/slots) — slot-based composition
- [Custom Events](/components/events/custom-events) — `dispatchEvent` and event detail typing
- [Design Tokens](/components/styling/tokens) — `--hx-*` CSS custom properties

Install the library into your project if you have not already:

```bash
npm install @helixui/library
```

---

## Why Extend Instead of Wrap?

Two patterns exist for building on top of HELiX: **wrapping** (composition through slots) and **extending** (class inheritance).

| Concern | Wrapping | Extending |
|---|---|---|
| Slot architecture | Delegated to HELiX | Inherited directly |
| Styles | CSS custom properties only | Full access to extend `static styles` |
| Reactive properties | Not accessible | Inherited + extensible |
| `render()` override | Not possible | Full control via `super.render()` |
| Custom element name | Your tag wraps `hx-*` | Single element in the DOM |
| Best for | Simple layout composition | Domain-specific variants with new behavior |

Use **wrapping** when you need slot content reuse and the HELiX component's external API is sufficient.

Use **extending** when you need to add reactive properties, override render logic, augment event handling, or ship a new named element backed by HELiX internals.

---

## Extending HelixCard

`HelixCard` is the base class for `hx-card`. Its public API includes:

```typescript
// From packages/hx-library/src/components/hx-card/hx-card.ts
export class HelixCard extends LitElement {
  static override styles = [tokenStyles, helixCardStyles];

  variant: 'default' | 'featured' | 'compact' = 'default';
  elevation: 'flat' | 'raised' | 'floating' = 'flat';
  hxHref: string | undefined;
  hxAriaLabel: string | undefined;

  override render(): TemplateResult { /* ... */ }
}
```

Key facts for extension:

- `static styles` is an array — extend it with the spread pattern
- `render()` returns a `TemplateResult` — call `super.render()` to reuse the full slot structure
- All `@property` declarations are inherited
- The `hx-click` custom event fires from `_dispatchCardClick` — use `addEventListener` rather than overriding the private method

---

## The PatientCard Example

The complete example is available on the [PatientCard Example](/extending/patient-card) page as a standalone reference. The sections below walk through each pattern in turn.

### 1. Import and Declare the Class

```typescript
import { html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { HelixCard } from '@helixui/library';

/**
 * A patient-context card extending HelixCard with clinical status indicators.
 *
 * @element org-patient-card
 * @summary Displays patient information with a status badge and severity level.
 *
 * @slot image - Patient photo or avatar.
 * @slot heading - Patient name. Use a semantic heading element (h2, h3, etc.).
 * @slot - Default slot for patient details and clinical notes.
 * @slot footer - Timestamps, last-updated metadata.
 * @slot actions - Action buttons (schedule, message, view chart).
 *
 * @event {CustomEvent<PatientCardStatusChangeDetail>} org-status-change - Fired when
 *   the status property changes programmatically. Bubbles and crosses shadow boundaries.
 *
 * @cssprop [--org-patient-card-status-color=var(--hx-color-neutral-500)] - Status badge color.
 * @cssprop [--org-patient-card-severity-bg=var(--hx-color-warning-100)] - Severity banner background.
 */
@customElement('org-patient-card')
export class PatientCard extends HelixCard {
```

Key points:

- Use your organization prefix (`org-`) — never `hx-` for extended components
- Replicate the JSDoc `@element`, `@slot`, `@event`, and `@cssprop` annotations for CEM generation
- The `@customElement` decorator handles `customElements.define()`

### 2. Extend Static Styles

Styles are merged using the array spread pattern. All parent styles remain active:

```typescript
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

    .patient-status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--hx-space-1, 0.25rem);
      padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
      border-radius: var(--hx-border-radius-full, 9999px);
      font-size: var(--hx-font-size-xs, 0.75rem);
      font-weight: var(--hx-font-weight-semibold, 600);
      color: var(--org-patient-card-status-color, var(--hx-color-neutral-500));
      background-color: color-mix(
        in srgb,
        var(--org-patient-card-status-color, var(--hx-color-neutral-500)) 12%,
        transparent
      );
    }

    .patient-severity-banner {
      padding: var(--hx-space-2, 0.5rem) var(--hx-card-padding, var(--hx-space-6, 1.5rem));
      background-color: var(
        --org-patient-card-severity-bg,
        var(--hx-color-warning-100, #fef3c7)
      );
      font-size: var(--hx-font-size-sm, 0.875rem);
      border-bottom: 1px solid var(--hx-card-border-color, var(--hx-color-neutral-200));
    }
  `,
];
```

Every `--hx-*` value uses a fallback so the component degrades gracefully when tokens are not loaded.

### 3. Declare Reactive Properties

New properties are declared with `@property`. Reflect properties that are useful as CSS attribute selectors:

```typescript
/**
 * Clinical status of the patient.
 * Reflected as an attribute for CSS `:host([status])` selectors.
 * @attr status
 */
@property({ type: String, reflect: true })
status: 'stable' | 'monitoring' | 'critical' | 'discharged' = 'stable';

/**
 * Severity level. When set to 'high', renders a dismissible banner above the card body.
 * @attr severity
 */
@property({ type: String, reflect: true })
severity: 'low' | 'medium' | 'high' = 'low';

/**
 * MRN (Medical Record Number) for linking to external systems.
 * Not reflected — not useful as a CSS selector attribute.
 * @attr mrn
 */
@property({ type: String })
mrn: string | undefined;
```

### 4. Dispatch Custom Events

Define a TypeScript interface for the event detail, then dispatch using `CustomEvent`:

```typescript
export interface PatientCardStatusChangeDetail {
  previousStatus: PatientCard['status'];
  status: PatientCard['status'];
  mrn: string | undefined;
}
```

```typescript
override updated(changedProperties: Map<PropertyKey, unknown>): void {
  super.updated(changedProperties as Parameters<typeof super.updated>[0]);

  if (changedProperties.has('status')) {
    const previousStatus = changedProperties.get('status') as PatientCard['status'];

    /**
     * Dispatched whenever the status property changes.
     * @event org-status-change
     */
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
```

Always set `bubbles: true, composed: true` so events cross shadow boundaries and reach listeners on ancestor elements.

### 5. Override render() with super.render()

Call `super.render()` to retain the full HELiX card slot structure. Wrap it in additional markup:

```typescript
override render(): TemplateResult {
  return html`
    ${this.severity === 'high'
      ? html`<div class="patient-severity-banner" role="status">
          High severity — review required
        </div>`
      : ''}
    ${super.render()}
    <span class="patient-status-badge" slot="footer">
      ${this.status}
    </span>
  `;
}
```

The `super.render()` call returns the full `<div part="card">` subtree including all named slots. Content you project into the extended element's slots continues to land in the correct named slots inside the parent's shadow DOM.

---

## Key Concepts

### Style Inheritance

The spread pattern `[...HelixCard.styles, css`...`]` creates a new array containing both the parent style sheets and yours. Lit applies all sheets in order — parent styles first, then your additions. This means:

- You **cannot** remove parent CSS rules
- You **can** override them by specificity or by overriding the CSS custom property they consume
- Component-scoped tokens (e.g. `--hx-card-bg`) are the correct override mechanism

### The super.render() Contract

When you override `render()` and call `super.render()`, the returned template is rendered as a child of your own template. Both live inside the same shadow root. Slots are resolved against the shadow root as a whole — your additional content and `super.render()`'s content share the same slot namespace.

Practical consequence: do not add `slot` attributes to content outside `super.render()` expecting them to resolve inside the parent's template. Slots flow from light DOM inward, not between templates inside the same shadow root.

### CSS Parts Inheritance

CSS parts defined on `HelixCard` (`::part(card)`, `::part(body)`, etc.) are available on your extended element automatically. External consumers can still use:

```css
org-patient-card::part(card) {
  border-width: 2px;
}
```

You can add new parts in your overridden template using `part="your-part"`. You cannot remove parts the parent template declares.

### Slot Forwarding

All named slots from `HelixCard` (`image`, `heading`, `footer`, `actions`) continue to work unchanged. Light DOM content assigned to those slots flows through `super.render()`'s template. You do not need to redeclare them.

---

## TypeScript Integration

### HTMLElementTagNameMap Augmentation

Register your element in the global type map so TypeScript resolves `document.querySelector('org-patient-card')` correctly:

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'org-patient-card': PatientCard;
  }
}
```

Place this at the bottom of your component file after the class declaration.

### Typing Inherited Properties

Inherited properties are fully typed. TypeScript narrows them through the class hierarchy:

```typescript
const card = document.querySelector('org-patient-card');
// card is PatientCard | null

if (card) {
  card.status = 'critical';     // PatientCard['status'] — 'stable' | 'monitoring' | 'critical' | 'discharged'
  card.variant = 'featured';    // HelixCard['variant'] — 'default' | 'featured' | 'compact'
  card.elevation = 'raised';    // HelixCard['elevation'] — 'flat' | 'raised' | 'floating'
}
```

### Typing Custom Events

Use a generic `CustomEvent` with your detail interface and cast in event listeners:

```typescript
card.addEventListener('org-status-change', (e) => {
  const detail = (e as CustomEvent<PatientCardStatusChangeDetail>).detail;
  console.log(detail.status, detail.previousStatus, detail.mrn);
});
```

---

## Registration

### Bundler / Module Import

```typescript
// patient-card.ts registers the element on import
import './patient-card.js';
```

### Script Tag (CDN or Drupal library)

```html
<script type="module" src="/js/components/patient-card.js"></script>
```

The `@customElement('org-patient-card')` decorator calls `customElements.define()` at module evaluation time. No manual registration step is required.

### Checking Registration

```javascript
await customElements.whenDefined('org-patient-card');
const card = document.querySelector('org-patient-card');
card.status = 'critical';
```

---

## Usage

Once registered, use the element like any other custom element:

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
  <p>Primary: Acute respiratory failure secondary to COPD exacerbation</p>

  <time slot="footer" datetime="2026-03-24T14:22:00Z">Updated 14:22</time>

  <hx-button slot="actions" variant="primary" size="sm">View Chart</hx-button>
  <hx-button slot="actions" variant="ghost" size="sm">Message Team</hx-button>
</org-patient-card>
```

Listen for custom events:

```javascript
document.querySelector('org-patient-card').addEventListener('org-status-change', (e) => {
  const { status, previousStatus, mrn } = e.detail;
  auditLog.record({ mrn, from: previousStatus, to: status, at: Date.now() });
});
```

---

## Best Practices

### Do not reuse the `hx-` prefix

The `hx-` tag prefix and `hx-` event prefix are reserved for the HELiX library itself. Use your organization prefix (`org-`, `acme-`, `nwh-`) for extended and custom elements.

### Prefer CSS custom properties over style overrides

HELiX components expose a full set of `--hx-card-*` tokens for per-card customization. Reach for these before adding rules to your extended styles array. New CSS rules add specificity conflicts and maintenance burden.

```css
/* Preferred: token override at the element level */
org-patient-card {
  --hx-card-border-color: var(--hx-color-danger-300);
}

/* Avoid when a token exists: new rule in styles array */
.card { border-color: var(--hx-color-danger-300); }
```

### Keep extended components focused

An extended component should add one domain concern — status awareness, workflow state, role-based visibility. If you find yourself adding unrelated features, split into separate components.

### Document CEM annotations

The `@element`, `@slot`, `@event`, and `@cssprop` JSDoc annotations are consumed by the Custom Elements Manifest toolchain. They must match the actual public API exactly — consumers rely on them for autocomplete and documentation generation.

### Test the super.render() contract

Verify that slot content continues to flow correctly after adding wrapper markup around `super.render()`. The slot detection state (`_hasImage`, `_hasHeading`, etc.) is inherited and functional, but DOM changes that affect slot assignment should be covered by tests:

```typescript
it('renders slotted heading inside the inherited slot structure', async () => {
  const el = await fixture<PatientCard>(html`
    <org-patient-card>
      <h2 slot="heading">Test Patient</h2>
    </org-patient-card>
  `);
  const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="heading"]');
  expect(slot!.assignedElements()[0].tagName).toBe('H2');
});
```

---

## What to Extend vs. What Not to Touch

| Safe to override | Approach with caution | Do not touch |
|---|---|---|
| `static styles` — spread pattern | `render()` — call `super.render()` | Private `_` prefixed methods |
| `@property` additions | `updated()` — always call `super.updated()` | `shadowRootOptions` — inheriting is fine, changing `delegatesFocus` has a11y implications |
| `connectedCallback()` / `disconnectedCallback()` — always call `super` | `willUpdate()` — always call `super.willUpdate()` | Internal `@state` properties from parent |

---

## Next Steps

- [PatientCard Example](/extending/patient-card) — complete runnable example source
- [Composition Patterns](/components/advanced/composition-patterns) — when wrapping is better than extending
- [Custom Events](/components/events/custom-events) — event typing and delegation patterns
- [Design Tokens](/components/styling/tokens) — available `--hx-card-*` tokens
- [CSS Parts](/components/shadow-dom/parts) — `::part()` selectors for external customization
