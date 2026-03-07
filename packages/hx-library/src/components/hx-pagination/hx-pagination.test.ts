import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, oneEvent } from '../../test-utils.js';
import type { HelixPagination } from './hx-pagination.js';
import './index.js';

afterEach(cleanup);

describe('hx-pagination', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <nav> element with part="nav"', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const nav = shadowQuery(el, 'nav');
      expect(nav).toBeTruthy();
      expect(nav?.getAttribute('part')).toBe('nav');
    });

    it('sets aria-label on nav', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" label="Page navigation"></hx-pagination>',
      );
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Page navigation');
    });

    it('defaults aria-label to "Pagination"', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Pagination');
    });

    it('renders a list with part="list"', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const list = shadowQuery(el, '[part="list"]');
      expect(list).toBeTruthy();
    });

    it('adds role="list" to the <ul> for Safari VoiceOver compatibility', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const list = shadowQuery(el, 'ul');
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('marks current page button with aria-current="page"', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const buttons = el.shadowRoot!.querySelectorAll('button[aria-current="page"]');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent?.trim()).toBe('3');
    });
  });

  // ─── Previous/Next ───

  describe('Previous / Next navigation', () => {
    it('disables previous button on first page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('disables next button on last page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="5"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('enables previous button when not on first page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('enables next button when not on last page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });
  });

  // ─── First/Last buttons ───

  describe('First / Last buttons', () => {
    it('does not show first/last buttons by default', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="10" current-page="5"></hx-pagination>',
      );
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]');
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]');
      expect(firstBtn).toBeNull();
      expect(lastBtn).toBeNull();
    });

    it('shows first/last buttons when show-first-last is set', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="10" current-page="5" show-first-last></hx-pagination>',
      );
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]');
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]');
      expect(firstBtn).toBeTruthy();
      expect(lastBtn).toBeTruthy();
    });

    it('disables first button on first page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" show-first-last></hx-pagination>',
      );
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]') as HTMLButtonElement;
      expect(firstBtn.disabled).toBe(true);
    });

    it('disables last button on last page', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="5" show-first-last></hx-pagination>',
      );
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]') as HTMLButtonElement;
      expect(lastBtn.disabled).toBe(true);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('fires hx-page-change with correct page on next click', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="2"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(nextBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(3);
    });

    it('fires hx-page-change with correct page on prev click', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(prevBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(2);
    });

    it('fires hx-page-change when clicking a page number', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const pageBtn = shadowQuery(el, 'button[aria-label="Page 3"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(pageBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(3);
    });

    it('does not fire hx-page-change when clicking current page button', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      let fired = false;
      el.addEventListener('hx-page-change', () => {
        fired = true;
      });
      const currentPageBtn = shadowQuery(el, 'button[aria-current="page"]') as HTMLButtonElement;
      currentPageBtn.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('hx-page-change event has bubbles=true and composed=true', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="2"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(nextBtn.click()),
      ]);
      expect((event as CustomEvent).bubbles).toBe(true);
      expect((event as CustomEvent).composed).toBe(true);
    });
  });

  // ─── Page Size ───

  describe('Page Size', () => {
    it('does not show page-size selector by default', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const select = el.shadowRoot!.querySelector('select');
      expect(select).toBeNull();
    });

    it('shows page-size selector when show-page-size is set', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" show-page-size page-size="25"></hx-pagination>',
      );
      const select = el.shadowRoot!.querySelector('select');
      expect(select).toBeTruthy();
    });

    it('reflects page-size attribute to pageSize property', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" page-size="50"></hx-pagination>',
      );
      expect(el.pageSize).toBe(50);
    });

    it('fires hx-page-size-change when page size changes', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" show-page-size page-size="25"></hx-pagination>',
      );
      const select = el.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-size-change'),
        Promise.resolve(() => {
          select.value = '50';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        })(),
      ]);
      expect((event as CustomEvent<{ pageSize: number }>).detail.pageSize).toBe(50);
    });

    it('hx-page-size-change event has bubbles=true and composed=true', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" show-page-size page-size="25"></hx-pagination>',
      );
      const select = el.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-size-change'),
        Promise.resolve(() => {
          select.value = '10';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        })(),
      ]);
      expect((event as CustomEvent).bubbles).toBe(true);
      expect((event as CustomEvent).composed).toBe(true);
    });

    it('updates pageSize property when select changes', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1" show-page-size page-size="25"></hx-pagination>',
      );
      const select = el.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
      select.value = '100';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.pageSize).toBe(100);
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "nav" part', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      expect(shadowQuery(el, '[part="nav"]')).toBeTruthy();
    });

    it('exposes "list" part', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      expect(shadowQuery(el, '[part="list"]')).toBeTruthy();
    });

    it('exposes "item" parts', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const items = el.shadowRoot!.querySelectorAll('[part="item"]');
      expect(items.length).toBeGreaterThan(0);
    });

    it('exposes "button" parts', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="1"></hx-pagination>',
      );
      const buttons = el.shadowRoot!.querySelectorAll('[part="button"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('exposes "ellipsis" part on many pages', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10"></hx-pagination>',
      );
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  // ─── Ellipsis ───

  describe('Ellipsis', () => {
    it('shows ellipsis when pages exceed visible range', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10"></hx-pagination>',
      );
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show ellipsis when all pages fit', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="3" current-page="2"></hx-pagination>',
      );
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBe(0);
    });
  });

  // ─── Properties ───

  describe('Properties', () => {
    it('reflects current-page attribute', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="10" current-page="4"></hx-pagination>',
      );
      expect(el.currentPage).toBe(4);
    });

    it('reflects total-pages attribute', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="10" current-page="1"></hx-pagination>',
      );
      expect(el.totalPages).toBe(10);
    });

    it('updates currentPage property after navigation', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="2"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      nextBtn.click();
      await el.updateComplete;
      expect(el.currentPage).toBe(3);
    });

    it('sibling-count=2 expands visible page range', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10" sibling-count="2"></hx-pagination>',
      );
      // With siblingCount=2, pages 8-12 should all be visible (current ± 2)
      const btn8 = shadowQuery(el, 'button[aria-label="Page 8"]');
      const btn12 = shadowQuery(el, 'button[aria-label="Page 12"]');
      expect(btn8).toBeTruthy();
      expect(btn12).toBeTruthy();
    });

    it('sibling-count=1 shows fewer surrounding pages than sibling-count=2', async () => {
      const el1 = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10" sibling-count="1"></hx-pagination>',
      );
      const el2 = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10" sibling-count="2"></hx-pagination>',
      );
      const buttons1 = el1.shadowRoot!.querySelectorAll('button[aria-label^="Page "]').length;
      const buttons2 = el2.shadowRoot!.querySelectorAll('button[aria-label^="Page "]').length;
      expect(buttons2).toBeGreaterThan(buttons1);
    });

    it('boundary-count=2 shows two boundary pages at each end', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="20" current-page="10" boundary-count="2"></hx-pagination>',
      );
      const btn1 = shadowQuery(el, 'button[aria-label="Page 1"]');
      const btn2 = shadowQuery(el, 'button[aria-label="Page 2"]');
      const btn19 = shadowQuery(el, 'button[aria-label="Page 19"]');
      const btn20 = shadowQuery(el, 'button[aria-label="Page 20"]');
      expect(btn1).toBeTruthy();
      expect(btn2).toBeTruthy();
      expect(btn19).toBeTruthy();
      expect(btn20).toBeTruthy();
    });
  });

  // ─── Keyboard Navigation (Roving Tabindex) ───

  describe('Keyboard Navigation', () => {
    it('current page button has tabindex=0 by default', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const currentBtn = shadowQuery(el, 'button[aria-current="page"]') as HTMLButtonElement;
      expect(currentBtn.getAttribute('tabindex')).toBe('0');
    });

    it('non-active buttons have tabindex=-1 by default', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(prevBtn.getAttribute('tabindex')).toBe('-1');
    });

    it('moves focus right with ArrowRight key', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const list = el.shadowRoot!.querySelector('.list')!;
      const buttons = Array.from(
        el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      const currentIdx = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Page 3');
      buttons[currentIdx].focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBe(buttons[currentIdx + 1]);
    });

    it('moves focus left with ArrowLeft key', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const list = el.shadowRoot!.querySelector('.list')!;
      const buttons = Array.from(
        el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      const currentIdx = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Page 3');
      buttons[currentIdx].focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBe(buttons[currentIdx - 1]);
    });

    it('does not move past the first button with ArrowLeft', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="2"></hx-pagination>',
      );
      const list = el.shadowRoot!.querySelector('.list')!;
      const buttons = Array.from(
        el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      buttons[0].focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBe(buttons[0]);
    });

    it('does not move past the last button with ArrowRight', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="2"></hx-pagination>',
      );
      const list = el.shadowRoot!.querySelector('.list')!;
      const buttons = Array.from(
        el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      const last = buttons[buttons.length - 1];
      last.focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBe(last);
    });

    it('ignores non-arrow keys', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="3"></hx-pagination>',
      );
      const list = el.shadowRoot!.querySelector('.list')!;
      const buttons = Array.from(
        el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      const currentIdx = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Page 3');
      buttons[currentIdx].focus();
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBe(buttons[currentIdx]);
    });
  });

  // ─── Edge Cases ───

  describe('Edge Cases', () => {
    it('renders safely when totalPages=0', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="0" current-page="1"></hx-pagination>',
      );
      expect(el.shadowRoot!.querySelector('nav')).toBeTruthy();
    });

    it('renders safely with negative currentPage', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="-1"></hx-pagination>',
      );
      expect(el.shadowRoot!.querySelector('nav')).toBeTruthy();
    });

    it('renders safely when currentPage exceeds totalPages', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="100"></hx-pagination>',
      );
      expect(el.shadowRoot!.querySelector('nav')).toBeTruthy();
    });

    it('clamps navigation within valid range', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="5" current-page="5"></hx-pagination>',
      );
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('renders a single page without errors', async () => {
      const el = await fixture<HelixPagination>(
        '<hx-pagination total-pages="1" current-page="1"></hx-pagination>',
      );
      const nav = el.shadowRoot!.querySelector('nav');
      expect(nav).toBeTruthy();
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(true);
    });
  });
});
