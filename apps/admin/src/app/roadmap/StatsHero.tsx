'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, TrendingUp, Calendar, Users } from "lucide-react";
import type { PlatformReview } from "./page";

interface StatsHeroProps {
  review: PlatformReview;
}

export function StatsHero({ review }: StatsHeroProps) {
  const { summary, productionReadiness, reviewDate } = review;
  const isProductionReady = productionReadiness.verdict === "READY FOR PRODUCTION";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className={cn(
        "border-2",
        isProductionReady ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
      )}>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-background border border-border">
                  {isProductionReady ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Platform Health Assessment</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(reviewDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Badge
                  variant={isProductionReady ? "success" : "destructive"}
                  className="text-sm px-3 py-1 font-bold"
                >
                  {isProductionReady ? "✓ PRODUCTION READY" : "✗ NOT PRODUCTION READY"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Estimated Effort: <span className="font-medium text-foreground">{productionReadiness.estimatedEffortToProduction}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{Object.keys(review.agents).length}</span> agents deployed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Issues"
          value={summary.totalIssues}
          icon={<TrendingUp className="w-4 h-4" />}
          className="col-span-2 md:col-span-1"
        />
        <StatCard
          label="Critical"
          value={summary.byPriority.critical}
          severity="critical"
          description="v1.0 blockers"
        />
        <StatCard
          label="High"
          value={summary.byPriority.high}
          severity="high"
          description="Pre-production"
        />
        <StatCard
          label="Medium"
          value={summary.byPriority.medium}
          severity="medium"
          description="Polish"
        />
        <StatCard
          label="Low"
          value={summary.byPriority.low}
          severity="low"
          description="Nice-to-have"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  severity?: "critical" | "high" | "medium" | "low";
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

function StatCard({ label, value, severity, description, icon, className }: StatCardProps) {
  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case "critical": return "text-red-400 bg-red-400/10 border-red-400/30";
      case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
      case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
      case "low": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      default: return "text-foreground bg-secondary/50 border-border";
    }
  };

  const getSeverityEmoji = (sev?: string) => {
    switch (sev) {
      case "critical": return "🔴";
      case "high": return "🟠";
      case "medium": return "🟡";
      case "low": return "🔵";
      default: return "";
    }
  };

  return (
    <Card className={cn("border", className)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon || (severity && <span className="text-lg">{getSeverityEmoji(severity)}</span>)}
        </div>
        <div className={cn(
          "inline-flex items-center justify-center px-3 py-1.5 rounded-lg border font-bold text-2xl tabular-nums mb-2",
          getSeverityColor(severity)
        )}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
