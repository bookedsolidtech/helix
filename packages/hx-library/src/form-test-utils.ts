/**
 * Form integration test utilities for HELiX ElementInternals lifecycle tests.
 *
 * These helpers create real <form> elements in the live DOM so that
 * FormData construction, form reset, and constraint validation all run
 * through the real browser form-association machinery — not mocks.
 *
 * Designed for Vitest browser mode (real Chromium DOM).
 */

/**
 * Appends a <form> containing the component to the shared fixture container,
 * waits for the component's first Lit update, and returns both references.
 *
 * Attributes in `attrs` are applied to the component element before it is
 * inserted, allowing declarative configuration without inner HTML string
 * concatenation.
 *
 * @param tag - The custom element tag name (e.g. "hx-text-input")
 * @param attrs - Optional attribute map applied to the component element
 * @param innerHtml - Optional inner HTML inserted inside the component (slots)
 * @returns Object with `el` (the component) and `form` (the wrapping form)
 */
export async function formFixture<T extends HTMLElement>(
  tag: string,
  attrs?: Record<string, string>,
  innerHtml?: string,
): Promise<{ el: T; form: HTMLFormElement }> {
  const container = document.getElementById('test-fixture-container');
  if (!container) {
    throw new Error(
      '[form-test-utils] #test-fixture-container not found. ' +
        'Ensure test-utils.ts has been imported so the container is created.',
    );
  }

  const form = document.createElement('form');
  // Prevent default navigation during submit events fired in tests
  form.addEventListener('submit', (e) => e.preventDefault());

  const el = document.createElement(tag) as T;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (innerHtml) {
    el.innerHTML = innerHtml;
  }

  form.appendChild(el);
  container.appendChild(form);

  // Wait for Lit's first render if the element is a Lit component
  if ('updateComplete' in el) {
    await (el as T & { updateComplete: Promise<boolean> }).updateComplete;
  }

  return { el, form };
}

/**
 * Returns the FormData built from the given form.
 *
 * Uses the standard `new FormData(form)` constructor which invokes the real
 * browser form-data collection path — including ElementInternals.setFormValue()
 * contributions from form-associated custom elements.
 *
 * @param form - The form element to collect data from
 */
export function getFormData(form: HTMLFormElement): FormData {
  return new FormData(form);
}

/**
 * Programmatically resets the form, then waits for any pending microtasks so
 * that Lit reactive property updates triggered by `formResetCallback` have
 * time to flush before the caller's assertions run.
 *
 * @param form - The form element to reset
 */
export async function resetForm(form: HTMLFormElement): Promise<void> {
  form.reset();
  // Allow one microtask tick for Lit's reactive update queue to flush.
  // Avoids `setTimeout`/`sleep` — this is deterministic in Vitest browser mode.
  await Promise.resolve();
}
