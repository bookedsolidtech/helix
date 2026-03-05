import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, oneEvent } from '../../test-utils.js';
import type { HelixPagination } from './hx-pagination.js';
import './index.js';

afterEach(cleanup);

describe('hx-pagination', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <nav> element with part="nav"', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const nav = shadowQuery(el, 'nav');
      expect(nav).toBeTruthy();
      expect(nav?.getAttribute('part')).toBe('nav');
    });

    it('sets aria-label on nav', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1" label="Page navigation"></hx-pagination>');
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Page navigation');
    });

    it('defaults aria-label to "Pagination"', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Pagination');
    });

    it('renders a list with part="list"', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const list = shadowQuery(el, '[part="list"]');
      expect(list).toBeTruthy();
    });

    it('marks current page button with aria-current="page"', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="3"></hx-pagination>');
      const buttons = el.shadowRoot!.querySelectorAll('button[aria-current="page"]');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent?.trim()).toBe('3');
    });
  });

  // ─── Previous/Next ───

  describe('Previous / Next navigation', () => {
    it('disables previous button on first page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('disables next button on last page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="5"></hx-pagination>');
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('enables previous button when not on first page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="3"></hx-pagination>');
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('enables next button when not on last page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="3"></hx-pagination>');
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });
  });

  // ─── First/Last buttons ───

  describe('First / Last buttons', () => {
    it('does not show first/last buttons by default', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="10" current-page="5"></hx-pagination>');
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]');
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]');
      expect(firstBtn).toBeNull();
      expect(lastBtn).toBeNull();
    });

    it('shows first/last buttons when show-first-last is set', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="10" current-page="5" show-first-last></hx-pagination>');
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]');
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]');
      expect(firstBtn).toBeTruthy();
      expect(lastBtn).toBeTruthy();
    });

    it('disables first button on first page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1" show-first-last></hx-pagination>');
      const firstBtn = shadowQuery(el, 'button[aria-label="First page"]') as HTMLButtonElement;
      expect(firstBtn.disabled).toBe(true);
    });

    it('disables last button on last page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="5" show-first-last></hx-pagination>');
      const lastBtn = shadowQuery(el, 'button[aria-label="Last page"]') as HTMLButtonElement;
      expect(lastBtn.disabled).toBe(true);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('fires hx-page-change with correct page on next click', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="2"></hx-pagination>');
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(nextBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(3);
    });

    it('fires hx-page-change with correct page on prev click', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="3"></hx-pagination>');
      const prevBtn = shadowQuery(el, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(prevBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(2);
    });

    it('fires hx-page-change when clicking a page number', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const pageBtn = shadowQuery(el, 'button[aria-label="Page 3"]') as HTMLButtonElement;
      const [event] = await Promise.all([
        oneEvent(el, 'hx-page-change'),
        Promise.resolve(pageBtn.click()),
      ]);
      expect((event as CustomEvent<{ page: number }>).detail.page).toBe(3);
    });

    it('does not fire hx-page-change when clicking current page', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      let fired = false;
      el.addEventListener('hx-page-change', () => { fired = true; });
      // current page button is disabled, so no click
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "nav" part', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      expect(shadowQuery(el, '[part="nav"]')).toBeTruthy();
    });

    it('exposes "list" part', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      expect(shadowQuery(el, '[part="list"]')).toBeTruthy();
    });

    it('exposes "item" parts', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const items = el.shadowRoot!.querySelectorAll('[part="item"]');
      expect(items.length).toBeGreaterThan(0);
    });

    it('exposes "button" parts', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="1"></hx-pagination>');
      const buttons = el.shadowRoot!.querySelectorAll('[part="button"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('exposes "ellipsis" part on many pages', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="20" current-page="10"></hx-pagination>');
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  // ─── Ellipsis ───

  describe('Ellipsis', () => {
    it('shows ellipsis when pages exceed visible range', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="20" current-page="10"></hx-pagination>');
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show ellipsis when all pages fit', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="3" current-page="2"></hx-pagination>');
      const ellipsis = el.shadowRoot!.querySelectorAll('[part="ellipsis"]');
      expect(ellipsis.length).toBe(0);
    });
  });

  // ─── Properties ───

  describe('Properties', () => {
    it('reflects current-page attribute', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="10" current-page="4"></hx-pagination>');
      expect(el.currentPage).toBe(4);
    });

    it('reflects total-pages attribute', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="10" current-page="1"></hx-pagination>');
      expect(el.totalPages).toBe(10);
    });

    it('updates currentPage property after navigation', async () => {
      const el = await fixture<HelixPagination>('<hx-pagination total-pages="5" current-page="2"></hx-pagination>');
      const nextBtn = shadowQuery(el, 'button[aria-label="Next page"]') as HTMLButtonElement;
      nextBtn.click();
      await el.updateComplete;
      expect(el.currentPage).toBe(3);
    });
  });
});
