import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';
import type { HelixAccordion } from './hx-accordion.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';
import './index.js';

afterEach(cleanup);

describe('hx-accordion', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "accordion" CSS part', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      const container = shadowQuery(el, '[part~="accordion"]');
      expect(container).toBeTruthy();
    });

    it('defaults to mode="single"', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(el.mode).toBe('single');
    });
  });

  // ─── Mode: multi (2) ───

  describe('Mode: multi', () => {
    it('allows multiple items expanded simultaneously', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item expanded>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      await items[0].updateComplete;
      await items[1].updateComplete;

      // Expand second item
      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      summary2.click();
      await items[1].updateComplete;

      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(true);
    });

    it('reflects mode attribute', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion mode="multi"></hx-accordion>');
      expect(el.getAttribute('mode')).toBe('multi');
    });
  });
});

describe('hx-accordion-item', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "item" CSS part on details', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery(el, '[part~="item"]');
      expect(details).toBeTruthy();
    });

    it('exposes "trigger" CSS part on summary', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const trigger = shadowQuery(el, '[part~="trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('exposes "content" CSS part on region', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const content = shadowQuery(el, '[part~="content"]');
      expect(content).toBeTruthy();
    });
  });

  // ─── Expand / Collapse (4) ───

  describe('Expand / Collapse', () => {
    it('defaults to collapsed', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      expect(el.expanded).toBe(false);
    });

    it('expands when expanded attribute is set', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      expect(el.expanded).toBe(true);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.open).toBe(true);
    });

    it('toggles on summary click', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      await el.updateComplete;
      expect(el.expanded).toBe(true);

      summary.click();
      await el.updateComplete;
      expect(el.expanded).toBe(false);
    });

    it('sets aria-expanded on summary', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(summary.getAttribute('aria-expanded')).toBe('false');

      summary.click();
      await el.updateComplete;
      expect(summary.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Single expand mode (1) ───

  describe('Single expand mode', () => {
    it('collapses other items when one expands in single mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      await items[0].updateComplete;
      await items[1].updateComplete;

      // Expand second item — first should collapse
      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      summary2.click();
      await items[1].updateComplete;
      await items[0].updateComplete;

      expect(items[0].expanded).toBe(false);
      expect(items[1].expanded).toBe(true);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-expand when expanded', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-expand');
      summary.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-collapse when collapsed', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-collapse');
      summary.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('event detail contains serializable data (no class references)', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item id="test-item">
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-expand');
      summary.click();
      const event = await eventPromise;

      expect(event.detail.expanded).toBe(true);
      expect(event.detail.itemId).toBe('test-item');
      // Verify it's serializable (no class references)
      const serialized = JSON.stringify(event.detail);
      expect(serialized).toBeTruthy();
    });

    it('does NOT dispatch events when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      let fired = false;
      el.addEventListener('hx-expand', () => {
        fired = true;
      });

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Disabled state (3) ───

  describe('Disabled state', () => {
    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does NOT put disabled attribute on native details element', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.hasAttribute('disabled')).toBe(false);
    });

    it('sets aria-disabled on summary when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(summary.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ─── Keyboard navigation (2) ───

  describe('Keyboard navigation', () => {
    it('Enter key toggles accordion item', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-expand');
      summary.focus();
      await userEvent.keyboard('{Enter}');
      await eventPromise;
      expect(el.expanded).toBe(true);
    });

    it('Space key toggles accordion item', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-expand');
      summary.focus();
      await userEvent.keyboard(' ');
      await eventPromise;
      expect(el.expanded).toBe(true);
    });
  });

  // ─── ARIA (3) ───

  describe('ARIA', () => {
    it('content region has role="region"', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const content = shadowQuery(el, '[role="region"]');
      expect(content).toBeTruthy();
    });

    it('content region has aria-labelledby pointing to trigger', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const content = shadowQuery(el, '[role="region"]')!;
      const triggerId = content.getAttribute('aria-labelledby');
      expect(triggerId).toBe('trigger');

      // Verify the referenced element exists
      const trigger = shadowQuery(el, `#${triggerId}`);
      expect(trigger).toBeTruthy();
    });

    it('content has aria-hidden="true" when collapsed', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const content = shadowQuery(el, '[role="region"]')!;
      expect(content.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
