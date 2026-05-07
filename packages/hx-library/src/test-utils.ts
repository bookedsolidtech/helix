/**
 * Shared test utilities for WC-2026 web component tests.
 * Provides helpers for creating fixtures, querying shadow DOM, and event handling.
 */

export { resetIdCounter } from './base/id-counter.js';
export { formFixture, getFormData, resetForm } from './form-test-utils.js';

const fixtureContainer = document.createElement('div');
fixtureContainer.id = 'test-fixture-container';
document.body.appendChild(fixtureContainer);

/**
 * Creates a web component fixture, appends it to the DOM,
 * and waits for Lit's updateComplete lifecycle.
 */
export async function fixture<T extends HTMLElement>(html: string): Promise<T> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const el = wrapper.firstElementChild as T;
  fixtureContainer.appendChild(el);

  // Wait for Lit updateComplete if the element supports it
  if ('updateComplete' in el) {
    await (el as T & { updateComplete: Promise<boolean> }).updateComplete;
  }

  return el;
}

/**
 * Query a single element inside a host's shadow DOM.
 */
export function shadowQuery<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T | null {
  return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/**
 * Query all elements inside a host's shadow DOM.
 */
export function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}

/**
 * Returns a Promise that resolves on the next occurrence of an event on the element.
 * Rejects with a descriptive error if the event does not fire within the timeout.
 *
 * @param el - The target to listen on.
 * @param eventName - The event name to wait for.
 * @param timeoutMs - Maximum wait time in milliseconds (default 5000).
 */
export function oneEvent<T extends Event = Event>(
  el: EventTarget,
  eventName: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tag = el instanceof HTMLElement ? `<${el.tagName.toLowerCase()}>` : String(el);

    const timer = setTimeout(() => {
      el.removeEventListener(eventName, handler as EventListener);
      reject(
        new Error(`[oneEvent] Timed out after ${timeoutMs}ms waiting for "${eventName}" on ${tag}`),
      );
    }, timeoutMs);

    const handler = (e: Event) => {
      clearTimeout(timer);
      resolve(e as T);
    };

    el.addEventListener(eventName, handler as EventListener, { once: true });
  });
}

/**
 * Clears the fixture container between tests. Call in afterEach.
 */
export function cleanup(): void {
  fixtureContainer.innerHTML = '';
}

/**
 * Runs an axe-core accessibility audit on a component. Returns the axe results object.
 *
 * **Conformance level (AAA Cert Epic — Workstream B.1):**
 *
 * `level` controls which WCAG tag bucket is added to the axe `runOnly` list:
 * - `'aa'` (default) — runs `wcag2a` + `wcag2aa` + `best-practice`. Healthcare AA mandate.
 *   Behaviour identical to the pre-AAA-epic baseline; all existing tests stay AA-only.
 * - `'aaa'` — runs `wcag2a` + `wcag2aa` + `wcag2aaa` + `best-practice`. Used by the
 *   per-component AAA certification audits in Workstream B.3. Opt-in only — never the default.
 *
 * AA tags are always included even at `level: 'aaa'` so that AAA tests still surface any
 * baseline regressions; AAA stacks on top of AA, never replaces it.
 *
 * @param el - The host element to audit.
 * @param options.rules - Optional axe rule overrides.
 * @param options.useElement - When true, passes the host element directly to axe instead of
 *   its shadow root. Required for components that set ARIA roles on the host element itself
 *   (e.g. `role="list"` on `hx-breadcrumb`), so axe can traverse the full composed tree and
 *   resolve aria-required-parent relationships across shadow boundaries.
 * @param options.level - WCAG conformance level to assert. Defaults to `'aa'`.
 *   Set to `'aaa'` only when the component has earned `@aaa-certified` per the
 *   AAA Cert Epic (B.3) audit. Default behaviour is unchanged from the AA baseline.
 */
export async function checkA11y(
  el: HTMLElement,
  options?: {
    rules?: Record<string, { enabled: boolean }>;
    useElement?: boolean;
    level?: 'aa' | 'aaa';
  },
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }> {
  const axe = await import('axe-core');

  const context = options?.useElement ? el : (el.shadowRoot ?? el);
  const tags: string[] = ['wcag2a', 'wcag2aa', 'best-practice'];
  if (options?.level === 'aaa') {
    // Insert before 'best-practice' so axe's tag groups stay roughly conformance-ordered;
    // axe does not require a specific order, this is purely cosmetic for log output.
    tags.splice(2, 0, 'wcag2aaa');
  }

  const results = await axe.default.run(context as unknown as Node, {
    runOnly: {
      type: 'tag',
      values: tags,
    },
    rules: options?.rules,
  });

  return {
    violations: results.violations as AxeViolation[],
    passes: results.passes as AxePass[],
  };
}

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; failureSummary?: string }>;
}

export interface AxePass {
  id: string;
  description: string;
  help: string;
  nodes: Array<{ html: string }>;
}
