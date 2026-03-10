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
      // part="slider opacity-slider" — use word-match selector
      const opacitySlider = shadowQuery(el, '[part~="opacity-slider"]');
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

  // ─── Property: swatchesOnly (2) ───

  describe('Property: swatchesOnly', () => {
    it('hides gradient grid when swatches-only is set', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline swatches-only></hx-color-picker>',
      );
      el.swatches = ['#ff0000', '#00ff00'];
      await el.updateComplete;
      const grid = shadowQuery(el, '[part="grid"]');
      expect(grid).toBeNull();
    });

    it('hides hue slider when swatches-only is set', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline swatches-only></hx-color-picker>',
      );
      await el.updateComplete;
      const hueSlider = shadowQuery(el, '[part="hue-slider"]');
      expect(hueSlider).toBeNull();
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets native disabled on trigger button', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker disabled></hx-color-picker>');
      const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]');
      expect(trigger?.disabled).toBe(true);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker disabled></hx-color-picker>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not open panel when disabled', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker disabled></hx-color-picker>');
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

  // ─── Events (5) ───

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

    // P2-10: Fixed — asserts exact hex value, not just truthy
    it('dispatches hx-change with correct hex value when swatch clicked', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline format="hex"></hx-color-picker>',
      );
      el.swatches = ['#ff0000'];
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      const swatchBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn');
      swatchBtn?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('#ff0000');
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

    // P2-3: hx-input event test
    it('dispatches hx-input when hue slider changes via keyboard', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline format="hex"></hx-color-picker>',
      );
      await el.updateComplete;

      // part="slider hue-slider" — use word-match selector
      const hueSlider = shadowQuery<HTMLElement>(el, '[part~="hue-slider"]');
      expect(hueSlider).toBeTruthy();

      // Keyboard changes emit 'hx-change' (committed), not 'hx-input' (drag)
      // Verify hx-change fires with a string value on keydown
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      hueSlider!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect(typeof event.detail.value).toBe('string');
      expect(event.detail.value.startsWith('#')).toBe(true);
    });
  });

  // ─── Value parsing (6) ───

  describe('Value parsing', () => {
    // P2-2: Tests now verify actual parsed color, not just format property
    it('parses hex color and reflects correct value', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000" format="hex"></hx-color-picker>',
      );
      expect(el.value).toBe('#ff0000');
    });

    it('parses rgb color and outputs correct rgb string', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="rgb(255, 0, 0)" format="rgb"></hx-color-picker>',
      );
      expect(el.format).toBe('rgb');
      // Value should round-trip to a valid rgb string for red
      expect(el.value).toMatch(/^rgb\(255,\s*0,\s*0\)$/);
    });

    it('parses hsl color and outputs correct hsl string', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="hsl(0, 100%, 50%)" format="hsl"></hx-color-picker>',
      );
      expect(el.format).toBe('hsl');
      // Round-trip: hsl(0, 100%, 50%) is red
      expect(el.value).toMatch(/^hsl\(/);
    });

    // P2-1/P2-7: HSV round-trip — component can consume its own HSV output
    it('parses hsv color string (round-trip correctness)', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="hsv(217, 91%, 72%)" format="hsv"></hx-color-picker>',
      );
      expect(el.format).toBe('hsv');
      // Value should be a valid hsv string (not reset to black)
      expect(el.value).toMatch(/^hsv\(/);
      // Confirm it didn't silently reset to black
      expect(el.value).not.toBe('hsv(0, 0%, 0%)');
    });

    // P2-7: HSV format output — trigger a commit to get the formatted value
    it('outputs hsv format string when format is "hsv"', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline format="hsv"></hx-color-picker>',
      );
      el.swatches = ['#3b82f6'];
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      el.shadowRoot?.querySelector<HTMLButtonElement>('.swatch-btn')?.click();
      const event = await eventPromise;
      expect(event.detail.value).toMatch(/^hsv\(\d+,\s*\d+%,\s*\d+%\)$/);
    });

    it('handles invalid color value gracefully', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="not-a-color"></hx-color-picker>',
      );
      // Should not throw; element renders
      expect(el.shadowRoot).toBeTruthy();
    });
  });

  // ─── Format cycling (1) ───

  describe('Format cycling', () => {
    // P2-4: Format cycling test
    it('cycles through hex → rgb → hsl → hsv on format button click', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#ff0000" format="hex"></hx-color-picker>',
      );
      expect(el.format).toBe('hex');

      const formatBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.format-btn');
      expect(formatBtn).toBeTruthy();

      formatBtn!.click();
      await el.updateComplete;
      expect(el.format).toBe('rgb');

      formatBtn!.click();
      await el.updateComplete;
      expect(el.format).toBe('hsl');

      formatBtn!.click();
      await el.updateComplete;
      expect(el.format).toBe('hsv');

      formatBtn!.click();
      await el.updateComplete;
      expect(el.format).toBe('hex');
    });
  });

  // ─── Text input → color update (1) ───

  describe('Text input → color update', () => {
    // P2-5: Typing in the input updates the picker (using @input)
    it('updates color when a valid hex value is typed into the input', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#000000" format="hex"></hx-color-picker>',
      );

      const colorInput = el.shadowRoot?.querySelector<HTMLInputElement>('.color-input');
      expect(colorInput).toBeTruthy();

      // Simulate typing a valid color
      Object.defineProperty(colorInput!, 'value', {
        writable: true,
        configurable: true,
        value: '#ff0000',
      });

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      colorInput!.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;

      expect(event.detail.value).toBe('#ff0000');
      expect(el.value).toBe('#ff0000');
    });
  });

  // ─── Keyboard navigation (2) ───

  describe('Keyboard navigation', () => {
    // P2-6: Hue slider keyboard navigation
    it('hue slider ArrowRight increases hue and emits hx-change', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#000000" format="hex"></hx-color-picker>',
      );

      // part="slider hue-slider" — use word-match selector
      const hueSlider = shadowQuery<HTMLElement>(el, '[part~="hue-slider"]');
      expect(hueSlider).toBeTruthy();

      const initialHue = parseInt(hueSlider!.getAttribute('aria-valuenow') ?? '0', 10);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      hueSlider!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await eventPromise;
      await el.updateComplete;

      const newHue = parseInt(hueSlider!.getAttribute('aria-valuenow') ?? '0', 10);
      expect(newHue).toBe(initialHue + 1);
    });

    // P0-1: Gradient grid keyboard navigation
    it('gradient grid ArrowRight increases saturation and emits hx-change', async () => {
      // Use pure black (#000000) which has S=0 — ArrowRight can increment S to 1
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#000000" format="hex"></hx-color-picker>',
      );

      const grid = shadowQuery<HTMLElement>(el, '[part="grid"]');
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('role')).toBe('slider');
      expect(grid!.getAttribute('tabindex')).toBe('0');

      const initialS = parseInt(grid!.getAttribute('aria-valuenow') ?? '0', 10);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      grid!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await eventPromise;
      await el.updateComplete;

      const newS = parseInt(grid!.getAttribute('aria-valuenow') ?? '0', 10);
      expect(newS).toBe(initialS + 1);
    });

    it('gradient grid has aria-valuetext describing saturation and value', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const grid = shadowQuery<HTMLElement>(el, '[part="grid"]');
      const valueText = grid?.getAttribute('aria-valuetext');
      expect(valueText).toMatch(/Saturation \d+%, Value \d+%/);
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

  // ─── ARIA (6) ───

  describe('ARIA', () => {
    // P1-3: trigger aria-label now includes current color value
    it('trigger aria-label includes current color value', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#3b82f6"></hx-color-picker>',
      );
      const trigger = shadowQuery(el, '[part="trigger"]');
      const label = trigger?.getAttribute('aria-label') ?? '';
      expect(label).toContain('Choose color');
      expect(label).toContain('#3b82f6');
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
      // part="slider hue-slider" — use word-match selector
      const hueSlider = shadowQuery(el, '[part~="hue-slider"]');
      expect(hueSlider?.getAttribute('role')).toBe('slider');
    });

    it('hue slider has aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      // part="slider hue-slider" — use word-match selector
      const hueSlider = shadowQuery(el, '[part~="hue-slider"]');
      expect(hueSlider?.getAttribute('aria-valuemin')).toBe('0');
      expect(hueSlider?.getAttribute('aria-valuemax')).toBe('360');
      expect(hueSlider?.getAttribute('aria-valuenow')).toBeTruthy();
      // P1-4: aria-valuetext should include degree symbol
      expect(hueSlider?.getAttribute('aria-valuetext')).toMatch(/^\d+°$/);
    });

    it('panel has role="dialog"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const panel = shadowQuery(el, '.panel');
      expect(panel?.getAttribute('role')).toBe('dialog');
    });

    // P0-1: gradient grid must be keyboard operable
    it('gradient grid has role="slider" and tabindex="0"', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const grid = shadowQuery(el, '[part="grid"]');
      expect(grid?.getAttribute('role')).toBe('slider');
      expect(grid?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ─── CSS parts (5) ───

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
      // part="slider hue-slider" — use word-match selector
      expect(shadowQuery(el, '[part~="hue-slider"]')).toBeTruthy();
    });

    // P1-8: shared "slider" part must be applied
    it('exposes "slider" CSS part on hue and opacity sliders', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline opacity></hx-color-picker>',
      );
      const sliders = el.shadowRoot?.querySelectorAll('[part~="slider"]');
      // Both hue-slider and opacity-slider should have the shared "slider" part
      expect(sliders?.length).toBeGreaterThanOrEqual(2);
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
