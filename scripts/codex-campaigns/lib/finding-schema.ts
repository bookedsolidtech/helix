/**
 * Canonical finding schema for Codex hardening campaigns.
 *
 * One JSONL line per finding. JSONL is the source of truth — every consumer
 * (consolidator, scoreboard, dashboard ingestion, jq queries) reads from
 * `.reports/codex/campaigns/<name>/findings.jsonl`. Markdown rollups are
 * generated views, never authored by hand.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Verdict = 'pass' | 'concerns' | 'blocking' | 'error';

export type Category =
  | 'cem-completeness'
  | 'cem-accuracy'
  | 'aria-delegation'
  | 'keyboard-nav'
  | 'token-cascade'
  | 'form-association'
  | 'color-contrast'
  | 'security'
  | 'correctness'
  | 'edge-case'
  | 'test-gap'
  | 'api-design'
  | 'performance'
  | 'other';

export interface Finding {
  /** Campaign name, e.g. "cem-accuracy" */
  campaign: string;
  /** Target path relative to repo root, e.g. "packages/hx-library/src/components/hx-button" */
  target: string;
  /** Custom-element tag name when applicable, e.g. "hx-button" */
  tag?: string;
  /** ISO 8601 UTC timestamp of when this finding was emitted */
  ts: string;
  /** SHA / identifier of the Codex run that produced this finding */
  codex_run: string;
  severity: Severity;
  category: Category;
  /** File path relative to repo root */
  file: string;
  /** Line number (1-based) where the issue manifests */
  line: number;
  /** Optional end line for spans */
  end_line?: number;
  /** What public surface the finding refers to, e.g. "property:loadingLabel", "event:hx-click", "part:label" */
  public_surface?: string;
  /** Precise problem statement, no hedging */
  issue: string;
  /** Quoted source or diff hunk that proves the issue exists */
  evidence: string;
  /** Concrete fix or clear direction */
  fix: string;
  /** Per-target verdict this finding contributes to */
  verdict_for_target: Verdict;
}

const SEVERITY: ReadonlySet<Severity> = new Set(['critical', 'high', 'medium', 'low', 'info']);

const VERDICT: ReadonlySet<Verdict> = new Set(['pass', 'concerns', 'blocking', 'error']);

const CATEGORY: ReadonlySet<Category> = new Set([
  'cem-completeness',
  'cem-accuracy',
  'aria-delegation',
  'keyboard-nav',
  'token-cascade',
  'form-association',
  'color-contrast',
  'security',
  'correctness',
  'edge-case',
  'test-gap',
  'api-design',
  'performance',
  'other',
]);

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateFinding(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['finding is not an object'] };
  }
  const f = value as Record<string, unknown>;

  const requireString = (key: string): void => {
    if (typeof f[key] !== 'string' || (f[key] as string).length === 0) {
      errors.push(`missing or empty string field: ${key}`);
    }
  };

  requireString('campaign');
  requireString('target');
  requireString('ts');
  requireString('codex_run');
  requireString('file');
  requireString('issue');
  requireString('evidence');
  requireString('fix');

  if (typeof f.line !== 'number' || !Number.isInteger(f.line) || f.line < 1) {
    errors.push('line must be a positive integer');
  }
  if (
    f.end_line !== undefined &&
    (typeof f.end_line !== 'number' || !Number.isInteger(f.end_line) || f.end_line < 1)
  ) {
    errors.push('end_line must be a positive integer when present');
  }
  if (typeof f.severity !== 'string' || !SEVERITY.has(f.severity as Severity)) {
    errors.push(`severity must be one of: ${[...SEVERITY].join(', ')}`);
  }
  if (typeof f.category !== 'string' || !CATEGORY.has(f.category as Category)) {
    errors.push(`category must be one of: ${[...CATEGORY].join(', ')}`);
  }
  if (typeof f.verdict_for_target !== 'string' || !VERDICT.has(f.verdict_for_target as Verdict)) {
    errors.push(`verdict_for_target must be one of: ${[...VERDICT].join(', ')}`);
  }
  if (f.tag !== undefined && typeof f.tag !== 'string') {
    errors.push('tag must be a string when present');
  }
  if (f.public_surface !== undefined && typeof f.public_surface !== 'string') {
    errors.push('public_surface must be a string when present');
  }

  return { ok: errors.length === 0, errors };
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};
