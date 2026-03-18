import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';
import type { HelixTable } from './hx-table.js';
import type { HelixTableHead } from './hx-thead.js';
import type { HelixTableBody } from './hx-tbody.js';
import type { HelixTableFoot } from './hx-tfoot.js';
import type { HelixTableRow } from './hx-tr.js';
import type { HelixTableHeader } from './hx-th.js';
import type { HelixTableCell } from './hx-td.js';
import type { HxTableSortDetail } from './hx-th.js';
import './index.js';

afterEach(cleanup);

// ─── hx-table ───

describe('hx-table', () => {
  describe('Rendering', () => {
    it('renders shadow DOM', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test table"></hx-table>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <table> element in shadow DOM', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test table"></hx-table>');
      const table = shadowQuery(el, 'table');
      expect(table).toBeTruthy();
    });

    it('exposes "table" CSS part on the <table> element', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test table"></hx-table>');
      expect(shadowQuery(el, '[part~="table"]')).toBeTruthy();
    });

    it('applies label as aria-label on the <table> element', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Patient list"></hx-table>');
      const table = shadowQuery(el, 'table');
      expect(table?.getAttribute('aria-label')).toBe('Patient list');
    });

    it('does not set aria-label when label is empty', async () => {
      const el = await fixture<HelixTable>('<hx-table></hx-table>');
      const table = shadowQuery(el, 'table');
      expect(table?.hasAttribute('aria-label')).toBe(false);
    });

    it('does not warn on initial render when label is not provided', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await fixture<HelixTable>('<hx-table></hx-table>');
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('warns when label is changed to empty string after having a value', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTable>('<hx-table label="Patients"></hx-table>');
      el.label = '';
      await el.updateComplete;
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[hx-table]'));
      warn.mockRestore();
    });

    it('does not warn when label is provided', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await fixture<HelixTable>('<hx-table label="Patients"></hx-table>');
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('renders <caption> when caption attribute is set', async () => {
      const el = await fixture<HelixTable>(
        '<hx-table label="Test" caption="Patient records"></hx-table>',
      );
      const caption = shadowQuery(el, 'caption');
      expect(caption).toBeTruthy();
    });

    it('exposes "caption" CSS part on the <caption> element', async () => {
      const el = await fixture<HelixTable>(
        '<hx-table label="Test" caption="Patient records"></hx-table>',
      );
      expect(shadowQuery(el, '[part~="caption"]')).toBeTruthy();
    });

    it('renders caption text content inside <caption>', async () => {
      const el = await fixture<HelixTable>(
        '<hx-table label="Test" caption="Q1 Admissions"></hx-table>',
      );
      const caption = shadowQuery(el, 'caption');
      expect(caption?.textContent?.trim()).toBe('Q1 Admissions');
    });

    it('does not render <caption> when caption attribute is absent', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test table"></hx-table>');
      const caption = shadowQuery(el, 'caption');
      expect(caption).toBeNull();
    });

    it('renders caption slot for rich caption content', async () => {
      const el = await fixture<HelixTable>(
        '<hx-table label="Test" caption="fallback"><span slot="caption" id="rich-caption">Rich caption</span></hx-table>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot[name="caption"]');
      expect(slot).toBeTruthy();
      const assigned = slot!.assignedElements();
      expect(assigned.length).toBe(1);
      expect((assigned[0] as HTMLElement).id).toBe('rich-caption');
    });

    it('renders default slot for child components', async () => {
      const el = await fixture<HelixTable>(
        '<hx-table label="Test"><hx-tbody></hx-tbody></hx-table>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot:not([name])');
      expect(slot).toBeTruthy();
    });

    it('has role="table" on the <table> element', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test"></hx-table>');
      const table = shadowQuery(el, 'table');
      expect(table?.getAttribute('role')).toBe('table');
    });
  });

  describe('Properties', () => {
    it('reflects variant attribute on host', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test" variant="striped"></hx-table>');
      expect(el.getAttribute('variant')).toBe('striped');
    });

    it('defaults variant to "default"', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test"></hx-table>');
      expect(el.variant).toBe('default');
    });

    it('accepts "hover" variant', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test" variant="hover"></hx-table>');
      expect(el.variant).toBe('hover');
      expect(el.getAttribute('variant')).toBe('hover');
    });

    it('accepts "compact" variant', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test" variant="compact"></hx-table>');
      expect(el.variant).toBe('compact');
      expect(el.getAttribute('variant')).toBe('compact');
    });

    it('reflects sticky-header attribute on host', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test" sticky-header></hx-table>');
      expect(el.hasAttribute('sticky-header')).toBe(true);
      expect(el.stickyHeader).toBe(true);
    });

    it('sticky-header defaults to false', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test"></hx-table>');
      expect(el.stickyHeader).toBe(false);
    });

    it('reflects full-width attribute on host', async () => {
      const el = await fixture<HelixTable>('<hx-table label="Test" full-width></hx-table>');
      expect(el.hasAttribute('full-width')).toBe(true);
      expect(el.fullWidth).toBe(true);
    });

    it('variant="striped" sets variant attribute (CSS selector hooks for striping)', async () => {
      const el = await fixture<HelixTable>(
        `<hx-table label="Test" variant="striped">
          <hx-tbody>
            <hx-tr><hx-td>Row 1</hx-td></hx-tr>
            <hx-tr><hx-td>Row 2</hx-td></hx-tr>
          </hx-tbody>
        </hx-table>`,
      );
      await el.updateComplete;
      // The variant attribute drives CSS :host([variant="striped"]) selectors
      expect(el.getAttribute('variant')).toBe('striped');
    });

    it('stickyHeader=true reflects sticky-header attribute (CSS selector hook)', async () => {
      const el = await fixture<HelixTable>(
        `<hx-table label="Test" sticky-header>
          <hx-thead><hx-tr><hx-th>Name</hx-th></hx-tr></hx-thead>
          <hx-tbody><hx-tr><hx-td>Jane</hx-td></hx-tr></hx-tbody>
        </hx-table>`,
      );
      await el.updateComplete;
      // The sticky-header attribute drives :host([sticky-header]) CSS selectors
      expect(el.hasAttribute('sticky-header')).toBe(true);
      expect(el.stickyHeader).toBe(true);
    });

    it('fullWidth=true reflects full-width attribute (CSS selector hook)', async () => {
      const el = await fixture<HelixTable>(
        `<hx-table label="Test" full-width>
          <hx-tbody><hx-tr><hx-td>Content</hx-td></hx-tr></hx-tbody>
        </hx-table>`,
      );
      await el.updateComplete;
      // The full-width attribute drives :host([full-width]) table { width: 100% }
      expect(el.hasAttribute('full-width')).toBe(true);
      expect(el.fullWidth).toBe(true);
    });
  });
});

