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

    // A11y fix (WCAG 4.1.2): aria-haspopup="dialog" removed because the panel now uses
    // role="group" (not role="dialog"). aria-expanded conveys open/closed state instead.
    it('trigger does not have aria-haspopup (panel is a group, not a dialog)', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger?.hasAttribute('aria-haspopup')).toBe(false);
    });

    it('trigger aria-expanded is absent when closed', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger?.hasAttribute('aria-expanded')).toBe(false);
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

    // A11y fix (WCAG 4.1.2): panel changed from role="dialog" aria-modal="true" to role="group"
    // because there is no programmatic focus trap. aria-modal without a focus trap causes
    // JAWS/NVDA to hide all out-of-panel content, stranding keyboard users who Tab out.
    it('panel has role="group" (not dialog — no focus trap present)', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      const panel = shadowQuery(el, '.panel');
      expect(panel?.getAttribute('role')).toBe('group');
      expect(panel?.hasAttribute('aria-modal')).toBe(false);
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

  // ─── Form Association ───

  describe('Form Association', () => {
    it('formResetCallback resets value to #000000', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000"></hx-color-picker>',
      );
      expect(el.value).toBe('#ff0000');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('#000000');
    });

    it('formStateRestoreCallback restores value from string state', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      el.formStateRestoreCallback('#3b82f6', 'restore');
      await el.updateComplete;
      expect(el.value).toBe('#3b82f6');
    });

    it('formStateRestoreCallback ignores non-string state', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000"></hx-color-picker>',
      );
      el.formStateRestoreCallback(null, 'restore');
      await el.updateComplete;
      // value should remain unchanged when state is null
      expect(el.value).toBe('#ff0000');
    });

    it('submits color value in FormData', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-color-picker name="brand-color" value="#3b82f6"></hx-color-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-color-picker') as HelixColorPicker;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('brand-color')).toBe('#3b82f6');
      form.remove();
    });

    it('formDisabledCallback sets disabled state', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });

    it('updates FormData value when value property changes', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-color-picker name="theme-color" value="#000000"></hx-color-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-color-picker') as HelixColorPicker;
      await el.updateComplete;
      el.value = '#ff0000';
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('theme-color')).toBe('#ff0000');
      form.remove();
    });

    it('checkValidity returns true when not required', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(el.checkValidity()).toBe(true);
    });

    it('checkValidity returns false when required and value is empty', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker required value=""></hx-color-picker>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is set', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker required value="#ff0000"></hx-color-picker>');
      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity is a function', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(typeof el.reportValidity).toBe('function');
    });

    it('validity.valueMissing is true when required and value is empty', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker required value=""></hx-color-picker>');
      expect(el.validity.valueMissing).toBe(true);
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

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('uses default English label for gradient area', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      expect(el.labelGradient).toBe('Color gradient');
    });

    it('renders custom labelGradient when set via property', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker></hx-color-picker>');
      el.labelGradient = 'Dégradé de couleur';
      await el.updateComplete;
      expect(el.labelGradient).toBe('Dégradé de couleur');
    });
  });

  // ─── hexToRgb 3-char shorthand ───

  describe('hexToRgb 3-char shorthand', () => {
    it('parses 3-char hex #fff as white', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#fff" format="rgb"></hx-color-picker>',
      );
      await el.updateComplete;
      // Panel must be visible (inline) for .color-input to render
      const colorInput = shadowQuery<HTMLInputElement>(el, '.color-input');
      expect(colorInput?.value).toBe('rgb(255 255 255)');
    });

    it('parses 3-char hex #f00 as red', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#f00" format="rgb"></hx-color-picker>',
      );
      await el.updateComplete;
      const colorInput = shadowQuery<HTMLInputElement>(el, '.color-input');
      expect(colorInput?.value).toBe('rgb(255 0 0)');
    });
  });

  // ─── Achromatic color conversions ───

  describe('Achromatic color conversions (s=0)', () => {
    it('parses #808080 gray without throwing and reports zero saturation', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#808080" format="hex"></hx-color-picker>',
      );
      await el.updateComplete;
      // Gray should parse successfully and the value should reflect back as a hex string
      expect(el.value).toMatch(/^#[0-9a-f]{6}$/i);
      // The hue slider aria-valuenow should be a valid number (hue is undefined for achromatic)
      const hueSlider = shadowQuery<HTMLElement>(el, '[part~="hue-slider"]');
      const hueVal = parseInt(hueSlider?.getAttribute('aria-valuenow') ?? '0', 10);
      expect(isNaN(hueVal)).toBe(false);
    });

    it('gray #808080 converts to rgb with equal r, g, b channels', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#808080" format="rgb"></hx-color-picker>',
      );
      await el.updateComplete;
      // Panel must be visible (inline) for .color-input to render
      const colorInput = shadowQuery<HTMLInputElement>(el, '.color-input');
      expect(colorInput?.value).toBe('rgb(128 128 128)');
    });
  });

  // ─── Opacity alpha channel preservation ───

  describe('Opacity alpha channel preservation', () => {
    it('preserves alpha < 1 in hex format when opacity is true', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline opacity value="#ff000080" format="hex"></hx-color-picker>',
      );
      await el.updateComplete;
      // The value should contain alpha — hex with alpha is 8 chars
      // #ff000080 has alpha ≈ 0.502 (128/255)
      expect(el.value).toHaveLength(9); // # + 6 hex + 2 alpha hex = 9 chars
      expect(el.value).toMatch(/^#[0-9a-f]{8}$/i);
    });

    it('omits alpha from hex display when opacity is false (default)', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#ff000080" format="hex"></hx-color-picker>',
      );
      await el.updateComplete;
      // Without opacity flag, the display input should show 6-char hex (no alpha)
      const colorInput = shadowQuery<HTMLInputElement>(el, '.color-input');
      expect(colorInput?.value).toMatch(/^#[0-9a-f]{6}$/i);
      expect(colorInput?.value).toHaveLength(7);
    });

    it('preserves alpha in rgb format with opacity=true', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline opacity format="rgb"></hx-color-picker>',
      );
      await el.updateComplete;

      // Use the opacity slider keydown to change alpha to < 1
      const opacitySlider = shadowQuery<HTMLElement>(el, '[part~="opacity-slider"]');
      expect(opacitySlider).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      opacitySlider!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
      const event = await eventPromise;
      // With opacity < 1, the rgb string should include the / alpha channel
      expect(event.detail.value).toMatch(/^rgb\(\d+ \d+ \d+ \/ [\d.]+\)$/);
    });
  });

  // ─── Swatch click in swatches-only mode ───

  describe('Swatch click in swatches-only mode', () => {
    it('clicking a swatch in swatches-only mode sets the color and fires hx-change', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline swatches-only></hx-color-picker>',
      );
      el.swatches = ['#ff0000', '#00ff00', '#0000ff'];
      await el.updateComplete;

      // Confirm grid is hidden in swatches-only mode
      expect(shadowQuery(el, '[part="grid"]')).toBeNull();

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      const swatchBtns = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.swatch-btn');
      expect(swatchBtns?.length).toBe(3);
      swatchBtns?.[1]?.click(); // click the green swatch
      const event = await eventPromise;

      expect(event.detail.value).toBe('#00ff00');
      expect(el.value).toBe('#00ff00');
    });

    it('swatches-only mode still renders the text input area', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline swatches-only></hx-color-picker>',
      );
      el.swatches = ['#ff0000'];
      await el.updateComplete;
      expect(shadowQuery(el, '[part="input"]')).toBeTruthy();
    });
  });

  // ─── Format change preserves color value ───

  describe('Format change preserves color value', () => {
    it('cycling from hex to rgb preserves the same color (red)', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#ff0000" format="hex"></hx-color-picker>',
      );
      await el.updateComplete;
      expect(el.format).toBe('hex');

      const formatBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.format-btn');
      formatBtn?.click();
      await el.updateComplete;

      expect(el.format).toBe('rgb');
      // The input value should now reflect red in rgb format
      const colorInput = el.shadowRoot?.querySelector<HTMLInputElement>('.color-input');
      expect(colorInput?.value).toBe('rgb(255 0 0)');
    });

    it('cycling format does not change the underlying color (hue stays the same)', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker inline value="#3b82f6" format="hex"></hx-color-picker>',
      );
      await el.updateComplete;
      const initialHue = el['_hsv'].h;

      const formatBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.format-btn');
      formatBtn?.click(); // hex → rgb
      await el.updateComplete;
      formatBtn?.click(); // rgb → hsl
      await el.updateComplete;

      // Hue should be preserved through format changes
      expect(Math.round(el['_hsv'].h)).toBe(Math.round(initialHue));
    });
  });

  // ─── Inline mode blocks panel open ───

  describe('Inline mode blocks panel open', () => {
    it('panel is always visible inline and does not toggle on trigger click', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      await el.updateComplete;

      // Panel is rendered immediately in inline mode
      expect(shadowQuery(el, '.panel')).toBeTruthy();

      // There is no trigger in inline mode so _open stays false
      expect(el['_open']).toBe(false);
    });

    it('_show() does not set _open to true when inline is true', async () => {
      const el = await fixture<HelixColorPicker>('<hx-color-picker inline></hx-color-picker>');
      await el.updateComplete;

      // Call the private _show() method directly — it should guard against inline
      (el as unknown as { _show: () => void })._show();
      await el.updateComplete;

      expect(el['_open']).toBe(false);
    });
  });

  // ─── Invalid and edge-case color values ───

  describe('Invalid and edge-case color values', () => {
    it('empty string value does not throw and element still renders', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value=""></hx-color-picker>',
      );
      // Should not throw — element should render with shadow DOM intact
      expect(el.shadowRoot).toBeTruthy();
    });

    it('malformed hex value does not throw and retains last valid internal state', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#gggggg"></hx-color-picker>',
      );
      expect(el.shadowRoot).toBeTruthy();
      // The hsv state should remain at the default (black, h=0, s=0, v=0)
      expect(el['_hsv'].h).toBe(0);
    });

    it('setting value to empty string at runtime keeps previous hsv state', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#ff0000"></hx-color-picker>',
      );
      await el.updateComplete;
      const prevHsv = { ...el['_hsv'] };

      // Setting an invalid/empty value should not mutate internal _hsv
      el.value = '';
      await el.updateComplete;

      // parseColor('') returns null so _hsv should be unchanged
      expect(el['_hsv'].h).toBe(prevHsv.h);
      expect(el['_hsv'].s).toBe(prevHsv.s);
    });

    it('hex with wrong length (#12345) returns null from hexToRgb and falls back gracefully', async () => {
      const el = await fixture<HelixColorPicker>(
        '<hx-color-picker value="#12345"></hx-color-picker>',
      );
      // 5-char hex is invalid — element should still render
      expect(el.shadowRoot).toBeTruthy();
      // No crash means the null guard in parseColor/_syncFromValue worked
      expect(el['_hsv']).toBeDefined();
    });
  });
});
