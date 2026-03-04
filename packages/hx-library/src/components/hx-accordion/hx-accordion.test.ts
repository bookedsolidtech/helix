import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import {
  fixture,
  shadowQuery,
  shadowQueryAll,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import type { HelixAccordion } from './hx-accordion.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';
import './index.js';

afterEach(cleanup);

// ─── Helper: build a two-item accordion ───

async function twoItemAccordion(): Promise<HelixAccordion> {
  return fixture<HelixAccordion>(`
    <hx-accordion>
      <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
      <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
    </hx-accordion>
  `);
}

async function threeItemAccordion(): Promise<HelixAccordion> {
  return fixture<HelixAccordion>(`
    <hx-accordion>
      <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
      <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
      <hx-accordion-item heading="Item 3">Content 3</hx-accordion-item>
    </hx-accordion>
  `);
}

function getItems(accordion: HelixAccordion): HelixAccordionItem[] {
  return Array.from(accordion.querySelectorAll('hx-accordion-item')) as HelixAccordionItem[];
}

function getTrigger(item: HelixAccordionItem): HTMLButtonElement {
  const trigger = item.shadowRoot?.querySelector<HTMLButtonElement>('.trigger');
  if (!trigger) {
    throw new Error('Could not find trigger element in accordion item');
  }
  return trigger;
}

describe('hx-accordion', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "accordion" CSS part', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(shadowQuery(el, '[part="accordion"]')).toBeTruthy();
    });

    it('renders slotted accordion items', async () => {
      const el = await twoItemAccordion();
      const items = getItems(el);
      expect(items).toHaveLength(2);
    });
  });

  // ─── Property: multiple (4) ───

  describe('Property: multiple', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(el.multiple).toBe(false);
    });

    it('reflects multiple attribute', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion multiple></hx-accordion>');
      expect(el.multiple).toBe(true);
      expect(el.hasAttribute('multiple')).toBe(true);
    });

    it('removes multiple attribute when set to false', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion multiple></hx-accordion>');
      el.multiple = false;
      await el.updateComplete;
      expect(el.hasAttribute('multiple')).toBe(false);
    });

    it('in single mode, opening a second item closes the first', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;
      expect(item1.open).toBe(true);

      getTrigger(item2).click();
      await item2.updateComplete;
      await item1.updateComplete;

      expect(item2.open).toBe(true);
      expect(item1.open).toBe(false);
    });

    it('in multiple mode, multiple items can be open simultaneously', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion multiple>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
        </hx-accordion>
      `);
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;

      getTrigger(item2).click();
      await item2.updateComplete;

      expect(item1.open).toBe(true);
      expect(item2.open).toBe(true);
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion></hx-accordion>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute', async () => {
      const el = await fixture<HelixAccordion>('<hx-accordion disabled></hx-accordion>');
      expect(el.disabled).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('setting disabled=true disables all child items', async () => {
      const el = await twoItemAccordion();
      el.disabled = true;
      await el.updateComplete;
      const items = getItems(el);
      for (const item of items) {
        expect(item.disabled).toBe(true);
      }
    });

    it('disabled items cannot be opened via click', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion disabled>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
        </hx-accordion>
      `);
      const [item] = getItems(el) as [HelixAccordionItem];
      getTrigger(item).click();
      await item.updateComplete;
      expect(item.open).toBe(false);
    });
  });

  // ─── Single Mode Behavior (3) ───

  describe('Single mode behavior', () => {
    it('only one item is open at a time', async () => {
      const el = await threeItemAccordion();
      const [item1, item2, item3] = getItems(el) as [
        HelixAccordionItem,
        HelixAccordionItem,
        HelixAccordionItem,
      ];

      getTrigger(item1).click();
      await item1.updateComplete;
      getTrigger(item2).click();
      await item2.updateComplete;
      await item1.updateComplete;
      getTrigger(item3).click();
      await item3.updateComplete;
      await item2.updateComplete;

      const openItems = getItems(el).filter((i) => i.open);
      expect(openItems).toHaveLength(1);
      expect(item3.open).toBe(true);
    });

    it('toggling the same item closed then open again works', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;
      expect(item1.open).toBe(true);

      getTrigger(item1).click();
      await item1.updateComplete;
      expect(item1.open).toBe(false);

      getTrigger(item1).click();
      await item1.updateComplete;
      expect(item1.open).toBe(true);
    });

    it('closing an item does not affect other closed items', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;
      getTrigger(item1).click();
      await item1.updateComplete;

      expect(item1.open).toBe(false);
      expect(item2.open).toBe(false);
    });
  });

  // ─── Multiple Mode Behavior (3) ───

  describe('Multiple mode behavior', () => {
    it('all items can be open simultaneously in multiple mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion multiple>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
          <hx-accordion-item heading="Item 3">Content 3</hx-accordion-item>
        </hx-accordion>
      `);
      const items = getItems(el) as HelixAccordionItem[];

      for (const item of items) {
        getTrigger(item).click();
        await item.updateComplete;
      }

      for (const item of items) {
        expect(item.open).toBe(true);
      }
    });

    it('individual items can be closed independently in multiple mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion multiple>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
        </hx-accordion>
      `);
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;
      getTrigger(item2).click();
      await item2.updateComplete;

      // close item1 only
      getTrigger(item1).click();
      await item1.updateComplete;

      expect(item1.open).toBe(false);
      expect(item2.open).toBe(true);
    });

    it('switching from multiple to single mode does not auto-close items', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion multiple>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
        </hx-accordion>
      `);
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;
      getTrigger(item2).click();
      await item2.updateComplete;

      // Both open, now switch to single mode
      el.multiple = false;
      await el.updateComplete;

      // No auto-close on mode change — items stay open until next interaction
      expect(item1.open).toBe(true);
      expect(item2.open).toBe(true);
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-accordion-change when an item opens', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-change');
      getTrigger(item1).click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-accordion-change detail includes correct item reference', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-change');
      getTrigger(item1).click();
      const event = await eventPromise;
      expect(event.detail.item).toBe(item1);
    });

    it('hx-accordion-change detail.open is true when opening', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-change');
      getTrigger(item1).click();
      const event = await eventPromise;
      expect(event.detail.open).toBe(true);
    });

    it('hx-accordion-change detail.open is false when closing', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];

      getTrigger(item1).click();
      await item1.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-change');
      getTrigger(item1).click();
      const event = await eventPromise;
      expect(event.detail.open).toBe(false);
    });

    it('hx-accordion-change bubbles and is composed', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-change');
      getTrigger(item1).click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── slotchange / dynamic items (2) ───

  describe('slotchange — dynamic item sync', () => {
    it('dynamically added items inherit disabled state', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion disabled>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
        </hx-accordion>
      `);

      const newItem = document.createElement('hx-accordion-item') as HelixAccordionItem;
      newItem.setAttribute('heading', 'Item 2');
      newItem.textContent = 'Content 2';
      el.appendChild(newItem);

      // Wait for the slot change to be processed and updateComplete on the new item
      await el.updateComplete;
      await newItem.updateComplete;

      expect(newItem.disabled).toBe(true);
    });

    it('dynamically added items are not disabled when accordion is enabled', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
        </hx-accordion>
      `);

      const newItem = document.createElement('hx-accordion-item') as HelixAccordionItem;
      newItem.setAttribute('heading', 'Item 2');
      newItem.textContent = 'Content 2';
      el.appendChild(newItem);

      await el.updateComplete;
      await newItem.updateComplete;

      expect(newItem.disabled).toBe(false);
    });
  });

  // ─── Keyboard Navigation (4) ───

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus from first item trigger to second', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];
      const trigger1 = getTrigger(item1);
      const trigger2 = getTrigger(item2);

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(item2.shadowRoot?.activeElement).toBe(trigger2);
    });

    it('ArrowUp moves focus from second item trigger to first', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];
      const trigger1 = getTrigger(item1);
      const trigger2 = getTrigger(item2);

      trigger2.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

      expect(item1.shadowRoot?.activeElement).toBe(trigger1);
    });

    it('ArrowDown wraps from last item to first', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];
      const trigger1 = getTrigger(item1);
      const trigger2 = getTrigger(item2);

      trigger2.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(item1.shadowRoot?.activeElement).toBe(trigger1);
    });

    it('ArrowUp wraps from first item to last', async () => {
      const el = await twoItemAccordion();
      const [item1, item2] = getItems(el) as [HelixAccordionItem, HelixAccordionItem];
      const trigger1 = getTrigger(item1);
      const trigger2 = getTrigger(item2);

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

      expect(item2.shadowRoot?.activeElement).toBe(trigger2);
    });

    it('arrow key navigation skips disabled items', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item disabled heading="Item 2">Content 2</hx-accordion-item>
          <hx-accordion-item heading="Item 3">Content 3</hx-accordion-item>
        </hx-accordion>
      `);
      const [item1, , item3] = getItems(el) as [
        HelixAccordionItem,
        HelixAccordionItem,
        HelixAccordionItem,
      ];
      const trigger1 = getTrigger(item1);
      const trigger3 = getTrigger(item3);

      trigger1.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(item3.shadowRoot?.activeElement).toBe(trigger3);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with all items closed', async () => {
      const el = await twoItemAccordion();
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with an item open', async () => {
      const el = await twoItemAccordion();
      const [item1] = getItems(el) as [HelixAccordionItem];
      getTrigger(item1).click();
      await item1.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in multiple mode', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion multiple>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
        </hx-accordion>
      `);
      const items = getItems(el);
      for (const item of items) {
        getTrigger(item).click();
        await item.updateComplete;
      }
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when accordion is disabled', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion disabled>
          <hx-accordion-item heading="Item 1">Content 1</hx-accordion-item>
          <hx-accordion-item heading="Item 2">Content 2</hx-accordion-item>
        </hx-accordion>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
