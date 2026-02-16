'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AllTestResults, TestResult, ComponentCoverage } from '@/lib/test-results-reader';
import { TEST_CATEGORY_META } from '@/lib/test-categories';

interface TestResultsTableProps {
  results: AllTestResults;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '< 1ms';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}\u00B5s`;
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const statusIcons: Record<string, { icon: string; color: string }> = {
  pass: { icon: '\u2713', color: 'text-emerald-400' },
  fail: { icon: '\u2717', color: 'text-red-400' },
  skip: { icon: '\u2014', color: 'text-amber-400' },
};

const componentColors: Record<string, { bg: string; text: string; border: string }> = {
  'hx-alert': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  'hx-badge': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  'hx-button': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'hx-card': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'hx-checkbox': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  'hx-container': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  'hx-radio': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'hx-radio-group': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  'hx-select': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'hx-switch': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  'hx-text-input': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'hx-textarea': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
  },
};

const defaultColor = { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' };

function coverageTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
}

interface ComponentGroup {
  component: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
}

function groupByComponent(tests: TestResult[]): ComponentGroup[] {
  const map = new Map<string, TestResult[]>();
  for (const t of tests) {
    const existing = map.get(t.component) ?? [];
    existing.push(t);
    map.set(t.component, existing);
  }

  return Array.from(map.entries())
    .map(([component, componentTests]) => ({
      component,
      tests: componentTests,
      passed: componentTests.filter((t) => t.status === 'pass').length,
      failed: componentTests.filter((t) => t.status === 'fail').length,
      skipped: componentTests.filter((t) => t.status === 'skip').length,
      totalDuration: componentTests.reduce((sum, t) => sum + t.duration, 0),
    }))
    .sort((a, b) => {
      // Failed components first, then alphabetical
      if (a.failed > 0 && b.failed === 0) return -1;
      if (a.failed === 0 && b.failed > 0) return 1;
      return a.component.localeCompare(b.component);
    });
}

export function TestResultsTable({ results }: TestResultsTableProps) {
  const groups = groupByComponent(results.tests);

  // Auto-expand components with failures
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.failed > 0).map((g) => g.component)),
  );
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggle = (component: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(component)) {
        next.delete(component);
      } else {
        next.add(component);
      }
      return next;
    });
  };

  const toggleError = (fullName: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(groups.map((g) => g.component)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {groups.length} components, {results.tests.length} tests
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span className="text-border">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Component groups */}
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {groups.map((group) => {
          const isOpen = expanded.has(group.component);
          const colors = componentColors[group.component] ?? defaultColor;
          const passRate =
            group.tests.length > 0 ? Math.round((group.passed / group.tests.length) * 100) : 0;
          const coverage: ComponentCoverage | undefined =
            results.coverageByComponent[group.component];
          const covPct = coverage?.statementCoverage ?? null;

          return (
            <div key={group.component}>
              {/* Component header row */}
              <button
                onClick={() => toggle(group.component)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50',
                  group.failed > 0 && 'bg-red-500/5 hover:bg-red-500/10',
                )}
              >
                <span className="text-xs text-muted-foreground w-4 shrink-0">
                  {isOpen ? '\u25BC' : '\u25B6'}
                </span>

                <span className={cn('font-mono text-sm font-medium shrink-0', colors.text)}>
                  &lt;{group.component}&gt;
                </span>

                {/* Dual progress bars */}
                <div className="flex-1 mx-2 space-y-1.5">
                  {/* Pass rate bar */}
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        passRate === 100 ? 'bar-pass' : passRate >= 80 ? 'bar-warn' : 'bar-fail',
                      )}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  {/* Coverage bar */}
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    {covPct !== null ? (
                      <div
                        className="h-full rounded-full bar-coverage transition-all duration-500"
                        style={{ width: `${covPct}%` }}
                      />
                    ) : (
                      <div
                        className="h-full rounded-full bg-white/[0.04]"
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs tabular-nums shrink-0">
                  <span className="text-muted-foreground">{group.tests.length} tests</span>
                  <span className="text-emerald-400">{group.passed} pass</span>
                  {group.failed > 0 && <span className="text-red-400">{group.failed} fail</span>}
                  {group.skipped > 0 && (
                    <span className="text-amber-400">{group.skipped} skip</span>
                  )}
                  <span className="text-muted-foreground w-16 text-right">
                    {formatDuration(group.totalDuration)}
                  </span>
                  {/* Pass rate + coverage percentages */}
                  <div className="flex flex-col items-end gap-0.5 w-14">
                    <span className="text-foreground font-medium leading-none">{passRate}%</span>
                    {covPct !== null ? (
                      <span className={cn('text-[10px] leading-none', coverageTextColor(covPct))}>
                        {covPct}% cov
                      </span>
                    ) : (
                      <span className="text-[10px] leading-none text-white/20">no cov</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded test rows */}
              {isOpen && (
                <div className="bg-secondary/20">
                  {group.tests
                    .sort((a, b) => {
                      // Failures first
                      if (a.status === 'fail' && b.status !== 'fail') return -1;
                      if (a.status !== 'fail' && b.status === 'fail') return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((test) => {
                      const { icon, color } = statusIcons[test.status];
                      const hasFailed = test.status === 'fail' && test.error;
                      const errorOpen = expandedErrors.has(test.fullName);

                      return (
                        <div key={test.fullName}>
                          <div
                            className={cn(
                              'flex items-center gap-3 pl-11 pr-4 py-2 border-t border-border/30',
                              hasFailed && 'cursor-pointer hover:bg-red-500/5',
                              test.status === 'fail' && 'bg-red-500/5',
                            )}
                            onClick={() => hasFailed && toggleError(test.fullName)}
                          >
                            <span
                              className={cn('font-mono text-sm w-5 text-center shrink-0', color)}
                            >
                              {icon}
                            </span>
                            <span
                              className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase"
                              style={{
                                backgroundColor: `${TEST_CATEGORY_META[test.category].color}15`,
                                color: TEST_CATEGORY_META[test.category].color,
                                border: `1px solid ${TEST_CATEGORY_META[test.category].color}25`,
                              }}
                            >
                              {TEST_CATEGORY_META[test.category].label}
                            </span>
                            <span className="flex-1 text-sm text-foreground truncate">
                              {test.name}
                            </span>
                            {hasFailed && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {errorOpen ? '\u25B4' : '\u25BE'}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0 w-16 text-right">
                              {formatDuration(test.duration)}
                            </span>
                          </div>
                          {errorOpen && test.error && (
                            <div className="pl-11 pr-4 py-2 bg-red-500/5 border-t border-border/30">
                              <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono overflow-x-auto max-h-48">
                                {test.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
