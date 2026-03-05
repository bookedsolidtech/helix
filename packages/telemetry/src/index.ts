/**
 * @helixds/telemetry
 *
 * Lightweight, opt-in client-side telemetry SDK for HelixDS.
 * Privacy-first: no PII, configurable reporting, easy opt-out.
 *
 * @example
 * ```ts
 * import { createTelemetry } from '@helixds/telemetry';
 *
 * const telemetry = createTelemetry({
 *   enabled: true, // opt-in required
 *   endpoint: 'https://your-backend/telemetry',
 *   reportingInterval: 60_000,
 *   scope: ['usage', 'errors'],
 * });
 *
 * telemetry.trackUsage('hx-button');
 * ```
 */

export { createTelemetry } from './client.js';

export type {
  TelemetryConfig,
  TelemetryClient,
  TelemetryEvent,
  TelemetryScope,
  UsageData,
  PerformanceData,
  ErrorData,
  TelemetryEventData,
} from './types.js';
