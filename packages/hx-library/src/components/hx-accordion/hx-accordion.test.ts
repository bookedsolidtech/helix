import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[1].shadowRoot?.activeElement).toBe(trigger2);
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger2.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[0].shadowRoot?.activeElement).toBe(trigger1);
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger3 = shadowQuery<HTMLElement>(items[2], '[part="trigger"]')!;

      trigger3.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[0].shadowRoot?.activeElement).toBe(trigger1);
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger3 = shadowQuery<HTMLElement>(items[2], '[part="trigger"]')!;

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[2].shadowRoot?.activeElement).toBe(trigger3);
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

  // ─── Accessibility (axe-core) ───

  // axe-core rule exclusion for accordion heading pattern:
  // - aria-allowed-role: axe flags role="heading" on <summary> because the
  //   HTML spec does not explicitly list it as an allowed role. However, the
  //   WAI-ARIA APG Accordion pattern requires heading semantics on the trigger
  //   so that accordion items appear in the screen reader heading list. Using
  //   role="heading" aria-level on <summary> is the correct approach because
  //   wrapping <summary> in an <h3> breaks native <details> disclosure.
  const a11yRules = { 'aria-allowed-role': { enabled: false } };

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state (empty accordion)', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });

    it('has no axe violations with items (all collapsed)', async () => {
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
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });

    it('has no axe violations with an item expanded', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
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
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
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

      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
      );
      await el.updateComplete;
      expect(el.expanded).toBe(true);
    });

    it('Space key toggles accordion item', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);

      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }),
      );
      await el.updateComplete;
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
      expect(triggerId).toMatch(/^hx-accordion-item-\d+-trigger$/);

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
      expect(controlsId).toMatch(/^hx-accordion-item-\d+-content$/);

      const panel = shadowQuery(el, `#${controlsId}`);
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute('role')).toBe('region');
    });
  });

  // ─── Dynamic Item Add / Remove ───

  describe('Dynamic Item Add / Remove', () => {
    it('newly appended accordion-item can be expanded', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;

      const newItem = document.createElement('hx-accordion-item') as HelixAccordionItem;
      const trigger = document.createElement('span');
      trigger.slot = 'trigger';
      trigger.textContent = 'Item 2';
      newItem.appendChild(trigger);
      const content = document.createElement('p');
      content.textContent = 'Content 2';
      newItem.appendChild(content);
      el.appendChild(newItem);

      await el.updateComplete;
      await newItem.updateComplete;

      const summary = shadowQuery<HTMLElement>(newItem, 'summary')!;
      summary.click();
      await newItem.updateComplete;
      expect(newItem.expanded).toBe(true);
    });

    it('in single mode, expanding a new item collapses the previously expanded item', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;

      const newItem = document.createElement('hx-accordion-item') as HelixAccordionItem;
      const trigger = document.createElement('span');
      trigger.slot = 'trigger';
      trigger.textContent = 'Item 2';
      newItem.appendChild(trigger);
      el.appendChild(newItem);

      await el.updateComplete;
      await newItem.updateComplete;

      const existingItem = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      const summary = shadowQuery<HTMLElement>(newItem, 'summary')!;
      summary.click();
      await newItem.updateComplete;
      await existingItem.updateComplete;

      expect(newItem.expanded).toBe(true);
      expect(existingItem.expanded).toBe(false);
    });

    it('removing all items leaves an empty accordion without errors', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;

      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      el.removeChild(item);
      await el.updateComplete;

      const slot = shadowQuery<HTMLSlotElement>(el, 'slot')!;
      expect(slot.assignedElements().length).toBe(0);
    });
  });

  // ─── Accessibility (axe-core) ───

  // See accordion-level comment for aria-allowed-role exclusion rationale.
  const itemA11yRules = { 'aria-allowed-role': { enabled: false } };

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default collapsed state', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: itemA11yRules });
      expect(violations).toEqual([]);
    });

    it('has no axe violations in expanded state', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: itemA11yRules });
      expect(violations).toEqual([]);
    });

    it('has no axe violations in disabled state', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el, { rules: itemA11yRules });
      expect(violations).toEqual([]);
    });
  });

  // ─── Property: level ───

  describe('Property: level', () => {
    it('defaults to level 3', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      expect(el.level).toBe(3);
    });

    it('applies aria-level from the level property', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item level="2">
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(summary.getAttribute('aria-level')).toBe('2');
    });

    it('clamps level above 6 to 6', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      el.level = 9 as 6;
      await el.updateComplete;
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(Number(summary.getAttribute('aria-level'))).toBeLessThanOrEqual(6);
    });

    it('clamps level below 1 to 1', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      el.level = 0 as 1;
      await el.updateComplete;
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      expect(Number(summary.getAttribute('aria-level'))).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Slots: trigger and default content ───

  describe('Slots: trigger and default content', () => {
    it('trigger slot projects label content', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">My Heading</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const slotted = el.querySelector('[slot="trigger"]');
      expect(slotted?.textContent).toBe('My Heading');
    });

    it('default slot projects body content', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p id="body-content">Body paragraph</p>
        </hx-accordion-item>
      `);
      const bodyContent = el.querySelector('#body-content');
      expect(bodyContent?.textContent).toBe('Body paragraph');
    });
  });

  // ─── CSS class: item--expanded and item--disabled ───

  describe('CSS classes on item', () => {
    it('item--expanded class applied when expanded', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery(el, '.item');
      expect(details?.classList.contains('item--expanded')).toBe(true);
    });

    it('item--disabled class applied when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery(el, '.item');
      expect(details?.classList.contains('item--disabled')).toBe(true);
    });

    it('item--expanded class removed after collapse', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      await el.updateComplete;
      const details = shadowQuery(el, '.item');
      expect(details?.classList.contains('item--expanded')).toBe(false);
    });
  });

  // ─── details[open] reflects expanded ───

  describe('details[open] reflects expanded', () => {
    it('details element has open attribute when expanded', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.open).toBe(true);
    });

    it('details element does not have open attribute when collapsed', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.open).toBe(false);
    });
  });

  // ─── icon CSS part ───

  describe('CSS Part: icon', () => {
    it('exposes "icon" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Title</span>
          <p>Content</p>
        </hx-accordion-item>
      `);
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
    });
  });

  // ─── _dispatchToggleEvent: called with expanded=false detail ───

  describe('Event detail: expanded property', () => {
    it('hx-expand event detail.expanded is true', async () => {
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
      expect(event.detail.expanded).toBe(true);
    });

    it('hx-collapse event detail.expanded is false', async () => {
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
      expect(event.detail.expanded).toBe(false);
    });
  });
});