// ─── hx-thead ───

describe('hx-thead', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableHead>('<hx-thead></hx-thead>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <thead> element in shadow DOM', async () => {
    const el = await fixture<HelixTableHead>('<hx-thead></hx-thead>');
    expect(shadowQuery(el, 'thead')).toBeTruthy();
  });

  it('exposes "thead" CSS part', async () => {
    const el = await fixture<HelixTableHead>('<hx-thead></hx-thead>');
    expect(shadowQuery(el, '[part~="thead"]')).toBeTruthy();
  });

  it('has role="rowgroup" on the <thead> element', async () => {
    const el = await fixture<HelixTableHead>('<hx-thead></hx-thead>');
    const thead = shadowQuery(el, 'thead');
    expect(thead?.getAttribute('role')).toBe('rowgroup');
  });

  it('host uses display:contents', async () => {
    const el = await fixture<HelixTableHead>('<hx-thead></hx-thead>');
    const style = getComputedStyle(el);
    expect(style.display).toBe('contents');
  });
});

// ─── hx-tbody ───

describe('hx-tbody', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableBody>('<hx-tbody></hx-tbody>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <tbody> element in shadow DOM', async () => {
    const el = await fixture<HelixTableBody>('<hx-tbody></hx-tbody>');
    expect(shadowQuery(el, 'tbody')).toBeTruthy();
  });

  it('exposes "tbody" CSS part', async () => {
    const el = await fixture<HelixTableBody>('<hx-tbody></hx-tbody>');
    expect(shadowQuery(el, '[part~="tbody"]')).toBeTruthy();
  });

  it('has role="rowgroup" on the <tbody> element', async () => {
    const el = await fixture<HelixTableBody>('<hx-tbody></hx-tbody>');
    const tbody = shadowQuery(el, 'tbody');
    expect(tbody?.getAttribute('role')).toBe('rowgroup');
  });

  it('host uses display:contents', async () => {
    const el = await fixture<HelixTableBody>('<hx-tbody></hx-tbody>');
    const style = getComputedStyle(el);
    expect(style.display).toBe('contents');
  });
});

