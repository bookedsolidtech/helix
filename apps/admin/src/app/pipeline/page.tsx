import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getAllComponents, getManifestStats } from "@/lib/cem-parser";
import { analyzeJsDoc, detectDrift } from "@/lib/jsdoc-analyzer";
import { getSourceInfo } from "@/lib/source-analyzer";
import { scoreComponent } from "@/lib/health-scorer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineFlow, ComponentPipelineRow } from "@/components/dashboard/PipelineFlow";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBreadcrumbItems } from "@/lib/breadcrumb-utils";

export default function PipelinePage() {
  const stats = getManifestStats();
  const components = getAllComponents();

  // Build pipeline status for each component
  const pipelineData = components.map((comp) => {
    const jsDoc = analyzeJsDoc(comp.tagName);
    const drift = detectDrift(comp.tagName);
    const source = getSourceInfo(comp.tagName);
    const health = scoreComponent(comp.tagName);

    return {
      tagName: comp.tagName,
      hasJsDoc: jsDoc !== null && jsDoc.coveragePercent > 0,
      inCem: true, // If we got here, it's in the CEM
      hasStory: source.hasStories,
      hasDocs: existsSync(resolve(process.cwd(), `../../apps/docs/src/content/docs/component-library/${comp.tagName}.mdx`)),
      driftCount: drift?.driftCount ?? 0,
      jsDocCoverage: jsDoc?.coveragePercent ?? 0,
      grade: (health?.grade ?? "F") as "A" | "B" | "C" | "D" | "F",
    };
  });

  // Aggregate pipeline health
  const totalWithJsDoc = pipelineData.filter((d) => d.hasJsDoc).length;
  const totalWithStory = pipelineData.filter((d) => d.hasStory).length;
  const totalWithDocs = pipelineData.filter((d) => d.hasDocs).length;
  const totalWithDrift = pipelineData.filter((d) => d.driftCount > 0).length;
  const totalDriftItems = pipelineData.reduce((sum, d) => sum + d.driftCount, 0);

  const pipelineNodes = [
    {
      label: "JSDoc Source",
      status: totalWithJsDoc === stats.totalComponents ? "healthy" as const : "warning" as const,
      count: totalWithJsDoc,
      detail: `${totalWithJsDoc}/${stats.totalComponents} documented`,
    },
    {
      label: "CEM Analyzer",
      status: "healthy" as const,
      count: stats.totalComponents,
      detail: `Schema v${stats.schemaVersion}`,
    },
    {
      label: "custom-elements.json",
      status: "healthy" as const,
      count: stats.totalProperties + stats.totalEvents + stats.totalSlots,
      detail: `${stats.totalProperties} props, ${stats.totalEvents} events`,
    },
    {
      label: "Storybook",
      status: totalWithStory === stats.totalComponents ? "healthy" as const : "warning" as const,
      count: totalWithStory,
      detail: `${totalWithStory}/${stats.totalComponents} stories`,
    },
    {
      label: "Docs Site",
      status: totalWithDocs === stats.totalComponents ? "healthy" as const : totalWithDocs > 0 ? "warning" as const : "error" as const,
      count: totalWithDocs,
      detail: `${totalWithDocs}/${stats.totalComponents} docs pages`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={getBreadcrumbItems('/pipeline')} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CEM Pipeline Observatory</h1>
        <p className="text-muted-foreground mt-1">
          JSDoc &rarr; CEM Analyzer &rarr; custom-elements.json &rarr; Consumers
        </p>
      </div>

      {/* Big Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Components" value={stats.totalComponents} trend="+100%" />
        <StatCard label="Properties" value={stats.totalProperties} trend="Documented" />
        <StatCard label="Events" value={stats.totalEvents} trend="Typed" />
        <StatCard label="CSS Parts" value={stats.totalCssParts} trend="Exposed" />
      </div>

      {/* Pipeline Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Flow</CardTitle>
          <CardDescription>End-to-end data flow from source annotations to consumer applications</CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineFlow nodes={pipelineNodes} />
        </CardContent>
      </Card>

      {/* Drift Summary */}
      <Card>
        <CardHeader>
          <CardTitle>
            Drift Detection
            {totalWithDrift === 0 ? (
              <Badge variant="success" className="ml-2">All in sync</Badge>
            ) : (
              <Badge variant="warning" className="ml-2">{totalDriftItems} issues across {totalWithDrift} components</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Comparing JSDoc annotations in source against CEM analyzer output
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalWithDrift === 0 ? (
            <p className="text-sm text-muted-foreground">
              All component JSDoc annotations match their CEM output. No intervention needed.
            </p>
          ) : (
            <p className="text-sm text-amber-400">
              {totalDriftItems} drift items detected. Review components below for details.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Per-Component Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Pipeline Status</CardTitle>
          <CardDescription>Per-component breakdown across the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Component</th>
                  <th className="text-center py-2 px-3">JSDoc</th>
                  <th className="text-center py-2 px-3">CEM</th>
                  <th className="text-center py-2 px-3">Story</th>
                  <th className="text-center py-2 px-3">Docs</th>
                  <th className="text-center py-2 px-3">Drift</th>
                </tr>
              </thead>
              <tbody>
                {pipelineData.map((row) => (
                  <ComponentPipelineRow
                    key={row.tagName}
                    tagName={row.tagName}
                    hasJsDoc={row.hasJsDoc}
                    inCem={row.inCem}
                    hasStory={row.hasStory}
                    hasDocs={row.hasDocs}
                    driftCount={row.driftCount}
                    grade={row.grade}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums text-primary">{value}</p>
          <p className="text-sm text-muted-foreground mt-2">{label}</p>
          {trend && <p className="text-xs text-emerald-400 mt-1">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
