"use client";

import { cn } from "@/lib/utils";

interface TestResultRowProps {
  component: string;
  suite: string;
  test: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
  isNew?: boolean;
}

const componentColors: Record<string, string> = {
  "wc-alert": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "wc-badge": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "wc-button": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "wc-card": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "wc-checkbox": "bg-teal-500/15 text-teal-400 border-teal-500/30",
  "wc-container": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "wc-radio": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "wc-radio-group": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "wc-select": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "wc-switch": "bg-lime-500/15 text-lime-400 border-lime-500/30",
  "wc-text-input": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "wc-textarea": "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const statusIcons: Record<string, { icon: string; color: string }> = {
  pass: { icon: "\u2713", color: "text-emerald-400" },
  fail: { icon: "\u2717", color: "text-red-400" },
  skip: { icon: "\u2014", color: "text-amber-400" },
};

function formatDuration(ms: number): string {
  if (ms === 0) return "< 1ms";
  if (ms < 1) return `${(ms * 1000).toFixed(0)}\u00B5s`;
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function TestResultRow({
  component,
  test,
  status,
  duration,
  isNew,
}: TestResultRowProps) {
  const { icon, color } = statusIcons[status];
  const badgeColor = componentColors[component] ?? "bg-secondary text-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded text-sm",
        isNew && "animate-in fade-in slide-in-from-left-2 duration-300",
        status === "fail" && "bg-red-500/5"
      )}
    >
      <span className={cn("font-mono text-base w-5 text-center shrink-0", color)}>
        {icon}
      </span>

      <span
        className={cn(
          "shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium",
          badgeColor
        )}
      >
        {component}
      </span>

      <span className="flex-1 text-foreground truncate">{test}</span>

      <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0 w-20 text-right">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
