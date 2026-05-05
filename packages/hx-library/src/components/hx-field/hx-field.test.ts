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
      const errorDiv = shadowQuery(el, '[part="error"]');
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
      const errorDiv = shadowQuery(el, '[part="error"]');
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

  // ─── Property: size (4) ───

  describe('Property: size', () => {
    it('defaults to "md"', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      expect(el.size).toBe('md');
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
        '<hx-field help-text="fallback"><em slot="help-text">Custom help</em></hx-field>',
      );
      const slottedHelp = el.querySelector('[slot="help-text"]');
      expect(slottedHelp).toBeTruthy();
      expect(slottedHelp?.textContent).toBe('Custom help');
    });

    it('help slot renders even when helpText property is empty', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><em slot="help-text">Slot-only help</em></hx-field>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv).toBeTruthy();
      const slottedHelp = el.querySelector('[slot="help-text"]');
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

    it('error part is present when error is set', async () => {
      const el = await fixture<HelixField>('<hx-field error="Error occurred"></hx-field>');
      const errorMsg = shadowQuery(el, '[part="error"]');
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
      const errorDiv = shadowQuery(el, '[part="error"]');
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
        '<hx-field><em slot="help-text">Slot help only</em></hx-field>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      // The help-text container should be visible because the slot has content
      expect(helpDiv).toBeTruthy();
      expect(helpDiv?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── field--required CSS class (2) ───

  describe('field--required CSS class', () => {
    it('applies field--required class when required attribute is set', async () => {
      const el = await fixture<HelixField>('<hx-field required></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--required')).toBe(true);
    });

    it('does not apply field--required class when required is false', async () => {
      const el = await fixture<HelixField>('<hx-field></hx-field>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--required')).toBe(false);
    });
  });

  // ─── error state: aria-invalid on slot change (2) ───

  describe('error slot: aria-invalid on slotted textarea', () => {
    it('sets aria-invalid on slotted textarea when error slot has content', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><textarea></textarea><span slot="error">Error msg</span></hx-field>',
      );
      await el.updateComplete;
      const textarea = el.querySelector('textarea');
      expect(textarea?.getAttribute('aria-invalid')).toBe('true');
    });

    it('sets aria-invalid on slotted select when error slot has content', async () => {
      const el = await fixture<HelixField>(
        '<hx-field><select><option>A</option></select><span slot="error">Select error</span></hx-field>',
      );
      await el.updateComplete;
      const select = el.querySelector('select');
      expect(select?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── error clears help text visibility (2) ───

  describe('error interaction with help text slot', () => {
    it('help-text container is hidden when error slot has content', async () => {
      const el = await fixture<HelixField>(
        '<hx-field help-text="guidance"><span slot="error">Error</span></hx-field>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv?.hasAttribute('hidden')).toBe(true);
    });

    it('help-text container is visible when error slot is empty and helpText is set', async () => {
      const el = await fixture<HelixField>('<hx-field help-text="guidance"></hx-field>');
      await el.updateComplete;
      const helpDiv = shadowQuery(el, '[part="help-text"]');
      expect(helpDiv?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Programmatic disabled toggle (1) ───

  describe('Programmatic disabled toggle', () => {
    it('field--disabled class removed when disabled set to false programmatically', async () => {
      const el = await fixture<HelixField>('<hx-field disabled></hx-field>');
      el.disabled = false;
      await el.updateComplete;
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--disabled')).toBe(false);
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

  // ─── ARIA: slotted control re-resolution ───

  describe('ARIA: slotted control re-resolution', () => {
    /**
     * Wait one microtask + one render tick after a slot mutation so the
     * default-slot `slotchange` handler runs, `_resolveSlottedControl()`
     * adopts the new control, and the next `updated()` sync completes.
     */
    async function flushSlotChange(el: HelixField): Promise<void> {
      await el.updateComplete;
      await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
      await el.updateComplete;
    }

    it('re-syncs ARIA wiring when the slotted control is replaced post-mount', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Name" required error="Required"><input id="first" type="text" /></hx-field>',
      );
      await el.updateComplete;

      const first = el.querySelector('input#first') as HTMLInputElement;
      expect(first.getAttribute('aria-label')).toBe('Name');
      expect(first.getAttribute('aria-required')).toBe('true');
      expect(first.getAttribute('aria-invalid')).toBe('true');

      // Swap the slotted control: remove the original, append a fresh one.
      first.remove();
      const replacement = document.createElement('input');
      replacement.type = 'text';
      replacement.id = 'second';
      el.appendChild(replacement);

      await flushSlotChange(el);

      expect(replacement.getAttribute('aria-label')).toBe('Name');
      expect(replacement.getAttribute('aria-required')).toBe('true');
      expect(replacement.getAttribute('aria-invalid')).toBe('true');
      expect(replacement.hasAttribute('aria-describedby')).toBe(true);

      // The original control should have been stripped of host-owned ARIA.
      expect(first.hasAttribute('aria-label')).toBe(false);
      expect(first.hasAttribute('aria-required')).toBe(false);
      expect(first.hasAttribute('aria-invalid')).toBe(false);
      expect(first.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  // ─── ARIA: consumer aria-label precedence (round-13 F2) ───
  //
  // These tests exercise the marker-based ownership model. The host stamps
  // `data-hx-owns-label` on any control whose `aria-label` it writes; the
  // attribute's presence/absence is the single source of truth on every
  // sync, so post-mount mutations by the consumer (add, remove, toggle
  // `data-aria-managed`) are always honored.

  describe('ARIA: consumer aria-label precedence (F2)', () => {
    it('does not overwrite a consumer-set aria-label when the label prop is also set', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Visible Label"><input type="text" aria-label="Consumer Override" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Consumer Override');
      expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('does not overwrite a consumer-set aria-label when label prop changes after mount', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="First"><input type="text" aria-label="Consumer" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;

      el.label = 'Second';
      await el.updateComplete;

      expect(input.getAttribute('aria-label')).toBe('Consumer');
    });

    it('does not overwrite when consumer rewrites aria-label AFTER mount and label prop changes', async () => {
      // Failure mode for the old one-shot snapshot flag: consumer rewrites
      // aria-label post-mount, then the host runs another sync. The old
      // implementation would have overwritten the consumer value because
      // its captured-at-slotchange flag stayed false. The marker-based
      // model detects the value mismatch and releases ownership without
      // requiring the consumer to know about the marker.
      const el = await fixture<HelixField>(
        '<hx-field label="First"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('First');
      expect(input.hasAttribute('data-hx-owns-label')).toBe(true);

      // Consumer overwrites the value directly. They do NOT know about the
      // marker — they just call setAttribute. The marker stays put on the
      // DOM, but the value-mismatch check on the next sync detects the
      // overwrite and releases ownership.
      input.setAttribute('aria-label', 'Consumer Late Override');

      // Trigger another sync. Host must NOT clobber the consumer value.
      el.label = 'Second';
      await el.updateComplete;

      expect(input.getAttribute('aria-label')).toBe('Consumer Late Override');
      expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('restores the visible label when the consumer removes aria-label after mount', async () => {
      // Failure mode for the old flag: once captured as "consumer-set", the
      // host would never restore the label even if the consumer removed
      // their attribute. The marker model recomputes per sync.
      const el = await fixture<HelixField>(
        '<hx-field label="Visible"><input type="text" aria-label="Consumer" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Consumer');
      expect(input.hasAttribute('data-hx-owns-label')).toBe(false);

      // Consumer removes their override. The host should now mirror the
      // visible `label` prop on the next sync.
      input.removeAttribute('aria-label');

      // Trigger updated() — any property write will do.
      el.label = 'Visible Restored';
      await el.updateComplete;

      expect(input.getAttribute('aria-label')).toBe('Visible Restored');
      expect(input.getAttribute('data-hx-owns-label')).toBe('true');
    });

    it('honors a runtime data-aria-managed toggle by leaving the slotted control alone', async () => {
      // Failure mode for the old flag: it captured `data-aria-managed`
      // status only at slotchange. The marker model checks the attribute
      // on every sync, so toggling it post-mount works as expected.
      const el = await fixture<HelixField>(
        '<hx-field label="First"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('First');

      // Consumer opts out of ARIA mutation post-mount.
      input.setAttribute('data-aria-managed', '');

      // Host must skip bridging entirely — it must not touch aria-label,
      // aria-required, aria-invalid, or aria-describedby.
      el.label = 'Second';
      el.required = true;
      el.error = 'oops';
      await el.updateComplete;

      // aria-label still has the value from before the opt-out (host did
      // not overwrite, and did not remove host-owned label either).
      expect(input.getAttribute('aria-label')).toBe('First');
      expect(input.hasAttribute('aria-required')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('emits a dev-time warning when consumer aria-label competes with visible label prop', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Patient Name"><input type="text" aria-label="Patient Name Override" /></hx-field>',
        );
        await el.updateComplete;
        const labelWarnings = warnSpy.mock.calls.filter((args) =>
          String(args[0]).includes('Slotted control already has `aria-label`'),
        );
        expect(labelWarnings).toHaveLength(1);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('emits the competing-label warning at most once per adopted control', async () => {
      // Failure mode if the warn-latch lived in `_resolveSlottedControl()`
      // alone: subsequent syncs would re-emit the warning. The
      // `_competingLabelWarned` latch in `_syncSlottedControl()` ensures
      // exactly one warning per adoption no matter how many times the
      // host syncs.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Patient Name"><input type="text" aria-label="Override" /></hx-field>',
        );
        await el.updateComplete;

        // Several updates — each triggers _syncSlottedControl().
        el.label = 'Patient Name 2';
        await el.updateComplete;
        el.label = 'Patient Name 3';
        await el.updateComplete;
        el.required = true;
        await el.updateComplete;
        el.error = 'oops';
        await el.updateComplete;

        const labelWarnings = warnSpy.mock.calls.filter((args) =>
          String(args[0]).includes('Slotted control already has `aria-label`'),
        );
        expect(labelWarnings).toHaveLength(1);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when consumer aria-label is present but label prop is empty', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixField>(
          '<hx-field><input type="text" aria-label="Self-Labeled" /></hx-field>',
        );
        await el.updateComplete;
        const labelWarnings = warnSpy.mock.calls.filter((args) =>
          String(args[0]).includes('Slotted control already has `aria-label`'),
        );
        expect(labelWarnings).toHaveLength(0);
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Self-Labeled');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('respects consumer aria-label across slot replacement', async () => {
      const el = await fixture<HelixField>(
        '<hx-field label="Visible"><input id="a" type="text" /></hx-field>',
      );
      await el.updateComplete;
      const first = el.querySelector('input') as HTMLInputElement;
      // First control had no aria-label preset; hx-field wrote it and
      // stamped the ownership marker.
      expect(first.getAttribute('aria-label')).toBe('Visible');
      expect(first.getAttribute('data-hx-owns-label')).toBe('true');

      // Replace with a control that DOES have aria-label set by the consumer.
      first.remove();
      const replacement = document.createElement('input');
      replacement.type = 'text';
      replacement.id = 'b';
      replacement.setAttribute('aria-label', 'Replacement Override');
      el.appendChild(replacement);

      // Wait for slotchange + sync.
      await el.updateComplete;
      await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
      await el.updateComplete;

      expect(replacement.getAttribute('aria-label')).toBe('Replacement Override');
      expect(replacement.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('does not remove a consumer-set aria-label on disconnect', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Visible"><input type="text" aria-label="Owned by consumer" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Owned by consumer');

        el.remove();

        // The consumer's aria-label must survive teardown — hx-field never
        // wrote it, so it must not delete it.
        expect(input.getAttribute('aria-label')).toBe('Owned by consumer');
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('still strips host-owned aria-label on disconnect when the consumer did not preset it', async () => {
      // Regression guard for the F2 fix: when the consumer did NOT preset
      // aria-label, hx-field owns the attribute and must clean it up,
      // including the ownership marker.
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Visible"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Visible');
        expect(input.getAttribute('data-hx-owns-label')).toBe('true');

        el.remove();
        expect(input.hasAttribute('aria-label')).toBe(false);
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('releases an orphan ownership marker pre-mounted on a fresh control', async () => {
      // Regression guard for round-13 follow-up F1: if a slotted control
      // arrives with `data-hx-owns-label="true"` already stamped (e.g. it
      // was migrated from a prior hx-field, or a consumer pre-mounted the
      // marker themselves) and the new hx-field has never written to it,
      // the new host's `_lastWrittenAriaLabel` is `null`. Without the F1
      // guard, the value mismatch check `liveValue !== _lastWrittenAriaLabel`
      // short-circuits with `null !== "A"` returning true, so the host
      // would claim ownership and clobber the value on the next sync.
      // The fix: when the marker is present but the snapshot is null, the
      // host has no claim — strip the orphan marker and treat the value as
      // consumer-owned (defense-in-depth).
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        // Build an input with the ownership marker AND aria-label already
        // stamped — simulating either cross-host migration or a consumer
        // who pre-mounted the marker themselves.
        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('aria-label', 'A');
        input.setAttribute('data-hx-owns-label', 'true');

        const field = document.createElement('hx-field') as HelixField;
        // Note: NO label prop — field has never written to this control,
        // so its `_lastWrittenAriaLabel` is null when the marker is seen.
        field.appendChild(input);
        container.appendChild(field);

        // Wait for slotchange + initial sync to settle.
        await field.updateComplete;
        await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
        await field.updateComplete;

        // The orphan marker must be stripped, the consumer's aria-label
        // must be preserved untouched, and the field must NOT have claimed
        // ownership on its first encounter with this control.
        expect(input.getAttribute('aria-label')).toBe('A');
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      } finally {
        container.remove();
      }
    });

    // ─── Round-14 F1: suspend-window snapshot semantics ────────────────
    //
    // When a consumer toggles `data-aria-managed` ON, mutates `aria-label`,
    // then toggles it OFF, the host must respect the mutation as a
    // permanent takeover and NOT re-stamp `this.label`. Conversely, when
    // the consumer suspends and resumes WITHOUT mutating anything, the
    // host must resume bridging normally.

    it('does not re-stamp label when consumer changes aria-label during suspend window', async () => {
      // Failure mode for round-14 F1: removal of `data-aria-managed`
      // immediately fell into the `else if (this.label && ...)` branch
      // and overwrote the consumer's value, defeating the documented
      // "resume only if the snapshot still matches" contract.
      const el = await fixture<HelixField>(
        '<hx-field label="Original"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Original');
      expect(input.getAttribute('data-hx-owns-label')).toBe('true');

      // Consumer suspends bridging, swaps the value, then resumes.
      input.setAttribute('data-aria-managed', '');
      el.label = 'Will-not-apply';
      await el.updateComplete;
      // Mutation happens during the suspend window.
      input.setAttribute('aria-label', 'Custom');
      input.removeAttribute('data-aria-managed');

      // Force another sync.
      el.required = true;
      await el.updateComplete;

      // The consumer's value must survive — host must not re-stamp.
      expect(input.getAttribute('aria-label')).toBe('Custom');
      expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('does not re-stamp label when consumer removes aria-label during suspend window', async () => {
      // The "remove the attribute" variant of the suspend-window takeover.
      // Without the F1 fix the resume edge would reach the
      // `else if (this.label)` branch and re-stamp because
      // `consumerHasLabel` is false (no attribute present).
      const el = await fixture<HelixField>(
        '<hx-field label="Original"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Original');

      input.setAttribute('data-aria-managed', '');
      await el.updateComplete;
      input.removeAttribute('aria-label');
      input.removeAttribute('data-aria-managed');

      el.required = true;
      await el.updateComplete;

      expect(input.hasAttribute('aria-label')).toBe(false);
      expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('resumes bridging normally when consumer suspends and resumes without changes', async () => {
      // The complement to the takeover tests: if the consumer suspends
      // and resumes without modifying `aria-label`, the snapshot still
      // matches and the host continues to mirror `this.label` normally
      // (including re-stamping when the prop changes during suspend).
      const el = await fixture<HelixField>(
        '<hx-field label="First"><input type="text" /></hx-field>',
      );
      await el.updateComplete;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('First');

      input.setAttribute('data-aria-managed', '');
      await el.updateComplete;
      // No consumer mutation while suspended.
      input.removeAttribute('data-aria-managed');

      // Trigger a sync. Host should resume ownership and mirror the
      // current label prop.
      el.label = 'Second';
      await el.updateComplete;

      expect(input.getAttribute('aria-label')).toBe('Second');
      expect(input.getAttribute('data-hx-owns-label')).toBe('true');
    });

    // ─── Round-14 F2: teardown cleans up host-owned metadata even if ───
    //                  the consumer suspended bridging mid-life.
    it('strips host-owned aria-label and marker on slot replacement even when control has data-aria-managed', async () => {
      // Failure mode for round-14 F2: when hx-field wrote the label
      // before the consumer added `data-aria-managed`, the active-bridging
      // release helper short-circuited on the suspend attribute and the
      // outgoing control left the field carrying a stale `aria-label`
      // and `data-hx-owns-label` marker. Teardown must always clean up
      // a marker that hx-field stamped.
      const el = await fixture<HelixField>(
        '<hx-field label="Visible"><input id="a" type="text" /></hx-field>',
      );
      await el.updateComplete;
      const first = el.querySelector('input') as HTMLInputElement;
      expect(first.getAttribute('aria-label')).toBe('Visible');
      expect(first.getAttribute('data-hx-owns-label')).toBe('true');

      // Consumer suspends bridging on the existing control AFTER the
      // host has already written the label and marker.
      first.setAttribute('data-aria-managed', '');
      await el.updateComplete;

      // Replace the control. The outgoing control must be cleaned up.
      first.remove();
      const replacement = document.createElement('input');
      replacement.type = 'text';
      replacement.id = 'b';
      el.appendChild(replacement);

      await el.updateComplete;
      await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
      await el.updateComplete;

      expect(first.hasAttribute('aria-label')).toBe(false);
      expect(first.hasAttribute('data-hx-owns-label')).toBe(false);
    });

    it('strips host-owned aria-label on disconnect even when control has data-aria-managed', async () => {
      // The disconnect-time variant of round-14 F2.
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Visible"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Visible');
        expect(input.getAttribute('data-hx-owns-label')).toBe('true');

        // Consumer suspends bridging after the host has already written.
        input.setAttribute('data-aria-managed', '');
        await el.updateComplete;

        el.remove();

        expect(input.hasAttribute('aria-label')).toBe(false);
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      } finally {
        document.body.removeChild(container);
      }
    });

    // Codex round-17 F2: runtime mutations of `data-aria-managed` and
    // `aria-label` must reactively drive `_syncSlottedControl()`. Without
    // a MutationObserver on the slotted control, a consumer adding the
    // suspend marker post-mount left stale `aria-required` / `aria-invalid`
    // / `aria-describedby` in place until some unrelated host update
    // happened to flush them.
    describe('runtime data-aria-managed reactivity (F2)', () => {
      it('reactively clears bridged ARIA when data-aria-managed is added at runtime', async () => {
        const el = await fixture<HelixField>(
          '<hx-field label="Name" required error="Bad"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        // Initial bridged state: host wrote everything.
        expect(input.getAttribute('aria-label')).toBe('Name');
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.hasAttribute('aria-describedby')).toBe(true);

        // Consumer takes over ARIA at runtime — without changing any
        // hx-field property. The OLD code path stayed stale until the
        // next unrelated host render. The observer on the slotted control
        // must run _syncSlottedControl() now and short-circuit.
        input.setAttribute('data-aria-managed', '');
        // Wait one microtask for the MutationObserver to fire.
        await Promise.resolve();
        await el.updateComplete;

        // Suspend semantics: bridging is OFF. Host must not have written
        // any new attribute since suspend started. Existing host-written
        // values are intentionally left in place (the contract says the
        // consumer takes over from this point — they can mutate or clear
        // them themselves).
        // The reactivity guarantee we are testing is that the *next*
        // _syncSlottedControl() call (which in the old code would
        // overwrite stale state) does not run. Confirm by mutating a host
        // prop and verifying the change is NOT bridged.
        el.error = '';
        el.required = false;
        await el.updateComplete;

        // Because the suspend marker is now present, the post-update sync
        // also bails — the previously-written `aria-required` and
        // `aria-invalid` must remain untouched (they are the consumer's
        // problem now).
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(input.getAttribute('aria-invalid')).toBe('true');
      });

      it('reactively re-bridges ARIA when data-aria-managed is removed at runtime', async () => {
        const el = await fixture<HelixField>(
          '<hx-field label="Name"><input type="text" data-aria-managed /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        // Initially suspended — host wrote nothing.
        expect(input.hasAttribute('aria-label')).toBe(false);
        expect(input.hasAttribute('aria-required')).toBe(false);

        // Consumer hands ARIA back to hx-field at runtime — no host prop
        // changes. The observer must fire a resync that re-bridges.
        input.removeAttribute('data-aria-managed');
        await Promise.resolve();
        await el.updateComplete;

        expect(input.getAttribute('aria-label')).toBe('Name');
      });

      it('reactively detects consumer-takeover via runtime aria-label mutation', async () => {
        // Round-13 F2: a consumer overwriting host-owned `aria-label`
        // releases ownership. Without the observer this only fired on the
        // next unrelated host update; with it, the takeover is honored
        // immediately.
        const el = await fixture<HelixField>(
          '<hx-field label="Name"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Name');
        expect(input.hasAttribute('data-hx-owns-label')).toBe(true);

        // Consumer rewrites under us — no host prop change.
        input.setAttribute('aria-label', 'Consumer Label');
        await Promise.resolve();
        await el.updateComplete;

        // Ownership marker should be released by the resync the observer
        // triggered, leaving the consumer's value intact.
        expect(input.getAttribute('aria-label')).toBe('Consumer Label');
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      });

      it('disconnects the runtime observer when the slotted control is replaced', async () => {
        const el = await fixture<HelixField>(
          '<hx-field label="Name"><input id="first" type="text" /></hx-field>',
        );
        await el.updateComplete;
        const first = el.querySelector('#first') as HTMLInputElement;
        expect(first.getAttribute('aria-label')).toBe('Name');

        // Replace the slotted control. The observer for `first` must be
        // disconnected — otherwise mutations to the orphan control would
        // re-trigger _syncSlottedControl on the (now-different) bound
        // control and produce stale writes.
        first.remove();
        const second = document.createElement('input');
        second.id = 'second';
        el.appendChild(second);
        await el.updateComplete;
        expect(second.getAttribute('aria-label')).toBe('Name');

        // Mutate the orphaned `first` after detachment. The host must
        // ignore it — the new control's state remains untouched.
        first.setAttribute('data-aria-managed', '');
        first.setAttribute('aria-label', 'Stale');
        await Promise.resolve();
        await el.updateComplete;
        expect(second.getAttribute('aria-label')).toBe('Name');
      });
    });

    it('strips marker but preserves consumer value on disconnect when consumer overwrote during suspend', async () => {
      // Defense-in-depth: if the consumer overwrote `aria-label` during a
      // suspend window AND we tear down before they release the suspend,
      // we must strip the stale `data-hx-owns-label` marker (we are no
      // longer the owner) but leave the consumer's value intact.
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const el = await fixture<HelixField>(
          '<hx-field label="Original"><input type="text" /></hx-field>',
        );
        await el.updateComplete;
        const input = el.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-label')).toBe('Original');

        // Consumer suspends, overwrites — never resumes.
        input.setAttribute('data-aria-managed', '');
        await el.updateComplete;
        input.setAttribute('aria-label', 'Consumer Custom');

        el.remove();

        // The consumer's value survives, but our marker is gone.
        expect(input.getAttribute('aria-label')).toBe('Consumer Custom');
        expect(input.hasAttribute('data-hx-owns-label')).toBe(false);
      } finally {
        document.body.removeChild(container);
      }
    });
  });
});
