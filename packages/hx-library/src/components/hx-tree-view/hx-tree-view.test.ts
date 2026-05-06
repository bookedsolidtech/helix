import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import { HelixTreeView, type HxTreeView } from './hx-tree-view.js';
import { HelixTreeItem, type HxTreeItem } from './hx-tree-item.js';
import './index.js';

afterEach(cleanup);

// ─────────────────────────────────────────────────
// Test helpers — read role + aria-* off whichever surface owns them per
// path. On the modern host-canonical path, `internals.role` lives on the
// host (no DOM attribute); on the legacy fallback path, the inner
// `[role="..."]` element carries it. Both paths must be observable.
// ─────────────────────────────────────────────────

function readHostRole(host: HTMLElement): string | null {
  const internals = (host as unknown as { _internals: ElementInternals })._internals;
  return (
    internals.role ??
    host.shadowRoot?.querySelector('[role="tree"], [role="treeitem"]')?.getAttribute('role') ??
    null
  );
}

function readHostAriaLabel(host: HTMLElement): string | null {
  const internals = (host as unknown as { _internals: ElementInternals })._internals;
  if (typeof internals.ariaLabel === 'string' && internals.ariaLabel.length > 0) {
    return internals.ariaLabel;
  }
  // Legacy fallback path mirrors aria-label onto inner [role="..."]
  const inner = host.shadowRoot?.querySelector(
    '[role="tree"], [role="treeitem"]',
  ) as HTMLElement | null;
  return inner?.getAttribute('aria-label') ?? null;
}

function readHostAriaState(host: HTMLElement, name: string): string | null {
  // On the modern path internals exposes IDL string accessors for each
  // ARIA state. The DOM attribute name to IDL property mapping uses
  // specific casing for compound words (PosInSet, SetSize, MultiSelectable),
  // so a hand-written map is more reliable than a regex.
  const idlMap: Record<string, string> = {
    'aria-selected': 'ariaSelected',
    'aria-expanded': 'ariaExpanded',
    'aria-disabled': 'ariaDisabled',
    'aria-level': 'ariaLevel',
    'aria-posinset': 'ariaPosInSet',
    'aria-setsize': 'ariaSetSize',
    'aria-multiselectable': 'ariaMultiSelectable',
    'aria-checked': 'ariaChecked',
    'aria-busy': 'ariaBusy',
    'aria-haspopup': 'ariaHasPopup',
  };
  const idlKey = idlMap[name];
  if (idlKey) {
    const internals = (host as unknown as { _internals: ElementInternals })._internals;
    const idlValue = (internals as unknown as Record<string, string | null>)[idlKey];
    if (typeof idlValue === 'string' && idlValue.length > 0) return idlValue;
  }
  const inner = host.shadowRoot?.querySelector(
    '[role="tree"], [role="treeitem"]',
  ) as HTMLElement | null;
  return inner?.getAttribute(name) ?? null;
}

// ─────────────────────────────────────────────────
// hx-tree-view
// ─────────────────────────────────────────────────

