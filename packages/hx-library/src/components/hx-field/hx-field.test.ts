import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixField } from './hx-field.js';
import './index.js';

afterEach(cleanup);

describe('hx-field', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the field container with part="field"', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('renders default slot content (slotted input)', async () => {
      const el = await fixture<HelixField>('<hx-field><input type="text" /></hx-field>');
      const slottedInput = el.querySelector('input');
      expect(slottedInput).toBeTruthy();
    });

    it('does not render a label element when label is empty', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('renders a label element when label property is set', async () => {
      const el = await fixture<HelixField>('<hx-field label="Full Name"></hx-field>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeTruthy();
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text when label property is set', async () => {
      const el = await fixture<HelixField>('<hx-field label="Email Address"></hx-field>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Email Address');
    });

    it('does not render label element when label is empty string', async () => {
      const el = await fixture<HelixField>('<hx-field label=""></hx-field>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('label element has part="label" attribute', async () => {
      const el = await fixture<HelixField>('<hx-field label="Username"></hx-field>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── Property: required (6) ───

  describe('Property: required', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.required).toBe(false);
    });

    it('reflects required attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field required></hx-field>');
      expect(el.hasAttribute('required')).toBe(true);
    });

    it('shows required marker when required=true and label is set', async () => {
      const el = await fixture<HelixField>('<hx-field label="Name" required></hx-field>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent?.trim()).toBe('*');
    });

    it('required marker has aria-hidden="true"', async () => {
      const el = await fixture<HelixField>('<hx-field label="Name" required></hx-field>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker?.getAttribute('aria-hidden')).toBe('true');
    });

    it('required marker has part="required-indicator"', async () => {
      const el = await fixture<HelixField>('<hx-field label="Name" required></hx-field>');
      const marker = shadowQuery(el, '[part="required-indicator"]');
      expect(marker).toBeTruthy();
    });

    it('does not show required marker when required=false', async () => {
      const el = await fixture<HelixField>('<hx-field label="Name"></hx-field>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeNull();
    });
  });

  // ─── Property: error (5) ───

  describe('Property: error', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.error).toBe('');
    });

    it('renders error message container when error is set', async () => {
      const el = await fixture<HelixField>('<hx-field error="This field is required"></hx-field>');
      const errorDiv = shadowQuery(el, '[part="error-message"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('This field is required');
    });

    it('error container has role="alert" without conflicting aria-live attribute', async () => {
      const el = await fixture<HelixField>('<hx-field error="Invalid input"></hx-field>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);
    });

    it('field container gets field--error class when error is set', async () => {
      const el = await fixture<HelixField>('<hx-field error="Something went wrong"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--error')).toBe(true);
    });

    it('hides error message when error is cleared', async () => {
      const el = await fixture<HelixField>('<hx-field error="Required"></hx-field>');
      el.error = '';
      await el.updateComplete;
      const errorDiv = shadowQuery(el, '[part="error-message"]');
      expect(errorDiv).toBeNull();
    });
  });

  // ─── Property: helpText (4) ───

  describe('Property: helpText', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.helpText).toBe('');
    });

    it('renders help text container with part="help-text" when helpText is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="Enter a valid email address"></hx-field>',
      );
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv).toBeTruthy();
      expect(helpDiv?.textContent?.trim()).toContain('Enter a valid email address');
    });

    it('help text container is hidden when error is showing', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="Some guidance" error="Invalid value"></hx-field>',
      );
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv).toBeTruthy();
      expect(helpDiv?.hasAttribute('hidden')).toBe(true);
    });

    it('help text container is hidden when both helpText and error are empty', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv).toBeTruthy();
      expect(helpDiv?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field disabled></hx-field>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('field container gets field--disabled class when disabled', async () => {
      const el = await fixture<HelixField>('<hx-field disabled></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--disabled')).toBe(true);
    });
  });

  // ─── Property: hxSize (4) ───

  describe('Property: hxSize', () => {
    it('defaults to "md"', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.hxSize).toBe('md');
    });

    it('applies field--size-sm class for hx-size="sm"', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="sm"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--size-sm')).toBe(true);
    });

    it('applies field--size-md class for hx-size="md"', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="md"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--size-md')).toBe(true);
    });

    it('applies field--size-lg class for hx-size="lg"', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="lg"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--size-lg')).toBe(true);
    });

    it('logs a console warning when an invalid hx-size value is set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixField>('<hx-field hx-size="xl"></hx-field>');
      await el.updateComplete;
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[hx-field] Invalid hx-size value: "xl"'),
      );
      warnSpy.mockRestore();
    });

    it('applies no size class when an invalid hx-size value is set', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="xl"></hx-field>');
      await el.updateComplete;
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--size-sm')).toBe(false);
      expect(field?.classList.contains('field--size-md')).toBe(false);
      expect(field?.classList.contains('field--size-lg')).toBe(false);
    });
  });

  // ─── Slots (5) ───

  describe('Slots', () => {
    it('default slot renders slotted form control', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><input type="text" value="test" /></hx-field>',
      );
      const slottedInput = el.querySelector('input');
      expect(slottedInput).toBeTruthy();
      expect((slottedInput as HTMLInputElement).value).toBe('test');
    });

    it('label slot content overrides the label property', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Fallback"><span slot="label">Custom Label</span></hx-field>',
      );
      await el.updateComplete;
      const slottedLabel = el.querySelector('[slot="label"]');
      expect(slottedLabel).toBeTruthy();
      expect(slottedLabel?.textContent).toBe('Custom Label');
    });

    it('error slot content triggers field--error class on field container', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><span slot="error">Custom error</span></hx-field>',
      );
      await el.updateComplete;
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--error')).toBe(true);
    });

    it('help slot renders content inside help text container', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="fallback"><em slot="help">Custom help</em></hx-field>',
      );
      const slottedHelp = el.querySelector('[slot="help"]');
      expect(slottedHelp).toBeTruthy();
      expect(slottedHelp?.textContent).toBe('Custom help');
    });

    it('help slot renders even when helpText property is empty', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><em slot="help">Slot-only help</em></hx-field>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv).toBeTruthy();
      const slottedHelp = el.querySelector('[slot="help"]');
      expect(slottedHelp?.textContent).toBe('Slot-only help');
    });

    it('description slot renders content', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><p slot="description">Descriptive text</p></hx-field>',
      );
      const slottedDesc = el.querySelector('[slot="description"]');
      expect(slottedDesc).toBeTruthy();
      expect(slottedDesc?.textContent).toBe('Descriptive text');
    });
  });

  // ─── CSS Parts (6) ───

  describe('CSS Parts', () => {
    it('field part is present on outer container', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('label part is present on label element when label is set', async () => {
      const el = await fixture<HelixField>('<hx-field label="Test Label"></hx-field>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('control part is present on the control wrapper', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const control = shadowQuery(el, '[part="control"]');
      expect(control).toBeTruthy();
    });

    it('help-text part is present when helpText is set', async () => {
      const el = await fixture<HelixField>('<hx-field help-text="Guidance text"></hx-field>');
      const helpText = shadowQuery(el, '[part="help-text"]');
      expect(helpText).toBeTruthy();
    });

    it('error-message part is present when error is set', async () => {
      const el = await fixture<HelixField>('<hx-field error="Error occurred"></hx-field>');
      const errorMsg = shadowQuery(el, '[part="error-message"]');
      expect(errorMsg).toBeTruthy();
    });

    it('required-indicator part is present when required is true and label is set', async () => {
      const el = await fixture<HelixField>('<hx-field label="Name" required></hx-field>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeTruthy();
    });
  });

  // ─── Property reactivity (3) ───

  describe('Property reactivity', () => {
    it('updates label text when label property changes programmatically', async () => {
      const el = await fixture<HelixField>('<hx-field label="Original"></hx-field>');
      el.label = 'Updated';
      await el.updateComplete;
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Updated');
    });

    it('shows error message after error property is set programmatically', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      el.error = 'Field is required';
      await el.updateComplete;
      const errorDiv = shadowQuery(el, '[part="error-message"]');
      expect(errorDiv?.textContent?.trim()).toBe('Field is required');
    });

    it('field--required class is applied when required property is set programmatically', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      el.required = true;
      await el.updateComplete;
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--required')).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with label', async () => {
      const el = await fixture<HelixField>('<hx-field label="Patient Name"></hx-field>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Date of Birth" error="Please enter a valid date"></hx-field>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Medical Record Number" required></hx-field>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with slotted input and label (full composed tree)', async () => {
      const axeCore = await import('axe-core');
      const el = await fixture<HelixField>(
        '<hx-field label="Patient Name"><input type="text" /></hx-field>',
      );
      const results = await axeCore.default.run(el, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      });
      expect(results.violations).toEqual([]);
    });

    it('has no axe violations with slotted input in error state', async () => {
      const axeCore = await import('axe-core');
      const el = await fixture<HelixField>(
        '<hx-field label="Date of Birth" error="Please enter a valid date"><input type="text" /></hx-field>',
      );
      const results = await axeCore.default.run(el, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      });
      expect(results.violations).toEqual([]);
    });

    it('has no axe violations with slotted input when required', async () => {
      const axeCore = await import('axe-core');
      const el = await fixture<HelixField>(
        '<hx-field label="Medical Record Number" required><input type="text" /></hx-field>',
      );
      const results = await axeCore.default.run(el, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      });
      expect(results.violations).toEqual([]);
    });

    it('has no axe violations with slotted input when disabled', async () => {
      const axeCore = await import('axe-core');
      const el = await fixture<HelixField>(
        '<hx-field label="Notes" disabled><input type="text" disabled /></hx-field>',
      );
      const results = await axeCore.default.run(el, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
        rules: {
          // WCAG 1.4.3 explicitly exempts inactive UI components from color contrast requirements
          'color-contrast': { enabled: false },
        },
      });
      expect(results.violations).toEqual([]);
    });
  });

  // ─── ARIA management: slotted control (10) ───

  describe('ARIA management: slotted control', () => {
    it('sets aria-label on slotted input when label prop is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Full Name"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-label')).toBe('Full Name');
    });

    it('updates aria-label when label prop changes', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Old Label"><input type="text" /></hx-field>',
      );
      el.label = 'New Label';
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-label')).toBe('New Label');
    });

    it('removes aria-label when label prop is cleared', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name"><input type="text" /></hx-field>',
      );
      el.label = '';
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.hasAttribute('aria-label')).toBe(false);
    });

    it('sets aria-required="true" on slotted input when required', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-required')).toBe('true');
    });

    it('removes aria-required when required is cleared', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required><input type="text" /></hx-field>',
      );
      el.required = false;
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.hasAttribute('aria-required')).toBe(false);
    });

    it('sets aria-invalid="true" on slotted input when error is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field error="This field is required"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('removes aria-invalid when error is cleared', async () => {
      const el = await fixture<HelixField>(
        '<hx-field error="Required"><input type="text" /></hx-field>',
      );
      el.error = '';
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('sets aria-describedby on slotted input when error is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field error="Invalid value"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      const descId = input?.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      // The description element should exist in light DOM and contain the error text
      const descEl = el.querySelector(`#${descId}`);
      expect(descEl?.textContent).toBe('Invalid value');
    });

    it('sets aria-describedby on slotted input when helpText is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="Enter your full name"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      const descId = input?.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      const descEl = el.querySelector(`#${descId}`);
      expect(descEl?.textContent).toBe('Enter your full name');
    });

    it('prioritises error text over help text in the description element', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="Some guidance" error="Invalid"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      const descId = input?.getAttribute('aria-describedby');
      const descEl = el.querySelector(`#${descId!}`);
      expect(descEl?.textContent).toBe('Invalid');
    });

    it('removes aria-describedby from slotted control when error and helpText are both cleared', async () => {
      const el = await fixture<HelixField>(
        '<hx-field error="Required" help-text="Enter a value"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(true);

      el.error = '';
      el.helpText = '';
      await el.updateComplete;

      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('sets aria-invalid="true" on slotted input when error slot has content', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><input type="text" /><span slot="error">Slot error</span></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('does not set aria attributes on slotted hx-* custom elements', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required error="Required"><hx-text-input></hx-text-input></hx-field>',
      );
      await el.updateComplete;
      const hxInput = el.querySelector('hx-text-input');
      expect(hxInput?.hasAttribute('aria-label')).toBe(false);
      expect(hxInput?.hasAttribute('aria-required')).toBe(false);
      expect(hxInput?.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── ARIA management: native textarea and select (4) ───

  describe('ARIA management: native textarea and select', () => {
    it('sets aria-label on slotted textarea when label prop is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Clinical Notes"><textarea></textarea></hx-field>',
      );
      await el.updateComplete;
      const textarea = el.querySelector('textarea');
      expect(textarea?.getAttribute('aria-label')).toBe('Clinical Notes');
    });

    it('sets aria-invalid on slotted textarea when error is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field error="This field is required"><textarea></textarea></hx-field>',
      );
      await el.updateComplete;
      const textarea = el.querySelector('textarea');
      expect(textarea?.getAttribute('aria-invalid')).toBe('true');
    });

    it('sets aria-label on slotted select when label prop is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Department"><select><option>Option A</option></select></hx-field>',
      );
      await el.updateComplete;
      const select = el.querySelector('select');
      expect(select?.getAttribute('aria-label')).toBe('Department');
    });

    it('sets aria-required on slotted select when required is set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Department" required><select><option>Option A</option></select></hx-field>',
      );
      await el.updateComplete;
      const select = el.querySelector('select');
      expect(select?.getAttribute('aria-required')).toBe('true');
    });
  });

  // ─── Property: layout (3) ───

  describe('Property: layout', () => {
    it('defaults to "column"', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.layout).toBe('column');
    });

    it('applies field--layout-inline class for layout="inline"', async () => {
      const el = await fixture<HelixField>('<hx-field layout="inline"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--layout-inline')).toBe(true);
    });

    it('does not apply field--layout-inline class for layout="column"', async () => {
      const el = await fixture<HelixField>('<hx-field layout="column"></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--layout-inline')).toBe(false);
    });
  });

  // ─── Label click-to-focus (1) ───

  describe('Label click-to-focus', () => {
    it('focuses slotted input when shadow label is clicked', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Patient Name"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      const label = shadowQuery(el, 'label');
      expect(label).toBeTruthy();
      label!.click();
      expect(document.activeElement).toBe(input);
    });
  });

  // ─── ARIA: data-aria-managed opt-out (1) ───

  describe('ARIA: data-aria-managed opt-out', () => {
    it('skips ARIA bridging for elements with data-aria-managed attribute', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required error="Required"><input type="text" data-aria-managed /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.hasAttribute('aria-label')).toBe(false);
      expect(input?.hasAttribute('aria-required')).toBe(false);
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  // ─── Attribute reflection (4) ───

  describe('Attribute reflection', () => {
    it('reflects layout="inline" attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field layout="inline"></hx-field>');
      expect(el.getAttribute('layout')).toBe('inline');
    });

    it('reflects layout="column" attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field layout="column"></hx-field>');
      expect(el.getAttribute('layout')).toBe('column');
    });

    it('reflects hx-size="sm" attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="sm"></hx-field>');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });

    it('reflects hx-size="lg" attribute to host', async () => {
      const el = await fixture<HelixField>('<hx-field hx-size="lg"></hx-field>');
      expect(el.getAttribute('hx-size')).toBe('lg');
    });
  });

  // ─── ARIA: label slot suppresses aria-label (1) ───

  describe('ARIA: label slot suppresses aria-label on control', () => {
    it('does not set aria-label on slotted input when label slot is populated', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Fallback"><input type="text" /><span slot="label">Custom Label</span></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      // When a label slot is used, the component skips aria-label bridging
      expect(input?.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ─── Help text visibility (2) ───

  describe('Help text visibility', () => {
    it('shows help text when helpText is set and no error is present', async () => {
      const el = await fixture<HelixField>('<hx-field help-text="Guidance text"></hx-field>');
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv?.hasAttribute('hidden')).toBe(false);
    });

    it('shows help-text part when help slot has content but helpText property is empty', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><em slot="help">Slot help only</em></hx-field>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      // The help-text container should be visible because the slot has content
      expect(helpDiv).toBeTruthy();
      expect(helpDiv?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Lifecycle (2) ───

  describe('Lifecycle', () => {
    it('removes aria attributes from slotted control and description span on disconnect', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required error="Required"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input');
      expect(input?.getAttribute('aria-label')).toBe('Name');
      expect(input?.getAttribute('aria-required')).toBe('true');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.hasAttribute('aria-describedby')).toBe(true);

      el.remove();

      expect(input?.hasAttribute('aria-label')).toBe(false);
      expect(input?.hasAttribute('aria-required')).toBe(false);
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
      const descSpan = el.querySelector('[id$="-desc"]');
      expect(descSpan).toBeNull();
    });

    it('does not accumulate stale description spans across disconnect/reconnect cycles', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Name"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        expect(el.querySelectorAll('[id$="-desc"]').length).toBe(1);

        // Disconnect and reconnect
        el.remove();
        container.appendChild(el);
        await el.updateComplete;

        // Should still have exactly one description span
        expect(el.querySelectorAll('[id$="-desc"]').length).toBe(1);
      } finally {
        document.body.removeChild(container);
      }
    });
  });
});
