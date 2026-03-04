import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDivider } from './hx-divider.js';
import './index.js';

afterEach(cleanup);

describe('hx-divider', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "divider" CSS part on the <hr>', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, '[part="divider"]');
      expect(hr).toBeTruthy();
    });

    it('renders an <hr> element inside shadow DOM', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, 'hr');
      expect(hr).toBeInstanceOf(HTMLHRElement);
    });

    it('defaults to orientation=horizontal — applies divider--horizontal class', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--horizontal')).toBe(true);
    });

    it('defaults to variant=solid — applies divider--solid class', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--solid')).toBe(true);
    });
  });

  // ─── Property: orientation (3) ───

  describe('Property: orientation', () => {
    it('applies divider--horizontal class when orientation="horizontal"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="horizontal"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--horizontal')).toBe(true);
    });

    it('applies divider--vertical class when orientation="vertical"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="vertical"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--vertical')).toBe(true);
    });

    it('reflects orientation attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="vertical"></hx-divider>');
      expect(el.getAttribute('orientation')).toBe('vertical');
    });
  });

  // ─── Property: variant (4) ───

  describe('Property: variant', () => {
    it('applies divider--solid class when variant="solid"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider variant="solid"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--solid')).toBe(true);
    });

    it('applies divider--dashed class when variant="dashed"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider variant="dashed"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--dashed')).toBe(true);
    });

    it('applies divider--dotted class when variant="dotted"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider variant="dotted"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--dotted')).toBe(true);
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider variant="dashed"></hx-divider>');
      expect(el.getAttribute('variant')).toBe('dashed');
    });
  });

  // ─── Property: spacing (4) ───

  describe('Property: spacing', () => {
    it('reflects spacing="sm" attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="sm"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('sm');
    });

    it('reflects spacing="md" attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="md"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('md');
    });

    it('reflects spacing="lg" attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="lg"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('lg');
    });

    it('defaults to spacing="md"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('md');
    });
  });

  // ─── ARIA / Accessibility (3) ───

  describe('ARIA / Accessibility', () => {
    it('default <hr> has role="separator"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      // <hr> has implicit separator role; explicit role attribute should be "separator"
      expect(hr.getAttribute('role')).toBe('separator');
    });

    it('when role="presentation", the <hr> has role="presentation" and aria-hidden="true"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider role="presentation"></hx-divider>');
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.getAttribute('role')).toBe('presentation');
      expect(hr.getAttribute('aria-hidden')).toBe('true');
    });

    it('reflects role attribute to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider role="presentation"></hx-divider>');
      expect(el.getAttribute('role')).toBe('presentation');
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('divider part is accessible for external styling', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const hr = shadowQuery(el, '[part="divider"]');
      expect(hr).toBeTruthy();
      expect(hr?.getAttribute('part')).toBe('divider');
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates orientation class when property changes', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="horizontal"></hx-divider>');
      el.orientation = 'vertical';
      await el.updateComplete;
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--vertical')).toBe(true);
      expect(hr.classList.contains('divider--horizontal')).toBe(false);
    });

    it('updates variant class when property changes', async () => {
      const el = await fixture<HelixDivider>('<hx-divider variant="solid"></hx-divider>');
      el.variant = 'dotted';
      await el.updateComplete;
      const hr = shadowQuery(el, 'hr')!;
      expect(hr.classList.contains('divider--dotted')).toBe(true);
      expect(hr.classList.contains('divider--solid')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with role="presentation"', async () => {
      const el = await fixture<HelixDivider>('<hx-divider role="presentation"></hx-divider>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
