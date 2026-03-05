/**
 * @helixds/telemetry — Type definitions
 * Privacy-first: no PII, opt-in only.
 */

/** Data scopes that can be individually enabled/disabled. */
export type TelemetryScope = 'usage' | 'performance' | 'errors';

/** Configuration for the telemetry client. */
export interface TelemetryConfig {
  /** Must be explicitly `true` to enable data collection. Default: false (opt-in). */
  enabled: boolean;
  /** Endpoint URL that accepts POST requests with JSON telemetry batches. */
  endpoint?: string;
  /** How often to flush buffered events (ms). Default: 30000 (30s). */
  reportingInterval?: number;
  /** Which data scopes to collect. Default: all scopes. */
  scope?: TelemetryScope[];
  /** Maximum events per flush batch. Default: 50. */
  maxBatchSize?: number;
}

/** A single telemetry event — no PII fields allowed. */
export interface TelemetryEvent {
  type: TelemetryScope;
  component: string;
  /** ISO-8601 timestamp (UTC). */
  timestamp: string;
  /** Arbitrary non-PII metadata. */
  data: TelemetryEventData;
}

export interface UsageData {
  count: number;
}

export interface PerformanceData {
  /** Component render time in milliseconds. */
  renderTime: number;
}

export interface ErrorData {
  /** Error message (no stack trace to avoid leaking PII paths). */
  message: string;
  errorType: string;
}

export type TelemetryEventData = UsageData | PerformanceData | ErrorData;

/** Public interface of the telemetry client. */
export interface TelemetryClient {
  /** Track a component usage event. No-op when disabled or scope not included. */
  trackUsage(component: string): void;
  /** Track an error event. No-op when disabled or scope not included. */
  trackError(error: Error, component: string): void;
  /** Track a component render time. No-op when disabled or scope not included. */
  trackPerformance(component: string, renderTime: number): void;
  /** Force-flush buffered events immediately. Resolves when flush completes. */
  flush(): Promise<void>;
  /** Stop the reporting timer and release resources. */
  destroy(): void;
  /** Whether this client is actively collecting data. */
  readonly isEnabled: boolean;
}
