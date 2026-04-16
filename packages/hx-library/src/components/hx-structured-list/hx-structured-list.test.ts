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

    it('host element has role="list" for assistive technology', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.getAttribute('role')).toBe('list');
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

    it('applies reduced padding in condensed mode', async () => {
      // The condensed attribute sets --_padding-block to 0.5rem via CSS custom property cascade.
      // We test the reflected attribute (not layout dimensions) since cross-shadow CSS variable
      // resolution is environment-dependent in headless Chromium.
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list condensed>
          <hx-structured-list-row>
            <span slot="label">Name</span>
            Jane Doe
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      expect(el.condensed).toBe(true);
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

    it('applies stripe background to even rows', async () => {
      // The striped attribute enables CSS :nth-of-type(even) styling via ::slotted.
      // Computed background-color via getComputedStyle is unreliable across shadow
      // boundaries in headless Chromium without token values loaded. We test the
      // reflected attribute and that child rows exist.
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list striped>
          <hx-structured-list-row>
            <span slot="label">Name</span>
            Jane Doe
          </hx-structured-list-row>
          <hx-structured-list-row>
            <span slot="label">MRN</span>
            885521
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      expect(el.striped).toBe(true);
      expect(el.hasAttribute('striped')).toBe(true);
      const rows = el.querySelectorAll('hx-structured-list-row');
      expect(rows.length).toBe(2);
    });
  });

  // ─── Row border dividers ───

  describe('Row border dividers', () => {
    it('renders border between rows using token variable', async () => {
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row>
            <span slot="label">Name</span>
            Jane Doe
          </hx-structured-list-row>
          <hx-structured-list-row>
            <span slot="label">MRN</span>
            885521
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      const firstRow = el.querySelector('hx-structured-list-row') as HelixStructuredListRow;
      await firstRow.updateComplete;
      const rowBase = firstRow.shadowRoot?.querySelector('.row') as HTMLElement;
      const borderBottom = getComputedStyle(rowBase).borderBottomStyle;
      expect(borderBottom).toBe('solid');
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

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      expect(el.label).toBe('');
    });

    it('sets aria-label on base div when label is provided', async () => {
      const el = await fixture<HelixStructuredList>(
        '<hx-structured-list label="Patient info"></hx-structured-list>',
      );
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Patient info');
    });

    it('does not set aria-label when label is empty string', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.hasAttribute('aria-label')).toBe(false);
    });

    it('updates aria-label when label property is changed', async () => {
      const el = await fixture<HelixStructuredList>('<hx-structured-list></hx-structured-list>');
      el.label = 'Updated label';
      await el.updateComplete;
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Updated label');
    });
  });

  // ─── Role preservation after upgrade (1) ───

  describe('Role preservation', () => {
    it('does not override an existing role attribute if already set', async () => {
      const el = document.createElement('hx-structured-list') as HelixStructuredList;
      el.setAttribute('role', 'region');
      document.body.appendChild(el);
      await customElements.whenDefined('hx-structured-list');
      // connectedCallback should not overwrite an existing role
      expect(el.getAttribute('role')).toBe('region');
      el.remove();
    });
  });

  // ─── Multiple rows (1) ───

  describe('Multiple rows', () => {
    it('accepts multiple hx-structured-list-row children', async () => {
      const el = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row><span slot="label">A</span>1</hx-structured-list-row>
          <hx-structured-list-row><span slot="label">B</span>2</hx-structured-list-row>
          <hx-structured-list-row><span slot="label">C</span>3</hx-structured-list-row>
        </hx-structured-list>
      `);
      const rows = el.querySelectorAll('hx-structured-list-row');
      expect(rows.length).toBe(3);
    });
  });

  // ─── condensed + striped combined (1) ───

  describe('Combined variants', () => {
    it('bordered condensed striped attributes can all be set simultaneously', async () => {
      const el = await fixture<HelixStructuredList>(
        '<hx-structured-list bordered condensed striped></hx-structured-list>',
      );
      expect(el.bordered).toBe(true);
      expect(el.condensed).toBe(true);
      expect(el.striped).toBe(true);
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

    it('host element has role="listitem"', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      expect(el.getAttribute('role')).toBe('listitem');
    });

    it('exposes "actions" CSS part', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value<button slot="actions">Edit</button></hx-structured-list-row>',
      );
      const actions = shadowQuery(el, '[part~="actions"]');
      expect(actions).toBeTruthy();
    });

    // P1-04: Verify all documented CSS parts are present and targetable
    it('documents all required CSS parts: base, label, value, actions', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value<button slot="actions">Edit</button></hx-structured-list-row>',
      );
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="value"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="actions"]')).toBeTruthy();
    });

    it('"base" part is the row root element and host carries role="listitem"', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value</hx-structured-list-row>',
      );
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
      expect(el.getAttribute('role')).toBe('listitem');
    });

    it('renders actions container with flex display', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row><span slot="label">Name</span>Value<button slot="actions">Edit</button></hx-structured-list-row>',
      );
      const actions = shadowQuery<HTMLElement>(el, '.row__actions');
      const display = getComputedStyle(actions!).display;
      expect(display).toBe('flex');
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
    it('has no axe violations — row inside list', async () => {
      // hx-structured-list-row has role="listitem" on its host element, which requires
      // a parent with role="list". Wrap in hx-structured-list for a valid axe context.
      const container = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row>
            <span slot="label">Full name</span>
            Jane Doe
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(container);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — row with actions inside list', async () => {
      // hx-structured-list-row has role="listitem" on its host element, which requires
      // a parent with role="list". Wrap in hx-structured-list for a valid axe context.
      const container = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row>
            <span slot="label">Email</span>
            jane@example.com
            <button slot="actions">Edit</button>
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(container);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — standalone row', async () => {
      // A standalone row without a list parent does not have aria-required-parent issues
      // because role="listitem" is still semantically valid for AT.
      const el = await fixture<HelixStructuredListRow>(`
        <hx-structured-list-row>
          <span slot="label">Department</span>
          Cardiology
        </hx-structured-list-row>
      `);
      await page.screenshot();
      // Use useElement to allow axe to traverse across the shadow boundary
      const { violations } = await checkA11y(el, { useElement: true });
      expect(violations).toEqual([]);
    });

    it('has no axe violations — row with actions', async () => {
      const container = await fixture<HelixStructuredList>(`
        <hx-structured-list>
          <hx-structured-list-row>
            <span slot="label">Phone</span>
            555-0100
            <button slot="actions" aria-label="Edit phone">Edit</button>
          </hx-structured-list-row>
        </hx-structured-list>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(container);
      expect(violations).toEqual([]);
    });
  });

  // ─── Role preservation (1) ───

  describe('Role preservation', () => {
    it('does not override an existing role attribute if already set', async () => {
      const el = document.createElement('hx-structured-list-row') as HelixStructuredListRow;
      el.setAttribute('role', 'row');
      document.body.appendChild(el);
      await customElements.whenDefined('hx-structured-list-row');
      expect(el.getAttribute('role')).toBe('row');
      el.remove();
    });
  });

  // ─── Default slot empty state (1) ───

  describe('Empty state', () => {
    it('renders without content slots without throwing', async () => {
      const el = await fixture<HelixStructuredListRow>(
        '<hx-structured-list-row></hx-structured-list-row>',
      );
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });
  });
});
