/**
 * @helixds/telemetry — Core client
 *
 * Design principles:
 * - Opt-in only: `enabled` must be explicitly `true`
 * - No PII: only component names, counts, render times, error types/messages
 * - SSR-safe: guards all browser APIs behind typeof checks
 * - Tree-shakable: single export `createTelemetry`
 */

import type { TelemetryConfig, TelemetryClient, TelemetryEvent, TelemetryScope } from './types.js';

const DEFAULT_INTERVAL = 30_000;
const DEFAULT_MAX_BATCH = 50;
const DEFAULT_SCOPES: TelemetryScope[] = ['usage', 'performance', 'errors'];

/** Returns a no-op client. Used when telemetry is disabled. */
function createNoopClient(): TelemetryClient {
  return {
    trackUsage: () => undefined,
    trackError: () => undefined,
    trackPerformance: () => undefined,
    flush: () => Promise.resolve(),
    destroy: () => undefined,
    isEnabled: false,
  };
}

/**
 * Create a telemetry client.
 *
 * Pass `enabled: true` to activate data collection.
 * Without it, all methods are no-ops and nothing is reported.
 *
 * @example
 * ```ts
 * const telemetry = createTelemetry({
 *   enabled: true,
 *   endpoint: 'https://your-backend/telemetry',
 *   reportingInterval: 60_000,
 *   scope: ['usage', 'errors'],
 * });
 *
 * telemetry.trackUsage('hx-button');
 * ```
 */
export function createTelemetry(config: TelemetryConfig): TelemetryClient {
  if (!config.enabled) {
    return createNoopClient();
  }

  const endpoint = config.endpoint;
  const interval = config.reportingInterval ?? DEFAULT_INTERVAL;
  const maxBatch = config.maxBatchSize ?? DEFAULT_MAX_BATCH;
  const scopes = new Set<TelemetryScope>(config.scope ?? DEFAULT_SCOPES);

  const buffer: TelemetryEvent[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;

  function now(): string {
    return new Date().toISOString();
  }

  function enqueue(event: TelemetryEvent): void {
    buffer.push(event);
    if (buffer.length >= maxBatch) {
      void doFlush();
    }
  }

  async function doFlush(): Promise<void> {
    if (buffer.length === 0 || !endpoint) return;
    const batch = buffer.splice(0, maxBatch);
    // SSR guard: fetch may not be available in all environments
    const fetchFn =
      typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function'
        ? globalThis.fetch.bind(globalThis)
        : undefined;

    if (!fetchFn) return;

    try {
      await fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        // Use keepalive so events are sent even during page unload
        keepalive: true,
      });
    } catch {
      // Silent failure — telemetry must never break the host application
    }
  }

  // Start the reporting timer (browser-only; SSR environments have no setInterval side effects)
  if (typeof setInterval !== 'undefined' && endpoint) {
    timer = setInterval(() => {
      void doFlush();
    }, interval);
  }

  const client: TelemetryClient = {
    isEnabled: true,

    trackUsage(component: string): void {
      if (!scopes.has('usage')) return;
      enqueue({ type: 'usage', component, timestamp: now(), data: { count: 1 } });
    },

    trackError(error: Error, component: string): void {
      if (!scopes.has('errors')) return;
      enqueue({
        type: 'errors',
        component,
        timestamp: now(),
        data: {
          message: error.message,
          errorType: error.name,
        },
      });
    },

    trackPerformance(component: string, renderTime: number): void {
      if (!scopes.has('performance')) return;
      enqueue({ type: 'performance', component, timestamp: now(), data: { renderTime } });
    },

    flush(): Promise<void> {
      return doFlush();
    },

    destroy(): void {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    },
  };

  return client;
}
