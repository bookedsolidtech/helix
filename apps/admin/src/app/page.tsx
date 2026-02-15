import Link from "next/link";
import { getManifestStats } from "@/lib/cem-parser";
import { scoreAllComponents } from "@/lib/health-scorer";
import { getAllTestResults } from "@/lib/test-results-reader";
import { tokenEntries, tokensByCategory } from "@helix/tokens";
import { getTokenStats } from "@helix/tokens/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Boxes,
  FileCheck2,
  Palette,
  ArrowRight,
  Activity,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export default async function DashboardPage() {
  const stats = getManifestStats();
  const healthScores = await scoreAllComponents();
  const testResults = getAllTestResults();
  const tokenStats = getTokenStats(tokenEntries);

  healthScores.sort((a, b) => a.tagName.localeCompare(b.tagName));

  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, h) => sum + h.overallScore, 0) / healthScores.length)
    : 0;
  const minHealth = healthScores.length > 0
    ? Math.min(...healthScores.map((h) => h.overallScore))
    : 0;
  const allGradesA = healthScores.every((h) => h.grade === "A");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          WC-2026 component library at a glance
        </p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Boxes className="w-4 h-4" />}
          label="Components"
          value={stats.totalComponents}
          sub={`${avgHealth}% avg health`}
          status={avgHealth >= 90 ? "success" : avgHealth >= 70 ? "warning" : "error"}
        />
        <KpiCard
          icon={<FileCheck2 className="w-4 h-4" />}
          label="Tests"
          value={testResults?.totalTests ?? 0}
          sub={testResults ? `${testResults.passRate}% pass rate` : "No results"}
          status={
            testResults
              ? testResults.passRate === 100 ? "success" : testResults.passRate >= 80 ? "warning" : "error"
              : "neutral"
          }
        />
        <KpiCard
          icon={<Palette className="w-4 h-4" />}
          label="Tokens"
          value={tokenEntries.length}
          sub={`${Object.keys(tokenStats.byCategory).length} categories`}
          status="success"
        />
        <KpiCard
          icon={<Activity className="w-4 h-4" />}
          label="API Surface"
          value={stats.totalProperties + stats.totalEvents + stats.totalCssProperties}
          sub={`${stats.totalProperties} props, ${stats.totalEvents} events`}
          status="neutral"
        />
      </div>

      {/* Three-column section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Components Section */}
        <SectionCard
          href="/components"
          icon={<Boxes className="w-5 h-5" />}
          title="Components"
          subtitle={`${stats.totalComponents} components`}
          accentColor="blue"
        >
          <div className="space-y-2.5">
            {healthScores.map((h) => (
              <div key={h.tagName} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-foreground truncate">
                  &lt;{h.tagName}&gt;
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        h.overallScore >= 90 ? "bg-emerald-400"
                          : h.overallScore >= 70 ? "bg-amber-400"
                            : "bg-red-400"
                      )}
                      style={{ width: `${h.overallScore}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-bold tabular-nums w-8 text-right",
                    h.grade === "A" ? "text-emerald-400"
                      : h.grade === "B" ? "text-blue-400"
                        : h.grade === "C" ? "text-amber-400"
                          : "text-red-400"
                  )}>
                    {h.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-3 mt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Avg: <span className="text-foreground font-medium">{avgHealth}%</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Min: <span className="text-foreground font-medium">{minHealth}%</span></span>
            </div>
            {allGradesA && (
              <span className="text-emerald-400 font-medium ml-auto">All A grades</span>
            )}
          </div>
        </SectionCard>

        {/* Tests Section */}
        <SectionCard
          href="/tests"
          icon={<FileCheck2 className="w-5 h-5" />}
          title="Tests"
          subtitle={testResults ? `${testResults.totalTests} tests` : "No results"}
          accentColor="emerald"
        >
          {testResults ? (
            <>
              <div className="space-y-2.5">
                {healthScores.map((h) => {
                  const comp = testResults.components.find((c) => c.component === h.tagName);
                  const total = comp?.total ?? 0;
                  const passRate = comp?.passRate ?? 0;
                  return (
                    <div key={h.tagName} className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-foreground truncate">
                        &lt;{h.tagName}&gt;
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {total}
                        </span>
                        <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                          {total > 0 && (
                            <div
                              className={cn(
                                "h-full rounded-full",
                                passRate === 100 ? "bg-emerald-400"
                                  : passRate >= 80 ? "bg-amber-400"
                                    : "bg-red-400"
                              )}
                              style={{ width: `${passRate}%` }}
                            />
                          )}
                        </div>
                        <span className={cn(
                          "text-xs font-bold tabular-nums w-10 text-right",
                          total === 0 ? "text-muted-foreground"
                            : passRate === 100 ? "text-emerald-400"
                              : passRate >= 80 ? "text-amber-400"
                                : "text-red-400"
                        )}>
                          {total > 0 ? `${passRate}%` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-3 mt-3 border-t border-border text-xs text-muted-foreground">
                <span className="text-emerald-400 font-medium">{testResults.totalPassed} passed</span>
                {testResults.totalFailed > 0 && (
                  <span className="text-red-400 font-medium">{testResults.totalFailed} failed</span>
                )}
                <span className="ml-auto tabular-nums">
                  {(testResults.totalDuration / 1000).toFixed(1)}s
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Run tests to see results
            </div>
          )}
        </SectionCard>

        {/* Tokens Section */}
        <SectionCard
          href="/tokens"
          icon={<Palette className="w-5 h-5" />}
          title="Tokens"
          subtitle={`${tokenEntries.length} tokens`}
          accentColor="purple"
        >
          <div className="space-y-2.5">
            {Object.entries(tokensByCategory)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([category, tokens]) => (
                <div key={category} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-foreground capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400"
                        style={{ width: `${(tokens.length / tokenEntries.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
                      {tokens.length}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex items-center gap-4 pt-3 mt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span><span className="text-foreground font-medium">{Object.keys(tokenStats.byCategory).length}</span> categories</span>
            </div>
            <span className="ml-auto">
              <span className="text-foreground font-medium">
                {tokenEntries.filter((t) => t.value.includes("var(")).length}
              </span> cross-refs
            </span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  status: "success" | "warning" | "error" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className={cn(
          "text-3xl font-bold tabular-nums",
          status === "success" && "text-emerald-400",
          status === "warning" && "text-amber-400",
          status === "error" && "text-red-400",
          status === "neutral" && "text-foreground",
        )}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  href,
  icon,
  title,
  subtitle,
  accentColor,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: "blue" | "emerald" | "purple";
  children: React.ReactNode;
}) {
  const borderHover = {
    blue: "hover:border-blue-500/30",
    emerald: "hover:border-emerald-500/30",
    purple: "hover:border-purple-500/30",
  };
  const iconColor = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    purple: "text-purple-400",
  };

  return (
    <Link href={href} className="block">
      <Card className={cn("transition-colors", borderHover[accentColor])}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={iconColor[accentColor]}>{icon}</span>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              View
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {children}
        </CardContent>
      </Card>
    </Link>
  );
}
