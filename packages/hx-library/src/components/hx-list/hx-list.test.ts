import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixList } from './hx-list.js';
import type { HelixListItem } from './hx-list-item.js';
import './index.js';

afterEach(cleanup);

describe('hx-list', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixList>('<hx-list></hx-list>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixList>('<hx-list></hx-list>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders <ul> for plain variant by default', async () => {
      const el = await fixture<HelixList>('<hx-list></hx-list>');
      const base = shadowQuery(el, 'ul');
      expect(base).toBeInstanceOf(HTMLUListElement);
    });

    it('renders <ol> for numbered variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="numbered"></hx-list>');
      const base = shadowQuery(el, 'ol');
      expect(base).toBeInstanceOf(HTMLOListElement);
    });

    it('renders <ul> for bulleted variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="bulleted"></hx-list>');
      const base = shadowQuery(el, 'ul');
      expect(base).toBeInstanceOf(HTMLUListElement);
    });

    it('renders <ul> for interactive variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="interactive"></hx-list>');
      const base = shadowQuery(el, 'ul');
      expect(base).toBeInstanceOf(HTMLUListElement);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('defaults to plain', async () => {
      const el = await fixture<HelixList>('<hx-list></hx-list>');
      expect(el.variant).toBe('plain');
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixList>('<hx-list variant="interactive"></hx-list>');
      expect(el.getAttribute('variant')).toBe('interactive');
    });

    it('sets role="listbox" for interactive variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="interactive"></hx-list>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('role')).toBe('listbox');
    });

    it('sets role="list" for plain variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="plain"></hx-list>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('role')).toBe('list');
    });

    it('sets role="list" for bulleted variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="bulleted"></hx-list>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('role')).toBe('list');
    });

    it('renders <ol> without redundant role for numbered variant', async () => {
      // Per WCAG audit fix (P2): <ol role="list"> suppresses ordered list semantics in VoiceOver.
      // The <ol> element has an implicit listitem role; no explicit role attribute needed.
      const el = await fixture<HelixList>('<hx-list variant="numbered"></hx-list>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.tagName.toLowerCase()).toBe('ol');
      expect(base.getAttribute('role')).toBeNull();
    });
  });

  // ─── Property: divided ───

  describe('Property: divided', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixList>('<hx-list></hx-list>');
      expect(el.divided).toBe(false);
    });

    it('reflects divided attribute to host', async () => {
      const el = await fixture<HelixList>('<hx-list divided></hx-list>');
      expect(el.hasAttribute('divided')).toBe(true);
    });
  });

  // ─── hx-select event ───

  describe('Events: hx-select', () => {
    it('dispatches hx-select when item clicked in interactive mode', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive">
          <hx-list-item value="test">Test</hx-list-item>
        </hx-list>
      `);
      const item = el.querySelector('hx-list-item')!;
      const eventPromise = oneEvent(el, 'hx-select');
      const liEl = shadowQuery<HTMLElement>(item, '[part~="base"]')!;
      liEl.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-select detail contains item and value', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive">
          <hx-list-item value="appointments">Appointments</hx-list-item>
        </hx-list>
      `);
      const item = el.querySelector('hx-list-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      const liEl = shadowQuery<HTMLElement>(item, '[part~="base"]')!;
      liEl.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('appointments');
    });

    it('does not dispatch hx-select in plain mode', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="plain">
          <hx-list-item value="test">Test</hx-list-item>
        </hx-list>
      `);
      const item = el.querySelector('hx-list-item')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      const liEl = shadowQuery<HTMLElement>(item, '[part~="base"]')!;
      liEl.click();
      // Use a proper async tick to ensure all microtasks are flushed (not just updateComplete)
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fired).toBe(false);
    });
  });
});

describe('hx-list-item', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const label = shadowQuery(el, '[part~="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "prefix" CSS part', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const prefix = shadowQuery(el, '[part~="prefix"]');
      expect(prefix).toBeTruthy();
    });

    it('exposes "suffix" CSS part', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const suffix = shadowQuery(el, '[part~="suffix"]');
      expect(suffix).toBeTruthy();
    });

    it('exposes "description" CSS part', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const desc = shadowQuery(el, '[part~="description"]');
      expect(desc).toBeTruthy();
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item disabled>Item</hx-list-item>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not dispatch hx-list-item-click when disabled', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item disabled>Item</hx-list-item>');
      let fired = false;
      el.addEventListener('hx-list-item-click', () => {
        fired = true;
      });
      const liEl = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      liEl.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Property: selected ───

  describe('Property: selected', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      expect(el.selected).toBe(false);
    });

    it('reflects selected attribute to host', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item selected>Item</hx-list-item>');
      expect(el.hasAttribute('selected')).toBe(true);
    });

    it('applies selected class when selected', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item selected>Item</hx-list-item>');
      const li = shadowQuery(el, '.list-item')!;
      expect(li.classList.contains('list-item--selected')).toBe(true);
    });
  });

  // ─── Property: href ───

  describe('Property: href', () => {
    it('renders <a> element when href is set', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item href="https://example.com">Item</hx-list-item>',
      );
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });

    it('sets href on the anchor element', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item href="https://example.com">Item</hx-list-item>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com');
    });
  });

  // ─── Property: value ───

  describe('Property: value', () => {
    it('stores value property', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item value="appointments">Item</hx-list-item>',
      );
      expect(el.value).toBe('appointments');
    });
  });

  // ─── Events ───

  describe('Events: hx-list-item-click', () => {
    it('dispatches hx-list-item-click on click', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item value="test">Item</hx-list-item>',
      );
      const eventPromise = oneEvent(el, 'hx-list-item-click');
      const liEl = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      liEl.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-list-item-click detail contains value', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item value="labs">Item</hx-list-item>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-list-item-click');
      const liEl = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      liEl.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('labs');
    });

    it('hx-list-item-click bubbles and is composed', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-list-item-click');
      const liEl = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      liEl.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('has role="listitem" by default (outside hx-list)', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      const li = shadowQuery(el, '[part~="base"]')!;
      expect(li.getAttribute('role')).toBe('listitem');
    });

    it('has role="option" on the host element inside interactive hx-list', async () => {
      // ARIA ownership fix: role="option" is on the HOST element (hx-list-item), not the shadow <li>.
      // This ensures ul[role=listbox] > hx-list-item[role=option] ownership is correct.
      const container = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item>Item</hx-list-item>
        </hx-list>
      `);
      const item = container.querySelector('hx-list-item')!;
      await item.updateComplete;
      expect(item.getAttribute('role')).toBe('option');
    });

    it('sets aria-selected on host element in interactive list', async () => {
      // ARIA ownership fix: aria-selected is on the HOST element, synced by _syncHostAria().
      const container = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item selected>Item</hx-list-item>
        </hx-list>
      `);
      const item = container.querySelector('hx-list-item')!;
      await item.updateComplete;
      expect(item.getAttribute('aria-selected')).toBe('true');
    });

    it('sets aria-disabled when disabled', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item disabled>Item</hx-list-item>');
      const li = shadowQuery(el, '[part~="base"]')!;
      expect(li.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Lab Results</hx-list-item>');
      expect(el.textContent?.trim()).toBe('Lab Results');
    });

    it('prefix slot renders content', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item><span slot="prefix">*</span>Item</hx-list-item>',
      );
      const slotted = el.querySelector('[slot="prefix"]');
      expect(slotted).toBeTruthy();
    });

    it('suffix slot renders content', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item>Item<span slot="suffix">3</span></hx-list-item>',
      );
      const slotted = el.querySelector('[slot="suffix"]');
      expect(slotted).toBeTruthy();
    });

    it('description slot renders content and is accessible', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item>Item<span slot="description">Details here</span></hx-list-item>',
      );
      const slotted = el.querySelector('[slot="description"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Details here');
      // Verify the description part exists in shadow DOM
      const descPart = shadowQuery(el, '[part~="description"]');
      expect(descPart).toBeTruthy();
    });
  });

  // ─── href + disabled combination ───

  describe('href + disabled combination', () => {
    it('renders as plain <li> (no anchor) when disabled and href set', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item href="https://example.com" disabled>Item</hx-list-item>',
      );
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeNull();
    });

    it('does not dispatch hx-list-item-click when disabled and href set', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item href="https://example.com" disabled>Item</hx-list-item>',
      );
      let fired = false;
      el.addEventListener('hx-list-item-click', () => {
        fired = true;
      });
      const liEl = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      liEl.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fired).toBe(false);
    });
  });

  // ─── interactive property (set by parent) ───

  describe('Property: interactive', () => {
    it('sets role="option" on host when interactive=true', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item interactive>Item</hx-list-item>');
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('option');
    });

    it('sets aria-selected on host when interactive=true', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item interactive selected>Item</hx-list-item>',
      );
      await el.updateComplete;
      expect(el.getAttribute('aria-selected')).toBe('true');
    });

    it('does not set role on host when interactive=false', async () => {
      const el = await fixture<HelixListItem>('<hx-list-item>Item</hx-list-item>');
      await el.updateComplete;
      expect(el.getAttribute('role')).toBeNull();
    });

    it('does not render <a> link in interactive mode (invalid ARIA)', async () => {
      const container = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item href="https://example.com" value="link">Link Item</hx-list-item>
        </hx-list>
      `);
      const item = container.querySelector('hx-list-item')!;
      await item.updateComplete;
      const anchor = shadowQuery(item, 'a');
      expect(anchor).toBeNull();
    });

    it('parent hx-list sets interactive on child items', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixListItem>('hx-list-item')!;
      await item.updateComplete;
      expect(item.interactive).toBe(true);
    });
  });

  // ─── description list type ───

  describe('Property: type (description list)', () => {
    it('renders <dt> when type="term"', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item type="term">Allergies</hx-list-item>',
      );
      const dt = shadowQuery(el, 'dt');
      expect(dt).toBeTruthy();
    });

    it('renders <dd> when type="definition"', async () => {
      const el = await fixture<HelixListItem>(
        '<hx-list-item type="definition">Penicillin</hx-list-item>',
      );
      const dd = shadowQuery(el, 'dd');
      expect(dd).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('hx-list plain has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="plain">
          <hx-list-item>Schedule Appointment</hx-list-item>
          <hx-list-item>View Lab Results</hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-list bulleted has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="bulleted">
          <hx-list-item>Item one</hx-list-item>
          <hx-list-item>Item two</hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-list numbered has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="numbered">
          <hx-list-item>Step one</hx-list-item>
          <hx-list-item>Step two</hx-list-item>
          <hx-list-item>Step three</hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-list interactive has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
          <hx-list-item value="b" selected>Option B</hx-list-item>
          <hx-list-item value="c" disabled>Option C</hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-list-item with disabled state has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Actions">
          <hx-list-item disabled>Unavailable</hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Keyboard navigation ───

  describe('Keyboard navigation (interactive)', () => {
    it('ArrowDown moves focus to next item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
          <hx-list-item value="b">Option B</hx-list-item>
          <hx-list-item value="c">Option C</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll<HelixListItem>('hx-list-item'));
      await items[0].updateComplete;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('ArrowUp moves focus to previous item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
          <hx-list-item value="b">Option B</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll<HelixListItem>('hx-list-item'));
      await items[1].updateComplete;
      items[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('Home moves focus to first item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
          <hx-list-item value="b">Option B</hx-list-item>
          <hx-list-item value="c">Option C</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll<HelixListItem>('hx-list-item'));
      await items[2].updateComplete;
      items[2].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('End moves focus to last item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
          <hx-list-item value="b">Option B</hx-list-item>
          <hx-list-item value="c">Option C</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll<HelixListItem>('hx-list-item'));
      await items[0].updateComplete;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('Enter dispatches hx-list-item-click on focused item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="a">Option A</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixListItem>('hx-list-item')!;
      await item.updateComplete;
      const eventPromise = oneEvent(item, 'hx-list-item-click');
      const liEl = shadowQuery<HTMLElement>(item, '[part~="base"]')!;
      liEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space dispatches hx-list-item-click on focused item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="interactive" label="Options">
          <hx-list-item value="b">Option B</hx-list-item>
        </hx-list>
      `);
      await el.updateComplete;
      const item = el.querySelector<HelixListItem>('hx-list-item')!;
      await item.updateComplete;
      const eventPromise = oneEvent(item, 'hx-list-item-click');
      const liEl = shadowQuery<HTMLElement>(item, '[part~="base"]')!;
      liEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('sets aria-label on the listbox element', async () => {
      const el = await fixture<HelixList>(
        '<hx-list variant="interactive" label="Treatment options"></hx-list>',
      );
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Treatment options');
    });
  });

  // ─── Description variant ───

  describe('Variant: description', () => {
    it('renders <dl> for description variant', async () => {
      const el = await fixture<HelixList>('<hx-list variant="description"></hx-list>');
      const dl = shadowQuery(el, 'dl');
      expect(dl).toBeInstanceOf(HTMLElement);
    });
  });

  // ─── Nested lists ───

  describe('Nested lists', () => {
    it('renders a nested bulleted list inside a list item', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="bulleted">
          <hx-list-item>
            Parent
            <hx-list variant="bulleted">
              <hx-list-item>Child A</hx-list-item>
              <hx-list-item>Child B</hx-list-item>
            </hx-list>
          </hx-list-item>
        </hx-list>
      `);
      const nestedList = el.querySelector('hx-list-item hx-list');
      expect(nestedList).toBeTruthy();
      const nestedItems = nestedList!.querySelectorAll('hx-list-item');
      expect(nestedItems.length).toBe(2);
    });

    it('nested list has no axe violations', async () => {
      const el = await fixture<HelixList>(`
        <hx-list variant="bulleted">
          <hx-list-item>
            Outer item
            <hx-list variant="numbered">
              <hx-list-item>Inner step one</hx-list-item>
              <hx-list-item>Inner step two</hx-list-item>
            </hx-list>
          </hx-list-item>
        </hx-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
