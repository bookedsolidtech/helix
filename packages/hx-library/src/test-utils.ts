/**
 * Shared test utilities for WC-2026 web component tests.
 * Provides helpers for creating fixtures, querying shadow DOM, and event handling.
 */

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
  selector: string
): T | null {
  return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/**
 * Query all elements inside a host's shadow DOM.
 */
export function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string
): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}

/**
 * Returns a Promise that resolves on the next occurrence of an event on the element.
 */
export function oneEvent<T extends Event = Event>(
  el: EventTarget,
  eventName: string
): Promise<T> {
  return new Promise<T>((resolve) => {
    el.addEventListener(eventName, ((e: Event) => resolve(e as T)) as EventListener, { once: true });
  });
}

/**
 * Clears the fixture container between tests. Call in afterEach.
 */
export function cleanup(): void {
  fixtureContainer.innerHTML = '';
}

/**
 * Runs axe-core WCAG 2.1 AA accessibility audit on a component.
 * Returns the axe results object. Throws if critical violations found.
 */
export async function checkA11y(
  el: HTMLElement,
  options?: { rules?: Record<string, { enabled: boolean }> }
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }> {
  const axe = await import('axe-core');

  const context = el.shadowRoot ?? el;
  const results = await axe.default.run(context as unknown as Node, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'best-practice'],
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
