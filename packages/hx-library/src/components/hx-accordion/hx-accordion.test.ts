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

  // ─── Single mode initial enforcement (1) ───

  describe('Single mode initial enforcement', () => {
    it('enforces only first expanded item when multiple are expanded in single mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(false);
    });
  });

  // ─── Arrow key navigation (4) ───

  describe('Arrow key navigation', () => {
    it('ArrowDown moves focus to next item trigger', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 3</span>
            <p>Content 3</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const summary1 = shadowQuery<HTMLElement>(items[0], 'summary')!;
      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;

      summary1.focus();
      await userEvent.keyboard('{ArrowDown}');

      expect(items[1].shadowRoot?.activeElement).toBe(summary2);
    });

    it('ArrowUp moves focus to previous item trigger', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
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
      const summary1 = shadowQuery<HTMLElement>(items[0], 'summary')!;
      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;

      summary2.focus();
      await userEvent.keyboard('{ArrowUp}');

      expect(items[0].shadowRoot?.activeElement).toBe(summary1);
    });

    it('Home moves focus to first item trigger', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 3</span>
            <p>Content 3</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const summary1 = shadowQuery<HTMLElement>(items[0], 'summary')!;
      const summary3 = shadowQuery<HTMLElement>(items[2], 'summary')!;

      summary3.focus();
      await userEvent.keyboard('{Home}');

      expect(items[0].shadowRoot?.activeElement).toBe(summary1);
    });

    it('End moves focus to last item trigger', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content 2</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 3</span>
            <p>Content 3</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const summary1 = shadowQuery<HTMLElement>(items[0], 'summary')!;
      const summary3 = shadowQuery<HTMLElement>(items[2], 'summary')!;

      summary1.focus();
      await userEvent.keyboard('{End}');

      expect(items[2].shadowRoot?.activeElement).toBe(summary3);
    });
  });

  // ─── Edge cases (2) ───

  describe('Edge cases', () => {
    it('renders empty accordion without errors', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      await el.updateComplete;
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot')!;
      expect(slot.assignedElements().length).toBe(0);
    });

    it('handles single item accordion', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Only Item</span>
            <p>Content</p>
          </hx-accordion-item>
        </hx-accordion>
      `);

      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      const summary = shadowQuery<HTMLElement>(item, 'summary')!;
      summary.click();
      await item.updateComplete;
      expect(item.expanded).toBe(true);
    });
  });

  // ─── Sibling collapse events (1) ───

  describe('Sibling collapse events', () => {
    it('dispatches hx-collapse for siblings collapsed in single mode', async () => {
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

      let collapseCount = 0;
      items[0].addEventListener('hx-collapse', () => {
        collapseCount++;
      });

      // Expand second item — first should collapse AND dispatch hx-collapse
      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      summary2.click();
      await items[1].updateComplete;
      await items[0].updateComplete;

      expect(items[0].expanded).toBe(false);
      expect(collapseCount).toBe(1);
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

  // ─── Keyboard navigation (4) ───

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

    it('disabled items are removed from tab order', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(summary.getAttribute('tabindex')).toBe('-1');
    });

    it('enabled items have tabindex 0', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(summary.getAttribute('tabindex')).toBe('0');
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

    it('content does NOT have aria-hidden when expanded', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const content = shadowQuery(el, '[role="region"]')!;
      expect(content.hasAttribute('aria-hidden')).toBe(false);
    });

    it('summary has aria-controls pointing to content panel', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      const controlsId = summary.getAttribute('aria-controls');
      expect(controlsId).toBe('content');

      const panel = shadowQuery(el, `#${controlsId}`);
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute('role')).toBe('region');
    });
  });
});
