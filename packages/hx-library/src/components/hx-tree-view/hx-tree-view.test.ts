import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcTreeView } from './hx-tree-view.js';
import type { WcTreeItem } from './hx-tree-item.js';
import './index.js';

afterEach(cleanup);

// ─────────────────────────────────────────────────
// hx-tree-view
// ─────────────────────────────────────────────────

describe('hx-tree-view', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders tree container with role="tree"', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree).toBeTruthy();
      expect(tree?.getAttribute('role')).toBe('tree');
    });

    it('tree container has tabindex="0" for keyboard access', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree?.getAttribute('tabindex')).toBe('0');
    });

    it('sets aria-multiselectable="false" by default', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree?.getAttribute('aria-multiselectable')).toBe('false');
    });

    it('sets aria-multiselectable="true" in multiple selection mode', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view selection="multiple"></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree?.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  // ─── Property: selection ───

  describe('Property: selection', () => {
    it('defaults to "none"', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.selection).toBe('none');
    });

    it('reflects selection attribute to property', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view selection="single"></hx-tree-view>');
      expect(el.selection).toBe('single');
    });

    it('reflects "multiple" selection', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view selection="multiple"></hx-tree-view>');
      expect(el.selection).toBe('multiple');
    });
  });

  // ─── Selection Behavior ───

  describe('Selection behavior', () => {
    it('does not select items when selection is "none"', async () => {
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<WcTreeItem>('hx-tree-item')!;
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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<WcTreeItem>('hx-tree-item'));

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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item selected>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<WcTreeItem>('hx-tree-item'));
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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="multiple">
          <hx-tree-item>Item 1</hx-tree-item>
          <hx-tree-item>Item 2</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const [item1, item2] = Array.from(el.querySelectorAll<WcTreeItem>('hx-tree-item'));

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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<WcTreeItem>('hx-tree-item')!;
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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<WcTreeItem>('hx-tree-item')!;
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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<WcTreeItem>('hx-tree-item')!;
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
      const el = await fixture<WcTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Item 1</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;

      const item = el.querySelector<WcTreeItem>('hx-tree-item')!;
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
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      expect(el.label).toBe('');
    });

    it('reflects label attribute to property', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view label="File browser"></hx-tree-view>');
      expect(el.label).toBe('File browser');
    });

    it('sets aria-label on the tree container', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view label="File browser"></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree?.getAttribute('aria-label')).toBe('File browser');
    });

    it('does not set aria-label when label is empty', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '.tree');
      expect(tree?.getAttribute('aria-label')).toBeNull();
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "tree" part on the container', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const part = shadowQuery(el, '[part~="tree"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has role="tree" on the container', async () => {
      const el = await fixture<WcTreeView>('<hx-tree-view></hx-tree-view>');
      const tree = shadowQuery(el, '[role="tree"]');
      expect(tree).toBeTruthy();
    });

    it('has no axe violations with labeled tree', async () => {
      const el = await fixture<WcTreeView>(
        `<hx-tree-view label="Test tree" selection="single">
          <hx-tree-item>Label</hx-tree-item>
          <hx-tree-item selected>Selected</hx-tree-item>
          <hx-tree-item disabled>Disabled</hx-tree-item>
        </hx-tree-view>`,
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });

    it('has no axe violations with nested items', async () => {
      const el = await fixture<WcTreeView>(
        `<hx-tree-view label="Nested tree" selection="single">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child 1</hx-tree-item>
            <hx-tree-item slot="children">Child 2</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      // Allow microtask queue to flush and Lit reactive updates to complete before axe audit
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
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
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders item row', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery(el, '.item-row');
      expect(row).toBeTruthy();
    });

    it('renders item-row with role="treeitem"', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery(el, '.item-row');
      expect(row?.getAttribute('role')).toBe('treeitem');
    });

    it('renders label slot content', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>My Label</hx-tree-item>');
      expect(el.textContent?.trim()).toContain('My Label');
    });

    it('does not render expand button without children', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const btn = shadowQuery(el, '.expand-btn');
      expect(btn).toBeNull();
    });

    it('renders placeholder when no children', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const placeholder = shadowQuery(el, '.expand-placeholder');
      expect(placeholder).toBeTruthy();
    });
  });

  // ─── Property: expanded ───

  describe('Property: expanded', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.expanded).toBe(false);
    });

    it('reflects expanded attribute to property', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item expanded>Label</hx-tree-item>');
      expect(el.expanded).toBe(true);
    });

    it('reflects expanded property to attribute', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      el.expanded = true;
      await el.updateComplete;
      expect(el.hasAttribute('expanded')).toBe(true);
    });

    it('children container has expanded class when expanded', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item expanded>Label</hx-tree-item>');
      await el.updateComplete;
      const children = shadowQuery(el, '.children');
      expect(children?.classList.contains('children--expanded')).toBe(true);
    });

    it('children container lacks expanded class when collapsed', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      await el.updateComplete;
      const children = shadowQuery(el, '.children');
      expect(children?.classList.contains('children--expanded')).toBe(false);
    });
  });

  // ─── Property: selected ───

  describe('Property: selected', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.selected).toBe(false);
    });

    it('reflects selected attribute to property', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item selected>Label</hx-tree-item>');
      expect(el.selected).toBe(true);
    });

    it('sets aria-selected on item row when inside selectable tree', async () => {
      const tree = await fixture<WcTreeView>(
        `<hx-tree-view selection="single">
          <hx-tree-item selected>Label</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<WcTreeItem>('hx-tree-item')!;
      const row = shadowQuery(item, '.item-row');
      expect(row?.getAttribute('aria-selected')).toBe('true');
    });

    it('omits aria-selected when selection is "none"', async () => {
      const tree = await fixture<WcTreeView>(
        `<hx-tree-view selection="none">
          <hx-tree-item>Label</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<WcTreeItem>('hx-tree-item')!;
      const row = shadowQuery(item, '.item-row');
      expect(row?.getAttribute('aria-selected')).toBeNull();
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to property', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
      expect(el.disabled).toBe(true);
    });

    it('sets aria-disabled="true" when disabled', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
      const row = shadowQuery(el, '.item-row');
      expect(row?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when not disabled', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery(el, '.item-row');
      expect(row?.getAttribute('aria-disabled')).toBeNull();
    });
  });

  // ─── ARIA: level, posinset, setsize ───

  describe('ARIA tree semantics', () => {
    it('sets aria-level="1" on top-level items', async () => {
      const tree = await fixture<WcTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item>Item</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const item = tree.querySelector<WcTreeItem>('hx-tree-item')!;
      const row = shadowQuery(item, '.item-row');
      expect(row?.getAttribute('aria-level')).toBe('1');
    });

    it('sets aria-level="2" on nested items', async () => {
      const tree = await fixture<WcTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item expanded>
            Parent
            <hx-tree-item slot="children">Child</hx-tree-item>
          </hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const child = tree.querySelectorAll<WcTreeItem>('hx-tree-item')[1]!;
      const row = shadowQuery(child, '.item-row');
      expect(row?.getAttribute('aria-level')).toBe('2');
    });

    it('sets correct aria-posinset and aria-setsize for siblings', async () => {
      const tree = await fixture<WcTreeView>(
        `<hx-tree-view label="Test">
          <hx-tree-item>First</hx-tree-item>
          <hx-tree-item>Second</hx-tree-item>
          <hx-tree-item>Third</hx-tree-item>
        </hx-tree-view>`,
      );
      await tree.updateComplete;
      const items = Array.from(tree.querySelectorAll<WcTreeItem>('hx-tree-item'));

      const row0 = shadowQuery(items[0]!, '.item-row');
      expect(row0?.getAttribute('aria-posinset')).toBe('1');
      expect(row0?.getAttribute('aria-setsize')).toBe('3');

      const row2 = shadowQuery(items[2]!, '.item-row');
      expect(row2?.getAttribute('aria-posinset')).toBe('3');
      expect(row2?.getAttribute('aria-setsize')).toBe('3');
    });

    it('hasChildItems reflects child slot state', async () => {
      const el = await fixture<WcTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      // Yield to event loop to allow slotchange callback to run so hasChildItems is updated
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      expect(el.hasChildItems).toBe(true);
    });

    it('hasChildItems is false without children', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Leaf</hx-tree-item>');
      await el.updateComplete;
      expect(el.hasChildItems).toBe(false);
    });
  });

  // ─── Children Slot ───

  describe('Children slot', () => {
    it('renders children slot', async () => {
      const el = await fixture<WcTreeItem>(
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
      const el = await fixture<WcTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      // Yield to event loop to allow slotchange callback to run so the expand button is rendered
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const btn = shadowQuery(el, '.expand-btn');
      expect(btn).toBeTruthy();
    });

    it('children container has role="group"', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const children = shadowQuery(el, '[role="group"]');
      expect(children).toBeTruthy();
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "item" part', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="item"]');
      expect(part).toBeTruthy();
    });

    it('exposes "row" part on the interactive row', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="row"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('role')).toBe('treeitem');
    });

    it('exposes "label" part on the text content', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '.item-label[part~="label"]');
      expect(part).toBeTruthy();
    });

    it('exposes "children" part', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const part = shadowQuery(el, '[part~="children"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-tree-item-select on click', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.click();

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });

    it('does not dispatch hx-tree-item-select when disabled', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item disabled>Label</hx-tree-item>');
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
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
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
      const el = await fixture<WcTreeItem>(
        `<hx-tree-item>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      // Yield to event loop to allow slotchange callback to run so children are registered before key dispatch
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      expect(el.expanded).toBe(false);
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(el.expanded).toBe(true);
    });

    it('collapses on ArrowLeft when expanded and has children', async () => {
      const el = await fixture<WcTreeItem>(
        `<hx-tree-item expanded>
          Parent
          <hx-tree-item slot="children">Child</hx-tree-item>
        </hx-tree-item>`,
      );
      // Yield to event loop to allow slotchange callback to run so children are registered before key dispatch
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      expect(el.expanded).toBe(true);
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;

      expect(el.expanded).toBe(false);
    });

    it('dispatches hx-tree-item-select on Enter keydown', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });

    it('dispatches hx-tree-item-select on Space keydown', async () => {
      const el = await fixture<WcTreeItem>('<hx-tree-item>Label</hx-tree-item>');
      const row = shadowQuery<HTMLElement>(el, '.item-row')!;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tree-item-select');
      row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      const event = await eventPromise;
      expect(event.detail.item).toBe(el);
    });
  });
});
