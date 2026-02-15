"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TestResult } from "@/lib/test-results-reader";

interface TestResultsTableProps {
  tests: TestResult[];
  components: string[];
}

function formatDuration(ms: number): string {
  if (ms === 0) return "< 1ms";
  if (ms < 1) return `${(ms * 1000).toFixed(0)}\u00B5s`;
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const statusIcons: Record<string, { icon: string; color: string }> = {
  pass: { icon: "\u2713", color: "text-emerald-400" },
  fail: { icon: "\u2717", color: "text-red-400" },
  skip: { icon: "\u2014", color: "text-amber-400" },
};

const componentColors: Record<string, { bg: string; text: string; border: string }> = {
  "wc-alert": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  "wc-badge": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  "wc-button": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "wc-card": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  "wc-checkbox": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
  "wc-container": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  "wc-radio": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "wc-radio-group": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "wc-select": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  "wc-switch": { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
  "wc-text-input": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "wc-textarea": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

const defaultColor = { bg: "bg-secondary", text: "text-foreground", border: "border-border" };

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
      passed: componentTests.filter((t) => t.status === "pass").length,
      failed: componentTests.filter((t) => t.status === "fail").length,
      skipped: componentTests.filter((t) => t.status === "skip").length,
      totalDuration: componentTests.reduce((sum, t) => sum + t.duration, 0),
    }))
    .sort((a, b) => {
      // Failed components first, then alphabetical
      if (a.failed > 0 && b.failed === 0) return -1;
      if (a.failed === 0 && b.failed > 0) return 1;
      return a.component.localeCompare(b.component);
    });
}

export function TestResultsTable({ tests }: TestResultsTableProps) {
  const groups = groupByComponent(tests);

  // Auto-expand components with failures
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.failed > 0).map((g) => g.component))
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
          {groups.length} components, {tests.length} tests
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
          const passRate = group.tests.length > 0
            ? Math.round((group.passed / group.tests.length) * 100)
            : 0;

          return (
            <div key={group.component}>
              {/* Component header row */}
              <button
                onClick={() => toggle(group.component)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                  group.failed > 0 && "bg-red-500/5 hover:bg-red-500/10"
                )}
              >
                <span className="text-xs text-muted-foreground w-4 shrink-0">
                  {isOpen ? "\u25BC" : "\u25B6"}
                </span>

                <span className={cn("font-mono text-sm font-medium shrink-0", colors.text)}>
                  &lt;{group.component}&gt;
                </span>

                {/* Mini progress bar */}
                <div className="flex-1 mx-2">
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        passRate === 100
                          ? "bar-pass"
                          : passRate >= 80
                            ? "bar-warn"
                            : "bar-fail"
                      )}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs tabular-nums shrink-0">
                  <span className="text-emerald-400">{group.passed}</span>
                  {group.failed > 0 && (
                    <span className="text-red-400">{group.failed}</span>
                  )}
                  {group.skipped > 0 && (
                    <span className="text-amber-400">{group.skipped}</span>
                  )}
                  <span className="text-muted-foreground w-16 text-right">
                    {formatDuration(group.totalDuration)}
                  </span>
                  <span className="text-foreground font-medium w-10 text-right">
                    {passRate}%
                  </span>
                </div>
              </button>

              {/* Expanded test rows */}
              {isOpen && (
                <div className="bg-secondary/20">
                  {group.tests
                    .sort((a, b) => {
                      // Failures first
                      if (a.status === "fail" && b.status !== "fail") return -1;
                      if (a.status !== "fail" && b.status === "fail") return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((test) => {
                      const { icon, color } = statusIcons[test.status];
                      const hasFailed = test.status === "fail" && test.error;
                      const errorOpen = expandedErrors.has(test.fullName);

                      return (
                        <div key={test.fullName}>
                          <div
                            className={cn(
                              "flex items-center gap-3 pl-11 pr-4 py-2 border-t border-border/30",
                              hasFailed && "cursor-pointer hover:bg-red-500/5",
                              test.status === "fail" && "bg-red-500/5"
                            )}
                            onClick={() => hasFailed && toggleError(test.fullName)}
                          >
                            <span className={cn("font-mono text-sm w-5 text-center shrink-0", color)}>
                              {icon}
                            </span>
                            <span className="flex-1 text-sm text-foreground truncate">
                              {test.name}
                            </span>
                            {hasFailed && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {errorOpen ? "\u25B4" : "\u25BE"}
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