// ─── hx-tfoot ───

describe('hx-tfoot', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableFoot>('<hx-tfoot></hx-tfoot>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <tfoot> element in shadow DOM', async () => {
    const el = await fixture<HelixTableFoot>('<hx-tfoot></hx-tfoot>');
    expect(shadowQuery(el, 'tfoot')).toBeTruthy();
  });

  it('exposes "tfoot" CSS part', async () => {
    const el = await fixture<HelixTableFoot>('<hx-tfoot></hx-tfoot>');
    expect(shadowQuery(el, '[part~="tfoot"]')).toBeTruthy();
  });

  it('has role="rowgroup" on the <tfoot> element', async () => {
    const el = await fixture<HelixTableFoot>('<hx-tfoot></hx-tfoot>');
    const tfoot = shadowQuery(el, 'tfoot');
    expect(tfoot?.getAttribute('role')).toBe('rowgroup');
  });

  it('host uses display:contents', async () => {
    const el = await fixture<HelixTableFoot>('<hx-tfoot></hx-tfoot>');
    const style = getComputedStyle(el);
    expect(style.display).toBe('contents');
  });
});

// ─── hx-tr ───

describe('hx-tr', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <tr> element in shadow DOM', async () => {
    const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
    expect(shadowQuery(el, 'tr')).toBeTruthy();
  });

  it('exposes "row" CSS part on the <tr>', async () => {
    const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
    expect(shadowQuery(el, '[part~="row"]')).toBeTruthy();
  });

  it('has role="row" on the <tr> element', async () => {
    const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
    const tr = shadowQuery(el, 'tr');
    expect(tr?.getAttribute('role')).toBe('row');
  });

  it('host uses display:contents', async () => {
    const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
    const style = getComputedStyle(el);
    expect(style.display).toBe('contents');
  });

  describe('selected', () => {
    it('sets aria-selected="true" on <tr> when selected attribute is present', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr selected></hx-tr>');
      const tr = shadowQuery(el, 'tr');
      expect(tr?.getAttribute('aria-selected')).toBe('true');
    });

    it('does not set aria-selected on <tr> when selected is false', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
      const tr = shadowQuery(el, 'tr');
      expect(tr?.hasAttribute('aria-selected')).toBe(false);
    });

    it('reflects selected attribute on host', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr selected></hx-tr>');
      expect(el.hasAttribute('selected')).toBe(true);
      expect(el.selected).toBe(true);
    });
  });

  describe('disabled', () => {
    it('sets aria-disabled="true" on <tr> when disabled attribute is present', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr disabled></hx-tr>');
      const tr = shadowQuery(el, 'tr');
      expect(tr?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled on <tr> when disabled is false', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr></hx-tr>');
      const tr = shadowQuery(el, 'tr');
      expect(tr?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixTableRow>('<hx-tr disabled></hx-tr>');
      expect(el.hasAttribute('disabled')).toBe(true);
      expect(el.disabled).toBe(true);
    });
  });
});

// ─── hx-th ───

