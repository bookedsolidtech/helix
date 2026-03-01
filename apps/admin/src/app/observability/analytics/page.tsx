/**
 * Usage Analytics — Panopticon v2.
 * Shows popular and unused components across all consumer projects.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeUsageAnalytics } from '@/lib/usage-analytics';
import { getAllProjects } from '@/lib/projects-data';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function TrendIcon({ trend }: { trend: 'rising' | 'stable' | 'declining' }): React.JSX.Element {
  if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function AnalyticsPage(): React.JSX.Element {
  const analytics = computeUsageAnalytics();
  const projects = getAllProjects();
  const totalProjects = projects.length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/observability"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Observability Hub
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Component adoption and usage across {totalProjects} consumer projects.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalComponents}</p>
            <p className="text-xs text-muted-foreground mt-1">in @wc-2026/library</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Adoption Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.adoptionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.popularComponents.length} of {analytics.totalComponents} components in active use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unused Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.unusedComponents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              not used by any consumer project
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular components ranked list */}
      <Card>
        <CardHeader>
          <CardTitle>Component Usage Ranking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.popularComponents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage data available.</p>
          ) : (
            analytics.popularComponents.map((stat, idx) => {
              const barWidth = Math.round((stat.usageCount / totalProjects) * 100);
              return (
                <div key={stat.component} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5 text-right text-xs">
                        {idx + 1}.
                      </span>
                      <span className="font-mono font-medium">{stat.component}</span>
                      <TrendIcon trend={stat.trend} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {stat.usageCount} / {totalProjects} projects
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          stat.trend === 'rising' && 'text-green-400',
                          stat.trend === 'stable' && 'text-muted-foreground',
                          stat.trend === 'declining' && 'text-red-400',
                        )}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="ml-7 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500/70"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  {/* Projects list */}
                  <div className="ml-7 flex flex-wrap gap-1">
                    {stat.projects.map((proj) => (
                      <span
                        key={proj}
                        className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5"
                      >
                        {proj}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Unused components */}
      {analytics.unusedComponents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unused Components</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              These components exist in the library but are not used by any registered consumer project.
            </p>
            <div className="flex flex-wrap gap-2">
              {analytics.unusedComponents.map((component) => (
                <span
                  key={component}
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-mono bg-muted text-muted-foreground border border-border"
                >
                  {component}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
