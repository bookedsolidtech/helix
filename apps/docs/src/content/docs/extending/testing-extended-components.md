---
title: Testing Extended Components
description: Vitest browser mode setup, HELiX test utility reuse, and testing patterns for consumer-extended components — including base-behavior preservation, new slots and events, and axe-core WCAG 2.1 AA audits.
sidebar:
  order: 6
---

# Testing Extended Components

When you extend a HELiX component, you take on a maintenance contract: the base component's behavior must remain correct after your override, and your additions must be independently verified. This guide covers the complete testing setup for consumer-extended components — Vitest browser mode, HELiX test utilities, and the specific patterns that matter when `super.render()` is in the picture.

---

## Setup

### Install Dependencies

```bash
npm install --save-dev vitest @vitest/browser playwright axe-core
npx playwright install chromium
```

### Vitest Config

Browser mode runs tests in a real Chromium context. Shadow DOM, `customElements.define`, and `attachShadow` all behave exactly as they do in production — no JSDOM simulation.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      viewport: { width: 1280, height: 720 },
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/**/*.test.ts'],
    globals: true,
    testTimeout: 30000,
  },
});
```

### TypeScript Config

```json
// tsconfig.json (test-relevant options)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

---

## Test Utilities

HELiX ships a set of test utilities in `packages/hx-library/src/test-utils.ts`. These utilities are not exported from the npm package — copy them into your own `src/test-utils.ts` and adjust as needed.

```typescript
// src/test-utils.ts — copy from @helixui/library source

const fixtureContainer = document.createElement('div');
fixtureContainer.id = 'test-fixture-container';
document.body.appendChild(fixtureContainer);

/**
 * Creates a web component fixture, appends it to the DOM,
 * and waits for Lit's updateComplete lifecycle.
 */
export async function fixture<T extends HTMLElement>(html: string): Promise<T> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const el = wrapper.firstElementChild as T;
  fixtureContainer.appendChild(el);

  if ('updateComplete' in el) {
    await (el as T & { updateComplete: Promise<boolean> }).updateComplete;
  }

  return el;
}

/** Query a single element inside a host's shadow DOM. */
export function shadowQuery<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T | null {
  return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/** Query all elements inside a host's shadow DOM. */
export function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}

/** Returns a Promise that resolves on the next occurrence of an event. */
export function oneEvent<T extends Event = Event>(
  el: EventTarget,
  eventName: string,
): Promise<T> {
  return new Promise<T>((resolve) => {
    el.addEventListener(eventName, ((e: Event) => resolve(e as T)) as EventListener, {
      once: true,
    });
  });
}

/** Clears the fixture container between tests. Call in afterEach. */
export function cleanup(): void {
  fixtureContainer.innerHTML = '';
}

/**
 * Runs an axe-core WCAG 2.1 AA audit on a component.
 * Returns violations and passes arrays.
 */
export async function checkA11y(
  el: HTMLElement,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }> {
  const axe = await import('axe-core');

  const context = el.shadowRoot ?? el;
  const results = await axe.default.run(context as unknown as Node, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'best-practice'],
    },
    rules: options?.rules,
  });

  return {
    violations: results.violations as AxeViolation[],
    passes: results.passes as AxePass[],
  };
}

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; failureSummary?: string }>;
}

export interface AxePass {
  id: string;
  description: string;
  help: string;
  nodes: Array<{ html: string }>;
}
```

---

## Testing Patterns

### 1. Verify Base Class Behavior Is Preserved

After overriding `render()` or `updated()`, confirm that inherited properties and behaviors still work correctly.

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup } from '../test-utils.js';
import './patient-card.js';
import type { PatientCard } from './patient-card.js';

afterEach(cleanup);