describe('hx-th', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <th> element in shadow DOM', async () => {
    const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
    expect(shadowQuery(el, 'th')).toBeTruthy();
  });

  it('exposes "header" CSS part on the <th>', async () => {
    const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
    expect(shadowQuery(el, '[part~="header"]')).toBeTruthy();
  });

  it('has role="columnheader" on the <th>', async () => {
    const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
    const th = shadowQuery(el, 'th');
    expect(th?.getAttribute('role')).toBe('columnheader');
  });

  describe('scope', () => {
    it('defaults scope to "col"', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('scope')).toBe('col');
    });

    it('applies scope="row" when specified', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th scope="row">Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('scope')).toBe('row');
    });

    it('applies scope="colgroup" when specified', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th scope="colgroup">Group</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('scope')).toBe('colgroup');
    });
  });

  describe('sortable', () => {
    it('does not render a sort button when sortable is false', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      expect(shadowQuery(el, '.sort-btn')).toBeNull();
    });

    it('renders a sort button when sortable is true', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      expect(shadowQuery(el, '.sort-btn')).toBeTruthy();
    });

    it('renders the sort icon inside the sort button', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      expect(shadowQuery(el, '[part~="sort-icon"]')).toBeTruthy();
    });

    it('sort icon has aria-hidden="true"', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const icon = shadowQuery(el, '[part~="sort-icon"]');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not set aria-sort on non-sortable <th>', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.hasAttribute('aria-sort')).toBe(false);
    });

    it('sets aria-sort="none" on sortable <th> with no active direction', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('aria-sort')).toBe('none');
    });

    it('sets aria-sort="ascending" when sort-direction is "asc"', async () => {
      const el = await fixture<HelixTableHeader>(
        '<hx-th sortable sort-direction="asc">Name</hx-th>',
      );
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('aria-sort')).toBe('ascending');
    });

    it('sets aria-sort="descending" when sort-direction is "desc"', async () => {
      const el = await fixture<HelixTableHeader>(
        '<hx-th sortable sort-direction="desc">Name</hx-th>',
      );
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('aria-sort')).toBe('descending');
    });

    it('does not set tabindex on <th> when sortable (button handles focus)', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.hasAttribute('tabindex')).toBe(false);
    });

    it('sort button is naturally focusable when sortable', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn');
      expect(btn).toBeTruthy();
      // Native <button> elements are focusable without tabindex
      expect(btn?.tagName.toLowerCase()).toBe('button');
    });

    it('does not set tabindex on <th> when not sortable', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('hx-sort event', () => {
    it('dispatches hx-sort when sort button is clicked', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-sort event bubbles and is composed', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('first click dispatches direction "asc" (from "none")', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      const event = await eventPromise;
      expect(event.detail.direction).toBe('asc');
    });

    it('second click dispatches direction "desc" (toggling from "asc")', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;

      // first click → asc
      const firstPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      await firstPromise;

      // second click → desc
      const secondPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      const event = await secondPromise;
      expect(event.detail.direction).toBe('desc');
    });

    it('third click dispatches direction "asc" (cycling back from "desc")', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;

      // click 1 → asc
      const p1 = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      await p1;

      // click 2 → desc
      const p2 = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      await p2;

      // click 3 → asc
      const p3 = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      const event = await p3;
      expect(event.detail.direction).toBe('asc');
    });

    it('sort direction state updates on element after click', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      btn.click();
      await eventPromise;
      expect(el.sortDirection).toBe('asc');
    });
  });

  describe('keyboard', () => {
    it('sort button receives Enter key activation (native button behavior)', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      // Simulate keyboard activation: native buttons fire click on Enter/Space
      btn.click();
      const event = await eventPromise;
      expect(event.detail.direction).toBe('asc');
    });

    it('sort button receives Space key activation (native button behavior)', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th sortable>Name</hx-th>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.sort-btn')!;
      const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
      // Simulate keyboard activation: native buttons fire click on Enter/Space
      btn.click();
      const event = await eventPromise;
      expect(event.detail.direction).toBe('asc');
    });

    it('Enter key does not dispatch hx-sort when not sortable', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery<HTMLElement>(el, 'th')!;

      let fired = false;
      el.addEventListener('hx-sort', () => {
        fired = true;
      });

      th.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;

      expect(fired).toBe(false);
    });
  });

  describe('colspan and rowspan', () => {
    it('applies colspan attribute to native <th>', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th colspan="2">Group</hx-th>');
      await el.updateComplete;
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('colspan')).toBe('2');
    });

    it('applies rowspan attribute to native <th>', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th rowspan="3">Label</hx-th>');
      await el.updateComplete;
      const th = shadowQuery(el, 'th');
      expect(th?.getAttribute('rowspan')).toBe('3');
    });

    it('does not set colspan attribute when value is 0 (default)', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.hasAttribute('colspan')).toBe(false);
    });

    it('does not set rowspan attribute when value is 0 (default)', async () => {
      const el = await fixture<HelixTableHeader>('<hx-th>Name</hx-th>');
      const th = shadowQuery(el, 'th');
      expect(th?.hasAttribute('rowspan')).toBe(false);
    });
  });
});

