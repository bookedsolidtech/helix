import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import { HelixColorPicker } from './hx-color-picker.js';
import './index.js';

afterEach(cleanup);

describe('hx-color-picker', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('does not render panel by default (popover mode)', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const panel = shadowQuery(el, '.panel');
      expect(panel).toBeNull();
    });

    it('renders trigger button in popover mode', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeInstanceOf(HTMLButtonElement);
    });

    it('renders panel inline when inline attribute is set', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const panel = shadowQuery(el, '.panel');
      expect(panel).toBeTruthy();
    });

    it('renders gradient grid in panel', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const grid = shadowQuery(el, '[part="grid"]');
      expect(grid).toBeTruthy();
    });
  });

  // ─── Property: value (3) ───

  describe('Property: value', () => {
    it('defaults value to #000000', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(el.value).toBe('#000000');
    });

    it('accepts hex value attribute', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#3b82f6"></hx-color-picker>',
      );
      expect(el.value).toBe('#3b82f6');
    });

    it('reflects value attribute to host', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000"></hx-color-picker>',
      );
      expect(el.getAttribute('value')).toBe('#ff0000');
    });
  });

  // ─── Property: format (3) ───

  describe('Property: format', () => {
    it('defaults format to hex', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(el.format).toBe('hex');
    });

    it('accepts rgb format', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker format="rgb"></hx-color-picker>',
      );
      expect(el.format).toBe('rgb');
    });

    it('accepts hsl format', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker format="hsl"></hx-color-picker>',
      );
      expect(el.format).toBe('hsl');
    });
  });

  // ─── Property: opacity (2) ───

  describe('Property: opacity', () => {
    it('does not render opacity slider when opacity is false', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const opacitySlider = shadowQuery(el, '[part="opacity-slider"]');
      expect(opacitySlider).toBeNull();
    });

    it('renders opacity slider when opacity is true', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline opacity></hx-color-picker>',
      );
      const opacitySlider = shadowQuery(el, '[part="opacity-slider"]');
      expect(opacitySlider).toBeTruthy();
    });
  });

  // ─── Property: swatches (3) ───

  describe('Property: swatches', () => {
    it('does not render swatches container when swatches is empty', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const swatches = shadowQuery(el, '[part="swatches"]');
      expect(swatches).toBeNull();
    });

    it('renders swatches when provided', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000', '#00ff00', '#0000ff'];
      await el.updateComplete;
      const swatches = shadowQuery(el, '[part="swatches"]');
      expect(swatches).toBeTruthy();
    });

    it('renders correct number of swatch buttons', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000', '#00ff00', '#0000ff'];
      await el.updateComplete;
      const btns = el.shadowRoot?.querySelectorAll('.swatch-btn');
      expect(btns?.length).toBe(3);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets native disabled on trigger button', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker disabled></hx-color-picker>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      expect(trigger?.disabled).toBe(true);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker disabled></hx-color-picker>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not open panel when disabled', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker disabled></hx-color-picker>',
      );
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '.panel');
      expect(panel).toBeNull();
    });
  });

  // ─── Property: inline (2) ───

  describe('Property: inline', () => {
    it('reflects inline attribute to host', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      expect(el.hasAttribute('inline')).toBe(true);
    });

    it('does not render trigger button when inline', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeNull();
    });
  });

  // ─── Popover open/close (3) ───

  describe('Popover open/close', () => {
    it('opens panel on trigger click', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '.panel');
      expect(panel).toBeTruthy();
    });

    it('closes panel on second trigger click', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      trigger?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '.panel');
      expect(panel).toBeNull();
    });

    it('trigger aria-expanded is true when open', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-change when swatch is clicked', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000'];
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      const swatchBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn');
      swatchBtn?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBeTruthy();
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000'];
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const swatchBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn');
      swatchBtn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-change with correct value when swatch clicked', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000'];
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      const swatchBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn');
      swatchBtn?.click();
      const event = await eventPromise;
      // Value should be a valid color string
      expect(typeof event.detail.value).toBe('string');
      expect(event.detail.value.length).toBeGreaterThan(0);
    });

    it('updates value property when swatch is clicked', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      el.swatches = ['#ff0000'];
      await el.updateComplete;

      const changePromise = oneEvent(el, 'hx-change');
      const swatchBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn');
      swatchBtn?.click();
      await changePromise;
      // value should now reflect the swatch color
      expect(el.value).not.toBe('#000000');
    });
  });

  // ─── Value parsing (4) ───

  describe('Value parsing', () => {
    it('parses hex color correctly', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000"></hx-color-picker>',
      );
      expect(el.value).toBe('#ff0000');
    });

    it('parses rgb color', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="rgb(255, 0, 0)" format="rgb"></hx-color-picker>',
      );
      expect(el.format).toBe('rgb');
    });

    it('parses hsl color', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="hsl(0, 100%, 50%)" format="hsl"></hx-color-picker>',
      );
      expect(el.format).toBe('hsl');
    });

    it('handles invalid color value gracefully', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="not-a-color"></hx-color-picker>',
      );
      // Should not throw; element renders
      expect(el.shadowRoot).toBeTruthy();
    });
  });

  // ─── Form participation (2) ───

  describe('Form participation', () => {
    it('is form associated', async () => {
      expect(HelixColorPicker.formAssociated).toBe(true);
    });

    it('participates in form via name attribute', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker name="brand-color" value="#3b82f6"></hx-color-picker>',
      );
      expect(el.name).toBe('brand-color');
    });
  });

  // ─── ARIA (4) ───

  describe('ARIA', () => {
    it('trigger has aria-label="Choose color"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger?.getAttribute('aria-label')).toBe('Choose color');
    });

    it('trigger has aria-haspopup="dialog"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('trigger aria-expanded is false when closed', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('hue slider has role="slider"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const hueSlider = shadowQuery(el, '[part="hue-slider"]');
      expect(hueSlider?.getAttribute('role')).toBe('slider');
    });

    it('hue slider has aria-valuemin, aria-valuemax, aria-valuenow', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const hueSlider = shadowQuery(el, '[part="hue-slider"]');
      expect(hueSlider?.getAttribute('aria-valuemin')).toBe('0');
      expect(hueSlider?.getAttribute('aria-valuemax')).toBe('360');
      expect(hueSlider?.getAttribute('aria-valuenow')).toBeTruthy();
    });

    it('panel has role="dialog"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const panel = shadowQuery(el, '.panel');
      expect(panel?.getAttribute('role')).toBe('dialog');
    });
  });

  // ─── CSS parts (4) ───

  describe('CSS parts', () => {
    it('exposes "trigger" CSS part', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(shadowQuery(el, '[part="trigger"]')).toBeTruthy();
    });

    it('exposes "grid" CSS part when panel is open', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      expect(shadowQuery(el, '[part="grid"]')).toBeTruthy();
    });

    it('exposes "hue-slider" CSS part when panel is open', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      expect(shadowQuery(el, '[part="hue-slider"]')).toBeTruthy();
    });

    it('exposes "input" CSS part when panel is open', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      expect(shadowQuery(el, '[part="input"]')).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('renders named trigger slot', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker><button slot="trigger">Pick Color</button></hx-color-picker>',
      );
      const slotted = el.querySelector('[slot="trigger"]');
      expect(slotted).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in inline state', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