describe('PatientCard — inherited HelixCard behavior', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('applies inherited variant class', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card variant="featured">Content</org-patient-card>',
    );
    const card = shadowQuery(el, '.card');
    expect(card?.classList.contains('card--featured')).toBe(true);
  });

  it('applies inherited elevation class', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card elevation="raised">Content</org-patient-card>',
    );
    const card = shadowQuery(el, '.card');
    expect(card?.classList.contains('card--raised')).toBe(true);
  });

  it('exposes inherited CSS parts', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    expect(shadowQuery(el, '[part="card"]')).toBeTruthy();
    expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
    expect(shadowQuery(el, '[part="footer"]')).toBeTruthy();
  });

  it('preserves inherited hx-click event', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card hx-href="/chart">Content</org-patient-card>',
    );
    const card = shadowQuery<HTMLElement>(el, '.card')!;
    const { oneEvent } = await import('../test-utils.js');
    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    card.click();
    const event = await eventPromise;
    expect(event.detail.href).toBe('/chart');
  });
});
```

**What to check after overriding `render()`:**

- All inherited CSS parts are still present in the shadow DOM
- Inherited slots still appear and accept content
- Inherited reactive properties (`variant`, `elevation`, etc.) still produce the correct class changes
- Inherited events still fire with the correct detail

### 2. Test New Reactive Properties

Test default values, attribute reflection, and the DOM changes triggered by each new property.

```typescript
describe('PatientCard — status property', () => {
  it('defaults to "stable"', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    expect(el.status).toBe('stable');
  });

  it('accepts status from attribute', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card status="critical">Content</org-patient-card>',
    );
    expect(el.status).toBe('critical');
  });

  it('reflects status to attribute', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    el.status = 'monitoring';
    await el.updateComplete;
    expect(el.getAttribute('status')).toBe('monitoring');
  });

  it('accepts all valid status values', async () => {
    const statuses = ['stable', 'monitoring', 'critical', 'discharged'] as const;
    for (const status of statuses) {
      const el = await fixture<PatientCard>(
        `<org-patient-card status="${status}">Content</org-patient-card>`,
      );
      expect(el.status).toBe(status);
      el.remove();
    }
  });
});

describe('PatientCard — severity property', () => {
  it('renders severity banner when severity is "high"', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card severity="high">Content</org-patient-card>',
    );
    const banner = shadowQuery(el, '.patient-severity-banner');
    expect(banner).toBeTruthy();
  });

  it('omits severity banner for low and medium severity', async () => {
    for (const severity of ['low', 'medium'] as const) {
      const el = await fixture<PatientCard>(
        `<org-patient-card severity="${severity}">Content</org-patient-card>`,
      );
      expect(shadowQuery(el, '.patient-severity-banner')).toBeNull();
      el.remove();
    }
  });

  it('severity banner has role="status" for screen reader announcements', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card severity="high">Content</org-patient-card>',
    );
    const banner = shadowQuery(el, '.patient-severity-banner');
    expect(banner?.getAttribute('role')).toBe('status');
  });
});
```

### 3. Test New Slots

Verify that slotted content reaches the correct slot in the shadow DOM, and that the slot is hidden when empty.

```typescript
describe('PatientCard — inherited slots', () => {
  it('heading slot accepts content', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card><h2 slot="heading">James Martin</h2></org-patient-card>',
    );
    const headingSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="heading"]');
    expect(headingSlot?.assignedElements()[0].tagName).toBe('H2');
  });

  it('image slot accepts content', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card><img slot="image" src="test.jpg" alt="" /></org-patient-card>',
    );
    const imageSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="image"]');
    expect(imageSlot?.assignedElements()[0].tagName).toBe('IMG');
  });

  it('actions slot accepts multiple elements', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card>' +
        '<button slot="actions">View Chart</button>' +
        '<button slot="actions">Message</button>' +
        '</org-patient-card>',
    );
    const actionsSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="actions"]');
    expect(actionsSlot?.assignedElements().length).toBe(2);
  });
});
```

### 4. Test New Custom Events

Check that the event fires, bubbles and crosses shadow boundaries, carries the correct detail, and does **not** fire when there is no change.

```typescript
import { oneEvent } from '../test-utils.js';
import type { PatientCardStatusChangeDetail } from './patient-card.js';

