import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
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

    it('exposes "scroll-container" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="scroll-container"]')).toBeTruthy();
    });

    it('exposes "navigation" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="navigation"]')).toBeTruthy();
    });

    it('exposes "pagination" CSS part', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      expect(shadowQuery(el, '[part="pagination"]')).toBeTruthy();
    });
  });

  // ─── ARIA (5) ───

  describe('ARIA', () => {
    it('base element has role="region"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('region');
    });

    it('base element has aria-label="Carousel"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Carousel');
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

    it('pagination dots have aria-label="Slide N"', async () => {
      const el = await fixture<HelixCarousel>(threeSlides);
      await el.updateComplete;
      const dot1 = shadowQuery(el, '[part="pagination-item"][aria-label="Slide 1"]');
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
      const el = await fixture<HelixCarousel>('<hx-carousel loop><hx-carousel-item>1</hx-carousel-item></hx-carousel>');
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

  // ─── hx-carousel-item (3) ───

  describe('hx-carousel-item', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCarouselItem>('<hx-carousel-item>Content</hx-carousel-item>');
      expect(el.shadowRoot).toBeTruthy();
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
      const container = shadowQuery(el, '[part="scroll-container"]') as HTMLElement;
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
      const container = shadowQuery(el, '[part="scroll-container"]') as HTMLElement;
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
      const container = shadowQuery(el, '[part="scroll-container"]') as HTMLElement;
      container.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 200, bubbles: true, cancelable: true }),
      );
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, bubbles: true }));
      container.dispatchEvent(new MouseEvent('mouseup', { clientX: 210, bubbles: true }));
      await el.updateComplete;
      expect(el['_currentIndex']).toBe(0);
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
});
