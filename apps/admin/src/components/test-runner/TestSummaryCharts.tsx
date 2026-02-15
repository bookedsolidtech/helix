"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AllTestResults } from "@/lib/test-results-reader";

interface TestSummaryChartsProps {
  results: AllTestResults;
}

const DONUT_COLORS = {
  passed: "#34d399",
  failed: "#f87171",
  skipped: "#fbbf24",
};

const COMPONENT_COLORS: Record<string, { bar: string; text: string }> = {
  "wc-alert": { bar: "bg-rose-400", text: "text-rose-400" },
  "wc-badge": { bar: "bg-pink-400", text: "text-pink-400" },
  "wc-button": { bar: "bg-blue-400", text: "text-blue-400" },
  "wc-card": { bar: "bg-purple-400", text: "text-purple-400" },
  "wc-checkbox": { bar: "bg-teal-400", text: "text-teal-400" },
  "wc-container": { bar: "bg-sky-400", text: "text-sky-400" },
  "wc-radio": { bar: "bg-indigo-400", text: "text-indigo-400" },
  "wc-radio-group": { bar: "bg-violet-400", text: "text-violet-400" },
  "wc-select": { bar: "bg-cyan-400", text: "text-cyan-400" },
  "wc-switch": { bar: "bg-lime-400", text: "text-lime-400" },
  "wc-text-input": { bar: "bg-amber-400", text: "text-amber-400" },
  "wc-textarea": { bar: "bg-orange-400", text: "text-orange-400" },
};

const DEFAULT_COLOR = { bar: "bg-zinc-400", text: "text-zinc-400" };

function formatDuration(ms: number): string {
  if (ms < 1) return "< 1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TestSummaryCharts({ results }: TestSummaryChartsProps) {
  const donutData = [
    { name: "Passed", value: results.totalPassed, color: DONUT_COLORS.passed },
    { name: "Failed", value: results.totalFailed, color: DONUT_COLORS.failed },
    { name: "Skipped", value: results.totalSkipped, color: DONUT_COLORS.skipped },
  ].filter((d) => d.value > 0);

  const sorted = [...results.components].sort((a, b) => a.component.localeCompare(b.component));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
      {/* Donut Chart with center stat */}
      <div className="flex flex-col items-center gap-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Results
        </h4>
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {results.totalPassed}
            </span>
            <span className="text-[10px] text-muted-foreground">
              / {results.totalTests}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {donutData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-muted-foreground">
                {d.value} {d.name.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Component breakdown — scales to any count */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          By Component
        </h4>
        <div className="space-y-2">
          {sorted.map((comp) => {
            const colors = COMPONENT_COLORS[comp.component] ?? DEFAULT_COLOR;

            return (
              <div key={comp.component} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("font-mono text-sm font-medium", colors.text)}>
                    &lt;{comp.component}&gt;
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums shrink-0">
                    <span>{comp.total} tests</span>
                    <span className="text-emerald-400">{comp.passed} pass</span>
                    {comp.failed > 0 && (
                      <span className="text-red-400">{comp.failed} fail</span>
                    )}
                    <span>{formatDuration(comp.totalDuration)}</span>
                    <span className="text-foreground font-medium w-10 text-right">
                      {comp.passRate}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      comp.passRate === 100
                        ? "bar-pass"
                        : comp.passRate >= 80
                          ? "bar-warn"
                          : "bar-fail"
                    )}
                    style={{ width: `${comp.passRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
