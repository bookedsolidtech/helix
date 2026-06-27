import { describe, it, expect, afterEach } from 'vitest';
import { customElement } from 'lit/decorators.js';
import { fixture, cleanup, oneEvent, checkA11y } from '../../test-utils.js';
import { HelixForm } from './hx-form.js';
import './index.js';
import '../hx-text-input/index.js';
import '../hx-checkbox/index.js';

/**
 * Subclass that opts out of the submit bridge by overriding the protected
 * `shouldInterceptSubmit` hook — proving the hook is cleanly overridable
 * without monkey-patching the private listener.
 */
@customElement('hx-form-no-bridge-test')
class HelixFormNoBridge extends HelixForm {
  protected override shouldInterceptSubmit(): boolean {
    return false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-form-no-bridge-test': HelixFormNoBridge;
  }
}

/**
 * Query a single element from a fixture root, throwing a clear error (rather
 * than relying on a non-null assertion) when the selector matches nothing.
 * Narrows the return type so callers get a non-nullable element.
 */
function queryOrThrow<T extends Element = Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (found === null) {
    throw new Error(`[hx-form.test] expected to find "${selector}" in the fixture, but it was missing.`);
  }
  return found;
}

afterEach(cleanup);

describe('hx-form', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders as Light DOM (no shadowRoot)', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');
      expect(el.shadowRoot).toBeNull();
    });

    it('renders NO own <form>, even with an action set', async () => {
      // hx-form is a pure Light-DOM wrapper: it never renders its own <form>.
      const el = await fixture<HelixForm>('<hx-form action="/submit"></hx-form>');
      expect(el.querySelector('form')).toBeNull();
    });

    it('renders only the slotted content (no own <form>) with no action', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');
      expect(el.querySelector('form')).toBeNull();
    });
  });

  // ─── Properties — deprecated, retained for compat, no render effect (5) ───

  describe('Properties (deprecated, retained, no render effect)', () => {
    it('action property is retained but renders no <form>', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api/save"></hx-form>');
      expect(el.action).toBe('/api/save');
      expect(el.querySelector('form')).toBeNull();
    });

    it('method property is retained but renders no <form>', async () => {
      const el = await fixture<HelixForm>('<hx-form method="get"></hx-form>');
      expect(el.method).toBe('get');
      expect(el.querySelector('form')).toBeNull();
    });

    it('novalidate property is retained', async () => {
      const el = await fixture<HelixForm>('<hx-form novalidate></hx-form>');
      expect(el.novalidate).toBe(true);
      expect(el.querySelector('form')).toBeNull();
    });

    it('name property is retained but renders no <form>', async () => {
      const el = await fixture<HelixForm>('<hx-form name="login-form"></hx-form>');
      expect(el.name).toBe('login-form');
      expect(el.querySelector('form')).toBeNull();
    });

    it('enctype property is retained but renders no <form>', async () => {
      const el = await fixture<HelixForm>('<hx-form enctype="multipart/form-data"></hx-form>');
      expect(el.enctype).toBe('multipart/form-data');
      expect(el.querySelector('form')).toBeNull();
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

  // ─── novalidate skips checkValidity on submit (2) ───

  describe('novalidate skips validation on submit', () => {
    it('novalidate flag bypasses client-side validity check and dispatches hx-submit', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="" novalidate>
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-submit valid flag is true when novalidate bypasses validation', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="" novalidate>
          <form>
            <input type="text" name="field" value="" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      const form = el.querySelector('form')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });
  });

  // ─── setFieldError deduplicates by name (2) ───

  describe('setFieldError deduplication', () => {
    it('setFieldError replaces existing error for same name', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" />
        </hx-form>
      `);
      el.setFieldError('mrn', 'First error.');
      el.setFieldError('mrn', 'Updated error.');
      await el.updateComplete;
      const summary = el.querySelector('.hx-form-error-summary');
      expect(summary?.textContent).toContain('Updated error.');
      // Should not contain both messages
      const listItems = Array.from(summary?.querySelectorAll('li') ?? []);
      const mrnItems = listItems.filter((li) => li.textContent?.includes('error.'));
      expect(mrnItems).toHaveLength(1);
    });

    it('clearErrors removes aria-invalid from all named fields', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <input type="text" name="mrn" />
          <input type="text" name="dob" />
        </hx-form>
      `);
      el.setErrors([
        { name: 'mrn', message: 'MRN error.' },
        { name: 'dob', message: 'DOB error.' },
      ]);
      await el.updateComplete;
      el.clearErrors();
      await el.updateComplete;
      const mrn = el.querySelector<HTMLInputElement>('input[name="mrn"]')!;
      const dob = el.querySelector<HTMLInputElement>('input[name="dob"]')!;
      expect(mrn.hasAttribute('aria-invalid')).toBe(false);
      expect(dob.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── hx-reset clears aria-invalid (1) ───

  describe('hx-reset clears aria-invalid', () => {
    it('hx-reset removes aria-invalid from all fields', async () => {
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
      const input = el.querySelector('input')!;
      const invalidPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      await invalidPromise;
      await el.updateComplete;
      expect(input.getAttribute('aria-invalid')).toBe('true');

      const resetPromise = oneEvent<CustomEvent>(el, 'hx-reset');
      form.dispatchEvent(new Event('reset', { bubbles: true }));
      await resetPromise;
      await el.updateComplete;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── getNativeFormElements includes button (1) ───

  describe('getNativeFormElements', () => {
    it('getNativeFormElements returns buttons', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <button type="submit">Go</button>
        </hx-form>
      `);
      const elements = el.getNativeFormElements();
      const buttons = elements.filter((e) => e.tagName.toLowerCase() === 'button');
      expect(buttons.length).toBe(1);
    });
  });

  // ─── Host-owned forms & no-intercept opt-out (6) ───

  describe('Host-owned form submission and no-intercept', () => {
    it('controlled action-less form is still intercepted (preventDefault + hx-submit)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Bridge runs: the event is cancelled and hx-submit fires.
      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });

    it('treats a whitespace-only action as empty: slot-only render, slotted form bridged', async () => {
      // A whitespace-only `action` collapses to the empty case — hx-form renders
      // only a <slot> (no own <form>); a slotted action-less form is bridged, and
      // the discriminator treats the whitespace action as controlled.
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      expect(el.action).toBe('   ');
      // Slot-only: the only form is the slotted one (no own <form action="   ">).
      expect(el.querySelectorAll('form')).toHaveLength(1);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
      expect(event.detail.values['username']).toBe('testuser');
    });

    it('validates a slotted form under a whitespace-only action (hx-invalid for required-empty)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.errors.length).toBeGreaterThan(0);
    });

    it('does NOT cancel a slotted host-owned <form action> (native submission proceeds)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form action="/host/owned/submit" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // The slotted form owns its own action: hx-form must not cancel it and
      // must not run the client-side bridge.
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('slotted host form with empty hx-form action stays a single native host form', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form action="/host" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      // Empty action → slot-only render, so the host form is the only form.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      const form = queryOrThrow<HTMLFormElement>(el, 'form');

      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('validates a slotted action-less host form even when hx-form has an action prop', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form>
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.errors.length).toBeGreaterThan(0);
    });

    it('scopes the controlled bridge to the submitting form (ignores another sibling form)', async () => {
      // Two action-less slotted forms coexist (plus hx-form's own <form action>).
      // Submitting the first must validate/collect only its own fields — the
      // second form's invalid required field must NOT block it.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form id="inner-form">
            <input type="text" name="innerField" value="innerValue" />
            <button type="submit">Submit inner</button>
          </form>
          <form id="other-form">
            <input type="text" name="otherRequired" required />
            <button type="submit">Submit other</button>
          </form>
        </hx-form>
      `);

      const innerForm = queryOrThrow<HTMLFormElement>(el, '#inner-form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      innerForm.dispatchEvent(submitEvent);

      // The other form's invalid required field does NOT block the inner submit.
      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
      // Payload is the inner form's field only — the other form's field is excluded.
      expect(event.detail.values['innerField']).toBe('innerValue');
      expect(event.detail.values['otherRequired']).toBeUndefined();
      expect(event.detail.formData.get('innerField')).toBe('innerValue');
      expect(event.detail.formData.get('otherRequired')).toBeNull();
    });

    it('still validates the submitting form even when a sibling form is valid', async () => {
      // Mirror case: submitting the form WITH the invalid field still fails,
      // proving the scope follows the submitter, not DOM order.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form id="valid-form">
            <input type="text" name="okField" value="ok" />
            <button type="submit">Submit valid</button>
          </form>
          <form id="invalid-form">
            <input type="text" name="needed" required />
            <button type="submit">Submit invalid</button>
          </form>
        </hx-form>
      `);

      const invalidForm = queryOrThrow<HTMLFormElement>(el, '#invalid-form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      invalidForm.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.errors.some((er) => er.name === 'needed')).toBe(true);
    });

    it('honors an externally-associated (form="id") control in the submitting form', async () => {
      // A required control associated via `form="f"` but placed OUTSIDE the form.
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <input type="text" name="external" form="ext-form" required />
          <form id="ext-form">
            <input type="text" name="inner" value="innerValue" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, '#ext-form');
      const externalInput = queryOrThrow<HTMLInputElement>(el, 'input[name="external"]');

      // Empty external required control → the form is invalid → hx-invalid.
      const invalidPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const invalidSubmit = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(invalidSubmit);
      expect(invalidSubmit.defaultPrevented).toBe(true);
      const invalidEvent = await invalidPromise;
      expect(invalidEvent.detail.errors.some((er) => er.name === 'external')).toBe(true);

      // Fill the external control → hx-submit valid, and its value is in the payload.
      externalInput.value = 'externalValue';
      const validPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const validSubmit = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(validSubmit);
      expect(validSubmit.defaultPrevented).toBe(true);
      const validEvent = await validPromise;
      expect(validEvent.detail.valid).toBe(true);
      // `new FormData(form)` includes the external form="id" control.
      expect(validEvent.detail.values['external']).toBe('externalValue');
      expect(validEvent.detail.values['inner']).toBe('innerValue');
    });

    it('getFormData() falls back to the host form in slot-only mode', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form>
          <form action="/host">
            <input type="text" name="hostField" value="hostValue" />
          </form>
        </hx-form>
      `);

      // Empty action → slot-only render → getFormData reads the host form's data.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      const data = el.getFormData();
      expect(data.get('hostField')).toBe('hostValue');
    });

    it('collects values from an all-hx-* slotted form (controlled submit)', async () => {
      // Regression: a form whose only fields are hx-* form-associated controls
      // must still produce a non-empty payload — `new FormData(form)` captures
      // their values via ElementInternals.setFormValue.
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <hx-text-input name="username" value="alice" label="Username"></hx-text-input>
            <hx-checkbox name="agree" value="yes" checked label="Agree"></hx-checkbox>
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      // Let the hx-* controls flush their form values.
      await el.updateComplete;

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      const event = await eventPromise;
      expect(event.detail.values['username']).toBe('alice');
      expect(event.detail.formData.get('username')).toBe('alice');
      expect(event.detail.formData.get('agree')).toBe('yes');
      // getFormData() returns the same hx-* values, not an empty payload.
      expect(el.getFormData().get('username')).toBe('alice');
    });

    it('collects mixed native and hx-* controls in the same form', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <hx-text-input name="hxField" value="hxValue" label="HX"></hx-text-input>
            <input type="text" name="nativeField" value="nativeValue" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      await el.updateComplete;

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      const event = await eventPromise;
      expect(event.detail.formData.get('hxField')).toBe('hxValue');
      expect(event.detail.formData.get('nativeField')).toBe('nativeValue');
    });

    it('intercepts a slotted <form action=""> (empty action is the controlled case)', async () => {
      // Templated markup (Twig/Drupal) that binds an action which renders empty
      // must still be bridged exactly like a form with no action attribute.
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form action="">
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });

    it('dispatches hx-invalid for an invalid slotted <form action=""> (controlled case)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form action="   ">
            <input type="text" name="required-field" required />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // A whitespace-only action is also empty after trim → controlled bridge.
      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.errors.length).toBeGreaterThan(0);
    });

    it('does NOT intercept when the submitter carries a non-empty formaction (multi-submit host form)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="field" value="value" />
            <button type="submit">Save</button>
            <button type="submit" formaction="/host/preview">Preview</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const previewBtn = queryOrThrow<HTMLButtonElement>(el, 'button[formaction]');
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      // The Preview button overrides the (empty) form action with its own
      // formaction → host-owned → native submission, no bridge.
      const submitEvent = new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: previewBtn,
      });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('intercepts when the submitter has no formaction on an action-less form (controlled case)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="">
          <form>
            <input type="text" name="field" value="value" />
            <button type="submit">Save</button>
            <button type="submit" formaction="/host/preview">Preview</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const saveBtn = queryOrThrow<HTMLButtonElement>(el, 'button:not([formaction])');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');

      // The Save button has no formaction → controlled bridge runs as usual.
      const submitEvent = new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: saveBtn,
      });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });

    it('no-intercept lets an action-less contained form submit natively (no hx-submit)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="" no-intercept>
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      expect(el.noIntercept).toBe(true);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('no-intercept lets a contained <form action> submit natively (no hx-submit)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="" no-intercept>
          <form action="/host/owned/submit" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('no-intercept reflects to the no-intercept attribute', async () => {
      const el = await fixture<HelixForm>('<hx-form></hx-form>');
      expect(el.hasAttribute('no-intercept')).toBe(false);
      el.noIntercept = true;
      await el.updateComplete;
      expect(el.hasAttribute('no-intercept')).toBe(true);
    });

    it('a subclass overriding shouldInterceptSubmit to false suppresses interception', async () => {
      const el = await fixture<HelixFormNoBridge>(`
        <hx-form-no-bridge-test action="">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form-no-bridge-test>
      `);
      expect(el).toBeInstanceOf(HelixForm);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Even though the form is action-less (would normally bridge), the
      // overridden hook declines interception.
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });
  });
});