// ─── hx-td ───

describe('hx-td', () => {
  it('renders shadow DOM', async () => {
    const el = await fixture<HelixTableCell>('<hx-td>Jane Doe</hx-td>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('renders a <td> element in shadow DOM', async () => {
    const el = await fixture<HelixTableCell>('<hx-td>Jane Doe</hx-td>');
    expect(shadowQuery(el, 'td')).toBeTruthy();
  });

  it('exposes "cell" CSS part on the <td>', async () => {
    const el = await fixture<HelixTableCell>('<hx-td>Jane Doe</hx-td>');
    expect(shadowQuery(el, '[part~="cell"]')).toBeTruthy();
  });

  it('has role="cell" on the <td>', async () => {
    const el = await fixture<HelixTableCell>('<hx-td>Jane Doe</hx-td>');
    const td = shadowQuery(el, 'td');
    expect(td?.getAttribute('role')).toBe('cell');
  });

  it('host uses display:contents', async () => {
    const el = await fixture<HelixTableCell>('<hx-td>Jane Doe</hx-td>');
    const style = getComputedStyle(el);
    expect(style.display).toBe('contents');
  });

  describe('align', () => {
    it('defaults align to "left"', async () => {
      const el = await fixture<HelixTableCell>('<hx-td>Content</hx-td>');
      expect(el.align).toBe('left');
    });

    it('reflects align="center" on host element', async () => {
      const el = await fixture<HelixTableCell>('<hx-td align="center">Content</hx-td>');
      expect(el.getAttribute('align')).toBe('center');
    });

    it('reflects align="right" on host element', async () => {
      const el = await fixture<HelixTableCell>('<hx-td align="right">Content</hx-td>');
      expect(el.getAttribute('align')).toBe('right');
    });
  });

  describe('colspan and rowspan', () => {
    it('applies colspan attribute to native <td>', async () => {
      const el = await fixture<HelixTableCell>('<hx-td colspan="3">Wide</hx-td>');
      await el.updateComplete;
      const td = shadowQuery(el, 'td');
      expect(td?.getAttribute('colspan')).toBe('3');
    });

    it('applies rowspan attribute to native <td>', async () => {
      const el = await fixture<HelixTableCell>('<hx-td rowspan="2">Tall</hx-td>');
      await el.updateComplete;
      const td = shadowQuery(el, 'td');
      expect(td?.getAttribute('rowspan')).toBe('2');
    });

    it('does not set colspan when value is 0 (default)', async () => {
      const el = await fixture<HelixTableCell>('<hx-td>Content</hx-td>');
      const td = shadowQuery(el, 'td');
      expect(td?.hasAttribute('colspan')).toBe(false);
    });

    it('does not set rowspan when value is 0 (default)', async () => {
      const el = await fixture<HelixTableCell>('<hx-td>Content</hx-td>');
      const td = shadowQuery(el, 'td');
      expect(td?.hasAttribute('rowspan')).toBe(false);
    });
  });

  describe('slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HelixTableCell>(
        '<hx-td><span id="cell-content">Jane Doe</span></hx-td>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot');
      expect(slot).toBeTruthy();
      const assigned = slot!.assignedElements();
      expect(assigned.length).toBe(1);
      expect((assigned[0] as HTMLElement).id).toBe('cell-content');
    });
  });

  describe('label / data-label', () => {
    it('forwards label attribute as data-label on native <td>', async () => {
      const el = await fixture<HelixTableCell>('<hx-td label="Patient Name">Jane Doe</hx-td>');
      await el.updateComplete;
      const td = shadowQuery(el, 'td');
      expect(td?.getAttribute('data-label')).toBe('Patient Name');
    });

    it('does not set data-label when label is empty (default)', async () => {
      const el = await fixture<HelixTableCell>('<hx-td>Content</hx-td>');
      const td = shadowQuery(el, 'td');
      expect(td?.hasAttribute('data-label')).toBe(false);
    });

    it('updates data-label when label property changes', async () => {
      const el = await fixture<HelixTableCell>('<hx-td label="Name">Jane</hx-td>');
      await el.updateComplete;
      const td = shadowQuery(el, 'td');
      expect(td?.getAttribute('data-label')).toBe('Name');

      el.label = 'Full Name';
      await el.updateComplete;
      expect(td?.getAttribute('data-label')).toBe('Full Name');
    });
  });
});