describe('hx-tree-view', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes role="tree" on the host-canonical surface', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      // Modern path: ElementInternals.role on host. Legacy fallback path:
      // inner [role="tree"] element. Helper reads whichever owns it.
      expect(readHostRole(el)).toBe('tree');
    });

    it('tree container is the focus landing target when empty', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      // Empty tree → container is a Tab stop so a Tab into the empty
      // surface still has somewhere to land.
      expect(tree?.getAttribute('tabindex')).toBe('0');
    });

    it('omits aria-multiselectable when selection="none" (default)', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      expect(readHostAriaState(el, 'aria-multiselectable')).toBeNull();
    });

    it('sets aria-multiselectable="true" in multiple selection mode', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view selection="multiple"></hx-tree-view>');
      await el.updateComplete;
      expect(readHostAriaState(el, 'aria-multiselectable')).toBe('true');
    });
  });

  // ─── Property: selection ───

  describe('Property: selection', () => {
    it('defaults to "none"', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.selection).toBe('none');
    });

    it('reflects selection attribute to property', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view selection="single"></hx-tree-view>');
      expect(el.selection).toBe('single');
    });

    it('reflects "multiple" selection', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view selection="multiple"></hx-tree-view>');
      expect(el.selection).toBe('multiple');
    });
  });

  // ─── Selection Behavior ───

  describe('Selection behavior', () => {
    it('does not select items when selection is "none"', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );
      await el.updateComplete;

      expect(item.selected).toBe(false);
    });

    it('selects item in single selection mode', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));

      item1.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item: item1 },
        }),
      );
      await el.updateComplete;

      expect(item1.selected).toBe(true);
      expect(item2.selected).toBe(false);
    });

    it('deselects previous item in single selection mode', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item selected>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      expect(item1.selected).toBe(true);

      item2.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item: item2 },
        }),
      );
      await el.updateComplete;

      expect(item1.selected).toBe(false);
      expect(item2.selected).toBe(true);
    });

    it('allows multiple selections in multiple selection mode', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="multiple">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));

      item1.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item: item1 },
        }),
      );
      item2.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item: item2 },
        }),
      );
      await el.updateComplete;

      expect(item1.selected).toBe(true);
      expect(item2.selected).toBe(true);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-select when item is selected', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      const eventPromise = oneEvent(el, 'hx-select');

      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );

      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-select event has correct detail', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');

      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );

      const event = await eventPromise;
      expect(event.detail.item).toBe(item);
      expect(typeof event.detail.selected).toBe('boolean');
    });

    it('hx-select is composed (crosses shadow boundaries)', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      const parentEventPromise = oneEvent<CustomEvent>(document.body, 'hx-select');

      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );

      const event = await parentEventPromise;
      expect(event.composed).toBe(true);
    });

    it('does not dispatch hx-select when selection is "none"', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });

      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );
      await el.updateComplete;

      expect(fired).toBe(false);
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.label).toBe('');
    });

    it('reflects label attribute to property', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view label="File browser"></hx-tree-view>');
      expect(el.label).toBe('File browser');
    });

    it('sets aria-label on the host-canonical surface', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view label="File browser"></hx-tree-view>');
      await el.updateComplete;
      expect(readHostAriaLabel(el)).toBe('File browser');
    });

    it('falls back to "Tree" accessible name when label is empty', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      await el.updateComplete;
      expect(readHostAriaLabel(el)).toBe('Tree');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "tree" part on the container', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      const part = shadowQuery(el, '[part~="tree"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has role="tree" on the host-canonical surface', async () => {
      const el = await fixture<HxTreeView>('<hx-tree-view></hx-tree-view>');
      expect(readHostRole(el)).toBe('tree');
    });

    it('has no axe violations with labeled tree', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Test tree" selection="single">
          <hx-tree-item>Label</hx-tree-item>
          <hx-tree-item selected>Selected</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;
      // Disabled-item color-contrast (opacity-disabled token rendered against
      // the page background) is intentionally excluded — disabled controls
      // are exempt from WCAG 1.4.3 per WCAG 2 SC 1.4.3 Note 5. The disabled
      // case is covered separately by the dedicated disabled-state tests
      // (no aria-required-parent or naming regressions there).
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });

    it('has no axe violations with nested items', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nested tree" selection="single">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child 1</hx-tree-item>
            <hx-tree-item slot="children">Child 2</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });
  });

  // ─── Tree-level Keyboard Navigation ───

  describe('Tree-level Keyboard Navigation', () => {
    it('ArrowDown moves focus to next visible item', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
          <hx-tree-item>Item 3</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      // Focus the first item's row via the component's public focus() method
      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      // The second item's .item-row should now be the active element in its shadow root
      const secondRow = items[1]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[1] || secondRow === items[1]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('ArrowUp moves focus to previous visible item', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      items[1]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      await el.updateComplete;

      const firstRow = items[0]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[0] || firstRow === items[0]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('Home moves focus to first visible item', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
          <hx-tree-item>Item 3</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      items[2]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }));
      await el.updateComplete;

      const firstRow = items[0]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[0] || firstRow === items[0]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('End moves focus to last visible item', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
          <hx-tree-item>Item 3</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }));
      await el.updateComplete;

      const lastRow = items[2]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[2] || lastRow === items[2]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('ArrowDown wraps from last item to first', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      items[1]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      const firstRow = items[0]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[0] || firstRow === items[0]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('ArrowUp wraps from first item to last', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      await el.updateComplete;

      const lastRow = items[1]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[1] || lastRow === items[1]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('ArrowLeft collapses expanded parent item', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const parent = el.querySelector<HxTreeItem>('hx-tree-item')!;
      expect(parent.expanded).toBe(true);
      parent.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(parent.expanded).toBe(false);
    });

    it('ArrowLeft on collapsed leaf item moves focus to parent', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const allItems = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      const parentItem = allItems[0]!;
      const childItem = allItems[1]!;

      // Focus the child (collapsed leaf)
      childItem.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
      await el.updateComplete;

      const parentRow = parentItem.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === parentItem || parentRow === parentItem.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('ArrowDown skips collapsed children (only navigates visible items)', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>
            Parent (collapsed)
            <hx-tree-item slot="children">Hidden child</hx-tree-item>
          </hx-tree-item>
          <hx-tree-item>Next sibling</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const topLevelItems = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() === 'hx-tree-item',
      ) as HxTreeItem[];
      const firstTop = topLevelItems[0]!;
      const secondTop = topLevelItems[1]!;

      firstTop.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;

      // Should land on sibling, not the hidden child
      const secondRow = secondTop.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === secondTop || secondRow === secondTop.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('disabled item does not dispatch hx-tree-item-select on keyboard Enter', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Test" selection="single">
          <hx-tree-item disabled>Disabled Item</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      const row = shadowQuery<HTMLElement>(item, '.item-row')!;

      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });

      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(fired).toBe(false);
    });

    it('typeahead moves focus to next visible item starting with typed character', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Apple</hx-tree-item>
          <hx-tree-item>Banana</hx-tree-item>
          <hx-tree-item>Cherry</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      // Wait for slotchange label text to settle
      await items[0]!.updateComplete;
      await items[1]!.updateComplete;
      await items[2]!.updateComplete;

      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, composed: true }));
      await el.updateComplete;

      const bananaRow = items[1]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[1] || bananaRow === items[1]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('typeahead is case-insensitive', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Apple</hx-tree-item>
          <hx-tree-item>Cherry</hx-tree-item>
          <hx-tree-item>Date</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      await items[0]!.updateComplete;
      await items[2]!.updateComplete;

      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      // Uppercase 'D' should still match 'Date'
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', bubbles: true, composed: true }));
      await el.updateComplete;

      const dateRow = items[2]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[2] || dateRow === items[2]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('typeahead wraps around to find a match before current index', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Apple</hx-tree-item>
          <hx-tree-item>Banana</hx-tree-item>
          <hx-tree-item>Cherry</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      await items[0]!.updateComplete;
      await items[1]!.updateComplete;
      await items[2]!.updateComplete;

      // Focus the last item, then type 'a' which should wrap to 'Apple'
      items[2]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
      await el.updateComplete;

      const appleRow = items[0]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[0] || appleRow === items[0]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('typeahead does nothing when no item matches', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Nav test">
          <hx-tree-item>Apple</hx-tree-item>
          <hx-tree-item>Banana</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
      await items[0]!.updateComplete;
      await items[1]!.updateComplete;

      items[0]!.focus();
      await el.updateComplete;

      const tree = shadowQuery<HTMLElement>(el, '.tree')!;
      // 'z' matches nothing — focus should stay on item 0
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, composed: true }));
      await el.updateComplete;

      const appleRow = items[0]!.shadowRoot?.querySelector('.item-row');
      expect(
        document.activeElement === items[0] || appleRow === items[0]!.shadowRoot?.activeElement,
      ).toBe(true);
    });

    it('disabled item does not expand on keyboard ArrowRight', async () => {
      const el = await fixture<HxTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item disabled>
            Disabled Parent
            <hx-tree-item slot="children">Child</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
      expect(item.expanded).toBe(false);

      const row = shadowQuery<HTMLElement>(item, '.item-row')!;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(item.expanded).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────
// hx-tree-item
// ─────────────────────────────────────────────────

describe('hx-tree-item', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders item row', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery(el, '.item-row');
      expect(row).toBeTruthy();
    });

    it('exposes role="treeitem" on the host-canonical surface', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      // Modern path: host internals.role. Legacy fallback path: inner
      // .item-row[role="treeitem"]. Either is correct; helper reads both.
      expect(readHostRole(el)).toBe('treeitem');
    });

    it('renders label slot content', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>My Label</hx-tree-item>');
      expect(el.textContent?.trim()).toContain('My Label');
    });

    it('does not render expand button without children', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const btn = shadowQuery(el, '.expand-btn');
      expect(btn).toBeNull();
    });

    it('renders placeholder when no children', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const placeholder = shadowQuery(el, '.expand-placeholder');
      expect(placeholder).toBeTruthy();
    });
  });

  // ─── Property: expanded ───

  describe('Property: expanded', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.expanded).toBe(false);
    });

    it('reflects expanded attribute to property', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item expanded>Label</hx-tree-item>');
      expect(el.expanded).toBe(true);
    });

    it('reflects expanded property to attribute', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      el.expanded = true;
      await el.updateComplete;
      expect(el.hasAttribute('expanded')).toBe(true);
    });

    it('children container has expanded class when expanded', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item expanded>Label</hx-tree-item>');
      await el.updateComplete;
      const children = shadowQuery(el, '.children');
      expect(children?.classList.contains('children--expanded')).toBe(true);
    });

    it('children container lacks expanded class when collapsed', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const children = shadowQuery(el, '.children');
      expect(children?.classList.contains('children--expanded')).toBe(false);
    });
  });

  // ─── Property: selected ───

  describe('Property: selected', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.selected).toBe(false);
    });

    it('reflects selected attribute to property', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item selected>Label</hx-tree-item>');
      expect(el.selected).toBe(true);
    });

    it('sets aria-selected on the host surface when inside selectable tree', async () => {
      const tree = await fixture<HxTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item selected>Label</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<HxTreeItem>('hx-tree-item')!;
      await item.updateComplete;
      expect(readHostAriaState(item, 'aria-selected')).toBe('true');
    });

    it('omits aria-selected when selection is "none"', async () => {
      const tree = await fixture<HxTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Label</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<HxTreeItem>('hx-tree-item')!;
      await item.updateComplete;
      expect(readHostAriaState(item, 'aria-selected')).toBeNull();
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to property', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
      expect(el.disabled).toBe(true);
    });

    it('sets aria-disabled="true" when disabled', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
      await el.updateComplete;
      expect(readHostAriaState(el, 'aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when not disabled', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      expect(readHostAriaState(el, 'aria-disabled')).toBeNull();
    });
  });

  // ─── ARIA: level, posinset, setsize ───

  describe('ARIA tree semantics', () => {
    it('sets aria-level="1" on top-level items', async () => {
      const tree = await fixture<HxTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item>Item</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<HxTreeItem>('hx-tree-item')!;
      await item.updateComplete;
      expect(readHostAriaState(item, 'aria-level')).toBe('1');
    });

    it('sets aria-level="2" on nested items', async () => {
      const tree = await fixture<HxTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const child = tree.querySelectorAll<HxTreeItem>('hx-tree-item')[1]!;
      await child.updateComplete;
      expect(readHostAriaState(child, 'aria-level')).toBe('2');
    });

    it('sets correct aria-posinset and aria-setsize for siblings', async () => {
      const tree = await fixture<HxTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item>First</hx-tree-item>
          <hx-tree-item>Second</hx-tree-item>
          <hx-tree-item>Third</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const items = Array.from(tree.querySelectorAll<HxTreeItem>('hx-tree-item'));
      for (const item of items) {
        await item.updateComplete;
      }

      expect(readHostAriaState(items[0]!, 'aria-posinset')).toBe('1');
      expect(readHostAriaState(items[0]!, 'aria-setsize')).toBe('3');

      expect(readHostAriaState(items[2]!, 'aria-posinset')).toBe('3');
      expect(readHostAriaState(items[2]!, 'aria-setsize')).toBe('3');
    });

    it('hasChildItems reflects child slot state', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      expect(el.hasChildItems).toBe(true);
    });

    it('hasChildItems is false without children', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Leaf</hx-tree-item>');
      await el.updateComplete;
      expect(el.hasChildItems).toBe(false);
    });
  });

  // ─── Children Slot ───

  describe('Children slot', () => {
    it('renders children slot', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      const childrenSlot = shadowQuery<HTMLSlotElement>(el, 'slot[name="children"]');
      expect(childrenSlot).toBeTruthy();
    });

    it('renders expand button when children are present', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      const btn = shadowQuery(el, '.expand-btn');
      expect(btn).toBeTruthy();
    });

    it('children container has role="group"', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const children = shadowQuery(el, '[role="group"]');
      expect(children).toBeTruthy();
    });

    it('collapsed children group has aria-hidden="true" to hide from assistive technology', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      expect(el.expanded).toBe(false);
      const group = shadowQuery(el, '[role="group"]');
      expect(group?.getAttribute('aria-hidden')).toBe('true');
    });

    it('expanded children group does not have aria-hidden', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item expanded>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      expect(el.expanded).toBe(true);
      const group = shadowQuery(el, '[role="group"]');
      expect(group?.getAttribute('aria-hidden')).toBeNull();
    });

    it('aria-hidden updates when item is expanded programmatically', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;
      const group = shadowQuery(el, '[role="group"]');
      expect(group?.getAttribute('aria-hidden')).toBe('true');

      el.expanded = true;
      await el.updateComplete;
      expect(group?.getAttribute('aria-hidden')).toBeNull();

      el.expanded = false;
      await el.updateComplete;
      expect(group?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "item" part', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="item"]');
      expect(part).toBeTruthy();
    });

    it('exposes "row" part on the interactive row', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="row"]');
      expect(part).toBeTruthy();
      // The row carries role="treeitem" only on the legacy fallback path;
      // on the modern path it is presentational and the role lives on the
      // host. Use the helper that reads whichever surface owns the role.
      expect(readHostRole(el)).toBe('treeitem');
    });

    it('exposes "label" part on the text content', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '.item-label[part~="label"]');
      expect(part).toBeTruthy();
    });

    it('exposes "children" part', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="children"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-tree-item-select on click', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.click();

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });

    it('does not dispatch hx-tree-item-select when disabled', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      let fired = false;
      el.addEventListener('hx-tree-item-select', () => {
        fired = true;
      });
      row.click();
      await el.updateComplete;

      expect(fired).toBe(false);
    });

    it('hx-tree-item-select is composed', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(document.body, 'hx-tree-item-select');
      row.click();

      const event = await eventPromise;
      expect(event.composed).toBe(true);
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard Navigation', () => {
    it('expands on ArrowRight when collapsed and has children', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;

      expect(el.expanded).toBe(false);
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(el.expanded).toBe(true);
    });

    it('collapses on ArrowLeft when expanded and has children', async () => {
      const el = await fixture<HxTreeItem>(
        `<hx-tree-item expanded>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      await el.updateComplete;

      expect(el.expanded).toBe(true);
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
      await el.updateComplete;

      expect(el.expanded).toBe(false);
    });

    it('dispatches hx-tree-item-select on Enter keydown', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });

    it('dispatches hx-tree-item-select on Space keydown', async () => {
      const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });
  });
});

// ─────────────────────────────────────────────────
// hx-tree-view — Dynamic Item Add / Remove
// ─────────────────────────────────────────────────

describe('hx-tree-view — Dynamic Item Add / Remove', () => {
  it('reflects newly appended top-level hx-tree-item in visible items', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Dynamic tree">
        <hx-tree-item>Item 1</hx-tree-item>
        <hx-tree-item>Item 2</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const newItem = document.createElement('hx-tree-item') as HxTreeItem;
    newItem.textContent = 'Item 3';
    el.appendChild(newItem);

    // Wait for slotchange + update
    await el.updateComplete;
    await newItem.updateComplete;

    const allItems = el.querySelectorAll('hx-tree-item');
    expect(allItems.length).toBe(3);
  });

  it('updates aria-setsize for siblings when a new item is appended', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Dynamic tree">
        <hx-tree-item>Item 1</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const newItem = document.createElement('hx-tree-item') as HxTreeItem;
    newItem.textContent = 'Item 2';
    el.appendChild(newItem);

    await el.updateComplete;
    await newItem.updateComplete;

    // Both items should now report setsize=2
    const items = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
    for (const item of items) {
      await item.updateComplete;
    }
    expect(readHostAriaState(items[0]!, 'aria-setsize')).toBe('2');
    expect(readHostAriaState(items[1]!, 'aria-setsize')).toBe('2');
  });

  it('single-mode selection remains stable after removing items', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Dynamic tree" selection="single">
        <hx-tree-item>Item 1</hx-tree-item>
        <hx-tree-item>Item 2</hx-tree-item>
        <hx-tree-item>Item 3</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    // Select item 1
    const [item1, , item3] = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));
    item1!.dispatchEvent(
      new CustomEvent('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item: item1 },
      }),
    );
    await el.updateComplete;
    expect(item1!.selected).toBe(true);

    // Remove item3 — selection on item1 should not change
    el.removeChild(item3!);
    await el.updateComplete;

    expect(item1!.selected).toBe(true);
    const remaining = el.querySelectorAll('hx-tree-item');
    expect(remaining.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────
// hx-tree-view — Deep nesting, hx-select event detail, lazy load pattern
// ─────────────────────────────────────────────────

describe('hx-tree-view — Deep nesting and expand/collapse', () => {
  it('deeply nested item expand/collapse cycle works without error', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Deep tree" selection="single">
        <hx-tree-item>
          Level 1
          <hx-tree-item slot="children">
            Level 2
            <hx-tree-item slot="children">Level 3 A</hx-tree-item>
            <hx-tree-item slot="children">Level 3 B</hx-tree-item>
          </hx-tree-item>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const l1 = el.querySelector<HxTreeItem>('hx-tree-view > hx-tree-item')!;
    const l2 = l1.querySelector<HxTreeItem>('[slot="children"] > hx-tree-item, hx-tree-item')!;

    // Expand level 1
    l1.expanded = true;
    await el.updateComplete;
    expect(l1.expanded).toBe(true);

    // Expand level 2
    l2.expanded = true;
    await el.updateComplete;
    expect(l2.expanded).toBe(true);

    // Collapse level 1 — subtree should close
    l1.expanded = false;
    await el.updateComplete;
    expect(l1.expanded).toBe(false);
  });

  it('hx-select event detail contains item and selected=true on selection', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Select test" selection="single">
        <hx-tree-item>Leaf A</hx-tree-item>
        <hx-tree-item>Leaf B</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const item = el.querySelector<HxTreeItem>('hx-tree-item')!;
    const eventPromise = oneEvent<CustomEvent<{ item: HxTreeItem; selected: boolean }>>(
      el,
      'hx-select',
    );

    item.dispatchEvent(
      new CustomEvent('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    );

    const event = await eventPromise;
    expect(event.detail.item).toBe(item);
    expect(event.detail.selected).toBe(true);
  });

  it('hx-select event detail has selected=false when deselecting in multiple mode', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Multi test" selection="multiple">
        <hx-tree-item>Item X</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const item = el.querySelector<HxTreeItem>('hx-tree-item')!;

    // First select
    item.dispatchEvent(
      new CustomEvent('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    );
    await el.updateComplete;
    expect(item.selected).toBe(true);

    // Second dispatch = deselect
    const deselectPromise = oneEvent<CustomEvent<{ item: HxTreeItem; selected: boolean }>>(
      el,
      'hx-select',
    );
    item.dispatchEvent(
      new CustomEvent('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    );
    const deselect = await deselectPromise;
    expect(deselect.detail.selected).toBe(false);
    expect(item.selected).toBe(false);
  });

  it('lazy load pattern: appending children to an expanded item reveals them', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Lazy" selection="single">
        <hx-tree-item expanded>Parent</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const parent = el.querySelector<HxTreeItem>('hx-tree-item')!;
    expect(parent.expanded).toBe(true);

    // Lazy-append a child
    const child = document.createElement('hx-tree-item') as HxTreeItem;
    child.setAttribute('slot', 'children');
    child.textContent = 'Lazy child';
    parent.appendChild(child);

    await el.updateComplete;
    await child.updateComplete;

    const children = parent.querySelectorAll('[slot="children"]');
    expect(children.length).toBe(1);
  });

  it('querySelectorAll hx-tree-item[selected] returns all selected items in multiple mode', async () => {
    const el = await fixture<HxTreeView>(
      `<hx-tree-view label="Multi select" selection="multiple">
        <hx-tree-item>Item 1</hx-tree-item>
        <hx-tree-item>Item 2</hx-tree-item>
        <hx-tree-item>Item 3</hx-tree-item>
      </hx-tree-view>`,
    );
    await el.updateComplete;

    const [i1, i2] = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item'));

    [i1!, i2!].forEach((item) => {
      item.dispatchEvent(
        new CustomEvent('hx-tree-item-select', {
          bubbles: true,
          composed: true,
          detail: { item },
        }),
      );
    });
    await el.updateComplete;

    const selected = Array.from(el.querySelectorAll<HxTreeItem>('hx-tree-item[selected]'));
    expect(selected.length).toBe(2);
    expect(selected).toContain(i1);
    expect(selected).toContain(i2);
  });
});

// ─────────────────────────────────────────────────────────────
// Group 5c — host-canonical ARIA migration tests
//
// hx-tree-view + hx-tree-item live behind ElementInternals: the host
// carries role + aria-* on the modern path, the inner [role="..."]
// element does so on the legacy fallback path. Both paths must stay
// observable to AT, and the migration must not regress either side.
// ─────────────────────────────────────────────────────────────

type HelixTreeViewCtor = typeof HelixTreeView & {
  __testSupportsIdrefRefsOverride: boolean | null;
};
type HelixTreeItemCtor = typeof HelixTreeItem & {
  __testSupportsIdrefRefsOverride: boolean | null;
};

describe('hx-tree-view host-canonical role + label (modern path)', () => {
  it('writes role="tree" onto host internals on the modern path', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    try {
      const el = await fixture<HxTreeView>('<hx-tree-view label="Files"></hx-tree-view>');
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('tree');
      // Modern path: inner div is roleless so AT does not see two trees.
      const inner = el.shadowRoot?.querySelector('.tree');
      expect(inner?.getAttribute('role')).toBeNull();
    } finally {
      ctor.__testSupportsIdrefRefsOverride = null;
    }
  });

  it('writes ariaLabel onto host internals on the modern path', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    try {
      const el = await fixture<HxTreeView>('<hx-tree-view label="Files"></hx-tree-view>');
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Files');
    } finally {
      ctor.__testSupportsIdrefRefsOverride = null;
    }
  });

  it('host aria-label takes precedence over the label property', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    try {
      const el = await fixture<HxTreeView>(
        '<hx-tree-view label="ignored" aria-label="Picked"></hx-tree-view>',
      );
      await el.updateComplete;
      expect(readHostAriaLabel(el)).toBe('Picked');
    } finally {
      ctor.__testSupportsIdrefRefsOverride = null;
    }
  });

  it('AccName 1.2 §4.3.1: aria-labelledby beats aria-label on the modern path', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    try {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<span id="tree-modern-lbl">Recent files</span>',
      );
      const el = await fixture<HxTreeView>(
        '<hx-tree-view aria-label="Ignored" aria-labelledby="tree-modern-lbl"></hx-tree-view>',
      );
      await el.updateComplete;
      const internals = (el as unknown as {
        _internals: ElementInternals & { ariaLabelledByElements?: Element[] | null };
      })._internals;
      // Modern path uses ariaLabelledByElements; ariaLabel is cleared so a
      // stale string never shadows the resolved refs.
      expect(internals.ariaLabel ?? '').toBe('');
      expect(internals.ariaLabelledByElements?.length).toBe(1);
      document.getElementById('tree-modern-lbl')?.remove();
    } finally {
      ctor.__testSupportsIdrefRefsOverride = null;
    }
  });

  it('writes ariaMultiSelectable onto host internals (selection="multiple")', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    try {
      const el = await fixture<HxTreeView>(
        '<hx-tree-view label="Multi" selection="multiple"></hx-tree-view>',
      );
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaMultiSelectable).toBe('true');
    } finally {
      ctor.__testSupportsIdrefRefsOverride = null;
    }
  });
});

describe('hx-tree-view fallback path (legacy, no IDL element refs)', () => {
  afterEach(() => {
    const ctor = customElements.get('hx-tree-view') as unknown as
      | HelixTreeViewCtor
      | undefined;
    if (ctor) ctor.__testSupportsIdrefRefsOverride = null;
  });

  it('suppresses host role and writes role="tree" onto the inner element', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeView>('<hx-tree-view label="Files"></hx-tree-view>');
    await el.updateComplete;
    const internals = (el as unknown as { _internals: ElementInternals })._internals;
    // Suppress host role on fallback so AT only sees ONE tree.
    expect(internals.role).toBeNull();
    const inner = el.shadowRoot?.querySelector('[role="tree"]');
    expect(inner).toBeTruthy();
  });

  it('mirrors host aria-label onto the inner [role="tree"]', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeView>('<hx-tree-view aria-label="Picked"></hx-tree-view>');
    await el.updateComplete;
    const inner = el.shadowRoot?.querySelector('[role="tree"]') as HTMLElement;
    expect(inner.getAttribute('aria-label')).toBe('Picked');
  });

  it('mirrors flattened aria-labelledby onto the inner [role="tree"]', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<span id="tree-fallback-lbl">My files</span>',
    );
    const el = await fixture<HxTreeView>(
      '<hx-tree-view aria-labelledby="tree-fallback-lbl"></hx-tree-view>',
    );
    await el.updateComplete;
    const inner = el.shadowRoot?.querySelector('[role="tree"]') as HTMLElement;
    expect(inner.getAttribute('aria-label')).toBe('My files');
    document.getElementById('tree-fallback-lbl')?.remove();
  });

  it('mirrors aria-multiselectable onto the inner [role="tree"]', async () => {
    const ctor = customElements.get('hx-tree-view') as unknown as HelixTreeViewCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeView>(
      '<hx-tree-view label="x" selection="multiple"></hx-tree-view>',
    );
    await el.updateComplete;
    const inner = el.shadowRoot?.querySelector('[role="tree"]') as HTMLElement;
    expect(inner.getAttribute('aria-multiselectable')).toBe('true');
  });
});

describe('hx-tree-item host-canonical role + state (modern path)', () => {
  afterEach(() => {
    const ctor = customElements.get('hx-tree-item') as unknown as
      | HelixTreeItemCtor
      | undefined;
    if (ctor) ctor.__testSupportsIdrefRefsOverride = null;
  });

  it('writes role="treeitem" onto host internals; inner is presentational', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
    await el.updateComplete;
    const internals = (el as unknown as { _internals: ElementInternals })._internals;
    expect(internals.role).toBe('treeitem');
    const inner = el.shadowRoot?.querySelector('.item-row');
    // Modern path: inner row carries no role so AT does not see two
    // treeitems for one logical option.
    expect(inner?.getAttribute('role')).toBeNull();
  });

  it('mirrors aria-expanded / aria-selected / aria-disabled onto host internals', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x" selection="single">
        <hx-tree-item expanded selected disabled>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const item = tree.querySelector<HxTreeItem>('hx-tree-item')!;
    await item.updateComplete;
    const internals = (item as unknown as { _internals: ElementInternals })._internals;
    expect(internals.ariaExpanded).toBe('true');
    expect(internals.ariaSelected).toBe('true');
    expect(internals.ariaDisabled).toBe('true');
    expect(internals.ariaLevel).toBe('1');
    expect(internals.ariaPosInSet).toBe('1');
    expect(internals.ariaSetSize).toBe('1');
  });

  it('host carries the roving tabindex on the modern path', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = true;
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x">
        <hx-tree-item>A</hx-tree-item>
        <hx-tree-item>B</hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const items = Array.from(tree.querySelectorAll<HxTreeItem>('hx-tree-item'));
    for (const i of items) await i.updateComplete;
    expect(items[0]!.tabIndex).toBe(0);
    expect(items[1]!.tabIndex).toBe(-1);
  });
});

describe('hx-tree-item fallback path (legacy)', () => {
  afterEach(() => {
    const ctor = customElements.get('hx-tree-item') as unknown as
      | HelixTreeItemCtor
      | undefined;
    if (ctor) ctor.__testSupportsIdrefRefsOverride = null;
  });

  it('suppresses host role; inner .item-row carries role="treeitem"', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
    await el.updateComplete;
    const internals = (el as unknown as { _internals: ElementInternals })._internals;
    expect(internals.role).toBeNull();
    const inner = el.shadowRoot?.querySelector('.item-row');
    expect(inner?.getAttribute('role')).toBe('treeitem');
  });

  it('host.tabIndex stays -1; inner .item-row carries the roving tabindex', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x">
        <hx-tree-item>A</hx-tree-item>
        <hx-tree-item>B</hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const items = Array.from(tree.querySelectorAll<HxTreeItem>('hx-tree-item'));
    for (const i of items) await i.updateComplete;

    // Host MUST stay out of the tab order on the fallback path so the
    // inner element is the SINGLE focusable surface per item.
    expect(items[0]!.tabIndex).toBe(-1);
    expect(items[1]!.tabIndex).toBe(-1);

    const inner0 = shadowQuery<HTMLElement>(items[0]!, '.item-row')!;
    const inner1 = shadowQuery<HTMLElement>(items[1]!, '.item-row')!;
    expect(inner0.getAttribute('tabindex')).toBe('0');
    expect(inner1.getAttribute('tabindex')).toBe('-1');
  });

  it('mirrors host aria-label onto inner [role="treeitem"]', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeItem>(
      '<hx-tree-item aria-label="Custom name">Label</hx-tree-item>',
    );
    await el.updateComplete;
    const inner = el.shadowRoot?.querySelector('.item-row[role="treeitem"]') as HTMLElement;
    expect(inner.getAttribute('aria-label')).toBe('Custom name');
  });

  it('leaves inner element unnamed when no host override is set (slotted text wins)', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const el = await fixture<HxTreeItem>('<hx-tree-item>Label</hx-tree-item>');
    await el.updateComplete;
    const inner = el.shadowRoot?.querySelector('.item-row[role="treeitem"]') as HTMLElement;
    expect(inner.hasAttribute('aria-label')).toBe(false);
  });

  it('mirrors aria-expanded / aria-selected onto inner element', async () => {
    const ctor = customElements.get('hx-tree-item') as unknown as HelixTreeItemCtor;
    ctor.__testSupportsIdrefRefsOverride = false;
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x" selection="single">
        <hx-tree-item expanded selected>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const item = tree.querySelector<HxTreeItem>('hx-tree-item')!;
    await item.updateComplete;
    const inner = item.shadowRoot?.querySelector('.item-row[role="treeitem"]') as HTMLElement;
    expect(inner.getAttribute('aria-expanded')).toBe('true');
    expect(inner.getAttribute('aria-selected')).toBe('true');
  });
});

// ─────────────────────────────────────────────────────────────
// Composed-tree origin guards (round-1 lift from hx-menu round-5/7).
// Nested trees and nested items must not steal each other's events.
// ─────────────────────────────────────────────────────────────

describe('hx-tree-item nested-bubble guards', () => {
  it('clicking a CHILD does not double-activate the PARENT', async () => {
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x" selection="multiple">
        <hx-tree-item expanded>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const [parent, child] = Array.from(tree.querySelectorAll<HxTreeItem>('hx-tree-item'));
    await parent!.updateComplete;
    await child!.updateComplete;

    const events: HxTreeItem[] = [];
    tree.addEventListener('hx-tree-item-select', (e) => {
      events.push((e as CustomEvent<{ item: HxTreeItem }>).detail.item);
    });

    const childRow = shadowQuery<HTMLElement>(child!, '.item-row')!;
    childRow.click();
    await tree.updateComplete;

    // Exactly one select fired and it was the child.
    expect(events.length).toBe(1);
    expect(events[0]).toBe(child);
  });

  it('Enter on a CHILD does not also fire on the PARENT', async () => {
    const tree = await fixture<HxTreeView>(
      `<hx-tree-view label="x" selection="multiple">
        <hx-tree-item expanded>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await tree.updateComplete;
    const [parent, child] = Array.from(tree.querySelectorAll<HxTreeItem>('hx-tree-item'));
    await parent!.updateComplete;
    await child!.updateComplete;

    const firedOn: HxTreeItem[] = [];
    tree.addEventListener('hx-tree-item-select', (e) => {
      firedOn.push((e as CustomEvent<{ item: HxTreeItem }>).detail.item);
    });

    const childRow = shadowQuery<HTMLElement>(child!, '.item-row')!;
    childRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await tree.updateComplete;

    expect(firedOn.length).toBe(1);
    expect(firedOn[0]).toBe(child);
  });
});

