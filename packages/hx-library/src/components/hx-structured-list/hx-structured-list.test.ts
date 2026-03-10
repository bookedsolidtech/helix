import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixStructuredList } from './hx-structured-list.js';
import type { HelixStructuredListRow } from './hx-structured-list.js';
import './index.js';

afterEach(cleanup);

// ─── hx-structured-list ───

describe('hx-structured-list', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders a div element as base', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      const base = shadowQuery(el, 'div.list');
      expect(base).toBeTruthy();
    });
  });

  // ─── Property: bordered ───

  describe('Property: bordered', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.bordered).toBe(false);
    });

    it('reflects bordered to host attribute', async () => {
      const el = await fixture<HelixStructuredList>(
        '<hx-structured-list bordered></hx-structured-list>',
      );
      expect(el.hasAttribute('bordered')).toBe(true);
    });

    it('setting bordered=true reflects to attribute', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      el.bordered = true;
      await el.updateComplete;
      expect(el.hasAttribute('bordered')).toBe(true);
    });
  });

  // ─── Property: condensed ───

  describe('Property: condensed', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.condensed).toBe(false);
    });

    it('reflects condensed to host attribute', async () => {
      const el = await fixture<HelixStructuredList>(
        '<hx-structured-list condensed></hx-structured-list>',
      );
      expect(el.hasAttribute('condensed')).toBe(true);
    });
  });

  // ─── Property: striped ───

  describe('Property: striped', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.striped).toBe(false);
    });

    it('reflects striped to host attribute', async () => {
      const el = await fixture<HelixStructuredList>(
        '<hx-structured-list striped></hx-structured-list>',
      );
      expect(el.hasAttribute('striped')).toBe(true);
    });
  });

  // ─── Slotting rows ───

  describe('Slot: default', () => {
    it('slots hx-structured-list-row children', async () => {
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row>
            <span slot="label">Name</span>
            Jane Doe
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      const row = el.querySelector('hx-structured-list-row');
      expect(row).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — empty list', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — bordered with rows', async () => {
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list bordered>
          <hx-structured-list-row>
            <span slot="label">Full name</span>
            Jane Doe
          </hx-structured-list-row>
          <hx-structured-list-row>
            <span slot="label">MRN</span>
            885521
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — striped', async () => {
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list striped>
          <hx-structured-list-row>
            <span slot="label">Role</span>
            Registered Nurse
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});

// ─── hx-structured-list-row ───

describe('hx-structured-list-row', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row></hx-structured-list-row>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row></hx-structured-list-row>',
      );
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      const label = shadowQuery(el, '[part~="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "value" CSS part', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      const value = shadowQuery(el, '[part~="value"]');
      expect(value).toBeTruthy();
    });

    it('renders a role="term" element for label', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      const term = shadowQuery(el, '[role="term"]');
      expect(term).toBeTruthy();
    });

    it('renders a role="definition" element for value', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      const def = shadowQuery(el, '[role="definition"]');
      expect(def).toBeTruthy();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('label slot receives slotted content', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Full Name</span>Jane Doe</hx-structured-list-row>',
      );
      const labelSpan = el.querySelector('[slot="label"]');
      expect(labelSpan?.textContent).toBe('Full Name');
    });

    it('default slot receives value content', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Jane Doe</hx-structured-list-row>',
      );
      expect(el.textContent?.includes('Jane Doe')).toBe(true);
    });

    it('actions slot receives action content', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Jane<button slot="actions">Edit</button></hx-structured-list-row>',
      );
      const btn = el.querySelector('[slot="actions"]');
      expect(btn?.textContent).toBe('Edit');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — standalone row', async () => {
      const el = await fixture<HelixStructuredListRow>(`
        <hx-structured-list-row>
          <span slot="label">Full name</span>
          Jane Doe
        </hx-structured-list-row>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — row with actions', async () => {
      const el = await fixture<HelixStructuredListRow>(`
        <hx-structured-list-row>
          <span slot="label">Email</span>
          jane@example.com
          <button slot="actions">Edit</button>
        </hx-structured-list-row>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