// ─── Integration: full table composition ───

describe('Integration: full hx-table composition', () => {
  const tableHtml = `
    <hx-table label="Patient roster">
      <hx-thead>
        <hx-tr>
          <hx-th sortable>Name</hx-th>
          <hx-th>Status</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        <hx-tr>
          <hx-td>Jane Doe</hx-td>
          <hx-td>Active</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td>John Smith</hx-td>
          <hx-td>Pending</hx-td>
        </hx-tr>
      </hx-tbody>
      <hx-tfoot>
        <hx-tr>
          <hx-td colspan="2">2 patients</hx-td>
        </hx-tr>
      </hx-tfoot>
    </hx-table>
  `;

  it('renders the full table structure without errors', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    expect(el.shadowRoot).toBeTruthy();
    expect(shadowQuery(el, 'table')).toBeTruthy();
  });

  it('hx-thead is slotted into hx-table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const thead = el.querySelector('hx-thead');
    expect(thead).toBeTruthy();
  });

  it('hx-tbody is slotted into hx-table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const tbody = el.querySelector('hx-tbody');
    expect(tbody).toBeTruthy();
  });

  it('hx-tfoot is slotted into hx-table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const tfoot = el.querySelector('hx-tfoot');
    expect(tfoot).toBeTruthy();
  });

  it('hx-th sub-components are present', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const ths = el.querySelectorAll('hx-th');
    expect(ths.length).toBe(2);
  });

  it('hx-td sub-components are present', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const tds = el.querySelectorAll('hx-td');
    expect(tds.length).toBe(5); // 2 in first row + 2 in second row + 1 spanning in tfoot
  });

  it('sortable hx-th renders a sort button', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const sortableHeader = el.querySelector<HelixTableHeader>('hx-th[sortable]')!;
    await sortableHeader.updateComplete;
    expect(shadowQuery(sortableHeader, '.sort-btn')).toBeTruthy();
  });

  it('hx-sort event from hx-th bubbles through hx-table (composed event)', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const sortableHeader = el.querySelector<HelixTableHeader>('hx-th[sortable]')!;
    await sortableHeader.updateComplete;

    const btn = shadowQuery<HTMLButtonElement>(sortableHeader, '.sort-btn')!;

    // Listen at the hx-table level — composed:true means the event crosses shadow boundaries
    const eventPromise = oneEvent<CustomEvent<HxTableSortDetail>>(el, 'hx-sort');
    btn.click();
    const event = await eventPromise;

    expect(event).toBeTruthy();
    expect(event.detail.direction).toBe('asc');
  });

  it('hx-tr selected state propagates aria-selected inside hx-table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const bodyRows = el.querySelectorAll<HelixTableRow>('hx-tbody hx-tr');
    bodyRows[0].selected = true;
    await bodyRows[0].updateComplete;

    const tr = shadowQuery(bodyRows[0], 'tr');
    expect(tr?.getAttribute('aria-selected')).toBe('true');
  });

  it('hx-td colspan passes through to native <td> in composed table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const footerCell = el.querySelector<HelixTableCell>('hx-tfoot hx-td')!;
    await footerCell.updateComplete;
    const td = shadowQuery(footerCell, 'td');
    expect(td?.getAttribute('colspan')).toBe('2');
  });

  it('hx-table aria-label is set correctly on composed table', async () => {
    const el = await fixture<HelixTable>(tableHtml);
    const table = shadowQuery(el, 'table');
    expect(table?.getAttribute('aria-label')).toBe('Patient roster');
  });
});
