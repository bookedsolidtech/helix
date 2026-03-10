import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  Wrench,
  FlaskConical,
  FileJson2,
  Server,
  Layers,
  Boxes,
} from 'lucide-react';
import { probeMcpServer } from '@/lib/mcp-probe';
import type {
  McpProbeStatus,
  McpSmokeTestResult,
  McpToolCategory,
  McpToolInfo,
  McpPhaseResult,
  CemComponentSummary,
  CemApiSurface,
} from '@/lib/mcp-probe';
import { mcpScoreAllComponents } from '@/lib/mcp-client';
import { scoreAllComponents } from '@/lib/health-scorer';
import { ScoreComparison } from '@/components/health/ScoreComparison';
import { cn } from '@/lib/utils';
import { McpRefreshButton } from './components/McpPageClient';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: McpProbeStatus }) {
  const config = {
    healthy: {
      label: 'Healthy',
      className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    degraded: {
      label: 'Degraded',
      className: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    },
    unreachable: {
      label: 'Unreachable',
      className: 'border-red-500/30 text-red-400 bg-red-500/10',
    },
  }[status];

  return (
    <Badge variant="outline" className={cn('text-xs font-semibold', config.className)}>
      {status === 'healthy' && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status === 'degraded' && <AlertTriangle className="w-3 h-3 mr-1" />}
      {status === 'unreachable' && <XCircle className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

function KpiCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={color}>{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function SmokeTestRow({ test }: { test: McpSmokeTestResult }) {
  const maxLatency = 1000;
  const barWidth = Math.min((test.latencyMs / maxLatency) * 100, 100);
  const hasArgs = Object.keys(test.args).length > 0;

  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium text-foreground">{test.tool}</code>
          <Badge
            variant="outline"
            className="text-[9px] font-medium border-white/[0.06] capitalize"
          >
            {test.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">{test.latencyMs}ms</span>
          {test.passed ? (
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
              Pass
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
              Fail
            </Badge>
          )}
        </div>
      </div>
      {hasArgs && (
        <div className="mb-2">
          <code className="text-[10px] text-muted-foreground font-mono">
            {JSON.stringify(test.args)}
          </code>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-white/[0.04] mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            test.passed ? 'bg-emerald-500/60' : 'bg-red-500/60',
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">{test.summary}</p>
      {test.error && <p className="text-xs text-red-400 mt-1">{test.error}</p>}
    </div>
  );
}

function ToolRow({ tool }: { tool: McpToolInfo }) {
  const allArgs = [...tool.requiredArgs, ...tool.optionalArgs];

  return (
    <div className="py-2 pl-4 border-l-2 border-white/[0.04] hover:border-blue-500/30 transition-colors">
      <div className="flex items-center gap-2 mb-0.5">
        <code className="text-xs font-mono font-medium text-foreground">{tool.name}</code>
        {allArgs.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">
            ({tool.requiredArgs.map((a) => a).join(', ')}
            {tool.optionalArgs.length > 0 && tool.requiredArgs.length > 0 ? ', ' : ''}
            {tool.optionalArgs.map((a) => `${a}?`).join(', ')})
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {tool.description}
      </p>
    </div>
  );
}

function CategoryRow({ category }: { category: McpToolCategory }) {
  const match = category.actualCount >= category.expectedCount;

  return (
    <div className="py-4 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground capitalize">{category.name}</span>
          <span
            className={cn(
              'text-xs tabular-nums font-medium',
              match ? 'text-emerald-400' : 'text-amber-400',
            )}
          >
            {category.actualCount}/{category.expectedCount}
          </span>
          {match ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
        </div>
      </div>
      {category.description && (
        <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
      )}
      <div className="space-y-1.5">
        {category.tools.map((tool) => (
          <ToolRow key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function ProbeTimeline({ phases, totalMs }: { phases: McpPhaseResult[]; totalMs: number }) {
  const passedCount = phases.filter((p) => p.passed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {passedCount}/{phases.length} phases passed
        </span>
        <span className="tabular-nums font-medium text-foreground">{totalMs}ms total</span>
      </div>
      {/* Segmented timeline bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.04] gap-px">
        {phases.map((phase) => {
          const pct = totalMs > 0 ? Math.max((phase.latencyMs / totalMs) * 100, 2) : 20;
          return (
            <div
              key={phase.name}
              className={cn(
                'h-full transition-all',
                phase.passed ? 'bg-emerald-500/70' : 'bg-red-500/70',
              )}
              style={{ width: `${pct}%` }}
              title={`${phase.name}: ${phase.latencyMs}ms`}
            />
          );
        })}
      </div>
      {/* Phase detail rows */}
      <div className="space-y-1.5">
        {phases.map((phase, i) => (
          <div key={phase.name} className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums">
              {i + 1}
            </span>
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                phase.passed ? 'bg-emerald-400' : 'bg-red-400',
              )}
            />
            <span className="text-xs text-foreground flex-1">{phase.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{phase.latencyMs}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSurfaceStat({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tabular-nums text-foreground">{count}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function ComponentSurfaceRow({ component }: { component: CemComponentSummary }) {
  const cells = [
    component.attributes,
    component.events,
    component.slots,
    component.cssProperties,
    component.cssParts,
    component.methods,
  ];
  const total = cells.reduce((a, b) => a + b, 0);

  return (
    <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      <td className="py-2 pr-3">
        <code className="text-xs font-mono font-medium text-foreground">{component.tagName}</code>
      </td>
      <td className="py-2 px-2 text-xs text-muted-foreground">{component.superclass}</td>
      {cells.map((count, i) => (
        <td key={i} className="py-2 px-2 text-center">
          <span
            className={cn(
              'text-xs tabular-nums',
              count > 0 ? 'text-foreground font-medium' : 'text-white/10',
            )}
          >
            {count}
          </span>
        </td>
      ))}
      <td className="py-2 pl-2 text-center">
        <span className="text-xs tabular-nums font-bold text-blue-400">{total}</span>
      </td>
    </tr>
  );
}

function CemDeepDive({
  cemExists,
  cemPath,
  cemAgeHours,
  cemSchemaVersion,
  cemComponentCount,
  cemSurface,
  cemComponents,
}: {
  cemExists: boolean;
  cemPath: string;
  cemAgeHours: number | null;
  cemSchemaVersion: string | null;
  cemComponentCount: number | null;
  cemSurface: CemApiSurface | null;
  cemComponents: CemComponentSummary[];
}) {
  const headers = ['Attrs', 'Events', 'Slots', 'CSS Props', 'CSS Parts', 'Methods'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="text-cyan-400">
            <FileJson2 className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <CardTitle className="text-base">CEM Deep Dive</CardTitle>
            <p className="text-xs text-muted-foreground">
              Custom Elements Manifest — {cemComponentCount ?? 0} components
              {cemSchemaVersion && ` · schema ${cemSchemaVersion}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cemExists ? (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-400"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Found
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                <XCircle className="w-3 h-3 mr-1" /> Missing
              </Badge>
            )}
            {cemAgeHours !== null && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {cemAgeHours < 1 ? `${Math.round(cemAgeHours * 60)}m old` : `${cemAgeHours}h old`}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!cemExists ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              CEM not found at{' '}
              <code className="text-xs font-mono">{cemPath.split('/').slice(-3).join('/')}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Run <code className="font-mono">npm run cem</code> to generate
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Surface totals */}
            {cemSurface && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    API Surface
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <ApiSurfaceStat label="Attributes" count={cemSurface.attributes} />
                  <ApiSurfaceStat label="Events" count={cemSurface.events} />
                  <ApiSurfaceStat label="Slots" count={cemSurface.slots} />
                  <ApiSurfaceStat label="CSS Props" count={cemSurface.cssProperties} />
                  <ApiSurfaceStat label="CSS Parts" count={cemSurface.cssParts} />
                  <ApiSurfaceStat label="Methods" count={cemSurface.methods} />
                </div>
              </div>
            )}

            {/* Per-component breakdown table */}
            {cemComponents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Component Breakdown
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({cemComponents.length} components)
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/[0.04]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                        <th className="py-2 pr-3 pl-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Component
                        </th>
                        <th className="py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Extends
                        </th>
                        {headers.map((h) => (
                          <th
                            key={h}
                            className="py-2 px-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                        <th className="py-2 pl-2 pr-3 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="pl-3">
                      {cemComponents.map((comp) => (
                        <ComponentSurfaceRow key={comp.tagName} component={comp} />
                      ))}
                    </tbody>
                    {cemSurface && (
                      <tfoot>
                        <tr className="bg-white/[0.03] border-t border-white/[0.06]">
                          <td className="py-2 pr-3 pl-3 text-xs font-bold text-foreground">
                            Totals
                          </td>
                          <td className="py-2 px-2" />
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.attributes}
                          </td>
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.events}
                          </td>
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.slots}
                          </td>
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.cssProperties}
                          </td>
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.cssParts}
                          </td>
                          <td className="py-2 px-2 text-center text-xs tabular-nums font-bold text-foreground">
                            {cemSurface.methods}
                          </td>
                          <td className="py-2 pl-2 pr-3 text-center text-xs tabular-nums font-bold text-blue-400">
                            {cemSurface.attributes +
                              cemSurface.events +
                              cemSurface.slots +
                              cemSurface.cssProperties +
                              cemSurface.cssParts +
                              cemSurface.methods}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* CEM file info */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-white/[0.04]">
              <span className="font-mono">{cemPath.split('/').slice(-3).join('/')}</span>
              {cemSchemaVersion && <span>Schema v{cemSchemaVersion}</span>}
              {cemAgeHours !== null && (
                <span>
                  Last modified{' '}
                  {cemAgeHours < 1
                    ? `${Math.round(cemAgeHours * 60)} minutes ago`
                    : `${cemAgeHours} hours ago`}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function McpPage() {
  const [result, adminScores, mcpScores] = await Promise.all([
    probeMcpServer(),
    scoreAllComponents(),
    mcpScoreAllComponents().catch(() => null),
  ]);

  const smokePassCount = result.smokeTests.filter((t) => t.passed).length;
  const smokePassRate =
    result.smokeTests.length > 0
      ? `${Math.round((smokePassCount / result.smokeTests.length) * 100)}%`
      : 'N/A';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Breadcrumb items={getBreadcrumbItems('/mcp')} />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">MCP Server Health</h1>
              <StatusBadge status={result.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              Live health probe of the wc-tools MCP server — {result.totalProbeMs}ms total
            </p>
          </div>
          <McpRefreshButton />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Cpu className="w-4 h-4" />}
          label="Binary"
          value={result.binaryExists ? 'Found' : 'Missing'}
          subtitle={result.binaryExists ? 'build/index.js' : 'Server not built'}
          color={result.binaryExists ? 'text-emerald-400' : 'text-red-400'}
        />
        <KpiCard
          icon={<Timer className="w-4 h-4" />}
          label="Startup"
          value={result.processStartupMs !== null ? `${result.processStartupMs}ms` : '—'}
          subtitle={
            result.handshakeLatencyMs !== null
              ? `${result.handshakeLatencyMs}ms handshake`
              : 'No connection'
          }
          color={result.processStartupMs !== null ? 'text-blue-400' : 'text-muted-foreground'}
        />
        <KpiCard
          icon={<Wrench className="w-4 h-4" />}
          label="Tools"
          value={`${result.totalTools}/${result.expectedTools}`}
          subtitle={
            result.totalTools >= result.expectedTools ? 'All tools registered' : 'Missing tools'
          }
          color={result.totalTools >= result.expectedTools ? 'text-emerald-400' : 'text-amber-400'}
        />
        <KpiCard
          icon={<FlaskConical className="w-4 h-4" />}
          label="Smoke Tests"
          value={smokePassRate}
          subtitle={`${smokePassCount}/${result.smokeTests.length} passed`}
          color={
            smokePassCount === result.smokeTests.length && result.smokeTests.length > 0
              ? 'text-emerald-400'
              : 'text-amber-400'
          }
        />
      </div>

      {/* Server Info + Probe Timeline side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Info */}
        {result.serverName && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <span className="text-purple-400">
                  <Server className="w-5 h-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Server Info</CardTitle>
                  <p className="text-xs text-muted-foreground">MCP handshake response</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="text-sm font-medium text-foreground">{result.serverName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Version</span>
                  <p className="text-sm font-medium text-foreground">
                    {result.serverVersion ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Handshake</span>
                  <p className="text-sm font-medium text-foreground">
                    {result.handshakeLatencyMs}ms
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Process Start</span>
                  <p className="text-sm font-medium text-foreground">{result.processStartupMs}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Probe Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400">
                <Timer className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base">Probe Timeline</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {result.phases.length} phases — {result.totalProbeMs}ms end-to-end
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProbeTimeline phases={result.phases} totalMs={result.totalProbeMs} />
          </CardContent>
        </Card>
      </div>

      {/* Smoke Tests — full width */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400">
              <FlaskConical className="w-5 h-5" />
            </span>
            <div>
              <CardTitle className="text-base">Smoke Tests</CardTitle>
              <p className="text-xs text-muted-foreground">
                {smokePassCount}/{result.smokeTests.length} passed across{' '}
                {new Set(result.smokeTests.map((t) => t.category)).size} categories
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.smokeTests.map((test) => (
              <SmokeTestRow key={test.tool} test={test} />
            ))}
          </div>
          {result.smokeTests.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No smoke tests ran — server unreachable
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tool Inventory — full width */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="text-blue-400">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <CardTitle className="text-base">Tool Inventory</CardTitle>
              <p className="text-xs text-muted-foreground">
                {result.categories.length} categories, {result.totalTools} tools — full API surface
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-white/[0.04]">
            {result.categories
              .sort((a, b) => b.actualCount - a.actualCount)
              .map((cat) => (
                <CategoryRow key={cat.name} category={cat} />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* CEM Deep Dive — full width */}
      <CemDeepDive
        cemExists={result.cemExists}
        cemPath={result.cemPath}
        cemAgeHours={result.cemAgeHours}
        cemSchemaVersion={result.cemSchemaVersion}
        cemComponentCount={result.cemComponentCount}
        cemSurface={result.cemSurface}
        cemComponents={result.cemComponents}
      />

      {/* Score Comparison: Admin (17-dim) vs MCP (CEM) */}
      <ScoreComparison adminScores={adminScores} mcpScores={mcpScores} />

      {/* Errors */}
      {result.errors.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base">Errors</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} during probe
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.errors.map((error, i) => (
                <div key={i} className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                  <p className="text-xs text-red-400 font-mono">{error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
