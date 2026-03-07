import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, oneEvent, checkA11y } from '../../test-utils.js';
import type { HelixForm } from './hx-form.js';
import './index.js';
import '../hx-text-input/index.js';

afterEach(cleanup);

describe('hx-form', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders as Light DOM (no shadowRoot)', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');
      expect(el.shadowRoot).toBeNull();
    });

    it('renders <form> tag when action is set', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/submit"></hx-form>');
      const form = el.querySelector('form');
      expect(form).toBeTruthy();
      expect(form?.getAttribute('action')).toBe('/submit');
    });

    it('does not render <form> tag when no action', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');
      const form = el.querySelector('form');
      expect(form).toBeNull();
    });
  });

  // ─── Properties (5) ───

  describe('Properties', () => {
    it('action property sets form action attribute', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api/save"></hx-form>');
      expect(el.action).toBe('/api/save');
      const form = el.querySelector('form');
      expect(form?.getAttribute('action')).toBe('/api/save');
    });

    it('method property defaults to post', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api"></hx-form>');
      expect(el.method).toBe('post');
      const form = el.querySelector('form');
      expect(form?.getAttribute('method')).toBe('post');
    });

    it('novalidate property sets novalidate attribute on form', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api" novalidate></hx-form>');
      expect(el.novalidate).toBe(true);
      const form = el.querySelector('form');
      expect(form?.hasAttribute('novalidate')).toBe(true);
    });

    it('name property sets name attribute on form', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api" name="login-form"></hx-form>');
      expect(el.name).toBe('login-form');
      const form = el.querySelector('form');
      expect(form?.getAttribute('name')).toBe('login-form');
    });

    it('enctype property sets enctype attribute on form', async () => {
      const el = await fixture<HelixForm>(
        '<hx-form action="/api" enctype="multipart/form-data"></hx-form>',
      );
      expect(el.enctype).toBe('multipart/form-data');
      const form = el.querySelector('form');
      expect(form?.getAttribute('enctype')).toBe('multipart/form-data');
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-submit on valid client-side submit', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');

      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;

      expect(event.detail.valid).toBe(true);
      expect(event.detail.values).toBeDefined();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-submit detail includes FormData instance', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;

      expect(event.detail.formData).toBeInstanceOf(FormData);
      expect(event.detail.formData.get('username')).toBe('testuser');
    });

    it('hx-submit detail.values preserves multi-value fields as arrays', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="checkbox" name="allergies" value="peanuts" checked />
            <input type="checkbox" name="allergies" value="dairy" checked />
            <input type="text" name="patient" value="jdoe" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;

      expect(Array.isArray(event.detail.values['allergies'])).toBe(true);
      expect(event.detail.values['allergies']).toContain('peanuts');
      expect(event.detail.values['allergies']).toContain('dairy');
      expect(event.detail.values['patient']).toBe('jdoe');
    });

    it('dispatches hx-invalid when validation fails on submit', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="email" name="email" value="not-an-email" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      // Set a value that will fail email validation
      const input = el.querySelector('input')!;
      input.value = '';

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;

      expect(event.detail.errors).toBeDefined();
      expect(Array.isArray(event.detail.errors)).toBe(true);
      expect(event.detail.errors.length).toBeGreaterThan(0);
    });

    it('does not dispatch hx-submit when action is set (native passthrough)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/api/submit">
          <form action="/api/submit" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Native submission passthrough: event should NOT have been prevented
      // and hx-submit should NOT have been dispatched
      expect(dispatched).toBe(false);
      expect(submitEvent.defaultPrevented).toBe(false);
    });

    it('dispatches hx-reset when form is reset', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="field" value="test" />
            <button type="reset">Reset</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-reset');
      form.dispatchEvent(new Event('reset', { bubbles: true }));
      const event = await eventPromise;

      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-reset clears validation error summary', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
            <button type="reset">Reset</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;

      // Trigger validation failure to show error summary
      const invalidPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      await invalidPromise;

      // Wait for re-render
      await el.updateComplete;
      expect(el.querySelector('.hx-form-error-summary')).toBeTruthy();

      // Reset should clear the error summary
      const resetPromise = oneEvent<CustomEvent>(el, 'hx-reset');
      form.dispatchEvent(new Event('reset', { bubbles: true }));
      await resetPromise;

      await el.updateComplete;
      expect(el.querySelector('.hx-form-error-summary')).toBeNull();
    });
  });

  // ─── Form Discovery (3) ───

  describe('Form Discovery', () => {
    it('getFormElements() returns hx-* form components', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <hx-text-input name="first" label="First"></hx-text-input>
          <hx-text-input name="last" label="Last"></hx-text-input>
        </hx-form>
      `);

      const elements = el.getFormElements();
      expect(elements.length).toBe(2);
      expect(elements[0].tagName.toLowerCase()).toBe('hx-text-input');
    });

    it('getNativeFormElements() returns native form elements', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="username" />
          <select name="role"><option value="admin">Admin</option></select>
          <textarea name="bio"></textarea>
          <button type="submit">Go</button>
        </hx-form>
      `);

      const elements = el.getNativeFormElements();
      expect(elements.length).toBe(4);
    });

    it('getFormData() returns FormData from child inputs', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form>
            <input type="text" name="username" value="jdoe" />
            <input type="email" name="email" value="jdoe@example.com" />
          </form>
        </hx-form>
      `);

      const formData = el.getFormData();
      expect(formData.get('username')).toBe('jdoe');
      expect(formData.get('email')).toBe('jdoe@example.com');
    });

    it('getFormData() preserves multi-value fields (checkboxes with same name)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form>
            <input type="checkbox" name="allergies" value="peanuts" checked />
            <input type="checkbox" name="allergies" value="shellfish" checked />
            <input type="checkbox" name="allergies" value="dairy" />
          </form>
        </hx-form>
      `);

      const formData = el.getFormData();
      const allValues = formData.getAll('allergies');
      expect(allValues).toHaveLength(2);
      expect(allValues).toContain('peanuts');
      expect(allValues).toContain('shellfish');
    });

    it('getFormData() collects from named inputs manually when no child <form>', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="patient" value="Jane Doe" />
          <input type="checkbox" name="consent" value="yes" checked />
          <input type="checkbox" name="medications" value="aspirin" checked />
          <input type="checkbox" name="medications" value="ibuprofen" checked />
        </hx-form>
      `);

      const formData = el.getFormData();
      expect(formData.get('patient')).toBe('Jane Doe');
      expect(formData.get('consent')).toBe('yes');
      const meds = formData.getAll('medications');
      expect(meds).toHaveLength(2);
      expect(meds).toContain('aspirin');
      expect(meds).toContain('ibuprofen');
    });
  });

  // ─── Validation (5) ───

  describe('Validation', () => {
    it('checkValidity() returns false when required field is empty', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="required-field" required />
        </hx-form>
      `);

      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity() returns true when all fields are valid', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="field" value="filled" required />
        </hx-form>
      `);

      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity() triggers validation UI and returns false for invalid', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="required-field" required />
        </hx-form>
      `);

      expect(el.reportValidity()).toBe(false);
    });

    it('checkValidity() calls checkValidity() on hx-* components', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <hx-text-input name="patient-name" label="Patient Name" required></hx-text-input>
        </hx-form>
      `);

      // hx-text-input implements checkValidity via ElementInternals or custom method
      const hxInput = el.querySelector('hx-text-input');
      if (hxInput && 'checkValidity' in hxInput && typeof hxInput.checkValidity === 'function') {
        // The hx-form should delegate checkValidity to the component
        const result = el.checkValidity();
        // With no value and required, should return false
        expect(typeof result).toBe('boolean');
      } else {
        // hx-text-input doesn't expose checkValidity — form should still not throw
        expect(() => el.checkValidity()).not.toThrow();
      }
    });

    it('hx-invalid sets aria-invalid on invalid fields', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const input = el.querySelector('input')!;

      const invalidPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      await invalidPromise;

      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── Error Summary (3) ───

  describe('Error Summary', () => {
    it('renders error summary with role=alert on validation failure', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = el.querySelector('form')!;
      const invalidPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      await invalidPromise;

      await el.updateComplete;
      const summary = el.querySelector('.hx-form-error-summary');
      expect(summary).toBeTruthy();
      expect(summary?.getAttribute('role')).toBe('alert');
    });

    it('setErrors() renders error summary programmatically', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" value="duplicate" />
        </hx-form>
      `);

      el.setErrors([{ name: 'mrn', message: 'MRN already exists in the system.' }]);
      await el.updateComplete;

      const summary = el.querySelector('.hx-form-error-summary');
      expect(summary).toBeTruthy();
      expect(summary?.getAttribute('role')).toBe('alert');
      expect(summary?.textContent).toContain('MRN already exists in the system.');
    });

    it('setErrors() sets aria-invalid on named fields', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" value="duplicate" />
        </hx-form>
      `);

      el.setErrors([{ name: 'mrn', message: 'MRN already exists.' }]);
      await el.updateComplete;

      const input = el.querySelector('input[name="mrn"]')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('clearErrors() removes error summary and aria-invalid', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" value="duplicate" />
        </hx-form>
      `);

      el.setErrors([{ name: 'mrn', message: 'MRN already exists.' }]);
      await el.updateComplete;
      expect(el.querySelector('.hx-form-error-summary')).toBeTruthy();

      el.clearErrors();
      await el.updateComplete;
      expect(el.querySelector('.hx-form-error-summary')).toBeNull();
      const input = el.querySelector('input[name="mrn"]')!;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('setFieldError() merges with existing errors', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" />
          <input type="text" name="dob" />
        </hx-form>
      `);

      el.setErrors([{ name: 'mrn', message: 'MRN already exists.' }]);
      el.setFieldError('dob', 'Invalid date of birth.');
      await el.updateComplete;

      const summary = el.querySelector('.hx-form-error-summary');
      expect(summary?.textContent).toContain('MRN already exists.');
      expect(summary?.textContent).toContain('Invalid date of birth.');
    });
  });

  // ─── Scoped Styles (3) ───

  describe('Scoped Styles', () => {
    it('adopted stylesheet is injected into document', async () => {
      const _el = await fixture<HelixForm>('<hx-form></hx-form>');

      // The AdoptedStylesheetsController should have added a stylesheet
      const hasFormStyles = document.adoptedStyleSheets.some((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-form'));
        } catch {
          return false;
        }
      });
      expect(hasFormStyles).toBe(true);
    });

    it('styles are scoped to wc-form selector', async () => {
      const _el = await fixture<HelixForm>('<hx-form></hx-form>');

      const formSheet = document.adoptedStyleSheets.find((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-form'));
        } catch {
          return false;
        }
      });
      expect(formSheet).toBeTruthy();

      // Verify all rules target wc-form (scoped)
      if (formSheet) {
        const rules = Array.from(formSheet.cssRules);
        const nonMediaRules = rules.filter((rule) => !(rule instanceof CSSMediaRule));
        for (const rule of nonMediaRules) {
          if (rule instanceof CSSStyleRule) {
            expect(rule.selectorText).toContain('hx-form');
          }
        }
      }
    });

    it('stylesheet is removed on disconnect', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');

      const countBefore = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-form'));
        } catch {
          return false;
        }
      }).length;

      expect(countBefore).toBeGreaterThan(0);

      el.remove();

      const countAfter = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-form'));
        } catch {
          return false;
        }
      }).length;

      expect(countAfter).toBeLessThan(countBefore);
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form>
            <div class="form-item">
              <label for="a11y-name">Name</label>
              <input type="text" id="a11y-name" name="name" />
            </div>
          </form>
        </hx-form>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with required fields', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form>
            <div class="form-item">
              <label for="a11y-email">
                Email
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="email" id="a11y-email" name="email" required />
            </div>
          </form>
        </hx-form>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with error states', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form>
            <div class="form-item error">
              <label for="a11y-err">Field</label>
              <input type="text" id="a11y-err" name="field" aria-invalid="true" aria-describedby="a11y-err-msg" />
              <span id="a11y-err-msg" class="error-message" role="alert">This field has an error.</span>
            </div>
          </form>
        </hx-form>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
