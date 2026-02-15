import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-blue-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

function getTrackColor(score: number): string {
  if (score >= 90) return "stroke-emerald-400/20";
  if (score >= 80) return "stroke-blue-400/20";
  if (score >= 70) return "stroke-amber-400/20";
  if (score >= 60) return "stroke-orange-400/20";
  return "stroke-red-400/20";
}

function getStrokeColor(score: number): string {
  if (score >= 90) return "stroke-emerald-400";
  if (score >= 80) return "stroke-blue-400";
  if (score >= 70) return "stroke-amber-400";
  if (score >= 60) return "stroke-orange-400";
  return "stroke-red-400";
}

const sizes = {
  sm: { outer: 48, stroke: 3, fontSize: "text-xs" },
  md: { outer: 72, stroke: 4, fontSize: "text-sm" },
  lg: { outer: 96, stroke: 5, fontSize: "text-lg" },
};

export function ScoreBadge({ score, size = "md", label }: ScoreBadgeProps) {
  const { outer, stroke, fontSize } = sizes[size];
  const radius = (outer - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={outer} height={outer} className="-rotate-90">
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={getTrackColor(score)}
        />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", getStrokeColor(score))}
        />
      </svg>
      <span className={cn("absolute font-bold tabular-nums", fontSize, getScoreColor(score))}>
        {score}
      </span>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium tabular-nums", getScoreColor(score))}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score >= 90 ? "bg-emerald-400" :
            score >= 80 ? "bg-blue-400" :
            score >= 70 ? "bg-amber-400" :
            score >= 60 ? "bg-orange-400" :
            "bg-red-400"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