describe('PatientCard — org-status-change event', () => {
  it('fires org-status-change when status changes', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    const eventPromise = oneEvent<CustomEvent<PatientCardStatusChangeDetail>>(
      el,
      'org-status-change',
    );
    el.status = 'critical';
    const event = await eventPromise;
    expect(event).toBeTruthy();
  });

  it('event detail contains new status, previous status, and mrn', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card mrn="MRN-001">Content</org-patient-card>',
    );
    const eventPromise = oneEvent<CustomEvent<PatientCardStatusChangeDetail>>(
      el,
      'org-status-change',
    );
    el.status = 'critical';
    const event = await eventPromise;
    expect(event.detail.status).toBe('critical');
    expect(event.detail.previousStatus).toBe('stable');
    expect(event.detail.mrn).toBe('MRN-001');
  });

  it('event bubbles and is composed', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    const eventPromise = oneEvent<CustomEvent>(document, 'org-status-change');
    el.status = 'monitoring';
    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('does not fire when status is set to the same value', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card status="stable">Content</org-patient-card>',
    );
    let fired = false;
    el.addEventListener('org-status-change', () => {
      fired = true;
    });
    el.status = 'stable'; // same value — Lit does not run updated()
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});
```

:::note
`org-status-change` fires only when `status` actually changes — Lit skips `updated()` when a property is set to its current value.
:::

### 5. Run axe-core WCAG 2.1 AA Audits

Healthcare mandate: every extended component must pass `checkA11y` across all meaningful states. A violation in an extended component is a regression — the base component was verified clean.

```typescript
import { checkA11y } from '../test-utils.js';
import { page } from '@vitest/browser/context';

