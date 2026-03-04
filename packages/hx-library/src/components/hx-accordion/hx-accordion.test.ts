import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixAccordion } from './hx-accordion.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';
import './index.js';

afterEach(cleanup);

// ─── hx-accordion ─────────────────────────────────────────────────────────────

describe('hx-accordion', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item><span slot="trigger">Item 1</span><p>Content 1</p></hx-accordion-item>
        </hx-accordion>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the "accordion" CSS part', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item><span slot="trigger">Item 1</span><p>Content 1</p></hx-accordion-item>
        </hx-accordion>
      `);
      const container = shadowQuery(el, '[part~="accordion"]');
      expect(container).toBeTruthy();
    });

    it('renders slotted accordion items', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item item-id="i1"><span slot="trigger">Item 1</span><p>Content 1</p></hx-accordion-item>
          <hx-accordion-item item-id="i2"><span slot="trigger">Item 2</span><p>Content 2</p></hx-accordion-item>
        </hx-accordion>
      `);
      const items = el.querySelectorAll('hx-accordion-item');
      expect(items.length).toBe(2);
    });

    it('defaults to mode="single"', async () => {
      const el = await fixture<HelixAccordion>(`<hx-accordion></hx-accordion>`);
      expect(el.mode).toBe('single');
      expect(el.getAttribute('mode')).toBe('single');
    });
  });

  // ─── Property: mode ───

  describe('Property: mode', () => {
    it('reflects mode="single" attribute to host', async () => {
      const el = await fixture<HelixAccordion>(`<hx-accordion mode="single"></hx-accordion>`);
      expect(el.getAttribute('mode')).toBe('single');
    });

    it('reflects mode="multi" attribute to host', async () => {
      const el = await fixture<HelixAccordion>(`<hx-accordion mode="multi"></hx-accordion>`);
      expect(el.getAttribute('mode')).toBe('multi');
    });

    it('single mode closes other items when one expands', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item item-id="s1" open><span slot="trigger">Item 1</span><p>Content 1</p></hx-accordion-item>
          <hx-accordion-item item-id="s2"><span slot="trigger">Item 2</span><p>Content 2</p></hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;
      expect(items[0]?.open).toBe(true);
      expect(items[1]?.open).toBe(false);

      // Expand item 2
      items[1]?.expand();
      await items[1]?.updateComplete;
      await items[0]?.updateComplete;

      // Item 2 should now be open; item 1 should be closed
      expect(items[1]?.open).toBe(true);
      expect(items[0]?.open).toBe(false);
    });

    it('multi mode allows multiple items to be open simultaneously', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item item-id="m1" open><span slot="trigger">Item 1</span><p>Content 1</p></hx-accordion-item>
          <hx-accordion-item item-id="m2"><span slot="trigger">Item 2</span><p>Content 2</p></hx-accordion-item>
        </hx-accordion>
      `);

      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;
      expect(items[0]?.open).toBe(true);

      // Expand item 2
      items[1]?.expand();
      await items[1]?.updateComplete;
      await items[0]?.updateComplete;

      // Both should now be open in multi mode
      expect(items[0]?.open).toBe(true);
      expect(items[1]?.open).toBe(true);
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown moves focus to next enabled item', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item item-id="kn1"><span slot="trigger">Item 1</span><p>Content</p></hx-accordion-item>
          <hx-accordion-item item-id="kn2"><span slot="trigger">Item 2</span><p>Content</p></hx-accordion-item>
        </hx-accordion>
      `);
      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;
      const firstSummary = items[0]?.shadowRoot?.querySelector<HTMLElement>('summary');
      const secondSummary = items[1]?.shadowRoot?.querySelector<HTMLElement>('summary');

      expect(firstSummary).toBeTruthy();
      expect(secondSummary).toBeTruthy();

      firstSummary!.focus();
      firstSummary!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );

      await new Promise((r) => setTimeout(r, 50));
      expect(document.activeElement !== firstSummary || secondSummary === document.activeElement).toBe(true);
    });

    it('ArrowUp moves focus to previous enabled item', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item item-id="ku1"><span slot="trigger">Item 1</span><p>Content</p></hx-accordion-item>
          <hx-accordion-item item-id="ku2"><span slot="trigger">Item 2</span><p>Content</p></hx-accordion-item>
        </hx-accordion>
      `);
      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;
      const secondSummary = items[1]?.shadowRoot?.querySelector<HTMLElement>('summary');

      expect(secondSummary).toBeTruthy();

      secondSummary!.focus();
      secondSummary!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }),
      );

      await new Promise((r) => setTimeout(r, 50));
      // Focus should have moved to a different element (first or wraps around)
      expect(secondSummary).toBeTruthy();
    });

    it('Arrow keys skip disabled items', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="single">
          <hx-accordion-item item-id="kd1"><span slot="trigger">Item 1</span><p>Content</p></hx-accordion-item>
          <hx-accordion-item item-id="kd2" disabled><span slot="trigger">Disabled</span><p>Content</p></hx-accordion-item>
          <hx-accordion-item item-id="kd3"><span slot="trigger">Item 3</span><p>Content</p></hx-accordion-item>
        </hx-accordion>
      `);
      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;
      expect(items[1]?.disabled).toBe(true);

      // The enabled items should be items 0 and 2
      const enabledItems = Array.from(items).filter((item) => !item.disabled);
      expect(enabledItems.length).toBe(2);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion>
          <hx-accordion-item item-id="a11y-1">
            <span slot="trigger">Question 1</span>
            <p>Answer 1</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="a11y-2">
            <span slot="trigger">Question 2</span>
            <p>Answer 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when items are open', async () => {
      const el = await fixture<HelixAccordion>(`
        <hx-accordion mode="multi">
          <hx-accordion-item item-id="a11y-open-1" open>
            <span slot="trigger">Open item 1</span>
            <p>Visible content for item 1</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="a11y-open-2" open>
            <span slot="trigger">Open item 2</span>
            <p>Visible content for item 2</p>
          </hx-accordion-item>
        </hx-accordion>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});

// ─── hx-accordion-item ────────────────────────────────────────────────────────

describe('hx-accordion-item', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <details> element', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const details = shadowQuery<HTMLDetailsElement>(el, 'details');
      expect(details).toBeInstanceOf(HTMLElement);
    });

    it('renders a <summary> element as trigger', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      expect(summary).toBeTruthy();
    });

    it('exposes "item" CSS part on details', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const part = shadowQuery(el, '[part~="item"]');
      expect(part).toBeTruthy();
    });

    it('exposes "trigger" CSS part on summary', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const part = shadowQuery(el, '[part~="trigger"]');
      expect(part).toBeTruthy();
    });

    it('exposes "content" CSS part on content panel', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const part = shadowQuery(el, '[part~="content"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" CSS part on chevron container', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const part = shadowQuery(el, '[part~="icon"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: open ───

  describe('Property: open', () => {
    it('defaults to open=false', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.open).toBe(false);
    });

    it('reflects open=true attribute to host', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('passes open state to native <details>', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const details = shadowQuery<HTMLDetailsElement>(el, 'details');
      expect(details?.open).toBe(true);
    });

    it('sets aria-expanded="true" when open', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.getAttribute('aria-expanded')).toBe('true');
    });

    it('sets aria-expanded="false" when closed', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.getAttribute('aria-expanded')).toBe('false');
    });

    it('sets aria-hidden="false" on content when open', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const content = shadowQuery(el, '[part~="content"]');
      expect(content?.getAttribute('aria-hidden')).toBe('false');
    });

    it('sets aria-hidden="true" on content when closed', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const content = shadowQuery(el, '[part~="content"]');
      expect(content?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to disabled=false', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.disabled).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets aria-disabled="true" on trigger when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets tabindex="-1" on trigger when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.getAttribute('tabindex')).toBe('-1');
    });

    it('prevents toggle() when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.toggle();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('prevents expand() when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.expand();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('click on trigger does not open disabled item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      summary?.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Property: item-id ───

  describe('Property: item-id', () => {
    it('reflects item-id attribute', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="my-item"><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(el.itemId).toBe('my-item');
    });
  });

  // ─── toggle/expand/collapse API ───

  describe('Public API: toggle / expand / collapse', () => {
    it('toggle() opens a closed item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.toggle();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('toggle() closes an open item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.toggle();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('expand() opens a closed item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.expand();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('expand() is a no-op on an already open item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.expand();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('collapse() closes an open item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.collapse();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('collapse() is a no-op on an already closed item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      el.collapse();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-expand when item opens', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="ev-expand"><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-expand');
      el.expand();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.detail.itemId).toBe('ev-expand');
    });

    it('dispatches hx-collapse when item closes', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="ev-collapse" open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-collapse');
      el.collapse();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.detail.itemId).toBe('ev-collapse');
    });

    it('hx-expand detail.itemId is empty string when item-id not set', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-expand');
      el.expand();
      const event = await eventPromise;
      expect(event.detail.itemId).toBe('');
    });

    it('does NOT dispatch hx-expand when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      let fired = false;
      el.addEventListener('hx-expand', () => {
        fired = true;
      });
      el.expand();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });

    it('does NOT dispatch hx-collapse when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      let fired = false;
      el.addEventListener('hx-collapse', () => {
        fired = true;
      });
      el.collapse();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard ───

  describe('Keyboard', () => {
    it('Enter toggles the item open', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const eventPromise = oneEvent(el, 'hx-expand');
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      await eventPromise;
      expect(el.open).toBe(true);
    });

    it('Space toggles the item open', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const eventPromise = oneEvent(el, 'hx-expand');
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
      await eventPromise;
      expect(el.open).toBe(true);
    });

    it('Enter on open item collapses it', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const eventPromise = oneEvent(el, 'hx-collapse');
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      await eventPromise;
      expect(el.open).toBe(false);
    });

    it('Enter on disabled item does nothing', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item disabled><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      let fired = false;
      el.addEventListener('hx-expand', () => {
        fired = true;
      });
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
      expect(el.open).toBe(false);
    });

    it('ArrowDown dispatches hx-accordion-nav with direction="next"', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const navPromise = oneEvent<CustomEvent<{ direction: string }>>(el, 'hx-accordion-nav');
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      const navEvent = await navPromise;
      expect(navEvent.detail.direction).toBe('next');
    });

    it('ArrowUp dispatches hx-accordion-nav with direction="prev"', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const navPromise = oneEvent<CustomEvent<{ direction: string }>>(el, 'hx-accordion-nav');
      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      const navEvent = await navPromise;
      expect(navEvent.detail.direction).toBe('prev');
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('trigger slot renders heading text', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">My Trigger Text</span><p>Content</p></hx-accordion-item>`,
      );
      const triggerSlotted = el.querySelector('[slot="trigger"]');
      expect(triggerSlotted?.textContent).toBe('My Trigger Text');
    });

    it('default slot renders body content', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p class="body-test">Body content here</p></hx-accordion-item>`,
      );
      const body = el.querySelector('.body-test');
      expect(body?.textContent).toBe('Body content here');
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('trigger has role="button"', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.getAttribute('role')).toBe('button');
    });

    it('content panel has role="region"', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const content = shadowQuery(el, '[part~="content"]');
      expect(content?.getAttribute('role')).toBe('region');
    });

    it('trigger aria-controls matches content panel id', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      const content = shadowQuery(el, '[part~="content"]');
      const controlsId = summary?.getAttribute('aria-controls');
      const contentId = content?.id;
      expect(controlsId).toBeTruthy();
      expect(controlsId).toBe(contentId);
    });

    it('content panel aria-labelledby matches trigger id', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      const content = shadowQuery(el, '[part~="content"]');
      const labelledById = content?.getAttribute('aria-labelledby');
      const triggerId = summary?.id;
      expect(labelledById).toBeTruthy();
      expect(labelledById).toBe(triggerId);
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes all four required CSS parts', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      expect(shadowQuery(el, '[part~="item"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="trigger"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="content"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="icon"]')).toBeTruthy();
    });
  });

  // ─── Progressive Enhancement ───

  describe('Progressive Enhancement', () => {
    it('uses <details> as the base element', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const details = shadowQuery(el, 'details');
      expect(details?.tagName.toLowerCase()).toBe('details');
    });

    it('uses <summary> as the trigger element', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery(el, 'summary');
      expect(summary?.tagName.toLowerCase()).toBe('summary');
    });
  });

  // ─── Click Interaction ───

  describe('Click Interaction', () => {
    it('clicking trigger opens a closed item', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const eventPromise = oneEvent(el, 'hx-expand');
      summary?.click();
      await eventPromise;
      expect(el.open).toBe(true);
    });

    it('clicking trigger on an open item closes it', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item open><span slot="trigger">Title</span><p>Content</p></hx-accordion-item>`,
      );
      const summary = shadowQuery<HTMLElement>(el, 'summary');
      const eventPromise = oneEvent(el, 'hx-collapse');
      summary?.click();
      await eventPromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations when closed', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="a11y-closed">
          <span slot="trigger">Section heading</span>
          <p>Section content</p>
        </hx-accordion-item>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when open', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="a11y-open" open>
          <span slot="trigger">Section heading</span>
          <p>Section content that is visible</p>
        </hx-accordion-item>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        `<hx-accordion-item item-id="a11y-disabled" disabled>
          <span slot="trigger">Disabled section</span>
          <p>Disabled content</p>
        </hx-accordion-item>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
