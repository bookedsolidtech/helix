import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixFileUpload } from './hx-file-upload.js';
import './index.js';

afterEach(cleanup);

// ─── Helper: simulate file selection via the hidden file input ───

function simulateFileInput(component: HelixFileUpload, files: File[]): void {
  const input = shadowQuery<HTMLInputElement>(component, '.file-input');
  if (!input) throw new Error('Could not find .file-input inside hx-file-upload shadow DOM');
  const dt = new DataTransfer();
  files.forEach((f) => {
    dt.items.add(f);
  });
  Object.defineProperty(input, 'files', { value: dt.files, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── Helper: create a minimal File object ───

function makeFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe('hx-file-upload', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the field container', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const field = shadowQuery(el, '.field');
      expect(field).toBeTruthy();
    });

    it('renders dropzone part', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone).toBeTruthy();
    });

    it('renders with label when label attribute provided', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="Upload files"></hx-file-upload>',
      );
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Upload files');
    });

    it('renders label part when label is set', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="Documents"></hx-file-upload>',
      );
      const labelPart = shadowQuery(el, '[part="label"]');
      expect(labelPart).toBeTruthy();
    });
  });

  // ─── Properties (8) ───

  describe('Properties', () => {
    it('name defaults to empty string', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.name).toBe('');
    });

    it('accept defaults to empty string', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.accept).toBe('');
    });

    it('maxSize defaults to 0', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.maxSize).toBe(0);
    });

    it('maxFiles defaults to 0', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.maxFiles).toBe(0);
    });

    it('multiple defaults to false', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.multiple).toBe(false);
    });

    it('label defaults to empty string', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.label).toBe('');
    });

    it('disabled defaults to false', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.disabled).toBe(false);
    });

    it('disabled reflects to host attribute', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload disabled></hx-file-upload>');
      expect(el.disabled).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('error defaults to empty string', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.error).toBe('');
    });

    it('name attribute is reflected to property', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload name="documents"></hx-file-upload>',
      );
      expect(el.name).toBe('documents');
    });

    it('accept attribute is reflected to property', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload accept="image/*,.pdf"></hx-file-upload>',
      );
      expect(el.accept).toBe('image/*,.pdf');
    });

    it('max-size attribute maps to maxSize property', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload max-size="5242880"></hx-file-upload>',
      );
      expect(el.maxSize).toBe(5242880);
    });

    it('max-files attribute maps to maxFiles property', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload max-files="3"></hx-file-upload>');
      expect(el.maxFiles).toBe(3);
    });

    it('multiple attribute sets multiple property', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      expect(el.multiple).toBe(true);
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "dropzone" part', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const part = shadowQuery(el, '[part="dropzone"]');
      expect(part).toBeTruthy();
    });

    it('exposes "label" part when label is set', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="My label"></hx-file-upload>',
      );
      const part = shadowQuery(el, '[part="label"]');
      expect(part).toBeTruthy();
    });

    it('exposes "file-list" part after a file is added', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('report.pdf', 1024, 'application/pdf')]);
      await el.updateComplete;
      const part = shadowQuery(el, '[part="file-list"]');
      expect(part).toBeTruthy();
    });

    it('exposes "file-item" part after a file is added', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('photo.png', 512, 'image/png')]);
      await el.updateComplete;
      const part = shadowQuery(el, '[part="file-item"]');
      expect(part).toBeTruthy();
    });

    it('exposes "progress" part after a file is added', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('data.csv', 256, 'text/csv')]);
      await el.updateComplete;
      const part = shadowQuery(el, '[part="progress"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Dropzone Behavior (4) ───

  describe('Dropzone behavior', () => {
    it('dropzone has role="button"', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone?.getAttribute('role')).toBe('button');
    });

    it('dropzone has tabindex="0" by default', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone?.getAttribute('tabindex')).toBe('0');
    });

    it('dropzone has tabindex="-1" when disabled', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload disabled></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone?.getAttribute('tabindex')).toBe('-1');
    });

    it('dropzone has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload disabled></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone?.getAttribute('aria-disabled')).toBe('true');
    });

    it('dropzone does not have aria-disabled when enabled', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery(el, '[part="dropzone"]');
      expect(dropzone?.hasAttribute('aria-disabled')).toBe(false);
    });
  });

  // ─── File Processing (9) ───

  describe('File Processing', () => {
    it('file is added to the file list after simulated input', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('resume.pdf', 2048, 'application/pdf')]);
      await el.updateComplete;
      expect(el.files).toHaveLength(1);
      expect(el.files[0]?.name).toBe('resume.pdf');
    });

    it('hx-upload event is dispatched with correct files detail', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      const eventPromise = oneEvent<CustomEvent<{ files: File[] }>>(el, 'hx-upload');
      simulateFileInput(el, [makeFile('image.png', 512, 'image/png')]);
      const event = await eventPromise;
      expect(event.detail.files).toHaveLength(1);
      expect(event.detail.files[0]?.name).toBe('image.png');
    });

    it('hx-upload event bubbles and is composed', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      const eventPromise = oneEvent<CustomEvent<{ files: File[] }>>(el, 'hx-upload');
      simulateFileInput(el, [makeFile('doc.txt', 100, 'text/plain')]);
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('displays file name in list after upload', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('myfile.pdf', 1024, 'application/pdf')]);
      await el.updateComplete;
      const nameEl = shadowQuery(el, '.file-item__name');
      expect(nameEl?.textContent?.trim()).toContain('myfile.pdf');
    });

    it('file is removed when the remove button is clicked', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('delete-me.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      expect(el.files).toHaveLength(1);

      const removeBtn = shadowQuery<HTMLButtonElement>(el, '.file-item__remove');
      removeBtn?.click();
      await el.updateComplete;
      expect(el.files).toHaveLength(0);
    });

    it('hx-remove event is dispatched with correct detail on remove', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('remove-target.png', 256, 'image/png')]);
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ file: File; index: number }>>(el, 'hx-remove');
      const removeBtn = shadowQuery<HTMLButtonElement>(el, '.file-item__remove');
      removeBtn?.click();
      const event = await eventPromise;
      expect(event.detail.file.name).toBe('remove-target.png');
      expect(event.detail.index).toBe(0);
    });

    it('hx-error is dispatched when file type does not match accept', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload accept="image/*"></hx-file-upload>',
      );
      const eventPromise = oneEvent<CustomEvent<{ message: string; files: File[] }>>(
        el,
        'hx-error',
      );
      simulateFileInput(el, [makeFile('document.pdf', 1024, 'application/pdf')]);
      const event = await eventPromise;
      expect(event.detail.files).toHaveLength(1);
      expect(event.detail.message).toBeTruthy();
    });

    it('hx-error is dispatched when file exceeds maxSize', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload max-size="1024"></hx-file-upload>',
      );
      const eventPromise = oneEvent<CustomEvent<{ message: string; files: File[] }>>(
        el,
        'hx-error',
      );
      // File is 2048 bytes, limit is 1024
      simulateFileInput(el, [makeFile('large.png', 2048, 'image/png')]);
      const event = await eventPromise;
      expect(event.detail.files).toHaveLength(1);
      expect(event.detail.message).toContain('large.png');
    });

    it('maxFiles limit prevents adding files beyond the cap', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload multiple max-files="2"></hx-file-upload>',
      );
      simulateFileInput(el, [
        makeFile('a.pdf', 100, 'application/pdf'),
        makeFile('b.pdf', 100, 'application/pdf'),
      ]);
      await el.updateComplete;
      expect(el.files).toHaveLength(2);

      // Attempting to add a third file triggers hx-error and adds nothing
      const errorPromise = oneEvent<CustomEvent<{ message: string; files: File[] }>>(
        el,
        'hx-error',
      );
      simulateFileInput(el, [makeFile('c.pdf', 100, 'application/pdf')]);
      const errorEvent = await errorPromise;
      expect(errorEvent.detail.message).toContain('2');
      await el.updateComplete;
      expect(el.files).toHaveLength(2);
    });

    it('single-file mode: new file replaces the previous file', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      simulateFileInput(el, [makeFile('first.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      expect(el.files[0]?.name).toBe('first.pdf');

      simulateFileInput(el, [makeFile('second.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      expect(el.files).toHaveLength(1);
      expect(el.files[0]?.name).toBe('second.pdf');
    });

    it('disabled component does not process dropped files', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload disabled></hx-file-upload>');
      // Directly call _processFiles through file input — the handler checks disabled
      simulateFileInput(el, [makeFile('blocked.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      // The file input change handler calls _processFiles which returns early when disabled
      expect(el.files).toHaveLength(0);
    });
  });

  // ─── Progress (3) ───

  describe('Progress', () => {
    it('setProgress updates the progress bar width', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('upload.zip', 4096, 'application/zip')]);
      await el.updateComplete;

      el.setProgress(0, 60);
      await el.updateComplete;

      const progressBar = shadowQuery<HTMLElement>(el, '.progress-bar');
      expect(progressBar?.style.width).toBe('60%');
    });

    it('setProgress clamps values below 0 to 0', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('clamp-low.pdf', 512, 'application/pdf')]);
      await el.updateComplete;

      el.setProgress(0, -50);
      await el.updateComplete;

      const progressBar = shadowQuery<HTMLElement>(el, '.progress-bar');
      expect(progressBar?.style.width).toBe('0%');
    });

    it('setProgress clamps values above 100 to 100', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('clamp-high.pdf', 512, 'application/pdf')]);
      await el.updateComplete;

      el.setProgress(0, 150);
      await el.updateComplete;

      const progressBar = shadowQuery<HTMLElement>(el, '.progress-bar');
      expect(progressBar?.style.width).toBe('100%');
    });

    it('setProgress with an out-of-range index is a no-op', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('noop.pdf', 512, 'application/pdf')]);
      await el.updateComplete;

      // Index 5 is beyond the list — should not throw or mutate state
      expect(() => el.setProgress(5, 50)).not.toThrow();
      await el.updateComplete;

      const progressBar = shadowQuery<HTMLElement>(el, '.progress-bar');
      // Progress for index 0 should remain at its initial value of 0
      expect(progressBar?.style.width).toBe('0%');
    });
  });

  // ─── files Getter (2) ───

  describe('files getter', () => {
    it('returns an empty array when no files have been added', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.files).toEqual([]);
    });

    it('returns File objects matching what was added', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      const file = makeFile('getter-test.pdf', 512, 'application/pdf');
      simulateFileInput(el, [file]);
      await el.updateComplete;
      expect(el.files[0]?.name).toBe('getter-test.pdf');
    });
  });

  // ─── Form Integration (4) ───

  describe('Form Integration', () => {
    it('static formAssociated is true', () => {
      const ctor = customElements.get('hx-file-upload') as unknown as {
        formAssociated: boolean;
      };
      expect(ctor.formAssociated).toBe(true);
    });

    it('form getter returns null when not inside a form', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.form).toBeNull();
    });

    it('form getter returns the associated form element', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-file-upload name="upload"></hx-file-upload>';
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test fixture container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-file-upload') as HelixFileUpload;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback clears the file list', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('before-reset.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      expect(el.files).toHaveLength(1);

      el.formResetCallback();
      await el.updateComplete;
      expect(el.files).toHaveLength(0);
    });

    it('formResetCallback removes the rendered file list from shadow DOM', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload multiple></hx-file-upload>');
      simulateFileInput(el, [makeFile('gone.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      expect(shadowQuery(el, '[part="file-list"]')).toBeTruthy();

      el.formResetCallback();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="file-list"]')).toBeNull();
    });
  });

  // ─── Form Validation API (4) ───

  describe('Form Validation API', () => {
    it('checkValidity() returns true when component has no validity constraints', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity() returns true when component is valid', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validity.valid is true when no constraints are violated', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.validity.valid).toBe(true);
    });

    it('validationMessage is empty when component is valid', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      expect(el.validationMessage).toBe('');
    });
  });

  // ─── Error Display (3) ───

  describe('Error Display', () => {
    it('renders error message when error property is set', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload error="File is required"></hx-file-upload>',
      );
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.textContent?.trim()).toBe('File is required');
    });

    it('error container has role="alert"', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload error="Something went wrong"></hx-file-upload>',
      );
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
    });

    it('no error container rendered when error is empty', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv).toBeNull();
    });

    it('error container has aria-live="polite"', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload error="Upload failed"></hx-file-upload>',
      );
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.getAttribute('aria-live')).toBe('polite');
    });

    it('dropzone gets error CSS class when error is set', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload error="Bad file"></hx-file-upload>',
      );
      const dropzone = shadowQuery(el, '.dropzone');
      expect(dropzone?.classList.contains('dropzone--error')).toBe(true);
    });

    it('dropzone does not have error CSS class when error is empty', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery(el, '.dropzone');
      expect(dropzone?.classList.contains('dropzone--error')).toBe(false);
    });
  });

  // ─── Keyboard Navigation (3) ───

  describe('Keyboard Navigation', () => {
    it('Enter key on dropzone triggers file input click', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery<HTMLElement>(el, '[part="dropzone"]');
      const input = shadowQuery<HTMLInputElement>(el, '.file-input');
      let clicked = false;
      input?.addEventListener('click', () => {
        clicked = true;
      });
      dropzone?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(clicked).toBe(true);
    });

    it('Space key on dropzone triggers file input click', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      const dropzone = shadowQuery<HTMLElement>(el, '[part="dropzone"]');
      const input = shadowQuery<HTMLInputElement>(el, '.file-input');
      let clicked = false;
      input?.addEventListener('click', () => {
        clicked = true;
      });
      dropzone?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(clicked).toBe(true);
    });

    it('Enter key does not trigger file input click when disabled', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload disabled></hx-file-upload>');
      const dropzone = shadowQuery<HTMLElement>(el, '[part="dropzone"]');
      const input = shadowQuery<HTMLInputElement>(el, '.file-input');
      let clicked = false;
      input?.addEventListener('click', () => {
        clicked = true;
      });
      dropzone?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(clicked).toBe(false);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders custom dropzone content', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload><span>Drop here!</span></hx-file-upload>',
      );
      const slottedContent = el.querySelector('span');
      expect(slottedContent?.textContent).toBe('Drop here!');
    });

    it('file-list slot hides built-in file list', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload multiple><ul slot="file-list"><li>Custom list</li></ul></hx-file-upload>',
      );
      simulateFileInput(el, [makeFile('slotted.pdf', 512, 'application/pdf')]);
      await el.updateComplete;
      // The built-in file list must be absent when the file-list slot is occupied
      const builtInList = shadowQuery(el, '[part="file-list"]');
      expect(builtInList).toBeNull();
    });
  });

  // ─── Multiple file validation messages (2) ───

  describe('Multiple file validation', () => {
    it('hx-error message references the rejected file name on type mismatch', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload accept=".pdf"></hx-file-upload>');
      const errorPromise = oneEvent<CustomEvent<{ message: string; files: File[] }>>(
        el,
        'hx-error',
      );
      simulateFileInput(el, [makeFile('photo.jpg', 512, 'image/jpeg')]);
      const event = await errorPromise;
      expect(event.detail.message).toContain('photo.jpg');
    });

    it('hx-error message references MB limit on size excess', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload max-size="1048576"></hx-file-upload>',
      );
      const errorPromise = oneEvent<CustomEvent<{ message: string; files: File[] }>>(
        el,
        'hx-error',
      );
      simulateFileInput(el, [makeFile('huge.bin', 2097152, 'application/octet-stream')]);
      const event = await errorPromise;
      // The message should contain the MB limit (1.0 MB)
      expect(event.detail.message).toContain('1.0 MB');
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixFileUpload>('<hx-file-upload></hx-file-upload>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with a label', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="Patient records"></hx-file-upload>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="Upload" error="File type not supported"></hx-file-upload>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixFileUpload>(
        '<hx-file-upload label="Upload" disabled></hx-file-upload>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
