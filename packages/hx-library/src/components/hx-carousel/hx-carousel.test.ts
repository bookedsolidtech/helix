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
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
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
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
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
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
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
          style="display: block; width: 400px; --hx-carousel-slide-width: 150px;"
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

      el.previous(); // wraps 0 -> 3
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      el.next(); // wraps 3 -> 0
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);

      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(Number.isFinite(trackTranslate(track))).toBe(true);
    });

    it('custom-width: a runtime --hx-carousel-gap change is picked up lazily on navigation', async () => {
      const el = await fixture<HelixCarousel>(fourSlides(' --hx-carousel-slide-width: 150px;'));
      await flush(el);

      // Initial gap = 0 -> step = 150, content = 600, maxScroll = 600 - 400 = 200.
      expect(el['_measuredStep']).toBeCloseTo(150, 0);
      expect(el['_measuredMaxScroll']).toBeCloseTo(200, 0);

      // Change ONLY the gap at runtime. The slides (150px) and host (400px) keep
      // their box sizes, so no ResizeObserver fires — only the lazy recompute on
      // navigation can pick this up.
      el.style.setProperty('--hx-carousel-gap', '20px');

      el.next(); // 0 -> 1; lazy recompute reads the new gap
      await el.updateComplete;

      // step = 150 + 20 = 170; content = 4*150 + 3*20 = 660; maxScroll = 660 - 400 = 260.
      expect(el['_measuredStep']).toBeCloseTo(170, 0);
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
      // pageExtent = 2*150 = 300 != 400 viewport -> genuine peek.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // every slide selectable
    });

    it('gate: exact-fill horizontal custom width stays in the legacy page model', async () => {
      const el = await fixture<HelixCarousel>(
        fourSlides(' --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;'),
      );
      await flush(el);

      // 2*(200 - 8) + 16 = 384 + 16 = 400 = viewport -> exact fill -> legacy model.
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // n - slidesPerPage, not n - 1

      // Legacy index clamp (would be n-1 = 3 in peek mode).
      el.goTo(10);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Legacy calc() transform: index 2 * (192px + 16px) = -416px (flush, no blank).
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-416, 0);
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

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // every slide reachable on the block axis

      // Step is the block-axis extent (slide height 50 + row-gap 0), NOT the
      // cross-axis 150px width hook.
      expect(el['_measuredStep']).toBeCloseTo(50, 0);

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

    it('gate transition: exact-fill -> genuine peek on a runtime gap change is detected via next()', async () => {
      const el = await fixture<HelixCarousel>(
        fourSlides(' --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;'),
      );
      await flush(el);
      // 2*(200 - 8) + 16 = 400 = viewport -> exact fill -> legacy model.
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2);

      // Sit at the legacy max index, where a stale guard would block next().
      el.goTo(2);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);

      // Shrink the gap so the layout becomes a genuine peek. Slides are
      // calc(50% - 8px) = 192px regardless of gap, so NO observed box resizes
      // (the ResizeObserver will not fire — only the lazy refresh can catch this).
      el.style.setProperty('--hx-carousel-gap', '0px');

      // next() re-detects peek (refresh before its guard) and advances past the
      // old legacy max into the now-reachable last slide.
      el.next();
      await el.updateComplete;
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);
      expect(el['_currentIndex']).toBe(3);

      // content = 4*192 = 768, viewport = 400 -> maxScroll = 368; translate clamps there.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(el['_measuredMaxScroll']).toBeCloseTo(368, 0);
      expect(trackTranslate(track)).toBeCloseTo(-368, 0);
    });

    it('gate transition: genuine peek -> exact-fill on a runtime gap change reverts to the legacy model', async () => {
      const el = await fixture<HelixCarousel>(
        fourSlides(' --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 0px;'),
      );
      await flush(el);
      // 2*192 = 384 != 400 -> genuine peek.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);

      // Grow the gap so the two slides exactly fill the viewport again. No box resizes.
      el.style.setProperty('--hx-carousel-gap', '16px');

      el.goTo(1); // navigation re-detects exact-fill -> legacy
      await el.updateComplete;
      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2); // legacy page bound

      // Legacy index clamp now applies (would be n-1 = 3 in peek mode).
      el.goTo(10);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
    });

    it('index-clamp invariant: a mode flip to exact-fill clamps a peek-only index back into range', async () => {
      const el = await fixture<HelixCarousel>(
        fourSlides(' --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 0px;'),
      );
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);

      el.goTo(3); // a peek-only index (out of range in the legacy model)
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);

      // Runtime change to exact-fill resizes no box; drive a recompute as the
      // ResizeObserver / slotchange path would. The invariant must clamp the
      // now-out-of-range active index without any manual navigation.
      el.style.setProperty('--hx-carousel-gap', '16px');
      el['_recomputeBounds']();
      await el.updateComplete;

      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2);
      expect(el['_currentIndex']).toBe(2); // clamped 3 -> 2 by the invariant

      // Legacy transform uses the clamped index — no overscroll into blank.
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      settle(track);
      expect(trackTranslate(track)).toBeCloseTo(-416, 0); // index 2 * (192 + 16)
    });

    // Let the ResizeObserver deliver (it fires after layout, before paint).
    function nextFrame(): Promise<void> {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    }

    it('reactive bounds: a runtime gap change flipping exact-fill -> peek re-enables Next with no navigation', async () => {
      const el = await fixture<HelixCarousel>(
        fourSlides(' --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 16px;'),
      );
      await flush(el);

      // Exact-fill -> legacy. Navigate to the page bound where Next is disabled.
      expect(el['_measuredNav']).toBe(false);
      el.goTo(2);
      await el.updateComplete;
      const next = shadowQuery<HTMLButtonElement>(el, '[part="next-button"]')!;
      expect(el['_maxIndex']).toBe(2);
      expect(next.disabled).toBe(true);

      // Shrink the gap into a genuine peek. Resizes no laid-out box; do NOT
      // navigate or resize the host — only the gap sentinel changes size.
      el.style.setProperty('--hx-carousel-gap', '0px');
      await nextFrame(); // ResizeObserver delivers -> _recomputeBounds runs
      await el.updateComplete;

      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);
      expect(el['_canGoNext']).toBe(true);
      expect(next.disabled).toBe(false); // re-enabled reactively, no navigation
    });

    it('emits hx-slide-change exactly once when a recompute clamps the active index; none on init or no-op', async () => {
      const events: number[] = [];
      // Build manually so the listener is attached before the element connects,
      // proving initial setup emits nothing.
      const el = document.createElement('hx-carousel') as HelixCarousel;
      el.setAttribute('slides-per-page', '2');
      el.style.cssText =
        'display: block; width: 400px; --hx-carousel-slide-width: calc(50% - 8px); --hx-carousel-gap: 0px;';
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

      expect(el['_measuredNav']).toBe(true);
      expect(events).toEqual([]); // no event during initial setup

      el.goTo(3);
      await el.updateComplete;
      expect(events).toEqual([3]); // the navigation event
      events.length = 0;

      // Responsive flip to exact-fill (resizes no box); recompute clamps 3 -> 2.
      el.style.setProperty('--hx-carousel-gap', '16px');
      el['_recomputeBounds']();
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      expect(events).toEqual([2]); // exactly one clamp event with the clamped index

      events.length = 0;
      el['_recomputeBounds'](); // no index change
      await el.updateComplete;
      expect(events).toEqual([]); // none on a no-op recompute
    });

    it('reactive bounds: a runtime slides-per-page change re-derives bounds, clamps the index, and emits once', async () => {
      const events: number[] = [];
      // slide-width 200px = exactly 50% of the 400px viewport.
      const el = await fixture<HelixCarousel>(`
        <hx-carousel slides-per-page="1" style="display: block; width: 400px; --hx-carousel-slide-width: 200px;">
          <hx-carousel-item>1</hx-carousel-item>
          <hx-carousel-item>2</hx-carousel-item>
          <hx-carousel-item>3</hx-carousel-item>
          <hx-carousel-item>4</hx-carousel-item>
        </hx-carousel>
      `);
      await flush(el);
      el.addEventListener('hx-slide-change', (e) =>
        events.push((e as CustomEvent<{ index: number }>).detail.index),
      );

      // slides-per-page=1: 200 != 400 -> genuine peek; every slide selectable.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3);

      el.goTo(3);
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
      expect(events).toEqual([3]);
      events.length = 0;

      // Two 200px slides exactly fill the 400px viewport -> exact-fill legacy
      // model, maxIndex = n - 2 = 2. No resize, no navigation.
      el.slidesPerPage = 2;
      await flush(el);

      expect(el['_measuredNav']).toBe(false);
      expect(el['_maxIndex']).toBe(2);
      expect(el['_currentIndex']).toBe(2); // clamped 3 -> 2
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

      // Vertical re-derives to the measured block-axis model: every slide selectable.
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // n - 1
    });

    it('autoplay refreshes bounds before wrapping: exact-fill -> peek advances instead of wrapping to 0', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixCarousel>(`
          <hx-carousel
            autoplay
            autoplay-interval="1000"
            slides-per-page="2"
            style="display: block; width: 400px; --hx-carousel-slide-width: 200px; --hx-carousel-gap: 0px;"
          >
            <hx-carousel-item>1</hx-carousel-item>
            <hx-carousel-item>2</hx-carousel-item>
            <hx-carousel-item>3</hx-carousel-item>
            <hx-carousel-item>4</hx-carousel-item>
          </hx-carousel>
        `);
        await flush(el);
        // 2*200 = 400 = viewport -> exact-fill legacy model, maxIndex = n - 2 = 2.
        expect(el['_measuredNav']).toBe(false);
        expect(el['_maxIndex']).toBe(2);

        vi.advanceTimersByTime(1100); // 0 -> 1
        vi.advanceTimersByTime(1000); // 1 -> 2 (the old legacy max)
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(2);

        // Runtime gap change flips exact-fill -> peek (maxIndex grows to 3); no
        // resize, and the next tick is synchronous so the RO has not fired yet.
        el.style.setProperty('--hx-carousel-gap', '16px');

        vi.advanceTimersByTime(1000); // tick refreshes first -> 2 < 3 -> advance
        await el.updateComplete;
        expect(el['_measuredNav']).toBe(true);
        expect(el['_maxIndex']).toBe(3);
        expect(el['_currentIndex']).toBe(3); // advanced to the newly-reachable slide, NOT wrapped to 0

        // Genuinely at the last slide now -> the next non-loop tick wraps to 0.
        vi.advanceTimersByTime(1000);
        await el.updateComplete;
        expect(el['_currentIndex']).toBe(0);
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
    // create a scrollable scenario for geometry assertions.
    function constrainViewport(el: HelixCarousel, px: number): HTMLElement {
      const vp = shadowQuery<HTMLElement>(el, '[part="slide-viewport"]')!;
      vp.style.height = `${px}px`;
      return vp;
    }

    it('default: measured nav active, step = one slide height, every slide selectable', async () => {
      const el = await fixture<HelixCarousel>(verticalSlides());
      await flush(el);
      expect(el['_measuredNav']).toBe(true);
      expect(el['_maxIndex']).toBe(3); // n - 1, every slide reachable
      expect(el['_measuredStep']).toBeCloseTo(50, 0); // slide height + 0 row-gap
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

    it('row-gap: the measured step includes the block-axis gap', async () => {
      const el = await fixture<HelixCarousel>(verticalSlides('', ' --hx-carousel-gap: 10px;'));
      await flush(el);
      // step = slide height 50 + row-gap 10 = 60.
      expect(el['_measuredStep']).toBeCloseTo(60, 0);
      const track = shadowQuery<HTMLElement>(el, '.track')!;
      expect(getComputedStyle(track).rowGap).toBe('10px');
    });

    it('End/Home reach the last/first slide; pagination dot and ARIA track the index', async () => {
      const el = await fixture<HelixCarousel>(verticalSlides());
      await flush(el);

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
      const el = await fixture<HelixCarousel>(verticalSlides());
      await flush(el);
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
      const el = await fixture<HelixCarousel>(verticalSlides('slides-per-move="2"'));
      await flush(el);
      expect(el['_maxIndex']).toBe(3);
      el.next(); // 0 -> 2
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(2);
      el.next(); // 2 -> 4, clamped to 3
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(3);
    });

    it('loop wraps without error or NaN', async () => {
      const el = await fixture<HelixCarousel>(verticalSlides('loop'));
      await flush(el);
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
