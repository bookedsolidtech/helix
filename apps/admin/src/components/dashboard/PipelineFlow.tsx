import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileCode2,
  Cpu,
  FileJson2,
  BookOpen,
  Globe,
} from "lucide-react";

interface PipelineNode {
  label: string;
  status: "healthy" | "warning" | "error" | "unknown";
  count?: number;
  detail?: string;
}

interface PipelineFlowProps {
  nodes: PipelineNode[];
}

const nodeIcons = [FileCode2, Cpu, FileJson2, BookOpen, Globe];

const statusConfig = {
  healthy: {
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/20",
    ring: "ring-emerald-400/30",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]",
    iconBg: "bg-emerald-500/15",
    line: "from-emerald-500/60",
  },
  warning: {
    dot: "bg-amber-400",
    glow: "shadow-amber-500/20",
    ring: "ring-amber-400/30",
    text: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    iconBg: "bg-amber-500/15",
    line: "from-amber-500/60",
  },
  error: {
    dot: "bg-red-400",
    glow: "shadow-red-500/20",
    ring: "ring-red-400/30",
    text: "text-red-400",
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    iconBg: "bg-red-500/15",
    line: "from-red-500/60",
  },
  unknown: {
    dot: "bg-zinc-500",
    glow: "shadow-zinc-500/10",
    ring: "ring-zinc-500/20",
    text: "text-zinc-500",
    border: "border-zinc-700",
    bg: "bg-zinc-800/30",
    iconBg: "bg-zinc-700/30",
    line: "from-zinc-500/40",
  },
};

function PipelineNodeCard({
  node,
  index,
  isLast,
}: {
  node: PipelineNode;
  index: number;
  isLast: boolean;
}) {
  const Icon = nodeIcons[index] ?? FileCode2;
  const s = statusConfig[node.status];
  const isCenterpiece = index === 2; // custom-elements.json is the keystone

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-2xl border px-4 py-5 w-full",
          "transition-all duration-300 hover:scale-[1.03] hover:shadow-lg",
          s.border, s.bg,
          isCenterpiece && "shadow-lg",
          isCenterpiece && s.glow,
        )}
      >
        {/* Step number */}
        <div className="absolute -top-2.5 left-3">
          <span className={cn(
            "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
            "bg-card border", s.border, s.text,
          )}>
            {index + 1}
          </span>
        </div>

        {/* Icon with glow ring */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center ring-1",
            s.iconBg, s.text, s.ring,
            isCenterpiece && "w-12 h-12 rounded-2xl ring-2",
          )}
        >
          <Icon className={cn("w-5 h-5", isCenterpiece && "w-6 h-6")} />
        </div>

        {/* Label */}
        <span className={cn(
          "text-sm font-semibold text-foreground text-center leading-tight",
          isCenterpiece && "text-base",
        )}>
          {node.label}
        </span>

        {/* Status pill */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full",
          "bg-card/50 border", s.border,
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", s.text)}>
            {node.status}
          </span>
        </div>

        {/* Metrics */}
        <div className="flex flex-col items-center gap-0.5">
          {node.count !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {node.count} items
            </span>
          )}
          {node.detail && (
            <span className="text-[11px] text-muted-foreground/70 text-center">
              {node.detail}
            </span>
          )}
        </div>
      </div>

      {/* Connecting line */}
      {!isLast && (
        <div className="w-8 shrink-0 flex items-center justify-center relative">
          <div className={cn(
            "h-px w-full bg-gradient-to-r to-transparent",
            s.line,
          )} />
          <div className={cn(
            "absolute right-0 w-1.5 h-1.5 rounded-full",
            s.dot, "opacity-60",
          )} />
        </div>
      )}
    </div>
  );
}

export function PipelineFlow({ nodes }: PipelineFlowProps) {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-4 px-1 -my-4 -mx-1">
      {nodes.map((node, i) => (
        <PipelineNodeCard
          key={node.label}
          node={node}
          index={i}
          isLast={i === nodes.length - 1}
        />
      ))}
    </div>
  );
}

interface ComponentPipelineRowProps {
  tagName: string;
  hasJsDoc: boolean;
  inCem: boolean;
  hasStory: boolean;
  hasDocs: boolean;
  driftCount: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "B": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    case "C": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "D": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    default: return "text-red-400 bg-red-400/10 border-red-400/30";
  }
}

function getGradeTextColor(grade: string): string {
  switch (grade) {
    case "A": return "text-emerald-400";
    case "B": return "text-blue-400";
    case "C": return "text-amber-400";
    case "D": return "text-orange-400";
    default: return "text-red-400";
  }
}

export function ComponentPipelineRow({
  tagName,
  hasJsDoc,
  inCem,
  hasStory,
  hasDocs,
  driftCount,
  grade,
}: ComponentPipelineRowProps) {
  return (
    <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors">
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded border text-xs font-bold shrink-0",
            getGradeColor(grade)
          )}>
            {grade}
          </div>
          <Link
            href={`/components/${tagName}`}
            className={cn(
              "font-mono text-sm hover:underline transition-colors",
              getGradeTextColor(grade)
            )}
          >
            &lt;{tagName}&gt;
          </Link>
        </div>
      </td>
      <td className="py-2.5 px-3 text-center">
        <StatusDot healthy={hasJsDoc} />
      </td>
      <td className="py-2.5 px-3 text-center">
        <StatusDot healthy={inCem} />
      </td>
      <td className="py-2.5 px-3 text-center">
        <StatusDot healthy={hasStory} />
      </td>
      <td className="py-2.5 px-3 text-center">
        <StatusDot healthy={hasDocs} />
      </td>
      <td className="py-2.5 px-3 text-center">
        {driftCount === 0 ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            In sync
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {driftCount} drift
          </span>
        )}
      </td>
    </tr>
  );
}

function StatusDot({ healthy }: { healthy: boolean }) {
  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full mx-auto ring-2",
        healthy
          ? "bg-emerald-400 ring-emerald-400/20"
          : "bg-red-400 ring-red-400/20"
      )}
    />
  );
}
