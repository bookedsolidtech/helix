import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixFocusRing } from './hx-focus-ring.js';
import './index.js';

afterEach(cleanup);

describe('hx-focus-ring', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "ring" CSS part', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      const ring = shadowQuery(el, '[part~="ring"]');
      expect(ring).toBeTruthy();
    });

    it('renders a default slot', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring><button>Test</button></hx-focus-ring>',
      );
      const slot = shadowQuery(el, 'slot');
      expect(slot).toBeTruthy();
    });

    it('ring has aria-hidden="true"', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      const ring = shadowQuery(el, '[part~="ring"]');
      expect(ring?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Property: visible ───

  describe('Property: visible', () => {
    it('defaults visible to false', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      expect(el.visible).toBe(false);
    });

    it('reflects visible attribute to host', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring visible></hx-focus-ring>');
      expect(el.visible).toBe(true);
      expect(el.hasAttribute('visible')).toBe(true);
    });

    it('visible=true sets the visible attribute on host', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      el.visible = true;
      await el.updateComplete;
      expect(el.hasAttribute('visible')).toBe(true);
    });

    it('visible=false removes the visible attribute from host', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring visible></hx-focus-ring>');
      el.visible = false;
      await el.updateComplete;
      expect(el.hasAttribute('visible')).toBe(false);
    });
  });

  // ─── Property: shape ───

  describe('Property: shape', () => {
    it('defaults shape to "box"', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      expect(el.shape).toBe('box');
    });

    it('reflects shape attribute to host', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape="circle"></hx-focus-ring>');
      expect(el.getAttribute('shape')).toBe('circle');
    });

    it('applies ring--box class for box shape', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape="box"></hx-focus-ring>');
      const ring = shadowQuery(el, '[part~="ring"]');
      expect(ring?.classList.contains('ring--box')).toBe(true);
    });

    it('applies ring--circle class for circle shape', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape="circle"></hx-focus-ring>');
      const ring = shadowQuery(el, '[part~="ring"]');
      expect(ring?.classList.contains('ring--circle')).toBe(true);
    });

    it('applies ring--pill class for pill shape', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring shape="pill"></hx-focus-ring>');
      const ring = shadowQuery(el, '[part~="ring"]');
      expect(ring?.classList.contains('ring--pill')).toBe(true);
    });
  });

  // ─── Property: color/width/offset overrides ───

  describe('Token overrides', () => {
    it('sets --_ring-color on base when color prop is set', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring color="#ff0000"></hx-focus-ring>',
      );
      const base = shadowQuery<HTMLElement>(el, '[part~="base"]');
      expect(base?.style.getPropertyValue('--_ring-color')).toBe('#ff0000');
    });

    it('sets --_ring-width on base when width prop is set', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring width="4px"></hx-focus-ring>',
      );
      const base = shadowQuery<HTMLElement>(el, '[part~="base"]');
      expect(base?.style.getPropertyValue('--_ring-width')).toBe('4px');
    });

    it('sets --_ring-offset on base when offset prop is set', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring offset="6px"></hx-focus-ring>',
      );
      const base = shadowQuery<HTMLElement>(el, '[part~="base"]');
      expect(base?.style.getPropertyValue('--_ring-offset')).toBe('6px');
    });

    it('does not set inline style on base when no overrides are set', async () => {
      const el = await fixture<HelixFocusRing>('<hx-focus-ring></hx-focus-ring>');
      const base = shadowQuery<HTMLElement>(el, '[part~="base"]');
      expect(base?.getAttribute('style') ?? '').toBe('');
    });
  });

  // ─── Accessibility ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring><button>Click</button></hx-focus-ring>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });

    it('has no axe violations when visible', async () => {
      const el = await fixture<HelixFocusRing>(
        '<hx-focus-ring visible><button>Click</button></hx-focus-ring>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });
  });
});