describe('PatientCard — accessibility (axe-core WCAG 2.1 AA)', () => {
  it('has no violations in default state', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card>' +
        '<h2 slot="heading">James Martin</h2>' +
        '<p>Room 412</p>' +
        '</org-patient-card>',
    );
    await page.screenshot(); // force layout before axe
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no violations for all status values', async () => {
    const statuses = ['stable', 'monitoring', 'critical', 'discharged'] as const;
    for (const status of statuses) {
      const el = await fixture<PatientCard>(
        `<org-patient-card status="${status}">` +
          '<h2 slot="heading">Test Patient</h2>' +
          '<p>Content</p>' +
          `</org-patient-card>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations, `status="${status}" should have no violations`).toEqual([]);
      el.remove();
    }
  });

  it('has no violations when severity banner is visible', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card severity="high">' +
        '<h2 slot="heading">Test Patient</h2>' +
        '<p>Content</p>' +
        '</org-patient-card>',
    );
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no violations when interactive (hx-href + hx-aria-label)', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card hx-href="/chart/001" hx-aria-label="View chart for James Martin">' +
        '<h2 slot="heading">James Martin</h2>' +
        '<p>Room 412</p>' +
        '</org-patient-card>',
    );
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });
});
```

**Why `await page.screenshot()` before axe?** It forces the browser to complete layout and paint before axe inspects the DOM. Without it, axe occasionally evaluates partially rendered states and produces false positives.

### 6. Snapshot the Shadow DOM Structure

Snapshot tests catch unintentional structural regressions — a missing CSS part, a renamed class, a slot disappearing from the rendered tree.

```typescript
describe('PatientCard — shadow DOM structure', () => {
  it('renders status badge in shadow DOM', async () => {
    const el = await fixture<PatientCard>(
      '<org-patient-card status="critical">Content</org-patient-card>',
    );
    const badge = shadowQuery(el, '.patient-status-badge');
    expect(badge).toBeTruthy();
    expect(badge?.getAttribute('aria-label')).toBe('Status: critical');
    expect(badge?.textContent?.trim()).toBe('critical');
  });

  it('shadow DOM contains expected inherited structure', async () => {
    const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
    // Verify key structural elements from HelixCard are present
    expect(shadowQuery(el, '[part="card"]')).toBeTruthy();
    expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
    expect(shadowQuery(el, 'slot')).toBeTruthy(); // default slot
  });
});
```

:::tip
Use `shadowQuery` for structural assertions rather than `shadowRoot.innerHTML` snapshots. String snapshots are brittle to whitespace changes and Lit's internal template updates across minor versions.
:::

---

## Complete PatientCard Test File

The test below covers the full `PatientCard` component from the [PatientCard Example](/extending/patient-card) page. Copy it to `src/components/patient-card/patient-card.test.ts` alongside your component.

```typescript
/**
 * patient-card.test.ts
 *
 * Vitest browser mode tests for PatientCard — an org-patient-card component
 * that extends HelixCard.
 *
 * Covers:
 *  - Inherited HelixCard behavior preserved after render() override
 *  - New reactive properties: status, severity, mrn
 *  - Shadow DOM additions: status badge, severity banner
 *  - Inherited slot forwarding: heading, image, footer, actions
 *  - Custom event: org-status-change (detail, bubbles, composed)
 *  - axe-core WCAG 2.1 AA audits across all states
 */

import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../test-utils.js';
import './patient-card.js';
import type { PatientCard, PatientCardStatusChangeDetail } from './patient-card.js';

afterEach(cleanup);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('PatientCard', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the inherited card structure', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(shadowQuery(el, '[part="card"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
    });

    it('renders the status badge', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(shadowQuery(el, '.patient-status-badge')).toBeTruthy();
    });

    it('does not render severity banner by default', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(shadowQuery(el, '.patient-severity-banner')).toBeNull();
    });
  });

  // ─── Inherited properties ──────────────────────────────────────────────────

  describe('Inherited property: variant', () => {
    it('defaults to "default" variant', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(el.variant).toBe('default');
    });

    it('applies featured class from inherited variant', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card variant="featured">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.card--featured')).toBeTruthy();
    });

    it('applies compact class from inherited variant', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card variant="compact">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.card--compact')).toBeTruthy();
    });
  });

  describe('Inherited property: elevation', () => {
    it('applies raised shadow class', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card elevation="raised">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.card--raised')).toBeTruthy();
    });

    it('applies floating shadow class', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card elevation="floating">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.card--floating')).toBeTruthy();
    });
  });

  // ─── New property: status ──────────────────────────────────────────────────

  describe('Property: status', () => {
    it('defaults to "stable"', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(el.status).toBe('stable');
    });

    it('reads status from attribute', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card status="critical">Content</org-patient-card>',
      );
      expect(el.status).toBe('critical');
    });

    it('reflects status to attribute', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      el.status = 'monitoring';
      await el.updateComplete;
      expect(el.getAttribute('status')).toBe('monitoring');
    });

    it('status badge text matches status value', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card status="critical">Content</org-patient-card>',
      );
      const badge = shadowQuery(el, '.patient-status-badge');
      expect(badge?.textContent?.trim()).toBe('critical');
    });

    it('status badge aria-label includes status value', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card status="monitoring">Content</org-patient-card>',
      );
      const badge = shadowQuery(el, '.patient-status-badge');
      expect(badge?.getAttribute('aria-label')).toBe('Status: monitoring');
    });

    it('accepts all valid status values', async () => {
      const statuses = ['stable', 'monitoring', 'critical', 'discharged'] as const;
      for (const status of statuses) {
        const el = await fixture<PatientCard>(
          `<org-patient-card status="${status}">Content</org-patient-card>`,
        );
        expect(el.status).toBe(status);
        el.remove();
      }
    });
  });

  // ─── New property: severity ────────────────────────────────────────────────

  describe('Property: severity', () => {
    it('defaults to "low"', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(el.severity).toBe('low');
    });

    it('renders severity banner when severity is "high"', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="high">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.patient-severity-banner')).toBeTruthy();
    });

    it('omits severity banner for "low"', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="low">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.patient-severity-banner')).toBeNull();
    });

    it('omits severity banner for "medium"', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="medium">Content</org-patient-card>',
      );
      expect(shadowQuery(el, '.patient-severity-banner')).toBeNull();
    });

    it('severity banner has role="status"', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="high">Content</org-patient-card>',
      );
      const banner = shadowQuery(el, '.patient-severity-banner');
      expect(banner?.getAttribute('role')).toBe('status');
    });

    it('severity banner has aria-live="polite"', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="high">Content</org-patient-card>',
      );
      const banner = shadowQuery(el, '.patient-severity-banner');
      expect(banner?.getAttribute('aria-live')).toBe('polite');
    });
  });

  // ─── New property: mrn ─────────────────────────────────────────────────────

  describe('Property: mrn', () => {
    it('defaults to undefined', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      expect(el.mrn).toBeUndefined();
    });

    it('reads mrn from attribute', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card mrn="MRN-00123456">Content</org-patient-card>',
      );
      expect(el.mrn).toBe('MRN-00123456');
    });
  });

  // ─── Slots: inherited ──────────────────────────────────────────────────────

  describe('Inherited slots', () => {
    it('heading slot forwards content', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card><h2 slot="heading">James Martin</h2></org-patient-card>',
      );
      const headingSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="heading"]');
      expect(headingSlot?.assignedElements()[0].tagName).toBe('H2');
    });

    it('image slot forwards content', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card><img slot="image" src="test.jpg" alt="" /></org-patient-card>',
      );
      const imageSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="image"]');
      expect(imageSlot?.assignedElements()[0].tagName).toBe('IMG');
    });

    it('footer slot forwards content', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card><time slot="footer">14:22</time></org-patient-card>',
      );
      const footerSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="footer"]');
      expect(footerSlot?.assignedElements()[0].tagName).toBe('TIME');
    });

    it('actions slot forwards multiple elements', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card>' +
          '<button slot="actions">View Chart</button>' +
          '<button slot="actions">Message</button>' +
          '</org-patient-card>',
      );
      const actionsSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="actions"]');
      expect(actionsSlot?.assignedElements().length).toBe(2);
    });

    it('default slot forwards body content', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card><p id="body-text">Room 412</p></org-patient-card>',
      );
      expect(el.querySelector('#body-text')).toBeTruthy();
    });
  });

  // ─── CSS Parts ─────────────────────────────────────────────────────────────

  describe('CSS Parts', () => {
    it('exposes inherited parts from HelixCard', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      const expectedParts = ['card', 'image', 'heading', 'body', 'footer', 'actions'];
      for (const part of expectedParts) {
        expect(
          shadowQuery(el, `[part="${part}"]`),
          `part="${part}" should be present`,
        ).toBeTruthy();
      }
    });
  });

  // ─── Inherited event: hx-click ─────────────────────────────────────────────

  describe('Inherited event: hx-click', () => {
    it('fires hx-click when interactive card is clicked', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card hx-href="/chart/001">Content</org-patient-card>',
      );
      const card = shadowQuery<HTMLElement>(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      card.click();
      const event = await eventPromise;
      expect(event.detail.href).toBe('/chart/001');
    });
  });

  // ─── Custom event: org-status-change ──────────────────────────────────────

  describe('Custom event: org-status-change', () => {
    it('fires when status changes', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      const eventPromise = oneEvent<CustomEvent<PatientCardStatusChangeDetail>>(
        el,
        'org-status-change',
      );
      el.status = 'critical';
      const event = await eventPromise;
      expect(event.type).toBe('org-status-change');
    });

    it('detail contains status, previousStatus, and mrn', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card mrn="MRN-001">Content</org-patient-card>',
      );
      const eventPromise = oneEvent<CustomEvent<PatientCardStatusChangeDetail>>(
        el,
        'org-status-change',
      );
      el.status = 'critical';
      const event = await eventPromise;
      expect(event.detail.status).toBe('critical');
      expect(event.detail.previousStatus).toBe('stable');
      expect(event.detail.mrn).toBe('MRN-001');
    });

    it('event bubbles and is composed', async () => {
      const el = await fixture<PatientCard>('<org-patient-card>Content</org-patient-card>');
      const eventPromise = oneEvent<CustomEvent>(document, 'org-status-change');
      el.status = 'monitoring';
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('previousStatus is undefined on first render (initial mount fires with undefined previous)', async () => {
      // The first org-status-change fires from updated() on initial render.
      // changedProperties.get('status') returns undefined because there was no prior value.
      const eventPromise = oneEvent<CustomEvent<PatientCardStatusChangeDetail>>(
        document,
        'org-status-change',
      );
      await fixture<PatientCard>(
        '<org-patient-card status="critical">Content</org-patient-card>',
      );
      const event = await eventPromise;
      expect(event.detail.previousStatus).toBeUndefined();
      expect(event.detail.status).toBe('critical');
    });

    it('does not fire when status is set to its current value', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card status="stable">Content</org-patient-card>',
      );
      // Drain any initial event
      await el.updateComplete;

      let fired = false;
      el.addEventListener('org-status-change', () => {
        fired = true;
      });
      el.status = 'stable'; // same value — Lit skips updated()
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────

  describe('Accessibility (axe-core WCAG 2.1 AA)', () => {
    it('has no violations in default state', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card>' +
          '<h2 slot="heading">James Martin</h2>' +
          '<p>DOB: 1958-03-11 &bull; Room 412</p>' +
          '</org-patient-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no violations for all status values', async () => {
      const statuses = ['stable', 'monitoring', 'critical', 'discharged'] as const;
      for (const status of statuses) {
        const el = await fixture<PatientCard>(
          `<org-patient-card status="${status}">` +
            '<h2 slot="heading">James Martin</h2>' +
            '<p>Room 412</p>' +
            `</org-patient-card>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `status="${status}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no violations when high severity banner is visible', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card severity="high">' +
          '<h2 slot="heading">James Martin</h2>' +
          '<p>Room 412</p>' +
          '</org-patient-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no violations when interactive with hx-aria-label', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card hx-href="/patients/MRN-001" hx-aria-label="View chart for James Martin">' +
          '<h2 slot="heading">James Martin</h2>' +
          '<p>Room 412</p>' +
          '</org-patient-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no violations with featured variant, raised elevation, and actions slot', async () => {
      const el = await fixture<PatientCard>(
        '<org-patient-card variant="featured" elevation="raised" status="critical" severity="high">' +
          '<h2 slot="heading">James Martin</h2>' +
          '<p>Room 412 &bull; Attending: Dr. Okafor</p>' +
          '<button slot="actions">View Chart</button>' +
          '</org-patient-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
```

---

## Running the Tests

```bash
# Run once
npx vitest run

# Watch mode during development
npx vitest

# Filter to patient-card tests only
npx vitest run patient-card
```

Expected output for the complete suite:

```
 ✓ PatientCard > Rendering (4)
 ✓ PatientCard > Inherited property: variant (3)
 ✓ PatientCard > Inherited property: elevation (2)
 ✓ PatientCard > Property: status (6)
 ✓ PatientCard > Property: severity (6)
 ✓ PatientCard > Property: mrn (2)
 ✓ PatientCard > Inherited slots (5)
 ✓ PatientCard > CSS Parts (1)
 ✓ PatientCard > Inherited event: hx-click (1)
 ✓ PatientCard > Custom event: org-status-change (5)
 ✓ PatientCard > Accessibility (axe-core WCAG 2.1 AA) (5)
```

---

## Coverage Strategy

| Area | Minimum coverage | Rationale |
|---|---|---|
| New reactive properties | 100% of all declared values | Attribute reflection and CSS selector states must be verified |
| Inherited properties | Spot-check at least one value per property | Confirm override does not break parent behavior |
| New events | All fields in the event detail | Consumers bind to detail fields directly |
| Inherited events | Verify they still fire | `render()` override must not remove the trigger element |
| Slots | All named slots, default slot | Slot forwarding through `super.render()` is non-obvious |
| axe-core | All meaningful UI states | Healthcare mandate — any state a user encounters must be accessible |
| Severity banner | Visible and hidden states | Dynamic content requires explicit aria-live coverage |

---

## Next Steps

- [PatientCard Example](/extending/patient-card) — complete component source
- [Extending HELiX Components](/extending/) — inheritance patterns and `super.render()` contract
- [Accessibility Workflow](/guides/accessibility) — full WCAG 2.1 AA checklist for web components
- [Compose Higher-Order Components](/extending/compose-higher-order-components) — testing composition-based approaches