// ─── hx-accordion: additional coverage ───

describe('hx-accordion — additional coverage', () => {
  // ─── Mode: single collapses via programmatic set ───

  describe('Mode: single — programmatic expand', () => {
    it('programmatically setting expanded on second item collapses first via hx-expand listener', async () => {
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
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      await items[0].updateComplete;
      await items[1].updateComplete;

      const summary2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      summary2.click();
      await items[1].updateComplete;
      await items[0].updateComplete;

      expect(items[1].expanded).toBe(true);
      expect(items[0].expanded).toBe(false);
    });
  });

  // ─── Mode switch: multi→single enforces single ───

  describe('Mode switch: multi to single', () => {
    it('switching mode from multi to single collapses extras', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
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
      await items[0].updateComplete;
      await items[1].updateComplete;

      // Both should be expanded in multi mode
      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(true);

      // Switch to single mode — should enforce single expand
      el.mode = 'single';
      await el.updateComplete;

      // Only one should remain expanded
      const expandedCount = Array.from(items).filter((i) => i.expanded).length;
      expect(expandedCount).toBeLessThanOrEqual(1);
    });
  });

  // ─── Invalid mode falls back to single ───

  describe('Invalid mode: falls back to single', () => {
    it('invalid mode value is clamped to "single"', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion mode="bogus"></hx-accordion>');
      await el.updateComplete;
      // After updated() runs, invalid mode is reset to 'single'
      expect(el.mode).toBe('single');
    });
  });

  // ─── Arrow navigation: wraps around ───

  describe('Arrow navigation: wrap-around', () => {
    it('ArrowDown from last item wraps to first', async () => {
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger2.focus();
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(items[0].shadowRoot?.activeElement).toBe(trigger1);
    });

    it('ArrowUp from first item wraps to last', async () => {
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
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger1.focus();
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(items[1].shadowRoot?.activeElement).toBe(trigger2);
    });
  });

  // ─── Arrow navigation: ignores unrelated keys ───

  describe('Arrow navigation: unrelated keys are ignored', () => {
    it('pressing a non-navigation key does not throw', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;

      trigger1.focus();
      // Tab is not handled by accordion keyboard nav — should not throw
      expect(() => {
        el.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }),
        );
      }).not.toThrow();
    });
  });

  // ─── Arrow navigation: no items focused ───

  describe('Arrow navigation: no current item focused', () => {
    it('ArrowDown when no trigger is focused is a no-op', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      // No focus set — dispatch ArrowDown should not throw
      expect(() => {
        el.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
        );
      }).not.toThrow();
    });
  });

  // ─── Slot validation: non-accordion-item children warn ───

  describe('Slot validation: non-accordion-item children', () => {
    it('accepts accordion-item children without error', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll('hx-accordion-item');
      expect(items.length).toBe(1);
    });
  });

  // ─── Accessibility (axe-core): multi mode ───

  const a11yRules = { 'aria-allowed-role': { enabled: false } };

  describe('Accessibility (axe-core): multi mode', () => {
    it('has no axe violations in multi mode with multiple items expanded', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
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
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });
  });

  // ─── allowMultiple / multi mode expansion ───

  describe('allowMultiple — multi mode simultaneous expansion', () => {
    it('multi mode allows two items to be expanded at the same time', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(true);
    });

    it('multi mode does not collapse sibling on expand', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const trigger2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      trigger2.click();
      await items[1].updateComplete;
      await items[0].updateComplete;
      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(true);
    });

    it('switching from multi to single mode enforces single-expand', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      expect(items[0].expanded).toBe(true);
      expect(items[1].expanded).toBe(true);

      el.mode = 'single';
      await el.updateComplete;

      // Only one item should remain expanded after enforcing single mode
      const expandedCount = Array.from(items).filter((i) => i.expanded).length;
      expect(expandedCount).toBeLessThanOrEqual(1);
    });
  });

  // ─── Dynamic item mutation ───

  describe('Dynamic item add/remove via slot mutation', () => {
    it('single mode enforces exclusivity after a new expanded item is appended', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;

      const newItem = document.createElement('hx-accordion-item') as HelixAccordionItem;
      newItem.expanded = true;
      const span = document.createElement('span');
      span.slot = 'trigger';
      span.textContent = 'B';
      newItem.appendChild(span);
      el.appendChild(newItem);

      // Wait for MutationObserver to fire and re-enforce single mode
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const expandedCount = Array.from(items).filter((i) => i.expanded).length;
      expect(expandedCount).toBeLessThanOrEqual(1);
    });

    it('accordion still operates after an item is removed', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item id="item-a">
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item id="item-b">
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const itemA = el.querySelector<HelixAccordionItem>('#item-a')!;
      itemA.remove();
      await el.updateComplete;

      const itemB = el.querySelector<HelixAccordionItem>('#item-b')!;
      const trigger = shadowQuery<HTMLElement>(itemB, 'summary')!;
      trigger.click();
      await itemB.updateComplete;
      expect(itemB.expanded).toBe(true);
    });
  });

  // ─── exclusive / single-mode collapse ───

  describe('single mode exclusive expand (hx-expand triggers sibling collapse)', () => {
    it('expanding item 2 collapses item 1 in single mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">Item 1</span><p>Content 1</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span><p>Content 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      expect(items[0].expanded).toBe(true);

      const trigger2 = shadowQuery<HTMLElement>(items[1], 'summary')!;
      trigger2.click();
      await items[1].updateComplete;
      await items[0].updateComplete;

      expect(items[1].expanded).toBe(true);
      expect(items[0].expanded).toBe(false);
    });

    it('hx-expand event from child is received by accordion in single mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item>
            <span slot="trigger">Item 1</span><p>Content 1</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;

      let received = false;
      el.addEventListener('hx-expand', () => { received = true; });
      item._dispatchToggleEvent(true);
      expect(received).toBe(true);
    });
  });

  // ─── hx-expand / hx-collapse events from accordion-item ───

  describe('hx-expand and hx-collapse events from accordion-item', () => {
    it('hx-expand dispatched with expanded=true and itemId when item expands', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item id="test-item">
          <span slot="trigger">Test</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ expanded: boolean; itemId: string }>>(el, 'hx-expand');
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      const event = await eventPromise;

      expect(event.detail.expanded).toBe(true);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-collapse dispatched with expanded=false when item collapses', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Test</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ expanded: boolean; itemId: string }>>(el, 'hx-collapse');
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      const event = await eventPromise;

      expect(event.detail.expanded).toBe(false);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-expand detail includes itemId when item has an id attribute', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item id="my-item">
          <span slot="trigger">Test</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ expanded: boolean; itemId: string }>>(el, 'hx-expand');
      el._dispatchToggleEvent(true);
      const event = await eventPromise;

      expect(event.detail.itemId).toBe('my-item');
    });
  });

  // ─── defaultExpanded initialization ───

  describe('defaultExpanded initialization', () => {
    it('item with expanded attribute is open on initial render', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Default open</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      expect(el.expanded).toBe(true);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.open).toBe(true);
    });

    it('item without expanded attribute is closed on initial render', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Default closed</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      expect(el.expanded).toBe(false);
      const details = shadowQuery<HTMLDetailsElement>(el, 'details')!;
      expect(details.open).toBe(false);
    });

    it('single mode with multiple expanded items: only first is kept open', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">C</span><p>Content C</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const expandedCount = Array.from(items).filter((i) => i.expanded).length;
      expect(expandedCount).toBe(1);
      // Only the first one should remain expanded
      expect(items[0].expanded).toBe(true);
    });
  });

  // ─── Accordion-item: level attribute ───

  describe('accordion-item level attribute', () => {
    it('trigger has aria-level="3" by default', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-level')).toBe('3');
    });

    it('trigger respects level="2" attribute', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item level="2">
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-level')).toBe('2');
    });

    it('trigger has role="heading"', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('role')).toBe('heading');
    });
  });

  // ─── Accordion-item: disabled ───

  describe('accordion-item disabled state', () => {
    it('disabled item cannot be toggled via click', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const summary = shadowQuery<HTMLElement>(el, 'summary')!;
      summary.click();
      await el.updateComplete;
      expect(el.expanded).toBe(false);
    });

    it('disabled item cannot be toggled via Enter key', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.expanded).toBe(false);
    });

    it('disabled item has tabindex="-1" on trigger', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('tabindex')).toBe('-1');
    });

    it('disabled item has aria-disabled="true" on trigger', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item disabled>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
    });

    it('keyboard navigation skips disabled items', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item disabled>
            <span slot="trigger">B (disabled)</span><p>Content B</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">C</span><p>Content C</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger3 = shadowQuery<HTMLElement>(items[2], '[part="trigger"]')!;

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      // Disabled item 2 should be skipped
      expect(items[2].shadowRoot?.activeElement).toBe(trigger3);
    });
  });

  // ─── Accordion-item: Space key ───

  describe('accordion-item Space key toggle', () => {
    it('Space key expands a closed item', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.expanded).toBe(true);
    });

    it('Space key collapses an expanded item', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.expanded).toBe(false);
    });
  });

  // ─── Accordion-item: content region ARIA ───

  describe('accordion-item content region ARIA', () => {
    it('content region has role="region"', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const content = shadowQuery(el, '[part="content"]')!;
      expect(content.getAttribute('role')).toBe('region');
    });

    it('content region has aria-labelledby referencing the trigger', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      const content = shadowQuery<HTMLElement>(el, '[part="content"]')!;
      expect(content.getAttribute('aria-labelledby')).toBe(trigger.id);
    });

    it('content region has aria-hidden="true" when collapsed', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const content = shadowQuery(el, '[part="content"]')!;
      expect(content.getAttribute('aria-hidden')).toBe('true');
    });

    it('content region has no aria-hidden when expanded', async () => {
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item expanded>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      await el.updateComplete;
      const content = shadowQuery(el, '[part="content"]')!;
      expect(content.getAttribute('aria-hidden')).toBeNull();
    });
  });

  // ─── Invalid mode warning ───

  describe('invalid mode warning', () => {
    it('warns and clamps to "single" when an invalid mode is set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      (el as HelixAccordion & { mode: string }).mode = 'invalid-mode' as 'single' | 'multi';
      await el.updateComplete;
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid mode'));
      expect(el.mode).toBe('single');
      warnSpy.mockRestore();
    });
  });

  // ─── Accordion-item: warns when used outside accordion ───

  describe('accordion-item outside hx-accordion', () => {
    it('warns when hx-accordion-item is used outside hx-accordion', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <span slot="trigger">Item</span><p>Content</p>
        </hx-accordion-item>
      `);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('outside hx-accordion'));
      warnSpy.mockRestore();
    });
  });

  // ─── Accordion-item: trigger slot empty warning ───

  describe('accordion-item trigger slot empty warning', () => {
    it('warns when trigger slot is empty', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixAccordionItem>(`
        <hx-accordion-item>
          <p>Content only, no trigger</p>
        </hx-accordion-item>
      `);
      // Trigger the slotchange by dispatching it
      const triggerSlot = el.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      if (triggerSlot) {
        triggerSlot.dispatchEvent(new Event('slotchange', { bubbles: true }));
      }
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('trigger slot is empty'));
      warnSpy.mockRestore();
    });
  });

  // ─── Accordion: slot validation warning ───

  describe('accordion slot validation', () => {
    it('warns when non-accordion-item elements are slotted', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <div>Not an accordion item</div>
        </hx-accordion>
      `);
      // Trigger slotchange manually if needed
      const slot = el.shadowRoot?.querySelector<HTMLSlotElement>('slot');
      if (slot) {
        slot.dispatchEvent(new Event('slotchange', { bubbles: true }));
      }
      await el.updateComplete;
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected'));
      warnSpy.mockRestore();
    });
  });

  // ─── ArrowDown wraps from last to first ───

  describe('ArrowDown wraps from last to first trigger', () => {
    it('ArrowDown on last item wraps to first', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger2.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[0].shadowRoot?.activeElement).toBe(trigger1);
    });

    it('ArrowUp on first item wraps to last', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      const trigger1 = shadowQuery<HTMLElement>(items[0], '[part="trigger"]')!;
      const trigger2 = shadowQuery<HTMLElement>(items[1], '[part="trigger"]')!;

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(items[1].shadowRoot?.activeElement).toBe(trigger2);
    });
  });

  // ─── disconnectedCallback cleanup ───

  describe('disconnectedCallback cleanup', () => {
    it('disconnectedCallback removes event listeners', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item expanded>
            <span slot="trigger">A</span><p>Content A</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">B</span><p>Content B</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      el.remove();

      const items = el.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
      let _expandFired = false;
      el.addEventListener('hx-expand', () => { _expandFired = true; });
      items[1]._dispatchToggleEvent(true);
      // After removal, handler is removed so sibling collapse does not run
      expect(items[0].expanded).toBe(true); // stays expanded since coordinator removed
    });
  });

  // ─── ARIA audit (group-4 round-1) ───
  // Accordion is audit-only in Group 4: existing impl already follows APG.
  // These tests ASSERT the documented behavior so future refactors can't
  // silently regress it (especially: NOT promoting to host-canonical
  // internals.ariaLabelledByElements, which would fight the native
  // <details>/<summary> heading projection).

  describe('ARIA audit (group-4 round-1)', () => {
    it('summary carries role="heading" with the configured aria-level', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item level="2">
            <span slot="trigger">Q</span><p>A</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      const summary = item.shadowRoot!.querySelector<HTMLElement>('summary[part="trigger"]')!;
      expect(summary.getAttribute('role')).toBe('heading');
      expect(summary.getAttribute('aria-level')).toBe('2');
    });

    it('aria-level clamps below 1 and above 6', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item level="9">
            <span slot="trigger">High</span><p>x</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      const summary = item.shadowRoot!.querySelector<HTMLElement>('summary[part="trigger"]')!;
      expect(summary.getAttribute('aria-level')).toBe('6');
    });

    it('aria-controls / aria-labelledby resolve same-shadow-root (round-trip)', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Trigger text</span><p>Body content</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      const summary = item.shadowRoot!.querySelector<HTMLElement>('summary[part="trigger"]')!;
      const region = item.shadowRoot!.querySelector<HTMLElement>('[role="region"]')!;
      const triggerId = summary.id;
      const contentId = region.id;
      expect(triggerId).toBeTruthy();
      expect(contentId).toBeTruthy();
      // aria-controls on summary points at content id (same shadow root → resolves).
      expect(summary.getAttribute('aria-controls')).toBe(contentId);
      // aria-labelledby on region points back at the summary id.
      expect(region.getAttribute('aria-labelledby')).toBe(triggerId);
      // Both elements reachable via shadow getElementById (cross-check).
      expect(item.shadowRoot!.getElementById(triggerId)).toBe(summary);
      expect(item.shadowRoot!.getElementById(contentId)).toBe(region);
    });

    it('disabled item has aria-disabled="true" and tabindex="-1"', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item disabled>
            <span slot="trigger">Disabled</span><p>x</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      const summary = item.shadowRoot!.querySelector<HTMLElement>('summary[part="trigger"]')!;
      expect(summary.getAttribute('aria-disabled')).toBe('true');
      expect(summary.getAttribute('tabindex')).toBe('-1');
    });

    it('aria-expanded reflects expanded state', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">T</span><p>x</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      const summary = item.shadowRoot!.querySelector<HTMLElement>('summary[part="trigger"]')!;
      expect(summary.getAttribute('aria-expanded')).toBe('false');
      item.expanded = true;
      await item.updateComplete;
      expect(summary.getAttribute('aria-expanded')).toBe('true');
    });

    it('item host element does NOT carry host-canonical role / aria-label (deviation from group-2)', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item>
            <span slot="trigger">Slot label</span><p>Body</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixAccordionItem>('hx-accordion-item')!;
      await item.updateComplete;
      // Per the architectural deviation note in hx-accordion-item.ts:
      // we do NOT push the heading role / labelledby through the host's
      // ElementInternals. The host stays neutral, the inner <summary>
      // owns the heading semantics. This test guards that decision.
      expect(item.getAttribute('role')).toBeNull();
      expect(item.getAttribute('aria-label')).toBeNull();
      expect(item.getAttribute('aria-labelledby')).toBeNull();
    });
  });
});
