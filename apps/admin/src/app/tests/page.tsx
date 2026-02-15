import { Card, CardContent } from "@/components/ui/card";
import { getAllTestResults } from "@/lib/test-results-reader";
import { TestRunnerPanel } from "@/components/test-runner/TestRunnerPanel";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBreadcrumbItems } from "@/lib/breadcrumb-utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function TestTheaterPage() {
  const results = getAllTestResults();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Breadcrumb items={getBreadcrumbItems("/tests")} />
        <h1 className="text-2xl font-bold tracking-tight">Test Theater</h1>
        <p className="text-muted-foreground mt-1">
          Run and visualize component test results in real-time
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Tests"
          value={results?.totalTests ?? 0}
          subtext={results ? `${results.components.length} components` : "No results yet"}
        />
        <StatCard
          label="Pass Rate"
          value={results ? `${results.passRate}%` : "\u2014"}
          subtext={results ? `${results.totalPassed} passed` : "Run tests to see"}
          status={
            results
              ? results.passRate === 100
                ? "success"
                : results.passRate >= 80
                  ? "warning"
                  : "error"
              : "neutral"
          }
        />
        <StatCard
          label="Failed"
          value={results?.totalFailed ?? 0}
          subtext={results?.totalFailed === 0 ? "All passing" : "Needs attention"}
          status={
            results
              ? results.totalFailed === 0
                ? "success"
                : "error"
              : "neutral"
          }
        />
        <StatCard
          label="Duration"
          value={results ? `${(results.totalDuration / 1000).toFixed(1)}s` : "\u2014"}
          subtext={results ? new Date(results.timestamp).toLocaleDateString() : "Never run"}
        />
      </div>

      {/* Test Runner */}
      <TestRunnerPanel initialResults={results} />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  status = "neutral",
}: {
  label: string;
  value: string | number;
  subtext: string;
  status?: "success" | "warning" | "error" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums mt-1",
            status === "success" && "text-emerald-400",
            status === "warning" && "text-amber-400",
            status === "error" && "text-red-400",
            status === "neutral" && "text-foreground"
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}
