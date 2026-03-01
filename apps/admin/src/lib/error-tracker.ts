/**
 * Error tracker for Panopticon v2.
 * Loads tracked render failures and a11y violations from .claude/error-tracking.json.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TrackedError {
  id: string;
  type: 'render-failure' | 'a11y-violation' | 'type-error' | 'test-failure';
  component: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  resolved: boolean;
}

export interface ErrorTrackingData {
  errors: TrackedError[];
  summary: {
    total: number;
    unresolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

const ERROR_TRACKING_PATH = resolve(process.cwd(), '../../.claude/error-tracking.json');

/**
 * Fallback data used when the error-tracking.json file does not exist.
 */
const FALLBACK_DATA: ErrorTrackingData = {
  errors: [
    {
      id: 'err-001',
      type: 'a11y-violation',
      component: 'hx-button',
      message: 'Button missing accessible label in icon-only variant',
      severity: 'high',
      timestamp: '2026-02-28T14:32:00Z',
      resolved: false,
    },
    {
      id: 'err-002',
      type: 'test-failure',
      component: 'hx-text-input',
      message: 'Input value sync fails on rapid keydown events in Playwright',
      severity: 'medium',
      timestamp: '2026-02-27T09:15:00Z',
      resolved: false,
    },
    {
      id: 'err-003',
      type: 'render-failure',
      component: 'hx-card',
      message: 'Slot flicker on first render in Safari 17.x',
      severity: 'medium',
      timestamp: '2026-02-26T16:44:00Z',
      resolved: false,
    },
    {
      id: 'err-004',
      type: 'type-error',
      component: 'hx-button',
      message: 'Strict null check failure when variant prop is undefined in legacy consumer',
      severity: 'low',
      timestamp: '2026-02-25T11:20:00Z',
      resolved: true,
    },
    {
      id: 'err-005',
      type: 'a11y-violation',
      component: 'hx-text-input',
      message: 'Error message not announced by screen reader in required field',
      severity: 'critical',
      timestamp: '2026-02-24T08:05:00Z',
      resolved: false,
    },
  ],
  summary: {
    total: 5,
    unresolved: 4,
    bySeverity: { critical: 1, high: 1, medium: 2, low: 1 },
    byType: { 'a11y-violation': 2, 'test-failure': 1, 'render-failure': 1, 'type-error': 1 },
  },
};

/**
 * Compute the summary block from a list of errors.
 */
function computeSummary(errors: TrackedError[]): ErrorTrackingData['summary'] {
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let unresolved = 0;

  for (const err of errors) {
    bySeverity[err.severity] = (bySeverity[err.severity] ?? 0) + 1;
    byType[err.type] = (byType[err.type] ?? 0) + 1;
    if (!err.resolved) unresolved++;
  }

  return { total: errors.length, unresolved, bySeverity, byType };
}

/**
 * Load error tracking data from disk, falling back to seed data if file not found.
 */
export function loadErrorTrackingData(): ErrorTrackingData {
  if (!existsSync(ERROR_TRACKING_PATH)) {
    return FALLBACK_DATA;
  }

  try {
    const content = readFileSync(ERROR_TRACKING_PATH, 'utf-8');
    const parsed = JSON.parse(content) as { errors?: TrackedError[] };
    const errors = parsed.errors ?? [];
    return {
      errors,
      summary: computeSummary(errors),
    };
  } catch {
    return FALLBACK_DATA;
  }
}
