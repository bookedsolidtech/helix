import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCarousel } from './hx-carousel.js';
import type { HelixCarouselItem } from './hx-carousel-item.js';
import './index.js';

afterEach(cleanup);

const threeSlides = `
  <hx-carousel>
    <hx-carousel-item>Slide 1</hx-carousel-item>
    <hx-carousel-item>Slide 2</hx-carousel-item>
    <hx-carousel-item>Slide 3</hx-carousel-item>
  </hx-carousel>
`;

describe('hx-carousel', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="base"]')).toBeTruthy();
    });

    it('exposes "slide-viewport" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="slide-viewport"]')).toBeTruthy();
    });

    it('exposes "navigation" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="navigation"]')).toBeTruthy();
    });

    it('exposes "pagination" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="pagination"]')).toBeTruthy();
    });

    it('exposes "prev-button" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="prev-button"]')).toBeTruthy();
    });

    it('exposes "next-button" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="next-button"]')).toBeTruthy();
    });
  });

  // ─── ARIA (5) ───

  describe('ARIA', () => {
    it('base element has role="region"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('region');
    });

    it('base element has aria-label from label property (default: "Carousel")', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Carousel');
    });

    it('base element aria-label reflects label property', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      el.label = 'Featured articles';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Featured articles');
    });

    it('prev button has aria-label="Previous slide"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const prev = shadowQuery(el, '[aria-label="Previous slide"]');
      expect(prev).toBeTruthy();
    });

    it('next button has aria-label="Next slide"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const next = shadowQuery(el, '[aria-label="Next slide"]');
      expect(next).toBeTruthy();
    });

    it('pagination dots have aria-label="Slide N of M"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const dot1 = shadowQuery(el, '[part="pagination-item"][aria-label="Slide 1 of 3"]');
      expect(dot1).toBeTruthy();
    });
  });

  // ─── Navigation (6) ───

  describe('Navigation', () => {
    it('starts at index 0', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('next() advances to index 1', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('previous() does nothing at index 0 without loop', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('next() clamps at last slide without loop', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.next();
      el.next();
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('next button click dispatches hx-slide-change', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent<{ index: number }>>(el, 'hx-slide-change');
      const nextBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Next slide"]');
      nextBtn?.click();
      const event = await eventPromise;
      expect(event.detail.index).toBe(1);
    });

    it('pagination dot click navigates to correct slide', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const dots = el.shadowRoot?.querySelectorAll('[part="pagination-item"]');
      expect(dots?.length).toBe(3);
      (dots?.[2] as HTMLButtonElement)?.click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('goTo() same index does not fire hx-slide-change', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.goTo(1);
      await el.updateComplete;

      let eventFired = false;
      el.addEventListener('hx-slide-change', () => {
        eventFired = true;
      });
      el.goTo(1); // same index
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });
  });

  // ─── Loop (3) ───

  describe('Loop', () => {
    it('with loop, next() wraps from last to first', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('with loop, previous() wraps from first to last', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('without loop, prev button is disabled at index 0', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const prev = shadowQuery<HTMLButtonElement>(el, '[aria-label="Previous slide"]');
      expect(prev?.disabled).toBe(true);
    });
  });

  // ─── Autoplay (4) ───

  describe('Autoplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('autoplay starts when attribute is set', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(true);
    });

    it('autoplay advances slide after interval', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      vi.advanceTimersByTime(1100);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('autoplay pauses on mouseenter', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(el['_autoplayTimer']).toBeNull();
    });

    it('renders play/pause button when autoplay is set', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const playPauseBtn = shadowQuery(el, '[aria-label="Pause autoplay"]');
      expect(playPauseBtn).toBeTruthy();
    });

    it('autoplay does not start when prefers-reduced-motion is active', async () => {
      // Mock window.matchMedia to simulate prefers-reduced-motion: reduce
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }));

      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(false);
      expect(el['_autoplayTimer']).toBeNull();

      window.matchMedia = original;
    });

    it('disconnectedCallback stops autoplay timer', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_autoplayTimer']).not.toBeNull();
      el.remove();
      expect(el['_autoplayTimer']).toBeNull();
    });
  });

  // ─── Keyboard (4) ───

  describe('Keyboard', () => {
    it('ArrowRight advances to next slide (horizontal)', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('ArrowLeft goes to previous slide (horizontal)', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('Home key navigates to first slide', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('End key navigates to last slide', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });
  });

  // ─── Properties (4) ───

  describe('Properties', () => {
    it('loop attribute reflects to host', async () => {
      const el = await fixture<HelixCarousel>(
        '<hx-carousel loop><hx-carousel-item>1</hx-carousel-item></hx-carousel>',
      );
      expect(el.hasAttribute('loop')).toBe(true);
    });

    it('orientation defaults to horizontal', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.orientation).toBe('horizontal');
    });

    it('orientation reflects to host', async () => {
      const el = await fixture<HelixCarousel>(
        '<hx-carousel orientation="vertical"><hx-carousel-item>1</hx-carousel-item></hx-carousel>',
      );
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('autoplayInterval defaults to 3000', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.autoplayInterval).toBe(3000);
    });
  });

  // ─── hx-carousel-item (10) ───

  describe('hx-carousel-item', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "slide" CSS part', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      expect(el.shadowRoot?.querySelector('[part="slide"]')).toBeTruthy();
    });

    it('slide group has role="group"', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      const group = el.shadowRoot?.querySelector('[role="group"]');
      expect(group).toBeTruthy();
    });

    it('slide group has aria-label with slide index', async () => {
      const el = await fixture<HelixCarouselItem>(
        '<hx-carousel-item slide-index="1" total-slides="5">Content</hx-carousel-item>',
      );
      const group = el.shadowRoot?.querySelector('[role="group"]');
      expect(group?.getAttribute('aria-label')).toBe('Slide 2 of 5');
    });

    it('slideIndex defaults to 0', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      expect(el.slideIndex).toBe(0);
    });

    it('totalSlides defaults to 0', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      expect(el.totalSlides).toBe(0);
    });

    it('default aria-label shows "Slide 1 of 0" with default properties', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      const group = el.shadowRoot?.querySelector('[role="group"]');
      expect(group?.getAttribute('aria-label')).toBe('Slide 1 of 0');
    });

    it('renders default slot content', async () => {
      const el = await fixture<HelixCarouselItem>(
        '<hx-carousel-item><p>Slide content</p></hx-carousel-item>',
      );
      const slot = el.shadowRoot?.querySelector('slot');
      expect(slot).toBeTruthy();
      const assigned = slot?.assignedElements({ flatten: true });
      expect(assigned?.length).toBe(1);
      expect(assigned?.[0].textContent).toBe('Slide content');
    });

    it('slide group has tabindex="-1" for programmatic focus', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      const group = el.shadowRoot?.querySelector('[role="group"]');
      expect(group?.getAttribute('tabindex')).toBe('-1');
    });

    it('host element has display: block', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      const style = getComputedStyle(el);
      expect(style.display).toBe('block');
    });

    it('has no axe violations', async () => {
      const el = await fixture<HelixCarouselItem>(
        '<hx-carousel-item slide-index="0" total-slides="3">Accessible content</hx-carousel-item>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders hx-carousel-item elements', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const items = el.querySelectorAll('hx-carousel-item');
      expect(items.length).toBe(3);
    });

    it('custom slot content for next-button is rendered', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>1</hx-carousel-item>
          <button slot="next-button" id="custom-next">Custom Next</button>
        </hx-carousel>
      `);
      const customBtn = el.querySelector('#custom-next');
      expect(customBtn).toBeTruthy();
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('hx-slide-change fires on next()', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent<{ index: number; slide: HelixCarouselItem }>>(
        el,
        'hx-slide-change',
      );
      el.next();
      const event = await eventPromise;
      expect(event.detail.index).toBe(1);
    });

    it('hx-slide-change is composed and bubbles', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-slide-change');
      el.next();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-slide-change includes slide reference', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent<{ index: number; slide: HelixCarouselItem }>>(
        el,
        'hx-slide-change',
      );
      el.next();
      const event = await eventPromise;
      expect(event.detail.slide).toBeInstanceOf(HTMLElement);
    });
  });

  // ─── Autoplay Toggle & Resume (3) ───

  describe('Autoplay Toggle & Resume', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('play/pause button toggles autoplay off when playing', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(true);
      const pauseBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Pause autoplay"]');
      pauseBtn?.click();
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(false);
    });

    it('play/pause button starts autoplay when paused', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const pauseBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Pause autoplay"]');
      pauseBtn?.click();
      await el.updateComplete;
      const playBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Play autoplay"]');
      expect(playBtn).toBeTruthy();
      playBtn?.click();
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(true);
    });

    it('autoplay resumes after mouseleave', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(el['_autoplayTimer']).toBeNull();
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await el.updateComplete;
      expect(el['_autoplayTimer']).not.toBeNull();
    });

    it('autoplay pauses on focusin and resumes on focusout', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await el.updateComplete;
      expect(el['_autoplayTimer']).toBeNull();
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await el.updateComplete;
      expect(el['_autoplayTimer']).not.toBeNull();
    });
  });

  // ─── Vertical Keyboard (2) ───

  describe('Vertical Keyboard', () => {
    it('ArrowDown advances to next slide (vertical)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      // Constrain the viewport so the content overflows and the carousel scrolls
      // (an unconstrained vertical viewport grows to the content -> single page).
      shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!.style.height = '20px';
      el['_recomputeBounds']();
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('ArrowUp goes to previous slide (vertical)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!.style.height = '20px';
      el['_recomputeBounds']();
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });
  });

  // ─── Mouse Dragging (3) ───

  describe('Mouse Dragging', () => {
    it('drag right (positive diff) calls previous()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
      );
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 260, bubbles: true }));
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 260, bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('drag left (negative diff) calls next()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
      );
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 140, bubbles: true }));
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 140, bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('small drag (below threshold) does not navigate', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
      );
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, bubbles: true }));
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 210, bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('drag does not navigate when mouse-dragging is false (default)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
      );
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 140, bubbles: true }));
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 140, bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });
  });

  // ─── Single slide (2) ───

  describe('Single slide', () => {
    it('pagination is hidden for single-slide carousel', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Only slide</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const pagination = shadowQuery(el, '[part="pagination"]');
      expect(pagination).toBeNull();
    });

    it('prev and next buttons are disabled for single-slide carousel without loop', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Only slide</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]');
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]');
      expect(prev?.disabled).toBe(true);
      expect(next?.disabled).toBe(true);
    });
  });

  // ─── Slides Per Page / Move (4) ───

  describe('Slides Per Page / Move', () => {
    it('slidesPerPage defaults to 1', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.slidesPerPage).toBe(1);
    });

    it('slidesPerMove defaults to 1', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.slidesPerMove).toBe(1);
    });

    it('with slidesPerPage=2, maxIndex is slides.length - slidesPerPage', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      // maxIndex should be 4 - 2 = 2
      el.goTo(10);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('with slidesPerMove=2, next() advances by 2', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-move="2">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('slides-per-page="0" degrades to 1-up: no /0 width, valid maxIndex, goTo works', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="0" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      // Width math normalizes to 1 slide per page — no division by zero.
      expect(el['_effectiveSlidesPerPage']).toBe(1);
      const widthExpr = el['_computedSlideWidthExpr']();
      expect(widthExpr).toBe('calc((100% - 0 * var(--hx-carousel-gap, 0px)) / 1)');
      expect(widthExpr).not.toContain('/ 0');

      // Non-loop selection bound is the last real slide (n - 1), not n.
      expect(el['_maxIndex']).toBe(2);

      // The track transform is a finite CSS value (no NaN / Infinity).
      const transform = el['_trackTransform'];
      expect(transform).not.toContain('NaN');
      expect(transform).not.toContain('Infinity');

      // goTo(last) lands on the final slide and stays clamped there.
      el.goTo(el['_slides'].length - 1);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      el.goTo(99);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('negative slides-per-page degrades to 1-up: valid width and bounds', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="-2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      expect(el['_effectiveSlidesPerPage']).toBe(1);
      // A negative page count must not inflate _maxIndex past the last slide
      // (n - (-2) = n + 2 would strand goTo in an out-of-range/empty state).
      expect(el['_maxIndex']).toBe(2);
      const widthExpr = el['_computedSlideWidthExpr']();
      expect(widthExpr).toBe('calc((100% - 0 * var(--hx-carousel-gap, 0px)) / 1)');

      el.goTo(2);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('fractional slides-per-page floors to whole slides per page', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      el.slidesPerPage = 2.7;
      await el.updateComplete;
      expect(el['_effectiveSlidesPerPage']).toBe(2);
      // Legacy non-loop page bound = n - floor(2.7) = 4 - 2 = 2.
      expect(el['_maxIndex']).toBe(2);
    });

    it('positive fraction < 1 (0.5, 0.99) degrades to 1-up: floor(<1) never yields 0', async () => {
      // A positive fraction below 1 passes `> 0` but `Math.floor` is 0 — the
      // clamp to >= 1 keeps it a valid 1-up carousel (no divide-by-zero).
      for (const value of [0.5, 0.99]) {
        const el = await fixture<HelixCarousel>(`
          <hx-carousel style="display: block; width: 400px;">
            <hx-carousel-item>1</hx-carousel-item>
            <hx-carousel-item>2</hx-carousel-item>
            <hx-carousel-item>3</hx-carousel-item>
          </hx-carousel>
        `);
        el.slidesPerPage = value;
        await el.updateComplete;

        expect(el['_effectiveSlidesPerPage']).toBe(1);
        // Width math resolves to a single 100% page — no `/ 0`.
        const widthExpr = el['_computedSlideWidthExpr']();
        expect(widthExpr).toBe('calc((100% - 0 * var(--hx-carousel-gap, 0px)) / 1)');
        expect(widthExpr).not.toContain('/ 0');

        // Selection bound is the last real slide; transform is finite.
        expect(el['_maxIndex']).toBe(2);
        const transform = el['_trackTransform'];
        expect(transform).not.toContain('NaN');
        expect(transform).not.toContain('Infinity');

        // goTo(last) works and stays clamped.
        el.goTo(el['_slides'].length - 1);
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(2);
      }
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with loop enabled', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with autoplay enabled', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects carousel items into the default slot', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel label="Images">
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(3);
    });

    it('projects custom content into the previous-button slot', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel label="Images">
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <button slot="previous-button" aria-label="Go back">Back</button>
        </hx-carousel>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="previous-button"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect(assigned[0].tagName.toLowerCase()).toBe('button');
    });

    it('projects custom content into the next-button slot', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel label="Images">
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <button slot="next-button" aria-label="Go forward">Next</button>
        </hx-carousel>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="next-button"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect(assigned[0].tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('labelSlideOf returns default English format', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel label="Photos">
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>`,
      );
      await el.updateComplete;
      expect(el.labelSlideOf(2, 3)).toBe('Slide 2 of 3');
    });

    it('labelSlideOf can be overridden with a custom function', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel label="Photos">
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>`,
      );
      await el.updateComplete;
      el.labelSlideOf = (current: number, total: number) => `Diapositive ${current} sur ${total}`;
      await el.updateComplete;
      expect(el.labelSlideOf(1, 2)).toBe('Diapositive 1 sur 2');
    });
  });

  // ─── Touch drag on vertical carousel ───

  describe('Touch drag (vertical orientation)', () => {
    it('swipe up (negative clientY diff) on vertical carousel calls next()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      // Constrain the viewport so the content overflows and the carousel scrolls.
      container.style.height = '20px';
      el['_recomputeBounds']();
      await el.updateComplete;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 200 })],
      });
      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 140 })],
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: 1, target: container, clientX: 100, clientY: 140 }),
        ],
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(1);
    });

    it('swipe down (positive clientY diff) on vertical carousel calls previous()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;
      // Constrain the viewport so the content overflows and the carousel scrolls.
      container.style.height = '20px';
      el['_recomputeBounds']();
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 100 })],
      });
      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 160 })],
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: 1, target: container, clientX: 100, clientY: 160 }),
        ],
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(1);
    });
  });

  // ─── Autoplay tick edge cases ───

  describe('Autoplay tick edge cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('non-loop autoplay at last slide wraps to index 0', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="500">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      // Navigate to last slide manually before autoplay ticks
      el.goTo(2);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Tick the autoplay — non-loop at maxIndex should wrap to 0
      vi.advanceTimersByTime(600);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(0);
    });

    it('_resumeAutoplay does not resume when both _isHovered and _isFocused are true', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_isPlaying']).toBe(true);

      // Simulate both hover and focus — timer should be cleared
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await el.updateComplete;

      expect(el['_autoplayTimer']).toBeNull();

      // mouseleave while still focused — should NOT resume because _isFocused is still true
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await el.updateComplete;

      expect(el['_autoplayTimer']).toBeNull();
    });
  });

  // ─── Drag end without movement ───

  describe('Drag end without movement (click, not drag)', () => {
    it('mouseup without prior movement does not navigate and resets cursor', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;

      // mousedown starts drag but no mousemove to set _dragMoved
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 100, bubbles: true, cancelable: true }),
      );
      // mouseup immediately — _dragMoved is still false
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, bubbles: true }));
      await el.updateComplete;

      // No navigation should occur
      expect(el['_currentIndex']).toBe(0);
      // Cursor style should be reset
      expect(container.style.cursor).toBe('');
    });
  });

  // ─── Vertical orientation icon rendering ───

  describe('Vertical orientation icon rendering', () => {
    it('prev button uses chevron-up hx-icon in vertical orientation', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const prevBtn = shadowQuery(el, '[part="prev-button"]');
      const glyph = prevBtn?.querySelector('hx-icon[library="helix"][name="chevron-up"]');
      expect(glyph).toBeTruthy();
    });

    it('next button uses chevron-down hx-icon in vertical orientation', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const nextBtn = shadowQuery(el, '[part="next-button"]');
      const glyph = nextBtn?.querySelector('hx-icon[library="helix"][name="chevron-down"]');
      expect(glyph).toBeTruthy();
    });

    it('prev button uses chevron-left hx-icon in horizontal orientation', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const prevBtn = shadowQuery(el, '[part="prev-button"]');
      const glyph = prevBtn?.querySelector('hx-icon[library="helix"][name="chevron-left"]');
      expect(glyph).toBeTruthy();
    });
  });

  // ─── Property: label overrides (i18n) ───

  describe('Property: label overrides', () => {
    it('labelPrevSlide defaults to "Previous slide"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.labelPrevSlide).toBe('Previous slide');
    });

    it('labelNextSlide defaults to "Next slide"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.labelNextSlide).toBe('Next slide');
    });

    it('labelPauseAutoplay defaults to "Pause autoplay"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.labelPauseAutoplay).toBe('Pause autoplay');
    });

    it('labelPlayAutoplay defaults to "Play autoplay"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.labelPlayAutoplay).toBe('Play autoplay');
    });

    it('sets custom labelPrevSlide as aria-label on prev button', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel label-prev-slide="Diapositive précédente">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const prevBtn = shadowQuery(el, '[part="prev-button"]');
      expect(prevBtn?.getAttribute('aria-label')).toBe('Diapositive précédente');
    });

    it('sets custom labelNextSlide as aria-label on next button', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel label-next-slide="Diapositive suivante">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const nextBtn = shadowQuery(el, '[part="next-button"]');
      expect(nextBtn?.getAttribute('aria-label')).toBe('Diapositive suivante');
    });
  });

  // ─── Property: mouseDragging ───

  describe('Property: mouseDragging', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(el.mouseDragging).toBe(false);
    });

    it('accepts mouseDragging attribute', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      expect(el.mouseDragging).toBe(true);
    });

    it('sets mouseDragging property programmatically', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      el.mouseDragging = true;
      await el.updateComplete;
      expect(el.mouseDragging).toBe(true);
    });
  });

  // ─── disconnectedCallback with null _mql ───

  describe('disconnectedCallback with null _mql', () => {
    it('does not throw when _mql is null on disconnect', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>1</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      // Force _mql to null to simulate SSR-like scenario
      el['_mql'] = null;

      expect(() => el.remove()).not.toThrow();
    });
  });

  // ─── Dynamic Slide Add / Remove ───

  describe('Dynamic Slide Add / Remove', () => {
    it('newly appended slide is included in _slides array', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_slides'].length).toBe(2);

      const newSlide = document.createElement('hx-carousel-item') as HelixCarouselItem;
      newSlide.textContent = 'Slide 3';
      el.appendChild(newSlide);

      await el.updateComplete;
      await newSlide.updateComplete;

      expect(el['_slides'].length).toBe(3);
    });

    it('pagination dots update to match new slide count after appending', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      const newSlide = document.createElement('hx-carousel-item') as HelixCarouselItem;
      newSlide.textContent = 'Slide 3';
      el.appendChild(newSlide);

      // Wait for slotchange to propagate and Lit to re-render
      await newSlide.updateComplete;
      await el.updateComplete;
      // Additional microtask flush to ensure _syncSlides ran after slotchange
      await new Promise<void>((r) => setTimeout(r, 0));
      await el.updateComplete;

      const dots = el.shadowRoot!.querySelectorAll('[part="pagination-item"]');
      expect(dots.length).toBe(3);
    });

    it('currentIndex is clamped when a slide at or beyond it is removed', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Remove the last slide — currentIndex should clamp to 1
      const slides = el.querySelectorAll('hx-carousel-item');
      el.removeChild(slides[2]!);

      await el.updateComplete;

      expect(el['_currentIndex']).toBeLessThanOrEqual(1);
    });

    it('a post-init slot shrink that drops the active slide emits one hx-slide-change and updates the live region', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
          <hx-carousel-item>Slide 4</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(3); // active = last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      const events: number[] = [];
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      // Drop the last two slides at runtime — the active index is now out of range.
      const slides = el.querySelectorAll('hx-carousel-item');
      slides[3]!.remove();
      slides[2]!.remove();
      // Let slotchange propagate -> _syncSlides -> _recomputeBounds clamps + emits.
      await el.updateComplete;
      await new Promise<void>((r) => setTimeout(r, 0));
      await el.updateComplete;

      // Clamped to the new max (default slides-per-page=1 -> n-1 = 1) via the
      // event-aware path: exactly one event, and the live region updated.
      expect(el['_currentIndex']).toBe(1);
      expect(events).toEqual([1]);
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 2 of 2');
    });

    it('a post-init slot shrink to zero clears the live region and emits the empty-state event', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2); // active = last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 3 of 3');

      const events: Array<{ index: number; slide: unknown }> = [];
      el.addEventListener('hx-slide-change', (e) => {
        const d = (e as CustomEvent<{ index: number; slide: unknown }>).detail;
        events.push({ index: d.index, slide: d.slide });
      });

      // Remove every slide at runtime.
      el.querySelectorAll('hx-carousel-item').forEach((s) => {
        s.remove();
      });
      await el.updateComplete;
      await new Promise<void>((r) => setTimeout(r, 0));
      await el.updateComplete;

      expect(el['_slides'].length).toBe(0);
      expect(el['_currentIndex']).toBe(0); // defined empty sentinel, ready for repopulation
      // Live region cleared — no stale "Slide 1 of 0".
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('');
      // Exactly one empty-state event with the documented "no active slide" detail.
      expect(events).toEqual([{ index: -1, slide: undefined }]);
    });

    it('repopulating an emptied carousel restores normal behavior (index 0, live text, one event)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(1);
      await el.updateComplete;

      // Empty it.
      el.querySelectorAll('hx-carousel-item').forEach((s) => {
        s.remove();
      });
      await el.updateComplete;
      await new Promise<void>((r) => setTimeout(r, 0));
      await el.updateComplete;
      expect(el['_slides'].length).toBe(0);

      const events: number[] = [];
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      // Repopulate.
      const a = document.createElement('hx-carousel-item') as HelixCarouselItem;
      a.textContent = 'A';
      const b = document.createElement('hx-carousel-item') as HelixCarouselItem;
      b.textContent = 'B';
      el.append(a, b);
      await el.updateComplete;
      await new Promise<void>((r) => setTimeout(r, 0));
      await el.updateComplete;

      expect(el['_slides'].length).toBe(2);
      expect(el['_currentIndex']).toBe(0); // re-initialized
      expect(events).toEqual([0]); // one "restored slide 0" event
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 1 of 2');

      // Navigation works again.
      el.goTo(1);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('empty carousel initializes with _slides length 0', async () => {
      const el = await fixture<HelixCarousel>('<hx-carousel></hx-carousel>');
      await el.updateComplete;
      expect(el['_slides'].length).toBe(0);
    });

    it('goTo on empty carousel does nothing', async () => {
      const el = await fixture<HelixCarousel>('<hx-carousel></hx-carousel>');
      await el.updateComplete;

      let fired = false;
      el.addEventListener('hx-slide-change', () => {
        fired = true;
      });

      el.goTo(1);
      await el.updateComplete;

      expect(fired).toBe(false);
    });
  });

  // ─── Horizontal touch swipe ───

  describe('Touch drag (horizontal orientation)', () => {
    it('swipe left (negative clientX diff) on horizontal carousel calls next()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 200, clientY: 100 })],
      });
      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 140, clientY: 100 })],
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: 1, target: container, clientX: 140, clientY: 100 }),
        ],
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(1);
    });

    it('swipe right (positive clientX diff) on horizontal carousel calls previous()', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;

      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 100 })],
      });
      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 160, clientY: 100 })],
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: 1, target: container, clientX: 160, clientY: 100 }),
        ],
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(1);
    });

    it('small swipe below threshold does not change slide', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel mouse-dragging>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const container = shadowQuery(el, '[part="slide-viewport"]') as HTMLElement;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 100, clientY: 100 })],
      });
      // Move only 10px — below threshold (typically 50px)
      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: container, clientX: 110, clientY: 100 })],
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: 1, target: container, clientX: 110, clientY: 100 }),
        ],
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(0);
    });
  });

  // ─── Loop edge cases ───

  describe('Loop edge cases — boundary wrapping', () => {
    it('loop: keyboard ArrowRight from last slide wraps to first', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(2);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(0);
    });

    it('loop: keyboard ArrowLeft from first slide wraps to last', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
          <hx-carousel-item>Slide 3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(2);
    });

    it('without loop: next() at last slide does not change index', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      el.goTo(1);
      await el.updateComplete;
      const before = el['_currentIndex'];

      el.next();
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(before);
    });

    it('without loop: previous() at first slide does not change index', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel>
          <hx-carousel-item>Slide 1</hx-carousel-item>
          <hx-carousel-item>Slide 2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      el.previous();
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(0);
    });
  });

  // ─── Autoplay additional coverage ───

  describe('Autoplay: additional coverage', () => {
    it('autoplay resumes after mouseleave when not focused', async () => {
      vi.useFakeTimers();
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      // Pause via mouseenter
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(el['_autoplayTimer']).toBeNull();

      // Resume via mouseleave
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      expect(el['_autoplayTimer']).not.toBeNull();

      vi.useRealTimers();
    });

    it('autoplay does not resume on mouseleave when element still focused', async () => {
      vi.useFakeTimers();
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      // Simulate focus then hover
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      // Leave hover but stay focused
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Autoplay should remain paused because element is still focused
      expect(el['_autoplayTimer']).toBeNull();

      vi.useRealTimers();
    });

    it('autoplay resumes after focusout when not hovered', async () => {
      vi.useFakeTimers();
      const el = await fixture<HelixCarousel>(`
        <hx-carousel autoplay autoplay-interval="1000" loop>
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;

      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(el['_autoplayTimer']).toBeNull();

      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      expect(el['_autoplayTimer']).not.toBeNull();

      vi.useRealTimers();
    });
  });

  // ─── Custom property hooks: --hx-carousel-slide-width / --hx-carousel-gap ───

  describe('Custom property hooks (slide-width & gap)', () => {
    // Two slides per page in a fixed 400px host makes the geometry exact:
    // computed slide width = (400 - (n-1)*gap) / n.
    const fourSlides = (attrs = '') => `
      <hx-carousel slides-per-page="2" style="display: block; width: 400px;${attrs}">
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
        <hx-carousel-item>4</hx-carousel-item>
      </hx-carousel>
    `;

    /** Resolved translate (px) on the track's transform matrix. */
    function trackTranslate(track: HTMLElement, axis: 'x' | 'y' = 'x'): number {
      const t = getComputedStyle(track).transform;
      if (t === 'none') return 0;
      const m = new DOMMatrixReadOnly(t);
      return axis === 'x' ? m.m41 : m.m42;
    }

    /** Cancel the in-flight transition so geometry/matrix reads are final. */
    function settle(track: HTMLElement): void {
      track.style.transition = 'none';
      void track.getBoundingClientRect();
    }

    it('default (gap 0, no override): slide width is 50% for slides-per-page=2 — zero drift', async () => {
      const el = await fixture<HelixCarousel>(fourSlides());
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      const trackW = track.getBoundingClientRect().width;

      expect(getComputedStyle(track).columnGap).toBe('0px');
      expect(items[0].getBoundingClientRect().width).toBeCloseTo(trackW / 2, 0);
      expect(items[1].getBoundingClientRect().width).toBeCloseTo(trackW / 2, 0);
    });

    it('default (gap 0, no override): navigation offset is i * (100% / slides-per-page) — zero drift', async () => {
      const el = await fixture<HelixCarousel>(fourSlides());
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const trackW = track.getBoundingClientRect().width;

      el.next();
      await el.updateComplete;
      settle(track);
      // One step = 50% of the 400px track = 200px (unchanged from the legacy percentage).
      expect(trackTranslate(track)).toBeCloseTo(-trackW / 2, 0);
    });

    it('gap=16px: the two visible slides plus the gap fill the track exactly (no clip)', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-gap: 16px;'));
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      const trackW = track.getBoundingClientRect().width;
      const gapPx = parseFloat(getComputedStyle(track).columnGap);

      expect(gapPx).toBeCloseTo(16, 1);
      // (400 - 16) / 2 = 192 each → 192 + 192 + 16 = 400, no overflow/clip.
      const sum =
        items[0].getBoundingClientRect().width + items[1].getBoundingClientRect().width + gapPx;
      expect(sum).toBeCloseTo(trackW, 0);
    });

    it('gap=16px: navigation advances by one slide width + gap and lands the active slide flush', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-gap: 16px;'));
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      const slideW = items[0].getBoundingClientRect().width; // 192

      el.next();
      await el.updateComplete;
      settle(track);

      // Step = slide width + gap = 192 + 16 = 208px.
      expect(trackTranslate(track)).toBeCloseTo(-(slideW + 16), 0);
      // The active slide (index 1) sits flush with the viewport's leading edge.
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      expect(items[1].getBoundingClientRect().left - vp.getBoundingClientRect().left).toBeCloseTo(
        0,
        0,
      );
    });

    it('--hx-carousel-slide-width override drives both layout and navigation', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');

      // Override wins over the computed 200px (50%).
      expect(items[0].getBoundingClientRect().width).toBeCloseTo(150, 0);

      el.next();
      await el.updateComplete;
      settle(track);
      // gap is 0, so a single step advances by the custom slide width.
      expect(trackTranslate(track)).toBeCloseTo(-150, 0);
    });

    it('--hx-carousel-gap sets the inter-slide gap on the track', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel style="--hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      expect(getComputedStyle(track).columnGap).toBe('16px');
    });
  });

  // ─── Custom-width "peek" model: selection decoupled from scroll ───

  describe('Custom-width navigation (selection vs scroll)', () => {
    const fourSlides = (style = '') => `
      <hx-carousel slides-per-page="2" style="display: block; width: 400px;${style}">
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
        <hx-carousel-item>4</hx-carousel-item>
      </hx-carousel>
    `;

    /** Resolved translate (px) on the track's transform matrix. */
    function trackTranslate(track: HTMLElement, axis: 'x' | 'y' = 'x'): number {
      const t = getComputedStyle(track).transform;
      if (t === 'none') return 0;
      const m = new DOMMatrixReadOnly(t);
      return axis === 'x' ? m.m41 : m.m42;
    }

    /** Cancel the in-flight transition so geometry/matrix reads are final. */
    function settle(track: HTMLElement): void {
      track.style.transition = 'none';
      void track.getBoundingClientRect();
    }

    /**
     * Measured metrics are set in firstUpdated and committed to the DOM on the
     * following update cycle, so flush twice before reading rendered state.
     */
    async function flush(el: HelixCarousel): Promise<void> {
      await el.updateComplete;
      await el.updateComplete;
    }

    it('default (no custom width): selection, clamping, transform, and disabled states are unchanged — zero drift', async () => {
      const el = await fixture<HelixCarousel>(fourSlides());
      await el.updateComplete;

      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // 4 - 2, legacy page bound

      // goTo clamps to the legacy max (existing behavior).
      el.goTo(10);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(next.disabled).toBe(true); // at legacy max
      expect(prev.disabled).toBe(false);

      // Legacy calc() percentage transform: index 2 * 50% of a 400px track = -400px.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-400, 0);
    });

    it('custom-width: every slide is selectable via goTo / End / Home / pagination dot', async () => {
      // 250px slides (slideWidth <= viewport < 2*slideWidth) keep every index a
      // distinct position, so the bound is n-1 and every slide is reachable.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 250px;'));
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // every slide selectable (n - 1)

      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3); // End reaches the true last slide

      el.goTo(0);
      await el.updateComplete;
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(4); // one dot per slide
      dots[3].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('custom-width: at the last slide the track saturates at maxScroll with the last slide flush right', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);

      el.goTo(3);
      await el.updateComplete;

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);

      // content = 4*150 = 600, viewport = 400 -> maxScroll = 200; translate saturates there.
      expect(el['_measuredMaxScroll']).toBeCloseTo(200, 0);
      expect(trackTranslate(track)).toBeCloseTo(-200, 0);

      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      const lastRight = slides[slides.length - 1].getBoundingClientRect().right;
      expect(lastRight).toBeCloseTo(vp.getBoundingClientRect().right, 0); // flush, no blank
    });

    it('custom-width: next() steps reach the last slide and prev() returns to 0', async () => {
      // 250px slides keep every index distinct (bound n-1), so every slide is reachable.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 250px;'));
      await flush(el);

      el.next(); // 0 -> 1
      el.next(); // 1 -> 2
      el.next(); // 2 -> 3 (last)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      el.next(); // no-op at the last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      el.previous(); // 3 -> 2
      el.previous(); // 2 -> 1
      el.previous(); // 1 -> 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('custom-width: prev disabled at 0, next disabled at the last slide, both enabled in the middle', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);

      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;

      expect(prev.disabled).toBe(true); // index 0
      expect(next.disabled).toBe(false);

      el.goTo(1);
      await el.updateComplete;
      expect(prev.disabled).toBe(false); // middle
      expect(next.disabled).toBe(false);

      el.goTo(3);
      await el.updateComplete;
      expect(prev.disabled).toBe(false);
      expect(next.disabled).toBe(true); // last slide (n - 1)
    });

    it('custom-width: pagination active dot and ARIA live text track the true active index', async () => {
      // 250px slides keep every index distinct (bound n-1), so the last slide is selectable.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 250px;'));
      await flush(el);

      el.goTo(3);
      await el.updateComplete;

      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots[3].getAttribute('aria-current')).toBe('true');
      expect(dots[0].getAttribute('aria-current')).toBeNull();

      const live = shadowQuery<HTMLElement>(el, '.live-region');
      expect(live?.textContent?.trim()).toBe('Slide 4 of 4');
    });

    it('custom-width: slidesPerMove > 1 lands on the last slide via a partial final move without overshoot', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel
          slides-per-page="2"
          slides-per-move="2"
          style="display: block; width: 400px; --hx-carousel-slide-width: 250px;"
        >
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_maxIndex']).toBe(3);

      el.next(); // 0 -> 2
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      el.next(); // 2 -> 4, clamped to 3 (partial final move)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      // No overshoot: the translate is saturated at maxScroll.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-el['_measuredMaxScroll'], 0);
    });

    it('custom-width (wider than 1/slidesPerPage, 300px): every slide reachable and last slide flush', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 300px;'));
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // all selectable
      // content = 4*300 = 1200, viewport = 400 -> maxScroll = 800.
      expect(el['_measuredMaxScroll']).toBeCloseTo(800, 0);

      el.goTo(3);
      await el.updateComplete;
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-800, 0);

      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      expect(slides[3].getBoundingClientRect().right).toBeCloseTo(
        vp.getBoundingClientRect().right,
        0,
      );
    });

    it('custom-width + loop: navigation wraps without error or NaN', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel
          loop
          slides-per-page="2"
          style="display: block; width: 400px; --hx-carousel-slide-width: 150px;"
        >
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      // 4*150 = 600, maxScroll 200; every slide is individually selectable, so the
      // bound is n-1 = 3.
      expect(el['_maxIndex']).toBe(3);

      // Loop wraps over the full slide range: previous() from 0 lands on the last
      // slide (n-1 = 3), not the page bound.
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      el.next(); // wraps last slide -> 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      // goTo reaches the last slide; the translate saturates at maxScroll there.
      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(Number.isFinite(trackTranslate(track))).toBe(true);
    });

    it('custom-width: a runtime --hx-carousel-gap change is picked up lazily on navigation', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);

      // Initial gap = 0 -> step = 150, content = 600, maxScroll = 600 - 400 = 200.
      expect(el['_measuredOffsets'][1]).toBeCloseTo(150, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(200, 0);

      // Change ONLY the gap at runtime. The slides (150px) and host (400px) keep
      // their box sizes, so no ResizeObserver fires — only the lazy recompute on
      // navigation can pick this up.
      el.style.setProperty('--hx-carousel-gap', '20px');

      el.next(); // 0 -> 1; lazy recompute reads the new gap
      await el.updateComplete;

      // step = 150 + 20 = 170; content = 4*150 + 3*20 = 660; maxScroll = 660 - 400 = 260.
      expect(el['_measuredOffsets'][1]).toBeCloseTo(170, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(260, 0);

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      // index 1 * new step 170 = 170, still below maxScroll 260.
      expect(trackTranslate(track)).toBeCloseTo(-170, 0);

      // Disabled states stay correct after the runtime gap change.
      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(prev.disabled).toBe(false); // middle
      expect(next.disabled).toBe(false);

      // Navigating to the last slide saturates at the NEW maxScroll (no blank).
      el.goTo(3);
      await el.updateComplete;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-260, 0);
      expect(next.disabled).toBe(true); // last slide
    });

    // ── Gate: peek mode only on a real horizontal, non-exact-fill peek ──

    it('gate: genuine horizontal peek (150px in 400px) enables custom mode', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);
      // 4*150 = 600 > 400 -> genuine peek (measured nav). Every slide is
      // individually selectable, so the bound is n-1 = 3 (the trailing slides share
      // the saturated end frame but remain distinct selections).
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);
    });

    it('gate: a uniform custom width that fills the viewport exactly is a single page', async () => {
      // 2 * 200px = 400px = viewport -> nothing overflows -> single static page
      // (the old first-slide exact-fill reset would have wrongly chosen legacy).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: 200px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!.disabled).toBe(true);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!.disabled).toBe(true);

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(0, 0); // nothing to scroll
    });

    it('single page: narrow custom widths that all fit the viewport disable navigation', async () => {
      // 4 * 80px = 320px content < 400px viewport -> nothing to scroll.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 80px;'));
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);

      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(prev.disabled).toBe(true);
      expect(next.disabled).toBe(true);

      // next() / goTo(3) / End are all no-ops — no unreachable slide is selectable.
      el.next();
      el.goTo(3);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      // Translate stays 0 and pagination advertises no unreachable slides.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(0, 0);
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(0);
    });

    it('single page: 2 slides with slides-per-page=3 (content fits) disable navigation', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="3" style="display: block; width: 400px; --hx-carousel-slide-width: 100px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      // 2 * 100px = 200px content < 400px viewport -> single page.
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!.disabled).toBe(true);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!.disabled).toBe(true);
    });

    it('regression: overflowing custom-width content still gets full peek navigation', async () => {
      // 4 * 250px = 1000px content > 400px viewport -> genuine peek. Each index is
      // a distinct position (250 <= 400 < 500), so the bound is n-1 = 3.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 250px;'));
      await flush(el);
      expect(el['_singlePage']).toBe(false);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);
      expect(el['_measuredMaxScroll']).toBeGreaterThan(0);
      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3); // last slide reachable
    });

    it('mixed-size slides (horizontal): every slide reachable + flush, last flush at the trailing edge', async () => {
      // Per-item widths 100 / 200 / 300 (set on each item) -> content 600 > 400.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="1" style="display: block; width: 400px;">
          <hx-carousel-item style="--hx-carousel-slide-width: 100px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 200px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 300px;"><div style="height: 80px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // every slide reachable
      // Offsets follow the real (variable) widths: [0, 100, 300].
      expect(el['_measuredOffsets'][0]).toBeCloseTo(0, 0);
      expect(el['_measuredOffsets'][1]).toBeCloseTo(100, 0);
      expect(el['_measuredOffsets'][2]).toBeCloseTo(300, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(200, 0); // 600 - 400

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');

      el.goTo(1);
      await el.updateComplete;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-100, 0); // slide 1's real offset
      expect(slides[1].getBoundingClientRect().left).toBeCloseTo(vp.getBoundingClientRect().left, 0);

      el.goTo(2);
      await el.updateComplete;
      settle(track);
      // offset 300 saturates at maxScroll 200; the last slide's right edge is flush.
      expect(trackTranslate(track)).toBeCloseTo(-200, 0);
      expect(slides[2].getBoundingClientRect().right).toBeCloseTo(
        vp.getBoundingClientRect().right,
        0,
      );
    });

    it('detects a per-slide width override on a later slide (slide 0 default) and enables measured nav', async () => {
      // Slide 0 keeps the DEFAULT width (spp=1 -> 100% = 400px); slides 1 & 2 carry
      // per-slide --hx-carousel-slide-width overrides. The slide-0-only check would
      // miss these; the all-slides check enables measured nav so they align.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="1" style="display: block; width: 400px;">
          <hx-carousel-item><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 150px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 150px;"><div style="height: 80px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // measured bound n-1 -> every slide selectable
      // Offsets reflect the real per-slide sizes: slide 0 = 400px, then 150 each.
      expect(el['_measuredOffsets'][0]).toBeCloseTo(0, 0);
      expect(el['_measuredOffsets'][1]).toBeCloseTo(400, 0);
      expect(el['_measuredOffsets'][2]).toBeCloseTo(550, 0);

      // The later variable-width slides are reachable and land flush.
      const t = shadowQuery<HTMLElement>(el, '.track')!;
      const v = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      el.goTo(2);
      await el.updateComplete;
      settle(t);
      expect(el['_currentIndex']).toBe(2);
      // content 700, maxScroll 300; offset 550 saturates there, last slide flush right.
      expect(items[2].getBoundingClientRect().right).toBeCloseTo(v.getBoundingClientRect().right, 0);
    });

    it('regression guard: no slide carries a custom width -> stays legacy (measured nav off)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(1); // legacy n - slidesPerPage
    });

    it('regression: mixed widths whose first slides-per-page slides exact-fill are NOT treated as legacy', async () => {
      // 200 / 200 / 300 in a 400px viewport, slides-per-page=2: the first 2 slides
      // (200+200) exactly fill the viewport — the old first-slide pageExtent gate
      // wrongly reset to legacy (maxIndex 1), stranding the 300px last slide.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item style="--hx-carousel-slide-width: 200px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 200px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 300px;"><div style="height: 80px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      // Real content (700) overflows -> peek; the 300px last slide is reachable.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2);
      expect(el['_measuredOffsets'][0]).toBeCloseTo(0, 0);
      expect(el['_measuredOffsets'][1]).toBeCloseTo(200, 0);
      expect(el['_measuredOffsets'][2]).toBeCloseTo(400, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(300, 0); // 700 - 400

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');

      el.goTo(2); // reach the last slide
      await el.updateComplete;
      settle(track);
      // offset 400 saturates at maxScroll 300; the 300px last slide is flush at the trailing edge.
      expect(el['_currentIndex']).toBe(2);
      expect(trackTranslate(track)).toBeCloseTo(-300, 0);
      expect(slides[2].getBoundingClientRect().right).toBeCloseTo(
        vp.getBoundingClientRect().right,
        0,
      );
    });

    it('uniform exact-fill multi-page: every slide is individually selectable (n-1 bound)', async () => {
      // 6 slides at calc(50% - 8px) = 192px + 16px gap, 400px viewport (2-up
      // exact-fill: 2*192 + 16 = 400). Content overflows -> measured peek; every
      // slide is individually selectable, so the bound is n-1 = 5. Indices 4 and 5
      // share the saturated end frame but remain distinct accessible selections.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);

      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false);
      // offsets [0,208,416,624,832,1040], content 1232, maxScroll 832.
      expect(el['_measuredMaxScroll']).toBeCloseTo(832, 0);
      expect(el['_maxIndex']).toBe(5); // n - 1, every slide selectable

      // End / goTo reach the true last slide (5); _canGoNext is false there.
      el.goTo(5);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);
      el.goTo(0);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);
      expect(el['_canGoNext']).toBe(false); // disabled at the last slide

      // At the saturated end the track sits at maxScroll; the last slide is flush.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-832, 0);
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      expect(slides[5].getBoundingClientRect().right).toBeCloseTo(
        vp.getBoundingClientRect().right,
        0,
      );
    });

    it('single oversized slide (wider than the viewport): the lone slide is selectable (n-1 = 0)', async () => {
      // One 600px slide in a 400px viewport: the only index is 0, so the bound is
      // n-1 = 0 (the single slide).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel style="display: block; width: 400px; --hx-carousel-slide-width: 600px;">
          <hx-carousel-item><div style="height: 80px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false); // maxScroll = 600 - 400 = 200 > 0
      expect(el['_measuredMaxScroll']).toBeCloseTo(200, 0);
      expect(el['_maxIndex']).toBe(0); // fallback n - 1
    });

    it('reachability: 1-up vertical makes every slide individually selectable (n-1 bound)', async () => {
      // 4 * 50px vertical, 120px viewport, slides-per-page=1. maxScroll is 80
      // (offset[2]=100 saturates it), but every slide is individually selectable, so
      // the bound is n-1 = 3 — slide 4 is reachable, sharing the saturated end frame.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" style="display: block; width: 300px;">
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!.style.height = '120px';
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // n - 1, every slide selectable

      // goTo(3) / End / the last pagination dot all land on index 3.
      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      el.goTo(0);
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(4); // one dot per slide
      dots[3].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('clamp: absolute goTo / End / dots clamp to the bound even in loop mode (no wrap)', async () => {
      // 6-slide exact-fill (192px + 16px gap) loop, slides-per-page=2 -> _maxIndex 5 (n-1).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_maxIndex']).toBe(5);

      // End -> goTo(slides.length - 1 = 5) lands on the last slide (absolute clamp,
      // NOT wrapped to 0 via 5 % 6).
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // An out-of-range absolute goTo clamps to the bound (no wrap).
      el.goTo(6);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // A pagination dot click lands on its own index (absolute clamp).
      el.goTo(0);
      await el.updateComplete;
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(6); // one dot per slide
      dots[3].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      // Relative wrap over the full slide range: next() from the last slide -> 0;
      // previous() from 0 -> the last slide.
      el.goTo(5);
      await el.updateComplete;
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);
    });

    it('removing a custom slide width resets measured mode on the next navigation (no resize needed)', async () => {
      // 6 slides at calc(50% - 8px) = 192px + 16px gap, spp=2 -> measured (exact-fill).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(5); // n - 1, every slide selectable
      // Measured pagination: one dot per slide = 6.
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(6);

      // Remove the custom width. The default computed width is calc((100% - 16px)/2)
      // = 192px = identical geometry, so NO box resizes (the ResizeObserver does
      // not fire) — only the lazy on-navigation refresh can reset the mode.
      el.style.removeProperty('--hx-carousel-slide-width');
      expect(el['_measuredNav']).toBe(true); // still stale before navigation

      // Navigation re-derives: _hasCustomSlideWidth() is now false, so measured
      // mode resets to the default/legacy model even without a resize.
      el.goTo(1);
      await el.updateComplete;
      expect(el['_measuredNav']).toBe(false);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(4); // legacy n - slidesPerPage = 6 - 2
      expect(el['_currentIndex']).toBe(1);
      // Default pagination: one dot per slide = 6 (unchanged from measured).
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(6);
    });

    it('measured->legacy flip with no resize clamps a stranded measured-only index on next()', async () => {
      // 6 slides at calc(50% - 8px) = 192px + 16px gap, spp=2 -> measured nav,
      // _maxIndex 5 (n-1). Sit on a measured-ONLY index (5) that the legacy model
      // (n - slidesPerPage = 4) cannot reach.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(5);
      el.goTo(5); // the measured-only last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // Remove the custom width. The default computed width is calc((100% - 16px)/2)
      // = 192px = identical geometry, so NO box resizes (the ResizeObserver never
      // fires) — the flip back to legacy can only happen on the next navigation.
      el.style.removeProperty('--hx-carousel-slide-width');
      expect(el['_measuredNav']).toBe(true); // still stale before navigation

      // Before the fix: next()'s refresh flipped _measuredNav off but left
      // _currentIndex at the stranded 5, so the legacy guard (nextIndex 6 > max 4)
      // returned and left an impossible index — a visible no-op. Now the refresh
      // clamps 5 -> 4 first, so next() produces a real move into the legacy range.
      el.next();
      await el.updateComplete;
      expect(el['_measuredNav']).toBe(false);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(4); // legacy n - slidesPerPage = 6 - 2
      expect(el['_currentIndex']).toBe(4); // clamped from the stranded 5 (real move)

      // The transform is consistent with the legacy last page (slides 5 & 6): the
      // 192px slides + 16px gaps make a 1232px track, so index 4 sits at the flush
      // trailing position (1232 - 400 = 832) with the last slide flush, no
      // over-scroll. The live region no longer reads the stranded "Slide 6 of 6".
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-832, 0);
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      expect(slides[5].getBoundingClientRect().right).toBeCloseTo(vp.getBoundingClientRect().right, 0);
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 5 of 6');

      // The clamped index is now a valid legacy index: prev/next behave normally.
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(next.disabled).toBe(true); // at the legacy bound
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3); // a real legacy step back
    });

    it('emits exactly one hx-slide-change when a nav-time clamp is the terminal change', async () => {
      // 6-slide 2-up measured carousel parked on the measured-only index 5. After a
      // no-resize flip back to legacy (_maxIndex 4), next() clamps 5 -> 4 and the
      // legacy guard no-ops the move: the clamp is the FINAL change, so exactly one
      // hx-slide-change must fire for index 4 (not zero — hosts must not stay stale).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      el.goTo(5);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      const events: number[] = [];
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      // Remove the custom width (fallback = identical 192px geometry, no resize).
      el.style.removeProperty('--hx-carousel-slide-width');
      el.next(); // flips to legacy, clamps 5 -> 4, the legacy guard no-ops the move
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(4);
      expect(events).toEqual([4]); // exactly one event for the terminal clamp
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 5 of 6');

      // goTo(currentIndex) is a true no-op now (no clamp, no move) -> no extra event.
      events.length = 0;
      el.goTo(4);
      await el.updateComplete;
      expect(events).toEqual([]);

      // A real move emits exactly its destination (no double-emit from the wrapper).
      el.goTo(1);
      await el.updateComplete;
      expect(events).toEqual([1]);
    });

    it('measured pagination renders one dot per slide (every slide selectable)', async () => {
      // Uniform exact-fill 6 slides (192px + 16px gap), 400px viewport -> _maxIndex 5 (n-1).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_maxIndex']).toBe(5);

      // One dot per slide = 6 — every slide is individually selectable.
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(6);

      // The last dot maps to index 5 and becomes active when selected.
      dots[5].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);
      expect(dots[5].getAttribute('aria-current')).toBe('true');
    });

    it('measured pagination keeps one dot per slide (every slide selectable)', async () => {
      // 4 * 250px peek -> measured nav, bound n-1 = 3 -> n dots.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 250px;'));
      await flush(el);
      expect(el['_maxIndex']).toBe(3);
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(4);
    });

    it('measured pagination dot labels use the real slide count, agreeing with the live region', async () => {
      // 4 * 150px in 400px -> measured nav, bound n-1 = 3 -> one dot per slide; dot
      // labels say "of 4" and the last dot lands on the last slide.
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);
      expect(el['_maxIndex']).toBe(3);

      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(4); // one dot per slide
      // Each dot's "of N" total is the real slide count (4).
      dots.forEach((dot, i) => {
        expect(dot.getAttribute('aria-label')).toBe(`Slide ${i + 1} of 4`);
      });

      // Landing on the last dot announces the SAME total via the live region.
      dots[dots.length - 1].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      expect(dots[3].getAttribute('aria-label')).toBe('Slide 4 of 4');
      expect(shadowQuery<HTMLElement>(el, '.live-region')?.textContent?.trim()).toBe('Slide 4 of 4');
    });

    it('default-mode pagination dot labels are unchanged (one dot per slide, "of N" = slide count)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots.length).toBe(3); // one per slide
      expect(dots[0].getAttribute('aria-label')).toBe('Slide 1 of 3');
      expect(dots[2].getAttribute('aria-label')).toBe('Slide 3 of 3');
    });

    it('measured loop wraps over the full slide range and agrees with goTo', async () => {
      // 4 * 150px, _maxIndex 3 (n-1); offsets [0,150,300,450], maxScroll 200.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: 150px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);

      // previous() from 0 wraps to the last slide (n-1 = 3).
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      // next() from the last slide wraps to 0 (relative wrap).
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      // Absolute goTo CLAMPS even in loop mode (does NOT wrap): an out-of-range
      // target lands on the last slide, not back to 0.
      el.goTo(4);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('measured loop with slidesPerMove > 1 reaches the last slide before wrapping', async () => {
      // 6 uniform exact-fill slides (192px + 16px gap), 2-up, loop, slides-per-move=2.
      // _maxIndex is 5 (n-1). A raw 0->2->4->0 modulo would skip the last slide; the
      // partial-final-step rule lands on 5 first, then wraps to 0 on the next step.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" slides-per-move="2" style="display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(5);

      // Forward cycle: 0 -> 2 -> 4 -> 5 (partial final step) -> 0 (wrap).
      const forward: number[] = [el['_currentIndex']];
      for (let i = 0; i < 4; i++) {
        el.next();
        await el.updateComplete;
        forward.push(el['_currentIndex']);
      }
      expect(forward).toEqual([0, 2, 4, 5, 0]);

      // The last slide (5) is genuinely reached, not skipped.
      expect(forward).toContain(5);

      // Backward cycle from 0 is symmetric: 0 -> 5 (wrap) -> 3 -> 1 -> 0 (partial).
      el.goTo(0);
      await el.updateComplete;
      const backward: number[] = [el['_currentIndex']];
      for (let i = 0; i < 4; i++) {
        el.previous();
        await el.updateComplete;
        backward.push(el['_currentIndex']);
      }
      expect(backward).toEqual([0, 5, 3, 1, 0]);

      // Across both directions every index in [0, _maxIndex] is reachable.
      const reached = new Set([...forward, ...backward]);
      expect([0, 1, 2, 3, 4, 5].every((i) => reached.has(i))).toBe(true);
    });

    it('measured loop with slidesPerMove > 1, odd slide count: last slide reachable', async () => {
      // 5 slides, 2-up, loop, slides-per-move=2. _maxIndex 4 (n-1). Forward:
      // 0 -> 2 -> 4 -> 0; the last slide (4) lands exactly (no partial needed here),
      // and wrapping happens from 4. Confirms odd counts also reach the end.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" slides-per-move="2" style="display: block; width: 400px; --hx-carousel-slide-width: 150px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(4);

      const seq: number[] = [el['_currentIndex']];
      for (let i = 0; i < 3; i++) {
        el.next();
        await el.updateComplete;
        seq.push(el['_currentIndex']);
      }
      expect(seq).toEqual([0, 2, 4, 0]);
      expect(seq).toContain(4); // the last slide is reached, not skipped
    });

    it('regression guard: default (no custom width) loop wraps over the full slide count', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="1" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(false); // default legacy

      // Legacy loop wraps over slides.length: previous() from 0 -> last slide (2).
      el.previous();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      // And n dots (one per slide), unchanged.
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(3);
    });

    it('regression guard: default (no custom width) keeps the legacy slidesPerPage bound', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      // No --hx-carousel-slide-width -> legacy model, unchanged by this fix.
      expect(el['_measuredNav']).toBe(false);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // n - slidesPerPage
    });

    // ── Legacy-loop ABSOLUTE navigation reaches every slide (regression: P1) ──
    // origin/main's looped goTo wrapped via modulo over the FULL slide range, so
    // End/goTo/dots could reach ANY slide. The refactor clamped the absolute branch
    // to the legacy `_maxIndex` (n - slidesPerPage) page bound, stranding the last
    // `slidesPerPage - 1` slides. These guard that legacy loop matches origin/main.
    const legacyLoopSixSlides = `
      <hx-carousel loop slides-per-page="2" style="display: block; width: 400px;">
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
        <hx-carousel-item>4</hx-carousel-item>
        <hx-carousel-item>5</hx-carousel-item>
        <hx-carousel-item>6</hx-carousel-item>
      </hx-carousel>
    `;

    it('legacy loop: End key reveals the LAST slide (index 5), not the page bound (index 4)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlides);
      await flush(el);
      // Default horizontal -> legacy model. The SELECTION bound is n - 1 in legacy
      // loop (every slide reachable); the translate saturates at the page bound.
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(5); // legacy loop selection bound = n - 1

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      // Before the fix this clamped to 4; legacy loop must reach the last slide.
      expect(el['_currentIndex']).toBe(5);
    });

    it('legacy loop: the last pagination dot selects the last slide (index 5)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlides);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      // One dot per slide (unchanged from origin/main).
      expect(dots.length).toBe(6);
      dots[5].click();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);
    });

    it('legacy loop: goTo(last) reaches the last slide, goTo past-end wraps via modulo (origin/main parity)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlides);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);

      // Absolute goTo to the last slide lands on it (not clamped to the page bound).
      el.goTo(5);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // Past-end absolute target wraps via modulo over slides.length (6) like
      // origin/main: goTo(6) -> 0, goTo(7) -> 1.
      el.goTo(6);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
      el.goTo(7);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);
    });

    it('legacy loop: relative next() from the last slide still wraps to 0 (unchanged)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlides);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);

      el.goTo(5); // last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // Relative wrap is governed by the (untouched) `loop && wrap` branch.
      el.next();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('regression guard: measured-nav loop absolute goTo still CLAMPS to n-1 (this fix is legacy-only)', async () => {
      // 4 * 150px peek -> measured nav, _maxIndex = n-1 = 3. Measured mode keeps the
      // absolute clamp; the legacy-loop modulo branch must NOT apply here.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: 150px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);

      // Past-end absolute target clamps to the last slide (does NOT wrap to 0).
      el.goTo(4);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('legacy loop: selection reaches the last slide while the track translate saturates at the last full page (no over-scroll)', async () => {
      // 6 slides, 2-up, loop, 400px wide -> legacy model, page bound _maxIndex = 4,
      // each slide 200px. goTo(5) selects the last slide; the translate must NOT
      // over-scroll to -5*200 = -1000px (empty trailing space) — it saturates at
      // the last full page (-4*200 = -800px, showing slides 4 & 5).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
          <hx-carousel-item>6</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(5); // legacy loop SELECTION bound = n - 1

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const trackW = track.getBoundingClientRect().width; // 400
      const pageStep = trackW / 2; // 200px per slide at slides-per-page=2

      el.goTo(5);
      await el.updateComplete;
      settle(track);

      // Selection / ARIA / dots reach the last slide.
      expect(el['_currentIndex']).toBe(5);
      // Translate is clamped to the page-bound index (4), saturating at the last
      // full page: -4 * 200 = -800px, NOT -5 * 200 = -1000px.
      expect(trackTranslate(track)).toBeCloseTo(-4 * pageStep, 0);
    });

    it('legacy loop: a last-slide selection is STABLE across a recompute — no snap-back, no spurious event (root fix)', async () => {
      // Root cause of the prior rounds: legacy-loop `_maxIndex` was the page bound,
      // so `_recomputeBounds` clamped a last-slide selection back to it (and emitted
      // a spurious hx-slide-change) on every resize/slot recompute. With the
      // selection bound now n - 1, the selection must survive a recompute untouched.
      const el = await fixture<HelixCarousel>(legacyLoopSixSlides);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(5);

      el.goTo(5); // select the last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      // A recompute (what a ResizeObserver fire / slot recompute runs) must NOT
      // snap the index back NOR emit an event.
      let spurious = 0;
      el.addEventListener('hx-slide-change', () => {
        spurious++;
      });
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(5); // stable, no snap-back to the page bound
      expect(spurious).toBe(0); // no spurious clamp event
    });

    it('legacy loop with NO overflow (slides <= slidesPerPage): bound is 0, no phantom navigation', async () => {
      // 2 slides, slides-per-page=2 -> the track fits, nothing overflows. On the
      // unmeasured default path `_singlePage` never flips, so the loop selection
      // bound must collapse to 0 (not n - 1) — otherwise next/End would advance the
      // index and emit hx-slide-change while the translate is pinned at page 0.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(0); // non-overflowing loop collapses to 0

      // Both directions are disabled (nothing to scroll).
      expect(el['_canGoNext']).toBe(false);
      expect(el['_canGoPrev']).toBe(false);

      // next() / End must be a no-op AND emit no hx-slide-change.
      let events = 0;
      el.addEventListener('hx-slide-change', () => {
        events++;
      });
      el.next();
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
      expect(events).toBe(0);
    });

    it('non-scrollable loop (slides <= slidesPerPage): renders NO pagination dots (dead controls suppressed)', async () => {
      // 2 slides, slides-per-page=2, loop -> _maxIndex 0 (non-scrollable). The dots
      // could not change the active index, so pagination is omitted entirely.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_maxIndex']).toBe(0);
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(0);
      expect(shadowQuery(el, '[part="pagination"]')).toBeNull();
    });

    it('scrollable loop (slides > slidesPerPage): still renders one pagination dot per slide', async () => {
      // Guard: a genuinely scrollable carousel (_maxIndex > 0) keeps its dots.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel loop slides-per-page="2" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_maxIndex']).toBeGreaterThan(0);
      expect(shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]').length).toBe(4);
    });

    // ── Legacy-loop partial-step wrapping with slidesPerMove > 1 (regression: P2) ──
    // Legacy loop relative nav used raw modulo, so a newly-reachable last slide was
    // skipped when slidesPerMove shares a factor with the slide count. Legacy loop
    // now shares the measured `_relativeLoopTarget` partial-step logic.
    const legacyLoopSixSlidesPerMove2 = `
      <hx-carousel loop slides-per-page="2" slides-per-move="2" style="display: block; width: 400px;">
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
        <hx-carousel-item>4</hx-carousel-item>
        <hx-carousel-item>5</hx-carousel-item>
        <hx-carousel-item>6</hx-carousel-item>
      </hx-carousel>
    `;

    it('legacy loop, slides-per-move=2: repeated next() lands on the last slide before wrapping (0→2→4→5→0)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlidesPerMove2);
      await flush(el);
      expect(el['_measuredNav']).toBe(false); // default legacy model
      expect(el['_maxIndex']).toBe(5); // selection bound n - 1

      const seq: number[] = [el['_currentIndex']];
      for (let i = 0; i < 4; i++) {
        el.next();
        await el.updateComplete;
        seq.push(el['_currentIndex']);
      }
      // Partial final step lands on 5, then wraps to 0 — never skips the last slide.
      expect(seq).toEqual([0, 2, 4, 5, 0]);
      expect(seq).toContain(5);
    });

    it('legacy loop, slides-per-move=2: goTo(5) then next() wraps to 0 (not 1 via raw modulo)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlidesPerMove2);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);

      el.goTo(5); // the last slide
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(5);

      el.next(); // from the last slide, the next step wraps to 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('legacy loop, slides-per-move=2: previous() symmetry lands on the last slide before wrapping (0→5→3→1→0)', async () => {
      const el = await fixture<HelixCarousel>(legacyLoopSixSlidesPerMove2);
      await flush(el);
      expect(el['_measuredNav']).toBe(false);

      const seq: number[] = [el['_currentIndex']];
      for (let i = 0; i < 4; i++) {
        el.previous();
        await el.updateComplete;
        seq.push(el['_currentIndex']);
      }
      // From 0, previous wraps to the last slide (5) first, then steps back.
      expect(seq).toEqual([0, 5, 3, 1, 0]);

      // Every index in [0, _maxIndex] is reachable across both directions.
      const forward: number[] = [0];
      el.goTo(0);
      await el.updateComplete;
      for (let i = 0; i < 4; i++) {
        el.next();
        await el.updateComplete;
        forward.push(el['_currentIndex']);
      }
      const reached = new Set([...seq, ...forward]);
      expect([0, 1, 2, 3, 4, 5].every((i) => reached.has(i))).toBe(true);
    });

    it('mixed-size slides that all fit the viewport are a single static page', async () => {
      // 50 + 60 + 70 = 180px < 400px viewport.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel style="display: block; width: 400px;">
          <hx-carousel-item style="--hx-carousel-slide-width: 50px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 60px;"><div style="height: 80px"></div></hx-carousel-item>
          <hx-carousel-item style="--hx-carousel-slide-width: 70px;"><div style="height: 80px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!.disabled).toBe(true);
    });

    it('gate: vertical uses measured block-axis nav; the cross-axis slide-width does not drive the step', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel
          orientation="vertical"
          slides-per-page="2"
          style="display: block; width: 400px; --hx-carousel-slide-width: 150px;"
        >
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      // Constrain the viewport so the 200px of content overflows (70px viewport).
      // Every slide is individually selectable -> bound n-1 = 3.
      shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!.style.height = '70px';
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // every slide selectable on the block axis

      // Step is the block-axis extent (slide height 50 + row-gap 0), NOT the
      // cross-axis 150px width hook.
      expect(el['_measuredOffsets'][1]).toBeCloseTo(50, 0);

      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3); // last slide reachable
    });

    // ── Drag and autoplay honor the peek model (they route through next/goTo) ──

    it('custom-width: mouse drag reaches the last slide without overshoot and returns to 0', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel
          mouse-dragging
          slides-per-page="2"
          style="display: block; width: 400px; --hx-carousel-slide-width: 250px;"
        >
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true);

      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      const dragNext = (): void => {
        vp.dispatchEvent(
          new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
        );
        vp.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, bubbles: true }));
        vp.dispatchEvent(new MouseEvent('mouseup', { clientX: 120, bubbles: true }));
      };
      const dragPrev = (): void => {
        vp.dispatchEvent(
          new MouseEvent('mousedown', { clientX: 120, bubbles: true, cancelable: true }),
        );
        vp.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, bubbles: true }));
        vp.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, bubbles: true }));
      };

      dragNext(); // 0 -> 1
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(1);

      dragNext(); // 1 -> 2
      dragNext(); // 2 -> 3 (last)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      dragNext(); // at last: next() clamps -> no-op
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      // No overshoot into blank: translate saturated at maxScroll.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-el['_measuredMaxScroll'], 0);

      dragPrev(); // 3 -> 2
      dragPrev(); // 2 -> 1
      dragPrev(); // 1 -> 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('custom-width: autoplay advances through slides and wraps without overshoot', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixCarousel>(`
          <hx-carousel
            autoplay
            autoplay-interval="1000"
            slides-per-page="2"
            style="display: block; width: 400px; --hx-carousel-slide-width: 250px;"
          >
            <hx-carousel-item>1</hx-carousel-item>
            <hx-carousel-item>2</hx-carousel-item>
            <hx-carousel-item>3</hx-carousel-item>
            <hx-carousel-item>4</hx-carousel-item>
          </hx-carousel>
        `);
        await flush(el);
        expect(el['_measuredNav']).toBe(true);
        expect(el['_isPlaying']).toBe(true);

        vi.advanceTimersByTime(1100); // 0 -> 1
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(1);

        vi.advanceTimersByTime(1000); // 1 -> 2
        vi.advanceTimersByTime(1000); // 2 -> 3 (last selectable)
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(3);

        // Saturated at maxScroll — no overshoot into blank.
        const track = shadowQuery<HTMLElement>(el, '.track')!;
        settle(track);
        expect(trackTranslate(track)).toBeCloseTo(-el['_measuredMaxScroll'], 0);

        vi.advanceTimersByTime(1000); // non-loop: wraps back to the start
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    // ── Gate transitions on a runtime gap change (lazy re-detect, both ways) ──

    // 3 * 130px = 390px slides in a 400px viewport: gap 0 fits (single page),
    // a gap makes them overflow (genuine peek). The gap change resizes no slide
    // box — only the gap sentinel — so it mirrors a real theme/media-query flip.
    const threeNarrow = (gapPx: number) => `
      <hx-carousel style="display: block; width: 400px; --hx-carousel-slide-width: 130px; --hx-carousel-gap: ${gapPx}px;">
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
      </hx-carousel>
    `;

    it('gate transition: single-page -> peek on a runtime gap change is detected via next()', async () => {
      const el = await fixture<HelixCarousel>(threeNarrow(0));
      await flush(el);
      // 390 < 400 -> single page; next() is a no-op.
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);

      // Grow the gap so the slides overflow -> genuine peek (390 + 2*40 = 470 > 400).
      el.style.setProperty('--hx-carousel-gap', '40px');

      // next() re-detects peek (refresh before its guard) and advances. Measured
      // bound is n-1 = 2 -> every slide selectable.
      el.next();
      await el.updateComplete;
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2);
      expect(el['_currentIndex']).toBe(1); // advanced from 0
    });

    it('gate transition: peek -> single-page on a runtime gap change disables navigation and clamps', async () => {
      const el = await fixture<HelixCarousel>(threeNarrow(40));
      await flush(el);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // measured bound n-1 = 2, every slide selectable

      el.goTo(2); // reach the last slide in peek mode
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Remove the gap so the slides fit -> single page. Navigation re-detects it.
      el.style.setProperty('--hx-carousel-gap', '0px');
      el.goTo(0);
      await el.updateComplete;
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(el['_currentIndex']).toBe(0); // collapsed to the single page
    });

    it('index-clamp invariant: a flip to single-page clamps a peek-only index back into range', async () => {
      const el = await fixture<HelixCarousel>(threeNarrow(40));
      await flush(el);
      expect(el['_maxIndex']).toBe(2); // measured bound n-1 = 2

      el.goTo(2); // the last slide (a peek-only index relative to single-page)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Flip to single-page (no box resizes); drive a recompute as the
      // ResizeObserver / slotchange path would. The invariant clamps 2 -> 0
      // without any manual navigation.
      el.style.setProperty('--hx-carousel-gap', '0px');
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(el['_currentIndex']).toBe(0); // clamped by the invariant

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(0, 0); // nothing to scroll
    });

    // Let the ResizeObserver deliver (it fires after layout, before paint).
    function nextFrame(): Promise<void> {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    }

    it('reactive bounds: a runtime gap change flipping single-page -> peek re-enables Next with no navigation', async () => {
      const el = await fixture<HelixCarousel>(threeNarrow(0));
      await flush(el);

      // 390 < 400 -> single page; Next disabled.
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(el['_singlePage']).toBe(true);
      expect(next.disabled).toBe(true);

      // Grow the gap into a genuine peek. Resizes no slide box; do NOT navigate or
      // resize the host — only the gap sentinel changes size.
      el.style.setProperty('--hx-carousel-gap', '40px');
      await nextFrame(); // ResizeObserver (gap sentinel) delivers -> _recomputeBounds runs
      await el.updateComplete;

      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // measured bound n-1 = 2
      expect(el['_canGoNext']).toBe(true);
      expect(next.disabled).toBe(false); // re-enabled reactively, no navigation
    });

    it('emits hx-slide-change exactly once when a recompute clamps the active index; none on init or no-op', async () => {
      const events: number[] = [];
      // Build manually so the listener is attached before the element connects,
      // proving initial setup emits nothing.
      const el = document.createElement('hx-carousel') as HelixCarousel;
      // 4 * 90px = 360px; gap 20 -> 360 + 3*20 = 420 > 400 -> peek. Measured bound
      // is n-1 = 3 -> every slide selectable.
      el.style.cssText =
        'display: block; width: 400px; --hx-carousel-slide-width: 90px; --hx-carousel-gap: 20px;';
      el.innerHTML = `
        <hx-carousel-item>1</hx-carousel-item>
        <hx-carousel-item>2</hx-carousel-item>
        <hx-carousel-item>3</hx-carousel-item>
        <hx-carousel-item>4</hx-carousel-item>`;
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );
      document.getElementById('test-fixture-container')!.appendChild(el);
      await el.updateComplete;
      await el.updateComplete;

      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(3);
      expect(events).toEqual([]); // no event during initial setup

      el.goTo(3); // the last slide (reachable)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      expect(events).toEqual([3]); // the navigation event
      events.length = 0;

      // Responsive flip to single-page (remove the gap; 360 < 400). Recompute
      // clamps the out-of-range index 3 -> 0.
      el.style.setProperty('--hx-carousel-gap', '0px');
      el['_recomputeBounds']();
      await el.updateComplete;
      expect(el['_singlePage']).toBe(true);
      expect(el['_currentIndex']).toBe(0);
      expect(events).toEqual([0]); // exactly one clamp event with the clamped index

      events.length = 0;
      el['_recomputeBounds'](); // no index change
      await el.updateComplete;
      expect(events).toEqual([]); // none on a no-op recompute
    });

    it('reactive bounds: a runtime slides-per-page change re-derives the legacy bound, clamps the index, and emits once', async () => {
      const events: number[] = [];
      // Default (no custom slide-width) -> legacy page model, where slides-per-page
      // drives the bound (n - slidesPerPage).
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="1" style="display: block; width: 400px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
          <hx-carousel-item>5</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      expect(el['_measuredNav']).toBe(false); // default legacy model
      expect(el['_maxIndex']).toBe(4); // 5 - 1

      el.goTo(4);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(4);
      expect(events).toEqual([4]);
      events.length = 0;

      // Increase slides-per-page -> legacy bound shrinks to 5 - 3 = 2 -> clamp 4 -> 2.
      el.slidesPerPage = 3;
      await flush(el);

      expect(el['_maxIndex']).toBe(2);
      expect(el['_currentIndex']).toBe(2); // clamped 4 -> 2
      expect(el['_canGoNext']).toBe(false);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!.disabled).toBe(true);
      expect(events).toEqual([2]); // exactly one clamp event
    });

    it('re-syncs per-item slide widths when slides-per-page changes at runtime (2 <-> 3)', async () => {
      const el = await fixture<HelixCarousel>(
        `<hx-carousel slides-per-page="2" style="display: block; width: 600px;">${'<hx-carousel-item>x</hx-carousel-item>'.repeat(
          6,
        )}</hx-carousel>`,
      );
      await flush(el);
      const items = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;

      // 2-up (gap 0): each slide = 50% of 600 = 300px; legacy maxIndex = 6 - 2 = 4.
      expect(items[0].getBoundingClientRect().width).toBeCloseTo(300, 0);
      expect(el['_maxIndex']).toBe(4);

      el.slidesPerPage = 3;
      await flush(el);

      // 3-up: each slide is re-synced to 1/3 of 600 = 200px (NOT the stale 300px);
      // legacy maxIndex = 6 - 3 = 3.
      expect(items[0].getBoundingClientRect().width).toBeCloseTo(200, 0);
      expect(el['_maxIndex']).toBe(3);
      expect(el['_canGoNext']).toBe(true);

      // At the new last page the active slide lands flush (per-item width and the
      // transform step both use n = 3, so no clip / no blank).
      el.goTo(3);
      await el.updateComplete;
      settle(track);
      expect(items[3].getBoundingClientRect().left).toBeCloseTo(vp.getBoundingClientRect().left, 0);
      expect(items[5].getBoundingClientRect().right).toBeCloseTo(vp.getBoundingClientRect().right, 0);

      // Reverse 3 -> 2: widths and bounds return to the 2-up values.
      el.slidesPerPage = 2;
      await flush(el);
      expect(items[0].getBoundingClientRect().width).toBeCloseTo(300, 0);
      expect(el['_maxIndex']).toBe(4);
    });

    it('reactive bounds: a runtime orientation change re-derives the navigation model', async () => {
      const el = await fixture<HelixCarousel>(fourSlides());
      await flush(el);

      // Horizontal default: legacy page model.
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // n - slidesPerPage

      el.orientation = 'vertical';
      await flush(el);

      // Vertical re-derives to the measured block-axis model. These slides are
      // unconstrained, so the content fits the viewport -> a single static page.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
    });

    it('autoplay refreshes bounds before advancing: single-page -> peek lets it advance instead of staying put', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixCarousel>(`
          <hx-carousel
            autoplay
            autoplay-interval="1000"
            style="display: block; width: 400px; --hx-carousel-slide-width: 130px; --hx-carousel-gap: 0px;"
          >
            <hx-carousel-item>1</hx-carousel-item>
            <hx-carousel-item>2</hx-carousel-item>
            <hx-carousel-item>3</hx-carousel-item>
          </hx-carousel>
        `);
        await flush(el);
        // 3*130 = 390 < 400 -> single page; autoplay cannot advance.
        expect(el['_singlePage']).toBe(true);
        expect(el['_maxIndex']).toBe(0);

        vi.advanceTimersByTime(1100); // tick is a no-op (nothing to scroll)
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(0);

        // Grow the gap -> overflow -> peek (measured bound n-1 = 2);
        // synchronous, RO not fired yet.
        el.style.setProperty('--hx-carousel-gap', '40px');

        vi.advanceTimersByTime(1000); // tick refreshes first -> 0 < 2 -> advance
        await el.updateComplete;
        expect(el['_singlePage']).toBe(false);
        expect(el['_maxIndex']).toBe(2);
        expect(el['_currentIndex']).toBe(1); // advanced, not stuck
      } finally {
        vi.useRealTimers();
      }
    });

    it('no double hx-slide-change on a lazy mode-flip navigation (one event for the destination)', async () => {
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="2" style="display: block; width: 400px; --hx-carousel-slide-width: 200px; --hx-carousel-gap: 16px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      expect(el['_measuredNav']).toBe(true); // peek: 2*200 + 16 = 416 != 400
      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      const events: number[] = [];
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      // Flip to exact-fill (gap 0) and navigate immediately — the lazy nav-path
      // refresh sees the flip first (the ResizeObserver has not fired yet).
      el.style.setProperty('--hx-carousel-gap', '0px');
      el.goTo(0);
      await el.updateComplete;

      expect(el['_currentIndex']).toBe(0);
      // Exactly one event for the destination — NOT a clamp event [2] then [0].
      expect(events).toEqual([0]);
    });
  });

  // ─── Vertical: measured block-axis navigation ───

  describe('Vertical navigation (measured block-axis)', () => {
    // Four slides, each 50px tall on the block axis.
    const verticalSlides = (attrs = '', style = '') => `
      <hx-carousel orientation="vertical" slides-per-page="2" ${attrs}
        style="display: block; width: 300px;${style}">
        <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
        <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
        <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
        <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
      </hx-carousel>
    `;

    function trackTranslateY(track: HTMLElement): number {
      const t = getComputedStyle(track).transform;
      if (t === 'none') return 0;
      return new DOMMatrixReadOnly(t).m42;
    }
    function settle(track: HTMLElement): void {
      track.style.transition = 'none';
      void track.getBoundingClientRect();
    }
    async function flush(el: HelixCarousel): Promise<void> {
      await el.updateComplete;
      await el.updateComplete;
    }
    // The component has no viewport-height hook, so constrain it directly to
    // create a scrollable scenario (an unconstrained vertical viewport grows to
    // the content, so nothing overflows and the carousel is a single page).
    function constrainViewport(el: HelixCarousel, px: number): HTMLElement {
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      vp.style.height = `${px}px`;
      return vp;
    }
    // Mounts a vertical carousel whose content (4 * 50px [+ gaps] = 200px+)
    // overflows a constrained viewport, so it genuinely scrolls. The 70px
    // viewport (slideHeight <= viewport < 2*slideHeight) keeps every index a
    // visually-distinct position, so the bound is n-1 (every slide reachable).
    async function mountScrollable(attrs = '', style = '', vpPx = 70): Promise<HelixCarousel> {
      const el = await fixture<HelixCarousel>(verticalSlides(attrs, style));
      await flush(el);
      constrainViewport(el, vpPx);
      el['_recomputeBounds']();
      await el.updateComplete;
      return el;
    }

    it('default (scrollable): measured nav active, step = one slide height, every slide selectable', async () => {
      const el = await mountScrollable();
      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(3); // n - 1, every slide reachable
      expect(el['_measuredOffsets'][1]).toBeCloseTo(50, 0); // slide height + 0 row-gap
    });

    it('non-overflowing vertical content is a single static page (no degenerate nav)', async () => {
      // Unconstrained: the viewport grows to the content, so nothing scrolls.
      const el = await fixture<HelixCarousel>(verticalSlides());
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_singlePage']).toBe(true);
      expect(el['_maxIndex']).toBe(0);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!.disabled).toBe(true);
      expect(shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!.disabled).toBe(true);

      el.goTo(3);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0); // no degenerate advance to an unreachable slide
    });

    it('constrained viewport: one slide per step; last slide saturates flush with no clip', async () => {
      const el = await fixture<HelixCarousel>(verticalSlides());
      await flush(el);
      const vp = constrainViewport(el, 100); // shows 2 slides
      el['_recomputeBounds']();
      await el.updateComplete;
      // content = 4*50 = 200, viewport = 100 -> maxScroll = 100; step = 50.
      expect(el['_measuredMaxScroll']).toBeCloseTo(100, 0);

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      el.goTo(1);
      await el.updateComplete;
      settle(track);
      expect(trackTranslateY(track)).toBeCloseTo(-50, 0); // exactly one slide height

      el.goTo(3); // last slide -> saturate at maxScroll
      await el.updateComplete;
      settle(track);
      expect(trackTranslateY(track)).toBeCloseTo(-100, 0);

      // Last slide's bottom edge is flush with the viewport bottom (no overshoot).
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      expect(slides[3].getBoundingClientRect().bottom).toBeCloseTo(vp.getBoundingClientRect().bottom, 0);
    });

    it('mixed-size slides (vertical): per-slide offsets follow real heights; last slide flush', async () => {
      // Heights 50 / 60 / 70 -> content 180; constrained viewport 100 -> maxScroll 80.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel orientation="vertical" style="display: block; width: 300px;">
          <hx-carousel-item><div style="height: 50px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 60px"></div></hx-carousel-item>
          <hx-carousel-item><div style="height: 70px"></div></hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      const vp = constrainViewport(el, 100);
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_singlePage']).toBe(false);
      expect(el['_maxIndex']).toBe(2);
      // Offsets follow the variable heights: [0, 50, 110].
      expect(el['_measuredOffsets'][1]).toBeCloseTo(50, 0);
      expect(el['_measuredOffsets'][2]).toBeCloseTo(110, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(80, 0); // 180 - 100

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      el.goTo(1);
      await el.updateComplete;
      settle(track);
      expect(trackTranslateY(track)).toBeCloseTo(-50, 0); // slide 1's real offset

      el.goTo(2); // offset 110 saturates at maxScroll 80
      await el.updateComplete;
      settle(track);
      expect(trackTranslateY(track)).toBeCloseTo(-80, 0);
      const slides = el.querySelectorAll<HelixCarouselItem>('hx-carousel-item');
      expect(slides[2].getBoundingClientRect().bottom).toBeCloseTo(vp.getBoundingClientRect().bottom, 0);
    });

    it('row-gap: the measured step includes the block-axis gap', async () => {
      const el = await mountScrollable('', ' --hx-carousel-gap: 10px;');
      // step = slide height 50 + row-gap 10 = 60.
      expect(el['_measuredOffsets'][1]).toBeCloseTo(60, 0);
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      expect(getComputedStyle(track).rowGap).toBe('10px');
    });

    it('End/Home reach the last/first slide; pagination dot and ARIA track the index', async () => {
      const el = await mountScrollable();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      const dots = shadowQueryAll<HTMLButtonElement>(el, '[part="pagination-item"]');
      expect(dots[3].getAttribute('aria-current')).toBe('true');
      const live = shadowQuery<HTMLElement>(el, '.live-region');
      expect(live?.textContent?.trim()).toBe('Slide 4 of 4');

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
    });

    it('prev disabled at 0, next disabled at the last slide', async () => {
      const el = await mountScrollable();
      const prev = shadowQuery<HTMLButtonElement>(el, '[part="prev-button"]')!;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(prev.disabled).toBe(true);
      expect(next.disabled).toBe(false);
      el.goTo(3);
      await el.updateComplete;
      expect(prev.disabled).toBe(false);
      expect(next.disabled).toBe(true);
    });

    it('slidesPerMove > 1 lands on the last slide via a partial final move', async () => {
      const el = await mountScrollable('slides-per-move="2"');
      expect(el['_maxIndex']).toBe(3);
      el.next(); // 0 -> 2
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      el.next(); // 2 -> 4, clamped to 3
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('loop wraps without error or NaN', async () => {
      const el = await mountScrollable('loop');
      el.previous(); // 0 -> 3
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      el.next(); // 3 -> 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(Number.isFinite(trackTranslateY(track))).toBe(true);
    });
  });
});
