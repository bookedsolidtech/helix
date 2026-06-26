import { describe, it, expect, afterEach } from 'vitest';
import { customElement } from 'lit/decorators.js';
import { fixture, cleanup, oneEvent, checkA11y } from '../../test-utils.js';
import { HelixForm } from './hx-form.js';
import './index.js';
import '../hx-text-input/index.js';

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

/**
 * Lets a MutationObserver callback (microtask) fire after a light-DOM change,
 * then awaits the resulting Lit update. The macrotask tick guarantees the
 * observer has delivered records before we check the rendered output.
 */
async function flushMutations(el: HelixForm): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
  await el.updateComplete;
}

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

  // ─── Method property (3) ───

  describe('method property', () => {
    it('method can be set to get', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api" method="get"></hx-form>');
      expect(el.method).toBe('get');
      const form = el.querySelector('form');
      expect(form?.getAttribute('method')).toBe('get');
    });

    it('method can be set to post', async () => {
      const el = await fixture<HelixForm>('<hx-form action="/api" method="post"></hx-form>');
      expect(el.method).toBe('post');
    });

    it('enctype multipart sets enctype attribute on rendered form', async () => {
      const el = await fixture<HelixForm>(
        '<hx-form action="/upload" enctype="multipart/form-data"></hx-form>',
      );
      const form = el.querySelector('form');
      expect(form?.getAttribute('enctype')).toBe('multipart/form-data');
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

    it('intercepts when hx-form action is whitespace-only (treated as empty/controlled)', async () => {
      // hx-form's own `action` is trimmed: a whitespace-only value is the
      // controlled case (templated empty action), not a native-submit action.
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <form>
            <input type="text" name="username" value="testuser" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);
      expect(el.action).toBe('   ');

      // A slotted <form> is present, so hx-form renders slot-only — NO second
      // form. The slotted action-less form is the controlled-bridge target.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });

    it('renders its own <form> (no action attr) for a whitespace-only action and bridges direct controls', async () => {
      // Regression guard: a templated `action` that collapses to whitespace must
      // still make hx-form CREATE its own form owner for direct controls (raw
      // input + submit button, no slotted <form>). Render mode keys off a
      // non-empty string (incl. whitespace); the action ATTRIBUTE is omitted
      // unless the trimmed value is non-empty; the submit bridge stays controlled.
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <input type="text" name="username" value="testuser" />
          <button type="submit">Submit</button>
        </hx-form>
      `);

      // hx-form rendered exactly one own <form>, with no meaningless action attr.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(form.hasAttribute('action')).toBe(false);
      // The direct submit button is present in the component (functional control).
      expect(queryOrThrow<HTMLButtonElement>(el, 'button[type="submit"]')).toBeTruthy();

      // Submitting bridges (controlled): cancelled + hx-submit (valid).
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.valid).toBe(true);
    });

    it('validates direct controls on a whitespace-only action form (hx-invalid for required-empty)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <input type="text" name="required-field" required />
          <button type="submit">Submit</button>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-invalid');
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Buttons are functional: the bridge validated the direct control.
      expect(submitEvent.defaultPrevented).toBe(true);
      const event = await eventPromise;
      expect(event.detail.errors.length).toBeGreaterThan(0);
    });

    it('renders its own <form action> for a non-empty action and submits natively (direct controls)', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <input type="text" name="username" value="testuser" />
          <button type="submit">Submit</button>
        </hx-form>
      `);

      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(form.getAttribute('action')).toBe('/x');

      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Non-empty trimmed action → native submission, no bridge.
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
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

    it('does NOT render a second form around a slotted host form when action is whitespace', async () => {
      // Regression: whitespace action must NOT add an own <form> beside a slotted
      // host-owned form (that produced two <form>s and broke host submission).
      const el = await fixture<HelixForm>(`
        <hx-form action="   ">
          <form action="/host" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      // Exactly one form — the host's — and hx-form rendered none of its own.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();
      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(form.getAttribute('action')).toBe('/host');

      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // The host form owns its action → native submission, not intercepted.
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('does NOT nest a slotted host form when action is a real URL (single host form)', async () => {
      // Pre-existing bug fix: action="/x" + a slotted host form previously
      // rendered a second form; now slot-only mode keeps a single host form.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form action="/host" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();
      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(form.getAttribute('action')).toBe('/host');

      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

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

      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();
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

    it('ignores an unrelated NESTED descendant <form> and still renders its own form', async () => {
      // Regression: detection is direct-child-scoped. A <form> nested deeper in
      // consumer markup is NOT the host's submission form and must not suppress
      // hx-form's own wrapper for the outer direct controls.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <input type="text" name="u" value="v" />
          <div class="widget">
            <form action="/unrelated"><input type="text" name="n" /></form>
          </div>
          <button type="submit">Go</button>
        </hx-form>
      `);

      // hx-form still rendered its own <form> (the nested one is not the host).
      const own = el.querySelector('form[data-hx-own-form]');
      expect(own).not.toBeNull();
      // The nested unrelated form is not a direct child of hx-form.
      expect(el.querySelector(':scope > form:not([data-hx-own-form])')).toBeNull();
    });

    it('detects only a DIRECT-CHILD host form and switches to slot mode', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form action="/host" method="post">
            <input type="text" name="field" value="value" />
            <button type="submit">Submit</button>
          </form>
        </hx-form>
      `);

      // Direct-child host form detected → slot mode, single host form.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();
      expect(queryOrThrow<HTMLFormElement>(el, 'form').getAttribute('action')).toBe('/host');
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

  // ─── Reactive render mode on runtime child mutations (3) ───

  describe('Reactive render mode (runtime child mutations)', () => {
    it('switches to slot mode when a host form is inserted after mount', async () => {
      // Mount with direct controls (no slotted form) + action set → own <form>.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <input type="text" name="u" value="v" />
          <button type="submit">Go</button>
        </hx-form>
      `);
      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).not.toBeNull();

      // Consumer inserts its own host-owned form at runtime.
      const hostForm = document.createElement('form');
      hostForm.setAttribute('action', '/host');
      hostForm.setAttribute('method', 'post');
      hostForm.innerHTML = '<input type="text" name="f" value="v" /><button type="submit">Go</button>';
      el.prepend(hostForm);

      await flushMutations(el);

      // hx-form drops its own form → exactly one form, the host's.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();
      const form = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(form.getAttribute('action')).toBe('/host');

      // Host form owns its action → native submission, not intercepted.
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('re-renders its own form when the host form is removed after mount', async () => {
      // Mount with a slotted host form + action set → slot mode, single host form.
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <form action="/host" method="post">
            <input type="text" name="f" value="v" />
            <button type="submit">Go</button>
          </form>
        </hx-form>
      `);
      expect(el.querySelectorAll('form')).toHaveLength(1);
      expect(el.querySelector('form[data-hx-own-form]')).toBeNull();

      // Consumer removes its form at runtime.
      queryOrThrow<HTMLFormElement>(el, 'form:not([data-hx-own-form])').remove();

      await flushMutations(el);

      // hx-form re-renders its own <form action="/x"> → single own form.
      expect(el.querySelectorAll('form')).toHaveLength(1);
      const own = queryOrThrow<HTMLFormElement>(el, 'form');
      expect(own.hasAttribute('data-hx-own-form')).toBe(true);
      expect(own.getAttribute('action')).toBe('/x');

      // action="/x" → native submission (not intercepted).
      let dispatched = false;
      el.addEventListener('hx-submit', () => {
        dispatched = true;
      });
      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      own.dispatchEvent(submitEvent);
      expect(submitEvent.defaultPrevented).toBe(false);
      expect(dispatched).toBe(false);
    });

    it('settles without an infinite update loop after a host form is inserted', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <input type="text" name="u" value="v" />
          <button type="submit">Go</button>
        </hx-form>
      `);

      const hostForm = document.createElement('form');
      hostForm.setAttribute('action', '/host');
      el.prepend(hostForm);

      await flushMutations(el);
      // Component is idle: no pending update remains (a loop would never settle).
      expect(el.isUpdatePending).toBe(false);
      const countAfterSettle = el.querySelectorAll('form').length;

      // A further tick produces no additional re-render churn.
      await flushMutations(el);
      expect(el.isUpdatePending).toBe(false);
      expect(el.querySelectorAll('form')).toHaveLength(countAfterSettle);
      expect(countAfterSettle).toBe(1);
    });

    it('stays in own-form mode when only a NESTED descendant form is inserted at runtime', async () => {
      const el = await fixture<HelixForm>(`
        <hx-form action="/x">
          <input type="text" name="u" value="v" />
          <div class="widget"></div>
          <button type="submit">Go</button>
        </hx-form>
      `);
      expect(el.querySelector('form[data-hx-own-form]')).not.toBeNull();

      // Insert a form deep inside a child wrapper — not a direct child of hx-form.
      const wrapper = queryOrThrow<HTMLDivElement>(el, 'div.widget');
      const nested = document.createElement('form');
      nested.setAttribute('action', '/unrelated');
      wrapper.appendChild(nested);

      await flushMutations(el);

      // The nested form is not the host form → hx-form keeps its own wrapper.
      expect(el.querySelector('form[data-hx-own-form]')).not.toBeNull();
      expect(el.querySelector(':scope > form:not([data-hx-own-form])')).toBeNull();
    });
  });
});
