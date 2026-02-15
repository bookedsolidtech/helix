import { getManifestStats } from "@/lib/cem-parser";
import { scoreAllComponents } from "@/lib/health-scorer";
import { getTestResultsForComponent } from "@/lib/test-results-reader";
import { ComponentCard } from "@/components/dashboard/ComponentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBreadcrumbItems } from "@/lib/breadcrumb-utils";

export default async function ComponentsPage() {
  const stats = getManifestStats();
  const healthScores = (await scoreAllComponents()).sort((a, b) => a.tagName.localeCompare(b.tagName));
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, h) => sum + h.overallScore, 0) / healthScores.length)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems("/components")} />
        <h1 className="text-2xl font-bold tracking-tight">Components</h1>
        <p className="text-muted-foreground mt-1">
          Health scores and API coverage for {stats.totalComponents} components
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Components" value={stats.totalComponents} />
        <StatCard label="Avg Health" value={`${avgHealth}%`} />
        <StatCard label="Properties" value={stats.totalProperties} />
        <StatCard label="Events" value={stats.totalEvents} />
        <StatCard label="Slots" value={stats.totalSlots} />
        <StatCard label="CSS Props" value={stats.totalCssProperties} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthScores.map((health) => (
          <ComponentCard
            key={health.tagName}
            health={health}
            testSummary={getTestResultsForComponent(health.tagName)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
