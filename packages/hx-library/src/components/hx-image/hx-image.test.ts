import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixImage } from './hx-image.js';
import './index.js';

afterEach(cleanup);

describe('hx-image', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders an img element inside shadow DOM', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img).toBeTruthy();
    });

    it('exposes "base" CSS part on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, '[part="base"]');
      expect(img).toBeTruthy();
      expect(img?.tagName.toLowerCase()).toBe('img');
    });

    it('exposes "container" CSS part on the container div', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const container = shadowQuery(el, '[part="container"]');
      expect(container).toBeTruthy();
    });

    it('applies default loading=lazy to the img', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('shows error state when src is empty', async () => {
      const el = await fixture<HelixImage>('<hx-image alt="Test"></hx-image>');
      await el.updateComplete;
      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();
    });
  });

  // ─── Property: src ───

  describe('Property: src', () => {
    it('sets the src attribute on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/photo.jpg" alt="Photo"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
    });

    it('reflects property to img src when changed', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/a.jpg" alt="A"></hx-image>',
      );
      el.src = 'https://example.com/b.jpg';
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/b.jpg');
    });

    it('reflects src to host attribute', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/a.jpg" alt="A"></hx-image>',
      );
      expect(el.getAttribute('src')).toBe('https://example.com/a.jpg');
    });
  });

  // ─── Property: alt / decorative / ARIA ───

  describe('Property: alt and decorative', () => {
    it('sets alt text on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('alt')).toBe('Descriptive text');
    });

    it('does NOT add role=presentation when decorative is false', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBeNull();
    });

    it('adds role=presentation when decorative is set', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="ignored" decorative></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
    });

    it('sets alt="" on decorative images regardless of alt prop value', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Some text" decorative></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('alt')).toBe('');
    });

    it('sets aria-hidden on decorative images', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" decorative></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does NOT add aria-hidden on informative images', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Photo"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Property: loading ───

  describe('Property: loading', () => {
    it('defaults to loading=lazy', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('sets loading=eager when specified', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" loading="eager"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('eager');
    });

    it('reflects loading to host attribute', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" loading="eager"></hx-image>',
      );
      expect(el.getAttribute('loading')).toBe('eager');
    });
  });

  // ─── Property: ratio ───

  describe('Property: ratio', () => {
    it('sets --_ratio CSS variable on the container', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" ratio="16/9"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      expect(container?.getAttribute('style')).toContain('--_ratio:16/9');
    });

    it('reflects ratio to host attribute', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" ratio="4/3"></hx-image>',
      );
      expect(el.getAttribute('ratio')).toBe('4/3');
    });
  });

  // ─── Property: fit ───

  describe('Property: fit', () => {
    it('sets --_fit CSS variable on the container', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="contain"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      expect(container?.getAttribute('style')).toContain('--_fit:contain');
    });

    it('reflects fit to host attribute', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="cover"></hx-image>',
      );
      expect(el.getAttribute('fit')).toBe('cover');
    });
  });

  // ─── Property: rounded ───

  describe('Property: rounded', () => {
    it('applies theme radius token when rounded is set (boolean attribute)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius');
      expect(style).toContain('var(--hx-border-radius-md');
    });

    it('uses custom CSS value when rounded is a string', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="1rem"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      expect(container?.getAttribute('style')).toContain('--_radius:1rem');
    });

    it('applies 50% for circular images', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="50%"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      expect(container?.getAttribute('style')).toContain('--_radius:50%');
    });

    it('does not apply radius when rounded is "false"', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="false"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_radius');
    });
  });

  // ─── Property: width/height ───

  describe('Property: width and height', () => {
    it('passes width to the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" width="400"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('width')).toBe('400');
    });

    it('passes height to the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" height="300"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('height')).toBe('300');
    });

    it('sets container width style when width is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" width="400"></hx-image>',
      );
      const container = shadowQuery(el, '.image__container');
      expect(container?.getAttribute('style')).toContain('width');
    });
  });

  // ─── Property: srcset/sizes ───

  describe('Property: srcset and sizes', () => {
    it('passes srcset to the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" srcset="img-320.jpg 320w, img-640.jpg 640w"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('srcset')).toBe('img-320.jpg 320w, img-640.jpg 640w');
    });

    it('passes sizes to the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" sizes="(max-width: 600px) 100vw, 50vw"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('sizes')).toBe('(max-width: 600px) 100vw, 50vw');
    });

    it('does not set srcset when not provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.hasAttribute('srcset')).toBe(false);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-load when image loads', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      expect(img).toBeTruthy();

      const loadPromise = oneEvent(el, 'hx-load');
      img!.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-load');
    });

    it('dispatches hx-error when image fails to load (no fallback)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      expect(img).toBeTruthy();

      const errorPromise = oneEvent(el, 'hx-error');
      img!.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-error');
    });

    it('dispatches hx-error after fallback-src also fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://also-broken.url/fb.jpg" alt="Test"></hx-image>',
      );

      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');
      firstImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorPromise = oneEvent(el, 'hx-error');
      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');
      secondImg!.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event.type).toBe('hx-error');
    });
  });

  // ─── Fallback ───

  describe('Fallback', () => {
    it('shows fallback slot when image fails and no fallback-src is set', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"><span slot="fallback" class="fb">Broken</span></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();

      const fallbackContent = el.querySelector('.fb');
      expect(fallbackContent).toBeTruthy();
      expect(fallbackContent?.textContent).toBe('Broken');
    });

    it('switches to fallback-src when primary src fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://example.com/fallback.jpg" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');

      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const updatedImg = shadowQuery<HTMLImageElement>(el, 'img');
      expect(updatedImg?.getAttribute('src')).toBe('https://example.com/fallback.jpg');
    });

    it('shows fallback slot after fallback-src also fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://also-broken.url/fallback.jpg" alt="Test"><span slot="fallback" class="fb2">Unavailable</span></hx-image>',
      );

      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');
      firstImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');
      secondImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();
    });

    it('error container has role=status and aria-live', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer?.getAttribute('role')).toBe('status');
      expect(errorContainer?.getAttribute('aria-live')).toBe('polite');
    });

    it('shows default fallback text when no fallback slot is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const fallbackText = shadowQuery(el, '.image__fallback-text');
      expect(fallbackText).toBeTruthy();
      expect(fallbackText?.textContent).toBe('Image unavailable');
    });

    it('error container has min-height to prevent collapse', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error') as HTMLElement;
      expect(errorContainer).toBeTruthy();
      const computedStyle = getComputedStyle(errorContainer);
      expect(computedStyle.minHeight).not.toBe('0px');
    });
  });

  // ─── Caption ───

  describe('Caption', () => {
    it('wraps in figure when caption slot is used', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"><span slot="caption">A caption</span></hx-image>',
      );
      await el.updateComplete;
      // Wait for slotchange to fire
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      const figure = shadowQuery(el, 'figure');
      expect(figure).toBeTruthy();
    });

    it('renders figcaption with caption part', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"><span slot="caption">A caption</span></hx-image>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      const figcaption = shadowQuery(el, 'figcaption[part="caption"]');
      expect(figcaption).toBeTruthy();
    });

    it('does not render figure when no caption slot is used', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;
      const figure = shadowQuery(el, 'figure');
      expect(figure).toBeNull();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with informative image (alt provided)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="A descriptive label"></hx-image>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with decorative image', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" decorative></hx-image>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
