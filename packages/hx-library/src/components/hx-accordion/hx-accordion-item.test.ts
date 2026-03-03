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
import type { HelixAccordionItem } from './hx-accordion-item.js';
import './index.js';

afterEach(cleanup);

describe('hx-accordion-item', () => {
  // ─── Rendering (7) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the outer item container', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const item = shadowQuery(el, '.item');
      expect(item).toBeTruthy();
    });

    it('exposes "item" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(shadowQuery(el, '[part="item"]')).toBeTruthy();
    });

    it('exposes "heading" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(shadowQuery(el, '[part="heading"]')).toBeTruthy();
    });

    it('exposes "trigger" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(shadowQuery(el, '[part="trigger"]')).toBeTruthy();
    });

    it('exposes "content" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(shadowQuery(el, '[part="content"]')).toBeTruthy();
    });

    it('exposes "icon" CSS part', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(shadowQuery(el, '[part="icon"]')).toBeTruthy();
    });
  });

  // ─── Property: open (4) ───

  describe('Property: open', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(el.open).toBe(false);
    });

    it('reflects open attribute when true', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('removes open attribute when set to false', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });

    it('sets aria-hidden="false" on content panel when open', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      const panel = shadowQuery(el, '[part="content"]')!;
      expect(panel.getAttribute('aria-hidden')).toBe('false');
    });

    it('sets aria-hidden="true" on content panel when closed', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const panel = shadowQuery(el, '[part="content"]')!;
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section">Content</hx-accordion-item>',
      );
      expect(el.disabled).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('prevents toggling open state when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('sets aria-disabled="true" on trigger when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets aria-disabled="false" on trigger when not disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-disabled')).toBe('false');
    });
  });

  // ─── Property: heading (3) ───

  describe('Property: heading', () => {
    it('renders heading text from the heading property', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="My Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '.trigger')!;
      expect(trigger.textContent?.trim()).toContain('My Section');
    });

    it('defaults heading to empty string', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item>Content</hx-accordion-item>',
      );
      expect(el.heading).toBe('');
    });

    it('accepts heading override via named slot', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Fallback"><span slot="heading">Rich Heading</span>Content</hx-accordion-item>',
      );
      const slottedHeading = el.querySelector('[slot="heading"]');
      expect(slottedHeading).toBeTruthy();
      expect(slottedHeading?.textContent).toBe('Rich Heading');
    });
  });

  // ─── Toggle Behavior (4) ───

  describe('Toggle behavior', () => {
    it('clicking trigger opens a closed item', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('clicking trigger closes an open item', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('dispatches hx-accordion-item-toggle when opening', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-item-toggle');
      trigger.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.open).toBe(true);
      expect(event.detail.item).toBe(el);
    });

    it('dispatches hx-accordion-item-toggle when closing', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-item-toggle');
      trigger.click();
      const event = await eventPromise;
      expect(event.detail.open).toBe(false);
      expect(event.detail.item).toBe(el);
    });

    it('hx-accordion-item-toggle bubbles and is composed', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-item-toggle');
      trigger.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('does not dispatch toggle event when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      let fired = false;
      el.addEventListener('hx-accordion-item-toggle', () => {
        fired = true;
      });
      trigger.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (3) ───

  describe('Keyboard', () => {
    it('Enter key on trigger toggles open state (native button click)', async () => {
      // The trigger is a native <button>. In a real browser, pressing Enter on a
      // focused button fires a click event. We simulate the same outcome by calling
      // .click() on the trigger, which is what the browser does internally.
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-item-toggle');
      trigger.focus();
      trigger.click();
      const event = await eventPromise;
      expect(event.detail.open).toBe(true);
    });

    it('Space key on trigger toggles open state (native button click)', async () => {
      // Same rationale as the Enter test — Space on a native <button> calls click().
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-accordion-item-toggle');
      trigger.focus();
      trigger.click();
      const event = await eventPromise;
      expect(event.detail.open).toBe(true);
    });

    it('keyboard interaction is suppressed when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '.trigger')!;
      let fired = false;
      el.addEventListener('hx-accordion-item-toggle', () => {
        fired = true;
      });
      trigger.focus();
      // Simulate click — disabled guard in _handleTriggerClick prevents toggle
      trigger.click();
      await el.updateComplete;
      expect(fired).toBe(false);
      expect(el.open).toBe(false);
    });
  });

  // ─── ARIA (5) ───

  describe('ARIA', () => {
    it('trigger has aria-expanded="false" when closed', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger has aria-expanded="true" when open', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('trigger aria-expanded updates after programmatic open change', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('trigger aria-controls points to the panel id', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      const panelId = trigger.getAttribute('aria-controls')!;
      expect(panelId).toBeTruthy();
      const panel = shadowQuery(el, `#${panelId}`);
      expect(panel).toBeTruthy();
    });

    it('content panel has role="region"', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const panel = shadowQuery(el, '[part="content"]')!;
      expect(panel.getAttribute('role')).toBe('region');
    });

    it('content panel has aria-labelledby pointing to trigger id', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]')!;
      const panel = shadowQuery(el, '[part="content"]')!;
      const triggerId = trigger.getAttribute('id')!;
      expect(triggerId).toBeTruthy();
      expect(panel.getAttribute('aria-labelledby')).toBe(triggerId);
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('all 5 CSS parts are present in shadow DOM', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Content</hx-accordion-item>',
      );
      const parts = shadowQueryAll(el, '[part]');
      const partNames = parts.map((p) => p.getAttribute('part'));
      expect(partNames).toContain('item');
      expect(partNames).toContain('heading');
      expect(partNames).toContain('trigger');
      expect(partNames).toContain('content');
      expect(partNames).toContain('icon');
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders panel content', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section">Panel body text</hx-accordion-item>',
      );
      expect(el.textContent?.trim()).toContain('Panel body text');
    });

    it('heading slot renders rich content', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item><em slot="heading">Italic Heading</em>Body</hx-accordion-item>',
      );
      const slottedEl = el.querySelector('[slot="heading"]');
      expect(slottedEl).toBeTruthy();
      expect(slottedEl?.tagName.toLowerCase()).toBe('em');
      expect(slottedEl?.textContent).toBe('Italic Heading');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item heading="Section One">Panel content here</hx-accordion-item>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item open heading="Section One">Panel content here</hx-accordion-item>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixAccordionItem>(
        '<hx-accordion-item disabled heading="Section One">Panel content here</hx-accordion-item>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