describe('hx-tree-view nested-tree guards', () => {
  it('inner tree handles selects without the outer tree double-firing', async () => {
    // A second tree-view nested inside the first via slotting. Both trees
    // listen at host level, so without the closest-tree origin guard the
    // outer tree would treat the inner select as its own.
    const outer = await fixture<HxTreeView>(
      `<hx-tree-view label="outer" selection="multiple">
        <hx-tree-item>
          Outer item with embedded tree
          <hx-tree-view slot="children" label="inner" selection="multiple">
            <hx-tree-item>Inner A</hx-tree-item>
          </hx-tree-view>
        </hx-tree-item>
      </hx-tree-view>`,
    );
    await outer.updateComplete;
    const inner = outer.querySelector<HxTreeView>('hx-tree-view[label="inner"]')!;
    await inner.updateComplete;

    let outerSelects = 0;
    let innerSelects = 0;
    outer.addEventListener(
      'hx-select',
      (e) => {
        if ((e as CustomEvent).target === outer) outerSelects++;
        else innerSelects++;
      },
    );

    const innerItem = inner.querySelector<HxTreeItem>('hx-tree-item')!;
    await innerItem.updateComplete;
    const innerRow = shadowQuery<HTMLElement>(innerItem, '.item-row')!;
    innerRow.click();
    await outer.updateComplete;

    // The inner tree handled the select; the outer tree's host listener
    // ignored the bubbled event because it is not the closest enclosing
    // tree of the dispatching item.
    expect(innerSelects).toBeGreaterThanOrEqual(1);
    expect(outerSelects).toBe(0);
  });
});
